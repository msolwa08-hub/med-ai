/**
 * Management Draft — the connective tissue between a confirmed ICD-10
 * diagnosis and the management plan.
 *
 * Workflow: doctor confirms a coded diagnosis → POST /management/draft →
 * the STG entry for that code is pulled from the live guideline table and
 * AI-adapted to THIS patient (age, allergies, pregnancy, chronic problem
 * list) → returns a pre-filled draft (medications, investigations,
 * follow-up, patient instructions) that the doctor edits and saves through
 * the existing management endpoint. Nothing is persisted here — it is a
 * draft generator, and the drafted medications are pre-screened through the
 * same safety checks that gate prescriptions.
 */

import type { FastifyInstance } from 'fastify';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import { requireConsent } from '../middleware/consent.js';
import { auditLog } from '../services/audit.service.js';
import { decryptField, decryptJSON, decryptDataKey } from '../lib/encryption.js';
import { checkPrescriptionSafety } from '../services/prescription-safety.js';
import { anthropic, CLAUDE_MODEL } from '../lib/claude.js';
import { extractJSON } from '../lib/json-extract.js';
import type { STGEntry } from '@prisma/client';

interface DraftMedication {
  name: string;
  dose: string;
  frequency: string;
  duration?: string;
  route?: string;
  notes?: string;
}

interface ManagementDraft {
  diagnosis: string;
  icd10Code: string | null;
  medications: DraftMedication[];
  investigations: Array<{ name: string; urgency: 'ROUTINE' | 'URGENT' | 'STAT'; rationale?: string }>;
  followUpDays: number | null;
  patientInstructions: string;
  referralAdvice: string | null;
  stgSource: string | null; // which STG condition backed this draft
  adaptationNotes: string[];
}

async function findStgForCode(icd10Code: string | null, label: string): Promise<STGEntry | null> {
  if (icd10Code) {
    const exact = await prisma.sTGEntry.findUnique({ where: { icd10Code } });
    if (exact) return exact;
    const stem = icd10Code.split('.')[0];
    const byStem =
      (await prisma.sTGEntry.findUnique({ where: { icd10Code: stem } })) ??
      (await prisma.sTGEntry.findFirst({
        where: { icd10Code: { startsWith: stem } },
        orderBy: { icd10Code: 'asc' },
      }));
    if (byStem) return byStem;
  }
  const term = label.trim().toLowerCase();
  if (term) {
    return prisma.sTGEntry.findFirst({
      where: {
        OR: [
          { conditionName: { contains: term, mode: 'insensitive' } },
          { synonyms: { has: term } },
        ],
      },
    });
  }
  return null;
}

export async function managementDraftRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post(
    '/management/draft/:consultationId',
    { preHandler: [authenticate, requireRole('DOCTOR'), requireConsent] },
    async (request, reply) => {
      const { consultationId } = request.params as { consultationId: string };
      const userId = request.user!.sub;

      const consultation = await prisma.consultation.findUnique({
        where: { id: consultationId },
        select: {
          id: true,
          patientId: true,
          encryptedDataKey: true,
          doctor: { select: { userId: true } },
          patient: { select: { dateOfBirth: true, gender: true } },
          medicalHistory: { select: { allergies: true, clinicalScores: true } },
          confirmedDiagnoses: {
            where: { isPrimary: true },
            orderBy: { confirmedAt: 'desc' },
            take: 1,
            select: { icd10Code: true, label: true },
          },
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

      const primary = consultation.confirmedDiagnoses[0];
      if (!primary) {
        return reply.status(400).send({
          success: false,
          error: 'Confirm a diagnosis first — the management draft is generated from the confirmed ICD-10 code.',
          code: 'CONFIRM_DIAGNOSIS_FIRST',
        });
      }

      try {
        // ── Patient context for adaptation + safety ────────────────────────
        let allergiesText: string | undefined;
        let isPregnant = false;
        try {
          const dataKey = decryptDataKey(consultation.encryptedDataKey);
          if (consultation.medicalHistory?.allergies) {
            allergiesText = decryptField(consultation.medicalHistory.allergies, dataKey);
          }
          if (consultation.medicalHistory?.clinicalScores) {
            const scores = decryptJSON(consultation.medicalHistory.clinicalScores, dataKey) as {
              mode?: string;
              gestationalAgeAtVisit?: string;
            };
            isPregnant = scores?.mode === 'OBSTETRIC' || !!scores?.gestationalAgeAtVisit;
          }
        } catch {
          // degrade gracefully
        }

        const problems = await prisma.diagnosis.findMany({
          where: {
            patientId: consultation.patientId,
            status: { in: ['ACTIVE', 'CHRONIC'] },
            consultationId: { not: consultationId },
          },
          select: { icd10Code: true, label: true },
          take: 20,
        });

        const dob = consultation.patient?.dateOfBirth
          ? new Date(consultation.patient.dateOfBirth)
          : new Date('1990-01-01');
        const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000));

        const stg = await findStgForCode(primary.icd10Code, primary.label);

        // ── AI adaptation of the STG to this patient ───────────────────────
        const prompt = `You are drafting a management plan for a South African doctor. Adapt the Standard Treatment Guideline below to THIS patient. Output is a DRAFT the doctor will edit and sign — be conservative, use SA EML agents and doses.

PATIENT: age ${age}${consultation.patient?.gender ? `, ${consultation.patient.gender.toLowerCase()}` : ''}${isPregnant ? ' — PREGNANT (avoid contraindicated agents)' : ''}
CONFIRMED DIAGNOSIS: ${primary.label}${primary.icd10Code ? ` (${primary.icd10Code})` : ''}
ALLERGIES: ${allergiesText ?? 'Not recorded'}
KNOWN CONDITIONS: ${problems.length ? problems.map((p) => `${p.label}${p.icd10Code ? ` (${p.icd10Code})` : ''}`).join('; ') : 'None recorded'}

${stg ? `STG ENTRY (${stg.conditionName}, ${stg.levelOfCare} level):\nFirst-line: ${JSON.stringify(stg.firstLineTreatment).slice(0, 1500)}\nInvestigations: ${JSON.stringify(stg.investigations).slice(0, 800)}\nReferral criteria: ${stg.referralCriteria ?? 'n/a'}\nFollow-up: ${stg.followUpAdvice ?? 'n/a'}` : 'NO STG ENTRY FOUND for this code — draft from standard SA primary-care practice and say so in adaptationNotes.'}

Rules:
- Respect allergies and pregnancy absolutely; substitute alternatives and explain in adaptationNotes
- Adjust for chronic conditions (e.g. avoid NSAIDs in CKD, check interactions with chronic meds)
- followUpDays: an integer, from the STG follow-up guidance
- Keep patientInstructions plain-language, safety-netted

Return ONLY valid JSON:
{
  "medications": [{ "name": "", "dose": "", "frequency": "", "duration": "", "route": "", "notes": "" }],
  "investigations": [{ "name": "", "urgency": "ROUTINE|URGENT|STAT", "rationale": "" }],
  "followUpDays": 0,
  "patientInstructions": "",
  "referralAdvice": "string or null — when to refer per STG",
  "adaptationNotes": ["what was changed for this patient and why"]
}`;

        const response = await anthropic.messages.create({
          model: CLAUDE_MODEL,
          max_tokens: 2048,
          temperature: 0,
          messages: [{ role: 'user', content: prompt }],
        });
        const text = (response as { content: Array<{ type: string; text?: string }> }).content
          .filter((b) => b.type === 'text')
          .map((b) => b.text ?? '')
          .join('');

        const parsed = extractJSON<Omit<ManagementDraft, 'diagnosis' | 'icd10Code' | 'stgSource'>>(text);

        // Pre-screen drafted medications through the prescription safety gate
        const safetyWarnings = checkPrescriptionSafety(
          (parsed.medications ?? []).map((m) => m.name),
          {
            allergiesText,
            isPregnant,
            problemCodes: problems.map((p) => p.icd10Code).filter((x): x is string => !!x),
          }
        );

        const draft: ManagementDraft & { safetyWarnings: typeof safetyWarnings } = {
          diagnosis: primary.label,
          icd10Code: primary.icd10Code,
          medications: parsed.medications ?? [],
          investigations: parsed.investigations ?? [],
          followUpDays: parsed.followUpDays ?? null,
          patientInstructions: parsed.patientInstructions ?? '',
          referralAdvice: parsed.referralAdvice ?? null,
          stgSource: stg ? `${stg.conditionName} (${stg.icd10Code}) — SA STG ${stg.edition}` : null,
          adaptationNotes: parsed.adaptationNotes ?? [],
          safetyWarnings,
        };

        await auditLog({
          userId,
          action: 'MANAGEMENT_DRAFT_GENERATED',
          resource: 'Consultation',
          resourceId: consultationId,
          metadata: {
            icd10Code: primary.icd10Code,
            stgBacked: !!stg,
            medicationCount: draft.medications.length,
            safetyWarningCount: safetyWarnings.length,
          },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        return reply.send({ success: true, data: draft });
      } catch (err) {
        fastify.log.error(err, 'POST /management/draft error');
        return reply.status(502).send({
          success: false,
          error: 'Failed to generate the management draft. Please try again.',
          code: 'DRAFT_FAILED',
        });
      }
    }
  );
}
