import type { DeptFieldFragments } from '../types';

export const icuFields: DeptFieldFragments = {
  intake: d => [
    { key: 'icuDay', label: 'ICU Day', value: d.icuDay ?? '', placeholder: 'Day of ICU admission' },
    { key: 'ventilator', label: 'Ventilator', value: d.ventilator ?? '', placeholder: 'Mode / settings' },
    { key: 'lines', label: 'Lines / Drains', value: d.lines ?? '', placeholder: 'CVC, art line, IDC, drains' },
    { key: 'vasopressors', label: 'Vasopressors', value: d.vasopressors ?? '', placeholder: 'None / agent + dose' },
  ],

  assessment: {
    insertAt: 3,
    fields: d => [
      { key: 'ventSettings', label: 'Ventilation', value: d.ventSettings ?? '', hint: 'mode, FiO2, PEEP, latest ABG', placeholder: 'e.g. SIMV, FiO2 0.4, PEEP 8 — ABG: …' },
      { key: 'haemodynamics', label: 'Haemodynamics', value: d.haemodynamics ?? '', hint: 'MAP, vasopressor agents and doses, lactate', placeholder: 'MAP, pressor doses, lactate trend' },
    ],
  },
};
