import type { DeptFieldFragments } from '../types';

// Anaesthetics field fragments — the pre-operative assessment IS the clerking
// in this department, so the fields mirror the anaesthetist's mental model:
// airway first (can I ventilate, can I intubate), aspiration risk second,
// physiological reserve third (ASA + functional capacity), then the drug
// questions that change the plan (anticoagulants gate neuraxial blocks; the
// family history of malignant hyperthermia / suxamethonium apnoea changes the
// whole technique). SA reality baked into the hints: the intern/MO giving a
// spinal for caesarean section at a district hospital, often without a
// specialist on site, is the single commonest anaesthetic exposure.
export const anaesFields: DeptFieldFragments = {
  intake: d => [
    { key: 'plannedProcedure', label: 'Planned Procedure', value: d.plannedProcedure ?? '', hint: 'exact operation + surgeon + intended date/time — the anaesthetic plan serves the procedure (site, position, duration, expected blood loss)', placeholder: 'e.g. emergency CS for fetal distress; elective lap chole' },
    { key: 'urgency', label: 'Urgency', value: d.urgency ?? '', hint: 'elective / urgent / emergency — urgency sets how much optimisation is possible and whether a full stomach is assumed (emergency = rapid-sequence induction by default)', placeholder: 'Elective / urgent / emergency' },
    { key: 'asaGrade', label: 'ASA Grade', value: d.asaGrade ?? '', hint: 'I healthy · II mild systemic disease · III severe systemic disease · IV constant threat to life · V moribund · VI organ donor — add E for emergency. ASA III+ or E at a district hospital is the classic "discuss/refer before inducing" trigger', placeholder: 'e.g. II, or IIIE' },
  ],

  history: {
    // After Past Medical History (base index 3) — the same landing point as
    // Surgery's fragment: these gate the anaesthetic plan the way comorbidity
    // control gates the medical one.
    insertAt: 3,
    fields: d => [
      {
        key: 'anaestheticHistory',
        label: 'Anaesthetic History (self + family)',
        value: d.anaestheticHistory ?? '',
        kind: 'textarea',
        hint: 'previous GA/spinal and any complication — difficult intubation (get the old chart/alert card: the previous airway grade is the single best predictor), awareness, PONV, post-dural-puncture headache. FAMILY history is not politeness: malignant hyperthermia and suxamethonium (scoline) apnoea are inherited and change the drug plan entirely',
        placeholder: 'e.g. GA 2019 uneventful; mother "nearly died under anaesthetic" — ?MH, treat as MH-risk until clarified',
      },
      {
        key: 'anticoagulants',
        label: 'Anticoagulants / Antiplatelets',
        value: d.anticoagulants ?? '',
        hint: 'name + exact LAST DOSE time — this gates the neuraxial (spinal/epidural) option: prophylactic LMWH needs ~12h and treatment-dose ~24h before a spinal; a therapeutic INR or recent DOAC dose makes neuraxial contraindicated (spinal haematoma). Never assume the chart is current — ask',
        placeholder: 'e.g. enoxaparin 40mg last given 06:00 yesterday; or none',
      },
      { key: 'lastMeal', label: 'Fasting Status', value: d.lastMeal ?? '', hint: 'TIME of last solids and last clear fluids — elective threshold 6h solids / 2h clear fluids; labour, trauma, obstruction, opioids and diabetes gastroparesis all delay emptying, so an "adequately fasted" emergency patient still gets full-stomach precautions (RSI + cricoid)', placeholder: 'e.g. solids 22:00, sips of water 05:00' },
      {
        key: 'functionalCapacity',
        label: 'Functional Capacity (METs)',
        value: d.functionalCapacity ?? '',
        hint: '≥4 METs (climbs a flight of stairs / walks up a hill without stopping) predicts tolerance of anaesthetic stress — below that, or unable to assess (arthritis, claudication), the cardiorespiratory reserve question needs objective answers before elective surgery',
        placeholder: 'e.g. climbs 2 flights without stopping (>4 METs)',
      },
    ],
  },

  assessment: {
    // After General + Focused exam (index 4), before Investigations — the
    // airway exam is the department's signature examination.
    insertAt: 4,
    fields: d => [
      {
        key: 'airwayAssessment',
        label: 'Airway Assessment',
        value: d.airwayAssessment ?? '',
        kind: 'textarea',
        hint: 'the two questions are "can I ventilate?" and "can I intubate?" — Mallampati (I-IV), mouth opening (≥3 fingerbreadths), thyromental distance (≥6.5cm), neck extension, dentition (loose/prominent teeth, dentures OUT), beard, large tongue, and the obstetric airway (oedema + full dentition + breasts = anticipate difficulty). Any predicted difficulty → plan, help and rescue equipment BEFORE induction, never discovered after',
        placeholder: 'e.g. Mallampati II, MO 3FB, TMD >6.5cm, full neck extension, own teeth intact',
      },
      {
        key: 'neuraxialSuitability',
        label: 'Neuraxial / Regional Suitability',
        value: d.neuraxialSuitability ?? '',
        hint: 'back exam (landmarks, deformity, local sepsis at the puncture site), coagulation status, patient consent/cooperation, and the contraindications: refusal, local infection, coagulopathy/anticoagulation in window, raised ICP, severe uncorrected hypovolaemia, fixed cardiac output states (severe AS) — hypotension after the spinal is expected (sympathectomy), so the volume state must be assessed BEFORE the block',
        placeholder: 'e.g. landmarks palpable, no local sepsis, INR 1.0, consents to spinal',
      },
    ],
  },
};
