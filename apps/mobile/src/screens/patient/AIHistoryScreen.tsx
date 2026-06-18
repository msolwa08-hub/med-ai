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
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useConsultationStore, Message } from '../../store/consultationStore';
import { ChatBubble } from '../../components/ChatBubble';
import { SA_LANGUAGES } from '../../constants/languages';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';

type RouteParams = {
  AIHistory: {
    consultationId: string;
    language: string;
  };
};

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

const StageProgressBar: React.FC<{ currentStage: number }> = ({ currentStage }) => {
  return (
    <View style={stageStyles.container}>
      <View style={stageStyles.track}>
        {HISTORY_STAGES.map((stage, i) => (
          <View
            key={stage}
            style={[
              stageStyles.segment,
              i < currentStage && stageStyles.segmentDone,
              i === currentStage && stageStyles.segmentCurrent,
            ]}
          />
        ))}
      </View>
      <Text style={stageStyles.label}>{HISTORY_STAGES[currentStage]}</Text>
    </View>
  );
};

const stageStyles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  track: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: 4,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
  },
  segmentDone: {
    backgroundColor: COLORS.success,
  },
  segmentCurrent: {
    backgroundColor: COLORS.primary,
  },
  label: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});

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

  const renderItem = ({ item }: { item: Message }) => {
    const role = item.role === 'ai' ? 'ai' : 'patient';
    return (
      <ChatBubble
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
      <ChatBubble
        role="ai"
        content=""
        timestamp={new Date()}
        isTyping
      />
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() =>
            Alert.alert(
              'Leave consultation?',
              'Your progress will be saved.',
              [
                { text: 'Stay', style: 'cancel' },
                { text: 'Leave', onPress: () => navigation.goBack() },
              ]
            )
          }
          style={styles.backButton}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.topBarCenter}>
          <Text style={styles.topBarLang}>
            {langMeta?.flag} {langMeta?.name}
          </Text>
          <Text style={styles.topBarId} numberOfLines={1}>
            #{consultationId.slice(-8).toUpperCase()}
          </Text>
        </View>
        <View style={styles.topBarRight}>
          {isSendingMessage && (
            <ActivityIndicator size="small" color={COLORS.primary} />
          )}
        </View>
      </View>

      {/* Stage progress */}
      <StageProgressBar currentStage={currentStage} />

      {/* Messages */}
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
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Text style={styles.emptyChatIcon}>🤖</Text>
              <Text style={styles.emptyChatText}>Starting your consultation...</Text>
            </View>
          }
        />

        {/* Complete history button */}
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
                <Text style={styles.completeButtonIcon}>✓</Text>
                <Text style={styles.completeButtonText}>Complete History — Find a Doctor</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Input bar */}
        {!isComplete && (
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type your response..."
              placeholderTextColor={COLORS.textLight}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
              editable={!isSendingMessage}
            />
            <TouchableOpacity
              style={styles.micButton}
              onPress={() => {
                /* Voice placeholder */
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.micIcon}>🎤</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || isSendingMessage) && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || isSendingMessage}
              activeOpacity={0.85}
            >
              <Text style={styles.sendButtonIcon}>➤</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary,
  },
  backButton: {
    padding: SPACING.sm,
  },
  backIcon: {
    fontSize: 28,
    color: COLORS.white,
    fontWeight: '300',
    lineHeight: 30,
  },
  topBarCenter: {
    flex: 1,
    alignItems: 'center',
  },
  topBarLang: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.white,
  },
  topBarId: {
    fontSize: FONT_SIZE.xs,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1,
  },
  topBarRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  messageList: {
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
  },
  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyChatIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyChatText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
    ...SHADOWS.md,
  },
  completeButtonIcon: {
    fontSize: 18,
    color: COLORS.white,
    fontWeight: '700',
  },
  completeButtonText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.white,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micIcon: {
    fontSize: 20,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.textLight,
  },
  sendButtonIcon: {
    fontSize: 18,
    color: COLORS.white,
  },
});

export default AIHistoryScreen;
