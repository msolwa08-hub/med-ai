import { create } from 'zustand';
import { consultationApi, aiApi } from '../api/endpoints';

export interface Message {
  id: string;
  role: 'patient' | 'ai' | 'doctor';
  content: string;
  timestamp: string;
  isLoading?: boolean;
}

export interface AIHistory {
  chiefComplaint?: string;
  historyOfPresentIllness?: string;
  pastMedicalHistory?: string;
  medications?: string[];
  allergies?: string[];
  familyHistory?: string;
  socialHistory?: string;
  reviewOfSystems?: Record<string, string>;
  differentialDiagnoses?: Array<{
    diagnosis: string;
    probability: number;
    reasoning: string;
  }>;
}

export interface VitalSigns {
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  respiratoryRate?: number;
  temperature?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
  bmi?: number;
}

export interface Consultation {
  id: string;
  patientId: string;
  doctorId?: string;
  language: string;
  status:
    | 'history_taking'
    | 'history_complete'
    | 'doctor_reviewing'
    | 'examination'
    | 'diagnosis'
    | 'management'
    | 'completed';
  aiHistory?: AIHistory;
  messages?: Message[];
  vitalSigns?: VitalSigns;
  examination?: string;
  diagnosis?: string;
  icd10Code?: string;
  management?: {
    prescriptions?: Array<{
      medication: string;
      dose: string;
      frequency: string;
      duration: string;
    }>;
    investigations?: string[];
    referrals?: string[];
    followUpDate?: string;
    patientInstructions?: string;
  };
  createdAt: string;
  updatedAt: string;
  doctor?: {
    id: string;
    firstName: string;
    lastName: string;
    doctorType: string;
    profileImage?: string;
  };
}

interface ConsultationState {
  currentConsultation: Consultation | null;
  consultations: Consultation[];
  messages: Message[];
  isLoading: boolean;
  isSendingMessage: boolean;
  error: string | null;
  selectedLanguage: string;

  setSelectedLanguage: (lang: string) => void;
  startConsultation: (patientId: string, language: string) => Promise<Consultation>;
  sendMessage: (content: string) => Promise<void>;
  loadMessages: (consultationId: string) => Promise<void>;
  completeHistory: () => Promise<void>;
  loadConsultations: (patientId: string) => Promise<void>;
  setCurrentConsultation: (consultation: Consultation) => void;
  addOptimisticMessage: (content: string) => void;
  clearError: () => void;
  reset: () => void;
}

export const useConsultationStore = create<ConsultationState>((set, get) => ({
  currentConsultation: null,
  consultations: [],
  messages: [],
  isLoading: false,
  isSendingMessage: false,
  error: null,
  selectedLanguage: 'en',

  setSelectedLanguage: (lang: string) => set({ selectedLanguage: lang }),

  startConsultation: async (patientId: string, language: string) => {
    set({ isLoading: true, error: null, messages: [] });
    try {
      const response = await consultationApi.create({ patientId, language });
      const consultation: Consultation = response.data;
      set({
        currentConsultation: consultation,
        isLoading: false,
        selectedLanguage: language,
      });
      await get().loadMessages(consultation.id);
      return consultation;
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to start consultation';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  sendMessage: async (content: string) => {
    const { currentConsultation, selectedLanguage } = get();
    if (!currentConsultation) return;

    const tempId = `temp-${Date.now()}`;
    const userMessage: Message = {
      id: tempId,
      role: 'patient',
      content,
      timestamp: new Date().toISOString(),
    };

    const aiLoadingMessage: Message = {
      id: `loading-${Date.now()}`,
      role: 'ai',
      content: '...',
      timestamp: new Date().toISOString(),
      isLoading: true,
    };

    set((state) => ({
      messages: [...state.messages, userMessage, aiLoadingMessage],
      isSendingMessage: true,
    }));

    try {
      const response = await aiApi.chat(
        currentConsultation.id,
        content,
        selectedLanguage
      );
      const { aiMessage, consultationStatus } = response.data;

      set((state) => ({
        messages: [
          ...state.messages.filter((m) => !m.isLoading),
          {
            id: aiMessage.id,
            role: 'ai',
            content: aiMessage.content,
            timestamp: aiMessage.timestamp,
          },
        ],
        isSendingMessage: false,
        currentConsultation: state.currentConsultation
          ? { ...state.currentConsultation, status: consultationStatus }
          : null,
      }));
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to send message';
      set((state) => ({
        messages: state.messages.filter((m) => !m.isLoading),
        isSendingMessage: false,
        error: message,
      }));
    }
  },

  loadMessages: async (consultationId: string) => {
    try {
      const response = await consultationApi.getMessages(consultationId);
      set({ messages: response.data });
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  },

  completeHistory: async () => {
    const { currentConsultation } = get();
    if (!currentConsultation) return;

    set({ isLoading: true });
    try {
      await consultationApi.completeHistory(currentConsultation.id);
      set((state) => ({
        currentConsultation: state.currentConsultation
          ? { ...state.currentConsultation, status: 'history_complete' }
          : null,
        isLoading: false,
      }));
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to complete history';
      set({ isLoading: false, error: message });
    }
  },

  loadConsultations: async (patientId: string) => {
    set({ isLoading: true });
    try {
      const { patientApi } = await import('../api/endpoints');
      const response = await patientApi.getConsultations(patientId);
      set({ consultations: response.data, isLoading: false });
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to load consultations';
      set({ isLoading: false, error: message });
    }
  },

  setCurrentConsultation: (consultation: Consultation) => {
    set({ currentConsultation: consultation });
  },

  addOptimisticMessage: (content: string) => {
    const message: Message = {
      id: `opt-${Date.now()}`,
      role: 'patient',
      content,
      timestamp: new Date().toISOString(),
    };
    set((state) => ({ messages: [...state.messages, message] }));
  },

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      currentConsultation: null,
      messages: [],
      isLoading: false,
      isSendingMessage: false,
      error: null,
    }),
}));
