import type { AssistField } from '../../toolsApi';
import type { DeptFieldFragments } from '../types';

export const ogFields: DeptFieldFragments = {
  intake: d => [
    { key: 'gestationalAge', label: 'Gestational Age', value: d.gestationalAge ?? '', placeholder: 'e.g. 32+4 weeks' },
    { key: 'lmp', label: 'LMP', value: d.lmp ?? '', placeholder: 'Last menstrual period' },
    { key: 'gravida', label: 'Gravida', value: d.gravida ?? '', placeholder: 'G?' },
    { key: 'para', label: 'Para', value: d.para ?? '', placeholder: 'P?' },
  ],

  history: {
    // Built in the intended reading order, then inserted once (right after
    // Past Medical History) — avoids fragile re-computed splice indices.
    insertAt: 3,
    fields: (d, subDept) => {
      const ogHistory: AssistField[] = [
        { key: 'obstetricHistory', label: 'Obstetric History', value: d.obstetricHistory ?? '', kind: 'textarea', hint: 'each pregnancy: year, outcome, mode of delivery, complications, birth weight', placeholder: 'G/P detail: outcomes, modes of delivery, complications' },
      ];
      if (subDept !== 'gynae') {
        // Relevant across the whole pregnancy journey (antenatal, labour,
        // postnatal) — not just the booking visit.
        ogHistory.push(
          { key: 'antenatalVisits', label: 'Antenatal Visits', value: d.antenatalVisits ?? '', hint: 'how many ANC visits this pregnancy? compare against BANC-Plus (8 contacts)', placeholder: 'Number of visits + gestation at booking' },
          { key: 'supplementation', label: 'Supplementation', value: d.supplementation ?? '', hint: 'ferrous sulfate + folic acid, calcium — confirm actually taken, not just prescribed', placeholder: 'e.g. FeSO4 + folic acid daily, adherent; calcium since 20wks' },
        );
      }
      if (subDept === 'labour') {
        ogHistory.push(
          { key: 'onsetOfLabour', label: 'Onset of Labour', value: d.onsetOfLabour ?? '', hint: 'spontaneous vs induced, time of onset', placeholder: 'e.g. spontaneous, contractions since 04:00' },
        );
      } else if (subDept === 'postnatal') {
        ogHistory.push(
          { key: 'deliverySummary', label: 'Delivery Summary', value: d.deliverySummary ?? '', kind: 'textarea', hint: 'mode, indication if operative, complications, blood loss', placeholder: 'Mode of delivery, indication, complications, EBL' },
        );
      } else if (subDept === 'gynae') {
        // Not necessarily a current pregnancy — antenatal course this visit doesn't apply.
        ogHistory.push(
          { key: 'gynaeHistory', label: 'Gynae History', value: d.gynaeHistory ?? '', kind: 'textarea', hint: 'menstrual history, contraception, pap smears, gynae surgery', placeholder: 'Menstrual Hx, contraception, pap smears, previous gynae surgery' },
        );
      } else {
        ogHistory.push(
          { key: 'antenatalCare', label: 'Antenatal Care', value: d.antenatalCare ?? '', kind: 'textarea', hint: 'booking, visits, scans, issues this pregnancy', placeholder: 'Booking GA, visits, scans, problems this pregnancy' },
          { key: 'gynaeHistory', label: 'Gynae History', value: d.gynaeHistory ?? '', kind: 'textarea', hint: 'menstrual history, contraception, pap smears, gynae surgery', placeholder: 'Menstrual Hx, contraception, pap smears, previous gynae surgery' },
        );
      }
      return ogHistory;
    },
  },

  assessment: {
    insertAt: 3,
    fields: (d, subDept) => {
      if (subDept === 'postnatal') {
        // Pregnancy has ended — obstetric-exam fields (SFH/lie/FHR/contractions)
        // no longer apply; replace with the postnatal-specific exam.
        return [
          { key: 'modeAndTimeOfDelivery', label: 'Mode & Time of Delivery', value: d.modeAndTimeOfDelivery ?? '', placeholder: 'e.g. NVD 03:40, or LSCS 14:20' },
          { key: 'uterineInvolution', label: 'Uterine Involution', value: d.uterineInvolution ?? '', hint: 'fundal height postnatally, well contracted?', placeholder: 'e.g. fundus 2 finger-breadths below umbilicus, well contracted' },
          { key: 'lochia', label: 'Lochia', value: d.lochia ?? '', hint: 'amount, colour, odour', placeholder: 'e.g. moderate, rubra, no odour' },
          { key: 'perineumOrWound', label: 'Perineum / Wound', value: d.perineumOrWound ?? '', hint: 'perineal tear/episiotomy or LSCS wound', placeholder: 'Intact / tear grade / episiotomy / wound condition' },
          { key: 'breastfeedingStatus', label: 'Breastfeeding', value: d.breastfeedingStatus ?? '', placeholder: 'Latching well / difficulties / formula' },
        ];
      } else if (subDept === 'gynae') {
        // Not assumed pregnant — pelvic/bimanual exam replaces the obstetric routine.
        return [
          { key: 'pregnancyStatus', label: 'Pregnancy Status', value: d.pregnancyStatus ?? '', hint: 'confirm if relevant, e.g. urine/serum bHCG', placeholder: 'Confirmed not pregnant / bHCG pending / positive' },
          { key: 'bleedingPattern', label: 'Bleeding Pattern', value: d.bleedingPattern ?? '', hint: 'timing vs cycle, amount, duration', placeholder: 'e.g. intermenstrual, heavy, 5 days' },
          { key: 'pelvicExam', label: 'Pelvic Exam', value: d.pelvicExam ?? '', kind: 'textarea', hint: 'speculum + bimanual: masses, tenderness, discharge, cervical findings', placeholder: 'Speculum and bimanual findings' },
        ];
      } else if (subDept === 'labour') {
        return [
          { key: 'lieAndPresentation', label: 'Lie & Presentation', value: d.lieAndPresentation ?? '', hint: "Leopold's maneuvers: lie, presentation, engagement in fifths", placeholder: 'e.g. longitudinal lie, cephalic, 2/5 palpable' },
          { key: 'contractions', label: 'Contractions', value: d.contractions ?? '', hint: 'frequency per 10 min, duration, strength', placeholder: 'e.g. 4 in 10, strong, 45sec' },
          { key: 'ctgAndLiquor', label: 'CTG & Liquor', value: d.ctgAndLiquor ?? '', hint: 'CTG trace category, liquor colour if membranes ruptured', placeholder: 'CTG: reassuring/non-reassuring; liquor clear/meconium' },
          { key: 'vaginalExam', label: 'Vaginal Exam', value: d.vaginalExam ?? '', hint: 'dilation, effacement, station, membranes — central here, not optional', placeholder: 'Dilation / effacement / station / membranes' },
          { key: 'analgesia', label: 'Analgesia', value: d.analgesia ?? '', placeholder: 'e.g. Entonox, pethidine, epidural — or none' },
        ];
      }
      // Antenatal (or no sub-department chosen): standard obstetric routine,
      // plus pre-eclampsia risk-screen fields.
      return [
        { key: 'sfh', label: 'SFH', value: d.sfh ?? '', hint: 'symphysis-fundal height in cm vs gestation', placeholder: 'e.g. 34cm — consistent with dates' },
        { key: 'lieAndPresentation', label: 'Lie & Presentation', value: d.lieAndPresentation ?? '', hint: "Leopold's maneuvers: lie, presentation, engagement in fifths", placeholder: 'e.g. longitudinal lie, cephalic, 3/5 palpable' },
        { key: 'fetalHeart', label: 'Fetal Heart', value: d.fetalHeart ?? '', hint: 'rate and where heard, or CTG summary', placeholder: 'e.g. FHR 142 bpm, left lower quadrant' },
        { key: 'contractions', label: 'Contractions', value: d.contractions ?? '', hint: 'any tightenings? frequency, duration, strength — or none', placeholder: 'e.g. 2 in 10, moderate — or none' },
        { key: 'oedemaAndReflexes', label: 'Oedema & Reflexes', value: d.oedemaAndReflexes ?? '', hint: 'facial/pedal/sacral oedema, reflexes — pre-eclampsia screen', placeholder: 'e.g. mild pedal oedema, reflexes normal' },
        { key: 'urineDipstick', label: 'Urine Dipstick', value: d.urineDipstick ?? '', hint: 'proteinuria — pre-eclampsia screen', placeholder: 'e.g. protein 2+, no glucose' },
        { key: 'vaginalExam', label: 'Vaginal Exam', value: d.vaginalExam ?? '', hint: 'only if indicated: dilation, effacement, station, membranes', placeholder: 'If indicated: dilation / effacement / station / membranes' },
      ];
    },
  },
};
