import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { consultationApi, diagnosisApi, documentsApi } from '../../api/endpoints';
import { useAuthStore } from '../../store/authStore';
import { BORDER_RADIUS, COLORS, FONT_SIZE, SHADOWS, SPACING } from '../../constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

type ManagementRouteParams = {
  ManagementPlanScreen: { consultationId: string };
};

type MedRoute = 'Oral' | 'IV' | 'IM' | 'Topical' | 'Inhaled' | 'Sublingual';
type MedFrequency = 'OD' | 'BD' | 'TDS' | 'QID' | 'PRN' | 'Stat';
type ReferralUrgency = 'ROUTINE' | 'URGENT' | 'EMERGENCY';

interface Medication {
  id: string;
  name: string;
  dose: string;
  route: MedRoute;
  frequency: MedFrequency;
  duration: string;
  instructions: string;
}

interface Referral {
  id: string;
  specialty: string;
  reason: string;
  urgency: ReferralUrgency;
}

interface MedForm {
  name: string;
  dose: string;
  route: MedRoute;
  frequency: MedFrequency;
  duration: string;
  instructions: string;
}

interface ReferralForm {
  specialty: string;
  reason: string;
  urgency: ReferralUrgency;
}

interface SickNoteForm {
  diagnosisText: string;
  icd10Code: string;
  dateOfConsultation: string;
  unfitFromDate: string;
  unfitToDate: string;
  daysOff: string;
  fitnessStatement: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COMMON_MEDS = [
  'Amoxicillin',
  'Metformin',
  'Amlodipine',
  'Atenolol',
  'Paracetamol',
  'Ibuprofen',
  'Omeprazole',
  'Metronidazole',
  'Cotrimoxazole',
  'Prednisone',
];

const ROUTES: MedRoute[] = ['Oral', 'IV', 'IM', 'Topical', 'Inhaled', 'Sublingual'];
const FREQUENCIES: Array<{ code: MedFrequency; label: string }> = [
  { code: 'OD', label: 'OD' },
  { code: 'BD', label: 'BD' },
  { code: 'TDS', label: 'TDS' },
  { code: 'QID', label: 'QID' },
  { code: 'PRN', label: 'PRN' },
  { code: 'Stat', label: 'Stat' },
];

const SPECIALTIES = [
  'General Surgery',
  'Internal Medicine',
  'Cardiology',
  'Pulmonology',
  'Neurology',
  'Orthopaedics',
  'OB/GYN',
  'Paediatrics',
  'Psychiatry',
  'Social Work',
];

const REFERRAL_URGENCIES: Array<{ code: ReferralUrgency; color: string; textColor: string }> = [
  { code: 'ROUTINE', color: COLORS.success, textColor: COLORS.white },
  { code: 'URGENT', color: COLORS.warning, textColor: COLORS.text },
  { code: 'EMERGENCY', color: COLORS.error, textColor: COLORS.white },
];

const DEFAULT_MED_FORM: MedForm = {
  name: '',
  dose: '',
  route: 'Oral',
  frequency: 'OD',
  duration: '',
  instructions: '',
};

const DEFAULT_REFERRAL_FORM: ReferralForm = {
  specialty: '',
  reason: '',
  urgency: 'ROUTINE',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English',
  zu: 'isiZulu',
  xh: 'isiXhosa',
  af: 'Afrikaans',
  nso: 'Sepedi',
  tn: 'Setswana',
  st: 'Sesotho',
  ts: 'Xitsonga',
  ss: 'siSwati',
  ve: 'Tshivenda',
  nr: 'isiNdebele',
};

function apiErrorMessage(error: unknown, fallback: string): string {
  const apiError = (error as { response?: { data?: { error?: string } } })?.response?.data;
  return apiError?.error ?? fallback;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const ManagementPlanScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<ManagementRouteParams, 'ManagementPlanScreen'>>();
  const { consultationId } = route.params;
  const { user } = useAuthStore();
  const doctor = user?.doctor;

  // Initial load
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Diagnosis (required by the management payload)
  const [diagnosis, setDiagnosis] = useState('');

  // Medications
  const [medications, setMedications] = useState<Medication[]>([]);
  const [showMedModal, setShowMedModal] = useState(false);
  const [medForm, setMedForm] = useState<MedForm>(DEFAULT_MED_FORM);

  // Procedures
  const [procedures, setProcedures] = useState('');

  // Referrals
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referralForm, setReferralForm] = useState<ReferralForm>(DEFAULT_REFERRAL_FORM);

  // Follow-up
  const [followUpDays, setFollowUpDays] = useState('');

  // Patient instructions
  const [patientInstructions, setPatientInstructions] = useState('');
  const [patientLanguage, setPatientLanguage] = useState('en');

  // Consultation data (patient info)
  const [consultation, setConsultation] = useState<any>(null);

  // Sick note
  const today = new Date().toISOString().split('T')[0];
  const [showSickNoteModal, setShowSickNoteModal] = useState(false);
  const [sickNoteForm, setSickNoteForm] = useState<SickNoteForm>({
    diagnosisText: '',
    icd10Code: '',
    dateOfConsultation: today,
    unfitFromDate: today,
    unfitToDate: '',
    daysOff: '',
    fitnessStatement: '',
  });
  const [generatingSickNote, setGeneratingSickNote] = useState(false);
  const [generatedSickNote, setGeneratedSickNote] = useState<string | null>(null);

  // Save / complete
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Load consultation (patient info + language) and the doctor-selected diagnosis
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const resp = await consultationApi.getById(consultationId);
      const data = resp.data.data;
      setConsultation(data);
      setPatientLanguage(data?.patient?.preferredLanguage || 'en');

      // Prefill the diagnosis chosen on the Diagnosis screen (404 if not yet generated)
      try {
        const diagResp = await diagnosisApi.get(consultationId);
        const selected = diagResp.data.data?.doctorSelectedDiagnosis;
        if (selected) {
          setDiagnosis((prev) => prev || selected);
          setSickNoteForm((f) => ({ ...f, diagnosisText: f.diagnosisText || selected }));
        }
      } catch {
        // No AI differential yet — doctor enters the diagnosis manually
      }
    } catch (err) {
      setLoadError(apiErrorMessage(err, 'Failed to load consultation.'));
    } finally {
      setIsLoading(false);
    }
  }, [consultationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Medication handlers ──────────────────────────────────────────────────────
  const saveMedication = useCallback(() => {
    if (!medForm.name.trim()) {
      Alert.alert('Missing name', 'Please enter a medication name.');
      return;
    }
    if (!medForm.dose.trim()) {
      Alert.alert('Missing dose', 'Please enter a dose.');
      return;
    }
    const med: Medication = {
      id: Date.now().toString(),
      ...medForm,
    };
    setMedications((prev) => [...prev, med]);
    setMedForm(DEFAULT_MED_FORM);
    setShowMedModal(false);
  }, [medForm]);

  const removeMedication = (id: string) => {
    setMedications((prev) => prev.filter((m) => m.id !== id));
  };

  // ── Referral handlers ────────────────────────────────────────────────────────
  const saveReferral = useCallback(() => {
    if (!referralForm.specialty.trim()) {
      Alert.alert('Missing specialty', 'Please enter or select a specialty.');
      return;
    }
    if (!referralForm.reason.trim()) {
      Alert.alert('Missing reason', 'Please enter a reason for referral.');
      return;
    }
    const ref: Referral = {
      id: Date.now().toString(),
      ...referralForm,
    };
    setReferrals((prev) => [...prev, ref]);
    setReferralForm(DEFAULT_REFERRAL_FORM);
    setShowReferralModal(false);
  }, [referralForm]);

  const removeReferral = (id: string) => {
    setReferrals((prev) => prev.filter((r) => r.id !== id));
  };

  // ── Complete consultation ────────────────────────────────────────────────────
  const handleComplete = async () => {
    if (!diagnosis.trim()) {
      Alert.alert('Missing diagnosis', 'Please enter a diagnosis before completing.');
      return;
    }
    if (medications.length === 0 && !procedures.trim() && referrals.length === 0) {
      Alert.alert(
        'Empty plan',
        'Please add at least one medication, procedure, or referral before completing.',
      );
      return;
    }
    const followUpDaysNum = parseInt(followUpDays, 10);
    if (followUpDays.trim() && (!Number.isFinite(followUpDaysNum) || followUpDaysNum <= 0)) {
      Alert.alert('Invalid follow-up', 'Follow-up must be a positive number of days.');
      return;
    }
    setIsSaving(true);
    try {
      await consultationApi.saveManagement({
        consultationId,
        diagnosis: diagnosis.trim(),
        medications: medications.map((m) => ({
          name: m.name,
          dose: m.dose,
          frequency: m.frequency,
          duration: m.duration || undefined,
          route: m.route,
          notes: m.instructions || undefined,
        })),
        procedures: procedures.trim() || undefined,
        referrals:
          referrals.length > 0
            ? referrals.map((r) => ({
                specialty: r.specialty,
                reason: r.reason,
                urgency: r.urgency,
              }))
            : undefined,
        followUpDays: followUpDays.trim() ? followUpDaysNum : undefined,
        patientInstructions: patientInstructions.trim() || undefined,
      });
      await consultationApi.completeConsultation(consultationId);
      setShowSuccessModal(true);
    } catch (err) {
      Alert.alert(
        'Error',
        apiErrorMessage(err, 'Failed to complete consultation. Please try again.'),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSuccessOk = () => {
    setShowSuccessModal(false);
    navigation.navigate('DoctorTabs');
  };

  const referralUrgencyColor = (u: ReferralUrgency) =>
    REFERRAL_URGENCIES.find((r) => r.code === u)?.color ?? COLORS.textSecondary;

  async function handleGenerateSickNote() {
    if (!sickNoteForm.diagnosisText.trim()) {
      Alert.alert('Missing diagnosis', 'Please enter a diagnosis.');
      return;
    }
    if (!sickNoteForm.unfitToDate.trim()) {
      Alert.alert('Missing date', 'Please enter the unfit-to date.');
      return;
    }
    setGeneratingSickNote(true);
    try {
      const patientName = consultation?.patient
        ? `${consultation.patient.firstName} ${consultation.patient.lastName}`
        : '';
      const resp = await documentsApi.generateSickNote({
        patientName,
        patientIdNumber: consultation?.patient?.idNumber,
        patientDateOfBirth: consultation?.patient?.dateOfBirth,
        doctorName: doctor ? `${doctor.firstName} ${doctor.lastName}` : '',
        doctorHpcsa: doctor?.hpcsaNumber ?? '',
        practiceName: doctor?.practiceName ?? 'MedAI Practice',
        diagnosisText: sickNoteForm.diagnosisText,
        icd10Code: sickNoteForm.icd10Code || undefined,
        dateOfConsultation: sickNoteForm.dateOfConsultation,
        unfitFromDate: sickNoteForm.unfitFromDate,
        unfitToDate: sickNoteForm.unfitToDate,
        daysOff: parseInt(sickNoteForm.daysOff, 10) || 1,
        fitnessStatement: sickNoteForm.fitnessStatement || undefined,
      });
      setGeneratedSickNote(resp.data.data?.sickNote?.certificateText ?? '');
    } catch (err) {
      Alert.alert(
        'Error',
        apiErrorMessage(err, 'Failed to generate sick note. Please try again.'),
      );
    } finally {
      setGeneratingSickNote(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.root}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={26} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Management Plan</Text>
          <View style={styles.headerRight} />
        </View>

        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.centerText}>Loading consultation…</Text>
          </View>
        ) : loadError ? (
          <View style={styles.centerContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
            <Text style={styles.centerText}>{loadError}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadData} activeOpacity={0.8}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── 1. Diagnosis ────────────────────────────────────────────────── */}
            <View style={styles.section}>
              <View style={styles.sectionHeading}>
                <Ionicons name="clipboard-outline" size={17} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Diagnosis</Text>
              </View>
              <TextInput
                style={styles.multilineInput}
                placeholder="Final diagnosis for this consultation..."
                placeholderTextColor={COLORS.textSecondary}
                value={diagnosis}
                onChangeText={setDiagnosis}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* ── 2. Medications ──────────────────────────────────────────────── */}
            <View style={styles.section}>
              <View style={styles.sectionHeading}>
                <Ionicons name="medkit-outline" size={17} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Medications</Text>
                {medications.length > 0 && (
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{medications.length}</Text>
                  </View>
                )}
              </View>

              {medications.map((med) => (
                <View key={med.id} style={styles.medCard}>
                  <View style={styles.medCardLeft}>
                    <Text style={styles.medName}>{med.name}</Text>
                    <Text style={styles.medDetails}>
                      {med.dose} · {med.route} · {med.frequency}
                    </Text>
                    {med.duration ? (
                      <Text style={styles.medDuration}>Duration: {med.duration}</Text>
                    ) : null}
                    {med.instructions ? (
                      <Text style={styles.medInstructions}>{med.instructions}</Text>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => removeMedication(med.id)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Ionicons name="close" size={15} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              ))}

              {medications.length === 0 && (
                <Text style={styles.emptyHint}>No medications added yet.</Text>
              )}

              <TouchableOpacity
                style={styles.outlinedAddBtn}
                onPress={() => setShowMedModal(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.outlinedAddBtnText}>+ Add Medication</Text>
              </TouchableOpacity>
            </View>

            {/* ── 3. Procedures ───────────────────────────────────────────────── */}
            <View style={styles.section}>
              <View style={styles.sectionHeading}>
                <Ionicons name="bandage-outline" size={17} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Procedures</Text>
              </View>
              <TextInput
                style={styles.multilineInput}
                placeholder="Describe procedures done or ordered..."
                placeholderTextColor={COLORS.textSecondary}
                value={procedures}
                onChangeText={setProcedures}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* ── 4. Referrals ────────────────────────────────────────────────── */}
            <View style={styles.section}>
              <View style={styles.sectionHeading}>
                <Ionicons name="git-branch-outline" size={17} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Referrals</Text>
                {referrals.length > 0 && (
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{referrals.length}</Text>
                  </View>
                )}
              </View>

              {referrals.map((ref) => (
                <View key={ref.id} style={styles.referralCard}>
                  <View style={styles.referralCardLeft}>
                    <View style={styles.referralHeader}>
                      <Text style={styles.referralSpecialty}>{ref.specialty}</Text>
                      <View
                        style={[
                          styles.urgencyBadge,
                          { backgroundColor: referralUrgencyColor(ref.urgency) },
                        ]}
                      >
                        <Text style={styles.urgencyBadgeText}>{ref.urgency}</Text>
                      </View>
                    </View>
                    <Text style={styles.referralReason} numberOfLines={2}>
                      {ref.reason}
                    </Text>
                    <TouchableOpacity
                      style={styles.referralLetterBtn}
                      onPress={() =>
                        navigation.navigate('ReferralLetter', {
                          consultationId,
                          specialty: ref.specialty,
                          urgency: ref.urgency,
                          reasonForReferral: ref.reason,
                          patientName: consultation?.patient
                            ? `${consultation.patient.firstName} ${consultation.patient.lastName}`
                            : undefined,
                        })
                      }
                      activeOpacity={0.8}
                    >
                      <Ionicons name="document-text-outline" size={14} color={COLORS.primary} />
                      <Text style={styles.referralLetterBtnText}>Generate Referral Letter</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => removeReferral(ref.id)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Ionicons name="close" size={15} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              ))}

              {referrals.length === 0 && (
                <Text style={styles.emptyHint}>No referrals added yet.</Text>
              )}

              <TouchableOpacity
                style={styles.outlinedAddBtn}
                onPress={() => setShowReferralModal(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.outlinedAddBtnText}>+ Add Referral</Text>
              </TouchableOpacity>
            </View>

            {/* ── 5. Follow-up ────────────────────────────────────────────────── */}
            <View style={styles.section}>
              <View style={styles.sectionHeading}>
                <Ionicons name="calendar-outline" size={17} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Follow-up</Text>
              </View>
              <Text style={styles.fieldLabel}>Follow-up in (days)</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="e.g. 7"
                placeholderTextColor={COLORS.textSecondary}
                value={followUpDays}
                onChangeText={setFollowUpDays}
                keyboardType="number-pad"
              />
            </View>

            {/* ── 6. Patient Instructions ─────────────────────────────────────── */}
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionHeading, styles.sectionHeadingInline]}>
                  <Ionicons name="chatbox-ellipses-outline" size={17} color={COLORS.primary} />
                  <Text style={styles.sectionTitle}>Patient Instructions</Text>
                </View>
                {patientLanguage !== 'en' && (
                  <View style={styles.langBadge}>
                    <Text style={styles.langBadgeText}>
                      {LANGUAGE_LABELS[patientLanguage] ?? patientLanguage}
                    </Text>
                  </View>
                )}
              </View>
              <TextInput
                style={[styles.multilineInput, styles.instructionsInput]}
                placeholder="Enter patient-facing instructions in plain language..."
                placeholderTextColor={COLORS.textSecondary}
                value={patientInstructions}
                onChangeText={setPatientInstructions}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
              {patientLanguage !== 'en' && (
                <Text style={styles.langHint}>
                  Patient's preferred language is{' '}
                  {LANGUAGE_LABELS[patientLanguage] ?? patientLanguage}. Write instructions in a
                  language the patient understands.
                </Text>
              )}
            </View>

            {/* ── Sick Note ───────────────────────────────────────────────────── */}
            <TouchableOpacity
              style={styles.sickNoteBtn}
              onPress={() => setShowSickNoteModal(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="document-attach-outline" size={18} color={COLORS.secondary} />
              <Text style={styles.sickNoteBtnText}>Generate Sick Note</Text>
            </TouchableOpacity>

            {/* ── Complete Consultation ───────────────────────────────────────── */}
            <TouchableOpacity
              style={[styles.completeBtn, isSaving && { opacity: 0.6 }]}
              onPress={handleComplete}
              activeOpacity={0.85}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.completeBtnText}>Complete Consultation</Text>
              )}
            </TouchableOpacity>

            <View style={{ height: SPACING.xl }} />
          </ScrollView>
        )}

        {/* ── Add Medication Modal ─────────────────────────────────────────────── */}
        <Modal
          visible={showMedModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowMedModal(false)}
        >
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={() => setShowMedModal(false)}
          />
          <View style={styles.bottomSheet}>
            <View style={styles.bottomSheetHandle} />
            <Text style={styles.modalTitle}>Add Medication</Text>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Name */}
              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="Medication name..."
                placeholderTextColor={COLORS.textSecondary}
                value={medForm.name}
                onChangeText={(v) => setMedForm((f) => ({ ...f, name: v }))}
              />
              <View style={styles.chipRow}>
                {COMMON_MEDS.map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.chip, medForm.name === m && styles.chipSelected]}
                    onPress={() => setMedForm((f) => ({ ...f, name: m }))}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, medForm.name === m && styles.chipTextSelected]}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Dose */}
              <Text style={styles.fieldLabel}>Dose</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="e.g. 500mg"
                placeholderTextColor={COLORS.textSecondary}
                value={medForm.dose}
                onChangeText={(v) => setMedForm((f) => ({ ...f, dose: v }))}
              />

              {/* Route */}
              <Text style={styles.fieldLabel}>Route</Text>
              <View style={styles.chipRow}>
                {ROUTES.map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.chip, medForm.route === r && styles.chipSelected]}
                    onPress={() => setMedForm((f) => ({ ...f, route: r }))}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, medForm.route === r && styles.chipTextSelected]}>
                      {r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Frequency */}
              <Text style={styles.fieldLabel}>Frequency</Text>
              <View style={styles.chipRow}>
                {FREQUENCIES.map((f) => (
                  <TouchableOpacity
                    key={f.code}
                    style={[styles.chip, medForm.frequency === f.code && styles.chipSelected]}
                    onPress={() => setMedForm((frm) => ({ ...frm, frequency: f.code }))}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        medForm.frequency === f.code && styles.chipTextSelected,
                      ]}
                    >
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Duration */}
              <Text style={styles.fieldLabel}>Duration</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="e.g. 7 days"
                placeholderTextColor={COLORS.textSecondary}
                value={medForm.duration}
                onChangeText={(v) => setMedForm((f) => ({ ...f, duration: v }))}
              />

              {/* Instructions */}
              <Text style={styles.fieldLabel}>Instructions</Text>
              <TextInput
                style={[styles.fieldInput, { minHeight: 60 }]}
                placeholder="e.g. Take with food"
                placeholderTextColor={COLORS.textSecondary}
                value={medForm.instructions}
                onChangeText={(v) => setMedForm((f) => ({ ...f, instructions: v }))}
                multiline
                textAlignVertical="top"
              />

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => {
                    setShowMedModal(false);
                    setMedForm(DEFAULT_MED_FORM);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={saveMedication}
                  activeOpacity={0.85}
                >
                  <Text style={styles.saveBtnText}>Save</Text>
                </TouchableOpacity>
              </View>
              <View style={{ height: SPACING.xl }} />
            </ScrollView>
          </View>
        </Modal>

        {/* ── Add Referral Modal ───────────────────────────────────────────────── */}
        <Modal
          visible={showReferralModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowReferralModal(false)}
        >
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={() => setShowReferralModal(false)}
          />
          <View style={styles.bottomSheet}>
            <View style={styles.bottomSheetHandle} />
            <Text style={styles.modalTitle}>Add Referral</Text>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Specialty */}
              <Text style={styles.fieldLabel}>Specialty</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="Specialty..."
                placeholderTextColor={COLORS.textSecondary}
                value={referralForm.specialty}
                onChangeText={(v) => setReferralForm((f) => ({ ...f, specialty: v }))}
              />
              <View style={styles.chipRow}>
                {SPECIALTIES.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.chip, referralForm.specialty === s && styles.chipSelected]}
                    onPress={() => setReferralForm((f) => ({ ...f, specialty: s }))}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        referralForm.specialty === s && styles.chipTextSelected,
                      ]}
                    >
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Reason */}
              <Text style={styles.fieldLabel}>Reason</Text>
              <TextInput
                style={[styles.fieldInput, { minHeight: 80 }]}
                placeholder="Reason for referral..."
                placeholderTextColor={COLORS.textSecondary}
                value={referralForm.reason}
                onChangeText={(v) => setReferralForm((f) => ({ ...f, reason: v }))}
                multiline
                textAlignVertical="top"
              />

              {/* Urgency */}
              <Text style={styles.fieldLabel}>Urgency</Text>
              <View style={styles.urgencyRow}>
                {REFERRAL_URGENCIES.map(({ code, color, textColor }) => (
                  <TouchableOpacity
                    key={code}
                    style={[
                      styles.urgencyChip,
                      referralForm.urgency === code && {
                        backgroundColor: color,
                        borderColor: color,
                      },
                    ]}
                    onPress={() => setReferralForm((f) => ({ ...f, urgency: code }))}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.urgencyChipText,
                        referralForm.urgency === code && { color: textColor, fontWeight: '700' },
                      ]}
                    >
                      {code}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => {
                    setShowReferralModal(false);
                    setReferralForm(DEFAULT_REFERRAL_FORM);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={saveReferral}
                  activeOpacity={0.85}
                >
                  <Text style={styles.saveBtnText}>Save</Text>
                </TouchableOpacity>
              </View>
              <View style={{ height: SPACING.xl }} />
            </ScrollView>
          </View>
        </Modal>

        {/* ── Sick Note Modal ─────────────────────────────────────────────────── */}
        <Modal
          visible={showSickNoteModal}
          transparent
          animationType="slide"
          onRequestClose={() => { setShowSickNoteModal(false); setGeneratedSickNote(null); }}
        >
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={() => { setShowSickNoteModal(false); setGeneratedSickNote(null); }}
          />
          <View style={[styles.bottomSheet, { maxHeight: '90%' }]}>
            <View style={styles.bottomSheetHandle} />
            <Text style={styles.modalTitle}>
              {generatedSickNote ? 'Sick Note Generated' : 'Generate Sick Note'}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {generatedSickNote ? (
                <>
                  <View style={snStyles.resultBox}>
                    <Text style={snStyles.resultText}>{generatedSickNote}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setGeneratedSickNote(null)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cancelBtnText}>Edit Details</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveBtn, { marginTop: SPACING.sm }]}
                    onPress={() => { setShowSickNoteModal(false); setGeneratedSickNote(null); }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.saveBtnText}>Done</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.fieldLabel}>Diagnosis</Text>
                  <TextInput
                    style={[styles.fieldInput, { minHeight: 60 }]}
                    placeholder="e.g. Acute viral upper respiratory tract infection"
                    placeholderTextColor={COLORS.textSecondary}
                    value={sickNoteForm.diagnosisText}
                    onChangeText={(v) => setSickNoteForm((f) => ({ ...f, diagnosisText: v }))}
                    multiline
                    textAlignVertical="top"
                  />

                  <Text style={styles.fieldLabel}>ICD-10 Code (optional)</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="e.g. J06.9"
                    placeholderTextColor={COLORS.textSecondary}
                    value={sickNoteForm.icd10Code}
                    onChangeText={(v) => setSickNoteForm((f) => ({ ...f, icd10Code: v }))}
                    autoCapitalize="characters"
                  />

                  <Text style={styles.fieldLabel}>Date of Consultation (YYYY-MM-DD)</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder={today}
                    placeholderTextColor={COLORS.textSecondary}
                    value={sickNoteForm.dateOfConsultation}
                    onChangeText={(v) => setSickNoteForm((f) => ({ ...f, dateOfConsultation: v }))}
                  />

                  <Text style={styles.fieldLabel}>Unfit From (YYYY-MM-DD)</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder={today}
                    placeholderTextColor={COLORS.textSecondary}
                    value={sickNoteForm.unfitFromDate}
                    onChangeText={(v) => setSickNoteForm((f) => ({ ...f, unfitFromDate: v }))}
                  />

                  <Text style={styles.fieldLabel}>Unfit Until (YYYY-MM-DD)</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="e.g. 2026-06-24"
                    placeholderTextColor={COLORS.textSecondary}
                    value={sickNoteForm.unfitToDate}
                    onChangeText={(v) => setSickNoteForm((f) => ({ ...f, unfitToDate: v }))}
                  />

                  <Text style={styles.fieldLabel}>Days Off Work</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="e.g. 3"
                    placeholderTextColor={COLORS.textSecondary}
                    value={sickNoteForm.daysOff}
                    onChangeText={(v) => setSickNoteForm((f) => ({ ...f, daysOff: v }))}
                    keyboardType="number-pad"
                  />

                  <Text style={styles.fieldLabel}>Fitness Statement (optional)</Text>
                  <TextInput
                    style={[styles.fieldInput, { minHeight: 60 }]}
                    placeholder="e.g. Patient may return to light duties on..."
                    placeholderTextColor={COLORS.textSecondary}
                    value={sickNoteForm.fitnessStatement}
                    onChangeText={(v) => setSickNoteForm((f) => ({ ...f, fitnessStatement: v }))}
                    multiline
                    textAlignVertical="top"
                  />

                  <View style={styles.modalBtnRow}>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => setShowSickNoteModal(false)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.saveBtn, generatingSickNote && { opacity: 0.6 }]}
                      onPress={handleGenerateSickNote}
                      disabled={generatingSickNote}
                      activeOpacity={0.85}
                    >
                      {generatingSickNote ? (
                        <ActivityIndicator color={COLORS.white} size="small" />
                      ) : (
                        <Text style={styles.saveBtnText}>Generate</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
              <View style={{ height: SPACING.xl }} />
            </ScrollView>
          </View>
        </Modal>

        {/* ── Success Modal ────────────────────────────────────────────────────── */}
        <Modal
          visible={showSuccessModal}
          transparent
          animationType="fade"
          onRequestClose={handleSuccessOk}
        >
          <View style={styles.successOverlay}>
            <View style={styles.successCard}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark" size={36} color={COLORS.white} />
              </View>
              <Text style={styles.successTitle}>Consultation Complete</Text>
              <Text style={styles.successBody}>
                The management plan has been saved and the consultation has been completed
                successfully.
              </Text>
              <TouchableOpacity
                style={styles.successBtn}
                onPress={handleSuccessOk}
                activeOpacity={0.85}
              >
                <Text style={styles.successBtnText}>Back to Home</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
  },
  headerRight: {
    width: 44,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  centerText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: FONT_SIZE.md,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
  },
  section: {
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs + 2,
    marginBottom: SPACING.sm,
  },
  sectionHeadingInline: {
    marginBottom: 0,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  countBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.healingTeal,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xs,
  },
  countBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  emptyHint: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textTertiary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  langBadge: {
    backgroundColor: COLORS.info,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  langBadgeText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  langHint: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  medCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.healingMint,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    paddingLeft: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.healingTealMid,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  medCardLeft: {
    flex: 1,
  },
  medName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.text,
  },
  medDetails: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  medDuration: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  medInstructions: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.info,
    fontStyle: 'italic',
    marginTop: 2,
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  outlinedAddBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    borderStyle: 'dashed',
    paddingVertical: SPACING.sm,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xs,
  },
  outlinedAddBtnText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: FONT_SIZE.md,
  },
  referralCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    paddingLeft: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.info,
  },
  referralCardLeft: {
    flex: 1,
  },
  referralHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: 4,
  },
  referralSpecialty: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.text,
  },
  urgencyBadge: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  urgencyBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.3,
  },
  referralReason: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  fieldLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    marginTop: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldInput: {
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 44,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
  },
  multilineInput: {
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    minHeight: 96,
  },
  instructionsInput: {
    minHeight: 140,
  },
  completeBtn: {
    backgroundColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md + 4,
    alignItems: 'center',
    marginTop: SPACING.sm,
    ...SHADOWS.md,
  },
  completeBtnText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
  },
  bottomSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: '82%',
    ...SHADOWS.lg,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
    marginTop: SPACING.xs,
  },
  chip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceVariant,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.text,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: COLORS.white,
    fontWeight: '700',
  },
  urgencyRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  urgencyChip: {
    flex: 1,
    paddingVertical: SPACING.sm,
    minHeight: 44,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgencyChipText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    minHeight: 44,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: COLORS.textSecondary,
    fontWeight: '700',
    fontSize: FONT_SIZE.md,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    minHeight: 44,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: FONT_SIZE.md,
  },
  successOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  successCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    width: '100%',
    ...SHADOWS.lg,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  successTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  successBody: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  successBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    width: '100%',
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: FONT_SIZE.lg,
  },
  referralLetterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.sm,
    minHeight: 32,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
    alignSelf: 'flex-start',
  },
  referralLetterBtnText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    fontWeight: '700',
  },
  sickNoteBtn: {
    flexDirection: 'row',
    gap: SPACING.sm,
    borderWidth: 1.5,
    borderColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.md,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  sickNoteBtnText: {
    color: COLORS.secondary,
    fontWeight: '700',
    fontSize: FONT_SIZE.md,
  },
});

const snStyles = StyleSheet.create({
  resultBox: {
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  resultText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    lineHeight: 22,
    fontFamily: 'monospace',
  },
});

export default ManagementPlanScreen;
