import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import { auditLog } from '../services/audit.service.js';
import { encryptField, decryptField } from '../lib/encryption.js';

// ============================================================
// Schemas
// ============================================================

const UpdateSettingsSchema = z.object({
  practiceMode: z.enum(['OPEN_LOOP', 'CLOSED_LOOP']).optional(),
  aiHistoryDepth: z.enum(['FOCUSED', 'STANDARD', 'COMPREHENSIVE']).optional(),
  cloudProvider: z.enum(['aws', 'azure', 'gcp']).nullable().optional(),
  cloudBucket: z.string().max(500).nullable().optional(),
  cloudRegion: z.string().max(100).nullable().optional(),
  cloudAccessKey: z.string().max(2000).nullable().optional(),
  cloudSecretKey: z.string().max(2000).nullable().optional(),
});

// ============================================================
// Route plugin
// ============================================================

export async function doctorSettingsRoutes(fastify: FastifyInstance): Promise<void> {
  // ----------------------------------------------------------
  // GET /doctor/settings — Get doctor's current settings
  // ----------------------------------------------------------
  fastify.get(
    '/doctor/settings',
    { preHandler: [authenticate, requireRole('DOCTOR')] },
    async (request, reply) => {
      try {
        const userId = request.user!.sub;

        const doctor = await prisma.doctor.findUnique({
          where: { userId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            practiceMode: false,
            settings: {
              select: {
                id: true,
                practiceMode: true,
                aiHistoryDepth: true,
                cloudProvider: true,
                cloudBucket: true,
                cloudRegion: true,
                cloudAccessKey: true, // stored encrypted
                updatedAt: true,
              },
            },
          },
        });

        if (!doctor) {
          return reply.status(404).send({
            success: false,
            error: 'Doctor profile not found.',
            code: 'DOCTOR_NOT_FOUND',
          });
        }

        let settings: Record<string, unknown> | null = null;

        if (doctor.settings) {
          const s = doctor.settings;

          // Decrypt access key — only return masked value (last 4 chars)
          let maskedAccessKey: string | null = null;
          if (s.cloudAccessKey) {
            try {
              const decrypted = decryptField(s.cloudAccessKey);
              maskedAccessKey = `***${decrypted.slice(-4)}`;
            } catch {
              maskedAccessKey = '***';
            }
          }

          settings = {
            id: s.id,
            practiceMode: s.practiceMode,
            aiHistoryDepth: s.aiHistoryDepth,
            cloudProvider: s.cloudProvider,
            cloudBucket: s.cloudBucket,
            cloudRegion: s.cloudRegion,
            cloudAccessKey: maskedAccessKey,
            // Never return cloudSecretKey even masked
            updatedAt: s.updatedAt,
          };
        } else {
          // Return sensible defaults when no settings record exists yet
          settings = {
            practiceMode: 'OPEN_LOOP',
            aiHistoryDepth: 'STANDARD',
            cloudProvider: null,
            cloudBucket: null,
            cloudRegion: null,
            cloudAccessKey: null,
            updatedAt: null,
          };
        }

        return reply.send({
          success: true,
          data: { settings },
        });
      } catch (err) {
        fastify.log.error(err, 'GET /doctor/settings error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );

  // ----------------------------------------------------------
  // PUT /doctor/settings — Update practice mode and cloud settings
  // ----------------------------------------------------------
  fastify.put(
    '/doctor/settings',
    { preHandler: [authenticate, requireRole('DOCTOR')] },
    async (request, reply) => {
      try {
        const userId = request.user!.sub;

        const parsed = UpdateSettingsSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            success: false,
            error: 'Validation failed',
            details: parsed.error.flatten(),
          });
        }

        const data = parsed.data;

        // Validate: CLOSED_LOOP requires cloud credentials
        if (data.practiceMode === 'CLOSED_LOOP') {
          if (!data.cloudProvider || !data.cloudBucket || !data.cloudRegion) {
            return reply.status(400).send({
              success: false,
              error: 'CLOSED_LOOP practice mode requires cloudProvider, cloudBucket, and cloudRegion.',
              code: 'MISSING_CLOUD_CONFIG',
            });
          }
        }

        const doctor = await prisma.doctor.findUnique({
          where: { userId },
          select: { id: true },
        });

        if (!doctor) {
          return reply.status(404).send({
            success: false,
            error: 'Doctor profile not found.',
            code: 'DOCTOR_NOT_FOUND',
          });
        }

        const updateData: Record<string, unknown> = {};

        if (data.practiceMode !== undefined) {
          updateData.practiceMode = data.practiceMode;
        }
        if (data.aiHistoryDepth !== undefined) {
          updateData.aiHistoryDepth = data.aiHistoryDepth;
        }
        if (data.cloudProvider !== undefined) {
          updateData.cloudProvider = data.cloudProvider;
        }
        if (data.cloudBucket !== undefined) {
          updateData.cloudBucket = data.cloudBucket;
        }
        if (data.cloudRegion !== undefined) {
          updateData.cloudRegion = data.cloudRegion;
        }
        if (data.cloudAccessKey !== undefined) {
          updateData.cloudAccessKey = data.cloudAccessKey
            ? encryptField(data.cloudAccessKey)
            : null;
        }
        if (data.cloudSecretKey !== undefined) {
          updateData.cloudSecretKey = data.cloudSecretKey
            ? encryptField(data.cloudSecretKey)
            : null;
        }

        const settings = await prisma.doctorSettings.upsert({
          where: { doctorId: doctor.id },
          create: {
            doctorId: doctor.id,
            ...updateData,
          },
          update: updateData,
        });

        await auditLog({
          userId,
          action: 'DOCTOR_SETTINGS_UPDATED',
          resource: 'DoctorSettings',
          resourceId: settings.id,
          metadata: {
            doctorId: doctor.id,
            practiceMode: settings.practiceMode,
            fieldsUpdated: Object.keys(updateData).filter(
              (k) => k !== 'cloudAccessKey' && k !== 'cloudSecretKey'
            ),
          },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        return reply.send({
          success: true,
          data: {
            settingsId: settings.id,
            practiceMode: settings.practiceMode,
            updatedAt: settings.updatedAt,
          },
          aiHistoryDepth: settings.aiHistoryDepth,
          message: `Settings saved successfully.`,
        });
      } catch (err) {
        fastify.log.error(err, 'PUT /doctor/settings error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );

  // ----------------------------------------------------------
  // GET /doctor/incentive — Get doctor's incentive score and tier
  // ----------------------------------------------------------
  fastify.get(
    '/doctor/incentive',
    { preHandler: [authenticate, requireRole('DOCTOR')] },
    async (request, reply) => {
      try {
        const userId = request.user!.sub;

        const doctor = await prisma.doctor.findUnique({
          where: { userId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            rating: true,
            totalReviews: true,
            incentiveScore: true,
          },
        });

        if (!doctor) {
          return reply.status(404).send({
            success: false,
            error: 'Doctor profile not found.',
            code: 'DOCTOR_NOT_FOUND',
          });
        }

        // Calculate tier based on total points
        const score = doctor.incentiveScore;
        const totalPoints = score?.totalPoints ?? 0;

        type IncentiveTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

        const tier: IncentiveTier =
          totalPoints >= 1000
            ? 'PLATINUM'
            : totalPoints >= 500
            ? 'GOLD'
            : totalPoints >= 200
            ? 'SILVER'
            : 'BRONZE';

        const tierThresholds: Record<IncentiveTier, number> = {
          BRONZE: 200,
          SILVER: 500,
          GOLD: 1000,
          PLATINUM: Infinity,
        };

        const nextTier: Record<IncentiveTier, IncentiveTier | null> = {
          BRONZE: 'SILVER',
          SILVER: 'GOLD',
          GOLD: 'PLATINUM',
          PLATINUM: null,
        };

        const pointsToNextTier =
          tier === 'PLATINUM' ? null : tierThresholds[tier] - totalPoints;

        return reply.send({
          success: true,
          data: {
            doctorId: doctor.id,
            name: `Dr ${doctor.firstName} ${doctor.lastName}`,
            score: {
              totalPoints,
              completionRate: score?.completionRate ?? 0,
              streakDays: score?.streakDays ?? 0,
              priorityBoost: score?.priorityBoost ?? 1.0,
              lastCalculated: score?.lastCalculated ?? null,
            },
            tier,
            nextTier: nextTier[tier],
            pointsToNextTier,
            rating: doctor.rating,
            totalReviews: doctor.totalReviews,
            benefits: getTierBenefits(tier),
          },
        });
      } catch (err) {
        fastify.log.error(err, 'GET /doctor/incentive error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );

  // ----------------------------------------------------------
  // GET /doctor/incentive/leaderboard — Anonymized top doctors
  // ----------------------------------------------------------
  fastify.get(
    '/doctor/incentive/leaderboard',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        // Top 20 doctors by incentive points
        const scores = await prisma.doctorIncentiveScore.findMany({
          orderBy: { totalPoints: 'desc' },
          take: 20,
          include: {
            doctor: {
              select: {
                firstName: true,
                doctorType: true,
                specialization: true,
                currentLat: true,
                currentLng: true,
                rating: true,
                totalReviews: true,
              },
            },
          },
        });

        const leaderboard = scores.map((s, index) => {
          const doc = s.doctor;

          // Anonymize: first name only
          // In a full implementation, city would be resolved from lat/lng
          const anonymizedCity = doc.currentLat !== null ? 'South Africa' : 'Remote';

          const totalPoints = s.totalPoints;
          const tier =
            totalPoints >= 1000
              ? 'PLATINUM'
              : totalPoints >= 500
              ? 'GOLD'
              : totalPoints >= 200
              ? 'SILVER'
              : 'BRONZE';

          return {
            rank: index + 1,
            name: `Dr ${doc.firstName}`,
            city: anonymizedCity,
            doctorType: doc.doctorType,
            specialization: doc.specialization,
            totalPoints: s.totalPoints,
            completionRate: s.completionRate,
            streakDays: s.streakDays,
            tier,
            rating: doc.rating,
            totalReviews: doc.totalReviews,
          };
        });

        return reply.send({
          success: true,
          data: {
            leaderboard,
            total: leaderboard.length,
          },
        });
      } catch (err) {
        fastify.log.error(err, 'GET /doctor/incentive/leaderboard error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );
}

// ============================================================
// Helpers
// ============================================================

function getTierBenefits(tier: string): string[] {
  const benefits: Record<string, string[]> = {
    BRONZE: [
      'Appear in patient search results',
      'Basic analytics dashboard',
    ],
    SILVER: [
      'Priority listing in patient search',
      'Basic analytics dashboard',
      'Monthly performance report',
    ],
    GOLD: [
      'Top-10 priority listing in patient search',
      'Advanced analytics dashboard',
      'Monthly performance report',
      'Reduced MedAI platform commission (2%)',
      'MedAI Gold badge on profile',
    ],
    PLATINUM: [
      'Top-3 priority listing in patient search',
      'Full analytics & insights suite',
      'Dedicated account manager',
      'Reduced MedAI platform commission (0%)',
      'MedAI Platinum badge on profile',
      'Early access to new MedAI features',
      'Annual recognition award eligibility',
    ],
  };

  return benefits[tier] ?? benefits.BRONZE;
}
