import type { AssistField } from '../../toolsApi';
import type { DeptFieldFragments } from '../types';

// Internal Medicine field fragments — the discriminators a physician takes on
// every acute medical admission that the base fields don't already capture.
// Drawn from the consultant mental model and SA-reality sections of the
// Internal Medicine dossier. HIV status is already a base history field, so it
// is deliberately NOT duplicated here. Hints carry the consultant's reasoning so
// the intern learns WHY each is asked, not just what to record.

export const medicineFields: DeptFieldFragments = {
  history: {
    // Inserted right after Past Medical History (base index 3) — the medical
    // baseline sits with the comorbidity picture it interprets.
    insertAt: 3,
    fields: (): AssistField[] => [
      {
        key: 'chronicDiseaseControl',
        label: 'Chronic Disease Control',
        value: '',
        kind: 'textarea',
        hint: 'not just "has DM/HTN" — the CONTROL: last HbA1c/BP/creatinine, complications, and adherence. Uncontrolled disease is often the reason for the admission and reframes the whole risk picture',
        placeholder: 'e.g. T2DM 8y — last HbA1c 11%, retinopathy, on metformin+insulin, poor adherence; HTN — home BP 170s, defaulted 2/12',
      },
      {
        key: 'tbScreen',
        label: 'TB Symptom Screen',
        value: '',
        hint: 'SA-mandated on every patient (higher-yield in HIV): current cough, fever, night sweats, weight loss. Any one positive → send sputum GeneXpert. Prior TB + treatment outcome also matters (relapse, MDR risk)',
        placeholder: 'e.g. cough 3/52 + night sweats + 6kg loss — screen POSITIVE, GeneXpert sent; or all 4 negative; prior PTB 2021 completed',
      },
      {
        key: 'functionalStatus',
        label: 'Functional Status / Exercise Tolerance',
        value: '',
        hint: 'the baseline everything is measured against: how far/how many stairs before this illness vs now — quantifies dyspnoea and frailty, and frames the ceiling-of-care conversation before you need it',
        placeholder: 'e.g. baseline: unlimited, walks to shops; now: breathless at 10m, sleeps upright on 4 pillows (was 1)',
      },
    ],
  },
};
