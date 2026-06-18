/**
 * Doctor Incentive & Priority Scoring Service
 *
 * Scores and ranks doctors for:
 *   1. Consultation queue priority (patient-facing doctor matching)
 *   2. Incentive tier calculation (BRONZE → SILVER → GOLD → PLATINUM)
 *   3. Performance analytics for doctor dashboards
 *   4. Geospatial-enhanced scoring for nearby doctor discovery
 *
 * Scoring factors:
 *   - Consultation volume (monthly)
 *   - Average patient rating
 *   - Response time (minutes to accept consultation)
 *   - Completion rate (% consultations completed vs abandoned)
 *   - STG adherence (% documented against SA STG)
 *   - Language diversity (SA language capability)
 *   - Availability hours
 *   - Proximity to patient (km, for nearby matching)
 */

import { prisma } from '../lib/prisma.js';
import type { NearbyDoctor } from '../types/index.js';

// ============================================================
// Types
// ============================================================

export type IncentiveTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface DoctorScore {
  doctorUserId: string;
  totalScore: number; // 0–100
  tier: IncentiveTier;
  breakdown: ScoreBreakdown;
  consultationsThisMonth: number;
  averageRating: number;
  responseTimeMinutes: number;
  completionRate: number; // 0–1
  languageCount: number;
  stgAdherenceRate: number; // 0–1
  isAvailable: boolean;
  lastCalculated: string;
}

export interface ScoreBreakdown {
  volumeScore: number;      // max 25 pts
  ratingScore: number;      // max 25 pts
  responseTimeScore: number;// max 20 pts
  completionScore: number;  // max 15 pts
  languageScore: number;    // max 10 pts
  stgScore: number;         // max 5 pts
}

export interface ScoredDoctor extends NearbyDoctor {
  priorityScore: number; // Combined incentive + proximity score
  incentiveTier: IncentiveTier;
  responseTimeMinutes?: number;
  consultationsThisMonth?: number;
  averageRating: number;
}

export interface IncentiveAction {
  actionType:
    | 'CONSULTATION_COMPLETED'
    | 'HIGH_RATING_RECEIVED'
    | 'FAST_RESPONSE'
    | 'STG_DOCUMENTED'
    | 'NEW_LANGUAGE_CONSULTATION'
    | 'MONTHLY_BONUS'
    | 'FIRST_CONSULTATION_BONUS';
  points: number;
  description: string;
  doctorUserId: string;
  consultationId?: string;
  timestamp: string;
}

export interface IncentiveTierConfig {
  tier: IncentiveTier;
  minScore: number;
  maxScore: number;
  label: string;
  benefits: string[];
  monthlyConsultationBonus: number; // ZAR
  priorityBoost: number;            // Points added to queue priority
}

// ============================================================
// Tier Configuration
// ============================================================

const TIER_CONFIG: IncentiveTierConfig[] = [
  {
    tier: 'BRONZE',
    minScore: 0,
    maxScore: 39,
    label: 'Bronze Partner',
    benefits: [
      'Listed in doctor directory',
      'Access to MedAI platform',
      'Basic analytics dashboard',
    ],
    monthlyConsultationBonus: 0,
    priorityBoost: 0,
  },
  {
    tier: 'SILVER',
    minScore: 40,
    maxScore: 59,
    label: 'Silver Partner',
    benefits: [
      'Priority listing in search results',
      'Monthly performance report',
      'R500 monthly consultation bonus',
      'Reduced platform fee (15%)',
    ],
    monthlyConsultationBonus: 500,
    priorityBoost: 10,
  },
  {
    tier: 'GOLD',
    minScore: 60,
    maxScore: 79,
    label: 'Gold Partner',
    benefits: [
      'Featured placement in directory',
      'R1 200 monthly consultation bonus',
      'Reduced platform fee (10%)',
      'Access to continuing education resources',
      'Priority technical support',
    ],
    monthlyConsultationBonus: 1200,
    priorityBoost: 20,
  },
  {
    tier: 'PLATINUM',
    minScore: 80,
    maxScore: 100,
    label: 'Platinum Partner',
    benefits: [
      'Top placement in all searches',
      'R2 500 monthly consultation bonus',
      'Reduced platform fee (5%)',
      'Dedicated account manager',
      'Early access to new features',
      'MedAI Platinum badge on profile',
      'Annual performance award eligibility',
    ],
    monthlyConsultationBonus: 2500,
    priorityBoost: 35,
  },
];

// ============================================================
// Score Calculation
// ============================================================

/**
 * Calculate a doctor's incentive score based on their performance metrics
 */
export function calculateDoctorScore(metrics: {
  consultationsThisMonth: number;
  averageRating: number; // 0–5
  avgResponseTimeMinutes: number;
  completionRate: number; // 0–1
  languageCount: number;
  stgAdherenceRate: number; // 0–1
  isAvailable: boolean;
  doctorUserId: string;
}): DoctorScore {
  const breakdown: ScoreBreakdown = {
    volumeScore: calculateVolumeScore(metrics.consultationsThisMonth),
    ratingScore: calculateRatingScore(metrics.averageRating),
    responseTimeScore: calculateResponseTimeScore(metrics.avgResponseTimeMinutes),
    completionScore: calculateCompletionScore(metrics.completionRate),
    languageScore: calculateLanguageScore(metrics.languageCount),
    stgScore: calculateSTGScore(metrics.stgAdherenceRate),
  };

  const totalScore = Math.min(
    100,
    Object.values(breakdown).reduce((sum, score) => sum + score, 0)
  );

  const tier = determineTier(totalScore);

  return {
    doctorUserId: metrics.doctorUserId,
    totalScore: Math.round(totalScore),
    tier,
    breakdown,
    consultationsThisMonth: metrics.consultationsThisMonth,
    averageRating: metrics.averageRating,
    responseTimeMinutes: metrics.avgResponseTimeMinutes,
    completionRate: metrics.completionRate,
    languageCount: metrics.languageCount,
    stgAdherenceRate: metrics.stgAdherenceRate,
    isAvailable: metrics.isAvailable,
    lastCalculated: new Date().toISOString(),
  };
}

function calculateVolumeScore(consultations: number): number {
  // max 25 pts
  // 0 = 0pts, 5 = 5pts, 20 = 15pts, 50+ = 25pts
  if (consultations <= 0) return 0;
  if (consultations >= 50) return 25;
  return Math.round((consultations / 50) * 25);
}

function calculateRatingScore(rating: number): number {
  // max 25 pts (rating 0-5)
  if (rating <= 0) return 0;
  if (rating >= 5) return 25;
  return Math.round((rating / 5) * 25);
}

function calculateResponseTimeScore(minutes: number): number {
  // max 20 pts
  // < 5 min = 20pts, 5-15 min = 15pts, 15-30 min = 10pts, 30-60 min = 5pts, > 60 min = 0
  if (minutes <= 5) return 20;
  if (minutes <= 15) return 15;
  if (minutes <= 30) return 10;
  if (minutes <= 60) return 5;
  return 0;
}

function calculateCompletionScore(rate: number): number {
  // max 15 pts (rate 0-1)
  if (rate >= 0.95) return 15;
  if (rate >= 0.85) return 12;
  if (rate >= 0.75) return 8;
  if (rate >= 0.60) return 4;
  return 0;
}

function calculateLanguageScore(languageCount: number): number {
  // max 10 pts — bonus for SA multilingual capability
  // 1 language = 0pts, 2 = 2pts, 3 = 4pts, 5 = 7pts, 8+ = 10pts
  if (languageCount <= 1) return 0;
  if (languageCount >= 8) return 10;
  return Math.round((languageCount / 8) * 10);
}

function calculateSTGScore(adherenceRate: number): number {
  // max 5 pts — STG documentation adherence
  if (adherenceRate >= 0.9) return 5;
  if (adherenceRate >= 0.7) return 3;
  if (adherenceRate >= 0.5) return 1;
  return 0;
}

function determineTier(totalScore: number): IncentiveTier {
  for (const config of TIER_CONFIG.slice().reverse()) {
    if (totalScore >= config.minScore) return config.tier;
  }
  return 'BRONZE';
}

// ============================================================
// Database Integration
// ============================================================

/**
 * Fetch and compute the current score for a doctor
 */
export async function computeDoctorScore(doctorUserId: string): Promise<DoctorScore | null> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const doctor = await prisma.doctor.findUnique({
    where: { userId: doctorUserId },
    include: {
      user: true,
    },
  });

  if (!doctor) return null;

  // Consultation metrics this month
  const consultations = await prisma.consultation.findMany({
    where: {
      doctorId: doctorUserId,
      createdAt: { gte: monthStart },
    },
    select: {
      status: true,
      rating: true,
      responseTimeMinutes: true,
      structuredHistoryData: true,
    } as Record<string, unknown>,
  });

  const completed = consultations.filter((c) =>
    ['COMPLETED', 'CLOSED'].includes(c.status)
  );
  const totalConsultations = consultations.length;
  const completedCount = completed.length;

  const ratings = consultations
    .map((c) => (c as Record<string, unknown>).rating as number | null)
    .filter((r): r is number => typeof r === 'number' && r > 0);

  const avgRating = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
    : 3.0; // Default to 3.0 if no ratings yet

  const responseTimes = consultations
    .map((c) => (c as Record<string, unknown>).responseTimeMinutes as number | null)
    .filter((t): t is number => typeof t === 'number' && t > 0);

  const avgResponseTime = responseTimes.length > 0
    ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
    : 30; // Default 30 minutes if no data

  const completionRate = totalConsultations > 0
    ? completedCount / totalConsultations
    : 0;

  // STG adherence: % of completed consultations that have structuredHistoryData
  const withSTGData = completed.filter(
    (c) => !!(c as Record<string, unknown>).structuredHistoryData
  ).length;
  const stgAdherenceRate = completedCount > 0 ? withSTGData / completedCount : 0;

  // Language count from doctor's language array
  const languages = (doctor as Record<string, unknown>).languages as string[] ?? [];
  const languageCount = languages.length;

  const isAvailable = (doctor as Record<string, unknown>).isAvailable as boolean ?? false;

  return calculateDoctorScore({
    consultationsThisMonth: completedCount,
    averageRating: avgRating,
    avgResponseTimeMinutes: avgResponseTime,
    completionRate,
    languageCount,
    stgAdherenceRate,
    isAvailable,
    doctorUserId,
  });
}

/**
 * Get the incentive tier config for a given tier
 */
export function getTierConfig(tier: IncentiveTier): IncentiveTierConfig {
  return TIER_CONFIG.find((c) => c.tier === tier) ?? TIER_CONFIG[0];
}

/**
 * Get all tier configurations (for displaying tier benefits)
 */
export function getAllTierConfigs(): IncentiveTierConfig[] {
  return TIER_CONFIG;
}

// ============================================================
// Doctor Priority Queue
// ============================================================

/**
 * Score and sort a list of nearby doctors for patient consultation matching.
 * Combines proximity score with incentive score for optimal matching.
 */
export async function rankDoctorsForPatient(
  nearbyDoctors: NearbyDoctor[],
  patientLanguage?: string,
  urgency: 'ROUTINE' | 'URGENT' | 'EMERGENCY' = 'ROUTINE'
): Promise<ScoredDoctor[]> {
  if (nearbyDoctors.length === 0) return [];

  // Fetch scores for all doctors in parallel
  const scorePromises = nearbyDoctors.map((doc) => computeDoctorScore(doc.id));
  const scores = await Promise.all(scorePromises);

  const scoredDoctors: ScoredDoctor[] = nearbyDoctors.map((doc, idx) => {
    const score = scores[idx];
    const incentiveTier = score?.tier ?? 'BRONZE';
    const tierConfig = getTierConfig(incentiveTier);

    // Base priority: doctor's incentive score (0-100)
    let priorityScore = score?.totalScore ?? 30;

    // Add tier boost
    priorityScore += tierConfig.priorityBoost;

    // Availability: heavy penalty if not available
    if (!doc.isAvailable) priorityScore -= 50;

    // Proximity scoring: closer = better (inverse relationship)
    // 0km = +30pts, 5km = +20pts, 10km = +10pts, > 20km = 0pts
    const proximityBonus = Math.max(0, 30 - Math.round(doc.distanceKm * 2));
    priorityScore += proximityBonus;

    // Language match bonus: +15 if doctor speaks patient's language
    if (patientLanguage && doc.languages.includes(patientLanguage)) {
      priorityScore += 15;
    }

    // Urgency adjustments
    if (urgency === 'URGENT' || urgency === 'EMERGENCY') {
      // Available doctors get massive boost for urgent cases
      if (doc.isAvailable) priorityScore += 25;
      // Nearby doctors more important for emergencies
      if (doc.distanceKm <= 5) priorityScore += 15;
    }

    return {
      ...doc,
      priorityScore: Math.max(0, Math.round(priorityScore)),
      incentiveTier,
      responseTimeMinutes: score?.responseTimeMinutes,
      consultationsThisMonth: score?.consultationsThisMonth,
      averageRating: score?.averageRating ?? doc.rating,
    };
  });

  // Sort by priority score descending
  return scoredDoctors.sort((a, b) => b.priorityScore - a.priorityScore);
}

// ============================================================
// Incentive Actions / Events
// ============================================================

/**
 * Process an incentive action event and update doctor score
 * Called after specific events (consultation completed, rating received, etc.)
 */
export async function processIncentiveAction(
  action: Omit<IncentiveAction, 'timestamp'>
): Promise<{ success: boolean; newScore?: DoctorScore }> {
  console.info(`[Incentive] Processing action: ${action.actionType} for doctor ${action.doctorUserId}`);

  try {
    // Recompute score after the action
    const newScore = await computeDoctorScore(action.doctorUserId);

    // Log the action for analytics (using a generic JSON field or audit log)
    console.info(`[Incentive] Action processed. New score: ${newScore?.totalScore ?? 'N/A'}, Tier: ${newScore?.tier ?? 'N/A'}`);

    return { success: true, newScore: newScore ?? undefined };
  } catch (err) {
    console.error('[Incentive] Failed to process action:', err);
    return { success: false };
  }
}

/**
 * Get incentive action details for a given event type
 */
export function getIncentiveActionDetails(
  actionType: IncentiveAction['actionType'],
  doctorUserId: string,
  consultationId?: string
): IncentiveAction {
  const actionMap: Record<IncentiveAction['actionType'], { points: number; description: string }> = {
    CONSULTATION_COMPLETED: { points: 5, description: 'Consultation completed successfully' },
    HIGH_RATING_RECEIVED: { points: 10, description: 'Received a 5-star patient rating' },
    FAST_RESPONSE: { points: 5, description: 'Responded to consultation within 5 minutes' },
    STG_DOCUMENTED: { points: 3, description: 'Documented management against SA STG guidelines' },
    NEW_LANGUAGE_CONSULTATION: { points: 5, description: 'Conducted consultation in an additional SA language' },
    MONTHLY_BONUS: { points: 0, description: 'Monthly performance bonus calculated' },
    FIRST_CONSULTATION_BONUS: { points: 20, description: 'First consultation completed on MedAI' },
  };

  const details = actionMap[actionType];

  return {
    actionType,
    points: details.points,
    description: details.description,
    doctorUserId,
    consultationId,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================
// Analytics
// ============================================================

/**
 * Get a doctor's performance summary for their dashboard
 */
export async function getDoctorPerformanceSummary(doctorUserId: string): Promise<{
  currentScore: DoctorScore | null;
  tierConfig: IncentiveTierConfig | null;
  nextTierConfig: IncentiveTierConfig | null;
  pointsToNextTier: number | null;
  monthlyEarnings: { consultationFees: number; incentiveBonus: number; totalEstimated: number };
}> {
  const currentScore = await computeDoctorScore(doctorUserId);

  if (!currentScore) {
    return {
      currentScore: null,
      tierConfig: null,
      nextTierConfig: null,
      pointsToNextTier: null,
      monthlyEarnings: { consultationFees: 0, incentiveBonus: 0, totalEstimated: 0 },
    };
  }

  const tierConfig = getTierConfig(currentScore.tier);
  const tierIndex = TIER_CONFIG.findIndex((t) => t.tier === currentScore.tier);
  const nextTierConfig = tierIndex < TIER_CONFIG.length - 1 ? TIER_CONFIG[tierIndex + 1] : null;
  const pointsToNextTier = nextTierConfig ? nextTierConfig.minScore - currentScore.totalScore : null;

  // Estimate monthly earnings
  const doctor = await prisma.doctor.findUnique({
    where: { userId: doctorUserId },
    select: { consultationFee: true } as Record<string, unknown>,
  });

  const consultationFee = (doctor as Record<string, unknown>)?.consultationFee as number ?? 0;
  const consultationFees = currentScore.consultationsThisMonth * consultationFee;
  const incentiveBonus = tierConfig.monthlyConsultationBonus;

  return {
    currentScore,
    tierConfig,
    nextTierConfig,
    pointsToNextTier,
    monthlyEarnings: {
      consultationFees,
      incentiveBonus,
      totalEstimated: consultationFees + incentiveBonus,
    },
  };
}

/**
 * Get leaderboard of top-scoring doctors (anonymised for privacy)
 */
export async function getDoctorLeaderboard(limit = 10): Promise<Array<{
  rank: number;
  tier: IncentiveTier;
  score: number;
  consultationsThisMonth: number;
  averageRating: number;
  // No PII — doctor can see their own rank position
}>> {
  const doctors = await prisma.doctor.findMany({
    where: { hpcsaStatus: 'ACTIVE' },
    select: { userId: true } as Record<string, unknown>,
    take: 100, // Cap at 100 for performance
  });

  const scorePromises = (doctors as Array<{ userId: string }>).map((d) => computeDoctorScore(d.userId));
  const scores = await Promise.all(scorePromises);

  const validScores = scores
    .filter((s): s is DoctorScore => s !== null)
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, limit);

  return validScores.map((score, idx) => ({
    rank: idx + 1,
    tier: score.tier,
    score: score.totalScore,
    consultationsThisMonth: score.consultationsThisMonth,
    averageRating: Math.round(score.averageRating * 10) / 10,
  }));
}
