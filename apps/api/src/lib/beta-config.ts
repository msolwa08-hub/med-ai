export const betaConfig = {
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? '',
  BETA_ACCESS_KEYS: process.env.BETA_ACCESS_KEYS || 'MEDAI-BETA-DEV',
  BETA_DOCTOR_KEYS: process.env.BETA_DOCTOR_KEYS || 'MEDAI-DOC-DEV',
  BETA_TOOLS_KEYS: process.env.BETA_TOOLS_KEYS || 'MEDAI-INTERN-DEV',
  PORT: parseInt(process.env.PORT ?? '3000', 10),
  NODE_ENV: process.env.NODE_ENV ?? 'development',
};

export function validateBetaKey(key: string): boolean {
  return betaConfig.BETA_ACCESS_KEYS.split(',').map(k => k.trim()).includes(key);
}

export function validateDoctorKey(key: string): boolean {
  return betaConfig.BETA_DOCTOR_KEYS.split(',').map(k => k.trim()).includes(key);
}

export function validateToolsKey(key: string): boolean {
  return betaConfig.BETA_TOOLS_KEYS.split(',').map(k => k.trim()).includes(key);
}
