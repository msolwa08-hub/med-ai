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
  startSpecialtyHistorySession,
  continueSpecialtyHistorySession,
  extractSpecialtyHistory,
  detectInternalSystem,
  departmentLabel,
  DEPARTMENTS,
  type Department,
  type InternalSystem,
  type SpecialtyPatientContext,
} from '../services/specialty-history.js';
import type { ConversationMessage, SaLanguage } from '../types/index.js';
import { SA_LANGUAGES } from '../types/index.js';

// ============================================================
// Schemas
// ============================================================

const StartSpecialtyHistorySchema = z.object({
  consultationId: z.string().min(1),
  department: z.enum(['INTERNAL', 'PAEDIATRICS', 'FAMILY_MEDICINE', 'SURGERY', 'ENT', 'PSYCHIATRY']),
  language: z.enum(SA_LANGUAGES).default('en'),
  chiefComplaint: z.string().max(500).optional(),
  /** INTERNAL only — pre-select the disease system; auto-detected otherwise. */
  system: z
    .enum([
      'CARDIOVASCULAR',
      'RESPIRATORY',
      'GASTROINTESTINAL',
      'RENAL',
      'NEUROLOGY',
      'ENDOCRINE',
      'INFECTIOUS_DISEASES',
      'HAEMATOLOGY',
      'RHEUMATOLOGY',
      'GENERAL',
    ])
    .optional(),
});

const ContinueSpecialtyHistorySchema = z.object({
  consultationId: z.string().min(1),
  patientMessage: z.string().min(1).max(5000),
});

const CompleteSpecialtyHistorySchema = z.object({
  consultationId: z.string().min(1),
});

// ============================================================
// In-memory session store (mirrors og-history.ts pattern)
// ============================================================

interface SpecialtySession {
  conversationHistory: ConversationMessage[];
  department: Department;
  system?: InternalSystem;
  language: string;
  context: SpecialtyPatientContext;
  isComplete: boolean;
  redFlagDetected: boolean;
  startedAt: string;
}

const specialtySessions = new Map<string, SpecialtySession>();

// ============================================================
// Route plugin
// ============================================================

export async function specialtyHistoryRoutes(fastify: FastifyInstance): Promise<void> {
  // ----------------------------------------------------------
  // GET /specialty-history/departments
  // ----------------------------------------------------------
  fastify.get('/specialty-history/departments', async (_request, reply) => {
    return reply.send({
      success: true,
      data: DEPARTMENTS.map((d) => ({ key: d, label: departmentLabel(d) })),
    });
  });

  // ----------------------------------------------------------
  // POST /specialty-history/start
  // ----------------------------------------------------------
  fastify.post(
    '/specialty-history/start',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const parsed = StartSpecialtyHistorySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation failed',
          details: parsed.error.flatten(),
        });
      }

      const { consultationId, department, language, chiefComplaint, system: requestedSystem } =
        parsed.data;
      const userId = request.user!.sub;

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
      const isOwner =
        (role === 'PATIENT' && consultation.patient?.userId === userId) ||
        (role === 'DOCTOR' && consultation.doctor?.userId === userId) ||
        role === 'ADMIN';
      if (!isOwner) {
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

      const saLanguage = language as SaLanguage;

      const context: SpecialtyPatientContext = {
        age,
        gender: consultation.patient?.gender ?? undefined,
        language: saLanguage,
        knownConditions: [],
        currentMedications: [],
        caregiverPresent: department === 'PAEDIATRICS',
      };

      // INTERNAL branches by disease system, mirroring O&G mode detection
      let system: InternalSystem | undefined = requestedSystem;
      if (department === 'INTERNAL' && !system) {
        system = chiefComplaint ? await detectInternalSystem(chiefComplaint, age) : 'GENERAL';
      }

      const patientName = consultation.patient?.firstName ?? 'there';

      let sessionResponse;
      try {
        sessionResponse = await startSpecialtyHistorySession(
        department,
        system,
        patientName,
        saLanguage,
        context
      );
      } catch (err) {
        fastify.log.error(err, 'AI session call failed');
        return reply.status(502).send({
          success: false,
          error: 'The AI assistant is temporarily unavailable. Please try again shortly.',
          code: 'AI_UNAVAILABLE',
        });
      }

      const ts = new Date().toISOString();
      specialtySessions.set(consultationId, {
        conversationHistory: [
          { role: 'assistant', content: sessionResponse.message, timestamp: ts },
        ],
        department,
        system,
        language: saLanguage,
        context,
        isComplete: sessionResponse.isComplete,
        redFlagDetected: sessionResponse.redFlagDetected,
        startedAt: ts,
      });

      await auditLog({
        userId,
        action: 'SPECIALTY_HISTORY_START',
        resource: 'Consultation',
        resourceId: consultationId,
        metadata: { department, system, language },
      });

      return reply.send({
        success: true,
        data: {
          message: sessionResponse.message,
          isComplete: sessionResponse.isComplete,
          department,
          system,
          redFlagDetected: sessionResponse.redFlagDetected,
          consultationId,
        },
      });
    }
  );

  // ----------------------------------------------------------
  // POST /specialty-history/continue
  // ----------------------------------------------------------
  fastify.post(
    '/specialty-history/continue',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const parsed = ContinueSpecialtyHistorySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation failed',
          details: parsed.error.flatten(),
        });
      }

      const { consultationId, patientMessage } = parsed.data;

      const session = specialtySessions.get(consultationId);
      if (!session) {
        return reply.status(404).send({
          success: false,
          error: 'Specialty history session not found. Please start a new session.',
          code: 'SESSION_NOT_FOUND',
        });
      }

      if (session.isComplete) {
        return reply.status(400).send({
          success: false,
          error: 'This specialty history session is already complete.',
          code: 'SESSION_COMPLETE',
        });
      }

      session.conversationHistory.push({
        role: 'user',
        content: patientMessage,
        timestamp: new Date().toISOString(),
      });

      let sessionResponse;
      try {
        sessionResponse = await continueSpecialtyHistorySession(
        session.conversationHistory,
        patientMessage,
        session.department,
        session.system,
        session.language as SaLanguage,
        session.context
      );
      } catch (err) {
        fastify.log.error(err, 'AI session call failed');
        return reply.status(502).send({
          success: false,
          error: 'The AI assistant is temporarily unavailable. Please try again shortly.',
          code: 'AI_UNAVAILABLE',
        });
      }

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
          department: session.department,
          system: session.system,
          redFlagDetected: sessionResponse.redFlagDetected,
        },
      });
    }
  );

  // ----------------------------------------------------------
  // POST /specialty-history/complete
  // Extract structured history and save (encrypted) to the consultation
  // ----------------------------------------------------------
  fastify.post(
    '/specialty-history/complete',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const parsed = CompleteSpecialtyHistorySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation failed',
          details: parsed.error.flatten(),
        });
      }

      const { consultationId } = parsed.data;
      const userId = request.user!.sub;

      const session = specialtySessions.get(consultationId);
      if (!session) {
        return reply.status(404).send({
          success: false,
          error: 'Specialty history session not found.',
          code: 'SESSION_NOT_FOUND',
        });
      }

      const result = await extractSpecialtyHistory(
        session.conversationHistory,
        session.department,
        session.system,
        session.context
      );

      // Store encrypted in MedicalHistory (mirrors O&G persistence)
      const consultation = await prisma.consultation.findUnique({
        where: { id: consultationId },
        select: { encryptedDataKey: true },
      });

      if (consultation?.encryptedDataKey) {
        try {
          const dataKey = await decryptDataKey(consultation.encryptedDataKey);

          const structured = result.structuredHistory as Record<string, string | undefined>;
          const chiefComplaint = encryptField(
            structured.chiefComplaint ?? `${departmentLabel(session.department)} consultation`,
            dataKey
          );
          const historyOfPresentIllness = encryptField(
            structured.historyOfPresentingIllness ??
              structured.surgicalSymptomAnalysis ??
              result.clinicalSummary,
            dataKey
          );
          const summaryEncrypted = encryptField(result.clinicalSummary, dataKey);
          const redFlagsEncrypted =
            result.redFlags.length > 0 ? encryptField(result.redFlags.join('; '), dataKey) : null;
          const clinicalScoresEncrypted = encryptJSON(result, dataKey);
          const conversationLogEncrypted = encryptJSON(session.conversationHistory, dataKey);

          const emptyStr = encryptField('Not assessed', dataKey);

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
              pastMedicalHistory: encryptField(structured.pastMedicalHistory ?? 'Not assessed', dataKey),
              medications: encryptField(structured.medications ?? 'Not assessed', dataKey),
              allergies: encryptField(structured.allergies ?? 'Not assessed', dataKey),
              familyHistory: encryptField(structured.familyHistory ?? 'Not assessed', dataKey),
              socialHistory: encryptField(
                structured.socialHistory ?? structured.socialDeterminants ?? structured.familySocial ?? 'Not assessed',
                dataKey
              ),
              systemsReview: summaryEncrypted,
              clinicalScores: clinicalScoresEncrypted,
              redFlagsIdentified: redFlagsEncrypted ?? undefined,
              aiConversationLog: conversationLogEncrypted,
            },
          });

          await prisma.consultation.update({
            where: { id: consultationId },
            data: { status: 'DOCTOR_REVIEW' },
          });

          // Triage + dispatch to nearby doctors (fire-and-forget; unassigned only)
          void dispatchConsultation(consultationId, result.urgency, fastify.log);
        } catch (err) {
          fastify.log.warn(err, 'Failed to encrypt/save specialty history');
        }
      }

      specialtySessions.delete(consultationId);

      await auditLog({
        userId,
        action: 'SPECIALTY_HISTORY_COMPLETE',
        resource: 'Consultation',
        resourceId: consultationId,
        metadata: {
          department: session.department,
          system: session.system,
          redFlagDetected: session.redFlagDetected,
          urgency: result.urgency,
        },
      });

      return reply.send({ success: true, data: result });
    }
  );

  // ----------------------------------------------------------
  // GET /specialty-history/:consultationId
  // ----------------------------------------------------------
  fastify.get(
    '/specialty-history/:consultationId',
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
          error: 'Specialty history not available for this consultation.',
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
