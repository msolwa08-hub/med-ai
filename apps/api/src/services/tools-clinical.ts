import Anthropic from '@anthropic-ai/sdk';
import { betaConfig } from '../lib/beta-config.js';
import { extractJSON } from '../lib/json-extract.js';
import { STG_ENTRIES, type STGSeedEntry } from '../data/stg-entries.js';
import { checkPrescriptionSafety, type SafetyWarning } from './prescription-safety.js';
import { protocolStore } from './protocol-store.js';
import { specialtyLens } from './hod-prompt.js';

const client = new Anthropic({ apiKey: betaConfig.ANTHROPIC_API_KEY });

// ─── STG retrieval ────────────────────────────────────────────────────────────
// Cheap keyword retrieval: score each STG entry against the patient's clinical
// text and inject the best matches into the prompt in compact form, so the
// AI's management plans are anchored to the actual SA Standard Treatment
// Guidelines rather than free-styled.

export function stgMatches(clinicalText: string, limit = 4): STGSeedEntry[] {
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

export function compactSTG(e: STGSeedEntry): string {
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
  protocolTitle?: string;
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

  const protocolMatches = protocolStore.match(clinical, s.dept);
  const protocolBlock = protocolMatches.length
    ? `THIS FACILITY'S OWN PROTOCOL (uploaded locally — where it gives a specific instruction, FOLLOW IT over the generic STG above and set "protocolTitle" to its title; local protocols reflect this hospital's actual formulary/resources):\n${protocolMatches.map(m => `- [${m.title}]: ${m.excerpt}`).join('\n')}`
    : '';

  const currentMeds = s.history.medications ?? '';

  const prompt = `You are MedAI Scribe generating a problem-based assessment for a South African hospital intern. From the patient record below, produce a concise, clinically-ordered problem list.

${specialtyLens(s.dept)}

${clinical}

${stgBlock}
${protocolBlock ? `\n${protocolBlock}\n` : ''}
RULES:
- One problem per genuinely separate clinical issue (max 6), most urgent first. Include significant abnormal findings (e.g. deranged creatinine -> "AKI?") not just the admission diagnosis.
- workingDx: single most likely diagnosis. differentials: 2-4 realistic alternatives, dangerous ones first.
- management: 3-6 concrete numbered-style steps with doses where an STG entry applies; tag "stgCondition" with the matched guideline's condition name when used, and include its icd10 code.
- FACILITY PROTOCOL OVERRIDES STG: if this facility's own uploaded protocol (above, if present) conflicts with or refines the generic STG for a problem, follow the facility protocol and set "protocolTitle" to its title instead of (or alongside) "stgCondition".
- ESSENTIAL MEDICINES LIST (EML): prefer agents on the SA National EML (Core list) available at this level of care; if the best agent is Complementary-list or not EML-listed, say so explicitly in the management step (e.g. "not on PHC EML — refer/motivate") rather than silently prescribing outside formulary.
- POLYPHARMACY & INTERACTIONS: the patient's current medications are: "${currentMeds || 'none recorded'}". Do not propose agents that clash with these or with the recorded allergies; if unavoidable, note the precaution inside the management step.
- Consider AKI risk whenever nephrotoxics, sepsis, hypovolaemia or contrast appear.
- HIV: raise it as its own problem ONLY when the status is POSITIVE (ART regimen/adherence, viral load, PMTCT if pregnant) or UNKNOWN/undocumented (offer testing). If HIV is DOCUMENTED NEGATIVE, do NOT create an HIV problem — a negative result is not a problem and padding the list with it dilutes the real issues. Never skip a genuinely positive/unknown status because the admission reason seems unrelated.
- FEMALE ACUTE ABDOMEN / PELVIC PAIN (reproductive age): FIRST action is a pregnancy test — an ectopic is the diagnosis that kills. For any lower-abdominal/pelvic pain in a woman who could be pregnant, the differentials must include the gynae causes an intern under-weights: ectopic pregnancy, ovarian torsion (sudden severe unilateral pain + vomiting + adnexal mass — a time-critical surgical emergency; a normal Doppler does NOT exclude it), ruptured/haemorrhagic ovarian cyst, PID / tubo-ovarian abscess, and mittelschmerz — alongside the surgical causes (appendicitis, etc.). Do not default to appendicitis or "UTI" and stop.
- ANTENATAL CARE QUALITY (when pregnant): if the number of antenatal visits recorded is fewer than expected for the gestational age under the SA BANC-Plus schedule (contacts at booking, ~20, 26, 30, 34, 36, 38, 40 weeks), flag this as a problem ("booked late" / "sub-optimal antenatal care") and escalate other pregnancy risk-screening accordingly. If iron/folate/calcium supplementation is not confirmed as taken, note it as a gap to address, not just to prescribe.

RESPOND with ONLY JSON:
{
  "problems": [{ "problem": "...", "workingDx": "...", "icd10": "...", "stgCondition": "...", "protocolTitle": "...", "differentials": ["..."], "management": ["..."] }],
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
      protocolTitle: typeof p.protocolTitle === 'string' ? p.protocolTitle : undefined,
      differentials: Array.isArray(p.differentials) ? p.differentials.filter((d): d is string => typeof d === 'string') : [],
      management: Array.isArray(p.management) ? p.management.filter((m): m is string => typeof m === 'string') : [],
    }));

  // Deterministic safety net on top of the AI: run current meds + every
  // proposed management line through the curated interaction/allergy checker.
  // Pregnancy is DETECTED from the record (not assumed) so the teratogen BLOCKs
  // actually fire in O&G — the department where pregnancy is the default and
  // where an unfired net is highest-risk.
  const recordText = [
    s.dept,
    ...Object.values(s.intake),
    ...Object.values(s.history),
    ...Object.values(s.assessment),
  ].filter(Boolean).join(' ');
  const safety = runSafetyCheck({
    medicationsText: currentMeds,
    allergiesText: s.intake.allergies,
    // Advisory lines that merely mention an allergy ("avoid penicillin — use
    // erythromycin") are not prescriptions of the allergen; filtering them
    // stops a false-positive BLOCK on a correct allergy-avoiding plan.
    plannedLines: problems.flatMap(p => p.management).filter(l => !/allerg/i.test(l)),
    problemCodes: problems.map(p => p.icd10 ?? ''),
    isPregnant: looksPregnant(recordText),
    conditionsText: [recordText, ...problems.map(p => `${p.problem} ${p.workingDx}`)].join(' '),
  });

  return { problems, safety, note: typeof parsed?.note === 'string' ? parsed.note : '' };
}

// Detect pregnancy from the free-text record so the teratogen safety net fires
// where it should. Deliberately liberal in an obstetric context (a missed
// pregnancy flag is the dangerous direction), but keyed on real markers so a
// gynae or non-O&G record isn't falsely flagged.
export function looksPregnant(text: string): boolean {
  const t = text.toLowerCase();
  if (/\bnot pregnant\b|pregnancy test negative|hcg negative|βhcg neg|urine hcg negative/.test(t)) return false;
  return (
    /\bpregnan|antenatal|gestation|\bega\b|\bedd\b|\blmp\b|liquor|fetal|foetal|gravida|\bg\d\s*p\d|\bprimigravid|multigravid|trimester|\b\d{1,2}\s*(\+\s*\d)?\s*(weeks?|\/40)\b|booking visit|banc|pmtct|antepartum|intrapartum/.test(t) ||
    /pregnancy test positive|hcg positive|βhcg pos|urine hcg positive/.test(t)
  );
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
  conditionsText?: string;
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
    conditionsText: input.conditionsText,
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
