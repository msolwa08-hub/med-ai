import type { FastifyInstance } from 'fastify';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import { requireConsent } from '../middleware/consent.js';
import { auditLog } from '../services/audit.service.js';
import { decryptField, decryptJSON, decryptDataKey } from '../lib/encryption.js';
import { encryptPhiJson } from '../lib/phi-json.js';
import {
  generateClinicalReasoning,
  type ClinicalReasoningPackage,
} from '../services/clinical-reasoning.js';

type UrgencyLevel = 'ROUTINE' | 'SOON' | 'URGENT' | 'EMERGENCY';
const URGENCY_RANK: Record<UrgencyLevel, number> = { ROUTINE: 0, SOON: 1, URGENT: 2, EMERGENCY: 3 };
function rankUrgency(level: UrgencyLevel): number {
  return URGENCY_RANK[level] ?? 0;
}

export async function clinicalReasoningRoutes(fastify: FastifyInstance): Promise<void> {
  // ----------------------------------------------------------
  // POST /clinical-reasoning/:consultationId
  // Generate an STG-linked reasoning package from the completed
  // AI history (any department) + examination findings if present.
  // ----------------------------------------------------------
  fastify.post(
    '/clinical-reasoning/:consultationId',
    { preHandler: [authenticate, requireRole('DOCTOR'), requireConsent] },
    async (request, reply) => {
      const { consultationId } = request.params as { consultationId: string };
      const userId = request.user!.sub;

      const consultation = await prisma.consultation.findUnique({
        where: { id: consultationId },
        select: {
          id: true,
          encryptedDataKey: true,
          doctor: { select: { userId: true } },
          patient: { select: { dateOfBirth: true, gender: true } },
          medicalHistory: {
            select: {
              chiefComplaint: true,
              historyOfPresentIllness: true,
              systemsReview: true,
              clinicalScores: true,
              redFlagsIdentified: true,
            },
          },
          examinationFindings: {
            select: { vitalSigns: true, generalExam: true, systemicExam: true },
          },
          investigations: {
            select: { name: true, type: true, encryptedResult: true, resultDate: true },
          },
          patientId: true,
        },
      });

      if (!consultation) {
        return reply.status(404).send({ success: false, error: 'Consultation not found.' });
      }
      if (consultation.doctor?.userId !== userId) {
        return reply.status(403).send({
          success: false,
          error: 'You are not the assigned doctor for this consultation.',
          code: 'FORBIDDEN',
        });
      }
      if (!consultation.medicalHistory) {
        return reply.status(400).send({
          success: false,
          error: 'No history has been taken for this consultation yet.',
          code: 'NO_HISTORY',
        });
      }

      try {
        const dataKey = await decryptDataKey(consultation.encryptedDataKey);
        const mh = consultation.medicalHistory;

        const chiefComplaint = safeDecrypt(mh.chiefComplaint, dataKey) ?? 'Not recorded';
        const historySummary =
          safeDecrypt(mh.systemsReview, dataKey) ??
          safeDecrypt(mh.historyOfPresentIllness, dataKey) ??
          'See structured history.';
        const structuredHistory = mh.clinicalScores
          ? safeDecryptJSON(mh.clinicalScores, dataKey)
          : undefined;

        let examinationFindings: string | undefined;
        if (consultation.examinationFindings) {
          const ex = consultation.examinationFindings;
          const parts = [
            safeDecrypt(ex.vitalSigns, dataKey),
            safeDecrypt(ex.generalExam, dataKey),
            safeDecrypt(ex.systemicExam, dataKey),
          ].filter(Boolean);
          if (parts.length) examinationFindings = parts.join('\n');
        }

        // ── Close the diagnostic loop: investigation + lab results ─────────
        // Ordered investigations (encrypted with the consultation key) and
        // synced lab results (master-key encrypted) both feed the prompt so
        // the differential revises on evidence, not just the history.
        const resultLines: string[] = [];
        for (const inv of consultation.investigations ?? []) {
          if (!inv.encryptedResult) continue;
          try {
            const parsed = decryptJSON(inv.encryptedResult, dataKey) as {
              result?: unknown;
              metadata?: Record<string, string>;
            };
            if (parsed?.result) {
              resultLines.push(`${inv.type} — ${inv.name}: ${typeof parsed.result === 'string' ? parsed.result : JSON.stringify(parsed.result)}`);
            }
          } catch {
            // unreadable result — skip, never block reasoning
          }
        }
        try {
          const labs = await prisma.labResult.findMany({
            where: { consultationId },
            orderBy: { collectedAt: 'desc' },
            take: 20,
            select: { testName: true, encryptedResults: true, isAbnormal: true, collectedAt: true },
          });
          for (const lab of labs) {
            try {
              const values = decryptJSON(lab.encryptedResults) as unknown;
              resultLines.push(
                `LAB — ${lab.testName}${lab.isAbnormal ? ' (FLAGGED ABNORMAL)' : ''}: ${JSON.stringify(values).slice(0, 400)}`
              );
            } catch {
              // skip unreadable lab rows
            }
          }
        } catch {
          // labs unavailable — proceed without
        }
        const investigationResults = resultLines.length ? resultLines.join('\n') : undefined;

        // ── Problem list context: known active/chronic coded conditions ────
        let priorConditions: string | undefined;
        try {
          const problems = await prisma.diagnosis.findMany({
            where: {
              patientId: consultation.patientId,
              consultationId: { not: consultationId },
              status: { in: ['ACTIVE', 'CHRONIC'] },
            },
            orderBy: { confirmedAt: 'desc' },
            take: 20,
            select: { icd10Code: true, label: true, status: true },
          });
          const seen = new Set<string>();
          const lines = problems
            .filter((d) => {
              const key = (d.icd10Code ?? d.label).toUpperCase();
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            })
            .map((d) => `- ${d.label}${d.icd10Code ? ` (${d.icd10Code})` : ''} [${d.status}]`);
          priorConditions = lines.length ? lines.join('\n') : undefined;
        } catch {
          // problem list unavailable — proceed without
        }

        // Patient age
        const dob = consultation.patient?.dateOfBirth
          ? new Date(consultation.patient.dateOfBirth)
          : new Date('1990-01-01');
        const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000));

        const historyResult = structuredHistory as
          | { department?: string; urgency?: UrgencyLevel; redFlags?: string[] }
          | undefined;
        const department = historyResult?.department;

        const reasoning: ClinicalReasoningPackage = await generateClinicalReasoning({
          age,
          gender: consultation.patient?.gender ?? undefined,
          chiefComplaint,
          historySummary,
          structuredHistory,
          examinationFindings,
          department,
          investigationResults,
          priorConditions,
        });

        // Reconcile: the reasoning pass reasons only from the summary and can
        // under-call urgency relative to the structured history-taking pass
        // (which has the full transcript and dedicated red-flag detection).
        // Never let reasoning silently downgrade a history-flagged urgency.
        if (historyResult?.urgency && rankUrgency(historyResult.urgency) > rankUrgency(reasoning.urgency)) {
          reasoning.urgency = historyResult.urgency;
        }
        if (historyResult?.redFlags?.length) {
          const seen = new Set(reasoning.redFlags.map((f) => f.toLowerCase()));
          for (const flag of historyResult.redFlags) {
            if (!seen.has(flag.toLowerCase())) {
              reasoning.redFlags.push(flag);
              seen.add(flag.toLowerCase());
            }
          }
        }

        // Persist so GET /diagnosis/:consultationId also surfaces it.
        // Each entry carries icdCode (legacy shape) alongside the full
        // reasoning + STG link.
        const diagnosesForStorage = reasoning.differentials.map((d) => ({
          diagnosis: d.diagnosis,
          icdCode: d.icd10Code,
          icd10Code: d.icd10Code,
          probability: d.probability,
          band: d.band,
          reasoning: d.reasoning,
          supportingFeatures: d.supportingFeatures,
          againstFeatures: d.againstFeatures,
          stg: d.stg,
        }));

        await prisma.differentialDiagnosis.upsert({
          where: { consultationId },
          create: {
            consultationId,
            diagnoses: encryptPhiJson(diagnosesForStorage, dataKey),
            aiModel: reasoning.aiModel,
          },
          update: {
            diagnoses: encryptPhiJson(diagnosesForStorage, dataKey),
            aiModel: reasoning.aiModel,
            generatedAt: new Date(),
            doctorReviewed: false,
          },
        });

        await auditLog({
          userId,
          action: 'CLINICAL_REASONING_GENERATED',
          resource: 'DifferentialDiagnosis',
          resourceId: consultationId,
          metadata: {
            department,
            urgency: reasoning.urgency,
            differentialCount: reasoning.differentials.length,
            stgLinked: reasoning.differentials.filter((d) => d.stg.available).length,
          },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        return reply.send({
          success: true,
          data: {
            ...reasoning,
            investigationsConsidered: resultLines.length,
            priorConditionsConsidered: priorConditions ? priorConditions.split('\n').length : 0,
          },
        });
      } catch (err) {
        fastify.log.error(err, 'POST /clinical-reasoning error');
        return reply.status(500).send({
          success: false,
          error: 'Failed to generate the clinical reasoning package. Please try again.',
        });
      }
    }
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeDecrypt(value: string | null | undefined, dataKey: Buffer): string | undefined {
  if (!value) return undefined;
  try {
    return decryptField(value, dataKey);
  } catch {
    return undefined;
  }
}

function safeDecryptJSON(value: string, dataKey: Buffer): unknown {
  try {
    return decryptJSON(value, dataKey);
  } catch {
    return undefined;
  }
}
