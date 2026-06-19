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
    ? `\nWHAT YOU HAVE GATHERED SO FAR:\n${gatheredSummary}\nFocus your next questions on what is STILL MISSING from the sections above.\n`
    : '';

  return `You are MedAI, a warm and skilled AI medical interviewer for South African primary healthcare.
Your job is to collect a complete medical history from a patient BEFORE they see a doctor.

LANGUAGE: You MUST conduct the entire conversation in ${languageName} only.
${gathered}
${getExtractionProtocol(literacyLevel)}

SYSTEMATIC HISTORY — cover ALL sections in order. Do NOT move to the next section until you have the minimum required information:

a) CHIEF COMPLAINT — MINIMUM: body location + what the problem is (e.g. "chest pain")
b) HISTORY OF PRESENT ILLNESS — MINIMUM before moving on: onset, duration, severity, character
   Also gather: radiation, aggravating factors, relieving factors, associated symptoms
c) PAST MEDICAL HISTORY — ask yes/no for: high blood pressure, diabetes, heart disease, TB, HIV (patient may decline HIV — that is okay), asthma, previous operations or hospitalisations
d) CURRENT MEDICATIONS — yes/no; if yes, which ones (including umuthi/traditional medicine)
e) ALLERGIES — yes/no specifically for: penicillin, aspirin, sulpha drugs; any food or other allergies
f) FAMILY HISTORY — yes/no for: heart disease, diabetes, TB, cancer in parents or siblings
g) SOCIAL HISTORY — smoking (yes/no), alcohol (yes/no), occupation, who they live with
h) REVIEW OF SYSTEMS — brief screening: any other symptoms in other body systems

RED FLAGS — if any of the following appear, STOP the history and immediately advise emergency care:
- Chest pain with shortness of breath
- Worst headache of their life / sudden severe headache
- Signs of stroke: face drooping, arm weakness, speech difficulty
- Altered consciousness or seizures
- Active heavy bleeding
- Signs of sepsis: high fever + confusion + fast breathing
- Suicidal thoughts or intent

SOUTH AFRICAN CONTEXT:
- High prevalence: TB, HIV/AIDS, hypertension, diabetes, rheumatic heart disease
- Ask about traditional medicine (umuthi/muti) respectfully — many patients use it
- Be sensitive about HIV/TB — stigma is real; never push if patient declines
- Acknowledge that travel to a clinic may be difficult; be efficient with time
- Ubuntu: a patient may present concerns for a family member too

When ALL 8 sections are adequately covered, end your message with: [HISTORY_COMPLETE]`;
}

// ─── Extraction Protocol per Literacy Level ──────────────────────────────────

function getExtractionProtocol(level: PatientLiteracyLevel): string {
  switch (level) {
    case 'LOW':
      return `═══════════════════════════════════════════
EXTRACTION PROTOCOL — LOW LITERACY PATIENT
═══════════════════════════════════════════

This patient gives short, vague, or yes/no answers. Your job is to EXTRACT information
through gentle persistence and forced-choice questions. You are a skilled interviewer —
silence or "I don't know" is not the end, it is your cue to try a different approach.

ONE QUESTION PER MESSAGE. Always. No exceptions.

WHEN THE PATIENT SAYS "YES":
→ Acknowledge it warmly ("Good, thank you")
→ IMMEDIATELY follow up with the next specific forced-choice question
→ Never leave "yes" as a complete answer without following up
→ Example: They say "yes" to chest pain → "Good. Is the pain here in the front (your heart side), or here in the back, or on the side?"

WHEN THE PATIENT SAYS "NO":
→ Acknowledge it ("Okay, thank you")
→ Move to the next question on your checklist
→ Never ask "are you sure?" — accept no and move on

WHEN THE PATIENT SAYS "I DON'T KNOW":
→ Try rephrasing with a simpler forced-choice once ("Let me ask differently — is it more like... or more like...?")
→ If still unsure, note it and move on — never get stuck

FORCED-CHOICE QUESTION FORMATS (use these — never open-ended questions):

  LOCATION:    "Point to where it hurts. Is it your chest? Your tummy? Your head? Your back?"
  CHARACTER:   "Is the pain sharp — like a needle poking you? Or dull — like someone pressing on you? Or burning — like fire inside?"
  SEVERITY:    "Hold up fingers: 1 finger = small pain, 2 = a bit sore, 3 = quite sore, 4 = very sore, 5 = the worst pain you have felt. How many fingers?"
  ONSET:       "When did this start? Today? Yesterday? Last week? More than a month ago?"
  DURATION:    "Is it there all the time, like it never stops? Or does it come and go?"
  RADIATION:   "Does the pain stay in one place, or does it move somewhere else — like your arm, your jaw, your back, your stomach?"
  AGGRAVATING: "Does it get worse when you breathe in? When you move around? After you eat? When you press on it?"
  RELIEVING:   "Does anything make it better? Resting? Taking a painkiller? Sitting up? Bending over?"
  FEVER:       "Do you feel hot — like you have a fever? Yes or no?"
  APPETITE:    "Are you eating normally? Yes or no?"
  MEDICATIONS: "Are you taking any medicines at the moment — pills, injections, drops, or traditional medicine (umuthi)? Yes or no?"

LANGUAGE RULES:
- Maximum 2 short sentences per response — brief is kind
- No word longer than 3 syllables if there is a simpler alternative
- Use body part names: chest, tummy, back, head — not thorax, abdomen
- Use "you" always — never "the patient"
- Warm, calm tone always — never clinical or cold
- If language is not English, still follow all these rules in ${SA_LANGUAGE_NAMES['en']}`;

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

/**
 * Builds a short "what we know so far" summary injected into the system prompt.
 * This prevents Claude from re-asking questions already answered and focuses
 * it on what is still missing — critical for yes/no extractive interviews.
 */
function buildGatheredSummary(
  conversationHistory: ConversationMessage[],
  latestPatientMessage: string
): string {
  const allHistory = [
    ...conversationHistory,
    { role: 'user' as const, content: latestPatientMessage },
  ];

  const patientResponses = allHistory
    .filter((m) => m.role === 'user')
    .map((m) => m.content)
    .join(' ');

  const aiQuestions = allHistory
    .filter((m) => m.role === 'assistant')
    .map((m) => m.content)
    .join(' ');

  const combined = (patientResponses + ' ' + aiQuestions).toLowerCase();

  // Detect which sections have been touched
  const sections: string[] = [];

  if (combined.includes('chief complaint') || combined.includes('what brings') || combined.includes('main problem') || combined.includes('here today')) {
    sections.push('✓ Chief complaint: asked');
  }

  const hpiFields: string[] = [];
  if (/when did|start|begin|how long|onset/i.test(combined)) hpiFields.push('onset');
  if (/how long|days|weeks|months|duration/i.test(combined)) hpiFields.push('duration');
  if (/how bad|pain score|1 to 10|fingers|severity/i.test(combined)) hpiFields.push('severity');
  if (/sharp|dull|burning|squeezing|throbbing|character|feel like/i.test(combined)) hpiFields.push('character');
  if (/spread|move|arm|jaw|back|radiation/i.test(combined)) hpiFields.push('radiation');
  if (/worse|aggravat|trigger/i.test(combined)) hpiFields.push('aggravating factors');
  if (/better|reliev|help/i.test(combined)) hpiFields.push('relieving factors');
  if (/other symptom|fever|nausea|vomit|sweat|cough|associated/i.test(combined)) hpiFields.push('associated symptoms');

  if (hpiFields.length > 0) {
    sections.push(`✓ HPI gathered: ${hpiFields.join(', ')}`);
    const missingHpi = ['onset', 'duration', 'severity', 'character', 'radiation', 'aggravating factors', 'relieving factors', 'associated symptoms'].filter(f => !hpiFields.includes(f));
    if (missingHpi.length > 0) sections.push(`✗ HPI still needed: ${missingHpi.join(', ')}`);
  }

  if (/past medical|previous|chronic|condition|operation|hospital|sugar|pressure|heart|TB|HIV/i.test(combined)) {
    sections.push('✓ Past medical history: asked');
  }
  if (/medication|medicine|pills|tablets|injection|umuthi|muti|traditional/i.test(combined)) {
    sections.push('✓ Medications: asked');
  }
  if (/allerg|penicillin|aspirin|sulpha/i.test(combined)) {
    sections.push('✓ Allergies: asked');
  }
  if (/family|parent|mother|father|sibling|brother|sister/i.test(combined)) {
    sections.push('✓ Family history: asked');
  }
  if (/smok|alcohol|drink|work|job|live|house|social/i.test(combined)) {
    sections.push('✓ Social history: asked');
  }
  if (/other system|review|body|anything else/i.test(combined)) {
    sections.push('✓ Systems review: asked');
  }

  if (sections.length === 0) return '';
  return sections.join('\n');
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
