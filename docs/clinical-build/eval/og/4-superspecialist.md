# Super-specialist (MFM + gynae-onc) — O&G evaluation

Overall lane score: **8.0/10**
D2 (correctness & safety): **7.5/10** — AI outputs are clinically sound and EML-tier-honest across every probe; the losses are in the *deterministic* backstop, not the prose: the pregnancy-teratogen safety net is never armed in the O&G tools, there is no guideline floor for the high-acuity obstetric emergencies, and the ward-round engine crashes on a natural input shape.
D3 (depth & nuance): **8.5/10** — reasons at genuine subspecialist depth on 8/10 zebras (MgSO4 titration/toxicity, VBAC/accreta numbers, molar surveillance, Rh/Kleihauer, APS/Sydney criteria, FIGO staging). A few specific, named nuances are missing — most notably MgSO4 fetal neuroprotection in PPROM.

Method: 10 probes against `/tools/suggest-problems` and `/tools/ward-round-delta` (live Sonnet calls, tools key `MEDAI-INTERN-DEV`), plus a read of the safety-net wiring in `tools-clinical.ts`, `ward-round.ts`, `prescription-safety.ts`, and the STG seed data.

---

## What the engine actually is (architecture that governs depth)

Depth is produced by `claude-sonnet-4-6` in `suggestProblems` / `generateWardRoundDelta`, lightly anchored by keyword-retrieved STG entries (`stgMatches`) and a deterministic post-pass safety net (`checkPrescriptionSafety`). Two structural facts shape the D2/D3 verdict:

1. **The STG knowledge base is almost empty for high-acuity O&G.** `apps/api/src/data/stg-entries.ts` contains exactly one obstetric-emergency-adjacent entry (`Threatened Miscarriage`) plus BV, secondary amenorrhoea, and a few STIs. PET, eclampsia, PPH, ectopic, PPROM, APH, GDM, molar, and every gynae-onc condition returned `stgCondition: None` — i.e. the management is un-retrieved free-styling. It is currently *correct* only because Sonnet is strong; there is no guideline floor under the emergencies that matter most.
2. **The pregnancy dimension of the safety net is dead code in the O&G tools.** `prescription-safety.ts` has a curated `PREGNANCY_BLOCK` (warfarin, methotrexate, isotretinoin, valproate, ACE-i, DOACs, statins, carbimazole…) — but it only fires when `context.isPregnant === true`. `suggestProblems` (`tools-clinical.ts:143`) and `generateWardRoundDelta` (`ward-round.ts:173`) both call `runSafetyCheck` **without setting `isPregnant`**. So in the one department where pregnancy is the default, the deterministic teratogen backstop never runs — the "never trust the model alone with drugs" guarantee is voided precisely where it is most load-bearing.

---

## Pros (concrete, with evidence)

**Severe PET / impending eclampsia (`suggest-problems`)** — subspecialist-complete: MgSO4 4 g IV load over 15–20 min then 1 g/hr, with the full toxicity frame (RR > 12, patellar reflexes present, urine output > 25 mL/hr, calcium gluconate at bedside); labetalol 20 mg escalating/doubling to 300 mg cumulative, hydralazine 5 mg alternative, target < 160/110; fluid restriction ≤ 85 mL/hr for pulmonary-oedema avoidance explicitly tied to the renal impairment; delivery indicated at ≥ 34 wk with severe features; separate HELLP problem with Tennessee Class II, platelet-transfusion threshold < 50 before CS, MgSO4 continued 24 h post-delivery; separate PET-renal problem with the pregnancy-specific creatinine ceiling (< 70 µmol/L) and Mg-toxicity-in-oliguria caveat.

**Ward-round MgSO4 toxicity trajectory (`ward-round-delta`, full-shaped prior round)** — the flagship longitudinal case, and it is excellent: recognised somnolence + absent reflexes + RR 10 as toxicity ("patellar reflexes lost at ~3.5–5 mmol/L, respiratory depression ~5, arrest > 7.5"), ordered STAT serum Mg, said STOP MgSO4, calcium gluconate 1 g (10 mL 10%) over 10 min *with mechanism* (competitive Ca-channel antagonism), restart only after RR > 12 / reflexes present / level in range at 0.5 g/hr; recognised concurrent pulmonary oedema and delivered the key nuance — "do NOT fluid-challenge the oliguria; these kidneys are vasoconstricted from PET, not volume-depleted"; flagged HELLP indices all trending wrong → DIC next → coags pre-theatre; and the consultant-grade read that the *lower* BP (158/104 vs 174/116) is misleading and may signal deterioration, not control.

**PPROM 30+4** — erythromycin 250 mg 6-hourly × 10 days with the explicit "avoid co-amoxiclav — neonatal NEC" ORACLE nuance; betamethasone ×2; tocolysis contraindicated beyond a ≤48 h steroid-completion window; deliver at 34 wk unless chorioamnionitis/fetal compromise; unknown-GBS → intrapartum benzylpenicillin; no digital VE.

**VBAC / low-lying placenta over prior scar** — TVS placental-edge-to-os distance (≥ 20 mm = low-lying not praevia; covering = LSCS), formal accreta-spectrum assessment (Doppler ± MRI) *because* anterior placenta overlies the CS scar, LUS thickness < 2.0–2.5 mm favours repeat CS, uterine-rupture risk quoted 0.5–0.9%, no prostaglandin induction, cross-match 4 units, peripartum-hysterectomy counselling, and the note correctly names occult accreta as the single most dangerous gap.

**Ectopic** — MTX criteria stated precisely (stable, βhCG < 5000, no fetal cardiac activity, mass < 35 mm, reliable follow-up), MTX 50 mg/m² single-dose, day-4/day-7 ≥ 15% fall rule, anti-D for Rh-neg, and correctly read the 1450→1620 (< 53%) rise as suboptimal.

**Rh isoimmunisation / APH** — check the antibody screen *first* (if already sensitised, anti-D is futile → switch to MCA-PSV Doppler surveillance and MFM referral); anti-D 1500 IU (300 µg) IM within 72 h; Kleihauer-Betke to quantify FMH with the > 4 mL top-up rule; routine 28/34 wk dosing and postpartum-within-72 h-if-neonate-Rh+ plan.

**Molar pregnancy** — complete mole, suction curettage with the subtle "uterotonics AFTER suction is established — trophoblastic-embolism risk", TFTs for βhCG-driven thyrotoxicosis, CXR for mets, histology mandatory, weekly βhCG to undetectable then monthly ×6, contraception through surveillance, 15–20% GTN risk quoted, and correctly withheld anti-D for a *complete* mole.

**PMB / endometrial ca** — Type I phenotype recognised, Pipelle first-line (hysteroscopy if stenosis), CA-125 + MRI staging + MDT, VTE-prophylaxis-with-malignancy, obesity→peripheral-aromatisation mechanism, and the correct "do NOT give empirical progestogen before histology."

**Cervical ca (HIV+)** — FIGO 2018 framing, parametrial induration read as locally advanced, MRI+CT staging, biopsy at a centre with haemostatic backup (don't biopsy a friable lesion at district level), cervical cancer as AIDS-defining at CD4 210, TDF-nephrotoxicity flagged before contrast.

**RPL / APS** — full Sydney-criteria workup (LA, aCL, anti-β2GPI) with the "repeat ≥ 12 weeks apart" confirmation rule, thrombophilia panel, uterine-anomaly imaging, parental karyotype, and aspirin 150 mg + LMWH for confirmed APS; separate VTE problem invoking RCOG risk scoring for the prior DVT.

**EML-tier honesty throughout** — consistently distinguished Core vs Complementary vs non-EML and said so out loud rather than silently prescribing outside formulary (MTX, enoxaparin, betamethasone, thiamine, ferric carboxymaltose all tagged).

---

## Cons (concrete — every place it went shallow, with the missing nuance)

1. **[D2, architecture] Pregnancy-teratogen safety net never fires in the O&G tools.** `suggestProblems` and `generateWardRoundDelta` call `runSafetyCheck` without `isPregnant`, so `PREGNANCY_BLOCK` (warfarin/ACE-i/MTX/valproate/DOAC/statin/carbimazole) is inert for pregnant patients. Every probe returned `safety: []`. If the model ever proposed a teratogen, the deterministic backstop would stay silent in the exact department it was built for. Fix is one field.
2. **[D2, architecture] No guideline floor for the obstetric emergencies.** PET, eclampsia, PPH, ectopic, PPROM, APH, GDM, molar, and all gynae-onc conditions retrieve `stgCondition: None`. Depth is entirely model-borne — no STG anchor, no citable icd10/condition, and no protection if the model regresses. The one place a consultant most wants a hard reference is the one place the retrieval layer is empty.
3. **[D2/D7] `/tools/ward-round-delta` 500s (synchronous crash) on a natural input.** `compactRound` calls `r.suggestedInvestigations.join()` / `r.suggestedManagement.join()`, but the route (`tools.ts:159`) never validates that each `previousRounds` element carries those arrays. A prior round stored as `{date, summary}` → `undefined.join()` → TypeError → 500 in ~2 ms (reproduced twice). In the depth lane this means the flagship MgSO4-toxicity trajectory is one malformed field away from never rendering.
4. **[D3] PPROM — MgSO4 fetal neuroprotection missing.** At 30+4 with possible imminent preterm delivery, the output covered steroids, latency antibiotics and tocolysis but never mentioned MgSO4 for neuroprotection if delivery < 32 wk becomes imminent — an explicit subspecialist window and a named brief item. Genuine omission.
5. **[D3] Severe PET at 34+2 — steroids-vs-delivery hedge.** It offered betamethasone "if delivery not imminent" but did not state the subspecialist rule that at ≥ 34 wk with severe features delivery should not be *delayed* for steroids; it also did not caution against over-rapid BP lowering / name the uteroplacental-perfusion floor (target < 160/110 was correct but the "don't overshoot" nuance was implicit), and did not give the recurrent-seizure re-bolus (further MgSO4 2 g over 3–5 min).
6. **[D3] RPL/VTE — two subspecialist caveats absent.** (a) Did not flag that **protein S is physiologically low in pregnancy**, making the thrombophilia panel it ordered partly uninterpretable in a 7-week gravida. (b) Slightly under-committed: for a **prior DVT**, RCOG mandates antenatal LMWH thromboprophylaxis *regardless* of the thrombophilia result, yet the plan said "await results / if risk score mandates."
7. **[D3, minor] Ectopic — surgical-biased for an ideal MTX candidate.** This patient (stable, βhCG 1620, mass 22 mm, no FH) meets every MTX criterion the model itself listed, but the plan framed surgery as first-line and MTX as a secondary "consider only if." Defensible in a district-resource frame; not the sharpest read.
8. **[D3, minor] Cervical FIGO reasoning slightly conflated.** It suggested upper-vaginal extension might make it IIIB, but vaginal upstaging (IIIA) needs *lower*-third involvement and IIIB requires pelvic-sidewall reach; the parametrial induration alone is IIB. Correct floor, muddled ceiling.

---

## Top 3 depth fixes (ranked by impact)

1. **Arm the pregnancy safety net in the O&G tools.** Pass `isPregnant` into `runSafetyCheck` from `suggestProblems` and `generateWardRoundDelta` (infer it from dept=og + gestation/gravidity in the snapshot, or thread an explicit flag). This turns the existing, already-built teratogen block from dead code into a live backstop in the department that needs it most — highest safety yield for the least work.
2. **Give the obstetric emergencies a guideline floor.** Seed STG/protocol entries for severe PET/eclampsia (MgSO4 + neuroprotection windows, antihypertensive ceilings, delivery timing), PPH (4 T's, uterotonic ladder, TXA), PPROM (erythromycin, steroid/MgSO4 GA windows), ectopic (MTX criteria), APH, GDM and molar. This anchors the strongest zebras to a citable reference, restores `stgCondition`/`icd10` tagging, and protects against model regression — and would have auto-surfaced the PPROM neuroprotection nuance (fix #4 above).
3. **Harden `ward-round-delta` against partial prior rounds.** Default the array fields in `compactRound` (`r.suggestedInvestigations ?? []`) and validate `previousRounds` elements at the route. Eliminates the synchronous 500 so the best longitudinal reasoning in the whole system (MgSO4 toxicity trajectory) can't be knocked out by a summary-shaped input.
