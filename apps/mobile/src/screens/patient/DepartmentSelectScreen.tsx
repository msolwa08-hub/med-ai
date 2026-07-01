import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import type { Department } from '../../api/endpoints';
import type { PatientStackParamList } from '../../navigation/PatientNavigator';

// ─── Department cards ─────────────────────────────────────────────────────────

type Option =
  | { kind: 'general' }
  | { kind: 'og' }
  | { kind: 'specialty'; department: Department };

interface DepartmentCard {
  option: Option;
  label: string;
  description: string;
  icon: string;
  color: string;
}

const CARDS: DepartmentCard[] = [
  {
    option: { kind: 'general' },
    label: 'General Consultation',
    description: 'Not sure? Start here — covers any health concern',
    icon: 'chatbubbles-outline',
    color: COLORS.primary,
  },
  {
    option: { kind: 'specialty', department: 'FAMILY_MEDICINE' },
    label: 'Family Medicine',
    description: 'Chronic conditions, check-ups, whole-person care',
    icon: 'people-outline',
    color: COLORS.secondary,
  },
  {
    option: { kind: 'specialty', department: 'INTERNAL' },
    label: 'Internal Medicine',
    description: 'Heart, lungs, stomach, kidneys, nerves, hormones',
    icon: 'pulse-outline',
    color: COLORS.primary,
  },
  {
    option: { kind: 'specialty', department: 'PAEDIATRICS' },
    label: 'Paediatrics',
    description: 'For babies and children — answered by a caregiver',
    icon: 'happy-outline',
    color: COLORS.systemPurple,
  },
  {
    option: { kind: 'og' },
    label: "Women's Health (O&G)",
    description: 'Pregnancy, periods, contraception, fertility',
    icon: 'woman-outline',
    color: COLORS.systemPurple,
  },
  {
    option: { kind: 'specialty', department: 'SURGERY' },
    label: 'Surgery',
    description: 'Lumps, injuries, operations, surgical problems',
    icon: 'cut-outline',
    color: COLORS.warning,
  },
  {
    option: { kind: 'specialty', department: 'ENT' },
    label: 'Ear, Nose & Throat',
    description: 'Hearing, sinuses, voice, throat, neck lumps',
    icon: 'ear-outline',
    color: COLORS.systemBlue,
  },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export const DepartmentSelectScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<PatientStackParamList, 'DepartmentSelect'>>();
  const { consultationId, language = 'en' } = route.params;

  const handleSelect = (option: Option) => {
    if (option.kind === 'general') {
      navigation.replace('AIHistory', { consultationId, language });
    } else if (option.kind === 'og') {
      navigation.replace('OGHistory', { consultationId, language });
    } else {
      navigation.replace('SpecialtyHistory', {
        consultationId,
        department: option.department,
        language,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>What is this visit about?</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>
          Choosing the right area helps the assistant ask you the most relevant questions.
        </Text>

        {CARDS.map((card) => (
          <TouchableOpacity
            key={card.label}
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => handleSelect(card.option)}
            accessibilityRole="button"
            accessibilityLabel={card.label}
          >
            <View style={[styles.iconCircle, { backgroundColor: card.color + '1A' }]}>
              <Ionicons name={card.icon as any} size={24} color={card.color} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardLabel}>{card.label}</Text>
              <Text style={styles.cardDescription}>{card.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.systemGray3} />
          </TouchableOpacity>
        ))}
      </ScrollView>
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
  backBtn: { padding: SPACING.xs, width: 40 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.label,
  },

  content: { padding: SPACING.lg, paddingBottom: SPACING.xl },
  subtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.systemBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.md,
    minHeight: 72,
    ...SHADOWS.sm,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1 },
  cardLabel: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.label, marginBottom: 2 },
  cardDescription: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, lineHeight: 16 },
});

export default DepartmentSelectScreen;
