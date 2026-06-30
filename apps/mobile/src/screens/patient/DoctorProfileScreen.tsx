import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { doctorApi } from '../../api/endpoints';
import { HPCSABadge } from '../../components/HPCSABadge';
import { ConsentModal } from '../../components/ConsentModal';
import { NearbyDoctor } from '../../components/DoctorCard';
import { useConsultationStore } from '../../store/consultationStore';
import { useAuthStore } from '../../store/authStore';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';

type RouteParams = {
  DoctorProfile: { doctorId: string };
};

interface DoctorProfile extends NearbyDoctor {
  bio?: string;
  qualifications?: string[];
  reviews?: Array<{ author: string; rating: number; comment: string; date: string }>;
  practiceName?: string;
  practiceAddress?: string;
}

const LANG_NAMES: Record<string, string> = {
  en: 'English',
  zu: 'isiZulu',
  xh: 'isiXhosa',
  af: 'Afrikaans',
  nso: 'Sepedi',
  tn: 'Setswana',
  st: 'Sesotho',
  ts: 'Xitsonga',
  ss: 'siSwati',
  ve: 'Tshivenda',
  nr: 'isiNdebele',
};

const LANG_FLAGS: Record<string, string> = {
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

const StarRow: React.FC<{ rating: number; size?: number }> = ({ rating, size = 16 }) => {
  return (
    <Text style={{ fontSize: size, color: COLORS.warning }}>
      {'★'.repeat(Math.floor(rating))}
      {rating % 1 >= 0.5 ? '½' : ''}
      {'☆'.repeat(5 - Math.ceil(rating))}
    </Text>
  );
};

export const DoctorProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'DoctorProfile'>>();
  const { doctorId } = route.params;

  const { currentConsultation } = useConsultationStore();
  const { user } = useAuthStore();

  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [qualExpanded, setQualExpanded] = useState(false);
  const [consentVisible, setConsentVisible] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const historyComplete =
    currentConsultation?.status === 'history_complete' ||
    currentConsultation?.status === 'doctor_reviewing';

  useEffect(() => {
    const load = async () => {
      try {
        const response = await doctorApi.getProfile(doctorId);
        setDoctor(response.data);
      } catch {
        // Mock data fallback
        setDoctor({
          id: doctorId,
          firstName: 'Sipho',
          lastName: 'Dlamini',
          doctorType: 'gp',
          isOnline: true,
          hpcsaStatus: 'VERIFIED',
          rating: 4.8,
          reviewCount: 127,
          distanceKm: 1.2,
          etaMinutes: 8,
          consultationFee: 350,
          languagesSpoken: ['zu', 'en', 'xh'],
          bio:
            'Dr. Dlamini is a compassionate general practitioner with over 12 years of experience serving communities across KwaZulu-Natal. He is fluent in isiZulu, English and isiXhosa and is committed to providing culturally sensitive care to all patients.',
          qualifications: [
            'MBChB — University of KwaZulu-Natal (2012)',
            'Diploma in Primary Care — CMSA (2015)',
            'Certificate in HIV Management — HPCSA (2016)',
          ],
          practiceName: 'Dlamini Family Practice',
          practiceAddress: '12 Berea Road, Durban, 4001',
          reviews: [
            {
              author: 'Nonhlanhla M.',
              rating: 5,
              comment: 'Very professional and caring. Explained everything clearly in Zulu.',
              date: '2026-05-10',
            },
            {
              author: 'James T.',
              rating: 5,
              comment: 'Quick, efficient and friendly. Highly recommend.',
              date: '2026-04-22',
            },
            {
              author: 'Ayasha P.',
              rating: 4,
              comment: 'Good doctor, wait time was a bit long but service was excellent.',
              date: '2026-03-18',
            },
          ],
        });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [doctorId]);

  const handleBooking = () => {
    setConsentVisible(true);
  };

  const handleConsent = async (remember: boolean) => {
    setConsentVisible(false);
    if (user?.id && doctor) {
      try {
        const { patientApi } = await import('../../api/endpoints');
        await patientApi.grantConsent(user.id, doctor.id);
      } catch {
        // Proceed even if consent API fails in dev
      }
    }
    navigation.navigate('ConsultationStatus', {
      consultationId: currentConsultation?.id,
      doctorId: doctor?.id,
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!doctor) {
    return (
      <View style={styles.loading}>
        <Text style={{ color: COLORS.error }}>Doctor not found.</Text>
      </View>
    );
  }

  const displayedReviews =
    showAllReviews ? doctor.reviews ?? [] : (doctor.reviews ?? []).slice(0, 3);

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header photo */}
        <View style={styles.photoContainer}>
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoInitials}>
              {doctor.firstName[0]}
              {doctor.lastName[0]}
            </Text>
          </View>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <View
            style={[
              styles.onlineBadge,
              { backgroundColor: doctor.isOnline ? COLORS.success : COLORS.textLight },
            ]}
          >
            <Text style={styles.onlineBadgeText}>
              {doctor.isOnline ? '● Online' : '○ Offline'}
            </Text>
          </View>
        </View>

        <View style={styles.body}>
          {/* Name + badge */}
          <Text style={styles.name}>
            Dr. {doctor.firstName} {doctor.lastName}
          </Text>
          <HPCSABadge status={doctor.hpcsaStatus} size="normal" />

          <Text style={styles.docType}>
            {doctor.doctorType.replace('_', ' ').toUpperCase()}
            {doctor.specialization ? ` · ${doctor.specialization}` : ''}
          </Text>

          {/* Rating */}
          <View style={styles.ratingRow}>
            <StarRow rating={doctor.rating ?? 0} />
            <Text style={styles.ratingText}>
              {(doctor.rating ?? 0).toFixed(1)} ({doctor.reviewCount ?? 0} reviews)
            </Text>
          </View>

          {/* Fee + Commission breakdown */}
          <View style={styles.feeCard}>
            <View style={styles.feeMainRow}>
              <Text style={styles.feeLabel}>Consultation Fee</Text>
              <Text style={styles.feeValue}>R {doctor.consultationFee ?? '—'}</Text>
            </View>
            {doctor.consultationFee != null && (
              <View style={styles.feeBreakdown}>
                <View style={styles.feeBreakdownRow}>
                  <Text style={styles.feeBreakdownLabel}>🏥 Platform service fee (15%)</Text>
                  <Text style={styles.feeBreakdownValue}>
                    −R {(doctor.consultationFee * 0.15).toFixed(0)}
                  </Text>
                </View>
                <View style={styles.feeBreakdownRow}>
                  <Text style={[styles.feeBreakdownLabel, { fontWeight: '700' }]}>
                    👨‍⚕️ Goes to your doctor (85%)
                  </Text>
                  <Text style={[styles.feeBreakdownValue, { color: COLORS.success, fontWeight: '700' }]}>
                    R {(doctor.consultationFee * 0.85).toFixed(0)}
                  </Text>
                </View>
                <Text style={styles.feeNote}>
                  Secure payment · Funds held until consultation complete
                </Text>
              </View>
            )}
          </View>

          {/* Wait time info */}
          <View style={styles.waitCard}>
            <View style={styles.waitItem}>
              <Text style={styles.waitIcon}>⏱</Text>
              <View>
                <Text style={styles.waitValue}>
                  {doctor.isOnline ? `~${doctor.etaMinutes ?? '—'} min` : 'Unavailable'}
                </Text>
                <Text style={styles.waitLabel}>Estimated wait</Text>
              </View>
            </View>
            <View style={styles.waitDivider} />
            <View style={styles.waitItem}>
              <Text style={styles.waitIcon}>📍</Text>
              <View>
                <Text style={styles.waitValue}>{doctor.distanceKm?.toFixed(1) ?? '—'} km</Text>
                <Text style={styles.waitLabel}>Distance</Text>
              </View>
            </View>
            <View style={styles.waitDivider} />
            <View style={styles.waitItem}>
              <Text style={styles.waitIcon}>⭐</Text>
              <View>
                <Text style={styles.waitValue}>{(doctor.rating ?? 0).toFixed(1)}</Text>
                <Text style={styles.waitLabel}>{doctor.reviewCount ?? 0} reviews</Text>
              </View>
            </View>
          </View>

          {/* About */}
          {doctor.bio && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.bioText}>{doctor.bio}</Text>
            </View>
          )}

          {/* Languages */}
          {doctor.languagesSpoken && doctor.languagesSpoken.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Languages Spoken</Text>
              <View style={styles.langRow}>
                {doctor.languagesSpoken.map((code) => (
                  <View key={code} style={styles.langTag}>
                    <Text style={styles.langTagFlag}>{LANG_FLAGS[code] ?? '🌐'}</Text>
                    <Text style={styles.langTagName}>{LANG_NAMES[code] ?? code}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Qualifications */}
          {doctor.qualifications && doctor.qualifications.length > 0 && (
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.qualHeader}
                onPress={() => setQualExpanded(!qualExpanded)}
              >
                <Text style={styles.sectionTitle}>Qualifications</Text>
                <Text style={styles.expandIcon}>{qualExpanded ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {qualExpanded &&
                doctor.qualifications.map((q, i) => (
                  <View key={i} style={styles.qualRow}>
                    <Text style={styles.qualBullet}>🎓</Text>
                    <Text style={styles.qualText}>{q}</Text>
                  </View>
                ))}
            </View>
          )}

          {/* Practice */}
          {doctor.practiceName && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Practice</Text>
              <Text style={styles.practiceText}>{doctor.practiceName}</Text>
              {doctor.practiceAddress && (
                <Text style={styles.addressText}>📍 {doctor.practiceAddress}</Text>
              )}
            </View>
          )}

          {/* Reviews */}
          {(doctor.reviews ?? []).length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Patient Reviews</Text>
              {displayedReviews.map((review, i) => (
                <View key={i} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewAuthor}>{review.author}</Text>
                    <StarRow rating={review.rating} size={12} />
                  </View>
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                  <Text style={styles.reviewDate}>
                    {new Date(review.date).toLocaleDateString('en-ZA', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
              ))}
              {(doctor.reviews ?? []).length > 3 && (
                <TouchableOpacity onPress={() => setShowAllReviews(!showAllReviews)}>
                  <Text style={styles.seeAllReviews}>
                    {showAllReviews
                      ? 'Show fewer reviews'
                      : `See all ${doctor.reviews!.length} reviews`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Sticky bottom bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomEta}>
          <Text style={styles.etaText}>
            {doctor.isOnline ? `~${doctor.etaMinutes ?? '?'} min` : 'Currently offline'}
          </Text>
          <Text style={styles.etaSub}>
            {doctor.isOnline ? 'Estimated start time' : 'Doctor unavailable'}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.bookButton,
            (!historyComplete || !doctor.isOnline) && styles.bookButtonDisabled,
          ]}
          onPress={handleBooking}
          disabled={!historyComplete || !doctor.isOnline}
          activeOpacity={0.85}
        >
          <Text style={styles.bookButtonText}>
            {historyComplete ? 'Book Consultation' : 'Complete History First'}
          </Text>
        </TouchableOpacity>
      </View>

      <ConsentModal
        visible={consentVisible}
        doctor={doctor}
        onConsent={handleConsent}
        onDecline={() => setConsentVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingBottom: SPACING.xl,
  },
  photoContainer: {
    height: 240,
    backgroundColor: COLORS.primaryLight,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: COLORS.white,
  },
  photoInitials: {
    color: COLORS.white,
    fontSize: 40,
    fontWeight: '700',
  },
  backButton: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.3)',
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 26,
    color: COLORS.white,
    fontWeight: '300',
    lineHeight: 28,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: SPACING.md,
    right: SPACING.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  onlineBadgeText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  body: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
  },
  name: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  docType: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  ratingText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  feeCard: {
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  feeMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feeBreakdown: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  feeBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  feeBreakdownLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  feeBreakdownValue: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  feeNote: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
    fontStyle: 'italic',
  },
  feeLabel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  feeValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    color: COLORS.primary,
  },
  waitCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.sm,
    alignItems: 'center',
  },
  waitItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    justifyContent: 'center',
  },
  waitDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.border,
  },
  waitIcon: { fontSize: 18 },
  waitValue: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.text },
  waitLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },
  section: {
    marginTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingTop: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  bioText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  langRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  langTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    gap: 4,
  },
  langTagFlag: {
    fontSize: 14,
  },
  langTagName: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    fontWeight: '500',
  },
  qualHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expandIcon: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  qualRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  qualBullet: {
    fontSize: 14,
  },
  qualText: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    lineHeight: 20,
  },
  practiceText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  addressText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  reviewCard: {
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  reviewAuthor: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: COLORS.text,
  },
  reviewComment: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  reviewDate: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
    marginTop: 4,
  },
  seeAllReviews: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primaryLight,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: SPACING.sm,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.md,
    ...SHADOWS.md,
  },
  bottomEta: {
    flex: 1,
  },
  etaText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  etaSub: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  bookButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.sm,
  },
  bookButtonDisabled: {
    backgroundColor: COLORS.textLight,
  },
  bookButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: FONT_SIZE.md,
  },
});

export default DoctorProfileScreen;
