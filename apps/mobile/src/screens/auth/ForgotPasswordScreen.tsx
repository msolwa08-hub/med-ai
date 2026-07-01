import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { TextInput, HelperText } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { authApi } from '@api/endpoints';
import { COLORS, TYPOGRAPHY, SHADOWS, SPACING, BORDER_RADIUS } from '@constants/theme';
import type { AuthStackParamList } from '@navigation/AuthNavigator';

type ForgotPasswordNavigationProp = StackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

// Normalise SA phone number to E.164 (+27XXXXXXXXX)
function normalisePhone(phone: string): string {
  const stripped = phone.replace(/\s+/g, '');
  if (stripped.startsWith('0')) {
    return '+27' + stripped.slice(1);
  }
  return stripped;
}

function validatePhone(value: string): string | null {
  const stripped = value.replace(/\s+/g, '');
  if (!stripped) {
    return 'Phone number is required';
  }
  const saPhoneRegex = /^(\+27|0)[6-8][0-9]{8}$/;
  if (!saPhoneRegex.test(stripped)) {
    return 'Enter a valid South African phone number (e.g. 071 234 5678)';
  }
  return null;
}

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<ForgotPasswordNavigationProp>();

  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  async function handleSendCode() {
    setApiError(null);
    const error = validatePhone(phone);
    if (error) {
      setPhoneError(error);
      return;
    }
    setPhoneError(null);
    setIsLoading(true);

    const normalised = normalisePhone(phone);
    try {
      await authApi.forgotPassword(normalised);
      navigation.navigate('ResetPassword', { phone: normalised });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Something went wrong. Please try again.';
      setApiError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.systemGroupedBackground} />
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >

        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backChevron}>{'‹'}</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Forgot password?</Text>
          <Text style={styles.headerSubtitle}>
            No stress — enter your registered phone number and we'll send you a verification code.
          </Text>
        </View>

        {/* FORM */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formCard}>
            <Text style={styles.fieldLabel}>Phone Number</Text>
            <TextInput
              mode="flat"
              placeholder="+27 or 0XX XXX XXXX"
              value={phone}
              onChangeText={(val) => {
                setPhone(val);
                setPhoneError(null);
                setApiError(null);
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              error={!!phoneError}
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              style={[styles.flatInput, isFocused && styles.inputFocused]}
              left={<TextInput.Icon icon="phone-outline" color={COLORS.secondaryLabel} />}
              returnKeyType="done"
              onSubmitEditing={handleSendCode}
            />
            {phoneError ? (
              <HelperText type="error" visible={!!phoneError} style={styles.helperText}>
                {phoneError}
              </HelperText>
            ) : (
              <HelperText type="info" visible style={styles.helperText}>
                Enter your SA mobile number
              </HelperText>
            )}

            {apiError ? (
              <View style={styles.apiErrorBanner}>
                <Text style={styles.apiErrorText}>{apiError}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
              onPress={handleSendCode}
              disabled={isLoading}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              {isLoading ? (
                <View style={styles.buttonLoadingRow}>
                  <ActivityIndicator size="small" color={COLORS.white} />
                  <Text style={styles.primaryButtonText}>Sending…</Text>
                </View>
              ) : (
                <Text style={styles.primaryButtonText}>Send Code</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.backToLoginLink}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <Text style={styles.backToLoginText}>Back to Sign In</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.systemGroupedBackground,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING.xxl,
  },

  // HEADER
  header: {
    backgroundColor: COLORS.systemGroupedBackground,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: 0,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.systemBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  backChevron: {
    fontSize: 28,
    color: COLORS.primary,
    fontWeight: '600',
    lineHeight: 30,
    marginTop: -2,
  },
  headerTitle: {
    ...TYPOGRAPHY.largeTitle,
    color: COLORS.label,
    marginTop: SPACING.lg,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.secondaryLabel,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xl,
  },

  // FORM CARD (card-on-soft-background)
  formCard: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xs,
    backgroundColor: COLORS.systemBackground,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  fieldLabel: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.secondaryLabel,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  flatInput: {
    backgroundColor: COLORS.systemGray6,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.separator,
    height: 56,
    ...TYPOGRAPHY.body,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.systemBackground,
  },
  helperText: {
    ...TYPOGRAPHY.footnote,
    marginTop: 2,
    marginBottom: 0,
  },

  // API ERROR
  apiErrorBanner: {
    backgroundColor: '#FFF0EF',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.systemRed,
    paddingVertical: SPACING.md - SPACING.xs,
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.md - SPACING.xs,
  },
  apiErrorText: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.systemRed,
  },

  // PRIMARY BUTTON
  primaryButton: {
    height: 56,
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg - SPACING.xs,
  },
  primaryButtonDisabled: {
    backgroundColor: COLORS.primaryLight,
    opacity: 0.55,
  },
  primaryButtonText: {
    ...TYPOGRAPHY.headline,
    color: COLORS.white,
  },
  buttonLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },

  // BACK TO LOGIN
  backToLoginLink: {
    alignSelf: 'center',
    marginTop: SPACING.lg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  backToLoginText: {
    ...TYPOGRAPHY.subheadline,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
