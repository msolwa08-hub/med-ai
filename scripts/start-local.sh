#!/usr/bin/env bash
# MedAI Beta — local startup script
# Usage: bash scripts/start-local.sh
# Requires: Node.js 20+, npm

set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

GREEN='\033[0;32m'
TEAL='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${TEAL}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${TEAL}  MedAI Beta — Local Setup${NC}"
echo -e "${TEAL}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ── Check Node.js ─────────────────────────────────────────
if ! command -v node &>/dev/null; then
  echo -e "${RED}Error: Node.js not found. Install from https://nodejs.org (v20+)${NC}"
  exit 1
fi

NODE_VER=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")
if [ "$NODE_VER" -lt 18 ]; then
  echo -e "${RED}Error: Node.js v18+ required (found v${NODE_VER})${NC}"
  exit 1
fi
echo -e "  ${GREEN}✓${NC} Node.js v$(node -v | tr -d 'v') detected"

# ── Environment file ───────────────────────────────────────
ENV_FILE="$ROOT/apps/api/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo ""
  echo -e "  ${YELLOW}No .env file found. Let's set one up.${NC}"
  cp "$ROOT/apps/api/.env.example" "$ENV_FILE"

  echo ""
  read -rp "  Anthropic API key (sk-ant-...): " ANTHROPIC_KEY
  sed -i.bak "s|sk-ant-api\.\.\.|${ANTHROPIC_KEY}|g" "$ENV_FILE" && rm -f "${ENV_FILE}.bak"

  echo ""
  read -rp "  Patient access key (e.g. MEDAI-BETA-2024): " BETA_KEY
  sed -i.bak "s|# BETA_ACCESS_KEYS=MEDAI-BETA-XXXX|BETA_ACCESS_KEYS=${BETA_KEY}|g" "$ENV_FILE" && rm -f "${ENV_FILE}.bak"

  read -rp "  Doctor access key (e.g. MEDAI-DOC-2024): " DOC_KEY
  sed -i.bak "s|# BETA_DOCTOR_KEYS=MEDAI-DOC-XXXX|BETA_DOCTOR_KEYS=${DOC_KEY}|g" "$ENV_FILE" && rm -f "${ENV_FILE}.bak"

  read -rp "  Doctor name (e.g. Dr. Smith) [Dr. Patel]: " DOCTOR_NAME
  DOCTOR_NAME="${DOCTOR_NAME:-Dr. Patel}"
  sed -i.bak "s|# BETA_DOCTOR_NAME=Dr. Smith|BETA_DOCTOR_NAME=${DOCTOR_NAME}|g" "$ENV_FILE" && rm -f "${ENV_FILE}.bak"

  read -rp "  Practice name [Sandton Family Practice]: " PRACTICE_NAME
  PRACTICE_NAME="${PRACTICE_NAME:-Sandton Family Practice}"
  sed -i.bak "s|# BETA_PRACTICE_NAME=Cape Town City Practice|BETA_PRACTICE_NAME=${PRACTICE_NAME}|g" "$ENV_FILE" && rm -f "${ENV_FILE}.bak"

  echo ""
  echo -e "  ${GREEN}✓${NC} .env created at apps/api/.env"
else
  echo -e "  ${GREEN}✓${NC} .env found at apps/api/.env"
fi

# ── Install dependencies ───────────────────────────────────
echo ""
echo -e "  Installing dependencies…"
npm install --silent 2>&1 | tail -1
echo -e "  ${GREEN}✓${NC} Dependencies installed"

# ── Build web app ──────────────────────────────────────────
echo ""
echo -e "  Building web app…"
npm run build --workspace=apps/web 2>&1 | tail -3
echo -e "  ${GREEN}✓${NC} Web app built"

# ── Build beta server ──────────────────────────────────────
echo ""
echo -e "  Building beta server…"
npm run build:beta --workspace=apps/api 2>&1 | tail -3
echo -e "  ${GREEN}✓${NC} Beta server built"

# ── Start ─────────────────────────────────────────────────
echo ""
echo -e "${TEAL}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Starting MedAI Beta…${NC}"
echo ""
echo -e "  ${TEAL}Patient app:${NC}  http://localhost:3000/patient"
echo -e "  ${TEAL}Doctor app:${NC}   http://localhost:3000/doctor"
echo -e "  ${TEAL}Intern tools:${NC} http://localhost:3000/tools"
echo -e "  ${TEAL}Portal:${NC}       http://localhost:3000"
echo ""
echo -e "  Press Ctrl+C to stop."
echo -e "${TEAL}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd "$ROOT/apps/api"
NODE_ENV=production node dist/beta-server.js
