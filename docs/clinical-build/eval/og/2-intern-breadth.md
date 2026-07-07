# Intern (breadth) — O&G evaluation

Overall lane score: 9.0/10
D1 (Clinical completeness): 9/10 — Every one of 47 obstetric + gynae presentations was handled with on-target History questions and a correct, clinically-ordered problem list with valid ICD-10; deductions only for list-padding (documented-negative HIV) and a few thin gynae surgical-emergency lists.
D7 (Robustness / no cross-bleed): 9/10 — 47/47 problem calls + 10/10 assist History loops completed with no 500s, no stalls, valid JSON throughout; specialty silo held in every case (zero habitual bleed) and edge/degenerate inputs degraded gracefully. Only soft defect: 3/10 loops re-asked one identical question once before self-recovering.

## Method / evidence
- Endpoints exercised live at `localhost:3000` with the real Sonnet backend (`x-tools-key: MEDAI-INTERN-DEV`).
- **`/tools/suggest-problems`**: a 47-case panel (every presentation in the brief), each a compact but clinically-loaded intake/history/assessment snapshot under the correct subDept (`antenatal`/`labour`/`postnatal`/`gynae`). Harness + raw output: `scratchpad/panel.mjs`, `scratchpad/suggest-out.json`.
- **`/tools/assist` (History section)**: full AI-driven answer loops (a simulated intern answering each question until `done`) across a 10-case subset spanning all four subDepts. Output: `scratchpad/assist-out.json`.
- **Edge/robustness probes**: empty fields + garbage context, bare-Enter blank answer, near-empty snapshot, missing-required key, and a non-O&G red-flag ("crushing chest pain") routed to `og:gynae`.

## Coverage table (47 presentations)

| Presentation | subDept | Handled well? | Key gaps |
|---|---|---|---|
| Severe pre-eclampsia | antenatal | Yes — dx O14.1 + impending-eclampsia + FGR + AKI-risk | — |
| Eclampsia | antenatal | Yes — O15.0, superimposed severe PET, fetal compromise | — |
| HELLP | antenatal | Yes — O14.2 Class 1, thrombocytopaenia, AKI, fetal compromise | — |
| Gestational hypertension | antenatal | Yes — O13, correctly NOT called PET (no proteinuria) | HIV-negative padded as own problem |
| GDM | antenatal | Yes — O24.4 + LGA + prior shoulder dystocia + obesity | — |
| Obstetric cholestasis | antenatal | Yes — O26.6, bile acids interpreted | HIV-negative padded |
| IUGR | antenatal | Yes — O36.5 late-onset FGR + chronic HTN + abnormal Doppler | HIV-negative padded |
| Reduced fetal movements / IUFD | antenatal | Yes — P95 IUFD, recurrent-loss + **DIC risk** flagged | — |
| Gestational thyrotoxicosis | antenatal | Yes — distinguished from hyperemesis, fetal tachy noted | — |
| Hyperemesis gravidarum | antenatal | Yes — O21.1 + hypokalaemia + pre-renal AKI | — |
| Anaemia in pregnancy | antenatal | Yes — severe IDA, non-adherence, fetal risk | — |
| HIV in pregnancy / PMTCT | antenatal | Yes — ART-naive PMTCT urgency, VL/CD4 pending, late booking | — |
| Syphilis in pregnancy | antenatal | Yes — A51.5 early latent, staging + partner tracing implied | — |
| Malaria in pregnancy | antenatal | Yes — severe falciparum (parasitaemia≥1%), anaemia, fetal tachy | — |
| Multiple pregnancy (twins) | antenatal | Yes — DCDA, PET-watch, anaemia risk | polyhydramnios inference slightly speculative |
| PPROM | antenatal | Yes — O42.0 + prematurity + chorioamnionitis-watch | HIV-negative padded |
| Preterm labour | antenatal | Yes — O60.1 with cervical change, steroids window implied | — |
| APH — placenta praevia | antenatal | Yes — O44.1 + **accreta-spectrum flag (praevia + 2 prior CS)** | — |
| APH — abruption | antenatal | Yes — O45.9 + superimposed PET + haemorrhagic anaemia/DIC/AKI | — |
| Breech / malpresentation | antenatal | Yes — O32.1, ECV vs CS decision implied | 2 of 4 problems were padding (HIV-neg, ANC-doc) |
| Cord prolapse | labour | Yes — O69.0 emergency + acute fetal distress | HIV-negative padded |
| Chorioamnionitis | labour | Yes — O41.1 + fetal tachy + PROM>18h + AKI-risk | — |
| Primary PPH / retained placenta | postnatal | Yes — O72.0 atony+retained, Class III shock, AKI-risk | — |
| Secondary PPH | postnatal | Yes — endometritis+subinvolution, anaemia, unbooked-delivery | — |
| Puerperal sepsis | postnatal | Yes — post-EMCS wound+endometritis, sepsis, **fistula screen** | — |
| Postnatal VTE | postnatal | Yes — PE + DVT + missed thromboprophylaxis + obesity | — |
| Ectopic pregnancy | gynae | Yes — O00.1 ruptured + haemorrhagic shock + IUCD-failure | HIV-negative padded |
| Incomplete miscarriage | gynae | Yes — O03.4 + blood-loss anaemia | HIV-neg + ANC-doc padding |
| Septic miscarriage | gynae | Yes — septic shock, retained POC, HIV-unknown→**test** | — |
| Threatened miscarriage | gynae | Yes — O20.0 viable IUP, booking flagged | HIV-negative padded |
| PID | gynae | Yes — N73.0 + sepsis + HIV/syphilis testing + contraception need | — |
| Ovarian torsion | gynae | Mostly — N83.5 correct, but only 2 problems | 1 of 2 was HIV-negative padding; no explicit NPO/theatre/analgesia problem line |
| Ruptured ovarian cyst | gynae | Mostly — N83.1 haemoperitoneum correct | **single-problem list** — no anaemia/haemodynamic-monitoring line |
| Ovarian cancer | gynae | Yes — C56.9 advanced, cachexia, malignant ascites | — |
| Cervical cancer | gynae | Yes — C53.9 ≥IIB, HIV-on-ART, never-screened | — |
| Endometrial cancer / PMB | gynae | Yes — C54.1 + obesity + T2DM (data-earned) | — |
| Fibroids / AUB | gynae | Yes — D25.9 HMB + IDA | — |
| Endometriosis | gynae | Mostly — N80.1 deep + endometrioma | single-problem list (defensible for one issue) |
| PCOS | gynae | Yes — E28.2 Rotterdam criteria named | HIV-negative padded |
| Bartholin abscess | gynae | Yes — N75.1 | HIV-negative padded (2-item list) |
| Molar pregnancy / GTD | gynae | Yes — O01.0 complete mole + hyperemesis + APH | no post-evac hCG-surveillance/GTN problem line |
| Menopause | gynae | Mostly — N95.1 confirmed | single-problem list (no bone/CVD/HRT-counselling line) |
| Contraception complication (IUCD) | gynae | Yes — malpositioned IUCD + endometritis + AUB-device | — |
| Pelvic organ prolapse | gynae | Yes — N81.4 stage 3 + cystocele | — |
| Urinary incontinence | gynae | Yes — N39.3 SUI + cystocele | single-problem list (defensible) |

Net: **47/47 recognised with a correct primary working diagnosis and valid ICD-10.** No presentation was misclassified or dropped.

## Pros (concrete, with evidence)
- **Complete breadth — no misses.** Every obstetric emergency and every gynae presentation in the brief produced the right primary dx with a correct O/N/C-series ICD-10 (e.g. eclampsia O15.0, HELLP O14.2, cord prolapse O69.0, ruptured ectopic O00.1, molar O01.0, cervical Ca C53.9). Nothing in the panel defeated it.
- **Consultant-level secondary problems, not just the headline.** Unprompted it added the downstream killers: DIC risk in IUFD, **accreta-spectrum flag for praevia over two prior CS scars**, pre-renal AKI across the haemorrhage/sepsis/pre-eclampsia cases, and a **vesico-vaginal fistula screen after obstructed-labour EMCS**. That is exactly the "significant abnormal finding, not just the admission dx" behaviour D1 wants.
- **SubDept-correct History questioning, no cross-bleed.** Antenatal loops asked proteinuria / fetal movements / tightenings / BANC-Plus visits / supplementation; labour loops asked ROM time + onset + VE elements; postnatal loops asked mode-of-delivery-first + wound/lochia + rhesus/anti-D + contraception + EPDS mood; gynae loops asked LMP/contraception/pap/sexual history and **never** asked fetal heart, SFH, or Leopold's. Silo held in 10/10 loops.
- **Universal screens fire correctly on the positive/unknown side.** HIV raised as an urgent problem where it mattered — ART-naive PMTCT (26w), unknown status in septic miscarriage and PID both correctly escalated to "test now"; syphilis testing added in PID.
- **Data-earned cross-content is handled, not blocked.** Endometrial-Ca correctly pulled recorded T2DM + obesity; postnatal-sepsis loop correctly ran the EPDS mood screen (the legitimate postnatal psych exception); and the **ACS red-flag probe** returned "CRITICAL — this is NOT an O&G problem... do not let specialty-territoriality delay transfer, activate Emergency Medicine, 12-lead in 10 min." Safe escalation without habitual bleed — the ideal D7 behaviour.
- **Robust under load and at the edges.** 47 concurrent problem calls + 10 multi-turn loops: no 500, no stall, no malformed JSON. Empty-fields/garbage-context, bare-Enter answers, and near-empty snapshots all returned 200; a missing required key returned a clean 400 with a useful message.

## Cons (concrete, with evidence)
- **HIV-negative padding dilutes the problem list.** When status is already documented negative, "HIV-negative (confirmed this pregnancy) [Z71.7]" is still emitted as its own numbered problem in ~15 cases (menopause, Bartholin abscess, PCOS, ovarian torsion, breech, gestational HTN, threatened miscarriage, cord prolapse, etc.). It is clinical noise and, in short lists, crowds out a more useful entry. Source: the HIV rule in `apps/api/src/services/tools-clinical.ts` (~line 108) says "if positive **or unknown**… always raise it" but the model raises it even when negative.
- **A few gynae surgical-emergency lists are thin.** **Ovarian torsion** returned only 2 problems, one of them the HIV-negative padding, and no explicit NPO / theatre / analgesia problem line. **Ruptured haemorrhagic ovarian cyst** returned a **single** problem — no companion anaemia/haemodynamic-monitoring/FBC line despite a documented haemoperitoneum. These are the cases where a busy intern most needs the safety-net list spelled out.
- **Soft question-loop in the assist flow.** 3/10 History loops re-asked one identical question consecutively before recovering: chorioamnionitis asked "Gestational age, LMP, and EDD?" twice in a row (Q1=Q2); the IUFD loop re-asked the whole admin block (Q0→Q1); puerperal sepsis re-asked "Admission date… gravida, para…" (Q1=Q2). No session broke, but it violates the prompt's own "never re-ask a field twice / never loop" rule and wastes a turn. Evidence: `scratchpad/assist-out.json`.
- **Extraction-into-`updates` is uneven.** Field capture per loop ranged 5→12 keys even though the questions asked covered everything; e.g. the severe-pre-eclampsia loop asked HIV, ANC visits, meds and family history but persisted only 5 fields. Partly a simulation artifact (terse simulated answers), but it means on-target questions don't always translate into filled fields.
- **Minor completeness omissions on two zebras (borderline D1/D3):** molar pregnancy produced no post-evacuation hCG-surveillance / GTN-follow-up problem line; menopause produced a single-issue list with no bone-health/CVD/HRT-counselling entry. Defensible, but a consultant might want them.

## Top 3 fixes (ranked by impact)
1. **Gate the HIV problem on status.** In the `suggestProblems` HIV rule (`tools-clinical.ts` ~line 108), only surface HIV as its own problem when status is **positive or unknown/untested**; when it is documented negative, keep it in the record but do not emit a numbered problem. Cleans ~1/3 of the panel at a stroke and lifts D1 signal-to-noise with zero clinical downside.
2. **Harden the assist loop-guard against verbatim repeats.** When the intern's last answer did not populate the field just asked about, the model must rephrase or advance rather than re-emit the identical question (seen in 3/10 loops). A "do not repeat your previous question verbatim; if unanswered, note it and move on" instruction (plus collapsing consecutive duplicate `nextQuestion`s client-side) removes the wasted turn and the only visible D7 wobble.
3. **Guarantee the safety-net problem set for gynae acute abdomens.** Ovarian torsion and ruptured haemorrhagic cyst should always generate the companion problems a surgical emergency implies — haemodynamic monitoring / FBC-crossmatch / anaemia watch and NPO+theatre+analgesia — rather than a 1–2 line list. Extend the STG/problem prompt with an "acute pelvic surgical emergency → mandatory monitoring + resus problems" rule to close the thin-list gap on the cases that matter most.
