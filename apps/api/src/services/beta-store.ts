import type { BetaSession as BetaSessionRow } from '@prisma/client';
import { betaDb } from '../lib/beta-db.js';

export interface BetaMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface BetaSession {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'completed';
  messages: BetaMessage[];
  summary?: string;
  complaints?: string[];
  department?: string;
  ageSex?: string;
  chiefComplaintHint?: string;
  history?: string;
}

function toRow(session: BetaSession) {
  return {
    id: session.id,
    status: session.status,
    department: session.department ?? null,
    ageSex: session.ageSex ?? null,
    chiefComplaintHint: session.chiefComplaintHint ?? null,
    summary: session.summary ?? null,
    history: session.history ?? null,
    complaints: session.complaints ?? [],
    messages: session.messages as unknown as object,
  };
}

function fromRow(row: BetaSessionRow): BetaSession {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    status: row.status === 'completed' ? 'completed' : 'active',
    messages: Array.isArray(row.messages) ? (row.messages as unknown as BetaMessage[]) : [],
    summary: row.summary ?? undefined,
    complaints: Array.isArray(row.complaints) ? (row.complaints as unknown as string[]) : undefined,
    department: row.department ?? undefined,
    ageSex: row.ageSex ?? undefined,
    chiefComplaintHint: row.chiefComplaintHint ?? undefined,
    history: row.history ?? undefined,
  };
}

/**
 * Session store: a synchronous in-memory Map (the hot path the engine and
 * routes read from) with write-through persistence to Postgres when a
 * database is configured. Cold reads (after a redeploy/restart) go through
 * load()/listMerged(), which rehydrate the Map from the database.
 */
class BetaStore {
  private sessions = new Map<string, BetaSession>();

  private persist(session: BetaSession): void {
    const db = betaDb();
    if (!db) return;
    const row = toRow(session);
    db.betaSession
      .upsert({ where: { id: session.id }, create: row, update: row })
      .catch((err: unknown) =>
        console.warn(
          '[beta-store] persist failed (in-memory copy still live):',
          err instanceof Error ? err.message : err
        )
      );
  }

  create(data: Omit<BetaSession, 'createdAt' | 'updatedAt'>): BetaSession {
    const now = new Date().toISOString();
    const session: BetaSession = { ...data, createdAt: now, updatedAt: now };
    this.sessions.set(session.id, session);
    this.persist(session);
    return session;
  }

  /** Memory-only lookup — safe anywhere a prior load() has hydrated the session. */
  get(id: string): BetaSession | undefined {
    return this.sessions.get(id);
  }

  /**
   * Memory lookup with a database fallback: after a restart the Map is empty,
   * so a miss checks Postgres and rehydrates. Returns undefined when the
   * session exists nowhere (or no database is configured).
   */
  async load(id: string): Promise<BetaSession | undefined> {
    const hit = this.sessions.get(id);
    if (hit) return hit;
    const db = betaDb();
    if (!db) return undefined;
    try {
      const row = await db.betaSession.findUnique({ where: { id } });
      if (!row) return undefined;
      const session = fromRow(row);
      this.sessions.set(id, session);
      return session;
    } catch (err) {
      console.warn(
        '[beta-store] load failed — treating as not found:',
        err instanceof Error ? err.message : err
      );
      return undefined;
    }
  }

  update(id: string, patch: Partial<BetaSession>): BetaSession | undefined {
    const session = this.sessions.get(id);
    if (!session) return undefined;
    const updated = { ...session, ...patch, updatedAt: new Date().toISOString() };
    this.sessions.set(id, updated);
    this.persist(updated);
    return updated;
  }

  list(): BetaSession[] {
    return Array.from(this.sessions.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  /**
   * list() plus durable sessions from the database (memory wins on conflict —
   * it is never older than its own write-through copy). Used by the cockpit so
   * a doctor still sees every consultation after a redeploy.
   */
  async listMerged(limit = 500): Promise<BetaSession[]> {
    const db = betaDb();
    if (db) {
      try {
        const rows = await db.betaSession.findMany({
          orderBy: { updatedAt: 'desc' },
          take: limit,
        });
        for (const row of rows) {
          if (!this.sessions.has(row.id)) this.sessions.set(row.id, fromRow(row));
        }
      } catch (err) {
        console.warn(
          '[beta-store] list hydration failed — showing in-memory sessions only:',
          err instanceof Error ? err.message : err
        );
      }
    }
    return this.list();
  }

  delete(id: string): boolean {
    const existed = this.sessions.delete(id);
    const db = betaDb();
    if (db) {
      db.betaSession.delete({ where: { id } }).catch(() => {
        /* not persisted / already gone — nothing to clean up */
      });
    }
    return existed;
  }
}

export const betaStore = new BetaStore();
