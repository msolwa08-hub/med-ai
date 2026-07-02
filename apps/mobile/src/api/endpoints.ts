import { apiClient } from './client';

// ============================================================
// Payload types — mirror the API's zod schemas exactly
// ============================================================

export type OtpPurpose = 'LOGIN' | 'REGISTER' | 'RESET_PASSWORD' | 'HPCSA_VERIFY';

export interface AuthLoginPayload {
  email: string;
  password: string;
}

export interface AuthRegisterPatientPayload {
  email: string;
  phone: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  preferredLanguage?: string;
  idNumber?: string;
}

export interface AuthRegisterDoctorPayload {
  email: string;
  phone: string;
  password: string;
  firstName: string;
  lastName: string;
  hpcsaNumber: string;
  doctorType: 'GP' | 'SPECIALIST' | 'ALLIED_HEALTH' | 'TRAVELLING';
  specialization?: string;
}

export interface ConsultationPayload {
  language: string;
  consultationType?: 'IN_PERSON' | 'TELECONSULT' | 'HOME_VISIT';
  doctorId?: string;
  patientLat?: number;
  patientLng?: number;
}

export interface DoctorAvailabilityPayload {
  isAvailable: boolean;
  lat?: number;
  lng?: number;
  radius?: number;
}

export interface DoctorProfileUpdatePayload {
  bio?: string;
  consultationFee?: number;
  languages?: string[];
  specialization?: string;
  availabilityRadius?: number;
  qualifications?: Array<{ degree: string; institution: string; year: number }>;
  practiceNumber?: string;
}

export interface PatientProfileUpdatePayload {
  firstName?: string;
  lastName?: string;
  preferredLanguage?: string;
  emergencyContact?: { name: string; phone: string; relationship: string };
}

export interface ExaminationPayload {
  consultationId: string;
  vitalSigns: {
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
    heartRate?: number;
    respiratoryRate?: number;
    temperature?: number;
    oxygenSaturation?: number;
    weight?: number;
    height?: number;
    painScore?: number;
  };
  generalExamination: {
    generalAppearance?: string;
    handsNails?: string;
    headNeck?: string;
    jvp?: string;
    lymphNodes?: string;
  };
  systemicExamination: {
    cardiovascular?: string;
    respiratory?: string;
    abdominal?: string;
    neurological?: string;
    msk?: string;
    skin?: string;
  };
}

export interface ManagementPayload {
  consultationId: string;
  diagnosis: string;
  medications: Array<{
    name: string;
    dose: string;
    frequency: string;
    duration?: string;
    route?: string;
    notes?: string;
  }>;
  procedures?: string;
  referrals?: Array<{
    specialty: string;
    reason: string;
    urgency: 'ROUTINE' | 'URGENT' | 'EMERGENCY';
    facility?: string;
  }>;
  followUpDays?: number;
  patientInstructions?: string;
}

// ============================================================
// Auth
// ============================================================

export const authApi = {
  sendOtp: (phone: string, purpose: OtpPurpose = 'LOGIN') =>
    apiClient.post('/auth/send-otp', { phone, purpose }),

  verifyOtp: (phone: string, code: string, purpose: OtpPurpose = 'LOGIN') =>
    apiClient.post('/auth/verify-otp', { phone, code, purpose }),

  login: (payload: AuthLoginPayload) =>
    apiClient.post('/auth/login', payload),

  registerPatient: (payload: AuthRegisterPatientPayload) =>
    apiClient.post('/auth/register', { ...payload, role: 'PATIENT' }),

  registerDoctor: (payload: AuthRegisterDoctorPayload) =>
    apiClient.post('/auth/register', { ...payload, role: 'DOCTOR' }),

  refreshToken: (refreshToken: string) =>
    apiClient.post('/auth/refresh', { refreshToken }),

  logout: () => apiClient.post('/auth/logout'),

  getMe: () => apiClient.get('/auth/me'),

  forgotPassword: (phone: string) =>
    apiClient.post('/auth/forgot-password', { phone }),

  resetPassword: (phone: string, otp: string, newPassword: string) =>
    apiClient.post('/auth/reset-password', { phone, otp, newPassword }),
};

// ============================================================
// Patients (all "me"-scoped on the API)
// ============================================================

export const patientApi = {
  getProfile: () => apiClient.get('/patients/me'),

  updateProfile: (data: PatientProfileUpdatePayload) =>
    apiClient.put('/patients/me', data),

  getConsultations: () => apiClient.get('/patients/me/consultations'),

  getConsultation: (consultationId: string) =>
    apiClient.get(`/consultations/${consultationId}`),

  getConsentList: () => apiClient.get('/patients/me/consents'),

  grantConsent: (doctorId: string, consentType?: string) =>
    apiClient.post('/patients/me/consents', { doctorId, consentType }),

  revokeConsent: (doctorId: string) =>
    apiClient.delete(`/patients/me/consents/${doctorId}`),
};

// ============================================================
// Doctors
// ============================================================

export const doctorApi = {
  getMyProfile: () => apiClient.get('/doctors/me'),

  updateMyProfile: (data: DoctorProfileUpdatePayload) =>
    apiClient.put('/doctors/me', data),

  getPublicProfile: (doctorId: string) =>
    apiClient.get(`/doctors/${doctorId}/profile`),

  getHpcsaStatus: () => apiClient.get('/hpcsa/status'),

  verifyHpcsa: (hpcsaNumber?: string) =>
    apiClient.post('/hpcsa/verify', hpcsaNumber ? { hpcsaNumber } : {}),

  setAvailability: (payload: DoctorAvailabilityPayload) =>
    apiClient.put('/doctors/availability', payload),

  getNearbyDoctors: (
    lat: number,
    lng: number,
    doctorType?: string,
    radiusKm?: number,
    language?: string
  ) =>
    apiClient.get('/doctors/nearby', {
      params: { lat, lng, doctorType, radiusKm: radiusKm ?? 10, language },
    }),

  getPatientQueue: () => apiClient.get('/doctors/me/patient-queue'),

  acceptPatient: (consultationId: string) =>
    apiClient.post('/doctors/me/accept-patient', { consultationId }),

  declinePatient: (consultationId: string, reason?: string) =>
    apiClient.post('/doctors/me/decline-patient', { consultationId, reason }),

  getFullRecord: (consultationId: string) =>
    apiClient.get(`/consultations/${consultationId}/full-record`),
};

// ============================================================
// Consultations & clinical workflow
// ============================================================

export const consultationApi = {
  create: (payload: ConsultationPayload) =>
    apiClient.post('/consultations', payload),

  getById: (consultationId: string) =>
    apiClient.get(`/consultations/${consultationId}`),

  updateStatus: (
    consultationId: string,
    status: 'HISTORY_TAKING' | 'DOCTOR_REVIEW' | 'EXAMINATION' | 'COMPLETED' | 'CANCELLED'
  ) => apiClient.put(`/consultations/${consultationId}/status`, { status }),

  saveExamination: (payload: ExaminationPayload) =>
    apiClient.post(`/consultations/${payload.consultationId}/examination`, {
      vitalSigns: payload.vitalSigns,
      generalExamination: payload.generalExamination,
      systemicExamination: payload.systemicExamination,
    }),

  getExamination: (consultationId: string) =>
    apiClient.get(`/consultations/${consultationId}/examination`),

  saveManagement: (payload: ManagementPayload) =>
    apiClient.post(`/consultations/${payload.consultationId}/management`, {
      diagnosis: payload.diagnosis,
      medications: payload.medications,
      procedures: payload.procedures,
      referrals: payload.referrals,
      followUpDays: payload.followUpDays,
      patientInstructions: payload.patientInstructions,
    }),

  getManagement: (consultationId: string) =>
    apiClient.get(`/consultations/${consultationId}/management`),

  getFullRecord: (consultationId: string) =>
    apiClient.get(`/consultations/${consultationId}/full-record`),

  completeConsultation: (consultationId: string) =>
    apiClient.post(`/consultations/${consultationId}/complete`),
};

// ============================================================
// AI history-taking (general medicine)
// ============================================================

export const aiHistoryApi = {
  start: (consultationId: string, language?: string, practiceName?: string) =>
    apiClient.post('/ai-history/start', { consultationId, language, practiceName }),

  continue: (consultationId: string, patientMessage: string) =>
    apiClient.post('/ai-history/continue', { consultationId, patientMessage }),

  complete: (consultationId: string) =>
    apiClient.post('/ai-history/complete', { consultationId }),

  getHistory: (consultationId: string) =>
    apiClient.get(`/ai-history/${consultationId}`),

  confirm: (consultationId: string, notes?: string, corrections?: string) =>
    apiClient.post(`/ai-history/${consultationId}/confirm`, { notes, corrections }),
};

// ============================================================
// Diagnosis (AI differential — doctor review)
// ============================================================

export const diagnosisApi = {
  get: (consultationId: string) =>
    apiClient.get(`/diagnosis/${consultationId}`),

  select: (
    consultationId: string,
    selectedDiagnosis: string,
    opts?: { icd10Code?: string; notes?: string; additionalDiagnoses?: string[] }
  ) =>
    apiClient.put(`/diagnosis/${consultationId}/select`, {
      selectedDiagnosis,
      icd10Code: opts?.icd10Code,
      notes: opts?.notes,
      additionalDiagnoses: opts?.additionalDiagnoses,
    }),
};

// ============================================================
// Investigations
// ============================================================

export const investigationsApi = {
  create: (payload: {
    consultationId: string;
    type: 'LAB' | 'RADIOLOGY' | 'ECG' | 'OTHER';
    name: string;
    urgency?: 'ROUTINE' | 'URGENT' | 'STAT';
    specialInstructions?: string;
  }) => apiClient.post('/investigations', payload),

  getForConsultation: (consultationId: string) =>
    apiClient.get(`/investigations/${consultationId}`),

  saveResult: (investigationId: string, result: string, resultDate?: string) =>
    apiClient.put(`/investigations/${investigationId}/result`, { result, resultDate }),
};

// ============================================================
// Prescriptions
// ============================================================

export const prescriptionsApi = {
  create: (payload: Record<string, unknown>) =>
    apiClient.post('/prescriptions', payload),

  getForConsultation: (consultationId: string) =>
    apiClient.get(`/prescriptions/consultation/${consultationId}`),

  getForPatient: (patientId: string) =>
    apiClient.get(`/prescriptions/patient/${patientId}`),

  getPdf: (prescriptionId: string) =>
    apiClient.get(`/prescriptions/${prescriptionId}/pdf`),

  cancel: (prescriptionId: string, reason?: string) =>
    apiClient.put(`/prescriptions/${prescriptionId}/cancel`, { reason }),
};

// ============================================================
// Labs
// ============================================================

export const labsApi = {
  getAccounts: () => apiClient.get('/labs/accounts'),

  linkAccount: (payload: { provider: string; accountNumber: string; idNumber?: string }) =>
    apiClient.post('/labs/accounts', payload),

  unlinkAccount: (accountId: string) =>
    apiClient.delete(`/labs/accounts/${accountId}`),

  sync: () => apiClient.post('/labs/sync', {}),

  getResults: () => apiClient.get('/labs/results'),

  getConsultationResults: (consultationId: string) =>
    apiClient.get(`/labs/results/consultation/${consultationId}`),
};

// ============================================================
// Documents (referral letters, sick notes, STG learning points)
// ============================================================

export interface ReferralLetterPayload {
  patientName: string;
  patientAge: string;
  patientGender: string;
  patientIdNumber?: string;
  patientMedicalAid?: string;
  referringDoctorName: string;
  referringDoctorHpcsa: string;
  referringPracticeName: string;
  referringPracticeAddress?: string;
  referringPracticePhone?: string;
  specialty: string;
  urgency: 'ROUTINE' | 'URGENT' | 'EMERGENCY';
  clinicalSummary: string;
  diagnosis: string;
  icd10Code?: string;
  reasonForReferral: string;
  currentMedications?: string;
  relevantInvestigations?: string;
  additionalNotes?: string;
}

export interface SickNotePayload {
  patientName: string;
  patientIdNumber?: string;
  patientDateOfBirth?: string;
  patientOccupation?: string;
  doctorName: string;
  doctorHpcsa: string;
  practiceName: string;
  practiceAddress?: string;
  diagnosisText: string;
  icd10Code?: string;
  dateOfConsultation: string;
  unfitFromDate: string;
  unfitToDate: string;
  daysOff: number;
  fitnessStatement?: string;
  additionalNotes?: string;
}

export interface LearningPointsPayload {
  conditionName: string;
  icd10Code: string;
  category: string;
  firstLineTreatment: unknown[];
  investigations: unknown[];
  redFlags?: string;
}

export interface EMLLookupPayload {
  medicineName: string;
  formulation?: string;
}

export const documentsApi = {
  generateReferralLetter: (payload: ReferralLetterPayload) =>
    apiClient.post('/doctor/documents/referral-letter', payload),

  generateSickNote: (payload: SickNotePayload) =>
    apiClient.post('/doctor/documents/sick-note', payload),

  getLearningPoints: (payload: LearningPointsPayload) =>
    apiClient.post('/stg/learning-points', payload),

  emlLookup: (payload: EMLLookupPayload) =>
    apiClient.post('/eml/lookup', payload),
};

// ============================================================
// Ultrasound AI (doctor)
// ============================================================

export const ultrasoundApi = {
  interpret: (payload: {
    consultationId: string;
    reportText: string;
    clinicalContext?: string;
    gestationalAge?: string;
    isPregnant?: boolean;
  }) => apiClient.post('/ultrasound/interpret', payload),

  getResults: (consultationId: string) =>
    apiClient.get(`/ultrasound/results/${consultationId}`),
};

// ============================================================
// O&G history-taking
// ============================================================

export const ogHistoryApi = {
  start: (payload: {
    consultationId: string;
    mode?: 'OBSTETRIC' | 'GYNAECOLOGICAL' | 'UNKNOWN';
    language?: string;
    chiefComplaint?: string;
    isPregnant?: boolean;
    gestationalAge?: string;
    gravida?: number;
    para?: number;
  }) => apiClient.post('/og-history/start', payload),

  continue: (consultationId: string, patientMessage: string) =>
    apiClient.post('/og-history/continue', { consultationId, patientMessage }),

  complete: (consultationId: string) =>
    apiClient.post('/og-history/complete', { consultationId }),

  getHistory: (consultationId: string) =>
    apiClient.get(`/og-history/${consultationId}`),
};

// ============================================================
// Specialty history-taking (Internal, Paeds, Fam Med, Surgery, ENT)
// ============================================================

export type Department =
  | 'INTERNAL'
  | 'PAEDIATRICS'
  | 'FAMILY_MEDICINE'
  | 'SURGERY'
  | 'ENT'
  | 'PSYCHIATRY';

export type InternalSystem =
  | 'CARDIOVASCULAR'
  | 'RESPIRATORY'
  | 'GASTROINTESTINAL'
  | 'RENAL'
  | 'NEUROLOGY'
  | 'ENDOCRINE'
  | 'INFECTIOUS_DISEASES'
  | 'HAEMATOLOGY'
  | 'RHEUMATOLOGY'
  | 'GENERAL';

export const specialtyHistoryApi = {
  getDepartments: () => apiClient.get('/specialty-history/departments'),

  start: (payload: {
    consultationId: string;
    department: Department;
    language?: string;
    chiefComplaint?: string;
    system?: InternalSystem;
  }) => apiClient.post('/specialty-history/start', payload),

  continue: (consultationId: string, patientMessage: string) =>
    apiClient.post('/specialty-history/continue', { consultationId, patientMessage }),

  complete: (consultationId: string) =>
    apiClient.post('/specialty-history/complete', { consultationId }),

  getHistory: (consultationId: string) =>
    apiClient.get(`/specialty-history/${consultationId}`),
};

// ============================================================
// Profile setup (AI-guided onboarding)
// ============================================================

export const profileSetupApi = {
  start: (language?: string) =>
    apiClient.post('/profile-setup/start', { language: language || 'en' }),

  continue: (userMessage: string) =>
    apiClient.post('/profile-setup/continue', { userMessage }),

  complete: () => apiClient.post('/profile-setup/complete', {}),
};

// ============================================================
// Antenatal follow-up (returning ANC visits — separate from first O&G visit)
// ============================================================

export const antenatalFollowUpApi = {
  start: (consultationId: string, language?: string) =>
    apiClient.post('/antenatal-followup/start', { consultationId, language }),

  continue: (consultationId: string, patientMessage: string) =>
    apiClient.post('/antenatal-followup/continue', { consultationId, patientMessage }),

  complete: (consultationId: string) =>
    apiClient.post('/antenatal-followup/complete', { consultationId }),

  getHistory: (consultationId: string) =>
    apiClient.get(`/antenatal-followup/${consultationId}`),
};

// ============================================================
// Payments
// ============================================================

export const paymentsApi = {
  initiate: (consultationId: string) =>
    apiClient.post('/payments/initiate', { consultationId }),

  getStatus: (consultationId: string) =>
    apiClient.get(`/payments/status/${consultationId}`),

  markCash: (consultationId: string) =>
    apiClient.post(`/payments/cash/${consultationId}`, {}),
};

// ============================================================
// Clinical reasoning (doctor — STG-linked decision support)
// ============================================================

export const clinicalReasoningApi = {
  generate: (consultationId: string) =>
    apiClient.post(`/clinical-reasoning/${consultationId}`, {}),
};

// ============================================================
// Emergency profile
// ============================================================

export const emergencyApi = {
  getMyProfile: () => apiClient.get('/emergency/my-profile'),

  updateMyProfile: (data: Record<string, unknown>) =>
    apiClient.put('/emergency/my-profile', data),

  generateQr: () => apiClient.post('/emergency/generate-qr', {}),

  syncFromConsultation: (consultationId: string) =>
    apiClient.post(`/emergency/sync-from-consultation/${consultationId}`),
};

// ============================================================
// Notifications
// ============================================================

export const notificationsApi = {
  registerToken: (token: string) =>
    apiClient.post('/notifications/register-token', { token }),

  clearToken: () => apiClient.delete('/notifications/token'),
};

// ============================================================
// Uploads
// ============================================================

export const uploadApi = {
  profilePhoto: (imageBase64: string, mimeType = 'image/jpeg') =>
    apiClient.post('/upload/profile-photo', { imageBase64, mimeType }),
};

// ============================================================
// Reviews
// ============================================================

export const reviewsApi = {
  create: (payload: { consultationId: string; rating: number; comment?: string }) =>
    apiClient.post('/reviews', payload),

  getForDoctor: (doctorId: string) =>
    apiClient.get(`/reviews/doctor/${doctorId}`),
};

// ============================================================
// STG (Standard Treatment Guidelines)
// ============================================================

export const stgApi = {
  search: (query: string, category?: string) =>
    apiClient.get('/stg/search', { params: { q: query, category } }),

  icd10Search: (query: string) =>
    apiClient.get('/stg/icd10/search', { params: { q: query } }),

  icd10ByCode: (code: string) => apiClient.get(`/stg/icd10/${code}`),

  getAdapted: (payload: Record<string, unknown>) =>
    apiClient.post('/stg/adapted', payload),

  getCategories: () => apiClient.get('/stg/categories'),
};
