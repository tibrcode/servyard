# Request Tracing

This document explains the lightweight request tracing system implemented in Cloud Functions.

## Overview
Client requests attach a `x-trace-id` header (generated once per session on the frontend). Backend HTTP functions read this header and emit structured log entries via the `logTrace` helper.

## Goals
- Correlate frontend actions with backend processing for debugging.
- Enable growth-phase analytics (latency hotspots, error clusters) without high cost.
- Provide a migration path to richer observability (Firestore -> BigQuery or Cloud Logging exports).

## Sampling
We persist only a sampled subset of trace events to Firestore collection: `request_traces`.
```
Sampling rate: 5%
Collection: request_traces
Document shape:
{
  trace: string,        // e.g. 'abc123-1699999999999'
  event: string,        // semantic event key e.g. 'notifyNewBooking:start'
  ts: string,           // ISO timestamp
  ...extra              // endpoint-specific metadata
}
```
Console logs still emit *all* traces with `[TRACE]` prefix for real-time tailing during debugging.

## Current Instrumented Events
- `dedupeServiceCategories:start|done|error` (mode, duration)
- `adminDeleteUser:start|done|error` (duration)
- `sendTestNotification:start|done|error` (duration)
- `notifyNewBooking:start|done|error` (duration)
- `notifyBookingStatusChange:start|skip|done|error` (duration, skip reasons)

## Extending
Add new events by calling:
```ts
logTrace(req.get('x-trace-id'), 'myEndpoint:start', { key: value });
```
Keep event names lowercase, segments separated by a colon, and prefer phases like `start`, `done`, `error` if you add more granular points.

## Performance & Cost
- Each sampled document is tiny (< 1KB). At 5% sampling and 10k requests/day, ~500 writes (< 1 write/sec average).
- You can lower `TRACE_SAMPLING_RATE` if write throughput or cost needs reduction.

## Maintenance
- A daily job `pruneOldRequestTraces` removes trace docs older than 30 days.

## Future Enhancements (Optional)
1. Export Firestore collection to BigQuery via scheduled batch (daily) for analytical queries.
2. Attach `user_id` or `role` when authorization is confirmed (mind PII/privacy policies).
3. Integrate with Cloud Logging structured entries (severity formatting) for centralized filtering.

## Privacy Considerations
- Do NOT store raw personal data in trace docs (names, emails, phone numbers). Use IDs only.
- Sampling reduces potential exposure surface if a future compliance audit requires purging.

## Troubleshooting
If you do not see trace docs:
- Ensure frontend sends `x-trace-id` header.
- Confirm Firestore security rules allow the Cloud Functions service account to write (default yes).
- Lower sampling rate temporarily to 1.0 for validation, then revert.

## Adjusting Sampling Rate
Edit in `functions/src/index.ts`:
```ts
const TRACE_SAMPLING_RATE = 0.05; // 5%
```
Deploy after change.

---
Last updated: 2025-11-08
