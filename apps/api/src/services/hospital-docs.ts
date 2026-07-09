import Anthropic from '@anthropic-ai/sdk';
import { MODELS, createMessage } from '../lib/models.js';
import { extractJSON } from '../lib/json-extract.js';
import { MEDAI_SYSTEM_PROMPT } from './hod-prompt.js';
import {
  DISCHARGE_SYSTEM, REFERRAL_SYSTEM, WARD_NOTE_SYSTEM, ADMISSION_NOTE_SYSTEM,
  LAB_INTERPRET_SYSTEM, PRESENT_PATIENT_SYSTEM, OBS_NOTE_SYSTEM, GYNAE_NOTE_SYSTEM,
  ROUND_NOTE_SYSTEM,
} from './medai-prompt.js';


async function generate<T>(system: string, content: string): Promise<T> {
  const response = await createMessage({
    model: MODELS.reasoning,
    max_tokens: 2048,
    system,
    messages: [{ role: 'user', content }],
  });
  const text = response.content[0]?.type === 'text' ? response.content[0].text : '{}';
  return extractJSON<T>(text);
}

// ---- Types ----

export interface DischargeSummary {
  patientSummary: string;
  diagnosis: string;
  treatmentProvided: string;
  dischargeMedications: string[];
  followUpInstructions: string;
  warningSignsToReturn: string[];
  disclaimer: string;
}

export interface ReferralLetter {
  referralLetter: string;
  urgency: 'routine' | 'urgent' | 'emergency';
  disclaimer: string;
}

export interface WardNote {
  note: string;
  disclaimer: string;
}

export interface AdmissionNote {
  admissionNote: string;
  workingDiagnosis: string;
  differentials: string[];
  initialPlan: string[];
  disclaimer: string;
}

export interface LabInterpretation {
  interpretation: string;
  keyAbnormalities: string[];
  clinicalSignificance: string;
  recommendations: string[];
  disclaimer: string;
}

export interface PatientPresentation {
  presentation: string;
  oneLineSummary: string;
  disclaimer: string;
}

export interface ObsNote {
  note: string;
  gestationalAge: string;
  maternalStatus: string;
  fetalStatus: string;
  plan: string[];
  disclaimer: string;
}

export interface GynaeNote {
  note: string;
  workingDiagnosis: string;
  differentials: string[];
  plan: string[];
  disclaimer: string;
}

export interface RoundNote {
  summary: string;
  disclaimer: string;
}

export interface RoundNoteInput {
  patientName: string;
  age: string;
  sex: string;
  ward: string;
  admissionDiagnosis: string;
  dayOfAdmission: number;
  subjective: string;
  vitals: string;
  examination: string;
  investigations: string;
  problems: Array<{ problem: string; workingDx: string; management: string[] }>;
  plan: string;
  pending: string;
}

// ---- Generators ----

// Referral, discharge and round synthesis run under the HOD persona: consultant
// depth of reasoning, transcription-ready concision in the output fields.
const hod = (docSystem: string) => `${MEDAI_SYSTEM_PROMPT}\n\n${docSystem}`;

export function generateDischargeSummary(input: Record<string, unknown>): Promise<DischargeSummary> {
  return generate<DischargeSummary>(hod(DISCHARGE_SYSTEM), JSON.stringify(input));
}

export function generateReferralLetter(input: Record<string, unknown>): Promise<ReferralLetter> {
  return generate<ReferralLetter>(hod(REFERRAL_SYSTEM), JSON.stringify(input));
}

export function generateWardNote(input: Record<string, unknown>): Promise<WardNote> {
  return generate<WardNote>(WARD_NOTE_SYSTEM, JSON.stringify(input));
}

export function generateAdmissionNote(input: Record<string, unknown>): Promise<AdmissionNote> {
  return generate<AdmissionNote>(ADMISSION_NOTE_SYSTEM, JSON.stringify(input));
}

export function interpretLabResults(input: Record<string, unknown>): Promise<LabInterpretation> {
  return generate<LabInterpretation>(LAB_INTERPRET_SYSTEM, JSON.stringify(input));
}

export function generatePatientPresentation(input: Record<string, unknown>): Promise<PatientPresentation> {
  return generate<PatientPresentation>(PRESENT_PATIENT_SYSTEM, JSON.stringify(input));
}

export function generateObsNote(input: Record<string, unknown>): Promise<ObsNote> {
  return generate<ObsNote>(OBS_NOTE_SYSTEM, JSON.stringify(input));
}

export function generateGynaeNote(input: Record<string, unknown>): Promise<GynaeNote> {
  return generate<GynaeNote>(GYNAE_NOTE_SYSTEM, JSON.stringify(input));
}

export function generateRoundNote(input: RoundNoteInput): Promise<RoundNote> {
  return generate<RoundNote>(hod(ROUND_NOTE_SYSTEM), JSON.stringify(input));
}
