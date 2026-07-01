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
import { specialtyHistoryApi, type Department } from '../../api/endpoints';
import type { PatientStackParamList } from '../../navigation/PatientNavigator';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  isLoading?: boolean;
  isRedFlag?: boolean;
}

// ─── Department presentation ──────────────────────────────────────────────────

const DEPARTMENT_META: Record<
  Department,
  { label: string; icon: string; color: string; stages: string[] }
> = {
  INTERNAL: {
    label: 'Internal Medicine',
    icon: 'pulse-outline',
    color: COLORS.primary,
    stages: ['Complaint', 'System Hx', 'Constitutional', 'PMH', 'HIV/TB', 'Meds', 'Social', 'Summary'],
  },
  PAEDIATRICS: {
    label: 'Paediatrics',
    icon: 'happy-outline',
    color: COLORS.systemPurple,
    stages: ['Complaint', 'Danger Signs', 'Birth Hx', 'Feeding', 'Immunisation', 'Growth', 'TB/HIV', 'Summary'],
  },
  FAMILY_MEDICINE: {
    label: 'Family Medicine',
    icon: 'people-outline',
    color: COLORS.secondary,
    stages: ['Complaint & ICE', 'HPI', 'Chronic Dx', 'Adherence', 'Mental Health', 'Screening', 'Social', 'Summary'],
  },
  SURGERY: {
    label: 'Surgery',
    icon: 'cut-outline',
    color: COLORS.warning,
    stages: ['Complaint', 'Symptom Analysis', 'Prev. Surgery', 'Fitness', 'Bleeding Risk', 'Meds', 'Practical', 'Summary'],
  },
  ENT: {
    label: 'Ear, Nose & Throat',
    icon: 'ear-outline',
    color: COLORS.systemBlue,
    stages: ['Complaint', 'Ear', 'Nose', 'Throat', 'Neck', 'Risk Factors', 'Meds', 'Summary'],
  },
};

function deriveStage(messages: Message[], total: number): number {
  const aiCount = messages.filter((m) => m.role === 'ai' && !m.isLoading).length;
  return Math.min(aiCount, total - 1);
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

const StageIndicator: React.FC<{ stage: number; labels: string[]; color: string }> = ({
  stage,
  labels,
  color,
}) => (
  <View style={styles.stageBar}>
    <Text style={styles.stageLabel}>{labels[stage]}</Text>
    <View style={styles.stageDots}>
      {labels.map((_, i) => (
        <View
          key={i}
          style={[
            styles.stageDot,
            i <= stage ? { backgroundColor: color } : styles.stageDotInactive,
          ]}
        />
      ))}
    </View>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const SpecialtyHistoryScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<PatientStackParamList, 'SpecialtyHistory'>>();
  const { consultationId, department, language = 'en', chiefComplaint } = route.params;

  const meta = DEPARTMENT_META[department];

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [redFlagDetected, setRedFlagDetected] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
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
      const res = await specialtyHistoryApi.start({
        consultationId,
        department,
        language,
        chiefComplaint,
      });

      const data = res.data.data as {
        message: string;
        isComplete: boolean;
        redFlagDetected: boolean;
      };
      setRedFlagDetected(data.redFlagDetected);
      setIsComplete(data.isComplete);

      setMessages([
        { id: '1', role: 'ai', content: data.message, isRedFlag: data.redFlagDetected },
      ]);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        `Failed to start the ${meta.label} history session. Please try again.`;
      Alert.alert('Error', message, [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } finally {
      setIsLoading(false);
    }
  }, [consultationId, department, language, chiefComplaint, navigation, meta.label]);

  useEffect(() => {
    startSession();
  }, [startSession]);

  const handleComplete = useCallback(async () => {
    setIsExtracting(true);
    try {
      await specialtyHistoryApi.complete(consultationId);
      Alert.alert(
        'History Complete',
        `The ${meta.label} history has been compiled and sent to your doctor for review.`,
        [{ text: 'Done', onPress: () => navigation.goBack() }]
      );
    } catch {
      Alert.alert('Error', 'Failed to save history. Please contact support.');
    } finally {
      setIsExtracting(false);
    }
  }, [consultationId, meta.label, navigation]);

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
      const res = await specialtyHistoryApi.continue(consultationId, text);
      const data = res.data.data as {
        message: string;
        isComplete: boolean;
        redFlagDetected: boolean;
      };

      if (data.redFlagDetected) setRedFlagDetected(true);
      setIsComplete(data.isComplete);

      setMessages((prev) =>
        prev.map((m) =>
          m.isLoading
            ? {
                ...m,
                id: Date.now().toString(),
                content: data.message,
                isLoading: false,
                isRedFlag: data.redFlagDetected,
              }
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

  const currentStage = deriveStage(messages, meta.stages.length);

  const renderMessage = ({ item }: { item: Message }) => {
    const isAI = item.role === 'ai';
    return (
      <View style={[styles.messageRow, isAI ? styles.messageRowAI : styles.messageRowUser]}>
        {isAI && (
          <View style={[styles.avatarCircle, { backgroundColor: meta.color }]}>
            <Ionicons name={meta.icon as any} size={14} color={COLORS.white} />
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
          <View style={[styles.modeChip, { backgroundColor: meta.color }]}>
            <Ionicons name={meta.icon as any} size={12} color={COLORS.white} />
            <Text style={styles.modeChipText}>{meta.label}</Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Red Flag Banner */}
      {redFlagDetected && <RedFlagBanner />}

      {/* Stage Indicator */}
      {isStarted && (
        <StageIndicator stage={currentStage} labels={meta.stages} color={meta.color} />
      )}

      {/* Messages */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={{ flex: 1 }}
      >
        {!isStarted ? (
          <View style={styles.startingView}>
            <ActivityIndicator size="large" color={meta.color} />
            <Text style={styles.startingText}>Starting {meta.label} history session...</Text>
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

        {/* Input */}
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
              style={[
                styles.sendBtn,
                { backgroundColor: meta.color },
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
        ) : (
          <View style={styles.completeBanner}>
            {isExtracting ? (
              <>
                <ActivityIndicator color={COLORS.white} />
                <Text style={styles.completeText}>Compiling your {meta.label} history...</Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                <Text style={styles.completeText}>History complete — sending to doctor</Text>
              </>
            )}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─── Styles (mirrors OGHistoryScreen for a consistent chat experience) ────────

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

  stageBar: {
    backgroundColor: COLORS.systemBackground,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.separator,
  },
  stageLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  stageDots: { flexDirection: 'row', gap: 4 },
  stageDot: { height: 4, flex: 1, borderRadius: 2 },
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
    backgroundColor: COLORS.primary,
    borderTopRightRadius: BORDER_RADIUS.xs,
  },
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

export default SpecialtyHistoryScreen;
