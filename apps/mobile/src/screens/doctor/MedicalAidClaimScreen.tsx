import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZE,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../../constants/theme';

// ─── Data ─────────────────────────────────────────────────────────────────────

interface SchemeCard {
  abbreviation: string;
  name: string;
  color: string;
}

const MEDICAL_AID_SCHEMES: SchemeCard[] = [
  { abbreviation: 'DH', name: 'Discovery Health', color: '#0033A0' },
  { abbreviation: 'MS', name: 'Medscheme', color: '#00539F' },
  { abbreviation: 'BON', name: 'Bonitas', color: '#E63312' },
  { abbreviation: 'GEMS', name: 'Government Employees Medical Scheme', color: '#005B9A' },
  { abbreviation: 'MOM', name: 'Momentum Health', color: '#009A44' },
  { abbreviation: 'BNK', name: 'Bankmed', color: '#1B3A6B' },
];

const AUTOMATION_FEATURES = [
  'ICD-10 coded claim generation',
  'Tariff code (NRPL / Medtariff) lookup',
  'Pre-authorization request drafting',
  'Claim document PDF generation',
  'Direct EDI submission',
];

// ─── Component ────────────────────────────────────────────────────────────────

const MedicalAidClaimScreen: React.FC = () => {
  const navigation = useNavigation();

  const handleNotify = () => {
    Alert.alert(
      'Notification Registered',
      "You'll be notified when Phase 2 launches.",
      [{ text: 'OK', style: 'default' }]
    );
  };

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
        <Text style={styles.headerTitle}>Medical Aid Claims</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Phase 2 banner */}
        <View style={styles.phaseBanner}>
          <View style={styles.phaseBadge}>
            <Text style={styles.phaseBadgeText}>PHASE 2</Text>
          </View>
          <Text style={styles.phaseHeading}>Coming Soon</Text>
          <Text style={styles.phaseDescription}>
            End-to-end medical aid claim infrastructure — from ICD-10 coding to
            direct EDI submission — integrated into your consultation workflow.
          </Text>
        </View>

        {/* Medical Aid Integration Roadmap */}
        <Text style={styles.sectionTitle}>Medical Aid Integration Roadmap</Text>

        <View style={styles.schemesGrid}>
          {MEDICAL_AID_SCHEMES.map((scheme) => (
            <View key={scheme.abbreviation} style={styles.schemeCard}>
              <View
                style={[styles.schemeLogoWrap, { backgroundColor: scheme.color }]}
              >
                <Text style={styles.schemeAbbr}>{scheme.abbreviation}</Text>
              </View>
              <Text style={styles.schemeName} numberOfLines={2}>
                {scheme.name}
              </Text>
              <View style={styles.schemeStatusBadge}>
                <Text style={styles.schemeStatusText}>Planned</Text>
              </View>
            </View>
          ))}
        </View>

        {/* What will be automated */}
        <Text style={[styles.sectionTitle, { marginTop: SPACING.lg }]}>
          What Will Be Automated
        </Text>

        <View style={styles.featureCard}>
          {AUTOMATION_FEATURES.map((feat, idx) => (
            <View key={idx} style={styles.bulletRow}>
              <View style={styles.bulletIndex}>
                <Text style={styles.bulletIndexText}>{idx + 1}</Text>
              </View>
              <Text style={styles.bulletText}>{feat}</Text>
            </View>
          ))}
        </View>

        {/* Claim structure preview */}
        <Text style={[styles.sectionTitle, { marginTop: SPACING.lg }]}>
          Claim Structure Preview
        </Text>

        <View style={styles.claimPreviewCard}>
          <View style={styles.claimPreviewHeader}>
            <Text style={styles.claimPreviewHeaderText}>
              Sample Claim Line — Outpatient Consultation
            </Text>
          </View>

          <View style={styles.claimBody}>
            <ClaimRow label="Service Date" value="[date of consultation]" />
            <View style={styles.claimDivider} />
            <ClaimRow
              label="Tariff Code"
              value="0190 — Consultation, new patient"
              highlight
            />
            <View style={styles.claimDivider} />
            <ClaimRow label="ICD-10" value="[AI-assigned diagnosis code]" />
            <View style={styles.claimDivider} />
            <ClaimRow label="Amount" value="R [consultation fee]" highlight />
          </View>

          <View style={styles.claimFooter}>
            <View style={styles.claimStatusDot} />
            <Text style={styles.claimFooterText}>
              AI will auto-populate ICD-10 codes from your DiagnosisScreen
              findings, and suggest the correct NRPL tariff.
            </Text>
          </View>
        </View>

        {/* Notify button */}
        <TouchableOpacity
          style={styles.notifyBtn}
          onPress={handleNotify}
          activeOpacity={0.82}
        >
          <Text style={styles.notifyBtnText}>Notify Me When Ready</Text>
        </TouchableOpacity>

        <View style={{ height: SPACING.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Claim row sub-component ──────────────────────────────────────────────────

interface ClaimRowProps {
  label: string;
  value: string;
  highlight?: boolean;
}

const ClaimRow: React.FC<ClaimRowProps> = ({ label, value, highlight }) => (
  <View style={claimRowStyles.row}>
    <Text style={claimRowStyles.label}>{label}</Text>
    <Text
      style={[
        claimRowStyles.value,
        highlight && claimRowStyles.valueHighlight,
      ]}
    >
      {value}
    </Text>
  </View>
);

const claimRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  label: {
    ...TYPOGRAPHY.subheadline,
    color: COLORS.textSecondary,
    flex: 1,
  },
  value: {
    ...TYPOGRAPHY.subheadline,
    color: COLORS.text,
    flex: 1,
    textAlign: 'right',
  },
  valueHighlight: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
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
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.md,
  },

  // Phase banner
  phaseBanner: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    ...SHADOWS.lg,
  },
  phaseBadge: {
    backgroundColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  phaseBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 2,
  },
  phaseHeading: {
    ...TYPOGRAPHY.title2,
    color: COLORS.white,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  phaseDescription: {
    ...TYPOGRAPHY.subheadline,
    color: 'rgba(255,255,255,0.80)',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Section title
  sectionTitle: {
    ...TYPOGRAPHY.title3,
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },

  // Schemes grid
  schemesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  schemeCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    width: '31%',
    minWidth: 100,
    ...SHADOWS.card,
  },
  schemeLogoWrap: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  schemeAbbr: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  schemeName: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.text,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  schemeStatusBadge: {
    backgroundColor: '#E8F5F0',
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  schemeStatusText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.secondary,
    fontWeight: '600',
  },

  // Feature card
  featureCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.card,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  bulletIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    flexShrink: 0,
  },
  bulletIndexText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: COLORS.white,
  },
  bulletText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    flex: 1,
  },

  // Claim preview
  claimPreviewCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.card,
    marginBottom: SPACING.lg,
  },
  claimPreviewHeader: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
  },
  claimPreviewHeaderText: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.white,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  claimBody: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.sm,
  },
  claimDivider: {
    height: 1,
    backgroundColor: COLORS.separator,
  },
  claimFooter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E8F5F0',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  claimStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.secondary,
    marginTop: 5,
    flexShrink: 0,
  },
  claimFooterText: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.secondaryDark,
    flex: 1,
    lineHeight: 18,
  },

  // Notify button
  notifyBtn: {
    backgroundColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  notifyBtnText: {
    ...TYPOGRAPHY.headline,
    color: COLORS.white,
  },
});

export default MedicalAidClaimScreen;
