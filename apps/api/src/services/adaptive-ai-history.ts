/**
 * Adaptive AI Medical History Service
 *
 * Handles multi-turn, multi-language medical history taking with a
 * clinical extraction protocol designed for patients who give minimal,
 * yes/no, or vague answers. Adapts to LOW / MEDIUM / HIGH literacy.
 *
 * Core principle: the AI must EXTRACT information, not WAIT for it.
 * For low-literacy patients it uses forced-choice questions and gentle
 * persistence until minimum clinical data per section is gathered.
 */

import { anthropic, CLAUDE_HISTORY_MODEL, CLAUDE_MODEL } from '../lib/claude.js';
import type {
  SaLanguage,
  ConversationMessage,
  StructuredMedicalHistory,
} from '../types/index.js';
import { SA_LANGUAGE_NAMES } from '../types/index.js';
import type Anthropic from '@anthropic-ai/sdk';

// ─── Types ──────────────────────────────────────────────────────────────────

export type PatientLiteracyLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';

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

const LITERACY_DETECTION_PROMPT = `You are analysing a patient's message to assess their health literacy level.

Assess:
1. Vocabulary — do they use medical terms correctly?
2. Sentence complexity — how elaborate are their descriptions?
3. Specificity — precise details vs vague ("my tummy sore" vs "epigastric pain")
4. Length — single words/grunts vs full sentences

Return ONLY one word: LOW, MEDIUM, or HIGH

LOW:  One or two words. Vague. No medical vocabulary. ("yes", "my chest", "pain bad", "I don't know")
MEDIUM: Everyday sentences. Some detail. May use lay terms. ("I have chest pain for 3 days, nothing helps")
HIGH: Medical vocabulary. Precise descriptions. Dates, drug names, severity scores. ("throbbing right temporal headache, 72h, 7/10, with photophobia")`;

// ─── Core System Prompt ──────────────────────────────────────────────────────

function buildAdaptiveSystemPrompt(
  language: SaLanguage,
  literacyLevel: PatientLiteracyLevel,
  gatheredSummary?: string
): string {
  const languageName = SA_LANGUAGE_NAMES[language];

  const gathered = gatheredSummary
    ? `\nWHAT YOU HAVE GATHERED SO FAR:\n${gatheredSummary}\nFocus ONLY on what is still missing.\n`
    : '';

  return `You are MedAI, a warm and skilled AI medical interviewer for South African primary healthcare.
Your job is to take a focused, relevant medical history from a patient before they see a doctor.

LANGUAGE: Entire conversation in ${languageName} only.
${gathered}
${getExtractionProtocol(literacyLevel)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONSULTATION FLOW — 3 PHASES IN ORDER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PHASE 1 — CHIEF COMPLAINT (always first)
Ask what brings them in. Get: what is the problem + how long it has been happening.
Do NOT ask anything else until you know these two things.

PHASE 2 — COMPLAINT-SPECIFIC QUESTIONS
Once you know the chief complaint, identify which category it falls into below.
Ask ONLY the questions listed for that category — no more, no less.
Do NOT apply every question to every complaint. A cough patient does not need radiation questions.

─── PAIN (chest pain, headache, abdominal pain, back pain, joint pain, ear pain) ───
Must gather: location (which part of the body), duration, severity (small/medium/very bad),
character (sharp/dull/burning/squeezing/throbbing), does it go anywhere else (yes/no),
what makes it worse, what makes it better, anything else happening with it.
For CHEST PAIN specifically also ask: shortness of breath (yes/no), sweating (yes/no), arm or jaw pain (yes/no).
For HEADACHE specifically also ask: sudden or gradual start, any vision problems (yes/no), neck stiffness (yes/no).
For ABDOMINAL PAIN also ask: related to eating or bowel, nausea/vomiting (yes/no), last bowel movement.

─── RESPIRATORY (cough, breathlessness, wheeze, chest tightness) ───
Must gather: how long, dry cough or bringing up stuff (dry/wet), any blood in what you cough up (yes/no),
short of breath (yes/no — if yes: walking/resting/sleeping), chest pain (yes/no),
fever or feeling hot (yes/no), sweating at night (yes/no), weight loss (yes/no).
Note: night sweats + weight loss + cough in SA = TB screen mandatory.

─── FEVER / FEELING UNWELL / INFECTIOUS ───
Must gather: how long, very hot (yes/no), sweating at night (yes/no),
weight loss (yes/no), any cough (yes/no), any sores or wounds (yes/no),
any recent travel (yes/no), any known contacts with TB or sick people.

─── GASTROINTESTINAL (nausea, vomiting, diarrhoea, tummy pain, no appetite) ───
Must gather: how long, vomiting (yes/no — if yes: any blood), diarrhoea (yes/no — if yes: any blood),
tummy pain (yes/no — if yes: where), related to eating (yes/no), last time ate/drank normally.

─── URINARY (pain on peeing, frequent urination, blood in urine, discharge) ───
Must gather: pain when passing urine (yes/no), blood in urine (yes/no),
passing urine more often than usual (yes/no), pain in back or side (yes/no),
any discharge (yes/no — be sensitive, non-judgmental).

─── SKIN / RASH ───
Must gather: where on the body, how long, itchy (yes/no), painful (yes/no),
spreading (yes/no), blisters or open sores (yes/no), fever with it (yes/no).

─── NEUROLOGICAL (dizziness, fainting, fits/seizures, weakness, numbness, vision) ───
Must gather: describe what happens (spinning feeling / blackout / shaking / weakness),
sudden or gradual (sudden = red flag), any weakness in arm or leg (yes/no),
any speech difficulty (yes/no), any fits/shaking (yes/no), vision changes (yes/no).

─── WOMEN'S HEALTH (vaginal discharge, pelvic pain, irregular periods, pregnancy concern) ───
Must gather: last menstrual period, any chance of pregnancy (yes/no),
pain (yes/no), abnormal discharge (yes/no — colour/smell if yes),
any bleeding between periods (yes/no). Ask sensitively and privately.

─── MENTAL HEALTH / MOOD / GENERAL ───
Must gather: how long feeling this way, sleeping (yes/no), eating (yes/no),
how would they describe their mood, any thoughts of hurting themselves (ask directly — red flag).

─── MULTIPLE OR VAGUE COMPLAINTS ───
If patient names more than one problem, ask: "Which one is bothering you most right now?"
Focus Phase 2 on that one. Note the others for the doctor.

PHASE 3 — BASELINE (ask this for EVERY patient, every complaint, always)
Once Phase 2 is complete, ask these in order — brief, yes/no format:
1. Any other illnesses you know of? (high blood pressure / diabetes / heart disease / TB / HIV — patient may decline to answer HIV, that is fine)
2. Any medicines you take? Pills, injections, drops, or traditional medicine (umuthi)? (if yes: which ones)
3. Any allergies to medicines or anything else? (if yes: what happens)
4. Do you smoke? (yes/no) Do you drink alcohol? (yes/no)
5. What kind of work do you do?

Family history and systems review: only ask if directly relevant to the presenting complaint (e.g. family history of heart disease if chest pain; ask about bowel habits if abdominal symptoms). Do not run through them routinely for every patient.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RED FLAGS — STOP AND ESCALATE IMMEDIATELY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If any of these appear, stop the history and tell the patient to seek emergency care now:
- Chest pain + shortness of breath
- Sudden worst headache of their life
- Face drooping / arm weakness / speech difficulty (stroke)
- Fitting or loss of consciousness
- Active heavy bleeding
- High fever + confusion + fast breathing (sepsis)
- Suicidal thoughts

SA CONTEXT:
- TB, HIV, hypertension, diabetes are all high prevalence — screen appropriately
- Never push if patient declines HIV question — note "patient declined" and move on
- Ask about umuthi/traditional medicine without judgment — it affects drug interactions
- Be warm, patient, never rushed

When Phase 2 AND Phase 3 are complete, end with: [HISTORY_COMPLETE]`;
}

// ─── Extraction Protocol per Literacy Level ──────────────────────────────────

function getExtractionProtocol(level: PatientLiteracyLevel): string {
  switch (level) {
    case 'LOW':
      return `═══════════════════════════════════════════
EXTRACTION PROTOCOL — LOW LITERACY PATIENT
═══════════════════════════════════════════

This patient gives short, vague, or yes/no answers via text chat.
Your job is to EXTRACT information through gentle persistence and forced-choice questions.
You are a skilled interviewer — "yes", "no", or silence is your cue to follow up, not to wait.

ONE QUESTION PER MESSAGE. Always. No exceptions.

WHEN THE PATIENT SAYS "YES":
→ Acknowledge warmly ("Good, thank you")
→ IMMEDIATELY ask the next specific forced-choice question to get more detail
→ Never leave "yes" as a complete answer
→ Example: patient says "yes" to chest pain
  → "Good. Is the pain in the front of your chest, or your back, or your side?"

WHEN THE PATIENT SAYS "NO":
→ Acknowledge ("Okay, thank you")
→ Move straight to the next question — never ask "are you sure?"

WHEN THE PATIENT SAYS "I DON'T KNOW":
→ Try once with a simpler forced-choice: "Let me ask it differently — is it more like X or more like Y?"
→ If still unsure after one try, say "That's okay" and move on

FORCED-CHOICE FORMATS FOR CHAT (no pointing, no gestures — text only):

  LOCATION:    "Is the pain in your chest? Your tummy? Your head? Your back? Or somewhere else?"
  CHARACTER:   "Is the pain sharp — like something poking you? Or dull — like something heavy pressing? Or burning?"
  SEVERITY:    "Is the pain small and bearable? Medium — quite sore? Or very bad — hard to handle?"
  ONSET:       "Did this start today? Yesterday? Last week? Or more than a week ago?"
  DURATION:    "Is it there all the time without stopping? Or does it come and go?"
  SPREAD:      "Does the pain stay in one place, or does it move somewhere else — like your arm or your back?"
  WORSE:       "Does it get worse when you breathe in? When you walk? After you eat?"
  BETTER:      "Does anything make it better — like resting, or taking a painkiller?"
  FEVER:       "Do you feel hot, like you have a temperature? Yes or no?"
  MEDICATIONS: "Are you taking any medicines — pills, drops, injections, or traditional medicine (umuthi)? Yes or no?"

LANGUAGE RULES:
- Maximum 2 short sentences per message
- Body part words only: chest, tummy, back, head — not thorax, abdomen, epigastric
- Always "you" — never "the patient"
- Warm and calm — never clinical or cold
- If the patient's language is not English, apply these same rules in their language`;

    case 'MEDIUM':
      return `════════════════════════════════════════════
EXTRACTION PROTOCOL — MEDIUM LITERACY PATIENT
════════════════════════════════════════════

This patient understands everyday language and can give basic descriptions but may not know medical terms.

ONE to TWO related questions per message.

WHEN ANSWERS ARE VAGUE:
→ Follow up with a gentle prompt: "Can you tell me a bit more? For example, is it like X or more like Y?"
→ Use comparison analogies to help them describe: "Is the pain constant, or does it come and go?"
→ Never criticise a vague answer — always work with what they give you

FORCED-CHOICE FOR DIFFICULT QUESTIONS:
- Pain character: "Is it sharp, dull, burning, squeezing, or throbbing?"
- Severity: "On a scale of 1 to 10, where 1 is barely noticeable and 10 is unbearable — what number?"
- Timing: "Did it start suddenly, or gradually get worse over time?"

LANGUAGE RULES:
- Plain everyday English (or patient's language)
- If you use a medical term, immediately explain it in brackets: "shortness of breath (feeling like you can't get enough air)"
- Warm, encouraging tone
- Moderate length responses — clear and structured`;

    case 'HIGH':
      return `══════════════════════════════════════════
EXTRACTION PROTOCOL — HIGH LITERACY PATIENT
══════════════════════════════════════════

This patient uses medical vocabulary and can give precise descriptions. Be efficient.

Up to THREE related questions per message.

Use standard clinical frameworks:
- SOCRATES for pain: Site, Onset, Character, Radiation, Associations, Timing, Exacerbating, Severity
- If they mention a condition, probe appropriately (e.g. if they mention HTN, ask about BP control, medications, end-organ damage)
- Standard scales are fine: NRS, NYHA, GOLD, etc.
- Assume familiarity with common medications and conditions

Be thorough but efficient. Remain warm.`;

    case 'UNKNOWN':
    default:
      return `══════════════════════════════════════════
EXTRACTION PROTOCOL — LITERACY UNKNOWN
══════════════════════════════════════════

Start with simple, clear questions. Assess the patient's response to calibrate.

If their first answer is one word or very short → treat as LOW literacy, switch to forced-choice questions.
If their first answer is a clear sentence → treat as MEDIUM, proceed with plain language.
If their first answer shows medical knowledge → treat as HIGH, be efficient.

ONE question per message until you have calibrated.

Default forced-choice opening: "What is the main problem that brought you here today? Is it pain? Breathing problems? Feeling unwell? Or something else?"`;
  }
}

// ─── Literacy Detection ──────────────────────────────────────────────────────

export async function detectLiteracyLevel(
  patientMessages: string[]
): Promise<PatientLiteracyLevel> {
  if (patientMessages.length === 0) return 'UNKNOWN';

  const combinedText = patientMessages.join('\n\n');

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 10,
      system: LITERACY_DETECTION_PROMPT,
      messages: [{ role: 'user', content: `Assess literacy: "${combinedText}"` }],
    });

    const text = extractTextContent(response).trim().toUpperCase();
    if (text === 'LOW' || text === 'MEDIUM' || text === 'HIGH') {
      return text as PatientLiteracyLevel;
    }
    return 'MEDIUM';
  } catch (err) {
    console.error('[AdaptiveAI] Literacy detection failed:', err);
    return 'UNKNOWN';
  }
}

// ─── Session Management ──────────────────────────────────────────────────────

/**
 * Start a new adaptive history session.
 * For unknown literacy, opens with a forced-choice chief complaint question.
 */
export async function startAdaptiveMedicalHistorySession(
  consultationId: string,
  language: SaLanguage,
  patientName: string,
  initialLiteracy: PatientLiteracyLevel = 'UNKNOWN'
): Promise<AdaptiveResponse> {
  const openingPrompt = buildOpeningPrompt(language, patientName, initialLiteracy);

  const response = await anthropic.messages.create({
    model: CLAUDE_HISTORY_MODEL,
    max_tokens: 512,
    system: buildAdaptiveSystemPrompt(language, initialLiteracy),
    messages: [{ role: 'user', content: openingPrompt }],
  });

  const message = extractTextContent(response);
  const isComplete = message.includes('[HISTORY_COMPLETE]');
  const redFlagDetected = detectRedFlags(message);

  return {
    message: message.replace('[HISTORY_COMPLETE]', '').trim(),
    isComplete,
    literacyLevel: initialLiteracy,
    redFlagDetected,
  };
}

/**
 * Continue an adaptive session.
 * Detects literacy from early answers, builds a "gathered so far" summary
 * to inject into the system prompt so Claude knows what it still needs.
 */
export async function continueAdaptiveMedicalHistorySession(
  conversationHistory: ConversationMessage[],
  patientMessage: string,
  language: SaLanguage,
  currentLiteracy: PatientLiteracyLevel
): Promise<AdaptiveResponse> {
  // Detect literacy after first patient response if still unknown
  let literacyLevel = currentLiteracy;
  if (currentLiteracy === 'UNKNOWN') {
    const patientMessages = conversationHistory
      .filter((m) => m.role === 'user')
      .map((m) => m.content)
      .concat(patientMessage);

    if (patientMessages.length >= 1) {
      literacyLevel = await detectLiteracyLevel(patientMessages);
    }
  }

  // Build "gathered so far" summary for context injection
  const gatheredSummary = buildGatheredSummary(conversationHistory, patientMessage);

  // Build messages array including new patient message
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    ...conversationHistory.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: patientMessage },
  ];

  const response = await anthropic.messages.create({
    model: CLAUDE_HISTORY_MODEL,
    max_tokens: 1024,
    system: buildAdaptiveSystemPrompt(language, literacyLevel, gatheredSummary),
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

/**
 * Extract structured history from a completed conversation.
 * Includes literacy-aware lay-term interpretation.
 */
export async function extractAdaptiveStructuredHistory(
  conversationHistory: ConversationMessage[],
  literacyLevel: PatientLiteracyLevel
): Promise<StructuredMedicalHistory> {
  const transcript = conversationHistory
    .map((m) => `${m.role === 'user' ? 'PATIENT' : 'ASSISTANT'}: ${m.content}`)
    .join('\n\n');

  const literacyHint =
    literacyLevel === 'LOW'
      ? 'IMPORTANT: Patient has LOW health literacy. Translate lay descriptions to clinical equivalents. Examples: "tummy sore" = abdominal pain, "head spinning" = vertigo/dizziness, "heart beating fast" = palpitations, "can\'t breathe" = dyspnoea, "my chest tight" = chest tightness. Extract clinical meaning from imprecise language.'
      : literacyLevel === 'HIGH'
        ? 'Patient uses accurate medical terminology. Extract verbatim where possible.'
        : 'Patient uses everyday language. Normalise to clinical equivalents where needed.';

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    system: `You are a medical data extraction AI. Parse a patient-AI conversation and extract structured medical history.

${literacyHint}

Return ONLY a valid JSON object with this exact structure:
{
  "chiefComplaint": "string",
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
  "systemsReview": "string"
}

Use "Not asked" or "Not reported" for sections not covered. Return ONLY JSON — no markdown, no explanation.`,
    messages: [
      {
        role: 'user',
        content: `Extract structured medical history from this conversation:\n\n${transcript}`,
      },
    ],
  });

  const text = extractTextContent(response);

  try {
    return normaliseStructuredHistory(JSON.parse(text) as Partial<StructuredMedicalHistory>);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return normaliseStructuredHistory(
          JSON.parse(jsonMatch[0]) as Partial<StructuredMedicalHistory>
        );
      } catch {
        // fallthrough
      }
    }
    console.error('[AdaptiveAI] Failed to parse structured history:', text.substring(0, 200));
    return fallbackStructuredHistory(conversationHistory);
  }
}

/**
 * Generate a literacy-appropriate patient summary of their consultation.
 */
export async function generatePatientFriendlySummary(
  structuredHistory: StructuredMedicalHistory,
  language: SaLanguage,
  literacyLevel: PatientLiteracyLevel
): Promise<string> {
  const languageName = SA_LANGUAGE_NAMES[language];
  const complexityInstruction =
    literacyLevel === 'LOW'
      ? 'Use VERY simple words. Short sentences only. No medical terms at all. Maximum 5 sentences.'
      : literacyLevel === 'HIGH'
        ? 'Use appropriate medical terminology. Concise and precise.'
        : 'Use plain everyday language with minimal jargon. Clear and reassuring.';

  const historyText = `
Chief Complaint: ${structuredHistory.chiefComplaint}
Onset: ${structuredHistory.historyOfPresentIllness.onset}
Duration: ${structuredHistory.historyOfPresentIllness.duration}
Severity: ${structuredHistory.historyOfPresentIllness.severity}
Character: ${structuredHistory.historyOfPresentIllness.character}
Past Medical History: ${structuredHistory.pastMedicalHistory}
Medications: ${structuredHistory.medications}
Allergies: ${structuredHistory.allergies}
  `.trim();

  const response = await anthropic.messages.create({
    model: CLAUDE_HISTORY_MODEL,
    max_tokens: 512,
    system: `You are a patient communication specialist. Write a brief, friendly summary in ${languageName} of what the patient told you, that they can read before seeing their doctor. ${complexityInstruction} Be reassuring, not alarming.`,
    messages: [
      { role: 'user', content: `Write a patient-friendly summary:\n\n${historyText}` },
    ],
  });

  return extractTextContent(response);
}

// ─── Private: Gathered Summary Builder ───────────────────────────────────────

type ComplaintCategory =
  | 'PAIN'
  | 'RESPIRATORY'
  | 'FEVER'
  | 'GASTROINTESTINAL'
  | 'URINARY'
  | 'SKIN'
  | 'NEUROLOGICAL'
  | 'WOMENS_HEALTH'
  | 'MENTAL_HEALTH'
  | 'UNKNOWN';

function detectComplaintCategory(combined: string): ComplaintCategory {
  if (/chest pain|headache|head pain|tummy pain|stomach pain|abdominal|back pain|joint pain|ear pain|sore throat|tooth/.test(combined)) return 'PAIN';
  if (/cough|short of breath|breathless|wheez|chest tight|can't breathe/.test(combined)) return 'RESPIRATORY';
  if (/fever|temperature|feeling hot|unwell|sick|tired|weight loss|night sweat/.test(combined)) return 'FEVER';
  if (/nausea|vomit|diarrhea|diarrhoea|stomach|tummy|no appetite|not eating|constip/.test(combined)) return 'GASTROINTESTINAL';
  if (/pee|urine|urinate|bladder|discharge|burning urine/.test(combined)) return 'URINARY';
  if (/rash|skin|itch|blister|sore|wound/.test(combined)) return 'SKIN';
  if (/dizzy|dizziness|faint|blackout|fit|seizure|numb|weak|vision|headache/.test(combined)) return 'NEUROLOGICAL';
  if (/period|menstrual|vaginal|pregnant|pregnancy/.test(combined)) return 'WOMENS_HEALTH';
  if (/sad|depressed|anxious|can't sleep|mood|mental|stress/.test(combined)) return 'MENTAL_HEALTH';
  return 'UNKNOWN';
}

/**
 * Builds a phase-aware "gathered so far" note injected into each system prompt.
 * Tracks the 3-phase structure: chief complaint → complaint-specific → baseline.
 * Prevents re-asking already answered questions — critical for yes/no interviews.
 */
function buildGatheredSummary(
  conversationHistory: ConversationMessage[],
  latestPatientMessage: string
): string {
  if (conversationHistory.length === 0) return '';

  const allHistory = [
    ...conversationHistory,
    { role: 'user' as const, content: latestPatientMessage },
  ];

  const combined = allHistory.map((m) => m.content).join(' ').toLowerCase();
  const lines: string[] = [];

  // ── Phase 1: Chief complaint ─────────────────────────────────────────────
  const category = detectComplaintCategory(combined);
  if (category !== 'UNKNOWN') {
    lines.push(`PHASE 1 COMPLETE — Chief complaint identified: ${category.replace('_', ' ')}`);
  } else {
    lines.push('PHASE 1 IN PROGRESS — Still establishing chief complaint');
    return lines.join('\n');
  }

  // ── Phase 2: Complaint-specific tracking ─────────────────────────────────
  const p2: string[] = [];
  const p2missing: string[] = [];

  if (category === 'PAIN') {
    if (/chest|tummy|back|head|stomach|arm|leg|joint|ear/.test(combined)) p2.push('location');
    else p2missing.push('location');
    if (/how long|days|weeks|started/.test(combined)) p2.push('duration');
    else p2missing.push('duration');
    if (/small|medium|bad|sore|pain score|1 to 10|bearable/.test(combined)) p2.push('severity');
    else p2missing.push('severity');
    if (/sharp|dull|burning|squeezing|pressing|throbbing/.test(combined)) p2.push('character');
    else p2missing.push('character');
    if (/spread|move|anywhere else|arm|jaw/.test(combined)) p2.push('radiation');
    else p2missing.push('radiation');
    if (/worse|aggravat|breathe|walk|eat/.test(combined)) p2.push('aggravating');
    else p2missing.push('aggravating');
    if (/better|reliev|rest|painkiller/.test(combined)) p2.push('relieving');
    else p2missing.push('relieving');
    if (combined.includes('chest pain')) {
      if (/short of breath|breathless/.test(combined)) p2.push('chest: breathlessness asked');
      else p2missing.push('chest: breathlessness');
      if (/sweat/.test(combined)) p2.push('chest: sweating asked');
      else p2missing.push('chest: sweating');
    }
  }

  if (category === 'RESPIRATORY') {
    if (/dry|wet|bringing up|phlegm|sputum/.test(combined)) p2.push('cough type');
    else p2missing.push('cough type (dry or wet)');
    if (/blood|haemoptysis/.test(combined)) p2.push('haemoptysis asked');
    else p2missing.push('blood in sputum');
    if (/short of breath|breathless/.test(combined)) p2.push('breathlessness asked');
    else p2missing.push('breathlessness');
    if (/night sweat/.test(combined)) p2.push('night sweats asked');
    else p2missing.push('night sweats');
    if (/weight loss|losing weight/.test(combined)) p2.push('weight loss asked');
    else p2missing.push('weight loss');
  }

  if (category === 'GASTROINTESTINAL') {
    if (/vomit/.test(combined)) p2.push('vomiting asked');
    else p2missing.push('vomiting');
    if (/diarrhea|diarrhoea|loose stool/.test(combined)) p2.push('diarrhoea asked');
    else p2missing.push('diarrhoea');
    if (/eating|appetite|food/.test(combined)) p2.push('relation to eating asked');
    else p2missing.push('relation to food');
  }

  if (category === 'FEVER') {
    if (/night sweat/.test(combined)) p2.push('night sweats asked');
    else p2missing.push('night sweats');
    if (/weight loss/.test(combined)) p2.push('weight loss asked');
    else p2missing.push('weight loss');
    if (/cough/.test(combined)) p2.push('cough asked');
    else p2missing.push('cough (TB screen)');
    if (/contact|tb|tuberculosis/.test(combined)) p2.push('TB contact asked');
    else p2missing.push('TB contact');
  }

  if (p2.length > 0) lines.push(`PHASE 2 gathered: ${p2.join(', ')}`);
  if (p2missing.length > 0) lines.push(`PHASE 2 still needed: ${p2missing.join(', ')}`);
  else if (p2.length > 0) lines.push('PHASE 2 COMPLETE — move to Phase 3 baseline');

  // ── Phase 3: Baseline tracking ───────────────────────────────────────────
  const p3: string[] = [];
  const p3missing: string[] = [];

  if (/blood pressure|diabetes|heart|tb|hiv|illness|condition|hospital/.test(combined)) p3.push('past medical history');
  else p3missing.push('past medical history');
  if (/medicine|medication|pills|injection|umuthi|traditional/.test(combined)) p3.push('medications');
  else p3missing.push('medications');
  if (/allerg/.test(combined)) p3.push('allergies');
  else p3missing.push('allergies');
  if (/smok|alcohol|drink|work|job/.test(combined)) p3.push('social history');
  else p3missing.push('social history');

  if (p3.length > 0) lines.push(`PHASE 3 gathered: ${p3.join(', ')}`);
  if (p3missing.length > 0 && p2missing.length === 0) lines.push(`PHASE 3 still needed: ${p3missing.join(', ')}`);

  return lines.join('\n');
}

// ─── Red Flag Detection ──────────────────────────────────────────────────────

const RED_FLAG_PATTERNS = [
  /chest pain/i,
  /can'?t breathe|difficulty breath|shortness of breath|dyspn/i,
  /worst headache|thunder|sudden severe head/i,
  /cough.{0,20}blood|haemoptysis|hemoptysis/i,
  /vomit.{0,20}blood|haematemesis/i,
  /confused|unconscious|not waking|seizure|fit/i,
  /heavy bleeding|soaking pad|losing a lot of blood/i,
  /stroke|face drooping|arm weak|can'?t speak/i,
  /suicid|want to die|kill myself/i,
  /high fever.{0,30}stiff neck|meningit/i,
];

function detectRedFlags(text: string): boolean {
  return RED_FLAG_PATTERNS.some((pattern) => pattern.test(text));
}

// ─── Opening Prompts ─────────────────────────────────────────────────────────

function buildOpeningPrompt(
  language: SaLanguage,
  patientName: string,
  literacy: PatientLiteracyLevel
): string {
  const forceSimple = literacy === 'LOW' || literacy === 'UNKNOWN';
  const note = forceSimple
    ? ' Use forced-choice for the first question: "What is the main problem today — is it pain? Breathing? Feeling unwell? Or something else?"'
    : literacy === 'HIGH'
      ? ' Be professional and efficient.'
      : '';

  const greetings: Record<SaLanguage, string> = {
    en: `Greet ${patientName} warmly in English and open the medical history.${note}`,
    zu: `Greet ${patientName} warmly in isiZulu and open the medical history.${note}`,
    xh: `Greet ${patientName} warmly in isiXhosa and open the medical history.${note}`,
    af: `Greet ${patientName} warmly in Afrikaans and open the medical history.${note}`,
    nso: `Greet ${patientName} warmly in Sepedi and open the medical history.${note}`,
    tn: `Greet ${patientName} warmly in Setswana and open the medical history.${note}`,
    st: `Greet ${patientName} warmly in Sesotho and open the medical history.${note}`,
    ts: `Greet ${patientName} warmly in Xitsonga and open the medical history.${note}`,
    ss: `Greet ${patientName} warmly in Siswati and open the medical history.${note}`,
    ve: `Greet ${patientName} warmly in Tshivenda and open the medical history.${note}`,
    nr: `Greet ${patientName} warmly in isiNdebele and open the medical history.${note}`,
  };
  return greetings[language];
}

// ─── Private Helpers ─────────────────────────────────────────────────────────

function extractTextContent(response: Anthropic.Message): string {
  const block = response.content[0];
  if (block?.type === 'text') return block.text;
  return '';
}

function getSuggestedFollowUp(literacy: PatientLiteracyLevel, language: SaLanguage): string {
  if (language !== 'en') return '';
  switch (literacy) {
    case 'LOW':    return 'Answer as best you can — there are no wrong answers.';
    case 'HIGH':   return 'Please be as specific as possible with dates and measurements.';
    default:       return 'Take your time — answer as best you can.';
  }
}

function normaliseStructuredHistory(
  parsed: Partial<StructuredMedicalHistory>
): StructuredMedicalHistory {
  return {
    chiefComplaint: parsed.chiefComplaint ?? 'Not reported',
    historyOfPresentIllness: {
      onset: parsed.historyOfPresentIllness?.onset ?? 'Not reported',
      duration: parsed.historyOfPresentIllness?.duration ?? 'Not reported',
      severity: parsed.historyOfPresentIllness?.severity ?? 'Not reported',
      character: parsed.historyOfPresentIllness?.character ?? 'Not reported',
      radiation: parsed.historyOfPresentIllness?.radiation ?? 'No radiation',
      aggravatingFactors: parsed.historyOfPresentIllness?.aggravatingFactors ?? 'None reported',
      relievingFactors: parsed.historyOfPresentIllness?.relievingFactors ?? 'None reported',
      associatedSymptoms: parsed.historyOfPresentIllness?.associatedSymptoms ?? 'None reported',
    },
    pastMedicalHistory: parsed.pastMedicalHistory ?? 'None reported',
    medications: parsed.medications ?? 'None',
    allergies: parsed.allergies ?? 'NKDA (No Known Drug Allergies)',
    familyHistory: parsed.familyHistory ?? 'Not reported',
    socialHistory: parsed.socialHistory ?? 'Not reported',
    systemsReview: parsed.systemsReview ?? 'Not reported',
  };
}

function fallbackStructuredHistory(
  conversationHistory: ConversationMessage[]
): StructuredMedicalHistory {
  const firstPatientMsg = conversationHistory.find((m) => m.role === 'user');
  return {
    chiefComplaint: firstPatientMsg?.content ?? 'Unable to extract — see conversation log',
    historyOfPresentIllness: {
      onset: 'See conversation log',
      duration: 'See conversation log',
      severity: 'See conversation log',
      character: 'See conversation log',
    },
    pastMedicalHistory: 'See conversation log',
    medications: 'See conversation log',
    allergies: 'See conversation log',
    familyHistory: 'See conversation log',
    socialHistory: 'See conversation log',
    systemsReview: 'See conversation log',
  };
}
