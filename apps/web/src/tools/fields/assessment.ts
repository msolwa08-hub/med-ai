import type { AssistField } from '../toolsApi';
import type { DeptId } from '../config/departments';
import type { AssessmentData } from './types';
import { DEPT_FIELD_FRAGMENTS } from './departments';

export function assessmentAssistFields(d: AssessmentData, dept: DeptId, subDept?: string): AssistField[] {
  const base: AssistField[] = [
    { key: 'dayOfAdmission', label: 'Day of Admission', value: d.dayOfAdmission, placeholder: 'e.g. 1' },
    { key: 'vitals', label: 'Vitals', value: d.vitals, hint: 'BP, HR, RR, Temp, SpO2', kind: 'textarea', placeholder: 'Temp / BP / HR / RR / SpO2 / GCS / MEOWS' },
    { key: 'examination', label: 'Examination', value: d.examination, kind: 'textarea', placeholder: 'General, CVS, Respiratory, Abdomen, Neuro' },
    { key: 'investigations', label: 'Investigations', value: d.investigations, hint: 'bloods, imaging, other results', kind: 'textarea', placeholder: 'Lab results, imaging, ECG findings' },
  ];
  const extra = DEPT_FIELD_FRAGMENTS[dept]?.assessment;
  if (extra) base.splice(extra.insertAt, 0, ...extra.fields(d, subDept));
  return base;
}
