# MedAI Mobile — Build & Release (EAS)

The mobile app is Expo SDK 51 (React Native 0.74). Builds go through **EAS
Build**; store submission through **EAS Submit**. This doc gets a fresh machine
from clone to a store-ready binary.

## One-time setup

```bash
npm i -g eas-cli
eas login                       # Expo account with access to the MedAI project
cd apps/mobile
eas init                        # creates/links the project, writes the real
                                # projectId into app.json + updates.url
```

> `app.json` ships with the placeholder `medai-project-id` in two places
> (`extra.eas.projectId` and `updates.url`). `eas init` replaces both with the
> real project ID — do that before the first build or EAS Update channels won't
> resolve.

## Configuration

- **API endpoint** is baked in per build profile via `EXPO_PUBLIC_API_URL` in
  `eas.json` (the app also reads it from the environment; the runtime fallback
  in `src/api/client.ts` is the production URL). Update the three URLs in
  `eas.json` to your real hosts:
  - `development` → your LAN IP (phone must share WiFi with the API machine)
  - `preview` → staging API
  - `production` → `https://api.medai.co.za/v1`
- **Identifiers**: iOS `co.za.medai`, Android `co.za.medai` (in `app.json`).
- **Permissions** are declared in `app.json` (location for dispatch, camera +
  photo library for document/USS upload, notifications for dispatch pings). iOS
  usage strings are in `ios.infoPlist`.

## Build profiles (`eas.json`)

| Profile | Distribution | Output | Use |
|---|---|---|---|
| `development` | internal | dev client (APK / simulator) | day-to-day dev with hot reload |
| `preview` | internal | APK / internal TestFlight | stakeholder / QA testing |
| `production` | store | AAB / IPA, auto-incremented | App Store + Play Store |

```bash
npm run build:preview            # both platforms, internal distribution
npm run build:android            # production AAB
npm run build:ios                # production IPA (needs Apple credentials)
```

## Store submission

Fill the real values in `eas.json` → `submit.production` first:
- iOS: `appleId`, `ascAppId`, `appleTeamId`
- Android: place the Play service-account JSON at
  `apps/mobile/play-store-service-account.json` (gitignored — never commit it)

```bash
npm run submit:android           # → Play Console internal track
npm run submit:ios               # → App Store Connect
```

## Pre-submission checklist

- [ ] `eas init` run; real projectId in `app.json` + `updates.url`
- [ ] All three `EXPO_PUBLIC_API_URL`s point at real hosts (no `192.168.*` in prod)
- [ ] Production API reachable over HTTPS with a valid cert
- [ ] App icons / splash present in `assets/` (icon, adaptive-icon, splash, notification-icon)
- [ ] Apple + Google store listings created; privacy labels reflect PII + health data
- [ ] POPIA privacy policy URL live and linked in both store listings
- [ ] `play-store-service-account.json` present locally, not committed
