import type React from 'react';
import type { DeptId } from '../config/departments';
import type { Patient } from '../fields/types';
import { stripNegated } from '../lib/clinicalText';
import { GCSCalc } from './GCSCalc';
import { BMICalc } from './BMICalc';
import { GFRCalc } from './GFRCalc';
import { AKICalc } from './AKICalc';
import { QSOFACalc } from './QSOFACalc';
import { SOFACalc } from './SOFACalc';
import { HEARTCalc } from './HEARTCalc';
import { WellsPECalc } from './WellsPECalc';
import { WellsDVTCalc } from './WellsDVTCalc';
import { CRB65Calc } from './CRB65Calc';
import { PHQ9Calc } from './PHQ9Calc';
import { BishopCalc } from './BishopCalc';
import { ANCScheduleCalc } from './ANCScheduleCalc';
import { APGARCalc } from './APGARCalc';
import { EddGaCalc } from './EddGaCalc';
import { MEOWSCalc } from './MEOWSCalc';
import { EPDSCalc } from './EPDSCalc';
import { RMICalc } from './RMICalc';
import { PCOSCalc } from './PCOSCalc';
import { PCOSHormonesCalc } from './PCOSHormonesCalc';
import { EctopicCalc } from './EctopicCalc';
import { FertilityCalc } from './FertilityCalc';

export {
  GCSCalc, BMICalc, GFRCalc, AKICalc, QSOFACalc, SOFACalc, HEARTCalc,
  WellsPECalc, WellsDVTCalc, CRB65Calc, PHQ9Calc, BishopCalc, ANCScheduleCalc,
  APGARCalc, EddGaCalc, MEOWSCalc, EPDSCalc, RMICalc, PCOSCalc,
  PCOSHormonesCalc, EctopicCalc, FertilityCalc,
};

export interface CalculatorEntry {
  id: string;
  label: string;
  /** Departments this calculator is recommended for. */
  depts: DeptId[];
  component: React.ComponentType;
}

// Registry consumed by FormulasTab (chips + rendering) and the suggestion
// logic below. Adding a calculator means one new file plus one entry here.
export const CALCULATORS: CalculatorEntry[] = [
  { id: 'gcs', label: 'GCS', depts: ['medicine', 'surgery', 'icu', 'emergency', 'ortho'], component: GCSCalc },
  { id: 'bmi', label: 'BMI', depts: ['medicine', 'surgery', 'og', 'paeds', 'icu', 'emergency', 'psych', 'ortho'], component: BMICalc },
  { id: 'gfr', label: 'eGFR (CKD-EPI)', depts: ['medicine', 'surgery', 'icu', 'emergency'], component: GFRCalc },
  { id: 'aki', label: 'AKI (KDIGO)', depts: ['medicine', 'surgery', 'icu', 'emergency', 'ortho'], component: AKICalc },
  { id: 'qsofa', label: 'qSOFA', depts: ['medicine', 'surgery', 'icu', 'emergency'], component: QSOFACalc },
  { id: 'sofa', label: 'SOFA', depts: ['icu'], component: SOFACalc },
  { id: 'heart', label: 'HEART Score', depts: ['medicine', 'emergency'], component: HEARTCalc },
  { id: 'wellspe', label: "Wells' PE", depts: ['medicine', 'surgery', 'emergency', 'ortho'], component: WellsPECalc },
  { id: 'wellsdvt', label: "Wells' DVT", depts: ['medicine', 'surgery', 'emergency', 'ortho'], component: WellsDVTCalc },
  { id: 'crb65', label: 'CRB-65', depts: ['medicine', 'emergency'], component: CRB65Calc },
  { id: 'phq9', label: 'PHQ-9', depts: ['medicine', 'psych', 'emergency'], component: PHQ9Calc },
  { id: 'bishop', label: 'Bishop Score', depts: ['og'], component: BishopCalc },
  { id: 'ancschedule', label: 'ANC Schedule (BANC-Plus)', depts: ['og'], component: ANCScheduleCalc },
  { id: 'apgar', label: 'APGAR', depts: ['og', 'paeds'], component: APGARCalc },
  { id: 'eddga', label: 'EDD / GA', depts: ['og'], component: EddGaCalc },
  { id: 'meows', label: 'MEOWS', depts: ['og'], component: MEOWSCalc },
  { id: 'epds', label: 'EPDS', depts: ['og', 'psych'], component: EPDSCalc },
  { id: 'rmi', label: 'RMI (Ovarian)', depts: ['og'], component: RMICalc },
  { id: 'pcos', label: 'PCOS Rotterdam', depts: ['og'], component: PCOSCalc },
  { id: 'pcos_h', label: 'PCOS Hormones', depts: ['og'], component: PCOSHormonesCalc },
  { id: 'ectopic', label: 'Ectopic Assessment', depts: ['og', 'emergency'], component: EctopicCalc },
  { id: 'fertility', label: 'Fertility Workup', depts: ['og'], component: FertilityCalc },
];

// Keyword-driven calculator suggestions: scan the record (diagnosis,
// differentials, investigations, examination) and surface the scores that are
// actually relevant to this patient.
const CALC_TRIGGERS: Array<{ calc: string; pattern: RegExp; reason: string }> = [
  { calc: 'aki', pattern: /\baki\b|acute kidney|creatinine|oligur|anuri|renal (failure|impair|injur)|urea/i, reason: 'renal function mentioned' },
  { calc: 'gfr', pattern: /\baki\b|creatinine|renal|kidney|\bckd\b|nephro/i, reason: 'renal function mentioned' },
  { calc: 'heart', pattern: /chest pain|\bacs\b|troponin|angina|\bstemi\b|\bnstemi\b/i, reason: 'possible cardiac chest pain' },
  { calc: 'crb65', pattern: /pneumonia|\bcap\b(?!\s*refill)|consolidat/i, reason: 'pneumonia severity' },
  { calc: 'wellspe', pattern: /pulmonary embol|\bpe\b(?![a-z])|pleuritic/i, reason: 'PE in the differential' },
  { calc: 'wellsdvt', pattern: /\bdvt\b|deep vein|leg swelling|calf (pain|swelling)/i, reason: 'DVT in the differential' },
  { calc: 'qsofa', pattern: /sepsis|septic|infection.*hypotens|\bsirs\b/i, reason: 'sepsis screen' },
  { calc: 'sofa', pattern: /sepsis|septic shock|organ (failure|dysfunction)/i, reason: 'organ dysfunction' },
  { calc: 'gcs', pattern: /\bgcs\b|head injur|reduced (loc|level of consciousness)|unconscious|confus/i, reason: 'consciousness assessment' },
  { calc: 'phq9', pattern: /(?<!st[ -])(?<!segment )(?<!respiratory )(?<!myocardial )(?<!cns )(?<!cortical )depress|low mood|suicid/i, reason: 'mood screen' },
  { calc: 'eddga', pattern: /pregnan|gestation|antenatal|\blmp\b/i, reason: 'pregnancy dating' },
  { calc: 'meows', pattern: /pregnan|obstetric|antenatal/i, reason: 'obstetric early warning' },
  { calc: 'epds', pattern: /postnatal|postpartum|puerperal/i, reason: 'postnatal mood screen' },
  { calc: 'ectopic', pattern: /ectopic|\bpv bleed|amenorrhoea.*pain/i, reason: 'possible ectopic' },
  { calc: 'bishop', pattern: /\blabour\b|\blabor\b/i, reason: 'labour assessment' },
  { calc: 'bmi', pattern: /obes|overweight|malnutri|underweight/i, reason: 'weight assessment' },
];

export function suggestCalculators(patient: Patient): Array<{ calc: string; reason: string }> {
  const text = [
    patient.intake.admissionDiagnosis,
    patient.history.chiefComplaint,
    patient.history.hpi,
    patient.history.pmh,
    patient.assessment.examination,
    patient.assessment.investigations,
    ...patient.problems.flatMap(p => [p.problem, p.workingDx, ...p.differentials]),
  ]
    .filter(Boolean)
    .join(' \n ');

  const seen = new Set<string>();
  const out: Array<{ calc: string; reason: string }> = [];
  const positiveText = stripNegated(text);
  if (text.trim()) {
    for (const t of CALC_TRIGGERS) {
      if (seen.has(t.calc)) continue;
      if (t.pattern.test(positiveText)) {
        seen.add(t.calc);
        out.push({ calc: t.calc, reason: t.reason });
      }
    }
  }
  // Direct (non-freetext) trigger: any pregnancy with a gestational age on
  // record should get the BANC-Plus schedule check surfaced, not just when
  // the word "antenatal" happens to appear somewhere.
  if (patient.intake.gestationalAge && !seen.has('ancschedule')) {
    out.push({ calc: 'ancschedule', reason: 'gestational age on record' });
  }
  return out;
}
