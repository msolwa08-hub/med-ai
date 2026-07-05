const BASE = '';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function post<T>(url: string, body: unknown, key?: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (key) headers['x-beta-key'] = key;
  const res = await fetch(`${BASE}${url}`, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res.ok) throw new ApiError(res.status, await res.text());
  return res.json() as Promise<T>;
}

async function get<T>(url: string, key?: string): Promise<T> {
  const headers: Record<string, string> = {};
  if (key) headers['x-beta-key'] = key;
  const res = await fetch(`${BASE}${url}`, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

export const api = {
  startSession: (key: string, opts?: { department?: string; ageSex?: string; chiefComplaintHint?: string }) =>
    post<{ sessionId: string; message: string }>('/beta/start', opts ?? {}, key),

  chat: (key: string, sessionId: string, message: string, transcript?: { role: string; content: string }[]) =>
    post<{ message: string; completed: boolean }>('/beta/chat', { sessionId, message, transcript }, key),

  getSession: (sessionId: string) =>
    get<{ id: string; status: string; messages: { role: string; content: string }[]; department?: string }>(
      `/beta/session/${sessionId}`
    ),
};
