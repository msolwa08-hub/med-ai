import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { AuthStackParamList } from '@navigation/AuthNavigator';
import { COLORS, TYPOGRAPHY, SHADOWS, SPACING, BORDER_RADIUS } from '@constants/theme';

type WelcomeNavigationProp = StackNavigationProp<AuthStackParamList, 'Welcome'>;

const SA_LANGUAGES = [
  { code: 'zu', name: 'isiZulu',    nativeName: 'isiZulu',    flag: '🇿🇦' },
  { code: 'xh', name: 'isiXhosa',   nativeName: 'isiXhosa',   flag: '🇿🇦' },
  { code: 'af', name: 'Afrikaans',  nativeName: 'Afrikaans',  flag: '🇿🇦' },
  { code: 'en', name: 'English',    nativeName: 'English',    flag: '🇿🇦' },
  { code: 'st', name: 'Sesotho',    nativeName: 'Sesotho',    flag: '🇿🇦' },
  { code: 'tn', name: 'Setswana',   nativeName: 'Setswana',   flag: '🇿🇦' },
];

export default function WelcomeScreen() {
  const navigation = useNavigation<WelcomeNavigationProp>();
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');

  function renderLanguageChip({ item }: { item: typeof SA_LANGUAGES[0] }) {
    const isSelected = selectedLanguage === item.code;
    return (
      <TouchableOpacity
        style={[styles.chip, isSelected ? styles.chipSelected : styles.chipUnselected]}
        onPress={() => setSelectedLanguage(item.code)}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
      >
        <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* FULL-BLEED HERO */}
      <SafeAreaView style={styles.heroSafeArea}>
        <View style={styles.hero}>
          <View style={styles.logoSquare}>
            <Text style={styles.logoPlus}>+</Text>
          </View>

          <Text style={styles.wordmark}>MedAI</Text>

          <Text style={styles.valueProp}>
            AI-guided consultations in 11 South African languages
          </Text>

          <View style={styles.trustPill}>
            <Text style={styles.trustText}>🔒 POPIA-compliant</Text>
            <View style={styles.trustDivider} />
            <Text style={styles.trustText}>🩺 HPCSA-verified doctors</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* BOTTOM SHEET */}
      <View style={styles.sheet}>
        <SafeAreaView>
          <Text style={styles.languageHeading}>Choose your language · Kies u taal</Text>

          <FlatList
            data={SA_LANGUAGES}
            keyExtractor={(item) => item.code}
            renderItem={renderLanguageChip}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
            style={styles.chipList}
          />

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('RegisterPatient')}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>I'm a Patient</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('RegisterDoctor')}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryButtonText}>I'm a Doctor</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signInLinkButton}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <Text style={styles.signInLink}>
              Already have an account?{' '}
              <Text style={styles.signInLinkBold}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  heroSafeArea: {
    flex: 1,
  },

  // HERO
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  logoSquare: {
    width: 72,
    height: 72,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  logoPlus: {
    fontSize: 40,
    fontWeight: '800',
    color: COLORS.primary,
    lineHeight: 48,
    textAlign: 'center',
  },
  wordmark: {
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: COLORS.textInverted,
  },
  valueProp: {
    ...TYPOGRAPHY.callout,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: SPACING.sm,
    maxWidth: 300,
  },
  trustPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.xl,
  },
  trustText: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.textInverted,
    fontWeight: '600',
  },
  trustDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    marginHorizontal: SPACING.sm,
  },

  // BOTTOM SHEET
  sheet: {
    backgroundColor: COLORS.systemBackground,
    borderTopLeftRadius: BORDER_RADIUS.xxl,
    borderTopRightRadius: BORDER_RADIUS.xxl,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  languageHeading: {
    ...TYPOGRAPHY.subheadline,
    fontWeight: '600',
    color: COLORS.secondaryLabel,
    marginBottom: SPACING.sm,
  },
  chipList: {
    flexGrow: 0,
    marginHorizontal: -SPACING.lg,
    marginBottom: SPACING.lg,
  },
  chipRow: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  chip: {
    height: 44,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipSelected: {
    backgroundColor: COLORS.healingMint,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  chipUnselected: {
    backgroundColor: COLORS.systemGray6,
    borderWidth: 1.5,
    borderColor: COLORS.systemGray6,
  },
  chipLabel: {
    ...TYPOGRAPHY.subheadline,
    fontWeight: '600',
    color: COLORS.secondaryLabel,
  },
  chipLabelSelected: {
    color: COLORS.primaryDark,
  },

  // CTAs
  primaryButton: {
    height: 56,
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    ...TYPOGRAPHY.headline,
    color: COLORS.textInverted,
  },
  secondaryButton: {
    height: 56,
    width: '100%',
    backgroundColor: COLORS.healingMint,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.healingTealMid,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.sm + SPACING.xs,
  },
  secondaryButtonText: {
    ...TYPOGRAPHY.headline,
    color: COLORS.primaryDark,
  },
  signInLinkButton: {
    alignSelf: 'center',
    marginTop: SPACING.xs,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  signInLink: {
    ...TYPOGRAPHY.subheadline,
    color: COLORS.secondaryLabel,
    textAlign: 'center',
  },
  signInLinkBold: {
    ...TYPOGRAPHY.subheadline,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
