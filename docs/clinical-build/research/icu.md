# Intensive Care / High-Dependency — Consultant Depth Dossier

*Target reader: the intern/MO covering an ICU or HDU bed at 02:00 in a SA state hospital (often
alone, often the most junior doctor physically present), and the MedAI engine standing behind
them. This is the depth reference, not a summary — it goes deeper than
`docs/clinical-foundations.md`. Structure adapted from the DEPTH-BAR six-part standard to fit
critical care: the mental model; the organ-system framework worked to depth (respiratory,
cardiovascular, renal, neuro, sepsis/infection, metabolic/GI, haematological — each treated like
a presenting syndrome: differential/mechanism, discriminating assessment, investigations +
interpretation, management anchors, traps & pearls); the normals on an ICU chart; cross-cutting
investigation interpretation; scores/tools; SA-specific reality.*

*Primary SA sources: **Adult Hospital Level STGs & EML** (NDoH, Chapter 23 — Adult Critical
Care, incl. the October 2023 vasopressor review moving first-line septic-shock vasopressor from
adrenaline toward noradrenaline); **Critical Care Society of Southern Africa (CCSSA) Guidelines
for the Provision of Critical Care Services**; the **CCSSA/Southern Africa Consensus Guideline on
ICU Triage and Rationing (ConICTri)**; **2023 ART Clinical Guidelines (NDoH)** and **SA HIV
Clinicians Society AHD guidance**; **National TB Management Guidelines 2023**. Global: **Surviving
Sepsis Campaign 2021** (incl. the Hour-1 Bundle), **ARDSnet/NIH ARDS Network** low-tidal-volume
ventilation trial and PEEP/FiO₂ tables, **KDIGO 2012 AKI**, **NICE-SUGAR** glycaemic targets,
**TRICC** restrictive transfusion trial, **PADIS 2018** (pain/agitation/delirium/immobility/sleep)
guidelines, standard critical-care physiology texts (Marino's *The ICU Book*, Oh's *Intensive Care
Manual*). Items resting on established knowledge are marked [EK]. Full source ledger at the end.*

---

## 1. The intensivist's mental model

**ICU cognition is not diagnostic — it is a closed-loop control problem.** The intensivist does
not primarily ask "what disease does this patient have"; they ask "which organ systems are
failing, by how much, in which direction is the trend moving, and what is my next intervention
if the trend continues." The diagnosis matters, but the *trajectory* is the primary object of
attention on an hour-to-hour basis. A patient who is "sick but improving" and a patient who is
"less sick but worsening" are managed completely differently even at the same absolute severity.

**Resuscitate before you investigate, always in that order.** Airway, breathing, circulation are
fixed with the information you have at the bedside — a stat gas, a lactate, a clinical exam — not
after a CT scan. The corollary: every resuscitative intervention (a fluid bolus, a pressor
titration, a ventilator change) is itself a diagnostic test — if it doesn't produce the expected
physiological response, that mismatch is data (e.g. a fluid bolus that doesn't raise BP or urine
output points away from hypovolaemia and toward cardiogenic/obstructive shock or a septic patient
who needs a pressor, not more crystalloid).

**The daily systems review — FASTHUGSBID (or equivalent head-to-toe organ round) is not a
checklist, it is the operating system.** Every patient, every day (often twice), gets walked
through:
- **F**eeding — is nutrition running, is it adequate, is the route right (enteral preferred)?
- **A**nalgesia — pain score/behavioural scale, is the analgesic regimen adequate and opioid-sparing
  where possible?
- **S**edation — target RASS, are we over-sedated (delaying wake-up, weaning, delirium) or
  under-sedated (agitation, self-extubation risk, ventilator dyssynchrony)?
- **T**hromboprophylaxis — mechanical and/or pharmacological, any contraindication today?
- **H**ead-of-bed elevation (30–45°) — VAP prevention, reflux/aspiration risk.
- **U**lcer (stress) prophylaxis — indicated (ventilated >48h, coagulopathy) or can it be stopped?
- **G**lycaemic control — target range, is the regimen causing swings/hypoglycaemia?
- **S**pontaneous breathing trial / **S**edation-hold — has today's SAT+SBT been attempted; can this
  patient come off the ventilator today?
- **B**owel regimen — ileus, constipation from opioids, diarrhoea from feeds/antibiotics.
- **I**ndwelling lines/catheters/tubes — is each one still needed *today* (the single highest-yield
  VAP/CLABSI/CAUTI intervention is removing devices that are no longer necessary)?
- **D**e-escalation — antibiotics reviewed against culture results at 48–72h; drug chart reviewed
  for renal/hepatic dosing and anything that can be stopped.

Layered onto FASTHUGSBID is the **organ-by-organ round**: neuro (GCS/RASS/CAM-ICU, pupils,
sedation plan) → respiratory (vent settings, gas, secretions, extubation readiness) →
cardiovascular (haemodynamics, pressor doses, fluid balance, rhythm) → renal (urine output,
creatinine trend, electrolytes, RRT need) → GI/nutrition (feeds tolerated, bowel, liver) →
hae­matology/infection (FBC, cultures, antibiotic day-count, lines) → **lines/tubes/skin** (every
device justified, pressure areas checked) → **the family conversation and the goals-of-care
status** (has this been addressed today, does it need revisiting).

**The ceiling-of-care / futility conversation is core cognition, not an afterthought.** Before —
or at the same moment as — escalating support, the intensivist is asking: *is this reversible, and
is the burden of ongoing/escalated intensive therapy proportionate to a realistic outcome the
patient would want?* This is not rationing dressed up as ethics (though in SA it is often also
literally rationing — see §6) — it is the discipline of setting an explicit ceiling (full
escalation vs ward-level care vs comfort care) early, documenting it, and revisiting it as the
trajectory becomes clearer, rather than drifting into open-ended escalation by default. A "trial of
ICU" with a pre-agreed review point (typically 48–72h) is a legitimate and common structure —
admit, treat maximally, and re-assess against a stated marker of reversibility (e.g. lactate
clearance, vasopressor requirement trend, oxygenation trend) rather than treating indefinitely
without a checkpoint.

**The three questions behind every ICU review, every shift:**
1. *Is this patient's trajectory improving, static, or worsening* — on organ support requirements,
   not on a single number?
2. *What is the single reversible driver I have not yet addressed* — an undrained source of
   sepsis, a missed compartment syndrome, an under-resuscitated volume deficit, a wrong ventilator
   setting, a drug that needs renal dosing, an unaddressed delirium precipitant?
3. *What is this patient's ceiling of care, and does today's data change it?*

**Tempo discipline.** ICU tempo is minute-to-minute for the unstable patient (titrating a pressor
against a MAP target, adjusting FiO₂ against a saturation target) and day-to-day for the stable
ventilated patient (weaning trajectory, nutrition, delirium prevention, deconditioning). Confusing
the two — micromanaging a stable patient's numbers, or under-reacting to a deteriorating one
because "the round is only twice a day" — is a common junior error.

---

## 2. Organ-system framework — worked to depth

> Format per system: **Differential/mechanism** · **Discriminating assessment (history + exam +
> bedside)** · **Investigations + interpretation nuance** · **Management anchors (SA STG/EML +
> global anchor where SA guidance is silent)** · **Traps & pearls.**

### 2.1 RESPIRATORY

**Differential/mechanism — why is this patient hypoxic/hypercapnic/on a ventilator?**
- *Hypoxaemic respiratory failure (Type 1, PaO₂ low, PaCO₂ normal/low):* ARDS, pneumonia (bacterial,
  PJP, viral), pulmonary oedema (cardiogenic or non-cardiogenic), PE, atelectasis, pneumothorax,
  large effusion, pulmonary haemorrhage.
- *Hypercapnic (ventilatory) failure (Type 2, PaCO₂ high):* COPD/asthma decompensation,
  neuromuscular weakness (GBS, myasthenic crisis, critical-illness polyneuromyopathy — see 2.4),
  central hypoventilation (opioid/sedative excess, brainstem lesion), severe obesity/OSA,
  exhaustion from prolonged Type 1 failure (a Type 1 patient who tires becomes Type 2 — a red
  flag for imminent arrest).
- *Mixed/mechanical:* airway obstruction, chest wall/flail segment, massive abdominal distension
  splinting the diaphragm, high spinal cord injury.
- *Zebras/consultant-considers:* PJP in undiagnosed HIV (bilateral ground-glass, disproportionate
  hypoxia to CXR appearance, exertional desaturation before it's obvious at rest), amniotic fluid
  embolism/TRALI/TACO as causes of sudden peri-partum or post-transfusion ARDS-like pictures,
  re-expansion pulmonary oedema after rapid large-volume thoracentesis, negative-pressure pulmonary
  oedema post-extubation laryngospasm, pulmonary vasculitis/pulmonary-renal syndrome.

**Discriminating assessment.** Work of breathing (accessory muscles, paradoxical abdominal
movement — diaphragmatic fatigue), symmetry of chest movement/air entry, tracheal position,
secretions (volume, colour, ease of clearance — a marker of cough strength and a VAP clue),
ventilator waveform inspection (flow/pressure curves — auto-PEEP, dyssynchrony), cuff leak (extubation
readiness for laryngeal oedema risk), SpO₂ trend versus a single value, and the *story*: sudden
desaturation post-procedure (pneumothorax, mucus plug, tube displacement — think **DOPE**:
Displacement, Obstruction, Pneumothorax, Equipment failure) versus gradual deterioration over days
(evolving ARDS/pneumonia).

**Ventilation modes — what they mean and when to choose them** [EK]:
- **Volume control (VC)** — set tidal volume, flow, rate; pressure varies with compliance/resistance
  (a rising peak pressure signals a problem: bronchospasm, secretions, pneumothorax, worsening
  compliance). The workhorse for lung-protective ARDS ventilation because tidal volume is
  guaranteed.
- **Pressure control (PC)** — set inspiratory pressure, rate, inspiratory time; volume varies with
  compliance (a falling delivered volume signals worsening compliance/resistance). Better peak-
  pressure limitation and gas distribution in very non-compliant lungs; requires closer volume
  monitoring.
- **Pressure-support (PS)/spontaneous modes** — patient-triggered, pressure-assisted breaths; used
  for weaning and for patients with intact respiratory drive.
- **SIMV** — mandatory breaths synchronised with patient effort plus spontaneous breaths in between;
  largely superseded as a primary weaning mode by daily SBTs (evidence favours SBT over gradual
  SIMV wean).
- **APRV (airway pressure release ventilation)** — a high-CPAP level with brief releases; used in
  severe ARDS in some units for recruitment, more operator-dependent, not first-line.
- **NIV (BiPAP/CPAP)** — first-line for COPD exacerbation with respiratory acidosis, cardiogenic
  pulmonary oedema; relatively contraindicated for de novo hypoxaemic ARDS-type failure (delays
  intubation, risk of self-inflicted lung injury from large spontaneous tidal volumes) except as a
  closely-monitored trial with a low threshold to intubate.
- **High-flow nasal oxygen (HFNO)** — an alternative to NIV in Type 1 failure (better tolerated,
  some evidence of reduced intubation in pneumonia/PJP), useful bridging/weaning tool; requires the
  same close monitoring and low threshold to escalate.

**ARDS — Berlin definition and ARDSnet lung-protective ventilation (the signature ICU
protocol).**
- **Berlin criteria:** onset within 1 week of a known insult; bilateral opacities on CXR/CT not
  fully explained by effusion/collapse/nodules; respiratory failure not fully explained by cardiac
  failure/fluid overload (objective assessment — echo — if no clear risk factor); oxygenation
  measured on **PEEP ≥5 cmH₂O**: **mild** PaO₂/FiO₂ 200–300 mmHg, **moderate** 100–200,
  **severe** <100.
- **ARDSnet ventilation strategy** [EK — NIH ARDS Network]:
  - **Tidal volume 6 mL/kg predicted body weight (PBW)**, titrated down from an initial 8 mL/kg in
    steps of 1 mL/kg over 1–4h if plateau pressure allows; PBW (not actual weight) drives the
    calculation — **male PBW = 50 + 0.91 × (height cm − 152.4); female PBW = 45.5 + 0.91 ×
    (height cm − 152.4)**.
  - **Plateau pressure (inspiratory hold) target ≤30 cmH₂O** — the single best bedside surrogate
    for alveolar overdistension; reduce Vt further (down to 4 mL/kg if needed) if plateau exceeds
    30.
  - **Permissive hypercapnia** accepted (target pH ≥7.30, sometimes lower tolerated if
    haemodynamically stable) to protect the lung rather than chase a normal PaCO₂.
  - **PEEP/FiO₂ table** — paired stepwise titration, e.g. **low-PEEP arm**: FiO₂ 0.3→PEEP 5;
    0.4→5–8; 0.5→8–10; 0.6→10; 0.7→10–14; 0.8→14; 0.9→14–18; 1.0→18–24. A **high-PEEP arm**
    (used in moderate–severe ARDS) pairs lower FiO₂ with higher PEEP at each step (e.g.
    0.3→PEEP 5–14 rather than 5) — the exact table should be posted at the bedside; the *principle*
    (oxygenate by raising PEEP before chasing FiO₂ toward toxic levels) is what to internalise.
  - **Target SpO₂ 88–95%** or **PaO₂ 55–80 mmHg** — deliberately not "normal" — over-oxygenation is
    not the goal.
  - **Adjuncts for moderate–severe ARDS (P/F <150):** **prone positioning** for ≥12–16h/day (the
    single intervention with the strongest mortality benefit in severe ARDS — PROSEVA trial-level
    evidence [EK]); **neuromuscular blockade** (cisatracurium infusion) considered early in severe
    ARDS with ventilator dyssynchrony; **conservative fluid management** once shock resolved (a
    net-even or negative fluid balance improves ventilator-free days); recruitment manoeuvres
    selectively; ECMO as a rescue at specialist centres (essentially unavailable at most SA state
    facilities — know your referral pathway, or accept it is not an option).

**Weaning and the spontaneous breathing trial (SBT).**
- **Readiness criteria** [EK]: the precipitating cause of respiratory failure is resolving/resolved;
  adequate oxygenation (P/F ≥150–200, or SpO₂ ≥90% on PEEP ≤5–8 cmH₂O and FiO₂ ≤0.4–0.5); pH ≥7.25;
  haemodynamically stable (no or minimal vasopressor); able to initiate a spontaneous breath;
  adequate mentation (RASS roughly −2 to 0; does not need to be fully awake if predictably
  rousable); adequate cough/secretion burden.
- **Rapid shallow breathing index (RSBI) = respiratory rate / tidal volume (L)** — measured during
  a brief trial of unsupported/low-support breathing; **RSBI <105 predicts SBT/extubation
  success**; a high RSBI predicts failure and should prompt delaying extubation.
- **SBT technique:** 30–120 minutes of T-piece, CPAP, or low-level pressure support (5–8 cmH₂O);
  monitor RR, SpO₂, heart rate, blood pressure, work of breathing, mental state — failure
  criteria include RR >35, SpO₂ <90%, HR rise >20%, SBP <90 or >180, agitation/diaphoresis/distress.
- **Daily coordinated SAT (spontaneous awakening trial) + SBT** — the paired protocol reduces
  ventilator days; sedation is *held* first (unless contraindicated — active seizures, raised ICP,
  neuromuscular blockade, agitation risk to self), then the SBT is attempted once the patient is
  awake enough to protect their airway.
- **Extubation** requires, in addition to a passed SBT: patent airway (cuff-leak test if concern
  for laryngeal oedema — prolonged intubation, traumatic intubation, prior stridor), adequate
  cough (able to generate an effective peak cough flow), and a clear plan for post-extubation
  support (HFNO/NIV standby in high-risk patients — obesity, COPD, cardiac failure, prolonged
  ventilation, reintubation risk factors).
- **Tracheostomy** consideration around day 7–14 of anticipated prolonged ventilation — earlier
  in high-risk-for-prolonged-course patients (severe neuromuscular disease, high spinal injury,
  very slow-weaning ARDS) to reduce sedation needs and facilitate mobilisation.

**ABG-in-context — the ventilated patient.** A gas is never interpreted alone: pair it with the
ventilator settings that produced it. A PaCO₂ of 6.5 kPa is *appropriate* on a deliberately
permissive-hypercapnia ARDSnet strategy and *alarming* on a patient meant to be normocapnic. A
falling P/F ratio on unchanged PEEP/FiO₂ is the earliest sign of worsening ARDS/VAP/collapse —
trend it explicitly, every gas. See §4.1 for the full stepwise acid–base method and the A–a
gradient.

**Management anchors (SA STG/EML + global).** Oxygen titrated to target (88–92% only if a
CO₂-retention risk, otherwise 94–98% pre-intubation). Intubation drugs and technique per local
protocol (rapid-sequence induction — ketamine or etomidate + suxamethonium/rocuronium are the
common SA combinations; ketamine is often preferred haemodynamically in shocked patients). Post-
intubation sedation/analgesia per §2.4. Nebulised bronchodilators (salbutamol/ipratropium) for
bronchospasm. Chest drain for pneumothorax/large effusion. Antibiotics per the septic-screen
pathway (§2.5) for pneumonia/VAP. Diuresis for cardiogenic pulmonary oedema once perfusion allows.

**Traps & pearls.** A sudden desaturation in a ventilated patient is **DOPE** until proven
otherwise — disconnect and bag-ventilate by hand while you troubleshoot; don't chase ventilator
settings on a blocked or displaced tube. Rising peak pressure with unchanged plateau pressure =
an airway/circuit problem (secretions, bronchospasm, biting the tube); rising peak *and* plateau =
a lung/chest-wall compliance problem (worsening ARDS, pneumothorax, abdominal distension,
auto-PEEP). Never chase a "normal" PaCO₂ in ARDS at the cost of a damaging tidal volume —
permissive hypercapnia is the strategy, not a failure of ventilation. HFNO/NIV in a
deteriorating hypoxaemic patient buys time, it doesn't fix the problem — set an explicit
re-assessment time and threshold for intubation, don't let it become a slow-motion arrest. In HIV
with unexplained severe hypoxaemia and a relatively unimpressive CXR, think PJP and check a CD4/
HIV status before assuming "atypical pneumonia".

### 2.2 CARDIOVASCULAR

**Differential — the four shock states, differentiated (the core cognitive task).**

| Shock type | Mechanism | Preload (CVP/JVP) | Cardiac output | SVR | Skin | Classic exam |
|---|---|---|---|---|---|---|
| **Hypovolaemic** | Volume loss (haemorrhage, GI, third-spacing, burns) | Low | Low | High | Cold, clammy | Flat neck veins, tachycardia, narrow pulse pressure |
| **Cardiogenic** | Pump failure (MI, arrhythmia, cardiomyopathy, valve) | High | Low | High | Cold, clammy | Raised JVP, S3, crepitations, cool peripheries |
| **Distributive** | Vasoplegia (septic, anaphylactic, neurogenic, adrenal crisis) | Low/normal | High (early septic) → falls late | **Low** | **Warm** (early septic/anaphylactic); neurogenic classically warm + bradycardic | Bounding pulses early, wide pulse pressure; neurogenic: warm + bradycardic (loss of sympathetic tone) |
| **Obstructive** | Mechanical impediment to flow (tamponade, tension pneumothorax, massive PE, aortic stenosis crisis) | High | Low | High | Cold | Raised JVP + clear lungs (PE) or muffled sounds/pulsus paradoxus (tamponade) or tracheal deviation (pneumothorax) |

*Mixed shock is the rule in a sick ICU patient, not the exception* — a septic patient with
myocardial depression (septic cardiomyopathy) is simultaneously distributive and cardiogenic; a
trauma patient can be hypovolaemic and obstructive (tension pneumothorax) at once. Re-assess the
mechanism after every intervention rather than anchoring on the admission label.

**Discriminating assessment beyond the table.** Capillary refill time and mottling score
(peripheral perfusion — a simple bedside marker that tracks outcome as well as lactate in some
studies [EK]). Pulse character (bounding = vasoplegic; thready = low output/hypovolaemic; pulsus
paradoxus = tamponade/severe asthma). JVP and its waveform. Passive leg raise response at the
bedside (see fluid-responsiveness below). Urine output as a real-time perfusion marker
(<0.5 mL/kg/h suggests inadequate renal perfusion). Lactate trend, not a single value (see §4.2).
POCUS: IVC size/collapsibility, LV/RV function and size (a small hyperdynamic LV with a collapsing
IVC = hypovolaemic/distributive; a dilated poorly-contracting LV = cardiogenic; a dilated RV with
septal flattening = massive PE/obstructive right heart strain; pericardial effusion with RV
diastolic collapse = tamponade), lung ultrasound (B-lines = wet lung), eFAST for occult haemorrhage.

**Fluid-responsiveness tests — before you give the next litre.** Static pressures (CVP, PAOP) are
poor predictors of fluid responsiveness [EK] and should not be used alone to decide on further
fluid. Dynamic tests:
- **Passive leg raise (PLR)** — raise the legs to 45° from a semi-recumbent position (an
  auto-transfusion of ~150–300 mL); a rise in stroke volume/cardiac output (measured by any
  available method — echo VTI, arterial waveform analysis, non-invasive CO monitor) of **≥10%**
  predicts fluid responsiveness. Valid regardless of ventilation mode or rhythm — the most broadly
  applicable dynamic test.
- **Pulse pressure variation (PPV) / stroke volume variation (SVV)** — cyclical variation in
  arterial pulse pressure with positive-pressure ventilation; **PPV >12–13%** predicts
  responsiveness. **Only valid** in a fully sedated, passively ventilated patient with **tidal
  volume ≥8 mL/kg**, no spontaneous breathing effort, closed chest, and sinus rhythm — invalid in
  spontaneously breathing patients, arrhythmia, low tidal volume lung-protective ventilation, or
  open chest/raised intra-abdominal pressure. This is a frequently over-applied test in a lung-
  protective (6 mL/kg) ARDS patient — know the caveat.
- **IVC ultrasound** — in a **spontaneously breathing** patient, a **collapsibility index
  ≥40–50%** on sniff suggests responsiveness (crude, load- and technique-dependent); in a
  **mechanically ventilated, passive** patient, IVC **distensibility index ≥18%** suggests
  responsiveness. Neither is as robust as PLR or a mini-fluid challenge.
- **End-expiratory occlusion test / mini-fluid challenge (100 mL over 1 min with CO
  measurement)** — useful when PLR is impractical.
- The point of all of these: **stop giving fluid to a patient who is not fluid-responsive** — in a
  septic or ARDS patient, unnecessary fluid worsens pulmonary oedema, raises intra-abdominal
  pressure, and is independently associated with worse outcomes. "Fluid responsive" also does not
  automatically mean "should receive fluid" — respond to the clinical picture, not the test alone.

**Vasopressors and inotropes — mechanism, indication, and dose** [EK doses, grounded choice of
first-line agent to SA STG Ch.23 2023 vasopressor review]:
- **Noradrenaline (norepinephrine)** — predominantly α1 (vasoconstriction) with modest β1
  (inotropy); **first-line vasopressor for septic and most distributive/vasoplegic shock**
  (superseding adrenaline as SA STG first-line per the 2023 chapter revision, aligning with
  international practice). Dose **0.01–0.5 microgram/kg/min**, titrate to a **MAP target of
  ≥65 mmHg** (higher, e.g. 80–85, in previously hypertensive patients if organ perfusion markers
  don't improve at 65); doses above ~1–3 microgram/kg/min are refractory-shock territory and
  should prompt a search for an unaddressed cause (undrained source, adrenal insufficiency,
  obstructive component) and consideration of a second agent.
- **Adrenaline (epinephrine)** — α and β1/β2; add-on/second agent in catecholamine-refractory
  septic shock, or first-line in **anaphylaxis (IM 0.5 mg = 0.5 mL of 1:1000 into the anterolateral
  thigh, repeated every 5 min; IV infusion for refractory anaphylactic shock in a monitored
  setting)** and **cardiac arrest**. Dose as an infusion **0.01–0.5 microgram/kg/min**. Causes
  lactate elevation via β2-mediated effects — do not mistake this for worsening shock when
  adrenaline is running (a recognised confounder of lactate as a resuscitation marker).
- **Vasopressin** — non-catecholamine vasoconstrictor (V1 receptor); typically **fixed low-dose
  add-on (0.03–0.04 units/min, not titrated)** in catecholamine-resistant septic shock, allowing a
  reduction in noradrenaline dose; also useful in vasoplegia post-cardiac surgery.
- **Dobutamine** — predominantly β1 inotrope with some β2 vasodilation; first-line **inotrope for
  cardiogenic shock/low cardiac output** with adequate-to-high filling pressures, and for **septic
  cardiomyopathy** (persistent hypoperfusion despite adequate MAP on noradrenaline and adequate
  volume). Dose **2.5–20 microgram/kg/min**; causes tachycardia and can drop SVR/BP at higher doses
  (may need to run alongside a vasopressor).
- **Dopamine** — largely abandoned as a first-line agent (higher arrhythmia rates, no outcome
  benefit over noradrenaline in trials [EK]); occasionally still used where noradrenaline is
  unavailable or for symptomatic bradycardia; dose-dependent receptor effects (low-dose "renal"
  dopamine has **no evidence** for renal protection and should not be used for this indication).
- **Milrinone** (phosphodiesterase-3 inhibitor, inodilator) — for right-heart failure/pulmonary
  hypertension or when a β-blocked/β-agonist-tolerant heart needs inotropy without more β-stimulation;
  caution — long half-life, renally cleared, causes vasodilation/hypotension; rarely stocked at
  district/regional level in SA.
- **Phenylephrine** — pure α1 agonist; niche use (tachyarrhythmia where β-stimulation is
  undesirable, aortic stenosis where tachycardia is dangerous); reflex bradycardia and reduced
  cardiac output are risks.
- **Central vs peripheral administration** — noradrenaline via a **peripheral line for a short
  period (hours, at low-to-moderate dose, in a large proximal vein, closely monitored for
  extravasation) is increasingly accepted** as a bridge while central access is obtained; it
  should not delay resuscitation, but a central line remains standard for sustained or escalating
  vasopressor requirements and for reliable CVP/ScvO₂ sampling if used.

**Structural/obstructive causes needing specific rescue.** **Tension pneumothorax** — needle/finger
thoracostomy immediately, do not wait for imaging. **Cardiac tamponade** — pericardiocentesis
(echo-guided where possible). **Massive PE with shock** — systemic thrombolysis (or catheter-
directed/surgical embolectomy where available) is a resuscitative intervention, not an elective
one, in a peri-arrest patient. **Arrhythmia as the shock driver** — synchronised cardioversion for
unstable tachyarrhythmia, pacing for symptomatic bradyarrhythmia/heart block — treat the rhythm
before chasing pressors that won't work against an unaddressed mechanical/electrical problem.

**Traps & pearls.** Do not give more fluid to a patient who has already shown they are not
fluid-responsive — reach for a pressor or inotrope instead, and re-examine the mechanism. A MAP of
65 achieved with an escalating noradrenaline dose in a patient with cold peripheries and a rising
lactate is not "resolved shock" — it is under-treated shock with a normalised number; look at
perfusion markers, not just the MAP. Distinguish a fluid-refractory distributive shock that needs
a pressor from a cardiogenic shock that will decompensate further with more fluid — a bedside echo
resolves this faster and more safely than trial-and-error boluses. Adrenaline-associated lactate
rise is a pharmacological artefact, not necessarily worsening shock — trend it against the clinical
picture. Vasopressor extravasation causes tissue necrosis — a peripheral noradrenaline line needs
frequent site checks.

### 2.3 RENAL

**Differential/mechanism — ICU AKI.** Use the same pre-renal/intrinsic/post-renal framework as
ward medicine (see internal-medicine.md §4.7 for the full workup) but recognise the ICU-specific
weighting: the overwhelming majority of ICU AKI is **multifactorial pre-renal-plus-ATN** driven by
sepsis, hypotension, nephrotoxin exposure (aminoglycosides, contrast, amphotericin, tenofovir,
vancomycin, NSAIDs), and intra-abdominal hypertension/abdominal compartment syndrome (measure
bladder pressure in the distended, oedematous, post-laparotomy or burns patient — **IAP >20 mmHg
with new organ dysfunction = abdominal compartment syndrome**, a surgical emergency). Rhabdomyolysis
(crush injury, prolonged immobilisation/downtime, status epilepticus, malignant hyperthermia,
NMS/serotonin syndrome — check CK) is common in trauma/collapse-found-down presentations. Contrast-
associated AKI is a real but often over-attributed cause — do not withhold necessary imaging for
this reason in an unstable patient.

**Discriminating assessment.** Urine output trend (hourly, via catheter — the single most
responsive ICU renal monitor), fluid balance (cumulative, not just daily), abdominal
distension/tenderness/bladder pressure, evidence of obstruction (palpable bladder, hydronephrosis
on bedside USS), drug chart review for nephrotoxins, CK if rhabdomyolysis suspected, and the
volume-status exam feeding into the same fluid-responsiveness questions as §2.2 (renal
hypoperfusion from untreated shock is the commonest reversible driver).

**Staging (KDIGO 2012)** [EK — as detailed in internal-medicine.md §4.7]: Stage 1 — creatinine
×1.5–1.9 or rise ≥26.5 µmol/L, or urine <0.5 mL/kg/h for 6–12h. Stage 2 — ×2.0–2.9, or urine
<0.5 mL/kg/h ≥12h. Stage 3 — ×3.0, or creatinine ≥353.6 µmol/L, or RRT started, or urine
<0.3 mL/kg/h ≥24h or anuria ≥12h. Trend the creatinine and the hourly urine output on the ICU chart
as the two headline renal numbers every shift.

**RRT — indications (the AEIOU mnemonic) and modality choice.**
- **A**cidosis — severe, refractory metabolic acidosis (pH <7.1–7.15) not correcting with treatment
  of the underlying cause.
- **E**lectrolytes — refractory, life-threatening hyperkalaemia (K⁺ >6.5, or any level with ECG
  changes) not responding to medical management.
- **I**ntoxication — a dialysable toxin/drug (methanol, ethylene glycol, salicylate, lithium,
  severe valproate/metformin toxicity).
- **O**verload — refractory fluid overload with pulmonary oedema/hypoxia not responding to
  diuretics.
- **U**raemia — uraemic encephalopathy, uraemic pericarditis, uraemic bleeding diathesis (clinical
  uraemic complications, not a creatinine number alone).
- Additional practical trigger: rising creatinine/oliguria with a clearly non-recoverable
  trajectory in a patient for whom RRT is otherwise appropriate (a ceiling-of-care question — see
  §1 and §6, since RRT slots are a rationed resource in SA state hospitals).
- **Modality:** **continuous RRT (CVVH/CVVHDF)** preferred in the haemodynamically unstable patient
  (gentler, slower fluid/solute shifts); **intermittent haemodialysis (IHD)** for the
  haemodynamically stable patient or when CRRT is unavailable (common at SA regional/district
  level — IHD, often via renal-service outreach, is frequently the *only* available modality,
  which changes timing and stability requirements for the referral). **Anticoagulation of the
  circuit** (citrate preferred where available, or heparin) balanced against bleeding risk.

**Management anchors.** Stop nephrotoxins, optimise perfusion (guided by the fluid-responsiveness
tools in §2.2 — not reflexive fluid loading), treat the underlying driver (sepsis source control,
relieve obstruction, decompress abdominal compartment), dose every renally-cleared drug to the
current (not baseline) renal function, avoid "renal-dose" dopamine and routine diuretics as
kidney-protective strategies (no evidence), and use furosemide only to manage volume once perfusion
is adequate — not as a treatment for AKI itself.

**Traps & pearls.** Oliguria in the first hours after ICU admission is usually appropriate ADH-
driven fluid conservation in an under-resuscitated patient, not necessarily "renal failure" — treat
the physiology, re-assess with a fluid-responsiveness test before reflex fluid boluses or reflex
furosemide. Intra-abdominal hypertension is under-measured and a common missed driver of oliguria
in the distended post-operative or burns patient — measure the bladder pressure. Contrast should
not be withheld from a critically unstable patient who needs the scan to find their source of
sepsis/haemorrhage for fear of contrast nephropathy — the untreated primary problem is the greater
risk. In SA, know your unit's actual RRT modality and capacity before you promise it — CRRT slots
and machines are frequently the tightest bottleneck in the ICU.

### 2.4 NEUROLOGICAL

**Differential/mechanism — altered consciousness or agitation in the ICU patient.** Sedation/
analgesia effect (the commonest cause — always the first thing to check), delirium (hyperactive,
hypoactive, or mixed — hypoactive is more common and more often missed), undertreated pain,
untreated primary neurological injury (raised ICP, stroke, seizure — including non-convulsive
status, which looks like unexplained unresponsiveness), metabolic derangement (glucose, sodium,
uraemia, hepatic encephalopathy, hypercapnia), sepsis-associated encephalopathy, alcohol/substance
withdrawal, critical-illness polyneuromyopathy (weakness, not consciousness, but frequently
co-presents and is missed as "failure to wake up").

**Sedation and analgesia — target-driven, not reflexive.** Default target for most ICU patients is
**light sedation (RASS 0 to −2)** unless a specific indication exists for deeper sedation
(therapeutic paralysis for severe ARDS/proning, status epilepticus, raised ICP management,
severe ventilator dyssynchrony, deliberate therapeutic hypothermia). Deep, prolonged sedation is
independently associated with longer ventilation, more delirium, and worse outcomes [EK — PADIS
2018]. **Analgesia-first sedation** — treat pain (opioid — morphine or fentanyl infusion, or
intermittent dosing) before adding a sedative, since untreated pain itself drives agitation.
**Agents:** propofol (rapid on/off, useful for daily interruption, causes hypotension and, at high
dose/prolonged infusion, propofol infusion syndrome — metabolic acidosis, rhabdomyolysis,
arrhythmia, especially >4 mg/kg/h for >48h); midazolam (cheaper, more available at resource-limited
sites, but accumulates — especially in renal/hepatic impairment and the elderly — prolonging
wake-up and increasing delirium risk, so used more cautiously as a first-line continuous infusion
where propofol is available); dexmedetomidine (α2-agonist, allows rousable light sedation without
respiratory depression, reduces delirium versus benzodiazepines [EK], but limited availability/cost
at most SA state facilities). **Daily sedation interruption (SAT)** paired with the SBT (§2.1) is
standard practice, contraindications noted above.

**RASS (Richmond Agitation-Sedation Scale) — the working sedation scale.**

| Score | Term | Description |
|---|---|---|
| +4 | Combative | Overtly combative, violent, danger to staff |
| +3 | Very agitated | Pulls/removes tubes or catheters, aggressive |
| +2 | Agitated | Frequent non-purposeful movement, fights ventilator |
| +1 | Restless | Anxious, apprehensive, movements not aggressive |
| 0 | Alert and calm | — |
| −1 | Drowsy | Not fully alert, sustained (>10s) awakening to voice |
| −2 | Light sedation | Briefly (<10s) awakens to voice with eye contact |
| −3 | Moderate sedation | Movement/eye opening to voice, no eye contact |
| −4 | Deep sedation | No response to voice, movement/eye opening to physical stimulus |
| −5 | Unarousable | No response to voice or physical stimulation |

**CAM-ICU — delirium screening (only interpretable at RASS ≥ −3).**
Feature 1 — **acute onset or fluctuating course** (change from baseline mental status, or
fluctuation over 24h, per RASS/GCS/prior delirium assessment) — **AND** Feature 2 —
**inattention** (fails a letter-vigilance or picture-recognition attention test) — **AND
EITHER** Feature 3 — **altered level of consciousness** (any RASS other than 0, i.e. currently not
alert and calm) **OR** Feature 4 — **disorganised thinking** (fails simple yes/no
questions/commands). **CAM-ICU positive = Features 1 + 2 + (3 or 4).** Cannot be assessed at
RASS −4/−5 (too deeply sedated). Screen at least once per shift; treat delirium as a medical
emergency requiring a cause hunt, not a psychiatric label — identical framing to ward delirium
(internal-medicine.md §2.5), plus ICU-specific precipitants: sedative/opioid burden, sleep
disruption, immobility, tethering (lines/catheters/restraints), untreated pain, sensory deprivation
(no glasses/hearing aids), and the underlying critical illness itself. **Non-pharmacological
prevention first** (reorientation, day-night cycling, early mobilisation, minimising
benzodiazepines, hearing/vision aids, family presence); **antipsychotics (low-dose haloperidol or
quetiapine)** only for dangerous agitation threatening safety, not as routine delirium treatment —
evidence does not show antipsychotics shorten delirium duration [EK].

**Raised intracranial pressure — recognition and management.**
- **Recognition:** Cushing's triad (hypertension, bradycardia, irregular respiration — a late and
  unreliable sign), pupillary changes (unilateral dilated/sluggish = uncal herniation risk),
  deteriorating GCS, posturing, and where available, invasive ICP monitoring or optic nerve sheath
  diameter/other non-invasive surrogates.
- **Targets:** **ICP <20–22 mmHg**; **cerebral perfusion pressure (CPP) = MAP − ICP, target
  60–70 mmHg** — both the ICP ceiling and the perfusion floor matter; a normal ICP with a low MAP
  can still starve the brain.
- **Tiered management** [EK]: head-of-bed 30°, neutral neck position (avoid jugular venous
  obstruction), adequate sedation/analgesia (agitation and coughing/straining raise ICP), avoid
  hypoxia and hypercapnia (both are cerebral vasodilators — normalise, don't chase low CO₂ as a
  default), maintain normothermia (fever raises cerebral metabolic demand — treat aggressively),
  normoglycaemia, seizure prophylaxis/treatment (seizures dramatically raise ICP and metabolic
  demand), avoid hyponatraemia (worsens oedema). Escalation: **hyperosmolar therapy** —
  hypertonic saline (e.g. 3% boluses) or mannitol (0.25–1 g/kg IV bolus, requires intact
  blood-brain barrier and adequate intravascular volume, causes an osmotic diuresis — monitor
  volume status and renal function); **brief, temporising hyperventilation** (target PaCO₂
  ~30–35 mmHg) only as a bridge to definitive treatment for acute herniation, not sustained
  therapy (rebound vasodilation and ischaemia risk with prolonged use); **CSF drainage** via EVD
  if in place; **decompressive craniectomy** for refractory cases per neurosurgical referral
  (availability is a major SA resource constraint — see §6).
- **CNS infection overlay in SA:** any ICU patient with reduced consciousness and a fever gets the
  same septic-screen-plus-CNS-infection framing as ward medicine — HIV status, and where indicated,
  CT before LP (focal signs, reduced GCS, immunosuppression) with an **opening pressure** measured
  if crypto/TB meningitis is on the differential (see §6).

**Critical-illness weakness (CIP/CIM).** Diffuse, symmetrical flaccid weakness developing over
days in a ventilated ICU patient, often discovered when sedation is stopped and the patient
doesn't move as expected — a major cause of failure to wean and prolonged ICU stay. Risk factors:
sepsis/MOF, prolonged neuromuscular blockade, corticosteroids, hyperglycaemia, immobility. Largely
a diagnosis of exclusion (rule out a structural/other cause) and a prevention problem — early
mobilisation, minimising sedation/paralysis duration, glycaemic control, and physiotherapy from
day one are the evidence-based mitigations [EK]; recovery is often slow (weeks–months) and
incomplete.

**Traps & pearls.** Before labelling a patient "not waking up" as a primary neurological problem,
check the sedation infusion rates and half-lives, renal/hepatic clearance of the sedative, and
whether an SAT has actually been performed and sustained for long enough. Hypoactive delirium
("quiet, withdrawn, staring") is missed constantly in ventilated patients because it doesn't
disturb the ward — screen with CAM-ICU proactively, don't wait for agitation. Do not chase ICP
with sustained hyperventilation — it buys minutes at the cost of cerebral ischaemia if continued.
A falling GCS in a ventilated, sedated patient cannot be assessed by GCS alone — use RASS and a
structured neuro exam (pupils, focal signs) instead, and hold sedation briefly and safely to
re-assess baseline if the trajectory is unclear and the patient is stable enough to tolerate it.

### 2.5 SEPSIS & INFECTION CONTROL

**Differential/mechanism.** As per internal-medicine.md §2.8, with the ICU-specific weighting
toward **device-associated infection** (VAP, CLABSI, CAUTI), **intra-abdominal sepsis**
(post-operative leak/collection, ischaemic bowel, cholangitis), **skin/soft tissue** (pressure
injury, necrotising fasciitis, burns), and in SA specifically, **disseminated TB and HIV-related
opportunistic sepsis masquerading as "culture-negative septic shock"** — see §6.

**Surviving Sepsis Campaign 2021 — the Hour-1 Bundle** [EK — SSC 2021]. To be initiated
*simultaneously*, within the first hour of recognition (not sequentially over the "golden hour" —
that framing is retired):
1. **Measure lactate** (repeat if initial >2 mmol/L to track clearance — see §4.2).
2. **Obtain blood cultures before antibiotics** — do not let this delay antibiotics beyond a
   reasonable window (aim <45 min from recognition if cultures are the bottleneck).
3. **Administer broad-spectrum antibiotics** — per suspected source and local SA STG/antibiogram
   (e.g. ceftriaxone-based for community sources; piperacillin-tazobactam or a carbapenem for
   healthcare-associated/intra-abdominal/neutropenic sources; add cover for resistant
   Gram-negatives/MRSA per local epidemiology and device history).
4. **Rapid administration of 30 mL/kg crystalloid** for hypotension or lactate ≥4 mmol/L — a
   *starting point*, not a fixed volume; reassess with dynamic fluid-responsiveness tools (§2.2)
   rather than completing the full 30 mL/kg reflexively in a patient who is clearly not
   responding, in cardiac failure, or already overloaded.
5. **Apply vasopressors** if hypotension persists during or after fluid resuscitation to maintain
   **MAP ≥65 mmHg** — do not delay vasopressor initiation waiting for a large fluid volume to
   complete in a profoundly hypotensive patient; start peripherally if central access will delay
   treatment (see §2.2).

**Source control** within 6–12h of recognition where a controllable source exists (drain an
abscess/collection, remove/replace an infected line or device, debride necrotic tissue, relieve
obstruction) — antibiotics alone will not clear an undrained source, and repeated antibiotic
escalation without addressing source control is a classic failure pattern.

**Antimicrobial stewardship in the ICU.** De-escalate at 48–72h against culture and sensitivity
results — narrow the spectrum, stop unnecessary agents (dual Gram-negative cover, empirical
antifungals if cultures are negative). Set and document an **antibiotic duration/stop date** at
initiation, not an open-ended course. Daily review of "is this drug still needed" is part of the
FASTHUGSBID round (§1). In SA, escalating carbapenem/colistin resistance among Gram-negatives
(Klebsiella, Acinetobacter) in ICUs makes stewardship a patient-safety issue, not an
administrative one — involve the clinical microbiologist/infectious-diseases input where
available, especially for second-line/reserve agents.

**VAP prevention bundle** [EK]: head-of-bed elevation 30–45°; daily sedation interruption paired
with SBT (§2.1/2.4); oral care with chlorhexidine; subglottic secretion drainage where the ETT
allows; maintain endotracheal cuff pressure **20–30 cmH₂O** (under-inflation allows micro-
aspiration around the cuff, over-inflation risks tracheal ischaemia); avoid unnecessary
ventilator-circuit changes; peptic ulcer and DVT prophylaxis (part of the same bundle, §2.6/2.7);
daily assessment of extubation readiness (the shortest path to zero VAP risk is the shortest
ventilator duration).

**CLABSI prevention bundle** [EK]: hand hygiene; maximal sterile barrier precautions on insertion
(cap, mask, sterile gown/gloves, full-body drape); **chlorhexidine skin antisepsis**; optimal
catheter site selection (subclavian or internal jugular preferred over femoral where feasible for
lower infection risk, balanced against pneumothorax/bleeding risk at each site and operator
skill); daily review of line necessity and prompt removal once not required — the single most
effective and cheapest CLABSI intervention in a resource-limited unit.

**CAUTI prevention** [EK]: catheterise only when indicated (accurate output monitoring, obstruction,
not for staff convenience), maintain a closed drainage system, daily review of continued need,
remove promptly.

**Traps & pearls.** "Culture-negative septic shock" in an ICU patient with an unknown or previously
undocumented HIV status is disseminated TB or another HIV-related opportunistic process until
actively excluded — send an HIV test, urine LAM, and consider empirical TB cover in the right
clinical context (§6) rather than escalating antibiotic spectrum indefinitely against negative
cultures. Do not let "cultures before antibiotics" become an excuse to delay antibiotics beyond
~45 minutes in a septic-shock patient. A repeatedly escalating antibiotic regimen against a static
or worsening trajectory usually means an undrained source or the wrong diagnosis (fungal,
mycobacterial, non-infectious inflammatory) — not the wrong antibiotic dose.

### 2.6 METABOLIC / GASTROINTESTINAL

**Glycaemic control.** Target blood glucose **7.8–10.0 mmol/L (140–180 mg/dL)** for the general
critically ill patient [EK — NICE-SUGAR]. Tight control (target ~4.4–6.1 mmol/L / 80–110 mg/dL,
the older Van den Berghe protocol) is **not** recommended — NICE-SUGAR showed **increased
mortality and severe hypoglycaemia** with tight control compared with the more liberal 140–180
target. Use a validated IV insulin-infusion protocol with regular (typically 1–2 hourly initially,
then up to 4-hourly once stable) glucose monitoring; avoid point-of-care capillary glucose in
patients with poor peripheral perfusion/oedema (unreliable — use arterial/venous sampling in
shocked patients).

**Nutrition.** **Enteral nutrition preferred over parenteral**, started **within 24–48h** of ICU
admission once haemodynamically stable (not requiring escalating vasopressor doses) [EK]. Start at
trophic/low rate and advance as tolerated; use a nasogastric (or post-pyloric if high aspiration
risk/gastric intolerance) route. **Parenteral nutrition** reserved for enteral intolerance/
contraindication (bowel obstruction, high-output fistula, severe ileus) persisting beyond
~5–7 days, or as supplementation to inadequate enteral intake. Monitor for **refeeding syndrome**
in the malnourished/chronically underfed patient (common in SA — TB, HIV wasting, alcohol
dependence, poverty) — check and replace phosphate, potassium, magnesium *before and during* feed
initiation, and advance calories cautiously in high-risk patients.

**Stress ulcer prophylaxis.** Indicated in high-risk patients — mechanical ventilation
**>48h**, coagulopathy, or a combination of lesser risk factors (shock, high-dose steroids, prior
GI bleed, hepatic/renal failure) [EK]. Agents: PPI or H2-receptor antagonist; evidence of
mortality benefit is weaker than historically assumed (SUP-ICU trial-era data) but bleeding
reduction persists in the highest-risk group — apply it selectively rather than to every ICU
patient by default, and **stop it once the risk factors resolve** (part of the daily FASTHUGSBID
review, §1).

**Electrolyte management** — the ICU patient loses/gains electrolytes fast (diuresis, RRT, feeds,
GI losses, refeeding) and needs proactive, protocolised replacement rather than reactive
correction: potassium, magnesium, phosphate, and calcium checked at least daily (more often on
RRT or with large GI losses) and replaced per unit protocol — see internal-medicine.md §4.4/4.5
for the detailed derangement work-ups, which apply unchanged in the ICU context.

**Bowel management.** Ileus is near-universal in the sedated, opioid-treated, critically ill
patient — a proactive bowel regimen (stimulant/osmotic laxative, avoid unnecessary opioid) is
standard, not an afterthought; unrecognised ileus/abdominal distension feeds back into raised
intra-abdominal pressure and renal hypoperfusion (§2.3). Diarrhoea in the ICU patient prompts a
*Clostridioides difficile* work-up if recent/current antibiotics, but is more often feed-related
or osmotic — don't reflexively stop antibiotics for feed-related diarrhoea without checking.

**Traps & pearls.** Tight glycaemic control is an outdated and harmful target — know the correct
range (7.8–10) and don't chase a "normal" glucose in a critically ill patient. Refeeding syndrome
kills the malnourished patient who is fed too fast, too soon — check phosphate before and during
early feeding in anyone with a starvation/wasting history. A distended, tender abdomen in a
ventilated patient with worsening oliguria and rising ventilator pressures is abdominal
compartment syndrome until measured and excluded.

### 2.7 HAEMATOLOGICAL

**Transfusion thresholds.** **Restrictive strategy — transfuse red cells at Hb <7 g/dL** for most
critically ill patients (including septic shock, per contemporary trial evidence) [EK — TRICC and
subsequent trials]; a higher threshold (**~8–9 g/dL**) is reasonable in active myocardial
ischaemia/ACS or ongoing significant haemorrhage where oxygen delivery margin matters more.
Over-transfusion is not benign — TRALI, TACO, immunomodulation, and (in the variceal-bleed
context specifically — see internal-medicine.md §2.12) rebound portal-pressure rises and
rebleeding.

**Platelet transfusion thresholds** [EK]: prophylactic transfusion at **<10 ×10⁹/L** in a stable
non-bleeding patient; **<20 ×10⁹/L** if febrile/septic or otherwise at increased bleeding risk;
**<50 ×10⁹/L** before an invasive procedure (higher, ~100, for neurosurgical/ophthalmic
procedures or active CNS bleeding); transfuse regardless of count for active clinically
significant bleeding.

**Coagulopathy correction.** **Fresh frozen plasma (FFP)** for active bleeding with a
demonstrated coagulopathy (prolonged PT/INR/APTT) or before an invasive procedure in a
coagulopathic patient — not for prophylactic "correction" of an isolated abnormal INR in a
non-bleeding, non-procedure patient (no evidence of benefit, unnecessary volume/transfusion risk).
**Cryoprecipitate** for hypofibrinogenaemia (fibrinogen <1.0–1.5 g/L) in active bleeding (obstetric
haemorrhage, DIC, massive transfusion). **Massive transfusion protocol** — balanced ratio
transfusion of red cells:FFP:platelets (roughly 1:1:1) in major haemorrhage, alongside **tranexamic
acid** early (within 3h of trauma/major haemorrhage per CRASH-2-era evidence [EK]) and correction
of hypocalcaemia (citrate toxicity from massive transfusion drops ionised calcium — check and
replace).

**DIC — recognition and scoring.** Disseminated intravascular coagulation is a downstream
consequence (sepsis, obstetric catastrophe — abruption/amniotic fluid embolism, malignancy, severe
trauma, transfusion reaction) rather than a primary diagnosis — always hunt for and treat the
trigger. **ISTH overt-DIC score** (platelet count, fibrin-related marker such as D-dimer, prolonged
PT, fibrinogen level — each scored) — a **score ≥5 supports overt DIC**. Management is
predominantly **treat the underlying cause** plus supportive blood product replacement guided by
bleeding and lab trend (platelets, fibrinogen, FFP) rather than a fixed protocol; avoid reflexive
heparin in bleeding DIC.

**VTE prophylaxis.** Combined **mechanical (intermittent pneumatic compression)** and
**pharmacological** prophylaxis for essentially all ICU patients without a contraindication — SA
STG/EML practice: **enoxaparin 40 mg SC once daily** (dose-reduce for significant renal impairment,
or substitute unfractionated heparin 5,000 units SC 2–3×/day where renal function is a concern or
LMWH is unavailable/stocked-out) [EK — standard ICU VTE prophylaxis dosing, consistent across
international and SA hospital practice]. **Contraindications to pharmacological prophylaxis** —
active bleeding, severe thrombocytopenia (<50 ×10⁹/L), significant coagulopathy, recent
neuraxial procedure, high bleeding-risk neurosurgery/trauma — mechanical prophylaxis alone in
these cases, with pharmacological prophylaxis added as soon as it becomes safe (reassess daily,
not "forgotten" once mechanical-only is started).

**Traps & pearls.** Don't transfuse to a number in the absence of a physiological indication — a
Hb of 6.9 in an asymptomatic, haemodynamically stable, non-bleeding patient without cardiac
disease does not automatically need blood; conversely, don't withhold transfusion in active
haemorrhage while "waiting for the Hb to fall" — treat the bleeding, not the lag-time lab value
(same principle as the GI-bleed teaching in internal-medicine.md §2.12). DIC is not itself the
diagnosis — find and treat the trigger, or the coagulopathy will not resolve. VTE prophylaxis is
part of the daily FASTHUGSBID review — a patient who becomes eligible again after a bleeding risk
resolves needs it restarted, and this is a commonly missed step.

---

## 3. The normals (what "normal" looks like on an ICU chart)

**Haemodynamic targets** [EK]: **MAP ≥65 mmHg** (individualise higher in chronic hypertensives if
perfusion markers don't improve at 65); HR 60–100 (permissive higher rate acceptable if perfusing
well, e.g. compensatory tachycardia); **CVP** is a poor absolute target but trend/dynamic response
more informative than a single number (historically quoted 8–12 mmHg, now de-emphasised);
**urine output ≥0.5 mL/kg/h**; **capillary refill <2–3 seconds**; **lactate <2 mmol/L**, with
**lactate clearance ≥10–20% over 2h** as a resuscitation target (see §4.2).

**Ventilator/respiratory normals on a lung-protective strategy** [EK]: tidal volume **6 mL/kg
PBW** (4–8 mL/kg range depending on plateau pressure); **plateau pressure ≤30 cmH₂O**; **PEEP**
titrated per PEEP/FiO₂ table (commonly 5–15 cmH₂O in moderate ARDS); **driving pressure (plateau −
PEEP) ideally <15 cmH₂O** (an increasingly used mortality-associated marker [EK]); respiratory
rate 14–35 depending on strategy (permissive hypercapnia allows a compensatory rise); **SpO₂
88–95%** (ARDS target) or 94–98% (non-ARDS ventilated patient); **P/F ratio >300 = no ARDS**,
200–300 mild, 100–200 moderate, <100 severe (Berlin, §2.1).

**ABG (arterial)** [EK — as per internal-medicine.md §3, unchanged physiology, reproduced for
convenience]: pH 7.35–7.45; PaCO₂ 4.7–6.0 kPa (35–45 mmHg) — deliberately allowed higher on
permissive hypercapnia; PaO₂ >10.6 kPa (80 mmHg) in a non-ARDS patient, target 7.3–10.6 kPa
(55–80 mmHg) in ARDS; HCO₃⁻ 22–26 mmol/L; base excess ±2; **lactate <2 mmol/L** (**>4 mmol/L =
severe, an independent mortality predictor regardless of blood pressure**); anion gap 8–12;
normal A–a gradient ≈ (age/4) + 4 mmHg, widens substantially in ARDS/shunt physiology.

**Sedation/neuro normals** [EK]: target **RASS 0 to −2** for most patients (deeper only with
specific indication, §2.4); GCS 15 at baseline (not applicable/interpretable once sedated —
document "sedated" rather than force a GCS); ICP <20–22 mmHg where monitored; CPP 60–70 mmHg;
**CAM-ICU negative** is the target — screen at least once/shift.

**Fluid balance and weight** [EK]: aim for **even-to-negative cumulative fluid balance** once the
acute resuscitation phase (first 24–48h) is over and shock has resolved — a persistently positive
balance is associated with worse outcomes in ARDS and general critical illness; daily weight
(where feasible) as a cross-check against charted balance (charted balance reliably
over-estimates positive balance due to insensible losses not being subtracted).

**Renal** [EK]: creatinine trend relative to the patient's own baseline (not a fixed population
range) is the primary signal; urine output ≥0.5 mL/kg/h; K⁺ 3.5–5.0 mmol/L (tighter control
needed in the arrhythmia-prone/on RRT patient).

**FBC/coagulation on the ICU chart** [EK]: Hb — transfuse <7 g/dL restrictive (§2.7), not a
"normal" target per se; platelets 150–400 ×10⁹/L (thresholds for transfusion, not for "normal", in
§2.7); WCC trend more informative than a single value in the context of infection; INR/APTT
trended against bleeding risk and procedure planning, not corrected to a "normal" number
prophylactically.

**Glucose** [EK]: target **7.8–10.0 mmol/L** on an insulin infusion protocol (§2.6) — not the
ward "4–7 fasting" range.

---

## 4. Cross-cutting investigation interpretation (deep)

### 4.1 The ABG/VBG — stepwise, in context, in the ventilated patient
Apply the same five-step method as internal-medicine.md §4.1 (pH → primary driver → expected
compensation via Winter's formula and the respiratory compensation rules → anion gap → delta-delta
for a HAGMA), with three ICU-specific overlays:
1. **Always interpret the gas against the ventilator settings that produced it.** A PaCO₂ of
   6.5 kPa is expected and acceptable on a deliberate permissive-hypercapnia ARDSnet strategy; the
   same value on a patient who should be normocapnic (e.g. raised ICP management) is a problem
   requiring immediate action.
2. **A–a gradient** [normal ≈ (age/4) + 4 mmHg] separates a ventilation problem (normal gradient,
   raised CO₂, hypoxia corrects with increased minute ventilation) from a V/Q mismatch or shunt
   problem (widened gradient, hypoxia resistant to increasing FiO₂ in true shunt — a widening
   gradient despite escalating FiO₂ is the signature of worsening ARDS/pneumonia/atelectasis, not
   a ventilation-rate problem).
3. **VBG as a screening tool** — a venous pH and CO₂ correlate reasonably with arterial values in a
   haemodynamically stable patient (venous pH typically ~0.03–0.05 lower, venous CO₂ ~0.5–1.0 kPa
   higher) and can screen for a major acid-base disturbance without an arterial stab; **venous
   lactate correlates with arterial lactate** and is the practical bedside test — but **venous
   PaO₂ is not interpretable for oxygenation** and an ABG (or SpO₂/co-oximetry) is required
   whenever oxygenation itself is the question.

### 4.2 Lactate — trend over snapshot
A single lactate is a severity marker; a **lactate clearance** is a resuscitation-response marker
and the more actionable number. **Clearance = (initial − repeat) / initial × 100%**, typically
measured over 2 hours; a **clearance of ≥10–20%** is a reasonable early target reflecting adequate
resuscitation, and serial improving lactate over the first 6–24h is one of the better available
proxies for "the resuscitation is working" in a resource-limited unit without advanced cardiac-
output monitoring. Causes of a raised lactate beyond tissue hypoperfusion (do not automatically
equate "high lactate" with "more fluid needed"): **adrenaline infusion** (β2-mediated, a
pharmacological confounder — §2.2), **metformin accumulation** (in AKI), **thiamine deficiency**
(malnourished/alcoholic patients — a reversible cause, give thiamine), **liver failure** (impaired
clearance rather than increased production), **seizures**, **regional ischaemia** (mesenteric,
limb), and **laboratory/sampling artefact** (prolonged tourniquet time, delayed processing). A
lactate that is not falling despite an apparently adequate MAP and fluid status should prompt a
search for an unaddressed source (undrained sepsis, ischaemic bowel, compartment syndrome) rather
than repeated empirical fluid boluses.

### 4.3 The septic screen in the ICU patient — end-to-end
Blood cultures ×2 (from different sites/times, including through any suspected-infected line paired
with a peripheral sample for differential-time-to-positivity if CLABSI is suspected) **before**
antibiotics where this does not meaningfully delay treatment; urine microscopy/culture; sputum/
endotracheal aspirate (a positive VAP culture must be interpreted against the clinical picture —
ventilated patients are frequently colonised, and a positive culture without new infiltrate/
fever/purulent secretions/rising inflammatory markers/worsening oxygenation is colonisation, not
VAP — treating colonisation drives resistance without benefit); wound/line-site swabs if
clinically indicated; CXR; abdominal imaging if an intra-abdominal source is possible; lumbar
puncture with opening pressure if a CNS source is on the differential (§2.4, §6); HIV test and,
where relevant, urine LAM and TB GeneXpert if the source remains unclear or the patient is from a
high-burden setting (§6) — "sepsis of unknown source" in SA critical care is disseminated TB/HIV-
related infection until actively excluded, exactly as on the medical ward. Procalcitonin, where
available, can support a decision to *stop* antibiotics in a clinically improving patient with a
falling value, but is not universally available at SA state facilities and should not replace
clinical judgement or delay empirical treatment.

### 4.4 Driving pressure and compliance — the bedside ventilator-mechanics read
**Driving pressure = plateau pressure − PEEP** — a marker of the tidal volume actually needed to
achieve a given lung-distending pressure, increasingly used (alongside plateau pressure) as a
marker of lung injury risk; rising driving pressure on unchanged settings signals worsening
compliance (progressing ARDS, new pneumothorax, abdominal distension, secretions/mucus plugging)
even before oxygenation changes are obvious — check it at every ventilator round, not only when
the patient looks worse.

### 4.5 Fluid balance and weight as an investigation
Treat the cumulative fluid balance chart as a trended investigation, not an administrative
record: a persistently positive balance beyond the first 24–48h of resuscitation predicts worse
respiratory and renal outcomes and should trigger an active de-resuscitation plan (diuresis or
ultrafiltration once shock has resolved) rather than passive continuation of maintenance fluids
and drug-carrier volumes.

---

## 5. Scores, charts, and structured tools

**SOFA (Sequential Organ Failure Assessment)** — six organ systems, each scored 0–4 (total 0–24);
higher score and a **rising** score over 24–48h predict mortality more reliably than a single
value:
- **Respiration:** PaO₂/FiO₂ (mmHg) — ≥400 (0); <400 (1); <300 (2); <200 with respiratory support
  (3); <100 with respiratory support (4).
- **Coagulation:** platelets (×10⁹/L) — ≥150 (0); <150 (1); <100 (2); <50 (3); <20 (4).
- **Liver:** bilirubin (µmol/L) — <20 (0); 20–32 (1); 33–101 (2); 102–204 (3); >204 (4).
- **Cardiovascular:** MAP ≥70 (0); MAP <70 (1); dopamine ≤5 or dobutamine any dose (2); dopamine
  >5 or adrenaline ≤0.1 or noradrenaline ≤0.1 microgram/kg/min (3); dopamine >15 or adrenaline
  >0.1 or noradrenaline >0.1 microgram/kg/min (4).
- **CNS:** GCS 15 (0); 13–14 (1); 10–12 (2); 6–9 (3); <6 (4).
- **Renal:** creatinine (µmol/L)/urine output — <110 (0); 110–170 (1); 171–299 (2); 300–440 or
  urine <500 mL/day (3); >440 or urine <200 mL/day (4).
Sepsis-3 defines sepsis as suspected/confirmed infection **plus an acute SOFA rise ≥2**.

**qSOFA** (bedside screen, outside ICU, to flag patients who may have sepsis and warrant fuller
assessment — **not** a diagnostic or ICU-severity tool): 1 point each for **RR ≥22**, **altered
mentation (GCS <15)**, **SBP ≤100 mmHg**; **≥2 → higher risk**, prompts full septic
work-up/escalation.

**GCS** (3–15): Eye 4 spontaneous/3 voice/2 pain/1 none. Verbal 5 oriented/4 confused/3
inappropriate words/2 sounds/1 none. Motor 6 obeys/5 localises/4 withdraws/3 abnormal flexion/2
extension/1 none. Report E_V_M_; not meaningfully applicable to a sedated/intubated patient — use
RASS instead and document "sedated, not assessable" rather than assigning a default verbal score.

**RASS and CAM-ICU** — full tables in §2.4.

**Fluid-responsiveness tests** — PLR (≥10% CO rise), PPV/SVV (>12–13%, ventilated/sedated/sinus
rhythm only), IVC collapsibility/distensibility — full detail in §2.2.

**APACHE II (conceptually)** — a severity-of-illness/mortality-prediction score combining acute
physiology (12 variables — temperature, MAP, HR, RR, oxygenation, arterial pH, sodium, potassium,
creatinine, haematocrit, WCC, GCS), age, and chronic health status, calculated from the **worst
values in the first 24h** of ICU admission; used for benchmarking, research risk-adjustment, and
some triage/prognostication discussions rather than as a bedside minute-to-minute tool (unlike
SOFA, which is designed to be tracked serially). Know it exists and what it represents; the exact
point-weighting is rarely hand-calculated at the bedside — most units use a calculator/EHR
integration.

**ISTH overt-DIC score** — platelet count, fibrin-related marker (D-dimer/FDP), prolonged PT,
fibrinogen — **≥5 supports overt DIC** (§2.7).

**Glasgow-Blatchford, Rockall, Child-Pugh, MELD, CURB-65, Wells, CHA₂DS₂-VASc/HAS-BLED** — as
detailed in internal-medicine.md §5; unchanged when the ICU patient's presenting problem originated
from one of those syndromes (e.g. a variceal bleeder now shocked and ventilated still gets a
Glasgow-Blatchford/Rockall in the retrospective record, and a Child-Pugh/MELD informs prognosis and
ceiling-of-care discussion).

**Others in ICU use** [EK]: **RSBI** (f/Vt <105 predicts SBT success, §2.1); **CIWA-Ar** (alcohol
withdrawal severity, relevant to the ICU patient admitted intoxicated/post-trauma); **Berlin ARDS
criteria** (§2.1); **KDIGO AKI staging** (§2.3); **Braden scale** (pressure-injury risk — relevant
given prolonged immobility); **Parkland formula** (burns fluid resuscitation, if applicable);
**Ramsay scale** (an older sedation scale, largely superseded by RASS but still occasionally
charted).

---

## 6. SA-specific reality

**ICU beds are a rationed resource, and triage/rationing is core, not exceptional, ICU cognition
here.** South Africa has roughly **5 ICU/high-care beds per 100,000 population overall**, with the
**public-sector ratio around 2.4–3.8 per 100,000** — far below high-income-country norms — and
marked provincial inequity (**Limpopo as low as ~0.7 per 100,000**). **The majority of public
hospitals have no ICU/high-care unit at all** (survey data cited ~77% of public facilities lacking
one), which is precisely why the district-hospital-with-no-ICU referral decision (below) is a
routine, not a rare, clinical task. The **CCSSA/Southern Africa Consensus Guideline on ICU Triage
and Rationing (ConICTri)** — adapted rapidly from the University of Pittsburgh framework during the
COVID-19 pandemic and since refined — formalises what intensivists already did informally: triage
decisions are made on the **clinical odds of a positive ICU outcome**, weighed against risk of
death and expected longer-term morbidity/quality of life, ideally via a **regional triage
committee** rather than a single clinician acting alone, with the process and reasoning
documented. This is a resource-allocation/ethics framework operating *in addition to* — not
instead of — the individual ceiling-of-care conversation described in §1.

**ICU levels of care (CCSSA framework)** [EK/CCSSA]: **Level 1 (high care)** — closer monitoring
and single-organ support than a general ward, typically available at district/regional level.
**Level 2** — regional-hospital-level ICU, expected to manage **one or two failing organ systems**
with invasive ventilation and basic vasopressor support. **Level 3** — tertiary/complex regional
referral ICU, managing multi-organ failure, offering the full range of organ support (including
RRT, and where available, more advanced monitoring) and acting as the referral point for Level 1/2
units. Know which level your unit is, and what it can and cannot offer, before promising a
family or a referring colleague a specific intervention.

**Nurse:patient ratios.** The recommended standard for Level 3 ICU nursing is **1:1** — one
critical-care-trained nurse per ventilated patient — but this is frequently not achieved in the
public sector; **only around a quarter of ICU nurses nationally hold a formal critical-care
qualification**, and the absolute number of critical-care-trained nurses is well short of national
need. Practically: expect nurse:patient ratios to be diluted at busy periods, expect variable
familiarity with protocol-driven care (sedation holds, SBTs, VAP-bundle elements) across shifts,
and build handover/documentation habits (explicit targets on the chart — MAP goal, sedation
target, weaning plan) that survive a change of nursing staff.

**Stock-outs and equipment reality.** Vasopressor/inotrope availability, specific antibiotics
(piperacillin-tazobactam, certain carbapenems, linezolid), CRRT consumables, and even basic
disposables (ETT sizes, arterial-line kits, specific ventilator-circuit parts) are subject to
intermittent stock-outs at district/regional facilities — build a habit of confirming *actual*
availability before committing to a plan (e.g. don't plan CRRT for a haemodynamically unstable
patient if your unit's CRRT machine is down; know your local antibiotic-substitution ladder).
Blood product availability (platelets in particular) can be a bottleneck, especially after-hours
and at smaller facilities.

**The district-hospital-with-no-ICU referral/transfer decision.** Because most public hospitals
have no ICU/high-care unit, the earliest and highest-yield "critical care" decision often happens
at a facility with none: recognising a patient who is *becoming* critically ill early enough to
refer **before** they need an ICU bed en route, rather than up-referring only once they are already
peri-arrest. SA audit data shows a concerning proportion of referrals to Level 3 ICUs arrive
**directly from district hospitals** rather than via the intended district→regional→tertiary
pathway — reflecting late recognition at the district level, bypassed regional facilities, or
simply that the regional facility was also full. Practical points: stabilise what you can before
transfer (secure the airway if there is any doubt it will remain patent for the journey; start
resuscitation and antibiotics — don't wait for the receiving unit to begin sepsis management);
communicate a clear, structured handover (working diagnosis, trend, what's been given, current
requirements); many public referral hospitals are **within ~100 km** of an ICU-capable facility,
but transport delays, ambulance availability, and receiving-unit bed availability all add
unpredictable time — build that uncertainty into the decision to intervene now versus wait for
transfer. A transfer request can be declined for lack of a bed — have an explicit ceiling-of-care
and interim management plan for the scenario where transfer is delayed or refused, rather than an
open-ended "awaiting transfer" plan with no active management in the meantime.

**HIV/TB in the ICU — the default overlay, not a subspecialty consult.**
- **Every critically ill patient of unknown HIV status gets tested** — the differential, drug
  choices (rifampicin-drug interactions, nephrotoxicity patterns), and prognosis/triage discussion
  all change on the result.
- **PJP (Pneumocystis jirovecii pneumonia)** — a leading cause of ICU respiratory failure in
  undiagnosed/advanced HIV in SA; typically presents with disproportionate hypoxaemia relative to
  a relatively unimpressive bilateral ground-glass CXR, often in a patient with a **very low CD4**
  (SA case-series median CD4 at diagnosis in the single digits to low tens). Treatment: **high-dose
  IV cotrimoxazole (trimethoprim-sulfamethoxazole)**, switching to oral once tolerating, plus **high-
  dose corticosteroids for moderate-severe disease (PaO₂ <9.3 kPa/70 mmHg or A-a gradient
  ≥35 mmHg)**. Mortality for HIV-associated PJP requiring ICU admission is reported as very high in
  SA case series (approaching the range where a frank ceiling-of-care conversation with the family
  is appropriate early) — documented predictors of death include the P/F ratio, LDH level, and
  concurrent TB treatment. ART timing after an OI generally follows the 2-week rule (§ internal-
  medicine.md 6) but is individualised in the ventilated, unstable patient.
- **Disseminated/miliary TB** presenting as "culture-negative septic shock" with a clear or
  non-specifically abnormal CXR — send **urine LF-LAM** (particularly valuable in the sick,
  low-CD4, or CD4-unknown inpatient who cannot produce sputum), sputum/tracheal-aspirate **Xpert
  MTB/RIF Ultra**, and consider empirical TB treatment in a deteriorating patient with a
  compatible picture and no alternative source found, after appropriate specimen collection and
  multidisciplinary discussion — do not let the absence of microbiological confirmation delay
  treatment indefinitely in a dying patient with a high pre-test probability.
- **Cryptococcal meningitis** — in the ICU patient with reduced consciousness/raised ICP and a
  positive or unknown HIV status: **CrAg** (serum/CSF), an **opening pressure at LP** (raised
  pressure is the dominant driver of mortality and is managed with **serial high-volume
  therapeutic LPs**, not amphotericin dose escalation), and induction with **amphotericin B +
  flucytosine** (or fluconazole where flucytosine is unavailable) per the AHD guideline; **delay
  ART by roughly 4–6 weeks** to reduce IRIS mortality.
- **TB-IRIS (paradoxical and unmasking)** — a recognised cause of unexplained deterioration in an
  ICU patient recently started on ART with known or newly-diagnosed TB; paradoxical TB-IRIS occurs
  in a reported **8–54%** of SA HIV/TB co-infected patients starting ART, more commonly with a very
  low pre-ART CD4 and a short interval between starting TB treatment and ART. Most cases are
  self-limiting and managed supportively (continue TB treatment and ART); **corticosteroids
  (prednisone ~1–2 mg/kg/day, tapered over 1–2 weeks then individualised)** are reserved for
  **severe/life-threatening manifestations** — airway compromise from nodal TB-IRIS, CNS-IRIS with
  raised ICP, or respiratory failure — not used routinely, and not a substitute for excluding a
  genuinely new/undertreated infection first.
- **Rifampicin drug interactions** matter acutely in the ICU: rifampicin induces hepatic
  metabolism of many ICU drugs (including some sedatives/analgesics and, notably, requiring the
  **doubled dolutegravir dose** — an extra 50 mg twelve hours apart — for patients on
  rifampicin-based TB treatment and dolutegravir-based ART).

**Notifiable conditions and medico-legal touchpoints in the ICU** [EK — as per internal-
medicine.md §6, unchanged]: TB, meningococcal disease, and other NMC-listed conditions still
require notification even when the patient is critically ill; death in ICU still requires correct
certification and, where applicable (unnatural/unascertained death, deaths related to trauma or
occurring within defined post-admission windows per local policy), referral to forensic/medico-
legal pathways; end-of-life documentation (the ceiling-of-care decision, DNR/resuscitation status,
family discussions) must be explicit and dated in the record — verbal-only "soft" limitations of
care are a recurrent medico-legal and clinical-governance risk.

**Classic SA-ICU deteriorations to always actively exclude** [EK]: an undiagnosed HIV/TB process
behind "sepsis of unknown source"; a missed abdominal compartment syndrome in the distended
post-operative or burns patient; an under-resourced RRT/ventilator/drug substitution silently
changing the actual plan of care without being flagged to the team; a ceiling-of-care decision that
was never explicitly made or documented, leading to default full escalation by inertia rather than
by a considered decision.

---

## Sources actually reached vs [EK]

**Fetched / grounded via web search this session:**
- SA STG **Adult Hospital Level, Chapter 23 (Adult Critical Care) vasopressor review, October
  2023** — confirmed the shift in SA STG first-line septic-shock vasopressor recommendation from
  adrenaline toward **noradrenaline**, aligning with international practice (document located at
  `knowledgehub.health.gov.za`; full PDF text blocked to automated fetch — the directional finding
  is taken from the search-result summary and cross-checked against the international consensus it
  describes).
- **CCSSA (Critical Care Society of Southern Africa) Guidelines for the Provision of Critical Care
  Services** and the **ConICTri (Consensus Guideline on ICU Triage and Rationing)** — grounded via
  PMC/SciELO summaries: ICU **Level 1/2/3** definitions, the triage-by-clinical-odds-of-benefit
  framework, and its origin as a rapid adaptation of the University of Pittsburgh model during
  COVID-19 (PMC7983086, PMC10503493/10503494, SciELO S1562-82642019000100010).
- **SA national ICU bed-capacity and distribution data** — grounded via the national audit of
  critical-care resources and subsequent reporting: **~5 ICU/high-care beds per 100,000
  population** nationally, **public-sector ~2.4–3.8 per 100,000**, **Limpopo as low as ~0.7 per
  100,000**, and **~77% of public hospitals with no ICU/high-care unit** (PubMed 18265911, IOL
  2025-11-07 reporting, Hospital Association of South Africa summary).
- **Nurse:patient ratios and critical-care nursing shortage** — grounded via DENOSA and SAJCC
  (Southern African Journal of Critical Care) reporting: recommended **1:1** ICU nurse:patient
  ratio, only **~25% of ICU nurses** formally critical-care trained, ~6,246 registered critical-
  care nurses nationally against need (DENOSA nurse-patient-ratios page, SAJCC de Beer article).
- **District-hospital referral pattern to Level 3 ICU** — grounded via a SciELO/PMC analysis of
  referrals to a resource-limited South African Level 3 ICU: a concerning proportion of referrals
  arriving directly from district hospitals rather than via regional facilities, and the finding
  that roughly half of ICU-less public hospitals are within ~100 km of an ICU-capable facility
  (PMC10399616 / SciELO S1562-82642023000200003, PubMed 18265914).
- **Surviving Sepsis Campaign 2021 Hour-1 Bundle** — components (lactate, cultures before
  antibiotics, broad-spectrum antibiotics, 30 mL/kg crystalloid for hypotension/lactate ≥4,
  vasopressors for persistent hypotension to MAP ≥65) confirmed via SCCM/EMOttawa summary and
  bundle-compliance outcome literature (PMC8843226, PMC11801614, ascension-ce-cme summary PDF).
- **ARDSnet/NIH ARDS Network low-tidal-volume strategy** — 6 mL/kg PBW target, plateau pressure
  ≤30 cmH₂O, SpO₂/PaO₂ oxygenation targets, and the PEEP/FiO₂ stepwise-table concept — confirmed
  via LITFL, PulmTools, and the University of Iowa Ventilator 101 summaries (the exact numeric
  low-PEEP-table pairing quoted is standard ARDSnet-table content [EK]; the source pages describe
  the table's existence and stepwise logic but the full table body was not machine-extracted this
  session).
- **SOFA score component thresholds** (respiration, coagulation, liver, cardiovascular, CNS,
  renal — full point tables) — confirmed via a SOFA-score reference table search
  (rarre.bzh Score-SOFA PDF, Springer SOFA-score review, standardofcare.com summary).
- **RASS scale and its relationship to CAM-ICU** (RASS +4 to −5; CAM-ICU only assessable at
  RASS ≥ −3) — confirmed via Physiopedia/Wikipedia/MDCalc summaries and the GICU RASS/CAM-ICU
  scoring-guidance PDF reference (the four-feature CAM-ICU algorithm detail is standard PADIS/
  Vanderbilt-ICU-delirium content, marked [EK] where not independently re-extracted this session).
- **TB-IRIS epidemiology and corticosteroid management** — paradoxical TB-IRIS incidence
  **8–54%** in SA HIV/TB co-infected patients starting ART, and the reserved-for-severe-disease
  corticosteroid dosing (prednisone 1–2 mg/kg for 1–2 weeks, then tapered) — grounded via PMC
  reviews and the SA-specific incidence study (PMC3495974, PMC7693460, ART Guidelines module
  sahivsoc.org).
- **HIV-associated PJP in SA ICU outcomes** — very low median CD4 at diagnosis, high reported ICU
  mortality, and mortality predictors (P/F ratio, LDH, concurrent TB treatment) — grounded via a
  South African referral-hospital outcomes study (PMC6072084) and the EMCrit PJP summary for
  treatment specifics (high-dose IV cotrimoxazole, corticosteroids for moderate-severe hypoxaemia).
- Attempted but blocked to automated fetch (HTTP 403, content not machine-extracted, relied on
  search-result summaries and cross-referencing instead): the full SA STG Chapter 23 vasopressor-
  review PDF and the full CCSSA guidelines PDF at `criticalcare.org.za` — the directional/
  structural claims drawn from their search-result summaries are noted as such above; exact drug-
  dose tables and the full CCSSA level-of-care staffing/equipment specification should be verified
  against the primary PDF at implementation.
- Existing project reference `docs/clinical-build/research/internal-medicine.md` — read in full to
  match structure/depth/voice and to cross-reference shared content (AKI staging, electrolyte
  work-ups, transfusion/GI-bleed teaching, HIV/TB integration) rather than duplicate it; ICU-
  specific material here extends rather than repeats that dossier. `emergency.md` skimmed for the
  acute-care voice/tempo convention (resuscitate-as-you-find, ABCDE framing, the "6 killers"
  differential-table style reused for the shock-states table in §2.2).

**[EK] — established critical-care knowledge / standard texts** (not individually re-fetched this
session; used throughout and flagged inline): FASTHUGSBID daily-review mnemonic and its component
practices; ventilation-mode physiology (VC/PC/PS/SIMV/APRV/NIV/HFNO); the DOPE approach to sudden
ventilator desaturation; SBT/extubation readiness criteria and the RSBI threshold; prone
positioning and neuromuscular blockade evidence in severe ARDS; the four shock-state
classification and its bedside/POCUS discriminators; fluid-responsiveness physiology (PLR, PPV/
SVV validity conditions, IVC indices) [EK, cross-checked against widely-replicated critical-care
teaching]; vasopressor/inotrope receptor pharmacology and standard microgram/kg/min dosing ranges
(noradrenaline, adrenaline, vasopressin, dobutamine, dopamine, milrinone, phenylephrine); KDIGO
2012 AKI staging and the AEIOU RRT-indication mnemonic (detailed fully in internal-medicine.md
§4.7, applied here); raised-ICP tiered management and CPP/ICP targets; PADIS 2018
sedation/analgesia/delirium/immobility/sleep principles including analgesia-first sedation and the
harms of deep/prolonged sedation; critical-illness polyneuromyopathy risk factors and prevention;
VAP/CLABSI/CAUTI prevention bundles; NICE-SUGAR glycaemic targets and the harm of tight control;
enteral-nutrition timing and refeeding-syndrome risk; stress-ulcer-prophylaxis indications; TRICC
restrictive-transfusion evidence and platelet/FFP/cryoprecipitate transfusion thresholds; the ISTH
overt-DIC scoring concept; standard VTE-prophylaxis dosing (enoxaparin 40 mg SC daily / UFH 5,000
units SC 2–3×/day) consistent across SA and international ICU practice; APACHE II's design and
purpose (worst-24h physiology + age + chronic health, used for risk-adjustment/benchmarking rather
than bedside serial tracking); lactate-clearance calculation and non-hypoperfusion causes of a
raised lactate; the A–a gradient formula and its interpretation; VBG-ABG correlation and the
venous-PaO₂ caveat. Where a specific numeric threshold rests on EK it reflects standard critical-
care reference ranges/consensus (Surviving Sepsis 2021, ARDSnet, KDIGO, PADIS 2018, TRICC, NICE-
SUGAR); the SA STG Chapter 23 edition in force and the full CCSSA guideline document should be
cited by exact chapter/page at implementation once machine-readable access is available.
