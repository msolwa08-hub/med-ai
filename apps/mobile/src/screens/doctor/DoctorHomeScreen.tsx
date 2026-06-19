import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Animated,
  StatusBar,
  SafeAreaView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { doctorApi } from '../../api/endpoints';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = { navigation: any };

interface StatCard {
  label: string;
  value: string;
  subLabel?: string;
}

interface WaitingPatient {
  id: string;
  name: string;
  distance: string;
  type: 'TELECONSULT' | 'IN-PERSON' | 'HOME VISIT';
}

interface RecentConsultation {
  id: string;
  patientName: string;
  date: string;
  status: 'completed' | 'cancelled' | 'ongoing';
}

// ─── Mock data (unchanged from original) ─────────────────────────────────────

const MOCK_WAITING_PATIENTS: WaitingPatient[] = [
  { id: '1', name: 'Sipho M.', distance: '1.2 km', type: 'TELECONSULT' },
  { id: '2', name: 'Zanele D.', distance: '3.4 km', type: 'IN-PERSON' },
  { id: '3', name: 'Themba K.', distance: '5.7 km', type: 'HOME VISIT' },
];

const MOCK_RECENT_CONSULTATIONS: RecentConsultation[] = [
  { id: 'c1', patientName: 'Nomsa B.', date: 'Today, 09:15', status: 'completed' },
  { id: 'c2', patientName: 'Lebo P.', date: 'Today, 08:30', status: 'completed' },
  { id: 'c3', patientName: 'Ravi N.', date: 'Yesterday, 16:45', status: 'cancelled' },
  { id: 'c4', patientName: 'Fatima A.', date: 'Yesterday, 14:00', status: 'completed' },
];

const MOCK_STATS: StatCard[] = [
  { label: "Today's Patients", value: '7', subLabel: 'consultations' },
  { label: 'Rating', value: '4.8', subLabel: '★★★★★' },
  { label: 'Earnings Today', value: 'R 2 100', subLabel: 'incl. 7 consults' },
];

// ─── Utility helpers (unchanged from original) ────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getConsultationTypeColor(type: WaitingPatient['type']): string {
  switch (type) {
    case 'TELECONSULT':
      return COLORS.info;
    case 'IN-PERSON':
      return COLORS.secondary;
    case 'HOME VISIT':
      return COLORS.accent;
    default:
      return COLORS.secondaryLabel;
  }
}

function getStatusColor(status: RecentConsultation['status']): string {
  switch (status) {
    case 'completed':
      return COLORS.success;
    case 'cancelled':
      return COLORS.error;
    case 'ongoing':
      return COLORS.warning;
    default:
      return COLORS.secondaryLabel;
  }
}

function getConsultationTypeIcon(type: WaitingPatient['type']): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'TELECONSULT':
      return 'videocam-outline';
    case 'IN-PERSON':
      return 'person-outline';
    case 'HOME VISIT':
      return 'home-outline';
    default:
      return 'medical-outline';
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DoctorHomeScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const [isOnline, setIsOnline] = useState<boolean>(user?.isOnline ?? false);
  const [isToggling, setIsToggling] = useState(false);
  const [waitingPatients] = useState<WaitingPatient[]>(MOCK_WAITING_PATIENTS);
  const [recentConsultations] = useState<RecentConsultation[]>(MOCK_RECENT_CONSULTATIONS);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isOnline) {
      startPulseAnimation();
    } else {
      pulseAnim.stopAnimation();
      pulseOpacity.stopAnimation();
      pulseAnim.setValue(1);
      pulseOpacity.setValue(1);
    }
  }, [isOnline]);

  function startPulseAnimation() {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.6, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(pulseOpacity, { toValue: 0, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 1, duration: 900, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }

  async function handleToggleOnline() {
    if (!user) return;
    const nextState = !isOnline;
    const label = nextState ? 'Go Online' : 'Go Offline';
    Alert.alert(
      label,
      nextState
        ? 'You will start receiving patient requests. Make sure your location is accurate.'
        : 'You will stop receiving new patient requests.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: nextState ? 'default' : 'destructive',
          onPress: async () => {
            setIsToggling(true);
            try {
              await doctorApi.setAvailability(user.id, { isOnline: nextState });
              setIsOnline(nextState);
            } catch {
              Alert.alert('Error', 'Could not update availability. Please try again.');
            } finally {
              setIsToggling(false);
            }
          },
        },
      ]
    );
  }

  function renderWaitingPatient({ item }: { item: WaitingPatient }) {
    const typeColor = getConsultationTypeColor(item.type);
    return (
      <TouchableOpacity
        style={styles.waitingCard}
        onPress={() => navigation.navigate('PatientQueue')}
        activeOpacity={0.85}
      >
        {/* Patient avatar */}
        <View style={styles.waitingAvatar}>
          <Text style={styles.waitingAvatarText}>{item.name.charAt(0)}</Text>
        </View>
        <Text style={styles.waitingPatientName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.waitingDistanceRow}>
          <Ionicons name="location-outline" size={12} color={COLORS.secondaryLabel} />
          <Text style={styles.waitingDistance}>{item.distance}</Text>
        </View>
        {/* Type badge */}
        <View style={[styles.typeBadge, { backgroundColor: typeColor + '18' }]}>
          <Ionicons name={getConsultationTypeIcon(item.type)} size={10} color={typeColor} />
          <Text style={[styles.typeBadgeText, { color: typeColor }]}>{item.type}</Text>
        </View>
        {/* View button */}
        <TouchableOpacity
          style={[styles.viewBtn, { borderColor: COLORS.primary }]}
          onPress={() => navigation.navigate('PatientQueue')}
          activeOpacity={0.8}
        >
          <Text style={styles.viewBtnText}>View</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  function renderRecentConsultation({ item }: { item: RecentConsultation }) {
    const statusColor = getStatusColor(item.status);
    return (
      <View style={styles.recentCard}>
        <View style={styles.recentCardLeft}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>{item.patientName.charAt(0)}</Text>
          </View>
          <View style={styles.recentCardInfo}>
            <Text style={styles.recentPatientName}>{item.patientName}</Text>
            <Text style={styles.recentDate}>{item.date}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
          <Text style={[styles.statusBadgeText, { color: statusColor }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.systemGroupedBackground} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.doctorTitle}>
              Dr. {user?.lastName ?? 'Doctor'}
            </Text>
            <Text style={styles.dashboardSubtitle}>MedAI Provider Dashboard</Text>
          </View>
          {/* Online/Offline toggle pill */}
          <TouchableOpacity
            style={[styles.onlinePill, isOnline ? styles.onlinePillActive : styles.onlinePillInactive]}
            onPress={handleToggleOnline}
            disabled={isToggling}
            activeOpacity={0.85}
          >
            {isToggling ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <View style={[styles.pillDot, isOnline ? styles.pillDotActive : styles.pillDotInactive]} />
                <Text style={[styles.pillText, isOnline ? styles.pillTextActive : styles.pillTextInactive]}>
                  {isOnline ? 'Online' : 'Offline'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Status Card ── */}
        <View style={[styles.statusCard, isOnline ? styles.statusCardOnline : styles.statusCardOffline]}>
          {/* Left accent bar */}
          <View style={[styles.statusAccentBar, { backgroundColor: isOnline ? COLORS.success : COLORS.systemGray3 }]} />
          <View style={styles.statusCardBody}>
            <View style={styles.statusCardTop}>
              <View>
                <Text style={styles.statusCardHeadline}>
                  {isOnline ? 'You are available' : 'You are offline'}
                </Text>
                <Text style={styles.statusCardSubtext}>
                  {isOnline
                    ? 'Patients can find and book you'
                    : 'You will not receive new requests'}
                </Text>
              </View>
              {isOnline && (
                <View style={styles.pulseContainer}>
                  <Animated.View
                    style={[
                      styles.pulseRing,
                      { transform: [{ scale: pulseAnim }], opacity: pulseOpacity },
                    ]}
                  />
                  <View style={styles.statusDotGreen} />
                </View>
              )}
              {!isOnline && <View style={styles.statusDotGray} />}
            </View>
          </View>
        </View>

        {/* ── Stats Row ── */}
        <View style={styles.statsRow}>
          {MOCK_STATS.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
              {stat.subLabel && (
                <Text style={styles.statSubLabel}>{stat.subLabel}</Text>
              )}
            </View>
          ))}
        </View>

        {/* ── Waiting Patients ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>WAITING PATIENTS</Text>
          {waitingPatients.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{waitingPatients.length}</Text>
            </View>
          )}
        </View>

        {waitingPatients.length === 0 ? (
          <View style={styles.emptySection}>
            <Ionicons name="checkmark-circle-outline" size={32} color={COLORS.systemGray3} />
            <Text style={styles.emptySectionText}>No patients waiting</Text>
          </View>
        ) : (
          <FlatList
            data={waitingPatients}
            keyExtractor={(item) => item.id}
            renderItem={renderWaitingPatient}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.waitingList}
            scrollEnabled
          />
        )}

        {/* ── Recent Consultations ── */}
        <View style={[styles.sectionHeader, { marginTop: SPACING.lg }]}>
          <Text style={styles.sectionTitle}>RECENT CONSULTATIONS</Text>
        </View>

        <View style={styles.recentList}>
          {recentConsultations.map((item) => (
            <View key={item.id}>
              {renderRecentConsultation({ item })}
            </View>
          ))}
        </View>

        {/* ── This Week Earnings Card ── */}
        <View style={[styles.sectionHeader, { marginTop: SPACING.lg }]}>
          <Text style={styles.sectionTitle}>THIS WEEK</Text>
        </View>
        <View style={styles.earningsCard}>
          <Text style={styles.earningsBigNumber}>R 9 450</Text>
          <Text style={styles.earningsSubtitle}>Earned this week</Text>
          <View style={styles.earningsDivider} />
          <View style={styles.earningsRow}>
            <View style={styles.earningsItem}>
              <Text style={styles.earningsItemValue}>38</Text>
              <Text style={styles.earningsItemLabel}>Consultations</Text>
            </View>
            <View style={styles.earningsVerticalDivider} />
            <View style={styles.earningsItem}>
              <Text style={styles.earningsItemValue}>R 248</Text>
              <Text style={styles.earningsItemLabel}>Avg per Visit</Text>
            </View>
          </View>
        </View>

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.systemGroupedBackground,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  headerLeft: {
    flex: 1,
  },
  doctorTitle: {
    ...TYPOGRAPHY.largeTitle,
    color: COLORS.label,
  },
  dashboardSubtitle: {
    ...TYPOGRAPHY.subheadline,
    color: COLORS.secondaryLabel,
    marginTop: 2,
  },

  // Online pill toggle
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 17,
    gap: 6,
    marginLeft: SPACING.md,
  },
  onlinePillActive: {
    backgroundColor: COLORS.success + '20',
    borderWidth: 1.5,
    borderColor: COLORS.success,
  },
  onlinePillInactive: {
    backgroundColor: COLORS.systemGray5,
    borderWidth: 1.5,
    borderColor: COLORS.systemGray3,
  },
  pillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pillDotActive: {
    backgroundColor: COLORS.success,
  },
  pillDotInactive: {
    backgroundColor: COLORS.systemGray,
  },
  pillText: {
    ...TYPOGRAPHY.footnote,
    fontWeight: '600',
  },
  pillTextActive: {
    color: COLORS.success,
  },
  pillTextInactive: {
    color: COLORS.secondaryLabel,
  },

  // Status card
  statusCard: {
    flexDirection: 'row',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderRadius: 16,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  statusCardOnline: {
    backgroundColor: COLORS.white,
  },
  statusCardOffline: {
    backgroundColor: COLORS.white,
  },
  statusAccentBar: {
    width: 4,
  },
  statusCardBody: {
    flex: 1,
    padding: SPACING.md,
  },
  statusCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusCardHeadline: {
    ...TYPOGRAPHY.headline,
    color: COLORS.label,
  },
  statusCardSubtext: {
    ...TYPOGRAPHY.subheadline,
    color: COLORS.secondaryLabel,
    marginTop: 2,
  },

  // Pulse animation
  pulseContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.success + '50',
  },
  statusDotGreen: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.success,
  },
  statusDotGray: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.systemGray3,
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
  statLabel: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.secondaryLabel,
    textAlign: 'center',
    marginTop: 4,
  },
  statSubLabel: {
    ...TYPOGRAPHY.caption2,
    color: COLORS.secondary,
    textAlign: 'center',
    marginTop: 2,
  },

  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: 8,
    gap: SPACING.sm,
  },
  sectionTitle: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  countBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  countBadgeText: {
    ...TYPOGRAPHY.caption2,
    color: COLORS.white,
    fontWeight: '700',
  },

  // Waiting patients
  waitingList: {
    paddingLeft: SPACING.lg,
    paddingRight: SPACING.sm,
    gap: SPACING.sm,
  },
  waitingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    width: 150,
    marginRight: SPACING.sm,
    alignItems: 'center',
    ...SHADOWS.card,
  },
  waitingAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  waitingAvatarText: {
    ...TYPOGRAPHY.headline,
    color: COLORS.primary,
  },
  waitingPatientName: {
    ...TYPOGRAPHY.subheadline,
    fontWeight: '600',
    color: COLORS.label,
    textAlign: 'center',
    marginBottom: 4,
  },
  waitingDistanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 8,
  },
  waitingDistance: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.secondaryLabel,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginBottom: 10,
  },
  typeBadgeText: {
    ...TYPOGRAPHY.caption2,
    fontWeight: '700',
  },
  viewBtn: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    alignSelf: 'stretch',
    alignItems: 'center',
    minHeight: 32,
    justifyContent: 'center',
  },
  viewBtnText: {
    ...TYPOGRAPHY.footnote,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Empty state
  emptySection: {
    marginHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    gap: SPACING.sm,
    ...SHADOWS.card,
  },
  emptySectionText: {
    ...TYPOGRAPHY.subheadline,
    color: COLORS.secondaryLabel,
  },

  // Recent consultations
  recentList: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  recentCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
    ...SHADOWS.card,
  },
  recentCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.sm,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight + '18',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    ...TYPOGRAPHY.headline,
    color: COLORS.primary,
  },
  recentCardInfo: {
    flex: 1,
  },
  recentPatientName: {
    ...TYPOGRAPHY.subheadline,
    fontWeight: '600',
    color: COLORS.label,
  },
  recentDate: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.secondaryLabel,
    marginTop: 2,
  },
  statusBadge: {
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  statusBadgeText: {
    ...TYPOGRAPHY.caption1,
    fontWeight: '600',
  },

  // Earnings card
  earningsCard: {
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.card,
  },
  earningsBigNumber: {
    ...TYPOGRAPHY.title1,
    color: COLORS.primary,
  },
  earningsSubtitle: {
    ...TYPOGRAPHY.subheadline,
    color: COLORS.secondaryLabel,
    marginTop: 4,
  },
  earningsDivider: {
    height: 1,
    backgroundColor: COLORS.separator,
    alignSelf: 'stretch',
    marginVertical: SPACING.md,
  },
  earningsRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  earningsItem: {
    alignItems: 'center',
    flex: 1,
  },
  earningsItemValue: {
    ...TYPOGRAPHY.title2,
    color: COLORS.primary,
  },
  earningsItemLabel: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.secondaryLabel,
    marginTop: 4,
    textAlign: 'center',
  },
  earningsVerticalDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.separator,
  },
});
