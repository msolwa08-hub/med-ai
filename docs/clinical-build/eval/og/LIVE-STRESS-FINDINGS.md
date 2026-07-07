# O&G stress test — live run findings & fixes

Run against a live local MedAI server (Sonnet-powered app; Haiku playing the
overwhelmed intern), using `apps/api/eval/stress-run.mjs`. This records what the
live test surfaced and the fixes it drove — the "test → failure → fix → re-test"
loop, on real model output rather than static inspection.

## Method

- Scenarios across the O&G range; each run under mistake modes an overwhelmed
  first-day intern makes: `clean`, `skip` (omission), `misplace` (wrong
  place/area), `contradiction` (self-inconsistent input).
- Three axes /100: **Accessible** (hand-holding + usable output under abuse),
  **Sophisticated** (dangerous-first dx incl. zebra, Ix→plan, the "why", mistake
  not corrupting the diagnosis), **Discrepancy alarm** (did it flag the mistake).

## What the live run found → what was fixed

| # | Finding (live) | Fix |
|---|---|---|
| 1 | Contradiction was caught by the app's LLM, but the **deterministic net missed it** — it only scanned the `pregnancyStatus` field, so a "not pregnant" note typed in the wrong place slipped through. | Net now scans the **whole record**; a misplaced contradiction is flagged wherever it lands. |
| 2 | Splitting that out risked a **false alarm** on a genuinely non-pregnant gynae patient (LMP is not evidence of a current pregnancy). | Separated current-pregnancy markers (GA/EDD/fetal) from LMP; verified non-pregnant-with-LMP stays quiet. |
| 3 | **Severe PET, skip mode:** intern omitted BP, proteinuria and GA on a pre-eclampsia presentation and the app said **nothing** (discrepancy 0). The "forgot under pressure" case. | Net now alarms when a hypertensive/pre-eclampsia picture in a pregnancy context has **no BP recorded** — "measure and record BP + urine protein." Silent on PET-with-BP and normal patients. |

## Scores (representative)

| Scenario | Overall | Access | Reason | Discrepancy |
|---|---:|---:|---:|---:|
| Ovarian torsion | 98 | 100 | 95 | 100 |
| Endometrial-Ca (PMB) | 90 | 93 | 86 | 100 |
| Severe PET — before fix #3 | 81 | 93 | 85 | **50** |
| Severe PET — after fix #3 | **94** | 93 | 90 | **100** |
| Ruptured ectopic | 97 | 100 | 94 | 100 |

By mistake mode (pre-fix broad run): contradiction 97 (caught 3/3), misplace 90,
skip 82 (caught 2/3 → 3/3 after fix #3).

## Still open (softer signals, not yet fixed)

- **Reasoning thin on some scenarios** — the ward-round `consultantLogicExplanation`
  came back short on PET, capping its Sophisticated score at the "reasoning"
  component. Worth deepening the delta prompt for hypertensive disease.
- **Misplace mode** occasionally leaves one output surface unpopulated (PMB
  scenario Accessible 80), i.e. wrong-area input isn't always re-routed.
- Coverage so far is a subset (ectopic, torsion, PMB, severe PET). The remaining
  obstetric emergencies (eclampsia, PPH, abruption, preterm, IUFD) and gynae
  (PID/TOA, fibroids/AUB) are scripted and ready to run.

## How to reproduce

```bash
npm run -w apps/api stress -- --base <url> --key <tools-key> \
  --scenario antenatal-severe-pet --mode skip,misplace,contradiction --turns 6
# set ANTHROPIC_API_KEY for the realistic AI-intern
```
