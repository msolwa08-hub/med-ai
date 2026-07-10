# Paediatrics — depth implementation record (M2)

Dossier (`../research/paediatrics.md`, 2382 lines) → app registries, 2026-07-10.
This is the DEPTH pass over the pre-existing Paeds v1 breadth content (general/
neonatal/SAM sub-departments) — weighted to neonatology, PICU-level reasoning,
and syndromic reasoning per the roadmap. **Clinical content pending your
review.** SA STG/EML paediatric chapter, IMCI and the 2023 ART/PMTCT PDFs
403'd automated fetch; weight-based doses are dossier [EK] against WHO Pocket
Book / APLS / Nelson consensus and are flagged in app text — verify against
your current SA Paediatric STG edition.

## ⚠ One substantive clinical correction — needs your sign-off first
The **HIV-exposed-infant** field previously implied AZT is added only for
high-risk infants. The dossier (§2.1.9, 2023 ART guidelines) has it the other
way: **all HIV-exposed infants receive default dual NVP+AZT prophylaxis for
~6 weeks**, and the risk tier (maternal delivery viral load) instead governs
*duration* and *testing intensity*, not whether AZT is given. The field text
now reflects the dual-default. This changes prescribing guidance, not just
phrasing — please confirm against the current guideline before this reaches
a real infant.

## Loop gate (live)
**100/100** across all 6 paeds scenarios incl. 2 new neonatal depth cases —
day-5 duct-dependent collapse (correctly held against sepsis on pre/post-ductal
sats + echo) and day-3 "just not feeding" → early neonatal sepsis on the septic
screen — plus the existing meningitis/DKA/pneumonia/intussusception set.
~8.7c/loop. Report `../eval/m2/loop-paeds-depth-2026-07-10.json`. Gated on the
rewritten paediatric discipline lens.

## Discipline lens (`tools-assist.ts`)
Rewritten to dossier depth: age+weight-first (nothing dosed/interpreted without
fixing age and weight; mg/kg native unit); compensate-then-cliff physiology (BP
is late/pre-terminal, read the early compensated signs); the caregiver as
monitor ("not himself"/feeding refusal <3 months as top-tier red flags); the
IMCI danger-sign reflex (overrides the syndrome algorithm); the always-
ruling-out set (infant sepsis, NAI, the duct-dependent lesion behind "reflux",
bilious vomiting = volvulus, TB/HIV behind everything); neonate = day/hours-of-
life anchoring and plot-don't-threshold bilirubin.

## Fields (`fields/departments/paeds.ts`)
Enriched (keys unchanged): weight (age-based estimation fallback), RTHB
(ask-every-encounter + growth-trend), immunisations (EPI-SA 2024 + rotavirus
24-week cutoff), neonatal maternal-risk (any one factor is enough), HIV
exposure (the PMTCT cascade + the correction above), jaundice (conjugated
fraction / biliary-atresia clock + TcB-unreliable caveat), neonatal hydration
(glucose <2.6 action threshold + ladder), IMCI danger signs (screen repeatedly,
overrides the algorithm). New field: developmental refer-NOW red flags (a
discrete screen distinct from the free-text milestones narrative).

## Panel (`lib/investigations.ts` — dept paeds)
Neonatal bilirubin (plot vs hours-of-life + gestation, never threshold a bare
number); neonatal glucose (<2.6 amber + ladder pointer, <2.0 red); neonatal
CRP (a single early CRP does not exclude sepsis; rising-trend alert); weight
(trended — >10% loss from birth/admission baseline = red).

## Treatment sets (`config/treatmentSets.ts`)
Duct-dependent collapse (femoral pulses/four-limb BP, hyperoxia-test, ⚠ PGE1
infusion + apnoea-ready-to-ventilate, parallel sepsis cover, urgent transfer);
paeds status epilepticus ladder (glucose-first, ⚠ mg/kg benzo ×2 → phenytoin/
phenobarbitone/levetiracetam → RSI, pyridoxine trial in infants); paeds DKA
(cautious 48h deficit, ⚠ NO insulin bolus 0.05-0.1u/kg/h, cerebral-oedema watch
treated before imaging, hourly neuro obs); croup (Westley bands, ⚠ dexamethasone,
nebulised adrenaline + 2-4h rebound watch, must-not-miss set); bronchiolitis
(supportive discipline — explicit no-salbutamol/steroids/antibiotics);
neonatal jaundice (hours-of-life, plot-don't-threshold, conjugated fraction/
biliary-atresia clock); NAI child protection (Form 22, skeletal survey +
2-week repeat, fundoscopy, never-unsafe-discharge, sibling check). The existing
`neonatal-sepsis` set was left untouched (not duplicated).

## Smart blocks (`config/smartBlocks.ts`, dept paeds)
Neonatal admission core (gestation/BW/delivery/APGAR/resus/ROM/GBS/day-of-life/
weight %change/feeds ml/kg/PMTCT); IMCI danger signs; dehydration assessment
(WHO A/B/C inputs + SAM-inverts-this caveat); child-protection documentation
(verbatim history, mechanism-vs-development, body map, Form 22, referrals,
disposition safety).

## Items flagged for your sign-off
1. **HIV-exposed-infant dual NVP+AZT default** (see the boxed correction above)
   — the one substantive prescribing change; confirm first.
2. **PGE1 dose** for duct-dependent collapse — [EK]; verify vs your unit/
   tertiary protocol.
3. **Status-epilepticus ladder doses** (lorazepam/diazepam/phenytoin/
   phenobarbitone/levetiracetam mg/kg) — [EK]; verify vs current SA STG.
4. **Paeds DKA** insulin 0.05-0.1u/kg/h + hypertonic saline/mannitol cerebral-
   oedema doses — [EK]; verify vs your DKA protocol.
5. **Croup** dexamethasone 0.15-0.6mg/kg + nebulised adrenaline — [EK]; verify.
6. **Form 22 / skeletal-survey** procedure — [fetched, Children's Act s110] +
   [EK] clinical detail; confirm your facility's child-protection SOP.
