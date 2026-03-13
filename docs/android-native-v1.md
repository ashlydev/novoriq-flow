# Novoriq Flow Android V1

Novoriq Flow Android V1 is a real native Kotlin client for the broader Novoriq Flow product ecosystem.

It is intentionally **not** a WebView shell and **not** a rewrite of the full V1-V7 web surface. The goal of this release is to establish a strong native Android foundation around the most important daily SME workflows while preserving the meaning, terminology, and product direction already established by the web app.

## Scope

Android V1 includes:

- auth with session persistence
- first-run onboarding
- native app shell with bottom navigation and drawer access
- dashboard with summary cards, recent activity, and attention items
- customers list, detail, create, and edit
- suppliers list, detail, create, and edit
- invoices list, detail, create, and edit
- payments list, detail, and record flow
- expenses list, detail, create, and edit
- notifications center
- reports snapshot
- settings and sign out

Android V1 intentionally does **not** claim full parity with every advanced web module from V2-V7. It keeps the native client focused, usable, and extendable.

## Native Architecture

Project location:

- `android-native/`

Structure:

- `app/`
- `core/designsystem/`
- `core/common/`
- `core/data/`
- `core/model/`
- `core/ui/`
- `feature/auth/`
- `feature/onboarding/`
- `feature/dashboard/`
- `feature/customers/`
- `feature/suppliers/`
- `feature/invoices/`
- `feature/payments/`
- `feature/expenses/`
- `feature/notifications/`
- `feature/reports/`
- `feature/settings/`

Implementation choices:

- Kotlin + Jetpack Compose + Material 3
- screen-level ViewModels
- repository pattern with unidirectional UI state
- coroutine + Flow driven state updates
- manual DI via `AppContainer` for a lightweight, maintainable V1 setup
- native navigation using `navigation-compose`

## Theme

The Android client uses **Midnight Ledger - Flow Edition**:

- background `#0F172A`
- surface `#1E293B`
- surface variant `#334155`
- drawer background `#0B1220`
- primary `#2563EB`
- secondary `#38BDF8`
- success `#16A34A`
- warning `#F59E0B`
- error `#DC2626`
- info `#0EA5E9`
- text primary `#F8FAFC`
- text secondary `#CBD5E1`
- text muted `#94A3B8`

The design system is implemented in:

- `android-native/app/src/main/java/com/novoriq/flow/android/core/designsystem/`

## Data Layer Assumption

Android V1 currently uses a clean demo-backed repository that mirrors Flow entities and product language:

- user
- business
- customer
- supplier
- invoice
- payment
- expense
- notification
- dashboard summary

This keeps the Android client honest and architecture-ready while production APIs are still evolving. The repository layer is intentionally isolated so it can be swapped for real API-backed implementations later without rewriting the UI layer.

## Build And Run

From the repo root:

```bash
cd "/home/falcon/Desktop/NOVORIQ FLOW/android-native"

GRADLE_USER_HOME=/home/falcon/Desktop/NOVORIQ\ FLOW/android-native/.gradle-home \
ANDROID_HOME=/home/falcon/Android/Sdk \
ANDROID_SDK_ROOT=/home/falcon/Android/Sdk \
./gradlew :app:assembleDebug --no-daemon -Dkotlin.compiler.execution.strategy=in-process --console plain
```

Debug APK output:

- `android-native/app/build/outputs/apk/debug/app-debug.apk`

Open in Android Studio:

```bash
cd "/home/falcon/Desktop/NOVORIQ FLOW/android-native"
studio .
```

If `studio` is not on your path, open the `android-native` folder manually in Android Studio.

## Manual Test Checklist

- app launches on Android
- splash screen and launcher icon render correctly
- login works with demo credentials
- session persists after app restart
- logout returns to auth correctly
- onboarding flow completes and routes into the shell
- dashboard loads summary cards, activity, and attention panels
- customers list, detail, create, and edit flows work
- suppliers list, detail, create, and edit flows work
- invoices list, detail, create, and edit flows work
- payment record flow updates invoice context correctly
- expense list/detail/create/edit flows work
- notifications screen renders unread/read states
- settings screen renders business/session info and sign out
- bottom navigation works
- drawer navigation works
- Android back behavior is correct across nested screens
- keyboard does not cover critical actions on auth and form screens
- small-screen layouts remain usable on common Android phone sizes
- loading states, empty states, and error states are present where expected
- Midnight Ledger theme is applied consistently

## Preservation Note

This native Android project does **not** remove, replace, or rewrite the existing Novoriq Flow web/PWA codebase. The current web product remains the source of truth for the broader V1-V7 ecosystem, while Android V1 introduces a focused native client that respects the same terminology, product direction, and business meaning.

Preserved:

- existing Next.js web app
- existing PWA setup
- existing layered web providers and business logic
- existing V1-V7 product meaning

Added safely:

- a separate native Android codebase under `android-native/`
- a real Kotlin/Compose foundation for future Android V2/V3 growth
