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
  Chip,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { authApi, AuthRegisterDoctorPayload } from '@api/endpoints';
import { useAuthStore } from '@store/authStore';
import { SA_LANGUAGES } from '@constants/languages';
import { COLORS, SPACING, BORDER_RADIUS } from '@constants/theme';

// ─── Types ───────────────────────────────────────────────────────────────────

type DoctorType = 'gp' | 'specialist' | 'allied_health' | 'travelling';

const DOCTOR_TYPE_OPTIONS: { value: DoctorType; label: string; description: string }[] = [
  { value: 'gp', label: 'General Practitioner', description: 'Primary care / family medicine' },
  { value: 'specialist', label: 'Specialist', description: 'Specialist with referral practice' },
  { value: 'allied_health', label: 'Allied Health', description: 'Physiotherapy, nursing, etc.' },
  { value: 'travelling', label: 'Travelling Doctor', description: 'Rural/remote visit-based practice' },
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

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function RegisterDoctorScreen() {
  const navigation = useNavigation();
  const { login } = useAuthStore();

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
  const [practiceName, setPracticeName] = useState('');
  const [consultationFee, setConsultationFee] = useState('');

  // Step 3 — Languages
  const [languagesSpoken, setLanguagesSpoken] = useState<string[]>(['en']);

  // Step 4 — Security
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  // ── Helpers ────────────────────────────────────────────────────────────────

  function showError(message: string) {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  }

  function validateStep1(): boolean {
    const errs: Record<string, string> = {};
    if (!firstName.trim()) errs.firstName = 'First name is required.';
    if (!lastName.trim()) errs.lastName = 'Last name is required.';
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
    if (!hpcsaNumber.trim()) {
      errs.hpcsaNumber = 'HPCSA number is required.';
    } else if (hpcsaNumber.trim().length < 4) {
      errs.hpcsaNumber = 'HPCSA number must be at least 4 characters.';
    }
    if (!consultationFee.trim() || isNaN(Number(consultationFee))) {
      errs.consultationFee = 'Enter a valid consultation fee (ZAR).';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateStep4(): boolean {
    const errs: Record<string, string> = {};
    if (!password) {
      errs.password = 'Password is required.';
    } else if (password.length < 8) {
      errs.password = 'Password must be at least 8 characters.';
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

  async function handleRegister() {
    if (!validateStep4()) return;

    const payload: AuthRegisterDoctorPayload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: normalizePhone(phone),
      email: email.trim().toLowerCase(),
      password,
      hpcsaNumber: hpcsaNumber.trim().toUpperCase(),
      doctorType: doctorType as DoctorType,
      specialization: specialization.trim() || undefined,
      languagesSpoken,
      consultationFee: Number(consultationFee),
      practiceName: practiceName.trim() || undefined,
    };

    setIsLoading(true);
    try {
      await authApi.registerDoctor(payload);
      await login(normalizePhone(phone), password);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Registration failed. Please check your details and try again.';
      showError(message);
    } finally {
      setIsLoading(false);
    }
  }

  // ── Progress Bar ────────────────────────────────────────────────────────────

  const stepLabels = ['1. Personal', '2. Practice', '3. Languages', '4. Security'];

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

        <TextInput
          label="Practice Name (optional)"
          value={practiceName}
          onChangeText={setPracticeName}
          mode="outlined"
          style={styles.input}
          outlineColor={COLORS.border}
          activeOutlineColor={COLORS.primary}
        />

        <TextInput
          label="Consultation Fee (ZAR) *"
          value={consultationFee}
          onChangeText={setConsultationFee}
          mode="outlined"
          keyboardType="numeric"
          placeholder="e.g. 800"
          style={styles.input}
          error={!!errors.consultationFee}
          outlineColor={COLORS.border}
          activeOutlineColor={COLORS.primary}
          left={<TextInput.Affix text="R" />}
        />
        {!!errors.consultationFee && <HelperText type="error" visible>{errors.consultationFee}</HelperText>}

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

  // ── Step 3: Languages ───────────────────────────────────────────────────────

  function renderStep3() {
    function toggleLanguage(code: string) {
      setLanguagesSpoken((prev) =>
        prev.includes(code) ? prev.filter((l) => l !== code) : [...prev, code]
      );
    }

    return (
      <View>
        <Text style={styles.stepTitle}>Languages Spoken</Text>
        <Text style={styles.stepSubtitle}>
          Select all languages you can consult in. Patients will be matched based on their preferred language.
        </Text>

        <View style={styles.chipGrid}>
          {SA_LANGUAGES.map((lang) => {
            const selected = languagesSpoken.includes(lang.code);
            return (
              <Chip
                key={lang.code}
                selected={selected}
                onPress={() => toggleLanguage(lang.code)}
                style={[
                  styles.langChip,
                  { backgroundColor: selected ? COLORS.primary : COLORS.surfaceVariant },
                ]}
                textStyle={{ color: selected ? COLORS.white : COLORS.text, fontSize: 13 }}
                icon={lang.flag ? () => <Text style={{ fontSize: 14 }}>{lang.flag}</Text> : undefined}
              >
                {lang.name}
              </Chip>
            );
          })}
        </View>

        {languagesSpoken.length === 0 && (
          <HelperText type="error" visible>
            Please select at least one language.
          </HelperText>
        )}

        <Button
          mode="contained"
          onPress={() => {
            if (languagesSpoken.length === 0) {
              showError('Please select at least one language.');
              return;
            }
            setCurrentStep(4);
          }}
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

  // ── Step 4: Security ────────────────────────────────────────────────────────

  function renderStep4() {
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
        {currentStep === 4 && renderStep4()}
      </ScrollView>

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

  nextButton: { marginTop: SPACING.lg, borderRadius: BORDER_RADIUS.md },
  nextButtonContent: { height: 48 },
  nextButtonLabel: { fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },

  snackbar: { backgroundColor: COLORS.text, marginBottom: SPACING.sm },
});
