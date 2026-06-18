import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { config } from './config.js';
import prisma from './lib/prisma.js';
import { redis } from './lib/redis.js';

// ─────────────────────────────────────────────────────────
// Bootstrap
// ─────────────────────────────────────────────────────────

const fastify = Fastify({
  logger:
    config.NODE_ENV === 'production'
      ? true
      : {
          transport: {
            target: 'pino-pretty',
            options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' },
          },
        },
});

// ─────────────────────────────────────────────────────────
// Plugins
// ─────────────────────────────────────────────────────────

await fastify.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
    },
  },
});

await fastify.register(cors, {
  origin: config.NODE_ENV === 'production' ? config.FRONTEND_URL : true,
  credentials: true,
});

await fastify.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
  errorResponseBuilder: () => ({
    statusCode: 429,
    error: 'Too Many Requests',
    message: 'You have exceeded the request rate limit. Please wait before retrying.',
  }),
});

await fastify.register(jwt, {
  secret: config.JWT_SECRET,
});

// ─────────────────────────────────────────────────────────
// Health check (no auth required)
// ─────────────────────────────────────────────────────────

fastify.get('/health', async () => {
  let dbStatus = 'ok';
  let redisStatus = 'ok';

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'error';
  }

  try {
    await redis.ping();
  } catch {
    redisStatus = 'error';
  }

  return {
    status: dbStatus === 'ok' && redisStatus === 'ok' ? 'healthy' : 'degraded',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    services: { database: dbStatus, redis: redisStatus },
  };
});

// ─────────────────────────────────────────────────────────
// Routes (registered with prefix)
// ─────────────────────────────────────────────────────────

// Dynamic imports to avoid circular deps at startup — routes are loaded lazily
const { authRoutes } = await import('./routes/auth.js');
fastify.register(authRoutes);

// Register remaining routes only if the files exist (agents may be building them)
async function tryRegisterRoute(
  path: string,
  prefix?: string
): Promise<void> {
  try {
    const mod = await import(path);
    const handler = Object.values(mod)[0] as (fastify: typeof fastify) => Promise<void>;
    if (typeof handler === 'function') {
      if (prefix) {
        fastify.register(handler, { prefix });
      } else {
        fastify.register(handler);
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!message.includes('Cannot find module')) {
      fastify.log.error({ err }, `Failed to load route ${path}`);
    }
  }
}

await tryRegisterRoute('./routes/patients.js');
await tryRegisterRoute('./routes/doctors.js');
await tryRegisterRoute('./routes/consultations.js');
await tryRegisterRoute('./routes/ai-history.js');
await tryRegisterRoute('./routes/diagnosis.js');
await tryRegisterRoute('./routes/investigations.js');
await tryRegisterRoute('./routes/reviews.js');
await tryRegisterRoute('./routes/hpcsa.js');

// ─────────────────────────────────────────────────────────
// Global error handler
// ─────────────────────────────────────────────────────────

fastify.setErrorHandler((error, _request, reply) => {
  fastify.log.error(error);

  if (error.statusCode === 429) {
    return reply.status(429).send({
      statusCode: 429,
      error: 'Too Many Requests',
      message: error.message,
    });
  }

  if (error.validation) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Validation Error',
      message: 'Invalid request data',
      details: error.validation,
    });
  }

  const statusCode = error.statusCode ?? 500;
  return reply.status(statusCode).send({
    statusCode,
    error: error.name || 'Internal Server Error',
    message:
      config.NODE_ENV === 'production' && statusCode === 500
        ? 'An unexpected error occurred'
        : error.message,
  });
});

fastify.setNotFoundHandler((_request, reply) => {
  reply.status(404).send({
    statusCode: 404,
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
  });
});

// ─────────────────────────────────────────────────────────
// Graceful shutdown
// ─────────────────────────────────────────────────────────

async function shutdown(signal: string): Promise<void> {
  fastify.log.info(`Received ${signal}, starting graceful shutdown...`);

  try {
    await fastify.close();
    await prisma.$disconnect();
    await redis.quit();
    fastify.log.info('Graceful shutdown complete');
    process.exit(0);
  } catch (err) {
    fastify.log.error(err, 'Error during shutdown');
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ─────────────────────────────────────────────────────────
// Start server
// ─────────────────────────────────────────────────────────

try {
  await fastify.listen({ port: config.PORT, host: '0.0.0.0' });
  fastify.log.info(`MedAI API running on port ${config.PORT}`);
  fastify.log.info(`Environment: ${config.NODE_ENV}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
