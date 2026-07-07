# MedAI — Consultant-Depth Build Campaign

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
| Internal Medicine | ✅ done (1409 lines) | ⬜ not started | acid-base/RTA, Na+, anaemia, AKI workups — depth confirmed |
| Surgery (General) | ⏳ in progress | ⬜ not started | acute abdomen differential, indication-for-surgery, pre-op, post-op day framework |
| Emergency Medicine | ✅ done (1018 lines) | ⬜ not started | SATS, undifferentiated, tox, trauma |
| Intensive Care | ⬜ not started | ⬜ not started | FASTHUGS, organ-support framing, ventilation |
| Obstetrics & Gynae | 🟡 partial (v1 depth pass done) | 🟡 partial | deepen: full differential per presentation, gynae-onc, early-pregnancy |
| Paediatrics | 🟡 partial (v1 depth pass done) | 🟡 partial | deepen: neonatology, PICU, syndromic reasoning |
| Orthopaedics | ⬜ not started | ⬜ not started | fracture patterns, the limb-threat emergencies, spine |
| Psychiatry | ⬜ not started | ⬜ not started | full differential incl. organic, MHCA, risk |
| Anaesthetics (NEW dept) | ⬜ not started | ⬜ not started | add as a department; ASA, airway, MH, regional |
| Family Med / PHC | ⬜ not started | ⬜ not started | consider — the district generalist lens |

Legend: ⬜ not started · ⏳ in progress · 🟡 partial · ✅ done

## Cross-cutting workstreams

- ✅ Investigation-trending companion (Results tab + deterministic delta rules) — `lib/investigations.ts`. Extend panels/rules per department as dossiers land.
- ⬜ Differential-engine: surface the consultant differential (incl. must-not-miss + zebra) from the presentation, not just a problem list.
- ⬜ "Normals" reference layer — what normal looks like per ward, inline.
- ⬜ Anaesthetics as a first-class department in `departments.ts`.

## Reference

- `docs/clinical-foundations.md` — the v1 breadth reference (all 10 depts, one page each). The dossiers here go far deeper.
- `DEPTH-BAR.md` — the non-negotiable depth standard every dossier must hit.
