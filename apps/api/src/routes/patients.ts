import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/authenticate.js';
import { auditLog } from '../services/audit.service.js';
import { encryptField, decryptField } from '../lib/encryption.js';
import { SA_LANGUAGES } from '../types/index.js';

// ============================================================
// Schemas
// ============================================================

const UpdatePatientSchema = z.object({
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
  preferredLanguage: z.enum(SA_LANGUAGES).optional(),
  emergencyContact: z
    .object({
      name: z.string().min(1),
      phone: z.string().min(10),
      relationship: z.string().min(1),
    })
    .optional(),
});

const ConsentSchema = z.object({
  doctorId: z.string().min(1),
  consentType: z.enum(['VIEW_HISTORY', 'TREATMENT', 'DATA_PROCESSING']),
  expiresAt: z.string().datetime().optional(),
});

// ============================================================
// Route plugin
// ============================================================

export async function patientRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /patients/me
  fastify.get(
    '/patients/me',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const userId = request.user!.sub;

        const patient = await prisma.patient.findUnique({
          where: { userId },
          include: {
            user: {
              select: { email: true, phone: true },
            },
          },
        });

        if (!patient) {
          return reply.status(404).send({
            success: false,
            error: 'Patient profile not found.',
            code: 'PATIENT_NOT_FOUND',
          });
        }

        // Decrypt sensitive fields if present
        let decryptedIdNumber: string | undefined;
        let decryptedEmergencyContact: unknown | undefined;

        if (patient.idNumber) {
          try {
            decryptedIdNumber = decryptField(patient.idNumber);
          } catch {
            decryptedIdNumber = undefined;
          }
        }

        if (patient.emergencyContact) {
          try {
            decryptedEmergencyContact = JSON.parse(
              decryptField(patient.emergencyContact)
            );
          } catch {
            decryptedEmergencyContact = undefined;
          }
        }

        return reply.send({
          success: true,
          data: {
            id: patient.id,
            firstName: patient.firstName,
            lastName: patient.lastName,
            dateOfBirth: patient.dateOfBirth,
            gender: patient.gender,
            preferredLanguage: patient.preferredLanguage,
            idNumber: decryptedIdNumber,
            emergencyContact: decryptedEmergencyContact,
            user: {
              email: patient.user.email,
              phone: patient.user.phone,
            },
          },
        });
      } catch (err) {
        fastify.log.error(err, 'GET /patients/me error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );

  // PUT /patients/me
  fastify.put(
    '/patients/me',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const userId = request.user!.sub;

        const parsed = UpdatePatientSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            success: false,
            error: 'Validation failed',
            details: parsed.error.flatten(),
          });
        }

        const { firstName, lastName, preferredLanguage, emergencyContact } =
          parsed.data;

        const patient = await prisma.patient.findUnique({ where: { userId } });
        if (!patient) {
          return reply.status(404).send({
            success: false,
            error: 'Patient profile not found.',
            code: 'PATIENT_NOT_FOUND',
          });
        }

        const updateData: Record<string, unknown> = {};
        if (firstName !== undefined) updateData.firstName = firstName;
        if (lastName !== undefined) updateData.lastName = lastName;
        if (preferredLanguage !== undefined)
          updateData.preferredLanguage = preferredLanguage;
        if (emergencyContact !== undefined) {
          updateData.emergencyContact = encryptField(
            JSON.stringify(emergencyContact)
          );
        }

        const updated = await prisma.patient.update({
          where: { userId },
          data: updateData as never,
          include: {
            user: { select: { email: true, phone: true } },
          },
        });

        await auditLog({
          userId,
          action: 'PATIENT_PROFILE_UPDATE',
          resource: 'Patient',
          resourceId: updated.id,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        return reply.send({
          success: true,
          data: {
            id: updated.id,
            firstName: updated.firstName,
            lastName: updated.lastName,
            dateOfBirth: updated.dateOfBirth,
            gender: updated.gender,
            preferredLanguage: updated.preferredLanguage,
            user: {
              email: updated.user.email,
              phone: updated.user.phone,
            },
          },
        });
      } catch (err) {
        fastify.log.error(err, 'PUT /patients/me error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );

  // GET /patients/me/consultations
  fastify.get(
    '/patients/me/consultations',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const userId = request.user!.sub;

        const patient = await prisma.patient.findUnique({ where: { userId } });
        if (!patient) {
          return reply.status(404).send({
            success: false,
            error: 'Patient profile not found.',
            code: 'PATIENT_NOT_FOUND',
          });
        }

        const query = request.query as Record<string, string>;
        const status = query.status;
        const limit = Math.min(parseInt(query.limit ?? '10', 10), 100);
        const offset = parseInt(query.offset ?? '0', 10);

        const validStatuses = [
          'HISTORY_TAKING',
          'DOCTOR_REVIEW',
          'EXAMINATION',
          'COMPLETED',
          'CANCELLED',
        ];

        const whereClause: Record<string, unknown> = { patientId: patient.id };
        if (status && validStatuses.includes(status)) {
          whereClause.status = status;
        }

        const consultations = await prisma.consultation.findMany({
          where: whereClause as never,
          skip: offset,
          take: limit,
          orderBy: { startedAt: 'desc' },
          select: {
            id: true,
            status: true,
            consultationType: true,
            startedAt: true,
            completedAt: true,
            doctor: {
              select: {
                firstName: true,
                lastName: true,
                doctorType: true,
              },
            },
          },
        });

        return reply.send({
          success: true,
          data: { consultations, limit, offset },
        });
      } catch (err) {
        fastify.log.error(err, 'GET /patients/me/consultations error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );

  // GET /patients/me/consents
  fastify.get(
    '/patients/me/consents',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const userId = request.user!.sub;

        const patient = await prisma.patient.findUnique({ where: { userId } });
        if (!patient) {
          return reply.status(404).send({
            success: false,
            error: 'Patient profile not found.',
            code: 'PATIENT_NOT_FOUND',
          });
        }

        const consents = await prisma.consentRecord.findMany({
          where: { patientId: patient.id },
          orderBy: { createdAt: 'desc' },
          include: {
            doctor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                doctorType: true,
                specialization: true,
              },
            },
          },
        });

        return reply.send({
          success: true,
          data: { consents },
        });
      } catch (err) {
        fastify.log.error(err, 'GET /patients/me/consents error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );

  // POST /patients/me/consents
  fastify.post(
    '/patients/me/consents',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const userId = request.user!.sub;

        const parsed = ConsentSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            success: false,
            error: 'Validation failed',
            details: parsed.error.flatten(),
          });
        }

        const { doctorId, consentType, expiresAt } = parsed.data;

        const patient = await prisma.patient.findUnique({ where: { userId } });
        if (!patient) {
          return reply.status(404).send({
            success: false,
            error: 'Patient profile not found.',
            code: 'PATIENT_NOT_FOUND',
          });
        }

        // Verify the doctor exists
        const doctor = await prisma.doctor.findUnique({
          where: { id: doctorId },
        });
        if (!doctor) {
          return reply.status(404).send({
            success: false,
            error: 'Doctor not found.',
            code: 'DOCTOR_NOT_FOUND',
          });
        }

        const consent = await prisma.consentRecord.create({
          data: {
            patientId: patient.id,
            doctorId,
            consentType: consentType as never,
            granted: true,
            expiresAt: expiresAt ? new Date(expiresAt) : undefined,
            ipAddress: request.ip,
          },
          include: {
            doctor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                doctorType: true,
              },
            },
          },
        });

        await auditLog({
          userId,
          action: 'CONSENT_GRANTED',
          resource: 'ConsentRecord',
          resourceId: consent.id,
          metadata: { doctorId, consentType },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        return reply.status(201).send({
          success: true,
          data: { consent },
        });
      } catch (err) {
        fastify.log.error(err, 'POST /patients/me/consents error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );

  // DELETE /patients/me/consents/:doctorId
  fastify.delete(
    '/patients/me/consents/:doctorId',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const userId = request.user!.sub;
        const { doctorId } = request.params as { doctorId: string };

        const patient = await prisma.patient.findUnique({ where: { userId } });
        if (!patient) {
          return reply.status(404).send({
            success: false,
            error: 'Patient profile not found.',
            code: 'PATIENT_NOT_FOUND',
          });
        }

        // Revoke all active consents for this doctor by setting granted: false
        await prisma.consentRecord.updateMany({
          where: {
            patientId: patient.id,
            doctorId,
            granted: true,
          },
          data: { granted: false },
        });

        // Create an explicit revocation record for audit trail
        const revocation = await prisma.consentRecord.create({
          data: {
            patientId: patient.id,
            doctorId,
            consentType: 'VIEW_HISTORY',
            granted: false,
            ipAddress: request.ip,
          },
        });

        await auditLog({
          userId,
          action: 'CONSENT_REVOKED',
          resource: 'ConsentRecord',
          resourceId: revocation.id,
          metadata: { doctorId },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        return reply.send({
          success: true,
          message: 'Consent revoked successfully.',
        });
      } catch (err) {
        fastify.log.error(err, 'DELETE /patients/me/consents/:doctorId error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );

  // ----------------------------------------------------------
  // GET /patients/me/problems — longitudinal ICD-10 problem list
  // ----------------------------------------------------------
  fastify.get(
    '/patients/me/problems',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const userId = request.user!.sub;
        const patient = await prisma.patient.findUnique({ where: { userId } });
        if (!patient) {
          return reply.status(404).send({
            success: false,
            error: 'Patient profile not found.',
            code: 'PATIENT_NOT_FOUND',
          });
        }

        const rows = await prisma.diagnosis.findMany({
          where: { patientId: patient.id },
          orderBy: { confirmedAt: 'desc' },
          take: 200,
          select: {
            id: true,
            icd10Code: true,
            label: true,
            isPrimary: true,
            status: true,
            confirmedAt: true,
            consultationId: true,
          },
        });

        // Collapse to the most recent entry per condition (code, else label)
        const seen = new Set<string>();
        const problems = rows.filter((d) => {
          const key = (d.icd10Code ?? d.label).toUpperCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        return reply.send({
          success: true,
          data: {
            problems,
            chronicCount: problems.filter((p) => p.status === 'CHRONIC').length,
          },
        });
      } catch (err) {
        fastify.log.error(err, 'GET /patients/me/problems error');
        return reply.status(500).send({ success: false, error: 'Internal server error.' });
      }
    }
  );
}
