import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
  Dimensions,
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 12;
const HORIZONTAL_PADDING = 24;
const CARD_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - CARD_GAP) / 2;

// SA flag stripe: black / gold / green / gold / black (simplified horizontal bands)
const SA_FLAG_BANDS = [
  { color: '#000000', flex: 2 },
  { color: '#FFB612', flex: 2 },
  { color: '#007A4D', flex: 3 },
  { color: '#FFB612', flex: 2 },
  { color: '#000000', flex: 2 },
];

export default function WelcomeScreen() {
  const navigation = useNavigation<WelcomeNavigationProp>();
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');

  function renderLanguageCard({ item }: { item: typeof SA_LANGUAGES[0] }) {
    const isSelected = selectedLanguage === item.code;
    return (
      <TouchableOpacity
        style={[
          styles.languageCard,
          isSelected ? styles.languageCardSelected : styles.languageCardUnselected,
        ]}
        onPress={() => setSelectedLanguage(item.code)}
        activeOpacity={0.75}
      >
        <Text style={styles.languageFlag}>{item.flag}</Text>
        <Text style={[styles.languageName, isSelected && styles.languageNameSelected]}>
          {item.name}
        </Text>
        <Text style={styles.languageNative}>{item.nativeName}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.systemGroupedBackground} />

      {/* SCROLLABLE TOP AREA */}
      <FlatList
        data={SA_LANGUAGES}
        keyExtractor={(item) => item.code}
        renderItem={renderLanguageCard}
        numColumns={2}
        columnWrapperStyle={styles.languageRow}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
        ListHeaderComponent={
          <>
            {/* HERO SECTION — white top area */}
            <View style={styles.heroSection}>
              {/* SA Flag Stripe */}
              <View style={styles.flagStripe}>
                {SA_FLAG_BANDS.map((band, idx) => (
                  <View
                    key={idx}
                    style={[styles.flagBand, { backgroundColor: band.color, flex: band.flex }]}
                  />
                ))}
              </View>

              {/* Logo + wordmark */}
              <View style={styles.logoWrapper}>
                <View style={styles.logoSquare}>
                  <Text style={styles.logoPlus}>+</Text>
                </View>
                <Text style={styles.wordmark}>MedAI</Text>
                <Text style={styles.tagline}>
                  Healthcare in your language · Gesondheidssorg in u taal
                </Text>
              </View>
            </View>

            {/* LANGUAGE HEADING */}
            <Text style={styles.languageHeading}>Choose your language / Kies u taal</Text>
          </>
        }
      />

      {/* FIXED BOTTOM CTA */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('RegisterPatient')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>I'm a Patient</Text>
        </TouchableOpacity>

        <View style={{ height: 12 }} />

        <TouchableOpacity
          style={styles.outlineButton}
          onPress={() => navigation.navigate('RegisterDoctor')}
          activeOpacity={0.85}
        >
          <Text style={styles.outlineButtonText}>I'm a Doctor</Text>
        </TouchableOpacity>

        <View style={{ height: 16 }} />

        <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
          <Text style={styles.signInLink}>
            Already have an account?{' '}
            <Text style={styles.signInLinkBold}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.systemGroupedBackground,
  },

  listContent: {
    paddingBottom: 8,
  },

  // HERO
  heroSection: {
    backgroundColor: COLORS.systemBackground,
    paddingBottom: 28,
  },
  flagStripe: {
    flexDirection: 'row',
    height: 11,
    width: '100%',
  },
  flagBand: {
    height: '100%',
  },
  logoWrapper: {
    alignItems: 'center',
    paddingTop: 32,
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  logoSquare: {
    width: 72,
    height: 72,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.card,
  },
  logoPlus: {
    fontSize: 40,
    fontWeight: '800',
    color: COLORS.white,
    lineHeight: 48,
    textAlign: 'center',
  },
  wordmark: {
    ...TYPOGRAPHY.title2,
    color: COLORS.primary,
    marginTop: 12,
  },
  tagline: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.secondaryLabel,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
  },

  // LANGUAGE SECTION
  languageHeading: {
    ...TYPOGRAPHY.headline,
    color: COLORS.label,
    marginTop: SPACING.lg,
    marginBottom: 12,
    marginHorizontal: HORIZONTAL_PADDING,
  },
  languageRow: {
    paddingHorizontal: HORIZONTAL_PADDING,
    gap: CARD_GAP,
  },
  languageCard: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.systemBackground,
    borderRadius: BORDER_RADIUS.md,
    padding: 12,
    marginBottom: CARD_GAP,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  languageCardSelected: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: `rgba(26, 58, 107, 0.08)`,
  },
  languageCardUnselected: {
    borderWidth: 1,
    borderColor: COLORS.separator,
  },
  languageFlag: {
    fontSize: 24,
    marginBottom: 6,
  },
  languageName: {
    ...TYPOGRAPHY.subheadline,
    fontWeight: '600',
    color: COLORS.label,
    textAlign: 'center',
  },
  languageNameSelected: {
    color: COLORS.primary,
  },
  languageNative: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.secondaryLabel,
    textAlign: 'center',
    marginTop: 2,
  },

  // FIXED BOTTOM
  bottomActions: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: COLORS.systemGroupedBackground,
    borderTopWidth: 1,
    borderTopColor: COLORS.separator,
  },
  primaryButton: {
    height: 56,
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.card,
  },
  primaryButtonText: {
    ...TYPOGRAPHY.headline,
    color: COLORS.white,
  },
  outlineButton: {
    height: 56,
    width: '100%',
    backgroundColor: COLORS.systemBackground,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outlineButtonText: {
    ...TYPOGRAPHY.headline,
    color: COLORS.primary,
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
