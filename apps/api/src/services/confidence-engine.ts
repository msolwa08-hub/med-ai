/**
 * The confidence engine — the bedside loop's brain.
 *
 * Holds a live WORKING PICTURE of the patient: a ranked differential with
 * calibrated confidence, what supports and argues against each diagnosis, and —
 * the part that makes it a loop, not a list — the DISCRIMINATORS: which
 * investigation moves which diagnosis, in which direction. When results land,
 * the engine is called again with the previous picture and must narrate the
 * shift ("platelets 80 → HELLP up 30→65, this changes management: ...").
 *
 * Stateless by design (client owns the record and the previous picture), like
 * every other engine on the beta server. Deterministic guardrails wrap the
 * model: STG retrieval anchors management, the drug-safety net screens every
 * management line, confidence values are clamped and banded server-side, and
 * teach-while-you-work is enforced by the contract — every element carries its
 * "why", so the intern learns consultant reasoning from every patient.
 */
import { MODELS, createMessage } from '../lib/models.js';
import { tryExtractJSON } from '../lib/json-extract.js';
import { MEDAI_SYSTEM_PROMPT, HOD_DISCLAIMER, specialtyLens } from './hod-prompt.js';
import { stgMatches, compactSTG, runSafetyCheck, looksPregnant } from './tools-clinical.js';
import { protocolStore } from './protocol-store.js';
import type { SafetyWarning } from './prescription-safety.js';

export interface Discriminator {
  /** e.g. "Platelets + LFTs" */
  test: string;
  /** What a result does to WHICH diagnosis: "platelets <100 moves HELLP up; normal moves it down" */
  moves: string;
  status: 'suggested' | 'pending' | 'done';
  priority: 'now' | 'today' | 'routine';
}

export interface WeightedDifferential {
  dx: string;
  icd10?: string;
  /** 0-100 calibrated estimate — honest, need not sum to 100 across the list. */
  confidence: number;
  band: 'confirmed' | 'likely' | 'possible' | 'must-exclude';
  supporting: string[];
  against: string[];
  /** One-line consultant reasoning — the teach-while-you-work payload. */
  why: string;
  /** Present when a previous picture was supplied: where it moved and why. */
  shift?: { from: number; because: string };
  discriminators: Discriminator[];
}

export interface WorkingPicture {
  differentials: WeightedDifferential[];
  /** The one thing the intern must not miss today. */
  mustNotMiss: string;
  /** What the CURRENT confidence level already justifies doing, with the why. */
  managementNow: string[];
  /** When results were supplied with a previous picture: the narrated update. */
  narrative: string;
}

export interface WorkingPictureRequest {
  dept: string;
  subDept?: string;
  intake: Record<string, string | undefined>;
  history: Record<string, string | undefined>;
  assessment: Record<string, string | undefined>;
  /** Committed problem-list lines, if the intern has generated them. */
  problems?: string[];
  /** Serialized latest results + trends (client's serializeLatestResults + notes). */
  resultsText?: string;
  /** The prior picture — supply it and the engine narrates every shift. */
  previousPicture?: Pick<WorkingPicture, 'differentials'> | null;
}

export interface WorkingPictureResponse extends WorkingPicture {
  safety: SafetyWarning[];
  disclaimer: string;
}

const clampPct = (n: unknown): number => {
  const v = typeof n === 'number' ? n : Number(n);
  return Number.isFinite(v) ? Math.max(0, Math.min(100, Math.round(v))) : 0;
};

function bandFor(confidence: number, raw: unknown): WeightedDifferential['band'] {
  if (raw === 'confirmed' || raw === 'likely' || raw === 'possible' || raw === 'must-exclude') return raw;
  if (confidence >= 90) return 'confirmed';
  if (confidence >= 60) return 'likely';
  return 'possible';
}

function recordText(r: Record<string, string | undefined>, label: string): string {
  const lines = Object.entries(r)
    .filter(([, v]) => v && v.trim())
    .map(([k, v]) => `  ${k}: ${v}`);
  return lines.length ? `${label}:\n${lines.join('\n')}` : '';
}

export async function generateWorkingPicture(req: WorkingPictureRequest): Promise<WorkingPictureResponse> {
  const clinical = [
    recordText(req.intake, 'INTAKE'),
    recordText(req.history, 'HISTORY'),
    recordText(req.assessment, 'EXAMINATION'),
    req.problems?.length ? `COMMITTED PROBLEMS:\n${req.problems.map((p, i) => `  ${i + 1}. ${p}`).join('\n')}` : '',
    req.resultsText ? `INVESTIGATION RESULTS (latest, with trends):\n  ${req.resultsText}` : '',
  ].filter(Boolean).join('\n\n');

  const stg = stgMatches(clinical, 4);
  const stgBlock = stg.length
    ? `RELEVANT SA STG ENTRIES (anchor management + investigations to these):\n${stg.map(compactSTG).join('\n')}`
    : '';
  const protocolMatches = protocolStore.match(clinical, req.dept);
  const protocolBlock = protocolMatches.length
    ? `THIS FACILITY'S PROTOCOL (overrides generic STG where specific):\n${protocolMatches.map(m => `- [${m.title}]: ${m.excerpt}`).join('\n')}`
    : '';

  const prevBlock = req.previousPicture?.differentials?.length
    ? `PREVIOUS WORKING PICTURE (your last assessment of this patient — you MUST reconcile against it):
${req.previousPicture.differentials.map(d => `- ${d.dx}: ${d.confidence}% (${d.band})`).join('\n')}

RECONCILIATION RULES:
- For every diagnosis above, either carry it forward (same or moved confidence) or explicitly retire it in the narrative — never silently drop one.
- Every confidence CHANGE gets a "shift": {"from": <old %>, "because": "<the specific new finding/result that moved it>"}.
- "narrative" is the consultant's one-paragraph read of what just changed: which results landed, which way each moved the picture, and what that does to management TODAY. If nothing new arrived, say the picture is unchanged and why.`
    : '';

  const system = `${MEDAI_SYSTEM_PROMPT}

${specialtyLens(req.dept, req.subDept)}

TASK — THE WORKING PICTURE (live weighted differential for the bedside):
You maintain the clinician's working diagnostic picture for THIS patient. This is the tool's heart: a ranked differential with HONEST calibrated confidence, and for each diagnosis the specific investigations that would move it — so every test is chosen to discriminate, and every result visibly updates the picture and the plan.

RULES:
- 2-4 differentials, ordered by clinical priority (a dangerous must-exclude outranks a benign likely). Include the must-exclude even at low confidence — that is the point of it.
- BE TERSE EVERYWHERE: supporting/against max 3 items each, a few words per item; discriminators 1-3 per diagnosis; every "why" one tight line. The whole JSON must fit comfortably in the token budget — a truncated picture is a useless picture.
- "confidence" is your honest calibrated estimate (0-100) given ONLY what is recorded. Do not inflate to look decisive; do not deflate to hedge. They need not sum to 100.
- "supporting"/"against": the ACTUAL recorded findings, quoted tersely — never invented ones. If a classic finding is absent from the record, it belongs in a discriminator or the mustNotMiss, not in "supporting".
- "discriminators": per diagnosis, the 1-3 tests that MOVE it, each stating the direction ("moves it up if X, down if Y"). Mark status "done" if the record already contains its result, "pending" if ordered/awaited per the record, else "suggested". Priority "now" only for genuinely time-critical ones.
- "managementNow": only what the CURRENT confidence level already justifies (with doses where STG applies) — do not pre-treat a 20% diagnosis unless it is a must-exclude with a time-critical safety action; say which diagnosis each action serves.
- "mustNotMiss": the single most dangerous realistic miss for this presentation today, one line.
- TEACH WHILE YOU WORK: every "why" is the consultant explaining the reasoning to the intern in one tight line — the logic, not a textbook recitation.
- PLAIN TEXT in every string: no markdown, no *, #, backticks or bullet glyphs.
${prevBlock ? `\n${prevBlock}\n` : ''}
Respond with ONLY a JSON object:
{
  "differentials": [
    { "dx": "...", "icd10": "...", "confidence": 0, "band": "confirmed|likely|possible|must-exclude",
      "supporting": ["..."], "against": ["..."], "why": "...",
      ${prevBlock ? '"shift": { "from": 0, "because": "..." },' : ''}
      "discriminators": [ { "test": "...", "moves": "...", "status": "suggested|pending|done", "priority": "now|today|routine" } ] }
  ],
  "mustNotMiss": "...",
  "managementNow": ["..."],
  "narrative": "${prevBlock ? 'the consultant read of what changed and what it means for management today' : 'one-paragraph consultant read of the picture as it stands'}"
}`;

  const userContent = `${clinical}

${stgBlock}
${protocolBlock}`;

  const response = await createMessage({
    model: MODELS.reasoning,
    max_tokens: 4000,
    system: [
      // The task frame + specialty lens are stable per department; the record
      // changes every call. Static-first ordering lets repeat calls on the same
      // ward session hit the prompt cache.
      { type: 'text', text: system, cache_control: { type: 'ephemeral' } },
    ],
    messages: [{ role: 'user', content: userContent }],
  });

  // Join ALL text blocks — some models emit multiple.
  const text = response.content
    .filter((b): b is { type: 'text'; text: string } => b.type === 'text')
    .map(b => b.text)
    .join('');
  const parsed = tryExtractJSON<Partial<WorkingPicture>>(text) ?? {};
  if (!Array.isArray(parsed.differentials) || parsed.differentials.length === 0) {
    // An empty picture is a failed picture — surface WHY in the logs so the
    // failure mode is diagnosable in production, not just locally.
    console.warn(
      `[working-picture] empty differentials; stop=${response.stop_reason}; text head: ${text.slice(0, 300).replace(/\n/g, ' ')}`
    );
  }

  const differentials: WeightedDifferential[] = (Array.isArray(parsed.differentials) ? parsed.differentials : [])
    .filter(d => d && typeof d.dx === 'string')
    .slice(0, 6)
    .map(d => {
      const confidence = clampPct(d.confidence);
      const shift =
        d.shift && typeof d.shift === 'object' && Number.isFinite(Number((d.shift as { from?: unknown }).from))
          ? { from: clampPct((d.shift as { from: unknown }).from), because: String((d.shift as { because?: unknown }).because ?? '') }
          : undefined;
      return {
        dx: d.dx,
        icd10: typeof d.icd10 === 'string' ? d.icd10 : undefined,
        confidence,
        band: bandFor(confidence, d.band),
        supporting: Array.isArray(d.supporting) ? d.supporting.filter((x): x is string => typeof x === 'string') : [],
        against: Array.isArray(d.against) ? d.against.filter((x): x is string => typeof x === 'string') : [],
        why: typeof d.why === 'string' ? d.why : '',
        shift,
        discriminators: (Array.isArray(d.discriminators) ? d.discriminators : [])
          .filter(t => t && typeof (t as Discriminator).test === 'string')
          .slice(0, 4)
          .map(t => {
            const disc = t as Partial<Discriminator>;
            return {
              test: disc.test as string,
              moves: typeof disc.moves === 'string' ? disc.moves : '',
              status: disc.status === 'done' || disc.status === 'pending' ? disc.status : 'suggested',
              priority: disc.priority === 'now' || disc.priority === 'routine' ? disc.priority : 'today',
            };
          }),
      };
    });

  const managementNow = Array.isArray(parsed.managementNow)
    ? parsed.managementNow.filter((x): x is string => typeof x === 'string')
    : [];

  // Deterministic post-pass — never trust the model alone with drugs. Advisory
  // allergy mentions are filtered as elsewhere; pregnancy detected from the
  // record so the teratogen net is armed in O&G.
  const allText = [
    req.dept,
    req.subDept ?? '',
    ...Object.values(req.intake),
    ...Object.values(req.history),
    ...Object.values(req.assessment),
    ...(req.problems ?? []),
  ].filter(Boolean).join(' ');
  const safety = runSafetyCheck({
    medicationsText: req.history.medications,
    allergiesText: req.intake.allergies,
    plannedLines: managementNow.filter(l => !/allerg/i.test(l)),
    isPregnant: looksPregnant(allText),
    conditionsText: [allText, ...differentials.map(d => d.dx)].join(' '),
  });

  return {
    differentials,
    mustNotMiss: typeof parsed.mustNotMiss === 'string' ? parsed.mustNotMiss : '',
    managementNow,
    narrative: typeof parsed.narrative === 'string' ? parsed.narrative : '',
    safety,
    disclaimer: HOD_DISCLAIMER,
  };
}
