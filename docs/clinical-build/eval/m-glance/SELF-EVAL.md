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
