import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import { auditLog } from '../services/audit.service.js';
import { checkAiProcessingConsent, AI_CONSENT_ERROR } from '../lib/ai-consent.js';
import {
  encryptJSON,
  decryptJSON,
  encryptField,
  decryptField,
  decryptDataKey,
} from '../lib/encryption.js';
import {
  startAdaptiveMedicalHistorySession,
  continueAdaptiveMedicalHistorySession,
  extractAdaptiveStructuredHistory,
  type PatientContext,
  type PatientLiteracyLevel,
} from '../services/adaptive-ai-history.js';
import { generateDifferentialDiagnosis } from '../services/ai-medical-history.js';
import type { ConversationMessage, StructuredMedicalHistory } from '../types/index.js';
import { SA_LANGUAGES } from '../types/index.js';

// ============================================================
// Schemas
// ============================================================

const StartHistorySchema = z.object({
  consultationId: z.string().min(1),
  language: z.enum(SA_LANGUAGES as [string, ...string[]]).default('en'),
  practiceName: z.string().max(120).optional(),
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
 * Build PatientContext from the patient's DB record and consultation history.
 * Fetches doctor/practice name for AI persona branding.
 */
async function buildPatientContext(
  patientId: string,
  currentConsultationId: string,
  dateOfBirth: Date,
  gender: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY',
  doctorId?: string | null
): Promise<PatientContext> {
  const [lastConsultation, doctor] = await Promise.all([
    prisma.consultation.findFirst({
      where: {
        patientId,
        id: { not: currentConsultationId },
        status: { in: ['DOCTOR_REVIEW', 'EXAMINATION', 'MANAGEMENT', 'COMPLETED'] },
      },
      orderBy: { completedAt: 'desc' },
      select: { completedAt: true },
    }),
    doctorId
      ? prisma.doctor.findUnique({
          where: { id: doctorId },
          select: { firstName: true, lastName: true, specialization: true },
        })
      : null,
  ]);

  const isReviewConsultation = lastConsultation !== null;
  const lastVisitDays = lastConsultation?.completedAt
    ? Math.floor((Date.now() - lastConsultation.completedAt.getTime()) / 86_400_000)
    : undefined;

  const doctorName = doctor
    ? `Dr. ${doctor.firstName} ${doctor.lastName}`
    : undefined;

  return {
    age: calculateAge(dateOfBirth),
    gender,
    knownConditions: [],
    currentMedications: [],
    isSmoker: false,
    isReviewConsultation,
    lastVisitDays,
    doctorName,
  };
}

/**
 * Extract structured history, generate differential, and persist to DB.
 * Called from both /complete and auto-triggered on [HISTORY_COMPLETE].
 */
async function runCompletionFlow(
  consultationId: string,
  conversationHistory: ConversationMessage[],
  language: string,
  literacyLevel: PatientLiteracyLevel,
  dataKey: Buffer
): Promise<{
  structuredHistory: StructuredMedicalHistory;
  diagnoses: ReturnType<typeof generateDifferentialDiagnosis> extends Promise<infer T> ? T : never;
}> {
  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
    include: {
      patient: { select: { firstName: true, lastName: true, dateOfBirth: true, gender: true } },
    },
  });

  if (!consultation) throw new Error('Consultation not found');

  const patientAge = calculateAge(consultation.patient.dateOfBirth);
  const patientGender = consultation.patient.gender;
  const knownNames = [`${consultation.patient.firstName} ${consultation.patient.lastName}`];

  const structuredHistory = await extractAdaptiveStructuredHistory(
    conversationHistory,
    literacyLevel,
    knownNames
  );

  const diagnoses = await generateDifferentialDiagnosis(
    structuredHistory,
    patientAge,
    patientGender
  );

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
      ...(structuredHistory.clinicalScores
        ? { clinicalScores: encryptField(structuredHistory.clinicalScores, dataKey) }
        : {}),
      ...(structuredHistory.opportunisticFindings
        ? { opportunisticFindings: encryptField(structuredHistory.opportunisticFindings, dataKey) }
        : {}),
      ...(structuredHistory.redFlagsIdentified
        ? { redFlagsIdentified: encryptField(structuredHistory.redFlagsIdentified, dataKey) }
        : {}),
    },
  });

  await prisma.differentialDiagnosis.upsert({
    where: { consultationId },
    create: {
      consultationId,
      diagnoses: diagnoses as never,
      aiModel: 'claude-haiku-4-5',
    },
    update: {
      diagnoses: diagnoses as never,
      aiModel: 'claude-haiku-4-5',
      generatedAt: new Date(),
    },
  });

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

      const { consultationId, language, practiceName } = parsed.data;
      const userId = request.user!.sub;

      const consultation = await prisma.consultation.findUnique({
        where: { id: consultationId },
        include: {
          patient: {
            select: {
              id: true,
              userId: true,
              firstName: true,
              lastName: true,
              dateOfBirth: true,
              gender: true,
              literacy: { select: { level: true } },
            },
          },
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

      // POPIA: cross-border AI processing requires DATA_PROCESSING consent.
      const consentCheck = await checkAiProcessingConsent(consultation.patient.id, {
        userId,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      });
      if (!consentCheck.ok) {
        return reply.status(403).send(AI_CONSENT_ERROR);
      }

      const patientName = `${consultation.patient.firstName} ${consultation.patient.lastName}`;
      const initialLiteracy = (consultation.patient.literacy?.level ?? 'UNKNOWN') as PatientLiteracyLevel;

      const patientContext = await buildPatientContext(
        consultation.patient.id,
        consultationId,
        consultation.patient.dateOfBirth,
        consultation.patient.gender,
        consultation.doctorId
      );
      if (practiceName) patientContext.practiceName = practiceName;
      patientContext.patientName = patientName; // for free-text redaction only — never sent

      const aiResponse = await startAdaptiveMedicalHistorySession(
        consultationId,
        language as (typeof SA_LANGUAGES)[number],
        patientName,
        initialLiteracy,
        patientContext
      );

      const initialLog: ConversationMessage[] = [
        {
          role: 'assistant',
          content: aiResponse.message,
          timestamp: new Date().toISOString(),
        },
      ];

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
            literacyLevel: aiResponse.literacyLevel as never,
          },
        });
      } else {
        const emptyEncrypted = encryptField('', dataKey);
        await prisma.medicalHistory.create({
          data: {
            consultationId,
            language: language as never,
            literacyLevel: aiResponse.literacyLevel as never,
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
          literacyLevel: aiResponse.literacyLevel,
          redFlagDetected: aiResponse.redFlagDetected,
          suggestedFollowUp: aiResponse.suggestedFollowUp,
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

      const consultation = await prisma.consultation.findUnique({
        where: { id: consultationId },
        include: {
          patient: {
            select: {
              id: true,
              userId: true,
              firstName: true,
              lastName: true,
              dateOfBirth: true,
              gender: true,
            },
          },
          medicalHistory: {
            select: { aiConversationLog: true, language: true, literacyLevel: true },
          },
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

      // POPIA: cross-border AI processing requires DATA_PROCESSING consent.
      const consentCheck = await checkAiProcessingConsent(consultation.patient.id, {
        userId,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      });
      if (!consentCheck.ok) {
        return reply.status(403).send(AI_CONSENT_ERROR);
      }

      const dataKey = decryptDataKey(consultation.encryptedDataKey);
      const conversationHistory = decryptJSON(
        consultation.medicalHistory.aiConversationLog,
        dataKey
      ) as ConversationMessage[];

      const language = consultation.medicalHistory.language as (typeof SA_LANGUAGES)[number];
      const currentLiteracy = (consultation.medicalHistory.literacyLevel ?? 'UNKNOWN') as PatientLiteracyLevel;

      const patientContext = await buildPatientContext(
        consultation.patient.id,
        consultationId,
        consultation.patient.dateOfBirth,
        consultation.patient.gender,
        consultation.doctorId
      );
      patientContext.patientName = `${consultation.patient.firstName} ${consultation.patient.lastName}`;

      const patientEntry: ConversationMessage = {
        role: 'user',
        content: patientMessage,
        timestamp: new Date().toISOString(),
      };
      conversationHistory.push(patientEntry);

      const aiResponse = await continueAdaptiveMedicalHistorySession(
        conversationHistory,
        patientMessage,
        language,
        currentLiteracy,
        patientContext
      );

      const assistantEntry: ConversationMessage = {
        role: 'assistant',
        content: aiResponse.message,
        timestamp: new Date().toISOString(),
      };
      conversationHistory.push(assistantEntry);

      await prisma.medicalHistory.update({
        where: { consultationId },
        data: {
          aiConversationLog: encryptJSON(conversationHistory, dataKey),
          literacyLevel: aiResponse.literacyLevel as never,
        },
      });

      if (aiResponse.isComplete) {
        try {
          await runCompletionFlow(
            consultationId,
            conversationHistory,
            language,
            aiResponse.literacyLevel,
            dataKey
          );
        } catch (err) {
          console.error('[ai-history/continue] Completion flow failed:', err);
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
          literacyLevel: aiResponse.literacyLevel,
          redFlagDetected: aiResponse.redFlagDetected,
          suggestedFollowUp: aiResponse.suggestedFollowUp,
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

      const consultation = await prisma.consultation.findUnique({
        where: { id: consultationId },
        include: {
          patient: { select: { userId: true } },
          medicalHistory: {
            select: { aiConversationLog: true, language: true, literacyLevel: true },
          },
        },
      });

      if (!consultation) {
        return reply.status(404).send({ success: false, error: 'Consultation not found.' });
      }

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
      const literacyLevel = (consultation.medicalHistory.literacyLevel ?? 'UNKNOWN') as PatientLiteracyLevel;

      const { structuredHistory, diagnoses } = await runCompletionFlow(
        consultationId,
        conversationHistory,
        language,
        literacyLevel,
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
          clinicalScores: (history as never as Record<string, string>).clinicalScores
            ? decryptField((history as never as Record<string, string>).clinicalScores, dataKey)
            : undefined,
          opportunisticFindings: (history as never as Record<string, string>).opportunisticFindings
            ? decryptField((history as never as Record<string, string>).opportunisticFindings, dataKey)
            : undefined,
          redFlagsIdentified: (history as never as Record<string, string>).redFlagsIdentified
            ? decryptField((history as never as Record<string, string>).redFlagsIdentified, dataKey)
            : undefined,
        };
      } catch {
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
          literacyLevel: history.literacyLevel,
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
