# Soriko Club deployment

## Live preview — October 2026

- Public preview: `https://soriko.alfonso-millan.workers.dev/`
- Private Engine: `https://soriko.alfonso-millan.workers.dev/admin/`
- Cloudflare Worker name: **soriko** (K), set by `wrangler.jsonc`.
- GitHub branch: `main`.
- Framework output: Next.js static export in `out/`.
- Deployment pipeline: `.github/workflows/deploy.yml`.

Never deploy production changes to the obsolete `sorico` Worker (C); it is a different service.

## Current deployment steps

```bash
npm ci
npm audit --audit-level=moderate
node --experimental-strip-types --test tests/engine.test.mjs
npx tsc --project tsconfig.edge.json
npm run build
npx wrangler deploy
node scripts/verify-deployment.mjs
```

GitHub Actions handles the commands on each push. The verifier checks the exact published commit, public routes, internal route shells and loaded CSS.

## Environment variables

Public:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

GitHub Actions secrets and vars:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Supabase Edge Function `soriko-engine` handles authenticated operations and role enforcement; never expose service or secret keys to static assets.

## Before Shopify launch

- `sorikoclub.com` can show the public Soriko preview on Cloudflare.
- `/admin/` is the private intelligence workspace.
- Storefront preview must not suggest that stock or checkout is live.

## After Shopify launch

- `sorikoclub.com` and `www.sorikoclub.com`: storefront.
- `admin.sorikoclub.com`: Soriko Engine on Cloudflare.
- Supabase: business intelligence and internal sourcing records.
- Commerce stock, reservations and fulfillment must have a deliberate source of truth and reconciled integration.

Shopify must not overwrite sourcing costs, supplier history, valuations or opportunity-scoring data.

## Release safeguards

1. No production deploy if `npm audit` fails.
2. Pin dependencies, commit lockfiles and run tests/build first.
3. Compare release marker to commit SHA on the intended canonical hostname.
4. Verify live pages and CSS assets before calling the release successful.
5. Before store launch, restrict repository visibility, enable MFA, review RLS and place admin behind Cloudflare Access in addition to Supabase Auth.
