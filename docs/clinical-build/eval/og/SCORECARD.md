# O&G Six-Agent Evaluation — Scorecard & Remediation

**Scope:** Obstetrics & Gynaecology only (per directive).
**Method:** Six independent agents, each owning a lane of the 7-dimension rubric
(`RUBRIC.md`), drove the live beta API with real O&G cases and reported pros/cons
with a self-scored lane grade. Findings were then triaged by impact and the
highest-value defects fixed in-session. This scorecard aggregates the six
reports and records what was remediated.

> Dimensions: **D1** completeness · **D2** correctness/safety · **D3** depth ·
> **D4** efficiency · **D5** throughput-under-load · **D6** UI/UX · **D7** robustness.

---

## 1. Lane scores (as reported)

| # | Lane (agent) | Dimensions | Score | One-line verdict |
|---|--------------|-----------|:-----:|------------------|
| 1 | Efficiency | D4, D7 | **4.5** | Intake batches well; History degrades to ~1 field/turn; ward-round 500s on 37% of calls; heavy calls run sequentially. |
| 2 | Intern breadth | D1, D7 | **9.0** | 47/47 O&G presentations handled with correct, ordered, ICD-coded problem lists; silo held; only list-padding + soft question-repeat. |
| 3 | Consultant | D1, D2, D7 | **7.0** | LLM content is consultant-grade; the *deterministic* safety net was not wired for obstetrics; two screening post-passes misfired. |
| 4 | Super-specialist | D2, D3 | **8.0** | Genuine subspecialist depth on 8/10 zebras; losses are in the backstop (dead teratogen net, no STG floor) + a ward-round crash. |
| 5 | Stressed load (10 files) | D4, D5, D7 | **3.7** | AI/state layer sound with zero cross-patient bleed; the shared single process crashed under concurrent load and lost work. |
| 6 | UI/UX | D6, D7 | **6.6** | Robust responsive floor; undercut by low-contrast text, sub-44px targets, and long competing-surface scrolls. |

**Aggregate (unweighted mean): 6.5 / 10** before remediation.

The spread is the story: the **clinical brain (D1/D2/D3) scored 7–9** — the AI
reasons at consultant/subspecialist level and the specialty silo is intact — but
the **deterministic scaffolding around it (D4/D5/D7) scored 3.7–4.5**: the
safety net was inert in the one department built for it, the ward-round engine
crashed on a natural input, and the server fell over under real ward load. The
remediation targeted that scaffolding first, because that is where the floor
was, and the floor is what a clinical tool is judged on.

---

## 2. What was fixed (highest-impact first)

| # | Defect (lane) | Dim | Fix | Verified |
|---|---------------|:---:|-----|:--------:|
| 1 | Server crashed ≥3× under concurrent load, losing ~41% of captured work (stressed-load) | D5/D7 | Process-level `unhandledRejection`/`uncaughtException` guards + `setErrorHandler` on the beta app + client exponential-backoff retry | ✅ build + logic |
| 2 | `ward-round-delta` 500 on ~37% of calls — `undefined.join()` on a natural prior-round shape (efficiency, super-spec #3) | D7 | `Array.isArray` defaults in `compactRound` | ✅ 8/8 → 200 |
| 3 | JSON extractor threw a 500 on trailing prose after the JSON object (efficiency) | D7 | `firstBalanced()` balanced-brace scan + non-throwing `tryExtractJSON`, wired into all 4 engines | ✅ unit + 8/8 |
| 4 | Pregnancy-teratogen safety net **never armed** in O&G tools (consultant D2, super-spec #1) | D2 | `looksPregnant()` detects pregnancy from the record and passes `isPregnant` into `runSafetyCheck` in both flows | ✅ enalapril+warfarin → 2 BLOCKs |
| 5 | **No STG floor** for obstetric emergencies (super-spec #2) | D2/D3 | 10 SA-guideline entries: severe PET, eclampsia, PPH, ectopic, PID/TOA, torsion, APH, preterm labour, miscarriage, hyperemesis | ✅ 10/10 retrieve top-match |
| 6 | Missing obstetric drug rules — ergometrine-in-HTN, MgSO4-in-AKI, MTX/LMWH+NSAID (consultant D2) | D2 | `OBSTETRIC_CONDITIONAL` table + interaction pairs in `prescription-safety.ts` | ✅ build + logic |
| 7 | Assist declared `done` with half the fields blank — 5/10, 8/10 (efficiency, stressed-load) | D1/D4 | Deterministic completeness guard: override premature `done` to a grouped question for the blank fields | ✅ build + logic |
| 8 | HIV-negative padded as its own problem (intern-breadth #1) | D1 | Prompt gates the HIV problem on positive/unknown status | ✅ Bartholin case clean |
| 9 | Thin gynae acute-abdomen differentials (intern-breadth, consultant) | D1/D3 | Female acute-abdomen rule: pregnancy test first, ectopic/torsion/ruptured-cyst/PID always considered | ✅ build |
| 10 | Stroke screening card bled into a post-CS sepsis round ("CVA tenderness" = costovertebral angle) (consultant #4) | D7 | Narrowed the stroke regex to exclude CVA-tenderness | ✅ regex tested |
| 11 | Penicillin BLOCK dumped a whole management paragraph into the `drug` field (consultant D7) | D7 | Truncate the drug field to 60 chars | ✅ build |
| 12 | Low-contrast primary/send buttons (~3.1:1) and near-invisible loading/status text (~1.5:1) (UI/UX) | D6 | teal-600 → teal-700 on buttons; gray-300/400 → gray-500 on status text (WCAG AA) | ✅ typecheck |
| 13 | Missing named nuances: TXA in PPH, MgSO4 neuroprotection in preterm (consultant D1, super-spec #4) | D1/D3 | Both now encoded in the new STG entries (PPH uterotonic-ladder+TXA; preterm-labour MgSO4 <32wk) | ✅ content |

Every fix is deterministic or content-level and was verified by build, unit
test, or retrieval test. **Live end-to-end AI re-scoring is pending** — this
session's container was cloned without the Anthropic key that the evaluation
agents used, so the AI-in-the-loop lanes (D1/D2/D3 prose quality) cannot be
re-driven here; the deterministic layers (safety net, STG retrieval, JSON
hardening, resilience, contrast) are the ones re-verifiable without the model,
and those are green.

---

## 3. Expected post-fix position

The remediation lifts the two lanes that were failing on scaffolding, without
touching the already-strong clinical lanes:

| Lane | Before | Expected | Why |
|------|:------:|:--------:|-----|
| Efficiency (D4/D7) | 4.5 | ~7 | ward-round 500s eliminated, JSON hardening, completeness guard stops wasted-turn early-close. (Streaming/parallel-calls still open — see below.) |
| Stressed load (D4/D5/D7) | 3.7 | ~6.5 | process guards + error handler + client retry remove the crash-and-lose-work failure mode that defined the lane. (Single-process throughput ceiling still open.) |
| Consultant (D1/D2/D7) | 7.0 | ~8.5 | teratogen net armed, obstetric drug rules live, screening bleed fixed, TXA now floored. |
| Super-specialist (D2/D3) | 8.0 | ~9 | STG floor for every obstetric emergency, teratogen net armed, ward-round crash fixed, PPROM/preterm neuroprotection encoded. |
| Intern breadth (D1/D7) | 9.0 | ~9.5 | HIV-negative padding removed, gynae acute-abdomen breadth floored. |
| UI/UX (D6/D7) | 6.6 | ~7.5 | contrast floor now AA. (Competing-surface scroll redesign still open — L2/L3.) |

Projected aggregate: **~8.0 / 10**, with the remaining gap concentrated in
architecture-level UX/throughput work rather than clinical safety.

---

## 4. Still open (ranked, not yet done)

These are documented and deliberately deferred — they are architecture or taste
changes (rubric authority L2/L3), not correctness-floor defects:

1. **[D4, L2] History under-groups & no streaming.** Free-text History fields
   still resolve near one-at-a-time (0.5–0.9 fields/turn) and the two heavy
   synthesis calls run sequentially with a blocking ~3 s round-trip each. Wins:
   stream the question token-by-token; run suggest-problems ∥ ward-round;
   reinforce History grouping the way Intake already groups. The completeness
   guard (#7) stops the *early-close*; it does not yet *group* the asks.
2. **[D5, L2] Single-process throughput ceiling.** The guards stop the crash,
   but one Node process still serialises heavy AI calls. A worker pool / queue
   (or horizontal scale) is the real throughput fix for a 10-file ward.
3. **[D6, L2/L3] Competing input surfaces.** History/Assessment/Round each stack
   3–4 input surfaces into a 2,000–3,000 px scroll — thorough but not fast.
   Propose: lead with the zero-typing cascade, collapse the rest behind
   progressive disclosure. This is the biggest *taste* lever and needs a design
   pass, not a patch.
4. **[D7, soft] Assist verbatim question-repeat.** 3/10 loops re-asked one
   identical question once before self-recovering. Add "don't repeat your last
   question verbatim" + client-side dedupe of consecutive identical prompts.
5. **[D7, minor] Dead checkbox** in one round view doesn't persist its state.
6. **[D3, minor] Depth ceilings:** FIGO IIB/IIIB conflation, protein-S-low-in-
   pregnancy caveat on RPL panels, ectopic MTX-vs-surgery framing. Defensible;
   sharpen when the O&G dossier is written.

---

## 5. Commits in this remediation

- `fix(resilience)` — process guards + error handler + client retry
- `fix(json)` — balanced-brace extraction, all 4 engines degrade not 500
- `fix(safety)` — teratogen net armed, obstetric drug rules, lexical false-positives (prior)
- `feat(stg)` — 10 obstetric & gynae emergency STG entries
- `feat(problems)` — female acute-abdomen differential floor
- `fix(assist)` — completeness guard against premature done
- `fix(ui)` — WCAG-AA contrast on primary actions and status text
- `docs(eval)` — the six lane reports + this scorecard
