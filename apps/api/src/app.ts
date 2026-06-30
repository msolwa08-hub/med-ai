import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { betaRoutes } from './routes/beta.js';
import { cockpitRoutes } from './routes/cockpit.js';
import { toolsRoutes } from './routes/tools.js';
import { betaConfig } from './lib/beta-config.js';

export async function buildApp(opts: { serveStatic?: boolean } = {}) {
  const app = Fastify({
    logger: {
      level: betaConfig.NODE_ENV === 'production' ? 'info' : 'debug',
    },
  });

  await app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

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

    // SPA fallback — serve index.html for all non-API routes
    app.setNotFoundHandler(async (req, reply) => {
      if (req.url.startsWith('/beta') || req.url.startsWith('/tools') || req.url.startsWith('/cockpit') || req.url.startsWith('/health')) {
        return reply.status(404).send({ error: 'Not found' });
      }
      return reply.sendFile('index.html');
    });
  }

  return app;
}
