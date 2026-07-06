import type { AssistField } from '../toolsApi';
import type { DeptId } from '../config/departments';
import type { IntakeData } from './types';
import { DEPT_FIELD_FRAGMENTS } from './departments';

// ─── AI-assisted logging field specs ────────────────────────────────────────
// One spec per data-entry section: the AssistPanel drives a one-question-at-a-
// time conversation and fills these fields from the intern's freeform answers.

export function intakeAssistFields(d: IntakeData, dept: DeptId): AssistField[] {
  const base: AssistField[] = [
    { key: 'name', label: 'Full Name', value: d.name, placeholder: 'Patient name' },
    { key: 'age', label: 'Age', value: d.age, placeholder: 'e.g. 34 years' },
    { key: 'sex', label: 'Sex', value: d.sex, hint: 'Male, Female or Other', kind: 'select', options: ['Male', 'Female', 'Other'] },
    { key: 'ward', label: 'Ward', value: d.ward, placeholder: 'Ward name' },
    { key: 'bed', label: 'Bed', value: d.bed, placeholder: 'Bed number' },
    { key: 'admissionDate', label: 'Admission Date', value: d.admissionDate },
    { key: 'allergies', label: 'Allergies', value: d.allergies, hint: 'NKDA or list', placeholder: 'NKDA or list' },
    { key: 'admissionDiagnosis', label: 'Admission Diagnosis', value: d.admissionDiagnosis, placeholder: 'Working diagnosis on admission' },
  ];
  const extra = DEPT_FIELD_FRAGMENTS[dept]?.intake;
  if (extra) base.push(...extra(d));
  return base;
}
