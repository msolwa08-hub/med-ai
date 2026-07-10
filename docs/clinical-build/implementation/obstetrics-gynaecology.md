# Obstetrics & Gynaecology — implementation record (M1/M2)

O&G is the app's **founding department** — the bedside loop (M1) was built here
first, where the clinical content is deepest, and the registry content was then
hardened through the six-agent evaluation (`../eval/og/SCORECARD.md`). So unlike
the other nine departments — where the dossier came first and drove the
registry build — O&G's registry content already existed and was live-validated
*before* this consolidated dossier was written. The dossier
(`../research/obstetrics-gynaecology.md`, 2107 lines, 2026-07-10) closes the
one remaining gap: documentary depth parity with its siblings, plus a
consultant-nuance cross-check against what was already shipped.

## Loop gate (live)
**100/100 across 6 scenarios** — the founding three (severe PET→HELLP on the
bloods, early-pregnancy pain→ectopic on TVS, preterm labour→chorioamnionitis on
sepsis markers) plus three depth scenarios added this drop: primary PPH→uterine
atony via the 4-Ts assessment, third-trimester pain+bleeding→concealed
placental abruption (diagnosis is clinical, don't wait for a scan; DIC screen
confirms the consumptive coagulopathy), and acute pelvic pain in a non-pregnant
woman→ovarian torsion on Doppler (βhCG checked FIRST to exclude ectopic).
~9.4c/loop. Report `../eval/m2/loop-og-depth-2026-07-10.json`.

## Existing registry content (built M1, hardened via the 6-agent eval)
- **Fields** (`fields/departments/og.ts`, 57 keyed fields) — the obstetric
  routine (EGA/LMP, gravidity/parity detail, SFH-vs-dates, Leopold's, FHR,
  contractions, the structured VE), plus gynae history.
- **Four sub-department lenses** (`tools-assist.ts`) — antenatal (risk-screening,
  BANC-Plus schedule, PMTCT), labour (the partogram + structured VE + FHR-after-
  contraction as the core assessment), postnatal (mode-of-delivery as the root
  question, the day-3 CS-sepsis window, EPDS mood screen), gynae (the "is she
  pregnant?" reflex, pelvic exam findings) — the richest per-ward differentiation
  in the app.
- **Treatment sets / STG floor** — the obstetric-emergency bundles (PPH, sepsis,
  major haemorrhage and the wider STG-floor emergency set surfaced by the eval),
  the teratogen net, the female acute-abdomen differential.
- **Panels** (`lib/investigations.ts`) — the HELLP/DIC platelet-trend rules
  (a halving matters more than the absolute count; HELLP in pregnancy), fed into
  the Working Picture.

## What the dossier adds
1. **Documentary depth parity** — O&G now has the same DEPTH-BAR reference
   (§1 mental model → §2 all 14 syndromes → §3 normals → §4 investigation
   interpretation → §5 scores → §6 SA reality) its siblings carry, so future
   depth work has a single source.
2. **Three consultant-nuance corrections** the dossier cross-checked against the
   app's own eval findings — flagged below for a deliberate lens/content
   touch-up (not blocking; the department gates 6/6 at 100 as-is):
   - VTE in pregnancy: **protein S is physiologically low in pregnancy** (don't
     over-read it), and **a prior VTE mandates LMWH prophylaxis regardless of
     the thrombophilia result** (§2.7).
   - Molar pregnancy: **uterotonics go AFTER, not before, evacuation** (§2.8).
   - Cervical cancer: the **FIGO IIIA-vs-IIIB** distinction (§2.12).

## Items flagged for your sign-off
1. The three nuance corrections above — candidates for the next O&G lens pass;
   confirm the clinical framing before they go into guidance.
2. All exact drug doses in the dossier (MgSO₄ Zuspan/Pritchard, uterotonic
   ladder, TXA, LMWH) are [EK]-marked — the SA .gov.za/SASOG PDFs 403'd
   automated fetch; verify against your current Maternity Care Guidelines +
   STG/EML edition.

## Status note
The residual O&G work named in the six-agent scorecard is **UX/throughput
architecture** (streaming, worker pool, the competing-surface redesign), not
clinical safety or depth — that folds into the M-UI/2 frontend overhaul, not
this clinical track.
