/**
 * Hospital Protocol Store — lets a facility plug its OWN protocols into the
 * intern tools, layered above (and able to override) the generic SA STGs.
 *
 * Reads are served from an in-memory Map (match() runs on every assist call
 * and must stay cheap); writes go through to Postgres when DATABASE_URL is
 * configured, and init() rehydrates the Map from the database at boot so an
 * uploaded protocol survives redeploys and free-tier restarts. Without a
 * database this degrades to exactly the old memory-only behaviour.
 *
 * Documents are chunked into paragraphs at load time; retrieval scores each
 * paragraph against the patient's clinical text with the same cheap lexical
 * overlap approach used for STG matching (services/tools-clinical.ts), so no
 * embeddings/vector DB is required. This is intentionally simple: a facility
 * uploads a protocol once, and every subsequent assist/problem-suggestion
 * call for that department can pull in the exact paragraph that matters.
 */
import { betaDb } from '../lib/beta-db.js';

export interface ProtocolChunk {
  text: string;
  index: number;
}

export interface HospitalProtocol {
  id: string;
  dept: string; // a DeptId, or 'all' for a hospital-wide protocol
  title: string;
  sourceFilename?: string;
  chunks: ProtocolChunk[];
  charCount: number;
  uploadedAt: string;
}

export interface ProtocolMatch {
  protocolId: string;
  title: string;
  excerpt: string;
}

function chunkText(content: string): ProtocolChunk[] {
  // Split on blank lines (paragraphs) or hard section breaks; merge tiny
  // fragments into their neighbour so each chunk carries enough context to
  // be useful on its own, and cap chunk size so one paragraph can't blow the
  // prompt budget.
  const rawParagraphs = content
    .split(/\n\s*\n+/)
    .map(p => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const merged: string[] = [];
  for (const p of rawParagraphs) {
    const prev = merged[merged.length - 1];
    if (prev && prev.length < 120) {
      merged[merged.length - 1] = `${prev} ${p}`;
    } else {
      merged.push(p);
    }
  }

  const MAX_CHUNK = 1200;
  const chunks: ProtocolChunk[] = [];
  for (const p of merged) {
    if (p.length <= MAX_CHUNK) {
      chunks.push({ text: p, index: chunks.length });
      continue;
    }
    for (let i = 0; i < p.length; i += MAX_CHUNK) {
      chunks.push({ text: p.slice(i, i + MAX_CHUNK), index: chunks.length });
    }
  }
  return chunks;
}

class ProtocolStore {
  private protocols = new Map<string, HospitalProtocol>();

  /**
   * Rehydrate every persisted protocol into memory. Called once at boot;
   * a failure logs and starts empty rather than blocking the server.
   */
  async init(): Promise<void> {
    const db = betaDb();
    if (!db) return;
    try {
      const rows = await db.facilityProtocol.findMany({ orderBy: { uploadedAt: 'desc' } });
      for (const row of rows) {
        this.protocols.set(row.id, {
          id: row.id,
          dept: row.dept,
          title: row.title,
          sourceFilename: row.sourceFilename ?? undefined,
          chunks: chunkText(row.content),
          charCount: row.charCount,
          uploadedAt: row.uploadedAt.toISOString(),
        });
      }
      if (rows.length > 0) {
        console.info(`[protocol-store] hydrated ${rows.length} facility protocol(s) from database`);
      }
    } catch (err) {
      console.warn(
        '[protocol-store] hydration failed — starting with an empty store:',
        err instanceof Error ? err.message : err
      );
    }
  }

  add(input: { dept: string; title: string; content: string; sourceFilename?: string }): HospitalProtocol {
    const id = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    const protocol: HospitalProtocol = {
      id,
      dept: input.dept,
      title: input.title,
      sourceFilename: input.sourceFilename,
      chunks: chunkText(input.content),
      charCount: input.content.length,
      uploadedAt: new Date().toISOString(),
    };
    this.protocols.set(id, protocol);
    const db = betaDb();
    if (db) {
      db.facilityProtocol
        .create({
          data: {
            id,
            dept: input.dept,
            title: input.title,
            content: input.content,
            sourceFilename: input.sourceFilename ?? null,
            charCount: input.content.length,
          },
        })
        .catch((err: unknown) =>
          console.warn(
            '[protocol-store] persist failed (in-memory copy still live):',
            err instanceof Error ? err.message : err
          )
        );
    }
    return protocol;
  }

  list(dept?: string): HospitalProtocol[] {
    const all = Array.from(this.protocols.values()).sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
    return dept ? all.filter(p => p.dept === dept || p.dept === 'all') : all;
  }

  remove(id: string): boolean {
    const existed = this.protocols.delete(id);
    const db = betaDb();
    if (db) {
      db.facilityProtocol.delete({ where: { id } }).catch(() => {
        /* not persisted / already gone — nothing to clean up */
      });
    }
    return existed;
  }

  /** Best-matching excerpts across all protocols relevant to this department. */
  match(clinicalText: string, dept: string, limit = 2): ProtocolMatch[] {
    const text = clinicalText.toLowerCase();
    const words = Array.from(new Set(text.split(/[^a-z0-9]+/).filter(w => w.length >= 3)));
    if (words.length === 0) return [];

    const candidates = this.list(dept);
    const scored: Array<{ protocol: HospitalProtocol; chunk: ProtocolChunk; score: number }> = [];
    for (const protocol of candidates) {
      for (const chunk of protocol.chunks) {
        const chunkLower = chunk.text.toLowerCase();
        let score = 0;
        for (const w of words) if (chunkLower.includes(w)) score++;
        if (score >= 2) scored.push({ protocol, chunk, score });
      }
    }
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => ({ protocolId: s.protocol.id, title: s.protocol.title, excerpt: s.chunk.text }));
  }
}

export const protocolStore = new ProtocolStore();
