/**
 * Standalone MedAI Beta server.
 *
 * Serves the beta history-taking API AND the built web app from a single
 * process — no database, JWT, or encryption keys required. Deploy this as
 * one service and you get one public URL.
 *
 * Required env:
 *   ANTHROPIC_API_KEY   — your Claude API key
 *   BETA_ACCESS_KEYS    — comma-separated list of valid access keys
 * Optional env:
 *   PORT                — defaults to 3000 (hosts usually set this)
 *   WEB_DIST_PATH       — path to built web app (defaults to apps/web/dist)
 */

process.env.BETA_SERVER = '1';

import './load-env.js'; // load .env before any config is read

import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import rateLimit from '@fastify/rate-limit';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { betaConfig } from './lib/beta-config.js';
import { betaRoutes } from './routes/beta.js';
import { cockpitRoutes } from './routes/cockpit.js';
import { toolsRoutes } from './routes/tools.js';

const fastify = Fastify({
  logger: {
    level: 'info',
    transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
  },
});

await fastify.register(cors, { origin: true, credentials: true });

await fastify.register(rateLimit, {
  max: 60,
  timeWindow: '1 minute',
});

// API routes
await fastify.register(betaRoutes);
await fastify.register(cockpitRoutes);
await fastify.register(toolsRoutes);

// Health check
fastify.get('/health', async () => ({ status: 'ok', service: 'medai-beta', timestamp: new Date().toISOString() }));

// ─────────────────────────────────────────────────────────
// Serve the built web app (SPA) from the same origin
// ─────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));

const webDist =
  betaConfig.WEB_DIST_PATH ||
  resolve(__dirname, '../../web/dist'); // src/ -> apps/api -> apps/web/dist

if (existsSync(webDist)) {
  await fastify.register(fastifyStatic, {
    root: webDist,
    prefix: '/',
  });

  // SPA fallback: any non-API route returns index.html
  fastify.setNotFoundHandler((request, reply) => {
    if (
      request.url.startsWith('/beta') ||
      request.url.startsWith('/cockpit') ||
      request.url.startsWith('/tools') ||
      request.url.startsWith('/health')
    ) {
      return reply.status(404).send({ success: false, error: 'Not found' });
    }
    return reply.sendFile('index.html');
  });
  fastify.log.info(`Serving web app from ${webDist}`);
} else {
  fastify.log.warn(`Web build not found at ${webDist} — API only. Run "npm run build:web" first.`);
}

// ─────────────────────────────────────────────────────────
// Start
// ─────────────────────────────────────────────────────────
try {
  await fastify.listen({ port: betaConfig.PORT, host: '0.0.0.0' });
  fastify.log.info(`MedAI Beta server listening on port ${betaConfig.PORT}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}

export { fastify };
