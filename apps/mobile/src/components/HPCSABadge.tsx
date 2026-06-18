import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT_SIZE, BORDER_RADIUS, SPACING } from '../constants/theme';

type HPCSAStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';

interface HPCSABadgeProps {
  status: HPCSAStatus;
  size?: 'small' | 'normal';
}

const STATUS_CONFIG: Record<
  HPCSAStatus,
  { label: string; icon: string; backgroundColor: string; textColor: string; borderColor: string }
> = {
  VERIFIED: {
    label: 'HPCSA Verified',
    icon: '✓',
    backgroundColor: '#EBF4FF',
    textColor: '#1A3A6B',
    borderColor: '#2E5BA8',
  },
  PENDING: {
    label: 'Pending Verification',
    icon: '⏳',
    backgroundColor: '#F5F5F5',
    textColor: '#6C757D',
    borderColor: '#ADB5BD',
  },
  REJECTED: {
    label: 'Verification Rejected',
    icon: '✗',
    backgroundColor: '#FFF0F0',
    textColor: '#DC3545',
    borderColor: '#DC3545',
  },
  SUSPENDED: {
    label: 'Suspended',
    icon: '!',
    backgroundColor: '#FFF8E6',
    textColor: '#E67E00',
    borderColor: '#FFC107',
  },
};

export const HPCSABadge: React.FC<HPCSABadgeProps> = ({ status, size = 'normal' }) => {
  const config = STATUS_CONFIG[status];
  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
          paddingHorizontal: isSmall ? SPACING.xs : SPACING.sm,
          paddingVertical: isSmall ? 2 : SPACING.xs,
        },
      ]}
    >
      <Text style={[styles.icon, { color: config.textColor, fontSize: isSmall ? 9 : 11 }]}>
        {config.icon}
      </Text>
      <Text
        style={[
          styles.label,
          {
            color: config.textColor,
            fontSize: isSmall ? FONT_SIZE.xs : FONT_SIZE.sm,
          },
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.full,
    gap: 3,
    alignSelf: 'flex-start',
  },
  icon: {
    fontWeight: '700',
  },
  label: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

export default HPCSABadge;
