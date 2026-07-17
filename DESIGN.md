# MedAI — Design Direction (living brief)

Read with `VISION.md`. VISION = what the app *is*; this = how it should *look and
feel*. Muhammad (SA intern, the first user) drives the feedback; I (the agent)
own execution. Updated as feedback lands.

## The feeling we're chasing

**"It has to feel dynamic in your hands."** Calm and glanceable, but *alive* —
not a flat monochrome form. More colour, more depth, meaningful motion. Premium
clinical instrument, never a toy, never a spreadsheet.

### Reference boards Muhammad likes (aesthetic only, not the domain)
- **Dune (dark, cinematic):** warm sunset gradient over dark, a confident mono
  display headline, restraint. Take: depth + a cinematic gradient + one
  characterful display face for the big numbers. Theme: *clarity in complexity*.
- **Verdant (light, airy, colourful):** highlight-pill accents on key words with
  tiny icons; friendly saturated colour; and a real **dashboard** of stat cards —
  metric + numeric delta + up/down arrow (e.g. "+11.01% ↗"). Take: the
  **dashboard stat-card language** for the scores, and colour used generously but
  purposefully. He explicitly likes the dashboard.
- **Cosmic serif site:** elegant italic display + glass depth. Take: characterful
  type and layered depth for hero moments.

Synthesis for a clinical tool: keep the calm and the glance, but inject
per-diagnosis accent colour, red for danger, a brand-gradient confidence, layered
surfaces with soft depth, and motion that carries meaning (numbers count, bars
spring, rows reorder, flags animate).

## Locked feedback (apply everywhere)

1. **Flags → tick / cross, not two flags.** Present = green **✓**, absent = red
   **✗**. Faster to glance than same-shape coloured flags. (Colour + shape, never
   colour alone.)
2. **Diagnosis typography must be ONE consistent size/weight** — no awkward
   wrap that makes the leading dx look like two sizes. Truncate long names
   gracefully; never resize.
3. **Colour-code the diagnosis.** Dangerous / must-not-miss diagnoses read red;
   each dx carries a consistent accent. The name is not flat ink.
4. **ICD-10 code beside every diagnosis** (verify clinically before shipping).
5. **Movement arrows must be legible** — a bare ▲ means nothing. Show the
   **delta with a number** (e.g. "▲ +14"), coloured, like the Verdant dashboard.
6. **Investigations belong on the Investigations tab** — results entry (bloods
   etc.) must NOT sit under History & Exam. Tab 1 only *routes* to Ix (read-only
   "→ Ix" chips).
7. **Two scores stay** — Confidence (next to differential) + Hx/Exam completeness.
   He likes these; present them as **dashboard stat cards**.
8. **More colour, more life, more depth. Make it dynamic.** The recurring note.

## Tab skeleton (locked)
1. **History · Exam** — differential as persistent header; ✓/✗ flags; completeness score
2. **Investigations** — results entry; discriminators ranked by weight; closes the loop
3. **Management** — terse; treat-and-see (treatment-as-diagnosis) levers
4. **Docs** — the note / presentations it writes
5. **Why** — the only place full-sentence reasoning lives

## Engine laws (from VISION)
- Local likelihood-ratio engine → 0 ms, offline-capable. AI enriches in the background.
- Confidence = honest posterior, **capped** while a must-not-miss rival's discriminating test is undone. Never fake certainty.
- Completeness = weighted coverage of what matters for the live differentials.
- "Next" = highest information-gain question.
- Illness scripts, not point tallies. Automatic pre-mortem at high confidence.

## Non-negotiables
- Light + dark, both first-class. 44px touch targets. `prefers-reduced-motion` honoured.
- Words only in: diagnosis names, the findings entered, Docs, and the Why tab.
- No free-hand drug doses — research, cite, flag for clinician sign-off.
