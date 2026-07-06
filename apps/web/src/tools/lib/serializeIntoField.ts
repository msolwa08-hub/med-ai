// ─── Serialize-into-field helper ─────────────────────────────────────────────
// Structured blocks write clinical shorthand into the EXISTING record string
// fields (the AI endpoints consume those strings). Because the intern can
// re-tap chips repeatedly, each block remembers the exact text it last wrote
// (lastText) and replaces it in place; anything the intern typed around it is
// preserved. If the intern edited the block's text away, we append instead of
// guessing.

export function upsertSerialized(
  fieldValue: string,
  lastText: string | undefined,
  nextText: string,
  sep = '\n'
): string {
  const current = fieldValue ?? '';
  if (lastText && current.includes(lastText)) {
    const replaced = current.replace(lastText, nextText);
    // Clean up separators left behind when a block serializes to nothing.
    return nextText === '' ? tidy(replaced, sep) : replaced;
  }
  if (nextText === '') return current;
  return current.trim() === '' ? nextText : `${current.replace(/\s+$/, '')}${sep}${nextText}`;
}

function tidy(text: string, sep: string): string {
  return text
    .split(sep)
    .filter(line => line.trim() !== '')
    .join(sep);
}
