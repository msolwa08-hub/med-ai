import { z } from 'zod';
import 'dotenv/config';

const configSchema = z.object({
  // App
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  API_URL: z.string().url().default('http://localhost:3000'),
  FRONTEND_URL: z.string().url().default('http://localhost:19006'),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().optional(),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  // Encryption
  ENCRYPTION_KEY: z
    .string()
    .length(64, 'ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)'),

  // Anthropic
  ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required'),

  // HPCSA
  HPCSA_API_URL: z.string().url().default('https://api.hpcsa.co.za/verify'),
  HPCSA_API_KEY: z.string().optional(),

  // Twilio SMS
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),

  // AWS S3
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default('af-south-1'),
  AWS_S3_BUCKET: z.string().default('medai-encrypted-records'),

  // Expo Push Notifications
  EXPO_ACCESS_TOKEN: z.string().optional(),

  // PayFast payment gateway
  PAYFAST_MERCHANT_ID: z.string().default('10000100'),      // sandbox default
  PAYFAST_MERCHANT_KEY: z.string().default('46f0cd694581a'), // sandbox default
  PAYFAST_PASSPHRASE: z.string().optional(),
  APP_URL: z.string().default('exp://localhost:8081'),

  // Beta access keys (comma-separated list of valid keys)
  BETA_ACCESS_KEYS: z.string().default('MEDAI-BETA-DEV'),

  // POPIA — when 'true', AI processing of patient data requires a granted,
  // non-expired DATA_PROCESSING consent record (cross-border AI processing).
  // Default off so existing flows keep working until patient onboarding
  // captures this consent; enable once that is in place.
  ENFORCE_AI_PROCESSING_CONSENT: z
    .string()
    .default('false')
    .transform((v) => v.toLowerCase() === 'true'),
});

const _config = configSchema.safeParse(process.env);

if (!_config.success) {
  console.error('Invalid environment configuration:');
  console.error(_config.error.format());
  process.exit(1);
}

export const config = _config.data;
export type Config = typeof config;
