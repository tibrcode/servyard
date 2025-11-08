# ServYard Performance & Reliability Checklist

This checklist helps keep the app fast and stable as usage grows.

## Frontend (React/Vite)
- Prefer lazy-rendering heavy sections (tabs already unmount inactive content via Radix UI).
- Wrap critical pages with an error boundary to avoid blank screens on unexpected runtime errors.
- Limit console noise in production; keep debug-only logs behind localStorage flags.
- Avoid expensive computations in render; memoize results or pre-compute on fetch.

## Firebase Firestore
- Initialize with Safari-friendly opts (autoDetectLongPolling, disable fetch streams) to reduce console noise.
- Use composite indexes for any query combining `where` + `orderBy` (see `docs/indexes.md`).
- Consider adding an index only when needed; use the console link when a query complains.
- Batch writes where possible; avoid loops with `addDoc` inside per-item operations.
- Validate documents schema to prevent duplicates (server-side checks in Cloud Functions when critical).

## Messaging (FCM)
- Register service worker early (done) and ignore `type=silent_sync` payloads to avoid noisy notifications.
- Keep foreground listener light; offload heavy logic to the service worker.

## Data quality
- De-duplicate `service_categories` at the data layer when time permits (planned Cloud Function with `dryRun`).
- Keep "source-of-truth" updates centralized (e.g., admin endpoints) to avoid multiple upserts from clients.

## Monitoring & Observability
- Use client-side `window.onerror` and `unhandledrejection` hooks (already enabled) to capture errors.
- Optionally wire a logging endpoint to store production errors (e.g., to Firestore/BigQuery) if needed.

## Mobile WebView notes (Safari/iOS)
- Some Firestore streaming warnings are benign; the app now auto-detects long polling and disables fetch streams.
- Avoid overly long synchronous tasks; keep interactions under 50ms to stay responsive.

