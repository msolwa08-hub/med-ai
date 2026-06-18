import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StatusBar,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Snackbar,
  HelperText,
  Surface,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { authApi, AuthRegisterPatientPayload } from '@api/endpoints';
import { useAuthStore } from '@store/authStore';
import { SA_LANGUAGES } from '@constants/languages';
import { COLORS, SPACING, BORDER_RADIUS } from '@constants/theme';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = (screenWidth - SPACING.md * 2 - SPACING.xs * 2 * 3) / 3;

// ─── Helpers ────────────────────────────────────────────────────────────────

function normalizePhone(raw: string): string {
  const cleaned = raw.replace(/\s+/g, '').replace(/-/g, '');
  if (cleaned.startsWith('+27')) return cleaned;
  if (cleaned.startsWith('0')) return '+27' + cleaned.slice(1);
  return cleaned;
}

function isValidPhone(raw: string): boolean {
  const normalized = normalizePhone(raw);
  // Must be +27 followed by exactly 9 digits
  return /^\+27[0-9]{9}$/.test(normalized);
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value);
  return !isNaN(date.getTime()) && date < new Date();
}

function isValidSaId(id: string): boolean {
  // SA ID is exactly 13 numeric digits (Luhn check optional for now)
  return /^\d{13}$/.test(id);
}

// ─── Sub-components ─────────────────────────────────────────────────────────

interface PasswordStrengthProps {
  password: string;
}

function PasswordStrengthIndicator({ password }: PasswordStrengthProps) {
  if (password.length === 0) return null;

  const checks = [
    { label: 'Length', pass: password.length >= 8 },
    { label: 'Uppercase', pass: /[A-Z]/.test(password) },
    { label: 'Number', pass: /[0-9]/.test(password) },
  ];

  return (
    <View style={styles.strengthRow}>
      {checks.map(({ label, pass }) => (
        <View
          key={label}
          style={[
            styles.strengthPill,
            { backgroundColor: pass ? '#D4EDDA' : '#F8D7DA' },
          ]}
        >
          <Text
            style={[
              styles.strengthPillText,
              { color: pass ? COLORS.success : COLORS.error },
            ]}
          >
            {label} {pass ? '✓' : '✗'}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function RegisterPatientScreen() {
  const navigation = useNavigation();
  const { login } = useAuthStore();

  // Step state
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Step 1
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');

  // Step 2
  const [preferredLanguage, setPreferredLanguage] = useState('en');

  // Step 3
  const [idNumber, setIdNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  // Step 4
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Validation helpers ──────────────────────────────────────────────────

  function showError(message: string) {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  }

  function validateStep1(): boolean {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) newErrors.firstName = 'First name is required.';
    if (!lastName.trim()) newErrors.lastName = 'Last name is required.';

    if (!dateOfBirth.trim()) {
      newErrors.dateOfBirth = 'Date of birth is required.';
    } else if (!isValidDate(dateOfBirth)) {
      newErrors.dateOfBirth = 'Enter a valid date in YYYY-MM-DD format.';
    }

    if (!gender) newErrors.gender = 'Please select a gender.';

    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required.';
    } else if (!isValidPhone(phone)) {
      newErrors.phone = 'Enter a valid South African number (e.g. 082 123 4567).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function validateStep3(): boolean {
    const newErrors: Record<string, string> = {};

    if (idNumber.trim() && !isValidSaId(idNumber.trim())) {
      newErrors.idNumber = 'SA ID number must be exactly 13 digits.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters.';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ── Navigation ─────────────────────────────────────────────────────────

  function handleBack() {
    if (currentStep === 1) {
      navigation.goBack();
    } else {
      setCurrentStep((s) => s - 1);
      setErrors({});
    }
  }

  function handleNextStep1() {
    if (validateStep1()) {
      setErrors({});
      setCurrentStep(2);
    }
  }

  function handleNextStep2() {
    setErrors({});
    setCurrentStep(3);
  }

  function handleNextStep3() {
    if (validateStep3()) {
      setErrors({});
      setCurrentStep(4);
    }
  }

  // ── OTP & Registration ─────────────────────────────────────────────────

  async function handleSendOtp() {
    const normalized = normalizePhone(phone);
    setIsLoading(true);
    try {
      await authApi.sendOtp(normalized);
      setOtpSent(true);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Failed to send OTP. Please try again.';
      showError(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRegister() {
    if (!otpCode.trim() || otpCode.length < 4) {
      showError('Please enter the verification code sent to your phone.');
      return;
    }

    const normalized = normalizePhone(phone);

    const payload: AuthRegisterPatientPayload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      dateOfBirth: dateOfBirth.trim(),
      gender: gender as 'male' | 'female' | 'other',
      idNumber: idNumber.trim(),
      phone: normalized,
      preferredLanguage,
    };

    setIsLoading(true);
    try {
      await authApi.registerPatient(payload);
      await authApi.verifyOtp(normalized, otpCode.trim());
      await login(normalized, otpCode.trim());
      // Navigation is handled by auth state change in the navigator
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Registration failed. Please check your details and try again.';
      showError(message);
    } finally {
      setIsLoading(false);
    }
  }

  // ── Progress Bar ───────────────────────────────────────────────────────

  const stepLabels = ['1. Info', '2. Language', '3. Security', '4. Verify'];

  function renderProgressBar() {
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressSegments}>
          {stepLabels.map((_, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber <= currentStep;
            return (
              <View
                key={stepNumber}
                style={[
                  styles.progressSegment,
                  {
                    backgroundColor: isCompleted
                      ? COLORS.secondary
                      : 'rgba(255,255,255,0.3)',
                  },
                ]}
              />
            );
          })}
        </View>
        <View style={styles.progressLabels}>
          {stepLabels.map((label, index) => (
            <Text key={index} style={styles.progressLabel}>
              {label}
            </Text>
          ))}
        </View>
      </View>
    );
  }

  // ── Step 1: Personal Information ────────────────────────────────────────

  function renderStep1() {
    return (
      <View>
        <Text style={styles.stepTitle}>Personal Information</Text>
        <Text style={styles.stepSubtitle}>Tell us about yourself</Text>

        <TextInput
          label="First Name *"
          value={firstName}
          onChangeText={setFirstName}
          mode="outlined"
          autoCapitalize="words"
          autoCorrect={false}
          style={styles.input}
          error={!!errors.firstName}
          outlineColor={COLORS.border}
          activeOutlineColor={COLORS.primary}
        />
        {!!errors.firstName && (
          <HelperText type="error" visible>
            {errors.firstName}
          </HelperText>
        )}

        <TextInput
          label="Last Name *"
          value={lastName}
          onChangeText={setLastName}
          mode="outlined"
          autoCapitalize="words"
          autoCorrect={false}
          style={styles.input}
          error={!!errors.lastName}
          outlineColor={COLORS.border}
          activeOutlineColor={COLORS.primary}
        />
        {!!errors.lastName && (
          <HelperText type="error" visible>
            {errors.lastName}
          </HelperText>
        )}

        <TextInput
          label="Date of Birth *"
          value={dateOfBirth}
          onChangeText={setDateOfBirth}
          mode="outlined"
          placeholder="YYYY-MM-DD"
          keyboardType="default"
          style={styles.input}
          error={!!errors.dateOfBirth}
          outlineColor={COLORS.border}
          activeOutlineColor={COLORS.primary}
        />
        <HelperText type={errors.dateOfBirth ? 'error' : 'info'} visible>
          {errors.dateOfBirth ?? 'e.g. 1990-01-15'}
        </HelperText>

        <Text style={styles.fieldLabel}>Gender *</Text>
        <View style={styles.genderRow}>
          {(['male', 'female', 'other'] as const).map((g) => {
            const selected = gender === g;
            const label = g.charAt(0).toUpperCase() + g.slice(1);
            return (
              <TouchableOpacity
                key={g}
                style={[
                  styles.genderCard,
                  selected
                    ? styles.genderCardSelected
                    : styles.genderCardUnselected,
                ]}
                onPress={() => {
                  setGender(g);
                  if (errors.gender) setErrors((e) => ({ ...e, gender: '' }));
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.genderCardText,
                    {
                      color: selected ? COLORS.primary : COLORS.textSecondary,
                      fontWeight: selected ? '700' : '400',
                    },
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {!!errors.gender && (
          <HelperText type="error" visible>
            {errors.gender}
          </HelperText>
        )}

        <TextInput
          label="Phone Number *"
          value={phone}
          onChangeText={setPhone}
          mode="outlined"
          placeholder="+27 XX XXX XXXX"
          keyboardType="phone-pad"
          style={styles.input}
          error={!!errors.phone}
          outlineColor={COLORS.border}
          activeOutlineColor={COLORS.primary}
        />
        <HelperText type={errors.phone ? 'error' : 'info'} visible>
          {errors.phone ?? 'South African number required'}
        </HelperText>

        <Button
          mode="contained"
          onPress={handleNextStep1}
          style={styles.nextButton}
          contentStyle={styles.nextButtonContent}
          buttonColor={COLORS.primary}
          labelStyle={styles.nextButtonLabel}
        >
          Next →
        </Button>
      </View>
    );
  }

  // ── Step 2: Language Preference ─────────────────────────────────────────

  function renderStep2() {
    return (
      <View>
        <Text style={styles.stepTitle}>Your Language</Text>
        <Text style={styles.stepSubtitle}>
          Select the language you prefer for consultations. Our AI will
          communicate with you in this language.
        </Text>

        <View style={styles.languageGrid}>
          {SA_LANGUAGES.map((lang) => {
            const selected = preferredLanguage === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageCard,
                  {
                    width: CARD_WIDTH,
                    backgroundColor: selected
                      ? COLORS.primary
                      : COLORS.surfaceVariant,
                    borderColor: selected ? COLORS.primary : COLORS.border,
                  },
                ]}
                onPress={() => setPreferredLanguage(lang.code)}
                activeOpacity={0.8}
              >
                <Text style={styles.languageFlag}>{lang.flag}</Text>
                <Text
                  style={[
                    styles.languageName,
                    { color: selected ? COLORS.white : COLORS.text },
                  ]}
                  numberOfLines={1}
                >
                  {lang.name}
                </Text>
                <Text
                  style={[
                    styles.languageNative,
                    {
                      color: selected
                        ? 'rgba(255,255,255,0.8)'
                        : COLORS.textSecondary,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {lang.nativeName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Button
          mode="contained"
          onPress={handleNextStep2}
          style={styles.nextButton}
          contentStyle={styles.nextButtonContent}
          buttonColor={COLORS.primary}
          labelStyle={styles.nextButtonLabel}
        >
          Next →
        </Button>
      </View>
    );
  }

  // ── Step 3: Security ────────────────────────────────────────────────────

  function renderStep3() {
    return (
      <View>
        <Text style={styles.stepTitle}>Account Security</Text>
        <Text style={styles.stepSubtitle}>
          Set a secure password for your account.
        </Text>

        <TextInput
          label="SA ID Number (optional)"
          value={idNumber}
          onChangeText={setIdNumber}
          mode="outlined"
          placeholder="0000000000000"
          keyboardType="numeric"
          maxLength={13}
          style={styles.input}
          error={!!errors.idNumber}
          outlineColor={COLORS.border}
          activeOutlineColor={COLORS.primary}
        />
        <HelperText type={errors.idNumber ? 'error' : 'info'} visible>
          {errors.idNumber ?? '13-digit SA ID number (optional)'}
        </HelperText>

        <TextInput
          label="Password *"
          value={password}
          onChangeText={setPassword}
          mode="outlined"
          secureTextEntry={!passwordVisible}
          style={styles.input}
          error={!!errors.password}
          outlineColor={COLORS.border}
          activeOutlineColor={COLORS.primary}
          right={
            <TextInput.Icon
              icon={passwordVisible ? 'eye-off' : 'eye'}
              onPress={() => setPasswordVisible((v) => !v)}
              color={COLORS.textSecondary}
            />
          }
        />
        <HelperText type={errors.password ? 'error' : 'info'} visible>
          {errors.password ?? 'At least 8 characters'}
        </HelperText>

        <PasswordStrengthIndicator password={password} />

        <TextInput
          label="Confirm Password *"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          mode="outlined"
          secureTextEntry={!confirmPasswordVisible}
          style={[styles.input, { marginTop: SPACING.sm }]}
          error={!!errors.confirmPassword}
          outlineColor={COLORS.border}
          activeOutlineColor={COLORS.primary}
          right={
            <TextInput.Icon
              icon={confirmPasswordVisible ? 'eye-off' : 'eye'}
              onPress={() => setConfirmPasswordVisible((v) => !v)}
              color={COLORS.textSecondary}
            />
          }
        />
        {!!errors.confirmPassword && (
          <HelperText type="error" visible>
            {errors.confirmPassword}
          </HelperText>
        )}

        <Button
          mode="contained"
          onPress={handleNextStep3}
          style={styles.nextButton}
          contentStyle={styles.nextButtonContent}
          buttonColor={COLORS.primary}
          labelStyle={styles.nextButtonLabel}
        >
          Next →
        </Button>
      </View>
    );
  }

  // ── Step 4: OTP Verification ─────────────────────────────────────────────

  function renderStep4() {
    const displayPhone = normalizePhone(phone);

    return (
      <View>
        <Text style={styles.stepTitle}>Verify Your Number</Text>
        <Text style={styles.stepSubtitle}>
          We&apos;ll send a verification code to {displayPhone}
        </Text>

        {!otpSent ? (
          <>
            <Surface style={styles.phonePreview} elevation={1}>
              <Text style={styles.phonePreviewLabel}>Phone number</Text>
              <Text style={styles.phonePreviewValue}>{displayPhone}</Text>
            </Surface>

            <Button
              mode="contained"
              onPress={handleSendOtp}
              loading={isLoading}
              disabled={isLoading}
              style={styles.nextButton}
              contentStyle={styles.nextButtonContent}
              buttonColor={COLORS.primary}
              labelStyle={styles.nextButtonLabel}
            >
              Send Verification Code
            </Button>
          </>
        ) : (
          <>
            <View style={styles.otpSentRow}>
              <Text style={styles.otpSentText}>✓ Code sent to {displayPhone}</Text>
            </View>

            <TextInput
              label="Verification Code"
              value={otpCode}
              onChangeText={setOtpCode}
              mode="outlined"
              keyboardType="numeric"
              maxLength={6}
              style={styles.otpInput}
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.primary}
              contentStyle={styles.otpInputContent}
            />

            <Button
              mode="contained"
              onPress={handleRegister}
              loading={isLoading}
              disabled={isLoading}
              style={[styles.nextButton, { marginTop: SPACING.md }]}
              contentStyle={styles.nextButtonContent}
              buttonColor={COLORS.secondary}
              labelStyle={styles.nextButtonLabel}
            >
              Create Account
            </Button>
          </>
        )}
      </View>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Fixed Header */}
      <SafeAreaView style={styles.header} edges={['top']}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Create Account</Text>

          {/* Spacer to balance back button */}
          <View style={styles.headerSpacer} />
        </View>

        {renderProgressBar()}
      </SafeAreaView>

      {/* Scrollable Body */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </ScrollView>

      {/* Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },

  // ── Header ──
  header: {
    backgroundColor: COLORS.primary,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 52,
  },
  backButton: {
    width: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  backButtonText: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },

  // ── Progress ──
  progressContainer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  progressSegments: {
    flexDirection: 'row',
  },
  progressSegment: {
    flex: 1,
    height: 4,
    marginHorizontal: 2,
    borderRadius: 2,
  },
  progressLabels: {
    flexDirection: 'row',
    marginTop: 4,
  },
  progressLabel: {
    flex: 1,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 9,
    textAlign: 'center',
  },

  // ── Body ──
  body: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  bodyContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },

  // ── Step headers ──
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  stepSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },

  // ── Inputs ──
  input: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.surface,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },

  // ── Gender ──
  genderRow: {
    flexDirection: 'row',
    marginTop: SPACING.xs,
  },
  genderCard: {
    flex: 1,
    margin: 4,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#EEF4FF',
  },
  genderCardUnselected: {
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  genderCardText: {
    fontSize: 14,
  },

  // ── Next button ──
  nextButton: {
    marginTop: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
  },
  nextButtonContent: {
    height: 48,
  },
  nextButtonLabel: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // ── Language grid ──
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -SPACING.xs / 2,
    marginBottom: SPACING.sm,
  },
  languageCard: {
    height: 90,
    margin: SPACING.xs / 2,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  languageFlag: {
    fontSize: 24,
    textAlign: 'center',
  },
  languageName: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  languageNative: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },

  // ── Password strength ──
  strengthRow: {
    flexDirection: 'row',
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
    gap: SPACING.xs,
  },
  strengthPill: {
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  strengthPillText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // ── OTP step ──
  phonePreview: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginVertical: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  phonePreviewLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  phonePreviewValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 1,
  },
  otpSentRow: {
    marginVertical: SPACING.md,
    backgroundColor: '#D4EDDA',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  otpSentText: {
    color: COLORS.success,
    fontSize: 14,
    fontWeight: '600',
  },
  otpInput: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.surface,
  },
  otpInputContent: {
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 8,
  },

  // ── Snackbar ──
  snackbar: {
    backgroundColor: COLORS.text,
    marginBottom: SPACING.sm,
  },
});
