import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { HPCSABadge } from './HPCSABadge';

export interface NearbyDoctor {
  id: string;
  firstName: string;
  lastName: string;
  doctorType: 'gp' | 'specialist' | 'allied_health' | 'travelling';
  specialization?: string;
  profileImage?: string;
  rating?: number;
  reviewCount?: number;
  distanceKm?: number;
  etaMinutes?: number;
  consultationFee?: number;
  languagesSpoken?: string[];
  isOnline: boolean;
  hpcsaStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';
  latitude?: number;
  longitude?: number;
}

const DOCTOR_TYPE_LABELS: Record<NearbyDoctor['doctorType'], string> = {
  gp: 'General Practitioner',
  specialist: 'Specialist',
  allied_health: 'Allied Health',
  travelling: 'Travelling Doctor',
};

const LANGUAGE_FLAGS: Record<string, string> = {
  en: '🇬🇧',
  zu: '🇿🇦',
  xh: '🇿🇦',
  af: '🇿🇦',
  nso: '🇿🇦',
  tn: '🇿🇦',
  st: '🇿🇦',
  ts: '🇿🇦',
  ss: '🇿🇦',
  ve: '🇿🇦',
  nr: '🇿🇦',
};

interface DoctorCardProps {
  doctor: NearbyDoctor;
  onSelect: () => void;
  compact?: boolean;
}

const renderStars = (rating: number): string => {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
};

export const DoctorCard: React.FC<DoctorCardProps> = ({ doctor, onSelect, compact = false }) => {
  const fullName = `Dr. ${doctor.firstName} ${doctor.lastName}`;
  const typeLabel = DOCTOR_TYPE_LABELS[doctor.doctorType];

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <View style={styles.topRow}>
        <View style={styles.avatarContainer}>
          {doctor.profileImage ? (
            <Image source={{ uri: doctor.profileImage }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>
                {doctor.firstName[0]}
                {doctor.lastName[0]}
              </Text>
            </View>
          )}
          <View
            style={[
              styles.onlineDot,
              { backgroundColor: doctor.isOnline ? COLORS.success : COLORS.textLight },
            ]}
          />
        </View>

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {fullName}
          </Text>
          <Text style={styles.type}>
            {typeLabel}
            {doctor.specialization ? ` · ${doctor.specialization}` : ''}
          </Text>
          <HPCSABadge status={doctor.hpcsaStatus} size="small" />
        </View>
      </View>

      {!compact && (
        <>
          <View style={styles.statsRow}>
            {doctor.rating !== undefined && (
              <View style={styles.stat}>
                <Text style={styles.ratingStars}>{renderStars(doctor.rating)}</Text>
                <Text style={styles.statText}>
                  {doctor.rating.toFixed(1)}
                  {doctor.reviewCount ? ` (${doctor.reviewCount})` : ''}
                </Text>
              </View>
            )}
            {doctor.distanceKm !== undefined && (
              <View style={styles.stat}>
                <Text style={styles.statIcon}>📍</Text>
                <Text style={styles.statText}>{doctor.distanceKm.toFixed(1)} km</Text>
              </View>
            )}
            {doctor.etaMinutes !== undefined && (
              <View style={styles.stat}>
                <Text style={styles.statIcon}>🕐</Text>
                <Text style={styles.statText}>~{doctor.etaMinutes} min</Text>
              </View>
            )}
          </View>

          {doctor.languagesSpoken && doctor.languagesSpoken.length > 0 && (
            <View style={styles.languagesRow}>
              {doctor.languagesSpoken.slice(0, 5).map((lang) => (
                <Text key={lang} style={styles.langFlag}>
                  {LANGUAGE_FLAGS[lang] || '🌐'}
                </Text>
              ))}
              {doctor.languagesSpoken.length > 5 && (
                <Text style={styles.moreLanguages}>+{doctor.languagesSpoken.length - 5}</Text>
              )}
            </View>
          )}
        </>
      )}

      <View style={styles.bottomRow}>
        {doctor.consultationFee !== undefined && (
          <Text style={styles.fee}>R {doctor.consultationFee}</Text>
        )}
        <TouchableOpacity style={styles.selectButton} onPress={onSelect} activeOpacity={0.85}>
          <Text style={styles.selectButtonText}>Select</Text>
        </TouchableOpacity>
      </View>
    </View>
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
  cardCompact: {
    padding: SPACING.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: COLORS.white,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  type: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
    flexWrap: 'wrap',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingStars: {
    color: COLORS.warning,
    fontSize: FONT_SIZE.sm,
  },
  statIcon: {
    fontSize: 12,
  },
  statText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  languagesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: 4,
  },
  langFlag: {
    fontSize: 16,
  },
  moreLanguages: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.surfaceVariant,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: BORDER_RADIUS.sm,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  fee: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.primary,
  },
  selectButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  selectButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: FONT_SIZE.md,
  },
});

export default DoctorCard;
