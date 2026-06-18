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
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { doctorApi } from '../../api/endpoints';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, SHADOWS } from '../../constants/theme';

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
      return COLORS.textSecondary;
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
      return COLORS.textSecondary;
  }
}

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
          Animated.timing(pulseAnim, {
            toValue: 1.6,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(pulseOpacity, {
            toValue: 0,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
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
    return (
      <TouchableOpacity
        style={styles.waitingCard}
        onPress={() => navigation.navigate('PatientQueue')}
        activeOpacity={0.85}
      >
        <View style={styles.waitingCardTop}>
          <Text style={styles.waitingPatientName}>{item.name}</Text>
          <View style={[styles.typeBadge, { backgroundColor: getConsultationTypeColor(item.type) + '20' }]}>
            <Text style={[styles.typeBadgeText, { color: getConsultationTypeColor(item.type) }]}>
              {item.type}
            </Text>
          </View>
        </View>
        <Text style={styles.waitingDistance}>{item.distance} away</Text>
      </TouchableOpacity>
    );
  }

  function renderRecentConsultation({ item }: { item: RecentConsultation }) {
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
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '18' }]}>
          <Text style={[styles.statusBadgeText, { color: getStatusColor(item.status) }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greetingText}>{getGreeting()},</Text>
          <Text style={styles.doctorName}>
            Dr {user?.lastName ?? 'Doctor'}
          </Text>
        </View>
        <View style={styles.hpcsaBadge}>
          <Text style={styles.hpcsaShield}>🛡</Text>
          <Text style={styles.hpcsaText}>HPCSA VERIFIED</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Online Toggle Card */}
        <View style={styles.toggleCard}>
          <View style={styles.toggleCardTop}>
            <View style={styles.statusIndicatorRow}>
              {isOnline && (
                <View style={styles.pulseContainer}>
                  <Animated.View
                    style={[
                      styles.pulseRing,
                      {
                        transform: [{ scale: pulseAnim }],
                        opacity: pulseOpacity,
                      },
                    ]}
                  />
                  <View style={styles.statusDotGreen} />
                </View>
              )}
              {!isOnline && <View style={styles.statusDotGray} />}
              <Text style={[styles.statusLabel, { color: isOnline ? COLORS.success : COLORS.textSecondary }]}>
                {isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
            {isOnline && (
              <Text style={styles.locationTrackingText}>Location tracking active</Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.toggleButton, isOnline ? styles.toggleButtonOnline : styles.toggleButtonOffline]}
            onPress={handleToggleOnline}
            disabled={isToggling}
            activeOpacity={0.8}
          >
            {isToggling ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={styles.toggleButtonText}>
                {isOnline ? 'GO OFFLINE' : 'GO ONLINE'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsRow}
        >
          {MOCK_STATS.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
              {stat.subLabel && (
                <Text style={styles.statSubLabel}>{stat.subLabel}</Text>
              )}
            </View>
          ))}
        </ScrollView>

        {/* Waiting Patients */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Waiting Patients</Text>
          {waitingPatients.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{waitingPatients.length}</Text>
            </View>
          )}
        </View>

        {waitingPatients.length === 0 ? (
          <View style={styles.emptySection}>
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
            scrollEnabled={true}
          />
        )}

        {/* Recent Consultations */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Consultations</Text>
        </View>

        <FlatList
          data={recentConsultations}
          keyExtractor={(item) => item.id}
          renderItem={renderRecentConsultation}
          scrollEnabled={false}
          contentContainerStyle={styles.recentList}
        />

        {/* Earnings Summary Card */}
        <View style={styles.earningsSummaryCard}>
          <View style={styles.earningsSummaryHeader}>
            <Text style={styles.earningsSummaryTitle}>Earnings Summary</Text>
            <Text style={styles.earningsSummaryPeriod}>This Week</Text>
          </View>
          <View style={styles.earningsSummaryRow}>
            <View style={styles.earningsSummaryItem}>
              <Text style={styles.earningsSummaryAmount}>R 9 450</Text>
              <Text style={styles.earningsSummaryLabel}>Gross Earnings</Text>
            </View>
            <View style={styles.earningsDivider} />
            <View style={styles.earningsSummaryItem}>
              <Text style={styles.earningsSummaryAmount}>38</Text>
              <Text style={styles.earningsSummaryLabel}>Consultations</Text>
            </View>
            <View style={styles.earningsDivider} />
            <View style={styles.earningsSummaryItem}>
              <Text style={styles.earningsSummaryAmount}>R 248</Text>
              <Text style={styles.earningsSummaryLabel}>Avg per Visit</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  greetingText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.white + 'CC',
    fontWeight: '400',
  },
  doctorName: {
    fontSize: FONT_SIZE.xxl,
    color: COLORS.white,
    fontWeight: '700',
    marginTop: 2,
  },
  hpcsaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentSA + '30',
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.accentSA,
    gap: 4,
  },
  hpcsaShield: {
    fontSize: FONT_SIZE.sm,
  },
  hpcsaText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.accentSA,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },
  toggleCard: {
    margin: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.md,
  },
  toggleCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  statusIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  pulseContainer: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.success + '50',
  },
  statusDotGreen: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.success,
  },
  statusDotGray: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.textLight,
  },
  statusLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  locationTrackingText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.success,
  },
  toggleButton: {
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  toggleButtonOnline: {
    backgroundColor: COLORS.error,
  },
  toggleButtonOffline: {
    backgroundColor: COLORS.secondary,
  },
  toggleButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    letterSpacing: 1,
  },
  statsRow: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  statCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    minWidth: 110,
    ...SHADOWS.sm,
  },
  statValue: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  statSubLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.secondary,
    marginTop: 2,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
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
    color: COLORS.white,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  waitingList: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  waitingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    width: 160,
    ...SHADOWS.sm,
  },
  waitingCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  waitingPatientName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    marginRight: SPACING.xs,
  },
  typeBadge: {
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  typeBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  waitingDistance: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  emptySection: {
    marginHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.sm,
  },
  emptySectionText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.md,
  },
  recentList: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  recentCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.sm,
  },
  recentCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.sm,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.primary,
  },
  recentCardInfo: {
    flex: 1,
  },
  recentPatientName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  recentDate: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  earningsSummaryCard: {
    margin: SPACING.md,
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.lg,
  },
  earningsSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  earningsSummaryTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.white,
  },
  earningsSummaryPeriod: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.white + 'AA',
  },
  earningsSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  earningsSummaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  earningsSummaryAmount: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    color: COLORS.white,
  },
  earningsSummaryLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.white + 'AA',
    marginTop: 4,
    textAlign: 'center',
  },
  earningsDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.white + '30',
  },
});
