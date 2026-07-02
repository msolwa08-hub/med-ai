import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import formbody from '@fastify/formbody';
import { config } from './config.js';
import { prisma } from './lib/prisma.js';
import { authRoutes } from './routes/auth.js';
import { patientRoutes } from './routes/patients.js';
import { doctorRoutes } from './routes/doctors.js';
import { consultationRoutes } from './routes/consultations.js';
import { aiHistoryRoutes } from './routes/ai-history.js';
import { diagnosisRoutes } from './routes/diagnosis.js';
import { investigationRoutes } from './routes/investigations.js';
import { reviewRoutes } from './routes/reviews.js';
import { hpcsaRoutes } from './routes/hpcsa.js';
import { prescriptionRoutes } from './routes/prescriptions.js';
import { stgRoutes } from './routes/stg.js';
import { emergencyRoutes } from './routes/emergency.js';
import { labResultRoutes } from './routes/lab-results.js';
import { doctorSettingsRoutes } from './routes/doctor-settings.js';
import { betaRoutes } from './routes/beta.js';
import { documentsRoutes } from './routes/documents.js';
import { ultrasoundRoutes } from './routes/ultrasound.js';
import { ogHistoryRoutes } from './routes/og-history.js';
import { antenatalFollowUpRoutes } from './routes/antenatal-followup.js';
import { specialtyHistoryRoutes } from './routes/specialty-history.js';
import { clinicalReasoningRoutes } from './routes/clinical-reasoning.js';
import { profileSetupRoutes } from './routes/profile-setup.js';
import { notificationRoutes } from './routes/notifications.js';
import { uploadRoutes } from './routes/upload.js';
import { paymentRoutes } from './routes/payments.js';
import { managementDraftRoutes } from './routes/management-draft.js';
import { analysisRoutes } from './routes/analysis.js';

const fastify = Fastify({
  logger: {
    level: config.NODE_ENV === 'production' ? 'info' : 'debug',
    transport:
      config.NODE_ENV !== 'production'
        ? { target: 'pino-pretty' }
        : undefined,
  },
});

await fastify.register(cors, {
  origin: [
    config.FRONTEND_URL,
    /exp:\/\//,
    ...(config.NODE_ENV !== 'production' ? [/localhost/, /127\.0\.0\.1/] : []),
  ],
  credentials: true,
});

await fastify.register(helmet, { contentSecurityPolicy: false });
await fastify.register(jwt, { secret: config.JWT_SECRET });
await fastify.register(rateLimit, { max: 100, timeWindow: '1 minute' });
// PayFast ITN posts application/x-www-form-urlencoded
await fastify.register(formbody);

// Axios clients send Content-Type: application/json even on body-less POSTs;
// treat an empty JSON body as {} instead of rejecting with 400.
fastify.addContentTypeParser(
  'application/json',
  { parseAs: 'string' },
  (_req, body, done) => {
    if (body === '' || body === undefined) return done(null, {});
    try {
      done(null, JSON.parse(body as string));
    } catch (err) {
      done(err as Error, undefined);
    }
  }
);

await fastify.register(authRoutes);
await fastify.register(patientRoutes);
await fastify.register(doctorRoutes);
await fastify.register(consultationRoutes);
await fastify.register(aiHistoryRoutes);
await fastify.register(diagnosisRoutes);
await fastify.register(investigationRoutes);
await fastify.register(reviewRoutes);
await fastify.register(hpcsaRoutes);
await fastify.register(prescriptionRoutes);
await fastify.register(stgRoutes);
await fastify.register(emergencyRoutes);
await fastify.register(labResultRoutes);
await fastify.register(doctorSettingsRoutes);
await fastify.register(betaRoutes);
await fastify.register(documentsRoutes);
await fastify.register(ultrasoundRoutes);
await fastify.register(ogHistoryRoutes);
await fastify.register(antenatalFollowUpRoutes);
await fastify.register(specialtyHistoryRoutes);
await fastify.register(clinicalReasoningRoutes);
await fastify.register(profileSetupRoutes);
await fastify.register(notificationRoutes);
await fastify.register(uploadRoutes);
await fastify.register(paymentRoutes);
await fastify.register(managementDraftRoutes);
await fastify.register(analysisRoutes);

fastify.get('/health', async (_request, reply) => {
  const checks: Record<string, 'ok' | 'error'> = {};
  let overall = true;

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
    overall = false;
  }

  try {
    const { getRedisClient } = await import('./lib/redis.js');
    await getRedisClient().ping();
    checks.redis = 'ok';
  } catch {
    checks.redis = 'error';
  }

  return reply.status(overall ? 200 : 503).send({
    status: overall ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    version: process.env.npm_package_version ?? '0.0.0',
    checks,
  });
});

fastify.setNotFoundHandler((_request, reply) => {
  reply.status(404).send({ success: false, error: 'Route not found' });
});

fastify.setErrorHandler((error, _request, reply) => {
  fastify.log.error(error);
  const statusCode = error.statusCode ?? 500;
  const isServerError = statusCode >= 500;
  const errorMessage =
    isServerError && config.NODE_ENV === 'production'
      ? 'An internal error occurred. Please try again or contact support.'
      : (error.message ?? 'Internal server error');
  reply.status(statusCode).send({ success: false, error: errorMessage });
});

async function shutdown(signal: string): Promise<void> {
  fastify.log.info(`Received ${signal}. Shutting down gracefully...`);
  try {
    await fastify.close();
    await prisma.$disconnect();
    fastify.log.info('Server closed and Prisma disconnected.');
    process.exit(0);
  } catch (err) {
    fastify.log.error(err, 'Error during shutdown');
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

try {
  await prisma.$queryRaw`SELECT 1`;
  fastify.log.info('Database connection verified.');
} catch (err) {
  fastify.log.error(err, 'Database connectivity check failed — cannot start server');
  await prisma.$disconnect();
  process.exit(1);
}

try {
  await fastify.listen({ port: config.PORT, host: '0.0.0.0' });
} catch (err) {
  fastify.log.error(err);
  await prisma.$disconnect();
  process.exit(1);
}

export { fastify };
