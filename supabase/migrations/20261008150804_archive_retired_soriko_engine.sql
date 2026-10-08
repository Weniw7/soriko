-- Retire Soriko Engine without irreversible deletion.
-- Historical Engine tables/views/functions move outside exposed public Data API.
create schema if not exists soriko_legacy;
revoke all on schema soriko_legacy from public,anon,authenticated,service_role;
alter view public.engine_latest_metrics set schema soriko_legacy;
do $$
declare name text;
begin
  foreach name in array array['engine_superadmin','engine_settings','engine_alerts','engine_decisions','engine_fx_rates','engine_jobs','engine_metrics','product_aliases','market_observations','market_snapshots','market_sources','scan_runs','sets','products','suppliers','supplier_listings','shipping_quotes','landed_cost_calculations','opportunities','purchase_orders','purchase_order_items','inventory_lots','sales_orders','sales_order_items','wishlist_items'] loop
    execute format('alter table public.%I set schema soriko_legacy',name);
  end loop;
end $$;
do $$
declare f record;
begin
  for f in
    select p.proname,pg_get_function_identity_arguments(p.oid) as signature
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname like 'engine_%'
  loop
    execute format('alter function public.%I(%s) set schema soriko_legacy',f.proname,f.signature);
  end loop;
end $$;
comment on schema soriko_legacy is 'Read-only recoverable archive of retired Soriko Engine market data. Not exposed via Data API.';
