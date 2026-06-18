import { create } from 'zustand';
import { setAuthTokens, clearAuthTokens } from '../api/client';
import { authApi } from '../api/endpoints';

export type UserRole = 'patient' | 'doctor';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  role: UserRole;
  preferredLanguage?: string;
  profileImage?: string;
  // Doctor-specific
  hpcsaNumber?: string;
  hpcsaStatus?: 'pending' | 'verified' | 'rejected';
  doctorType?: 'gp' | 'specialist' | 'allied_health' | 'travelling';
  specialization?: string;
  isOnline?: boolean;
  consultationFee?: number;
  // Patient-specific
  idNumber?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
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

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  role: null,

  login: async (phone: string, otp: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.verifyOtp(phone, otp);
      const { access_token, refresh_token, user } = response.data;
      await setAuthTokens(access_token, refresh_token);
      set({
        user,
        isAuthenticated: true,
        role: user.role,
        isLoading: false,
        error: null,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  loginWithEmail: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login({ email, password });
      const { access_token, refresh_token, user } = response.data;
      await setAuthTokens(access_token, refresh_token);
      set({
        user,
        isAuthenticated: true,
        role: user.role,
        isLoading: false,
        error: null,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authApi.logout();
    } catch {
      // Continue with local logout even if API call fails
    } finally {
      await clearAuthTokens();
      set({
        user: null,
        isAuthenticated: false,
        role: null,
        isLoading: false,
        error: null,
      });
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
    set({ isLoading: true });
    try {
      const response = await authApi.getMe();
      const user = response.data;
      set({ user, isAuthenticated: true, role: user.role, isLoading: false });
    } catch {
      await clearAuthTokens();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateUser: (updates: Partial<User>) => {
    const currentUser = get().user;
    if (currentUser) {
      set({ user: { ...currentUser, ...updates } });
    }
  },
}));
