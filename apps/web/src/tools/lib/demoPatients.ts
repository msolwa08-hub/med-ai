import type { DeptId } from '../config/departments';
import type { Patient } from '../fields/types';
import { newPatient } from './patient';

// ─── Example patients — "see it in action" ───────────────────────────────────
// One worked presentation per department so a newcomer can watch the whole loop
// (live differential → focused exam → do-now) without typing anything. These
// are PRESENTATION DATA ONLY — history + exam + vitals, no drug doses and no
// management: the engine generates all of that live, exactly as it would for a
// real patient. Every example is flagged `practice: true`.

interface Demo {
  intake: Partial<Patient['intake']>;
  history: Partial<Patient['history']>;
  assessment: Partial<Patient['assessment']>;
}

const DEMOS: Partial<Record<DeptId, Demo>> = {
  medicine: {
    intake: { name: 'Example — chest pain', age: '58', sex: 'M', allergies: 'NKDA' },
    history: {
      chiefComplaint: 'Central chest pain',
      hpi: '2 hours of crushing central chest pain radiating to the left arm, diaphoretic and nauseated. Came on at rest.',
      pmh: 'Hypertension, type 2 diabetes',
      medications: 'Amlodipine, metformin',
      socialHistory: '20 pack-year smoker',
    },
    assessment: { vitals: 'BP 148/92, HR 98, RR 20, SpO2 96% RA, afebrile', examination: 'Anxious and diaphoretic, chest clear, heart sounds normal, no murmurs' },
  },
  surgery: {
    intake: { name: 'Example — RIF pain', age: '24', sex: 'M', allergies: 'NKDA' },
    history: {
      chiefComplaint: 'Right iliac fossa pain',
      hpi: 'Central abdominal pain since yesterday that migrated to the right iliac fossa overnight, now sharp and constant. Anorexia and nausea, one vomit.',
      pmh: 'Nil',
      medications: 'None',
    },
    assessment: { vitals: 'BP 124/78, HR 96, Temp 37.8', examination: 'RIF tenderness with guarding and rebound, Rovsing positive, no mass' },
  },
  og: {
    intake: { name: 'Example — severe PET', age: '28', sex: 'F', allergies: 'NKDA' },
    history: {
      chiefComplaint: 'Headache + epigastric pain at 34 weeks',
      hpi: 'G2P1 at 34+2 weeks with a frontal headache, visual scotomata and epigastric pain since this morning. Known raised BP this pregnancy.',
      pmh: 'Chronic hypertension',
      medications: 'None',
    },
    assessment: { vitals: 'BP 168/112, HR 92', examination: 'Brisk reflexes with 2 beats of clonus, epigastric tenderness, urine 3+ protein, fundus 33 cm, FH 148 reactive' },
  },
  paeds: {
    intake: { name: 'Example — febrile child', age: '2 years', sex: 'M', allergies: 'NKDA' },
    history: {
      chiefComplaint: 'Fever, vomiting and irritability',
      hpi: '2-day fever with vomiting, now drowsy and very irritable, refusing feeds, one possible seizure at home. Weight 12 kg. Immunisations up to date.',
      pmh: 'Nil',
      medications: 'None',
    },
    assessment: { vitals: 'Temp 39.4, HR 150, RR 34, SpO2 97%', examination: 'Irritable, neck stiffness, Kernig positive, no rash, capillary refill 2s' },
  },
  icu: {
    intake: { name: 'Example — ventilated fever', age: '59', sex: 'M', allergies: 'NKDA' },
    history: {
      chiefComplaint: 'New fever + rising oxygen needs, ventilated day 4',
      hpi: 'Intubated and ventilated day 4 for community-acquired pneumonia. Today: new fever, purulent secretions and FiO2 climbing from 0.4 to 0.6.',
      pmh: 'COPD',
      medications: 'None charted for this scenario',
    },
    assessment: { vitals: 'Temp 38.7, HR 112, BP 104/60, SpO2 91% on FiO2 0.6', examination: 'Bronchial breathing right base, copious purulent ETT secretions' },
  },
  emergency: {
    intake: { name: 'Example — thunderclap headache', age: '47', sex: 'F', allergies: 'NKDA' },
    history: {
      chiefComplaint: 'Worst headache of life',
      hpi: 'Instantaneous occipital "thunderclap" headache peaking within seconds while straining, with vomiting and neck stiffness. Brief loss of consciousness.',
      pmh: 'Hypertension',
      medications: 'None',
    },
    assessment: { vitals: 'BP 178/100, HR 88', examination: 'Photophobia, neck stiffness, no focal deficit, fundi normal, GCS 15' },
  },
  psych: {
    intake: { name: 'Example — first psychosis', age: '24', sex: 'M', allergies: 'NKDA' },
    history: {
      chiefComplaint: 'Agitation and threatening behaviour',
      hpi: 'Brought by SAPS after threatening family with a knife. Responding to command auditory hallucinations, paranoid, no insight, refusing admission. 3 months of withdrawal and odd behaviour.',
      pmh: 'Nil known',
      socialHistory: 'Reported methamphetamine use',
      medications: 'None',
    },
    assessment: { vitals: 'BP 138/86, HR 104, Temp 37.0', examination: 'Agitated, thought-disordered, responding to unseen stimuli, oriented but guarded, lacks capacity' },
  },
  ortho: {
    intake: { name: 'Example — fall onto hip', age: '78', sex: 'F', allergies: 'NKDA' },
    history: {
      chiefComplaint: 'Left hip pain, unable to weight-bear after a fall',
      hpi: 'Mechanical fall at home onto the left side, immediate left hip pain and unable to stand or weight-bear since.',
      pmh: 'Osteoporosis, hypertension',
      medications: 'None charted for this scenario',
    },
    assessment: { vitals: 'BP 138/80, HR 92', examination: 'Left leg shortened and externally rotated, painful on any movement, neurovascularly intact distally' },
  },
  anaes: {
    intake: { name: 'Example — pre-op assessment', age: '72', sex: 'M', allergies: 'NKDA' },
    history: {
      chiefComplaint: 'Pre-operative assessment for emergency laparotomy',
      hpi: 'Booked for emergency laparotomy for perforated viscus. Breathless climbing one flight (poor functional capacity). Ischaemic heart disease, on warfarin for AF.',
      pmh: 'Ischaemic heart disease, atrial fibrillation, ex-smoker',
      medications: 'Warfarin, bisoprolol',
    },
    assessment: { vitals: 'BP 150/88, HR 96 irregular, SpO2 95% RA', examination: 'Mallampati III, mouth opening adequate, chest with bibasal crackles, irregularly irregular pulse' },
  },
};

/** A worked example patient for the department (presentation data only), or
 *  null if none is defined. Flagged practice:true so it's never mistaken for a
 *  real record. */
export function demoPatientFor(dept: DeptId): Patient | null {
  const d = DEMOS[dept];
  if (!d) return null;
  const base = newPatient(dept);
  return {
    ...base,
    practice: true,
    intake: { ...base.intake, ...d.intake },
    history: { ...base.history, ...d.history },
    assessment: { ...base.assessment, ...d.assessment },
  };
}

export function hasDemo(dept: DeptId): boolean {
  return !!DEMOS[dept];
}
