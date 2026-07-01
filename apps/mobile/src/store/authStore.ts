import { create } from 'zustand';
import { setAuthTokens, clearAuthTokens, getAccessToken } from '../api/client';
import { authApi } from '../api/endpoints';

// Roles and statuses use the API's enum casing throughout the app.
export type UserRole = 'PATIENT' | 'DOCTOR' | 'ADMIN';
export type HpcsaStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';

export interface PatientProfile {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  preferredLanguage?: string;
}

export interface DoctorProfile {
  id: string;
  firstName: string;
  lastName: string;
  hpcsaNumber?: string;
  hpcsaStatus?: HpcsaStatus;
  doctorType?: 'GP' | 'SPECIALIST' | 'ALLIED_HEALTH' | 'TRAVELLING';
  specialization?: string | null;
  isAvailable?: boolean;
  consultationFee?: number | null;
  practiceName?: string | null;
  profilePhoto?: string | null;
}

export interface User {
  id: string;
  email: string;
  phone?: string;
  role: UserRole;
  isVerified?: boolean;
  patient?: PatientProfile | null;
  doctor?: DoctorProfile | null;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  role: UserRole | null;
  login: (phone: string, otp: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  setRole: (role: UserRole) => void;
  clearError: () => void;
  loadUser: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

function errorMessage(error: unknown, fallback: string): string {
  const apiError = (error as { response?: { data?: { error?: string; message?: string } } })
    ?.response?.data;
  if (apiError?.error) return apiError.error;
  if (apiError?.message) return apiError.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

/** Fetch the full profile after obtaining tokens so the store has patient/doctor data. */
async function fetchFullUser(): Promise<User> {
  const response = await authApi.getMe();
  return response.data.data.user as User;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  role: null,

  login: async (phone: string, otp: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.verifyOtp(phone, otp, 'LOGIN');
      const { accessToken, refreshToken } = response.data.data;
      await setAuthTokens(accessToken, refreshToken);
      const user = await fetchFullUser();
      set({ user, isAuthenticated: true, role: user.role, isLoading: false, error: null });
    } catch (error: unknown) {
      set({ isLoading: false, error: errorMessage(error, 'Login failed') });
      throw error;
    }
  },

  loginWithEmail: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login({ email, password });
      const { accessToken, refreshToken } = response.data.data;
      await setAuthTokens(accessToken, refreshToken);
      const user = await fetchFullUser();
      set({ user, isAuthenticated: true, role: user.role, isLoading: false, error: null });
    } catch (error: unknown) {
      set({ isLoading: false, error: errorMessage(error, 'Login failed') });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authApi.logout();
    } catch {
      // Continue with local logout even if the API call fails
    } finally {
      await clearAuthTokens();
      set({ user: null, isAuthenticated: false, role: null, isLoading: false, error: null });
    }
  },

  setUser: (user: User) => {
    set({ user, isAuthenticated: true, role: user.role });
  },

  setRole: (role: UserRole) => {
    set({ role });
  },

  clearError: () => set({ error: null }),

  loadUser: async () => {
    // No stored token — nothing to rehydrate, skip the network round-trip
    const token = await getAccessToken().catch(() => null);
    if (!token) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    set({ isLoading: true });
    try {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 8000)
      );
      const user = await Promise.race([fetchFullUser(), timeout]);
      set({ user, isAuthenticated: true, role: user.role, isLoading: false });
    } catch {
      await clearAuthTokens();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateUser: (updates: Partial<User>) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : state.user,
    }));
  },
}));
