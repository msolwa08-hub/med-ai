/**
 * Clinical Reasoning Service — STG-linked diagnostic decision support.
 *
 * Takes the completed AI history for a consultation (general, O&G, or any
 * specialty department, all of which persist their structured result into
 * MedicalHistory.clinicalScores) plus examination findings when present, and
 * produces a doctor-facing reasoning package:
 *
 *   - Ranked differential diagnoses with calibrated probabilities and an
 *     explicit reasoning chain (supporting vs opposing features)
 *   - Each differential linked to the SA Standard Treatment Guidelines:
 *     first-line medications, investigations, level of care, and referral
 *     criteria pulled from the bundled STG dataset by ICD-10 / condition name
 *   - Recommended investigations with rationale and priority
 *   - Red flags and an overall urgency grade
 *
 * Everything is a DRAFT for the clinician to review — never a final diagnosis.
 * The package is persisted (encrypted at rest via the DifferentialDiagnosis
 * table's Json column, which holds no direct identifiers) so the existing
 * GET /diagnosis/:consultationId flow can also surface it.
 */

import { anthropic, CLAUDE_MODEL } from '../lib/claude.js';
import { getSTGByICD10, searchSTGEntries } from './stg.service.js';
import { extractJSON } from '../lib/json-extract.js';
import type { STGSeedEntry } from '../data/stg-entries.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StgLink {
  available: boolean;
  condition?: string;
  icdCode?: string;
  levelOfCare?: string;
  firstLineMedications?: Array<{
    medicine: string;
    dose?: string;
    duration?: string;
  }>;
  keyInvestigations?: string[];
  referralCriteria?: string[];
  nonPharmacological?: string[];
}

export interface ReasonedDifferential {
  diagnosis: string;
  icd10Code: string;
  probability: number; // 0-100, calibrated estimate
  band: 'HIGH' | 'MODERATE' | 'LOW';
  reasoning: string;
  supportingFeatures: string[];
  againstFeatures: string[];
  stg: StgLink;
}

export interface ClinicalReasoningPackage {
  chiefComplaint: string;
  differentials: ReasonedDifferential[];
  recommendedInvestigations: Array<{
    name: string;
    rationale: string;
    priority: 'ROUTINE' | 'URGENT' | 'STAT';
  }>;
  redFlags: string[];
  urgency: 'ROUTINE' | 'SOON' | 'URGENT' | 'EMERGENCY';
  safetyNetting: string;
  generatedAt: string;
  aiModel: string;
}

// ─── STG linkage ──────────────────────────────────────────────────────────────

function toStgLink(entry: STGSeedEntry | undefined): StgLink {
  if (!entry) return { available: false };
  return {
    available: true,
    condition: entry.condition,
    icdCode: entry.icdCode,
    levelOfCare: entry.levelOfCare,
    firstLineMedications: entry.firstLinemedications.slice(0, 4).map((m) => {
      const med = m as unknown as Record<string, string | undefined>;
      return {
        medicine: med.medicine ?? med.name ?? 'See STG',
        dose: med.dose ?? med.doseAdult,
        duration: med.duration,
      };
    }),
    keyInvestigations: entry.investigations.slice(0, 5).map((inv) => {
      const i = inv as unknown as Record<string, string | undefined>;
      return i.name ?? i.test ?? String(inv);
    }),
    referralCriteria: entry.referralCriteria.slice(0, 5),
    nonPharmacological: entry.nonPharmacological.slice(0, 4),
  };
}

/** Look up an STG entry for a differential — exact ICD-10 first, then fuzzy name. */
export function linkDifferentialToSTG(diagnosis: string, icd10Code: string): StgLink {
  // Exact ICD-10 match (also try the 3-character category, e.g. J18 for J18.9)
  const exact = getSTGByICD10(icd10Code) ?? getSTGByICD10(icd10Code.split('.')[0]);
  if (exact) return toStgLink(exact);

  // Fuzzy condition-name match
  const results = searchSTGEntries(diagnosis);
  if (results.entries.length > 0) return toStgLink(results.entries[0]);

  // Last resort: first meaningful word of the diagnosis (e.g. "pneumonia")
  const keyword = diagnosis
    .split(/\s+/)
    .filter((w) => w.length > 4)
    .slice(-1)[0];
  if (keyword) {
    const byKeyword = searchSTGEntries(keyword);
    if (byKeyword.entries.length > 0) return toStgLink(byKeyword.entries[0]);
  }

  return { available: false };
}

// ─── Reasoning generation ─────────────────────────────────────────────────────

export interface ReasoningInput {
  age: number;
  gender?: string;
  chiefComplaint: string;
  historySummary: string;
  /** The structured department history JSON, if a specialty module ran. */
  structuredHistory?: unknown;
  examinationFindings?: string;
  department?: string;
}

export async function generateClinicalReasoning(
  input: ReasoningInput
): Promise<ClinicalReasoningPackage> {
  const prompt = `You are a senior South African clinician providing DRAFT diagnostic decision support for a doctor. Reason like a physician: weigh findings for and against each diagnosis, and be honest about uncertainty.

PATIENT: age ${input.age}${input.gender ? `, ${input.gender.toLowerCase()}` : ''}${input.department ? ` — ${input.department} consultation` : ''}
CHIEF COMPLAINT: ${input.chiefComplaint}

HISTORY SUMMARY:
${input.historySummary}
${input.structuredHistory ? `\nSTRUCTURED HISTORY:\n${JSON.stringify(input.structuredHistory, null, 2).slice(0, 4000)}` : ''}
${input.examinationFindings ? `\nEXAMINATION FINDINGS:\n${input.examinationFindings}` : ''}

INSTRUCTIONS:
- South African context: high HIV/TB prevalence, quadruple burden of disease; think common-things-first for SA
- 3 to 6 differentials, ranked. Probabilities are calibrated ESTIMATES (0-100) and need not sum to 100
- For EVERY differential give an explicit reasoning chain: which findings support it, which oppose it
- Use valid ICD-10 codes
- Recommend only investigations that would change management, each with rationale and priority
- Surface every red flag from the history
- This is a DRAFT for the doctor — be conservative and flag gaps

Return ONLY valid JSON:
{
  "chiefComplaint": "string",
  "differentials": [
    {
      "diagnosis": "string",
      "icd10Code": "string",
      "probability": 0,
      "band": "HIGH|MODERATE|LOW",
      "reasoning": "string — the clinical reasoning chain in 2-3 sentences",
      "supportingFeatures": ["string"],
      "againstFeatures": ["string"]
    }
  ],
  "recommendedInvestigations": [
    { "name": "string", "rationale": "string", "priority": "ROUTINE|URGENT|STAT" }
  ],
  "redFlags": ["string"],
  "urgency": "ROUTINE|SOON|URGENT|EMERGENCY",
  "safetyNetting": "string — what should prompt immediate return/escalation"
}`;

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    temperature: 0,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = (response as { content: Array<{ type: string; text?: string }> }).content
    .filter((b) => b.type === 'text')
    .map((b) => b.text ?? '')
    .join('');

  // extractJSON strips fences and repairs truncated output
  const parsed = extractJSON<Omit<
    ClinicalReasoningPackage,
    'generatedAt' | 'aiModel'
  > & { differentials: Array<Omit<ReasonedDifferential, 'stg'>> }>(text);

  // Link every differential to the SA STGs
  const differentials: ReasonedDifferential[] = (parsed.differentials ?? []).map((d) => ({
    ...d,
    stg: linkDifferentialToSTG(d.diagnosis, d.icd10Code ?? ''),
  }));

  return {
    chiefComplaint: parsed.chiefComplaint ?? input.chiefComplaint,
    differentials,
    recommendedInvestigations: parsed.recommendedInvestigations ?? [],
    redFlags: parsed.redFlags ?? [],
    urgency: parsed.urgency ?? 'ROUTINE',
    safetyNetting: parsed.safetyNetting ?? 'Return immediately if symptoms worsen.',
    generatedAt: new Date().toISOString(),
    aiModel: CLAUDE_MODEL,
  };
}
