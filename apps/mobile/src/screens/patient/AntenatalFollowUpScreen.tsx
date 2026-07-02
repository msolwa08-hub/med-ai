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
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { antenatalFollowUpApi } from '../../api/endpoints';
import type { PatientStackParamList } from '../../navigation/PatientNavigator';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  isLoading?: boolean;
  isRedFlag?: boolean;
}

const STAGE_LABELS = [
  'Gestational Age', 'Interval History', 'Fetal Movements',
  'Danger Signs', 'Adherence', 'Concerns', 'Summary',
];

function deriveStage(messages: Message[]): number {
  const aiCount = messages.filter((m) => m.role === 'ai' && !m.isLoading).length;
  return Math.min(aiCount, STAGE_LABELS.length - 1);
}

// ─── Components ───────────────────────────────────────────────────────────────

const RedFlagBanner: React.FC = () => (
  <View style={styles.redFlagBanner}>
    <Ionicons name="warning" size={18} color={COLORS.white} />
    <Text style={styles.redFlagBannerText}>
      Red flag detected — please seek emergency assessment immediately.
    </Text>
  </View>
);

const ContextBanner: React.FC<{ visitNumber?: number; priorFound: boolean }> = ({
  visitNumber,
  priorFound,
}) => (
  <View style={[styles.contextBanner, !priorFound && styles.contextBannerWarn]}>
    <Ionicons
      name={priorFound ? 'checkmark-circle-outline' : 'information-circle-outline'}
      size={16}
      color={priorFound ? COLORS.success : COLORS.systemOrange}
    />
    <Text style={styles.contextBannerText}>
      {priorFound
        ? `ANC visit ${visitNumber ?? '?'} — pregnancy details loaded from your last visit`
        : 'No prior visit found on record — we\'ll confirm your dates from scratch'}
    </Text>
  </View>
);

const StageIndicator: React.FC<{ stage: number }> = ({ stage }) => (
  <View style={styles.stageBar}>
    <Text style={styles.stageLabel}>{STAGE_LABELS[stage]}</Text>
    <View style={styles.stageDots}>
      {STAGE_LABELS.map((_, i) => (
        <View
          key={i}
          style={[styles.stageDot, i <= stage ? styles.stageDotActive : styles.stageDotInactive]}
        />
      ))}
    </View>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const AntenatalFollowUpScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<PatientStackParamList, 'AntenatalFollowUp'>>();
  const { consultationId, language = 'en' } = route.params;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [redFlagDetected, setRedFlagDetected] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [priorContextFound, setPriorContextFound] = useState(false);
  const [visitNumber, setVisitNumber] = useState<number | undefined>(undefined);
  const flatListRef = useRef<FlatList>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isLoading) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.5, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      anim.start();
      return () => anim.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isLoading, pulseAnim]);

  const startSession = useCallback(async () => {
    setIsLoading(true);
    setIsStarted(true);

    try {
      const res = await antenatalFollowUpApi.start(consultationId, language);
      const data = res.data.data as {
        message: string;
        isComplete: boolean;
        redFlagDetected: boolean;
        priorContextFound: boolean;
        visitNumber?: number;
      };
      setRedFlagDetected(data.redFlagDetected);
      setIsComplete(data.isComplete);
      setPriorContextFound(data.priorContextFound);
      setVisitNumber(data.visitNumber);

      setMessages([
        { id: '1', role: 'ai', content: data.message, isRedFlag: data.redFlagDetected },
      ]);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to start the follow-up session. Please try again.';
      Alert.alert('Error', message, [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } finally {
      setIsLoading(false);
    }
  }, [consultationId, language, navigation]);

  useEffect(() => {
    startSession();
  }, [startSession]);

  const handleComplete = useCallback(async () => {
    setIsExtracting(true);
    try {
      await antenatalFollowUpApi.complete(consultationId);
      Alert.alert(
        'Follow-Up Complete',
        'Your antenatal follow-up has been compiled and sent to your doctor for review.',
        [{ text: 'Done', onPress: () => navigation.goBack() }]
      );
    } catch {
      Alert.alert('Error', 'Failed to save follow-up. Please contact support.');
    } finally {
      setIsExtracting(false);
    }
  }, [consultationId, navigation]);

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || isLoading || isComplete) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    const loadingMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'ai',
      content: '',
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setInputText('');
    setIsLoading(true);

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const res = await antenatalFollowUpApi.continue(consultationId, text);
      const data = res.data.data as { message: string; isComplete: boolean; redFlagDetected: boolean };

      if (data.redFlagDetected) setRedFlagDetected(true);
      setIsComplete(data.isComplete);

      setMessages((prev) =>
        prev.map((m) =>
          m.isLoading
            ? { ...m, id: Date.now().toString(), content: data.message, isLoading: false, isRedFlag: data.redFlagDetected }
            : m
        )
      );

      if (data.isComplete) {
        handleComplete();
      }
    } catch {
      setMessages((prev) => prev.filter((m) => !m.isLoading));
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const currentStage = deriveStage(messages);

  const renderMessage = ({ item }: { item: Message }) => {
    const isAI = item.role === 'ai';
    return (
      <View style={[styles.messageRow, isAI ? styles.messageRowAI : styles.messageRowUser]}>
        {isAI && (
          <View style={styles.avatarCircle}>
            <Ionicons name="woman-outline" size={14} color={COLORS.white} />
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
          {item.isRedFlag && !item.isLoading && (
            <View style={styles.redFlagMark}>
              <Ionicons name="warning" size={10} color={COLORS.emergency} />
              <Text style={styles.redFlagMarkText}>Red flag</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.headerMid}>
          <View style={styles.modeChip}>
            <Ionicons name="calendar-outline" size={12} color={COLORS.white} />
            <Text style={styles.modeChipText}>ANC Follow-Up</Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {redFlagDetected && <RedFlagBanner />}
      {isStarted && <ContextBanner visitNumber={visitNumber} priorFound={priorContextFound} />}
      {isStarted && <StageIndicator stage={currentStage} />}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={{ flex: 1 }}
      >
        {!isStarted ? (
          <View style={styles.startingView}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.startingText}>Loading your pregnancy record...</Text>
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

        {!isComplete ? (
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type your answer..."
              placeholderTextColor={COLORS.textSecondary}
              multiline
              maxLength={1000}
              editable={!isLoading}
              onSubmitEditing={sendMessage}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!inputText.trim() || isLoading) && styles.sendBtnDisabled]}
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
        ) : (
          <View style={styles.completeBanner}>
            {isExtracting ? (
              <>
                <ActivityIndicator color={COLORS.white} />
                <Text style={styles.completeText}>Compiling your follow-up note...</Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                <Text style={styles.completeText}>Follow-up complete — sending to doctor</Text>
              </>
            )}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.systemGroupedBackground },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.systemBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.separator,
  },
  backBtn: { padding: SPACING.xs, width: 40 },
  headerMid: { flex: 1, alignItems: 'center' },
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    gap: 4,
    backgroundColor: COLORS.systemPurple,
  },
  modeChipText: { color: COLORS.white, fontSize: FONT_SIZE.xs, fontWeight: '700' },

  redFlagBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.emergency,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  redFlagBannerText: { flex: 1, color: COLORS.white, fontSize: FONT_SIZE.sm, fontWeight: '600' },

  contextBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.success + '15',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.lg,
  },
  contextBannerWarn: { backgroundColor: COLORS.systemOrange + '15' },
  contextBannerText: { flex: 1, fontSize: FONT_SIZE.xs, color: COLORS.label },

  stageBar: {
    backgroundColor: COLORS.systemBackground,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.separator,
  },
  stageLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, fontWeight: '500', marginBottom: 4 },
  stageDots: { flexDirection: 'row', gap: 4 },
  stageDot: { height: 4, flex: 1, borderRadius: 2 },
  stageDotActive: { backgroundColor: COLORS.systemPurple },
  stageDotInactive: { backgroundColor: COLORS.systemGray4 },

  startingView: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md },
  startingText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },

  messageList: { padding: SPACING.md, paddingBottom: SPACING.xl },

  messageRow: { flexDirection: 'row', marginBottom: SPACING.md, maxWidth: '90%' },
  messageRowAI: { alignSelf: 'flex-start' },
  messageRowUser: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },

  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.xs,
    marginTop: 4,
    backgroundColor: COLORS.systemPurple,
  },

  bubble: {
    maxWidth: '80%',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.sm,
  },
  bubbleAI: { backgroundColor: COLORS.systemBackground, borderTopLeftRadius: BORDER_RADIUS.xs },
  bubbleUser: { backgroundColor: COLORS.primary, borderTopRightRadius: BORDER_RADIUS.xs },
  bubbleText: { fontSize: FONT_SIZE.sm, lineHeight: 20 },
  bubbleTextAI: { color: COLORS.label },
  bubbleTextUser: { color: COLORS.white },

  loadingDots: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, letterSpacing: 4 },

  redFlagMark: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  redFlagMarkText: { fontSize: 10, color: COLORS.emergency, fontWeight: '600' },

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
    backgroundColor: COLORS.systemPurple,
  },
  sendBtnDisabled: { opacity: 0.5 },

  completeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.success,
    paddingVertical: SPACING.lg,
  },
  completeText: { color: COLORS.white, fontSize: FONT_SIZE.sm, fontWeight: '600' },
});

export default AntenatalFollowUpScreen;
