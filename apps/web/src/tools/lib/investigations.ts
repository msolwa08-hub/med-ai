// Serial investigations — the trending companion. Results are captured per
// date, trended across the admission, and screened by DETERMINISTIC delta
// rules that think one step ahead of the intern ("K+ rose 0.7 in 24h — what
// changed on the drug chart?"). AI interpretation is layered on top via the
// existing /tools/interpret-labs endpoint; these rules fire with or without it.

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
}

export const PANELS: Panel[] = [
  {
    id: 'uec',
    label: 'U&E + Creat',
    icon: '🧂',
    analytes: [
      { key: 'na', label: 'Na', unit: 'mmol/L', low: 135, high: 145 },
      { key: 'k', label: 'K', unit: 'mmol/L', low: 3.5, high: 5.1 },
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
      { key: 'hb', label: 'Hb', unit: 'g/dL', low: 12, high: 17 },
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
      { key: 'glu', label: 'Glucose', unit: 'mmol/L', low: 4, high: 7.8 },
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
];

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

  const crp = t('crp');
  if (crp && crp.previous && crp.points.length >= 2 && delta(crp) > 0 && crp.previous.value > 50)
    alerts.push({ severity: 'amber', analyte: 'CRP', message: `CRP still rising (${crp.previous.raw} → ${crp.latest.raw}) — is the source controlled?`, why: 'CRP lags 24-48h, but a rise on day 3-4 of adequate antibiotics means wrong bug, wrong drug, or an undrained collection — re-image/re-culture rather than adding another agent blindly.' });

  const glu = t('glu');
  if (glu && glu.latest.value < 3)
    alerts.push({ severity: 'red', analyte: 'Glucose', message: `Glucose ${glu.latest.raw} — treat now, then find the cause`, why: 'Hypoglycaemia kills faster than hyperglycaemia. After treating: insulin chart error, sepsis, liver failure, or an oral agent that outlived the meal.' });

  const lact = t('lact');
  if (lact && lact.previous && delta(lact) >= 0 && lact.latest.value > 2)
    alerts.push({ severity: 'amber', analyte: 'Lactate', message: `Lactate not clearing (${lact.previous.raw} → ${lact.latest.raw})`, why: 'Lactate clearance is the bedside proof that resuscitation is working — a flat or rising lactate despite fluids means the perfusion problem is not fixed, whatever the blood pressure says.' });

  const inr = t('inr');
  if (inr && inr.latest.value >= 4.5)
    alerts.push({ severity: 'red', analyte: 'INR', message: `INR ${inr.latest.raw} — hold warfarin, assess bleeding, reversal plan`, why: 'Above ~4.5 bleeding risk climbs steeply; the decision tree (hold vs vitamin K vs factors) depends on bleeding and the indication — write the plan now, not at the bleed.' });

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
