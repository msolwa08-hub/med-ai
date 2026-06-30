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
    <KeyboardAvoidingView
      style={styles.keyboardAvoid}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.systemGroupedBackground} />
      <SafeAreaView style={styles.safeArea}>

        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.backArrow}>{'←'}</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Reset Password</Text>
          <Text style={styles.headerSubtitle}>
            Enter your registered phone number and we'll send you a verification code.
          </Text>
        </View>

        {/* FORM */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formContainer}>
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
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              error={!!phoneError}
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              style={styles.flatInput}
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
            >
              <Text style={styles.primaryButtonText}>
                {isLoading ? 'Sending…' : 'Send Code'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backToLoginLink}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.7}
            >
              <Text style={styles.backToLoginText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
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
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 0,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.systemGray6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  backArrow: {
    fontSize: 18,
    color: COLORS.primary,
    fontWeight: '600',
    lineHeight: 22,
  },
  headerTitle: {
    ...TYPOGRAPHY.largeTitle,
    color: COLORS.label,
    marginTop: 40,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.secondaryLabel,
    marginTop: 8,
    marginBottom: 32,
  },

  // FORM
  formContainer: {
    marginHorizontal: 24,
    marginTop: 8,
  },
  fieldLabel: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.secondaryLabel,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  flatInput: {
    backgroundColor: COLORS.systemBackground,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.separator,
    height: 56,
    ...TYPOGRAPHY.body,
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 12,
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
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    ...SHADOWS.card,
  },
  primaryButtonDisabled: {
    opacity: 0.55,
  },
  primaryButtonText: {
    ...TYPOGRAPHY.headline,
    color: COLORS.white,
  },

  // BACK TO LOGIN
  backToLoginLink: {
    alignSelf: 'center',
    marginTop: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  backToLoginText: {
    ...TYPOGRAPHY.subheadline,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
