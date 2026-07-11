# MedAI — Consultant-Depth Build Campaign

## ▶ ACTIVE PRIORITIES for the autonomous UI loop (read this FIRST each tick)

The user rates the UI **7.5/10** (up from 4) and wants it pushed toward **10**.
M-UI/2 (premium redesign + tap-driven cockpit) and **M-UI/3** (investigations
visual learning aid + ABG map + confirm-flow motion + polish) are SHIPPED. Verify
EVERY UI change — screenshots are the proof, and a `vite.createServer` +
playwright single-process capture is the reliable path in this sandbox (shell
job-control kills backgrounded servers). Work in committed increments; push to
`claude/ai-medical-history-app-1lh4wv`.

1. ✅ **Investigations cluster + visual learning aid — SHIPPED** (M-UI/2 e47f756:
   sparklines + shaded reference bands + teach-while-you-work per analyte,
   clustered by system; M-UI/3 2af6f78: the **acid–base / ABG visual map** —
   a deterministic interpreter + reference-banded SVG gauges + 5-step teaching,
   `lib/acidBase.ts` + `AcidBaseMap.tsx`). Reused `lib/investigations.ts`,
   `ResultsCapture.tsx`. Verified: 10 classic gases + light/dark screenshots.
2. **UI polish toward 10/10** — PARTIALLY DONE (M-UI/3): confidence-shift delta
   chip + motion, "picture is thinking" refresh state, dark-mode department tiles,
   discrepancy-banner icons all shipped. *Remaining:* designed empty/error states
   sweep; any residual congestion / inconsistent spacing; a genuine
   confirm-stream grouping if a live re-fire flow is wired. (Mobile sticky
   leading-dx header is already covered by the `PictureSheet` bottom bar.)
3. **The continuum** (once the UI is genuinely strong): home → pre-visit summary
   pre-fills Clerk → discharge → follow-up → returning patient folds back in.

## Milestone drops (the master-plan spine — newest first)

- **M-UI/3 — polish toward 10/10 — ✅ SHIPPED** (2026-07-11). Three committed
  increments on top of M-UI/2. **(A)** the Confirm flow feels alive — a signed
  confidence-delta chip springs in on each result-driven shift + a "re-reading…"
  refresh state that dims (not wipes) the picture. **(B)** the headline: the
  **acid–base / ABG visual learning map** — `lib/acidBase.ts` (deterministic:
  primary driver by the 7.40-side rule, Winter-window compensation in kPa, anion
  gap + delta–delta, hidden high-gap acidosis surfaced) + `AcidBaseMap.tsx`
  (theme-aware SVG gauges + 5-step teaching), atop `InvestigationInsights` when a
  gas is present; chloride added to the U&E panel. **(C)** dark-mode dept tiles +
  tokenised discrepancy banner. Verified: interpreter against 10 classic gases +
  light/dark render screenshots. Engine untouched (pure client layer). Proof:
  `eval/m-ui3/` (`GATE.md`).
- **M-UI/2 — Premium redesign + diagnosis-first tap-driven cockpit — ✅ SHIPPED**
  (2026-07-11). User rated the UI 4/10 (cheap/plastic/congested); rebuilt in 5
  committed increments to the principle **lowest-level input → highest-level
  output**. Light-based tinted depth (no more plastic hairline cards), all emoji
  → lucide icons, coherent teal-intensity confidence bands, tokenized type. The
  cockpit is now **Start → Confirm → Complete**: tap a complaint → the leading
  diagnosis auto-appears → answer a yes/no + MCQ stream (the engine's new
  `discriminatingFeatures`) → confidence updates live → background last → the
  note falls out. Loop gate held **100/100 on O&G + Medicine** (engine change is
  additive). Proof + zero-typing drive: `eval/m-ui2/` (`SUMMARY.md`).
- **M-UI — Calm Clinical design system — ✅ SHIPPED** (dev branch). A real
  design-system build (not a reskin): tokens (`tailwind.config.js` + CSS-var
  theme), self-hosted Inter, lucide iconography, framer-motion on the Working
  Picture hero, one accent everywhere (killed the pink/blue/sky/indigo one-offs
  and the 8-colour dept selector), **plus a shipped dark mode** (sun/moon
  toggle, no-flash). Proof: `eval/m-ui/` (desktop+phone, light+dark). Reference:
  `docs/design-system.md`. Presentation-layer only — no API/logic change, so the
  M1 loop score carries over.
- **M1 — the bedside loop in O&G — ✅ SHIPPED**. Weighted differential +
  discriminating investigations + results→confidence→management, narrated.
  Live loop harness 100/100, ~8.4c/loop. Proof: `eval/og/` + `eval/reports/`.
- **M2 — the loop across every department, researched + implemented + gated —
  ✅ COMPLETE** (2026-07-10). All **10 departments** now carry a consultant-
  depth dossier, registry implementation (fields, smart-blocks, treatment sets,
  STG floors, investigation panels, discipline lens), and a **live loop gate at
  100/100**: Internal Medicine, Surgery, Emergency, ICU, Orthopaedics,
  Psychiatry, Anaesthetics (added as a new department this campaign),
  Paediatrics (neonatology/PICU depth pass), Obstetrics & Gynaecology (the
  founding department; 6/6 scenarios), and the O&G regression. ~8–10c/loop,
  <10c/prompt everywhere. Gate records + raw reports: `eval/m2/`; per-department
  clinical-review batches for sign-off: `implementation/*.md`. The Emergency
  gate caught + fixed a real max_tokens-truncation transient
  (`confidence-engine.ts` cache-friendly retry). **Next milestone: M-UI/2, the
  frontend overhaul** (`eval/m-ui2/`) — the user's explicit priority (UI 5/10 →
  premium Calm Clinical).

---


**Goal:** turn MedAI from a generic form-filler into a super-specialist tool that reasons
like a consultant in *every* department — every differential (common, dangerous, and the
zebras a consultant genuinely considers, e.g. renal tubular acidosis, the urine-anion-gap
workup), the discriminating history, the discriminating examination, the normals, the
investigation-interpretation nuances, and the SA-specific realities. Depth over breadth.
Explicitly a multi-session undertaking — this file is the resumable tracker.

## How this works (for any future session picking this up)

1. **Research phase** — one deep dossier per department in `research/<dept>.md`, built by a
   research agent to the depth bar in `DEPTH-BAR.md`. Sourced (SA STG/EML first, global second).
2. **Implementation phase** — turn each dossier into app content across the registries
   (`apps/web/src/tools/config/{symptomCascades,smartBlocks,examChecklists,treatmentSets,departments}.ts`,
   `fields/departments/*.ts`, `apps/api/src/services/tools-assist.ts` guidance,
   `apps/web/src/tools/lib/investigations.ts` panels/rules). Recorded in `implementation/<dept>.md`.
3. Every completed dossier and implementation is committed immediately so nothing is lost to a
   session-limit death. Update the table below in the same commit.

## Departments & status

| Department | Research dossier | Implementation | Notes |
|---|---|---|---|
| Internal Medicine | ✅ done (1409 lines) | ✅ implemented | fields, smart-blocks (DM/HIV/TB/HF), treatment sets (DKA/ACS/pulm-oedema/hyperK/CAP), cardiac + HIV/TB panels, discipline lens; loop gate 100/100 live. See `implementation/medicine.md` |
| Surgery (General) | ✅ done | ✅ implemented | fields (pain evolution, anticoag, NPO, post-op day), treatment sets (appendicitis/SBO/perforation/cholecystitis/peri-op), post-op + bridging blocks, abdo panel, 4-question lens; loop gate 100/100 live. See `implementation/surgery-emergency.md` |
| Emergency Medicine | ✅ done (1018 lines) | ✅ implemented | fields (SATS, ED clock, pre-hospital), treatment sets (MTP/organophosphate/NAC/meningitis), SATS + GCS blocks, tox panel, ABCDE-on-a-clock lens; loop gate 100/100 live. See `implementation/surgery-emergency.md` |
| Intensive Care | ✅ done (1095 lines) | ✅ implemented | fields (RRT/AEIOU, fluid balance, RASS/CAM-ICU, lines, ceiling of care), treatment sets (septic-shock hour-1, ARDS lung-protective, raised-ICP, RRT, VAP), organ-support/fluid/sedation blocks, sepsis panel, FASTHUGSBID lens; loop gate 100/100 live. See `implementation/icu.md` |
| Obstetrics & Gynae | ✅ done (2107 lines) | ✅ implemented (founding dept, 6-agent-hardened) | the founding department — deepest registry content (57 fields, 4 sub-dept lenses antenatal/labour/postnatal/gynae, STG-floor emergency sets, teratogen net, HELLP/DIC panels), hardened via the 6-agent eval (`eval/og/SCORECARD.md`); dossier now gives DEPTH-BAR documentary parity + 3 consultant-nuance corrections (protein-S/prior-VTE, molar uterotonics-after-evacuation, FIGO IIIA/IIIB) flagged for a lens touch-up. Loop gate **6/6 100/100 live**. See `implementation/obstetrics-gynaecology.md`. Residual work (streaming/surface redesign) is UX → folds into M-UI/2 |
| Paediatrics | ✅ done (2382 lines) | ✅ implemented (depth pass) | dossier (neonatology deepest, PICU reasoning, syndromic); enriched lens (age+weight-first, compensate-then-cliff, IMCI reflex, caregiver-as-monitor); fields (RTHB/EPI-SA/PMTCT/developmental red flags/neonatal glucose); paeds panel (neonatal bili/glucose/CRP/weight); 7 treatment sets (duct-dependent collapse, status epilepticus, cerebral-oedema-aware DKA, croup, bronchiolitis, neonatal jaundice, NAI); 4 smart blocks (neonatal core, IMCI danger signs, dehydration, child protection); loop gate 100/100 live incl. 2 neonatal depth cases. ⚠ one prescribing correction (HIV-exposed dual NVP+AZT) flagged. See `implementation/paediatrics.md` |
| Orthopaedics | ✅ done (1593 lines) | ✅ implemented | own fields fragment (mechanism, Gustilo, neurovascular pre/post, weight-bearing), treatment sets (open #, compartment syndrome, septic arthritis, NOF pathway, cauda equina), NV/open-#/fracture-description blocks, msk panel, limb/life-threat lens; loop gate 100/100 live. See `implementation/orthopaedics.md` |
| Psychiatry | ✅ done (1911 lines) | ✅ implemented | MHCA-status + depot/clozapine + organic-screen fields, psych monitoring panel (lithium bands, clozapine ANC, CK-in-agitation, urine tox), 7 treatment sets (rapid tranq, NMS, serotonin syndrome, lithium toxicity, CIWA alcohol withdrawal, dystonia/EPSE, suicide safety pathway), 4 smart blocks (MSE, risk, MHCA, withdrawal watch), organic-exclusion lens; loop gate 100/100 live. See `implementation/psychiatry.md` |
| Anaesthetics (NEW dept) | ✅ done (1623 lines) | ✅ implemented | dept registered (web+API), fields (ASA/airway/fasting/anticoag-neuraxial/METs/neuraxial suitability), pre-anaesthetic checklist, 7 treatment sets (MH crisis, anaphylaxis-under-GA, LAST, failed-intubation/CICO, spinal-CS hypotension, high/total spinal, delayed emergence), 4 smart blocks (pre-assessment, spinal record, crisis snapshot, PACU discharge), discipline lens; loop gate 100/100 live. See `implementation/anaesthetics.md` |
| Family Med / PHC | ⬜ not started | ⬜ not started | consider — the district generalist lens |

Legend: ⬜ not started · ⏳ in progress · 🟡 partial · ✅ done

## Cross-cutting workstreams

- ✅ Investigation-trending companion (Results tab + deterministic delta rules) — `lib/investigations.ts`. Extend panels/rules per department as dossiers land.
- ⬜ Differential-engine: surface the consultant differential (incl. must-not-miss + zebra) from the presentation, not just a problem list.
- 🟡 "Normals" reference layer — what normal looks like per ward, inline. (Age-banded paediatric normals now in `research/paediatrics.md` §3; other depts' normals live in their dossiers. Not yet surfaced as an inline app layer.)
- ✅ Anaesthetics as a first-class department in `departments.ts` (2026-07-10, gate 100/100).

## Evaluations

- ✅ **O&G six-agent evaluation** (`eval/og/`) — efficiency, breadth, consultant, super-specialist,
  stressed-load, UI/UX lanes against a 7-dimension rubric. Aggregate ~6.5 → projected ~8.0 after
  remediation. 13 highest-impact fixes applied and cherry-picked to the deploy branch; the residual
  gap is UX/throughput architecture (streaming, worker pool, surface-collapse redesign), not
  clinical safety. Full write-up in `eval/og/SCORECARD.md`. Same lane pattern can be re-run per
  department as the dossiers land.

## Reference

- `docs/clinical-foundations.md` — the v1 breadth reference (all 10 depts, one page each). The dossiers here go far deeper.
- `DEPTH-BAR.md` — the non-negotiable depth standard every dossier must hit.
