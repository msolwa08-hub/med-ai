const H = (key: string) => ({ 'x-doctor-key': key, 'Content-Type': 'application/json' });

async function get<T>(url: string, key: string): Promise<T> {
  const res = await fetch(url, { headers: H(key) });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

async function del<T>(url: string, key: string): Promise<T> {
  const res = await fetch(url, { method: 'DELETE', headers: H(key) });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

export const cockpitApi = {
  sessions: (key: string) =>
    get<{ sessions: unknown[] }>('/cockpit/sessions', key),

  session: (key: string, id: string) =>
    get<unknown>(`/cockpit/sessions/${id}`, key),

  deleteSession: (key: string, id: string) =>
    del<{ deleted: boolean }>(`/cockpit/sessions/${id}`, key),

  analytics: (key: string) =>
    get<{ total: number; completed: number; active: number; byDepartment: Record<string, number> }>(
      '/cockpit/analytics',
      key
    ),

  validate: async (key: string): Promise<boolean> => {
    try {
      await get('/cockpit/analytics', key);
      return true;
    } catch {
      return false;
    }
  },
};
