# SORIKO CLUB architecture

## Separation

SORIKO CLUB is intentionally isolated from AMM CORE SOLUTIONS' other products.

### Dedicated resources

- GitHub repository: `Weniw7/soriko`
- Cloudflare Worker project: `soriko-club`
- Supabase project: `soriko-club`
- Production secrets: independent from AMM/X3/Attempo
- Shopify store: independent sales channel when activated

## Logical layers

### Public commerce
Customer-facing catalogue and later Shopify integration.

### Soriko Engine
Internal business intelligence:
- market snapshots
- product ranking
- Japan sourcing
- supplier comparison
- landed cost
- margin / ROI
- buy scoring
- restocking

### Operations
- purchasing
- inbound shipments
- inventory lots
- sales
- stock ageing
- capital allocation

## Database domains

Planned entities:
- sets
- products
- suppliers
- supplier_listings
- market_sources
- market_snapshots
- shipping_quotes
- landed_cost_calculations
- opportunities
- purchase_orders
- purchase_order_items
- inventory_lots
- sales_orders
- sales_order_items
- scan_runs

## Security

Public catalogue data and internal operations data must not share unrestricted policies.
RLS is mandatory for every exposed table.
Administrative authorization will use Supabase Auth and authorization data stored in app metadata / dedicated role tables, never user-editable metadata.

## Deployment

Cloudflare currently recommends vinext on Workers for new Next.js projects. Cloudflare credentials and Supabase secrets must be configured in Cloudflare, never committed to GitHub.
