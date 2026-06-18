FROM node:22-alpine AS builder

WORKDIR /app

# Copy workspace config
COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN npm ci

# Copy source
COPY packages/shared/ ./packages/shared/
COPY apps/api/ ./apps/api/
COPY prisma/ ./prisma/

# Build
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=apps/api
RUN npm run db:generate --workspace=apps/api

FROM node:22-alpine AS runner

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

USER node

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/api/dist/index.js"]
