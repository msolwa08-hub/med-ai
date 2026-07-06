# MedAI — Set up your trial (no laptop needed)

Everything below is done in your phone or computer browser. The whole thing is
**one service** — patient app, doctor cockpit, and your personal intern tools all
run together, with **one URL** to open.

When you're done you'll have:

| What | Where | Who it's for |
|---|---|---|
| Patient history-taker | `your-url.onrender.com/` | patients |
| Doctor cockpit | `your-url.onrender.com/doctor` | the clinician |
| Personal intern tools | `your-url.onrender.com/tools` | you |

---

## Step 1 — Get an Anthropic API key (2 min)

1. Open **console.anthropic.com** and sign in (your `msolwa08@gmail.com` account).
2. Go to **API Keys** → **Create Key** → copy it (it starts with `sk-ant-...`).
3. Keep that tab open — you'll paste it in Step 3.

> This is what pays for the AI. Cost is only a few cents per conversation.

---

## Step 2 — Create the Render service (3 min)

1. Open **render.com** and **Sign in with GitHub** (the account that owns
   `msolwa08-hub/med-ai`).
2. Tap **New** → **Blueprint**.
3. Pick the repository **`msolwa08-hub/med-ai`**.
4. Render reads `render.yaml` and shows a service called **medai-beta**
   (already set to build the correct branch). Tap **Apply** / **Create**.

---

## Step 3 — Fill in the values (2 min)

Render will ask you for the values below. The first is your secret key; the
access keys are the "passwords" people type to get into each part of the app —
change them later if you like.

| Variable | What to paste | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | your `sk-ant-...` key from Step 1 | Required |
| `BETA_ACCESS_KEYS` | `MEDAI-BETA-TRIAL` | Patient / history-taker access |
| `BETA_DOCTOR_KEYS` | `MEDAI-DOC-TRIAL` | Doctor cockpit + analytics |
| `BETA_TOOLS_KEYS` | `MEDAI-INTERN-TRIAL` | Intern tools |
| `BETA_DOCTOR_NAME` | e.g. `Dr. Smith` | Your name — shown in the AI greeting and summaries |
| `BETA_PRACTICE_NAME` | e.g. `Cape Town City Practice` | Your practice name — shown throughout the app |

`JWT_SECRET` and `JWT_REFRESH_SECRET` are filled in automatically. Leave
`DATABASE_URL` blank for now — see the optional step right below.

Tap **Save** / **Deploy**.

> **Optional — turn on durable storage (sessions/protocols survive restarts):**
> Render's free tier only allows **one** free Postgres database per account,
> so this Blueprint does NOT try to create one for you automatically (an
> earlier version of this file did, and it broke the deploy for anyone who
> already had a free database elsewhere on their account). If you want
> persistence: create a free Postgres database yourself (Render dashboard →
> **New** → **PostgreSQL** → free plan), copy its **Internal Connection
> String**, and paste it into `DATABASE_URL` under this service's
> Environment tab. Leave it blank and the app runs exactly as documented below
> — memory-only, nothing broken.
>
> **Optional — turn on the doctor-dispatch marketplace ("nearby doctors"):**
> the code for this ships in every deploy but stays switched off until BOTH
> `DATABASE_URL` (above) and one more variable, `ENCRYPTION_KEY` (exactly 64
> hex characters — generate with `openssl rand -hex 32`, or ask me to generate
> one for you), are set. Leave either unset and the app runs exactly as
> described below — nothing else changes.

---

## Step 4 — Wait for the build (~4 min)

Render builds and starts the app. When the status turns **green / Live**, tap the
URL at the top (looks like `https://medai-beta-xxxx.onrender.com`). That's your app.

---

## Step 5 — Take it for a spin

**As a patient** — open the URL, type `MEDAI-BETA-TRIAL`, and chat: say what's
bothering you and answer the questions. When it finishes, it hands a summary to
the doctor side.

**As the doctor** — open `your-url/doctor`, type `MEDAI-DOC-TRIAL`. You'll see the
consult you just did. Open it → add some examination findings → **Generate
clinical package** → review the differentials, draft script and sick note →
tick the box and **sign**.

**Your intern tools** — open `your-url/tools`, type `MEDAI-INTERN-TRIAL`, and try
a discharge summary, referral letter, or daily ward note (paste some notes,
pick the specialty, generate).

---

## Notes

- **Cost:** only the Anthropic tokens per conversation (a few cents each on
  Sonnet 4.6 with prompt caching). The free Render plan needs no payment but
  **sleeps when idle** — the first visit after a nap takes ~30 seconds to wake.
- **Keys = access + cost.** Anyone with the URL *and* a valid key can use it and
  spend your Anthropic credits, so don't post the keys publicly. Change them any
  time: Render dashboard → your service → **Environment** → edit → save.
- **Saved data:** without `DATABASE_URL` set, sessions and uploaded protocols
  live in memory only and are lost on restart/redeploy (same as before this
  feature existed). Set `DATABASE_URL` (see Step 3) to make them durable.
  Render's free Postgres expires after about 30 days either way — if that
  happens the app doesn't break, it just quietly drops back to memory-only
  mode until you create a fresh free database and point `DATABASE_URL` at it.
- **Region:** Frankfurt (closest free Render region to South Africa).

---

## Prefer to run it on your own computer instead?

Tell me your computer type (Mac or Windows) and I'll give you the local recipe —
it's a Node.js install plus about four copy-paste commands.
