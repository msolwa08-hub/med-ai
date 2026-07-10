# Anaesthetics — implementation record (M2, NEW department)

Dossier (`../research/anaesthetics.md`, 1623 lines) → app registries, 2026-07-10.
Anaesthetics was added as a first-class department this drop (it did not exist
in `departments.ts` before). **Clinical content pending your review.** SASA
guidance, the STG/EML theatre chapter and the NCCEMD reports 403'd automated
fetch; crisis-drill doses are AAGBI/ANZAAG-anchored and [EK]-flagged in app
text — verify against your current STG/SASA edition.

## Loop gate (live)
**100/100** — malignant hyperthermia on temp/gas/CK, anaphylaxis under GA on
tryptase, delayed emergence → residual neuromuscular blockade on train-of-four,
and post-spinal hypotension after CS → concealed haemorrhage on Hb+lactate+US
(the "don't blame the sympathectomy" trap, 60→92%). ~9.8c/loop. Report
`../eval/m2/loop-anaes-2026-07-10.json`. Gated on the new anaesthetic
discipline lens (airway → aspiration → reserve → drugs → deterioration-as-
a-differential).

## Department registration
`departments.ts` (id `anaes`, ANAES), `DEPT_LABELS` in both `tools-assist.ts`
and `hod-prompt.ts` (assist + every HOD engine now speak anaesthetics), fields
registry, exam-checklist registry.

## Fields (`fields/departments/anaes.ts`)
Planned procedure / urgency / **ASA grade + E** (intake — with the district
"ASA III+/E = discuss before inducing" trigger in the hint); anaesthetic
history **self + family** (MH/scoline apnoea are inherited — the hint says why
the family question is not politeness); anticoagulants with exact last-dose
(gates neuraxial: LMWH ~12h prophylactic / ~24h treatment); fasting status
(6h/2h but labour/trauma/obstruction/opioids = full stomach whatever the
clock); functional capacity (METs); **airway assessment** (Mallampati, mouth
opening, TMD, neck, dentition, the obstetric airway); neuraxial/regional
suitability (landmarks, local sepsis, coagulation, the fixed-cardiac-output
contraindication).

## Exam checklist (`config/examChecklists.ts`, dept anaes)
Airway examined; fasting times established; personal + FAMILY anaesthetic
history; anticoagulant last-dose times; dentition checked/dentures out.

## Treatment sets (`config/treatmentSets.ts`)
- **Malignant hyperthermia crisis**: declare + help; STOP volatile/sux + clean
  circuit; 100% O2 hyperventilate; ⚠ dantrolene 2.5mg/kg IV repeat (*[EK]*);
  active cooling; treat hyperkalaemia; CK/renal/temp trend; district
  dantrolene-stock reality note.
- **Anaphylaxis under anaesthesia**: stop trigger; airway/100% O2; ⚠ adrenaline
  (IV titrated under monitoring vs IM — *[EK, AAGBI-anchored]*); hard fluids;
  tryptase 1h/4h/24h; refractory options incl. glucagon if beta-blocked (off);
  culprit documentation + alert card.
- **LAST**: stop injecting; declare; benzodiazepine for seizures; Intralipid
  20% 1.5ml/kg bolus + infusion; no lidocaine for the arrhythmia; modified
  ACLS + prolonged-CPR note (LAST arrests recover late).
- **Failed intubation / CICO**: Plan A optimise → B supraglottic → C face-mask
  + wake → D scalpel-bougie-tube FONA; oxygenation over intubation throughout;
  obstetric wake-vs-proceed modifier.
- **Spinal-CS hypotension**: left tilt; co-load; ⚠ phenylephrine 50-100mcg vs
  ephedrine 5-10mg by heart rate (*[EK/lit cross-check*); treat to baseline;
  nausea = hypotension until proven otherwise; **not responding = think
  bleeding** cross-check.
- **High / total spinal**: recognition (rising block, weak hands, whisper
  voice, brady+hypotension, apnoea); a resuscitation not a mystery — ventilate,
  atropine + vasopressor/adrenaline, fluids, deliver if arrest; it wears off —
  keep them alive.
- **Delayed emergence workup**: oxygen/glucose first; TOF → reverse residual
  block (neostigmine+glycopyrrolate; sugammadex availability note); ABG for
  CO2 narcosis; titrated naloxone trial; temperature; then central causes/CT.

## Smart blocks (`config/smartBlocks.ts`, dept anaes)
Pre-anaesthetic assessment (ASA+E, airway metrics, fasting, anticoag+last
dose, MH/scoline family history, METs, consent); spinal anaesthetic record
(position/level/needle/attempts/drug+dose/block level/baseline+lowest BP/
vasopressor/complications); intra-op crisis snapshot (the documentation
skeleton that co-fires with the crisis sets); PACU discharge (Aldrete-concept
criteria + analgesia plan written).

## Items flagged for your sign-off
1. **Dantrolene dosing/ceiling** — [EK]; verify against your MH box protocol.
2. **Intra-op anaphylaxis adrenaline doses** (IV titrated vs IM) — [EK,
   AAGBI-anchored]; verify vs SASA/STG.
3. **Phenylephrine/ephedrine doses** for spinal hypotension — [EK + SA
   obstetric-anaesthesia literature]; verify vs current STG/SASA.
4. **Spinal bupivacaine 9-11mg** (dossier §2.5) — informs the spinal-record
   block hints; verify vs your unit's dosing card.
5. Hyperbaric-bupivacaine, Intralipid, neostigmine/glycopyrrolate, sugammadex
   and naloxone figures follow the dossier without an explicit uncertainty
   flag — spot-check them in the same pass.
