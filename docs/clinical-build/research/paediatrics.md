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

### 2.2 The critically ill child — PICU-level reasoning

#### 2.2.1 Recognition — the paediatric assessment triangle and shock staging

**The Paediatric Assessment Triangle (PAT)** is the 30-60 second, hands-off, across-the-room
first assessment that every paediatrician runs before touching the child, built on three
observed domains [EK — APLS/PALS standard]:
1. **Appearance** — tone, interactiveness, consolability, look/gaze, speech/cry ("TICLS") — the
   single best proxy for adequacy of cerebral perfusion and oxygenation; an abnormal appearance
   (floppy, unresponsive, inconsolable, weak cry) is the most sensitive marker of a sick child and
   overrides a reassuring set of vitals.
2. **Work of breathing** — visible effort (retractions, nasal flare, head bobbing in infants,
   tripod positioning), abnormal sounds (grunting, stridor, wheeze) — assessed by looking and
   listening before any equipment is applied.
3. **Circulation to skin** — pallor, mottling, cyanosis — a visual proxy for perfusion, cross-
   checked against capillary refill on hands-on assessment.

The PAT generates an immediate physiological impression (stable / respiratory distress /
respiratory failure / shock / CNS-metabolic dysfunction / cardiopulmonary failure) that sets the
urgency and sequence of the subsequent hands-on ABCDE assessment — it is a triage tool run in
seconds, not a substitute for the full assessment that follows.

**Compensated vs decompensated shock — blood pressure falls LATE.** Reiterating the central
mental-model point with the staging detail:
- **Compensated shock:** tachycardia, normal-to-low-normal blood pressure (maintained by
  catecholamine-driven vasoconstriction and rate increase), delayed capillary refill (>2–3
  seconds), cool/mottled peripheries with a core-to-peripheral temperature gap, narrowing pulse
  pressure, mild-moderate tachypnoea, normal-to-mildly-altered mental state, reduced urine output.
  **This is the window in which intervention changes outcome** — waiting for hypotension means
  waiting for a pre-arrest state.
- **Decompensated shock:** hypotension (a late and often sudden finding), markedly altered/
  depressed mental state, weak or absent peripheral pulses, marked tachypnoea or bradypnoea
  (bradypnoea/irregular breathing is a pre-terminal sign), bradycardia (a terminal, not reassuring,
  sign in a child — bradycardia in a shocked/hypoxic child heralds imminent arrest, unlike the
  reassuring bradycardia of a fit adult).
- **Practical rule of thumb for the lower limit of normal systolic BP by age** [EK]: approximately
  **70 + (2 × age in years)** mmHg for children 1–10 years (i.e. a 5-year-old's lower limit is
  roughly 80 mmHg); below this, treat as hypotensive/decompensated shock. Below age 1, a systolic
  <70 mmHg is generally considered hypotensive. This formula is a rough operational anchor, not a
  precision tool — the compensated-shock signs above should trigger treatment well before this
  number is reached.

**Weight estimation formulas** (used for drug dosing and fluid volumes when the child cannot be
weighed immediately, e.g. in resuscitation) [EK — APLS-standard formulas; always weigh the child
as soon as physically possible and correct doses to actual weight]:
- **Term to 1 year:** weight (kg) ≈ (age in months + 9) / 2, or simply age(months)/2 + 4 as a
  close approximation for the first year.
- **1–5 years:** weight (kg) ≈ 2 × (age in years + 5), i.e. (age × 2) + 8.
- **6–12 years:** weight (kg) ≈ 3 × age (years) + 7, or (age × 4) as a rougher rule.
- **The Broselow tape concept:** a length-based colour-coded resuscitation tape that estimates
  weight from measured height/length and cross-references pre-calculated drug doses, fluid
  volumes, and equipment sizes (ETT size, defibrillator pads) for that weight band directly on the
  tape — used specifically because length correlates with weight more reliably across the wide
  variance of paediatric body habitus than age-based formulas alone, and because it removes
  mental-math error under resuscitation stress by printing the actual doses/sizes needed. Where
  available, the Broselow tape (or an equivalent length-based system) is preferred over an
  age-based formula in an actual resuscitation.

#### 2.2.2 Septic shock in children

**Differential/mechanism** as for adult sepsis but with paediatric-specific source patterns by
age: neonatal (§2.1.1), meningococcaemia (any age, classically toddlers/school-age — the petechial
child, §2.5), pneumonia-driven sepsis, urosepsis (occult UTI in infants), severe
gastroenteritis with bacteraemia, and, in the SA context, sepsis complicating severe acute
malnutrition (a distinct fluid-management pathway, §2.6) and HIV-related opportunistic sepsis in
undiagnosed/advanced HIV.

**Fluid strategy — post-FEAST nuance in resource-limited settings.** The FEAST trial (2011,
sub-Saharan Africa, febrile children with impaired perfusion but *without* severe hypotension)
found that **liberal bolus fluid resuscitation (saline or albumin boluses) increased mortality**
compared with maintenance fluids alone, overturning the previously unquestioned "more fluid is
always better" reflex in this population — the excess mortality is thought to relate to fluid
overload in children with limited cardiovascular reserve to buffer rapid volume shifts,
particularly relevant where **inotropic/ventilatory rescue for fluid-overload complications is
not readily available at a resource-limited facility** (the core FEAST setting). This has become
one of the most-cited "own it, don't just cite it" nuances in paediatric resource-limited
resuscitation: **the SA STG/resource-limited-setting position is a more cautious, reassessed
bolus strategy** than the aggressive multi-bolus adult sepsis approach — give a bolus (commonly
10 mL/kg, reassessed, rather than reflexively repeating 20 mL/kg boluses), reassess perfusion,
respiratory status, and for signs of fluid overload (new crepitations, hepatomegaly increasing,
gallop rhythm, worsening respiratory distress) after every bolus, and **move to inotropes rather
than continued fluid boluses once there is any sign of fluid intolerance or after a
limited/defined volume has been given without response**, rather than chasing perfusion targets
with fluid alone. This nuance applies most directly to the FEAST population (severe febrile
illness without profound hypotension, in a setting without ICU-level rescue) — a child in frank
decompensated/hypotensive septic shock with access to appropriate escalation still requires
prompt, generous initial resuscitation; the lesson is *reassess after every bolus and have a low
threshold to move to pressors/inotropes*, not "withhold fluid from a shocked child." [EK — FEAST
trial (NEJM 2011) findings and their integration into resource-limited paediatric sepsis practice
are well-established teaching]

**Inotropes peripherally.** Historically, vasoactive infusions were withheld pending central
venous access, delaying haemodynamic support. Current paediatric critical-care practice (and the
practical district/regional reality where central access may be delayed or unavailable) supports
**starting a dilute inotrope/vasopressor infusion via a reliable peripheral line** (with close
monitoring for extravasation, and a plan to secure central/intraosseous access promptly) rather
than deferring inotropic support until central access is achieved — the delay itself is harmful in
decompensated shock. **Adrenaline** is a commonly used first-line peripheral inotrope in
paediatric septic shock in resource-limited settings (in adult SA practice, the STG position has
shifted toward noradrenaline as first-line for septic shock — the paediatric evidence base and SA
paediatric STG position should be checked locally as this is an evolving area) [EK]. Intraosseous
(IO) access is the standard immediate-access fallback in a child with septic shock and no rapid IV
access — any resuscitation drug or fluid that can go IV can go IO, and IO access should be
obtained without prolonged repeated attempts at peripheral IV in a decompensating child.

**Management anchors:** early recognition (PAT + shock staging), oxygen, IV/IO access, cautious
reassessed fluid boluses as above, early empiric broad-spectrum antibiotics within the first hour
(source-appropriate — consider meningitis-dose antibiotics if any suspicion, §2.5), glucose
correction, source control, escalate to inotropes early rather than late, involve
PICU/retrieval early for any child not rapidly responding to first-line measures.

**Consultant traps & pearls:**
- *Trap:* repeating fluid boluses on a fixed protocol without reassessing after each one — this is
  precisely the FEAST-era error.
- *Trap:* waiting for central access before starting any vasoactive support.
- *Pearl:* a child with septic shock who is not improving after appropriate initial fluid and
  early antibiotics needs inotropes and senior/PICU involvement — do not keep escalating fluid
  alone as the only lever.

#### 2.2.3 Status epilepticus — the ladder

**Definition (operational):** a seizure lasting ≥5 minutes, or recurrent seizures without
recovery of consciousness between them, is treated as status epilepticus and managed on a timed
ladder rather than awaited to self-terminate — earlier treatment is more effective and delay
predicts refractoriness. [EK — standard convulsive status epilepticus definition/approach]

**Ladder with doses/kg** [EK — mainstream paediatric status epilepticus protocol, structurally
aligned with APLS/SA STG]:
1. **0–5 min:** ABC, oxygen, glucose check (treat hypoglycaemia immediately if present, §2.1.3 /
   §3), position safely, time the seizure.
2. **First-line benzodiazepine (5 min mark):** **IV lorazepam 0.1 mg/kg** (preferred where
   available — longer duration, less respiratory depression than diazepam) OR **IV diazepam 0.2–
   0.3 mg/kg** if lorazepam unavailable OR, if no IV access, **buccal/intranasal midazolam 0.3
   mg/kg** or **rectal diazepam 0.5 mg/kg** — the route should not delay the first dose; use
   whatever access is fastest.
3. **Second benzodiazepine dose (10 min mark, if still seizing):** repeat the first-line
   benzodiazepine once.
4. **Second-line agent (if still seizing at ~15–20 min, "established status"):** a loading dose
   of **phenytoin 20 mg/kg IV** (given slowly, with cardiac monitoring — risk of arrhythmia/
   hypotension with rapid infusion) OR **phenobarbitone 20 mg/kg IV** (particularly favoured in
   neonates, §2.1.6) OR, increasingly, **levetiracetam 40–60 mg/kg IV** where available (fewer
   haemodynamic side effects, no cardiac monitoring requirement, increasingly preferred as
   second-line where stocked).
5. **Refractory status epilepticus (seizing at ~30–40 min despite the above, "third-line"):**
   escalate to **rapid sequence induction and intubation with a continuous infusion of
   midazolam, thiopentone, or propofol** (propofol infusion used cautiously and typically avoided
   as a prolonged infusion in young children given propofol infusion syndrome risk) under
   PICU/anaesthetic care — this stage requires senior involvement and controlled ventilation, it
   is not managed alone on a general ward.

**Consultant traps & pearls:**
- *Trap:* under-dosing benzodiazepines out of fear of respiratory depression — under-treated
  status epilepticus itself causes hypoxic brain injury; treat promptly at the correct dose and
  manage the airway as needed.
- *Trap:* forgetting glucose — hypoglycaemic seizures will not respond to anticonvulsants and the
  ladder should not proceed past step 1 without a glucose check.
- *Pearl:* always ask "why is this child seizing" in parallel with the ladder — fever (simple
  febrile seizure vs a CNS infection presenting with seizure, §2.5), a known epilepsy
  non-adherence story, a metabolic cause, or a structural lesion each change what happens after
  the seizure is terminated.

#### 2.2.4 Raised intracranial pressure in the child

**Recognise the Cushing triad (hypertension, bradycardia, irregular respiration)** as a late and
ominous sign, not an early one — by the time it appears, herniation risk is imminent. Earlier
signs: headache (worse lying flat/on waking, worse with straining), vomiting (classically
early-morning, without nausea preceding it), altered consciousness, papilloedema (a late sign,
may be absent even in significant raised ICP acutely), a bulging fontanelle in an infant
(§2.5), diplopia (VI nerve palsy — a false localising sign of raised ICP itself, not necessarily
a focal lesion), abnormal posturing (decorticate/decerebrate).

**Management anchors [EK — standard paediatric neuro-critical-care principles]:** head midline
and elevated to 30°, avoid neck-vein compression (tight ET-tube ties, cervical collar too
tight), maintain normocapnia (avoid hypercapnia which raises ICP via vasodilation; routine
aggressive hyperventilation is no longer recommended except as a brief temporising measure for
acute herniation), maintain adequate cerebral perfusion pressure (avoid hypotension), treat
seizures aggressively (seizures raise cerebral metabolic demand and ICP), analgesia/sedation to
control pain-driven ICP spikes, **hyperosmolar therapy** — **3% hypertonic saline (typically 3–5
mL/kg bolus)** or **mannitol (0.5–1 g/kg IV bolus)** for acute rises/herniation signs, treat fever
aggressively (fever raises cerebral metabolic demand), urgent neuroimaging and
neurosurgical/PICU involvement, glucose control (avoid both extremes). Lumbar puncture is
contraindicated with signs of raised ICP/mass effect/focal neurology until imaging has excluded a
contraindication (§2.5 discusses this in the meningitis-specific context).

#### 2.2.5 DKA in children — the cerebral oedema risk drives everything

**Diabetic ketoacidosis in children is managed more cautiously than in adults specifically
because of the risk of cerebral oedema, which is a leading cause of DKA-related death and
morbidity in children and is strongly associated with the rate/volume of fluid and the rate of
osmotic/glucose change, not just the degree of acidosis itself.** [EK — well-established
paediatric DKA teaching, ISPAD-aligned]

**The fluid caution:**
- Assess dehydration clinically (paediatric DKA dehydration is frequently over-estimated by
  clinical signs because acidotic tachypnoea and ketotic breath can mimic more severe illness) —
  avoid defaulting to a "severe dehydration" fluid plan without clinical justification.
- **Fluid deficit is corrected slowly and evenly, typically over 48 hours** (not the more rapid
  24-hour correction used in non-DKA paediatric dehydration), specifically to avoid rapid
  osmotic shifts implicated in cerebral oedema.
- **Initial fluid bolus, if needed for haemodynamic compromise, is conservative** (e.g. 10 mL/kg,
  reassessed) rather than a large adult-style resuscitation bolus, unless the child is in
  frank decompensated shock — most children in DKA are not in shock and do not need an aggressive
  bolus at all.
- Fluid choice and rate calculations account for the calculated deficit plus maintenance,
  subtracting any bolus volume already given, spread evenly rather than front-loaded.

**No bolus insulin.** Insulin is started as a **low-dose continuous IV infusion** (commonly cited
around **0.05–0.1 units/kg/hour**), **without an initial IV bolus dose** — an insulin bolus causes
a more rapid fall in osmolality/glucose and is specifically avoided in paediatric DKA protocols
for the same cerebral oedema reason as the fluid caution. Insulin is typically not started until
some initial fluid resuscitation has begun (commonly after the first 1 hour), and the glucose is
allowed to fall gradually (a target fall rate, e.g. not exceeding roughly 5 mmol/L/hour, is used
in some protocols) — if glucose falls too fast, dextrose is added to the running fluids rather
than stopping/reducing insulin (insulin continues at a rate sufficient to switch off ketogenesis
and correct the acidosis; glucose is managed by adjusting the dextrose concentration of the
fluid, not by stopping insulin). [EK]

**Cerebral oedema recognition and treatment:** classically presents 4–12 hours into treatment (a
child who was improving and then deteriorates — headache, slowing heart rate, rising blood
pressure, altered consciousness, incontinence, specific neurological signs) — this is a clinical
emergency requiring **immediate treatment (hypertonic saline or mannitol as above) before imaging**,
not a "get a CT first" pathway — treatment should not be delayed for confirmatory imaging in a
child with a clinical picture consistent with cerebral oedema during DKA treatment. [EK]

**Consultant traps & pearls:**
- *Trap:* transplanting an adult DKA protocol (rapid fluid resuscitation, insulin bolus) onto a
  child — this is a recognised cause of preventable harm.
- *Trap:* missing early cerebral oedema because the child is assumed to be "just tired from being
  unwell" — any new headache, behavioural change, or slowing pulse during DKA treatment triggers
  an immediate reassessment for cerebral oedema, not observation.
- *Pearl:* potassium replacement is started early (once potassium and urine output are confirmed
  adequate, often concurrently with or shortly after starting fluids and insulin) because insulin
  drives potassium intracellularly and a child can become dangerously hypokalaemic even from a
  starting potassium that looked normal or high (total-body potassium is typically depleted
  despite a normal/high serum level at presentation, due to acidosis-driven extracellular shift).

#### 2.2.6 The drowning/near-drowning child

**Mechanism:** hypoxic injury is the primary driver of morbidity/mortality (not the historical
fresh-water vs salt-water electrolyte distinction, which is clinically insignificant in practice)
— the priority is oxygenation and ventilation, not electrolyte correction. **Any submersion
event with even brief loss of consciousness, cough, or respiratory symptoms warrants a period of
observation** (commonly 4–6 hours, longer/admit if any respiratory symptoms, hypoxia, or altered
consciousness) because of the risk of delayed-onset pulmonary oedema/ARDS from aspirated fluid,
even after an initially reassuring exam. [EK]

**Management anchors:** early high-flow oxygen, CPAP/PEEP for evolving pulmonary
oedema/ARDS-pattern hypoxia (aspirated water washes out surfactant), intubate for respiratory
failure/depressed consciousness, treat hypothermia (common and can itself cause
arrhythmia/bradycardia — rewarm actively but do not delay resuscitation), C-spine precautions if
a diving/shallow-water mechanism is possible, glucose check, treat seizures, neuroprotective
measures as for any hypoxic-ischaemic insult (avoid hyperthermia, treat seizures, target
normocapnia/normal glucose) once resuscitated. Prognosis correlates strongly with submersion
duration and time to effective CPR/return of spontaneous circulation — resuscitation should still
be attempted even after prolonged submersion in cold water given occasional dramatic recoveries,
per standard paediatric arrest teaching, but this is a senior/team decision in real time, not a
protocol to apply blindly.

#### 2.2.7 Paediatric arrest algorithm anchors

**Compressions and ratios:** high-quality chest compressions (rate 100–120/min, depth
approximately one-third of the anteroposterior chest diameter — roughly 4 cm in an infant, 5 cm
in a child), compression-to-ventilation ratio **15:2 with two rescuers** (paediatric-specific;
30:2 for a single lay rescuer), minimising interruptions. [EK — ILCOR/PALS-aligned]

**Defibrillation: 4 J/kg** for both the first and subsequent shocks in a shockable rhythm
(VF/pulseless VT — uncommon as an initial paediatric arrest rhythm compared with adults, where
asystole/PEA from a respiratory or hypovolaemic cause dominates, but always assess rhythm and
shock if indicated) [EK — standard paediatric defibrillation dose, PALS-aligned].

**Adrenaline 10 mcg/kg IV/IO** (i.e. 0.1 mL/kg of the 1:10,000 concentration, or the equivalent
correctly diluted from 1:1,000), repeated every 3–5 minutes during ongoing arrest — this is the
single most important drug dose to have memorised cold, as it is used in essentially every
paediatric arrest regardless of rhythm. [EK — standard PALS dose]

**Reversible causes — the 4 H's and 4 T's** (hypoxia, hypovolaemia, hyper/hypokalaemia and
metabolic, hypothermia; tension pneumothorax, tamponade, toxins, thrombosis) are actively sought
during every arrest, not reviewed only afterward — in children, **hypoxia and hypovolaemia are
disproportionately the drivers** compared with the primary cardiac causes that dominate adult
arrests, reflecting the respiratory/circulatory origin of most paediatric arrests. **Airway and
breathing take primacy in paediatric resuscitation reasoning** even within an ABC(DE) sequence
common to all resuscitation — a paediatric arrest is far more often a respiratory arrest that
progressed to cardiac arrest than a primary cardiac event, which is why early, effective
ventilation is disproportionately important to paediatric outcomes compared with adult
resuscitation, where compression quality and rhythm-directed therapy dominate.

**Consultant traps & pearls:**
- *Trap:* under-dosing adrenaline by miscalculating the 1:10,000 vs 1:1,000 dilution under
  pressure — know the concentration you are drawing up.
- *Trap:* treating a paediatric arrest like a scaled-down adult arrest and under-prioritising
  airway/ventilation quality.
- *Pearl:* if the arrest is witnessed and sudden with no preceding respiratory deterioration,
  raise suspicion for a primary cardiac cause (arrhythmia, cardiomyopathy, undiagnosed
  channelopathy) — this changes post-resuscitation work-up (12-lead ECG, family screening
  discussion) even though it is a less common paediatric arrest pattern.

### 2.3 Respiratory

#### 2.3.1 Bronchiolitis — the supportive-care discipline

**Bronchiolitis is a clinical diagnosis** (first episode of wheeze/crackles with a viral
coryzal prodrome in an infant, classically <12 months, RSV the dominant pathogen) and **the
single biggest paediatric respiratory teaching point is what NOT to give.** Evidence
consistently shows no meaningful benefit from routine bronchodilators, corticosteroids, or
antibiotics in uncomplicated bronchiolitis, and each carries its own cost/harm (unnecessary
tachycardia and cost from salbutamol trials, no benefit from steroids because the pathology is
mucosal oedema/mucus plugging rather than the bronchospasm/smooth-muscle-mediated pathology
that inhaled therapies target, unnecessary antibiotic exposure driving resistance when the
disease is viral). [EK — mainstream bronchiolitis guideline consensus, e.g. NICE/AAP-aligned]
- **When NOT to give salbutamol:** as routine therapy — a trial is not indicated in typical
  bronchiolitis; if there is diagnostic uncertainty with a wheeze phenotype more suggestive of
  viral-induced wheeze/early asthma (older infant, personal/family atopy history, previous
  wheeze episodes), a *single closely-monitored trial* with objective reassessment (not
  reflexive continuation regardless of response) is a reasonable individualised exception, but
  it is the exception, not the rule.
- **When NOT to give steroids:** essentially never in first-episode bronchiolitis in an infant —
  no proven benefit.
- **When NOT to give antibiotics:** unless there is a specific secondary bacterial concern (e.g.
  concurrent otitis media requiring its own treatment, or a clinical picture suggesting bacterial
  pneumonia rather than bronchiolitis) — fever and respiratory distress alone in typical
  bronchiolitis do not justify antibiotics.
- **What IS the treatment:** supportive care — oxygen if saturations fall below the unit's
  threshold, nasal suctioning for secretions obstructing feeding/breathing, feeding support
  (NG feeds or IV fluids if oral intake is inadequate — avoid over-hydration), monitoring for
  apnoea in high-risk infants (below), and **high-flow nasal cannula (HFNC) oxygen therapy** as an
  escalation step for infants with increasing work of breathing/oxygen requirement before
  resorting to CPAP/intubation — HFNC provides warmed humidified oxygen at flow rates that
  generate modest positive pressure and improved gas conditioning/secretion clearance, and has
  become a standard intermediate respiratory support step in bronchiolitis at facilities where it
  is available. [EK]
- **Apnoea risk** is disproportionately concentrated in **young infants (<2–3 months corrected
  age) and ex-premature infants**, in whom bronchiolitis can present with or evolve into apnoea as
  the dominant/presenting feature rather than classic wheeze/crackles — this age/prematurity group
  warrants a lower threshold for admission and cardiorespiratory monitoring even with a
  seemingly mild respiratory exam.

#### 2.3.2 Croup — Westley bands and the must-not-miss set

**Croup (laryngotracheobronchitis)** — barking cough, inspiratory stridor, hoarse voice, usually
viral (parainfluenza), typically 6 months–6 years, worse at night, classically improves
temporarily with cool air/crying resolution.

**Westley croup score** [EK — standard scoring tool, structured for the app as a scored
component]: stridor (0 none, 1 with agitation, 2 at rest), retractions (0 none, 1 mild, 2
moderate, 3 severe), air entry (0 normal, 1 decreased, 2 markedly decreased), cyanosis (0 none, 4
with agitation, 5 at rest), level of consciousness (0 normal, 5 disoriented). **Bands:** mild
(≤2), moderate (3–7), severe (≥8) — bands guide the intensity of treatment and disposition below.

**Management anchors [EK]:**
- **Dexamethasone** — a single oral (or IM/IV if vomiting/severe) dose, commonly cited around
  **0.15–0.6 mg/kg** (0.15 mg/kg shown effective for mild-moderate croup in trials; 0.6 mg/kg is
  the more traditional/higher dose still widely used, particularly for moderate-severe disease) —
  given for essentially all croup presenting for medical assessment, including mild cases, as it
  reduces the need for further intervention and re-presentation.
- **Nebulised adrenaline** (typically 1:1000 adrenaline nebulised, e.g. 0.5 mL/kg up to a max
  volume/dose per local protocol) for **moderate-severe croup** (stridor at rest) — provides rapid
  but temporary relief via mucosal vasoconstriction/oedema reduction; **any child given nebulised
  adrenaline must be observed for a minimum period (commonly 2–4 hours) for rebound worsening of
  stridor as the effect wears off** before being considered for discharge — discharging
  immediately after apparent improvement is a recognised error.
- Cool mist/humidified air has not been shown to add clear benefit but is low-risk/low-cost
  supportive practice in some settings; keeping the child calm and undisturbed (minimal
  handling, avoid examining the throat/agitating the child) is itself a management step, since
  agitation/crying worsens dynamic airway obstruction.

**The must-not-miss set — mimics that are NOT typical viral croup:**
- **Epiglottitis:** toxic-looking, high fever, drooling, tripod/sniffing position, reluctance to
  lie down or be examined, minimal/absent cough (contrasts with croup's barking cough) —
  historically Hib-related and now rarer with Hib vaccination but still occurs; **do NOT examine
  the throat/attempt to visualise the epiglottis or agitate the child** if suspected — this can
  precipitate complete airway obstruction; keep the child calm with the caregiver, get senior
  anaesthetic/ENT help immediately for controlled airway management in theatre.
- **Bacterial tracheitis:** toxic, high fever, croup-like onset that progressively worsens
  (unlike typical viral croup which usually improves with dexamethasone), poor response to
  standard croup treatment, thick purulent tracheal secretions — a bacterial superinfection
  requiring antibiotics and often intubation for secretion management.
- **Foreign body aspiration/inhalation:** sudden onset without a preceding coryzal illness, history
  of choking episode (may not always be witnessed), asymmetric or absent air entry, can present
  with stridor if lodged high or wheeze if lodged lower — a history of sudden-onset symptoms in a
  previously well child without a viral prodrome should always prompt this consideration.
- **Retropharyngeal/peritonsillar abscess:** neck stiffness/torticollis, drooling, muffled
  ("hot potato") voice, trismus, unilateral findings — more common in older children for
  peritonsillar, younger for retropharyngeal.
- **Anaphylaxis with angioedema:** history of exposure, urticaria, other systemic features —
  treat as anaphylaxis (adrenaline IM) if suspected, not as croup.

#### 2.3.3 Severe pneumonia per IMCI/STG

**IMCI chest-indrawing bands** [fetched/EK — IMCI SA-aligned structure]: cough or difficult
breathing plus **fast breathing** (age-banded respiratory rate thresholds, §3) classifies as
**pneumonia** (treat as outpatient with oral antibiotics if no danger signs); plus **lower chest
wall indrawing** (or any IMCI general danger sign) classifies as **severe pneumonia or very
severe disease** — admit, give first-dose antibiotic, oxygen if hypoxic, urgent referral. Stridor
in a calm child is itself a severe-classification feature (upper airway involvement/near-complete
obstruction risk).

**Oxygen thresholds:** supplemental oxygen is indicated for SpO₂ below the unit's threshold
(commonly cited around **<90%** on room air as the trigger for oxygen in resource-limited
paediatric guidance, sometimes <92–94% in better-resourced settings) [EK], and clinical signs of
hypoxia (central cyanosis, inability to feed due to respiratory distress, grunting) should
prompt oxygen even before/regardless of a saturation reading if pulse oximetry is not
immediately available — treat the visibly hypoxic child, do not wait for the number.

**Staphylococcal pneumonia and pneumatocoeles:** consider *S. aureus* in a rapidly progressive,
severe pneumonia, especially in young infants or post-influenza/post-measles, with a
characteristic radiological evolution toward **pneumatocoeles** (thin-walled air cysts) and risk
of **empyema/pneumothorax** — this changes antibiotic choice (needs staphylococcal cover,
e.g. cloxacillin, and MRSA consideration per local resistance patterns) and mandates closer
monitoring for complications requiring drainage.

**PJP (Pneumocystis jirovecii pneumonia) in HIV-exposed infants — the sats-CXR dissociation.**
Consider PJP specifically in an **HIV-exposed or HIV-infected infant, classically 2–6 months of
age**, presenting with disproportionately severe hypoxia/tachypnoea relative to a CXR that may
show only subtle bilateral perihilar/interstitial infiltrates or diffuse ground-glass change —
**the degree of hypoxia is often "worse than the film looks,"** the opposite of the usual
correlation expected with typical bacterial pneumonia, and this dissociation is itself a
diagnostic clue. Treat empirically with **high-dose co-trimoxazole** (the mainstay) plus
adjunctive corticosteroids for moderate-severe hypoxia, alongside urgent HIV testing/PCR if
status is not yet known — PJP is frequently the presenting illness that reveals previously
undiagnosed infant HIV infection. [EK — well-established PJP-in-HIV-exposed-infant teaching,
central to SA paediatric HIV practice]

#### 2.3.4 Asthma — acute severity grading

**Grading (mild / moderate / severe / life-threatening)** by ability to talk in sentences/phrases/
words, respiratory rate and work of breathing against age norms, SpO₂ (mild-moderate typically
≥92%, severe <92% on air), peak flow if age-appropriate and able to perform (typically usable from
~5–6 years), presence of a silent chest/cyanosis/exhaustion/altered consciousness marking
life-threatening asthma (a silent chest is a pre-arrest sign — absence of wheeze in a severely
distressed child means too little air is moving to generate a wheeze, not that the attack is
mild). [EK — standard paediatric asthma severity grading, BTS/SIGN-aligned structure]

**Management anchors:** oxygen to target saturation, **salbutamol** (nebulised or, increasingly
preferred, spacer-delivered — spacer with metered-dose inhaler is at least as effective as
nebuliser for mild-moderate exacerbations and reduces cross-infection/aerosol risk), **ipratropium
bromide** added for moderate-severe attacks, **oral or IV corticosteroids** early in
moderate-severe attacks, **IV magnesium sulfate** for severe attacks not responding to initial
bronchodilator therapy, escalating to IV salbutamol/aminophylline and PICU involvement for
life-threatening/refractory attacks. [EK]

#### 2.3.5 TB in children — the diagnostic difficulty

**Why paediatric TB is hard:** children, especially young children, have paucibacillary disease
(low organism burden), cannot reliably produce sputum, and present with nonspecific symptoms
(failure to thrive, chronic cough, persistent fever, lethargy) that overlap enormously with other
common childhood conditions — culture/GeneXpert sensitivity is correspondingly lower than in
adult pulmonary TB, making paediatric TB substantially a **clinical/scoring diagnosis** rather
than a purely microbiological one.

**Diagnostic approach:**
- **Symptom-based scoring systems** (various validated scoring tools combine: chronic
  symptoms — cough/fever/weight loss >2–3 weeks, a positive TB contact history, a positive
  tuberculin skin test/IGRA, suggestive CXR findings, and nutritional status) are used to support
  a clinical diagnosis when microbiological confirmation is not obtained, given the diagnostic
  yield ceiling above. [EK]
- **Specimen collection in a child who cannot expectorate:**
  - **Gastric washings/aspirates** — collected early morning (before feeding, while the child is
    still fasted and swallowed overnight sputum sits in the stomach), via NG tube, classically on
    3 consecutive mornings — the traditional specimen for young children.
  - **Induced sputum** — nebulised hypertonic saline to stimulate a cough/expectoration, with
    suction if needed; increasingly preferred over gastric washings where the expertise/equipment
    exists as it is better tolerated and has comparable or better yield.
  - **Nasopharyngeal aspirate** — an alternative, less invasive option in some protocols.
  - **GeneXpert (Xpert MTB/RIF or Ultra)** is run on whichever of the above respiratory specimens
    is obtained (gastric aspirate, induced sputum, or NPA) — it is the frontline rapid molecular
    test in the SA programme, giving same-day rifampicin-resistance information alongside
    detection, and its use has substantially shortened time-to-treatment compared with waiting for
    culture, even though its sensitivity in paucibacillary paediatric disease remains imperfect
    (a negative GeneXpert does NOT exclude TB in a child with a compatible clinical/scoring
    picture — treatment can still be started on clinical grounds). [EK/fetched — GeneXpert as SA
    programme standard]
- **Stool GeneXpert** is an emerging/increasingly used alternative specimen in young children
  (avoids NG tube/induction), gaining traction where validated locally. [EK]
- Extrapulmonary TB (lymphadenitis, TB meningitis, miliary/disseminated disease, abdominal TB,
  spinal TB) requires site-specific sampling (lymph node aspirate/biopsy, CSF, imaging) and its
  own index of suspicion — TB meningitis in particular is a devastating, time-critical diagnosis
  in young children (§2.5 discusses the meningitis differential; a subacute course with cranial
  nerve palsies and a CSF picture of markedly raised protein with lymphocytic pleocytosis and low
  glucose should raise this specifically).

### 2.4 GIT

#### 2.4.1 Gastroenteritis and dehydration assessment

**WHO dehydration plans A/B/C** [fetched/EK — IMCI/WHO structure]:
- **Plan A (no dehydration):** home management — extra fluids (ORS after each loose stool),
  continue feeding, education on danger signs to return.
- **Plan B (some dehydration):** signs — restless/irritable, sunken eyes, drinks eagerly/
  thirsty, skin pinch goes back slowly — **ORS 75 mL/kg over 4 hours**, reassess.
- **Plan C (severe dehydration):** signs — lethargic/unconscious, sunken eyes, unable to
  drink/drinks poorly, skin pinch goes back very slowly (≥2 seconds) — **IV fluids urgently**:
  a widely-used structure is **100 mL/kg of Ringer's lactate (or normal saline if unavailable)**,
  given faster in the first hour and slower thereafter, split by age (e.g. infants <12 months:
  30 mL/kg over 1 hour then 70 mL/kg over 5 hours; older children: 30 mL/kg over 30 minutes then
  70 mL/kg over 2.5 hours) — reassess frequently and start oral/NG ORS as soon as the child can
  drink, alongside IV fluids. [EK — classic WHO Plan C structure, exact splits should be checked
  against the current SA IMCI chart]

**Hypernatraemic dehydration pitfalls:** occurs particularly with high-solute-loss diarrhoea or
inappropriate home management with over-concentrated formula/fluids; the child can look
deceptively less unwell for the degree of fluid deficit (doughy rather than classically "tented"
skin turgor, irritability out of proportion to exam) because water is drawn preferentially from
the intracellular space, relatively preserving intravascular volume/skin turgor signs early —
**the key management pitfall is over-rapid correction**, which risks cerebral oedema from a rapid
osmotic shift as extracellular sodium falls faster than intracellular osmoles can adjust; fluid
deficit in hypernatraemic dehydration is corrected **more slowly than standard plan C**
(typically over 48 hours rather than 24), with frequent sodium monitoring and a target fall rate
(commonly not exceeding ~0.5 mmol/L/hour, i.e. roughly ≤10–12 mmol/L per 24 hours) — the same
"slow correction" principle as DKA and for the same underlying cerebral-oedema-risk reason. [EK]

**When IV is needed** (beyond frank Plan C): persistent vomiting preventing oral/NG rehydration,
abdominal distension/ileus, altered consciousness, or failure of ORS/NG rehydration trial.

**ReSoMal, not standard ORS, in severe acute malnutrition.** Standard WHO ORS is
**relatively high in sodium and low in potassium/glucose for the metabolically fragile SAM
child** (§2.6) — in a child with SAM and dehydration, **ReSoMal (Rehydration Solution for
Malnutrition)**, a modified low-sodium, higher-potassium, glucose-supplemented solution, is used
instead, given more slowly and in smaller volumes than standard Plan B/C to avoid precipitating
fluid overload/cardiac failure in a child whose myocardium and renal handling of a sodium/fluid
load are both compromised by malnutrition — this is one of the clearest examples in paediatrics
of a standard protocol being actively wrong for a specific vulnerable subgroup, and using
standard ORS/Plan-C-volume fluids in a SAM child is a recognised cause of iatrogenic death. [EK —
core WHO/SAM management principle, cross-referenced in §2.6]

#### 2.4.2 The surgical abdomen by age

**Pyloric stenosis:** classically a **firstborn male, 2–8 weeks of age**, with **projectile,
non-bilious vomiting after feeds**, progressive, with the infant remaining hungry after
vomiting ("hungry vomiter"). Exam: a palpable "olive" mass in the right upper quadrant/epigastrium
(best felt after a test feed, with a relaxed abdomen), visible peristaltic waves. **The classic
biochemical signature is a hypochloraemic, hypokalaemic metabolic alkalosis** — from repeated loss
of HCl-rich gastric contents (hypochloraemia, metabolic alkalosis) with renal potassium wasting as
the kidney preferentially conserves sodium (exchanging potassium and hydrogen ions) in the
volume-depleted state, which paradoxically produces a further "paradoxical aciduria" despite
systemic alkalosis. Diagnosis confirmed by ultrasound (pyloric muscle thickness/length
criteria). **Management is NOT primarily surgical urgency — it is medical correction first**:
correct the dehydration and, critically, the electrolyte/acid-base abnormality (IV fluids with
added potassium once urine output confirmed) *before* proceeding to pyloromyotomy — operating on
an alkalotic, hypokalaemic infant carries anaesthetic risk (post-operative apnoea risk is
increased with uncorrected alkalosis) and correction takes priority over surgical speed. [EK]

**Intussusception:** classically **3 months–3 years** (peak ~6–18 months), **intermittent severe
colicky abdominal pain with the infant drawing up the legs, episodes separated by intervals of
lethargy/normal behaviour**, **"redcurrant jelly" stool** (a late sign — do not wait for it),
vomiting (may become bilious later), a palpable **sausage-shaped mass** (often right side/upper
abdomen). Older children (>2–3 years) with intussusception should prompt a search for a **lead
point** (Meckel's diverticulum, polyp, lymphoma — henoch-schönlein purpura-related bowel wall
haematoma is another recognised lead point) rather than assuming idiopathic disease as in the
typical infant age group. Diagnosis: ultrasound (**"target"/"doughnut" sign** on transverse view).
Management: **air or contrast enema reduction** (both diagnostic and therapeutic) in a
haemodynamically stable child without peritonism, performed with surgical back-up immediately
available for perforation risk; surgery (manual reduction or resection) for failed enema
reduction, peritonism, perforation, or a pathological lead point.

**Malrotation with volvulus — bilious vomiting in an infant is volvulus until proven
otherwise.** This is one of the highest-stakes single teaching points in paediatric surgery:
**bilious (green) vomiting in an infant, especially in the first weeks/months of life, is a
surgical emergency requiring immediate exclusion of malrotation with midgut volvulus** — delay
risks midgut infarction and catastrophic short-bowel outcome or death within hours. Bilious
vomiting is NOT attributed to reflux, gastroenteritis, or a feeding problem without actively
excluding volvulus first. Associated signs (may be present or absent depending on stage):
abdominal distension (may be minimal early, as the obstruction is often proximal), abdominal
tenderness/peritonism (a marker of ischaemia — a surgical emergency requiring immediate
laparotomy without waiting for imaging if present with bilious vomiting), haematochezia (a late,
ominous sign of bowel ischaemia). **Investigation: upper GI contrast study is the definitive test**
(looking for an abnormal duodenojejunal flexure position/a "corkscrew" appearance of contrast) —
but **if the child is unwell with peritonism, go straight to theatre rather than waiting for
imaging.** Ultrasound (whirlpool sign of the mesenteric vessels) can support the diagnosis where
available/operator-expertise permits but should not delay surgical referral in a sick infant.
[EK — universally taught "bilious vomiting = volvulus until proven otherwise" principle]

**Appendicitis in the young child:** presents atypically and is disproportionately likely to
present late/perforated compared with older children/adults, because young children
communicate pain poorly, the presentation is nonspecific (irritability, poor feeding, vomiting,
low-grade fever, a reluctance to move/limp from psoas irritation), and the omentum is less
developed to wall off a perforation — **maintain a high index of suspicion for appendicitis in any
young child with unexplained abdominal pain/irritability/fever, and have a low threshold for
surgical review**, as clinical scoring systems (e.g. Alvarado, PAS) are less reliable in this age
group than in older children/adults.

#### 2.4.3 GI bleeding by age

- **Neonate:** swallowed maternal blood (Apt-Downey test distinguishes fetal from maternal
  haemoglobin), haemorrhagic disease of the newborn (vitamin K deficiency — always confirm
  vitamin K was given at birth), NEC (§2.1.8), cow's milk protein allergy-related colitis, stress
  ulceration.
- **Infant:** intussusception (redcurrant jelly stool), Meckel's diverticulum (classically
  painless, brisk, bright-red or "brick-red"/maroon rectal bleeding), anal fissure (small
  streaks, associated with constipation — the most common cause of visible blood in this age
  overall), cow's milk protein allergy/infectious colitis.
- **Child:** infectious colitis, polyps (juvenile polyps — painless bleeding, usually benign),
  Meckel's diverticulum, Henoch-Schönlein purpura (bloody stool with the characteristic purpuric
  rash/arthralgia/abdominal pain triad), peptic ulcer disease (less common than in adults but
  occurs, including stress ulceration in a critically ill child).
- **Adolescent:** peptic ulcer disease, inflammatory bowel disease (bloody diarrhoea with
  systemic features/weight loss/growth faltering should raise this), oesophageal
  varices (if underlying liver disease/portal hypertension).

### 2.5 Fever without focus, meningitis, and the petechial child

#### 2.5.1 Fever without focus by age band

**The <3-month rule.** Any infant under 3 months with a fever (commonly defined as rectal/core
temperature ≥38°C) is managed as **potentially septic until proven otherwise**, regardless of how
well the infant looks, because clinical assessment alone is insufficiently sensitive to exclude
serious bacterial infection (SBI — bacteraemia, meningitis, UTI) in this age group. **Standard
approach: full septic screen (FBC, CRP, blood culture, urine — catheter/suprapubic, not bag —
microscopy/culture, and lumbar puncture in most protocols for this age unless contraindicated,
CXR if respiratory signs) and empiric IV antibiotics started while awaiting results**, with
admission for observation — outpatient "wait and see" management is not appropriate for a febrile
infant under this age threshold in standard practice. [EK — long-standing, near-universal
paediatric emergency medicine standard; the exact age cut-off and low-risk-criteria stratification
some protocols use (e.g. more selective work-up for a well-appearing infant 29–90 days meeting
strict low-risk criteria) vary by protocol/resource setting — the SA district-hospital-appropriate
default is the more conservative "full screen + empiric treatment" approach given limited
same-day follow-up capacity.]

**3–36 months risk stratification.** In this age band, clinical assessment (appearance, the
IMCI/PAT-type gestalt, identifiable focus on exam) becomes more reliable, and the approach shifts
toward **finding a focus** (ear, throat, chest, urine, skin/joint) and **risk-stratifying** rather
than reflexive full septic screening of every febrile child: a **well-appearing, fully immunised
child with no identifiable focus and no danger signs** can often be managed with focused
investigation (urine dipstick/culture particularly in girls <2 years and uncircumcised boys <1
year, given the relatively high occult UTI prevalence in this group) and safety-netting, whereas
an **ill-appearing child, incompletely immunised, or one with any IMCI danger sign** is treated
with the same urgency as the <3-month group regardless of exact age. [EK]

#### 2.5.2 Meningitis — age-specific signs

**The infant triad is different from the older-child/adult triad.** Classic meningismus (neck
stiffness, photophobia, headache) is **frequently absent in infants**, who instead present with
the nonspecific sepsis picture (§2.1.1) plus, more specifically: **a bulging fontanelle,
irritability (especially a high-pitched/inconsolable cry, or paradoxically increased irritability
when handled/comforted — "paradoxical irritability"), and poor feeding** — this triad (bulging
fontanelle/irritability/poor feeding) should be treated with the same weight as neck
stiffness/photophobia in an older child. Other infant signs: lethargy, temperature instability,
apnoea, seizures, a high-pitched cry, hypotonia or, less commonly, hypertonia/opisthotonus in
advanced disease. **Older children/adolescents** present more classically: fever, headache, neck
stiffness, photophobia, vomiting, Kernig's/Brudzinski's signs (both insensitive but supportive if
present), altered consciousness, and, in meningococcal disease specifically, the petechial/
purpuric rash (§2.5.3).

**LP contraindications:** signs of raised ICP with risk of herniation (focal neurological signs,
significantly depressed/fluctuating consciousness, papilloedema, abnormal posturing), cardio­
respiratory instability (LP should not delay resuscitation/be attempted in an unstable child),
a bleeding diathesis/thrombocytopenia/anticoagulation, local infection at the LP site. **A CT scan
before LP is NOT mandatory in every case** — it is reserved for those with focal neurology, papilloedema,
significantly reduced GCS, or new-onset seizures — a normal CT does not fully exclude a
herniation risk either, so clinical judgement about safety to proceed remains paramount, and **if
LP is contraindicated/delayed, empiric antibiotics must not be delayed** — treat first, LP when/if
safe. [EK]

**Dexamethasone timing.** In bacterial meningitis (particularly *H. influenzae* type b and
pneumococcal meningitis in the historical evidence base), adjunctive dexamethasone reduces the
risk of neurological sequelae (notably hearing loss) **when given with or just before the first
dose of antibiotics** — its benefit is lost or diminished if given after antibiotics have already
been running for some hours, because the mechanism (blunting the inflammatory response to
bacterial lysis) depends on being on board before/at the moment bacterial killing begins. Practical
rule: **do not delay antibiotics to arrange dexamethasone, but if both can be given essentially
together, give the dexamethasone first or simultaneously.** [EK — well-established bacterial
meningitis adjunct-therapy timing principle]

**Chemoprophylaxis.** Close contacts of confirmed **meningococcal** disease (household contacts,
and other close-contact categories per local protocol) receive chemoprophylaxis (typically
**rifampicin, ciprofloxacin, or ceftriaxone** depending on age/pregnancy status and local
availability) to eradicate nasopharyngeal carriage and prevent secondary cases, given as soon as
possible after exposure identification (ideally within 24 hours) — this is a public-health/
notifiable-disease action taken in parallel with treating the index case (§6). Close contacts of
confirmed **Hib** meningitis also receive chemoprophylaxis per similar principles in
under-vaccinated/incompletely-vaccinated contact groups.

#### 2.5.3 The petechial child

**A febrile child with a petechial or purpuric rash is a medical emergency until meningococcal
disease is excluded** — the rash of meningococcaemia is classically non-blanching (test with a
glass tumbler/direct pressure), can start subtly (a few petechiae) and progress rapidly to
extensive purpura fulminans with DIC and shock, and the time from first petechiae to
life-threatening deterioration can be very short. **Any febrile child with petechiae/purpura
receives immediate empiric antibiotics (a third-generation cephalosporin, e.g. ceftriaxone, is
standard empiric cover) without waiting for confirmatory tests**, alongside full septic
shock-pathway assessment and resuscitation as needed. [EK]

**The broader differential of the petechial/purpuric child, once/alongside excluding sepsis:**
- **Meningococcaemia** — febrile, unwell, rapidly progressive, other sepsis signs, as above —
  the default assumption to exclude first, treated empirically pending it.
- **Immune thrombocytopenic purpura (ITP)** — classically a **well-looking** child (afebrile, no
  other systemic symptoms), often with a preceding viral illness, isolated thrombocytopenia on
  FBC with an otherwise normal blood count/film, bruising and petechiae but no
  hepatosplenomegaly/lymphadenopathy — the "well child with petechiae" pattern is reassuring
  against sepsis but the FBC should still be sent to confirm isolated thrombocytopenia and exclude
  the next differential.
- **Leukaemia/marrow infiltration** — petechiae from thrombocytopenia PLUS other cytopenia
  features (pallor from anaemia, recurrent infection from neutropenia), possible
  hepatosplenomegaly/lymphadenopathy/bone pain — the FBC/film here shows more than isolated
  thrombocytopenia (§2.8) and is the key discriminator from ITP.
- **Henoch-Schönlein purpura (IgA vasculitis)** — classically **palpable purpura in a
  gravity-dependent distribution** (buttocks, lower limbs), a **normal platelet count** (this is
  the key discriminator — HSP is a vasculitis, not a thrombocytopenic process, so purpura with a
  normal platelet count should specifically prompt this diagnosis rather than a bleeding disorder
  work-up), associated with arthralgia/arthritis, abdominal pain (can be a lead point for
  intussusception, §2.4.2), and renal involvement (haematuria/proteinuria requiring monitoring).
- **NAI pattern** — bruising/petechiae in unusual sites (torso, ears, neck — areas not typically
  injured accidentally), a pattern/shape suggestive of an implement, an inconsistent history, in
  a non-mobile or developmentally-inconsistent-with-the-injury child (§2.9) — always part of the
  differential for unexplained bruising/petechiae, particularly in a well, afebrile child where
  sepsis and haematological causes have been reasonably excluded.

**Discriminating approach:** the single most useful early discriminator is the **child's overall
clinical state (well vs unwell/toxic) and the FBC** — a toxic/unwell febrile child is treated as
meningococcal sepsis immediately regardless of other findings; a well child's FBC then separates
isolated thrombocytopenia (ITP) from a broader cytopenia picture (leukaemia) from a normal
platelet count with a vasculitic distribution (HSP), with the injury pattern/history/development
stage screened for NAI throughout.

### 2.6 Malnutrition beyond the existing SAM content — the metabolic fragility model

*(This section deliberately does not repeat the v1 SAM breadth content — it adds the physiological
"why" and the depth layer around it.)*

**The metabolic fragility model — why refeeding kills.** A severely malnourished child has
adapted its entire physiology to starvation: reduced basal metabolic rate, reduced cardiac
output/muscle mass (including the myocardium itself — a smaller, thinner heart with reduced
reserve), impaired sodium-potassium pump function leading to intracellular sodium excess and
potassium/magnesium/phosphate depletion **despite often near-normal serum levels** (the
serum values do not reflect true total-body depletion because of the deranged
intracellular/extracellular distribution — a "normal" potassium or phosphate on admission bloods
can mask severe total-body deficit). **Reintroducing calories/carbohydrate too fast (or too
concentrated) drives a sudden insulin surge that shifts phosphate, potassium, and magnesium
sharply intracellularly**, precipitating **refeeding syndrome**: acute hypophosphataemia (the
hallmark — impairs ATP generation, red cell 2,3-DPG, and can cause cardiac and respiratory muscle
failure), hypokalaemia and hypomagnesaemia (arrhythmia risk), fluid retention/overload (the
fragile myocardium cannot handle a rapid sodium/fluid load), and can precipitate sudden cardiac
failure/death in the first days of refeeding — this is why malnutrition management is one of the
few areas in paediatrics where **feeding too much, too fast is a direct cause of death**, not
merely a suboptimal choice.

**The F-75 → F-100 logic.** This staged feeding structure exists specifically to manage the
refeeding-syndrome risk:
- **F-75 (75 kcal/100 mL)** is a deliberately low-energy, low-protein, low-sodium therapeutic
  milk used in the **initial stabilisation phase** (typically the first ~2–7 days, or until the
  child is medically stable and appetite returns) — its purpose is *not* to promote rapid weight
  gain but to meet basic maintenance needs safely while the child's metabolism re-adapts, treating
  concurrent infection/electrolyte disturbance/hypoglycaemia/hypothermia in parallel, and feeding
  small, frequent volumes (often 2–3-hourly, sometimes with overnight feeds continued given the
  high risk of hypoglycaemia during sleep in this phase). Weight gain is NOT expected/desired in
  this phase — an unexpectedly rapid weight increase during F-75 should raise suspicion for fluid
  overload rather than being celebrated.
- **Transition to F-100 (100 kcal/100 mL, higher protein)** occurs once appetite has returned and
  oedema (if present, kwashiorkor) is resolving/reducing — this is the **catch-up growth phase**,
  with a deliberate stepwise increase in volume/frequency over about 2–3 days to allow the
  cardiovascular and renal systems to accommodate the higher solute/fluid load, watching closely
  for signs of fluid overload/cardiac failure (increasing respiratory rate, new crepitations,
  puffy eyelids increasing rather than resolving, engorged neck veins) at each step-up — if these
  appear, the escalation is paused/reversed, not pushed through. [EK — WHO/SAM management
  structure, cross-referenced with the app's existing v1 SAM content]

**Micronutrients.** Malnourished children are deficient in essentially all micronutrients but
specific ones drive specific, actionable clinical decisions: **vitamin A** (given routinely on
admission per protocol, with specific attention if there is any eye sign of deficiency — corneal
xerosis/ulceration is an emergency requiring immediate high-dose vitamin A to prevent blinding),
**zinc and other trace elements** (included in the combined mineral-vitamin mix added to
therapeutic feeds rather than plain milk alone — this is why malnourished children are never fed
plain full-cream milk/formula without the mineral-vitamin premix), **folate**, and **iron** —
critically, **iron is deliberately withheld during the initial stabilisation phase** (started only
once the child is in the catch-up/F-100 phase and clinically stable) because iron supplementation
during acute infection/before metabolic stabilisation can worsen outcomes (facilitating bacterial
growth in a child with impaired immune defences, and because iron is not the rate-limiting
step for erythropoiesis in the acute phase — the marrow is functionally suppressed by
infection/inflammation regardless of iron availability early on). [EK]

**TB/HIV co-assessment.** Severe acute malnutrition and TB/HIV are deeply intertwined in the SA
paediatric population — malnutrition can be the presenting/dominant feature of undiagnosed TB or
HIV, and conversely both TB and HIV are common precipitants/perpetuators of malnutrition that
will not resolve with feeding alone if the underlying infection is untreated. **Every child
admitted with SAM should be screened for TB (contact history, symptom screen, and
investigation per §2.3.5 as indicated) and tested for HIV** (with appropriate consent/counselling
per §6) as a standard, non-optional part of the SAM admission work-up, not an afterthought —
failure to identify and treat an underlying TB or HIV driver is a recognised cause of SAM
treatment failure/relapse.

**The outpatient RUTF pathway vs inpatient criteria.** Not every child with SAM needs inpatient
admission — the **community-based management of acute malnutrition (CMAM)** model triages:
- **Outpatient management with Ready-to-Use Therapeutic Food (RUTF)** is appropriate for a child
  with SAM (by weight-for-height/MUAC criteria, §5) who has a **preserved appetite** (passes an
  appetite test — able to consume an adequate portion of RUTF at the assessment), **no
  oedema or only mild (+ ) oedema** depending on the local protocol threshold, **no medical
  complications** (no danger signs, no severe illness requiring inpatient treatment), and a
  caregiver able to manage feeding/follow-up at home — such children are followed up regularly
  (commonly weekly) at an outpatient therapeutic programme site.
- **Inpatient admission criteria (Phase 1/stabilisation):** **failed appetite test**, **any IMCI
  danger sign**, **severe (+++) oedema or oedema with complications**, **any significant medical
  complication** (severe infection/pneumonia, severe anaemia, persistent vomiting/diarrhoea with
  dehydration, hypoglycaemia, hypothermia, altered consciousness), **very young infants** (a
  lower age/weight threshold, given higher risk in this group), or a caregiver situation unsafe
  for home management — these children start on F-75 inpatient stabilisation as above and only
  transition to the outpatient RUTF pathway once complications have resolved and the appetite
  test is passed. [EK — CMAM/WHO SAM triage structure]

### 2.7 Syndromic reasoning

#### 2.7.1 The dysmorphic newborn — approach and the big three trisomies

**Approach:** a structured head-to-toe dysmorphology exam (head shape/size, facial gestalt, ear
position/shape, eyes, palate, neck, hands — palmar creases/digit count and shape, feet, genitalia,
spine) combined with growth parameters and any associated structural anomaly found on antenatal
scan or newborn exam — **the finding of one congenital anomaly should always prompt a systematic
search for others**, because many recognisable patterns/associations involve multiple systems and
the first anomaly found is rarely the only one (below).

**Trisomy 21 (Down syndrome):** hypotonia (often the earliest/most consistent sign), flat
occiput/brachycephaly, upslanting palpebral fissures, epicanthic folds, small ears, flat nasal
bridge, protruding tongue (relative macroglossia), single palmar (simian) crease, wide sandal-gap
between first and second toes, short fifth finger with clinodactyly. **Associated emergencies to
actively screen for, not wait for symptoms of:**
- **Duodenal atresia** — presents with **bilious vomiting shortly after birth** and the classic
  **"double bubble" sign on abdominal X-ray** (dilated stomach and proximal duodenum, no distal
  gas) — a surgical emergency worked up the same way as any bilious-vomiting neonate (§2.4.2), and
  specifically anticipated/screened for in a newborn with Down syndrome features even before
  symptoms appear (many centres X-ray/observe feeding closely in the first days for this reason).
- **AVSD (atrioventricular septal defect) and other congenital heart disease** — present in a
  substantial proportion of infants with Down syndrome; **every newborn with suspected Down
  syndrome gets a cardiac assessment (examination plus a low threshold for echocardiography)
  before discharge**, because AVSD can be clinically silent in the first days/weeks (before
  pulmonary vascular resistance falls and the shunt becomes haemodynamically/audibly apparent) and
  a normal newborn cardiac exam does not exclude it.
- Other associations to screen for over time: hypothyroidism (screen at birth and periodically),
  atlantoaxial instability (relevant for anaesthetic positioning later in life), leukaemia (a
  markedly increased risk, including a transient neonatal leukaemoid reaction that can mimic
  true leukaemia and needs careful distinguishing), hearing and visual impairment, coeliac
  disease.

**Trisomy 18 (Edwards syndrome):** low birth weight/growth restriction, prominent occiput,
micrognathia, low-set malformed ears, **clenched fists with overlapping fingers** (a
characteristic hand posture — index over third, fifth over fourth), rocker-bottom feet, severe
associated structural anomalies (cardiac — VSD/other complex lesions, renal, and often
oesophageal/GI anomalies) — a very high early-mortality condition; management decisions
(intensity of intervention) are made in close consultation with the family and a specialist team
given the severity of associated anomalies and prognosis.

**Trisomy 13 (Patau syndrome):** microcephaly with structural brain anomaly (holoprosencephaly
spectrum), **cleft lip/palate**, **microphthalmia/other eye anomalies**, **polydactyly**
(post-axial), scalp defects (cutis aplasia), severe congenital heart disease — similarly a
very high early-mortality condition with the same family-centred, specialist-involved approach to
management decisions.

**CHARGE and VACTERL — the screening reflex when one anomaly is found.** Both are
**associations** (a non-random cluster of anomalies without a single identified genetic cause in
most classically-defined cases, as opposed to a syndrome with a single known aetiology) — the
practical teaching point is that **finding one component anomaly should trigger a systematic
screen for the others**, because missing an associated anomaly (particularly a cardiac or renal
one) has real consequences:
- **VACTERL:** **V**ertebral anomalies, **A**nal atresia, **C**ardiac defects, **T**racheo-
  oesophageal fistula, **E**sophageal atresia, **R**enal anomalies, **L**imb anomalies (radial ray
  defects) — a newborn found to have any one of these (e.g. imperforate anus on the newborn exam,
  or failure to pass an NG tube suggesting oesophageal atresia) should prompt a screen for the
  others: spinal/vertebral X-ray, echocardiogram, renal ultrasound, limb exam.
- **CHARGE:** **C**oloboma, **H**eart defects, **A**tresia choanae, **R**estricted growth/
  development, **G**enital abnormalities, **E**ar abnormalities (including a characteristic ear
  shape and hearing loss) — a newborn with choanal atresia (cyanosis relieved by crying, §2.1.4)
  or a coloboma found on eye exam should prompt this same systematic screen.

#### 2.7.2 The floppy infant

**Differential, localised by the level of the problem:**
- *Central (brain) — usually floppy WITH weakness but relatively preserved/brisk reflexes, and
  often other CNS signs (altered consciousness, seizures, abnormal cry, dysmorphism):* HIE
  (§2.1.7), congenital brain malformation, chromosomal/genetic syndromes (including Prader-Willi
  syndrome — floppy infant with poor feeding, characteristic facial features, evolving to
  hyperphagia/obesity later), inborn errors of metabolism, congenital hypothyroidism, sepsis/
  systemic illness (floppy from being generally unwell, without a primary neuromuscular cause).
- *Spinal cord:* birth trauma/spinal cord injury (rare), spinal muscular atrophy can have a spinal
  motor neuron component.
- *Anterior horn cell:* **spinal muscular atrophy (SMA) type 1** — profound weakness and
  hypotonia with **preserved alertness/normal cognition** (a classically described discriminator —
  the infant looks alert and engaged despite being profoundly weak), **absent/reduced deep tendon
  reflexes**, tongue fasciculations, a "frog-leg" posture, progressive respiratory weakness — a
  key diagnosis to identify rapidly given the availability of disease-modifying gene therapy in
  some settings, where treatment window matters for outcome.
- *Neuromuscular junction:* congenital myasthenic syndromes, transient neonatal myasthenia
  (in an infant born to a mother with myasthenia gravis, from transplacental antibody transfer —
  typically resolves over weeks as maternal antibody clears).
- *Peripheral nerve/muscle:* congenital myopathies, congenital muscular dystrophies, metabolic
  myopathies.
- *Non-neuromuscular "floppy":* connective tissue disorders (Ehlers-Danlos spectrum), Down
  syndrome (§2.7.1) as one component of a broader picture, benign congenital hypotonia (a
  diagnosis of exclusion, resolves with time).

**Discriminating approach:** the single most useful bedside discriminator is **"weak floppy" vs
"non-weak (paralytic vs postural) floppy"** — a central-cause floppy infant often has normal or
increased strength/reflexes when actually tested (the hypotonia is postural/tone-related rather
than true weakness) whereas a lower-motor-neuron/muscle-cause floppy infant has true weakness
(reduced antigravity movement, reduced resistance to passive movement) with reduced/absent
reflexes — combined with the presence/absence of alertness, dysmorphism, and other systemic signs,
this splits the differential meaningfully before any investigation is sent.

#### 2.7.3 Ambiguous genitalia as an endocrine emergency — CAH salt-wasting crisis

**Ambiguous genitalia at birth is a medical and psychosocial emergency requiring same-admission
specialist (endocrine, and often surgical/genetics) involvement** — sex assignment is not made
on external genital appearance alone and requires a structured multidisciplinary work-up
(karyotype, pelvic/adrenal ultrasound, hormone levels including 17-hydroxyprogesterone, electrolytes)
before any decisions are communicated to the family as final.

**Congenital adrenal hyperplasia (CAH), classically 21-hydroxylase deficiency, is the most
important diagnosis to actively exclude urgently**, because the **salt-wasting form is a
life-threatening emergency**: impaired cortisol and aldosterone synthesis leads to a **salt-wasting
crisis typically presenting in the first 1–4 weeks of life** with **vomiting, poor feeding,
weight loss/dehydration, hyponatraemia, hyperkalaemia, and hypoglycaemia**, progressing to
hypovolaemic shock and cardiovascular collapse if unrecognised — this can present as (and be
mistaken for) pyloric stenosis or sepsis if the genital exam is not specifically examined/
noted (a virilised female infant with ambiguous genitalia is the more overt clue; **a genetically
male infant with CAH has normal-appearing male genitalia at birth and gives NO external clue**,
making the diagnosis easy to miss until the salt-wasting crisis itself declares it — any neonate
with an unexplained hyponatraemic, hyperkalaemic crisis with vomiting/collapse should have CAH
actively considered regardless of genital appearance). [EK — classic CAH salt-wasting
presentation]

**Management of the acute salt-wasting crisis:** IV fluid resuscitation (normal saline, no
potassium-containing fluid given the hyperkalaemia), **IV hydrocortisone** (stress-dose,
replaces the deficient cortisol and has mineralocorticoid-like activity at higher doses),
correction of hypoglycaemia (dextrose-containing fluids once initial resuscitation is underway),
and treatment of hyperkalaemia if severe/ECG-changing (as for any hyperkalaemia — calcium
gluconate for cardiac membrane stabilisation, insulin-dextrose to shift potassium
intracellularly) — this is a genuine paediatric endocrine emergency requiring the same urgency as
septic shock. [EK]

#### 2.7.4 The child with recurrent infections — immunodeficiency vs HIV

**In the South African context, HIV must be actively excluded first and is far more common than
primary immunodeficiency** — a child presenting with recurrent/severe/unusual infections should
have HIV testing as an early, near-reflexive step (with appropriate consent per §6) before an
extensive primary immunodeficiency work-up is pursued, given the relative prevalence and the
urgency of identifying and treating HIV early.

**Red flags suggesting a primary immunodeficiency (once HIV is excluded)** [EK — the widely-used
"10 warning signs" framework, adapted]: ≥4 or more new ear infections in a year, ≥2 serious
sinus infections in a year, ≥2 months on antibiotics with little effect, ≥2 pneumonias in a year,
failure of an infant to gain weight/grow normally, recurrent deep skin or organ abscesses,
persistent oral thrush or skin fungal infection beyond infancy, need for IV antibiotics to clear
infections, ≥2 deep-seated infections (e.g. sepsis, meningitis, osteomyelitis), a family history
of primary immunodeficiency/early unexplained infant deaths. The **pattern of organism and site**
narrows the immunodeficiency category further (recurrent sino-pulmonary bacterial infections
suggest antibody/humoral deficiency; severe viral/fungal/opportunistic infections suggest T-cell/
combined deficiency; recurrent staphylococcal skin/organ abscesses suggest a phagocytic
disorder; recurrent neisserial infections suggest a complement deficiency) — this pattern
recognition guides which initial screening tests (quantitative immunoglobulins, lymphocyte
subsets, complement levels, HIV test as above) are most useful rather than sending an
undirected broad panel.

### 2.8 Haem/onc red flags

#### 2.8.1 The pale child

**Differential by mechanism:**
- **Reduced production:** iron deficiency anaemia (by far the most common cause of paediatric
  anaemia globally and in SA, typically microcytic/hypochromic, associated with dietary history —
  prolonged exclusive breastfeeding without iron-rich weaning foods, excessive cow's milk intake
  displacing solids, prematurity), anaemia of chronic disease/inflammation (including chronic
  TB/HIV — normocytic or mildly microcytic), marrow failure/infiltration (aplastic anaemia,
  leukaemia — pancytopenia rather than isolated anaemia, §2.8.2), chronic renal disease
  (reduced erythropoietin).
- **Increased destruction (haemolysis):** discriminated by a **raised reticulocyte count** (in
  contrast to production failure, where retics are low/inappropriately normal) — hereditary
  spherocytosis, G6PD deficiency (episodic, precipitant-triggered — fava beans, certain drugs,
  infection), sickle cell disease (relevant in specific SA population groups/family origins),
  autoimmune haemolytic anaemia, and neonatal causes as in §2.1.2.
- **Blood loss:** acute (trauma, GI bleed, §2.4.3) or chronic occult loss (hookworm in endemic
  areas, Meckel's diverticulum, menstrual loss in adolescent girls — a commonly missed cause of
  iron deficiency in this age group specifically).

**Discriminating investigations:** FBC with red cell indices (MCV — micro/normo/macrocytic) is
the first branch point, **reticulocyte count** is the second (low = production problem, high =
haemolysis/blood loss with intact marrow response), blood film (target cells, spherocytes,
fragments, sickle cells, blasts — the film is read personally/urgently if leukaemia is a
concern, not just reported by an automated count), iron studies (ferritin — noting ferritin is an
acute-phase reactant and can be falsely normal/elevated in concurrent inflammation/infection,
a frequent confounder in the SA TB/HIV context), haemoglobin electrophoresis if a
haemoglobinopathy is suspected, direct Coombs test if autoimmune haemolysis is suspected.

#### 2.8.2 Leukaemia presentations

**The classic triad — bone pain, cytopenias, and lymphadenopathy — reflects marrow infiltration
and extramedullary spread**, and any combination of these in a child should prompt an urgent FBC
with film review:
- **Bone pain** — from marrow expansion/infiltration, can present as a limp, refusal to
  weight-bear, or vague limb pain, and is a recognised mimic of a simple limping-child
  presentation (transient synovitis, minor trauma) — persistent, worsening, or nocturnal bone pain,
  especially with other red flags below, should not be assumed mechanical without an FBC.
- **Cytopenias** — pallor/fatigue (anaemia), bruising/petechiae/bleeding (thrombocytopenia,
  overlapping with §2.5.3's petechial-child differential), fever/recurrent infection (functional
  neutropenia despite a sometimes-elevated total WCC, because circulating blasts are
  non-functional).
- **Lymphadenopathy and organomegaly** — often generalised, firm, non-tender nodes, with
  hepatosplenomegaly common — discriminated from reactive/infective lymphadenopathy by
  persistence, associated systemic features, and the accompanying blood picture.
- Other clues: unexplained fever/night sweats/weight loss ("B symptoms"), testicular swelling
  (a recognised extramedullary site), CNS involvement (headache, cranial nerve palsies, raised
  ICP signs from CNS leukaemia).

**Investigation:** FBC and blood film are the first, highest-yield, most urgent tests — **blasts
on a peripheral film in a child with this clinical picture warrant same-day
haematology/oncology referral**, not routine outpatient follow-up; definitive diagnosis requires
bone marrow aspirate/biopsy with immunophenotyping/cytogenetics at a specialist centre.

#### 2.8.3 The abdominal mass — Wilms vs neuroblastoma

**Wilms tumour (nephroblastoma):** classically a **well-looking child** (often the mass is found
incidentally by a caregiver while bathing/dressing the child, or on routine exam), peak age
**~2–5 years**, a **smooth, firm, unilateral, non-tender abdominal mass that typically does not
cross the midline** (arising from the kidney), may be associated with haematuria and hypertension
(renin-mediated), usually confined to one side, associated with specific syndromes (Beckwith-
Wiedemann, WAGR, hemihypertrophy) in a minority — screening abdominal ultrasound is used
periodically in children with these known predisposition syndromes.

**Neuroblastoma:** arises from sympathetic neural crest tissue (most commonly adrenal or
paraspinal sympathetic chain), presentation is more variable and the child is more often
**systemically unwell** at presentation than with Wilms — a mass that is more **irregular,
firm, and CAN cross the midline** (a useful discriminator from Wilms), with a higher rate of
metastatic presentation at diagnosis (bone pain/limp from bone marrow or bone metastases,
periorbital ecchymosis/proptosis — "raccoon eyes" from orbital metastases, hepatomegaly from
liver metastases, and a paraneoplastic presentation — opsoclonus-myoclonus ("dancing eyes,
dancing feet") or secretory diarrhoea from VIP secretion in some tumours), and associated
systemic features (fever, weight loss, irritability from bone pain) more often than the classic
"well child, incidental mass" pattern of Wilms.

**Discriminating investigations:** abdominal ultrasound first (organ of origin — renal vs
extrarenal/adrenal/paraspinal, midline crossing), **urinary catecholamine metabolites (VMA/HVA)**
elevated in the majority of neuroblastomas (not routinely elevated in Wilms) — a genuinely
useful, relatively simple discriminating test, cross-sectional imaging (CT/MRI) for staging and
surgical planning, and biopsy/definitive histology at a specialist paediatric oncology/surgical
centre — both are managed at a specialist centre and neither should be biopsied/manipulated at a
district level given the risk of tumour rupture/seeding.

#### 2.8.4 Tumour lysis syndrome — basics

**Mechanism:** rapid lysis of a large tumour burden (spontaneously, or classically after starting
chemotherapy/steroids in a bulky, chemosensitive tumour such as leukaemia/lymphoma) releases
intracellular contents faster than the kidneys can clear them, producing the characteristic
biochemical tetrad: **hyperkalaemia, hyperphosphataemia, hyperuricaemia, and secondary
hypocalcaemia** (calcium is driven down as it precipitates with the excess phosphate as
calcium-phosphate complexes, which can also cause renal tubular injury/AKI) — the combination
risks cardiac arrhythmia (from hyperkalaemia and hypocalcaemia) and acute kidney injury (from
urate and calcium-phosphate precipitation in the renal tubules).

**Management anchors [EK]:** anticipation and prevention in any child starting treatment for a
high-tumour-burden malignancy — aggressive IV hydration before/during treatment initiation
(without added potassium), **allopurinol or rasburicase** to reduce urate production/levels
(rasburicase, where available, is more effective for established hyperuricaemia — it directly
degrades uric acid; allopurinol only prevents further production and is more suited to lower-risk
prophylaxis), close monitoring of electrolytes/renal function (frequent, e.g. 6–12-hourly, in the
highest-risk first 24–72 hours after treatment initiation), and standard emergency management of
any resulting hyperkalaemia/hypocalcaemia if they occur despite prophylaxis. This is a predictable,
preventable complication and the paediatric oncology reflex is to grade tumour-lysis risk and
start prophylaxis *before* the first dose of chemotherapy in a high-risk case, not to treat it
reactively after it develops.

### 2.9 NAI / child protection

**The injury-history mismatch is the single most important discriminator.** Ask: does the
stated mechanism explain the injury given the child's developmental stage (a non-mobile infant
cannot generate a fracture by "rolling off a low bed" the way a mobile toddler's fall might), does
the history change between tellings or between caregivers, was there a delay in seeking care
disproportionate to the apparent severity of the injury, and is the developmental capability
claimed (e.g. "he pulled the kettle down himself") consistent with the child's actual observed
developmental stage? Any mismatch is treated as a red flag requiring further assessment, not
dismissed because the caregiver seems plausible/relationship seems caring — NAI occurs across all
social/economic strata and demeanour is not a reliable screen.

**Patterned, metaphyseal, and posterior-rib injuries — the specific radiological/examination
red flags** [EK — core NAI teaching, widely taught pattern-recognition set]:
- **Patterned bruising/injuries** — marks that reproduce the shape of an implement (belt buckle,
  looped cord/flex, hand-slap outline, bite marks with an inter-canine distance measurable and
  potentially matchable), or bruising in clusters/unusual sites (ears, neck, buttocks, genitals,
  torso — areas not typically injured in normal childhood play/accidental falls, which more
  commonly injure bony prominences — shins, forehead, elbows).
- **Classic metaphyseal lesions ("corner" or "bucket-handle" fractures)** — a fracture pattern
  at the metaphysis from a shearing/traction-rotational force (characteristic of forceful
  pulling/twisting or shaking of a limb) — **highly specific for NAI in a young, non-ambulatory
  infant**, rarely caused by accidental mechanisms at this age.
- **Posterior rib fractures** — from an anteroposterior compressive squeezing force (classically
  associated with a shaking/forceful-gripping mechanism) — **highly specific for NAI**, as
  accidental posterior rib fractures in an infant are rare without a major crush/high-force
  mechanism that would have its own obvious history (e.g. major vehicle trauma).
- **Multiple fractures at different stages of healing** — inconsistent with a single reported
  incident, suggesting repeated episodes over time.
- **Any fracture in a non-mobile infant** (pre-crawling/pre-cruising) without an adequately
  explaining history is a red flag by itself, regardless of fracture type.
- Retinal haemorrhages and subdural haematoma (particularly with minimal/absent external head
  injury) in an infant should raise abusive head trauma ("shaken baby") as a leading
  consideration.

**The skeletal survey.** Any infant/young child (typically <2 years, sometimes extended
to <5 years in specific circumstances) with a suspected or confirmed abusive injury undergoes a
**full skeletal survey** (a defined series of dedicated radiographic views of the entire skeleton,
not a single babygram) specifically to detect **occult fractures at other sites and at different
stages of healing** that are not clinically apparent — this is standard practice because occult
fractures (particularly rib and metaphyseal) are common in confirmed NAI cases and materially
change the child-protection risk assessment; a **repeat skeletal survey at ~2 weeks** is often
performed as fractures too subtle/acute to see on the first survey become more visible with early
healing/callus formation. [EK]

**Mandatory reporting — Form 22, Children's Act.** Under the Children's Act, health
professionals (among a defined list of professions) have a **legal, mandatory duty to report**
any reasonable suspicion that a child has been physically abused (in a manner causing injury),
sexually abused, or deliberately neglected — this reporting is done on the prescribed **Form 22**
to a designated child protection organisation, the Provincial Department of Social Development,
or the South African Police Service, **as soon as the professional reasonably concludes suspicion
exists** — the threshold is *reasonable suspicion*, not certainty or proof, and **failure to
report is itself a criminal offence** under the Act. [fetched — Children's Act s110/Form 22
structure]

**Never discharge into an unsafe disposition.** Regardless of how minor the presenting injury
appears in isolation, if there is a genuine child-protection concern the child is **not
discharged home** until a place-of-safety assessment/social work involvement has determined the
disposition is safe — this may mean admission "for observation" as a practical holding measure
while child-protection services are engaged, even if the medical injury itself would not
otherwise warrant admission. This is a recognised, deliberate, and appropriate use of admission
as a protective measure, not medical over-treatment.

### 2.10 The adolescent

**HEADSS screen** — the structured psychosocial interview framework for adolescents, conducted
**alone with the adolescent (without the caregiver present) for at least part of the
consultation**, with explicit reassurance about confidentiality and its limits (safety
concerns override confidentiality) [EK — standard adolescent medicine tool, structured for the app
as a component]:
- **H**ome — who lives at home, relationships, stability, safety.
- **E**ducation/Employment — school attendance/performance, bullying, future plans, work.
- **E**ating — body image, dietary pattern, weight concerns, disordered eating screen.
- **A**ctivities — peer relationships, social activities, hobbies, screen time.
- **D**rugs — tobacco, alcohol, other substance use (own use and household/peer exposure).
- **S**exuality — relationships, sexual activity, orientation/identity, contraception use, STI
  risk, any history of coercion.
- **S**uicide/depression/self-harm — mood, self-harm history, suicidal ideation, safety planning.

**First-presentation psychosis and substance overlap — the pointer.** New-onset psychotic
symptoms in an adolescent should always prompt a structured substance-use history (particularly
cannabis, and stimulant/other recreational drug use) **before** substance use is assumed to be
either the sole cause or entirely incidental — substance-induced psychosis and an emerging
primary psychotic disorder can present near-identically at first contact, and the distinction
matters for both acute management and prognosis/counselling; a first psychotic episode in this
age group is treated with same urgency as an adult first-episode psychosis work-up (organic
screen, collateral history, safety assessment) rather than assumed to be "just the drugs."

**Pregnancy/contraception legal framework.** Per the **Children's Act, section 134**, a child
**of any age may independently access contraceptives** (with appropriate medical advice/
counselling) without parental consent, reflecting the policy priority of not creating a barrier
to contraceptive access. Per **section 129**, a child **may consent to their own medical
treatment (including, per specific provisions, termination-of-pregnancy-related and other
reproductive health services) from age 12**, provided they are assessed as having **sufficient
maturity and the capacity to understand the benefits, risks, and social implications of the
treatment** — the Act does not define a fixed test for "sufficient maturity," leaving this as a
clinical judgement to be made and documented by the treating professional. **Surgical operations**
specifically require the child (if ≥12 and sufficiently mature) to be **assisted by a parent/
guardian**, a distinct and stricter requirement than for medical treatment generally. [fetched —
Children's Act ss 129/134 structure; EK-marked for the precise boundary/interaction with
termination-of-pregnancy legislation, which sits in a separate Act (Choice on Termination of
Pregnancy Act) with its own consent provisions and should be cross-checked if this specific
scenario arises clinically]

---

## 3. The normals

### 3.1 Vitals by age band [EK — APLS/PALS-aligned reference ranges; treat as bands not fixed points]

| Age | HR (awake, bpm) | RR (breaths/min) | Systolic BP (mmHg, lower limit ≈ 70+2×age for 1-10y) |
|---|---|---|---|
| Neonate (0–28d) | 100–180 (up to 205 crying) | 30–60 | ~60–90 (lower limit ~60) |
| Infant (1–12mo) | 100–160 | 30–53 | ~70–100 |
| Toddler (1–2y) | 98–140 | 22–37 | ~80–105 |
| Preschool (3–5y) | 80–120 | 20–28 | ~80–110 |
| School-age (6–11y) | 70–110 | 18–25 | ~85–120 |
| Adolescent (12–15y+) | 60–100 | 12–20 | ~90–130 |

**IMCI fast-breathing thresholds (specifically, the operational cut-offs used to classify
pneumonia)** [fetched/EK]: **≥60/min under 2 months**, **≥50/min for 2–11 months**, **≥40/min for
12 months–5 years** — these IMCI thresholds are deliberately more conservative (lower bar to call
"fast") than the general vitals-band ranges above, because they are screening thresholds tuned for
sensitivity at primary-care level, not a description of the full normal range.

### 3.2 Weight estimation formulas — see §2.2.1 (Broselow concept, age-based formulas by band);
repeated here as a normals reference: **term–1y ≈ (age in months + 9)/2; 1–5y ≈ 2×(age+5); 6–12y
≈ 3×age+7.** [EK] Birth weight expectations: term average ~2.8–3.6 kg [EK]; expected weight loss
in the first days of life up to ~7–10% of birth weight is physiological, with **regain of birth
weight expected by ~10–14 days** — failure to regain by this point warrants a feeding
assessment.

### 3.3 Developmental milestones by domain — with red-flag ("refer NOW") ages, not just averages
[EK — mainstream developmental surveillance consensus, e.g. Denver/RCPCH-aligned red flags]

| Domain | Typical milestone | Red-flag age (refer if not present by) |
|---|---|---|
| Gross motor | Social smile | 6–8 weeks typical; **no smile by 3 months** |
| Gross motor | Head control (no lag) | 3–4 months typical; **persistent head lag by 4 months** |
| Gross motor | Rolls | 4–6 months; **not rolling by 6–7 months** |
| Gross motor | Sits unsupported | 6–8 months; **not sitting by 9–10 months** |
| Gross motor | Crawls | 8–10 months; **not mobile (crawl/bottom-shuffle) by 12 months** |
| Gross motor | Walks independently | 12–15 months; **not walking by 18 months** |
| Fine motor | Palmar grasp → pincer grasp | pincer by 9–10 months; **no pincer grasp by 12 months** |
| Fine motor | Transfers object hand to hand | 6 months; **not transferring by 8 months** |
| Fine motor | Builds tower of 2–3 cubes | 18 months; **absent by 2 years** |
| Language | Coos/vocalises | 2–3 months; **no vocalisation by 4 months** |
| Language | Babbles (consonant sounds, e.g. "baba") | 6–9 months; **no babble by 10 months** |
| Language | Single words with meaning | 12 months; **no words by 15–18 months** |
| Language | 2-word phrases | 2 years; **no 2-word phrases by 2.5 years** |
| Language | 3-word sentences, understood by strangers | 3 years; **unintelligible/absent sentences by 3.5–4 years** |
| Social | Stranger anxiety | 6–9 months (its ABSENCE beyond ~12 months, or persistent lack of any social referencing at any age, is the flag, not its presence) |
| Social | Points to show/share interest (joint attention) | 12 months; **no pointing/joint attention by 18 months — a specific autism red flag** |
| Social/language | Any loss of previously-acquired skill/regression, at ANY age | **immediate referral regardless of age** — regression is never normal and always investigated |
| Vision | Fixes and follows | birth–6 weeks; **not fixing/following by 3 months** |
| Hearing | Startles/responds to sound | birth; **no response to loud sound/voice by 3–4 months, or failed newborn hearing screen** |

**The universal red flags, independent of specific domain:** persistent primitive reflexes beyond
their expected disappearance age (below), marked asymmetry of movement/tone at any age, head
circumference crossing centiles (either direction), and **any regression** — these override
"still within the wide normal range" reassurance and warrant assessment regardless of which single
milestone chart is being used.

### 3.4 Primitive reflexes and disappearance ages [EK — standard neonatal/infant neuro exam]

| Reflex | Elicited by | Appears | Disappears (persistence beyond this = red flag) |
|---|---|---|---|
| Moro | Sudden head extension/drop | Birth | ~4–6 months |
| Palmar grasp | Pressure on palm | Birth | ~5–6 months |
| Plantar grasp | Pressure on sole | Birth | ~9–12 months |
| Rooting | Stroke cheek/corner of mouth | Birth | ~4 months (or with voluntary feeding) |
| Sucking | Object in mouth | Birth | ~4 months (becomes voluntary) |
| Asymmetric tonic neck reflex (ATNR, "fencing") | Head turned to one side | Birth–2 months | ~6 months (persistence beyond 6mo strongly suggests cerebral palsy/CNS pathology) |
| Stepping | Held upright, feet touching surface | Birth | ~2 months |
| Babinski (extensor plantar) | Stroke lateral sole | Birth | ~12–24 months (a NORMAL finding in infancy — an extensor response beyond ~2 years is the abnormal/upper-motor-neuron finding, the reverse of adult interpretation) |

### 3.5 Feeding volumes and weight gain by age [EK — mainstream infant feeding/growth consensus]

- **Neonate:** approx. **150 mL/kg/day** of milk by day 5–7 of life once feeding is established
  (built up gradually from smaller volumes in the first days), 8–12 feeds/24h if breastfed
  on demand.
- **Expected weight gain:** approx. **20–30 g/day** in the first 3 months, slowing to **~15–20
  g/day** by 3–6 months, and further slowing through the second half of infancy — **failure to
  regain birth weight by 2 weeks, or weight faltering crossing two major centile lines on the
  Road-to-Health growth chart, triggers a feeding/growth work-up** (§6).
- **Solids/complementary feeding:** introduced from around **6 months** (not before 4 months, not
  delayed beyond 6 months), alongside continued breastfeeding to 2 years or beyond per WHO/SA
  infant feeding guidance.

### 3.6 Fontanelle timing [EK]

- **Anterior fontanelle:** present at birth (average size ~2–3 cm diagonal, wide range normal),
  **closes between ~9 and 18 months** (closure before 3 months, or a fontanelle that feels
  persistently tense/bulging when the infant is upright and calm, or one still widely open beyond
  ~18–24 months, are each independently investigated — early closure raises craniosynostosis
  concern, late closure raises hypothyroidism/rickets/raised-ICP-with-hydrocephalus concern).
- **Posterior fontanelle:** much smaller at birth, **closes by ~6–8 weeks** (may even be closed at
  birth in some normal infants).
- A **bulging, tense fontanelle in an upright, calm, non-crying infant** is a raised-ICP/
  meningitis red flag (§2.5.2); a **markedly sunken fontanelle** is a dehydration sign (§2.4.1).

---

## 4. Cross-cutting investigation interpretation

### 4.1 The paediatric FBC by age

**Lymphocyte predominance is the single biggest trap for anyone reading a paediatric FBC with
adult reference ranges in mind.** From roughly **the first weeks of life through early childhood
(commonly cited as persisting into the 4–6-year range before the adult neutrophil-predominant
pattern establishes), lymphocytes are the PREDOMINANT white cell type on a normal differential**,
not neutrophils — a differential count that would suggest "relative lymphocytosis"/viral illness
in an adult can be entirely normal in a toddler. Applying an adult-pattern "neutrophils should
dominate" expectation to a young child's FBC leads to false alarm (over-calling infection) or
false reassurance (under-calling a genuinely abnormal neutrophil count because it's being
compared to the wrong baseline). [EK — well-established paediatric haematology teaching]

**Age-banded haemoglobin (approximate, g/L)** [EK]:
- Cord blood/birth: ~140–200 (physiologically high, fetal erythropoiesis + relative hypoxia
  in utero)
- Physiological nadir ("physiological anaemia of infancy"): ~90–110 around **6–9 weeks of age**
  (term infants) — a NORMAL, expected trough as fetal haemoglobin production switches off before
  adult erythropoiesis fully ramps up; this trough is earlier and deeper in preterm infants
  ("anaemia of prematurity").
- 6 months–6 years: ~105–140
- 6–12 years: ~115–145
- Adolescent (post-pubertal, sex-differentiated as in adults): male ~130–170, female ~120–150

**WCC and platelets** are both higher in early infancy than the adult range and trend down toward
adult ranges through childhood — a WCC that would flag as leucocytosis in an adult may be within
the normal range for a 6-month-old; always check an age-specific reference range rather than the
adult range printed on many lab report headers.

### 4.2 CSF interpretation by age — neonatal normal values differ

**The single most important nuance: neonatal CSF is "abnormal" by older-child/adult standards
even when entirely normal for age** — applying adult CSF reference ranges to a neonatal LP result
will systematically over-call meningitis. [EK — standard neonatal CSF interpretation teaching]

| Parameter | Term neonate (normal) | Older infant/child (normal) |
|---|---|---|
| WCC | up to ~20–30 cells/mm³ can be normal (higher still acceptable in preterm infants) | <5 cells/mm³ |
| Protein | up to ~0.9–1.5 g/L can be normal (reflecting a more permeable neonatal blood-brain barrier) | 0.15–0.4 g/L |
| Glucose (as a ratio to blood glucose) | CSF:blood glucose ratio typically ≥0.6 (higher than the older-child ratio, reflecting higher baseline neonatal blood glucose relative handling) | CSF:blood glucose ratio ≥0.5–0.6 |

**Interpretation nuance:** always send a **paired blood glucose at the time of LP** — CSF glucose
is only interpretable as a ratio to the contemporaneous blood glucose, never as an isolated
absolute number, at any age. A traumatic tap (blood-contaminated CSF from the procedure itself)
confounds both WCC and protein interpretation — a correction factor (commonly cited as
subtracting roughly 1 WCC per 500–1000 RBCs seen, and adjusting protein similarly) is applied when
a tap is bloody, but a genuinely traumatic tap with a very high RBC count should prompt caution
in fully excluding meningitis on that sample alone if clinical suspicion remains high.

### 4.3 Blood gas in the vomiting/dehydrated child

Severe vomiting (e.g. pyloric stenosis, §2.4.2) classically produces a **hypochloraemic,
hypokalaemic metabolic alkalosis** with a **paradoxically acidic urine** (renal potassium/hydrogen
wasting to conserve sodium in the volume-depleted state, §2.4.2) — recognising this pattern
(rather than a straightforward dehydration-driven metabolic acidosis, which is the more typical
gastroenteritis-with-diarrhoea pattern) should immediately raise pyloric stenosis or another
upper-GI-obstruction cause in an infant with a vomiting history. Diarrhoea-predominant
dehydration more typically produces a **metabolic acidosis** (bicarbonate loss in stool, plus a
component of lactic acidosis from poor perfusion in more severe dehydration) — the *direction* of
the acid-base disturbance is itself a discriminating clue between a predominantly vomiting vs
predominantly diarrhoeal picture, useful when the history is unclear or unreliable (e.g. a
non-verbal infant with a vague caregiver history).

### 4.4 The septic screen composition by age

- **Neonate (<28 days):** FBC + differential, CRP, blood culture, urine (SPA/catheter), CSF
  (LP unless contraindicated/unsafe), glucose, ± CXR if respiratory signs, ± surface
  swabs of limited value. Consider HSV work-up if risk factors present (§2.1.1).
- **1–3 months:** as above; LP threshold is still low (most protocols include LP for this age
  group presenting with fever without an obvious focus, §2.5.1) given the continued difficulty of
  clinically excluding meningitis.
- **3 months–3 years:** more selective — FBC, CRP, blood culture, and urine remain standard; LP
  reserved for those with specific meningitic signs/danger signs/ill-appearance rather than every
  febrile child in this band (§2.5.1).

### 4.5 Glucose, calcium, magnesium in the neonate — thresholds [EK, cross-referenced §2.1.3/§2.1.6]

- **Glucose:** treatment threshold generally **<2.6 mmol/L** in an at-risk/symptomatic infant;
  <1.5–2.0 mmol/L or any hypoglycaemia with neurological symptoms is an emergency.
- **Calcium:** early neonatal hypocalcaemia (first 72h, more common in preterm infants, infants
  of diabetic mothers, and post-asphyxia) vs late neonatal hypocalcaemia (after day 3–7, more
  associated with high-phosphate feeding or maternal vitamin D deficiency/hypoparathyroidism) —
  total calcium corrected for albumin or ionised calcium should be used given the unreliability of
  uncorrected total calcium in a sick/hypoalbuminaemic neonate; symptomatic hypocalcaemia
  (jitteriness, seizures, apnoea, prolonged QT on ECG) is treated with IV calcium gluconate.
- **Magnesium:** checked alongside calcium in any neonate with seizures/refractory hypocalcaemia,
  as hypomagnesaemia both causes its own neurological symptoms and can render hypocalcaemia
  refractory to calcium replacement alone until magnesium is also corrected.

### 4.6 Bilirubin charts logic — see §2.1.2 in full; the cross-cutting principle repeated here:
**always plot TSB against age-in-HOURS (not days) on the gestational-age- and risk-factor-specific
curve**, never apply a single memorised threshold number across all gestations/risk categories.

### 4.7 CRP/PCT kinetics in neonates — see §2.1.1; repeated as a cross-cutting principle: **a
single normal CRP at presentation does not exclude early sepsis** (it lags the clinical onset by
12–24h); **procalcitonin has a physiological peak in the first 24–48h of life in ALL neonates**,
limiting its rule-in value as an isolated early test in the very first days regardless of sepsis
status. [EK]

---

## 5. Scores & structured tools

*(Format note: each of the following is a candidate for a structured, scored MedAI component
rather than free text — inputs and bands are given explicitly for that purpose.)*

- **APGAR** [EK — universal newborn scoring, scored at 1 and 5 minutes, repeated every 5 minutes
  if <7]: 5 domains (Appearance/colour, Pulse/HR, Grimace/reflex irritability, Activity/tone,
  Respiration), each scored 0–1–2, total /10. **HR is the single most heavily weighted
  resuscitation-decision component in practice** — a HR <100 drives escalation regardless of the
  total score.
- **Ballard score (New Ballard Score) concept:** a gestational-age assessment tool combining
  **neuromuscular maturity** (posture, square window, arm recoil, popliteal angle, scarf sign,
  heel-to-ear) and **physical maturity** (skin texture, lanugo, plantar surface creases, breast
  tissue, eye/ear form, genitalia) signs, each scored on a maturity scale, summed and mapped to an
  estimated gestational age in weeks — used when dates are uncertain/unreliable to corroborate or
  correct the assumed gestational age, directly affecting every gestation-anchored decision in
  §2.1 (jaundice thresholds, RDS risk, apnoea risk). [EK]
- **Sarnat staging** — see §2.1.7 in full (stages 1–3, clinical domains: level of consciousness,
  tone, reflexes/suck, autonomic function, seizures) — the primary determinant of cooling
  eligibility.
- **Westley croup score** — see §2.3.2 in full (stridor, retractions, air entry, cyanosis, level
  of consciousness; bands mild ≤2 / moderate 3–7 / severe ≥8).
- **Paediatric GCS/AVPU** [EK — modified GCS for pre-verbal children]: eye opening (4-point, as
  adult), **verbal response modified for age** (e.g. for an infant: 5=coos/babbles appropriately,
  4=irritable cry, 3=cries to pain, 2=moans to pain, 1=none), motor response (6-point, largely as
  adult from the toddler years, age-adapted for infants). **AVPU (Alert / responds to Voice /
  responds to Pain / Unresponsive)** is the faster bedside screening tool used in initial
  triage/resuscitation before a full GCS is calculated — a "P" or "U" on AVPU is treated with the
  same urgency as a low GCS.
- **IMCI classification tables** [fetched/EK — the operational backbone of SA PHC paediatric
  triage]: standardised colour-coded classification (commonly pink=urgent/severe, yellow=
  needs specific treatment, green=home management) across the core presenting complaints
  (cough/fast breathing/pneumonia bands per §3.1, diarrhoea/dehydration per §2.4.1's Plan A/B/C,
  fever, ear problem, malnutrition/anaemia, HIV status) — each complaint has its own
  classification table combining specific signs into a severity band that dictates the treatment
  and referral pathway, run alongside the four general danger signs (§1) at every contact.
- **WHO weight-for-height/MUAC bands** [EK/fetched — WHO growth standard-based SAM/MAM
  classification, cross-referenced with the app's existing SAM content]: **severe acute
  malnutrition (SAM)** = weight-for-height/length <-3 z-score, OR **MUAC <11.5 cm** (age
  6–59 months), OR bilateral pitting oedema (any grade, +/++/+++); **moderate acute malnutrition
  (MAM)** = weight-for-height -3 to <-2 z-score, or MUAC 11.5–<12.5 cm. MUAC is specifically
  valued as a rapid, low-equipment screening tool usable by any cadre/at community level.
- **Phototherapy threshold chart logic** — see §2.1.2 in full: age-in-hours on the x-axis,
  TSB on the y-axis, multiple curves stratified by gestational age and neurotoxicity risk factors,
  separate phototherapy and exchange-transfusion curves.
- **PEWS (Paediatric Early Warning Score) concept** [EK — ward-level deterioration-detection
  tool, structurally similar to adult NEWS/MEWS but age-banded]: a composite bedside score
  (typically combining respiratory, cardiovascular, and behavioural/neurological domains, each
  scored against age-specific normal bands) calculated at each set of observations on a general
  paediatric ward, with an escalation trigger threshold (a total score, or any single "red" domain
  score) mandating an urgent medical review — designed to catch the "compensating then falling
  off a cliff" trajectory (§1) before overt decompensation, and a natural structured component
  for the app to calculate automatically from entered vitals against the age-band tables in §3.1.
- **HEADSS** — see §2.10 in full (Home, Education/Employment, Eating, Activities, Drugs,
  Sexuality, Suicide/depression).

---

## 6. SA-specific reality

**IMCI as the legal/operational framework at PHC.** IMCI (Integrated Management of Childhood
Illness) is not an optional teaching aid in South Africa — it is the **standard operating
framework for assessing every child under 5 at primary health care level** in the public system,
built around the general danger signs (§1), the age-banded classification tables (§5), and a
structured triage-to-treatment pathway designed to be executable by any appropriately trained
cadre (nurse, clinical associate, community health worker) at the point of first contact, with
referral pathways up to district-hospital and beyond built into the classification bands
themselves. An intern working in a district hospital receiving referrals is, in effect, always
working downstream of an IMCI classification that has already been made once — understanding the
IMCI logic explains *why* a given referred child was sent up, and what "danger sign" or
classification triggered it. [fetched/EK — IMCI SA structure]

**EPI-SA immunisation schedule (current, 2024 revision)** [fetched]:
- **Birth:** BCG, OPV0 (and Hepatitis B birth dose if the hexavalent product in use requires it —
  product-dependent, see below).
- **6 weeks:** hexavalent vaccine (DTaP-IPV-Hib-HepB combination), PCV (switched from PCV13 to
  **PCV10** in the public sector in 2024), rotavirus vaccine (first dose).
- **10 weeks:** hexavalent, rotavirus (second dose).
- **14 weeks:** hexavalent, PCV (second/booster dose in a 2+1 schedule), rotavirus (third dose if
  using a 3-dose product — schedule is product-dependent, and **rotavirus vaccine must not be
  given after 24 weeks of age**, a hard cut-off given the intussusception risk signal associated
  with initiating rotavirus vaccination in older infants).
- **9 months:** measles vaccine (first dose), PCV booster (third dose in a 2+1 schedule).
- **18 months:** measles vaccine (second dose), DTaP-IPV booster, Hib booster (per current
  catch-up/booster schedule).
- **6 years (school entry):** Td (tetanus-diphtheria) booster.
- **Catch-up logic:** a child presenting late/incompletely vaccinated is caught up according to
  minimum interval rules between doses (not simply restarted), with the **rotavirus 24-week hard
  cut-off** as the one absolute exception where a missed dose cannot simply be caught up later —
  always check the current RTHB record rather than assuming a schedule from memory, given how
  frequently product/interval details are revised (as the PCV13→PCV10 switch itself
  demonstrates). [EK for exact catch-up interval rules — fetched for the schedule skeleton above]

**The 2023 ART/PMTCT guidelines for the HIV-exposed infant** — see §2.1.9 in full (risk
stratification by maternal delivery viral load, dual NVP+AZT prophylaxis for 6 weeks as the
default, birth/10-week/6-month PCR schedule with 9-month rapid antibody screen and post-
breastfeeding-cessation confirmatory testing). [fetched — 2023 ART Clinical Guidelines structure]

**TB household-contact management and IPT in children.** Any child living in the same household
as (or with significant close contact to) a person with confirmed pulmonary TB is a **TB contact**
and should be actively screened (symptom screen ± CXR ± the diagnostic pathway in §2.3.5 if
symptomatic) and, if **asymptomatic and TB disease has been reasonably excluded**, started on
**isoniazid preventive therapy (IPT)** — this applies with particular urgency to **children under
5 years and any child living with HIV of any age**, given their markedly higher risk of rapid
progression from infection to disseminated/severe disease compared with older
immunocompetent children. IPT duration is typically **6 months** of daily isoniazid at a
weight-based dose. [EK — well-established SA/WHO TB household-contact management principle;
exact current dosing should be confirmed against the current National TB Management Guidelines]

**Road-to-Health Booklet (RTHB) as a data source — the intern should ALWAYS ask for it.** The
RTHB is the caregiver-held, longitudinal health record for every SA child, containing the
**growth charts** (weight-for-age, height/length-for-age, weight-for-height/BMI-for-age — plotted
serially, making centile-crossing and growth faltering visible at a glance in a way a single
clinic visit's weight cannot), the **immunisation record**, birth details, and developmental/
health-contact history. **Asking for the RTHB at every encounter is a specific, deliberate
clinical habit** — it frequently contains the single most useful piece of information in the
whole consultation (a growth trajectory revealing chronic illness, a missed immunisation
revealing a vulnerable child, a previous admission/diagnosis the caregiver has forgotten to
mention) and its absence, or evidence that it has not been completed/brought to visits, is itself
a marker worth noting (associated in the literature with less engaged healthcare contact,
relevant to a broader vulnerability assessment). [fetched/EK]

**Notifiable conditions in children.** Category 1 (immediate notification, most urgent) NMCs
relevant to paediatrics include **measles, meningococcal disease, and pertussis**, alongside
other conditions on the national NMC list (acute flaccid paralysis/suspected polio, neonatal
tetanus, and others) — Category 1 notification is required by the most rapid means available
(phone/electronic) followed by formal notification within 24 hours; this is a **legal
obligation on the diagnosing clinician**, run in parallel with (not instead of) treating the
child and, where relevant, arranging contact chemoprophylaxis (§2.5.2). [fetched — NICD NMC list]

**What actually kills SA neonates.** The leading drivers of SA neonatal mortality cluster around
**complications of prematurity** (respiratory distress syndrome, intraventricular haemorrhage,
NEC — §2.1.4/§2.1.8), **hypoxic-ischaemic encephalopathy/birth asphyxia** (§2.1.7), and
**neonatal sepsis** (§2.1.1) — this triad is the direct justification for why §2.1 of this
dossier is weighted as heavily as it is: these three categories represent the highest-yield
targets for intervention at exactly the level (district-hospital, intern-delivered care) this
dossier is written for. [EK — consistent with SA perinatal mortality/PPIP-type surveillance
literature and global LMIC neonatal mortality patterns]

**District-hospital neonatal-unit reality.** **CPAP availability is highly variable across SA
district hospitals** — where present, it is frequently the single most impactful respiratory
support intervention available below regional/tertiary level (§2.1.4), and its absence is a
primary driver of transfer decisions for any neonate with significant respiratory distress.
**Kangaroo mother care (KMC) is an evidence-based standard of care, not a resource-constrained
compromise** — for stable low-birth-weight/preterm infants, continuous or near-continuous
skin-to-skin contact with a caregiver, combined with exclusive breastfeeding support, is
associated with reduced mortality, better thermoregulation, better weight gain, and reduced
nosocomial infection compared with standard incubator/cot care, and should be actively promoted
(not merely tolerated) even where more resourced technology is available, for any infant stable
enough to tolerate it. **Transfer criteria to regional/tertiary level** are typically triggered by:
need for respiratory support beyond what the local unit can provide (CPAP unavailable/failing,
ventilation need), suspected duct-dependent cardiac lesion requiring echo/prostaglandin/cardiac
surgery access (§2.1.5), a surgical neonatal emergency (NEC with perforation, malrotation/
volvulus, diaphragmatic hernia, oesophageal atresia), extreme prematurity/very low birth weight
below the local unit's capability threshold, therapeutic hypothermia candidacy within the window
(§2.1.7), or any condition requiring specialist input (metabolic disease, complex
dysmorphology/genetics) unavailable locally — the decision to transfer is time-critical and
should be initiated on clinical suspicion, in parallel with local stabilisation, not after a full
local work-up is completed. [EK — reflects well-described SA neonatal network/referral
principles]

**The Children's Act consent framework** — summarised across this dossier: **s129** (a child ≥12
years with sufficient maturity may consent to their own medical treatment; surgical operations
additionally require parental/guardian assistance), **s134** (a child of any age may
independently access contraceptives without parental consent), and the **mandatory reporting**
obligations under **s110/Form 22** (§2.9) — together these form the operational legal scaffold
around adolescent and child-protection encounters that every clinician working with children in
SA needs to hold in mind, distinct from adult consent law. [fetched]

**Social-grant/food-security assessment as clinical care.** The **Child Support Grant (CSG)**,
administered by SASSA, is a means-tested monthly cash grant (income thresholds and grant amount
adjusted periodically — check current SASSA published rates rather than quoting a fixed figure
that will date) available to the primary caregiver of a qualifying child under 18 — **screening
whether a family is receiving the CSG they are eligible for, and referring to social work for
assistance with application if not, is a legitimate and clinically relevant part of managing
failure to thrive, malnutrition, and chronic disease non-adherence** in the SA public health
context, because food insecurity is a directly modifiable contributor to these presentations and
the grant is one of the few concrete, actionable levers available to a clinical team to address
it — this is not "social work's job instead of medicine," it is part of a complete assessment and
management plan for a malnourished or growth-faltering child. [fetched/EK]

---

## Source ledger — fetched vs [EK]

**Fetched (live web search/fetch during this dossier's construction):**
- EPI-SA 2024 immunisation schedule structure (hexavalent timing, PCV13→PCV10 switch in the
  public sector in 2024, rotavirus 3-dose schedule and the 24-week cut-off) — via web search of
  amayeza-info.co.za, ecdinfohub.org, and NDoH Primary Healthcare Chapter 13 Immunisation
  reference.
- Existence, edition, and scope of the **Hospital Level (Paediatric) Standard Treatment
  Guidelines and Essential Medicines List, 5th Edition, July 2023** (NDoH Knowledge Hub) — direct
  PDF fetch returned HTTP 403 (a known constraint for SA government document servers to
  automated fetch); document identity/edition/publication date confirmed via search, granular
  dosing content within it is therefore marked [EK] against mainstream consensus rather than
  quoted from the primary text.
- **2023 ART Clinical Guidelines** structure for HIV-exposed infants — risk stratification by
  delivery viral load, dual NVP+AZT prophylaxis for 6 weeks as default, birth/10-week/6-month PCR
  schedule with 9-month rapid-antibody screen — via web search (direct PDF fetch of the VTP
  infant-testing summary also returned 403).
- **Children's Act s129** consent framework (age-12 threshold, "sufficient maturity" test,
  surgical-operation parental-assistance distinction) — via web search of PMC/BMC Medical Ethics
  and SA legal commentary sources.
- **Children's Act s110/Form 22** mandatory reporting structure — via web search including direct
  identification of the Form 22 document and the NDoH mandatory-reporting presentation series.
- **IMCI general danger signs** (unable to drink/breastfeed, vomiting everything, convulsions,
  lethargic/unconscious) and the pneumonia fast-breathing age thresholds — via web search.
- **NICD Notifiable Medical Conditions** Category 1 status of measles, meningococcal disease, and
  pertussis, and the 24-hour Category 1 reporting requirement — via web search of nicd.ac.za
  source documents.
- **Road-to-Health Booklet** structure (three growth charts: weight-for-age, height-for-age,
  weight-for-height, replacing the earlier Road-to-Health Card in 2011) — via web search.
- **SA neonatal mortality driver pattern** (prematurity complications — RDS/sepsis/pulmonary
  haemorrhage as the top three prematurity-mortality causes; neonatal sepsis burden; nosocomial
  *Klebsiella* significance in SA lower-tier hospital bloodstream infections) — via web search of
  SA-specific neonatal sepsis/mortality literature (BMC Infectious Diseases, Lancet Microbe SA
  cohort studies).
- **Child Support Grant** structure (means-tested, primary-caregiver-administered, SASSA-
  administered, income thresholds, under-18 eligibility) — via web search; exact current rand
  amount not fixed in the dossier text given how frequently it is adjusted.

**[EK] — established clinical/mainstream consensus, not individually fetched in this pass** (the
large majority of specific drug doses, scoring-tool point structures, and pathophysiology
explanations throughout §§1–5): neonatal sepsis empiric antibiotic classes and durations;
hypoglycaemia dextrose bolus/GIR ladder; bilirubin phototherapy/exchange chart *logic* (age-in-
hours/gestation/risk-factor-banded curves — the structural principle is well-established
teaching; exact numeric curves should be read from the current chart in clinical use rather than
quoted from memory); hyperoxia test concept; prostaglandin E1 as the duct-dependent-lesion save
(dosing left to specialist-initiated protocol); neonatal seizure anticonvulsant ladder
(phenobarbitone/phenytoin/levetiracetam/pyridoxine trial); Sarnat staging and therapeutic-
hypothermia cooling criteria/window; NEC triad and Bell's-staging-based management; IVH grading
and screening-ultrasound practice; paediatric shock staging and the systolic-BP-lower-limit
formula; Broselow-tape concept and weight-estimation formulas; FEAST-trial fluid-strategy nuance
in septic shock; paediatric status-epilepticus ladder doses; paediatric DKA fluid-caution/no-
bolus-insulin principles and cerebral-oedema recognition; paediatric arrest doses (4 J/kg
defibrillation, 10 mcg/kg adrenaline) and compression ratios; bronchiolitis supportive-care-only
evidence base; Westley croup score structure and dexamethasone/adrenaline management; PJP-in-
HIV-exposed-infant sats-CXR dissociation; paediatric TB diagnostic-difficulty structure and
specimen-collection methods (GeneXpert use fetched as SA-programme standard, specimen technique
detail is EK); WHO dehydration Plans A/B/C structure and ReSoMal rationale; pyloric stenosis
biochemistry and malrotation/volvulus "bilious vomiting" teaching; intussusception presentation
and enema-reduction management; fever-without-focus age-banded approach; meningitis age-specific
signs, LP contraindications, and dexamethasone-timing principle; petechial-child differential
(ITP/leukaemia/HSP/NAI discriminators); SAM refeeding-syndrome pathophysiology and F-75/F-100
staging logic; CMAM outpatient-vs-inpatient triage criteria; trisomy 21/18/13 dysmorphology and
associated-anomaly screening; VACTERL/CHARGE association screening logic; floppy-infant
localisation approach; CAH salt-wasting crisis presentation and acute management; the "10 warning
signs" primary-immunodeficiency framework; pale-child/anaemia differential and haemolysis-vs-
production discriminators; leukaemia presentation triad; Wilms-vs-neuroblastoma discriminators;
tumour lysis syndrome pathophysiology and prophylaxis; NAI patterned/metaphyseal/posterior-rib
injury red flags and skeletal-survey practice; HEADSS screen structure; developmental-milestone
red-flag ages; primitive-reflex disappearance ages; age-banded FBC/Hb/CSF reference values; CRP/
procalcitonin neonatal kinetics; APGAR/Ballard/PEWS structure.

*Where a primary SA government source could not be fetched (persistent 403 on NDoH/provincial
health PDF servers, a known environment constraint), values are given as mainstream global
consensus (WHO Pocket Book of Hospital Care for Children, APLS, Nelson Textbook of Pediatrics,
PALS/ILCOR) explicitly marked [EK], and are structured so they can be swapped for exact SA
STG/EML figures once that source is accessible to whoever maintains this dossier — no dose or
threshold in this document has been fabricated; every number traces either to a fetched source or
to a named, well-established external reference framework.*
