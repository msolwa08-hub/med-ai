import type { UserRole, PreferredLanguage, ConsultationStatus, ConsultationType, HpcsaStatus, DoctorType } from '@prisma/client';

// ============================================================
// JWT Payload
// ============================================================

export interface JwtPayload {
  sub: string;        // userId
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: string;
  type: 'refresh';
  iat?: number;
  exp?: number;
}

// ============================================================
// Request augmentation
// ============================================================

declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtPayload;
  }
}

// ============================================================
// South African Languages
// ============================================================

export const SA_LANGUAGES = ['en', 'zu', 'xh', 'af', 'nso', 'tn', 'st', 'ts', 'ss', 've', 'nr'] as const;
export type SaLanguage = typeof SA_LANGUAGES[number];

export const SA_LANGUAGE_NAMES: Record<SaLanguage, string> = {
  en: 'English',
  zu: 'isiZulu',
  xh: 'isiXhosa',
  af: 'Afrikaans',
  nso: 'Sepedi (Northern Sotho)',
  tn: 'Setswana',
  st: 'Sesotho',
  ts: 'Xitsonga',
  ss: 'Siswati',
  ve: 'Tshivenda',
  nr: 'isiNdebele',
};

// ============================================================
// Medical History
// ============================================================

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
    associatedSymptoms?: string;
  };
  pastMedicalHistory: string;
  medications: string;
  allergies: string;
  familyHistory: string;
  socialHistory: string;
  systemsReview: string;
}

// ============================================================
// Differential Diagnosis
// ============================================================

export interface DiagnosisEntry {
  diagnosis: string;
  icdCode: string;
  probability: 'HIGH' | 'MEDIUM' | 'LOW';
  reasoning: string;
}

// ============================================================
// Conversation
// ============================================================

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// ============================================================
// Encrypted Field
// ============================================================

export interface EncryptedField {
  encryptedData: string;
  iv: string;
  authTag: string;
}

// ============================================================
// Vital Signs
// ============================================================

export interface VitalSigns {
  bloodPressure?: string;   // e.g. "120/80"
  heartRate?: number;       // bpm
  respiratoryRate?: number; // breaths/min
  temperature?: number;     // celsius
  spo2?: number;            // %
  weight?: number;          // kg
  height?: number;          // cm
  bmi?: number;
}

// ============================================================
// Medications
// ============================================================

export interface MedicationEntry {
  name: string;
  dose: string;
  frequency: string;
  duration?: string;
  route?: string;
  notes?: string;
}

// ============================================================
// Referral
// ============================================================

export interface ReferralEntry {
  specialty: string;
  reason: string;
  urgency: 'ROUTINE' | 'URGENT' | 'EMERGENCY';
  facility?: string;
}

// ============================================================
// Emergency Contact
// ============================================================

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

// ============================================================
// Qualification
// ============================================================

export interface Qualification {
  degree: string;
  institution: string;
  year: number;
}

// ============================================================
// Geolocation
// ============================================================

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface NearbyDoctor {
  id: string;
  firstName: string;
  lastName: string;
  doctorType: DoctorType;
  specialization?: string | null;
  rating: number;
  consultationFee?: number | null;
  distanceKm: number;
  isAvailable: boolean;
  languages: string[];
}

// ============================================================
// API Response types
// ============================================================

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// ============================================================
// Auth types
// ============================================================

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterPatientBody {
  email: string;
  phone: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  preferredLanguage?: SaLanguage;
  idNumber?: string;
}

export interface RegisterDoctorBody {
  email: string;
  phone: string;
  password: string;
  firstName: string;
  lastName: string;
  hpcsaNumber: string;
  doctorType: DoctorType;
  specialization?: string;
}

export interface LoginBody {
  email: string;
  password: string;
}
