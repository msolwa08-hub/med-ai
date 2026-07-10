import type { DeptFieldFragments } from '../types';

// ICU/HDU field fragments — the daily critical-care review discriminators the
// base fields don't capture. Drawn from the ICU dossier's organ-by-organ round
// (§1-2) and the SA-specific traps in §6. ventSettings/haemodynamics already
// capture today's respiratory + cardiovascular support snapshot; the fields
// below cover the remaining organ systems and cross-cutting daily-review items
// the dossier flags as commonly missed: sedation/delirium (§2.4 — hypoactive
// delirium "missed constantly"), renal support (§2.3 AEIOU), cumulative fluid
// balance as a trended investigation (§3, §4.5), line/tube necessity (§1
// FASTHUGSBID "I" — the single highest-yield VAP/CLABSI intervention), and the
// ceiling-of-care decision (§1, §6 — an undocumented "soft" limitation of care
// is a recurrent SA medico-legal risk). Hints carry the consultant's reasoning
// so the intern learns WHY each is asked, not just what to record.
export const icuFields: DeptFieldFragments = {
  intake: d => [
    { key: 'icuDay', label: 'ICU Day', value: d.icuDay ?? '', placeholder: 'Day of ICU admission' },
    { key: 'ventilator', label: 'Ventilator', value: d.ventilator ?? '', placeholder: 'Mode / settings' },
    { key: 'lines', label: 'Lines / Drains', value: d.lines ?? '', placeholder: 'CVC, art line, IDC, drains' },
    { key: 'vasopressors', label: 'Vasopressors', value: d.vasopressors ?? '', placeholder: 'None / agent + dose' },
  ],

  assessment: {
    // After General + Focused exam (index 4), before Investigations.
    insertAt: 4,
    fields: d => [
      { key: 'ventSettings', label: 'Ventilation', value: d.ventSettings ?? '', hint: 'mode, FiO2, PEEP, latest ABG', placeholder: 'e.g. SIMV, FiO2 0.4, PEEP 8 — ABG: …' },
      { key: 'haemodynamics', label: 'Haemodynamics', value: d.haemodynamics ?? '', hint: 'MAP, vasopressor agents and doses, lactate', placeholder: 'MAP, pressor doses, lactate trend' },
      {
        key: 'renalSupport',
        label: 'Renal Support (RRT)',
        value: d.renalSupport ?? '',
        hint: 'AEIOU drives the call: refractory Acidosis (pH <7.1-7.15), life-threatening Electrolytes (K+ >6.5 unresponsive), dialysable Intoxication, refractory fluid Overload, uraemic complications — not a creatinine number alone. CRRT preferred if haemodynamically unstable, IHD if stable or CRRT unavailable — know your unit\'s actual modality/capacity before promising it, CRRT slots are a common SA bottleneck',
        placeholder: 'e.g. none — creat 145, UO 0.6ml/kg/h; or CVVHDF started Day 2 for refractory hyperkalaemia',
      },
      {
        key: 'fluidBalance',
        label: 'Cumulative Fluid Balance',
        value: d.fluidBalance ?? '',
        hint: 'trend the CUMULATIVE balance, not just today\'s — aim even-to-negative once the first 24-48h resuscitation phase is over and shock has resolved. A persistently positive balance predicts worse respiratory and renal outcomes and should trigger an active de-resuscitation plan (diuresis/ultrafiltration), not passive continuation of maintenance fluids and drug-carrier volumes',
        placeholder: 'e.g. Day 1 +3.2L (resuscitation) → Day 3 +1.8L cumulative — start diuresis',
      },
      {
        key: 'sedationDelirium',
        label: 'Sedation (RASS) & Delirium (CAM-ICU)',
        value: d.sedationDelirium ?? '',
        kind: 'textarea',
        hint: 'target RASS 0 to -2 unless a specific indication for deeper sedation (proning, status epilepticus, raised-ICP management, severe dyssynchrony) — deep/prolonged sedation lengthens ventilation and worsens delirium. Screen CAM-ICU at least once/shift, only interpretable at RASS ≥-3. Hypoactive delirium ("quiet, withdrawn, staring") is missed constantly in ventilated patients — screen proactively, don\'t wait for agitation',
        placeholder: 'e.g. RASS -1, CAM-ICU negative; or RASS -4 (deep sedation, propofol wean planned, not assessable)',
      },
      {
        key: 'linesReview',
        label: 'Lines / Tubes — Days In Situ & Still Needed?',
        value: d.linesReview ?? '',
        kind: 'textarea',
        hint: 'the daily FASTHUGSBID "I" — the single highest-yield VAP/CLABSI/CAUTI intervention is removing devices that are no longer necessary. Record each device + day count; a device without an active indication TODAY comes out today, not "on the next round"',
        placeholder: 'e.g. CVC (R IJ) day 4 — still needed for pressors; IDC day 6 — still needed for hourly output; ETT day 2',
      },
      {
        key: 'ceilingOfCare',
        label: 'Ceiling of Care / Resuscitation Status',
        value: d.ceilingOfCare ?? '',
        kind: 'textarea',
        hint: 'set explicitly and document — full escalation vs ward-level vs comfort care — rather than drifting into open-ended escalation by default. A "trial of ICU" with a pre-agreed review point (typically 48-72h) against a stated reversibility marker (lactate clearance, pressor trend, oxygenation trend) is a legitimate structure. An undocumented, verbal-only "soft" limitation of care is a recurrent SA medico-legal and clinical-governance risk — revisit and re-date as the trajectory clarifies',
        placeholder: 'e.g. full escalation, family aware; trial of ICU to 72h review against lactate clearance; or ward-level ceiling, palliative input requested',
      },
    ],
  },
};
