import { apiClient } from './client';

// --- Types ---
export interface AuthLoginPayload {
  phone?: string;
  email?: string;
  password?: string;
  otp?: string;
}

export interface AuthRegisterPatientPayload {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  idNumber: string;
  phone: string;
  email?: string;
  preferredLanguage: string;
}

export interface AuthRegisterDoctorPayload {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  hpcsaNumber: string;
  doctorType: 'gp' | 'specialist' | 'allied_health' | 'travelling';
  specialization?: string;
  languagesSpoken: string[];
  consultationFee: number;
  practiceName?: string;
  practiceAddress?: string;
}

export interface ConsultationPayload {
  patientId: string;
  language: string;
  doctorId?: string;
}

export interface MessagePayload {
  consultationId: string;
  content: string;
  role: 'patient' | 'doctor';
}

export interface DoctorAvailabilityPayload {
  isOnline: boolean;
  latitude?: number;
  longitude?: number;
  radius?: number;
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
  };
  generalExamination?: string;
  systemicExamination?: Record<string, string>;
}

export interface DiagnosisPayload {
  consultationId: string;
  primaryDiagnosis: string;
  icd10Code?: string;
  differentialDiagnoses?: string[];
  doctorNotes?: string;
}

export interface ManagementPayload {
  consultationId: string;
  prescriptions?: Array<{
    medication: string;
    dose: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }>;
  investigations?: string[];
  referrals?: string[];
  followUpDate?: string;
  patientInstructions?: string;
}

// --- Auth Endpoints ---
export const authApi = {
  sendOtp: (phone: string) =>
    apiClient.post('/auth/otp/send', { phone }),

  verifyOtp: (phone: string, otp: string) =>
    apiClient.post('/auth/otp/verify', { phone, otp }),

  login: (payload: AuthLoginPayload) =>
    apiClient.post('/auth/login', payload),

  registerPatient: (payload: AuthRegisterPatientPayload) =>
    apiClient.post('/auth/register/patient', payload),

  registerDoctor: (payload: AuthRegisterDoctorPayload) =>
    apiClient.post('/auth/register/doctor', payload),

  refreshToken: (refreshToken: string) =>
    apiClient.post('/auth/refresh', { refresh_token: refreshToken }),

  logout: () => apiClient.post('/auth/logout'),

  getMe: () => apiClient.get('/auth/me'),

  forgotPassword: (phone: string) =>
    apiClient.post('/auth/forgot-password', { phone }),

  resetPassword: (phone: string, otp: string, newPassword: string) =>
    apiClient.post('/auth/reset-password', { phone, otp, newPassword }),
};

// --- Patient Endpoints ---
export const patientApi = {
  getProfile: (patientId: string) =>
    apiClient.get(`/patients/${patientId}`),

  updateProfile: (patientId: string, data: Partial<AuthRegisterPatientPayload>) =>
    apiClient.patch(`/patients/${patientId}`, data),

  getConsultations: (patientId: string) =>
    apiClient.get(`/patients/${patientId}/consultations`),

  getConsultation: (consultationId: string) =>
    apiClient.get(`/consultations/${consultationId}`),

  getConsentList: (patientId: string) =>
    apiClient.get(`/patients/${patientId}/consents`),

  grantConsent: (patientId: string, doctorId: string) =>
    apiClient.post(`/patients/${patientId}/consents`, { doctorId }),

  revokeConsent: (patientId: string, doctorId: string) =>
    apiClient.delete(`/patients/${patientId}/consents/${doctorId}`),
};

// --- Doctor Endpoints ---
export const doctorApi = {
  getProfile: (doctorId: string) =>
    apiClient.get(`/doctors/${doctorId}`),

  updateProfile: (doctorId: string, data: Partial<AuthRegisterDoctorPayload>) =>
    apiClient.patch(`/doctors/${doctorId}`, data),

  getHpcsaStatus: (doctorId: string) =>
    apiClient.get(`/doctors/${doctorId}/hpcsa-status`),

  setAvailability: (doctorId: string, payload: DoctorAvailabilityPayload) =>
    apiClient.post(`/doctors/${doctorId}/availability`, payload),

  getNearbyDoctors: (latitude: number, longitude: number, type?: string, radius?: number) =>
    apiClient.get('/doctors/nearby', {
      params: { latitude, longitude, type, radius: radius || 10 },
    }),

  getPatientQueue: (_doctorId: string) =>
    apiClient.get('/doctors/me/patient-queue'),

  acceptPatient: (doctorId: string, consultationId: string) =>
    apiClient.post(`/doctors/${doctorId}/accept-patient`, { consultationId }),

  declinePatient: (doctorId: string, consultationId: string) =>
    apiClient.post(`/doctors/${doctorId}/decline-patient`, { consultationId }),

  getPatientRecords: (doctorId: string, patientId: string) =>
    apiClient.get(`/doctors/${doctorId}/patients/${patientId}/records`),
};

// --- Consultation Endpoints ---
export const consultationApi = {
  create: (payload: ConsultationPayload) =>
    apiClient.post('/consultations', payload),

  getById: (consultationId: string) =>
    apiClient.get(`/consultations/${consultationId}`),

  sendMessage: (payload: MessagePayload) =>
    apiClient.post(`/consultations/${payload.consultationId}/messages`, {
      content: payload.content,
      role: payload.role,
    }),

  getMessages: (consultationId: string) =>
    apiClient.get(`/consultations/${consultationId}/messages`),

  completeHistory: (consultationId: string) =>
    apiClient.post(`/consultations/${consultationId}/complete-history`),

  getAIHistory: (consultationId: string) =>
    apiClient.get(`/consultations/${consultationId}/ai-history`),

  confirmHistory: (consultationId: string, doctorNotes?: string) =>
    apiClient.post(`/consultations/${consultationId}/confirm-history`, { doctorNotes }),

  saveExamination: (payload: ExaminationPayload) =>
    apiClient.post(`/consultations/${payload.consultationId}/examination`, payload),

  saveDiagnosis: (payload: DiagnosisPayload) =>
    apiClient.post(`/consultations/${payload.consultationId}/diagnosis`, payload),

  saveManagement: (payload: ManagementPayload) =>
    apiClient.post(`/consultations/${payload.consultationId}/management`, payload),

  completeConsultation: (consultationId: string) =>
    apiClient.post(`/consultations/${consultationId}/complete`),

  uploadDocument: (consultationId: string, formData: FormData) =>
    apiClient.post(`/consultations/${consultationId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// --- AI Endpoints ---
export const aiApi = {
  chat: (consultationId: string, message: string, language: string) =>
    apiClient.post('/ai/chat', { consultationId, message, language }),

  translateText: (text: string, fromLanguage: string, toLanguage: string) =>
    apiClient.post('/ai/translate', { text, fromLanguage, toLanguage }),

  getDifferentialDiagnoses: (consultationId: string) =>
    apiClient.get(`/ai/differential-diagnoses/${consultationId}`),
};

// --- Documents Endpoints (referral letters, sick notes) ---

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

// --- Ultrasound Endpoints ---
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

// --- O&G History Endpoints ---
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

// --- Profile Setup Endpoints ---
export const profileSetupApi = {
  start: (language?: string) =>
    apiClient.post('/profile-setup/start', { language: language || 'en' }),

  continue: (userMessage: string) =>
    apiClient.post('/profile-setup/continue', { userMessage }),

  complete: () =>
    apiClient.post('/profile-setup/complete'),
};
