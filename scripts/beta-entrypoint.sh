#!/bin/sh
# Beta server boot: provision/upgrade the database schema when one is
# configured, then start the server. Migration failure is logged but never
# fatal — the server degrades to memory-only persistence (client replay +
# localStorage) rather than refusing to boot.

if [ -n "$DATABASE_URL" ]; then
  # The schema declares directUrl = env("DIRECT_URL") for pooled setups; the
  # prisma CLI requires it to resolve even when it equals the primary URL.
  export DIRECT_URL="${DIRECT_URL:-$DATABASE_URL}"
  echo "[entrypoint] DATABASE_URL set — applying migrations (prisma migrate deploy)"
  npx prisma migrate deploy --schema=prisma/schema.prisma \
    || echo "[entrypoint] WARNING: migrate deploy failed — continuing with memory-only persistence"
else
  echo "[entrypoint] no DATABASE_URL — memory-only mode (sessions/protocols do not survive restarts)"
fi

exec node apps/api/dist/beta-server.js
