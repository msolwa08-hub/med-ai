import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import { generateReferralLetter } from '../services/referral-letter.service.js';
import { generateSickNote } from '../services/sick-note.service.js';
import { generateLearningPoints } from '../services/learning-points.service.js';
import { emlLookup } from '../services/eml.service.js';

// ============================================================
// Schemas
// ============================================================

const ReferralLetterBodySchema = z.object({
  patientName: z.string().min(1),
  patientAge: z.string().min(1),
  patientGender: z.string().min(1),
  patientIdNumber: z.string().optional(),
  patientMedicalAid: z.string().optional(),
  referringDoctorName: z.string().min(1),
  referringDoctorHpcsa: z.string().min(1),
  referringPracticeName: z.string().min(1),
  referringPracticeAddress: z.string().optional(),
  referringPracticePhone: z.string().optional(),
  specialty: z.string().min(1),
  urgency: z.enum(['ROUTINE', 'URGENT', 'EMERGENCY']),
  clinicalSummary: z.string().min(1),
  diagnosis: z.string().min(1),
  icd10Code: z.string().optional(),
  reasonForReferral: z.string().min(1),
  currentMedications: z.string().optional(),
  relevantInvestigations: z.string().optional(),
  additionalNotes: z.string().optional(),
});

const SickNoteBodySchema = z.object({
  patientName: z.string().min(1),
  patientIdNumber: z.string().optional(),
  patientDateOfBirth: z.string().optional(),
  patientOccupation: z.string().optional(),
  doctorName: z.string().min(1),
  doctorHpcsa: z.string().min(1),
  practiceName: z.string().min(1),
  practiceAddress: z.string().optional(),
  diagnosisText: z.string().min(1),
  icd10Code: z.string().optional(),
  dateOfConsultation: z.string().min(1),
  unfitFromDate: z.string().min(1),
  unfitToDate: z.string().min(1),
  daysOff: z.number().int().positive(),
  fitnessStatement: z.string().optional(),
  additionalNotes: z.string().optional(),
});

const LearningPointsBodySchema = z.object({
  conditionName: z.string().min(1),
  icd10Code: z.string().min(1),
  category: z.string().min(1),
  firstLineTreatment: z.array(z.unknown()),
  investigations: z.array(z.unknown()),
  redFlags: z.string().optional(),
});

// ============================================================
// Route plugin
// ============================================================

export async function documentsRoutes(fastify: FastifyInstance): Promise<void> {
  // ----------------------------------------------------------
  // POST /doctor/documents/referral-letter — Generate referral letter (doctor only)
  // ----------------------------------------------------------
  fastify.post(
    '/doctor/documents/referral-letter',
    { preHandler: [authenticate, requireRole('DOCTOR')] },
    async (request, reply) => {
      try {
        const parsed = ReferralLetterBodySchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            success: false,
            error: 'Validation failed',
            details: parsed.error.flatten(),
          });
        }

        const letter = await generateReferralLetter(parsed.data);

        return reply.status(200).send({
          success: true,
          data: { letter },
        });
      } catch (err) {
        fastify.log.error(err, 'POST /doctor/documents/referral-letter error');
        return reply.status(500).send({
          success: false,
          error: 'Failed to generate referral letter.',
        });
      }
    }
  );

  // ----------------------------------------------------------
  // POST /doctor/documents/sick-note — Generate sick note (doctor only)
  // ----------------------------------------------------------
  fastify.post(
    '/doctor/documents/sick-note',
    { preHandler: [authenticate, requireRole('DOCTOR')] },
    async (request, reply) => {
      try {
        const parsed = SickNoteBodySchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            success: false,
            error: 'Validation failed',
            details: parsed.error.flatten(),
          });
        }

        const sickNote = await generateSickNote(parsed.data);

        return reply.status(200).send({
          success: true,
          data: { sickNote },
        });
      } catch (err) {
        fastify.log.error(err, 'POST /doctor/documents/sick-note error');
        return reply.status(500).send({
          success: false,
          error: 'Failed to generate sick note.',
        });
      }
    }
  );

  // ----------------------------------------------------------
  // POST /stg/learning-points — Generate clinical learning points (any authenticated user)
  // ----------------------------------------------------------
  fastify.post(
    '/stg/learning-points',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const parsed = LearningPointsBodySchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            success: false,
            error: 'Validation failed',
            details: parsed.error.flatten(),
          });
        }

        const learningPoints = await generateLearningPoints(parsed.data);

        return reply.status(200).send({
          success: true,
          data: { learningPoints },
        });
      } catch (err) {
        fastify.log.error(err, 'POST /stg/learning-points error');
        return reply.status(500).send({
          success: false,
          error: 'Failed to generate learning points.',
        });
      }
    }
  );

  // ── POST /eml/lookup ────────────────────────────────────────────────────────
  const EmlLookupSchema = z.object({
    medicineName: z.string().min(1).max(200),
    formulation: z.string().max(100).optional(),
  });

  fastify.post(
    '/eml/lookup',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const parsed = EmlLookupSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation failed',
          details: parsed.error.flatten(),
        });
      }
      const { medicineName, formulation } = parsed.data;
      try {
        const emlEntry = await emlLookup({ medicineName, formulation });
        return reply.send({
          success: true,
          data: { emlEntry },
        });
      } catch (err) {
        fastify.log.error(err, 'POST /eml/lookup error');
        return reply.status(500).send({
          success: false,
          error: 'Failed to look up EML entry.',
        });
      }
    }
  );
}
