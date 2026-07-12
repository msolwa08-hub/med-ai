# MedAI — Consultant-Depth Build Campaign

## ▶▶ M-GLANCE — ✅ SHIPPED & CERTIFIED (2026-07-12; see eval/m-glance/REPORT.md)

**The two-glance encounter is built, proven and pushed** — six increments
(a→f), each gated (build+tsc, phone-first playwright light+dark, loop where
the API was touched: psych 100/100 + medicine spot check). Final scores and
proofs: `docs/clinical-build/eval/m-glance/` (REPORT.md + SELF-EVAL.md).

**Directive to future autonomous ticks:** M-GLANCE is DONE — do not rebuild
it. Do NOT start a new milestone without fresh user direction: the model was
user-reset once and can be again; the next input is the user's real-ward
beta feedback. A tick that fires now should only (1) verify deploy health,
(2) fix anything broken with the standard gates, (3) triage any user
feedback into the backlog. Retired priorities (M-UI/2 framing, tap-driven
cockpit) STAY retired.

### The model as shipped (kept for reference — the user's own words, condensed)
The mainstay is WRITING THE PAPER NOTES. The app is a professional sidekick you
glance at — never software you operate in front of a patient.
- **Glance 1 (≤10s, before the encounter):** based on the discipline +
  complaint, show exactly what history to take, what not to miss, what the exam
  should focus on — one glanceable briefing, then the phone goes away.
- **The encounter:** no app. Real medicine. Paper.
- **Glance 2 (≤60s, after):** ONE chatbox (type/dictate terse fragments —
  "tachy", "creps L base", "BP 145/92") and/or PHOTOGRAPH the handwritten note.
  Everything routes itself — the user must NEVER hunt for a field, tick a box,
  or fill a form. Screen then leads with: compact working picture (differential
  + must-not-miss) and a **"For the paper notes" block** — investigations +
  management as terse chart-ready lines to transcribe — plus a quiet, ignorable
  **"Still to do — suggested"** list.
- **On-demand documents:** consultant ward-round presentation, discharge
  summary, referral letter, MSE formulation — one tap, from everything
  accumulated (including photo-ingested notes).

### Acceptance criteria (self-evaluate every increment against these)
1. Glance 1 reachable in ≤1 tap from opening a patient; readable in 10s on a
   390px phone; zero required interaction.
2. Zero ticks, zero forms, zero field-hunting on the default path. The chatbox
   (with photo button) is the ONLY input surface on the main path.
3. Fragments typed into the chatbox land in the right record slots and refresh
   the picture (playwright-proven: "BP 145/92, tachy, creps L base" → record).
4. "For the paper notes" block: terse, big-type, chart-transcribable Ix + Mx;
   doses only STG-anchored and flagged for clinician sign-off if unverifiable.
5. "Still to do" renders as quiet suggestions — ignorable, never gating.
6. Docs (presentation / discharge / referral / MSE) each one tap from the
   record; MSE formulation added for psych.
7. Content fine-tune: fix the class of over-matching bugs — e.g. the epilepsy
   smart-block (`smartBlocks.ts` pattern `/…|convuls|…/`) fires because the
   paeds IMCI danger-sign text writes "convulsions" into every sick-child
   record → epilepsy workup in a GIT case. Audit ALL regex triggers
   (smartBlocks, examChecklists conditionals, treatmentSets, adaptive content)
   for word-boundary/negation/context errors; dept-scope where needed.
8. Demote (don't necessarily delete) everything else: stages/"Complete the
   record" forms, ConfirmStream tap-streams, exam grids, DetailsList-first
   history — allowed to exist off-path only if they add zero navigation burden
   to the default flow.
9. Gates every increment: web build + typecheck clean; loop-run ≥90 if the
   engine/API is touched; playwright drive + screenshots (phone 390px first,
   light+dark) recorded to `docs/clinical-build/eval/m-glance/`; committed +
   pushed (auto-deploys).
10. Self-evaluation record: `docs/clinical-build/eval/m-glance/SELF-EVAL.md` —
    after each increment, score criteria 1-9 honestly, list gaps, iterate until
    all green; then final certify + report.

### Standing constraints (unchanged)
Live key only in gitignored `apps/api/.env` (never commit/print). No free-hand
drug doses — research→implement→flag for clinician sign-off. Push ONLY to
`claude/ai-medical-history-app-1lh4wv`. No PRs unless asked. Screenshots are
the only accepted proof of UI claims.

## Milestone drops (the master-plan spine — newest first)

- **M-GLANCE — the two-glance encounter — ✅ SHIPPED & CERTIFIED**
  (2026-07-12). The user's product-model reset, built in six gated
  increments in one autonomous run. **(a)** negation-aware trigger matching
  (`lib/clinicalText.ts`) killed the IMCI→epilepsy over-match class + a
  17-fix regex audit across all four trigger registries. **(b)** THE
  chatbox: QuickBar promoted to the always-visible single input — fragments
  ("BP 145/92, tachy, creps L base" → proven into vitals/exam slots) and a
  Photo button through the scan pipeline. **(c)** "For the paper notes"
  (chart-transcribable Ix NOW-tagged + Mx, STG footnote, tap-to-dim) +
  quiet "Still to do"; also fixed the w-48 sidebar crushing 2-patient phone
  layouts. **(d)** Glance 1: deterministic ~130ms pre-encounter briefing
  (ASK / DON'T MISS / EXAM; `config/briefings.ts`, 20 complaints,
  dept-tuned killers, no doses) that auto-yields once findings land.
  **(e)** one-tap documents + new psych MSE + formulation end-to-end
  (`/tools/mse-formulation`; psych loop gate 100/100 after). **(f)** the
  demotion pass — structural proof: 0 checkboxes, 0 text inputs, exactly 1
  textarea on the documented-encounter default path. Full proofs:
  `eval/m-glance/` (REPORT.md, SELF-EVAL.md, phone-first screenshots ×6
  increments, light+dark).
- **M-UI/8 — a premium first impression — ✅ SHIPPED** (2026-07-11). The first 5
  seconds, three parts. **A** (`30ee14a`): warmed the cold `AccessKeyGate` (a
  product story — live differential / focused exam / the note falls out — before
  the key box) and unified the `DeptSelector`/`SubDeptSelector` (both on
  `bg-canvas`, matched tiles, staggered fade-up). **B** (`9fe178d`): the START
  moment leads — the Presenting-complaint card is now first (the Full record /
  Documents utility row moved below the hero), warmer first-run copy. **C**: a
  "See it in action — load an example patient" affordance on a fresh empty
  patient (`lib/demoPatients.ts` — one worked presentation per department,
  presentation data only, no doses) that seeds the record and lets the live
  picture build itself, so a newcomer instantly watches the whole loop (e.g. med
  chest-pain → ACS 75% must-exclude + For/Against + discriminating ECG/troponin).
  Fixed the Practice dead-label bug (now "Practice"/"Practice on"). Frontend
  only → loop gate 99.6 stands. Playwright-proven; before/after (light+dark,
  desktop+phone) in `eval/m-ui8/`.
- **M-UI/7 — friction-free, differential-driven clerking — ✅ SHIPPED**
  (2026-07-11). User rated clerking 3/10 UI, 2/10 practicality; four principles:
  minimal barrier to entry, engine thinks differentials from the first answers,
  exam **focused + nothing required**, checklist is for **values** (type every
  value). Frontend-only (engine already emits everything) → loop gate 99.6
  unaffected. **Part A** (`72ee083`): nothing in the exam is "required" — dropped
  the `mandatory` flag + amber/"key" UI; removed the redundant 2nd Examination
  AssistPanel. **Part B** (`79ec646`): the exam is FOCUSED and differential-driven
  — the Examine stage leads with the engine's `kind:'exam'` discriminating
  features (the ≤8 signs that separate the leading diagnoses, e.g. chest pain →
  calf tenderness/PE, chest-wall tenderness/MSK) as value rows; the full
  department survey is demoted to a one-tap disclosure; `ConfirmStream` keeps
  only the `kind:'history'` "ask the patient" taps so nothing is asked twice.
  **Part C**: a *simple* history — the History stage now leads with a value-first
  `DetailsList` of the essentials (HPI/PMH/meds/allergies) that you type; the
  16-question AI interview is demoted to an opt-in ("or let the AI interview the
  patient") and background/ROS/social/admin to a "More history" disclosure. Plus
  a one-tap **Carry to problem list** on the working picture — the leading
  differential (its rivals as the differential, the picture's "do now" as the
  management) flows straight into `patient.problems`, no separate tab/manual
  Suggest. All Playwright-proven end-to-end (value-first history default, bridge
  seeds Problems, values serialize into the record).
- **M-UI/6 — values-first exam capture — ✅ SHIPPED** (2026-07-11). Direct user
  feedback: ticking a checklist AND typing the values elsewhere is double work
  (practicality 4/10), and the exam must follow the history, asking only what
  the story makes pertinent. Killed the tick-checklist (`ExamChecklist.tsx`
  removed): `ExamCapture.tsx` makes the VALUE the capture — vitals are a value
  grid (typing "145/92" IS the record, serialized into `assessment.vitals`),
  every pertinent exam target is a finding row (one-tap **NAD** or type the
  actual finding, serialized as real clinical lines — "Lung fields: bibasal
  crepitations" — into `assessment.examination`, replacing the old
  "Exam done: BP recorded" ceremony text). Captured cells turn teal, real
  findings turn amber; "done" is derived from values existing — no checkbox
  anywhere. The targeted section stays presentation-driven and a hint ties the
  list to the history. Playwright-proven: typed values verified IN the record
  text end-to-end. Proof: `eval/m-ui6/` (before/after + filled + record-proof).
- **M-FINAL/R — end-to-end certify + deploy — ▶ IN PROGRESS** (2026-07-11).
  Finishing the whole build into a deployable product. **R0 shipped** (`8c0c8fd`):
  the ward-round-delta engine was returning empty core fields — two compounding
  causes fixed and verified live on a severe pre-eclampsia → HELLP trajectory
  (all six fields + screening + safety populate; the exam read flags the
  trajectory discordance and MgSO4-in-oliguria toxicity): (1) brittle
  `content[0]` extraction that dropped the JSON whenever the model emitted a
  leading non-text block — replaced with all-text-block concatenation at every
  live-path Anthropic JSON call-site (ward-round, image-analysis, clinical-forms,
  clinical-package, eml, beta-engine ×2), matching the confidence-engine pattern;
  (2) `max_tokens: 1800` truncating the six-field round (measured 2938 tokens) —
  bumped to 4000 (image-analysis 1500→2200). Also: the `/tools/ward-round-delta`
  route was dropping `history`/`generalExam`/`focusedExam` though the client
  sends them, so the exam-synthesis "expected vs actual" read ran blind — now
  forwarded. Certification underway: typecheck/lint/audit/build all green; the
  full 9-department loop gate (40 scenarios) re-running as confirmation (R0 does
  not touch the working-picture engine the loop scores); then eval + stress +
  deploy-readiness report. Deploy: `render.yaml` auto-deploys this branch on push
  (`medai-beta`, `/health`, secrets `sync:false` set in the Render dashboard).
- **M-UI/5 — organ-system schematic (pivot) — ✅ SHIPPED** (2026-07-11).
  Superseded the ABG/anaemia gauge maps + per-analyte sparklines (`acidBase.ts`,
  `AnaemiaMap.tsx`, `AnalyteSparkline.tsx`, `InvestigationInsights.tsx` removed)
  with a single **data-driven organ-system schematic** — `lib/systemsMap.ts`
  (deterministic: analytes + weighted differential → lit systems, active edges
  when both endpoints fire, dx rings) + `SystemsMap.tsx` (theme-aware SVG),
  wired into `ResultsCapture.tsx`. "See what's wrong with the body at a glance"
  beside the interpretation. Also this drop: **For/Against factors** on every
  differential (+ Story→History rename) and the **progress-log day-by-day
  timeline** surfaced in RoundTab with Copy-all (`patient.progressLog` was
  written but never shown). Pure client layer — loop score carries over.
- **M-UI/3 — polish toward 10/10 — ✅ SHIPPED** (2026-07-11). Three committed
  increments on top of M-UI/2. **(A)** the Confirm flow feels alive — a signed
  confidence-delta chip springs in on each result-driven shift + a "re-reading…"
  refresh state that dims (not wipes) the picture. **(B)** the headline: the
  **acid–base / ABG visual learning map** — `lib/acidBase.ts` (deterministic:
  primary driver by the 7.40-side rule, Winter-window compensation in kPa, anion
  gap + delta–delta, hidden high-gap acidosis surfaced) + `AcidBaseMap.tsx`
  (theme-aware SVG gauges + 5-step teaching), atop `InvestigationInsights` when a
  gas is present; chloride added to the U&E panel. **(C)** dark-mode dept tiles +
  tokenised discrepancy banner. Verified: interpreter against 10 classic gases +
  light/dark render screenshots. Engine untouched (pure client layer). Proof:
  `eval/m-ui3/` (`GATE.md`).
- **M-UI/2 — Premium redesign + diagnosis-first tap-driven cockpit — ✅ SHIPPED**
  (2026-07-11). User rated the UI 4/10 (cheap/plastic/congested); rebuilt in 5
  committed increments to the principle **lowest-level input → highest-level
  output**. Light-based tinted depth (no more plastic hairline cards), all emoji
  → lucide icons, coherent teal-intensity confidence bands, tokenized type. The
  cockpit is now **Start → Confirm → Complete**: tap a complaint → the leading
  diagnosis auto-appears → answer a yes/no + MCQ stream (the engine's new
  `discriminatingFeatures`) → confidence updates live → background last → the
  note falls out. Loop gate held **100/100 on O&G + Medicine** (engine change is
  additive). Proof + zero-typing drive: `eval/m-ui2/` (`SUMMARY.md`).
- **M-UI — Calm Clinical design system — ✅ SHIPPED** (dev branch). A real
  design-system build (not a reskin): tokens (`tailwind.config.js` + CSS-var
  theme), self-hosted Inter, lucide iconography, framer-motion on the Working
  Picture hero, one accent everywhere (killed the pink/blue/sky/indigo one-offs
  and the 8-colour dept selector), **plus a shipped dark mode** (sun/moon
  toggle, no-flash). Proof: `eval/m-ui/` (desktop+phone, light+dark). Reference:
  `docs/design-system.md`. Presentation-layer only — no API/logic change, so the
  M1 loop score carries over.
- **M1 — the bedside loop in O&G — ✅ SHIPPED**. Weighted differential +
  discriminating investigations + results→confidence→management, narrated.
  Live loop harness 100/100, ~8.4c/loop. Proof: `eval/og/` + `eval/reports/`.
- **M2 — the loop across every department, researched + implemented + gated —
  ✅ COMPLETE** (2026-07-10). All **10 departments** now carry a consultant-
  depth dossier, registry implementation (fields, smart-blocks, treatment sets,
  STG floors, investigation panels, discipline lens), and a **live loop gate at
  100/100**: Internal Medicine, Surgery, Emergency, ICU, Orthopaedics,
  Psychiatry, Anaesthetics (added as a new department this campaign),
  Paediatrics (neonatology/PICU depth pass), Obstetrics & Gynaecology (the
  founding department; 6/6 scenarios), and the O&G regression. ~8–10c/loop,
  <10c/prompt everywhere. Gate records + raw reports: `eval/m2/`; per-department
  clinical-review batches for sign-off: `implementation/*.md`. The Emergency
  gate caught + fixed a real max_tokens-truncation transient
  (`confidence-engine.ts` cache-friendly retry). **Next milestone: M-UI/2, the
  frontend overhaul** (`eval/m-ui2/`) — the user's explicit priority (UI 5/10 →
  premium Calm Clinical).

---


**Goal:** turn MedAI from a generic form-filler into a super-specialist tool that reasons
like a consultant in *every* department — every differential (common, dangerous, and the
zebras a consultant genuinely considers, e.g. renal tubular acidosis, the urine-anion-gap
workup), the discriminating history, the discriminating examination, the normals, the
investigation-interpretation nuances, and the SA-specific realities. Depth over breadth.
Explicitly a multi-session undertaking — this file is the resumable tracker.

## How this works (for any future session picking this up)

1. **Research phase** — one deep dossier per department in `research/<dept>.md`, built by a
   research agent to the depth bar in `DEPTH-BAR.md`. Sourced (SA STG/EML first, global second).
2. **Implementation phase** — turn each dossier into app content across the registries
   (`apps/web/src/tools/config/{symptomCascades,smartBlocks,examChecklists,treatmentSets,departments}.ts`,
   `fields/departments/*.ts`, `apps/api/src/services/tools-assist.ts` guidance,
   `apps/web/src/tools/lib/investigations.ts` panels/rules). Recorded in `implementation/<dept>.md`.
3. Every completed dossier and implementation is committed immediately so nothing is lost to a
   session-limit death. Update the table below in the same commit.

## Departments & status

| Department | Research dossier | Implementation | Notes |
|---|---|---|---|
| Internal Medicine | ✅ done (1409 lines) | ✅ implemented | fields, smart-blocks (DM/HIV/TB/HF), treatment sets (DKA/ACS/pulm-oedema/hyperK/CAP), cardiac + HIV/TB panels, discipline lens; loop gate 100/100 live. See `implementation/medicine.md` |
| Surgery (General) | ✅ done | ✅ implemented | fields (pain evolution, anticoag, NPO, post-op day), treatment sets (appendicitis/SBO/perforation/cholecystitis/peri-op), post-op + bridging blocks, abdo panel, 4-question lens; loop gate 100/100 live. See `implementation/surgery-emergency.md` |
| Emergency Medicine | ✅ done (1018 lines) | ✅ implemented | fields (SATS, ED clock, pre-hospital), treatment sets (MTP/organophosphate/NAC/meningitis), SATS + GCS blocks, tox panel, ABCDE-on-a-clock lens; loop gate 100/100 live. See `implementation/surgery-emergency.md` |
| Intensive Care | ✅ done (1095 lines) | ✅ implemented | fields (RRT/AEIOU, fluid balance, RASS/CAM-ICU, lines, ceiling of care), treatment sets (septic-shock hour-1, ARDS lung-protective, raised-ICP, RRT, VAP), organ-support/fluid/sedation blocks, sepsis panel, FASTHUGSBID lens; loop gate 100/100 live. See `implementation/icu.md` |
| Obstetrics & Gynae | ✅ done (2107 lines) | ✅ implemented (founding dept, 6-agent-hardened) | the founding department — deepest registry content (57 fields, 4 sub-dept lenses antenatal/labour/postnatal/gynae, STG-floor emergency sets, teratogen net, HELLP/DIC panels), hardened via the 6-agent eval (`eval/og/SCORECARD.md`); dossier now gives DEPTH-BAR documentary parity + 3 consultant-nuance corrections (protein-S/prior-VTE, molar uterotonics-after-evacuation, FIGO IIIA/IIIB) flagged for a lens touch-up. Loop gate **6/6 100/100 live**. See `implementation/obstetrics-gynaecology.md`. Residual work (streaming/surface redesign) is UX → folds into M-UI/2 |
| Paediatrics | ✅ done (2382 lines) | ✅ implemented (depth pass) | dossier (neonatology deepest, PICU reasoning, syndromic); enriched lens (age+weight-first, compensate-then-cliff, IMCI reflex, caregiver-as-monitor); fields (RTHB/EPI-SA/PMTCT/developmental red flags/neonatal glucose); paeds panel (neonatal bili/glucose/CRP/weight); 7 treatment sets (duct-dependent collapse, status epilepticus, cerebral-oedema-aware DKA, croup, bronchiolitis, neonatal jaundice, NAI); 4 smart blocks (neonatal core, IMCI danger signs, dehydration, child protection); loop gate 100/100 live incl. 2 neonatal depth cases. ⚠ one prescribing correction (HIV-exposed dual NVP+AZT) flagged. See `implementation/paediatrics.md` |
| Orthopaedics | ✅ done (1593 lines) | ✅ implemented | own fields fragment (mechanism, Gustilo, neurovascular pre/post, weight-bearing), treatment sets (open #, compartment syndrome, septic arthritis, NOF pathway, cauda equina), NV/open-#/fracture-description blocks, msk panel, limb/life-threat lens; loop gate 100/100 live. See `implementation/orthopaedics.md` |
| Psychiatry | ✅ done (1911 lines) | ✅ implemented | MHCA-status + depot/clozapine + organic-screen fields, psych monitoring panel (lithium bands, clozapine ANC, CK-in-agitation, urine tox), 7 treatment sets (rapid tranq, NMS, serotonin syndrome, lithium toxicity, CIWA alcohol withdrawal, dystonia/EPSE, suicide safety pathway), 4 smart blocks (MSE, risk, MHCA, withdrawal watch), organic-exclusion lens; loop gate 100/100 live. See `implementation/psychiatry.md` |
| Anaesthetics (NEW dept) | ✅ done (1623 lines) | ✅ implemented | dept registered (web+API), fields (ASA/airway/fasting/anticoag-neuraxial/METs/neuraxial suitability), pre-anaesthetic checklist, 7 treatment sets (MH crisis, anaphylaxis-under-GA, LAST, failed-intubation/CICO, spinal-CS hypotension, high/total spinal, delayed emergence), 4 smart blocks (pre-assessment, spinal record, crisis snapshot, PACU discharge), discipline lens; loop gate 100/100 live. See `implementation/anaesthetics.md` |
| Family Med / PHC | ⬜ not started | ⬜ not started | consider — the district generalist lens |

Legend: ⬜ not started · ⏳ in progress · 🟡 partial · ✅ done

## Cross-cutting workstreams

- ✅ Investigation-trending companion (Results tab + deterministic delta rules) — `lib/investigations.ts`. Extend panels/rules per department as dossiers land.
- ⬜ Differential-engine: surface the consultant differential (incl. must-not-miss + zebra) from the presentation, not just a problem list.
- 🟡 "Normals" reference layer — what normal looks like per ward, inline. (Age-banded paediatric normals now in `research/paediatrics.md` §3; other depts' normals live in their dossiers. Not yet surfaced as an inline app layer.)
- ✅ Anaesthetics as a first-class department in `departments.ts` (2026-07-10, gate 100/100).

## Evaluations

- ✅ **O&G six-agent evaluation** (`eval/og/`) — efficiency, breadth, consultant, super-specialist,
  stressed-load, UI/UX lanes against a 7-dimension rubric. Aggregate ~6.5 → projected ~8.0 after
  remediation. 13 highest-impact fixes applied and cherry-picked to the deploy branch; the residual
  gap is UX/throughput architecture (streaming, worker pool, surface-collapse redesign), not
  clinical safety. Full write-up in `eval/og/SCORECARD.md`. Same lane pattern can be re-run per
  department as the dossiers land.

## Reference

- `docs/clinical-foundations.md` — the v1 breadth reference (all 10 depts, one page each). The dossiers here go far deeper.
- `DEPTH-BAR.md` — the non-negotiable depth standard every dossier must hit.
