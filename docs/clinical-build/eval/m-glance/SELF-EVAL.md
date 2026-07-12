# M-GLANCE — Self-evaluation record

Scored honestly against the 10 acceptance criteria in `docs/clinical-build/STATUS.md`
after every increment. A criterion is **green** only with committed proof
(playwright assertion output and/or screenshots in this directory).

---

## Increment (a) — content over-matching fixed (2026-07-12)

**What shipped**
- `apps/web/src/tools/lib/clinicalText.ts` — negation-aware matching
  (`stripNegated`/`clinicalMatch`): drops "label: no/none/NAD/not detected"
  clauses and negation-led spans ("no convulsions", "denies chest pain"),
  stops the negated span at contrast words ("but"), handles postfix negation
  ("abruption excluded"). 18-case behavioral suite passed before wiring.
- Wired at EVERY free-text trigger site: `smartBlocksFor`, `treatmentSetsFor`,
  `examChecklistFor` (adaptive rules + GCS/glucose vitals rules),
  `suggestCalculators`.
- Root cause of IMCI→epilepsy: `findingStem` now truncates serialized exam
  labels at the first colon, so the teaching enumeration
  ("…convulsions, lethargic/unconscious") never enters the record as text.
- Full regex-trigger audit (two parallel agents, all four registries):
  17 pattern fixes — `\bPROM\b` (was matching "compromise"), `\bRPR\b`
  ("surprise"), `\blabour\b/\blabor\b` (was matching "laboratory"),
  `\bCAP\b(?!\s*refill)`, `depress` lookbehinds (ST/respiratory/myocardial
  depression), `\bRIF\b` vs "Xpert MTB/RIF", `\bXpert\b` ("expertise"),
  bare-`gastro`/`myocardial`/`induction`/`booking`/`gestation`/`skeletal
  survey` over-matches, `\bK\+\b` boundary, + dept-scoping (`gdm`,
  `anaemia-pregnancy` → og). Known homonyms deliberately left (COWS, PET,
  RRT, ectopic) — recorded in the audit notes.

**Proof** (all committed here)
- `a-overmatch-fix-{light,dark}-phone.png` — paeds gastro case, IMCI screened
  negative: NO epilepsy block, dehydration block present.
- `a-positive-trigger-phone.png` — "vomiting everything, unable to drink":
  IMCI block fires.
- Playwright assertions: 14/14 pass (light+dark × phone+desktop + positive-
  trigger scenario). Web build + typecheck clean. Engine/API untouched →
  loop gate not triggered (last full gate: 99.6 stands).

**Scores after (a)** — 10 = green with proof
| # | Criterion | Score | Gap |
|---|---|---|---|
| 1 | Glance 1 ≤1 tap, 10s, 390px | 2/10 | Not built — no pre-encounter briefing exists yet |
| 2 | Chatbox+photo = ONLY input on default path | 4/10 | QuickBar exists with dictation but sits among chips/stages; no photo button on it |
| 3 | Fragments auto-route + refresh picture | 5/10 | quickParse routes typed dumps; not yet proven for terse fragments; not the singular surface |
| 4 | "For the paper notes" Ix/Mx block | 1/10 | Not built |
| 5 | "Still to do" quiet suggestions | 1/10 | Not built |
| 6 | One-tap docs incl. MSE | 5/10 | QuickDocs exists (presentation/discharge/referral); no MSE formulation |
| 7 | Over-matching fixed + full trigger audit | 9/10 | Done + proven; residual known homonyms accepted and documented |
| 8 | Legacy surfaces demoted off default path | 3/10 | Stages/"Complete the record" still on the main screen |
| 9 | Gates every increment | 10/10 | Build+typecheck clean, playwright+screenshots committed, engine untouched |
| 10 | This record kept per increment | 10/10 | — |

**Biggest gap → next**: criterion 2+3 (Glance 2 — the one chatbox with photo,
auto-routing everything). That is increment (b).

---

## Increment (b) — Glance 2: THE chatbox leads (2026-07-12)

**What shipped**
- `QuickBar` is now the chatbox of the two-glance model: always visible,
  FIRST card on Bedside (no more "or say/paste it all" disclosure), with a
  **Photo** button beside "File it" — `<input capture="environment">` →
  `downscaleImage` → `scanNotes`, same routing + per-field confidence chips
  as typed fragments. Title: "Tell me what you found — fragments are fine".
- Fields = full clerking + exam set; `routeAnyUpdates` splits results to
  intake/history/assessment; the working picture recomputes off the same
  record signature, so filing refreshes the picture below.

**Proof** (committed here, live API)
- `b-chatbox-{light,dark}-phone.png` — the chatbox leads the 390px page,
  Photo button visible.
- `b-fragments-filed-phone.png` — typed `"BP 145/92, tachy, creps L base"`
  → **vitals slot** `BP 145/92, HR tachycardic (rate not specified)`,
  **exam slot** `Resp: crepitations at left lung base`; UI flags "Vitals —
  verify" with a consultant-grade note (exact HR/RR/Temp/SpO2 still needed).
  Playwright assertions 11/11 on layout + routing (state-level, not just UI).
- `b-photo-scan-phone.png` — the scratchpad handwritten-note test image via
  the chatbox Photo button filed 8 intake fields end-to-end live.
- Build + typecheck clean. Engine/API untouched (client-only) → loop gate
  not triggered.

**Score movement** — criterion 2: 4→7 (chatbox+photo IS the lead surface;
chips/stages still visible below → full credit comes with (f)). Criterion 3:
5→9 (playwright-proven exact directive scenario). Others unchanged.

**Biggest gap → next**: criterion 4+5 — the "For the paper notes" block and
quiet "Still to do" suggestions. That is increment (c).

---

## Increment (c) — "For the paper notes" + quiet "Still to do" (2026-07-12)

**What shipped**
- `components/PaperNotes.tsx` — **PaperNotes**: the transcription surface.
  Ix = deduped discriminating investigations across the differential
  (status ≠ done, priority-sorted, NOW-tagged, cap 8); Mx = the picture's
  managementNow lines. 17px type, tap-to-dim as each line is written on the
  chart. Reading surface, never a form. STG-anchor footnote on Mx
  (criterion 4 dose rule).
- **StillToDo**: quiet, ignorable, zero-interaction muted list of unanswered
  exam-kind discriminating features (history-kind stays in the tap stream
  until (f) demotes it) — capped at 5, never gating (criterion 5).
- **Phone-layout root-cause fix found by this increment's proof**: with 2+
  patients the fixed `w-48` sidebar rendered at 390px and crushed the
  bedside column to 158px (every real ward user hits this). Sidebar is now
  `hidden md:block`; phones get a horizontal patient chip strip above the
  tabs.

**Proof** (committed here, live API)
- `c-paper-notes-{light,dark}-phone.png` — live ACS demo patient: Ix
  "12-lead ECG NOW / Troponin (serial) NOW / BP in both arms NOW / CXR NOW /
  CT aortogram…", Mx lines, STG footnote, quiet still-to-do — full-width
  390px layout post-fix. Playwright 10/10 (light+dark).
- Build + typecheck clean; client-only → loop gate not triggered.

**Score movement** — criterion 4: 1→8 (block live and transcribable; dose
lines inherit the gated engine's STG anchoring). Criterion 5: 1→8 (quiet
list live; history-kind gaps still ride the tap stream until (f)).

**Known gap carried to (f)**: managementNow renders in both the hero panel
and PaperNotes — compact the hero to differential + must-not-miss so the
paper-notes block is the single Mx surface.

**Biggest gap → next**: criterion 1 — Glance 1, the ≤10s pre-encounter
briefing. That is increment (d).

---

## Increment (d) — Glance 1: the pre-encounter briefing (2026-07-12)

**What shipped**
- `config/briefings.ts` — the must-not-miss registry: 20 presenting
  complaints × 3-5 consultant-ordered red flags, discipline-specific killers
  prepended per department (paeds fever → IMCI danger signs first; og
  headache → eclampsia first; ortho trauma → antibiotic clock +
  neurovascular before/after). Conditions and flags only — zero doses.
- `components/Glance1Briefing.tsx` — "Before you go in — 10 seconds, then
  the phone goes away": ASK (top-level cascade questions = the history to
  take), DON'T MISS (registry), EXAM (presentation-adaptive checklist stems,
  + full vitals). Fully deterministic local content — 122-158ms from tap to
  rendered, no model call inside a 10-second glance.
- Encounter-phase ordering: pre-encounter the briefing is the star (chatbox
  waits below); the moment findings land it yields automatically to the
  Glance-2 layout, with a quiet one-tap "Show briefing" re-peek. The
  complaint tap smooth-scrolls the reader onto the briefing.

**Proof** (committed here)
- `d-briefing-medicine-light-phone.png`, `d-briefing-paeds-dark-phone.png` —
  390px, briefing in view after ONE tap.
- Playwright 11/11: one-tap reachability, <2.5s render (measured ~130ms),
  all three clusters, dept tuning (paeds IMCI + <3mo, og eclampsia,
  medicine dissection), auto-yield + re-peek.
- Build + typecheck clean; deterministic client content → loop gate not
  triggered.

**Score movement** — criterion 1: 2→9 (one tap, instant, 390px-readable,
zero required interaction; residual: chips card above is tall — (f) will
tighten the pre-encounter page further).

**Biggest gap → next**: criterion 6 — one-tap documents incl. MSE
formulation. That is increment (e).

---

## Increment (e) — one-tap documents + MSE formulation (2026-07-12)

**What shipped**
- **One-tap document chips on the bedside** (post-encounter): Presentation /
  Discharge / Referral (+ MSE for psych) — a single tap opens the drawer AND
  starts generating (`QuickDocs initialDoc` auto-open; previously 2 taps).
- **MSE + formulation** (new, psych-scoped end to end): API
  `POST /tools/mse-formulation` under the HOD persona — MSE domain-by-domain
  with honest "Not assessed" placeholders (never fabricated normals), risk
  summary (ideation→plan→intent→means + observation level), biopsychosocial
  4-Ps formulation, provisional dx + differentials ALWAYS carrying the
  organic/substance consideration (attention = the delirium tell), plan as
  chart lines naming drug classes only — no doses. `docSpecsFor(dept)` gates
  the doc list per department.
- Fix en route: the model emitted raw quotes/newlines inside long JSON
  strings (patient speech) — JSON string discipline added to the prompt.

**Proof** (committed here, live API)
- `e-onetap-docs-psych-phone.png` — the chip row on the bedside.
- `e-mse-formulation-phone.png` — generated MSE: honest gaps ("content not
  further specified in record"), attention interpreted against delirium.
- Playwright 7/7: one-tap generation (psych MSE + medicine presentation),
  MSE chip correctly absent outside psych, risk + 4-Ps + organic sections.
- Build + typecheck clean both apps. **API touched → loop gate**: the new
  route is additive (no shared code path with the working-picture engine
  beyond the model client); the psych-department loop subset was launched
  live as confirmation — score appended below when the run completes.
- Loop gate result: **psych subset 100/100 PASS** (4/4 scenarios — psychosis
  →substance-induced, confusion→delirium, rigidity→NMS, tremor→lithium
  toxicity; all dx/discriminator/must-not-miss/direction/narration marks).
  $0.0617/call, <10c ceiling PASS. Report:
  `apps/api/eval/reports/loop-psych-2026-07-12T12-08-03.json`.

**Score movement** — criterion 6: 5→9 (all four docs one tap; MSE live;
residual: docs chips appear only on Bedside — Round tab has its own paths).

**Biggest gap → next**: criterion 8 — demote everything else off the
default path. That is increment (f).

---

## Increment (f) — the demotion pass (2026-07-12)

**What shipped**
- **Complaint card collapses** post-encounter to one line ("Complaint —
  chest pain · Briefing · Change"); the chip grid returns only on Change.
- **Tap stream demoted**: ConfirmStream now lives behind a single collapsed
  disclosure ("Answer by tapping"); **StillToDo absorbs ALL unanswered
  discriminating features** (history + exam) as the quiet default surface.
- **Hero compacted**: `WorkingPicturePanel hideManagement` on the bedside —
  "For the paper notes" is the single Mx surface (the (c) known gap closed).
  Results/Round panels unchanged.
- DocumentsTab also gained the psych MSE entry (parity with the chip row).

**Proof** (committed here, live API, medicine chest-pain end-to-end)
- `f-default-path-{light,dark}-phone.png` — full-page 390px: the entire
  default path in one scroll = chatbox → collapsed complaint → differential
  with confidence + must-not-miss → paper notes (Ix NOW-tagged + Mx + STG
  note) → quiet still-to-do → one collapsed tap-stream disclosure → one-tap
  docs chips → collapsed "Complete the record 0/3".
- Playwright 22/22 incl. STRUCTURAL asserts on the documented-encounter
  view: **0 visible checkboxes, 0 visible text inputs, exactly 1 textarea
  (the chatbox)** — zero ticks, zero forms, zero field-hunting, proven not
  claimed. Build + typecheck clean; frontend-only → psych gate (100/100,
  this morning) stands; a medicine-subset spot check runs for the final
  certification below.

**Score movement** — criterion 8: 3→9; criterion 2: 7→9 (the chatbox is
now provably the only input surface on the default path).
