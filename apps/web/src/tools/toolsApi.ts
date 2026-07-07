const H = (key: string) => ({ 'x-tools-key': key, 'Content-Type': 'application/json' });

// These POSTs are pure generation calls (no side effects the intern cares about
// re-running), so a transient 5xx or a dropped connection under ward load must
// not throw away ~40s of captured work. Retry idempotent reads/generations with
// exponential backoff before surfacing the error; a 4xx (bad key, bad input) is
// the client's fault and is never retried.
const RETRYABLE_ATTEMPTS = 3;
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < RETRYABLE_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      // Don't retry deterministic client errors — only transient server/network.
      if (err instanceof HttpError && err.status < 500) throw err;
      if (attempt < RETRYABLE_ATTEMPTS - 1) await sleep(600 * 2 ** attempt); // 600ms, 1.2s
    }
  }
  throw lastErr;
}

class HttpError extends Error {
  constructor(public status: number, body: string) {
    super(body || `HTTP ${status}`);
    this.name = 'HttpError';
  }
}

async function post<T>(url: string, key: string, body: unknown): Promise<T> {
  return withRetry(async () => {
    const res = await fetch(url, { method: 'POST', headers: H(key), body: JSON.stringify(body) });
    if (!res.ok) throw new HttpError(res.status, await res.text());
    return res.json() as Promise<T>;
  });
}

async function get<T>(url: string, key: string): Promise<T> {
  return withRetry(async () => {
    const res = await fetch(url, { headers: H(key) });
    if (!res.ok) throw new HttpError(res.status, await res.text());
    return res.json() as Promise<T>;
  });
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
  protocolTitle?: string;
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
  protocolTitle?: string;
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

export interface HospitalProtocolSummary {
  id: string;
  dept: string;
  title: string;
  sourceFilename?: string;
  charCount: number;
  chunkCount: number;
  uploadedAt: string;
}

export type ImageModality =
  | 'ecg'
  | 'ctg'
  | 'cxr'
  | 'xray'
  | 'ultrasound'
  | 'ct'
  | 'eeg'
  | 'abg'
  | 'wound'
  | 'other';

export interface ImageAnalysisResult {
  modality: ImageModality;
  technicalQuality: string;
  findings: string[];
  impression: string;
  redFlags: string[];
  confidence: ScanConfidence;
  injectText: string;
  disclaimer: string;
}

export interface WardRoundUpdate {
  date: string;
  onHistory: string;
  onExamination: string;
  examsToRepeatToday?: string[];
  suggestedInvestigations: string[];
  suggestedManagement: string[];
  consultantLogicExplanation: string;
}

export interface ScreeningPrompt {
  trigger: string;
  category: 'monitoring' | 'prophylaxis' | 'investigation' | 'safety';
  prompts: string[];
  why: string;
}

export interface WardRoundDeltaResponse extends WardRoundUpdate {
  screening: ScreeningPrompt[];
  safety: SafetyWarning[];
  disclaimer: string;
}

export type LegalFormType = 'mhca-72hr' | 'j88' | 'surgical-consent';

export interface LegalFormSection {
  heading: string;
  content: string;
  status: 'prefilled' | 'requires-input' | 'requires-examination';
}

export interface LegalFormDraft {
  formTitle: string;
  sections: LegalFormSection[];
  missingInfo: string[];
  legalNotes: string[];
  disclaimer: string;
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

  analyzeImage: (key: string, input: { dept: string; subDept?: string; modality: ImageModality; imageBase64: string; mediaType: string; context?: string }) =>
    post<ImageAnalysisResult>('/tools/analyze-image', key, input),

  wardRoundDelta: (key: string, input: { dept: string; subDept?: string; patientContext: string; problems: string[]; history?: string; generalExam?: string; focusedExam?: string; medications?: string; allergies?: string; previousRounds: WardRoundUpdate[]; todaySubjective?: string; todayObjective?: string; vitals?: string; newResults?: string; imageFindings?: string[] }) =>
    post<WardRoundDeltaResponse>('/tools/ward-round-delta', key, input),

  screening: (key: string, problems: string[]) =>
    post<{ screening: ScreeningPrompt[] }>('/tools/screening', key, { problems }),

  legalForm: (key: string, input: { formType: LegalFormType; dept: string; patientRecord: Record<string, unknown>; context?: string }) =>
    post<LegalFormDraft>('/tools/legal-form', key, input),

  listProtocols: (key: string, dept: string) =>
    get<{ protocols: HospitalProtocolSummary[] }>(`/tools/protocols?dept=${encodeURIComponent(dept)}`, key),

  addProtocolText: (key: string, input: { dept: string; title: string; content: string }) =>
    post<HospitalProtocolSummary>('/tools/protocols', key, input),

  uploadProtocolFile: async (key: string, input: { dept: string; title: string; file: File }): Promise<HospitalProtocolSummary> => {
    const form = new FormData();
    form.append('dept', input.dept);
    form.append('title', input.title);
    form.append('file', input.file);
    const res = await fetch('/tools/protocols/upload', { method: 'POST', headers: { 'x-tools-key': key }, body: form });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<HospitalProtocolSummary>;
  },

  deleteProtocol: async (key: string, id: string): Promise<void> => {
    const res = await fetch(`/tools/protocols/${encodeURIComponent(id)}`, { method: 'DELETE', headers: { 'x-tools-key': key } });
    if (!res.ok) throw new Error(await res.text());
  },

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
