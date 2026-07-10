# Orthopaedics & Trauma — implementation record (M2)

Dossier (`../research/orthopaedics.md`, 1593 lines) → app registries, 2026-07-10.
**Clinical content pending your review.** Antibiotic/VTE doses are internationally
grounded onto SA EML drug classes — the SA STG/EML musculoskeletal PDF returned
HTTP 403 to automated fetch this session, so the flagged doses are NOT verbatim
STG quotes; verify against your current STG edition.

## Loop gate (live)
**100/100** — septic arthritis on joint aspirate, NOF fracture on X-ray, cauda
equina on MRI, compartment syndrome on delta pressure. ~7.8c/loop. Report
`../eval/m2/loop-ortho-2026-07-10.json`. Gated on the enriched trauma/ortho lens
(clear the limb/life-threat emergencies first; neurovascular status before AND
after manipulation; compartment syndrome is clinical + the 6h fasciotomy window).

## Fields (`fields/departments/ortho.ts` — now its own fragment, split from Surgery)
Mechanism & energy (high vs low → Gustilo grade + the second-injury reflex);
open wound / Gustilo + time since injury (the <1h antibiotic clock, tetanus);
**neurovascular status PRE- and POST-manipulation** (pulses/sensation-by-
dermatome/motor/cap refill, timestamped — the load-bearing ortho field; a change
post-reduction is an emergency); reduction/operation performed (+ mandatory
post-reduction film + NV re-check); weight-bearing status (NWB/PWB/FWB).

## Panels (`lib/investigations.ts`)
`msk` (ortho/surgery/emergency): CK-crush (≥5000 → rhabdomyolysis/crush → IV
fluids + hourly urine + myoglobinuria dipstick), synovial WCC (text — Gram/
crystals matter as much as count), compartment ΔP (text — needs diastolic BP to
interpret). Bone/joint sepsis otherwise served by existing CRP/ESR + WCC.

## Treatment sets (`config/treatmentSets.ts`)
- **Open fracture**: ⚠ antibiotics <1h (cefazolin 2g IV; Gustilo III adds
  gentamicin 6mg/kg + metronidazole/benzylpenicillin — *STG-403, verify*);
  tetanus; analgesia (rising need = compartment flag); photo-once + saline
  dressing; splint pre/post NV; theatre washout same-day <12-24h; hourly NV chart.
- **Compartment syndrome** (clinical emergency): release ALL constrictive
  casts/dressings to skin; limb AT heart level (not elevated); high-flow O2;
  pain-on-passive-stretch; ΔP ≤30 (mandatory if obtunded/blocked); fasciotomy
  <6h (outcomes fall by 12h); hourly NV+pain; CK/renal trend for rhabdo.
- **Septic arthritis**: ⚠ aspirate BEFORE antibiotics; urgent washout; cefazolin
  1g IV 8h empirical (*STG-403, verify*, broaden per risk); analgesia; splint;
  CRP/ESR trend; Kocher (paeds hip, off).
- **NOF / hip fracture pathway**: fascia iliaca block + early analgesia; bloods
  + group-and-save; ask why they fell; optimise for theatre <36-48h; ⚠ enoxaparin
  40mg SC OD VTE ppx (*STG-403, verify dose/duration*); delirium bundle;
  pressure-area care from admission.
- **Cauda equina**: urgent same-day MRI whole spine; same-day spinal referral
  (decompression ~24-48h); document saddle/sphincter exam; catheterise + record
  residual; serial neuro obs; urgent transfer if no local MRI.

## Smart blocks (`config/smartBlocks.ts`, dept ortho)
Neurovascular status (timing pre/post/serial, pulses, cap refill, sensation,
nerve/dermatome, MRC motor, passive-stretch pain, vs contralateral); open-
fracture assessment (Gustilo, time since injury, antibiotics + time + <1h,
tetanus); fracture description (bone/site/pattern/displacement/angulation/
shortening/open-closed/intra-articular).

## Items flagged for your sign-off
1. **Open-fracture antibiotics** (cefazolin ± gentamicin/metronidazole by Gustilo
   grade) — SA STG PDF 403'd; verify agent/dose/duration.
2. **Septic-arthritis empirical antibiotic** (cefazolin 1g IV 8h) — same caveat.
3. **NOF VTE prophylaxis** (enoxaparin 40mg SC OD) — same caveat.
4. **CK 5000 U/L** rhabdomyolysis cutoff — standard teaching, confirm local.
5. Ortho history fields insert at index 1 (mechanism frames the story) — a
   deliberate placement choice, flag if you'd prefer after PMH.
