# M-UI/2 — the frontend overhaul (the user's 5/10 → premium push)

The user rates the current UI **5/10** and wants it to become genuinely
delightful — "something you're excited to use just based on the UI", premium to
a consultant, effortless for a scared intern, in the **Calm Clinical**
direction (Apple-Health-like: soft depth, generous whitespace, one confident
accent, restrained purposeful motion; expensive medical-device software, never
toy). This is deep design work, not a reskin — its own milestone.

## The harness
`node apps/web/scripts/shots.mjs [outDir] [baseUrl] [key]` — drives the LIVE
beta-server (`/tools`) with the pre-provisioned Chromium, seeds the access-gate
key + theme into `localStorage`, and captures every major surface at desktop
(1440×900) and phone (390×844), light and dark. **Screenshots are the
verification** — never claim a UI improvement unproven. Re-run after each
change and diff against `current/`.

## Baseline (`current/`, 2026-07-10)
Captured against the shipped M-UI/1 build. Honest read per surface:

- **Landing / department grid** (`*-landing.png`) — clean but generic: a large
  dead vertical band above the grid, the grid floats unanchored, and the
  department icons are **emoji inside grey rounded squares** — the single
  biggest "toy, not premium" tell. All 10 departments present (Anaesthetics
  now live). *Fix candidates:* tighten the vertical rhythm / give the header a
  real hero; replace emoji-in-square with a consistent iconography treatment
  (lucide or a properly-designed dept mark); add depth/hierarchy so the grid
  reads as a considered surface, not a floating menu.
- **Bedside cockpit** (`*-clerk.png`) — the bones are genuinely good and the
  "input on one page, everything built around it" vision IS realised (Quick
  clerk brain-dump → staged accordion Complaint/Story/Examine/Results on the
  left → Working Picture on the right). What holds it at 5/10:
  1. **Emoji on every complaint chip** (❤️🫁🤕🌡️🩸…) — replace with crisp
     lucide icons; this is the highest-leverage single change.
  2. The Working Picture panel is a large empty box pre-build — needs a
     designed empty state (a hint of the ranked-differential shape to come),
     not dead space.
  3. Flat, undifferentiated card elevation — no visual hierarchy between the
     active step and the collapsed ones; the accent greens (header teal vs
     button emerald) are subtly fighting.

## Working method for each tick
1. Boot the server, run the harness → fresh `current/` shots.
2. Pick the highest-impact surface still reading 5/10.
3. Improve concretely (tokens / primitives / layout / motion / iconography);
   delegate parallel surface work to Sonnet agents on non-overlapping files.
4. Rebuild, re-shoot, save the after into a dated subdir, note what moved the
   needle. Keep the M1 loop harness ≥90 (no functional regression).
