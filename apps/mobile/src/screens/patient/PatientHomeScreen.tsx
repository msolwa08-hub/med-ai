import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { useConsultationStore, Consultation } from '../../store/consultationStore';
import { ConsultationCard } from '../../components/ConsultationCard';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';

// ─── Greeting helpers ────────────────────────────────────────────────────────

const GREETING_WORDS: Record<string, string> = {
  en: 'Good morning',
  zu: 'Sawubona',
  xh: 'Molo',
  af: 'Goeie môre',
  nso: 'Dumela',
  tn: 'Dumela',
  st: 'Dumela',
  ts: 'Ahee',
  ss: 'Sawubona',
  ve: 'Ndaa',
  nr: 'Lotjhani',
};

const formatLastVisit = (consultations: Consultation[]): string => {
  if (!consultations.length) return 'No visits yet';
  const sorted = [...consultations].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const date = new Date(sorted[0].createdAt);
  return date.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
};

const uniqueDoctors = (consultations: Consultation[]) => {
  const seen = new Set<string>();
  return consultations
    .filter((c) => c.doctor)
    .filter((c) => {
      if (seen.has(c.doctor!.id)) return false;
      seen.add(c.doctor!.id);
      return true;
    })
    .map((c) => c.doctor!);
};

// ─── Component ───────────────────────────────────────────────────────────────

export const PatientHomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { consultations, isLoading, loadConsultations } = useConsultationStore();

  useEffect(() => {
    if (user?.id) {
      loadConsultations(user.id);
    }
  }, [user?.id]);

  const onRefresh = useCallback(() => {
    if (user?.id) {
      loadConsultations(user.id);
    }
  }, [user?.id]);

  const lang = user?.preferredLanguage || 'en';
  const greetWord = GREETING_WORDS[lang] || GREETING_WORDS['en'];
  const firstName = user?.firstName || 'there';

  const recentConsultations = [...consultations]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  const doctors = uniqueDoctors(consultations);

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerTextBlock}>
            <Text style={styles.greetingWord}>{greetWord},</Text>
            <Text style={styles.patientName}>{firstName}</Text>
          </View>
          <TouchableOpacity
            style={styles.notificationBtn}
            onPress={() => Alert.alert('Notifications', 'Push notifications coming soon.')}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="notifications-outline" size={28} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* ── Emergency Banner ── */}
        <TouchableOpacity
          style={styles.emergencyBanner}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Emergency')}
        >
          <Ionicons name="alert-circle-outline" size={20} color={COLORS.white} style={{ marginRight: 8 }} />
          <Text style={styles.emergencyBannerText}>Emergency — tap to share QR</Text>
        </TouchableOpacity>

        {/* ── Stats Row ── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{consultations.length}</Text>
            <Text style={styles.statLabel}>Consultations</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{doctors.length}</Text>
            <Text style={styles.statLabel}>Doctors Seen</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValueSmall} numberOfLines={2}>
              {formatLastVisit(consultations)}
            </Text>
            <Text style={styles.statLabel}>Last Visit</Text>
          </View>
        </View>

        {/* ── Primary CTA ── */}
        <TouchableOpacity
          style={styles.ctaButton}
          activeOpacity={0.88}
          onPress={() => navigation.navigate('LanguageSelect')}
        >
          <Ionicons name="add-circle" size={22} color={COLORS.white} style={{ marginRight: 10 }} />
          <Text style={styles.ctaText}>Start New Consultation</Text>
        </TouchableOpacity>

        {/* ── Recent Consultations ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>RECENT CONSULTATIONS</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('MyRecords')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {recentConsultations.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="medical-outline" size={40} color={COLORS.systemGray3} />
            <Text style={styles.emptyStateText}>No consultations yet.</Text>
            <Text style={styles.emptyStateSubText}>Tap "Start New Consultation" above.</Text>
          </View>
        ) : (
          <FlatList
            data={recentConsultations}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <View style={styles.horizontalCard}>
                <ConsultationCard
                  consultation={item}
                  onPress={() =>
                    navigation.navigate('ConsultationStatus', { consultationId: item.id })
                  }
                />
              </View>
            )}
          />
        )}

        {/* ── Your Doctors ── */}
        {doctors.length > 0 && (
          <>
            <View style={[styles.sectionHeader, { marginTop: SPACING.lg }]}>
              <Text style={styles.sectionTitle}>YOUR DOCTORS</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.doctorsScroll}
            >
              {doctors.map((doc) => (
                <TouchableOpacity
                  key={doc.id}
                  style={styles.doctorCard}
                  onPress={() => navigation.navigate('DoctorProfile', { doctorId: doc.id })}
                  activeOpacity={0.8}
                >
                  <View style={styles.doctorAvatar}>
                    <Text style={styles.doctorInitials}>
                      {doc.firstName?.[0] ?? '?'}
                      {doc.lastName?.[0] ?? ''}
                    </Text>
                  </View>
                  <Text style={styles.doctorName} numberOfLines={1}>
                    Dr. {doc.lastName}
                  </Text>
                  <Text style={styles.doctorType} numberOfLines={1}>
                    {doc.doctorType?.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        <View style={{ height: SPACING.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.systemGroupedBackground,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: SPACING.xxxl,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  headerTextBlock: {
    flex: 1,
  },
  greetingWord: {
    ...TYPOGRAPHY.subheadline,
    color: COLORS.secondaryLabel,
  },
  patientName: {
    ...TYPOGRAPHY.largeTitle,
    color: COLORS.label,
    marginTop: 2,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
  },

  // Emergency Banner
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.emergency,
    borderRadius: 12,
    height: 52,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  emergencyBannerText: {
    ...TYPOGRAPHY.subheadline,
    color: COLORS.white,
    fontWeight: '600',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.card,
  },
  statValue: {
    ...TYPOGRAPHY.title2,
    color: COLORS.primary,
    textAlign: 'center',
  },
  statValueSmall: {
    ...TYPOGRAPHY.headline,
    color: COLORS.primary,
    textAlign: 'center',
    lineHeight: 20,
  },
  statLabel: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.secondaryLabel,
    textAlign: 'center',
    marginTop: 4,
  },

  // CTA Button
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 14,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  ctaText: {
    ...TYPOGRAPHY.headline,
    color: COLORS.white,
  },

  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: 8,
  },
  sectionTitle: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  seeAll: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Consultation list
  horizontalList: {
    paddingLeft: SPACING.lg,
    paddingRight: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  horizontalCard: {
    width: 300,
    marginRight: SPACING.sm,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    ...SHADOWS.card,
  },
  emptyStateText: {
    ...TYPOGRAPHY.subheadline,
    fontWeight: '600',
    color: COLORS.secondaryLabel,
    marginTop: SPACING.sm,
  },
  emptyStateSubText: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.tertiaryLabel,
    marginTop: 4,
  },

  // Doctors
  doctorsScroll: {
    paddingLeft: SPACING.lg,
    paddingRight: SPACING.sm,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  doctorCard: {
    alignItems: 'center',
    width: 80,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    marginRight: SPACING.sm,
    ...SHADOWS.card,
  },
  doctorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  doctorInitials: {
    ...TYPOGRAPHY.headline,
    color: COLORS.white,
  },
  doctorName: {
    ...TYPOGRAPHY.caption2,
    fontWeight: '600',
    color: COLORS.label,
    textAlign: 'center',
  },
  doctorType: {
    ...TYPOGRAPHY.caption2,
    color: COLORS.secondaryLabel,
    textAlign: 'center',
    textTransform: 'capitalize',
    marginTop: 2,
  },
});

export default PatientHomeScreen;
