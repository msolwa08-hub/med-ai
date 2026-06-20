export interface StoredMessage {
  role: 'assistant' | 'patient';
  content: string;
  timestamp: string;
}

export interface StoredSession {
  sessionId: string;
  label: string;
  messages: StoredMessage[];
  isComplete: boolean;
  summary: string | null;
  notes: string;
  approved: boolean;
  createdAt: string;
  completedAt: string | null;
}

interface AppStorage {
  accessKey: string | null;
  sessions: StoredSession[];
}

const STORAGE_KEY = 'medai_beta_v2';

function load(): AppStorage {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { accessKey: null, sessions: [] };
    return JSON.parse(raw) as AppStorage;
  } catch {
    return { accessKey: null, sessions: [] };
  }
}

function save(data: AppStorage): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export const storage = {
  getAll(): AppStorage {
    return load();
  },

  getAccessKey(): string | null {
    return load().accessKey;
  },

  saveAccessKey(key: string): void {
    const data = load();
    data.accessKey = key;
    save(data);
  },

  getSessions(): StoredSession[] {
    return load().sessions;
  },

  getSession(sessionId: string): StoredSession | null {
    return load().sessions.find((s) => s.sessionId === sessionId) ?? null;
  },

  createSession(sessionId: string): StoredSession {
    const data = load();
    const count = data.sessions.length + 1;
    const session: StoredSession = {
      sessionId,
      label: `Patient ${count}`,
      messages: [],
      isComplete: false,
      summary: null,
      notes: '',
      approved: false,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    data.sessions.unshift(session); // newest first
    save(data);
    return session;
  },

  updateSession(sessionId: string, patch: Partial<StoredSession>): void {
    const data = load();
    const idx = data.sessions.findIndex((s) => s.sessionId === sessionId);
    if (idx === -1) return;
    data.sessions[idx] = { ...data.sessions[idx], ...patch };
    save(data);
  },

  addMessage(sessionId: string, msg: StoredMessage): void {
    const data = load();
    const session = data.sessions.find((s) => s.sessionId === sessionId);
    if (!session) return;
    session.messages.push(msg);
    // Auto-label from first patient message
    if (msg.role === 'patient' && session.label.startsWith('Patient ')) {
      const words = msg.content.trim().split(/\s+/).slice(0, 8).join(' ');
      session.label = words.length > 4 ? words + '...' : session.label;
    }
    save(data);
  },

  completeSession(sessionId: string, summary: string): void {
    const data = load();
    const session = data.sessions.find((s) => s.sessionId === sessionId);
    if (!session) return;
    session.isComplete = true;
    session.summary = summary;
    session.completedAt = new Date().toISOString();
    save(data);
  },

  saveNotes(sessionId: string, notes: string): void {
    const data = load();
    const session = data.sessions.find((s) => s.sessionId === sessionId);
    if (!session) return;
    session.notes = notes;
    save(data);
  },

  approveSession(sessionId: string): void {
    const data = load();
    const session = data.sessions.find((s) => s.sessionId === sessionId);
    if (!session) return;
    session.approved = true;
    save(data);
  },

  renameSession(sessionId: string, label: string): void {
    const data = load();
    const session = data.sessions.find((s) => s.sessionId === sessionId);
    if (!session) return;
    session.label = label;
    save(data);
  },

  clearAll(): void {
    localStorage.removeItem(STORAGE_KEY);
  },
};
