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

  // Continue a patient conversation
  app.post('/beta/chat', async (req, reply) => {
    const key = (req.headers['x-beta-key'] as string) ?? '';
    if (!validateBetaKey(key)) {
      return reply.status(401).send({ error: 'Invalid access key' });
    }

    const body = req.body as { sessionId: string; message: string };
    if (!body.sessionId || !body.message) {
      return reply.status(400).send({ error: 'sessionId and message are required' });
    }

    try {
      const result = await betaEngine.chat(body.sessionId, body.message);
      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: 'Failed to process message' });
    }
  });

  // Get session (public — patients access via session ID in URL)
  app.get('/beta/session/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const session = betaStore.get(id);
    if (!session) return reply.status(404).send({ error: 'Session not found' });
    return reply.send({
      id: session.id,
      status: session.status,
      messages: session.messages,
      department: session.department,
    });
  });
}
