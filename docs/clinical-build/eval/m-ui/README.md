# M-UI gate — Calm Clinical design system

**Milestone:** M-UI (world-class "Calm Clinical" interface), the drop between
M1 (the bedside loop) and M2 (department breadth).

**Outcome:** shipped. The app went from ad-hoc `teal-*`/`gray-*` classes, emoji
UI chrome, no webfont and one-off accent colours to a single token-based design
system — semantic surfaces, self-hosted Inter, lucide iconography, framer-motion
on the hero, and one confident teal accent everywhere.

## What changed
- **M-UI/1** — design tokens: Tailwind theme (brand scale, semantic
  surface/ink/line CSS vars, confidence bands, radii, shadow, motion keyframes),
  self-hosted Inter Variable, dark-ready variable layer.
- **M-UI/2** — primitives rebuilt on tokens: `Button` (variants/sizes/focus
  ring/44px), `Card`, field system, `Spinner`, lucide icons.
- **M-UI/3** — shell + Working Picture hero: sticky blurred header, tokenised
  tabs/sidebar, spring-animated confidence bars, layout-animated differential
  cards, skeleton loading, reduced-motion honoured.
- **M-UI/4** — every surface unified: all tabs, calculators, selectors, chat +
  cockpit converted to tokens; one-off pink/blue/sky/violet/indigo accents
  removed; department selector reduced from 8 pastel tints to one accent.

## Proof (this folder)
Desktop + phone, freshly-built `dist`:
- `*-landing.png` — front door (lucide cards, single-accent featured tile)
- `desktop-access-gate.png` — key entry
- `*-departments.png` — single-accent neutral dept cards (emoji = identity)
- `*-clerk.png` — full clerking surface with the hero panel inline
- `*-problems.png` — problem list, screening cards on tokens
- `desktop-calculators.png` — calculator index (risk-tier colours preserved)
- `*-working-picture-hero.png` — the bedside loop **live**: HELLP screened as a
  discriminator, HELLP-range bloods landed, confidence shifted with the narrated
  "what changed", management sharpened. Band-coloured bars, discriminator status,
  must-not-miss, do-now.

## No functional regression
This milestone was a presentation-layer pass: the edits are Tailwind class
tokens, new primitives, and motion — **no API or clinical-logic changes**. The M1
loop harness grades API responses, which are untouched, so the loop's ≥90 score
carries over unchanged (M1 scored 100/100 at `../og/`). The clinical signal
palette — confidence bands, safety BLOCK/WARN, risk tiers, status badges — was
preserved throughout the sweep.

See `docs/design-system.md` for the full token/primitive reference.
