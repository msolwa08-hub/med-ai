/**
 * Vercel serverless entry for the MedAI beta API.
 *
 * Vercel maps every request under /api/* to this catch-all function. The web
 * app calls /beta/*, /cockpit/*, /tools/* and /health; vercel.json rewrites
 * those to /api/<same-path>, so here we strip the leading "/api" and emit the
 * request into the shared Fastify app (built once, reused across invocations).
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../apps/api/src/app.js';

let appPromise: Promise<FastifyInstance> | null = null;

function getApp(): Promise<FastifyInstance> {
  if (!appPromise) {
    appPromise = buildApp({ serveStatic: false, logger: false }).then(async (app) => {
      await app.ready();
      return app;
    });
  }
  return appPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  // Strip the Vercel "/api" mount prefix so Fastify sees /beta, /cockpit, etc.
  if (req.url) {
    req.url = req.url.replace(/^\/api(?=\/|\?|$)/, '') || '/';
  }
  const app = await getApp();
  app.server.emit('request', req, res);
}
