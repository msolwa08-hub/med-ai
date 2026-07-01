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
import { setAuthTokens } from '@api/client';
import { useAuthStore, User } from '@store/authStore';
import { SA_LANGUAGES } from '@constants/languages';
import { COLORS, SPACING, BORDER_RADIUS } from '@constants/theme';
import TermsConsentModal from '../../components/TermsConsentModal';

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

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

// Must match the API's zod schema: min 8 chars, 1 uppercase, 1 number
function passwordRuleError(value: string): string | null {
  if (value.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(value)) return 'Password must contain at least one uppercase letter.';
  if (!/[0-9]/.test(value)) return 'Password must contain at least one number.';
  return null;
}

type Gender = AuthRegisterPatientPayload['gender'];

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
];

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
  const { setUser } = useAuthStore();

  // Step state
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Step 1
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');

  // Step 2
  const [preferredLanguage, setPreferredLanguage] = useState('en');

  // Step 3
  const [idNumber, setIdNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  // Consent modal
  const [showConsent, setShowConsent] = useState(false);

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Validation helpers ──────────────────────────────────────────────────

  function showError(message: string) {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  }

  function validateStep1(): boolean {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required.';
    } else if (firstName.trim().length < 2 || firstName.trim().length > 50) {
      newErrors.firstName = 'First name must be 2-50 characters.';
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required.';
    } else if (lastName.trim().length < 2 || lastName.trim().length > 50) {
      newErrors.lastName = 'Last name must be 2-50 characters.';
    }

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

    if (!email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Enter a valid email address.';
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
    } else {
      const ruleError = passwordRuleError(password);
      if (ruleError) newErrors.password = ruleError;
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

  // ── Registration ────────────────────────────────────────────────────────

  function handleRegister() {
    setShowConsent(true);
  }

  async function handleConsentAccept() {
    setShowConsent(false);

    // Payload mirrors the API's zod schema exactly — gender is UPPERCASE,
    // idNumber is omitted when blank.
    const payload: AuthRegisterPatientPayload = {
      email: email.trim().toLowerCase(),
      phone: normalizePhone(phone),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      dateOfBirth: dateOfBirth.trim(),
      gender: gender as Gender,
      preferredLanguage,
      ...(idNumber.trim() ? { idNumber: idNumber.trim() } : {}),
    };

    setIsLoading(true);
    try {
      // 201 → { success, data: { accessToken, refreshToken, expiresIn, user } }
      const response = await authApi.registerPatient(payload);
      const { accessToken, refreshToken, user } = response.data.data;
      await setAuthTokens(accessToken, refreshToken);

      // Fetch the full profile so the store has the nested patient record;
      // fall back to the minimal user returned by /auth/register.
      let fullUser: User = user;
      try {
        const me = await authApi.getMe();
        fullUser = me.data.data.user as User;
      } catch {
        // Minimal user is enough to enter the app; profile loads later.
      }
      setUser(fullUser);
      // RootNavigator switches stacks on auth state change.
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? 'Registration failed. Please check your details and try again.';
      showError(message);
    } finally {
      setIsLoading(false);
    }
  }

  // ── Progress Bar ───────────────────────────────────────────────────────

  const stepLabels = ['1. Info', '2. Language', '3. Security', '4. Review'];

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
          {GENDER_OPTIONS.map(({ value, label }) => {
            const selected = gender === value;
            return (
              <TouchableOpacity
                key={value}
                style={[
                  styles.genderCard,
                  selected
                    ? styles.genderCardSelected
                    : styles.genderCardUnselected,
                ]}
                onPress={() => {
                  setGender(value);
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
                  numberOfLines={1}
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
          autoComplete="tel"
          textContentType="telephoneNumber"
          style={styles.input}
          error={!!errors.phone}
          outlineColor={COLORS.border}
          activeOutlineColor={COLORS.primary}
        />
        <HelperText type={errors.phone ? 'error' : 'info'} visible>
          {errors.phone ?? 'South African number required'}
        </HelperText>

        <TextInput
          label="Email Address *"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          style={styles.input}
          error={!!errors.email}
          outlineColor={COLORS.border}
          activeOutlineColor={COLORS.primary}
        />
        <HelperText type={errors.email ? 'error' : 'info'} visible>
          {errors.email ?? 'Used to sign in and for important updates'}
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
          {errors.password ?? 'Min. 8 characters, with 1 uppercase letter and 1 number'}
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

  // ── Step 4: Review & Create ──────────────────────────────────────────────

  function renderStep4() {
    const displayPhone = normalizePhone(phone);
    const genderLabel = GENDER_OPTIONS.find((g) => g.value === gender)?.label ?? '—';
    const languageLabel =
      SA_LANGUAGES.find((l) => l.code === preferredLanguage)?.name ?? preferredLanguage;

    const reviewRows: { label: string; value: string }[] = [
      { label: 'Name', value: `${firstName.trim()} ${lastName.trim()}` },
      { label: 'Date of birth', value: dateOfBirth.trim() },
      { label: 'Gender', value: genderLabel },
      { label: 'Phone', value: displayPhone },
      { label: 'Email', value: email.trim().toLowerCase() },
      { label: 'Preferred language', value: languageLabel },
      ...(idNumber.trim() ? [{ label: 'SA ID number', value: idNumber.trim() }] : []),
    ];

    return (
      <View>
        <Text style={styles.stepTitle}>Review Your Details</Text>
        <Text style={styles.stepSubtitle}>
          Make sure everything is correct before creating your account.
        </Text>

        <Surface style={styles.reviewCard} elevation={1}>
          {reviewRows.map((row, index) => (
            <View
              key={row.label}
              style={[styles.reviewRow, index > 0 && styles.reviewRowBorder]}
            >
              <Text style={styles.reviewLabel}>{row.label}</Text>
              <Text style={styles.reviewValue} numberOfLines={2}>
                {row.value}
              </Text>
            </View>
          ))}
        </Surface>

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

      {/* POPIA consent modal — shown before completing registration */}
      <TermsConsentModal
        visible={showConsent}
        onAccept={handleConsentAccept}
        onDecline={() => setShowConsent(false)}
      />
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
    flexWrap: 'wrap',
    marginTop: SPACING.xs,
    marginHorizontal: -4,
  },
  genderCard: {
    flexGrow: 1,
    flexBasis: '45%',
    margin: 4,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.healingMint,
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

  // ── Review step ──
  reviewCard: {
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    marginTop: SPACING.sm,
    overflow: 'hidden',
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    gap: SPACING.md,
  },
  reviewRowBorder: {
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  reviewLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flexShrink: 0,
  },
  reviewValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
    textAlign: 'right',
  },

  // ── Snackbar ──
  snackbar: {
    backgroundColor: COLORS.text,
    marginBottom: SPACING.sm,
  },
});
