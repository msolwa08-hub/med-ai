// ─── Treatment sets ──────────────────────────────────────────────────────────
// Clickable protocol cards with PROCEDURAL smart defaults — exact gauges,
// rates and doses per SA STG practice. Every item defaults ON where it is the
// standard of care; opting out is a deliberate tap, not an omission. Selected
// items serialize as label+detail lines into the problem's management plan
// (editable text afterwards — the card is an input method, not a lock-in).

export interface TreatmentSetItem {
  id: string;
  label: string;
  /** The procedural smart default: the gauge, the rate, the dose, the timing. */
  detail: string;
  why: string;
  defaultOn: boolean;
}

export interface TreatmentSet {
  id: string;
  title: string;
  /** Matched against the problems text (problem + working dx lines). */
  pattern: RegExp;
  items: TreatmentSetItem[];
}

function it(id: string, label: string, detail: string, why: string, defaultOn = true): TreatmentSetItem {
  return { id, label, detail, why, defaultOn };
}

export function treatmentSetsFor(problemsText: string): TreatmentSet[] {
  if (!problemsText.trim()) return [];
  return TREATMENT_SETS.filter(s => s.pattern.test(problemsText));
}

export function serializeTreatmentItems(items: TreatmentSetItem[]): string[] {
  return items.map(i => `${i.label} — ${i.detail}`);
}

export const TREATMENT_SETS: TreatmentSet[] = [
  {
    id: 'sepsis',
    title: 'Sepsis bundle',
    pattern: /sepsis|septic|urosepsis|septic(a)?emia/i,
    items: [
      it('sep-iv', 'IV access x2', '2x 16G IV cannulae (antecubital)', 'Two large-bore lines: resuscitation rates need 16G, and one line will fail at the worst moment.'),
      it('sep-fluids', 'Crystalloid bolus', '30ml/kg balanced crystalloid, REASSESS after each 500ml', 'The evidence-based starting volume — but reassessment (lungs, JVP, response) is what prevents drowning the cardiac patient.'),
      it('sep-cultures', 'Blood cultures BEFORE antibiotics', '2 sets, different sites, before first abx dose', 'Cultures drawn after antibiotics are sterile — one dose can cost the organism and weeks of targeted therapy.'),
      it('sep-abx', 'Empiric antibiotics <1h', 'Per STG for suspected source — do not wait for results', 'Each hour of delayed antibiotics in septic shock measurably increases mortality.'),
      it('sep-lactate', 'Lactate', 'Baseline lactate, repeat at 2-4h if >2', 'Lactate grades hypoperfusion and its clearance tracks whether resuscitation is working.'),
      it('sep-catheter', 'Urinary catheter', 'Hourly urine output, target >0.5ml/kg/h', 'Urine output is the poor man’s cardiac output — the earliest bedside perfusion monitor.'),
    ],
  },
  {
    id: 'dka',
    title: 'DKA protocol',
    pattern: /\bDKA\b|diabetic ketoacidosis|ketoacidosis/i,
    items: [
      it('dka-fluids', 'Fluid resuscitation', '0.9% saline 1L over 1st hour, then per protocol', 'The average DKA is 6L down — fluid is the first insulin-sparing treatment and restores renal ketone clearance.'),
      it('dka-k', 'Potassium BEFORE insulin', 'K+ <3.5: hold insulin, replace first. K+ 3.5-5.5: add 20mmol KCl/L. K+ >5.5: no KCl, recheck 1h', 'Insulin drives K+ into cells — starting it on a hypokalaemic patient causes the arrhythmia that kills DKA patients.'),
      it('dka-insulin', 'Insulin infusion AFTER K+ known', '0.1 units/kg/h IV, continue until ketones clear (not just glucose normal)', 'Fixed-rate insulin switches off ketogenesis; stopping at "glucose normal" instead of "ketones cleared" causes rebound DKA.'),
      it('dka-monitoring', 'Hourly glucose + ketones', 'Hourly capillary glucose, 2-hourly ketones, 4-hourly VBG/K+', 'DKA management is titration — without hourly numbers the infusion is flying blind.'),
      it('dka-dextrose', 'Add dextrose when glucose <14', '10% dextrose alongside saline, continue insulin', 'The insulin must continue to clear ketones — dextrose lets it run without hypoglycaemia.'),
      it('dka-precipitant', 'Hunt the precipitant', 'Septic screen, ECG, pregnancy test, adherence history', 'DKA is always DKA-because-of-something: infection, infarct, insulin omission.'),
    ],
  },
  {
    id: 'open-fracture',
    title: 'Open fracture bundle',
    pattern: /open (fracture|#)|compound (fracture|#)/i,
    items: [
      it('of-abx', 'IV antibiotics <1h', 'Cefazolin 2g IV within 1h of arrival', 'Antibiotic timing is the single biggest modifiable infection-rate factor in open fractures — bigger than time to theatre.'),
      it('of-tetanus', 'Tetanus prophylaxis', 'Tetanus toxoid ± immunoglobulin per immunisation status', 'Open contaminated wounds are tetanus-prone — the disease is unsurvivable in most settings and entirely preventable.'),
      it('of-dressing', 'Saline dressing + photo ONCE', 'Photograph wound, then saline-soaked dressing — no repeated uncovering', 'Every re-exposure of the wound inoculates it again; the photo lets every subsequent clinician see it without undressing it.'),
      it('of-splint', 'Splint + document pulses pre/post', 'Splint in anatomical alignment; distal pulses and sensation documented before AND after', 'Splinting reduces pain, bleeding and further soft-tissue damage — and the pre/post neurovascular record proves the splint didn’t cause the deficit.'),
      it('of-npo', 'NPO + ortho referral', 'Keep nil per os, urgent orthopaedic referral for debridement', 'Definitive care is surgical — feeding the patient delays the theatre slot.'),
    ],
  },
  {
    id: 'acs',
    title: 'ACS bundle',
    pattern: /\bACS\b|STEMI|NSTEMI|unstable angina|myocardial infarc|\bMI\b/i,
    items: [
      it('acs-aspirin', 'Aspirin', '300mg CHEWED stat', 'Chewing gets antiplatelet effect in minutes instead of an hour — a genuinely time-critical mouthful.'),
      it('acs-clopidogrel', 'Clopidogrel load', '300mg PO stat (600mg if for PCI)', 'Dual antiplatelet therapy halts the platelet cascade that is actively occluding the vessel.'),
      it('acs-enoxaparin', 'Enoxaparin', '1mg/kg SC 12-hourly — HALVE/adjust if eGFR <30', 'Anticoagulation prevents clot extension; unadjusted enoxaparin in renal impairment accumulates and bleeds.'),
      it('acs-ecg-trop', 'Serial ECG + troponin', 'ECG repeated at 15-30min and with any pain; troponin now + 3-6h', 'The first ECG misses a third of infarcts — evolution over serials makes the diagnosis.'),
      it('acs-nitrates', 'Nitrates for pain', 'Isordil 5mg SL prn — AVOID if hypotensive/RV infarct/sildenafil', 'Symptom relief with a safety rider: nitrates on a preload-dependent RV infarct crash the BP.', false),
      it('acs-referral', 'Discuss for reperfusion', 'Thrombolysis vs PCI referral per times and facility', 'STEMI treatment is measured door-to-needle — the discussion happens now, not after the ward round.'),
    ],
  },
  {
    id: 'pph',
    title: 'PPH bundle',
    pattern: /\bPPH\b|post ?partum h(a)?emorrhage/i,
    items: [
      it('pph-massage', 'Uterine massage + empty bladder', 'Bimanual fundal massage; catheterise', 'Atony is 70% of PPH — massage and an empty bladder let the uterus contract mechanically while drugs draw up.'),
      it('pph-oxytocin', 'Oxytocin', '10 IU IM stat, then 20 IU in 1L at 250ml/h', 'First-line uterotonic: bolus for immediate tone, infusion to hold it.'),
      it('pph-txa', 'Tranexamic acid <3h', '1g IV over 10min, repeat once if bleeding continues', 'WOMAN trial: TXA within 3h of birth reduces death from bleeding — after 3h the benefit disappears.'),
      it('pph-4ts', 'Hunt the cause — 4 Ts', 'Tone, Trauma (explore tract), Tissue (check placenta complete), Thrombin (clotting)', 'The uterotonics only fix Tone — a cervical tear or retained lobe keeps bleeding through them.'),
      it('pph-resus', 'Resuscitate + crossmatch', '2x 16G IV, crystalloid, FBC + crossmatch 2-4 units, lie flat', 'Obstetric bleeding outruns estimation — prepare blood before it is obviously needed.'),
      it('pph-escalate', 'Bimanual compression + escalate', 'If ongoing: bimanual aortic/uterine compression, call senior, consider balloon tamponade', 'The stepwise escalation buys time to theatre — deaths happen in the delay between steps.'),
    ],
  },
  {
    id: 'severe-pet',
    title: 'Severe pre-eclampsia / eclampsia bundle',
    pattern: /pre-?eclampsia|\bPET\b|eclampsia|\bHELLP\b/i,
    items: [
      it('pet-mgso4', 'MgSO4 loading + maintenance', '4g IV over 20min, then 1g/h infusion', 'Magnesium halves the risk of eclamptic seizures and is the treatment of the seizure itself — not benzodiazepines.'),
      it('pet-monitoring', 'MgSO4 monitoring triad', 'Hourly: patellar reflexes present, RR >12, urine output >25ml/h', 'Magnesium toxicity announces itself as lost reflexes → respiratory depression — the triad catches it before the arrest.'),
      it('pet-cagluc', 'Calcium gluconate at bedside', '10ml of 10% drawn up and AT THE BEDSIDE', 'The antidote is useless in the drug cupboard — it belongs within arm’s reach of every MgSO4 infusion.'),
      it('pet-bp', 'Control severe hypertension', 'Nifedipine 10mg PO (not sublingual) or labetalol IV if ≥160/110', 'Stroke is what kills pre-eclamptic mothers — systolic ≥160 is the treatment threshold.'),
      it('pet-bloods', 'PET bloods', 'FBC, U&E, LFTs, urate; urine PCR', 'Platelets, creatinine and transaminases stage severity and catch HELLP.'),
      it('pet-delivery', 'Plan for delivery', 'Senior review — delivery is the definitive treatment; steroids if <34w', 'Everything else is temporising: the placenta is the disease.'),
    ],
  },
  {
    id: 'severe-asthma',
    title: 'Acute severe asthma bundle',
    pattern: /asthma/i,
    items: [
      it('asth-salbutamol', 'Back-to-back salbutamol nebs', '5mg nebulised, repeat back-to-back x3 in first hour, oxygen-driven', 'Continuous bronchodilation in the first hour is what breaks the attack — single spaced nebs undertreat severe asthma.'),
      it('asth-ipratropium', 'Ipratropium', '0.5mg nebulised with salbutamol, 4-6 hourly', 'Added anticholinergic bronchodilation reduces admissions in severe attacks — cheap and additive.'),
      it('asth-steroids', 'Systemic corticosteroids', 'Prednisone 40mg PO (or hydrocortisone 100mg IV if unable to swallow)', 'Steroids treat the inflammation the bronchodilators cannot — the earlier given, the earlier they work (onset ~4h).'),
      it('asth-mgso4', 'MgSO4 if life-threatening', '2g IV over 20min, single dose', 'For the silent chest / failing patient: magnesium bronchodilates when maximal nebs have not.', false),
      it('asth-reassess', 'Reassess + escalate early', 'PEF, RR, sats, speech before/after each round; silent chest or exhaustion → ICU NOW', 'Asthma deaths are late escalations — a quiet chest is peri-arrest, not improvement.'),
      it('asth-avoid', 'No sedation, caution routine abx', 'No benzodiazepines; antibiotics only for clear bacterial trigger', 'Sedatives suppress the respiratory drive keeping the patient alive; most triggers are viral.'),
    ],
  },
  {
    id: 'paeds-gastro',
    title: 'Paeds gastroenteritis (IMCI)',
    pattern: /gastro|diarrh|dehydrat/i,
    items: [
      it('pg-ors', 'ORS per IMCI plan', 'Plan A no dehydration: 10ml/kg after each loose stool. Plan B some dehydration: 75ml/kg ORS over 4h', 'Oral rehydration saves more children than any other treatment on earth — the plan and volume come from the classification.'),
      it('pg-zinc', 'Zinc', '<6m: 10mg daily x14 days; ≥6m: 20mg daily x14 days', 'Zinc shortens this episode and prevents the next one for 2-3 months.'),
      it('pg-feeding', 'Continue feeding/breastfeeding', 'Do not starve — continue breast/normal feeds alongside ORS', 'Fasting worsens gut recovery and nutrition; "resting the gut" is obsolete and harmful.'),
      it('pg-danger', 'Danger-sign advice documented', 'Return IMMEDIATELY if: unable to drink, vomits everything, blood in stool, lethargic/convulsing', 'The caregiver is the monitoring system at home — the safety net is only as good as the advice given and understood.'),
      it('pg-noantidiarrhoeal', 'NO antidiarrhoeals/antiemetics', 'Loperamide and prochlorperazine contraindicated in children', 'They cause ileus, sedation and dystonia and treat nothing — the disease is self-limiting with hydration.', false),
    ],
  },
  {
    id: 'neonatal-sepsis',
    title: 'Neonatal sepsis bundle',
    pattern: /neonatal sepsis|neonate.*(sepsis|infection)|early onset sepsis|\bEOS\b/i,
    items: [
      it('ns-ampicillin', 'Ampicillin', '50mg/kg/dose IV 12-hourly (first week of life)', 'Covers GBS and listeria — the two organisms gentamicin misses.'),
      it('ns-gentamicin', 'Gentamicin', '5mg/kg IV once daily — by WEIGHT, level if >48h use', 'Gram-negative cover; once-daily dosing is more effective and less nephrotoxic, but the dose is unforgivingly weight-based.'),
      it('ns-cultures', 'Cultures before antibiotics', 'Blood culture (±LP if stable) before first dose', 'The organism defines duration (7-21 days) — lose it and the baby gets the longest empirical course by default.'),
      it('ns-glucose-temp', 'Glucose + temperature support', 'Check glucose, keep warm (kangaroo care/incubator)', 'Hypoglycaemia and hypothermia are both features of neonatal sepsis and independently lethal.'),
      it('ns-fluids', 'Maintenance fluids by day of life', 'Day 1: 60ml/kg/day 10% dextrose, advance per protocol', 'Neonatal fluid rates are day-of-life dependent — adult-style boluses overload a newborn fast.'),
    ],
  },
  {
    id: 'surgical-prep',
    title: 'Pre-op preparation',
    pattern: /for (theatre|surgery|laparotomy|appendicectomy|c\/s|caesar)|pre-?op|booked for/i,
    items: [
      it('prep-npo', 'NPO', 'Nil per os: 6h solids, 2h clear fluids; document last meal time', 'Aspiration on induction is a preventable death — the anaesthetist plans around the documented last meal.'),
      it('prep-consent', 'Informed consent', 'Procedure, risks, alternatives discussed & signed — by someone able to perform/explain it', 'Consent is a conversation with legal weight, not a signature hunt.'),
      it('prep-bloods', 'Bloods + crossmatch', 'FBC, U&E; group & screen (crossmatch 2 units if bleeding anticipated)', 'The transfusion you might need in theatre is ordered now — crossmatching takes an hour you won’t have later.'),
      it('prep-abx', 'Prophylactic antibiotics AT INDUCTION', 'Cefazolin 2g IV at induction (NOT on the ward hours before)', 'Timing is everything: the tissue level must peak at incision — too early and it has worn off, too late and it never protects.'),
      it('prep-vte', 'VTE risk assessment', 'Score risk; enoxaparin 40mg SC + stockings unless contraindicated (timing per anaesthesia)', 'Surgery is a top VTE trigger — assessment is mandatory and prophylaxis timing must be coordinated with neuraxial anaesthesia.'),
      it('prep-chronic', 'Chronic meds plan', 'Continue/omit list documented (hold ACEi morning of, continue beta-blocker, insulin plan)', 'The morning pills decide the intra-op physiology — every chronic drug needs an explicit continue/omit decision.'),
    ],
  },
  {
    id: 'anaphylaxis',
    title: 'Anaphylaxis',
    pattern: /anaphyla/i,
    items: [
      it('ana-adrenaline', 'Adrenaline IM', '0.5mg (0.5ml of 1:1000) IM ANTEROLATERAL THIGH', 'IM adrenaline is the only treatment that reverses anaphylaxis — the thigh beats the deltoid for absorption, and IV boluses of 1:1000 kill.'),
      it('ana-repeat', 'Repeat at 5 min', 'Repeat 0.5mg IM every 5min if not improving', 'Under-dosing and under-repeating are the commonest management errors — most fatalities got too little too late.'),
      it('ana-position', 'Position + remove trigger', 'Lie flat, legs up (sitting if SOB); stop the drug/infusion', 'Standing a vasodilated patient up causes empty-heart arrest — position is treatment.'),
      it('ana-fluids', 'IV fluids', '500-1000ml crystalloid rapid bolus (20ml/kg in children)', 'Anaphylaxis leaks litres into tissue — the BP needs volume as well as adrenaline.'),
      it('ana-adjuncts', 'Adjuncts after adrenaline', 'Hydrocortisone 200mg IV + promethazine 25mg IM — never INSTEAD of adrenaline', 'Steroids and antihistamines treat the rash and maybe the recurrence — they do not treat the airway or the BP.', false),
      it('ana-observe', 'Observe 6-12h', 'Biphasic reactions occur up to 12h later; document allergen and flag notes', 'The second reaction happens after the patient "looks fine" — early discharge is the trap.'),
    ],
  },
  {
    id: 'status-epilepticus',
    title: 'Status epilepticus ladder',
    pattern: /status epilepticus|ongoing seizure|convulsing/i,
    items: [
      it('se-abc', 'Protect + glucose', 'Recovery position, oxygen, suction ready; bedside glucose NOW', 'Airway and glucose come before any anticonvulsant — hypoglycaemic status responds to dextrose, not diazepam.'),
      it('se-benzo1', 'Benzodiazepine at 5 min', 'Lorazepam 4mg IV (or diazepam 10mg IV/PR) once seizing >5min', 'Five minutes defines status — beyond it, spontaneous termination is unlikely and every minute makes the seizure harder to stop.'),
      it('se-benzo2', 'Repeat benzo at 10 min', 'Repeat once after 5-10min if still seizing — then STOP benzos', 'Two adequate doses is the ceiling: more benzodiazepine adds apnoea, not seizure control.'),
      it('se-phenytoin', 'Second-line load', 'Phenytoin 20mg/kg IV at ≤50mg/min on cardiac monitor (or valproate 40mg/kg)', 'Benzo-refractory status needs a loading dose — infused too fast, phenytoin causes hypotension and arrhythmia, hence the monitor.'),
      it('se-icu', 'Refractory → anaesthesia', 'Still seizing at 30min: rapid sequence intubation + ICU', 'Refractory status is a brain-on-fire emergency — general anaesthesia is the definitive terminator.'),
      it('se-cause', 'Hunt the cause', 'Glucose, Na+, Ca2+, levels of usual AEDs, pregnancy test (eclampsia!), consider CT/LP', 'Status is a symptom: eclampsia gets MgSO4, hyponatraemia gets saline — the cause dictates the cure.'),
    ],
  },
  {
    id: 'alcohol-withdrawal',
    title: 'Alcohol withdrawal',
    pattern: /alcohol withdrawal|delirium tremens|\bDTs\b|withdrawal seizure|EtOH withdrawal/i,
    items: [
      it('aw-thiamine', 'Thiamine BEFORE glucose', '100mg IV/IM before any dextrose-containing fluid', 'Glucose without thiamine can precipitate Wernicke’s encephalopathy — the order of two cheap drugs prevents permanent brain damage.'),
      it('aw-diazepam', 'Symptom-triggered diazepam', 'Diazepam 10mg PO/IV per CIWA-style scoring, repeat per score', 'Symptom-triggered dosing uses less benzodiazepine and controls withdrawal faster than fixed schedules — but requires actual scoring.'),
      it('aw-monitor', 'Withdrawal scoring chart', 'Score 2-4 hourly (tremor, sweats, agitation, hallucinations, vitals)', 'DTs has a mortality — the scoring chart is what catches the transition from shakes to emergency.'),
      it('aw-electrolytes', 'Replace Mg2+, K+, PO4', 'U&E + Mg; replace aggressively', 'Chronic alcohol use wastes magnesium — hypomagnesaemia drives both seizures and refractory hypokalaemia.'),
      it('aw-seizure-plan', 'Seizure precautions', 'IV access maintained, diazepam available; withdrawal seizures → increase regimen', 'Withdrawal seizures cluster in the first 48h — the plan must precede the first one.'),
    ],
  },
  // ─── Internal Medicine (dossier: docs/clinical-build/research/internal-medicine.md) ───
  {
    id: 'dka-im',
    title: 'DKA — first hour + ongoing',
    pattern: /\bDKA\b|ketoacidosis/i,
    items: [
      it('dkaim-fluids', 'Fluids FIRST', '0.9% sodium chloride 15-20ml/kg IV over 1st hour (~1L), then titrate — correct deficit over 24-48h', 'The average DKA is 5-6L down; saline restores perfusion and renal ketone clearance before insulin does anything. Over-rapid correction risks cerebral oedema, especially in the young.'),
      it('dkaim-insulin', 'Insulin ONLY after K+ known', 'Fixed-rate insulin 0.1 units/kg/h IV infusion — start ONLY once K+ result back and ≥3.3', 'Insulin drives K+ into cells: started on a hypokalaemic patient it causes the fatal arrhythmia. Target ketone fall ~0.5mmol/L/h, glucose fall ~3mmol/L/h.'),
      it('dkaim-k', 'Potassium by band', 'K+ <3.3: HOLD insulin, replace KCl first. K+ 3.3-5.0: add 20-30mmol KCl per litre fluid. K+ >5.0: no KCl, recheck', 'Total-body K+ is always depleted even when the serum value looks high — the band decides whether insulin waits, K+ rides alongside, or you recheck.'),
      it('dkaim-monitor', 'Hourly glucose + 2-hourly VBG/ketones', 'Hourly capillary glucose; 2-hourly VBG + ketones; K+ 2h after insulin starts then 4-hourly', 'DKA management is titration — resolution is judged on ketones/pH/anion gap, and the K+ moves fastest in the first 2h of insulin.'),
      it('dkaim-dextrose', 'Add dextrose when glucose <14', '5-10% dextrose IV alongside the saline once glucose <14mmol/L — insulin infusion CONTINUES', 'The insulin must keep running to clear ketones; dextrose is what lets it run without hypoglycaemia. Glucose normal ≠ DKA resolved.'),
      it('dkaim-precipitant', 'Hunt the precipitant', 'Septic screen, ECG + troponin (silent MI), pregnancy test, insulin adherence/omission history', 'DKA is always DKA-because-of-something: infection, infarct, insulin omission or new diagnosis — miss it and the DKA recurs on the ward.'),
      it('dkaim-nevorstop', 'NEVER stop insulin until resolved', 'Continue IV insulin until ketones <0.6 + pH >7.3 + eating; give s/c basal insulin and overlap 1-2h BEFORE stopping the infusion', 'IV insulin has a half-life of minutes — stopping without a subcutaneous overlap sends the patient straight back into ketoacidosis.'),
    ],
  },
  {
    id: 'acs-initial',
    title: 'ACS initial bundle',
    pattern: /\bACS\b|NSTEMI|STEMI|unstable angina|myocardial/i,
    items: [
      it('acsi-aspirin', 'Aspirin', '300mg PO CHEWED stat, then 75mg PO daily', 'Chewing gets antiplatelet effect in minutes instead of an hour; the daily dose continues indefinitely.'),
      it('acsi-second-ap', 'Second antiplatelet', 'Clopidogrel 300mg PO stat (75mg, no load, if >75y), then 75mg PO daily', 'Dual antiplatelet therapy halts the platelet cascade actively occluding the vessel — per STG clopidogrel is the second agent at state level.'),
      it('acsi-enoxaparin', 'Enoxaparin', '1mg/kg SC 12-hourly; if eGFR <30: reduce to 1mg/kg SC once daily', 'Anticoagulation prevents clot extension; unadjusted enoxaparin accumulates in renal impairment and bleeds — check the eGFR before the second dose.'),
      it('acsi-statin', 'High-intensity statin', 'Atorvastatin 80mg PO nocte, started today', 'Early high-intensity statin stabilises the plaque and improves outcomes — it starts on day 1, not at discharge.'),
      it('acsi-serial', 'Serial ECG + troponin', 'Repeat ECG at 15-30min and with ANY recurrence of pain; troponin now + repeat at 3-6h (the delta makes the diagnosis)', 'The first ECG misses a third of infarcts and a single early troponin is uninterpretable — it is the evolution that diagnoses MI.'),
      it('acsi-stemi', 'STEMI → senior + lysis screen NOW', 'ST elevation: call senior IMMEDIATELY + screen thrombolysis eligibility (tenecteplase/streptokinase per STG) if no on-site PCI — document contraindications; exclude dissection first', 'Most SA state hospitals thrombolyse — treatment is measured door-to-needle, and thrombolysing an aortic dissection is lethal, so the eligibility screen is part of the emergency.'),
      it('acsi-pain', 'Morphine + nitrate for ongoing pain', 'Isosorbide dinitrate 5mg SL prn + morphine 2-4mg IV titrated — only if SBP >90; AVOID nitrate in RV infarct/recent sildenafil', 'Ongoing pain means ongoing ischaemia; but nitrates on a preload-dependent RV infarct crash the BP — the safety rider is part of the order.', false),
    ],
  },
  {
    id: 'pulmonary-oedema',
    title: 'Acute pulmonary oedema bundle',
    pattern: /pulmonary oedema|pulmonary edema|acute heart failure|decompensated (heart failure|cardiac failure|CCF|HF)|acute LVF/i,
    items: [
      it('apo-position-o2', 'Sit up + high-flow O2', 'Sit bolt upright; high-flow O2 titrated to sats 94-98% (88-92% if COPD/CO2-retainer risk)', 'Sitting up drops preload and improves mechanics immediately — position is the first drug. The target range prevents both hypoxia and CO2 narcosis.'),
      it('apo-furosemide', 'IV furosemide', 'Furosemide 40-80mg IV stat (double the usual oral dose if already on it); repeat per response', 'IV furosemide venodilates before it diuresies; oral absorption fails in the congested gut, hence the IV route and the doubled dose.'),
      it('apo-nitrate', 'Nitrate if SBP >110', 'Isosorbide dinitrate 5mg SL, repeat 5-10min — only if SBP >110mmHg', 'Nitrates offload the flooded circuit faster than diuretics — but only with the blood pressure to spend.'),
      it('apo-balance', 'Strict fluid balance + daily weights', 'Strict input-output chart, fluid restrict 1-1.5L/day, same-scale daily weight', 'The weight is the honest fluid balance — diuresis is titrated against it day by day.'),
      it('apo-catheter', 'Urinary catheter', 'Catheterise for hourly urine output — the diuresis you prescribed must be seen to happen', 'A furosemide dose without a measured output is a guess; no diuresis at 1h means escalate, not wait.'),
      it('apo-precipitant', 'Precipitant screen', 'ECG + troponin (ischaemia/arrhythmia/AF), septic screen, U&E (AKI), medication + salt adherence history', 'Pulmonary oedema is a presentation, not a diagnosis — ischaemia, arrhythmia, infection, AKI and non-adherence are the usual triggers and each has its own treatment.'),
      it('apo-cpap', 'CPAP if not improving', 'CPAP if available and not responding to maximal medical therapy — call for it EARLY, before exhaustion', 'CPAP recruits flooded alveoli and offloads the work of breathing — started early it prevents the intubation, started late it precedes it.', false),
    ],
  },
  {
    id: 'hyperkalaemia',
    title: 'Hyperkalaemia emergency',
    pattern: /hyperkal(a)?emia|raised potassium|high potassium|K\+?\s*(of\s*)?[>≥]?\s*[6-9](\.\d)?\b/i,
    items: [
      it('hyperk-ecg', 'ECG NOW + cardiac monitor', '12-lead ECG immediately + continuous cardiac monitoring (peaked T → flat P/long PR → wide QRS → sine wave)', 'ECG changes and the K+ number correlate poorly — treat the ECG. The progression to sine wave is the road to VF, and the monitor watches it while you treat.'),
      it('hyperk-calcium', 'Calcium gluconate if ECG changes', 'Calcium gluconate 10% 10ml IV over 5-10min if ANY ECG changes; repeat at 5min if ECG unchanged', 'Membrane stabilisation works in minutes and buys time for everything else — but it does NOT lower the K+; the shift and removal steps still follow.'),
      it('hyperk-insulin', 'Insulin-dextrose shift', 'Short-acting insulin 10 units IV + 50ml of 50% dextrose IV over 15-30min; hourly glucose x 4-6h afterwards', 'Insulin drives K+ into cells within 15min — the commonest complication is the late hypoglycaemia, hence the hourly glucose after.'),
      it('hyperk-salbutamol', 'Salbutamol nebs', 'Salbutamol 10-20mg nebulised (2-4 back-to-back 5mg nebs)', 'Beta-agonist shift is additive to insulin-dextrose — the neb dose is 2-4x the asthma dose and tachycardia is expected.'),
      it('hyperk-cause', 'Stop K+-retaining drugs + treat cause', 'STOP ACEi/ARB, spironolactone/amiloride, NSAIDs, trimethoprim; furosemide 40mg IV if passing urine; treat AKI/the cause; exclude pseudohyperkalaemia (haemolysed sample) in the well patient', 'Shift therapies wear off in 2-4h — nothing is fixed until K+ actually leaves the body and the drug or disease driving it up is dealt with.'),
      it('hyperk-recheck', 'Repeat K+ at 1-2h', 'Repeat U&E/VBG K+ at 1-2h after treatment, then 2-4 hourly until stable', 'The rebound is predictable as insulin and salbutamol wear off — the recheck is what catches it before the second arrest-risk peak.'),
      it('hyperk-dialysis', 'Dialysis if refractory/anuric', 'Refractory K+ after medical therapy, anuria, or established renal failure → phone renal/ICU for urgent dialysis NOW', 'Anuric patients cannot excrete the K+ you have shifted — dialysis is the only definitive removal, and the referral call takes hours to convert into a machine.', false),
    ],
  },
  {
    id: 'cap-adult',
    title: 'Community-acquired pneumonia (adult)',
    pattern: /pneumonia|\bCAP\b/i,
    items: [
      it('cap-curb', 'CURB-65 decides disposition', 'Score 1 each: Confusion, Urea >7, RR ≥30, SBP <90 or DBP ≤60, age ≥65. 0-1 → outpatient; 2 → admit; 3-5 → admit + discuss ICU', 'Mortality climbs from <1% at score 0 to >20% at 4 — the score, not the gestalt, decides ward vs ICU and IV vs oral.'),
      it('cap-cultures', 'Blood cultures BEFORE antibiotics', 'Blood cultures x2 + sputum MC&S before the first antibiotic dose (do not delay antibiotics >45min for them)', 'Cultures drawn after antibiotics are sterile — one dose can cost the organism and the chance to de-escalate.'),
      it('cap-abx-ward', 'Antibiotics — ward tier (CURB-65 ≤2)', 'Amoxicillin 1g PO 8-hourly (or amoxicillin-clavulanate 1.2g IV 8-hourly if comorbid/aspiration) + azithromycin 500mg PO daily x3 days', 'Per STG: the beta-lactam covers pneumococcus, the macrolide covers the atypicals a beta-lactam cannot touch.'),
      it('cap-abx-severe', 'Antibiotics — severe tier (CURB-65 ≥3)', 'Ceftriaxone 1g IV daily + azithromycin 500mg IV/PO daily — replaces the ward regimen', 'Severe CAP per STG steps up to ceftriaxone; the macrolide stays for atypical cover and its mortality benefit in severe disease.', false),
      it('cap-oxygen', 'Oxygen titrated to target', 'O2 to keep sats 94-98% (88-92% if COPD/CO2-retainer risk); document sats ON the prescribed O2', 'Hypoxia kills fast and over-oxygenation narcotises the retainer — the target range and the recorded FiO2 are the monitoring.'),
      it('cap-hiv-tb', 'HIV test + TB screen — every SA pneumonia', 'Offer HIV test to ALL; sputum Xpert MTB/RIF Ultra if cough >2 weeks, weight loss, night sweats or HIV+; urine LAM if HIV+ with CD4 ≤200 or seriously ill', 'In SA the "pneumonia" that fails amoxicillin is TB or PJP on undiagnosed HIV — the tests cost cents and redirect the whole treatment.'),
      it('cap-review', 'Review at 48-72h', 'Formal review at 48-72h: afebrile + improving → switch IV to oral; NOT improving → re-image, re-culture, think TB/PJP/effusion/empyema', 'The 48-72h mark is where treatment failure declares itself — an unreviewed antibiotic course is how the empyema gets missed.'),
    ],
  },
  // ─── Surgery (dossier: docs/clinical-build/research/surgery.md) ───
  {
    id: 'acute-appendicitis',
    title: 'Acute appendicitis bundle',
    pattern: /appendicitis|appendix mass|appendix abscess/i,
    items: [
      it('appy-npo', 'NPO for theatre', 'Nil per os; document last meal time for the anaesthetist', 'The appendix is going to theatre — every subsequent mouthful pushes the aspiration-risk clock back.'),
      it('appy-fluids', 'IV fluids', 'Ringer\'s lactate/0.9% saline maintenance ± bolus if dehydrated/septic — reassess', 'Vomiting, fever and NPO status leave most appendicitis patients volume-down before they ever reach theatre.'),
      it('appy-analgesia', 'Analgesia — do not withhold', 'Morphine 0.05-0.1mg/kg IV titrated (or tramadol 50-100mg IV) + paracetamol 1g IV/PO', 'Adequate analgesia does NOT mask the diagnosis — the old "no analgesia until the surgeon sees them" dogma is wrong and only adds suffering.'),
      it('appy-abx', 'IV antibiotics', 'Cefazolin 1g IV 8-hourly + metronidazole 500mg IV 8-hourly — escalate broad-spectrum cover if perforated', 'Per SA STG: a cephalosporin + metronidazole covers the gut flora; perforation changes this from prophylaxis to therapy and the cover must widen with it.'),
      it('appy-bhcg', 'βhCG in every woman of reproductive age', 'Urine or serum βhCG before theatre — mandatory, not selective', 'A missed ectopic operated on as "appendicitis" — or vice versa — is one of the classic fatal misses in RIF pain.'),
      it('appy-consent-theatre', 'Consent + book theatre', 'Consent for appendicectomy (laparoscopic where available) discussed and signed; theatre booked today', '"Acute appendicitis" is not a management plan — "acute appendicitis → appendicectomy today" is.'),
      it('appy-mass', 'Appendix mass → conservative first', 'If a palpable walled-off mass several days into the illness: hold antibiotics + bowel rest, defer theatre, plan interval imaging/appendicectomy', 'Operating into an inflamed phlegmon risks injuring the caecum/ileum — the consultant chooses to let it settle first.', false),
    ],
  },
  {
    id: 'bowel-obstruction',
    title: 'Bowel obstruction — drip and suck',
    pattern: /bowel obstruction|\bSBO\b|\bLBO\b|small bowel obstruction|large bowel obstruction|volvulus|obstructed abdomen/i,
    items: [
      it('bo-ngt', 'NGT decompression', 'Wide-bore NGT (16-18Fr) on free drainage, 4-hourly aspirate and record volume', 'Decompressing the proximal bowel is the single biggest thing that relieves pain, vomiting and the risk of aspiration.'),
      it('bo-fluids', 'IV fluid resuscitation', 'Ringer\'s lactate/0.9% saline — replace the deficit, then match NGT + ongoing losses ml-for-ml', 'Vomiting and third-spacing leave these patients profoundly volume-down before the obstruction is even relieved.'),
      it('bo-electrolytes', 'Correct electrolytes', 'Check UEC — replace K+ (proximal vomiting classically gives hypochloraemic hypokalaemic metabolic alkalosis); add KCl to fluids once passing urine', 'The paradoxical aciduria of gastric outlet obstruction only corrects with chloride-rich fluid AND potassium — saline alone is not enough.'),
      it('bo-catheter', 'Urinary catheter', 'Catheterise for hourly urine output, target ≥0.5ml/kg/h', 'Urine output is the bedside resuscitation endpoint while the obstruction is being managed non-operatively.'),
      it('bo-analgesia', 'Analgesia', 'Morphine 0.05-0.1mg/kg IV titrated + antiemetic (metoclopramide 10mg IV, avoid in mechanical obstruction if worried about perforation)', 'Colicky obstructive pain is genuinely severe — treat it while treating the obstruction.'),
      it('bo-orifices', 'Examine every hernial orifice + PR', 'Groins, umbilicus, old scars, external genitalia examined and documented; PR for empty rectum/mass/blood', 'The hernia in the fat groin you didn\'t expose is the missed cause of "adhesional" obstruction — and PR finds the obstructing rectal cancer.'),
      it('bo-review', 'Surgical review + re-examine 4-6 hourly', 'Serial abdominal exam for tenderness, guarding, rising HR/lactate — the surgical abdomen declares itself on the trend, not one exam', 'Simple adhesional SBO settles ~70-90% with drip-and-suck over 24-48h — but continuous pain, tachycardia and rising lactate mean strangulation and change the plan to theatre.'),
      it('bo-contrast', 'Water-soluble contrast study if not settling', 'Gastrografin follow-through at 24h if no improvement — contrast reaching the colon by 24h predicts resolution without surgery', 'The study is both prognostic and mildly therapeutic (osmotic effect) — it tells you whether to keep waiting or take the patient to theatre.', false),
    ],
  },
  {
    id: 'perforated-viscus',
    title: 'Perforated viscus / generalised peritonitis',
    pattern: /perforat(ed|ion)|generalised peritonitis|generalized peritonitis|rigid abdomen|board-?like/i,
    items: [
      it('perf-resus', 'Resuscitate — fluids, O2, analgesia', 'Ringer\'s lactate/0.9% saline bolus + reassess, oxygen, morphine 0.05-0.1mg/kg IV titrated', 'Peritonitis is a septic-shock physiology problem before it is a surgical-anatomy problem — resuscitate while arranging theatre, not instead of it.'),
      it('perf-ngt', 'NG decompression', 'Wide-bore NGT on free drainage', 'Empties the stomach of the source and reduces ongoing peritoneal soiling and aspiration risk.'),
      it('perf-catheter', 'Urinary catheter', 'Catheterise for hourly urine output', 'Hourly output is the resuscitation endpoint in a septic, fluid-shifting abdomen.'),
      it('perf-abx', 'Broad-spectrum IV antibiotics', 'Ampicillin 1g IV 6-hourly + gentamicin 6mg/kg IV once daily + metronidazole 500mg IV 8-hourly (SA STG triple therapy for intra-abdominal sepsis)', '"There is no antibiotic for a hole in the gut" — but broad cover is the adjunct to source control and buys time until theatre.'),
      it('perf-antifungal', 'Antifungal cover if UPPER GI perforation', 'Fluconazole 400mg IV loading, then 200mg IV daily', 'The upper GI tract is colonised with Candida — an upper perforation seeds it into the peritoneum, and untreated fungal peritonitis is a recognised cause of ongoing sepsis after "adequate" antibiotics.', false),
      it('perf-ppi', 'IV PPI if perforated peptic ulcer', 'Omeprazole 40mg IV 12-hourly (or pantoprazole 40mg IV daily)', 'Acid suppression reduces ongoing chemical injury and supports healing of the repaired ulcer.'),
      it('perf-bloods', 'Bloods + group and save/crossmatch', 'FBC, UEC, amylase/lipase, LFTs, lactate, βhCG (women), group-and-save or crossmatch 2 units', 'Lactate and amylase gauge severity and catch the mimics; blood must be ready before theatre, not ordered after.'),
      it('perf-cxr', 'Erect CXR', 'Free air under the diaphragm in ~70-80% of perforations — ABSENCE does not exclude it', 'A negative erect CXR is reassuring, not exculpatory — a rigid abdomen with free air or without it both go to theatre if the picture is peritonitis.'),
      it('perf-mimics', 'Exclude the medical mimics before committing to theatre', 'Consider SBP (cirrhotic + ascites — ascitic tap PMN>250), TB peritonitis, DKA, pancreatitis — a rigid abdomen is not always a laparotomy', 'Operating on a cirrhotic with spontaneous bacterial peritonitis, or a DKA abdomen, converts a medical problem into a lethal surgical one.'),
      it('perf-theatre', 'Urgent theatre — source control', 'Book emergency theatre for laparotomy, washout, and definitive repair (patch/resect/drain/stoma) once mimics excluded', 'Source control IS the treatment of peritonitis — antibiotics alone will fail against ongoing contamination.'),
    ],
  },
  {
    id: 'acute-cholecystitis',
    title: 'Acute cholecystitis bundle',
    pattern: /cholecystitis|acute (gallbladder|GB) (sepsis|inflammation)/i,
    items: [
      it('chol-npo', 'NPO', 'Nil per os — rest the inflamed gallbladder and prepare for theatre', 'A fasted patient is both more comfortable and ready for an early laparoscopic cholecystectomy.'),
      it('chol-fluids', 'IV fluids', 'Ringer\'s lactate/0.9% saline maintenance ± bolus if septic/dehydrated', 'Fever and vomiting plus a fasted patient add up to a volume deficit that needs correcting before theatre.'),
      it('chol-analgesia', 'Analgesia', 'Morphine 0.05-0.1mg/kg IV titrated (diclofenac 75mg IM/PO if no contraindication — good for biliary colic pain)', 'Biliary pain is severe and adequate analgesia is part of resuscitation, not an afterthought.'),
      it('chol-abx', 'IV antibiotics', 'Amoxicillin-clavulanate 1.2g IV 8-hourly (or cefazolin 1g IV 8-hourly + metronidazole 500mg IV 8-hourly)', 'Per SA STG — covers the biliary/enteric organisms driving the cholecystitis until source control (cholecystectomy) is done.'),
      it('chol-lfts', 'LFTs + US', 'LFT pattern (obstructive vs hepatocellular), amylase/lipase (gallstone pancreatitis), US for stones/wall thickness/CBD diameter (≤6mm normal)', 'A dilated CBD changes the plan to ERCP first; a normal LFT does NOT exclude a CBD stone, so the duct diameter on US is the discriminator that matters.'),
      it('chol-early-lap', 'Early laparoscopic cholecystectomy', 'Book for lap chole within the index admission / <72h of symptom onset where service allows', 'Early surgery has fewer complications than the traditional "cool it down and come back in 6 weeks" approach — and it avoids a second septic episode while waiting.'),
      it('chol-cholangitis', 'Escalate if cholangitis (Charcot\'s triad)', 'RUQ pain + jaundice + fever/rigors (± hypotension/confusion = Reynolds\' pentad) → urgent biliary drainage (ERCP/PTC), do not wait for a routine list', 'Antibiotics alone will fail in an obstructed, infected biliary tree — drainage is the priority, not a slower-track admission.', false),
    ],
  },
  {
    id: 'perioperative-vte-analgesia',
    title: 'Peri-operative VTE prophylaxis & analgesia ladder',
    pattern: /post-?op(erative)?|peri-?op(erative)?|day \d+ post|after (surgery|laparotomy|theatre)/i,
    items: [
      it('pva-risk', 'VTE risk assessment', 'Score risk (surgery type, malignancy, immobility, prior VTE, obesity) and document', 'Surgery is a top VTE trigger — an undocumented risk assessment is the commonest audit failure on the surgical ward.'),
      it('pva-pharm', 'Pharmacological prophylaxis', 'Enoxaparin 40mg SC once daily — time first dose per anaesthesia (12h clear of/before a neuraxial block)', 'LMWH halves post-op VTE risk, but timed wrong around a spinal/epidural it causes an epidural haematoma — coordination with anaesthetics is mandatory.'),
      it('pva-mech', 'Mechanical prophylaxis', 'Graduated compression stockings + intermittent pneumatic compression device while immobile', 'Mechanical prophylaxis works from the moment of surgery and covers the patient who cannot yet have pharmacological prophylaxis (active bleeding risk, neuraxial timing).'),
      it('pva-mobilise', 'Early mobilisation', 'Sit out of bed day 0-1, walk with assistance day 1 onward — document distance/assistance', 'The single cheapest VTE prophylaxis and ileus-prevention intervention on the ward — and it doesn\'t need a prescription.'),
      it('pva-analgesia-base', 'Regular multimodal base', 'Paracetamol 1g IV/PO 6-hourly regular + consider NSAID (diclofenac 75mg IV/IM 12-hourly) only if no renal impairment/bleeding risk/anastomosis concern', 'A regular non-opioid base reduces total opioid need — which reduces ileus, sedation and respiratory depression.'),
      it('pva-analgesia-breakthrough', 'Breakthrough opioid', 'Morphine 2.5-5mg IV/SC 2-4 hourly prn, or tramadol 50-100mg 6-hourly prn — titrate to a pain score, review daily', 'Undertreated pain keeps the patient shallow-breathing and immobile — both of which independently raise VTE and pneumonia risk.'),
      it('pva-ponv', 'Antiemetic cover', 'Ondansetron 4mg IV 8-hourly prn', 'Opioids and ileus both drive PONV — treating it protects oral intake and mobilisation, both part of the VTE/recovery plan.'),
      it('pva-bowels', 'Track bowel recovery', 'Document flatus/bowels open, tolerating diet — prolonged ileus beyond day 5 is a leak until excluded', 'Physiological ileus resolves by day 3-5 for colonic surgery; going beyond that with pain/tachycardia/rising CRP is how an anastomotic leak first shows itself.', false),
    ],
  },
  // ─── Emergency (dossier: docs/clinical-build/research/emergency.md) ───
  {
    id: 'major-haemorrhage',
    title: 'Major haemorrhage / massive transfusion protocol',
    pattern: /major h(a)?emorrhage|massive (blood loss|transfusion)|exsanguinat|\bMTP\b/i,
    items: [
      it('mh-external', 'Catastrophic external haemorrhage control FIRST', 'Direct pressure, tourniquet, pelvic binder (at the greater trochanters), or haemostatic dressing — before airway/breathing', 'The <C>ABCDE "C" comes before "A" for a reason — a patient bleeding out externally dies of that before anything else kills them.'),
      it('mh-activate', 'Activate the massive transfusion protocol', 'Call blood bank NOW — trigger: ABC score ≥2, shock index >1, or an obvious exsanguinating pattern', 'MTP activation is a phone call, not a blood-gas result — waiting for confirmation before calling costs the minutes that matter.'),
      it('mh-txa', 'Tranexamic acid', '1g IV over 10 minutes, then 1g IV over 8 hours — MUST be within 3h of injury/bleed onset', 'CRASH-2: TXA given within 3h reduces death from bleeding; after 3h the benefit reverses — the clock is part of the prescription.'),
      it('mh-products', 'Balanced blood product transfusion', 'RBC:FFP:platelets in a 1:1:1 ratio — crossmatched, or O-negative uncrossmatched if unavailable in time', 'Replacing what is actually being lost (not just red cells) prevents the dilutional coagulopathy that crystalloid-heavy resuscitation causes.'),
      it('mh-permissive', 'Permissive hypotension', 'Target SBP ~90mmHg / a palpable radial pulse until the bleeding source is surgically controlled — minimise crystalloid', 'Normalising the BP before the bleeding is stopped just raises the pressure pushing blood out of the hole — control comes before normalisation.'),
      it('mh-calcium', 'Correct calcium', 'Calcium chloride 10ml 10% IV (or calcium gluconate 20ml 10%) after roughly every 4 units of blood product', 'Citrate in stored blood chelates calcium — hypocalcaemia worsens the coagulopathy you are transfusing to fix, and it is now recognised as a 4th member of the lethal triad.'),
      it('mh-warm', 'Keep warm', 'Warmed IV fluids/blood, warming blankets, remove wet clothing', 'Hypothermia, acidosis and coagulopathy each worsen the others — the "lethal triad" is prevented at the bedside, not treated after it sets in.'),
      it('mh-monitor', 'Serial lactate/base deficit + Hb trend', 'Repeat VBG lactate/base deficit and Hb every 30-60min during active resuscitation', 'A single Hb is misleading early in acute haemorrhage (it hasn\'t equilibrated yet) — the trend, alongside lactate clearance, is what tells you resuscitation is working.'),
    ],
  },
  {
    id: 'organophosphate-poisoning',
    title: 'Organophosphate poisoning',
    pattern: /organophosphate|cholinergic (crisis|toxidrome)|pesticide poisoning|carbamate poisoning/i,
    items: [
      it('op-ppe', 'Protect staff — decontaminate first', 'PPE, remove ALL contaminated clothing, wash skin with soap and water before further handling', 'Secondary exposure of staff from contaminated skin/clothing is a well-documented cause of the treating team becoming the next patient.'),
      it('op-atropine', 'Atropine — dose-double to atropinisation', '2mg IV, DOUBLE the dose every ~5min until atropinised (chest clear, HR>80, SBP>80, dry axillae, pupils no longer pinpoint), then start an infusion', 'Titrate to the CHEST, not the pupils or heart rate alone — under-atropinising and stopping at a "normal-looking" patient is the commonest fatal error; doses can be very large.'),
      it('op-pralidoxime', 'Pralidoxime (2-PAM)', '1-2g IV over 15-30min, then infusion 10-20mg/kg/h', 'Reactivates acetylcholinesterase and treats the nicotinic weakness atropine does not touch — give early, before the enzyme-toxin bond "ages" and becomes irreversible.'),
      it('op-benzo', 'Benzodiazepines for seizures/agitation', 'Diazepam 10mg IV, repeat as needed', 'CNS cholinergic overload causes agitation and seizures that atropine and pralidoxime do not directly treat.'),
      it('op-airway', 'Secure the airway early', 'Low threshold for intubation as secretions/weakness progress — AVOID suxamethonium (prolonged neuromuscular block, pralidoxime relevant)', 'Bronchorrhoea and bronchospasm are what actually kill in organophosphate poisoning — protect the airway before it is a crisis, not after.'),
      it('op-intermediate', 'Watch for intermediate syndrome (24-96h)', 'Admit and observe for proximal/neck-flexor/respiratory weakness — "can\'t lift the head off the pillow" — needs ventilatory support', 'This delayed weakness can follow apparent recovery from the acute cholinergic crisis — early discharge is how it is missed.', false),
    ],
  },
  {
    id: 'paracetamol-overdose',
    title: 'Paracetamol overdose / NAC protocol',
    pattern: /paracetamol overdose|acetaminophen overdose|paracetamol poisoning|paracetamol level/i,
    items: [
      it('para-level', 'Paracetamol level at 4h (or on presentation if later)', 'Level drawn no earlier than 4h post-ingestion; if presentation is later, staggered, or timing unknown — send immediately', 'A level drawn before 4h is uninterpretable on the nomogram — timing the sample correctly is the whole test.'),
      it('para-nomogram', 'Plot on the Rumack-Matthew nomogram', 'Treatment line: 150mg/L at 4h, ~37.5mg/L at 12h — treat if above the line, or if ingestion ≥150mg/kg (≥12g)', 'The nomogram — not the ingested-dose story alone — decides who needs NAC, because reported doses are unreliable.'),
      it('para-charcoal', 'Activated charcoal if within 1h', '1g/kg PO/NGT within ~1h of a significant ingestion, airway protected', 'Charcoal only helps in the first hour before absorption is complete — later than that it just delays definitive treatment.', false),
      it('para-nac', 'N-acetylcysteine — 3-bag IV regimen', '150mg/kg over 1h, then 50mg/kg over 4h, then 100mg/kg over 16h', 'NAC replenishes glutathione and prevents the hepatotoxic metabolite from destroying the liver — most effective started within 8h of ingestion.'),
      it('para-empirical', 'Give NAC empirically if presenting >8h', 'Start the 3-bag regimen while awaiting the level if ingestion was >8h ago, staggered, or timing unknown — do not wait for the result', 'Delay beyond 8-10h measurably increases the risk of hepatotoxicity — the empirical dose costs nothing if the level comes back low; waiting can cost the liver.'),
      it('para-bloods', 'LFTs, INR, creatinine, glucose, VBG', 'Baseline and repeat per protocol — rising ALT/INR signals hepatotoxicity despite treatment', 'These are the numbers that tell you whether NAC is working or whether the patient is heading toward liver failure and needs transplant-unit discussion.'),
      it('para-selfharm', 'Self-harm risk assessment before discharge', 'Formal psychiatric risk assessment + safety plan — do not discharge a deliberate overdose without it', 'Treating the paracetamol level and missing the intent behind it is how the same patient returns in a worse state.'),
    ],
  },
  {
    id: 'bacterial-meningitis-empirical',
    title: 'Bacterial meningitis — empirical treatment',
    pattern: /meningitis|meningism|neck stiffness.*(fever|headache)/i,
    items: [
      it('men-abx', 'Empirical IV antibiotics within the hour', 'Ceftriaxone 2g IV stat, then 2g IV 12-24 hourly', 'Treat within the hour on clinical suspicion — do NOT delay antibiotics for the LP or CT, every hour of delay costs neurons.'),
      it('men-steroid', 'Dexamethasone with/just before first antibiotic dose', '10mg IV, given with or immediately before the first ceftriaxone dose, then 6-hourly x4 days if bacterial confirmed', 'Given late (after antibiotics), steroids lose their benefit — the sequence matters as much as the drug for reducing neurological sequelae and deafness.'),
      it('men-tb-hiv', 'Add TB/cryptococcal cover if HIV+ or subacute picture', 'Consider empirical TB meningitis treatment and send CrAg/India ink — SA HIV/TB overlay changes the differential', 'Cryptococcal and TB meningitis are subacute and easily missed in HIV — the CSF panel must be sent even while treating presumed bacterial meningitis.'),
      it('men-viral', 'Add aciclovir if viral encephalitis cannot be excluded', 'Aciclovir 10mg/kg IV 8-hourly', 'HSV encephalitis is treatable and time-critical — cover it empirically until the picture (or PCR) says otherwise.', false),
      it('men-ct-first', 'CT before LP if indicated', 'CT brain first if focal neuro signs, papilloedema, reduced GCS, immunocompromised, or new seizure — otherwise go straight to LP', 'LP in the presence of raised ICP/a mass risks coning — but the CT decision must NOT delay the antibiotics.'),
      it('men-lp', 'LP panel', 'Opening pressure, cell count, protein, glucose (+ paired serum glucose), Gram stain/culture, CrAg/India ink, TB GeneXpert', 'The opening pressure and the full panel both diagnose the organism and, in cryptococcal disease, drive therapeutic CSF drainage.'),
      it('men-notify', 'Isolate + notify + contact prophylaxis', 'Droplet precautions until meningococcus excluded; meningococcal disease is notifiable — trace and offer prophylaxis to close contacts', 'Meningococcal meningitis can cause secondary cases in close contacts within days — public health notification is part of the acute management, not paperwork for later.'),
    ],
  },
];
