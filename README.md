# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/566cf04f-af4b-4e18-a0cc-5e545c21272c

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/566cf04f-af4b-4e18-a0cc-5e545c21272c) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/566cf04f-af4b-4e18-a0cc-5e545c21272c) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

---

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
