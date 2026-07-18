# Reasoning Clerk — Backlog

Deferred product ideas captured during beta feedback. Not scheduled yet; each is
a self-contained enhancement to pick up later.

## Labstack results import (screenshot → values)
Let the clinician bring in blood results without retyping. Simplest first cut:
import a **screenshot / photo of a results screen** and parse the values into
the Ix tab (the vision model already used for note-scanning can read the labels
+ numbers). A later, richer version could connect a **Labstack account via API
key** to pull results directly — but the screenshot path covers the common case
and needs no account linking. Blood-investigation focused.

## Image + structured input on the intake page
On the front "describe the patient" screen, allow **attaching pictures** (a
rash, an ECG, a wound, a scan) alongside the free text so the board can reason
around them. Also parse **structured shorthand** in the presentation and compute
from it — e.g. an obstetric `G3P2` should seed the antenatal questions and
gravidity/parity logic; paediatric anthropometry (weight/height/age) should seed
growth-percentile and weight-based dosing. Comes after the core clerking loop is
locked.

## Notes
- Both are additive to the current two-phase (core → plan) generation; neither
  changes the local likelihood-ratio engine.
- Keep the "no free-hand dosing / clinician sign-off" guardrails intact for any
  imported data.
