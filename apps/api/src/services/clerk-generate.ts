import { MODELS, createMessage } from '../lib/models.js';
import { betaConfig } from '../lib/beta-config.js';

/**
 * Turn a free-text presentation into a "case pack" the bedside reasoning clerk
 * runs on a local likelihood-ratio engine. The model only produces the DATA
 * (differentials, weighted findings, discriminating investigations, plan) — the
 * deterministic engine does the maths (posterior, must-not-miss cap, info-gain).
 */

export interface ClerkPack {
  specialty: string;
  label: string;
  referTo: string;
  planLine: string;
  recommendation: string;
  PT: { line: string; summaryLine: string; complaint: string; background: string };
  VITALS: Array<{ k: string; v: string }>;
  DX: Array<{ id: string; name: string; icd: string; prior: number; mnm: boolean; script: string }>;
  FEAT: Array<{
    id: string; lbl: string; stream: 'hx' | 'exam' | 'ix' | 'rx';
    eff: Record<string, [number, number]>;
    preset?: 'present' | 'absent'; key?: string; short?: string; checklist?: string[];
  }>;
  IX: Array<{
    id: string; lbl: string; cat: 'bedside' | 'lab' | 'imaging'; dx: string;
    binary?: boolean; unit?: string; norm?: string; lo?: number; hi?: number; dir?: 'above' | 'below';
  }>;
  MX: {
    immediate: Array<Record<string, unknown>>;
    definitive: Array<Record<string, unknown>>;
    monitor: string[];
    levers: Array<Record<string, unknown>>;
  };
}

const SYSTEM = `You are the reasoning core of a bedside differential-diagnosis instrument used by doctors. Given a free-text patient presentation, output ONLY a single JSON object (no markdown, no prose) that is a "case pack". A deterministic likelihood-ratio engine consumes it — you provide the clinical data, not the arithmetic.

Rules:
- 3–5 differentials in DX, ordered most-likely first. Mark the immediately life-threatening ones mnm:true ("must not miss"). Give each a realistic pre-test probability (prior, 0–1) and an ICD-10 code and a one-line illness "script".
- FEAT: the discriminating findings. stream is 'hx' (history), 'exam', or 'ix' (needs a test result). eff maps a dx id to [LR+ , LR-] — the likelihood ratio if the finding is PRESENT vs ABSENT (LR+ >1 supports, LR- <1 argues against). Only include dx ids that exist in DX. Mark findings already clearly stated in the presentation as preset:'present' (or 'absent'). For each mnm diagnosis, give its single decisive test a key:'<dxId>' and a short:'name'.
- REDUCE COGNITIVE LOAD: for any COMPOSITE / umbrella clinical sign (e.g. "stigmata of chronic liver disease", "meningism", "signs of sepsis", "peritonism", "signs of respiratory distress"), do NOT leave it as one vague finding. Keep a short lbl but add a "checklist" array of the concrete component signs to look for (e.g. ["Jaundice","Spider naevi","Palmar erythema","Ascites","Asterixis"]) so the clinician ticks signs instead of recalling the concept. 3–6 items each.
- IX: every stream:'ix' finding, as an enterable investigation. cat is 'bedside' (POC glucose, ECG, urine dip, VBG, βhCG), 'lab' (bloods), or 'imaging' (US/CT/CXR/MRI). For quantitative tests give unit, norm, dir ('above'|'below') and the threshold as hi or lo. For qualitative/imaging tests set binary:true. dx is a short label of what it discriminates.
- MX: terse management. immediate[] and definitive[] items are {rx, for, dose, sign?:true, active?:'why now', ind?:'why indicated'}. monitor[] is strings. levers[] are treat-and-see items {give, resp, means}. NEVER invent precise drug doses — write "per protocol" / "weight-based" and set sign:true. Cite nothing you are unsure of.
- PT.line is a terse header (e.g. "58 · ♂ · central chest pain · 2 h"). VITALS use keys HR, BP, RR, SpO₂, T with plausible values for the presentation.
- Ids are short lowercase tokens, unique within their array.
- Keep it COMPACT and fast: at most 4 differentials and about 8–12 findings total. Output MINIFIED JSON (no whitespace, no newlines). Return valid JSON only.`;

function extractJson(text: string): unknown {
  let t = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) throw new Error('The model did not return a usable board');
  t = t.slice(start, end + 1);
  try {
    return JSON.parse(t);
  } catch {
    throw new Error('The model returned an incomplete board — please try again');
  }
}

function validate(pack: unknown): ClerkPack {
  const p = pack as ClerkPack;
  if (!p || typeof p !== 'object') throw new Error('Not an object');
  if (!Array.isArray(p.DX) || p.DX.length === 0) throw new Error('DX missing');
  if (!Array.isArray(p.FEAT)) throw new Error('FEAT missing');
  if (!Array.isArray(p.IX)) p.IX = [];
  if (!Array.isArray(p.VITALS)) p.VITALS = [];
  if (!p.PT || typeof p.PT !== 'object') throw new Error('PT missing');
  if (!p.MX || typeof p.MX !== 'object') {
    p.MX = { immediate: [], definitive: [], monitor: [], levers: [] };
  }
  for (const k of ['immediate', 'definitive', 'monitor', 'levers'] as const) {
    if (!Array.isArray(p.MX[k])) (p.MX as Record<string, unknown>)[k] = [];
  }
  return p;
}

export async function generateClerkCase(text: string): Promise<ClerkPack> {
  if (!betaConfig.ANTHROPIC_API_KEY) {
    throw new Error('The reasoning model is not configured on the server');
  }
  // Fast tier + a JSON prefill ('{') so the model emits the object directly:
  // lower latency (beats the platform gateway timeout) and no preamble to strip.
  const res = await createMessage({
    model: MODELS.fast,
    max_tokens: 2400,
    system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [
      { role: 'user', content: text },
      { role: 'assistant', content: '{' },
    ],
  });
  const first = res.content.find((c) => c.type === 'text');
  const raw = '{' + (first && first.type === 'text' ? first.text : '');
  return validate(extractJson(raw));
}
