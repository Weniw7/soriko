-- Make publication explicit and atomic; keep unsold inventory at zero.
create or replace function public.commerce_create_listing(p_body jsonb,p_actor uuid)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare
 v_product uuid;
 v_variant uuid;
 v_slug text:=trim(coalesce(p_body->>'slug',''));
 v_name text:=trim(coalesce(p_body->>'name',''));
 v_sku text:=upper(trim(coalesce(p_body->>'sku','')));
 v_cat text:=coalesce(p_body->>'category','BOOSTER_BOX');
 v_lang text:=coalesce(p_body->>'language','JP');
 v_status text:=coalesce(nullif(p_body->>'status',''),'draft');
 v_price integer:=nullif(p_body->>'price_cents','')::integer;
 v_vat integer:=nullif(p_body->>'vat_basis_points','')::integer;
begin
 if p_body is null or jsonb_typeof(p_body)<>'object'
  or v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(v_slug)>120
  or length(v_name) not between 3 and 180 or length(v_sku) not between 3 and 80
  or v_lang not in ('JP','EN','ES')
  or v_cat not in ('BOOSTER_BOX','ETB','BUNDLE','PACK','COLLECTION','SINGLE','ACCESSORY','OTHER')
  or v_status not in ('draft','active')
 then raise exception 'INVALID_LISTING'; end if;
 if v_status='active' and (v_price is null or v_price<=0 or v_vat is null)
 then raise exception 'PUBLISH_REQUIRES_PRICE_AND_VAT'; end if;
 insert into public.commerce_products(slug,name,description,category,set_name,image_url,status,created_by)
 values(v_slug,v_name,coalesce(p_body->>'description',''),v_cat,
        nullif(p_body->>'set_name',''),nullif(p_body->>'image_url',''),v_status,p_actor)
 returning id into v_product;
 insert into public.commerce_variants(product_id,sku,language,edition,price_cents,vat_basis_points,sealed)
 values(v_product,v_sku,v_lang,coalesce(nullif(p_body->>'edition',''),'STANDARD'),
        v_price,v_vat,coalesce((p_body->>'sealed')::boolean,true))
 returning id into v_variant;
 insert into public.commerce_inventory(variant_id) values(v_variant);
 return jsonb_build_object('product_id',v_product,'variant_id',v_variant,
   'status',v_status,'visible_in_shop',v_status='active');
end $$;

create or replace function public.commerce_update_listing(p_variant uuid,p_patch jsonb)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare
 v_product uuid;
 v_variant public.commerce_variants%rowtype;
 v_status text;
 v_key text;
begin
 if p_patch is null or jsonb_typeof(p_patch)<>'object' or p_patch='{}'::jsonb
 then raise exception 'INVALID_LISTING_UPDATE'; end if;
 for v_key in select jsonb_object_keys(p_patch)
 loop
  if v_key not in ('status','name','slug','description','set_name','image_url',
                   'price_cents','vat_basis_points','active')
  then raise exception 'INVALID_LISTING_FIELD'; end if;
 end loop;
 select product_id into v_product
   from public.commerce_variants where id=p_variant for update;
 if not found then raise exception 'UNKNOWN_VARIANT'; end if;
 if p_patch ? 'price_cents' or p_patch ? 'vat_basis_points' or p_patch ? 'active' then
  update public.commerce_variants set
   price_cents=case when p_patch ? 'price_cents' then nullif(p_patch->>'price_cents','')::integer else price_cents end,
   vat_basis_points=case when p_patch ? 'vat_basis_points' then nullif(p_patch->>'vat_basis_points','')::integer else vat_basis_points end,
   active=case when p_patch ? 'active' then (p_patch->>'active')::boolean else active end,
   updated_at=now()
  where id=p_variant;
 end if;
 select * into v_variant from public.commerce_variants where id=p_variant;
 select coalesce(p_patch->>'status',status) into v_status
 from public.commerce_products where id=v_product for update;
 if v_status not in ('draft','active','archived') then raise exception 'INVALID_PUBLICATION_STATUS'; end if;
 if v_status='active' and (not v_variant.active or v_variant.price_cents is null
    or v_variant.price_cents<=0 or v_variant.vat_basis_points is null)
 then raise exception 'PUBLISH_REQUIRES_PRICE_AND_VAT'; end if;
 if p_patch ? 'status' or p_patch ? 'slug' or p_patch ? 'name' or p_patch ? 'description'
    or p_patch ? 'set_name' or p_patch ? 'image_url' then
  update public.commerce_products set
   status=v_status,
   slug=case when p_patch ? 'slug' then p_patch->>'slug' else slug end,
   name=case when p_patch ? 'name' then p_patch->>'name' else name end,
   description=case when p_patch ? 'description' then coalesce(p_patch->>'description','') else description end,
   set_name=case when p_patch ? 'set_name' then nullif(p_patch->>'set_name','') else set_name end,
   image_url=case when p_patch ? 'image_url' then nullif(p_patch->>'image_url','') else image_url end,
   updated_at=now()
  where id=v_product;
 end if;
 return jsonb_build_object('product_id',v_product,'variant_id',p_variant,
     'status',v_status,'visible_in_shop',v_status='active','updated',true);
end $$;

revoke all on function public.commerce_create_listing(jsonb,uuid) from public,anon,authenticated;
revoke all on function public.commerce_update_listing(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.commerce_create_listing(jsonb,uuid) to service_role;
grant execute on function public.commerce_update_listing(uuid,jsonb) to service_role;
