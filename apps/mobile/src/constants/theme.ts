import { MD3LightTheme } from 'react-native-paper';

// ─── Apple-inspired color system ────────────────────────────────────────────

export const COLORS = {
  // System backgrounds (iOS grouped style)
  systemBackground: '#FFFFFF',
  secondarySystemBackground: '#F2F2F7',
  systemGroupedBackground: '#F2F2F7',
  secondarySystemGroupedBackground: '#FFFFFF',

  // Labels
  label: '#000000',
  secondaryLabel: '#6C6C70',
  tertiaryLabel: '#AEAEB2',

  // Separators
  separator: '#E5E5EA',
  opaqueSeparator: '#C6C6C8',

  // iOS system palette
  systemBlue: '#007AFF',
  systemGreen: '#34C759',
  systemRed: '#FF3B30',
  systemOrange: '#FF9500',
  systemYellow: '#FFCC00',
  systemPurple: '#AF52DE',
  systemTeal: '#5AC8FA',
  systemGray: '#8E8E93',
  systemGray2: '#AEAEB2',
  systemGray3: '#C7C7CC',
  systemGray4: '#D1D1D6',
  systemGray5: '#E5E5EA',
  systemGray6: '#F2F2F7',

  // Brand — South African medical
  primary: '#1A3A6B',
  primaryLight: '#2E5BA8',
  primaryDark: '#0F2347',
  secondary: '#007A4D',
  secondaryLight: '#00A35A',
  secondaryDark: '#1F5E3A',

  // Medical semantics
  emergency: '#FF3B30',
  warning: '#FF9500',
  success: '#34C759',
  info: '#5AC8FA',
  critical: '#FF2D55',

  // Text
  text: '#000000',
  textSecondary: '#6C6C70',
  textTertiary: '#AEAEB2',
  textLight: '#AEAEB2',
  textInverted: '#FFFFFF',

  // Utility
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.4)',
  overlayLight: 'rgba(0,0,0,0.12)',

  // SA flag palette
  saGreen: '#007A4D',
  saGold: '#FFB612',
  saBlack: '#000000',
  saRed: '#DE3831',
  saBlue: '#002395',
  saWhite: '#FFFFFF',

  // Backwards-compat aliases used across existing screens
  background: '#F2F2F7',
  surface: '#FFFFFF',
  surfaceVariant: '#F2F2F7',
  error: '#FF3B30',
  border: '#E5E5EA',
  divider: '#E5E5EA',
  accent: '#FF9500',
  accentSA: '#007A4D',
};

// ─── SF Pro-inspired type scale ─────────────────────────────────────────────

export const TYPOGRAPHY = {
  largeTitle:  { fontSize: 34, fontWeight: '700' as const, lineHeight: 41, letterSpacing: 0.37 },
  title1:      { fontSize: 28, fontWeight: '700' as const, lineHeight: 34, letterSpacing: 0.36 },
  title2:      { fontSize: 22, fontWeight: '700' as const, lineHeight: 28, letterSpacing: 0.35 },
  title3:      { fontSize: 20, fontWeight: '600' as const, lineHeight: 25, letterSpacing: 0.38 },
  headline:    { fontSize: 17, fontWeight: '600' as const, lineHeight: 22, letterSpacing: -0.41 },
  body:        { fontSize: 17, fontWeight: '400' as const, lineHeight: 22, letterSpacing: -0.41 },
  callout:     { fontSize: 16, fontWeight: '400' as const, lineHeight: 21, letterSpacing: -0.32 },
  subheadline: { fontSize: 15, fontWeight: '400' as const, lineHeight: 20, letterSpacing: -0.24 },
  footnote:    { fontSize: 13, fontWeight: '400' as const, lineHeight: 18, letterSpacing: -0.08 },
  caption1:    { fontSize: 12, fontWeight: '400' as const, lineHeight: 16, letterSpacing: 0 },
  caption2:    { fontSize: 11, fontWeight: '400' as const, lineHeight: 13, letterSpacing: 0.07 },
};

// Literacy-adaptive scale — LOW gets 25% larger text and icon-first layouts
export const LITERACY_SCALE = {
  LOW:    1.25,
  MEDIUM: 1.0,
  HIGH:   0.95,
} as const;

// ─── Spacing (8pt grid) ─────────────────────────────────────────────────────

export const SPACING = {
  xs:   4,
  sm:   8,
  md:   16,
  lg:   24,
  xl:   32,
  xxl:  48,
  xxxl: 64,
};

// ─── Border radii ────────────────────────────────────────────────────────────

export const BORDER_RADIUS = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  28,
  full: 9999,
};

// ─── Shadows (Apple-calibrated — subtle, not Material elevation) ─────────────

export const SHADOWS = {
  none: {},
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  card: {
    shadowColor: '#1A3A6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
};

// ─── Font sizes (legacy alias used by existing screens) ──────────────────────

export const FONT_SIZE = {
  xs:   11,
  sm:   13,
  md:   15,
  lg:   17,
  xl:   20,
  xxl:  22,
  xxxl: 28,
};

// ─── React Native Paper theme ────────────────────────────────────────────────

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary:        COLORS.primary,
    secondary:      COLORS.secondary,
    background:     COLORS.systemGroupedBackground,
    surface:        COLORS.systemBackground,
    error:          COLORS.systemRed,
    onPrimary:      COLORS.white,
    onSurface:      COLORS.label,
    outline:        COLORS.separator,
    surfaceVariant: COLORS.systemGray6,
  },
  roundness: 12,
};
