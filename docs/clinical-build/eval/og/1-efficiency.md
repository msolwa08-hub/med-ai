# Efficiency auditor — O&G evaluation
Overall lane score: 4.5/10
D4 (Efficiency): 5/10 — Intake batches fields well, but every turn is a blocking ~3s round-trip with no type-ahead/streaming, History degenerates to near one-at-a-time, and the two heavy synthesis calls run sequentially. ~3 min of pure blocking wait per patient.
D7 (Robustness): 4/10 — assist and suggest-problems were rock-solid (0 failures, no loops, no field/key bleed), but ward-round-delta returned bare uncaught 500s on ~37% of calls (3/8) with total loss of work and no retry, and History silently declared "done" leaving up to half the required fields empty.

## Method
Timed harness (`scratchpad/audit-timing.mjs`, adapted from `sim-history.mjs`) drove an AI "intern/patient" through the full antenatal path for 3 scenarios — **severe pre-eclampsia**, **APH ?praevia**, **reduced fetal movements** — across the four AI stages in order: `/tools/assist` **Intake** → `/tools/assist` **History** → `/tools/suggest-problems` → `/tools/ward-round-delta`. Every HTTP round-trip was individually timed (`process.hrtime`), request-body bytes recorded, and fields-captured-per-turn diffed. n = 58 assist round-trips + 3 suggest-problems + 8 ward-round attempts. Root causes pulled from the live server error log (`/tmp/medai-eval.log`). Note: sibling eval agents were hammering the same single-process beta server throughout, and restarted it several times mid-run (see D7).

## Measured numbers

### Per-section turns / wall-clock / fields
| Scenario | Intake turns / wall / fields | History turns / wall / fields | suggest-problems | ward-round-delta |
|---|---|---|---|---|
| Severe pre-eclampsia | 9 / **40.1 s** / 13/13 | 10 / **49.2 s** / **5/10** | 200 / 38.2 s | **500** / 39.3 s |
| APH ?praevia | 9 / **43.8 s** / 13/13 | 10 / **61.7 s** / 9/10 | 200 / 42.6 s | 200 / 40.6 s |
| Reduced fetal movements | 11 / **60.4 s** / 13/13 | 9 / **48.1 s** / 8/10 | 200 / 38.8 s | **500** / 42.0 s |

**Turns to complete a patient:** Intake (9–11) + History (9–10) + 1 suggest-problems + 1 ward-round = **~20–23 AI round-trips**, every one blocking.

**End-to-end wall-clock per patient (successful path):**
- Severe PE: 40.1+49.2+38.2+39.3 = **166.8 s** (ward-round 500 → +~40 s resubmit ≈ 207 s)
- APH: 43.8+61.7+42.6+40.6 = **188.7 s**
- RFM: 60.4+48.1+38.8+42.0 = **189.3 s** (ward-round 500 → +~40 s resubmit)
- **Average ≈ 3.0–3.5 min per patient, 100% of it blocking wait.**

### Per-turn assist latency distribution (n = 58)
- min **1.38 s**, median **3.05 s**, p90 **4.80 s**, max **8.27 s**, mean **3.17 s**
- suggest-problems: 38.2 / 42.6 / 38.8 s (avg **39.9 s**), single blocking call
- ward-round-delta: ~39–42 s per call, single blocking call

### Fields captured per turn (efficiency ratio)
- **Intake — good batching:** capture sequence `[0,6,4,2,1,0,0,0,…]`. All 13 fields land by turn ~4 ("Name, age, ward, bed?" → "GA, LMP, EDD?" → "gravida, para?"), ratio **1.18–1.44 fields/turn**. But then **4–6 trailing turns capture 0 new fields** before `done` fires — pure dead round-trips (~15 s wasted/section).
- **History — poor:** ratio **0.50–0.90 fields/turn** (`[0,1,0,1,0,1,0,0,0,2]` etc). Effectively one-question-at-a-time on the free-text history fields, the opposite of Intake's grouping. Severe-PE captured only **5/10** history fields across a full 10 turns.

### Payload growth (transcript re-sent every turn)
- First-turn request **~780–800 B** → last-turn **2.8–5.2 KB** (**3.5×–6.7×** growth over a section). Cumulative bytes re-sent per section ≈ 15–30 KB (arithmetic series — the full transcript is POSTed again every turn, O(n²) in traffic).
- **Does latency climb with length?** Weakly. Pearson r(reqBytes, latency) = **0.34**. Bucketed: <1.5 KB payloads averaged **2.52 s**, ≥3 KB payloads **3.64 s** — so the growing transcript adds only ~**1.1 s** at the tail. Latency is dominated by model inference variance (max 8.3 s spikes uncorrelated with size), **not** by payload. Transcript capping helps traffic and tail latency modestly, but is not the main lever.

### Cumulative wait / no type-ahead
Confirmed in `apps/web/src/tools/AssistPanel.tsx:226` — the answer box is `disabled={busy}` with placeholder "Working…" for the entire round-trip. The intern cannot type the next answer while the current one is in flight, so the **~3.05 s median × ~20 turns ≈ 60 s of assist wait per patient is fully serialized** on top of think-time, plus two ~40 s blocking synthesis calls. Nothing streams.

## Pros (concrete, with evidence)
- **Intake field-batching works:** 13 admin fields closed in ~4 productive turns (`[6,4,2,1]`), ratio up to 1.44 fields/turn — far better than naive one-field-per-question.
- **assist and suggest-problems never failed:** 0/58 assist round-trips and 0/3 suggest-problems 500'd; no infinite loops (repeats = 0 across all sections, the 30-turn safety cap was never hit); no cross-section key bleed (server whitelists field keys, `tools-assist.ts:293`).
- **Predictable per-turn latency:** median 3.05 s, p90 under 5 s — responsive enough that the loop feels alive between the big synthesis calls.
- **Payload is not the bottleneck:** even at 6.7× growth the transcript adds only ~1 s, so the design tolerates long conversations without latency blow-up.

## Cons (concrete, with evidence — file/endpoint)
- **ward-round-delta returns bare 500s ~37% of the time (3/8 attempts), with total work loss and no retry.** Two independent uncaught faults in `apps/api/.../ward-round.ts`, both seen in `/tmp/medai-eval.log` this session (3× + 2×):
  1. `SyntaxError: Unexpected non-whitespace character after JSON` at `extractJSON (json-extract.js)` ← `ward-round.ts:101` — the model appends prose after the JSON object; the greedy `/\{[\s\S]*\}/` salvage path in `lib/json-extract.ts` still throws instead of degrading (reproduced single-caller, positions 757 & 980).
  2. `TypeError: Cannot read properties of undefined (reading 'join')` at `compactRound` — a `previousRounds` entry missing an array field crashes synthesis (on-disk source now guards this, but the running build still threw it live).
  The route returns only `{"error":"Ward round synthesis failed"}` (`tools.ts:183`) → the intern loses the whole round and eats another ~40 s resubmit.
- **Dropped history fields:** assist declared `done` at **5/10, 9/10, 8/10** required History fields. Half the pre-eclampsia history was left empty — a completeness *and* efficiency loss (10 turns spent, 5 fields captured).
- **~4–6 dead trailing turns per Intake** (0 fields captured but still a ~3 s blocking round-trip each) — the loop keeps asking after all fields are in.
- **suggest-problems and ward-round run sequentially** (~40 s + ~40 s = ~80 s) though they consume the same snapshot and are independent — ~36 s of avoidable serial wait per patient.
- **Shared single-process, in-memory beta server** was restarted mid-run by sibling agents, dropping in-flight requests as `fetch failed` (repro calls 3–6). No graceful drain; all state in RAM — a throughput/robustness hazard under concurrent use.
- **No type-ahead, no streaming:** input disabled every round-trip; the next question appears only after the full model call returns.

## Top 3 fixes (ranked by impact)
1. **Harden ward-round-delta so it can't hard-500 (biggest robustness + efficiency win).** Make `extractJSON` truncate to the first balanced JSON object (drop trailing prose) so the salvage path can never throw; keep the `compactRound` array guards on the running build; wrap the model call in one retry + a graceful-degradation fallback instead of a bare 500. Eliminates ~37% catastrophic failures and ~40 s of lost work per failure — the current correctness floor.
2. **Parallelise `suggest-problems` ∥ `ward-round-delta`, and batch History like Intake.** The two synthesis calls are independent — fire them concurrently to turn ~80 s of serial wait into ~42 s (**−36 s/patient**). In parallel, group related History fields into single questions the way Intake groups admin fields (raising ratio from ~0.6 to ~1.4), which roughly halves History turns (10→~5, **−20 s/patient**) and simultaneously reduces dropped fields.
3. **Type-ahead + streaming + stop-when-complete on assist.** Keep the answer box enabled and queue the intern's next answer during the round-trip (removes serialization of the ~3 s × 20 blocking waits), stream the next question token-by-token for perceived latency, and end each section the moment all required fields are captured to kill the 4–6 dead trailing Intake turns. Transcript capping (send last N turns + a running field-state summary) is a cheaper secondary lever — it trims the ~1 s tail latency and the O(n²) traffic but is not on the critical path.
