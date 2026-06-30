import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import { auditLog } from '../services/audit.service.js';
import { encryptJSON, decryptJSON, decryptDataKey } from '../lib/encryption.js';
import { interpretUltrasound } from '../services/ultrasound-ai.js';

// ============================================================
// Schemas
// ============================================================

const InterpretUSSSchema = z.object({
  consultationId: z.string().min(1),
  reportText: z.string().min(10).max(10000),
  clinicalContext: z.string().max(2000).optional(),
  gestationalAge: z.string().max(50).optional(),
  isPregnant: z.boolean().optional(),
});

// ============================================================
// Route plugin
// ============================================================

export async function ultrasoundRoutes(fastify: FastifyInstance): Promise<void> {
  // ----------------------------------------------------------
  // POST /ultrasound/interpret
  // Interpret an ultrasound report with AI
  // ----------------------------------------------------------
  fastify.post(
    '/ultrasound/interpret',
    { preHandler: [authenticate, requireRole('DOCTOR')] },
    async (request, reply) => {
      const parsed = InterpretUSSSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation failed',
          details: parsed.error.flatten(),
        });
      }

      const { consultationId, reportText, clinicalContext, gestationalAge, isPregnant } =
        parsed.data;
      const doctorUserId = request.user!.sub;

      // Verify doctor
      const doctor = await prisma.doctor.findUnique({
        where: { userId: doctorUserId },
        select: { id: true },
      });
      if (!doctor) {
        return reply.status(404).send({ success: false, error: 'Doctor profile not found.' });
      }

      // Verify consultation access
      const consultation = await prisma.consultation.findUnique({
        where: { id: consultationId },
        select: {
          id: true,
          doctorId: true,
          encryptedDataKey: true,
          patient: {
            select: {
              dateOfBirth: true,
              gender: true,
            },
          },
        },
      });

      if (!consultation) {
        return reply.status(404).send({ success: false, error: 'Consultation not found.' });
      }
      if (consultation.doctorId !== doctor.id) {
        return reply.status(403).send({
          success: false,
          error: 'You are not the assigned doctor for this consultation.',
          code: 'FORBIDDEN',
        });
      }

      // Calculate patient age from DOB
      let patientAge: number | undefined;
      if (consultation.patient?.dateOfBirth) {
        const dob = new Date(consultation.patient.dateOfBirth);
        const today = new Date();
        patientAge = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) patientAge -= 1;
      }

      const patientGender = consultation.patient?.gender as 'MALE' | 'FEMALE' | undefined;

      try {
        const interpretation = await interpretUltrasound({
          reportText,
          clinicalContext,
          patientAge,
          patientGender,
          gestationalAge,
          isPregnant,
          consultationId,
        });

        // Store the interpreted report encrypted in the investigation record
        if (consultation.encryptedDataKey) {
          try {
            const dataKey = await decryptDataKey(consultation.encryptedDataKey);
            const encryptedResult = encryptJSON(
              {
                reportText,
                interpretation,
                interpretedAt: new Date().toISOString(),
                interpretedBy: 'MedAI USS AI',
              },
              dataKey
            );

            // Log as an investigation record
            await prisma.investigation.create({
              data: {
                consultationId,
                type: 'RADIOLOGY',
                name: `USS Interpretation — ${interpretation.categoryLabel}`,
                urgency: mapUrgencyToEnum(interpretation.urgency),
                encryptedResult,
                resultDate: new Date(),
                requestedBy: doctor.id,
              },
            });
          } catch {
            // Storage failure should not block returning the interpretation
          }
        }

        await auditLog({
          userId: doctorUserId,
          action: 'USS_INTERPRET',
          resource: 'Consultation',
          resourceId: consultationId,
          metadata: { category: interpretation.category, urgency: interpretation.urgency },
        });

        return reply.send({
          success: true,
          data: interpretation,
        });
      } catch (err) {
        fastify.log.error(err, 'USS interpretation failed');
        return reply.status(500).send({
          success: false,
          error: 'AI interpretation failed. Please try again or interpret manually.',
          code: 'AI_ERROR',
        });
      }
    }
  );

  // ----------------------------------------------------------
  // GET /ultrasound/results/:consultationId
  // List all USS interpretations for a consultation
  // ----------------------------------------------------------
  fastify.get(
    '/ultrasound/results/:consultationId',
    { preHandler: [authenticate, requireRole('DOCTOR')] },
    async (request, reply) => {
      const { consultationId } = request.params as { consultationId: string };
      const doctorUserId = request.user!.sub;

      const doctor = await prisma.doctor.findUnique({
        where: { userId: doctorUserId },
        select: { id: true },
      });
      if (!doctor) {
        return reply.status(404).send({ success: false, error: 'Doctor profile not found.' });
      }

      const consultation = await prisma.consultation.findUnique({
        where: { id: consultationId },
        select: { id: true, doctorId: true, encryptedDataKey: true },
      });

      if (!consultation || consultation.doctorId !== doctor.id) {
        return reply.status(404).send({ success: false, error: 'Consultation not found.' });
      }

      const investigations = await prisma.investigation.findMany({
        where: {
          consultationId,
          type: 'RADIOLOGY',
          name: { startsWith: 'USS Interpretation' },
        },
        orderBy: { createdAt: 'desc' },
      });

      const results = [];
      if (consultation.encryptedDataKey) {
        try {
          const dataKey = await decryptDataKey(consultation.encryptedDataKey);
          for (const inv of investigations) {
            if (inv.encryptedResult) {
              try {
                const decrypted = decryptJSON(inv.encryptedResult, dataKey) as Record<string, unknown>;
                results.push({
                  id: inv.id,
                  name: inv.name,
                  createdAt: inv.createdAt,
                  ...decrypted,
                });
              } catch {
                results.push({ id: inv.id, name: inv.name, createdAt: inv.createdAt });
              }
            }
          }
        } catch {
          // Return without decryption if key fails
        }
      }

      return reply.send({ success: true, data: results });
    }
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapUrgencyToEnum(urgency: string): 'ROUTINE' | 'URGENT' | 'STAT' {
  if (urgency === 'EMERGENCY') return 'STAT';
  if (urgency === 'URGENT' || urgency === 'SOON') return 'URGENT';
  return 'ROUTINE';
}
