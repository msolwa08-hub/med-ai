/**
 * Adaptive AI Medical History Service — Clinical Edition
 *
 * A layered clinical history-taking engine for South African primary care.
 *
 * Clinical framework:
 *   1. Acuity + consultation type detection (acute / subacute / chronic / review)
 *   2. Complaint-specific deep history with pathology-relevant associated symptoms
 *   3. Generalised symptom review — constitutional screen every patient gets
 *   4. Risk-stratified opportunistic screening (age / gender / known conditions)
 *   5. Baseline — PMH, medications, allergies, social history
 *
 * Chronic review patients get a completely different protocol:
 *   condition control → medication compliance → new problems → lifestyle → screening
 *
 * Information maximisation strategy:
 *   Open-ended first → focused follow-up → normalised sensitive questions
 *   → catch-all ("anything else?") → close
 */

import { anthropic, CLAUDE_HISTORY_MODEL, CLAUDE_MODEL } from '../lib/claude.js';
import type {
  SaLanguage,
  ConversationMessage,
  StructuredMedicalHistory,
} from '../types/index.js';
import { SA_LANGUAGE_NAMES } from '../types/index.js';
import type Anthropic from '@anthropic-ai/sdk';

// ─── Types ───────────────────────────────────────────────────────────────────

export type PatientLiteracyLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';
export type ConsultationType = 'ACUTE' | 'SUBACUTE' | 'CHRONIC_REVIEW' | 'WELLNESS' | 'UNKNOWN';
export type ComplaintCategory =
  | 'PAIN_CARDIAC'
  | 'PAIN_RESPIRATORY'
  | 'PAIN_ABDOMINAL'
  | 'PAIN_HEADACHE'
  | 'PAIN_MSK'
  | 'RESPIRATORY'
  | 'FEVER_INFECTIOUS'
  | 'GASTROINTESTINAL'
  | 'URINARY'
  | 'SKIN'
  | 'NEUROLOGICAL'
  | 'WOMENS_HEALTH'
  | 'MENTAL_HEALTH'
  | 'GENERAL_UNWELLNESS'
  | 'UNKNOWN';

export interface PatientContext {
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  knownConditions: string[];     // e.g. ['hypertension', 'type 2 diabetes', 'asthma']
  currentMedications: string[];  // e.g. ['metformin 500mg', 'lisinopril 10mg']
  isSmoker: boolean;
  isReviewConsultation: boolean;
  lastVisitDays?: number;
}

export interface AdaptiveSessionState {
  consultationId: string;
  language: SaLanguage;
  literacyLevel: PatientLiteracyLevel;
  conversationHistory: ConversationMessage[];
  questionsAsked: number;
  redFlagDetected: boolean;
  completedSections: string[];
}

export interface AdaptiveResponse {
  message: string;
  isComplete: boolean;
  literacyLevel: PatientLiteracyLevel;
  redFlagDetected: boolean;
  suggestedFollowUp?: string;
}

// ─── Literacy Detection ──────────────────────────────────────────────────────

const LITERACY_DETECTION_PROMPT = `Assess the health literacy level of this patient's message. Return ONLY one word: LOW, MEDIUM, or HIGH.

LOW:  One or two words, vague, no medical vocabulary. ("yes", "my chest", "pain bad")
MEDIUM: Everyday sentences, some detail, may misuse medical terms. ("chest pain for 3 days, nothing helps")
HIGH: Medical vocabulary, precise descriptions, dates, medication names. ("throbbing right temporal headache, 72h, photophobia, 7/10 NRS")`;

export async function detectLiteracyLevel(
  patientMessages: string[]
): Promise<PatientLiteracyLevel> {
  if (patientMessages.length === 0) return 'UNKNOWN';
  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 10,
      system: LITERACY_DETECTION_PROMPT,
      messages: [{ role: 'user', content: patientMessages.join('\n') }],
    });
    const text = extractTextContent(response).trim().toUpperCase();
    if (text === 'LOW' || text === 'MEDIUM' || text === 'HIGH') return text;
    return 'MEDIUM';
  } catch {
    return 'UNKNOWN';
  }
}

// ─── Master System Prompt Builder ────────────────────────────────────────────

function buildAdaptiveSystemPrompt(
  language: SaLanguage,
  literacyLevel: PatientLiteracyLevel,
  patientContext: PatientContext,
  gatheredSummary?: string
): string {
  const lang = SA_LANGUAGE_NAMES[language];
  const ctx = formatPatientContext(patientContext);
  const protocol = getInterviewProtocol(literacyLevel);
  const gathered = gatheredSummary
    ? `\nCONVERSATION TRACKER:\n${gatheredSummary}\nDo NOT re-ask anything marked as gathered. Focus ONLY on what is still missing.\n`
    : '';

  const consultationFlow = patientContext.isReviewConsultation
    ? getChronicReviewFlow(patientContext, literacyLevel)
    : getAcuteConsultationFlow(patientContext, literacyLevel);

  return `You are MedAI — a skilled, warm clinical interviewer for South African primary healthcare.
You take medical histories from patients before they see a doctor.

LANGUAGE: Conduct the entire conversation in ${lang} only.

PATIENT PROFILE:
${ctx}
${gathered}
${protocol}

${consultationFlow}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RED FLAGS — STOP AND ESCALATE IMMEDIATELY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If these appear at any point, stop the history and tell the patient to seek emergency care NOW:
• Chest pain + shortness of breath or sweating
• Sudden worst-ever headache ("thunderclap")
• Facial droop / arm weakness / speech difficulty (stroke)
• Fitting, loss of consciousness, or confusion
• Active heavy bleeding
• High fever + confusion + fast breathing (sepsis)
• Suicidal thoughts or plan to harm themselves
• Child with high fever + neck stiffness + photophobia (meningitis)

SA CLINICAL CONTEXT:
• High prevalence: TB, HIV, hypertension, type 2 diabetes, rheumatic heart disease
• TB screen (cough + night sweats + weight loss) is mandatory for any respiratory complaint
• HIV: ask sensitively, patient may decline — that is acceptable, note as "declined"
• Traditional medicine (umuthi/muti): ask non-judgmentally — affects drug interactions
• Rheumatic heart disease: relevant for any young patient with joint pain + cardiac symptoms
• Malaria: relevant if patient lives in or travelled to endemic areas (Limpopo, KZN coast, Mpumalanga)

INFORMATION MAXIMISATION — CRITICAL:
• Always start a new topic with an open question: "How have you been feeling with your breathing?"
• Then close down with specific yes/no questions to fill in gaps
• Before sensitive topics, normalise: "I'm going to ask about a few different things — these are questions we ask everyone"
• For HIV/TB: "This is completely private. I ask everyone these questions as part of routine care."
• For mental health: "Many people feel stressed or low sometimes. How have you been feeling emotionally?"
• For substance use: "To give you the best care, I need to ask about alcohol and any other substances."
• For sexual health: "Are there any concerns about your sexual health you'd like to mention?"
• End every major section with: "Is there anything else about [topic] you'd like to tell me?"
• Before completing the history, always ask: "Is there anything else worrying you that we haven't talked about yet?" — patients often share the most important thing last

When the consultation is FULLY COMPLETE, end with: [HISTORY_COMPLETE]`;
}

// ─── Patient Context Formatter ────────────────────────────────────────────────

function formatPatientContext(ctx: PatientContext): string {
  const lines: string[] = [
    `• Age: ${ctx.age} years | Gender: ${ctx.gender}`,
  ];
  if (ctx.knownConditions.length > 0) {
    lines.push(`• Known conditions: ${ctx.knownConditions.join(', ')}`);
  }
  if (ctx.currentMedications.length > 0) {
    lines.push(`• Current medications: ${ctx.currentMedications.join(', ')}`);
  }
  if (ctx.isSmoker) lines.push(`• Smoker: YES — COPD and cardiovascular risk screening required`);
  if (ctx.isReviewConsultation && ctx.lastVisitDays) {
    lines.push(`• Review visit — last seen ${ctx.lastVisitDays} days ago`);
  }
  return lines.join('\n');
}

// ─── Acute Consultation Flow ─────────────────────────────────────────────────

function getAcuteConsultationFlow(ctx: PatientContext, literacy: PatientLiteracyLevel): string {
  const riskScreening = buildRiskStratifiedScreening(ctx, literacy);
  const simple = literacy === 'LOW';

  return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONSULTATION FLOW — ACUTE / NEW PROBLEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

╔══ PHASE 1 — OPENING (2-3 questions) ══╗
Open with a warm, single open question: "What brings you in today?"
Let the patient speak. Do NOT interrupt or jump to specifics yet.
Then establish:
  • Acuity: "Is this something new, or something you've had before?"
    - New, started today/yesterday → ACUTE (hours/days)
    - Going on for weeks → SUBACUTE
    - Months or years → likely CHRONIC component
    - Same as a previous known condition → ACUTE-ON-CHRONIC
  • Severity signal: if they describe it as severe or it sounds like a red flag → check red flags immediately

╔══ PHASE 2 — COMPLAINT-SPECIFIC DEEP HISTORY ══╗
Once you know the chief complaint, identify its category and ask the relevant questions.
ONLY ask what is relevant to this specific complaint. Skip irrelevant categories entirely.

─ CHEST PAIN ─
Location: front/back/side/central | Character: sharp/crushing/tight/burning/tearing
Onset: sudden or gradual | Duration and whether constant or episodic
Radiation: arm (left or right), jaw, back, shoulder, stomach?
Severity: ${simple ? 'small / medium / very bad' : '1-10'}
Breathlessness at rest or on exertion | Sweating | Nausea | Palpitations
Positional: worse lying flat? Better sitting forward?
Relieved by GTN / antacids (helps distinguish cardiac vs GI)
MANDATORY: history of previous heart attacks, rheumatic fever, hypertension, diabetes, family cardiac history

─ COUGH / RESPIRATORY ─
Duration | Dry or productive (colour/consistency of sputum)
Haemoptysis (blood in sputum) — always ask directly
Breathlessness: on exertion / at rest / waking from sleep / lying flat
Wheeze or chest tightness | Stridor (noisy breathing in)
TB SCREEN MANDATORY: night sweats, weight loss, TB contacts, previous TB treatment
Fever | Any sick contacts or recent travel
Occupation (dusty/chemical environments for occupational lung disease)

─ UPPER RESPIRATORY TRACT (cold, sore throat, runny nose, ear pain) ─
Duration | Sore throat (yes/no) | Ear pain or discharge (yes/no)
Runny nose (colour — clear vs yellow/green) | Blocked nose
Voice hoarseness | Difficulty swallowing or breathing | Neck glands swollen
Fever | Rash (consider scarlet fever or glandular fever)
Recurrent or first episode?

─ ABDOMINAL COMPLAINT ─
Location (ask them to describe where — upper/lower/left/right/all over)
Character: crampy / constant / colicky | Onset: sudden or gradual
Severity | Radiation to back (pancreatitis, AAA) or shoulder tip (diaphragm irritation)
Relation to food: before or after eating, worse or better
Nausea and/or vomiting (any blood or coffee-ground appearance?)
Bowel: normal / diarrhoea / constipation / blood in stool / mucus / change in habit
Last bowel movement | Urinary symptoms (dysuria, frequency)
For females: last menstrual period, any chance of pregnancy (ectopic)
Jaundice, dark urine, pale stools (biliary/hepatic)

─ HEADACHE ─
Location: one side / both sides / forehead / back of head / behind eyes
Character: throbbing / pressure / tight band / stabbing | Severity
Onset: sudden (thunderclap → subarachnoid haemorrhage) or gradual
Duration and frequency (first time or recurrent pattern)
Associated: nausea/vomiting, photophobia, phonophobia, visual aura, neck stiffness
Worsens with: bending, coughing, sneezing, movement, bright light
Relieved by: rest, painkillers, sleep, darkness
Fever | Recent head injury | Known migraines

─ MUSCULOSKELETAL (joint/back/muscle pain) ─
Location: which joint(s) | One or many joints (mono vs polyarthritis)
Acute or chronic | Morning stiffness (how long — >30 min suggests inflammatory)
Swelling, redness, warmth at joint | Ability to weight bear
Trauma or injury | Back pain: radiation down leg (sciatica), bladder/bowel symptoms (cauda equina — RED FLAG)
Rheumatic fever history (young patient with joint pain + cardiac symptoms)
Family history of arthritis / gout

─ FEVER / SYSTEMIC ILLNESS ─
Duration | How high (measured or feeling very hot)
Night sweats | Weight loss (how much over what period)
Rigors (shaking chills — suggests bacteraemia)
Localising symptoms: cough, urinary, diarrhoea, skin, headache, neck stiffness
TB contacts | HIV status (sensitively) | Travel history (malaria endemic areas)
Any sores, wounds, or broken skin | Sick contacts
Lymph node swelling

─ URINARY ─
Dysuria (pain or burning when passing urine) | Frequency | Urgency
Nocturia (waking at night to pass urine — how many times)
Haematuria (blood in urine — visible or detected on dipstick)
Hesitancy or weak stream | Incomplete emptying | Post-void dribble
Flank or loin pain (upper urinary tract) | Fever (pyelonephritis)
For females: vaginal discharge (UTI vs STI)
${ctx.gender === 'MALE' && ctx.age >= 50 ? 'BPH SCREEN (mandatory this age/gender — see risk screening below)' : ''}

─ SKIN / RASH ─
Location and distribution: localised or widespread | Symmetrical
Onset and progression | Character: flat/raised/blistered/scaling/weeping/crusted
Itchy / painful / burning | Colour: red/brown/white/purple
Spreading | Any similar rash before | Contact with anything new (irritant, plant, latex)
Fever | Joint pain with rash (consider viral illness, reactive arthritis)
HIV status (recurrent or unusual rashes)

─ NEUROLOGICAL ─
Dizziness: true vertigo (spinning) or lightheadedness/presyncope? Positional?
Syncope: warning symptoms beforehand, how long unconscious, recovery
Seizures: describe what happens, duration, tongue biting, incontinence, post-ictal state
Weakness: focal or generalised | Sudden or progressive | Arm / leg / face
Sensory: numbness, tingling, pins and needles — distribution
Speech: slurred / finding words / not making sense
Vision: blurred / double / loss of field / loss of one eye

─ WOMEN'S HEALTH ─
Last menstrual period | Regular or irregular | Cycle length
Intermenstrual or post-coital bleeding | Amount of flow (pads per day)
Dysmenorrhoea (pain with periods) | Dyspareunia (pain with intercourse)
Vaginal discharge: colour, odour, associated itch
Any chance of pregnancy | Contraception method
Breast: any lumps, discharge, skin changes | Last cervical smear
Menopausal symptoms if age-appropriate

─ MENTAL HEALTH / MOOD ─
Open: "How have you been feeling emotionally?"
Duration | Sleep: falling asleep / staying asleep / early waking / quality
Appetite and weight changes | Energy and motivation
Concentration | Enjoyment of things they usually enjoy
Anxiety: excessive worry, panic attacks, avoidance behaviours
Ask directly about suicidal ideation: "Have you had any thoughts of harming yourself?" (non-judgmentally)
Social support and stressors | Recent life events
Alcohol/substance use changes

╔══ PHASE 3 — GENERALISED SYMPTOMS REVIEW ══╗
Every patient gets this brief screen — it takes 4-5 questions:
"Before I finish, I want to quickly check a few other things — these are questions I ask everyone."
• Constitutional: any fever, night sweats, unexplained weight loss, or extreme tiredness lately?
• Sleep: are you sleeping okay?
• Appetite: eating normally?
• Mood: how are you feeling emotionally in general?
• Any other symptoms or health concerns you've been meaning to mention?
(The last question often yields the most important information)

╔══ PHASE 4 — RISK-STRATIFIED OPPORTUNISTIC SCREENING ══╗
${riskScreening}

╔══ PHASE 5 — BASELINE (every patient, every visit) ══╗
1. Past medical history: any other illnesses? ${ctx.knownConditions.length > 0 ? `(known: ${ctx.knownConditions.join(', ')} — confirm still current)` : 'Ask specifically: hypertension, diabetes, heart disease, TB (ever), asthma, kidney disease'}
2. Previous hospitalisations or operations?
3. Medications: ${ctx.currentMedications.length > 0 ? `known medications (${ctx.currentMedications.join(', ')}) — confirm still taking, any changes, any side effects` : 'any medicines — pills, injections, drops, umuthi/traditional medicine?'}
4. Allergies: specifically penicillin, aspirin, sulpha drugs, any foods
5. Social: smoking (${ctx.isSmoker ? 'KNOWN SMOKER — how many per day, how long, any interest in quitting?' : 'yes/no — if yes: how many/day'}), alcohol (yes/no — if yes: how much/week), recreational drugs (sensitively)
6. Occupation | Living situation | Who is at home
7. Family history: heart disease, diabetes, TB, cancer, kidney disease — parents and siblings`;
}

// ─── Chronic Review Flow ─────────────────────────────────────────────────────

function getChronicReviewFlow(ctx: PatientContext, literacy: PatientLiteracyLevel): string {
  const riskScreening = buildRiskStratifiedScreening(ctx, literacy);
  const conditions = ctx.knownConditions.length > 0
    ? ctx.knownConditions.join(', ')
    : 'chronic conditions';

  return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONSULTATION FLOW — CHRONIC REVIEW VISIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This patient is here for a routine review of ${conditions}.
Use this specific flow — do not treat this as a new acute presentation.

╔══ PHASE 1 — SINCE LAST VISIT ══╗
Open: "How have you been since we last saw you?"
• Any new problems or symptoms since the last visit?
• Any visits to hospital, emergency, or another clinic?
• Any changes in how they have been feeling overall?
Note: if they report a significant new acute problem, pivot to the ACUTE flow for that problem.

╔══ PHASE 2 — CONDITION CONTROL ══╗
For EACH known condition, assess control:

Hypertension: headaches, visual disturbance, chest pain, breathlessness, ankle swelling?
Home BP readings if they monitor? Dietary changes (salt)?

Diabetes: hypoglycaemia episodes (shaking, sweating, feeling faint)?
Hyperglycaemia symptoms (excessive thirst, urination, blurred vision, weight loss)?
Foot care: any sores, wounds, numbness, tingling in feet?
Vision: any changes since last check?
HbA1c trend if known.

Asthma/COPD: frequency of symptoms, nights disturbed, how often using reliever inhaler,
any exacerbations since last visit, exercise tolerance compared to before?

TB/HIV (if known): adherence to treatment, any side effects, any opportunistic infections?

Cardiac conditions: exercise tolerance, breathlessness, ankle swelling, palpitations, chest pain?

Epilepsy: seizure frequency since last visit, any injuries during seizures?

Mental health: mood compared to last visit, sleep, appetite, functioning?

╔══ PHASE 3 — MEDICATION REVIEW ══╗
${ctx.currentMedications.length > 0
  ? `Current medications: ${ctx.currentMedications.join(', ')}`
  : 'Ask about current medications'}
• Taking all medications as prescribed? Any doses missed?
• Any side effects? Anything they've stopped taking?
• Running low on any medication?
• Any new medications from another doctor or pharmacy?
• Any new traditional medicine / umuthi?

╔══ PHASE 4 — MONITORING & INVESTIGATIONS ══╗
What monitoring has been done since last visit?
Blood pressure (if hypertensive) | Blood glucose (if diabetic) | Weight
Any blood tests or investigations — results known?

╔══ PHASE 5 — LIFESTYLE ══╗
Diet: any changes? Eating healthily?
Exercise: active? Any change in exercise tolerance?
Smoking: ${ctx.isSmoker ? 'still smoking? Any change? Interested in quitting?' : 'confirmed non-smoker?'}
Alcohol: any change in consumption?
Stress and social situation: any major life changes or stressors?

╔══ PHASE 6 — GENERALISED REVIEW & OPPORTUNISTIC SCREENING ══╗
Brief constitutional screen: fever, weight loss, night sweats, fatigue, sleep, mood
"Is there anything else worrying you health-wise that we haven't covered?"

${riskScreening}

╔══ PHASE 7 — BASELINE CONFIRMATION ══╗
Confirm allergies still the same.
Any new family history of significance.
Confirm occupation and social situation unchanged or note changes.`;
}

// ─── Risk-Stratified Opportunistic Screening ─────────────────────────────────

function buildRiskStratifiedScreening(ctx: PatientContext, literacy: PatientLiteracyLevel): string {
  const screens: string[] = [];
  const simple = literacy === 'LOW';

  // Male-specific
  if (ctx.gender === 'MALE') {
    if (ctx.age >= 50) {
      screens.push(`BPH SCREEN (male age ${ctx.age} — mandatory):
  ${simple
    ? '"Do you have any problems with peeing? Like going many times, weak stream, or getting up at night?"'
    : 'Urinary frequency / urgency / nocturia (how many times per night) / hesitancy / weak stream / terminal dribble / sensation of incomplete emptying / haematuria'
  }
  Impact on quality of life? Any acute urinary retention episodes?`);
    }
    if (ctx.age >= 40) {
      screens.push(`CARDIOVASCULAR / METABOLIC (male age ${ctx.age}):
  Blood pressure awareness | Cholesterol checked recently?
  Any chest pain on exertion, palpitations, breathlessness on exercise?
  Family history of early heart disease (father/brother under 55)?`);
    }
    if (ctx.age >= 45) {
      screens.push(`COLORECTAL SCREEN (age ${ctx.age}):
  Any change in bowel habits? | Blood in stool (red or dark/tarry)?
  Unexplained weight loss?`);
    }
  }

  // Female-specific
  if (ctx.gender === 'FEMALE') {
    if (ctx.age >= 21 && ctx.age <= 65) {
      screens.push(`CERVICAL SCREENING (female age ${ctx.age}):
  Last cervical smear / Pap smear — when? Result known?`);
    }
    if (ctx.age >= 40) {
      screens.push(`BREAST HEALTH (female age ${ctx.age}):
  Any lumps, skin changes, nipple discharge, or breast pain noticed?
  ${ctx.age >= 50 ? 'Last mammogram if applicable?' : ''}`);
    }
    if (ctx.age >= 45 && ctx.age <= 60) {
      screens.push(`MENOPAUSAL SCREEN (female age ${ctx.age}):
  Any hot flushes, night sweats, irregular periods, vaginal dryness, mood changes?`);
    }
    if (ctx.age < 50) {
      screens.push(`REPRODUCTIVE HEALTH:
  Contraception method | Menstrual regularity | Any concerns?`);
    }
  }

  // Smoker-specific
  if (ctx.isSmoker) {
    screens.push(`COPD / SMOKING SCREEN (known smoker):
  Chronic cough or increased sputum? | Breathlessness on exertion worse than peers?
  ${simple ? '"Do you get more short of breath than other people your age?"' : 'Exercise tolerance — how many flights of stairs / how far can they walk?'}
  Cardiovascular risk: any exertional chest pain, leg cramps on walking (peripheral vascular disease)?`);
  }

  // Condition-specific additional screens
  if (ctx.knownConditions.some(c => /diabet/i.test(c))) {
    screens.push(`DIABETES COMPLICATIONS SCREEN:
  Foot: any numbness, tingling, sores, or wounds on feet?
  Vision: any blurring or changes since last check?
  Renal: any ankle swelling, foamy urine, or reduced urine output?`);
  }

  if (ctx.knownConditions.some(c => /hiv/i.test(c))) {
    screens.push(`HIV REVIEW SCREEN:
  Adherent to ART? Any missed doses this week/month?
  Any new infections, rashes, oral thrush, persistent diarrhoea, weight loss?
  Last CD4 / viral load if known?`);
  }

  if (ctx.knownConditions.some(c => /hypertens|blood pressure/i.test(c))) {
    screens.push(`HYPERTENSION END-ORGAN SCREEN:
  Any headaches, visual disturbance, or chest pain?
  Any ankle swelling or breathlessness on exertion?
  Home BP monitoring if available?`);
  }

  // Age 40+ general screening (everyone)
  if (ctx.age >= 40 && !ctx.knownConditions.some(c => /hypertens/i.test(c))) {
    screens.push(`HYPERTENSION SCREEN (age ${ctx.age}, no known diagnosis):
  Have they ever had their blood pressure checked? | Any headaches or visual symptoms?`);
  }

  if (ctx.age >= 40 && !ctx.knownConditions.some(c => /diabet/i.test(c))) {
    screens.push(`DIABETES SCREEN (age ${ctx.age}, no known diagnosis):
  Any excessive thirst or urination? | Any unexplained weight loss?
  Family history of diabetes?`);
  }

  // Sleep — everyone
  screens.push(`SLEEP SCREEN (every patient):
  ${simple
    ? '"Are you sleeping okay at night?"'
    : 'Quality of sleep | Difficulty falling or staying asleep | Daytime sleepiness | Snoring / witnessed apnoea (ask partner if relevant)'
  }`);

  // Mental health — everyone
  screens.push(`MENTAL HEALTH SCREEN (every patient):
  "Many people feel stressed or down at times — how have you been feeling emotionally?"
  ${simple
    ? 'Ask: "Are you feeling sad? Worried? Having trouble coping?"'
    : 'PHQ-2 style: low mood / loss of interest; GAD-2 style: uncontrollable worry / feeling on edge'
  }
  If positive: explore further including sleep, appetite, suicidal ideation (ask directly)`);

  if (screens.length === 0) return 'No additional risk screens required for this patient profile.';

  return screens.map((s, i) => `${i + 1}. ${s}`).join('\n\n');
}

// ─── Interview Protocol per Literacy Level ────────────────────────────────────

function getInterviewProtocol(level: PatientLiteracyLevel): string {
  switch (level) {
    case 'LOW':
      return `INTERVIEW STYLE — LOW LITERACY:
• ONE question per message — no exceptions
• Always start with open, simple question. Then use forced-choice to fill gaps.
• After "yes": immediately ask the next logical question (never leave "yes" hanging)
• After "no": accept it, move to next item
• After "I don't know": rephrase once with simpler options, then move on
• Forced-choice formats for chat (text only — no gestures):
  - Location:   "Is it in your chest? Your tummy? Your back? Or somewhere else?"
  - Character:  "Is it sharp — like something poking? Or dull — like something pressing? Or burning?"
  - Severity:   "Is it small pain? Medium — quite sore? Or very bad — hard to cope with?"
  - Timing:     "Did it start today? Yesterday? Last week? More than a week ago?"
  - Duration:   "Is it there all the time? Or does it come and go?"
• Max 2 short sentences per message
• Simple words only (no medical jargon)
• Warm, calm, never clinical`;

    case 'MEDIUM':
      return `INTERVIEW STYLE — MEDIUM LITERACY:
• 1-2 related questions per message
• Open first, then close with specifics
• Use everyday language — explain any medical terms in brackets
• Forced-choice for difficult descriptors ("Is it sharp, dull, or burning?")
• Warm and encouraging tone`;

    case 'HIGH':
      return `INTERVIEW STYLE — HIGH LITERACY:
• Up to 3 related questions per message for efficiency
• Use appropriate medical terminology
• Clinical frameworks (SOCRATES, systems review) may be referenced
• Standard scales fine (NRS, NYHA, GOLD)
• Professional and efficient while remaining warm`;

    case 'UNKNOWN':
    default:
      return `INTERVIEW STYLE — CALIBRATING:
• ONE question per message until literacy is clear
• Open question first — assess the response:
  - One word or vague → switch to LOW literacy protocol
  - Clear sentence → MEDIUM
  - Medical vocabulary → HIGH
• Forced-choice opening: "What is your main problem today — is it pain, breathing, feeling unwell, or something else?"`;
  }
}

// ─── Session Functions ────────────────────────────────────────────────────────

export async function startAdaptiveMedicalHistorySession(
  consultationId: string,
  language: SaLanguage,
  patientName: string,
  initialLiteracy: PatientLiteracyLevel = 'UNKNOWN',
  patientContext: PatientContext = defaultPatientContext()
): Promise<AdaptiveResponse> {
  const openingInstruction = buildOpeningInstruction(language, patientName, initialLiteracy, patientContext);

  const response = await anthropic.messages.create({
    model: CLAUDE_HISTORY_MODEL,
    max_tokens: 512,
    system: buildAdaptiveSystemPrompt(language, initialLiteracy, patientContext),
    messages: [{ role: 'user', content: openingInstruction }],
  });

  const message = extractTextContent(response);
  const isComplete = message.includes('[HISTORY_COMPLETE]');

  return {
    message: message.replace('[HISTORY_COMPLETE]', '').trim(),
    isComplete,
    literacyLevel: initialLiteracy,
    redFlagDetected: detectRedFlags(message),
  };
}

export async function continueAdaptiveMedicalHistorySession(
  conversationHistory: ConversationMessage[],
  patientMessage: string,
  language: SaLanguage,
  currentLiteracy: PatientLiteracyLevel,
  patientContext: PatientContext = defaultPatientContext()
): Promise<AdaptiveResponse> {
  // Detect literacy from first patient response if still unknown
  let literacyLevel = currentLiteracy;
  if (currentLiteracy === 'UNKNOWN') {
    const patientMsgs = conversationHistory
      .filter((m) => m.role === 'user')
      .map((m) => m.content)
      .concat(patientMessage);
    if (patientMsgs.length >= 1) {
      literacyLevel = await detectLiteracyLevel(patientMsgs);
    }
  }

  const gatheredSummary = buildGatheredSummary(conversationHistory, patientMessage, patientContext);

  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    ...conversationHistory.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: patientMessage },
  ];

  const response = await anthropic.messages.create({
    model: CLAUDE_HISTORY_MODEL,
    max_tokens: 1024,
    system: buildAdaptiveSystemPrompt(language, literacyLevel, patientContext, gatheredSummary),
    messages,
  });

  const message = extractTextContent(response);
  const isComplete = message.includes('[HISTORY_COMPLETE]');
  const redFlagDetected = detectRedFlags(patientMessage) || detectRedFlags(message);

  return {
    message: message.replace('[HISTORY_COMPLETE]', '').trim(),
    isComplete,
    literacyLevel,
    redFlagDetected,
    suggestedFollowUp: isComplete ? undefined : getSuggestedFollowUp(literacyLevel, language),
  };
}

// ─── Structured History Extraction ───────────────────────────────────────────

export async function extractAdaptiveStructuredHistory(
  conversationHistory: ConversationMessage[],
  literacyLevel: PatientLiteracyLevel
): Promise<StructuredMedicalHistory> {
  const transcript = conversationHistory
    .map((m) => `${m.role === 'user' ? 'PATIENT' : 'ASSISTANT'}: ${m.content}`)
    .join('\n\n');

  const literacyHint =
    literacyLevel === 'LOW'
      ? 'Patient has LOW health literacy. Translate lay terms to clinical equivalents: "tummy sore"=abdominal pain, "head spinning"=vertigo, "heart beating fast"=palpitations, "can\'t breathe"=dyspnoea, "my chest tight"=chest tightness, "passing urine a lot"=polyuria/frequency.'
      : literacyLevel === 'HIGH'
        ? 'Patient uses medical terminology. Extract verbatim.'
        : 'Normalise everyday language to clinical terms where needed.';

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    system: `You are a medical data extraction AI. Parse a patient-AI conversation and extract structured medical history.

${literacyHint}

Return ONLY a valid JSON object:
{
  "chiefComplaint": "string",
  "acuity": "ACUTE | SUBACUTE | CHRONIC | CHRONIC_REVIEW",
  "historyOfPresentIllness": {
    "onset": "string",
    "duration": "string",
    "severity": "string",
    "character": "string",
    "radiation": "string",
    "aggravatingFactors": "string",
    "relievingFactors": "string",
    "associatedSymptoms": "string"
  },
  "pastMedicalHistory": "string",
  "medications": "string",
  "allergies": "string",
  "familyHistory": "string",
  "socialHistory": "string",
  "systemsReview": "string",
  "opportunisticFindings": "string — any findings from risk-stratified screening outside the chief complaint",
  "redFlagsIdentified": "string — any red flag symptoms noted during history"
}

Use "Not asked" or "Not reported" for uncovered sections. Return ONLY JSON.`,
    messages: [
      { role: 'user', content: `Extract structured history:\n\n${transcript}` },
    ],
  });

  const text = extractTextContent(response);
  try {
    return normaliseStructuredHistory(JSON.parse(text) as Partial<StructuredMedicalHistory>);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return normaliseStructuredHistory(JSON.parse(match[0]) as Partial<StructuredMedicalHistory>);
      } catch { /* fallthrough */ }
    }
    return fallbackStructuredHistory(conversationHistory);
  }
}

// ─── Patient-Friendly Summary ─────────────────────────────────────────────────

export async function generatePatientFriendlySummary(
  structuredHistory: StructuredMedicalHistory,
  language: SaLanguage,
  literacyLevel: PatientLiteracyLevel
): Promise<string> {
  const languageName = SA_LANGUAGE_NAMES[language];
  const style =
    literacyLevel === 'LOW'
      ? 'Very simple words only. Short sentences. No medical terms. Maximum 5 sentences. Be reassuring.'
      : literacyLevel === 'HIGH'
        ? 'Medical terminology is fine. Concise and precise.'
        : 'Plain everyday language. Clear and reassuring.';

  const summary = `Chief Complaint: ${structuredHistory.chiefComplaint}
Onset: ${structuredHistory.historyOfPresentIllness.onset}
Duration: ${structuredHistory.historyOfPresentIllness.duration}
Past Medical History: ${structuredHistory.pastMedicalHistory}
Medications: ${structuredHistory.medications}
Allergies: ${structuredHistory.allergies}`;

  const response = await anthropic.messages.create({
    model: CLAUDE_HISTORY_MODEL,
    max_tokens: 512,
    system: `Write a brief, friendly patient summary in ${languageName} they will read before seeing their doctor. ${style}`,
    messages: [{ role: 'user', content: summary }],
  });

  return extractTextContent(response);
}

// ─── Gathered Summary (Phase Tracker) ────────────────────────────────────────

function buildGatheredSummary(
  history: ConversationMessage[],
  latestMsg: string,
  ctx: PatientContext
): string {
  if (history.length === 0) return '';

  const combined = [...history.map(m => m.content), latestMsg].join(' ').toLowerCase();
  const lines: string[] = [];

  // Phase detection
  const hasChiefComplaint = /pain|cough|breath|fever|rash|diz|head|tummy|stomach|pee|period|sad|tired|unwell|throat|ear/.test(combined);
  const acuity = /today|yesterday|this morning|few hours|suddenly|just started/.test(combined) ? 'ACUTE'
    : /week|weeks|month/.test(combined) ? 'SUBACUTE'
    : /year|years|always|chronic|long time/.test(combined) ? 'CHRONIC'
    : null;

  if (hasChiefComplaint) lines.push('✓ Phase 1: Chief complaint established');
  else { lines.push('⬜ Phase 1: Chief complaint not yet established'); return lines.join('\n'); }

  if (acuity) lines.push(`✓ Acuity: ${acuity}`);
  else lines.push('⬜ Acuity: not yet established (new or existing problem?)');

  // Phase 2 complaint-specific
  const p2done: string[] = [];
  const p2missing: string[] = [];

  if (/character|sharp|dull|burning|crushing|tight|squeezing/.test(combined)) p2done.push('character');
  else p2missing.push('character');
  if (/severity|how bad|small|medium|very bad|1 to 10|score/.test(combined)) p2done.push('severity');
  else p2missing.push('severity');
  if (/radiat|spread|move|arm|jaw/.test(combined) || /chest pain/.test(combined)) p2done.push('radiation');
  else if (/chest pain|heart/.test(combined)) p2missing.push('radiation (mandatory for chest pain)');
  if (/worse|aggravat|trigger|provok/.test(combined)) p2done.push('aggravating factors');
  else p2missing.push('aggravating factors');
  if (/better|reliev|help|rest|painkiller/.test(combined)) p2done.push('relieving factors');
  else p2missing.push('relieving factors');
  if (/associated|other symptom|fever|nausea|sweat|breath/.test(combined)) p2done.push('associated symptoms');
  else p2missing.push('associated symptoms');

  if (p2done.length) lines.push(`✓ Phase 2 gathered: ${p2done.join(', ')}`);
  if (p2missing.length) lines.push(`⬜ Phase 2 still needed: ${p2missing.join(', ')}`);

  // Phase 3 — generalised review
  if (/sleep|sleeping/.test(combined)) lines.push('✓ Sleep: asked');
  else lines.push('⬜ Sleep: not yet asked');
  if (/mood|feeling emotionally|sad|depress|anxious|stress/.test(combined)) lines.push('✓ Mood: asked');
  else lines.push('⬜ Mood: not yet asked');

  // Phase 4 — risk screens
  if (ctx.gender === 'MALE' && ctx.age >= 50) {
    if (/pee|urine|frequency|stream|nocturia|bph/.test(combined)) lines.push('✓ BPH screen: done');
    else lines.push('⬜ BPH screen: not yet done (mandatory male >50)');
  }
  if (ctx.isSmoker) {
    if (/copd|breathless|cough|wheeze|exercise/.test(combined)) lines.push('✓ COPD screen: done');
    else lines.push('⬜ COPD screen: not yet done (mandatory smoker)');
  }

  // Phase 5 — baseline
  if (/past medical|previous illness|hospital|operation|condition/.test(combined)) lines.push('✓ PMH: asked');
  else lines.push('⬜ PMH: not yet asked');
  if (/medication|medicine|pills|injection|umuthi|muti/.test(combined)) lines.push('✓ Medications: asked');
  else lines.push('⬜ Medications: not yet asked');
  if (/allerg/.test(combined)) lines.push('✓ Allergies: asked');
  else lines.push('⬜ Allergies: not yet asked');
  if (/smok|alcohol|work|job|occup/.test(combined)) lines.push('✓ Social history: asked');
  else lines.push('⬜ Social history: not yet asked');

  return lines.join('\n');
}

// ─── Red Flag Detection ───────────────────────────────────────────────────────

const RED_FLAG_PATTERNS = [
  /chest pain.{0,40}(breath|sweat|arm|jaw)/i,
  /can'?t breathe|severe shortness of breath|dyspn/i,
  /worst headache|thunderclap|sudden severe head/i,
  /cough.{0,20}blood|haemoptysis|hemoptysis/i,
  /vomit.{0,20}blood|haematemesis|coffee.ground/i,
  /confused|unconscious|not waking|seizure|fitting/i,
  /heavy bleeding|soaking|losing a lot of blood/i,
  /stroke|face drooping|arm weak|can'?t speak|facial droop/i,
  /suicid|want to die|kill myself|end my life/i,
  /stiff neck.{0,20}fever|fever.{0,20}stiff neck|meningit/i,
  /severe abdominal|rigid abdomen|guarding/i,
];

function detectRedFlags(text: string): boolean {
  return RED_FLAG_PATTERNS.some((p) => p.test(text));
}

// ─── Private Helpers ──────────────────────────────────────────────────────────

function extractTextContent(response: Anthropic.Message): string {
  const block = response.content[0];
  return block?.type === 'text' ? block.text : '';
}

function defaultPatientContext(): PatientContext {
  return {
    age: 35,
    gender: 'OTHER',
    knownConditions: [],
    currentMedications: [],
    isSmoker: false,
    isReviewConsultation: false,
  };
}

function buildOpeningInstruction(
  language: SaLanguage,
  patientName: string,
  literacy: PatientLiteracyLevel,
  ctx: PatientContext
): string {
  const simple = literacy === 'LOW' || literacy === 'UNKNOWN';
  const reviewNote = ctx.isReviewConsultation
    ? ' This is a review visit. Open by asking how they have been since last time.'
    : '';
  const openingStyle = simple
    ? ' Use a warm single open question: "What brings you in today?"'
    : '';
  return `Greet ${patientName} warmly in ${SA_LANGUAGE_NAMES[language]} and open the consultation.${reviewNote}${openingStyle}`;
}

function getSuggestedFollowUp(literacy: PatientLiteracyLevel, language: SaLanguage): string {
  if (language !== 'en') return '';
  return literacy === 'LOW'
    ? 'Answer as best you can — there are no wrong answers.'
    : literacy === 'HIGH'
      ? 'Please be as specific as possible.'
      : 'Take your time.';
}

function normaliseStructuredHistory(p: Partial<StructuredMedicalHistory>): StructuredMedicalHistory {
  return {
    chiefComplaint: p.chiefComplaint ?? 'Not reported',
    historyOfPresentIllness: {
      onset: p.historyOfPresentIllness?.onset ?? 'Not reported',
      duration: p.historyOfPresentIllness?.duration ?? 'Not reported',
      severity: p.historyOfPresentIllness?.severity ?? 'Not reported',
      character: p.historyOfPresentIllness?.character ?? 'Not reported',
      radiation: p.historyOfPresentIllness?.radiation ?? 'No radiation',
      aggravatingFactors: p.historyOfPresentIllness?.aggravatingFactors ?? 'None reported',
      relievingFactors: p.historyOfPresentIllness?.relievingFactors ?? 'None reported',
      associatedSymptoms: p.historyOfPresentIllness?.associatedSymptoms ?? 'None reported',
    },
    pastMedicalHistory: p.pastMedicalHistory ?? 'None reported',
    medications: p.medications ?? 'None',
    allergies: p.allergies ?? 'NKDA',
    familyHistory: p.familyHistory ?? 'Not reported',
    socialHistory: p.socialHistory ?? 'Not reported',
    systemsReview: p.systemsReview ?? 'Not reported',
  };
}

function fallbackStructuredHistory(history: ConversationMessage[]): StructuredMedicalHistory {
  const first = history.find((m) => m.role === 'user');
  return {
    chiefComplaint: first?.content ?? 'Unable to extract',
    historyOfPresentIllness: {
      onset: 'See conversation log', duration: 'See conversation log',
      severity: 'See conversation log', character: 'See conversation log',
    },
    pastMedicalHistory: 'See conversation log',
    medications: 'See conversation log',
    allergies: 'See conversation log',
    familyHistory: 'See conversation log',
    socialHistory: 'See conversation log',
    systemsReview: 'See conversation log',
  };
}
