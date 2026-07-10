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
  // ── O&G DEPTH — broadening past the founding three: the postpartum
  //    collapse whose cause is the 4-Ts question, and the two time-critical
  //    misses (concealed abruption; the non-pregnant torsion). ───────────────
  {
    id: 'pph-to-atony',
    title: 'Postpartum collapse → uterine atony (Tone) on the 4-Ts assessment',
    dept: 'og', subDept: 'labour',
    record: {
      intake: { name: 'L4', age: '34', sex: 'F', admissionDiagnosis: 'primary postpartum haemorrhage', allergies: 'NKDA' },
      history: { chiefComplaint: 'heavy bleeding immediately after delivery', hpi: 'G5P5, prolonged labour with oxytocin augmentation, vaginal delivery of a 4.1 kg baby 20 min ago; now brisk ongoing vaginal bleeding, estimated 1200 ml and continuing.', gravida: '5', para: '5', medications: 'oxytocin augmentation in labour', hivStatus: 'negative' },
      assessment: { vitals: 'BP 92/54, HR 122, pallor', examination: 'uterus soft/boggy and high above the umbilicus, placenta delivered and reported complete, no visible genital-tract laceration on inspection' },
    },
    expectDx: ['atony', 'uterine atony', 'tone', 'postpartum haemorrhage', 'pph'],
    expectDiscriminator: ['4 ts', '4ts', 'tone', 'fundal', 'uterine tone', 'rub up', 'uterotonic'],
    resultText: 'Fundus soft and boggy, contracts with rubbing then relaxes again (atony confirmed as the cause) ; placenta re-checked complete ; no laceration ; clotting normal — Tone is the culprit, uterotonics + bimanual compression',
    moveDx: ['atony', 'uterine atony', 'tone'], direction: 'up',
  },
  {
    id: 'aph-to-abruption',
    title: 'Third-trimester pain + bleeding → placental abruption (concealed) on clinical + DIC screen',
    dept: 'og', subDept: 'antenatal',
    record: {
      intake: { name: 'L5', age: '29', sex: 'F', admissionDiagnosis: 'antepartum haemorrhage with pain', allergies: 'NKDA' },
      history: { chiefComplaint: 'constant severe abdominal pain with some bleeding', hpi: 'G3P2 34 weeks, sudden constant severe abdominal pain with a modest amount of dark vaginal bleeding — the pain is out of proportion to the visible blood. Known hypertension. No praevia on the booking scan.', gestationalAge: '34 weeks', gravida: '3', para: '2', pmh: 'chronic hypertension', medications: 'none', hivStatus: 'negative' },
      assessment: { vitals: 'BP 158/98, HR 116', examination: 'uterus tense, tender and hard ("woody"), difficult to palpate fetal parts, fetal heart bradycardic at 90 — the revealed blood underestimates the loss' },
    },
    expectDx: ['abruption', 'placental abruption', 'abruptio'],
    expectDiscriminator: ['clinical', 'dic', 'clotting', 'fibrinogen', 'coagulation', 'no pv', 'no vaginal exam', 'ctg'],
    resultText: 'Diagnosis is clinical (do NOT delay for a scan) ; DIC screen: fibrinogen low at 1.4, platelets falling, prolonged PT/aPTT — consumptive coagulopathy of a significant concealed abruption ; fetal bradycardia persisting → category-1 delivery',
    moveDx: ['abruption', 'placental abruption', 'abruptio'], direction: 'up',
  },
  {
    id: 'pelvic-pain-to-torsion',
    title: 'Acute pelvic pain (non-pregnant) → ovarian torsion on Doppler US (βhCG negative first)',
    dept: 'og', subDept: 'gynae',
    record: {
      intake: { name: 'L6', age: '22', sex: 'F', admissionDiagnosis: 'acute severe unilateral pelvic pain', allergies: 'NKDA' },
      history: { chiefComplaint: 'sudden severe right-sided pelvic pain with vomiting', hpi: 'Sudden onset severe right iliac fossa/pelvic pain a few hours ago, colicky then constant, with nausea and vomiting. Known right ovarian cyst on a previous scan. LMP 2 weeks ago.', lmp: '2 weeks ago', pmh: 'known ovarian cyst', medications: 'none' },
      assessment: { vitals: 'BP 124/76, HR 104, Temp 37.1', examination: 'very tender right adnexa with a palpable tender mass, guarding, βhCG must be checked first to exclude ectopic' },
    },
    expectDx: ['ovarian torsion', 'torsion', 'adnexal torsion'],
    expectDiscriminator: ['doppler', 'ultrasound', 'us', 'whirlpool', 'flow', 'hcg', 'βhcg', 'bhcg'],
    resultText: 'Urine βhCG NEGATIVE (ectopic excluded) ; transvaginal Doppler US: enlarged oedematous right ovary with a whirlpool sign and absent/reduced venous then arterial flow — torsion; this is a same-day theatre call to detorse and salvage the ovary',
    moveDx: ['ovarian torsion', 'torsion', 'adnexal torsion'], direction: 'up',
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

  // ── Paediatrics (M2) — the canonical "the result moves the diagnosis" cases
  //    on an SA paediatric take. Age/weight-anchored; the discriminating Ix
  //    shifts a named dx in a defined direction. ─────────────────────────────
  {
    id: 'febrile-child-to-meningitis',
    title: 'Febrile child + neck stiffness → bacterial meningitis on LP',
    dept: 'paeds',
    record: {
      intake: { name: 'P1', age: '2 years', sex: 'M', admissionDiagnosis: 'fever + irritability', allergies: 'NKDA' },
      history: { chiefComplaint: 'fever, vomiting and irritability', hpi: '2-day fever with vomiting, now drowsy and irritable, refusing feeds, one episode of possible seizure at home. Immunisations up to date. Weight 12 kg.', pmh: 'nil', medications: 'none', hivStatus: 'exposed, unknown' },
      assessment: { vitals: 'Temp 39.4, HR 150, RR 34, sats 97%', examination: 'irritable, neck stiffness, no rash, bulging not assessable (closed fontanelle), Kernig positive' },
    },
    expectDx: ['bacterial meningitis', 'meningitis'],
    expectDiscriminator: ['lp', 'lumbar puncture', 'csf', 'gram', 'cell count'],
    resultText: 'LP: CSF turbid, WCC 1800 (90% neutrophils), protein 2.4 g/L, glucose 1.1 (CSF:serum 0.2), Gram-positive diplococci seen',
    moveDx: ['bacterial meningitis', 'meningitis'], direction: 'up',
  },
  {
    id: 'child-polyuria-to-dka',
    title: 'Child polyuria + Kussmaul → new-onset DKA on VBG + ketones',
    dept: 'paeds',
    record: {
      intake: { name: 'P2', age: '8 years', sex: 'F', admissionDiagnosis: 'lethargy + vomiting', allergies: 'NKDA' },
      history: { chiefComplaint: 'vomiting, lethargy and rapid breathing', hpi: '2 weeks of polyuria, polydipsia and weight loss; last few days vomiting and increasingly drowsy with deep rapid breathing. No known diabetes. Weight 22 kg.', pmh: 'nil', medications: 'none', hivStatus: 'negative' },
      assessment: { vitals: 'HR 138, RR 32 deep, BP 96/60, Temp 36.9', examination: 'clinically dehydrated, deep sighing (Kussmaul) breathing, acetone on breath, drowsy but rousable' },
    },
    expectDx: ['diabetic ketoacidosis', 'dka', 'ketoacidosis', 'new-onset', 'type 1'],
    expectDiscriminator: ['vbg', 'blood gas', 'ketone', 'bicarb', 'ph', 'glucose'],
    resultText: 'Capillary glucose 31 mmol/L ; blood ketones 5.8 mmol/L ; VBG pH 7.08, HCO3 6, base excess -20 ; K+ 4.9',
    moveDx: ['diabetic ketoacidosis', 'dka', 'ketoacidosis'], direction: 'up',
  },
  {
    id: 'child-tachypnoea-to-severe-pneumonia',
    title: 'Child fever + fast breathing → severe pneumonia on CXR + sats',
    dept: 'paeds',
    record: {
      intake: { name: 'P3', age: '18 months', sex: 'M', admissionDiagnosis: 'cough + fast breathing', allergies: 'NKDA' },
      history: { chiefComplaint: 'cough, fever and fast breathing', hpi: '4 days of cough and fever, today breathing fast and not feeding well. Partially immunised. Weight 10 kg.', pmh: 'nil', medications: 'none', hivStatus: 'exposed, on nevirapine prophylaxis' },
      assessment: { vitals: 'RR 62, HR 160, Temp 39.0, sats 89% on air', examination: 'lower chest wall indrawing, nasal flaring, bronchial breathing right base, unable to feed' },
    },
    expectDx: ['severe pneumonia', 'pneumonia', 'very severe pneumonia'],
    expectDiscriminator: ['cxr', 'chest x', 'sats', 'saturation', 'oxygen'],
    resultText: 'CXR: dense right lower- and middle-lobe consolidation with a small effusion ; SpO2 88% persisting on room air',
    moveDx: ['severe pneumonia', 'pneumonia'], direction: 'up',
  },
  {
    id: 'infant-colic-to-intussusception',
    title: 'Infant colicky pain + red-currant stool → intussusception on US',
    dept: 'paeds',
    record: {
      intake: { name: 'P4', age: '9 months', sex: 'M', admissionDiagnosis: 'episodic crying + vomiting', allergies: 'NKDA' },
      history: { chiefComplaint: 'episodes of screaming, drawing up legs, and vomiting', hpi: 'Well until today: intermittent episodes of inconsolable screaming with legs drawn up, lethargic between episodes, bilious vomiting, and one nappy with red jelly-like stool. Weight 9 kg.', pmh: 'nil', medications: 'none', hivStatus: 'negative' },
      assessment: { vitals: 'HR 165, RR 36, Temp 37.4', examination: 'lethargic between spasms, a sausage-shaped mass palpable in the right upper quadrant, abdomen otherwise soft' },
    },
    expectDx: ['intussusception'],
    expectDiscriminator: ['ultrasound', 'us', 'target', 'doughnut', 'air enema', 'contrast enema'],
    resultText: 'Abdominal US: target/doughnut sign in the right upper quadrant with a bowel-within-bowel appearance, trace free fluid',
    moveDx: ['intussusception'], direction: 'up',
  },
  // ── Paediatrics DEPTH (neonatology + PICU-level reasoning) — the dossier's
  //    deepest sections: day-of-life anchoring, the duct-dependent collapse
  //    that mimics sepsis, and neonatal sepsis on the septic screen. ──────────
  {
    id: 'neonate-collapse-to-duct-dependent',
    title: 'Day-5 neonatal collapse → duct-dependent cardiac lesion on pre/post-ductal sats + echo',
    dept: 'paeds',
    subDept: 'neonatal',
    record: {
      intake: { name: 'N1', age: '5 days', sex: 'M', admissionDiagnosis: 'sudden collapse and poor feeding', allergies: 'NKDA' },
      history: { chiefComplaint: 'grey, floppy and not feeding since this morning', hpi: 'Born at term, normal delivery, discharged well day 1. Fed well until today — now grey, lethargic, poor feeding, fast breathing. No fever. Weight 3.1 kg. This is the classic day-3-to-14 presentation as the ductus closes.', pmh: 'nil', medications: 'none', hivStatus: 'exposed, on prophylaxis' },
      assessment: { vitals: 'HR 190, RR 68, sats 78% (right hand) vs 68% (foot), Temp 36.4, cap refill 5s', examination: 'grey, mottled, floppy, weak/absent femoral pulses, hepatomegaly, active precordium' },
    },
    expectDx: ['duct-dependent', 'congenital heart', 'critical congenital', 'coarctation', 'ductal', 'cyanotic'],
    expectDiscriminator: ['pre-ductal', 'post-ductal', 'pre/post', 'four-limb', 'echo', 'echocardiog', 'femoral', 'hyperoxia'],
    resultText: 'Pre/post-ductal sats gradient confirmed (right hand 78% vs foot 68%) ; four-limb BP: upper > lower with weak femorals ; echo: critical coarctation with a closing duct ; hyperoxia test failed to correct',
    moveDx: ['duct-dependent', 'congenital heart', 'coarctation', 'ductal'], direction: 'up',
  },
  {
    id: 'neonate-not-feeding-to-sepsis',
    title: 'Day-3 neonate "just not feeding" → early neonatal sepsis on septic screen',
    dept: 'paeds',
    subDept: 'neonatal',
    record: {
      intake: { name: 'N2', age: '3 days', sex: 'F', admissionDiagnosis: 'poor feeding and temperature instability', allergies: 'NKDA' },
      history: { chiefComplaint: 'not feeding, floppy, cool to touch', hpi: 'Prolonged rupture of membranes (>18h) and maternal intrapartum fever noted at delivery. Baby feeding poorly since day 2, now lethargic with temperature instability. Weight 2.9 kg. In a neonate "just not feeding" is sepsis until proven otherwise.', pmh: 'PROM >18h, maternal fever', medications: 'none', hivStatus: 'exposed' },
      assessment: { vitals: 'Temp 35.6 (hypothermic), HR 180, RR 70, sats 92%, glucose 2.3', examination: 'lethargic, poor tone, mottled, delayed cap refill, reduced activity' },
    },
    expectDx: ['neonatal sepsis', 'sepsis', 'early-onset sepsis', 'early onset'],
    expectDiscriminator: ['septic screen', 'blood culture', 'fbc', 'crp', 'culture', 'lp', 'glucose'],
    resultText: 'FBC: WCC 2.1 (neutropenia) with left shift ; CRP 68 rising ; blood culture taken (pending) ; glucose 2.3 corrected ; empiric ampicillin + gentamicin started without delay',
    moveDx: ['neonatal sepsis', 'sepsis', 'early-onset sepsis'], direction: 'up',
  },

  // ── Intensive Care (M2) — critical-care cases where a result discriminates
  //    the picture / support decision. ───────────────────────────────────────
  {
    id: 'vent-hypoxia-to-ards',
    title: 'Worsening ventilated hypoxia → ARDS on CXR + P/F ratio (cardiogenic excluded)',
    dept: 'icu',
    record: {
      intake: { name: 'I1', age: '44', sex: 'M', admissionDiagnosis: 'severe pneumonia, intubated', allergies: 'NKDA' },
      history: { chiefComplaint: 'worsening hypoxia on the ventilator', hpi: 'Day 2 of invasive ventilation for severe community-acquired pneumonia; over the last hours rising FiO2 requirement and falling saturations despite recruitment. No fluid overload clinically.', pmh: 'nil', medications: 'noradrenaline low dose, sedation', hivStatus: 'negative' },
      assessment: { vitals: 'FiO2 0.8, PEEP 10, SpO2 88%, BP 104/62 on noradrenaline 0.1 mcg/kg/min', examination: 'bilateral crepitations, no raised JVP, warm peripheries' },
    },
    expectDx: ['ards', 'acute respiratory distress'],
    expectDiscriminator: ['cxr', 'chest x', 'p/f', 'pao2', 'fio2', 'echo', 'ratio'],
    resultText: 'CXR: new bilateral diffuse infiltrates ; ABG PaO2 8 kPa on FiO2 0.8 → P/F ratio ~75 (≈130 mmHg) ; bedside echo: good LV function, no effusion (cardiogenic oedema excluded)',
    moveDx: ['ards', 'acute respiratory distress'], direction: 'up',
  },
  {
    id: 'icu-shock-to-septic',
    title: 'Pressor-dependent hypotension → distributive/septic shock on echo + lactate',
    dept: 'icu',
    record: {
      intake: { name: 'I2', age: '58', sex: 'F', admissionDiagnosis: 'hypotension post-laparotomy', allergies: 'NKDA' },
      history: { chiefComplaint: 'escalating vasopressor requirement', hpi: 'Day 3 post emergency laparotomy for perforated bowel; rising noradrenaline requirement, oliguria, and new fever. Question the shock type before escalating.', pmh: 'nil', medications: 'noradrenaline escalating, piptazobactam', hivStatus: 'negative' },
      assessment: { vitals: 'BP 88/44 on noradrenaline 0.4 mcg/kg/min, HR 122, Temp 38.7', examination: 'warm flushed peripheries, bounding pulses, CRT <2s' },
    },
    expectDx: ['septic shock', 'distributive shock', 'sepsis'],
    expectDiscriminator: ['echo', 'lactate', 'scvo2', 'cultures', 'source', 'procalcitonin'],
    resultText: 'Bedside echo: hyperdynamic LV, low SVR picture, IVC variable ; lactate 5.2 rising ; ScvO2 78% (high) ; cultures sent, likely anastomotic leak source',
    moveDx: ['septic shock', 'distributive shock', 'sepsis'], direction: 'up',
  },
  {
    id: 'icu-oliguria-to-rrt-aki',
    title: 'Oliguric AKI → dialysis-requiring on K⁺/pH/fluid overload',
    dept: 'icu',
    record: {
      intake: { name: 'I3', age: '51', sex: 'M', admissionDiagnosis: 'septic AKI', allergies: 'NKDA' },
      history: { chiefComplaint: 'anuria and rising potassium', hpi: 'Day 4 of septic shock with progressive AKI; urine output has fallen to <0.2 ml/kg/h despite adequate MAP and fluid challenge, now anuric with a rising creatinine.', pmh: 'HTN', medications: 'noradrenaline weaning', hivStatus: 'negative' },
      assessment: { vitals: 'BP 118/70, HR 96, RR 26, sats 92%', examination: 'anasarca, bibasal crepitations, raised JVP' },
    },
    expectDx: ['acute kidney injury', 'aki', 'renal failure', 'dialysis', 'rrt'],
    expectDiscriminator: ['potassium', 'k+', 'ph', 'bicarb', 'urea', 'fluid', 'rrt', 'dialysis'],
    resultText: 'K⁺ 6.9 with ECG tenting ; VBG pH 7.16, HCO3 12 ; creatinine 620 rising ; refractory pulmonary oedema, anuric despite furosemide',
    moveDx: ['acute kidney injury', 'aki', 'renal failure', 'dialysis', 'rrt'], direction: 'up',
  },
  {
    id: 'icu-fever-to-vap',
    title: 'New ventilator-day fever + hypoxia → VAP on CXR + tracheal aspirate',
    dept: 'icu',
    record: {
      intake: { name: 'I4', age: '39', sex: 'M', admissionDiagnosis: 'polytrauma, ventilated', allergies: 'NKDA' },
      history: { chiefComplaint: 'new fever and rising oxygen requirement on day 5', hpi: 'Day 5 of invasive ventilation after polytrauma; new fever, purulent secretions and a rising FiO2 requirement having previously been improving.', pmh: 'nil', medications: 'sedation, VTE prophylaxis', hivStatus: 'negative' },
      assessment: { vitals: 'Temp 38.9, FiO2 up from 0.4 to 0.6, SpO2 93%, HR 108', examination: 'coarse crepitations right base, increased purulent tracheal secretions' },
    },
    expectDx: ['ventilator-associated pneumonia', 'vap', 'nosocomial pneumonia', 'hospital-acquired pneumonia'],
    expectDiscriminator: ['cxr', 'chest x', 'tracheal aspirate', 'culture', 'wcc', 'secretions'],
    resultText: 'CXR: new right lower-zone infiltrate ; tracheal aspirate purulent, Gram-negative bacilli on Gram stain, culture sent ; WCC 18 rising, CRP up',
    moveDx: ['ventilator-associated pneumonia', 'vap', 'nosocomial pneumonia', 'hospital-acquired pneumonia'], direction: 'up',
  },

  // ── Orthopaedics & Trauma (M2) — the limb/spine emergencies where an
  //    investigation confirms the operative diagnosis. ─────────────────────────
  {
    id: 'hot-joint-to-septic-arthritis',
    title: 'Hot swollen knee → septic arthritis on joint aspirate',
    dept: 'ortho',
    record: {
      intake: { name: 'O1', age: '52', sex: 'M', admissionDiagnosis: 'acutely painful swollen knee', allergies: 'NKDA' },
      history: { chiefComplaint: 'hot, swollen, extremely painful right knee', hpi: '2-day history of a hot swollen right knee, unable to bear weight, febrile, no trauma. Diabetic.', pmh: 'T2DM', medications: 'metformin', hivStatus: 'positive on ART' },
      assessment: { vitals: 'Temp 38.6, HR 104', examination: 'right knee hot, swollen, tense effusion, exquisitely painful on any passive movement, held flexed' },
    },
    expectDx: ['septic arthritis'],
    expectDiscriminator: ['aspirate', 'aspiration', 'synovial', 'joint fluid', 'gram', 'wcc', 'culture'],
    resultText: 'Joint aspirate: turbid fluid, synovial WCC 78 000 with 95% neutrophils, Gram-positive cocci in clusters seen, no crystals',
    moveDx: ['septic arthritis'], direction: 'up',
  },
  {
    id: 'elderly-fall-to-nof',
    title: 'Elderly fall, shortened leg → hip (NOF) fracture on X-ray',
    dept: 'ortho',
    record: {
      intake: { name: 'O2', age: '79', sex: 'F', admissionDiagnosis: 'fall, unable to weight-bear', allergies: 'NKDA' },
      history: { chiefComplaint: 'left hip pain and unable to stand after a fall', hpi: 'Mechanical fall at home onto the left side, immediate left hip pain, unable to weight-bear. Lives alone.', pmh: 'HTN, osteoporosis', medications: 'amlodipine', hivStatus: 'negative' },
      assessment: { vitals: 'BP 138/80, HR 88', examination: 'left leg shortened and externally rotated, pain on any hip movement, neurovascularly intact distally' },
    },
    expectDx: ['neck of femur', 'nof', 'hip fracture', 'femoral neck', 'intracapsular'],
    expectDiscriminator: ['x-ray', 'xray', 'radiograph', 'ap pelvis', 'hip film', 'mri'],
    resultText: 'AP pelvis + lateral hip X-ray: displaced intracapsular fracture of the left femoral neck (Garden IV)',
    moveDx: ['neck of femur', 'nof', 'hip fracture', 'femoral neck', 'intracapsular'], direction: 'up',
  },
  {
    id: 'back-pain-to-cauda-equina',
    title: 'Back pain + saddle anaesthesia + retention → cauda equina on MRI',
    dept: 'ortho',
    record: {
      intake: { name: 'O3', age: '41', sex: 'M', admissionDiagnosis: 'severe low back pain with urinary symptoms', allergies: 'NKDA' },
      history: { chiefComplaint: 'severe low back pain, numb perineum and cannot pass urine', hpi: 'Acute severe low back pain radiating down both legs after lifting, now with saddle numbness and urinary retention since this morning.', pmh: 'nil', medications: 'none', hivStatus: 'negative' },
      assessment: { vitals: 'BP 132/82, HR 84', examination: 'reduced perianal sensation, lax anal tone, bilateral leg weakness, palpable bladder' },
    },
    expectDx: ['cauda equina'],
    expectDiscriminator: ['mri', 'lumbosacral', 'spine mri', 'imaging'],
    resultText: 'Urgent MRI lumbosacral spine: large central L4/5 disc prolapse compressing the cauda equina with effaced CSF',
    moveDx: ['cauda equina'], direction: 'up',
  },
  {
    id: 'tibia-fracture-to-compartment-syndrome',
    title: 'Tibial fracture, escalating pain → compartment syndrome on pressures',
    dept: 'ortho',
    record: {
      intake: { name: 'O4', age: '24', sex: 'M', admissionDiagnosis: 'closed tibial shaft fracture', allergies: 'NKDA' },
      history: { chiefComplaint: 'severe and worsening calf pain after a tibial fracture', hpi: 'Closed tibial shaft fracture from a soccer tackle 4 hours ago, in a backslab; escalating pain now far out of proportion and not controlled by opioids.', pmh: 'nil', medications: 'morphine', hivStatus: 'negative' },
      assessment: { vitals: 'HR 110, BP 132/78', examination: 'tense swollen calf, agonising pain on passive dorsiflexion of the toes, distal pulses still present, sensation intact' },
    },
    expectDx: ['compartment syndrome'],
    expectDiscriminator: ['compartment pressure', 'pressure', 'delta pressure', 'fasciotomy', 'clinical'],
    resultText: 'Intracompartmental pressure 48 mmHg with a diastolic BP of 78 → delta pressure 30 mmHg and falling; pain still escalating',
    moveDx: ['compartment syndrome'], direction: 'up',
  },

  // ── Psychiatry (M2) — the core competency is ORGANIC EXCLUSION: the loop
  //    tests that the picture does NOT anchor on a psychiatric label when the
  //    investigation reveals an organic/toxic cause. ─────────────────────────
  {
    id: 'first-psychosis-to-substance-induced',
    title: 'First-episode psychosis → substance-induced (methamphetamine) on urine tox',
    dept: 'psych',
    record: {
      intake: { name: 'Y1', age: '23', sex: 'M', admissionDiagnosis: 'acute psychosis', allergies: 'NKDA' },
      history: { chiefComplaint: 'paranoid, agitated and hearing voices', hpi: 'Family report 5 days of paranoia, not sleeping, agitation and hearing voices; no prior psychiatric history. Recently mixing with a new crowd. Collateral suggests possible drug use.', pmh: 'nil psychiatric', medications: 'none', hivStatus: 'unknown, testing offered' },
      assessment: { vitals: 'BP 148/92, HR 108, Temp 37.2', examination: 'agitated, dilated pupils, picking at skin, paranoid persecutory delusions, no orientation deficit' },
    },
    expectDx: ['substance-induced', 'methamphetamine', 'stimulant', 'drug-induced psychosis', 'substance'],
    expectDiscriminator: ['urine', 'tox', 'toxicology', 'drug screen', 'uds'],
    resultText: 'Urine toxicology: POSITIVE for methamphetamine and cannabis ; TFTs normal, glucose normal, HIV negative',
    moveDx: ['substance-induced', 'methamphetamine', 'stimulant', 'drug-induced'], direction: 'up',
  },
  {
    id: 'acute-confusion-to-delirium',
    title: 'Elderly acute behavioural change → delirium (organic), not psychiatric, on septic + metabolic screen',
    dept: 'psych',
    record: {
      intake: { name: 'Y2', age: '74', sex: 'F', admissionDiagnosis: 'acute confusion and agitation', allergies: 'NKDA' },
      history: { chiefComplaint: 'sudden confusion, agitation and visual hallucinations', hpi: 'Referred as "acute psychosis" — 2-day history of fluctuating confusion, agitation and seeing things, worse at night. No psychiatric history. On multiple medications. Reduced oral intake.', pmh: 'HTN, T2DM', medications: 'amlodipine, metformin, recently started an anticholinergic', hivStatus: 'negative' },
      assessment: { vitals: 'Temp 38.1, HR 104, BP 128/74, sats 95%', examination: 'fluctuating attention, disoriented to time and place, drowsy then agitated, dry mucous membranes' },
    },
    expectDx: ['delirium', 'acute confusional', 'organic'],
    expectDiscriminator: ['glucose', 'u&e', 'urine', 'septic screen', 'sodium', 'infection', 'ct', 'fbc'],
    resultText: 'Urine dipstick + MCS: florid UTI ; Na⁺ 126 (hyponatraemia) ; WCC 15 ; CT brain: no acute intracranial pathology',
    moveDx: ['delirium', 'acute confusional', 'organic'], direction: 'up',
  },
  {
    id: 'antipsychotic-rigidity-to-nms',
    title: 'Rigidity + fever on antipsychotic → neuroleptic malignant syndrome on CK + temp',
    dept: 'psych',
    record: {
      intake: { name: 'Y3', age: '31', sex: 'M', admissionDiagnosis: 'rigidity and fever', allergies: 'NKDA' },
      history: { chiefComplaint: 'stiffness, fever and confusion', hpi: 'Known schizophrenia, haloperidol dose recently increased; over 2 days developed generalised rigidity, high fever, sweating, confusion and unstable observations.', pmh: 'schizophrenia', medications: 'haloperidol (recently uptitrated)', hivStatus: 'negative' },
      assessment: { vitals: 'Temp 40.1, HR 128, BP 165/98 labile, RR 24', examination: 'lead-pipe rigidity, diaphoretic, fluctuating consciousness, tremor' },
    },
    expectDx: ['neuroleptic malignant', 'nms'],
    expectDiscriminator: ['ck', 'creatine kinase', 'temperature', 'temp', 'wcc', 'u&e'],
    resultText: 'CK 9200 U/L (markedly raised) ; core temp 40.1 ; WCC 16 ; U&E: creatinine rising with myoglobinuria on dipstick',
    moveDx: ['neuroleptic malignant', 'nms'], direction: 'up',
  },
  {
    id: 'lithium-tremor-to-toxicity',
    title: 'Tremor, ataxia, confusion on lithium → lithium toxicity on serum level',
    dept: 'psych',
    record: {
      intake: { name: 'Y4', age: '46', sex: 'F', admissionDiagnosis: 'tremor and confusion', allergies: 'NKDA' },
      history: { chiefComplaint: 'coarse tremor, unsteadiness and drowsiness', hpi: 'Bipolar disorder on lithium; over the last week worsening coarse tremor, unsteadiness, vomiting and diarrhoea (a viral illness), now drowsy and confused. Recently started a diuretic for hypertension.', pmh: 'bipolar disorder, HTN', medications: 'lithium, recently added hydrochlorothiazide', hivStatus: 'negative' },
      assessment: { vitals: 'BP 118/74, HR 92, Temp 36.8', examination: 'coarse tremor, ataxia, hyperreflexia, mild confusion, clinically dehydrated' },
    },
    expectDx: ['lithium toxicity', 'lithium'],
    expectDiscriminator: ['lithium level', 'level', 'serum lithium', 'u&e', 'creatinine'],
    resultText: 'Serum lithium 2.6 mmol/L (toxic, target 0.6-0.8) ; creatinine raised at 140 with a low eGFR ; Na⁺ 133',
    moveDx: ['lithium toxicity', 'lithium'], direction: 'up',
  },

  // ── Anaesthetics (M2, new department) — the core competency is treating
  //    peri-operative deterioration as a DIFFERENTIAL with a discriminating
  //    test, not a mystery: MH on EtCO2/temp/CK, anaphylaxis on tryptase,
  //    delayed emergence on train-of-four, and the "don't blame the spinal"
  //    trap (post-spinal hypotension = haemorrhage until Hb/lactate clear it).
  {
    id: 'intraop-hyperthermia-to-mh',
    title: 'Rising EtCO2 + rigidity under volatile GA → malignant hyperthermia on temp/gas/CK',
    dept: 'anaes',
    record: {
      intake: { name: 'A1', age: '19', sex: 'M', admissionDiagnosis: 'intra-operative deterioration under GA', allergies: 'NKDA', plannedProcedure: 'ORIF forearm under GA', urgency: 'urgent', asaGrade: 'IE' },
      history: { chiefComplaint: 'deterioration 40 minutes into GA', hpi: 'Previously well; GA with sevoflurane + suxamethonium for intubation. 40 min in: EtCO2 climbing despite increased minute ventilation, tachycardia, masseter spasm at induction noted in retrospect. No prior anaesthetics; family history unknown.', pmh: 'nil', medications: 'none', anaestheticHistory: 'first anaesthetic; family history unknown' },
      assessment: { vitals: 'HR 138, BP 152/94, Temp 38.9 and rising, sats 94%', examination: 'generalised muscle rigidity, hot to touch, mottled; EtCO2 72 despite doubled minute ventilation' },
    },
    expectDx: ['malignant hyperthermia', 'mh'],
    expectDiscriminator: ['temp', 'etco2', 'co2', 'gas', 'abg', 'ck', 'creatine kinase', 'potassium'],
    resultText: 'Core temp 40.2 rising ; ABG: mixed respiratory + metabolic acidosis pH 7.09, PaCO2 9.1 kPa, lactate 6 ; K⁺ 6.1 ; CK 4800 and climbing ; EtCO2 unresponsive to ventilation',
    moveDx: ['malignant hyperthermia', 'mh'], direction: 'up',
  },
  {
    id: 'post-induction-collapse-to-anaphylaxis',
    title: 'Post-induction hypotension + bronchospasm → anaphylaxis on tryptase',
    dept: 'anaes',
    record: {
      intake: { name: 'A2', age: '44', sex: 'F', admissionDiagnosis: 'collapse after induction of anaesthesia', allergies: 'none known before today', plannedProcedure: 'laparoscopic cholecystectomy', urgency: 'elective', asaGrade: 'II' },
      history: { chiefComplaint: 'profound hypotension minutes after induction', hpi: 'Induction with propofol + rocuronium, cefazolin given on induction. Within minutes: profound hypotension, high airway pressures with bronchospasm, and a flushed upper chest. No blood loss; no cardiac history.', pmh: 'gallstones, otherwise well', medications: 'none', anaestheticHistory: 'previous uneventful GA 2015' },
      assessment: { vitals: 'BP 58/32, HR 132, sats 88% on 100% FiO2', examination: 'widespread flush over chest, bilateral wheeze with high inflation pressures, weak central pulse' },
    },
    expectDx: ['anaphylaxis', 'anaphylactic'],
    expectDiscriminator: ['tryptase', 'clinical', 'response to adrenaline'],
    resultText: 'Serum mast-cell tryptase (drawn 1h after onset) 48 mcg/L, markedly raised ; rapid BP response to IM/IV adrenaline + fluids ; airway pressures settling with adrenaline',
    moveDx: ['anaphylaxis', 'anaphylactic'], direction: 'up',
  },
  {
    id: 'delayed-emergence-to-residual-block',
    title: 'Failure to wake after GA → residual neuromuscular blockade on train-of-four',
    dept: 'anaes',
    record: {
      intake: { name: 'A3', age: '68', sex: 'F', admissionDiagnosis: 'not waking after general anaesthetic', allergies: 'NKDA', plannedProcedure: 'emergency laparotomy (completed)', urgency: 'emergency', asaGrade: 'IIIE' },
      history: { chiefComplaint: 'unresponsive 30 minutes after volatile switched off', hpi: 'Emergency laparotomy under GA with atracurium boluses; case ran long. 30 min after the volatile was off: not opening eyes, shallow irregular breathing, floppy. CKD stage 3. Reversal given but dose/time unclear.', pmh: 'CKD stage 3, hypertension, T2DM', medications: 'amlodipine, metformin, insulin', anaestheticHistory: 'GA for hysterectomy years ago, uneventful' },
      assessment: { vitals: 'BP 132/78, HR 88, Temp 35.8, sats 93% on face mask', examination: 'unresponsive to voice, weak cough, shallow tidal volumes, generalised flaccidity, pupils mid-size reactive' },
    },
    expectDx: ['residual neuromuscular block', 'residual paralysis', 'residual block', 'neuromuscular'],
    expectDiscriminator: ['train-of-four', 'tof', 'nerve stimulator', 'glucose', 'abg', 'gas'],
    resultText: 'Train-of-four ratio 0.4 with fade (significant residual neuromuscular blockade) ; glucose 6.2 ; ABG: PaCO2 7.2 kPa from hypoventilation, PaO2 acceptable on O2 ; temp 35.8',
    moveDx: ['residual neuromuscular block', 'residual paralysis', 'residual block', 'neuromuscular'], direction: 'up',
  },
  {
    id: 'post-spinal-hypotension-to-haemorrhage',
    title: 'Hypotension after spinal for CS → concealed haemorrhage on Hb + lactate (not the sympathectomy)',
    dept: 'anaes',
    record: {
      intake: { name: 'A4', age: '29', sex: 'F', admissionDiagnosis: 'persistent hypotension after caesarean section under spinal', allergies: 'NKDA', plannedProcedure: 'caesarean section under spinal (completed)', urgency: 'emergency', asaGrade: 'IIE' },
      history: { chiefComplaint: 'BP falling in recovery after CS under spinal', hpi: 'Emergency CS under spinal for fetal distress; delivery uneventful per operative note, estimated blood loss recorded as 600ml. In recovery 45 min later: persistently hypotensive and tachycardic despite fluid co-load and two doses of vasopressor. Abdomen distending; scanty vaginal loss.', pmh: 'nil', medications: 'oxytocin infusion running', anaestheticHistory: 'spinal today — block level T4, no complication at insertion' },
      assessment: { vitals: 'BP 84/48 despite phenylephrine, HR 126 rising, sats 97%', examination: 'pale, cool peripheries, abdomen distended and tense, fundus difficult to feel, minimal lochia' },
    },
    expectDx: ['haemorrhage', 'bleeding', 'hypovolaem', 'concealed'],
    expectDiscriminator: ['hb', 'haemoglobin', 'lactate', 'fbc', 'ultrasound', 'fast'],
    resultText: 'Hb 6.4 g/dL from 11.8 pre-op ; lactate 4.8 ; bedside ultrasound: free fluid in the abdomen ; HR still climbing despite vasopressor',
    moveDx: ['haemorrhage', 'bleeding', 'hypovolaem', 'concealed'], direction: 'up',
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
