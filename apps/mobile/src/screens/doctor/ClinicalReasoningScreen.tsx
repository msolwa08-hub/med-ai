import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { clinicalReasoningApi } from '../../api/endpoints';
import type { DoctorStackParamList } from '../../navigation/DoctorNavigator';

// ─── Types (mirror the API package) ──────────────────────────────────────────

interface StgLink {
  available: boolean;
  condition?: string;
  icdCode?: string;
  levelOfCare?: string;
  firstLineMedications?: Array<{ medicine: string; dose?: string; duration?: string }>;
  keyInvestigations?: string[];
  referralCriteria?: string[];
  nonPharmacological?: string[];
}

interface Differential {
  diagnosis: string;
  icd10Code: string;
  probability: number;
  band: 'HIGH' | 'MODERATE' | 'LOW';
  reasoning: string;
  supportingFeatures: string[];
  againstFeatures: string[];
  stg: StgLink;
}

interface ReasoningPackage {
  chiefComplaint: string;
  differentials: Differential[];
  recommendedInvestigations: Array<{
    name: string;
    rationale: string;
    priority: 'ROUTINE' | 'URGENT' | 'STAT';
  }>;
  redFlags: string[];
  urgency: 'ROUTINE' | 'SOON' | 'URGENT' | 'EMERGENCY';
  safetyNetting: string;
}

// ─── Presentation helpers ─────────────────────────────────────────────────────

const URGENCY_META: Record<
  ReasoningPackage['urgency'],
  { label: string; color: string; icon: string }
> = {
  ROUTINE: { label: 'Routine', color: COLORS.success, icon: 'checkmark-circle' },
  SOON: { label: 'Review Soon', color: COLORS.systemOrange, icon: 'time' },
  URGENT: { label: 'Urgent', color: COLORS.warning, icon: 'alert-circle' },
  EMERGENCY: { label: 'Emergency', color: COLORS.emergency, icon: 'warning' },
};

const BAND_COLORS: Record<Differential['band'], string> = {
  HIGH: COLORS.emergency,
  MODERATE: COLORS.systemOrange,
  LOW: COLORS.systemGray,
};

const PRIORITY_COLORS: Record<string, string> = {
  STAT: COLORS.emergency,
  URGENT: COLORS.systemOrange,
  ROUTINE: COLORS.systemGray,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const ProbabilityBar: React.FC<{ value: number; color: string }> = ({ value, color }) => (
  <View style={styles.probTrack}>
    <View style={[styles.probFill, { width: `${Math.min(100, Math.max(2, value))}%`, backgroundColor: color }]} />
  </View>
);

const FeatureRow: React.FC<{ text: string; supports: boolean }> = ({ text, supports }) => (
  <View style={styles.featureRow}>
    <Ionicons
      name={supports ? 'add-circle' : 'remove-circle'}
      size={14}
      color={supports ? COLORS.success : COLORS.systemGray}
    />
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const StgPanel: React.FC<{ stg: StgLink }> = ({ stg }) => {
  if (!stg.available) {
    return (
      <View style={styles.stgUnavailable}>
        <Ionicons name="book-outline" size={13} color={COLORS.textSecondary} />
        <Text style={styles.stgUnavailableText}>No matching STG entry — use clinical judgement</Text>
      </View>
    );
  }
  return (
    <View style={styles.stgPanel}>
      <View style={styles.stgHeader}>
        <View style={styles.stgBadge}>
          <Ionicons name="book" size={11} color={COLORS.white} />
          <Text style={styles.stgBadgeText}>SA STG</Text>
        </View>
        <Text style={styles.stgCondition} numberOfLines={1}>
          {stg.condition} ({stg.icdCode})
        </Text>
        {stg.levelOfCare ? (
          <View style={styles.levelChip}>
            <Text style={styles.levelChipText}>{stg.levelOfCare}</Text>
          </View>
        ) : null}
      </View>

      {(stg.firstLineMedications?.length ?? 0) > 0 && (
        <>
          <Text style={styles.stgSectionLabel}>First-line treatment</Text>
          {(stg.firstLineMedications ?? []).map((m, i) => (
            <View key={i} style={styles.stgMedRow}>
              <Ionicons name="medkit-outline" size={12} color={COLORS.primary} />
              <Text style={styles.stgMedText}>
                <Text style={styles.stgMedName}>{m.medicine}</Text>
                {m.dose ? ` — ${m.dose}` : ''}
                {m.duration ? ` (${m.duration})` : ''}
              </Text>
            </View>
          ))}
        </>
      )}

      {(stg.referralCriteria?.length ?? 0) > 0 && (
        <>
          <Text style={styles.stgSectionLabel}>Refer when</Text>
          {(stg.referralCriteria ?? []).slice(0, 3).map((r, i) => (
            <View key={i} style={styles.stgMedRow}>
              <Ionicons name="arrow-redo-outline" size={12} color={COLORS.systemOrange} />
              <Text style={styles.stgMedText}>{r}</Text>
            </View>
          ))}
        </>
      )}
    </View>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────

export const ClinicalReasoningScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<DoctorStackParamList, 'ClinicalReasoning'>>();
  const { consultationId } = route.params;

  const [pkg, setPkg] = useState<ReasoningPackage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(0);

  const generate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await clinicalReasoningApi.generate(consultationId);
      setPkg(res.data.data as ReasoningPackage);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to generate the reasoning package.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [consultationId]);

  useEffect(() => {
    generate();
  }, [generate]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingTitle}>Reasoning through the case…</Text>
          <Text style={styles.loadingSub}>
            Weighing differentials and matching SA Standard Treatment Guidelines
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !pkg) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={44} color={COLORS.systemGray3} />
          <Text style={styles.loadingTitle}>{error ?? 'Something went wrong'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={generate} activeOpacity={0.8}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const urgency = URGENCY_META[pkg.urgency];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.headerMid}>
          <Text style={styles.headerTitle}>Clinical Reasoning</Text>
          <Text style={styles.headerSub}>AI draft — verify before acting</Text>
        </View>
        <TouchableOpacity onPress={generate} style={styles.backBtn} accessibilityLabel="Regenerate">
          <Ionicons name="refresh" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Urgency + complaint hero */}
        <View style={[styles.heroCard, { borderLeftColor: urgency.color }]}>
          <View style={styles.heroTop}>
            <View style={[styles.urgencyChip, { backgroundColor: urgency.color }]}>
              <Ionicons name={urgency.icon as any} size={13} color={COLORS.white} />
              <Text style={styles.urgencyChipText}>{urgency.label}</Text>
            </View>
            <Text style={styles.heroIcd}>{pkg.differentials.length} differentials</Text>
          </View>
          <Text style={styles.heroComplaint}>{pkg.chiefComplaint}</Text>
        </View>

        {/* Red flags */}
        {pkg.redFlags.length > 0 && (
          <View style={styles.redFlagCard}>
            <View style={styles.redFlagHead}>
              <Ionicons name="flag" size={15} color={COLORS.emergency} />
              <Text style={styles.redFlagTitle}>Red Flags</Text>
            </View>
            {pkg.redFlags.map((f, i) => (
              <Text key={i} style={styles.redFlagItem}>• {f}</Text>
            ))}
          </View>
        )}

        {/* Differentials */}
        <Text style={styles.sectionTitle}>Differential Diagnoses</Text>
        {pkg.differentials.map((d, i) => {
          const isOpen = expanded === i;
          const bandColor = BAND_COLORS[d.band];
          return (
            <TouchableOpacity
              key={i}
              style={styles.diffCard}
              activeOpacity={0.85}
              onPress={() => setExpanded(isOpen ? null : i)}
            >
              <View style={styles.diffTop}>
                <View style={styles.diffRank}>
                  <Text style={styles.diffRankText}>{i + 1}</Text>
                </View>
                <View style={styles.diffTitleWrap}>
                  <Text style={styles.diffName}>{d.diagnosis}</Text>
                  <Text style={styles.diffIcd}>ICD-10 {d.icd10Code}</Text>
                </View>
                <View style={styles.diffProbWrap}>
                  <Text style={[styles.diffProb, { color: bandColor }]}>{d.probability}%</Text>
                  <Text style={[styles.diffBand, { color: bandColor }]}>{d.band}</Text>
                </View>
              </View>

              <ProbabilityBar value={d.probability} color={bandColor} />

              {isOpen && (
                <View style={styles.diffBody}>
                  <Text style={styles.reasoningText}>{d.reasoning}</Text>

                  {d.supportingFeatures.map((f, j) => (
                    <FeatureRow key={`s${j}`} text={f} supports />
                  ))}
                  {d.againstFeatures.map((f, j) => (
                    <FeatureRow key={`a${j}`} text={f} supports={false} />
                  ))}

                  <StgPanel stg={d.stg} />
                </View>
              )}

              <View style={styles.expandHint}>
                <Ionicons
                  name={isOpen ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color={COLORS.systemGray3}
                />
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Investigations */}
        {pkg.recommendedInvestigations.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recommended Investigations</Text>
            <View style={styles.invCard}>
              {pkg.recommendedInvestigations.map((inv, i) => (
                <View
                  key={i}
                  style={[
                    styles.invRow,
                    i < pkg.recommendedInvestigations.length - 1 && styles.invRowBorder,
                  ]}
                >
                  <View
                    style={[
                      styles.invPriority,
                      { backgroundColor: (PRIORITY_COLORS[inv.priority] ?? COLORS.systemGray) + '1A' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.invPriorityText,
                        { color: PRIORITY_COLORS[inv.priority] ?? COLORS.systemGray },
                      ]}
                    >
                      {inv.priority}
                    </Text>
                  </View>
                  <View style={styles.invTextWrap}>
                    <Text style={styles.invName}>{inv.name}</Text>
                    <Text style={styles.invRationale}>{inv.rationale}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Safety netting */}
        <View style={styles.safetyCard}>
          <Ionicons name="umbrella-outline" size={16} color={COLORS.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.safetyTitle}>Safety Netting</Text>
            <Text style={styles.safetyText}>{pkg.safetyNetting}</Text>
          </View>
        </View>

        {/* Next actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.secondaryAction}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Examination', { consultationId })}
          >
            <Ionicons name="body-outline" size={16} color={COLORS.primary} />
            <Text style={styles.secondaryActionText}>Examination</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryAction}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Diagnosis', { consultationId })}
          >
            <Ionicons name="checkbox-outline" size={16} color={COLORS.white} />
            <Text style={styles.primaryActionText}>Select Diagnosis</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.disclaimer}>
          Decision support only. Probabilities are calibrated estimates from the history — the
          final diagnosis and plan remain your clinical responsibility.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.systemGroupedBackground },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl, gap: SPACING.sm },
  loadingTitle: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.label, textAlign: 'center' },
  loadingSub: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, textAlign: 'center' },
  retryBtn: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
  },
  retryBtnText: { color: COLORS.white, fontWeight: '600' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.systemBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.separator,
  },
  backBtn: { padding: SPACING.xs, width: 40, alignItems: 'center' },
  headerMid: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.label },
  headerSub: { fontSize: 10, color: COLORS.textSecondary, marginTop: 1 },

  content: { padding: SPACING.lg, paddingBottom: SPACING.xl * 2 },

  heroCard: {
    backgroundColor: COLORS.systemBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderLeftWidth: 4,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm },
  urgencyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  urgencyChipText: { color: COLORS.white, fontSize: FONT_SIZE.xs, fontWeight: '700' },
  heroIcd: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },
  heroComplaint: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.label, lineHeight: 22 },

  redFlagCard: {
    backgroundColor: COLORS.emergency + '10',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.emergency + '30',
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  redFlagHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACING.xs },
  redFlagTitle: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.emergency },
  redFlagItem: { fontSize: FONT_SIZE.sm, color: COLORS.label, lineHeight: 20 },

  sectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },

  diffCard: {
    backgroundColor: COLORS.systemBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  diffTop: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm, gap: SPACING.sm },
  diffRank: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  diffRankText: { fontSize: FONT_SIZE.xs, fontWeight: '800', color: COLORS.primary },
  diffTitleWrap: { flex: 1 },
  diffName: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.label },
  diffIcd: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginTop: 1 },
  diffProbWrap: { alignItems: 'flex-end' },
  diffProb: { fontSize: FONT_SIZE.lg, fontWeight: '800' },
  diffBand: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },

  probTrack: { height: 6, borderRadius: 3, backgroundColor: COLORS.systemGray5, overflow: 'hidden' },
  probFill: { height: 6, borderRadius: 3 },

  diffBody: { marginTop: SPACING.md },
  reasoningText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.label,
    lineHeight: 20,
    marginBottom: SPACING.sm,
    fontStyle: 'italic',
  },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 4 },
  featureText: { flex: 1, fontSize: FONT_SIZE.sm, color: COLORS.label, lineHeight: 18 },

  stgPanel: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.primary + '08',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
    padding: SPACING.md,
  },
  stgHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACING.xs },
  stgBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  stgBadgeText: { color: COLORS.white, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  stgCondition: { flex: 1, fontSize: FONT_SIZE.xs, fontWeight: '600', color: COLORS.label },
  levelChip: {
    backgroundColor: COLORS.systemGray5,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  levelChipText: { fontSize: 9, fontWeight: '700', color: COLORS.textSecondary },
  stgSectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: SPACING.xs,
    marginBottom: 3,
  },
  stgMedRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 5, marginBottom: 3 },
  stgMedText: { flex: 1, fontSize: FONT_SIZE.xs, color: COLORS.label, lineHeight: 16 },
  stgMedName: { fontWeight: '700' },
  stgUnavailable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: COLORS.systemGray6,
    borderRadius: BORDER_RADIUS.md,
  },
  stgUnavailableText: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },

  expandHint: { alignItems: 'center', marginTop: SPACING.xs },

  invCard: {
    backgroundColor: COLORS.systemBackground,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.sm,
  },
  invRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, padding: SPACING.md },
  invRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.separator },
  invPriority: { borderRadius: BORDER_RADIUS.sm, paddingHorizontal: 6, paddingVertical: 3, minWidth: 58, alignItems: 'center' },
  invPriorityText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },
  invTextWrap: { flex: 1 },
  invName: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.label },
  invRationale: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginTop: 2, lineHeight: 16 },

  safetyCard: {
    flexDirection: 'row',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary + '0D',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.lg,
    alignItems: 'flex-start',
  },
  safetyTitle: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.primary, marginBottom: 2 },
  safetyText: { fontSize: FONT_SIZE.sm, color: COLORS.label, lineHeight: 19 },

  actionRow: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.lg },
  secondaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    paddingVertical: SPACING.md,
    minHeight: 48,
  },
  secondaryActionText: { color: COLORS.primary, fontWeight: '700', fontSize: FONT_SIZE.sm },
  primaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    minHeight: 48,
    ...SHADOWS.sm,
  },
  primaryActionText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZE.sm },

  disclaimer: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
});

export default ClinicalReasoningScreen;
