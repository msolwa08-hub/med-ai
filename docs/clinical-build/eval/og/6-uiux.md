# UI/UX designer — O&G evaluation

Overall lane score: **6.6/10**
D6: **6/10** — Well-engineered responsive floor (zero overflow, zero layout shift, zero JS errors across the full flow at 3 widths) undercut by systemic correctness-floor defects (near-invisible loading text, low-contrast secondary type, sub-44px targets) and a taste problem: History/Assessment/Round each stack 3–4 competing input surfaces into a 2,000–3,000px scroll, so the flow is *thorough* but not *fast* or *seamless*.
D7: **8/10** — Genuinely robust: comprehensive per-call error fallbacks, no data loss on failure, debounce/seq guards against races, hard clinical silos (no cross-specialty bleed), state persisted. Deductions only for a loading state that reads as a stall and a dead (non-persisting) checkbox.

Method: Playwright headless-chromium, viewports 1440 / 834 / 390, full intern flow — tools-key gate → dept → O&G → each of Antenatal/Labour/Postnatal/Gynae → every tab. 63 screenshots in `scratchpad/eval-ui/`, automated checks for horizontal-scroll, sub-44px targets, WCAG contrast, focus visibility, and page-error capture. Code in `apps/web/src/tools/`.

---

## A. CORRECTNESS FLOOR (fix unconditionally)

| Tab / surface | Viewport | Issue | Severity |
|---|---|---|---|
| AssistPanel loading ("One moment…" / "Reading the handwriting…") | all | `text-gray-300` on white = **1.47:1** contrast. The AI question card's only feedback while a call is in flight is effectively invisible — reads as a hang, not a load. `AssistPanel.tsx:208`. Appears on Intake, History, Assessment, Round. | High |
| Primary action button (`AiBtn`, "+ Patient", all "Generate/Suggest/Synthesize") | all | White text on `bg-teal-600` (#0d9488) = **3.74:1**, fails AA (needs 4.5 for 14px medium). This is the single most-repeated control in the app. `ui.tsx:49`, `ToolsApp.tsx:121`. | High |
| Dept picker abbreviations (MED, SURG, O&G, ICU…) | all | `text-gray-400` on tinted `-50` cards = **2.3:1**. `DeptSelector.tsx:33`. | Med |
| DetailsList placeholders / empty-tab guidance / "No problems added yet" / "No results yet" / EscapeHatch "+ Add custom note" | all | Secondary/placeholder type in `text-gray-300`–`gray-400` = **2.4–2.5:1**. On the History Details list, 13 placeholder rows are so faint that filled vs. empty fields are indistinguishable at a glance. `DetailsList.tsx:103`, `EscapeHatch.tsx:22`, `ProblemsTab.tsx:266-268`, `ResultsTab.tsx:165`. | Med |
| "Why?" rationale button | all | 20px tall (`text-xs px-1.5 py-0.5`) — well under 44px, and it is the app's most numerous button (every checklist item, smart-block field, screening card). `WhyButton.tsx:16`. | Med |
| Calculators tab pills | all | Recommended/Other calculator buttons are **34px** tall (`py-1.5`). `FormulasTab.tsx:52,72`. | Med |
| Primary buttons (`AiBtn`), "📷 Scan notes" (32px), Send "↑" (36×36), header back "←" (36×36), "+ Patient" (36px) | all | Cluster of 32–36px targets below the 44px floor. `ui.tsx:49`, `AssistPanel.tsx:192,234`, `ToolsApp.tsx:90,121`. | Med |
| Tab strip (Intake…Specialist) | all | Tab buttons are **42px** tall (`py-3`), a hair under 44. On phone the 9-tab strip is a horizontal scroller with **no edge fade / affordance**, and lands mid-scroll (screenshots show "Problems" clipped at the left edge on the Calculators view). `ToolsApp.tsx:162,167`. | Med |
| Problems → Management list checkbox | all | `<input type="checkbox" className="mt-0.5 accent-blue-500" />` — ~16px target, **inconsistent blue** accent in an otherwise-teal system, and has **no `checked`/`onChange`** — it toggles visually but persists nothing (dead interaction). `ProblemsTab.tsx:337`. | Med |
| Gate keyboard nav | all | ✔ Pass — Enter submits, focus ring present (`focus:ring-2 focus:ring-teal-500`), autofocus on key field. |
| Horizontal scroll / clipping / layout shift | all | ✔ Pass — 0 horizontal overflow at any width (header truncation with `max-w-[34vw]` chips is well done), 0 layout shift, 0 page errors. |

No horizontal scroll, no clipping of page content, and no runtime errors were found anywhere — the responsive engineering floor is genuinely solid. The floor defects are contrast and target-size, not layout.

---

## B. DESIGN CEILING (taste / speed)

**The core problem: three tools competing for the same job on one screen.** History, Assessment, and Round each stack the same overlapping surfaces vertically:

- History (`03-antenatal-antenatalhistory-*`): Presenting-complaint **cascade chips** → **AI assist chat card** → **13-row Details list** → **Smart Blocks** → **AI patient-session** panel. Five surfaces; **2,959px tall on phone** (3.5 viewport-heights), 2,078px on desktop.
- Round (`03-antenatal-antenatalroundnote-*`): **HOD Round** (4 textareas + "Synthesize round") → **Ward Round assist chat** → **Details list** → **Daily Round Note** generator → saved rounds → progress log. Two overlapping AI syntheses ("Synthesize round" delta vs. "Generate Ward Round Note" SOAP) whose outputs and naming ("HOD" / "Ward" / "Daily") blur together.

The AI assist card and the Details list **edit the same fields** — the card fills them, the list re-shows them. Presenting the filler and the filled simultaneously, plus the cascade that *also* writes the chief complaint, is redundant weight the intern must visually parse and choose between on every tab.

**Is the zero-typing cascade faster than the AI chat? Yes, decisively.** Cascade/smart-block chips are instant, local, ≥44px, and progressively disclosed — tap-tap-tap with no network. The AI chat has a visible per-turn round-trip ("Working…") and answers one question at a time. For a busy ward the chip path wins on every metric. **They don't destructively conflict** (cascade → `chiefComplaint`, assist → other fields, both merged via `upsertSerialized`), but the *layout doesn't lead with the winner*: the cascade sits at the top (good), then the slower, larger AI card + the faint 13-row Details wall push the fast Smart Blocks far below the fold.

**Taps/scroll to document an antenatal patient** (measured): gate (1) → O&G (1) → Antenatal (1) → Intake (AI asks ~6 fields one-at-a-time, each a type+Enter+wait) → auto-advance → History (tap complaint chip → 4–6 cascade taps; then scroll past the AI card and 13-row wall to reach ~6 BANC smart-block taps) → Assessment (checklist taps + assist + details + generate) → Problems (1 tap "Suggest") → Round → Documents. The chip surfaces are efficient; the cost is **scrolling** — the intern travels ~3 screen-heights per clinical tab, repeatedly passing surfaces they aren't using.

**Hierarchy / polish:**
- Weak filled-vs-empty signal in the Details list — everything is one faint gray weight (`DetailsList.tsx`).
- Desktop wastes ~660px: content is pinned to `max-w-3xl` centred (`ToolsApp.tsx:181`), so a 1440px screen shows a 768px column flanked by dead space while every surface is a tall scroll — columns could halve the scroll.
- Radii are inconsistent by surface: `rounded-3xl` (AssistPanel) vs `rounded-2xl` (most cards) vs `rounded-xl` (problem cards, delta blocks) vs `rounded-lg` (inputs) — no clear tier logic.
- Copy sometimes explains instead of helps: "One moment…", "More questions follow as you answer…", section blurbs. Fine, but they add reading weight to already-dense tabs.

**Pros (concrete):**
- Cascade / Smart-Block / Exam-Checklist chips are exemplary: ≥44px, teal-consistent, progressive disclosure without a wizard, always an EscapeHatch for free text (`CascadePanel.tsx`, `SmartBlockCard.tsx`, `ExamChecklist.tsx`). This is the app's best idea and it's fast.
- Header is defensively responsive — identity cluster shrinks/truncates before anything clips (`ToolsApp.tsx:86-126`); verified 0 overflow at 390px.
- Good empty states with icon + next-action guidance (Problems, Results) — `03-antenatal-antenatalproblems-desktop`.
- Confidence-graded scan chips (spoken/high/medium/low with ✓/~/? and "verify"/"check") are a genuinely thoughtful capture affordance (`AssistPanel.tsx:241-255`).
- Colour-coded severity is consistent and legible where it matters (red BLOCK / amber warn safety banners, red/amber trend arrows) — `ProblemsTab.tsx`, `ResultsTab.tsx`.

**Cons (concrete, with evidence):**
- History/Round are 2,000–3,000px scrolls of competing surfaces (`03-antenatal-antenatalhistory-phone` = 2959px; `03-antenatal-antenatalroundnote-desktop`).
- Details list duplicates the assist card's fields and both are always visible (`HistoryTab.tsx:160-176`, mirrored in Assessment/Round).
- Round tab has two overlapping AI paths + confusing HOD/Ward/Daily naming (`RoundTab.tsx`).
- Loading state invisible (`AssistPanel.tsx:208`); primary button + secondary text fail contrast (see table).
- Dead management checkbox (`ProblemsTab.tsx:337`).
- Desktop scroll where columns would do (`ToolsApp.tsx:181`).

---

## Top 5 fixes (ranked by impact)

1. **Contrast pass on the three highest-frequency offenders.** (a) `AssistPanel.tsx:208` loading text `text-gray-300` → `text-gray-500` (or add a spinner) — right now every AI wait reads as a stall; this alone lifts perceived robustness. (b) `ui.tsx:49` `AiBtn` and `ToolsApp.tsx:121` "+ Patient": `bg-teal-600` → `bg-teal-700` (3.74 → ~5.2:1) — one change fixes the most-repeated control app-wide. (c) `DetailsList.tsx:103` + empty-state/`EscapeHatch` greys `gray-300/400` → `gray-500`, and `DeptSelector.tsx:33` abbrs. *Correctness floor, every screen, ~4 edits.*

2. **Collapse the competing surfaces — let the fast path lead.** On History/Assessment/Round, keep the cascade + AssistPanel as the primary capture, and demote the always-open `DetailsList` into a default-collapsed "Review & edit fields" disclosure (auto-collapse once the assist has run). Files: `HistoryTab.tsx:170-176`, `AssessmentTab.tsx:132-138`, `RoundTab.tsx:283-289`. *Halves the scroll and removes the "which surface do I use?" tax — the single biggest speed win.*

3. **Bring all interactive targets to 44px.** `WhyButton.tsx:16` (20→44px), `FormulasTab.tsx:52,72` calculator pills (`py-1.5`→`min-h-[44px]`), `ui.tsx:49` AiBtn (`py-2`→`h-11`), `AssistPanel.tsx:192,234` (Scan/Send), `ToolsApp.tsx:167` tab `py-3`→`py-3.5`, and add an edge-fade affordance to the phone tab scroller (`ToolsApp.tsx:162`). *Correctness floor for touch; the app is clearly phone-intended.*

4. **De-duplicate the Round tab's AI paths.** "Synthesize round" (HOD delta) and "Generate Ward Round Note" (SOAP) do near-identical work under three overlapping names (HOD/Ward/Daily). Consolidate to one round action, or make the distinction explicit in a segmented control. `RoundTab.tsx:149-318`. *Removes the densest, most confusing surface in the flow.*

5. **Use the desktop width + kill the dead checkbox.** On `lg+`, lay the paired surfaces (cascade | assist, details | smart-blocks) in a 2-col grid instead of `max-w-3xl` centred single-column (`ToolsApp.tsx:181`) — halves desktop scroll and fills the ~660px of dead margin. And give `ProblemsTab.tsx:337`'s management checkbox a real `checked`+`onChange` (persist a done-state) or remove it; switch `accent-blue-500` → `accent-teal-600`. *Polish + one data-integrity smell.*
