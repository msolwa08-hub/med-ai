// Redact common South African PII from text
export function deidentify(text: string): string {
  return text
    // SA ID numbers (13 digits)
    .replace(/\b\d{13}\b/g, '[ID-REDACTED]')
    // Phone numbers (SA formats)
    .replace(/\b(?:\+27|0)[\s-]?\d{2}[\s-]?\d{3}[\s-]?\d{4}\b/g, '[PHONE-REDACTED]')
    // Email addresses
    .replace(/\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g, '[EMAIL-REDACTED]')
    // Medical aid numbers (common patterns)
    .replace(/\bMA\d{7,10}\b/gi, '[MEDAID-REDACTED]');
}
