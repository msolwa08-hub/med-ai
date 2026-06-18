import React, { useState, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {
  Button,
  TextInput,
  Surface,
  Text,
  Snackbar,
  HelperText,
  SegmentedButtons,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useAuthStore } from '@store/authStore';
import { authApi } from '@api/endpoints';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '@constants/theme';
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

  function handleModeChange(value: string) {
    setLoginMode(value as LoginMode);
    setErrors({});
    setOtpSent(false);
    setOtp('');
    clearError();
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoid}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.backArrow}>{'←'}</Text>
            </TouchableOpacity>

            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Login</Text>
              <Text style={styles.headerSubtitle}>Welcome back to MedAI</Text>
            </View>
          </View>

          {/* MODE TOGGLE */}
          <SegmentedButtons
            value={loginMode}
            onValueChange={handleModeChange}
            style={styles.segmentedButtons}
            buttons={[
              {
                value: 'phone',
                label: 'Phone OTP',
                icon: 'cellphone',
                style: loginMode === 'phone' ? styles.segmentActive : styles.segmentInactive,
                labelStyle: loginMode === 'phone' ? styles.segmentLabelActive : styles.segmentLabelInactive,
              },
              {
                value: 'email',
                label: 'Email / Password',
                icon: 'email-outline',
                style: loginMode === 'email' ? styles.segmentActive : styles.segmentInactive,
                labelStyle: loginMode === 'email' ? styles.segmentLabelActive : styles.segmentLabelInactive,
              },
            ]}
          />

          {/* FORM */}
          <Surface style={styles.formSurface} elevation={2}>
            {loginMode === 'phone' ? (
              <View>
                {!otpSent ? (
                  /* PHONE ENTRY */
                  <View>
                    <Text style={styles.fieldLabel}>Phone Number</Text>
                    <TextInput
                      mode="outlined"
                      placeholder="+27 71 234 5678"
                      value={phone}
                      onChangeText={(val) => {
                        setPhone(val);
                        clearFieldError('phone');
                      }}
                      keyboardType="phone-pad"
                      autoComplete="tel"
                      textContentType="telephoneNumber"
                      error={!!errors.phone}
                      outlineColor={COLORS.border}
                      activeOutlineColor={COLORS.primary}
                      style={styles.textInput}
                      left={<TextInput.Icon icon="phone" color={COLORS.textSecondary} />}
                      returnKeyType="done"
                      onSubmitEditing={handleSendOtp}
                    />
                    {errors.phone ? (
                      <HelperText type="error" visible={!!errors.phone}>
                        {errors.phone}
                      </HelperText>
                    ) : (
                      <HelperText type="info" visible>
                        Enter your SA mobile number (e.g. 071 234 5678)
                      </HelperText>
                    )}

                    <Button
                      mode="contained"
                      onPress={handleSendOtp}
                      loading={loading}
                      disabled={loading}
                      style={styles.primaryButton}
                      contentStyle={styles.primaryButtonContent}
                      labelStyle={styles.primaryButtonLabel}
                      buttonColor={COLORS.primary}
                    >
                      Send OTP
                    </Button>
                  </View>
                ) : (
                  /* OTP ENTRY */
                  <View>
                    <View style={styles.otpInfoBanner}>
                      <Text style={styles.otpInfoIcon}>📱</Text>
                      <Text style={styles.otpInfoText}>
                        {'Code sent to '}
                        <Text style={styles.otpInfoPhone}>{normalisePhone(phone)}</Text>
                      </Text>
                    </View>

                    <Text style={styles.fieldLabel}>Verification Code</Text>
                    <TextInput
                      ref={otpInputRef}
                      mode="outlined"
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
                      outlineColor={COLORS.border}
                      activeOutlineColor={COLORS.primary}
                      style={[styles.textInput, styles.otpInput]}
                      left={<TextInput.Icon icon="shield-key-outline" color={COLORS.textSecondary} />}
                      returnKeyType="done"
                      onSubmitEditing={handlePhoneLogin}
                    />
                    {errors.otp ? (
                      <HelperText type="error" visible={!!errors.otp}>
                        {errors.otp}
                      </HelperText>
                    ) : (
                      <HelperText type="info" visible>
                        Enter the 6-digit code from your SMS
                      </HelperText>
                    )}

                    <Button
                      mode="contained"
                      onPress={handlePhoneLogin}
                      loading={loading}
                      disabled={loading || otp.length !== 6}
                      style={styles.primaryButton}
                      contentStyle={styles.primaryButtonContent}
                      labelStyle={styles.primaryButtonLabel}
                      buttonColor={COLORS.primary}
                    >
                      Verify & Login
                    </Button>

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
                <Text style={styles.fieldLabel}>Email Address</Text>
                <TextInput
                  mode="outlined"
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
                  outlineColor={COLORS.border}
                  activeOutlineColor={COLORS.primary}
                  style={styles.textInput}
                  left={<TextInput.Icon icon="email-outline" color={COLORS.textSecondary} />}
                  returnKeyType="next"
                />
                {errors.email ? (
                  <HelperText type="error" visible={!!errors.email}>
                    {errors.email}
                  </HelperText>
                ) : null}

                <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>Password</Text>
                <TextInput
                  mode="outlined"
                  placeholder="Your password"
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
                  outlineColor={COLORS.border}
                  activeOutlineColor={COLORS.primary}
                  style={styles.textInput}
                  left={<TextInput.Icon icon="lock-outline" color={COLORS.textSecondary} />}
                  right={
                    <TextInput.Icon
                      icon={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
                      color={COLORS.textSecondary}
                      onPress={() => setPasswordVisible((v) => !v)}
                    />
                  }
                  returnKeyType="done"
                  onSubmitEditing={handleEmailLogin}
                />
                {errors.password ? (
                  <HelperText type="error" visible={!!errors.password}>
                    {errors.password}
                  </HelperText>
                ) : null}

                <Button
                  mode="contained"
                  onPress={handleEmailLogin}
                  loading={loading}
                  disabled={loading}
                  style={styles.primaryButton}
                  contentStyle={styles.primaryButtonContent}
                  labelStyle={styles.primaryButtonLabel}
                  buttonColor={COLORS.primary}
                >
                  Login
                </Button>
              </View>
            )}
          </Surface>

          {/* FOOTER */}
          <View style={styles.footer}>
            <Text style={styles.footerPrompt}>Don't have an account?</Text>
            <View style={styles.registerRow}>
              <Button
                mode="text"
                onPress={() => navigation.navigate('RegisterPatient')}
                compact
                textColor={COLORS.secondary}
                labelStyle={styles.registerButtonLabel}
              >
                Register as Patient
              </Button>
              <View style={styles.registerDivider} />
              <Button
                mode="text"
                onPress={() => navigation.navigate('RegisterDoctor')}
                compact
                textColor={COLORS.secondary}
                labelStyle={styles.registerButtonLabel}
              >
                Register as Doctor
              </Button>
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
    backgroundColor: COLORS.background,
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    marginTop: 2,
  },
  backArrow: {
    fontSize: 20,
    color: COLORS.primary,
    fontWeight: '600',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  // TOGGLE
  segmentedButtons: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  segmentActive: {
    backgroundColor: COLORS.primary,
  },
  segmentInactive: {
    backgroundColor: COLORS.surface,
  },
  segmentLabelActive: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
  },
  segmentLabelInactive: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },

  // FORM SURFACE
  formSurface: {
    marginHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    ...SHADOWS.md,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  fieldLabelSpaced: {
    marginTop: SPACING.md,
  },
  textInput: {
    backgroundColor: COLORS.surface,
    fontSize: 15,
  },

  // OTP SPECIFIC
  otpInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  otpInfoIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  otpInfoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  otpInfoPhone: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  otpInput: {
    letterSpacing: 4,
    fontSize: 22,
    textAlign: 'center',
  },
  changeNumberLink: {
    alignSelf: 'center',
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  changeNumberText: {
    fontSize: 14,
    color: COLORS.primaryLight,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  // BUTTONS
  primaryButton: {
    marginTop: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
  },
  primaryButtonContent: {
    height: 52,
  },
  primaryButtonLabel: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // FOOTER
  footer: {
    alignItems: 'center',
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  footerPrompt: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  registerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerDivider: {
    width: 1,
    height: 18,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.xs,
  },
  registerButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
  },

  // SNACKBAR
  snackbar: {
    backgroundColor: COLORS.text,
    marginBottom: SPACING.sm,
  },
  snackbarText: {
    color: COLORS.white,
    fontSize: 14,
  },
});
