// Personal intern tools — hospital document generation.
//
// Three input-driven generators that reuse the structured-generation pattern:
//   - Discharge summary
//   - Referral letter
//   - Daily ward-round / progress note (+ lab-trend interpretation + suggested labs)
//
// Each takes the doctor's structured fields plus pasted ward notes/labs and
// returns a structured document. Everything is a DRAFT aide for the responsible
// clinician to review, correct, and sign — never a substitute for judgement.

import Anthropic from '@anthropic-ai/sdk';
import { betaConfig } from '../lib/beta-config.js';
import {
  DISCHARGE_SUMMARY_SYSTEM,
  REFERRAL_LETTER_SYSTEM,
  DAILY_WARD_NOTE_SYSTEM,
} from './medai-prompt.js';
import { extractJSON, asString, asStringArray } from '../lib/json-extract.js';

const client = new Anthropic({ apiKey: betaConfig.ANTHROPIC_API_KEY });
const DOC_MODEL = 'claude-sonnet-4-6';

// ─── Inputs ─────────────────────────────────────────────────────────────────

export interface DischargeInput {
  specialty?: string;
  ageSex?: string;
  hospitalNumber?: string;
  ward?: string;
  admissionDate?: string;
  dischargeDate?: string;
  primaryDiagnosis?: string;
  notes: string;
}

export type Urgency = 'ROUTINE' | 'URGENT' | 'EMERGENCY';

export interface ReferralInput {
  specialty?: string;
  ageSex?: string;
  hospitalNumber?: string;
  referTo: string;
  urgency?: Urgency;
  specificQuestion?: string;
  notes: string;
}

export interface WardNoteInput {
  specialty?: string;
  ageSex?: string;
  hospitalNumber?: string;
  ward?: string;
  hospitalDay?: string;
  workingDiagnosis?: string;
  previousNotes: string;
  labResults?: string;
  todayStatus?: string;
}

// ─── Output documents ───────────────────────────────────────────────────────

export interface NamedCode {
  diagnosis: string;
  icd10Code: string;
}
export interface DischargeMed {
  drug: string;
  dose: string;
  route: string;
  frequency: string;
  duration: string;
}
export interface DischargeSummary {
  generatedAt: string;
  patient: { ageSex: string; hospitalNumber: string; ward: string };
  admissionDate: string;
  dischargeDate: string;
  dischargeDiagnoses: NamedCode[];
  presentingComplaint: string;
  courseInHospital: string;
  significantInvestigations: string[];
  procedures: string[];
  treatmentGiven: string[];
  conditionOnDischarge: string;
  dischargeMedications: DischargeMed[];
  followUp: string[];
  outstandingResults: string[];
  gpActions: string[];
  patientAdvice: string;
  disclaimer: string;
}

export interface ReferralMed {
  drug: string;
  dose: string;
  frequency: string;
}
export interface ReferralLetter {
  generatedAt: string;
  to: { specialty: string; facility: string };
  urgency: Urgency;
  patient: { ageSex: string; hospitalNumber: string };
  reasonForReferral: string;
  clinicalQuestion: string;
  presentingComplaint: string;
  relevantHistory: string;
  examinationFindings: string;
  investigations: string[];
  currentManagement: string[];
  currentMedications: ReferralMed[];
  summary: string;
  disclaimer: string;
}

export interface SuggestedLab {
  test: string;
  rationale: string;
  priority: 'ROUTINE' | 'URGENT';
}
export interface WardProblem {
  problem: string;
  status: string;
  plan: string;
}
export interface WardNote {
  generatedAt: string;
  patient: { ageSex: string; hospitalNumber: string; ward: string; hospitalDay: string };
  workingDiagnosis: string;
  subjective: string;
  objective: { vitals: string; examination: string; relevantLabs: string[] };
  labTrends: string[];
  assessment: string;
  problemList: WardProblem[];
  plan: string[];
  suggestedLabs: SuggestedLab[];
  tasks: string[];
  concerns: string[];
  disclaimer: string;
}

const DISCLAIMER =
  'AI-generated DRAFT to assist documentation. Not a clinical record until reviewed, ' +
  'corrected, and signed by the responsible clinician. Verify every detail against the source notes.';

// ─── Helpers ────────────────────────────────────────────────────────────────

function field(label: string, value?: string): string {
  return value && value.trim() ? `${label}: ${value.trim()}\n` : '';
}

async function generate(system: string, userContent: string): Promise<Record<string, unknown>> {
  const resp = await client.messages.create({
    model: DOC_MODEL,
    max_tokens: 4000,
    temperature: 0,
    system,
    messages: [{ role: 'user', content: userContent }],
  });
  const raw = resp.content[0].type === 'text' ? resp.content[0].text : '';
  return extractJSON(raw) as Record<string, unknown>;
}

function asUrgency(v: unknown, fallback: Urgency = 'ROUTINE'): Urgency {
  return v === 'ROUTINE' || v === 'URGENT' || v === 'EMERGENCY' ? v : fallback;
}
function objOf(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' ? (v as Record<string, unknown>) : {};
}
function arrOf(v: unknown): Record<string, unknown>[] {
  return Array.isArray(v) ? v.map(objOf) : [];
}

// ─── Discharge summary ──────────────────────────────────────────────────────

export async function generateDischargeSummary(input: DischargeInput): Promise<DischargeSummary> {
  const userContent =
    `Draft a discharge summary from the following.\n\n` +
    field('Specialty / rotation', input.specialty) +
    field('Patient (age/sex)', input.ageSex) +
    field('Hospital number', input.hospitalNumber) +
    field('Ward/unit', input.ward) +
    field('Admission date', input.admissionDate) +
    field('Discharge date', input.dischargeDate) +
    field('Primary diagnosis', input.primaryDiagnosis) +
    `\nWARD NOTES / CLINICAL COURSE (verbatim, paste):\n${input.notes}\n\nReturn STRICT JSON per your schema.`;

  const o = await generate(DISCHARGE_SUMMARY_SYSTEM, userContent);
  const p = objOf(o.patient);
  return {
    generatedAt: new Date().toISOString(),
    patient: {
      ageSex: asString(p.ageSex, input.ageSex ?? ''),
      hospitalNumber: asString(p.hospitalNumber, input.hospitalNumber ?? ''),
      ward: asString(p.ward, input.ward ?? ''),
    },
    admissionDate: asString(o.admissionDate, input.admissionDate ?? ''),
    dischargeDate: asString(o.dischargeDate, input.dischargeDate ?? ''),
    dischargeDiagnoses: arrOf(o.dischargeDiagnoses).map((d) => ({
      diagnosis: asString(d.diagnosis),
      icd10Code: asString(d.icd10Code),
    })),
    presentingComplaint: asString(o.presentingComplaint),
    courseInHospital: asString(o.courseInHospital),
    significantInvestigations: asStringArray(o.significantInvestigations),
    procedures: asStringArray(o.procedures),
    treatmentGiven: asStringArray(o.treatmentGiven),
    conditionOnDischarge: asString(o.conditionOnDischarge),
    dischargeMedications: arrOf(o.dischargeMedications).map((m) => ({
      drug: asString(m.drug),
      dose: asString(m.dose),
      route: asString(m.route),
      frequency: asString(m.frequency),
      duration: asString(m.duration),
    })),
    followUp: asStringArray(o.followUp),
    outstandingResults: asStringArray(o.outstandingResults),
    gpActions: asStringArray(o.gpActions),
    patientAdvice: asString(o.patientAdvice),
    disclaimer: DISCLAIMER,
  };
}

// ─── Referral letter ────────────────────────────────────────────────────────

export async function generateReferralLetter(input: ReferralInput): Promise<ReferralLetter> {
  const userContent =
    `Draft a referral letter from the following.\n\n` +
    field('Specialty / rotation', input.specialty) +
    field('Patient (age/sex)', input.ageSex) +
    field('Hospital number', input.hospitalNumber) +
    field('Refer to (specialty/unit)', input.referTo) +
    field('Urgency', input.urgency) +
    field('Specific question being asked', input.specificQuestion) +
    `\nCLINICAL DETAILS (verbatim, paste):\n${input.notes}\n\nReturn STRICT JSON per your schema.`;

  const o = await generate(REFERRAL_LETTER_SYSTEM, userContent);
  const to = objOf(o.to);
  const p = objOf(o.patient);
  return {
    generatedAt: new Date().toISOString(),
    to: { specialty: asString(to.specialty, input.referTo), facility: asString(to.facility) },
    urgency: asUrgency(o.urgency, input.urgency ?? 'ROUTINE'),
    patient: {
      ageSex: asString(p.ageSex, input.ageSex ?? ''),
      hospitalNumber: asString(p.hospitalNumber, input.hospitalNumber ?? ''),
    },
    reasonForReferral: asString(o.reasonForReferral),
    clinicalQuestion: asString(o.clinicalQuestion, input.specificQuestion ?? ''),
    presentingComplaint: asString(o.presentingComplaint),
    relevantHistory: asString(o.relevantHistory),
    examinationFindings: asString(o.examinationFindings),
    investigations: asStringArray(o.investigations),
    currentManagement: asStringArray(o.currentManagement),
    currentMedications: arrOf(o.currentMedications).map((m) => ({
      drug: asString(m.drug),
      dose: asString(m.dose),
      frequency: asString(m.frequency),
    })),
    summary: asString(o.summary),
    disclaimer: DISCLAIMER,
  };
}

// ─── Daily ward note ────────────────────────────────────────────────────────

export async function generateWardNote(input: WardNoteInput): Promise<WardNote> {
  const userContent =
    `Write today's daily ward-round / progress note and suggest investigations.\n\n` +
    field('Specialty / rotation', input.specialty) +
    field('Patient (age/sex)', input.ageSex) +
    field('Hospital number', input.hospitalNumber) +
    field('Ward', input.ward) +
    field('Hospital day', input.hospitalDay) +
    field('Working diagnosis', input.workingDiagnosis) +
    `\nPREVIOUS DAYS' WARD NOTES (verbatim, paste):\n${input.previousNotes}\n\n` +
    (input.labResults?.trim() ? `LAB RESULTS (across days — interpret trends):\n${input.labResults}\n\n` : '') +
    (input.todayStatus?.trim() ? `TODAY'S STATUS / OVERNIGHT EVENTS:\n${input.todayStatus}\n\n` : '') +
    `Return STRICT JSON per your schema.`;

  const o = await generate(DAILY_WARD_NOTE_SYSTEM, userContent);
  const p = objOf(o.patient);
  const obj = objOf(o.objective);
  return {
    generatedAt: new Date().toISOString(),
    patient: {
      ageSex: asString(p.ageSex, input.ageSex ?? ''),
      hospitalNumber: asString(p.hospitalNumber, input.hospitalNumber ?? ''),
      ward: asString(p.ward, input.ward ?? ''),
      hospitalDay: asString(p.hospitalDay, input.hospitalDay ?? ''),
    },
    workingDiagnosis: asString(o.workingDiagnosis, input.workingDiagnosis ?? ''),
    subjective: asString(o.subjective),
    objective: {
      vitals: asString(obj.vitals),
      examination: asString(obj.examination),
      relevantLabs: asStringArray(obj.relevantLabs),
    },
    labTrends: asStringArray(o.labTrends),
    assessment: asString(o.assessment),
    problemList: arrOf(o.problemList).map((pr) => ({
      problem: asString(pr.problem),
      status: asString(pr.status),
      plan: asString(pr.plan),
    })),
    plan: asStringArray(o.plan),
    suggestedLabs: arrOf(o.suggestedLabs).map((l) => ({
      test: asString(l.test),
      rationale: asString(l.rationale),
      priority: l.priority === 'URGENT' ? 'URGENT' : 'ROUTINE',
    })),
    tasks: asStringArray(o.tasks),
    concerns: asStringArray(o.concerns),
    disclaimer: DISCLAIMER,
  };
}
