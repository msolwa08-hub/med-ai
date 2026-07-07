# Consultant (correctness) — O&G evaluation

Overall lane score: 7.0/10

Lane: D1, D2, D7. Method: 9 fully-documented O&G cases spanning the acuity range fed live to
`/tools/suggest-problems` (7) and `/tools/ward-round-delta` (2), plus 5 targeted `/tools/interaction-check`
probes of the deterministic safety net. Clinical content was judged against SA Maternity Care Guidelines,
the National STGs/EML and standard hospital-level obstetric practice.

- D1: 8/10 — Outputs capture what a consultant needs: dangerous-first differentials, HIV/PMTCT raised every time, anti-D, GBS, steroids, antenatal-care-quality flags, escalation and monitoring. Main miss: **no tranexamic acid in the flagship PPH case** (WOMAN-trial/SA guideline standard), and the "must-not-miss" note field was returned empty on 5/7 problem-list cases.
- D2: 6/10 — The **LLM clinical content is consultant-grade and STG/EML-aligned** (correct doses, routes, thresholds) and I found **no unsafe drug suggestion** in 9 cases. But the **deterministic safety net — advertised as "the last line of defence" — is structurally not wired for obstetrics**: teratogen BLOCKs never run in either AI flow, there is no ergometrine/MgSO4/methotrexate-NSAID logic, and it produced a false-positive BLOCK on a correct plan. Safety currently rests entirely on the model.
- D7: 7/10 — Clean validation (400/401), no 500s, well-formed JSON on all 9 AI calls, no cross-bleed in the *clinical* text. But two deterministic post-passes misfire: a **Stroke screening card bled into a post-caesarean sepsis round**, and a penicillin BLOCK dumped an entire management paragraph into the `drug` field.

## Pros (concrete, with evidence)

- **Severe pre-eclampsia (C1) is textbook.** MgSO4 "4 g IV over 20 min, then 1 g/hour", calcium gluconate 1 g (10 mL 10%) at bedside as antidote, labetalol 20→40→80 mg titration, nifedipine alternative, target <160/110, correct HELLP overlap (O14.2) and pre-eclamptic AKI as separate problems. EML tagging present.
- **PPH (C2) handled the ergometrine trap correctly** in a chronic-hypertensive: oxytocin 40 IU/500 mL, then explicitly "Ergometrine … CONTRAINDICATED given hypertension/BP 158/98; DO NOT USE → use Misoprostol 800 mcg" — flagged *twice*, plus MgSO4 eclampsia prophylaxis and balloon tamponade/surgical escalation.
- **Ectopic (C3) prioritised correctly:** "ruptured ectopic until proven otherwise", surgery over methotrexate given free fluid, methotrexate contraindications stated accurately, and **anti-D given for the O-negative patient** (raised in the safety note too).
- **PPROM (C4):** betamethasone 12 mg IM q24h ×2, erythromycin latency antibiotic, explicit "avoid co-amoxiclav (NEC)", GBS swab for unknown status, no tocolysis once confirmed, cord-prolapse vigilance.
- **MgSO4 toxicity ward-round (W1) is exemplary and the single best output tested:** recognised the reflex-loss + RR 10 + oliguria triad, ordered **STOP MgSO4 + calcium gluconate STAT without waiting for the level**, explained the AKI→reduced-clearance feedback loop, correct toxicity thresholds (~3.5–5 / 5–6.5 / 7.5 mmol/L), and reduced-dose (0.5 g/hr) or phenytoin re-initiation.
- **gHTN + GDM (C7):** methyldopa first-line (correct SA agent), ACE/ARB avoidance stated, correct WHO/IADPSG GDM cut-offs, metformin as SA public-sector first-line, macrosomia workup.
- **Post-CS endometritis (W2):** ampicillin + metronidazole + gentamicin (correct SA regimen), held diclofenac against the aminoglycoside for nephrotoxicity, continued VTE prophylaxis, MEOWS/sepsis escalation.
- **Deterministic screening does add real value** where it matches: the Pre-eclampsia and PPH monitoring cards (MgSO4 RR/reflex/UO monitoring, Ca gluconate at bedside; serial fundal checks, 4-Ts) are sound and fire server-side.
- **Robustness:** missing fields → 400, bad key → 401, empty interaction-check → clean 200, no crashes or malformed JSON across all calls.

## Cons (concrete — every unsafe/incorrect output found)

**No frankly unsafe drug recommendation was produced by the model in any of the 9 cases.** The safety cons below are all in the *deterministic backstop*, which for an O&G department is where the risk concentrates because it is meant to catch the model's off-days.

1. **[HIGH] Teratogen safety net is dead in both AI flows.** `suggestProblems` and `generateWardRoundDelta` call `runSafetyCheck` **without `isPregnant`** (`tools-clinical.ts` ~L143, `ward-round.ts` ~L173). Proven live: `/tools/interaction-check` with the same planned lines `["Warfarin","Enalapril","Methotrexate","Ibuprofen","Ergometrine"]` returns **4 PREGNANCY BLOCKs when `isPregnant:true`** but **zero when the flag is omitted** — which is exactly what the obstetric flows do. In a department where most patients are pregnant, warfarin/ACE-i/ARB/NSAID/statin/valproate teratogen BLOCKs never fire automatically.
2. **[HIGH] No obstetric-specific deterministic rules at all.** Live `/tools/interaction-check` confirms the net misses:
   - **ergometrine + hypertension** → `warnings: []` (the exact danger the brief names; only the LLM caught it in C2/C6).
   - **methotrexate + NSAID** (`Methotrexate 25mg weekly; Ibuprofen 400mg TDS`) → `warnings: []` — NSAIDs reduce MTX clearance (pancytopenia risk); brief-named, not covered.
   - **MgSO4 in oliguric AKI** → `warnings: []` — the net is name-based only, no dose/renal awareness; the W1 catch was 100% the LLM.
   - LMWH (enoxaparin) + NSAID bleeding combo (W2) — only warfarin+NSAID is coded, so enoxaparin+diclofenac was not flagged by the net.
3. **[MED] False-positive penicillin BLOCK on a *correct* plan (C5 chorioamnionitis, penicillin-allergic).** `suggest-problems` does not strip advisory "allergy" lines before the lexical matcher (ward-round does, `ward-round.ts` L172). The management line *"PENICILLIN ALLERGY … avoid ampicillin/amoxicillin"* tripped a `severity:BLOCK ALLERGY` warning, and the **entire management paragraph was placed in the `drug` field**. The actual regimen (metronidazole + gentamicin, clindamycin option) is penicillin-free and safe — so the BLOCK is a pure false alarm on a compliant plan (alarm fatigue + ugly UX).
4. **[MED] Cross-specialty screening bleed (D7).** In the post-CS sepsis round (W2) the AI wrote "CVA tenderness" (costovertebral angle); the screening regex `/\bCVA\b/` matched it as cerebro**vascular accident** and injected a **Stroke** card (NPO/swallow-screen/permissive-hypertension) into an obstetric patient. Also "Post-operative" fired on the pre-delivery PET patient (W1).
5. **[LOW] TXA omitted from PPH (C2)** despite being SA guideline standard (1 g IV within 3 h) — a completeness gap in the haemorrhage case.
6. **[LOW] `note` (‘what the intern must not miss’) inconsistently returned** — empty on 5 of 7 problem-list cases.

## Top 3 fixes (ranked by clinical risk)

1. **Wire pregnancy into the obstetric flows.** Derive `isPregnant` in `suggestProblems`/`generateWardRoundDelta` (dept = O&G + gestation/"weeks"/pregnancy keywords, or an explicit field) and pass it into `runSafetyCheck`, and pass `problemCodes` in ward-round too. Without this the teratogen BLOCK net — the system's advertised backstop — is switched off for exactly the population that needs it.
2. **Add the obstetric danger rules the net is missing:** ergometrine/methylergometrine → BLOCK when hypertension/pre-eclampsia present; methotrexate + NSAID → BLOCK; LMWH + NSAID → WARN; and a Mg-in-renal-impairment / MgSO4-toxicity caution. These are the department's signature killers and none are currently caught deterministically.
3. **Kill the lexical false-positives.** Apply the ward-round `!/allerg/i` line filter in `suggest-problems`, put the matched drug token (not the whole paragraph) in the warning `drug` field, and tighten the stroke screening pattern so "CVA tenderness" (costovertebral angle) cannot inject a stroke card. Prevents alarm fatigue and cross-specialty bleed.
