const BETA_KEY = 'medai_beta_key';
const DOCTOR_KEY = 'medai_doctor_key';
const TOOLS_KEY = 'medai_tools_key';

export const storage = {
  getBetaKey: () => localStorage.getItem(BETA_KEY) ?? '',
  setBetaKey: (k: string) => localStorage.setItem(BETA_KEY, k),

  getDoctorKey: () => localStorage.getItem(DOCTOR_KEY) ?? '',
  setDoctorKey: (k: string) => localStorage.setItem(DOCTOR_KEY, k),

  getToolsKey: () => localStorage.getItem(TOOLS_KEY) ?? '',
  setToolsKey: (k: string) => localStorage.setItem(TOOLS_KEY, k),

  clear: () => {
    localStorage.removeItem(BETA_KEY);
    localStorage.removeItem(DOCTOR_KEY);
    localStorage.removeItem(TOOLS_KEY);
  },
};
