import type { FastifyInstance } from 'fastify';
import { betaEngine } from '../services/beta-engine.js';
import { betaStore } from '../services/beta-store.js';
import { validateBetaKey } from '../lib/beta-config.js';

export async function betaRoutes(app: FastifyInstance) {
  // Start a new patient history session
  app.post('/beta/start', async (req, reply) => {
    const key = (req.headers['x-beta-key'] as string) ?? '';
    if (!validateBetaKey(key)) {
      return reply.status(401).send({ error: 'Invalid access key' });
    }

    const body = req.body as {
      department?: string;
      ageSex?: string;
      chiefComplaintHint?: string;
    };

    try {
      const result = await betaEngine.startSession(
        body.department,
        body.ageSex,
        body.chiefComplaintHint
      );
      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: 'Failed to start session' });
    }
  });

  // Continue a patient conversation. Session recovery after a restart is
  // layered: (1) the in-memory store, (2) a direct database fetch when
  // DATABASE_URL is configured — the durable path, (3) as a last resort on
  // database-less deploys, rebuild from the transcript the client replays on
  // every turn. A patient is never stranded mid-history.
  app.post('/beta/chat', async (req, reply) => {
    const key = (req.headers['x-beta-key'] as string) ?? '';
    if (!validateBetaKey(key)) {
      return reply.status(401).send({ error: 'Invalid access key' });
    }

    const body = req.body as {
      sessionId: string;
      message: string;
      transcript?: { role: 'user' | 'assistant'; content: string }[];
      department?: string;
    };
    if (!body.sessionId || !body.message) {
      return reply.status(400).send({ error: 'sessionId and message are required' });
    }

    if (!(await betaStore.load(body.sessionId))) {
      const replay = Array.isArray(body.transcript)
        ? body.transcript.filter(
            (t): t is { role: 'user' | 'assistant'; content: string } =>
              !!t && (t.role === 'user' || t.role === 'assistant') && typeof t.content === 'string'
          )
        : [];
      if (replay.length === 0) {
        return reply.status(404).send({ error: 'Session not found — please start a new session' });
      }
      const now = new Date().toISOString();
      betaStore.create({
        id: body.sessionId,
        status: 'active',
        messages: replay.map(t => ({ ...t, timestamp: now })),
        department: body.department,
      });
      app.log.info({ sessionId: body.sessionId, turns: replay.length }, 'session rebuilt from client transcript');
    }

    try {
      const result = await betaEngine.chat(body.sessionId, body.message);
      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: 'Failed to process message' });
    }
  });

  app.get('/beta/session/:id', async (req, reply) => {
    const key = (req.headers['x-beta-key'] as string) ?? '';
    if (!validateBetaKey(key)) {
      return reply.status(401).send({ error: 'Invalid access key' });
    }
    const { id } = req.params as { id: string };
    const session = await betaStore.load(id);
    if (!session) return reply.status(404).send({ error: 'Session not found' });
    return reply.send({
      id: session.id,
      status: session.status,
      messages: session.messages,
      department: session.department,
    });
  });
}
