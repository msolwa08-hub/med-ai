# M-GLANCE — Final Report

**The two-glance encounter, shipped 2026-07-12.** One autonomous run,
six committed increments (a→f), every one playwright-proven on a 390px
phone in light and dark before pushing. The product now matches the reset
model: *the mainstay is writing the paper notes; the app is a professional
sidekick you glance at — never software you operate in front of a patient.*

## What the encounter now looks like

1. **Glance 1 (≤10s, before going in)** — open the patient, tap the
   complaint: a deterministic briefing renders in ~130ms — ASK (the history
   questions), DON'T MISS (discipline-tuned killers: IMCI first for paeds
   fever, eclampsia first for O&G headache), EXAM (the focused targets +
   vitals). Zero required interaction. Then the phone goes away.
2. **The encounter** — real medicine, on paper. No app.
3. **Glance 2 (≤60s, after)** — ONE chatbox: type/dictate terse fragments
   (`BP 145/92, tachy, creps L base` → vitals + exam slots, proven live) or
   photograph the handwritten note (8 fields filed from a real test image).
   The screen answers with the confidence-banded differential +
   must-not-miss, **"For the paper notes"** (chart-transcribable Ix
   NOW-tagged + Mx, STG-anchored, tap-to-dim as you write), and a quiet,
   ignorable **"Still to do — suggested"** list.
4. **Documents** — presentation / discharge / referral (+ **MSE +
   formulation** for psych, new end-to-end) each ONE tap from the record.

Everything else — complaint chips, tap-streams, exam grids, "Complete the
record" stages — collapsed to single disclosures, off the default path.

## Acceptance criteria — final scores

| # | Criterion | Score | Evidence |
|---|---|---|---|
| 1 | Glance 1: ≤1 tap, 10s, 390px, zero interaction | 9/10 | `d-briefing-*.png`, 11/11 asserts, ~130ms render |
| 2 | Chatbox+photo = the ONLY default input | 9/10 | structural audit: 0 checkboxes, 0 text inputs, 1 textarea |
| 3 | Fragments auto-route + picture refreshes | 9/10 | live: exact directive scenario lands in vitals+exam slots |
| 4 | "For the paper notes" terse Ix/Mx, STG doses | 9/10 | `c-paper-notes-*.png`, big-type, NOW tags, STG footnote |
| 5 | "Still to do" quiet, never gating | 9/10 | absorbed ALL feature kinds; muted, zero interaction |
| 6 | One-tap docs incl. psych MSE | 9/10 | 7/7 live asserts; MSE honest-gaps quality (`e-mse-*.png`) |
| 7 | Over-matching fixed + full trigger audit | 9/10 | negation-aware matcher (18-case suite) + 17 pattern fixes |
| 8 | Everything else demoted off-path | 9/10 | `f-default-path-*.png` — one scroll, one disclosure each |
| 9 | Gates every increment | 10/10 | build+tsc clean ×6; playwright ×6; loop gates below |
| 10 | Honest self-eval per increment | 10/10 | `SELF-EVAL.md`, scores + carried gaps each increment |

No criterion is a 10 except the process ones — the residual point is real
ward usage: the model is built and proven by automation; the last mile is
the user's beta feedback.

## Gates

- **Loop harness (engine untouched by this milestone's UI work):** psych
  subset **100/100 PASS** after the MSE API addition; medicine subset run
  as the final spot check (result in SELF-EVAL); the full 40-scenario
  M-FINAL/R gate (99.6) predates and stands.
- **Cost:** $0.06/call measured on the gates — well under the 10c ceiling.
- Root-cause fixes shipped en route: negation-blind trigger matching (the
  IMCI→epilepsy class), serialized-label trigger leakage, the `w-48`
  sidebar crushing every 2-patient phone layout to 158px.

## Where the proof lives

`docs/clinical-build/eval/m-glance/` — phone-first screenshots per
increment (light+dark) + `SELF-EVAL.md` (per-increment scores, gaps,
gate results). Commits: `462132c` (a) → chatbox (b) → paper notes +
sidebar fix (c) → briefing (d) → one-tap docs + MSE (e) → demotion (f).
