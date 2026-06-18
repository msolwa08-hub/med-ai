import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
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

const STATUS_COLORS: Record<Consultation['status'], { bg: string; text: string }> = {
  history_taking: { bg: '#FFF8E6', text: '#E67E00' },
  history_complete: { bg: '#EBF4FF', text: '#1A3A6B' },
  doctor_reviewing: { bg: '#E8F4FD', text: '#17A2B8' },
  examination: { bg: '#E8F4FD', text: '#17A2B8' },
  diagnosis: { bg: '#FFF0F8', text: '#9B59B6' },
  management: { bg: '#F0FFF4', text: '#28A745' },
  completed: { bg: '#F0FFF4', text: '#28A745' },
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
  const statusColor = STATUS_COLORS[consultation.status];

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
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.date}>{formatDate(consultation.createdAt)}</Text>
          <Text style={styles.doctorName}>{doctorName}</Text>
          {doctorType && <Text style={styles.doctorType}>{doctorType}</Text>}
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
            <Text style={[styles.statusText, { color: statusColor.text }]}>{statusLabel}</Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.footer}>
        <Text style={styles.diagnosisPreview} numberOfLines={2}>
          {diagnosisPreview}
        </Text>
        <Text style={styles.arrow}>›</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginVertical: SPACING.xs,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  date: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  doctorName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  doctorType: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  statusText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: SPACING.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  diagnosisPreview: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  arrow: {
    fontSize: 22,
    color: COLORS.textLight,
    marginLeft: SPACING.sm,
  },
});

export default ConsultationCard;
