// Robust JSON extraction for LLM output. Strips code fences, locates the JSON
// object/array, and salvages truncated output (e.g. if the model is cut off) by
// dropping any dangling partial token and closing open strings/brackets — so a
// malformed/truncated response degrades gracefully instead of throwing.

export function repairTruncatedJSON(s: string): string {
  const closers: string[] = [];
  let inStr = false;
  let esc = false;
  let lastSafe = 0; // index just after the last complete value/structural boundary
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') {
        inStr = false;
        lastSafe = i + 1;
      }
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === '{') closers.push('}');
    else if (ch === '[') closers.push(']');
    else if (ch === '}' || ch === ']') {
      closers.pop();
      lastSafe = i + 1;
    } else if (ch === ',') lastSafe = i + 1;
  }
  let out = s.slice(0, lastSafe).replace(/,\s*$/, '');
  while (closers.length) out += closers.pop();
  return out;
}

export function extractJSON<T = unknown>(text: string): T {
  // Strip markdown code fences
  const stripped = text
    .replace(/```(?:json)?\s*/gi, '')
    .replace(/```/g, '')
    .trim();

  try {
    return JSON.parse(stripped) as T;
  } catch {
    // Try to find a JSON object/array within the text
    const objMatch = stripped.match(/\{[\s\S]*\}/);
    const arrMatch = stripped.match(/\[[\s\S]*\]/);
    const match = objMatch ?? arrMatch;
    if (match) {
      try {
        return JSON.parse(match[0]) as T;
      } catch {
        // Likely truncated output — salvage what we can rather than throw.
        return JSON.parse(repairTruncatedJSON(match[0])) as T;
      }
    }
    throw new Error(`Could not extract JSON from: ${text.slice(0, 200)}`);
  }
}

// Coercion helpers shared by structured-generation services.
export function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}
export function asNumber(v: unknown, fallback = 0): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}
export function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.map((x) => asString(x)).filter(Boolean) : [];
}
