# Soriko Commerce release guide

## Target

- Canonical Worker: `soriko` (with K, not `sorico`)
- URL: `https://soriko.alfonso-millan.workers.dev`
- Existing Supabase: `soriko-club`
- Commerce API: `soriko-commerce`
- Branch deployed: `main`

## Local validation

```bash
npm ci
npm audit --audit-level=moderate
node --experimental-strip-types --test tests/*.test.mjs
npx tsc --project tsconfig.edge.json
npm run build
node scripts/verify-commerce.mjs
npx wrangler deploy --dry-run
```

## Production

GitHub Actions runs audit, tests, static build, and deploys `out/` assets. It records exact SHA using `scripts/build-marker.mjs`, then probes the live public routes and CSS using `scripts/verify-deployment.mjs`.
The Commerce API endpoint is independently checked for health, anonymous access restrictions, and allowed origins.
Do not bypass either verification gate after a failed run.

## Authentication and secrets

Browser: `NEXT_PUBLIC_SUPABASE_URL` and publishable Supabase key only.
Server Edge Function: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, provisioned by Supabase.
Cloudflare CI credentials: `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` through GitHub secrets.
Never commit server keys or customer details.

Staff accounts are from existing Auth. The `commerce_staff` table supplies admin, manager, operator or viewer role and active status.
No public registration in staff console.

## Operating policy

- The storefront only displays published variants with a configured price and tax.
- Inventory starts at zero: no Legacy Engine market observations are sellable stock.
- Adjustments require staff role, a reason, and a unique idempotency key.
- Sales checkout is disabled until signed payment webhook, taxes, shipping and legal content are verified.
- Never deploy schema drops or destructive data migrations as a routine site change.
- Existing legacy records should be archived in a private, non-API schema with a recovery path.
