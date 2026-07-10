# Intensive Care — implementation record (M2)

Dossier (`../research/icu.md`, 1095 lines) → app registries, 2026-07-10.
**Clinical content below is pending your review.** Doses are from the dossier +
SA STG Ch.23 (critical care) where reachable; flagged items are where the source
PDF 403'd automated fetch and the value is expert-knowledge / search-summary.

## Loop gate (live)
**100/100** — ARDS on P/F ratio + echo (cardiogenic excluded), distributive/
septic shock on echo + lactate, RRT-requiring AKI on K⁺/pH/overload, VAP on
CXR + tracheal aspirate. ~8.9c/loop. Report `../eval/m2/loop-icu-2026-07-10.json`.
Gated on the enriched ICU discipline lens (FASTHUGSBID systems review,
resuscitate-then-investigate, trajectory-over-snapshot, ceiling-of-care).

## Fields (`fields/departments/icu.ts`)
Renal support/RRT (AEIOU indications, CRRT vs IHD); cumulative fluid balance
(de-resuscitate once past the resus phase); sedation RASS + delirium CAM-ICU
(target 0 to −2; CAM-ICU valid at RASS ≥−3; hypoactive delirium missed);
lines/tubes + days in situ (line removal = highest-yield CLABSI/VAP step);
ceiling of care / resuscitation status (explicit + documented — SA medico-legal).
Existing vent-settings + haemodynamics fields kept.

## Investigation panels (`lib/investigations.ts`)
`sepsis` (icu/medicine/emergency): procalcitonin (falling <0.5 → stewardship
stop-prompt; rising ≥0.5 → source-control prompt), ScvO2 (trended, no hard
threshold — lactate clearance preferred in resource-limited units). Platelets
<10 ×10⁹/L → prophylactic-transfusion trigger.

## Treatment sets (`config/treatmentSets.ts`)
- **Septic shock — hour-1 + vasopressor escalation**: cultures before abx
  (≤45min); lactate + repeat 2h, clearance ≥10-20%; 30ml/kg crystalloid as a
  START then reassess (PLR); early source-appropriate abx; **noradrenaline
  0.01-0.5 mcg/kg/min → MAP ≥65** (SA STG Ch.23, first-line); refractory →
  vasopressin 0.03-0.04 u/min / adrenaline / dobutamine (off); source control
  6-12h.
- **Shock — vasopressor/inotrope selection** (cardiogenic/undifferentiated/
  obstructive): POCUS mechanism; noradrenaline; dobutamine 2.5-20 mcg/kg/min;
  vasopressin/adrenaline add-ons (off); structural-cause immediate Rx; access +
  extravasation caveat.
- **ARDS lung-protective**: Berlin P/F bands; **TV 6ml/kg PBW** (PBW formula
  given); plateau ≤30; ⚠ PEEP/FiO2 ladder (*dossier source 403'd — verify vs
  your unit's posted ARDSnet table*); permissive hypercapnia pH ≥7.30; prone
  ≥12-16h if P/F<150 (off); NMB/cisatracurium (off); conservative fluids.
- **Raised ICP — tiered**: HOB 30°, neutral neck, normothermia/glycaemia;
  sedation; normoxia/normocapnia; ICP <20-22, CPP 60-70; seizure Rx; hyperosmolar
  (hypertonic saline 3% or mannitol 0.25-1g/kg, off); brief hyperventilation
  PaCO2 30-35 as bridge only (off); EVD/craniectomy referral (off).
- **RRT indications (AEIOU)**: acidosis pH<7.1-7.15 / K⁺>6.5 / dialysable toxin
  / refractory overload / uraemic complication; optimise perfusion + stop
  nephrotoxins first; CRRT if unstable else IHD; circuit anticoagulation.
- **VAP prevention / ventilator care**: HOB 30-45°, daily SAT+SBT, chlorhexidine,
  subglottic drainage, cuff 20-30cmH2O, minimal circuit changes, ppx cross-check,
  daily line review.

## Smart blocks (`config/smartBlocks.ts`, dept icu)
Organ-support review (vent/pressor/RRT/RASS/lines+day); fluid balance &
haemodynamics (MAP+target, resus phase, cumulative balance, lactate clearance,
fluid-responsiveness test); sedation & delirium (RASS, SAT/SBT, CAM-ICU).

## Items flagged for your sign-off
1. **ARDS PEEP/FiO2 ladder** — dossier's example numbers included; verify against
   the primary ARDSNet table / your unit copy (source 403'd).
2. **Vasopressor/inotrope dose ranges** — dossier-marked [EK]; standard but not
   re-fetched. Noradrenaline-first-line confirmed vs SA STG Ch.23 summary.
3. `septic-shock-icu` and the existing ward `sepsis` bundle co-fire on a "septic
   shock" problem (complementary — vasopressor layer added) — intended.
