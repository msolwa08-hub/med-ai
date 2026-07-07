# O&G Intern-Tools — STRICT v2 Scorecard (6 doers + 6 markers)

Method: the strict rubric (`RUBRIC-STRICT.md`) graded by six DOER agents, each
adversarially re-graded by a MARKER agent whose job was to catch leniency (start
at 0, lowest defensible score, auto-fail caps binding, max 9 in a static audit).
The markers verified every file:line citation against `git show HEAD`. The run
straddled a moving HEAD — some agents read the pre-fix baseline, some read fixes
landing mid-run — so this table records the **locked baseline**, what the fix
was, and where it now stands.

**Locked baseline aggregate: 4.5 / 10.** This is the honest, harsh number the v1
rubric never produced.

| Dim | What it measures | Locked | Target | Status after fixes |
|---|---|:---:|:---:|---|
| D1 | Output legibility & copyability (the "stars") | **3** | 7 | **Fixed** — plain-text rule on both summary prompts, `stripMarkdown` backstop (incl. `---` rules), synthesis line mandated |
| D2 | Clinical reasoning, history & exam | **3** | 7 | **Fixed** — MTX-in-ectopic over-block removed (context-aware), teratogen net still hard-blocks viable pregnancy |
| D3 | Ease of use & speed (naive-intern test) | **7** | 7 | **Met at HEAD** — marker corrected the doer *upward*: Clerk merge, big prompt, background fill confirmed |
| D4 | Efficiency & latency | **5** | 7 | **Partial** — client retry shipped; streaming + prompt-caching deferred (L2, architectural) |
| D5 | Workflow & continuity | **6** | 7 | **Mostly fixed** — LLM exam-cadence shipped; deterministic screening-cadence deferred |
| D6 | Disease breadth & summary sufficiency | **3** | 7 | **Fixed** — problem list now feeds every document; PLAN/working-dx derived from problems |

---

## Per-dimension detail

### D1 — locked 3 (cap: markdown in a copy-to-paper field) → fixed
The marker held the doer's 3 after independent re-derivation. Two independent
trips: (a) `ROUND_NOTE_SYSTEM` said "bullet points preferred" with no markdown
ban and `PRESENT_PATIENT_SYSTEM` had no constraint at all; (b) `formatDocs.ts` /
`DocumentsTab.tsx` injected a literal `---` rule. Render path was a raw `<pre>`
with no sanitizer.
**Fixed:** shared `PLAIN_TEXT_RULE` on every doc/summary prompt; `stripMarkdown()`
backstop applied in `DocOutput`, `RoundTab` and delta blocks (now also strips
`---`/`***`/`___`); `ROUND_NOTE` requires an ASSESSMENT synthesis line, not a
bullet dump. Verified: no `*`, `#`, backtick or rule line survives.

### D2 — locked 3 (cap: confidently-wrong clinical statement) → fixed
The marker **lowered the doer 6 → 3**: the pregnancy BLOCK loop ignored
`conditionsText`, so for a stable ectopic it declared **methotrexate**
"absolutely contraindicated in pregnancy" — MTX is the STG first-line therapy
there. A confidently-wrong statement on a named emergency caps the dimension at 3.
**Fixed:** `prescription-safety.ts` now reads `conditionsText` — MTX in an
ectopic/GTD context is a WARN ("intended therapy; confirm eligibility + anti-D"),
a clearly non-viable pregnancy downgrades teratogen BLOCKs to WARN, and a viable
pregnancy still hard-BLOCKs MTX/warfarin/ACE-i unchanged. Verified across 3 cases.

### D3 — locked 7 (marker corrected the doer UP from 4)
The doer locked 4 on a claimed History/Exam tab split. The marker rejected this
as **stale/fabricated evidence** and re-derived 7: the three tabs are already one
`ClerkTab` (single 'clerk' tab), the prompt is `text-2xl sm:text-3xl`, and the
flow never dead-ends on blank fields (zero-typing cascades, direct-edit Details,
ungated present/admission from partial data). This is the clearest independent
validation of the one-page merge. (→8 needs an explicit "Skip / I don't know"
control on the assist input — small, queued.)

### D4 — locked 5 (efficiency) → partial, streaming deferred
Held at 5 (lowest defensible). Client retry-with-backoff is shipped, but the
three heavy synthesis calls are non-streaming JSON POSTs — the intern sees a
30–40s blank spinner. Reaching 7 needs **streaming (SSE)** on the synthesis
paths and **prompt-caching** of the static system prefix. Architectural (L2),
deferred with the reason logged, not silently dropped.

### D5 — locked 6 (workflow) → mostly fixed
The LLM-level exam cadence is shipped (`examsToRepeatToday` + the once-off vs
recurring prompt block + its render). The marker's residual: cadence is not yet
mirrored in the **deterministic screening layer**, so a once-off prophylaxis
prompt can still be re-surfaced daily there. Reaching 7 needs a
`cadence: 'once' | 'recurring'` flag on screening rules + persisting actioned
once-off prompts. Queued.

### D6 — locked 3 (cap: summary omits working dx / plan) → fixed
The controlling cap: on the minimal clerk path the round note could render an
empty ASSESSMENT/PLAN, and documents were built without `patient.problems`.
**Fixed:** every document now includes the problem list (working dx,
differentials, management); `ROUND_NOTE` derives PLAN + working dx from the
problems when no explicit plan is supplied, only using a placeholder when there
is genuinely nothing to say.

---

## Projected post-fix position

D1 3→7, D2 3→7, D3 7 (held), D4 5 (streaming deferred), D5 6→~7, D6 3→7.
**Projected aggregate ~6.2 → ~7 once streaming lands** — the residual gap is
efficiency architecture (streaming/caching) and deterministic screening-cadence,
not clinical safety or the copy-to-paper defects the doctor reported.

## Still open (ranked, deliberately deferred)
1. **[D4, L2]** Streaming (SSE) on the synthesis calls + prompt-caching the static
   prefix — kills the 30–40s blank spinner. Biggest remaining efficiency lever.
2. **[D5]** Deterministic screening cadence (`once` vs `recurring` + actioned
   persistence) so once-off prophylaxis is never re-demanded daily.
3. **[D3→8]** "Skip / I don't know" control on the assist input.
4. Re-run this eval **live** (with the API key) next session to convert the
   static ≤9 ceiling into behaviour-proven scores.
