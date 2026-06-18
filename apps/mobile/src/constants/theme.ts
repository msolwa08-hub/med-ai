import { MD3LightTheme, configureFonts } from 'react-native-paper';

export const COLORS = {
  primary: '#1A3A6B',
  primaryLight: '#2E5BA8',
  primaryDark: '#0F2347',
  secondary: '#2E8B57',
  secondaryLight: '#3CB371',
  secondaryDark: '#1F5E3A',
  accent: '#F4A460',
  accentSA: '#007A4D',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceVariant: '#EEF2F7',
  error: '#DC3545',
  warning: '#FFC107',
  success: '#28A745',
  info: '#17A2B8',
  text: '#1A1A2E',
  textSecondary: '#6C757D',
  textLight: '#ADB5BD',
  border: '#DEE2E6',
  divider: '#E9ECEF',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.5)',
  // SA Flag colors
  saGreen: '#007A4D',
  saGold: '#FFB612',
  saBlack: '#000000',
  saRed: '#DE3831',
  saBlue: '#002395',
  saWhite: '#FFFFFF',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const FONT_SIZE = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 24,
  xxxl: 32,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: COLORS.primary,
    secondary: COLORS.secondary,
    background: COLORS.background,
    surface: COLORS.surface,
    error: COLORS.error,
  },
};
