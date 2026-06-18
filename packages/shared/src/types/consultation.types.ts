import type { SALanguageCode } from './language.types.js';

export type ConsultationStatus =
  | 'PENDING'
  | 'HISTORY_TAKING'
  | 'DOCTOR_REVIEW'
  | 'EXAMINATION'
  | 'COMPLETED'
  | 'CANCELLED';

export type ConsultationType = 'IN_PERSON' | 'TELECONSULT' | 'HOME_VISIT';

export type ConsentType = 'VIEW_HISTORY' | 'TREATMENT' | 'DATA_PROCESSING' | 'RESEARCH';

export interface Consultation {
  id: string;
  patientId: string;
  doctorId?: string;
  startedAt: Date;
  completedAt?: Date;
  status: ConsultationStatus;
  consultationType: ConsultationType;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIHistoryMessage {
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
}

export interface StartHistoryRequest {
  consultationId: string;
  language: SALanguageCode;
}

export interface ContinueHistoryRequest {
  consultationId: string;
  patientMessage: string;
}

export interface AIHistoryResponse {
  message: string;
  isComplete: boolean;
  stage?: HistoryStage;
}

export type HistoryStage =
  | 'GREETING'
  | 'CHIEF_COMPLAINT'
  | 'HPI'
  | 'PAST_MEDICAL'
  | 'MEDICATIONS'
  | 'ALLERGIES'
  | 'FAMILY_HISTORY'
  | 'SOCIAL_HISTORY'
  | 'SYSTEMS_REVIEW'
  | 'COMPLETE';

export interface StructuredMedicalHistory {
  chiefComplaint: string;
  historyOfPresentIllness: {
    onset: string;
    duration: string;
    severity: string;
    character: string;
    radiation?: string;
    aggravatingFactors?: string;
    relievingFactors?: string;
    associatedSymptoms: string[];
    progressionOfSymptoms: string;
  };
  pastMedicalHistory: string[];
  medications: Medication[];
  allergies: Allergy[];
  familyHistory: string[];
  socialHistory: {
    smoking: string;
    alcohol: string;
    occupation: string;
    maritalStatus?: string;
    livingConditions?: string;
    dietExercise?: string;
  };
  reviewOfSystems: Partial<Record<BodySystem, string>>;
}

export type BodySystem =
  | 'cardiovascular'
  | 'respiratory'
  | 'gastrointestinal'
  | 'genitourinary'
  | 'musculoskeletal'
  | 'neurological'
  | 'endocrine'
  | 'dermatological'
  | 'psychiatric'
  | 'haematological';

export interface Medication {
  name: string;
  dose?: string;
  frequency?: string;
  indication?: string;
}

export interface Allergy {
  substance: string;
  reaction: string;
  severity?: 'MILD' | 'MODERATE' | 'SEVERE';
}

export interface DifferentialDiagnosis {
  id: string;
  consultationId: string;
  diagnoses: DiagnosisItem[];
  aiModel: string;
  generatedAt: Date;
  doctorReviewed: boolean;
  doctorSelectedDiagnosis?: string;
  doctorNotes?: string;
}

export interface DiagnosisItem {
  diagnosis: string;
  icdCode?: string;
  probability: 'HIGH' | 'MODERATE' | 'LOW';
  reasoning: string;
  saPrevalence?: string;
}

export interface ConsentRecord {
  id: string;
  patientId: string;
  doctorId?: string;
  consentType: ConsentType;
  granted: boolean;
  grantedAt: Date;
  expiresAt?: Date;
}

export interface VitalSigns {
  systolicBP?: number;
  diastolicBP?: number;
  heartRate?: number;
  respiratoryRate?: number;
  temperature?: number;
  spO2?: number;
  weightKg?: number;
  heightCm?: number;
  bmi?: number;
  painScore?: number;
}

export interface ManagementPlan {
  id: string;
  consultationId: string;
  diagnosis: string;
  medications: PrescribedMedication[];
  procedures?: string;
  referrals?: Referral[];
  followUpDays?: number;
  patientInstructions?: string;
  doctorNotes?: string;
  createdAt: Date;
}

export interface PrescribedMedication {
  name: string;
  dose: string;
  route: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface Referral {
  specialty: string;
  reason: string;
  urgency: 'ROUTINE' | 'URGENT' | 'EMERGENCY';
  notes?: string;
}
