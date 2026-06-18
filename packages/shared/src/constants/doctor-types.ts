import type { DoctorType } from '../types/user.types.js';

export interface DoctorTypeInfo {
  type: DoctorType;
  label: string;
  description: string;
  icon: string;
  specializations?: string[];
}

export const DOCTOR_TYPE_INFO: Record<DoctorType, DoctorTypeInfo> = {
  GP: {
    type: 'GP',
    label: 'General Practitioner',
    description: 'Family doctor for general health needs',
    icon: 'doctor',
    specializations: [],
  },
  SPECIALIST: {
    type: 'SPECIALIST',
    label: 'Specialist',
    description: 'Specialist in a specific medical field',
    icon: 'medical-services',
    specializations: [
      'Cardiologist',
      'Dermatologist',
      'Endocrinologist',
      'Gastroenterologist',
      'Gynaecologist',
      'Haematologist',
      'Infectious Disease',
      'Internal Medicine',
      'Nephrologist',
      'Neurologist',
      'Obstetrician',
      'Oncologist',
      'Ophthalmologist',
      'Orthopaedic Surgeon',
      'Paediatrician',
      'Psychiatrist',
      'Pulmonologist',
      'Radiologist',
      'Rheumatologist',
      'Urologist',
    ],
  },
  ALLIED_HEALTH: {
    type: 'ALLIED_HEALTH',
    label: 'Allied Health',
    description: 'Physiotherapist, Dietitian, Occupational Therapist, etc.',
    icon: 'healing',
    specializations: [
      'Physiotherapist',
      'Occupational Therapist',
      'Dietitian',
      'Speech Therapist',
      'Audiologist',
      'Optometrist',
      'Podiatrist',
      'Psychologist',
      'Social Worker',
      'Radiographer',
      'Biokinetcist',
    ],
  },
  TRAVELLING: {
    type: 'TRAVELLING',
    label: 'Travelling Doctor',
    description: 'Mobile doctor who comes to you',
    icon: 'local-hospital',
    specializations: [],
  },
};

export const ALLIED_HEALTH_TYPES: string[] = DOCTOR_TYPE_INFO.ALLIED_HEALTH.specializations ?? [];
export const SPECIALIST_TYPES: string[] = DOCTOR_TYPE_INFO.SPECIALIST.specializations ?? [];
