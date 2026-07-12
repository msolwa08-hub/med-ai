// ─── Negation-aware clinical text matching ───────────────────────────────────
// Record text is full of NEGATED mentions: tap answers serialize "no chest
// pain", smart-block toggles serialize "Convulsions: no", exam rows serialize
// "IMCI danger signs: NAD". A naive regex over the raw record fires content
// for findings the clinician explicitly excluded — the epilepsy block on every
// properly-screened sick child. Every trigger pattern (smart blocks, treatment
// sets, exam-checklist rules, calculator suggestions) must test against text
// with the negated spans stripped.

/** A clause whose final "label: value" value is one of these is an excluded/
 *  normal finding — the whole clause is noise for trigger matching. */
const NEG_VALUE =
  /^(?:no|none|nil|negative|nad|normal|clear|intact|not\b|denied|denies|screened negative|unremarkable|absent)\b|\b(?:not detected|ruled out|excluded|screened negative)\b/i;

/** Negation cue and everything after it up to the next sub-clause boundary —
 *  a contrast word ("but", "however") ends the negated span so the positive
 *  finding after it survives: "denies chest pain but has dyspnoea". */
const NEG_LEAD =
  /\b(?:no|not|nil|denies|denied|without|never|negative for|free of)\b(?:(?!\b(?:but|however|except|apart from|other than)\b)[^,;.\n—–])*/gi;

/** Postfix negation: the span BEFORE the cue is what's excluded:
 *  "abruption excluded", "PE ruled out", "danger signs screened negative". */
const NEG_TAIL =
  /[^,;.\n—–:]*\b(?:ruled out|excluded|screened negative|not present|not detected)\b/gi;

export function stripNegated(text: string): string {
  return text
    .split(/([;.\n])/)
    .map(clause => {
      if (/^[;.\n]$/.test(clause)) return clause;
      const lastColon = clause.lastIndexOf(':');
      if (lastColon !== -1 && NEG_VALUE.test(clause.slice(lastColon + 1).trim())) return '';
      return clause.replace(NEG_TAIL, ' ').replace(NEG_LEAD, ' ');
    })
    .join(' ');
}

/** Test a trigger pattern against record/presenting text, ignoring negated
 *  mentions. Use this — never pattern.test(rawRecordText) — for anything that
 *  surfaces clinical content off free text. */
export function clinicalMatch(pattern: RegExp, text: string): boolean {
  return pattern.test(stripNegated(text));
}
