import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/authenticate.js';
import { auditLog } from '../services/audit.service.js';
import {
  encryptJSON,
  encryptField,
  decryptJSON,
  decryptDataKey,
} from '../lib/encryption.js';
import {
  startOGHistorySession,
  continueOGHistorySession,
  extractOGHistory,
  detectOGMode,
  type OGMode,
  type OGPatientContext,
} from '../services/og-history.js';
import type { ConversationMessage } from '../types/index.js';
import { SA_LANGUAGES } from '../types/index.js';

// ============================================================
// Schemas
// ============================================================

const StartOGHistorySchema = z.object({
  consultationId: z.string().min(1),
  mode: z.enum(['OBSTETRIC', 'GYNAECOLOGICAL', 'UNKNOWN']).default('UNKNOWN'),
  language: z.enum(SA_LANGUAGES as unknown as [string, ...string[]]).default('en'),
  chiefComplaint: z.string().max(500).optional(),
  isPregnant: z.boolean().optional(),
  gestationalAge: z.string().max(50).optional(),
  gravida: z.number().int().min(0).max(20).optional(),
  para: z.number().int().min(0).max(20).optional(),
});

const ContinueOGHistorySchema = z.object({
  consultationId: z.string().min(1),
  patientMessage: z.string().min(1).max(5000),
});

const CompleteOGHistorySchema = z.object({
  consultationId: z.string().min(1),
});

// ============================================================
// In-memory session store (mirrors ai-history.ts pattern)
// ============================================================

interface OGSession {
  conversationHistory: ConversationMessage[];
  mode: OGMode;
  language: string;
  context: OGPatientContext;
  isComplete: boolean;
  redFlagDetected: boolean;
  startedAt: string;
}

const ogSessions = new Map<string, OGSession>();

// ============================================================
// Route plugin
// ============================================================

export async function ogHistoryRoutes(fastify: FastifyInstance): Promise<void> {
  // ----------------------------------------------------------
  // POST /og-history/start
  // ----------------------------------------------------------
  fastify.post(
    '/og-history/start',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const parsed = StartOGHistorySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation failed',
          details: parsed.error.flatten(),
        });
      }

      const {
        consultationId,
        mode: requestedMode,
        language,
        chiefComplaint,
        isPregnant,
        gestationalAge,
        gravida,
        para,
      } = parsed.data;

      const userId = request.user!.sub;

      // Verify the consultation exists and the user has access
      const consultation = await prisma.consultation.findUnique({
        where: { id: consultationId },
        select: {
          id: true,
          patientId: true,
          doctorId: true,
          patient: {
            select: {
              id: true,
              firstName: true,
              dateOfBirth: true,
              gender: true,
              userId: true,
            },
          },
          doctor: { select: { userId: true } },
        },
      });

      if (!consultation) {
        return reply.status(404).send({ success: false, error: 'Consultation not found.' });
      }

      const role = request.user!.role;
      if (
        role === 'PATIENT' && consultation.patient?.userId !== userId &&
        role === 'DOCTOR' && consultation.doctor?.userId !== userId
      ) {
        return reply.status(403).send({ success: false, error: 'Forbidden.', code: 'FORBIDDEN' });
      }

      // Calculate patient age
      const dob = consultation.patient?.dateOfBirth
        ? new Date(consultation.patient.dateOfBirth)
        : new Date('1990-01-01');
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const mDiff = today.getMonth() - dob.getMonth();
      if (mDiff < 0 || (mDiff === 0 && today.getDate() < dob.getDate())) age -= 1;

      const saLanguage = language as import('../types/index.js').SaLanguage;

      const context: OGPatientContext = {
        age,
        gravida,
        para,
        isPregnant,
        gestationalAge,
        language: saLanguage,
        knownConditions: [],
        currentMedications: [],
      };

      // Detect mode if not specified
      let resolvedMode = requestedMode as OGMode;
      if (resolvedMode === 'UNKNOWN' && chiefComplaint) {
        resolvedMode = await detectOGMode(chiefComplaint, age, isPregnant);
      }
      if (resolvedMode === 'UNKNOWN') {
        resolvedMode = isPregnant ? 'OBSTETRIC' : 'GYNAECOLOGICAL';
      }

      const patientName = consultation.patient?.firstName ?? 'there';

      const sessionResponse = await startOGHistorySession(
        resolvedMode,
        patientName,
        saLanguage,
        context
      );

      const ts = new Date().toISOString();
      // Store session in memory
      ogSessions.set(consultationId, {
        conversationHistory: [
          { role: 'assistant', content: sessionResponse.message, timestamp: ts },
        ],
        mode: resolvedMode,
        language: saLanguage,
        context,
        isComplete: sessionResponse.isComplete,
        redFlagDetected: sessionResponse.redFlagDetected,
        startedAt: new Date().toISOString(),
      });

      await auditLog({
        userId,
        action: 'OG_HISTORY_START',
        resource: 'Consultation',
        resourceId: consultationId,
        metadata: { mode: resolvedMode, language },
      });

      return reply.send({
        success: true,
        data: {
          message: sessionResponse.message,
          isComplete: sessionResponse.isComplete,
          mode: resolvedMode,
          redFlagDetected: sessionResponse.redFlagDetected,
          consultationId,
        },
      });
    }
  );

  // ----------------------------------------------------------
  // POST /og-history/continue
  // ----------------------------------------------------------
  fastify.post(
    '/og-history/continue',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const parsed = ContinueOGHistorySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation failed',
          details: parsed.error.flatten(),
        });
      }

      const { consultationId, patientMessage } = parsed.data;

      const session = ogSessions.get(consultationId);
      if (!session) {
        return reply.status(404).send({
          success: false,
          error: 'O&G session not found. Please start a new session.',
          code: 'SESSION_NOT_FOUND',
        });
      }

      if (session.isComplete) {
        return reply.status(400).send({
          success: false,
          error: 'This O&G history session is already complete.',
          code: 'SESSION_COMPLETE',
        });
      }

      // Add patient message to history
      session.conversationHistory.push({ role: 'user', content: patientMessage, timestamp: new Date().toISOString() });

      const saLanguage = session.language as import('../types/index.js').SaLanguage;

      const sessionResponse = await continueOGHistorySession(
        session.conversationHistory,
        patientMessage,
        session.mode,
        saLanguage,
        session.context
      );

      session.conversationHistory.push({ role: 'assistant', content: sessionResponse.message, timestamp: new Date().toISOString() });
      session.isComplete = sessionResponse.isComplete;
      if (sessionResponse.redFlagDetected) session.redFlagDetected = true;

      return reply.send({
        success: true,
        data: {
          message: sessionResponse.message,
          isComplete: sessionResponse.isComplete,
          mode: session.mode,
          redFlagDetected: sessionResponse.redFlagDetected,
          consultationId,
        },
      });
    }
  );

  // ----------------------------------------------------------
  // POST /og-history/complete
  // Extract structured history and save to consultation
  // ----------------------------------------------------------
  fastify.post(
    '/og-history/complete',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const parsed = CompleteOGHistorySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation failed',
          details: parsed.error.flatten(),
        });
      }

      const { consultationId } = parsed.data;
      const userId = request.user!.sub;

      const session = ogSessions.get(consultationId);
      if (!session) {
        return reply.status(404).send({
          success: false,
          error: 'O&G session not found.',
          code: 'SESSION_NOT_FOUND',
        });
      }

      const ogHistory = await extractOGHistory(
        session.conversationHistory,
        session.mode,
        session.context
      );

      // Store encrypted in MedicalHistory
      const consultation = await prisma.consultation.findUnique({
        where: { id: consultationId },
        select: { encryptedDataKey: true },
      });

      if (consultation?.encryptedDataKey) {
        try {
          const dataKey = await decryptDataKey(consultation.encryptedDataKey);

          // Build field values for MedicalHistory from O&G result
          const chiefComplaint = encryptField(
            ogHistory.mode === 'OBSTETRIC'
              ? ogHistory.obstetricHistory?.currentSymptoms ?? 'Obstetric consultation'
              : ogHistory.gynaeHistory?.chiefComplaint ?? 'Gynaecological consultation',
            dataKey
          );
          const historyOfPresentIllness = encryptJSON(
            ogHistory.mode === 'OBSTETRIC'
              ? {
                  onset: ogHistory.obstetricHistory?.lmp ?? 'N/A',
                  duration: ogHistory.obstetricHistory?.gestationalAge ?? 'N/A',
                  severity: 'See O&G history',
                  character: ogHistory.obstetricHistory?.currentSymptoms ?? 'N/A',
                }
              : {
                  onset: ogHistory.gynaeHistory?.lastMenstrualPeriod ?? 'N/A',
                  duration: ogHistory.gynaeHistory?.cycleLength ?? 'N/A',
                  severity: 'See O&G history',
                  character: ogHistory.gynaeHistory?.chiefComplaint ?? 'N/A',
                },
            dataKey
          );
          const ogSummaryEncrypted = encryptField(ogHistory.clinicalSummary, dataKey);
          const redFlagsEncrypted = ogHistory.redFlags.length > 0
            ? encryptField(ogHistory.redFlags.join('; '), dataKey)
            : null;
          const clinicalScoresEncrypted = encryptJSON(ogHistory, dataKey);
          const conversationLogEncrypted = encryptJSON(session.conversationHistory, dataKey);

          const emptyStr = encryptField('Not assessed', dataKey);

          await prisma.medicalHistory.upsert({
            where: { consultationId },
            update: {
              chiefComplaint,
              historyOfPresentIllness,
              systemsReview: ogSummaryEncrypted,
              clinicalScores: clinicalScoresEncrypted,
              redFlagsIdentified: redFlagsEncrypted ?? undefined,
              aiConversationLog: conversationLogEncrypted,
            },
            create: {
              consultationId,
              language: session.language as 'en',
              chiefComplaint,
              historyOfPresentIllness,
              pastMedicalHistory: emptyStr,
              medications: emptyStr,
              allergies: emptyStr,
              familyHistory: emptyStr,
              socialHistory: emptyStr,
              systemsReview: ogSummaryEncrypted,
              clinicalScores: clinicalScoresEncrypted,
              redFlagsIdentified: redFlagsEncrypted ?? undefined,
              aiConversationLog: conversationLogEncrypted,
            },
          });

          // Update consultation status
          await prisma.consultation.update({
            where: { id: consultationId },
            data: { status: 'DOCTOR_REVIEW' },
          });
        } catch (err) {
          fastify.log.warn(err, 'Failed to encrypt/save O&G history');
        }
      }

      // Clean up session
      ogSessions.delete(consultationId);

      await auditLog({
        userId,
        action: 'OG_HISTORY_COMPLETE',
        resource: 'Consultation',
        resourceId: consultationId,
        metadata: { mode: session.mode, redFlagDetected: session.redFlagDetected },
      });

      return reply.send({
        success: true,
        data: ogHistory,
      });
    }
  );

  // ----------------------------------------------------------
  // GET /og-history/:consultationId
  // Get stored O&G history for a consultation
  // ----------------------------------------------------------
  fastify.get(
    '/og-history/:consultationId',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { consultationId } = request.params as { consultationId: string };
      const userId = request.user!.sub;

      const consultation = await prisma.consultation.findUnique({
        where: { id: consultationId },
        select: {
          encryptedDataKey: true,
          doctor: { select: { userId: true } },
          patient: { select: { userId: true } },
          medicalHistory: { select: { clinicalScores: true } },
        },
      });

      if (!consultation) {
        return reply.status(404).send({ success: false, error: 'Consultation not found.' });
      }

      const role = request.user!.role;
      if (role === 'DOCTOR' && consultation.doctor?.userId !== userId) {
        return reply.status(403).send({ success: false, error: 'Forbidden.' });
      }
      if (role === 'PATIENT' && consultation.patient?.userId !== userId) {
        return reply.status(403).send({ success: false, error: 'Forbidden.' });
      }

      const clinicalScores = consultation.medicalHistory?.clinicalScores;
      if (!clinicalScores || !consultation.encryptedDataKey) {
        return reply.status(404).send({
          success: false,
          error: 'O&G history not available for this consultation.',
        });
      }

      try {
        const dataKey = await decryptDataKey(consultation.encryptedDataKey);
        const ogHistory = decryptJSON(clinicalScores, dataKey);
        return reply.send({ success: true, data: ogHistory });
      } catch {
        return reply.status(500).send({ success: false, error: 'Failed to retrieve history.' });
      }
    }
  );
}
