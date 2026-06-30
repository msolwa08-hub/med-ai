/**
 * Ultrasound AI Interpretation Service
 *
 * Provides AI-powered clinical interpretation of ultrasound reports for:
 *   - Obstetric USS: dating, NT scan, anomaly scan (20 weeks), growth scan, Doppler
 *   - Gynaecological USS: uterus, endometrium, ovaries, adnexal masses
 *   - General abdominal USS: liver, gallbladder, kidneys, spleen, pancreas
 *   - Emergency USS: FAST exam, free fluid, pneumothorax
 *
 * Output includes:
 *   - Scan type classification
 *   - Key positive and negative findings
 *   - Clinical significance per finding
 *   - Red flags requiring urgent action
 *   - Management recommendations aligned to SA STG/RCOG/ASUM
 *   - Follow-up recommendations
 *   - Patient-friendly summary
 */

import { anthropic, CLAUDE_MODEL } from '../lib/claude.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export type USSCategory =
  | 'OBSTETRIC_FIRST_TRIMESTER'
  | 'OBSTETRIC_NT_SCAN'
  | 'OBSTETRIC_ANOMALY'
  | 'OBSTETRIC_GROWTH'
  | 'OBSTETRIC_DOPPLER'
  | 'OBSTETRIC_OTHER'
  | 'GYNAECOLOGICAL'
  | 'ABDOMINAL'
  | 'RENAL'
  | 'EMERGENCY_FAST'
  | 'THYROID'
  | 'OTHER';

export interface USSFinding {
  organ: string;
  finding: string;
  isNormal: boolean;
  isRedFlag: boolean;
  clinicalSignificance: string;
}

export interface USSInterpretation {
  reportId?: string;
  category: USSCategory;
  categoryLabel: string;
  gestationalAge?: string;       // Obstetric scans only
  edd?: string;                  // Estimated delivery date (obstetric)
  normalFindings: string[];
  abnormalFindings: USSFinding[];
  redFlags: string[];
  clinicalImpression: string;
  managementRecommendations: string[];
  followUpRecommendations: string[];
  patientSummary: string;
  urgency: 'ROUTINE' | 'SOON' | 'URGENT' | 'EMERGENCY';
  confidenceNote: string;
}

export interface USSInterpretationRequest {
  reportText: string;
  clinicalContext?: string;
  patientAge?: number;
  patientGender?: 'MALE' | 'FEMALE';
  gestationalAge?: string;
  isPregnant?: boolean;
  consultationId?: string;
}

// ─── System Prompt ────────────────────────────────────────────────────────────

const USS_SYSTEM_PROMPT = `You are MedAI USS, a specialist AI assistant for South African healthcare professionals interpreting ultrasound reports.

Your role is to provide expert clinical interpretation of ultrasound findings to assist doctors (not replace them).

SCOPE:
- Obstetric ultrasound: first trimester dating, NT scan, anomaly scan (FASP), growth scan, Doppler studies
- Gynaecological ultrasound: uterus, endometrium, ovaries, adnexal masses, PCOS, fibroids
- Abdominal ultrasound: liver, gallbladder (gallstones, cholecystitis), kidneys, spleen, pancreas, aorta
- Renal tract: hydronephrosis, stones, cysts, renal parenchyma
- Emergency/FAST exam: haemoperitoneum, pericardial effusion, pneumothorax, IVC
- Thyroid: nodules, goitre, Hashimoto's

CLINICAL FRAMEWORK (SA context):
- Apply RCOG, ASUM, ISUOG, and SA MTG guidelines
- Consider SA-prevalent pathology: TB (lymphadenopathy, splenic lesions), HIV-related findings,
  hydatid disease, bilharzia, advanced malignancy presentation
- For obstetric scans: FASP 20-week anomaly checklist, biometry z-scores, growth centiles
- For gynaecological: IETA criteria for endometrial lesions, ADNEX model for ovarian risk

RESPONSE FORMAT — Return ONLY valid JSON with this exact structure:
{
  "category": "OBSTETRIC_ANOMALY",
  "categoryLabel": "Anomaly Scan (20 weeks)",
  "gestationalAge": "20+3 weeks",
  "edd": "15 October 2026",
  "normalFindings": ["Fetal heart rate: 148 bpm — normal", "Placenta: posterior, clear of os — normal"],
  "abnormalFindings": [
    {
      "organ": "Fetal brain",
      "finding": "Bilateral choroid plexus cysts measuring 4mm",
      "isNormal": false,
      "isRedFlag": false,
      "clinicalSignificance": "Small isolated CPCs are usually transient and benign. Associated with trisomy 18 only when combined with other anomalies. In isolation at 20 weeks with normal karyotype risk, no action needed — resolve by 26 weeks in 90% of cases."
    }
  ],
  "redFlags": [],
  "clinicalImpression": "Single viable intrauterine pregnancy at 20+3 weeks with concordant biometry. Isolated bilateral choroid plexus cysts — no other structural anomalies identified. Overall reassuring anomaly scan.",
  "managementRecommendations": [
    "Counsel patient: isolated CPCs are common (1-2%) and almost always resolve by third trimester",
    "No immediate intervention required for isolated CPCs with normal anatomy",
    "Document in antenatal notes; ensure anomaly scan report filed",
    "Routine antenatal follow-up as per SA ANC guidelines"
  ],
  "followUpRecommendations": [
    "Growth scan at 32 weeks as per routine SA ANC protocol",
    "Repeat USS at 26 weeks if parental anxiety regarding CPCs (optional)"
  ],
  "patientSummary": "Your baby is growing well and the scan looks healthy. There are two tiny fluid-filled spots in the brain called choroid plexus cysts — these are very common and nearly always disappear on their own before birth. Your doctor will explain further.",
  "urgency": "ROUTINE",
  "confidenceNote": "Interpretation based on report text only. Clinical correlation with physical examination, blood results, and full patient history is essential. This tool assists but does not replace specialist radiologist or maternal-fetal medicine review."
}

URGENCY GUIDE:
- ROUTINE: Normal findings, minor incidental findings, expected variants
- SOON: Significant findings requiring specialist review within 1-2 weeks
- URGENT: Findings requiring same-day specialist review (e.g. placenta praevia with bleeding, large adnexal mass with features of malignancy)
- EMERGENCY: Life-threatening findings (ectopic pregnancy with free fluid, aortic aneurysm, FAST positive with trauma, cord prolapse)

RED FLAGS LIST (always escalate):
Obstetric: placenta praevia grade 3/4, vasa praevia, fetal hydrops, major structural anomaly, Doppler with absent/reversed end-diastolic flow, suspected placental abruption, free fluid in pelvis with positive HCG (ectopic)
Gynaecological: complex adnexal mass with solid components + ascites + Doppler flow (malignancy), thick heterogeneous endometrium with vascular flow (endometrial carcinoma), large cyst >10cm with pain (torsion risk)
Abdominal: free fluid with trauma (haemorrhage), aortic aneurysm >5.5cm or symptomatic, cholangitis pattern (CBD dilation + fever), renal vein thrombosis
General: any unexpected finding significantly changing clinical management

IMPORTANT: Your interpretation is for trained medical professionals only. Always include the confidenceNote.`;

// ─── Helper ───────────────────────────────────────────────────────────────────

function extractJSON<T>(text: string): T {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = fenceMatch ? fenceMatch[1] : text;
  const start = jsonStr.indexOf('{');
  const end = jsonStr.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object found in response');
  return JSON.parse(jsonStr.slice(start, end + 1)) as T;
}

// ─── Main Service Function ────────────────────────────────────────────────────

export async function interpretUltrasound(
  request: USSInterpretationRequest
): Promise<USSInterpretation> {
  const contextParts: string[] = [`ULTRASOUND REPORT:\n${request.reportText}`];

  if (request.clinicalContext) {
    contextParts.push(`CLINICAL CONTEXT:\n${request.clinicalContext}`);
  }
  if (request.patientAge !== undefined) {
    contextParts.push(`Patient age: ${request.patientAge} years`);
  }
  if (request.patientGender) {
    contextParts.push(`Patient sex: ${request.patientGender}`);
  }
  if (request.isPregnant !== undefined) {
    contextParts.push(`Known pregnancy: ${request.isPregnant ? 'Yes' : 'No'}`);
  }
  if (request.gestationalAge) {
    contextParts.push(`Gestational age (clinical): ${request.gestationalAge}`);
  }

  const userContent = contextParts.join('\n\n') + '\n\nProvide your clinical interpretation in JSON format as specified.';

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    temperature: 0,
    system: USS_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }],
  });

  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');

  const parsed = extractJSON<USSInterpretation>(text);

  if (request.consultationId) {
    parsed.reportId = request.consultationId;
  }

  return parsed;
}

// ─── Quick Classification (cheap pre-flight) ──────────────────────────────────

export async function classifyUSSReport(reportText: string): Promise<USSCategory> {
  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 20,
    temperature: 0,
    system: `Classify this ultrasound report into exactly one of these categories and return ONLY the category name:
OBSTETRIC_FIRST_TRIMESTER, OBSTETRIC_NT_SCAN, OBSTETRIC_ANOMALY, OBSTETRIC_GROWTH, OBSTETRIC_DOPPLER, OBSTETRIC_OTHER, GYNAECOLOGICAL, ABDOMINAL, RENAL, EMERGENCY_FAST, THYROID, OTHER`,
    messages: [{ role: 'user', content: reportText.slice(0, 500) }],
  });

  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim()
    .toUpperCase() as USSCategory;

  const valid: USSCategory[] = [
    'OBSTETRIC_FIRST_TRIMESTER', 'OBSTETRIC_NT_SCAN', 'OBSTETRIC_ANOMALY',
    'OBSTETRIC_GROWTH', 'OBSTETRIC_DOPPLER', 'OBSTETRIC_OTHER',
    'GYNAECOLOGICAL', 'ABDOMINAL', 'RENAL', 'EMERGENCY_FAST', 'THYROID', 'OTHER',
  ];

  return valid.includes(text) ? text : 'OTHER';
}
