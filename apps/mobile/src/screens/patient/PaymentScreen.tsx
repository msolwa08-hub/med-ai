/**
 * PaymentScreen — initiates a PayFast payment for a consultation, opens the
 * payment URL in the device browser and polls the payment status.
 *
 * Contract:
 *   POST /payments/initiate { consultationId } -> { data: { paymentId, paymentUrl, amount } }
 *   GET  /payments/status/:consultationId      -> { data: { status, amount?, paidAt? } }
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { paymentsApi } from '../../api/endpoints';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import type { PatientStackParamList } from '../../navigation/PatientNavigator';

type PaymentRouteProp = RouteProp<PatientStackParamList, 'Payment'>;

type PaymentStatus = 'NOT_INITIATED' | 'PENDING' | 'COMPLETE' | 'FAILED' | 'CANCELLED';

const apiErrorMessage = (err: unknown, fallback: string): string =>
  (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? fallback;

export const PaymentScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<PaymentRouteProp>();
  const { consultationId, doctorName } = route.params;

  const [isInitiating, setIsInitiating] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [hasOpenedBrowser, setHasOpenedBrowser] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const initiate = useCallback(async () => {
    setIsInitiating(true);
    setInitError(null);
    try {
      const response = await paymentsApi.initiate(consultationId);
      const data = response.data.data as { paymentId: string; paymentUrl: string; amount: number };
      setPaymentUrl(data.paymentUrl);
      setAmount(data.amount);
    } catch (err: unknown) {
      // e.g. "Doctor has not set a consultation fee" / "already been paid"
      setInitError(apiErrorMessage(err, 'Could not set up the payment. Please try again.'));
    } finally {
      setIsInitiating(false);
    }
  }, [consultationId]);

  useEffect(() => {
    initiate();
    return () => stopPolling();
  }, [initiate, stopPolling]);

  const fetchStatus = useCallback(async (): Promise<PaymentStatus | null> => {
    try {
      const response = await paymentsApi.getStatus(consultationId);
      const data = response.data.data as { status: PaymentStatus };
      return data.status;
    } catch {
      return null;
    }
  }, [consultationId]);

  // Poll payment status every 5 seconds once the browser has been opened
  useEffect(() => {
    if (!hasOpenedBrowser || paymentComplete) return;
    pollRef.current = setInterval(async () => {
      const status = await fetchStatus();
      if (status === 'COMPLETE') {
        stopPolling();
        setPaymentComplete(true);
      }
    }, 5000);
    return () => stopPolling();
  }, [hasOpenedBrowser, paymentComplete, fetchStatus, stopPolling]);

  const handleOpenPayment = useCallback(async () => {
    if (!paymentUrl) return;
    try {
      const canOpen = await Linking.canOpenURL(paymentUrl);
      if (!canOpen) {
        Alert.alert('Error', 'Unable to open payment page. Please try again later.');
        return;
      }
      await Linking.openURL(paymentUrl);
      setHasOpenedBrowser(true);
    } catch {
      Alert.alert('Error', 'Failed to open payment page. Please try again.');
    }
  }, [paymentUrl]);

  const handleCheckStatus = useCallback(async () => {
    setIsCheckingStatus(true);
    const status = await fetchStatus();
    setIsCheckingStatus(false);

    if (status === 'COMPLETE') {
      stopPolling();
      setPaymentComplete(true);
    } else if (status === 'FAILED' || status === 'CANCELLED') {
      Alert.alert('Payment Not Completed', 'Your payment was not completed. You can try again.', [
        { text: 'OK' },
      ]);
    } else if (status === null) {
      Alert.alert('Error', 'Could not retrieve payment status. Please try again.');
    } else {
      Alert.alert(
        'Payment Pending',
        'Your payment is still being processed. Please complete payment in the browser and check again.',
        [{ text: 'OK' }]
      );
    }
  }, [fetchStatus, stopPolling]);

  // ── Loading state (initiating payment) ──
  if (isInitiating) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.centeredText}>Setting up your payment…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Error state (initiate failed, e.g. no fee set) ──
  if (initError || paymentUrl === null || amount === null) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={28} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Payment</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centered}>
          <Ionicons name="card-outline" size={48} color={COLORS.systemGray3} />
          <Text style={styles.errorTitle}>Payment unavailable</Text>
          <Text style={styles.errorBody}>
            {initError ?? 'Could not set up the payment. Please try again.'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={initiate} activeOpacity={0.85}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const platformFee = Math.round(amount * 0.15 * 100) / 100;
  const doctorAmount = Math.round(amount * 0.85 * 100) / 100;

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={28} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Pay for Consultation</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {doctorName ? (
          <Text style={styles.doctorLine}>Consultation with {doctorName}</Text>
        ) : null}

        {/* Payment complete banner */}
        {paymentComplete && (
          <View style={styles.successCard}>
            <Ionicons name="checkmark-circle" size={32} color={COLORS.success} />
            <View style={styles.successTextBlock}>
              <Text style={styles.successTitle}>Payment Confirmed</Text>
              <Text style={styles.successBody}>
                Your payment of R{amount.toFixed(2)} was processed successfully.
              </Text>
            </View>
          </View>
        )}

        {/* Fee Summary Card */}
        <View style={styles.feeCard}>
          <Text style={styles.feeCardTitle}>Payment Summary</Text>

          <View style={styles.feeDivider} />

          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Consultation Fee</Text>
            <Text style={styles.feeTotalValue}>R{amount.toFixed(2)}</Text>
          </View>

          <View style={styles.feeBreakdown}>
            <View style={styles.feeRow}>
              <Text style={styles.feeBreakdownLabel}>Doctor receives (85%)</Text>
              <Text style={styles.feeBreakdownValue}>R{doctorAmount.toFixed(2)}</Text>
            </View>
            <View style={styles.feeRow}>
              <Text style={styles.feeBreakdownLabel}>Platform fee (15%)</Text>
              <Text style={styles.feeBreakdownValue}>R{platformFee.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.feeDivider} />

          <View style={styles.feeRow}>
            <Text style={styles.feeTotalLabel}>Total charged to you</Text>
            <Text style={styles.feeTotalBig}>R{amount.toFixed(2)}</Text>
          </View>
        </View>

        {/* Info card */}
        <View style={styles.infoCard}>
          <Ionicons name="lock-closed-outline" size={22} color={COLORS.systemBlue} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Secure Payment via PayFast</Text>
            <Text style={styles.infoBody}>
              You will be redirected to PayFast's secure payment page. Supported: credit/debit
              card, EFT, instant EFT, and SnapScan.
            </Text>
          </View>
        </View>

        {!paymentComplete && (
          <>
            {/* Pay Now button */}
            <TouchableOpacity
              style={styles.payButton}
              onPress={handleOpenPayment}
              activeOpacity={0.85}
            >
              <Text style={styles.payButtonText}>
                {hasOpenedBrowser ? 'Reopen Payment Page' : `Pay R${amount.toFixed(2)} Now`}
              </Text>
            </TouchableOpacity>

            {/* Check status button (visible after opening browser) */}
            {hasOpenedBrowser && (
              <TouchableOpacity
                style={styles.statusButton}
                onPress={handleCheckStatus}
                disabled={isCheckingStatus}
                activeOpacity={0.85}
              >
                {isCheckingStatus ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <Text style={styles.statusButtonText}>Check Payment Status</Text>
                )}
              </TouchableOpacity>
            )}

            {/* Browser note */}
            <Text style={styles.browserNote}>
              Payment opens in your device browser. Return here after completing payment — we check
              the status automatically.
            </Text>
          </>
        )}

        {paymentComplete && (
          <TouchableOpacity
            style={styles.payButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Text style={styles.payButtonText}>Back to Consultation</Text>
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  centeredText: {
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
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
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
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  title: {
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
  doctorLine: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  successCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.healingMint,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.healingTealMid,
  },
  successTextBlock: {
    flex: 1,
  },
  successTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.success,
  },
  successBody: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  feeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  feeCardTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  feeDivider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: SPACING.sm,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: SPACING.xs,
  },
  feeLabel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    fontWeight: '600',
  },
  feeTotalValue: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    fontWeight: '600',
  },
  feeBreakdown: {
    backgroundColor: COLORS.systemGray6,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    marginTop: SPACING.xs,
  },
  feeBreakdownLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  feeBreakdownValue: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  feeTotalLabel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    fontWeight: '700',
  },
  feeTotalBig: {
    fontSize: FONT_SIZE.xl,
    color: COLORS.primary,
    fontWeight: '800',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.healingMint,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.systemBlue,
    gap: SPACING.sm,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  infoBody: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  payButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  payButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: FONT_SIZE.lg,
  },
  statusButton: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.primary,
    minHeight: 52,
    justifyContent: 'center',
  },
  statusButtonText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: FONT_SIZE.md,
  },
  browserNote: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 18,
  },
});

export default PaymentScreen;
