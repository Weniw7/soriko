# SORIKO CLUB

Independent Pokémon ecommerce and sourcing platform operated by AMM CORE SOLUTIONS S.L.

## Architecture

- Frontend / admin: Next.js 16
- Edge runtime: Cloudflare Workers
- Cloudflare adapter: vinext
- Database / Auth: dedicated Supabase project
- Source control: this dedicated GitHub repository
- Ecommerce: Shopify will be connected later as the sales channel, not as the business-intelligence core

## Core modules

- Market Radar
- Japan Scanner
- Supplier Manager
- Landed Cost Engine
- Opportunity Scoring
- Purchasing
- Inventory
- Sales Analytics

## Environments

- Production: Cloudflare Workers
- Database: dedicated Supabase project
- Secrets: Cloudflare/Supabase environment variables only. Never commit secrets.

## Deployment

Preview target: `https://sorico.alfonsogiozmillan.workers.dev`

## Status

Foundation initialized 2026-09-29.
