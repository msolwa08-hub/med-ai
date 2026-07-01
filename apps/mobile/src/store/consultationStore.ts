import { create } from 'zustand';
import { consultationApi, patientApi, aiHistoryApi } from '../api/endpoints';

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
  loadConsultations: (patientId?: string) => Promise<void>;
  setCurrentConsultation: (consultation: Consultation) => void;
  addOptimisticMessage: (content: string) => void;
  clearError: () => void;
  reset: () => void;
}

// ─── API shapes (envelope: { success, data }) ────────────────────────────────

/** Response body of POST /ai-history/start and /ai-history/continue. */
interface AiHistoryTurn {
  message: string;
  isComplete: boolean;
  literacyLevel?: string;
  redFlagDetected?: boolean;
  suggestedFollowUp?: string;
}

/** Item shape from GET /patients/me/consultations. */
interface ApiConsultationSummary {
  id: string;
  status: string;
  consultationType?: string;
  startedAt: string;
  completedAt?: string | null;
  doctor?: {
    id?: string;
    firstName: string;
    lastName: string;
    doctorType?: string;
  } | null;
}

/** Map the API's UPPERCASE consultation status to the app's lowercase union. */
function mapStatus(status: string): Consultation['status'] {
  switch (status) {
    case 'HISTORY_TAKING':
      return 'history_taking';
    case 'DOCTOR_REVIEW':
      return 'doctor_reviewing';
    case 'EXAMINATION':
      return 'examination';
    case 'COMPLETED':
    case 'CANCELLED':
      return 'completed';
    default:
      return 'history_taking';
  }
}

function apiError(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: { error?: string; message?: string } } })
    ?.response?.data;
  return data?.error || data?.message || fallback;
}

function aiMessageFromTurn(turn: AiHistoryTurn): Message {
  return {
    id: `ai-${Date.now()}`,
    role: 'ai',
    content: turn.message,
    timestamp: new Date().toISOString(),
  };
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

  // patientId is kept for backwards compatibility with callers — the API is
  // me-scoped, so consultationApi.create derives the patient from the token.
  startConsultation: async (_patientId: string, language: string) => {
    set({ isLoading: true, error: null, messages: [] });
    try {
      const createRes = await consultationApi.create({ language });
      const { consultationId, status } = createRes.data.data as {
        consultationId: string;
        status: string;
      };

      const now = new Date().toISOString();
      const consultation: Consultation = {
        id: consultationId,
        patientId: _patientId,
        language,
        status: mapStatus(status),
        createdAt: now,
        updatedAt: now,
      };

      // Start the AI history-taking session; the greeting comes back directly.
      const startRes = await aiHistoryApi.start(consultationId, language);
      const turn = startRes.data.data as AiHistoryTurn;

      set({
        currentConsultation: consultation,
        messages: [aiMessageFromTurn(turn)],
        isLoading: false,
        selectedLanguage: language,
      });
      return consultation;
    } catch (error: unknown) {
      set({ isLoading: false, error: apiError(error, 'Failed to start consultation') });
      throw error;
    }
  },

  sendMessage: async (content: string) => {
    const { currentConsultation } = get();
    if (!currentConsultation) return;

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
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
      const response = await aiHistoryApi.continue(currentConsultation.id, content);
      const turn = response.data.data as AiHistoryTurn;

      set((state) => ({
        messages: [...state.messages.filter((m) => !m.isLoading), aiMessageFromTurn(turn)],
        isSendingMessage: false,
        currentConsultation: state.currentConsultation
          ? {
              ...state.currentConsultation,
              status: turn.isComplete
                ? 'history_complete'
                : state.currentConsultation.status,
            }
          : null,
      }));
    } catch (error: unknown) {
      set((state) => ({
        messages: state.messages.filter((m) => !m.isLoading),
        isSendingMessage: false,
        error: apiError(error, 'Failed to send message'),
      }));
    }
  },

  loadMessages: async (consultationId: string) => {
    const { currentConsultation, messages, selectedLanguage } = get();
    // The API has no raw-transcript endpoint; the conversation lives in this
    // store. If we already hold this consultation's chat, keep it as-is.
    if (currentConsultation?.id === consultationId && messages.length > 0) {
      return;
    }
    try {
      // Otherwise (re)start the AI session to obtain a fresh greeting.
      const response = await aiHistoryApi.start(consultationId, selectedLanguage);
      const turn = response.data.data as AiHistoryTurn;
      set({ messages: [aiMessageFromTurn(turn)] });
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  },

  completeHistory: async () => {
    const { currentConsultation } = get();
    if (!currentConsultation) return;

    set({ isLoading: true });
    try {
      await aiHistoryApi.complete(currentConsultation.id);
      set((state) => ({
        currentConsultation: state.currentConsultation
          ? { ...state.currentConsultation, status: 'history_complete' }
          : null,
        isLoading: false,
      }));
    } catch (error: unknown) {
      set({ isLoading: false, error: apiError(error, 'Failed to complete history') });
    }
  },

  // patientId is accepted for backwards compatibility; the endpoint is me-scoped.
  loadConsultations: async (patientId?: string) => {
    set({ isLoading: true });
    try {
      const response = await patientApi.getConsultations();
      const { consultations } = response.data.data as {
        consultations: ApiConsultationSummary[];
      };

      const mapped: Consultation[] = (consultations ?? []).map((c) => ({
        id: c.id,
        patientId: patientId ?? '',
        language: get().selectedLanguage,
        status: mapStatus(c.status),
        createdAt: c.startedAt,
        updatedAt: c.completedAt ?? c.startedAt,
        doctor: c.doctor
          ? {
              id: c.doctor.id ?? '',
              firstName: c.doctor.firstName,
              lastName: c.doctor.lastName,
              doctorType: c.doctor.doctorType ?? '',
            }
          : undefined,
      }));

      set({ consultations: mapped, isLoading: false });
    } catch (error: unknown) {
      set({ isLoading: false, error: apiError(error, 'Failed to load consultations') });
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
