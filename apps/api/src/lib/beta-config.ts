/**
 * Lightweight config for the standalone beta server.
 *
 * Unlike the main app config (which requires a database, JWT secrets, and
 * encryption keys), the beta only needs the Anthropic API key and the list
 * of valid access keys. This lets the beta deploy as a single service with
 * minimal environment setup.
 */

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  // Only enforced when the beta server actually boots — the main app has its
  // own validation and may import this module without the var set in tests.
  if (process.env.BETA_SERVER === '1') {
    console.error('\n❌  ANTHROPIC_API_KEY is required to run the beta server.\n');
    process.exit(1);
  }
}

export const betaConfig = {
  ANTHROPIC_API_KEY: ANTHROPIC_API_KEY ?? '',
  BETA_ACCESS_KEYS: process.env.BETA_ACCESS_KEYS ?? 'MEDAI-BETA-DEV',
  BETA_DOCTOR_KEYS: process.env.BETA_DOCTOR_KEYS ?? 'MEDAI-DOC-DEV',
  BETA_TOOLS_KEYS: process.env.BETA_TOOLS_KEYS ?? 'MEDAI-INTERN-DEV',
  PORT: parseInt(process.env.PORT ?? '3000', 10),
  WEB_DIST_PATH: process.env.WEB_DIST_PATH ?? '',
};
