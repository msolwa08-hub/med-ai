// Turn the structured documents into clean, copy-pasteable plain-text records
// the intern can drop into hospital systems or print. Empty sections are omitted.

import type { DischargeSummary, ReferralLetter, WardNote } from './toolsApi';

function section(title: string, body: string): string {
  return body.trim() ? `${title}:\n${body.trim()}\n\n` : '';
}
function bullets(title: string, items: string[]): string {
  const clean = items.filter((i) => i && i.trim());
  return clean.length ? `${title}:\n${clean.map((i) => `  - ${i}`).join('\n')}\n\n` : '';
}

export function formatDischarge(d: DischargeSummary): string {
  let out = 'DISCHARGE SUMMARY\n================\n';
  const hdr = [
    d.patient.ageSex && `Patient: ${d.patient.ageSex}`,
    d.patient.hospitalNumber && `Hospital No: ${d.patient.hospitalNumber}`,
    d.patient.ward && `Ward: ${d.patient.ward}`,
  ].filter(Boolean).join('   ');
  if (hdr) out += hdr + '\n';
  const dates = [
    d.admissionDate && `Admitted: ${d.admissionDate}`,
    d.dischargeDate && `Discharged: ${d.dischargeDate}`,
  ].filter(Boolean).join('   ');
  if (dates) out += dates + '\n';
  out += '\n';

  if (d.dischargeDiagnoses.length) {
    out += 'DISCHARGE DIAGNOSIS:\n';
    out += d.dischargeDiagnoses.map((x) => `  - ${x.diagnosis}${x.icd10Code ? ` (${x.icd10Code})` : ''}`).join('\n') + '\n\n';
  }
  out += section('PRESENTING COMPLAINT', d.presentingComplaint);
  out += section('COURSE IN HOSPITAL', d.courseInHospital);
  out += bullets('INVESTIGATIONS', d.significantInvestigations);
  out += bullets('PROCEDURES', d.procedures);
  out += bullets('TREATMENT GIVEN', d.treatmentGiven);
  out += section('CONDITION ON DISCHARGE', d.conditionOnDischarge);
  if (d.dischargeMedications.length) {
    out += 'DISCHARGE MEDICATIONS:\n';
    out += d.dischargeMedications.map((m) =>
      `  - ${[m.drug, m.dose, m.route, m.frequency, m.duration].filter(Boolean).join(' · ')}`).join('\n') + '\n\n';
  }
  out += bullets('FOLLOW-UP', d.followUp);
  out += bullets('OUTSTANDING RESULTS', d.outstandingResults);
  out += bullets('ACTIONS FOR GP / CLINIC', d.gpActions);
  out += section('ADVICE TO PATIENT', d.patientAdvice);
  out += `---\n${d.disclaimer}\n`;
  return out;
}

export function formatReferral(r: ReferralLetter): string {
  let out = 'REFERRAL LETTER\n===============\n';
  out += `To: ${[r.to.specialty, r.to.facility].filter(Boolean).join(', ')}   [${r.urgency}]\n`;
  const re = [r.patient.ageSex, r.patient.hospitalNumber && `Hospital No: ${r.patient.hospitalNumber}`].filter(Boolean).join('   ');
  if (re) out += `Re: ${re}\n`;
  out += '\n';
  out += section('REASON FOR REFERRAL', r.reasonForReferral);
  out += section('CLINICAL QUESTION', r.clinicalQuestion);
  out += section('PRESENTING COMPLAINT', r.presentingComplaint);
  out += section('RELEVANT HISTORY', r.relevantHistory);
  out += section('EXAMINATION FINDINGS', r.examinationFindings);
  out += bullets('INVESTIGATIONS', r.investigations);
  out += bullets('CURRENT MANAGEMENT', r.currentManagement);
  if (r.currentMedications.length) {
    out += 'CURRENT MEDICATIONS:\n';
    out += r.currentMedications.map((m) => `  - ${[m.drug, m.dose, m.frequency].filter(Boolean).join(' · ')}`).join('\n') + '\n\n';
  }
  out += section('SUMMARY', r.summary);
  out += `---\n${r.disclaimer}\n`;
  return out;
}

export function formatWardNote(w: WardNote): string {
  let out = 'DAILY WARD ROUND NOTE\n=====================\n';
  const hdr = [
    w.patient.ageSex && `Patient: ${w.patient.ageSex}`,
    w.patient.hospitalNumber && `Hosp No: ${w.patient.hospitalNumber}`,
    w.patient.ward && `Ward: ${w.patient.ward}`,
    w.patient.hospitalDay && `Day: ${w.patient.hospitalDay}`,
  ].filter(Boolean).join('   ');
  if (hdr) out += hdr + '\n';
  if (w.workingDiagnosis) out += `Working Dx: ${w.workingDiagnosis}\n`;
  out += '\n';

  out += section('S (Subjective)', w.subjective);
  let objBody = '';
  if (w.objective.vitals) objBody += `  Vitals: ${w.objective.vitals}\n`;
  if (w.objective.examination) objBody += `  Exam: ${w.objective.examination}\n`;
  if (w.objective.relevantLabs.length) objBody += `  Labs:\n${w.objective.relevantLabs.map((l) => `    - ${l}`).join('\n')}\n`;
  if (objBody) out += `O (Objective):\n${objBody}\n`;
  out += bullets('LAB TRENDS', w.labTrends);
  out += section('A (Assessment)', w.assessment);
  if (w.problemList.length) {
    out += 'PROBLEM LIST:\n';
    out += w.problemList.map((p) => `  - ${p.problem}${p.status ? ` [${p.status}]` : ''}${p.plan ? `: ${p.plan}` : ''}`).join('\n') + '\n\n';
  }
  out += bullets('PLAN', w.plan);
  if (w.suggestedLabs.length) {
    out += 'SUGGESTED LABS / INVESTIGATIONS:\n';
    out += w.suggestedLabs.map((l) => `  - [${l.priority}] ${l.test}${l.rationale ? ` — ${l.rationale}` : ''}`).join('\n') + '\n\n';
  }
  out += bullets('TASKS', w.tasks);
  out += bullets('⚠ CONCERNS', w.concerns);
  out += `---\n${w.disclaimer}\n`;
  return out;
}
