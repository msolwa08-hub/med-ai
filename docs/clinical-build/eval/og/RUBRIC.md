# O&G Evaluation Rubric — shared scoring system

Six persona-agents evaluate the Obstetrics & Gynaecology department of MedAI from
distinct scopes and grade against these dimensions. Every score is **0–10** with a
one-line justification. Each agent scores only the dimensions in its lane (marked),
lists concrete **pros** and **cons**, and ends with its **top 3 fixes** ranked by impact.

The app is running at `http://localhost:3000` (tools key `MEDAI-INTERN-DEV`).
The Anthropic key is in `/tmp/claude-0/-home-user-med-ai/713f0cde-1b40-5e52-ba24-9b3a217530b9/scratchpad/env.sh`
(`source` it for real AI calls). Endpoints: `/tools/assist`, `/tools/suggest-problems`,
`/tools/ward-round-delta`, `/tools/interaction-check`, `/tools/legal-form`,
`/tools/analyze-image`, `/tools/screening`. Web UI at `/tools`.

## Dimensions (0–10)

| # | Dimension | What 10 looks like | Lanes that score it |
|---|---|---|---|
| D1 | **Clinical completeness** | captures everything a consultant needs for the presentation; nothing important missable | Intern, Consultant |
| D2 | **Clinical correctness & safety** | AI outputs are clinically sound, STG/EML-aligned, no unsafe suggestions, safety net fires | Consultant, Super-specialist |
| D3 | **Depth & nuance** | handles the zebras and subtleties a subspecialist expects (MgSO4 titration, VBAC criteria, GA-specific mgmt, gynae-onc, early-pregnancy) | Super-specialist |
| D4 | **Efficiency** | fewest turns/taps/seconds and least lag to complete a patient | Efficiency, Stressed-intern |
| D5 | **Throughput under load** | 10 full maternity files (antenatal/labour/postnatal/perinatal) documented without state loss, slowdown, or breakage | Stressed-intern |
| D6 | **UI/UX quality** | seamless, quick, easy at phone/tablet/desktop; no correctness-floor defects; strong hierarchy | UI/UX |
| D7 | **Robustness** | never stalls, 500s, loses data, or bleeds other specialties in | all lanes note it |

## Scoring output (each agent writes `og/<agent>.md`)

```
# <Agent> — O&G evaluation
Overall lane score: X.X/10
D_: N/10 — justification
...
## Pros (concrete, with evidence)
## Cons (concrete, with evidence — file/endpoint/screenshot)
## Top 3 fixes (ranked by impact)
1. ...
```

## Agents & lanes
1. **Efficiency auditor** — D4, D7. Timed end-to-end throughput per patient.
2. **Intern (breadth)** — D1, D7. Run a WIDE set of obstetric + gynae diseases; is each handled, fields relevant, no cross-bleed?
3. **Consultant (correctness)** — D1, D2, D7. Judge the actual clinical outputs for soundness & safety.
4. **Super-specialist (depth)** — D2, D3. Judge nuance/zebras against subspecialist expectation.
5. **Stressed-intern (load)** — D4, D5, D7. 10 full maternity files, everything documented; measure throughput & integrity.
6. **UI/UX designer** — D6, D7. Drive the O&G flows in a real browser at 3 widths.

The orchestrator aggregates all six into `og/SCORECARD.md`, then fixes the highest-impact,
lowest-scoring items and re-scores.
