import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import formbody from '@fastify/formbody';
import multipart from '@fastify/multipart';
import { betaRoutes } from './routes/beta.js';
import { cockpitRoutes } from './routes/cockpit.js';
import { toolsRoutes } from './routes/tools.js';
import { betaConfig } from './lib/beta-config.js';

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

  // Health check
  app.get('/health', async () => ({ status: 'ok', env: betaConfig.NODE_ENV }));

  // API routes
  await app.register(betaRoutes);
  await app.register(cockpitRoutes);
  await app.register(toolsRoutes);

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

    // SPA fallback — serve index.html for all non-API routes. API routes live
    // under /beta/*, /tools/*, /cockpit/* — but the bare /tools (etc.) paths
    // are SPA pages the runbook hands out, so only exclude the deeper paths.
    app.setNotFoundHandler(async (req, reply) => {
      const url = req.url.split('?')[0];
      if (url.startsWith('/beta/') || url.startsWith('/tools/') || url.startsWith('/cockpit/') || url === '/health') {
        return reply.status(404).send({ error: 'Not found' });
      }
      return reply.sendFile('index.html');
    });
  }

  return app;
}
