// Doctor cockpit API client. Mirrors apps/api/src/routes/cockpit.ts.
// The doctor key is sent as the x-doctor-key header on every protected call.

const API_BASE = '/cockpit';

export type ProbabilityBand = 'HIGH' | 'MODERATE' | 'LOW';
export type Priority = 'ROUTINE' | 'URGENT' | 'STAT';
export type ConsultStatus = 'TAKING_HISTORY' | 'AWAITING_DOCTOR' | 'IN_REVIEW' | 'SIGNED';

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

export interface Differential {
  diagnosis: string;
  icd10Code: string;
  probability: number;
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
  scheduled: boolean;
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

export interface ConsultListItem {
  sessionId: string;
  chiefComplaint: string;
  isComplete: boolean;
  consultStatus: ConsultStatus;
  hasPackage: boolean;
  createdAt: number;
  completedAt: number | null;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ConsultDetail {
  sessionId: string;
  chiefComplaint: string;
  consultStatus: ConsultStatus;
  isComplete: boolean;
  transcript: ChatMessage[];
  summary: string | null;
  examFindings: ExamFindings | null;
  clinicalPackage: ClinicalPackage | null;
}

async function call<T>(path: string, doctorKey: string | null, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {};
  // Only declare a JSON content-type when we actually send a body — a bodyless
  // POST (e.g. package generation) is rejected by Fastify if it claims JSON.
  if (options?.body) headers['Content-Type'] = 'application/json';
  if (doctorKey) headers['x-doctor-key'] = doctorKey;
  const res = await fetch(`${API_BASE}${path}`, { headers, ...options });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? `HTTP ${res.status}`);
  }
  return json.data as T;
}

export const cockpitApi = {
  validate: (doctorKey: string) =>
    call<{ valid: boolean }>('/validate', null, {
      method: 'POST',
      body: JSON.stringify({ doctorKey }),
    }),

  listConsults: (doctorKey: string) =>
    call<{ consults: ConsultListItem[] }>('/consults', doctorKey),

  getConsult: (doctorKey: string, id: string) =>
    call<ConsultDetail>(`/consults/${id}`, doctorKey),

  saveExam: (doctorKey: string, id: string, exam: ExamFindings) =>
    call<ConsultDetail>(`/consults/${id}/exam`, doctorKey, {
      method: 'POST',
      body: JSON.stringify(exam),
    }),

  generatePackage: (doctorKey: string, id: string, practiceMode?: string) =>
    call<{ package: ClinicalPackage }>(`/consults/${id}/package`, doctorKey, {
      method: 'POST',
      body: practiceMode ? JSON.stringify({ practiceMode }) : undefined,
    }),

  confirmPackage: (doctorKey: string, id: string, pkg: ClinicalPackage) =>
    call<ConsultDetail>(`/consults/${id}/confirm`, doctorKey, {
      method: 'POST',
      body: JSON.stringify({ package: pkg }),
    }),
};

const DOCTOR_KEY_STORAGE = 'medai_doctor_key';

export const doctorKeyStore = {
  get: (): string | null => {
    try {
      return localStorage.getItem(DOCTOR_KEY_STORAGE);
    } catch {
      return null;
    }
  },
  set: (key: string) => localStorage.setItem(DOCTOR_KEY_STORAGE, key),
  clear: () => localStorage.removeItem(DOCTOR_KEY_STORAGE),
};
