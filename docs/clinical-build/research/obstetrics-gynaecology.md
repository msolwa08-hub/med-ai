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

### 2.6 Sepsis in pregnancy and the puerperium

**Why obstetric sepsis is its own discipline, not "sepsis with a pregnant patient attached."**
Pregnancy and the puerperium physiologically mask the classic signs of sepsis — a resting
tachycardia and a mildly raised white cell count are baseline-normal in pregnancy (§3), so the
same numbers that would trigger alarm in a non-pregnant adult can look unremarkable in a pregnant
one until the patient is already significantly unwell. A young, previously healthy obstetric
patient also has substantial physiological reserve and can compensate right up to a sudden,
steep decompensation — the same recognition-lag pattern as PPH (§2.3). This combination — masked
early signs plus a deceptively well-looking patient with real reserve — is precisely why pregnancy-
related sepsis remains one of the NCCEMD Saving Mothers "big five" causes of maternal death in
South Africa (§6) and why a **low threshold for suspicion, and an obstetric-specific track-and-
trigger tool (MEOWS, §5), matters more here than almost anywhere else in medicine.**

**Differential/sources**
- **Chorioamnionitis** — intra-amniotic infection, classically with prolonged rupture of membranes,
  presenting with maternal fever, uterine tenderness, offensive/purulent liquor, fetal tachycardia,
  maternal tachycardia, and a rising WCC/CRP; management is maternal broad-spectrum antibiotics
  **and expedited delivery** — chorioamnionitis is not managed expectantly, the source (the
  intrauterine cavity) is not controlled until the pregnancy is delivered.
- **Endometritis** — postpartum uterine infection, classically presenting from 24 hours to several
  days postpartum with fever, uterine tenderness, offensive lochia, and sometimes secondary PPH from
  the associated impaired involution/retained infected tissue; the standard SA regimen is a
  **triple combination — ampicillin + metronidazole + gentamicin** [EK, consistent with this app's
  hardened content, `eval/og/3-consultant.md` W2 case], with attention to **gentamicin's
  nephrotoxicity risk when co-prescribed with an NSAID** (a named, tested interaction in this app's
  own evaluation — diclofenac was correctly withheld against the aminoglycoside in the hardened
  post-CS endometritis case) and to renal dosing/monitoring given the physiologically altered
  renal clearance of pregnancy/the puerperium (§3, §4).
- **Septic miscarriage/unsafe abortion** — a specific, SA-relevant differential (§6, §2.13):
  retained infected products of conception following either a spontaneous miscarriage or an
  unsafe/incomplete termination outside the formal health system, presenting with fever, offensive
  vaginal bleeding/discharge, uterine tenderness, and sometimes signs of uterine perforation or
  bowel injury if instrumentation was involved — management is resuscitation, broad-spectrum
  antibiotics, and prompt **uterine evacuation** (the source control step, analogous to
  chorioamnionitis requiring delivery) — do not delay evacuation pending "the patient stabilising
  first" when the retained infected tissue is the ongoing source.
- **Mastitis progressing to breast abscess** — a common, usually straightforward postpartum
  infection (cracked nipples, milk stasis, typically unilateral, tender, erythematous, febrile) that
  becomes a surgical problem (incision and drainage or aspiration) once a fluctuant collection/
  abscess forms rather than diffuse cellulitis — continuing breastfeeding/expression on the
  affected side is generally encouraged even during treatment (does not worsen mastitis and helps
  drainage), a frequently-misunderstood point.
- **Urinary tract infection/pyelonephritis** — common in pregnancy (physiological ureteric dilation
  and stasis increase risk), can progress rapidly to urosepsis and is a recognised trigger for
  preterm labour — asymptomatic bacteriuria is actively screened for and treated in pregnancy for
  exactly this reason (unlike in non-pregnant adults, where it is usually left untreated).
- **Non-obstetric sources presenting in pregnancy** — appendicitis (displaced and atypical
  presentation as the uterus enlarges, §2.9's crossover), pneumonia, and — in the SA context
  specifically — **TB and HIV-related opportunistic sepsis** must remain on the differential for any
  unwell pregnant woman, not just the obstetric sources (§6).

**Discriminating history/exam** — fever pattern and timing relative to delivery/procedure/rupture of
membranes, uterine tenderness (chorioamnionitis/endometritis), lochia character (offensive =
infective, heavy = consider secondary PPH from retained infected tissue), wound inspection post-
caesarean (erythema, discharge, dehiscence), breast exam if mastitis suspected, urinary symptoms,
any history of instrumentation/unsafe procedure outside the formal health system (asked sensitively
and non-judgementally — disclosure affects both source identification and legal/documentation
considerations), HIV status and any TB symptoms/contact history.

**Investigations** — FBC, CRP, blood cultures (before antibiotics where feasible without delaying
treatment), urine microscopy/culture, high vaginal/endocervical swabs, lactate (a marker of
perfusion/severity, interpreted with the same physiological caveats as elsewhere in critical
illness), wound swab if applicable, pelvic ultrasound if retained products/collection suspected;
HIV test if status unknown; consider blood gas/venous gas for a fuller severity picture in a
significantly unwell patient.

**The source hunt as the organising principle.** As in general sepsis management, source control is
not optional or secondary to antibiotics — it is co-equal, and in several obstetric sources (retained
products, an undrained collection, chorioamnionitis) **antibiotics alone will not resolve the
sepsis** until the source is physically addressed (evacuation, drainage, delivery). The consultant
question on every febrile obstetric/gynaecological patient is explicitly "what is the source, and
what does it need done to it, not just prescribed for it."

**Management anchors** — early broad-spectrum antibiotics per the identified/suspected source
(local antibiogram-guided where available), aggressive fluid resuscitation balanced against the
pre-eclampsia/fluid-overload caveat if co-existing hypertensive disease (§2.1, §4), source control
as above, MEOWS-based escalation and senior/ICU involvement for any deteriorating trend (§5),
continuous fetal monitoring if still pregnant (maternal sepsis is itself an indication to expedite
delivery once the mother is being actively resuscitated, particularly with chorioamnionitis).

**Consultant traps & pearls**
- A "normal-looking" heart rate and white cell count in pregnancy can already represent an abnormal,
  rising trend relative to that individual's pregnancy baseline — trend against pregnancy-adjusted
  norms (§3, §4), not non-pregnant reference ranges.
- Chorioamnionitis is not managed expectantly — antibiotics plus delivery, not antibiotics and
  watchful waiting.
- Diclofenac/NSAIDs alongside gentamicin is a specific, tested nephrotoxicity interaction to
  actively avoid in postpartum sepsis management.
- Septic miscarriage needs evacuation as source control, not resuscitation-then-evacuation-later —
  the retained tissue is the ongoing driver.
- A young, previously well obstetric patient's physiological reserve can mask deterioration until a
  late, steep decompensation — do not be reassured by a currently stable-looking patient if the
  trend (MEOWS, §5) is worsening.

---

### 2.7 Medical disorders in pregnancy

**The physiological changes that reframe every value — read alongside §3/§4, applied here to the
disorders they most affect.** Every "normal" laboratory and clinical reference range a junior has
learned for the non-pregnant adult needs re-calibration in pregnancy — this is not a footnote, it
is the operating principle of obstetric medicine, and the disorders below are exactly where getting
this wrong causes either missed diagnoses (under-reacting to an abnormal pregnancy value because it
"looks normal" by non-pregnant standards) or over-treatment (treating a normal pregnancy adaptation
as pathological).

**Venous thromboembolism.** Pregnancy is a deliberately hypercoagulable state (evolutionary
protection against peripartum haemorrhage) with increased clotting factors, reduced protein S, and
venous stasis from the gravid uterus and progesterone-mediated venodilation — **VTE risk is
increased roughly 4–5-fold across pregnancy and is highest in the immediate postpartum period**
[EK]. VTE is a **leading direct cause of maternal death** in multiple well-resourced health systems
(notably the UK MBRRACE-UK confidential enquiry programme) and remains a significant, likely
under-recognised contributor to SA maternal mortality (§6) — its prominence in this differential is
not proportionate reassurance that it is rare, it reflects how easily it is missed against a
background of normal pregnancy symptoms (dyspnoea, leg swelling, tachycardia are all common in
uncomplicated pregnancy too). **Diagnosis:** compression ultrasound for suspected DVT (first-line,
no radiation); for suspected PE, **CTPA or V/Q scanning** — both deliver a low fetal radiation dose
and neither is contraindicated by pregnancy; the choice is typically guided by chest X-ray findings
and local availability, with maternal breast-tissue radiation exposure (a consideration given
pregnancy-associated breast tissue proliferation) sometimes favouring V/Q where the CXR is normal
[EK, consistent with RCOG Green-top VTE guidance]. **D-dimer is not useful for excluding VTE in
pregnancy** — it rises physiologically across gestation (§3, §4) and a "normal" non-pregnant cutoff
is essentially always exceeded by the third trimester, so a positive D-dimer in a pregnant woman is
uninterpretable as a rule-out test and imaging-based diagnosis is required when clinical suspicion
exists. **Prophylaxis** — risk-scored (per RCOG-style scoring incorporating prior VTE, thrombophilia,
BMI, parity, smoking, immobility, and current pregnancy complications) with **low-molecular-weight
heparin (LMWH)**, weight-based dosing, continued through pregnancy and the postpartum period for
at-risk women; a prior unprovoked VTE or a VTE with an oestrogen-related/pregnancy-related trigger
is generally an automatic indication for antenatal prophylactic LMWH **regardless of thrombophilia
screen result** — a nuance this app's own evaluation specifically flagged as under-committed in one
hardened case (`eval/og/4-superspecialist.md`, finding #6b): the plan should not "await results" or
condition prophylaxis on a thrombophilia panel that may itself be uninterpretable in pregnancy
(protein S is physiologically low in pregnancy — a further specifically-flagged nuance,
`eval/og/4-superspecialist.md`, finding #6a — so a "low protein S" in a pregnant patient is not
independently diagnostic of a thrombophilia).

**Diabetes in pregnancy.** **GDM screening**: universal or risk-factor-based **75 g oral glucose
tolerance test at 24–28 weeks** [EK, WHO/IADPSG-consistent, widely adopted framework]. **Diagnostic
thresholds (any one abnormal value is diagnostic)** [EK, WHO/IADPSG criteria, consistent with this
app's hardened content, `eval/og/3-consultant.md` C7 case]: **fasting ≥5.1 mmol/L**, **1-hour
≥10.0 mmol/L**, **2-hour ≥8.5 mmol/L**. Pre-existing (type 1 or type 2) diabetes diagnosed in
pregnancy or known beforehand carries higher baseline risk (congenital anomaly risk tied to
first-trimester glycaemic control, macrosomia, stillbirth) than GDM arising later, and merits
earlier, more intensive surveillance including an early first-trimester screen in women with
known risk factors rather than waiting for the routine 24–28 week window. **Targets:** commonly
fasting **<5.3 mmol/L**, 1-hour post-prandial **<7.8 mmol/L**, 2-hour post-prandial **<6.7 mmol/L**
[EK, consistent with widely-used international/SA targets] — tighter than non-pregnant diabetic
targets, reflecting the fetal-growth sensitivity to even modest maternal hyperglycaemia. **First-
line pharmacological therapy in SA public-sector practice is metformin** where diet/lifestyle
measures fail to achieve targets, with **insulin** added or substituted where metformin alone is
insufficient or contraindicated [EK, consistent with this app's hardened content]. **Macrosomia
workup/surveillance** (growth scans, consideration of timed delivery) and vigilance for **shoulder
dystocia risk at delivery** (§2.5) follow directly from poorly controlled diabetes. Postpartum: GDM
resolves for most women immediately after delivery but confers a substantially elevated lifetime
risk of subsequent type 2 diabetes — a postpartum OGTT (commonly at 6–13 weeks postpartum) and
ongoing lifestyle counselling/rescreening is part of complete management, not an optional extra.

**HIV in pregnancy — PMTCT, ART, and the viral-load-drives-mode-of-delivery logic.** South Africa's
PMTCT programme is built on **universal test-and-treat**: every pregnant woman is offered HIV
testing at first contact (and retested later in pregnancy/at delivery given the risk of
seroconversion during pregnancy or breastfeeding), and every HIV-positive pregnant woman is started
on **ART immediately, same-day**, regardless of CD4 count, under the "Option B+"-descended universal
treatment approach embedded in the 2023 ART Clinical Guidelines. **Viral load is checked at first
antenatal visit** (or at ART initiation if newly diagnosed), with a **repeat viral load in the third
trimester (commonly around 36 weeks)** to inform delivery planning, and again at/after delivery.
**The mode-of-delivery logic**: a **well-suppressed viral load approaching delivery (commonly framed
around the <1000 copies/mL / ideally undetectable threshold used in mode-of-delivery decision-
making internationally)** [EK, consistent with WHO/international PMTCT consensus and SA-aligned
practice — exact current in-force SA numeric threshold should be verified against the current 2023
ART Guidelines edition] supports a normal obstetric approach to mode of delivery (vaginal delivery
where obstetrically appropriate); a **high or unknown viral load close to delivery** raises
transmission risk and shifts the calculus toward **elective caesarean section** as a transmission-
risk-reduction measure, alongside intensified intrapartum and neonatal ART prophylaxis. **Neonatal
prophylaxis** is risk-stratified by maternal viral load/ART duration (a well-controlled mother on
established, suppressive ART for most of pregnancy needs less intensive infant prophylaxis than one
with a detectable viral load close to delivery or a late-diagnosed mother). Breastfeeding is
supported (with maternal ART adherence as the protective mechanism) per current SA/WHO guidance for
resource-limited settings, reflecting the balance between HIV-transmission risk and the substantial
non-HIV mortality/morbidity risk of not breastfeeding in this context. **Drug-interaction vigilance**
extends into obstetric prescribing — efavirenz and other ART agents carry their own interaction and
neuropsychiatric-effect profile (cross-referenced in the psychiatry dossier), and antiretroviral
choice/dosing in pregnancy is itself a specialist-input decision where the picture is complex
(virological failure, multidrug resistance, co-morbid TB treatment).

**Anaemia in pregnancy.** Distinguish the expected physiological **dilutional anaemia of pregnancy**
(§3 — plasma volume expansion outpacing red cell mass expansion, nadir commonly around 28–32 weeks)
from a **true, pathological anaemia** requiring correction — the practical discriminator is the
degree of fall and the presence of a nutritional/haematinic deficiency pattern (microcytic/
hypochromic picture suggests iron deficiency, the most common true cause; macrocytic suggests
folate/B12 deficiency). Iron-deficiency anaemia in pregnancy is treated with oral iron
supplementation first-line, with **IV iron (e.g. ferric carboxymaltose)** reserved for
malabsorption, intolerance of oral iron, or a need for rapid correction close to delivery (this
app's hardened content correctly EML-tiers ferric carboxymaltose as a non-first-line/non-core
option, `eval/og/4-superspecialist.md`) — anaemia at delivery materially worsens the tolerance of
even a modest PPH, so correction ahead of delivery where time allows is a genuine safety
intervention, not cosmetic.

**Heart disease in pregnancy.** Pregnancy's haemodynamic changes (§3 — increased cardiac output,
increased plasma volume, reduced systemic vascular resistance) place real physiological stress on
any pre-existing structural or valvular heart disease, and certain lesions (severe pulmonary
hypertension, Eisenmenger syndrome, severe aortic stenosis, Marfan syndrome with aortic dilation,
peripartum cardiomyopathy) carry substantial, sometimes prohibitive, maternal mortality risk —
pre-pregnancy counselling and risk stratification (e.g. using a structured maternal cardiac risk
score) is the ideal, but many patients present already pregnant; any pregnant woman with known or
newly-suspected structural heart disease, or with unexplained dyspnoea/orthopnoea/reduced exercise
tolerance out of keeping with normal pregnancy physiology, merits cardiology-obstetric joint
review rather than reassurance that "some breathlessness is normal in pregnancy" — **peripartum
cardiomyopathy specifically presents late pregnancy through the first months postpartum** with
heart-failure symptoms that are easy to misattribute to normal late-pregnancy discomfort or
postpartum fatigue.

**Thyroid disease in pregnancy.** Total T4/T3 rise physiologically (increased thyroid-binding
globulin from oestrogen), so **free T4/free T3 with a pregnancy-trimester-specific reference range**
(and TSH, which can be transiently and mildly suppressed in the first trimester due to hCG's
TSH-receptor cross-reactivity) is the correct interpretive frame, not non-pregnant total hormone
ranges. Untreated overt hypothyroidism is associated with adverse pregnancy/neurodevelopmental
outcomes and is treated with levothyroxine, with dose requirements commonly **increasing** across
pregnancy (re-check and up-titrate, do not assume a stable pre-pregnancy dose remains adequate).
Graves' disease/hyperthyroidism management in pregnancy favours agents with a more favourable
fetal safety profile at specific gestational windows (a specialist-input decision given the
teratogenicity profile differences between antithyroid drugs across trimesters) [EK].

**Consultant traps & pearls**
- D-dimer is not a rule-out test for VTE in pregnancy — imaging is required whenever clinical
  suspicion exists, regardless of the D-dimer result.
- Prior unprovoked/pregnancy-related VTE is an automatic indication for antenatal LMWH prophylaxis —
  do not wait for or condition treatment on a thrombophilia panel that may itself be
  uninterpretable in pregnancy.
- GDM diagnosis needs only **one** abnormal OGTT value, not all three — a common and consequential
  misreading of the criteria.
- A stable pre-pregnancy levothyroxine dose is not guaranteed to remain adequate — thyroid function
  and dosing need re-checking across pregnancy.
- Mode-of-delivery decisions in HIV-positive women are driven by the viral-load trajectory, not by
  the HIV diagnosis itself — a well-suppressed woman does not need a caesarean on the basis of her
  status alone.
- Breathlessness in late pregnancy is common and usually benign, but disproportionate or
  progressive breathlessness deserves a cardiac differential, not automatic reassurance.

---

### 2.8 Early pregnancy — miscarriage, ectopic, GTD

**Miscarriage — the subtypes and the management of each.** **Threatened miscarriage**: bleeding
with a closed cervical os and a viable intrauterine pregnancy on scan — managed expectantly with
safety-netting advice, no specific treatment shown to alter outcome; most settle, a minority
progress to loss. **Inevitable miscarriage**: bleeding with an **open** cervical os, products not
yet passed, pregnancy not viable/soon will not be — managed expectantly, medically, or surgically
per patient choice and clinical stability. **Incomplete miscarriage**: some products passed, some
retained on scan — bleeding often continues/is heavier; managed expectantly (if stable, light
bleeding, patient preference), medically (misoprostol), or surgically (evacuation) depending on
bleeding severity, infection signs, and patient choice. **Missed miscarriage**: fetal demise (or an
empty gestational sac — "anembryonic pregnancy") confirmed on scan without symptoms of expulsion
(may be asymptomatic or present with brown spotting/loss of pregnancy symptoms) — same three
management options apply. **Septic miscarriage**: miscarriage (spontaneous or following unsafe
instrumentation, §2.6, §6) complicated by intrauterine infection — resuscitation, broad-spectrum
antibiotics, and **prompt evacuation as source control**, managed with the same urgency as any
other obstetric sepsis.

**Management options across the subtypes (patient choice drives selection where clinically
appropriate, stability permitting):**
- **Expectant management** — appropriate for a stable patient with manageable bleeding, no
  infection signs, willing to await spontaneous completion with follow-up (repeat scan/βhCG to
  confirm completion) — avoids intervention but has a lower/slower completion rate and requires
  reliable follow-up access.
- **Medical management — misoprostol** — a prostaglandin analogue given orally, sublingually, or
  vaginally (dose/route per local protocol, e.g. commonly in the 400–800 µg range, repeated if
  incomplete) [EK] to induce uterine contraction and expulsion of retained tissue; effective, avoids
  anaesthesia/instrumentation, but causes cramping/bleeding that needs to be pre-counselled, and
  carries a failure/incomplete-expulsion rate requiring possible surgical follow-up.
- **Surgical management — MVA (manual vacuum aspiration) or electric vacuum aspiration/evacuation of
  retained products of conception (ERPC)** — appropriate for heavy bleeding, haemodynamic
  instability, infection, failed medical/expectant management, or patient preference for definitive,
  rapid completion; MVA is increasingly favoured at district level for its lower resource/
  anaesthesia requirement and can often be performed under local anaesthesia/light sedation rather
  than general anaesthesia.
- **Anti-D** is given to Rh-negative women undergoing surgical management of miscarriage, and per
  local protocol for medical/expectant management particularly beyond early first trimester
  (practice varies on the exact gestational threshold below which anti-D is not required for
  non-instrumented very-early pregnancy loss — verify against current local protocol) [EK].

**Ectopic pregnancy — the full workup.** **Risk factors**: previous ectopic (strongest), previous
tubal surgery/damage, pelvic inflammatory disease, current intrauterine device in situ, assisted
reproduction, smoking; a substantial proportion have no identifiable risk factor. **Presentation**:
classic triad of amenorrhoea/missed period, abdominal pain, and vaginal bleeding — but presentation
is frequently atypical, and any reproductive-age woman with abdominal pain, collapse, or
unexplained shoulder-tip pain (diaphragmatic irritation from haemoperitoneum) needs a βhCG (§1's
"is she pregnant" reflex). **The βhCG-and-scan workup**: a positive βhCG with **no intrauterine
pregnancy visible on transvaginal ultrasound** is a **pregnancy of unknown location (PUL)** until
further information (serial βhCG trend, repeat scan, or clinical deterioration) clarifies the
diagnosis — it is not synonymous with ectopic pregnancy and should not be labelled as such
prematurely. **Discriminatory zone**: a βhCG level (commonly cited around **1500–2000 mIU/mL**,
though the exact cutoff varies by assay/institution and by transvaginal vs transabdominal scanning)
above which an intrauterine pregnancy would be expected to be visible on transvaginal ultrasound if
present — **the discriminatory zone is a guide, not an absolute rule**: viable intrauterine
pregnancies (especially multiple pregnancies) have been confirmed at βhCG levels above commonly-used
discriminatory thresholds, and current emergency-medicine/gynaecological guidance explicitly
cautions against using a single discriminatory-zone βhCG value in isolation to diagnose or exclude
ectopic pregnancy in a haemodynamically stable patient with an indeterminate scan — serial
measurement and clinical correlation remain essential rather than a single-cutoff verdict. **The
PUL algorithm — serial βhCG at 48 hours**: a normally-progressing early intrauterine pregnancy shows
a **rise of at least ~53% (roughly 50–66%, varying by baseline level) over 48 hours** [EK,
consistent with the widely-used Barnhart-derived minimal-rise curve]; a **plateau or a rise below
this threshold** is suspicious for ectopic pregnancy (though a slower-rising but still viable
pregnancy is possible, again requiring correlation); a **falling** βhCG suggests a failing pregnancy
(miscarriage or a resolving ectopic) — the rate of fall itself doesn't reliably distinguish
miscarriage from ectopic and further follow-up (scan, exam) is still needed. **Methotrexate criteria
vs surgery**: single-dose methotrexate (**50 mg/m² IM**) [EK, consistent with this app's hardened
content, `eval/og/4-superspecialist.md`] is appropriate for a **haemodynamically stable** patient
with minimal/no pain, **βhCG below a defined ceiling (commonly cited around <5000, some protocols
more conservative at <3000)**, **no visible fetal cardiac activity**, an ectopic mass **<3.5–4 cm**,
and **reliable follow-up** (repeat βhCG on **day 4 and day 7**, requiring a **fall of ≥15%** between
days 4 and 7 to confirm success, with further dosing/surgical rescue if not); contraindications
include renal or hepatic impairment, significant anaemia/leucopenia/thrombocytopenia,
breastfeeding, known sensitivity, active peptic ulcer/pulmonary disease, and inability to comply
with follow-up. **Surgery (laparoscopic or open salpingectomy/salpingostomy)** is indicated for
haemodynamic instability, significant free fluid/suspected rupture, failed or contraindicated
methotrexate, or patient preference for a single definitive procedure over the multi-visit
methotrexate follow-up burden — **a ruptured or actively bleeding ectopic is a surgical emergency
regardless of what the methotrexate criteria would otherwise suggest.** Anti-D is given to
Rh-negative women managed either surgically or medically for ectopic pregnancy.

**Gestational trophoblastic disease.** **Complete mole**: no fetal tissue, diffuse trophoblastic
hyperplasia, classically a **markedly elevated βhCG for gestational age** and a **"snowstorm"**
appearance on ultrasound (a heterogeneous, cystic, vesicular pattern replacing normal placental/
fetal tissue), commonly presents with irregular bleeding, hyperemesis (from the very high βhCG), and
sometimes early pre-eclampsia (unusually early for gestation) or **hyperthyroidism** (βhCG's
structural similarity to TSH cross-stimulates the thyroid at very high concentrations — check
thyroid function). **Partial mole**: triploid, fetal tissue/parts present alongside abnormal
placental tissue, generally lower βhCG elevation and a less dramatic ultrasound picture, higher
risk of being initially mistaken for a missed miscarriage. **Management**: suction curettage/
evacuation is definitive for most molar pregnancies; **uterotonics are given only after suction
evacuation is established**, not beforehand — a specific, tested nuance in this app's hardened
content (`eval/og/4-superspecialist.md`) — because uterotonic-driven contraction before the bulk of
trophoblastic tissue is evacuated risks **trophoblastic embolisation**. **Anti-D is withheld for a
confirmed complete mole** (no fetal red cells present to sensitise against) but given for a partial
mole (fetal tissue is present) — another specifically-tested distinction in this app's hardened
content. **Surveillance**: serial **βhCG weekly until undetectable, then monthly** for a defined
period (commonly **6 months** for a complete mole, sometimes shorter for a partial mole once
histologically confirmed and the initial post-evacuation βhCG normalises rapidly) [EK]; **effective
contraception throughout surveillance** is required (a new pregnancy during surveillance makes rising
βhCG uninterpretable) — **avoid an intrauterine device** specifically during the surveillance/
early-post-evacuation period given uterine perforation risk in a recently-evacuated molar uterus,
favouring barrier or combined hormonal contraception instead. **The βhCG that doesn't fall** — a
plateauing or rising βhCG during surveillance, rather than the expected fall to undetectable, is the
signal for **gestational trophoblastic neoplasia (GTN)**, requiring staging (CXR for pulmonary
metastases at minimum, further imaging as indicated) and chemotherapy referral; the risk of GTN
after a complete mole is substantial (commonly cited **~15–20%**) [EK, consistent with this app's
hardened content], considerably lower after a partial mole.

**Consultant traps & pearls**
- Labelling a positive-βhCG-with-no-visible-IUP as "ectopic" rather than "pregnancy of unknown
  location" prematurely forecloses the differential and can drive inappropriate methotrexate
  administration into a viable but not-yet-visible intrauterine pregnancy.
- The discriminatory zone is a guide, not a rule-out threshold — do not exclude ectopic in a stable
  patient with an indeterminate scan purely because the βhCG is below the cutoff.
- Uterotonics before evacuation in a molar pregnancy is a specific, dangerous sequencing error
  (trophoblastic embolisation risk) — evacuate first.
- A complete mole needs no anti-D (no fetal cells); a partial mole does — know the distinction, it
  is frequently tested and frequently missed.
- Every molar-surveillance patient needs effective, IUD-free contraception explicitly arranged
  before discharge — an unplanned pregnancy during surveillance defeats the entire monitoring plan.

---

### 2.9 Acute pelvic pain in the non-pregnant woman

**The organising rule — the same reflex as §1, restated for this specific presentation.** A βhCG is
sent on every reproductive-age woman with pelvic pain **before** the differential below is trusted —
"non-pregnant" acute pelvic pain is, by definition, a diagnosis that requires a negative pregnancy
test to even open the conversation; skipping the test to save time is the single most common
process error underlying a missed ectopic (§2.8).

**Differential**
- *Common:* mid-cycle ("Mittelschmerz") ovulation pain; primary dysmenorrhoea; urinary tract
  infection; simple ovarian cyst (functional, haemorrhagic, or ruptured — often self-limiting);
  constipation/irritable bowel.
- *Must-not-miss:* **ovarian torsion** (the single most time-critical gynaecological surgical
  emergency after ectopic — ovarian viability depends on minutes-to-hours of ischaemic time, and a
  delayed diagnosis converts a salvageable ovary into an oophorectomy); **ruptured ectopic
  pregnancy** (§2.8, re-excluded here as the presentation overlaps completely); **pelvic
  inflammatory disease/tubo-ovarian abscess** (risk of tubal damage/infertility and of sepsis if
  missed or under-treated); **appendicitis** (the classic surgical-abdomen overlap — right-sided
  gynaecological and appendiceal pathology are frequently indistinguishable clinically and the
  differential must be actively worked through both specialties' lenses rather than reflexively
  assigned to one); ruptured haemorrhagic ovarian cyst with significant intraperitoneal bleeding
  (can mimic ectopic rupture in severity); ectopic pregnancy's mimics more broadly (§2.8).
- *Zebras:* Fitz-Hugh-Curtis syndrome (perihepatitis from ascending PID — right-upper-quadrant pain
  as the presenting feature, easy to misattribute to biliary or hepatic pathology); endometrioma
  rupture; degenerating fibroid (red degeneration, classically in pregnancy but can occur outside
  it); mesenteric adenitis; ureteric colic; diverticulitis in an older patient.

**Ovarian torsion — the time-critical miss, worked to depth.** Risk factors: an enlarged ovary
(functional cyst, dermoid, or other benign mass — torsion risk rises with ovarian size, and a
normal-sized ovary can still torse, particularly in a younger patient with a longer utero-ovarian
ligament), pregnancy (ovarian enlargement from corpus luteum, and hyperstimulated ovaries post-
fertility treatment are a recognised higher-risk group), and reproductive age generally.
**Presentation**: sudden-onset, severe, often unilateral pain, frequently with nausea/vomiting out
of proportion to other findings (a vagal response to ovarian ischaemia) — the pain can be
intermittent/waxing-and-waning if the ovary intermittently detorts and re-torses, a pattern that
misleadingly suggests "it's getting better" and delays presentation/diagnosis. **Examination**:
adnexal tenderness, sometimes a palpable mass; **the absence of fever or a markedly raised white
cell count does not exclude torsion** — these are late/inconsistent findings. **Investigation**:
pelvic ultrasound with **Doppler flow** is the key investigation, but **normal arterial and even
venous Doppler flow does NOT reliably exclude torsion** — the ovary has a dual blood supply
(ovarian and uterine arteries) and can maintain some detectable flow despite significant torsion,
particularly with intermittent or partial torsion; **a clinical picture strongly suggestive of
torsion should proceed to diagnostic laparoscopy even with reassuring Doppler**, because waiting for
a "confirmatory" scan finding that may never appear risks losing a salvageable ovary. **Management**:
emergency laparoscopy — **detorsion with ovarian conservation is now the preferred approach even
when the ovary looks dusky/ischaemic at the time of surgery** (an ovary that looks non-viable
intraoperatively frequently recovers function after detorsion and is given the chance to do so
rather than reflexively removed) [EK, consistent with current gynaecological-surgical consensus],
with oophoropexy (fixation) considered for a recurrently torsing or unusually mobile ovary;
straightforward oophorectomy is reserved for a genuinely necrotic, non-viable ovary or an
underlying mass requiring removal regardless.

**PID and tubo-ovarian abscess.** Presentation: bilateral (more often than unilateral, a soft
discriminator against torsion/appendicitis which are more commonly unilateral) lower abdominal pain,
fever, abnormal vaginal discharge, deep dyspareunia, cervical motion tenderness/adnexal tenderness
on bimanual exam ("cervical excitation" — a classic, specific finding). A **tubo-ovarian abscess**
is suspected with a palpable adnexal mass, higher fever, and a more toxic clinical picture, and
confirmed/characterised on pelvic ultrasound; management is broad-spectrum antibiotics covering the
polymicrobial/STI-associated pathogen range (per SA syndromic guidance, §2.11) with surgical or
radiologically-guided drainage for a large or non-resolving abscess, and diagnostic laparoscopy
where the diagnosis remains uncertain or the patient fails to improve — untreated/under-treated PID
and TOA carry substantial long-term tubal-factor-infertility and chronic pelvic pain risk, which is
part of why treatment thresholds are kept low (treat presumptively on clinical suspicion rather than
awaiting swab confirmation, §2.11).

**Discriminating history** — pain onset (sudden = torsion/rupture/ectopic; gradual = infective/
appendiceal), laterality, relationship to cycle (mid-cycle = ovulation pain; timing relative to last
menstrual period for ectopic risk), associated GI symptoms (anorexia, migration of pain = appendiceal),
urinary symptoms, sexual history/discharge (PID), fertility treatment history (ovarian
hyperstimulation/torsion risk), prior ectopic/PID/tubal surgery.

**Discriminating examination** — vital signs (fever favours infective causes, tachycardia/
hypotension raises intraperitoneal bleeding — ectopic or ruptured cyst — as much as it does sepsis);
abdominal exam for peritonism/rebound/guarding (any surgical-abdomen picture needs the general-
surgical differential run in parallel, not deferred); bimanual exam for cervical excitation
(PID), adnexal mass/tenderness (torsion, TOA, cyst), and uterine size/tenderness; speculum exam for
discharge/cervicitis.

**Investigations & interpretation nuance** — βhCG first, always; FBC/CRP (raised in
infective/inflammatory causes, unhelpfully normal early in torsion); pelvic ultrasound (transvaginal
preferred for resolution) with Doppler — interpreted with the torsion caveat above; urine
microscopy/culture; endocervical/vaginal swabs if PID suspected; consider CT if the appendiceal
differential is dominant and gynaecological causes have been reasonably excluded, particularly in a
setting where diagnostic laparoscopy access is limited.

**Consultant traps & pearls**
- Reassuring Doppler flow does not exclude ovarian torsion — treat the clinical picture, not just
  the scan, and have a low threshold for diagnostic laparoscopy.
- Waxing-and-waning pain in suspected torsion reflects intermittent detorsion, not resolution —
  don't be falsely reassured by a patient who says the pain "comes and goes and is better now."
- Ovarian conservation (detorsion, even of a dusky-looking ovary) is now favoured over reflex
  oophorectomy — give the ovary the chance to recover.
- A negative βhCG is what actually separates "acute pelvic pain, non-pregnant differential" from
  the entire early-pregnancy differential — do not proceed on the gynaecological differential
  without it confirmed negative.
- Right-sided pain in a reproductive-age woman is a genuine appendix-vs-adnexa diagnostic
  dilemma — work both differentials in parallel rather than anchoring early on either specialty.

---

### 2.10 Abnormal uterine bleeding (AUB)

**The PALM-COEIN framework** [EK, FIGO-endorsed classification, now the standard organising
structure for AUB] separates **structural** causes (**PALM**) from **non-structural/functional**
causes (**COEIN**): **P**olyp, **A**denomyosis, **L**eiomyoma (fibroid), **M**alignancy and
hyperplasia — the structural group, generally identifiable on imaging/histology; **C**oagulopathy
(von Willebrand disease and other bleeding disorders — under-recognised, worth actively screening
for in heavy menstrual bleeding since menarche, not just adult-onset AUB), **O**vulatory dysfunction
(anovulatory cycles — common at the extremes of reproductive life, in PCOS, thyroid disease,
hyperprolactinaemia), **E**ndometrial (a primary disorder of local endometrial haemostasis with
otherwise normal cycles and no other identifiable cause — a diagnosis of exclusion), **I**atrogenic
(anticoagulants, hormonal contraception/IUDs, some psychotropic medications affecting prolactin), **N**ot
yet classified. This framework replaces the older, imprecise "menorrhagia/metrorrhagia" terminology
with a structured differential that maps directly onto the investigation and management pathway.

**Heavy menstrual bleeding (HMB) workup.** History should establish the actual functional impact
(flooding, clot passage, need to double up on protection, impact on daily activity/work/school —
more clinically meaningful than an attempted objective blood-loss volume estimate, which patients
cannot reliably provide); cycle regularity (regular = more likely structural/ovulatory-normal;
irregular = more likely anovulatory/endocrine); intermenstrual or postcoital bleeding (raises
structural/cervical pathology concern, §2.12); associated pain (adenomyosis, fibroids);
contraceptive/IUD history; anticoagulant use; symptoms of anaemia; a bleeding-disorder history
(bruising, bleeding after dental work/childbirth, family history) — actively asked, not assumed
absent. Examination: abdominal palpation for an enlarged, bulky, or irregular uterus (fibroids,
adenomyosis); speculum exam to visualise the cervix directly (never skip this in AUB — a cervical
lesion is a visual diagnosis missed entirely by imaging alone, §2.12) and assess bleeding source.
Investigations: FBC (anaemia); coagulation screen/specific bleeding-disorder workup if history
suggests it; TFTs; pelvic ultrasound (transvaginal preferred) for fibroids, endometrial thickness/
polyps, adenomyotic features; endometrial sampling (pipelle biopsy) where there is a risk factor
for endometrial hyperplasia/malignancy (age, obesity, PCOS/chronic anovulation, tamoxifen use,
unopposed oestrogen exposure) or where bleeding is refractory to first-line management; hysteroscopy
(with or without biopsy) where ultrasound is equivocal or a focal lesion (polyp, submucosal fibroid)
needs direct visualisation/treatment.

**Postmenopausal bleeding = endometrial cancer until excluded.** This is a categorical rule, not a
probabilistic hedge: **any bleeding after 12 months of amenorrhoea in a woman of appropriate age is
managed as endometrial cancer until proven otherwise**, regardless of how "light" or "spotting-only"
the bleeding is, and regardless of a reassuring-seeming clinical context (e.g. recently started
hormone therapy) — the workup proceeds the same way. **Transvaginal ultrasound endometrial-thickness
threshold**: an endometrial thickness **≤4 mm** carries a very high negative predictive value for
endometrial cancer and has historically supported a "no biopsy needed" pathway in a woman with a
single episode of postmenopausal bleeding and no other risk factors [EK, widely-used international
threshold] — **however, this threshold is increasingly treated as a floor, not a ceiling, of
reassurance**: current guidance updates (e.g. recent ACOG practice guidance) move toward
recommending endometrial sampling regardless of a thin endometrial stripe in higher-risk patients
(obesity, tamoxifen use, Lynch syndrome/genetic predisposition, recurrent/persistent bleeding
despite a reassuring first scan) — a thin endometrium on a single scan should not be treated as a
permanent all-clear if bleeding recurs or risk factors are present. **Pipelle endometrial biopsy**
is the first-line, outpatient sampling method; **hysteroscopy with directed biopsy/curettage** is
used where Pipelle sampling is technically difficult (cervical stenosis — common postmenopausally),
non-diagnostic, or where a focal lesion needs direct visualisation. **Do not give empirical
progestogen** to a postmenopausal bleeding patient before histological diagnosis is secured — this
can mask or delay the diagnosis of an underlying malignancy, a specific, named error this app's
hardened content correctly avoided (`eval/og/4-superspecialist.md`).

**Management anchors across AUB** — tranexamic acid (non-hormonal, taken during menses) and NSAIDs
for ovulatory HMB without a structural cause needing separate treatment; the **levonorgestrel
intrauterine system** as a highly effective first-line medical option for HMB where fertility
preservation/long-term management is wanted and no malignancy concern exists; combined hormonal
contraception as a cycle-regulating option in appropriate candidates; surgical options (polypectomy,
myomectomy, endometrial ablation, hysterectomy) reserved for structural causes, medical-treatment
failure, or completed childbearing with a strong patient preference for definitive treatment;
malignancy/hyperplasia identified on biopsy is referred to gynae-oncology (§2.12), not managed
within a general AUB pathway.

**Consultant traps & pearls**
- Skipping the speculum exam in AUB misses cervical pathology that imaging cannot show — it is a
  mandatory, not optional, part of every AUB assessment.
- A reassuringly thin endometrial stripe on one scan does not permanently close the investigation in
  a higher-risk or persistently-bleeding patient — recurrence or risk factors should prompt biopsy
  regardless of the stripe measurement.
- Empirical progestogen before histological diagnosis in postmenopausal bleeding is a specific,
  dangerous shortcut that can delay a cancer diagnosis.
- HMB since menarche, or HMB with a personal/family bleeding history, deserves an active
  coagulopathy screen — von Willebrand disease is under-diagnosed as a cause of "just heavy
  periods."

---

### 2.11 Abnormal vaginal discharge, STI syndromic management, PID

**The SA syndromic approach.** South Africa's national STI guidelines use **syndromic management**
— treating the presenting symptom complex with a standardised drug combination covering the most
likely pathogens **without waiting for laboratory confirmation**, given limited point-of-care
diagnostic access in much of the public sector and the imperative not to lose patients to follow-up
between a swab and a results-driven treatment visit. **Vaginal discharge syndrome** is managed with
combination therapy covering the common causes together — bacterial vaginosis, trichomoniasis, and
candidiasis are all considered and treated where the syndromic protocol indicates, rather than
attempting to clinically distinguish them with certainty at the bedside (though clinical clues still
matter: a thin, grey, fishy-odour discharge suggests bacterial vaginosis; a frothy, yellow-green,
malodorous discharge with vulval irritation suggests trichomoniasis; a thick, curdy, intensely
itchy discharge suggests candidiasis) [EK, consistent with SA syndromic management principles].
**Lower abdominal pain syndrome** in a sexually active woman is managed presumptively as PID (below)
per syndromic protocol. Every STI syndromic consultation is also an opportunity — and, per protocol,
an expectation — for **partner notification/treatment**, **HIV testing**, and risk-reduction
counselling; treating the index patient alone without addressing partner treatment risks
reinfection and does not interrupt transmission.

**PID diagnosis and treatment.** Diagnosis is clinical and deliberately low-threshold: lower
abdominal/pelvic pain plus one or more of cervical motion tenderness, uterine tenderness, or adnexal
tenderness on bimanual exam, in a sexually active woman, with no other identified cause for the
findings — **empirical treatment is started on this clinical threshold rather than awaiting swab
confirmation**, because the cost of under-treating (tubal damage, infertility, chronic pelvic pain,
ectopic pregnancy risk in future pregnancies, progression to TOA) substantially outweighs the cost
of treating a small number of cases that turn out not to be PID. Treatment covers the likely
polymicrobial/STI pathogen range per the national syndromic regimen (typically a combination
addressing gonorrhoea, chlamydia, and anaerobic organisms) [EK — exact current SA STG/EML drug/dose
combination should be verified against the in-force syndromic management guideline edition].
Admission and IV therapy are indicated for a more severe presentation (fever, peritonism, suspected
TOA, pregnancy, failure of outpatient therapy, or inability to tolerate oral treatment); a
suspected or confirmed tubo-ovarian abscess is managed per §2.9.

**Consultant traps & pearls**
- Treating the index patient without addressing partner notification/treatment is incomplete
  management under the syndromic framework — reinfection is the expected outcome otherwise.
- PID is treated empirically on clinical threshold, not held pending swab results — delay is the
  error that causes tubal damage, not over-treatment.
- Every STI syndromic encounter is also an HIV-testing opportunity — build it into the same
  consultation rather than deferring to a separate visit.

---

### 2.12 The gynae-oncology red flags an intern must not miss

**Cervical cancer in the SA/HIV context — the leading female cancer.** Cervical cancer is the
**leading cause of cancer death among South African women** and is an **AIDS-defining illness** in
HIV-positive women, reflecting both the causal role of persistent high-risk HPV infection
(more likely to persist and progress under HIV-related immunosuppression) and gaps in screening
coverage. **Presentation**: postcoital bleeding, intermenstrual bleeding, offensive vaginal
discharge, and in more advanced disease pelvic pain, weight loss, leg swelling (lymphatic/venous
obstruction), and renal impairment from ureteric obstruction by locally advanced disease — any of
these in the differential should prompt direct visual **speculum inspection of the cervix**, not
imaging alone. A visibly abnormal, friable, or bleeding cervical lesion should be **biopsied at a
centre with haemostatic capability/backup**, not in an unsupported district setting where brisk
bleeding from a friable tumour cannot be safely managed — a specific, named safety nuance this
app's hardened content correctly applied (`eval/og/4-superspecialist.md`). Staging uses the
**FIGO 2018 system** (clinical plus imaging-based staging, a change from the older purely clinical
FIGO staging) — parametrial induration on exam indicates at least stage IIB; vaginal extension
distinguishes IIIA (lower-third vaginal involvement) from IIIB (pelvic sidewall extension or
hydronephrosis) — **these are genuinely distinct findings and are a recognised point of confusion**
(this app's own evaluation flagged exactly this conflation as a minor depth gap,
`eval/og/4-superspecialist.md` finding #8): parametrial induration alone, without sidewall fixation,
does not by itself justify a IIIB label. HIV testing is part of the same consultation for any newly
diagnosed or suspected cervical cancer, and antiretroviral drug interactions/nephrotoxicity
(e.g. tenofovir before iodinated contrast for staging CT) are checked before imaging.

**Ovarian mass features and the risk-of-malignancy-index concept.** Features raising malignancy
concern on ultrasound: multilocular architecture, solid components/papillary projections, thick
irregular septations, ascites, bilaterality, and evidence of metastatic spread; a simple,
unilocular, thin-walled cyst in a premenopausal woman is reassuring and often managed
expectantly/with interval rescan. The **Risk of Malignancy Index (RMI)** formalises this into a
score: **RMI = U × M × CA-125**, where **U** (ultrasound score) is **0** for no suspicious features,
**1** for one feature, and **3** for two or more of the suspicious features above; **M** (menopausal
status) is **1** for premenopausal and **3** for postmenopausal; **CA-125** is the serum value in
U/mL. **A conventional cutoff of RMI >200 is used to flag referral to a gynae-oncology MDT** [EK,
Jacobs-derived RMI, widely validated internationally] rather than proceeding with routine
gynaecological surgical management. CA-125 alone is a poor standalone screening test (raised in
many benign conditions — endometriosis, fibroids, PID, even menstruation — and can be normal in
early-stage or mucinous ovarian malignancy), which is precisely why it is combined with imaging and
menopausal status rather than used in isolation.

**Postmenopausal bleeding** is cross-referenced in full at §2.10 — restated here as a gynae-
oncology red flag in its own right: it is the presenting symptom of endometrial cancer until
proven otherwise, and the workup (transvaginal ultrasound endometrial thickness, biopsy) must not
be deferred or substituted with empirical hormonal treatment.

**The vulval lesion.** Any persistent, non-healing vulval lesion, ulcer, or area of unexplained
pruritus/pigment change — particularly in an older woman, or one with a history of lichen
sclerosus (a recognised precursor condition) — warrants direct inspection and a low threshold for
biopsy rather than empirical treatment for presumed infective/dermatological causes without
histological confirmation if it fails to resolve; vulval cancer is less common than cervical or
endometrial cancer but is disproportionately delayed in diagnosis precisely because early
presentations are frequently and repeatedly treated as candidiasis, dermatitis, or lichen sclerosus
alone without biopsy when the lesion persists or evolves.

**Consultant traps & pearls**
- Every new cervical cancer diagnosis or suspicion is also an HIV-testing opportunity — the two are
  clinically and epidemiologically linked in this population and should be addressed in the same
  encounter.
- A friable, bleeding cervical lesion is biopsied where bleeding can be controlled, not
  opportunistically at a facility without that backup.
- Parametrial induration alone is not sufficient for a IIIB cervical cancer stage — check
  specifically for pelvic sidewall fixation or hydronephrosis before assigning it.
- CA-125 alone is not a screening or diagnostic test for ovarian malignancy — it must be combined
  with imaging features and menopausal status (the RMI) to be clinically useful.
- A persistent vulval lesion that keeps getting treated as "just" candidiasis/dermatitis without
  resolving needs a biopsy, not another empirical cream.

---

### 2.13 Contraception, reproductive planning, and termination of pregnancy (CTOP Act)

**The SA method mix and the medical-eligibility reflex.** Contraceptive counselling in SA public-
sector practice spans short-acting methods (combined oral contraceptives, progestogen-only pills,
the injectable — commonly a 2- or 3-monthly progestogen injectable, a widely used method in SA given
its convenience and lower daily-adherence burden), barrier methods, and **long-acting reversible
contraception (LARC)** — the copper and levonorgestrel intrauterine devices/systems and the
subdermal contraceptive implant — which are actively promoted given their high effectiveness
independent of ongoing user adherence, a particular advantage in a setting where consistent
access/follow-up cannot always be guaranteed. The **medical-eligibility reflex** — checking a
patient's medical history against method-specific contraindications before prescribing, not after —
is core to safe contraceptive practice: combined hormonal methods are contraindicated or used with
caution in women with a history of VTE, migraine with aura, uncontrolled hypertension, smokers over
35, and certain cardiac/hepatic conditions (progestogen-only and non-hormonal methods are the
appropriate alternative in these groups); the WHO Medical Eligibility Criteria framework (categories
1–4, from "no restriction" to "unacceptable health risk") structures this decision systematically
rather than leaving it to memory alone [EK].

**Emergency contraception.** Available options include a **levonorgestrel-based emergency
contraceptive pill** (most effective the sooner it is taken after unprotected intercourse, with
efficacy declining over the licensed window, commonly framed as effective up to 72 hours though
some effect persists slightly beyond) and the **copper IUD** inserted as emergency contraception
(the most effective emergency method overall, effective up to 5 days after unprotected intercourse,
with the added benefit of providing ongoing highly effective contraception thereafter if retained)
[EK]. Access to emergency contraception should not require extensive gatekeeping — delay
materially reduces effectiveness.

**Termination of pregnancy within the SA CTOP Act framework.** The **Choice on Termination of
Pregnancy Act 92 of 1996** is one of the most liberal legal frameworks for abortion access
globally, structured by gestational age band:
- **Up to and including 12 weeks**: termination available **on the woman's request alone**, no
  additional justification required; may be performed by a registered midwife/nurse with the
  appropriate training, or a medical practitioner.
- **From the 13th week up to and including the 20th week**: termination requires a medical
  practitioner's opinion (after consultation with the woman) that continuing the pregnancy would
  pose a risk to the woman's physical or mental health, that there is a substantial risk of severe
  fetal physical or mental abnormality, that the pregnancy resulted from rape or incest, or that
  continuing the pregnancy would significantly affect the woman's social or economic circumstances;
  procedures from 12 weeks and 1 day onward must be performed by a medical practitioner.
- **From the 21st week onward**: termination is permitted only where a medical practitioner, after
  consultation with a second medical practitioner, is of the opinion that continuing the pregnancy
  would endanger the woman's life, would result in severe fetal malformation, or would pose a risk
  of injury to the fetus.
Method selection (medical — mifepristone/misoprostol-based regimens where available, or misoprostol
alone; versus surgical — MVA/vacuum aspiration for earlier gestations, dilatation and evacuation for
later gestations) is chosen per gestational age, patient preference, and facility capability,
following the same medical-vs-surgical logic as miscarriage management (§2.8) [EK — exact current
in-force SA regimen doses per the 2021 CTOP Clinical Guideline should be verified against the
current edition]. **Conscientious objection** by individual healthcare providers is recognised, but
does not permit obstruction of a patient's access to the service — an objecting provider is
expected to refer promptly to a willing provider, not simply decline and leave the patient without a
pathway forward. **Confidentiality** is protected, and — notably — **the Act does not require
parental or partner consent for a minor**, reflecting the framework's emphasis on the pregnant
woman's/girl's own decision-making autonomy. The gap between this legal framework's liberality and
the lived reality of access (limited facility/provider availability, especially for later-gestation
procedures, geographic and transport barriers, provider conscientious objection reducing effective
access in some areas, stigma) is precisely why **unsafe abortion/septic miscarriage remains an
active clinical differential** in SA despite the law (§2.6, §6) — a legal right unmet by accessible
services still produces the same clinical emergency it was designed to prevent.

**Consultant traps & pearls**
- Gatekeeping emergency contraception access (requiring unnecessary counselling delays, judgemental
  questioning) materially reduces its effectiveness — time is the active ingredient.
- A minor requesting termination of pregnancy does not need parental consent under the CTOP Act —
  a common, incorrect assumption that can wrongly delay or deny access.
- Conscientious objection requires prompt referral to a willing provider, not simply declining care
  — failing to refer is itself a barrier-to-access problem, not a neutral act.
- LARC methods are systematically under-offered relative to their effectiveness and suitability —
  actively counsel on them rather than defaulting to short-acting methods by habit.

---

### 2.14 Menopause and the older gynae patient

**Menopause** is defined retrospectively as **12 consecutive months of amenorrhoea** with no other
identifiable cause, reflecting the depletion of ovarian follicular reserve and the resulting fall in
oestrogen; the perimenopausal transition (irregular cycles, vasomotor symptoms — hot flushes, night
sweats — mood and sleep disturbance) can precede the final period by several years. **Any bleeding
after the 12-month threshold is postmenopausal bleeding and is managed as endometrial cancer until
excluded (§2.10, §2.12)** — this cross-reference is restated because it is the single most
consequential clinical rule in this life stage. **Hormone therapy (HT)** for vasomotor/genitourinary
menopausal symptoms is individualised against the patient's cardiovascular, thromboembolic, and
breast-cancer risk profile, with the route (oral vs transdermal) and regimen (oestrogen alone for a
woman without a uterus, combined oestrogen-progestogen for a woman with an intact uterus, to protect
the endometrium from unopposed-oestrogen-driven hyperplasia) chosen accordingly; a woman with an
intact uterus given oestrogen-only therapy without endometrial protection is a specific, avoidable
prescribing error.

**Pelvic organ prolapse.** Descent of the uterus, vaginal vault, bladder (cystocele), or rectum
(rectocele) through the vaginal canal, driven by pelvic floor weakening from childbirth (particularly
prolonged second stage, instrumental delivery, large babies), ageing, chronic raised intra-
abdominal pressure (chronic cough, constipation, obesity, heavy lifting), and oestrogen deficiency.
Presentation: a sensation of vaginal bulging/pressure, worse on standing/at day's end, sometimes with
a visible/palpable lump, urinary symptoms (incomplete emptying, or paradoxically stress incontinence
that can be masked by significant prolapse and unmasked once the prolapse is corrected — a specific
counselling point before surgical repair), and bowel symptoms with rectocele. Management ranges from
conservative (pelvic floor physiotherapy, a vaginal pessary — a well-tolerated, effective non-
surgical option, particularly valuable for a woman wishing to avoid or delay surgery, or unfit for
surgery) through to surgical repair (various approaches per the compartment involved and the
patient's fertility/sexual-activity preferences).

**Urinary incontinence — the types and their discriminators.** **Stress urinary incontinence**:
involuntary leakage with increased intra-abdominal pressure (coughing, sneezing, laughing, exercise)
— due to urethral sphincter/pelvic floor weakness, managed with pelvic floor physiotherapy first-
line, with surgical options (e.g. a mid-urethral sling) for refractory cases. **Urge incontinence
(overactive bladder)**: sudden, strong urge to void with involuntary leakage, often with urinary
frequency/nocturia — due to detrusor overactivity, managed with bladder training, and
pharmacotherapy (antimuscarinics or a beta-3 agonist) where conservative measures are insufficient,
with attention to antimuscarinic side effects (dry mouth, constipation, and — particularly relevant
in an older patient — cognitive effects/delirium risk with anticholinergic burden). **Mixed
incontinence**: features of both, requiring a management plan addressing both components,
prioritised by which is more bothersome to the patient. **Overflow incontinence**: continuous or
frequent small-volume leakage from a chronically over-distended bladder (from outlet obstruction or
an underactive detrusor, e.g. in diabetic autonomic neuropathy) — a **post-void residual volume**
measurement is the key discriminating investigation, distinguishing this mechanism from the two
above and changing management entirely (toward addressing retention — intermittent
self-catheterisation, addressing the obstructive cause — rather than the pelvic-floor/bladder-
training approaches used for stress/urge incontinence).

**Consultant traps & pearls**
- Oestrogen-only hormone therapy in a woman with an intact uterus is a specific, avoidable
  endometrial-hyperplasia risk — always confirm uterine status before selecting the regimen.
- Significant prolapse can mask underlying stress incontinence — counsel patients that surgical
  prolapse repair may unmask urinary leakage that was not apparent before surgery.
- Overflow incontinence is missed when a post-void residual is never measured — it is easily
  mistaken for urge or mixed incontinence without this one simple test.
- Postmenopausal bleeding management (§2.10) applies without exception in this age group — no
  amount of "it's probably just atrophy" reasoning substitutes for the actual workup.

---

## 3. The normals

**Obstetric normals — the physiological changes that define what "normal" looks like on this
ward** [EK, consistent with standard obstetric-physiology teaching unless otherwise cited]:
- **Blood pressure**: falls in the first and second trimesters (nadir commonly around **mid-
  pregnancy, ~20–24 weeks**, from progesterone-mediated systemic vasodilation reducing systemic
  vascular resistance), then rises back toward (but should not exceed) pre-pregnancy levels by
  term. A BP that looks "normal" by non-pregnant standards in the third trimester, if it represents
  a significant rise from the patient's own second-trimester nadir, can already be clinically
  meaningful — trend against the individual's own baseline, not only against a population cutoff.
- **Blood volume/anaemia**: plasma volume expands by roughly **40–50%** across pregnancy while red
  cell mass expands by a smaller **~20–30%** — the resulting hemodilution is the **physiological
  ("dilutional") anaemia of pregnancy**, with Hb nadir commonly around **28–32 weeks**; this is
  expected and distinct from a true nutritional/pathological anaemia (§2.7).
- **White cell count**: rises physiologically across pregnancy, commonly into the **10–15 ×10⁹/L**
  range, and can rise further — sometimes markedly — during labour and the immediate puerperium
  from the physiological stress response, **without infection**; a WCC that would trigger a sepsis
  work-up outside pregnancy may be an unremarkable intrapartum finding — the trend and the clinical
  picture (fever, tachycardia, tenderness) discriminate, not the number alone.
- **ALP**: rises substantially in the third trimester from the **placental isoenzyme** contribution
  — a raised ALP in late pregnancy is expected and is not, by itself, evidence of hepatobiliary
  disease (unlike a raised ALT/AST, which remains abnormal and should be actively investigated,
  §2.1's HELLP discussion).
- **D-dimer**: rises progressively across pregnancy as part of the physiological hypercoagulable
  state, and is essentially always elevated by the third trimester relative to non-pregnant
  reference ranges — **this is why D-dimer is not a useful rule-out test for VTE in pregnancy**
  (§2.7, §4).
- **Renal function**: GFR rises by roughly **50%** from early pregnancy, so **creatinine and urea
  fall** — the pregnancy-adjusted normal creatinine ceiling is commonly cited around
  **<70–77 µmol/L**, meaningfully lower than the non-pregnant reference range; a creatinine in the
  "normal for a non-pregnant adult" range can already represent significant renal impairment in a
  pregnant woman (§2.1, §4).
- **Respiratory/acid-base**: progesterone drives a physiological hyperventilation, producing a
  compensated respiratory alkalosis — a normal pregnancy **PaCO₂ is lower than the non-pregnant
  normal**, commonly around **~4.0 kPa (~30 mmHg)**, with a compensatory fall in serum bicarbonate;
  a "normal" (non-pregnancy-adjusted) PaCO₂ in a pregnant woman with respiratory distress can
  actually represent significant CO₂ retention relative to her expected physiological range.
- **Symphysis-fundal height (SFH)**: from approximately **20 to 36 weeks**, SFH measured in
  centimetres approximates gestational age in weeks, **within roughly ±2 cm** — a useful bedside
  screening tool for growth restriction or macrosomia/polyhydramnios, though it is a screening
  test, not a diagnostic one, and a discrepancy prompts formal ultrasound growth assessment rather
  than reassurance or alarm on its own.
- **Normal fetal heart rate**: baseline **110–160 bpm** (§2.5, §5).
- **Normal labour progress**: active first stage progressing at a partogram-expected rate of
  roughly **≥1 cm/hour** from the point active labour is established, with a 4-hour action-line
  buffer (§2.5, §5); second-stage duration norms vary by parity and analgesia/anaesthesia use
  (nulliparous labour and epidural analgesia both lengthen the expected normal second stage) — a
  fixed universal time limit is less useful than tracking progress and descent against the
  individual labour's trajectory.
- **Normal blood loss**: **<500 mL** for vaginal delivery, **<1000 mL** for caesarean section
  (§2.3) — the thresholds that define the transition from "normal delivery loss" to PPH.
- **Glucose handling**: pregnancy is a "diabetogenic" state overall (placental hormones — human
  placental lactogen, progesterone, cortisol — increase insulin resistance, particularly in the
  second half of pregnancy), while fasting glucose tends to run slightly **lower** than
  non-pregnant normal (continuous fetal glucose draw) — this combination of lower fasting but higher
  post-prandial glucose is exactly why GDM screening uses pregnancy-specific thresholds rather than
  standard diabetes diagnostic criteria (§2.7).
- **Platelets**: a mild physiological fall across pregnancy ("gestational thrombocytopenia") is
  common and benign, typically remaining **above ~100 ×10⁹/L**; a fall below this, or a fall that
  is steep/associated with other HELLP features, is pathological, not physiological (§2.1, §4).

**Gynaecological normals:**
- **Menstrual cycle**: normal cycle length **21–35 days**, with menstrual flow duration typically
  **2–7 days** [EK].
- **The β-hCG discriminatory zone**: commonly cited around **1500–2000 mIU/mL** as the level above
  which an intrauterine pregnancy would be expected to be visible on transvaginal ultrasound if
  present — used as a guide alongside serial trends and clinical picture, not as an isolated
  rule-out threshold (§2.8, §4).
- **Endometrial thickness bands**: proliferative-phase endometrium up to roughly **~8 mm**,
  secretory-phase up to roughly **~16 mm** in a premenopausal woman across a normal cycle [EK];
  postmenopausal endometrium **≤4 mm** carries strong (though, per current evolving guidance, not
  absolute in higher-risk patients) reassurance against endometrial cancer in the context of
  postmenopausal bleeding (§2.10, §2.12).

---

## 4. Cross-cutting investigation interpretation

**The β-hCG — end-to-end interpretation.** A single β-hCG value answers "is she pregnant," nothing
more — its diagnostic power in early pregnancy comes from the **trend**, not the absolute number.
**The discriminatory zone** (§3) is a guide to when an intrauterine pregnancy should become visible
on TVUS, not an ectopic rule-in/rule-out threshold used alone. **The 48-hour trend in pregnancy of
unknown location**: a normally progressing early intrauterine pregnancy shows a **rise of at least
~53% (roughly 50–66% depending on the baseline level)** over 48 hours [EK, Barnhart-derived curve];
a **rise below this minimal threshold, or a plateau**, is suspicious for ectopic pregnancy (though
not universally diagnostic — some viable pregnancies rise more slowly, and repeat scanning/clinical
correlation is still needed); a **falling** level indicates a failing pregnancy — either
miscarriage or a spontaneously resolving ectopic — with the *rate* of fall alone not reliably
distinguishing between the two, so further follow-up (scan, exam, continued serial levels to
zero) remains necessary. In gestational trophoblastic disease surveillance (§2.8), the same trend-
based logic applies in reverse: an appropriately falling β-hCG post-evacuation is reassuring, while
a **plateau or rise** signals GTN.

**The obstetric bloods panel in the sick mother.** **The HELLP set**: platelets (trend, not single
value — a falling count within the "normal" range is still meaningful), LDH (raised — haemolysis
marker), haptoglobin (falls — consumed by free haemoglobin, an earlier and more specific haemolysis
marker than LDH alone), peripheral blood smear (schistocytes — direct visual evidence of
microangiopathic haemolysis), AST/ALT (raised — hepatocellular involvement), and urate (raised,
non-specific but supportive) — read together, not any single value in isolation, and interpreted
against the **Tennessee and Mississippi HELLP classification systems** (§5) which formalise the
severity grading these values feed into. **The DIC screen in abruption/PPH**: PT/APTT (prolonged),
platelets (falling), and — critically — **fibrinogen**, which is the single most sensitive and
earliest-falling marker in obstetric haemorrhage-associated coagulopathy and disproportionately
predicts the severity of ongoing/impending massive haemorrhage relative to PT/APTT alone, which can
remain deceptively near-normal until later in the process [EK, consistent with obstetric massive-
haemorrhage-protocol literature] — a **fibrinogen <2 g/L in the setting of ongoing obstetric
haemorrhage is already abnormally low relative to the elevated pregnancy baseline** (pregnancy
fibrinogen normally runs higher than the non-pregnant range) and should trigger cryoprecipitate/
fibrinogen concentrate replacement proactively rather than waiting for a lower absolute threshold
that would apply outside pregnancy.

**CTG interpretation, systematically — DR C BRAVADO restated as a working checklist** (§2.5):
**D**efine risk (why is this CTG being done — antenatal risk factors, intrapartum indication);
**C**ontractions (frequency, duration, and — critically — **uterine hyperstimulation**, more than
5 contractions in 10 minutes, which itself can cause fetal distress and is a reversible, correctable
cause of an abnormal trace by reducing/stopping oxytocin or tocolysing); **B**aseline **R**ate
(110–160 bpm normal, §3); **V**ariability (5–25 bpm normal); **A**ccelerations (reassuring when
present); **D**ecelerations (early/benign vs variable vs late/pathological vs prolonged, §2.5);
**O**verall impression, synthesised into the three-tier Normal/Suspicious/Pathological
classification (§5) that drives the escalation pathway.

**The pregnancy-adjusted reference range table (summary, cross-referenced to §3)** [EK, standard
obstetric-physiology teaching]:

| Parameter | Non-pregnant normal | Pregnancy-adjusted normal | Trap if unadjusted |
|---|---|---|---|
| Creatinine | ~60–100 µmol/L | **<70–77 µmol/L** | A "normal" non-pregnant creatinine misses early pre-eclamptic/AKI renal impairment |
| Haemoglobin | ~120–150 g/L | Physiological nadir (dilutional) ~28–32 wk | Treating expected dilutional anaemia as requiring the same aggressive workup as true anaemia |
| WCC | ~4–11 ×10⁹/L | Up to ~10–15 ×10⁹/L; higher intrapartum | Chasing a sepsis work-up on an expected physiological/intrapartum leucocytosis |
| ALP | Normal adult range | Markedly raised (placental isoenzyme) | Misreading physiological ALP rise as hepatobiliary disease |
| D-dimer | Age-adjusted cutoff | Progressively elevated across pregnancy | Using D-dimer to "rule out" VTE in pregnancy |
| PaCO₂ | ~4.7–6.0 kPa | **~4.0 kPa** (compensated resp. alkalosis) | A "normal" PaCO₂ in a breathless pregnant woman can represent significant retention for her |
| Platelets | ~150–400 ×10⁹/L | Mild physiological fall, generally **>100** | Missing a HELLP-range fall because the count is still "in range" by non-pregnant standards |
| Fibrinogen | ~2–4 g/L | Runs higher than non-pregnant baseline | A fibrinogen that looks "normal" outside pregnancy can already be critically low for a haemorrhaging obstetric patient |

**TVUS in early pregnancy — what confirms viability/location.** A **gestational sac** is the
earliest visible structure (from roughly 4.5–5 weeks transvaginally); a **yolk sac** within the sac
confirms an intrauterine location (excludes a pseudosac, an endometrial fluid collection that can
mimic an early gestational sac in the context of an ectopic pregnancy — a specific, examinable
diagnostic trap); a **fetal pole with cardiac activity** (typically visible from roughly 6 weeks
transvaginally) confirms viability. **Absence of an intrauterine pregnancy on TVUS with a positive
β-hCG is a pregnancy of unknown location, not a confirmed ectopic**, until further data (serial
β-hCG trend, repeat scan, or direct visualisation of an adnexal mass with a positive pregnancy test)
clarifies the diagnosis (§2.8) — TVUS findings are interpreted together with the β-hCG trend, never
in isolation.

---

## 5. Scores & structured tools

- **The partogram** (§2.5): cervical dilatation vs time from active labour onset; **alert line**
  at an expected **~1 cm/hour**; **action line 4 hours to the right** of the alert line, triggering
  active intervention/reassessment for CPD; also tracks fetal heart rate, contractions, liquor,
  moulding/caput, maternal vitals, and urine output/ketones on the same chart.
- **Bishop score** (cervical favourability for induction of labour): five components scored 0–3
  (dilatation, effacement, station) or 0–2 (consistency, position), total **0–13**; **≥8 = favourable
  (ripe) cervix**, good prospect of successful induction/vaginal delivery; **≤6 = unfavourable**,
  lower prospect, often prompting cervical ripening (e.g. prostaglandin/mechanical methods) before
  oxytocin induction [EK].
- **CTG classification (NICE/FIGO three-tier, §2.5, §4)**: **Normal/reassuring** (no non-reassuring
  or abnormal features); **Suspicious/non-reassuring** (one non-reassuring feature); **Pathological/
  abnormal** (two or more non-reassuring features, or any single abnormal feature) — drives the
  escalation pathway from conservative intrauterine resuscitation through to expedited delivery.
- **Pre-eclampsia with severe features — the criteria** (§2.1): BP ≥160/110 mmHg, or any of severe
  headache unresponsive to analgesia, visual disturbance, epigastric/RUQ pain, hyperreflexia/
  clonus, platelets <100 ×10⁹/L, significantly deranged LFTs, rising creatinine, pulmonary oedema,
  or HELLP features — used as a structured checklist, not a single-item trigger.
- **Magnesium toxicity monitoring** (§2.1): hourly respiratory rate (**<12/min** = stop/reassess),
  patellar reflexes (loss = stop/reassess), urine output (**<25 mL/hour** = caution/dose reduction);
  approximate serum bands — therapeutic ~2–4 mmol/L, reflex loss ~3.5–5, respiratory depression
  ~5–6.5, cardiac arrest risk from ~7.5 mmol/L upward [EK].
- **APGAR score**: five components — **A**ppearance (colour), **P**ulse (heart rate), **G**rimace
  (reflex irritability), **A**ctivity (tone), **R**espiration — each scored **0–2**, total **0–10**,
  assessed at **1 and 5 minutes** of life (and again at 10 minutes if the 5-minute score is <7); a
  screening/communication tool for immediate neonatal condition and response to resuscitation, not a
  long-term prognostic instrument in isolation [EK].
- **MEOWS (Modified Early Obstetric Warning Score)**: an obstetric-specific track-and-trigger tool
  (respiratory rate, oxygen saturation, temperature, systolic and diastolic BP, heart rate, level of
  consciousness/AVPU, sometimes pain/lochia/proteinuria depending on the local chart version)
  calibrated to pregnancy-adjusted normal ranges (§3) rather than standard adult early-warning
  scores, specifically because standard adult scores under-call obstetric deterioration given
  pregnancy's altered baseline vitals — triggering a defined escalation response (senior review,
  increased observation frequency) at specified abnormal-parameter thresholds [EK, widely adopted
  UK-originated tool used across SA obstetric units].
- **HELLP classification**: **Tennessee classification** — a binary "HELLP present" definition:
  platelets **<100 ×10⁹/L**, AST **≥70 IU/L**, LDH **≥600 IU/L** [EK]. **Mississippi
  classification** — three severity classes by platelet nadir: **Class 1** (most severe) platelets
  **<50 ×10⁹/L**; **Class 2** platelets **50–100 ×10⁹/L**; **Class 3** (mildest) platelets
  **100–150 ×10⁹/L**, each with associated AST/LDH thresholds, used to grade severity and guide
  monitoring intensity rather than a simple present/absent call [EK].
- **PALM-COEIN** (§2.10): the FIGO structural/non-structural framework for classifying abnormal
  uterine bleeding aetiology — Polyp, Adenomyosis, Leiomyoma, Malignancy/hyperplasia; Coagulopathy,
  Ovulatory dysfunction, Endometrial, Iatrogenic, Not yet classified.
- **Risk of Malignancy Index (RMI)** (§2.12): **RMI = U × M × CA-125**; U (ultrasound feature score)
  0/1/3; M (menopausal status) 1 (premenopausal)/3 (postmenopausal); conventional referral cutoff
  **>200**.
- **Robson classification (the "Ten Group" system) for caesarean-section audit**: classifies every
  delivery into one of 10 mutually exclusive, jointly exhaustive groups based on obstetric
  characteristics knowable at the start of labour/at admission — parity, previous caesarean history,
  gestational age (term vs preterm), fetal lie/presentation (cephalic/breech/transverse), onset of
  labour (spontaneous/induced/pre-labour caesarean), and number of fetuses [EK, WHO-endorsed
  standard for CS-rate audit and international benchmarking]. Its clinical value is that it allows
  a facility or health system to compare **like-for-like groups** (e.g. nulliparous women with a
  single cephalic term fetus in spontaneous labour) across time or between institutions, rather than
  comparing a single crude overall CS rate that conflates fundamentally different-risk populations —
  a facility's rising CS rate driven by an increasing proportion of high-risk referrals (appropriate)
  looks identical to one driven by declining obstetric practice standards (inappropriate) unless
  Robson-grouped, which is exactly why it is the WHO-recommended tool for CS-rate quality audit
  rather than a crude percentage.

---

## 6. SA-specific reality

**The NCCEMD Saving Mothers report and the "big five."** The **National Committee for Confidential
Enquiries into Maternal Deaths (NCCEMD)** produces the **Saving Mothers** report (historically
triennial, now annual reporting cycles feeding the same confidential-enquiry process), the SA
health system's structured audit of every maternal death, classifying each by cause and — crucially
— by **avoidability**, feeding directly back into clinical guideline and training priorities. The
persistent **"big five"** causes of maternal death in South Africa [EK, consistent with NCCEMD
Saving Mothers reporting cycles and this session's search-confirmed 2023 report finding that
"non-pregnancy-related infections and medical and surgical conditions remain the most common causes
of maternal death, followed by hypertension and obstetric haemorrhage" — exact current-report
ranked percentages should be verified against the specific in-force report edition given periodic
recent re-ordering between infection/haemorrhage/hypertension across triennia]:
1. **Non-pregnancy-related infections** — overwhelmingly **HIV/TB-related**, historically the
   single largest category, reflecting South Africa's HIV burden intersecting with pregnancy; this
   is the direct clinical rationale for HIV/TB remaining persistently high on every "always ruling
   out" list in this dossier (§1, §2.6, §2.7), not a generic nod to prevalence.
2. **Obstetric haemorrhage** — antepartum and postpartum combined (§2.2, §2.3), with recognition-
   lag and delayed escalation (including delayed hysterectomy) recurring themes in the confidential-
   enquiry "avoidable factors" analysis.
3. **Hypertensive disease of pregnancy** (§2.1) — with delayed recognition of severe features,
   inadequate BP control, and delayed delivery among the recurring avoidable-factor findings.
4. **Pregnancy-related sepsis** (§2.6) — including septic miscarriage/unsafe abortion (§2.8, below).
5. **Pre-existing medical and surgical conditions** — cardiac disease, and other comorbidity
   entering pregnancy already present rather than arising from it (§2.7).
The **maternal mortality ratio** has fluctuated with the COVID-19 pandemic superimposed on the
underlying trend (a reported ~30% and ~47% year-on-year increase during 2020 and 2021
respectively, with the ratio declining back toward pre-pandemic levels by 2022, reported around
**~109.6 maternal deaths per 100,000 live births** for 2022) [confirmed via WebSearch synthesis of
the NCCEMD/Saving Mothers reporting, this session — exact current-edition figures should be
verified against the specific in-force report].

**The Guidelines for Maternity Care and the district/regional/tertiary referral tiers.** SA
obstetric care is structured across a tiered referral system: **district-level** hospitals (often
with no on-site O&G specialist — care delivered by medical officers/family physicians, sometimes
with periodic outreach specialist support), **regional** hospitals (specialist O&G cover, higher-
level surgical/anaesthetic capacity), and **tertiary/academic** centres (subspecialist maternal-
fetal medicine, gynae-oncology, high-risk obstetric and neonatal intensive care capacity). Risk
stratification at booking and continuously through pregnancy (§1) determines the appropriate level
of care and delivery site, with a low threshold to escalate the referral tier as soon as risk
factors emerge, rather than waiting for a crisis to force an unplanned transfer.

**BANC-Plus — the antenatal care schedule.** South Africa's **Basic Antenatal Care Plus (BANC-
Plus)** programme implements the **WHO 2016 antenatal care model of a minimum of 8 contacts**
(revised from the older 4-visit model), aiming for first contact in the first trimester and an
increased concentration of contacts in the third trimester (34–38 weeks specifically identified as
where additional contacts most reduce stillbirth risk) [confirmed via WebSearch, this session].
Content at each contact is structured (risk screening, BP/urine/weight, HIV testing per the
schedule below, syphilis screening, haemoglobin, symptomatic screening for TB, health education) —
the point of the "Plus" model is front-loaded, structured risk detection rather than passive
attendance.

**PMTCT and the 2023 ART guidelines.** Universal test-and-treat: HIV testing offered at first
antenatal contact (and repeated later in pregnancy/at delivery to catch seroconversion), **same-day
ART initiation** regardless of CD4 count for any newly diagnosed pregnant woman, viral load checked
at first ANC visit and again in the third trimester (commonly ~36 weeks) to inform delivery
planning, with the **viral-load-drives-mode-of-delivery logic** (§2.7) — well-suppressed viral load
supports a normal obstetric approach to delivery mode, while a high/unknown viral load close to
term shifts toward elective caesarean as a transmission-risk-reduction measure, alongside
intensified neonatal ART prophylaxis calibrated to the maternal virological risk picture. An
elevated viral load (**>50 copies/mL**) at any point in pregnancy/breastfeeding triggers active
adherence support and regimen review as an urgent action item, not a routine follow-up
[WebSearch-confirmed, this session].

**The CTOP Act and the unsafe-abortion/septic-miscarriage burden.** The legal framework (§2.13) is
liberal, but access gaps (facility/provider availability, geographic barriers, provider
conscientious objection reducing effective access, stigma) mean **unsafe abortion and septic
miscarriage remain live differentials** for a septic, bleeding reproductive-age woman in SA clinical
practice (§2.6, §2.8) — a functioning legal pathway does not, by itself, guarantee every woman
reaches a safe provider in time, and clinicians should ask about pregnancy-termination attempts
sensitively and non-judgementally as part of the history in this presentation, both for clinical
source-identification and because punitive or judgemental questioning is itself a barrier to future
safe-care-seeking.

**The district-hospital reality.** A district hospital without an on-site O&G specialist changes the
risk calculus of everyday obstetric decisions (§2.5): the **transfer-in-labour decision** — whether
to attempt local vaginal delivery, transfer antenatally before labour, or transfer emergently once a
complication has emerged — is a core district-level clinical skill, weighing the specific patient's
risk profile against realistic local capability (is there theatre and anaesthetic cover overnight,
is blood available or does it need to be sourced from a regional blood bank with transport delay, is
there a functioning neonatal resuscitation/referral pathway). **Blood availability** at district
level is frequently more limited than at regional/tertiary centres, directly shaping the threshold
for pre-emptive crossmatch/transfer in any patient with APH/PPH risk factors identified antenatally.
**CS-capability** (is there a doctor credentialed and available to operate, and an anaesthetic
provider, at this specific hospital, right now) is a real, continuously-varying constraint that
shapes the safe management plan for labour admissions in a way that a purely textbook obstetric
protocol does not capture — recognising and planning around this constraint, rather than assuming
tertiary-level backup is always available, is a defining feature of safe district-level obstetric
practice.

**Notifiable and medico-legal touchpoints.** **Every maternal death is notifiable** and subject to
structured confidential enquiry through the **NCCEMD/MPDSR (Maternal and Perinatal Death
Surveillance and Response)** system — a legal and clinical-governance requirement, not an optional
audit exercise, and the mechanism by which the "big five" causes and their avoidable-factor patterns
(§ above) are identified and fed back into national guideline revision. **Perinatal mortality
meetings**, structured through the **Perinatal Problem Identification Programme (PPIP)**, perform
the equivalent structured review function for stillbirths and early neonatal deaths, classifying
avoidable factors at the facility level to drive local quality improvement. The **Road-to-Health
Book** (the child health record) and the **Maternal Case Record (MCR)** are the structured clinical
documentation tools that carry risk-screening, antenatal-visit, and delivery data forward across
the continuum of care and across facilities/referral transfers — complete, accurate documentation
in these records is both a direct clinical-safety issue (the receiving facility's entire picture of
antenatal risk may depend on what is legibly recorded there) and the raw material for the
audit processes above.

---

## Source ledger

**Fetched/searched (WebSearch, synthesised with source links returned by the tool — treat as
verified-to-the-extent-a-search-summary-can-be, not as a primary-document pinpoint citation unless
otherwise noted):**
- **NCCEMD Saving Mothers reporting** (2021/2022/2023 report cycles) — the "big five" cause
  categories, the 2020–2022 COVID-19-era mortality-ratio fluctuation (~30%/~47% year-on-year rise
  in 2020/2021, decline to ~109.6/100,000 live births by 2022), and the framing that non-pregnancy-
  related infections/medical-surgical conditions, hypertension, and obstetric haemorrhage remain the
  leading categories — via search of health.gov.za-linked and spotlightnsp.co.za-mirrored report
  summaries; **direct PDF fetch of both the health.gov.za and spotlightnsp.co.za report documents
  returned HTTP 403** in this session, so exact current-edition ranked percentages for each of the
  five causes should be verified against the specific in-force report before being encoded into
  production clinical-workflow logic.
- **SASOG Postpartum Haemorrhage Guideline (2.0/3.0)** and the WHO/E-MOTIVE PPH bundle — located via
  search (sasog.co.za, knowledgehub.health.gov.za, WHO/Lancet Global Health coverage of the 2023
  consolidated PPH guideline and E-MOTIVE trial); **direct PDF fetch of the SASOG guideline document
  returned HTTP 403**; the "first response at 500 mL," TXA-in-first-response-bundle, and general
  uterotonic-ladder (oxytocin first-line, ergometrine/misoprostol second-line, carboprost third-
  line) sequencing drawn from the search-summarised description of SA/WHO PPH guidance, cross-
  checked against this app's own hardened, evaluated content (`eval/og/3-consultant.md`,
  `eval/og/4-superspecialist.md`) for dose-level consistency — exact current SA STG/EML mg doses for
  each uterotonic should be verified against the in-force formulary edition.
- **CTOP Act 92 of 1996 gestational-band structure** (≤12 weeks on request; 13–20 weeks with a
  medical practitioner's opinion against defined criteria; ≥21 weeks requiring two practitioners and
  a narrower life/severe-malformation/fetal-injury test) — via search of gov.za, saflii.org, and
  secondary legal/clinical commentary; the **2021 CTOP Clinical Guideline PDF (health.gov.za)
  returned HTTP 403** on direct fetch — exact current medical/surgical regimen doses at each
  gestational band should be verified against the in-force 2021 (or later) clinical guideline
  edition.
- **2023 ART Clinical Guidelines (NDoH) PMTCT framework** — universal test-and-treat, same-day ART
  initiation, viral load testing schedule (first ANC visit, 3 months post-initiation if ART-naïve,
  at delivery, 6 months postpartum), and the >50 copies/mL "urgent action" threshold — via search of
  teampata.org, sahivsoc.org, and PMC-indexed commentary on the 2023 guideline; the specific
  numeric viral-load threshold used for the **mode-of-delivery** decision was **not directly
  confirmed** in this session's search results (the >50 copies/mL threshold found relates to
  ongoing virological-failure action, not specifically to the delivery-mode decision) — the
  commonly-cited international mode-of-delivery threshold (~1000 copies/mL) is presented as [EK]
  pending direct confirmation against the current in-force SA guideline text.
- **WHO 2016 antenatal care recommendations / SA BANC-Plus implementation** — the 8-contact model,
  first-trimester first-contact target, and the third-trimester (34–38 week) contact-concentration
  stillbirth-reduction rationale — via search of PMC-indexed SA-specific BANC-Plus implementation
  literature and WHO policy summaries.
- **Bishop score components and scoring** — via search of StatPearls/Medscape/perinatology.com
  calculator descriptions; standard, well-established scoring structure.
- **Risk of Malignancy Index (RMI) formula and cutoff** (U × M × CA-125, cutoff >200) — via search
  of the original Jacobs-derived RMI literature and subsequent validation/comparison studies
  (PubMed/PMC-indexed).
- **NICE/FIGO three-tier CTG classification** and the deceleration-type definitions (early/
  variable/late/prolonged) — via search of FIGO consensus guideline coverage and comparative
  CTG-classification-system literature.
- **Postmenopausal bleeding endometrial-thickness threshold (≤4 mm)** and the recent ACOG guidance
  shift toward biopsy-regardless-of-thickness in higher-risk patients — via search of ACR/ACOG
  practice-update coverage (jacr.org, acog.org) and comparative sensitivity/specificity literature
  at the 4 mm/5 mm thresholds.
- **β-hCG discriminatory zone (~1500–2000 mIU/mL) and its documented limitations** (including the
  ACEP Level B recommendation against using it as a stand-alone ectopic-exclusion test) — via
  search of emergency-medicine/radiology literature (radiologykey.com, canadiem.org, ucsf.edu-
  hosted teaching material, psnet.ahrq.gov).

**[EK] — established knowledge, not independently fetched this session (standard obstetric/
gynaecological teaching consistent across Williams Obstetrics, RCOG Green-top Guidelines, FIGO
consensus documents, and mainstream obstetric/gynaecological references), and cross-checked for
internal consistency against this app's own hardened, live-evaluated O&G content in
`docs/clinical-build/eval/og/3-consultant.md`, `4-superspecialist.md`, and
`LIVE-STRESS-FINDINGS.md` where that content independently corroborates a specific dose/threshold:**
MgSO₄ Zuspan/Pritchard-derived loading-and-maintenance regimen and toxicity bands; labetalol/
nifedipine/hydralazine acute antihypertensive dosing structure and the "don't overshoot" perfusion
caveat; oxytocin/ergometrine/misoprostol/carboprost PPH doses and the ergometrine-hypertension
contraindication; tranexamic acid timing/re-dosing in PPH (WOMAN trial); massive transfusion 1:1:1
ratio and fibrinogen-replacement rationale; antenatal corticosteroid regimen (betamethasone/
dexamethasone) and the 24–34-week window; MgSO₄ fetal-neuroprotection indication and its distinction
from the eclampsia-prophylaxis indication; GBS risk-factor-based prophylaxis approach and
benzylpenicillin/ampicillin dosing structure; the ORACLE-trial-derived co-amoxiclav/NEC avoidance in
PPROM; the partogram alert-line/action-line structure; DR C BRAVADO CTG-reading mnemonic; HELPERR
shoulder-dystocia sequence; cord-prolapse hand-elevation/positioning management; uterine-rupture
presentation pattern; the Couvelaire-uterus mechanism; anti-D dosing (1500 IU/300 µg) and the
Kleihauer-Betke >4 mL top-up-dosing principle; WHO/IADPSG GDM diagnostic thresholds and pregnancy
glycaemic targets; VTE-in-pregnancy risk multiplier, D-dimer physiological-rise rationale, and
RCOG-consistent prior-VTE automatic-prophylaxis principle; methotrexate ectopic-pregnancy criteria
and day-4/day-7 15%-fall rule; molar-pregnancy surveillance schedule and GTN risk percentages;
ovarian-torsion Doppler-unreliability principle and the ovarian-conservation-over-oophorectomy shift
in surgical practice; PALM-COEIN framework; FIGO 2018 cervical-cancer staging structure;
Robson Ten-Group classification structure; APGAR score structure; MEOWS concept and rationale;
Tennessee/Mississippi HELLP classification thresholds; WHO Medical Eligibility Criteria framework
for contraception; emergency-contraception method/window comparison; pelvic-organ-prolapse and
urinary-incontinence-type discriminators including the post-void-residual test for overflow
incontinence; the pregnancy-adjusted physiological reference-range set in §3/§4 (BP nadir,
dilutional anaemia, WCC/ALP/D-dimer rise, GFR-driven creatinine fall, compensated respiratory
alkalosis, SFH-vs-dates correlation).

**Not independently verified this session and flagged for confirmation before encoding into
production clinical logic:** exact current-edition SA STG/EML mg doses for every uterotonic,
antihypertensive, antibiotic, and corticosteroid regimen cited (oxytocin/ergometrine/misoprostol/
carboprost, labetalol/nifedipine/hydralazine, the endometritis/PID/GBS/latency-antibiotic
combinations, betamethasone/dexamethasone); the exact current-report NCCEMD Saving Mothers ranked
percentage breakdown of the "big five" causes; the exact SA 2023 ART Guidelines numeric viral-load
threshold specifically governing the mode-of-delivery decision (as distinct from the general
virological-failure-action threshold, which was confirmed); the exact current 2021-or-later CTOP
Clinical Guideline medical/surgical regimen doses at each gestational band; the exact current SA
national STI syndromic-management drug/dose combinations for vaginal discharge syndrome, lower
abdominal pain syndrome/PID, and other syndromic categories. All of the above were subject to a
systematic **HTTP 403** block on direct WebFetch to South African government (health.gov.za,
gov.za), SASOG, and several other domains (spotlightnsp.co.za, sasog.co.za, saflii.org) during this
research session, consistent with the pattern already documented in this app's other research
dossiers (e.g. `docs/clinical-build/research/psychiatry.md`) — WebSearch's synthesised results
(which draw on and cite these same underlying documents) were used as the best available substitute
where direct fetch failed, per this dossier's sourcing rules, and this app's own hardened,
live-evaluated O&G content (`docs/clinical-build/eval/og/`) was used as a secondary cross-check for
internal dose/threshold consistency where the two sources overlap.








