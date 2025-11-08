# Firestore Composite Indexes (ServYard)

Create the following composite indexes in Firebase Console > Firestore Database > Indexes > Composite > Add Index.

Notes:
- Direction matters; match the order used by queries.
- Create only what you need; you can add more later when Firestore prompts you.
- These indexes remove the "requires an index" warnings and improve query performance at scale.

## 1) offers
- Collection: `offers`
- Fields:
  1. `provider_id` Ascending
  2. `created_at` Descending

Use-cases: Provider offers list ordered by recency.

## 2) service_categories
- Collection: `service_categories`
- Fields:
  1. `is_active` Ascending
  2. `display_order` Ascending

Use-cases: Active categories ordered by `display_order`.

## 3) bookings (provider dashboard)
- Collection: `bookings`
- Recommended variants (create what you use):
  - A) `provider_id` Ascending + `booking_date` Ascending
  - B) `provider_id` Ascending + `status` Ascending
  - C) (Optional) `provider_id` Ascending + `booking_date` Ascending + `status` Ascending

Use-cases: Filter/sort provider bookings by date/status efficiently.

## 4) services (provider services page)
- Collection: `services`
- If you filter by provider and order by created_at:
  - `provider_id` Ascending + `created_at` Descending
- If you filter by provider and also use `is_active`:
  - `provider_id` Ascending + `is_active` Ascending

## How to add an index
1. Open Firebase Console → Firestore Database.
2. Go to the Indexes tab.
3. Under Composite Indexes, click "Add Index".
4. Select collection, add the fields with the directions above, click Create.
5. Wait until status is Ready.

## Troubleshooting
- If you see a console link saying a query needs an index, click it—it pre-fills the exact index needed.
- Index build time depends on dataset size (usually seconds to a few minutes).
- You can remove unused indexes later to keep things tidy.
