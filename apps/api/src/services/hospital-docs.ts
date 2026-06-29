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
  ADMISSION_NOTE_SYSTEM,
  LAB_INTERPRETATION_SYSTEM,
  PATIENT_PRESENTATION_SYSTEM,
  OBS_NOTE_SYSTEM,
  GYNAE_NOTE_SYSTEM,
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

// ─── O&G inputs ─────────────────────────────────────────────────────────────

export interface ObsNoteInput {
  ageSex?: string;
  hospitalNumber?: string;
  ward?: string;
  gravidaPara?: string;
  lmp?: string;
  edd?: string;
  gestationalAge?: string;
  ancHistory?: string;
  presentingComplaint?: string;
  fetalMovements?: string;
  contractions?: string;
  fhr?: string;
  cervicalExam?: string;
  membranesLiquor?: string;
  examination?: string;
  investigations?: string;
}

export interface GynaeNoteInput {
  ageSex?: string;
  hospitalNumber?: string;
  ward?: string;
  gravidaPara?: string;
  lmp?: string;
  menstrualHistory?: string;
  contraception?: string;
  smearHistory?: string;
  presentingComplaint?: string;
  relevantHistory?: string;
  examination?: string;
  investigations?: string;
  workingDiagnosis?: string;
}

// ─── O&G outputs ─────────────────────────────────────────────────────────────

export interface ObsNote {
  generatedAt: string;
  ageSex: string;
  gravidaPara: string;
  gestationalAge: string;
  lmp: string;
  edd: string;
  ancSummary: string;
  currentPresentation: string;
  examinationFindings: string;
  fetalAssessment: string;
  cervicalFindings: string;
  impressionAndRisk: string;
  plan: string[];
  concerns: string[];
  disclaimer: string;
}

export interface GynaeNote {
  generatedAt: string;
  ageSex: string;
  gravidaPara: string;
  menstrualHistory: string;
  contraceptiveHistory: string;
  smearHistory: string;
  presentingComplaint: string;
  relevantHistory: string;
  examinationFindings: string;
  workingDiagnosis: string;
  differentials: string[];
  plan: string[];
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

// ─── Admission note ─────────────────────────────────────────────────────────

export interface AdmissionNoteInput {
  rotation?: string;
  ageSex?: string;
  hospitalNumber?: string;
  ward?: string;
  admissionDate?: string;
  chiefComplaint?: string;
  hpi?: string;
  pmh?: string;
  medications?: string;
  allergies?: string;
  familyHistory?: string;
  socialHistory?: string;
  ros?: string;
  examination?: string;
  investigations?: string;
  workingDiagnosis?: string;
  managementPlan?: string;
}

export interface AdmissionDifferential {
  diagnosis: string;
  icd10: string;
  rationale: string;
}

export interface AdmissionNote {
  generatedAt: string;
  patient: { ageSex: string; hospitalNumber: string; ward: string };
  admissionDate: string;
  presentingComplaint: string;
  historyOfPresentIllness: string;
  pastMedicalHistory: string;
  medications: string;
  allergies: string;
  familyHistory: string;
  socialHistory: string;
  reviewOfSystems: string;
  examinationFindings: string;
  investigations: string[];
  differentials: AdmissionDifferential[];
  workingDiagnosis: string;
  immediateManagement: string[];
  ongoingManagement: string[];
  concerns: string[];
  disclaimer: string;
}

export async function generateAdmissionNote(input: AdmissionNoteInput): Promise<AdmissionNote> {
  const userContent =
    `Structure an admission clerking note from the following.\n\n` +
    field('Rotation / specialty', input.rotation) +
    field('Patient (age/sex)', input.ageSex) +
    field('Hospital number', input.hospitalNumber) +
    field('Ward/unit', input.ward) +
    field('Admission date', input.admissionDate) +
    field('Chief complaint', input.chiefComplaint) +
    field('History of present illness', input.hpi) +
    field('Past medical history', input.pmh) +
    field('Current medications', input.medications) +
    field('Allergies', input.allergies) +
    field('Family history', input.familyHistory) +
    field('Social history', input.socialHistory) +
    field('Review of systems', input.ros) +
    field('Examination findings', input.examination) +
    field('Investigations ordered / results', input.investigations) +
    field('Intern working diagnosis', input.workingDiagnosis) +
    field('Intern management plan', input.managementPlan) +
    `\nReturn STRICT JSON per your schema.`;

  const o = await generate(ADMISSION_NOTE_SYSTEM, userContent);
  const p = objOf(o.patient);
  return {
    generatedAt: new Date().toISOString(),
    patient: {
      ageSex: asString(p.ageSex, input.ageSex ?? ''),
      hospitalNumber: asString(p.hospitalNumber, input.hospitalNumber ?? ''),
      ward: asString(p.ward, input.ward ?? ''),
    },
    admissionDate: asString(o.admissionDate, input.admissionDate ?? ''),
    presentingComplaint: asString(o.presentingComplaint, input.chiefComplaint ?? ''),
    historyOfPresentIllness: asString(o.historyOfPresentIllness),
    pastMedicalHistory: asString(o.pastMedicalHistory),
    medications: asString(o.medications),
    allergies: asString(o.allergies),
    familyHistory: asString(o.familyHistory),
    socialHistory: asString(o.socialHistory),
    reviewOfSystems: asString(o.reviewOfSystems),
    examinationFindings: asString(o.examinationFindings),
    investigations: asStringArray(o.investigations),
    differentials: arrOf(o.differentials).map((d) => ({
      diagnosis: asString(d.diagnosis),
      icd10: asString(d.icd10),
      rationale: asString(d.rationale),
    })),
    workingDiagnosis: asString(o.workingDiagnosis, input.workingDiagnosis ?? ''),
    immediateManagement: asStringArray(o.immediateManagement),
    ongoingManagement: asStringArray(o.ongoingManagement),
    concerns: asStringArray(o.concerns),
    disclaimer: DISCLAIMER,
  };
}

// ─── Lab interpretation ──────────────────────────────────────────────────────

export interface LabInterpretationInput {
  rotation?: string;
  ageSex?: string;
  workingDiagnosis?: string;
  medications?: string;
  labResults: string;
}

export interface LabGroupEntry {
  group: string;
  findings: string;
  significance: string;
}

export interface LabInterpretation {
  generatedAt: string;
  summary: string;
  critical: string[];
  trends: string[];
  groupedInterpretation: LabGroupEntry[];
  likelyCauses: string[];
  suggestedFurther: SuggestedLab[];
  concerns: string[];
  disclaimer: string;
}

export async function interpretLabResults(input: LabInterpretationInput): Promise<LabInterpretation> {
  const userContent =
    `Interpret the following lab results in clinical context.\n\n` +
    field('Rotation / specialty', input.rotation) +
    field('Patient (age/sex)', input.ageSex) +
    field('Working diagnosis', input.workingDiagnosis) +
    field('Current medications', input.medications) +
    `\nLAB RESULTS (one or more dates — interpret trends):\n${input.labResults}\n\nReturn STRICT JSON per your schema.`;

  const o = await generate(LAB_INTERPRETATION_SYSTEM, userContent);
  return {
    generatedAt: new Date().toISOString(),
    summary: asString(o.summary),
    critical: asStringArray(o.critical),
    trends: asStringArray(o.trends),
    groupedInterpretation: arrOf(o.groupedInterpretation).map((g) => ({
      group: asString(g.group),
      findings: asString(g.findings),
      significance: asString(g.significance),
    })),
    likelyCauses: asStringArray(o.likelyCauses),
    suggestedFurther: arrOf(o.suggestedFurther).map((l) => ({
      test: asString(l.test),
      rationale: asString(l.rationale),
      priority: l.priority === 'URGENT' ? 'URGENT' : 'ROUTINE',
    })),
    concerns: asStringArray(o.concerns),
    disclaimer: DISCLAIMER,
  };
}

// ─── Patient presentation ────────────────────────────────────────────────────

export type PresentationPoint = 'ADMISSION' | 'PROGRESS' | 'DISCHARGE';

export interface PatientPresentationInput {
  rotation?: string;
  ageSex?: string;
  hospitalNumber?: string;
  ward?: string;
  presentationPoint: PresentationPoint;
  hospitalDay?: string;
  clinicalData: string;
}

export interface PatientPresentation {
  generatedAt: string;
  title: string;
  point: PresentationPoint;
  presentation: string;
  keyPoints: string[];
  questionsToExpect: string[];
  disclaimer: string;
}

export async function generatePatientPresentation(input: PatientPresentationInput): Promise<PatientPresentation> {
  const userContent =
    `Generate an oral case presentation for the following patient.\n\n` +
    field('Rotation / specialty', input.rotation) +
    field('Patient (age/sex)', input.ageSex) +
    field('Hospital number', input.hospitalNumber) +
    field('Ward', input.ward) +
    field('Presentation point', input.presentationPoint) +
    field('Hospital day', input.hospitalDay) +
    `\nCLINICAL DATA:\n${input.clinicalData}\n\nReturn STRICT JSON per your schema.`;

  const o = await generate(PATIENT_PRESENTATION_SYSTEM, userContent);
  const pointRaw = asString(o.point);
  const point: PresentationPoint =
    pointRaw === 'ADMISSION' || pointRaw === 'PROGRESS' || pointRaw === 'DISCHARGE'
      ? pointRaw
      : input.presentationPoint;
  return {
    generatedAt: new Date().toISOString(),
    title: asString(o.title, `${input.presentationPoint} Presentation`),
    point,
    presentation: asString(o.presentation),
    keyPoints: asStringArray(o.keyPoints),
    questionsToExpect: asStringArray(o.questionsToExpect),
    disclaimer: DISCLAIMER,
  };
}

// ─── Daily ward note ─────────────────────────────────────────────────────────

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

// ─── Obstetric assessment note ───────────────────────────────────────────────

export async function generateObsNote(input: ObsNoteInput): Promise<ObsNote> {
  const userContent =
    `Structure an obstetric assessment note from the following clinical details.\n\n` +
    field('Patient (age/sex)', input.ageSex) +
    field('Hospital number', input.hospitalNumber) +
    field('Ward/unit', input.ward) +
    field('Gravida/Para (TPAL)', input.gravidaPara) +
    field('LMP', input.lmp) +
    field('EDD', input.edd) +
    field('Gestational age', input.gestationalAge) +
    field('ANC history / booking status', input.ancHistory) +
    field('Presenting complaint', input.presentingComplaint) +
    field('Fetal movements', input.fetalMovements) +
    field('Contractions', input.contractions) +
    field('Fetal heart rate / CTG', input.fhr) +
    field('Cervical examination', input.cervicalExam) +
    field('Membranes / liquor', input.membranesLiquor) +
    field('Examination findings', input.examination) +
    field('Investigations / results', input.investigations) +
    `\nReturn STRICT JSON per your schema.`;

  const o = await generate(OBS_NOTE_SYSTEM, userContent);
  return {
    generatedAt: new Date().toISOString(),
    ageSex: asString(o.ageSex, input.ageSex ?? ''),
    gravidaPara: asString(o.gravidaPara, input.gravidaPara ?? ''),
    gestationalAge: asString(o.gestationalAge, input.gestationalAge ?? ''),
    lmp: asString(o.lmp, input.lmp ?? ''),
    edd: asString(o.edd, input.edd ?? ''),
    ancSummary: asString(o.ancSummary),
    currentPresentation: asString(o.currentPresentation),
    examinationFindings: asString(o.examinationFindings),
    fetalAssessment: asString(o.fetalAssessment),
    cervicalFindings: asString(o.cervicalFindings),
    impressionAndRisk: asString(o.impressionAndRisk),
    plan: asStringArray(o.plan),
    concerns: asStringArray(o.concerns),
    disclaimer: DISCLAIMER,
  };
}

// ─── Gynaecology clerking note ───────────────────────────────────────────────

export async function generateGynaeNote(input: GynaeNoteInput): Promise<GynaeNote> {
  const userContent =
    `Structure a gynaecology clerking note from the following clinical details.\n\n` +
    field('Patient (age/sex)', input.ageSex) +
    field('Hospital number', input.hospitalNumber) +
    field('Ward/unit', input.ward) +
    field('Gravida/Para', input.gravidaPara) +
    field('LMP', input.lmp) +
    field('Menstrual history', input.menstrualHistory) +
    field('Contraception', input.contraception) +
    field('Smear history', input.smearHistory) +
    field('Presenting complaint', input.presentingComplaint) +
    field('Relevant history', input.relevantHistory) +
    field('Examination findings', input.examination) +
    field('Investigations / results', input.investigations) +
    field('Working diagnosis', input.workingDiagnosis) +
    `\nReturn STRICT JSON per your schema.`;

  const o = await generate(GYNAE_NOTE_SYSTEM, userContent);
  return {
    generatedAt: new Date().toISOString(),
    ageSex: asString(o.ageSex, input.ageSex ?? ''),
    gravidaPara: asString(o.gravidaPara, input.gravidaPara ?? ''),
    menstrualHistory: asString(o.menstrualHistory),
    contraceptiveHistory: asString(o.contraceptiveHistory),
    smearHistory: asString(o.smearHistory),
    presentingComplaint: asString(o.presentingComplaint),
    relevantHistory: asString(o.relevantHistory),
    examinationFindings: asString(o.examinationFindings),
    workingDiagnosis: asString(o.workingDiagnosis, input.workingDiagnosis ?? ''),
    differentials: asStringArray(o.differentials),
    plan: asStringArray(o.plan),
    concerns: asStringArray(o.concerns),
    disclaimer: DISCLAIMER,
  };
}
