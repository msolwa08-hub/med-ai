import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { doctorApi } from '../../api/endpoints';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, SHADOWS } from '../../constants/theme';

type Props = { navigation: any };

type ConsultationType = 'TELECONSULT' | 'IN-PERSON' | 'HOME VISIT';

interface QueuedPatient {
  id: string;
  patientName: string;
  distance: string | null;
  consultationType: ConsultationType;
  aiChiefComplaint: string;
  requestedAt: Date;
  preferredLanguage: string | null;
  hasRedFlags: boolean;
}

/** Item shape returned by GET /doctors/me/patient-queue. */
interface ApiQueueItem {
  consultationId: string;
  patientName: string;
  consultationType: 'IN_PERSON' | 'TELECONSULT' | 'HOME_VISIT';
  status: string;
  startedAt: string;
  waitTimeMinutes: number;
  chiefComplaintSnippet: string;
  distanceKm: number | null;
  isAssignedToMe: boolean;
  /** Optional fields — rendered when the API provides them. */
  preferredLanguage?: string | null;
  hasRedFlags?: boolean;
  redFlags?: string[] | null;
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  zu: 'isiZulu',
  xh: 'isiXhosa',
  af: 'Afrikaans',
  nso: 'Sepedi',
  tn: 'Setswana',
  st: 'Sesotho',
  ts: 'Xitsonga',
  ss: 'siSwati',
  ve: 'Tshivenda',
  nr: 'isiNdebele',
};

function mapConsultationType(type: ApiQueueItem['consultationType']): ConsultationType {
  switch (type) {
    case 'IN_PERSON':
      return 'IN-PERSON';
    case 'HOME_VISIT':
      return 'HOME VISIT';
    default:
      return 'TELECONSULT';
  }
}

function mapQueueItem(item: ApiQueueItem): QueuedPatient {
  return {
    id: item.consultationId,
    patientName: item.patientName,
    distance: item.distanceKm != null ? `${item.distanceKm.toFixed(1)} km` : null,
    consultationType: mapConsultationType(item.consultationType),
    aiChiefComplaint: item.chiefComplaintSnippet || 'History-taking in progress',
    requestedAt: new Date(item.startedAt),
    preferredLanguage: item.preferredLanguage ?? null,
    hasRedFlags: item.hasRedFlags === true || (item.redFlags?.length ?? 0) > 0,
  };
}

function extractApiError(err: unknown, fallback: string): string {
  return (
    (err as { response?: { data?: { error?: string } } })?.response?.data?.error || fallback
  );
}

function getConsultationTypeColor(type: ConsultationType): string {
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

function getConsultationTypeIcon(type: ConsultationType): keyof typeof Ionicons.glyphMap {
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

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : '';
  return (first + last).toUpperCase();
}

function formatElapsedTime(since: Date): string {
  const totalSeconds = Math.floor((Date.now() - since.getTime()) / 1000);
  if (totalSeconds < 60) {
    return `Waiting ${totalSeconds} sec`;
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `Waiting ${minutes} min ${seconds} sec`;
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

interface PatientCardProps {
  item: QueuedPatient;
  tick: number;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onViewHistory: (id: string) => void;
  isAccepting: boolean;
  isDeclining: boolean;
}

function PatientCard({
  item,
  tick,
  onAccept,
  onDecline,
  onViewHistory,
  isAccepting,
  isDeclining,
}: PatientCardProps) {
  const typeColor = getConsultationTypeColor(item.consultationType);
  const elapsed = formatElapsedTime(item.requestedAt);
  const isProcessing = isAccepting || isDeclining;
  const languageLabel = item.preferredLanguage
    ? LANGUAGE_NAMES[item.preferredLanguage] ?? item.preferredLanguage.toUpperCase()
    : null;

  return (
    <View style={styles.card}>
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>{getInitials(item.patientName)}</Text>
          </View>
          <View style={styles.cardHeaderInfo}>
            <Text style={styles.patientName} numberOfLines={1}>{item.patientName}</Text>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={12} color={COLORS.warning} />
                <Text style={styles.timerText}>{elapsed}</Text>
              </View>
              {item.distance != null && (
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={12} color={COLORS.textSecondary} />
                  <Text style={styles.distanceText}>{item.distance}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        <View style={[styles.typeBadge, { backgroundColor: typeColor + '1A' }]}>
          <Ionicons name={getConsultationTypeIcon(item.consultationType)} size={11} color={typeColor} />
          <Text style={[styles.typeBadgeText, { color: typeColor }]}>
            {item.consultationType}
          </Text>
        </View>
      </View>

      {/* Chips: language + red flags */}
      {(languageLabel != null || item.hasRedFlags) && (
        <View style={styles.chipRow}>
          {languageLabel != null && (
            <View style={styles.languageChip}>
              <Ionicons name="language-outline" size={12} color={COLORS.primaryDark} />
              <Text style={styles.languageChipText}>{languageLabel}</Text>
            </View>
          )}
          {item.hasRedFlags && (
            <View style={styles.redFlagChip}>
              <Ionicons name="flag" size={12} color={COLORS.emergency} />
              <Text style={styles.redFlagChipText}>RED FLAGS</Text>
            </View>
          )}
        </View>
      )}

      {/* Chief Complaint */}
      <View style={styles.complaintBox}>
        <Text style={styles.complaintLabel}>AI Chief Complaint</Text>
        <Text style={styles.complaintText}>{truncate(item.aiChiefComplaint, 80)}</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => onViewHistory(item.id)}
          disabled={isProcessing}
          activeOpacity={0.7}
        >
          <Ionicons name="document-text-outline" size={16} color={COLORS.primary} />
          <Text style={styles.historyButtonText}>Full History</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.declineButton, isProcessing && styles.buttonDisabled]}
          onPress={() => onDecline(item.id)}
          disabled={isProcessing}
          activeOpacity={0.8}
        >
          {isDeclining ? (
            <ActivityIndicator color={COLORS.error} size="small" />
          ) : (
            <Text style={styles.declineButtonText}>Decline</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.acceptButton, isProcessing && styles.buttonDisabled]}
          onPress={() => onAccept(item.id)}
          disabled={isProcessing}
          activeOpacity={0.8}
        >
          {isAccepting ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <>
              <Ionicons name="checkmark" size={16} color={COLORS.white} />
              <Text style={styles.acceptButtonText}>Accept</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function PatientQueueScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const [queue, setQueue] = useState<QueuedPatient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOnline] = useState<boolean>(user?.doctor?.isAvailable ?? false);
  const [tick, setTick] = useState(0);
  const [acceptingIds, setAcceptingIds] = useState<Set<string>>(new Set());
  const [decliningIds, setDecliningIds] = useState<Set<string>>(new Set());
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchQueue(true);

    refreshIntervalRef.current = setInterval(() => {
      fetchQueue();
    }, 30000);

    tickIntervalRef.current = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);

    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
    };
  }, []);

  async function fetchQueue(showLoader = false) {
    if (showLoader) {
      setIsLoading(true);
      setLoadError(null);
    }
    try {
      const response = await doctorApi.getPatientQueue();
      const data = response.data.data as { queue?: ApiQueueItem[] };
      setQueue((data?.queue ?? []).map(mapQueueItem));
      setLoadError(null);
    } catch (err: unknown) {
      // Only surface the error prominently on the initial load; background
      // refreshes keep showing the last known queue.
      if (showLoader) {
        setLoadError(extractApiError(err, 'Could not load the patient queue.'));
      }
    } finally {
      if (showLoader) setIsLoading(false);
    }
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    await fetchQueue();
    setIsRefreshing(false);
  }

  const handleAccept = useCallback(
    async (consultationId: string) => {
      setAcceptingIds((prev) => new Set(prev).add(consultationId));
      try {
        await doctorApi.acceptPatient(consultationId);
        setQueue((prev) => prev.filter((p) => p.id !== consultationId));
      } catch (err: unknown) {
        Alert.alert('Error', extractApiError(err, 'Could not accept patient. Please try again.'));
      } finally {
        setAcceptingIds((prev) => {
          const next = new Set(prev);
          next.delete(consultationId);
          return next;
        });
      }
    },
    []
  );

  const handleDecline = useCallback(
    (consultationId: string) => {
      const patient = queue.find((p) => p.id === consultationId);
      Alert.alert(
        'Decline Patient',
        `Are you sure you want to decline ${patient?.patientName ?? 'this patient'}? They will be redirected to another available doctor.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Decline',
            style: 'destructive',
            onPress: () => confirmDecline(consultationId),
          },
        ]
      );
    },
    [queue]
  );

  async function confirmDecline(consultationId: string) {
    setDecliningIds((prev) => new Set(prev).add(consultationId));
    try {
      await doctorApi.declinePatient(consultationId);
      setQueue((prev) => prev.filter((p) => p.id !== consultationId));
    } catch (err: unknown) {
      Alert.alert('Error', extractApiError(err, 'Could not decline patient. Please try again.'));
    } finally {
      setDecliningIds((prev) => {
        const next = new Set(prev);
        next.delete(consultationId);
        return next;
      });
    }
  }

  function handleViewHistory(consultationId: string) {
    navigation.navigate('AIHistoryReview', { consultationId });
  }

  function renderItem({ item }: { item: QueuedPatient }) {
    return (
      <PatientCard
        item={item}
        tick={tick}
        onAccept={handleAccept}
        onDecline={handleDecline}
        onViewHistory={handleViewHistory}
        isAccepting={acceptingIds.has(item.id)}
        isDeclining={decliningIds.has(item.id)}
      />
    );
  }

  function renderEmpty() {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.emptySubtitle}>Loading your queue…</Text>
        </View>
      );
    }
    if (loadError) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="cloud-offline-outline" size={32} color={COLORS.textSecondary} />
          </View>
          <Text style={styles.emptyTitle}>Something went wrong</Text>
          <Text style={styles.emptySubtitle}>{loadError}</Text>
          <TouchableOpacity
            style={styles.goOnlineButton}
            onPress={() => fetchQueue(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.goOnlineButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Ionicons
            name={isOnline ? 'checkmark-done-circle-outline' : 'moon-outline'}
            size={36}
            color={COLORS.primary}
          />
        </View>
        <Text style={styles.emptyTitle}>
          {isOnline ? 'No patients waiting' : 'You are offline'}
        </Text>
        <Text style={styles.emptySubtitle}>
          {isOnline
            ? "You're all caught up — new requests will appear here automatically."
            : 'Go online to receive patient requests.'}
        </Text>
        {!isOnline && (
          <TouchableOpacity
            style={styles.goOnlineButton}
            onPress={() => navigation.navigate('DoctorAvailability')}
            activeOpacity={0.8}
          >
            <Text style={styles.goOnlineButtonText}>Manage Availability</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>Patient Queue</Text>
            {queue.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{queue.length} waiting</Text>
              </View>
            )}
          </View>
          <View style={styles.onlineIndicatorRow}>
            <View style={[styles.onlineDot, { backgroundColor: isOnline ? COLORS.success : COLORS.systemGray3 }]} />
            <Text style={[styles.onlineText, { color: isOnline ? COLORS.healingTeal : COLORS.systemGray4 }]}>
              {isOnline ? 'Online — accepting patients' : 'Offline'}
            </Text>
          </View>
        </View>

        <FlatList
          data={queue}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.listContent, queue.length === 0 && styles.listContentEmpty]}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderBottomLeftRadius: BORDER_RADIUS.xl,
    borderBottomRightRadius: BORDER_RADIUS.xl,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
    color: COLORS.white,
  },
  countBadge: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  countBadgeText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  onlineIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: BORDER_RADIUS.full,
  },
  onlineText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  listContent: {
    padding: SPACING.md,
    paddingTop: SPACING.md,
    gap: SPACING.md,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
    marginRight: SPACING.sm,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.healingTeal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  patientName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: 3,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  timerText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.warning,
    fontWeight: '600',
  },
  distanceText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  typeBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  languageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.healingMint,
    borderWidth: 1,
    borderColor: COLORS.healingTealMid,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  languageChipText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: COLORS.primaryDark,
  },
  redFlagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.emergency + '14',
    borderWidth: 1,
    borderColor: COLORS.emergency + '55',
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  redFlagChipText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: COLORS.emergency,
  },
  complaintBox: {
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  complaintLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  complaintText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
  },
  historyButton: {
    flex: 1,
    flexDirection: 'row',
    minHeight: 44,
    paddingHorizontal: SPACING.xs,
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  historyButtonText: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  declineButton: {
    minHeight: 44,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.error + '10',
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 84,
  },
  declineButtonText: {
    color: COLORS.error,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  acceptButton: {
    flexDirection: 'row',
    minHeight: 44,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minWidth: 96,
    ...SHADOWS.sm,
  },
  acceptButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.healingMint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  goOnlineButton: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    ...SHADOWS.sm,
  },
  goOnlineButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
});
