import type { DeptFieldFragments } from '../types';

// Orthopaedics & Trauma field fragments — the trauma/ortho discriminators the
// base fields don't capture, drawn from the consultant mental model (§1: the
// fixed order of questions — is the patient dying, is the limb dying, THEN
// the fracture itself) and §2.1-2.3/2.10 of the Orthopaedics dossier.
//
// Ortho now owns a DEDICATED fragment (previously it borrowed Surgery's
// surgicalHistoryFields — pre-theatre questions written for the acute
// abdomen: pain migration, anticoagulants, last meal, anaesthetic history).
// Those questions still matter for an ortho patient going to theatre, but
// they are not the load-bearing ortho discriminators, and forcing Surgery's
// insertAt/wording onto every trauma clerking obscured the ortho-specific
// ones. Splitting them out lets each department's history read like that
// department's actual routine. (Judgment call — see implementation note.)
//
// Hints carry the consultant's reasoning so the intern learns WHY each is
// asked, not just what to record.
export const orthoFields: DeptFieldFragments = {
  intake: d => [
    { key: 'procedure', label: 'Injury / Procedure', value: d.procedure ?? '', placeholder: 'Fracture / joint / procedure' },
    { key: 'popDay', label: 'Post-op Day', value: d.popDay ?? '', placeholder: 'Day post-op (if applicable)' },
    { key: 'immobilisation', label: 'Immobilisation', value: d.immobilisation ?? '', placeholder: 'POP, backslab, brace, etc.' },
    { key: 'dvtProphylaxis', label: 'DVT Prophylaxis', value: d.dvtProphylaxis ?? '', placeholder: 'LMWH / TED stockings / etc.' },
    {
      key: 'weightBearing',
      label: 'Weight-Bearing Status',
      value: d.weightBearing ?? '',
      hint: 'the "rehabilitate" step of reduce→hold→rehabilitate — write the explicit instruction (which limb, NWB/PWB/FWB, for how long), not just "mobilise". This is the part juniors forget to plan for on day one and it is what actually determines the patient\'s functional outcome',
      placeholder: 'e.g. non-weight-bearing Lt leg 6/52; or weight-bearing as tolerated',
    },
  ],

  // Mechanism/energy and the open-wound/tetanus picture frame the whole
  // trauma clerking the way the ED clock frames Emergency's — inserted right
  // after Chief Complaint (base index 1), before the free-text HPI, so they
  // are answered before the story gets told rather than backfilled after.
  history: {
    insertAt: 1,
    fields: d => [
      {
        key: 'mechanismEnergy',
        label: 'Mechanism & Energy',
        value: d.mechanismEnergy ?? '',
        kind: 'textarea',
        hint: 'high-energy (MVC, fall from height, GSW) vs low-energy (fall from standing) predicts the Gustilo grade and the associated-injury pattern before you even see the wound. High energy = expose the whole patient and log-roll — the "second injury" (ipsilateral hip with a femur fracture, spine with a calcaneal fracture) is missed until you specifically look for it, not found by accident',
        placeholder: 'e.g. MVC ~80km/h, unrestrained driver; or low-energy fall from standing height at home',
      },
      {
        key: 'openWoundGustilo',
        label: 'Open Wound / Gustilo + Time Since Injury',
        value: d.openWoundGustilo ?? '',
        kind: 'textarea',
        hint: 'a punctum near a closed-looking fracture is open until proven otherwise; grade every GSW fracture as open regardless of skin wound size. Gustilo grade is only finalised in theatre after debridement — record what you see now. Time since injury drives the antibiotic clock (target <1h, never delayed for X-ray) and the tetanus decision. One photo, one saline dressing — do not keep re-exposing the wound',
        placeholder: 'e.g. closed; or open, 3cm wound, 45min since injury, cefazolin 2g IV given 00:40, tetanus toxoid given',
      },
    ],
  },

  assessment: {
    // After General + Focused exam (index 4), before Investigations.
    insertAt: 4,
    fields: d => [
      {
        key: 'neurovascular',
        label: 'Neurovascular Status — PRE- and POST-manipulation',
        value: d.neurovascular ?? '',
        kind: 'textarea',
        hint: 'the single most litigated omission in orthopaedic practice — pulses, sensation BY DERMATOME (not just "sensation intact"), motor, and capillary refill distal to the injury, documented BEFORE any reduction/splint/cast AND again AFTER, each timestamped. Without a pre-manipulation baseline you cannot say whether a deficit was caused or inherited. A palpable pulse does NOT exclude vascular injury — collateral flow can maintain it; if in doubt, Doppler and compare to the other side',
        placeholder: 'Pre-reduction 14:02: pulses+, sensation intact all dermatomes, cap refill <2s, moves fingers/toes. Post-reduction 14:20: unchanged',
      },
      {
        key: 'reductionOperation',
        label: 'Reduction / Operation Performed',
        value: d.reductionOperation ?? '',
        hint: 'name exactly what was done and when (closed reduction, K-wire, ORIF, fasciotomy) — post-op complications run on this clock, not admission time. Mandatory post-reduction/post-op X-ray to confirm alignment, plus the neurovascular re-check above — an unconfirmed reduction is not a completed reduction',
        placeholder: 'e.g. closed reduction under haematoma block 14:15, post-reduction film satisfactory; or ORIF distal radius 09/07',
      },
    ],
  },
};
