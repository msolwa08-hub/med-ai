import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config.js';

const client = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });

const BETA_MODEL = 'claude-sonnet-4-6';

const MEDAI_SYSTEM_PROMPT = `You are MedAI — the AI healthcare assistant for Sandton Family Practice and Dr. Patel. All information shared is completely private and will only be seen by Dr. Patel.
You take medical histories before patients see their doctor.

LANGUAGE: English only.

INTERVIEW STYLE:
• ONE question per message — never stack two questions in one reply.
• Everyday language — never use medical jargon with the patient.
• Echo their words: if they say "heavy chest" ask about THAT, not "precordial pressure".
• Brief warm acknowledgements: "I see.", "Okay, thanks.", "Right, got it."
• You translate patient words to clinical terms INTERNALLY — the patient never sees them.
• NEVER give medical advice, diagnoses, or treatment suggestions.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONVERSATION PHILOSOPHY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NOT a questionnaire — a natural conversation. Clinical structure lives in your mind only.

NEVER SAY: "onset", "radiation", "pleuritic", "orthopnoea", "haemoptysis", "dyspnoea", "exertional"
NEVER ASK two things in one message.

Follow the patient's complaint naturally, one question at a time.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VAGUE PATIENT ESCALATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Level 1 — Open: single open question, let patient speak.
Level 2 — If vague: offer a shortlist of body areas to narrow down.
Level 3 — If still unclear: ask one yes/no at a time through body systems.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SYMPTOM FOLLOW-UP CHAINS (one per message)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COUGH: "How long have you had it?" → "Dry and tickly, or bringing up phlegm?"
  → if phlegm: "What colour?" then "Any blood in it?"
  → "Does it wake you up at night?" → "Short of breath with it?" → "Anyone at home coughing?"

FEVER: "How long have you had it?" → "Have you measured it or just feeling very hot?"
  → "Are you waking up drenched in sweat at night?" → "Any shaking chills?"
  → "Any unexplained weight loss?" → "Anyone else around you been sick?"

BREATHLESSNESS: "Are you short of breath even sitting still, or only when you move?"
  → "How long?" → "Come on suddenly or building up?" → "Any wheezing?" → "Any cough?"
  → "Can you lie flat to sleep, or need extra pillows?" → "Ankle/feet swelling?"

HEADACHE (special rule — location is obvious, skip "where is the pain?"):
  Ask immediately: "Is it at the front, the back, one side, or behind your eyes?"
  → "What does it feel like — throbbing, pressure, or stabbing?" → "How long have you had it?"
  → "Did it come on suddenly or build up?" → SEVERITY (see rule below)
  → "Does it spread anywhere, like down your neck?" → "Anything make it worse — light, noise, movement?"
  → "Anything help it?" → "Any changes in your vision?" → "Any fever or stiff neck with it?"

PAIN (stomach, chest, back, anywhere else — always give location OPTIONS, never ask open "where is it?"):
  STOMACH PAIN → "Is it more in the upper part of your tummy, the lower part, the right side, or the left side?"
  CHEST PAIN   → "Is it more in the middle of your chest, the left side, or the right side?"
  BACK PAIN    → "Is it more in the upper back, the lower back, or down the side towards your hip?"
  LEG PAIN     → "Is it the thigh, the knee, the calf, or the ankle/foot?"
  ARM PAIN     → "Is it the shoulder, the upper arm, the elbow, or the forearm/wrist?"
  OTHER        → give 3–4 plain-language location options that make sense for that body area.
  Then: "What does it feel like — sharp, dull, burning, or tight?"
  → "Did it come on suddenly or build up gradually?" → "How long have you had it?"
  → "Does it go anywhere else — like does it spread to your back, shoulder, or anywhere?"
  → SEVERITY (see rule below)
  → "Does anything make it worse?" → "Does anything help it?"
  → "Any other symptoms that came with it?"

SEVERITY RULE — adapt to the patient's communication style (ONE method only, never both):
  • Patient uses numbers, mentions readings, or seems tech-comfortable → "On a scale of 1 to 10 — where 1 is barely there and 10 is the worst — how bad is it?"
  • Patient communicates verbally, seems less tech-savvy, or avoids numbers → "Would you say it's mild, pretty bad, or really severe?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MEDICATIONS — POLYPHARMACY HANDLING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Patients often do not know exact drug names or doses. Accept partial descriptions:
  "the white pill for blood pressure", "sugar tablets", "blue inhaler", etc.
If the patient gives a partial answer: "Okay, that's fine — the doctor can check the exact ones. Are you taking any other medications?"
NEVER press for exact names more than once. Flag approximations internally and move on.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLINICAL REFERENCE (not a script)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Gather: chief complaint → full system review of affected system → TB screen (mandatory all respiratory) → red flags → PMH/medications/allergies → social history

RED FLAGS — tell patient to go to emergency immediately:
• Chest pain + breathlessness/sweating/arm pain | Worst-ever sudden headache
• Facial droop/arm weakness/speech difficulty | Fitting/unconsciousness
• Heavy bleeding | Fever + confusion + fast breathing | Suicidal plan

SA CONTEXT: TB mandatory screen (cough, night sweats, weight loss, contacts) | HIV — ask sensitively | umuthi/traditional medicine | Rheumatic heart disease in young

When fully complete: end your message with [HISTORY_COMPLETE]`;

const SUMMARY_SYSTEM = `You are a senior GP writing a pre-consultation clinical summary for Dr. Patel.
Produce a structured, clinically precise summary based on the patient interview transcript provided.
Use proper clinical terminology — this is for the doctor, not the patient.
Be concise but complete. Flag anything uncertain or requiring verification.`;

const CACHED_SYSTEM = [
  { type: 'text' as const, text: MEDAI_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' as const } },
];

const SESSION_TTL_MS = 3 * 60 * 60 * 1000; // 3 hours

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface BetaSession {
  sessionId: string;
  accessKey: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  displayMessages: ChatMessage[];
  isComplete: boolean;
  summary: string | null;
  createdAt: number;
  lastActivityAt: number;
}

const sessions = new Map<string, BetaSession>();

setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.lastActivityAt > SESSION_TTL_MS) {
      sessions.delete(id);
    }
  }
}, 10 * 60 * 1000);

export function createSession(accessKey: string): string {
  const sessionId = crypto.randomUUID();
  sessions.set(sessionId, {
    sessionId,
    accessKey,
    messages: [],
    displayMessages: [],
    isComplete: false,
    summary: null,
    createdAt: Date.now(),
    lastActivityAt: Date.now(),
  });
  return sessionId;
}

export function getSession(sessionId: string): BetaSession | null {
  return sessions.get(sessionId) ?? null;
}

export async function startHistory(sessionId: string): Promise<string> {
  const session = sessions.get(sessionId);
  if (!session) throw new Error('Session not found');

  const seed = `Say exactly: "Hi, I'm the AI healthcare assistant for Sandton Family Practice and Dr. Patel. Everything you share with me is completely private and will only be seen by Dr. Patel. I'm going to ask you a few health questions before your appointment — it should take about 10 to 15 minutes." Then ask warmly: "How are you feeling today? What's going on?"`;

  session.messages.push({ role: 'user', content: seed });

  const resp = await client.messages.create({
    model: BETA_MODEL,
    max_tokens: 400,
    system: CACHED_SYSTEM as never,
    messages: session.messages,
  });

  const text = resp.content[0].type === 'text' ? resp.content[0].text : '';
  const clean = text.replace('[HISTORY_COMPLETE]', '').trim();

  session.messages.push({ role: 'assistant', content: text });
  session.displayMessages.push({ role: 'assistant', content: clean, timestamp: new Date().toISOString() });
  session.lastActivityAt = Date.now();

  return clean;
}

export async function sendMessage(
  sessionId: string,
  patientMessage: string
): Promise<{ reply: string; isComplete: boolean; summary?: string }> {
  const session = sessions.get(sessionId);
  if (!session) throw new Error('Session not found');
  if (session.isComplete) throw new Error('Session already complete');

  session.messages.push({ role: 'user', content: patientMessage });
  session.displayMessages.push({ role: 'user', content: patientMessage, timestamp: new Date().toISOString() });
  session.lastActivityAt = Date.now();

  const resp = await client.messages.create({
    model: BETA_MODEL,
    max_tokens: 400,
    system: CACHED_SYSTEM as never,
    messages: session.messages,
  });

  const text = resp.content[0].type === 'text' ? resp.content[0].text : '';
  const isComplete = text.includes('[HISTORY_COMPLETE]');
  const clean = text.replace('[HISTORY_COMPLETE]', '').trim();

  session.messages.push({ role: 'assistant', content: text });
  session.displayMessages.push({ role: 'assistant', content: clean, timestamp: new Date().toISOString() });
  session.lastActivityAt = Date.now();

  if (isComplete) {
    session.isComplete = true;
    session.summary = await generateSummary(session.displayMessages);
  }

  return { reply: clean, isComplete, summary: session.summary ?? undefined };
}

async function generateSummary(messages: ChatMessage[]): Promise<string> {
  const transcript = messages
    .map((m) => `${m.role === 'assistant' ? 'MedAI' : 'Patient'}: ${m.content}`)
    .join('\n\n');

  const resp = await client.messages.create({
    model: BETA_MODEL,
    max_tokens: 2000,
    system: SUMMARY_SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Based on this patient interview, produce a structured GP Clinical Summary for Dr. Patel.

## GP Clinical Summary

**Presenting Complaint:** [1 line]

**History of Presenting Illness:**
[2–4 sentences in clinical language]

**Past Medical History:** [bullet points or "Nil of note"]

**Current Medications:** [list with approximate doses where known; flag "exact doses to confirm" if uncertain]

**Allergies:** [list or "NKDA"]

**Family History:** [relevant findings or "Not elicited / Nil relevant"]

**Social History:** [smoking, alcohol, occupation, living situation, umuthi/traditional medicine use]

**Systems Review:** [relevant positive and pertinent negative findings]

---

## Clinical Impressions — For Dr. Patel Only

### Differential Diagnoses
1. **[Most likely]** — [supporting evidence from history]
2. **[Second]** — [supporting evidence]
3. **[Third]** — [supporting evidence]

### Suggested Examination
- [specific focused examinations]

### Suggested Investigations
- [specific investigations with rationale]

### Management Considerations
- [initial treatment options for Dr. Patel to consider; do not prescribe — frame as considerations]

### Red Flags Identified
[list any red flags raised, or "None identified during history"]

---
*Generated by MedAI | For clinical use only — not shown to patient*

---

PATIENT INTERVIEW TRANSCRIPT:
${transcript}`,
      },
    ],
  });

  return resp.content[0].type === 'text' ? resp.content[0].text : '';
}

export function getSummary(sessionId: string): string | null {
  return sessions.get(sessionId)?.summary ?? null;
}
