import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  AppState,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { consultationApi, paymentsApi } from '../../api/endpoints';
import { StatusStepper } from '../../components/StatusStepper';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import type { PatientStackParamList } from '../../navigation/PatientNavigator';

// ─── Types (mirror GET /consultations/:id response) ──────────────────────────

type ConsultationStatus =
  | 'HISTORY_TAKING'
  | 'DOCTOR_REVIEW'
  | 'EXAMINATION'
  | 'COMPLETED'
  | 'CANCELLED';

interface ConsultationDetail {
  id: string;
  patientId: string;
  doctorId: string | null;
  status: ConsultationStatus;
  consultationType: string;
  startedAt: string;
  completedAt: string | null;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
    doctorType?: string;
    specialization?: string | null;
  } | null;
}

type Step = {
  label: string;
  status: 'completed' | 'current' | 'pending';
  description?: string;
};

const STATUS_ORDER: ConsultationStatus[] = [
  'HISTORY_TAKING',
  'DOCTOR_REVIEW',
  'EXAMINATION',
  'COMPLETED',
];

const DISPLAY_STEPS: Array<{
  label: string;
  statusKey: ConsultationStatus;
  description: string;
}> = [
  {
    label: 'History Taking',
    statusKey: 'HISTORY_TAKING',
    description: 'Your AI medical history is being recorded',
  },
  {
    label: 'Doctor Review',
    statusKey: 'DOCTOR_REVIEW',
    description: 'The doctor is reviewing your medical history',
  },
  {
    label: 'Examination',
    statusKey: 'EXAMINATION',
    description: 'Clinical examination and management planning',
  },
  {
    label: 'Completed',
    statusKey: 'COMPLETED',
    description: 'Consultation complete. Check your records.',
  },
];

const buildSteps = (status: ConsultationStatus): Step[] => {
  const currentIdx = STATUS_ORDER.indexOf(status);
  return DISPLAY_STEPS.map((step) => {
    const stepIdx = STATUS_ORDER.indexOf(step.statusKey);
    if (status === 'COMPLETED') return { ...step, status: 'completed' };
    if (currentIdx > stepIdx) return { ...step, status: 'completed' };
    if (currentIdx === stepIdx) return { ...step, status: 'current' };
    return { ...step, status: 'pending' };
  });
};

const STATUS_DESCRIPTIONS: Record<ConsultationStatus, string> = {
  HISTORY_TAKING:
    'Your AI medical history is in progress. Complete it so a doctor can review your case.',
  DOCTOR_REVIEW:
    'The doctor is carefully reviewing your AI-generated history. Please wait — this usually takes 5–10 minutes.',
  EXAMINATION:
    'The doctor may ask you some follow-up questions or request an in-person examination.',
  COMPLETED: 'Your consultation is complete! Your prescription and instructions are ready.',
  CANCELLED: 'This consultation was cancelled.',
};

const apiErrorMessage = (err: unknown, fallback: string): string =>
  (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? fallback;

// ─── Screen ───────────────────────────────────────────────────────────────────

export const ConsultationStatusScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<PatientStackParamList, 'ConsultationStatus'>>();
  const { consultationId } = route.params;

  const [consultation, setConsultation] = useState<ConsultationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number | null>(null);
  const [paymentPaidAt, setPaymentPaidAt] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef(AppState.currentState);

  const fetchPaymentStatus = useCallback(async () => {
    try {
      const response = await paymentsApi.getStatus(consultationId);
      const data = response.data.data as {
        status?: string;
        amount?: number;
        paidAt?: string | null;
      };
      setPaymentStatus(data.status ?? 'NOT_INITIATED');
      setPaymentAmount(data.amount ?? null);
      setPaymentPaidAt(data.paidAt ?? null);
    } catch {
      // Silently fail on polling
    }
  }, [consultationId]);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await consultationApi.getById(consultationId);
      const data = response.data.data as ConsultationDetail;
      setConsultation(data);
      setLoadError(null);
      if (data.status === 'COMPLETED' || data.status === 'CANCELLED') {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    } catch (err: unknown) {
      // Only surface the error on the initial load; polling failures stay silent
      setConsultation((prev) => {
        if (!prev) setLoadError(apiErrorMessage(err, 'Could not load the consultation.'));
        return prev;
      });
    } finally {
      setIsLoading(false);
    }
  }, [consultationId]);

  useEffect(() => {
    fetchStatus();
    fetchPaymentStatus();
    intervalRef.current = setInterval(() => {
      fetchStatus();
      fetchPaymentStatus();
    }, 30000);

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        fetchStatus();
        fetchPaymentStatus();
      }
      appStateRef.current = nextState;
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      subscription.remove();
    };
  }, [fetchStatus, fetchPaymentStatus]);

  const handlePayNow = () => {
    const doctor = consultation?.doctor;
    navigation.navigate('Payment', {
      consultationId,
      doctorName: doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : undefined,
    });
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Consultation',
      'Are you sure you want to cancel this consultation? This cannot be undone.',
      [
        { text: 'No, keep it', style: 'cancel' },
        {
          text: 'Yes, cancel',
          style: 'destructive',
          onPress: async () => {
            setIsCancelling(true);
            try {
              await consultationApi.updateStatus(consultationId, 'CANCELLED');
              await fetchStatus();
            } catch (err: unknown) {
              Alert.alert(
                'Error',
                apiErrorMessage(err, 'Could not cancel the consultation. Please try again.')
              );
            } finally {
              setIsCancelling(false);
            }
          },
        },
      ]
    );
  };

  const handleContact = () => {
    Alert.alert(
      'Contact Doctor',
      'Teleconsult feature coming soon. The doctor will reach out to you directly.',
      [{ text: 'OK' }]
    );
  };

  // ── Loading state ──
  if (isLoading) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading consultation status…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Error state ──
  if (!consultation) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.loading}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.systemGray3} />
          <Text style={styles.errorTitle}>Could not load consultation</Text>
          <Text style={styles.errorBody}>{loadError ?? 'Please try again.'}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            activeOpacity={0.85}
            onPress={() => {
              setIsLoading(true);
              fetchStatus();
            }}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const status = consultation.status;
  const steps = buildSteps(status);
  const description = STATUS_DESCRIPTIONS[status] ?? 'Processing your consultation…';
  const doctor = consultation.doctor;
  const isCancelled = status === 'CANCELLED';

  // Show the payment card when a doctor is assigned and the consultation is in progress or complete
  const showPaymentCard =
    !!doctor && ['DOCTOR_REVIEW', 'EXAMINATION', 'COMPLETED'].includes(status);

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={28} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Consultation Status</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Doctor card */}
        {doctor ? (
          <View style={styles.doctorCard}>
            <View style={styles.doctorAvatar}>
              <Text style={styles.doctorAvatarInitials}>
                {doctor.firstName[0]}
                {doctor.lastName[0]}
              </Text>
            </View>
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>
                Dr. {doctor.firstName} {doctor.lastName}
              </Text>
              <Text style={styles.doctorType}>
                {(doctor.specialization || doctor.doctorType || '').replace(/_/g, ' ')}
              </Text>
            </View>
            {!isCancelled && (
              <View style={styles.onlinePill}>
                <Text style={styles.onlinePillText}>● Active</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.doctorCard}>
            <View style={[styles.doctorAvatar, { backgroundColor: COLORS.systemGray3 }]}>
              <Text style={styles.doctorAvatarInitials}>?</Text>
            </View>
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>Awaiting Doctor</Text>
              <Text style={styles.doctorType}>Your history is being matched</Text>
            </View>
            {!isCancelled && <ActivityIndicator size="small" color={COLORS.primary} />}
          </View>
        )}

        {/* Status description */}
        <View style={[styles.descriptionCard, isCancelled && styles.descriptionCardCancelled]}>
          <Text style={styles.descriptionText}>{description}</Text>
        </View>

        {/* Stepper */}
        {!isCancelled && (
          <View style={styles.stepperCard}>
            <Text style={styles.stepperTitle}>Consultation Progress</Text>
            <StatusStepper steps={steps} />
          </View>
        )}

        {/* Payment card */}
        {showPaymentCard && (
          <View style={styles.paymentCard}>
            <Text style={styles.paymentCardTitle}>Payment</Text>

            {paymentStatus === 'COMPLETE' ? (
              <View style={styles.paymentConfirmed}>
                <Ionicons name="checkmark-circle" size={28} color={COLORS.success} />
                <View>
                  <Text style={styles.paymentConfirmedLabel}>Payment Confirmed</Text>
                  {paymentAmount !== null && (
                    <Text style={styles.paymentConfirmedAmount}>
                      R{paymentAmount.toFixed(2)}
                    </Text>
                  )}
                  {paymentPaidAt && (
                    <Text style={styles.paymentConfirmedDate}>
                      {new Date(paymentPaidAt).toLocaleDateString('en-ZA', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </Text>
                  )}
                </View>
              </View>
            ) : paymentStatus === 'FAILED' || paymentStatus === 'CANCELLED' ? (
              <TouchableOpacity
                style={styles.paymentRetryButton}
                onPress={handlePayNow}
                activeOpacity={0.85}
              >
                <Text style={styles.paymentRetryButtonText}>Retry Payment</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.paymentButton}
                onPress={handlePayNow}
                activeOpacity={0.85}
              >
                <Text style={styles.paymentButtonText}>Pay Now</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Wait time */}
        {!isCancelled && status !== 'COMPLETED' && (
          <View style={styles.waitCard}>
            <Ionicons name="time-outline" size={28} color={COLORS.primary} />
            <View>
              <Text style={styles.waitTitle}>Estimated Wait</Text>
              <Text style={styles.waitValue}>
                {status === 'DOCTOR_REVIEW'
                  ? '5–10 minutes'
                  : status === 'EXAMINATION'
                  ? '10–20 minutes'
                  : 'Calculating…'}
              </Text>
            </View>
          </View>
        )}

        {/* Contact button */}
        {!isCancelled && (
          <TouchableOpacity
            style={styles.contactButton}
            onPress={handleContact}
            activeOpacity={0.85}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={COLORS.primary} />
            <Text style={styles.contactButtonText}>Contact Doctor</Text>
          </TouchableOpacity>
        )}

        {/* Auto-refresh notice */}
        {!isCancelled && status !== 'COMPLETED' && (
          <Text style={styles.refreshNote}>Status auto-updates every 30 seconds</Text>
        )}

        {/* Continue history when still history taking */}
        {status === 'HISTORY_TAKING' && (
          <TouchableOpacity
            style={styles.viewRecordsButton}
            onPress={() =>
              navigation.navigate('AIHistory', {
                consultationId,
                language: consultation.patient?.firstName ? undefined : undefined,
              })
            }
            activeOpacity={0.85}
          >
            <Text style={styles.viewRecordsText}>Continue Medical History</Text>
          </TouchableOpacity>
        )}

        {/* Cancel */}
        {status !== 'COMPLETED' && !isCancelled && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            disabled={isCancelling}
            activeOpacity={0.7}
          >
            {isCancelling ? (
              <ActivityIndicator size="small" color={COLORS.error} />
            ) : (
              <Text style={styles.cancelButtonText}>Cancel Consultation</Text>
            )}
          </TouchableOpacity>
        )}

        {/* View records when complete */}
        {status === 'COMPLETED' && (
          <TouchableOpacity
            style={styles.viewRecordsButton}
            onPress={() => navigation.navigate('PatientTabs', { screen: 'MyRecords' })}
            activeOpacity={0.85}
          >
            <Text style={styles.viewRecordsText}>View My Records</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.xl,
  },
  loadingText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  errorTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  errorBody: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: FONT_SIZE.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerBackBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  content: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
  },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  doctorAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  doctorAvatarInitials: {
    color: COLORS.white,
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  doctorType: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
  },
  onlinePill: {
    backgroundColor: COLORS.healingMint,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  onlinePillText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.success,
    fontWeight: '700',
  },
  descriptionCard: {
    backgroundColor: COLORS.healingMint,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  descriptionCardCancelled: {
    backgroundColor: COLORS.systemGray6,
    borderLeftColor: COLORS.systemGray,
  },
  descriptionText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    lineHeight: 22,
  },
  stepperCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stepperTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  waitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  waitTitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  waitValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    minHeight: 50,
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.primary,
    gap: SPACING.sm,
  },
  contactButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.primary,
  },
  refreshNote: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    minHeight: 44,
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  cancelButtonText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.error,
    fontWeight: '600',
  },
  viewRecordsButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  viewRecordsText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: FONT_SIZE.md,
  },
  paymentCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  paymentCardTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  paymentButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    minHeight: 50,
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  paymentButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: FONT_SIZE.md,
  },
  paymentRetryButton: {
    backgroundColor: COLORS.warning,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    minHeight: 50,
    justifyContent: 'center',
  },
  paymentRetryButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: FONT_SIZE.md,
  },
  paymentConfirmed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.healingMint,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  paymentConfirmedLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.success,
  },
  paymentConfirmedAmount: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    color: COLORS.text,
  },
  paymentConfirmedDate: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});

export default ConsultationStatusScreen;
