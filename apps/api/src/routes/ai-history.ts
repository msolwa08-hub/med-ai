import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import { auditLog } from '../services/audit.service.js';
import {
  encryptJSON,
  decryptJSON,
  encryptField,
  decryptField,
  decryptDataKey,
} from '../lib/encryption.js';
import {
  startMedicalHistorySession,
  continueMedicalHistorySession,
  extractStructuredHistory,
  generateDifferentialDiagnosis,
} from '../services/ai-medical-history.js';
import type { ConversationMessage, StructuredMedicalHistory } from '../types/index.js';
import { SA_LANGUAGES } from '../types/index.js';

// ============================================================
// Schemas
// ============================================================

const StartHistorySchema = z.object({
  consultationId: z.string().min(1),
  language: z.enum(SA_LANGUAGES as [string, ...string[]]).default('en'),
});

const ContinueHistorySchema = z.object({
  consultationId: z.string().min(1),
  patientMessage: z.string().min(1).max(5000),
});

const CompleteHistorySchema = z.object({
  consultationId: z.string().min(1),
});

const ConfirmHistorySchema = z.object({
  notes: z.string().max(5000).optional(),
  corrections: z.string().max(5000).optional(),
});

// ============================================================
// Helpers
// ============================================================

/**
 * Compute age in years from a Date of birth.
 */
function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age -= 1;
  }
  return age;
}

/**
 * Shared logic: extract structured history, generate differential, persist to DB.
 * Called both from the explicit /complete endpoint and auto-triggered when
 * continueMedicalHistorySession signals isComplete.
 */
async function runCompletionFlow(
  consultationId: string,
  conversationHistory: ConversationMessage[],
  language: string,
  dataKey: Buffer
): Promise<{
  structuredHistory: StructuredMedicalHistory;
  diagnoses: ReturnType<typeof generateDifferentialDiagnosis> extends Promise<infer T> ? T : never;
}> {
  // Fetch patient demographics for diagnosis generation
  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
    include: {
      patient: { select: { dateOfBirth: true, gender: true } },
    },
  });

  if (!consultation) {
    throw new Error('Consultation not found');
  }

  const patientAge = calculateAge(consultation.patient.dateOfBirth);
  const patientGender = consultation.patient.gender;

  // Extract structured history from conversation
  const structuredHistory = await extractStructuredHistory(conversationHistory);

  // Generate differential diagnosis
  const diagnoses = await generateDifferentialDiagnosis(
    structuredHistory,
    patientAge,
    patientGender
  );

  // Encrypt each field of structured history and save to MedicalHistory
  await prisma.medicalHistory.update({
    where: { consultationId },
    data: {
      chiefComplaint: encryptField(structuredHistory.chiefComplaint, dataKey),
      historyOfPresentIllness: encryptJSON(structuredHistory.historyOfPresentIllness, dataKey),
      pastMedicalHistory: encryptField(structuredHistory.pastMedicalHistory, dataKey),
      medications: encryptField(structuredHistory.medications, dataKey),
      allergies: encryptField(structuredHistory.allergies, dataKey),
      familyHistory: encryptField(structuredHistory.familyHistory, dataKey),
      socialHistory: encryptField(structuredHistory.socialHistory, dataKey),
      systemsReview: encryptField(structuredHistory.systemsReview, dataKey),
    },
  });

  // Upsert DifferentialDiagnosis record
  await prisma.differentialDiagnosis.upsert({
    where: { consultationId },
    create: {
      consultationId,
      diagnoses: diagnoses as never,
      aiModel: 'claude-sonnet-4-5',
    },
    update: {
      diagnoses: diagnoses as never,
      aiModel: 'claude-sonnet-4-5',
      generatedAt: new Date(),
    },
  });

  // Advance consultation status
  await prisma.consultation.update({
    where: { id: consultationId },
    data: { status: 'DOCTOR_REVIEW' },
  });

  return { structuredHistory, diagnoses } as never;
}

// ============================================================
// Route plugin
// ============================================================

export async function aiHistoryRoutes(fastify: FastifyInstance): Promise<void> {
  // ----------------------------------------------------------
  // POST /ai-history/start
  // ----------------------------------------------------------
  fastify.post(
    '/ai-history/start',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const parsed = StartHistorySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation failed',
          details: parsed.error.flatten(),
        });
      }

      const { consultationId, language } = parsed.data;
      const userId = request.user!.sub;

      // Verify consultation belongs to this patient
      const consultation = await prisma.consultation.findUnique({
        where: { id: consultationId },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true, userId: true } },
        },
      });

      if (!consultation) {
        return reply.status(404).send({ success: false, error: 'Consultation not found.' });
      }

      if (consultation.patient.userId !== userId) {
        return reply.status(403).send({
          success: false,
          error: 'Access denied. You do not own this consultation.',
          code: 'FORBIDDEN',
        });
      }

      const patientName = `${consultation.patient.firstName} ${consultation.patient.lastName}`;

      // Start AI session — returns first greeting message
      const aiResponse = await startMedicalHistorySession(
        consultationId,
        language as (typeof SA_LANGUAGES)[number],
        patientName
      );

      // Build initial conversation log with the AI's first message
      const initialLog: ConversationMessage[] = [
        {
          role: 'assistant',
          content: aiResponse.message,
          timestamp: new Date().toISOString(),
        },
      ];

      // Get or create MedicalHistory record, then store the initial AI message
      const existingHistory = await prisma.medicalHistory.findUnique({
        where: { consultationId },
      });

      const dataKey = decryptDataKey(consultation.encryptedDataKey);

      if (existingHistory) {
        await prisma.medicalHistory.update({
          where: { consultationId },
          data: {
            aiConversationLog: encryptJSON(initialLog, dataKey),
            language: language as never,
          },
        });
      } else {
        // Create placeholder-encrypted fields using an empty string placeholder
        const emptyEncrypted = encryptField('', dataKey);
        await prisma.medicalHistory.create({
          data: {
            consultationId,
            language: language as never,
            aiConversationLog: encryptJSON(initialLog, dataKey),
            chiefComplaint: emptyEncrypted,
            historyOfPresentIllness: emptyEncrypted,
            pastMedicalHistory: emptyEncrypted,
            medications: emptyEncrypted,
            allergies: emptyEncrypted,
            familyHistory: emptyEncrypted,
            socialHistory: emptyEncrypted,
            systemsReview: emptyEncrypted,
          },
        });
      }

      await auditLog({
        userId,
        action: 'AI_HISTORY_START',
        resource: 'Consultation',
        resourceId: consultationId,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      });

      return reply.send({
        success: true,
        data: {
          message: aiResponse.message,
          isComplete: aiResponse.isComplete,
        },
      });
    }
  );

  // ----------------------------------------------------------
  // POST /ai-history/continue
  // ----------------------------------------------------------
  fastify.post(
    '/ai-history/continue',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const parsed = ContinueHistorySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation failed',
          details: parsed.error.flatten(),
        });
      }

      const { consultationId, patientMessage } = parsed.data;
      const userId = request.user!.sub;

      // Fetch consultation + medical history
      const consultation = await prisma.consultation.findUnique({
        where: { id: consultationId },
        include: {
          patient: { select: { userId: true } },
          medicalHistory: { select: { aiConversationLog: true, language: true } },
        },
      });

      if (!consultation) {
        return reply.status(404).send({ success: false, error: 'Consultation not found.' });
      }

      if (consultation.patient.userId !== userId) {
        return reply.status(403).send({
          success: false,
          error: 'Access denied.',
          code: 'FORBIDDEN',
        });
      }

      if (!consultation.medicalHistory) {
        return reply.status(400).send({
          success: false,
          error: 'Medical history session has not been started. Call /ai-history/start first.',
        });
      }

      const dataKey = decryptDataKey(consultation.encryptedDataKey);

      // Decrypt existing conversation log
      const conversationHistory = decryptJSON(
        consultation.medicalHistory.aiConversationLog,
        dataKey
      ) as ConversationMessage[];

      const language = consultation.medicalHistory.language as (typeof SA_LANGUAGES)[number];

      // Append patient's message
      const patientEntry: ConversationMessage = {
        role: 'user',
        content: patientMessage,
        timestamp: new Date().toISOString(),
      };
      conversationHistory.push(patientEntry);

      // Get AI response
      const aiResponse = await continueMedicalHistorySession(
        conversationHistory,
        patientMessage,
        language
      );

      // Append AI response
      const assistantEntry: ConversationMessage = {
        role: 'assistant',
        content: aiResponse.message,
        timestamp: new Date().toISOString(),
      };
      conversationHistory.push(assistantEntry);

      // Re-encrypt and save updated conversation log
      await prisma.medicalHistory.update({
        where: { consultationId },
        data: {
          aiConversationLog: encryptJSON(conversationHistory, dataKey),
        },
      });

      // If AI signals completion, run the completion flow automatically
      if (aiResponse.isComplete) {
        try {
          await runCompletionFlow(consultationId, conversationHistory, language, dataKey);
        } catch (err) {
          console.error('[ai-history/continue] Completion flow failed:', err);
          // Don't surface the error — return what we have; doctor can trigger manually
        }
      }

      await auditLog({
        userId,
        action: 'AI_HISTORY_CONTINUE',
        resource: 'Consultation',
        resourceId: consultationId,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      });

      return reply.send({
        success: true,
        data: {
          message: aiResponse.message,
          isComplete: aiResponse.isComplete,
        },
      });
    }
  );

  // ----------------------------------------------------------
  // POST /ai-history/complete
  // ----------------------------------------------------------
  fastify.post(
    '/ai-history/complete',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const parsed = CompleteHistorySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation failed',
          details: parsed.error.flatten(),
        });
      }

      const { consultationId } = parsed.data;
      const userId = request.user!.sub;

      // Fetch consultation and medical history
      const consultation = await prisma.consultation.findUnique({
        where: { id: consultationId },
        include: {
          patient: { select: { userId: true } },
          medicalHistory: { select: { aiConversationLog: true, language: true } },
        },
      });

      if (!consultation) {
        return reply.status(404).send({ success: false, error: 'Consultation not found.' });
      }

      // Allow the owning patient or an assigned doctor to trigger completion
      const isPatient = consultation.patient.userId === userId;
      const isDoctor =
        request.user!.role === 'DOCTOR' && consultation.doctorId !== null;

      if (!isPatient && !isDoctor) {
        return reply.status(403).send({
          success: false,
          error: 'Access denied.',
          code: 'FORBIDDEN',
        });
      }

      if (!consultation.medicalHistory) {
        return reply.status(400).send({
          success: false,
          error: 'No medical history session found for this consultation.',
        });
      }

      const dataKey = decryptDataKey(consultation.encryptedDataKey);
      const conversationHistory = decryptJSON(
        consultation.medicalHistory.aiConversationLog,
        dataKey
      ) as ConversationMessage[];

      const language = consultation.medicalHistory.language;

      const { structuredHistory, diagnoses } = await runCompletionFlow(
        consultationId,
        conversationHistory,
        language,
        dataKey
      );

      await auditLog({
        userId,
        action: 'AI_HISTORY_COMPLETE',
        resource: 'Consultation',
        resourceId: consultationId,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      });

      return reply.send({
        success: true,
        data: { structuredHistory, diagnoses },
      });
    }
  );

  // ----------------------------------------------------------
  // GET /ai-history/:consultationId
  // ----------------------------------------------------------
  fastify.get(
    '/ai-history/:consultationId',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { consultationId } = request.params as { consultationId: string };
      const userId = request.user!.sub;
      const userRole = request.user!.role;

      const consultation = await prisma.consultation.findUnique({
        where: { id: consultationId },
        include: {
          patient: { select: { userId: true } },
          medicalHistory: true,
          differentialDiagnosis: true,
        },
      });

      if (!consultation) {
        return reply.status(404).send({ success: false, error: 'Consultation not found.' });
      }

      // Access control: patient owns it OR doctor is assigned
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

      if (!consultation.medicalHistory) {
        return reply.status(404).send({
          success: false,
          error: 'Medical history not found for this consultation.',
        });
      }

      const dataKey = decryptDataKey(consultation.encryptedDataKey);
      const history = consultation.medicalHistory;

      // Decrypt all structured history fields
      let structuredHistory: StructuredMedicalHistory | null = null;
      try {
        structuredHistory = {
          chiefComplaint: decryptField(history.chiefComplaint, dataKey),
          historyOfPresentIllness: decryptJSON(
            history.historyOfPresentIllness,
            dataKey
          ) as StructuredMedicalHistory['historyOfPresentIllness'],
          pastMedicalHistory: decryptField(history.pastMedicalHistory, dataKey),
          medications: decryptField(history.medications, dataKey),
          allergies: decryptField(history.allergies, dataKey),
          familyHistory: decryptField(history.familyHistory, dataKey),
          socialHistory: decryptField(history.socialHistory, dataKey),
          systemsReview: decryptField(history.systemsReview, dataKey),
        };
      } catch {
        // History may be in an initial state with empty placeholders
        structuredHistory = null;
      }

      const doctorNotes = history.doctorNotes
        ? decryptField(history.doctorNotes, dataKey)
        : null;

      await auditLog({
        userId,
        action: 'VIEW_MEDICAL_HISTORY',
        resource: 'MedicalHistory',
        resourceId: history.id,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      });

      return reply.send({
        success: true,
        data: {
          structuredHistory,
          diagnoses: consultation.differentialDiagnosis?.diagnoses ?? null,
          doctorConfirmed: history.doctorConfirmed,
          confirmedAt: history.confirmedAt,
          doctorNotes,
          language: history.language,
        },
      });
    }
  );

  // ----------------------------------------------------------
  // POST /ai-history/:consultationId/confirm
  // ----------------------------------------------------------
  fastify.post(
    '/ai-history/:consultationId/confirm',
    { preHandler: [authenticate, requireRole('DOCTOR')] },
    async (request, reply) => {
      const { consultationId } = request.params as { consultationId: string };
      const parsed = ConfirmHistorySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation failed',
          details: parsed.error.flatten(),
        });
      }

      const { notes, corrections } = parsed.data;
      const doctorUserId = request.user!.sub;

      // Look up the doctor record
      const doctor = await prisma.doctor.findUnique({
        where: { userId: doctorUserId },
        select: { id: true },
      });

      if (!doctor) {
        return reply.status(404).send({ success: false, error: 'Doctor profile not found.' });
      }

      const consultation = await prisma.consultation.findUnique({
        where: { id: consultationId },
        include: { medicalHistory: { select: { id: true } } },
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

      if (!consultation.medicalHistory) {
        return reply.status(400).send({
          success: false,
          error: 'Medical history not found for this consultation.',
        });
      }

      const dataKey = decryptDataKey(consultation.encryptedDataKey);
      const confirmedAt = new Date();

      // Build combined notes string (notes + corrections)
      const combinedNotes = [
        notes ? `Notes: ${notes}` : null,
        corrections ? `Corrections: ${corrections}` : null,
      ]
        .filter(Boolean)
        .join('\n\n');

      await prisma.medicalHistory.update({
        where: { consultationId },
        data: {
          doctorConfirmed: true,
          confirmedAt,
          doctorNotes: combinedNotes ? encryptField(combinedNotes, dataKey) : undefined,
        },
      });

      await prisma.differentialDiagnosis.update({
        where: { consultationId },
        data: {
          doctorReviewed: true,
          reviewedAt: confirmedAt,
        },
      });

      await prisma.consultation.update({
        where: { id: consultationId },
        data: { status: 'EXAMINATION' },
      });

      await auditLog({
        userId: doctorUserId,
        action: 'CONFIRM_MEDICAL_HISTORY',
        resource: 'MedicalHistory',
        resourceId: consultation.medicalHistory.id,
        metadata: { doctorId: doctor.id, consultationId },
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      });

      return reply.send({
        success: true,
        data: {
          confirmed: true,
          confirmedAt,
        },
      });
    }
  );
}
