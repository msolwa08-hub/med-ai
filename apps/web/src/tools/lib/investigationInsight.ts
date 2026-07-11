// ─── Investigation INSIGHT — the teach-while-you-work interpretation layer ───
// Turns a trended analyte into a plain-language reading: what the value MEANS
// and WHY it matters / how it moves the differential. Deterministic (no model
// call) so it is instant and free; the AI interpret-labs layer sits above it
// for the harder synthesis. Pure interpretation — never a drug dose — so it is
// safe general teaching knowledge. This powers the visual results cluster.

import type { AnalyteTrend, Analyte } from './investigations';

export type AnalyteStatus = 'low' | 'normal' | 'high' | 'critical-low' | 'critical-high' | 'unscored';

export interface AnalyteInsight {
  status: AnalyteStatus;
  /** short pill label — 'High', 'Low', 'Critical', 'Normal' */
  statusLabel: string;
  /** what this value means clinically, one plain line */
  meaning: string;
  /** the consultant's "why it matters / what to think about" — teach-while-you-work */
  why: string;
}

const isCrit = (s: AnalyteStatus) => s === 'critical-low' || s === 'critical-high';
export const statusTone = (s: AnalyteStatus): 'danger' | 'warn' | 'ok' | 'mute' =>
  isCrit(s) ? 'danger' : s === 'high' || s === 'low' ? 'warn' : s === 'normal' ? 'ok' : 'mute';

/** Where the latest value sits vs the reference band (with a critical margin). */
function classify(value: number, a?: Analyte): AnalyteStatus {
  if (!a || (a.low === undefined && a.high === undefined)) return 'unscored';
  // 'Critical' is reserved for values a FULL band-width beyond the limit, so it
  // stays meaningful (a mild derangement reads 'High'/'Low', not 'Critical').
  if (a.high !== undefined && value > a.high) {
    const span = (a.high - (a.low ?? a.high * 0.6)) || a.high;
    return value > a.high + span * 1.2 ? 'critical-high' : 'high';
  }
  if (a.low !== undefined && value < a.low) {
    const span = ((a.high ?? a.low * 1.6) - a.low) || a.low;
    return value < a.low - span * 1.2 ? 'critical-low' : 'low';
  }
  return 'normal';
}

// Per-analyte teaching — keyed by analyte key. Each returns the meaning + why
// for the given status. Kept terse and consultant-voiced. Seeded for the
// bread-and-butter bloods; everything else falls back to the generic reading.
type Teach = (s: AnalyteStatus, t: AnalyteTrend) => { meaning: string; why: string } | null;

const KNOWLEDGE: Record<string, Teach> = {
  k: s => {
    if (s === 'high' || s === 'critical-high')
      return {
        meaning: 'Hyperkalaemia — high serum potassium.',
        why: 'A membrane-stabilising emergency once ≥6.5 or with ANY ECG change (peaked T, wide QRS). Think AKI, acidosis, K-sparing drugs (ACEi/ARB/spironolactone), tissue breakdown — or a haemolysed sample if it does not fit. Get an ECG now.',
      };
    if (s === 'low' || s === 'critical-low')
      return {
        meaning: 'Hypokalaemia — low serum potassium.',
        why: 'Arrhythmia risk (and it blunts K correction if Mg is also low — always check Mg). Think GI or renal loss, diuretics, insulin/refeeding, or Cushing/Conn if persistent.',
      };
    return null;
  },
  na: s => {
    if (s === 'low' || s === 'critical-low')
      return {
        meaning: 'Hyponatraemia — low serum sodium.',
        why: 'Work the VOLUME status first: hypovolaemic (GI/renal loss), euvolaemic (SIADH, hypothyroid, addisonian), or hypervolaemic (cardiac/liver/renal failure). Correct slowly — over-rapid correction risks osmotic demyelination.',
      };
    if (s === 'high' || s === 'critical-high')
      return {
        meaning: 'Hypernatraemia — high serum sodium.',
        why: 'Almost always a water deficit — the patient cannot access or hold water (elderly, altered, DI). Replace the free-water deficit gradually.',
      };
    return null;
  },
  creat: s => {
    if (s === 'high' || s === 'critical-high')
      return {
        meaning: 'Raised creatinine — reduced clearance.',
        why: 'AKI until proven otherwise — stage it against baseline (a 140 means nothing until you know last month\'s). Split pre-renal (volume, sepsis) / renal (ATN, nephrotoxins, glomerular) / post-renal (obstruction — feel for a bladder, scan). Review every renally-cleared drug.',
      };
    return null;
  },
  egfr: s => {
    if (s === 'low')
      return {
        meaning: 'Reduced eGFR — impaired kidney function.',
        why: 'Trend it against baseline to separate acute from chronic. It drives drug dosing and contrast decisions — dose-adjust and avoid nephrotoxins while it is low.',
      };
    return null;
  },
  urea: s => {
    if (s === 'high')
      return {
        meaning: 'Raised urea.',
        why: 'A urea rising OUT of proportion to creatinine points to a pre-renal picture (dehydration, GI bleed). Read the two together, not in isolation.',
      };
    return null;
  },
  hb: s => {
    if (s === 'low' || s === 'critical-low')
      return {
        meaning: 'Anaemia — low haemoglobin.',
        why: 'Let the MCV split it: microcytic (iron deficiency/thalassaemia — find the bleed), normocytic (acute loss, anaemia of chronic disease, renal), macrocytic (B12/folate, alcohol, hypothyroid). A brisk drop with tachycardia is active bleeding until proven otherwise.',
      };
    if (s === 'high')
      return {
        meaning: 'Raised haemoglobin.',
        why: 'Usually haemoconcentration (dehydration); consider true polycythaemia if persistent.',
      };
    return null;
  },
  wcc: s => {
    if (s === 'high' || s === 'critical-high')
      return {
        meaning: 'Leucocytosis — raised white cells.',
        why: 'Infection, inflammation, steroids or stress demargination — read with CRP and the differential. A very high or very low count with a sick patient raises haematological malignancy or overwhelming sepsis.',
      };
    if (s === 'low' || s === 'critical-low')
      return {
        meaning: 'Leucopenia — low white cells.',
        why: 'Sepsis can DROP the count (a bad sign, not reassurance), plus marrow suppression, viral, drugs (clozapine, chemo). Neutropenia + fever is an emergency.',
      };
    return null;
  },
  plt: s => {
    if (s === 'low' || s === 'critical-low')
      return {
        meaning: 'Thrombocytopenia — low platelets.',
        why: 'A HALVING matters more than the absolute number: think sepsis/DIC, HIT if on heparin day 5-10, HELLP in pregnancy, ITP/TTP, marrow. Check a smear and a coagulation screen.',
      };
    if (s === 'high')
      return {
        meaning: 'Thrombocytosis — raised platelets.',
        why: 'Usually reactive (infection, bleeding, iron deficiency, post-splenectomy); consider a myeloproliferative cause if persistent.',
      };
    return null;
  },
  crp: s => {
    if (s === 'high' || s === 'critical-high')
      return {
        meaning: 'Raised CRP — an acute-phase (inflammation/infection) marker.',
        why: 'Non-specific but powerful as a TREND — a falling CRP on treatment reassures, a rising one says the source is not controlled. It lags ~24h, so an early normal does not exclude sepsis.',
      };
    return null;
  },
  glu: s => {
    if (s === 'high' || s === 'critical-high')
      return {
        meaning: 'Hyperglycaemia.',
        why: 'Check ketones and a gas — a high glucose with ketones and acidosis is DKA; with gross elevation and no ketones, think HHS. New hyperglycaemia in a sick patient may be stress or steroid-driven.',
      };
    if (s === 'low' || s === 'critical-low')
      return {
        meaning: 'Hypoglycaemia.',
        why: 'Treat first, ask why after — it is an immediate cause of altered consciousness and mimics a stroke or a psychiatric presentation. Think insulin/sulfonylurea, sepsis, alcohol, adrenal/liver failure.',
      };
    return null;
  },
  neoGlu: s => {
    if (s === 'low' || s === 'critical-low')
      return {
        meaning: 'Neonatal hypoglycaemia (action threshold < 2.6 mmol/L).',
        why: 'The neonatal brain has minimal glycogen reserve — a quiet, poorly-feeding baby may be hypoglycaemic. Treat promptly and screen for sepsis, which both causes and mimics it.',
      };
    return null;
  },
  crpNeo: s => {
    if (s === 'high')
      return {
        meaning: 'Raised neonatal CRP.',
        why: 'Supports sepsis — but the kinetics matter: a single early value does NOT exclude it (CRP lags). Read alongside the FBC and the clinical picture, and trend it.',
      };
    return null;
  },
  lithiumLevel: s => {
    if (s === 'high' || s === 'critical-high')
      return {
        meaning: 'Lithium above the therapeutic window (12h post-dose).',
        why: 'Toxicity climbs from ~1.5 (tremor, GI, ataxia) → ≥2.0 (confusion, seizures) → ≥2.5 (dialysis territory). Ask what changed clearance — dehydration, a new NSAID/ACEi/ARB/thiazide — rather than assuming a dosing error.',
      };
    return null;
  },
  clozapineAnc: s => {
    if (s === 'low' || s === 'critical-low')
      return {
        meaning: 'Low clozapine ANC — neutrophil monitoring.',
        why: 'The reason clozapine is monitored: a falling ANC risks agranulocytosis. Rising monitoring frequency in the amber range; a hard stop (do not taper) in the agranulocytosis range — check your unit protocol.',
      };
    return null;
  },
};

const UP = { meaning: '', why: '' };

/** The teaching reading for a trended analyte. Uses the seeded knowledge where
 *  present, else a generic reference-range reading. */
export function insightFor(trend: AnalyteTrend, analyte?: Analyte): AnalyteInsight {
  const status = classify(trend.latest.value, analyte);
  const statusLabel = isCrit(status)
    ? 'Critical'
    : status === 'high' ? 'High' : status === 'low' ? 'Low' : status === 'normal' ? 'Normal' : '—';

  const seeded = KNOWLEDGE[trend.key]?.(status, trend);
  if (seeded && (seeded.meaning || seeded.why)) {
    return { status, statusLabel, meaning: seeded.meaning, why: seeded.why };
  }

  // Generic fallback — still teaches the reading discipline.
  const range = analyte && (analyte.low !== undefined || analyte.high !== undefined)
    ? `reference ${analyte.low ?? ''}${analyte.low !== undefined && analyte.high !== undefined ? '–' : ''}${analyte.high ?? ''} ${analyte.unit}`.trim()
    : '';
  if (status === 'normal') {
    return { status, statusLabel, meaning: `Within the reference range${range ? ` (${range})` : ''}.`, why: 'Normal now — keep trending it against the clinical picture; a value drifting within range can still be moving.' };
  }
  if (status === 'high' || status === 'critical-high') {
    return { status, statusLabel, meaning: `Above the reference range${range ? ` (${range})` : ''}.`, why: 'Correlate with the presentation and trend it against baseline before acting on a single value.' };
  }
  if (status === 'low' || status === 'critical-low') {
    return { status, statusLabel, meaning: `Below the reference range${range ? ` (${range})` : ''}.`, why: 'Correlate with the presentation and trend it against baseline before acting on a single value.' };
  }
  return { status, statusLabel, meaning: 'Read against an appropriate chart or the clinical context — not a single fixed threshold.', why: 'This value is interpreted in context (e.g. age/hours-of-life, timing) rather than a static band — see the field guidance.' };
}
void UP;
