# Notifications: Deploy & Production Checklist

This guide covers deploying Firebase Cloud Messaging (FCM) and Cloud Functions for ServYard, and validating push notifications in production (web and native).

## Prerequisites
- Firebase project configured with Web App credentials in Vite env (see .env.*)
- FCM enabled in Firebase Console (Project Settings > Cloud Messaging)
- A VAPID key generated and set in `VITE_FIREBASE_VAPID_KEY`
- Service worker available at `/firebase-messaging-sw.js` (lives in `public/`)
- HTTPS domain (push requires secure origin)

## 1) Configure environment
Create or update your env file (local and production):

- .env.local (for development)
- .env.production (for deployment) or environment variables on your host (Vercel/Netlify/etc.)

Required keys:
- VITE_FIREBASE_API_KEY
- VITE_FIREBASE_AUTH_DOMAIN
- VITE_FIREBASE_PROJECT_ID
- VITE_FIREBASE_STORAGE_BUCKET
- VITE_FIREBASE_MESSAGING_SENDER_ID
- VITE_FIREBASE_APP_ID
- VITE_FIREBASE_MEASUREMENT_ID (optional)
- VITE_FIREBASE_VAPID_KEY (required for web push)

## 2) Service Worker
- File: `public/firebase-messaging-sw.js`
- Must be served from site root: `https://yourdomain.com/firebase-messaging-sw.js`
- Already configured to:
  - Initialize Firebase compat and Messaging
  - Show background notifications
  - Broadcast payloads to open tabs via `postMessage` for logging/history
  - Handle notificationclick to open the provided `data.url` or `/`

No build step needed for this file; it's copied as-is from `public/`.

## 3) Frontend integration
- `src/lib/firebase/sw.ts`: safely registers the service worker once
- `src/lib/firebase/notifications.ts`:
  - Registers the SW before calling `getToken`
  - Foreground listener displays toast and can log into history context
- `src/contexts/NotificationLogContext.tsx`: stores notifications in localStorage; listens to SW `postMessage`
- Routes:
  - `/debug/notifications`: diagnostics
  - `/notifications`: history page (also added to sidebar)

## 4) Deploy Cloud Functions
From the repo root:

- Ensure Functions dependencies are installed: `npm --prefix functions ci` (or `npm i` once)
- Deploy: `firebase deploy --only functions`

Functions included:
- notifyNewBooking
- notifyBookingStatusChange
- sendScheduledReminders (scheduled)
- sendTestNotification (manual trigger via HTTP)

Tip: If using regions or schedule, confirm permissions and time zone in Firebase console.

## 5) Hosting/Frontend deploy
- Build the site: `npm run build`
- Deploy to your hosting provider (Vercel, Firebase Hosting, Netlify, etc.)
- Confirm that `/firebase-messaging-sw.js` is accessible directly from your domain root

## 6) Production validation checklist
- Open the deployed site over HTTPS in Chrome (desktop) first
- Navigate to `/debug/notifications`
- Click “Request Permission & Token”; grant browser permission
- Verify token displayed (masked)
- Click “Send Test Push (Backend)” (requires deployed functions)
  - Expect: toast when tab is in foreground; system notification when tab is background/closed
- Lock screen or close tab and trigger again; expect system notification
- Check `/notifications` history for entries from both foreground and background
- Optional: confirm booking status changes and scheduled reminders produce pushes

## 7) Common issues
- No push received:
  - Ensure service worker is active (check Application > Service Workers)
  - HTTPS required; localhost allowed in dev only
  - Verify VAPID key matches your Firebase project
  - Check browser site settings: Notifications allowed
- Token missing in Firestore:
  - Verify `requestNotificationPermission()` is called while signed in
  - Check console logs for SW registration and `getToken` errors
- Safari quirks:
  - Prefer testing Chrome first
  - Ensure permissions granted at OS level (System Settings > Notifications)

## 8) Native (Capacitor) notes
- File: `src/lib/native/push.ts` contains a starter to register for native tokens
- Android:
  - Add `google-services.json` to `android/app/`
  - Update Gradle and sync
- iOS:
  - Configure APNs key/cert in Firebase Console
  - Enable Push Notifications and Background Modes in Xcode

Match the native token schema in backend if you plan to differentiate tokens by platform.

## 9) Security & housekeeping
- Rotate VAPID if compromised; clear tokens and re-register
- Consider token cleanup on sign-out
- Limit test endpoints to authenticated users

## 10) Useful links
- FCM Web: https://firebase.google.com/docs/cloud-messaging/js/client
- Firebase Functions: https://firebase.google.com/docs/functions
- Capacitor Push: https://capacitorjs.com/docs/apis/push-notifications
