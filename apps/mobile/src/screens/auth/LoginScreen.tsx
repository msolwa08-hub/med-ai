import React, { useState, useRef, useEffect } from 'react';
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
const PILL_MARGIN = 24;

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

  // Animated pill switcher
  const pillAnim = useRef(new Animated.Value(0)).current;
  const pillContainerWidth = SCREEN_WIDTH - PILL_MARGIN * 2 - PILL_CONTAINER_PADDING * 2;
  const pillWidth = pillContainerWidth / 2;

  const otpInputRef = useRef<React.ElementRef<typeof TextInput>>(null);

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
      await authApi.sendOtp(normalised);
      setOtpSent(true);
      showSnackbar('Verification code sent to ' + normalised);
      // Focus OTP input after a brief delay
      setTimeout(() => otpInputRef.current?.focus(), 350);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
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
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
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
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
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

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoid}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.systemGroupedBackground} />
      <SafeAreaView style={styles.safeArea}>

        {/* STATIC HEADER — does not scroll */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.backArrow}>{'←'}</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Welcome back</Text>
          <Text style={styles.headerSubtitle}>Sign in to MedAI</Text>

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
          <View style={styles.formContainer}>
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
                        keyboardType="phone-pad"
                        autoComplete="tel"
                        textContentType="telephoneNumber"
                        error={!!errors.phone}
                        underlineColor="transparent"
                        activeUnderlineColor="transparent"
                        style={styles.phoneInput}
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
                      <Text style={styles.primaryButtonText}>
                        {loading ? 'Sending…' : 'Send OTP'}
                      </Text>
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
                      keyboardType="number-pad"
                      maxLength={6}
                      error={!!errors.otp}
                      underlineColor="transparent"
                      activeUnderlineColor="transparent"
                      style={[styles.flatInput, styles.otpInput]}
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
                      <Text style={styles.primaryButtonText}>
                        {loading ? 'Verifying…' : 'Verify & Sign In'}
                      </Text>
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
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                  error={!!errors.email}
                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                  style={styles.flatInput}
                  left={<TextInput.Icon icon="email-outline" color={COLORS.secondaryLabel} />}
                  returnKeyType="next"
                />
                {errors.email ? (
                  <HelperText type="error" visible={!!errors.email} style={styles.helperText}>
                    {errors.email}
                  </HelperText>
                ) : null}

                <View style={{ height: 12 }} />

                <TextInput
                  mode="flat"
                  placeholder="Password"
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    clearFieldError('password');
                  }}
                  secureTextEntry={!passwordVisible}
                  autoCapitalize="none"
                  autoComplete="password"
                  textContentType="password"
                  error={!!errors.password}
                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                  style={styles.flatInput}
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
                  <Text style={styles.primaryButtonText}>
                    {loading ? 'Signing in…' : 'Sign In'}
                  </Text>
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
              >
                <Text style={styles.registerLink}>Register as Patient</Text>
              </TouchableOpacity>
              <View style={styles.registerDivider} />
              <TouchableOpacity
                onPress={() => navigation.navigate('RegisterDoctor')}
                activeOpacity={0.7}
              >
                <Text style={styles.registerLink}>Register as Doctor</Text>
              </TouchableOpacity>
            </View>
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
      </SafeAreaView>
    </KeyboardAvoidingView>
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
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 0,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.systemGray6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  backArrow: {
    fontSize: 18,
    color: COLORS.primary,
    fontWeight: '600',
    lineHeight: 22,
  },
  headerTitle: {
    ...TYPOGRAPHY.largeTitle,
    color: COLORS.label,
    marginTop: 40,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.secondaryLabel,
    marginTop: 8,
    marginBottom: 32,
  },

  // PILL SWITCHER
  pillContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.systemGray6,
    borderRadius: 10,
    padding: PILL_CONTAINER_PADDING,
    marginBottom: 24,
    position: 'relative',
  },
  pillIndicator: {
    position: 'absolute',
    top: PILL_CONTAINER_PADDING,
    left: PILL_CONTAINER_PADDING,
    bottom: PILL_CONTAINER_PADDING,
    backgroundColor: COLORS.systemBackground,
    borderRadius: 8,
    ...SHADOWS.sm,
  },
  pillOption: {
    flex: 1,
    paddingVertical: 8,
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

  // FORM CONTAINER
  formContainer: {
    marginHorizontal: 24,
    marginTop: 24,
  },

  // FLAT INPUT (white card style)
  flatInput: {
    backgroundColor: COLORS.systemBackground,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.separator,
    height: 56,
    ...TYPOGRAPHY.body,
  },

  // PHONE ROW
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    gap: 8,
  },
  phonePrefixBox: {
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: COLORS.systemBackground,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.separator,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phonePrefixText: {
    ...TYPOGRAPHY.body,
    color: COLORS.label,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: COLORS.systemBackground,
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
    backgroundColor: COLORS.systemGray6,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  otpInfoText: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.secondaryLabel,
    textAlign: 'center',
  },
  otpInfoPhone: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  otpInput: {
    letterSpacing: 8,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  changeNumberLink: {
    alignSelf: 'center',
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  changeNumberText: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // FORGOT PASSWORD
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 4,
    paddingVertical: 4,
  },
  forgotPasswordText: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.primary,
  },

  // PRIMARY BUTTON
  primaryButton: {
    height: 56,
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    ...SHADOWS.card,
  },
  primaryButtonDisabled: {
    opacity: 0.55,
  },
  primaryButtonText: {
    ...TYPOGRAPHY.headline,
    color: COLORS.white,
  },

  // FOOTER
  footer: {
    alignItems: 'center',
    marginTop: SPACING.xl,
    paddingHorizontal: 24,
  },
  footerText: {
    ...TYPOGRAPHY.subheadline,
    color: COLORS.secondaryLabel,
    marginBottom: 8,
  },
  registerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerDivider: {
    width: 1,
    height: 16,
    backgroundColor: COLORS.separator,
    marginHorizontal: 12,
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
