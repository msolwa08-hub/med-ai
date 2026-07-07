# O&G Intern-Tools — STRICT Grading Rubric (v2)

The v1 rubric graded too softly: agents scored 6–9 while the shipped product
emitted markdown stars into a "copy-to-paper" summary, split one clerking across
three tabs, and produced a 25-line bullet blob instead of a presentation. A
rubric that misses those is a broken rubric. **This one is deliberately brutal.**

## Grading law (applies to every dimension)

1. **Start at 0 and make the product earn each point.** Do not start at 10 and
   deduct. A dimension is worth points only for behaviour *observed in the code
   or output*, never for intent.
2. **Default to the lowest defensible score** when uncertain.
3. **Auto-fail conditions cap the score regardless of everything else.** If an
   auto-fail is tripped, the dimension cannot exceed the cap listed, full stop.
4. **"Works if the intern is careful" is a fail.** The persona is the *most
   uneducated intern who knows nothing* (per directive). If a step needs
   cleverness, training, or a second read, it scores as broken.
5. **A number without a reproduction is not a score.** Every score cites the
   file:line or the exact output artifact that justifies it.

### Band meaning (same for all dimensions)

| Band | Meaning |
|---|---|
| 0–2 | Broken / actively harmful. An intern would be worse off using it. |
| 3–4 | Usable only by an expert who works around it. Fails the naive-intern test. |
| 5–6 | Functional but visibly rough; a real clinician would complain (as the user did). |
| 7–8 | Genuinely good; a registrar would accept the output onto a chart. |
| 9 | Excellent; nothing a consultant would change. |
| 10 | Not awardable in a static audit. Reserved for post-live-trial proof. |

**Max awardable in a static (no-live-trial) audit: 9.** State this explicitly.

---

## The six dimensions (each has one DOER and one MARKER agent)

### D1 — Output legibility & copyability *(the "stars" dimension)*
What a summary/note/round output is worth **as a thing a human copies onto paper.**

Earn points for: plain text only; clean section headers a human can scan;
consistent line structure; fits a half-page where claimed; abbreviations a SA
intern reads instantly; no wasted lines.

**Auto-fail caps:**
- ANY markdown artifact in a copy-to-paper field (`*`, `**`, `#`, `` ` ``, `-`
  used as a raw bullet glyph the user must delete) → **cap 3**.
- Output is a JSON/code-fence leak, or shows a raw `{}` field → **cap 2**.
- "Summary" that is a bullet dump with no synthesis sentence → **cap 4**.
- Claims "≤25 lines / half page" but the real output is longer or is empty → **cap 4**.

### D2 — Clinical reasoning, history & exam
Depth and correctness of the questions asked, the differential produced, and the
expected-vs-actual exam synthesis.

Earn points for: dangerous-first differentials incl. the zebra; history that
adapts to the presentation and sub-department; exam synthesised (expected vs
found), not transcribed; safety net actually armed (teratogens, obstetric drugs).

**Auto-fail caps:**
- A confidently-wrong clinical statement or an unsafe drug that the deterministic
  net does not catch → **cap 3**.
- Ectopic/torsion/PPH/eclampsia handled without the guideline floor → **cap 5**.

### D3 — Ease of use & speed across acuity *(the naive-intern test)*
Can the *most uneducated intern* clerk a **sufficient** history in **5 minutes**
on **one page** without switching contexts?

Earn points for: one continuous page for intake+history+exam; big, obvious
prompt; zero-typing paths where possible; history filling in the background;
graceful with partial/absent data ("can generate a summary at any point").

**Auto-fail caps:**
- Clerking one patient requires switching between separate History and Exam
  pages/tabs → **cap 4**.
- The primary prompt is small/low-contrast/easy to miss → **cap 5**.
- The flow blocks or dead-ends when the intern leaves fields blank → **cap 3**.

### D4 — Efficiency & latency
Wall-clock and turns to a usable result. The app is reported *slow*.

Earn points for: minimal blocking round-trips; grouped questions; parallel (not
sequential) heavy synthesis; a visible working state that does not read as a
stall.

**Auto-fail caps:**
- Any core flow 500s or loses captured work on a transient error → **cap 3**.
- >~8 turns to capture a standard intake, or heavy calls run strictly
  sequentially when they could be parallel → **cap 6**.

### D5 — Workflow & continuity
Does the whole arc hold: clerk → synthesise → present → **ward-round update**?
Including the established-patient path and exam cadence.

Earn points for: a straightforward ward-round-update that is its own clean step;
an established patient can be *updated* fast (only new/relevant questions & exams
surfaced); once-off exams (e.g. neuro screen in a cardiac patient) are not
re-demanded daily, but *risk-case* reassessment exams recur every round; the
summary regenerates from current state at any point.

**Auto-fail caps:**
- Ward-round update forces a full re-clerk of an established patient → **cap 4**.
- No mechanism to distinguish once-off vs recurring exams → **cap 6**.

### D6 — Disease breadth & summary sufficiency
Across the full O&G spectrum, is the output *sufficient* — does the summary
actually contain what a consultant needs to hear?

Earn points for: correct handling across obstetric + gynae + onco + early-preg;
a summary that states the one-liner, the problem(s), the plan, and what is
pending; nothing critical silently dropped.

**Auto-fail caps:**
- The "summary" omits the working diagnosis or the plan → **cap 4**.
- A whole class of presentation produces an empty/degenerate summary → **cap 3**.

---

## Marker mandate (the six marking agents)

Each marker audits exactly one doer and is graded on **catching leniency**, not
on agreeing. A marker must:
1. Re-derive the score from the evidence independently; if the doer's score is
   not the *lowest defensible* one, lower it and say why.
2. Check every auto-fail condition the doer may have skipped.
3. Reject any point awarded for intent rather than observed behaviour.
4. Output: the **locked current score**, the **specific target** the fix must
   reach, and the **exact code change** required to get there.
5. A marker that rubber-stamps (returns the doer's score with no independent
   challenge) has failed its own job.

## Output contract

Per dimension: `{ current: n, target: n, autofailsTripped: [...],
evidence: [file:line | artifact], requiredFix: "...", markerVerdict: "..." }`.

Aggregate = unweighted mean of the six **locked** current scores. The product is
not "done" until every dimension is ≥7 with **zero auto-fails tripped**.
