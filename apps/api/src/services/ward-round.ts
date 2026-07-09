/**
 * Ward-round delta engine — computes today's round as a DELTA against the
 * patient's trajectory, not a fresh summary.
 *
 * State in = the persisted record (context, problems, meds) PLUS the array of
 * prior WardRoundUpdates; the engine is stateless per call (client/DB own the
 * round history), which keeps it deployable on the beta server without new
 * storage. Output is the exact WardRoundUpdate contract, then two
 * deterministic post-passes run server-side:
 *   1. every suggestedManagement line through the allergy/interaction safety
 *      net (prescription-safety.ts),
 *   2. problem-linked screening rules (clinical-screening.ts) injected so
 *      monitoring prompts appear even when the model omits them.
 */
import Anthropic from '@anthropic-ai/sdk';
import { MODELS, createMessage } from '../lib/models.js';
import { extractJSON, tryExtractJSON } from '../lib/json-extract.js';
import { MEDAI_SYSTEM_PROMPT, HOD_DISCLAIMER, specialtyLens } from './hod-prompt.js';
import { stgMatches, compactSTG, runSafetyCheck, looksPregnant } from './tools-clinical.js';
import { protocolStore } from './protocol-store.js';
import { screeningForProblems, type ScreeningPrompt } from './clinical-screening.js';
import type { SafetyWarning } from './prescription-safety.js';


export interface WardRoundUpdate {
  date: string;
  onHistory: string; // Summarized changes/subjective trajectory
  onExamination: string; // Focused clinical exam updates, vital deltas, visual trace findings
  examsToRepeatToday: string[]; // Recurring risk-tracking exams to repeat this round (once-off exams excluded)
  suggestedInvestigations: string[]; // Active, targeted updates grounded in STG
  suggestedManagement: string[]; // Aggressive, protocol-aligned regimen updates
  consultantLogicExplanation: string; // Advanced clinical reasoning
}

export interface WardRoundDeltaRequest {
  dept: string;
  subDept?: string;
  /** One-line patient context: age/sex, day-of-admission, working dx. */
  patientContext: string;
  /** Active problem list lines ("1. CAP — CURB-65 2 ..."). */
  problems: string[];
  /** The presenting history / HPI — what the exam findings are expected against. */
  history?: string;
  /** Baseline general examination on the record. */
  generalExam?: string;
  /** Baseline focused/systems examination on the record. */
  focusedExam?: string;
  medications?: string;
  allergies?: string;
  /** Prior rounds, oldest first — the trajectory the delta is computed against. */
  previousRounds: WardRoundUpdate[];
  /** Today's raw inputs from the intern. */
  todaySubjective?: string;
  todayObjective?: string;
  vitals?: string;
  newResults?: string;
  /** injectText lines from analyzed images (ECG/CTG/CXR...). */
  imageFindings?: string[];
}

export interface WardRoundDeltaResponse extends WardRoundUpdate {
  screening: ScreeningPrompt[];
  safety: SafetyWarning[];
  disclaimer: string;
}

function compactRound(r: WardRoundUpdate): string {
  // Prior rounds arrive from the client and may be partially-formed (a summary
  // shape without the array fields) — default them so a missing array can never
  // crash the synthesis with undefined.join().
  const ix = Array.isArray(r.suggestedInvestigations) ? r.suggestedInvestigations : [];
  const mx = Array.isArray(r.suggestedManagement) ? r.suggestedManagement : [];
  return `[${r.date ?? '?'}] Hx: ${r.onHistory ?? ''} | O/E: ${r.onExamination ?? ''} | Ix: ${ix.join('; ')} | Mx: ${mx.join('; ')}`;
}

export async function generateWardRoundDelta(req: WardRoundDeltaRequest): Promise<WardRoundDeltaResponse> {
  const clinicalText = [
    req.patientContext,
    ...req.problems,
    req.todaySubjective ?? '',
    req.todayObjective ?? '',
    req.newResults ?? '',
  ].join(' \n ');

  const stg = stgMatches(clinicalText, 4);
  const stgBlock = stg.length
    ? `RELEVANT SA STG ENTRIES (ground Ix/Mx updates in these):\n${stg.map(compactSTG).join('\n')}`
    : '';

  const protocolMatches = protocolStore.match(clinicalText, req.dept);
  const protocolBlock = protocolMatches.length
    ? `THIS FACILITY'S OWN PROTOCOL (overrides generic STG where specific):\n${protocolMatches.map(m => `- [${m.title}]: ${m.excerpt}`).join('\n')}`
    : '';

  // Trajectory: all dates + full detail for the last 3 rounds only, so a long
  // admission cannot blow the prompt budget while the recent arc stays sharp.
  const recent = req.previousRounds.slice(-3);
  const older = req.previousRounds.slice(0, -3);
  const trajectoryBlock = req.previousRounds.length
    ? `TRAJECTORY (prior rounds, oldest first${older.length ? `; ${older.length} earlier round(s) elided` : ''}):\n${recent.map(compactRound).join('\n')}`
    : 'TRAJECTORY: first documented round for this patient.';

  const system = `${MEDAI_SYSTEM_PROMPT}

${specialtyLens(req.dept, req.subDept)}

TASK — DAILY WARD ROUND SYNTHESIS (${req.dept}${req.subDept ? ` / ${req.subDept}` : ''}):
Compute TODAY'S round as a delta against the trajectory: what changed, what resolved, what is drifting, what must happen today. Do not re-summarize the whole admission — reference it only where the trend matters. If today's inputs contradict the trajectory (e.g. vitals worse despite "improving"), say so bluntly.

THE EXAMINATION IS SYNTHESISED, NOT TRANSCRIBED — this is the core of the round:
Given the HISTORY and the active problems, first reason (silently) about what a consultant would EXPECT to find on examination today for this presentation and this day of illness/admission. Then compare that expectation against the ACTUAL findings recorded (general exam, focused exam, vitals, images). Your "onExamination" output states the actual salient findings AND the interpretation of the gap:
- CONCORDANT (findings match the expected course) — say so briefly and move on.
- BETTER than expected — name it (resolving, improving) and what it permits (de-escalate, step down, plan discharge).
- WORSE / DISCORDANT than expected — this is the important signal. If the history predicts a finding that is ABSENT (e.g. peritonitis expected but abdomen soft — reassuring, or the tachycardia of an anastomotic leak before peritonism appears), or a finding is present that the history did NOT predict (an unexpected sign pointing to a new problem or a missed diagnosis), flag it explicitly and let it drive the investigations and management.
- Name the pertinent EXPECTED-BUT-NOT-DOCUMENTED findings the intern should actively check today (the exam the presentation demands but the record is silent on).

EXAM CADENCE — do not make the intern repeat everything every day:
- ONCE-OFF exams that are already documented and were done to EXCLUDE a fixed condition (e.g. a baseline neurological screen in a cardiac patient, a normal booking exam) do NOT need repeating on a routine round — do not re-request them unless something changed.
- RECURRING exams that TRACK AN ACTIVE RISK must be repeated EVERY round for as long as that risk is live, and you must list today's ones explicitly: e.g. BP + reflexes + urine protein + fetal heart daily in pre-eclampsia; fundal height/tone + lochia + calves in the puerperium; wound + temperature from post-CS day 3; neuro obs while consciousness is a concern. Tie each to the risk it monitors.
- "examsToRepeatToday" is the short, specific list of the recurring risk-tracking exams the intern must actually do on this round.

All text fields are PLAIN TEXT copied by hand onto a paper chart: no markdown, no *, **, #, backticks, no bullet glyphs. Clinical shorthand is fine.

Respond with ONLY a JSON object:
{
  "onHistory": "1-3 lines, subjective trajectory since last round, clinical shorthand",
  "onExamination": "1-3 lines: actual salient findings + vital/exam DELTAS + image traces, THEN the expected-vs-actual read (concordant / better / worse-discordant) and any expected finding not yet documented that must be checked",
  "examsToRepeatToday": ["the recurring risk-tracking exams to do THIS round, each tied to its risk, e.g. 'BP + reflexes + urine protein — pre-eclampsia surveillance'. Omit once-off exams already documented."],
  "suggestedInvestigations": ["only today's targeted additions/repeats, each with its trigger, e.g. 'Repeat UEC — K+ was 5.9 on insulin'"],
  "suggestedManagement": ["concrete regimen updates with doses where STG applies; include stop/de-escalate orders, not just additions"],
  "consultantLogicExplanation": "the specialist WHY — including WHY these findings were expected for this history/day, and what the concordance or discordance means"
}`;

  const examBaseline =
    req.generalExam || req.focusedExam
      ? `BASELINE EXAMINATION ON RECORD (compare today's findings against this + what the history predicts):
General: ${req.generalExam || '—'}
Focused: ${req.focusedExam || '—'}`
      : '';

  const userContent = `PATIENT: ${req.patientContext}
${req.history ? `HISTORY / HPI (what the examination findings are expected against):\n${req.history}\n` : ''}
ACTIVE PROBLEMS:
${req.problems.map((p, i) => `${i + 1}. ${p}`).join('\n') || 'none recorded'}
CURRENT MEDICATIONS: ${req.medications || 'none recorded'}
ALLERGIES: ${req.allergies || 'none recorded'}
${examBaseline ? `\n${examBaseline}\n` : ''}
${trajectoryBlock}

TODAY'S INPUTS:
Subjective: ${req.todaySubjective || '-'}
Objective/exam: ${req.todayObjective || '-'}
Vitals: ${req.vitals || '-'}
New results: ${req.newResults || '-'}
${req.imageFindings?.length ? `Image findings (verified traces):\n${req.imageFindings.map(f => `- ${f}`).join('\n')}` : ''}

${stgBlock}
${protocolBlock}`;

  const response = await createMessage({
    model: MODELS.reasoning,
    max_tokens: 1800,
    system,
    messages: [{ role: 'user', content: userContent }],
  });

  const text = response.content[0]?.type === 'text' ? response.content[0].text : '{}';
  // Never throw-into-500 on a non-JSON reply: degrade to a usable round with
  // the raw text surfaced, rather than losing ~40s of work to a dead-end.
  const parsed = tryExtractJSON<Partial<WardRoundUpdate>>(text) ?? {};

  const update: WardRoundUpdate = {
    date: new Date().toISOString().slice(0, 10),
    onHistory: parsed.onHistory ?? '',
    onExamination: parsed.onExamination ?? (Object.keys(parsed).length === 0 ? text.trim().slice(0, 600) : ''),
    examsToRepeatToday: Array.isArray(parsed.examsToRepeatToday) ? parsed.examsToRepeatToday : [],
    suggestedInvestigations: Array.isArray(parsed.suggestedInvestigations) ? parsed.suggestedInvestigations : [],
    suggestedManagement: Array.isArray(parsed.suggestedManagement) ? parsed.suggestedManagement : [],
    consultantLogicExplanation: parsed.consultantLogicExplanation ?? '',
  };

  // Deterministic post-passes — never trust the model alone with drugs.
  // Advisory lines that merely mention the allergy ("penicillin allergy
  // documented — flag for future") trip the lexical allergy matcher; a line
  // that talks about the allergy is not a line that prescribes the allergen,
  // so filter those before the check. Genuine prescriptions never contain
  // the word "allergy".
  const prescriptive = update.suggestedManagement.filter(l => !/allerg/i.test(l));
  const pregnant = looksPregnant(
    [req.dept, req.subDept, req.patientContext, req.history, ...req.problems].filter(Boolean).join(' ')
  );
  const safety = runSafetyCheck({
    medicationsText: req.medications,
    allergiesText: req.allergies,
    plannedLines: prescriptive,
    isPregnant: pregnant,
    conditionsText: [req.patientContext, req.history, ...req.problems, update.onExamination].filter(Boolean).join(' '),
  });
  const screening = screeningForProblems([...req.problems, update.onExamination, update.onHistory]);

  return { ...update, screening, safety, disclaimer: HOD_DISCLAIMER };
}
