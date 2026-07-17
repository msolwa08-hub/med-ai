import {
  Stethoscope, Scissors, Venus, Baby, Activity, Siren, Brain, Bone, Syringe,
  Ban, TriangleAlert, HeartPulse, Wind, Thermometer, Droplet, Zap, CircleDot,
  Ambulance, Beaker, FlaskConical, Home, type LucideIcon,
} from 'lucide-react';
import type { DeptId } from '../config/departments';

// ─── One icon system ─────────────────────────────────────────────────────────
// The M-UI/2 pass replaces emoji-as-chrome with crisp lucide icons — the single
// biggest "toy → premium" lever. Department identity, severity markers and the
// ad-hoc glyph "icons" (✓/↑/●) all resolve through here so the app speaks ONE
// visual language. Data files (departments, symptomCascades, investigations)
// keep their emoji field for back-compat, but the UI renders these instead.

export const DEPT_ICONS: Record<DeptId, LucideIcon> = {
  medicine: Stethoscope,
  surgery: Scissors,
  og: Venus,        // ♀ — obstetrics & gynaecology
  paeds: Baby,
  icu: Activity,    // the monitor trace
  emergency: Siren,
  psych: Brain,
  ortho: Bone,
  anaes: Syringe,
  family: Home,
};

/** The department's icon, with a safe clinical fallback for any unmapped id. */
export function deptIcon(id: string): LucideIcon {
  return DEPT_ICONS[id as DeptId] ?? HeartPulse;
}

// Severity markers — replaces the ⛔ / ⚠️ emoji used across safety warnings,
// round deltas and the working picture.
export const SEVERITY_ICONS = {
  block: Ban,          // ⛔ hard stop / contraindication
  warn: TriangleAlert, // ⚠️ caution
} as const;

export type Severity = keyof typeof SEVERITY_ICONS;
export function severityIcon(s: Severity): LucideIcon {
  return SEVERITY_ICONS[s];
}

// Presenting-complaint icons — replaces the emoji on the cockpit's Start chips
// (keyed by symptomCascade id). Best-effort clinical glyphs; a neutral dot for
// complaints without an obvious icon, so the chip row stays consistent.
const COMPLAINT_ICONS: Record<string, LucideIcon> = {
  'chest-pain': HeartPulse,
  sob: Wind,
  'abdo-pain': CircleDot,
  headache: Brain,
  fever: Thermometer,
  trauma: Ambulance,
  'pv-bleeding': Droplet,
  'reduced-loc': Activity,
  seizure: Zap,
  'joint-limb-pain': Bone,
  cough: Wind,
  'vomiting-diarrhoea': Droplet,
  psych: Brain,
};

export function complaintIcon(cascadeId: string): LucideIcon {
  return COMPLAINT_ICONS[cascadeId] ?? CircleDot;
}

// Investigation-panel icons — replaces the emoji on the Results capture panels
// and the insights clusters (keyed by PANELS id).
const PANEL_ICONS: Record<string, LucideIcon> = {
  uec: Beaker, fbc: Droplet, lft: FlaskConical, inflam: Activity, abg: Activity,
  cardiac: HeartPulse, glu: FlaskConical, tbhiv: Activity, bone: FlaskConical,
  tox: FlaskConical, msk: Activity, sepsis: Activity, psych: Brain, paeds: Baby,
};

export function panelIcon(panelId: string): LucideIcon {
  return PANEL_ICONS[panelId] ?? FlaskConical;
}
