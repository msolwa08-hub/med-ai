const API_BASE = '/beta';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? `HTTP ${res.status}`);
  }
  return json.data as T;
}

export interface StartResult {
  sessionId: string;
  message: string;
}

export interface MessageResult {
  reply: string;
  isComplete: boolean;
  summary?: string;
}

export interface ValidateResult {
  valid: boolean;
}

export interface StatusResult {
  isValid: boolean;
  isComplete: boolean;
}

export interface SummaryResult {
  summary: string;
}

export const api = {
  validate: (accessKey: string) =>
    apiFetch<ValidateResult>('/validate', {
      method: 'POST',
      body: JSON.stringify({ accessKey }),
    }),

  startSession: (accessKey: string) =>
    apiFetch<StartResult>('/session/start', {
      method: 'POST',
      body: JSON.stringify({ accessKey }),
    }),

  sendMessage: (sessionId: string, message: string) =>
    apiFetch<MessageResult>('/session/message', {
      method: 'POST',
      body: JSON.stringify({ sessionId, message }),
    }),

  checkStatus: (sessionId: string) =>
    apiFetch<StatusResult>(`/session/${sessionId}/status`),

  getSummary: (sessionId: string) =>
    apiFetch<SummaryResult>(`/session/${sessionId}/summary`),
};
