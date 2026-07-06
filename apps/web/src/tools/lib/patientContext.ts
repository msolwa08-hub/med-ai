import { SUB_DEPARTMENTS, type DeptId } from '../config/departments';
import type { Patient } from '../fields/types';

// One line about THIS patient, sent with every assist/scan call so the AI
// asks specialty- and situation-appropriate questions (e.g. at EGA 32+4 it
// asks about contractions, not generic pain).
export function patientContext(p: Patient, dept: DeptId, subDept?: string): string {
  const i = p.intake;
  const h = p.history;
  const subDeptLabel = subDept ? SUB_DEPARTMENTS[dept]?.find(s => s.id === subDept)?.label : undefined;
  const bits = [
    [i.age, i.sex].filter(Boolean).join(' '),
    subDeptLabel ? `on ${subDeptLabel}` : '',
    dept === 'og' && (i.gravida || i.para) ? `G${i.gravida || '?'}P${i.para || '?'}` : '',
    dept === 'og' && i.gestationalAge ? `EGA ${i.gestationalAge}` : '',
    dept === 'og' && i.lmp ? `LMP ${i.lmp}` : '',
    dept === 'og' && h.antenatalVisits ? `ANC visits: ${h.antenatalVisits}` : '',
    dept === 'paeds' && i.weight ? `${i.weight}kg` : '',
    i.admissionDiagnosis ? `admitted with ${i.admissionDiagnosis}` : '',
    i.allergies ? `allergies: ${i.allergies}` : '',
    h.hivStatus ? `HIV: ${h.hivStatus}` : '',
  ].filter(Boolean);
  return bits.join(', ');
}
