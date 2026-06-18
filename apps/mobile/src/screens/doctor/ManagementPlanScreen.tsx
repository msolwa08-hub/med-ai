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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { consultationApi, aiApi } from '../../api/endpoints';
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

// ─── Main Component ───────────────────────────────────────────────────────────

export const ManagementPlanScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<ManagementRouteParams, 'ManagementPlanScreen'>>();
  const { consultationId } = route.params;
  const { user } = useAuthStore();

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
  const [followUpDate, setFollowUpDate] = useState('');

  // Patient instructions
  const [patientInstructions, setPatientInstructions] = useState('');
  const [patientLanguage, setPatientLanguage] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);

  // Save / complete
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Load consultation to get patient language
  useEffect(() => {
    const load = async () => {
      try {
        const resp = await consultationApi.getById(consultationId);
        const lang = resp.data?.patient?.preferredLanguage || 'en';
        setPatientLanguage(lang);
      } catch {
        // Fall back to English
      }
    };
    load();
  }, [consultationId]);

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

  // ── Translate instructions ───────────────────────────────────────────────────
  const handleTranslate = useCallback(async () => {
    if (!patientInstructions.trim()) {
      Alert.alert('Nothing to translate', 'Please enter patient instructions first.');
      return;
    }
    if (patientLanguage === 'en') {
      Alert.alert('Already in English', "The patient's preferred language is English.");
      return;
    }
    setIsTranslating(true);
    try {
      const resp = await aiApi.translateText(patientInstructions, 'en', patientLanguage);
      const translated = resp.data?.translatedText || resp.data?.text || '';
      if (translated) {
        setPatientInstructions(translated);
      }
    } catch {
      Alert.alert('Translation failed', 'Could not translate text. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  }, [patientInstructions, patientLanguage]);

  // ── Complete consultation ────────────────────────────────────────────────────
  const handleComplete = async () => {
    if (medications.length === 0 && !procedures.trim() && referrals.length === 0) {
      Alert.alert(
        'Empty plan',
        'Please add at least one medication, procedure, or referral before completing.',
      );
      return;
    }
    setIsSaving(true);
    try {
      await consultationApi.saveManagement({
        consultationId,
        prescriptions: medications.map((m) => ({
          medication: m.name,
          dose: m.dose,
          frequency: m.frequency,
          duration: m.duration,
          instructions: m.instructions || undefined,
        })),
        investigations: procedures ? [procedures] : [],
        referrals: referrals.map(
          (r) => `${r.specialty} (${r.urgency}): ${r.reason}`,
        ),
        followUpDate: followUpDate || undefined,
        patientInstructions: patientInstructions || undefined,
      });
      await consultationApi.completeConsultation(consultationId);
      setShowSuccessModal(true);
    } catch {
      Alert.alert('Error', 'Failed to complete consultation. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSuccessOk = () => {
    setShowSuccessModal(false);
    navigation.navigate('DoctorHome');
  };

  const referralUrgencyColor = (u: ReferralUrgency) =>
    REFERRAL_URGENCIES.find((r) => r.code === u)?.color ?? COLORS.textSecondary;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Management Plan</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. Medications ──────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medications</Text>

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
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity
            style={styles.outlinedAddBtn}
            onPress={() => setShowMedModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.outlinedAddBtnText}>+ Add Medication</Text>
          </TouchableOpacity>
        </View>

        {/* ── 2. Procedures ───────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Procedures</Text>
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

        {/* ── 3. Referrals ────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Referrals</Text>

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
              </View>
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => removeReferral(ref.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity
            style={styles.outlinedAddBtn}
            onPress={() => setShowReferralModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.outlinedAddBtnText}>+ Add Referral</Text>
          </TouchableOpacity>
        </View>

        {/* ── 4. Follow-up ────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Follow-up</Text>
          <Text style={styles.fieldLabel}>Follow-up date (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.fieldInput}
            placeholder="e.g. 2026-07-01"
            placeholderTextColor={COLORS.textSecondary}
            value={followUpDate}
            onChangeText={setFollowUpDate}
            keyboardType="default"
          />
        </View>

        {/* ── 5. Patient Instructions ─────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Patient Instructions</Text>
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
            <TouchableOpacity
              style={[styles.translateBtn, isTranslating && { opacity: 0.6 }]}
              onPress={handleTranslate}
              activeOpacity={0.8}
              disabled={isTranslating}
            >
              {isTranslating ? (
                <ActivityIndicator color={COLORS.primary} size="small" />
              ) : (
                <Text style={styles.translateBtnText}>
                  Translate to {LANGUAGE_LABELS[patientLanguage] ?? patientLanguage}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* ── Complete Consultation ────────────────────────────────────────────── */}
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
              <Text style={styles.successIconText}>✓</Text>
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
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingTop: 48,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  backBtn: {
    width: 36,
    alignItems: 'flex-start',
  },
  backIcon: {
    fontSize: 28,
    color: COLORS.white,
    lineHeight: 32,
  },
  headerTitle: {
    flex: 1,
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
  },
  headerRight: {
    width: 36,
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
    marginBottom: SPACING.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
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
  medCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
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
  removeBtnText: {
    color: COLORS.error,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  outlinedAddBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    borderStyle: 'dashed',
    paddingVertical: SPACING.sm,
    alignItems: 'center',
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
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
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
  translateBtn: {
    marginTop: SPACING.sm,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  translateBtnText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: FONT_SIZE.sm,
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
    paddingVertical: 4,
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
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
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
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: COLORS.textSecondary,
    fontWeight: '700',
    fontSize: FONT_SIZE.md,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
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
  successIconText: {
    color: COLORS.white,
    fontSize: 32,
    fontWeight: '800',
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
    alignItems: 'center',
  },
  successBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: FONT_SIZE.lg,
  },
});

export default ManagementPlanScreen;
