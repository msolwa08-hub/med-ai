import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING } from '../constants/theme';

interface ChatBubbleProps {
  role: 'ai' | 'patient';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

const TypingDots: React.FC = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.delay(800 - delay),
        ])
      );

    const a1 = pulse(dot1, 0);
    const a2 = pulse(dot2, 180);
    const a3 = pulse(dot3, 360);

    a1.start();
    a2.start();
    a3.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.dotsContainer}>
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View
          key={i}
          style={[styles.dot, { opacity: dot }]}
        />
      ))}
    </View>
  );
};

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
};

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  role,
  content,
  timestamp,
  isTyping = false,
}) => {
  const isAI = role === 'ai';

  return (
    <View style={[styles.row, isAI ? styles.rowAI : styles.rowPatient]}>
      <View style={styles.bubbleWrapper}>
        <View
          style={[
            styles.bubble,
            isAI ? styles.bubbleAI : styles.bubblePatient,
          ]}
        >
          {isTyping ? (
            <TypingDots />
          ) : (
            <Text style={[styles.content, isAI ? styles.contentAI : styles.contentPatient]}>
              {content}
            </Text>
          )}
        </View>
        <Text style={[styles.timestamp, isAI ? styles.timestampAI : styles.timestampPatient]}>
          {formatTime(timestamp)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    alignItems: 'flex-end',
  },
  rowAI: {
    justifyContent: 'flex-start',
  },
  rowPatient: {
    justifyContent: 'flex-end',
  },
  bubbleWrapper: {
    maxWidth: '75%',
  },
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleAI: {
    backgroundColor: COLORS.systemGray6,
    borderBottomLeftRadius: 4,
  },
  bubblePatient: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  content: {
    ...TYPOGRAPHY.body,
  },
  contentAI: {
    color: COLORS.label,
  },
  contentPatient: {
    color: COLORS.white,
  },
  timestamp: {
    ...TYPOGRAPHY.caption2,
    color: COLORS.tertiaryLabel,
    marginTop: 3,
  },
  timestampAI: {
    textAlign: 'left',
  },
  timestampPatient: {
    textAlign: 'right',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.systemGray,
  },
});

export default ChatBubble;
