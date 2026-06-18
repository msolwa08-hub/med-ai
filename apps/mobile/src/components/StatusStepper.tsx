import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '../constants/theme';

type StepStatus = 'completed' | 'current' | 'pending';

interface Step {
  label: string;
  status: StepStatus;
  description?: string;
}

interface StatusStepperProps {
  steps: Step[];
}

const StepIcon: React.FC<{ status: StepStatus; index: number }> = ({ status, index }) => {
  if (status === 'completed') {
    return (
      <View style={[styles.stepCircle, styles.stepCircleCompleted]}>
        <Text style={styles.stepCheckmark}>✓</Text>
      </View>
    );
  }
  if (status === 'current') {
    return (
      <View style={[styles.stepCircle, styles.stepCircleCurrent]}>
        <ActivityIndicator size="small" color={COLORS.white} />
      </View>
    );
  }
  return (
    <View style={[styles.stepCircle, styles.stepCirclePending]}>
      <Text style={styles.stepNumber}>{index + 1}</Text>
    </View>
  );
};

export const StatusStepper: React.FC<StatusStepperProps> = ({ steps }) => {
  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        return (
          <View key={index} style={styles.stepRow}>
            <View style={styles.stepLeft}>
              <StepIcon status={step.status} index={index} />
              {!isLast && (
                <View
                  style={[
                    styles.connector,
                    step.status === 'completed' && styles.connectorCompleted,
                    step.status === 'current' && styles.connectorCurrent,
                  ]}
                />
              )}
            </View>
            <View style={styles.stepContent}>
              <Text
                style={[
                  styles.stepLabel,
                  step.status === 'completed' && styles.stepLabelCompleted,
                  step.status === 'current' && styles.stepLabelCurrent,
                  step.status === 'pending' && styles.stepLabelPending,
                ]}
              >
                {step.label}
              </Text>
              {step.description ? (
                <Text style={styles.stepDescription}>{step.description}</Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.sm,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepLeft: {
    alignItems: 'center',
    width: 36,
    marginRight: SPACING.md,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleCompleted: {
    backgroundColor: COLORS.success,
  },
  stepCircleCurrent: {
    backgroundColor: COLORS.primary,
  },
  stepCirclePending: {
    backgroundColor: COLORS.surfaceVariant,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  stepCheckmark: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  stepNumber: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  connector: {
    width: 2,
    flex: 1,
    minHeight: 32,
    backgroundColor: COLORS.border,
    marginVertical: 2,
  },
  connectorCompleted: {
    backgroundColor: COLORS.success,
  },
  connectorCurrent: {
    backgroundColor: COLORS.primaryLight,
  },
  stepContent: {
    flex: 1,
    paddingBottom: SPACING.lg,
    paddingTop: 4,
  },
  stepLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  stepLabelCompleted: {
    color: COLORS.success,
  },
  stepLabelCurrent: {
    color: COLORS.primary,
  },
  stepLabelPending: {
    color: COLORS.textSecondary,
  },
  stepDescription: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});

export default StatusStepper;
