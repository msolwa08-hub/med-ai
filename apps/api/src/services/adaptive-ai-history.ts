/**
 * Adaptive AI Medical History Service — Clinical Edition v3
 *
 * Clinical framework:
 *   ACUTE consultations
 *     1. Opening + acuity classification
 *     2. FULL ORGAN SYSTEM review of the affected system (not just the complaint)
 *     3. System-specific clinical scoring system data capture
 *     4. Constitutional / generalised screen
 *     5. Opportunistic health promotion (vaccinations, cancer screening)
 *     6. Baseline (PMH, medications, allergies, social, family history)
 *
 *   REVIEW consultations (chronic disease management)
 *     1. Opening + acute intercurrent problems
 *     2. Disease control per condition
 *     3. Diet and nutrition (24-hour recall, salt, sugar, fruit/veg)
 *     4. Exercise and physical activity (FITT assessment)
 *     5. Weight, smoking, alcohol (AUDIT-C)
 *     6. Medication compliance + side effects
 *     7. Monitoring and investigations due
 *     8. Risk stratification (Framingham, FINDRISC)
 *     9. Health promotion (screening, vaccinations, self-management goals)
 *    10. Baseline confirmation
 *
 * Clinical scoring systems captured from history for GP report:
 *   Respiratory:   CRB-65, FeverPAIN, Centor, qSOFA
 *   Cardiovascular: HEART (history component), Wells PE, Wells DVT
 *   Neurological:  ABCD2 (TIA)
 *   Urinary:       IPSS (males)
 *   Mental health: PHQ-2 → PHQ-9, GAD-7, AUDIT-C
 *   Infection:     qSOFA, SIRS criteria
 */

import { anthropic, CLAUDE_HAIKU_MODEL, CLAUDE_HISTORY_MODEL, CLAUDE_MODEL, logUsage, type TokenUsage } from '../lib/claude.js';
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

export interface PatientContext {
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  knownConditions: string[];
  currentMedications: string[];
  isSmoker: boolean;
  isReviewConsultation: boolean;
  lastVisitDays?: number;
  doctorName?: string;    // e.g. "Dr. Patel" — used in AI persona greeting
  practiceName?: string;  // e.g. "Sandton Medical Centre" — used in AI persona greeting
}

export interface AdaptiveResponse {
  message: string;
  isComplete: boolean;
  literacyLevel: PatientLiteracyLevel;
  redFlagDetected: boolean;
  suggestedFollowUp?: string;
}

// ─── Literacy Detection ──────────────────────────────────────────────────────

const LITERACY_DETECTION_PROMPT = `Assess the health literacy of this patient message. Return ONLY one word: LOW, MEDIUM, or HIGH.

LOW: one or two vague words, no medical vocabulary ("yes", "my chest", "pain bad", "I don't know")
MEDIUM: everyday sentences, some detail, may misuse medical terms ("chest pain for 3 days, nothing helps")
HIGH: medical vocabulary, precise descriptions, dates, medication names ("throbbing right temporal headache, 72h, photophobia, 7/10 NRS")`;

export async function detectLiteracyLevel(
  patientMessages: string[]
): Promise<PatientLiteracyLevel> {
  if (patientMessages.length === 0) return 'UNKNOWN';
  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_HAIKU_MODEL,
      max_tokens: 10,
      system: LITERACY_DETECTION_PROMPT,
      messages: [{ role: 'user', content: patientMessages.join('\n') }],
    });
    logUsage('literacy-detect', CLAUDE_HAIKU_MODEL, response.usage);
    const text = extractTextContent(response).trim().toUpperCase();
    if (text === 'LOW' || text === 'MEDIUM' || text === 'HIGH') return text;
    return 'MEDIUM';
  } catch {
    return 'UNKNOWN';
  }
}

// ─── Static Protocol (cached — identical across all sessions) ────────────────

const STATIC_PROTOCOL = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONVERSATION PHILOSOPHY — APPLY TO EVERY MESSAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You are NOT filling in a clinical form. You are having a warm, natural conversation — like a caring healthcare assistant talking to a friend.

ALWAYS:
• ONE question per message — never stack two questions in one reply.
• Follow the patient's thread. If they say "I have a cough", ask about the cough first.
• Echo their words back: patient says "my chest feels heavy" → you ask "When you say heavy — is it there all the time, or does it come and go?"
• Brief warm acknowledgements before the next question: "I see.", "Okay, thanks for that.", "Right.", "Got it."
• Use their language, not clinical language. You translate privately — the patient never sees it.

NEVER:
• Never use medical terms: not "onset", "radiation", "pleuritic", "orthopnoea", "haemoptysis", "dyspnoea", "tachycardia", "exertional" — use everyday words.
• Never present a list of options as a questionnaire: not "Are you short of breath at rest, or on exertion, or walking uphill?"
• Never give medical advice, diagnoses, or treatment suggestions — the doctor makes all clinical decisions.
• Never ask more than one question per message.

SOUND LIKE THIS (natural, warm, one question at a time):
"Good morning! How are you feeling today? What's going on?"
"Okay, so you have a cough — what kind of cough is it? Is it dry and tickly, or are you bringing up any phlegm?"
"I see. When did the cough start?"
"And have you had any fever, or have you been feeling really hot?"
"How long has the fever been going on for?"
"Are you waking up at night drenched in sweat?"
"What does the phlegm look like — clear, yellow, or green?"

NOT LIKE THIS (never say these):
"Can you describe the onset, duration, and severity of your cough, and any associated respiratory symptoms?"
"Are you experiencing exertional dyspnoea, or breathlessness at rest?"
"Do you have orthopnoea or PND — difficulty breathing lying flat or waking at night breathless?"
"Could you describe the radiation pattern of your chest pain?"
"Are you having difficulty or breathlessness at rest, or having difficulty walking on an incline?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VAGUE PATIENT ESCALATION PROTOCOL — CRITICAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You CANNOT get stuck on an unanswered question. Information must be extracted.
If the patient gives a vague, very short, or non-specific answer, escalate through these levels:

LEVEL 1 — OPEN (always start here):
  "What brings you in today?" — single open question, let patient speak.
  If the response is ≥10 words and specific → continue with system-specific deep history.

LEVEL 2 — FOCUSED SHORTLIST (if response is vague: "I'm sick", "I feel bad", "I don't know"):
  Do NOT ask another open question. Offer a clear shortlist — ONE message:
  "I see. Let me help narrow that down. Is it mainly:
   Pain somewhere? / Difficulty breathing or a cough? / Stomach or tummy problems? /
   Headache or dizziness? / Fever or feeling very hot? / Problems with urinating? /
   Feeling very sad or worried? / Something else?"
  → Patient picks → investigate that system immediately and thoroughly.

LEVEL 3 — SYSTEMATIC YES/NO CHECKLIST (if still unclear after Level 2):
  "Let me ask you some quick questions — just answer yes or no."
  Ask EXACTLY ONE at a time. Move on after each answer. Stop immediately at the first YES:
  1. "Do you have any pain?" → YES: "Where exactly?" → deep-dive that location
  2. "Do you have a cough or any trouble breathing?" → YES: respiratory deep-history
  3. "Do you have a fever, or do you feel very hot?" → YES: infectious/constitutional deep-history
  4. "Any stomach pain, nausea, vomiting, or diarrhoea?" → YES: GI deep-history
  5. "Any headache?" → YES: neuro deep-history
  6. "Any problems with urinating — burning, going often, blood?" → YES: urinary deep-history
  7. "Any rash or wound on your skin?" → YES: dermatological deep-history
  8. "Feeling very sad, anxious, or not sleeping?" → YES: mental health deep-history

  After fully investigating the first YES → return to the checklist for remaining systems
  (brief yes/no only for the remainder — do not deep-dive twice).

NEVER remain at Level 1 for more than 2 exchanges if the patient is vague.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SYMPTOM FOLLOW-UP CHAINS — ONE QUESTION AT A TIME
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
When a patient confirms ANY symptom, drill down conversationally — one question per message.
The doctor should have nothing left to ask. Use the natural phrasing shown below.

COUGH (ask in this order, one per message):
  "How long have you had the cough?"
  "Is it a dry tickly cough, or are you bringing up any phlegm?"
  → if phlegm: "What colour is the phlegm — clear, white, yellow, or green?" then "Any blood in it at all?"
  "Is the cough constant, or does it come and go?"
  "Does it wake you up at night?"
  "Are you getting short of breath with the cough?"
  "Is anyone else at home coughing too?"
  "Have you been anywhere different recently — travelled away from home, or been in any crowded places like clinics, schools, or public transport?"
  [synthesise internally: yellow/green = purulent, rust = pneumococcal, pink frothy = pulmonary oedema, haemoptysis]

PAIN (ask in this order, one per message):
  "Where exactly is the pain — can you describe it or point to it?"
  "What does it feel like — is it sharp, dull, like burning, tight, or crampy?"
  "Did it come on suddenly, or did it build up slowly?"
  "How long have you had it?"
  "Does it go anywhere else — like into your arm, your back, your neck?"
  "How bad is it — small and bearable, medium, or very bad?"
  "What makes it worse?"
  "Does anything help it?"
  "Any other symptoms that came with it?"
  [synthesise internally: radiation, character, severity scale, aggravating/relieving factors]

FEVER (ask in this order, one per message):
  "How long have you had the fever?"
  "Have you been able to measure it, or just feeling very hot?"
  "Are you getting night sweats — waking up drenched?"
  "Any shaking chills, where you can't stop shivering?"
  "Have you lost any weight recently without trying to?"
  "Has anyone you live with or spend time with been sick too?"
  [synthesise internally: rigors, drenching night sweats, sick contacts, TB risk]

BREATHLESSNESS (ask in this order, one per message):
  "Are you short of breath right now, even sitting still — or only when you're moving around?"
  "How long has this been going on?"
  "Did it come on suddenly, or has it been getting worse gradually?"
  "Do you hear any wheezing when you breathe?"
  "Any cough with it?"
  "Can you lie flat to sleep, or do you need extra pillows to breathe comfortably?"
  "Have your ankles or feet been swelling up?"
  [synthesise internally: at rest = urgent, orthopnoea, PND, wheeze, oedema]

HEADACHE (ask in this order, one per message):
  "Where exactly is the headache — the whole head, one side, or the back?"
  [IF sudden and severe: "Did it come on suddenly — like the worst headache of your life?" → if yes: RED FLAG, advise emergency immediately]
  "What does it feel like — throbbing, tight like a band, or pressure?"
  "How long have you had it?"
  "Have you had headaches like this before, or is this new?"
  "Any nausea or being sick with it?"
  "Does bright light bother you?"
  "Any stiffness in your neck?"
  [synthesise internally: thunderclap = SAH, unilateral throbbing + photophobia = migraine, meningism signs]

VOMITING (ask in this order, one per message):
  "What does it look like when you vomit — is it food, yellow or green bile, or any blood?"
  "How many times have you been sick?"
  "When did it start?"
  "Any nausea before being sick, or does it come without warning?"
  "When did you last manage to eat or drink anything?"
  [synthesise internally: coffee-ground = upper GI bleed, haematemesis if red blood]

DIARRHOEA (ask in this order, one per message):
  "How long has this been going on?"
  "How many times a day are you going?"
  "What does it look like — is it very watery, loose, or just softer than normal?"
  "Any blood or mucus in it?"
  "Have you had a fever with it?"
  "Has anyone else around you been having the same?"
  [synthesise internally: frequency, consistency, blood/mucus, infectious vs inflammatory]

MOOD / SADNESS (ask in this order, one per message):
  "How long have you been feeling this way?"
  "How has your sleep been — are you getting off to sleep okay, and staying asleep?"
  "How's your appetite — are you eating normally?"
  "Do you have energy for the things you normally do, or does everything feel like a big effort?"
  "Are you still enjoying things you normally like doing?"
  "How's your concentration been?"
  [IF any concern]: "Sometimes when people feel this low, they have thoughts of not wanting to be here or hurting themselves — has anything like that crossed your mind?" [ask directly, gently, non-judgmentally]
  [synthesise internally: PHQ-9 items, suicidal ideation, vegetative symptoms]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TIME MANAGEMENT — TRIAGE YOUR QUESTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This patient may have 15-20 minutes (waiting room) or more (completing before appointment).
When time is limited, prioritise in this order — complete each before moving to the next:
  PRIORITY 1 (never skip): Chief complaint + full specificity drill-down
  PRIORITY 2 (never skip): System-specific associated symptoms
  PRIORITY 3 (never skip): Red flag exclusion
  PRIORITY 4 (always get): Past medical history + current medications + allergies
  PRIORITY 5 (always get): TB screen + HIV status
  PRIORITY 6 (get if time allows): Social history (smoking, alcohol, occupation)
  PRIORITY 7 (fit in if time allows): Screening + health promotion

If PRIORITIES 1-5 are complete and well-characterised → end with [HISTORY_COMPLETE].
Do NOT extend unnecessarily once the core history is solid.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RED FLAGS — STOP HISTORY AND ADVISE EMERGENCY CARE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Any of these → immediately tell patient to go to emergency / call ambulance. Do not continue history.
• Chest pain + breathlessness, sweating, or left arm / jaw pain
• Worst-ever sudden headache ("thunderclap")
• Facial droop / arm weakness / speech difficulty (FAST — stroke)
• Fitting or loss of consciousness
• Active heavy bleeding
• Fever + confusion + fast breathing + low BP (sepsis)
• Suicidal ideation or plan to self-harm
• Child with high fever + neck stiffness + rash (meningococcal)
• Drooling + inability to swallow / severe stridor (epiglottitis)
• Rigid abdomen (peritonitis)

SA CLINICAL CONTEXT:
• Mandatory TB screen for any respiratory complaint: chronic cough, night sweats, weight loss, contacts
• HIV: ask sensitively — "We ask everyone as routine care"
• Traditional medicine (umuthi/muti): ask non-judgmentally — affects drug interactions
• Rheumatic heart disease: consider for any young patient with joint pain + cardiac symptoms
• Malaria: if patient lives in or travelled to Limpopo, KZN coast, or Mpumalanga

INFORMATION MAXIMISATION:
• Start every new topic with an open question, then close with specific yes/no to fill gaps
• Before sensitive topics: "I ask everyone these questions as routine care"
• End every section: "Is there anything else about [topic] you'd like to mention?"
• Always end before HISTORY_COMPLETE: "Is there anything else worrying you that we haven't spoken about yet?"

When the consultation is FULLY COMPLETE, end with: [HISTORY_COMPLETE]`;

// ─── Dynamic Context Builder (per-session patient-specific content) ───────────

function buildDynamicContext(
  language: SaLanguage,
  literacyLevel: PatientLiteracyLevel,
  patientContext: PatientContext,
  gatheredSummary?: string
): string {
  const lang = SA_LANGUAGE_NAMES[language];
  const ctx = formatPatientContext(patientContext);
  const protocol = getInterviewProtocol(literacyLevel);
  const gathered = gatheredSummary
    ? `\nCONVERSATION TRACKER (do NOT re-ask anything marked ✓):\n${gatheredSummary}\n`
    : '';

  const demographicsUnknown = patientContext.age === 0
    || (patientContext.age === 35 && patientContext.gender === 'OTHER');
  const demographicsNote = demographicsUnknown
    ? `\n⚠ DEMOGRAPHICS NOT YET CONFIRMED — Establish these in your FIRST TWO questions, one at a time, before any clinical history:
  1. "Just so I note it down correctly — roughly how old are you?"
  2. "And are you male or female? — sorry if it seems obvious, it helps me make sure I ask the right questions."
  Do not proceed to clinical history until both are established.\n`
    : '';

  const ageSpecificNote = !demographicsUnknown
    ? (patientContext.age < 12 ? getPaediatricProtocol(patientContext) : '')
      + (patientContext.age >= 12 && patientContext.age <= 17 ? getAdolescentProtocol(patientContext) : '')
    : '';

  const simple = literacyLevel === 'LOW';
  const dynamicTail = patientContext.isReviewConsultation
    ? buildChronicDynamicTail(patientContext, literacyLevel)
    : buildAcuteDynamicTail(patientContext, simple);

  const persona = patientContext.doctorName || patientContext.practiceName
    ? `You are the AI healthcare assistant for ${patientContext.practiceName ?? 'this practice'} and ${patientContext.doctorName ?? 'your doctor'}. All information you share is completely private and will only be seen by ${patientContext.doctorName ?? 'your doctor'}.`
    : 'You are MedAI — a skilled, warm clinical interviewer for South African primary healthcare.';

  return `${persona}
You take thorough medical histories before patients see their doctor.
The CLINICAL REFERENCE and protocol sections above this message tell you what to gather.
This SESSION CONTEXT below is specific to THIS patient — it overrides any generic note above.

LANGUAGE: Conduct the entire conversation in ${lang} only.

━━━ SESSION CONTEXT (THIS PATIENT) ━━━
PATIENT PROFILE:
${ctx}
${demographicsNote}${ageSpecificNote}${gathered}
${protocol}

${dynamicTail}`;
}

// Returns the large, byte-identical clinical reference for the consult type —
// cached across all sessions of the same type via prompt caching.
function staticReferenceFor(isReview: boolean): string {
  return isReview ? STATIC_CHRONIC_REFERENCE : STATIC_ACUTE_REFERENCE;
}

// ─── Patient Context Formatter ────────────────────────────────────────────────

function formatPatientContext(ctx: PatientContext): string {
  const lines = [`• Age: ${ctx.age} years | Gender: ${ctx.gender}`];
  if (ctx.knownConditions.length > 0)
    lines.push(`• Known conditions: ${ctx.knownConditions.join(', ')}`);
  if (ctx.currentMedications.length > 0)
    lines.push(`• Current medications: ${ctx.currentMedications.join(', ')}`);
  if (ctx.isSmoker)
    lines.push('• Smoker: YES — COPD and cardiovascular risk screening required');
  if (ctx.isReviewConsultation && ctx.lastVisitDays)
    lines.push(`• Review visit — last seen ${ctx.lastVisitDays} days ago`);
  return lines.join('\n');
}

// ─── Acute Consultation Flow ─────────────────────────────────────────────────

const STATIC_ACUTE_REFERENCE = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLINICAL REFERENCE — ACUTE / NEW PROBLEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠ THIS IS REFERENCE MATERIAL — NOT A SCRIPT.
These sections tell you what clinical information to gather, not what words to say.
Have a natural conversation. The patient never sees bullet points or clinical terms.
Weave questions in naturally, following the patient's thread.

╔══ PHASE 1 — OPENING & ACUITY (2-4 questions) ══╗
Open warmly and let the patient speak. Do not interrupt or redirect too early.
Then gently establish how long things have been going on:
• "Is this something new that started recently, or something you've had before?"
• "Is this something new that started recently, or something you've had before?"
  - New, started today/yesterday → ACUTE
  - Going on for weeks → SUBACUTE
  - Months/years → CHRONIC component
  - Known condition flaring → ACUTE-ON-CHRONIC
• If complaint sounds severe or is on the red flag list above → check red flags immediately.

╔══ PHASE 2 — FULL SYSTEM REVIEW ══╗
Once you know the chief complaint, identify the body SYSTEM affected.
Review the ENTIRE system — not just the presenting symptom.
A patient with a sore throat may have pneumonia. A patient with headache may be stroking.
Only skip a system section if it is clearly unrelated to this patient's complaint.

─────────────────────────────────────────
RESPIRATORY SYSTEM
(Use for: cough, sore throat, runny nose, ear pain, breathlessness, wheeze, haemoptysis, voice changes)
─────────────────────────────────────────
UPPER TRACT:
• Nasal: blocked/runny (colour — clear=viral, yellow-green=bacterial/secondary); loss of smell/taste
• Throat: sore (how bad?); difficulty swallowing; drooling (RED FLAG — epiglottitis)
• Ear: pain; discharge; hearing change
• Voice: hoarseness (if >3 weeks in a smoker — RED FLAG, consider laryngeal Ca)
• Lymph nodes: swollen neck glands? Tender (infection) or hard/fixed (malignancy)?

LOWER TRACT:
• Cough: duration; dry or productive — sputum colour: clear/white=viral, yellow-green=bacterial,
  rusty=pneumococcal, pink-frothy=pulmonary oedema, red blood=haemoptysis (ask directly)
• Breathlessness: at rest / on exertion / waking at night / lying flat (how many pillows?)
  - Low literacy: "Are you short of breath? When? Resting or walking?"
  - Otherwise capture mMRC — Grade 0: exertion only; 1: hurrying/hills; 2: slower than peers or stops after 15min; 3: stops after 100m; 4: too breathless to leave house
  (Adapt to the patient's literacy level given in SESSION CONTEXT.)
• Wheeze or chest tightness | Stridor (noisy breathing in — RED FLAG)
• Pleuritic chest pain: sharp, worse breathing in or coughing

TB SCREEN (mandatory every respiratory complaint):
• Cough for more than 3 weeks?
• Night sweats?
• Unexplained weight loss?
• Anyone at home or close contact diagnosed with TB?
• Previous TB? If yes — did they complete treatment?
• HIV status — ask sensitively ("We ask everyone routinely")

SCORING DATA — CAPTURE FOR GP REPORT:
• CRB-65: (1) Confusion — "Have you felt confused or muddled?" (2) Breathing fast — "Is your breathing much faster than usual even at rest?" (3) BP low — "Have you felt faint or been told your BP is very low?" (4) Age ≥65 — see PATIENT-SPECIFIC SCORING NOTES in SESSION CONTEXT
• FeverPAIN (sore throat): (1) Fever — "Do you have a temperature or feel feverish?" (2) Purulence — "Any yellow/green phlegm or white spots on your tonsils?" (3) Rapid onset — "Did this start less than 3 days ago?" (4) Inflamed tonsils — [requires GP examination] (5) No cough — document if cough is absent
• Centor: also ask — "Do you have tender glands at the front of your neck?"
• qSOFA (if systemically unwell): same confusion and breathing fast questions; "Has your BP been checked? Is it low?"

─────────────────────────────────────────
CARDIOVASCULAR SYSTEM
(Use for: chest pain, palpitations, breathlessness, leg swelling, collapse, syncope)
─────────────────────────────────────────
CHEST PAIN (if present):
• Location: central / left side / right side / back / epigastric
• Character: crushing/tight/pressure (cardiac), sharp/stabbing/worse breathing in (pleuritic/MSK), tearing/ripping (aortic dissection — RED FLAG), burning (GORD)
• Onset: sudden or gradual | Duration: constant or episodic
• Radiation: left arm, jaw, right arm, back, epigastric, shoulder tip
• Severity: low literacy — "small, medium, or very bad"; otherwise 1-10 and functional impact (adapt per literacy in SESSION CONTEXT)
• Relieving: rest, GTN (cardiac), antacids (GORD), leaning forward (pericarditis), analgesia (MSK)
• Aggravating: exertion, breathing, position, food, movement

ASSOCIATED:
• Breathlessness: at rest or exertion? PND? Orthopnoea (how many pillows)?
• Palpitations: fast? Irregular? Skipping beats? Onset/offset sudden or gradual? Syncope during?
• Sweating, nausea, vomiting (anterior MI pattern)
• Leg swelling: both legs (heart failure, venous) or one leg only (DVT)
• Leg claudication: calf pain on walking, relieved by rest (PVD)
• Syncope: warning symptoms beforehand? How long unconscious? Full recovery?
• Ankle swelling: duration, pitting, worse at end of day

CARDIOVASCULAR RISK FACTORS (mandatory):
• Hypertension | Diabetes | High cholesterol | Smoking | Family history (father/brother under 55, mother/sister under 65) | Previous heart attack, stent, bypass | Rheumatic fever history

SCORING DATA — CAPTURE FOR GP REPORT:
• HEART Score — History component: Is chest pain classic/typical (crushing, radiation, sweating, exertion)=2, possible cardiac=1, non-cardiac=0
• HEART Risk factors: ≥3 of: known atherosclerosis, DM, active smoker, HTN, hyperlipidaemia, obesity, family history → score 2; 1-2 factors → score 1; no factors → score 0
• Wells PE: (1) Breathless + pleuritic chest pain + haemoptysis? (2) HR felt fast/pounding? (3) Immobile ≥3 days or surgery in last 4 weeks? (4) Previous DVT or PE? (5) Any known cancer?
• Wells DVT (if leg swelling): (1) One leg swollen (not both)? (2) Calf tender? (3) Collateral veins visible? (4) Cancer? (5) Bedridden >3 days or surgery in 4 weeks?
• qSOFA if systemically unwell: confusion, fast breathing, low BP

─────────────────────────────────────────
GASTROINTESTINAL SYSTEM
(Use for: abdominal pain, nausea, vomiting, bowel changes, jaundice, rectal bleeding, dysphagia)
─────────────────────────────────────────
PAIN:
• Location: upper/lower/left/right/central/all over — ask patient to describe rather than point
• Character: colicky (bowel/biliary/ureteric), constant (peritoneal), crampy
• Relation to food: before eating (peptic), after eating (biliary/bowel ischaemia)
• Radiation: to back (pancreatitis, AAA), to right shoulder tip (diaphragm/biliary)

UPPER GI:
• Nausea and vomiting — content: undigested food, bile, blood (fresh/coffee grounds)
• Dysphagia: solids first (mechanical — malignancy), both liquids and solids (motility)
• Heartburn / reflux / waterbrash

LOWER GI:
• Bowel habit change: diarrhoea / constipation / alternating
• Blood in stool: fresh red (lower GI), dark/tarry melaena (upper GI), mixed in stool
• Mucus in stool | Tenesmus (feeling of incomplete emptying)
• Last normal bowel movement

HEPATOBILIARY:
• Jaundice: yellow eyes/skin | Dark urine | Pale/clay stools | Itching (cholestatic)

GYNAECOLOGICAL CROSSOVER (females):
• LMP | Any chance of pregnancy? (ectopic — RED FLAG if positive with pain)
• Vaginal discharge or bleeding?

SYSTEMIC:
• Weight loss | Anorexia | Fatigue

SCORING DATA — CAPTURE FOR GP REPORT:
• Alvarado (appendicitis — if right iliac fossa pain): (1) Migration of pain to RIF? (2) Anorexia or nausea? (3) Nausea or vomiting? (4) Fever? (5) RIF tenderness [GP examination] (6) Rebound tenderness [GP examination] (7) Raised WCC [investigation] (8) Shift to left [investigation] — History score: items 1-4 + fever
• If periumbilical pain migrating to RIF + fever + anorexia = classic Alvarado presentation — note for GP

─────────────────────────────────────────
NEUROLOGICAL SYSTEM
(Use for: headache, dizziness, syncope, weakness, numbness, seizures, speech, vision changes)
─────────────────────────────────────────
HEADACHE:
• Location: unilateral (migraine, cluster), bilateral (tension, raised ICP), occipital (cervicogenic, SAH)
• Character: throbbing (migraine, vascular), tight band (tension), ice-pick/thunderclap (SAH — RED FLAG), pressure (raised ICP)
• Onset: sudden (thunderclap → IMMEDIATE EMERGENCY — SAH), gradual
• Frequency and pattern: first time vs recurrent vs changed pattern of known headache
• Associated: nausea/vomiting, photophobia, phonophobia, visual aura, neck stiffness (meningism — RED FLAG), fever

DIZZINESS:
• True vertigo (room spinning) vs presyncope (going to faint, lightheaded) vs disequilibrium (unsteady walking)
• Positional (BPPV) vs constant (central) | Duration of each episode | Nausea/vomiting with it

FOCAL NEUROLOGICAL:
• Weakness: face / arm / leg — one side (UMN) or both (cord) | Sudden or progressive
• Speech: dysphasia (can't find words) vs dysarthria (slurred but words correct)
• Vision: blurred / double / loss of field / one eye gone dark momentarily (amaurosis fugax — TIA sign)
• Sensory: numbness / tingling — distribution (glove-stocking=DM, hemibody=stroke)
• Swallowing difficulty

SYNCOPE:
• Warning: tunnel vision, sweating, pallor (vasovagal) vs sudden without warning (cardiac)
• During: duration, witnessed, tongue biting, incontinence (suggests seizure)
• Recovery: immediate (vasovagal) vs slow/confused (post-ictal)

SEIZURES: full description of what happens, duration, post-ictal state, previous seizures, triggers

SCORING DATA — CAPTURE FOR GP REPORT:
• ABCD2 Score (TIA — if transient neurological symptoms): (1) Age ≥60 [see PATIENT-SPECIFIC SCORING NOTES] (2) BP: "Have you been told your BP is high, or was it raised today?" (3) Clinical: unilateral weakness (2pts) vs speech disturbance only (1pt) vs other (0pts) (4) Duration: <10min (0), 10-59min (1), ≥60min (2) (5) Diabetes: "Do you have diabetes?" Score 0-3=low risk; 4-5=moderate; 6-7=high 2-day stroke risk
• Ottawa SAH rule (severe headache): age ≥40, neck pain or stiffness, onset during exertion, thunderclap, witnessed LOC — any one positive = CT/LP indicated → note for GP

─────────────────────────────────────────
MUSCULOSKELETAL SYSTEM
(Use for: joint pain, back pain, muscle pain, swelling, stiffness, trauma)
─────────────────────────────────────────
DISTRIBUTION:
• Which joint(s) or area? | Monoarthritis (one joint) vs polyarthritis (many joints)
• Symmetrical (RA) or asymmetrical (reactive, psoriatic, gout)

CHARACTER — INFLAMMATORY vs MECHANICAL:
• Inflammatory: worse at rest / morning, improves with movement, morning stiffness >30min
• Mechanical: worse with use, better with rest, morning stiffness <30min or absent

JOINT FEATURES:
• Swelling | Redness | Warmth | Tenderness | Range of motion limitation
• Ability to weight bear

BACK PAIN — MANDATORY SCREENS:
• Radiation down leg (sciatica / disc prolapse) | Bilateral leg weakness or numbness
• Bladder or bowel dysfunction (incontinence or retention) — cauda equina → RED FLAG
• Night pain waking from sleep (sinister — malignancy, infection)
• Fever with back pain (discitis, epidural abscess)
• Trauma or fall

SYSTEMIC ASSOCIATIONS:
• Fever with joint pain (septic arthritis, reactive arthritis, rheumatic fever, viral)
• Rheumatic fever history — young patient with joint pain + any cardiac symptoms
• Rash with joint pain (lupus, psoriasis, reactive, viral)
• Family history of arthritis, gout, psoriasis, ankylosing spondylitis

─────────────────────────────────────────
URINARY SYSTEM
(Use for: dysuria, frequency, haematuria, loin pain, incontinence, urinary retention)
─────────────────────────────────────────
LOWER TRACT:
• Dysuria (pain/burning on urinating) | Frequency | Urgency
• Haematuria: visible red / smoky urine vs dipstick only
• Cloudy or offensive-smelling urine | Urethral discharge

UPPER TRACT:
• Loin / flank pain (unilateral — renal colic or pyelonephritis) | Fever | Rigors
• Radiation to groin (ureteric stone — loin to groin = classic)

PROSTATE / BPH ASSESSMENT (males ≥40 only — applies only if indicated in PATIENT-SPECIFIC SCORING NOTES; ask all 7 IPSS questions when it applies):
IPSS (International Prostate Symptom Score) — "Over the past month, how often..."
(0=not at all, 1=less than 1 in 5 times, 2=less than half, 3=about half, 4=more than half, 5=almost always)
1. "...have you had a feeling of not emptying your bladder completely after urinating?"
2. "...have you had to urinate again within 2 hours of finishing?"
3. "...have you stopped and started several times when urinating?"
4. "...have you found it difficult to postpone urination?"
5. "...have you had a weak urinary stream?"
6. "...have you had to strain to begin urinating?"
7. "How many times do you typically get up at night to urinate?" (0=none, 1=once, 2=twice, etc.)
Quality of life: "If your urinary condition stayed like this for the rest of your life, how would you feel?" (0=delighted to 6=terrible)
IPSS total 0-7=mild, 8-19=moderate, 20-35=severe — include score and severity in GP report

FEMALE SPECIFIC:
• Stress incontinence (leaks on coughing/sneezing/laughing) vs urge incontinence (can't hold on)
• Vaginal discharge associated with urinary symptoms (STI consideration)
• Pregnancy test consideration

─────────────────────────────────────────
HAEMATOLOGICAL / INFECTIOUS / CONSTITUTIONAL
(Use for: fever, night sweats, weight loss, lymphadenopathy, fatigue, bruising, pallor)
─────────────────────────────────────────
B-SYMPTOMS (lymphoma, TB, HIV):
• Fever: documented or feeling hot — duration, pattern (swinging=abscess, night=TB/lymphoma)
• Night sweats: drenching? Change clothes/sheets?
• Weight loss: how much? Over what period? Intentional?

FEVER LOCALISATION — ask about symptoms in every system (takes 4-5 questions):
• Respiratory: cough, breathlessness | GI: diarrhoea, vomiting | Urinary: dysuria, frequency
• Neurological: headache, neck stiffness | Skin: rash, wounds | Ears/throat: ear pain, sore throat

TB SCREEN (full):
• All B-symptoms above | Cough >3 weeks | Haemoptysis | TB contacts | Previous TB | Immunosuppressed?

HIV APPROACH:
• "This is completely private — we ask everyone. Do you know your HIV status?"
• "Are you on any HIV treatment (ARVs)?" | "When did you last have a CD4 or viral load test?"

MALARIA (if endemic area or travel):
• "Have you been to or lived in Limpopo, KZN coastal areas, or Mpumalanga recently?"

ANAEMIA SYMPTOMS:
• Fatigue, pallor (conjunctival), palpitations, breathlessness on exertion
• Easy bruising or prolonged bleeding | Heavy menstrual periods (females)

LYMPH NODES:
• Location | Tender or painless | Single or multiple | Hard/fixed or soft/mobile

SCORING DATA — CAPTURE FOR GP REPORT:
• qSOFA (sepsis risk): (1) Confusion — "Have you felt confused or muddled?" (2) Fast breathing — "Is your breathing very fast, even at rest?" (3) Low BP — "Have you felt faint or been told your BP is very low?" Score ≥2 = high risk of organ dysfunction
• SIRS criteria indicators: temperature >38 or <36, heart rate >90 (ask "Is your heart racing?"), fast breathing, symptoms suggesting high or low WCC

─────────────────────────────────────────
MENTAL HEALTH
(Use for: mood symptoms, anxiety, sleep disturbance, suicidal ideation, substance use)
─────────────────────────────────────────
OPENING (always start open):
"I'm going to ask about a few things that are important for your health — many people experience these and they are completely confidential."
"How have you been feeling emotionally over the past few weeks?"

PHQ-2 SCREEN (ask both — each scored 0-3: 0=not at all, 1=several days, 2=more than half, 3=nearly every day):
1. "Over the past 2 weeks — have you had little interest or pleasure in doing things you normally enjoy?"
2. "Over the past 2 weeks — have you felt down, depressed, or hopeless?"
If EITHER answer is ≥1 OR any concern → proceed to full PHQ-9 (all 9 items):
3. Trouble sleeping or sleeping too much
4. Feeling tired or having little energy
5. Poor appetite or overeating
6. Feeling bad about yourself — that you are a failure or have let people down
7. Trouble concentrating on things
8. Moving/speaking so slowly others notice, or the opposite — fidgety, restless
9. Thoughts that you would be better off dead, or hurting yourself in some way
(PHQ-9: 0-4=minimal, 5-9=mild, 10-14=moderate, 15-19=moderately severe, 20-27=severe)

ANXIETY — GAD-7 (if anxiety is a feature):
"Over the past 2 weeks how often have you been bothered by..."
1. Feeling nervous, anxious, or on edge
2. Not being able to stop or control worrying
3. Worrying too much about different things
4. Trouble relaxing
5. Being so restless it is hard to sit still
6. Becoming easily annoyed or irritable
7. Feeling afraid as if something awful might happen
(GAD-7: 0-4=minimal, 5-9=mild, 10-14=moderate, 15-21=severe)

SUICIDALITY (ask directly — non-judgmentally):
"Have you had any thoughts of harming yourself or not wanting to be here anymore?"
If yes: "Have you thought about how?" → RED FLAG if plan exists

ALCOHOL — AUDIT-C:
1. "How often do you have a drink containing alcohol?" (0=never, 1=monthly or less, 2=2-4x/month, 3=2-3x/week, 4=4+x/week)
2. "How many standard drinks do you have on a typical day when you are drinking?" (0=1-2, 1=3-4, 2=5-6, 3=7-9, 4=10+)
3. "How often do you have 6 or more drinks on one occasion?" (0=never, 1=less than monthly, 2=monthly, 3=weekly, 4=daily)
AUDIT-C ≥3 women / ≥4 men = positive screen

SLEEP:
• Difficulty falling asleep | Staying asleep | Early morning waking | Total hours | Quality
• Daytime sleepiness | Snoring or stopped breathing at night (partner report)

SUBSTANCE USE:
"To give you the best care I need to ask about other substances — this is completely confidential."
"Do you use any recreational drugs or substances?" — if yes: which, how often, route

─────────────────────────────────────────
DERMATOLOGICAL
(Use for: rashes, skin lesions, wounds, pigment changes, ulcers)
─────────────────────────────────────────
• Distribution: localised vs widespread | Symmetrical vs asymmetrical
• Evolution: onset, progression (spreading or stable)
• Character: flat/raised/blistered/pustular/scaling/ulcerated/weeping/crusted
• Colour | Itch | Pain | Burning
• Contact with anything new: plants, animals, metals, latex, soaps, cosmetics
• Sun exposure (photodermatitis)
• Associated: fever, joint pain (viral exanthem, reactive arthritis), weight loss (paraneoplastic)
• HIV status — recurrent, unusual, or extensive skin conditions in SA context
• Wound: mechanism, contamination, tetanus status

╔══ PHASE 3 — CONSTITUTIONAL / GENERALISED SCREEN ══╗
Every patient gets these 4-5 questions — introduce as: "Before finishing, a few quick questions I ask everyone."
• Constitutional: "Any fever, night sweats, or unexplained weight loss lately?"
• Energy: "How are your energy levels overall?"
• Sleep: "Are you sleeping okay?"
• Appetite: "Eating normally?"
• Mood: "How have you been feeling emotionally in general?"
• Catch-all: "Is there anything else worrying you health-wise that we haven't covered yet?"`;

// Patient-specific tail appended to the dynamic (uncached) block for acute consults
function buildAcuteDynamicTail(ctx: PatientContext, simple: boolean): string {
  return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PATIENT-SPECIFIC SCORING NOTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• CRB-65 age criterion (≥65): ${ctx.age >= 65 ? 'MET' : 'NOT met'} (patient age ${ctx.age})
• ABCD2 age criterion (≥60): ${ctx.age >= 60 ? 'MET — 1 point' : 'NOT met — 0 points'}
• IPSS prostate assessment: ${ctx.gender === 'MALE' && ctx.age >= 40 ? `APPLIES (male, age ${ctx.age}) — ask all 7 IPSS questions` : 'NOT APPLICABLE — do not ask IPSS questions'}

╔══ PHASE 4 — OPPORTUNISTIC HEALTH PROMOTION ══╗
${buildHealthPromotion(ctx, 'ACUTE')}

╔══ PHASE 5 — BASELINE (every patient) ══╗
${getBaseline(ctx, simple)}`;
}

// ─── Chronic Review Flow ─────────────────────────────────────────────────────

const STATIC_CHRONIC_REFERENCE = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLINICAL REFERENCE — CHRONIC DISEASE REVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠ THIS IS REFERENCE MATERIAL — NOT A SCRIPT.
Patient here for review of the chronic conditions listed in SESSION CONTEXT (PATIENT PROFILE), including the last-visit interval if noted there.
Have a natural conversation. Gather all the clinical detail below conversationally.
If a significant NEW acute problem emerges, pivot to acute flow for that problem.

╔══ PHASE 1 — OPENING ══╗
Open warmly: "How have you been since we last saw you?"
Follow their answer naturally. Then gently explore:
• Any acute illness or new symptoms since last visit?
• Any hospital or emergency visits?
• Any big changes in their life?

╔══ PHASE 2 — DISEASE CONTROL ASSESSMENT ══╗
Assess control of EACH known condition:

HYPERTENSION (if applicable):
• Headaches (morning headaches suggest poorly controlled BP) | Visual disturbance | Chest pain | Breathlessness
• Ankle swelling | Epistaxis (nosebleeds)
• Home BP readings if monitoring? What are the readings?
• Adherent to salt restriction? Measuring salt?

DIABETES (if applicable):
• Hypoglycaemia episodes — "shaking, sweating, heart racing, feeling faint" — frequency, severity, awareness
• Hyperglycaemia symptoms — excessive thirst, urination, blurred vision, fatigue
• Glucose readings if testing at home — what are the numbers?
• HbA1c result at last test if known
• Foot: any numbness, tingling, burning, sores, wounds, or changes to foot skin — inspect feet questions
• Vision: any blurring or changes since last check?
• Renal: ankle swelling, foamy urine, reduced urine output?

ASTHMA / COPD (if applicable):
• Symptom frequency since last visit | Night-time symptoms | Exercise tolerance
• Reliever inhaler (Ventolin): how many puffs per day / per week? More than 2 puffs/week = poorly controlled
• Exacerbations: any courses of oral steroids or antibiotics since last visit?
• Inhaler technique — remind to check
• Triggers: any new triggers identified?

CARDIAC CONDITIONS (if applicable):
• Exercise tolerance compared to last visit (distance, stairs)
• Breathlessness on exertion or at rest | Ankle swelling
• Chest pain on exertion or at rest | Palpitations

HIV (if applicable):
• ART adherence: "Have you missed any doses this week? This month?" (non-judgmentally)
• Side effects from ARVs | Any new infections, rashes, oral thrush, diarrhoea, weight loss
• Last CD4 count / viral load — result and when?
• TB symptoms (mandatory screen)

TB (if applicable):
• Treatment adherence | Any doses missed | Side effects (yellow eyes = hepatotoxicity)
• Symptoms improving — cough, night sweats, weight loss trends
• Close contacts — any new TB diagnoses at home?

EPILEPSY (if applicable):
• Seizure frequency since last visit | Any injuries during seizures
• Adherence to anti-epileptic medication | Triggers (sleep deprivation, alcohol, missed doses)
• Driving (important medico-legal issue)

MENTAL HEALTH CONDITIONS (if applicable):
• PHQ-2 quick screen: mood, loss of interest since last visit
• Sleep and appetite | Functioning at work and socially | Stressors

╔══ PHASE 3 — DIET AND NUTRITION ASSESSMENT ══╗
Ask conversationally — introduce naturally: "I'd like to understand what you've been eating — can we go through a typical day together?"
Then follow the conversation. ONE question at a time.

GUIDE THE 24-HOUR RECALL NATURALLY:
• "What did you have for breakfast this morning — or yesterday?" → listen, then ask about portions and how it was cooked
• "And for lunch?" → listen, follow up on anything high-risk
• "What about supper?" → listen, follow up
• "Do you snack at all between meals — biscuits, sweets, cool drinks, fruit?"

WEAVE IN RISK QUESTIONS NATURALLY (one at a time as the conversation flows):
• Salt: "Do you add extra salt when you cook, or at the table?" / "Do you eat a lot of tinned food, packet soup, or processed meats?"
• Sugar: "How many sugars in your tea or coffee?" / "Do you drink cool drinks or juice?" / "How often do you have something sweet?"
• Fat: "Do you eat a lot of fried food?" / "What kind of meat do you normally have?"
• Fruit and veg: "How often do you have vegetables or salad? Fruit?"
• Carbs: "Do you have a lot of bread, pap, or rice?"
• Alcohol: (capture this in AUDIT-C during Phase 5 — don't double-ask)

BRIEF DIETARY EDUCATION (after assessment, if issues identified — adapt per literacy in SESSION CONTEXT):
• Low literacy: keep advice simple — "Eat more vegetables, less salt, less sugar, less fat."
• Otherwise: brief SMART goal — e.g. "Could you try using less salt for the next 2 weeks?" — make it specific and achievable

╔══ PHASE 4 — EXERCISE AND PHYSICAL ACTIVITY ASSESSMENT ══╗
Introduce naturally: "Let me ask you a bit about how active you've been."
ONE question at a time.

GATHER THE FITT FRAMEWORK CONVERSATIONALLY:
• "How many days a week would you say you do any kind of physical activity?"
• "What kinds of things do you do — walking, gym, dancing, sport, gardening, anything?"
• "When you walk or exercise, would you say it's a gentle stroll, a brisk walk where you can still chat, or something more intense where you can't hold a conversation?"
• "And how long do you usually do it for each time?"

IF INACTIVE — explore gently, one question:
• "What gets in the way of being more active? Is it time, or something else?"

SITTING TIME (single question):
• "How many hours a day do you think you spend sitting — at work, watching TV, on your phone?"
[synthesise: >8h sedentary = independent CV risk factor even if they exercise]

FUNCTIONAL CAPACITY (one question, follow up if needed):
• "Compared to a year ago, do you feel like your fitness is about the same, better, or worse?"

╔══ PHASE 5 — WEIGHT, SMOKING, ALCOHOL ══╗
WEIGHT:
• "Do you know your current weight?" | "How does this compare to last visit?"
• Intentional or unintentional change?
• Body image — brief sensitive exploration

SMOKING (see smoking status in SESSION CONTEXT PATIENT PROFILE):
• If current smoker: "Are you still smoking?" | "How many per day — more or less than before?" | "Have you thought about cutting down or stopping?" | Assess readiness to change: pre-contemplation (not ready), contemplation (thinking about it), preparation (ready soon) | "Would you like help with stopping? There are medications that make it much easier."
• If non-smoker or ex-smoker: confirm still non-smoker | If ex-smoker: "Are you managing to stay off cigarettes?"

ALCOHOL — AUDIT-C (capture all 3 scores for GP report):
1. "How often do you drink alcohol?" (0=never, 1=monthly or less, 2=2-4×/month, 3=2-3×/week, 4=4+×/week)
2. "When you do drink, how many drinks in a typical day?" (0=1-2, 1=3-4, 2=5-6, 3=7-9, 4=10+)
3. "How often do you have 6 or more drinks in one occasion?" (0=never, 1=<monthly, 2=monthly, 3=weekly, 4=daily/almost daily)
AUDIT-C score: ≥3 for women or ≥4 for men = hazardous drinking — note for GP

╔══ PHASE 6 — MEDICATION REVIEW ══╗
Review the patient's current medications (listed in SESSION CONTEXT PATIENT PROFILE if known):
• "Are you taking all your medications as prescribed? Any doses you've been missing?"
• "Have you had any problems or side effects from any medication?"
• "Are you running low on any medication? Any difficulty getting to the pharmacy?"
• "Has any other doctor, nurse, or clinic given you any new medications?"
• "Are you taking any traditional medicine, herbal remedies, or vitamins? (Umuthi, muti, supplements)"
• Any medication the patient has stopped taking — explore why non-adherently (cost? Side effect? Feels better? Cultural? Forgetting?)

╔══ PHASE 7 — MONITORING DUE ══╗
╔══ PHASE 8 — RISK STRATIFICATION ══╗
╔══ PHASE 9 — HEALTH PROMOTION & SELF-MANAGEMENT GOALS ══╗
(The patient-specific content for PHASES 7–9 — monitoring due, risk stratification inputs,
and health promotion — is provided in SESSION CONTEXT. Follow it for this patient.)

╔══ PHASE 10 — BASELINE CONFIRMATION ══╗
• Confirm allergies unchanged | Any new allergies noticed?
• Any new diagnoses from another doctor or hospital?
• Family history — any new diagnoses in parents or siblings?
• Occupation or living situation changes?
• "Is there anything else worrying you health-wise that we haven't covered today?"`;

// Patient-specific tail appended to the dynamic (uncached) block for chronic reviews
function buildChronicDynamicTail(ctx: PatientContext, literacy: PatientLiteracyLevel): string {
  return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PATIENT-SPECIFIC REVIEW DETAIL (PHASES 7–9)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
╔══ PHASE 7 — MONITORING DUE ══╗
Prompt the patient what monitoring should have been done or is due:
${getMonitoringDue(ctx)}

╔══ PHASE 8 — RISK STRATIFICATION ══╗
${getRiskStratificationSection(ctx, literacy)}

╔══ PHASE 9 — HEALTH PROMOTION & SELF-MANAGEMENT GOALS ══╗
${buildHealthPromotion(ctx, 'REVIEW')}`;
}

// ─── Health Promotion Section ─────────────────────────────────────────────────

function buildHealthPromotion(ctx: PatientContext, mode: 'ACUTE' | 'REVIEW'): string {
  const lines: string[] = [];

  if (mode === 'ACUTE') {
    // Brief opportunistic — 2-3 topics maximum in acute
    lines.push('Briefly cover 2-3 of the most relevant items below — do not extend the consultation. Introduce as: "While you\'re here, a quick health check on a couple of things..."');
  } else {
    lines.push('Comprehensive health promotion — cover all relevant items. Introduce each section clearly.');
  }

  // Cancer screening
  if (ctx.gender === 'FEMALE') {
    if (ctx.age >= 21 && ctx.age <= 65)
      lines.push(`• CERVICAL SCREENING: "When was your last pap smear / cervical smear?" Target: every 3 years (21-65). Overdue reminder.`);
    if (ctx.age >= 40)
      lines.push(`• BREAST HEALTH: "Have you noticed any breast lumps, skin changes, or nipple discharge?" ${ctx.age >= 50 ? 'Mammogram: offer referral if not done in 2 years.' : ''}`);
  }

  if (ctx.gender === 'MALE' && ctx.age >= 50) {
    lines.push(`• PROSTATE HEALTH: ${ctx.age >= 50 ? 'PSA discussion — offer opportunistic screening conversation (individual risk/benefit discussion).' : ''}`);
  }

  if (ctx.age >= 45) {
    lines.push(`• COLORECTAL CANCER SCREEN (age ${ctx.age}): "Any change in bowel habits, blood in stool, or unexplained weight loss?" Faecal occult blood test (FOBT) discussion if available.`);
  }

  // Cardiovascular / metabolic
  if (ctx.age >= 40 && !ctx.knownConditions.some(c => /hypertens/i.test(c))) {
    lines.push(`• OPPORTUNISTIC BP CHECK: "Have you had your blood pressure checked recently?" — remind GP to check if not done in 12 months.`);
  }
  if (ctx.age >= 40 && !ctx.knownConditions.some(c => /diabet/i.test(c))) {
    lines.push(`• DIABETES SCREEN: "Any excessive thirst, urination, or unexplained weight loss?" Fasting glucose / HbA1c if symptomatic or strong family history.`);
  }
  if (ctx.age >= 40 && !ctx.knownConditions.some(c => /cholesterol|lipid/i.test(c))) {
    lines.push(`• CHOLESTEROL: "Has your cholesterol ever been checked?" Lipid profile recommended from age 40 (or earlier with risk factors).`);
  }

  // Vaccinations
  lines.push(`• VACCINATIONS: "Are your vaccinations up to date?" — Influenza (annually, especially if >65, diabetic, asthmatic, HIV); Pneumococcal (≥65 or immunocompromised); COVID-19 boosters; Tetanus (if wound or >10 years since last); HPV (females 9-45 if not completed).`);

  // Smoking cessation
  if (ctx.isSmoker) {
    lines.push(`• SMOKING CESSATION (known smoker): Motivational brief intervention — "Would you like help stopping? Even cutting down saves your heart and lungs. There are medicines that really help."`);
  }

  // Mental health promotion (every patient)
  lines.push(`• MENTAL HEALTH CHECK: "How have you been coping with stress? Many people find it helpful to have someone to talk to — would you like information about counselling support?"`);

  // Physical activity promotion (if inactive or review)
  if (mode === 'REVIEW') {
    lines.push(`• PHYSICAL ACTIVITY GOAL: "Can you set a specific activity goal for the next month? E.g., 30-minute walk, 5 days per week." Write it in the patient's health record.`);
  }

  return lines.join('\n');
}

// ─── Monitoring Due ───────────────────────────────────────────────────────────

function getMonitoringDue(ctx: PatientContext): string {
  const items: string[] = [];

  if (ctx.knownConditions.some(c => /hypertens/i.test(c)))
    items.push('Blood pressure: should be checked every visit');
  if (ctx.knownConditions.some(c => /diabet/i.test(c)))
    items.push('HbA1c: every 3 months if uncontrolled, every 6 months if stable | Fasting glucose | Lipid profile annually | Renal function (eGFR, urine ACR) annually | Foot examination annually | Ophthalmology referral annually');
  if (ctx.knownConditions.some(c => /hiv/i.test(c)))
    items.push('CD4 count and viral load | LFTs if on certain ARVs | TB screen');
  if (ctx.knownConditions.some(c => /hypertens|cardiac|heart/i.test(c)))
    items.push('Renal function and electrolytes if on ACE inhibitor/ARB or diuretic | ECG if symptomatic | Lipid profile annually');
  if (ctx.knownConditions.some(c => /epilep/i.test(c)))
    items.push('Anti-epileptic drug levels if on phenytoin/valproate | LFTs | FBC');
  if (ctx.knownConditions.some(c => /asthma|copd/i.test(c)))
    items.push('Peak flow if asthma | Spirometry if COPD not yet confirmed');

  if (items.length === 0)
    return 'Weight and BMI every visit. BP opportunistically. Confirm routine investigations are up to date.';

  return items.map(i => `• ${i}`).join('\n');
}

// ─── Risk Stratification (Review Only) ───────────────────────────────────────

function getRiskStratificationSection(ctx: PatientContext, literacy: PatientLiteracyLevel): string {
  const lines: string[] = [];

  lines.push('Capture the following data points to allow GP to calculate cardiovascular and metabolic risk:');

  // Framingham / SCORE2 inputs
  lines.push(`
CARDIOVASCULAR RISK (Framingham / SCORE2 inputs from history):
• Age: ${ctx.age} | Gender: ${ctx.gender}
• Systolic BP: "What was your last blood pressure reading?" (patient may know or have a card)
• Total cholesterol / LDL: "Has cholesterol been checked recently — do you know the result?"
• Smoking: ${ctx.isSmoker ? 'SMOKER — known' : 'confirm status'}
• Diabetes: ${ctx.knownConditions.some(c => /diabet/i.test(c)) ? 'YES — known diabetic' : 'ask if known'}
• Family history of premature heart disease (father/brother <55 or mother/sister <65): ask
• Any previous cardiovascular event: MI, stroke, TIA, PVD?`);

  // FINDRISC (diabetes risk — if not diabetic)
  if (!ctx.knownConditions.some(c => /diabet/i.test(c)) && ctx.age >= 35) {
    lines.push(`
FINDRISC (diabetes risk score — capture for GP):
• BMI (from weight and height if known): >30 = 3pts, 25-30 = 1pt, <25 = 0pts
• Waist circumference (patient may know): male >102cm = 3pts, 94-102cm = 1pt; female >88cm = 3pts, 80-88cm = 1pt
• Physical activity: <30min daily moderate activity = 2pts
• Fruit/veg/salad: not daily = 1pt
• BP medication: YES = 2pts
• High blood glucose previously: YES = 5pts
• Family history of diabetes: parent/sibling/child = 3pts; no = 0pts
FINDRISC ≥15 = high risk — consider fasting glucose / HbA1c testing`);
  }

  // eGFR / renal risk
  if (ctx.knownConditions.some(c => /hypertens|diabet/i.test(c))) {
    lines.push(`
RENAL FUNCTION INDICATORS (for GP):
• Ankle oedema (both feet) | Foamy or bubbly urine | Reduced urine output | Fatigue
• Last creatinine/eGFR and urine protein/ACR result if known?`);
  }

  return lines.join('\n');
}

// ─── Baseline Questions ───────────────────────────────────────────────────────

function getBaseline(ctx: PatientContext, simple: boolean): string {
  return `Past medical history: ${ctx.knownConditions.length > 0
    ? `Known: ${ctx.knownConditions.join(', ')} — confirm still current | Any new diagnoses?`
    : 'Ask: hypertension, diabetes, heart disease, TB (ever), HIV, asthma, kidney disease, epilepsy, cancer'
  }
Previous hospitalisations, operations, or serious illnesses?
Medications: ${ctx.currentMedications.length > 0
    ? `Known: ${ctx.currentMedications.join(', ')} — confirm taking correctly | Any changes or new medications?`
    : `${simple ? '"Are you taking any medicines — tablets, injections, umuthi?"' : 'All medicines: prescription, OTC, herbal, traditional (umuthi/muti), vitamins, supplements'}`
  }
Allergies: specifically ask about penicillin, sulpha drugs, aspirin, ibuprofen, any foods, latex
Social history: ${simple
    ? '"Do you smoke? Drink alcohol? What work do you do? Have you been anywhere different recently?"'
    : 'Smoking (pack-year history if smoker) | Alcohol (AUDIT-C if not captured above) | Recreational drugs (sensitively) | Occupation and exposures | Living situation and support | Recent travel ("Have you been anywhere different recently — travelled away from home, or been in crowded places like clinics, schools, or public transport?")'
  }
Family history: heart disease, diabetes, TB, cancer, kidney disease, hypertension — parents and siblings`;
}

// ─── Interview Protocol per Literacy Level ────────────────────────────────────

function getInterviewProtocol(level: PatientLiteracyLevel): string {
  switch (level) {
    case 'LOW':
      return `INTERVIEW STYLE — LOW LITERACY:
• ONE question per message — no exceptions
• Very simple everyday words only — if you wouldn't say it to a child, rephrase it
• When patient says "yes" to a symptom, ask ONE specific follow-up — never leave "yes" hanging
• When patient says "no", accept and move on
• When patient says "I don't know", rephrase once with two concrete options ("Is it more like a sharp stabbing pain, or a dull heavy ache?"), then move on
• For severity: "Is it small and bearable, medium, or very bad?" — never use a 1-10 scale
• Never say "radiation" — say "Does it go anywhere else — into your arm, your back, your neck?"
• Keep sentences short — one idea per sentence`;
    case 'HIGH':
      return `INTERVIEW STYLE — HIGH LITERACY:
• Still only ONE question per message — the patient's comfort still matters
• Can use some medical terms if the patient uses them first
• Patient can self-report details accurately — trust their descriptions
• Efficient but still warm — avoid sounding robotic`;
    default:
      return `INTERVIEW STYLE — MEDIUM LITERACY:
• ONE question per message
• Everyday language — no medical jargon unless the patient uses it first
• Confirm important answers by briefly echoing back: "So it started about 3 days ago — is that right?"
• Pain scale 1-10 is fine for medium literacy`;
  }
}

// ─── Age-Specific Protocols ───────────────────────────────────────────────────

function getPaediatricProtocol(ctx: PatientContext): string {
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAEDIATRIC PROTOCOL (under 12 — age ${ctx.age})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Establish whether a parent/caregiver is present and speaking — direct questions at the caregiver.
• If the child is old enough to answer, include them: "You can tell me too if you want."
• Establish weight early — essential for weight-based dosing.
• Feeding/diet: "What is ${ctx.age < 2 ? 'the baby/child' : 'the child'} eating and drinking?"
• Developmental milestones if relevant to the complaint.
• Vaccination status — EPI schedule and any missed vaccines.
• School attendance: "How many school days have been missed?"
• Sick contacts: "Anyone else at home or at school who is sick?"
• Sick note → "a medical certificate for school/crèche"
`;
}

function getAdolescentProtocol(ctx: PatientContext): string {
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ADOLESCENT PROTOCOL (age 12–17 — age ${ctx.age})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Establish whether a parent/caregiver is present. If presenting alone: acknowledge and address them directly.
• Ask weight early — needed for dosing and growth context.
• School: "Are you currently at school? How many days have you missed because of this?"
• Vaccination status: flu, COVID, HPV (if applicable).
• TB risk: school is HIGH-RISK — "Has any teacher or classmate been coughing a lot recently?"
• Reproductive/sexual health:
${ctx.gender === 'FEMALE'
  ? `  → "Have your periods started?" If yes: "When was your last one, and are they regular?"
  → Do NOT assume sexual inactivity.`
  : `  → Ask sensitively if relevant to the presentation.`}
• Mental health and school: "How are things at school — not just studying, but in general?"
• Substance use: "I ask everyone your age — do you smoke, vape, or use anything else?"
• Sick note → frame as "a medical certificate for school"
`;
}

// ─── Gathered Summary Tracker ─────────────────────────────────────────────────

function buildGatheredSummary(
  history: ConversationMessage[],
  latestMsg: string,
  ctx: PatientContext
): string {
  if (history.length === 0) return '';

  const combined = [...history.map(m => m.content), latestMsg].join(' ').toLowerCase();
  const lines: string[] = [];

  const hasChiefComplaint = /pain|cough|breath|fever|rash|diz|head|tummy|stomach|pee|period|sad|tired|unwell|throat|ear|bleed|swelling|vomit|diarrh|weak|numb/.test(combined);
  const acuity = /today|yesterday|this morning|few hours|suddenly|just started/.test(combined) ? 'ACUTE'
    : /week|weeks|month/.test(combined) ? 'SUBACUTE'
    : /year|years|always|chronic|long time/.test(combined) ? 'CHRONIC'
    : null;

  if (hasChiefComplaint) lines.push('✓ Chief complaint established');
  else { lines.push('⬜ Chief complaint not yet established'); return lines.join('\n'); }

  if (acuity) lines.push(`✓ Acuity: ${acuity}`);
  else lines.push('⬜ Acuity: not yet established');

  // System review tracking
  const sysChecks: Record<string, boolean> = {
    'Character of complaint': /character|sharp|dull|burning|crushing|tight|squeezing|throbbing|colicky|aching/.test(combined),
    'Severity': /how bad|small|medium|very bad|1 to 10|score|severe|mild|moderate/.test(combined),
    'Aggravating factors': /worse|aggravat|trigger|provok|exertion|movement/.test(combined),
    'Relieving factors': /better|reliev|help|rest|painkiller|medication|lying/.test(combined),
    'Associated symptoms': /associated|other symptom|fever|nausea|sweat|breath|vomit/.test(combined),
    'System review': /breathing|cough|bowel|urine|vision|headache|weakness|mood|sleep/.test(combined),
  };

  Object.entries(sysChecks).forEach(([k, v]) => lines.push(`${v ? '✓' : '⬜'} ${k}`));

  // Scoring systems tracking
  if (ctx.gender === 'MALE' && ctx.age >= 40) {
    const ipssAsked = /empty|frequency|intermittency|urgency|stream|strain|nocturia|night.{0,20}toilet/.test(combined);
    lines.push(`${ipssAsked ? '✓' : '⬜'} IPSS questions (mandatory male >40)`);
  }
  if (/sore throat|tonsil|pharyngit/.test(combined)) {
    const feverPainAsked = /fever|spot|white|pus|onset|3 day|cough absent/.test(combined);
    lines.push(`${feverPainAsked ? '✓' : '⬜'} FeverPAIN/Centor score data`);
  }
  if (/chest pain|heart/.test(combined)) {
    const heartAsked = /typical|crushing|radiation|risk factor|diabetes|family|cholesterol|hypertens/.test(combined);
    lines.push(`${heartAsked ? '✓' : '⬜'} HEART score history data`);
  }

  // Mental health tracking
  if (/sad|depress|mood|anxiety|stress|worry|hopeless|interest|pleasure/.test(combined)) {
    const phq9Complete = /sleep|energy|tired|appetite|guilty|concentrate|slow|restless|suicid|harm/.test(combined);
    lines.push(`${phq9Complete ? '✓' : '⬜'} PHQ-9 questions (positive screen detected)`);
  } else {
    lines.push('⬜ PHQ-2 mental health screen: not yet asked');
  }

  // TB screen
  const tbScreened = /tb|tuberculosis|night sweat|weight loss|contacts/.test(combined);
  lines.push(`${tbScreened ? '✓' : '⬜'} TB screen`);

  // Baseline
  const baselineChecks: Record<string, boolean> = {
    'Past medical history': /past medical|previous illness|hospital|operation|condition|known/i.test(combined),
    'Medications': /medication|medicine|pills|injection|umuthi|muti|tablet/.test(combined),
    'Allergies': /allerg/.test(combined),
    'Social history': /smok|alcohol|work|job|occup|live|home/.test(combined),
    'Family history': /family|parents|siblings|father|mother|brother|sister/.test(combined),
  };

  Object.entries(baselineChecks).forEach(([k, v]) => lines.push(`${v ? '✓' : '⬜'} ${k}`));

  if (ctx.isReviewConsultation) {
    const dietAsked = /eat|food|diet|salt|sugar|vegetable|fruit|cooking/.test(combined);
    const exAsked = /exercise|activity|walk|gym|sport|active|physical/.test(combined);
    lines.push(`${dietAsked ? '✓' : '⬜'} Diet assessment (review requirement)`);
    lines.push(`${exAsked ? '✓' : '⬜'} Exercise assessment (review requirement)`);
  }

  return lines.join('\n');
}

// ─── Red Flag Detection ───────────────────────────────────────────────────────

const RED_FLAG_PATTERNS = [
  /chest pain.{0,40}(breath|sweat|arm|jaw)/i,
  /can'?t breathe|severe shortness of breath/i,
  /worst headache|thunderclap|sudden severe head/i,
  /cough.{0,20}blood|haemoptysis|hemoptysis/i,
  /vomit.{0,20}blood|haematemesis|coffee.ground/i,
  /confused|unconscious|not waking|seizure|fitting/i,
  /heavy bleeding|soaking|losing a lot of blood/i,
  /stroke|face drooping|arm weak|can'?t speak|facial droop/i,
  /suicid|want to die|kill myself|end my life/i,
  /stiff neck.{0,20}fever|fever.{0,20}stiff neck|meningit/i,
  /severe abdominal|rigid abdomen|guarding/i,
  /drooling.{0,30}swallow|stridor.*severe|severe.*stridor/i,
];

function detectRedFlags(text: string): boolean {
  return RED_FLAG_PATTERNS.some(p => p.test(text));
}

// ─── Session Functions ────────────────────────────────────────────────────────

const HISTORY_WINDOW = 8;

function defaultPatientContext(): PatientContext {
  return { age: 0, gender: 'OTHER', knownConditions: [], currentMedications: [], isSmoker: false, isReviewConsultation: false };
}

function buildOpeningInstruction(language: SaLanguage, patientName: string, literacy: PatientLiteracyLevel, ctx: PatientContext): string {
  const openingQuestion = ctx.isReviewConsultation
    ? 'Great to see you again — how have you been since your last visit?'
    : "What's brought you in today?";

  const persona = ctx.doctorName && ctx.practiceName
    ? `Say exactly: "Hi ${patientName}! I'm ${ctx.practiceName}'s AI health assistant. Everything you share is completely private. ${openingQuestion}"`
    : ctx.doctorName
      ? `Say exactly: "Hi ${patientName}! I'm ${ctx.doctorName}'s AI health assistant. Everything you share is private. ${openingQuestion}"`
      : `Greet ${patientName} warmly in ${SA_LANGUAGE_NAMES[language]}. Say everything they share is private, then ask: "${openingQuestion}"`;

  return persona;
}

export async function startAdaptiveMedicalHistorySession(
  consultationId: string,
  language: SaLanguage,
  patientName: string,
  initialLiteracy: PatientLiteracyLevel = 'UNKNOWN',
  patientContext: PatientContext = defaultPatientContext()
): Promise<AdaptiveResponse> {
  const openingInstruction = buildOpeningInstruction(language, patientName, initialLiteracy, patientContext);

  const response = await anthropic.beta.promptCaching.messages.create({
    model: CLAUDE_HISTORY_MODEL,
    max_tokens: 512,
    system: [
      { type: 'text', text: STATIC_PROTOCOL, cache_control: { type: 'ephemeral' } },
      { type: 'text', text: staticReferenceFor(patientContext.isReviewConsultation), cache_control: { type: 'ephemeral' } },
      { type: 'text', text: buildDynamicContext(language, initialLiteracy, patientContext) },
    ],
    messages: [{ role: 'user', content: openingInstruction }],
  });

  logUsage('history-start', CLAUDE_HISTORY_MODEL, response.usage as TokenUsage);

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
  let literacyLevel = currentLiteracy;
  if (currentLiteracy === 'UNKNOWN') {
    const patientMsgs = conversationHistory
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .concat(patientMessage);
    if (patientMsgs.length >= 1) {
      literacyLevel = await detectLiteracyLevel(patientMsgs);
    }
  }

  const gatheredSummary = buildGatheredSummary(conversationHistory, patientMessage, patientContext);

  const windowedHistory = conversationHistory.slice(-HISTORY_WINDOW);
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    ...windowedHistory.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: patientMessage },
  ];

  const response = await anthropic.beta.promptCaching.messages.create({
    model: CLAUDE_HISTORY_MODEL,
    max_tokens: 1024,
    system: [
      { type: 'text', text: STATIC_PROTOCOL, cache_control: { type: 'ephemeral' } },
      { type: 'text', text: staticReferenceFor(patientContext.isReviewConsultation), cache_control: { type: 'ephemeral' } },
      { type: 'text', text: buildDynamicContext(language, literacyLevel, patientContext, gatheredSummary) },
    ],
    messages,
  });

  logUsage('history-continue', CLAUDE_HISTORY_MODEL, response.usage as TokenUsage);

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
    .map(m => `${m.role === 'user' ? 'PATIENT' : 'ASSISTANT'}: ${m.content}`)
    .join('\n\n');

  const literacyHint = literacyLevel === 'LOW'
    ? 'Patient has LOW health literacy. Translate lay terms: "tummy sore"=abdominal pain, "head spinning"=vertigo, "heart beating fast"=palpitations, "can\'t breathe"=dyspnoea, "chest tight"=chest tightness, "passing urine a lot"=polyuria/frequency, "white spots throat"=tonsillar exudate.'
    : literacyLevel === 'HIGH'
      ? 'Patient uses medical terminology. Extract verbatim.'
      : 'Normalise everyday language to clinical terms.';

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4000,
    system: `You are a medical data extraction AI. Parse a patient-AI conversation and extract structured medical history, including calculating clinical scores where sufficient data exists.

${literacyHint}

SOUTH AFRICAN DRUG IDENTIFICATION — always identify these correctly, never guess:
- Betadexamine: betamethasone 0.25 mg + dexchlorpheniramine 2 mg (CORTICOSTEROID + ANTIHISTAMINE — NOT a B-vitamin or multivitamin)
- Stilpane: paracetamol 320 mg + codeine phosphate 8 mg + caffeine 30 mg (Schedule 5 — opioid-containing)
- Myprodol: ibuprofen 200 mg + codeine phosphate 10 mg + paracetamol 150 mg (Schedule 5)
- Syndol: paracetamol 450 mg + codeine 10 mg + doxylamine succinate 5 mg (Schedule 5, sedating)
- Adco-Alzam / Alzam: alprazolam (benzodiazepine — Schedule 6)
- Grandpa: aspirin 453.6 mg + paracetamol 324 mg + caffeine 65 mg (OTC powder)
- ACC 200: acetylcysteine 200 mg (mucolytic — 200 mg TDS or 600 mg once daily; both are valid)
- Gen-Payne: paracetamol + ibuprofen + codeine (Schedule 5)
- Corlan: hydrocortisone pellets (topical corticosteroid for mouth ulcers)
- Stopayne: paracetamol + codeine + meprobamate (Schedule 5)
- Panado: paracetamol only (OTC analgesic/antipyretic)
- Voltaren: diclofenac sodium (NSAID)
When any medication is mentioned, identify the active ingredient(s), drug class, and SA schedule if known.

Return ONLY a valid JSON object with this exact structure:
{
  "chiefComplaint": "string — primary presenting complaint",
  "acuity": "ACUTE | SUBACUTE | CHRONIC | CHRONIC_REVIEW",
  "historyOfPresentIllness": {
    "onset": "string",
    "duration": "string",
    "severity": "string",
    "character": "string",
    "radiation": "string or 'No radiation'",
    "aggravatingFactors": "string",
    "relievingFactors": "string",
    "associatedSymptoms": "string — full list of associated symptoms discussed, including system-based review findings"
  },
  "pastMedicalHistory": "string",
  "medications": "string — include active ingredient, drug class, and SA schedule for each medication mentioned",
  "allergies": "string",
  "familyHistory": "string",
  "socialHistory": "string — smoking, alcohol (with AUDIT-C score if data available), occupation, living situation, recent travel",
  "systemsReview": "string — summary of all system review findings covered during the history",
  "clinicalScores": "string — calculate and report ALL applicable scores based on history data. Format: '[SCORE_NAME]: [score]/[max] — [interpretation] ([items answered, items requiring examination])'. Include: CRB-65 if respiratory complaint; FeverPAIN + Centor if sore throat; HEART history+risk components if chest pain; Wells PE/DVT if breathlessness or leg swelling; ABCD2 if TIA-like; IPSS if male urinary symptoms; PHQ-2 and PHQ-9 if mood symptoms discussed; GAD-7 if anxiety discussed; AUDIT-C if alcohol assessed; qSOFA if systemically unwell. For each score: (a) list the items captured from history, (b) list items requiring clinical examination, (c) give the history-calculable score, (d) give interpretation.",
  "differentialDiagnoses": "string — MUST include ICD-10 codes. List 3-5 differentials in order of probability. Format each as: '1. [Diagnosis] (ICD-10: X00.0) — Supporting: [key features for]. Against: [features against]'. Consider South African epidemiology: TB, HIV, hypertension, diabetes, rheumatic heart disease.",
  "managementConsiderations": "string — structured as follows (frame as clinical suggestions for the doctor, NOT direct patient advice):\n\nPharmacological:\n- [Drug options, class, reasoning. Flag SA EML/STG-aligned options. Note relevant SA schedule.]\n\nNon-pharmacological:\n- [Rest, hydration, lifestyle modification, patient education, follow-up timing, referral triggers, safety-netting advice]",
  "opportunisticFindings": "string — findings from health promotion or screening discussions (e.g. overdue pap smear, not vaccinated against influenza, sedentary, high-salt diet)",
  "redFlagsIdentified": "string — any red flag symptoms identified (or 'None identified')"
}

Use 'Not asked' or 'Not reported' for sections not covered. Return ONLY the JSON — no markdown, no explanation.`,
    messages: [{ role: 'user', content: `Extract structured history from this consultation:\n\n${transcript}` }],
  });

  logUsage('history-extract', CLAUDE_MODEL, response.usage);

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
  const style = literacyLevel === 'LOW'
    ? 'Very simple words only. Short sentences. No medical terms. Maximum 5 sentences. Be reassuring.'
    : literacyLevel === 'HIGH'
      ? 'Medical terminology is fine. Concise and precise.'
      : 'Plain everyday language. Clear and reassuring.';

  const summary = `Chief Complaint: ${structuredHistory.chiefComplaint}
Onset: ${structuredHistory.historyOfPresentIllness.onset}
Duration: ${structuredHistory.historyOfPresentIllness.duration}
Past Medical History: ${structuredHistory.pastMedicalHistory}
Medications: ${structuredHistory.medications}`;

  const response = await anthropic.messages.create({
    model: CLAUDE_HISTORY_MODEL,
    max_tokens: 512,
    system: `Write a brief, friendly patient summary in ${languageName} they will read before seeing their doctor. ${style}`,
    messages: [{ role: 'user', content: summary }],
  });

  logUsage('patient-summary', CLAUDE_HISTORY_MODEL, response.usage);

  return extractTextContent(response);
}

// ─── Private Helpers ──────────────────────────────────────────────────────────

function extractTextContent(response: Anthropic.Message): string {
  const block = response.content[0];
  return block?.type === 'text' ? block.text : '';
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
    clinicalScores: p.clinicalScores,
    differentialDiagnoses: p.differentialDiagnoses,
    managementConsiderations: p.managementConsiderations,
    opportunisticFindings: p.opportunisticFindings,
    redFlagsIdentified: p.redFlagsIdentified ?? 'None identified',
  };
}

function fallbackStructuredHistory(history: ConversationMessage[]): StructuredMedicalHistory {
  const first = history.find(m => m.role === 'user');
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
    redFlagsIdentified: 'See conversation log',
  };
}
