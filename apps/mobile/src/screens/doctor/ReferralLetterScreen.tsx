import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { ActivityIndicator } from 'react-native-paper';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZE,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../../constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

type ReferralLetterParamList = {
  ReferralLetterScreen: {
    consultationId: string;
    specialty: string;
    urgency: 'ROUTINE' | 'URGENT' | 'EMERGENCY';
    reasonForReferral: string;
    patientName?: string;
  };
};

type UrgencyLevel = 'ROUTINE' | 'URGENT' | 'EMERGENCY';

// ─── Urgency config ───────────────────────────────────────────────────────────

const URGENCY_CONFIG: Record<
  UrgencyLevel,
  { label: string; color: string; bg: string }
> = {
  ROUTINE: { label: 'Routine', color: COLORS.secondary, bg: '#E8F5F0' },
  URGENT: { label: 'Urgent', color: COLORS.warning, bg: '#FFF4E5' },
  EMERGENCY: { label: 'Emergency', color: COLORS.emergency, bg: '#FFEFEE' },
};

// ─── Component ────────────────────────────────────────────────────────────────

const ReferralLetterScreen: React.FC = () => {
  const navigation = useNavigation();
  const route =
    useRoute<RouteProp<ReferralLetterParamList, 'ReferralLetterScreen'>>();
  const { user } = useAuthStore();

  const {
    consultationId,
    specialty,
    urgency,
    reasonForReferral,
    patientName,
  } = route.params;

  // ── Form state ──
  const [practiceName, setPracticeName] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [selectedUrgency, setSelectedUrgency] =
    useState<UrgencyLevel>(urgency);

  // ── Output state ──
  const [generatedLetter, setGeneratedLetter] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  // Load practice name from doctor settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await apiClient.get<{ practiceName?: string }>(
          '/doctor/settings'
        );
        if (res.data?.practiceName) {
          setPracticeName(res.data.practiceName);
        }
      } catch {
        // Settings endpoint optional — user can type manually
      }
    };
    fetchSettings();
  }, []);

  // ── Generate letter ──
  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setGeneratedLetter('');

    try {
      const body = {
        patientName: patientName ?? 'Patient',
        patientAge: '',
        patientGender: '',
        referringDoctorName: user
          ? `${user.lastName}, ${user.firstName}`
          : '',
        referringDoctorHpcsa: user?.hpcsaNumber ?? '',
        referringPracticeName: practiceName.trim(),
        specialty,
        urgency: selectedUrgency,
        reasonForReferral,
        clinicalSummary: additionalNotes.trim(),
        diagnosis: '',
        additionalNotes: '',
      };

      const res = await apiClient.post<{ letter: string }>(
        '/doctor/documents/referral-letter',
        body
      );

      setGeneratedLetter(res.data.letter ?? '');

      // Scroll to letter
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Failed to generate the referral letter. Please try again.';
      Alert.alert('Generation Failed', msg);
    } finally {
      setIsGenerating(false);
    }
  }, [
    user,
    patientName,
    practiceName,
    specialty,
    selectedUrgency,
    reasonForReferral,
    additionalNotes,
  ]);

  // ── Copy to clipboard ──
  const handleCopy = useCallback(async () => {
    if (!generatedLetter) return;
    await Clipboard.setStringAsync(generatedLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }, [generatedLetter]);

  // ── Urgency badge ──
  const urg = URGENCY_CONFIG[selectedUrgency];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.backArrow}>{'‹'}</Text>
          <Text style={styles.backLabel}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Referral Letter</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Patient info banner */}
          <View style={styles.patientBanner}>
            <Text style={styles.patientBannerLabel}>Patient</Text>
            <Text style={styles.patientBannerName}>
              {patientName ?? 'Unknown Patient'}
            </Text>
          </View>

          {/* Referral details card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Referral Details</Text>

            {/* Specialty */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Specialty</Text>
              <Text style={styles.detailValue}>{specialty}</Text>
            </View>

            {/* Urgency selector */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Urgency</Text>
              <View style={styles.urgencyRow}>
                {(['ROUTINE', 'URGENT', 'EMERGENCY'] as UrgencyLevel[]).map(
                  (u) => {
                    const cfg = URGENCY_CONFIG[u];
                    const active = selectedUrgency === u;
                    return (
                      <TouchableOpacity
                        key={u}
                        onPress={() => setSelectedUrgency(u)}
                        style={[
                          styles.urgencyChip,
                          { borderColor: cfg.color },
                          active && { backgroundColor: cfg.color },
                        ]}
                      >
                        <Text
                          style={[
                            styles.urgencyChipText,
                            { color: active ? COLORS.white : cfg.color },
                          ]}
                        >
                          {cfg.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  }
                )}
              </View>
            </View>

            {/* Reason */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Reason for Referral</Text>
              <Text style={styles.detailValue}>{reasonForReferral}</Text>
            </View>
          </View>

          {/* Practice & notes card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Referring Doctor Details</Text>

            <Text style={styles.fieldLabel}>Practice Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Sunridge Family Practice"
              placeholderTextColor={COLORS.textTertiary}
              value={practiceName}
              onChangeText={setPracticeName}
              autoCapitalize="words"
              returnKeyType="next"
            />

            <Text style={[styles.fieldLabel, { marginTop: SPACING.md }]}>
              Additional Clinical Notes
            </Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Include relevant history, examination findings, investigations already done…"
              placeholderTextColor={COLORS.textTertiary}
              value={additionalNotes}
              onChangeText={setAdditionalNotes}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>

          {/* Generate button */}
          <TouchableOpacity
            style={[styles.generateBtn, isGenerating && styles.generateBtnDisabled]}
            onPress={handleGenerate}
            disabled={isGenerating}
            activeOpacity={0.82}
          >
            {isGenerating ? (
              <View style={styles.generateBtnInner}>
                <ActivityIndicator size={18} color={COLORS.white} />
                <Text style={[styles.generateBtnText, { marginLeft: SPACING.sm }]}>
                  Generating Letter…
                </Text>
              </View>
            ) : (
              <Text style={styles.generateBtnText}>
                Generate Referral Letter
              </Text>
            )}
          </TouchableOpacity>

          {/* Generated letter */}
          {generatedLetter !== '' && (
            <View style={styles.letterCard}>
              <View style={styles.letterHeader}>
                <Text style={styles.letterTitle}>Generated Letter</Text>
                <View style={[styles.urgencyBadge, { backgroundColor: urg.bg }]}>
                  <Text style={[styles.urgencyBadgeText, { color: urg.color }]}>
                    {urg.label}
                  </Text>
                </View>
              </View>

              <View style={styles.letterBody}>
                <Text style={styles.letterText} selectable>
                  {generatedLetter}
                </Text>
              </View>

              <View style={styles.letterActions}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.copyBtn]}
                  onPress={handleCopy}
                  activeOpacity={0.8}
                >
                  <Text style={styles.copyBtnText}>
                    {copied ? 'Copied!' : 'Copy'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.regenerateBtn]}
                  onPress={handleGenerate}
                  disabled={isGenerating}
                  activeOpacity={0.8}
                >
                  <Text style={styles.regenerateBtnText}>Regenerate</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={{ height: SPACING.xxxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  flex: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 60,
  },
  backArrow: {
    fontSize: 28,
    color: COLORS.white,
    lineHeight: 28,
    marginRight: 2,
  },
  backLabel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.white,
    fontWeight: '500',
  },
  headerTitle: {
    ...TYPOGRAPHY.headline,
    color: COLORS.white,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    minWidth: 60,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },

  // Patient banner
  patientBanner: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  patientBannerLabel: {
    ...TYPOGRAPHY.footnote,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  patientBannerName: {
    ...TYPOGRAPHY.headline,
    color: COLORS.white,
    flex: 1,
  },

  // Card
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  cardTitle: {
    ...TYPOGRAPHY.headline,
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },

  // Detail rows
  detailRow: {
    marginBottom: SPACING.md,
  },
  detailLabel: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: SPACING.xs,
  },
  detailValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },

  // Urgency chips
  urgencyRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  urgencyChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1.5,
  },
  urgencyChipText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },

  // Fields
  fieldLabel: {
    ...TYPOGRAPHY.subheadline,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
  },
  textArea: {
    minHeight: 110,
    paddingTop: SPACING.sm + 2,
  },

  // Generate button
  generateBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  generateBtnDisabled: {
    opacity: 0.7,
  },
  generateBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  generateBtnText: {
    ...TYPOGRAPHY.headline,
    color: COLORS.white,
  },

  // Letter output
  letterCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  letterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    backgroundColor: COLORS.primary,
  },
  letterTitle: {
    ...TYPOGRAPHY.headline,
    color: COLORS.white,
  },
  urgencyBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
  },
  urgencyBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  letterBody: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.separator,
  },
  letterText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    lineHeight: 24,
  },
  letterActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyBtn: {
    backgroundColor: COLORS.secondary,
  },
  copyBtnText: {
    ...TYPOGRAPHY.subheadline,
    color: COLORS.white,
    fontWeight: '700',
  },
  regenerateBtn: {
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  regenerateBtnText: {
    ...TYPOGRAPHY.subheadline,
    color: COLORS.primary,
    fontWeight: '700',
  },
});

export default ReferralLetterScreen;
