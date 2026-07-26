import type { DeptId } from './departments';

// ─── GLANCE 1 — pre-encounter must-not-miss (M-GLANCE) ───────────────────────
// The 10-second briefing shown BEFORE the encounter is deterministic local
// content — no model call inside a 10s glance. ASK and EXAM derive live from
// the symptom cascades and exam checklists; this registry holds the third
// cluster: the diagnoses/features that kill or maim when missed, per
// presenting complaint, with discipline-specific killers first. Conditions
// and flags only — never doses (M-GLANCE dose rule).

export interface Briefing {
  /** Complaint-level red flags, consultant-ordered (worst first). */
  mustNotMiss: string[];
  /** Discipline-specific killers, PREPENDED for that department. */
  byDept?: Partial<Record<DeptId, string[]>>;
}

export function mustNotMissFor(cascadeId: string, dept: DeptId): string[] {
  const b = BRIEFINGS[cascadeId];
  if (!b) return [];
  const extra = b.byDept?.[dept] ?? [];
  const seen = new Set<string>();
  return [...extra, ...b.mustNotMiss]
    .filter(x => {
      const k = x.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, 5);
}

const BRIEFINGS: Record<string, Briefing> = {
  'chest-pain': {
    mustNotMiss: [
      'ACS — ECG within 10 min',
      'Aortic dissection — tearing pain, BP both arms',
      'PE — pleuritic + risk factors, sats can be normal',
      'Tension pneumothorax — deviated trachea, silent hemithorax',
      'Oesophageal rupture after vomiting',
    ],
    byDept: {
      family: ['GORD/MSK common but exclude ACS first — ECG + troponin if any doubt', 'Unstable angina may present as "my usual heartburn"'],
    },
  },
  sob: {
    mustNotMiss: [
      'PE — sudden onset, clear chest',
      'Tension pneumothorax',
      'Anaphylaxis — stridor, lips/tongue',
      'Silent chest in asthma — pre-arrest, not improvement',
      '"Cardiac asthma" — LVF wheeze masquerading as bronchospasm',
    ],
    byDept: {
      paeds: ['Inhaled foreign body — sudden onset in a well child', 'Apnoeas in bronchiolitis (<3 months)'],
    },
  },
  'abdo-pain': {
    mustNotMiss: [
      'Ruptured ectopic — pregnancy test in EVERY woman of childbearing age',
      'AAA rupture — older patient, pain + hypotension',
      'Perforation — rigid abdomen, free air',
      'Mesenteric ischaemia — pain out of proportion to findings',
      'Strangulated hernia — check the orifices',
    ],
    byDept: {
      og: ['Ruptured ectopic until proven otherwise', 'Abruption — woody uterus, fetal distress', 'Ovarian torsion'],
      paeds: ['Intussusception — episodic pain + pallor', 'Malrotation/volvulus — bilious vomiting is surgical', 'Consider NAI if story inconsistent'],
      family: ['Ectopic in every reproductive-age woman — βhCG first', 'The chronic abdo pain that is really depression/anxiety — screen, but only after excluding the surgical causes'],
    },
  },
  headache: {
    mustNotMiss: [
      'SAH — thunderclap, worst-ever',
      'Meningitis — fever, neck stiffness, rash',
      'Raised ICP — worse lying/morning, papilloedema',
      'GCA if >50 — scalp tenderness, jaw claudication',
      'CVST — pregnancy/puerperium, OCP',
    ],
    byDept: {
      og: ['Pre-eclampsia/eclampsia — BP + proteinuria NOW, visual symptoms, epigastric pain'],
    },
  },
  fever: {
    mustNotMiss: [
      'Septic shock — hypotension/lactate, antibiotics within the hour',
      'Meningococcaemia — non-blanching rash, may look "flu-like"',
      'Malaria — ANY travel history',
      'Necrotising fasciitis — pain out of proportion',
      'Neutropenic sepsis — recent chemotherapy',
    ],
    byDept: {
      paeds: ['IMCI danger signs FIRST — any one = severe', '<3 months febrile = sepsis until proven otherwise'],
      og: ['Puerperal sepsis — retained products, uterine tenderness', 'Chorioamnionitis with ROM'],
      family: ['Malaria travel screen — any fever with travel history', 'HIV/TB overlay — fever may be the only TB symptom'],
    },
  },
  trauma: {
    mustNotMiss: [
      'Airway + C-spine before everything',
      'Tension pneumothorax — decompress on clinical grounds',
      'Concealed haemorrhage — pelvis, long bones, abdomen, chest',
      'Compartment syndrome — pain on passive stretch',
      'Head injury on anticoagulants — image early',
    ],
    byDept: {
      ortho: ['Open fracture — antibiotic clock <1h', 'Neurovascular status BEFORE and AFTER any reduction'],
      paeds: ['NAI — injury inconsistent with mechanism or developmental stage'],
    },
  },
  'pv-bleeding': {
    mustNotMiss: [
      'Ruptured ectopic — shock out of proportion to visible loss',
      'Underestimated haemorrhagic shock — young women compensate then crash',
      'Placenta praevia — NO digital VE until praevia excluded on ultrasound',
      'Abruption — pain + hard uterus, blood may be concealed',
      'Postmenopausal bleeding = malignancy until proven otherwise',
    ],
  },
  'reduced-loc': {
    mustNotMiss: [
      'Hypoglycaemia — glucose at the bedside NOW',
      'Opioid toxicity — pinpoint pupils, RR',
      'Raised ICP/herniation — unequal pupils, Cushing response',
      'Non-convulsive status epilepticus',
      'CO2 narcosis in the COPD patient on oxygen',
    ],
  },
  seizure: {
    mustNotMiss: [
      'Status epilepticus — the clock is running',
      'Hypoglycaemia — glucose before anything else',
      'Meningitis/encephalitis',
      'First seizure — structural lesion until imaged',
      'Alcohol withdrawal seizures',
    ],
    byDept: {
      og: ['Eclampsia — any seizure in pregnancy ≥20w is eclampsia until proven otherwise'],
      paeds: ['Febrile status >5 min — treat, don\'t observe', 'Consider NAI (shaken injury) in infants'],
    },
  },
  'joint-limb-pain': {
    mustNotMiss: [
      'Septic arthritis — the hot swollen joint is an emergency, aspirate',
      'Compartment syndrome — pain on passive stretch, pressure off',
      'NOF fracture in the elderly fall — shortened, externally rotated',
      'Cauda equina if back pain — saddle anaesthesia, retention',
      'Open fracture — antibiotic clock',
    ],
  },
  cough: {
    mustNotMiss: [
      'TB — ANY cough ≥2 weeks in SA gets a GeneXpert',
      'PE presenting as cough/haemoptysis',
      'Malignancy red flags — weight loss, haemoptysis, smoker >40',
      'Silent aspiration in the elderly/stroke patient',
    ],
    byDept: {
      paeds: ['Inhaled foreign body — sudden coughing fit in a toddler', 'Pertussis in the unimmunised infant — apnoeas'],
      family: ['TB — cough ≥2 weeks in SA = GeneXpert, no exceptions', 'Asthma/COPD step-up — assess control before adding another inhaler'],
    },
  },
  'vomiting-diarrhoea': {
    mustNotMiss: [
      'The surgical abdomen masquerading as gastro — examine the abdomen',
      'DKA presenting as vomiting',
      'Severe dehydration/shock — perfusion, not just history',
      'Hypokalaemia + AKI from losses',
    ],
    byDept: {
      paeds: ['Bilious vomiting in an infant = malrotation/volvulus until proven otherwise', 'IMCI danger signs + WHO dehydration classification'],
    },
  },
  'psych-presentation': {
    mustNotMiss: [
      'Organic cause FIRST — delirium: impaired attention, fluctuating course',
      'Hypoglycaemia mimicking psychosis',
      'Overdose/toxidrome behind the presentation',
      'Suicide risk — ask directly: ideation, plan, means',
      'NMS/serotonin syndrome if on psychotropics — temperature + rigidity',
    ],
  },
  'anaes-preop': {
    mustNotMiss: [
      'Difficult airway predictors — Mallampati, mouth opening, neck movement',
      'Personal/family MH or scoline apnoea history',
      'Full stomach/aspiration risk — fasting, obstruction, pregnancy',
      'Anticoagulation — agent and last dose',
      '<4 METs / undiagnosed cardiac disease',
    ],
  },
  'anaes-difficult-airway': {
    mustNotMiss: [
      'CICO — declare it early, FONA is a decision not a failure',
      'Oxygenation beats intubation — return to face mask/SGA',
      'Limit attempts — swelling makes each one harder',
      'Aspiration during prolonged attempts',
    ],
  },
  'anaes-hypotension': {
    mustNotMiss: [
      'Concealed haemorrhage — the field, the drains, the abdomen',
      'Anaphylaxis — pressures + wheeze + rash under the drapes',
      'High spinal — rising block, bradycardia',
      'Tension pneumothorax after lines/laparoscopy',
      'Embolism — PE, air, amniotic',
    ],
  },
  'anaes-anaphylaxis': {
    mustNotMiss: [
      'Adrenaline EARLY — dilution errors kill, use the protocol',
      'Culprits: NMBAs, antibiotics, latex, chlorhexidine',
      'Biphasic reaction — extended observation',
      'Tryptase timing — now, 1-2h, 24h',
    ],
  },
  'anaes-delayed-emergence': {
    mustNotMiss: [
      'Hypoglycaemia — glucose first',
      'Residual neuromuscular blockade — TOF before assuming sedation',
      'Opioid overnarcotisation — pupils + RR',
      'Hypothermia delaying metabolism',
      'Intracranial event — the emergence that never comes',
    ],
  },
  'anaes-ponv-pain': {
    mustNotMiss: [
      'The surgical complication behind the "pain" — compartment, leak, bleed',
      'Opioid respiratory depression while treating the pain',
      'PONV as a sign — raised ICP, hypotension, ileus',
    ],
  },
  'anaes-high-spinal-last': {
    mustNotMiss: [
      'LAST — stop injection, lipid emulsion protocol early',
      'High spinal — airway + vasopressors, warn and reassure',
      'Arrest here is a special circumstance — prolonged CPR is indicated',
    ],
  },
};
