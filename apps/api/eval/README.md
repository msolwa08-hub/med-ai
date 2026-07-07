# MedAI intern-tools evaluation harness

A reusable internal tool that scores the O&G intern tools **out of 100** by
driving the **live app API** through a full clerking exactly as an intern would —
clerk → problem list → ward round → consultant presentation — and grading the run
from four perspectives.

The app is an **aid**: the intern is still writing and thinking, so the tool
treats **speed as the point**. If a run is not faster than writing the note by
hand, it fails — no matter how good the output is.

## Perspectives (each /100, weighted into the overall)

| Perspective | Weight | What it measures |
|---|---:|---|
| **Speed & ease** (intern) | 40% | turns to clerk, characters typed, per-turn lag, and **time saved vs writing it by hand** |
| **Clinical quality** (consultant) | 30% | right working dx, expected problems, no wrong safety BLOCK, complete presentation |
| **Legibility** (human) | 20% | plain text, **no markdown** (hard-capped at 40 if stars reach a copy-to-paper output), structured, copyable |
| **Reliability** (system) | 10% | no 500s, latency in budget, no retries needed |

## Run it

```bash
# against a running MedAI server, with the app tools key
node apps/api/eval/run.mjs --base https://your-app --key <x-tools-key>

# or via env
EVAL_BASE=https://your-app EVAL_KEY=<key> node apps/api/eval/run.mjs

# one scenario
node apps/api/eval/run.mjs --scenario gynae-ectopic

# from apps/api
npm run eval -- --base http://localhost:3000 --key <key>
```

Set `ANTHROPIC_API_KEY` for a realistic **AI-intern** that answers the app's
questions from each scenario's facts (recommended — it makes the speed and
typing-burden numbers real). Without it the harness still runs but answers are
crude and only the reliability/legibility numbers are meaningful.

## Output

- A `/100` scorecard in the terminal, including a per-scenario **"app vs paper"**
  speed reality check.
- A dated markdown + JSON report in `apps/api/eval/reports/`.

## Add a scenario

Append to `scenarios.mjs`: give the patient `facts` (ground truth the AI-intern
answers from) and `expected` (working dx, problems, safety, what the presentation
must contain) so quality is scored objectively.

## Stress test — overwhelmed intern, full O&G range

The stress test is the real point: it behaves like an **overwhelmed first-day
O&G intern abusing the app** across the whole obstetric + gynae diagnosis range,
and asks whether the app is **easy enough for that intern AND sophisticated
enough for a consultant** — while catching the intern's mistakes.

For every scenario it runs the mistakes a real new intern makes:

| Mode | Behaviour |
|---|---|
| `clean` | honest, complete (baseline) |
| `terse` | time-pressured one-word answers, detail dropped |
| `skip` | omits critical fields (no time / forgot) |
| `misplace` | puts an answer in the wrong place / wrong area |
| `contradiction` | enters a fact that contradicts the clinical picture |

Each run is scored on three axes (each /100):

- **Accessible (intern)** — did it hand-hold and still produce usable outputs under abuse?
- **Sophisticated (consultant)** — dangerous-first differentials incl. the zebra, investigations-then-plan, the "why", and the mistake NOT corrupting the diagnosis.
- **Discrepancy alarm** — did the app **flag** the injected mistake (flag & guide, never block)?

```bash
node apps/api/eval/stress-run.mjs --base <url> --key <tools-key>
node apps/api/eval/stress-run.mjs --scenario gynae-ectopic --mode contradiction
npm run -w apps/api stress -- --base <url> --key <key>
```

The report ends with a discrepancy-detection roll-up: every injected mistake the
app should have flagged, and whether it did.

## Files

- `scenarios.mjs` — the O&G patients (obstetric + gynae breadth) and their
  expected consultant-grade outputs, critical fields, and injectable contradictions.
- `harness.mjs` — the /100 speed-inclusive run; drives the API, measures, scores.
- `run.mjs` — CLI for the harness.
- `stress.mjs` — the intern-mistake stress engine (mistake modes, 3-axis scoring).
- `stress-run.mjs` — CLI for the stress test.

All of it speaks HTTP only — it imports no app source, so it grades the shipped
product, not the code's intentions.
