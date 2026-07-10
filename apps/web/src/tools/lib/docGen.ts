import { toolsApi } from '../toolsApi';
import type { DeptId } from '../config/departments';
import type { Patient } from '../fields/types';

// ─── One-tap document generation ─────────────────────────────────────────────
// Every output endpoint takes the SAME payload — the record plus the problem
// list — so any chart document is one tap from anywhere the patient is loaded.
// This centralises the payload + the per-type call/format so the cockpit's
// QuickDocs rail and the Documents tab share exactly one implementation.

export type DocType = 'admission' | 'presentation' | 'wardnote' | 'discharge' | 'referral' | 'labs';

export interface DocSpec {
  id: DocType;
  label: string;
  /** One-line hint of when to reach for it. */
  blurb: string;
}

export const DOC_SPECS: DocSpec[] = [
  { id: 'admission', label: 'Admission note', blurb: 'The formal clerking note for the folder' },
  { id: 'presentation', label: 'Ward-round presentation', blurb: 'The one-liner + SBAR for the round' },
  { id: 'wardnote', label: 'Ward note (SOAP)', blurb: 'Today’s progress note' },
  { id: 'discharge', label: 'Discharge summary', blurb: 'Diagnosis, treatment, meds, follow-up, red flags' },
  { id: 'referral', label: 'Referral letter', blurb: 'To another discipline, with urgency' },
  { id: 'labs', label: 'Interpret labs', blurb: 'Read the investigations against the picture' },
];

export function docBase(patient: Patient, dept: DeptId) {
  return {
    dept,
    ...patient.intake,
    ...patient.history,
    ...patient.assessment,
    // Every document reflects the working diagnosis + plan, not just raw clerking.
    problems: patient.problems.map(p => ({
      problem: p.problem,
      workingDx: p.workingDx,
      differentials: p.differentials,
      management: p.management,
    })),
  };
}

/** Generate one chart document, formatted as plain text ready for the folder. */
export async function generateDoc(toolsKey: string, type: DocType, patient: Patient, dept: DeptId): Promise<string> {
  const base = docBase(patient, dept);
  switch (type) {
    case 'admission': {
      const r = await toolsApi.admissionNote(toolsKey, { ...patient.intake, ...patient.history, ...patient.assessment, dayOfAdmission: patient.assessment.dayOfAdmission });
      return `ADMISSION NOTE\n==============\n\n${r.admissionNote}\n\nWORKING DIAGNOSIS: ${r.workingDiagnosis}\n\nDIFFERENTIALS:\n${r.differentials.map((d, i) => `${i + 1}. ${d}`).join('\n')}\n\nINITIAL PLAN:\n${r.initialPlan.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\n---\n${r.disclaimer}`;
    }
    case 'discharge': {
      const r = await toolsApi.discharge(toolsKey, base);
      return `DISCHARGE SUMMARY\n=================\n\n${r.patientSummary}\n\nDIAGNOSIS: ${r.diagnosis}\n\nTREATMENT: ${r.treatmentProvided}\n\nMEDICATIONS:\n${r.dischargeMedications.map((m, i) => `${i + 1}. ${m}`).join('\n')}\n\nFOLLOW-UP: ${r.followUpInstructions}\n\nRETURN IF:\n${r.warningSignsToReturn.map(w => `• ${w}`).join('\n')}\n\n---\n${r.disclaimer}`;
    }
    case 'referral': {
      const r = await toolsApi.referral(toolsKey, base);
      return `REFERRAL LETTER (${r.urgency.toUpperCase()})\n${'='.repeat(30)}\n\n${r.referralLetter}\n\n---\n${r.disclaimer}`;
    }
    case 'wardnote': {
      const r = await toolsApi.wardNote(toolsKey, base);
      return `${r.note}\n\n---\n${r.disclaimer}`;
    }
    case 'labs': {
      const r = await toolsApi.interpretLabs(toolsKey, base);
      return `LAB INTERPRETATION\n==================\n\n${r.interpretation}\n\nKEY ABNORMALITIES:\n${r.keyAbnormalities.map(a => `• ${a}`).join('\n')}\n\nCLINICAL SIGNIFICANCE:\n${r.clinicalSignificance}\n\nRECOMMENDATIONS:\n${r.recommendations.map(x => `• ${x}`).join('\n')}\n\n---\n${r.disclaimer}`;
    }
    case 'presentation': {
      const r = await toolsApi.presentPatient(toolsKey, base);
      return `${r.oneLineSummary}\n\n${r.presentation}\n\n---\n${r.disclaimer}`;
    }
  }
}
