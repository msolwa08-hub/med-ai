/**
 * Adaptive AI Medical History Service
 *
 * Extends the base medical history service with patient literacy detection
 * and adaptive questioning strategies. Adjusts language complexity,
 * question style, and explanation depth based on detected literacy level.
 *
 * Literacy Levels:
 *   LOW    — simple words, one question, lots of examples, visual analogies
 *   MEDIUM — plain language, some medical terms with explanation
 *   HIGH   — standard medical terminology, efficient multi-question turns
 *   UNKNOWN — start neutral, detect from first 2 patient responses
 */

import { anthropic, CLAUDE_HISTORY_MODEL, CLAUDE_MODEL } from '../lib/claude.js';
import type {
  SaLanguage,
  ConversationMessage,
  StructuredMedicalHistory,
} from '../types/index.js';
import { SA_LANGUAGE_NAMES } from '../types/index.js';
import type Anthropic from '@anthropic-ai/sdk';

// ============================================================
// Types
// ============================================================

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

// ============================================================
// Literacy Detection Prompt
// ============================================================

const LITERACY_DETECTION_PROMPT = `You are analysing a patient's message to determine their health literacy level.

Assess the following criteria:
1. Vocabulary — do they use medical terms correctly?
2. Sentence complexity — how elaborate are their descriptions?
3. Specificity — do they give precise details (onset dates, severity scores) or vague descriptions?
4. Question quality — do they ask informed follow-up questions?

Return ONLY one word: LOW, MEDIUM, or HIGH

LOW: Simple vocabulary, short sentences, vague descriptions (e.g. "my tummy sore", "head pain bad")
MEDIUM: Everyday language, some detail, may misuse medical terms (e.g. "I have a headache for 3 days, painkiller not helping")
HIGH: Good medical vocabulary, precise descriptions, dates, medication names (e.g. "I've had a throbbing right-sided headache for 72 hours with photophobia")`;

// ============================================================
// Adaptive System Prompts
// ============================================================

function buildAdaptiveSystemPrompt(
  language: SaLanguage,
  literacyLevel: PatientLiteracyLevel
): string {
  const languageName = SA_LANGUAGE_NAMES[language];
  const adaptationInstructions = getAdaptationInstructions(literacyLevel);

  return `You are MedAI, a warm and caring AI medical assistant for South African healthcare.
Your role is to take a thorough medical history from a patient before they see a doctor.

LANGUAGE: Always communicate in ${languageName}.

PATIENT LITERACY ADAPTATION — THIS PATIENT IS LEVEL: ${literacyLevel}
${adaptationInstructions}

SYSTEMATIC HISTORY (cover all in order):
a) Chief Complaint — main reason for visit
b) History of Present Illness: onset, duration, severity (1-10), character, radiation, aggravating/relieving factors, associated symptoms
c) Past Medical History — chronic conditions, hospitalisations, surgeries
d) Current Medications — include traditional/herbal medicines (umuthi/muti)
e) Allergies — medications, foods, environmental
f) Family History — parents, siblings, chronic illness
g) Social History — smoking, alcohol, recreational drugs, occupation, living situation
h) Review of Systems — brief screening of other body systems

RED FLAGS — if any present, immediately advise emergency care:
- Chest pain with shortness of breath
- Severe sudden headache ("worst of my life")
- Signs of sepsis (fever + confusion + rapid breathing)
- Active heavy bleeding
- Altered consciousness or seizures
- Signs of stroke (facial droop, arm weakness, speech difficulty)

SOUTH AFRICAN CONTEXT:
- Consider TB, HIV/AIDS, hypertension, diabetes, rheumatic heart disease
- Ask non-judgmentally about traditional medicine
- Be sensitive to HIV/TB stigma
- Acknowledge healthcare access challenges in rural areas
- Respect Ubuntu: patient may present concerns for family members too

When ALL sections are covered, end with exactly: [HISTORY_COMPLETE]`;
}

function getAdaptationInstructions(level: PatientLiteracyLevel): string {
  switch (level) {
    case 'LOW':
      return `IMPORTANT — this patient has LOW health literacy. You MUST:
- Use the SIMPLEST possible words (Grade 3 level)
- Ask ONLY ONE question per message
- Use body part names, not medical terms (say "chest" not "thorax", "tummy" not "abdomen")
- Use analogies (e.g. "Is the pain sharp like a knife, or dull like a heavy weight?")
- Confirm understanding frequently ("Do you understand what I mean?")
- Avoid numbers where possible; use descriptive scales ("a little pain", "very bad pain")
- If they seem confused, rephrase in even simpler terms
- Short, warm sentences — never more than 3 sentences per response
- Use "you" not "the patient"`;

    case 'MEDIUM':
      return `This patient has MEDIUM health literacy. You MUST:
- Use plain everyday language with brief explanations of any medical terms
- Ask one or two questions per message
- Provide context for medical terms in brackets (e.g. "shortness of breath (feeling like you can't get enough air)")
- Use a 1-10 pain scale but explain it ("where 1 is barely noticeable and 10 is the worst pain imaginable")
- Be warm and encouraging; check for understanding occasionally
- Responses of moderate length — clear and structured`;

    case 'HIGH':
      return `This patient has HIGH health literacy. You MAY:
- Use appropriate medical terminology
- Ask up to three related questions per message for efficiency
- Reference standard medical frameworks (SOCRATES, systems review)
- Use clinical scales naturally (NRS, NYHA, etc.)
- Assume understanding of common medications and conditions
- Be professional and efficient while remaining warm
- Detailed responses are appropriate`;

    case 'UNKNOWN':
    default:
      return `Patient literacy is UNKNOWN — use NEUTRAL approach:
- Use plain language (no jargon, no oversimplification)
- Ask one to two questions per message
- Watch their response for clues about literacy level
- Be warm, clear, and culturally sensitive
- Avoid assumptions about education or understanding`;
  }
}

// ============================================================
// Core Functions
// ============================================================

/**
 * Detect patient literacy level from their message(s).
 * Called after the first 1-2 patient responses.
 */
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
      messages: [
        {
          role: 'user',
          content: `Assess this patient's health literacy:\n\n"${combinedText}"`,
        },
      ],
    });

    const text = extractTextContent(response).trim().toUpperCase();
    if (text === 'LOW' || text === 'MEDIUM' || text === 'HIGH') {
      return text as PatientLiteracyLevel;
    }
    return 'MEDIUM'; // Safe default
  } catch (err) {
    console.error('[AdaptiveAI] Literacy detection failed:', err);
    return 'UNKNOWN';
  }
}

/**
 * Start an adaptive medical history session.
 * Returns the AI's opening greeting adapted to the language.
 * Initial literacy is UNKNOWN until first patient response.
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
    messages: [
      {
        role: 'user',
        content: openingPrompt,
      },
    ],
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
 * Continue an adaptive medical history conversation.
 * Detects literacy level from early patient messages and adapts.
 */
export async function continueAdaptiveMedicalHistorySession(
  conversationHistory: ConversationMessage[],
  patientMessage: string,
  language: SaLanguage,
  currentLiteracy: PatientLiteracyLevel
): Promise<AdaptiveResponse> {
  // Detect literacy after 1-2 patient messages if still UNKNOWN
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

  // Build messages array
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  for (const msg of conversationHistory) {
    messages.push({ role: msg.role, content: msg.content });
  }
  messages.push({ role: 'user', content: patientMessage });

  const response = await anthropic.messages.create({
    model: CLAUDE_HISTORY_MODEL,
    max_tokens: 1024,
    system: buildAdaptiveSystemPrompt(language, literacyLevel),
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
 * Extract structured history — same as base service but with literacy-aware
 * extraction hints for better handling of non-standard descriptions.
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
      ? 'Note: Patient has low health literacy — interpret lay descriptions (e.g. "tummy sore" = abdominal pain, "head spinning" = dizziness/vertigo). Translate lay terms to clinical equivalents.'
      : literacyLevel === 'HIGH'
        ? 'Patient has high health literacy and uses accurate medical terminology.'
        : 'Patient uses everyday language; normalise descriptions to clinical terms.';

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    system: `You are a medical data extraction AI. Parse a patient-AI conversation and extract structured medical history.

${literacyHint}

Return ONLY a valid JSON object with this structure:
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

Use "Not asked" or "Not reported" for uncovered sections. Return ONLY JSON — no markdown.`,
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
 * Used to show the patient what will be shared with their doctor.
 */
export async function generatePatientFriendlySummary(
  structuredHistory: StructuredMedicalHistory,
  language: SaLanguage,
  literacyLevel: PatientLiteracyLevel
): Promise<string> {
  const languageName = SA_LANGUAGE_NAMES[language];
  const complexityInstruction =
    literacyLevel === 'LOW'
      ? 'Use very simple words. Short sentences. No medical jargon at all.'
      : literacyLevel === 'HIGH'
        ? 'Use appropriate medical terminology. Be concise and precise.'
        : 'Use plain, everyday language with minimal jargon.';

  const historyText = `
Chief Complaint: ${structuredHistory.chiefComplaint}
Symptoms: ${structuredHistory.historyOfPresentIllness.onset}, ${structuredHistory.historyOfPresentIllness.character}, severity ${structuredHistory.historyOfPresentIllness.severity}
Past Medical History: ${structuredHistory.pastMedicalHistory}
Medications: ${structuredHistory.medications}
Allergies: ${structuredHistory.allergies}
  `.trim();

  const response = await anthropic.messages.create({
    model: CLAUDE_HISTORY_MODEL,
    max_tokens: 512,
    system: `You are a patient communication specialist. Write a brief, friendly summary of a patient's medical history in ${languageName} that they will read before seeing their doctor. ${complexityInstruction} Be reassuring, not alarming.`,
    messages: [
      {
        role: 'user',
        content: `Write a patient-friendly summary of this medical history:\n\n${historyText}`,
      },
    ],
  });

  return extractTextContent(response);
}

// ============================================================
// Private Helpers
// ============================================================

function extractTextContent(response: Anthropic.Message): string {
  const block = response.content[0];
  if (block?.type === 'text') return block.text;
  return '';
}

function buildOpeningPrompt(
  language: SaLanguage,
  patientName: string,
  literacy: PatientLiteracyLevel
): string {
  const literacyNote =
    literacy === 'LOW'
      ? ' Use the simplest words possible. One short question only.'
      : literacy === 'HIGH'
        ? ' Be professional and efficient.'
        : '';

  const prompts: Record<SaLanguage, string> = {
    en: `Please greet ${patientName} warmly in English and ask them what brings them in today.${literacyNote}`,
    zu: `Please greet ${patientName} warmly in isiZulu and ask what brings them in today.${literacyNote}`,
    xh: `Please greet ${patientName} warmly in isiXhosa and ask what brings them in today.${literacyNote}`,
    af: `Please greet ${patientName} warmly in Afrikaans and ask what brings them in today.${literacyNote}`,
    nso: `Please greet ${patientName} warmly in Sepedi and ask what brings them in today.${literacyNote}`,
    tn: `Please greet ${patientName} warmly in Setswana and ask what brings them in today.${literacyNote}`,
    st: `Please greet ${patientName} warmly in Sesotho and ask what brings them in today.${literacyNote}`,
    ts: `Please greet ${patientName} warmly in Xitsonga and ask what brings them in today.${literacyNote}`,
    ss: `Please greet ${patientName} warmly in Siswati and ask what brings them in today.${literacyNote}`,
    ve: `Please greet ${patientName} warmly in Tshivenda and ask what brings them in today.${literacyNote}`,
    nr: `Please greet ${patientName} warmly in isiNdebele and ask what brings them in today.${literacyNote}`,
  };
  return prompts[language];
}

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

function getSuggestedFollowUp(literacy: PatientLiteracyLevel, language: SaLanguage): string {
  if (language !== 'en') return '';
  switch (literacy) {
    case 'LOW':
      return 'Answer in your own words — there are no wrong answers.';
    case 'HIGH':
      return 'Please be as specific as possible with dates and measurements.';
    default:
      return 'Take your time — answer as best you can.';
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
    allergies: parsed.allergies ?? 'NKDA',
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
