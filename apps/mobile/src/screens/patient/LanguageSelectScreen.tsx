import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { useConsultationStore } from '../../store/consultationStore';
import { SA_LANGUAGES } from '../../constants/languages';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Language metadata beyond the base constants
const LANGUAGE_META: Record<string, { speakers: string; region: string; color: string }> = {
  zu: { speakers: '12.1 million speakers', region: 'KwaZulu-Natal', color: '#2E8B57' },
  xh: { speakers: '8.2 million speakers', region: 'Eastern Cape', color: '#1A3A6B' },
  af: { speakers: '7.2 million speakers', region: 'Western Cape', color: '#E67E00' },
  en: { speakers: '4.9 million speakers', region: 'National', color: '#007A4D' },
  nso: { speakers: '4.6 million speakers', region: 'Limpopo', color: '#9B59B6' },
  tn: { speakers: '4.1 million speakers', region: 'North West', color: '#2980B9' },
  st: { speakers: '3.8 million speakers', region: 'Free State', color: '#E74C3C' },
  ts: { speakers: '2.3 million speakers', region: 'Limpopo & Mpumalanga', color: '#16A085' },
  ss: { speakers: '1.3 million speakers', region: 'Mpumalanga & Swaziland', color: '#8E44AD' },
  ve: { speakers: '1.2 million speakers', region: 'Limpopo', color: '#D35400' },
  nr: { speakers: '1.1 million speakers', region: 'Mpumalanga', color: '#2C3E50' },
};

// Marquee text with all languages
const MARQUEE_TEXT = SA_LANGUAGES.map((l) => `${l.nativeName} · Select your language`).join('   •   ');

const MarqueeHeader: React.FC = () => {
  const translateX = useRef(new Animated.Value(0)).current;
  const contentWidth = MARQUEE_TEXT.length * 8; // Approx width

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(translateX, {
        toValue: -contentWidth,
        duration: 30000,
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, [translateX, contentWidth]);

  return (
    <View style={marqueeStyles.container}>
      <Animated.Text
        style={[marqueeStyles.text, { transform: [{ translateX }] }]}
        numberOfLines={1}
      >
        {MARQUEE_TEXT + '   •   ' + MARQUEE_TEXT}
      </Animated.Text>
    </View>
  );
};

const marqueeStyles = StyleSheet.create({
  container: {
    height: 36,
    overflow: 'hidden',
    backgroundColor: COLORS.primaryDark,
    justifyContent: 'center',
  },
  text: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FONT_SIZE.sm,
    letterSpacing: 0.5,
    width: 10000,
  },
});

export const LanguageSelectScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { startConsultation, isLoading } = useConsultationStore();
  const [selectedCode, setSelectedCode] = useState<string | null>(
    user?.patient?.preferredLanguage || null
  );

  const handleContinue = async () => {
    if (!selectedCode || !user?.id) return;
    try {
      const consultation = await startConsultation(user.id, selectedCode);
      navigation.navigate('AIHistory', { consultationId: consultation.id, language: selectedCode });
    } catch {
      // Error is in store
    }
  };

  const renderItem = ({ item }: { item: typeof SA_LANGUAGES[0] }) => {
    const meta = LANGUAGE_META[item.code] || { speakers: '', region: '', color: COLORS.primary };
    const isSelected = selectedCode === item.code;

    return (
      <TouchableOpacity
        style={[
          styles.languageCard,
          isSelected && [styles.languageCardSelected, { borderColor: meta.color }],
        ]}
        onPress={() => setSelectedCode(item.code)}
        activeOpacity={0.8}
      >
        <View style={[styles.colorBar, { backgroundColor: meta.color }]} />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.langFlag}>{item.flag}</Text>
            {isSelected && <Text style={styles.selectedTick}>✓</Text>}
          </View>
          <Text style={styles.langName}>{item.name}</Text>
          <Text style={[styles.langNativeName, { color: meta.color }]}>{item.nativeName}</Text>
          <Text style={styles.langSpeakers}>{meta.speakers}</Text>
          <Text style={styles.langRegion}>📍 {meta.region}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <MarqueeHeader />

      <View style={styles.titleBlock}>
        <Text style={styles.title}>Select Your Language</Text>
        <Text style={styles.subtitle}>
          Choose the language you're most comfortable speaking
        </Text>
      </View>

      <FlatList
        data={SA_LANGUAGES}
        keyExtractor={(item) => item.code}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.columnWrapper}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedCode && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!selectedCode || isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.continueButtonText}>
              Continue {selectedCode ? `in ${SA_LANGUAGES.find((l) => l.code === selectedCode)?.name}` : ''}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const CARD_WIDTH = (SCREEN_WIDTH - SPACING.md * 2 - SPACING.sm) / 2;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  titleBlock: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  grid: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  columnWrapper: {
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  languageCard: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  languageCardSelected: {
    borderWidth: 2,
    ...SHADOWS.md,
  },
  colorBar: {
    height: 6,
    width: '100%',
  },
  cardContent: {
    padding: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  langFlag: {
    fontSize: 24,
  },
  selectedTick: {
    fontSize: 18,
    color: COLORS.success,
    fontWeight: '700',
  },
  langName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  langNativeName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    marginTop: 2,
  },
  langSpeakers: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  langRegion: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  footer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  continueButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  continueButtonDisabled: {
    backgroundColor: COLORS.textLight,
  },
  continueButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
});

export default LanguageSelectScreen;
