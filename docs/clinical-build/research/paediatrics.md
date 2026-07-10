# Paediatrics — Consultant Depth Dossier

*Target reader: the intern/MO covering a paediatric admission ward, a neonatal unit, or a
district-hospital "paeds casualty" alone at night in a South African state hospital, and the
MedAI engine standing behind them. Paediatrics already has v1 breadth content in the app
(general/neonatal/SAM sub-departments) — this dossier is the DEPTH layer that content lacks,
weighted toward neonatology, the critically ill child (PICU-level reasoning), and syndromic
reasoning, per the DEPTH-BAR six-part standard: the mental model; presenting syndromes worked to
full depth; the normals; cross-cutting investigation interpretation; scores/tools; SA-specific
reality.*

*Primary SA sources: **Hospital Level (Paediatric) Standard Treatment Guidelines and Essential
Medicines List, 5th Edition 2023** (NDoH); **Primary Health Care STG/EML** and the **IMCI South
Africa adaptation** (chart booklet, danger-signs and classification tables); **EPI-SA
immunisation schedule** (2024 revision — PCV13→PCV10 switch, hexavalent, rotavirus); **2023 ART
Clinical Guidelines for the Management of HIV in Adults, Pregnancy and Breastfeeding, Adolescents,
Children, Infants and Neonates** (NDoH) and the SA HIV Clinicians Society PMTCT/vertical
transmission prevention (VTP) guidance; **Children's Act 38 of 2005** (consent, mandatory
reporting, Form 22); **NICD Notifiable Medical Conditions list**; the **Road-to-Health Booklet**.
Global: **WHO Pocket Book of Hospital Care for Children** (2013, the direct ancestor of the SA
paediatric STG structure and IMCI), **APLS (Advanced Paediatric Life Support)**, **Nelson Textbook
of Pediatrics**, **AAP/ILCOR neonatal resuscitation and PALS algorithms**, **Ballard/New Ballard
Score**, **Bhutani/AAP hyperbilirubinaemia nomograms**. Several primary SA government PDFs return
403 to automated fetch (a known constraint) — values from them are given as mainstream
consensus and marked **[EK]** rather than fabricated; a fetched-vs-[EK] ledger closes the
document.*

---

## 1. The paediatrician's mental model

**Nothing is dosed, interpreted, or normal-ranged without first fixing age and weight.** Every
number a paediatrician looks at — a heart rate, a creatinine, a drug dose, a fluid volume, a
seizure threshold on a drug level — is meaningless until it is anchored to the child's age (and
often corrected/gestational age if ex-preterm) and current weight in kilograms. The single most
dangerous habit a junior brings from adult medicine is reading a paediatric vital sign or lab
value against an adult reference range. A HR of 150 is shock in a 10-year-old and normal in a
2-month-old. A single "normal" adult-anchored reflex kills children. **Weight-based dosing in
mg/kg (or mcg/kg) is the native unit of paediatric therapeutics** — every drug order is a
mg/kg-to-mg conversion done in the child's actual (or ideal, in obesity) weight, checked against a
maximum adult dose ceiling.

**The child compensates silently, then falls off a cliff.** Paediatric physiological reserve is
different in kind from adult reserve: children maintain cardiac output and blood pressure through
tachycardia and vasoconstriction for far longer than adults before decompensating, because a
child's myocardium has less contractile reserve to increase stroke volume — compensation is almost
entirely rate-driven. The consequence is the central teaching of paediatric emergency medicine:
**blood pressure is a late, sudden, pre-terminal sign** of shock in a child — normal BP does not
mean the child is not in shock; it often means the child is about to arrest. The paediatrician is
trained to read the *early* compensated signs (tachycardia, tachypnoea, delayed capillary refill,
cool peripheries, narrowing pulse pressure, altered mental state) as the actionable data, and to
treat a falling BP as a crash call, not a data point to trend.

**The caregiver is the monitor, and the history is often the only abnormal finding.** A
6-month-old cannot report chest pain, cannot localise abdominal pain, and often looks
disarmingly well between assessments even when seriously ill (the "compensated" phase again).
The caregiver's narrative — "she's not herself", "he won't feed", "she's just crying differently"
— is frequently the earliest and most sensitive marker of serious illness, more sensitive than a
single set of vitals or a cursory look. Dismissing caregiver concern ("mother says baby not right"
with an unremarkable exam) is a recognised pattern in paediatric mortality/morbidity reviews
preceding missed sepsis, missed intussusception, missed NAI. The paediatrician's reflex is to
**take "not himself" as a red flag phrase requiring a second look**, not reassurance-and-discharge
on a single normal observation set. Feeding refusal in an infant under 3 months is treated with
the same gravity as chest pain in an adult — it is a top-tier red flag for sepsis, meningitis, or
a duct-dependent cardiac lesion until proven otherwise.

**What the paediatrician is always secretly ruling out, in every encounter:**
1. **Sepsis in any unwell infant** — because the presentation of neonatal/early-infant sepsis is
   nonspecific (poor feeding, temperature instability, "not right") and because untreated it kills
   in hours, the default posture for any unwell infant under ~3 months is "septic until proven
   otherwise" — full septic screen and empiric antibiotics are started on a low threshold, not
   withheld pending certainty.
2. **Non-accidental injury (NAI)/abuse** — behind any injury pattern inconsistent with the stated
   mechanism or the child's developmental stage (a "rolled off the bed" fracture in a
   non-mobile infant, a spiral fracture in a pre-walker, bruising in a non-mobile baby, delayed
   presentation, inconsistent or changing histories between caregivers). This consideration is
   present on *every* injury encounter, not reserved for obviously suspicious cases.
3. **A congenital or underlying disease masquerading as a simple acute presentation** — the "first
   UTI" that is actually reflux/obstructive uropathy, the "reflux" that is a duct-dependent
   cardiac lesion, the "constipation" that is Hirschsprung's, the "failure to thrive" that is a
   metabolic disease or coeliac disease or an undiagnosed cardiac/renal lesion, the recurrent
   pneumonia that is an inhaled foreign body or an immunodeficiency.
4. **TB and HIV behind everything, in the South African context specifically** — a child with
   failure to thrive, recurrent infections, lymphadenopathy, chronic cough, or an atypical/severe
   course of a common illness is screened for both by reflex; South Africa carries one of the
   world's highest paediatric TB and vertically-acquired HIV burdens, and both diseases are
   noted for atypical, subacute, multisystem presentations that mimic other things (§2.3, §2.9,
   §6). An SA paediatrician who has not asked about the mother's HIV status and the child's TB
   contact history has not finished the history.

**The IMCI danger-signs reflex is a discipline, not a checklist to complete once.** Every child
under 5 presenting to any level of care in the SA public system is screened, on arrival and
repeatedly, for the **four IMCI general danger signs**: (1) unable to drink or breastfeed, (2)
vomiting everything, (3) convulsions (current illness), (4) lethargic or unconscious. Any one
positive sign classifies the child for **immediate referral/admission and pre-referral treatment**
regardless of the specific working diagnosis — the danger sign overrides the syndrome-specific
algorithm. This reflex exists because it is validated to catch children who are decompensating
faster than a full diagnostic work-up can proceed, and it is deliberately simple enough to be run
by any cadre at any point of contact (§5, §6). [EK/fetched — IMCI SA]

**Tempo is age-defined — neonate, infant, child, and adolescent are functionally different
specialties sharing a building.** A neonate (0–28 days) decompensates in hours and has a
transitional physiology (closing ductus, changing haemoglobin, immature renal/hepatic clearance,
minimal glycogen/fat reserve) that makes "normal for an adult sick day" reasoning actively
dangerous — this is why §2.1 is deliberately the deepest section of this dossier. An infant (1–12
months) is still physiologically fragile (apnoea risk, rapid dehydration, limited communication)
but has more reserve and a different disease spectrum (bronchiolitis, intussusception,
first-febrile-UTI). A child (1–12 years) has the most "typical" paediatric disease pattern and the
most reserve, but non-verbal or pre-verbal presentation persists into the toddler years. An
adolescent (>12 years) reintroduces adult-pattern disease (mental health, substance use, sexual
and reproductive health, trauma) layered on a body still maturing, and reintroduces autonomous
consent as a live clinical-legal question (§2.10, §6). A single differential list or a single
"normal" vital-sign range across this whole span is a category error — every syndrome section
below is explicitly age-banded.

---

## 2. Presenting syndromes — worked to depth

> Format per syndrome: **Differential (common / must-not-miss / zebra)** · **Discriminating
> history** · **Discriminating examination** · **Investigations + interpretation nuance** ·
> **Management anchors (SA STG/EML + IMCI/EPI anchors)** · **Consultant traps & pearls.**

### 2.1 THE NEONATE (day 0–28) — go deepest here

The neonatal section is the roadmap-named priority: neonates are the highest-mortality,
lowest-reserve, most nonspecifically-presenting population in the hospital, and SA carries a very
high neonatal mortality burden relative to under-5 mortality overall (§6).

#### 2.1.1 The sick neonate — sepsis, and "just not feeding"

**Differential of the unwell neonate:**
- *Common:* early- or late-onset sepsis, jaundice-related (§2.1.2), feeding/latch problems without
  sepsis, transient tachypnoea, mild hypoglycaemia in an at-risk infant.
- *Must-not-miss:* neonatal sepsis/meningitis (bacterial — the default assumption in any unwell
  neonate), duct-dependent congenital heart disease presenting as "collapse" (§2.1.5), inborn
  error of metabolism presenting as sepsis-mimicking encephalopathy/acidosis, necrotising
  enterocolitis (§2.1.8), congenital adrenal hyperplasia salt-wasting crisis (§2.7), non-accidental
  injury in a neonate (rare but real — always consider if injury/bruising present).
- *Zebra:* herpes simplex neonatal sepsis (vesicles, seizures, hepatitis, DIC — treat with
  aciclovir empirically if suspected, do not wait for confirmation), congenital syphilis,
  galactosaemia (E. coli sepsis is the classic co-presentation), urea cycle defects (hyperammonaemia
  with respiratory alkalosis, not the metabolic acidosis of sepsis).

**Early-onset sepsis (EOS, <72h, classically <7 days) vs late-onset sepsis (LOS, >72h–28 days) —
different organisms, different risk factors, same reflex to treat empirically first.**
- *EOS mechanism:* vertical transmission from maternal genital tract flora — Group B Streptococcus
  (GBS) and *E. coli* dominate globally; in SA public hospitals, *Klebsiella* species and other
  Gram-negatives are disproportionately important pathogens in EOS/LOS, reflecting nosocomial
  transmission pressure even in "early" presentations in overcrowded units [EK — SA neonatal
  bacteraemia surveillance]. EOS risk factors: maternal fever intrapartum, prolonged rupture of
  membranes (>18h), foul-smelling liquor, maternal GBS colonisation without adequate intrapartum
  prophylaxis, prematurity, chorioamnionitis.
- *LOS mechanism:* nosocomial (line-related, ventilator-associated, environmental) or
  community-acquired after discharge; *Staphylococcus* (coagulase-negative and *aureus*),
  *Klebsiella*, other Gram-negatives, and (later, community) *E. coli* UTI-related sepsis
  dominate. LOS risk rises steeply with prematurity, central lines, prolonged parenteral nutrition,
  and NICU length of stay.
- **"Just not feeding" is the single most important sentence in neonatal triage.** Neonatal sepsis
  does not reliably produce fever — a neonate may be *hypothermic*, normothermic, or febrile with
  sepsis, and temperature instability (either direction) is itself a sepsis sign, not a
  reassuring "no fever" negative. The classic nonspecific constellation — poor feeding/refusing
  the breast, lethargy, decreased activity, poor tone, apnoea or bradycardia episodes,
  temperature instability, irritability, a "not looking right" gestalt from the mother or nurse —
  **is** the sepsis presentation in a neonate; there is often no localising sign at all. Any one of
  these in the first 28 days of life should trigger a septic work-up, not observation.

**Discriminating history:** maternal intrapartum fever/prolonged rupture of membranes/GBS
status/antibiotic prophylaxis given, mode of delivery, resuscitation required at birth, feeding
pattern and volumes over the last 24h (a fall-off in volumes taken is often the earliest sign),
any vomiting/bilious vomiting, stooling pattern, any seizure-like activity (subtle — see §2.1.6),
maternal HIV/syphilis/TB status.

**Discriminating examination:** temperature (either direction abnormal), heart rate/respiratory
rate against neonatal norms (§3), capillary refill and peripheral perfusion, tone (floppy vs
normal vs irritable-hypertonic), fontanelle (bulging = raised ICP/meningitis, sunken = dehydration),
work of breathing, colour (pallor, mottling, central cyanosis), abdominal distension, umbilical
stump (redness/discharge/malodour = omphalitis, a portal for sepsis), skin (petechiae, pustules,
vesicles — HSV), a full **head-to-toe skin exam for any injury** (NAI reflex, even in neonates).

**Investigations + interpretation nuance:**
- **FBC** — a low or very high WCC and especially a **low absolute neutrophil count** or a raised
  **immature:total neutrophil (I:T) ratio >0.2** are more specific for neonatal sepsis than the
  total WCC alone, which is a poor discriminator in the first days of life because of wide
  physiological swings [EK].
- **CRP** — kinetics matter more than a single value: CRP is often normal at presentation (rises
  over 12–24h) and a single normal CRP does NOT exclude early sepsis; a **serial CRP that stays
  normal at 24–48h** is more reassuring for stopping antibiotics than one normal value at
  presentation. Procalcitonin rises faster than CRP but has a physiological peak in the first
  24–48h of life in ALL neonates (sepsis or not), limiting its use as a rule-in test in the very
  first days [EK].
- **Blood culture before antibiotics** — the single most important test; do not delay empiric
  antibiotics to obtain it if the child is unstable, but always attempt it first if it costs no
  meaningful delay.
- **Glucose, lactate, blood gas** — hypoglycaemia and metabolic acidosis both accompany sepsis and
  need correction in parallel with antibiotics, not sequentially.
- **Lumbar puncture** — indicated in suspected sepsis unless the infant is too unstable to tolerate
  positioning; neonatal meningitis can coexist with a "just bacteraemic-looking" picture and
  changes the antibiotic duration/choice; **neonatal CSF normal values differ from older children**
  (§4) — do not apply child/adult CSF reference ranges.
- **Urine (suprapubic aspirate or clean catch/catheter, not bag specimen)** for culture — a UTI
  can be the primary source, especially in LOS.
- **CXR** if respiratory signs, **stool studies** if diarrhoea, **surface swabs (ear, umbilicus)**
  are of limited value as they reflect colonisation, not infection.

**Management anchors [EK — mainstream neonatal sepsis practice, SA STG-aligned structure]:**
- Empiric first-line for early-onset sepsis: **ampicillin/penicillin + gentamicin** (covers GBS,
  *Listeria*, and most Gram-negatives) is the standard global/SA first-line combination.
- Empiric first-line for late-onset/nosocomial sepsis: broadened to cover
  *Staphylococcus*/resistant Gram-negatives per local unit antibiogram — often a
  **cloxacillin-or-vancomycin + aminoglycoside**, or a third-generation cephalosporin-based
  regimen where nosocomial Gram-negative resistance is a concern; **follow the local NICU
  antibiogram**, which varies materially by unit in SA given high nosocomial *Klebsiella* burden.
- Duration: typically 7–10 days for culture-confirmed bacteraemia without a focus, 14–21 days for
  meningitis (organism-dependent), shorter courses (36–48h) reasonable if cultures negative, CRP
  trend reassuring, and the infant is clinically well — "rule-out sepsis" courses should not
  default to a full 7–10 days if the pre-test probability and trend are both low. [EK]
- If HSV is a real possibility (maternal genital lesions, vesicles, seizures, hepatitis/DIC
  picture, CSF pleocytosis with negative Gram stain) — add **empiric IV aciclovir** while awaiting
  PCR; untreated neonatal HSV disseminated disease has very high mortality and treatment delay is
  the preventable driver of death. [EK]

**Consultant traps & pearls:**
- *Trap:* treating a normal CRP at presentation as sufficient to withhold antibiotics in a
  clinically unwell neonate — CRP lags the clinical picture; treat the baby, not the number.
- *Trap:* using an adult/older-child temperature threshold — hypothermia in a neonate is just as
  concerning as fever and is often the *only* sign.
- *Pearl:* "the baby who is just not feeding well" gets the same urgency as an adult with crushing
  chest pain — this single phrase should trigger vitals, glucose, and a decision about a septic
  screen within minutes, not at the end of a routine round.
- *Pearl:* always examine the whole undressed baby, every time — a missed umbilical infection,
  petechial rash, or bruise changes the entire differential and legal obligations.

#### 2.1.2 Neonatal jaundice, end to end

**The single organising principle: hours-of-life, not days-of-life, anchors every jaundice
decision in the first week.** Jaundice visible **before 24 hours of life is pathological until
proven otherwise** and mandates urgent total serum bilirubin (TSB) measurement and work-up —
"physiological jaundice" is a diagnosis of exclusion that by definition cannot start before day 2.

**Unconjugated (indirect) hyperbilirubinaemia — differential:**
- *Common:* physiological jaundice (peaks day 3–5 term, day 5–7 preterm, from the normal
  transition of high fetal RBC mass + shorter RBC lifespan + immature hepatic conjugation),
  breastfeeding-associated jaundice (inadequate intake in the first days, exaggerates
  physiological jaundice), breast-milk jaundice (later onset, persists weeks, well infant,
  diagnosis of exclusion), bruising/cephalhaematoma resorption.
- *Must-not-miss:* **haemolytic disease** — Rh isoimmunisation, ABO incompatibility (mother O,
  baby A/B — usually milder than Rh but far more common), G6PD deficiency (common and often
  undiagnosed — ask about family history, and suspect if jaundice is disproportionate/early or
  there is a precipitant exposure), hereditary spherocytosis; **sepsis** (jaundice can be the
  presenting sign of sepsis, especially with an atypical or late-rising pattern); **polycythaemia**;
  **cephalhaematoma/significant birth bruising** (a large reservoir of extravascular blood to be
  broken down); **Crigler-Najjar/Gilbert** (rare, conjugation enzyme defects).
- *Zebra:* hypothyroidism (part of the routine newborn screen where available; prolonged jaundice
  is a classic but easily missed sign), galactosaemia.

**Conjugated (direct) hyperbilirubinaemia is NEVER physiological — direct bilirubin >20% of total
(or an absolute direct fraction above the lab's threshold, commonly cited as >34–35 μmol/L
[EK]) always mandates a work-up for biliary/hepatic pathology.**
- *The biliary atresia clock is the single most time-critical diagnosis in this differential*:
  **biliary atresia outcomes (native liver survival post-Kasai portoenterostomy) are strongly
  time-dependent, best if surgery occurs before ~45–60 days of life and progressively worse
  thereafter** [EK — well-established hepatobiliary surgical literature]. Any infant with
  jaundice persisting beyond 2 weeks of age (3 weeks if breastfed and otherwise entirely well)
  needs a conjugated bilirubin checked — this is the single test that separates "watch and
  reassure" from "refer today." Pale/acholic stools and dark urine are the clinical clue but are
  easy to miss without specifically asking/looking at a nappy.
- Other causes of conjugated hyperbilirubinaemia: neonatal hepatitis (viral, including
  TORCH/HSV/HIV), choledochal cyst, TPN-associated cholestasis (in preterm infants on prolonged
  parenteral nutrition), metabolic disease (galactosaemia, tyrosinaemia, alpha-1-antitrypsin
  deficiency), sepsis/UTI.

**Discriminating history:** hours-of-life at onset, gestational age, maternal blood group and Rh
status, direct Coombs test result if available, feeding adequacy (breast vs formula, volumes,
weight trend/weight loss from birth weight), family history of jaundice/splenectomy/G6PD/anaemia
requiring transfusion, stool colour, urine colour, sibling history of neonatal jaundice needing
phototherapy/exchange.

**Discriminating examination:** cephalocaudal progression of visible jaundice (a rough, unreliable
clinical guide only — face-only jaundice suggests lower levels than jaundice extending to the
soles, but **visual assessment alone is not sufficient to guide treatment decisions** — always
measure), pallor (haemolysis), hepatosplenomegaly (haemolysis, congenital infection,
metabolic/liver disease), stool colour check, weight loss percentage from birth weight
(>7–10% loss suggests inadequate intake contributing to jaundice and needs feeding support,
not just phototherapy).

**Investigations + interpretation nuance:**
- **Transcutaneous bilirubin (TcB)** is a useful screening tool but should be confirmed with
  **serum TSB** once past a screening threshold or if phototherapy is being considered/the infant
  has risk factors — TcB is unreliable once phototherapy has started (skin bleaching effect) and
  in more deeply pigmented skin, both highly relevant in the SA population. [EK]
- **Total and conjugated ("direct") bilirubin** must be fractionated in any infant with prolonged
  jaundice (>2 weeks), unwell-appearing jaundice, or early severe jaundice — treating "the number"
  without fractionating misses biliary atresia and hepatitis.
- **Blood group and direct Coombs (DAT)** on the infant, maternal blood group, in any early or
  rapidly-rising jaundice.
- **FBC + reticulocyte count + blood film** — a high retic count and film evidence of haemolysis
  (spherocytes, fragments) point to haemolytic disease; a normal retic count with high bilirubin
  points more toward a conjugation/enterohepatic cause.
- **G6PD level** where haemolysis is unexplained (level can be falsely normal during an acute
  haemolytic episode because the older, more deficient cells have already been destroyed — repeat
  after the acute episode if strongly suspected). [EK]
- **Phototherapy and exchange-transfusion threshold charts are gestational-age- and
  risk-factor-banded, not a single cut-off number** — the standard nomograms (e.g. AAP/Bhutani-type
  charts, reproduced in the SA/WHO neonatal care guidance) plot TSB against **age in hours** on
  three or more curves stratified by **gestational age and the presence of neurotoxicity risk
  factors** (haemolytic disease, G6PD deficiency, asphyxia, significant lethargy, temperature
  instability, sepsis, acidosis, albumin <30g/L) — the same TSB number triggers phototherapy far
  earlier in a 34-week infant with haemolysis than in a well 40-week infant. **The chart logic, not
  a memorised single number, is what must be applied at the bedside** — always plot age-in-hours
  and gestation against the correct curve rather than reciting an isolated threshold. [EK — chart
  structure well-established; exact numeric curves should be read from the current SA/AAP chart
  in use, not quoted from memory].
- **Exchange transfusion** is reserved for TSB at or above the exchange curve for that
  gestation/risk category, or for any infant showing **acute bilirubin encephalopathy signs**
  (lethargy progressing to hypertonia/opisthotonus/high-pitched cry/seizures — kernicterus is a
  clinical emergency, not a lab-value-only decision) — clinical signs of encephalopathy justify
  exchange even below the charted number. [EK]

**Management anchors:** phototherapy (intensive multi-light phototherapy for rapidly rising or
high-risk levels; ensure eye protection, adequate hydration/feeding continued, temperature
monitoring), IVIG has an adjunct role in severe isoimmune haemolytic disease to reduce exchange
need [EK], exchange transfusion for severe/refractory cases or encephalopathy signs, treat the
underlying cause (antibiotics for sepsis, surgical referral for biliary atresia — refer to a
paediatric surgical/hepatobiliary centre without delay once conjugated hyperbilirubinaemia is
confirmed and biliary atresia cannot be excluded quickly).

**Consultant traps & pearls:**
- *Trap:* treating "conjugated jaundice" as reassuring because the infant looks well — biliary
  atresia infants often look deceptively well for weeks while the clock runs out on a treatable
  window.
- *Trap:* eyeballing jaundice severity by skin colour alone and not measuring — clinically
  estimating bilirubin level is unreliable, especially in darker skin tones.
- *Trap:* forgetting to ask about stool and urine colour — the single cheapest discriminating
  question in this entire syndrome.
- *Pearl:* every infant readmitted with jaundice needs a feeding assessment, not just a
  phototherapy order — poor intake is a common accelerant and fixing it changes trajectory.
- *Pearl:* jaundice before 24 hours of life is a same-day work-up, full stop — never "review in
  the morning."

#### 2.1.3 Neonatal hypoglycaemia

**At-risk groups:** infant of a diabetic mother (IDM — hyperinsulinaemic, can drop precipitously
in the first hours), small-for-gestational-age (SGA)/intrauterine growth restriction (limited
glycogen stores), large-for-gestational-age without diabetes, preterm (<37 weeks, limited
reserve), infant with perinatal stress/asphyxia/sepsis (increased utilisation), polycythaemia,
Beckwith-Wiedemann syndrome (hyperinsulinism), any unwell neonate (hypoglycaemia is both a cause
and a consequence of illness — always check glucose in a sick neonate regardless of the working
diagnosis).

**Threshold and treatment ladder [EK — mainstream neonatal consensus; SA STG-aligned]:**
- Operational treatment threshold in most protocols: **blood glucose <2.6 mmol/L** as the level at
  which intervention is triggered in an at-risk or symptomatic infant, with a lower
  screening-only threshold sometimes used in the first hours of a normal transition in
  asymptomatic term infants (glucose physiologically dips in the first 1–2 hours of life). Any
  glucose **<1.5–2.0 mmol/L**, or hypoglycaemia with neurological symptoms (jitteriness, lethargy,
  poor feeding, hypotonia, apnoea, seizures) at any level, is treated as an emergency.
- **Ladder:**
  1. *Asymptomatic, at-risk, feeding tolerated:* early and frequent breastfeeding/formula
     feeding, recheck glucose 30–60 min after feed; if still low, escalate.
  2. *Asymptomatic, persistent low, or cannot feed:* IV **10% dextrose bolus** (commonly cited
     around **2 mL/kg of 10% dextrose**, i.e. ~200 mg/kg glucose) followed by a maintenance IV
     dextrose infusion titrated to keep glucose above threshold, with regular monitoring. [EK]
  3. *Symptomatic/seizing:* IV dextrose bolus as above given urgently, then continuous infusion;
     recheck glucose within 15–30 minutes to confirm response; escalate infusion rate (glucose
     infusion rate, GIR, is titrated in mg/kg/min) if not sustained.
  4. *Refractory hypoglycaemia* (persisting despite high GIR): consider hyperinsulinism
     (Beckwith-Wiedemann, IDM, nesidioblastosis), cortisol/growth hormone deficiency, or a
     metabolic disease — escalate to specialist input, consider glucagon or hydrocortisone as
     bridging agents per specialist guidance, send a "critical sample" (glucose, insulin, cortisol,
     growth hormone, lactate, ammonia, ketones) **at the time of a proven low glucose** — this
     sample is often the only chance to catch the diagnostic biochemistry and is frequently
     missed. [EK]

**Consultant traps & pearls:**
- *Trap:* treating a single well-timed normal glucose as clearance — at-risk infants need serial
  monitoring on a schedule (e.g. pre-feed checks for the first 24 hours in an IDM), not a single
  check.
- *Trap:* over-diluting or under-dosing the dextrose bolus, or infusing peripherally at a
  concentration that causes extravasation injury — know the unit's maximum peripheral dextrose
  concentration and escalate to central access if higher GIR is needed.
- *Pearl:* jitteriness that stops with gentle flexion of the limb is more likely benign; a
  jittery/seizure-like movement that does NOT stop with repositioning is more concerning and
  glucose (and calcium) should be checked immediately.

#### 2.1.4 Respiratory distress of the newborn

**Differential — discriminated mainly by timing, gestational age, mode of delivery, and
response to oxygen:**
- **Transient tachypnoea of the newborn (TTN):** term/near-term, often post-elective
  Caesarean (delayed clearance of fetal lung fluid), onset within hours of birth, tachypnoea
  often disproportionate to other distress, generally mild-moderate oxygen requirement,
  self-limiting over 24–72h, CXR shows perihilar streaking/fluid in fissures.
- **Respiratory distress syndrome (RDS)/surfactant deficiency:** preterm (risk rises steeply with
  decreasing gestation), onset at or shortly after birth, progressive worsening over the first
  24–48h without surfactant, grunting/retractions/nasal flare prominent, CXR shows a diffuse
  reticulogranular ("ground-glass") pattern with air bronchograms, low lung volumes.
  Antenatal corticosteroids to the mother and postnatal surfactant are the key modifiable
  interventions. [EK]
- **Meconium aspiration syndrome (MAS):** term/post-term infant, meconium-stained liquor,
  often a depressed infant at birth, patchy/asymmetric infiltrates with hyperinflation on CXR,
  risk of air leak (pneumothorax) and persistent pulmonary hypertension of the newborn (PPHN) as
  complications.
- **Pneumonia (congenital, often GBS or other vertically-transmitted organisms):** risk factors
  overlap with early-onset sepsis (prolonged rupture of membranes, maternal fever), can mimic
  RDS radiologically, treated as sepsis + respiratory support together, not as a separate
  pathway.
- **Congenital heart disease (duct-dependent or high-flow lesions):** respiratory distress from a
  cardiac cause is a must-not-miss mimic — see §2.1.5 for the discriminators; the trap is treating
  cardiac failure/cyanotic heart disease as a primary lung problem.
- *Zebra:* congenital diaphragmatic hernia (scaphoid abdomen, bowel sounds in chest, mediastinal
  shift — a neonatal emergency, avoid bag-mask ventilation which distends bowel in the chest,
  intubate early and pass an NG tube for decompression), pneumothorax (sudden deterioration,
  asymmetric chest, transillumination positive), congenital lobar emphysema, tracheo-oesophageal
  fistula (choking with feeds, inability to pass an NG tube, polyhydramnios antenatally),
  choanal atresia (cyanosis that improves with crying, worsens at rest — the infant is an
  obligate nasal breather), pulmonary hypoplasia.

**Discriminating history:** gestational age, mode of delivery, meconium-stained liquor, Apgar
scores and resuscitation given, antenatal steroid exposure if preterm, maternal fever/prolonged
rupture of membranes, timing of onset relative to birth, feeding-related choking/cyanosis
(TOF), whether cyanosis improves with crying (choanal atresia) or worsens with crying (cardiac).

**Discriminating examination:** work of breathing pattern (grunting is a physiological attempt to
maintain end-expiratory pressure — a marker of significant lung disease), symmetry of air entry,
scaphoid vs distended abdomen, presence of bowel sounds in the chest, single vs split second
heart sound and murmurs, femoral pulses (weak/absent — coarctation, part of duct-dependent
disease), pre- and post-ductal saturations (a gradient >3% suggests a right-to-left shunt across
the ductus, seen in PPHN and some duct-dependent lesions), response to supplemental oxygen.

**Investigations + interpretation nuance — the hyperoxia test concept:** in a cyanotic neonate
where cardiac vs pulmonary cause is unclear, giving **100% oxygen and rechecking arterial PaO₂**
(or, more practically at district level, watching SpO₂ response) helps discriminate: **pulmonary
causes of cyanosis typically show a significant rise in PaO₂/SpO₂ with 100% oxygen; cyanotic
congenital heart disease with a fixed right-to-left shunt typically shows little to no
improvement** (a PaO₂ that fails to rise above roughly 100–150 mmHg on 100% oxygen is classically
taken as supportive of a cardiac cause) [EK — classic hyperoxia test teaching]. This is a
*concept* to guide urgency and referral, not a definitive stand-alone test — echocardiography is
the actual discriminator and should not be delayed while trialling oxygen in an unstable infant.
Other investigations: CXR (pattern per differential above), pre/post-ductal SpO₂, blood gas
(respiratory vs metabolic component, degree of hypoxaemia/hypercapnia), FBC/CRP/blood culture
(overlap with sepsis work-up), glucose (a cause and consequence of distress), four-limb blood
pressure if coarctation suspected.

**Management anchors:** oxygen titrated to target saturations (avoid hyperoxia, particularly in
preterm infants — retinopathy of prematurity risk), CPAP as first-line respiratory support for
most non-cardiac causes of distress at district level where available (§6), surfactant for
confirmed/strongly suspected RDS (ideally with antenatal steroids having been given), empiric
antibiotics if pneumonia/sepsis cannot be excluded, urgent neonatal transfer/echo if a cardiac
cause is suspected (§2.1.5), needle decompression/chest drain for tension pneumothorax, avoid
bag-mask ventilation and intubate + decompress stomach early if diaphragmatic hernia suspected.

**Consultant traps & pearls:**
- *Trap:* treating all neonatal respiratory distress as "probably TTN, will settle" without
  considering the sepsis and cardiac differentials in parallel — start the sepsis screen and
  antibiotics alongside supportive respiratory care unless a clear benign cause (elective
  Caesarean, improving rapidly) is present.
- *Trap:* missing weak/absent femoral pulses because the assessment was rushed — femoral pulses
  are checked in every distressed neonate, every time.
- *Pearl:* an infant whose cyanosis does not improve, or improves only marginally, with oxygen is
  a cardiac lesion until echo says otherwise — escalate the referral urgency accordingly.

#### 2.1.5 The duct-dependent lesion presenting as collapse (day 3–14)

**Mechanism — the physiology every intern must internalise.** A subset of critical congenital
heart lesions are only compatible with a normal circulation *while the ductus arteriosus remains
patent* — either because pulmonary blood flow is duct-dependent (severe pulmonary
stenosis/atresia, tricuspid atresia, some forms of tetralogy) or because systemic blood flow is
duct-dependent (hypoplastic left heart syndrome, critical coarctation, interrupted aortic arch,
critical aortic stenosis). These infants can look **entirely normal at birth and in the first
days** because the ductus is still open — then, as the ductus physiologically closes (typically
functionally over the first 24–72h, anatomically over days to ~2 weeks), the infant **collapses
suddenly**: this is the classic "well baby discharged home, back in extremis at day 3–14"
presentation.

**The presentation mimics septic shock closely** — poor feeding, lethargy, grey/mottled colour,
tachypnoea, weak or absent femoral pulses, poor perfusion, metabolic acidosis, and in
duct-dependent *systemic* flow lesions, a picture that can look exactly like cardiogenic shock or
even be mistaken for sepsis with "differential cyanosis" (pink upper body, blue/grey lower body
in some arch lesions, or the reverse in transposition physiology) as the one discriminating clue.
Hepatomegaly and a gallop rhythm point toward heart failure rather than sepsis alone, but overlap
is real and **both diagnoses are often treated in parallel until clarified.**

**Discriminating history:** well at birth, discharged normally, then acute deterioration in the
second week of life is the archetypal story; antenatal scans (many but not all critical lesions
are picked up antenatally — a normal antenatal scan does NOT exclude this).

**Discriminating examination:** four-limb blood pressure and pulses (weak/absent femorals =
coarctation-spectrum lesion), pre- and post-ductal saturations (differential cyanosis),
hepatomegaly, gallop rhythm, murmur (may be absent or minimal even with severe disease — **absence
of a murmur does not exclude critical congenital heart disease** in this age group), signs of poor
systemic perfusion out of proportion to respiratory findings.

**Investigations + interpretation nuance:** four-limb BP, pre/post-ductal SpO₂ (gradient
significant), CXR (cardiomegaly, pulmonary plethora or oligaemia depending on lesion),
**hyperoxia test concept** as above, urgent echocardiography is the definitive investigation and
should drive transfer decisions rather than being awaited before starting prostaglandin if the
clinical suspicion is high and the infant is deteriorating.

**Management anchors — prostaglandin E1 (alprostadil) is the save.** In any collapsed neonate
where a duct-dependent lesion is a real possibility (weak femorals, differential cyanosis,
poor response to oxygen, sudden collapse day 3–14 without a clear septic source), **starting an
IV prostaglandin E1 infusion to reopen/maintain ductal patency is a time-critical, potentially
life-saving empiric step** that should not wait for echo confirmation if the infant is
deteriorating — the risk of missing a duct-dependent lesion is fatal collapse, while the main
risk of prostaglandin in a non-cardiac cause is apnoea (which is managed with respiratory support,
have intubation equipment ready) [EK — standard neonatal cardiology practice; exact
mcg/kg/min dosing should follow the current unit/tertiary-centre protocol as this is a
specialist-initiated infusion typically started in consultation with neonatology/paediatric
cardiology]. Concurrently: treat empirically for sepsis (the two are not mutually exclusive and
distinguishing them clinically in the first hour is often impossible), correct acidosis and
glucose, arrange urgent transfer to a centre with paediatric cardiology/cardiac surgery.

**Consultant traps & pearls:**
- *Trap:* treating this purely as septic shock and giving large-volume fluid boluses — in
  duct-dependent systemic-flow lesions with heart failure physiology, aggressive fluid boluses can
  worsen pulmonary oedema; give cautious, reassessed boluses while urgently seeking the cardiac
  diagnosis rather than repeating boluses on a sepsis protocol reflexively.
- *Trap:* being falsely reassured by the absence of a murmur.
- *Pearl:* check femoral pulses and four-limb blood pressure in EVERY collapsed neonate, before
  assuming sepsis — it costs seconds and changes management immediately.

#### 2.1.6 Neonatal seizures

**Presentation is often subtle and non-convulsive** — unlike older children, neonatal seizures
frequently do NOT look like a generalised tonic-clonic seizure. Recognise: subtle seizures
(repetitive lip-smacking/chewing/sucking, eye deviation or fixed staring/blinking, cycling or
pedalling limb movements, apnoea as the sole manifestation), focal clonic, focal tonic, and
myoclonic patterns. Because the immature neonatal cortex does not reliably generalise electrical
activity into an obvious convulsion, **any paroxysmal, stereotyped, repetitive abnormal movement
or an unexplained apnoea in a neonate should raise seizure as a differential**, and EEG confirms
what the bedside exam may under-call.

**Differential (causes, roughly in order of frequency):**
- *Common:* hypoxic-ischaemic encephalopathy (HIE — the single most common cause, §2.1.7),
  intracranial haemorrhage (especially in preterm infants — IVH, §2.1.8), metabolic derangement
  (hypoglycaemia, hypocalcaemia, hypomagnesaemia, hyponatraemia).
- *Must-not-miss:* meningitis/sepsis (always check for this in a seizing neonate), pyridoxine
  (vitamin B6) dependency (rare but treatable — refractory seizures unresponsive to standard
  anticonvulsants that respond dramatically to IV pyridoxine; consider a therapeutic trial in
  refractory neonatal status epilepticus), stroke (neonatal arterial ischaemic stroke — often
  focal seizures in an otherwise well-looking term infant), inborn error of metabolism
  (hyperammonaemia, organic acidaemia — seizures with poor feeding, vomiting, unusual odour,
  metabolic acidosis or alkalosis out of proportion to the clinical picture).
- *Zebra:* benign familial neonatal seizures, congenital brain malformation, TORCH infection,
  kernicterus (severe hyperbilirubinaemia, §2.1.2), neonatal opioid/benzodiazepine withdrawal.

**Discriminating history:** birth history (asphyxia, resuscitation needed, Apgar scores),
gestational age and prematurity-related risk (IVH), family history of neonatal seizures/early
infant deaths (metabolic disease, pyridoxine dependency), feeding pattern and any vomiting/odd
odour, maternal substance use.

**Discriminating examination:** full neurological assessment (tone, reflexes, level of alertness
between events), fontanelle, dysmorphic features, hepatosplenomegaly (metabolic/TORCH), skin
(vesicles — HSV, capillary malformations), documenting the exact movement pattern (video if
possible) is often more diagnostically useful than a verbal description.

**Investigations + interpretation nuance:** **glucose and calcium are checked first, always,
before anything else, because they are instantly correctable causes** — glucose <2.6 mmol/L,
calcium (ionised or corrected total) low per neonatal norms (§4); magnesium is checked alongside
calcium as hypomagnesaemia can cause refractory hypocalcaemia. Full septic screen (FBC, CRP,
blood culture, LP unless contraindicated — neonatal CSF norms differ, §4). Blood gas (metabolic
acidosis pattern in some inborn errors). Consider ammonia and lactate if metabolic disease
suspected (poor feeding, vomiting, unexplained acidosis/alkalosis, family history). Cranial
ultrasound (bedside, screens for IVH/major structural lesions in preterm infants) and/or
MRI/CT as available for HIE severity grading and structural causes. EEG (including amplitude-
integrated EEG, aEEG, where available) both confirms electrographic seizures (many neonatal
"events" are not seizures, and many electrographic seizures have no visible clinical
correlate — "electro-clinical dissociation") and helps grade encephalopathy severity.

**Management anchors [EK — mainstream neonatal seizure management]:** correct glucose and calcium
immediately if abnormal. First-line anticonvulsant is typically **IV phenobarbitone** (a loading
dose, commonly cited around 20 mg/kg, with additional loading doses if seizures continue up to a
higher cumulative total per local protocol); second-line agents include phenytoin or, increasingly,
**levetiracetam** where available (better side-effect profile). If refractory to standard
anticonvulsants, consider a **trial of IV pyridoxine** (treatable and easily missed if not
considered). Treat the underlying cause in parallel — antibiotics/aciclovir if infection
possible, cooling if HIE criteria met and within the therapeutic window (§2.1.7).

**Consultant traps & pearls:**
- *Trap:* dismissing subtle repetitive movements as "normal newborn jitteriness" — jitteriness
  characteristically stops with gentle restraint/repositioning of the limb; a true seizure does
  not.
- *Trap:* treating seizures with anticonvulsants alone without checking glucose/calcium first —
  an easily reversible cause is missed while loading an unnecessary drug.
- *Pearl:* apnoea as the sole seizure manifestation is a recognised and easily missed pattern —
  consider EEG in any unexplained apnoea with an otherwise unremarkable respiratory work-up.

#### 2.1.7 Birth asphyxia / hypoxic-ischaemic encephalopathy (HIE)

**Sarnat staging is the core clinical grading tool** and drives both prognosis and the cooling
decision [EK — classic Sarnat & Sarnat staging, in routine neonatal use]:
- **Stage 1 (mild):** hyperalert, irritable, normal or slightly increased tone, exaggerated
  reflexes, no seizures, resolves within 24h, generally good prognosis.
- **Stage 2 (moderate):** lethargic, hypotonic, decreased spontaneous movement, weak suck,
  seizures common, autonomic signs (bradycardia, decreased pupillary response); prognosis is
  variable and this is the group where interventions (cooling) matter most.
- **Stage 3 (severe):** stuporous/comatose, flaccid, absent reflexes and suck, seizures often
  present but may be electrographic only (dissociation from clinical exam in a flaccid infant),
  autonomic dysfunction severe (irregular respirations, apnoea); high risk of death or severe
  disability.

**Cooling criteria (therapeutic hypothermia)** [EK — mainstream neonatal neuroprotection
consensus]: offered to term or near-term infants (typically ≥36 weeks gestation) with evidence of
perinatal asphyxia (low Apgar at 10 minutes, need for prolonged resuscitation, cord or early
postnatal blood gas showing significant acidosis, e.g. pH <7.0 or base deficit ≥16, or a milder
gas with additional evidence of encephalopathy) **and** clinical encephalopathy of at least
moderate (Sarnat stage 2) severity, **started within a narrow therapeutic window (classically
within 6 hours of birth)** to a target core temperature (commonly cited around 33.5°C) maintained
for approximately 72 hours followed by controlled rewarming. Earlier initiation within the window
is associated with better outcomes — this is genuinely time-critical, not a next-day referral
decision.

**The SA district reality of cooling** is a significant gap between guideline and access:
therapeutic hypothermia requires a controlled-temperature cooling device (servo-controlled) and
NICU-level monitoring (continuous temperature, cardiorespiratory, and ideally aEEG monitoring) to
be done safely — this capacity exists at tertiary/some regional centres but **is generally not
available at district hospital level**. The district-hospital clinical priority is therefore: (1)
recognise HIE and its severity accurately (Sarnat staging), (2) **avoid hyperthermia** (which
worsens outcome) while arranging transfer — passive/controlled cooling en route without servo
control is a recognised risk (overcooling), so the district approach is careful temperature
avoidance of fever rather than improvised active cooling unless the transferring/receiving team
has a specific protocol for this, (3) urgent discussion with the receiving neonatal
unit/retrieval service to get the infant into the therapeutic window if at all possible, since the
6-hour window is frequently the rate-limiting step in a rural referral pathway. [EK — reflects
widely-described SA/LMIC neonatal transfer constraints]

**Management alongside cooling/supportive care:** glucose control (avoid both hypo- and
hyperglycaemia, both worsen injury), seizure management (§2.1.6), fluid restriction in the acute
phase (risk of SIADH/acute kidney injury from hypoxic renal injury), avoid hyperoxia and
hypocapnia (both associated with worse neurological outcome — ventilate to normocapnia, target
saturations rather than high FiO₂), monitor for multi-organ dysfunction (renal, hepatic, cardiac,
coagulopathy — asphyxia is a multisystem insult, not an isolated brain injury).

**Consultant traps & pearls:**
- *Trap:* focusing on the brain alone and missing acute kidney injury, coagulopathy, or myocardial
  dysfunction — HIE work-up includes renal function, coagulation, and cardiac assessment.
- *Trap:* delaying the referral call while completing a full work-up locally — the cooling window
  is short; call the receiving unit immediately once moderate-severe encephalopathy is suspected
  and work up in parallel with arranging transfer.
- *Pearl:* a normal Apgar at 5 minutes does not exclude significant asphyxia if resuscitation was
  prolonged or the cord gas was significantly acidotic — grade the baby on the whole clinical
  picture, not a single score.

#### 2.1.8 Prematurity essentials — apnoea, NEC, IVH

**Apnoea of prematurity:** pauses in breathing (commonly defined as ≥20 seconds, or shorter if
accompanied by bradycardia/desaturation) due to immature central respiratory drive control,
common in infants <34 weeks gestation and increasing in frequency with decreasing gestational
age. **Apnoea is a diagnosis of exclusion in this context** — always screen for a secondary
trigger (sepsis, hypoglycaemia, anaemia, gastro-oesophageal reflux, temperature instability,
seizure, evolving IVH or NEC) before attributing a new or worsening apnoea pattern to "apnoea of
prematurity" alone, especially if the pattern changes from the infant's baseline. Management:
tactile stimulation for isolated events, caffeine citrate as a respiratory stimulant (standard of
care for apnoea of prematurity, also given prophylactically pre-extubation) [EK], CPAP/escalated
respiratory support for frequent or severe events, treat any identified secondary cause.

**Necrotising enterocolitis (NEC)** — the classic triad: **bloody stools, abdominal distension,
and feeding intolerance** in a preterm infant (though term infants, particularly with risk
factors like asphyxia, congenital heart disease, or polycythaemia, can also develop it), typically
presenting in the second to third week of life after feeds have been established, though timing
varies. Additional signs: bilious aspirates/vomiting, temperature instability, apnoea/bradycardia,
lethargy, a discoloured or shiny/tense abdominal wall, absent bowel sounds, a palpable mass
(localised perforation/abscess) in more advanced disease.
- **Investigations + interpretation nuance:** **abdominal X-ray is the key investigation** —
  looking specifically for **pneumatosis intestinalis** (intramural gas, the pathognomonic sign,
  a bubbly/linear lucency in the bowel wall), **portal venous gas** (branching lucencies over the
  liver, a marker of more severe disease), and **free air** (pneumoperitoneum — surgical
  emergency, look specifically with a left lateral decubitus or cross-table lateral view as
  supine films can miss free air in small infants). Serial films (every 6–12h in evolving/severe
  disease) track progression. FBC (thrombocytopenia is common and tracks severity — a rapidly
  falling platelet count is a marker of clinical deterioration), CRP, blood gas (metabolic
  acidosis, rising lactate — systemic sepsis physiology), blood culture, electrolytes.
- **Management anchors:** **bowel rest (nil by mouth), nasogastric decompression, IV fluids,
  broad-spectrum antibiotics covering Gram-negative and anaerobic organisms** (a
  penicillin/ampicillin + gentamicin + metronidazole-type combination is standard [EK]), correct
  coagulopathy/thrombocytopenia as needed, serial abdominal exams and imaging to detect
  perforation, **surgical referral for pneumoperitoneum, clinical deterioration despite maximal
  medical therapy, or a fixed dilated bowel loop on serial films** (signs of a non-viable segment).
  Duration of bowel rest and antibiotics is typically 7–14 days depending on staging/severity.
  [EK — Bell's staging framework underlies this, standard neonatal surgical practice]

**Intraventricular haemorrhage (IVH):** risk concentrated in preterm infants (<32 weeks/<1500g
particularly), from the fragile germinal matrix vasculature; graded I–IV by extent (I: germinal
matrix only, II: intraventricular without dilation, III: intraventricular with ventricular
dilation, IV: parenchymal extension) — grade correlates with long-term neurodevelopmental risk,
with grades III–IV carrying substantially higher risk of hydrocephalus and disability.
Presentation ranges from clinically silent (picked up on routine screening cranial ultrasound,
which is why **all preterm infants below a gestational-age threshold get routine screening
cranial ultrasound**, e.g. around <32–34 weeks, typically at day 3–7 and again around 4–6 weeks
[EK]) to acute catastrophic collapse (sudden pallor, bulging fontanelle, falling haematocrit,
seizures, in severe bleeds). Prevention: antenatal corticosteroids, avoiding rapid
volume/pressure swings (careful fluid bolus administration, avoiding rapid correction of blood
pressure, minimal handling/"cluster care" in very preterm infants, delayed cord clamping where
feasible). Management is largely supportive; serial ultrasound monitors for progression and
post-haemorrhagic ventricular dilation, which may need neurosurgical intervention (serial LPs,
ventricular reservoir, or shunt) if progressive.

#### 2.1.9 The HIV-exposed neonate

South Africa's PMTCT/vertical transmission prevention (VTP) programme is one of the most
consequential public-health interventions in SA paediatrics — every HIV-exposed infant needs a
structured, risk-stratified prophylaxis and testing pathway from birth.

**Risk stratification (per the 2023 ART Clinical Guidelines):** infants are classified as **high
risk** or **low risk** of vertical transmission based principally on the **maternal viral load
around the time of delivery** — a mother with an unsuppressed/unknown viral load close to
delivery, a new HIV diagnosis in labour or postpartum, or poor antenatal adherence places the
infant in the **high-risk** category; a mother with a well-documented suppressed viral load on
ART throughout pregnancy places the infant in the **low-risk** category. [fetched — WC/NDoH VTP
guidance structure]

**Prophylaxis by risk tier [fetched — 2023 ART guidelines structure; exact mg/kg dosing by birth
weight band should be confirmed against the current dosing chart in use]:**
- **All HIV-exposed infants** receive **dual prophylaxis — nevirapine (NVP) plus zidovudine
  (AZT)** from birth, continued for a full **6 weeks**, regardless of feeding choice, as the
  default/standard prophylaxis.
- Risk classification (once the delivery/around-delivery maternal viral load result is available)
  refines the *duration and intensity* of prophylaxis and the *urgency/frequency of testing* — a
  **high-risk** infant is managed with closer follow-up and, per current guidance, may have
  extended or intensified prophylaxis and an accelerated testing schedule compared with a
  **low-risk** infant on the standard 6-week dual-prophylaxis/testing pathway. Dose the
  NVP/AZT syrup by the infant's birth weight band per the current dosing chart — never estimate.

**Birth PCR and the testing schedule [fetched — VTP schedule structure]:** a **birth PCR (within
the first 48 hours of life)** is done in HIV-exposed infants to detect *in-utero* transmission
(a positive birth PCR indicates transmission occurred before delivery and prompts immediate ART
initiation, not confirmation-then-wait). Subsequent testing follows the exposure/feeding
pathway — a further PCR **around 10 weeks** of age, and, for infants who are breastfeeding, an
additional PCR **around 6 months** of age (this replaced an earlier 18-week test point in the
evolution of the schedule), followed by an **HIV rapid antibody test around 9 months** with
confirmatory PCR if reactive, and **final confirmatory testing after complete cessation of
breastfeeding** (commonly cited as a test at least 6 weeks, and again around 18 months, after the
last breastfeed) to definitively exclude transmission via breast milk. **Any positive/reactive
result at any point triggers an immediate confirmatory test and same-day ART initiation
discussion — do not wait for the "next scheduled" test.** [EK for the exact confirmatory-test
timing after breastfeeding cessation — structure fetched, precise intervals should be checked
against the current chart]

**Feeding counselling:** exclusive breastfeeding for the first 6 months (with maternal ART
adherence and viral suppression) or exclusive formula feeding are both supported pathways;
**mixed feeding in the first 6 months is specifically discouraged** as it is associated with
higher transmission risk than exclusive feeding of either type [EK — long-standing PMTCT feeding
principle].

**Consultant traps & pearls:**
- *Trap:* treating "mother is on ART" as equivalent to "infant is low risk" — risk stratification
  depends on the *viral load result*, not simply on ART enrolment; an infant of a mother on ART
  with an unsuppressed viral load at delivery is still high-risk.
- *Trap:* missing the birth PCR window or not escalating a positive birth PCR as an emergency —
  a positive birth PCR is not a "routine result to review at next visit."
- *Pearl:* always document the maternal delivery viral load result (or note that it is pending) in
  the infant's own notes — the infant's prophylaxis/testing pathway cannot be correctly assigned
  without it, and this is a common documentation gap that delays correct management.
- *Pearl:* every HIV-exposed infant also needs routine well-baby care (growth monitoring,
  immunisation on the standard EPI-SA schedule — HIV exposure does not usually change the
  vaccine schedule, though live vaccines require caution if the infant is later confirmed
  HIV-infected and immunocompromised) — do not let the HIV pathway crowd out ordinary neonatal
  care.
