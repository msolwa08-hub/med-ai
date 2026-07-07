/**
 * Prescription Safety Service — the last line of defence before a script.
 *
 * Every prescription (and every AI-drafted management plan) passes through
 * these checks:
 *
 *   1. ALLERGY — drug names matched against the patient's recorded allergies,
 *      including cross-reactivity classes (a "penicillin" allergy must catch
 *      amoxicillin and co-amoxiclav, not just the literal word).
 *   2. PREGNANCY — teratogenic/contraindicated agents flagged when the
 *      consultation context indicates pregnancy.
 *   3. RENAL — nephrotoxic/renally-cleared agents flagged when the problem
 *      list carries CKD (N18*).
 *   4. INTERACTIONS — a curated set of the dangerous combinations that
 *      actually cause harm in SA primary care (warfarin+NSAID, ACE+K-sparing,
 *      tramadol+SSRI, ...).
 *
 * Warnings do not silently block: the route returns them as a 409 and the
 * doctor may consciously override — every override is audit-logged. This is
 * decision support, not a substitute for clinical judgement.
 */

export interface SafetyWarning {
  severity: 'BLOCK' | 'WARN';
  drug: string;
  category: 'ALLERGY' | 'PREGNANCY' | 'RENAL' | 'INTERACTION';
  reason: string;
}

export interface SafetyContext {
  /** Free-text allergies as captured in the history (decrypted). */
  allergiesText?: string;
  isPregnant?: boolean;
  /** ICD-10 codes from the patient's problem list. */
  problemCodes?: string[];
  /** Combined free-text record (problems + history) for condition-gated rules. */
  conditionsText?: string;
}

// ─── Cross-reactivity classes ─────────────────────────────────────────────────
// Key: the allergy keyword a patient/history might contain.
// Values: drug-name fragments that must trigger the allergy warning.

const ALLERGY_CLASSES: Record<string, string[]> = {
  penicillin: ['penicillin', 'amoxicillin', 'amoxycillin', 'ampicillin', 'co-amoxiclav', 'amoxiclav', 'augmentin', 'flucloxacillin', 'benzathine'],
  sulfa: ['sulfamethoxazole', 'co-trimoxazole', 'cotrimoxazole', 'bactrim', 'sulfasalazine', 'sulphonamide', 'sulfonamide'],
  sulphonamide: ['sulfamethoxazole', 'co-trimoxazole', 'cotrimoxazole', 'bactrim', 'sulfasalazine'],
  aspirin: ['aspirin', 'ibuprofen', 'diclofenac', 'naproxen', 'indomethacin', 'ketorolac', 'meloxicam', 'piroxicam'],
  nsaid: ['aspirin', 'ibuprofen', 'diclofenac', 'naproxen', 'indomethacin', 'ketorolac', 'meloxicam', 'piroxicam'],
  codeine: ['codeine', 'tramadol', 'morphine', 'oxycodone'],
  morphine: ['morphine', 'codeine', 'oxycodone', 'fentanyl'],
  cephalosporin: ['cefazolin', 'ceftriaxone', 'cefuroxime', 'cephalexin', 'cefalexin', 'cefixime'],
  tetracycline: ['tetracycline', 'doxycycline', 'minocycline'],
  quinolone: ['ciprofloxacin', 'levofloxacin', 'moxifloxacin', 'ofloxacin'],
  latex: [], // procedural, not drug — surfaced by history, no drug match
};

// Direct name match fallback: any allergy token >=5 chars appearing in a drug name.

// ─── Pregnancy-contraindicated agents ─────────────────────────────────────────

const PREGNANCY_BLOCK: Array<{ match: string; reason: string }> = [
  { match: 'warfarin', reason: 'Teratogenic — use LMWH in pregnancy' },
  { match: 'methotrexate', reason: 'Abortifacient/teratogenic — absolutely contraindicated' },
  { match: 'isotretinoin', reason: 'Severe teratogen — absolutely contraindicated' },
  { match: 'valproate', reason: 'Neural tube defects — avoid in pregnancy' },
  { match: 'valproic', reason: 'Neural tube defects — avoid in pregnancy' },
  { match: 'enalapril', reason: 'ACE inhibitors cause fetal renal injury — switch antihypertensive' },
  { match: 'lisinopril', reason: 'ACE inhibitors cause fetal renal injury — switch antihypertensive' },
  { match: 'perindopril', reason: 'ACE inhibitors cause fetal renal injury — switch antihypertensive' },
  { match: 'losartan', reason: 'ARBs cause fetal renal injury — switch antihypertensive' },
  { match: 'doxycycline', reason: 'Tetracyclines stain fetal teeth/bone — use alternative' },
  { match: 'tetracycline', reason: 'Stains fetal teeth/bone — use alternative' },
  { match: 'ciprofloxacin', reason: 'Quinolones — cartilage concern; use only if no alternative' },
  { match: 'ibuprofen', reason: 'NSAIDs risk premature ductus closure (esp. 3rd trimester)' },
  { match: 'diclofenac', reason: 'NSAIDs risk premature ductus closure (esp. 3rd trimester)' },
  { match: 'naproxen', reason: 'NSAIDs risk premature ductus closure (esp. 3rd trimester)' },
  { match: 'rivaroxaban', reason: 'DOACs contraindicated in pregnancy — use LMWH' },
  { match: 'atorvastatin', reason: 'Statins contraindicated in pregnancy' },
  { match: 'simvastatin', reason: 'Statins contraindicated in pregnancy' },
  { match: 'efavirenz', reason: 'First-trimester neural tube concern — specialist ART review' },
  { match: 'carbimazole', reason: 'First-trimester teratogen — propylthiouracil preferred' },
];

// ─── Renal caution (problem list N18*) ────────────────────────────────────────

const RENAL_WARN: Array<{ match: string; reason: string }> = [
  { match: 'ibuprofen', reason: 'NSAID — nephrotoxic in CKD' },
  { match: 'diclofenac', reason: 'NSAID — nephrotoxic in CKD' },
  { match: 'naproxen', reason: 'NSAID — nephrotoxic in CKD' },
  { match: 'metformin', reason: 'Lactic acidosis risk — check eGFR; avoid if eGFR <30' },
  { match: 'nitrofurantoin', reason: 'Ineffective and toxic if eGFR <45' },
  { match: 'gentamicin', reason: 'Aminoglycoside — dose-adjust and level-monitor in CKD' },
  { match: 'amikacin', reason: 'Aminoglycoside — dose-adjust and level-monitor in CKD' },
  { match: 'tenofovir', reason: 'Nephrotoxic — confirm regimen suitability in CKD' },
  { match: 'enoxaparin', reason: 'Accumulates in CKD — dose-adjust or monitor anti-Xa' },
  { match: 'spironolactone', reason: 'Hyperkalaemia risk in CKD' },
];

// ─── Dangerous combinations within one script ─────────────────────────────────

const INTERACTIONS: Array<{ a: string[]; b: string[]; severity: 'BLOCK' | 'WARN'; reason: string }> = [
  {
    a: ['warfarin'],
    b: ['aspirin', 'ibuprofen', 'diclofenac', 'naproxen'],
    severity: 'BLOCK',
    reason: 'Warfarin + antiplatelet/NSAID — major bleeding risk',
  },
  {
    a: ['enalapril', 'lisinopril', 'perindopril', 'losartan'],
    b: ['spironolactone', 'amiloride'],
    severity: 'WARN',
    reason: 'ACE-i/ARB + K-sparing diuretic — hyperkalaemia; monitor K+',
  },
  {
    a: ['tramadol'],
    b: ['fluoxetine', 'sertraline', 'citalopram', 'escitalopram', 'amitriptyline'],
    severity: 'WARN',
    reason: 'Serotonin syndrome risk — tramadol + serotonergic agent',
  },
  {
    a: ['morphine', 'codeine', 'tramadol', 'oxycodone'],
    b: ['diazepam', 'lorazepam', 'clonazepam', 'zolpidem'],
    severity: 'WARN',
    reason: 'Opioid + benzodiazepine — respiratory depression risk',
  },
  {
    a: ['clarithromycin', 'erythromycin'],
    b: ['simvastatin', 'atorvastatin'],
    severity: 'WARN',
    reason: 'Macrolide + statin — rhabdomyolysis risk; pause statin',
  },
  {
    a: ['fluconazole'],
    b: ['warfarin'],
    severity: 'WARN',
    reason: 'Fluconazole potentiates warfarin — INR will rise',
  },
  {
    a: ['methotrexate'],
    b: ['ibuprofen', 'diclofenac', 'naproxen', 'aspirin', 'indomethacin', 'ketorolac'],
    severity: 'BLOCK',
    reason: 'Methotrexate + NSAID — reduced MTX clearance, marrow/renal toxicity',
  },
  {
    a: ['enoxaparin', 'dalteparin', 'heparin', 'clexane', 'lmwh'],
    b: ['ibuprofen', 'diclofenac', 'naproxen', 'aspirin', 'indomethacin', 'ketorolac'],
    severity: 'WARN',
    reason: 'LMWH/heparin + NSAID — additive bleeding risk',
  },
];

// ─── Obstetric condition-gated rules ──────────────────────────────────────────
// A drug that is safe in general but dangerous given a condition present in the
// record. Fires only when both the condition (regex over the record) AND the
// drug are present.
const OBSTETRIC_CONDITIONAL: Array<{ when: RegExp; drugs: string[]; severity: 'BLOCK' | 'WARN'; reason: string }> = [
  {
    when: /hypertens|pre-?eclampsia|\bpet\b|eclampsia|raised bp|bp \d{3}|severe (htn|hypertension)/,
    drugs: ['ergometrine', 'syntometrine', 'methylergometrine', 'ergotamine'],
    severity: 'BLOCK',
    reason: 'Ergometrine is contraindicated in hypertension/pre-eclampsia (severe vasoconstriction → stroke) — use oxytocin ± misoprostol for PPH',
  },
  {
    when: /\baki\b|acute kidney|oliguri|anuri|renal impair|creatinine (1[5-9]\d|[2-9]\d\d)|egfr <?[1-4]?\d\b/,
    drugs: ['magnesium sulphate', 'magnesium sulfate', 'mgso4', 'mag sulph'],
    severity: 'WARN',
    reason: 'MgSO4 is renally cleared — in AKI/oliguria it accumulates to toxicity: reduce the maintenance dose, monitor reflexes/RR/urine output and levels, calcium gluconate at the bedside',
  },
  {
    when: /oliguri|anuri|pulmonary o?edema|fluid overload|\baki\b|acute kidney/,
    drugs: ['hartmann', 'ringer', 'normal saline', '0.9% saline', 'crystalloid', 'fluid bolus'],
    severity: 'WARN',
    reason: 'Cautious fluids in pre-eclampsia with oliguria/overload — the vasoconstricted kidney does not respond to challenge and the leaky vasculature risks pulmonary oedema (a leading cause of PET death)',
  },
];

// ─── Checker ──────────────────────────────────────────────────────────────────

export function checkPrescriptionSafety(
  drugNames: string[],
  context: SafetyContext
): SafetyWarning[] {
  const warnings: SafetyWarning[] = [];
  const lowered = drugNames.map((d) => ({ original: d, lower: d.toLowerCase() }));

  // 1. Allergies (class-based + direct token match)
  const allergyText = (context.allergiesText ?? '').toLowerCase();
  if (allergyText && !/no known|none|nil|nkda|not assessed/.test(allergyText.slice(0, 60)) ) {
    for (const drug of lowered) {
      for (const [allergyKey, classDrugs] of Object.entries(ALLERGY_CLASSES)) {
        if (!allergyText.includes(allergyKey)) continue;
        if (classDrugs.some((cd) => drug.lower.includes(cd))) {
          warnings.push({
            severity: 'BLOCK',
            drug: drug.original,
            category: 'ALLERGY',
            reason: `Recorded ${allergyKey} allergy — ${drug.original} is in the cross-reactive class`,
          });
        }
      }
      // Direct match: allergy text mentions the drug itself
      const tokens = allergyText.split(/[^a-z]+/).filter((t) => t.length >= 5);
      if (tokens.some((t) => drug.lower.includes(t))) {
        if (!warnings.some((w) => w.drug === drug.original && w.category === 'ALLERGY')) {
          warnings.push({
            severity: 'BLOCK',
            drug: drug.original,
            category: 'ALLERGY',
            reason: `Recorded allergy appears to match ${drug.original} — verify with the patient`,
          });
        }
      }
    }
  }

  // 2. Pregnancy
  if (context.isPregnant) {
    for (const drug of lowered) {
      const hit = PREGNANCY_BLOCK.find((p) => drug.lower.includes(p.match));
      if (hit) {
        warnings.push({
          severity: 'BLOCK',
          drug: drug.original,
          category: 'PREGNANCY',
          reason: hit.reason,
        });
      }
    }
  }

  // 3. Renal (CKD on problem list)
  const hasCKD = (context.problemCodes ?? []).some((c) => c?.toUpperCase().startsWith('N18'));
  if (hasCKD) {
    for (const drug of lowered) {
      const hit = RENAL_WARN.find((r) => drug.lower.includes(r.match));
      if (hit) {
        warnings.push({
          severity: 'WARN',
          drug: drug.original,
          category: 'RENAL',
          reason: `CKD on problem list — ${hit.reason}`,
        });
      }
    }
  }

  // 4. Intra-script interactions
  for (const rule of INTERACTIONS) {
    const hitA = lowered.find((d) => rule.a.some((m) => d.lower.includes(m)));
    const hitB = lowered.find((d) => rule.b.some((m) => d.lower.includes(m)));
    if (hitA && hitB) {
      warnings.push({
        severity: rule.severity,
        drug: `${hitA.original} + ${hitB.original}`,
        category: 'INTERACTION',
        reason: rule.reason,
      });
    }
  }

  // 5. Obstetric condition-gated rules — the drug is only dangerous in the
  //    presence of a specific condition in the record (hypertension, AKI).
  //    These are where obstetric harm concentrates and were previously absent.
  const cond = (context.conditionsText ?? '').toLowerCase();
  for (const rule of OBSTETRIC_CONDITIONAL) {
    if (!rule.when.test(cond)) continue;
    const hit = lowered.find((d) => rule.drugs.some((m) => d.lower.includes(m)));
    if (hit) {
      warnings.push({
        severity: rule.severity,
        drug: hit.original.length > 60 ? `${hit.original.slice(0, 57)}…` : hit.original,
        category: 'INTERACTION',
        reason: rule.reason,
      });
    }
  }

  return warnings;
}
