-- KODJO — T1 : un seul compte KODJO par utilisateur Auth, identités Apple et Google rattachées par Supabase
-- (décision de Hermann du 27/11/2026, réponse « A » : « un seul compte KODJO par adresse e-mail » ; registre CPT-35).
--
-- Recette du 27/11/2026 : Supabase rattache automatiquement à un même utilisateur Auth les identités Apple et Google
-- de même adresse e-mail vérifiée. `link_account` retenait la plus ancienne identité (Google), le compte était créé
-- « Google », le jeton Apple refusé (`not_an_apple_account`) et la suppression ne révoquait pas l'accès Apple.
-- 1. `link_account` reçoit le fournisseur de la connexion en cours (`p_provider`) et retient son identité ; le compte
--    indique le fournisseur de la dernière connexion.
-- 2. `store_apple_token` exige une identité Apple de l'utilisateur, et non plus un compte « Apple ».
-- 3. `discard_unlinked_auth_user` : l'utilisateur Auth créé par une connexion refusée par l'app (CPT-14, CPT-32), sans
--    compte KODJO, est supprimé ; il ne peut plus être rattaché plus tard à une autre identité de même e-mail.

drop function if exists public.link_account(text, text, text);

create or replace function public.link_account(
  p_local_user_id text,
  p_given_name text default null,
  p_family_name text default null,
  p_provider text default null
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_provider text;
  v_subject text;
  v_email text;
  v_account public.accounts;
  v_catalogue_id uuid;
  v_local_users text[];
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if p_local_user_id is null or length(p_local_user_id) not between 1 and 64 then
    raise exception 'invalid_local_user_id' using errcode = '22023';
  end if;
  if p_provider is not null and p_provider not in ('apple', 'google') then
    raise exception 'unsupported_provider' using errcode = '22023';
  end if;

  -- Identité de la connexion en cours ; à défaut (ancien client), la plus ancienne.
  select i.provider, i.provider_id into v_provider, v_subject
    from auth.identities i
   where i.user_id = v_uid and i.provider in ('apple', 'google')
   order by (i.provider = p_provider) desc nulls last, i.created_at
   limit 1;
  if v_provider is null or (p_provider is not null and v_provider <> p_provider) then
    raise exception 'unsupported_provider' using errcode = '22023';
  end if;

  select u.email into v_email from auth.users u where u.id = v_uid;

  insert into public.accounts as a (auth_user_id, provider, provider_subject, email, email_is_private_relay, given_name, family_name)
  values (
    v_uid, v_provider, v_subject, v_email,
    coalesce(v_email ilike '%@privaterelay.appleid.com', false),
    nullif(btrim(p_given_name), ''), nullif(btrim(p_family_name), '')
  )
  on conflict (auth_user_id) do update
     set provider = excluded.provider,
         provider_subject = excluded.provider_subject,
         email = coalesce(excluded.email, a.email),
         email_is_private_relay = coalesce(excluded.email ilike '%@privaterelay.appleid.com', a.email_is_private_relay),
         -- Apple ne transmet le nom qu'à la première autorisation : jamais d'écrasement par une valeur vide.
         given_name = coalesce(a.given_name, excluded.given_name),
         family_name = coalesce(a.family_name, excluded.family_name);

  select * into v_account from public.accounts where auth_user_id = v_uid for update;
  if v_account.deletion_requested_at is not null then
    raise exception 'deletion_in_progress' using errcode = '55000';
  end if;

  insert into public.catalogues (owner_auth_user_id) values (v_uid)
  on conflict (owner_auth_user_id) do nothing;
  select id into v_catalogue_id from public.catalogues where owner_auth_user_id = v_uid;

  insert into public.account_local_users (auth_user_id, local_user_id) values (v_uid, p_local_user_id)
  on conflict do nothing;
  select array_agg(local_user_id order by first_linked_at, local_user_id) into v_local_users
    from public.account_local_users where auth_user_id = v_uid;

  return jsonb_build_object(
    'auth_user_id', v_uid,
    'provider', v_account.provider,
    'provider_subject', v_account.provider_subject,
    'email', v_account.email,
    'email_is_private_relay', v_account.email_is_private_relay,
    'given_name', v_account.given_name,
    'family_name', v_account.family_name,
    'catalogue_id', v_catalogue_id,
    'local_user_ids', to_jsonb(v_local_users)
  );
end;
$$;

revoke all on function public.link_account(text, text, text, text) from public, anon;
grant execute on function public.link_account(text, text, text, text) to authenticated;

create or replace function public.store_apple_token(p_auth_user_id uuid, p_client_id text, p_ciphertext text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (select 1 from public.accounts where auth_user_id = p_auth_user_id) then
    raise exception 'no_account' using errcode = '22023';
  end if;
  if not exists (select 1 from auth.identities where user_id = p_auth_user_id and provider = 'apple') then
    raise exception 'no_apple_identity' using errcode = '22023';
  end if;
  insert into public.apple_tokens (auth_user_id, client_id, refresh_token_ciphertext, updated_at)
  values (p_auth_user_id, p_client_id, p_ciphertext, now())
  on conflict (auth_user_id) do update
     set client_id = excluded.client_id, refresh_token_ciphertext = excluded.refresh_token_ciphertext, updated_at = now();
  update public.accounts set apple_tokens_invalidated_at = null where auth_user_id = p_auth_user_id;
end;
$$;
revoke all on function public.store_apple_token(uuid, text, text) from public, anon, authenticated;
grant execute on function public.store_apple_token(uuid, text, text) to service_role;

-- Vrai si l'utilisateur Auth de l'appelant, sans compte KODJO, a été supprimé ; faux sinon (compte présent : rien).
create or replace function public.discard_unlinked_auth_user()
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return false;
  end if;
  if exists (select 1 from public.accounts where auth_user_id = v_uid)
     or exists (select 1 from public.account_deletions where auth_user_id = v_uid and auth_deleted_at is null) then
    return false;
  end if;
  delete from auth.users where id = v_uid;
  return true;
end;
$$;
revoke all on function public.discard_unlinked_auth_user() from public, anon;
grant execute on function public.discard_unlinked_auth_user() to authenticated;
