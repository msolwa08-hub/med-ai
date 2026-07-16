// Serial investigations — the trending companion. Results are captured per
// date, trended across the admission, and screened by DETERMINISTIC delta
// rules that think one step ahead of the intern ("K+ rose 0.7 in 24h — what
// changed on the drug chart?"). AI interpretation is layered on top via the
// existing /tools/interpret-labs endpoint; these rules fire with or without it.

import type { DeptId } from '../config/departments';

export interface InvestigationEntry {
  /** YYYY-MM-DD */
  date: string;
  /** panel id from PANELS, or 'other' */
  panel: string;
  /** analyte key -> recorded value (string, verbatim) */
  values: Record<string, string>;
  note?: string;
}

export interface Analyte {
  key: string;
  label: string;
  unit: string;
  /** adult reference range, display-only */
  low?: number;
  high?: number;
}

export interface Panel {
  id: string;
  label: string;
  icon: string;
  analytes: Analyte[];
  /** Departments this panel is offered in. Omit = every department (the
   *  default for the general chemistry/haem panels). Specialty panels
   *  (cardiac, tbhiv) are scoped so the capture list stays uncluttered. */
  depts?: DeptId[];
}

export const PANELS: Panel[] = [
  {
    id: 'uec',
    label: 'U&E + Creat',
    icon: '🧂',
    analytes: [
      { key: 'na', label: 'Na', unit: 'mmol/L', low: 135, high: 145 },
      { key: 'k', label: 'K', unit: 'mmol/L', low: 3.5, high: 5.1 },
      { key: 'cl', label: 'Cl', unit: 'mmol/L', low: 98, high: 107 },
      { key: 'urea', label: 'Urea', unit: 'mmol/L', low: 2.6, high: 7.0 },
      { key: 'creat', label: 'Creat', unit: 'µmol/L', low: 60, high: 110 },
      { key: 'egfr', label: 'eGFR', unit: 'mL/min', low: 60 },
    ],
  },
  {
    id: 'fbc',
    label: 'FBC',
    icon: '🩸',
    analytes: [
      { key: 'hb', label: 'Hb', unit: 'g/dL', low: 13, high: 17 },
      { key: 'wcc', label: 'WCC', unit: '×10⁹/L', low: 4, high: 11 },
      { key: 'plt', label: 'Plt', unit: '×10⁹/L', low: 150, high: 450 },
      { key: 'mcv', label: 'MCV', unit: 'fL', low: 80, high: 100 },
    ],
  },
  {
    id: 'inflam',
    label: 'CRP / ESR',
    icon: '🔥',
    analytes: [
      { key: 'crp', label: 'CRP', unit: 'mg/L', high: 10 },
      { key: 'esr', label: 'ESR', unit: 'mm/hr', high: 20 },
    ],
  },
  {
    id: 'lft',
    label: 'LFTs',
    icon: '🫀',
    analytes: [
      { key: 'bili', label: 'T.Bili', unit: 'µmol/L', high: 21 },
      { key: 'alt', label: 'ALT', unit: 'U/L', high: 40 },
      { key: 'ast', label: 'AST', unit: 'U/L', high: 40 },
      { key: 'alp', label: 'ALP', unit: 'U/L', high: 120 },
      { key: 'ggt', label: 'GGT', unit: 'U/L', high: 60 },
      { key: 'alb', label: 'Alb', unit: 'g/L', low: 35, high: 50 },
    ],
  },
  {
    id: 'glucose',
    label: 'Glucose',
    icon: '🍬',
    analytes: [
      // Fasting reference range (a random/post-prandial glucose can be
      // higher than this without being diabetic — do not apply this
      // range to non-fasting samples).
      { key: 'glu', label: 'Glucose (fasting)', unit: 'mmol/L', low: 4, high: 5.6 },
      { key: 'hba1c', label: 'HbA1c', unit: '%', high: 6.5 },
    ],
  },
  {
    id: 'abg',
    label: 'Gas',
    icon: '💨',
    analytes: [
      { key: 'ph', label: 'pH', unit: '', low: 7.35, high: 7.45 },
      { key: 'pco2', label: 'pCO₂', unit: 'kPa', low: 4.7, high: 6.0 },
      { key: 'po2', label: 'pO₂', unit: 'kPa', low: 10 },
      { key: 'hco3', label: 'HCO₃', unit: 'mmol/L', low: 22, high: 26 },
      { key: 'lact', label: 'Lactate', unit: 'mmol/L', high: 2 },
    ],
  },
  {
    id: 'coag',
    label: 'Coag',
    icon: '🩹',
    analytes: [
      { key: 'inr', label: 'INR', unit: '', low: 0.9, high: 1.2 },
      { key: 'aptt', label: 'aPTT', unit: 's', low: 25, high: 35 },
    ],
  },
  {
    id: 'cardiac',
    label: 'Cardiac markers',
    icon: '❤️',
    depts: ['medicine', 'emergency', 'icu'],
    analytes: [
      { key: 'trop', label: 'hs-Trop', unit: 'ng/L', high: 14 },
      { key: 'ck', label: 'CK', unit: 'U/L', high: 190 },
      { key: 'bnp', label: 'NT-proBNP', unit: 'pg/mL', high: 300 },
    ],
  },
  {
    id: 'tbhiv',
    label: 'HIV / TB workup',
    icon: '🎗️',
    depts: ['medicine', 'emergency', 'icu'],
    analytes: [
      { key: 'cd4', label: 'CD4', unit: 'cells/µL', low: 200 },
      { key: 'vl', label: 'Viral load', unit: 'copies/mL', high: 50 },
    ],
  },
  {
    id: 'abdo',
    label: 'Surgical / Abdo',
    icon: '🩻',
    depts: ['surgery', 'emergency', 'icu'],
    analytes: [
      { key: 'amylase', label: 'Amylase', unit: 'U/L', high: 100 },
      { key: 'lipase', label: 'Lipase', unit: 'U/L', high: 160 },
      // Free text — blood group + units held/crossmatched, no numeric range.
      { key: 'groupCrossmatch', label: 'Group & X-match', unit: '' },
    ],
  },
  {
    id: 'tox',
    label: 'Toxicology',
    icon: '☠️',
    depts: ['emergency', 'medicine', 'icu'],
    analytes: [
      { key: 'paracetamol', label: 'Paracetamol', unit: 'mg/L' },
      { key: 'salicylate', label: 'Salicylate', unit: 'mg/dL', high: 30 },
    ],
  },
  {
    id: 'sepsis',
    label: 'Sepsis / Haemodynamics',
    icon: '🌡️',
    depts: ['icu', 'medicine', 'emergency'],
    analytes: [
      // Lactate lives in the 'abg' panel and already has clearance-focused
      // trend rules — deliberately not duplicated here.
      { key: 'pct', label: 'Procalcitonin', unit: 'µg/L', high: 0.5 },
      // ScvO2 recorded as a trended value with no reference range — the
      // dossier favours lactate clearance as the resuscitation-response
      // marker in a resource-limited unit; ScvO2 is captured for units that
      // monitor it without asserting a hard threshold.
      { key: 'scvo2', label: 'ScvO2', unit: '%' },
    ],
  },
  {
    id: 'msk',
    label: 'MSK / Crush',
    icon: '🦴',
    // Bone/joint-SEPSIS workup is already covered by the existing 'inflam'
    // (CRP/ESR) and 'fbc' (WCC) panels — deliberately not duplicated here.
    // This panel is the crush/compartment-syndrome/joint-aspirate set: CK for
    // rhabdomyolysis risk (own key, distinct from the 'cardiac' panel's CK,
    // which is read against a normal-range threshold, not a crush threshold),
    // plus two free-text analytes recorded verbatim because a single number
    // without narrative context doesn't drive the decision — synovial fluid
    // WCC/differential (dossier §2.9: >50,000/mm³ with >90% neutrophils
    // supports bacterial infection, but the differential and Gram
    // stain/crystals matter as much as the count) and compartment pressure
    // (dossier §2.2/§4.5: the decision threshold is ΔP = diastolic BP −
    // compartment pressure ≤30mmHg, which needs the patient's own BP to
    // interpret, so it is recorded as text rather than a bare number).
    depts: ['ortho', 'surgery', 'emergency'],
    analytes: [
      // [JUDGMENT CALL] 5000 U/L is standard teaching for "markedly raised
      // CK after crush → aggressive IV fluids to protect the kidneys" — the
      // dossier flags CK/myoglobinuria as the AKI marker to trend but does
      // not hand down a verbatim SA STG cutoff; verify against local protocol.
      { key: 'ckCrush', label: 'CK', unit: 'U/L', high: 5000 },
      { key: 'synovialWcc', label: 'Synovial WCC (diff)', unit: '' },
      { key: 'compartmentPressure', label: 'Compartment Pressure (ΔP)', unit: 'mmHg' },
    ],
  },
  {
    id: 'psych',
    label: 'Psychiatric Monitoring',
    icon: '🧠',
    // The general organic-screen bloods (glucose, U&E, FBC, TFTs, etc. —
    // dossier §4) already live in the panels above and are deliberately not
    // duplicated here. This panel is the psychiatry-specific trended set:
    // lithium and clozapine ANC are genuine therapeutic-drug-monitoring
    // items with their own bands (dossier §2.6/§2.8/§5); CK and urine
    // toxicology are captured as free text (own keys, distinct from the
    // 'cardiac' panel's 'ck' and the 'msk' panel's 'ckCrush', which are read
    // against different reference contexts) because a bare number misleads
    // in both directions here — CK needs the "what happened to this patient
    // physically in the hours before this sample" narrative (struggle/
    // restraint/IM injection vs true NMS, dossier §2.1/§2.8/§4), and urine
    // toxicology needs the window-period/false-positive narrative (dossier
    // §4) rather than a positive/negative flag.
    depts: ['psych', 'emergency', 'medicine'],
    analytes: [
      // Trough only — dossier §2.6/§4: a level drawn at any time other than
      // 12h post-dose is not interpretable against these bands. Range here
      // spans the usual acute-mania target (up to ~1.0-1.2); toxicity bands
      // (1.5/2.0/2.5, dialysis threshold) are handled in trendAlerts below
      // rather than as a bare 'high', since the clinical picture (acute vs
      // chronic exposure, renal function) matters as much as the number.
      { key: 'lithiumLevel', label: 'Lithium (12h post-dose)', unit: 'mmol/L', low: 0.6, high: 1.0 },
      // [EK — dossier §4] range varies by lab/reference and correlates with
      // clinical effect less tightly than in epilepsy; trough (pre-dose).
      { key: 'valproateLevel', label: 'Valproate (trough)', unit: 'mg/L', low: 50, high: 100 },
      // [JUDGMENT CALL] 1.5×10⁹/L reflects the commonly-cited "amber"
      // monitoring-frequency threshold used across international clozapine
      // registries — the dossier explicitly flags that exact numeric action
      // bands differ by registry/local SASOP protocol and were not
      // independently confirmed this session (§5); verify against the
      // protocol in force at your unit. The hard stop threshold
      // (agranulocytosis range) is handled in trendAlerts below.
      { key: 'clozapineAnc', label: 'Clozapine ANC', unit: '×10⁹/L', low: 1.5 },
      // Free text, not a bare number — see panel comment above.
      { key: 'ckPsych', label: 'CK (agitation / NMS workup)', unit: 'U/L' },
      { key: 'urineTox', label: 'Urine Toxicology', unit: '' },
    ],
  },
  {
    id: 'paeds',
    label: 'Paediatric / Neonatal',
    icon: '🍼',
    // The general chemistry/haem/inflam panels above already cover the child
    // and adult range (dossier §4.1: age-banded FBC — lymphocyte
    // predominance until ~4-6y, higher WCC/Plt in infancy — is a reading
    // caveat on the EXISTING 'fbc' panel, not a new set of numbers; a
    // paeds-specific Hb "note" analyte with no numeric behaviour doesn't fit
    // the house pattern of trended, delta-driven analytes, so it is
    // deliberately not added here — the caveat instead lives in paeds.ts
    // field hints where the intern is actually plotting/reading the value).
    // This panel is the neonatal-specific trended set that genuinely needs
    // its own keys and its own rules: bilirubin (read against an
    // hours-of-life/gestation CHART, not a threshold — dossier §2.1.2/§4.6),
    // glucose (a neonate-specific <2.6 mmol/L action threshold, distinct
    // from the general 'glu' panel's adult-pattern <3 emergency rule —
    // dossier §2.1.3/§4.5), CRP (kinetics caveat: a single early value does
    // not exclude sepsis — dossier §2.1.1/§4.7), and weight (trended across
    // the admission — the malnutrition/dehydration/growth-faltering signal
    // and, in a neonate, the >10% birth-weight-loss threshold — dossier
    // §2.1.2/§3.2/§6).
    depts: ['paeds'],
    analytes: [
      // No low/high — deliberately not threshold-scored. TSB is only
      // interpretable plotted against age-in-HOURS on the gestational-age-
      // and risk-factor-specific curve (dossier §2.1.2/§4.6); a bare
      // high-value flag here would encourage exactly the single-number
      // reasoning the dossier warns against.
      { key: 'neoBili', label: 'Neonatal TSB (plot vs hours-of-life)', unit: 'µmol/L' },
      // Neonate-specific action threshold (<2.6), distinct from the general
      // 'glu' panel's adult/child <3 emergency rule and its 4-7.8 range —
      // own key so the two don't collide or cross-apply.
      { key: 'neoGlu', label: 'Neonatal Glucose', unit: 'mmol/L', low: 2.6 },
      // Own key, distinct from the general 'crp' panel — same high-ULN
      // convention, but read with the neonatal kinetics caveat below.
      { key: 'crpNeo', label: 'CRP (neonate)', unit: 'mg/L', high: 10 },
      // No fixed low/high — a "normal" range spans a 25kg swing across the
      // paeds age bands, so this is read as a TREND (weight-for-age centile
      // lives on the RTHB, not here) rather than against a static band.
      { key: 'weightKg', label: 'Weight', unit: 'kg' },
    ],
  },
];

/** Panels offered for a department — unscoped panels surface everywhere. */
export function panelsFor(dept?: string): Panel[] {
  return PANELS.filter(p => !p.depts || (dept && p.depts.includes(dept as DeptId)));
}

export const ALL_ANALYTES: Record<string, Analyte> = Object.fromEntries(
  PANELS.flatMap(p => p.analytes.map(a => [a.key, a]))
);

// ─── Trend extraction ────────────────────────────────────────────────────────

export interface TrendPoint {
  date: string;
  value: number;
  raw: string;
}

export interface AnalyteTrend {
  key: string;
  label: string;
  unit: string;
  points: TrendPoint[]; // chronological
  latest: TrendPoint;
  previous?: TrendPoint;
  direction: 'up' | 'down' | 'flat';
  outOfRange: 'high' | 'low' | null;
}

function parseNum(v: string): number | null {
  const m = v.replace(',', '.').match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}

export function analyteTrends(entries: InvestigationEntry[]): AnalyteTrend[] {
  const byKey = new Map<string, TrendPoint[]>();
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  for (const e of sorted) {
    for (const [k, raw] of Object.entries(e.values)) {
      const value = parseNum(raw);
      if (value === null) continue;
      if (!byKey.has(k)) byKey.set(k, []);
      byKey.get(k)!.push({ date: e.date, value, raw });
    }
  }
  const trends: AnalyteTrend[] = [];
  for (const [key, points] of byKey) {
    const meta = ALL_ANALYTES[key] ?? { key, label: key, unit: '' };
    const latest = points[points.length - 1];
    const previous = points.length > 1 ? points[points.length - 2] : undefined;
    const direction: AnalyteTrend['direction'] = !previous
      ? 'flat'
      : latest.value > previous.value
        ? 'up'
        : latest.value < previous.value
          ? 'down'
          : 'flat';
    const outOfRange =
      meta.high !== undefined && latest.value > meta.high
        ? 'high'
        : meta.low !== undefined && latest.value < meta.low
          ? 'low'
          : null;
    trends.push({ key, label: meta.label, unit: meta.unit, points, latest, previous, direction, outOfRange });
  }
  return trends;
}

// ─── One-step-ahead rules (deterministic, no AI) ─────────────────────────────

export interface TrendAlert {
  severity: 'red' | 'amber';
  analyte: string;
  message: string;
  why: string;
}

export function trendAlerts(trends: AnalyteTrend[]): TrendAlert[] {
  const alerts: TrendAlert[] = [];
  const t = (k: string) => trends.find(x => x.key === k);
  const delta = (x?: AnalyteTrend) => (x && x.previous ? x.latest.value - x.previous.value : 0);

  const k = t('k');
  if (k) {
    if (k.latest.value >= 6.0)
      alerts.push({ severity: 'red', analyte: 'K+', message: `K⁺ ${k.latest.raw} — ECG + treat now, repeat 1-2h after each shift therapy`, why: 'Above 6.0 the membrane is at risk regardless of symptoms; insulin/salbutamol only shift K⁺ for 2-4h, so the recheck is part of the treatment, not an afterthought.' });
    else if (k.latest.value < 3.0)
      alerts.push({ severity: 'red', analyte: 'K+', message: `K⁺ ${k.latest.raw} — replace IV + check Mg²⁺`, why: 'Below 3.0 arrhythmia risk climbs steeply, and hypokalaemia is refractory until magnesium is corrected alongside it.' });
    else if (Math.abs(delta(k)) >= 0.5)
      alerts.push({ severity: 'amber', analyte: 'K+', message: `K⁺ moved ${delta(k) > 0 ? '+' : ''}${delta(k).toFixed(1)} since ${k.previous!.date} — review the drug chart`, why: 'A ≥0.5 swing in a day is usually iatrogenic: ACEi/spironolactone/replacement fluids going up, or insulin/diuretics/diarrhoea going down. Find the cause before the next result finds you.' });
  }

  const na = t('na');
  if (na && Math.abs(delta(na)) >= 8)
    alerts.push({ severity: 'red', analyte: 'Na+', message: `Na⁺ changed ${delta(na) > 0 ? '+' : ''}${delta(na)} mmol/L since ${na.previous!.date} — correction too fast`, why: 'Sodium corrected faster than 8-10 mmol/L/24h risks osmotic demyelination (correcting up) or cerebral oedema (falling fast) — the RATE is the emergency, recheck 2-4 hourly and slow it down.' });

  const creat = t('creat');
  if (creat && creat.previous && creat.latest.value >= creat.previous.value * 1.5)
    alerts.push({ severity: 'red', analyte: 'Creatinine', message: `Creatinine ${creat.previous.raw} → ${creat.latest.raw} (≥1.5×) — AKI criteria met`, why: 'A 1.5× rise from baseline is KDIGO stage 1: stop nephrotoxics today, strict input/output, dipstick, and dose-adjust everything renally cleared — reversibility is won in the first 48h.' });
  else if (creat && delta(creat) > 26)
    alerts.push({ severity: 'amber', analyte: 'Creatinine', message: `Creatinine up ${delta(creat).toFixed(0)} µmol/L in a day — trending toward AKI`, why: 'A ≥26 µmol/L rise in 48h also meets KDIGO stage 1 — the trend earns the AKI work-up before the ratio does.' });

  const hb = t('hb');
  if (hb && delta(hb) <= -2)
    alerts.push({ severity: 'red', analyte: 'Hb', message: `Hb dropped ${Math.abs(delta(hb)).toFixed(1)} g/dL since ${hb.previous!.date} — where is the blood going?`, why: 'A 2 g/dL fall is a unit of blood: re-examine (abdomen, drains, PR, wound), repeat to exclude dilution, and crossmatch before it becomes an emergency at 03:00.' });

  const plt = t('plt');
  if (plt && plt.previous && plt.latest.value <= plt.previous.value / 2)
    alerts.push({ severity: 'red', analyte: 'Platelets', message: `Platelets halved (${plt.previous.raw} → ${plt.latest.raw})`, why: 'A halving matters more than the absolute count: think sepsis/DIC, HIT if on heparin day 3-10, or HELLP in pregnancy — each has a different next test and all are time-critical.' });
  else if (plt && plt.latest.value < 10)
    alerts.push({ severity: 'red', analyte: 'Platelets', message: `Plt ${plt.latest.raw} — prophylactic transfusion trigger even if not bleeding`, why: 'Below 10×10⁹/L spontaneous bleeding risk rises sharply — transfuse prophylactically regardless of bleeding; the threshold rises to <20 if febrile/septic and <50 before an invasive procedure.' });

  const crp = t('crp');
  if (crp && crp.previous && crp.points.length >= 2 && delta(crp) > 0 && crp.previous.value > 50)
    alerts.push({ severity: 'amber', analyte: 'CRP', message: `CRP still rising (${crp.previous.raw} → ${crp.latest.raw}) — is the source controlled?`, why: 'CRP lags 24-48h, but a rise on day 3-4 of adequate antibiotics means wrong bug, wrong drug, or an undrained collection — re-image/re-culture rather than adding another agent blindly.' });

  const pct = t('pct');
  if (pct && pct.previous) {
    if (pct.latest.value < 0.5 && delta(pct) < 0)
      alerts.push({ severity: 'amber', analyte: 'Procalcitonin', message: `PCT falling (${pct.previous.raw} → ${pct.latest.raw}) — supports stopping antibiotics if clinically improving`, why: 'A falling PCT below ~0.5 µg/L in a clinically improving patient supports de-escalating/stopping antibiotics — it does not replace clinical judgement or override an undrained source, and is not universally available at SA state facilities.' });
    else if (delta(pct) > 0 && pct.latest.value >= 0.5)
      alerts.push({ severity: 'amber', analyte: 'Procalcitonin', message: `PCT rising (${pct.previous.raw} → ${pct.latest.raw}) — is the source controlled?`, why: 'A rising PCT on treatment suggests ongoing or inadequately controlled infection — re-examine for an undrained source rather than escalating antibiotic spectrum blindly.' });
  }

  const glu = t('glu');
  if (glu && glu.latest.value < 3)
    alerts.push({ severity: 'red', analyte: 'Glucose', message: `Glucose ${glu.latest.raw} — treat now, then find the cause`, why: 'Hypoglycaemia kills faster than hyperglycaemia. After treating: insulin chart error, sepsis, liver failure, or an oral agent that outlived the meal.' });

  const lact = t('lact');
  if (lact) {
    if (lact.latest.value >= 4)
      alerts.push({ severity: 'red', analyte: 'Lactate', message: `Lactate ${lact.latest.raw} — significant hypoperfusion, resuscitate now`, why: '>4 mmol/L signals significant hypoperfusion or possible ischaemia (surgical abdomen, mesenteric ischaemia, occult shock) — this is a resuscitate-and-reassess-in-person threshold, not a number to trend from the desk.' });
    else if (lact.previous && delta(lact) >= 0 && lact.latest.value > 2)
      alerts.push({ severity: 'amber', analyte: 'Lactate', message: `Lactate not clearing (${lact.previous.raw} → ${lact.latest.raw})`, why: 'Lactate clearance is the bedside proof that resuscitation is working — a flat or rising lactate despite fluids means the perfusion problem is not fixed, whatever the blood pressure says.' });
  }

  const amylase = t('amylase');
  if (amylase && amylase.latest.value >= 300)
    alerts.push({ severity: 'amber', analyte: 'Amylase', message: `Amylase ${amylase.latest.raw} (>3× ULN) — supports acute pancreatitis`, why: 'Amylase up to ~3× ULN is non-specific (also raised by perforation and mesenteric ischaemia); above 3× it supports pancreatitis — score severity with Glasgow-Imrie/Ranson at 48h and re-examine for a surgical abdomen hiding behind the pancreatitis label.' });

  const paracetamol = t('paracetamol');
  if (paracetamol) {
    if (paracetamol.latest.value >= 150)
      alerts.push({ severity: 'red', analyte: 'Paracetamol', message: `Paracetamol ${paracetamol.latest.raw} — at/above the 4h treatment line, start NAC`, why: 'The Rumack-Matthew nomogram treatment line is 150 mg/L at 4h (~37.5 mg/L at 12h) — a level at or above the line for its timepoint starts the 3-bag NAC regimen; NAC is most effective <8h post-ingestion, so do not wait for a second level to start it.' });
    else
      alerts.push({ severity: 'amber', analyte: 'Paracetamol', message: `Paracetamol ${paracetamol.latest.raw} — plot on the Rumack-Matthew nomogram against the EXACT ingestion time`, why: 'A level means nothing without the time since ingestion — a single value cannot be read in isolation. Send a level on every deliberate overdose regardless of the story (it is silent and treatable), and treat empirically if presentation is >8h post-ingestion while awaiting the result.' });
  }

  const salicylate = t('salicylate');
  if (salicylate && salicylate.latest.value > 50)
    alerts.push({ severity: 'red', analyte: 'Salicylate', message: `Salicylate ${salicylate.latest.raw} — severe toxicity range`, why: 'High salicylate levels drive a mixed respiratory alkalosis + metabolic acidosis (part of the MUDPILES high-anion-gap picture) — recheck the gas, consider urine alkalinisation, and involve seniors early for a dialysis discussion.' });

  const inr = t('inr');
  if (inr && inr.latest.value >= 4.5)
    alerts.push({ severity: 'red', analyte: 'INR', message: `INR ${inr.latest.raw} — hold warfarin, assess bleeding, reversal plan`, why: 'Above ~4.5 bleeding risk climbs steeply; the decision tree (hold vs vitamin K vs factors) depends on bleeding and the indication — write the plan now, not at the bleed.' });

  const trop = t('trop');
  if (trop && trop.previous && trop.latest.value > 14 && trop.latest.value >= trop.previous.value * 1.2)
    alerts.push({ severity: 'red', analyte: 'Troponin', message: `hs-Trop rising (${trop.previous.raw} → ${trop.latest.raw}, >20%) — acute myocardial injury`, why: 'A single raised troponin has a dozen causes; a RISING pattern on serial measurement is what diagnoses acute injury — treat as ACS pathway until an alternative (PE, myocarditis, sepsis demand) is established.' });
  else if (trop && !trop.previous && trop.latest.value > 14)
    alerts.push({ severity: 'amber', analyte: 'Troponin', message: `hs-Trop ${trop.latest.raw} raised — repeat at 3-6h; the DELTA makes the diagnosis`, why: 'One value cannot separate acute injury from chronic elevation (renal failure, heart failure) — the serial rise or fall is the discriminator, so the repeat is not optional.' });

  const cd4 = t('cd4');
  if (cd4 && cd4.latest.value < 200)
    alerts.push({ severity: 'red', analyte: 'CD4', message: `CD4 ${cd4.latest.raw} — advanced HIV disease: reflex CrAg, urine LAM if unwell, cotrimoxazole`, why: 'Below 200 the differential changes species: TB (including disseminated), cryptococcal meningitis, PJP and severe bacterial infection are the four killers — the AHD package (serum CrAg, urine LAM in the sick patient, cotrimoxazole prophylaxis) is protocol, not judgement.' });

  const vl = t('vl');
  if (vl && vl.latest.value > 1000)
    alerts.push({ severity: 'amber', analyte: 'Viral load', message: `VL ${vl.latest.raw} — unsuppressed: enhanced adherence counselling + repeat in 2-3 months per guideline`, why: 'Above 1000 on ART means non-adherence or resistance; the SA pathway is enhanced adherence support then a repeat VL — a persistent >1000 despite good adherence is the trigger for resistance testing/regimen switch.' });

  const ckCrush = t('ckCrush');
  if (ckCrush && ckCrush.latest.value >= 5000)
    alerts.push({ severity: 'red', analyte: 'CK', message: `CK ${ckCrush.latest.raw} — crush/rhabdomyolysis: aggressive IV fluids, hourly urine output, dipstick for myoglobinuria`, why: 'Markedly raised CK after crush injury, prolonged compartment compression, or a "found down" prolonged lie predicts AKI — protect the kidneys with early aggressive IV fluids and hourly urine output rather than waiting on a single creatinine. Dipstick blood-positive with no RBCs on microscopy confirms myoglobinuria; trend CK and renal function together, do not single-point it.' });

  const lith = t('lithiumLevel');
  if (lith) {
    if (lith.latest.value >= 2.5)
      alerts.push({ severity: 'red', analyte: 'Lithium', message: `Lithium ${lith.latest.raw} — severe toxicity range: discuss dialysis now`, why: '≥2.5 mmol/L (and certainly >3-4 in an acute-on-chronic picture) carries a real risk of seizures, coma, and death — this is the range where haemodialysis is actively considered, particularly with renal impairment, a falling conscious level, or inability to tolerate oral fluids. Chronic toxicity (a previously stable patient whose renal clearance has fallen — dehydration, a new NSAID/ACE-inhibitor/ARB/diuretic) can produce severe neurotoxicity at a lower level than acute single-ingestion toxicity, so weigh the clinical picture at least as heavily as the number.' });
    else if (lith.latest.value >= 2.0)
      alerts.push({ severity: 'red', analyte: 'Lithium', message: `Lithium ${lith.latest.raw} — severe toxicity: confusion, worsening ataxia, hyperreflexia, seizure risk`, why: 'From 2.0 mmol/L upward toxicity is more severe (confusion, worsening ataxia, hyperreflexia, potential seizures, cardiac conduction changes) — stop lithium, IV fluids, and escalate; the dialysis discussion starts here, not only at 2.5, if renal function is impaired or oral intake cannot be tolerated.' });
    else if (lith.latest.value >= 1.5)
      alerts.push({ severity: 'amber', analyte: 'Lithium', message: `Lithium ${lith.latest.raw} — early toxicity range (coarse tremor, GI upset, ataxia, drowsiness)`, why: 'From ~1.5 mmol/L upward early toxicity signs appear. Ask what changed clearance — dehydration, reduced intake, diarrhoea/vomiting, or a newly-started NSAID/ACE-inhibitor/ARB/diuretic are the classic precipitants of toxicity in a patient who was previously stable on this dose, not usually a dosing error.' });
    else
      alerts.push({ severity: 'amber', analyte: 'Lithium', message: `Lithium ${lith.latest.raw} — confirm this was drawn 12h post-dose before acting on it`, why: 'The level is only interpretable against the standard therapeutic/toxicity bands as a 12-hour post-dose trough — a level drawn at any other time cannot be read against these ranges, and acting on a mistimed level is a common, avoidable error. Toxicity can still occur at an apparently "therapeutic" level if renal clearance has acutely fallen, so correlate with the clinical picture, not the number alone.' });
  }

  const ckPsych = t('ckPsych');
  if (ckPsych) {
    if (ckPsych.latest.value >= 10000)
      alerts.push({ severity: 'red', analyte: 'CK', message: `CK ${ckPsych.latest.raw} — into the tens-of-thousands range: true NMS or severe rhabdomyolysis until proven otherwise`, why: 'This is far higher than struggle/restraint/IM injection alone typically produces (usually low-hundreds for an injection, low-to-mid thousands for prolonged struggle) — correlate with rigidity, hyperthermia, autonomic instability, and altered mental status (the full NMS picture), stop the causative antipsychotic now, and protect the kidneys with aggressive IV fluids rather than waiting for the rest of the picture to declare itself.' });
    else if (ckPsych.previous && delta(ckPsych) > 0)
      alerts.push({ severity: 'amber', analyte: 'CK', message: `CK rising (${ckPsych.previous.raw} → ${ckPsych.latest.raw}) — trend it, don't anchor on one number`, why: 'A simple IM injection produces a modest, transient rise (low-hundreds); struggle, restraint, or prolonged agitation alone can reach the low-to-mid thousands and mimic early NMS. A single value without a pre-intervention baseline is easy to over- or under-interpret — record what happened physically to this patient in the hours before the sample, and read the trend against the rest of the clinical picture, not the number in isolation.' });
  }

  const anc = t('clozapineAnc');
  if (anc) {
    if (anc.latest.value < 0.5)
      alerts.push({ severity: 'red', analyte: 'Clozapine ANC', message: `ANC ${anc.latest.raw} — agranulocytosis range: STOP clozapine now, do not taper`, why: 'Clozapine is stopped immediately, not tapered, once agranulocytosis is confirmed — the one mandatory-stop threshold in this formulary. Exact numeric action thresholds vary by monitoring registry (UK/US/local SASOP protocol) — verify against the protocol actually in force at your unit before acting on this number in isolation (verify vs local monitoring protocol).' });
    else if (anc.latest.value < 1.5)
      alerts.push({ severity: 'amber', analyte: 'Clozapine ANC', message: `ANC ${anc.latest.raw} — below the routine "green zone": increase monitoring frequency`, why: 'A falling ANC below the routine monitoring threshold used by most clozapine registries triggers increased-frequency monitoring before it reaches the stop threshold — do not wait for the next scheduled sample if the trend is downward. Confirm the exact action bands against your unit\'s registry (verify vs local monitoring protocol).' });
  }

  const neoBili = t('neoBili');
  if (neoBili)
    alerts.push({ severity: 'amber', analyte: 'Neonatal Bilirubin', message: `TSB ${neoBili.latest.raw} — plot it, don't threshold it: age-in-HOURS + gestation against the phototherapy/exchange chart`, why: 'Phototherapy and exchange thresholds are gestational-age- and neurotoxicity-risk-banded, not a single cut-off — the same TSB number triggers phototherapy far earlier in a preterm or haemolysing infant than in a well term infant. Jaundice visible before 24h of life is pathological regardless of the number; any acute bilirubin encephalopathy sign (lethargy, hypertonia, high-pitched cry, seizures) justifies exchange even below the charted value.' });

  const neoGlu = t('neoGlu');
  if (neoGlu && neoGlu.latest.value < 2.6)
    alerts.push({ severity: neoGlu.latest.value < 1.5 || neoGlu.latest.value < 2.0 ? 'red' : 'amber', analyte: 'Neonatal Glucose', message: `Glucose ${neoGlu.latest.raw} — below the 2.6 mmol/L neonatal action threshold: feed → IV 10% dextrose bolus (~2 mL/kg) → maintenance infusion, escalate GIR if refractory`, why: 'Any level with neurological symptoms (jitteriness, lethargy, apnoea, seizures) is an emergency at any reading; a level <1.5-2.0 mmol/L is treated as an emergency regardless of symptoms. If refractory to escalating glucose infusion rate, send a "critical sample" (glucose, insulin, cortisol, GH, lactate, ammonia) AT a proven low reading — it is often the only chance to catch hyperinsulinism or a metabolic cause.' });

  const crpNeo = t('crpNeo');
  if (crpNeo && !crpNeo.previous)
    alerts.push({ severity: 'amber', analyte: 'CRP (neonate)', message: `CRP ${crpNeo.latest.raw} — a single early value does NOT exclude sepsis; repeat at 24-48h before trusting a normal result`, why: 'CRP lags the clinical onset of neonatal sepsis by 12-24h and is often normal at presentation — treat the baby, not the number. A serial CRP that STAYS normal at 24-48h is what supports stopping antibiotics, not one normal value on admission.' });
  else if (crpNeo && crpNeo.previous && delta(crpNeo) > 0)
    alerts.push({ severity: 'amber', analyte: 'CRP (neonate)', message: `CRP rising (${crpNeo.previous.raw} → ${crpNeo.latest.raw}) — supports ongoing/inadequately treated sepsis`, why: 'A rising serial CRP in a neonate on treatment argues for continuing/broadening cover and re-examining for a focus (line, umbilicus, joint) rather than stopping on a single reassuring earlier value.' });

  const weightKg = t('weightKg');
  if (weightKg && weightKg.points.length >= 2) {
    const baseline = weightKg.points[0];
    const pctChange = ((weightKg.latest.value - baseline.value) / baseline.value) * 100;
    if (pctChange <= -10)
      alerts.push({ severity: 'red', analyte: 'Weight', message: `Weight down ${Math.abs(pctChange).toFixed(1)}% from ${baseline.raw} (${baseline.date}) — beyond the physiological range`, why: 'Up to 7-10% weight loss from birth weight is physiological, regained by day 10-14 — a documented loss beyond 10% (in a neonate, or unintentional loss of this size in any child) needs a formal feeding assessment ± sodium/hydration work-up, not reassurance.' });
  }

  return alerts;
}

/** Compact text form of the latest deltas, for the ward-round engine. */
export function serializeLatestResults(entries: InvestigationEntry[]): string {
  const trends = analyteTrends(entries);
  if (trends.length === 0) return '';
  const parts = trends.map(tr => {
    const arrow = !tr.previous ? '' : tr.direction === 'up' ? '↑' : tr.direction === 'down' ? '↓' : '→';
    const prev = tr.previous ? ` (was ${tr.previous.raw} on ${tr.previous.date})` : '';
    return `${tr.label} ${tr.latest.raw}${arrow}${prev}`;
  });
  return parts.join('; ');
}
