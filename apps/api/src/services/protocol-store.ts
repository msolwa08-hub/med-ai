/**
 * Hospital Protocol Store — lets a facility plug its OWN protocols into the
 * intern tools, layered above (and able to override) the generic SA STGs.
 *
 * In-memory only (matches beta-store.ts — no database in the beta image).
 * Documents are chunked into paragraphs at upload time; retrieval scores each
 * paragraph against the patient's clinical text with the same cheap lexical
 * overlap approach used for STG matching (services/tools-clinical.ts), so no
 * embeddings/vector DB is required. This is intentionally simple: a facility
 * uploads a protocol once, and every subsequent assist/problem-suggestion
 * call for that department can pull in the exact paragraph that matters.
 */

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
    return protocol;
  }

  list(dept?: string): HospitalProtocol[] {
    const all = Array.from(this.protocols.values()).sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
    return dept ? all.filter(p => p.dept === dept || p.dept === 'all') : all;
  }

  remove(id: string): boolean {
    return this.protocols.delete(id);
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
