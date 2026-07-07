import type { DeptFieldFragments } from '../types';

// Paediatric field fragments — SA state-hospital conventions: everything is
// weighed (prescribing is mg/kg), plotted (RTHB growth curves), screened
// (IMCI danger signs), and checked against the EPI schedule. Neonates are
// framed by day of life; the SAM corner runs on the WHO ten steps.

export const paedsFields: DeptFieldFragments = {
  intake: d => [
    { key: 'weight', label: 'Weight (kg)', value: d.weight ?? '', hint: 'today\'s ACTUAL weight — every paediatric prescription is mg/kg; an estimated or stale weight is a dosing error waiting to happen', placeholder: 'e.g. 8.4 kg (weighed today)' },
    { key: 'rthb', label: 'RTHB (Road to Health Book)', value: d.rthb ?? '', kind: 'select', options: ['Seen — with patient', 'Not brought — ask caregiver to bring', 'Lost — issue new & rebuild record'], hint: 'the RTHB is the child\'s medical record: growth curves, immunisations, previous weights, HIV/TB page — "not seen" is a data gap to close, not a checkbox to skip' },
    { key: 'immunisations', label: 'Immunisations', value: d.immunisations ?? '', hint: 'from the RTHB page, not caregiver memory — checked against the SA EPI schedule for age', placeholder: 'Up to date / behind (which dose) / unknown' },
    { key: 'birthHistory', label: 'Birth History', value: d.birthHistory ?? '', hint: 'gestation, mode of delivery, birth weight, complications — prematurity changes corrected age, growth targets and risk for years', placeholder: 'e.g. term NVD, BW 3.2kg, no complications' },
    { key: 'caregiver', label: 'Caregiver', value: d.caregiver ?? '', hint: 'who is the historian and who takes the child home — consent, feeding and follow-up all run through this person', placeholder: 'Parent/guardian name + relationship' },
  ],

  history: {
    insertAt: 2,
    fields: (d, subDept) => {
      if (subDept === 'neonatal') {
        return [
          { key: 'birthDetails', label: 'Birth Details', value: d.birthDetails ?? '', kind: 'textarea', hint: 'gestation at birth, birth weight, mode of delivery, APGARs 1/5min, resuscitation needed (bag-mask? how long?) — the APGARs and resus story predict today\'s problems (HIE, feeding, glucose)', placeholder: 'e.g. 34w EMCS for PET, BW 1.9kg, APGAR 6/8, bag-mask 1 min' },
          { key: 'maternalRisk', label: 'Maternal / Perinatal Risk', value: d.maternalRisk ?? '', kind: 'textarea', hint: 'the neonatal sepsis and congenital-infection screen lives in the MOTHER\'s file: HIV (+PMTCT given?), RPR result & treatment doses, ROM ≥18h, maternal fever in labour, GBS', placeholder: 'e.g. mother HIV+ on ART VL suppressed; RPR neg; ROM 6h; no fever' },
          { key: 'hivExposure', label: 'HIV Exposure & Prophylaxis', value: d.hivExposure ?? '', hint: 'if exposed: birth PCR sent + result, NVP started (±AZT if high-risk: maternal VL >1000 or unknown) — the PMTCT cascade fails at exactly these handovers', placeholder: 'e.g. HIV-exposed, birth PCR sent, on NVP — or not exposed' },
          { key: 'feeding', label: 'Feeding', value: d.feeding ?? '', kind: 'textarea', hint: 'route (breast/cup/NG), volumes calculated per kg — day 1 starts ~60 ml/kg/day, advancing ~20-30/day to 150-180 ml/kg/day; "feeding well" is not a number', placeholder: 'e.g. EBM via NG, 45ml 3-hourly = 150 ml/kg/day, tolerated' },
        ];
      }
      if (subDept === 'malnutrition') {
        return [
          { key: 'nutritionHistory', label: 'Nutrition History', value: d.nutritionHistory ?? '', kind: 'textarea', hint: '24-hour dietary recall, breastfeeding history, when and why feeding changed, food security at home, who feeds the child — SAM is a household diagnosis, not just a child\'s', placeholder: '24h recall, weaning story, food security, who feeds the child' },
          { key: 'tbHivScreen', label: 'TB / HIV Screen', value: d.tbHivScreen ?? '', hint: 'every SAM child is HIV and TB until excluded — HIV test THIS admission, TB contact + symptom screen; SAM that doesn\'t respond to feeding is untreated TB or HIV', placeholder: 'e.g. HIV test sent, no known TB contact, cough 3 weeks — sputum/GA sent' },
          { key: 'socialCircumstances', label: 'Social Circumstances', value: d.socialCircumstances ?? '', kind: 'textarea', hint: 'grants (CSG in place?), who else is in the house, previous SAM admissions, social-worker involvement — the relapse is prevented here, not with the feeds', placeholder: 'e.g. CSG not yet accessed — refer social worker; 3 siblings' },
        ];
      }
      return [
        { key: 'development', label: 'Development', value: d.development ?? '', kind: 'textarea', hint: 'milestones for age across all four domains — regression (losing milestones) is a red flag, not a variant; correct for prematurity until 2 years', placeholder: 'Gross motor, fine motor, language, social — for (corrected) age' },
        { key: 'feeding', label: 'Feeding / Nutrition', value: d.feeding ?? '', kind: 'textarea', hint: 'breast/formula/solids, appetite, recent change — "stopped eating" in a child carries the weight "chest pain" carries in an adult', placeholder: 'Feeding pattern, appetite, recent changes' },
        { key: 'tbContact', label: 'TB Contact', value: d.tbContact ?? '', hint: 'anyone in the household with TB or a chronic cough? A child <5 in contact with TB qualifies for preventive therapy even when well — asking is the intervention', placeholder: 'e.g. no known contact — or uncle on TB treatment, same house' },
        { key: 'hivExposurePcr', label: 'HIV Exposure / PCR', value: d.hivExposurePcr ?? '', hint: 'maternal status + child\'s last test (PCR <18 months, rapid after) from the RTHB page — an HIV-exposed child with no documented test needs one THIS visit', placeholder: 'e.g. mother HIV+, child PCR neg at 10w, repeat due' },
      ];
    },
  },

  assessment: {
    // After General + Focused exam (index 4), before Investigations.
    insertAt: 4,
    fields: (d, subDept) => {
      if (subDept === 'neonatal') {
        return [
          { key: 'dayOfLife', label: 'Day of Life', value: d.dayOfLife ?? '', hint: 'every neonatal number is read against day of life — bilirubin thresholds, expected weight change, feed volumes, sepsis pattern (day 0-3 = maternal origin, later = environment)', placeholder: 'e.g. day 3 of life' },
          { key: 'growth', label: 'Weight vs Birth Weight', value: d.growth ?? '', hint: 'weigh daily and compute % change from birth weight — up to 10% loss is physiological, regained by day 10-14; >10% = formal feeding assessment + sodium, not reassurance', placeholder: 'e.g. 1.85kg (BW 1.9kg, -2.6%); HC 31cm' },
          { key: 'jaundice', label: 'Jaundice (hours of life)', value: d.jaundice ?? '', hint: 'always anchor to HOURS of life — visible jaundice <24h is ALWAYS pathological (haemolysis until proven otherwise); plot TSB on the hour-specific chart, never judge a bilirubin without the age', placeholder: 'e.g. jaundiced to trunk at 52h, TSB 240 — below photo line' },
          { key: 'feedsAndOutput', label: 'Feeds & Output Today', value: d.feedsAndOutput ?? '', hint: 'ml/kg/day actually TAKEN (not prescribed), vomits, urine + stool count — a neonate refusing feeds is septic until proven otherwise', placeholder: 'e.g. tolerating 150 ml/kg/day, no vomits, 6 wet nappies, stooling' },
          { key: 'neonatalDangerSigns', label: 'Neonatal Danger Signs', value: d.neonatalDangerSigns ?? '', hint: 'poor feeding, temperature instability (hypothermia counts MORE than fever), apnoea, convulsions, lethargy — any ONE in a neonate = presume sepsis: culture and treat, don\'t observe', placeholder: 'e.g. none — feeding, active, temp stable' },
          { key: 'hydration', label: 'Hydration / Perfusion', value: d.hydration ?? '', hint: 'fontanelle, turgor, mucous membranes, cap refill — plus glucose: the hypoglycaemic neonate looks exactly like the septic one', placeholder: 'Hydration + perfusion findings, glucose if checked' },
        ];
      }
      if (subDept === 'malnutrition') {
        return [
          { key: 'anthropometry', label: 'Anthropometry', value: d.anthropometry ?? '', hint: 'weight, length/height, weight-for-height Z-score PLOTTED, MUAC — WHZ <-3 or MUAC <11.5cm (6-59m) = SAM; admission and discharge criteria both live in these numbers', placeholder: 'e.g. 6.1kg, 71cm, WHZ -3.4, MUAC 10.8cm' },
          { key: 'oedemaGrade', label: 'Nutritional Oedema', value: d.oedemaGrade ?? '', kind: 'select', options: ['None', '+ (both feet)', '++ (feet + lower legs/hands)', '+++ (generalised incl. face)'], hint: 'bilateral pitting oedema = SAM regardless of the weight (kwashiorkor) — and oedematous SAM carries the higher mortality; grade it daily, weight falls as oedema clears' },
          { key: 'appetiteTest', label: 'Appetite Test (RUTF)', value: d.appetiteTest ?? '', kind: 'select', options: ['Passed — eats RUTF portion', 'Failed — refuses/unable', 'Not done yet'], hint: 'the appetite test IS the triage: failed appetite or any complication = complicated SAM = inpatient F-75; passed + well = outpatient RUTF is safer than a hospital bed' },
          { key: 'feedingPhase', label: 'Feeding Phase', value: d.feedingPhase ?? '', kind: 'select', options: ['Stabilisation — F-75', 'Transition', 'Rehabilitation — F-100 / RUTF'], hint: 'F-75 FIRST: pushing volume, protein or sodium in the first days kills (refeeding syndrome, heart failure) — transition only when oedema is settling and appetite returns' },
          { key: 'complicationsCheck', label: 'Complications Check', value: d.complicationsCheck ?? '', kind: 'textarea', hint: 'the WHO first steps: glucose (hypoglycaemia), temperature (hypothermia — both signs of sepsis in SAM), dehydration assessed CAUTIOUSLY (signs overlap SAM; rehydrate with ReSoMal orally — IV fluids only in shock), infection (often afebrile), eyes (vitamin A), skin/dermatosis', placeholder: 'Glucose, temp, hydration, infection screen, eyes, skin' },
        ];
      }
      return [
        { key: 'growth', label: 'Growth (plotted on RTHB)', value: d.growth ?? '', hint: 'weight PLOTTED on the RTHB curve with centile, plus height/HC — a written weight misses the fall across centiles; the trend across previous visits is the diagnosis', placeholder: 'e.g. 8.4kg — plotted, fallen from 25th to 3rd centile' },
        { key: 'muac', label: 'MUAC', value: d.muac ?? '', hint: '6-59 months: <11.5cm = SAM, 11.5-12.4 = MAM — MUAC catches the wasted child whose weight-for-age still looks acceptable, and it takes ten seconds', placeholder: 'e.g. 13.2 cm' },
        { key: 'imciDangerSigns', label: 'IMCI Danger Signs', value: d.imciDangerSigns ?? '', kind: 'select', options: ['None — all four screened negative', 'Unable to drink/breastfeed', 'Vomits everything', 'Convulsions (this illness)', 'Lethargic / unconscious', 'More than one sign'], hint: 'the four general danger signs are screened in EVERY sick child — any one reclassifies as severe: admit, treat pre-referral, do not send home. Document "screened negative" explicitly', placeholder: '' },
        { key: 'hydration', label: 'Hydration Status', value: d.hydration ?? '', hint: 'IMCI classification: sunken eyes, skin pinch (≥2s), drinking eagerly vs unable, lethargy — these signs pick Plan A/B/C: oral vs supervised ORS vs IV', placeholder: 'e.g. no sunken eyes, pinch immediate — no dehydration (Plan A)' },
      ];
    },
  },
};
