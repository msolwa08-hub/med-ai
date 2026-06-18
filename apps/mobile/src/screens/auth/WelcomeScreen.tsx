import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { AuthStackParamList } from '@navigation/AuthNavigator';

type WelcomeNavigationProp = StackNavigationProp<AuthStackParamList, 'Welcome'>;

const SA_LANGUAGES = [
  { code: 'zu', name: 'isiZulu' },
  { code: 'xh', name: 'isiXhosa' },
  { code: 'af', name: 'Afrikaans' },
  { code: 'en', name: 'English' },
];

export default function WelcomeScreen() {
  const navigation = useNavigation<WelcomeNavigationProp>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1A3A6B" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* TOP SECTION */}
        <View style={styles.topSection}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoPlus}>+</Text>
          </View>

          {/* App Name */}
          <Text style={styles.appName}>MedAI</Text>

          {/* SA Flag Stripe */}
          <View style={styles.flagStripe}>
            <View style={[styles.flagSegment, { backgroundColor: '#007A4D' }]} />
            <View style={[styles.flagSegment, { backgroundColor: '#FFB612' }]} />
            <View style={[styles.flagSegment, { backgroundColor: '#DE3831' }]} />
          </View>

          {/* Tagline */}
          <Text style={styles.tagline}>Healthcare in your language</Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            {'South Africa\'s AI-powered\nmedical platform'}
          </Text>
        </View>

        {/* MIDDLE SECTION */}
        <View style={styles.middleSection}>
          {/* Patient Button */}
          <TouchableOpacity
            style={styles.patientButton}
            onPress={() => navigation.navigate('RegisterPatient')}
            activeOpacity={0.85}
          >
            <Text style={styles.patientButtonText}>I'm a Patient</Text>
          </TouchableOpacity>

          {/* Doctor Button */}
          <TouchableOpacity
            style={styles.doctorButton}
            onPress={() => navigation.navigate('RegisterDoctor')}
            activeOpacity={0.85}
          >
            <Text style={styles.doctorButtonText}>I'm a Doctor</Text>
          </TouchableOpacity>

          {/* Login Row */}
          <View style={styles.loginRow}>
            <Text style={styles.loginPromptText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.75}>
              <Text style={styles.loginLinkText}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* BOTTOM SECTION */}
        <View style={styles.bottomSection}>
          <View style={styles.divider} />

          <Text style={styles.availableInLabel}>Available in:</Text>

          <View style={styles.languageChipsRow}>
            {SA_LANGUAGES.map((lang) => (
              <View key={lang.code} style={styles.languageChip}>
                <Text style={styles.languageChipText}>{lang.name}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1A3A6B',
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: '100%',
  },

  // TOP SECTION
  topSection: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 24,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  logoPlus: {
    fontSize: 48,
    fontWeight: '900',
    color: '#1A3A6B',
    lineHeight: 56,
    textAlign: 'center',
  },
  appName: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 16,
  },
  flagStripe: {
    flexDirection: 'row',
    height: 4,
    width: 120,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 8,
  },
  flagSegment: {
    flex: 1,
  },
  tagline: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '300',
    textAlign: 'center',
    marginTop: 16,
    letterSpacing: 0.5,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },

  // MIDDLE SECTION
  middleSection: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 24,
  },
  patientButton: {
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  patientButtonText: {
    color: '#1A3A6B',
    fontSize: 17,
    fontWeight: '700',
  },
  doctorButton: {
    height: 54,
    borderRadius: 27,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
  doctorButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  loginPromptText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  loginLinkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  // BOTTOM SECTION
  bottomSection: {
    flex: 0.6,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 16,
  },
  availableInLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  languageChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  languageChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 4,
    marginVertical: 2,
  },
  languageChipText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
});
