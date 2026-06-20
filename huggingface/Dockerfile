# Hugging Face Space (Docker SDK) — free, no card.
# Paste THIS file's contents into a new file called "Dockerfile" in your Space.
# It pulls the app from the public GitHub repo, builds it, and runs it on the
# port Hugging Face expects (7860).

FROM node:20-slim

# git is needed to fetch the source
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Pull the full app (patient + doctor cockpit + intern tools) from the public repo
RUN git clone --depth 1 --branch claude/ai-medical-history-app-vhsw63 \
    https://github.com/msolwa08-hub/med-ai.git .

# Install + build the web app and the server (devDeps included: NODE_ENV not yet set)
RUN npm install && npm run build:web && npm run build:beta -w apps/api

ENV NODE_ENV=production
ENV WEB_DIST_PATH=/app/apps/web/dist
ENV PORT=7860
ENV BETA_DATA_DIR=/tmp/beta-data

EXPOSE 7860
CMD ["node", "apps/api/dist-beta/server.js"]
