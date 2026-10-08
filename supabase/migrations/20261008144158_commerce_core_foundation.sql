-- Soriko Commerce V1: isolated domain inside existing Soriko Supabase project.
-- No Engine data or existing auth accounts are deleted.
create table public.commerce_staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check(role in ('admin','manager','operator','viewer')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
insert into public.commerce_staff (user_id,role)
select user_id, case role when 'admin' then 'admin' when 'buyer' then 'manager' else 'viewer' end
from public.profiles
on conflict(user_id) do nothing;

create table public.commerce_products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check(char_length(trim(name)) between 3 and 180),
  description text not null default '',
  category text not null check(category in ('BOOSTER_BOX','ETB','BUNDLE','PACK','COLLECTION','SINGLE','ACCESSORY','OTHER')),
  set_name text,
  image_url text check (image_url is null or image_url ~ '^https://'),
  status text not null default 'draft' check(status in ('draft','active','archived')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index commerce_products_status_idx on public.commerce_products(status,category);

create table public.commerce_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.commerce_products(id) on delete restrict,
  sku text not null unique check(char_length(trim(sku)) between 3 and 80),
  language text not null check(language in ('JP','EN','ES')),
  edition text not null default 'STANDARD',
  sealed boolean not null default true,
  barcode text,
  price_cents integer check(price_cents is null or price_cents > 0),
  vat_basis_points integer check(vat_basis_points is null or vat_basis_points between 0 and 10000),
  cost_cents integer check(cost_cents is null or cost_cents >= 0),
  currency text not null default 'EUR' check(currency='EUR'),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index commerce_variants_product_idx on public.commerce_variants(product_id,language);

create table public.commerce_inventory (
  variant_id uuid primary key references public.commerce_variants(id) on delete restrict,
  on_hand integer not null default 0 check(on_hand>=0),
  reserved integer not null default 0 check(reserved>=0),
  committed integer not null default 0 check(committed>=0),
  damaged integer not null default 0 check(damaged>=0),
  updated_at timestamptz not null default now(),
  constraint commerce_stock_not_negative check(on_hand >= reserved + committed + damaged)
);

create table public.commerce_stock_movements (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.commerce_variants(id) on delete restrict,
  action text not null check(action in ('RECEIVE','ADJUST','RESERVE','RELEASE','COMMIT','SHIP','DAMAGE','RETURN')),
  delta_on_hand integer not null default 0,
  delta_reserved integer not null default 0,
  delta_committed integer not null default 0,
  quantity_after integer not null check(quantity_after>=0),
  reason text not null,
  actor_id uuid references auth.users(id),
  idempotency_key text not null unique,
  created_at timestamptz not null default now()
);
create index commerce_stock_movements_variant_idx on public.commerce_stock_movements(variant_id,created_at desc);

create table public.commerce_orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  status text not null default 'pending_payment' check(status in ('pending_payment','paid','processing','shipped','delivered','cancelled','expired','refunded')),
  customer_email text not null,
  currency text not null default 'EUR' check(currency='EUR'),
  subtotal_cents bigint not null default 0 check(subtotal_cents>=0),
  tax_cents bigint not null default 0 check(tax_cents>=0),
  shipping_cents bigint not null default 0 check(shipping_cents>=0),
  total_cents bigint not null default 0 check(total_cents>=0),
  idempotency_key text not null unique,
  expires_at timestamptz,
  paid_at timestamptz,
  shipped_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index commerce_orders_status_idx on public.commerce_orders(status,created_at desc);

create table public.commerce_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.commerce_orders(id) on delete restrict,
  variant_id uuid not null references public.commerce_variants(id) on delete restrict,
  sku_snapshot text not null,
  name_snapshot text not null,
  quantity integer not null check(quantity > 0),
  unit_price_cents integer not null check(unit_price_cents > 0),
  vat_basis_points integer not null check(vat_basis_points between 0 and 10000),
  line_total_cents bigint not null check(line_total_cents>0),
  unique(order_id,variant_id)
);

create table public.commerce_reservations (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.commerce_orders(id) on delete restrict,
  variant_id uuid not null references public.commerce_variants(id) on delete restrict,
  quantity integer not null check(quantity>0),
  status text not null default 'held' check(status in ('held','committed','released','expired')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique(order_id,variant_id)
);
create index commerce_reservations_expiry_idx on public.commerce_reservations(expires_at) where status='held';

create table public.commerce_payment_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.commerce_orders(id) on delete restrict,
  provider text not null,
  external_event_id text not null,
  external_payment_ref text,
  status text not null,
  amount_cents bigint not null check(amount_cents>=0),
  received_at timestamptz not null default now(),
  unique(provider,external_event_id)
);

create table public.commerce_supplier_quotes (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.commerce_variants(id) on delete restrict,
  supplier_name text not null,
  supplier_url text,
  original_currency text not null default 'EUR',
  original_unit_cost numeric(12,2) not null check(original_unit_cost>=0),
  unit_cost_eur numeric(12,2) not null check(unit_cost_eur>=0),
  min_order_qty integer not null default 1 check(min_order_qty>0),
  captured_at timestamptz not null default now(),
  verified boolean not null default false,
  created_by uuid references auth.users(id)
);

-- Explicitly keep every new table inaccessible to browser-originated Supabase Data API.
do $$
declare t text;
begin
  foreach t in array array[
    'commerce_staff','commerce_products','commerce_variants','commerce_inventory',
    'commerce_stock_movements','commerce_orders','commerce_order_items',
    'commerce_reservations','commerce_payment_events','commerce_supplier_quotes'
  ] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from public, anon, authenticated',t);
    execute format('grant all on public.%I to service_role',t);
  end loop;
end $$;

-- Service-only atomic inventory adjustment with row lock and replay safety.
create function public.commerce_adjust_stock(
  p_variant uuid, p_delta integer, p_reason text, p_actor uuid, p_key text
) returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare
  v_stock public.commerce_inventory%rowtype;
  v_existing public.commerce_stock_movements%rowtype;
  v_after integer;
begin
  if p_key is null or length(p_key)<12 or length(p_key)>180 or p_delta=0 or p_delta is null
     or length(trim(coalesce(p_reason,'')))<5 then raise exception 'INVALID_STOCK_ADJUSTMENT'; end if;
  perform pg_advisory_xact_lock(hashtextextended('stock:'||p_key,0));
  select * into v_existing from public.commerce_stock_movements where idempotency_key='adjust:'||p_key;
  if found then
    if v_existing.variant_id<>p_variant or v_existing.delta_on_hand<>p_delta then
      raise exception 'IDEMPOTENCY_CONFLICT';
    end if;
    return jsonb_build_object('movement_id',v_existing.id,'on_hand',v_existing.quantity_after,'replayed',true);
  end if;
  select * into v_stock from public.commerce_inventory where variant_id=p_variant for update;
  if not found then raise exception 'UNKNOWN_VARIANT'; end if;
  v_after := v_stock.on_hand + p_delta;
  if v_after < v_stock.reserved + v_stock.committed + v_stock.damaged
     or v_after<0 then raise exception 'INSUFFICIENT_UNCOMMITTED_STOCK'; end if;
  update public.commerce_inventory set on_hand=v_after,updated_at=now() where variant_id=p_variant;
  insert into public.commerce_stock_movements
  (variant_id,action,delta_on_hand,quantity_after,reason,actor_id,idempotency_key)
  values(p_variant,case when p_delta>0 then 'RECEIVE' else 'ADJUST' end,p_delta,v_after,trim(p_reason),p_actor,'adjust:'||p_key)
  returning * into v_existing;
  return jsonb_build_object('movement_id',v_existing.id,'on_hand',v_after,'replayed',false);
end $$;

-- Server-only listing creation: product/variant/inventory commit together.
create function public.commerce_create_listing(
  p_body jsonb,p_actor uuid
) returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare
  v_product uuid;
  v_variant uuid;
  v_slug text := trim(coalesce(p_body->>'slug',''));
  v_name text := trim(coalesce(p_body->>'name',''));
  v_sku text := upper(trim(coalesce(p_body->>'sku','')));
  v_category text := coalesce(p_body->>'category','BOOSTER_BOX');
  v_language text := coalesce(p_body->>'language','JP');
begin
  if v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(v_slug)>120
     or length(v_name) not between 3 and 180 or length(v_sku) not between 3 and 80
     or v_language not in ('JP','EN','ES')
     or v_category not in ('BOOSTER_BOX','ETB','BUNDLE','PACK','COLLECTION','SINGLE','ACCESSORY','OTHER')
     then raise exception 'INVALID_LISTING'; end if;
  insert into public.commerce_products(slug,name,description,category,set_name,image_url,created_by)
  values(v_slug,v_name,coalesce(p_body->>'description',''),v_category,nullif(p_body->>'set_name',''),
         nullif(p_body->>'image_url',''),p_actor)
  returning id into v_product;
  insert into public.commerce_variants
    (product_id,sku,language,edition,price_cents,vat_basis_points,sealed)
  values(v_product,v_sku,v_language,coalesce(nullif(p_body->>'edition',''),'STANDARD'),
         nullif(p_body->>'price_cents','')::integer,
         nullif(p_body->>'vat_basis_points','')::integer,
         coalesce((p_body->>'sealed')::boolean,true))
  returning id into v_variant;
  insert into public.commerce_inventory(variant_id) values(v_variant);
  return jsonb_build_object('product_id',v_product,'variant_id',v_variant);
end $$;

-- Existing variants may be priced/published without mutating inventory.
create function public.commerce_update_listing(
  p_variant uuid,p_patch jsonb
) returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare v_product uuid;
begin
  select product_id into v_product from public.commerce_variants where id=p_variant;
  if not found then raise exception 'UNKNOWN_VARIANT'; end if;
  if p_patch ? 'price_cents' or p_patch ? 'vat_basis_points' or p_patch ? 'active' then
    update public.commerce_variants set
      price_cents=case when p_patch ? 'price_cents' then nullif(p_patch->>'price_cents','')::integer else price_cents end,
      vat_basis_points=case when p_patch ? 'vat_basis_points' then nullif(p_patch->>'vat_basis_points','')::integer else vat_basis_points end,
      active=case when p_patch ? 'active' then (p_patch->>'active')::boolean else active end,
      updated_at=now()
    where id=p_variant;
  end if;
  if p_patch ? 'status' or p_patch ? 'name' or p_patch ? 'image_url' then
    update public.commerce_products set
      status=case when p_patch ? 'status' then p_patch->>'status' else status end,
      name=case when p_patch ? 'name' then p_patch->>'name' else name end,
      image_url=case when p_patch ? 'image_url' then nullif(p_patch->>'image_url','') else image_url end,
      updated_at=now()
    where id=v_product;
  end if;
  return jsonb_build_object('product_id',v_product,'variant_id',p_variant,'updated',true);
end $$;

-- Future checkout core: reserve stock atomically, never trust customer prices.
create function public.commerce_reserve_order(
  p_email text,p_items jsonb,p_key text
) returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare
  v_order uuid;
  v_previous public.commerce_orders%rowtype;
  v_line record;
  v_stock public.commerce_inventory%rowtype;
  v_price integer;
  v_vat integer;
  v_sku text;
  v_name text;
  v_subtotal bigint:=0;
  v_tax bigint:=0;
  v_expires timestamptz:=now()+interval '15 minutes';
begin
  if p_key is null or length(p_key)<12 or length(p_key)>180
     or p_email is null or length(p_email)>254 or p_email !~ '^[^@ ]+@[^@ ]+\.[^@ ]+$'
     or jsonb_typeof(p_items) is distinct from 'array'
     or jsonb_array_length(p_items) not between 1 and 20 then
    raise exception 'INVALID_CHECKOUT';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('order:'||p_key,0));
  select * into v_previous from public.commerce_orders where idempotency_key=p_key;
  if found then return jsonb_build_object('order_id',v_previous.id,'status',v_previous.status,'replayed',true); end if;
  insert into public.commerce_orders(reference,customer_email,idempotency_key,expires_at)
  values('SK-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)),lower(trim(p_email)),p_key,v_expires)
  returning id into v_order;

  for v_line in
    select variant_id,sum(quantity)::integer as quantity
    from jsonb_to_recordset(p_items) as x(variant_id uuid,quantity integer)
    group by variant_id order by variant_id
  loop
    if v_line.variant_id is null or v_line.quantity is null
       or v_line.quantity<1 or v_line.quantity>20 then raise exception 'INVALID_QUANTITY'; end if;
    select * into v_stock from public.commerce_inventory where variant_id=v_line.variant_id for update;
    if not found then raise exception 'UNKNOWN_VARIANT'; end if;
    select v.price_cents,v.vat_basis_points,v.sku,p.name
      into v_price,v_vat,v_sku,v_name
    from public.commerce_variants v join public.commerce_products p on p.id=v.product_id
    where v.id=v_line.variant_id and v.active and p.status='active';
    if v_price is null or v_vat is null then raise exception 'NOT_FOR_SALE'; end if;
    if v_stock.on_hand-v_stock.reserved-v_stock.committed-v_stock.damaged < v_line.quantity
      then raise exception 'OUT_OF_STOCK'; end if;
    update public.commerce_inventory set reserved=reserved+v_line.quantity,updated_at=now()
      where variant_id=v_line.variant_id;
    insert into public.commerce_order_items
      (order_id,variant_id,sku_snapshot,name_snapshot,quantity,unit_price_cents,vat_basis_points,line_total_cents)
    values(v_order,v_line.variant_id,v_sku,v_name,v_line.quantity,v_price,v_vat,v_price::bigint*v_line.quantity);
    insert into public.commerce_reservations(order_id,variant_id,quantity,expires_at)
    values(v_order,v_line.variant_id,v_line.quantity,v_expires);
    insert into public.commerce_stock_movements
      (variant_id,action,delta_reserved,quantity_after,reason,idempotency_key)
    values(v_line.variant_id,'RESERVE',v_line.quantity,v_stock.on_hand,'Checkout reservation',
           'reserve:'||v_order||':'||v_line.variant_id);
    v_subtotal := v_subtotal+v_price::bigint*v_line.quantity;
    v_tax := v_tax+round((v_price::numeric*v_line.quantity*v_vat)/(10000+v_vat))::bigint;
  end loop;
  update public.commerce_orders set subtotal_cents=v_subtotal,tax_cents=v_tax,
    total_cents=v_subtotal,updated_at=now() where id=v_order;
  return jsonb_build_object('order_id',v_order,'subtotal_cents',v_subtotal,
                            'tax_cents',v_tax,'total_cents',v_subtotal,'status','pending_payment','replayed',false);
end $$;

create function public.commerce_release_order(p_order uuid,p_status text)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare v_state text; v_res record;
begin
  if p_status not in ('expired','cancelled') then raise exception 'INVALID_RELEASE_STATUS'; end if;
  select status into v_state from public.commerce_orders where id=p_order for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_state in ('expired','cancelled') then return jsonb_build_object('status',v_state,'replayed',true); end if;
  if v_state<>'pending_payment' then raise exception 'ORDER_NOT_RELEASEABLE'; end if;
  for v_res in select * from public.commerce_reservations where order_id=p_order and status='held'
               order by variant_id for update loop
    update public.commerce_inventory set reserved=reserved-v_res.quantity,updated_at=now()
      where variant_id=v_res.variant_id;
    update public.commerce_reservations set status=case when p_status='expired' then 'expired' else 'released' end where id=v_res.id;
    insert into public.commerce_stock_movements
      (variant_id,action,delta_reserved,quantity_after,reason,idempotency_key)
    select v_res.variant_id,'RELEASE',-v_res.quantity,on_hand,'Order '||p_status,'release:'||v_res.id
    from public.commerce_inventory where variant_id=v_res.variant_id;
  end loop;
  update public.commerce_orders set status=p_status,updated_at=now() where id=p_order;
  return jsonb_build_object('status',p_status,'replayed',false);
end $$;

-- All business RPCs are explicitly server-only. The Edge Function verifies staff identity first.
do $$
declare signature text;
begin
  foreach signature in array array[
    'commerce_adjust_stock(uuid,integer,text,uuid,text)',
    'commerce_create_listing(jsonb,uuid)',
    'commerce_update_listing(uuid,jsonb)',
    'commerce_reserve_order(text,jsonb,text)',
    'commerce_release_order(uuid,text)'
  ] loop
    execute 'revoke all on function public.'||signature||' from public,anon,authenticated';
    execute 'grant execute on function public.'||signature||' to service_role';
  end loop;
end $$;
