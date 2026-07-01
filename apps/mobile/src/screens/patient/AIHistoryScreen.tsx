import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useConsultationStore, Message } from '../../store/consultationStore';
import { SA_LANGUAGES } from '../../constants/languages';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

type RouteParams = {
  AIHistory: {
    consultationId: string;
    language: string;
  };
};

// ─── Stage constants (unchanged) ─────────────────────────────────────────────

const HISTORY_STAGES = [
  'Greeting',
  'Chief Complaint',
  'History',
  'Past Medical',
  'Medications',
  'Allergies',
  'Family',
  'Social',
  'Review',
  'Complete',
];

const deriveStage = (messages: Message[]): number => {
  const aiMessages = messages.filter((m) => m.role === 'ai' && !m.isLoading).length;
  return Math.min(aiMessages, HISTORY_STAGES.length - 1);
};

// ─── Chat bubbles ─────────────────────────────────────────────────────────────

const formatTime = (date: Date): string =>
  date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });

const TypingDots: React.FC = () => {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 180),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 400, useNativeDriver: true }),
          Animated.delay((2 - i) * 180),
        ])
      )
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.dotsContainer}>
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={[
            styles.dot,
            {
              opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
              transform: [
                { translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
};

interface MessageBubbleProps {
  role: 'ai' | 'patient';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  role,
  content,
  timestamp,
  isTyping = false,
}) => {
  const isAI = role === 'ai';

  return (
    <View style={[styles.msgRow, isAI ? styles.msgRowAI : styles.msgRowPatient]}>
      {isAI && (
        <View style={styles.aiAvatar}>
          <Ionicons name="medical" size={13} color={COLORS.white} />
        </View>
      )}
      <View style={styles.msgWrapper}>
        <View style={[styles.bubble, isAI ? styles.bubbleAI : styles.bubblePatient]}>
          {isTyping ? (
            <TypingDots />
          ) : (
            <Text style={isAI ? styles.bubbleTextAI : styles.bubbleTextPatient}>{content}</Text>
          )}
        </View>
        {!isTyping && (
          <Text style={[styles.timestamp, isAI ? styles.timestampAI : styles.timestampPatient]}>
            {formatTime(timestamp)}
          </Text>
        )}
      </View>
    </View>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

export const AIHistoryScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'AIHistory'>>();
  const { consultationId, language } = route.params;

  const {
    messages,
    isSendingMessage,
    currentConsultation,
    sendMessage,
    loadMessages,
    completeHistory,
    isLoading,
  } = useConsultationStore();

  const [inputText, setInputText] = useState('');
  const listRef = useRef<FlatList>(null);

  const isComplete =
    currentConsultation?.status === 'history_complete' ||
    currentConsultation?.status === 'doctor_reviewing' ||
    currentConsultation?.status === 'completed';

  const currentStage = deriveStage(messages);
  const langMeta = SA_LANGUAGES.find((l) => l.code === language);

  // Load initial messages when screen mounts
  useEffect(() => {
    loadMessages(consultationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consultationId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isSendingMessage) return;
    setInputText('');
    await sendMessage(text);
  }, [inputText, isSendingMessage, sendMessage]);

  const handleCompleteHistory = async () => {
    Alert.alert(
      'Complete Medical History',
      'Are you ready to submit your history to be reviewed by a doctor?',
      [
        { text: 'Not yet', style: 'cancel' },
        {
          text: 'Yes, complete',
          style: 'default',
          onPress: async () => {
            await completeHistory();
            navigation.navigate('DoctorSearch');
          },
        },
      ]
    );
  };

  const handleBack = () => {
    Alert.alert(
      'Leave consultation?',
      'Your progress will be saved.',
      [
        { text: 'Stay', style: 'cancel' },
        { text: 'Leave', onPress: () => navigation.goBack() },
      ]
    );
  };

  const renderItem = ({ item }: { item: Message }) => {
    const role = item.role === 'ai' ? 'ai' : 'patient';
    return (
      <MessageBubble
        role={role}
        content={item.content}
        timestamp={new Date(item.timestamp)}
        isTyping={item.isLoading}
      />
    );
  };

  const renderTypingItem = () => {
    if (!isSendingMessage) return null;
    return (
      <MessageBubble
        role="ai"
        content=""
        timestamp={new Date()}
        isTyping
      />
    );
  };

  // Progress fraction for right side of header
  const progressFraction = `${currentStage + 1} of ${HISTORY_STAGES.length}`;

  return (
    <SafeAreaView style={styles.root}>
      {/* ── Custom Header ── */}
      <View style={styles.header}>
        {/* Back button */}
        <TouchableOpacity
          style={styles.headerBackBtn}
          onPress={handleBack}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={28} color={COLORS.primary} />
        </TouchableOpacity>

        {/* Center: title + stage */}
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Medical History</Text>
          <Text style={styles.headerSubtitle}>{HISTORY_STAGES[currentStage]}</Text>
        </View>

        {/* Right: progress fraction + optional spinner */}
        <View style={styles.headerRight}>
          {isSendingMessage ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Text style={styles.progressFraction}>{progressFraction}</Text>
          )}
        </View>
      </View>

      {/* ── Progress Bar ── */}
      <View style={styles.progressBarTrack}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${((currentStage + 1) / HISTORY_STAGES.length) * 100}%` },
          ]}
        />
      </View>

      {/* ── Chat + Input ── */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListFooterComponent={renderTypingItem}
          style={styles.chatArea}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Ionicons name="chatbubbles-outline" size={48} color={COLORS.systemGray3} />
              <Text style={styles.emptyChatText}>Starting your consultation...</Text>
            </View>
          }
        />

        {/* Complete history button — full-width bar above input */}
        {isComplete && (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={handleCompleteHistory}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.white} style={{ marginRight: 8 }} />
                <Text style={styles.completeButtonText}>Complete History — Find a Doctor</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Input bar */}
        {!isComplete && (
          <View style={styles.inputBar}>
            {/* Mic button */}
            <TouchableOpacity
              style={styles.micButton}
              onPress={() => { /* Voice placeholder */ }}
              activeOpacity={0.7}
            >
              <Ionicons name="mic-outline" size={28} color={COLORS.secondaryLabel} />
            </TouchableOpacity>

            {/* Text input */}
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type your response..."
              placeholderTextColor={COLORS.tertiaryLabel}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
              editable={!isSendingMessage}
            />

            {/* Send button */}
            <TouchableOpacity
              style={[
                styles.sendButton,
                inputText.trim().length > 0 && !isSendingMessage
                  ? styles.sendButtonActive
                  : styles.sendButtonInactive,
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || isSendingMessage}
              activeOpacity={0.85}
            >
              <Ionicons name="arrow-up" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  flex: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.separator,
    minHeight: 52,
  },
  headerBackBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.headline,
    color: COLORS.label,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.secondaryLabel,
    marginTop: 1,
  },
  headerRight: {
    width: 56,
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 44,
  },
  progressFraction: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.secondaryLabel,
  },

  // Progress bar
  progressBarTrack: {
    height: 4,
    backgroundColor: COLORS.systemGray5,
    width: '100%',
  },
  progressBarFill: {
    height: 4,
    backgroundColor: COLORS.primary,
  },

  // Message list
  chatArea: {
    backgroundColor: COLORS.secondarySystemBackground,
  },
  messageList: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.xs,
  },

  // Bubbles
  msgRow: {
    flexDirection: 'row',
    marginVertical: SPACING.xs,
    alignItems: 'flex-end',
  },
  msgRowAI: {
    justifyContent: 'flex-start',
  },
  msgRowPatient: {
    justifyContent: 'flex-end',
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.xs + 2,
    marginBottom: SPACING.md,
    ...SHADOWS.xs,
  },
  msgWrapper: {
    maxWidth: '78%',
  },
  bubble: {
    paddingHorizontal: SPACING.md - 2,
    paddingVertical: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.xl,
  },
  bubbleAI: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: BORDER_RADIUS.xs,
    borderWidth: 1,
    borderColor: COLORS.separator,
    ...SHADOWS.sm,
  },
  bubblePatient: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: BORDER_RADIUS.xs,
    ...SHADOWS.xs,
  },
  bubbleTextAI: {
    ...TYPOGRAPHY.body,
    color: COLORS.label,
  },
  bubbleTextPatient: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
  },
  timestamp: {
    ...TYPOGRAPHY.caption2,
    color: COLORS.tertiaryLabel,
    marginTop: 3,
  },
  timestampAI: {
    textAlign: 'left',
    marginLeft: SPACING.xs,
  },
  timestampPatient: {
    textAlign: 'right',
    marginRight: SPACING.xs,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    gap: 5,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.primaryLight,
  },
  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: SPACING.md,
  },
  emptyChatText: {
    ...TYPOGRAPHY.subheadline,
    color: COLORS.secondaryLabel,
  },

  // Complete button — full-width bar, no border radius
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success,
    height: 48,
  },
  completeButtonText: {
    ...TYPOGRAPHY.headline,
    color: COLORS.white,
  },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.separator,
    gap: SPACING.sm,
  },
  micButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: COLORS.systemGray6,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.separator,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    ...TYPOGRAPHY.body,
    color: COLORS.label,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: COLORS.primary,
  },
  sendButtonInactive: {
    backgroundColor: COLORS.systemGray5,
  },
});

export default AIHistoryScreen;
