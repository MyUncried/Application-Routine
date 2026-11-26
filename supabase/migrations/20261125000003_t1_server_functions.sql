-- KODJO — T1 Compte : fonctions SQL réservées aux fonctions serveur (clé de service).
-- Plan T1 : « apple-token », « apple-notifications » (F3 : transaction, reprise, (iss, jti)).

-- Enregistre un jeton Apple révocable et rend caduc le marqueur d'invalidation (même transaction).
create or replace function public.store_apple_token(p_auth_user_id uuid, p_client_id text, p_ciphertext text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (select 1 from public.accounts where auth_user_id = p_auth_user_id and provider = 'apple') then
    raise exception 'not_an_apple_account' using errcode = '22023';
  end if;
  insert into public.apple_tokens (auth_user_id, client_id, refresh_token_ciphertext, updated_at)
  values (p_auth_user_id, p_client_id, p_ciphertext, now())
  on conflict (auth_user_id) do update
     set client_id = excluded.client_id, refresh_token_ciphertext = excluded.refresh_token_ciphertext, updated_at = now();
  update public.accounts set apple_tokens_invalidated_at = null where auth_user_id = p_auth_user_id;
end;
$$;

-- Premier temps du traitement d'une notification Apple, dans UNE transaction :
-- insertion de (iss, jti), verrouillage, résolution du compte, effets en base, passage à `done` si rien ne reste.
-- Retour : status ('done' | 'received'), auth_user_id, followup ('none' | 'sign_out' | 'purge'), first (premier traitement).
create or replace function public.apple_event_begin(p_iss text, p_jti text, p_sub text, p_type text)
returns table (status text, auth_user_id uuid, followup text, first boolean)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row public.apple_notification_events;
  v_inserted boolean;
  v_uid uuid;
begin
  insert into public.apple_notification_events as e (iss, jti, sub, type)
  values (p_iss, p_jti, p_sub, p_type)
  on conflict (iss, jti) do nothing;
  v_inserted := found;

  select * into v_row from public.apple_notification_events e where e.iss = p_iss and e.jti = p_jti for update;

  if v_row.status = 'done' then
    return query select 'done'::text, v_row.auth_user_id, 'none'::text, false;
    return;
  end if;

  -- Rejeu d'un événement `received` : la référence inscrite au premier traitement prévaut (le compte peut avoir été purgé).
  if not v_inserted then
    return query select 'received'::text, v_row.auth_user_id,
      case v_row.type when 'consent-revoked' then 'sign_out' when 'account-delete' then 'purge' else 'none' end,
      false;
    return;
  end if;

  select a.auth_user_id into v_uid from public.accounts a where a.provider = 'apple' and a.provider_subject = p_sub;
  update public.apple_notification_events e set auth_user_id = v_uid where e.iss = p_iss and e.jti = p_jti;

  if v_uid is null then
    -- Sujet inconnu : aucun effet.
    update public.apple_notification_events e set status = 'done', done_at = now() where e.iss = p_iss and e.jti = p_jti;
    return query select 'done'::text, null::uuid, 'none'::text, true;
    return;
  end if;

  if p_type in ('email-disabled', 'email-enabled') then
    -- L'adresse relais affichée ne change pas ; seul l'état du transfert est conservé.
    update public.accounts set relay_forwarding_enabled = (p_type = 'email-enabled') where accounts.auth_user_id = v_uid;
    update public.apple_notification_events e set status = 'done', done_at = now() where e.iss = p_iss and e.jti = p_jti;
    return query select 'done'::text, v_uid, 'none'::text, true;
  elsif p_type = 'consent-revoked' then
    delete from public.apple_tokens t where t.auth_user_id = v_uid;
    update public.accounts set apple_tokens_invalidated_at = now() where accounts.auth_user_id = v_uid;
    return query select 'received'::text, v_uid, 'sign_out'::text, true;
  elsif p_type = 'account-delete' then
    -- Apple a déjà invalidé les jetons : purge sans révocation.
    insert into public.account_deletions as d (auth_user_id, apple_revocation) values (v_uid, 'not_required')
    on conflict on constraint account_deletions_pkey do update set apple_revocation = coalesce(d.apple_revocation, 'not_required');
    update public.accounts set deletion_requested_at = coalesce(deletion_requested_at, now()) where accounts.auth_user_id = v_uid;
    return query select 'received'::text, v_uid, 'purge'::text, true;
  else
    update public.apple_notification_events e set status = 'done', done_at = now() where e.iss = p_iss and e.jti = p_jti;
    return query select 'done'::text, v_uid, 'none'::text, true;
  end if;
end;
$$;

create or replace function public.apple_event_done(p_iss text, p_jti text)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.apple_notification_events set status = 'done', done_at = coalesce(done_at, now())
   where iss = p_iss and jti = p_jti;
$$;

-- Création ou reprise du registre de suppression (étape 1 de delete-account).
create or replace function public.deletion_begin(p_auth_user_id uuid, p_receipt_hash text, p_local_user_hashes text[])
returns public.account_deletions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row public.account_deletions;
begin
  insert into public.account_deletions as d (auth_user_id, receipt_hash, local_user_hashes)
  values (p_auth_user_id, p_receipt_hash, coalesce(p_local_user_hashes, '{}'))
  on conflict (auth_user_id) do update
     set receipt_hash = coalesce(d.receipt_hash, excluded.receipt_hash),
         local_user_hashes = (select array(select distinct unnest(d.local_user_hashes || excluded.local_user_hashes)));
  update public.accounts set deletion_requested_at = coalesce(deletion_requested_at, now()) where auth_user_id = p_auth_user_id;
  select * into v_row from public.account_deletions where auth_user_id = p_auth_user_id;
  return v_row;
end;
$$;

-- Étape 4 : purge des données du compte, atomique, puis marqueur data_purged_at.
create or replace function public.deletion_purge_data(p_auth_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  delete from public.catalogues where owner_auth_user_id = p_auth_user_id;
  delete from public.account_local_users where auth_user_id = p_auth_user_id;
  delete from public.apple_tokens where auth_user_id = p_auth_user_id;
  delete from public.accounts where auth_user_id = p_auth_user_id;
  update public.account_deletions set data_purged_at = coalesce(data_purged_at, now()) where auth_user_id = p_auth_user_id;
end;
$$;

revoke all on function public.store_apple_token(uuid, text, text) from public, anon, authenticated;
revoke all on function public.apple_event_begin(text, text, text, text) from public, anon, authenticated;
revoke all on function public.apple_event_done(text, text) from public, anon, authenticated;
revoke all on function public.deletion_begin(uuid, text, text[]) from public, anon, authenticated;
revoke all on function public.deletion_purge_data(uuid) from public, anon, authenticated;
grant execute on function public.store_apple_token(uuid, text, text) to service_role;
grant execute on function public.apple_event_begin(text, text, text, text) to service_role;
grant execute on function public.apple_event_done(text, text) to service_role;
grant execute on function public.deletion_begin(uuid, text, text[]) to service_role;
grant execute on function public.deletion_purge_data(uuid) to service_role;

-- `consent-revoked` : fermeture de toutes les sessions du compte (les jetons de rafraîchissement suivent par cascade).
create or replace function public.revoke_user_sessions(p_auth_user_id uuid)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  delete from auth.sessions where user_id = p_auth_user_id;
$$;
revoke all on function public.revoke_user_sessions(uuid) from public, anon, authenticated;
grant execute on function public.revoke_user_sessions(uuid) to service_role;
