# Novoriq Flow Android Packaging

## Overview

Novoriq Flow now ships with a real Android target using Capacitor.

This packaging layer preserves the existing V1-V7 Next.js product, keeps the web app and PWA intact, and avoids a destructive rewrite into a separate native codebase.

## Architecture Decision

### Chosen path

- Keep the existing Next.js app as the source of truth.
- Package the product with Capacitor for Android.
- Use a hosted runtime inside the Android WebView via `server.url`.
- Keep a small local fallback shell for launch, offline, and error handling.

### Why this path was chosen

The current V7 app uses dynamic Next.js routes, layered client providers, local-first runtime state, and server-backed snapshot sync. Forcing a static-export-only Android build would have been brittle and would risk breaking the full product.

The safer V1 Android delivery is:

- Web app remains healthy.
- PWA remains healthy.
- Android app is real and installable.
- The same deployed product powers the app experience.
- The codebase stays maintainable for future V8+ work.

## Runtime Model

### Android runtime

- Capacitor app id: `com.novoriq.flow`
- Capacitor app name: `Novoriq Flow`
- Default hosted app URL: `https://novoriqlimited.netlify.app`
- Local fallback shell path: `capacitor-shell/`

The Android app opens the hosted Flow app inside Capacitor and uses a branded local shell as the fallback/error surface.

### Important limitation

This is not a fully bundled offline native build of the full Flow product.

The Android app currently depends on the hosted Flow runtime for the complete V1-V7 experience. This was an intentional decision to preserve the working app without forcing a risky rewrite.

## Key Files

- `capacitor.config.ts`
- `capacitor-shell/index.html`
- `capacitor-shell/offline.html`
- `components/shared/native-app-provider.tsx`
- `components/shared/pwa-provider.tsx`
- `app/layout.tsx`
- `app/globals.css`
- `android/`

## Native Behavior Added

### Android container

- Capacitor Android platform added
- Android Studio project generated under `android/`
- production-minded package id: `com.novoriq.flow`

### Native UX polish

- branded Android splash theme
- adaptive launcher icon
- themed monochrome launcher icon
- dark status/navigation bar treatment
- keyboard resize handling for forms
- Android safe-area styling hooks
- external links open with Capacitor Browser
- hardware back button handling for in-app navigation

### Web/PWA coexistence

- web and PWA behavior remain intact
- PWA install behavior is suppressed in native mode
- service worker registration stays web-only

## Build Instructions

### Install dependencies

```bash
npm install
```

### Build the web app first

```bash
npm run build
```

### Sync Capacitor assets and config

```bash
npm run cap:sync
```

### Open Android Studio project

```bash
npm run cap:open
```

### Build debug APK from CLI

```bash
cd android
GRADLE_USER_HOME=/tmp/novoriq-flow-gradle \
ANDROID_HOME=/home/falcon/Android/Sdk \
ANDROID_SDK_ROOT=/home/falcon/Android/Sdk \
./gradlew assembleDebug --no-daemon --console plain
```

### Debug APK output

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

## Configuration Notes

### Change the hosted runtime URL

If you want the Android app to point to a different deployed environment, set:

```bash
CAPACITOR_SERVER_URL=https://your-hosted-flow-url.example
```

Then sync again:

```bash
npm run cap:sync
```

### Web checks

Because Next.js type generation is part of the build flow in this repo, the reliable validation order is:

```bash
npm run build
npm run typecheck
```

## Manual Test Checklist

### Android packaging

- app launches on Android
- splash screen shows correctly
- launcher icon displays correctly
- themed icon works on supported Android launchers
- app name displays as `Novoriq Flow`

### Auth and session

- sign in works
- session persists after app restart
- sign out works
- onboarding works
- redirects after login behave correctly

### Mobile UX

- dashboard loads on phone screen sizes
- drawer/sidebar works
- back button behavior is correct
- forms remain usable with Android keyboard
- dialogs and sheets remain usable
- tables remain readable on phone screens
- no major horizontal overflow appears

### Product preservation

- core V1 flows still work
- V2 receivables/payables/purchases still work
- V3 branches/approvals/inventory-lite still work
- V4 network flows still load
- V5 finance flows still load
- V6 enterprise controls still load
- V7 assistant, automations, recommendations, and action center still load

### Web/PWA preservation

- web app still runs
- PWA still installs on supported browsers
- native app does not show the web install button

## Assumptions

- The safest Android V1 path is to use the hosted Flow runtime instead of forcing a static-export rewrite.
- Existing brand assets were not available as a full Android asset pack, so production-minded placeholder native assets were created and can be swapped later.
- This packaging work preserves current behavior; it does not claim full offline-native parity for the entire Next.js product.

## Preservation Confirmation

This Android packaging pass preserves the existing layered Novoriq Flow architecture and does not intentionally remove or rewrite V1-V7 business functionality.

The web app remains the main source of truth, the PWA remains intact, and the Android app now exists as a real Capacitor target with a clean upgrade path for future deeper native work.
