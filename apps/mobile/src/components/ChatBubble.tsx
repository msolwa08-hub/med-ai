import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '../constants/theme';

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
    const bounce = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: -6,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.delay(600 - delay),
        ])
      );

    const a1 = bounce(dot1, 0);
    const a2 = bounce(dot2, 150);
    const a3 = bounce(dot3, 300);

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
          style={[styles.dot, { transform: [{ translateY: dot }] }]}
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
      {isAI && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>M</Text>
        </View>
      )}
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
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
    marginBottom: 16,
    flexShrink: 0,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  bubbleWrapper: {
    maxWidth: '75%',
  },
  bubble: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
  },
  bubbleAI: {
    backgroundColor: '#F0F0F0',
    borderBottomLeftRadius: BORDER_RADIUS.sm,
  },
  bubblePatient: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: BORDER_RADIUS.sm,
  },
  content: {
    fontSize: FONT_SIZE.md,
    lineHeight: 22,
  },
  contentAI: {
    color: COLORS.text,
  },
  contentPatient: {
    color: COLORS.white,
  },
  timestamp: {
    fontSize: FONT_SIZE.xs,
    marginTop: 3,
  },
  timestampAI: {
    color: COLORS.textSecondary,
    textAlign: 'left',
  },
  timestampPatient: {
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.textSecondary,
  },
});

export default ChatBubble;
