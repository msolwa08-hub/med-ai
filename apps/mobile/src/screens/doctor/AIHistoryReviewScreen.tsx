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
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { aiHistoryApi } from '../../api/endpoints';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, SHADOWS } from '../../constants/theme';

// ---------- Types (mirror GET /ai-history/:consultationId response) ----------

type AIHistoryReviewRouteParams = {
  AIHistoryReview: {
    consultationId: string;
  };
};

interface HistoryOfPresentIllness {
  onset?: string;
  duration?: string;
  severity?: string;
  character?: string;
  radiation?: string;
  aggravatingFactors?: string;
  relievingFactors?: string;
  associatedSymptoms?: string;
}

interface StructuredHistory {
  chiefComplaint?: string;
  historyOfPresentIllness?: HistoryOfPresentIllness;
  pastMedicalHistory?: string;
  medications?: string;
  allergies?: string;
  familyHistory?: string;
  socialHistory?: string;
  systemsReview?: string;
  clinicalScores?: string;
  opportunisticFindings?: string;
  redFlagsIdentified?: string;
}

interface DiagnosisEntry {
  diagnosis: string;
  icdCode?: string;
  probability: 'HIGH' | 'MEDIUM' | 'LOW';
  reasoning?: string;
}

interface AIHistoryData {
  structuredHistory: StructuredHistory | null;
  diagnoses: DiagnosisEntry[] | null;
  doctorConfirmed: boolean;
  confirmedAt: string | null;
  doctorNotes: string | null;
  language: string;
  literacyLevel: string | null;
}

// ---------- Helpers ----------

function getApiErrorMessage(err: unknown, fallback: string): string {
  const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
  return message ?? fallback;
}

function formatTimestamp(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString([], {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
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
        <MaterialCommunityIcons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={COLORS.textSecondary}
        />
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
  const navigation = useNavigation<any>();
  const { consultationId } = route.params;

  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState<AIHistoryData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [notes, setNotes] = useState('');
  const [corrections, setCorrections] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [confirmedAt, setConfirmedAt] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consultationId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await aiHistoryApi.getHistory(consultationId);
      const data = response.data.data as AIHistoryData;
      setHistoryData(data);
      setConfirmed(data.doctorConfirmed);
      setConfirmedAt(data.confirmedAt);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load AI history. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    try {
      setConfirming(true);
      const response = await aiHistoryApi.confirm(
        consultationId,
        notes.trim() || undefined,
        corrections.trim() || undefined,
      );
      const result = response.data.data as { confirmed: boolean; confirmedAt: string };
      setConfirmedAt(result.confirmedAt);
      setConfirmed(true);
    } catch (err) {
      Alert.alert(
        'Error',
        getApiErrorMessage(err, 'Failed to confirm history. Please try again.'),
      );
    } finally {
      setConfirming(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <MaterialCommunityIcons name="chevron-left" size={30} color={COLORS.white} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>AI History Review</Text>
      <View style={styles.headerRight} />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        {renderHeader()}
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading AI medical history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        {renderHeader()}
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={48}
            color={COLORS.error}
            style={styles.stateIcon}
          />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadHistory} activeOpacity={0.8}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const history = historyData?.structuredHistory ?? null;
  const differentials = historyData?.diagnoses ?? [];
  const allergiesText = history?.allergies?.trim() ?? '';
  const hasAllergies =
    allergiesText.length > 0 &&
    !['nkda', 'none', 'no known allergies'].includes(allergiesText.toLowerCase());

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {renderHeader()}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Consultation Summary Card ── */}
          <View style={[styles.card, styles.patientCard]}>
            <Text style={styles.patientCardSubtitle}>AI-Assisted Medical History</Text>
            <Text style={styles.patientName}>Patient History</Text>
            <View style={styles.patientMetaRow}>
              <View style={styles.patientMetaItem}>
                <Text style={styles.patientMetaLabel}>Language</Text>
                <Text style={styles.patientMetaValue}>
                  {(historyData?.language ?? 'en').toUpperCase()}
                </Text>
              </View>
              <View style={styles.patientMetaDivider} />
              <View style={styles.patientMetaItem}>
                <Text style={styles.patientMetaLabel}>Literacy</Text>
                <Text style={styles.patientMetaValue}>
                  {historyData?.literacyLevel ?? 'Unknown'}
                </Text>
              </View>
              <View style={styles.patientMetaDivider} />
              <View style={styles.patientMetaItem}>
                <Text style={styles.patientMetaLabel}>Status</Text>
                <Text style={styles.patientMetaValue}>
                  {confirmed ? 'Confirmed' : 'For review'}
                </Text>
              </View>
            </View>
          </View>

          {!history && differentials.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="clipboard-text-clock-outline"
                size={48}
                color={COLORS.textTertiary}
                style={styles.stateIcon}
              />
              <Text style={styles.emptyStateTitle}>History not yet available</Text>
              <Text style={styles.emptyStateText}>
                The AI history-taking session has not been completed for this consultation.
              </Text>
            </View>
          ) : (
            <>
              {/* ── Red Flags ── */}
              {history?.redFlagsIdentified ? (
                <View style={styles.redFlagBox}>
                  <View style={styles.redFlagHeaderRow}>
                    <MaterialCommunityIcons name="flag" size={18} color={COLORS.error} />
                    <Text style={styles.redFlagLabel}>RED FLAGS IDENTIFIED</Text>
                  </View>
                  <Text style={styles.redFlagText}>{history.redFlagsIdentified}</Text>
                </View>
              ) : null}

              {/* ── Chief Complaint ── */}
              {history?.chiefComplaint ? (
                <View style={styles.chiefComplaintBox}>
                  <Text style={styles.sectionLabel}>CHIEF COMPLAINT</Text>
                  <Text style={styles.chiefComplaintText}>{history.chiefComplaint}</Text>
                </View>
              ) : null}

              {/* ── History of Present Illness ── */}
              <ExpandableSection title="History of Present Illness" defaultExpanded>
                <InfoRow label="Onset" value={history?.historyOfPresentIllness?.onset} />
                <InfoRow label="Duration" value={history?.historyOfPresentIllness?.duration} />
                <InfoRow label="Severity" value={history?.historyOfPresentIllness?.severity} />
                <InfoRow label="Character" value={history?.historyOfPresentIllness?.character} />
                <InfoRow label="Radiation" value={history?.historyOfPresentIllness?.radiation} />
                <InfoRow
                  label="Aggravating Factors"
                  value={history?.historyOfPresentIllness?.aggravatingFactors}
                />
                <InfoRow
                  label="Relieving Factors"
                  value={history?.historyOfPresentIllness?.relievingFactors}
                />
                <InfoRow
                  label="Associated Symptoms"
                  value={history?.historyOfPresentIllness?.associatedSymptoms}
                />
              </ExpandableSection>

              {/* ── Past Medical History ── */}
              <ExpandableSection title="Past Medical History">
                <Text style={styles.plainText}>
                  {history?.pastMedicalHistory || 'None reported'}
                </Text>
              </ExpandableSection>

              {/* ── Current Medications ── */}
              <ExpandableSection title="Current Medications">
                <Text style={styles.plainText}>
                  {history?.medications || 'No current medications'}
                </Text>
              </ExpandableSection>

              {/* ── Allergies ── */}
              <ExpandableSection title="Allergies" hasAlert={hasAllergies}>
                {hasAllergies ? (
                  <View style={styles.allergyAlert}>
                    <Text style={styles.allergyAlertText}>{history?.allergies}</Text>
                  </View>
                ) : (
                  <View style={styles.nkdaBadge}>
                    <Text style={styles.nkdaBadgeText}>NKDA — No Known Drug Allergies</Text>
                  </View>
                )}
              </ExpandableSection>

              {/* ── Family History ── */}
              <ExpandableSection title="Family History">
                <Text style={styles.plainText}>{history?.familyHistory || 'None reported'}</Text>
              </ExpandableSection>

              {/* ── Social History ── */}
              <ExpandableSection title="Social History">
                <Text style={styles.plainText}>{history?.socialHistory || 'None reported'}</Text>
              </ExpandableSection>

              {/* ── Systems Review ── */}
              <ExpandableSection title="Systems Review">
                <Text style={styles.plainText}>{history?.systemsReview || 'Not completed'}</Text>
              </ExpandableSection>

              {/* ── Clinical Scores ── */}
              {history?.clinicalScores ? (
                <ExpandableSection title="Clinical Scores">
                  <Text style={styles.plainText}>{history.clinicalScores}</Text>
                </ExpandableSection>
              ) : null}

              {/* ── Opportunistic Findings ── */}
              {history?.opportunisticFindings ? (
                <ExpandableSection title="Opportunistic Findings">
                  <Text style={styles.plainText}>{history.opportunisticFindings}</Text>
                </ExpandableSection>
              ) : null}

              {/* ── Differential Diagnosis Divider ── */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerLabel}>AI DIFFERENTIAL DIAGNOSIS</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* ── Differential Diagnoses ── */}
              {differentials.length > 0 ? (
                differentials.map((diag, idx) => (
                  <View key={`${diag.diagnosis}-${idx}`} style={styles.diagnosisCard}>
                    <View style={styles.diagnosisHeaderRow}>
                      <Text style={styles.diagnosisName}>{diag.diagnosis}</Text>
                      {diag.icdCode ? <Text style={styles.icdCode}>{diag.icdCode}</Text> : null}
                    </View>
                    <View style={styles.diagnosisBadgeRow}>
                      <ProbabilityBadge probability={diag.probability} />
                      {isSAPrevalent(diag.diagnosis) && (
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
                  <MaterialCommunityIcons
                    name="stethoscope"
                    size={40}
                    color={COLORS.textTertiary}
                    style={styles.stateIcon}
                  />
                  <Text style={styles.emptyStateText}>No differential diagnoses generated</Text>
                </View>
              )}

              {/* ── Doctor Actions Divider ── */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerLabel}>DOCTOR ACTIONS</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* ── Notes + Corrections + Confirm ── */}
              <View style={styles.actionsSection}>
                {confirmed && historyData?.doctorNotes ? (
                  <>
                    <Text style={styles.actionsLabel}>Doctor Notes</Text>
                    <Text style={styles.savedNotesText}>{historyData.doctorNotes}</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.actionsLabel}>Notes</Text>
                    <TextInput
                      style={styles.notesInput}
                      placeholder="Add notes..."
                      placeholderTextColor={COLORS.textTertiary}
                      multiline
                      numberOfLines={3}
                      value={notes}
                      onChangeText={setNotes}
                      textAlignVertical="top"
                      editable={!confirmed}
                    />
                    <Text style={styles.actionsLabel}>Corrections</Text>
                    <TextInput
                      style={styles.notesInput}
                      placeholder="Add corrections to the AI history..."
                      placeholderTextColor={COLORS.textTertiary}
                      multiline
                      numberOfLines={3}
                      value={corrections}
                      onChangeText={setCorrections}
                      textAlignVertical="top"
                      editable={!confirmed}
                    />
                  </>
                )}

                {confirmed ? (
                  <View style={styles.confirmedBanner}>
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={20}
                      color={COLORS.success}
                    />
                    <Text style={styles.confirmedText}>
                      Confirmed{confirmedAt ? ` — ${formatTimestamp(confirmedAt)}` : ''}
                    </Text>
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

                <TouchableOpacity
                  style={styles.reasoningButton}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('ClinicalReasoning', { consultationId })}
                >
                  <Text style={styles.reasoningButtonText}>
                    🧠  Clinical Reasoning & STG Guidance
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Bottom padding so content isn't hidden behind anything */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ---------- Styles ----------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  flex: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    minHeight: 52,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
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
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  stateIcon: {
    marginBottom: SPACING.sm,
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
    minHeight: 44,
    justifyContent: 'center',
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },

  // Summary card
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
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

  // Red flags
  redFlagBox: {
    backgroundColor: COLORS.error + '12',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  redFlagHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  redFlagLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: COLORS.error,
    letterSpacing: 1,
  },
  redFlagText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.error,
    lineHeight: 20,
  },

  // Chief complaint
  chiefComplaintBox: {
    backgroundColor: COLORS.healingMint,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: COLORS.primaryDark,
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
    minHeight: 48,
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

  // Allergies
  allergyAlert: {
    backgroundColor: COLORS.error + '12',
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
    backgroundColor: COLORS.success + '12',
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
    backgroundColor: COLORS.warning,
  },
  probLow: {
    backgroundColor: COLORS.success,
  },
  saPrevalentBadge: {
    backgroundColor: COLORS.warning + '20',
    borderWidth: 1,
    borderColor: COLORS.warning,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
  },
  saPrevalentText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: COLORS.warning,
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
  emptyStateTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptyStateText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
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
  savedNotesText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    minHeight: 80,
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
    ...SHADOWS.md,
  },
  confirmButtonDisabled: {
    opacity: 0.7,
  },
  confirmButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  reasoningButton: {
    marginTop: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  reasoningButtonText: { color: COLORS.primary, fontWeight: '700', fontSize: FONT_SIZE.sm },
  confirmedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '12',
    borderWidth: 1,
    borderColor: COLORS.success,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    justifyContent: 'center',
    gap: SPACING.sm,
    minHeight: 44,
  },
  confirmedText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.success,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: SPACING.xl,
  },
});

export default AIHistoryReviewScreen;
