# ServYard

Vite + React + TypeScript app with Tailwind and shadcn-ui, deployed on Vercel and wrapped with Capacitor for Android/iOS.

## Local development

```bash
npm install
npm run dev
```

Environment variables are read from `.env`. See `.env.example` for required Firebase keys.

## Tech stack

- Vite, React, TypeScript
- Tailwind CSS, shadcn-ui
- Firebase (Auth, Firestore, Storage, Analytics)
- Capacitor (Android/iOS)


## Deployment guide (Web + Android + iOS)

This project is built with Vite + React and wrapped with Capacitor for mobile. Authentication uses Firebase, and Supabase is available for data/services. No separate backend server is required unless you plan custom APIs.

### Web on Vercel

1) Connect the GitHub repo to Vercel and set:
	- Build command: `npm run build`
	- Output directory: `dist`
2) SPA routing: a `vercel.json` is included to route all paths to `/` so client routing works.
3) Firebase Auth domains:
	- In Firebase Console > Authentication > Settings > Authorized domains, add your Vercel domain and custom domain.
4) Enable Google sign-in:
	- Firebase Console > Authentication > Sign-in method > Enable Google.
5) Environment variables (recommended): move Firebase keys to `.env` and read via `import.meta.env`.
	- Use `.env.example` as a template. Required keys:
	  - `VITE_FIREBASE_API_KEY`
	  - `VITE_FIREBASE_AUTH_DOMAIN`
	  - `VITE_FIREBASE_PROJECT_ID`
	  - `VITE_FIREBASE_STORAGE_BUCKET`
	  - `VITE_FIREBASE_MESSAGING_SENDER_ID`
	  - `VITE_FIREBASE_APP_ID`
	  - `VITE_FIREBASE_MEASUREMENT_ID`
	- On Vercel: Project → Settings → Environment Variables → add the same keys.

### Connect GitHub + enable auto-deploys

- If this folder is not yet a Git repo, initialize and push to GitHub:

```bash
git init
git add .
git commit -m "chore: init + firebase envs + vercel routing"
git branch -M main
git remote add origin https://github.com/<your-org>/<your-repo>.git
git push -u origin main
```

- On Vercel, click "New Project" → Import from GitHub → pick the repo → set env vars → Deploy.
- Any push to `main` (or the selected branch) will auto-trigger a new deployment.

### Android build (Capacitor)

Prereqs: Android Studio, Java 17.

1) Create a Firebase Android app with package `com.servyard.app` (matches `capacitor.config.ts`).
2) Generate and add your app's SHA-1 in Firebase (Project settings > Android app).
3) Download `google-services.json` from Firebase and place it at `android/app/google-services.json`.
4) Build and sync:
	- `npm run build`
	- `npx cap sync android`
	- `npx cap open android` to open in Android Studio and build/run.
5) If using native Google Sign-In, install a Capacitor Google Auth plugin and configure the reversed client ID; then exchange Google token to Firebase with `signInWithCredential`.

### iOS build (Capacitor)

Prereqs: Xcode, CocoaPods.

1) Create a Firebase iOS app with bundle ID `com.servyard.app` (or your chosen bundle ID and update `capacitor.config.ts`).
2) Download `GoogleService-Info.plist` and add it to the Xcode project (`ios/App/App/GoogleService-Info.plist`).
3) Configure URL Types with the reversed client ID from the plist (for Google sign-in) in Xcode > Target > Info > URL Types.
4) Build and sync:
	- `npm run build`
	- `npx cap sync ios`
	- `npx cap open ios` to build/run from Xcode.

### Notes on backend

- This app now uses Firebase (Auth, Firestore/Storage) as the primary backend. Supabase has been removed.
- You do not need Render unless you plan custom long-running APIs. If you later need server code, Vercel Serverless Functions are usually sufficient; use Render only when you need a persistent process or custom networking.

## Admin deletion from Firebase Console (one click)

We include Firebase Cloud Functions that delete a user and all related data when you remove them from Authentication in the Console, plus an optional admin HTTP endpoint.

What gets deleted:

- `profiles/{uid}`
- All `services` by the provider (+ `service_availability`, `service_special_dates`)
- `offers` by provider
- `bookings` where the user is provider or customer
- `reviews` written by or addressed to the user

How to set up:

1) Install Firebase CLI and log in.
2) In the `functions/` folder:
	- `npm install`
	- Optionally set a secret for the HTTP endpoint:
	  - `firebase functions:secrets:set ADMIN_DELETE_TOKEN`
3) Deploy:
	- `npm run deploy` (from `functions/`)

How it works:

- Trigger `onAuthDeleteUser`: When you delete a user from Firebase Console → Authentication → Users, the function cleans up all related data.
- HTTP admin endpoint `adminDeleteUser`: POST with header `x-admin-key: <secret>` and JSON body `{ "uid": "..." }` to delete a user programmatically.

Notes:

- Update `functions/src/index.ts` if you add/change collections.
- Functions use Firestore BulkWriter for efficient batched deletions.
