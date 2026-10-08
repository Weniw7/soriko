create index if not exists commerce_order_items_variant_idx on public.commerce_order_items(variant_id);
create index if not exists commerce_payment_events_order_idx on public.commerce_payment_events(order_id);
create index if not exists commerce_products_creator_idx on public.commerce_products(created_by);
create index if not exists commerce_reservations_variant_idx on public.commerce_reservations(variant_id);
create index if not exists commerce_stock_movements_actor_idx on public.commerce_stock_movements(actor_id);
create index if not exists commerce_supplier_quotes_creator_idx on public.commerce_supplier_quotes(created_by);
create index if not exists commerce_supplier_quotes_variant_idx on public.commerce_supplier_quotes(variant_id);
