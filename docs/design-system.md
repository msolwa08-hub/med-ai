# MedAI — Calm Clinical design system

The interface goal: **effortless for a scared intern, premium to a consultant** —
expensive medical-device software, never a toy. Soft depth, generous whitespace,
one confident accent, restrained purposeful motion. This document is the
reference for the tokens and primitives every surface is built on.

Source of truth in code:
- Tokens (colours, radii, shadow, motion): `apps/web/tailwind.config.js`
- Theme variables (light + dark) and base layer: `apps/web/src/index.css`
- Primitives: `apps/web/src/tools/components/ui.tsx`

## Principles

1. **One accent.** A single medical teal (`brand`) carries every interactive and
   "this is the app talking" moment. No per-feature pink/blue/sky/indigo. The
   only other colours are *semantic signal* (below).
2. **Semantic surfaces, not raw greys.** Components reach for `surface`, `line`,
   `ink`, `canvas` — never `bg-white`/`gray-*`. Because these are CSS-variable
   backed, dark mode is a variable flip, not a rewrite.
3. **Colour is meaning.** Off the brand accent, colour is reserved for clinical
   signal: confidence bands, risk tiers, safety BLOCK/WARN, status. If a colour
   isn't wayfinding or the accent, it's a neutral token.
4. **Motion is delight, not decoration.** Spring on the moments that matter (the
   confidence bar, the result-driven shift), quiet entrances elsewhere, and
   `prefers-reduced-motion` is always honoured.
5. **Reach for a primitive.** One `Button`, one `Card`, one field system, one
   `Spinner`. 44px minimum touch targets. `focus-visible:shadow-focus` everywhere.

## Tokens

### Colour — brand
`brand.50…900` (DEFAULT `#0d9488`), a calibrated Tailwind teal. Primary CTAs use
`brand-700` (hover `brand-600`, active `brand-800`); tinted surfaces use
`brand-50`/`surface-brand`.

### Colour — semantic surfaces (theme-able via CSS vars)
| Token | Role | Light |
|---|---|---|
| `canvas` | app background | soft cool off-white |
| `surface` | cards | white |
| `surface-alt` | inset / secondary | pale grey |
| `surface-brand` | brand-tinted hero panel | pale teal |
| `line` | hairline borders | `#e7ecf0`-ish |
| `line-strong` | dividers / inputs | stronger |
| `ink` | primary text | near-black slate |
| `ink-soft` | secondary text | slate-600 |
| `ink-mute` | tertiary / placeholder | slate-400 |

A `[data-theme="dark"]` block in `index.css` remaps every variable — the whole
app is dark-ready; light is the shipped hero.

### Colour — clinical signal (never repurposed as chrome)
- **Confidence bands** (`band-confirmed` emerald, `band-likely` brand,
  `band-possible` amber, `band-exclude` rose) — the differential's weight.
- **Safety** — BLOCK on rose, WARN on amber.
- **Risk tiers** in calculators (green/amber/red) and **status** badges keep
  their meaning-bearing colours by design.

### Radii · shadow · motion
- Radii: `card` (1.25rem) for panels, `xl`/`lg` for controls, `pill` for chips.
- Shadow: `card`, `card-hover`, `elevated`, `focus` (the 3px brand ring).
- Motion: keyframes `question-in`, `field-fill`, `scale-in`, `shimmer`;
  framer-motion springs for the hero confidence bars and card reflow.

### Typography
Self-hosted **Inter Variable** (`@fontsource-variable/inter`, offline/CSP-safe),
with Inter's optical features (`cv02–cv04`, `ss01`) on. `font-sans` is the stack.

### Icons
**lucide-react** throughout for UI chrome (one consistent, crisp set — the single
biggest "toy → premium" lever). Department **emoji** are kept deliberately, as
identity, not chrome.

## Primitives (`ui.tsx`)
- `Button` — variants `primary | secondary | ghost | danger`, sizes `sm | md`,
  optional lucide `icon`, built-in `loading` spinner, 44px targets, focus ring.
- `Card` — `rounded-card border-line bg-surface shadow-card`.
- `Label` / `TextInput` / `TextArea` — one `FIELD` style (`bg-surface`,
  `border-line-strong`, `focus:border-brand-500 focus:shadow-focus`).
- `Spinner` (lucide `Loader2`), `DocOutput` (copy-with-feedback), `Disclaimer`,
  `SectionHead`.
- `stripMarkdown` backstops stray model markdown before notes are copied to paper.

## The hero — Working Picture (`WorkingPicturePanel.tsx`)
The bedside loop made visual: a ranked differential with **spring-animated
confidence bars**, band-coloured by weight; each card shows the "why", what would
move it (discriminators, with done/pending/suggested status), and — when results
land — the **visible shift** (`was 35% → 80%`) plus a narrated "what changed".
Layout animation reflows the ranking; a shimmer skeleton covers first load.

## Applying the system
- New surface → start from `Card` + tokens; never introduce a raw `gray-*`,
  `bg-white`, or `teal-*`.
- Need a non-brand colour → it must be *signal* (band / risk / safety / status);
  otherwise it's a neutral token.
- Interactive element → a `Button` variant with the standard focus ring and touch
  target, or match `FIELD` for inputs.

## Proof
Before/after gate screenshots (desktop + phone) live in
`docs/clinical-build/eval/m-ui/`. The M1 bedside-loop behaviour is unchanged by
this milestone — it was a presentation-layer pass (Tailwind class tokens only, no
API/logic edits), so the loop harness score is unaffected.
