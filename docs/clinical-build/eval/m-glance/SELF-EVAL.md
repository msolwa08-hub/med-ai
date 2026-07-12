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
