# MedAI — Consultant-Depth Build Campaign

## Milestone drops (the master-plan spine — newest first)

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
- **M2 — the loop verified across departments — ✅ LOOP GATES PASSED LIVE**
  (2026-07-10): **Medicine 100/100, Surgery 100/100, Emergency 100/100, O&G
  regression 100/100**, ~8c/loop, <10c/prompt everywhere. The Emergency gate
  caught a real transient (max_tokens truncation → empty picture) now fixed
  with a cache-friendly retry in `confidence-engine.ts`. Gate record + raw
  reports: `eval/m2/`. Remaining M2 depth work: implement the
  Medicine/Surgery/Emergency dossiers into registries (smart-blocks, treatment
  sets, STG floors, investigation panels — field registry done for Medicine),
  then the per-department six-agent depth eval.

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
| Obstetrics & Gynae | 🟡 partial (v1 depth pass done) | 🟡 hardened via 6-agent eval | STG floor for 10 obstetric/gynae emergencies, teratogen net armed, female acute-abdomen differential, resilience + completeness guards — see `eval/og/SCORECARD.md`. Still: streaming, competing-surface redesign |
| Paediatrics | 🟡 partial (v1 depth pass done) | 🟡 partial | deepen: neonatology, PICU, syndromic reasoning |
| Orthopaedics | ✅ done (1593 lines) | ✅ implemented | own fields fragment (mechanism, Gustilo, neurovascular pre/post, weight-bearing), treatment sets (open #, compartment syndrome, septic arthritis, NOF pathway, cauda equina), NV/open-#/fracture-description blocks, msk panel, limb/life-threat lens; loop gate 100/100 live. See `implementation/orthopaedics.md` |
| Psychiatry | ⬜ not started | ⬜ not started | full differential incl. organic, MHCA, risk |
| Anaesthetics (NEW dept) | ⬜ not started | ⬜ not started | add as a department; ASA, airway, MH, regional |
| Family Med / PHC | ⬜ not started | ⬜ not started | consider — the district generalist lens |

Legend: ⬜ not started · ⏳ in progress · 🟡 partial · ✅ done

## Cross-cutting workstreams

- ✅ Investigation-trending companion (Results tab + deterministic delta rules) — `lib/investigations.ts`. Extend panels/rules per department as dossiers land.
- ⬜ Differential-engine: surface the consultant differential (incl. must-not-miss + zebra) from the presentation, not just a problem list.
- ⬜ "Normals" reference layer — what normal looks like per ward, inline.
- ⬜ Anaesthetics as a first-class department in `departments.ts`.

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
