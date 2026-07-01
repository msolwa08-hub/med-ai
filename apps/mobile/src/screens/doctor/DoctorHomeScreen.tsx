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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAuthStore } from '../../store/authStore';
import { doctorApi } from '../../api/endpoints';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { registerForPushNotifications } from '../../services/notifications';

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = { navigation: any };

interface QueueEntry {
  consultationId: string;
  patientName: string;
  consultationType: 'IN_PERSON' | 'TELECONSULT' | 'HOME_VISIT';
  status: string;
  waitTimeMinutes: number;
  distanceKm: number | null;
}

// ─── Utility helpers ──────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getConsultationTypeColor(type: QueueEntry['consultationType']): string {
  switch (type) {
    case 'TELECONSULT':
      return COLORS.info;
    case 'IN_PERSON':
      return COLORS.secondary;
    case 'HOME_VISIT':
      return COLORS.accent;
    default:
      return COLORS.secondaryLabel;
  }
}

function getConsultationTypeLabel(type: QueueEntry['consultationType']): string {
  switch (type) {
    case 'TELECONSULT': return 'TELECONSULT';
    case 'IN_PERSON': return 'IN-PERSON';
    case 'HOME_VISIT': return 'HOME VISIT';
    default: return type;
  }
}

function getConsultationTypeIcon(type: QueueEntry['consultationType']): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'TELECONSULT':
      return 'videocam-outline';
    case 'IN_PERSON':
      return 'person-outline';
    case 'HOME_VISIT':
      return 'home-outline';
    default:
      return 'medical-outline';
  }
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : '';
  return (first + last).toUpperCase();
}

/** Urgency accent based on how long the patient has been waiting. */
function getWaitUrgencyColor(waitTimeMinutes: number): string {
  if (waitTimeMinutes >= 30) return COLORS.emergency;
  if (waitTimeMinutes >= 15) return COLORS.warning;
  return COLORS.success;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DoctorHomeScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const [isOnline, setIsOnline] = useState<boolean>(user?.doctor?.isAvailable ?? false);
  const [isToggling, setIsToggling] = useState(false);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [profileIncomplete, setProfileIncomplete] = useState(false);

  useEffect(() => {
    loadQueue();
    checkProfileCompletion();
  }, []);

  // Register for push notifications once on mount
  useEffect(() => {
    registerForPushNotifications();
  }, []);

  async function checkProfileCompletion() {
    try {
      const res = await doctorApi.getMyProfile();
      const profile = res.data.data as { bio?: string | null };
      const bio = profile?.bio;
      if (!bio || bio.trim() === '') {
        setProfileIncomplete(true);
      }
    } catch {
      // Non-fatal — don't show banner if check fails
    }
  }

  async function loadQueue() {
    setQueueLoading(true);
    setQueueError(null);
    try {
      const res = await doctorApi.getPatientQueue();
      const data = res.data.data as { queue?: QueueEntry[] };
      setQueue(data?.queue ?? []);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Could not load your patient queue';
      setQueueError(message);
    } finally {
      setQueueLoading(false);
    }
  }

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
              let lat: number | undefined;
              let lng: number | undefined;
              if (nextState) {
                // Backend requires coordinates when going online
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                  Alert.alert(
                    'Location Required',
                    'Location access is needed to go online so nearby patients can find you.'
                  );
                  setIsToggling(false);
                  return;
                }
                const pos = await Location.getCurrentPositionAsync({});
                lat = pos.coords.latitude;
                lng = pos.coords.longitude;
              }
              await doctorApi.setAvailability({ isAvailable: nextState, lat, lng });
              setIsOnline(nextState);
            } catch (err: unknown) {
              const message =
                (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
                'Could not update availability. Please try again.';
              Alert.alert('Error', message);
            } finally {
              setIsToggling(false);
            }
          },
        },
      ]
    );
  }

  function renderQueueEntry({ item }: { item: QueueEntry }) {
    const typeColor = getConsultationTypeColor(item.consultationType);
    const urgencyColor = getWaitUrgencyColor(item.waitTimeMinutes);
    const waitLabel = item.waitTimeMinutes < 1
      ? 'Just now'
      : item.waitTimeMinutes < 60
        ? `${item.waitTimeMinutes}m wait`
        : `${Math.floor(item.waitTimeMinutes / 60)}h wait`;
    return (
      <TouchableOpacity
        style={styles.waitingCard}
        onPress={() => navigation.navigate('PatientQueue')}
        activeOpacity={0.85}
      >
        <View style={[styles.waitingUrgencyBar, { backgroundColor: urgencyColor }]} />
        <View style={styles.waitingAvatar}>
          <Text style={styles.waitingAvatarText}>{getInitials(item.patientName)}</Text>
        </View>
        <Text style={styles.waitingPatientName} numberOfLines={1}>{item.patientName}</Text>
        <View style={styles.waitingDistanceRow}>
          <Ionicons name="time-outline" size={12} color={COLORS.secondaryLabel} />
          <Text style={styles.waitingDistance}>{waitLabel}</Text>
        </View>
        <View style={[styles.typeBadge, { backgroundColor: typeColor + '18' }]}>
          <Ionicons name={getConsultationTypeIcon(item.consultationType)} size={10} color={typeColor} />
          <Text style={[styles.typeBadgeText, { color: typeColor }]}>
            {getConsultationTypeLabel(item.consultationType)}
          </Text>
        </View>
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

  const teleconsultCount = queue.filter((q) => q.consultationType === 'TELECONSULT').length;
  const longestWaitMinutes = queue.reduce((max, q) => Math.max(max, q.waitTimeMinutes), 0);
  const longestWaitLabel =
    queue.length === 0
      ? '—'
      : longestWaitMinutes < 1
        ? '<1m'
        : longestWaitMinutes < 60
          ? `${longestWaitMinutes}m`
          : `${Math.floor(longestWaitMinutes / 60)}h ${longestWaitMinutes % 60}m`;

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
              Dr. {user?.doctor?.lastName ?? 'Doctor'}
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

        {/* ── Profile Incomplete Banner ── */}
        {profileIncomplete && (
          <View style={styles.profileBanner}>
            <View style={styles.profileBannerAccent} />
            <View style={styles.profileBannerBody}>
              <Ionicons name="person-circle-outline" size={20} color={COLORS.warning} />
              <View style={styles.profileBannerText}>
                <Text style={styles.profileBannerTitle}>Complete your profile</Text>
                <Text style={styles.profileBannerSubtitle}>
                  Patients can see your profile better when it's filled in
                </Text>
              </View>
              <TouchableOpacity
                style={styles.profileBannerBtn}
                onPress={() => navigation.navigate('DoctorProfileSetup', { language: 'en' })}
                activeOpacity={0.85}
              >
                <Text style={styles.profileBannerBtnText}>Set Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

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

        {/* ── Today at a glance ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>TODAY AT A GLANCE</Text>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIconCircle, { backgroundColor: COLORS.primary + '14' }]}>
              <Ionicons name="people-outline" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.statValue}>{queue.length}</Text>
            <Text style={styles.statLabel}>In Queue</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconCircle, { backgroundColor: COLORS.info + '20' }]}>
              <Ionicons name="videocam-outline" size={18} color={COLORS.info} />
            </View>
            <Text style={styles.statValue}>{teleconsultCount}</Text>
            <Text style={styles.statLabel}>Teleconsults</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconCircle, { backgroundColor: COLORS.warning + '18' }]}>
              <Ionicons name="hourglass-outline" size={18} color={COLORS.warning} />
            </View>
            <Text style={styles.statValueSmall}>{longestWaitLabel}</Text>
            <Text style={styles.statLabel}>Longest Wait</Text>
          </View>
        </View>

        {/* ── Waiting Patients ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>WAITING PATIENTS</Text>
          {queue.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{queue.length}</Text>
            </View>
          )}
          <TouchableOpacity
            onPress={loadQueue}
            style={{ marginLeft: 'auto', minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="refresh-outline" size={18} color={COLORS.secondaryLabel} />
          </TouchableOpacity>
        </View>

        {queueLoading ? (
          <View style={styles.emptySection}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.emptySectionText}>Loading queue…</Text>
          </View>
        ) : queueError ? (
          <View style={styles.emptySection}>
            <Ionicons name="cloud-offline-outline" size={32} color={COLORS.systemGray3} />
            <Text style={styles.emptySectionText}>{queueError}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadQueue} activeOpacity={0.8}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : queue.length === 0 ? (
          <View style={styles.emptySection}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="checkmark-done-circle-outline" size={28} color={COLORS.primary} />
            </View>
            <Text style={styles.emptySectionTitle}>No patients waiting</Text>
            <Text style={styles.emptySectionText}>
              {isOnline
                ? "You're all caught up — new requests will appear here."
                : 'Go online to start receiving patient requests.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={queue}
            keyExtractor={(item) => item.consultationId}
            renderItem={renderQueueEntry}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.waitingList}
            scrollEnabled
          />
        )}

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
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    minHeight: 44,
    minWidth: 96,
    borderRadius: BORDER_RADIUS.full,
    gap: 6,
    marginLeft: SPACING.md,
    ...SHADOWS.sm,
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

  // Profile incomplete banner
  profileBanner: {
    flexDirection: 'row',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.warning + '40',
    ...SHADOWS.sm,
  },
  profileBannerAccent: {
    width: 4,
    backgroundColor: COLORS.warning,
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
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.label,
  },
  profileBannerSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  profileBannerBtn: {
    backgroundColor: COLORS.warning,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
  },
  profileBannerBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
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
  statIconCircle: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  statValue: {
    ...TYPOGRAPHY.title2,
    color: COLORS.label,
    textAlign: 'center',
  },
  statValueSmall: {
    ...TYPOGRAPHY.title3,
    color: COLORS.label,
    textAlign: 'center',
    lineHeight: 28,
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
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    paddingTop: SPACING.md + 4,
    width: 156,
    marginRight: SPACING.sm,
    alignItems: 'center',
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  waitingUrgencyBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  waitingAvatar: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.healingTeal,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  waitingAvatarText: {
    ...TYPOGRAPHY.headline,
    color: COLORS.primaryDark,
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
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.md,
    alignSelf: 'stretch',
    alignItems: 'center',
    minHeight: 44,
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
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
    ...SHADOWS.card,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.healingMint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySectionTitle: {
    ...TYPOGRAPHY.subheadline,
    fontWeight: '600',
    color: COLORS.label,
    textAlign: 'center',
  },
  emptySectionText: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.secondaryLabel,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: SPACING.xs,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryBtnText: {
    ...TYPOGRAPHY.footnote,
    fontWeight: '600',
    color: COLORS.primary,
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
