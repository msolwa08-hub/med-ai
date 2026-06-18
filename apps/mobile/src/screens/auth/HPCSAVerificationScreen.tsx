import React, { useCallback, useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button, Surface } from 'react-native-paper';

import { useAuthStore } from '@store/authStore';
import { doctorApi } from '@api/endpoints';
import { BORDER_RADIUS, COLORS, SPACING } from '@constants/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type HpcsaStatus = 'pending' | 'verified' | 'rejected' | 'suspended';

interface HpcsaStatusResponse {
  status: HpcsaStatus;
  rejectionReason?: string;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface StatusIconProps {
  emoji: string;
  backgroundColor: string;
  borderColor: string;
}

function StatusIcon({ emoji, backgroundColor, borderColor }: StatusIconProps): React.JSX.Element {
  return (
    <View
      style={[
        styles.iconCircle,
        { backgroundColor, borderColor },
      ]}
    >
      <Text style={styles.iconEmoji}>{emoji}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function HPCSAVerificationScreen(): React.JSX.Element {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [localStatus, setLocalStatus] = useState<HpcsaStatus>(
    (user?.hpcsaStatus as HpcsaStatus) ?? 'pending',
  );
  const [rejectionReason, setRejectionReason] = useState<string>('');

  // ------------------------------------------------------------------
  // Fetch current HPCSA status on mount
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;

    (async () => {
      try {
        const response = await doctorApi.getHpcsaStatus(user.id);
        const data = response.data as HpcsaStatusResponse;
        if (cancelled) return;

        setLocalStatus(data.status);
        if (data.rejectionReason) {
          setRejectionReason(data.rejectionReason);
        }
      } catch {
        // Silently fail on mount — the user can manually refresh
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // ------------------------------------------------------------------
  // Refresh handler
  // ------------------------------------------------------------------
  const handleRefresh = useCallback(async () => {
    if (!user?.id || isRefreshing) return;

    setIsRefreshing(true);
    try {
      const response = await doctorApi.getHpcsaStatus(user.id);
      const data = response.data as HpcsaStatusResponse;

      setLocalStatus(data.status);
      if (data.rejectionReason) {
        setRejectionReason(data.rejectionReason);
      }

      if (data.status === 'verified') {
        // Propagate to auth store — RootNavigator will re-render automatically
        updateUser({ hpcsaStatus: 'verified' });
      }
    } catch {
      // Status unchanged; user can try again
    } finally {
      setIsRefreshing(false);
    }
  }, [user?.id, isRefreshing, updateUser]);

  // ------------------------------------------------------------------
  // Continue to Dashboard (shown when locally 'verified')
  // ------------------------------------------------------------------
  const handleContinue = useCallback(() => {
    updateUser({ hpcsaStatus: 'verified' });
  }, [updateUser]);

  // ------------------------------------------------------------------
  // Logout
  // ------------------------------------------------------------------
  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  // ------------------------------------------------------------------
  // Status body
  // ------------------------------------------------------------------
  const renderStatusBody = (): React.JSX.Element => {
    switch (localStatus) {
      case 'verified':
        return (
          <View style={styles.statusBody}>
            <StatusIcon
              emoji="✅"
              backgroundColor="#D4EDDA"
              borderColor={COLORS.success}
            />
            <Text style={[styles.statusTitle, { color: COLORS.success }]}>
              {`Verified! Welcome, Dr. ${user?.firstName ?? ''}`}
            </Text>
            <Text style={styles.statusMessage}>
              {'Your HPCSA registration has been verified. You can now start seeing patients.'}
            </Text>
            <Button
              mode="contained"
              onPress={handleContinue}
              style={[styles.primaryButton, { marginTop: SPACING.lg }]}
              contentStyle={styles.primaryButtonContent}
              labelStyle={styles.primaryButtonLabel}
              buttonColor={COLORS.secondary}
            >
              Continue to Dashboard
            </Button>
          </View>
        );

      case 'rejected':
        return (
          <View style={styles.statusBody}>
            <StatusIcon
              emoji="❌"
              backgroundColor="#F8D7DA"
              borderColor={COLORS.error}
            />
            <Text style={[styles.statusTitle, { color: COLORS.error }]}>
              Verification Failed
            </Text>
            <Text style={styles.statusMessage}>
              {'Your HPCSA registration could not be verified.'}
            </Text>

            {rejectionReason !== '' && (
              <Surface style={styles.infoCard} elevation={1}>
                <Text style={styles.infoCardLabel}>Reason</Text>
                <Text style={styles.infoCardValue}>{rejectionReason}</Text>
              </Surface>
            )}

            <Surface style={styles.infoCard} elevation={1}>
              <Text style={styles.infoCardLabel}>Appeal Process</Text>
              <Text style={styles.infoCardValue}>
                {'If you believe this is an error, please contact us at '}
                <Text style={styles.infoCardLink}>support@medai.co.za</Text>
                {' or call the HPCSA at '}
                <Text style={styles.infoCardLink}>012 338 9300</Text>
                {'.'}
              </Text>
            </Surface>

            <Button
              mode="outlined"
              onPress={handleRefresh}
              loading={isRefreshing}
              style={[styles.outlinedButton, { marginTop: SPACING.lg }]}
              contentStyle={styles.outlinedButtonContent}
              labelStyle={[styles.outlinedButtonLabel, { color: COLORS.primary }]}
              textColor={COLORS.primary}
            >
              Retry Verification
            </Button>
          </View>
        );

      case 'pending':
        return (
          <View style={styles.statusBody}>
            <StatusIcon
              emoji="⏰"
              backgroundColor="#FFF3CD"
              borderColor={COLORS.warning}
            />
            <Text style={styles.statusTitle}>Verification in Progress</Text>
            <Text style={styles.statusMessage}>
              {
                'We are checking your HPCSA registration. This usually takes 24-48 hours.\n\nWe\'ll notify you as soon as verification is complete.'
              }
            </Text>

            {user?.hpcsaNumber ? (
              <Surface style={styles.infoCard} elevation={1}>
                <Text style={styles.infoCardLabel}>HPCSA No.</Text>
                <Text style={styles.infoCardValue}>{user.hpcsaNumber}</Text>
              </Surface>
            ) : null}

            <Button
              mode="outlined"
              onPress={handleRefresh}
              loading={isRefreshing}
              style={[styles.outlinedButton, { marginTop: SPACING.lg }]}
              contentStyle={styles.outlinedButtonContent}
              labelStyle={[styles.outlinedButtonLabel, { color: COLORS.primary }]}
              textColor={COLORS.primary}
            >
              Check Status
            </Button>
          </View>
        );

      default:
        // 'suspended' or any unrecognised status
        return (
          <View style={styles.statusBody}>
            <StatusIcon
              emoji="⚠️"
              backgroundColor="#FFF3CD"
              borderColor={COLORS.warning}
            />
            <Text style={[styles.statusTitle, { color: COLORS.warning }]}>
              Account Suspended
            </Text>
            <Text style={styles.statusMessage}>
              {'Your account has been suspended. Please contact the HPCSA directly.'}
            </Text>
            <Surface style={styles.infoCard} elevation={1}>
              <Text style={styles.infoCardLabel}>HPCSA Contact</Text>
              <Text style={styles.infoCardValue}>012 338 9300</Text>
            </Surface>
          </View>
        );
    }
  };

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerApp}>MedAI</Text>
        <Text style={styles.headerSubtitle}>Doctor Verification</Text>
      </View>

      {/* Body */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderStatusBody()}

        {/* Bottom actions */}
        <View style={styles.bottomActions}>
          {localStatus === 'pending' && (
            <Button
              mode="text"
              onPress={handleRefresh}
              loading={isRefreshing}
              labelStyle={styles.textButtonLabel}
              textColor={COLORS.primary}
            >
              Refresh Status
            </Button>
          )}

          <Button
            mode="text"
            onPress={handleLogout}
            labelStyle={[styles.textButtonLabel, { color: COLORS.error }]}
            textColor={COLORS.error}
          >
            Sign Out
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.lg,
    alignItems: 'center',
  },
  headerApp: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 2,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 18,
    fontWeight: '300',
    textAlign: 'center',
    marginTop: 4,
  },

  // Scroll
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },

  // Status body
  statusBody: {
    flex: 1,
    alignItems: 'center',
    paddingTop: SPACING.xl,
  },

  // Icon circle (100×100)
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconEmoji: {
    fontSize: 48,
  },

  // Text
  statusTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginTop: SPACING.lg,
  },
  statusMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: SPACING.sm,
  },

  // Info card
  infoCard: {
    width: '100%',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.lg,
    backgroundColor: COLORS.surface,
  },
  infoCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  infoCardValue: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  infoCardLink: {
    color: COLORS.primaryLight,
    fontWeight: '600',
  },

  // Buttons
  primaryButton: {
    width: '100%',
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
  },
  primaryButtonContent: {
    height: 52,
  },
  primaryButtonLabel: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  outlinedButton: {
    width: '100%',
    borderRadius: BORDER_RADIUS.xl,
    borderColor: COLORS.primary,
  },
  outlinedButtonContent: {
    height: 52,
  },
  outlinedButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // Bottom actions
  bottomActions: {
    marginTop: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  textButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
