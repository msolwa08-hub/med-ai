# MedAI — Session Continuity Status

**Last updated:** 2026-07-17
**Branch:** `claude/ai-medical-history-app-1lh4wv`
**Latest commit:** `3b6b31b` — feat: implement Family Medicine / PHC department

## Current state

The app is **feature-complete for beta use**. All 10 departments (Internal
Medicine, Surgery, Emergency, ICU, O&G, Paediatrics, Orthopaedics, Psychiatry,
Anaesthetics, Family Medicine) carry consultant-depth dossiers,
loop-gated at 100/100 each. The two-glance encounter model (M-GLANCE) is
shipped and certified. The Calm Clinical design system is fully applied with
dark mode, Inter Variable font, and semantic tokens.

### Session 1 work (completed)

Built the product from ground zero through milestone M2 (all departments) and
M-UI through M-GLANCE (the user's product model reset). Key milestones:

- M1: bedside loop (weighted differential + discriminating Ix + results feedback)
- M2: loop across all 10 departments, each gated 100/100
- M-UI: Calm Clinical design system (tokens, Inter, lucide, framer-motion, dark mode)
- M-UI/2–8: premium redesign, tap-driven cockpit, exam capture, organ-system map
- M-GLANCE: the two-glance encounter (chatbox + photo = the only input; briefing + picture + paper-notes block)
- M-FINAL/R: deploy certification (Render auto-deploys from the branch)

Full milestone history: `docs/clinical-build/STATUS.md`

### Session 2 work (this session)

A deep-audit-driven polish campaign — 8 waves of improvements:

| Wave | Scope | Commit(s) |
|------|-------|-----------|
| 1 | Shell simplification, tab reorder, settings panel | `dbc5de6` |
| 2 | Clinical safety display rebuild, prompt caching, PWA offline | `6179cd7` |
| 3 | Round tab rewrite, landing page simplification, clinical language | `e2372ab` |
| 4 | Security (CSP headers, session auth), accessibility (ARIA, touch targets), UX fixes across 26 files | `f8c0b50`, `b7f6169` |
| 5 | Performance — prompt caching, model tiering | (folded into Wave 2) |
| 6 | Mobile-first rebuild, offline support, security | (folded into Wave 2) |
| 7 | Empty states, loading indicators, guidance text | `000a771` |
| 8 | Keyboard shortcuts (Cmd+1-6/K/N), tab transitions, skeleton loaders for all AI panels | `90d2e24`, `dc138b4` |
| Text sweep | Strip excessive explanatory/coaching text, compact differential display | `76106ab` |
| Family Med | Full Family Medicine / PHC department across all 12 registries | `3b6b31b` |

## Architecture overview

```
apps/
  web/          React + Vite + Tailwind (the intern-facing app)
    src/
      tools/    The clinical tools workspace (the main product)
        config/ Department registries, symptom cascades, exam checklists,
                treatment sets, smart blocks, briefings
        fields/ Per-department field definitions + types
        tabs/   ClerkTab, ProblemsTab, RoundTab, DocumentsTab,
                FormulasTab, SpecialistTab
        components/ QuickBar, WorkingPicturePanel, ExamCapture,
                    AssistPanel, StageCard, SlideOver, SettingsPanel, etc.
        state/  useToolsState hook (patient/tab/dept state)
        lib/    patientContext, investigations, clinicalText, systemsMap
      components/ Landing page, ChatView, AccessKeyGate
  api/          Fastify + Anthropic Claude (the clinical engine)
    src/
      services/ confidence-engine, tools-assist, prompt caching
      routes/   beta.ts (tools endpoints), tools/*.ts (individual routes)
    eval/       Stress harness (loop scoring per department)
```

## Key technical details for a new session

1. **Design tokens** — `tailwind.config.js` extends with semantic tokens
   (text-ink, bg-surface, border-line, text-brand-*, text-danger, text-warn,
   text-positive, etc.) backed by CSS variables in `index.css`. Use tokens,
   never raw Tailwind colors.

2. **Touch targets** — 44px minimum (`min-h-[44px]` or `h-11`), WCAG/Apple
   standard. Applied everywhere.

3. **Skeleton loaders** — use the `.skeleton` CSS class (pulse animation,
   dark-mode and reduced-motion aware). Currently on: WorkingPicturePanel,
   RoundTab, ProblemsTab, AssistPanel, SpecialistTab.

4. **Keyboard shortcuts** — Cmd+1-6 tab switch, Cmd+K QuickBar focus, Cmd+N
   new patient. Hints visible on hover (desktop only, `lg:` breakpoint).

5. **API key** — lives in gitignored `apps/api/.env` only. The key in the
   repo's `.env` needs rotation (it was pasted in chat). Never commit keys.

6. **No live API calls** — all implementation is code-analysis only. The
   harness needs a live key to score, but product development does not.

7. **CSP** — `@fastify/helmet` with strict Content-Security-Policy in both
   `app.ts` and `index.ts`.

8. **PWA** — service worker with offline caching (`sw.ts`), manifest,
   `useOnlineStatus` hook.

9. **Motion** — `framer-motion` for hero moments (WorkingPicture confidence
   bars, tab transitions, panel reveals), CSS for the rest. Always honor
   `useReducedMotion()`.

10. **Commit convention** — descriptive messages, always push to the designated
    branch. No PRs unless the user asks.

## What's next (suggested for Session 3+)

1. **Real-world beta feedback** — Muhammad is using the app in his internship.
   His feedback becomes the prioritized backlog.

2. **Streaming responses** — the confidence engine and ward round currently
   wait for the full response. Streaming would improve perceived latency.

3. **E2E tests** — Playwright tests exist but the suite could be expanded to
   cover the full two-glance flow per department.

4. **Cost optimization** — Haiku 4.5 on light calls (harness-gated), prompt
   caching expansion. Current: ~8-10c/loop.

## Standing constraints

- Push ONLY to `claude/ai-medical-history-app-1lh4wv`
- No PRs unless asked
- No free-hand drug doses — research, implement, flag for clinician sign-off
- Live key only in gitignored `.env`
- The plan file at `/root/.claude/plans/resilient-seeking-beaver.md` is the
  master vision document
- Full milestone history at `docs/clinical-build/STATUS.md`
