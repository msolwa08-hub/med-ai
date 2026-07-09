# M1 — The Bedside Loop (O&G) — Milestone Scorecard

**Status: PASSED.** The heart of the aide — a live differential that reasons,
recommends discriminating tests, and updates decisively when results land — is
built, live-verified, and within cost.

## The loop, gated live

`apps/api/eval/loop-run.mjs` drives `/tools/working-picture` twice per scenario
(findings → then a discriminating result with the previous picture) and scores
whether the loop actually worked: right dx present, discriminator named,
must-not-miss stated, **confidence moved the right way**, shift narrated.

| Scenario | Loop | The move |
|---|---:|---|
| Severe PET → HELLP on bloods | 100 | HELLP **40% → 92%** |
| Early-pregnancy pain → ectopic on TVS | 100 | Ectopic **75% → 93%** |
| Preterm labour → chorioamnionitis on sepsis markers | 100 | Chorio **55% → 92%** |

**Loop score: 100 / 100 (bar ≥ 90).** Every run: dx present ✓, discriminator
named ✓, must-not-miss ✓, direction correct ✓, narrated ✓.

## Cost (measured, not guessed)

`/tools/usage-stats` telemetry over the gate run: **$0.084 per full loop**
(two picture calls), **$0.051 max single call** — under the **<$0.10/prompt**
ceiling. Runtime is Sonnet 5; the assist endpoint's static prefix is
prompt-cached.

## What shipped in M1

- **Confidence engine** (`confidence-engine.ts` + `/tools/working-picture`):
  ranked differential with calibrated confidence, per-dx discriminators (what
  moves it, which way, done/pending/suggested), result-driven reconciliation
  that narrates every shift. STG-anchored; drug-safety + teratogen net over
  management; plain-text; teach-while-you-work "why" on every element.
- **Working Picture UI** on Clerk (build from clerking) and Results (a landed
  result visibly moves it) — screenshots in `m1-screens/`, desktop + phone.
- **Model + cost layer** (`lib/models.ts`): Sonnet 5 reasoning tier, Haiku fast
  tier, prompt caching, per-call usage/cost telemetry.
- **Beta rig**: one-tap ward feedback (`/tools/feedback`) + practice-patient
  mode, so real-life testing can begin and its feedback drives iteration.

## Proof

- `m1-screens/01-picture-from-clerking.png` — the differential built from a
  severe-PET clerking, with "what would move this".
- `m1-screens/02-loop-closed-results-shift.png` — HELLP bloods land; HELLP jumps
  35→80, abruption drops, "what changed" narrative, sharpened plan.
- `m1-screens/03/04` — the same on a phone.
- Loop harness reports in `apps/api/eval/reports/loop-*.json`.

## Two bugs the harness caught (and fixed)

1. The gate initially read 60/100 with confidence frozen — the harness posted
   `resultText` where the API reads `resultsText`, so results never reached the
   engine. Field name corrected; the engine itself was always right (the UI hook
   sent the correct key, which is why the on-screen loop worked).
2. Engine hardened regardless: results now surface as a prominent "NEW RESULTS
   SINCE YOUR LAST PICTURE" block with an explicit demand to move decisively on
   a confirmatory result rather than nudge.

## Next (M2)

Replicate the loop into the next department (Internal Medicine — its dossier is
already banked), same gate: per-department loop scenarios ≥ 90 live, cost report,
recorded walkthrough, clinical-content summary for review.
