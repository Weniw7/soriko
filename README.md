# SORIKO CLUB

Independent Pokemon TCG ecommerce and sourcing platform by AMM CORE SOLUTIONS S.L.

## Live preview

- Public website and store preview: https://soriko.alfonso-millan.workers.dev/
- Private Soriko Engine: https://soriko.alfonso-millan.workers.dev/admin/
- Production source: GitHub `main`
- Published Worker: `soriko` (with K; do not deploy to `sorico`)

The public store is a preview: no live checkout, stock or prices are promised yet.

## Current architecture

- Public frontend / admin: Next.js 16 static export
- Hosting: Cloudflare Workers static assets (Wrangler)
- Business data and private auth: dedicated Supabase project
- Source control and CI/CD: this GitHub repository
- Later commerce phase: dedicated store inventory/catalogue and Shopify integration, without conflating commerce and Soriko Engine intelligence

## Modules

Market Radar, Japan Scanner, Supplier Manager, Landed Cost Engine, Opportunity Scoring, Purchasing, Inventory, Sales Analytics.

## Deploy

Each push to `main` runs dependency audit, automated tests, build, Cloudflare deployment and a verification gate for the exact commit, public pages, admin shell and CSS.

From a clean checkout, with authorized Cloudflare credentials:

```bash
npm ci
npm run build
npx wrangler deploy
```

Deploy name is sourced from `wrangler.jsonc`, and public verification lives in `scripts/verify-deployment.mjs`.

## Secrets and security

Cloudflare and Supabase secrets are managed in the respective service, never committed.
Only the publishable Supabase key belongs in the client. Private Engine operations validate sessions and roles on the server.
Before store launch, review repository visibility, account permissions, RLS and Cloudflare Access.
