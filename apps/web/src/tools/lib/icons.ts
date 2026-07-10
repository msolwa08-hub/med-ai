import {
  Stethoscope, Scissors, Venus, Baby, Activity, Siren, Brain, Bone, Syringe,
  Ban, TriangleAlert, HeartPulse, type LucideIcon,
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
