// ─── SYSTEMS MAP — see what's wrong with the body ────────────────────────────
// Deterministic layer that turns the patient's ACTUAL entered data — the trended
// investigations + the weighted differential — into a lit-up organ-system
// schematic: which systems are deranged, how badly, what's driving each, and the
// clinically-meaningful relationships (edges) between the systems that are BOTH
// implicated. Pure interpretation (no model call, no doses); reuses the
// per-analyte teaching in investigationInsight.ts so the visual and the words
// tell one story. Positions are on a ~100×120 schematic canvas, loosely
// body-arranged (head → chest → abdomen → systemic band).

import { ALL_ANALYTES, type AnalyteTrend } from './investigations';
import { insightFor, type AnalyteStatus } from './investigationInsight';
import type { WorkingPicture } from '../toolsApi';

export type SystemId =
  | 'cns' | 'resp' | 'cvs' | 'hepatic' | 'gi' | 'renal'
  | 'haem' | 'coag' | 'metabolic' | 'infection';

export type Severity = 'none' | 'watch' | 'amber' | 'red';

export interface SystemDef {
  id: SystemId;
  label: string;   // full name
  short: string;   // node glyph label
  x: number;       // 0–100
  y: number;       // 0–120
}

// Loosely body-arranged so the picture reads at a glance.
export const SYSTEMS: SystemDef[] = [
  { id: 'cns',       label: 'CNS / Neuro',        short: 'CNS',    x: 50, y: 8 },
  { id: 'resp',      label: 'Respiratory',        short: 'Lungs',  x: 33, y: 30 },
  { id: 'cvs',       label: 'Cardiovascular',     short: 'Heart',  x: 61, y: 31 },
  { id: 'hepatic',   label: 'Hepatobiliary',      short: 'Liver',  x: 71, y: 54 },
  { id: 'gi',        label: 'GI / Pancreas',      short: 'Gut',    x: 46, y: 57 },
  { id: 'renal',     label: 'Renal',              short: 'Kidney', x: 26, y: 54 },
  { id: 'haem',      label: 'Haematology',        short: 'Blood',  x: 72, y: 82 },
  { id: 'coag',      label: 'Coagulation',        short: 'Clot',   x: 28, y: 80 },
  { id: 'metabolic', label: 'Metabolic / Acid–base', short: 'Metab', x: 50, y: 90 },
  { id: 'infection', label: 'Infection / Inflammation', short: 'Sepsis', x: 50, y: 110 },
];

// analyte key → the system(s) it lights up.
const ANALYTE_SYSTEM: Record<string, SystemId[]> = {
  na: ['renal'], k: ['renal', 'cvs'], cl: ['renal'], urea: ['renal'], creat: ['renal'], egfr: ['renal'],
  hb: ['haem'], wcc: ['haem'], plt: ['haem'], mcv: ['haem'], retic: ['haem'],
  po2: ['resp'], pco2: ['resp'], ph: ['metabolic'], hco3: ['metabolic'], lact: ['metabolic'],
  bili: ['hepatic'], alt: ['hepatic'], ast: ['hepatic'], alp: ['hepatic'], ggt: ['hepatic'], alb: ['hepatic'],
  inr: ['coag'], aptt: ['coag'],
  glu: ['metabolic'], hba1c: ['metabolic'],
  crp: ['infection'], esr: ['infection'], pct: ['infection'], cd4: ['infection'], vl: ['infection'],
  trop: ['cvs'], ck: ['cvs'], bnp: ['cvs'],
  amylase: ['gi'], lipase: ['gi'],
};

// clinically meaningful relationships — an edge lights only when BOTH ends are active.
export const EDGES: [SystemId, SystemId][] = [
  ['renal', 'cvs'],       // K⁺ → arrhythmia; fluid balance
  ['renal', 'metabolic'], // AKI → acidosis
  ['resp', 'metabolic'],  // respiratory ↔ metabolic compensation
  ['hepatic', 'coag'],    // synthetic function → clotting factors
  ['hepatic', 'haem'],    // bilirubin / splenic / anaemia
  ['infection', 'haem'],  // WCC response
  ['cvs', 'resp'],        // heart ↔ lung
  ['infection', 'metabolic'], // sepsis → lactate
  ['gi', 'hepatic'],      // pancreas / biliary
];

// leading-differential keyword → system(s) it implicates (a suspicion ring).
const DX_SYSTEM: { rx: RegExp; systems: SystemId[] }[] = [
  { rx: /pneumonia|copd|asthma|respiratory|bronch|ards|pulmonary oedema/i, systems: ['resp'] },
  { rx: /pulmonary embol|\bpe\b/i, systems: ['resp', 'cvs'] },
  { rx: /\baki\b|renal|kidney|\bckd\b|nephr/i, systems: ['renal'] },
  { rx: /\bacs\b|myocard|\bmi\b|angina|heart failure|cardiac|arrhythm|ischaem/i, systems: ['cvs'] },
  { rx: /sepsis|septic|infection|meningitis|cellulitis|pyelo|abscess/i, systems: ['infection'] },
  { rx: /\bdka\b|\bhhs\b|hypoglyc|hyperglyc|acidosis|alkalosis|ketoacid/i, systems: ['metabolic'] },
  { rx: /hepatitis|liver|cirrho|cholangi|biliary|cholecyst|jaundice/i, systems: ['hepatic'] },
  { rx: /an[ae]mia|bleed|haemorrhage|thrombocyt|pancytopenia|leuk|marrow/i, systems: ['haem'] },
  { rx: /stroke|seizure|encephal|delirium|\btia\b|raised icp|gcs/i, systems: ['cns'] },
  { rx: /pancreatit|bowel|obstruction|appendic|perforat|ischaemic gut|\bgi\b/i, systems: ['gi'] },
  { rx: /\bdic\b|coagulopath|thrombosis|\bvte\b/i, systems: ['coag'] },
];

const RANK: Record<Severity, number> = { none: 0, watch: 1, amber: 2, red: 3 };
const statusSeverity = (s: AnalyteStatus): Severity =>
  s === 'critical-low' || s === 'critical-high' ? 'red' : s === 'high' || s === 'low' ? 'amber' : 'none';

export interface SystemDriver {
  key: string; label: string; value: string; status: AnalyteStatus; meaning: string; why: string;
}
export interface SystemState extends SystemDef {
  active: boolean;
  severity: Severity;
  drivers: SystemDriver[];
  dxImplicated: string[];
}
export interface SystemsModel {
  systems: SystemState[];
  edges: { a: SystemId; b: SystemId; severity: Severity }[];
  anyActive: boolean;
}

/** Build the lit-up schematic from the trended results + the weighted differential. */
export function buildSystemsMap(trends: AnalyteTrend[], picture?: WorkingPicture): SystemsModel {
  const drivers = {} as Record<SystemId, SystemDriver[]>;
  const worst = {} as Record<SystemId, Severity>;
  for (const s of SYSTEMS) { drivers[s.id] = []; worst[s.id] = 'none'; }

  for (const t of trends) {
    const systems = ANALYTE_SYSTEM[t.key];
    if (!systems) continue;
    const analyte = ALL_ANALYTES[t.key];
    const insight = insightFor(t, analyte);
    const sev = statusSeverity(insight.status);
    if (sev === 'none') continue; // only abnormal analytes light a system
    for (const sid of systems) {
      drivers[sid].push({ key: t.key, label: analyte?.label ?? t.label, value: t.latest.raw, status: insight.status, meaning: insight.meaning, why: insight.why });
      if (RANK[sev] > RANK[worst[sid]]) worst[sid] = sev;
    }
  }

  // Leading-differential suspicion (top 2 by confidence) → implicated systems.
  const dxImpl = {} as Record<SystemId, string[]>;
  for (const s of SYSTEMS) dxImpl[s.id] = [];
  const leading = (picture?.differentials ?? []).slice(0, 2);
  for (const d of leading) {
    for (const { rx, systems } of DX_SYSTEM) {
      if (rx.test(d.dx)) for (const sid of systems) if (!dxImpl[sid].includes(d.dx)) dxImpl[sid].push(d.dx);
    }
  }

  const systems: SystemState[] = SYSTEMS.map(def => {
    const sev = worst[def.id];
    const dx = dxImpl[def.id];
    const active = sev !== 'none' || dx.length > 0;
    return {
      ...def,
      active,
      severity: sev === 'none' && dx.length > 0 ? 'watch' : sev,
      drivers: drivers[def.id].sort((a, b) => RANK[statusSeverity(b.status)] - RANK[statusSeverity(a.status)]),
      dxImplicated: dx,
    };
  });

  const byId = Object.fromEntries(systems.map(s => [s.id, s])) as Record<SystemId, SystemState>;
  const edges = EDGES
    .filter(([a, b]) => byId[a].active && byId[b].active)
    .map(([a, b]) => ({ a, b, severity: RANK[byId[a].severity] >= RANK[byId[b].severity] ? byId[a].severity : byId[b].severity }));

  return { systems, edges, anyActive: systems.some(s => s.active) };
}

/** Hex for a severity — matches the design-token band palette (theme-agnostic status). */
export const SEVERITY_HEX: Record<Severity, string> = {
  red: '#e11d48',    // band-exclude / danger
  amber: '#c2740a',  // band-possible / warn
  watch: '#0d9488',  // brand teal (suspicion, not yet abnormal)
  none: 'rgb(var(--ink-mute))',
};
