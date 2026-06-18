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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { consultationApi } from '../../api/endpoints';
import { StatusStepper } from '../../components/StatusStepper';
import { Consultation } from '../../store/consultationStore';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';

type RouteParams = {
  ConsultationStatus: {
    consultationId: string;
    doctorId?: string;
  };
};

type Step = {
  label: string;
  status: 'completed' | 'current' | 'pending';
  description?: string;
};

const buildSteps = (status: Consultation['status']): Step[] => {
  const statusOrder: Consultation['status'][] = [
    'history_taking',
    'history_complete',
    'doctor_reviewing',
    'examination',
    'diagnosis',
    'management',
    'completed',
  ];

  const displaySteps: Array<{
    label: string;
    statusKey: Consultation['status'];
    description: string;
  }> = [
    {
      label: 'History Taken',
      statusKey: 'history_complete',
      description: 'Your AI medical history has been recorded',
    },
    {
      label: 'Doctor Reviewing',
      statusKey: 'doctor_reviewing',
      description: 'The doctor is reviewing your medical history',
    },
    {
      label: 'Examination',
      statusKey: 'examination',
      description: 'Clinical examination in progress',
    },
    {
      label: 'Diagnosis & Management',
      statusKey: 'diagnosis',
      description: 'Doctor is preparing your diagnosis and treatment plan',
    },
    {
      label: 'Completed',
      statusKey: 'completed',
      description: 'Consultation complete. Check your records.',
    },
  ];

  const currentIdx = statusOrder.indexOf(status);

  return displaySteps.map((step) => {
    const stepIdx = statusOrder.indexOf(step.statusKey);
    if (currentIdx > stepIdx) return { ...step, status: 'completed' };
    if (currentIdx === stepIdx) return { ...step, status: 'current' };
    return { ...step, status: 'pending' };
  });
};

const STATUS_DESCRIPTIONS: Partial<Record<Consultation['status'], string>> = {
  history_complete: 'Your medical history is ready. Waiting for a doctor to review.',
  doctor_reviewing:
    'The doctor is carefully reviewing your AI-generated history. Please wait — this usually takes 5–10 minutes.',
  examination: 'The doctor may ask you some follow-up questions or request an in-person examination.',
  diagnosis: 'Your doctor is preparing your diagnosis and treatment plan.',
  completed: 'Your consultation is complete! Your prescription and instructions are ready.',
};

export const ConsultationStatusScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'ConsultationStatus'>>();
  const { consultationId } = route.params;

  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef(AppState.currentState);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await consultationApi.getById(consultationId);
      setConsultation(response.data);
      if (response.data.status === 'completed') {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    } catch {
      // Silently fail on polling
    } finally {
      setIsLoading(false);
    }
  }, [consultationId]);

  useEffect(() => {
    fetchStatus();
    intervalRef.current = setInterval(fetchStatus, 30000);

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        fetchStatus();
      }
      appStateRef.current = nextState;
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      subscription.remove();
    };
  }, [fetchStatus]);

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
              // Call cancel endpoint if it exists; otherwise just navigate back
              navigation.navigate('PatientHome');
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

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading consultation status...</Text>
      </View>
    );
  }

  const status = consultation?.status ?? 'history_complete';
  const steps = buildSteps(status);
  const description = STATUS_DESCRIPTIONS[status] ?? 'Processing your consultation...';
  const doctor = consultation?.doctor;

  return (
    <SafeAreaView style={styles.root}>
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
                {doctor.doctorType?.replace('_', ' ')}
              </Text>
            </View>
            <View style={styles.onlinePill}>
              <Text style={styles.onlinePillText}>● Active</Text>
            </View>
          </View>
        ) : (
          <View style={styles.doctorCard}>
            <View style={[styles.doctorAvatar, { backgroundColor: COLORS.textLight }]}>
              <Text style={styles.doctorAvatarInitials}>?</Text>
            </View>
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>Awaiting Doctor</Text>
              <Text style={styles.doctorType}>Your history is being matched</Text>
            </View>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        )}

        {/* Status description */}
        <View style={styles.descriptionCard}>
          <Text style={styles.descriptionText}>{description}</Text>
        </View>

        {/* Stepper */}
        <View style={styles.stepperCard}>
          <Text style={styles.stepperTitle}>Consultation Progress</Text>
          <StatusStepper steps={steps} />
        </View>

        {/* Wait time */}
        <View style={styles.waitCard}>
          <Text style={styles.waitIcon}>⏱</Text>
          <View>
            <Text style={styles.waitTitle}>Estimated Wait</Text>
            <Text style={styles.waitValue}>
              {status === 'doctor_reviewing' ? '5–10 minutes' : status === 'examination' ? '10–20 minutes' : status === 'completed' ? 'Done!' : 'Calculating...'}
            </Text>
          </View>
        </View>

        {/* Contact button */}
        <TouchableOpacity style={styles.contactButton} onPress={handleContact}>
          <Text style={styles.contactButtonIcon}>💬</Text>
          <Text style={styles.contactButtonText}>Contact Doctor</Text>
        </TouchableOpacity>

        {/* Auto-refresh notice */}
        <Text style={styles.refreshNote}>Status auto-updates every 30 seconds</Text>

        {/* Cancel */}
        {status !== 'completed' && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            disabled={isCancelling}
          >
            {isCancelling ? (
              <ActivityIndicator size="small" color={COLORS.error} />
            ) : (
              <Text style={styles.cancelButtonText}>Cancel Consultation</Text>
            )}
          </TouchableOpacity>
        )}

        {/* View records when complete */}
        {status === 'completed' && (
          <TouchableOpacity
            style={styles.viewRecordsButton}
            onPress={() => navigation.navigate('MyRecords')}
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
  },
  loadingText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
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
    backgroundColor: '#E8F8EF',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  onlinePillText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.success,
    fontWeight: '700',
  },
  descriptionCard: {
    backgroundColor: '#EBF4FF',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
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
  waitIcon: {
    fontSize: 28,
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
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.primary,
    gap: SPACING.sm,
  },
  contactButtonIcon: {
    fontSize: 18,
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
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  viewRecordsText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: FONT_SIZE.md,
  },
});

export default ConsultationStatusScreen;
