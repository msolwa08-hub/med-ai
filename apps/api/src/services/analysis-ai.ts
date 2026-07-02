/**
 * Unified Investigation Analysis Service — one AI entry point for the
 * modalities a SA consultation actually generates:
 *
 *   LAB        — chemistry/haematology/serology panels (text report or photo
 *                of a printed report). Every analyte is extracted, compared
 *                against its reference range, and flagged NORMAL/LOW/HIGH/
 *                CRITICAL using standard critical-value thresholds.
 *   XRAY       — plain films, read systematically (CXR: airway → bones →
 *                cardiac → diaphragm → effusions → fields). TB-aware for SA.
 *   ECG        — rate, rhythm, axis, intervals, ST-T morphology. STEMI
 *                criteria escalate to EMERGENCY.
 *   ULTRASOUND — general + obstetric. (The dedicated /ultrasound/interpret
 *                route remains for the O&G deep-dive workflow.)
 *
 * Input may be report TEXT, an IMAGE (base64 → Claude vision), or both.
 * Output is a uniform InvestigationAnalysis package that the route persists
 * into the Investigation table in the same {result: ...} envelope the
 * clinical-reasoning loop already consumes — so every analysis automatically
 * feeds the differential on the next reasoning pass.
 *
 * Everything is a DRAFT for the clinician: the reading doctor remains
 * responsible for the formal report.
 */

import { anthropic, CLAUDE_MODEL, logUsage } from '../lib/claude.js';
import { extractJSON } from '../lib/json-extract.js';

export type AnalysisModality = 'LAB' | 'XRAY' | 'ECG' | 'ULTRASOUND';

export interface LabValue {
  analyte: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  flag: 'NORMAL' | 'LOW' | 'HIGH' | 'CRITICAL';
}

export interface InvestigationAnalysis {
  modality: AnalysisModality;
  /** One-paragraph clinical summary — this is what feeds the reasoning loop. */
  summary: string;
  findings: string[];
  /** Lab panels only: per-analyte extraction. */
  values?: LabValue[];
  /** Findings that need action NOW (critical lab values, STEMI, pneumothorax…). */
  criticalFindings: string[];
  impression: string;
  /** Which differentials this result supports or refutes, if context given. */
  clinicalCorrelation?: string;
  recommendedActions: string[];
  urgency: 'ROUTINE' | 'SOON' | 'URGENT' | 'EMERGENCY';
  limitations: string;
  generatedAt: string;
  aiModel: string;
}

export interface AnalysisInput {
  modality: AnalysisModality;
  /** Study/test name, e.g. "U&E + Creatinine", "Chest X-ray PA". */
  name?: string;
  reportText?: string;
  /** Base64-encoded image (photo of report, film, ECG strip). */
  imageBase64?: string;
  imageMediaType?: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
  /** Why the study was ordered — sharpens the read. */
  clinicalQuestion?: string;
  patientAge?: number;
  patientGender?: string;
  isPregnant?: boolean;
}

// ─── Modality-specific reading instructions ───────────────────────────────────

const MODALITY_INSTRUCTIONS: Record<AnalysisModality, string> = {
  LAB: `You are analysing a LABORATORY report.
- Extract EVERY analyte into "values": analyte, value, unit, referenceRange, flag
- Flags: NORMAL, LOW, HIGH, or CRITICAL. Use standard critical-value thresholds, e.g.
  K+ <2.8 or >6.2 mmol/L; Na+ <120 or >160; glucose <2.8 or >25; Hb <7 g/dL;
  platelets <20; WCC <1 or >50; creatinine acutely >354 µmol/L; troponin above the
  99th percentile; positive blood culture; CD4 <100 with symptoms
- Every CRITICAL flag must also appear in criticalFindings with the action required
- Trend interpretation: if prior values appear in the report, comment on direction`,
  XRAY: `You are analysing a PLAIN RADIOGRAPH (X-ray).
- Read systematically. For a CXR: technical adequacy → airway/trachea → bones/soft
  tissue → cardiac silhouette (CTR) → diaphragm/costophrenic angles → lung fields
- South African context: actively look for TB signs (upper-zone infiltrates,
  cavitation, hilar/mediastinal lymphadenopathy, miliary pattern, effusion)
- criticalFindings: tension pneumothorax, large effusion, free air under diaphragm,
  widened mediastinum, unstable fracture — anything needing same-day action
- If the image is inadequate for a finding, say so in limitations, never guess`,
  ECG: `You are analysing a 12-LEAD ECG (or rhythm strip).
- Report: rate, rhythm, axis, PR/QRS/QTc intervals, P-wave morphology, ST segments
  and T waves lead by lead where abnormal
- criticalFindings: STEMI criteria (ST elevation with reciprocal changes), new LBBB
  with ischaemic symptoms, VT, complete heart block, QTc >500ms, hyperkalaemia
  pattern (peaked T, wide QRS) — each with the immediate action
- STEMI or unstable arrhythmia → urgency EMERGENCY`,
  ULTRASOUND: `You are analysing an ULTRASOUND report or image.
- Report per organ/region systematically; for obstetric studies include viability,
  number, presentation, liquor, placenta, biometry vs dates
- criticalFindings: ectopic pregnancy, free fluid with instability, absent fetal
  heartbeat where previously present, torsion signs, AAA — with immediate action`,
};

// ─── Analyzer ─────────────────────────────────────────────────────────────────

export async function analyzeInvestigation(input: AnalysisInput): Promise<InvestigationAnalysis> {
  const contextLines = [
    input.patientAge != null ? `Age ${input.patientAge}` : null,
    input.patientGender ? input.patientGender.toLowerCase() : null,
    input.isPregnant ? 'PREGNANT' : null,
  ].filter(Boolean);

  const prompt = `You are a senior South African clinician providing a DRAFT ${input.modality} analysis for the treating doctor. The doctor remains responsible for the formal report — be precise, flag uncertainty, never over-call.

${MODALITY_INSTRUCTIONS[input.modality]}

PATIENT: ${contextLines.length ? contextLines.join(', ') : 'context not provided'}
STUDY: ${input.name ?? input.modality}
${input.clinicalQuestion ? `CLINICAL QUESTION: ${input.clinicalQuestion}` : ''}
${input.reportText ? `\nREPORT TEXT:\n${input.reportText.slice(0, 12000)}` : ''}
${input.imageBase64 ? '\nAn image of the study is attached — read it directly.' : ''}

Return ONLY valid JSON:
{
  "summary": "one-paragraph clinical summary of the result",
  "findings": ["specific finding"],
  ${input.modality === 'LAB' ? '"values": [{ "analyte": "", "value": "", "unit": "", "referenceRange": "", "flag": "NORMAL|LOW|HIGH|CRITICAL" }],' : ''}
  "criticalFindings": ["finding requiring immediate action — empty array if none"],
  "impression": "the bottom line for the treating doctor",
  "clinicalCorrelation": "how this answers the clinical question, or null",
  "recommendedActions": ["next step"],
  "urgency": "ROUTINE|SOON|URGENT|EMERGENCY",
  "limitations": "what this analysis cannot exclude"
}`;

  const content: Array<
    | { type: 'text'; text: string }
    | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
  > = [];
  if (input.imageBase64) {
    content.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: input.imageMediaType ?? 'image/jpeg',
        data: input.imageBase64,
      },
    });
  }
  content.push({ type: 'text', text: prompt });

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 3072,
    temperature: 0,
    messages: [{ role: 'user', content: content as never }],
  });

  logUsage(`analysis:${input.modality.toLowerCase()}`, CLAUDE_MODEL, {
    input_tokens: (response as { usage: { input_tokens: number } }).usage.input_tokens,
    output_tokens: (response as { usage: { output_tokens: number } }).usage.output_tokens,
  });

  const text = (response as { content: Array<{ type: string; text?: string }> }).content
    .filter((b) => b.type === 'text')
    .map((b) => b.text ?? '')
    .join('');

  const parsed = extractJSON<Omit<InvestigationAnalysis, 'modality' | 'generatedAt' | 'aiModel'>>(text);

  // A critical finding is never ROUTINE, whatever the model said
  let urgency = parsed.urgency ?? 'ROUTINE';
  const criticalFindings = parsed.criticalFindings ?? [];
  const hasCriticalValue = (parsed.values ?? []).some((v) => v.flag === 'CRITICAL');
  if ((criticalFindings.length > 0 || hasCriticalValue) && (urgency === 'ROUTINE' || urgency === 'SOON')) {
    urgency = 'URGENT';
  }

  return {
    modality: input.modality,
    summary: parsed.summary ?? 'No summary generated.',
    findings: parsed.findings ?? [],
    values: parsed.values,
    criticalFindings,
    impression: parsed.impression ?? '',
    clinicalCorrelation: parsed.clinicalCorrelation ?? undefined,
    recommendedActions: parsed.recommendedActions ?? [],
    urgency,
    limitations: parsed.limitations ?? 'AI draft — formal reporting remains the clinician’s responsibility.',
    generatedAt: new Date().toISOString(),
    aiModel: CLAUDE_MODEL,
  };
}
