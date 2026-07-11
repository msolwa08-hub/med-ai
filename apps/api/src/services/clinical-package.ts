// Doctor cockpit — clinical decision-support package generation.
//
// Takes a completed patient history (transcript + GP summary) plus the doctor's
// examination findings and produces a DRAFT clinical package: differentials with
// ICD-10 codes and calibrated probabilities, recommended investigations, a
// management plan, a draft prescription, and a draft sick note. Everything is a
// proposal for the doctor to review, edit, and actively confirm — never final.

import Anthropic from '@anthropic-ai/sdk';
import { betaConfig } from '../lib/beta-config.js';
import { CLINICAL_PACKAGE_SYSTEM } from './medai-prompt.js';
import { extractJSON, asString, asNumber, asStringArray } from '../lib/json-extract.js';
import type { BetaMessage as ChatMessage } from './beta-store.js';

const client = new Anthropic({ apiKey: betaConfig.ANTHROPIC_API_KEY });
const PACKAGE_MODEL = 'claude-sonnet-4-6';

// ─── Practice mode ────────────────────────────────────────────────────────────

export type PracticeMode = 'ACUTE_VOLUME' | 'FAMILY_PRACTICE' | 'HOLISTIC';

const PRACTICE_MODE_APPENDIX: Record<PracticeMode, string> = {
  ACUTE_VOLUME: `

PRACTICE MODE — ACUTE/VOLUME:
This is a high-throughput acute/urgent care setting. Priorities:
- Rapid risk stratification and immediate triage focus
- Keep management plan concise and action-oriented
- Omit chronic disease optimisation and health promotion unless directly relevant to today's presentation
- Investigations: only those that change immediate management
- Prescriptions: ready-to-use acute scripts with correct SA formulary doses
- Safety netting: concise, must-come-back criteria`,

  FAMILY_PRACTICE: `

PRACTICE MODE — FAMILY PRACTICE:
This is a continuity family medicine setting. Priorities:
- Acknowledge the whole patient, not just today's complaint
- Surface active chronic conditions and their current control (DM, HTN, asthma, HIV, epilepsy, etc.)
- Opportunistic health promotion: relevant preventive care and screening (cervical, lipids, DM screen)
- Prescriptions: consider long-term tolerance, adherence, cost, and SA formulary
- Follow-up plan with clear timeline and care continuity`,

  HOLISTIC: `

PRACTICE MODE — HOLISTIC:
This practice takes a bio-psycho-social approach. Priorities:
- Screen for mental health, stress, sleep, and social determinants of health
- Lifestyle factors: diet, exercise, substances, relationships
- Full preventive care and health promotion
- Empower the patient with self-management strategies
- Consider community resources and support networks`,
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExamVitals {
  bloodPressure?: string;
  heartRate?: string;
  respRate?: string;
  temperature?: string;
  spo2?: string;
  weight?: string;
  height?: string;
}

export interface ExamFindings {
  vitals?: ExamVitals;
  generalInspection?: string;
  systemFindings?: string;
  freeText?: string;
}

export type ProbabilityBand = 'HIGH' | 'MODERATE' | 'LOW';
export type Priority = 'ROUTINE' | 'URGENT' | 'STAT';

export interface Differential {
  diagnosis: string;
  icd10Code: string;
  probability: number; // 0–100, calibrated estimate
  band: ProbabilityBand;
  supportingFeatures: string[];
  againstFeatures: string[];
}

export interface InvestigationItem {
  name: string;
  rationale: string;
  priority: Priority;
}

export interface PrescriptionItem {
  drug: string;
  strength: string;
  form: string;
  dose: string;
  route: string;
  frequency: string;
  duration: string;
  quantity: string;
  scheduled: boolean; // higher-schedule / higher-risk → needs deliberate confirmation
  caution: string;
}

export interface SickNote {
  recommended: boolean;
  daysOff: number;
  fitnessStatement: string;
  natureOfIllness: string;
}

export interface ClinicalPackage {
  generatedAt: string;
  chiefComplaint: string;
  differentials: Differential[];
  recommendedInvestigations: InvestigationItem[];
  managementPlan: string[];
  prescriptionDraft: PrescriptionItem[];
  sickNote: SickNote;
  safetyNetting: string;
  redFlags: string[];
  disclaimer: string;
}

const _DOCTOR_NAME = process.env.BETA_DOCTOR_NAME ?? 'Dr. Patel';
const DISCLAIMER =
  `AI-generated DRAFT decision support. Not a diagnosis or prescription. ` +
  `${_DOCTOR_NAME} must independently review, edit, and confirm every item before acting.`;

// ─── Helpers ────────────────────────────────────────────────────────────────────

function transcriptText(messages: ChatMessage[]): string {
  return messages
    .map((m) => `${m.role === 'assistant' ? 'MedAI' : 'Patient'}: ${m.content}`)
    .join('\n');
}

function examText(exam: ExamFindings | undefined): string {
  if (!exam) return 'No examination findings provided.';
  const lines: string[] = [];
  const v = exam.vitals;
  if (v) {
    const vits = [
      v.bloodPressure && `BP ${v.bloodPressure}`,
      v.heartRate && `HR ${v.heartRate}`,
      v.respRate && `RR ${v.respRate}`,
      v.temperature && `Temp ${v.temperature}`,
      v.spo2 && `SpO2 ${v.spo2}`,
      v.weight && `Weight ${v.weight}`,
      v.height && `Height ${v.height}`,
    ].filter(Boolean);
    if (vits.length) lines.push(`Vitals: ${vits.join(', ')}`);
  }
  if (exam.generalInspection) lines.push(`General inspection: ${exam.generalInspection}`);
  if (exam.systemFindings) lines.push(`System findings: ${exam.systemFindings}`);
  if (exam.freeText) lines.push(`Additional notes: ${exam.freeText}`);
  return lines.length ? lines.join('\n') : 'No examination findings provided.';
}

function asBand(v: unknown): ProbabilityBand {
  return v === 'HIGH' || v === 'MODERATE' || v === 'LOW' ? v : 'LOW';
}
function asPriority(v: unknown): Priority {
  return v === 'ROUTINE' || v === 'URGENT' || v === 'STAT' ? v : 'ROUTINE';
}

// Normalise the model's JSON into a strict, safe ClinicalPackage.
function normalise(obj: Record<string, unknown>): ClinicalPackage {
  const diffs = Array.isArray(obj.differentials) ? obj.differentials : [];
  const invs = Array.isArray(obj.recommendedInvestigations) ? obj.recommendedInvestigations : [];
  const rx = Array.isArray(obj.prescriptionDraft) ? obj.prescriptionDraft : [];
  const sn = (obj.sickNote ?? {}) as Record<string, unknown>;

  return {
    generatedAt: new Date().toISOString(),
    chiefComplaint: asString(obj.chiefComplaint, 'Not specified'),
    differentials: diffs.map((d) => {
      const o = d as Record<string, unknown>;
      const prob = Math.max(0, Math.min(100, asNumber(o.probability)));
      return {
        diagnosis: asString(o.diagnosis, 'Unspecified'),
        icd10Code: asString(o.icd10Code),
        probability: prob,
        band: asBand(o.band),
        supportingFeatures: asStringArray(o.supportingFeatures),
        againstFeatures: asStringArray(o.againstFeatures),
      };
    }),
    recommendedInvestigations: invs.map((i) => {
      const o = i as Record<string, unknown>;
      return {
        name: asString(o.name, 'Unspecified'),
        rationale: asString(o.rationale),
        priority: asPriority(o.priority),
      };
    }),
    managementPlan: asStringArray(obj.managementPlan),
    prescriptionDraft: rx.map((p) => {
      const o = p as Record<string, unknown>;
      return {
        drug: asString(o.drug, 'Unspecified'),
        strength: asString(o.strength),
        form: asString(o.form),
        dose: asString(o.dose),
        route: asString(o.route),
        frequency: asString(o.frequency),
        duration: asString(o.duration),
        quantity: asString(o.quantity),
        scheduled: o.scheduled === true,
        caution: asString(o.caution),
      };
    }),
    sickNote: {
      recommended: sn.recommended === true,
      daysOff: asNumber(sn.daysOff),
      fitnessStatement: asString(sn.fitnessStatement),
      natureOfIllness: asString(sn.natureOfIllness, 'Acute medical condition'),
    },
    safetyNetting: asString(obj.safetyNetting),
    redFlags: asStringArray(obj.redFlags),
    disclaimer: DISCLAIMER,
  };
}

// ─── Generation ────────────────────────────────────────────────────────────────

export async function generateClinicalPackage(params: {
  transcript: ChatMessage[];
  summary: string | null;
  exam?: ExamFindings;
  demographics?: string;
  practiceMode?: PracticeMode;
}): Promise<ClinicalPackage> {
  const systemPrompt = params.practiceMode
    ? CLINICAL_PACKAGE_SYSTEM + PRACTICE_MODE_APPENDIX[params.practiceMode]
    : CLINICAL_PACKAGE_SYSTEM;

  const userContent = `PATIENT INTERVIEW TRANSCRIPT:
${transcriptText(params.transcript)}

STRUCTURED GP SUMMARY:
${params.summary ?? 'Not available.'}

DOCTOR'S EXAMINATION FINDINGS:
${examText(params.exam)}

KNOWN DEMOGRAPHICS: ${params.demographics ?? 'Not provided.'}

Produce the DRAFT clinical package as STRICT JSON per your schema.`;

  const resp = await client.messages.create({
    model: PACKAGE_MODEL,
    max_tokens: 5000, // rich SA cases need ~3.5–4k output tokens; headroom avoids truncation
    temperature: 0,
    system: systemPrompt,
    messages: [{ role: 'user', content: userContent }],
  });

  const raw = resp.content.map(b => (b.type === 'text' ? b.text : '')).join('');
  const parsed = extractJSON(raw) as Record<string, unknown>;
  return normalise(parsed);
}
