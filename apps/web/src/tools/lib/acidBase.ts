// ─── ACID–BASE — the deterministic ABG interpreter (teach-while-you-work) ────
// Walks a blood gas the way a consultant teaches it at the bedside: is it
// acidaemic? what is the primary driver — respiratory or metabolic? is the
// other system compensating, and is that compensation appropriate? what is the
// anion gap, and does the delta–delta hide a second disorder? Pure, instant and
// free (no model call), and pure INTERPRETATION — never a drug dose — so it is
// safe general teaching knowledge. It powers the visual Acid–base map.
//
// UNITS: pCO₂ in kPa (SA/UK convention, matching the Gas panel); HCO₃⁻, Na⁺,
// Cl⁻ in mmol/L; albumin in g/L. The Winter/expected-compensation formulae are
// defined in mmHg, so they are converted with the 7.5 kPa→mmHg factor.

const KPA_PER_MMHG = 7.5;

// Reference bands (adult) — mirror the Gas / U&E panels in investigations.ts.
const PH_LOW = 7.35, PH_HIGH = 7.45;
const PCO2_LOW = 4.7, PCO2_HIGH = 6.0;      // kPa
const HCO3_LOW = 22, HCO3_HIGH = 26;        // mmol/L
const AG_LOW = 8, AG_HIGH = 12;             // mmol/L (albumin-corrected where possible)

export interface AcidBaseInput {
  ph?: number;
  pco2?: number;   // kPa
  hco3?: number;   // mmol/L
  na?: number;
  cl?: number;
  alb?: number;    // g/L — for anion-gap correction
  lact?: number;   // mmol/L — explains a raised gap
}

export type Primary =
  | 'respiratory acidosis'
  | 'respiratory alkalosis'
  | 'metabolic acidosis'
  | 'metabolic alkalosis'
  | 'mixed disorder'
  | 'normal';

export type Compensation =
  | 'none'            // no compensation expected / normal gas
  | 'uncompensated'   // acute — compensating system has not yet moved
  | 'partial'         // compensating, pH not yet normalised
  | 'appropriate'     // compensation in the expected range
  | 'inappropriate';  // second primary disorder hiding in the compensation

export interface AbStep { q: string; a: string; }

export interface AcidBaseReading {
  available: boolean;
  ph?: number;
  pco2?: number;
  hco3?: number;
  phState: 'acidaemia' | 'normal' | 'alkalaemia';
  primary: Primary;
  compensation: Compensation;
  /** the one-line human summary, e.g. "Metabolic acidosis, high anion gap, with appropriate respiratory compensation" */
  verdict: string;
  /** Winter/expected-compensation window for the pCO₂ (kPa), when the primary is metabolic */
  expectedPco2?: { low: number; high: number };
  anionGap?: number;
  anionGapCorrected?: number;
  agState?: 'low' | 'normal' | 'high';
  deltaRatio?: number;
  deltaNote?: string;
  /** the stepwise bedside walk-through */
  steps: AbStep[];
}

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Winter's formula: expected pCO₂ (mmHg) = 1.5·HCO₃ + 8 ± 2, returned in kPa. */
function wintersKpa(hco3: number): { low: number; high: number } {
  return { low: r1((1.5 * hco3 + 6) / KPA_PER_MMHG), high: r1((1.5 * hco3 + 10) / KPA_PER_MMHG) };
}

/** Expected pCO₂ for a primary metabolic alkalosis: ≈ 0.7·HCO₃ + 20 (mmHg) ± ~2, in kPa. */
function metAlkExpectedKpa(hco3: number): { low: number; high: number } {
  return { low: r1((0.7 * hco3 + 18) / KPA_PER_MMHG), high: r1((0.7 * hco3 + 22) / KPA_PER_MMHG) };
}

export function interpretAcidBase(input: AcidBaseInput): AcidBaseReading {
  const { ph, pco2, hco3, na, cl, alb, lact } = input;

  // Anion gap can be worked whenever Na, Cl and HCO₃ are present — even without
  // a full gas — but the acid–base analysis proper needs pH, pCO₂ and HCO₃.
  let anionGap: number | undefined;
  let anionGapCorrected: number | undefined;
  let agState: AcidBaseReading['agState'];
  if (na != null && cl != null && hco3 != null) {
    anionGap = r1(na - (cl + hco3));
    if (alb != null) anionGapCorrected = r1(anionGap + 0.25 * (40 - alb));
    const agUsed = anionGapCorrected ?? anionGap;
    agState = agUsed > AG_HIGH ? 'high' : agUsed < AG_LOW ? 'low' : 'normal';
  }

  if (ph == null || pco2 == null || hco3 == null) {
    return {
      available: false,
      phState: 'normal',
      primary: 'normal',
      compensation: 'none',
      verdict: '',
      anionGap, anionGapCorrected, agState,
      steps: [],
    };
  }

  const phState: AcidBaseReading['phState'] = ph < PH_LOW ? 'acidaemia' : ph > PH_HIGH ? 'alkalaemia' : 'normal';
  const resp = pco2 > PCO2_HIGH ? 'acidosis' : pco2 < PCO2_LOW ? 'alkalosis' : 'neutral';   // pCO₂ is an acid
  const metab = hco3 < HCO3_LOW ? 'acidosis' : hco3 > HCO3_HIGH ? 'alkalosis' : 'neutral';  // HCO₃ is a base

  // ── Primary disorder — the derangement that matches the pH direction ───────
  let primary: Primary;
  if (phState === 'acidaemia') {
    if (resp === 'acidosis' && metab === 'acidosis') primary = 'mixed disorder';
    else if (metab === 'acidosis') primary = 'metabolic acidosis';
    else if (resp === 'acidosis') primary = 'respiratory acidosis';
    else primary = 'metabolic acidosis'; // acidaemic with neither classically deranged — gap acidosis
  } else if (phState === 'alkalaemia') {
    if (resp === 'alkalosis' && metab === 'alkalosis') primary = 'mixed disorder';
    else if (metab === 'alkalosis') primary = 'metabolic alkalosis';
    else if (resp === 'alkalosis') primary = 'respiratory alkalosis';
    else primary = 'metabolic alkalosis';
  } else {
    // Normal pH: normal gas, a fully compensated single disorder, or an evenly
    // matched mixed picture.
    if (resp === 'neutral' && metab === 'neutral') primary = 'normal';
    else if ((resp === 'acidosis' && metab === 'acidosis') || (resp === 'alkalosis' && metab === 'alkalosis')) primary = 'mixed disorder';
    else {
      // Opposite derangements, normal pH → a fully compensated single disorder.
      // The classic rule: even when the pH is "normal", it sits on one side of
      // 7.40, and THAT side names the primary — compensation never overcorrects.
      const acidSide = ph < 7.40;
      if (acidSide) primary = resp === 'acidosis' ? 'respiratory acidosis' : 'metabolic acidosis';
      else primary = resp === 'alkalosis' ? 'respiratory alkalosis' : 'metabolic alkalosis';
    }
  }

  // ── Compensation ───────────────────────────────────────────────────────────
  let compensation: Compensation = 'none';
  let expectedPco2: { low: number; high: number } | undefined;

  if (primary === 'metabolic acidosis') {
    // Respiratory compensation is near-immediate, so a metabolic acidosis is
    // either appropriately compensated (pCO₂ in the Winter window) or has a
    // concurrent respiratory disorder — compare straight to the window.
    expectedPco2 = wintersKpa(hco3);
    if (pco2 > expectedPco2.high) compensation = 'inappropriate';   // under-shot → concurrent respiratory acidosis
    else if (pco2 < expectedPco2.low) compensation = 'inappropriate'; // over-shot → concurrent respiratory alkalosis
    else compensation = 'appropriate';
  } else if (primary === 'metabolic alkalosis') {
    expectedPco2 = metAlkExpectedKpa(hco3);
    if (pco2 < expectedPco2.low) compensation = 'inappropriate';
    else if (pco2 > expectedPco2.high) compensation = 'inappropriate';
    else compensation = 'appropriate';
  } else if (primary === 'respiratory acidosis') {
    // renal compensation raises HCO₃
    if (metab === 'alkalosis' || hco3 > HCO3_HIGH) compensation = phState === 'normal' ? 'appropriate' : 'partial';
    else if (metab === 'acidosis') compensation = 'inappropriate'; // low HCO₃ with resp acidosis → added metabolic acidosis
    else compensation = 'uncompensated'; // acute — kidneys not yet in
  } else if (primary === 'respiratory alkalosis') {
    // renal compensation lowers HCO₃
    if (metab === 'acidosis' || hco3 < HCO3_LOW) compensation = phState === 'normal' ? 'appropriate' : 'partial';
    else if (metab === 'alkalosis') compensation = 'inappropriate';
    else compensation = 'uncompensated';
  } else if (primary === 'mixed disorder') {
    compensation = 'inappropriate';
  }

  // A clearly raised gap means added acid — a high-anion-gap metabolic acidosis
  // is present even when the pH/HCO₃ are masked by another disorder (the classic
  // salicylate / mixed picture). Use a firm threshold so a mildly raised gap in
  // a metabolic alkalosis is not over-called.
  const agUsedForHidden = anionGapCorrected ?? anionGap;
  const hiddenMetAcidosis =
    agUsedForHidden != null && agUsedForHidden > 16 &&
    primary !== 'metabolic acidosis' && primary !== 'mixed disorder';
  if (hiddenMetAcidosis) compensation = 'inappropriate';

  // ── Delta–delta (only meaningful with a high-gap metabolic acidosis) ───────
  let deltaRatio: number | undefined;
  let deltaNote: string | undefined;
  if (agState === 'high' && hco3 < 24) {
    const agUsed = anionGapCorrected ?? anionGap!;
    deltaRatio = r1((agUsed - AG_HIGH) / (24 - hco3));
    deltaNote =
      deltaRatio < 0.4 ? 'ratio < 0.4 — a concurrent NORMAL-anion-gap acidosis is also present (the HCO₃ has fallen more than the gap has risen).'
      : deltaRatio <= 1 ? 'ratio 0.4–1 — a MIXED high-gap and normal-gap metabolic acidosis.'
      : deltaRatio <= 2 ? 'ratio 1–2 — consistent with a PURE high-anion-gap metabolic acidosis.'
      : 'ratio > 2 — a concurrent metabolic alkalosis (or a pre-existing high HCO₃, e.g. chronic CO₂ retention) is buffering the fall.';
  }

  // ── Verdict line ───────────────────────────────────────────────────────────
  // The anion gap only qualifies the verdict for a metabolic ACIDOSIS (it is a
  // work-up step for added acid vs bicarb loss) — never for an alkalosis.
  const agWord = primary === 'metabolic acidosis'
    ? (agState === 'high' ? ', high anion gap' : agState === 'normal' ? ', normal anion gap' : '')
    : '';
  const compWord =
    compensation === 'appropriate' ? 'with appropriate compensation'
    : compensation === 'partial' ? 'partially compensated'
    : compensation === 'uncompensated' ? 'uncompensated (acute)'
    : compensation === 'inappropriate' ? '— compensation outside the expected range (a second disorder)'
    : '';
  let verdict: string;
  if (primary === 'normal') {
    verdict = hiddenMetAcidosis
      ? 'High-anion-gap metabolic acidosis (masked — normal pH).'
      : 'Normal acid–base balance.';
  } else if (hiddenMetAcidosis) {
    verdict = `${cap(primary)} with a high-anion-gap metabolic acidosis (mixed disorder).`;
  } else {
    verdict = `${cap(primary)}${agWord}${compWord ? ` ${compWord}` : ''}.`;
  }

  // ── The bedside walk-through ────────────────────────────────────────────────
  const steps: AbStep[] = [];
  steps.push({
    q: '1 · Acidaemic or alkalaemic?',
    a: phState === 'normal'
      ? `pH ${ph} is within 7.35–7.45 — normal, but the pCO₂/HCO₃ below decide whether that is truly normal or a fully compensated picture.`
      : `pH ${ph} → ${phState} (${phState === 'acidaemia' ? 'below 7.35' : 'above 7.45'}).`,
  });
  steps.push({
    q: '2 · What is the primary driver?',
    a: primary === 'normal'
      ? `pCO₂ ${pco2} kPa and HCO₃ ${hco3} are both in range.`
      : primary === 'mixed disorder'
        ? `Both systems are deranged in the same direction — pCO₂ ${pco2} kPa and HCO₃ ${hco3} — a mixed disorder, not one primary with compensation.`
        : primary.startsWith('respiratory')
          ? `The pCO₂ ${pco2} kPa (${resp === 'acidosis' ? 'high — retained acid' : 'low — blown off'}) moves the pH the same way as the disturbance → a ${primary}. HCO₃ is ${hco3}.`
          : `The HCO₃ ${hco3} (${metab === 'acidosis' ? 'low — lost base/added acid' : 'high — retained base'}) moves the pH the same way as the disturbance → a ${primary}. pCO₂ is ${pco2} kPa.`,
  });
  steps.push({
    q: '3 · Is the other system compensating?',
    a: compensation === 'none'
      ? 'No compensation to assess.'
      : expectedPco2
        ? `Expected pCO₂ ${expectedPco2.low}–${expectedPco2.high} kPa; actual ${pco2} kPa → ${compensation === 'appropriate' ? 'appropriate compensation (compensation never fully normalises the pH — do not read the residual derangement as a second problem).' : compensation === 'inappropriate' ? (pco2 > expectedPco2.high ? 'higher than expected — a concurrent respiratory acidosis.' : 'lower than expected — a concurrent respiratory alkalosis.') : 'the respiratory response has not yet developed (acute).'}`
        : compensation === 'uncompensated'
          ? `The ${primary.startsWith('respiratory') ? 'kidneys (HCO₃)' : 'lungs (pCO₂)'} have not yet moved — an acute picture. Renal compensation takes 2–5 days to mature.`
          : compensation === 'inappropriate'
            ? 'The compensating system has moved the WRONG way — that is a second primary disorder, not compensation.'
            : `The ${primary.startsWith('respiratory') ? 'HCO₃' : 'pCO₂'} is moving to compensate but the pH is not yet corrected — partial compensation.`,
  });
  if (anionGap != null) {
    const acidosisContext = primary === 'metabolic acidosis' || primary === 'mixed disorder' || hiddenMetAcidosis || hco3 < HCO3_LOW;
    const agSuffix =
      agState === 'high' && acidosisContext
        ? ` A raised gap points to added acid — GOLD MARK / MUDPILES (lactate, ketones, urate, toxins).${lact != null ? ` Lactate here is ${lact}.` : ''}`
        : agState === 'high'
          ? ' Mildly raised, but the primary picture here is an alkalosis — the gap only diagnoses added acid alongside a metabolic acidosis, so read it in context.'
          : agState === 'normal' && primary === 'metabolic acidosis'
            ? ' A normal gap points to HCO₃ loss — diarrhoea, RTA, or saline (hyperchloraemic).'
            : '';
    steps.push({
      q: '4 · What is the anion gap?',
      a: `AG = Na − (Cl + HCO₃) = ${na} − (${cl} + ${hco3}) = ${anionGap}${anionGapCorrected != null ? ` (albumin-corrected ${anionGapCorrected})` : ''} → ${agState}.${agSuffix}`,
    });
  } else {
    steps.push({
      q: '4 · What is the anion gap?',
      a: 'Add Na⁺ and Cl⁻ (U&E panel) to compute the anion gap — it splits a metabolic acidosis into added-acid (high gap) vs bicarbonate-loss (normal gap).',
    });
  }
  if (deltaRatio != null) {
    steps.push({
      q: '5 · Delta–delta — anything hiding?',
      a: `Δ ratio = (AG − 12) / (24 − HCO₃) = ${deltaRatio}. ${deltaNote}`,
    });
  }

  return {
    available: true,
    ph, pco2, hco3,
    phState, primary, compensation, verdict, expectedPco2,
    anionGap, anionGapCorrected, agState, deltaRatio, deltaNote,
    steps,
  };
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Pull the latest gas/chemistry values out of the trended results for the map. */
export function acidBaseFromTrends(latestByKey: Record<string, number>): AcidBaseInput {
  return {
    ph: latestByKey.ph,
    pco2: latestByKey.pco2,
    hco3: latestByKey.hco3,
    na: latestByKey.na,
    cl: latestByKey.cl,
    alb: latestByKey.alb,
    lact: latestByKey.lact,
  };
}
