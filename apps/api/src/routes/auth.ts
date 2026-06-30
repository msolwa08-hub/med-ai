import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { blacklistToken, isTokenBlacklisted } from '../lib/redis.js';
import { sendOtpSms, generateOtpCode, normalizePhone } from '../services/sms.service.js';
import { encryptPII } from '../services/encryption.service.js';
import { auditLog } from '../services/audit.service.js';
import { authenticate } from '../middleware/authenticate.js';
import { SA_LANGUAGES } from '../types/index.js';
import type { JwtPayload, AuthTokens } from '../types/index.js';
import { config } from '../config.js';

const BCRYPT_ROUNDS = 12;
const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

// ============================================================
// Schemas
// ============================================================

const RegisterPatientSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(10),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[0-9]/, 'Must contain a number'),
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']),
  preferredLanguage: z.enum(SA_LANGUAGES as [string, ...string[]]).default('en'),
  idNumber: z.string().optional(),
});

const RegisterDoctorSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(10),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[0-9]/, 'Must contain a number'),
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  hpcsaNumber: z.string().min(5).max(20),
  doctorType: z.enum(['GP', 'SPECIALIST', 'ALLIED_HEALTH', 'TRAVELLING']),
  specialization: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const RefreshSchema = z.object({
  refreshToken: z.string().min(1),
});

const SendOtpSchema = z.object({
  phone: z.string().min(10),
  purpose: z.enum(['LOGIN', 'REGISTER', 'RESET_PASSWORD', 'HPCSA_VERIFY']),
});

const VerifyOtpSchema = z.object({
  phone: z.string().min(10),
  code: z.string().length(6),
  purpose: z.enum(['LOGIN', 'REGISTER', 'RESET_PASSWORD', 'HPCSA_VERIFY']),
});

const ForgotPasswordSchema = z.object({
  phone: z.string().min(10),
});

const ResetPasswordSchema = z.object({
  phone: z.string().min(10),
  otp: z.string().length(6),
  newPassword: z.string().min(8),
});

// ============================================================
// Helpers
// ============================================================

function signTokens(
  fastify: FastifyInstance,
  payload: JwtPayload
): AuthTokens {
  const accessToken = fastify.jwt.sign(payload, {
    expiresIn: '7d',
  });

  const refreshToken = fastify.jwt.sign(
    { sub: payload.sub, type: 'refresh' },
    { expiresIn: '30d' }
  );

  return { accessToken, refreshToken, expiresIn: 7 * 24 * 60 * 60 };
}

// ============================================================
// Route plugin
// ============================================================

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  // POST /auth/register
  fastify.post('/auth/register', async (request, reply) => {
    const body = request.body as Record<string, unknown>;
    const role = (body.role as string) ?? 'PATIENT';

    if (role === 'DOCTOR') {
      // Doctor registration
      const data = RegisterDoctorSchema.safeParse(body);
      if (!data.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation failed',
          details: data.error.flatten(),
        });
      }

      const { email, phone, password, firstName, lastName, hpcsaNumber, doctorType, specialization } =
        data.data;

      // Check for existing user
      const existing = await prisma.user.findFirst({
        where: { OR: [{ email }, { phone: normalizePhone(phone) }] },
      });
      if (existing) {
        return reply.status(409).send({
          success: false,
          error: 'Email or phone number already registered.',
          code: 'USER_EXISTS',
        });
      }

      // Check HPCSA number uniqueness
      const existingHpcsa = await prisma.doctor.findUnique({
        where: { hpcsaNumber },
      });
      if (existingHpcsa) {
        return reply.status(409).send({
          success: false,
          error: 'HPCSA number already registered.',
          code: 'HPCSA_EXISTS',
        });
      }

      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      const normalizedPhone = normalizePhone(phone);

      const user = await prisma.user.create({
        data: {
          email,
          phone: normalizedPhone,
          passwordHash,
          role: 'DOCTOR',
          doctor: {
            create: {
              firstName,
              lastName,
              hpcsaNumber,
              doctorType: doctorType as never,
              specialization,
              hpcsaStatus: 'PENDING',
            },
          },
        },
        include: { doctor: true },
      });

      await auditLog({
        userId: user.id,
        action: 'DOCTOR_REGISTER',
        resource: 'User',
        resourceId: user.id,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      });

      const tokens = signTokens(fastify, { sub: user.id, role: 'DOCTOR' });

      return reply.status(201).send({
        success: true,
        data: {
          ...tokens,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            hpcsaStatus: user.doctor?.hpcsaStatus,
          },
        },
        message: 'Doctor registered. Please verify your HPCSA number to access patient data.',
      });
    }

    // Patient registration
    const data = RegisterPatientSchema.safeParse(body);
    if (!data.success) {
      return reply.status(400).send({
        success: false,
        error: 'Validation failed',
        details: data.error.flatten(),
      });
    }

    const {
      email,
      phone,
      password,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      preferredLanguage,
      idNumber,
    } = data.data;

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone: normalizePhone(phone) }] },
    });
    if (existing) {
      return reply.status(409).send({
        success: false,
        error: 'Email or phone number already registered.',
        code: 'USER_EXISTS',
      });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const normalizedPhone = normalizePhone(phone);

    const user = await prisma.user.create({
      data: {
        email,
        phone: normalizedPhone,
        passwordHash,
        role: 'PATIENT',
        patient: {
          create: {
            firstName,
            lastName,
            dateOfBirth: new Date(dateOfBirth),
            gender: gender as never,
            preferredLanguage: preferredLanguage as never,
            idNumber: idNumber ? encryptPII(idNumber) : undefined,
            consentVersion: 'v1.0',
          },
        },
      },
    });

    await auditLog({
      userId: user.id,
      action: 'PATIENT_REGISTER',
      resource: 'User',
      resourceId: user.id,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    const tokens = signTokens(fastify, { sub: user.id, role: 'PATIENT' });

    return reply.status(201).send({
      success: true,
      data: {
        ...tokens,
        user: { id: user.id, email: user.email, role: user.role },
      },
      message: 'Patient registered successfully.',
    });
  });

  // POST /auth/login
  fastify.post('/auth/login', async (request, reply) => {
    const parsed = LoginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: 'Validation failed',
        details: parsed.error.flatten(),
      });
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return reply.status(401).send({
        success: false,
        error: 'Invalid email or password.',
        code: 'INVALID_CREDENTIALS',
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      await auditLog({
        userId: user.id,
        action: 'LOGIN_FAILED',
        resource: 'User',
        resourceId: user.id,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      });

      return reply.status(401).send({
        success: false,
        error: 'Invalid email or password.',
        code: 'INVALID_CREDENTIALS',
      });
    }

    const tokens = signTokens(fastify, { sub: user.id, role: user.role });

    await auditLog({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      resource: 'User',
      resourceId: user.id,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return reply.send({
      success: true,
      data: {
        ...tokens,
        user: { id: user.id, email: user.email, role: user.role },
      },
    });
  });

  // POST /auth/refresh
  fastify.post('/auth/refresh', async (request, reply) => {
    const parsed = RefreshSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ success: false, error: 'refreshToken is required' });
    }

    try {
      const payload = fastify.jwt.verify<{ sub: string; type: string }>(
        parsed.data.refreshToken
      );

      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Check if blacklisted
      const blacklisted = await isTokenBlacklisted(parsed.data.refreshToken);
      if (blacklisted) {
        return reply.status(401).send({
          success: false,
          error: 'Refresh token revoked.',
          code: 'TOKEN_REVOKED',
        });
      }

      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) {
        return reply.status(401).send({ success: false, error: 'User not found' });
      }

      const tokens = signTokens(fastify, { sub: user.id, role: user.role });

      return reply.send({ success: true, data: tokens });
    } catch {
      return reply.status(401).send({
        success: false,
        error: 'Invalid or expired refresh token.',
        code: 'TOKEN_INVALID',
      });
    }
  });

  // POST /auth/logout
  fastify.post(
    '/auth/logout',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const token = request.headers.authorization?.replace('Bearer ', '');
      if (token) {
        // Blacklist for 7 days (access token TTL)
        await blacklistToken(token, 7 * 24 * 60 * 60);
      }

      await auditLog({
        userId: request.user?.sub,
        action: 'LOGOUT',
        resource: 'User',
        resourceId: request.user?.sub,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      });

      return reply.send({ success: true, message: 'Logged out successfully.' });
    }
  );

  // POST /auth/send-otp — strict rate limit: 5 per phone per 5 minutes
  fastify.post('/auth/send-otp', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '5 minutes',
        keyGenerator: (req) => {
          const body = req.body as Record<string, string> | undefined;
          return body?.phone ?? req.ip;
        },
      },
    },
  }, async (request, reply) => {
    const parsed = SendOtpSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: 'Validation failed',
        details: parsed.error.flatten(),
      });
    }

    const { phone, purpose } = parsed.data;
    const normalizedPhone = normalizePhone(phone);

    const user = await prisma.user.findUnique({ where: { phone: normalizedPhone } });

    // For REGISTER, user may not exist yet
    if (!user && purpose !== 'REGISTER') {
      // Return success anyway to prevent user enumeration
      return reply.send({
        success: true,
        message: 'If that number is registered, an OTP has been sent.',
      });
    }

    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    if (user) {
      // Invalidate old OTPs for this purpose
      await prisma.oTP.updateMany({
        where: {
          userId: user.id,
          purpose: purpose as never,
          usedAt: null,
        },
        data: { usedAt: new Date() },
      });

      await prisma.oTP.create({
        data: {
          userId: user.id,
          code,
          purpose: purpose as never,
          expiresAt,
        },
      });
    }

    await sendOtpSms(normalizedPhone, code, purpose);

    return reply.send({
      success: true,
      message: 'OTP sent. It expires in 10 minutes.',
    });
  });

  // POST /auth/verify-otp — strict rate limit: 10 per phone per 10 minutes
  fastify.post('/auth/verify-otp', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '10 minutes',
        keyGenerator: (req) => {
          const body = req.body as Record<string, string> | undefined;
          return body?.phone ?? req.ip;
        },
      },
    },
  }, async (request, reply) => {
    const parsed = VerifyOtpSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: 'Validation failed',
        details: parsed.error.flatten(),
      });
    }

    const { phone, code, purpose } = parsed.data;
    const normalizedPhone = normalizePhone(phone);

    const user = await prisma.user.findUnique({ where: { phone: normalizedPhone } });
    if (!user) {
      return reply.status(400).send({
        success: false,
        error: 'Invalid OTP.',
        code: 'OTP_INVALID',
      });
    }

    const otp = await prisma.oTP.findFirst({
      where: {
        userId: user.id,
        purpose: purpose as never,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { expiresAt: 'desc' },
    });

    if (!otp) {
      return reply.status(400).send({
        success: false,
        error: 'OTP not found or expired.',
        code: 'OTP_EXPIRED',
      });
    }

    // Increment attempts
    await prisma.oTP.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });

    if (otp.attempts >= MAX_OTP_ATTEMPTS) {
      await prisma.oTP.update({ where: { id: otp.id }, data: { usedAt: new Date() } });
      return reply.status(400).send({
        success: false,
        error: 'Too many attempts. Please request a new OTP.',
        code: 'OTP_ATTEMPTS_EXCEEDED',
      });
    }

    if (otp.code !== code) {
      return reply.status(400).send({
        success: false,
        error: 'Invalid OTP code.',
        code: 'OTP_INVALID',
      });
    }

    // Mark OTP as used
    await prisma.oTP.update({ where: { id: otp.id }, data: { usedAt: new Date() } });

    // Mark user as verified
    await prisma.user.update({ where: { id: user.id }, data: { isVerified: true } });

    const tokens = signTokens(fastify, { sub: user.id, role: user.role });

    return reply.send({
      success: true,
      data: {
        ...tokens,
        user: { id: user.id, email: user.email, role: user.role, isVerified: true },
      },
      message: 'OTP verified successfully.',
    });
  });

  // POST /auth/forgot-password — initiate password reset via OTP
  fastify.post('/auth/forgot-password', async (request, reply) => {
    const parsed = ForgotPasswordSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: 'Validation failed',
        details: parsed.error.flatten(),
      });
    }

    const normalizedPhone = normalizePhone(parsed.data.phone);
    const user = await prisma.user.findUnique({ where: { phone: normalizedPhone } });

    // Always return 200 — don't reveal whether the number is registered
    if (!user) {
      if (config.NODE_ENV !== 'production') {
        return reply.send({ success: true, data: { message: 'No account found for that number (dev mode).' } });
      }
      return reply.send({ success: true, data: { message: 'If this number is registered, an OTP has been sent.' } });
    }

    const otpCode = generateOtpCode();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Invalidate any existing unused RESET_PASSWORD OTPs for this user
    await prisma.oTP.updateMany({
      where: {
        userId: user.id,
        purpose: 'RESET_PASSWORD' as never,
        usedAt: null,
      },
      data: { usedAt: new Date() },
    });

    await prisma.oTP.create({
      data: {
        userId: user.id,
        code: otpCode,
        purpose: 'RESET_PASSWORD' as never,
        expiresAt,
      },
    });

    // In production, send via SMS (sendOtpSms handles Twilio)
    if (config.NODE_ENV === 'production') {
      await sendOtpSms(normalizedPhone, otpCode, 'RESET_PASSWORD');
      return reply.send({ success: true, data: { message: 'If this number is registered, an OTP has been sent.' } });
    }

    // Dev mode: log and return OTP in response for easy testing
    fastify.log.info({ phone: normalizedPhone, otpCode }, 'forgot-password OTP (dev mode)');
    return reply.send({ success: true, data: { otp: otpCode, message: 'OTP sent (dev mode)' } });
  });

  // POST /auth/reset-password — verify OTP and set new password
  fastify.post('/auth/reset-password', async (request, reply) => {
    const parsed = ResetPasswordSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: 'Validation failed',
        details: parsed.error.flatten(),
      });
    }

    const { otp: otpCode, newPassword } = parsed.data;
    const normalizedPhone = normalizePhone(parsed.data.phone);

    const user = await prisma.user.findUnique({ where: { phone: normalizedPhone } });
    if (!user) {
      return reply.status(400).send({
        success: false,
        error: 'Invalid or expired OTP.',
        code: 'INVALID_OTP',
      });
    }

    const otp = await prisma.oTP.findFirst({
      where: {
        userId: user.id,
        purpose: 'RESET_PASSWORD' as never,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { expiresAt: 'desc' },
    });

    if (!otp) {
      return reply.status(400).send({
        success: false,
        error: 'Invalid or expired OTP.',
        code: 'INVALID_OTP',
      });
    }

    // Increment attempts before checking code
    await prisma.oTP.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });

    if (otp.attempts >= MAX_OTP_ATTEMPTS) {
      await prisma.oTP.update({ where: { id: otp.id }, data: { usedAt: new Date() } });
      return reply.status(400).send({
        success: false,
        error: 'Too many attempts. Please request a new OTP.',
        code: 'OTP_ATTEMPTS_EXCEEDED',
      });
    }

    if (otp.code !== otpCode) {
      return reply.status(400).send({
        success: false,
        error: 'Invalid or expired OTP.',
        code: 'INVALID_OTP',
      });
    }

    const hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await prisma.user.update({
      where: { phone: normalizedPhone },
      data: { passwordHash: hash },
    });

    await prisma.oTP.update({
      where: { id: otp.id },
      data: { usedAt: new Date() },
    });

    await auditLog({
      userId: user.id,
      action: 'PASSWORD_RESET',
      resource: 'User',
      resourceId: user.id,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return reply.send({ success: true, data: { message: 'Password reset successfully.' } });
  });
}
