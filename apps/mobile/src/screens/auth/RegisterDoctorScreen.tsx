import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Snackbar,
  HelperText,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { authApi, AuthRegisterDoctorPayload } from '@api/endpoints';
import { setAuthTokens } from '@api/client';
import { useAuthStore, User } from '@store/authStore';
import { COLORS, SPACING, BORDER_RADIUS } from '@constants/theme';
import TermsConsentModal from '../../components/TermsConsentModal';

// ─── Types ───────────────────────────────────────────────────────────────────

// UPPERCASE — must match the API's zod enum exactly
type DoctorType = AuthRegisterDoctorPayload['doctorType'];

const DOCTOR_TYPE_OPTIONS: { value: DoctorType; label: string; description: string }[] = [
  { value: 'GP', label: 'General Practitioner', description: 'Primary care / family medicine' },
  { value: 'SPECIALIST', label: 'Specialist', description: 'Specialist with referral practice' },
  { value: 'ALLIED_HEALTH', label: 'Allied Health', description: 'Physiotherapy, nursing, etc.' },
  { value: 'TRAVELLING', label: 'Travelling Doctor', description: 'Rural/remote visit-based practice' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizePhone(raw: string): string {
  const cleaned = raw.replace(/\s+/g, '').replace(/-/g, '');
  if (cleaned.startsWith('+27')) return cleaned;
  if (cleaned.startsWith('0')) return '+27' + cleaned.slice(1);
  return cleaned;
}

function isValidPhone(raw: string): boolean {
  return /^\+27[0-9]{9}$/.test(normalizePhone(raw));
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Must match the API's zod schema: min 8 chars, 1 uppercase, 1 number
function passwordRuleError(value: string): string | null {
  if (value.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(value)) return 'Password must contain at least one uppercase letter.';
  if (!/[0-9]/.test(value)) return 'Password must contain at least one number.';
  return null;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function RegisterDoctorScreen() {
  const navigation = useNavigation();
  const { setUser } = useAuthStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Step 1 — Personal
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Step 2 — Professional
  const [doctorType, setDoctorType] = useState<DoctorType | ''>('');
  const [specialization, setSpecialization] = useState('');
  const [hpcsaNumber, setHpcsaNumber] = useState('');

  // Step 3 — Security
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  // Consent modal
  const [showConsent, setShowConsent] = useState(false);

  // ── Helpers ────────────────────────────────────────────────────────────────

  function showError(message: string) {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  }

  function validateStep1(): boolean {
    const errs: Record<string, string> = {};
    if (!firstName.trim()) {
      errs.firstName = 'First name is required.';
    } else if (firstName.trim().length < 2 || firstName.trim().length > 50) {
      errs.firstName = 'First name must be 2-50 characters.';
    }
    if (!lastName.trim()) {
      errs.lastName = 'Last name is required.';
    } else if (lastName.trim().length < 2 || lastName.trim().length > 50) {
      errs.lastName = 'Last name must be 2-50 characters.';
    }
    if (!phone.trim()) {
      errs.phone = 'Phone number is required.';
    } else if (!isValidPhone(phone)) {
      errs.phone = 'Enter a valid South African number (e.g. 082 123 4567).';
    }
    if (!email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!isValidEmail(email.trim())) {
      errs.email = 'Enter a valid email address.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateStep2(): boolean {
    const errs: Record<string, string> = {};
    if (!doctorType) errs.doctorType = 'Please select your practice type.';
    const hpcsa = hpcsaNumber.trim();
    if (!hpcsa) {
      errs.hpcsaNumber = 'HPCSA number is required.';
    } else if (hpcsa.length < 5 || hpcsa.length > 20) {
      errs.hpcsaNumber = 'HPCSA number must be 5-20 characters.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateStep3(): boolean {
    const errs: Record<string, string> = {};
    if (!password) {
      errs.password = 'Password is required.';
    } else {
      const ruleError = passwordRuleError(password);
      if (ruleError) errs.password = ruleError;
    }
    if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  function handleBack() {
    if (currentStep === 1) {
      navigation.goBack();
    } else {
      setCurrentStep((s) => s - 1);
      setErrors({});
    }
  }

  // ── Registration ───────────────────────────────────────────────────────────

  function handleRegister() {
    if (!validateStep3()) return;
    setShowConsent(true);
  }

  async function handleConsentAccept() {
    setShowConsent(false);

    // Only the fields the API's zod schema accepts at registration.
    // Languages, consultation fee and practice name are set later via the profile.
    const payload: AuthRegisterDoctorPayload = {
      email: email.trim().toLowerCase(),
      phone: normalizePhone(phone),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      hpcsaNumber: hpcsaNumber.trim().toUpperCase(),
      doctorType: doctorType as DoctorType,
      ...(specialization.trim() ? { specialization: specialization.trim() } : {}),
    };

    setIsLoading(true);
    try {
      // 201 → { success, data: { accessToken, refreshToken, expiresIn, user } }
      const response = await authApi.registerDoctor(payload);
      const { accessToken, refreshToken, user } = response.data.data;
      await setAuthTokens(accessToken, refreshToken);

      // Fetch the full profile so the store has the nested doctor record
      // (hpcsaStatus etc.); fall back to the minimal /auth/register user.
      let fullUser: User = user;
      try {
        const me = await authApi.getMe();
        fullUser = me.data.data.user as User;
      } catch {
        // Minimal user is enough to enter the app; profile loads later.
      }
      setUser(fullUser);
      // RootNavigator routes to HPCSA verification / dashboard on auth change.
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Registration failed. Please check your details and try again.';
      showError(message);
    } finally {
      setIsLoading(false);
    }
  }

  // ── Progress Bar ────────────────────────────────────────────────────────────

  const stepLabels = ['1. Personal', '2. Practice', '3. Security'];

  function renderProgressBar() {
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressSegments}>
          {stepLabels.map((_, index) => {
            const isCompleted = index + 1 <= currentStep;
            return (
              <View
                key={index}
                style={[
                  styles.progressSegment,
                  { backgroundColor: isCompleted ? COLORS.secondary : 'rgba(255,255,255,0.3)' },
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

  // ── Step 1: Personal ────────────────────────────────────────────────────────

  function renderStep1() {
    return (
      <View>
        <Text style={styles.stepTitle}>Personal Details</Text>
        <Text style={styles.stepSubtitle}>Your basic information as it appears on your HPCSA certificate.</Text>

        <TextInput
          label="First Name *"
          value={firstName}
          onChangeText={setFirstName}
          mode="outlined"
          autoCapitalize="words"
          style={styles.input}
          error={!!errors.firstName}
          outlineColor={COLORS.border}
          activeOutlineColor={COLORS.primary}
        />
        {!!errors.firstName && <HelperText type="error" visible>{errors.firstName}</HelperText>}

        <TextInput
          label="Last Name *"
          value={lastName}
          onChangeText={setLastName}
          mode="outlined"
          autoCapitalize="words"
          style={styles.input}
          error={!!errors.lastName}
          outlineColor={COLORS.border}
          activeOutlineColor={COLORS.primary}
        />
        {!!errors.lastName && <HelperText type="error" visible>{errors.lastName}</HelperText>}

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

        <TextInput
          label="Email Address *"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
          error={!!errors.email}
          outlineColor={COLORS.border}
          activeOutlineColor={COLORS.primary}
        />
        {!!errors.email && <HelperText type="error" visible>{errors.email}</HelperText>}

        <Button
          mode="contained"
          onPress={() => { if (validateStep1()) { setErrors({}); setCurrentStep(2); } }}
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

  // ── Step 2: Practice ────────────────────────────────────────────────────────

  function renderStep2() {
    return (
      <View>
        <Text style={styles.stepTitle}>Practice Details</Text>
        <Text style={styles.stepSubtitle}>Your professional information for HPCSA verification.</Text>

        <Text style={styles.fieldLabel}>Practice Type *</Text>
        {DOCTOR_TYPE_OPTIONS.map((opt) => {
          const selected = doctorType === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.typeCard, selected && styles.typeCardSelected]}
              onPress={() => {
                setDoctorType(opt.value);
                setErrors((e) => ({ ...e, doctorType: '' }));
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.typeLabel, { color: selected ? COLORS.primary : COLORS.text }]}>
                {opt.label}
              </Text>
              <Text style={styles.typeDesc}>{opt.description}</Text>
            </TouchableOpacity>
          );
        })}
        {!!errors.doctorType && <HelperText type="error" visible>{errors.doctorType}</HelperText>}

        <TextInput
          label="HPCSA Registration Number *"
          value={hpcsaNumber}
          onChangeText={setHpcsaNumber}
          mode="outlined"
          autoCapitalize="characters"
          style={styles.input}
          error={!!errors.hpcsaNumber}
          outlineColor={COLORS.border}
          activeOutlineColor={COLORS.primary}
        />
        <HelperText type={errors.hpcsaNumber ? 'error' : 'info'} visible>
          {errors.hpcsaNumber ?? 'Will be verified with HPCSA after registration'}
        </HelperText>

        <TextInput
          label="Specialization (optional)"
          value={specialization}
          onChangeText={setSpecialization}
          mode="outlined"
          placeholder="e.g. Cardiology, Paediatrics"
          style={styles.input}
          outlineColor={COLORS.border}
          activeOutlineColor={COLORS.primary}
        />

        <View style={styles.profileLaterNotice}>
          <Text style={styles.profileLaterNoticeText}>
            Consultation fee, practice name and the languages you consult in are set up
            later in your profile.
          </Text>
        </View>

        <Button
          mode="contained"
          onPress={() => { if (validateStep2()) { setErrors({}); setCurrentStep(3); } }}
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

  // ── Step 3: Security ────────────────────────────────────────────────────────

  function renderStep3() {
    return (
      <View>
        <Text style={styles.stepTitle}>Account Security</Text>
        <Text style={styles.stepSubtitle}>
          Set a strong password to protect patient data.
        </Text>

        <View style={styles.hpcsaNotice}>
          <Text style={styles.hpcsaNoticeText}>
            After registration you will need to verify your HPCSA number before accessing patient records. This is required by the Health Professions Act.
          </Text>
        </View>

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
          <HelperText type="error" visible>{errors.confirmPassword}</HelperText>
        )}

        <Button
          mode="contained"
          onPress={handleRegister}
          loading={isLoading}
          disabled={isLoading}
          style={[styles.nextButton, { marginTop: SPACING.lg }]}
          contentStyle={styles.nextButtonContent}
          buttonColor={COLORS.secondary}
          labelStyle={styles.nextButtonLabel}
        >
          Create Doctor Account
        </Button>
      </View>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <SafeAreaView style={styles.header} edges={['top']}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Register as Doctor</Text>
          <View style={styles.headerSpacer} />
        </View>
        {renderProgressBar()}
      </SafeAreaView>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </ScrollView>

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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.primary },

  header: { backgroundColor: COLORS.primary },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 52,
  },
  backButton: { width: 40, alignItems: 'flex-start', justifyContent: 'center' },
  backButtonText: { color: COLORS.white, fontSize: 22, fontWeight: '600' },
  headerTitle: {
    flex: 1,
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerSpacer: { width: 40 },

  progressContainer: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm },
  progressSegments: { flexDirection: 'row' },
  progressSegment: { flex: 1, height: 4, marginHorizontal: 2, borderRadius: 2 },
  progressLabels: { flexDirection: 'row', marginTop: 4 },
  progressLabel: {
    flex: 1,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 9,
    textAlign: 'center',
  },

  body: { flex: 1, backgroundColor: COLORS.background },
  bodyContent: { padding: SPACING.md, paddingBottom: SPACING.xxl },

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

  input: { marginTop: SPACING.sm, backgroundColor: COLORS.surface },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },

  typeCard: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
  },
  typeCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#EEF4FF',
  },
  typeLabel: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  typeDesc: { fontSize: 13, color: COLORS.textSecondary },

  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  langChip: { marginBottom: 4 },

  hpcsaNotice: {
    backgroundColor: '#FFF3CD',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  hpcsaNoticeText: {
    fontSize: 13,
    color: '#856404',
    lineHeight: 19,
  },
  profileLaterNotice: {
    backgroundColor: COLORS.primary + '12',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  profileLaterNoticeText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
  },

  nextButton: { marginTop: SPACING.lg, borderRadius: BORDER_RADIUS.md },
  nextButtonContent: { height: 48 },
  nextButtonLabel: { fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },

  snackbar: { backgroundColor: COLORS.text, marginBottom: SPACING.sm },
});
