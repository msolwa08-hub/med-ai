/**
 * AI Medical History Taking Service
 *
 * Handles multi-turn, multi-language medical history taking using Claude.
 * Supports all 11 South African official languages.
 *
 * Flow:
 *   1. startMedicalHistorySession — greet patient, ask chief complaint
 *   2. continueMedicalHistorySession — systematic history taking (HPI, PMH, meds, etc.)
 *   3. extractStructuredHistory — parse conversation → structured data
 *   4. generateDifferentialDiagnosis — produce differential with ICD codes
 */

import { anthropic, CLAUDE_MODEL, CLAUDE_HISTORY_MODEL, logUsage } from '../lib/claude.js';
import type {
  SaLanguage,
  ConversationMessage,
  StructuredMedicalHistory,
  DiagnosisEntry,
} from '../types/index.js';
import { SA_LANGUAGE_NAMES } from '../types/index.js';

// ============================================================
// System prompts
// ============================================================

const HISTORY_SYSTEM_PROMPT = `You are MedAI, an empathetic and professional AI medical assistant for South African healthcare.

Your role is to take a thorough medical history from a patient before they see a doctor.

CRITICAL RULES:
1. Always communicate in the patient's chosen language: {LANGUAGE_NAME}
2. Be warm, empathetic, and culturally sensitive to the South African context
3. Ask one or two questions at a time — never overwhelm the patient
4. Use simple, everyday language (avoid medical jargon unless necessary)
5. Systematically cover ALL of these areas in order:
   a) Chief Complaint — main reason for the visit
   b) History of Present Illness (HPI):
      - Onset: when did it start?
      - Duration: how long has it lasted?
      - Severity: how bad is it (1-10 scale)?
      - Character: what does it feel like? (sharp, dull, burning, etc.)
      - Radiation: does it spread anywhere?
      - Aggravating factors: what makes it worse?
      - Relieving factors: what makes it better?
      - Associated symptoms: any other symptoms?
   c) Past Medical History — chronic conditions, hospitalisations, surgeries
   d) Current Medications — including traditional/herbal medicines
   e) Allergies — medications, foods, environmental
   f) Family History — parents, siblings, chronic illness
   g) Social History — smoking, alcohol, recreational drugs, occupation, living situation
   h) Review of Systems — brief screening of other body systems

6. Be alert to Red Flag symptoms (chest pain + dyspnoea, severe headache, signs of sepsis, active bleeding, altered consciousness) — if present, advise the patient to seek emergency care immediately
7. Consider South African-prevalent conditions: TB, HIV/AIDS, hypertension, diabetes, malaria (endemic areas), rheumatic heart disease
8. When you have gathered ALL sections, end your message with exactly this text on a new line: [HISTORY_COMPLETE]

CULTURAL SENSITIVITY:
- Many patients use traditional medicine (umuthi/muti) — ask non-judgmentally
- Acknowledge limited healthcare access in rural areas
- Be sensitive to HIV/TB stigma
- Respect Ubuntu philosophy: a patient may present on behalf of family
`;

const EXTRACTION_SYSTEM_PROMPT = `You are a medical data extraction AI. Your job is to parse a conversation between a patient and an AI medical assistant, and extract the structured medical history.

You MUST return a valid JSON object with EXACTLY this structure:
{
  "chiefComplaint": "string — the main reason for the visit",
  "historyOfPresentIllness": {
    "onset": "string — when symptoms started",
    "duration": "string — how long symptoms have lasted",
    "severity": "string — severity description or numeric scale",
    "character": "string — quality/nature of symptoms",
    "radiation": "string — where symptoms spread (or 'No radiation')",
    "aggravatingFactors": "string — what makes it worse",
    "relievingFactors": "string — what makes it better",
    "associatedSymptoms": "string — other accompanying symptoms"
  },
  "pastMedicalHistory": "string — chronic conditions, operations, hospitalisations",
  "medications": "string — current medications including traditional/herbal",
  "allergies": "string — drug and other allergies",
  "familyHistory": "string — relevant family medical history",
  "socialHistory": "string — smoking, alcohol, occupation, living situation",
  "systemsReview": "string — findings from systems review"
}

Use "Not asked" or "Not reported" for sections not covered. Never leave fields empty.
Return ONLY the JSON — no explanation, no markdown code blocks.`;

const DIAGNOSIS_SYSTEM_PROMPT = `You are a clinical decision support AI assisting South African healthcare professionals.

Based on a patient's structured medical history, generate a differential diagnosis list.

IMPORTANT:
- This is for CLINICAL DECISION SUPPORT, not direct patient advice
- A qualified HPCSA-registered doctor will review and confirm all diagnoses
- Consider South African epidemiology: high prevalence of TB, HIV, hypertension, diabetes, rheumatic heart disease, and in endemic regions, malaria
- Consider limited diagnostic resources in primary care settings

Return a JSON array with 3-6 differential diagnoses:
[
  {
    "diagnosis": "Full diagnosis name",
    "icdCode": "ICD-10 code (e.g. J18.9)",
    "probability": "HIGH | MEDIUM | LOW",
    "reasoning": "Brief clinical reasoning based on the history (2-3 sentences)"
  }
]

Order from most to least likely. Return ONLY the JSON array.`;

// ============================================================
// Session management helpers
// ============================================================

function buildSystemPrompt(language: SaLanguage): string {
  const languageName = SA_LANGUAGE_NAMES[language];
  return HISTORY_SYSTEM_PROMPT.replace('{LANGUAGE_NAME}', languageName);
}

// ============================================================
// Public API
// ============================================================

/**
 * Start a new medical history session.
 * Returns the AI's opening greeting in the patient's language.
 */
export async function startMedicalHistorySession(
  consultationId: string,
  language: SaLanguage,
  patientName: string
): Promise<{ message: string; isComplete: boolean }> {
  const openingPrompt = buildOpeningPrompt(language, patientName);

  const response = await anthropic.messages.create({
    model: CLAUDE_HISTORY_MODEL,
    max_tokens: 1024,
    system: buildSystemPrompt(language),
    messages: [
      {
        role: 'user',
        content: openingPrompt,
      },
    ],
  });

  logUsage('ai-history-start', CLAUDE_HISTORY_MODEL, response.usage);

  const message = extractTextContent(response);
  const isComplete = message.includes('[HISTORY_COMPLETE]');

  return {
    message: message.replace('[HISTORY_COMPLETE]', '').trim(),
    isComplete,
  };
}

/**
 * Continue a medical history conversation with the patient's response.
 */
export async function continueMedicalHistorySession(
  conversationHistory: ConversationMessage[],
  patientMessage: string,
  language: SaLanguage
): Promise<{ message: string; isComplete: boolean }> {
  // Build the messages array for Claude
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  for (const msg of conversationHistory) {
    messages.push({
      role: msg.role,
      content: msg.content,
    });
  }

  // Add the new patient message
  messages.push({ role: 'user', content: patientMessage });

  const response = await anthropic.messages.create({
    model: CLAUDE_HISTORY_MODEL,
    max_tokens: 1024,
    system: buildSystemPrompt(language),
    messages,
  });

  logUsage('ai-history-continue', CLAUDE_HISTORY_MODEL, response.usage);

  const message = extractTextContent(response);
  const isComplete = message.includes('[HISTORY_COMPLETE]');

  return {
    message: message.replace('[HISTORY_COMPLETE]', '').trim(),
    isComplete,
  };
}

/**
 * Extract structured history from a completed conversation.
 */
export async function extractStructuredHistory(
  conversationHistory: ConversationMessage[]
): Promise<StructuredMedicalHistory> {
  // Build a readable transcript
  const transcript = conversationHistory
    .map((m) => `${m.role === 'user' ? 'PATIENT' : 'ASSISTANT'}: ${m.content}`)
    .join('\n\n');

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    system: EXTRACTION_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Extract the structured medical history from this conversation:\n\n${transcript}`,
      },
    ],
  });

  logUsage('ai-history-extract', CLAUDE_MODEL, response.usage);

  const text = extractTextContent(response);

  try {
    // Try to parse directly
    const parsed = JSON.parse(text) as StructuredMedicalHistory;
    return normaliseStructuredHistory(parsed);
  } catch {
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]) as StructuredMedicalHistory;
        return normaliseStructuredHistory(parsed);
      } catch {
        // Fallback
      }
    }

    // Return a minimal structure if parsing fails
    console.error('[AI] Failed to parse extracted history:', text.substring(0, 200));
    return fallbackStructuredHistory(conversationHistory);
  }
}

/**
 * Generate differential diagnoses from structured history.
 * Considers South African epidemiology.
 */
export async function generateDifferentialDiagnosis(
  structuredHistory: StructuredMedicalHistory,
  patientAge: number,
  patientGender: string
): Promise<DiagnosisEntry[]> {
  const historyText = formatHistoryForDiagnosis(structuredHistory, patientAge, patientGender);

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    system: DIAGNOSIS_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: historyText,
      },
    ],
  });

  logUsage('ai-diagnosis', CLAUDE_MODEL, response.usage);

  const text = extractTextContent(response);

  try {
    // Direct parse
    const parsed = JSON.parse(text) as DiagnosisEntry[];
    return validateDiagnosisArray(parsed);
  } catch {
    // Extract JSON array from response
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        const parsed = JSON.parse(arrayMatch[0]) as DiagnosisEntry[];
        return validateDiagnosisArray(parsed);
      } catch {
        // Fallback
      }
    }

    console.error('[AI] Failed to parse differential diagnosis:', text.substring(0, 200));
    return [];
  }
}

// ============================================================
// Private helpers
// ============================================================

function extractTextContent(response: Anthropic.Message): string {
  const block = response.content[0];
  if (block?.type === 'text') return block.text;
  return '';
}

function buildOpeningPrompt(language: SaLanguage, patientName: string): string {
  const prompts: Record<SaLanguage, string> = {
    en: `Please greet ${patientName} in English and begin the medical history. Ask them what brings them in today.`,
    zu: `Please greet ${patientName} in isiZulu and begin the medical history. Ask them what brings them in today.`,
    xh: `Please greet ${patientName} in isiXhosa and begin the medical history.`,
    af: `Please greet ${patientName} in Afrikaans and begin the medical history.`,
    nso: `Please greet ${patientName} in Sepedi and begin the medical history.`,
    tn: `Please greet ${patientName} in Setswana and begin the medical history.`,
    st: `Please greet ${patientName} in Sesotho and begin the medical history.`,
    ts: `Please greet ${patientName} in Xitsonga and begin the medical history.`,
    ss: `Please greet ${patientName} in Siswati and begin the medical history.`,
    ve: `Please greet ${patientName} in Tshivenda and begin the medical history.`,
    nr: `Please greet ${patientName} in isiNdebele and begin the medical history.`,
  };
  return prompts[language];
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
  // Use the first patient message as chief complaint
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

function validateDiagnosisArray(arr: unknown[]): DiagnosisEntry[] {
  return arr
    .filter(
      (item): item is DiagnosisEntry =>
        typeof item === 'object' &&
        item !== null &&
        'diagnosis' in item &&
        'icdCode' in item &&
        'probability' in item &&
        'reasoning' in item
    )
    .map((item) => ({
      diagnosis: String(item.diagnosis),
      icdCode: String(item.icdCode),
      probability: (['HIGH', 'MEDIUM', 'LOW'].includes(String(item.probability))
        ? item.probability
        : 'LOW') as DiagnosisEntry['probability'],
      reasoning: String(item.reasoning),
    }));
}

function formatHistoryForDiagnosis(
  history: StructuredMedicalHistory,
  age: number,
  gender: string
): string {
  return `
Patient Demographics:
- Age: ${age} years
- Gender: ${gender}
- Setting: South Africa

Chief Complaint: ${history.chiefComplaint}

History of Present Illness:
- Onset: ${history.historyOfPresentIllness.onset}
- Duration: ${history.historyOfPresentIllness.duration}
- Severity: ${history.historyOfPresentIllness.severity}
- Character: ${history.historyOfPresentIllness.character}
- Radiation: ${history.historyOfPresentIllness.radiation ?? 'None'}
- Aggravating factors: ${history.historyOfPresentIllness.aggravatingFactors ?? 'None'}
- Relieving factors: ${history.historyOfPresentIllness.relievingFactors ?? 'None'}
- Associated symptoms: ${history.historyOfPresentIllness.associatedSymptoms ?? 'None'}

Past Medical History: ${history.pastMedicalHistory}
Current Medications: ${history.medications}
Allergies: ${history.allergies}
Family History: ${history.familyHistory}
Social History: ${history.socialHistory}
Review of Systems: ${history.systemsReview}

Please generate a differential diagnosis considering South African epidemiology.
`.trim();
}

// Re-export Anthropic type for response typing
import type Anthropic from '@anthropic-ai/sdk';
