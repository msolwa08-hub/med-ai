const BETA_KEY = 'medai_beta_key';
const DOCTOR_KEY = 'medai_doctor_key';
const TOOLS_KEY = 'medai_tools_key';
const TOOLS_STATE = 'medai_tools_state_v1';

export interface ToolsPersistedState {
  dept: string | null;
  patients: unknown[];
  activePatientId: string | null;
}

export const storage = {
  getBetaKey: () => localStorage.getItem(BETA_KEY) ?? '',
  setBetaKey: (k: string) => localStorage.setItem(BETA_KEY, k),

  getDoctorKey: () => localStorage.getItem(DOCTOR_KEY) ?? '',
  setDoctorKey: (k: string) => localStorage.setItem(DOCTOR_KEY, k),

  getToolsKey: () => localStorage.getItem(TOOLS_KEY) ?? '',
  setToolsKey: (k: string) => localStorage.setItem(TOOLS_KEY, k),

  // The intern's whole working set (patients, active department) survives
  // refreshes, tab discards, and phone-browser evictions. Ward reality:
  // losing a round's worth of entries to a reload is not acceptable.
  getToolsState: (): ToolsPersistedState | null => {
    try {
      const raw = localStorage.getItem(TOOLS_STATE);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as ToolsPersistedState;
      if (!parsed || !Array.isArray(parsed.patients)) return null;
      return parsed;
    } catch {
      return null;
    }
  },
  setToolsState: (state: ToolsPersistedState) => {
    try {
      localStorage.setItem(TOOLS_STATE, JSON.stringify(state));
    } catch {
      // Storage full or unavailable — in-memory state still works for the session.
    }
  },
  clearToolsState: () => localStorage.removeItem(TOOLS_STATE),

  clear: () => {
    localStorage.removeItem(BETA_KEY);
    localStorage.removeItem(DOCTOR_KEY);
    localStorage.removeItem(TOOLS_KEY);
    localStorage.removeItem(TOOLS_STATE);
  },
};
