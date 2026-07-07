# Stressed-intern (load) — O&G evaluation
Overall lane score: 3.7/10

Lanes: **D4 (efficiency), D5 (throughput under load), D7 (robustness)**

Method: built 10 realistic maternity files spanning every sub-department and drove the
real AI documentation flow (`/tools/assist`, plus `/tools/suggest-problems` and
`/tools/ward-round-delta` for assessment/round) end-to-end via the API. Patients were
**interleaved by phase** (all 10 intakes, then all histories, then assessments, then
neonatal) to simulate a real intern ward-hopping and to maximally stress cross-patient
state. Two runs (full + a re-run of the sections a mid-run outage wiped). Simulated-intern
answers came from a second Claude call so the load is realistic, not scripted.

## The 10 patients (sub-department coverage)
| # | Patient | Ward | Presentation | Perinatal/neonatal |
|---|---------|------|--------------|--------------------|
| P01 | Nomsa Dlamini, 24 G2P1 28wk | Antenatal | Booked, low-risk | — |
| P02 | Thandeka Khumalo, 31 G1P0 35wk | Antenatal | **Severe PET** 168/112, proteinuria 3+ | — |
| P03 | Fatima Patel, 36 G3P2 30wk | Antenatal | **GDM** on insulin, prev macrosomia | — |
| P04 | Lerato Mokoena, 29 G4P3 32wk | Antenatal | **APH ?praevia**, HIV+ on TLD | — |
| P05 | Zanele Ndlovu, 27 G1P0 39wk | Labour | Early labour, HIV+, 4cm | HIV-exposed → NVP |
| P06 | Precious Sithole, 33 G3P2 40wk | Labour | Active labour, **meconium gr2, CTG decels** | at-risk neonate |
| P07 | Ayanda Mahlangu, 26 G2P2 D1 | Postnatal | **Post-NVD**, 2° tear, HIV+ | HIV-exposed on NVP |
| P08 | Busisiwe Zulu, 30 G2P1 D2 | Postnatal | **Post-EMCS** (fetal distress) | **neonatal jaundice** D2 |
| P09 | Refilwe Molefe, 34 G4P3 D1 | Postnatal | **Post-ELCS** (prev 2 CS) | prematurity 37wk |
| P10 | Grace Nkosi, 22 G2P1 34wk | Labour | **Preterm labour**, dexamethasone, HIV+ | prematurity → NVP/neonatal care |

## The numbers

**Completion under load (the headline):** of ~34 planned sections, **20 completed, 14 were
wiped by server outages** — a **41% loss rate**.
- Intake: **10/10** completed (98% field capture)
- History: **8/10** (98% capture) — P09, P10 lost to an outage
- Assessment/round (partogram-VE, mode-of-delivery branch, EPDS, antenatal problem list):
  **0/9 completed** — both runs hit a server restart precisely during the assessment phase
- Neonatal (HIV-exposed PCR/NVP, jaundice, prematurity): **2/6**

**Latency (app-assist):** mean **2.6 s/turn** (2696 ms run 1, 2520 ms run 2). It did **not**
degrade with volume — first-quartile 2803 ms vs last-quartile 1918 ms (the apparent
speed-up is an artifact of instant-failing 0 ms calls; among *successful* calls latency was
flat ~2.5–2.7 s from patient 1 to patient 10). Good.

**Efficiency (turns):** Intake averaged **10.1 turns to fill 13 fields** (~1.3 fields/turn);
History **9.5 turns / 10 fields**. The "group fields into one question" instruction
(commit 17da506, claimed ~45% fewer turns) is **not firing** — the AI still asks close to
one field at a time. At 2.6 s/turn that is **~26 s of pure AI wait per section**, plus
~23 s of answering → **~48 s wall-clock per completed section**.

**Throughput:**
- The naive run-1 figure of **54.6 patients/hour is false** — it is inflated because ~14
  wiped sections "completed" in ~0 s (instant ECONNREFUSED). Discard it.
- **Honest best-case, server healthy:** ~48 s/section → antenatal file (3 sections) **~2.4 min ≈ 25 pt/hr**;
  labour/postnatal + neonate (4 sections) **~3.2 min ≈ 19 pt/hr** of *pure documentation*,
  before real exam and ward context-switching.
- **Effective throughput under the observed concurrent load:** far lower. With a 41% rework
  rate (every wiped section must be re-clerked from scratch — no resume), sustained real
  throughput roughly **halves to ~9–12 pt/hr**.

**Cross-patient bleed: 0.** Interleaving 10 patients across the stateless API produced **no
state confusion** — no patient's name, HIV status, or gestation leaked into another's
questions or captured fields. The stateless-per-call design + client-passed transcript held
cleanly. When the mother hadn't delivered yet (P10), the neonatal section correctly recorded
`birthWeight: — (not yet delivered)` rather than fabricating a value — no hallucinated data.

## Robustness failures (D7)

The core D5/D7 failure is **infrastructure, not the AI flow**:
- The app is a **single, unsupervised `node apps/api/dist/beta-server.js` process shared by
  all six concurrent eval agents**. There is **no restart supervisor** (the built server is
  `node dist/...`, not `tsx watch`) and **no `uncaughtException`/`unhandledRejection`
  guard** in `beta-server.ts`.
- Under the combined concurrent load the process **crashed and flapped ≥3 times** during my
  two runs (observed PID **9454 → dead → 20191**, each restart mid-run). Failures were
  **instant `ECONNREFUSED`** (port closed = process gone), not 500s or timeouts.
- **Observed root crash trigger:** a sibling agent was looping `/tools/ward-round-delta` with
  `previousRounds` (the "reproduced compactRound 500 crash") — one crashing endpoint takes
  down the **whole shared process for every patient and every agent**.
- **Recovery is an ad-hoc race:** siblings run `curl .../health || nohup node ...beta-server.js &`,
  so whoever notices the corpse first respawns it — leaving multi-second-to-minute outage
  windows in which all documentation fails.
- **The client has no resilience:** the assist loop drops a section permanently on a single
  connection error. A one-shot 1.5 s retry rescued only **1 of 13** failures, because the
  outages are full restarts, not blips.

Positive robustness signals: 0 unhandled 500s from *my* well-formed requests (per-route
try/catch returns clean 500s), 0 parse-fallbacks, 0 dropped fields when the server was up,
graceful `—` handling for skipped/unknown fields, and no cross-patient bleed.

## Scores

**D4 — Efficiency: 5/10.** Per-turn latency is fine and stable (~2.6 s), field extraction is
accurate and dates are normalised — but it burns ~10 turns on a 13-field admin block when
grouping should close it in ~4–5. ~48 s/completed section is mediocre for a hands-busy intern.

**D5 — Throughput under load: 3/10.** Failed the lane's defining test: **could not document
10 full maternity files without state loss or breakage.** 41% of sections wiped; the entire
assessment/round phase (partogram, mode-of-delivery branching, EPDS) completed **zero** times
across both runs. Honest sustained throughput ~9–12 pt/hr, not the headline 54.

**D7 — Robustness: 3/10.** The *AI/state* layer is sound (no bleed, no hallucination, no
dropped fields, clean skips). The *availability* layer is unacceptable: a single unsupervised
process, one crashing endpoint that nukes everyone, no auto-restart, no client retry/queue.
Under real concurrent load it lost patient data repeatedly.

## Pros (concrete, with evidence)
- **No cross-patient bleed** across 10 interleaved patients (bleed check = 0/10); stateless
  API + transcript-in-payload is the right primitive for multi-patient work.
- **High-fidelity capture when up:** 98% field capture, dates → YYYY-MM-DD, G2P1/NKDA parsed
  correctly, `—` for genuinely-absent data, no fabricated neonatal values (P10 "not yet delivered").
- **Flat latency with volume:** patient 10 was no slower than patient 1 — the AI layer scales.
- **Graceful per-request errors:** well-formed requests never 500; skip/unknown never loops.

## Cons (concrete, with evidence)
- **Shared single point of failure:** `beta-server.js` (PID 9454→20191) crashed/flapped ≥3×
  mid-run; 14/34 sections and the *entire* assessment phase lost to `ECONNREFUSED`.
- **No auto-restart + no crash guard:** `beta-server.ts` has no `uncaughtException` handler;
  recovery depends on a sibling `curl || nohup node …` race with long outage windows.
- **No client resilience:** one connection blip permanently drops a section (retry saved 1/13);
  a real intern would have to re-clerk the whole patient.
- **Grouping under-delivers:** 10.1 turns for 13 admin fields → ~26 s of avoidable AI wait/section.
- **Assessment/round is the weakest link under load** — the longest, most clinically important
  sections (VE/partogram, CS-indication branch, EPDS) never survived to completion.

## Top 3 throughput fixes (ranked by impact)

1. **Supervise and isolate the server; harden the crashing endpoints.** Run it under a
   restart-on-exit supervisor (systemd/pm2/`--watch` with auto-restart) and add global
   `process.on('uncaughtException'/'unhandledRejection')` guards, plus input validation on
   `ward-round-delta.previousRounds` (the observed crash). **Impact: recovers the entire 41%
   of lost work** — turns a hard outage into, at worst, a sub-second blip. Biggest lever by far.

2. **Make the assist client resilient to the stateless API's advantage.** Add retry-with-
   exponential-backoff (spanning a full restart, ~5–30 s) and local persistence of the
   in-progress transcript, so a dropped call *resumes the same section* instead of discarding
   it. Because every call already carries the full transcript, replay is free. **Impact: would
   have saved ~29/30 of the failed calls** and eliminates re-clerking.

3. **Actually collapse the turns.** Make the grouping instruction fire (batch the admin block
   into one question; pre-fill deterministic fields client-side; extract multi-field intern
   utterances aggressively). Cutting Intake from ~10 to ~5 turns is **~40% fewer AI round-trips
   → ~40% less wait/section**, directly lifting pt/hr *and* shrinking the window in which an
   outage can strike a patient.
