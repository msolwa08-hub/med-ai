import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
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

interface PopulationCard {
  icon: string;
  title: string;
  description: string;
}

const SPECIAL_POPULATIONS: PopulationCard[] = [
  {
    icon: '🧓',
    title: 'Geriatric Home Visits',
    description:
      'Fall risk assessment, polypharmacy review, functional capacity evaluation, and caregiver support guidance.',
  },
  {
    icon: '🧒',
    title: 'Children with Developmental Delays',
    description:
      'Developmental milestone tracking, therapy coordination, school support letters, and family counselling notes.',
  },
  {
    icon: '🔬',
    title: 'Dysmorphic Syndromes',
    description:
      'Syndrome-specific monitoring checklists, genetics referral pathways, and multi-disciplinary team coordination.',
  },
  {
    icon: '🌿',
    title: 'Palliative & End-of-Life Care',
    description:
      'Symptom management protocols, advance directive support, family briefing templates, and community nurse handover.',
  },
  {
    icon: '🏠',
    title: 'Post-Discharge Follow-up',
    description:
      'Hospital discharge reconciliation, wound care protocols, medication adherence checks, and readmission risk scoring.',
  },
];

const FEATURE_BULLETS = [
  'AI-generated equipment checklist per visit type',
  'Patient assessment protocol tailored to diagnosis',
  'Family / caregiver briefing notes',
  'Red flags & escalation criteria',
  'Distance clinic referral pathway',
];

// ─── Component ────────────────────────────────────────────────────────────────

const HomeCarePlannerScreen: React.FC = () => {
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
        <Text style={styles.headerTitle}>Home Care Planner</Text>
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
            Plan home visits with minimum equipment checklists, protocols for
            special populations, and care coordination — all AI-generated for
            your specific patient profile.
          </Text>
        </View>

        {/* Special populations section */}
        <Text style={styles.sectionTitle}>Special Populations in Development</Text>

        {SPECIAL_POPULATIONS.map((item) => (
          <View key={item.title} style={styles.populationCard}>
            <View style={styles.populationIconWrap}>
              <Text style={styles.populationIcon}>{item.icon}</Text>
            </View>
            <View style={styles.populationContent}>
              <Text style={styles.populationTitle}>{item.title}</Text>
              <Text style={styles.populationDesc}>{item.description}</Text>
            </View>
            <View style={styles.comingSoonDot} />
          </View>
        ))}

        {/* What this will include section */}
        <Text style={[styles.sectionTitle, { marginTop: SPACING.lg }]}>
          What This Will Include
        </Text>

        <View style={styles.featureCard}>
          {FEATURE_BULLETS.map((bullet, idx) => (
            <View key={idx} style={styles.bulletRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletText}>{bullet}</Text>
            </View>
          ))}
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
    backgroundColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  phaseBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
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
    color: 'rgba(255,255,255,0.88)',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Section title
  sectionTitle: {
    ...TYPOGRAPHY.title3,
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },

  // Population cards
  populationCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
    ...SHADOWS.card,
  },
  populationIconWrap: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.secondarySystemBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    flexShrink: 0,
  },
  populationIcon: {
    fontSize: 22,
  },
  populationContent: {
    flex: 1,
  },
  populationTitle: {
    ...TYPOGRAPHY.subheadline,
    color: COLORS.primary,
    fontWeight: '700',
    marginBottom: 4,
  },
  populationDesc: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  comingSoonDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.secondary,
    marginTop: 6,
    marginLeft: SPACING.sm,
    flexShrink: 0,
  },

  // Feature card
  featureCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    ...SHADOWS.card,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  bulletDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.secondary,
    marginTop: 7,
    marginRight: SPACING.sm,
    flexShrink: 0,
  },
  bulletText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    flex: 1,
    lineHeight: 22,
  },

  // Notify button
  notifyBtn: {
    backgroundColor: COLORS.primary,
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

export default HomeCarePlannerScreen;
