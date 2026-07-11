import type { DeptId } from './departments';

// ─── Exam targets (value-capture) ────────────────────────────────────────────
// The pertinent things to look for: a universal vitals block, a per-department
// survey, and presentation-adaptive additions. These are VALUE targets — the
// intern types the reading/finding (or taps NAD); nothing is "required" and
// nothing is a "did you do it" tick. Each item carries a teaching "why".
// Captured values serialize into the vitals/examination text.
// (The differential-driven focused list — the engine's kind:'exam'
// discriminating features — is layered on top of this at the ClerkTab call
// site; see M-UI/7.)

export interface ChecklistItem {
  id: string;
  label: string;
  why: string;
}

export interface ChecklistSection {
  id: string;
  title: string;
  items: ChecklistItem[];
}

// The 4th arg (historically `mandatory`) is accepted for call-site
// compatibility but deliberately IGNORED — nothing in the exam is "required"
// any more (M-UI/7). A value existing is the only "done"; the exam is a
// value-capture aid, never a demand.
function item(id: string, label: string, why: string, _mandatory?: boolean): ChecklistItem {
  return { id, label, why };
}

// ── Universal vitals ─────────────────────────────────────────────────────────

function universalVitals(presentingText: string): ChecklistSection {
  const items: ChecklistItem[] = [
    item('vit-bp', 'BP recorded', 'Hypotension is a late sign — trend it, don’t spot-check it.', true),
    item('vit-hr', 'Heart rate recorded', 'Tachycardia is the earliest compensatory sign of shock, sepsis, pain and bleeding.', true),
    item(
      'vit-rr',
      'RR COUNTED over 30-60s',
      'The most sensitive, worst-recorded vital sign — a rising RR precedes deterioration hours before the BP falls. Count it yourself; do not copy "18" off the chart.',
      true
    ),
    item('vit-temp', 'Temperature recorded', 'Fever or hypothermia both count toward sepsis criteria — hypothermia is the more sinister of the two.', true),
    item('vit-sats', 'SpO2 on room air noted', '"94% on face mask" and "94% on room air" are different patients — always document the oxygen the sats were measured on.', true),
  ];
  if (/reduced (LOC|level)|unconscious|GCS|confus|drowsy|unresponsive|coma/i.test(presentingText)) {
    items.push(item('vit-gcs', 'GCS scored (E/V/M breakdown)', 'A single number hides the trend — document the eye/verbal/motor components so the next assessor can compare.', true));
  }
  if (/unwell|sepsis|reduced (LOC|level)|seizure|collapse|diabet|vomit|confus/i.test(presentingText)) {
    items.push(item('vit-glucose', 'Bedside glucose checked', 'Hypoglycaemia mimics stroke, sepsis and psychosis, and kills fast — it is a vital sign in any unwell patient.', true));
  }
  return { id: 'vitals', title: 'Vitals — every patient', items };
}

// ── Per-department blocks ────────────────────────────────────────────────────
// A department's block is either a fixed section or (where the ward changes
// the exam entirely — O&G, Paeds) a function of the selected sub-department.

const DEPT_SECTIONS: Record<DeptId, ChecklistSection | ((subDept?: string) => ChecklistSection)> = {
  medicine: {
    id: 'dept-medicine',
    title: 'General medicine screen',
    items: [
      item('med-jaccol', 'JACCOL (jaundice, anaemia, cyanosis, clubbing, oedema, lymphadenopathy)', 'The hands-and-face screen catches chronic disease the history missed — clubbing alone changes the differential.'),
      item('med-lungs', 'Lung fields auscultated (all zones, incl. bases)', 'Basal crackles and effusions live at the back — auscultating the front only misses them.', true),
      item('med-jvp', 'JVP assessed', 'The JVP is the bedside CVP: raised in failure and tamponade, flat in hypovolaemia.'),
      item('med-oedema', 'Peripheral oedema checked', 'Grading oedema tracks fluid status day to day — it is a treatment-response measure, not decoration.'),
      item('med-calves', 'Calves examined', 'Every medical inpatient is a VTE risk — a swollen tender calf is a PE you can still prevent.'),
    ],
  },
  surgery: {
    id: 'dept-surgery',
    title: 'Surgical abdomen screen',
    items: [
      item('surg-guarding', 'Guarding / rebound tenderness assessed', 'Peritonism is the finding that books the theatre — it must be actively sought and explicitly documented, present or absent.', true),
      item('surg-bowel-sounds', 'Bowel sounds auscultated', 'Absent sounds → ileus/peritonitis; tinkling → obstruction. Thirty seconds of listening changes the differential.'),
      item('surg-hernial', 'Hernial orifices examined', 'An obstructed femoral hernia is the classic missed cause of bowel obstruction — the groin is part of every abdominal exam.', true),
      item('surg-dre', 'DRE performed where indicated', 'PR bleeding, obstruction, urinary retention: the diagnosis is a glove away. Document if deferred and why.'),
      item('surg-scars', 'Scars / previous surgery noted', 'Adhesions from previous surgery are the commonest cause of small bowel obstruction.'),
    ],
  },
  og: (subDept?: string): ChecklistSection => {
    if (subDept === 'labour') {
      return {
        id: 'dept-og-labour',
        title: 'Labour ward — intrapartum routine',
        items: [
          item('og-lab-palp', 'Abdominal palpation BEFORE the VE (fifths above brim)', 'Descent in fifths palpable abdominally is the caput-proof measure of progress — a VE without a preceding palpation can call "descent" when the head has not moved, only swelled.', true),
          item('og-lab-ve', 'VE complete: dilation, effacement, station, membranes/liquor, caput, moulding, position', 'A VE that records only "4cm" wastes the exam and the infection risk it cost — every element changes the plan: moulding flags CPD, position explains slow progress, liquor grades fetal risk.', true),
          item('og-lab-partogram', 'Findings PLOTTED on the partogram', 'An unplotted labour is an unmonitored labour. The alert line assumes 1cm/hr in active labour; crossing the ACTION line (4h later) mandates a district-level decision — ARM/oxytocin if no CPD, or CS/transfer. The lines only work if the Xs go on in real time.', true),
          item('og-lab-fhr', 'FHR after a contraction — half-hourly in active labour, after each contraction in 2nd stage', 'Late decelerations are only audible in the minute AFTER a contraction — listening between contractions is how fetal distress is missed on a "monitored" labour.', true),
          item('og-lab-liquor', 'Liquor colour recorded at every assessment', 'Fresh thick meconium upgrades surveillance to continuous CTG and warns the neonatal resus team before the delivery, not after it.'),
          item('og-lab-bladder', 'Bladder emptied / urine charted 2-hourly', 'A full bladder obstructs descent during labour and causes atony (PPH) after it — catheterise if she cannot void.'),
          item('og-lab-obs', 'Maternal obs on the partogram (BP + pulse hourly, temp 4-hourly)', 'The partogram monitors the mother too — a rising pulse is the earliest sign of concealed haemorrhage, sepsis or uterine rupture in labour.', true),
        ],
      };
    }
    if (subDept === 'postnatal') {
      return {
        id: 'dept-og-postnatal',
        title: 'Postnatal check — by mode of delivery',
        items: [
          item('og-pn-mode', 'Mode of delivery + day post delivery framed at the top', 'The whole postnatal exam branches on the mode: perineum vs wound, VTE risk, next-pregnancy counselling — and every finding has a day-specific norm.', true),
          item('og-pn-fundus', 'Fundus palpated (height + tone)', 'A boggy or high uterus is atony or retained products — the bedside screen for the secondary PPH that happens after everyone relaxed.', true),
          item('og-pn-lochia', 'Lochia inspected on the pad (amount, colour, odour)', 'Look, don’t ask — heavy or offensive lochia is PPH or endometritis declaring itself, and patients under-report both.', true),
          item('og-pn-perineum', 'Perineum inspected (post-NVD/assisted): repair intact, no haematoma, tear GRADED', 'A 3rd/4th degree tear managed as a "tear" becomes faecal incontinence — grading buys laxatives, physio and a direct continence question at follow-up. Severe pain + swelling = haematoma until looked at.'),
          item('og-pn-wound', 'CS wound inspected (post-CS)', 'Wound sepsis declares itself around day 3 — exactly when she is being discharged; EMCS carries a higher sepsis risk than ELCS, so the emergency section earns a closer look.'),
          item('og-pn-vte', 'Calves checked + thromboprophylaxis chart reviewed (esp. post-CS)', 'Pregnancy plus surgery is the highest-risk VTE combination on the ward — thromboembolism is a leading cause of maternal death in the SA confidential enquiries.', true),
          item('og-pn-breasts', 'Breasts + latch OBSERVED', 'Watching one feed catches the poor latch behind "baby cries all the time" — engorgement vs mastitis diverge from day 3.'),
          item('og-pn-bladder', 'Voided since delivery?', 'Retention hides after epidurals and instrumental deliveries — an overdistended bladder today is a floppy bladder for months.'),
          item('og-pn-mood', 'Mood screened (EPDS) before discharge', 'Postnatal depression hides behind "just tired" — EPDS ≥13 or ANY self-harm thought is a referral, not reassurance. The legitimate psych exception on an obstetric ward.', true),
        ],
      };
    }
    if (subDept === 'gynae') {
      return {
        id: 'dept-og-gynae',
        title: 'Gynae screen',
        items: [
          item('og-gyn-preg', 'Pregnancy test result IN the notes', 'Every woman of reproductive age with bleeding or pain is an ectopic until the test is negative — "probably not pregnant" has killed patients a urine test would have saved.', true),
          item('og-gyn-quant', 'Bleeding QUANTIFIED (pads/day, clots, flooding)', '"Heavy PV bleed" is not a measurement — pads per day and clot size grade urgency, transfusion risk and response to treatment.', true),
          item('og-gyn-speculum', 'Speculum: os open/closed, products, source of bleeding', 'Products in an open os cause pain, bleeding and vagal shock — removing them at speculum is both diagnosis and treatment.', true),
          item('og-gyn-bimanual', 'Bimanual: uterine size, cervical motion tenderness, adnexae', 'Cervical excitation plus adnexal tenderness is ectopic or PID until excluded — the bimanual is where the acute gynae differential actually splits.', true),
          item('og-gyn-abdo', 'Abdomen examined for peritonism', 'The ruptured ectopic and the ruptured cyst present as an acute abdomen — guarding with a positive pregnancy test books theatre, not a scan queue.'),
        ],
      };
    }
    // Antenatal ward (or no sub-department chosen).
    return {
      id: 'dept-og',
      title: 'Antenatal / obstetric screen',
      items: [
        item('og-sfh', 'SFH measured AND plotted on the chart', 'One SFH value means little — the curve is the growth screen: flattening or crossing centiles flags restriction, a lead flags multiples/polyhydramnios. >2-3cm off dates → ultrasound.', true),
        item('og-leopolds', 'Lie & presentation (Leopold’s)', 'A breech or transverse lie discovered in labour is an emergency that was findable weeks earlier — from 36w it buys ECV or a planned CS.', true),
        item('og-fh', 'Fetal heart heard & rate documented', 'The FH is the fetal vital sign — "FH not documented" is indefensible in any obstetric note.', true),
        item('og-fm', 'Fetal movements asked about (every visit from 28w)', 'Reduced movements is the commonest last presentation before stillbirth — the answer is a CTG today, never reassurance without one.', true),
        item('og-bp-trend', 'BP compared against the BOOKING baseline', 'A rise of ≥15 diastolic from booking matters even below 140/90 — pre-eclampsia is a trend diagnosis, and the booking BP is the trend’s anchor.', true),
        item('og-reflexes', 'Reflexes + clonus if hypertensive', 'Hyperreflexia and clonus are the bedside signs of imminent eclampsia — check them in every hypertensive pregnancy.'),
        item('og-oedema', 'Oedema (face/hands) if hypertensive', 'Facial and hand oedema with hypertension raises pre-eclampsia; dependent ankle oedema alone is normal in pregnancy.'),
      ],
    };
  },
  paeds: (subDept?: string): ChecklistSection => {
    if (subDept === 'neonatal') {
      return {
        id: 'dept-paeds-neonatal',
        title: 'Neonatal daily check',
        items: [
          item('paeds-neo-weight', 'Weight today vs birth weight (% change computed)', 'Up to 10% loss is physiological and regained by day 10-14 — beyond that is a feeding failure or sodium problem to work up, not to watch.', true),
          item('paeds-neo-jaundice', 'Jaundice assessed in daylight + anchored to HOURS of life', 'Jaundice within 24h of life is ALWAYS pathological (haemolysis until proven otherwise), and a bilirubin means nothing without the hour it was taken — the phototherapy lines are hour-specific.', true),
          item('paeds-neo-feeding', 'Feed observed + volumes computed per kg', 'The prescription is ml/kg/day, and "feeding well" is not a number — a neonate refusing feeds is septic until proven otherwise.', true),
          item('paeds-neo-temp', 'Axillary temperature — hypothermia actively excluded', 'Neonates get COLD with sepsis more often than they get febrile — hypothermia is a danger sign, not a nursing footnote.', true),
          item('paeds-neo-umbi', 'Umbilicus inspected', 'Peri-umbilical redness or pus is a portal straight into the portal vein — omphalitis is neonatal sepsis with a visible front door.'),
          item('paeds-neo-fontanelle', 'Fontanelle + tone/handling assessed', 'Bulging fontanelle, floppiness or irritable handling are the neonate’s meningism — the classic signs simply don’t exist at this age.'),
          item('paeds-neo-discharge', 'Pre-discharge: red reflex + hips (Ortolani/Barlow) + pulses', 'Cataract, retinoblastoma, DDH and coarctation are all silent, all findable in two minutes, and all much worse when found late — the discharge exam is a screening programme.'),
        ],
      };
    }
    if (subDept === 'malnutrition') {
      return {
        id: 'dept-paeds-sam',
        title: 'SAM corner — WHO ten-steps check',
        items: [
          item('paeds-sam-anthro', 'Weight, WHZ plotted, MUAC, oedema GRADED (+/++/+++)', 'The diagnosis and the discharge criteria both live in these numbers — and in oedematous SAM the weight goes DOWN as the child improves; grade the oedema or misread the trend.', true),
          item('paeds-sam-glucose', 'Glucose checked NOW', 'Step 1 of the WHO ten steps: hypoglycaemia kills SAM children in the first 48h, and it presents as nothing more than quietness — check it, feed 2-hourly, recheck.', true),
          item('paeds-sam-temp', 'Temperature — hypothermia excluded', 'Step 2: hypothermia in SAM is both a killer in itself and a sign of sepsis or hypoglycaemia — kangaroo-warm the child and hunt the cause.', true),
          item('paeds-sam-hydration', 'Hydration assessed CAUTIOUSLY (ReSoMal, not IV)', 'Every dehydration sign is mimicked by SAM itself (sunken eyes, slow pinch) — over-diagnosing it and giving IV fluids causes heart failure; rehydrate orally with ReSoMal, IV only in true shock.', true),
          item('paeds-sam-infection', 'Infection screen despite no fever', 'SAM children mount no fever and no white count — the WHO steps give ALL of them broad-spectrum antibiotics because the exam cannot exclude sepsis here.', true),
          item('paeds-sam-appetite', 'Appetite test with RUTF done', 'The appetite test is the triage between inpatient F-75 and outpatient RUTF — a failed appetite IS a complication.'),
          item('paeds-sam-eyes-skin', 'Eyes (vitamin A signs) + skin/dermatosis + mouth checked', 'Bitot’s spots and corneal clouding are hours from perforation without vitamin A; kwashiorkor dermatosis weeps, infects, and loses fluid like a burn.'),
        ],
      };
    }
    // General paediatric ward (or no sub-department chosen).
    return {
      id: 'dept-paeds',
      title: 'Paediatric screen',
      items: [
        item('paeds-imci', 'IMCI danger signs screened: unable to drink/breastfeed, vomits everything, convulsions, lethargic/unconscious', 'The four general danger signs come FIRST in every sick child — any one reclassifies as severe: admit and treat, do not send home. Document "screened negative" explicitly.', true),
        item('paeds-weight', 'Weight PLOTTED on the RTHB growth curve (with centile)', 'A weight written but not plotted misses the fall across centiles — plotting against the child’s own previous weights is what turns a number into a diagnosis.', true),
        item('paeds-muac', 'MUAC measured (6-59 months)', 'MUAC <11.5cm = SAM even when weight-for-age looks acceptable — ten seconds of tape catches the wasted child the scale flatters.', true),
        item('paeds-rtc', 'RTHB (Road to Health Book) SEEN — growth, immunisation, HIV/TB pages', 'The book is the child’s medical record: growth trend, EPI doses, PCR results, TB exposure. "Book not seen" is a data gap to close, not a checkbox to skip.', true),
        item('paeds-epi', 'Immunisations checked against the SA EPI schedule for age', 'Birth (BCG, OPV0), 6w (OPV1, RV1, hexavalent-1, PCV1), 10w (hexavalent-2), 14w (hexavalent-3, PCV2, RV2), 6m (measles-1), 9m (PCV3), 12m (measles-2), 18m (hexavalent booster) — every admission is a catch-up opportunity.', true),
        item('paeds-hydration', 'Hydration signs (sunken eyes, skin pinch, drinking behaviour)', 'IMCI classifies dehydration on these exact signs — they choose Plan A/B/C: home fluids vs supervised ORS vs IV.', true),
        item('paeds-fontanelle', 'Fontanelle assessed (infants)', 'Bulging → raised ICP/meningitis; sunken → dehydration. Two seconds of palpation, two major diagnoses.'),
        item('paeds-tb-hiv', 'TB contact + HIV status established', 'The two great mimics of SA paediatrics — a household TB contact makes a child <5 TPT-eligible even when well, and an HIV-exposed child with no documented test needs one this visit.'),
      ],
    };
  },
  icu: {
    id: 'dept-icu',
    title: 'ICU daily screen',
    items: [
      item('icu-lines', 'All lines/catheters reviewed with day-count', 'Every line-day is infection risk — a line without a documented day-count never gets removed.', true),
      item('icu-sedation', 'Sedation score documented (RASS)', 'Daily sedation assessment (and interruption where safe) shortens ventilation and delirium.', true),
      item('icu-pressure', 'Pressure areas inspected', 'Pressure injuries develop in hours in the sedated patient and add weeks of admission.'),
      item('icu-tube', 'ETT/trachy position & cuff checked', 'A migrated tube is an airway emergency found on routine checks, not after desaturation.'),
      item('icu-feeds', 'Feeds/nutrition reviewed', 'Underfeeding is muscle loss and failed weaning — nutrition is a daily prescription like any drug.'),
    ],
  },
  emergency: {
    id: 'dept-emergency',
    title: 'Emergency primary survey',
    items: [
      item('ed-abcde', 'ABCDE documented in order', 'The primary survey is a treatment sequence, not a heading — documenting it proves each threat was cleared in order.', true),
      item('ed-cspine', 'C-spine considered/cleared', 'Any trauma or reduced LOC: the spine is injured until cleared clinically or radiologically — and the decision must be written down.', true),
      item('ed-exposure', 'Fully exposed & examined (then covered)', 'The stab wound in the back, the rash of meningococcus — what you don’t expose, you miss.', true),
      item('ed-analgesia', 'Analgesia given & reassessed', 'Pain is the fifth vital: under-treated pain also invalidates the abdominal exam you are about to trust.'),
    ],
  },
  psych: {
    id: 'dept-psych',
    title: 'Psychiatric screen',
    items: [
      item('psych-mse', 'MSE documented under headings', 'Appearance, behaviour, speech, mood/affect, thought, perception, cognition, insight — headings force completeness.', true),
      item('psych-suicide', 'Suicide risk asked DIRECTLY & documented', 'Asking directly does not plant the idea. The verbatim answer is both clinical care and legal protection.', true),
      item('psych-organic', 'Organic screen (vitals, glucose, focal neuro, substances)', 'Delirium, hypoglycaemia and intoxication present as psychiatry — miss the organic cause and the "psych patient" dies medically.', true),
      item('psych-collateral', 'Collateral history sought', 'The patient with psychosis or mania cannot be the only historian — family and clinic notes complete the picture.'),
    ],
  },
  ortho: {
    id: 'dept-ortho',
    title: 'Orthopaedic / trauma limb screen',
    items: [
      item('ortho-pulses', 'Distal pulses documented', 'A pulseless limb distal to a fracture or dislocation is a vascular emergency measured in hours.', true),
      item('ortho-sensation', 'Sensation tested — NAMED nerves', '"Sensation intact" is meaningless; "radial/median/ulnar intact" proves you tested the nerves at risk for this injury.', true),
      item('ortho-joint-above-below', 'Joint above & below examined', 'The classic miss: the hip fracture with the injured knee, the ankle with the proximal fibula fracture (Maisonneuve).', true),
      item('ortho-compartments', 'Compartments soft, pain proportionate', 'Compartment syndrome is a clinical diagnosis — pain out of proportion and on passive stretch, not a swollen appearance.', true),
      item('ortho-skin', 'Skin integrity over fracture checked', 'An overlooked wound over a fracture makes it an open fracture — different pathway, antibiotic clock already running.'),
    ],
  },
  anaes: {
    id: 'dept-anaes',
    title: 'Pre-anaesthetic screen',
    items: [
      item('anaes-airway', 'Airway examined (Mallampati, mouth opening, TMD, neck)', 'The two questions are "can I ventilate?" and "can I intubate?" — predicted difficulty found BEFORE induction gets a plan; found after, it gets a crisis.', true),
      item('anaes-fasting', 'Fasting times established (solids AND clear fluids)', '6h solids / 2h clears for electives — but labour, trauma, obstruction and opioids mean a full stomach whatever the clock: that decision changes the induction technique.', true),
      item('anaes-family-history', 'Personal + FAMILY anaesthetic history asked', 'Malignant hyperthermia and suxamethonium apnoea are inherited — "mother nearly died under anaesthetic" changes the entire drug plan.', true),
      item('anaes-anticoag', 'Anticoagulant last-dose times recorded', 'A spinal through therapeutic anticoagulation is a spinal haematoma — the neuraxial option lives or dies on exact timing.', true),
      item('anaes-dentition', 'Dentition checked, dentures out', 'The loose incisor found during laryngoscopy becomes an inhaled foreign body — look first.'),
    ],
  },
};

// ── Presentation-adaptive additions ──────────────────────────────────────────

interface AdaptiveRule {
  id: string;
  pattern: RegExp;
  title: string;
  items: ChecklistItem[];
  /** Restrict the rule to these departments; omit = applies everywhere. */
  depts?: DeptId[];
}

const ADAPTIVE_RULES: AdaptiveRule[] = [
  {
    id: 'adapt-chest-pain',
    pattern: /chest pain|angina|\bACS\b|myocard/i,
    title: 'Chest pain — targeted',
    items: [
      item('cp-lungs', 'Auscultated lung fields?', 'Crackles → failure/pneumonia; absent breath sounds → pneumothorax. The chest exam separates the chest-pain differentials.', true),
      item('cp-bp-both-arms', 'BP in BOTH arms', 'A >20mmHg inter-arm difference with tearing pain is aortic dissection — the diagnosis that thrombolysis kills.', true),
      item('cp-pulses', 'Distal pulses (radial + femoral)', 'Pulse deficits are a dissection sign; radio-femoral delay adds coarctation to the young hypertensive.'),
      item('cp-ecg', 'ECG done & personally reviewed', 'The 10-minute door-to-ECG rule exists because STEMI treatment is time-muscle — and the intern who ordered it must look at it.', true),
      item('cp-chest-wall', 'Chest wall palpated', 'Reproducible tenderness supports (never proves) a musculoskeletal cause — document it either way.'),
    ],
  },
  {
    id: 'adapt-abdo',
    pattern: /abdo|abdominal|epigastr|\bRIF\b|\bLIF\b|\bRUQ\b|\bLUQ\b|suprapubic/i,
    title: 'Abdominal pain — targeted',
    items: [
      item('abdo-guarding', 'Checked for guarding/rebound tenderness?', 'Peritonism is the surgical-abdomen trigger — actively examine for it and write down present OR absent.', true),
      item('abdo-hernial', 'Hernial orifices examined', 'The strangulated femoral hernia hides in the groin crease of the "bowel obstruction" — always look.', true),
      item('abdo-preg-test', 'Pregnancy test if female of childbearing age', 'Ruptured ectopic is the abdominal catastrophe that a R15 urine test excludes — no female abdomen is assessed without it.', true),
      item('abdo-bowel-sounds', 'Bowel sounds auscultated', 'Silent abdomen → peritonitis/ileus; tinkling → obstruction.'),
      item('abdo-flanks', 'Renal angles percussed', 'Renal angle tenderness redirects the workup to pyelonephritis/stones.'),
    ],
  },
  {
    id: 'adapt-limb',
    pattern: /fracture|limb (pain|injur)|# ?(NOF|femur|tib|radius|humerus)|dislocat|crush(ed|\s?injur)|sprain/i,
    title: 'Limb injury — targeted',
    items: [
      item('limb-pulses', 'Assessed distal pulses?', 'Perfusion distal to the injury, before and after any manipulation — a lost pulse post-reduction is your emergency.', true),
      item('limb-sensation', 'Sensation — named nerves for this injury', 'Each injury has its nerve: humeral shaft → radial, elbow → ulnar, knee dislocation → peroneal. Name it, test it.', true),
      item('limb-compartments', 'Compartment check (soft? pain on passive stretch?)', 'Tibial and forearm fractures are the compartment-syndrome classics — six hours late is a fasciotomy missed.', true),
      item('limb-joint-above-below', 'Joint above and below imaged/examined', 'The fracture you were sent is not always the only one.'),
    ],
  },
  {
    id: 'adapt-headache',
    pattern: /headache|cephalgia|migraine/i,
    title: 'Headache — targeted',
    items: [
      item('ha-neck', 'Neck stiffness tested', 'Meningism turns "headache" into meningitis/SAH — flexion stiffness is the screen.', true),
      item('ha-fundoscopy', 'Fundoscopy performed', 'Papilloedema is raised ICP declaring itself — and the LP you must then NOT do without imaging.', true),
      item('ha-neuro', 'Focal neurology screened (cranial nerves, limbs)', 'Any focal deficit reclassifies the headache as structural until imaged.', true),
      item('ha-bp', 'BP reviewed against headache', 'Severe hypertension with headache is an emergency in its own right — and pre-eclampsia in the pregnant patient.'),
    ],
  },
  {
    id: 'adapt-reduced-loc',
    pattern: /reduced (LOC|level)|unconscious|unresponsive|GCS \d|coma|drowsy/i,
    title: 'Reduced LOC — targeted',
    items: [
      item('loc-glucose-first', 'Glucose FIRST', 'The reversible coma: check it before anything else, treat it in seconds, and the workup may end there.', true),
      item('loc-pupils', 'Pupils — size, symmetry, reaction', 'A blown pupil is herniation; pinpoint pupils are opioids/pontine — the pupils triage the unconscious patient.', true),
      item('loc-gcs-breakdown', 'GCS with E/V/M breakdown, repeated', 'The trend matters more than the number — a falling GCS is the alarm.', true),
      item('loc-neck', 'Meningism checked (if no trauma)', 'Meningitis and SAH both present as reduced LOC with meningism.'),
      item('loc-injury', 'Head-to-toe for injury/needle marks/Medic-Alert', 'The scalp laceration, the insulin pen, the bracelet — the unconscious patient’s history is on their body.'),
    ],
  },
  {
    id: 'adapt-rfm',
    pattern: /reduced fetal movement|decreased fetal movement|\bRFM\b|baby (is )?not moving|no fetal movement/i,
    title: 'Reduced fetal movements — targeted',
    depts: ['og', 'emergency'],
    items: [
      item('rfm-ctg', 'CTG done — not just FH auscultated', 'RFM is the commonest last presentation before stillbirth; a single auscultated FH proves the fetus is alive NOW, only a CTG (or BPP) says whether it is compensating — do it within the hour.', true),
      item('rfm-sfh', 'SFH re-measured and checked against the chart', 'RFM plus a lagging SFH curve is growth restriction presenting itself — the two findings together escalate to ultrasound and delivery planning.', true),
      item('rfm-risk', 'Risk review: BP, proteinuria, previous stillbirth, diabetes, post-term', 'RFM in a hypertensive, diabetic or post-term pregnancy is a different conversation from RFM in a low-risk one — the same complaint, a lower threshold to act.'),
      item('rfm-plan', 'Documented plan if CTG normal: recurrence advice + follow-up', '"CTG normal, reassured, discharged" without recurrence advice is how the second, fatal episode stays at home — she must know to come back the same day it happens again.', true),
    ],
  },
  {
    id: 'adapt-aph',
    pattern: /praevia|previa|abruption|antepartum h(a)?emorrhage|\bAPH\b/i,
    title: 'Antepartum haemorrhage — targeted',
    depts: ['og', 'emergency'],
    items: [
      item('aph-no-ve', 'NO digital VE until praevia excluded on ultrasound', 'A finger through a praevia converts spotting into an exsanguinating haemorrhage — the placental site comes from the scan (or prior anomaly scan), never from the examining finger.', true),
      item('aph-tone', 'Uterine tone + tenderness palpated', 'A woody, tender uterus is abruption — where the blood loss you can see badly underestimates the blood loss that is concealed.', true),
      item('aph-fh', 'Fetal heart / CTG immediately', 'In abruption the fetus deteriorates before the mother’s vitals move — fetal state is the earliest severity marker.', true),
      item('aph-bloods', 'IV access + crossmatch + Rh status sent', 'APH can become massive transfusion in minutes, and every Rh-negative mother with APH needs anti-D — the bloods buy both options now.', true),
    ],
  },
  {
    id: 'adapt-sob',
    pattern: /short(ness)? of breath|\bSOB\b|dyspn|difficulty breathing/i,
    title: 'SOB — targeted',
    items: [
      item('sob-rr-60', 'RR counted over 60 seconds', 'In the breathless patient the RR is the severity score — count a full minute, not six seconds times ten.', true),
      item('sob-sats-air', 'Sats on ROOM AIR documented', 'The room-air value grades severity and is the baseline every later reading is compared to.', true),
      item('sob-trachea', 'Tracheal position palpated', 'Deviation is tension pneumothorax or massive effusion/collapse — a finding that mandates action before the X-ray.', true),
      item('sob-percussion', 'Percussion note compared side to side', 'Hyperresonant → pneumothorax; stony dull → effusion. Percussion localizes before imaging.'),
      item('sob-effort', 'Work of breathing described (accessory muscles, speech)', '"Talking in single words" is a severity grade the sats can lag behind.'),
    ],
  },
];

// ── Builder ──────────────────────────────────────────────────────────────────

export function examChecklistFor(dept: DeptId, subDept: string | undefined, presentingText: string): ChecklistSection[] {
  const sections: ChecklistSection[] = [universalVitals(presentingText)];
  const raw = DEPT_SECTIONS[dept];
  const deptSection = typeof raw === 'function' ? raw(subDept) : raw;
  if (deptSection) sections.push(deptSection);
  for (const rule of ADAPTIVE_RULES) {
    if (rule.depts && !rule.depts.includes(dept)) continue;
    if (rule.pattern.test(presentingText)) {
      sections.push({ id: rule.id, title: rule.title, items: rule.items });
    }
  }
  // De-duplicate items that would appear twice (e.g. dept + adaptive overlap)
  // — keep the first occurrence, which carries the earlier context.
  const seen = new Set<string>();
  return sections.map(s => ({
    ...s,
    items: s.items.filter(i => {
      const k = i.label.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    }),
  })).filter(s => s.items.length > 0);
}
