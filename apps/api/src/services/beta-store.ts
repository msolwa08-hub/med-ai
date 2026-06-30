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

class BetaStore {
  private sessions = new Map<string, BetaSession>();

  create(data: Omit<BetaSession, 'createdAt' | 'updatedAt'>): BetaSession {
    const now = new Date().toISOString();
    const session: BetaSession = { ...data, createdAt: now, updatedAt: now };
    this.sessions.set(session.id, session);
    return session;
  }

  get(id: string): BetaSession | undefined {
    return this.sessions.get(id);
  }

  update(id: string, patch: Partial<BetaSession>): BetaSession | undefined {
    const session = this.sessions.get(id);
    if (!session) return undefined;
    const updated = { ...session, ...patch, updatedAt: new Date().toISOString() };
    this.sessions.set(id, updated);
    return updated;
  }

  list(): BetaSession[] {
    return Array.from(this.sessions.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  delete(id: string): boolean {
    return this.sessions.delete(id);
  }
}

export const betaStore = new BetaStore();
