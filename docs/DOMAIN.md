# Domain strategy

Primary brand domain: `sorikoclub.com`

Recommended hierarchy:
- `sorikoclub.com` - customer-facing storefront
- `www.sorikoclub.com` - redirect/canonical storefront
- `admin.sorikoclub.com` - internal Soriko Engine

Optional defensive registrations:
- `sorikoclub.es`
- `sorikoclub.eu`

Do not create separate paid hosting for any of these domains. DNS should remain on Cloudflare.

When Shopify is activated, only repoint the root/www records to Shopify. Keep `admin.sorikoclub.com` on Cloudflare.
