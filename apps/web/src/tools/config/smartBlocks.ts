// ─── Smart blocks ────────────────────────────────────────────────────────────
// THE OMNI-DIRECTIVE: condition-, risk- and lab-triggered granular blocks,
// aligned to the SA Standard Treatment Guidelines. When the record text
// mentions a trigger (regex), the matching block surfaces inline with
// structured fields — toggles, selects, numbers, dates — so the intern
// captures the exact operational detail a consultant will ask for
// ("HOW MANY lights?", "WHICH dose is she on?"). Selections serialize back
// into the record's string fields; the block is an input method, not a
// separate data model.

export interface SmartField {
  id: string;
  label: string;
  kind: 'toggle' | 'select' | 'number' | 'date' | 'text-short';
  options?: string[];
  /** Show only when another field has this value (toggle: boolean, select: option string). */
  showIf?: { fieldId: string; equals: string | boolean };
  /** Visual medication-recall cue (e.g. "Blue tablet" for TLD). */
  cue?: { color: string; label: string };
  /** Unit suffix for number fields, purely presentational. */
  unit?: string;
}

export interface SmartBlock {
  id: string;
  title: string;
  /** Matched against the combined record text (intake + history + assessment). */
  pattern: RegExp;
  why: string;
  fields: SmartField[];
}

/** fieldId → value. Toggles are boolean; everything else is string. */
export type SmartBlockState = Record<string, string | boolean | undefined>;

export function smartBlocksFor(recordText: string): SmartBlock[] {
  if (!recordText.trim()) return [];
  return SMART_BLOCKS.filter(b => b.pattern.test(recordText));
}

export function fieldVisible(field: SmartField, state: SmartBlockState): boolean {
  if (!field.showIf) return true;
  return state[field.showIf.fieldId] === field.showIf.equals;
}

/** Serialize answered fields to clinical shorthand, e.g.
 *  "Neonatal jaundice: phototherapy yes (2 lights), TSB 280, 36h of life". */
export function serializeSmartBlock(block: SmartBlock, state: SmartBlockState, customNote?: string): string {
  const parts: string[] = [];
  for (const f of block.fields) {
    if (!fieldVisible(f, state)) continue;
    const v = state[f.id];
    if (v === undefined || v === '') continue;
    if (f.kind === 'toggle') {
      parts.push(`${f.label}: ${v ? 'yes' : 'no'}`);
    } else if (f.kind === 'number') {
      parts.push(`${f.label} ${v}${f.unit ? ` ${f.unit}` : ''}`);
    } else {
      parts.push(`${f.label}: ${v}`);
    }
  }
  if (customNote?.trim()) parts.push(customNote.trim());
  if (parts.length === 0) return '';
  return `${block.title} — ${parts.join('; ')}`;
}

// ── Registry ─────────────────────────────────────────────────────────────────

export const SMART_BLOCKS: SmartBlock[] = [
  {
    id: 'neonatal-jaundice',
    title: 'Neonatal jaundice',
    pattern: /jaundice|hyperbilirubin|TSB|phototherapy/i,
    why: 'Management hinges on TSB plotted against hours of life — and "on phototherapy" is meaningless without knowing how many lights and whether exchange criteria are close.',
    fields: [
      { id: 'photo', label: 'Phototherapy?', kind: 'toggle' },
      { id: 'lights', label: 'How many lights?', kind: 'select', options: ['1', '2', '3', 'intensive'], showIf: { fieldId: 'photo', equals: true } },
      { id: 'tsb', label: 'Latest TSB', kind: 'number', unit: 'µmol/L' },
      { id: 'hol', label: 'Hours of life at TSB', kind: 'number', unit: 'h' },
      { id: 'exchange', label: 'Approaching exchange criteria?', kind: 'toggle' },
      { id: 'coombs', label: 'Coombs / blood group sent?', kind: 'toggle' },
    ],
  },
  {
    id: 'syphilis-rpr',
    title: 'Syphilis (RPR positive)',
    pattern: /RPR|syphilis|VDRL/i,
    why: 'An RPR+ mother needs 3 weekly benzathine penicillin doses ≥4 weeks before delivery to count as adequately treated — dates and dose count decide whether the baby needs treatment.',
    fields: [
      { id: 'penicillin', label: 'Benzathine penicillin given?', kind: 'toggle' },
      { id: 'pen-date', label: 'Date last dose administered', kind: 'date', showIf: { fieldId: 'penicillin', equals: true } },
      { id: 'pen-doses', label: 'Doses completed', kind: 'select', options: ['1', '2', '3'], showIf: { fieldId: 'penicillin', equals: true } },
      { id: 'partner', label: 'Partner treated?', kind: 'toggle' },
      { id: 'titre', label: 'RPR titre (1:n)', kind: 'number' },
    ],
  },
  {
    id: 'pprom-ptl',
    title: 'PPROM / preterm labour',
    pattern: /PPROM|PROM|preterm labour|preterm labor|\bPTL\b|threatened preterm/i,
    why: 'Antenatal corticosteroids before 34w are the single biggest survival intervention for the preterm baby; MgSO4 <32w protects the brain. Doses and timing must be explicit.',
    fields: [
      { id: 'steroid', label: 'Corticosteroids administered', kind: 'select', options: ['Betamethasone', 'Dexamethasone', 'None'] },
      { id: 'steroid-doses', label: 'Doses given', kind: 'select', options: ['1 of 2', '2 of 2 (complete)', '1 of 4', '2 of 4', '3 of 4', '4 of 4 (complete)'], showIf: { fieldId: 'steroid', equals: 'Betamethasone' } },
      { id: 'steroid-doses-dex', label: 'Doses given', kind: 'select', options: ['1 of 4', '2 of 4', '3 of 4', '4 of 4 (complete)'], showIf: { fieldId: 'steroid', equals: 'Dexamethasone' } },
      { id: 'gestation', label: 'Gestation', kind: 'text-short' },
      { id: 'mgso4', label: 'MgSO4 neuroprotection (if <32w)?', kind: 'toggle' },
      { id: 'abx', label: 'GBS cover / erythromycin started?', kind: 'toggle' },
    ],
  },
  {
    id: 'hiv-art',
    title: 'HIV / ART',
    pattern: /HIV\s*(pos|positive|\+)|\bART\b|\bTLD\b|tenofovir|dolutegravir|RVD/i,
    why: 'Viral load and adherence decide everything downstream — an undetectable patient on TLD is a different patient from a defaulter with unknown VL.',
    fields: [
      { id: 'tld', label: 'On TLD?', kind: 'toggle', cue: { color: 'blue', label: 'Blue tablet' } },
      { id: 'vl-date', label: 'Last VL date', kind: 'date' },
      { id: 'vl-result', label: 'Last VL result', kind: 'text-short' },
      { id: 'dx-date', label: 'HIV diagnosis date (year)', kind: 'text-short' },
      { id: 'clinic', label: 'Base clinic', kind: 'text-short' },
      { id: 'defaulted', label: 'Defaulted treatment?', kind: 'toggle' },
      { id: 'default-when', label: 'When / how long?', kind: 'text-short', showIf: { fieldId: 'defaulted', equals: true } },
    ],
  },
  {
    id: 't2dm-insulin',
    title: 'Diabetes — insulin regimen',
    pattern: /insulin|\bT2DM\b|\bT1DM\b|diabet|actraphane|protophane|biphasic/i,
    why: 'The consultant will ask the exact units, meal by meal. "On insulin" without the numbers means the regimen cannot be continued or adjusted safely.',
    fields: [
      { id: 'morning', label: 'Morning', kind: 'number', unit: 'units' },
      { id: 'lunch', label: 'Lunch', kind: 'number', unit: 'units' },
      { id: 'dinner', label: 'Dinner', kind: 'number', unit: 'units' },
      { id: 'night', label: 'Night (basal)', kind: 'number', unit: 'units' },
      { id: 'premix', label: 'On premix (biphasic) instead?', kind: 'toggle' },
      { id: 'premix-doses', label: 'Premix doses (am/pm units)', kind: 'text-short', showIf: { fieldId: 'premix', equals: true } },
      { id: 'hba1c', label: 'Last HbA1c', kind: 'number', unit: '%' },
    ],
  },
  {
    id: 'banc-supplements',
    title: 'BANC supplements & logistics',
    pattern: /antenatal|BANC|\bANC\b|pregnan|gravida|booking/i,
    why: 'Supplement adherence is asked by colour because that is how patients know their tablets; visit count and booking date expose the unbooked or late-booked pregnancy.',
    fields: [
      { id: 'feso4', label: 'Taking iron (FeSO4)?', kind: 'toggle', cue: { color: 'red/brown', label: 'Red/brown blood tablet' } },
      { id: 'folate', label: 'Taking folic acid?', kind: 'toggle', cue: { color: 'yellow', label: 'Small yellow tablet' } },
      { id: 'calcium', label: 'Taking calcium?', kind: 'toggle', cue: { color: 'white', label: 'Large white tablet' } },
      { id: 'visits', label: 'Total ANC visits', kind: 'number' },
      { id: 'booking-date', label: 'Booking date', kind: 'date' },
      { id: 'unbooked', label: 'Unbooked?', kind: 'toggle' },
    ],
  },
  {
    id: 'tb-treatment',
    title: 'TB treatment',
    pattern: /\bTB\b|tuberculosis|rifampicin|GeneXpert|\bRHZE\b|\bATT\b/i,
    why: 'Phase and start date determine the regimen and pill burden today; the last smear/GeneXpert tells you if treatment is working or resistance looms.',
    fields: [
      { id: 'phase', label: 'Phase', kind: 'select', options: ['Intensive (RHZE)', 'Continuation (RH)'] },
      { id: 'start', label: 'Treatment start date', kind: 'date' },
      { id: 'dot', label: 'DOT supporter at home?', kind: 'toggle' },
      { id: 'smear', label: 'Last smear/GeneXpert result', kind: 'text-short' },
      { id: 'defaulted', label: 'Previously defaulted TB treatment?', kind: 'toggle' },
    ],
  },
  {
    id: 'warfarin',
    title: 'Warfarin',
    pattern: /warfarin|\bINR\b/i,
    why: 'Warfarin without a recent INR is a bleeding or clotting event waiting to happen — indication and target range decide what "therapeutic" even means.',
    fields: [
      { id: 'indication', label: 'Indication', kind: 'select', options: ['AF', 'Mechanical valve', 'DVT/PE', 'Other'] },
      { id: 'inr', label: 'Last INR', kind: 'number' },
      { id: 'inr-date', label: 'INR date', kind: 'date' },
      { id: 'target', label: 'Target range', kind: 'select', options: ['2.0-3.0', '2.5-3.5'] },
    ],
  },
  {
    id: 'epilepsy',
    title: 'Epilepsy',
    pattern: /epilep|seizure|convuls|valproate|lamotrigine|carbamazepine|phenytoin/i,
    why: 'Drug, last seizure and adherence triage the breakthrough seizure: missed doses need adherence support, true breakthrough on therapy needs escalation.',
    fields: [
      { id: 'drug', label: 'Antiepileptic', kind: 'select', options: ['Valproate', 'Lamotrigine', 'Carbamazepine', 'Phenytoin', 'Phenobarbitone', 'Levetiracetam', 'Other'] },
      { id: 'last-seizure', label: 'Last seizure date', kind: 'date' },
      { id: 'adherent', label: 'Adherent to AEDs?', kind: 'toggle' },
      { id: 'missed-why', label: 'Why missed?', kind: 'text-short', showIf: { fieldId: 'adherent', equals: false } },
    ],
  },
  {
    id: 'asthma-copd',
    title: 'Asthma / COPD',
    pattern: /asthma|COPD|inhaler|salbutamol|budesonide|wheez/i,
    why: 'Reliever overuse (>2 canisters/yr or daily use) and a previous ICU admission are the two strongest predictors of asthma death — technique failure masquerades as treatment failure.',
    fields: [
      { id: 'technique', label: 'Inhaler technique checked?', kind: 'toggle' },
      { id: 'controller', label: 'Controller use', kind: 'number', unit: 'doses/wk' },
      { id: 'reliever', label: 'Reliever use', kind: 'number', unit: 'doses/wk' },
      { id: 'icu', label: 'Previous ICU admission for asthma?', kind: 'toggle' },
      { id: 'smoker', label: 'Current smoker?', kind: 'toggle' },
    ],
  },
  {
    id: 'anaemia-pregnancy',
    title: 'Anaemia in pregnancy',
    pattern: /an(a)?emia|low (Hb|h(a)?emoglobin)|\bHb\s*[<0-9]/i,
    why: 'Hb <8 near term changes delivery planning; the treatment dose (not the prophylactic BANC dose) and a transfusion trigger must be explicit.',
    fields: [
      { id: 'hb', label: 'Latest Hb', kind: 'number', unit: 'g/dL' },
      { id: 'dose', label: 'On treatment dose', kind: 'select', options: ['FeSO4 200mg tds (treatment)', 'FeSO4 prophylactic only', 'Parenteral iron', 'None'] },
      { id: 'transfusion-note', label: 'Transfusion trigger / plan', kind: 'text-short' },
    ],
  },
  {
    id: 'hypertension',
    title: 'Hypertension',
    pattern: /hypertens|\bHPT\b|\bHTN\b|amlodipine|enalapril|\bBP\s*\d{2,3}\//i,
    why: 'Booking/baseline BP vs today separates chronic hypertension from an acute rise — in pregnancy that is the difference between chronic HPT and pre-eclampsia.',
    fields: [
      { id: 'meds', label: 'Current agents', kind: 'select', options: ['HCTZ', 'Amlodipine', 'Enalapril', 'HCTZ + amlodipine', 'HCTZ + amlodipine + enalapril', 'Methyldopa', 'Nifedipine', 'Other/combination'] },
      { id: 'bp-baseline', label: 'Booking/baseline BP', kind: 'text-short' },
      { id: 'bp-today', label: 'BP today', kind: 'text-short' },
      { id: 'adherent', label: 'Taking medication?', kind: 'toggle' },
    ],
  },
  {
    id: 'gdm',
    title: 'Gestational diabetes',
    pattern: /GDM|gestational diabet|OGTT|glucose tolerance/i,
    why: 'The OGTT values decide diet vs insulin; the modality decides fetal surveillance intensity and delivery timing.',
    fields: [
      { id: 'ogtt-fasting', label: 'OGTT fasting', kind: 'number', unit: 'mmol/L' },
      { id: 'ogtt-2h', label: 'OGTT 2h', kind: 'number', unit: 'mmol/L' },
      { id: 'modality', label: 'Control', kind: 'select', options: ['Diet-controlled', 'Metformin', 'Insulin'] },
      { id: 'insulin-doses', label: 'Insulin doses', kind: 'text-short', showIf: { fieldId: 'modality', equals: 'Insulin' } },
    ],
  },
  {
    id: 'previous-cs',
    title: 'Previous Caesarean section',
    pattern: /previous (C\/?S|c(a)?esar)|\bprev C\/?S\b|\bC\/S x|VBAC/i,
    why: 'The number of previous sections and the original indication determine whether VBAC is even on the table — and that counselling must be documented.',
    fields: [
      { id: 'count', label: 'Number of previous C/S', kind: 'select', options: ['1', '2', '3+'] },
      { id: 'indication', label: 'Indication for previous C/S', kind: 'text-short' },
      { id: 'vbac', label: 'VBAC counselled?', kind: 'toggle' },
    ],
  },
  {
    id: 'rheumatic-heart',
    title: 'Rheumatic heart disease — penicillin prophylaxis',
    pattern: /rheumatic|\bRHD\b|mitral (stenosis|regurg)/i,
    why: 'Monthly benzathine penicillin is what stands between an RHD patient and progressive valve destruction — a missed injection is a clinical event.',
    fields: [
      { id: 'uptodate', label: 'Monthly benzathine penicillin up to date?', kind: 'toggle' },
      { id: 'last-date', label: 'Last injection date', kind: 'date', showIf: { fieldId: 'uptodate', equals: true } },
      { id: 'missed-since', label: 'Missed since', kind: 'text-short', showIf: { fieldId: 'uptodate', equals: false } },
    ],
  },
  {
    id: 'ckd',
    title: 'Chronic kidney disease',
    pattern: /\bCKD\b|renal (failure|impairment)|creatinine|\beGFR\b|dialysis/i,
    why: 'The eGFR gates almost every drug dose on the chart (enoxaparin, metformin, aminoglycosides) — and dialysis status changes fluid and potassium rules entirely.',
    fields: [
      { id: 'egfr', label: 'Latest eGFR', kind: 'number', unit: 'mL/min' },
      { id: 'baseline-cr', label: 'Baseline creatinine', kind: 'number', unit: 'µmol/L' },
      { id: 'dialysis', label: 'On dialysis?', kind: 'toggle' },
      { id: 'dialysis-days', label: 'Dialysis days', kind: 'text-short', showIf: { fieldId: 'dialysis', equals: true } },
      { id: 'nephrotoxics', label: 'Nephrotoxics stopped/adjusted?', kind: 'toggle' },
    ],
  },
  {
    id: 'stroke-af',
    title: 'Atrial fibrillation / stroke prevention',
    pattern: /atrial fib|\bAF\b|irregularly irregular/i,
    why: 'Every AF patient needs a documented stroke-risk decision — anticoagulated, declined, or contraindicated. Silence on this line is the commonest audit failure.',
    fields: [
      { id: 'anticoag', label: 'Anticoagulated?', kind: 'toggle' },
      { id: 'agent', label: 'Agent', kind: 'select', options: ['Warfarin', 'Rivaroxaban', 'Dabigatran', 'None — contraindicated', 'None — declined'], showIf: { fieldId: 'anticoag', equals: true } },
      { id: 'rate-agent', label: 'Rate control', kind: 'select', options: ['Bisoprolol/atenolol', 'Digoxin', 'Diltiazem/verapamil', 'None'] },
    ],
  },
];
