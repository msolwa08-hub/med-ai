# MedAI — Production Deployment Profiles

MedAI ships as one codebase with **two supported deployment profiles**. Pick the
profile first — every other decision (env vars, billing, infrastructure) follows
from it.

| | **Profile A — Closed Server** | **Profile B — Open Cloud** |
|---|---|---|
| Who it's for | A private practice / clinic running MedAI as its own clinical tool | The MedAI marketplace connecting patients to nearby doctors |
| Tenancy | Single practice, known doctors | Multi-doctor, open registration (HPCSA-verified) |
| Infrastructure | Docker Compose on a practice server or SA VPS | Managed services (Supabase / Upstash / Render / Fly.io) |
| Patient data location | On the practice's own hardware | af-south-1 (Cape Town) managed Postgres |
| Billing | Off-platform (medical aid / practice billing) → `PAYMENT_ENFORCEMENT=false` | In-app PayFast + cash marking → `PAYMENT_ENFORCEMENT=true` |
| Dispatch / geolocation | Optional (single-practice queue works without it) | Core — availability TTL, geo-scoped triaged queue, push dispatch |
| POPIA AI consent gate | Recommended once onboarding captures it | Required: `ENFORCE_AI_PROCESSING_CONSENT=true` |

Both profiles run the same clinical chain: AI history → triage → examination →
investigations (`/analysis`: labs, X-ray, ECG, ultrasound) → STG-linked
differentials → confirmed ICD-10 diagnosis → STG-driven management draft →
safety-gated prescriptions → documents → follow-up.

---

## Shared prerequisites (both profiles)

- Node 20+, PostgreSQL 16, Redis 7
- An Anthropic API key (`ANTHROPIC_API_KEY`) — powers all AI paths
- Secrets generated fresh per deployment (never reuse dev values):

```bash
node -e "console.log('JWT_SECRET='         + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('ENCRYPTION_KEY='     + require('crypto').randomBytes(32).toString('hex'))"
```

> **ENCRYPTION_KEY is unrecoverable.** It is the master key for the AES-256-GCM
> envelope encryption on every consultation. Losing it means losing every
> patient record. Store it in a secrets manager (and an offline copy in the
> practice safe for Profile A). Rotating it requires a re-encryption migration —
> plan for that before go-live, not after.

Database setup (both profiles):

```bash
npx prisma migrate deploy          # applies the committed migration chain
npm run db:seed                    # dev/demo users — SKIP in production
npm run db:seed:stg --workspace=apps/api   # SA STG guideline dataset (required)
```

Verification (both profiles, against the running API):

```bash
npm run smoke            # 29 core paths: auth, consent, encryption, RBAC
npm run smoke:ai         # 21 AI paths: history→triage→dispatch→reasoning→ICD-10→management→analysis
npm run smoke:anc        # antenatal follow-up continuity across consultations
npm run smoke:payments   # (only with PAYMENT_ENFORCEMENT=true) billing gate
```

---

## Profile A — Closed Server (private practice)

Everything on hardware the practice controls. One `docker-compose` file brings
up Postgres, Redis and the API; patient data never leaves the box except the
de-identified AI calls to Anthropic.

### 1. Configure

```bash
cp apps/api/.env.example apps/api/.env
```

Set in `apps/api/.env`:

```bash
NODE_ENV=production
API_URL=https://medai.<practice-domain>          # or the LAN address
FRONTEND_URL=https://app.<practice-domain>
DATABASE_URL=postgresql://postgres:<strong-pw>@postgres:5432/medai
REDIS_URL=redis://redis:6379
JWT_SECRET=...            JWT_REFRESH_SECRET=...   ENCRYPTION_KEY=...
ANTHROPIC_API_KEY=sk-ant-...
PAYMENT_ENFORCEMENT=false                # practice bills off-platform
BETA_ACCESS_KEYS=<rotate away from the dev default>
```

### 2. Run

```bash
docker compose -f docker-compose.closed-server.yml up -d --build
docker compose -f docker-compose.closed-server.yml exec api npx prisma migrate deploy
docker compose -f docker-compose.closed-server.yml exec api npm run db:seed:stg --workspace=apps/api
```

### 3. Practice checklist

- [ ] TLS terminated in front of the API (Caddy/nginx/Traefik — the API itself is HTTP)
- [ ] Nightly `pg_dump` to encrypted off-box storage; test a restore before go-live
- [ ] `ENCRYPTION_KEY` offline copy in the practice safe
- [ ] Firewall: only 443 exposed; Postgres/Redis never internet-reachable
- [ ] POPIA: practice is the Responsible Party — register the AI processing
      (cross-border, POPIA s72) in the practice's PAIA/POPIA manual; see
      `POPIA-COMPLIANCE.md`
- [ ] Doctors registered with real HPCSA numbers (`/hpcsa` verification)

---

## Profile B — Open Cloud (marketplace)

Managed services, autoscaling API, in-app billing, open doctor registration.

### 1. Services

| Concern | Recommended | Notes |
|---|---|---|
| Postgres | Supabase (af-south-1) | Use the **pooled** URL as `DATABASE_URL`, direct URL as `DIRECT_URL` |
| Redis | Upstash | `rediss://` URL |
| API | Render / Railway / Fly.io | Health check: `GET /health` |
| Files | S3 `af-south-1` | POPIA data-residency: keep it in Cape Town |
| Payments | PayFast (live) | `PAYFAST_MERCHANT_ID/KEY/PASSPHRASE` + ITN reachable at `${API_URL}/payments/itn` |
| Push | Expo | `EXPO_ACCESS_TOKEN` — dispatch pings ride on this |

### 2. Configure (deltas from Profile A)

```bash
NODE_ENV=production
PAYMENT_ENFORCEMENT=true                 # the marketplace billing gate
ENFORCE_AI_PROCESSING_CONSENT=true       # POPIA s72 consent required for AI
AVAILABILITY_TTL_HOURS=12                # ghost-doctor cutoff for dispatch
PAYFAST_MERCHANT_ID=... PAYFAST_MERCHANT_KEY=... PAYFAST_PASSPHRASE=...
APP_URL=<mobile deep-link base>          # payment return/cancel routing
EXPO_ACCESS_TOKEN=...
LAB_WEBHOOK_SECRET=<per-provider HMAC secrets for /labs/webhook/:provider>
EMERGENCY_SECRET=<dedicated HMAC secret for emergency QR links>
```

### 3. Marketplace checklist

- [ ] PayFast ITN URL registered and reachable (it must answer 200 fast)
- [ ] `smoke:payments` run against a staging deploy with enforcement ON
- [ ] Rate limits reviewed (default 100 req/min/IP in `index.ts`)
- [ ] Doctor onboarding requires HPCSA verification before going visible
- [ ] Lab providers issued their per-provider webhook HMAC secrets
- [ ] Information Officer registered with the Information Regulator (POPIA);
      breach-notification runbook in place
- [ ] Mobile app built and submitted via EAS — see
      [apps/mobile/MOBILE-BUILD.md](apps/mobile/MOBILE-BUILD.md) — with the
      production profile pointing at the production `API_URL`

---

## What payment enforcement actually gates (Profile B)

Care is never blocked by billing. The gate sits only at the **billable
deliverables**:

| Stage | Gated? |
|---|---|
| Booking, AI history, triage, dispatch | never |
| Examination, `/analysis`, reasoning, diagnosis | never |
| **Prescription issuance** | 402 until paid |
| **Consultation completion** | 402 until paid |
| Any EMERGENCY-triaged consultation | exempt end-to-end |

Doctors clear the gate in-room with `POST /payments/cash/:consultationId`
(cash / medical-aid), or the patient pays via the PayFast URL from
`POST /payments/initiate`.
