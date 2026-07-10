// ─── Smart blocks ────────────────────────────────────────────────────────────
// THE OMNI-DIRECTIVE: condition-, risk- and lab-triggered granular blocks,
// aligned to the SA Standard Treatment Guidelines. When the record text
// mentions a trigger (regex), the matching block surfaces inline with
// structured fields — toggles, selects, numbers, dates — so the intern
// captures the exact operational detail a consultant will ask for
// ("HOW MANY lights?", "WHICH dose is she on?"). Selections serialize back
// into the record's string fields; the block is an input method, not a
// separate data model.

import type { DeptId } from './departments';

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
  /** Restrict the block to these departments; omit = surfaces everywhere. */
  depts?: DeptId[];
}

/** fieldId → value. Toggles are boolean; everything else is string. */
export type SmartBlockState = Record<string, string | boolean | undefined>;

export function smartBlocksFor(recordText: string, dept?: DeptId): SmartBlock[] {
  if (!recordText.trim()) return [];
  return SMART_BLOCKS.filter(
    b => (!b.depts || !dept || b.depts.includes(dept)) && b.pattern.test(recordText),
  );
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
    // Medicine/emergency run the deeper hiv-art-status block (CD4, cotrimoxazole,
    // TB history) instead — this clinic-framed one stays for the other wards.
    depts: ['og', 'paeds', 'surgery', 'ortho', 'psych', 'icu'],
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

  // ── Internal Medicine ────────────────────────────────────────────────────

  {
    id: 'dm-control',
    title: 'Diabetes — control & complications',
    pattern: /diabet|\bDM\b|\bT[12]DM\b|HbA1c|insulin|metformin|glicl?azide|sulf(ph)?onylurea/i,
    depts: ['medicine', 'emergency'],
    why: 'Type and regimen frame the emergency — insulin omission in T1DM is DKA, the elderly T2DM drifts into HHS, and sulfonylurea hypoglycaemia recurs (admit, don\'t discharge on one dextrose). HbA1c plus the complication screen turns "known diabetic" into an actual risk profile.',
    fields: [
      { id: 'type', label: 'Type', kind: 'select', options: ['Type 1', 'Type 2'] },
      { id: 'rx', label: 'Current treatment', kind: 'select', options: ['Metformin', 'Metformin + sulfonylurea', 'Insulin', 'Insulin + oral', 'Diet only'] },
      { id: 'hba1c', label: 'Last HbA1c', kind: 'number', unit: '%' },
      { id: 'adherent', label: 'Taking treatment as prescribed?', kind: 'toggle' },
      { id: 'missed-why', label: 'Why missed?', kind: 'text-short', showIf: { fieldId: 'adherent', equals: false } },
      { id: 'hypos', label: 'Hypo episodes', kind: 'select', options: ['None', 'Occasional (<1/wk)', 'Frequent (≥1/wk)', 'Severe (needed help/admission)'] },
      { id: 'retinopathy', label: 'Retinopathy / eye screen done?', kind: 'toggle' },
      { id: 'nephropathy', label: 'Nephropathy (proteinuria / ↑creatinine)?', kind: 'toggle' },
      { id: 'neuropathy', label: 'Neuropathy?', kind: 'toggle' },
      { id: 'foot', label: 'Foot exam done (ulcer / at-risk foot)?', kind: 'toggle' },
    ],
  },
  {
    id: 'hiv-art-status',
    title: 'HIV / ART status',
    pattern: /\bHIV\b|\bART\b|\bCD4\b|viral load|\bVL\b|\bRVD\b/i,
    depts: ['medicine', 'emergency'],
    why: 'CD4 <200 is advanced HIV disease — reflex CrAg at ≤100, urine LAM in the sick inpatient, cotrimoxazole prophylaxis; the four AHD killers are TB, cryptococcal meningitis, severe bacterial infection and PJP. An interrupted-TLD patient with unknown VL is a different differential from the suppressed one.',
    fields: [
      { id: 'on-art', label: 'On ART?', kind: 'toggle' },
      { id: 'regimen', label: 'Regimen', kind: 'select', options: ['TLD', 'TEE', '2nd line (PI-based)', 'Other/unknown'], showIf: { fieldId: 'on-art', equals: true }, cue: { color: 'blue', label: 'TLD is the blue tablet' } },
      { id: 'duration', label: 'Duration on ART / interruptions', kind: 'text-short', showIf: { fieldId: 'on-art', equals: true } },
      { id: 'vl', label: 'Last VL result', kind: 'text-short' },
      { id: 'vl-date', label: 'Last VL date', kind: 'date' },
      { id: 'cd4', label: 'Last CD4', kind: 'number', unit: 'cells/µL' },
      { id: 'cd4-date', label: 'CD4 date', kind: 'date' },
      { id: 'ctx', label: 'On cotrimoxazole prophylaxis?', kind: 'toggle' },
      { id: 'tb-hx', label: 'TB history', kind: 'select', options: ['None', 'On TPT/IPT', 'Previous TB (completed)', 'Currently on TB treatment'] },
    ],
  },
  {
    id: 'tb-workup',
    title: 'TB workup',
    pattern: /\bTB\b|tuberculos|\bPTB\b|GeneXpert|Xpert|night sweats|cough[^.\n]{0,24}(week|\/52)/i,
    depts: ['medicine', 'emergency'],
    why: 'Xpert Ultra is the initial test and a rifampicin-resistant call changes the entire pathway; urine LAM catches the disseminated TB the sputum misses in the sick low-CD4 inpatient. Prior default or MDR contact predicts resistance before the lab does — and TB is notifiable.',
    fields: [
      { id: 'sx-cough', label: 'Cough ≥2 weeks?', kind: 'toggle' },
      { id: 'sx-fever', label: 'Fever?', kind: 'toggle' },
      { id: 'sx-sweats', label: 'Night sweats?', kind: 'toggle' },
      { id: 'sx-weight', label: 'Weight loss?', kind: 'toggle' },
      { id: 'xpert-sent', label: 'Sputum GeneXpert sent?', kind: 'toggle' },
      { id: 'xpert-result', label: 'Result', kind: 'select', options: ['Pending', 'MTB not detected', 'MTB detected, RIF sensitive', 'MTB detected, RIF resistant', 'Trace'], showIf: { fieldId: 'xpert-sent', equals: true } },
      { id: 'lam', label: 'Urine LAM sent (HIV+, CD4 ≤200 or seriously ill)?', kind: 'toggle' },
      { id: 'cxr', label: 'CXR done?', kind: 'toggle' },
      { id: 'prior-tb', label: 'Prior TB', kind: 'select', options: ['None', 'Completed treatment', 'Defaulted', 'MDR/DR-TB contact'] },
    ],
  },
  {
    id: 'heart-failure-profile',
    title: 'Heart failure profile',
    pattern: /heart failure|cardiac failure|\bCCF\b|\bCHF\b|orthopn|\bPND\b|pulmonary (o)?edema|\bLVF\b/i,
    depts: ['medicine', 'emergency'],
    why: 'A decompensation without a named precipitant (ischaemia, infection, non-adherence, arrhythmia, anaemia) simply recurs; daily weights are the only honest measure of diuresis. Beware "cardiac asthma" — LVF wheeze masquerading as bronchospasm, with the opposite treatment.',
    fields: [
      { id: 'nyha', label: 'NYHA class', kind: 'select', options: ['I', 'II', 'III', 'IV'] },
      { id: 'ef', label: 'Known EF', kind: 'number', unit: '%' },
      { id: 'echo-date', label: 'Echo date', kind: 'date' },
      { id: 'weights', label: 'Daily weights charted?', kind: 'toggle' },
      { id: 'fluid-salt', label: 'Fluid restriction + salt advice given?', kind: 'toggle' },
      { id: 'diuretic-adherent', label: 'Taking diuretic as prescribed?', kind: 'toggle' },
      { id: 'precipitant', label: 'Precipitant', kind: 'select', options: ['Ischaemia', 'Infection', 'Non-adherence', 'Arrhythmia', 'Anaemia', 'Unknown'] },
    ],
  },

  // ── Surgery ──────────────────────────────────────────────────────────────

  {
    id: 'post-op-review',
    title: 'Post-operative review',
    pattern: /post-?op(erative)?|day \d+ post|post-?surgery review/i,
    depts: ['surgery'],
    why: 'Tachycardia precedes peritonism — a structured daily review (day, wound, drains, bowels, mobility, VTE prophylaxis) catches the leak or bleed on the trend before it becomes the crisis, and is exactly what the consultant asks for on the ward round.',
    fields: [
      { id: 'pod', label: 'Post-op day', kind: 'number', unit: 'POD' },
      { id: 'procedure', label: 'Procedure performed', kind: 'text-short' },
      { id: 'wound', label: 'Wound', kind: 'select', options: ['Clean, dry, intact', 'Erythema', 'Discharge', 'Dehiscence'] },
      { id: 'drain', label: 'Drain present?', kind: 'toggle' },
      { id: 'drain-character', label: 'Drain character', kind: 'select', options: ['Serous', 'Sanguineous', 'Bilious', 'Faeculent/turbid', 'Chylous', 'None'], showIf: { fieldId: 'drain', equals: true } },
      { id: 'drain-volume', label: 'Drain output', kind: 'number', unit: 'ml/24h', showIf: { fieldId: 'drain', equals: true } },
      { id: 'bowels', label: 'Bowels/flatus passing?', kind: 'toggle' },
      { id: 'mobilising', label: 'Mobilising', kind: 'select', options: ['Bed-bound', 'Sitting out', 'Walking with help', 'Walking independently'] },
      { id: 'vte-given', label: 'VTE prophylaxis given today?', kind: 'toggle' },
      { id: 'pain-controlled', label: 'Pain adequately controlled?', kind: 'toggle' },
      { id: 'hr-trend', label: 'HR trend since yesterday', kind: 'select', options: ['Stable/improving', 'Rising — unexplained'] },
    ],
  },
  {
    id: 'anticoag-bridging',
    title: 'Peri-operative anticoagulation / bridging',
    pattern: /anticoagulat|bridging|warfarin.*(surgery|theatre|operat)|\bDOAC\b|rivaroxaban|apixaban|dabigatran/i,
    depts: ['surgery'],
    why: 'Stop/bridge decisions are indication- and bleeding-risk-specific — a mechanical valve or recent VTE needs LMWH bridging, AF alone often just pauses the DOAC. Getting this wrong bleeds the patient in theatre or clots them on the ward.',
    fields: [
      { id: 'agent', label: 'Agent', kind: 'select', options: ['Warfarin', 'Rivaroxaban', 'Apixaban', 'Dabigatran', 'Enoxaparin (therapeutic)', 'Other'] },
      { id: 'indication', label: 'Indication', kind: 'select', options: ['AF', 'Mechanical valve', 'Recent VTE (<3 months)', 'Prior VTE (>3 months)', 'Other'] },
      { id: 'bridging-plan', label: 'Bridging plan', kind: 'select', options: ['Bridge with therapeutic LMWH', 'Pause only, no bridge', 'Continue through surgery', 'Not yet decided'] },
      { id: 'last-dose', label: 'Last dose taken', kind: 'date' },
      { id: 'inr', label: 'Last INR (if warfarin)', kind: 'number', showIf: { fieldId: 'agent', equals: 'Warfarin' } },
      { id: 'restart-plan', label: 'Planned restart time post-op', kind: 'text-short' },
    ],
  },

  // ── Emergency ────────────────────────────────────────────────────────────

  {
    id: 'sats-triage',
    title: 'SATS / triage vitals',
    pattern: /\bSATS\b|\bTEWS\b|triage(d)?|triage colour|triage color/i,
    depts: ['emergency'],
    why: 'SATS is the mandated national triage instrument — priority is the HIGHER of the TEWS band or a clinical discriminator, and a re-triage in the waiting room is a safety event, not paperwork. The colour and the time-to-be-seen target are what the record must show.',
    fields: [
      { id: 'tews-score', label: 'TEWS total', kind: 'number' },
      { id: 'colour', label: 'Triage colour', kind: 'select', options: ['Red (immediate)', 'Orange (<10 min)', 'Yellow (<60 min)', 'Green (<240 min)', 'Blue (no vital signs)'] },
      { id: 'discriminator', label: 'Clinical discriminator overriding TEWS?', kind: 'toggle' },
      { id: 'discriminator-what', label: 'Which discriminator?', kind: 'text-short', showIf: { fieldId: 'discriminator', equals: true } },
      { id: 'avpu', label: 'AVPU', kind: 'select', options: ['Alert', 'Voice', 'Pain', 'Unresponsive'] },
      { id: 'time-triaged', label: 'Time triaged', kind: 'text-short' },
      { id: 'retriaged', label: 'Re-triaged while waiting?', kind: 'toggle' },
    ],
  },
  {
    id: 'gcs',
    title: 'Glasgow Coma Scale',
    pattern: /\bGCS\b|reduced (consciousness|conscious level)|altered (mental status|mentation)|glasgow coma/i,
    depts: ['emergency'],
    why: 'Report the components, not just the total — the Motor score is the most prognostic, and GCS ≤8 is the airway-protection threshold. "GCS 10" without E/V/M tells the next clinician nothing about what actually changed.',
    fields: [
      { id: 'eye', label: 'Eye (E)', kind: 'select', options: ['4 — spontaneous', '3 — to voice', '2 — to pain', '1 — none'] },
      { id: 'verbal', label: 'Verbal (V)', kind: 'select', options: ['5 — oriented', '4 — confused', '3 — inappropriate words', '2 — sounds', '1 — none'] },
      { id: 'motor', label: 'Motor (M)', kind: 'select', options: ['6 — obeys', '5 — localises', '4 — withdraws', '3 — abnormal flexion', '2 — extension', '1 — none'] },
      { id: 'total', label: 'GCS total (/15)', kind: 'number' },
      { id: 'pupils', label: 'Pupils', kind: 'select', options: ['Equal and reactive', 'Unequal', 'Fixed and dilated', 'Pinpoint'] },
      { id: 'intubate', label: 'Airway protection needed (GCS ≤8)?', kind: 'toggle' },
    ],
  },

  // ── ICU / Critical Care (dossier: docs/clinical-build/research/icu.md) ───
  // Base free-text fields (ventilator, vasopressors, lines, ventSettings,
  // haemodynamics) already exist on the ICU clerking form
  // (fields/departments/icu.ts) — these blocks add the structured, granular
  // daily-review layer the FASTHUGSBID/organ-by-organ round actually needs.

  {
    id: 'icu-organ-support',
    title: 'Organ support review',
    pattern: /\bICU\b|intensive care|critical care|ventilat|intubat|vasopressor|noradrenaline|\bRRT\b|\bCRRT\b/i,
    depts: ['icu'],
    why: 'The organ-by-organ round (resp → CVS → renal) is the operating system of an ICU day — "on a ventilator" and "on a pressor" are meaningless to the next clinician without the mode/settings and the agent/dose that actually define today\'s support level.',
    fields: [
      { id: 'ventilated', label: 'Mechanically ventilated?', kind: 'toggle' },
      { id: 'vent-mode', label: 'Ventilator mode', kind: 'select', options: ['Volume control', 'Pressure control', 'Pressure support/SIMV', 'APRV', 'NIV (BiPAP/CPAP)', 'HFNO'], showIf: { fieldId: 'ventilated', equals: true } },
      { id: 'fio2', label: 'FiO2', kind: 'number', unit: '%', showIf: { fieldId: 'ventilated', equals: true } },
      { id: 'peep', label: 'PEEP', kind: 'number', unit: 'cmH2O', showIf: { fieldId: 'ventilated', equals: true } },
      { id: 'plateau', label: 'Plateau pressure', kind: 'number', unit: 'cmH2O', showIf: { fieldId: 'ventilated', equals: true } },
      { id: 'on-vasopressor', label: 'On vasopressor/inotrope?', kind: 'toggle' },
      { id: 'vasopressor-agent', label: 'Agent', kind: 'select', options: ['Noradrenaline', 'Adrenaline', 'Vasopressin add-on', 'Dobutamine', 'Combination'], showIf: { fieldId: 'on-vasopressor', equals: true } },
      { id: 'vasopressor-dose', label: 'Dose', kind: 'text-short', showIf: { fieldId: 'on-vasopressor', equals: true } },
      { id: 'on-rrt', label: 'On RRT?', kind: 'toggle' },
      { id: 'rrt-modality', label: 'Modality', kind: 'select', options: ['CRRT/CVVHDF', 'Intermittent haemodialysis', 'Not today'], showIf: { fieldId: 'on-rrt', equals: true } },
      { id: 'rass-target', label: 'Sedation target (RASS)', kind: 'select', options: ['0', '-1', '-2', '-3 (specific indication)', '-4/-5 (specific indication)'] },
      { id: 'lines-days', label: 'Lines + insertion day', kind: 'text-short' },
    ],
  },
  {
    id: 'icu-fluid-haemodynamics',
    title: 'Fluid balance & haemodynamics',
    pattern: /fluid balance|cumulative (fluid )?balance|haemodynamic|hemodynamic|\bMAP\b|lactate|urine output|fluid[- ]respons/i,
    depts: ['icu'],
    why: 'Static numbers (a single CVP, a single lactate) mislead — the trend and a dynamic fluid-responsiveness test decide whether the next litre helps or drowns the lung; a persistently positive cumulative balance beyond 48h is itself a trended investigation predicting worse outcomes.',
    fields: [
      { id: 'map', label: 'MAP', kind: 'number', unit: 'mmHg' },
      { id: 'map-target', label: 'MAP target', kind: 'select', options: ['65', '80-85 (chronic hypertensive)', 'Other'] },
      { id: 'balance-phase', label: 'Resuscitation phase', kind: 'select', options: ['Acute resuscitation (<48h)', 'De-resuscitation phase'] },
      { id: 'cum-balance', label: 'Cumulative fluid balance', kind: 'number', unit: 'mL' },
      { id: 'daily-weight', label: 'Daily weight charted?', kind: 'toggle' },
      { id: 'lactate', label: 'Latest lactate', kind: 'number', unit: 'mmol/L' },
      { id: 'lactate-clearing', label: 'Lactate clearance ≥10-20% over 2h?', kind: 'toggle' },
      { id: 'fluid-responsive-test', label: 'Fluid-responsiveness test used', kind: 'select', options: ['Passive leg raise', 'PPV/SVV (ventilated + sedated + sinus + TV ≥8ml/kg only)', 'IVC ultrasound', 'Not assessed'] },
      { id: 'urine-output', label: 'Urine output', kind: 'number', unit: 'mL/kg/h' },
    ],
  },
  {
    id: 'icu-sedation-delirium',
    title: 'Sedation & delirium (RASS/CAM-ICU)',
    pattern: /\bRASS\b|sedation|delirium|\bCAM-ICU\b|agitat|sedat(ed|ion)/i,
    depts: ['icu'],
    why: 'Deep, prolonged sedation independently lengthens ventilation and worsens delirium — the daily SAT+SBT pair and a proactive CAM-ICU screen are what catch the hypoactive delirium that "doesn\'t disturb the ward" and gets missed in a quiet, sedated patient.',
    fields: [
      { id: 'rass-target', label: 'RASS target', kind: 'select', options: ['0', '-1', '-2', '-3 (specific indication)', '-4/-5 (specific indication)'] },
      { id: 'rass-current', label: 'RASS current', kind: 'select', options: ['+4', '+3', '+2', '+1', '0', '-1', '-2', '-3', '-4', '-5'] },
      { id: 'sat-done', label: 'Sedation held today (SAT)?', kind: 'toggle' },
      { id: 'sat-contraindicated', label: 'SAT contraindicated today?', kind: 'toggle' },
      { id: 'sat-contraindicated-why', label: 'Why (seizures/raised ICP/NMB/self-harm risk)', kind: 'text-short', showIf: { fieldId: 'sat-contraindicated', equals: true } },
      { id: 'sbt-done', label: 'SBT attempted today?', kind: 'toggle' },
      { id: 'cam-icu', label: 'CAM-ICU', kind: 'select', options: ['Positive', 'Negative', 'Not assessable (RASS -4/-5)'] },
      { id: 'delirium-precip', label: 'Delirium precipitant addressed', kind: 'select', options: ['Sedative/opioid burden', 'Sleep disruption', 'Immobility', 'Untreated pain', 'Sensory deprivation (no glasses/hearing aid)', 'None identified'] },
      { id: 'antipsychotic', label: 'Antipsychotic given for dangerous agitation?', kind: 'toggle' },
    ],
  },

  // ── Orthopaedics (dossier: docs/clinical-build/research/orthopaedics.md) ──

  {
    id: 'ortho-neurovascular-status',
    title: 'Neurovascular status',
    pattern: /neurovascular|distal (pulse|perfusion)|cap(illary)? refill|pulses?,? sensation|sensation.*motor|pain on passive stretch/i,
    depts: ['ortho'],
    why: 'Neurovascular status distal to every injury, documented BEFORE and AFTER any manipulation, is the single most litigated omission in orthopaedic practice — reduce/splint/cast without a pre-intervention baseline and you cannot say whether you caused a deficit or inherited it.',
    fields: [
      { id: 'timing', label: 'Timing', kind: 'select', options: ['Pre-reduction/pre-splint baseline', 'Post-reduction/post-splint recheck', 'Serial/hourly review'] },
      { id: 'pulses', label: 'Pulses', kind: 'select', options: ['2+ normal', '1+ reduced', 'Absent', 'Doppler signal only'] },
      { id: 'cap-refill', label: 'Capillary refill', kind: 'number', unit: 's' },
      { id: 'sensation', label: 'Sensation', kind: 'select', options: ['Intact', 'Reduced', 'Absent'] },
      { id: 'nerve-territory', label: 'Nerve/dermatome tested', kind: 'text-short' },
      { id: 'motor', label: 'Motor power (MRC 0-5)', kind: 'select', options: ['5 — normal', '4 — against resistance', '3 — against gravity', '2 — gravity eliminated', '1 — flicker/trace', '0 — no contraction'] },
      { id: 'passive-stretch-pain', label: 'Pain on passive stretch?', kind: 'toggle' },
      { id: 'compared-contralateral', label: 'Compared to contralateral limb?', kind: 'toggle' },
    ],
  },
  {
    id: 'ortho-open-fracture',
    title: 'Open fracture assessment',
    pattern: /open (fracture|#)|compound (fracture|#)|gustilo/i,
    depts: ['ortho'],
    why: 'Gustilo grade (finalised only in theatre after debridement) drives the antibiotic escalation, and the antibiotic clock — target <1h from arrival, never delayed for imaging — is the single highest-yield, most litigated time target in ortho-trauma.',
    fields: [
      { id: 'gustilo', label: 'Gustilo grade', kind: 'select', options: ['I', 'II', 'IIIA', 'IIIB', 'IIIC', 'Not yet graded — assess in theatre'] },
      { id: 'time-since-injury', label: 'Time since injury', kind: 'text-short' },
      { id: 'time-to-arrival', label: 'Time of arrival', kind: 'text-short' },
      { id: 'abx-given', label: 'Antibiotics given?', kind: 'toggle' },
      { id: 'abx-time', label: 'Time antibiotics given', kind: 'text-short', showIf: { fieldId: 'abx-given', equals: true } },
      { id: 'abx-within-1h', label: 'Within 1h of arrival?', kind: 'toggle', showIf: { fieldId: 'abx-given', equals: true } },
      { id: 'tetanus-status', label: 'Tetanus status', kind: 'select', options: ['Up to date — no action', 'Incomplete/unknown — toxoid given', 'High-risk wound — immunoglobulin also given'] },
    ],
  },
  {
    id: 'ortho-fracture-description',
    title: 'Fracture description',
    pattern: /fracture|\bfx\b/i,
    depts: ['ortho'],
    why: 'Site, pattern, displacement, angulation and open/closed status are the universal grammar of fracture reporting — "tibia fracture" is not a management plan, "closed, displaced, distal-third tibia/fibula fracture" is.',
    fields: [
      { id: 'bone', label: 'Bone', kind: 'text-short' },
      { id: 'site', label: 'Site', kind: 'select', options: ['Proximal third', 'Middle third', 'Distal third', 'Metaphyseal', 'Diaphyseal', 'Epiphyseal/intra-articular'] },
      { id: 'pattern', label: 'Pattern', kind: 'select', options: ['Transverse', 'Oblique', 'Spiral', 'Comminuted', 'Segmental', 'Greenstick/torus', 'Avulsion'] },
      { id: 'displacement', label: 'Displacement (% and direction)', kind: 'text-short' },
      { id: 'angulation', label: 'Angulation (degrees and direction)', kind: 'text-short' },
      { id: 'shortening', label: 'Shortening', kind: 'text-short' },
      { id: 'open-closed', label: 'Open or closed', kind: 'select', options: ['Closed', 'Open'] },
      { id: 'intra-articular', label: 'Intra-articular extension?', kind: 'toggle' },
    ],
  },

  // ── Psychiatry (dossier: docs/clinical-build/research/psychiatry.md) ──────

  {
    id: 'psych-mse',
    title: 'Mental state examination (MSE)',
    pattern: /mental state exam|\bMSE\b|appearance and behaviour|thought form|thought content|hallucinat|delusion/i,
    depts: ['psych'],
    why: 'The MSE is the psychiatric physical exam — structured domain-by-domain, not a paragraph of prose. Attention (not just orientation) is the delirium tell that separates an organic confusional state from primary psychiatric illness, and hallucination modality (visual/tactile vs auditory) is a discriminator, not decoration.',
    fields: [
      { id: 'appearance', label: 'Appearance & behaviour', kind: 'text-short' },
      { id: 'speech', label: 'Speech', kind: 'text-short' },
      { id: 'mood', label: 'Mood (subjective — patient\'s own words)', kind: 'text-short' },
      { id: 'affect', label: 'Affect (objective)', kind: 'select', options: ['Full range, congruent', 'Restricted', 'Blunted', 'Flat', 'Labile', 'Incongruent to mood'] },
      { id: 'thought-form', label: 'Thought form', kind: 'select', options: ['Normal/linear', 'Tangential', 'Circumstantial', 'Loosened associations', 'Flight of ideas', 'Thought blocking', 'Perseveration'] },
      { id: 'delusions', label: 'Delusions present?', kind: 'toggle' },
      { id: 'delusion-content', label: 'Delusion content', kind: 'text-short', showIf: { fieldId: 'delusions', equals: true } },
      { id: 'si', label: 'Suicidal ideation (asked directly)?', kind: 'toggle' },
      { id: 'hi', label: 'Homicidal ideation (asked directly)?', kind: 'toggle' },
      { id: 'perception', label: 'Hallucinations — modality', kind: 'select', options: ['None', 'Auditory', 'Visual', 'Tactile', 'Olfactory/gustatory', 'Multiple modalities'] },
      { id: 'orientation', label: 'Orientation (time/place/person)', kind: 'select', options: ['Intact', 'Impaired'] },
      { id: 'attention', label: 'Attention — the delirium tell', kind: 'select', options: ['Intact — sustained through interview and on testing', 'Impaired/fluctuating'] },
      { id: 'insight', label: 'Insight', kind: 'select', options: ['Full', 'Partial', 'Absent'] },
      { id: 'judgment', label: 'Judgment', kind: 'select', options: ['Intact', 'Impaired'] },
    ],
  },
  {
    id: 'psych-risk-assessment',
    title: 'Risk assessment',
    pattern: /risk assessment|suicid|self-harm|homicidal|violence risk|risk to (self|others)/i,
    depts: ['psych'],
    why: 'A structured, individualised formulation — static plus dynamic factors, ideation through to means — is what actually informs the observation-level decision; a checklist score alone (SAD PERSONS and similar) has poor predictive validity and should prompt the full assessment below, not substitute for it.',
    fields: [
      { id: 'self-ideation', label: 'Ideation to self', kind: 'select', options: ['None elicited', 'Passive (wish to be dead)', 'Active — no plan', 'Active — with plan', 'Active — plan + intent'] },
      { id: 'self-means', label: 'Access to means?', kind: 'toggle' },
      { id: 'means-desc', label: 'Which means', kind: 'text-short', showIf: { fieldId: 'self-means', equals: true } },
      { id: 'previous-attempts', label: 'Previous attempts', kind: 'number' },
      { id: 'to-others', label: 'Risk to others?', kind: 'toggle' },
      { id: 'named-victim', label: 'Named victim/target', kind: 'text-short', showIf: { fieldId: 'to-others', equals: true } },
      { id: 'self-neglect', label: 'Self-neglect / grave disability?', kind: 'toggle' },
      { id: 'protective-factors', label: 'Protective factors', kind: 'text-short' },
      { id: 'static-factors', label: 'Static risk factors', kind: 'text-short' },
      { id: 'dynamic-factors', label: 'Dynamic risk factors', kind: 'text-short' },
      { id: 'obs-level', label: 'Observation level', kind: 'select', options: ['General ward observation', 'Intermittent (e.g. 15-30min)', 'Continuous 1:1'] },
    ],
  },
  {
    id: 'psych-mhca-status',
    title: 'MHCA status & capacity',
    pattern: /\bMHCA\b|Mental Health Care Act|involuntary care|assisted care|72-?hour assessment|72 hour assessment|forensic patient|state patient/i,
    depts: ['psych'],
    why: 'The legal basis for care is not paperwork — it is the difference between a clinically correct decision and an unlawful detention or an unprotected discharge. The 72-hour assessment clock is a general hospital-system obligation, not "someone else\'s problem" once a psychiatric referral has been made.',
    fields: [
      { id: 'status', label: 'Care status', kind: 'select', options: ['Voluntary', 'Assisted', 'Involuntary', '72-hour assessment', 'Forensic (CPA ss77-79)'] },
      { id: 'forms', label: 'MHCA form(s) completed', kind: 'text-short' },
      { id: 'capacity', label: 'Capacity to consent (documented judgement)', kind: 'select', options: ['Has capacity — consents', 'Has capacity — refuses', 'Lacks capacity'] },
      { id: 'next-step', label: 'Next legal step', kind: 'text-short' },
      { id: 'clock-start', label: '72h assessment clock start', kind: 'date' },
      { id: 'clock-due', label: '72h assessment due by', kind: 'date' },
    ],
  },
  {
    id: 'psych-substance-withdrawal',
    title: 'Substance & withdrawal watch',
    pattern: /withdrawal|\bCIWA\b|\bCOWS\b|substance use|intoxicat|delirium tremens|\bDTs\b/i,
    depts: ['psych'],
    why: 'A withdrawal risk that is not scored on a fixed schedule is a withdrawal risk that is only caught after it becomes DTs or a seizure — the score, the next-due time, and whether thiamine has actually been given (before glucose) are the operational facts the next clinician needs, not "on the withdrawal protocol".',
    fields: [
      { id: 'substance', label: 'Substance(s)', kind: 'text-short' },
      { id: 'last-use', label: 'Last use / amount', kind: 'text-short' },
      { id: 'ciwa-score', label: 'CIWA-Ar score', kind: 'number' },
      { id: 'ciwa-next-due', label: 'Next CIWA-Ar due', kind: 'text-short' },
      { id: 'withdrawal-signs', label: 'Withdrawal signs observed', kind: 'text-short' },
      { id: 'thiamine-given', label: 'Thiamine given (before glucose)?', kind: 'toggle' },
    ],
  },
];
