# M-UI/2 — Premium redesign + diagnosis-first cockpit (SHIPPED 2026-07-11)

The user rated the UI **4/10** — "cheap, plastic, congested" — and set the
goal: a genuinely premium interface where the intern confirms the diagnosis
**quickly by tapping**, not typing. Delivered in five committed increments.

## The organizing principle
**Lowest-level input → highest-level output.** The intern taps yes/no + MCQ;
from those taps the tool produces the ranked differential, the management, and
the note. Typing/dictation is an optional accelerator, never the main road.

## What shipped
1. **Premium design foundation** — depth now comes from LIGHT (brand-tinted,
   layered shadows) not hard hairline borders; confidence bands re-cut as a
   coherent teal-intensity ramp (killed the emerald-fighting-teal clash);
   tokenized clinical type scale (retired ~70 `text-[NNpx]`); tighter
   instrument radii; one lucide icon system.
2. **Whole-app sweep** — every emoji-as-chrome replaced with crisp lucide icons
   (departments, complaints, results, docs, severity, glyphs); one accent;
   the new material across every surface.
3. **Engine: `discriminatingFeatures`** — the confidence engine now emits the
   closed-form (yes/no + MCQ) history & exam checks that most move the leading
   differentials, priority-ordered — the backend of the tap flow. Additive +
   back-compat: loop gate held **100/100 on O&G (6/6) and Medicine (4/4)** live.
4. **Tap-driven cockpit** — ClerkTab rebuilt **Start → Confirm → Complete**:
   tap a presenting complaint → the leading diagnosis appears automatically →
   answer a stream of yes/no + MCQ discriminators (history AND exam) →
   confidence updates live → background captured last → the note falls out.
   Killed the 3 redundant fill-affordances, 5 chip systems, 3 counters and
   7–9 nesting levels of the old cockpit.
5. **Gate** — before/after screenshots every surface × desktop/phone ×
   light/dark; a zero-typing end-to-end drive (`apps/web/scripts/drive-cockpit.mjs`).

## Proof
- **Before:** `current/` (the 4/10 baseline — emoji chips, flat plastic cards).
- **After:** `after-inc1/`, `after-inc2/`, `after-inc4/` — the transformed
  landing (icon tiles, anchored hero) and the new cockpit, light + dark.
- **The flow, driven with NO typing:** `drive/` — tap "Chest pain" → **ACS 35%
  MUST-EXCLUDE** hero + PE/MSK/GERD differential + must-not-miss + do-now, then
  the "Confirm the diagnosis — tap what you find" stream (Pain character? MCQ;
  Radiates to arm/jaw? Y/N; inter-arm BP? Y/N; DVT signs? Y/N …).
- **Loop gates:** `loop-og-inc3`, `loop-medicine-inc3` — 100/100, no clinical
  regression from the engine change. ~10c/loop.

## Harness
`node apps/web/scripts/shots.mjs [outDir]` — every surface × 2 widths × 2
themes. `node apps/web/scripts/drive-cockpit.mjs` — the zero-typing drive.
Both run against the live beta-server; screenshots are the acceptance proof.

## Notes / follow-ups
- The auto-fire re-runs the picture ~700ms after any tap (debounced, cache-
  friendly). Live confidence movement on each tap is wired; a longer-running
  drive can capture the numeric shift (the round-trip is ~3-5s).
- Dark-mode department icon tiles render as light tiles (brand-50 is static) —
  intentional-looking and consistent; a dark-tinted variant is a minor polish.
