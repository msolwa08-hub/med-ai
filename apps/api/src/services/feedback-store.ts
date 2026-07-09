/**
 * Beta feedback capture — the loop back from the ward.
 *
 * The intern taps "feedback" anywhere in the tool; we keep the last N entries in
 * memory (survives the process, not a restart — this is a beta signal channel,
 * not a record of care) so they can be read back and turned into the next
 * iteration. Deliberately tiny and dependency-free so it rides the beta server
 * with zero new infrastructure.
 */
export interface FeedbackEntry {
  id: string;
  ts: string;
  screen?: string;
  dept?: string;
  subDept?: string;
  rating?: 'good' | 'bad' | 'idea';
  note: string;
  context?: string;
}

const MAX = 500;
const ring: FeedbackEntry[] = [];
let seq = 0;

export function addFeedback(input: Omit<FeedbackEntry, 'id' | 'ts'>, now: string): FeedbackEntry {
  const entry: FeedbackEntry = { id: `fb_${++seq}`, ts: now, ...input };
  ring.push(entry);
  if (ring.length > MAX) ring.shift();
  return entry;
}

export function listFeedback(limit = 100): FeedbackEntry[] {
  return ring.slice(-limit).reverse();
}

export function feedbackCount(): number {
  return ring.length;
}
