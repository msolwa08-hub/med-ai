// O&G evaluation scenarios for the MedAI intern-tools harness.
//
// Each scenario is a real patient the harness clerks THROUGH THE LIVE APP API,
// the way an intern would. `facts` is the ground truth the AI-intern answers
// from; `expected` is what a correct, CONSULTANT-GRADE app must surface, so both
// the intern-accessibility and the senior-reasoning scores are objective.
//
// Fields:
//   setting: 'clinic' | 'admission' | 'ward'  — which document the app should produce
//   expected.workingDx / problems           — must be reached
//   expected.differentials                   — dangerous-first incl. the ZEBRA (senior lens)
//   expected.criticalFields                  — omitting these should raise an alarm
//   expected.contradiction { inject, signal }— a wrong fact to inject + what the app should flag
//   expected.safetyMustNotBlock / Forbidden  — drug-safety correctness
//   expected.presentationMustContain

export const SCENARIOS = [
  // ── OBSTETRIC ──────────────────────────────────────────────────────────────
  {
    id: 'antenatal-severe-pet', title: 'Antenatal — severe pre-eclampsia',
    dept: 'og', subDept: 'antenatal', ageSex: '31 F', setting: 'admission',
    facts: `31yo G3P2 at 33 weeks by early scan. Frontal headache + epigastric pain since last night, reduced fetal movements today. BP 172/116, urine 3+ protein. Booked late (2 visits). HIV negative, RPR negative. NKDA. On no chronic meds. Two previous NVDs. No PV bleeding/leaking. Reflexes brisk, 2 beats clonus.`,
    expected: {
      workingDx: ['pre-eclampsia'], problems: ['pre-eclampsia'],
      differentials: ['eclampsia', 'HELLP', 'gestational hypertension'],
      criticalFields: ['blood pressure', 'proteinuria', 'gestational age'],
      contradiction: { inject: 'Also states she is definitely NOT pregnant and has no gestational age.', signal: ['pregnan', 'gestation'] },
      safetyForbidden: ['ergometrine'], presentationMustContain: ['pre-eclampsia'],
    },
  },
  {
    id: 'antenatal-eclampsia', title: 'Antenatal — eclampsia (fitting)',
    dept: 'og', subDept: 'antenatal', ageSex: '22 F', setting: 'admission',
    facts: `22yo primigravida ~36 weeks, unbooked. Had a generalised tonic-clonic seizure at home, now drowsy. BP 180/120, urine 3+ protein. No known epilepsy. NKDA.`,
    expected: {
      workingDx: ['eclampsia'], problems: ['eclampsia', 'pre-eclampsia'],
      differentials: ['epilepsy', 'cerebral venous thrombosis', 'meningitis', 'hypoglycaemia'],
      criticalFields: ['blood pressure', 'seizure', 'gestational age'],
      contradiction: { inject: 'Says the seizure was actually 6 weeks postpartum, not antenatal — but also says she is 36 weeks pregnant.', signal: ['postpartum', 'weeks'] },
      safetyForbidden: ['ergometrine'], presentationMustContain: ['eclampsia'],
    },
  },
  {
    id: 'labour-pph', title: 'Labour ward — primary PPH',
    dept: 'og', subDept: 'labour', ageSex: '33 F', setting: 'ward',
    facts: `33yo G4P4, NVD of a 4.1kg baby 25 min ago. Ongoing heavy PV bleeding ~1100ml, uterus boggy and high. BP 96/60, pulse 122. Placenta complete. NKDA. No chronic meds.`,
    expected: {
      workingDx: ['postpartum haemorrhage', 'atony'], problems: ['haemorrhage'],
      differentials: ['uterine atony', 'retained products', 'genital tract trauma', 'coagulopathy'],
      criticalFields: ['blood loss', 'uterine tone', 'blood pressure'],
      contradiction: { inject: 'Also states she has not delivered and is still 20 weeks pregnant.', signal: ['deliver', 'postpartum', 'weeks'] },
      safetyForbidden: [], presentationMustContain: ['haemorrhage'],
    },
  },
  {
    id: 'aph-abruption', title: 'Antenatal — APH (abruption)',
    dept: 'og', subDept: 'antenatal', ageSex: '28 F', setting: 'admission',
    facts: `28yo G3P2 at 34 weeks. Sudden severe constant abdominal pain + dark PV bleeding. Uterus woody-hard and tender, difficult to feel fetal parts. BP 100/64, pulse 116. Known hypertension. NKDA.`,
    expected: {
      workingDx: ['abruption', 'antepartum haemorrhage'], problems: ['abruption'],
      differentials: ['placenta praevia', 'uterine rupture', 'vasa praevia', 'labour'],
      criticalFields: ['bleeding', 'uterine tone', 'gestational age'],
      contradiction: { inject: 'Nurse note says do a vaginal exam now; patient denies any bleeding.', signal: ['vaginal exam', 'praevia', 'bleeding'] },
      safetyForbidden: [], presentationMustContain: ['haemorrhage'],
    },
  },
  {
    id: 'preterm-labour', title: 'Labour ward — preterm labour',
    dept: 'og', subDept: 'labour', ageSex: '26 F', setting: 'admission',
    facts: `26yo G2P1 at 30 weeks. Regular painful contractions 3 in 10, cervix 3cm dilated. Membranes intact. No bleeding. HIV positive on TLD, VL undetectable. NKDA.`,
    expected: {
      workingDx: ['preterm labour'], problems: ['preterm labour', 'hiv'],
      differentials: ['chorioamnionitis', 'abruption', 'UTI-triggered', 'braxton-hicks'],
      criticalFields: ['gestational age', 'cervix', 'contractions'],
      contradiction: { inject: 'Also says she is 41 weeks and post-dates.', signal: ['weeks', 'gestation'] },
      safetyForbidden: [], presentationMustContain: ['preterm'],
    },
  },
  {
    id: 'gdm-clinic', title: 'Antenatal clinic — GDM follow-up',
    dept: 'og', subDept: 'antenatal', ageSex: '35 F', setting: 'clinic',
    facts: `35yo G4P3 at 28 weeks, previous macrosomic baby 4.3kg. OGTT this week: fasting 6.1, 2h 9.4. BMI 34. On no meds. Not on insulin yet. BP normal. NKDA. Previous history: 3 prior term NVDs, one shoulder dystocia.`,
    expected: {
      workingDx: ['gestational diabetes', 'gdm'], problems: ['gestational diabetes'],
      differentials: ['pre-existing type 2 diabetes', 'impaired glucose tolerance'],
      criticalFields: ['glucose', 'ogtt', 'gestational age'],
      contradiction: { inject: 'Reports she is not pregnant and here for a pap smear only.', signal: ['pregnan', 'gestation'] },
      safetyForbidden: [], presentationMustContain: ['diabet'],
    },
  },
  {
    id: 'iufd', title: 'Antenatal — intrauterine fetal death',
    dept: 'og', subDept: 'antenatal', ageSex: '30 F', setting: 'admission',
    facts: `30yo G2P1 at 32 weeks. No fetal movements for 2 days. No fetal heart on Doppler, confirmed absent cardiac activity on scan. BP normal. No bleeding. NKDA.`,
    expected: {
      workingDx: ['intrauterine fetal death', 'iufd'], problems: ['iufd', 'fetal death'],
      differentials: ['abruption', 'severe growth restriction', 'infection', 'cord accident'],
      criticalFields: ['fetal movements', 'fetal heart', 'gestational age'],
      contradiction: { inject: 'Also reports strong fetal movements right now and a normal CTG.', signal: ['movement', 'fetal heart', 'ctg'] },
      safetyForbidden: [], presentationMustContain: ['fetal'],
    },
  },
  // ── GYNAECOLOGY ────────────────────────────────────────────────────────────
  {
    id: 'gynae-ectopic', title: 'Gynae — ruptured ectopic',
    dept: 'og', subDept: 'gynae', ageSex: '24 F', setting: 'admission',
    facts: `24yo, LMP ~7 weeks ago, urine pregnancy test positive. Sudden severe RIF pain 3h, one episode shoulder-tip pain, faint. BP 92/58, pulse 118. Cervical excitation, right adnexal tenderness. TVS: empty uterus, right adnexal mass, free fluid. NKDA. On no meds.`,
    expected: {
      workingDx: ['ectopic'], problems: ['ectopic'],
      differentials: ['ruptured ovarian cyst', 'ovarian torsion', 'appendicitis', 'PID', 'miscarriage'],
      criticalFields: ['pregnancy test', 'lmp', 'pain'],
      contradiction: { inject: 'States the pregnancy test is negative and she cannot be pregnant.', signal: ['pregnan', 'hcg', 'test'] },
      safetyMustNotBlock: ['methotrexate'], presentationMustContain: ['ectopic'],
    },
  },
  {
    id: 'gynae-torsion', title: 'Gynae — ovarian torsion',
    dept: 'og', subDept: 'gynae', ageSex: '19 F', setting: 'admission',
    facts: `19yo, sudden severe left iliac fossa pain + vomiting for 4h, comes and goes. Pregnancy test negative. Palpable tender left adnexal mass. TVS: enlarged left ovary, whirlpool sign, reduced flow. NKDA.`,
    expected: {
      workingDx: ['ovarian torsion', 'torsion'], problems: ['torsion'],
      differentials: ['ruptured/haemorrhagic cyst', 'ectopic', 'appendicitis', 'PID'],
      criticalFields: ['pain', 'adnexal mass', 'pregnancy test'],
      contradiction: { inject: 'Also says the pain is mild, constant and has been present for 6 months.', signal: ['sudden', 'severe', 'acute'] },
      safetyForbidden: [], presentationMustContain: ['torsion'],
    },
  },
  {
    id: 'gynae-pid', title: 'Gynae — PID / tubo-ovarian abscess',
    dept: 'og', subDept: 'gynae', ageSex: '27 F', setting: 'admission',
    facts: `27yo, lower abdominal pain, fever, offensive vaginal discharge for 5 days. Deep dyspareunia. Cervical motion tenderness, bilateral adnexal tenderness. Temp 38.5. Pregnancy test negative. New partner, no condoms. NKDA.`,
    expected: {
      workingDx: ['pelvic inflammatory disease', 'pid'], problems: ['pid'],
      differentials: ['tubo-ovarian abscess', 'ectopic', 'appendicitis', 'ovarian torsion'],
      criticalFields: ['pregnancy test', 'fever', 'discharge'],
      contradiction: { inject: 'Also states she is 30 weeks pregnant and the pregnancy test was positive.', signal: ['pregnan', 'test'] },
      safetyForbidden: [], presentationMustContain: ['pelvic', 'pid', 'infection'],
    },
  },
  {
    id: 'gynae-aub-fibroids', title: 'Gynae clinic — heavy menstrual bleeding / fibroids',
    dept: 'og', subDept: 'gynae', ageSex: '42 F', setting: 'clinic',
    facts: `42yo, heavy menstrual bleeding 8 months, clots, flooding, tired. Bulky irregular uterus ~16-week size. Hb 7.8. Not on contraception. Previous history: 2 prior NVDs, known fibroids on scan 2 years ago. NKDA.`,
    expected: {
      workingDx: ['fibroid', 'heavy menstrual bleeding', 'menorrhagia'], problems: ['fibroid', 'anaemia'],
      differentials: ['endometrial hyperplasia/carcinoma', 'adenomyosis', 'coagulopathy', 'thyroid dysfunction'],
      criticalFields: ['bleeding pattern', 'haemoglobin', 'uterine size'],
      contradiction: { inject: 'Also reports no bleeding at all and completely normal light periods.', signal: ['heavy', 'bleeding', 'menorrhagia'] },
      safetyForbidden: [], presentationMustContain: ['bleeding', 'fibroid'],
    },
  },
  {
    id: 'gynae-pmb-endometrial', title: 'Gynae clinic — postmenopausal bleeding',
    dept: 'og', subDept: 'gynae', ageSex: '61 F', setting: 'clinic',
    facts: `61yo, postmenopausal 10 years, now painless PV bleeding for 3 weeks. Obese, hypertensive, type 2 diabetic, nulliparous. Not on HRT. TVS: endometrial thickness 14mm. NKDA.`,
    expected: {
      workingDx: ['endometrial carcinoma', 'postmenopausal bleeding'], problems: ['postmenopausal bleeding'],
      differentials: ['endometrial carcinoma', 'endometrial hyperplasia', 'atrophic vaginitis', 'cervical carcinoma', 'endometrial polyp'],
      criticalFields: ['menopausal status', 'endometrial thickness', 'bleeding'],
      contradiction: { inject: 'Also says she is 25 years old and still has regular monthly periods.', signal: ['postmenopaus', 'age', 'period'] },
      safetyForbidden: [], presentationMustContain: ['bleeding'],
    },
  },
  // ── POSTNATAL / WARD ───────────────────────────────────────────────────────
  {
    id: 'postnatal-post-cs-day3', title: 'Postnatal — post-CS day 3 sepsis watch',
    dept: 'og', subDept: 'postnatal', ageSex: '29 F', setting: 'ward',
    facts: `29yo, day 3 post emergency CS for fetal distress. Feverish, wound red at one edge + serous discharge. Temp 38.2, pulse 104. Lochia moderate non-offensive. HIV positive on TLD, VL undetectable, baby on nevirapine. Penicillin allergy (rash). No other meds.`,
    expected: {
      workingDx: ['wound sepsis', 'surgical site infection', 'infection'], problems: ['wound', 'hiv'],
      differentials: ['endometritis', 'mastitis', 'UTI', 'DVT/chest'],
      criticalFields: ['temperature', 'wound', 'allergy'],
      contradiction: { inject: 'Also states she had a normal vaginal delivery and no caesarean.', signal: ['caesarean', 'cs', 'wound'] },
      safetyForbidden: ['amoxicillin', 'ampicillin', 'co-amoxiclav', 'penicillin'],
      presentationMustContain: ['wound', 'caesarean'],
    },
  },
];

export function scenarioById(id) {
  return SCENARIOS.find((s) => s.id === id);
}
