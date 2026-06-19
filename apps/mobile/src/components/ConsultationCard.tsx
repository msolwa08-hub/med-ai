import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Consultation } from '../store/consultationStore';

interface ConsultationCardProps {
  consultation: Consultation;
  onPress: () => void;
}

const STATUS_LABELS: Record<Consultation['status'], string> = {
  history_taking: 'In Progress',
  history_complete: 'History Done',
  doctor_reviewing: 'Doctor Reviewing',
  examination: 'Examination',
  diagnosis: 'Diagnosis',
  management: 'Management',
  completed: 'Completed',
};

// Each status maps to an iOS system color for accent bar + pill
const STATUS_SYSTEM_COLOR: Record<Consultation['status'], string> = {
  history_taking:   COLORS.systemOrange,
  history_complete: COLORS.systemBlue,
  doctor_reviewing: COLORS.systemBlue,
  examination:      COLORS.systemBlue,
  diagnosis:        COLORS.systemPurple,
  management:       COLORS.systemGreen,
  completed:        COLORS.systemGreen,
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const ConsultationCard: React.FC<ConsultationCardProps> = ({ consultation, onPress }) => {
  const statusLabel = STATUS_LABELS[consultation.status];
  const accentColor = STATUS_SYSTEM_COLOR[consultation.status];

  const doctorName = consultation.doctor
    ? `Dr. ${consultation.doctor.firstName} ${consultation.doctor.lastName}`
    : 'AI History Only';

  const doctorType = consultation.doctor?.doctorType
    ? consultation.doctor.doctorType.replace('_', ' ').toUpperCase()
    : null;

  const diagnosisPreview = consultation.diagnosis
    ? consultation.diagnosis.length > 60
      ? consultation.diagnosis.slice(0, 57) + '...'
      : consultation.diagnosis
    : 'Awaiting diagnosis';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

      {/* Card content */}
      <View style={styles.content}>
        {/* Top row: doctor name + date */}
        <View style={styles.topRow}>
          <Text style={styles.doctorName} numberOfLines={1}>
            {doctorName}
          </Text>
          <Text style={styles.date}>{formatDate(consultation.createdAt)}</Text>
        </View>

        {/* Doctor type + status pill */}
        <View style={styles.metaRow}>
          {doctorType && (
            <Text style={styles.doctorType}>{doctorType}</Text>
          )}
          <View
            style={[
              styles.statusPill,
              { backgroundColor: accentColor + '26' }, // 15% opacity hex
            ]}
          >
            <Text style={[styles.statusPillText, { color: accentColor }]}>
              {statusLabel}
            </Text>
          </View>
        </View>

        {/* Diagnosis preview + chevron */}
        <View style={styles.bottomRow}>
          <Text style={styles.diagnosisPreview} numberOfLines={1}>
            {diagnosisPreview}
          </Text>
          <Text style={styles.chevron}>›</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.systemBackground,
    borderRadius: BORDER_RADIUS.md,
    marginVertical: SPACING.xs,
    flexDirection: 'row',
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  accentBar: {
    width: 3,
    // fills the full card height via alignSelf stretch (default)
  },
  content: {
    flex: 1,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  doctorName: {
    ...TYPOGRAPHY.headline,
    color: COLORS.label,
    flex: 1,
    marginRight: SPACING.sm,
  },
  date: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.secondaryLabel,
    flexShrink: 0,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  doctorType: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.secondaryLabel,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
  },
  statusPillText: {
    ...TYPOGRAPHY.caption1,
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  diagnosisPreview: {
    ...TYPOGRAPHY.subheadline,
    color: COLORS.secondaryLabel,
    flex: 1,
  },
  chevron: {
    fontSize: 22,
    color: COLORS.tertiaryLabel,
    marginLeft: SPACING.sm,
    lineHeight: 24,
  },
});

export default ConsultationCard;
