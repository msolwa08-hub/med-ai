import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { betaConfig } from '../lib/beta-config.js';
import {
  createSession,
  getSession,
  startHistory,
  sendMessage,
  ensureSummary,
  trackError,
  getAnalytics,
} from '../services/beta-engine.js';

const ValidateSchema = z.object({
  accessKey: z.string().min(1),
});

const StartSchema = z.object({
  accessKey: z.string().min(1),
});

const MessageSchema = z.object({
  sessionId: z.string().uuid(),
  message: z.string().min(1).max(2000),
});

function isValidKey(key: string): boolean {
  const keys = (betaConfig.BETA_ACCESS_KEYS ?? '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
  return keys.includes(key);
}

function isDocKey(key: string): boolean {
  const keys = (betaConfig.BETA_DOCTOR_KEYS ?? '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
  return keys.includes(key);
}

export async function betaRoutes(fastify: FastifyInstance): Promise<void> {
  // POST /beta/validate
  fastify.post('/beta/validate', async (request, reply) => {
    const parsed = ValidateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ success: false, error: 'accessKey is required' });
    }
    const valid = isValidKey(parsed.data.accessKey);
    return reply.send({ success: true, data: { valid } });
  });

  // POST /beta/session/start
  fastify.post('/beta/session/start', async (request, reply) => {
    const parsed = StartSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ success: false, error: 'accessKey is required' });
    }

    const { accessKey } = parsed.data;

    if (!isValidKey(accessKey)) {
      return reply.status(401).send({ success: false, error: 'Invalid access key' });
    }

    const sessionId = await createSession(accessKey);

    try {
      const message = await startHistory(sessionId);
      return reply.send({ success: true, data: { sessionId, message } });
    } catch (err) {
      fastify.log.error(err, 'beta/session/start: failed to start history');
      trackError('start_history_failed', err instanceof Error ? err.message : String(err));
      return reply.status(500).send({ success: false, error: 'Failed to start session' });
    }
  });

  // POST /beta/session/message
  fastify.post('/beta/session/message', async (request, reply) => {
    const parsed = MessageSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: 'Validation failed',
        details: parsed.error.flatten(),
      });
    }

    const { sessionId, message } = parsed.data;
    const session = await getSession(sessionId);

    if (!session) {
      return reply.status(404).send({ success: false, error: 'Session not found or expired' });
    }

    if (session.isComplete) {
      return reply.status(400).send({ success: false, error: 'Session already complete' });
    }

    try {
      const result = await sendMessage(sessionId, message);
      return reply.send({ success: true, data: result });
    } catch (err) {
      fastify.log.error(err, 'beta/session/message: failed');
      trackError('send_message_failed', err instanceof Error ? err.message : String(err));
      return reply.status(500).send({ success: false, error: 'Failed to get AI response' });
    }
  });

  // GET /beta/session/:sessionId/status
  fastify.get('/beta/session/:sessionId/status', async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string };
    const session = await getSession(sessionId);

    if (!session) {
      return reply.send({ success: true, data: { isValid: false, isComplete: false } });
    }

    return reply.send({
      success: true,
      data: { isValid: true, isComplete: session.isComplete },
    });
  });

  // GET /beta/session/:sessionId/summary
  fastify.get('/beta/session/:sessionId/summary', async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string };
    const session = await getSession(sessionId);

    if (!session) {
      return reply.status(404).send({ success: false, error: 'Session not found or expired' });
    }

    if (!session.isComplete) {
      return reply.status(400).send({ success: false, error: 'History not yet complete' });
    }

    // Generate the summary on first request (serverless-safe); subsequent polls
    // return the persisted value. May take a few seconds the very first time.
    try {
      const summary = await ensureSummary(sessionId);
      return reply.send({ success: true, data: { summary } });
    } catch (err) {
      fastify.log.error(err, 'beta/session/summary: generation failed');
      trackError('summary_failed', err instanceof Error ? err.message : String(err));
      return reply.status(500).send({ success: false, error: 'Failed to generate summary' });
    }
  });

  // GET /beta/analytics?key=DOCTOR_KEY
  fastify.get('/beta/analytics', async (request, reply) => {
    const { key } = request.query as { key?: string };
    if (!key || !isDocKey(key)) {
      return reply.status(401).send({ success: false, error: 'Valid doctor key required' });
    }
    return reply.send({ success: true, data: await getAnalytics() });
  });

  // GET /beta/config — public, returns practice branding for the web app
  fastify.get('/beta/config', async (_request, reply) => {
    return reply.send({
      success: true,
      data: {
        practiceName: betaConfig.BETA_PRACTICE_NAME,
        doctorName: betaConfig.BETA_DOCTOR_NAME,
      },
    });
  });
}
