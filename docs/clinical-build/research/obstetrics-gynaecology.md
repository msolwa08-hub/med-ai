# Obstetrics & Gynaecology — Consultant Depth Dossier

*Target reader: the intern/MO covering O&G — often solo on labour ward after hours, often at a
district hospital with no specialist physically on site, holding two patients' lives in every
decision on the pregnant one, and the MedAI engine standing behind them. This is the depth
reference, not a summary. It goes deeper than `docs/clinical-foundations.md` (O&G) — that page is
the breadth scaffold; this is the reasoning underneath it. O&G is MedAI's founding department —
the registry is already deep and has been hardened through a 6-agent evaluation
(`docs/clinical-build/eval/og/`) — this dossier consolidates and extends the reasoning behind that
content rather than duplicating the evaluation findings themselves.*

*Primary SA sources: **Guidelines for Maternity Care in South Africa** (National Department of
Health, the standing obstetric-practice reference for public-sector SA); **NCCEMD Saving Mothers**
triennial/annual reports (National Committee for Confidential Enquiries into Maternal Deaths) and
the associated **MPDSR** (Maternal and Perinatal Death Surveillance and Response) system;
**Adult Hospital Level Standard Treatment Guidelines & Essential Medicines List** (NDoH) O&G
chapter; **2023 ART Clinical Guidelines** (NDoH) for PMTCT/HIV-in-pregnancy; **Choice on
Termination of Pregnancy Act 92 of 1996** and its 2021 Clinical Guideline; **SASOG** (South
African Society of Obstetricians and Gynaecologists) practice guidelines (incl. Postpartum
Haemorrhage Guideline 3.0, 2024); **National STI Syndromic Management Guidelines**; **PPIP**
(Perinatal Problem Identification Programme). Global: **WHO** (antenatal care 2016 recommendations,
PPH 2023 consolidated guideline, the E-MOTIVE bundle), **RCOG Green-top Guidelines** (antepartum
haemorrhage, PPH, pre-eclampsia/eclampsia, ectopic pregnancy, VBAC, obstetric cholestasis, VTE in
pregnancy), **FIGO** (CTG consensus, cervical cancer staging, PPH), **NICE** (hypertension in
pregnancy, intrapartum care, CTG interpretation), standard obstetric/gynaecological texts
(Williams Obstetrics, Ten Teachers). Items resting on established knowledge rather than a directly
fetched primary source are marked **[EK]**. Full source ledger at the end.*

---

## 1. The O&G consultant's mental model

**Two patients, always — and they do not always want the same thing.** Every decision in
obstetrics is made for two physiologies simultaneously, and the central skill of the discipline is
holding both in view without collapsing the calculus into just one. A steroid course that helps the
fetus's lungs takes 24–48 hours the mother's severe pre-eclampsia may not have. A tocolytic that
buys the fetus time may worsen a mother's pulmonary oedema. An emergency hysterectomy that saves
the mother's life ends the pregnancy. Delivering early protects the mother from eclampsia but
exposes the fetus to prematurity. **The consultant's reflex is never "what is best for the
pregnancy" as an abstraction — it is "what does the mother need, what does the fetus need, and
where do those diverge, right now, at this gestation."** Gestational age is not a background fact,
it is a live variable that changes the correct answer to almost every question in the specialty:
the same blood pressure, the same bleeding, the same contraction pattern demands a different
response at 24 weeks than at 36 weeks than at term. A consultant reflexively converts every new
piece of information through the lens of "at this gestation, what does this mean, and does today's
gestation change my plan from yesterday's."

**The "is she pregnant?" reflex fires on every reproductive-age woman, every time, regardless of
the presenting complaint.** Pelvic pain, collapse, vomiting, abdominal pain of any kind, back pain,
shoulder-tip pain, syncope, anaemia, a "gastro" presentation — a β-hCG is drawn before the
differential is trusted, because the single most dangerous diagnosis hiding behind a vague
presentation in a woman of reproductive age is a ruptured ectopic pregnancy, and it kills by
haemorrhagic shock in minutes, not hours, if missed. This reflex is not paranoia; it is calibrated
to a disease that is common, rapidly fatal, and classically under-recognised because it mimics
gastroenteritis, appendicitis, a ruptured ovarian cyst, or "just period pain" until the patient
collapses. A menstrual history ("last period was normal, on time") does not exclude pregnancy —
implantation bleeding, a missed period misread as an early light period, and simple non-disclosure
all defeat a history-only screen. The test is a matter of seconds and near-zero cost; the miss is
a mortality event. This reflex is why every gynaecological algorithm in this dossier begins with
the same fork: pregnant, or not.

**The tempo of obstetric emergencies is measured in minutes, not hours.** A category-1 caesarean
section has a decision-to-delivery benchmark of **30 minutes**; a cord prolapse or acute fetal
bradycardia converts a ward-round problem into a running-down-the-corridor problem instantly; a
PPH can move a woman from talking to you to peri-arrest inside 10–15 minutes if the tone/trauma/
tissue/thrombin cause is not found and treated in parallel with resuscitation, not sequentially
after it. This tempo discipline is the single biggest cognitive shift a junior must make coming
from general medicine or surgery, where "review in an hour" is often a safe default — on labour
ward it frequently is not. The corollary is that obstetric teams over-call for early senior review
and over-prepare (crossmatch sent, theatre warned, second IV line in) *before* the crisis is
confirmed, because the cost of being wrong in the direction of "too cautious" is trivial compared
with the cost of being wrong in the direction of "too slow."

**What the O&G consultant is always secretly ruling out** [EK] — the specialty's own version of
internal medicine's list, re-run on every unwell pregnant, postpartum, or reproductive-age
patient:
- **The cause of a PPH by the 4 Ts** (Tone/Trauma/Tissue/Thrombin, §2.3) — worked through
  systematically and in parallel with resuscitation, never sequentially.
- **A concealed abruption** behind pain that seems out of proportion to visible bleeding, a woody-
  hard uterus, or unexplained fetal distress/decelerations — the bleeding you cannot see can be the
  bleeding that kills (§2.2).
- **A ruptured ectopic** behind any reproductive-age abdominal pain, collapse, or unexplained
  anaemia/hypotension (§2.8) — the single most time-critical gynaecological diagnosis.
- **Sepsis** in any unwell pregnant or postpartum woman — pregnancy and the puerperium blunt the
  classic signs (a "normal" heart rate for a non-pregnant adult may already be relatively
  tachycardic for late pregnancy's baseline, and a young previously fit woman can compensate
  hidden right up to sudden decompensation) (§2.6).
- **Pre-eclampsia** behind any third-trimester headache, epigastric pain, visual disturbance,
  oedema, or "just feeling unwell" — checked with a BP cuff and a urine dipstick before it is
  dismissed as reflux, tension headache, or normal pregnancy discomfort (§2.1).
- **Venous thromboembolism** — pregnancy is a hypercoagulable state by design (to limit
  peripartum bleeding), and VTE is a leading **direct** cause of maternal death in well-resourced
  settings and a significant, under-recognised contributor in SA; a swollen leg, unexplained
  dyspnoea, or pleuritic chest pain in a pregnant or recently-delivered woman is a PE work-up, not
  reassurance (§2.7).
- **HIV/TB as the invisible modifier of everything** — the single background condition most
  likely to change the differential, the drug interactions, and the mortality risk of any other
  O&G presentation in the South African population (§6).

**The obstetric consultation is a continuous risk re-stratification, not a one-off booking
decision.** A "low-risk" pregnancy at booking is a working label re-assessed at every contact —
new hypertension, new bleeding, reduced fetal movements, abnormal growth, a new medical diagnosis
all convert a low-risk pregnancy into a high-risk one instantly, and the referral tier (district →
regional → tertiary, §6) must move with that re-stratification, not lag behind it.

**The partogram/CTG/observation chart is read like an ECG — a trend, not a snapshot.** A single
blood pressure, a single CTG strip in isolation, a single fundal height measurement is data; the
trajectory across the antenatal course, across the labour, across the postnatal ward round is the
actual signal. A BP of 145/95 means one thing as an isolated reading and something very different
as the third rising reading in six hours. A CTG that has drifted from accelerating-and-reactive to
reduced-variability-and-decelerating over 40 minutes is the finding, not the most recent 10-cm
strip alone.

**Gynaecological cognition runs on a different but parallel discipline: age/menopausal status,
pregnancy status, and malignancy-until-excluded.** Once pregnancy is excluded, three questions
discipline every gynaecological presentation: *how old is this woman and what is her menopausal
status* (it re-weights every differential — postmenopausal bleeding is endometrial cancer until
proven otherwise, §2.10; a "cyst" in a postmenopausal woman carries different malignancy risk than
the same finding in a 25-year-old, §2.12); *could this be infective, and does it need syndromic
treatment now rather than awaiting a swab result* (§2.11); *am I looking at cancer, and have I
said so explicitly rather than hedged it into a vague "abnormal bleeding" plan* (§2.12).

**HIV changes the denominator of almost every gynae-oncology and infectious presentation in this
country.** Cervical cancer is the leading cause of cancer death in South African women and is an
AIDS-defining condition — a young woman with an unexpectedly advanced cervical lesion or with
recurrent/atypical genital infection deserves an HIV test as part of the same consultation, not a
separate referral (§2.12, §6).

**Tempo across the specialty, summarised:**
- *Immediate (minutes):* PPH, eclamptic fit, cord prolapse, acute fetal bradycardia, uterine
  rupture, ruptured ectopic, shoulder dystocia, massive APH.
- *Urgent (within the hour):* severe pre-eclampsia/impending eclampsia stabilisation and delivery
  planning, suspected chorioamnionitis, category-2 caesarean indications, ovarian torsion.
- *Same-day:* preterm labour assessment and steroid/tocolysis decision, PPROM assessment, PUL/
  ectopic work-up, suspected molar pregnancy.
- *Days–weeks:* GDM/hypertension surveillance and titration, antenatal risk re-stratification,
  postmenopausal bleeding investigation, contraception/family-planning consultation.
- *Months–the whole pregnancy:* the BANC-Plus antenatal schedule as a structured, front-loaded
  surveillance programme rather than a series of disconnected visits (§6).

**The South African maternal-mortality overlay is not background colour — it restructures the
differential.** A South African obstetric consultant's "always ruling out" list is shaped
specifically by the **NCCEMD Saving Mothers "big five"** causes of maternal death: non-pregnancy-
related infections (overwhelmingly HIV/TB), obstetric haemorrhage, hypertensive disease, pregnancy-
related sepsis (including septic miscarriage/unsafe abortion), and pre-existing medical/surgical
conditions (§6). This is why an SA-calibrated O&G differential keeps HIV/TB and sepsis
persistently higher in the list than a textbook written for a low-HIV-prevalence setting would
place them, and why "unsafe abortion" remains an active differential for a septic, bleeding
reproductive-age woman despite a liberal legal termination framework (§2.13, §6) — access barriers
mean the legal right to safe termination does not always translate into every woman reaching a
safe provider in time.

---

## 2. Presenting syndromes — worked to depth

> Format per syndrome: **Differential — three tiers** · **Discriminating history** ·
> **Discriminating examination** · **Investigations + interpretation nuance** · **Management
> anchors (SA Maternity Care Guidelines / STG-EML)** · **Consultant traps & pearls.**

### 2.1 Hypertensive disorders of pregnancy

**The end-to-end spectrum, and why the labels matter clinically, not just academically:**
- **Gestational hypertension:** new BP ≥140/90 mmHg after 20 weeks, **without** proteinuria or
  other features of pre-eclampsia. Roughly 15–25% progress to pre-eclampsia [EK] — this is a
  surveillance diagnosis, not a reassurance diagnosis.
- **Pre-eclampsia:** new hypertension after 20 weeks **plus** proteinuria (≥300 mg/24h, or
  protein:creatinine ratio ≥30 mg/mmol, or ≥2+ on dipstick as a screening trigger for formal
  quantification) **or**, in the absence of proteinuria, new hypertension plus any other feature
  of maternal organ dysfunction (thrombocytopenia, renal impairment, deranged liver function,
  pulmonary oedema, new neurological/visual symptoms) or uteroplacental dysfunction (fetal growth
  restriction) [EK, consistent with ISSHP/NICE/RCOG diagnostic frameworks and SA practice].
- **Pre-eclampsia with severe features:** BP ≥160/110 mmHg (the threshold at which antihypertensive
  treatment is mandatory, not optional, §below), **or** any of: severe/persistent headache
  unresponsive to simple analgesia, visual disturbance (scotomata, blurring, flashing lights),
  epigastric/right-upper-quadrant pain (hepatic capsule stretch), hyperreflexia/clonus, platelets
  <100 ×10⁹/L, AST/ALT markedly elevated, creatinine rising, pulmonary oedema, or HELLP features
  (below). Severe features change the plan from "monitor and consider timed delivery" to "stabilise
  and deliver," almost regardless of gestation once ≥34 weeks, and with a much lower threshold for
  delivery even preterm once severe features are present and uncontrolled.
- **Eclampsia:** a tonic-clonic seizure in a woman with pre-eclampsia (or, less commonly, as the
  first manifestation with no prior diagnosed hypertension) not attributable to another cause — an
  obstetric emergency managed exactly like any first seizure (airway, oxygen, left lateral
  position) **plus** magnesium sulphate (below) and expedited delivery once the mother is
  stabilised, delivery is not itself the treatment for the seizure, stabilisation is.
- **HELLP syndrome:** **H**aemolysis (schistocytes on smear, raised LDH, low haptoglobin, indirect
  bilirubin rise), **EL**evated **L**iver enzymes, **L**ow **P**latelets — a variant/complication of
  severe pre-eclampsia (can occur without prior hypertension being marked or even present in a
  minority) with its own classification (§5) and a substantial risk of hepatic haematoma/rupture,
  DIC, and placental abruption; it is a delivery indication in its own right once diagnosed at a
  viable gestation, generally regardless of platelet count trend, because the maternal organ
  trajectory — not the fetal one — is driving the decision.
- **Chronic hypertension with superimposed pre-eclampsia:** known hypertension pre-dating 20 weeks
  (or diagnosed before 20 weeks) **plus** new proteinuria, or a sudden worsening of previously
  controlled BP, or new organ dysfunction — the discriminator from "just chronic hypertension
  continuing into pregnancy" is the *new* finding, and this group carries a higher risk of adverse
  outcome than either chronic hypertension alone or pre-eclampsia alone, so the threshold for
  labelling superimposed pre-eclampsia should be low when any new feature appears.

**Discriminating history** — headache character and response to analgesia (a headache that does
not settle with paracetamol in a hypertensive pregnant woman is not a migraine until proven
otherwise); visual symptoms specifically asked about (patients under-report unless asked directly);
epigastric/RUQ pain (classically mistaken for reflux/gastritis — always check a BP and urine
dipstick in a third-trimester woman with new epigastric pain before treating it as heartburn);
swelling (physiological ankle oedema is near-universal in late pregnancy and a poor discriminator
alone — sudden facial/hand oedema or rapid weight gain is more specific); reduced fetal movements
(placental insufficiency); known chronic hypertension, renal disease, or prior pre-eclampsia
(strongest single risk factor for recurrence); antiphospholipid syndrome, diabetes, multiple
pregnancy, nulliparity, extremes of maternal age, obesity, and interpregnancy interval as background
risk modifiers; aspirin prophylaxis history (was it started, and was it before 16 weeks, §5).

**Discriminating examination** — BP measured properly (correct cuff size, seated/left-lateral,
repeat if elevated before acting on a single reading, but **not** delaying treatment for severe-range
readings pending a repeat); reflexes (hyperreflexia, clonus — sustained clonus ≥3 beats is a
red flag for imminent eclampsia); fundal palpation for tenderness (co-existing abruption); urine
dipstick as the bedside screen with formal quantification (protein:creatinine ratio) to confirm;
peripheral/sacral oedema, pulmonary crepitations (pulmonary oedema — a feared complication,
often iatrogenic from over-aggressive fluid administration in a woman with third-spacing and low
oncotic pressure — fluid restriction is a deliberate management choice, not an oversight, §below);
fundal height/growth assessment (uteroplacental insufficiency, fetal growth restriction);
epigastric/RUQ tenderness on palpation.

**Investigations & interpretation nuance** — FBC (platelets — trend, not single value; a falling
platelet count even within the "normal" range is data); U&E and creatinine (**a creatinine in
pregnancy that would be "normal" outside pregnancy is already abnormal** — pregnancy's ~50% rise
in GFR means the normal pregnancy creatinine ceiling is lower, roughly **<70–77 µmol/L** [EK,
consistent with standard obstetric-physiology teaching], so a creatinine of 85–90 µmol/L that would
be unremarkable in a non-pregnant adult already signals renal involvement in a pregnant one — this
is one of the most consequential and most commonly missed interpretation traps in the whole
specialty, §4); urate (raised in pre-eclampsia, though a non-specific and imperfect marker, still
used as supportive evidence and a rough severity/timing correlate [EK]); LFTs (AST/ALT — HELLP);
LDH and peripheral smear for schistocytes/haemolysis; urine protein:creatinine ratio or 24-hour
collection; coagulation screen if HELLP/abruption suspected (§4's DIC screen); fetal surveillance
— CTG, growth scan, umbilical artery Doppler (raised resistance/absent or reversed end-diastolic
flow signals placental insufficiency and materially changes delivery timing); consider a formal
angiogenic marker (sFlt-1:PlGF ratio) where available for risk stratification, particularly in
equivocal presentations — a low ratio has strong short-term negative predictive value for
progression to severe pre-eclampsia [EK, consistent with PROGNOSIS/PELICAN-derived international
guidance]; this test is not universally available at SA public-sector level and clinical criteria
remain the primary diagnostic tool.

**Magnesium sulphate — the regimen, the monitoring, the antidote.** MgSO₄ is given for **eclampsia
treatment and recurrent-seizure prevention**, and for **seizure prophylaxis in severe pre-
eclampsia** (not for BP control — it does not reliably lower BP and is not an antihypertensive).
- **Loading dose:** **4 g IV over 15–20 minutes** [EK, consistent with the Zuspan-derived regimen
  widely used in SA practice and confirmed in this app's own hardened content, `eval/og/3-
  consultant.md`], with an IM loading component used in some regimens (the Pritchard regimen adds
  10 g IM — 5 g deep IM into each buttock — at the same time, historically favoured where IV
  infusion pumps/monitoring are less reliable) [EK].
- **Maintenance:** **1 g/hour IV infusion**, continued through labour/delivery and for **24 hours
  post-delivery or post-last-seizure**, whichever is later.
- **Toxicity is a clinical diagnosis first, a level second — never wait for a serum level before
  acting on the clinical triad.** Monitor **hourly**: respiratory rate (**<12/min** is the trigger
  to stop and reassess before the next dose), deep tendon (patellar) reflexes (**loss of reflexes**
  is an earlier, more sensitive sign than respiratory depression and should stop the infusion on
  its own), and urine output (**<25 mL/hour**, or <100 mL/4h — Mg is renally cleared, and oliguria
  is both a toxicity risk factor and a sign to reduce/hold the dose, §4 for the renal-vasoconstriction
  nuance in PET that makes fluid-challenging this oliguria the wrong move). Approximate serum
  toxicity bands [EK, standard teaching, consistent with `eval/og` hardened content]: therapeutic
  range roughly **2–4 mmol/L**; loss of patellar reflexes around **~3.5–5 mmol/L**; respiratory
  depression around **~5–6.5 mmol/L**; cardiac arrest risk from **~7.5 mmol/L** upward.
- **The antidote: calcium gluconate 1 g IV (10 mL of 10% solution) given over 10 minutes**, kept
  physically at the bedside of every patient on a MgSO₄ infusion, given immediately on clinical
  toxicity **without waiting for a confirmatory serum level** — the level takes too long to return
  relative to the deterioration curve.
- **Renal impairment demands a reduced maintenance dose** (commonly halved, e.g. 0.5 g/hour) and
  closer monitoring, because clearance is reduced and toxicity accumulates faster — a patient with
  pre-eclamptic AKI on standard-dose MgSO₄ is a recognised, preventable toxicity trap.
- **Recurrent seizure on MgSO₄:** a further bolus (commonly **2 g IV over 3–5 minutes**) is given
  [EK] before considering an alternative anticonvulsant (e.g. a benzodiazepine or phenytoin) if
  seizures persist despite adequate magnesium.

**Antihypertensive management — the choice and the doses.** Treatment is **mandatory once BP
reaches severe range (≥160/110 mmHg)** — this is not a threshold to "keep an eye on," it is an
emergency-treatment trigger, because uncontrolled severe hypertension is the direct mechanism of
maternal stroke, the most immediately lethal complication of the hypertensive disorders. **First-
line acute agents** [EK, consistent with SA practice and this app's hardened content]:
**labetalol** — IV, titrated in escalating doses (e.g. 20 mg, then 40 mg, then 80 mg at ~10-minute
intervals if BP remains severe, to a cumulative ceiling commonly cited around 300 mg) [EK]; oral
labetalol also used where IV access/monitoring is limited. **Nifedipine** (oral, immediate-release)
as an effective alternative or first-line where IV labetalol is not available or contraindicated
(e.g. significant bradycardia/asthma limiting labetalol) — given as repeat oral doses (commonly
10 mg, repeated) [EK] — **never given sublingually/crushed for a faster effect**, a well-documented
practice associated with precipitous, dangerous drops in BP and uteroplacental perfusion.
**Hydralazine** IV (e.g. 5 mg boluses) as a further alternative, historically first-line in many SA
protocols, with a recognised tendency to cause a sharper BP drop and reflex tachycardia, requiring
close monitoring. **The target is ~140–160/90–110 mmHg, not normotension** — over-aggressive
lowering below this range risks compromising uteroplacental perfusion, which is already
precarious in pre-eclampsia; "don't overshoot" is an explicit, named consultant caution, not an
implicit assumption. **Methyldopa** is the standard **oral maintenance** agent for ongoing,
non-emergency BP control antenatally in SA practice (safety profile in pregnancy, long track
record) [EK]; **nifedipine MR** and **labetalol** oral are also used for maintenance.
**ACE-inhibitors and ARBs are contraindicated throughout pregnancy** (fetotoxic — oligohydramnios,
renal dysgenesis, skull ossification defects, particularly in the second/third trimester) and are
a standing teratogen-safety-net item (§6, and the exact gap this app's own evaluation identified —
`eval/og/3-consultant.md` and `4-superspecialist.md` — in the deterministic backstop not being
armed for pregnant patients).

**The delivery decision.** Definitive treatment for pre-eclampsia is delivery of the placenta —
every other intervention (antihypertensives, MgSO₄, fluid management) is stabilisation, not cure.
The decision balances gestational age against severity: **severe features at ≥34 weeks** —
deliver, do not delay for steroid completion (the maternal/fetal risk of continuing an uncontrolled
severe pre-eclampsia outweighs the marginal respiratory benefit of finishing a steroid course at
this gestation) [EK, consistent with RCOG/international consensus]. **Severe features <34 weeks** —
a genuine balancing act managed expectantly only in a controlled, monitored setting with senior
input, aiming to complete a steroid course (24–48 hours, §2.4) where maternal and fetal status
allows, but abandoning expectant management immediately if either deteriorates (uncontrollable
BP, eclampsia, HELLP, abruption, non-reassuring fetal surveillance, pulmonary oedema, deteriorating
renal/hepatic function). **Gestational hypertension or pre-eclampsia without severe features** —
surveillance and timed delivery, generally by 37 weeks, without the same urgency.

**The eclamptic fit — the acute sequence.** Call for help immediately; protect the airway
(left lateral position, do not restrain the convulsion, do not force anything into the mouth);
high-flow oxygen; IV access; **MgSO₄ loading dose as above** (the seizure itself is usually
self-limiting within 1–2 minutes and MgSO₄ is for preventing recurrence, not for terminating the
convulsion in progress, though it remains the correct immediate treatment); control severe
hypertension once the airway is secure; continuous fetal monitoring once the mother is stable
(the fetus often shows a transient bradycardia/reduced-variability pattern during and immediately
after the seizure that recovers with maternal stabilisation — this is not, by itself, an
indication for an immediate crash delivery before the mother is stabilised); delivery is planned
once the mother is stabilised, by the most appropriate route for the clinical picture, not
reflexively by emergency caesarean.

**Consultant traps & pearls**
- Treating "just" oedema and a slightly raised BP as normal-pregnancy discomfort without a urine
  dipstick is the single most common missed early pre-eclampsia in a busy antenatal clinic.
- A pregnancy-adjusted creatinine reading (§4) that looks "normal" by non-pregnant standards can
  already represent significant renal involvement — always interpret against pregnancy ranges.
- Fluid-challenging pre-eclamptic oliguria on the assumption it is hypovolaemia is a classic and
  dangerous error — these kidneys are typically vasoconstricted, not volume-depleted, and
  aggressive fluids risk precipitating pulmonary oedema (§4); fluid restriction (commonly
  ≤80–85 mL/hour total input) is a deliberate strategy in severe pre-eclampsia with oliguria, not
  neglect.
- MgSO₄ toxicity monitoring is a bedside clinical discipline (RR, reflexes, urine output, hourly)
  — do not wait for a laboratory magnesium level to act on a clinically toxic patient; the
  calcium gluconate antidote sits at the bedside for exactly this reason.
- A "lower" blood pressure reading in a severely pre-eclamptic/HELLP patient is not automatically
  reassuring — it can represent evolving hepatic/renal/haematological deterioration (falling
  cardiac output, hepatic haematoma) rather than improving disease; read the whole trend and the
  other organ systems, not the BP number alone (this exact nuance is what this app's hardened
  ward-round-delta output on a MgSO₄-toxicity trajectory case was specifically praised for
  catching, `eval/og/4-superspecialist.md`).
- Ergometrine (and any ergot alkaloid) is **contraindicated** in hypertensive disease/pre-
  eclampsia for postpartum haemorrhage management (§2.3) — a well-known, high-stakes cross-syndrome
  trap that must be checked every time a hypertensive woman bleeds postpartum.
- Nifedipine given sublingually "for speed" is a recognised precipitant of dangerous hypotension
  and uteroplacental hypoperfusion — oral swallowing, not sublingual/crushed administration, is the
  correct route.

---

### 2.2 Antepartum haemorrhage (APH)

**Definition and the rule that governs the first minute of every case.** APH is bleeding from the
genital tract from 24 weeks' gestation (or the locally-defined viability threshold) until delivery.
**No digital vaginal examination is performed until placenta praevia has been excluded by
ultrasound** — a digital exam into a praevia can provoke catastrophic haemorrhage by disrupting
the placental edge over the internal os. A gentle sterile speculum examination (to inspect for
local causes and quantify visible bleeding) is acceptable once major praevia is reasonably excluded
or while awaiting the scan in a stable patient, but the digital exam is withheld until placental
location is known. This single rule is one of the most consequential "always/never" statements in
the whole discipline and is a recurring point of junior error under time pressure.

**Differential**
- *Common:* placenta praevia; placental abruption; "show"/cervical mucus plug bleeding at term;
  local causes — cervical ectropion, cervicitis, cervical polyp, vaginitis; heavy bloody show at
  the onset of labour.
- *Must-not-miss:* placental abruption with concealed haemorrhage (below); vasa praevia (below) —
  rare but near-100%-fatal to the fetus within minutes if missed at membrane rupture; uterine
  rupture (typically labour-associated, on a scarred uterus, §2.5); placenta accreta spectrum
  bleeding at attempted delivery of a praevia; a bleeding disorder/coagulopathy unmasked by
  pregnancy.
- *Zebras:* cervical cancer presenting with bleeding in pregnancy (a cervix should still be visually
  inspected at speculum exam, not assumed benign because the patient is pregnant); trauma
  (including undisclosed intimate-partner violence — ask directly and privately); uterine
  arteriovenous malformation.

**Placenta praevia vs abruption vs vasa praevia — the discriminators:**
- **Placenta praevia:** classically **painless**, bright-red bleeding, often recurrent and
  increasing in volume with successive episodes, uterus soft and non-tender, fetal heart typically
  normal (the bleeding is maternal, from the placental bed, not fetal), presenting part often high/
  malpositioned (the low placenta prevents engagement) — diagnosed and graded by ultrasound
  (placental edge-to-internal-os distance: **≥20 mm = low-lying, not praevia**; edge within 20 mm
  but not covering = minor/marginal praevia; **covering the os = major praevia**, this app's
  hardened content, `eval/og/4-superspecialist.md`). A praevia diagnosed on a routine mid-trimester
  scan often resolves by term as the lower segment develops ("placental migration") — re-scan in
  the third trimester before finalising the delivery plan rather than acting on an early-pregnancy
  finding alone.
- **Placental abruption:** classically **painful**, often continuous constant pain, bleeding may be
  visible (revealed) or **entirely concealed** behind the placenta with no visible loss at all
  despite a large, life-threatening haemorrhage; **uterus woody-hard and tender on palpation**
  (a highly specific sign); fetal heart abnormal or absent if the abruption is significant; risk
  factors include hypertensive disease/pre-eclampsia, trauma (including abdominal trauma and
  intimate-partner violence), smoking, cocaine/methamphetamine use, previous abruption, polyhydramnios
  with rapid decompression (e.g. at amniotomy), multiple pregnancy. **The concealed abruption is the
  trap:** a patient can be in profound, evolving hypovolaemic shock with a tense, painful, but
  visually "dry" abdomen and no external bleeding at all — clinical suspicion (pain, uterine
  tenderness/tone, fetal distress, maternal tachycardia/hypotension disproportionate to visible
  loss) must override the reassurance of "there's no blood."
- **Vasa praevia:** fetal (not maternal) blood vessels run unsupported through the membranes near
  or over the internal os (velamentous cord insertion, or a succenturiate lobe with connecting
  vessels) — bleeding classically occurs **at rupture of membranes** (spontaneous or artificial),
  is **small in volume but rapidly fetal-exsanguinating** because the vessels are fetal, and is
  classically accompanied by **acute fetal bradycardia or a sinusoidal CTG pattern out of
  proportion to the visible blood loss**. An **Apt test** (differentiates fetal from maternal
  haemoglobin in blood, based on alkali resistance of fetal Hb) can support the diagnosis if time
  allows, but in a bradycardic fetus with membrane rupture and bleeding, this is a crash caesarean,
  not a laboratory-confirmation exercise. Antenatal diagnosis by Doppler ultrasound (where velamentous
  cord insertion or low-lying vessels are identified) allows a planned elective caesarean before
  labour, which is the safest route to prevent this catastrophe entirely.
- **Local causes:** identified on speculum exam (cervical ectropion, polyp, cervicitis) — generally
  reassuring for both mother and fetus once confirmed, but praevia/abruption must still be actively
  excluded first, not assumed absent because a local cause is visible.

**The concealed abruption and the couvelaire uterus.** In severe abruption, blood tracks into the
myometrium itself, producing a **Couvelaire uterus** — a bruised, blood-infiltrated uterine wall,
seen at caesarean section, that can impair the uterus's ability to contract effectively afterward
(a contributor to subsequent atonic PPH, §2.3) and is sometimes visible as a discoloured, mottled
serosal surface. Severe abruption is also a leading obstetric trigger of **disseminated
intravascular coagulation** (§4) via massive tissue-factor/thromboplastin release from the disrupted
placental bed — a coagulation screen is mandatory in any suspected moderate-severe abruption, not
just a crossmatch.

**Discriminating history** — pain (present/absent, character, constant vs intermittent), volume and
colour of bleeding, precipitant (trauma, coitus, exertion), recurrence pattern, gestational age,
known placental location from prior scans, risk factors as above (hypertension, smoking, substance
use, prior abruption/praevia/caesarean), fetal movements, contraction pattern.

**Discriminating examination** — vital signs first, and interpreted against the caveat that a
young, previously fit pregnant woman can maintain a deceptively normal BP/HR through significant
concealed blood loss before decompensating suddenly (physiological reserve masking early shock) —
do not be falsely reassured by normal vitals alone if the clinical story fits abruption; abdominal
palpation for uterine tone/tenderness and fundal height (a rapidly enlarging fundal height can
signal a large concealed haemorrhage); fetal heart auscultation/CTG; **no digital vaginal exam
until praevia excluded**; gentle speculum exam once safe to visualise the cervix and quantify loss
and identify local causes; assessment for signs of trauma/IPV.

**Investigations & interpretation nuance** — FBC (baseline Hb, though acute haemorrhage may not
yet show a fall — trend and clinical picture matter more than a single early Hb); group and
crossmatch (urgent, appropriate units for the clinical severity); coagulation screen and fibrinogen
specifically (fibrinogen falls early and disproportionately in obstetric haemorrhage/DIC and is a
more sensitive early marker than PT/APTT alone, §4); Kleihauer-Betke test in any Rh-negative woman
with APH to quantify fetomaternal haemorrhage and guide anti-D dosing (below); ultrasound for
placental location (praevia) — **ultrasound is poor at diagnosing abruption directly** (a
retroplacental clot may not be visible, especially acutely) and a normal scan does **not** exclude
abruption — the diagnosis of abruption remains primarily clinical; CTG for fetal wellbeing;
consider a formal DIC screen (§4) in any moderate-severe abruption.

**Management** — maternal resuscitation first (large-bore IV access ×2, crossmatched blood as
indicated, do not wait for a falling Hb to transfuse a clinically shocked patient); continuous fetal
monitoring; category of delivery driven by maternal and fetal status — a major bleed with fetal
compromise is a category-1 caesarean regardless of gestation once viable; a stable minor
praevia bleed at preterm gestation may be managed expectantly with steroids given and delivery
timed electively; **vaginal delivery is contraindicated with major praevia** (obstructs the birth
canal and bleeds catastrophically with any cervical change) but may be reasonable with a minor/
low-lying placenta at a safe distance from the os and no other contraindication; abruption with a
live, non-compromised fetus at term and favourable cervix may proceed to vaginal delivery under
close monitoring, but any fetal compromise or maternal instability moves immediately to caesarean;
recurrent/major bleeding admits the mother for observation regardless of the immediate plan.

**The anti-D question.** Every Rh-negative, non-sensitised woman with any APH event receives
**anti-D immunoglobulin** (routine dose commonly **1500 IU / 300 µg** IM [EK], SA public-sector
practice may use this as a standard dose regardless of gestation for a sensitising event) **within
72 hours** of the bleeding episode, in addition to (not instead of) the routine antenatal
prophylactic dosing schedule (§6). A **Kleihauer-Betke test** quantifies the fetomaternal
haemorrhage volume; where it indicates a haemorrhage **>4 mL** of fetal blood, an additional/higher
anti-D dose is required (dosed proportionally to the estimated volume) [EK]. This is not a one-off
administrative step — recurrent APH episodes each independently require anti-D coverage, and
missing a dose on an earlier, seemingly-minor bleed is a preventable cause of later sensitisation
and, in a subsequent pregnancy, haemolytic disease of the fetus/newborn.

**Consultant traps & pearls**
- Doing a digital vaginal exam before the placental location is known is a "never" — it has caused
  fatal haemorrhage in a praevia and remains a recurring teaching case precisely because it seems
  intuitive ("just check how dilated she is") under pressure.
- A concealed abruption with normal-looking external bleeding (or none at all) but a tense, painful,
  woody uterus and fetal distress is the pattern that gets missed by anchoring on "there's not much
  blood, so it can't be that bad."
- A normal ultrasound does not exclude abruption — it is a clinical diagnosis; do not be falsely
  reassured by "the scan was fine."
- Vasa praevia bleeding at membrane rupture with fetal bradycardia is a crash caesarean — do not
  wait for confirmatory testing while the fetus exsanguinates.
- Every APH episode in an Rh-negative woman needs its own anti-D dose — recurrent bleeds are
  recurrent sensitising events, not one continuous episode covered by a single dose.
- Reassuring maternal vital signs early in a concealed haemorrhage reflect physiological reserve,
  not the absence of significant blood loss — trend the observations and treat the clinical
  picture, not a single "normal" set of vitals.

---

### 2.3 Postpartum haemorrhage (PPH)

**Definition and severity thresholds.** PPH is blood loss **≥500 mL** after vaginal delivery or
**≥1000 mL** after caesarean section within 24 hours of delivery (primary PPH); **secondary PPH**
is excessive bleeding from 24 hours to 6 weeks postpartum (classically from retained products or
endometritis, §2.6). **Severe PPH** is generally defined as **≥1000 mL** (or any PPH with signs of
haemodynamic compromise) [EK, WHO/RCOG-consistent]. **Visual estimation of blood loss is
notoriously and consistently inaccurate — it systematically under-estimates**, which is precisely
why structured, objective assessment (calibrated drapes, weighing swabs, the WHO/E-MOTIVE
"first response at 500 mL" trigger below) rather than a clinician's visual impression is the
current best-practice standard [EK, consistent with WHO 2023 PPH guideline and the E-MOTIVE
trial].

**The recognition-lag trap — the single most dangerous feature of PPH cognition.** A previously
healthy, plethoric pregnant woman has a large physiological blood volume reserve (§3) and can
compensate — maintaining a near-normal blood pressure — through a surprisingly large volume of
blood loss before decompensating suddenly and steeply. **Waiting for the blood pressure to fall
before escalating is a fatal delay pattern.** The consultant discipline is to act on the *volume
lost and the trend*, not to wait for hypotension as confirmation — by the time BP falls, the
patient may already be in a severe, hard-to-reverse deficit. This is why current best practice
(the WHO/E-MOTIVE bundle) triggers the full "first response" bundle at **500 mL**, well before any
haemodynamic compromise would be expected, rather than waiting for the older, higher action
thresholds.

**Differential by the 4 Ts** — this is simultaneously the differential and the systematic
diagnostic/treatment framework, worked through **in parallel**, not sequentially, while
resuscitation runs:
- **Tone (~70% of PPH, by far the most common):** uterine atony — an over-distended uterus
  (macrosomia, polyhydramnios, multiple pregnancy), prolonged labour, precipitate labour,
  chorioamnionitis, grand multiparity, fibroids distorting contractility, a Couvelaire uterus post-
  abruption, previous PPH, general anaesthesia (uterine-relaxant effect of volatile agents).
- **Trauma (~20%):** genital tract lacerations (cervical, vaginal, perineal), episiotomy extension,
  uterine rupture (especially on a scarred uterus), uterine inversion (a dramatic, immediately
  recognisable and independently life-threatening cause — the fundus inverts through the cervix,
  often with profound vagal-mediated hypotension out of proportion to blood loss — manual
  replacement is emergency treatment, do **not** remove the placenta first if still attached, and
  uterotonics are **withheld** until the uterus is repositioned since a contracted inverted uterus
  is harder to replace).
- **Tissue (~10%):** retained placenta or placental fragments, retained membranes, placenta
  accreta spectrum preventing normal separation.
- **Thrombin (rare but the one that defeats a purely mechanical approach):** pre-existing or acquired
  coagulopathy — severe pre-eclampsia/HELLP, abruption-associated DIC, amniotic fluid embolism,
  sepsis-associated coagulopathy, anticoagulant therapy, inherited bleeding disorders (von
  Willebrand disease is not rare and is a recognised, under-diagnosed contributor to unexpectedly
  heavy PPH in a woman with no prior obstetric bleeding history) — suspected when bleeding
  continues despite a well-contracted uterus, no identified trauma, and no retained tissue, or when
  blood fails to clot at the bedside ("clot observation test") or oozes diffusely from venepuncture/
  IV sites.

**Discriminating history/context** — mode of delivery, labour duration and augmentation, known risk
factors (grand multiparity, macrosomia, polyhydramnios, multiple pregnancy, prior PPH, fibroids,
chorioamnionitis, pre-eclampsia/HELLP, placenta praevia/accreta risk, anticoagulant use, known
bleeding disorder), whether the placenta was delivered complete on inspection, timing of onset
relative to delivery (immediate atony/trauma vs delayed retained tissue/coagulopathy).

**Discriminating examination — done systematically and fast, in parallel with calling for help and
starting resuscitation:** **uterine tone** first (a soft, boggy, poorly contracted fundus = atony —
bimanual uterine massage/compression is both diagnostic and immediately therapeutic); **inspect for
trauma** — full genital tract inspection including cervix and vaginal walls with adequate lighting/
assistance (a well-contracted uterus with ongoing bleeding means look for trauma, not more
uterotonics); **inspect the placenta** for completeness (missing cotyledons/membranes = retained
tissue, examine or explore the uterine cavity); **look for evidence of coagulopathy** (oozing from
venepuncture sites, failure of blood to clot in a plain tube at the bedside within ~5–10 minutes —
a rapid, low-tech bedside coagulopathy screen when formal coagulation results are not yet back).

**Investigations** — FBC, coagulation screen and **fibrinogen** (the single most useful and most
sensitive early lab marker of evolving obstetric coagulopathy — falls early and disproportionately,
§4), group and crossmatch/activate massive transfusion protocol as indicated, U&E, lactate/venous
gas as a marker of tissue hypoperfusion, Kleihauer if Rh-negative and any suspicion of associated
antepartum event; these run in parallel with, never in place of, immediate clinical management.

**The stepwise escalation — medical → mechanical → surgical, with SA uterotonic doses** [EK,
consistent with this app's hardened content, `eval/og/3-consultant.md` and `4-superspecialist.md`,
and WHO/SASOG PPH guidance]:
1. **Call for help immediately**, activate the PPH protocol/emergency team, two large-bore IV
   lines, send bloods, start warmed crystalloid, catheterise the bladder (a full bladder impairs
   uterine contraction — emptying it is itself therapeutic), bimanual uterine massage.
2. **Uterotonic ladder:**
   - **Oxytocin** — first-line: an IV bolus/infusion (commonly **10–20 IU IM/IV**, or an infusion
     of **40 IU in 500 mL** crystalloid run at a rate titrated to uterine tone) [EK].
   - **Ergometrine 0.2–0.5 mg IM** (or as syntometrine combined with oxytocin) — second-line —
     **contraindicated in hypertension/pre-eclampsia** (risk of a severe hypertensive crisis/
     stroke — this exact interaction is one this app's own evaluation specifically confirmed the
     AI catches correctly and confirmed the deterministic safety net does **not** currently catch,
     `eval/og/3-consultant.md` finding #2 — a live, named gap).
   - **Misoprostol** — where injectable uterotonics/cold chain are unavailable or as an adjunct,
     commonly **800 µg per rectum** (or 400–600 µg sublingual/oral in other protocols) [EK,
     consistent with this app's hardened content and WHO guidance].
   - **Carboprost (15-methyl PGF2α)** — third-line, **250 µg IM**, repeated every **15 minutes** to
     a maximum of **8 doses** [EK] — **contraindicated in asthma** (bronchoconstriction) and used
     with caution in cardiac/hypertensive disease.
   - **Tranexamic acid 1 g IV**, given **as early as possible and within 3 hours** of PPH onset,
     alongside (not instead of) uterotonics, per the WOMAN-trial evidence base and current WHO/
     SASOG standard — **repeated once (a further 1 g)** if bleeding continues or recurs within
     24 hours of the first dose [EK, WOMAN trial/WHO 2023 consolidated PPH guideline]. This app's
     own evaluation flagged **TXA omission** from the flagship PPH case as a completeness gap
     (`eval/og/3-consultant.md`) — it belongs in the first-response bundle alongside uterotonics,
     not as an afterthought.
3. **Mechanical:** uterine balloon tamponade (e.g. a Bakri balloon or an improvised condom-catheter
   balloon in resource-limited settings) once medical management has not controlled atonic bleeding
   — buys time and can be definitive; external aortic compression as a bridging manoeuvre while
   organising theatre/transfer.
4. **Surgical escalation ladder** (in approximate ascending order of invasiveness, chosen per the
   clinical picture and fertility wishes where feasible): examination under anaesthesia with
   evacuation of retained products/repair of trauma; uterine compression sutures (e.g. B-Lynch);
   stepwise uterine devascularisation (uterine artery ligation, then utero-ovarian ligation,
   progressing to internal iliac artery ligation where the skill/setting allows); **hysterectomy**
   as the definitive, life-saving last resort when the above fail or bleeding is catastrophic and
   uncontrolled — this decision should not be delayed by repeated attempts at lesser measures once
   it is clear the patient is exsanguinating; a delayed hysterectomy performed too late is a
   recurring, preventable theme in maternal death reviews.
5. **Massive transfusion protocol** — activated on clinical judgement (ongoing bleeding with
   haemodynamic instability, or an anticipated requirement) rather than waiting for a specific lab
   trigger; a **1:1:1 ratio of red cells:FFP:platelets** is the broadly accepted resuscitation
   ratio in massive obstetric haemorrhage [EK, consistent with major-haemorrhage-protocol
   consensus]; **fibrinogen replacement (cryoprecipitate or fibrinogen concentrate)** specifically
   targeted, since obstetric haemorrhage causes disproportionate early fibrinogen depletion (§4);
   calcium replacement with large-volume citrated blood product transfusion (citrate chelates
   calcium and can precipitate hypocalcaemia-driven cardiac dysfunction if not corrected);
   maintain normothermia (a cold, coagulopathic, acidotic patient is progressively harder to
   resuscitate — the "lethal triad").

**Consultant traps & pearls**
- Repeating uterotonic doses on a genuinely atonic uterus while bleeding continues, rather than
  escalating to mechanical/surgical measures on a clear timeline, is a recognised cause of delay —
  set an explicit time/dose ceiling for medical management before moving on.
- Giving ergometrine to a hypertensive or pre-eclamptic woman is a well-known, specifically
  examinable trap — always check the BP/hypertension history before selecting the second-line
  uterotonic.
- A well-contracted uterus with ongoing bleeding is not atony — stop repeating uterotonics and
  look systematically for trauma, retained tissue, or coagulopathy instead.
- TXA belongs in the first-response bundle, given early (within 3 hours), not reserved for
  refractory bleeding.
- Visual estimation of blood loss under-estimates volume — use objective measurement where
  possible and trust the trend of vital signs/clinical deterioration over a "it doesn't look that
  bad" impression.
- Delaying hysterectomy through repeated lesser measures once uncontrolled catastrophic bleeding is
  evident is a recurring theme in confidential enquiries into maternal death — decisiveness saves
  lives here.
- Uterine inversion is a distinct emergency with its own sequence (replace the uterus before
  removing an attached placenta, withhold uterotonics until repositioned) — do not manage it as
  "just atony with unusually severe shock."

---

### 2.4 Preterm labour and PPROM

**Differential of preterm contractions/preterm labour**
- *Common:* idiopathic preterm labour (the majority, no identifiable single cause); Braxton-Hicks/
  false labour without cervical change; urinary tract infection presenting with lower abdominal
  discomfort mistaken for contractions.
- *Must-not-miss:* chorioamnionitis driving the labour (treat the infection, do not simply tocolyse
  it, below); placental abruption presenting with pain and irritability rather than obvious
  bleeding; PPROM with or without infection; cervical incompetence/insufficiency (painless dilation,
  classically presenting later than "labour" with advanced dilation or membranes visible/bulging).
- *Zebras:* uterine anomaly (septate/bicornuate uterus) predisposing to preterm labour;
  asymptomatic bacteriuria/pyelonephritis as the occult driver; abdominal trauma; cervical
  malignancy with an irritable, contracting uterus.

**Discriminating history/exam** — contraction frequency/regularity, cervical change on serial exam
(the diagnostic requirement — contractions alone without cervical change are not preterm labour by
definition), fluid loss (clear, offensive, blood-stained — PPROM), fever/malodorous discharge
(chorioamnionitis), fetal movements, risk factors (previous preterm birth — the strongest single
predictor, multiple pregnancy, uterine anomaly, cervical surgery/short cervix, infection,
polyhydramnios, smoking/substance use, low BMI, short interpregnancy interval).

**PPROM diagnosis** — history of a gush or continuous trickle of fluid is often sufficient; sterile
speculum exam looking for pooling of fluid in the posterior fornix (avoid digital exam unless
labour is advanced/imminent delivery, to reduce infection risk and because it adds little once
membrane rupture is visually confirmed); a pH test (amniotic fluid is alkaline, vaginal secretions
acidic) or a dedicated bedside biomarker test (e.g. IGFBP-1 or PAMG-1-based tests) where equivocal;
ultrasound for liquor volume as supportive (not diagnostic) evidence.

**Tocolysis — indications, agents, and the explicit contraindications.** The purpose of tocolysis is
**never** to prevent delivery indefinitely — it is to buy **48 hours** to complete a course of
antenatal corticosteroids (and, where indicated, magnesium neuroprotection, below), and generally
is not used beyond that window or beyond ~34 weeks where the marginal benefit is low. **First-line
agent: nifedipine** (oral, calcium-channel blocker) — effective, cheap, and does not require IV
access/monitoring [EK, consistent with SA/international practice]. Alternatives where nifedipine is
contraindicated/unavailable include a beta-agonist (with the caveat of maternal cardiovascular side
effects — tachycardia, pulmonary oedema risk, particularly in multiple pregnancy or with
co-administered steroids) [EK]. **Tocolysis is contraindicated** in: chorioamnionitis/suspected
intrauterine infection (treat the sepsis and expedite delivery, do not suppress labour that may be
the body's appropriate response to infection); severe pre-eclampsia/eclampsia; significant APH/
abruption; non-reassuring fetal status where delivery is indicated regardless; advanced labour
(cervix already significantly dilated) where tocolysis is unlikely to succeed and delays
appropriate preparation for delivery; intrauterine fetal death; a lethal fetal anomaly.

**Antenatal corticosteroids — the window and the doses.** Given to accelerate fetal lung maturity
(surfactant production) and reduce neonatal respiratory distress syndrome, intraventricular
haemorrhage, and neonatal mortality. **Indicated from 24 weeks to 34 weeks (some protocols extend
to 34+6 or later in specific circumstances)** where preterm delivery is anticipated within 7 days.
**Betamethasone 12 mg IM, two doses 24 hours apart**, or **dexamethasone 6 mg IM, four doses 12
hours apart** — both regimens are used, dexamethasone is the more widely EML-available agent in
many SA settings [EK, consistent with this app's hardened content, `eval/og/3-consultant.md`]. A
single "rescue" repeat course may be considered if the original course was given more than 1–2
weeks earlier and delivery within the next 7 days again seems likely, but repeated/multiple courses
are avoided given evidence of adverse effects on fetal growth/neurodevelopment with excessive
exposure [EK].

**Magnesium sulphate for fetal neuroprotection — a distinct indication from the pre-eclampsia
regimen, and the specific nuance this app's own evaluation flagged as a named omission
(`eval/og/4-superspecialist.md`, finding #4).** Where **delivery before 32 weeks (some protocols
extend to <30 or up to 34 weeks) is imminent or planned within a short window**, magnesium sulphate
is given specifically to reduce the risk of cerebral palsy and neurological impairment in the
surviving preterm infant — a separate indication and (in some protocols) a separate, shorter
regimen from the eclampsia-prophylaxis dosing, but commonly delivered using the same loading-and-
maintenance structure and the same toxicity-monitoring discipline (§2.1) where local protocol
aligns them. This indication is easy to omit because the reflex association of "MgSO₄" is
pre-eclampsia — a preterm labour/PPROM patient at <32–34 weeks with no hypertension at all should
still prompt this consideration.

**GBS (Group B Streptococcus).** SA practice (like most of the world outside universal-culture-
screening settings) uses a **risk-factor-based approach rather than universal antenatal culture
screening** [EK] — intrapartum antibiotic prophylaxis is offered where GBS status is unknown **and**
a risk factor is present: preterm labour/PPROM, prolonged rupture of membranes (**≥18 hours**),
intrapartum fever, or a previous baby with invasive GBS disease; known GBS bacteriuria in the
current pregnancy or a prior GBS-affected infant are indications regardless of other risk factors.
**Intrapartum prophylaxis: IV benzylpenicillin (loading dose, e.g. 3 g, then a maintenance dose,
e.g. 1.5 g, 4-hourly until delivery)**, or **ampicillin** as an alternative, or **clindamycin/
erythromycin-based regimens for penicillin allergy** (with the caveat that clindamycin resistance
is a growing concern where susceptibility testing is not available) [EK].

**Latency antibiotics in PPROM and the chorioamnionitis decision.** In confirmed PPROM without
chorioamnionitis, a course of **latency antibiotics** (commonly **erythromycin**, e.g. 250 mg
6-hourly for up to 10 days or until delivery) is given to prolong the latency period and reduce
infectious morbidity [EK, ORACLE-trial-derived]. **Co-amoxiclav (amoxicillin-clavulanate) is
specifically avoided** in this context — the ORACLE trial identified an association with **neonatal
necrotising enterocolitis**, and this specific avoidance is a named, tested nuance this app's own
hardened content gets right (`eval/og/3-consultant.md`, `4-superspecialist.md`). **No digital vaginal
examination** is performed in PPROM management unless labour is established/imminent delivery is
being assessed, to minimise ascending infection risk. **The chorioamnionitis decision** is the pivot
point of PPROM management: maternal fever, uterine tenderness, offensive liquor, fetal tachycardia,
and/or a rising maternal white cell count/CRP shift management from "expectant, buy time for
steroids" to "this is now sepsis, tocolysis is contraindicated, deliver expeditiously regardless of
gestation and start broad-spectrum maternal antibiotics" (§2.6) — the single most consequential
branch point in preterm/PPROM management, and one that must be actively reassessed at every review,
not just at first presentation.

**Consultant traps & pearls**
- Tocolysing a patient with unrecognised chorioamnionitis suppresses the labour that may be
  protecting the mother from ascending sepsis — always screen for infection before or alongside
  starting tocolysis.
- MgSO₄ neuroprotection is easy to forget outside the pre-eclampsia context — check gestational age
  against the neuroprotection window on every preterm labour/PPROM case independent of BP.
- Co-amoxiclav in PPROM is a specifically-taught "never" because of the NEC association — reach for
  erythromycin instead.
- Steroids are a 24–48-hour investment, not an instant fix — factor the completion window into the
  delivery-timing decision, but never at the cost of delaying delivery for a deteriorating mother or
  fetus.
- Repeated, multiple courses of antenatal corticosteroids are avoided given growth/
  neurodevelopmental concerns with cumulative exposure — a single rescue course only, and only if
  the original course is temporally distant and delivery is again imminent.

---

### 2.5 Labour and its complications

**The partogram end-to-end.** The partogram is the structured, graphical record of labour progress
that converts "how is labour going" from an impression into a trackable trend. Cervical dilatation
is plotted against time from the point active labour is established (conventionally **4 cm** with
regular contractions in many SA protocols, though some frameworks now start active-phase plotting
later, at 5–6 cm, reflecting revised understanding of normal early labour progress — use the
locally-adopted convention). **The alert line** is drawn from the point of established active
labour at an expected rate of **~1 cm/hour**; **the action line** is drawn **4 hours to the right**
of the alert line. Crossing the alert line prompts closer review/senior involvement and considers
predisposing factors (inadequate contractions, malposition, cephalopelvic disproportion); crossing
the **action line** is the trigger for active intervention — augmentation (if contractions are
inadequate and no contraindication), or reassessment for **cephalopelvic disproportion/obstructed
labour** and a move toward operative delivery, particularly in a setting where prolonged obstructed
labour carries serious maternal risk (uterine rupture, obstetric fistula from prolonged pressure
necrosis — a still-relevant risk in under-resourced settings with delayed access to caesarean
section). The partogram also tracks fetal heart rate, contraction frequency/duration, liquor colour,
moulding/caput, maternal vital signs, and urine output/ketones — a single missed or unplotted
parameter for several hours is itself a red flag for inadequate monitoring, independent of what the
values eventually show.

**Fetal distress interpretation — CTG categories.** The systematic reading framework (the mnemonic
**DR C BRAVADO**: **D**efine **R**isk, **C**ontractions, **B**aseline **R**ate, **V**ariability,
**A**ccelerations, **D**ecelerations, **O**verall impression) [EK] structures every CTG read.
**Baseline rate:** normal **110–160 bpm**; tachycardia (>160 bpm, sustained) suggests maternal
fever/chorioamnionitis, fetal hypoxia (compensatory early), fetal anaemia, or maternal drugs
(salbutamol/beta-agonists); bradycardia (<110 bpm, sustained) suggests hypoxia, fetal heart block,
or maternal hypotension/local anaesthetic effect. **Variability:** normal **5–25 bpm**; reduced
variability (<5 bpm, sustained beyond an expected fetal sleep cycle of ~20–40 min) is concerning for
hypoxia or can reflect fetal sleep, prematurity, or maternal sedative/opioid administration —
context matters; a markedly increased/saltatory pattern (>25 bpm) can itself be an abnormal,
unstable pattern. **Accelerations:** reassuring when present (≥15 bpm above baseline for ≥15
seconds), their absence alone in an otherwise normal trace is not necessarily abnormal. **Decelerations:**
**early decelerations** (shallow, mirror the contraction, due to head compression) are benign;
**variable decelerations** (variable in shape/timing relative to contractions, from cord
compression) are the most common intrapartum pattern — non-repetitive, shallow, quickly-recovering
variables are usually benign, but **repetitive, deep (>60 bpm drop), slow-to-recover variable
decelerations** are concerning; **late decelerations** (onset after the contraction peak, gradual
return to baseline after the contraction ends) reflect uteroplacental insufficiency and are
**pathological, especially if repetitive**; **prolonged decelerations** (>3 minutes) are concerning,
and a deceleration lasting **beyond 5–10 minutes without recovery ("acute bradycardia")** is an
obstetric emergency requiring immediate action (position change, stop oxytocin, treat maternal
hypotension, consider tocolysis of hyperstimulation, and prepare for immediate delivery if no rapid
recovery). **Three-tier classification (NICE/FIGO-aligned):** **Normal/reassuring** — no
non-reassuring or abnormal features; **Suspicious/non-reassuring** — one non-reassuring feature,
managed with conservative measures and closer surveillance; **Pathological/abnormal** — two or more
non-reassuring features, or any single abnormal feature (e.g. repetitive late decelerations,
bradycardia, absent variability) — this classification drives escalation, from conservative
intrauterine-resuscitation measures (maternal repositioning, IV fluids, stopping oxytocin,
correcting maternal hypotension, tocolysis of uterine hyperstimulation, oxygen) through to expedited
delivery by the fastest safe route.

**Cord prolapse.** The umbilical cord descends below/alongside the presenting part after membrane
rupture, at risk of compression between the presenting part and the pelvis, cutting off fetal
circulation. Risk factors: malpresentation (breech, transverse lie), polyhydramnios, prematurity,
multiparity, artificial rupture of membranes with a high presenting part. **The immediate action:
the examining hand stays in the vagina, physically elevating the presenting part off the cord**,
continuously, while help is called and the patient is repositioned into knee-chest or steep
Trendelenburg (head-down) position to use gravity to relieve pressure; the bladder may be rapidly
filled (retrograde, via a catheter) as an additional technique to elevate the presenting part off
the cord where transfer/theatre access takes time; tocolysis may be considered to reduce contraction-
driven compression while arranging delivery; **immediate category-1 caesarean section** is the
definitive management unless vaginal delivery is imminent and rapidly achievable (e.g. fully
dilated with the head low) — the hand does not come out until the baby is delivered or the
obstetric team physically takes over at the point of surgical/vaginal delivery.

**Shoulder dystocia — HELPERR, and the drills.** Shoulder dystocia is the impaction of the fetal
anterior shoulder against the maternal symphysis pubis after delivery of the head, an unpredictable
obstetric emergency (risk factors — macrosomia, maternal diabetes, prior shoulder dystocia,
prolonged second stage, instrumental delivery — increase probability but do not reliably predict
individual cases, and it occurs in normal-weight infants too). **HELPERR** [EK, standard obstetric
emergency-drill mnemonic]: **H**elp (call for senior obstetric, neonatal, and anaesthetic help
immediately); **E**valuate for episiotomy (creates space for internal manoeuvres, does not itself
relieve the bony impaction); **L**egs (McRoberts manoeuvre — hyperflexion of the maternal hips onto
the abdomen, which rotates the pelvis and often resolves the dystocia alone); suprapubic
**P**ressure (applied by an assistant, aiming to adduct/rotate the anterior shoulder from behind the
pubic symphysis — distinct from and never combined with fundal pressure, which worsens impaction
and risks uterine rupture); **E**nter manoeuvres (internal rotational manoeuvres — e.g. Rubin's or
Wood's screw — to rotate the shoulders into an oblique diameter); **R**emove the posterior arm
(deliberately deliver the posterior arm first to reduce the effective shoulder diameter); **R**oll
the patient onto all fours (the Gaskin manoeuvre — a change of maternal position that can itself
resolve the impaction, sometimes used earlier in the sequence rather than strictly last, per local
drill order). **Do not** apply fundal pressure (worsens impaction, risk of rupture) and avoid
excessive traction on the fetal head (associated with brachial plexus injury — Erb's palsy).
Regular, structured simulation drills for this specific emergency are a recognised, evidence-based
patient-safety intervention precisely because the emergency is rare-per-clinician but
time-critical and outcome-sensitive.

**Uterine rupture.** Most commonly occurs on a **previous caesarean section scar** during a trial
of labour (VBAC, §6/§2.7's caesarean-audit context), though it can occur in an unscarred uterus
(rare, associated with obstructed labour, grand multiparity, injudicious oxytocin use, or
uterotonic misuse in a district setting without close monitoring). **Presentation:** sudden severe
abdominal pain (sometimes with a preceding period of scar tenderness/reduced ability to palpate
contractions), acute fetal bradycardia/distress (often the first and most reliable sign),
cessation of previously effective contractions, loss of station of the presenting part on vaginal
exam (the fetus recedes as it moves into the abdominal cavity through the rupture), vaginal
bleeding (may be minimal if bleeding is predominantly intraperitoneal), maternal tachycardia/
hypotension evolving to shock. **Management:** immediate resuscitation and **category-1 caesarean/
laparotomy** — repair vs hysterectomy decided intraoperatively based on the extent of damage and
the patient's fertility wishes/haemodynamic stability.

**Retained placenta.** Failure of placental delivery within the locally-defined interval
(commonly ~30 minutes actively managed, longer if physiological management) — risk factors include
prior retained placenta, preterm delivery, uterine anomaly, and placenta accreta spectrum (a
placenta that will not separate at all despite active management should raise this possibility,
particularly with prior caesarean section and an anterior low placenta, §2.2). Management:
controlled cord traction with counter-pressure (active management) first; if unsuccessful, manual
removal of placenta under adequate analgesia/anaesthesia (with prophylactic antibiotic cover given
the instrumentation of the uterine cavity), with heightened suspicion for and preparedness for
accreta-spectrum bleeding if the placenta will not cleave from the uterine wall at all — this
scenario can convert rapidly into a massive-haemorrhage/peripartum-hysterectomy emergency and
should prompt senior involvement before forceful attempts at removal.

**The difficult decisions in obstructed labour at district level.** A district hospital without an
on-site specialist and with variable overnight theatre/blood-bank capacity faces a genuinely
different risk calculus than a tertiary centre: the decision to attempt a trial of labour, to
transfer a labouring woman with a scarred uterus or a borderline pelvis, or to proceed to caesarean
section earlier and more readily than a tertiary protocol might suggest, is shaped by what can
actually be delivered safely, in time, at that facility (§6). Recognising early that a labour is
unlikely to progress safely and initiating transfer **before** obstruction is advanced (rather than
after fetal distress or rupture has already occurred) is a core district-level obstetric skill —
the "transfer-in-labour decision" is as much about anticipation as about crisis response.

**Consultant traps & pearls**
- Crossing the action line on the partogram without a documented plan is a recurring failure mode —
  the action line demands a decision, not just an observation.
- Fundal pressure in shoulder dystocia worsens the problem and risks uterine rupture — this is a
  specific, examinable "never."
- A "small" amount of vaginal bleeding does not exclude uterine rupture — intraperitoneal bleeding
  can dominate with minimal external loss; fetal bradycardia and loss of station are the more
  reliable signals.
- A retained placenta that resists all attempts at separation should raise accreta-spectrum
  suspicion before escalating force — call for senior help rather than persisting with traction.
- Recognising impending obstruction early enough to transfer safely, rather than after
  decompensation, is the single highest-yield district-level obstetric judgement call.

---



