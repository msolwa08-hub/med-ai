# M2 gate — the bedside loop across departments, live

**Date:** 2026-07-10 · **Engine:** `confidence-engine.ts` (Sonnet 5, prompt-cached)
· **Harness:** `apps/api/eval/loop-run.mjs --dept <d>` (HTTP-only, grades the shipped product)

The M1 loop — clerk → weighted differential → discriminating investigations →
result lands → confidence shifts visibly, narrated — verified live in three new
departments. The engine is department-generic by design (specialty lens per
dept); M2's question was whether the *quality* holds outside O&G. It does.

## Scores (all live, first eligible run)

| Department | Scenarios | Score | Cost/loop |
|---|---|---|---|
| Internal Medicine | ACS on troponin+ECG · DKA on VBG+ketones · PTB on GeneXpert · decompensated HF on NT-proBNP | **100/100** | ~$0.078 |
| Surgery | appendicitis on US+markers · perforation on erect CXR · SBO on CT · cholecystitis on US | **100/100** | ~$0.078 |
| Emergency | SAH on CT · ischaemic stroke (bleed excluded) · paracetamol on timed level · septic shock on lactate | **100/100** | ~$0.080 |
| O&G (regression) | HELLP · ectopic · chorioamnionitis | **100/100** | ~$0.080 |

Re-run 2026-07-10 **after** the Surgery + Emergency dossiers were implemented into
the registries (fields, panels, treatment sets, smart blocks) and their AI
discipline lenses enriched: **Surgery 100/100, Emergency 100/100** held — no
regression from the added content. Clinical-content review batch:
`../../implementation/surgery-emergency.md`.

Every scenario: correct diagnosis present at step 1, the discriminating test
named against it, a must-not-miss stated, the confidence moved in the right
direction when the result landed, and the shift narrated. Raw reports in
`apps/api/eval/reports/loop-<dept>-2026-07-10*.json`.

## The one failure this gate caught (and fixed)

Emergency's first run scored 82.5: the paracetamol scenario returned an **empty
picture at step 1** — `stop_reason=max_tokens` truncation on a verbose sample
made the JSON unparseable. Same input succeeded on manual repro, i.e. a
transient, not a content gap.

**Fix (`confidence-engine.ts`):** one retry on truncation/empty-parse with a
6000-token budget and a sterner brevity directive appended on the *user* side
(the cached system block stays byte-identical, so the retry still hits the
prompt cache). Re-run: 100/100. This also hardens the production path the beta
user hits — an empty "could not build the working picture" now needs two
consecutive failures, not one.

## Cost

~4c/call, ~8c per full clerk→result loop, max single call ≤ $0.062 — the
sub-10c/prompt line holds with headroom across all four departments.
