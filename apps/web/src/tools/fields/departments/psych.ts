import type { DeptFieldFragments } from '../types';

// Psychiatry field fragments — drawn from the Psychiatry dossier's mental
// model (§1: organic exclusion first, risk as continuous cognition, the MSE
// as the examination, capacity/MHCA as clinical reasoning not paperwork) and
// the SA-specific legal pathway (§6.1-6.3: MHCA 17 of 2002, the 72-hour
// assessment, CPA ss77-79 forensic track). Legal status is the load-bearing
// admission field for this department the way triage category is for
// Emergency — it determines what can lawfully be done to the patient next,
// so it lives in intake alongside admission diagnosis rather than buried in
// history. Hints carry the consultant's reasoning so the intern learns WHY
// each is asked, not just what to record.
export const psychFields: DeptFieldFragments = {
  intake: d => [
    {
      key: 'legalStatus',
      label: 'MHCA Legal Status',
      value: d.legalStatus ?? '',
      kind: 'select',
      options: [
        'Voluntary',
        'Assisted care (MHCA 04 applied)',
        'Involuntary care (MHCA 04 applied)',
        '72-hour assessment in progress (MHCA 06 pending)',
        'Forensic — CPA ss77-79 observation / state patient',
      ],
      hint: 'voluntary = patient consents; assisted = unable to consent but does not refuse; involuntary = refuses, or unable to consent and poses a risk/needs treatment otherwise unobtainable — capacity for THIS decision, not the diagnosis, is what decides the category. MHCA 04 is the application that starts the compulsory pathway, MHCA 05 is the two independent practitioner findings required before it is approved, MHCA 06 is completed during the 72-hour assessment (a general-hospital-system obligation, not just a psych-ward one), MHCA 07 is the head-of-establishment decision notice, MHCA 08 goes to the Review Board if further involuntary care is needed beyond 72h. SAPS handover under s40 is recorded on MHCA 22. Forensic (CPA ss77-79) is a different legal track entirely — fitness to stand trial / criminal capacity — not routine MHCA care',
      placeholder: 'e.g. Involuntary — MHCA 04 applied 09/07, 72h assessment clock started',
    },
  ],

  history: {
    insertAt: 2,
    fields: d => [
      { key: 'psychHistory', label: 'Psychiatric History', value: d.psychHistory ?? '', kind: 'textarea', hint: 'previous episodes, admissions, suicide attempts, treatments and response — but a known diagnosis is never the answer to a NEW presentation: a known schizophrenic can present with a UTI-driven delirium or lithium toxicity, not relapse. Re-run the organic-exclusion reflex every time regardless of what is already on file', placeholder: 'Previous episodes, admissions, attempts, treatments and response' },
      { key: 'substanceUse', label: 'Substance Use', value: d.substanceUse ?? '', kind: 'textarea', hint: 'alcohol, methamphetamine ("tik" — the dominant driver of SA substance presentations), cannabis, nyaope/whoonga, benzodiazepines — amount, duration, and LAST USE timing, because timing predicts the withdrawal window (alcohol seizures 12-48h, DTs 48-96h; opioid withdrawal is miserable but rarely dangerous, alcohol/benzo withdrawal can kill)', placeholder: 'Substances, amounts, duration, last use (date/time)' },
      { key: 'collateral', label: 'Collateral History', value: d.collateral ?? '', kind: 'textarea', hint: 'from family/friends/EMS — note the source. In an acutely agitated or psychotic patient this is often the ONLY reliable history available; tempo of onset from a collateral informant (minutes-hours = organic/intoxication, days-weeks = psychiatric relapse) is one of the most discriminating single facts you can gather', placeholder: 'Collateral from family/carer (name the source, and the tempo of onset they describe)' },
      {
        key: 'forensicHistory',
        label: 'Forensic / Legal History',
        value: d.forensicHistory ?? '',
        kind: 'textarea',
        hint: 'prior offences, current charges, any CPA ss77-79 observation or state-patient status — relevant both to the risk-to-others assessment and because a patient already flagged for fitness-to-stand-trial or criminal-capacity assessment sits on a different legal track (court-directed, forensic-psychiatry-led) from routine MHCA care and needs early liaison rather than independent district-level management',
        placeholder: 'e.g. none; or pending charge of assault, CPA s79 observation report requested by court',
      },
      {
        key: 'currentPsychotropics',
        label: 'Current Psychotropics (incl. Depot)',
        value: d.currentPsychotropics ?? '',
        kind: 'textarea',
        hint: 'name each drug WITH LAST DOSE DATE — for a depot antipsychotic this is the single most important fact on the page: a missed depot injection is often the actual explanation for a "relapse" that looks like non-adherence to oral medication the patient was never even prescribed. If on clozapine, record the current monitoring phase (weekly FBC/ANC for the first 18 weeks, then fortnightly to week 52, then monthly indefinitely) and the date/result of the last one — an overdue ANC is a stop-and-chase item, not a footnote',
        placeholder: 'e.g. flupenthixol decanoate 40mg IM depot, last given 3/52 ago (due weekly); clozapine 300mg nocte, wk 6 of monitoring, last FBC/ANC normal 04/07',
      },
      {
        key: 'medicationResponse',
        label: 'Past Medication Response / Adverse Reactions',
        value: d.medicationResponse ?? '',
        kind: 'textarea',
        hint: 'a prior NMS, severe acute dystonia, or intolerable akathisia on a specific agent directly changes today\'s choice of rapid-tranquillisation drug and maintenance antipsychotic — this is not history trivia. Also note what HAS worked and any adequate trials that failed: two adequate antipsychotic trials without response is the threshold that should prompt a clozapine-referral conversation (clozapine itself is never initiated at district level)',
        placeholder: 'e.g. haloperidol → severe dystonic reaction 2019, avoid; risperidone tolerated and effective previously',
      },
    ],
  },

  assessment: {
    // After General + Focused exam (index 4), before Investigations.
    insertAt: 4,
    fields: d => [
      {
        key: 'organicScreen',
        label: 'Organic Screen',
        value: d.organicScreen ?? '',
        kind: 'textarea',
        hint: 'it is not psychiatric until this is clean — the single rule that separates a consultant from a junior in this discipline, re-fired at every new presentation even in a known patient. Glucose FIRST (fingerprick, not a wait for the lab), full vitals including temperature, a focal neuro exam, and urine toxicology (a negative does not exclude recent use if the window has passed; a positive — especially cannabis, detectable for weeks in chronic users — does not prove it explains TODAY\'s presentation). Red flags that shift probability toward organic: first episode after 40-45, abrupt onset over hours, fluctuating attention, abnormal vitals, focal signs, prominent visual/tactile hallucinations, catatonia',
        placeholder: 'e.g. glucose 5.2, afebrile, HR/BP normal, no focal neuro deficit, urine tox: cannabis positive (chronic use, non-contributory)',
      },
      { key: 'mse', label: 'Mental State Exam', value: d.mse ?? '', kind: 'textarea', hint: 'the examination of this discipline, done at every encounter — read it like an ECG. Full domains in order: appearance/behaviour, speech, mood (patient\'s words) and affect (your observation of range/congruence), thought form, thought content (ask about SI/HI directly, never assume absent because not volunteered), perception, cognition, insight/judgment. Attention is the key bedside test for delirium wearing a psychiatric mask: digit span, "WORLD" backwards, or months backwards — impaired attention PLUS fluctuation over hours is delirium until proven otherwise, however psychotic or manic the surface presentation looks', placeholder: 'MSE domains in order — flag any impaired attention or fluctuation explicitly' },
      {
        key: 'riskAssessment',
        label: 'Risk Assessment',
        value: d.riskAssessment ?? '',
        kind: 'textarea',
        hint: 'risk to self, others, and self-neglect/grave disability — reassessed at EVERY contact, not filled in once. Static factors (unchangeable, context for baseline risk): male sex, previous attempt (the single strongest predictor of a future one), family history of suicide, childhood abuse. Dynamic factors (what actually drives TODAY\'s disposition decision): current ideation with plan and means, hopelessness, active intoxication, access to lethal means, and — the highest-risk window of the entire illness course — the first 1-2 weeks after psychiatric discharge. State the CURRENT level and how the plan answers it, plus protective factors. Never take a sudden, unexplained calm in a previously severely suicidal patient as reassurance — it can mean a decision has been made, not resolution; re-elicit current ideation directly, every time',
        placeholder: 'Current risk to self / others / self-neglect (static + dynamic factors, protective factors) + how the plan answers it',
      },
    ],
  },
};
