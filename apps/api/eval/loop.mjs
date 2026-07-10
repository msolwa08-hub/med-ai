// M1 LOOP HARNESS — scores the bedside loop itself, live.
//
// For each scenario it drives /tools/working-picture twice:
//   1. from the clerked findings (no discriminating result yet)
//   2. after a result that SHOULD move a named diagnosis, with the previous
//      picture supplied — so the engine must reconcile and narrate the shift.
//
// It then scores whether the loop actually WORKED (each /100):
//   - the expected working diagnosis is present in picture 1
//   - the discriminating test is named as a discriminator for it
//   - a must-not-miss is stated
//   - picture 2 moved that diagnosis in the EXPECTED DIRECTION
//   - the move is narrated (shift.because references the result + a narrative)
//
// This is the thing the confidence engine exists to do; if it does not hold
// here, the whole premise fails.

const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
const pct = (n) => Math.round(n * 10) / 10;
const lc = (s) => String(s || '').toLowerCase();

async function post(base, key, path, body) {
  const res = await fetch(`${base}${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-tools-key': key }, body: JSON.stringify(body),
  });
  return { status: res.status, json: await res.json().catch(() => null) };
}

// keyword-match a differential by its dx text
function findDx(picture, keywords) {
  const diffs = picture?.differentials || [];
  return diffs.find(d => keywords.some(k => lc(d.dx).includes(lc(k)))) || null;
}

export const LOOP_SCENARIOS = [
  {
    id: 'pet-to-hellp',
    title: 'Severe PET → HELLP confirmed on bloods',
    dept: 'og', subDept: 'antenatal',
    record: {
      intake: { name: 'L1', age: '31', sex: 'F', admissionDiagnosis: 'severe pre-eclampsia', allergies: 'NKDA' },
      history: { chiefComplaint: 'headache + epigastric pain', hpi: 'G3P2 33 weeks, headache and epigastric pain since last night', gestationalAge: '33 weeks', gravida: '3', para: '2', hivStatus: 'negative', medications: 'none' },
      assessment: { vitals: 'BP 172/116, HR 92', examination: 'brisk reflexes, 2 beats clonus, urine 3+ protein, RUQ tender' },
    },
    expectDx: ['hellp'], expectDiscriminator: ['platelet', 'lft', 'ast', 'alt', 'ldh'],
    resultText: 'Plt 68 ; AST 240 ; ALT 200 ; LDH 900 ; peripheral smear schistocytes',
    moveDx: ['hellp'], direction: 'up',
  },
  {
    id: 'ectopic-confirm',
    title: 'Early-pregnancy pain → ectopic confirmed on TVS',
    dept: 'og', subDept: 'gynae',
    record: {
      intake: { name: 'L2', age: '24', sex: 'F', admissionDiagnosis: 'lower abdominal pain in early pregnancy', allergies: 'NKDA' },
      history: { chiefComplaint: 'right iliac fossa pain', hpi: 'LMP 7 weeks ago, urine pregnancy test positive, sudden RIF pain, one episode shoulder-tip pain', lmp: '7 weeks ago', medications: 'none' },
      assessment: { vitals: 'BP 100/64, HR 108', examination: 'cervical excitation, right adnexal tenderness' },
    },
    expectDx: ['ectopic'], expectDiscriminator: ['tvs', 'ultrasound', 'scan', 'hcg'],
    resultText: 'TVS: empty uterus, right adnexal mass 3cm, moderate free fluid in pouch of Douglas ; serum bhCG 1620',
    moveDx: ['ectopic'], direction: 'up',
  },
  {
    id: 'preterm-to-chorio',
    title: 'Preterm labour → chorioamnionitis on sepsis markers',
    dept: 'og', subDept: 'labour',
    record: {
      intake: { name: 'L3', age: '26', sex: 'F', admissionDiagnosis: 'preterm labour', allergies: 'NKDA' },
      history: { chiefComplaint: 'contractions at 30 weeks', hpi: 'G2P1 30 weeks, regular painful contractions, membranes ruptured 20h ago', gestationalAge: '30 weeks', gravida: '2', para: '1', medications: 'none' },
      assessment: { vitals: 'BP 118/70, HR 104, Temp 37.9', examination: 'cervix 3cm, uterus mildly tender' },
    },
    expectDx: ['chorioamnionitis', 'intrauterine infection', 'sepsis'], expectDiscriminator: ['wcc', 'crp', 'temp', 'liquor', 'culture'],
    resultText: 'Temp 38.6 ; WCC 19 ; CRP 140 ; offensive liquor ; fetal tachycardia 175',
    moveDx: ['chorioamnionitis', 'infection', 'sepsis'], direction: 'up',
  },

  // ── Internal Medicine (M2) — the canonical "the result moves the diagnosis"
  //    cases on an SA acute medical take. Each names a discriminating Ix that
  //    should shift a named diagnosis in a defined direction. ──────────────────
  {
    id: 'chestpain-to-acs',
    title: 'Central chest pain → ACS confirmed on troponin + ECG',
    dept: 'medicine',
    record: {
      intake: { name: 'M1', age: '58', sex: 'M', admissionDiagnosis: 'central chest pain', allergies: 'NKDA' },
      history: { chiefComplaint: 'crushing central chest pain', hpi: '2 hours of crushing retrosternal chest pain radiating to the left arm, diaphoretic and nauseated. Smoker, known hypertensive and type 2 diabetic.', pmh: 'HTN, T2DM', medications: 'amlodipine, metformin', hivStatus: 'negative' },
      assessment: { vitals: 'BP 148/92, HR 98, sats 96% RA', examination: 'anxious, diaphoretic, chest clear, heart sounds normal, no murmurs' },
    },
    expectDx: ['acute coronary', 'acs', 'myocardial', 'nstemi', 'stemi', 'unstable angina'],
    expectDiscriminator: ['troponin', 'ecg', 'st'],
    resultText: 'ECG: 2 mm ST depression V4–V6, T-wave inversion ; hs-troponin T 320 ng/L rising to 680 at 3 hours',
    moveDx: ['acute coronary', 'acs', 'nstemi', 'myocardial', 'infarct'], direction: 'up',
  },
  {
    id: 'hyperglycaemia-to-dka',
    title: 'Vomiting T1DM → DKA confirmed on VBG + ketones',
    dept: 'medicine',
    record: {
      intake: { name: 'M2', age: '22', sex: 'F', admissionDiagnosis: 'hyperglycaemia + vomiting', allergies: 'NKDA' },
      history: { chiefComplaint: 'vomiting and abdominal pain', hpi: 'Known type 1 diabetic, 2 days of polyuria and polydipsia after running out of insulin, now vomiting and drowsy.', pmh: 'Type 1 diabetes mellitus', medications: 'insulin (defaulted 3 days)', hivStatus: 'negative' },
      assessment: { vitals: 'BP 104/68, HR 118, RR 28, Temp 36.8, sats 99%', examination: 'clinically dehydrated, deep sighing (Kussmaul) breathing, ketotic fetor, drowsy but rousable' },
    },
    expectDx: ['diabetic ketoacidosis', 'dka', 'ketoacidosis'],
    expectDiscriminator: ['vbg', 'blood gas', 'ketone', 'bicarb', 'ph', 'glucose', 'anion gap'],
    resultText: 'Capillary glucose 29 mmol/L ; blood ketones 5.4 mmol/L ; VBG pH 7.14, HCO3 8, anion gap 28 ; K+ 5.2',
    moveDx: ['diabetic ketoacidosis', 'dka', 'ketoacidosis'], direction: 'up',
  },
  {
    id: 'cough-to-ptb',
    title: 'Chronic cough + HIV → pulmonary TB confirmed on GeneXpert',
    dept: 'medicine',
    record: {
      intake: { name: 'M3', age: '34', sex: 'M', admissionDiagnosis: 'chronic cough + weight loss', allergies: 'NKDA' },
      history: { chiefComplaint: 'cough and weight loss', hpi: '5 weeks of productive cough with drenching night sweats, 8 kg weight loss and intermittent fevers. HIV positive, defaulted ART 6 months ago.', pmh: 'HIV positive', medications: 'none currently', hivStatus: 'positive' },
      assessment: { vitals: 'BP 112/70, HR 96, Temp 37.8, sats 95% RA', examination: 'cachectic, right apical crackles, cervical lymphadenopathy' },
    },
    expectDx: ['pulmonary tuberculosis', 'tuberculosis', 'ptb', 'tb'],
    expectDiscriminator: ['genexpert', 'xpert', 'sputum', 'mtb', 'cxr', 'chest x'],
    resultText: 'Sputum GeneXpert: MTB detected, rifampicin susceptible ; CXR: right upper lobe cavitation with surrounding fibrosis',
    moveDx: ['tuberculosis', 'ptb', 'tb'], direction: 'up',
  },
  {
    id: 'dyspnoea-to-hf',
    title: 'Acute dyspnoea → decompensated heart failure on NT-proBNP + CXR',
    dept: 'medicine',
    record: {
      intake: { name: 'M4', age: '67', sex: 'F', admissionDiagnosis: 'shortness of breath', allergies: 'NKDA' },
      history: { chiefComplaint: 'progressive breathlessness and leg swelling', hpi: '1 week of worsening exertional dyspnoea, orthopnoea (4 pillows), paroxysmal nocturnal dyspnoea and bilateral leg swelling. Previous myocardial infarction, poorly adherent to medication.', pmh: 'HTN, previous MI', medications: 'furosemide, enalapril (poor adherence)', hivStatus: 'negative' },
      assessment: { vitals: 'BP 156/94, HR 104, RR 24, sats 91% RA', examination: 'raised JVP, bibasal crepitations, pitting oedema to the knees, displaced apex beat' },
    },
    expectDx: ['heart failure', 'cardiac failure', 'decompensated', 'pulmonary oedema', 'ccf'],
    expectDiscriminator: ['probnp', 'bnp', 'cxr', 'chest x', 'echo'],
    resultText: 'NT-proBNP 5200 pg/mL ; CXR: cardiomegaly, upper-lobe diversion, bilateral pleural effusions and Kerley B lines',
    moveDx: ['heart failure', 'cardiac failure', 'decompensated', 'pulmonary oedema', 'ccf'], direction: 'up',
  },

  // ── Surgery (M2+) — the acute surgical take: an imaging/bloods result that
  //    confirms or refutes the operative diagnosis. ────────────────────────────
  {
    id: 'rif-to-appendicitis',
    title: 'RIF pain → acute appendicitis confirmed on US + inflammatory markers',
    dept: 'surgery',
    record: {
      intake: { name: 'S1', age: '19', sex: 'M', admissionDiagnosis: 'right iliac fossa pain', allergies: 'NKDA' },
      history: { chiefComplaint: 'right iliac fossa pain', hpi: 'Central abdominal pain yesterday that migrated to the right iliac fossa, now with anorexia, nausea and one vomit. Low-grade fever.', pmh: 'nil', medications: 'none', hivStatus: 'negative' },
      assessment: { vitals: 'BP 124/78, HR 96, Temp 37.8', examination: 'tender at McBurney point with guarding, Rovsing positive, percussion tenderness' },
    },
    expectDx: ['appendicitis'],
    expectDiscriminator: ['wcc', 'crp', 'ultrasound', 'us', 'ct', 'alvarado'],
    resultText: 'WCC 16.2 with neutrophilia ; CRP 88 ; US: non-compressible blind-ending tubular structure 9 mm with surrounding free fluid',
    moveDx: ['appendicitis'], direction: 'up',
  },
  {
    id: 'epigastric-to-perforation',
    title: 'Rigid abdomen → perforated viscus confirmed on erect CXR',
    dept: 'surgery',
    record: {
      intake: { name: 'S2', age: '52', sex: 'M', admissionDiagnosis: 'severe abdominal pain', allergies: 'NKDA' },
      history: { chiefComplaint: 'sudden severe epigastric pain', hpi: 'Sudden onset severe generalised abdominal pain 4 hours ago, now lying still. Long history of NSAID use for back pain and epigastric pain.', pmh: 'chronic NSAID use', medications: 'ibuprofen', hivStatus: 'negative' },
      assessment: { vitals: 'BP 108/70, HR 112, Temp 37.9', examination: 'board-like rigid abdomen, generalised rebound and guarding, absent bowel sounds' },
    },
    expectDx: ['perforation', 'perforated', 'peptic ulcer', 'hollow viscus', 'peritonitis'],
    expectDiscriminator: ['erect', 'cxr', 'chest x', 'free air', 'ct', 'axr'],
    resultText: 'Erect CXR: free air under both hemidiaphragms',
    moveDx: ['perforation', 'perforated', 'peptic ulcer', 'hollow viscus'], direction: 'up',
  },
  {
    id: 'distension-to-sbo',
    title: 'Distension + vomiting → small bowel obstruction confirmed on CT',
    dept: 'surgery',
    record: {
      intake: { name: 'S3', age: '61', sex: 'F', admissionDiagnosis: 'abdominal distension + vomiting', allergies: 'NKDA' },
      history: { chiefComplaint: 'colicky abdominal pain and vomiting', hpi: 'Colicky central abdominal pain, distension, bilious vomiting and absolute constipation for 2 days. Previous open hysterectomy.', pmh: 'previous laparotomy (adhesions)', medications: 'none', hivStatus: 'negative' },
      assessment: { vitals: 'BP 118/76, HR 100', examination: 'distended tympanitic abdomen, high-pitched tinkling bowel sounds, old midline scar' },
    },
    expectDx: ['small bowel obstruction', 'bowel obstruction', 'sbo', 'obstruction'],
    expectDiscriminator: ['ct', 'axr', 'abdominal x', 'transition', 'dilated'],
    resultText: 'CT abdomen: dilated small-bowel loops to a transition point in the pelvis with collapsed distal bowel; adhesional band, no strangulation',
    moveDx: ['small bowel obstruction', 'bowel obstruction', 'sbo', 'obstruction'], direction: 'up',
  },
  {
    id: 'ruq-to-cholecystitis',
    title: 'RUQ pain + Murphy → acute cholecystitis confirmed on US',
    dept: 'surgery',
    record: {
      intake: { name: 'S4', age: '44', sex: 'F', admissionDiagnosis: 'right upper quadrant pain', allergies: 'NKDA' },
      history: { chiefComplaint: 'right upper quadrant pain', hpi: 'Constant severe RUQ pain radiating to the right shoulder for 18 hours after a fatty meal, with fever and nausea. Previous similar self-limiting episodes.', pmh: 'obesity', medications: 'none', hivStatus: 'negative' },
      assessment: { vitals: 'BP 130/82, HR 94, Temp 38.1', examination: 'RUQ tenderness with a positive Murphy sign, no jaundice' },
    },
    expectDx: ['cholecystitis'],
    expectDiscriminator: ['ultrasound', 'us', 'wcc', 'wall', 'murphy', 'pericholecystic'],
    resultText: 'US: gallbladder wall 5 mm with pericholecystic fluid and multiple calculi, sonographic Murphy positive ; WCC 14',
    moveDx: ['cholecystitis'], direction: 'up',
  },

  // ── Emergency (M2+) — undifferentiated ED: the discriminating test that
  //    ratifies a time-critical diagnosis. ─────────────────────────────────────
  {
    id: 'thunderclap-to-sah',
    title: 'Thunderclap headache → subarachnoid haemorrhage on CT brain',
    dept: 'emergency',
    record: {
      intake: { name: 'E1', age: '47', sex: 'F', admissionDiagnosis: 'sudden severe headache', allergies: 'NKDA' },
      history: { chiefComplaint: 'worst headache of life', hpi: 'Instantaneous occipital "thunderclap" headache peaking within seconds while straining, with vomiting and neck stiffness. Reduced GCS transiently.', pmh: 'hypertension', medications: 'none', hivStatus: 'negative' },
      assessment: { vitals: 'BP 178/100, HR 88', examination: 'photophobia, neck stiffness, no focal deficit, fundi normal' },
    },
    expectDx: ['subarachnoid', 'sah', 'aneurysm'],
    expectDiscriminator: ['ct', 'ct brain', 'non-contrast', 'lp', 'lumbar puncture', 'xanthochromia'],
    resultText: 'Non-contrast CT brain: hyperdensity in the basal cisterns and right Sylvian fissure',
    moveDx: ['subarachnoid', 'sah'], direction: 'up',
  },
  {
    id: 'hemiparesis-to-ischaemic-stroke',
    title: 'Acute hemiparesis → ischaemic stroke (bleed excluded) on CT',
    dept: 'emergency',
    record: {
      intake: { name: 'E2', age: '68', sex: 'M', admissionDiagnosis: 'acute weakness', allergies: 'NKDA' },
      history: { chiefComplaint: 'sudden left-sided weakness', hpi: 'Sudden left face, arm and leg weakness with slurred speech, onset 90 minutes ago, witnessed. Known atrial fibrillation, not anticoagulated.', pmh: 'AF, HTN', medications: 'none (not on warfarin/DOAC)', hivStatus: 'negative' },
      assessment: { vitals: 'BP 168/92, HR 96 irregular', examination: 'left facial droop, left arm drift, dysarthria, NIHSS 8' },
    },
    expectDx: ['ischaemic stroke', 'ischemic stroke', 'stroke', 'cva', 'infarct'],
    expectDiscriminator: ['ct', 'ct brain', 'non-contrast', 'haemorrhage', 'thrombolysis'],
    resultText: 'Non-contrast CT brain: no haemorrhage; hyperdense right MCA sign with early loss of grey-white differentiation',
    moveDx: ['ischaemic stroke', 'ischemic stroke', 'stroke', 'infarct'], direction: 'up',
  },
  {
    id: 'overdose-to-paracetamol-toxicity',
    title: 'Deliberate overdose → paracetamol toxicity on timed level',
    dept: 'emergency',
    record: {
      intake: { name: 'E3', age: '23', sex: 'F', admissionDiagnosis: 'deliberate self-poisoning', allergies: 'NKDA' },
      history: { chiefComplaint: 'paracetamol overdose', hpi: 'Impulsive ingestion of ~24 paracetamol 500 mg tablets 5 hours ago after an argument. Currently asymptomatic. No co-ingestants reported.', pmh: 'depression', medications: 'none', hivStatus: 'negative' },
      assessment: { vitals: 'BP 118/74, HR 82', examination: 'alert, no RUQ tenderness, no jaundice' },
    },
    expectDx: ['paracetamol', 'acetaminophen', 'hepatotoxic', 'overdose', 'poisoning'],
    expectDiscriminator: ['level', 'nomogram', 'paracetamol level', 'inr', 'alt', '4-hour', '4 hour'],
    resultText: '4-hour paracetamol level 180 mg/L — above the treatment line on the nomogram ; ALT 40, INR 1.1',
    moveDx: ['paracetamol', 'acetaminophen', 'hepatotoxic', 'toxicity'], direction: 'up',
  },
  {
    id: 'febrile-hypotension-to-septic-shock',
    title: 'Febrile hypotension → septic shock on lactate + source',
    dept: 'emergency',
    record: {
      intake: { name: 'E4', age: '59', sex: 'M', admissionDiagnosis: 'fever and collapse', allergies: 'NKDA' },
      history: { chiefComplaint: 'fever, confusion and collapse', hpi: '3 days of productive cough and fever, today confused and collapsed at home. Diabetic.', pmh: 'T2DM', medications: 'metformin', hivStatus: 'negative' },
      assessment: { vitals: 'BP 84/50, HR 122, RR 28, Temp 39.2, sats 90%', examination: 'confused (GCS 14), warm peripheries, right lower-zone crepitations' },
    },
    expectDx: ['septic shock', 'sepsis', 'severe sepsis'],
    expectDiscriminator: ['lactate', 'culture', 'wcc', 'crp', 'source', 'cxr'],
    resultText: 'Venous lactate 4.6 mmol/L ; WCC 19 ; CXR right lower-lobe consolidation ; BP unresponsive to 30 mL/kg fluids',
    moveDx: ['septic shock', 'sepsis'], direction: 'up',
  },
];

async function runLoop(scenario, base, key) {
  const common = { dept: scenario.dept, subDept: scenario.subDept, ...scenario.record };

  const p1 = await post(base, key, '/tools/working-picture', common);
  if (p1.status !== 200 || !p1.json) return { id: scenario.id, title: scenario.title, error: `picture1 ${p1.status}`, overall: 0 };
  const pic1 = p1.json;

  const p2 = await post(base, key, '/tools/working-picture', {
    ...common,
    resultsText: scenario.resultText,
    previousPicture: { differentials: pic1.differentials },
  });
  if (p2.status !== 200 || !p2.json) return { id: scenario.id, title: scenario.title, error: `picture2 ${p2.status}`, overall: 0 };
  const pic2 = p2.json;

  // Scoring
  const d1 = findDx(pic1, scenario.expectDx);
  const dxPresent = d1 ? 1 : 0;
  const discNamed = d1 && (d1.discriminators || []).some(t => scenario.expectDiscriminator.some(k => lc(t.test).includes(lc(k)) || lc(t.moves).includes(lc(k)))) ? 1 : 0;
  const mustNotMiss = pic1.mustNotMiss && pic1.mustNotMiss.trim().length > 5 ? 1 : 0;

  const d2 = findDx(pic2, scenario.moveDx);
  const before = d1 ? d1.confidence : (d2?.shift?.from ?? 0);
  const after = d2 ? d2.confidence : 0;
  const moved = scenario.direction === 'up' ? after > before + 5 : after < before - 5;
  const directionOk = d2 && moved ? 1 : 0;
  const narrated = d2?.shift?.because && String(d2.shift.because).length > 8 && pic2.narrative && pic2.narrative.length > 20 ? 1 : 0;

  const overall = pct(clamp(dxPresent * 25 + discNamed * 20 + mustNotMiss * 10 + directionOk * 30 + narrated * 15));
  return {
    id: scenario.id, title: scenario.title, overall,
    detail: { dxPresent, discNamed, mustNotMiss, directionOk, narrated, before, after, dx: d2?.dx || d1?.dx || '?' },
  };
}

export async function runAllLoops(base, key, only, dept) {
  let scenarios = LOOP_SCENARIOS;
  if (dept) scenarios = scenarios.filter(s => s.dept === dept);
  if (only) scenarios = scenarios.filter(s => s.id === only);
  const results = [];
  for (const s of scenarios) results.push(await runLoop(s, base, key));
  const mean = pct(results.reduce((a, r) => a + (r.overall ?? 0), 0) / Math.max(results.length, 1));
  return { mean, results };
}
