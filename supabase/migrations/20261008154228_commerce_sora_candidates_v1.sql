create table public.commerce_sourcing_candidates (
 id uuid primary key default gen_random_uuid(),
 sora_reference text not null unique check(sora_reference ~ '^TK-[0-9]{4}$'),
 name text not null, set_code text, language text not null default 'JP' check(language in ('JP','EN','ES')),
 format text not null check(format in ('BOOSTER_BOX','PREMIUM_DECK_SET')),
 sora_url text not null check(sora_url ~ '^https://(www\.)?sora-cardshop\.com/product/TK-[0-9]{4}$'),
 cardmarket_url text not null check(cardmarket_url ~ '^https://www\.cardmarket\.com/es/Pokemon/Products/'),
 market_floor_cents integer check(market_floor_cents is null or market_floor_cents>=0),
 market_trend_cents integer check(market_trend_cents is null or market_trend_cents>=0),
 market_avg30_cents integer check(market_avg30_cents is null or market_avg30_cents>=0),
 market_avg7_cents integer check(market_avg7_cents is null or market_avg7_cents>=0),
 market_avg1_cents integer check(market_avg1_cents is null or market_avg1_cents>=0),
 market_listings_count integer check(market_listings_count is null or market_listings_count>=0),
 market_source text not null check(market_source in ('USER_SCREENSHOT','WEB_INDEXED')),
 market_snapshot_date date, market_notes text not null default '',
 sora_b2b_quote_jpy integer check(sora_b2b_quote_jpy is null or sora_b2b_quote_jpy>=0),
 sora_b2b_eur_cents integer check(sora_b2b_eur_cents is null or sora_b2b_eur_cents>=0),
 sora_quote_source text, fx_rate_date date,
 landed_unit_cost_eur_cents integer check(landed_unit_cost_eur_cents is null or landed_unit_cost_eur_cents>=0),
 planned_pvp_eur_cents integer check(planned_pvp_eur_cents is null or planned_pvp_eur_cents>0),
 quote_verified boolean not null default false,
 decision text not null default 'PENDING_QUOTE'
  check(decision in ('PENDING_QUOTE','REVIEW','NO_GO','BUY_CANDIDATE','EXCLUDED')),
 decision_reason text not null default '',
 last_reviewed_by uuid references auth.users(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 constraint exclude_non_booster check(format='BOOSTER_BOX' or decision='EXCLUDED'),
 constraint candidate_requires_cost check(decision<>'BUY_CANDIDATE' or (
   quote_verified and landed_unit_cost_eur_cents is not null
   and planned_pvp_eur_cents is not null and format='BOOSTER_BOX'))
);
create index commerce_sourcing_decision_idx on public.commerce_sourcing_candidates(decision,name);
create index commerce_sourcing_reviewer_idx on public.commerce_sourcing_candidates(last_reviewed_by);
create table public.commerce_sourcing_audit (
 id uuid primary key default gen_random_uuid(),
 candidate_id uuid not null references public.commerce_sourcing_candidates(id) on delete restrict,
 actor_id uuid references auth.users(id),
 before_state jsonb not null, after_state jsonb not null,
 created_at timestamptz not null default now()
);
create index commerce_sourcing_audit_candidate_idx on public.commerce_sourcing_audit(candidate_id,created_at desc);
create index commerce_sourcing_audit_actor_idx on public.commerce_sourcing_audit(actor_id);
alter table public.commerce_sourcing_candidates enable row level security;
alter table public.commerce_sourcing_audit enable row level security;
revoke all on public.commerce_sourcing_candidates,public.commerce_sourcing_audit from public,anon,authenticated;
grant all on public.commerce_sourcing_candidates,public.commerce_sourcing_audit to service_role;
create function public.commerce_update_sourcing(p_id uuid,p_patch jsonb,p_actor uuid)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare old_item public.commerce_sourcing_candidates%rowtype;
        new_item public.commerce_sourcing_candidates%rowtype;
        k text;
begin
 if p_patch is null or jsonb_typeof(p_patch)<>'object' or p_patch='{}'::jsonb
 then raise exception 'INVALID_UPDATE'; end if;
 for k in select jsonb_object_keys(p_patch) loop
  if k not in ('sora_b2b_eur_cents','landed_unit_cost_eur_cents','planned_pvp_eur_cents',
    'quote_verified','decision','decision_reason','sora_quote_source')
  then raise exception 'INVALID_FIELD'; end if;
 end loop;
 select * into old_item from public.commerce_sourcing_candidates where id=p_id for update;
 if not found then raise exception 'CANDIDATE_NOT_FOUND'; end if;
 update public.commerce_sourcing_candidates set
 sora_b2b_eur_cents=case when p_patch ? 'sora_b2b_eur_cents' then nullif(p_patch->>'sora_b2b_eur_cents','')::integer else sora_b2b_eur_cents end,
 landed_unit_cost_eur_cents=case when p_patch ? 'landed_unit_cost_eur_cents' then nullif(p_patch->>'landed_unit_cost_eur_cents','')::integer else landed_unit_cost_eur_cents end,
 planned_pvp_eur_cents=case when p_patch ? 'planned_pvp_eur_cents' then nullif(p_patch->>'planned_pvp_eur_cents','')::integer else planned_pvp_eur_cents end,
 quote_verified=case when p_patch ? 'quote_verified' then (p_patch->>'quote_verified')::boolean else quote_verified end,
 decision=case when p_patch ? 'decision' then p_patch->>'decision' else decision end,
 decision_reason=case when p_patch ? 'decision_reason' then left(coalesce(p_patch->>'decision_reason',''),1000) else decision_reason end,
 sora_quote_source=case when p_patch ? 'sora_quote_source' then left(coalesce(p_patch->>'sora_quote_source',''),500) else sora_quote_source end,
 last_reviewed_by=p_actor,updated_at=now()
 where id=p_id returning * into new_item;
 insert into public.commerce_sourcing_audit(candidate_id,actor_id,before_state,after_state)
 values(p_id,p_actor,to_jsonb(old_item),to_jsonb(new_item));
 return jsonb_build_object('id',p_id,'decision',new_item.decision,'updated',true);
end $$;
revoke all on function public.commerce_update_sourcing(uuid,jsonb,uuid) from public,anon,authenticated;
grant execute on function public.commerce_update_sourcing(uuid,jsonb,uuid) to service_role;
