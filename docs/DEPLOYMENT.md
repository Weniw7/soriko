# Soriko Club deployment

## Production topology

### Before Shopify
- `sorikoclub.com` -> Cloudflare Workers
- `admin.sorikoclub.com` -> same application, protected admin area
- Supabase -> database + auth

### After Shopify launch
- `sorikoclub.com` -> Shopify storefront
- `www.sorikoclub.com` -> Shopify storefront
- `admin.sorikoclub.com` -> Cloudflare Workers / Soriko Engine
- Supabase -> database + auth + internal business data

Shopify must never become the source of truth for sourcing, landed cost, supplier history or opportunity scoring.

## Cloudflare setup

Cloudflare recommends vinext for new Next.js projects on Workers.

From a local checkout of this repository:

```bash
npm install
npx vinext check
npx vinext init
npm run build:vinext
npx @vinext/cloudflare deploy
```

The first `vinext init` should target Cloudflare Workers. Commit the generated Cloudflare/Vite configuration after verifying it.

## Required environment variables

Public/client:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

Server-only:
- SUPABASE_SECRET_KEY (only if a server-side administrative operation truly requires it)

Never expose a Supabase secret/service-role key with a NEXT_PUBLIC prefix.

## GitHub -> Cloudflare

Preferred: Cloudflare Workers Builds connected directly to the GitHub repository.

Production branch: `main`.

Do not store Cloudflare tokens or Supabase secret keys in repository files.

## Security

- Keep GitHub repository private.
- Enable MFA on GitHub, Cloudflare, Supabase and Shopify.
- Enable DNSSEC on the production domain.
- Protect the admin hostname with Cloudflare Access in addition to Supabase Auth.
- Keep all internal Supabase tables behind RLS.
- Use publishable Supabase keys in the browser only.
- Use server-only secrets exclusively in Cloudflare encrypted secrets.
