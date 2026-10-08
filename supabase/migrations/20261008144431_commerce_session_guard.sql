create schema if not exists commerce_private;
revoke all on schema commerce_private from public, anon, authenticated;
grant usage on schema commerce_private to service_role;
create function commerce_private.session_is_active(p_user uuid,p_session uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select exists (
    select 1 from auth.sessions s
    where s.id=p_session and s.user_id=p_user
      and (s.not_after is null or s.not_after>now())
  );
$$;
revoke all on function commerce_private.session_is_active(uuid,uuid) from public,anon,authenticated;
grant execute on function commerce_private.session_is_active(uuid,uuid) to service_role;
create function public.commerce_session_active(p_user uuid,p_session uuid)
returns boolean language sql stable security invoker set search_path='' as $$
  select commerce_private.session_is_active(p_user,p_session);
$$;
revoke all on function public.commerce_session_active(uuid,uuid) from public,anon,authenticated;
grant execute on function public.commerce_session_active(uuid,uuid) to service_role;
