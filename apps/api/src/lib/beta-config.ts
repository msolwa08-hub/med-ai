const DEV_KEYS = new Set(['MEDAI-BETA-DEV', 'MEDAI-DOC-DEV', 'MEDAI-INTERN-DEV']);

export const betaConfig = {
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? '',
  BETA_ACCESS_KEYS: process.env.BETA_ACCESS_KEYS || 'MEDAI-BETA-DEV',
  BETA_DOCTOR_KEYS: process.env.BETA_DOCTOR_KEYS || 'MEDAI-DOC-DEV',
  BETA_TOOLS_KEYS: process.env.BETA_TOOLS_KEYS || 'MEDAI-INTERN-DEV',
  PORT: parseInt(process.env.PORT ?? '3000', 10),
  NODE_ENV: process.env.NODE_ENV ?? 'development',
};

if (betaConfig.NODE_ENV === 'production') {
  const active = [betaConfig.BETA_ACCESS_KEYS, betaConfig.BETA_DOCTOR_KEYS, betaConfig.BETA_TOOLS_KEYS];
  if (active.some(k => DEV_KEYS.has(k))) {
    console.error('FATAL: default dev access keys are active in production — set BETA_ACCESS_KEYS / BETA_DOCTOR_KEYS / BETA_TOOLS_KEYS env vars');
    process.exit(1);
  }
}

export function validateBetaKey(key: string): boolean {
  return betaConfig.BETA_ACCESS_KEYS.split(',').map(k => k.trim()).includes(key);
}

export function validateDoctorKey(key: string): boolean {
  return betaConfig.BETA_DOCTOR_KEYS.split(',').map(k => k.trim()).includes(key);
}

export function validateToolsKey(key: string): boolean {
  return betaConfig.BETA_TOOLS_KEYS.split(',').map(k => k.trim()).includes(key);
}
