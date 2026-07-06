# MedAI Beta — single-service deploy (web app + history-taking API)
# Builds the React web app and the standalone beta server, runs both from one process.
#
# Runs with only ANTHROPIC_API_KEY and BETA_ACCESS_KEYS (memory-only mode).
# Optionally: DATABASE_URL enables durable sessions/protocols, and adding
# JWT_SECRET + JWT_REFRESH_SECRET + ENCRYPTION_KEY mounts the dispatch
# marketplace (nearby doctors, broadcast dispatch, first-to-accept).

FROM node:20-slim

WORKDIR /app

# Install dependencies (workspaces)
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages ./packages
RUN npm install

# Copy source
COPY . .

# Generate the Prisma client (types + engine) — the schema is only available
# after COPY, so the npm-install postinstall generate was a no-op. build:beta
# now compiles the marketplace graph, which imports @prisma/client.
RUN npx prisma generate --schema=prisma/schema.prisma

# Build the web app and bundle the beta server
RUN npm run build:web \
  && npm run build:beta --workspace=apps/api

# Runtime config
ENV NODE_ENV=production
# PORT is provided by the host (Render/Railway set it automatically)

RUN chmod +x scripts/beta-entrypoint.sh
CMD ["./scripts/beta-entrypoint.sh"]
