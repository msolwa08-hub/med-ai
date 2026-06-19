import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
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
  const initials = `${doctor.firstName[0]}${doctor.lastName[0]}`;

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      {/* Tinted header accent strip */}
      <View style={styles.headerStrip} />

      {/* Card body */}
      <View style={styles.body}>
        {/* Row 1: Avatar + name/type */}
        <View style={styles.topRow}>
          <View style={styles.avatarContainer}>
            {doctor.profileImage ? (
              <Image source={{ uri: doctor.profileImage }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            {/* Online presence dot */}
            <View
              style={[
                styles.onlineDot,
                { backgroundColor: doctor.isOnline ? COLORS.systemGreen : COLORS.systemGray3 },
              ]}
            />
          </View>

          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>
              {fullName}
            </Text>
            <Text style={styles.type} numberOfLines={1}>
              {typeLabel}
              {doctor.specialization ? ` · ${doctor.specialization}` : ''}
            </Text>
            <HPCSABadge status={doctor.hpcsaStatus} size="small" />
          </View>
        </View>

        {!compact && (
          <>
            {/* Row 2: Rating + distance */}
            {(doctor.rating !== undefined || doctor.distanceKm !== undefined) && (
              <View style={styles.statsRow}>
                {doctor.rating !== undefined && (
                  <View style={styles.statGroup}>
                    <Text style={styles.ratingStars}>⭐</Text>
                    <Text style={styles.ratingValue}>{doctor.rating.toFixed(1)}</Text>
                    {doctor.reviewCount !== undefined && (
                      <Text style={styles.reviewCount}>({doctor.reviewCount})</Text>
                    )}
                  </View>
                )}
                <View style={styles.statSpacer} />
                {doctor.distanceKm !== undefined && (
                  <View style={styles.statGroup}>
                    <Text style={styles.statIcon}>📍</Text>
                    <Text style={styles.distanceText}>{doctor.distanceKm.toFixed(1)} km</Text>
                  </View>
                )}
              </View>
            )}

            {/* Row 3: Languages */}
            {doctor.languagesSpoken && doctor.languagesSpoken.length > 0 && (
              <View style={styles.languagesRow}>
                {doctor.languagesSpoken.slice(0, 4).map((lang) => (
                  <Text key={lang} style={styles.langFlag}>
                    {LANGUAGE_FLAGS[lang] || '🌐'}
                  </Text>
                ))}
                {doctor.languagesSpoken.length > 4 && (
                  <Text style={styles.moreLanguages}>+{doctor.languagesSpoken.length - 4}</Text>
                )}
              </View>
            )}
          </>
        )}

        {/* Row 4: Fee + Select button */}
        <View style={styles.bottomRow}>
          {doctor.consultationFee !== undefined ? (
            <Text style={styles.fee}>R{doctor.consultationFee}</Text>
          ) : (
            <View />
          )}
          <TouchableOpacity style={styles.selectButton} onPress={onSelect} activeOpacity={0.7}>
            <Text style={styles.selectButtonText}>Select</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.systemBackground,
    borderRadius: BORDER_RADIUS.lg,
    marginVertical: SPACING.xs,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  cardCompact: {
    // compact variant — body padding already reduced via body style override isn't needed;
    // the card itself just renders fewer rows
  },
  headerStrip: {
    height: 8,
    backgroundColor: COLORS.primary + '0F', // 6% opacity
  },
  body: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: SPACING.md,
    width: 48,
    height: 48,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    ...TYPOGRAPHY.headline,
    color: COLORS.white,
  },
  onlineDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.systemBackground,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...TYPOGRAPHY.headline,
    color: COLORS.label,
  },
  type: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.secondaryLabel,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statSpacer: {
    flex: 1,
  },
  ratingStars: {
    fontSize: 13,
  },
  ratingValue: {
    ...TYPOGRAPHY.subheadline,
    color: COLORS.label,
  },
  reviewCount: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.tertiaryLabel,
  },
  statIcon: {
    fontSize: 12,
  },
  distanceText: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.secondaryLabel,
  },
  languagesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  langFlag: {
    ...TYPOGRAPHY.caption1,
    fontSize: 16,
  },
  moreLanguages: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.secondaryLabel,
    backgroundColor: COLORS.systemGray6,
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
    ...TYPOGRAPHY.headline,
    fontWeight: '700',
    color: COLORS.primary,
  },
  selectButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.full,
    minHeight: 44,
    justifyContent: 'center',
  },
  selectButtonText: {
    ...TYPOGRAPHY.subheadline,
    color: COLORS.white,
    fontWeight: '600',
  },
});

export default DoctorCard;
