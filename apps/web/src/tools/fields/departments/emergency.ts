import type { DeptFieldFragments } from '../types';

// The undifferentiated-ED discriminators the base fields don't capture, drawn
// from the consultant mental model (§1: threats-to-life on a clock) and the
// SATS/TEWS structured tool (§5) of the Emergency Medicine dossier. Hints
// carry the consultant's reasoning so the intern learns WHY each is asked.
export const emergencyFields: DeptFieldFragments = {
  intake: d => [
    {
      key: 'triageCategory',
      label: 'Triage Category (SATS)',
      value: d.triageCategory ?? '',
      hint: 'colour is the HIGHER of the TEWS band or a clinical discriminator — one red discriminator (airway threat, shock, active seizure, GCS/AVPU = P or U, threatened limb) overrides a low TEWS. A "yellow" trending toward "orange" in the queue is a re-triage event, not something to wait out',
      placeholder: 'e.g. Orange — TEWS 4 (yellow) upgraded by chest-pain discriminator',
    },
  ],

  history: {
    // Right after Chief Complaint, before the free-text HPI — the clock and
    // the mechanism frame everything that follows.
    insertAt: 1,
    fields: d => [
      {
        key: 'onsetMechanism',
        label: 'Time of Onset / Mechanism',
        value: d.onsetMechanism ?? '',
        hint: 'the ED clock starts here — door-to-needle STEMI <30min, thrombolysis window <4.5h, sepsis antibiotics <1h. For trauma, a dangerous mechanism alone (fall >3m, high-speed MVC, ejection) can mandate imaging/precautions regardless of how well the patient looks now',
        placeholder: 'e.g. central chest pain, onset 14:20, ongoing 45min; or MVC ~60km/h, unrestrained, ejected',
      },
    ],
  },

  assessment: {
    insertAt: 1,
    fields: d => [
      { key: 'primarySurvey', label: 'Primary Survey', value: d.primarySurvey ?? '', kind: 'textarea', hint: 'ABCDE with interventions', placeholder: 'A: … B: … C: … D: … E: …' },
      {
        key: 'prehospitalStatus',
        label: 'Pre-hospital Treatment & Resuscitation Status',
        value: d.prehospitalStatus ?? '',
        kind: 'textarea',
        hint: 'what EMS already gave changes your differential and dosing — naloxone wearing off before the opioid does, atropine already on board, analgesia already given. In the critically ill or frail, agree and document the resuscitation status/ceiling of care now, before the arrest call, not during it',
        placeholder: 'e.g. paramedics gave IV morphine 5mg + IN naloxone 0.4mg en route; for full resuscitation, family not yet contacted',
      },
    ],
  },
};
