/**
 * PaymentScreen — opens the PayFast payment URL in the device browser
 * and allows the patient to poll payment status.
 *
 * Note: react-native-webview is not installed in this project.
 * Install it with `npx expo install react-native-webview` to enable
 * in-app WebView payments. Until then this screen uses Linking.openURL
 * to launch the PayFast page in the system browser.
 */
import React, { useState, useCallback } from 'react';
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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { paymentsApi } from '../../api/endpoints';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import type { PatientStackParamList } from '../../navigation/PatientNavigator';

type PaymentRouteProp = RouteProp<PatientStackParamList, 'Payment'>;

export const PaymentScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<PaymentRouteProp>();
  const { consultationId, paymentUrl, amount } = route.params;

  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [hasOpenedBrowser, setHasOpenedBrowser] = useState(false);

  const platformFee = Math.round(amount * 0.15 * 100) / 100;
  const doctorAmount = Math.round(amount * 0.85 * 100) / 100;

  const handleOpenPayment = useCallback(async () => {
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
    try {
      const response = await paymentsApi.getStatus(consultationId);
      const data = response.data?.data;

      if (data?.status === 'COMPLETE') {
        Alert.alert(
          'Payment Confirmed',
          `Your payment of R${amount.toFixed(2)} has been successfully processed.`,
          [
            {
              text: 'View Consultation',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else if (data?.status === 'FAILED' || data?.status === 'CANCELLED') {
        Alert.alert(
          'Payment Not Completed',
          'Your payment was not completed. You can try again.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Payment Pending',
          'Your payment is still being processed. Please complete payment in the browser and check again.',
          [{ text: 'OK' }]
        );
      }
    } catch {
      Alert.alert('Error', 'Could not retrieve payment status. Please try again.');
    } finally {
      setIsCheckingStatus(false);
    }
  }, [consultationId, amount, navigation]);

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Pay for Consultation</Text>
        </View>

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
          <Text style={styles.infoIcon}>🔒</Text>
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Secure Payment via PayFast</Text>
            <Text style={styles.infoBody}>
              You will be redirected to PayFast's secure payment page. Supported: credit/debit card,
              EFT, instant EFT, and SnapScan.
            </Text>
          </View>
        </View>

        {/* Pay Now button */}
        <TouchableOpacity style={styles.payButton} onPress={handleOpenPayment}>
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
          Payment opens in your device browser. Return here after completing payment to verify status.
        </Text>

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
  content: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  backButton: {
    marginBottom: SPACING.sm,
  },
  backButtonText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
    color: COLORS.text,
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
    marginVertical: 4,
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
    backgroundColor: '#EBF8FF',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.systemBlue,
    gap: SPACING.sm,
  },
  infoIcon: {
    fontSize: 22,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
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
    alignItems: 'center',
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
