# Soriko Engine V1

Implementation started 2026-10-01. This is a private market-data and decision-support workspace, not an autonomous purchasing bot. The public storefront is unchanged.

## Deployed topology

- Public and admin shell: Cloudflare Worker `sorico`.
- Admin routes: `/admin/`, `/admin/radar/`, `/admin/analyze/`, `/admin/products/`, `/admin/opportunities/`, `/admin/suppliers/`, `/admin/jobs/`, `/admin/alerts/`.
- Backend: Supabase Edge Function `soriko-engine` in project `vgxeebazmzkncbsmcrha`.
- Database: existing Supabase project, existing products/suppliers/snapshots/opportunities reused.
- Queue: durable `engine_jobs` table using atomic `FOR UPDATE SKIP LOCKED`, 120-second leases, lease tokens, idempotency keys, exponential retries and dead-letter states. No extra queue provider is needed at V1 scale.

The admin HTML is an unprivileged static shell. It contains no business data. All private requests require verified Supabase Auth, a live auth session and an internal role. Hiding a route or showing a login alone is not the security boundary.

## Sources actually connected

1. Official Cardmarket nonsingles catalog: `https://downloads.s3.cardmarket.com/productCatalog/productList/products_nonsingles_6.json`.
2. Official Cardmarket price guide: `https://downloads.s3.cardmarket.com/productCatalog/priceGuide/price_guide_6.json`.
3. ECB daily reference FX: `https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml`.

Cardmarket catalog imports 100 booster boxes / ETBs from real source IDs. Cases, empty packaging and certain ambiguous units are excluded. Language stays OTHER / UNVERIFIED until reviewed; assigning a language does not make an aggregate guide language-specific.

The official guide is a daily aggregate, not an executable supplier quote. It does not establish language, condition, shipping, individual sample size or sales volume. Guide-only quality is capped at 25/100, with UNKNOWN liquidity and zero invented sales. A repeated download of the same publication does not create new observations. Missing or zero guide prices are NULL, not a fabricated estimate.

See official source announcements:
- https://news.cardmarket.com/en/Pokemon/adding-non-singles-and-accessories-to-the-price-guide
- https://news.cardmarket.com/es/Pokemon/were-making-the-price-guide-and-product-catalogue-available-for-download

## eBay and supplier connections

The eBay Browse adapter is implemented but DISABLED until `EBAY_CLIENT_ID` and `EBAY_CLIENT_SECRET` are entered in Supabase Edge Function Secrets and production access has been approved. Set `market_sources.config.production_access_approved` to true only after that approval. Enable the source through the admin panel afterward. Browse yields asking prices, not completed sales. The initial adapter covers up to ten verified Japanese/English/Spanish booster box identities per run on eBay Spain, with conservative matching and explicit shipping. Expand batching and priority scheduling before scaling it to the full universe.

No JPFans, Neokyo or HeroTCG API has been invented. Supplier quotes can be imported as JSON from authorized exports or quotes. Provider credentials do not belong in JSON imports or chat. The presence of a supplier in the directory is not proof of a live feed, stock or reliability.

Supplier import required fields: `product_id`, `supplier_id`, numeric `unit_price`, `currency` (EUR/JPY/USD/GBP), `tax_basis` (NET/GROSS/UNKNOWN). Optional `stock_qty`, `min_qty`, ISO `valid_until`, HTTPS `source_url`. Imports do not automatically assume zero logistics cost.

## Scheduling

All database cron expressions are UTC; UI dates use Europe/Madrid.

- `soriko-engine-dispatch`: minute 7 every hour; enqueue due source jobs and recomputation.
- `soriko-engine-consumer`: every 5 minutes; invoke the worker only when eligible jobs exist.
- `soriko-engine-nightly`: 03:15 UTC; full recomputation job.
- `soriko-engine-cleanup`: 03:40 UTC; remove successful operational jobs after 30 days and API audit events after 90 days. Market history is retained.

Catalog, guide and FX have a 24-hour fetch cadence. This is not an hourly market tick stream. eBay has an hourly source cadence but remains disabled until authorized. HOT/WATCH/LONG_TAIL priorities exist in the product model; per-product adaptive polling is a subsequent expansion, not currently a promise of hourly coverage of all products.

Scheduler authentication uses a generated high-entropy token kept in Supabase Vault. Its SHA-256 is in a private table. Neither value is in the repository or returned by the API. The Edge Function disables gateway JWT verification specifically because it implements BOTH custom worker authentication and server-side end-user JWT/session/role checks itself. Do not remove those checks.

## Staff setup

There were no Auth users at initial inspection. Create the first user in Supabase Dashboard > Authentication > Users > Add user, using a strong unique password stored in your password manager. Confirm only an email under your control. Add the exact lowercase email to `engine_private.team_allowlist` through the Supabase SQL editor, with role admin/buyer/viewer. The backend grants the allowed role only after Auth confirms the email. This is not public signup.

Alternatively, an operator can insert a known existing Auth user into `public.profiles` through the SQL editor. Browser users cannot insert or update staff roles. Never authorize via user-editable metadata. Future Santi access requires his confirmed email and an explicit role; no shared admin account.

Roles:
- viewer: read and simulate.
- buyer: read, simulate, save analyses, import quotes, request scans, acknowledge alerts, log decisions.
- admin: buyer capabilities plus identity verification and source activation.

## Mathematics and interpretation

`lib/engine/core.ts` is deterministic and tested with Node's built-in runner. It has no LLM dependency. Comparable asking and sold cohorts are separated. Individual observations are deduplicated by source/listing/kind. Invalid identity, missing freight, stale data and incompatible units are excluded. MAD/IQR reduce outliers; effective weights are capped by seller and source. The quality index is a heuristic score, NOT a calibrated probability.

Revenue is gross customer receipts divided by `(1 + output VAT rate)`. Payment fees and the returns provision apply to gross receipts. Economic landed excludes recoverable import VAT; cash landed includes its financing requirement. Acquisition logistics inputs are totals for a lot, allocated by units. Selling inputs are per unit / a one-unit order assumption. Consolidated baskets require a different allocation model.

Contribution is before fixed costs and corporate income taxes. Recoverability of VAT, customs classification, destination VAT, channel fees and tax regime require confirmation for the actual transaction. Defaults are simulation assumptions, not contracted Shopify prices or tax advice. Unknown inbound costs stay visibly incomplete. Maximum buy is calculated from a required contribution margin on NET sales, after selling costs.

Saved manual analyses remain simulations / REVIEW unless evidence is sufficient. The current API intentionally never promotes a manually entered scenario to a verified supplier opportunity. There are no fake BUY signals, expected unit sales or guaranteed total profits. `profitIfAllSoldEur` is an arithmetic upper scenario, not a forecast. Decisions are audit records, not purchase orders.

## Scope not yet claimed as complete

- Authenticated owner end-to-end login requires first Auth account provisioning.
- Supplier/proxy live integrations require authorized access and actual terms.
- Automatic cross-market purchase recommendations require executable supplier quotes, complete verified landed inputs and credible demand evidence.
- Broad sold-data coverage, calibrated demand forecasts and recommended quantities are not yet available.
- 7/30/90/180-day charts need real accumulated history; no synthetic backfill.
- Singles, grading, Shopify inventory/purchasing sync, email/WhatsApp delivery, advanced forecast backtesting and a public market widget are future work.
- The existing GitHub repository was public at inspection. Make it private for business-code confidentiality. Security still must rely on authorization, not repository secrecy.

## Verification

```sh
node --experimental-strip-types --test tests/engine.test.mjs
npx tsc --noEmit --target ES2022 --module esnext --moduleResolution bundler --allowImportingTsExtensions --strict --skipLibCheck --lib ES2022,DOM tests/deno-shim.d.ts supabase/functions/soriko-engine/index.ts
npm ci
npm run build
npx wrangler deploy --dry-run
```

CI and production deployment run the numerical tests before building. Cloudflare secrets are scoped to the deployment step, not dependency installation. One deployment group prevents out-of-order concurrent publication.

Applied remote migrations are recorded in `supabase_migrations.schema_migrations`: `engine_auth_foundation`, `soriko_engine_v1_schema`, `soriko_engine_rpc_and_views`, `soriko_engine_schedules_and_retention`. Export schema using an authorized Supabase CLI session before recreating a project; never copy Vault values into a dump committed to git. The original profiles SELECT recursion was fixed with own-profile reads and browser role-write revocation.
