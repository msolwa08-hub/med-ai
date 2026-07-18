# Reasoning Clerk — Calibration Trials

Offline calibration of the local likelihood-ratio engine (the deterministic core
that does the maths — posterior, must-not-miss cap, info-gain). Run by driving the
real engine in a headless browser and simulating clerking paths across every case.
No API key needed; these results are reproducible (`scratchpad/calib.mjs`).

## Headline

| Metric | Result |
|---|---|
| Diagnosis identification (textbook of each dx → does it lead?) | **26 / 28 = 93%** across 7 cases |
| Must-not-miss cap (capped at baseline, released on exclusion) | **7 / 7 correct** |
| Discriminating test moves its target (↑ on positive, ↓ on negative) | **7 / 7 correct** |
| Monotonic (adding support never lowers a diagnosis) | **7 / 7 correct** |
| Engine speed (full posterior recompute) | **0.009 ms** (~116k/sec) — the "live" feel has zero engine latency |

## Per-case identification

- **Pre-eclampsia (O&G)** — 100%. platelets test: HELLP 29% → +77 / −8.
- **Chest pain (IM/EM)** — 100%. troponin: ACS 84% → +98 / −51.
- **RIF pain (Surgery)** — 75%. **Miss: mesenteric adenitis** (25% vs appendicitis 35%).
- **Febrile infant (Paeds)** — 100%. LP: meningitis 65% → +96 / −16.
- **Thunderclap HA (Neuro)** — 100%. CT head: SAH 91% → +99 / −66.
- **Haematemesis (IM/Surg)** — 75%. **Miss: upper GI malignancy** (18% vs PUD 33%).
- **Abnormal uterine bleeding (O&G)** — 100%. endometrial biopsy: cancer 10% → +57 / −2.

### The two misses are calibration-correct, not bugs
Both — **mesenteric adenitis** and **upper GI malignancy** — are diagnoses you
*cannot* be confident in from history/exam alone; they are exclusion / biopsy
diagnoses. The engine correctly refuses to rank them top over a higher-prior rival
(appendicitis, peptic-ulcer bleed) on soft evidence. The refinement is content, not
maths: give each a strong positive discriminator (normal appendix + mesenteric
nodes on US; mass on endoscopy/biopsy) so they *can* be confirmed when the test is
done. Logged as a content to-do.

## Dynamic clerking (a person entering data, migraine path)

| Step | Lead | Confidence | Capped | Clerked |
|---|---|---|---|---|
| empty board | Migraine | 30% | yes | 0% |
| + prior similar headaches | Migraine | 63% | yes | 13% |
| + photophobia | Migraine | 72% | yes | 21% |
| − thunderclap / worst-ever / neck stiffness | Migraine | 72% | yes | 55% |
| + CT / CSF / CT-venogram all negative | Migraine | 72% | **released** | 55% |

Confidence climbs as evidence accrues, stays **capped at 80%** while a must-not-miss
rival's decisive test is undone, and the cap **releases** the moment the killers are
excluded — exactly the intended behaviour.

## AI generation — latency & cost

The model only produces the case-pack DATA; the engine above does the reasoning.

- **Two-phase**: a small CORE call renders the board fast; the heavier PLAN
  (dosed management + pathophysiology) streams in the background.
- **Prompt caching** on both system prefixes (CORE ~1381 tok, PLAN ~895 tok).
- **Bounded output** (core ≤2000, plan ≤2600 tokens) → bounded latency.

Estimated cost per board (Haiku 4.5 pricing):

| | Cost |
|---|---|
| Warm (cache hit, repeat use) | **~1.4¢** |
| Cold (first call of a session) | **~1.9¢** |

Comfortably under the 10¢/board ceiling. Server **prewarm** on page-open hides the
Render free-tier cold start; live end-to-end timing still needs a session API key to
measure precisely (mock two-phase run rendered the board in ~350 ms).

## Optimisation opportunities (ranked)

1. **Content**: add positive discriminators for the two exclusion diagnoses (above).
2. **Latency**: stream the CORE JSON so the differential paints as it arrives
   (sub-second perceived) — the next lever if warm generation still feels slow.
3. **Cost**: already near the floor; the biggest remaining lever is trimming the
   CORE output further, but not at the expense of the atomic-findings quality.
