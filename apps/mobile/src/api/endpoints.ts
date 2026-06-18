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

  getPatientQueue: (doctorId: string) =>
    apiClient.get(`/doctors/${doctorId}/patient-queue`),

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
