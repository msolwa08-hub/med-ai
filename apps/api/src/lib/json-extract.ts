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

/**
 * Scan from the first opening bracket to its BALANCED close (respecting
 * strings/escapes), so trailing prose after the JSON — "{...} Here's why..." —
 * doesn't poison the parse the way a greedy `{[\s\S]*}` match does.
 */
function firstBalanced(s: string): string | null {
  const start = s.search(/[{[]/);
  if (start === -1) return null;
  const open = s[start];
  const close = open === '{' ? '}' : ']';
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  // Never balanced (truncated) — return from the start so repair can finish it.
  return s.slice(start);
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
    const candidate = firstBalanced(stripped);
    if (candidate) {
      try {
        return JSON.parse(candidate) as T;
      } catch {
        // Truncated or slightly malformed — salvage what we can rather than throw.
        return JSON.parse(repairTruncatedJSON(candidate)) as T;
      }
    }
    throw new Error(`Could not extract JSON from: ${text.slice(0, 200)}`);
  }
}

/**
 * Non-throwing variant for structured-generation engines: returns null instead
 * of throwing so a genuinely unparseable reply degrades gracefully (a 500 that
 * dead-ends the flow is never acceptable in a clinical tool).
 */
export function tryExtractJSON<T = unknown>(text: string): T | null {
  try {
    return extractJSON<T>(text);
  } catch {
    return null;
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
