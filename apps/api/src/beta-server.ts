/**
 * Standalone MedAI Beta server.
 *
 * Serves the beta history-taking API AND the built web app from a single
 * long-running process — no database, JWT, or encryption keys required. Deploy
 * this as one service (Render/Docker/local) and you get one public URL.
 *
 * For a serverless (Vercel) deploy, the same app is built by api/[...path].ts
 * via the shared buildApp() factory — see app.ts.
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

import { buildApp } from './app.js';
import { betaConfig } from './lib/beta-config.js';

const app = await buildApp({ serveStatic: true });

try {
  await app.listen({ port: betaConfig.PORT, host: '0.0.0.0' });
  app.log.info(`MedAI Beta server listening on port ${betaConfig.PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

export { app as fastify };
