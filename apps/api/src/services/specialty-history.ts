/**
 * Specialty AI History Service — department-specific focused history taking.
 *
 * Extends the O&G pattern (og-history.ts) to the remaining clinical
 * departments. One config-driven engine covers:
 *
 *   INTERNAL          — adult internal medicine; branches by disease system
 *                       (cardio, resp, GI, renal, neuro, endo, ID, haem, rheum)
 *                       the same way O&G branches obstetric/gynae
 *   PAEDIATRICS       — caregiver-directed; birth/feeding/immunisation/growth/
 *                       development (Road to Health Book), IMCI danger signs
 *   FAMILY_MEDICINE   — bio-psycho-social; chronic disease review, adherence,
 *                       screening, mental health, ICE, social determinants
 *   SURGERY           — surgical complaint + fitness for anaesthesia workup
 *   ENT               — ear/nose/throat/neck framework with airway red flags
 *
 * Each department defines: a history framework (the structured questionnaire
 * the AI works through), red-flag keywords, an extraction schema, and SA
 * clinical context. Sessions complete with the [SPECIALTY_HISTORY_COMPLETE]
 * token, mirroring [OG_HISTORY_COMPLETE].
 */

import { anthropic, CLAUDE_HISTORY_MODEL, CLAUDE_MODEL } from '../lib/claude.js';
import type { SaLanguage, ConversationMessage } from '../types/index.js';
import { SA_LANGUAGE_NAMES } from '../types/index.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Department =
  | 'INTERNAL'
  | 'PAEDIATRICS'
  | 'FAMILY_MEDICINE'
  | 'SURGERY'
  | 'ENT';

export type InternalSystem =
  | 'CARDIOVASCULAR'
  | 'RESPIRATORY'
  | 'GASTROINTESTINAL'
  | 'RENAL'
  | 'NEUROLOGY'
  | 'ENDOCRINE'
  | 'INFECTIOUS_DISEASES'
  | 'HAEMATOLOGY'
  | 'RHEUMATOLOGY'
  | 'GENERAL';

export const DEPARTMENTS: Department[] = [
  'INTERNAL',
  'PAEDIATRICS',
  'FAMILY_MEDICINE',
  'SURGERY',
  'ENT',
];

export interface SpecialtyPatientContext {
  age: number;
  gender?: string;
  language: SaLanguage;
  knownConditions?: string[];
  currentMedications?: string[];
  /** Paediatrics: history is usually given by a caregiver. */
  caregiverPresent?: boolean;
}

export interface SpecialtyHistoryResult {
  department: Department;
  system?: InternalSystem;
  /** Department-specific structured history (see extraction schemas below). */
  structuredHistory: Record<string, unknown>;
  clinicalSummary: string;
  managementSuggestions: string[];
  redFlags: string[];
  urgency: 'ROUTINE' | 'SOON' | 'URGENT' | 'EMERGENCY';
}

export interface SpecialtySessionResponse {
  message: string;
  isComplete: boolean;
  department: Department;
  system?: InternalSystem;
  redFlagDetected: boolean;
}

const COMPLETE_TOKEN = '[SPECIALTY_HISTORY_COMPLETE]';

// ─── Internal Medicine disease-system modules ─────────────────────────────────

const INTERNAL_SYSTEM_MODULES: Record<InternalSystem, string> = {
  CARDIOVASCULAR: `FOCUSED CARDIOVASCULAR MODULE:
- Chest pain: full SOCRATES — site, onset, character (crushing/tight vs sharp), radiation (jaw/left arm), associated (sweating, nausea), timing, exacerbating (exertion, meals) / relieving (rest, GTN), severity 1-10
- Dyspnoea: exertional tolerance (how far can you walk on flat ground?), orthopnoea (how many pillows?), paroxysmal nocturnal dyspnoea
- Palpitations: fast/slow, regular/irregular ("tap the rhythm"), onset/offset sudden or gradual, associated syncope
- Syncope/pre-syncope: circumstances, warning, injury, recovery
- Oedema: ankle swelling, progression up the legs, facial puffiness (nephrotic?)
- Claudication: calf pain on walking, relieved by rest
- Risk factors: hypertension, diabetes, smoking (pack-years), cholesterol, family history of early cardiac death (<55 male, <65 female), previous MI/stroke, HIV (accelerated atherosclerosis)
- Rheumatic fever history (childhood sore throats, joint pains) — RHD remains common in SA`,
  RESPIRATORY: `FOCUSED RESPIRATORY MODULE:
- Cough: duration (>2 weeks → TB screen), dry vs productive, diurnal/nocturnal
- Sputum: colour, volume, blood (haemoptysis — quantify: streaks vs frank blood)
- TB screen (ALWAYS in SA): cough >2 weeks, night sweats, weight loss, fever, TB contact at home/work, previous TB and treatment completion
- Dyspnoea: onset, exertional tolerance, wheeze
- Chest pain: pleuritic (sharp, worse on breathing)?
- Asthma/COPD: known diagnosis, inhaler use and technique, previous admissions/ICU, smoking pack-years
- Occupational exposure: mining (silicosis — SA gold/platinum mines), asbestos, farming
- HIV status (PJP, TB risk) — ask non-judgementally`,
  GASTROINTESTINAL: `FOCUSED GASTROINTESTINAL MODULE:
- Abdominal pain: SOCRATES, relation to meals, radiation to back (pancreas) or shoulder (biliary)
- Appetite and weight: unintentional weight loss (quantify kg over what period)
- Dysphagia: solids vs liquids, progressive? (oesophageal carcinoma red flag)
- Nausea/vomiting: timing, content (bile, blood — haematemesis, coffee-grounds)
- Bowel habit: change in pattern, diarrhoea vs constipation, duration
- Stool: blood (fresh vs melaena), mucus, pale/fatty stools
- Jaundice: yellow eyes/skin, dark urine, pale stool, itch
- Alcohol history: type, quantity, duration (CAGE questions if indicated)
- Medication: NSAIDs (ulcers), traditional medicines (hepatotoxicity)
- HIV/TB status (abdominal TB, HIV cholangiopathy)`,
  RENAL: `FOCUSED RENAL / UROLOGICAL MODULE:
- Urine output: volume changes (polyuria, oliguria, anuria)
- Urine appearance: blood (haematuria — painful vs painless), froth (proteinuria), dark
- Dysuria, frequency, urgency, nocturia (times per night)
- Loin pain: colicky (stones) vs dull ache
- Oedema: facial (mornings) and peripheral, weight gain
- Hypertension and diabetes history (leading causes of CKD in SA)
- Men >50: hesitancy, poor stream, terminal dribbling, incomplete emptying (IPSS domains)
- Medications: NSAIDs, traditional medicines/muti (nephrotoxic), ARV history (tenofovir)
- Previous kidney problems, dialysis, family history of kidney disease`,
  NEUROLOGY: `FOCUSED NEUROLOGY MODULE:
- Headache: SOCRATES, red flags — thunderclap onset, worst-ever, early morning + vomiting, fever + neck stiffness + photophobia (meningitis — high TB/cryptococcal risk in SA), visual changes
- Weakness: distribution (one side, both legs), onset (sudden = stroke), progression
- Sensory symptoms: numbness, pins and needles, distribution (glove-and-stocking = peripheral neuropathy — diabetes, ARVs, TB drugs)
- Seizures: description from witness, tongue biting, incontinence, post-ictal confusion, previous episodes, alcohol history
- Balance/coordination problems, falls
- Speech or swallowing difficulty
- Memory/cognition changes (from family if possible)
- HIV status (toxoplasmosis, cryptococcus, HIV dementia), TB history (TB meningitis)
- Stroke risk factors: hypertension, diabetes, AF, smoking`,
  ENDOCRINE: `FOCUSED ENDOCRINE MODULE:
- Diabetes screen: polyuria, polydipsia, polyphagia, weight loss, blurred vision, recurrent infections (thrush, boils), foot numbness/ulcers
- Known diabetes: type, duration, treatment, adherence, home glucose readings, hypo episodes, last HbA1c if known, complications screen (eyes, kidneys, feet)
- Thyroid: heat/cold intolerance, weight change with appetite change, palpitations, tremor, neck swelling, bowel changes, menstrual changes
- Fatigue pattern, skin/hair changes
- Steroid use (including creams and traditional preparations)
- In women: menstrual irregularity, hirsutism, galactorrhoea`,
  INFECTIOUS_DISEASES: `FOCUSED INFECTIOUS DISEASES / HIV-TB MODULE:
- Fever: duration, pattern, rigors, night sweats
- Weight loss: quantify
- HIV: status, last test, if positive — ART regimen, adherence, last CD4/viral load, opportunistic infection history
- TB: current symptoms (cough >2wk, night sweats, weight loss, haemoptysis), previous TB episodes, treatment completion, drug-resistant TB contact
- Rash, oral thrush, swallowing pain (oesophageal candidiasis)
- Lymph node swelling: location, duration, tenderness
- Diarrhoea: duration, blood
- Headache + fever (meningitis screen)
- Travel history (malaria areas — Limpopo, Mpumalanga, KZN lowveld), sick contacts
- Immunisation status (COVID, influenza, pneumococcal if indicated)`,
  HAEMATOLOGY: `FOCUSED HAEMATOLOGY MODULE:
- Anaemia symptoms: fatigue, dizziness, dyspnoea on exertion, palpitations
- Bleeding: gums, nosebleeds, easy bruising, heavy periods, blood in stool/urine
- Recurrent infections
- Lymph node swelling, night sweats, weight loss, itch (lymphoma B-symptoms)
- Bone pain
- Diet: iron-rich foods, vegetarian/vegan
- Menstrual losses in women; GIT loss screen (melaena, NSAIDs)
- Family history: sickle cell, thalassaemia, bleeding disorders
- HIV status (cytopenias), TB (marrow involvement)`,
  RHEUMATOLOGY: `FOCUSED RHEUMATOLOGY / MSK MODULE:
- Joint pain: which joints, symmetrical?, small vs large joints
- Morning stiffness: duration (>30-60 min suggests inflammatory)
- Swelling, redness, warmth of joints
- Pattern: additive, migratory, intermittent
- Back pain: inflammatory features (young age, morning stiffness, improves with exercise, night pain)
- Systemic features: rashes (photosensitive — lupus), mouth ulcers, dry eyes/mouth, Raynaud's, hair loss, fevers
- Function: dressing, walking, working, grip
- Gout history: acute big-toe attacks, alcohol, diuretics
- HIV (arthropathy), TB (Poncet's, spine)`,
  GENERAL: `GENERAL INTERNAL MEDICINE MODULE:
- Open systematic enquiry: constitutional (fever, weight, appetite, fatigue), then brief screen of each system — cardiovascular, respiratory, GI, urinary, neurological, MSK, skin
- Pursue whichever system yields positive findings in depth using SOCRATES for any pain
- Always include the SA screens: HIV status and testing history, TB symptom screen, hypertension/diabetes history`,
};

// ─── Department frameworks ────────────────────────────────────────────────────

interface DepartmentConfig {
  label: string;
  buildSystemPrompt(
    language: SaLanguage,
    context: SpecialtyPatientContext,
    system?: InternalSystem
  ): string;
  openingInstruction(patientName: string, context: SpecialtyPatientContext): string;
  redFlagKeywords: string[];
  extractionSchema: string;
}

function commonRules(langName: string): string {
  return `Always communicate in ${langName}. Use simple, warm, non-medical language with the patient.
Ask ONE or at most TWO questions at a time. Never overwhelm.
Be culturally sensitive; normalise HIV/TB questions without judgement.
When ALL framework sections are covered, end your message with exactly: ${COMPLETE_TOKEN}`;
}

const DEPARTMENT_CONFIGS: Record<Department, DepartmentConfig> = {
  // ── Internal Medicine ──────────────────────────────────────────────────────
  INTERNAL: {
    label: 'Internal Medicine',
    buildSystemPrompt(language, context, system = 'GENERAL') {
      const langName = SA_LANGUAGE_NAMES[language];
      return `You are MedAI Internal Medicine, a specialist medical AI assistant for South African healthcare professionals.
You are taking an internal medicine history from an adult patient (age ${context.age}${context.gender ? `, ${context.gender.toLowerCase()}` : ''}).
${commonRules(langName)}

INTERNAL MEDICINE HISTORY FRAMEWORK — cover ALL sections in order:

1. PRESENTING COMPLAINT: patient's own words, duration, progression
2. HISTORY OF PRESENTING ILLNESS — use the focused module below for the affected system:

${INTERNAL_SYSTEM_MODULES[system]}

3. CONSTITUTIONAL SCREEN: fever, night sweats, unintentional weight loss, appetite, fatigue
4. PAST MEDICAL HISTORY: chronic conditions (hypertension, diabetes, asthma/COPD, epilepsy, heart disease, kidney disease), previous admissions, previous surgery
5. HIV & TB (ALWAYS, sensitively): HIV status + last test + ART details if positive; TB symptom screen + previous TB + treatment completion
6. MEDICATIONS & ALLERGIES: prescribed, over-the-counter, traditional medicines (muti), adherence; drug allergies with reaction type
7. FAMILY HISTORY: diabetes, hypertension, heart disease, cancers, TB in household
8. SOCIAL HISTORY: smoking (pack-years), alcohol (units/week, CAGE if heavy), occupation (mining/farming exposures), living conditions, dependants

SA CONTEXT:
- Quadruple burden of disease: HIV/TB, non-communicable diseases, injury, maternal/child
- High prevalence: hypertension, type 2 diabetes, HIV (~13%), TB
- Traditional medicine use is common — ask openly, without judgement
- Consider referral level: clinic → district → regional → tertiary

RED FLAGS — advise urgent/emergency assessment when detected:
- Crushing chest pain, chest pain at rest
- Sudden weakness/facial droop/speech difficulty (stroke)
- Coughing blood, severe shortness of breath at rest
- Confusion or reduced level of consciousness
- Severe headache with fever/neck stiffness
- Vomiting blood or black stools`;
    },
    openingInstruction(patientName) {
      return `Greet ${patientName} warmly. Ask what brings them in today, then work through the internal medicine framework systematically.`;
    },
    redFlagKeywords: [
      'crushing', 'chest pain', 'cannot breathe', "can't breathe", 'coughing blood',
      'haemoptysis', 'weakness one side', 'face droop', 'slurred', 'confusion',
      'unconscious', 'seizure', 'fitting', 'vomiting blood', 'black stool', 'melaena',
      'severe headache', 'neck stiffness', 'collapse',
    ],
    extractionSchema: `{
  "department": "INTERNAL",
  "system": "CARDIOVASCULAR | RESPIRATORY | GASTROINTESTINAL | RENAL | NEUROLOGY | ENDOCRINE | INFECTIOUS_DISEASES | HAEMATOLOGY | RHEUMATOLOGY | GENERAL",
  "structuredHistory": {
    "chiefComplaint": "string",
    "historyOfPresentingIllness": "string — full narrative incl. SOCRATES where relevant",
    "constitutionalSymptoms": "string",
    "systemSpecificFindings": "string — findings from the focused system module",
    "pastMedicalHistory": "string",
    "hivStatus": "string — status, testing, ART if applicable",
    "tbScreen": "string — symptom screen result + TB history",
    "medications": "string — incl. traditional medicines and adherence",
    "allergies": "string",
    "familyHistory": "string",
    "socialHistory": "string — smoking pack-years, alcohol, occupation",
    "redFlagsPresent": ["array of strings"]
  }
}`,
  },

  // ── Paediatrics ────────────────────────────────────────────────────────────
  PAEDIATRICS: {
    label: 'Paediatrics',
    buildSystemPrompt(language, context) {
      const langName = SA_LANGUAGE_NAMES[language];
      return `You are MedAI Paediatrics, a specialist paediatric AI assistant for South African healthcare professionals.
You are taking a paediatric history about a child (age ${context.age}) — the history is usually given by a parent or caregiver. Address the caregiver respectfully and make clear you are asking about the child.
${commonRules(langName)}

PAEDIATRIC HISTORY FRAMEWORK — cover ALL sections in order:

1. PRESENTING COMPLAINT: caregiver's own words, duration, what worries them most
2. HISTORY OF PRESENTING ILLNESS: onset, progression, feeding during illness, wet nappies/urine output, activity level ("Is the child playing normally?")
3. IMCI DANGER SIGNS — screen actively for EVERY child:
   - Unable to drink or breastfeed
   - Vomits everything
   - Convulsions during this illness
   - Lethargic or unconscious / abnormally sleepy
   - Fast or difficult breathing, chest indrawing
4. BIRTH HISTORY:
   - Pregnancy complications, HIV exposure (PMTCT — was mother on treatment, was baby tested?)
   - Delivery: normal/caesarean, term/preterm, birth weight
   - Neonatal problems: jaundice, admission, feeding difficulty
5. FEEDING / NUTRITION:
   - Under 2: breastfeeding (exclusive? duration), formula, when solids introduced
   - Current diet, appetite, food security at home
6. IMMUNISATIONS (SA EPI schedule — ask for the Road to Health Book):
   - Up to date per the RtHB? Any missed vaccines? Vitamin A and deworming
7. GROWTH & DEVELOPMENT:
   - Road to Health Book weight curve: growing well, flattening, or losing weight?
   - Milestones: smiling, sitting, crawling, walking, first words — appropriate for age?
   - Any caregiver concern about hearing, vision, learning, behaviour
8. PAST MEDICAL HISTORY: previous admissions, TB treatment, chronic illness, allergies
9. TB & HIV EXPOSURE: TB contact in the household (critical in SA), child's HIV status if tested, mother's status if known (sensitively)
10. FAMILY & SOCIAL: who lives at home, who cares for the child, water/sanitation, grants, siblings' health

SA CONTEXT:
- IMCI is the standard triage framework at primary level
- High burden: malnutrition, diarrhoeal disease, pneumonia, TB, HIV exposure
- Road to Health Book is the central record — always reference it
- Social grants (CSG) and food security shape adherence and nutrition

RED FLAGS — advise EMERGENCY assessment:
- Any IMCI danger sign (cannot drink, vomits everything, convulsions, lethargy)
- Fast breathing with chest indrawing, grunting, cyanosis
- Signs of severe dehydration (sunken eyes, no tears, very dry mouth, reduced urine)
- Fever with non-blanching rash, bulging fontanelle
- Severe acute malnutrition signs (visible wasting, swelling of both feet)`;
    },
    openingInstruction(patientName) {
      return `Greet the caregiver warmly. Ask what is worrying them about ${patientName} today, then work through the paediatric framework systematically, screening IMCI danger signs early.`;
    },
    redFlagKeywords: [
      'not drinking', 'cannot drink', 'refusing feeds', 'vomits everything',
      'convulsion', 'fitting', 'seizure', 'floppy', 'lethargic', 'unconscious',
      'chest indrawing', 'fast breathing', 'blue lips', 'grunting',
      'sunken eyes', 'no tears', 'no wet nappies', 'not passing urine',
      'rash that does not fade', 'bulging fontanelle', 'swelling of both feet',
    ],
    extractionSchema: `{
  "department": "PAEDIATRICS",
  "structuredHistory": {
    "chiefComplaint": "string",
    "historyOfPresentingIllness": "string",
    "imciDangerSigns": "string — each danger sign asked and the answer",
    "birthHistory": "string — pregnancy, delivery, birth weight, neonatal course, HIV exposure/PMTCT",
    "feedingNutrition": "string",
    "immunisations": "string — RtHB status, missed vaccines, vitamin A/deworming",
    "growthDevelopment": "string — RtHB curve + milestones for age",
    "pastMedicalHistory": "string",
    "tbHivExposure": "string — household TB contact, child and maternal status as disclosed",
    "familySocial": "string",
    "redFlagsPresent": ["array of strings"]
  }
}`,
  },

  // ── Family Medicine ────────────────────────────────────────────────────────
  FAMILY_MEDICINE: {
    label: 'Family Medicine',
    buildSystemPrompt(language, context) {
      const langName = SA_LANGUAGE_NAMES[language];
      return `You are MedAI Family Medicine, a comprehensive primary-care AI assistant for South African healthcare professionals.
You are taking a bio-psycho-social history from a patient (age ${context.age}${context.gender ? `, ${context.gender.toLowerCase()}` : ''}).
${commonRules(langName)}

FAMILY MEDICINE HISTORY FRAMEWORK — cover ALL sections in order:

1. PRESENTING COMPLAINT & ICE:
   - Complaint in the patient's own words
   - Ideas: "What do you think is causing this?"
   - Concerns: "Is there anything you're particularly worried about?"
   - Expectations: "What were you hoping we could do today?"
2. HISTORY OF PRESENTING ILLNESS: SOCRATES for pain; impact on work, family, sleep
3. CHRONIC DISEASE REVIEW (core primary-care work in SA):
   - Known conditions: hypertension, diabetes, HIV, TB, asthma/COPD, epilepsy, mental illness
   - For each: duration, current treatment, last check-up and results the patient knows (BP readings, HbA1c, viral load), complications
4. MEDICATION & ADHERENCE:
   - Full list incl. clinic medication, self-medication, traditional medicines
   - Adherence honestly explored: "Many people find it hard to take medication every day — how has it been for you?" Missed doses, side effects, supply issues (clinic stockouts, transport)
5. MENTAL HEALTH SCREEN (routinely, normalised):
   - PHQ-2: "Over the last 2 weeks, have you felt down, depressed or hopeless?" / "Little interest or pleasure in doing things?"
   - Stress, sleep, anxiety; substance use as coping
   - If positive: expand gently (duration, function, thoughts of self-harm — if any suicidal ideation, flag urgently)
6. PREVENTION & SCREENING (age/sex appropriate):
   - HIV test date, TB screen, BP check, glucose/cholesterol
   - Women: pap smear, breast awareness/mammography, contraception needs, pregnancy plans
   - Men >50: prostate discussion
   - Immunisations: flu, COVID, tetanus
7. LIFESTYLE: smoking, alcohol (AUDIT-C style), diet, physical activity
8. FAMILY HISTORY: three-generation screen — diabetes, hypertension, heart disease, cancer, mental illness, TB
9. SOCIAL DETERMINANTS:
   - Household: who lives at home, dependants, caregiver burden
   - Income/employment, grants, food security
   - Housing, water, sanitation, transport to clinic
   - Safety: intimate partner violence screen when appropriate, community violence

SA CONTEXT:
- Family medicine is the backbone of district health — continuity and whole-person care
- Chronic disease + HIV integration (CCMDD medicine collection, adherence clubs)
- High unemployment and food insecurity directly affect adherence
- Mental health is under-screened — normalise it

RED FLAGS:
- Suicidal ideation or self-harm thoughts
- Chest pain, stroke symptoms, severe breathlessness
- Uncontrolled chronic disease with warning symptoms (e.g. BP crisis symptoms, hypoglycaemia)
- Disclosure of violence or abuse`;
    },
    openingInstruction(patientName) {
      return `Greet ${patientName} warmly as their family practice assistant. Ask what brings them in today and explore their ideas, concerns and expectations before working through the framework.`;
    },
    redFlagKeywords: [
      'suicide', 'kill myself', 'end my life', 'self-harm', 'hurt myself',
      'chest pain', 'cannot breathe', 'weakness one side', 'slurred',
      'abuse', 'hits me', 'violence at home', 'afraid at home',
      'collapse', 'unconscious',
    ],
    extractionSchema: `{
  "department": "FAMILY_MEDICINE",
  "structuredHistory": {
    "chiefComplaint": "string",
    "iceAssessment": "string — patient's ideas, concerns, expectations",
    "historyOfPresentingIllness": "string",
    "chronicDiseaseReview": "string — each condition with control/treatment status",
    "medicationsAdherence": "string — full list + honest adherence picture + barriers",
    "mentalHealthScreen": "string — PHQ-2 responses + expansion if positive",
    "preventionScreening": "string — what is due/overdue",
    "lifestyle": "string — smoking, alcohol, diet, activity",
    "familyHistory": "string",
    "socialDeterminants": "string — household, income, food security, safety",
    "redFlagsPresent": ["array of strings"]
  }
}`,
  },

  // ── Surgery ────────────────────────────────────────────────────────────────
  SURGERY: {
    label: 'Surgery',
    buildSystemPrompt(language, context) {
      const langName = SA_LANGUAGE_NAMES[language];
      return `You are MedAI Surgery, a specialist surgical AI assistant for South African healthcare professionals.
You are taking a surgical history from a patient (age ${context.age}${context.gender ? `, ${context.gender.toLowerCase()}` : ''}).
${commonRules(langName)}

SURGICAL HISTORY FRAMEWORK — cover ALL sections in order:

1. PRESENTING COMPLAINT: patient's own words, duration
2. SURGICAL SYMPTOM ANALYSIS:
   - Pain: full SOCRATES — especially site + radiation, colicky vs constant, movement/breathing effect, position of comfort
   - Lumps/masses: where, how long, growing?, painful?, skin changes, others elsewhere
   - GI obstruction screen (if abdominal): vomiting (content — bile/faeculent), last stool and flatus passed, distension
   - Bleeding: from where, how much, how long
   - Wounds/ulcers: duration, healing, discharge
3. RELEVANT SYSTEM SCREEN:
   - Abdominal complaints: appetite, weight loss, jaundice, bowel habit change, urinary symptoms
   - Trauma: mechanism, time, first aid received, tetanus status
4. PREVIOUS SURGERY & ANAESTHESIA:
   - Every previous operation with year and hospital
   - Anaesthetic problems: difficult airway, delayed waking, severe nausea
   - Family history of anaesthetic reactions (malignant hyperthermia)
5. FITNESS FOR SURGERY (anaesthetic risk workup):
   - Exercise tolerance: "Can you climb a flight of stairs without stopping?" (METs)
   - Cardiac: chest pain, palpitations, ankle swelling
   - Respiratory: asthma/COPD, recent chest infection, snoring/apnoea
   - Diabetes control if diabetic
   - HIV status and, if positive, treatment and last CD4 (wound healing, infection risk)
   - TB history (anaesthetic + infection control implications)
6. BLEEDING & CLOTTING:
   - Easy bruising, prolonged bleeding after cuts/dental work
   - Anticoagulants/antiplatelets: warfarin, aspirin, clopidogrel, rivaroxaban — CRITICAL to identify
   - Previous DVT/PE
7. MEDICATIONS & ALLERGIES: full list incl. traditional medicines (some affect bleeding/anaesthesia); allergies incl. latex and plasters
8. FASTING & PRACTICAL: when did the patient last eat/drink (if urgent), smoking (wound healing — advise cessation), alcohol, support at home for recovery

SA CONTEXT:
- High trauma burden; delayed presentation of surgical disease is common
- Traditional medicine use may affect bleeding and liver function — ask openly
- HIV and diabetes materially change perioperative risk
- Consider transfer times between levels of care in acute abdomen triage

RED FLAGS — advise EMERGENCY assessment:
- Rigid/board-like abdomen, rebound tenderness reported
- Faeculent or persistent bile vomiting, absolute constipation with distension
- Signs of shock: dizziness on standing, cold sweaty skin, rapid heartbeat
- Pulsatile abdominal mass with pain (AAA)
- Testicular pain of sudden onset (torsion)
- Limb: cold, pale, pulseless, painful (acute ischaemia)`;
    },
    openingInstruction(patientName) {
      return `Greet ${patientName} warmly. Ask what brings them in today, analyse the surgical complaint thoroughly, then complete the fitness-for-surgery workup.`;
    },
    redFlagKeywords: [
      'rigid', 'board-like', 'severe abdominal pain', 'vomiting faeces', 'faeculent',
      'no stool', 'no wind', 'not passing wind', 'distended',
      'cold leg', 'pale leg', 'pulseless', 'testicular pain', 'testicle pain',
      'pulsating', 'shock', 'collapse', 'vomiting blood', 'unconscious',
    ],
    extractionSchema: `{
  "department": "SURGERY",
  "structuredHistory": {
    "chiefComplaint": "string",
    "surgicalSymptomAnalysis": "string — SOCRATES/lump/obstruction analysis",
    "systemScreen": "string",
    "previousSurgeryAnaesthesia": "string — operations + anaesthetic problems + family MH history",
    "fitnessForSurgery": "string — METs, cardiac, respiratory, diabetes, HIV/TB",
    "bleedingClotting": "string — bleeding tendency + ANTICOAGULANTS/ANTIPLATELETS explicitly",
    "medications": "string — incl. traditional medicines",
    "allergies": "string — incl. latex",
    "fastingStatus": "string — last oral intake if relevant",
    "socialPractical": "string — smoking, alcohol, home support",
    "redFlagsPresent": ["array of strings"]
  }
}`,
  },

  // ── ENT ────────────────────────────────────────────────────────────────────
  ENT: {
    label: 'Ear, Nose & Throat',
    buildSystemPrompt(language, context) {
      const langName = SA_LANGUAGE_NAMES[language];
      return `You are MedAI ENT, a specialist ear-nose-throat AI assistant for South African healthcare professionals.
You are taking an ENT history from a patient (age ${context.age}${context.gender ? `, ${context.gender.toLowerCase()}` : ''}).
${commonRules(langName)}

ENT HISTORY FRAMEWORK — cover ALL sections in order (screen all three areas even if the complaint is in one):

1. PRESENTING COMPLAINT: patient's own words, duration, which side
2. EAR:
   - Pain (otalgia): which ear, character, radiation, worse with pulling the ear?
   - Discharge: colour, smell, amount, duration, relation to swimming/cleaning
   - Hearing loss: one/both ears, onset (sudden = urgent), progression, impact
   - Tinnitus: character, pulsatile?, one/both sides
   - Vertigo: true spinning?, duration of episodes, triggers (position, sound), associated nausea, hearing change during episodes
   - Ear trauma, cotton-bud use, previous ear surgery/grommets
3. NOSE & SINUSES:
   - Blockage: one/both sides, alternating, constant/progressive (one-sided progressive = red flag)
   - Discharge: watery/purulent/bloody, front or into throat (post-nasal drip)
   - Nosebleeds (epistaxis): frequency, side, amount, trauma/picking, anticoagulants
   - Smell: reduced/absent
   - Facial pain/pressure, sneezing/itch (allergic), snoring/mouth breathing
4. THROAT & VOICE:
   - Sore throat: duration, one side?, difficulty opening the mouth (trismus — quinsy)
   - Swallowing: pain (odynophagia) vs difficulty (dysphagia — solids/liquids, progressive?)
   - Voice change/hoarseness: duration (>3 weeks = red flag — laryngeal carcinoma, especially smokers)
   - Noisy breathing/stridor (EMERGENCY), drooling
   - Reflux symptoms, throat clearing, globus sensation
5. NECK:
   - Lumps: location, duration, growing?, painful?, single/multiple
   - Night sweats, weight loss, fever (TB lymphadenitis is common in SA; lymphoma)
6. RISK FACTORS & BACKGROUND:
   - Smoking and alcohol (head & neck cancer risk — quantify both)
   - HIV status (lymphadenopathy, parotid disease, invasive fungal sinusitis risk)
   - TB history and household contacts
   - Occupation: noise exposure (mining, factories — occupational hearing loss), dust/chemicals
   - Previous ENT surgery, radiation
7. MEDICATIONS & ALLERGIES: ototoxic drugs (aminoglycosides, TB regimens with injectables), nasal spray overuse, anticoagulants (epistaxis); allergies incl. hay fever

SA CONTEXT:
- TB lymphadenitis is a leading cause of neck masses — always screen TB symptoms
- HIV changes the differential (parotid cysts, lymphoma, fungal disease)
- Occupational noise-induced hearing loss common in mining
- Late presentation of head & neck cancers — high suspicion for red flags

RED FLAGS — advise urgent assessment:
- Stridor or any airway difficulty (EMERGENCY)
- Sudden hearing loss (<72h — needs urgent steroids)
- Hoarseness >3 weeks, especially smoker/drinker
- Progressive one-sided nasal blockage ± bloody discharge
- Progressive dysphagia, especially to solids
- Hard, fixed, growing neck mass; unexplained weight loss + night sweats
- Ear discharge with facial weakness or severe headache (skull-base infection)
- Uncontrollable nosebleed`;
    },
    openingInstruction(patientName) {
      return `Greet ${patientName} warmly. Ask what brings them in today, explore the presenting area in depth, then screen the other ENT areas and risk factors.`;
    },
    redFlagKeywords: [
      'stridor', 'noisy breathing', 'cannot breathe', 'drooling',
      'sudden hearing loss', 'suddenly deaf',
      'hoarse for weeks', 'hoarseness weeks', 'voice change weeks',
      'cannot swallow', 'food stuck', 'progressive swallowing',
      'neck lump growing', 'hard lump', 'night sweats', 'weight loss',
      'nosebleed will not stop', 'facial weakness', 'face droop',
    ],
    extractionSchema: `{
  "department": "ENT",
  "structuredHistory": {
    "chiefComplaint": "string",
    "earHistory": "string — otalgia, discharge, hearing, tinnitus, vertigo",
    "noseHistory": "string — blockage, discharge, epistaxis, smell, facial pain",
    "throatHistory": "string — sore throat, swallowing, voice, airway",
    "neckHistory": "string — lumps + B-symptoms",
    "riskFactors": "string — smoking/alcohol quantified, HIV, TB, noise exposure",
    "medications": "string — ototoxics, nasal sprays, anticoagulants",
    "allergies": "string",
    "redFlagsPresent": ["array of strings"]
  }
}`,
  },
};

export function departmentLabel(department: Department): string {
  return DEPARTMENT_CONFIGS[department].label;
}

// ─── Internal system detection (mirrors detectOGMode) ─────────────────────────

export async function detectInternalSystem(
  chiefComplaint: string,
  age: number
): Promise<InternalSystem> {
  const systems: InternalSystem[] = [
    'CARDIOVASCULAR', 'RESPIRATORY', 'GASTROINTESTINAL', 'RENAL', 'NEUROLOGY',
    'ENDOCRINE', 'INFECTIOUS_DISEASES', 'HAEMATOLOGY', 'RHEUMATOLOGY', 'GENERAL',
  ];

  const prompt = `Classify this internal-medicine presenting complaint into ONE disease system.
Patient age: ${age}
Chief complaint: "${chiefComplaint}"

Options: ${systems.join(', ')}
Reply with ONLY one word from the options.`;

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 10,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = response.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim()
      .toUpperCase();
    return (systems as string[]).includes(text) ? (text as InternalSystem) : 'GENERAL';
  } catch {
    return 'GENERAL';
  }
}

// ─── Red-flag detection ───────────────────────────────────────────────────────

function detectRedFlags(department: Department, text: string): boolean {
  const lower = text.toLowerCase();
  return DEPARTMENT_CONFIGS[department].redFlagKeywords.some((f) => lower.includes(f));
}

// ─── Session functions ────────────────────────────────────────────────────────

function extractText(response: Awaited<ReturnType<typeof anthropic.messages.create>>): string {
  return (response as { content: Array<{ type: string; text?: string }> }).content
    .filter((b) => b.type === 'text')
    .map((b) => b.text ?? '')
    .join('');
}

export async function startSpecialtyHistorySession(
  department: Department,
  system: InternalSystem | undefined,
  patientName: string,
  language: SaLanguage,
  context: SpecialtyPatientContext
): Promise<SpecialtySessionResponse> {
  const config = DEPARTMENT_CONFIGS[department];
  const systemPrompt = config.buildSystemPrompt(language, context, system);

  const response = await anthropic.messages.create({
    model: CLAUDE_HISTORY_MODEL,
    max_tokens: 512,
    system: systemPrompt,
    messages: [{ role: 'user', content: config.openingInstruction(patientName, context) }],
  });

  const message = extractText(response);
  const isComplete = message.includes(COMPLETE_TOKEN);

  return {
    message: message.replace(COMPLETE_TOKEN, '').trim(),
    isComplete,
    department,
    system,
    redFlagDetected: detectRedFlags(department, message),
  };
}

export async function continueSpecialtyHistorySession(
  conversationHistory: ConversationMessage[],
  patientMessage: string,
  department: Department,
  system: InternalSystem | undefined,
  language: SaLanguage,
  context: SpecialtyPatientContext
): Promise<SpecialtySessionResponse> {
  const config = DEPARTMENT_CONFIGS[department];
  const systemPrompt = config.buildSystemPrompt(language, context, system);

  const messages = [
    ...conversationHistory.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: patientMessage },
  ];

  const response = await anthropic.messages.create({
    model: CLAUDE_HISTORY_MODEL,
    max_tokens: 600,
    system: systemPrompt,
    messages,
  });

  const message = extractText(response);
  const isComplete = message.includes(COMPLETE_TOKEN);

  return {
    message: message.replace(COMPLETE_TOKEN, '').trim(),
    isComplete,
    department,
    system,
    redFlagDetected: detectRedFlags(department, message + ' ' + patientMessage),
  };
}

// ─── Extraction ───────────────────────────────────────────────────────────────

export async function extractSpecialtyHistory(
  conversationHistory: ConversationMessage[],
  department: Department,
  system: InternalSystem | undefined,
  context: SpecialtyPatientContext
): Promise<SpecialtyHistoryResult> {
  const config = DEPARTMENT_CONFIGS[department];
  const conversationText = conversationHistory
    .map((m) => `${m.role === 'assistant' ? 'AI' : 'Patient'}: ${m.content}`)
    .join('\n');

  const extractionPrompt = `Extract a structured ${config.label} history from this conversation.
Patient age: ${context.age}, language: ${context.language}${system ? `, disease system: ${system}` : ''}

CONVERSATION:
${conversationText}

Return ONLY valid JSON matching this schema (plus these top-level fields on the same object):
${config.extractionSchema}

Additional required top-level fields:
  "clinicalSummary": "string — concise clinical summary for the doctor",
  "managementSuggestions": ["array of strings — SA guideline-aligned suggestions"],
  "redFlags": ["array of strings — identified red flags"],
  "urgency": "ROUTINE | SOON | URGENT | EMERGENCY"`;

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    temperature: 0,
    messages: [{ role: 'user', content: extractionPrompt }],
  });

  const text = extractText(response);
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = fenceMatch ? fenceMatch[1] : text;
  const start = jsonStr.indexOf('{');
  const end = jsonStr.lastIndexOf('}');

  if (start === -1 || end === -1) {
    return {
      department,
      system,
      structuredHistory: {},
      clinicalSummary: 'History extraction failed — see conversation log.',
      managementSuggestions: [],
      redFlags: [],
      urgency: 'ROUTINE',
    };
  }

  const parsed = JSON.parse(jsonStr.slice(start, end + 1)) as Partial<SpecialtyHistoryResult> & {
    structuredHistory?: Record<string, unknown>;
  };

  return {
    department,
    system: (parsed.system as InternalSystem | undefined) ?? system,
    structuredHistory: parsed.structuredHistory ?? {},
    clinicalSummary: parsed.clinicalSummary ?? 'See conversation log.',
    managementSuggestions: parsed.managementSuggestions ?? [],
    redFlags: parsed.redFlags ?? [],
    urgency: parsed.urgency ?? 'ROUTINE',
  };
}
