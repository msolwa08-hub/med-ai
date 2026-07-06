import type { DeptId } from '../config/departments';
import type { Patient } from '../fields/types';

// ─── Helpers ────────────────────────────────────────────────────────────────

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function newPatient(dept: DeptId): Patient {
  return {
    id: uid(),
    intake: {
      name: '', age: '', sex: '', ward: '', bed: '',
      admissionDate: new Date().toISOString().slice(0, 10),
      admissionDiagnosis: '', allergies: '',
    },
    history: {
      chiefComplaint: '', hpi: '', pmh: '', medications: '',
      familyHistory: '', socialHistory: '', ros: '',
    },
    assessment: { vitals: '', examination: '', investigations: '', dayOfAdmission: '1' },
    problems: [],
    roundData: { plan: '', pending: '', subjective: '' },
  };
}
