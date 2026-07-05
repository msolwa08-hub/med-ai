import Anthropic from '@anthropic-ai/sdk';
import { betaConfig } from '../lib/beta-config.js';
import { extractJSON } from '../lib/json-extract.js';
import { STG_ENTRIES, type STGSeedEntry } from '../data/stg-entries.js';
import { checkPrescriptionSafety, type SafetyWarning } from './prescription-safety.js';

const client = new Anthropic({ apiKey: betaConfig.ANTHROPIC_API_KEY });

// ─── STG retrieval ────────────────────────────────────────────────────────────
// Cheap keyword retrieval: score each STG entry against the patient's clinical
// text and inject the best matches into the prompt in compact form, so the
// AI's management plans are anchored to the actual SA Standard Treatment
// Guidelines rather than free-styled.

function stgMatches(clinicalText: string, limit = 4): STGSeedEntry[] {
  const text = clinicalText.toLowerCase();
  const scored = STG_ENTRIES.map(entry => {
    // >3 alone drops real 3-letter clinical anchors that matter a lot here —
    // HIV, ART, TB, PID, DVT, UTI — so keep those explicitly even at length 3.
    const words = entry.condition.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length >= 3);
    let score = 0;
    for (const w of words) if (text.includes(w)) score++;
    if (text.includes(entry.condition.toLowerCase())) score += 5;
    if (entry.icdCode && text.toUpperCase().includes(entry.icdCode)) score += 5;
    return { entry, score };
  });
  return scored
    .filter(s => s.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.entry);
}

function compactSTG(e: STGSeedEntry): string {
  const meds = e.firstLinemedications
    .map(m => `${m.name} ${m.dose} ${m.route} ${m.frequency} x ${m.duration}`)
    .join('; ');
  return `- ${e.condition} [${e.icdCode}] (${e.levelOfCare} care): 1st-line: ${meds}. Investigations: ${e.investigations.map(i => i.name).join(', ')}. Refer if: ${e.referralCriteria.slice(0, 3).join('; ')}`;
}

// ─── Suggest problems ─────────────────────────────────────────────────────────

export interface PatientSnapshot {
  dept: string;
  intake: Record<string, string | undefined>;
  history: Record<string, string | undefined>;
  assessment: Record<string, string | undefined>;
}

export interface SuggestedProblem {
  problem: string;
  workingDx: string;
  icd10?: string;
  stgCondition?: string;
  differentials: string[];
  management: string[];
}

export interface SuggestProblemsResponse {
  problems: SuggestedProblem[];
  safety: SafetyWarning[];
  note: string;
}

function snapshotText(s: PatientSnapshot): string {
  const part = (label: string, obj: Record<string, string | undefined>) =>
    `${label}:\n` +
    Object.entries(obj)
      .filter(([, v]) => v && v.trim())
      .map(([k, v]) => `  ${k}: ${v}`)
      .join('\n');
  return [part('INTAKE', s.intake), part('HISTORY', s.history), part('ASSESSMENT', s.assessment)].join('\n\n');
}

export async function suggestProblems(s: PatientSnapshot): Promise<SuggestProblemsResponse> {
  const clinical = snapshotText(s);
  const stg = stgMatches(clinical);
  const stgBlock = stg.length
    ? `RELEVANT SA STANDARD TREATMENT GUIDELINES (anchor management to these, cite the condition name):\n${stg.map(compactSTG).join('\n')}`
    : 'No STG entry matched — use standard SA hospital-level practice and say so in the note.';

  const currentMeds = s.history.medications ?? '';

  const prompt = `You are MedAI Scribe generating a problem-based assessment for a South African hospital intern. From the patient record below, produce a concise, clinically-ordered problem list.

${clinical}

${stgBlock}

RULES:
- One problem per genuinely separate clinical issue (max 6), most urgent first. Include significant abnormal findings (e.g. deranged creatinine -> "AKI?") not just the admission diagnosis.
- workingDx: single most likely diagnosis. differentials: 2-4 realistic alternatives, dangerous ones first.
- management: 3-6 concrete numbered-style steps with doses where an STG entry applies; tag "stgCondition" with the matched guideline's condition name when used, and include its icd10 code.
- ESSENTIAL MEDICINES LIST (EML): prefer agents on the SA National EML (Core list) available at this level of care; if the best agent is Complementary-list or not EML-listed, say so explicitly in the management step (e.g. "not on PHC EML — refer/motivate") rather than silently prescribing outside formulary.
- POLYPHARMACY & INTERACTIONS: the patient's current medications are: "${currentMeds || 'none recorded'}". Do not propose agents that clash with these or with the recorded allergies; if unavoidable, note the precaution inside the management step.
- Consider AKI risk whenever nephrotoxics, sepsis, hypovolaemia or contrast appear.
- HIV: if HIV status is positive or unknown, always raise it as its own problem — ART regimen/adherence and viral load if positive (PMTCT if pregnant); offer/repeat testing if unknown or not done this pregnancy. Never skip this because the admission reason is unrelated.
- ANTENATAL CARE QUALITY (when pregnant): if the number of antenatal visits recorded is fewer than expected for the gestational age under the SA BANC-Plus schedule (contacts at booking, ~20, 26, 30, 34, 36, 38, 40 weeks), flag this as a problem ("booked late" / "sub-optimal antenatal care") and escalate other pregnancy risk-screening accordingly. If iron/folate/calcium supplementation is not confirmed as taken, note it as a gap to address, not just to prescribe.

RESPOND with ONLY JSON:
{
  "problems": [{ "problem": "...", "workingDx": "...", "icd10": "...", "stgCondition": "...", "differentials": ["..."], "management": ["..."] }],
  "note": "<one line: anything the intern must not miss>"
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('');
  const parsed = extractJSON<Partial<SuggestProblemsResponse>>(text);

  const problems: SuggestedProblem[] = (Array.isArray(parsed?.problems) ? parsed.problems : [])
    .filter(p => p && typeof p.problem === 'string')
    .map(p => ({
      problem: p.problem,
      workingDx: typeof p.workingDx === 'string' ? p.workingDx : '',
      icd10: typeof p.icd10 === 'string' ? p.icd10 : undefined,
      stgCondition: typeof p.stgCondition === 'string' ? p.stgCondition : undefined,
      differentials: Array.isArray(p.differentials) ? p.differentials.filter((d): d is string => typeof d === 'string') : [],
      management: Array.isArray(p.management) ? p.management.filter((m): m is string => typeof m === 'string') : [],
    }));

  // Deterministic safety net on top of the AI: run current meds + every
  // proposed management line through the curated interaction/allergy checker.
  const safety = runSafetyCheck({
    medicationsText: currentMeds,
    allergiesText: s.intake.allergies,
    plannedLines: problems.flatMap(p => p.management),
    problemCodes: problems.map(p => p.icd10 ?? ''),
  });

  return { problems, safety, note: typeof parsed?.note === 'string' ? parsed.note : '' };
}

// ─── Deterministic interaction / polypharmacy check ──────────────────────────
// No AI needed: split the free-text medication list into lines and run them
// (plus any planned management lines) through the curated safety checker.

export interface InteractionCheckInput {
  medicationsText?: string;
  allergiesText?: string;
  plannedLines?: string[];
  problemCodes?: string[];
  isPregnant?: boolean;
}

export interface InteractionCheckResponse {
  warnings: SafetyWarning[];
  medCount: number;
  polypharmacy: boolean;
}

function splitMedLines(text: string): string[] {
  return text
    .split(/[\n;,]+/)
    .map(l => l.trim())
    .filter(l => l.length >= 3 && !/^(none|nil|nkda|no known)/i.test(l));
}

export function runSafetyCheck(input: InteractionCheckInput): SafetyWarning[] {
  const meds = splitMedLines(input.medicationsText ?? '');
  const lines = [...meds, ...(input.plannedLines ?? [])];
  return checkPrescriptionSafety(lines, {
    allergiesText: input.allergiesText,
    isPregnant: input.isPregnant,
    problemCodes: input.problemCodes,
  });
}

export function interactionCheck(input: InteractionCheckInput): InteractionCheckResponse {
  const meds = splitMedLines(input.medicationsText ?? '');
  const warnings = runSafetyCheck(input);
  const polypharmacy = meds.length >= 5;
  if (polypharmacy) {
    warnings.push({
      severity: 'WARN',
      drug: `${meds.length} concurrent medications`,
      category: 'INTERACTION',
      reason: 'Polypharmacy (≥5 agents) — review each for ongoing indication, dose, and deprescribing opportunities',
    });
  }
  return { warnings, medCount: meds.length, polypharmacy };
}
