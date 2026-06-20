# MedAI — Free trial link from your iPhone (no card, ever)

This puts MedAI online for free using **Hugging Face Spaces**. You do it all in
Safari on your iPhone. No payment method anywhere.

You'll end up with a link like `https://YOURNAME-medai.hf.space` that opens:
- the patient app at the link itself
- the doctor cockpit at the link + `/doctor`
- your intern tools at the link + `/tools`

There are four short stages. Do them in order. If any screen looks different
from what's written, send me a screenshot and I'll tell you exactly what to tap.

---

## Stage A — Make the code repo public (one-time, safe)

The free host needs to read the code. Your repo has **no secrets in it** (your
API key is not stored there), so this is safe.

1. In Safari, go to **github.com** and sign in.
2. Open your repository **med-ai**.
3. Tap **aA** in the address bar → **Request Desktop Website** (so you can see Settings).
4. Open **Settings** (gear/tab near the top) → scroll to the bottom, the
   **Danger Zone**.
5. **Change repository visibility** → **Make public** → confirm by typing the
   repo name.

---

## Stage B — Get your Anthropic API key (this is what pays per use)

1. In Safari: **console.anthropic.com** → sign in (`msolwa08@gmail.com`).
2. **API Keys → Create Key** → copy it (starts with `sk-ant-...`). Keep it handy.

---

## Stage C — Create the Hugging Face Space

1. Go to **huggingface.co** → **Sign Up** (free, just email — no card).
2. Go to **huggingface.co/new-space**.
3. Fill in:
   - **Owner:** you
   - **Space name:** `medai`
   - **Space SDK:** choose **Docker** → **Blank**
   - **Hardware:** **CPU basic** (the free one)
   - **Visibility:** Public
4. Tap **Create Space**.

---

## Stage D — Add the one file + your secrets

**The file:**
1. In your new Space, open the **Files** tab → **+ Add file** → **Create a new file**.
2. Name it exactly `Dockerfile` (capital D, no extension).
3. Paste in everything from the `huggingface/Dockerfile` in this repo (I'll paste
   it for you in chat).
4. **Commit** the file.

**The secrets** (so the app has your key and login codes):
5. Open the Space's **Settings** → **Variables and secrets** → **New secret**, and
   add these four (tap New secret each time):

   | Name | Value |
   |---|---|
   | `ANTHROPIC_API_KEY` | your `sk-ant-...` key |
   | `BETA_ACCESS_KEYS` | `MEDAI-BETA-TRIAL` |
   | `BETA_DOCTOR_KEYS` | `MEDAI-DOC-TRIAL` |
   | `BETA_TOOLS_KEYS` | `MEDAI-INTERN-TRIAL` |

6. The Space rebuilds automatically (watch the **Logs**/**App** tab). First build
   takes ~5–8 minutes. When it says **Running**, open the app — tap the
   three-dots ⋯ on the Space → **Embed this Space** → the **Direct URL**, or just
   visit `https://YOURNAME-medai.hf.space`.

---

## Using it
- **Patient:** open the link → key `MEDAI-BETA-TRIAL`.
- **Doctor:** link + `/doctor` → key `MEDAI-DOC-TRIAL`.
- **Intern tools:** link + `/tools` → key `MEDAI-INTERN-TRIAL`.

## Notes
- **Free.** Hugging Face CPU-basic Spaces are free. You only pay Anthropic for AI
  usage (a few cents per conversation).
- **Sleeping:** a free Space pauses after inactivity; the next visit wakes it
  (about a minute the first time).
- **Keep the keys private** — anyone with the link and a key can spend your
  Anthropic credit.
- The repo must stay public for the Space to rebuild. If you later want it
  private again, tell me and I'll switch the Space to pull with a private token.
