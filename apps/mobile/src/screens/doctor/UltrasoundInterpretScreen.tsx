import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { apiClient } from '../../api/client';

// ─── Types ────────────────────────────────────────────────────────────────────

type RouteParams = {
  UltrasoundInterpret: { consultationId: string };
};

type Urgency = 'ROUTINE' | 'SOON' | 'URGENT' | 'EMERGENCY';

interface USSFinding {
  organ: string;
  finding: string;
  isNormal: boolean;
  isRedFlag: boolean;
  clinicalSignificance: string;
}

interface USSInterpretation {
  category: string;
  categoryLabel: string;
  gestationalAge?: string;
  edd?: string;
  normalFindings: string[];
  abnormalFindings: USSFinding[];
  redFlags: string[];
  clinicalImpression: string;
  managementRecommendations: string[];
  followUpRecommendations: string[];
  patientSummary: string;
  urgency: Urgency;
  confidenceNote: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const URGENCY_CONFIG: Record<Urgency, { color: string; icon: string; label: string }> = {
  ROUTINE:   { color: COLORS.success,   icon: 'checkmark-circle-outline', label: 'Routine' },
  SOON:      { color: COLORS.warning,   icon: 'time-outline',             label: 'Review Soon' },
  URGENT:    { color: COLORS.systemOrange, icon: 'alert-circle-outline',  label: 'Urgent' },
  EMERGENCY: { color: COLORS.emergency, icon: 'warning-outline',          label: 'EMERGENCY' },
};

const QUICK_TEMPLATES = [
  { label: 'Obstetric Dating', text: 'Single viable intrauterine pregnancy. Crown-rump length measures ' },
  { label: 'Anomaly Scan', text: 'Fetal biometry concordant with dates. Anatomy survey: ' },
  { label: 'Growth Scan', text: 'Fetal growth assessment at [GA] weeks. Estimated fetal weight ' },
  { label: 'Gynae USS', text: 'Uterus: normal size and shape. Endometrial thickness: ' },
  { label: 'Abdominal USS', text: 'Liver: normal size and echogenicity. Gallbladder: ' },
];

// ─── Section Component ────────────────────────────────────────────────────────

const Section: React.FC<{
  title: string;
  icon: string;
  iconColor?: string;
  children: React.ReactNode;
}> = ({ title, icon, iconColor = COLORS.primary, children }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Ionicons name={icon as any} size={18} color={iconColor} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {children}
  </View>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const UltrasoundInterpretScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'UltrasoundInterpret'>>();
  const { consultationId } = route.params;

  const [reportText, setReportText] = useState('');
  const [clinicalContext, setClinicalContext] = useState('');
  const [isPregnant, setIsPregnant] = useState<boolean | undefined>(undefined);
  const [gestationalAge, setGestationalAge] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [interpretation, setInterpretation] = useState<USSInterpretation | null>(null);
  const [activeTab, setActiveTab] = useState<'input' | 'results'>('input');

  const handleInterpret = async () => {
    if (reportText.trim().length < 20) {
      Alert.alert('Report Required', 'Please enter the ultrasound report text (minimum 20 characters).');
      return;
    }
    setIsLoading(true);
    try {
      const res = await apiClient.post('/ultrasound/interpret', {
        consultationId,
        reportText: reportText.trim(),
        clinicalContext: clinicalContext.trim() || undefined,
        isPregnant,
        gestationalAge: gestationalAge.trim() || undefined,
      });
      setInterpretation((res.data as { data: USSInterpretation }).data);
      setActiveTab('results');
    } catch (err: any) {
      Alert.alert(
        'Interpretation Failed',
        err?.response?.data?.error ?? 'An error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const urgencyConfig = interpretation ? URGENCY_CONFIG[interpretation.urgency] : null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.headerText}>USS Interpretation</Text>
          <Text style={styles.headerSub}>AI-Assisted Ultrasound Analysis</Text>
        </View>
        {interpretation && (
          <View style={[styles.urgencyBadge, { backgroundColor: urgencyConfig!.color }]}>
            <Text style={styles.urgencyText}>{urgencyConfig!.label}</Text>
          </View>
        )}
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {(['input', 'results'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
            disabled={tab === 'results' && !interpretation}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'input' ? 'Report Input' : 'AI Interpretation'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {activeTab === 'input' ? (
            <>
              {/* Quick Templates */}
              <View style={styles.templateRow}>
                <Text style={styles.templateLabel}>Quick Templates:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {QUICK_TEMPLATES.map((t) => (
                    <TouchableOpacity
                      key={t.label}
                      style={styles.templateChip}
                      onPress={() => setReportText((prev) => prev + t.text)}
                    >
                      <Text style={styles.templateChipText}>{t.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Report Text */}
              <Text style={styles.inputLabel}>Ultrasound Report Text *</Text>
              <TextInput
                style={[styles.textArea, styles.reportInput]}
                value={reportText}
                onChangeText={setReportText}
                placeholder="Paste or type the ultrasound report here..."
                placeholderTextColor={COLORS.textSecondary}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
              />

              {/* Clinical Context */}
              <Text style={styles.inputLabel}>Clinical Context (Optional)</Text>
              <TextInput
                style={styles.textArea}
                value={clinicalContext}
                onChangeText={setClinicalContext}
                placeholder="e.g. Patient presenting with pelvic pain, known fibroid..."
                placeholderTextColor={COLORS.textSecondary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              {/* Pregnancy Toggle */}
              <Text style={styles.inputLabel}>Is Patient Pregnant?</Text>
              <View style={styles.toggleRow}>
                {([undefined, true, false] as const).map((val) => {
                  const label = val === undefined ? 'Unknown' : val ? 'Yes' : 'No';
                  const isActive = isPregnant === val;
                  return (
                    <TouchableOpacity
                      key={label}
                      style={[styles.toggleBtn, isActive && styles.toggleBtnActive]}
                      onPress={() => setIsPregnant(val)}
                    >
                      <Text style={[styles.toggleText, isActive && styles.toggleTextActive]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Gestational Age */}
              {isPregnant === true && (
                <>
                  <Text style={styles.inputLabel}>Gestational Age (clinical)</Text>
                  <TextInput
                    style={styles.inputField}
                    value={gestationalAge}
                    onChangeText={setGestationalAge}
                    placeholder="e.g. 20+3 weeks"
                    placeholderTextColor={COLORS.textSecondary}
                  />
                </>
              )}

              {/* Interpret Button */}
              <TouchableOpacity
                style={[styles.interpretBtn, isLoading && styles.interpretBtnDisabled]}
                onPress={handleInterpret}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Ionicons name="scan-outline" size={20} color={COLORS.white} />
                    <Text style={styles.interpretBtnText}>Interpret Ultrasound</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          ) : (
            interpretation && (
              <>
                {/* Urgency Banner */}
                <View style={[styles.urgencyBanner, { backgroundColor: urgencyConfig!.color + '20' }]}>
                  <Ionicons name={urgencyConfig!.icon as any} size={22} color={urgencyConfig!.color} />
                  <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                    <Text style={[styles.urgencyBannerTitle, { color: urgencyConfig!.color }]}>
                      {urgencyConfig!.label}
                    </Text>
                    <Text style={styles.urgencyBannerSub}>{interpretation.categoryLabel}</Text>
                  </View>
                </View>

                {/* Obstetric Info */}
                {(interpretation.gestationalAge || interpretation.edd) && (
                  <View style={styles.card}>
                    <View style={styles.obsRow}>
                      {interpretation.gestationalAge && (
                        <View style={styles.obsItem}>
                          <Text style={styles.obsLabel}>Gestational Age</Text>
                          <Text style={styles.obsValue}>{interpretation.gestationalAge}</Text>
                        </View>
                      )}
                      {interpretation.edd && (
                        <View style={styles.obsItem}>
                          <Text style={styles.obsLabel}>EDD</Text>
                          <Text style={styles.obsValue}>{interpretation.edd}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* Red Flags */}
                {interpretation.redFlags.length > 0 && (
                  <Section title="Red Flags — Action Required" icon="warning" iconColor={COLORS.emergency}>
                    {interpretation.redFlags.map((flag, i) => (
                      <View key={i} style={styles.redFlagItem}>
                        <Ionicons name="alert-circle" size={14} color={COLORS.emergency} />
                        <Text style={styles.redFlagText}>{flag}</Text>
                      </View>
                    ))}
                  </Section>
                )}

                {/* Clinical Impression */}
                <Section title="Clinical Impression" icon="document-text-outline">
                  <Text style={styles.bodyText}>{interpretation.clinicalImpression}</Text>
                </Section>

                {/* Abnormal Findings */}
                {interpretation.abnormalFindings.length > 0 && (
                  <Section title="Significant Findings" icon="alert-outline" iconColor={COLORS.warning}>
                    {interpretation.abnormalFindings.map((f, i) => (
                      <View key={i} style={styles.findingCard}>
                        <View style={styles.findingHeader}>
                          <Text style={styles.findingOrgan}>{f.organ}</Text>
                          {f.isRedFlag && (
                            <View style={styles.redFlagChip}>
                              <Text style={styles.redFlagChipText}>RED FLAG</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.findingText}>{f.finding}</Text>
                        <Text style={styles.findingSignificance}>{f.clinicalSignificance}</Text>
                      </View>
                    ))}
                  </Section>
                )}

                {/* Normal Findings */}
                {interpretation.normalFindings.length > 0 && (
                  <Section title="Normal Findings" icon="checkmark-circle-outline" iconColor={COLORS.success}>
                    {interpretation.normalFindings.map((f, i) => (
                      <View key={i} style={styles.normalFindingRow}>
                        <Ionicons name="checkmark" size={14} color={COLORS.success} />
                        <Text style={styles.normalFindingText}>{f}</Text>
                      </View>
                    ))}
                  </Section>
                )}

                {/* Management */}
                <Section title="Management Recommendations" icon="medkit-outline">
                  {interpretation.managementRecommendations.map((rec, i) => (
                    <View key={i} style={styles.bulletRow}>
                      <Text style={styles.bullet}>{i + 1}.</Text>
                      <Text style={styles.bulletText}>{rec}</Text>
                    </View>
                  ))}
                </Section>

                {/* Follow-up */}
                {interpretation.followUpRecommendations.length > 0 && (
                  <Section title="Follow-Up" icon="calendar-outline">
                    {interpretation.followUpRecommendations.map((rec, i) => (
                      <View key={i} style={styles.bulletRow}>
                        <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
                        <Text style={[styles.bulletText, { marginLeft: SPACING.xs }]}>{rec}</Text>
                      </View>
                    ))}
                  </Section>
                )}

                {/* Patient Summary */}
                <Section title="Patient-Friendly Summary" icon="person-outline" iconColor={COLORS.secondary}>
                  <View style={styles.patientSummaryBox}>
                    <Text style={styles.patientSummaryText}>{interpretation.patientSummary}</Text>
                  </View>
                </Section>

                {/* Confidence Note */}
                <View style={styles.confidenceNote}>
                  <Ionicons name="information-circle-outline" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.confidenceText}>{interpretation.confidenceNote}</Text>
                </View>

                {/* Re-interpret button */}
                <TouchableOpacity
                  style={styles.reinterpretBtn}
                  onPress={() => setActiveTab('input')}
                >
                  <Ionicons name="refresh-outline" size={16} color={COLORS.primary} />
                  <Text style={styles.reinterpretText}>Edit Report & Re-Interpret</Text>
                </TouchableOpacity>
              </>
            )
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.systemGroupedBackground },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.systemBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.separator,
  },
  backBtn: { padding: SPACING.xs, marginRight: SPACING.sm },
  headerTitle: { flex: 1 },
  headerText: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.label },
  headerSub: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginTop: 2 },
  urgencyBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  urgencyText: { color: COLORS.white, fontSize: FONT_SIZE.xs, fontWeight: '700' },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.systemBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.separator,
  },
  tabBtn: { flex: 1, paddingVertical: SPACING.md, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, fontWeight: '500' },
  tabTextActive: { color: COLORS.primary, fontWeight: '700' },

  scrollView: { flex: 1 },
  scrollContent: { padding: SPACING.lg, paddingBottom: SPACING.xxl },

  templateRow: { marginBottom: SPACING.md },
  templateLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginBottom: SPACING.xs },
  templateChip: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.sm,
  },
  templateChipText: { color: COLORS.white, fontSize: FONT_SIZE.xs, fontWeight: '600' },

  inputLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.label,
    marginBottom: SPACING.xs,
    marginTop: SPACING.md,
  },
  textArea: {
    backgroundColor: COLORS.systemBackground,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.separator,
    padding: SPACING.md,
    fontSize: FONT_SIZE.sm,
    color: COLORS.label,
    minHeight: 100,
  },
  reportInput: { minHeight: 160 },
  inputField: {
    backgroundColor: COLORS.systemBackground,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.separator,
    padding: SPACING.md,
    fontSize: FONT_SIZE.sm,
    color: COLORS.label,
  },

  toggleRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  toggleBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.separator,
    alignItems: 'center',
    backgroundColor: COLORS.systemBackground,
  },
  toggleBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  toggleText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, fontWeight: '500' },
  toggleTextActive: { color: COLORS.white, fontWeight: '700' },

  interpretBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xl,
    ...SHADOWS.md,
  },
  interpretBtnDisabled: { opacity: 0.6 },
  interpretBtnText: { color: COLORS.white, fontSize: FONT_SIZE.md, fontWeight: '700' },

  urgencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  urgencyBannerTitle: { fontSize: FONT_SIZE.md, fontWeight: '700' },
  urgencyBannerSub: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 2 },

  card: {
    backgroundColor: COLORS.systemBackground,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  obsRow: { flexDirection: 'row', gap: SPACING.lg },
  obsItem: { flex: 1 },
  obsLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, fontWeight: '500' },
  obsValue: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.label, marginTop: 2 },

  section: {
    backgroundColor: COLORS.systemBackground,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm, gap: SPACING.xs },
  sectionTitle: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.label },

  bodyText: { fontSize: FONT_SIZE.sm, color: COLORS.label, lineHeight: 20 },

  redFlagItem: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.xs, marginBottom: SPACING.xs },
  redFlagText: { flex: 1, fontSize: FONT_SIZE.sm, color: COLORS.emergency, fontWeight: '600' },

  findingCard: {
    backgroundColor: COLORS.systemGray6,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.warning,
  },
  findingHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xs },
  findingOrgan: { flex: 1, fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.label },
  redFlagChip: { backgroundColor: COLORS.emergency, borderRadius: BORDER_RADIUS.xs, paddingHorizontal: 6, paddingVertical: 2 },
  redFlagChipText: { color: COLORS.white, fontSize: 10, fontWeight: '700' },
  findingText: { fontSize: FONT_SIZE.sm, color: COLORS.label, fontWeight: '500', marginBottom: SPACING.xs },
  findingSignificance: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, lineHeight: 16 },

  normalFindingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.xs, marginBottom: 4 },
  normalFindingText: { flex: 1, fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },

  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.xs },
  bullet: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, width: 20, fontWeight: '700' },
  bulletText: { flex: 1, fontSize: FONT_SIZE.sm, color: COLORS.label, lineHeight: 20 },

  patientSummaryBox: {
    backgroundColor: COLORS.secondary + '12',
    borderRadius: BORDER_RADIUS.sm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.secondary,
    padding: SPACING.md,
  },
  patientSummaryText: { fontSize: FONT_SIZE.sm, color: COLORS.label, lineHeight: 20, fontStyle: 'italic' },

  confidenceNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.xs,
    padding: SPACING.md,
    backgroundColor: COLORS.systemGray6,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.md,
  },
  confidenceText: { flex: 1, fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, lineHeight: 16 },

  reinterpretBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  reinterpretText: { color: COLORS.primary, fontSize: FONT_SIZE.sm, fontWeight: '600' },
});

export default UltrasoundInterpretScreen;
