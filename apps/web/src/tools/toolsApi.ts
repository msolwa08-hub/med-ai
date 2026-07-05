const H = (key: string) => ({ 'x-tools-key': key, 'Content-Type': 'application/json' });

async function post<T>(url: string, key: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: 'POST', headers: H(key), body: JSON.stringify(body) });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

async function get<T>(url: string, key: string): Promise<T> {
  const res = await fetch(url, { headers: H(key) });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

export interface Problem {
  id: string;
  problem: string;
  workingDx: string;
  differentials: string[];
  management: string[];
  status: 'active' | 'resolving' | 'resolved';
  icd10?: string;
  stgCondition?: string;
}

export interface RoundNote {
  summary: string;
  disclaimer: string;
}

export interface HistorySession {
  sessionId: string;
  patientUrl: string;
}

export interface HistorySummary {
  sessionId: string;
  completed: boolean;
  summary?: string;
  complaints?: string[];
  history?: string;
  messages: { role: string; content: string }[];
}

export interface AssistField {
  key: string;
  label: string;
  value: string;
  hint?: string;
  // Presentation-only (ignored by the API): how the field renders in the
  // details list when tapped for manual editing.
  kind?: 'text' | 'textarea' | 'select';
  options?: string[];
  placeholder?: string;
}

export interface AssistTurn {
  role: 'assistant' | 'user';
  content: string;
}

export interface AssistResponse {
  updates: Record<string, string>;
  nextQuestion: string;
  done: boolean;
}

export type ScanConfidence = 'high' | 'medium' | 'low';

export interface ScanFieldResult {
  value: string;
  confidence: ScanConfidence;
  note?: string;
}

export interface ScanResponse {
  results: Record<string, ScanFieldResult>;
  unreadable: string[];
  overallNote: string;
}

export interface SafetyWarning {
  severity: 'BLOCK' | 'WARN';
  drug: string;
  category: 'ALLERGY' | 'PREGNANCY' | 'RENAL' | 'INTERACTION';
  reason: string;
}

export interface SuggestedProblem {
  problem: string;
  workingDx: string;
  icd10?: string;
  stgCondition?: string;
  differentials: string[];
  management: string[];
}

export interface SuggestProblemsResponse {
  problems: SuggestedProblem[];
  safety: SafetyWarning[];
  note: string;
}

export interface InteractionCheckResponse {
  warnings: SafetyWarning[];
  medCount: number;
  polypharmacy: boolean;
}

export const toolsApi = {
  assist: (key: string, input: { dept: string; subDept?: string; section: string; fields: AssistField[]; transcript: AssistTurn[]; context?: string }) =>
    post<AssistResponse>('/tools/assist', key, input),

  suggestProblems: (key: string, input: { dept: string; intake: unknown; history: unknown; assessment: unknown }) =>
    post<SuggestProblemsResponse>('/tools/suggest-problems', key, input),

  interactionCheck: (key: string, input: { medicationsText?: string; allergiesText?: string; plannedLines?: string[]; problemCodes?: string[] }) =>
    post<InteractionCheckResponse>('/tools/interaction-check', key, input),

  scanNotes: (key: string, input: { dept: string; subDept?: string; section: string; fields: AssistField[]; imageBase64: string; mediaType: string; context?: string }) =>
    post<ScanResponse>('/tools/scan-notes', key, input),

  validate: async (key: string): Promise<boolean> => {
    try {
      await post('/tools/validate', key, {});
      return true;
    } catch {
      return false;
    }
  },

  startHistory: (key: string, opts: { department?: string; ageSex?: string; chiefComplaintHint?: string }) =>
    post<HistorySession>('/tools/start-history', key, opts),

  importHistory: (key: string, sessionId: string) =>
    get<HistorySummary>(`/tools/import-history/${sessionId}`, key),

  roundNote: (key: string, input: unknown) =>
    post<RoundNote>('/tools/round-note', key, input),

  discharge: (key: string, input: unknown) =>
    post<{ patientSummary: string; diagnosis: string; treatmentProvided: string; dischargeMedications: string[]; followUpInstructions: string; warningSignsToReturn: string[]; disclaimer: string }>('/tools/discharge', key, input),

  referral: (key: string, input: unknown) =>
    post<{ referralLetter: string; urgency: string; disclaimer: string }>('/tools/referral', key, input),

  wardNote: (key: string, input: unknown) =>
    post<{ note: string; disclaimer: string }>('/tools/ward-note', key, input),

  admissionNote: (key: string, input: unknown) =>
    post<{ admissionNote: string; workingDiagnosis: string; differentials: string[]; initialPlan: string[]; disclaimer: string }>('/tools/admission-note', key, input),

  interpretLabs: (key: string, input: unknown) =>
    post<{ interpretation: string; keyAbnormalities: string[]; clinicalSignificance: string; recommendations: string[]; disclaimer: string }>('/tools/interpret-labs', key, input),

  presentPatient: (key: string, input: unknown) =>
    post<{ presentation: string; oneLineSummary: string; disclaimer: string }>('/tools/present-patient', key, input),

  obsNote: (key: string, input: unknown) =>
    post<{ note: string; gestationalAge: string; maternalStatus: string; fetalStatus: string; plan: string[]; disclaimer: string }>('/tools/obs-note', key, input),

  gynaeNote: (key: string, input: unknown) =>
    post<{ note: string; workingDiagnosis: string; differentials: string[]; plan: string[]; disclaimer: string }>('/tools/gynae-note', key, input),
};
