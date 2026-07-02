import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/authenticate.js';
import { auditLog } from '../services/audit.service.js';
import { dispatchConsultation } from '../services/dispatch.service.js';
import {
  encryptJSON,
  encryptField,
  decryptJSON,
  decryptDataKey,
} from '../lib/encryption.js';
import {
  startFollowUpSession,
  continueFollowUpSession,
  extractFollowUpHistory,
  calculateEDD,
  type FollowUpPatientContext,
  type PriorPregnancyContext,
} from '../services/antenatal-followup.js';
import type { ConversationMessage, SaLanguage } from '../types/index.js';
import { SA_LANGUAGES } from '../types/index.js';

// ============================================================
// Schemas
// ============================================================

const StartFollowUpSchema = z.object({
  consultationId: z.string().min(1),
  language: z.enum(SA_LANGUAGES).default('en'),
});

const ContinueFollowUpSchema = z.object({
  consultationId: z.string().min(1),
  patientMessage: z.string().min(1).max(5000),
});

const CompleteFollowUpSchema = z.object({
  consultationId: z.string().min(1),
});

// ============================================================
// In-memory session store
// ============================================================

interface FollowUpSession {
  conversationHistory: ConversationMessage[];
  language: string;
  context: FollowUpPatientContext;
  isComplete: boolean;
  redFlagDetected: boolean;
  startedAt: string;
}

const followUpSessions = new Map<string, FollowUpSession>();

// ============================================================
// Prior-pregnancy lookup — scans the patient's OTHER consultations for the
// most recent obstetric record (first booking visit OR a previous follow-up),
// decrypting each with ITS OWN per-consultation key.
// ============================================================

interface StoredObstetricShape {
  mode?: string;
  obstetricHistory?: { lmp?: string; edd?: string; gravida?: string; para?: string };
  gestationalAgeAtVisit?: string;
  lmp?: string;
  edd?: string;
  gravida?: string;
  para?: string;
  clinicalSummary?: string;
}

async function findPriorPregnancyContext(
  patientId: string,
  excludeConsultationId: string
): Promise<PriorPregnancyContext> {
  const candidates = await prisma.consultation.findMany({
    where: { patientId, id: { not: excludeConsultationId } },
    orderBy: { startedAt: 'desc' },
    take: 15,
    select: {
      startedAt: true,
      encryptedDataKey: true,
      medicalHistory: { select: { clinicalScores: true } },
    },
  });

  let visitCount = 0;
  let mostRecent: PriorPregnancyContext = {};
  let found = false;

  for (const c of candidates) {
    if (!c.medicalHistory?.clinicalScores) continue;
    try {
      const dataKey = await decryptDataKey(c.encryptedDataKey);
      const parsed = decryptJSON(c.medicalHistory.clinicalScores, dataKey) as StoredObstetricShape;

      const isObstetric = parsed.mode === 'OBSTETRIC' || !!parsed.gestationalAgeAtVisit;
      if (!isObstetric) continue;

      visitCount++;

      if (!found) {
        mostRecent = {
          lmp: parsed.obstetricHistory?.lmp ?? parsed.lmp,
          edd: parsed.obstetricHistory?.edd ?? parsed.edd,
          gravida: parsed.obstetricHistory?.gravida ?? parsed.gravida,
          para: parsed.obstetricHistory?.para ?? parsed.para,
          lastVisitSummary: parsed.clinicalSummary,
          lastVisitDate: c.startedAt.toISOString().slice(0, 10),
        };
        found = true;
      }
    } catch {
      // Skip records we can't decrypt or parse — never let one bad record 500 the route
      continue;
    }
  }

  mostRecent.visitNumber = visitCount + 1; // this visit will be the next one
  return mostRecent;
}

// ============================================================
// Route plugin
// ============================================================

export async function antenatalFollowUpRoutes(fastify: FastifyInstance): Promise<void> {
  // ----------------------------------------------------------
  // POST /antenatal-followup/start
  // ----------------------------------------------------------
  fastify.post(
    '/antenatal-followup/start',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const parsed = StartFollowUpSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation failed',
          details: parsed.error.flatten(),
        });
      }

      const { consultationId, language } = parsed.data;
      const userId = request.user!.sub;

      const consultation = await prisma.consultation.findUnique({
        where: { id: consultationId },
        select: {
          id: true,
          patientId: true,
          patient: {
            select: { id: true, firstName: true, dateOfBirth: true, userId: true },
          },
          doctor: { select: { userId: true } },
        },
      });

      if (!consultation) {
        return reply.status(404).send({ success: false, error: 'Consultation not found.' });
      }

      const role = request.user!.role;
      const isOwner =
        (role === 'PATIENT' && consultation.patient?.userId === userId) ||
        (role === 'DOCTOR' && consultation.doctor?.userId === userId) ||
        role === 'ADMIN';
      if (!isOwner) {
        return reply.status(403).send({ success: false, error: 'Forbidden.', code: 'FORBIDDEN' });
      }

      const dob = consultation.patient?.dateOfBirth
        ? new Date(consultation.patient.dateOfBirth)
        : new Date('1990-01-01');
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const mDiff = today.getMonth() - dob.getMonth();
      if (mDiff < 0 || (mDiff === 0 && today.getDate() < dob.getDate())) age -= 1;

      const saLanguage = language as SaLanguage;

      const prior = await findPriorPregnancyContext(consultation.patientId, consultationId);
      if (prior.lmp && !prior.edd) {
        prior.edd = calculateEDD(prior.lmp) ?? undefined;
      }

      const context: FollowUpPatientContext = { age, language: saLanguage, prior };
      const patientName = consultation.patient?.firstName ?? 'there';

      const sessionResponse = await startFollowUpSession(patientName, saLanguage, context);

      const ts = new Date().toISOString();
      followUpSessions.set(consultationId, {
        conversationHistory: [
          { role: 'assistant', content: sessionResponse.message, timestamp: ts },
        ],
        language: saLanguage,
        context,
        isComplete: sessionResponse.isComplete,
        redFlagDetected: sessionResponse.redFlagDetected,
        startedAt: ts,
      });

      await auditLog({
        userId,
        action: 'ANC_FOLLOWUP_START',
        resource: 'Consultation',
        resourceId: consultationId,
        metadata: { hasPriorContext: !!prior.lmp, visitNumber: prior.visitNumber },
      });

      return reply.send({
        success: true,
        data: {
          message: sessionResponse.message,
          isComplete: sessionResponse.isComplete,
          redFlagDetected: sessionResponse.redFlagDetected,
          consultationId,
          priorContextFound: !!prior.lmp,
          visitNumber: prior.visitNumber,
        },
      });
    }
  );

  // ----------------------------------------------------------
  // POST /antenatal-followup/continue
  // ----------------------------------------------------------
  fastify.post(
    '/antenatal-followup/continue',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const parsed = ContinueFollowUpSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation failed',
          details: parsed.error.flatten(),
        });
      }

      const { consultationId, patientMessage } = parsed.data;

      const session = followUpSessions.get(consultationId);
      if (!session) {
        return reply.status(404).send({
          success: false,
          error: 'Follow-up session not found. Please start a new session.',
          code: 'SESSION_NOT_FOUND',
        });
      }

      if (session.isComplete) {
        return reply.status(400).send({
          success: false,
          error: 'This follow-up session is already complete.',
          code: 'SESSION_COMPLETE',
        });
      }

      session.conversationHistory.push({
        role: 'user',
        content: patientMessage,
        timestamp: new Date().toISOString(),
      });

      const sessionResponse = await continueFollowUpSession(
        session.conversationHistory,
        patientMessage,
        session.language as SaLanguage,
        session.context
      );

      session.conversationHistory.push({
        role: 'assistant',
        content: sessionResponse.message,
        timestamp: new Date().toISOString(),
      });
      session.isComplete = sessionResponse.isComplete;
      session.redFlagDetected = session.redFlagDetected || sessionResponse.redFlagDetected;

      return reply.send({
        success: true,
        data: {
          message: sessionResponse.message,
          isComplete: sessionResponse.isComplete,
          redFlagDetected: sessionResponse.redFlagDetected,
        },
      });
    }
  );

  // ----------------------------------------------------------
  // POST /antenatal-followup/complete
  // ----------------------------------------------------------
  fastify.post(
    '/antenatal-followup/complete',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const parsed = CompleteFollowUpSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation failed',
          details: parsed.error.flatten(),
        });
      }

      const { consultationId } = parsed.data;
      const userId = request.user!.sub;

      const session = followUpSessions.get(consultationId);
      if (!session) {
        return reply.status(404).send({
          success: false,
          error: 'Follow-up session not found.',
          code: 'SESSION_NOT_FOUND',
        });
      }

      const result = await extractFollowUpHistory(session.conversationHistory, session.context);

      const consultation = await prisma.consultation.findUnique({
        where: { id: consultationId },
        select: { encryptedDataKey: true },
      });

      if (consultation?.encryptedDataKey) {
        try {
          const dataKey = await decryptDataKey(consultation.encryptedDataKey);

          const chiefComplaint = encryptField(
            `Antenatal follow-up — ${result.gestationalAgeAtVisit}`,
            dataKey
          );
          const historyOfPresentIllness = encryptField(result.intervalHistory, dataKey);
          const summaryEncrypted = encryptField(result.clinicalSummary, dataKey);
          const redFlagsEncrypted =
            result.redFlags.length > 0 ? encryptField(result.redFlags.join('; '), dataKey) : null;

          // Carry pregnancy context (lmp/edd/gravida/para) forward alongside
          // this visit's extraction, so the NEXT follow-up can find it too —
          // without this, context would only ever inherit from the original
          // booking visit even after many follow-ups.
          const storedRecord = {
            ...result,
            lmp: session.context.prior.lmp,
            edd: session.context.prior.edd,
            gravida: session.context.prior.gravida,
            para: session.context.prior.para,
          };
          const clinicalScoresEncrypted = encryptJSON(storedRecord, dataKey);
          const conversationLogEncrypted = encryptJSON(session.conversationHistory, dataKey);
          const emptyStr = encryptField('See prior visit / not re-assessed this visit', dataKey);

          await prisma.medicalHistory.upsert({
            where: { consultationId },
            update: {
              chiefComplaint,
              historyOfPresentIllness,
              systemsReview: summaryEncrypted,
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
              medications: encryptField(result.adherence, dataKey),
              allergies: emptyStr,
              familyHistory: emptyStr,
              socialHistory: emptyStr,
              systemsReview: summaryEncrypted,
              clinicalScores: clinicalScoresEncrypted,
              redFlagsIdentified: redFlagsEncrypted ?? undefined,
              aiConversationLog: conversationLogEncrypted,
            },
          });

          await prisma.consultation.update({
            where: { id: consultationId },
            // Triage urgency stamped synchronously — the queue must be able to
            // order this consultation the moment completion returns.
            data: { status: 'DOCTOR_REVIEW', triageUrgency: result.urgency },
          });

          // Dispatch push fan-out stays fire-and-forget (unassigned only)
          void dispatchConsultation(consultationId, undefined, fastify.log);
        } catch (err) {
          fastify.log.warn(err, 'Failed to encrypt/save antenatal follow-up history');
        }
      }

      followUpSessions.delete(consultationId);

      await auditLog({
        userId,
        action: 'ANC_FOLLOWUP_COMPLETE',
        resource: 'Consultation',
        resourceId: consultationId,
        metadata: { redFlagDetected: session.redFlagDetected, urgency: result.urgency },
      });

      return reply.send({ success: true, data: result });
    }
  );

  // ----------------------------------------------------------
  // GET /antenatal-followup/:consultationId
  // ----------------------------------------------------------
  fastify.get(
    '/antenatal-followup/:consultationId',
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
          error: 'Antenatal follow-up history not available for this consultation.',
        });
      }

      try {
        const dataKey = await decryptDataKey(consultation.encryptedDataKey);
        const history = decryptJSON(clinicalScores, dataKey);
        return reply.send({ success: true, data: history });
      } catch {
        return reply.status(500).send({ success: false, error: 'Failed to retrieve history.' });
      }
    }
  );
}
