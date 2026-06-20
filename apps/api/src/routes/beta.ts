import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { betaConfig } from '../lib/beta-config.js';
import {
  createSession,
  getSession,
  startHistory,
  sendMessage,
  getSummary,
} from '../services/beta-engine.js';

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

export async function betaRoutes(fastify: FastifyInstance): Promise<void> {
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

    const sessionId = createSession(accessKey);

    try {
      const message = await startHistory(sessionId);
      return reply.send({ success: true, data: { sessionId, message } });
    } catch (err) {
      fastify.log.error(err, 'beta/session/start: failed to start history');
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
    const session = getSession(sessionId);

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
      return reply.status(500).send({ success: false, error: 'Failed to get AI response' });
    }
  });

  // GET /beta/session/:sessionId/status
  fastify.get('/beta/session/:sessionId/status', async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string };
    const session = getSession(sessionId);

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
    const session = getSession(sessionId);

    if (!session) {
      return reply.status(404).send({ success: false, error: 'Session not found or expired' });
    }

    if (!session.isComplete) {
      return reply.status(400).send({ success: false, error: 'History not yet complete' });
    }

    const summary = getSummary(sessionId);
    return reply.send({ success: true, data: { summary } });
  });
}
