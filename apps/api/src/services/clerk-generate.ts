import { MODELS, createMessage } from '../lib/models.js';
import { betaConfig } from '../lib/beta-config.js';

/**
 * Turn a free-text presentation into a "case pack" the bedside reasoning clerk
 * runs on a local likelihood-ratio engine. The model only produces the DATA
 * (differentials, weighted findings, discriminating investigations, plan) — the
 * deterministic engine does the maths (posterior, must-not-miss cap, info-gain).
 *
 * TWO-PHASE for latency: the CORE call returns just enough to render the board
 * (differential + findings + investigations + a one-line plan) so it appears
 * fast; the heavier PLAN call (full dosed management + pathophysiology) runs in
 * the background and is merged in. Time-to-first-board is what the user feels.
 */

export interface ClerkPack {
  specialty: string;
  label: string;
  referTo: string;
  planLine: string;
  recommendation: string;
  PT: { line: string; summaryLine: string; complaint: string; background: string };
  VITALS: Array<{ k: string; v: string }>;
  DX: Array<{ id: string; name: string; icd: string; prior: number; mnm: boolean; script: string; patho?: string }>;
  FEAT: Array<{
    id: string; lbl: string; stream: 'hx' | 'exam' | 'ix' | 'rx';
    eff: Record<string, [number, number]>;
    preset?: 'present' | 'absent'; key?: string; short?: string; checklist?: string[];
    criterion?: string; ask?: string; num?: { unit?: string; lo?: number; hi?: number };
  }>;
  IX: Array<{
    id: string; lbl: string; cat: 'bedside' | 'lab' | 'imaging'; dx: string;
    binary?: boolean; unit?: string; norm?: string; lo?: number; hi?: number; dir?: 'above' | 'below';
  }>;
  MX: {
    investigate: Array<{ lbl: string; when?: string; ix?: string }>;
    immediate: Array<Record<string, unknown>>;
    definitive: Array<Record<string, unknown>>;
    monitor: string[];
    levers: Array<Record<string, unknown>>;
    holistic: Array<{ label: string; chips?: string[]; note?: string }>;
  };
}

export type ClerkPlan = { MX: ClerkPack['MX']; patho: Record<string, string> };

// ---- PHASE 1: CORE — the differential board (fast, small output) ----
const CORE_SYSTEM = `You are the reasoning core of a bedside differential-diagnosis instrument used by doctors. Given a free-text patient presentation, output ONLY a single JSON object (no markdown, no prose) — the differential "board". A deterministic likelihood-ratio engine consumes it. SPEED MATTERS: keep it tight so it renders fast. Do NOT produce any management/treatment plan or pathophysiology — those are generated separately.

Rules:
- 3–4 differentials in DX, ordered most-likely first. Mark the immediately life-threatening ones mnm:true ("must not miss"). Give each a realistic pre-test probability (prior, 0–1), an ICD-10 code, and a one-line illness "script". Do NOT include a "patho" field.
- ATOMIC findings: each symptom and each sign is its OWN finding — never bundle several into one (polyuria, polydipsia and polyphagia are THREE findings). Include the discriminating cluster for each differential: supporting features and discriminating negatives. About 6–9 findings total.
- FEAT: the discriminating findings. stream is 'hx', 'exam', or 'ix' (needs a test result). eff maps a dx id to [LR+ , LR-] (LR+ >1 supports, LR- <1 argues against). Only use dx ids present in DX. Mark findings already stated in the presentation as preset:'present' (or 'absent'). For each mnm diagnosis give its single decisive test a key:'<dxId>' and a short:'name'.
- QUANTIFY where a number matters (menstrual loss, cycle length, bleeding days, weight loss, fever, GCS): add a "criterion" (the cutoff, e.g. "> 8 days") AND an "ask" (plain-language patient-facing translation). If the clinician types a discrete number, also add num:{unit, lo?, hi?} (abnormal below lo or above hi).
- REDUCE COGNITIVE LOAD: for any COMPOSITE / umbrella sign (e.g. "stigmata of chronic liver disease", "meningism", "signs of sepsis"), keep a short lbl but add a "checklist" array of 3–6 concrete component signs to tick.
- IX: every stream:'ix' finding, as an enterable investigation. cat is 'bedside', 'lab', or 'imaging'. For quantitative tests give unit, norm, dir ('above'|'below') and threshold as hi or lo. For qualitative/imaging tests set binary:true. dx is a short label of what it discriminates.
- planLine: ONE terse line of the rough plan (e.g. "aspirin · troponin · ECG · cardiology review"). recommendation: 1–2 sentences of the rough approach. referTo: the on-call team.
- PT.line is a terse header (e.g. "58 · ♂ · central chest pain · 2 h"). VITALS use keys HR, BP, RR, SpO₂, T with plausible values.
- Ids are short lowercase tokens, unique within their array. Output MINIFIED JSON (no whitespace). Return valid JSON only.

Use EXACTLY these keys and casing. Example shape:
{"specialty":"IM/EM","label":"Chest pain","referTo":"Medical Registrar","planLine":"aspirin · troponin · ECG","recommendation":"Aspirin if ACS likely; serial troponin and ECG; cardiology review.","PT":{"line":"58 · ♂ · chest pain · 2 h","summaryLine":"58-year-old man","complaint":"central chest pain for 2 hours","background":"HTN, smoker"},"VITALS":[{"k":"HR","v":"108"},{"k":"BP","v":"148/92"}],"DX":[{"id":"acs","name":"Acute coronary syndrome","icd":"I24.9","prior":0.3,"mnm":true,"script":"ischaemic pain + risk + troponin/ECG"}],"FEAT":[{"id":"crush","lbl":"Crushing chest pain","stream":"hx","eff":{"acs":[3,0.5]},"preset":"present"},{"id":"trop","lbl":"Troponin raised","stream":"ix","eff":{"acs":[8,0.2]},"key":"acs","short":"troponin"}],"IX":[{"id":"trop","lbl":"Troponin","cat":"lab","dx":"ACS","unit":"ng/L","norm":"<14","hi":14,"dir":"above"},{"id":"ecg","lbl":"ECG — ischaemia","cat":"bedside","binary":true,"dx":"ACS"}]}`;

// ---- PHASE 2: PLAN — dosed management + pathophysiology (background) ----
const PLAN_SYSTEM = `You produce ONLY the management plan and pathophysiology for an ALREADY-ESTABLISHED differential. You are given the patient presentation and the list of differentials (with ids). Output ONLY a single JSON object (no markdown): {"MX":{...},"patho":{...}}.

- patho: an object mapping EACH given dx id to ONE plain-English sentence (≤ 25 words) of pathophysiology linking the history and signs to the presenting symptoms.
- MX: terse management. investigate[] vs treatment is a HARD split: diagnostic tests (CT, ECG, bloods, βhCG, diagnostic LP, X-ray, ultrasound) are NOT treatments — put the time-critical ones in investigate[] as {lbl, when, ix:'<matching IX id if known>'}. immediate[] and definitive[] are TREATMENTS/interventions only — drugs, fluids, and procedures that TREAT (a therapeutic endoscopy that bands/clips, surgery, delivery stay here). Items are {rx, for, dose, sign?:true, active?:'why now', ind?:'why indicated'}. definitive[] MUST LEAD with the mainstay/definitive treatment of the SINGLE most likely diagnosis (the first dx) — the actual drug or procedure that treats it — then rival-directed "only if X confirmed" steps. monitor[] is strings. levers[] are treat-and-see {give, resp, means}. holistic[] is the NON-DRUG layer for the leading diagnosis — rows of {label, chips:[short items]} (or {label, note}) covering trigger avoidance (name concrete triggers), lifestyle, prevention, self-management, and patient education / safety-netting; [] only for purely acute one-off surgical problems.
- DOSING — BE SPECIFIC: for well-established first-line drugs give the standard adult dose, route and frequency as in the STG / BNF (e.g. "ceftriaxone 2 g IV 12-hly", "sumatriptan 50–100 mg PO", "aspirin 300 mg PO stat"). Use weight-based mg/kg for paediatric/weight-dependent drugs. Only write "per protocol"/"titrate" when the dose genuinely depends on local titration. ALWAYS set sign:true on every drug; never state a dose you are not confident is the accepted standard — omit the drug rather than guess.
- Output MINIFIED JSON. Return valid JSON only.

Example: {"patho":{"acs":"Plaque rupture occludes a coronary artery; ischaemia causes the crushing pain and troponin rise."},"MX":{"investigate":[{"lbl":"12-lead ECG","when":"within 10 min","ix":"ecg"}],"immediate":[{"rx":"Aspirin","for":"ACS","dose":"300 mg PO chewed, stat","sign":true}],"definitive":[{"rx":"Anticoagulation","for":"lead: confirmed NSTEMI","dose":"enoxaparin 1 mg/kg SC 12-hly (renal-adjust)","sign":true}],"monitor":["Continuous ECG"],"levers":[],"holistic":[{"label":"Secondary prevention","chips":["Smoking cessation","Statin","BP control","Cardiac rehab"]}]}}`;

// Salvage a truncated JSON object: drop the incomplete trailing element and
// close any still-open braces/brackets, so a board cut off at the token limit
// still loads instead of failing outright.
function repairJson(raw: string): string {
  let inStr = false;
  let esc = false;
  let cut = 0;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === '}' || c === ']') cut = i + 1; // a value just completed
    else if (c === ',') cut = i; // between values — safe to cut before the comma
  }
  let t = raw.slice(0, cut).replace(/[\s,]+$/, '');
  const open: string[] = [];
  let s2 = false;
  let e2 = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (s2) {
      if (e2) e2 = false;
      else if (c === '\\') e2 = true;
      else if (c === '"') s2 = false;
      continue;
    }
    if (c === '"') s2 = true;
    else if (c === '{') open.push('}');
    else if (c === '[') open.push(']');
    else if (c === '}' || c === ']') open.pop();
  }
  while (open.length) t += open.pop();
  return t;
}

function extractJson(text: string): unknown {
  let t = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const start = t.indexOf('{');
  if (start === -1) throw new Error('The model did not return a usable board');
  const end = t.lastIndexOf('}');
  t = end > start ? t.slice(start, end + 1) : t.slice(start);
  try {
    return JSON.parse(t);
  } catch {
    try {
      return JSON.parse(repairJson(t));
    } catch {
      throw new Error('The model returned an incomplete board — please try again');
    }
  }
}

// Fast models don't always honour exact key casing/names — normalise whatever
// shape comes back (case-insensitive keys, common synonyms, a single-key wrapper)
// into the pack the engine expects, so a good board isn't rejected on a casing nit.
function pick(o: Record<string, unknown>, names: string[]): unknown {
  for (const n of names) {
    for (const k of Object.keys(o)) if (k.toLowerCase() === n) return o[k];
  }
  return undefined;
}
function asArr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}
function emptyMx(): ClerkPack['MX'] {
  return { investigate: [], immediate: [], definitive: [], monitor: [], levers: [], holistic: [] };
}
function normalizeMx(mxRaw: Record<string, unknown>): ClerkPack['MX'] {
  return {
    investigate: asArr(pick(mxRaw, ['investigate', 'investigations'])) as ClerkPack['MX']['investigate'],
    immediate: asArr(pick(mxRaw, ['immediate'])) as Array<Record<string, unknown>>,
    definitive: asArr(pick(mxRaw, ['definitive'])) as Array<Record<string, unknown>>,
    monitor: asArr(pick(mxRaw, ['monitor'])) as string[],
    levers: asArr(pick(mxRaw, ['levers'])) as Array<Record<string, unknown>>,
    holistic: asArr(pick(mxRaw, ['holistic', 'lifestyle', 'nonpharm', 'nondrug'])) as ClerkPack['MX']['holistic'],
  };
}
function normalizeCore(raw: unknown): ClerkPack {
  let o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  if (!pick(o, ['dx', 'differentials', 'diagnoses'])) {
    const vals = Object.values(o);
    if (vals.length === 1 && vals[0] && typeof vals[0] === 'object') o = vals[0] as Record<string, unknown>;
  }
  const dx = asArr(pick(o, ['dx', 'differentials', 'diagnoses'])).map((d0, i) => {
    const d = (d0 && typeof d0 === 'object' ? d0 : {}) as Record<string, unknown>;
    return {
      id: (pick(d, ['id']) as string) || 'dx' + i,
      name: (pick(d, ['name', 'dx', 'diagnosis', 'label']) as string) || 'Diagnosis ' + (i + 1),
      icd: (pick(d, ['icd']) as string) || '',
      prior: typeof pick(d, ['prior']) === 'number' ? (pick(d, ['prior']) as number) : 0.15,
      mnm: Boolean(pick(d, ['mnm', 'mustnotmiss'])),
      script: (pick(d, ['script']) as string) || '',
      patho: (pick(d, ['patho', 'pathophysiology', 'mechanism']) as string) || '',
    };
  });
  return {
    specialty: (pick(o, ['specialty']) as string) || 'General',
    label: (pick(o, ['label', 'title']) as string) || 'Presentation',
    referTo: (pick(o, ['referto', 'refer']) as string) || 'the on-call team',
    planLine: (pick(o, ['planline', 'plan']) as string) || '',
    recommendation: (pick(o, ['recommendation', 'recommend']) as string) || '',
    PT: (pick(o, ['pt', 'patient']) as ClerkPack['PT']) || { line: '', summaryLine: '', complaint: '', background: '' },
    VITALS: asArr(pick(o, ['vitals'])) as ClerkPack['VITALS'],
    DX: dx as ClerkPack['DX'],
    FEAT: asArr(pick(o, ['feat', 'features', 'findings'])) as ClerkPack['FEAT'],
    IX: asArr(pick(o, ['ix', 'investigations'])) as ClerkPack['IX'],
    MX: emptyMx(),
  };
}

async function runFast(system: string, userText: string, maxTokens: number): Promise<unknown> {
  const res = await createMessage({
    model: MODELS.fast,
    max_tokens: maxTokens,
    system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
    messages: [
      { role: 'user', content: userText },
      { role: 'assistant', content: '{' },
    ],
  });
  const first = res.content.find((c) => c.type === 'text');
  const out = (first && first.type === 'text' ? first.text : '').trim();
  // The assistant turn was prefilled with '{', so continue the object — only
  // prepend the brace when the model didn't already emit it.
  const raw = out.startsWith('{') ? out : '{' + out;
  return extractJson(raw);
}

/** PHASE 1 — the fast differential board. */
export async function generateClerkCore(text: string): Promise<ClerkPack> {
  if (!betaConfig.ANTHROPIC_API_KEY) {
    throw new Error('The reasoning model is not configured on the server');
  }
  const pack = normalizeCore(await runFast(CORE_SYSTEM, text, 2000));
  if (pack.DX.length === 0) throw new Error('The board came back without any diagnoses — try rephrasing');
  return pack;
}

/** PHASE 2 — dosed management + pathophysiology for an established differential. */
export async function generateClerkPlan(
  text: string,
  dx: Array<{ id: string; name: string }>,
): Promise<ClerkPlan> {
  if (!betaConfig.ANTHROPIC_API_KEY) {
    throw new Error('The reasoning model is not configured on the server');
  }
  const dxList = dx.map((d) => `${d.id}: ${d.name}`).join('; ');
  const userText = `Presentation: ${text}\nDifferentials (id: name): ${dxList}\nProduce the dosed management plan and one-sentence pathophysiology for each id.`;
  const raw = (await runFast(PLAN_SYSTEM, userText, 2600)) as Record<string, unknown>;
  const mxRaw = (pick(raw, ['mx', 'management']) as Record<string, unknown>) || {};
  const pathoRaw = (pick(raw, ['patho', 'pathophysiology']) as Record<string, unknown>) || {};
  const patho: Record<string, string> = {};
  for (const k of Object.keys(pathoRaw)) {
    if (typeof pathoRaw[k] === 'string') patho[k] = pathoRaw[k] as string;
  }
  return { MX: normalizeMx(mxRaw), patho };
}

// Back-compat single-shot: core board with the plan merged in (used by any
// caller that wants the whole pack in one await, e.g. the eval harness).
export async function generateClerkCase(text: string): Promise<ClerkPack> {
  const pack = await generateClerkCore(text);
  try {
    const plan = await generateClerkPlan(text, pack.DX.map((d) => ({ id: d.id, name: d.name })));
    pack.MX = plan.MX;
    pack.DX.forEach((d) => { if (plan.patho[d.id]) d.patho = plan.patho[d.id]; });
  } catch {
    /* plan is best-effort; the board still stands without it */
  }
  return pack;
}
