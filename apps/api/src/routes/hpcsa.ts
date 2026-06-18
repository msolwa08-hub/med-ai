import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import { verifyHpcsaNumber, getHpcsaBoardType } from '../services/hpcsa.service.js';
import { auditLog } from '../services/audit.service.js';

// ============================================================
// Schemas
// ============================================================

const SubmitHpcsaSchema = z.object({
  hpcsaNumber: z.string().min(4).max(20).trim(),
});

const AdminUpdateSchema = z.object({
  hpcsaStatus: z.enum(['PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED']),
  rejectionReason: z.string().max(1000).optional(),
});

// ============================================================
// Route plugin
// ============================================================

export async function hpcsaRoutes(fastify: FastifyInstance): Promise<void> {
  // ----------------------------------------------------------
  // POST /hpcsa/verify — Doctor submits HPCSA number for verification
  // NOTE: Does NOT use requireRole — unverified doctors must be able to call this.
  // ----------------------------------------------------------
  fastify.post(
    '/hpcsa/verify',
    { preHandler: [authenticate] },
    async (request, reply) => {
      if (request.user!.role !== 'DOCTOR') {
        return reply.status(403).send({ success: false, error: 'Only doctors can submit HPCSA numbers.', code: 'FORBIDDEN' });
      }
      try {
        const userId = request.user!.sub;

        const parsed = SubmitHpcsaSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            success: false,
            error: 'Validation failed',
            details: parsed.error.flatten(),
          });
        }

        const { hpcsaNumber } = parsed.data;

        const doctor = await prisma.doctor.findUnique({
          where: { userId },
          select: { id: true, hpcsaNumber: true, hpcsaStatus: true },
        });

        if (!doctor) {
          return reply.status(404).send({
            success: false,
            error: 'Doctor profile not found.',
            code: 'DOCTOR_NOT_FOUND',
          });
        }

        // Don't re-verify if already verified
        if (doctor.hpcsaStatus === 'VERIFIED') {
          return reply.status(400).send({
            success: false,
            error: 'Your HPCSA registration is already verified.',
            code: 'ALREADY_VERIFIED',
          });
        }

        // Call HPCSA service (mock in dev, real API in production)
        const result = await verifyHpcsaNumber(hpcsaNumber);

        const boardType = getHpcsaBoardType(hpcsaNumber);
        const newStatus = result.valid ? 'VERIFIED' : 'REJECTED';

        await prisma.doctor.update({
          where: { id: doctor.id },
          data: {
            hpcsaNumber: hpcsaNumber.toUpperCase().trim(),
            hpcsaStatus: newStatus,
            hpcsaVerifiedAt: result.valid ? new Date() : null,
          },
        });

        await auditLog({
          userId,
          action: result.valid ? 'HPCSA_VERIFIED' : 'HPCSA_REJECTED',
          resource: 'Doctor',
          resourceId: doctor.id,
          metadata: {
            hpcsaNumber,
            boardType,
            result: result.valid ? 'approved' : result.error,
          },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        if (!result.valid) {
          return reply.status(400).send({
            success: false,
            error: result.error ?? 'HPCSA verification failed.',
            code: 'HPCSA_INVALID',
          });
        }

        return reply.send({
          success: true,
          data: {
            hpcsaStatus: 'VERIFIED',
            hpcsaNumber: hpcsaNumber.toUpperCase().trim(),
            boardType,
            practitionerName: result.name,
            specialization: result.specialization,
            registrationExpiry: result.expiryDate,
          },
          message: 'Your HPCSA registration has been verified. You now have full platform access.',
        });
      } catch (err) {
        fastify.log.error(err, 'POST /hpcsa/verify error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );

  // ----------------------------------------------------------
  // GET /hpcsa/status — Doctor checks their own HPCSA status
  // NOTE: Does NOT use requireRole — pending doctors need to check their status too.
  // ----------------------------------------------------------
  fastify.get(
    '/hpcsa/status',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const userId = request.user!.sub;

        if (request.user!.role !== 'DOCTOR') {
          return reply.status(403).send({ success: false, error: 'Only doctors can view HPCSA status.', code: 'FORBIDDEN' });
        }

        const doctor = await prisma.doctor.findUnique({
          where: { userId },
          select: {
            id: true,
            hpcsaNumber: true,
            hpcsaStatus: true,
            hpcsaVerifiedAt: true,
            firstName: true,
            lastName: true,
          },
        });

        if (!doctor) {
          return reply.status(404).send({
            success: false,
            error: 'Doctor profile not found.',
            code: 'DOCTOR_NOT_FOUND',
          });
        }

        const boardType = doctor.hpcsaNumber
          ? getHpcsaBoardType(doctor.hpcsaNumber)
          : null;

        return reply.send({
          success: true,
          data: {
            hpcsaNumber: doctor.hpcsaNumber,
            hpcsaStatus: doctor.hpcsaStatus,
            hpcsaVerifiedAt: doctor.hpcsaVerifiedAt,
            boardType,
            name: `Dr ${doctor.firstName} ${doctor.lastName}`,
            canPrescribe: doctor.hpcsaStatus === 'VERIFIED',
            canAccessPatients: doctor.hpcsaStatus === 'VERIFIED',
          },
        });
      } catch (err) {
        fastify.log.error(err, 'GET /hpcsa/status error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );

  // ----------------------------------------------------------
  // GET /hpcsa/check/:hpcsaNumber — Public lookup (no auth)
  // Allows patients to verify their doctor's credentials
  // ----------------------------------------------------------
  fastify.get(
    '/hpcsa/check/:hpcsaNumber',
    async (request, reply) => {
      try {
        const { hpcsaNumber } = request.params as { hpcsaNumber: string };

        if (!hpcsaNumber || hpcsaNumber.length < 4) {
          return reply.status(400).send({
            success: false,
            error: 'Invalid HPCSA number.',
          });
        }

        // Only return minimal public data — not full practitioner details
        const doctor = await prisma.doctor.findFirst({
          where: {
            hpcsaNumber: { equals: hpcsaNumber.toUpperCase().trim(), mode: 'insensitive' },
            hpcsaStatus: 'VERIFIED',
          },
          select: {
            firstName: true,
            lastName: true,
            doctorType: true,
            specialization: true,
            hpcsaStatus: true,
            hpcsaVerifiedAt: true,
          },
        });

        if (!doctor) {
          return reply.send({
            success: true,
            data: {
              found: false,
              hpcsaNumber: hpcsaNumber.toUpperCase(),
              message: 'No verified practitioner found with this HPCSA number on MedAI.',
            },
          });
        }

        return reply.send({
          success: true,
          data: {
            found: true,
            hpcsaNumber: hpcsaNumber.toUpperCase(),
            name: `Dr ${doctor.firstName} ${doctor.lastName}`,
            doctorType: doctor.doctorType,
            specialization: doctor.specialization,
            boardType: getHpcsaBoardType(hpcsaNumber),
            status: doctor.hpcsaStatus,
            verifiedAt: doctor.hpcsaVerifiedAt,
          },
        });
      } catch (err) {
        fastify.log.error(err, 'GET /hpcsa/check/:hpcsaNumber error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );

  // ----------------------------------------------------------
  // PUT /hpcsa/admin/:doctorId — Admin manually updates HPCSA status
  // ----------------------------------------------------------
  fastify.put(
    '/hpcsa/admin/:doctorId',
    { preHandler: [authenticate, requireRole('ADMIN')] },
    async (request, reply) => {
      try {
        const adminUserId = request.user!.sub;
        const { doctorId } = request.params as { doctorId: string };

        const parsed = AdminUpdateSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            success: false,
            error: 'Validation failed',
            details: parsed.error.flatten(),
          });
        }

        const { hpcsaStatus, rejectionReason } = parsed.data;

        const doctor = await prisma.doctor.findUnique({
          where: { id: doctorId },
          select: { id: true, userId: true, firstName: true, lastName: true, hpcsaNumber: true },
        });

        if (!doctor) {
          return reply.status(404).send({
            success: false,
            error: 'Doctor not found.',
            code: 'DOCTOR_NOT_FOUND',
          });
        }

        await prisma.doctor.update({
          where: { id: doctorId },
          data: {
            hpcsaStatus,
            hpcsaVerifiedAt: hpcsaStatus === 'VERIFIED' ? new Date() : null,
          },
        });

        await auditLog({
          userId: adminUserId,
          action: 'HPCSA_ADMIN_OVERRIDE',
          resource: 'Doctor',
          resourceId: doctorId,
          metadata: {
            doctorName: `${doctor.firstName} ${doctor.lastName}`,
            hpcsaNumber: doctor.hpcsaNumber,
            newStatus: hpcsaStatus,
            rejectionReason,
          },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        return reply.send({
          success: true,
          data: { doctorId, hpcsaStatus },
          message: `Doctor HPCSA status updated to ${hpcsaStatus}.`,
        });
      } catch (err) {
        fastify.log.error(err, 'PUT /hpcsa/admin/:doctorId error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );
}
