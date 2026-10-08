# SORIKO CLUB — Commerce

Pokémon TCG ecommerce built with Next.js, Cloudflare Workers and a **single existing Supabase project**. No additional Supabase project or monthly fixed project charge was introduced.

## URLs

- Public website: https://soriko.alfonso-millan.workers.dev/
- Live-stock catalogue (checkout disabled): https://soriko.alfonso-millan.workers.dev/shop/
- Private operations: https://soriko.alfonso-millan.workers.dev/admin/

## Architecture

- Cloudflare Worker: `soriko` (K), serving the original Next.js static frontend.
- Supabase project: `soriko-club` (existing).
- Supabase Edge Function: `soriko-commerce` handles public catalogue and staff-only mutations.
- Database: `public.commerce_*` tables protected with RLS; only the server-side service role can access retail tables.
- Auth: existing Supabase users, mapped to `commerce_staff` with least-privilege roles.
- No live checkout or automatic charge capture until a verified gateway is configured and explicitly approved.

## Commerce V1

- Variant-aware SKUs and languages JP / EN / ES.
- Product drafts, prices in EUR cents, VAT configuration, publishing.
- Stock ledger: on hand, reserved, committed, damaged, and derived sellable stock.
- Atomic and idempotent stock adjustment and order reservation stored functions.
- Catalogue filtering, search and session-persistent local cart.
- Private admin screens for products, inventory and order overview.
- Orders, reservations and payments schema prepared for the next stage.

**Only publish real, verified merchandise and actual prices.** Legacy Soriko Engine market data must not be imported as retail stock.

## Developers

```bash
npm ci
node --experimental-strip-types --test tests/*.test.mjs
npx tsc --project tsconfig.edge.json
npm run build
npx wrangler deploy --dry-run
```

GitHub Actions validates dependency security, Commerce unit tests, Edge API probes and the production build before deployment. On merge to `main`, the deployment workflow publishes to the canonical `soriko` Worker and confirms the release SHA.

## Security and next steps

Configure a dedicated payment merchant/sandbox, shipping rates, legal information and webhook verification before permitting checkout. Production checkout is explicitly disabled.
The original Engine source is retained in Git history. Historical database records have been moved into the non-exposed `soriko_legacy` schema. The old Engine API is disabled and its recurring jobs have been unscheduled.

See `docs/ARCHITECTURE.md` and `docs/DEPLOYMENT.md`.
