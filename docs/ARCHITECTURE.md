# Soriko Commerce — architecture

## Cost and isolation

One existing Supabase project: `soriko-club` (`vgxeebazmzkncbsmcrha`).
No second project was purchased. Data remains isolated from AMM, X3 and ATTEMPO.
Historical Soriko Engine records are archived in the same PostgreSQL instance, not interpreted as commerce inventory.

## Runtime layers

1. **Next.js static storefront** on Cloudflare Worker `soriko`, keeping the approved brand.
2. **Edge Function `soriko-commerce`**, for public catalogue and authenticated staff operations.
3. **Postgres `public.commerce_*` tables**, accessible through server-only service credentials.
4. **Supabase Auth** for existing internal staff, with explicit `commerce_staff` roles.

The browser never receives the service-role key; the publishable key is not authorization.
CORS has an explicit origin allowlist. Every private request verifies user, active session and staff role.

## Data model

- `commerce_products`: title, slug, category, photos, publication state.
- `commerce_variants`: independent SKU, JP/EN/ES, EUR price cents, VAT bps.
- `commerce_inventory`: physical on hand, reserved, committed, damaged.
- `commerce_stock_movements`: immutable adjustment/reservation ledger and idempotency key.
- `commerce_orders`, `commerce_order_items`, `commerce_reservations`: transaction domain.
- `commerce_payment_events`: future payment event idempotency.
- `commerce_supplier_quotes`: manual buying-price records; no speculative supplier prices.
- `commerce_staff`: roles seeded from existing authenticated users.

Stock available = physical - reserved - committed - damaged. Constraints prohibit negative stock and inventory mutation outside trusted backend. Server-side PostgreSQL transactions lock the inventory row during reservation to prevent concurrent overselling.

**All `commerce_*` tables are RLS enabled and grants to `anon`/`authenticated` are revoked.** Public catalogue data is projected through the Edge Function, not an unrestricted database view.

## V1 scope

Live data-driven catalogue, language and category filters, search, cart and staff product/stock management. The cart does **not** reserve inventory. Payment checkout and warehouse fulfillment are not active yet.

Checkout requires: payment gateway, signed webhook and late-event reconciliation, verified shipping rates and tax rules, transactional email, legal texts, end-to-end tests and operator sign-off. No simulated purchases are presented as real.

## Migration and recovery

The code version before Commerce remains recoverable from Git.
Commerce schema changes are recorded as versioned Supabase migrations.
Engine cron scans are disabled; archival preserves historical records privately instead of deleting them irreversibly.
