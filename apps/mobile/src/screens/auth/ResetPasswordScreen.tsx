import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { TextInput, HelperText } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import { authApi } from '@api/endpoints';
import { COLORS, TYPOGRAPHY, SHADOWS, SPACING, BORDER_RADIUS } from '@constants/theme';
import type { AuthStackParamList } from '@navigation/AuthNavigator';

type ResetPasswordNavigationProp = StackNavigationProp<AuthStackParamList, 'ResetPassword'>;
type ResetPasswordRouteProp = RouteProp<AuthStackParamList, 'ResetPassword'>;

type FocusField = 'otp' | 'newPassword' | 'confirmPassword';

interface FormErrors {
  otp?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export default function ResetPasswordScreen() {
  const navigation = useNavigation<ResetPasswordNavigationProp>();
  const route = useRoute<ResetPasswordRouteProp>();
  const { phone } = route.params;

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [focusedField, setFocusedField] = useState<FocusField | null>(null);

  function clearFieldError(field: keyof FormErrors) {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function validate(): boolean {
    const next: FormErrors = {};

    if (otp.length !== 6) {
      next.otp = 'Please enter the 6-digit verification code';
    }
    if (newPassword.length < 8) {
      next.newPassword = 'Password must be at least 8 characters';
    }
    if (!confirmPassword) {
      next.confirmPassword = 'Please confirm your new password';
    } else if (newPassword !== confirmPassword) {
      next.confirmPassword = 'Passwords do not match';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleResetPassword() {
    setApiError(null);
    if (!validate()) return;

    setIsLoading(true);
    try {
      await authApi.resetPassword(phone, otp, newPassword);
      Alert.alert(
        'Password Reset',
        'Your password has been reset successfully. Please sign in with your new password.',
        [{ text: 'Sign In', onPress: () => navigation.navigate('Login') }]
      );
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Something went wrong. Please try again.';
      setApiError(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResendCode() {
    setApiError(null);
    setIsResending(true);
    try {
      await authApi.forgotPassword(phone);
      Alert.alert('Code Resent', 'A new verification code has been sent to ' + phone);
      setOtp('');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to resend code. Please try again.';
      setApiError(message);
    } finally {
      setIsResending(false);
    }
  }

  function inputStyle(field: FocusField) {
    return [styles.flatInput, focusedField === field && styles.inputFocused];
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.systemGroupedBackground} />
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >

        {/* HEADER */}
        <View style={styles.header}>
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

          <Text style={styles.headerTitle}>Create new password</Text>
          <Text style={styles.headerSubtitle}>
            Enter the code sent to your phone and choose a new password.
          </Text>
        </View>

        {/* FORM */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formCard}>

            {/* Code sent to banner */}
            <View style={styles.codeBanner}>
              <Text style={styles.codeBannerText}>
                Code sent to{' '}
                <Text style={styles.codeBannerPhone}>{phone}</Text>
              </Text>
              <View style={styles.resendRow}>
                <Text style={styles.resendPrompt}>Didn't receive it? </Text>
                <TouchableOpacity
                  onPress={handleResendCode}
                  disabled={isResending}
                  activeOpacity={0.7}
                  style={styles.resendTouch}
                  accessibilityRole="button"
                >
                  <Text style={[styles.resendLink, isResending && styles.resendLinkDisabled]}>
                    {isResending ? 'Sending…' : 'Resend Code'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* SECTION 1: Verification Code */}
            <Text style={styles.fieldLabel}>Verification Code</Text>
            <TextInput
              mode="flat"
              placeholder="123456"
              value={otp}
              onChangeText={(val) => {
                const digits = val.replace(/\D/g, '').slice(0, 6);
                setOtp(digits);
                clearFieldError('otp');
                setApiError(null);
              }}
              onFocus={() => setFocusedField('otp')}
              onBlur={() => setFocusedField(null)}
              keyboardType="number-pad"
              maxLength={6}
              error={!!errors.otp}
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              style={[...inputStyle('otp'), styles.otpInput]}
              returnKeyType="next"
            />
            {errors.otp ? (
              <HelperText type="error" visible={!!errors.otp} style={styles.helperText}>
                {errors.otp}
              </HelperText>
            ) : (
              <HelperText type="info" visible style={styles.helperText}>
                Enter the 6-digit code from your SMS
              </HelperText>
            )}

            <View style={styles.sectionGap} />

            {/* SECTION 2: New Password */}
            <Text style={styles.fieldLabel}>New Password</Text>
            <TextInput
              mode="flat"
              placeholder="Min. 8 characters"
              value={newPassword}
              onChangeText={(val) => {
                setNewPassword(val);
                clearFieldError('newPassword');
                setApiError(null);
              }}
              onFocus={() => setFocusedField('newPassword')}
              onBlur={() => setFocusedField(null)}
              secureTextEntry={!showNewPassword}
              autoCapitalize="none"
              textContentType="newPassword"
              error={!!errors.newPassword}
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              style={inputStyle('newPassword')}
              left={<TextInput.Icon icon="lock-outline" color={COLORS.secondaryLabel} />}
              right={
                <TextInput.Icon
                  icon={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                  color={COLORS.secondaryLabel}
                  onPress={() => setShowNewPassword((v) => !v)}
                />
              }
              returnKeyType="next"
            />
            {errors.newPassword ? (
              <HelperText type="error" visible={!!errors.newPassword} style={styles.helperText}>
                {errors.newPassword}
              </HelperText>
            ) : null}

            <View style={styles.sectionGap} />

            {/* SECTION 3: Confirm Password */}
            <Text style={styles.fieldLabel}>Confirm Password</Text>
            <TextInput
              mode="flat"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChangeText={(val) => {
                setConfirmPassword(val);
                clearFieldError('confirmPassword');
                setApiError(null);
              }}
              onFocus={() => setFocusedField('confirmPassword')}
              onBlur={() => setFocusedField(null)}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              textContentType="newPassword"
              error={!!errors.confirmPassword}
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              style={inputStyle('confirmPassword')}
              left={<TextInput.Icon icon="lock-check-outline" color={COLORS.secondaryLabel} />}
              right={
                <TextInput.Icon
                  icon={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  color={COLORS.secondaryLabel}
                  onPress={() => setShowConfirmPassword((v) => !v)}
                />
              }
              returnKeyType="done"
              onSubmitEditing={handleResetPassword}
            />
            {errors.confirmPassword ? (
              <HelperText type="error" visible={!!errors.confirmPassword} style={styles.helperText}>
                {errors.confirmPassword}
              </HelperText>
            ) : null}

            {/* API Error */}
            {apiError ? (
              <View style={styles.apiErrorBanner}>
                <Text style={styles.apiErrorText}>{apiError}</Text>
              </View>
            ) : null}

            {/* Submit */}
            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
              onPress={handleResetPassword}
              disabled={isLoading}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              {isLoading ? (
                <View style={styles.buttonLoadingRow}>
                  <ActivityIndicator size="small" color={COLORS.white} />
                  <Text style={styles.primaryButtonText}>Resetting…</Text>
                </View>
              ) : (
                <Text style={styles.primaryButtonText}>Reset Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.systemGroupedBackground,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING.xxl,
  },

  // HEADER
  header: {
    backgroundColor: COLORS.systemGroupedBackground,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: 0,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.systemBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  backChevron: {
    fontSize: 28,
    color: COLORS.primary,
    fontWeight: '600',
    lineHeight: 30,
    marginTop: -2,
  },
  headerTitle: {
    ...TYPOGRAPHY.largeTitle,
    color: COLORS.label,
    marginTop: SPACING.lg,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.secondaryLabel,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xl,
  },

  // FORM CARD (card-on-soft-background)
  formCard: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xs,
    backgroundColor: COLORS.systemBackground,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  sectionGap: {
    height: SPACING.md,
  },

  // CODE BANNER
  codeBanner: {
    backgroundColor: COLORS.healingMint,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.healingTealMid,
    paddingVertical: SPACING.md - SPACING.xs,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  codeBannerText: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.secondaryLabel,
    textAlign: 'center',
  },
  codeBannerPhone: {
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  resendPrompt: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.secondaryLabel,
  },
  resendTouch: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xs,
  },
  resendLink: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.primary,
    fontWeight: '600',
  },
  resendLinkDisabled: {
    opacity: 0.5,
  },

  // FIELD LABEL
  fieldLabel: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.secondaryLabel,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },

  // INPUTS
  flatInput: {
    backgroundColor: COLORS.systemGray6,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.separator,
    height: 56,
    ...TYPOGRAPHY.body,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.systemBackground,
  },
  otpInput: {
    letterSpacing: 8,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  helperText: {
    ...TYPOGRAPHY.footnote,
    marginTop: 2,
    marginBottom: 0,
  },

  // API ERROR
  apiErrorBanner: {
    backgroundColor: '#FFF0EF',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.systemRed,
    paddingVertical: SPACING.md - SPACING.xs,
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.md - SPACING.xs,
  },
  apiErrorText: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.systemRed,
  },

  // PRIMARY BUTTON
  primaryButton: {
    height: 56,
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  primaryButtonDisabled: {
    backgroundColor: COLORS.primaryLight,
    opacity: 0.55,
  },
  primaryButtonText: {
    ...TYPOGRAPHY.headline,
    color: COLORS.white,
  },
  buttonLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
});
