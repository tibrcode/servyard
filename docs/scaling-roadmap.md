# ServYard Scaling Roadmap

This document outlines phased improvements to safely scale ServYard from early growth to millions of users across regions while maintaining reliability, cost efficiency, and developer velocity.

## Phase 1: Foundation (Current / < 50K MAU)
Focus: correctness, observability, eliminating silent failures.
- Firestore composite indexes (see `docs/indexes.md`).
- Error boundary (done) + global promise rejection logging.
- Notifications infrastructure (done) with quiet hours.
- Duplicate category hygiene (dedupe function + monitor).
- Web Vitals sampling (10%) to baseline performance.
- Basic scheduled health monitors (duplicates).

KPIs: p95 page load (TTI) < 4s on 3G, error rate < 0.5%, notification delivery success > 95%.

## Phase 2: Efficiency (50K–250K MAU)
Focus: reducing hot path cost and latency.
- Add scheduled system stats snapshot (counts & deltas) for capacity planning.
- Introduce categories + services caching: memory + sessionStorage TTL.
- Query slimming: replace broad collections with filtered composite index queries.
- Adopt Firestore data shaping to avoid fan-out (embed small provider meta in service docs).
- CDN hardening: Icon/image optimization (WebP, responsive sizes).
- Introduce dynamic chunk prefetch on hover for dashboards.
- Add incremental backoff & retry for critical Firestore writes (reviews, bookings) in transient failures.

KPIs: p95 Firestore query latency < 250ms, bundle first-load < 300KB gz, booking creation failure < 0.2%.

## Phase 3: Resilience (250K–1M MAU)
Focus: multi-region, graceful degradation, surge handling.
- Multi-region Firestore/Functions strategy (read-local, write-primary) or evaluate alternative datastore for high-write domains.
- Add circuit breaker for external integrations (payment, maps) with fallback UI.
- Introduce structured log export to BigQuery via scheduled batch (cost aware).
- Add synthetic monitoring (global endpoints: health, latency probe).
- Auto-scaling booking reminders into task queue (e.g. Cloud Tasks) to avoid reminder pile-ups.
- Edge caching for static translations & category metadata (KV store / CDN headers).

KPIs: incident MTTR < 15m, cross-region latency delta < 120ms, reminder on-time delivery > 99%.

## Phase 4: Scale & Optimization (1M–5M MAU)
Focus: cost control & advanced performance.
- Shard high-churn collections (bookings) by month or region.
- Pre-compute provider aggregates (rating, completed bookings) via incremental batch.
- Adopt write coalescing: queue rapid sequential updates (status changes) into single transaction.
- Move heavy analytics writes to pub/sub ingestion pipeline.
- Evaluate alternative notification fan-out (e.g. topic-based FCM + per-user delta store).
- Real user monitoring dashboard w/ alert thresholds (web vitals + functional errors).

KPIs: cost per 1K bookings stabilized, p99 booking confirmation < 1.2s end-to-end, cold start failures < 0.1%.

## Phase 5: Global & Enterprise (5M+ MAU)
Focus: advanced features & compliance.
- Data residency segmentation (region-based Firestore projects or multi-tenant architecture layer).
- Automated PII detection & encryption at rest for sensitive fields.
- Privacy events logging (consent, profile edits) to immutable audit store.
- Blue/green deploy strategy for Functions & front-end.
- Load prediction + pre-scaling (scheduled warmers for reminder function, etc.).

KPIs: compliant audit coverage 100%, deployment rollback < 5 min, sustained peak concurrency w/o degradation.

## Cross-Cutting Concerns & Practices
1. Observability: Structured logs (JSON), trace IDs flowing from client to Functions (add header x-trace-id).
2. Security: Role claims enforced server-side; secret rotation every 90 days; security rules with least privilege.
3. Testing: Load tests for booking creation bursts; integration tests for notification flows.
4. Documentation: Keep `performance.md` + this roadmap updated quarterly.
5. Disaster Recovery: Daily backup export for critical collections (profiles, bookings) + restore playbook.

## Immediate Quick Wins (Next Sprint)
- Implement system stats snapshot function.
- Add caching layer for categories & services list.
- Extend ErrorBoundary to upload error payloads.
- Add trace ID propagation from client (small UUID per session).

## References
- Firestore Indexes: `docs/indexes.md`
- Performance Checklist: `docs/performance.md`
- Dedupe Function: `functions/src/index.ts` (dedupeServiceCategories, monitorDuplicateCategories)

---
Last updated: {{DATE}}
