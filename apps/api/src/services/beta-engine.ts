import Anthropic from '@anthropic-ai/sdk';
import { betaConfig } from '../lib/beta-config.js';
import { MEDAI_SYSTEM_PROMPT, SUMMARY_SYSTEM } from './medai-prompt.js';

const client = new Anthropic({ apiKey: betaConfig.ANTHROPIC_API_KEY });

const BETA_MODEL = 'claude-sonnet-4-6';



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
    max_tokens: 600,
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
    max_tokens: 600,
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
        content: `Produce a structured GP Clinical Summary for Dr. Patel based on the patient interview below.

Use this exact structure:

## GP Clinical Summary

**Presenting Complaint:** [1 concise line — e.g. "3-day history of productive cough with fever"]

**History of Presenting Illness:**
[3–5 sentences in clinical language: character, site, radiation, severity, timing, aggravating/relieving factors, associated symptoms]

**Past Medical History:**
[Bullet list of confirmed conditions, or "Nil of note"]

**Chronic / Ongoing Conditions:**
[Any chronic/long-term condition surfaced, INCLUDING ones unrelated to today's complaint. For each: control status and — critically — treatment adherence: state clearly if the patient has DEFAULTED, interrupted, or never started treatment, with timing and reason if given. Write "None surfaced" if genuinely none.]

**Current Medications:**
[Bullet list — include approximate doses if stated; mark uncertain with "(to confirm)"; include ARVs, contraceptives, traditional medicine]

**Allergies:** [List or "NKDA"]

**Family History:** [Relevant first-degree family illnesses, or "Not elicited"]

**Social History:**
[Smoking: status and pack-years if known | Alcohol: yes/no and frequency | Occupation | Living situation | Traditional medicine/umuthi use | Recent travel]

**Systems Review:**
[Relevant positive findings not already covered | Pertinent negatives worth noting]

**Reproductive/Gynaecological:** [For female patients: LMP, contraception, pregnancy status — or "Not applicable"]

**HIV/TB Status:**
[HIV status if disclosed; ARV status; TB screen findings — cough duration, night sweats, weight loss, contacts]

---

## Clinical Impressions — For Dr. Patel Only

### Differential Diagnoses
1. **[Most likely diagnosis]** — [key supporting history]
2. **[Second differential]** — [key supporting history]
3. **[Third differential]** — [key supporting history]

### Suggested Examination
- [Specific targeted examination findings to look for]

### Suggested Investigations
- [Specific investigations with clinical rationale]

### Management Considerations
- [Therapeutic options for Dr. Patel to consider — frame as suggestions, not prescriptions]

### Secondary / Chronic Care Opportunities
[Explicitly flag any chronic or ongoing issue surfaced today that Dr. Patel could address opportunistically — especially defaulted chronic treatment (e.g. hypertension, diabetes, HIV/ARVs, asthma, mental health). One line each, or "None identified."]

### Red Flags / Safety Netting
[Any red flags elicited, or "None identified. Advise patient to return if [specific worsening symptoms]."]

---
*MedAI — AI-generated pre-consultation summary | For clinical use only | Not shown to patient*

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
