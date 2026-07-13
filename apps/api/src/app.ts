import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import formbody from '@fastify/formbody';
import multipart from '@fastify/multipart';
import { betaRoutes } from './routes/beta.js';
import { cockpitRoutes } from './routes/cockpit.js';
import { toolsRoutes } from './routes/tools.js';
import { betaConfig } from './lib/beta-config.js';
import { betaDbEnabled } from './lib/beta-db.js';
import { protocolStore } from './services/protocol-store.js';
import { missingMarketplaceEnv, registerMarketplace } from './marketplace.js';

// URL prefixes owned by the API (never the SPA). Marketplace prefixes are
// always excluded from the SPA fallback — when the marketplace is disabled a
// call to them should read as a JSON 404, not an index.html.
const API_PREFIXES = [
  '/beta/',
  '/tools/',
  '/cockpit/',
  '/auth/',
  '/patients',
  '/doctors',
  '/consultations',
  '/ai-history',
  '/og-history',
  '/antenatal-followup',
  '/specialty-history',
  '/notifications',
];

export async function buildApp(opts: { serveStatic?: boolean } = {}) {
  const app = Fastify({
    logger: {
      level: betaConfig.NODE_ENV === 'production' ? 'info' : 'debug',
    },
    // Photo scans of handwritten notes arrive as base64 JSON (~33% overhead
    // on a downscaled JPEG); the default 1 MiB limit is too small for them.
    bodyLimit: 12 * 1024 * 1024,
  });

  await app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // PayFast ITN posts application/x-www-form-urlencoded
  await app.register(formbody);

  // Hospital protocol document uploads (PDF/text)
  await app.register(multipart, {
    limits: { fileSize: 15 * 1024 * 1024 },
  });

  // Axios clients send Content-Type: application/json even on body-less POSTs;
  // treat an empty JSON body as {} instead of rejecting with 400.
  app.addContentTypeParser(
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

  // Health check — includes the deployed git sha (Render injects
  // RENDER_GIT_COMMIT) so a stale deploy is visible in one glance, from a
  // phone, without guessing.
  app.get('/health', async () => ({
    status: 'ok',
    env: betaConfig.NODE_ENV,
    sha: (process.env.RENDER_GIT_COMMIT ?? '').slice(0, 7) || 'dev',
  }));

  // A clinical tool must never dead-end a request on an unexpected throw. Any
  // error that escapes a route handler becomes a clean JSON 500 (or the error's
  // own status) — logged, but never a bare socket hang-up the client can't
  // parse. The AI engines already degrade internally (tryExtractJSON); this is
  // the backstop for everything else (network blips to Anthropic, DB hiccups).
  app.setErrorHandler((error, req, reply) => {
    req.log.error({ err: error, url: req.url }, 'request handler error');
    const statusCode = error.statusCode ?? 500;
    const clientMessage =
      statusCode >= 500 && betaConfig.NODE_ENV === 'production'
        ? 'A server error occurred — your work is preserved locally; please retry.'
        : (error.message ?? 'Internal server error');
    reply.status(statusCode).send({ error: clientMessage });
  });

  // Durable state: rehydrate facility protocols from the database (no-op on
  // database-less deploys — the store simply starts empty, as before).
  if (betaDbEnabled()) {
    app.log.info('DATABASE_URL configured — durable persistence enabled (sessions + protocols)');
    await protocolStore.init();
  } else {
    app.log.info('No DATABASE_URL — running memory-only (client replay/localStorage remain the fallback)');
  }

  // API routes
  await app.register(betaRoutes);
  await app.register(cockpitRoutes);
  await app.register(toolsRoutes);

  // Dispatch/geolocation marketplace ("nearby doctors, first-to-accept").
  // Fully built against Prisma + JWT; only mounted when its environment is
  // complete, and imported dynamically so a beta-only deploy never loads the
  // full API's config stack (which hard-requires these variables at import).
  const missingEnv = missingMarketplaceEnv();
  if (missingEnv.length === 0) {
    await registerMarketplace(app);
    app.log.info('Marketplace ENABLED — auth/patients/doctors/consultations/history/notifications routes mounted');
  } else {
    app.log.info(
      { missing: missingEnv },
      'Marketplace disabled — set DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET and ENCRYPTION_KEY to enable dispatch'
    );
  }

  // Serve web app static files
  if (opts.serveStatic) {
    const { fileURLToPath } = await import('url');
    const { dirname, resolve } = await import('path');
    const fastifyStatic = await import('@fastify/static');

    const __dirname = dirname(fileURLToPath(import.meta.url));
    const distPath = resolve(__dirname, '../../web/dist');

    await app.register(fastifyStatic.default, {
      root: distPath,
      prefix: '/',
    });

    // SPA fallback — serve index.html for all non-API routes. The bare /tools
    // (etc.) paths are SPA pages the runbook hands out, so /beta//tools//cockpit
    // only exclude their deeper paths; marketplace prefixes are excluded whole.
    app.setNotFoundHandler(async (req, reply) => {
      const url = req.url.split('?')[0];
      if (url === '/health' || API_PREFIXES.some(p => url.startsWith(p))) {
        return reply.status(404).send({ error: 'Not found' });
      }
      return reply.sendFile('index.html');
    });
  }

  return app;
}
