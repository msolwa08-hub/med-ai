import type { AssistField } from '../toolsApi';
import type { DeptId } from '../config/departments';
import type { AssessmentData } from './types';
import { DEPT_FIELD_FRAGMENTS } from './departments';

export function assessmentAssistFields(d: AssessmentData, dept: DeptId, subDept?: string): AssistField[] {
  const s = (v: string | undefined) => v ?? ''; // legacy-safe: older records may lack newer fields
  const base: AssistField[] = [
    { key: 'dayOfAdmission', label: 'Day of Admission', value: s(d.dayOfAdmission), placeholder: 'e.g. 1' },
    { key: 'vitals', label: 'Vitals', value: s(d.vitals), hint: 'BP, HR, RR, Temp, SpO2', kind: 'textarea', placeholder: 'Temp / BP / HR / RR / SpO2 / GCS / MEOWS' },
    // Exam is deliberately two-stage: a GENERAL survey done on every patient,
    // then a FOCUSED systems exam driven by the presenting complaint (chest
    // pain -> CVS/resp; headache in pregnancy -> reflexes + fundi). The
    // department-specific exam fields splice in AFTER these, and the round
    // engine synthesises expected-vs-actual against the history.
    { key: 'generalExam', label: 'General Examination', value: d.generalExam ?? '', kind: 'textarea', hint: 'done on everyone: appearance/distress, pallor, jaundice, cyanosis, clubbing, lymphadenopathy, hydration, oedema, JVP — the survey that catches what the complaint did not point you at', placeholder: 'e.g. alert, no distress; pale conjunctivae; no jaundice; well hydrated; no oedema' },
    { key: 'examination', label: 'Focused Examination', value: s(d.examination), kind: 'textarea', hint: 'driven by the history — examine the systems the presenting complaint implicates (CVS, Resp, Abdo, Neuro), and record the RELEVANT NEGATIVES, not just the positives', placeholder: 'Systems relevant to the complaint — with the pertinent negatives' },
    { key: 'investigations', label: 'Investigations', value: s(d.investigations), hint: 'bloods, imaging, other results', kind: 'textarea', placeholder: 'Lab results, imaging, ECG findings' },
  ];
  // insertAt in fragments is expressed against this 5-field base; obstetric/
  // paeds exam blocks are authored to land after the focused exam (index 4).
  const extra = DEPT_FIELD_FRAGMENTS[dept]?.assessment;
  if (extra) base.splice(extra.insertAt, 0, ...extra.fields(d, subDept));
  return base;
}
