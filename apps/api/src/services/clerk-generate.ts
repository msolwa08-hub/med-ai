import { MODELS, createMessage } from '../lib/models.js';
import { betaConfig } from '../lib/beta-config.js';
import { searchSTGEntries } from './stg.service.js';
import type { STGSeedEntry } from '../data/stg-entries.js';

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
  // Set true on every server-generated pack. Tells the client every probability,
  // weight and dose on this board is an AI estimate, not a validated figure —
  // see clerk.html's AI-estimated banner. Since the demo packs were deleted
  // (2026-07-30) every board is generated, so this is now always true; it stays
  // an explicit field rather than an assumption so the marker can never be lost
  // by a client that forgets which kind of board it is holding.
  estimated?: boolean;
  PT: { line: string; summaryLine: string; complaint: string; background: string };
  VITALS: Array<{ k: string; v: string }>;
  // `urg` is the CLINICAL URGENCY BAND, and it is the only thing colour means
  // anywhere on this board (2026-07-30). Not organ system, not rank — how fast
  // this diagnosis has to be acted on. `mnm` is a SEPARATE axis (can't afford to
  // miss it) and drives the confidence cap, never the colour: a dissection at 5%
  // is still red.
  DX: Array<{ id: string; name: string; icd: string; prior: number; mnm: boolean; urg: 'red' | 'orange' | 'blue'; script: string; patho?: string }>;
  FEAT: Array<{
    id: string; lbl: string; stream: 'hx' | 'exam' | 'ix' | 'rx';
    eff?: Record<string, [number, number]>;
    preset?: 'present' | 'absent'; key?: string; short?: string; checklist?: string[];
    criterion?: string; ask?: string; num?: { unit?: string; lo?: number; hi?: number };
    kind?: 'text' | 'choice';
    options?: string[];
    follow?: Array<Record<string, unknown>>;
  }>;
  IX: Array<{
    id: string; lbl: string; cat: 'bedside' | 'lab' | 'imaging'; dx: string;
    binary?: boolean; unit?: string; norm?: string; lo?: number; hi?: number; dir?: 'above' | 'below';
  }>;
  MX: {
    investigate: Array<{ lbl: string; when?: string; urg?: 'red' | 'orange' | 'blue'; ix?: string }>;
    immediate: Array<Record<string, unknown>>;
    definitive: Array<Record<string, unknown>>;
    longterm: Array<Record<string, unknown>>;
    monitor: string[];
    levers: Array<Record<string, unknown>>;
    holistic: Array<{ label: string; chips?: string[]; note?: string }>;
    // Dx names (matching DX[].name) whose dosing was actually grounded in a real
    // STG guideline entry via groundingBlock(). Diagnoses NOT listed here got
    // their doses from the model's own knowledge, with no real source — the
    // client marks those doses "AI estimate — verify" instead of "STG".
    groundedDx?: string[];
  };
}

export type ClerkPlan = { MX: ClerkPack['MX']; patho: Record<string, string> };

// ---- PHASE 1: CORE — the differential board (fast, small output) ----
const CORE_SYSTEM = `You are the reasoning core of a bedside differential-diagnosis instrument used by doctors. Given a free-text patient presentation, output ONLY a single JSON object (no markdown, no prose) — the differential "board". A deterministic likelihood-ratio engine consumes it. SPEED MATTERS: keep it tight so it renders fast. Do NOT produce any management/treatment plan or pathophysiology — those are generated separately.

Rules:
- 3–4 differentials in DX, ordered most-likely first. Mark the immediately life-threatening ones mnm:true ("must not miss"). Give each a realistic pre-test probability (prior, 0–1), an ICD-10 code, and a one-line illness "script". Do NOT include a "patho" field.
- URGENCY BAND — every DX entry MUST carry "urg", one of exactly "red", "orange" or "blue". This is the ONLY thing colour means on the whole screen, so it has to be a clinical judgement, not a restatement of rank or of mnm:
  · "red" — acting late kills or maims: the window is minutes to hours (ACS, aortic dissection, PE, meningitis, ectopic, testicular torsion, DKA, eclampsia, sepsis).
  · "orange" — must be dealt with this admission and will deteriorate if left, but not within the next few hours (uncomplicated pyelonephritis, a stable GI bleed, new decompensated heart failure, cellulitis needing IV).
  · "blue" — stable: work it up and treat at ordinary pace, outpatient management is defensible (musculoskeletal chest pain, uncomplicated migraine, GORD, adjustment disorder).
  A diagnosis's urgency is a property of THE DISEASE, not of how likely it currently is: an aortic dissection sitting at 5% is still "red". Every mnm:true diagnosis is "red"; the reverse does not hold.
- ATOMIC findings: each symptom and each sign is its OWN finding — never bundle several into one (polyuria, polydipsia and polyphagia are THREE findings). Include the discriminating cluster for each differential: supporting features and discriminating negatives. About 6–9 dx-discriminating findings total, PLUS whatever background/context findings rule 65 (COMPLETE HISTORY DEPTH) below requires.
- COMPLETENESS IS NOT CONFIDENCE — the instrument shows the clinician two separate numbers and both must be honest: Confidence is diagnosis-focused (a handful of high-yield findings can justify high confidence in the lead even from a short clerking). Completeness is "how much of the full history & exam for this kind of presentation have I actually gathered" — it is computed from EVERY finding you give it, discriminating or not. If you only emit the 6–9 differential-discriminating findings, Completeness will read 100% the moment those are answered even though a full presentation of the case is missing whole domains. You MUST also include the background/context findings a real clerking would cover for THIS presentation type as answerable findings (not prose baked silently into PT.background) — they don't need "eff" (omit it; a finding without eff simply doesn't move any differential, which is correct for pure background). Apply this depth-first instinct generally, not only to the two examples spelled out below (antenatal history, prior procedures): a chest-pain case needs cardiac risk factors and past cardiac/vascular history; a cough needs a smoking history and TB/travel exposure; abdominal pain needs the relevant bowel/urinary/gynae systems review; any surgical presentation needs relevant past surgical history. Use "choice" findings (rule above) for this so it stays tap-first, not a wall of text boxes.
- FEAT: the discriminating findings. stream is 'hx', 'exam', or 'ix' (needs a test result). eff maps a dx id to [LR+ , LR-] (LR+ >1 supports, LR- <1 argues against). Only use dx ids present in DX. Mark findings already stated in the presentation as preset:'present' (or 'absent'). For each mnm diagnosis give its single decisive test a key:'<dxId>' and a short:'name'.
- QUANTIFY where a number matters (menstrual loss, cycle length, bleeding days, weight loss, fever, GCS): add a "criterion" (the cutoff, e.g. "> 8 days") AND an "ask" (plain-language patient-facing translation). If the clinician types a discrete number, also add num:{unit, lo?, hi?} (abnormal below lo or above hi).
- THE QUESTION TYPE MUST MATCH THE ANSWER TYPE — this is a hard rule, get it wrong and the instrument is unusable at the bedside:
  · A duration, count, date-ago, or any other measurement ("how long ago", "how many", "what was the reading") is NEVER a yes/no tick. Use num:{unit, lo?, hi?}. If there is no clinical cutoff — it's purely informational (e.g. "years since a prior hysterectomy") — OMIT lo and hi entirely; the engine records it without forcing an abnormal/normal call, and such a finding does not need an "eff" (eff is optional — omit it for purely informational findings that don't discriminate a differential).
  · An open answer that in practice has a SMALL set of common values (which procedure, mode of delivery, contraception type, drug class) is NEVER free text and never yes/no — use kind:"choice" with 4–8 "options" covering the common answers; the UI adds an "Other" chip automatically that reveals a text box only when none of the options fit. This is the default for "what/which" questions — minimise typing, maximise tapping. Example: {"id":"delmode","lbl":"Mode of delivery","stream":"hx","kind":"choice","options":["Normal vaginal delivery","Caesarean section","Instrumental (forceps/vacuum)"]}.
  · Only fall back to free text (kind:"text", no eff needed) when the answer genuinely can't be enumerated — a narrative like "any significant findings at antenatal visits", a specific indication in the clinician's own words, a drug name. Example: {"id":"gynsurgwhy","lbl":"Indication for surgery","stream":"hx","kind":"text"}.
  · A present/absent tick is ONLY for a genuine binary clinical fact ("does the patient have X", "is Y present on exam"). If you can't phrase the answer as yes/no without losing information, it is not a boolean finding.
- REDUCE COGNITIVE LOAD: for any COMPOSITE / umbrella sign (e.g. "stigmata of chronic liver disease", "meningism", "signs of sepsis"), keep a short lbl but add a "checklist" array of 3–6 concrete component signs to tick.
- GENERAL EXAMINATION: always include the relevant general-inspection signs as stream:'exam' findings, tied to the differentials they inform — e.g. pallor / anaemia, jaundice, central & peripheral cyanosis, finger clubbing, lymphadenopathy, peripheral oedema, dehydration / capillary refill, cachexia. Pick the ones that actually discriminate this presentation (an intern should never forget to "look for pallor, clubbing, cyanosis").
- DEMOGRAPHIC-SPECIFIC HISTORY: for obstetric presentations, reflect age, sex and pregnancy/gestation in PT.line so vital-sign ranges are judged correctly (e.g. "28 · ♀ · 32/40 · ..."), and include an "antenatal care attended" finding (stream:'hx') with a "follow" covering: how the pregnancy was confirmed (kind:"choice"), gestation at the booking visit (num, weeks), total antenatal visits so far (num), any significant findings at antenatal visits (kind:"text"), AND the standard antenatal booking-bloods panel as kind:"choice" findings — blood group (ABO), Rhesus factor, RPR (syphilis screen), HIV status, Hepatitis B surface antigen — each with a small options list (e.g. HIV: ["Negative","Positive — on ART","Positive — not on ART","Not done / declined"]). These are universal booking bloods, include them regardless of the presenting complaint — that is what makes Completeness meaningful (see rule above). Do NOT put this history in PT.background as prose — every one of these must be an answerable finding.
- GROUND FINDINGS IN THEIR REAL CLINICAL TRIGGER, don't ask a floating conclusion as a bare yes/no. If a concern is normally raised BY a specific exam/history finding (e.g. multiple pregnancy or polyhydramnios is suspected because symphysis-fundal height is large for gestational age, not asked as a standalone "is it a multiple pregnancy?" tick), give the actual triggering finding instead — e.g. {"id":"sfh","lbl":"Symphysis-fundal height","stream":"exam","num":{"unit":"cm"},"criterion":"compare to gestation in weeks — normally ≈ equal ± 2 cm","ask":"if larger than expected for dates: consider multiple pregnancy, polyhydramnios, macrosomia, wrong dates, or fibroids"}. The "ask" field is exactly the place to carry that differential reasoning — a criterion/ask pair teaches the trigger; a bare "X suspected/confirmed?" finding does not.
- GYNAECOLOGICAL / PELVIC PRESENTATIONS: for ANY gynaecological or pelvic presentation in a person who is or could have been pregnant — not only when pregnancy is the presenting complaint — include an obstetric-history finding (gravidity/parity as num:{unit:'deliveries'}, and mode of each delivery as a kind:"text" follow-up), regardless of the differential list.
- PRIOR PROCEDURES / IMAGING FINDINGS MENTIONED IN THE PRESENTATION: if the presentation or an imaging/exam finding implies a prior surgery or procedure relevant to the differential (e.g. "post-hysterectomy", a scar, "s/p appendicectomy"), you MUST ask about it — never silently absorb it into the background without a question the clinician can answer. Add a present/absent finding for it (e.g. "Prior gynaecological surgery") with a "follow" of: {kind:"text", the procedure name}, {kind:"text", the indication — WHY it was done}, and {num, unit:'years' or 'months', no lo/hi — time since the procedure}. Do this whenever the case plausibly involves a prior operation, not only for hysterectomy.
- FOLLOW-UP CASCADE — THIS SHOULD BE THE COMMON CASE, NOT THE EXCEPTION: a positive finding almost always begs a natural next question ("if this is positive, what would you ask about it next?"). Whenever a symptom or sign has ANY clinically-important qualifier, give it a "follow" array of child findings only asked once the parent is present — e.g. cough → {productive → {colour change, blood}}, chest pain → {radiates to arm, worse on exertion}, a positive surgical/procedure history → {which procedure, why, how long ago}. Default to adding at least one follow-up for any finding that has an obvious "tell me more" — treat a top-level finding with no follow as the thing needing justification, not the other way round. Each child is a normal finding {id, lbl, stream} and, if it discriminates a differential, eff (maps dx id to LR+/LR-) — omit eff for a child that is purely informational (free text, choice, or an unthresholded number). A child MAY itself have "follow" for deeper nesting (2-3 levels is normal), and MAY be kind:"text"/"choice" or num per the question-type rule above.
- TWO-PHASE HISTORY — DIAGNOSTIC, THEN COMPLETENESS: the instrument shows the diagnostic (eff-bearing) findings first; once those are exhausted it automatically surfaces the no-eff findings under a "for completeness" label — this is client behaviour, but you control what's IN that pool. Every case, regardless of presenting complaint, should include a generic background-completeness set as no-eff findings (omit eff on these): last menstrual period (kind:"text", for anyone of reproductive age/sex), past medical history (kind:"text"), past surgical history (present/absent finding with a "follow" of {which procedure — kind:"choice" with 4-6 common options for the relevant specialty, why/indication, how long ago}), current medications (kind:"text"), and known drug allergies (kind:"choice", options like ["No known allergies","Penicillin","Sulfa drugs","NSAIDs"]). Add age-at-menarche (num, years) for female patients where relevant. These are what a complete clerking note needs regardless of the working diagnosis — see the COMPLETENESS IS NOT CONFIDENCE rule above.
- IX: every stream:'ix' finding, as an enterable investigation. cat is 'bedside', 'lab', or 'imaging'. For quantitative tests give unit, norm, dir ('above'|'below') and threshold as hi or lo. For qualitative/imaging tests set binary:true. dx is a short label of what it discriminates. DON'T COLLAPSE A GENUINELY STAGED TEST INTO ONE: when real practice does a fast qualitative screen at the bedside and only SENDS a quantitative/confirmatory version to the lab once that's positive (e.g. urine βhCG at triage → quantitative serum βhCG once positive, for the ectopic discriminatory zone; a rapid antigen test → send culture), model that as TWO separate IX entries with their correct cat ('bedside' qualitative first, 'lab' quantitative second) — never as one quantitative field that reads as if the patient arrived already able to report a lab number. A patient presents with symptoms, not with a lab value; a lab value only exists after someone sends the test.
- planLine: ONE terse line of the rough plan (e.g. "aspirin · troponin · ECG · cardiology review"). recommendation: 1–2 sentences of the rough approach. referTo: the on-call team.
- PT.line is a terse header (e.g. "58 · ♂ · central chest pain · 2 h"). VITALS: include all five keys HR, BP, RR, SpO₂, T, but set each "v" ONLY if that value is explicitly stated in the presentation. If a vital was not given, set its "v" to an empty string "" — NEVER invent, assume, guess or infer a vital sign. The clinician measures and enters the rest at the bedside. (Age/sex/pregnancy still go in PT.line regardless.)
- Ids are short lowercase tokens, unique within their array. Output MINIFIED JSON (no whitespace). Return valid JSON only.

Use EXACTLY these keys and casing. Example shape:
{"specialty":"IM/EM","label":"Chest pain","referTo":"Medical Registrar","planLine":"aspirin · troponin · ECG","recommendation":"Aspirin if ACS likely; serial troponin and ECG; cardiology review.","PT":{"line":"58 · ♂ · chest pain · 2 h","summaryLine":"58-year-old man","complaint":"central chest pain for 2 hours","background":"HTN, smoker"},"VITALS":[{"k":"HR","v":""},{"k":"BP","v":""},{"k":"RR","v":""},{"k":"SpO₂","v":""},{"k":"T","v":""}],"DX":[{"id":"acs","name":"Acute coronary syndrome","icd":"I24.9","prior":0.3,"mnm":true,"urg":"red","script":"ischaemic pain + risk + troponin/ECG"}],"FEAT":[{"id":"crush","lbl":"Crushing chest pain","stream":"hx","eff":{"acs":[3,0.5]},"preset":"present","follow":[{"id":"radarm","lbl":"Radiates to arm / jaw","stream":"hx","eff":{"acs":[2,0.7]}},{"id":"exert","lbl":"Worse on exertion","stream":"hx","eff":{"acs":[2.5,0.6]}}]},{"id":"priorcabg","lbl":"Prior cardiac procedure","stream":"hx","follow":[{"id":"cabgwhat","lbl":"Procedure","stream":"hx","kind":"choice","options":["CABG","PCI / stent","Valve replacement","Pacemaker / ICD","None of these"]},{"id":"cabgwhen","lbl":"Time since procedure","stream":"hx","num":{"unit":"years"}}]},{"id":"trop","lbl":"Troponin raised","stream":"ix","eff":{"acs":[8,0.2]},"key":"acs","short":"troponin"}],"IX":[{"id":"trop","lbl":"Troponin","cat":"lab","dx":"ACS","unit":"ng/L","norm":"<14","hi":14,"dir":"above"},{"id":"ecg","lbl":"ECG — ischaemia","cat":"bedside","binary":true,"dx":"ACS"}]}`;

// ---- PHASE 2: PLAN — dosed management + pathophysiology (background) ----
const PLAN_SYSTEM = `You produce ONLY the management plan and pathophysiology for an ALREADY-ESTABLISHED differential. You are given the patient presentation and the list of differentials (with ids). Output ONLY a single JSON object (no markdown): {"MX":{...},"patho":{...}}.

- patho: an object mapping EACH given dx id to ONE plain-English sentence (≤ 25 words) of pathophysiology linking the history and signs to the presenting symptoms.
- MX: terse management. investigate[] vs treatment is a HARD split: diagnostic tests (CT, ECG, bloods, βhCG, diagnostic LP, X-ray, ultrasound) are NOT treatments — put the time-critical ones in investigate[] as {lbl, when, urg, ix:'<matching IX id if known>'}. immediate[], definitive[] and longterm[] are TREATMENTS/interventions only — drugs, fluids, and procedures that TREAT (a therapeutic endoscopy that bands/clips, surgery, delivery stay here). They are organised by TIME HORIZON: immediate[] = right now (resuscitation, symptom control, urgent drugs); definitive[] = short-term, this admission — the mainstay treatment of the diagnosis; longterm[] = ongoing / after discharge (secondary prevention, prophylaxis, maintenance meds, follow-up, surveillance, immunisations). Items are {rx, for, dose, urg, sign?:true, active?:'why now', ind?:'why indicated'}.
- URGENCY BAND on management — every item in investigate[], immediate[], definitive[] and longterm[] MUST carry "urg", one of exactly "red", "orange" or "blue". It is the ONLY thing colour means on this screen, and it answers "how late can this be and still be safe?": "red" = minutes to a couple of hours, delay causes harm (the ECG in chest pain, the first antibiotic in sepsis, reperfusion, the airway); "orange" = today / this admission; "blue" = ordinary pace, discharge and follow-up. Judge each item on its own — an item in immediate[] is usually red and one in longterm[] usually blue, but not always: an urgent CT that has to happen before anticoagulation is red even though it is a test, and simple analgesia in immediate[] is blue. definitive[] MUST LEAD with the mainstay/definitive treatment of the SINGLE most likely diagnosis (the first dx) — the actual drug or procedure that treats it — then rival-directed "only if X confirmed" steps. Put prophylaxis / prevention (e.g. migraine prophylaxis, post-ACS secondary prevention) in longterm[], not definitive[]. monitor[] is strings. levers[] are treat-and-see {give, resp, means}. holistic[] is the COUNSELLING & HEALTH-PROMOTION layer (non-drug) for the leading diagnosis — rows of {label, chips:[short items]} (or {label, note}) covering trigger avoidance (name concrete triggers), lifestyle, self-management, and patient education / safety-netting; [] only for purely acute one-off surgical problems.
- DOSING — BE SPECIFIC: for well-established first-line drugs give the standard adult dose, route and frequency as in the STG / BNF (e.g. "ceftriaxone 2 g IV 12-hly", "sumatriptan 50–100 mg PO", "aspirin 300 mg PO stat"). Use weight-based mg/kg for paediatric/weight-dependent drugs. Only write "per protocol"/"titrate" when the dose genuinely depends on local titration. ALWAYS set sign:true on every drug; never state a dose you are not confident is the accepted standard — omit the drug rather than guess.
- If a "REFERENCE — matching South African STG entries" block is provided below, it is real, sourced dosing data for one or more of the given differentials — treat it as your primary source of truth for that diagnosis's first-line medications, investigations and referral criteria. Only deviate from it where a stated patient factor genuinely requires a different choice, and say so in the relevant "ind"/"active" field. Diagnoses with no matching STG entry still get a plan from your own clinical knowledge exactly as before — the reference block only ever adds grounding, it never narrows which diagnoses you can plan for.
- Output MINIFIED JSON. Return valid JSON only.

Example: {"patho":{"acs":"Plaque rupture occludes a coronary artery; ischaemia causes the crushing pain and troponin rise."},"MX":{"investigate":[{"lbl":"12-lead ECG","when":"within 10 min","urg":"red","ix":"ecg"}],"immediate":[{"rx":"Aspirin","for":"ACS","dose":"300 mg PO chewed, stat","urg":"red","sign":true}],"definitive":[{"rx":"Anticoagulation","for":"lead: confirmed NSTEMI","dose":"enoxaparin 1 mg/kg SC 12-hly (renal-adjust)","urg":"orange","sign":true}],"longterm":[{"rx":"Secondary prevention","for":"post-ACS","dose":"dual antiplatelet 12 mth + high-intensity statin + ACE-inhibitor + beta-blocker","urg":"blue","sign":true}],"monitor":["Continuous ECG"],"levers":[],"holistic":[{"label":"Lifestyle & counselling","chips":["Smoking cessation","Cardiac rehab","Mediterranean diet","Exercise"]}]}}`;

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
  return { investigate: [], immediate: [], definitive: [], longterm: [], monitor: [], levers: [], holistic: [] };
}
function normalizeMx(mxRaw: Record<string, unknown>): ClerkPack['MX'] {
  return {
    investigate: asArr(pick(mxRaw, ['investigate', 'investigations'])) as ClerkPack['MX']['investigate'],
    immediate: asArr(pick(mxRaw, ['immediate'])) as Array<Record<string, unknown>>,
    definitive: asArr(pick(mxRaw, ['definitive'])) as Array<Record<string, unknown>>,
    longterm: asArr(pick(mxRaw, ['longterm', 'long_term', 'longTerm', 'ongoing'])) as Array<Record<string, unknown>>,
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
  // Every board this function produces is AI-generated, not a validated
  // dataset — the client must never render it identically to the 8
  // hand-authored demo packs (see clerk.html AI-estimated banner).
  pack.estimated = true;
  return pack;
}

// Ground the plan call in the real SA STG dataset instead of trusting a
// generated dose blind — works for whatever differentials come back, not a
// fixed list of conditions. One STG entry per dx name, best substring match,
// deduped by ICD code. Shared by groundingBlock() (the prompt text) and
// generateClerkPlan() (which needs the plain dx names that actually matched,
// to tell the client which doses are STG-sourced vs model-estimated).
function matchGrounding(dx: Array<{ id: string; name: string }>): { entries: STGSeedEntry[]; names: string[] } {
  const seen = new Set<string>();
  const entries: STGSeedEntry[] = [];
  const names: string[] = [];
  for (const d of dx) {
    const hit = searchSTGEntries(d.name).entries[0];
    if (hit) names.push(d.name);
    if (hit && !seen.has(hit.icdCode)) {
      seen.add(hit.icdCode);
      entries.push(hit);
    }
  }
  return { entries, names };
}

export function groundingBlock(dx: Array<{ id: string; name: string }>): string {
  const { entries } = matchGrounding(dx);
  if (!entries.length) return '';
  const formatted = entries
    .map((e) => {
      const meds = e.firstLinemedications
        .map((m) => `${m.name} ${m.dose} ${m.route} ${m.frequency} x ${m.duration}${m.notes ? ` (${m.notes})` : ''}`)
        .join('; ');
      const invs = e.investigations.map((i) => `[${i.timing}] ${i.name}`).join('; ');
      const referral = e.referralCriteria.join('; ');
      return `${e.condition} (${e.icdCode}): first-line — ${meds || 'none listed'}. Investigations — ${invs || 'none listed'}. Referral if — ${referral || 'not specified'}.${e.contraindications?.length ? ` Contraindications — ${e.contraindications.join('; ')}.` : ''}`;
    })
    .join('\n');
  return `\n\nREFERENCE — matching South African STG entries (source of truth, see system prompt):\n${formatted}`;
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
  const { names: groundedDx } = matchGrounding(dx);
  const userText = `Presentation: ${text}\nDifferentials (id: name): ${dxList}\nProduce the dosed management plan and one-sentence pathophysiology for each id.${groundingBlock(dx)}`;
  const raw = (await runFast(PLAN_SYSTEM, userText, 2600)) as Record<string, unknown>;
  const mxRaw = (pick(raw, ['mx', 'management']) as Record<string, unknown>) || {};
  const pathoRaw = (pick(raw, ['patho', 'pathophysiology']) as Record<string, unknown>) || {};
  const patho: Record<string, string> = {};
  for (const k of Object.keys(pathoRaw)) {
    if (typeof pathoRaw[k] === 'string') patho[k] = pathoRaw[k] as string;
  }
  const mx = normalizeMx(mxRaw);
  // Truthful and simple: if nothing matched an STG entry, the list is empty —
  // the whole plan is model-estimated, and the client marks every dose as such.
  mx.groundedDx = groundedDx;
  return { MX: mx, patho };
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
