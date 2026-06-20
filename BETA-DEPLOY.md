# MedAI Beta — Deploy from your phone

No laptop needed. Everything below is done in your phone's browser. The whole
thing is **one service** (web app + API together), so there's only one thing to
deploy and one URL to share.

---

## What you'll end up with

- A public `https://medai-beta-xxxx.onrender.com` URL
- An access-key gate — only people with a key you generate can use it
- The validated history-taking AI + the GP Clinical Summary (differentials,
  exam, investigations, management) for the clinician view

---

## Step 1 — Get an Anthropic API key (2 min)

1. On your phone, open **console.anthropic.com**
2. Sign in → **API Keys** → **Create Key**
3. Copy it (starts with `sk-ant-...`). Keep this tab handy — you'll paste it in Step 3.

> The key in this repo's `.env` is never committed, so you'll use a fresh one here.

---

## Step 2 — Create the Render service (3 min)

1. On your phone, open **render.com** → sign in **with GitHub**
2. Tap **New** → **Blueprint**
3. Pick the repository **`msolwa08-hub/med-ai`**
4. Render detects `render.yaml` automatically and shows a service called **medai-beta**
5. Tap **Apply** / **Create**

---

## Step 3 — Set your two secrets (2 min)

Render will prompt for the two values marked `sync: false`:

| Variable | What to paste |
|---|---|
| `ANTHROPIC_API_KEY` | the `sk-ant-...` key from Step 1 |
| `BETA_ACCESS_KEYS`  | your access keys, comma-separated (see below) |

**Access keys** — make up anything memorable, comma-separated, e.g.:
```
MEDAI-BETA-SARAH,MEDAI-BETA-THABO,MEDAI-BETA-AMARA
```
Each friend gets one. They type it into the app's first screen to get in.

Tap **Save** / **Deploy**.

---

## Step 4 — Wait for the build (~4 min)

Render builds the Docker image and starts the service. When the status goes
**green / Live**, tap the URL at the top — that's your app.

Test it: enter one of your access keys → you should see MedAI greet you and ask
how you're feeling.

---

## Sharing with your med-student friends

Send each person:
- the **URL** (same for everyone)
- **one access key** from your `BETA_ACCESS_KEYS` list

To add or revoke keys later: Render dashboard → your service → **Environment** →
edit `BETA_ACCESS_KEYS` → save (it redeploys in ~1 min).

---

## Notes

- **Cost:** the only usage cost is Anthropic API tokens per conversation
  (roughly a few cents each on Sonnet 4.6 with prompt caching). Render's
  starter plan is a small fixed monthly fee; a free plan works too but sleeps
  when idle (first request after a nap takes ~30s to wake).
- **No database:** sessions live in memory for 3 hours, then clear. Nothing
  patient-identifiable is stored. (Longitudinal memory across visits is a
  later phase.)
- **Region:** set to Frankfurt — the closest Render region to South Africa.

---

## Alternative host (Railway)

If you prefer Railway: railway.app → **New Project** → **Deploy from GitHub** →
pick the repo → it reads the `Dockerfile` → add the same two env vars in
**Variables**. Same result.
