# Bible App – UI

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

## Screens

**Everyone**
- **Sign up / sign in**: no passwords. Enter your email, get a 6-digit code by email, type it in.
- **This week**: Monday to Saturday readings, today's checkbox, days read and streak.
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
