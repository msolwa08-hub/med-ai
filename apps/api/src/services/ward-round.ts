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
import { betaConfig } from '../lib/beta-config.js';
import { extractJSON } from '../lib/json-extract.js';
import { MEDAI_SYSTEM_PROMPT, HOD_DISCLAIMER } from './hod-prompt.js';
import { stgMatches, compactSTG, runSafetyCheck } from './tools-clinical.js';
import { protocolStore } from './protocol-store.js';
import { screeningForProblems, type ScreeningPrompt } from './clinical-screening.js';
import type { SafetyWarning } from './prescription-safety.js';

const client = new Anthropic({ apiKey: betaConfig.ANTHROPIC_API_KEY });

export interface WardRoundUpdate {
  date: string;
  onHistory: string; // Summarized changes/subjective trajectory
  onExamination: string; // Focused clinical exam updates, vital deltas, visual trace findings
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
  return `[${r.date}] Hx: ${r.onHistory} | O/E: ${r.onExamination} | Ix: ${r.suggestedInvestigations.join('; ')} | Mx: ${r.suggestedManagement.join('; ')}`;
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

TASK — DAILY WARD ROUND SYNTHESIS (${req.dept}${req.subDept ? ` / ${req.subDept}` : ''}):
Compute TODAY'S round as a delta against the trajectory: what changed, what resolved, what is drifting, what must happen today. Do not re-summarize the whole admission — reference it only where the trend matters. If today's inputs contradict the trajectory (e.g. vitals worse despite "improving"), say so bluntly.

Respond with ONLY a JSON object:
{
  "onHistory": "1-3 lines, subjective trajectory since last round, clinical shorthand",
  "onExamination": "1-3 lines, focused exam/vital DELTAS + image trace findings, shorthand",
  "suggestedInvestigations": ["only today's targeted additions/repeats, each with its trigger, e.g. 'Repeat UEC — K+ was 5.9 on insulin'"],
  "suggestedManagement": ["concrete regimen updates with doses where STG applies; include stop/de-escalate orders, not just additions"],
  "consultantLogicExplanation": "the specialist WHY behind today's plan — trends weighed, traps flagged, escalation triggers"
}`;

  const userContent = `PATIENT: ${req.patientContext}
ACTIVE PROBLEMS:
${req.problems.map((p, i) => `${i + 1}. ${p}`).join('\n') || 'none recorded'}
CURRENT MEDICATIONS: ${req.medications || 'none recorded'}
ALLERGIES: ${req.allergies || 'none recorded'}

${trajectoryBlock}

TODAY'S INPUTS:
Subjective: ${req.todaySubjective || '-'}
Objective/exam: ${req.todayObjective || '-'}
Vitals: ${req.vitals || '-'}
New results: ${req.newResults || '-'}
${req.imageFindings?.length ? `Image findings (verified traces):\n${req.imageFindings.map(f => `- ${f}`).join('\n')}` : ''}

${stgBlock}
${protocolBlock}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1800,
    system,
    messages: [{ role: 'user', content: userContent }],
  });

  const text = response.content[0]?.type === 'text' ? response.content[0].text : '{}';
  const parsed = extractJSON<Omit<WardRoundUpdate, 'date'>>(text);

  const update: WardRoundUpdate = {
    date: new Date().toISOString().slice(0, 10),
    onHistory: parsed.onHistory ?? '',
    onExamination: parsed.onExamination ?? '',
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
  const safety = runSafetyCheck({
    medicationsText: req.medications,
    allergiesText: req.allergies,
    plannedLines: prescriptive,
  });
  const screening = screeningForProblems([...req.problems, update.onExamination, update.onHistory]);

  return { ...update, screening, safety, disclaimer: HOD_DISCLAIMER };
}
