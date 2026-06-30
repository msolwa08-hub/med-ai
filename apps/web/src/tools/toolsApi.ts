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

export const toolsApi = {
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
