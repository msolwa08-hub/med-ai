import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  Animated,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {
  TextInput,
  Snackbar,
  HelperText,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useAuthStore } from '@store/authStore';
import { authApi } from '@api/endpoints';
import { COLORS, TYPOGRAPHY, SHADOWS, SPACING, BORDER_RADIUS } from '@constants/theme';
import type { AuthStackParamList } from '@navigation/AuthNavigator';

type LoginNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

type LoginMode = 'phone' | 'email';

type FocusField = 'phone' | 'otp' | 'email' | 'password';

interface FormErrors {
  phone?: string;
  email?: string;
  password?: string;
  otp?: string;
}

// Validates SA phone numbers: starts with 0 (10 digits) or +27 (followed by 9 digits)
function validatePhone(value: string): string | null {
  const stripped = value.replace(/\s+/g, '');
  const saPhoneRegex = /^(\+27|0)[6-8][0-9]{8}$/;
  if (!stripped) {
    return 'Phone number is required';
  }
  if (!saPhoneRegex.test(stripped)) {
    return 'Enter a valid South African phone number (e.g. 071 234 5678)';
  }
  return null;
}

function validateEmail(value: string): string | null {
  if (!value.trim()) {
    return 'Email address is required';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value.trim())) {
    return 'Enter a valid email address';
  }
  return null;
}

// Normalise phone to E.164 (+27XXXXXXXXX)
function normalisePhone(phone: string): string {
  const stripped = phone.replace(/\s+/g, '');
  if (stripped.startsWith('0')) {
    return '+27' + stripped.slice(1);
  }
  return stripped;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PILL_CONTAINER_PADDING = 3;
const PILL_MARGIN = SPACING.lg;

export default function LoginScreen() {
  const navigation = useNavigation<LoginNavigationProp>();
  const { login, loginWithEmail, isLoading: storeLoading, error: storeError, clearError } = useAuthStore();

  const [loginMode, setLoginMode] = useState<LoginMode>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [focusedField, setFocusedField] = useState<FocusField | null>(null);

  // Animated pill switcher
  const pillAnim = useRef(new Animated.Value(0)).current;
  const pillContainerWidth = SCREEN_WIDTH - PILL_MARGIN * 2 - PILL_CONTAINER_PADDING * 2;
  const pillWidth = pillContainerWidth / 2;

  // react-native-paper's TextInput ref type (TextInputHandles) is not exported,
  // so use `any` to avoid the RefObject<TextInputHandles> mismatch.
  const otpInputRef = useRef<any>(null);

  const loading = isLoading || storeLoading;

  function showSnackbar(message: string) {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  }

  function clearFieldError(field: keyof FormErrors) {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function handleSendOtp() {
    clearError();
    const phoneError = validatePhone(phone);
    if (phoneError) {
      setErrors({ phone: phoneError });
      return;
    }
    setErrors({});
    setIsLoading(true);
    try {
      const normalised = normalisePhone(phone);
      await authApi.sendOtp(normalised, 'LOGIN');
      setOtpSent(true);
      showSnackbar('Verification code sent to ' + normalised);
      // Focus OTP input after a brief delay
      setTimeout(() => otpInputRef.current?.focus(), 350);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to send OTP. Please try again.';
      showSnackbar(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePhoneLogin() {
    clearError();
    if (!otp.trim()) {
      setErrors({ otp: 'Please enter the 6-digit code' });
      return;
    }
    if (otp.length !== 6) {
      setErrors({ otp: 'Code must be exactly 6 digits' });
      return;
    }
    setErrors({});
    try {
      const normalised = normalisePhone(phone);
      await login(normalised, otp);
      // Navigation handled by root navigator on auth state change
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        storeError ||
        'Verification failed. Please check the code and try again.';
      showSnackbar(message);
    }
  }

  async function handleEmailLogin() {
    clearError();
    const emailError = validateEmail(email);
    const passwordError = !password.trim() ? 'Password is required' : null;

    if (emailError || passwordError) {
      setErrors({
        ...(emailError ? { email: emailError } : {}),
        ...(passwordError ? { password: passwordError } : {}),
      });
      return;
    }
    setErrors({});
    try {
      await loginWithEmail(email.trim(), password);
      // Navigation handled by root navigator on auth state change
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        storeError ||
        'Login failed. Please check your credentials.';
      showSnackbar(message);
    }
  }

  function handleModeChange(value: LoginMode) {
    setLoginMode(value);
    setErrors({});
    setOtpSent(false);
    setOtp('');
    clearError();
    Animated.spring(pillAnim, {
      toValue: value === 'phone' ? 0 : 1,
      useNativeDriver: true,
      tension: 300,
      friction: 30,
    }).start();
  }

  const pillTranslateX = pillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, pillWidth],
  });

  function inputStyle(field: FocusField, base: object) {
    return [base, focusedField === field && styles.inputFocused];
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.systemGroupedBackground} />
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >

        {/* STATIC HEADER — does not scroll */}
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

          <Text style={styles.headerTitle}>Welcome back</Text>
          <Text style={styles.headerSubtitle}>Sign in to continue your care</Text>

          {/* Custom pill segmented control */}
          <View style={styles.pillContainer}>
            <Animated.View
              style={[
                styles.pillIndicator,
                { width: pillWidth, transform: [{ translateX: pillTranslateX }] },
              ]}
            />
            <TouchableOpacity
              style={styles.pillOption}
              onPress={() => handleModeChange('phone')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.pillLabel,
                  loginMode === 'phone' ? styles.pillLabelActive : styles.pillLabelInactive,
                ]}
              >
                Phone
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.pillOption}
              onPress={() => handleModeChange('email')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.pillLabel,
                  loginMode === 'email' ? styles.pillLabelActive : styles.pillLabelInactive,
                ]}
              >
                Email
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SCROLLABLE FORM */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formCard}>
            {loginMode === 'phone' ? (
              <View>
                {!otpSent ? (
                  /* PHONE ENTRY */
                  <View>
                    <View style={styles.phoneRow}>
                      {/* +27 prefix */}
                      <View style={styles.phonePrefixBox}>
                        <Text style={styles.phonePrefixText}>+27</Text>
                      </View>
                      {/* Phone number field */}
                      <TextInput
                        mode="flat"
                        placeholder="71 234 5678"
                        value={phone}
                        onChangeText={(val) => {
                          setPhone(val);
                          clearFieldError('phone');
                        }}
                        onFocus={() => setFocusedField('phone')}
                        onBlur={() => setFocusedField(null)}
                        keyboardType="phone-pad"
                        autoComplete="tel"
                        textContentType="telephoneNumber"
                        error={!!errors.phone}
                        underlineColor="transparent"
                        activeUnderlineColor="transparent"
                        style={inputStyle('phone', styles.phoneInput)}
                        returnKeyType="done"
                        onSubmitEditing={handleSendOtp}
                      />
                    </View>
                    {errors.phone ? (
                      <HelperText type="error" visible={!!errors.phone} style={styles.helperText}>
                        {errors.phone}
                      </HelperText>
                    ) : (
                      <HelperText type="info" visible style={styles.helperText}>
                        Enter your SA mobile number
                      </HelperText>
                    )}

                    <TouchableOpacity
                      style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
                      onPress={handleSendOtp}
                      disabled={loading}
                      activeOpacity={0.85}
                    >
                      {loading ? (
                        <View style={styles.buttonLoadingRow}>
                          <ActivityIndicator size="small" color={COLORS.white} />
                          <Text style={styles.primaryButtonText}>Sending…</Text>
                        </View>
                      ) : (
                        <Text style={styles.primaryButtonText}>Send OTP</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  /* OTP ENTRY */
                  <View>
                    <View style={styles.otpInfoBanner}>
                      <Text style={styles.otpInfoText}>
                        Code sent to{' '}
                        <Text style={styles.otpInfoPhone}>{normalisePhone(phone)}</Text>
                      </Text>
                    </View>

                    <TextInput
                      ref={otpInputRef}
                      mode="flat"
                      placeholder="123456"
                      value={otp}
                      onChangeText={(val) => {
                        const digits = val.replace(/\D/g, '').slice(0, 6);
                        setOtp(digits);
                        clearFieldError('otp');
                      }}
                      onFocus={() => setFocusedField('otp')}
                      onBlur={() => setFocusedField(null)}
                      keyboardType="number-pad"
                      maxLength={6}
                      error={!!errors.otp}
                      underlineColor="transparent"
                      activeUnderlineColor="transparent"
                      style={[...inputStyle('otp', styles.flatInput), styles.otpInput]}
                      returnKeyType="done"
                      onSubmitEditing={handlePhoneLogin}
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

                    <TouchableOpacity
                      style={[
                        styles.primaryButton,
                        (loading || otp.length !== 6) && styles.primaryButtonDisabled,
                      ]}
                      onPress={handlePhoneLogin}
                      disabled={loading || otp.length !== 6}
                      activeOpacity={0.85}
                    >
                      {loading ? (
                        <View style={styles.buttonLoadingRow}>
                          <ActivityIndicator size="small" color={COLORS.white} />
                          <Text style={styles.primaryButtonText}>Verifying…</Text>
                        </View>
                      ) : (
                        <Text style={styles.primaryButtonText}>Verify & Sign In</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.changeNumberLink}
                      onPress={() => {
                        setOtpSent(false);
                        setOtp('');
                        setErrors({});
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.changeNumberText}>Change number</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : (
              /* EMAIL / PASSWORD FORM */
              <View>
                <TextInput
                  mode="flat"
                  placeholder="you@example.com"
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    clearFieldError('email');
                  }}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                  error={!!errors.email}
                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                  style={inputStyle('email', styles.flatInput)}
                  left={<TextInput.Icon icon="email-outline" color={COLORS.secondaryLabel} />}
                  returnKeyType="next"
                />
                {errors.email ? (
                  <HelperText type="error" visible={!!errors.email} style={styles.helperText}>
                    {errors.email}
                  </HelperText>
                ) : null}

                <View style={styles.fieldGap} />

                <TextInput
                  mode="flat"
                  placeholder="Password"
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    clearFieldError('password');
                  }}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  secureTextEntry={!passwordVisible}
                  autoCapitalize="none"
                  autoComplete="password"
                  textContentType="password"
                  error={!!errors.password}
                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                  style={inputStyle('password', styles.flatInput)}
                  left={<TextInput.Icon icon="lock-outline" color={COLORS.secondaryLabel} />}
                  right={
                    <TextInput.Icon
                      icon={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
                      color={COLORS.secondaryLabel}
                      onPress={() => setPasswordVisible((v) => !v)}
                    />
                  }
                  returnKeyType="done"
                  onSubmitEditing={handleEmailLogin}
                />
                {errors.password ? (
                  <HelperText type="error" visible={!!errors.password} style={styles.helperText}>
                    {errors.password}
                  </HelperText>
                ) : null}

                {/* Forgot password */}
                <TouchableOpacity
                  style={styles.forgotPasswordLink}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('ForgotPassword')}
                >
                  <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
                  onPress={handleEmailLogin}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <View style={styles.buttonLoadingRow}>
                      <ActivityIndicator size="small" color={COLORS.white} />
                      <Text style={styles.primaryButtonText}>Signing in…</Text>
                    </View>
                  ) : (
                    <Text style={styles.primaryButtonText}>Sign In</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* FOOTER */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Don't have an account?{' '}
            </Text>
            <View style={styles.registerRow}>
              <TouchableOpacity
                onPress={() => navigation.navigate('RegisterPatient')}
                activeOpacity={0.7}
                style={styles.footerLinkTouch}
              >
                <Text style={styles.registerLink}>Register as Patient</Text>
              </TouchableOpacity>
              <View style={styles.registerDivider} />
              <TouchableOpacity
                onPress={() => navigation.navigate('RegisterDoctor')}
                activeOpacity={0.7}
                style={styles.footerLinkTouch}
              >
                <Text style={styles.registerLink}>Register as Doctor</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              activeOpacity={0.7}
              style={[styles.footerLinkTouch, styles.footerForgotLink]}
            >
              <Text style={styles.registerLink}>Forgot password?</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          style={styles.snackbar}
          action={{
            label: 'OK',
            onPress: () => setSnackbarVisible(false),
            textColor: COLORS.white,
          }}
        >
          <Text style={styles.snackbarText}>{snackbarMessage}</Text>
        </Snackbar>
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

  // STATIC HEADER
  header: {
    backgroundColor: COLORS.systemGroupedBackground,
    paddingHorizontal: PILL_MARGIN,
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

  // PILL SWITCHER
  pillContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.systemGray5,
    borderRadius: BORDER_RADIUS.md,
    padding: PILL_CONTAINER_PADDING,
    marginBottom: SPACING.sm,
    position: 'relative',
  },
  pillIndicator: {
    position: 'absolute',
    top: PILL_CONTAINER_PADDING,
    left: PILL_CONTAINER_PADDING,
    bottom: PILL_CONTAINER_PADDING,
    backgroundColor: COLORS.systemBackground,
    borderRadius: BORDER_RADIUS.sm + 2,
    ...SHADOWS.xs,
  },
  pillOption: {
    flex: 1,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  pillLabel: {
    ...TYPOGRAPHY.subheadline,
  },
  pillLabelActive: {
    fontWeight: '600',
    color: COLORS.label,
  },
  pillLabelInactive: {
    color: COLORS.secondaryLabel,
  },

  // FORM CARD (card-on-soft-background)
  formCard: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    backgroundColor: COLORS.systemBackground,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },

  // FLAT INPUT (soft fill, teal focus ring)
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
  fieldGap: {
    height: SPACING.md,
  },

  // PHONE ROW
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    gap: SPACING.sm,
  },
  phonePrefixBox: {
    height: 56,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.systemGray6,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.separator,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phonePrefixText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.secondaryLabel,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: COLORS.systemGray6,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.separator,
    height: 56,
    ...TYPOGRAPHY.body,
  },

  helperText: {
    ...TYPOGRAPHY.footnote,
    marginTop: 2,
    marginBottom: 0,
  },

  // OTP
  otpInfoBanner: {
    backgroundColor: COLORS.healingMint,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.healingTealMid,
    paddingVertical: SPACING.md - SPACING.xs,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  otpInfoText: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.secondaryLabel,
    textAlign: 'center',
  },
  otpInfoPhone: {
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  otpInput: {
    letterSpacing: 8,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  changeNumberLink: {
    alignSelf: 'center',
    marginTop: SPACING.sm,
    paddingVertical: SPACING.md - SPACING.xs,
    paddingHorizontal: SPACING.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  changeNumberText: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // FORGOT PASSWORD
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginTop: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    minHeight: 32,
    justifyContent: 'center',
  },
  forgotPasswordText: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // PRIMARY BUTTON
  primaryButton: {
    height: 56,
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg - SPACING.xs,
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

  // FOOTER
  footer: {
    alignItems: 'center',
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  footerText: {
    ...TYPOGRAPHY.subheadline,
    color: COLORS.secondaryLabel,
    marginBottom: SPACING.xs,
  },
  footerLinkTouch: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xs,
  },
  footerForgotLink: {
    alignSelf: 'center',
    marginTop: SPACING.xs,
  },
  registerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerDivider: {
    width: 1,
    height: 16,
    backgroundColor: COLORS.opaqueSeparator,
    marginHorizontal: SPACING.md - SPACING.xs,
  },
  registerLink: {
    ...TYPOGRAPHY.subheadline,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // SNACKBAR
  snackbar: {
    backgroundColor: COLORS.label,
    marginBottom: SPACING.sm,
  },
  snackbarText: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.white,
  },
});
