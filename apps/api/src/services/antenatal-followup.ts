/**
 * Antenatal Follow-Up AI Service — returning-patient interval history.
 *
 * Distinct from og-history.ts (the FIRST obstetric/gynae visit, which
 * establishes LMP/EDD/gravida/para from scratch). This module is for every
 * subsequent ANC visit: it inherits pregnancy context from the patient's most
 * recent obstetric visit (across consultations — pulled and decrypted by the
 * route layer, since each consultation has its own encryption key), computes
 * the current gestational age, and runs a focused INTERVAL history — what's
 * changed since last visit, danger-sign recheck, adherence — rather than
 * re-asking the full booking history.
 */

import { anthropic, CLAUDE_HISTORY_MODEL, CLAUDE_MODEL } from '../lib/claude.js';
import type { SaLanguage, ConversationMessage } from '../types/index.js';
import { SA_LANGUAGE_NAMES } from '../types/index.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PriorPregnancyContext {
  lmp?: string; // ISO date, if known
  edd?: string; // ISO date, if known
  gravida?: string;
  para?: string;
  lastVisitSummary?: string; // clinical summary from the most recent ANC visit
  lastVisitDate?: string; // ISO date
  visitNumber?: number; // how many ANC visits recorded so far, this being N+1
}

export interface FollowUpPatientContext {
  age: number;
  language: SaLanguage;
  prior: PriorPregnancyContext;
}

export interface AntenatalFollowUpResult {
  gestationalAgeAtVisit: string;
  intervalHistory: string;
  fetalMovements: string;
  dangerSignsScreen: string;
  adherence: string;
  currentConcerns: string;
  clinicalSummary: string;
  managementSuggestions: string[];
  redFlags: string[];
  urgency: 'ROUTINE' | 'SOON' | 'URGENT' | 'EMERGENCY';
}

export interface FollowUpSessionResponse {
  message: string;
  isComplete: boolean;
  redFlagDetected: boolean;
}

const COMPLETE_TOKEN = '[ANC_FOLLOWUP_COMPLETE]';

// ─── Gestational age calculation ──────────────────────────────────────────────

/** Naegele's rule: EDD = LMP + 280 days. Returns null if lmp is not a valid date. */
export function calculateEDD(lmpIso: string): string | null {
  const lmp = new Date(lmpIso);
  if (Number.isNaN(lmp.getTime())) return null;
  const edd = new Date(lmp.getTime() + 280 * 24 * 3600 * 1000);
  return edd.toISOString().slice(0, 10);
}

/** Current gestational age in "Nw+d" format from LMP to today (or a reference date). */
export function calculateGestationalAge(lmpIso: string, asOf: Date = new Date()): string | null {
  const lmp = new Date(lmpIso);
  if (Number.isNaN(lmp.getTime())) return null;
  const days = Math.floor((asOf.getTime() - lmp.getTime()) / (24 * 3600 * 1000));
  if (days < 0) return null;
  const weeks = Math.floor(days / 7);
  const remDays = days % 7;
  return `${weeks}w${remDays}d`;
}

// ─── System prompt ─────────────────────────────────────────────────────────────

function buildFollowUpSystemPrompt(language: SaLanguage, context: FollowUpPatientContext): string {
  const langName = SA_LANGUAGE_NAMES[language];
  const { prior } = context;
  const gaNow = prior.lmp ? calculateGestationalAge(prior.lmp) : null;

  const knownContext = [
    prior.gravida !== undefined ? `Gravida: ${prior.gravida}` : null,
    prior.para !== undefined ? `Para: ${prior.para}` : null,
    prior.lmp ? `LMP: ${prior.lmp}` : null,
    prior.edd ? `EDD: ${prior.edd}` : null,
    gaNow ? `Estimated gestational age today: ${gaNow}` : null,
    prior.visitNumber ? `This is ANC visit number ${prior.visitNumber}` : null,
    prior.lastVisitDate ? `Last visit was on: ${prior.lastVisitDate}` : null,
    prior.lastVisitSummary ? `Summary from last visit: ${prior.lastVisitSummary}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  return `You are MedAI O&G Follow-Up, a specialist antenatal AI assistant for South African healthcare professionals.
You are taking an ANTENATAL FOLLOW-UP (interval) history from a returning pregnant patient (age ${context.age}).
Always communicate in ${langName}. Use simple, warm, non-medical language.

KNOWN CONTEXT FROM PRIOR VISIT(S) — do NOT re-ask for this, confirm briefly then move on:
${knownContext || 'No prior visit on record — confirm LMP and basic obstetric history briefly before continuing, as this may be this patient\'s first recorded visit on this platform.'}

FOLLOW-UP HISTORY FRAMEWORK — this is an INTERVAL visit, not a full booking history. Cover ALL sections but keep it efficient (this patient has already given a full history before):

1. CONFIRM GESTATIONAL AGE: "Based on your dates, you should be about [X weeks] pregnant now — does that sound right, or has anything changed (like a scan giving a different date)?"

2. INTERVAL HISTORY SINCE LAST VISIT:
   - "How have you been feeling since your last visit?"
   - Any new symptoms: nausea, heartburn, swelling, headaches, visual changes
   - Any clinic/hospital visits since then

3. FETAL MOVEMENTS (if gestational age >18-20 weeks):
   - "Have you been feeling baby move? How does that compare to before?"
   - Any reduction or absence of movement

4. RED FLAG SCREEN — actively check EVERY visit:
   - Vaginal bleeding since last visit
   - Reduced/absent fetal movements
   - Severe headache, visual disturbance, or epigastric pain (pre-eclampsia)
   - Swelling of face/hands (new or worsening)
   - Fever or feeling unwell
   - Leaking fluid or contractions (if <37 weeks, this is preterm labour — urgent)

5. ADHERENCE & SELF-CARE:
   - "Have you been able to take your iron/folic acid tablets?" (and ARVs/other chronic medication if applicable)
   - Diet, rest, any concerns about home situation affecting the pregnancy

6. CURRENT CONCERNS / QUESTIONS:
   - Open question: "Is there anything worrying you about the pregnancy that you'd like to ask about?"

SA CONTEXT:
- ANC protocol: aim for 8 contact visits for low-risk pregnancies (Bettercare/DoH guidelines)
- Continue reinforcing HIV/ART adherence and TB symptom screening at every contact if relevant
- Consider transport/access barriers when discussing missed visits — ask supportively, not judgementally

When all sections are covered, end your message with exactly: ${COMPLETE_TOKEN}

CRITICAL RED FLAGS — if ANY detected, advise emergency assessment immediately:
- Active vaginal bleeding
- Reduced or absent fetal movements
- Severe headache + visual changes + epigastric pain
- Ruptured membranes or regular contractions before 37 weeks
- Temperature >38.5°C`;
}

// ─── Session functions ────────────────────────────────────────────────────────

function extractText(response: Awaited<ReturnType<typeof anthropic.messages.create>>): string {
  return (response as { content: Array<{ type: string; text?: string }> }).content
    .filter((b) => b.type === 'text')
    .map((b) => b.text ?? '')
    .join('');
}

function detectFollowUpRedFlags(text: string): boolean {
  const flags = [
    'bleeding', 'blood', 'bleed',
    'no movement', 'not moving', 'stopped moving', 'reduced movement', 'less movement',
    'severe headache', 'vision', 'visual', 'flashing',
    'swelling of', 'swollen face', 'swollen hands',
    'fever', 'feeling unwell', 'very sick',
    'leaking', 'waters', 'contractions', 'tightening',
  ];
  const lower = text.toLowerCase();
  return flags.some((f) => lower.includes(f));
}

export async function startFollowUpSession(
  patientName: string,
  language: SaLanguage,
  context: FollowUpPatientContext
): Promise<FollowUpSessionResponse> {
  const systemPrompt = buildFollowUpSystemPrompt(language, context);
  const opening = `Greet ${patientName} warmly back for their antenatal follow-up visit. Briefly confirm the gestational age from the known context, then begin the interval history.`;

  const response = await anthropic.messages.create({
    model: CLAUDE_HISTORY_MODEL,
    max_tokens: 512,
    system: systemPrompt,
    messages: [{ role: 'user', content: opening }],
  });

  const message = extractText(response);
  const isComplete = message.includes(COMPLETE_TOKEN);

  return {
    message: message.replace(COMPLETE_TOKEN, '').trim(),
    isComplete,
    redFlagDetected: detectFollowUpRedFlags(message),
  };
}

export async function continueFollowUpSession(
  conversationHistory: ConversationMessage[],
  patientMessage: string,
  language: SaLanguage,
  context: FollowUpPatientContext
): Promise<FollowUpSessionResponse> {
  const systemPrompt = buildFollowUpSystemPrompt(language, context);

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
    redFlagDetected: detectFollowUpRedFlags(message + ' ' + patientMessage),
  };
}

// ─── Extraction ───────────────────────────────────────────────────────────────

export async function extractFollowUpHistory(
  conversationHistory: ConversationMessage[],
  context: FollowUpPatientContext
): Promise<AntenatalFollowUpResult> {
  const conversationText = conversationHistory
    .map((m) => `${m.role === 'assistant' ? 'AI' : 'Patient'}: ${m.content}`)
    .join('\n');

  const gaNow = context.prior.lmp ? calculateGestationalAge(context.prior.lmp) : undefined;

  const extractionPrompt = `Extract a structured antenatal follow-up note from this conversation.
Patient age: ${context.age}, language: ${context.language}
${gaNow ? `Calculated gestational age at this visit: ${gaNow}` : ''}
${context.prior.lastVisitSummary ? `Prior visit summary: ${context.prior.lastVisitSummary}` : ''}

CONVERSATION:
${conversationText}

Return ONLY valid JSON matching this schema:
{
  "gestationalAgeAtVisit": "string — e.g. '28w3d', confirmed/corrected during the conversation",
  "intervalHistory": "string — what has happened/changed since the last visit",
  "fetalMovements": "string — description, or 'Not yet applicable (<20 weeks)' if too early",
  "dangerSignsScreen": "string — each danger sign asked and the answer",
  "adherence": "string — medication/supplement adherence and any barriers",
  "currentConcerns": "string — any questions or worries raised by the patient",
  "clinicalSummary": "string — concise clinical summary for the doctor",
  "managementSuggestions": ["array of strings — SA ANC protocol-aligned suggestions"],
  "redFlags": ["array of strings — identified red flags, empty array if none"],
  "urgency": "ROUTINE | SOON | URGENT | EMERGENCY"
}`;

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1536,
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
      gestationalAgeAtVisit: gaNow ?? 'Unknown',
      intervalHistory: 'Extraction failed — see conversation log.',
      fetalMovements: 'Not recorded',
      dangerSignsScreen: 'Not recorded',
      adherence: 'Not recorded',
      currentConcerns: 'Not recorded',
      clinicalSummary: 'History extraction failed — see conversation log.',
      managementSuggestions: [],
      redFlags: [],
      urgency: 'ROUTINE',
    };
  }

  return JSON.parse(jsonStr.slice(start, end + 1)) as AntenatalFollowUpResult;
}
