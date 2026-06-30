export function extractJSON<T>(text: string): T {
  // Strip markdown code fences
  const stripped = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(stripped) as T;
  } catch {
    // Try to find JSON object/array within the text
    const objMatch = stripped.match(/\{[\s\S]*\}/);
    const arrMatch = stripped.match(/\[[\s\S]*\]/);
    const match = objMatch ?? arrMatch;
    if (match) {
      return JSON.parse(match[0]) as T;
    }
    throw new Error(`Could not extract JSON from: ${text.slice(0, 200)}`);
  }
}
