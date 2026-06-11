# Ball Mates App

Mobile app for the Ball Mates football meetup platform. Built with Expo (blank JavaScript template) and React Native.

## Setup

1. Install dependencies:

```bash
cd ball-mates-app
npm install
```

2. Create a `.env` file (or set in app config):
   - `EXPO_PUBLIC_API_URL` – Backend URL (e.g. `http://localhost:3000`; use your machine IP for device)
   - `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` – Cloudinary cloud name (for image URLs)

3. Start the app:

```bash
npx expo start
```

Run on iOS/Android via Expo Go or a development build.

## Features

- **Auth:** Login, register, logout. Token stored in SecureStore.
- **Sessions:** List, detail, create, join, leave. Open pitch in maps.
- **Chat:** Group chat per session; private messages.
- **Profile:** Avatar upload (Cloudinary via API), games played, MOTM count.
- **MOTM:** Vote for Man of the Match per session.
- **Reminders:** Schedule reminder when joining a session (Expo push).
- **Fair play:** Session rules, beginner-friendly, optional referee; report flow.
- **Legal:** Terms, Privacy, Code of conduct screens; acceptance on register.

## Project structure

- `App.js` – Root with AuthProvider and AppNavigator
- `src/screens/` – Screens (Login, Register, Sessions, SessionDetail, CreateSession, GroupChat, Profile, PrivateChat, MotmVote, Report, Terms, CodeOfConduct)
- `src/navigation/` – Stack navigator and main tabs
- `src/context/AuthContext.js` – Auth state and API
- `src/services/api.js` – API client and upload
- `src/constants/config.js` – API URL, Cloudinary name
- `src/constants/en.json`, `ar.json` – i18n (en, ar)
- `src/utils/i18n.js` – i18n helper
