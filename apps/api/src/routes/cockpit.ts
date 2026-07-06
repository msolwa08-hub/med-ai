import type { FastifyInstance } from 'fastify';
import { betaStore } from '../services/beta-store.js';
import { validateDoctorKey } from '../lib/beta-config.js';

export async function cockpitRoutes(app: FastifyInstance) {
  function authDoctor(req: { headers: Record<string, unknown> }, reply: { status: (n: number) => { send: (d: unknown) => unknown } }): boolean {
    const key = (req.headers['x-doctor-key'] as string) ?? '';
    if (!validateDoctorKey(key)) {
      reply.status(401).send({ error: 'Invalid doctor key' });
      return false;
    }
    return true;
  }

  // List all sessions (in-memory merged with durable sessions from the DB,
  // so the cockpit survives redeploys/restarts when a database is configured)
  app.get('/cockpit/sessions', async (req, reply) => {
    if (!authDoctor(req, reply)) return;
    const sessions = (await betaStore.listMerged()).map(s => ({
      id: s.id,
      status: s.status,
      department: s.department,
      ageSex: s.ageSex,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      messageCount: s.messages.length,
      summary: s.summary,
      complaints: s.complaints,
    }));
    return reply.send({ sessions });
  });

  // Get single session with full messages
  app.get('/cockpit/sessions/:id', async (req, reply) => {
    if (!authDoctor(req, reply)) return;
    const { id } = req.params as { id: string };
    const session = await betaStore.load(id);
    if (!session) return reply.status(404).send({ error: 'Session not found' });
    return reply.send(session);
  });

  // Delete session
  app.delete('/cockpit/sessions/:id', async (req, reply) => {
    if (!authDoctor(req, reply)) return;
    const { id } = req.params as { id: string };
    await betaStore.load(id); // hydrate first so durable-only sessions delete cleanly
    const deleted = betaStore.delete(id);
    return reply.send({ deleted });
  });

  // Analytics summary
  app.get('/cockpit/analytics', async (req, reply) => {
    if (!authDoctor(req, reply)) return;
    const sessions = await betaStore.listMerged();
    const byDept: Record<string, number> = {};
    let completed = 0;
    let active = 0;
    for (const s of sessions) {
      const dept = s.department ?? 'unknown';
      byDept[dept] = (byDept[dept] ?? 0) + 1;
      if (s.status === 'completed') completed++;
      else active++;
    }
    return reply.send({
      total: sessions.length,
      completed,
      active,
      byDepartment: byDept,
    });
  });
}
