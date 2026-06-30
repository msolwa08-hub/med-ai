import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { apiClient } from '../../api/client';

// ─── Types ────────────────────────────────────────────────────────────────────

type RouteParams = {
  PatientProfileSetup: {
    language?: string;
  };
};

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isLoading?: boolean;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const PatientProfileSetupScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'PatientProfileSetup'>>();
  const { language = 'en' } = route.params ?? {};

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ── Pulse animation for typing indicator ──
  useEffect(() => {
    if (isLoading) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.4, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      );
      anim.start();
      return () => anim.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isLoading, pulseAnim]);

  // ── Start session on mount ──
  const startSession = useCallback(async () => {
    setIsLoading(true);
    setSessionStarted(true);
    try {
      const res = await apiClient.post('/profile-setup/start', { language });
      const data = (res.data as { data: { message: string; isComplete?: boolean } }).data;
      setIsComplete(data.isComplete ?? false);
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: data.message,
        },
      ]);
    } catch {
      setMessages([
        {
          id: 'error-start',
          role: 'assistant',
          content: 'Sorry, I could not start the health profile setup. Please go back and try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [language]);

  useEffect(() => {
    startSession();
  }, [startSession]);

  // ── Auto-complete when isComplete flips ──
  useEffect(() => {
    if (isComplete && !isCompleting) {
      completeSession();
    }
  }, [isComplete]);

  const completeSession = async () => {
    setIsCompleting(true);
    try {
      await apiClient.post('/profile-setup/complete');
    } catch {
      // Non-fatal — health profile is already saved from the continue endpoint
    } finally {
      setIsCompleting(false);
    }
  };

  // ── Send message ──
  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || isLoading || isComplete) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    const loadingMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setInputText('');
    setIsLoading(true);

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const res = await apiClient.post('/profile-setup/continue', { userMessage: text });
      const data = (res.data as { data: { message: string; isComplete?: boolean } }).data;

      setIsComplete(data.isComplete ?? false);

      setMessages((prev) =>
        prev.map((m) =>
          m.isLoading
            ? { ...m, id: Date.now().toString(), content: data.message, isLoading: false }
            : m
        )
      );
    } catch {
      setMessages((prev) => [
        ...prev.filter((m) => !m.isLoading),
        {
          id: 'error-' + Date.now().toString(),
          role: 'assistant',
          content: 'Something went wrong. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  // ── Render message bubble ──
  const renderMessage = ({ item }: { item: Message }) => {
    const isAI = item.role === 'assistant';
    return (
      <View style={[styles.messageRow, isAI ? styles.messageRowAI : styles.messageRowUser]}>
        {isAI && (
          <View style={styles.avatarCircle}>
            <Ionicons name="heart-outline" size={14} color={COLORS.white} />
          </View>
        )}
        <View style={[styles.bubble, isAI ? styles.bubbleAI : styles.bubbleUser]}>
          {item.isLoading ? (
            <Animated.View style={{ opacity: pulseAnim }}>
              <Text style={styles.loadingDots}>● ● ●</Text>
            </Animated.View>
          ) : (
            <Text style={[styles.bubbleText, isAI ? styles.bubbleTextAI : styles.bubbleTextUser]}>
              {item.content}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.secondary} />
        </TouchableOpacity>
        <View style={styles.headerMid}>
          <Text style={styles.headerTitle}>Complete Your Profile</Text>
          <Text style={styles.headerSubtitle}>Health Profile Setup</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.profileIconWrapper}>
            <Ionicons name="medkit-outline" size={20} color={COLORS.secondary} />
          </View>
        </View>
      </View>

      {/* ── Progress chip ── */}
      {sessionStarted && (
        <View style={styles.progressBar}>
          <View style={styles.progressChip}>
            <Ionicons
              name={isComplete ? 'checkmark-circle' : 'ellipsis-horizontal-circle-outline'}
              size={14}
              color={isComplete ? COLORS.success : COLORS.secondary}
            />
            <Text style={[styles.progressChipText, isComplete && { color: COLORS.success }]}>
              {isComplete ? 'Health profile complete' : 'Building your health profile…'}
            </Text>
          </View>
        </View>
      )}

      {/* ── Chat + Input ── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={{ flex: 1 }}
      >
        {!sessionStarted ? (
          <View style={styles.startingView}>
            <ActivityIndicator size="large" color={COLORS.secondary} />
            <Text style={styles.startingText}>Starting health profile setup…</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        {/* ── Completion card ── */}
        {isComplete && (
          <View style={styles.completionCard}>
            <View style={styles.completionIconRow}>
              {isCompleting ? (
                <ActivityIndicator size="small" color={COLORS.success} />
              ) : (
                <Ionicons name="checkmark-circle" size={32} color={COLORS.success} />
              )}
            </View>
            <Text style={styles.completionHeading}>Profile Setup Complete!</Text>
            <Text style={styles.completionSubtext}>
              Your health profile is complete! Doctors will be better prepared for your consultations.
            </Text>
            <TouchableOpacity
              style={styles.completionBtn}
              onPress={() => navigation.navigate('PatientTabs')}
              activeOpacity={0.85}
            >
              <Ionicons name="home-outline" size={16} color={COLORS.white} style={{ marginRight: 6 }} />
              <Text style={styles.completionBtnText}>Go to Home</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Input bar ── */}
        {!isComplete && (
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type your answer…"
              placeholderTextColor={COLORS.textSecondary}
              multiline
              maxLength={1000}
              editable={!isLoading}
              onSubmitEditing={sendMessage}
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                (!inputText.trim() || isLoading) && styles.sendBtnDisabled,
              ]}
              onPress={sendMessage}
              disabled={!inputText.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Ionicons name="send" size={18} color={COLORS.white} />
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.systemGroupedBackground,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.systemBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.separator,
  },
  backBtn: {
    padding: SPACING.xs,
    width: 40,
  },
  headerMid: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.label,
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  profileIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.secondaryLight + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Progress
  progressBar: {
    backgroundColor: COLORS.systemBackground,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.separator,
    flexDirection: 'row',
  },
  progressChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.systemGray6,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
  },
  progressChipText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.secondary,
    fontWeight: '600',
  },

  // Starting state
  startingView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  startingText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },

  // Message list
  messageList: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    maxWidth: '90%',
  },
  messageRowAI: {
    alignSelf: 'flex-start',
  },
  messageRowUser: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.xs,
    marginTop: 4,
  },
  bubble: {
    maxWidth: '80%',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.sm,
  },
  bubbleAI: {
    backgroundColor: COLORS.systemBackground,
    borderTopLeftRadius: BORDER_RADIUS.xs,
  },
  bubbleUser: {
    backgroundColor: COLORS.secondary,
    borderTopRightRadius: BORDER_RADIUS.xs,
  },
  bubbleText: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
  },
  bubbleTextAI: {
    color: COLORS.label,
  },
  bubbleTextUser: {
    color: COLORS.white,
  },
  loadingDots: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    letterSpacing: 4,
  },

  // Completion card
  completionCard: {
    margin: SPACING.md,
    backgroundColor: COLORS.systemBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.success + '40',
    ...SHADOWS.md,
  },
  completionIconRow: {
    marginBottom: SPACING.sm,
  },
  completionHeading: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.label,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  completionSubtext: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  completionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    alignSelf: 'stretch',
  },
  completionBtnText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.white,
  },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: SPACING.md,
    backgroundColor: COLORS.systemBackground,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.separator,
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.systemGray6,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.sm,
    color: COLORS.label,
    maxHeight: 120,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});

export default PatientProfileSetupScreen;
