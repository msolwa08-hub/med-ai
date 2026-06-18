import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Image,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { useConsultationStore, Consultation } from '../../store/consultationStore';
import { ConsultationCard } from '../../components/ConsultationCard';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';

const GREETINGS: Record<string, (name: string) => string> = {
  en: (n) => `Good morning, ${n}`,
  zu: (n) => `Sawubona, ${n}`,
  xh: (n) => `Molo, ${n}`,
  af: (n) => `Goeie môre, ${n}`,
  nso: (n) => `Dumela, ${n}`,
  tn: (n) => `Dumela, ${n}`,
  st: (n) => `Dumela, ${n}`,
  ts: (n) => `Ahee, ${n}`,
  ss: (n) => `Sawubona, ${n}`,
  ve: (n) => `Ndaa, ${n}`,
  nr: (n) => `Lotjhani, ${n}`,
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

export const PatientHomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { consultations, isLoading, loadConsultations } = useConsultationStore();

  const fabScale = useRef(new Animated.Value(1)).current;

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

  const pulseFab = () => {
    Animated.sequence([
      Animated.timing(fabScale, { toValue: 0.92, duration: 100, useNativeDriver: true }),
      Animated.timing(fabScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const lang = user?.preferredLanguage || 'en';
  const greetFn = GREETINGS[lang] || GREETINGS['en'];
  const greeting = greetFn(user?.firstName || 'there');

  const recentConsultations = [...consultations]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  const doctors = uniqueDoctors(consultations);

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTextBlock}>
            <Text style={styles.greeting}>{greeting} 👋</Text>
            <Text style={styles.subGreeting}>How are you feeling today?</Text>
          </View>
          {user?.profileImage ? (
            <Image source={{ uri: user.profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.profilePlaceholder}>
              <Text style={styles.profileInitials}>
                {user?.firstName?.[0] ?? '?'}
                {user?.lastName?.[0] ?? ''}
              </Text>
            </View>
          )}
        </View>

        {/* Start Consultation CTA */}
        <TouchableOpacity
          style={styles.ctaButton}
          activeOpacity={0.88}
          onPress={() => navigation.navigate('LanguageSelect')}
        >
          <Text style={styles.ctaIcon}>✨</Text>
          <View style={styles.ctaTextBlock}>
            <Text style={styles.ctaTitle}>Start New Consultation</Text>
            <Text style={styles.ctaSubtitle}>AI-powered · 11 languages · Confidential</Text>
          </View>
          <Text style={styles.ctaArrow}>›</Text>
        </TouchableOpacity>

        {/* Quick stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{consultations.length}</Text>
            <Text style={styles.statLabel}>Total Consultations</Text>
          </View>
          <View style={[styles.statCard, styles.statCardMiddle]}>
            <Text style={styles.statValue}>{doctors.length}</Text>
            <Text style={styles.statLabel}>Doctors Seen</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue} numberOfLines={2} style={{ fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.primary }}>
              {formatLastVisit(consultations)}
            </Text>
            <Text style={styles.statLabel}>Last Visit</Text>
          </View>
        </View>

        {/* Recent Consultations */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Consultations</Text>
          <TouchableOpacity onPress={() => navigation.navigate('MyRecords')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {recentConsultations.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🩺</Text>
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
                    navigation.navigate('ConsultationDetail', { consultationId: item.id })
                  }
                />
              </View>
            )}
          />
        )}

        {/* Your Doctors */}
        {doctors.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Doctors</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {doctors.map((doc) => (
                <TouchableOpacity
                  key={doc.id}
                  style={styles.doctorChip}
                  onPress={() => navigation.navigate('DoctorProfile', { doctorId: doc.id })}
                  activeOpacity={0.8}
                >
                  <View style={styles.doctorChipAvatar}>
                    <Text style={styles.doctorChipInitials}>
                      {doc.firstName[0]}
                      {doc.lastName[0]}
                    </Text>
                  </View>
                  <Text style={styles.doctorChipName} numberOfLines={1}>
                    Dr. {doc.lastName}
                  </Text>
                  <Text style={styles.doctorChipType} numberOfLines={1}>
                    {doc.doctorType?.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* Bottom padding for FAB */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Emergency FAB */}
      <Animated.View style={[styles.fab, { transform: [{ scale: fabScale }] }]}>
        <TouchableOpacity
          style={styles.fabButton}
          activeOpacity={0.85}
          onPress={() => {
            pulseFab();
            navigation.navigate('Emergency');
          }}
        >
          <Text style={styles.fabIcon}>🚨</Text>
          <Text style={styles.fabLabel}>EMERGENCY</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  headerTextBlock: {
    flex: 1,
  },
  greeting: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
    color: COLORS.text,
  },
  subGreeting: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginLeft: SPACING.md,
  },
  profilePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.md,
  },
  profileInitials: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: FONT_SIZE.lg,
  },
  ctaButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  ctaIcon: {
    fontSize: 28,
    marginRight: SPACING.md,
  },
  ctaTextBlock: {
    flex: 1,
  },
  ctaTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.white,
  },
  ctaSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  ctaArrow: {
    fontSize: 28,
    color: 'rgba(255,255,255,0.8)',
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statCardMiddle: {
    marginHorizontal: 0,
  },
  statValue: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  seeAll: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primaryLight,
    fontWeight: '600',
  },
  horizontalList: {
    paddingRight: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  horizontalCard: {
    width: 300,
    marginRight: SPACING.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyStateIcon: {
    fontSize: 40,
    marginBottom: SPACING.sm,
  },
  emptyStateText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  emptyStateSubText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    marginTop: 4,
  },
  doctorChip: {
    alignItems: 'center',
    marginRight: SPACING.md,
    width: 80,
  },
  doctorChipAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    ...SHADOWS.sm,
  },
  doctorChipInitials: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: FONT_SIZE.lg,
  },
  doctorChipName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  doctorChipType: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  fab: {
    position: 'absolute',
    bottom: SPACING.xl,
    right: SPACING.lg,
  },
  fabButton: {
    backgroundColor: COLORS.error,
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    ...SHADOWS.lg,
  },
  fabIcon: {
    fontSize: 20,
  },
  fabLabel: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: FONT_SIZE.md,
    letterSpacing: 1,
  },
});

export default PatientHomeScreen;
