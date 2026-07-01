import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { patientApi, PatientProfileUpdatePayload } from '../../api/endpoints';
import { ProfilePhotoUpload } from '../../components/ProfilePhotoUpload';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';

const SA_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'zu', label: 'Zulu (isiZulu)' },
  { code: 'xh', label: 'Xhosa (isiXhosa)' },
  { code: 'af', label: 'Afrikaans' },
  { code: 'nso', label: 'Sepedi' },
  { code: 'tn', label: 'Setswana' },
  { code: 'st', label: 'Sesotho' },
  { code: 'ts', label: 'Xitsonga' },
  { code: 've', label: 'Tshivenda' },
  { code: 'ss', label: 'Siswati' },
  { code: 'nr', label: 'isiNdebele' },
];

const apiErrorMessage = (err: unknown, fallback: string): string =>
  (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? fallback;

interface PatientMeResponse {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  preferredLanguage?: string;
  idNumber?: string;
  emergencyContact?: { name?: string; phone?: string; relationship?: string } | null;
  user?: { email?: string; phone?: string };
}

export const EditPatientProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, updateUser } = useAuthStore();
  const patient = user?.patient;

  const [firstName, setFirstName] = useState(patient?.firstName ?? '');
  const [lastName, setLastName] = useState(patient?.lastName ?? '');
  const [preferredLanguage, setPreferredLanguage] = useState(patient?.preferredLanguage ?? 'en');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [emergencyContactRelation, setEmergencyContactRelation] = useState('');
  const [idNumber, setIdNumber] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Prefill from GET /patients/me (has the decrypted emergency contact & ID number)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await patientApi.getProfile();
        const me = response.data.data as PatientMeResponse;
        if (cancelled) return;
        setFirstName(me.firstName ?? '');
        setLastName(me.lastName ?? '');
        setPreferredLanguage(me.preferredLanguage ?? 'en');
        setIdNumber(me.idNumber ?? null);
        if (me.emergencyContact) {
          setEmergencyContactName(me.emergencyContact.name ?? '');
          setEmergencyContactPhone(me.emergencyContact.phone ?? '');
          setEmergencyContactRelation(me.emergencyContact.relationship ?? '');
        }
      } catch {
        // Fall back to the auth store values already set above
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const dob = patient?.dateOfBirth
    ? new Date(patient.dateOfBirth).toLocaleDateString('en-ZA', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '—';

  const genderDisplay = patient?.gender
    ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1).toLowerCase()
    : '—';

  const displayName = `${firstName || patient?.firstName || ''} ${lastName || patient?.lastName || ''}`.trim() || 'Patient';

  const handleSave = useCallback(async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Missing Fields', 'First and last name are required.');
      return;
    }

    setIsSaving(true);
    try {
      const payload: PatientProfileUpdatePayload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        preferredLanguage,
      };
      if (emergencyContactName.trim() && emergencyContactPhone.trim()) {
        payload.emergencyContact = {
          name: emergencyContactName.trim(),
          phone: emergencyContactPhone.trim(),
          relationship: emergencyContactRelation.trim() || 'Other',
        };
      }

      await patientApi.updateProfile(payload);

      if (user?.patient) {
        updateUser({
          patient: {
            ...user.patient,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            preferredLanguage,
          },
        });
      }

      Alert.alert('Saved', 'Your profile has been updated.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: unknown) {
      Alert.alert('Error', apiErrorMessage(err, 'Failed to save profile. Please try again.'));
    } finally {
      setIsSaving(false);
    }
  }, [
    firstName,
    lastName,
    preferredLanguage,
    emergencyContactName,
    emergencyContactPhone,
    emergencyContactRelation,
    user,
    updateUser,
    navigation,
  ]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading your profile…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={28} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.85}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile Photo */}
          <View style={styles.photoSection}>
            <ProfilePhotoUpload displayName={displayName} size={100} />
          </View>

          {/* Read-only fields */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Identity</Text>
            <View style={styles.readOnlyRow}>
              <Text style={styles.readOnlyLabel}>Date of Birth</Text>
              <Text style={styles.readOnlyValue}>{dob}</Text>
            </View>
            <View style={styles.readOnlyRow}>
              <Text style={styles.readOnlyLabel}>Gender</Text>
              <Text style={styles.readOnlyValue}>{genderDisplay}</Text>
            </View>
            {idNumber ? (
              <View style={styles.readOnlyRow}>
                <Text style={styles.readOnlyLabel}>ID Number</Text>
                <Text style={styles.readOnlyValue}>
                  {idNumber.replace(/(\d{6})(\d{4})(\d{1})(\d{1})(\d{1})/, '$1 $2 $3 $4 $5')}
                </Text>
              </View>
            ) : null}
            <Text style={styles.readOnlyNote}>
              Identity information cannot be changed. Contact support if there is an error.
            </Text>
          </View>

          {/* Editable personal details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Details</Text>

            <Text style={styles.fieldLabel}>First Name</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First name"
              placeholderTextColor={COLORS.textLight}
              autoCapitalize="words"
              returnKeyType="next"
            />

            <Text style={styles.fieldLabel}>Last Name</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last name"
              placeholderTextColor={COLORS.textLight}
              autoCapitalize="words"
              returnKeyType="next"
            />

            <Text style={styles.fieldLabel}>Email Address</Text>
            <View style={[styles.input, styles.readOnlyInput]}>
              <Text style={styles.readOnlyInputText}>{user?.email ?? '—'}</Text>
            </View>

            <Text style={styles.fieldLabel}>Phone Number</Text>
            <View style={[styles.input, styles.readOnlyInput]}>
              <Text style={styles.readOnlyInputText}>{user?.phone ?? '—'}</Text>
            </View>
            <Text style={styles.readOnlyNote}>
              Email and phone number cannot be changed here.
            </Text>
          </View>

          {/* Preferred Language */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferred Language</Text>
            <Text style={styles.fieldHint}>Used for AI consultations and communications</Text>
            <View style={styles.languageGrid}>
              {SA_LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageChip,
                    preferredLanguage === lang.code && styles.languageChipActive,
                  ]}
                  onPress={() => setPreferredLanguage(lang.code)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.languageChipText,
                      preferredLanguage === lang.code && styles.languageChipTextActive,
                    ]}
                  >
                    {lang.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Emergency Contact */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Emergency Contact</Text>
            <Text style={styles.fieldHint}>
              Used in emergencies if you are unable to speak for yourself
            </Text>

            <Text style={styles.fieldLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={emergencyContactName}
              onChangeText={setEmergencyContactName}
              placeholder="e.g. Jane Doe"
              placeholderTextColor={COLORS.textLight}
              autoCapitalize="words"
              returnKeyType="next"
            />

            <Text style={styles.fieldLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={emergencyContactPhone}
              onChangeText={setEmergencyContactPhone}
              placeholder="e.g. +27 82 123 4567"
              placeholderTextColor={COLORS.textLight}
              keyboardType="phone-pad"
              returnKeyType="next"
            />

            <Text style={styles.fieldLabel}>Relationship</Text>
            <TextInput
              style={styles.input}
              value={emergencyContactRelation}
              onChangeText={setEmergencyContactRelation}
              placeholder="e.g. Spouse, Parent, Sibling"
              placeholderTextColor={COLORS.textLight}
              autoCapitalize="words"
              returnKeyType="done"
            />
          </View>

          {/* Save button (bottom) */}
          <TouchableOpacity
            style={[styles.bottomSaveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.85}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.bottomSaveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>

          <View style={{ height: SPACING.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    minHeight: 44,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: FONT_SIZE.md,
  },
  content: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  readOnlyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  readOnlyLabel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  readOnlyValue: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    fontWeight: '600',
  },
  readOnlyNote: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
    marginTop: SPACING.sm,
    fontStyle: 'italic',
  },
  fieldLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  fieldHint: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
    marginBottom: SPACING.md,
    marginTop: -SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 44,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  readOnlyInput: {
    backgroundColor: COLORS.systemGray6,
    justifyContent: 'center',
  },
  readOnlyInputText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  languageChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  languageChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.healingTeal,
  },
  languageChipText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  languageChipTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  bottomSaveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    ...SHADOWS.sm,
  },
  bottomSaveButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: FONT_SIZE.md,
  },
});

export default EditPatientProfileScreen;
