// ─── Department config ──────────────────────────────────────────────────────

export const DEPARTMENTS = [
  { id: 'medicine', label: 'General Medicine', color: 'blue', abbr: 'MED', icon: '🏥' },
  { id: 'surgery', label: 'Surgery', color: 'indigo', abbr: 'SURG', icon: '🔪' },
  { id: 'og', label: 'O&G', color: 'pink', abbr: 'O&G', icon: '🤱' },
  { id: 'paeds', label: 'Paediatrics', color: 'orange', abbr: 'PAEDS', icon: '👶' },
  { id: 'icu', label: 'ICU / HDU', color: 'red', abbr: 'ICU', icon: '💊' },
  { id: 'emergency', label: 'Emergency', color: 'rose', abbr: 'ED', icon: '🚨' },
  { id: 'psych', label: 'Psychiatry', color: 'purple', abbr: 'PSYCH', icon: '🧠' },
  { id: 'ortho', label: 'Orthopaedics', color: 'teal', abbr: 'ORTHO', icon: '🦴' },
  { id: 'anaes', label: 'Anaesthetics', color: 'cyan', abbr: 'ANAES', icon: '💉' },
] as const;

export type DeptId = (typeof DEPARTMENTS)[number]['id'];

export interface SubDeptOption {
  id: string;
  label: string;
  icon: string;
}

// Ward/unit within a department — only configured where the clinical picture
// actually changes enough to matter (an antenatal patient and a labour-ward
// patient are both "O&G" but need entirely different questions and exam
// fields). Departments without an entry here skip straight to the patient
// view, same as before.
export const SUB_DEPARTMENTS: Partial<Record<DeptId, SubDeptOption[]>> = {
  og: [
    { id: 'antenatal', label: 'Antenatal Ward', icon: '🤰' },
    { id: 'labour', label: 'Labour Ward', icon: '👶' },
    { id: 'postnatal', label: 'Postnatal Ward', icon: '🍼' },
    { id: 'gynae', label: 'Gynaecology', icon: '⚕️' },
  ],
  paeds: [
    { id: 'general', label: 'General Paediatrics', icon: '🏥' },
    { id: 'neonatal', label: 'Neonatal / Nursery', icon: '👶' },
    // SA district/regional hospitals run a dedicated SAM corner — the WHO ten
    // steps (F-75 first, cautious fluids, hypoglycaemia/hypothermia vigilance)
    // differ enough from general-ward care to earn their own silo.
    { id: 'malnutrition', label: 'Malnutrition / SAM Corner', icon: '🍲' },
  ],
};
