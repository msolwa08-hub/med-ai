# Anaesthetics — Consultant Depth Dossier

*Target reader: the intern/MO giving a spinal for a caesarean section alone at a district
hospital at 02:00, with no specialist on site and a telephonic consultant an hour's drive away —
and the MedAI engine standing behind them. This is the depth reference, not a summary — it goes
deeper than `docs/clinical-foundations.md`. Structure follows the DEPTH-BAR six-part standard,
adapted to anaesthetic cognition: the mental model (the five questions, in order, every time);
presenting situations worked to full depth (pre-op assessment, fasting/aspiration, the difficult
airway, induction in the compromised patient, spinal anaesthesia for caesarean section as the SA
signature case, intra-operative emergencies, emergence/recovery, acute pain, the obstetric
patient, paediatric basics, procedural sedation); the normals on an anaesthetic chart;
cross-cutting interpretation (capnography, intra-op ABG, ventilator alarms, monitoring
standards); scores and structured tools; SA-specific reality.*

*Primary SA sources: **South African Society of Anaesthesiologists (SASA) Practice Guidelines
2022** (monitoring standards, organisation of services); **SASA Acute Pain Guidelines 2015**;
**SASA Paediatric and Adult Guidelines for Safe Procedural Sedation and Analgesia**; **Adult
Hospital Level STG & EML, Chapter 12 — Anaesthesiology and Intensive Care** (NDoH, incl. the
2025 NEMLC review — thiopentone discontinued from the SA market, propofol/etomidate/ketamine as
induction alternatives); **National Committee for Confidential Enquiries into Maternal Deaths
(NCCEMD) — Saving Mothers** triennial reports, most recently the **8th report (2020–2022)** and
its anaesthesia chapter; **HPCSA intern/community-service scope-of-practice guidance**. Global:
**Difficult Airway Society (DAS) 2015 guidelines** for unanticipated difficult intubation;
**Association of Anaesthetists (AAGBI) quick-reference guidelines** (anaphylaxis, LAST,
malignant hyperthermia, major haemorrhage); **ASRA Pain Medicine** guidelines on regional
anaesthesia and antithrombotic therapy, and the LAST checklist; **Oxford Handbook of
Anaesthesia**; standard anaesthetic pharmacology texts. Many SA government/society PDFs return
HTTP 403 to automated fetch; where a specific document could not be machine-read this session the
figure is cross-checked against a secondary summary or marked **[EK]** (established
knowledge/mainstream consensus) rather than fabricated. Full source ledger at the end.*

---

## 1. The anaesthetist's mental model

**Anaesthetic cognition is not "what is the diagnosis" — it is "what could kill this patient in
the next ninety minutes, and have I mitigated every one of those ways before I push the drug."**
Every pre-operative assessment, every induction, every intra-operative decision runs through the
same five questions, in the same order, on every single patient — the trauma laparotomy and the
day-case hernia alike. Skipping the order (jumping to "what induction agent" before answering
"can I ventilate this airway") is the single commonest root cause of anaesthetic catastrophe.

**The five questions, in order:**

1. **The airway question — can I ventilate this patient by mask, and can I intubate them if I
   need to?** This is asked *before* any drug is drawn up, because it is the only question whose
   answer determines whether you are allowed to paralyse the patient at all. A patient you cannot
   ventilate and cannot intubate is a patient you must not paralyse (§2.3). The corollary the
   novice misses: "difficult airway" is not one question but two independent ones — difficult
   *mask ventilation* and difficult *laryngoscopy/intubation* — and the truly lethal combination
   is both together (predicted or unpredicted).
2. **The aspiration question — is this stomach full, and is the airway protected until it
   isn't?** Fasting status, the emergency/pain/opioid/pregnancy/obstruction exceptions, and
   whether the plan is a rapid-sequence induction with a protected airway from the first breath,
   or a slower induction because the risk is low (§2.2).
3. **The physiological-reserve question — will THIS patient tolerate the vasodilatory,
   negative-inotropic, sympatholytic insult of induction?** Every induction agent drops systemic
   vascular resistance, drops contractility to some degree, and removes the patient's own
   compensatory catecholamine surge (which was propping up their blood pressure). The septic
   patient, the hypovolaemic trauma patient, and the patient with fixed cardiac output (severe
   aortic stenosis, tamponade, tight mitral stenosis, a Fontan circulation) can arrest on
   induction not because the anaesthetist did anything wrong technically, but because the
   patient's reserve was already spent and induction removed the last compensatory mechanism.
   This is why dose, agent choice, and *whether to induce at all before you have resuscitated*
   are all clinical judgements, not a fixed protocol (§2.4).
4. **The drug questions — allergies, the malignant hyperthermia/suxamethonium-apnoea family
   history, and does anticoagulation gate a neuraxial technique?** Asked explicitly, every time,
   because the consequence of missing any one of the three is catastrophic and each has a narrow
   window to catch it (before induction, before you draw up suxamethonium, before you put a
   needle in the epidural/spinal space) (§2.1, §2.5, §2.6).
5. **The intra-operative deterioration question — framed as a DIFFERENTIAL with discriminating
   tests, not a mystery to be solved from scratch each time.** When a ventilated, paralysed
   patient who cannot tell you what is wrong suddenly desaturates, becomes hypotensive, or spikes
   an airway pressure, the anaesthetist does not start from zero — they run a rehearsed
   differential against the monitors in front of them (DOPES for hypoxia, a structured hypotension
   differential, the capnography trace for a ventilation problem) (§2.6, §4).

**What the anaesthetist is always secretly ruling out**, underneath every one of the five
questions: *the event that is silent until it is a cardiac arrest.* Anaphylaxis, malignant
hyperthermia, high/total spinal, local anaesthetic systemic toxicity, awareness with paralysis,
oesophageal intubation, tension pneumothorax on positive pressure — each of these has a window of
minutes between the first subtle sign and irreversible harm, and each is *only* caught by a
clinician who was already looking for it, because the monitor does not announce a diagnosis, it
only shows a number moving. This is why anaesthetists narrate their vigilance internally in
rehearsed patterns ("rising airway pressure — is this anaphylaxis, bronchospasm, a blocked tube,
or a pneumothorax") rather than waiting for a crisis to declare itself.

**The tempo — each phase of the anaesthetic has its own signature failure modes, and vigilance
must shift gears at each transition:**

- **Pre-operative** (minutes to days before): the failure mode is a missed red flag — an
  unrecognised difficult airway, an unrecognised cardiac lesion, a drug interaction, a fasting
  violation, a coagulation problem that should have gated a spinal. This phase is slow and
  cognitive — the one point in the whole anaesthetic where there is time to think, ask, examine,
  and plan Bs and Cs. A rushed pre-op assessment is where most preventable disasters are seeded.
- **Induction** (the first 5–10 minutes): the highest-risk, highest-tempo phase. Airway loss,
  cardiovascular collapse in the compromised patient, anaphylaxis to induction drugs, and
  aspiration all cluster here. Full attention, hands on the patient, nothing else happening in
  the room.
- **Maintenance** (the bulk of the case): tempo relaxes to vigilant monitoring — trends more than
  single numbers, periodic reassessment (blood loss, fluid balance, depth of anaesthesia,
  temperature, positioning/pressure areas), and readiness to escalate tempo instantly if a trend
  breaks (rising airway pressure, falling BP, rising EtCO₂ with rising temperature = MH until
  proven otherwise).
- **Emergence** (extubation and the first minutes after): its own failure modes — laryngospasm,
  residual neuromuscular blockade, aspiration on a not-yet-protected airway, the pressor surge of
  emergence in a patient who cannot tolerate hypertension (aneurysm, pre-eclampsia, ICP).
- **Recovery/PACU**: the failure mode is a slow, insidious deterioration missed because
  "the case is over" — opioid-induced respiratory depression, evolving airway oedema, ongoing
  bleeding, hypothermia-driven coagulopathy — caught only by structured, scored reassessment
  (Aldrete, pain score, sedation score) rather than a single glance.

---

## 2. Presenting situations — worked to full depth

### 2.1 The pre-operative assessment end-to-end

**Purpose.** Answer, in order: can this patient's airway be secured; is their physiological
reserve adequate for the planned anaesthetic and surgery; what specifically needs to be
optimised, and is optimising it worth delaying surgery for; what does the drug/anticoagulation/
allergy history change about the plan.

**ASA physical status classification** (a global-risk shorthand, not a full risk score, but
mandatory documentation and a genuine predictor of perioperative mortality):
- **ASA I** — normal healthy patient.
- **ASA II** — mild systemic disease, no functional limitation (well-controlled HTN, controlled
  DM without end-organ disease, smoker, obesity, pregnancy).
- **ASA III** — severe systemic disease, substantive functional limitation (poorly controlled
  DM/HTN, COPD, morbid obesity, stable angina, ESRD on dialysis, >3 months post-MI/stroke).
- **ASA IV** — severe systemic disease that is a constant threat to life (recent MI/stroke
  <3 months, ongoing cardiac ischaemia, severe valve disease, sepsis, DIC, ARDS).
- **ASA V** — moribund, not expected to survive without the operation (ruptured AAA, massive
  trauma, extensive intracranial bleed with mass effect).
- **ASA VI** — declared brain-dead, organs being harvested.
- **"E" suffix** — emergency surgery (added to any class; an ASA I-E patient having an emergency
  appendicectomy is coded differently from an elective ASA I). Emergency status itself
  independently raises mortality risk at every ASA class [EK].

**Airway examination — the tools, used together, none individually reliable:**
- **Mallampati class** (patient sitting, mouth maximally open, tongue protruded, phonating "ahh",
  examiner at eye level): **I** — soft palate, uvula, fauces, pillars all visible; **II** — soft
  palate, uvula, fauces visible (pillars not); **III** — soft palate and base of uvula only;
  **IV** — soft palate not visible at all. Class III/IV predicts difficult laryngoscopy but has
  poor sensitivity alone [EK].
- **Thyromental distance** — chin to thyroid notch, neck extended: **<6–6.5 cm predicts
  difficulty** (short distance = anterior larynx, less room to displace tongue).
- **Mouth opening (inter-incisor gap)** — **<3 cm (or <2 finger-breadths) predicts difficult
  laryngoscopy/limited laryngoscope insertion.**
- **Neck movement** — extension at the atlanto-occipital joint; reduced extension (rheumatoid
  cervical spine, ankylosing spondylitis, halo traction, cervical collar) markedly worsens the
  laryngoscopic view.
- **LEMON** (bedside difficult-airway screen, esp. in emergency/trauma settings): **L**ook
  externally (facial trauma, large incisors, beard, large tongue); **E**valuate 3-3-2 rule (mouth
  opening ≥3 fingers, hyoid-to-chin ≥3 fingers, thyroid-notch-to-floor-of-mouth ≥2 fingers);
  **M**allampati; **O**bstruction/obesity (any of: epiglottitis, peritonsillar abscess, trauma,
  obesity); **N**eck mobility.
- **Additional red flags:** history of previous difficult intubation (the single best predictor —
  always ask, always check old anaesthetic charts if available), obstructive sleep apnoea,
  micrognathia/retrognathia, large tongue (acromegaly, Down syndrome, amyloidosis), reduced
  temporomandibular joint mobility, fixed cervical flexion deformity, stridor at rest (impending
  total obstruction — this patient needs an awake technique and a surgeon scrubbed for a surgical
  airway, not a rapid-sequence induction).

**Functional capacity / METs.** A practical proxy for cardiopulmonary reserve, asked in plain
language ("can you climb two flights of stairs without stopping," "can you walk fast on the
flat," "can you do heavy housework/dig the garden"). **≥4 METs** (climbing a flight of stairs,
walking up a hill, light jogging) is generally reassuring for proceeding without further cardiac
work-up in the absence of active cardiac symptoms; **<4 METs**, or inability to answer because the
patient is sedentary/limited by non-cardiac disease, should prompt closer scrutiny of cardiac risk
factors and possibly further investigation before elective major surgery [EK, ACC/AHA
perioperative framework].

**When to delay elective surgery:**
- **Active/uncontrolled hypertension** — commonly cited threshold for postponing *elective*
  surgery: **systolic ≥180 mmHg and/or diastolic ≥110 mmHg** on the day of surgery, particularly
  if previously undocumented/untreated; treat and reassess rather than reflexively cancel a
  long-standing, otherwise stable hypertensive whose pressure is modestly elevated on the day
  from anxiety [EK]. Chronic, well-documented hypertension without end-organ crisis is not itself
  a reason to delay.
- **Upper respiratory tract infection (URTI)** — active URTI with fever, purulent secretions,
  wheeze, or systemic symptoms should defer *elective* anaesthesia (raised risk of
  laryngospasm/bronchospasm, especially with airway instrumentation) — classically **2–4 weeks**
  is advised for the airway hyper-reactivity to settle after a significant URTI, though a simple
  afebrile "sniffle" with clear secretions and no chest signs is commonly allowed to proceed for
  minor/non-airway surgery at clinical discretion [EK]. This decision matters enormously more in
  children (§2.10).
- **Glycaemic control** — **HbA1c ≥8–9% (≈64–75 mmol/mol)** or random glucose persistently
  >twice-normal is a recognised threshold for deferring elective surgery to optimise control,
  because poor control independently raises surgical-site infection and perioperative
  complication rates [EK]; this is a *relative* threshold weighed against the urgency of surgery,
  not an absolute rule.
- **Anaemia** — correct reversible anaemia (iron, B12/folate) before elective major-blood-loss
  surgery where time allows; a Hb that would trigger transfusion intra-operatively is worth
  addressing pre-operatively instead.
- **Active cardiac symptoms** — unstable angina, decompensated heart failure, symptomatic severe
  arrhythmia, symptomatic severe valve disease — defer and refer for cardiology optimisation
  regardless of surgical urgency category, unless surgery itself is life-saving and cannot wait.

**Pre-operative investigations by age/comorbidity — and what NOT to order.** Routine
"shotgun" pre-op panels (FBC + U&E + LFT + coag + ECG + CXR for every patient) are low-yield and
now actively discouraged; the modern approach is **targeted testing driven by history, exam, and
the magnitude of surgery** [EK, consistent across NICE/ASA pre-op testing guidance]:
- **Healthy patient, minor/day-case surgery, no comorbidity flags:** no routine bloods, no ECG,
  no CXR required regardless of age alone.
- **FBC** — indicated where anaemia/bleeding risk is plausible (menorrhagia, chronic disease,
  major blood-loss surgery, known haematological disease) — not routinely for a healthy adult
  having minor surgery.
- **U&E/creatinine** — indicated for renal disease, diabetes, patients on ACEi/ARB/diuretics,
  major surgery, or the elderly with comorbidity — not routinely for a fit young adult.
- **Coagulation screen** — indicated only where there is a bleeding history, liver disease,
  anticoagulant use, or the surgery/anaesthetic plan (neuraxial block) specifically requires
  knowing the coagulation status — a normal history does not need a routine PT/INR/APTT "just in
  case," which has a high false-positive rate and low yield in an unselected population.
- **ECG** — indicated for known cardiac disease, age with cardiovascular risk factors, or
  symptoms — not a blanket age cut-off requirement, though many SA institutions still apply a
  local age threshold (commonly cited informally around 50–60 years) as a pragmatic floor [EK].
- **CXR** — very low yield pre-operatively in the absence of active respiratory symptoms or
  suspected pathology; not routine.
- **HbA1c/glucose** — for known or newly-suspected diabetes, or where glycaemic control changes
  the decision to proceed (see above).
- **Pregnancy test** — for any woman of childbearing potential where pregnancy status would
  change management, per local policy.
- **Group & save / crossmatch** — driven by the surgery's expected blood loss (maximum surgical
  blood order schedule, §3), not routine for low-blood-loss procedures.
- **The trap:** ordering a test you have no plan to act on wastes resources, delays surgery, and
  generates incidentalomas that themselves cause harm (further work-up, anxiety, delay) without
  benefit — "don't order it if a normal or abnormal result won't change what you do today."

**Medication instructions — what continues, what stops, and when.** This is one of the highest-
stakes parts of the pre-op consult because both over-continuing and over-stopping cause harm.

| Drug class | Instruction | Rationale / trap |
|---|---|---|
| **ACE-inhibitors / ARBs** | Commonly **withheld on the morning of surgery** (esp. major surgery/general anaesthesia) | Continuing through induction is associated with refractory intra-operative hypotension resistant to usual vasopressors (RAAS blockade blunts compensatory vasoconstriction) [EK, widely taught anaesthetic practice]. Chronic use for heart failure is a nuanced exception — some cardiologists prefer continuation; default is to withhold the morning dose for routine surgery. |
| **Beta-blockers, calcium-channel blockers, other antihypertensives** | **Continue**, including on the morning of surgery | Abrupt withdrawal risks rebound hypertension/tachycardia/ischaemia; give with a sip of water. |
| **Metformin** | Generally **continue** for minor/day-case surgery with normal renal function; **withhold** on the day of major surgery or if peri-operative AKI/hypoperfusion/contrast is anticipated | Risk of (rare) lactic acidosis if renal perfusion drops intra-operatively; resume once eating/drinking normally and renal function confirmed stable [EK]. |
| **SGLT2 inhibitors (empagliflozin, dapagliflozin, etc.)** | **Stop 3 days before elective surgery** (some guidance: 2–4 days) | Risk of **euglycaemic diabetic ketoacidosis** — the ketoacidosis can occur with a *normal or only mildly elevated* glucose because the SGLT2i-driven glycosuria masks hyperglycaemia while ketogenesis continues under the catabolic stress of surgery/fasting; a normal glucose does NOT exclude DKA in a patient on an SGLT2i who is unwell post-op — check a ketone/gas if there is unexplained acidosis, tachypnoea, or malaise [EK, now widely adopted peri-operative safety teaching]. |
| **Insulin** | Individualised — typically basal insulin continued at reduced dose (e.g. 75–80%) the night before/morning of surgery, short-acting/prandial insulin withheld while fasted, with sliding-scale/variable-rate IV insulin infusion for major surgery or poor control | Avoid both hyperglycaemia and hypoglycaemia through the fasting/surgical stress period; target glucose in the **6–10 mmol/L** range peri-operatively is reasonable pragmatic guidance [EK]. |
| **Warfarin** | Stop **5 days** before elective surgery; check **INR ≤1.5** on the day (some thresholds use ≤1.4) before neuraxial block or major surgery; bridge with LMWH if high thrombotic risk (mechanical mitral valve, recent VTE, AF with high CHA₂DS₂-VASc) per individualised risk | INR must specifically be checked, not assumed, before any neuraxial technique. |
| **DOACs (apixaban, rivaroxaban, dabigatran)** | Stop **48–72 hours** before neuraxial block/major surgery depending on agent, renal function, and bleeding risk of the procedure (longer if CrCl reduced, esp. for dabigatran which is renally cleared) [EK, ASRA 4th/5th edition framework] | Exact windows are drug- and renal-function-specific — this is not a one-size-fits-all 24h rule; when in doubt, use the longest window or seek anaesthetic input. |
| **LMWH — prophylactic dose** | **≥12 hours** since last dose before neuraxial needle/catheter placement or removal; first post-procedure dose **≥4 hours** after needle/catheter placement or removal, and not until haemostasis confirmed | ASRA-anchored window; the *same* interval applies symmetrically before insertion and before/after catheter removal. |
| **LMWH — treatment (therapeutic) dose** | **≥24 hours** since last dose before neuraxial block | Higher-dose LMWH carries materially higher epidural/spinal haematoma risk if the window is shortened. |
| **Unfractionated heparin (prophylactic SC)** | **≥4–6 hours** and a normal APTT before neuraxial block, per most guidance [EK] | Lower spinal-haematoma risk than LMWH but still requires the interval. |
| **Aspirin (monotherapy, for primary/secondary CV prophylaxis)** | Generally **may continue** through neuraxial block and non-cardiac surgery — aspirin alone is **not** considered a contraindication to spinal/epidural in most modern guidance | A frequently over-cautious junior reflex is to stop aspirin "to be safe" before a spinal — this is usually unnecessary and, worse, exposes a cardiac/stroke-risk patient to rebound prothrombotic risk without an established neuraxial-bleeding benefit. |
| **Clopidogrel / P2Y12 inhibitors** | Stop **5–7 days** before neuraxial block (ticagrelor commonly 5 days, clopidogrel 5–7 days, prasugrel 7–10 days) | Combined with aspirin (dual antiplatelet after recent coronary stent) — do NOT stop without cardiology input; stent thrombosis risk from stopping may exceed the neuraxial-haematoma risk being avoided; the surgery itself may need to be deferred instead. |

**Consultant traps & pearls — §2.1:**
- The "routine" pre-op bloods reflex is a trap in both directions: under-investigating a genuinely
  high-risk patient because "they look fine," and over-investigating a healthy one, generating
  delay and incidental findings with no plan.
- ACEi/ARB continuation through induction is a classic, entirely preventable cause of a "why is
  this blood pressure not responding to phenylephrine/metaraminol" intra-operative crisis —
  always check the drug chart before blaming the technique.
- SGLT2i-associated euglycaemic DKA is a trap precisely because the glucose looks reassuring;
  screen with a gas/ketones in any unwell post-op patient on one of these drugs.
- Aspirin monotherapy does not need to be stopped for a spinal — stopping it is itself a
  (small but real) harm with no offsetting benefit in most cases.
- "INR ≤1.5" and the LMWH windows are not negotiable on the say-so of the surgical team wanting
  to proceed faster — the anaesthetist owns this gate.

---

### 2.2 Fasting & aspiration

**The 6/2 (and variants) fasting rule** — minimum pre-operative fasting times for *elective*
anaesthesia in a patient without risk factors for delayed gastric emptying [EK, ASA/ESAIC-anchored
consensus adopted in SA practice]:
- **Clear fluids** (water, black tea/coffee, pulp-free juice) — **2 hours**.
- **Breast milk** — **4 hours**.
- **Infant formula / non-human milk / light meal (e.g. toast)** — **6 hours**.
- **A full/fatty meal** — **8 hours** (fat delays gastric emptying further).

**Who is never truly "fasted" — treat as full stomach regardless of the clock:**
- **Labouring women** — progesterone and mechanical effects, plus opioid analgesia in labour,
  markedly delay gastric emptying; every labouring woman needing anaesthesia is managed as a full
  stomach.
- **Trauma** — pain, anxiety, and opioid administration all delay gastric emptying regardless of
  the reported last-meal time; the reported fasting time is unreliable in a trauma patient.
- **Bowel obstruction / ileus / acute abdomen** — mechanical or functional failure of gastric
  emptying; large residual volumes are the rule.
- **Recent opioid administration** (pre-hospital, in the ED, on the ward) — opioids delay gastric
  emptying independent of fasting time.
- **Diabetes with autonomic neuropathy (gastroparesis)** — chronically delayed emptying even when
  "fasted" by the clock.
- **Pregnancy generally** (even non-labouring, from ~20 weeks) — reduced lower-oesophageal
  sphincter tone and mechanical compression raise aspiration risk above the non-pregnant baseline,
  which is why obstetric anaesthesia defaults toward RSI-type precautions even for elective
  caesarean section.
- **Raised intra-abdominal pressure / obesity / hiatus hernia / symptomatic reflux.**

**Rapid sequence induction (RSI) — the technique for the full-stomach patient:**
- **Pre-oxygenation** — 3 minutes of tidal breathing 100% O₂, or 8 vital-capacity breaths, via a
  tight-fitting mask, aiming for an end-tidal O₂ **≥90%** where capnography with O₂ analysis is
  available; this builds an oxygen reservoir in the FRC to buy apnoea time during the
  laryngoscopy attempt. Head-up/ramped positioning improves pre-oxygenation efficiency and FRC,
  especially in the obese/pregnant patient.
- **Cricoid pressure ("Sellick's manoeuvre") — controversial, no longer universally mandated.**
  Traditional teaching: firm posterior pressure on the cricoid cartilage occludes the oesophagus
  against the vertebral body, preventing passive regurgitation during the apnoeic/paralysed
  interval before the cuff is inflated. Modern evidence base is weak, and cricoid pressure can
  *worsen* the laryngoscopic view or impede supraglottic airway placement/ventilation if a rescue
  is needed — many contemporary protocols (including DAS-aligned practice) advise **releasing or
  omitting cricoid pressure if it is impairing the view or ventilation**, and some units have
  moved away from routine application altogether. Practical stance: apply lightly if using it,
  and release immediately if it interferes with laryngoscopy, ventilation, or supraglottic rescue
  — do not persist with cricoid pressure at the cost of oxygenation. [EK — reflects the
  post-2015 shift in DAS-aligned teaching away from rigid cricoid dogma.]
- **Neuromuscular blocking agent choice:**
  - **Suxamethonium (succinylcholine) 1–1.5 mg/kg IV** — depolarising, fastest onset
    (~30–60 seconds), short duration (~5–10 minutes) which is historically valued as a safety
    margin (spontaneous recovery if intubation fails and ventilation is difficult) — but that
    "safety margin" is now recognised as false reassurance in a true CICO scenario, since
    apnoeic desaturation occurs faster than sux wears off in a poorly pre-oxygenated or
    physiologically stressed patient. Contraindicated/cautioned: known/suspected malignant
    hyperthermia susceptibility, hyperkalaemia risk (burns >24h old, spinal cord injury >24h
    old, major crush/denervation injury, pre-existing hyperkalaemia, renal failure with high K⁺),
    suxamethonium apnoea (pseudocholinesterase deficiency — personal/family history of prolonged
    paralysis after a previous anaesthetic), penetrating eye injury (raises IOP), history
    suggestive of neuromuscular disease.
  - **Rocuronium 1.2 mg/kg IV** — non-depolarising, achieves comparably fast onset and
    intubating conditions to suxamethonium at this higher-than-usual dose, with a much longer
    duration of action (~45–70 minutes) *unless reversed with sugammadex*, which restores a true
    rescue option (full reversal in ~2–3 minutes at sugammadex 16 mg/kg for immediate reversal)
    — this pairing (rocuronium RSI + sugammadex on standby) is now a well-established alternative
    RSI strategy, particularly attractive where suxamethonium is contraindicated. **[EK]** — sugammadex
    availability at district-hospital level in SA is inconsistent (§6); where unavailable,
    suxamethonium's short intrinsic duration remains the more failsafe choice for an anticipated
    difficult airway at a resource-limited site, because it does not depend on a reversal drug
    being in the cupboard.
- **The induction agent is given immediately before/with the paralysing agent (not staged as in a
  routine induction)**, and the airway is secured with cuffed tracheal tube placement and cuff
  inflation confirmed (capnography trace) before returning to spontaneous ventilation or
  releasing cricoid pressure.

**Aspiration — recognition and management:**
- **Recognition:** visible regurgitated gastric content in the airway/on laryngoscopy, sudden
  desaturation, wheeze/bronchospasm, rising airway pressures, or a delayed picture of
  tachypnoea/hypoxia/infiltrate over the following hours (chemical pneumonitis, historically
  "Mendelson's syndrome").
- **Immediate management:** head-down/lateral tilt if regurgitation is occurring before the
  airway is secured, immediate suction under direct laryngoscopy, secure the airway (cuffed tube)
  as the priority over any other step — do NOT attempt bag-mask ventilation before suctioning
  visible contents (risks pushing material further into the airway). **Do not routinely lavage
  the airway** (dilutes and spreads the acid rather than removing it) and **do not give
  prophylactic antibiotics or steroids routinely** — reserve antibiotics for evidence of
  established infection, not the chemical pneumonitis itself [EK]. Supportive respiratory
  management (oxygen, PEEP/ventilation as needed for evolving ARDS-pattern lung injury), and
  observe closely for several hours even if the immediate desaturation resolves, since the
  chemical injury can evolve.

---

### 2.3 The difficult airway & failed intubation

**Predictors — recap and extend §2.1:** prior difficult intubation (best single predictor),
Mallampati III/IV, thyromental distance <6 cm, mouth opening <3 cm, reduced neck extension,
obesity/OSA, pregnancy (airway oedema, engorged mucosa, reduced FRC = faster desaturation),
acromegaly, facial trauma, airway tumour/abscess/epiglottitis, previous head/neck
radiotherapy/surgery, beard (impairs mask seal).

**The plan A/B/C/D drill (DAS-aligned framework)** — the core discipline is having an
explicit, briefed, sequential plan *before* induction, not improvising after failure:
- **Plan A — primary tracheal intubation.** Optimise first attempt: positioning (sniffing/ramped),
  best available laryngoscope (consider videolaryngoscopy first-line if available/skilled — DAS
  2015 onward increasingly favours early videolaryngoscopy), external laryngeal manipulation, a
  bougie. **Maximum of a limited number of attempts** (commonly taught as ≤3, with a fourth only
  by the most experienced operator present) — declare failure early rather than repeating the
  same failing technique; each attempt causes airway trauma/oedema that makes the *next* attempt
  and mask ventilation harder.
- **Plan B — supraglottic airway (SGA) rescue.** If intubation fails, prioritise oxygenation over
  further intubation attempts: insert a second-generation SGA (allowing gastric drainage and
  higher seal pressures). If oxygenation is achieved, **stop and think**: wake the patient up
  (safest default for elective cases), proceed with the SGA as the airway for the case (if
  appropriate for the surgery), make one further considered intubation attempt through/alongside
  the SGA (e.g. fibreoptic through an intubating SGA) by the most skilled operator, or move
  directly to surgical airway if the clinical situation demands.
- **Plan C — face-mask ventilation, wake the patient.** If SGA also fails to oxygenate, revert to
  face-mask ventilation (two-person technique, airway adjuncts) with the explicit goal of waking
  the patient — abort the case if elective.
- **Plan D — can't intubate, can't oxygenate (CICO) → front-of-neck access (FONA/surgical
  airway/cricothyroidotomy).** Declared when face-mask AND SGA both fail to achieve oxygenation.
  This is a **primary emergency intervention**, not a last resort tried only after everything
  else has been exhausted for many minutes — the DAS-aligned teaching is to declare CICO early
  and act decisively, because hypoxic brain injury/cardiac arrest is the alternative. Technique:
  **scalpel-bougie-tube cricothyroidotomy** is the currently favoured emergency surgical airway
  technique in most difficult-airway algorithms over needle cricothyroidotomy with jet
  ventilation, because it more reliably delivers a definitive, ventilatable airway quickly with
  equipment that is simple and widely available (scalpel, bougie, cuffed tube) [EK, DAS-aligned
  consensus]. Landmark: **cricothyroid membrane**, palpated between the thyroid and cricoid
  cartilages in the midline of the neck.
- **The drill matters because it is rehearsed, not improvised** — every theatre team member
  should know their role (who gets the difficult airway trolley, who calls for help, who preps
  for a surgical airway) before the case starts if a difficult airway is anticipated, and the
  same mental sequence should be triggerable instantly even when the difficulty is *unanticipated*.

**Laryngospasm — recognition and management ladder.** A reflex, sustained closure of the vocal
cords, classically triggered by airway stimulation (secretions, blood, an SGA/ETT, surgical
stimulus) under light planes of anaesthesia, especially in children (§2.10) and around emergence.
- **Recognition:** partial laryngospasm — high-pitched inspiratory stridor; complete
  laryngospasm — **silent chest, no air movement, paradoxical rocking-boat chest/abdominal
  movement, rapidly falling SpO₂.**
- **Management ladder:**
  1. **Remove the stimulus** — stop suctioning/surgical stimulation.
  2. **100% oxygen, gentle CPAP via tight-fitting mask.**
  3. **Jaw thrust with firm pressure at "Larson's point"** (behind the lobule of the ear,
     bilaterally) — a recognised manoeuvre that can break laryngospasm mechanically.
  4. **Deepen anaesthesia** — a small IV propofol bolus (e.g. ~0.5 mg/kg) if IV access is present
     and the patient is not yet critically hypoxic — deepening the plane relaxes the reflex.
  5. **If desaturating despite the above: suxamethonium** — a small IV dose (e.g. ~0.1–0.5 mg/kg,
     titrated) is often enough to break laryngospasm without full paralysis; if no IV access, IM
     suxamethonium (commonly cited ~4 mg/kg IM) is an option while establishing access, or the
     intraosseous route.
  6. Be ready to **bag-mask ventilate or re-intubate** once the spasm breaks; watch for
     **negative-pressure pulmonary oedema** as a delayed complication of forceful inspiratory
     effort against a closed glottis.

**The obstetric airway.** Pregnancy independently worsens every difficult-airway risk factor:
airway oedema (worse in pre-eclampsia), engorged friable mucosa (higher bleeding risk with
instrumentation), enlarged breasts complicating laryngoscope handle insertion, reduced FRC and
increased oxygen consumption (faster desaturation on apnoea than a non-pregnant patient of the
same build), and a full stomach by definition. Obstetric general anaesthesia is therefore always
treated as an anticipated-difficult-airway RSI: smaller tube than usual on standby (oedema may
narrow the glottic aperture), videolaryngoscope early if available, most experienced operator,
full CICO drill briefed, and — the single biggest lever — **avoid GA for caesarean section
wherever a neuraxial technique is feasible** (§2.5, §2.9), which is precisely why the failed-GA-
airway signal is such a prominent cause of SA obstetric anaesthetic mortality (§6).

---

### 2.4 Induction in the compromised patient

**The core principle: every induction agent drops SVR and/or contractility to some degree; a
patient with no reserve to compensate can arrest on induction, not from surgery.** The task is
matching agent and dose to the patient's remaining physiological reserve, and resuscitating
*before* inducing wherever the clinical urgency allows.

- **The septic patient.** Vasodilated, often relatively hypovolaemic, with a catecholamine-driven
  compensated blood pressure that induction removes in one step. Reduce induction doses
  (commonly by ~25–50% of the "normal" dose, titrated to effect rather than a fixed number
  [EK]); favour agents with more haemodynamic stability — **ketamine** (see below) or reduced-dose
  **etomidate** (haemodynamically the most stable induction agent, though adrenal suppression
  from even a single dose is a recognised concern in sepsis, historically debated but still
  informs cautious/selective use); avoid full-dose propofol in the profoundly shocked patient.
  Have vasopressor drawn up and ready (a push-dose pressor — e.g. small boluses of
  phenylephrine or metaraminol, or noradrenaline infusion running/primed for major cases) *before*
  pushing the induction agent, not after the pressure has already dropped.
- **The hypovolaemic (trauma/haemorrhage) patient.** Same principle — reduced reserve to buffer
  vasodilation, and induction can unmask haemorrhagic shock that catecholamines were masking.
  Resuscitate what you can before induction where the clinical picture allows (permissive
  hypotension in penetrating trauma awaiting surgical control is a deliberate exception — do not
  over-resuscitate to a "normal" pressure before the bleeding is controlled); reduce induction
  doses; **ketamine** is frequently favoured here for its relative preservation of sympathetic
  tone; have blood products immediately available, not merely ordered.
- **The fixed-cardiac-output patient (severe aortic stenosis, hypertrophic obstructive
  cardiomyopathy, tamponade, constrictive pericarditis, tight mitral stenosis, Fontan
  circulation).** These patients cannot increase cardiac output to compensate for a fall in SVR —
  their output is mechanically capped. A vasodilatory induction agent given at a normal dose can
  precipitate profound, sometimes unrecoverable hypotension because the compensatory tachycardia/
  increased contractility response is either dangerous in itself (HOCM — worsens dynamic outflow
  obstruction) or mechanically impossible (fixed-output lesions). Principles: maintain
  preload, maintain SVR (avoid vasodilating agents/doses, have a vasoconstrictor ready), avoid
  tachycardia in HOCM/aortic stenosis (reduces diastolic filling time and worsens obstruction in
  HOCM), slow careful titrated induction, invasive arterial monitoring for major cases, and early
  senior/cardiac-anaesthesia input wherever available — this is a "do not attempt alone at a
  district hospital without discussion" category where feasible.
- **Ketamine's role.** A dissociative agent that, unlike propofol/thiopentone, tends to
  **preserve or even raise heart rate and blood pressure** via centrally-mediated sympathetic
  stimulation (it does have direct myocardial depressant properties unmasked in a catecholamine-
  depleted patient, e.g. prolonged severe shock — so it is not a universal rescue in every
  compromised patient, but in the acutely hypovolaemic/septic patient with intact sympathetic
  reserve it is one of the most haemodynamically forgiving induction agents available, and is the
  favoured induction agent in resource-limited/trauma settings for exactly this reason). Dose for
  induction: **1–2 mg/kg IV** (or up to ~4–6 mg/kg IM if no IV access), typically **reduced** in
  the already-shocked patient (titrate to effect). Also raises intracranial and intraocular
  pressure to a degree historically taught as a contraindication in head injury — this is now
  regarded as outdated/overstated in modern evidence provided ventilation and oxygenation are
  maintained, but remains a factor to weigh case-by-case.
- **The sick laparotomy (perforation, obstruction, ischaemic bowel, ruptured viscus).** Combines
  full-stomach aspiration risk (§2.2 — RSI mandatory) with septic/hypovolaemic physiological
  compromise (dose-reduce, resuscitate what you can first, pressor ready) and often a difficult
  intubation risk factor stack (distended abdomen splinting the diaphragm and reducing FRC/apnoea
  tolerance). This is the paradigm case where all five mental-model questions are simultaneously
  "high-stakes yes" and where senior/telephonic support should be sought early at a district
  hospital rather than proceeding alone if any doubt exists (§6).

---

### 2.5 Spinal anaesthesia for caesarean section — the SA district signature

**Why this is the signature case.** It is the single procedure most likely to be performed,
unsupervised, by the most junior doctor in the building, at the hospital least equipped to rescue
a complication — and it is the leading identifiable driver of the anaesthesia-related maternal
mortality signal in South Africa (§6). Getting this technique, and its complication management,
right to a reflex level is disproportionately high-value.

**Contraindications:**
- **Absolute:** patient refusal, uncorrected severe coagulopathy/thrombocytopenia (platelet
  threshold is debated and context-dependent — commonly cited caution below roughly
  **70–80 ×10⁹/L** without another bleeding-risk factor, and increasing caution/avoidance as the
  count falls further or other coagulation abnormalities coexist [EK]), local infection at the
  injection site, frank hypovolaemic shock/uncorrected major haemorrhage (spinal sympathectomy
  will worsen hypotension on top of hypovolaemia), raised intracranial pressure with mass effect
  (risk of coning on dural puncture), true local anaesthetic allergy.
- **Relative:** severe aortic stenosis/fixed cardiac output (sympathectomy-induced afterload/
  preload drop poorly tolerated — see §2.4), uncorrected coagulopathy of a lesser degree,
  systemic sepsis (theoretical epidural abscess risk plus haemodynamic vulnerability), spinal
  deformity/previous spinal surgery (technically harder, not an absolute bar), patient inability
  to cooperate/position.

**Technique — level and position:**
- **Position:** sitting or lateral decubitus, per operator preference and patient factors (sitting
  often technically easier to identify midline in an obese patient; lateral avoids a hypotensive/
  vasovagal sitting patient and is preferred by many for the already-anxious labouring woman).
- **Level:** **L3/4 or L4/5 interspace** — identify the intercristal (Tuffier's) line, an
  imaginary line joining the top of the iliac crests, which crosses the L4 vertebra/L4-5
  interspace, as the landmark; needle insertion at or below this line avoids the (rare but
  catastrophic) risk of conus medullaris injury from an inadvertently high puncture.
- **Needle:** small-gauge (typically 25–27G) pencil-point (Whitacre/Sprotte-type) spinal needle
  preferred over cutting-tip (Quincke) needles where available — lower post-dural-puncture
  headache incidence (see below).

**Hyperbaric bupivacaine dosing.** Standard dose for spinal anaesthesia for caesarean section is
commonly **0.5% hyperbaric bupivacaine, 1.8–2.2 mL (9–11 mg)**, frequently combined with an
intrathecal opioid for multimodal analgesia (e.g. **fentanyl 10–25 mcg** and/or **morphine
100–200 mcg** where available) to improve intra-operative comfort and extend post-operative
analgesia **[EK — dose range corroborated by the published ED95 literature for hyperbaric
bupivacaine in caesarean section, ~11.2 mg, and by SA district-hospital obstetric-anaesthesia
teaching materials describing troubleshooting of spinal block for caesarean section; the exact
SASA-endorsed default volume/dose was not independently machine-extracted from a primary SASA PDF
this session — treat the 1.8–2.2 mL/9–11 mg range as the working standard and confirm against
local protocol/drug availability, since not all district pharmacies stock intrathecal opioid
preparations]**. Height/weight extremes (very short, very tall, morbidly obese) may warrant dose
adjustment at clinical discretion; a fixed dose in the 10–12.5 mg range is a reasonable default
that performs comparably to height-adjusted dosing in the literature.

**Block assessment — confirm to T4 before allowing surgery to start:**
- **Sensory level** — test with cold (ethyl chloride spray/ice) or light touch bilaterally in the
  midline, working cephalad; **T4 (nipple line)** is the traditional target sensory level for
  caesarean section (accounting for visceral peritoneal traction/exteriorisation discomfort that
  a lower somatic block would not cover); T6 is sometimes accepted as a working minimum for
  straightforward cases but T4 is the safer target.
- **Motor block** — a Bromage scale assessment (inability to flex the knee/ankle against
  resistance = adequate motor block) confirms the block is dense, not merely present.
- **Do not proceed to skin incision on a patchy or unconfirmed block** — this single discipline
  step prevents the single most distressing intra-operative event, intra-operative pain with an
  inadequate block, and the higher-stakes downstream event of a rushed conversion to general
  anaesthesia mid-procedure.

**Hypotension — prevention and management.** Spinal-induced sympathectomy vasodilates the lower
body and, combined with **aortocaval compression** from the gravid uterus in the supine position,
produces a well-described and highly preventable fall in venous return and cardiac output. This
is the leading identifiable, preventable driver of SA obstetric anaesthetic mortality (§6) —
prevention and prompt treatment are not optional refinements, they are the core of safe practice.
- **Prevention:**
  - **Left uterine displacement/left lateral tilt** (~15°, wedge or manual displacement) from the
    moment the patient lies supine, maintained throughout — relieves aortocaval compression.
  - **Co-load, not pre-load** — rapid IV crystalloid (or colloid) given *concurrently with/just
    after* the spinal is now favoured over the older practice of a fixed pre-load volume given
    *before* the block, because pre-loading alone has modest efficacy against spinal hypotension.
  - **Prophylactic vasopressor infusion** where resources allow (e.g. a low-dose phenylephrine
    infusion started at the time of the block in higher-resource settings) — commonly not
    available as an infusion at district level, where bolus dosing is the practical default.
- **Treatment — bolus vasopressors, repeated as necessary:**
  - **Phenylephrine 50–100 mcg IV boluses** — first-line where heart rate is normal/elevated
    (>60 bpm), because it is a pure alpha-agonist that restores SVR without the tachycardia risk
    of ephedrine, and is associated with less fetal acidosis in comparative obstetric literature
    than older ephedrine-first practice.
  - **Ephedrine 5–10 mg IV boluses** — preferred where there is co-existing bradycardia (<60 bpm),
    since its mixed alpha/beta action supports heart rate as well as pressure.
  - **[EK/fetched cross-check]** — these bolus doses and the heart-rate-based choice between the two
    agents are corroborated by SA district-hospital obstetric-anaesthesia troubleshooting
    literature; treat as the working SA standard.
  - Continue left tilt, ensure IV fluid is running freely, reassess and repeat boluses promptly —
    **the error that kills is under-treating recognised hypotension, not the hypotension itself.**

**Failed or patchy spinal — options:**
- **Reposition and reassess** — a unilateral or asymmetric block sometimes improves with a change
  in position before assuming failure.
- **Supplement with systemic analgesia/ketamine** — small titrated IV **ketamine boluses (commonly
  cited ~10 mg IV increments)** for breakthrough pain/patchy block during an otherwise
  proceeding case, which is an established SA district-level rescue strategy for exactly this
  scenario, alongside nitrous oxide where available and local infiltration by the surgeon.
- **Repeat the spinal** — feasible if the first dose clearly failed (no block at all) and there
  is time; caution around total dose if a partial block is already present (risk of an
  unexpectedly high/total block from a second full dose layering on residual local anaesthetic —
  reduce the repeat dose and assess cautiously).
- **Convert to general anaesthesia** — the necessary fallback when the block is inadequate for
  ongoing surgery and simpler rescue measures fail or time does not allow; this conversion is
  itself the moment of highest risk in obstetric anaesthesia (full-stomach RSI with the
  obstetric-difficult-airway profile, §2.3) and is precisely the scenario the maternal-mortality
  data flags (§6) — call for senior/telephonic support proactively rather than waiting until the
  conversion is already forced.

**High/total spinal — recognition and management.** Local anaesthetic spreading higher than
intended (from excessive dose, patient factors, or misplacement) can ascend to block thoracic
cardio-accelerator fibres, the phrenic nerve (C3-5), and ultimately the brainstem.
- **Recognition:** progressive ascending numbness/weakness of the hands/arms (block above T1),
  difficulty breathing or speaking (phrenic/intercostal involvement), bradycardia and
  hypotension out of proportion to a normal block (loss of cardio-accelerator sympathetic
  outflow, T1-4), nausea, and in a true total spinal, **loss of consciousness, apnoea, and
  cardiovascular collapse** as brainstem structures are affected.
- **Management — this is a resuscitation, not a "wait and see":** call for help immediately;
  **secure the airway and ventilate** (the patient may become apnoeic while still conscious
  initially, or may lose consciousness) — do not delay intubation/ventilatory support waiting for
  further deterioration to confirm the diagnosis; support the circulation aggressively
  (aggressive fluid, vasopressors, atropine for bradycardia, full ACLS/resuscitation drugs and
  dosing if arrest occurs); maintain left uterine displacement throughout; once
  airway/breathing/circulation are secured, the block will regress over time (typically within
  the normal duration of the local anaesthetic used) and full recovery is expected with prompt,
  competent supportive management — **the deaths from this complication are deaths from delayed
  or inadequate resuscitation, not from the high block itself being unsurvivable.**

**Post-dural-puncture headache (PDPH):**
- **Diagnosis:** classically a **postural** headache — worse sitting/standing, relieved (or much
  improved) lying flat — typically frontal/occipital, onset within 24–72 hours of dural puncture,
  may be accompanied by neck stiffness, photophobia, tinnitus, or (rarely) cranial nerve palsies
  (VI most classically, causing diplopia) from CSF hypotension/traction. Risk is higher with
  larger-bore and cutting-tip needles, younger patients, female sex, and pregnancy — hence its
  particular relevance to obstetric spinal anaesthesia.
- **Conservative management (first-line, most cases self-resolve within days to ~1–2 weeks):**
  bed rest is **not** required or beneficial as a preventive measure (older teaching now
  revised), but symptomatic lying-flat relief is reasonable; simple analgesia (paracetamol, NSAIDs
  where not contraindicated); adequate hydration; **caffeine** (oral or IV) is a widely used
  adjunct with modest evidence for symptomatic relief [EK].
- **Epidural blood patch** — the definitive treatment for a PDPH that is severe, disabling, or
  not settling with conservative measures (commonly considered after **24–48 hours** of failed
  conservative management, or sooner if severely disabling): autologous blood (commonly
  **~15–20 mL**, injected until resistance/patient discomfort) injected into the epidural space
  at or near the level of the original dural puncture, clotting over the dural defect and
  restoring CSF pressure; high single-treatment success rate, with a second patch occasionally
  needed [EK]. Not available at every district hospital — a recognised referral trigger where
  symptoms are severe/refractory.
- **Red flags that should trigger reconsidering the diagnosis** (not "just a PDPH"): fever
  (consider meningitis), a non-postural or progressively worsening headache, focal neurological
  signs, or seizure — particularly relevant in the obstetric population where **pre-
  eclampsia/eclampsia headache** and **cerebral venous sinus thrombosis** are important
  differentials that can mimic or coexist with PDPH.

---

### 2.6 Intra-operative emergencies

> Format: **Recognition** · **Discriminators** · **Management**, each worked to the depth of an
> actual crisis-management drill.

**Malignant hyperthermia (MH).**
- **Triggers:** all volatile anaesthetic agents (halothane, isoflurane, sevoflurane, desflurane)
  and **suxamethonium**; propofol, nitrous oxide, and non-depolarising neuromuscular blockers are
  considered safe/non-triggering.
- **Earliest signs — capnography first:** an otherwise-unexplained, progressive **rise in
  end-tidal CO₂** despite constant minute ventilation is classically the *earliest* reliable
  sign, often preceding a significant temperature rise — masseter spasm/trismus after
  suxamethonium (especially disproportionate/prolonged) is another early red flag. Followed by
  tachycardia, tachypnoea (if spontaneously breathing), rising temperature (which may be a
  *late* rather than early sign — do not wait for fever to act on a rising EtCO₂), muscle
  rigidity, mottled cyanosis, and later rhabdomyolysis (myoglobinuria, hyperkalaemia), metabolic
  and respiratory acidosis, and cardiac arrhythmias.
- **Management — the MH drill, immediate and simultaneous, not sequential:**
  1. **Stop all triggering agents immediately**, switch to a clean (non-triggered/vapour-free)
     breathing circuit and machine if feasible, and switch to **TIVA (propofol) plus 100% oxygen
     at high fresh-gas flow** to wash out residual volatile agent.
  2. **Call for help early** and get the MH box/cart.
  3. **Dantrolene 2.5 mg/kg IV**, repeated at intervals (commonly cited every 5–10 minutes) up to
     a **maximum cumulative dose of ~10 mg/kg** (occasionally more in refractory cases per
     specialist guidance) — this is the single specific, life-saving intervention and should not
     be delayed for further confirmatory testing.
  4. **Active cooling** — cold IV fluids, surface cooling, ice packs to groin/axillae; cool to a
     safe target and stop actively cooling once temperature is trending down to avoid overshoot
     hypothermia.
  5. **Treat hyperkalaemia, acidosis, and arrhythmias** using standard protocols (calcium,
     insulin/dextrose, bicarbonate as indicated; avoid calcium-channel blockers, which interact
     dangerously with dantrolene).
  6. **Monitor for and treat rhabdomyolysis/myoglobinuric renal injury** — aggressive IV fluids,
     monitor urine output and consider alkalinisation/forced diuresis per local protocol.
  7. **Abandon/expedite finishing surgery** as clinically appropriate; the patient needs ICU-level
     monitoring afterward given the risk of recrudescence in the following 24–36 hours.
- **Mortality:** historically **70–80%** untreated/pre-dantrolene era; with prompt dantrolene,
  active cooling, and modern monitoring, contemporary mortality is commonly cited at **well under
  5%** — the difference is entirely attributable to speed of recognition (capnography) and speed
  of dantrolene administration.

**Anaphylaxis under general anaesthesia.**
- **Grading (working framework, AAGBI/ANZAAG-aligned):** **Grade 1** — cutaneous signs only
  (flushing, urticaria, angioedema) without cardiovascular/respiratory compromise; **Grade 2** —
  moderate, single or multi-organ (cutaneous + hypotension and/or tachycardia and/or
  cough/difficulty ventilating, not life-threatening yet); **Grade 3** — severe, life-threatening
  single or multi-organ (cardiovascular collapse, severe bronchospasm — may be the presenting
  sign under GA, since the skin and voice complaints an awake patient would report are masked);
  **Grade 4** — cardiac arrest; **Grade 5** — death. Under general anaesthesia the classic
  cutaneous/respiratory symptoms a conscious patient would describe are absent — the presenting
  sign is often **sudden severe hypotension and/or bronchospasm/rising airway pressure**, making
  anaphylaxis a key differential for both the acute-hypotension and the acute-bronchospasm
  crises below.
- **Culprits (in rough order of anaesthetic relevance):** **neuromuscular blocking agents**
  (the single commonest triggering class in most large perioperative anaphylaxis registries),
  **latex**, **chlorhexidine** (increasingly recognised, often under-suspected because it is used
  for skin prep/catheter lubrication rather than injected), **antibiotics** (especially
  beta-lactams given at induction as surgical prophylaxis — the temporal proximity to induction
  makes it easy to misattribute the reaction to an induction drug instead), also colloids,
  patent blue dye (sentinel node procedures), and — rarely — the induction agents themselves.
- **Management:**
  1. **Stop the likely trigger(s)** and call for help.
  2. **100% oxygen**, secure/maintain the airway.
  3. **Adrenaline** — the definitive treatment, titrated to severity: **IV** in small titrated
     boluses in the anaesthetised, monitored patient with IV access already established
     (commonly cited **50 mcg IV boluses**, repeated and escalated as needed for Grade 3
     reactions, i.e. broadly the AAGBI-anchored approach — with some frameworks favouring a
     higher initial 100 mcg IV bolus for clearly Grade 3/life-threatening presentations); **IM**
     adrenaline (adult dose commonly **500 mcg IM**, i.e. the standard anaphylaxis IM dose) is
     the appropriate route where IV access/titration expertise is not immediately available, or
     as the default outside a monitored theatre setting — under GA with a line already running
     and continuous monitoring, cautious titrated IV dosing by an experienced operator is
     preferred over a large IM bolus.
  4. **Aggressive IV fluid resuscitation** (crystalloid boluses) for the vasodilated/leaky
     capillary state.
  5. **Second-line:** antihistamines and corticosteroids are commonly given but are adjuncts, not
     substitutes for adrenaline and fluids, and have limited evidence for altering the acute
     course.
  6. **Refractory anaphylaxis** (not responding to repeated adrenaline and fluid): consider an
     adrenaline infusion, other vasopressors (noradrenaline/vasopressin), and — for refractory
     bronchospasm — consider that the patient may be on a **beta-blocker**, which blunts the
     response to adrenaline; **glucagon** is a specific rescue in this situation because its
     inotropic/chronotropic action bypasses the beta-blocked receptor.
- **Tryptase timing — the specific investigation that confirms the diagnosis after the event:**
  take serial serum mast-cell tryptase samples — an **immediate/acute sample (as soon as
  practical after the reaction, ideally within 1 hour)**, a **second sample at ~4–6 hours**
  (some protocols specify a window around 1–2 hours and a second around 4 hours), and a
  **baseline/convalescent sample at ~24 hours** (or at a follow-up allergy clinic visit) once the
  acute event has resolved, to establish the patient's true baseline for comparison — a
  transiently elevated tryptase that returns to the patient's individual baseline supports the
  diagnosis; a normal tryptase does not fully exclude anaphylaxis (especially in isolated
  cutaneous or purely bronchospastic presentations). Refer for formal allergy/immunology
  work-up (skin testing to identify the specific culprit) once stable — critical for future
  anaesthetic safety, since the patient will need anaesthesia again.

**Local anaesthetic systemic toxicity (LAST).**
- **Maximum doses (commonly taught reference figures) [EK, ASRA-anchored]:**

| Agent | Max dose without adrenaline | Max dose with adrenaline |
|---|---|---|
| Lidocaine (lignocaine) | ~3 mg/kg | ~7 mg/kg |
| Bupivacaine / levobupivacaine | ~2 mg/kg | ~2–2.5 mg/kg (adrenaline adds relatively little extra margin for bupivacaine) |
| Ropivacaine | ~3 mg/kg | ~3–4 mg/kg |

  Adrenaline co-administration slows systemic absorption from the injection site (vasoconstriction),
  extending the safe ceiling most for lidocaine; the margin is narrower for bupivacaine, which is
  also the most cardiotoxic agent per mg (disproportionate sodium-channel blockade in the
  myocardium relative to its local anaesthetic potency) — this is why bupivacaine LAST carries
  the worst prognosis of the commonly used agents.
- **Presentation spectrum** — typically follows a progression, though it can also present with
  sudden cardiovascular collapse without the classic prodrome, especially with an inadvertent
  intravascular bolus:
  - **Early/mild (CNS excitation):** perioral tingling/numbness, metallic taste, tinnitus,
    light-headedness, visual disturbance, confusion, agitation.
  - **Progressing:** seizures.
  - **Late/severe (CNS depression then cardiovascular):** loss of consciousness, respiratory
    depression/arrest, and cardiovascular toxicity — hypotension, conduction abnormalities
    (widened QRS), arrhythmias (including refractory ventricular arrhythmias and cardiac arrest)
    — bupivacaine in particular can present with cardiovascular collapse with minimal or absent
    preceding CNS signs.
- **Management — the LAST drill:**
  1. **Stop injecting the local anaesthetic**, call for help, get the lipid emulsion kit.
  2. **Airway/breathing/100% oxygen**, seizure control (benzodiazepines first-line; avoid/use
     reduced-dose propofol if cardiovascular instability is present, since propofol itself
     depresses the myocardium).
  3. **Intralipid 20% — the specific antidote:**
     - **Bolus:** **1.5 mL/kg** (lean body weight) IV over ~1 minute (patients <70 kg), or a
       fixed **~100 mL** bolus in larger patients per some protocols.
     - **Infusion:** follow with **0.25 mL/kg/min**, continued for at least 10 minutes after
       circulatory stability is achieved.
     - **Repeat the bolus** (once or twice) if cardiovascular stability is not achieved, and
       consider **doubling the infusion rate** if instability persists.
     - **Upper dosing limit** commonly cited around **~12 mL/kg** total.
  4. **Modified resuscitation for cardiac arrest from LAST:** standard ACLS but with
     **reduced individual epinephrine boluses** (avoid large adrenaline doses, which may worsen
     outcomes in LAST-related arrhythmias per some evidence/expert consensus), avoid
     vasopressin, avoid calcium-channel blockers and beta-blockers, and be prepared for
     **prolonged resuscitation** — successful resuscitation after prolonged CPR has been reported
     with LAST arrests, so do not abandon efforts on the usual timeline; consider cardiopulmonary
     bypass/ECMO early if available for refractory arrest.

**Bronchospasm (intra-operative).**
- **Recognition:** rising peak/plateau airway pressures with a preserved or widened
  alveolar-plateau (capnography waveform shows a slow, sloping upstroke rather than the normal
  sharp rise — "shark fin" pattern), audible expiratory wheeze, prolonged expiratory phase, falling
  tidal volumes on pressure-control ventilation.
- **Differential:** true bronchospasm (asthma/COPD history, allergic trigger, light anaesthesia
  with airway irritation) vs the mimics that must be actively excluded — **anaphylaxis**
  (bronchospasm may be the presenting sign, §above), **endobronchial intubation** (tube too deep,
  unilateral wheeze/reduced air entry), **pneumothorax**, **aspiration**, **pulmonary oedema**,
  **mechanical obstruction** (kinked/blocked tube, secretions).
- **Management:** deepen anaesthesia (light plane is a common precipitant/aggravator),
  **salbutamol** (nebulised if circuit allows, or IV in severe cases), consider **adrenaline**
  (nebulised or IV) if severe/refractory or anaphylaxis is suspected, **increase FiO₂ to 100%**,
  adjust ventilator settings to allow a longer expiratory time and avoid breath-stacking/
  auto-PEEP, exclude and treat the mimics above systematically rather than assuming "just
  asthma."

**Unexpected hypoxia — the DOPES checklist.** A structured differential for the ventilated,
paralysed patient who suddenly desaturates, run through systematically rather than guessed at:
- **D — Displacement** of the tracheal tube (endobronchial migration, or accidental extubation/
  oesophageal placement — check capnography trace and chest auscultation bilaterally).
- **O — Obstruction** of the tube (secretions, kinking, biting on the tube, blood/foreign
  material) or of the airway/breathing circuit.
- **P — Pneumothorax** (often tension under positive-pressure ventilation) — check for
  asymmetric chest movement/air entry, tracheal deviation, rising airway pressure, hypotension.
- **E — Equipment failure** — check the oxygen supply/flow, the circuit for disconnection or leak,
  the ventilator settings, the pulse oximeter probe itself (a poorly-placed probe is a common
  false alarm — always correlate with the patient, not just the number).
- **S — Stacking of breaths (auto-PEEP)/Stomach** (splinting from surgical
  retraction/insufflation reducing compliance) — some versions also fold in "Secretions."
- Work through DOPES fast (seconds, not minutes) while simultaneously increasing FiO₂ to 100% and
  hand-ventilating with a self-inflating bag to assess compliance directly (a "feel" for a
  tension pneumothorax or bronchospasm that a ventilator display can obscure).

**Unexpected hypotension — differential.** Run in parallel with, not instead of, treating the
immediate drop (fluid bolus, reduce volatile agent, position):
- **Anaesthetic-drug effect** (induction agent vasodilation, excessive volatile/neuraxial depth) —
  the commonest and most easily corrected cause.
- **Hypovolaemia** — under-recognised ongoing surgical blood loss, inadequate fluid replacement.
- **Anaphylaxis** (see above — especially if accompanied by rising airway pressure/rash/temporal
  association with a drug/antibiotic/chlorhexidine exposure).
- **High/total spinal or excessive neuraxial spread** (obstetric/regional cases, §2.5).
- **Cardiac** — arrhythmia, ischaemia/infarction, acute heart failure.
- **Obstructive** — tension pneumothorax, cardiac tamponade, massive PE, aortocaval compression
  (obstetric — check tilt), gas embolism (laparoscopic/hysteroscopic cases), surgical
  compression of the IVC/great vessels.
- **Sepsis** (unmasked or worsened intra-operatively).
- **LAST** (in a regional/local case).
- **Adrenal insufficiency** (rare, but relevant in a patient on chronic steroids or with
  undiagnosed Addison's, especially if refractory to usual pressors).

**Awareness under general anaesthesia.** Explicit recall of intra-operative events despite
intended general anaesthesia, historically most associated with **neuromuscular blockade masking
the normal physical signs of light anaesthesia** (movement, grimacing) combined with inadequate
hypnotic depth — classic high-risk scenarios: rapid-sequence induction where hypnotic dosing is
sometimes under-titrated relative to the paralysing agent (obstetric GA, trauma), cardiac surgery
with haemodynamically-limited anaesthetic depth, major trauma/haemorrhage where hypnotic agents
are dose-reduced for haemodynamic reasons while paralysis continues, and any equipment
failure/disconnection delivering less anaesthetic than intended. Mitigation: adequate hypnotic
dosing even under haemodynamic pressure (favour a haemodynamically-tolerant agent/dose
combination over simply omitting hypnotic depth), processed-EEG depth-of-anaesthesia monitoring
(e.g. BIS, §3) where available and particularly for high-risk cases (TIVA, neuromuscular
blockade with haemodynamic instability), vigilance for autonomic signs of light anaesthesia
(hypertension, tachycardia, lacrimation, sweating) even when movement is masked by paralysis, and
a low threshold to ask the patient postoperatively about recall, with a structured pathway
(explanation, apology, psychological support/referral) if awareness is reported — it is a
recognised, serious patient-safety event, not something to be dismissed.

---

### 2.7 Emergence & recovery

**Delayed emergence — differential, worked as a systematic exclusion rather than "just wait":**
- **Residual neuromuscular blockade** — the commonest reversible cause; assess clinically
  (sustained head lift >5 seconds, sustained hand grip, ability to protrude tongue) and, where
  available, objectively via **train-of-four (TOF) monitoring** — a **TOF ratio ≥0.9** is the
  target for safe extubation (lower ratios, even when the four twitches look subjectively "equal"
  to the naked eye, can still represent clinically significant residual paralysis — this is why
  quantitative/objective TOF monitoring, where available, is preferred over qualitative visual
  assessment). Reversal: **neostigmine 50 mcg/kg IV** (commonly capped around a
  **maximum of ~2.5–5 mg total**), combined with **glycopyrrolate ~10 mcg/kg IV** (or atropine)
  to counter neostigmine's muscarinic side effects (bradycardia, secretions, bronchospasm) — note
  neostigmine has a **ceiling effect** and will not reliably reverse deep block; **sugammadex
  2 mg/kg IV** reverses moderate rocuronium/vecuronium block rapidly and reliably (**4 mg/kg**
  for deeper block, **16 mg/kg** for immediate reversal shortly after intubating doses) but only
  works on aminosteroid agents (rocuronium, vecuronium), not on benzylisoquinoliniums
  (atracurium, cisatracurium) or suxamethonium.
- **Hypoglycaemia** — check a bedside glucose in any unexpectedly slow-to-wake patient, especially
  diabetics or prolonged-fasted patients — a simple, fast-to-exclude, fully reversible cause that
  is easy to overlook amid drug-focused thinking.
- **CO₂ narcosis** — hypercapnia from inadequate ventilation/reversal of respiratory depression,
  causing a depressed level of consciousness independent of anaesthetic drug residue; check an
  end-tidal or blood gas CO₂.
- **Residual opioid effect** — respiratory depression/sedation from opioid dosing; consider
  cautious titrated naloxone if respiratory depression is significant, being mindful that
  reversing analgesia abruptly can precipitate severe pain, hypertension, and even pulmonary
  oedema.
- **Residual volatile/IV anaesthetic effect** — simply inadequate time/elimination, more likely
  in the elderly, hepatic/renal impairment, hypothermia (slows drug metabolism), or drug
  interactions.
- **Central causes** — perioperative stroke (esp. after cardiac/carotid surgery, or in a patient
  with vascular risk factors and prolonged hypotension), seizure/post-ictal state, raised ICP,
  severe electrolyte derangement (hyponatraemia, hypercalcaemia), hypothermia itself (a core
  temperature <~34–35°C can independently impair consciousness and drug clearance).
- **Structured approach:** exclude hypoxia and hypoglycaemia first (fast, cheap, reversible),
  assess neuromuscular status objectively, check temperature, review the drug chart/timing, then
  consider a central cause and image if there is any focal deficit or the picture does not fit a
  metabolic/pharmacological explanation.

**PACU discharge criteria — the Aldrete concept.** A structured, scored (not "eyeballed")
readiness assessment across five domains, each scored 0–2 (activity, respiration, circulation,
consciousness, oxygen saturation), for a **total out of 10**; a score of **≥9** (some protocols
accept ≥8 with all individual domains adequate) is the conventional threshold for safe discharge
from Phase I recovery. The value of the score is precisely that it is structured and repeatable —
it forces reassessment of each domain rather than an overall gestalt impression that can miss a
single deficient parameter (e.g. globally "looks fine" but still profoundly sedated).

**Post-operative nausea and vomiting (PONV) — the Apfel score and prophylaxis/treatment ladder.**
- **Apfel simplified risk score** — four factors, each contributing roughly equally: **female
  sex, non-smoker, history of PONV or motion sickness, planned post-operative opioid use.**
  Approximate PONV incidence by number of factors present: **0 factors ≈ 10%, 1 ≈ 20%, 2 ≈ 40%,
  3 ≈ 60%, 4 ≈ 80%** (commonly taught approximation; exact published figures vary by cohort but
  the roughly-20%-per-factor stepwise pattern is the teaching point) [EK].
- **Prophylaxis ladder, scaled to risk:** **0–1 factors** — minimal/no specific prophylaxis
  needed (or a single agent at clinician discretion); **2 factors** — two antiemetics from
  different classes; **3–4 factors** — two to three antiemetics from different classes, plus
  consider a total-intravenous-anaesthesia (propofol-based, avoiding volatile agents and nitrous
  oxide) strategy, which itself independently reduces PONV risk.
- **Agent classes (multimodal — combine different mechanisms rather than doubling one class):**
  **5-HT₃ antagonists** (ondansetron), **dexamethasone** (also has an analgesic/anti-
  inflammatory co-benefit — give early in the case for full effect), **dopamine antagonists**
  (metoclopramide — modest efficacy alone, useful as an add-on), **antihistamines**
  (e.g. cyclizine), **anticholinergics** (scopolamine patch, less practical acutely).
- **Non-pharmacological risk reduction:** adequate hydration, minimising opioid use (multimodal
  analgesia, §2.8), avoiding nitrous oxide and minimising volatile agent exposure in high-risk
  patients, adequate but not excessive fasting.
- **Treatment of established PONV:** use an agent from a *different* class than whatever was
  given for prophylaxis (prophylaxis failure with the same drug class is unlikely to respond to
  a repeat dose of the same class).

**Emergence delirium.** Acute post-anaesthetic confusion/agitation, more common in children
(§2.10) but also seen in adults, particularly the elderly (overlapping with post-operative
delirium more broadly), and associated with rapid emergence from volatile agents (especially
sevoflurane), pain, a full bladder, hypoxia, and an unfamiliar/frightening waking environment.
Management: exclude organic/reversible causes first (hypoxia, hypoglycaemia, pain, full bladder,
hypercapnia) before attributing to "just emergence delirium"; reassure/reorient in a calm
environment; treat pain adequately; consider a small dose of an appropriate sedative
(e.g. low-dose dexmedetomidine or a benzodiazepine, agent choice individualised) if
reorientation/analgesia alone is insufficient and the patient is at risk of self-harm/line
removal; usually self-limiting within minutes to an hour.

---

### 2.8 Acute post-operative pain

**Multimodal ladder — the core principle is combining agents with different mechanisms to reduce
total opioid exposure, not escalating a single class.**
- **Paracetamol** — regular (not PRN) dosing as a foundation for essentially all post-operative
  pain regimens: **1 g PO/IV 6-hourly (max 4 g/day in adults)**, dose-reduced in low body weight
  (<50 kg — commonly ~15 mg/kg per dose) and used cautiously with hepatic impairment.
- **NSAIDs** — e.g. **diclofenac** (a mainstay in SA EML post-operative protocols, available IM
  in the recovery room per SA hospital-level guidance) — effective opioid-sparing agents but
  contraindicated/cautioned in renal impairment/risk of AKI (hypovolaemia, nephrotoxic
  co-administration), active or high-risk GI bleeding, uncontrolled asthma with NSAID
  sensitivity, and used cautiously peri-operatively where surgical bleeding risk or renal
  perfusion is a concern.
- **Weak opioids** — **tramadol**, **codeine** — an intermediate step on the ladder, per SA
  guidance, though both carry their own caveats (tramadol — seizure risk at high doses, serotonin
  syndrome interaction risk with SSRIs/MAOIs; codeine — unpredictable metabolism via CYP2D6,
  contraindicated in children/breastfeeding per modern safety guidance due to ultra-rapid
  metaboliser toxicity risk).
- **Strong opioids** — **morphine** (the reference standard; SA acute-pain guidance emphasises
  titrated IV bolus dosing at short intervals — commonly cited **5–10 minute** re-dosing
  intervals for acute titration — rather than large infrequent boluses, to titrate to effect
  while minimising overshoot), or **PCA (patient-controlled analgesia)** where available and the
  patient can operate the device — a demand-dosing model (typical morphine PCA bolus in the
  region of **1 mg with a 5-minute lockout**, individualised) that empirically produces better
  analgesia with a lower total dose than nurse-administered intermittent dosing, because it
  matches dosing to the patient's actual pain in real time.
- **Regional/local options** — wound infiltration by the surgeon, peripheral nerve blocks (e.g.
  TAP block for abdominal surgery, femoral/fascia-iliaca block for hip fracture), and continuing
  a neuraxial technique's analgesic benefit into the post-operative period (intrathecal morphine
  from the spinal, or an epidural infusion) — all reduce systemic opioid requirement and its
  side-effect burden.
- **The opioid-in-renal-failure trap:** **morphine** has active renally-cleared metabolites
  (morphine-6-glucuronide) that accumulate in renal impairment, causing delayed, unpredictable,
  and prolonged respiratory depression/sedation — avoid or use with extreme dose reduction and
  extended monitoring in significant renal impairment. Similarly, **tramadol** and **codeine**
  have renally-cleared active metabolites and need dose reduction. Safer choices in renal failure
  (relatively less/no active-metabolite accumulation) include **fentanyl** (though still requires
  caution/titration) — a fixed "standard" opioid regimen applied blindly to a renal-impairment
  patient is a recognised and preventable cause of prolonged post-operative respiratory
  depression.

**Consultant traps & pearls — §2.8:**
- Reflexively withholding NSAIDs "because surgery" in every patient loses a genuinely
  opioid-sparing, effective agent for the majority who have no contraindication — apply the
  contraindications specifically, don't blanket-avoid.
- Treating pain scores instead of the patient — a patient who is comfortable and mobile with a
  "moderate" pain score does not automatically need dose escalation; conversely a "mild" score
  with poor function/refusal to mobilise needs review.
- The renal-impairment opioid trap above is one of the highest-yield "always check creatinine
  before the second morphine dose" pearls in ward-level post-operative care.

---

### 2.9 The obstetric patient beyond the spinal

**Physiological changes of pregnancy that matter to anaesthesia** [EK, standard obstetric
anaesthesia physiology, cross-referenced against the airway/aspiration/spinal-hypotension content
already fetched-and-sourced above]:
- **Airway:** capillary engorgement and oedema of the airway mucosa (worse in pre-eclampsia,
  worse still after prolonged pushing/Valsalva in labour), weight gain affecting positioning and
  laryngoscope handle clearance — all worsen laryngoscopic grade compared to the non-pregnant
  state (§2.3).
- **Respiratory:** reduced functional residual capacity (elevated diaphragm) combined with
  increased oxygen consumption — the combination means a pregnant patient **desaturates
  significantly faster on apnoea** than a non-pregnant patient of similar build, shortening the
  safe window during airway management. Minute ventilation increases (a mild compensated
  respiratory alkalosis is the normal pregnant blood-gas picture — a "normal" non-pregnant PaCO₂
  in a pregnant patient may actually represent relative hypoventilation/impending decompensation).
- **Cardiovascular:** plasma volume increases proportionally more than red cell mass (the
  physiological/dilutional anaemia of pregnancy), cardiac output rises substantially (mostly via
  increased stroke volume and heart rate), and **aortocaval compression** in the supine position
  from ~20 weeks onward can reduce venous return enough to cause frank hypotension/supine
  hypotensive syndrome — hence left tilt as a default position for any pregnant patient beyond
  the first trimester, not only during spinal anaesthesia.
- **Gastrointestinal:** reduced lower oesophageal sphincter tone and delayed gastric emptying
  (more pronounced in labour) — the basis for treating essentially all obstetric general
  anaesthesia as a full-stomach RSI (§2.2).
- **Haematological:** pregnancy is a relatively hypercoagulable state (raised clotting factors,
  reduced protein S) — relevant to VTE risk assessment, and to interpreting a "normal" coagulation
  screen in the context of pregnancy-specific reference changes.

**General anaesthesia for caesarean section — when needed, and why it is higher-risk.** Indicated
when spinal is contraindicated (coagulopathy, patient refusal, haemodynamic instability/major
haemorrhage where spinal sympathectomy would be poorly tolerated), when there is genuine
extreme time pressure (category-1 emergency, e.g. cord prolapse, major abruption, uterine rupture
— GA has a faster time-to-incision than a spinal in the truly crash scenario), or after failed
neuraxial technique (§2.5). Managed as a full RSI with all the obstetric-airway precautions above
(§2.3, §2.2) — smaller ETT on standby, most experienced operator, videolaryngoscope early where
available, full CICO drill briefed. This is precisely the scenario the SA maternal mortality data
identifies as high-risk (§6) — the combination of urgency, a physiologically and anatomically
harder airway, and (at district level) frequently the least experienced available operator.

**Pre-eclampsia/eclampsia — anaesthetic implications:**
- **Neuraxial anaesthesia is preferred** where coagulation status permits (check platelet count —
  significant thrombocytopenia is common in severe pre-eclampsia/HELLP and may gate the neuraxial
  option) — avoids the pressor response of laryngoscopy entirely, and spinal-induced
  hypotension is, somewhat counter-intuitively, often *less* pronounced in pre-eclampsia than in
  normotensive parturients (reduced plasma volume expansion and altered vascular reactivity), so
  the usual aggressive hypotension-prevention reflex is still applied but the magnitude of drop
  may differ.
- **If general anaesthesia is required, the pressor response to laryngoscopy is the central
  hazard** — an already-hypertensive patient (often with cerebral autoregulation shifted/impaired)
  can develop a severe hypertensive surge on intubation, risking intracranial haemorrhage/
  hypertensive encephalopathy/pulmonary oedema. Mitigation: pre-treat with agents to blunt the
  pressor response before laryngoscopy (options include short-acting opioids such as
  **alfentanil/remifentanil**, **labetalol**, **magnesium** itself — see below — or other agents
  per local availability and protocol), adequate depth of anaesthesia before instrumentation,
  and having anti-hypertensive treatment (e.g. labetalol, hydralazine) immediately available to
  treat a surge that does occur.
- **Magnesium sulphate interactions — a specific, high-yield anaesthetic hazard.** Magnesium,
  given for eclampsia seizure prophylaxis/treatment, **potentiates non-depolarising neuromuscular
  blockade** (reduces acetylcholine release presynaptically and reduces motor end-plate
  sensitivity) — a patient on a magnesium infusion who receives a standard dose of rocuronium/
  vecuronium can have a markedly prolonged and deeper block than expected, and neuromuscular
  monitoring (TOF) becomes especially important in this population to avoid extubating with
  unrecognised residual paralysis. Magnesium also potentiates the sedative/respiratory-depressant
  effects of other CNS depressants and can itself cause loss of deep tendon reflexes,
  respiratory depression, and cardiac conduction abnormalities at toxic levels — always cross-
  check magnesium level/clinical toxicity signs (reflexes, respiratory rate) in a
  slow-to-emerge or unexpectedly weak post-operative pre-eclamptic patient before assuming it is
  purely a residual-neuromuscular-blockade problem from the anaesthetic alone; the two causes
  compound each other.

---

### 2.10 Paediatric anaesthesia basics an intern must know

**Weight estimation** (where an actual weight is unavailable/unmeasurable in an emergency):
age-based formulas are a rough estimate only — always weigh the child if at all possible;
common teaching formula for children roughly 1–10 years: **weight (kg) ≈ (age in years + 4) × 2**
[EK, a widely taught APLS-style estimate — length-based tapes, where available, are more
accurate than age-based formulas and are preferred in a true emergency without a scale].

**Endotracheal tube sizing:**
- **Uncuffed tube internal diameter (mm) ≈ (age/4) + 4.**
- **Cuffed tube internal diameter (mm) ≈ (age/4) + 3.5** (a commonly used cuffed-tube formula;
  modern practice increasingly favours **cuffed tubes even in young children**, provided cuff
  pressure is monitored and kept low — **<20–25 cmH₂O** — since appropriately-sized, appropriately-
  inflated cuffed tubes are associated with comparably low complication rates to uncuffed tubes
  while offering a more reliable seal and reducing the number of laryngoscopy attempts needed to
  find the "right fit" by trial and error).
- **Always have the calculated size plus one size larger and one size smaller immediately
  available** — the formula is a starting estimate, not a guarantee, and airway anatomy varies.
- **Tube length (oral, cm at the lips) ≈ (age/2) + 12** as a rough estimate [EK], confirmed by
  auscultation/capnography and (where available) chest X-ray or direct visualisation of
  appropriate depth.

**Fluid management — the 4-2-1 rule** (maintenance fluid rate, mL/hr, by body weight):
- **First 10 kg: 4 mL/kg/hr.**
- **Next 10 kg (11–20 kg): + 2 mL/kg/hr** for each kg in this band.
- **Each kg thereafter (>20 kg): + 1 mL/kg/hr.**
- Worked example — a 25 kg child: (10×4) + (10×2) + (5×1) = 40 + 20 + 5 = **65 mL/hr**
  maintenance.
- This is a maintenance-rate formula; intra-operative fluid replacement also separately accounts
  for pre-operative fasting deficit, ongoing losses (blood loss, third-space losses from surgical
  exposure), and is individualised — the 4-2-1 rule is the starting reference point, not the
  whole intra-operative fluid plan.

**The child with a URTI — the decision an intern must make correctly.** One of the single most
common paediatric anaesthesia dilemmas: proceeding with anaesthesia (particularly airway
instrumentation) in a child with an active or recent upper respiratory tract infection
substantially raises the risk of **perioperative respiratory adverse events** — laryngospasm,
bronchospasm, oxygen desaturation, and severe coughing episodes — because airway hyper-reactivity
persists for weeks after even a mild URTI. Practical framework [EK, standard paediatric
anaesthesia teaching]:
- **Defer elective anaesthesia** for a child with: fever, purulent nasal discharge/productive
  cough, wheeze/lower-respiratory signs, lethargy/systemic illness, or a very recent onset
  (within days) of significant URTI symptoms — a commonly cited deferral window is **2–4 weeks**
  after resolution of significant symptoms.
- **A "simple cold"** — clear rhinorrhoea only, afebrile, well child, no chest signs, no systemic
  upset — is commonly allowed to proceed for minor, non-airway-heavy elective procedures at
  experienced clinical discretion, since children have URTIs frequently and indefinitely
  deferring every case would be impractical; the decision is individualised, not automatic either
  way.
- **Emergency surgery** proceeds regardless, with the elevated respiratory-event risk explicitly
  anticipated, managed by an experienced paediatric-capable anaesthetist wherever possible, with
  a lower threshold for senior/second-opinion input and heightened vigilance for laryngospasm
  (§2.3) through induction and emergence specifically.

---

### 2.11 Sedation outside theatre

**The sedation continuum — the core safety concept.** Sedation is not a set of discrete,
cleanly-separated categories but a continuous spectrum, and any patient can slip from a lighter
to a deeper level than intended regardless of the drug or dose used — which is why monitoring
requirements do not relax just because the intent was "light sedation."
- **Minimal sedation (anxiolysis):** responds normally to verbal commands, airway/ventilation/
  cardiovascular function unaffected.
- **Moderate sedation ("conscious sedation"):** purposeful response to verbal or light tactile
  stimulation, airway/spontaneous ventilation/cardiovascular function usually adequate without
  intervention.
- **Deep sedation:** purposeful response only to repeated or painful stimulation, airway
  intervention may be required, spontaneous ventilation may be inadequate.
- **General anaesthesia:** unarousable even to painful stimulation, airway intervention often
  required, spontaneous ventilation frequently inadequate, cardiovascular function may be
  impaired.
- **The danger of "just a little midazolam."** A small benzodiazepine dose given casually
  (without formal monitoring, without a plan, often by a non-anaesthetist proceduralist) is one
  of the commonest routes into an unrecognised deeper-than-intended sedation level — because
  benzodiazepines have a wide inter-patient variability in effect, potentiate opioids
  synergistically (a "small" dose of each, combined, can produce a much deeper level than either
  alone), and produce respiratory depression that is easy to miss without continuous, dedicated
  monitoring by a person whose only job is watching the patient (not also performing the
  procedure). Every sedation event — regardless of how "minor" the intended level — requires the
  monitoring minimums below and a clinician dedicated to the sedation/monitoring role.

**Monitoring minimums for any procedural sedation** (SASA-aligned, consistent with the SASA
adult/paediatric procedural sedation and analgesia guidelines) [EK for the specific bundled list,
cross-checked against the SASA monitoring-standard items independently confirmed in §4]:
continuous pulse oximetry, blood pressure monitoring (automated, regular intervals), continuous
clinical observation of ventilation (and capnography strongly recommended/increasingly regarded
as standard, particularly for moderate-to-deep sedation, since it detects apnoea/airway
obstruction before desaturation becomes apparent on pulse oximetry), ECG for patients with
cardiac risk factors or deeper sedation levels, a dedicated person monitoring the patient
throughout (not the proceduralist), resuscitation equipment and reversal agents (flumazenil,
naloxone) immediately available, and a formal recovery/discharge process before the patient
leaves the area.

**Ketamine for procedural sedation:**
- **IV:** **1–1.5 mg/kg**, slow push over 1–2 minutes, onset ~1 minute, effective dissociation
  typically **10–20 minutes**; supplemental doses of **~0.5 mg/kg** if needed.
- **IM:** **4–5 mg/kg**, onset ~2–5 minutes, effective duration **~15–30 minutes**; supplemental
  IM dose of **~2–4 mg/kg** after 10–15 minutes if needed. The IM route is particularly valuable
  where IV access is difficult (young children, combative/agitated patients) but carries a longer
  total recovery time and somewhat higher emergence-phase vomiting risk than IV dosing.
- **Ketamine's specific advantages** for procedural sedation in a resource-limited setting:
  preserves airway reflexes and spontaneous ventilation far better than opioid/benzodiazepine
  combinations at equivalent depth, preserves haemodynamic stability, and does not require the
  same depth of continuous airway vigilance as a propofol-based deep sedation — which is precisely
  why it is the favoured agent for minor-procedure sedation in settings with limited monitoring
  capacity/theatre access (§6). Still requires the monitoring minimums above; still carries
  emergence-reaction (vivid dreams/hallucinations, more common in adults than children, mitigated
  by a calm quiet recovery environment and sometimes a small benzodiazepine co-administered) and
  laryngospasm risk (uncommon but recognised, especially with airway stimulation during
  dissociation).

---

## 3. The normals — the anaesthetic chart

- **End-tidal CO₂ (EtCO₂):** normal target **4.5–6.0 kPa** (≈ **34–45 mmHg**), tracking arterial
  PaCO₂ closely in a healthy patient with normal V/Q matching (typical arterial-to-end-tidal
  gradient **~0.3–0.7 kPa / 2–5 mmHg** in a healthy lung; the gradient widens with V/Q mismatch —
  dead space from hypovolaemia/PE/high PEEP, or shunt — meaning EtCO₂ under-reads true PaCO₂ in
  a sicker lung, a key interpretation caveat, §4).
- **Airway pressures (mechanically ventilated, normal lungs):** peak inspiratory pressure
  typically **<20–25 cmH₂O**, plateau pressure **<30 cmH₂O** (higher plateau pressures signal
  reduced compliance and rising barotrauma/volutrauma risk — the same ARDS-protective ceiling
  logic used in ICU ventilation) [EK].
- **Expected mean arterial pressure (MAP) under anaesthesia:** a widely used working target is to
  keep MAP within **~20% of the patient's own pre-operative baseline** (rather than a fixed
  population number), since a "normal" absolute MAP may represent a dangerous relative drop in a
  chronically hypertensive patient, and a modestly low absolute MAP may be entirely normal for a
  young fit patient's own baseline [EK, widely taught individualised-target principle]; an
  absolute floor commonly cited as a general trigger for intervention regardless of baseline is
  **MAP <60–65 mmHg**, particularly where there is any concern for end-organ (cerebral, renal,
  cardiac) perfusion.
- **Train-of-four (TOF):** four supramaximal nerve stimuli 0.5 seconds apart; the ratio of the
  fourth twitch height to the first (**T4/T1**) quantifies neuromuscular block/recovery — a
  **TOF ratio ≥0.9** is the accepted threshold for safe extubation/adequate recovery of airway
  and respiratory muscle function (§2.7); qualitative "count of twitches" (e.g. 1–2 twitches vs
  4) grades deeper block but cannot itself confirm the ≥0.9 ratio needed at the recovery end of
  the spectrum — hence the push toward quantitative (not just visual/tactile) TOF monitoring
  where equipment allows.
- **BIS (bispectral index) concept:** a processed-EEG number (0 = isoelectric/deep coma, 100 =
  fully awake) used as a surrogate depth-of-anaesthesia monitor, particularly for TIVA (where
  there is no end-tidal volatile-agent concentration to reference) and in high-awareness-risk
  cases; a commonly cited target range for adequate general anaesthesia is roughly **40–60**
  [EK] — values persistently above this range raise awareness risk, values markedly below may
  reflect unnecessarily deep anaesthesia (with its own haemodynamic and recovery-time costs). Not
  universally available at district-hospital level in SA (§6).
- **Normal/expected blood loss allowances and maximum allowable blood loss (MABL):**
  **estimated blood volume ≈ 70 mL/kg (adult male), ≈ 65 mL/kg (adult female)** [EK]; **MABL =
  EBV × (starting Hct − lowest acceptable Hct) / starting Hct** — e.g. a 70 kg patient (EBV
  4900 mL) with a starting Hct of 40% and a lowest-acceptable Hct set at 25% has an MABL of
  4900 × (0.40−0.25)/0.40 ≈ **1837 mL** before transfusion is indicated on haematocrit grounds
  alone (clinical judgement — ongoing haemodynamic instability, rate of loss, and comorbidity all
  independently lower the practical transfusion trigger below the pure MABL calculation).

---

## 4. Cross-cutting interpretation

**Capnography waveforms — end-to-end.** The single most information-dense continuous monitor in
anaesthesia; reading the *shape*, not just the number, is what separates rote monitoring from
real vigilance.
- **Normal waveform:** a near-vertical inspiratory downstroke to baseline (zero, no CO₂ in fresh
  inspired gas), a flat baseline during the remainder of inspiration, a steep near-vertical
  expiratory upstroke, a near-flat alveolar plateau (the value read as EtCO₂ is the end of this
  plateau, just before the next inspiratory downstroke), then the downstroke of the next breath.
- **Obstruction (bronchospasm/kinked tube/partial obstruction):** the expiratory upstroke becomes
  slurred/sloping instead of near-vertical, and the alveolar plateau develops an upward slope
  rather than being flat — the classic **"shark-fin"** pattern — reflecting delayed, uneven
  alveolar emptying through narrowed airways.
- **Rebreathing:** the inspiratory baseline fails to return fully to zero (CO₂ is present at the
  start of the next inspiration) — suggests exhausted CO₂ absorbent (soda lime), a faulty
  expiratory valve, or excessive apparatus dead space.
- **Oesophageal intubation:** capnography is the definitive, immediate confirmatory test — a
  correctly-placed tracheal tube produces a sustained, repeating waveform; oesophageal placement
  produces either **no waveform at all**, or occasionally a few low, rapidly-decaying pseudo-
  waveforms from swallowed gastric gas that then disappear over a few breaths — any tube
  placement without a sustained, normal-appearing capnography trace over several consecutive
  breaths must be treated as oesophageal until proven otherwise, and re-laryngoscopy performed —
  auscultation alone is not sufficiently reliable to exclude oesophageal placement.
- **Sudden loss of the waveform (from a previously normal trace):** a short, high-acuity
  differential — **circuit disconnection** (commonest, check the whole circuit fast), **tube
  displacement/accidental extubation**, **complete airway obstruction**, **massive pulmonary
  embolism/air or amniotic fluid embolism** (sudden profound drop in pulmonary blood flow
  eliminates CO₂ delivery to the alveoli even with the airway and ventilator intact), or **cardiac
  arrest** (no pulmonary blood flow to carry CO₂ to the lungs regardless of ventilation) — the
  approach is the same fast systematic exclusion as DOPES (§2.6), starting with the circuit and
  tube before assuming a catastrophic embolic/arrest cause.
- **Gradually falling EtCO₂ trend (without sudden loss):** hyperventilation, falling cardiac
  output/hypotension (less CO₂ delivered to the lungs per unit time), developing hypothermia
  (reduced CO₂ production), or a slowly enlarging air leak.
- **Gradually rising EtCO₂ trend:** hypoventilation, rising temperature/sepsis/thyroid storm
  (increased CO₂ production), CO₂ insufflation absorption (laparoscopic surgery), soda-lime
  exhaustion, or — critically — the earliest sign of **malignant hyperthermia** (§2.6), which is
  why an unexplained rising EtCO₂ despite unchanged ventilation is never dismissed as "probably
  just the laparoscopy" without actively considering MH in the right trigger context.

**Intra-operative ABG interpretation** — largely the same systematic approach taught in medicine/
ICU (pH, primary disturbance, compensation, anion gap where relevant), applied with anaesthesia-
specific triggers: unexplained hypoxia (correlate with FiO₂/A-a gradient — is this a shunt,
V/Q mismatch, or a genuine oxygenation-delivery equipment problem), unexplained
metabolic acidosis intra-operatively (consider ongoing hypoperfusion/lactate from surgical
bleeding or a compromised limb/organ, tourniquet release washout, malignant hyperthermia,
or — rarely — a citrate/massive-transfusion-related derangement), and using serial gases as a
resuscitation-response test in the unstable case exactly as in ICU (§1 of the ICU dossier) — a
gas that fails to trend the expected direction after an intervention is itself diagnostic
information.

**Ventilator alarm differential — high pressure vs low pressure, the two poles to reason from:**
- **High-pressure alarm (obstruction to flow, or reduced compliance) — think "something is in
  the way, or the lung/chest is stiffer":** kinked or bitten tube, secretions/mucus plug,
  bronchospasm, endobronchial migration of the tube, breath-stacking/auto-PEEP, tension
  pneumothorax, worsening pulmonary oedema/ARDS, patient-ventilator dyssynchrony/coughing/
  straining (light anaesthesia, inadequate paralysis), surgical retraction/abdominal
  insufflation splinting the diaphragm, kinked circuit tubing.
- **Low-pressure / low-volume alarm (a leak, or loss of the delivery pathway) — think "gas isn't
  reaching or staying in the patient":** circuit disconnection (commonest and most urgent to
  exclude first), cuff leak or cuff rupture, accidental extubation, a loose/disconnected
  circuit component, an inadequately inflated cuff after a tube-position adjustment, or a
  significant leak around an uncuffed paediatric tube exceeding the expected/allowed leak.
- **The reasoning discipline:** an alarm is a symptom, not a diagnosis — always correlate the
  alarm with a direct look at the patient (chest movement, auscultation), the capnography
  waveform, and the SpO₂ trend before troubleshooting the machine in isolation; the fastest safe
  step when in doubt is to disconnect the circuit and hand-ventilate with a self-inflating bag
  connected directly to an oxygen source, which simultaneously treats the emergency (guaranteed
  oxygen delivery) and diagnoses it (a bag that is easy to squeeze suggests a leak/disconnection
  upstream; a bag that is very hard to squeeze suggests a genuine patient-side obstruction or
  pneumothorax, not a machine/circuit fault).

**Monitoring standards (SASA minimum monitoring)** — per the SASA Practice Guidelines, the
**essential** monitors required for the safe conduct of any general or major regional
anaesthetic are: **pulse oximetry** (SpO₂ with a plethysmographic waveform, not just a number),
**non-invasive blood pressure** (automated, appropriate cuff size range available), **ECG**
(3- or 5-lead), **capnography** (EtCO₂ value and waveform — mandatory for any general anaesthetic
with airway instrumentation, and increasingly regarded as standard for deep procedural sedation
too, §2.11), and **temperature monitoring** capability, with **adjustable alarm limits set and
active** on all of the above — a monitor displaying a number with its alarms silenced or
un-set defeats the purpose of having it. This bundle is the non-negotiable floor regardless of
case length or perceived triviality of the procedure — the "quick five-minute GA" is exactly the
case where corners get cut and exactly the case where a rare but catastrophic event (laryngospasm,
anaphylaxis, malignant hyperthermia trigger) has no monitored warning if the bundle is skipped.

---

## 5. Scores & structured tools

| Tool | Inputs | Interpretation / use |
|---|---|---|
| **ASA physical status** | Comorbidity burden, functional limitation, ± "E" for emergency | I–VI, risk-stratification and documentation standard (§2.1) |
| **Mallampati class** | Visibility of soft palate/uvula/fauces/pillars, mouth open, tongue out, sitting | I–IV; III/IV predicts difficult laryngoscopy (used with, not instead of, other airway predictors) |
| **Cormack-Lehane grade** | Direct laryngoscopic view achieved | **Grade 1** — full glottis visible; **Grade 2** — partial glottis/posterior cords only (2a — partially visible, 2b — only arytenoids visible); **Grade 3** — epiglottis visible, no glottic structures; **Grade 4** — no epiglottis or glottic structures visible. Grades 3/4 define a difficult laryngoscopy retrospectively and should be documented for future anaesthetics |
| **LEMON** | Look, Evaluate 3-3-2, Mallampati, Obstruction/obesity, Neck mobility | Bedside difficult-airway screening tool, esp. emergency/trauma settings (§2.1) |
| **Apfel score** | Female sex, non-smoker, PONV/motion-sickness history, planned post-op opioids | 0–4; drives PONV prophylaxis intensity (§2.7) |
| **Aldrete score** | Activity, respiration, circulation, consciousness, SpO₂ (0–2 each) | /10; ≥9 conventionally required for Phase I PACU discharge (§2.7) |
| **RSI checklist** | Full-stomach risk assessed → pre-oxygenation → induction/paralytic drawn up → cricoid (optional/situational) → drugs given together → no mask ventilation attempted (classically) until tube placement/cuff confirmed → capnography-confirmed placement | The procedural safety checklist for the full-stomach patient (§2.2) |
| **WHO Surgical Safety Checklist — anaesthetic items** | **Sign In** (before induction): patient identity/site/procedure confirmed, consent confirmed, site marked, anaesthesia machine and medication check complete, pulse oximeter on patient and functioning, known allergy reviewed, difficult airway/aspiration risk reviewed and equipment/assistance available if so, risk of >500 mL blood loss reviewed with IV access/fluids planned accordingly. **Time Out** (before incision): team introductions, critical steps/anticipated problems discussed. **Sign Out** (before leaving theatre): instrument/swab/needle counts, specimen labelling, equipment problems, recovery plan | Anaesthesia should only commence once Sign In is complete and any discrepancies resolved — this is a hard gate, not a formality (§2.6, §6) |
| **Difficult-airway alert documentation** | Grade of view achieved, technique/device that succeeded, number of attempts, any complication | Should be explicitly documented in the anaesthetic record and communicated to the patient/flagged prominently in the chart for any future anaesthetic — the single best predictor of future difficulty is a documented past one (§2.3) |
| **TOF ratio** | T4/T1 amplitude ratio on train-of-four stimulation | ≥0.9 = safe extubation threshold (§2.7, §3) |

---

## 6. SA-specific reality

**SASA practice guidelines — the monitoring and organisational floor.** The SASA Practice
Guidelines (most recently the 2022 consolidated revision, building on 2018/2012 editions) set out
the essential monitoring bundle (§4) and the organisational standards for anaesthesia services —
they are the practice benchmark against which a medico-legal case would be judged in South
Africa, regardless of the resource level at which the anaesthetic was actually given.

**The interns-doing-anaesthesia reality and its medico-legal frame.** South African interns
provide anaesthesia — including for caesarean section — at district-level hospitals as a
routine, structural feature of the health system, not an aberration. This is formally
acknowledged in HPCSA intern training requirements (a minimum period of supervised anaesthesia
training is built into the internship programme), but the practical reality at many district
sites is that **on-site specialist/diplomate supervision is not continuously available**, and the
intern or junior MO may be the most senior clinician physically present for an obstetric or
emergency general anaesthetic. HPCSA guidance is explicit that practitioners without full
anaesthetic qualification should ideally have direct supervision by a diplomate anaesthetist, or
in their absence work within a framework of clear escalation/telephonic support — the
**medico-legal exposure is real and not abstract**: a bad outcome from an anaesthetic given
outside one's scope of training, without documented attempts to escalate or seek supervision
where it was available, is judged against the same SASA-guideline standard of care regardless of
who was holding the laryngoscope. Practically, this means: know explicitly what you are, and are
not, trained/credentialed to attempt alone; document any telephonic consultation sought; and
treat "I am the only doctor in the hospital tonight" as a reason to be *more* rigorous about the
five-question mental model (§1) and the RSI/spinal/emergency drills, not a reason to skip steps
under time pressure.

**The district-hospital theatre — when to NOT start a case, and when to refer.** The single
highest-value decision a district-level anaesthetic provider makes is often made *before*
induction, not during the crisis: recognising a case that exceeds the safe envelope of the site's
resources, skills, and backup, and referring or delaying rather than proceeding. Triggers that
should prompt telephonic specialist consultation and/or referral **before** starting, where
time/clinical urgency allows:
- **Anticipated difficult airway** (multiple LEMON/Mallampati red flags, prior documented
  difficult intubation, stridor, airway pathology) in a case that is not immediately
  life-threatening if delayed for transfer/senior input.
- **Fixed cardiac output lesions** (severe aortic stenosis, HOCM, severe pulmonary hypertension)
  needing anything beyond minor/emergency surgery.
- **Complex multi-system compromise** where the induction physiological-reserve question (§1,
  §2.4) has no good answer with the drugs and monitoring actually available on site.
- **A crashing patient where the theatre lacks a specific rescue resource the anticipated crisis
  would need** (e.g. no blood products immediately available for a placenta praevia/accreta case
  with anticipated massive haemorrhage — see below).
- The corollary: **true category-1 obstetric/surgical emergencies** (cord prolapse, uncontrolled
  haemorrhage, ruptured ectopic in shock) generally cannot wait for transfer, and the correct
  action is to proceed with the safest available technique on site while activating retrieval/
  telephonic support in parallel, not to delay a lifesaving intervention chasing an unattainable
  ideal level of resourcing.

**The caesarean-section anaesthetic mortality signal in SA — NCCEMD Saving Mothers findings.**
The National Committee for Confidential Enquiries into Maternal Deaths has repeatedly identified
anaesthesia as a disproportionately *avoidable* contributor to maternal mortality relative to its
overall share of deaths, with a consistent pattern across successive triennial reports:
- Anaesthesia-related deaths have historically represented a small but persistent share of
  overall maternal deaths (cited around **2.5%** of all maternal deaths, and a larger proportion
  of deaths directly attributable to pregnancy complications, in earlier triennial analyses), and
  the **most recent (8th, 2020–2022) Saving Mothers report documented a rising trend in absolute
  numbers of anaesthetic deaths — 20 in 2020, 17 in 2021, rising to 39 in 2022** — with the
  report explicitly noting most of these deaths as clearly preventable.
- **Spinal anaesthesia accounted for the large majority (historically cited around
  ~79%) of anaesthesia-related deaths**, with **general anaesthesia** accounting for a smaller
  but disproportionately severe share (~17%, historically) — and critically, **roughly two-thirds
  of spinal-anaesthesia deaths were attributed to poor recognition/treatment of well-known,
  preventable complications: hypotension and high motor block**, not to rare or unforeseeable
  events — directly validating §2.5's emphasis on rigorous, reflexive hypotension prevention and
  treatment, and prompt recognition/resuscitation of a high/total spinal.
- **Difficult or failed intubation was identified as the most common specific cause of death
  following general anaesthesia** (cited in around half of GA-related obstetric deaths in
  historical analysis) — directly validating §2.3/§2.9's emphasis on the obstetric airway as an
  anticipated-difficult-airway scenario every time, and the preference for neuraxial technique
  wherever feasible specifically to avoid this exposure.
- **The majority of anaesthesia-related maternal deaths occurred at Level 1 (district) hospitals**
  (historically cited around **~70%**) — consistent with the pattern of least experienced
  provider, least backup, and highest acuity intersecting at exactly the site this dossier is
  written for.
- **A specific, sobering recent case pattern flagged in reporting**: inadvertent **intrathecal
  administration of tranexamic acid instead of bupivacaine** (look-alike ampoules, drug-error
  during spinal placement) has been documented as a cause of catastrophic/fatal neurological
  injury in recent SA case reports — a stark, concrete argument for deliberate drug-labelling and
  double-checking discipline (reading the ampoule aloud, checking against another clinician or a
  structured process where any second person is available) immediately before every neuraxial
  injection, not just before IV drugs.
- **The common theme across reports:** most anaesthesia-related maternal deaths are judged
  avoidable, and the recurring root cause identified is **practitioner inexperience/incompetence
  relative to the case**, not unavoidable disease severity — reinforcing that the single highest-
  leverage intervention is not a new drug or device but disciplined adherence to the
  fundamentals covered in §1, §2.2, §2.3, and §2.5: the five-question mental model, RSI
  discipline, block-to-T4 confirmation before incision, and immediate, adequately-dosed
  vasopressor treatment of spinal hypotension.

**EML theatre formulary at district level — what is actually in the cupboard.**
- **Induction agents:** **thiopentone has been formally discontinued from the South African
  market** (confirmed via the 2025 NEMLC review of the Adult Hospital Level STG/EML
  Anaesthesiology chapter); the current EML-listed alternatives for the indications thiopentone
  previously covered are **propofol**, **etomidate**, and **ketamine** — meaning any teaching
  material or older colleague's habits still defaulting to thiopentone are out of date, and
  **propofol** is now the default IV induction agent at most SA facilities where available, with
  **ketamine** (and to a lesser extent etomidate) as the go-to for the haemodynamically unstable
  patient (§2.4) and, distinctively, as the **procedural-sedation and even primary-anaesthesia
  workhorse at sites with limited theatre capacity/monitoring**, precisely because of its
  favourable haemodynamic and airway-reflex-preserving profile (§2.11).
- **Suxamethonium** — EML-listed, **1–1.5 mg/kg IV**, remains the default rapid-onset paralytic
  for RSI at most district sites (§2.2) — its short intrinsic duration is a genuine practical
  safety margin where sugammadex is not reliably stocked to rescue a rocuronium-paralysed
  difficult airway.
- **Bupivacaine (plain and hyperbaric 0.5%)** — the mainstay local anaesthetic for spinal
  anaesthesia (§2.5); availability of adjunct intrathecal opioids (fentanyl, preservative-free
  morphine) for multimodal spinal analgesia is **less consistent at district level** than the
  local anaesthetic itself — plan the block/post-op analgesia strategy around what is actually
  stocked, not an idealised full multimodal recipe.
- **Vasopressors for spinal hypotension** — **ephedrine** has traditionally been the more
  universally available bolus vasopressor at district level in SA; **phenylephrine** availability
  has improved but is **less consistently stocked** at every district site than ephedrine — know
  which agent(s) your specific pharmacy actually carries *before* the case, not when the
  patient is already hypotensive on the table, and default to whichever is available using the
  heart-rate-guided choice logic in §2.5 as a preference, not a rigid requirement that stalls
  treatment if the "preferred" agent is out of stock.
- **Ketamine as workhorse** — beyond induction and procedural sedation, ketamine's role as the
  practical, safe default for minor-procedure sedation in wards/outpatients at sites with **no
  theatre facility or very limited theatre time** is an explicit, named feature of SA
  district-level anaesthesia practice, not an off-label improvisation (§2.11).

**Blood availability constraints.** Blood product availability at district-hospital level in SA
is frequently limited to a small on-site stock (or none, requiring transport from a regional
blood bank) — this materially changes the risk calculus for any case with anticipated major
haemorrhage (placenta praevia/accreta, ruptured ectopic, major trauma): the maximum-allowable-
blood-loss calculation (§3) is not just an academic exercise at these sites, it is the number
that tells you how much runway you actually have before you are managing haemorrhagic shock
without the product to correct it, and it directly informs the referral-threshold decision above
— a case with a plausible massive-haemorrhage trajectory and no on-site blood stock is a strong
trigger to pre-emptively activate blood-bank transport/retrieval *before* the crisis, not after.

**The MH-box question at district level.** Dantrolene stock at district-hospital level in SA is
**inconsistent and cannot be assumed** — many smaller theatres do not hold a full, in-date MH
box with the recommended reserve of dantrolene vials, given its cost, short-to-moderate shelf
life, and the rarity of MH presentations at any single small site making stock rotation
logistically difficult [EK — this is a widely acknowledged resource gap in SA district-level
anaesthesia, consistent with the broader equipment/drug-availability pattern documented in the
district-hospital obstetric-anaesthesia literature cited above; the exact current stock-holding
rate was not independently machine-verified this session]. Practical implications: **know before
the case starts whether your site holds dantrolene and how much**; where suxamethonium and
volatile agents are the only paralytic/maintenance options available and dantrolene is not
stocked, the practical MH-mitigation strategy shifts toward **prevention and rapid recognition**
(favour a TIVA/ketamine-based technique over volatile agents in any patient with a personal or
family MH-suspicious history, maintain a low threshold to switch to TIVA and call for retrieval
at the first unexplained EtCO₂ rise) and **immediate telephonic activation of transfer to a
dantrolene-stocked facility** the moment MH is suspected, run in parallel with whatever
supportive cooling/hyperventilation/hyperkalaemia management can be started immediately on site
— do not wait for confirmation before beginning the transfer-activation call.

**HIV/TB precautions in airway management.** South Africa's high HIV and TB prevalence make
universal precautions during airway instrumentation (a genuine aerosol-generating and
secretion/blood-exposure-risk procedure) a routine, not exceptional, discipline: standard
precautions (gloves, eye protection/visor for laryngoscopy given secretion/blood splash risk,
careful sharps handling of laryngoscope blades and needles) on every airway, heightened
airborne/droplet precaution awareness (N95-equivalent respirator use where available, adequate
theatre ventilation, minimising unnecessary staff in the room) for any patient with known or
suspected active pulmonary TB requiring intubation, and normal universal-precaution vigilance
around any needle-based technique (spinal, IV access) given background seroprevalence —
practically, this means intubation/extubation of a patient with unexplained chronic cough,
weight loss, or known TB exposure history should trigger the same airborne-precaution reflex as
any other TB-suspicious aerosol-generating procedure, rather than treating it as a routine GA
until proven otherwise after the fact.

---

## Sources actually reached vs [EK]

**Fetched / grounded via web search this session:**
- **SASA Practice Guidelines** (2012/2018/2022 revisions, `sasaweb.com`/SAJAA) — located and
  cross-checked via search-result summaries for the essential minimum-monitoring bundle (pulse
  oximetry with plethysmogram, automated NIBP with cuff range, 3-/5-lead ECG, capnography with
  waveform, temperature probe with adjustable alarms) used in §4 and §6; the full consolidated
  PDF (`sasaweb.com/wp-content/uploads/2022/09/SASA-Practice-Guidelines-2022-Consolidated-
  Final.pdf`) returned HTTP 403 to direct WebFetch — monitoring-bundle content taken from the
  search-result summary rather than independently re-extracted from the primary PDF.
- **NCCEMD Saving Mothers reports** — the 5th report (2008–2010) anaesthesia chapter and the
  2011–2013 report analysis (via SAJAA/SciELO/PubMed summaries) grounded the historical figures
  in §6: anaesthesia ~2.5% of maternal deaths, spinal anaesthesia ~79% and general anaesthesia
  ~17% of anaesthesia-related deaths, ~two-thirds of spinal deaths from poorly-treated
  hypotension/high block, difficult/failed intubation in ~50% of GA-related deaths, ~70% of
  anaesthesia deaths at Level 1 hospitals. The **8th (2020–2022) Saving Mothers report**
  (`health.gov.za`, located via search) was confirmed via search-result summary for the rising
  absolute anaesthetic-death count (20 in 2020, 17 in 2021, 39 in 2022) and the tranexamic-
  acid-instead-of-bupivacaine intrathecal drug-error case pattern; the full PDF was not
  machine-read this session (search-summary-sourced, not independently re-verified against the
  primary document's page/table).
- **Adult Hospital Level STG & EML, Chapter 12 (Anaesthesiology and Intensive Care)**, including
  the **2025 NEMLC review** — confirmed via search-result summary that thiopentone has been
  discontinued from the SA market with propofol/etomidate/ketamine as the listed induction-agent
  alternatives, and suxamethonium 1–1.5 mg/kg as the EML-listed RSI paralytic dose. Direct
  WebFetch of the primary chapter PDFs (`health.gov.za/wp-content/uploads/2025/.../Adult-
  Hospital-Chapter-12...pdf` and the 2026-dated successor) returned HTTP 403 — content is
  search-summary-sourced, not independently re-extracted line-by-line from the primary chapter.
- **"Troubleshooting obstetric spinal anaesthesia at district hospital level"** (PMC9350542,
  SA-authored) — grounded, via search-result summary (direct WebFetch of the PMC page returned
  HTTP 403), the district-level phenylephrine 50–100 mcg / ephedrine 5–10 mg heart-rate-guided
  dosing, the ketamine ~10 mg IV titrated-bolus rescue for patchy/failing block, the statement
  that district-level anaesthesia is typically delivered by infrequent generalist practitioners
  with limited context-specific support, and the framing that up to half of SA anaesthetic
  deaths have been ascribed to untreated spinal hypotension — used throughout §2.5 and §6.
- **Difficult Airway Society (DAS) 2015 guidelines** for unanticipated difficult intubation
  (PMC4650961/BJA) — grounded via search-result summary for the Plan A/B/C/D sequential
  structure, the SGA-first Plan B rescue logic, and the emphasis on early declaration of
  difficulty; the full stepwise algorithm detail (exact attempt-number ceilings, videolaryngoscopy
  positioning within Plan A) reflects mainstream DAS-aligned teaching **[EK]** layered onto the
  confirmed structural framework, not a line-by-line re-extraction of the primary algorithm
  figure.
- **Malignant hyperthermia** — dantrolene 2.5 mg/kg initial IV dose repeated to a ~10 mg/kg
  cumulative ceiling, mortality figures (70–80% pre-dantrolene era, <5–10% contemporary with
  prompt treatment, ~30.8% vs ~9.6% mortality without/with dantrolene in a cited cohort) —
  grounded via StatPearls/MHAUS/BJA-summary search results.
- **ASRA local anaesthetic systemic toxicity (LAST)** management — the 1.5 mL/kg (or 100 mL)
  Intralipid 20% bolus, 0.25 mL/kg/min infusion, repeat-bolus/double-infusion-rate escalation,
  and ~12 mL/kg upper limit — grounded via PMC/StatPearls search-result summaries.
- **ASRA regional anaesthesia and antithrombotic therapy** neuraxial timing windows — prophylactic
  LMWH ≥12h before/≥12h after (catheter removal ≥4h before next dose), therapeutic LMWH ≥24h —
  grounded via NYSORA/guideline-summary search results; exact DOAC-specific windows (48–72h,
  renal-function-adjusted) reflect the general ASRA 4th/5th-edition framework **[EK]** rather than
  a fully re-extracted per-drug table.
- **Anaphylaxis under GA** — AAGBI/ANZAAG grading (Grade 1–5) and adrenaline dosing (AAGBI ~50 mcg
  IV titrated boluses; ANZAAG Grade 3 ~100 mcg IV) — grounded via BJA/NAP6/BSACI search-result
  summaries; tryptase-timing windows (immediate/~1h, ~4–6h, ~24h baseline) reflect standard
  anaphylaxis-investigation teaching **[EK]**, consistent with but not verbatim-quoted from a
  single primary guideline page.
- **Apfel PONV score** and risk-stratified prophylaxis ladder, and **Aldrete/modified-Aldrete PACU
  discharge score** (5 domains, 0–2 each, ≥9/10 discharge threshold) — grounded via MDCalc/
  Osmosis/PMC search-result summaries.
- **Paediatric ETT sizing formulas** ([age/4]+4 uncuffed, [age/4]+3.5 cuffed) and cuff-pressure
  ceiling (<20–25 cmH₂O) — grounded via Medscape/backtable/PMC search-result summaries; the
  4-2-1 maintenance-fluid rule itself was not returned by the same search and is carried as
  **[EK]** (universally standard paediatric teaching).
- **Sugammadex vs neostigmine reversal** — the dramatic TOF-ratio-≥0.9 recovery-time difference
  (sugammadex ~1.5–4.3 min vs neostigmine ~18.6–20.6 min in cited trials) and the neostigmine/
  glycopyrrolate ~50–70 mcg/kg maximal dosing ceiling — grounded via PMC/BJA/Cureus search-result
  summaries; the specific sugammadex 2/4/16 mg/kg dose-tiering by block depth is carried as
  **[EK]** (standard product-label/teaching figures, consistent with but not individually
  re-verified against every cited study).
- **Maximum allowable blood loss formula** and **estimated blood volume** (70 mL/kg male,
  65 mL/kg female) — grounded via OpenAnesthesia/ClinCaseQuest/mdcalc-summary search results.
- **Ketamine procedural sedation dosing** (IV 1–1.5 mg/kg, IM 4–5 mg/kg, with supplemental-dose
  figures) — grounded via LITFL/RCH/Merck-Manual search-result summaries.
- **Pre-eclampsia/magnesium-neuromuscular-blockade potentiation** and the pressor-response-to-
  laryngoscopy hazard — grounded via ScienceDirect (BJA Education "Pre-eclampsia and the
  anaesthetist")/PMC search-result summaries.
- **HPCSA intern/community-service anaesthesia scope and supervision expectations** — grounded via
  HPCSA intern-guidelines-page and related search-result summaries (minimum ~2-month supervised
  anaesthesia training, on-site-supervision expectation, CEO/Chief Medical Superintendent
  responsibility framework for interns); the precise current wording of the HPCSA scope-of-
  practice position was not independently re-extracted from a single primary HPCSA document this
  session.

**Attempted but blocked to automated fetch (HTTP 403 on direct WebFetch; relied on search-result
summaries and cross-referencing instead):** the primary SASA Practice Guidelines 2022 PDF; the
primary Adult Hospital Level STG/EML Chapter 12 (Anaesthesiology and Intensive Care) PDFs (2025
and 2026-dated versions); the primary 8th Saving Mothers (2020–2022) triennial report PDF; the
PMC9350542 district-hospital obstetric spinal anaesthesia troubleshooting article. Exact dose
tables, page/chapter citations, and any numeric figure not independently cross-checked above
should be verified against the primary document at implementation once machine-readable access is
available, consistent with the same caveat carried in the sibling ICU dossier.

**[EK] — established anaesthetic knowledge / standard texts** (not individually re-fetched this
session; used throughout and flagged inline where the point is numerically load-bearing): ASA
physical status class definitions I–VI plus "E"; Mallampati/thyromental-distance/mouth-opening/
neck-extension airway-exam thresholds and the LEMON mnemonic; METs-based functional-capacity
screening; elective-surgery deferral thresholds for uncontrolled hypertension, active URTI, and
poor glycaemic control; targeted (non-shotgun) pre-operative investigation selection; peri-
operative medication continuation/cessation rules for ACEi/ARB, beta-blockers, metformin, SGLT2
inhibitors (euglycaemic DKA mechanism), insulin, warfarin (INR ≤1.5 target), and antiplatelet
agents; the 6/2/4/8-hour fasting rule and the full-stomach exception list (labour, trauma,
obstruction, opioids, gastroparesis, pregnancy); rapid-sequence-induction technique including the
post-2015 shift away from rigid cricoid-pressure dogma; suxamethonium contraindications
(hyperkalaemia risk categories, MH susceptibility, suxamethonium apnoea, penetrating eye injury);
scalpel-bougie-tube cricothyroidotomy as the preferred emergency front-of-neck-access technique;
the laryngospasm management ladder including Larson's-point pressure; induction-agent choice and
dose reduction in the septic/hypovolaemic/fixed-cardiac-output patient, and ketamine's relative
haemodynamic-sparing pharmacology; spinal anaesthesia technique (L3/4–L4/5 level via the
intercristal/Tuffier's line, pencil-point needle preference, block assessment to T4 with Bromage
motor scoring), left-tilt/co-load spinal-hypotension prevention physiology, and high/total spinal
recognition and resuscitation-first management; post-dural-puncture headache diagnosis
(postural headache pattern), conservative management, and epidural blood patch technique/volume;
DOPES as a structured hypoxia differential; the intra-operative hypotension differential
(anaesthetic-drug effect, hypovolaemia, anaphylaxis, high spinal, obstructive causes, sepsis,
LAST, adrenal insufficiency); awareness-under-GA risk factors and mitigation; delayed-emergence
differential structure and TOF-ratio-based residual-paralysis assessment; capnography waveform
morphology (normal trace, obstructive "shark-fin," rebreathing, oesophageal-intubation absent
trace, sudden-loss differential, gradual trend interpretation); ventilator high-pressure vs
low-pressure alarm differentials; WHO Surgical Safety Checklist Sign In/Time Out/Sign Out item
content; multimodal post-operative analgesia ladder (paracetamol, NSAID, weak/strong opioids,
regional techniques) and the renally-cleared-active-metabolite opioid trap (morphine, tramadol,
codeine) in renal impairment; pregnancy physiology relevant to anaesthesia (airway oedema, reduced
FRC/faster desaturation, aortocaval compression, hypercoagulability); the paediatric weight-
estimation formula and the 4-2-1 maintenance-fluid rule; the paediatric URTI deferral framework;
the sedation continuum (minimal/moderate/deep sedation vs general anaesthesia) and its monitoring
implications; normal EtCO₂ (4.5–6.0 kPa) and the arterial-to-end-tidal gradient; normal/target
airway pressures and individualised (baseline-relative) MAP targets under anaesthesia; the BIS
depth-of-anaesthesia concept and its ~40–60 target range. Where a specific numeric threshold rests
on EK it reflects standard anaesthetic reference ranges/consensus (Oxford Handbook of Anaesthesia,
DAS/AAGBI/ASRA-aligned teaching, and widely-replicated anaesthetic pharmacology texts); the
current-edition SASA Practice Guidelines, the current Adult Hospital Level STG/EML Chapter 12, and
the most recent Saving Mothers report should be cited by exact page/table at implementation once
machine-readable access is available.
