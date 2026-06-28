/**
 * Shared Fastify app factory for the MedAI beta.
 *
 * Builds the configured app (CORS, rate limiting, all beta routes, health
 * check) WITHOUT calling listen, so it can be used two ways:
 *
 *   • beta-server.ts  — wraps it with .listen() for the standalone long-running
 *     server (local dev, Render, Docker), and serves the built web app too.
 *
 *   • api/[...path].ts — emits requests into it from a Vercel serverless
 *     function (web app served separately by Vercel's static CDN).
 */

import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { betaRoutes } from './routes/beta.js';
import { cockpitRoutes } from './routes/cockpit.js';
import { toolsRoutes } from './routes/tools.js';

export interface BuildAppOptions {
  /** Serve the built web app (SPA) from this process. Default false. */
  serveStatic?: boolean;
  /** Enable the pino logger. Default true. */
  logger?: boolean;
}

export async function buildApp(opts: BuildAppOptions = {}): Promise<FastifyInstance> {
  const { serveStatic = false, logger = true } = opts;

  const app = Fastify({
    logger: logger
      ? {
          level: 'info',
          transport:
            process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
        }
      : false,
  });

  await app.register(cors, { origin: true, credentials: true });
  await app.register(rateLimit, { max: 60, timeWindow: '1 minute' });

  // API routes
  await app.register(betaRoutes);
  await app.register(cockpitRoutes);
  await app.register(toolsRoutes);

  // Health check
  app.get('/health', async () => ({
    status: 'ok',
    service: 'medai-beta',
    timestamp: new Date().toISOString(),
  }));

  if (serveStatic) {
    await registerStatic(app);
  }

  return app;
}

// Serve the built web app (SPA) from the same origin. Only used by the
// standalone server — on Vercel the static assets are served by the CDN.
async function registerStatic(app: FastifyInstance): Promise<void> {
  const { default: fastifyStatic } = await import('@fastify/static');
  const { fileURLToPath } = await import('node:url');
  const { dirname, resolve } = await import('node:path');
  const { existsSync } = await import('node:fs');
  const { betaConfig } = await import('./lib/beta-config.js');

  const here = dirname(fileURLToPath(import.meta.url));
  const webDist = betaConfig.WEB_DIST_PATH || resolve(here, '../../web/dist');

  if (!existsSync(webDist)) {
    app.log.warn(`Web build not found at ${webDist} — API only. Run "npm run build:web" first.`);
    return;
  }

  await app.register(fastifyStatic, { root: webDist, prefix: '/' });

  // SPA fallback: any non-API route returns index.html. We match API prefixes
  // with a trailing slash so bare SPA routes like /tools and /doctor still load
  // the app on a hard refresh (the API endpoints all live under /tools/, etc).
  app.setNotFoundHandler((request, reply) => {
    const url = request.url.split('?')[0];
    if (
      url.startsWith('/beta/') ||
      url.startsWith('/cockpit/') ||
      url.startsWith('/tools/') ||
      url === '/health'
    ) {
      return reply.status(404).send({ success: false, error: 'Not found' });
    }
    return reply.sendFile('index.html');
  });

  app.log.info(`Serving web app from ${webDist}`);
}
