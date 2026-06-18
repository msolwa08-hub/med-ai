import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { consultationApi } from '../../api/endpoints';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, SHADOWS } from '../../constants/theme';

// ---------- Types ----------

type AIHistoryReviewRouteParams = {
  AIHistoryReview: {
    consultationId: string;
    patientName: string;
    patientAge: number;
    patientGender: string;
    language: string;
  };
};

interface Medication {
  name: string;
  dose: string;
  frequency: string;
}

interface DifferentialDiagnosis {
  name: string;
  icdCode?: string;
  probability: 'HIGH' | 'MEDIUM' | 'LOW';
  reasoning?: string;
}

interface StructuredHistory {
  chiefComplaint?: string;
  historyOfPresentIllness?: {
    onset?: string;
    duration?: string;
    severity?: string;
    character?: string;
    radiation?: string;
    aggravatingFactors?: string;
    relievingFactors?: string;
    associatedSymptoms?: string;
  };
  pastMedicalHistory?: string;
  currentMedications?: Medication[];
  allergies?: string;
  familyHistory?: string;
  socialHistory?: string;
  reviewOfSystems?: string;
}

interface AIHistoryData {
  structuredHistory: StructuredHistory;
  differentialDiagnoses: DifferentialDiagnosis[];
}

// ---------- SA High Prevalence Check ----------

const SA_HIGH_PREVALENCE_CONDITIONS = ['TB', 'HIV', 'Malaria', 'Tuberculosis'];

function isSAPrevalent(diagnosisName: string): boolean {
  return SA_HIGH_PREVALENCE_CONDITIONS.some((cond) =>
    diagnosisName.toLowerCase().includes(cond.toLowerCase()),
  );
}

// ---------- ExpandableSection Component ----------

interface ExpandableSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  hasAlert?: boolean;
}

const ExpandableSection: React.FC<ExpandableSectionProps> = ({
  title,
  children,
  defaultExpanded = false,
  hasAlert = false,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const animatedHeight = useRef(new Animated.Value(defaultExpanded ? 1 : 0)).current;

  const toggle = () => {
    const toValue = expanded ? 0 : 1;
    Animated.timing(animatedHeight, {
      toValue,
      duration: 250,
      useNativeDriver: false,
    }).start();
    setExpanded(!expanded);
  };

  return (
    <View style={styles.expandableCard}>
      <TouchableOpacity style={styles.expandableHeader} onPress={toggle} activeOpacity={0.7}>
        <View style={styles.expandableTitleRow}>
          {hasAlert && <View style={styles.alertDot} />}
          <Text style={[styles.expandableTitle, hasAlert && styles.expandableTitleAlert]}>
            {title}
          </Text>
        </View>
        <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.expandableBody,
          {
            maxHeight: animatedHeight.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 2000],
            }),
            opacity: animatedHeight,
            overflow: 'hidden',
          },
        ]}
      >
        <View style={styles.expandableContent}>{children}</View>
      </Animated.View>
    </View>
  );
};

// ---------- Helper Components ----------

const InfoRow: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoRowLabel}>{label}:</Text>
    <Text style={styles.infoRowValue}>{value || '—'}</Text>
  </View>
);

const ProbabilityBadge: React.FC<{ probability: 'HIGH' | 'MEDIUM' | 'LOW' }> = ({
  probability,
}) => {
  const badgeStyle =
    probability === 'HIGH'
      ? styles.probHigh
      : probability === 'MEDIUM'
        ? styles.probMedium
        : styles.probLow;
  return (
    <View style={[styles.probBadge, badgeStyle]}>
      <Text style={styles.probBadgeText}>{probability}</Text>
    </View>
  );
};

// ---------- Main Screen ----------

const AIHistoryReviewScreen: React.FC = () => {
  const route = useRoute<RouteProp<AIHistoryReviewRouteParams, 'AIHistoryReview'>>();
  const navigation = useNavigation();
  const { consultationId, patientName, patientAge, patientGender, language } = route.params;

  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState<AIHistoryData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [notes, setNotes] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [confirmedAt, setConfirmedAt] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await consultationApi.getAIHistory(consultationId);
      setHistoryData(response.data);
    } catch (err) {
      setError('Failed to load AI history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    try {
      setConfirming(true);
      await consultationApi.confirmHistory(consultationId, notes || undefined);
      const now = new Date();
      const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setConfirmedAt(timestamp);
      setConfirmed(true);
    } catch (err) {
      Alert.alert('Error', 'Failed to confirm history. Please try again.');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading AI medical history...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadHistory}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const history = historyData?.structuredHistory ?? {};
  const differentials = historyData?.differentialDiagnoses ?? [];
  const hasAllergies =
    history.allergies && history.allergies.trim().toLowerCase() !== 'nkda';

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Patient Info Card ── */}
        <View style={[styles.card, styles.patientCard]}>
          <Text style={styles.patientCardSubtitle}>AI-Assisted Medical History</Text>
          <Text style={styles.patientName}>{patientName}</Text>
          <View style={styles.patientMetaRow}>
            <View style={styles.patientMetaItem}>
              <Text style={styles.patientMetaLabel}>Age</Text>
              <Text style={styles.patientMetaValue}>{patientAge} years</Text>
            </View>
            <View style={styles.patientMetaDivider} />
            <View style={styles.patientMetaItem}>
              <Text style={styles.patientMetaLabel}>Gender</Text>
              <Text style={styles.patientMetaValue}>
                {patientGender.charAt(0).toUpperCase() + patientGender.slice(1)}
              </Text>
            </View>
            <View style={styles.patientMetaDivider} />
            <View style={styles.patientMetaItem}>
              <Text style={styles.patientMetaLabel}>Language</Text>
              <Text style={styles.patientMetaValue}>{language}</Text>
            </View>
          </View>
        </View>

        {/* ── Chief Complaint ── */}
        {history.chiefComplaint ? (
          <View style={styles.chiefComplaintBox}>
            <Text style={styles.sectionLabel}>CHIEF COMPLAINT</Text>
            <Text style={styles.chiefComplaintText}>{history.chiefComplaint}</Text>
          </View>
        ) : null}

        {/* ── History of Present Illness ── */}
        <ExpandableSection title="History of Present Illness" defaultExpanded>
          <InfoRow label="Onset" value={history.historyOfPresentIllness?.onset} />
          <InfoRow label="Duration" value={history.historyOfPresentIllness?.duration} />
          <InfoRow label="Severity" value={history.historyOfPresentIllness?.severity} />
          <InfoRow label="Character" value={history.historyOfPresentIllness?.character} />
          <InfoRow label="Radiation" value={history.historyOfPresentIllness?.radiation} />
          <InfoRow
            label="Aggravating Factors"
            value={history.historyOfPresentIllness?.aggravatingFactors}
          />
          <InfoRow
            label="Relieving Factors"
            value={history.historyOfPresentIllness?.relievingFactors}
          />
          <InfoRow
            label="Associated Symptoms"
            value={history.historyOfPresentIllness?.associatedSymptoms}
          />
        </ExpandableSection>

        {/* ── Past Medical History ── */}
        <ExpandableSection title="Past Medical History">
          <Text style={styles.plainText}>{history.pastMedicalHistory || 'None reported'}</Text>
        </ExpandableSection>

        {/* ── Current Medications ── */}
        <ExpandableSection title="Current Medications">
          {history.currentMedications && history.currentMedications.length > 0 ? (
            <>
              <View style={styles.medicationHeaderRow}>
                <Text style={[styles.medicationCell, styles.medicationHeaderCell, { flex: 2 }]}>
                  Medication
                </Text>
                <Text style={[styles.medicationCell, styles.medicationHeaderCell, { flex: 1 }]}>
                  Dose
                </Text>
                <Text style={[styles.medicationCell, styles.medicationHeaderCell, { flex: 1.5 }]}>
                  Frequency
                </Text>
              </View>
              {history.currentMedications.map((med, idx) => (
                <View
                  key={idx}
                  style={[styles.medicationRow, idx % 2 === 1 && styles.medicationRowAlt]}
                >
                  <Text style={[styles.medicationCell, { flex: 2 }]}>{med.name}</Text>
                  <Text style={[styles.medicationCell, { flex: 1 }]}>{med.dose}</Text>
                  <Text style={[styles.medicationCell, { flex: 1.5 }]}>{med.frequency}</Text>
                </View>
              ))}
            </>
          ) : (
            <Text style={styles.plainText}>No current medications</Text>
          )}
        </ExpandableSection>

        {/* ── Allergies ── */}
        <ExpandableSection
          title={hasAllergies ? 'Allergies  ⚠' : 'Allergies'}
          hasAlert={!!hasAllergies}
        >
          {hasAllergies ? (
            <View style={styles.allergyAlert}>
              <Text style={styles.allergyAlertText}>{history.allergies}</Text>
            </View>
          ) : (
            <View style={styles.nkdaBadge}>
              <Text style={styles.nkdaBadgeText}>NKDA — No Known Drug Allergies</Text>
            </View>
          )}
        </ExpandableSection>

        {/* ── Family History ── */}
        <ExpandableSection title="Family History">
          <Text style={styles.plainText}>{history.familyHistory || 'None reported'}</Text>
        </ExpandableSection>

        {/* ── Social History ── */}
        <ExpandableSection title="Social History">
          <Text style={styles.plainText}>{history.socialHistory || 'None reported'}</Text>
        </ExpandableSection>

        {/* ── Review of Systems ── */}
        <ExpandableSection title="Review of Systems">
          <Text style={styles.plainText}>{history.reviewOfSystems || 'Not completed'}</Text>
        </ExpandableSection>

        {/* ── Differential Diagnosis Divider ── */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerLabel}>AI DIFFERENTIAL DIAGNOSIS</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* ── Differential Diagnoses ── */}
        {differentials.length > 0 ? (
          differentials.map((diag, idx) => (
            <View key={idx} style={styles.diagnosisCard}>
              <View style={styles.diagnosisHeaderRow}>
                <Text style={styles.diagnosisName}>{diag.name}</Text>
                {diag.icdCode ? (
                  <Text style={styles.icdCode}>{diag.icdCode}</Text>
                ) : null}
              </View>
              <View style={styles.diagnosisBadgeRow}>
                <ProbabilityBadge probability={diag.probability} />
                {isSAPrevalent(diag.name) && (
                  <View style={styles.saPrevalentBadge}>
                    <Text style={styles.saPrevalentText}>SA HIGH PREVALENCE</Text>
                  </View>
                )}
              </View>
              {diag.reasoning ? (
                <Text style={styles.diagnosisReasoning}>{diag.reasoning}</Text>
              ) : null}
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No differential diagnoses generated</Text>
          </View>
        )}

        {/* ── Doctor Actions Divider ── */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerLabel}>DOCTOR ACTIONS</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* ── Notes + Confirm (bottom section with extra padding for fixed bar) ── */}
        <View style={styles.actionsSection}>
          <Text style={styles.actionsLabel}>Notes / Corrections</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add notes or corrections..."
            placeholderTextColor={COLORS.textSecondary}
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={setNotes}
            textAlignVertical="top"
            editable={!confirmed}
          />

          {confirmed ? (
            <View style={styles.confirmedBanner}>
              <Text style={styles.confirmedIcon}>✓</Text>
              <Text style={styles.confirmedText}>Confirmed at {confirmedAt}</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.confirmButton, confirming && styles.confirmButtonDisabled]}
              onPress={handleConfirm}
              disabled={confirming}
              activeOpacity={0.8}
            >
              {confirming ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <Text style={styles.confirmButtonText}>Confirm History</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Bottom padding so content isn't hidden behind anything */}
        <View style={{ height: 32 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ---------- Styles ----------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  errorText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },

  // Patient card
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...{
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 3,
    },
  },
  patientCard: {
    backgroundColor: COLORS.primary,
  },
  patientCardSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  patientName: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SPACING.md,
  },
  patientMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientMetaItem: {
    flex: 1,
    alignItems: 'center',
  },
  patientMetaDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  patientMetaLabel: {
    fontSize: FONT_SIZE.xs,
    color: 'rgba(255,255,255,0.65)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  patientMetaValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.white,
  },

  // Chief complaint
  chiefComplaintBox: {
    backgroundColor: '#EBF4FF',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: COLORS.info,
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
  chiefComplaintText: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 26,
  },

  // Expandable
  expandableCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  expandableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  expandableTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  expandableTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  expandableTitleAlert: {
    color: COLORS.error,
  },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
    marginRight: SPACING.sm,
  },
  chevron: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  expandableBody: {
    overflow: 'hidden',
  },
  expandableContent: {
    padding: SPACING.md,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  // InfoRow
  infoRow: {
    flexDirection: 'row',
    paddingVertical: SPACING.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  infoRowLabel: {
    width: 150,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  infoRowValue: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  plainText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    paddingVertical: SPACING.xs,
  },

  // Medication table
  medicationHeaderRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceVariant,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.xs,
  },
  medicationHeaderCell: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: COLORS.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  medicationRow: {
    flexDirection: 'row',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.xs,
  },
  medicationRowAlt: {
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: BORDER_RADIUS.sm,
  },
  medicationCell: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    paddingRight: SPACING.xs,
  },

  // Allergies
  allergyAlert: {
    backgroundColor: '#FFF0F0',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  allergyAlertText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.error,
    fontWeight: '600',
  },
  nkdaBadge: {
    backgroundColor: '#F0FFF4',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  nkdaBadgeText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.success,
    fontWeight: '600',
  },

  // Dividers
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1.2,
    marginHorizontal: SPACING.sm,
  },

  // Diagnosis cards
  diagnosisCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  diagnosisHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  diagnosisName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  icdCode: {
    fontSize: FONT_SIZE.sm,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: COLORS.textSecondary,
    backgroundColor: COLORS.surfaceVariant,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    marginLeft: SPACING.xs,
  },
  diagnosisBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  probBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
  },
  probBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  probHigh: {
    backgroundColor: COLORS.error,
  },
  probMedium: {
    backgroundColor: '#E67E22',
  },
  probLow: {
    backgroundColor: COLORS.success,
  },
  saPrevalentBadge: {
    backgroundColor: '#FFF3CD',
    borderWidth: 1,
    borderColor: COLORS.warning,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
  },
  saPrevalentText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: '#856404',
    letterSpacing: 0.3,
  },
  diagnosisReasoning: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginTop: SPACING.xs,
  },

  // Empty state
  emptyState: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },

  // Actions section
  actionsSection: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SPACING.sm,
  },
  actionsLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    minHeight: 100,
    backgroundColor: COLORS.background,
    marginBottom: SPACING.md,
  },
  confirmButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    ...{
      shadowColor: COLORS.secondary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
  },
  confirmButtonDisabled: {
    opacity: 0.7,
  },
  confirmButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  confirmedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FFF4',
    borderWidth: 1,
    borderColor: COLORS.success,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    justifyContent: 'center',
  },
  confirmedIcon: {
    fontSize: FONT_SIZE.xl,
    color: COLORS.success,
    fontWeight: '700',
    marginRight: SPACING.sm,
  },
  confirmedText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.success,
    fontWeight: '600',
  },
});

export default AIHistoryReviewScreen;
