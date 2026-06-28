import Anthropic from '@anthropic-ai/sdk';
import { betaConfig } from '../lib/beta-config.js';
import { MEDAI_SYSTEM_PROMPT, SUMMARY_SYSTEM } from './medai-prompt.js';
import { generateClinicalPackage } from './clinical-package.js';
import type { ExamFindings, ClinicalPackage } from './clinical-package.js';
import { loadSession, saveSession, removeSession, loadAllSessions } from './session-store.js';

const client = new Anthropic({ apiKey: betaConfig.ANTHROPIC_API_KEY });

const BETA_MODEL = 'claude-sonnet-4-6';



const CACHED_SYSTEM = [
  { type: 'text' as const, text: MEDAI_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' as const } },
];

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export type ConsultStatus = 'TAKING_HISTORY' | 'AWAITING_DOCTOR' | 'IN_REVIEW' | 'SIGNED';

export interface BetaSession {
  sessionId: string;
  accessKey: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  displayMessages: ChatMessage[];
  isComplete: boolean;
  summary: string | null;
  examFindings: ExamFindings | null;
  clinicalPackage: ClinicalPackage | null;
  consultStatus: ConsultStatus;
  signedAt: number | null;
  createdAt: number;
  lastActivityAt: number;
}

// Session persistence lives entirely in session-store.ts (memory+disk, or
// Vercel KV when configured). The engine is stateless across requests so it
// works correctly on serverless, where each invocation may be a fresh instance.

export async function createSession(accessKey: string): Promise<string> {
  const sessionId = crypto.randomUUID();
  const session: BetaSession = {
    sessionId,
    accessKey,
    messages: [],
    displayMessages: [],
    isComplete: false,
    summary: null,
    examFindings: null,
    clinicalPackage: null,
    consultStatus: 'TAKING_HISTORY',
    signedAt: null,
    createdAt: Date.now(),
    lastActivityAt: Date.now(),
  };
  await saveSession(session);
  return sessionId;
}

export async function getSession(sessionId: string): Promise<BetaSession | null> {
  return loadSession(sessionId);
}

export async function startHistory(sessionId: string): Promise<string> {
  const session = await loadSession(sessionId);
  if (!session) throw new Error('Session not found');

  const doctorName = betaConfig.BETA_DOCTOR_NAME;
  const practiceName = betaConfig.BETA_PRACTICE_NAME;
  const seed = `Say exactly: "Hi, I'm the AI health assistant built specially for ${doctorName}'s practice here at ${practiceName}. I'm here to take good care of you and to make sure the doctor understands everything that matters to you. Whatever you share is completely private and goes only to ${doctorName} — so please don't hold back. Even things that feel small, or that don't seem related to today, are worth telling me, because it all helps the doctor look after you properly." Then ask warmly: "So tell me — how have you been, and what's brought you in today?"`;

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
  await saveSession(session);

  return clean;
}

export async function sendMessage(
  sessionId: string,
  patientMessage: string
): Promise<{ reply: string; isComplete: boolean; summary?: string }> {
  const session = await loadSession(sessionId);
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
    session.consultStatus = 'AWAITING_DOCTOR';
    // The summary is generated lazily on the first GET /beta/session/:id/summary
    // poll (see ensureSummary). On serverless a fire-and-forget background job
    // never runs — the function freezes once the HTTP response is sent — so we
    // defer generation to a real request instead. The client already polls.
  }
  await saveSession(session);

  return { reply: clean, isComplete };
}

// In-flight summary generations, keyed by sessionId, to dedupe concurrent polls
// within a single instance. Cross-instance duplication is harmless (last write
// wins) and rare, since polls hit the same warm instance in practice.
const summaryInFlight = new Map<string, Promise<string | null>>();

/**
 * Returns the session summary, generating and persisting it on first request if
 * the history is complete but no summary exists yet. Serverless-safe: the work
 * happens inside this request, not a detached background task.
 */
export async function ensureSummary(sessionId: string): Promise<string | null> {
  const session = await loadSession(sessionId);
  if (!session || !session.isComplete) return null;
  if (session.summary) return session.summary;

  const existing = summaryInFlight.get(sessionId);
  if (existing) return existing;

  const work = (async (): Promise<string | null> => {
    try {
      const summary = await generateSummary(session.displayMessages);
      session.summary = summary;
      session.lastActivityAt = Date.now();
      await saveSession(session);
      return summary;
    } catch (err) {
      console.error('[beta-engine] Summary generation failed:', err);
      const fallback = 'Summary generation failed — please ask the doctor to review the transcript.';
      session.summary = fallback;
      await saveSession(session);
      return fallback;
    } finally {
      summaryInFlight.delete(sessionId);
    }
  })();

  summaryInFlight.set(sessionId, work);
  return work;
}

async function generateSummary(messages: ChatMessage[]): Promise<string> {
  const doctorName = betaConfig.BETA_DOCTOR_NAME;
  const transcript = messages
    .map((m) => `${m.role === 'assistant' ? 'MedAI' : 'Patient'}: ${m.content}`)
    .join('\n\n');

  const resp = await client.messages.create({
    model: BETA_MODEL,
    max_tokens: 4000,
    system: SUMMARY_SYSTEM,
    messages: [
      {
        role: 'user',
        content: `IMPORTANT: Output this summary EXACTLY ONCE. Do not repeat or re-print any section.

Produce a structured GP Clinical Summary for ${doctorName} based on the patient interview below.

Use this exact structure:

## GP Clinical Summary

**Presenting Complaint:** [1 concise line — e.g. "3-day history of productive cough with fever"]

**History of Presenting Illness:**
[3–5 sentences in clinical language: character, site, radiation, severity, timing, aggravating/relieving factors, associated symptoms]

**Past Medical History:**
[Bullet list of confirmed conditions, or "Nil of note"]

**Chronic / Ongoing & Newly Surfaced Issues:**
[Chronic conditions AND under-reported or demographic case-finding positives surfaced today — e.g. long-standing pain, sleep problems, male urinary/prostate symptoms, post-menopausal bleeding, menopausal symptoms, overdue screening. For known chronic conditions give control status and treatment adherence (flag clearly if DEFAULTED/interrupted, with timing and reason). Mark anything needing prompt attention — e.g. ANY post-menopausal bleeding — as "(URGENT — doctor to review)". Write "None surfaced" if genuinely none.]

**Current Medications:**
[Bullet list — include correct drug identification (see SOUTH AFRICAN DRUG IDENTIFICATION above), doses if stated; mark uncertain with "(to confirm)"; include ARVs, contraceptives, traditional medicine. Do NOT misidentify a drug as a supplement/vitamin — flag as "(unidentified — to confirm)" if unsure.]

**Allergies:** [List or "NKDA"]

**Family History:** [Relevant first-degree family illnesses, or "Not elicited"]

**Social History:**
[Smoking: status and pack-years if known | Alcohol: yes/no and frequency | Occupation | Living situation | Household contacts with illness | Traditional medicine/umuthi use | Recent travel: state explicitly — "Not elicited" if not asked]

**Systems Review:**
[Relevant positive findings not already covered | Pertinent negatives worth noting]

**Reproductive/Gynaecological:** [For female patients: LMP, contraception, pregnancy status — or "Not applicable (male)" / "Not applicable (post-menopausal)" as relevant]

**HIV/TB Status:**
[HIV status if disclosed; ARV status; TB screen findings — cough duration, night sweats, weight loss, contacts]

---

## Clinical Impressions — For ${doctorName} Only

### Differential Diagnoses
1. **[Most likely diagnosis]** (ICD-10: X00.0) — [key supporting features] | Against: [features against]
2. **[Second differential]** (ICD-10: X00.0) — [key supporting features] | Against: [features against]
3. **[Third differential]** (ICD-10: X00.0) — [key supporting features] | Against: [features against]

### Suggested Examination
- [Specific targeted examination findings to look for]

### Suggested Investigations
- [Specific investigations with clinical rationale and priority — URGENT / ROUTINE]

### Management Considerations

**Pharmacological:**
- [Drug options, class, reasoning — frame as suggestions not prescriptions; flag relevant SA EML/STG options]

**Non-pharmacological:**
- [Rest, hydration, lifestyle, patient education, follow-up timing, referral triggers]

### Secondary Care & Case-Finding Opportunities
[Flag issues surfaced today that ${doctorName} could act on opportunistically — defaulted chronic treatment AND demographic case-finding positives (e.g. likely prostate/BPH in an older man, post-menopausal bleeding, overdue cervical/breast screening, possible sleep apnoea, normalised chronic pain). One line each with the suggested next step, or "None identified."]

### Red Flags / Safety Netting
[Any red flags elicited, or "None identified. Advise patient to return if [specific worsening symptoms]."]

---
*MedAI — AI-generated pre-consultation summary | For clinical use only | Not shown to patient*

PATIENT INTERVIEW TRANSCRIPT:
${transcript}`,
      },
    ],
  });

  return resp.content[0].type === 'text' ? resp.content[0].text : '';
}

export async function getSummary(sessionId: string): Promise<string | null> {
  const session = await loadSession(sessionId);
  return session?.summary ?? null;
}


// ─── Doctor cockpit accessors ───────────────────────────────────────────────

export interface ConsultListItem {
  sessionId: string;
  chiefComplaint: string;
  isComplete: boolean;
  consultStatus: ConsultStatus;
  hasPackage: boolean;
  createdAt: number;
  completedAt: number | null;
}

function chiefComplaintOf(session: BetaSession): string {
  const firstPatient = session.displayMessages.find((m) => m.role === 'user');
  if (!firstPatient) return 'New patient';
  const text = firstPatient.content.trim();
  return text.length > 80 ? text.slice(0, 80) + '…' : text;
}

export async function listConsults(): Promise<ConsultListItem[]> {
  const all = await loadAllSessions();
  return all
    .filter((s) => s.displayMessages.some((m) => m.role === 'user'))
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((s) => ({
      sessionId: s.sessionId,
      chiefComplaint: chiefComplaintOf(s),
      isComplete: s.isComplete,
      consultStatus: s.consultStatus,
      hasPackage: s.clinicalPackage !== null,
      createdAt: s.createdAt,
      completedAt: s.isComplete ? s.lastActivityAt : null,
    }));
}

export interface ConsultDetail {
  sessionId: string;
  chiefComplaint: string;
  consultStatus: ConsultStatus;
  isComplete: boolean;
  transcript: ChatMessage[];
  summary: string | null;
  examFindings: ExamFindings | null;
  clinicalPackage: ClinicalPackage | null;
}

export async function getConsultDetail(sessionId: string): Promise<ConsultDetail | null> {
  const s = await loadSession(sessionId);
  if (!s) return null;
  return {
    sessionId: s.sessionId,
    chiefComplaint: chiefComplaintOf(s),
    consultStatus: s.consultStatus,
    isComplete: s.isComplete,
    transcript: s.displayMessages,
    summary: s.summary,
    examFindings: s.examFindings,
    clinicalPackage: s.clinicalPackage,
  };
}

export async function saveExamFindings(sessionId: string, exam: ExamFindings): Promise<boolean> {
  const s = await loadSession(sessionId);
  if (!s) return false;
  s.examFindings = exam;
  s.lastActivityAt = Date.now();
  await saveSession(s);
  return true;
}

export async function buildClinicalPackage(sessionId: string, practiceMode?: import('./clinical-package.js').PracticeMode): Promise<ClinicalPackage | null> {
  const s = await loadSession(sessionId);
  if (!s) return null;
  if (!s.isComplete) throw new Error('History not yet complete');
  const pkg = await generateClinicalPackage({
    transcript: s.displayMessages,
    summary: s.summary,
    exam: s.examFindings ?? undefined,
    practiceMode,
  });
  s.clinicalPackage = pkg;
  s.consultStatus = 'IN_REVIEW';
  s.lastActivityAt = Date.now();
  await saveSession(s);
  return pkg;
}

export async function confirmClinicalPackage(sessionId: string, edited: ClinicalPackage): Promise<boolean> {
  const s = await loadSession(sessionId);
  if (!s) return false;
  s.clinicalPackage = edited;
  s.consultStatus = 'SIGNED';
  s.signedAt = Date.now();
  s.lastActivityAt = Date.now();
  await saveSession(s);
  return true;
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface ApiError {
  type: string;
  message: string;
  at: number;
}

const MAX_ERROR_LOG = 200;
const errorLog: ApiError[] = [];

export function trackError(type: string, message: string): void {
  errorLog.unshift({ type, message, at: Date.now() });
  if (errorLog.length > MAX_ERROR_LOG) errorLog.length = MAX_ERROR_LOG;
}

export interface AnalyticsSummary {
  summary: {
    total: number;
    active: number;
    completed: number;
    completionRate: number;
    avgExchanges: number;
    today: number;
    thisWeek: number;
  };
  aiHistoryQuality: {
    avgExchanges: number;
    medianExchanges: number;
    exchangeDistribution: Record<string, number>;
    completionRate: number;
  };
  consultationFunnel: {
    TAKING_HISTORY: number;
    AWAITING_DOCTOR: number;
    IN_REVIEW: number;
    SIGNED: number;
    abandoned: number;
  };
  userGrowth: {
    dailySessions: { date: string; count: number }[];
    totalSessions: number;
    uniqueKeys: number;
  };
  errors: {
    recent: ApiError[];
    total: number;
  };
}

function dayKey(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

export async function getAnalytics(): Promise<AnalyticsSummary> {
  const all = await loadAllSessions();
  const todayStart = new Date().setHours(0, 0, 0, 0);
  const weekStart = todayStart - 6 * 24 * 60 * 60 * 1000;

  const withMessages = all.filter((s) => s.displayMessages.some((m) => m.role === 'user'));
  const completed = all.filter((s) => s.isComplete);

  const exchangeCounts = completed.map(
    (s) => s.displayMessages.filter((m) => m.role === 'user').length,
  );
  const avgExchanges =
    exchangeCounts.length
      ? Math.round((exchangeCounts.reduce((a, b) => a + b, 0) / exchangeCounts.length) * 10) / 10
      : 0;
  const sorted = [...exchangeCounts].sort((a, b) => a - b);
  const medianExchanges = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;

  const dist: Record<string, number> = { '1-5': 0, '6-10': 0, '11-15': 0, '16-20': 0, '21+': 0 };
  for (const c of exchangeCounts) {
    if (c <= 5) dist['1-5']++;
    else if (c <= 10) dist['6-10']++;
    else if (c <= 15) dist['11-15']++;
    else if (c <= 20) dist['16-20']++;
    else dist['21+']++;
  }

  const funnel = { TAKING_HISTORY: 0, AWAITING_DOCTOR: 0, IN_REVIEW: 0, SIGNED: 0, abandoned: 0 };
  for (const s of all) {
    if (!s.displayMessages.some((m) => m.role === 'user')) {
      funnel.abandoned++;
    } else {
      funnel[s.consultStatus as keyof typeof funnel]++;
    }
  }

  const dailyMap: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    dailyMap[dayKey(todayStart - i * 24 * 60 * 60 * 1000)] = 0;
  }
  for (const s of all) {
    const d = dayKey(s.createdAt);
    if (d in dailyMap) dailyMap[d]++;
  }
  const dailySessions = Object.entries(dailyMap).map(([date, count]) => ({ date, count }));

  const completionRate = withMessages.length
    ? Math.round((completed.length / withMessages.length) * 1000) / 10
    : 0;

  return {
    summary: {
      total: all.length,
      active: withMessages.length - completed.length,
      completed: completed.length,
      completionRate,
      avgExchanges,
      today: all.filter((s) => s.createdAt >= todayStart).length,
      thisWeek: all.filter((s) => s.createdAt >= weekStart).length,
    },
    aiHistoryQuality: {
      avgExchanges,
      medianExchanges,
      exchangeDistribution: dist,
      completionRate,
    },
    consultationFunnel: funnel,
    userGrowth: {
      dailySessions,
      totalSessions: all.length,
      uniqueKeys: new Set(all.map((s) => s.accessKey)).size,
    },
    errors: {
      recent: errorLog.slice(0, 10),
      total: errorLog.length,
    },
  };
}
