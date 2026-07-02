import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/authenticate.js';
import { decryptPhiJson } from '../lib/phi-json.js';
import { requireRole } from '../middleware/requireRole.js';
import { auditLog } from '../services/audit.service.js';
import { encryptField, decryptDataKey } from '../lib/encryption.js';
import type { DiagnosisEntry } from '../types/index.js';

// ============================================================
// Schemas
// ============================================================

const SelectDiagnosisSchema = z.object({
  selectedDiagnosis: z.string().min(1).max(500),
  icd10Code: z.string().max(20).optional(),
  additionalDiagnoses: z.array(z.string().min(1).max(500)).optional(),
  notes: z.string().max(5000).optional(),
});

// ============================================================
// Route plugin
// ============================================================

export async function diagnosisRoutes(fastify: FastifyInstance): Promise<void> {
  // ----------------------------------------------------------
  // GET /diagnosis/:consultationId
  // ----------------------------------------------------------
  fastify.get(
    '/diagnosis/:consultationId',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { consultationId } = request.params as { consultationId: string };
      const userId = request.user!.sub;
      const userRole = request.user!.role;

      const consultation = await prisma.consultation.findUnique({
        where: { id: consultationId },
        include: {
          patient: { select: { userId: true } },
          differentialDiagnosis: true,
        },
      });

      if (!consultation) {
        return reply.status(404).send({ success: false, error: 'Consultation not found.' });
      }

      // Access control: patient owns it OR assigned doctor
      const isOwner = consultation.patient.userId === userId;
      const isAssignedDoctor =
        userRole === 'DOCTOR' &&
        consultation.doctorId !== null &&
        (await prisma.doctor.findFirst({
          where: { userId, id: consultation.doctorId! },
        })) !== null;

      if (!isOwner && !isAssignedDoctor) {
        return reply.status(403).send({
          success: false,
          error: 'Access denied.',
          code: 'FORBIDDEN',
        });
      }

      if (!consultation.differentialDiagnosis) {
        return reply.status(404).send({
          success: false,
          error: 'Differential diagnosis not yet generated for this consultation.',
        });
      }

      const diff = consultation.differentialDiagnosis;

      await auditLog({
        userId,
        action: 'VIEW_DIFFERENTIAL_DIAGNOSIS',
        resource: 'DifferentialDiagnosis',
        resourceId: diff.id,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      });

      const diagnoses = decryptPhiJson<DiagnosisEntry[]>(
        diff.diagnoses,
        decryptDataKey(consultation.encryptedDataKey)
      );

      return reply.send({
        success: true,
        data: {
          diagnoses,
          doctorReviewed: diff.doctorReviewed,
          doctorSelectedDiagnosis: diff.doctorSelectedDiagnosis,
          doctorNotes: diff.doctorNotes,
          reviewedAt: diff.reviewedAt,
        },
      });
    }
  );

  // ----------------------------------------------------------
  // PUT /diagnosis/:consultationId/select
  // ----------------------------------------------------------
  fastify.put(
    '/diagnosis/:consultationId/select',
    { preHandler: [authenticate, requireRole('DOCTOR')] },
    async (request, reply) => {
      const { consultationId } = request.params as { consultationId: string };
      const parsed = SelectDiagnosisSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation failed',
          details: parsed.error.flatten(),
        });
      }

      const { selectedDiagnosis, icd10Code, additionalDiagnoses, notes } = parsed.data;
      const doctorUserId = request.user!.sub;

      // Verify doctor identity
      const doctor = await prisma.doctor.findUnique({
        where: { userId: doctorUserId },
        select: { id: true },
      });

      if (!doctor) {
        return reply.status(404).send({ success: false, error: 'Doctor profile not found.' });
      }

      const consultation = await prisma.consultation.findUnique({
        where: { id: consultationId },
        include: {
          differentialDiagnosis: true,
          managementPlan: { select: { id: true } },
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

      if (!consultation.differentialDiagnosis) {
        return reply.status(404).send({
          success: false,
          error: 'Differential diagnosis not found for this consultation.',
        });
      }

      const dataKey = decryptDataKey(consultation.encryptedDataKey);
      const reviewedAt = new Date();

      // Build the final selected diagnosis string (include ICD code if provided)
      const diagnosisWithCode = icd10Code
        ? `${selectedDiagnosis} (${icd10Code})`
        : selectedDiagnosis;

      // Build notes combining doctor notes and additional diagnoses
      const notesWithAddl = [
        notes ?? null,
        additionalDiagnoses && additionalDiagnoses.length > 0
          ? `Additional diagnoses: ${additionalDiagnoses.join('; ')}`
          : null,
      ]
        .filter(Boolean)
        .join('\n\n');

      // Update DifferentialDiagnosis
      const updated = await prisma.differentialDiagnosis.update({
        where: { consultationId },
        data: {
          doctorSelectedDiagnosis: diagnosisWithCode,
          doctorNotes: notesWithAddl || null,
          doctorReviewed: true,
          reviewedAt,
        },
      });

      // Encrypt the selected diagnosis for ManagementPlan
      const encryptedDiagnosis = encryptField(diagnosisWithCode, dataKey);

      // Upsert ManagementPlan.diagnosis
      if (consultation.managementPlan) {
        await prisma.managementPlan.update({
          where: { consultationId },
          data: { diagnosis: encryptedDiagnosis },
        });
      } else {
        // Create a skeleton ManagementPlan with just the diagnosis for now
        const emptyEncrypted = encryptField('', dataKey);
        await prisma.managementPlan.create({
          data: {
            consultationId,
            diagnosis: encryptedDiagnosis,
            medications: emptyEncrypted,
          },
        });
      }

      await auditLog({
        userId: doctorUserId,
        action: 'SELECT_DIAGNOSIS',
        resource: 'DifferentialDiagnosis',
        resourceId: updated.id,
        metadata: {
          consultationId,
          doctorId: doctor.id,
          selectedDiagnosis: diagnosisWithCode,
        },
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      });

      return reply.send({
        success: true,
        data: {
          id: updated.id,
          consultationId: updated.consultationId,
          diagnoses: decryptPhiJson<DiagnosisEntry[]>(updated.diagnoses, dataKey),
          doctorReviewed: updated.doctorReviewed,
          doctorSelectedDiagnosis: updated.doctorSelectedDiagnosis,
          doctorNotes: updated.doctorNotes,
          reviewedAt: updated.reviewedAt,
        },
      });
    }
  );
}
