import React, { useCallback, useEffect, useState } from 'react';
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
import { apiClient } from '../../api/client';
import { ConsultationCard } from '../../components/ConsultationCard';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { registerForPushNotifications } from '../../services/notifications';

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

// ─── Quick actions ───────────────────────────────────────────────────────────

interface QuickAction {
  key: string;
  label: string;
  sublabel: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  onPress: (navigation: any) => void;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    key: 'find-doctor',
    label: 'Find Doctor',
    sublabel: 'Nearby & online',
    icon: 'search',
    tint: COLORS.primary,
    onPress: (navigation) => navigation.navigate('FindDoctor'),
  },
  {
    key: 'my-records',
    label: 'My Records',
    sublabel: 'Visit history',
    icon: 'folder-open-outline',
    tint: COLORS.systemBlue,
    onPress: (navigation) => navigation.navigate('MyRecords'),
  },
  {
    key: 'lab-results',
    label: 'Lab Results',
    sublabel: 'Tests & reports',
    icon: 'flask-outline',
    tint: COLORS.systemPurple,
    onPress: (navigation) => navigation.navigate('LabResults'),
  },
  {
    key: 'emergency',
    label: 'Emergency',
    sublabel: 'Share QR code',
    icon: 'alert-circle-outline',
    tint: COLORS.emergency,
    onPress: (navigation) => navigation.navigate('Emergency'),
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export const PatientHomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { consultations, isLoading, loadConsultations } = useConsultationStore();
  const [profileIncomplete, setProfileIncomplete] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadConsultations(user.id);
    }
    checkProfileCompletion();
  }, [user?.id]);

  // Register for push notifications once on mount
  useEffect(() => {
    registerForPushNotifications();
  }, []);

  async function checkProfileCompletion() {
    try {
      const res = await apiClient.get('/patients/me');
      const data = res.data as { data?: { emergencyContact?: unknown } };
      const hasEmergencyContact = data.data?.emergencyContact != null;
      if (!hasEmergencyContact) {
        setProfileIncomplete(true);
      }
    } catch {
      // Non-fatal — don't show banner if check fails
    }
  }

  const onRefresh = useCallback(() => {
    if (user?.id) {
      loadConsultations(user.id);
    }
  }, [user?.id]);

  const lang = user?.patient?.preferredLanguage || 'en';
  const greetWord = GREETING_WORDS[lang] || GREETING_WORDS['en'];
  const firstName = user?.patient?.firstName || 'there';

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
            <Ionicons name="notifications-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* ── Hero: Start a consultation ── */}
        <TouchableOpacity
          style={styles.heroCard}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('LanguageSelect')}
        >
          <View style={styles.heroDecorCircleLarge} />
          <View style={styles.heroDecorCircleSmall} />
          <View style={styles.heroIconCircle}>
            <Ionicons name="medkit" size={26} color={COLORS.white} />
          </View>
          <View style={styles.heroTextBlock}>
            <Text style={styles.heroTitle}>Start a consultation</Text>
            <Text style={styles.heroSubtitle}>
              Tell us your symptoms — a doctor will see you shortly
            </Text>
          </View>
          <View style={styles.heroChevron}>
            <Ionicons name="arrow-forward" size={20} color={COLORS.primaryDark} />
          </View>
        </TouchableOpacity>

        {/* ── Profile Incomplete Banner ── */}
        {profileIncomplete && (
          <View style={styles.profileBanner}>
            <View style={styles.profileBannerAccent} />
            <View style={styles.profileBannerBody}>
              <Ionicons name="medkit-outline" size={20} color={COLORS.secondary} />
              <View style={styles.profileBannerText}>
                <Text style={styles.profileBannerTitle}>Set up your health profile</Text>
                <Text style={styles.profileBannerSubtitle}>
                  Doctors will be better prepared for your consultations
                </Text>
              </View>
              <TouchableOpacity
                style={styles.profileBannerBtn}
                onPress={() => navigation.navigate('PatientProfileSetup', { language: user?.patient?.preferredLanguage || 'en' })}
                activeOpacity={0.85}
              >
                <Text style={styles.profileBannerBtnText}>Set Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Quick Actions ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
        </View>
        <View style={styles.quickGrid}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.key}
              style={styles.quickCard}
              activeOpacity={0.85}
              onPress={() => action.onPress(navigation)}
            >
              <View style={[styles.quickIconCircle, { backgroundColor: action.tint + '14' }]}>
                <Ionicons name={action.icon} size={22} color={action.tint} />
              </View>
              <Text style={styles.quickLabel}>{action.label}</Text>
              <Text style={styles.quickSublabel}>{action.sublabel}</Text>
            </TouchableOpacity>
          ))}
        </View>

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
            <View style={styles.emptyIconCircle}>
              <Ionicons name="medical-outline" size={28} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyStateText}>No consultations yet</Text>
            <Text style={styles.emptyStateSubText}>
              Your visit history will appear here after your first consultation.
            </Text>
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
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
    ...SHADOWS.sm,
  },

  // Hero card
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.xl,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
    minHeight: 104,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  heroDecorCircleLarge: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    opacity: 0.35,
    top: -90,
    right: -50,
  },
  heroDecorCircleSmall: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.healingTeal,
    opacity: 0.18,
    bottom: -40,
    left: -24,
  },
  heroIconCircle: {
    width: 52,
    height: 52,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  heroTextBlock: {
    flex: 1,
  },
  heroTitle: {
    ...TYPOGRAPHY.title3,
    color: COLORS.white,
  },
  heroSubtitle: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.healingTeal,
    marginTop: 4,
  },
  heroChevron: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
  },

  // Profile incomplete banner
  profileBanner: {
    flexDirection: 'row',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.secondary + '40',
    ...SHADOWS.sm,
  },
  profileBannerAccent: {
    width: 4,
    backgroundColor: COLORS.secondary,
  },
  profileBannerBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  profileBannerText: {
    flex: 1,
  },
  profileBannerTitle: {
    ...TYPOGRAPHY.footnote,
    fontWeight: '700',
    color: COLORS.label,
  },
  profileBannerSubtitle: {
    ...TYPOGRAPHY.caption2,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  profileBannerBtn: {
    backgroundColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.md,
    minHeight: 32,
    justifyContent: 'center',
  },
  profileBannerBtnText: {
    ...TYPOGRAPHY.caption1,
    fontWeight: '700',
    color: COLORS.white,
  },

  // Quick actions
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  quickCard: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    minHeight: 108,
    ...SHADOWS.card,
  },
  quickIconCircle: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  quickLabel: {
    ...TYPOGRAPHY.subheadline,
    fontWeight: '600',
    color: COLORS.label,
  },
  quickSublabel: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.secondaryLabel,
    marginTop: 2,
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
    borderRadius: BORDER_RADIUS.md,
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

  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
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
    paddingHorizontal: SPACING.lg,
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.card,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.healingMint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  emptyStateText: {
    ...TYPOGRAPHY.subheadline,
    fontWeight: '600',
    color: COLORS.label,
    marginTop: SPACING.xs,
  },
  emptyStateSubText: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.secondaryLabel,
    marginTop: 4,
    textAlign: 'center',
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
    width: 88,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    marginRight: SPACING.sm,
    ...SHADOWS.card,
  },
  doctorAvatar: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.healingTeal,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  doctorInitials: {
    ...TYPOGRAPHY.headline,
    color: COLORS.primaryDark,
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
