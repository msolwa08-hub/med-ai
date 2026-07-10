import type { AssistField } from '../toolsApi';
import type { DeptId } from '../config/departments';
import type { HistoryData } from './types';
import { DEPT_FIELD_FRAGMENTS } from './departments';

export function historyAssistFields(d: HistoryData, dept: DeptId, subDept?: string): AssistField[] {
  const s = (v: string | undefined) => v ?? ''; // legacy-safe: older records may lack newer fields
  const base: AssistField[] = [
    { key: 'chiefComplaint', label: 'Chief Complaint', value: s(d.chiefComplaint), placeholder: 'Main presenting complaint' },
    { key: 'hpi', label: 'Presenting Illness', value: s(d.hpi), hint: 'SOCRATES', kind: 'textarea', placeholder: 'SOCRATES: Site, Onset, Character, Radiation…' },
    { key: 'pmh', label: 'Past Medical History', value: s(d.pmh), kind: 'textarea', placeholder: 'Chronic conditions, previous hospitalisations, surgeries' },
    // High SA prevalence, broadly clinically relevant regardless of specialty
    // (sepsis workup, TB co-screening, drug interactions with ART) — asked
    // for every department, not just O&G.
    { key: 'hivStatus', label: 'HIV Status', value: d.hivStatus ?? '', hint: 'ask non-judgementally; if positive: ART regimen, adherence, last viral load/CD4', placeholder: 'Negative / Positive on ART (regimen, adherence) / Unknown — offer testing' },
    { key: 'medications', label: 'Medications', value: s(d.medications), kind: 'textarea', placeholder: 'Include herbal/traditional medicines' },
    { key: 'familyHistory', label: 'Family History', value: s(d.familyHistory), kind: 'textarea', placeholder: 'Relevant family history' },
    { key: 'socialHistory', label: 'Social History', value: s(d.socialHistory), kind: 'textarea', placeholder: 'Occupation, smoking, alcohol, home situation' },
    { key: 'ros', label: 'Review of Systems', value: s(d.ros), kind: 'textarea', placeholder: 'Relevant positive and negative findings' },
  ];
  const extra = DEPT_FIELD_FRAGMENTS[dept]?.history;
  if (extra) base.splice(extra.insertAt, 0, ...extra.fields(d, subDept));
  return base;
}
