import type { DeptId } from './departments';

// ─── Exam checklists ─────────────────────────────────────────────────────────
// Proactive, tappable examination checklists: a universal vitals block, a
// per-department block, and presentation-adaptive additions triggered by
// regex over the intake+history text ("chest pain" → "Auscultated lung
// fields?", ECG done, BP both arms). Each item carries a teaching "why".
// Checked state is persisted per patient; checked items serialize into the
// examination text alongside anything the intern types.

export interface ChecklistItem {
  id: string;
  label: string;
  why: string;
  /** Mandatory items render amber until checked. */
  mandatory?: boolean;
}

export interface ChecklistSection {
  id: string;
  title: string;
  items: ChecklistItem[];
}

function item(id: string, label: string, why: string, mandatory?: boolean): ChecklistItem {
  return { id, label, why, mandatory };
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

const DEPT_SECTIONS: Record<DeptId, ChecklistSection> = {
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
  og: {
    id: 'dept-og',
    title: 'Obstetric screen',
    items: [
      item('og-sfh', 'SFH measured (cm)', 'Symphysis-fundal height is the growth screen — a lag of >2cm from gestation flags restriction, a lead flags multiples/polyhydramnios.', true),
      item('og-leopolds', 'Lie & presentation (Leopold’s)', 'A breech or transverse lie discovered in labour is an emergency that was findable weeks earlier.', true),
      item('og-fh', 'Fetal heart heard & rate documented', 'The FH is the fetal vital sign — "FH not documented" is indefensible in any obstetric note.', true),
      item('og-reflexes', 'Reflexes + clonus if hypertensive', 'Hyperreflexia and clonus are the bedside signs of imminent eclampsia — check them in every hypertensive pregnancy.'),
      item('og-oedema', 'Oedema (face/hands) if hypertensive', 'Facial and hand oedema with hypertension raises pre-eclampsia; dependent ankle oedema alone is normal in pregnancy.'),
    ],
  },
  paeds: {
    id: 'dept-paeds',
    title: 'Paediatric screen',
    items: [
      item('paeds-weight', 'Weight PLOTTED on growth chart', 'A weight written but not plotted misses the fall across centiles — plotting is what turns a number into a diagnosis.', true),
      item('paeds-fontanelle', 'Fontanelle assessed', 'Bulging → raised ICP/meningitis; sunken → dehydration. Two seconds of palpation, two major diagnoses.'),
      item('paeds-hydration', 'Hydration signs (turgor, mucous membranes, cap refill, eyes)', 'IMCI classifies dehydration on these signs — they decide oral vs IV rehydration.', true),
      item('paeds-rtc', 'Road-to-Health card SEEN', 'The card is the child’s medical record: immunisations, growth, previous weights. "Card not seen" is a data gap to close, not a checkbox to skip.', true),
      item('paeds-imci', 'IMCI danger signs screened', 'Unable to drink, vomits everything, convulsions, lethargy — any one reclassifies the child as severe.', true),
    ],
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
};

// ── Presentation-adaptive additions ──────────────────────────────────────────

interface AdaptiveRule {
  id: string;
  pattern: RegExp;
  title: string;
  items: ChecklistItem[];
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

export function examChecklistFor(dept: DeptId, _subDept: string | undefined, presentingText: string): ChecklistSection[] {
  const sections: ChecklistSection[] = [universalVitals(presentingText)];
  const deptSection = DEPT_SECTIONS[dept];
  if (deptSection) sections.push(deptSection);
  for (const rule of ADAPTIVE_RULES) {
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
