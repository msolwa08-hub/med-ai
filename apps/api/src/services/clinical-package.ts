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
import type { ChatMessage } from './beta-engine.js';

const client = new Anthropic({ apiKey: betaConfig.ANTHROPIC_API_KEY });
const PACKAGE_MODEL = 'claude-sonnet-4-6';

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

const DISCLAIMER =
  'AI-generated DRAFT decision support. Not a diagnosis or prescription. ' +
  'Dr. Patel must independently review, edit, and confirm every item before acting.';

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

// Best-effort repair of a truncated JSON object (e.g. if the model is cut off):
// drop any dangling partial token and close all still-open strings/brackets.
function repairTruncatedJSON(s: string): string {
  const closers: string[] = [];
  let inStr = false;
  let esc = false;
  let lastSafe = 0; // index just after the last complete value/structural boundary
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') {
        inStr = false;
        lastSafe = i + 1;
      }
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === '{') closers.push('}');
    else if (ch === '[') closers.push(']');
    else if (ch === '}' || ch === ']') {
      closers.pop();
      lastSafe = i + 1;
    } else if (ch === ',') lastSafe = i + 1;
  }
  let out = s.slice(0, lastSafe).replace(/,\s*$/, '');
  while (closers.length) out += closers.pop();
  return out;
}

function extractJSON(raw: string): unknown {
  const fenced = raw.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
  const start = fenced.indexOf('{');
  if (start === -1) {
    throw new Error('No JSON object found in model response');
  }
  const end = fenced.lastIndexOf('}');
  const candidate = end > start ? fenced.slice(start, end + 1) : fenced.slice(start);
  try {
    return JSON.parse(candidate);
  } catch {
    // Likely truncated output — salvage what we can rather than 500.
    return JSON.parse(repairTruncatedJSON(fenced.slice(start)));
  }
}

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}
function asNumber(v: unknown, fallback = 0): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.map((x) => asString(x)).filter(Boolean) : [];
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
}): Promise<ClinicalPackage> {
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
    system: CLINICAL_PACKAGE_SYSTEM,
    messages: [{ role: 'user', content: userContent }],
  });

  const raw = resp.content[0].type === 'text' ? resp.content[0].text : '';
  const parsed = extractJSON(raw) as Record<string, unknown>;
  return normalise(parsed);
}
