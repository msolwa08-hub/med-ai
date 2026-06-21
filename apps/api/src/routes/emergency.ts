import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import crypto from 'crypto';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/authenticate.js';
import { auditLog } from '../services/audit.service.js';
import { encryptField, decryptField } from '../lib/encryption.js';

// ============================================================
// Schemas
// ============================================================

const UpdateEmergencyProfileSchema = z.object({
  bloodType: z
    .enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'UNKNOWN'])
    .optional(),
  allergies: z.string().max(5000).optional(),
  medications: z.string().max(5000).optional(),
  conditions: z.string().max(5000).optional(),
  emergencyContacts: z
    .array(
      z.object({
        name: z.string().min(1).max(200),
        phone: z.string().min(1).max(50),
        relationship: z.string().min(1).max(100),
      })
    )
    .max(5)
    .optional(),
  organDonor: z.boolean().optional(),
  isEnabled: z.boolean().optional(),
});

// ============================================================
// Helper: hash a token for storage (one-way, for lookup)
// ============================================================

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// ============================================================
// Route plugin
// ============================================================

export async function emergencyRoutes(fastify: FastifyInstance): Promise<void> {
  // ----------------------------------------------------------
  // GET /emergency/my-profile — Patient gets their own emergency profile
  // ----------------------------------------------------------
  fastify.get(
    '/emergency/my-profile',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const userId = request.user!.sub;

        if (request.user!.role !== 'PATIENT') {
          return reply.status(403).send({
            success: false,
            error: 'Only patients can access their emergency profile.',
            code: 'FORBIDDEN',
          });
        }

        const patient = await prisma.patient.findUnique({
          where: { userId },
          select: { id: true },
        });

        if (!patient) {
          return reply.status(404).send({
            success: false,
            error: 'Patient profile not found.',
            code: 'PATIENT_NOT_FOUND',
          });
        }

        const profile = await prisma.emergencyProfile.findUnique({
          where: { patientId: patient.id },
        });

        if (!profile) {
          return reply.send({
            success: true,
            data: { profile: null, message: 'No emergency profile set up yet.' },
          });
        }

        // Decrypt fields
        const decrypted = {
          id: profile.id,
          bloodType: profile.bloodType,
          allergies: profile.encryptedAllergies
            ? decryptField(profile.encryptedAllergies)
            : null,
          medications: profile.encryptedMedications
            ? decryptField(profile.encryptedMedications)
            : null,
          conditions: profile.encryptedConditions
            ? decryptField(profile.encryptedConditions)
            : null,
          emergencyContacts: profile.encryptedContacts
            ? JSON.parse(decryptField(profile.encryptedContacts))
            : null,
          organDonor: profile.organDonor,
          isEnabled: profile.isEnabled,
          hasQRToken: profile.emergencyAccessToken !== null,
          updatedAt: profile.updatedAt,
        };

        return reply.send({
          success: true,
          data: { profile: decrypted },
        });
      } catch (err) {
        fastify.log.error(err, 'GET /emergency/my-profile error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );

  // ----------------------------------------------------------
  // PUT /emergency/my-profile — Patient updates emergency profile
  // ----------------------------------------------------------
  fastify.put(
    '/emergency/my-profile',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const userId = request.user!.sub;

        if (request.user!.role !== 'PATIENT') {
          return reply.status(403).send({
            success: false,
            error: 'Only patients can update their emergency profile.',
            code: 'FORBIDDEN',
          });
        }

        const parsed = UpdateEmergencyProfileSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            success: false,
            error: 'Validation failed',
            details: parsed.error.flatten(),
          });
        }

        const data = parsed.data;

        const patient = await prisma.patient.findUnique({
          where: { userId },
          select: { id: true },
        });

        if (!patient) {
          return reply.status(404).send({
            success: false,
            error: 'Patient profile not found.',
            code: 'PATIENT_NOT_FOUND',
          });
        }

        const updateData: Record<string, unknown> = {};

        if (data.bloodType !== undefined) {
          updateData.bloodType = data.bloodType === 'UNKNOWN' ? null : data.bloodType;
        }
        if (data.allergies !== undefined) {
          updateData.encryptedAllergies = data.allergies
            ? encryptField(data.allergies)
            : null;
        }
        if (data.medications !== undefined) {
          updateData.encryptedMedications = data.medications
            ? encryptField(data.medications)
            : null;
        }
        if (data.conditions !== undefined) {
          updateData.encryptedConditions = data.conditions
            ? encryptField(data.conditions)
            : null;
        }
        if (data.emergencyContacts !== undefined) {
          updateData.encryptedContacts = data.emergencyContacts
            ? encryptField(JSON.stringify(data.emergencyContacts))
            : null;
        }
        if (data.organDonor !== undefined) {
          updateData.organDonor = data.organDonor;
        }
        if (data.isEnabled !== undefined) {
          updateData.isEnabled = data.isEnabled;
        }

        const profile = await prisma.emergencyProfile.upsert({
          where: { patientId: patient.id },
          create: {
            patientId: patient.id,
            ...updateData,
          },
          update: updateData,
        });

        await auditLog({
          userId,
          action: 'EMERGENCY_PROFILE_UPDATED',
          resource: 'EmergencyProfile',
          resourceId: profile.id,
          metadata: {
            patientId: patient.id,
            fieldsUpdated: Object.keys(updateData),
          },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        return reply.send({
          success: true,
          data: {
            profileId: profile.id,
            updatedAt: profile.updatedAt,
          },
          message: 'Emergency profile updated successfully.',
        });
      } catch (err) {
        fastify.log.error(err, 'PUT /emergency/my-profile error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );

  // ----------------------------------------------------------
  // POST /emergency/generate-qr — Generate emergency QR token
  // ----------------------------------------------------------
  fastify.post(
    '/emergency/generate-qr',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const userId = request.user!.sub;

        if (request.user!.role !== 'PATIENT') {
          return reply.status(403).send({
            success: false,
            error: 'Only patients can generate emergency QR codes.',
            code: 'FORBIDDEN',
          });
        }

        const patient = await prisma.patient.findUnique({
          where: { userId },
          select: { id: true },
        });

        if (!patient) {
          return reply.status(404).send({
            success: false,
            error: 'Patient profile not found.',
            code: 'PATIENT_NOT_FOUND',
          });
        }

        const profile = await prisma.emergencyProfile.findUnique({
          where: { patientId: patient.id },
        });

        if (!profile) {
          return reply.status(404).send({
            success: false,
            error: 'Please set up your emergency profile before generating a QR code.',
            code: 'PROFILE_NOT_FOUND',
          });
        }

        if (!profile.isEnabled) {
          return reply.status(400).send({
            success: false,
            error: 'Your emergency profile is disabled. Enable it before generating a QR code.',
            code: 'PROFILE_DISABLED',
          });
        }

        // Generate a cryptographically secure random token
        const rawToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = hashToken(rawToken);

        // Store the hashed token
        await prisma.emergencyProfile.update({
          where: { patientId: patient.id },
          data: { emergencyAccessToken: hashedToken },
        });

        await auditLog({
          userId,
          action: 'EMERGENCY_QR_GENERATED',
          resource: 'EmergencyProfile',
          resourceId: profile.id,
          metadata: { patientId: patient.id },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        // Return the raw token — the frontend will encode this into the QR
        // The QR should point to: /emergency/access/<rawToken>
        return reply.status(201).send({
          success: true,
          data: {
            token: rawToken,
            accessUrl: `/emergency/access/${rawToken}`,
          },
          message: 'Emergency QR token generated. Keep this token secure — it grants access to your emergency medical data.',
        });
      } catch (err) {
        fastify.log.error(err, 'POST /emergency/generate-qr error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );

  // ----------------------------------------------------------
  // GET /emergency/access/:token — PUBLIC endpoint (no auth)
  // Returns minimal emergency data for first responders
  // Rate limited per IP to prevent token enumeration
  // ----------------------------------------------------------
  fastify.get(
    '/emergency/access/:token',
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '1 minute',
          keyGenerator: (req) => req.ip,
        },
      },
    },
    async (request, reply) => {
      try {
        const { token } = request.params as { token: string };

        if (!token || token.length !== 64) {
          return reply.status(400).send({
            success: false,
            error: 'Invalid emergency access token.',
            code: 'INVALID_TOKEN',
          });
        }

        const hashedToken = hashToken(token);

        const profile = await prisma.emergencyProfile.findUnique({
          where: { emergencyAccessToken: hashedToken },
          include: {
            patient: {
              select: {
                firstName: true,
                lastName: true,
                dateOfBirth: true,
                gender: true,
              },
            },
          },
        });

        if (!profile) {
          return reply.status(404).send({
            success: false,
            error: 'Emergency profile not found or token is invalid.',
            code: 'NOT_FOUND',
          });
        }

        if (!profile.isEnabled) {
          return reply.status(403).send({
            success: false,
            error: 'This emergency profile has been disabled by the patient.',
            code: 'PROFILE_DISABLED',
          });
        }

        // Decrypt minimal emergency data for first responders
        const allergies = profile.encryptedAllergies
          ? (() => {
              try {
                return decryptField(profile.encryptedAllergies!);
              } catch {
                return null;
              }
            })()
          : null;

        const medications = profile.encryptedMedications
          ? (() => {
              try {
                return decryptField(profile.encryptedMedications!);
              } catch {
                return null;
              }
            })()
          : null;

        const conditions = profile.encryptedConditions
          ? (() => {
              try {
                return decryptField(profile.encryptedConditions!);
              } catch {
                return null;
              }
            })()
          : null;

        const emergencyContacts = profile.encryptedContacts
          ? (() => {
              try {
                return JSON.parse(decryptField(profile.encryptedContacts!));
              } catch {
                return null;
              }
            })()
          : null;

        const age = profile.patient
          ? Math.floor(
              (Date.now() - new Date(profile.patient.dateOfBirth).getTime()) /
                (365.25 * 24 * 60 * 60 * 1000)
            )
          : null;

        // Log the emergency access (no userId as this is a public endpoint)
        await auditLog({
          action: 'EMERGENCY_ACCESS',
          resource: 'EmergencyProfile',
          resourceId: profile.id,
          metadata: {
            patientId: profile.patientId,
            accessedAt: new Date().toISOString(),
          },
          ipAddress: (request as { ip?: string }).ip,
          userAgent: request.headers['user-agent'],
        });

        return reply.send({
          success: true,
          data: {
            patient: {
              firstName: profile.patient?.firstName ?? 'Unknown',
              lastName: profile.patient?.lastName ?? '',
              age,
              gender: profile.patient?.gender ?? null,
            },
            medical: {
              bloodType: profile.bloodType,
              allergies,
              currentMedications: medications,
              knownConditions: conditions,
              organDonor: profile.organDonor,
            },
            emergencyContacts,
            accessedAt: new Date().toISOString(),
            disclaimer:
              'This data is provided for emergency medical use only. Treat this patient immediately and contact emergency services. Data provided by MedAI Digital Health Platform.',
          },
        });
      } catch (err) {
        fastify.log.error(err, 'GET /emergency/access/:token error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );

  // ----------------------------------------------------------
  // POST /emergency/sync-from-consultation/:consultationId
  // Sync emergency profile from latest consultation data
  // ----------------------------------------------------------
  fastify.post(
    '/emergency/sync-from-consultation/:consultationId',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const userId = request.user!.sub;

        if (request.user!.role !== 'PATIENT') {
          return reply.status(403).send({
            success: false,
            error: 'Only patients can sync their emergency profile.',
            code: 'FORBIDDEN',
          });
        }

        const { consultationId } = request.params as { consultationId: string };

        const patient = await prisma.patient.findUnique({
          where: { userId },
          select: { id: true },
        });

        if (!patient) {
          return reply.status(404).send({
            success: false,
            error: 'Patient profile not found.',
            code: 'PATIENT_NOT_FOUND',
          });
        }

        const consultation = await prisma.consultation.findUnique({
          where: { id: consultationId },
          include: {
            medicalHistory: {
              select: {
                allergies: true,
                medications: true,
                pastMedicalHistory: true,
              },
            },
          },
        });

        if (!consultation) {
          return reply.status(404).send({
            success: false,
            error: 'Consultation not found.',
            code: 'NOT_FOUND',
          });
        }

        if (consultation.patientId !== patient.id) {
          return reply.status(403).send({
            success: false,
            error: 'This consultation does not belong to you.',
            code: 'FORBIDDEN',
          });
        }

        if (!consultation.medicalHistory) {
          return reply.status(404).send({
            success: false,
            error: 'No medical history recorded for this consultation.',
            code: 'NO_HISTORY',
          });
        }

        // Import decryptDataKey here to decrypt consultation fields
        const { decryptDataKey } = await import('../lib/encryption.js');
        const dataKey = decryptDataKey(consultation.encryptedDataKey);

        const mh = consultation.medicalHistory;

        let allergiesText: string | null = null;
        let medicationsText: string | null = null;
        let conditionsText: string | null = null;

        try {
          const raw = decryptField(mh.allergies, dataKey);
          allergiesText = raw !== 'Not yet recorded' ? raw : null;
        } catch { /* ignore */ }

        try {
          const raw = decryptField(mh.medications, dataKey);
          medicationsText = raw !== 'Not yet recorded' ? raw : null;
        } catch { /* ignore */ }

        try {
          const raw = decryptField(mh.pastMedicalHistory, dataKey);
          conditionsText = raw !== 'Not yet recorded' ? raw : null;
        } catch { /* ignore */ }

        const updateData: Record<string, string | null> = {};
        if (allergiesText !== null) {
          updateData.encryptedAllergies = encryptField(allergiesText);
        }
        if (medicationsText !== null) {
          updateData.encryptedMedications = encryptField(medicationsText);
        }
        if (conditionsText !== null) {
          updateData.encryptedConditions = encryptField(conditionsText);
        }

        const profile = await prisma.emergencyProfile.upsert({
          where: { patientId: patient.id },
          create: {
            patientId: patient.id,
            ...updateData,
          },
          update: updateData,
        });

        await auditLog({
          userId,
          action: 'EMERGENCY_PROFILE_SYNCED',
          resource: 'EmergencyProfile',
          resourceId: profile.id,
          metadata: {
            consultationId,
            patientId: patient.id,
            fieldsSync: Object.keys(updateData),
          },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        return reply.send({
          success: true,
          data: {
            profileId: profile.id,
            synced: Object.keys(updateData),
            updatedAt: profile.updatedAt,
          },
          message: `Emergency profile synced from consultation. Updated: ${Object.keys(updateData).join(', ') || 'no new data found'}.`,
        });
      } catch (err) {
        fastify.log.error(err, 'POST /emergency/sync-from-consultation/:consultationId error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );
}
