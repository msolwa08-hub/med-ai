# MedAI Beta — single-service deploy (web app + history-taking API)
# Builds the React web app and the standalone beta server, runs both from one process.
# No database required — only ANTHROPIC_API_KEY and BETA_ACCESS_KEYS.

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

# Build the web app and bundle the beta server
RUN npm run build:web \
  && npm run build:beta --workspace=apps/api

# Runtime config
ENV NODE_ENV=production
ENV WEB_DIST_PATH=/app/apps/web/dist
# PORT is provided by the host (Render/Railway set it automatically)

CMD ["node", "apps/api/dist-beta/server.js"]
