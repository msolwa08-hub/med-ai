# Psychiatry — implementation record (M2)

Dossier (`../research/psychiatry.md`, 1911 lines) → app registries, 2026-07-10.
**Clinical content pending your review.** The MHCA Act/Regulations text, current
STG/EML mental-health chapter and SASOP/clozapine-registry documents all
returned HTTP 403 to automated fetch this session — SA-specific specifics
(form numbers, exact rapid-tranquillisation doses, ANC action bands) rest on
search-synthesis + established knowledge and are [EK]-flagged in app text;
verify against the gazetted Act and your current STG edition.

## Loop gate (live)
**100/100** — first-episode psychosis → substance-induced (methamphetamine) on
urine tox, referred-as-"psychosis" elderly confusion → multifactorial delirium
on septic+metabolic screen, rigidity+fever on haloperidol → NMS on CK+temp,
tremor+ataxia on lithium+new thiazide → lithium toxicity on serum level.
~9.6c/loop. Report `../eval/m2/loop-psych-2026-07-10.json`. Gated on the
enriched psych discipline lens (organic exclusion FIRST, continuous risk
assessment, MSE+collateral, treatment-emergent emergencies, MHCA overlay).

## Fields (`fields/departments/psych.ts`)
**MHCA legal status** (intake — voluntary/assisted/involuntary/72-hour/forensic
with form-purpose mapping in the hint; the load-bearing psychiatric admission
field); forensic history (CPA ss77-79 track vs routine MHCA); current
psychotropics incl. **depot name + last-date-given** (a missed depot explains a
"relapse") and clozapine monitoring phase/last ANC; past medication reactions
(prior NMS/dystonia changes today's rapid-tranq choice); **organic screen
status** (glucose-first, vitals, focal neuro, urine tox — "not psychiatric
until the screen is clean"); MSE hint carries the 8 domains + the
attention/fluctuation delirium tell; risk hint carries static-vs-dynamic
factors + the sudden-calm red flag.

## Panel (`lib/investigations.ts` — psych/emergency/medicine)
Lithium 12h-post-dose (bands 1.5/2.0/2.5 with dialysis language; a mistimed
level triggers its own guard alert); valproate trough ([EK] range); clozapine
ANC (amber <1.5 increase-monitoring, red <0.5 stop-don't-taper); CK-in-agitation
(≥10,000 = true NMS/rhabdo; a modest rise gets the restraint/IM-injection
confounder narrative); urine toxicology as free text (cannabis persists weeks,
meth ~2-4 days, false-positive caveats).

## Treatment sets (`config/treatmentSets.ts`)
- **Rapid tranquillisation**: de-escalation FIRST; oral offer before IM;
  lorazepam / ⚠ haloperidol 5mg + promethazine 25-50mg IM (*[EK], verify STG*);
  olanzapine-IM + benzodiazepine contraindication; midazolam respiratory caveat;
  post-dose obs q15-30min; never restrain prone; MHCA documentation.
- **NMS**: STOP the antipsychotic; cooling; IV fluids + CK/renal trend (rhabdo);
  benzodiazepines; dantrolene/bromocriptine (off); ICU referral criteria; the
  serotonin-syndrome discriminator (clonus/hyperreflexia, <24h, serotonergic drug).
- **Serotonin syndrome**: stop serotonergics; benzodiazepines + supportive;
  cyproheptadine (off); hyperthermia management; Hunter-criteria anchor.
- **Lithium toxicity**: stop lithium + nephrotoxics; IV fluids; serial levels +
  U&E; dialysis indications by band + clinical picture; the
  thiazide/NSAID/ACEi precipitant note.
- **Alcohol withdrawal / DTs**: CIWA-Ar-driven benzodiazepine ladder (*[EK],
  verify STG schedule*); **thiamine BEFORE glucose**; magnesium; DTs escalation.
- **Acute dystonia / EPSE**: biperiden/promethazine; laryngeal-dystonia airway
  flag; the akathisia-misread-as-agitation trap (propranolol, dose reduction).
- **Suicidal patient — safety pathway**: remove means; observation level; formal
  documented risk assessment; safety plan BEFORE discharge; paracetamol-OD
  medical co-management pointer; MHCA status decision.

## Smart blocks (`config/smartBlocks.ts`, dept psych)
MSE (8 domains; hallucination modality — visual/tactile suggests organic;
attention as the delirium tell); risk assessment (self/others/neglect,
static vs dynamic, protective factors, observation level); MHCA status &
capacity (status + form numbers + next legal step/clock); substance &
withdrawal watch (last use, CIWA-Ar score + next due, thiamine given).

## Items flagged for your sign-off
1. **Rapid-tranquillisation doses** (haloperidol 5mg + promethazine 25-50mg IM)
   — [EK, consistent with SA audit literature]; verify vs current STG.
2. **CIWA-Ar benzodiazepine dosing schedule** — [EK]; verify exact SA STG doses.
3. **Clozapine ANC action bands** (amber 1.5, stop 0.5 ×10⁹/L) — registries
   differ; verify vs the protocol/SASOP registry in force at your unit.
4. **Lithium/valproate ranges** and toxicity bands — standard toxicology
   teaching [EK]; confirm local lab reference.
5. **MHCA form-number mapping** (04/05/06/07/08/22) — Act/Regulations PDFs
   403'd; verify against the current in-force Regulations.
