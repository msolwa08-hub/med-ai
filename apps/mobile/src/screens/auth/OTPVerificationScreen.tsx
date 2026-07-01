import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { useAuthStore } from '@store/authStore';
import { authApi } from '@api/endpoints';
import { BORDER_RADIUS, COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '@constants/theme';
import type { AuthStackParamList } from '@navigation/AuthNavigator';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type OTPRouteProp = RouteProp<AuthStackParamList, 'OTPVerification'>;
type OTPNavigationProp = StackNavigationProp<AuthStackParamList, 'OTPVerification'>;

const OTP_LENGTH = 6;
const COUNTDOWN_START = 60;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function OTPVerificationScreen(): React.JSX.Element {
  const route = useRoute<OTPRouteProp>();
  const navigation = useNavigation<OTPNavigationProp>();
  const { phone } = route.params;

  const login = useAuthStore((s) => s.login);

  // ------------------------------------------------------------------
  // State
  // ------------------------------------------------------------------
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(COUNTDOWN_START);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');

  // ------------------------------------------------------------------
  // Refs
  // ------------------------------------------------------------------
  const inputRefs = useRef<Array<TextInput | null>>(Array(OTP_LENGTH).fill(null));
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ------------------------------------------------------------------
  // Countdown timer
  // ------------------------------------------------------------------
  const startCountdown = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setCountdown(COUNTDOWN_START);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    startCountdown();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [startCountdown]);

  // ------------------------------------------------------------------
  // OTP box handlers
  // ------------------------------------------------------------------
  const handleDigitChange = useCallback(
    (text: string, index: number) => {
      // Strip non-numeric characters; take only the last character typed
      const sanitised = text.replace(/[^0-9]/g, '').slice(-1);

      setDigits((prev) => {
        const next = [...prev];
        next[index] = sanitised;
        return next;
      });

      if (sanitised !== '' && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [],
  );

  const handleKeyPress = useCallback(
    (key: string, index: number) => {
      if (key === 'Backspace' && digits[index] === '' && index > 0) {
        inputRefs.current[index - 1]?.focus();
        // Also clear the previous box so the user can retype it cleanly
        setDigits((prev) => {
          const next = [...prev];
          next[index - 1] = '';
          return next;
        });
      }
    },
    [digits],
  );

  // ------------------------------------------------------------------
  // Resend OTP
  // ------------------------------------------------------------------
  const handleResend = useCallback(async () => {
    try {
      await authApi.sendOtp(phone);
      startCountdown();
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } catch {
      setSnackbarMessage('Failed to resend code. Please try again.');
      setSnackbarVisible(true);
    }
  }, [phone, startCountdown]);

  // ------------------------------------------------------------------
  // Verify
  // ------------------------------------------------------------------
  const otp = digits.join('');
  const isOtpComplete = otp.length === OTP_LENGTH;

  const handleVerify = useCallback(async () => {
    if (!isOtpComplete || isLoading) return;

    setIsLoading(true);
    try {
      await login(phone, otp);
      // On success the auth state changes; RootNavigator handles redirection
      // automatically — no manual navigation call needed here.
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response?.data
              ?.message ?? 'Verification failed. Please check the code and try again.';
      setSnackbarMessage(message);
      setSnackbarVisible(true);
    } finally {
      setIsLoading(false);
    }
  }, [isOtpComplete, isLoading, login, phone, otp]);

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.systemGroupedBackground} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backChevron}>{'‹'}</Text>
          </TouchableOpacity>

          {/* CARD */}
          <View style={styles.card}>
            {/* Lock icon */}
            <View style={styles.iconCircle}>
              <Text style={styles.iconEmoji}>{'🔐'}</Text>
            </View>

            {/* Title */}
            <Text style={styles.title}>Enter verification code</Text>

            {/* Subtitle */}
            <Text style={styles.subtitle}>{`We sent a 6-digit code to\n${phone}`}</Text>

            {/* OTP boxes */}
            <View style={styles.otpRow}>
              {Array.from({ length: OTP_LENGTH }, (_, i) => {
                const isFocused = focusedIndex === i;
                const isFilled = digits[i] !== '';
                return (
                  <TextInput
                    key={i}
                    ref={(el) => {
                      inputRefs.current[i] = el;
                    }}
                    style={[
                      styles.digitBox,
                      isFilled && styles.digitBoxFilled,
                      isFocused && styles.digitBoxFocused,
                    ]}
                    value={digits[i]}
                    onChangeText={(text) => handleDigitChange(text, i)}
                    onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                    onFocus={() => setFocusedIndex(i)}
                    onBlur={() => setFocusedIndex(null)}
                    keyboardType="numeric"
                    maxLength={1}
                    selectTextOnFocus
                    textAlign="center"
                    returnKeyType="done"
                    caretHidden={Platform.OS === 'ios'}
                  />
                );
              })}
            </View>

            {/* Timer / Resend */}
            <View style={styles.timerSection}>
              {countdown > 0 ? (
                <Text style={styles.countdownText}>{`Resend in ${countdown}s`}</Text>
              ) : (
                <TouchableOpacity
                  onPress={handleResend}
                  activeOpacity={0.7}
                  style={styles.resendTouch}
                  accessibilityRole="button"
                >
                  <Text style={styles.resendText}>Resend Code</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Verify button */}
            <TouchableOpacity
              style={[
                styles.verifyButton,
                (!isOtpComplete || isLoading) && styles.verifyButtonDisabled,
              ]}
              onPress={handleVerify}
              disabled={!isOtpComplete || isLoading}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              {isLoading ? (
                <View style={styles.buttonLoadingRow}>
                  <ActivityIndicator size="small" color={COLORS.white} />
                  <Text style={styles.verifyButtonText}>Verifying…</Text>
                </View>
              ) : (
                <Text style={styles.verifyButtonText}>Verify Code</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={4000}
        action={{ label: 'Dismiss', onPress: () => setSnackbarVisible(false) }}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.systemGroupedBackground,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },

  // Back button
  backButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.systemBackground,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  backChevron: {
    fontSize: 28,
    color: COLORS.primary,
    fontWeight: '600',
    lineHeight: 30,
    marginTop: -2,
  },

  // Card (card-on-soft-background)
  card: {
    backgroundColor: COLORS.systemBackground,
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.sm,
  },

  // Icon
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.healingMint,
    borderWidth: 1,
    borderColor: COLORS.healingTeal,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  iconEmoji: {
    fontSize: 36,
  },

  // Headings
  title: {
    ...TYPOGRAPHY.title2,
    color: COLORS.label,
    textAlign: 'center',
  },
  subtitle: {
    ...TYPOGRAPHY.subheadline,
    color: COLORS.secondaryLabel,
    textAlign: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },

  // OTP row
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  digitBox: {
    width: 48,
    height: 56,
    borderWidth: 1.5,
    borderColor: COLORS.separator,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.systemGray6,
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.label,
    textAlign: 'center',
  },
  digitBoxFilled: {
    backgroundColor: COLORS.systemBackground,
    borderColor: COLORS.primaryLight,
    color: COLORS.primaryDark,
  },
  digitBoxFocused: {
    backgroundColor: COLORS.systemBackground,
    borderColor: COLORS.primary,
    borderWidth: 2,
  },

  // Timer
  timerSection: {
    marginTop: SPACING.md,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownText: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.secondaryLabel,
  },
  resendTouch: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
  },
  resendText: {
    ...TYPOGRAPHY.footnote,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Verify button
  verifyButton: {
    height: 56,
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  verifyButtonDisabled: {
    backgroundColor: COLORS.primaryLight,
    opacity: 0.55,
  },
  verifyButtonText: {
    ...TYPOGRAPHY.headline,
    color: COLORS.white,
  },
  buttonLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },

  // Snackbar
  snackbar: {
    backgroundColor: COLORS.label,
  },
});
