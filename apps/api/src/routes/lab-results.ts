import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import crypto from 'crypto';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/authenticate.js';
import { auditLog } from '../services/audit.service.js';
import { encryptField, decryptField, encryptJSON, decryptJSON } from '../lib/encryption.js';
import { config } from '../config.js';

// ============================================================
// Schemas
// ============================================================

const LinkLabAccountSchema = z.object({
  provider: z.enum(['LANCET', 'AMPATH', 'LAB24', 'PATHCARE', 'NHLS', 'OTHER']),
  providerPatientId: z.string().min(1).max(200),
  accessToken: z.string().max(2000).optional(),
});

const GetLabResultsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  provider: z.enum(['LANCET', 'AMPATH', 'LAB24', 'PATHCARE', 'NHLS', 'OTHER']).optional(),
  isAbnormal: z.enum(['true', 'false']).optional(),
});

// Webhook payload schema (provider-agnostic normalised format)
const LabWebhookSchema = z.object({
  providerPatientId: z.string().min(1),
  externalResultId: z.string().min(1),
  testName: z.string().min(1).max(500),
  collectedAt: z.string().datetime(),
  reportedAt: z.string().datetime().optional(),
  results: z.record(z.unknown()), // flexible JSON structure per provider
  isAbnormal: z.boolean().default(false),
  pdfUrl: z.string().url().optional(),
  hmacSignature: z.string().min(1),
});

// ============================================================
// Helpers
// ============================================================

/**
 * Validate HMAC-SHA256 signature from lab provider.
 * Signature is computed over the raw request body with a shared secret.
 */
function validateWebhookSignature(
  provider: string,
  rawBody: string,
  signature: string
): boolean {
  // In production each provider would have its own secret in env vars.
  // Fall back to a generic LAB_WEBHOOK_SECRET for now.
  const secretKey =
    process.env[`LAB_WEBHOOK_SECRET_${provider.toUpperCase()}`] ??
    process.env.LAB_WEBHOOK_SECRET ??
    '';

  if (!secretKey) {
    // If no secret configured, reject in production; allow in dev
    return config.NODE_ENV !== 'production';
  }

  const expected = crypto
    .createHmac('sha256', secretKey)
    .update(rawBody)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(expected, 'hex'),
    Buffer.from(signature, 'hex')
  );
}

// ============================================================
// Route plugin
// ============================================================

export async function labResultRoutes(fastify: FastifyInstance): Promise<void> {
  // ----------------------------------------------------------
  // GET /labs/accounts — Patient's linked lab accounts
  // ----------------------------------------------------------
  fastify.get(
    '/labs/accounts',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const userId = request.user!.sub;

        if (request.user!.role !== 'PATIENT') {
          return reply.status(403).send({
            success: false,
            error: 'Only patients can view lab accounts.',
            code: 'FORBIDDEN',
          });
        }

        const patient = await prisma.patient.findUnique({
          where: { userId },
          select: { id: true },
        });

        if (!patient) {
          return reply.status(404).send({
            success: false,
            error: 'Patient profile not found.',
            code: 'PATIENT_NOT_FOUND',
          });
        }

        const accounts = await prisma.patientLabAccount.findMany({
          where: { patientId: patient.id },
          select: {
            id: true,
            provider: true,
            providerPatientId: true,
            linkedAt: true,
            lastSyncAt: true,
            _count: { select: { labResults: true } },
          },
          orderBy: { linkedAt: 'desc' },
        });

        return reply.send({
          success: true,
          data: {
            accounts: accounts.map((a) => ({
              id: a.id,
              provider: a.provider,
              providerPatientId: a.providerPatientId,
              linkedAt: a.linkedAt,
              lastSyncAt: a.lastSyncAt,
              resultCount: a._count.labResults,
            })),
          },
        });
      } catch (err) {
        fastify.log.error(err, 'GET /labs/accounts error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );

  // ----------------------------------------------------------
  // POST /labs/accounts — Link a lab account
  // ----------------------------------------------------------
  fastify.post(
    '/labs/accounts',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const userId = request.user!.sub;

        if (request.user!.role !== 'PATIENT') {
          return reply.status(403).send({
            success: false,
            error: 'Only patients can link lab accounts.',
            code: 'FORBIDDEN',
          });
        }

        const parsed = LinkLabAccountSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            success: false,
            error: 'Validation failed',
            details: parsed.error.flatten(),
          });
        }

        const { provider, providerPatientId, accessToken } = parsed.data;

        const patient = await prisma.patient.findUnique({
          where: { userId },
          select: { id: true },
        });

        if (!patient) {
          return reply.status(404).send({
            success: false,
            error: 'Patient profile not found.',
            code: 'PATIENT_NOT_FOUND',
          });
        }

        // Check for duplicate
        const existing = await prisma.patientLabAccount.findUnique({
          where: { patientId_provider: { patientId: patient.id, provider } },
        });

        if (existing) {
          return reply.status(409).send({
            success: false,
            error: `A ${provider} lab account is already linked. Unlink it first before adding a new one.`,
            code: 'ACCOUNT_EXISTS',
          });
        }

        const encryptedAccessToken = accessToken
          ? encryptField(accessToken)
          : null;

        const account = await prisma.patientLabAccount.create({
          data: {
            patientId: patient.id,
            provider,
            providerPatientId,
            encryptedAccessToken,
          },
        });

        await auditLog({
          userId,
          action: 'LAB_ACCOUNT_LINKED',
          resource: 'PatientLabAccount',
          resourceId: account.id,
          metadata: { provider, patientId: patient.id },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        return reply.status(201).send({
          success: true,
          data: {
            accountId: account.id,
            provider: account.provider,
            providerPatientId: account.providerPatientId,
            linkedAt: account.linkedAt,
          },
          message: `${provider} lab account linked successfully.`,
        });
      } catch (err) {
        fastify.log.error(err, 'POST /labs/accounts error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );

  // ----------------------------------------------------------
  // DELETE /labs/accounts/:id — Unlink lab account
  // ----------------------------------------------------------
  fastify.delete(
    '/labs/accounts/:id',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const userId = request.user!.sub;
        const { id } = request.params as { id: string };

        if (request.user!.role !== 'PATIENT') {
          return reply.status(403).send({
            success: false,
            error: 'Only patients can unlink lab accounts.',
            code: 'FORBIDDEN',
          });
        }

        const patient = await prisma.patient.findUnique({
          where: { userId },
          select: { id: true },
        });

        if (!patient) {
          return reply.status(404).send({
            success: false,
            error: 'Patient profile not found.',
            code: 'PATIENT_NOT_FOUND',
          });
        }

        const account = await prisma.patientLabAccount.findUnique({
          where: { id },
          select: { id: true, patientId: true, provider: true },
        });

        if (!account) {
          return reply.status(404).send({
            success: false,
            error: 'Lab account not found.',
            code: 'NOT_FOUND',
          });
        }

        if (account.patientId !== patient.id) {
          return reply.status(403).send({
            success: false,
            error: 'You can only unlink your own lab accounts.',
            code: 'FORBIDDEN',
          });
        }

        await prisma.patientLabAccount.delete({ where: { id } });

        await auditLog({
          userId,
          action: 'LAB_ACCOUNT_UNLINKED',
          resource: 'PatientLabAccount',
          resourceId: id,
          metadata: { provider: account.provider, patientId: patient.id },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        return reply.send({
          success: true,
          message: `${account.provider} lab account unlinked. Associated results have been removed.`,
        });
      } catch (err) {
        fastify.log.error(err, 'DELETE /labs/accounts/:id error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );

  // ----------------------------------------------------------
  // POST /labs/sync — Trigger sync for all linked accounts
  // ----------------------------------------------------------
  fastify.post(
    '/labs/sync',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const userId = request.user!.sub;

        if (request.user!.role !== 'PATIENT') {
          return reply.status(403).send({
            success: false,
            error: 'Only patients can trigger lab syncs.',
            code: 'FORBIDDEN',
          });
        }

        const patient = await prisma.patient.findUnique({
          where: { userId },
          select: { id: true },
        });

        if (!patient) {
          return reply.status(404).send({
            success: false,
            error: 'Patient profile not found.',
            code: 'PATIENT_NOT_FOUND',
          });
        }

        const accounts = await prisma.patientLabAccount.findMany({
          where: { patientId: patient.id },
          select: {
            id: true,
            provider: true,
            providerPatientId: true,
            encryptedAccessToken: true,
          },
        });

        if (accounts.length === 0) {
          return reply.status(404).send({
            success: false,
            error: 'No lab accounts linked. Please link a lab account first.',
            code: 'NO_ACCOUNTS',
          });
        }

        // Update lastSyncAt timestamps — actual sync would happen via background job
        // or direct lab API calls in a production implementation.
        const now = new Date();
        await prisma.patientLabAccount.updateMany({
          where: { patientId: patient.id },
          data: { lastSyncAt: now },
        });

        await auditLog({
          userId,
          action: 'LAB_SYNC_TRIGGERED',
          resource: 'PatientLabAccount',
          metadata: {
            patientId: patient.id,
            accountCount: accounts.length,
            providers: accounts.map((a) => a.provider),
          },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        return reply.send({
          success: true,
          data: {
            accountsSynced: accounts.length,
            providers: accounts.map((a) => a.provider),
            syncedAt: now.toISOString(),
          },
          message: `Sync triggered for ${accounts.length} lab account(s). New results will appear shortly.`,
        });
      } catch (err) {
        fastify.log.error(err, 'POST /labs/sync error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );

  // ----------------------------------------------------------
  // GET /labs/results — Get all lab results for patient
  // ----------------------------------------------------------
  fastify.get(
    '/labs/results',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const userId = request.user!.sub;

        if (request.user!.role !== 'PATIENT') {
          return reply.status(403).send({
            success: false,
            error: 'Only patients can view their lab results.',
            code: 'FORBIDDEN',
          });
        }

        const queryParsed = GetLabResultsQuerySchema.safeParse(request.query);
        if (!queryParsed.success) {
          return reply.status(400).send({
            success: false,
            error: 'Invalid query parameters',
            details: queryParsed.error.flatten(),
          });
        }

        const { limit, offset, provider, isAbnormal } = queryParsed.data;

        const patient = await prisma.patient.findUnique({
          where: { userId },
          select: { id: true },
        });

        if (!patient) {
          return reply.status(404).send({
            success: false,
            error: 'Patient profile not found.',
            code: 'PATIENT_NOT_FOUND',
          });
        }

        const whereClause: Record<string, unknown> = { patientId: patient.id };
        if (provider) whereClause.provider = provider;
        if (isAbnormal !== undefined) whereClause.isAbnormal = isAbnormal === 'true';

        const [results, total] = await Promise.all([
          prisma.labResult.findMany({
            where: whereClause,
            orderBy: { collectedAt: 'desc' },
            take: limit,
            skip: offset,
            select: {
              id: true,
              provider: true,
              testName: true,
              collectedAt: true,
              reportedAt: true,
              isAbnormal: true,
              importedAt: true,
              encryptedResults: true,
              consultationId: true,
              labAccountId: true,
            },
          }),
          prisma.labResult.count({ where: whereClause }),
        ]);

        const decryptedResults = results.map((r) => {
          let parsedResults: unknown = null;
          try {
            parsedResults = decryptJSON(r.encryptedResults);
          } catch {
            parsedResults = null;
          }

          return {
            id: r.id,
            provider: r.provider,
            testName: r.testName,
            collectedAt: r.collectedAt,
            reportedAt: r.reportedAt,
            isAbnormal: r.isAbnormal,
            importedAt: r.importedAt,
            results: parsedResults,
            consultationId: r.consultationId,
            labAccountId: r.labAccountId,
          };
        });

        await auditLog({
          userId,
          action: 'LAB_RESULTS_VIEWED',
          resource: 'LabResult',
          metadata: { patientId: patient.id, count: results.length, total },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        return reply.send({
          success: true,
          data: {
            results: decryptedResults,
            total,
            limit,
            offset,
          },
        });
      } catch (err) {
        fastify.log.error(err, 'GET /labs/results error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );

  // ----------------------------------------------------------
  // GET /labs/results/consultation/:consultationId
  // ----------------------------------------------------------
  fastify.get(
    '/labs/results/consultation/:consultationId',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const userId = request.user!.sub;
        const role = request.user!.role;
        const { consultationId } = request.params as { consultationId: string };

        const consultation = await prisma.consultation.findUnique({
          where: { id: consultationId },
          select: {
            id: true,
            patientId: true,
            doctorId: true,
            patient: { select: { userId: true } },
          },
        });

        if (!consultation) {
          return reply.status(404).send({
            success: false,
            error: 'Consultation not found.',
            code: 'NOT_FOUND',
          });
        }

        // Access control
        if (role === 'PATIENT') {
          if (consultation.patient.userId !== userId) {
            return reply.status(403).send({
              success: false,
              error: 'Access denied.',
              code: 'FORBIDDEN',
            });
          }
        } else if (role === 'DOCTOR') {
          const doctor = await prisma.doctor.findUnique({
            where: { userId },
            select: { id: true },
          });
          if (!doctor || consultation.doctorId !== doctor.id) {
            return reply.status(403).send({
              success: false,
              error: 'Access denied.',
              code: 'FORBIDDEN',
            });
          }
        } else if (role !== 'ADMIN') {
          return reply.status(403).send({
            success: false,
            error: 'Access denied.',
            code: 'FORBIDDEN',
          });
        }

        const results = await prisma.labResult.findMany({
          where: { consultationId },
          orderBy: { collectedAt: 'desc' },
          select: {
            id: true,
            provider: true,
            testName: true,
            collectedAt: true,
            reportedAt: true,
            isAbnormal: true,
            importedAt: true,
            encryptedResults: true,
            labAccountId: true,
          },
        });

        const decryptedResults = results.map((r) => {
          let parsedResults: unknown = null;
          try {
            parsedResults = decryptJSON(r.encryptedResults);
          } catch {
            parsedResults = null;
          }

          return {
            id: r.id,
            provider: r.provider,
            testName: r.testName,
            collectedAt: r.collectedAt,
            reportedAt: r.reportedAt,
            isAbnormal: r.isAbnormal,
            importedAt: r.importedAt,
            results: parsedResults,
            labAccountId: r.labAccountId,
          };
        });

        return reply.send({
          success: true,
          data: {
            results: decryptedResults,
            consultationId,
            count: results.length,
          },
        });
      } catch (err) {
        fastify.log.error(err, 'GET /labs/results/consultation/:consultationId error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );

  // ----------------------------------------------------------
  // POST /labs/webhook/:provider — Labs push results (HMAC signed)
  // ----------------------------------------------------------
  fastify.post(
    '/labs/webhook/:provider',
    async (request, reply) => {
      try {
        const { provider } = request.params as { provider: string };

        const validProviders = ['LANCET', 'AMPATH', 'LAB24', 'PATHCARE', 'NHLS', 'OTHER'];
        const normalisedProvider = provider.toUpperCase();

        if (!validProviders.includes(normalisedProvider)) {
          return reply.status(400).send({
            success: false,
            error: `Unknown lab provider: ${provider}`,
            code: 'UNKNOWN_PROVIDER',
          });
        }

        // Validate HMAC signature before parsing body
        const rawBody = JSON.stringify(request.body);
        const parsed = LabWebhookSchema.safeParse(request.body);

        if (!parsed.success) {
          return reply.status(400).send({
            success: false,
            error: 'Invalid webhook payload',
            details: parsed.error.flatten(),
          });
        }

        const { hmacSignature, ...payload } = parsed.data;

        if (!validateWebhookSignature(normalisedProvider, rawBody, hmacSignature)) {
          fastify.log.warn({ provider: normalisedProvider }, 'Lab webhook HMAC validation failed');
          return reply.status(401).send({
            success: false,
            error: 'Invalid webhook signature.',
            code: 'INVALID_SIGNATURE',
          });
        }

        // Look up the lab account by provider + providerPatientId
        const labAccount = await prisma.patientLabAccount.findFirst({
          where: {
            provider: normalisedProvider as never,
            providerPatientId: payload.providerPatientId,
          },
          select: { id: true, patientId: true },
        });

        if (!labAccount) {
          // Not an error — this patient may not have linked this lab yet
          fastify.log.info(
            { provider: normalisedProvider, providerPatientId: payload.providerPatientId },
            'Lab webhook: no matching lab account found, ignoring.'
          );
          return reply.status(200).send({ success: true, message: 'Acknowledged' });
        }

        // Encrypt and store the result
        const encryptedResults = encryptJSON(payload.results);

        await prisma.labResult.upsert({
          where: {
            provider_externalResultId: {
              provider: normalisedProvider as never,
              externalResultId: payload.externalResultId,
            },
          },
          create: {
            patientId: labAccount.patientId,
            labAccountId: labAccount.id,
            provider: normalisedProvider as never,
            externalResultId: payload.externalResultId,
            testName: payload.testName,
            collectedAt: new Date(payload.collectedAt),
            reportedAt: payload.reportedAt ? new Date(payload.reportedAt) : null,
            encryptedResults,
            isAbnormal: payload.isAbnormal,
          },
          update: {
            testName: payload.testName,
            reportedAt: payload.reportedAt ? new Date(payload.reportedAt) : null,
            encryptedResults,
            isAbnormal: payload.isAbnormal,
          },
        });

        // Update last sync timestamp
        await prisma.patientLabAccount.update({
          where: { id: labAccount.id },
          data: { lastSyncAt: new Date() },
        });

        await auditLog({
          action: 'LAB_RESULT_RECEIVED',
          resource: 'LabResult',
          metadata: {
            provider: normalisedProvider,
            externalResultId: payload.externalResultId,
            patientId: labAccount.patientId,
            testName: payload.testName,
            isAbnormal: payload.isAbnormal,
          },
        });

        return reply.status(200).send({
          success: true,
          message: 'Result received and stored.',
        });
      } catch (err) {
        fastify.log.error(err, 'POST /labs/webhook/:provider error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );
}
