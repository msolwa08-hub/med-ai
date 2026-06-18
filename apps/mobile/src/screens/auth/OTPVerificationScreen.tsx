import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, Snackbar } from 'react-native-paper';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { useAuthStore } from '@store/authStore';
import { authApi } from '@api/endpoints';
import { BORDER_RADIUS, COLORS, SPACING } from '@constants/theme';
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
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.backArrow}>{'←'}</Text>
          </TouchableOpacity>

          {/* Lock icon */}
          <View style={styles.iconCircle}>
            <Text style={styles.iconEmoji}>{'🔐'}</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>Enter Verification Code</Text>

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
                    (isFocused || isFilled) && styles.digitBoxActive,
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
              <TouchableOpacity onPress={handleResend} activeOpacity={0.7}>
                <Text style={styles.resendText}>Resend Code</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Verify button */}
          <View style={styles.buttonWrapper}>
            <Button
              mode="contained"
              onPress={handleVerify}
              disabled={!isOtpComplete || isLoading}
              loading={isLoading}
              contentStyle={styles.verifyButtonContent}
              style={styles.verifyButton}
              labelStyle={styles.verifyButtonLabel}
              buttonColor={COLORS.primary}
            >
              Verify Code
            </Button>
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
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },

  // Back button
  backButton: {
    alignSelf: 'flex-start',
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
    padding: SPACING.xs,
  },
  backArrow: {
    fontSize: 24,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Icon
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(26, 58, 107, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  iconEmoji: {
    fontSize: 36,
  },

  // Headings
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
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
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.white,
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
  },
  digitBoxActive: {
    borderColor: COLORS.primary,
  },

  // Timer
  timerSection: {
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Verify button
  buttonWrapper: {
    width: '100%',
    marginTop: SPACING.xl,
  },
  verifyButton: {
    borderRadius: 26,
    overflow: 'hidden',
  },
  verifyButtonContent: {
    height: 52,
  },
  verifyButtonLabel: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Snackbar
  snackbar: {
    backgroundColor: COLORS.text,
  },
});
