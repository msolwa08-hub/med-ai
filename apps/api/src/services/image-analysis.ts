/**
 * Multimodal clinical image analysis — one vision engine, many modalities.
 *
 * A single Anthropic vision call per image, steered by a modality-specific
 * extraction frame (ECG reads differently from a CTG or a CXR), returning one
 * uniform contract the client can splice straight into the clinical record:
 * `injectText` is the transcription-ready line; `findings`/`redFlags` drive
 * the UI. Confidence is per-image, mirroring the handwriting scanner's
 * honest-uncertainty pattern.
 */
import Anthropic from '@anthropic-ai/sdk';
import { MODELS, createMessage } from '../lib/models.js';
import { tryExtractJSON } from '../lib/json-extract.js';
import { MEDAI_SYSTEM_PROMPT, HOD_DISCLAIMER, specialtyLens } from './hod-prompt.js';


export type ImageModality =
  | 'ecg'
  | 'ctg'
  | 'cxr'
  | 'xray'
  | 'ultrasound'
  | 'ct'
  | 'eeg'
  | 'abg'
  | 'wound'
  | 'other';

export interface ImageAnalysisRequest {
  dept: string;
  subDept?: string;
  modality: ImageModality;
  imageBase64: string;
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp';
  /** One-line patient context: age/sex, working dx, relevant history. */
  context?: string;
}

export interface ImageAnalysisResult {
  modality: ImageModality;
  technicalQuality: string;
  findings: string[];
  impression: string;
  redFlags: string[];
  confidence: 'high' | 'medium' | 'low';
  /** Transcription-ready line for the patient record. */
  injectText: string;
  disclaimer: string;
}

/**
 * How a specialist reads each modality — the systematic frame the model must
 * walk, so nothing salient is skipped. 'other' falls back to a generic
 * describe-then-interpret pass.
 */
const MODALITY_FRAMES: Record<ImageModality, string> = {
  ecg: `12-lead ECG. Read systematically: rate, rhythm, axis, P waves, PR interval, QRS width/morphology, ST segments (lead-by-lead — name the territory of any elevation/depression), T waves, QTc. Call STEMI territory explicitly if present. Note paced rhythm, bundle branch blocks, signs of hyperkalaemia (peaked T, wide QRS), pericarditis vs ischaemia patterns.`,
  ctg: `Cardiotocograph. Read via DR C BRAVADO: Determine Risk, Contractions (frequency/10min), Baseline RAte, Variability, Accelerations, Decelerations (early/late/variable/prolonged — describe relation to contractions), Overall impression (normal / suspicious / pathological per NICE-aligned SA usage). A pathological trace is a red flag with the indicated action.`,
  cxr: `Chest X-ray. Systematic review: projection/rotation/penetration, airway/trachea, breathing (lung fields zone by zone — consolidation, effusion with meniscus, pneumothorax edge, cavitation typical of TB), circulation (heart size/borders, mediastinum), diaphragm (free air), bones/soft tissue, lines/tubes position. In the SA context actively look for TB patterns (upper-zone fibrosis, cavitation, miliary) and effusions.`,
  xray: `Plain radiograph (skeletal/other). Identify the region and views. For fractures: site, pattern (transverse/oblique/spiral/comminuted), displacement, angulation, articular involvement, open-injury clues (air in soft tissue), paediatric physis involvement (Salter-Harris grade). Check joint alignment/dislocation and the classically-missed second injury.`,
  ultrasound: `Ultrasound still. Identify the study type from the image and context (obstetric, FAST, abdominal, DVT). For obstetric: presentation, cardiac activity if assessable, placental position if shown, liquor impression, and any stated biometry (BPD/HC/AC/FL) with gestational correlation. For FAST: free fluid in the named windows.`,
  ct: `CT slice. Identify region and window. Describe salient abnormality (bleed — epidural/subdural/SAH pattern, infarct territory, mass effect/midline shift, free air, collections) with laterality. Note this is a single slice, not a full study.`,
  eeg: `EEG strip. Describe background rhythm/frequency, symmetry, epileptiform discharges (spikes, spike-wave — generalized vs focal with localization), burst suppression, electrographic seizure activity. Note montage limits from a photographed strip.`,
  abg: `Blood gas printout. Extract the values, then interpret stepwise: oxygenation (PaO2/FiO2 if known), pH → acidaemia/alkalaemia, primary disorder (respiratory/metabolic), compensation, anion gap if calculable, lactate. Give the one-line synthesis (e.g. "HAGMA with appropriate respiratory compensation — likely DKA in context").`,
  wound: `Clinical photograph of a wound/lesion/limb. Describe site, size estimate, wound bed (granulation/slough/necrosis), edges, surrounding cellulitis/tracking, discharge, exposed structures, perfusion clues. Grade if a standard grading applies (e.g. diabetic foot, pressure injury staging, burn depth estimate).`,
  other: `Clinical image. Identify what it shows, describe it systematically as the relevant specialist would, then interpret in the given clinical context.`,
};

export async function analyzeClinicalImage(req: ImageAnalysisRequest): Promise<ImageAnalysisResult> {
  const frame = MODALITY_FRAMES[req.modality] ?? MODALITY_FRAMES.other;

  const system = `${MEDAI_SYSTEM_PROMPT}

${specialtyLens(req.dept, req.subDept)}

TASK — VISUAL TRACE INTERPRETATION:
You are reading a clinical image for an intern on a ${req.dept}${req.subDept ? ` (${req.subDept})` : ''} ward.
${frame}

Honesty about uncertainty is mandatory: photographed traces lose detail — if a finding is not confidently readable, say so and lower confidence rather than inventing precision. Never fabricate measurements you cannot see.

Respond with ONLY a JSON object:
{
  "technicalQuality": "one line on image quality/limits",
  "findings": ["punchy finding lines in clinical shorthand, most important first"],
  "impression": "one-line overall impression",
  "redFlags": ["only findings needing action now — empty array if none"],
  "confidence": "high" | "medium" | "low",
  "injectText": "1-3 lines, transcription-ready for the patient file, shorthand, no fluff"
}`;

  const response = await createMessage({
    model: MODELS.reasoning,
    max_tokens: 1500,
    system,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: req.mediaType, data: req.imageBase64 },
          },
          {
            type: 'text',
            text: `Modality: ${req.modality.toUpperCase()}. ${req.context ? `Patient context: ${req.context}` : 'No additional context provided.'}`,
          },
        ],
      },
    ],
  });

  const text = response.content[0]?.type === 'text' ? response.content[0].text : '{}';
  const parsed = tryExtractJSON<Omit<ImageAnalysisResult, 'modality' | 'disclaimer'>>(text) ?? {} as Omit<ImageAnalysisResult,'modality'|'disclaimer'>;

  return {
    modality: req.modality,
    technicalQuality: parsed.technicalQuality ?? '',
    findings: Array.isArray(parsed.findings) ? parsed.findings : [],
    impression: parsed.impression ?? '',
    redFlags: Array.isArray(parsed.redFlags) ? parsed.redFlags : [],
    confidence: parsed.confidence === 'high' || parsed.confidence === 'low' ? parsed.confidence : 'medium',
    injectText: parsed.injectText ?? '',
    disclaimer: HOD_DISCLAIMER,
  };
}
