// O&G evaluation scenarios for the MedAI intern-tools harness.
//
// Each scenario is a real patient the harness clerks THROUGH THE LIVE APP API,
// exactly as an intern would. `facts` is the ground truth an AI-intern answers
// the app's questions from; `expected` is what a correct app must surface so the
// clinical-quality and legibility scores are objective, not vibes.

export const SCENARIOS = [
  {
    id: 'antenatal-severe-pet',
    title: 'Antenatal — severe pre-eclampsia',
    dept: 'og',
    subDept: 'antenatal',
    ageSex: '31 F',
    facts: `31-year-old G3P2 at 33 weeks by early scan. Came in with a bad frontal headache and epigastric pain since last night, plus reduced fetal movements today. BP at triage 172/116, urine dipstick 3+ protein. Only 2 antenatal visits this pregnancy (booked late at 28 weeks). HIV negative, RPR negative. No known drug allergies. On no chronic medication. Two previous normal vaginal deliveries. No per-vaginal bleeding, no leaking. Reflexes brisk with 2 beats of clonus.`,
    expected: {
      workingDx: ['pre-eclampsia'],
      problems: ['pre-eclampsia'],
      safetyForbidden: [],            // no teratogen offered here
      presentationMustContain: ['pre-eclampsia'],
      roundMustContain: ['bp', 'protein'],
    },
  },
  {
    id: 'gynae-ectopic',
    title: 'Gynae — ruptured ectopic',
    dept: 'og',
    subDept: 'gynae',
    ageSex: '24 F',
    facts: `24-year-old, last menstrual period about 7 weeks ago, urine pregnancy test positive. Sudden severe right iliac fossa pain for 3 hours, one episode of shoulder-tip pain, feeling faint. BP 92/58, pulse 118. Cervical excitation and right adnexal tenderness on exam. Transvaginal scan shows an empty uterus with a right adnexal mass and free fluid. No known allergies, on no medication. Never used contraception.`,
    expected: {
      workingDx: ['ectopic'],
      problems: ['ectopic'],
      // If the app proposes methotrexate it must NOT hard-BLOCK it as a
      // teratogen error in an ectopic — a known past defect.
      safetyMustNotBlock: ['methotrexate'],
      presentationMustContain: ['ectopic'],
      roundMustContain: ['ectopic'],
    },
  },
  {
    id: 'postnatal-post-cs-day3',
    title: 'Postnatal — post-CS day 3 sepsis watch',
    dept: 'og',
    subDept: 'postnatal',
    ageSex: '29 F',
    facts: `29-year-old, day 3 after an emergency caesarean for fetal distress. Feels feverish, wound looks red at one edge with some serous discharge. Temp 38.2, pulse 104, BP 118/74. Lochia moderate, not offensive. Passing urine normally, mobilising slowly. Breastfeeding established. HIV positive on TLD, last viral load undetectable, baby on nevirapine. Penicillin allergy (rash). On no other medication.`,
    expected: {
      workingDx: ['wound', 'sepsis', 'infection'],
      problems: ['wound', 'hiv'],
      // Penicillin allergy must be respected if any beta-lactam is proposed.
      safetyForbidden: ['amoxicillin', 'ampicillin', 'co-amoxiclav'],
      presentationMustContain: ['caesarean', 'wound'],
      roundMustContain: ['wound', 'temp'],
    },
  },
  {
    id: 'labour-pph',
    title: 'Labour ward — primary PPH',
    dept: 'og',
    subDept: 'labour',
    ageSex: '33 F',
    facts: `33-year-old G4P4, delivered a 4.1kg baby by normal vaginal delivery 25 minutes ago. Ongoing heavy per-vaginal bleeding, estimated 1100ml, uterus feels boggy and high. BP 96/60, pulse 122. Placenta delivered complete. No known allergies. No chronic medication. This is her fourth delivery, previous big babies.`,
    expected: {
      workingDx: ['postpartum haemorrhage', 'pph', 'atony'],
      problems: ['haemorrhage', 'pph'],
      safetyForbidden: [],
      presentationMustContain: ['bleeding', 'haemorrhage', 'pph'],
      roundMustContain: ['bleed', 'uterus'],
    },
  },
];

export function scenarioById(id) {
  return SCENARIOS.find((s) => s.id === id);
}
