# Brethren Bible Reading Club – UI

The app is called **Brethren Bible Reading Club** inside the app and in emails, and **BBRC** under the app icon (where longer names get cut off).

Mobile app for the Bible reading tracker. Members see each day's reading, tick it off, and keep a streak. Admins set the week's readings and see who has been reading.

Expo (SDK 58, React Native) + TypeScript, with Expo Router for navigation (screens live in `src/app/`). The API lives in the [Bible-App](https://github.com/mazino-threshold/Bible-App) repo (`backend/`).

## Getting started

```
npm install
cp .env.example .env     # then set the API URL
npx expo start
```

Run the backend locally first (`npm run dev` in `Bible-App/backend`, http://localhost:4000). On a phone, use your computer's local IP instead of `localhost`.

Scan the QR code with Expo Go (Android) or the Camera app (iOS), or press `a` / `w` for an Android emulator or the browser.

```
npm run typecheck        # TypeScript
npm run lint             # ESLint
npx expo install <pkg>   # add packages (picks versions that match the Expo SDK)
```

## Structure

```
src/
  app/                  Screens (Expo Router: every file is a route)
    _layout.tsx         Shows (auth) when signed out and (app) when signed in
    (auth)/             sign-in, register, verify
    (app)/              Signed-in tabs: index (readings), admin (admins only), profile
      admin/            Stack: index (weeks list), week/[weekStart] (edit readings), report
  api/                  API calls: client.ts (fetch, token, errors), query-client.ts, one file per area
  auth/                 Session (token and user, kept in SecureStore / localStorage on web)
  hooks/                Data hooks (TanStack Query): use-my-week.ts, use-admin.ts, use-community.ts
  lib/                  Helpers, e.g. dates.ts (API dates are Nigeria days; never let the phone's time zone shift them)
  components/           Shared UI: Button, TextField, FormError, QueryState, WeekNav, TodayCard, CommunityCard, DayRow, AuthScreen
  constants/theme.ts    Colours (from the club logo), fonts, spacing
assets/images/          logo.png (full logo), emblem.png (logo without text), app icons and splash
```

## Screens

**Everyone**
- **Sign up / sign in**: no passwords. Enter your email, get a 6-digit code by email, type it in.
- **This week**: Monday to Saturday readings, today's checkbox, days read and streak.
- **Community**: a card under today's reading inviting members to the club's group (WhatsApp for now). The text and link come from the API (`GET /community`), so they can change without a new app build.
- **Past weeks**: what you read and missed.
- **Profile**: name, phone and how often to get reminders (high, mid, low, off).

**Admins only**
- **Schedule**: enter the passage (and optional notes) for each day of a week. All six days are required. Weeks that have ended can't be changed.
- **Reports**: who read how many days in a week, with min/max day filters.

## How it works with the API

- After `POST /auth/verify-code`, store the returned `token` securely and send it as `Authorization: Bearer <token>`. A `401` means the user must sign in again.
- Errors come back as `{ "error": "..." }`. Validation errors add `details: [{ field, message }]`, which can be shown next to each form field.
- Weeks are always identified by their Monday (`YYYY-MM-DD`). There are no readings on Sundays.
- "Today" is decided by the server in Nigeria time. Use `today` from `GET /check-ins/week` and each day's `status` and `canToggle` rather than the phone's clock.
- Register the device's Expo push token with `POST /me/push-tokens` after sign-in, and pass it to `POST /auth/logout` so reminders stop after sign-out.

Full API reference: http://localhost:4000/docs when the backend is running.

## Push reminders and development builds

Reminders are push notifications sent by the backend (see its README). The app registers each phone with `POST /me/push-tokens` after sign-in (unless reminders are Off in the profile) and sends the token to `POST /auth/logout` on sign-out. Tapping a reminder opens the Readings tab.

Expo Go can't receive push notifications, so reminders need a **development build** (your own copy of Expo Go with this app's native code):

```
npx expo login                          # once per computer
npx eas-cli@latest init                 # once: links the app to an EAS project (adds extra.eas.projectId to app.json)
npx eas-cli@latest credentials          # once, Android: upload the FCM V1 key (see below)
npx eas-cli@latest build --profile development --platform android
npx expo start                          # then open the installed dev build instead of Expo Go
```

- **Android:** create a Firebase project, add an Android app with the same package name, then in Firebase → Project settings → Service accounts generate a private key and upload it with `eas credentials` (Android → FCM V1). Guide: https://docs.expo.dev/push-notifications/fcm-credentials/
- **iOS:** needs a paid Apple Developer account. `eas build --platform ios` sets up the push key when asked.
- Build profiles are in `eas.json`: `development` (dev build, APK), `preview` (installable test APK), `production` (store).
