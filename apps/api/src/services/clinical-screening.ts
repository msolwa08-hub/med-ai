/**
 * Problem-linked screening & monitoring rules — DETERMINISTIC, no AI call.
 *
 * When a problem is on the active list, the matching rule injects its
 * monitoring/prophylaxis prompts into ward-round output and the problems UI
 * server-side, so the intern sees them even on a turn where the model didn't
 * repeat them. Every rule carries the specialist rationale for the UI's
 * "Why?" toggle. Matching is the same cheap lexical approach as STG
 * retrieval: regex over the problem/workingDx text.
 */

export interface ScreeningPrompt {
  /** Human-readable trigger, e.g. "DKA" — shown as the card title. */
  trigger: string;
  category: 'monitoring' | 'prophylaxis' | 'investigation' | 'safety';
  /** Punchy, transcription-ready directives. */
  prompts: string[];
  /** Specialist rationale for the Why? toggle. */
  why: string;
}

interface ScreeningRule extends ScreeningPrompt {
  pattern: RegExp;
}

const RULES: ScreeningRule[] = [
  {
    pattern: /\bDKA\b|diabetic ketoacidosis/i,
    trigger: 'DKA',
    category: 'monitoring',
    prompts: [
      'Hourly capillary glucose + hourly ketones until <0.6',
      'K+ 2-hourly while on insulin infusion — replace if <5.5 and passing urine; HOLD insulin if K+ <3.3',
      'Strict hourly fluid balance chart',
      'VBG 2-4 hourly (pH, HCO3, anion gap) until gap closed',
    ],
    why: 'Insulin drives K+ intracellularly — the K+ that kills in DKA is the one you did not check. Resolution is defined biochemically (ketones/gap), not by glucose alone; stopping the infusion on glucose normalisation alone causes rebound ketosis.',
  },
  {
    pattern: /open (fracture|#)|compound (fracture|#)/i,
    trigger: 'Open fracture',
    category: 'prophylaxis',
    prompts: [
      'IV antibiotics within 1h (cefazolin 2g IV; add gentamicin if Gustilo III / gross contamination)',
      'Tetanus toxoid ± immunoglobulin per immunisation status',
      'Photograph wound, remove gross contamination, saline-soaked dressing — then do NOT re-expose repeatedly',
      'Splint, NPO, analgesia, urgent ortho referral; document neurovascular status pre/post splint',
    ],
    why: 'Infection risk is set in the first hours: early narrow-spectrum antibiotics plus cover matched to Gustilo grade demonstrably reduces deep sepsis. Repeated ward re-exposure of the wound re-inoculates it — one look, one photo, cover it.',
  },
  {
    pattern: /\bsepsis\b|septic shock|septicaemia/i,
    trigger: 'Sepsis',
    category: 'monitoring',
    prompts: [
      'Blood cultures BEFORE first antibiotic dose (do not delay abx >1h for them)',
      'Hourly vitals + urine output (catheterise if shocked; target UO ≥0.5ml/kg/h)',
      'Repeat lactate at 2-4h to confirm clearance',
      'Reassess fluid responsiveness after each bolus — do not blind-bolus to hypotension',
    ],
    why: 'Each hour of delayed appropriate antibiotics measurably increases mortality; lactate clearance is the best bedside proxy that resuscitation is actually working. Urine output is the poor man\'s cardiac output monitor at district level.',
  },
  {
    pattern: /GI bleed|upper gi|haematemesis|melaena|variceal/i,
    trigger: 'GI bleed',
    category: 'monitoring',
    prompts: [
      '2x large-bore IV (16G), crossmatch 2-4 units',
      'Hb 4-6 hourly; transfuse restrictively (target Hb 7) unless exsanguinating/IHD',
      'PPI IV; if cirrhotic/suspected varices add terlipressin + ceftriaxone',
      'Hourly vitals; early scope referral — document Rockall/Blatchford',
    ],
    why: 'Restrictive transfusion improves survival in UGIB (over-transfusion raises portal pressure and rebleeding). Cirrhotics bleed from varices until proven otherwise — vasoactive drugs and antibiotic prophylaxis are the two interventions with mortality benefit before endoscopy.',
  },
  {
    pattern: /\bstroke\b|\bCVA\b|hemiparesis/i,
    trigger: 'Stroke',
    category: 'safety',
    prompts: [
      'NPO until formal swallow screen passed — no exceptions, including oral meds',
      'Glucose now (hypoglycaemia mimics); BP — do NOT drop acutely unless thrombolysis/end-organ criteria',
      'GCS + neuro obs 4-hourly first 48h',
      'DVT prophylaxis review at 24h; early mobilisation once stable',
    ],
    why: 'Aspiration pneumonia is the biggest preventable killer after stroke — one failed sip kills more than the infarct extension you were watching for. Acutely lowering BP extends the penumbral infarct; permissive hypertension is deliberate.',
  },
  {
    pattern: /\bACS\b|myocardial infarct|\bSTEMI\b|\bNSTEMI\b|unstable angina/i,
    trigger: 'ACS',
    category: 'monitoring',
    prompts: [
      'Serial ECGs (on arrival, 15-30min if ongoing pain, and with any recurrence) + troponin at 0h and 3-6h',
      'Continuous cardiac monitoring first 24-48h — arrhythmia is the early killer',
      'Document TIMI/GRACE; aspirin + second antiplatelet + LMWH per STG unless contraindicated',
    ],
    why: 'A single normal ECG/troponin excludes nothing early; the killers (VF, complete heart block) cluster in the first day and are only caught on a monitor. Risk scores are what buy your patient a cath-lab conversation.',
  },
  {
    pattern: /\bAKI\b|acute kidney injury|acute renal/i,
    trigger: 'AKI',
    category: 'safety',
    prompts: [
      'STOP nephrotoxics now (NSAIDs, aminoglycosides, ACEi/ARB in context) + dose-adjust the rest to eGFR',
      'Daily UEC + strict input/output charting',
      'Urine dipstick + sediment today (pre-renal vs intrinsic vs obstructive work-up)',
      'K+ today — ECG if ≥6.0; escalate if refractory hyperK, acidosis, overload or uraemia (dialysis criteria)',
    ],
    why: 'Most district-level AKI is pre-renal or drug-driven and reversible in 48h if you remove the insult early. The dialysis criteria (AEIOU) are the escalation triggers you must be able to recite when phoning the referral centre.',
  },
  {
    pattern: /pre-?eclampsia|\bPET\b|eclampsia|gestational hypertension/i,
    trigger: 'Pre-eclampsia',
    category: 'monitoring',
    prompts: [
      'BP 4-hourly (hourly if severe features); urine protein quantified',
      'Symptoms check each round: headache, visual, epigastric pain; reflexes + clonus',
      'Bloods: FBC (platelets), UEC, LFTs, urate — repeat 6-12h if severe',
      'If on MgSO4: hourly RR, patellar reflexes, urine output — Ca gluconate at bedside',
    ],
    why: 'Pre-eclampsia kills via eclampsia, HELLP, abruption and pulmonary oedema — every one is heralded by the parameters above, not by the BP number alone. MgSO4 toxicity (lost reflexes → respiratory depression) is fully reversible only if you are checking for it.',
  },
  {
    pattern: /\bPPH\b|post-?partum haemorrhage/i,
    trigger: 'PPH',
    category: 'monitoring',
    prompts: [
      'Vitals every 15min x4 then 30min x2; running EBL total charted',
      'Fundal checks with each obs set — atony recurs',
      'Hb at 6h post-stabilisation; crossmatch held for 24h',
      'Document the 4 Ts screen (Tone, Trauma, Tissue, Thrombin) as excluded',
    ],
    why: 'Recurrent atony after initial control is the classic ward-level death: the uterus that contracted for the registrar relaxes at 02:00. Serial fundal checks with obs catch it; a single post-event Hb under-calls ongoing loss.',
  },
  {
    pattern: /meningitis/i,
    trigger: 'Meningitis',
    category: 'monitoring',
    prompts: [
      'GCS + pupils hourly first 24h',
      'Droplet isolation until 24h of effective antibiotics',
      'Household/close-contact ciprofloxacin prophylaxis if meningococcal',
      'HIV test (cryptococcal work-up if positive: serum CrAg, consider LP manometry)',
    ],
    why: 'Deterioration is neurological and fast — hourly GCS is the monitor. In SA, HIV changes the organism list entirely: cryptococcus needs opening pressures managed, not just amphotericin.',
  },
  {
    pattern: /severe acute malnutrition|\bSAM\b|kwashiorkor|marasmus/i,
    trigger: 'SAM (WHO 10 steps)',
    category: 'safety',
    prompts: [
      'Glucose 3-hourly first 24-48h (treat <3 mmol/L); feed F-75 3-hourly incl. overnight',
      'Axillary temp 3-hourly — hypothermia = sepsis until proven otherwise; kangaroo/warm',
      'NO IV fluids unless shocked (then cautious 15ml/kg over 1h, reassess) — use ReSoMal for dehydration',
      'Broad-spectrum antibiotics routinely; delay iron until week 2 (rehabilitation phase)',
    ],
    why: 'SAM physiology inverts normal paediatric resuscitation: the myocardium is atrophic and sodium-loaded, so standard boluses cause fatal overload. Hypoglycaemia, hypothermia and occult sepsis are one triad — each finding mandates treating all three.',
  },
  {
    pattern: /neonatal jaundice|hyperbilirubin/i,
    trigger: 'Neonatal jaundice',
    category: 'monitoring',
    prompts: [
      'TSB plotted on hour-specific nomogram (never treat a number without hours-of-life)',
      'Repeat TSB 6-12h while on phototherapy; check rate of rise',
      'Feeding chart + weights daily; assess for sepsis/haemolysis triggers (blood group, Coombs, G6PD)',
      'Thompson score serially if any encephalopathy concern',
    ],
    why: 'Kernicterus is entirely preventable and entirely irreversible — the nomogram exists because a bilirubin of 250 means opposite things at 24h and 96h of life. Rate of rise >8.5 µmol/L/h screams haemolysis.',
  },
  {
    pattern: /head injury|traumatic brain|\bTBI\b|base of skull/i,
    trigger: 'Head injury',
    category: 'monitoring',
    prompts: [
      'Neuro obs (GCS, pupils, limb power) hourly x4, then 2-hourly if stable',
      'Any GCS drop ≥2, pupil change, or seizure → immediate senior call + CT',
      'No sedation that masks GCS without senior sign-off; treat pain (pain drops GCS scores falsely)',
      'Check for cervical spine clearance documentation',
    ],
    why: 'The lucid interval is the whole reason neuro obs exist: an extradural talks and dies within hours. The obs chart is your only early-warning system where CT access is rationed overnight.',
  },
  {
    pattern: /alcohol withdrawal|delirium tremens|\bDTs\b/i,
    trigger: 'Alcohol withdrawal',
    category: 'monitoring',
    prompts: [
      'CIWA-Ar scoring 4-hourly, symptom-triggered benzodiazepine dosing',
      'Thiamine 300mg IV BEFORE any glucose/dextrose',
      'Glucose, UEC + Mg/PO4 (replace — refeeding risk overlaps)',
      'Seizure precautions; escalate to HDU if DTs (tachycardia + confusion + tremor)',
    ],
    why: 'Glucose before thiamine precipitates Wernicke encephalopathy — an irreversible iatrogenic disaster in one syringe order. Symptom-triggered benzos beat fixed dosing on both under- and over-sedation.',
  },
  {
    pattern: /\bburns?\b.*(%|TBSA)|major burn|flame burn|scald/i,
    trigger: 'Burns',
    category: 'monitoring',
    prompts: [
      'Fluids per Parkland (4ml/kg/%TBSA, half in first 8h from TIME OF BURN) + paeds maintenance',
      'Hourly urine output: target 0.5ml/kg/h adult, 1ml/kg/h child — titrate fluids to this, not the formula',
      'Tetanus prophylaxis; NGT if >20% TBSA; check for inhalation injury (voice, soot, singed hairs) serially',
      'Reassess distal perfusion in circumferential burns — escharotomy criteria',
    ],
    why: 'Parkland is a starting estimate, not a prescription — urine output is the resuscitation endpoint. Airway oedema from inhalation injury peaks late; the voice you cleared at 14:00 can be obstructed by 22:00.',
  },
  {
    pattern: /\bTB\b|tuberculosis|GeneXpert/i,
    trigger: 'TB',
    category: 'investigation',
    prompts: [
      'Sputum GeneXpert Ultra (x1) + smear for monitoring baseline; urine LAM if HIV+ and CD4<200 or seriously ill',
      'HIV test if status unknown; CD4 + CrAg if positive',
      'Airborne isolation / cohort + N95 for staff until smear status known',
      'Contact screening initiated (household children <5 need TPT assessment)',
    ],
    why: 'In SA every TB diagnosis is an HIV encounter and vice versa — treatment, IRIS risk and mortality all pivot on the co-infection. Urine LAM is the test that finds the disseminated TB your sputum never will in advanced HIV.',
  },
  {
    pattern: /psychosis|psychotic|schizophrenia|\bMHCA\b|72.?hour/i,
    trigger: 'Psychiatric admission (MHCA)',
    category: 'safety',
    prompts: [
      'Suicide/violence risk assessment documented each shift',
      'MHCA paperwork status check: Form 04 (application) + two Form 05s within statutory window',
      'Exclude organic cause: glucose, UEC, TSH, HIV, RPR, urine tox — delirium screen before "psychiatric" label',
      '72-hour assessment observations charted; no unescorted leave',
    ],
    why: 'The MHCA 72-hour assessment is a legal instrument — missing or late forms make the detention unlawful and expose the clinician. Half of "first psychosis" at district level is organic (HIV, drugs, thyroid); the label you write first is the one that sticks.',
  },
  {
    pattern: /hyperkal(ae|e)mia|K\+?\s*[>≥]\s*6/i,
    trigger: 'Hyperkalaemia',
    category: 'monitoring',
    prompts: [
      'ECG NOW + continuous monitoring until K+ <6 and falling',
      'Repeat K+ 1-2h after each treatment cycle (shifts wear off)',
      'Stop all K+ sources and K+-sparing/ACEi/ARB drugs; review for missed AKI',
      'Definitive removal plan documented (resonium/dialysis) — shifting alone is a loan, not a payment',
    ],
    why: 'Calcium stabilises, insulin/salbutamol only SHIFT potassium — it all comes back out in 2-4 hours into the same ECG. Every hyperkalaemia has a cause; in this setting it is AKI or a drug chart until proven otherwise.',
  },
  {
    pattern: /\bDVT\b|pulmonary embol|\bPE\b(?![A-Za-z])/i,
    trigger: 'VTE',
    category: 'monitoring',
    prompts: [
      'Document Wells score justifying the pathway taken',
      'On anticoagulation: baseline Hb/platelets/UEC; platelets at day 3-5 if on heparins (HIT screen)',
      'Assess bleeding risk (HAS-BLED logic) and write the reversal plan',
      'If PE: sats + RR trending each shift; escalate on new hypotension (massive PE criteria)',
    ],
    why: 'Anticoagulation is the treatment and the main iatrogenic threat — renal dosing errors with enoxaparin are the classic incident. A normotensive PE that becomes hypotensive has crossed into thrombolysis territory; the trend is the trigger.',
  },
  {
    pattern: /post-?op|laparotomy|post surgical|day \d+ post/i,
    trigger: 'Post-operative',
    category: 'monitoring',
    prompts: [
      'Wound review each round: erythema, discharge, dehiscence — document explicitly',
      'DVT prophylaxis charted and actually given; early mobilisation order',
      'Drain outputs charted with running totals; escalate on fresh blood >100ml/h',
      'Day-3 fever work-up ladder: lungs → urine → wound → lines → legs → collections',
    ],
    why: 'Post-op fever timing is the diagnosis: atelectasis day 1, UTI day 2-3, wound day 4-5, collection/leak day 5+. An anastomotic leak announces itself as an unexplained tachycardia long before peritonism — the pulse trend is the earliest sign.',
  },
  {
    pattern: /diabetic foot|foot ulcer|foot sepsis/i,
    trigger: 'Diabetic foot',
    category: 'investigation',
    prompts: [
      'Probe-to-bone test + foot X-ray (osteomyelitis, gas)',
      'Strict offloading order written (not just advised)',
      'Vascular exam documented: pulses, ABI if palpation equivocal',
      'Glycaemic control reviewed — sepsis will derange it; check for missed DKA/HHS',
    ],
    why: 'A probe that touches bone is osteomyelitis until proven otherwise — it changes antibiotics from days to weeks and flags the amputation-risk conversation. The ulcer is a symptom; the disease is pressure plus ischaemia plus glucose.',
  },
];

/**
 * Match active problems against the registry. Each rule fires at most once
 * regardless of how many problems mention it.
 */
export function screeningForProblems(problemTexts: string[]): ScreeningPrompt[] {
  const joined = problemTexts.join(' \n ');
  const out: ScreeningPrompt[] = [];
  for (const rule of RULES) {
    if (rule.pattern.test(joined)) {
      const { pattern: _pattern, ...prompt } = rule;
      out.push(prompt);
    }
  }
  return out;
}
