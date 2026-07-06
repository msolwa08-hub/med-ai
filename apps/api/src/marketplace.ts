/**
 * Marketplace wiring — exposes the patient↔doctor dispatch/geolocation
 * subsystem ("find nearby doctors, broadcast-notify, first-to-accept") on the
 * deployed beta server.
 *
 * The full API's config.ts hard-validates its environment at import time
 * (DATABASE_URL, JWT secrets, ENCRYPTION_KEY), and every marketplace route
 * transitively imports it. So this module keeps ALL of those imports dynamic,
 * inside registerMarketplace(): a deploy without marketplace env never loads
 * (or crashes on) any of it, and stays byte-for-byte the old beta server.
 *
 * Enablement is all-or-nothing on the four env vars below. When enabled, the
 * beta server gains the minimal complete dispatch loop:
 *   auth        → JWT issuance (register/login) for doctors + patients
 *   patients    → patient profile + booking location
 *   doctors     → availability heartbeat, nearby search, queue, accept/decline
 *   consultations → consultation lifecycle
 *   history     → AI history routes whose completion fires dispatchConsultation()
 *   notifications → push-token registration (dispatch delivers via push)
 *
 * Known accepted risk (tracked in scripts/audit-check.mjs): @fastify/jwt on
 * Fastify v4 carries the fast-jwt advisory; the fix requires the Fastify v5
 * migration. Keep marketplace deploys behind trusted keys until that lands.
 */
import type { FastifyInstance } from 'fastify';

export const MARKETPLACE_ENV = [
  'DATABASE_URL', // Prisma/Postgres — doctors, consultations, dispatch state
  'JWT_SECRET', // ≥32 chars
  'JWT_REFRESH_SECRET', // ≥32 chars
  'ENCRYPTION_KEY', // exactly 64 hex chars — field-level PHI encryption
] as const;

/** Env vars still missing before the marketplace can be enabled. */
export function missingMarketplaceEnv(): string[] {
  return MARKETPLACE_ENV.filter(k => !process.env[k]);
}

export async function registerMarketplace(app: FastifyInstance): Promise<void> {
  const [
    jwtModule,
    { authRoutes },
    { patientRoutes },
    { doctorRoutes },
    { consultationRoutes },
    { aiHistoryRoutes },
    { ogHistoryRoutes },
    { antenatalFollowUpRoutes },
    { specialtyHistoryRoutes },
    { notificationRoutes },
  ] = await Promise.all([
    import('@fastify/jwt'),
    import('./routes/auth.js'),
    import('./routes/patients.js'),
    import('./routes/doctors.js'),
    import('./routes/consultations.js'),
    import('./routes/ai-history.js'),
    import('./routes/og-history.js'),
    import('./routes/antenatal-followup.js'),
    import('./routes/specialty-history.js'),
    import('./routes/notifications.js'),
  ]);

  await app.register(jwtModule.default, { secret: process.env.JWT_SECRET as string });
  await app.register(authRoutes);
  await app.register(patientRoutes);
  await app.register(doctorRoutes);
  await app.register(consultationRoutes);
  await app.register(aiHistoryRoutes);
  await app.register(ogHistoryRoutes);
  await app.register(antenatalFollowUpRoutes);
  await app.register(specialtyHistoryRoutes);
  await app.register(notificationRoutes);
}
