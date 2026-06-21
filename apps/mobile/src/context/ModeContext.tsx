import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AppMode = 'INTERN' | 'GP';

interface ModeContextValue {
  mode: AppMode;
  setMode: (mode: AppMode) => Promise<void>;
  isLoading: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'medai_app_mode';
const DEFAULT_MODE: AppMode = 'GP';

// ─── Context ──────────────────────────────────────────────────────────────────

const ModeContext = createContext<ModeContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const ModeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [mode, setModeState] = useState<AppMode>(DEFAULT_MODE);
  const [isLoading, setIsLoading] = useState(true);

  // Load persisted mode on mount
  useEffect(() => {
    const loadMode = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === 'INTERN' || stored === 'GP') {
          setModeState(stored);
        }
      } catch {
        // AsyncStorage failure — fall back to default
      } finally {
        setIsLoading(false);
      }
    };

    loadMode();
  }, []);

  const setMode = useCallback(async (newMode: AppMode) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, newMode);
      setModeState(newMode);
    } catch {
      // Persist failed but update in-memory state so the UI still responds
      setModeState(newMode);
    }
  }, []);

  return (
    <ModeContext.Provider value={{ mode, setMode, isLoading }}>
      {children}
    </ModeContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useMode = (): ModeContextValue => {
  const ctx = useContext(ModeContext);
  if (!ctx) {
    throw new Error('useMode must be used within a ModeProvider');
  }
  return ctx;
};
