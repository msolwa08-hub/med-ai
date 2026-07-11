# M-UI/3 gate — polish toward 10/10

Three increments on top of M-UI/2, each committed and pushed to
`claude/ai-medical-history-app-1lh4wv`.

## A — the Confirm flow feels alive
`WorkingPicturePanel.tsx`: a signed confidence-delta chip (`+8` / `−5`) springs
in on every result-driven shift (hero + compact cards), and a refresh over an
existing picture shows a "re-reading…" banner + dims the cards instead of only
spinning the button. `prefers-reduced-motion` honoured. *Verification:* `tsc`
build clean. (Dynamic states need a live model picture — the animation/logic is
straightforward and type-checked.)

## B — the acid–base / ABG visual learning map
The headline of this milestone. `lib/acidBase.ts` is a deterministic interpreter
(acidaemia/alkalaemia → primary driver by the 7.40-side rule → compensation vs
the Winter/expected window in kPa → anion gap, albumin-corrected → delta–delta),
which also surfaces a hidden high-anion-gap metabolic acidosis when the pH is
masked. `AcidBaseMap.tsx` renders it as a self-contained, theme-aware SVG: a pH
scale, two reference-banded driver gauges (with the expected-compensation window
drawn on the pCO₂ gauge), an anion-gap gauge, and the five bedside steps in
words. Chloride added to the U&E panel so the gap is computable.

*Verification:*
- **Correctness** — interpreter run against 10 classic teaching gases (DKA,
  hyperchloraemic diarrhoea, acute + chronic COPD, PE/anxiety, vomiting alkalosis,
  sepsis mixed, salicylate, delta>2); all read correctly. Three cases that were
  initially wrong (chronic COPD compensation, alkalosis mislabelled high-gap,
  salicylate's hidden acidosis) were fixed and re-verified.
- **Render** — `abg-map-light.png` / `abg-map-dark.png` (DKA gas: pH 7.18,
  pCO₂ 3.0 kPa, HCO₃ 10, Na 140, Cl 100, glucose 28). The map reads
  "Metabolic acidosis, high anion gap with appropriate compensation", pH marker
  left of the normal band, pCO₂ badged COMPENSATING with the dashed expected
  window, HCO₃ badged PRIMARY DRIVER, anion gap 30, all five steps populated.

## C — polish
Dark-mode variant for the department / sub-department icon tiles (were static
`bg-brand-50`, light on dark cards); the Clerk discrepancy banner's ⚠/ℹ emoji
replaced with lucide `AlertTriangle`/`Info`. Skipped a mobile sticky diagnosis
header — the existing `PictureSheet` bottom bar already keeps it visible on
phones. Left `PillCue` pink/purple as-is (literal pill colours, patient-recall
identity). *Verification:* `tsc` build clean.

## Engine
Untouched — the loop harness is unaffected (the ABG map is a pure client-side
deterministic layer; no model calls, no doses).
