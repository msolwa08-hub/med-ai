import type { AssistField } from '../../toolsApi';
import type { DeptFieldFragments } from '../types';

// O&G field fragments — written to SA state-hospital conventions (BANC-Plus
// antenatal contacts, the national partogram, Maternity Care Guidelines).
// Hints carry the consultant rationale so the intern learns WHY each value is
// captured, not just what to type.

export const ogFields: DeptFieldFragments = {
  intake: d => [
    { key: 'gestationalAge', label: 'Gestational Age', value: d.gestationalAge ?? '', hint: 'by best estimate — early scan beats LMP beats SFH', placeholder: 'e.g. 32+4 weeks (by 12w scan)' },
    { key: 'lmp', label: 'LMP', value: d.lmp ?? '', placeholder: 'Last menstrual period' },
    { key: 'edd', label: 'EDD', value: d.edd ?? '', hint: 'and how it was derived (scan vs dates) — a wrong EDD corrupts every later decision', placeholder: 'e.g. 2026-08-14 (by early scan)' },
    { key: 'gravida', label: 'Gravida', value: d.gravida ?? '', placeholder: 'G?' },
    { key: 'para', label: 'Para', value: d.para ?? '', hint: 'include miscarriages/ectopics as the G-P difference, e.g. G4 P2+1', placeholder: 'P?' },
  ],

  history: {
    // Built in the intended reading order, then inserted once (right after
    // Past Medical History) — avoids fragile re-computed splice indices.
    insertAt: 3,
    fields: (d, subDept) => {
      const ogHistory: AssistField[] = [
        { key: 'obstetricHistory', label: 'Obstetric History', value: d.obstetricHistory ?? '', kind: 'textarea', hint: 'each pregnancy: year, GA at delivery, outcome, mode (if CS — WHY), birth weight, complications (PPH, PET, GDM), baby alive and well?', placeholder: 'e.g. 2019 NVD term 3.1kg well; 2022 EMCS 36w for severe PET, 2.4kg, NICU 5d' },
      ];
      if (subDept !== 'gynae') {
        // Relevant across the whole pregnancy journey (antenatal, labour,
        // postnatal) — not just the booking visit.
        ogHistory.push(
          { key: 'antenatalVisits', label: 'Antenatal Visits', value: d.antenatalVisits ?? '', hint: 'count vs BANC-Plus (8 contacts: booking <14w, then 20, 26, 30, 34, 36, 38, 40w) — behind-schedule or unbooked is itself a risk factor', placeholder: 'e.g. booked 16w, 4 visits — behind schedule for GA' },
          { key: 'supplementation', label: 'Supplementation', value: d.supplementation ?? '', hint: 'ferrous sulfate + folic acid, calcium (pre-eclampsia prevention) — confirm actually TAKEN, not just prescribed; ask by tablet colour if unsure', placeholder: 'e.g. FeSO4 + folate daily, adherent; calcium since booking' },
        );
      }
      if (subDept === 'labour') {
        ogHistory.push(
          { key: 'onsetOfLabour', label: 'Onset of Labour', value: d.onsetOfLabour ?? '', hint: 'spontaneous vs induced (and why induced), time contractions became regular/painful — the clock the partogram runs on', placeholder: 'e.g. spontaneous, regular painful contractions since 04:00' },
          { key: 'membraneRupture', label: 'Membranes / ROM', value: d.membraneRupture ?? '', hint: 'time of rupture + liquor colour at ROM — ROM ≥18h means intrapartum antibiotics (neonatal sepsis risk); meconium upgrades fetal surveillance', placeholder: 'e.g. SROM 02:30, clear liquor — or intact' },
        );
      } else if (subDept === 'postnatal') {
        ogHistory.push(
          { key: 'deliverySummary', label: 'Delivery Summary', value: d.deliverySummary ?? '', kind: 'textarea', hint: 'mode + indication if operative, duration of labour, EBL, perineal outcome, placenta complete? — the postnatal ward inherits every intrapartum event', placeholder: 'e.g. EMCS 14:20 for fetal distress at 6cm, EBL 800ml, spinal, baby to mother' },
        );
      } else if (subDept === 'gynae') {
        // Not necessarily a current pregnancy — antenatal course this visit doesn't apply.
        ogHistory.push(
          { key: 'gynaeHistory', label: 'Gynae History', value: d.gynaeHistory ?? '', kind: 'textarea', hint: 'menstrual pattern (cycle, duration, heaviness), contraception NOW (drives the ectopic question), pap smear date + result, previous gynae surgery', placeholder: 'Menstrual Hx, current contraception, last pap + result, previous gynae surgery' },
        );
      } else {
        ogHistory.push(
          { key: 'antenatalCare', label: 'Antenatal Care', value: d.antenatalCare ?? '', kind: 'textarea', hint: 'booking GA, scans (dating + anomaly), booking bloods (Hb, RPR, HIV, blood group + Rh), problems this pregnancy', placeholder: 'Booking GA, scans, booking bloods, problems this pregnancy' },
          { key: 'gynaeHistory', label: 'Gynae History', value: d.gynaeHistory ?? '', kind: 'textarea', hint: 'menstrual history, contraception, pap smears, gynae surgery', placeholder: 'Menstrual Hx, contraception, pap smears, previous gynae surgery' },
        );
      }
      return ogHistory;
    },
  },

  assessment: {
    // After General + Focused exam (index 4), before Investigations.
    insertAt: 4,
    fields: (d, subDept) => {
      if (subDept === 'postnatal') {
        // Pregnancy has ended — mode of delivery is the ROOT of this exam:
        // everything below branches on it. Old records that only captured the
        // legacy free-text field still classify via the combined string.
        const modeText = `${d.modeOfDelivery ?? ''} ${d.modeAndTimeOfDelivery ?? ''}`;
        const isCS = /CS|c(a)?esar|LSCS/i.test(modeText);
        const isVaginal = !isCS && /NVD|vacuum|ventouse|forceps|assisted|vaginal/i.test(modeText);
        const fields: AssistField[] = [
          { key: 'modeOfDelivery', label: 'Mode of Delivery', value: d.modeOfDelivery ?? '', kind: 'select', options: ['NVD', 'Assisted — vacuum (ventouse)', 'Assisted — forceps', 'EMCS (emergency)', 'ELCS (elective)'], hint: 'the ROOT of the postnatal exam — perineum vs wound, VTE risk and next-pregnancy counselling all branch on this; set it first' },
          { key: 'dayPostDelivery', label: 'Day Post Delivery', value: d.dayPostDelivery ?? '', hint: 'frame every finding by the day: fundal height, lochia volume and mood all have day-specific norms', placeholder: 'e.g. day 2 post EMCS' },
        ];
        if (isCS) {
          fields.push(
            { key: 'csIndication', label: 'CS Indication', value: d.csIndication ?? '', hint: 'EMCS vs ELCS matters: emergency section = higher sepsis + thromboembolic risk NOW, and the indication decides VBAC eligibility next pregnancy — counsel before discharge', placeholder: 'e.g. EMCS for pathological CTG at 5cm' },
            { key: 'csWound', label: 'CS Wound', value: d.csWound ?? '', hint: 'inspect, don\'t just ask — erythema, discharge, gaping; wound sepsis declares itself around day 3, exactly when she is being discharged', placeholder: 'e.g. clean and dry, no erythema, dressing intact' },
            { key: 'thromboprophylaxis', label: 'Thromboprophylaxis', value: d.thromboprophylaxis ?? '', kind: 'select', options: ['Enoxaparin charted & given', 'Charted — dose missed, chase', 'Not charted — fix today', 'Contraindicated (documented why)'], hint: 'pregnancy + surgery is the highest-risk VTE combination on the ward — post-CS thromboprophylaxis is the default; its absence needs a written reason' },
            { key: 'bowelFunction', label: 'Bowel Function / Diet', value: d.bowelFunction ?? '', hint: 'passing flatus, tolerating diet — the ileus screen after abdominal surgery; distension + vomiting is not "normal post-CS"', placeholder: 'e.g. passing flatus, tolerating soft diet' },
          );
        } else {
          fields.push(
            { key: 'perineum', label: 'Perineum', value: d.perineum ?? '', kind: 'select', options: ['Intact', '1st degree tear', '2nd degree tear', '3rd degree tear', '4th degree tear', 'Episiotomy'], hint: '3rd/4th degree (anal sphincter) tears need laxatives, physio referral and a direct continence question at follow-up — grade it, don\'t write "tear"' },
            { key: 'perineumRepair', label: 'Repair / Perineal Check', value: d.perineumRepair ?? '', hint: 'inspect: repair intact, no gaping, no haematoma (severe perineal pain + swelling = haematoma until looked at)', placeholder: 'e.g. repair intact, no haematoma, minimal swelling' },
          );
        }
        if (!isCS && !isVaginal && (d.perineumOrWound ?? '') !== '') {
          // Legacy field from earlier saved records — keep it visible so old data loads.
          fields.push({ key: 'perineumOrWound', label: 'Perineum / Wound (prior note)', value: d.perineumOrWound ?? '', placeholder: 'Intact / tear grade / episiotomy / wound condition' });
        }
        fields.push(
          { key: 'uterineInvolution', label: 'Uterine Involution', value: d.uterineInvolution ?? '', hint: 'fundus firm and below the umbilicus, descending daily — boggy or high = retained products or atony: the secondary-PPH screen', placeholder: 'e.g. fundus 2 fingers below umbilicus, well contracted' },
          { key: 'lochia', label: 'Lochia', value: d.lochia ?? '', hint: 'check the PAD, don\'t just ask — heavy/clots = PPH risk; offensive = endometritis (with uterine tenderness to match)', placeholder: 'e.g. moderate rubra, no clots, no odour' },
          { key: 'breastfeedingStatus', label: 'Breastfeeding', value: d.breastfeedingStatus ?? '', hint: 'watch a latch before discharge — "breastfeeding established" is an observation, not a question; engorgement vs mastitis matters from day 3', placeholder: 'e.g. latching well, feeding on demand' },
          { key: 'rhesusAntiD', label: 'Rhesus / Anti-D', value: d.rhesusAntiD ?? '', kind: 'select', options: ['Rh positive — N/A', 'Rh negative — anti-D given', 'Rh negative — anti-D NEEDED', 'Blood group unknown — check booking bloods'], hint: 'anti-D within 72h of delivering an Rh-positive baby — a missed dose sensitises her, and the harm lands on the NEXT pregnancy' },
          { key: 'contraceptionPlan', label: 'Contraception Plan', value: d.contraceptionPlan ?? '', kind: 'select', options: ['Implant inserted', 'PPIUD inserted', 'Injectable given', 'POP/COC script issued', 'Sterilisation done at CS', 'Declined — documented', 'Not yet discussed — do before discharge'], hint: 'decided BEFORE discharge — the postnatal bed is the most reliable family-planning contact she will have; an inter-pregnancy interval <18 months raises risk next time (and rules out VBAC after CS)' },
          { key: 'mentalHealthScreen', label: 'Mood / EPDS Screen', value: d.mentalHealthScreen ?? '', hint: 'EPDS before discharge — score ≥13 or ANY thought of self-harm = refer, do not reassure; postnatal depression hides behind "just tired" (the legitimate psych exception in obstetrics)', placeholder: 'e.g. EPDS 6 — low risk; bonding well' },
          { key: 'babyStatus', label: 'Baby Status / PMTCT', value: d.babyStatus ?? '', hint: 'baby with mother, feeding, examined? If HIV-exposed: birth PCR SENT and NVP (±AZT if high-risk) STARTED before discharge — the PMTCT cascade breaks at exactly this handover', placeholder: 'e.g. baby well, rooming in; HIV-exposed — PCR sent, NVP started' },
        );
        return fields;
      } else if (subDept === 'gynae') {
        // Not assumed pregnant — pelvic/bimanual exam replaces the obstetric
        // routine, and the pregnancy test comes FIRST.
        return [
          { key: 'pregnancyStatus', label: 'Pregnancy Test', value: d.pregnancyStatus ?? '', kind: 'select', options: ['Urine hCG negative', 'Urine hCG POSITIVE', 'Serum βhCG pending', 'Known pregnant', 'NOT DONE — do it first'], hint: 'pregnancy test FIRST in every woman of reproductive age with bleeding or pain — the ruptured ectopic is how gynae patients die, and a urine test excludes it in minutes' },
          { key: 'bleedingPattern', label: 'Bleeding Pattern', value: d.bleedingPattern ?? '', hint: 'timing vs cycle: intermenstrual, post-coital (cervical pathology until the cervix is SEEN), postmenopausal (endometrial cancer until excluded)', placeholder: 'e.g. intermenstrual for 3 months, also post-coital' },
          { key: 'bleedingQuantified', label: 'Bleeding Quantified', value: d.bleedingQuantified ?? '', hint: '"heavy" is not a measurement — pads/day, soaked vs spotted, clots (and size), flooding, days per cycle; this grades urgency and transfusion risk', placeholder: 'e.g. 6 soaked pads/day, clots 2-3cm, flooding x2, 7 days' },
          { key: 'speculumExam', label: 'Speculum Exam', value: d.speculumExam ?? '', kind: 'textarea', hint: 'cervix: os open/closed, products at the os (remove them — often stops both the bleeding and the vagal shock), source of bleeding (os vs cervix vs vault), discharge, lesions', placeholder: 'e.g. os closed, no products, cervix macroscopically normal, scant bleeding from os' },
          { key: 'bimanualExam', label: 'Bimanual Exam', value: d.bimanualExam ?? '', kind: 'textarea', hint: 'uterine size (weeks-equivalent) and position, cervical motion tenderness, adnexal mass/tenderness — CMT + adnexal tenderness = ectopic or PID until excluded', placeholder: 'e.g. uterus normal size, anteverted; no CMT; no adnexal mass or tenderness' },
        ];
      } else if (subDept === 'labour') {
        // The labour-ward routine: abdominal palpation BEFORE the VE, then the
        // full structured VE, everything plotted on the partogram.
        return [
          { key: 'lieAndPresentation', label: 'Lie & Presentation', value: d.lieAndPresentation ?? '', hint: 'Leopold\'s BEFORE every VE — descent in fifths palpable above the brim is the caput-proof measure of progress; station alone misleads once caput forms', placeholder: 'e.g. longitudinal, cephalic, 2/5 palpable above brim' },
          { key: 'contractions', label: 'Contractions', value: d.contractions ?? '', hint: 'per 10 min + duration + strength, charted on the partogram — adequate labour is 3-4 in 10 lasting ≥40s; poor progress with weak contractions is managed differently from poor progress with strong ones (?CPD)', placeholder: 'e.g. 3 in 10, 40-50s, strong' },
          { key: 'fhrCtg', label: 'FHR / CTG', value: d.fhrCtg ?? '', kind: 'select', options: ['Normal (reassuring)', 'Suspicious — increase surveillance', 'Pathological — act now', 'Intermittent auscultation normal', 'Decelerations heard — CTG on'], hint: 'classify, don\'t just describe — listen for a full minute AFTER a contraction (late decelerations hide there); pathological = intrauterine resuscitation (left lateral, fluids, stop oxytocin) while the delivery decision is made' },
          { key: 'cervicalDilation', label: 'Cervical Dilation', value: d.cervicalDilation ?? '', hint: 'in cm — active labour starts at 4cm on the SA partogram and is expected to progress at ≥1cm/hr from there', placeholder: 'e.g. 6 cm' },
          { key: 'effacement', label: 'Effacement', value: d.effacement ?? '', kind: 'select', options: ['Long / uneffaced', 'Partially effaced (~50%)', 'Fully effaced'], hint: 'a long thick cervix at 3cm is a much earlier labour than a fully effaced one at 3cm — dilation without effacement overstates progress' },
          { key: 'station', label: 'Station', value: d.station ?? '', kind: 'select', options: ['-3', '-2', '-1', '0 (at ischial spines)', '+1', '+2', '+3'], hint: 'relative to the ischial spines — cross-check against fifths palpable abdominally: caput can sit at +1 while the head is still 3/5 above the brim' },
          { key: 'membranes', label: 'Membranes', value: d.membranes ?? '', kind: 'select', options: ['Intact', 'SROM — time recorded', 'SROM — time unknown', 'ARM performed'], hint: 'record the TIME of rupture — ≥18h of ruptured membranes = intrapartum antibiotics for neonatal sepsis prevention' },
          { key: 'liquor', label: 'Liquor', value: d.liquor ?? '', kind: 'select', options: ['Membranes intact — none seen', 'Clear', 'Meconium grade I (thin)', 'Meconium grade II', 'Meconium grade III (thick)', 'Blood-stained'], hint: 'grade the meconium — thick meconium upgrades surveillance to continuous CTG and warns the neonatal resus team before delivery' },
          { key: 'caputMoulding', label: 'Caput & Moulding', value: d.caputMoulding ?? '', hint: 'moulding graded 0 to +++ (+++ = sutures overlapping and NOT reducible) — increasing caput + moulding with arrested descent is cephalopelvic disproportion declaring itself; oxytocin here ruptures uteri', placeholder: 'e.g. caput +, moulding + (reducible)' },
          { key: 'fetalPosition', label: 'Position', value: d.fetalPosition ?? '', kind: 'select', options: ['OA', 'LOA', 'ROA', 'LOT', 'ROT', 'LOP', 'ROP', 'OP', 'Breech', 'Face / brow', 'Uncertain'], hint: 'feel for the sagittal suture and fontanelles — OP and asynclitism explain slow progress and back pain; you cannot interpret the partogram without the position' },
          { key: 'partogramStatus', label: 'Partogram', value: d.partogramStatus ?? '', kind: 'select', options: ['Not yet started (latent phase)', 'Plotting — left of alert line', 'On / right of ALERT line', 'CROSSED ACTION LINE', 'Not plotted — start NOW'], hint: 'the alert line assumes 1cm/hr from 4cm; touching it = review (contractions adequate? CPD signs?). Crossing the ACTION line (4h right of the alert) at district level MANDATES a decision — ARM/oxytocin if no CPD, or CS/transfer. An unplotted labour is an unmonitored labour' },
          { key: 'lastVeTime', label: 'Last VE / Next Due', value: d.lastVeTime ?? '', hint: '4-hourly in active labour per protocol (sooner only for a reason: pathological CTG, urge to push, before analgesia) — every extra VE adds infection risk, especially with ruptured membranes', placeholder: 'e.g. VE 10:00 — next due 14:00' },
          { key: 'analgesia', label: 'Analgesia', value: d.analgesia ?? '', kind: 'select', options: ['None requested', 'Entonox', 'Pethidine + promethazine', 'Epidural', 'Other'], hint: 'offer it, don\'t wait to be asked — and pethidine within ~4h of delivery sedates the baby: tell the resus team' },
        ];
      }
      // Antenatal (or no sub-department chosen): standard obstetric routine,
      // plus pre-eclampsia risk-screen fields.
      return [
        { key: 'sfh', label: 'SFH (plotted)', value: d.sfh ?? '', hint: 'measure in cm and PLOT on the SFH-vs-gestation chart in the file — a single value means little; a curve flattening or crossing centiles over visits is the growth-restriction screen. >2-3cm off dates → ultrasound referral', placeholder: 'e.g. 30cm at 34w — plotted, dropping below 10th centile' },
        { key: 'lieAndPresentation', label: 'Lie & Presentation', value: d.lieAndPresentation ?? '', hint: 'Leopold\'s: lie, presentation, engagement in fifths — a breech found at 36w gets ECV or a planned CS; a breech found in labour is an emergency that was findable weeks earlier', placeholder: 'e.g. longitudinal lie, cephalic, 3/5 palpable' },
        { key: 'fetalHeart', label: 'Fetal Heart', value: d.fetalHeart ?? '', hint: 'rate and where heard — the FH is the fetal vital sign; "FH not documented" is indefensible in any obstetric note', placeholder: 'e.g. FHR 142 bpm, left lower quadrant' },
        { key: 'fetalMovements', label: 'Fetal Movements', value: d.fetalMovements ?? '', hint: 'ask at EVERY contact from 28w; reduced movements = CTG the same day, never reassurance without one — RFM is the commonest last presentation before stillbirth. Kick chart if recurrent (<10 movements/12h flags)', placeholder: 'e.g. normal — >10 kicks this morning' },
        { key: 'contractions', label: 'Contractions', value: d.contractions ?? '', hint: 'any tightenings? frequency, duration, strength — regular painful tightenings before 37w are preterm labour until proven otherwise (the steroids window)', placeholder: 'e.g. occasional tightenings — or none' },
        { key: 'bpTrend', label: 'BP vs Booking', value: d.bpTrend ?? '', hint: 'today\'s BP against the booking baseline — a rise ≥15 diastolic from booking matters even below 140/90; rising BP + new proteinuria = pre-eclampsia workup TODAY, not at the next visit', placeholder: 'e.g. booking 104/68 → today 138/88 — rising' },
        { key: 'oedemaAndReflexes', label: 'Oedema & Reflexes', value: d.oedemaAndReflexes ?? '', hint: 'face/hand oedema + hyperreflexia/clonus are the bedside signs of severe pre-eclampsia and imminent eclampsia; dependent ankle oedema alone is normal pregnancy', placeholder: 'e.g. mild pedal oedema only, reflexes normal, no clonus' },
        { key: 'urineDipstick', label: 'Urine Dipstick', value: d.urineDipstick ?? '', hint: 'proteinuria at every visit — trend it with the BP: persistent 1+ or a single ≥2+ with hypertension = pre-eclampsia pathway; also catches the asymptomatic bacteriuria that triggers preterm labour', placeholder: 'e.g. protein 2+, no glucose, nitrites negative' },
        { key: 'vaginalExam', label: 'Vaginal Exam', value: d.vaginalExam ?? '', hint: 'NOT routine antenatally — only for an indication (?labour, ?ROM), and NEVER with bleeding until praevia is excluded on ultrasound', placeholder: 'Only if indicated: dilation / effacement / station / membranes' },
      ];
    },
  },
};
