# Deploy MedAI Beta to Vercel

A single-platform deploy: the React web app runs on Vercel's static CDN, and the
beta API (patient history chat, doctor cockpit, intern tools) runs as one Vercel
serverless function. Session state lives in **Vercel KV** so it survives cold
starts, redeploys, and concurrent instances.

> Already on Render? That still works and needs no changes — this is an
> alternative, not a replacement. Vercel gives you a faster global CDN for the
> web app and no cold-start container spin-up for the API.

---

## How it fits together

```
Browser
  ├─ /  /patient  /doctor  /tools      → static SPA  (apps/web/dist on Vercel CDN)
  └─ /beta/*  /cockpit/*  /tools/*  /health
                                       → serverless function (api/[...path].ts)
                                          └─ shared Fastify app (apps/api/src/app.ts)
                                              └─ sessions → Vercel KV (Upstash Redis)
```

- `vercel.json` builds the web app (`npm run build:web` → `apps/web/dist`) and
  rewrites the API paths to the function.
- `api/[...path].ts` strips the `/api` prefix and emits the request into Fastify.
- `apps/api/src/session-store.ts` uses Vercel KV when `KV_REST_API_URL` +
  `KV_REST_API_TOKEN` are present, otherwise an in-memory + disk store.

**Why KV matters:** serverless functions don't share memory. Without KV, a
patient's second chat message could land on a different instance than the first
and the session would be "not found." Enable KV (free tier is fine) before
sharing the link with real users.

---

## One-time setup

### 1. Import the repo

1. Go to <https://vercel.com/new> and import `msolwa08-hub/med-ai`.
2. **Root Directory:** leave as the repository root (`.`). Do **not** set it to
   `apps/web` — `vercel.json` at the root drives the whole build.
3. Framework Preset: **Other** (the `vercel.json` already configures everything).
4. Don't deploy yet — add the environment variables first (next step).

### 2. Add environment variables

Project → **Settings → Environment Variables**. Add these for the **Production**
(and Preview, if you want) environment:

| Variable             | Required | Example / notes                                              |
| -------------------- | -------- | ----------------------------------------------------------- |
| `ANTHROPIC_API_KEY`  | ✅ yes   | `sk-ant-api03-…` — your Claude API key                       |
| `BETA_ACCESS_KEYS`   | ✅ yes   | Patient keys, comma-separated, e.g. `MEDAI-BETA-TRIAL`      |
| `BETA_DOCTOR_KEYS`   | ✅ yes   | Doctor cockpit / analytics keys, e.g. `MEDAI-DOC-TRIAL`     |
| `BETA_TOOLS_KEYS`    | ✅ yes   | Intern-tools keys, e.g. `MEDAI-INTERN-TRIAL`               |
| `BETA_DOCTOR_NAME`   | optional | Shown in the AI greeting & summaries, e.g. `Dr. Smith`      |
| `BETA_PRACTICE_NAME` | optional | e.g. `Cape Town City Practice`                              |

If you leave a `BETA_*_KEYS` var **unset**, it falls back to its dev default
(`MEDAI-BETA-DEV`, `MEDAI-DOC-DEV`, `MEDAI-INTERN-DEV`). Don't set them to an
empty string — set a real value or omit them entirely.

### 3. Enable Vercel KV (session storage)

1. Project → **Storage → Create Database → KV**.
2. Name it (e.g. `medai-sessions`) and create it.
3. **Connect** it to this project. Vercel automatically injects
   `KV_REST_API_URL`, `KV_REST_API_TOKEN` (and friends) as environment
   variables — no manual copying needed.
4. The session store detects these and switches to KV on the next deploy.

> Skipping KV? The app still deploys and the patient chat works for a single
> warm instance, but sessions can drop under cold starts or concurrent users.
> Fine for a quick solo demo; enable KV before a real beta.

### 4. Deploy

Click **Deploy** (or push to the `claude/ai-medical-history-app-vhsw63` branch —
Vercel auto-deploys connected branches). First build takes a couple of minutes.

When it's live:

- Patient history: `https://<your-app>.vercel.app/patient`
- Doctor cockpit:  `https://<your-app>.vercel.app/doctor`
- Intern tools:    `https://<your-app>.vercel.app/tools`
- Health check:    `https://<your-app>.vercel.app/health` → `{"status":"ok",…}`

---

## CLI deploy (alternative)

```bash
npm i -g vercel
vercel link          # pick the med-ai project
vercel env add ANTHROPIC_API_KEY production   # repeat for each var above
vercel --prod
```

---

## Function duration & plan note

Patient chat turns are quick (a single short Claude call). The **clinical
summary** and the **doctor's clinical package** make larger Claude calls that can
take 15–40s. `vercel.json` sets `maxDuration: 60` for the function.

- On **Hobby (free)**: enable **Fluid Compute** (Project → Settings → Functions)
  to allow longer runs; otherwise long generations may hit the timeout.
- On **Pro**: 60s works out of the box.

If a summary or package times out, that's the cause — bump the plan/Fluid
Compute, or shorten the generation.

---

## Troubleshooting

- **"Valid doctor key required" on the analytics screen** — the key you typed
  isn't in `BETA_DOCTOR_KEYS`. Check the value in Settings → Environment
  Variables (or use the dev default `MEDAI-DOC-DEV` if the var is unset).
- **Chat says "Session not found"** — KV isn't connected. Create + connect a KV
  database (step 3) and redeploy.
- **API returns 500 on every call** — `ANTHROPIC_API_KEY` is missing or invalid.
- **The function build fails resolving `apps/api/src/...`** — make sure the
  project **Root Directory** is the repo root, not `apps/web`.
