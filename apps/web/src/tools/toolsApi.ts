// Personal intern tools API client. Mirrors apps/api/src/routes/tools.ts.
// The personal tools key is sent as the x-tools-key header.

const API_BASE = '/tools';

export type Urgency = 'ROUTINE' | 'URGENT' | 'EMERGENCY';

export interface NamedCode { diagnosis: string; icd10Code: string }
export interface DischargeMed { drug: string; dose: string; route: string; frequency: string; duration: string }
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

export interface ReferralMed { drug: string; dose: string; frequency: string }
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

export interface SuggestedLab { test: string; rationale: string; priority: 'ROUTINE' | 'URGENT' }
export interface WardProblem { problem: string; status: string; plan: string }
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

export interface DischargeInput {
  ageSex?: string; hospitalNumber?: string; ward?: string;
  admissionDate?: string; dischargeDate?: string; primaryDiagnosis?: string; notes: string;
}
export interface ReferralInput {
  ageSex?: string; hospitalNumber?: string; referTo: string;
  urgency?: Urgency; specificQuestion?: string; notes: string;
}
export interface WardNoteInput {
  ageSex?: string; hospitalNumber?: string; ward?: string; hospitalDay?: string;
  workingDiagnosis?: string; previousNotes: string; labResults?: string; todayStatus?: string;
}
export interface AdmissionNoteInput {
  rotation?: string; ageSex?: string; hospitalNumber?: string; ward?: string; admissionDate?: string;
  chiefComplaint?: string; hpi?: string; pmh?: string; medications?: string; allergies?: string;
  familyHistory?: string; socialHistory?: string; ros?: string; examination?: string;
  investigations?: string; workingDiagnosis?: string; managementPlan?: string;
}
export interface LabInterpretInput {
  rotation?: string; ageSex?: string; workingDiagnosis?: string; medications?: string; labResults: string;
}
export interface PresentPatientInput {
  rotation?: string; ageSex?: string; hospitalNumber?: string; ward?: string;
  presentationPoint: 'ADMISSION' | 'PROGRESS' | 'DISCHARGE'; hospitalDay?: string; clinicalData: string;
}
export interface ObsNoteInput {
  ageSex?: string; hospitalNumber?: string; ward?: string;
  gravidaPara?: string; lmp?: string; edd?: string; gestationalAge?: string;
  ancHistory?: string; presentingComplaint?: string; fetalMovements?: string;
  contractions?: string; fhr?: string; cervicalExam?: string;
  membranesLiquor?: string; examination?: string; investigations?: string;
}
export interface GynaeNoteInput {
  ageSex?: string; hospitalNumber?: string; ward?: string;
  gravidaPara?: string; lmp?: string; menstrualHistory?: string;
  contraception?: string; smearHistory?: string; presentingComplaint?: string;
  relevantHistory?: string; examination?: string; investigations?: string; workingDiagnosis?: string;
}

export interface AdmissionDifferential { diagnosis: string; icd10: string; rationale: string; }
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
export interface ObsNote {
  generatedAt: string;
  ageSex: string; gravidaPara: string; gestationalAge: string;
  lmp: string; edd: string; ancSummary: string;
  currentPresentation: string; examinationFindings: string;
  fetalAssessment: string; cervicalFindings: string;
  impressionAndRisk: string; plan: string[]; concerns: string[]; disclaimer: string;
}
export interface GynaeNote {
  generatedAt: string;
  ageSex: string; gravidaPara: string; menstrualHistory: string;
  contraceptiveHistory: string; smearHistory: string;
  presentingComplaint: string; relevantHistory: string;
  examinationFindings: string; workingDiagnosis: string;
  differentials: string[]; plan: string[]; concerns: string[]; disclaimer: string;
}
export interface LabGroupEntry { group: string; findings: string; significance: string; }
export interface LabInterpretation {
  generatedAt: string; summary: string; critical: string[]; trends: string[];
  groupedInterpretation: LabGroupEntry[]; likelyCauses: string[];
  suggestedFurther: SuggestedLab[]; concerns: string[]; disclaimer: string;
}
export interface PatientPresentation {
  generatedAt: string; title: string; point: 'ADMISSION' | 'PROGRESS' | 'DISCHARGE';
  presentation: string; keyPoints: string[]; questionsToExpect: string[]; disclaimer: string;
}

async function call<T>(path: string, toolsKey: string | null, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (toolsKey) headers['x-tools-key'] = toolsKey;
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error ?? `HTTP ${res.status}`);
  return json.data as T;
}

export const toolsApi = {
  validate: (toolsKey: string) => call<{ valid: boolean }>('/validate', null, { toolsKey }),
  discharge: (k: string, input: DischargeInput) => call<{ document: DischargeSummary }>('/discharge', k, input),
  referral: (k: string, input: ReferralInput) => call<{ document: ReferralLetter }>('/referral', k, input),
  wardNote: (k: string, input: WardNoteInput) => call<{ document: WardNote }>('/ward-note', k, input),
  admissionNote: (k: string, input: AdmissionNoteInput) => call<{ document: AdmissionNote }>('/admission-note', k, input),
  interpretLabs: (k: string, input: LabInterpretInput) => call<{ document: LabInterpretation }>('/interpret-labs', k, input),
  presentPatient: (k: string, input: PresentPatientInput) => call<{ document: PatientPresentation }>('/present-patient', k, input),
  obsNote: (k: string, input: ObsNoteInput) => call<{ document: ObsNote }>('/obs-note', k, input),
  gynaeNote: (k: string, input: GynaeNoteInput) => call<{ document: GynaeNote }>('/gynae-note', k, input),
};

const TOOLS_KEY_STORAGE = 'medai_tools_key';
export const toolsKeyStore = {
  get: (): string | null => {
    try { return localStorage.getItem(TOOLS_KEY_STORAGE); } catch { return null; }
  },
  set: (k: string) => localStorage.setItem(TOOLS_KEY_STORAGE, k),
  clear: () => localStorage.removeItem(TOOLS_KEY_STORAGE),
};
