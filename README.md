# MedAI

AI-powered telemedicine platform for South Africa. Patients complete an AI-guided
medical history in any of the 11 official SA languages; HPCSA-verified doctors
review it, get AI-assisted differentials, and run the full clinical workflow —
prescriptions, referrals, sick notes, labs and payments — in one place.

## Features

- **AI medical history taking** in all 11 SA official languages, plus a dedicated O&G history module
- **AI clinical support** — ranked differential diagnoses (ICD-10, SA disease prevalence aware), ultrasound report interpretation
- **STG/EML lookups** — SA Standard Treatment Guidelines & Essential Medicines List
- **Doctor workflow** — HPCSA verification, Uber-style availability, prescriptions, referral letters, sick notes, incentive tiers
- **Lab integration** — HMAC-verified result webhooks (Lancet, Ampath, Lab24, PathCare, NHLS)
- **Payments** — PayFast with a 15% platform / 85% doctor split
- **Patient safety** — emergency profile QR codes, push notifications, consent management

## Architecture

```
apps/mobile (Expo RN)      apps/web (Vite React)
patients + doctors         landing · beta chat · doctor cockpit · intern tools
        │                          │
        └────────────┬─────────────┘
                     ▼
             apps/api (Fastify 4)
   src/index.ts — standalone server (Docker/Render)
   src/app.ts   — shared app, wrapped by api/[...path].ts on Vercel
        │            │            │
        ▼            ▼            ▼
   PostgreSQL      Redis      Anthropic Claude
   (Prisma,      (sessions,   (de-identified data
    encrypted     cache,       only — PII redacted
    at rest)      rate limit)  at the boundary)
```

External integrations: PayFast (payments), Twilio (SMS/OTP), AWS S3 `af-south-1`
(encrypted documents), Expo push, HPCSA verification, lab webhooks.

## Monorepo layout

```
med-ai/
├── apps/
│   ├── api/           # Fastify + Prisma + Redis + Anthropic backend
│   ├── mobile/        # Expo 51 React Native app (patients + doctors)
│   └── web/           # Vite React app (landing, beta chat, cockpit, intern tools)
├── packages/
│   └── shared/        # Shared TypeScript types
├── prisma/            # PostgreSQL schema + migrations
├── api/[...path].ts   # Vercel serverless entry (wraps apps/api/src/app.ts)
├── vercel.json        # Vercel build + rewrites
├── render.yaml        # Render blueprint (beta server)
└── docker-compose.yml # Local PostgreSQL + Redis
```

## Quickstart

Prerequisites: Node.js 20+, Docker (or a local PostgreSQL 16 + Redis), an
Anthropic API key.

```bash
git clone https://github.com/msolwa08-hub/med-ai
cd med-ai
npm install

# Environment
cp .env.example .env          # then fill in the REQUIRED values (see below)

# Local services
docker-compose up postgres redis -d

# Database
npm run db:generate           # prisma generate
npm run db:migrate            # prisma migrate dev
npm run db:seed               # base seed data
npm run db:seed:stg           # SA Standard Treatment Guidelines / EML seed

# Run
npm run dev:api               # Fastify API on :3000
npm run dev:web               # Vite web app
npm run dev:mobile            # Expo mobile app (separate terminal)
```

For the mobile app, set `EXPO_PUBLIC_API_URL` (see `apps/mobile/.env.example`)
to your machine's LAN IP so a phone on the same network can reach the API.

### Environment variables

`apps/api/src/config.ts` is the source of truth — the API refuses to boot if a
required variable is missing or malformed. Both `.env.example` (repo root, local
dev defaults) and `apps/api/.env.example` (Supabase/Upstash flavour) document
every variable with required/optional markers.

Required: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ENCRYPTION_KEY`
(exactly 64 hex chars), `ANTHROPIC_API_KEY`. Everything else has sensible
defaults or degrades gracefully. Generate secrets with `openssl rand -hex 32`.

## Testing & typecheck

```bash
npm test                  # vitest across workspaces (api)
npm run typecheck         # tsc --noEmit for api, web, shared
npm run typecheck:mobile  # mobile app (has known pre-existing errors)
npm run lint              # eslint where configured
```

## Deployment

- **Production profiles** (start here): see [DEPLOYMENT.md](DEPLOYMENT.md) —
  **Profile A: Closed Server** (private practice, `docker-compose.closed-server.yml`,
  billing off-platform) vs **Profile B: Open Cloud** (marketplace on managed
  services with `PAYMENT_ENFORCEMENT=true`).
- **Vercel** (web CDN + serverless API): see [VERCEL-DEPLOY.md](VERCEL-DEPLOY.md).
  `vercel.json` builds `apps/web` to static assets and rewrites `/beta/*`,
  `/cockpit/*`, `/tools/*` and `/health` to the `api/[...path].ts` function.
- **Render** (single beta service, no laptop needed): see [BETA-DEPLOY.md](BETA-DEPLOY.md) and `render.yaml`.
- **Hugging Face Spaces**: see [HUGGINGFACE-DEPLOY.md](HUGGINGFACE-DEPLOY.md).
- **Docker**: `Dockerfile` runs the standalone server (`apps/api/src/index.ts`).

Run `npm run db:migrate:prod` (in `apps/api`: `prisma migrate deploy`) against
production databases instead of `db:migrate`.

## Security & POPIA

Patient medical data is special personal information under POPIA, and every AI
call is a cross-border transfer (s72). Key controls:

- **Per-consultation encryption** — AES-256-GCM envelope encryption; a master
  key (`ENCRYPTION_KEY`) wraps per-consultation data keys.
- **De-identification at the AI boundary** — direct identifiers (names, SA ID
  numbers, phone numbers, medical aid numbers) are redacted or token-substituted
  before anything reaches the model; only the stored transcript keeps full fidelity.
- **Consent gate** — set `ENFORCE_AI_PROCESSING_CONSENT=true` to require a
  granted, non-expired `DATA_PROCESSING` consent record before any model call.
- **Audit trail** of every data access and AI processing event.

See [POPIA-COMPLIANCE.md](POPIA-COMPLIANCE.md) for the full control matrix and
outstanding organisational steps.
