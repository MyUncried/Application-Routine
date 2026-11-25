-- KODJO — T1 Compte (plan `_bmad-output/compte/plan-lot-compte.md`, approuvé au commit 05d923a0).
-- Décisions : CPT-02, CPT-03, CPT-10, CPT-12 à CPT-14, CPT-32. Région du projet : Paris (eu-west-3).
--
-- Principes :
--   * RLS activée partout ; l'application ne lit que ses propres lignes et n'écrit jamais directement.
--   * Les écritures de l'application passent par `public.link_account` (SECURITY DEFINER) ;
--     les fonctions serveur (Edge Functions) utilisent la clé de service.
--   * Aucune donnée d'Exécution n'est stockée en T1.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.accounts (
  auth_user_id uuid primary key references auth.users (id) on delete cascade,
  provider text not null check (provider in ('apple', 'google')),
  provider_subject text not null,
  email text,
  email_is_private_relay boolean not null default false,
  relay_forwarding_enabled boolean,
  given_name text,
  family_name text,
  -- Renseigné par la notification Apple `consent-revoked` ; remis à vide par l'enregistrement d'un nouveau jeton.
  apple_tokens_invalidated_at timestamptz,
  created_at timestamptz not null default now(),
  deletion_requested_at timestamptz
);

create unique index accounts_provider_subject_key on public.accounts (provider, provider_subject);

-- Un compte peut être rattaché à plusieurs Utilisateurs locaux (un par téléphone), sans fusion (CPT-14).
create table public.account_local_users (
  auth_user_id uuid not null references public.accounts (auth_user_id) on delete cascade,
  local_user_id text not null check (length(local_user_id) between 1 and 64),
  first_linked_at timestamptz not null default now(),
  primary key (auth_user_id, local_user_id)
);

-- Un catalogue par compte, créé automatiquement (décisions du 17/11/2026).
create table public.catalogues (
  id uuid primary key default gen_random_uuid(),
  owner_auth_user_id uuid not null unique references public.accounts (auth_user_id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Jeton Apple révocable (Apple TN3194). Chiffré par la fonction serveur ; jamais lisible par le client.
create table public.apple_tokens (
  auth_user_id uuid primary key references public.accounts (auth_user_id) on delete cascade,
  client_id text not null,
  refresh_token_ciphertext text not null,
  updated_at timestamptz not null default now()
);

-- Registre de suppression : survit à la suppression du compte (pas de clé étrangère), purgé après 90 jours.
create table public.account_deletions (
  auth_user_id uuid primary key,
  receipt_hash text,
  local_user_hashes text[] not null default '{}',
  requested_at timestamptz not null default now(),
  apple_revocation text check (apple_revocation in ('done', 'not_required', 'not_applicable')),
  data_purged_at timestamptz,
  auth_deleted_at timestamptz
);

-- Notifications serveur à serveur d'Apple : identifiant vérifié (iss, jti), compte résolu au premier traitement.
create table public.apple_notification_events (
  iss text not null,
  jti text not null,
  sub text not null,
  type text not null,
  auth_user_id uuid,
  status text not null default 'received' check (status in ('received', 'done')),
  received_at timestamptz not null default now(),
  done_at timestamptz,
  primary key (iss, jti)
);

create index apple_notification_events_pending on public.apple_notification_events (received_at) where status = 'received';

-- ---------------------------------------------------------------------------
-- Droits et RLS
-- ---------------------------------------------------------------------------

alter table public.accounts enable row level security;
alter table public.account_local_users enable row level security;
alter table public.catalogues enable row level security;
alter table public.apple_tokens enable row level security;
alter table public.account_deletions enable row level security;
alter table public.apple_notification_events enable row level security;

revoke all on public.accounts, public.account_local_users, public.catalogues,
  public.apple_tokens, public.account_deletions, public.apple_notification_events
  from anon, authenticated;

grant select on public.accounts, public.account_local_users, public.catalogues to authenticated;

create policy accounts_select_own on public.accounts
  for select to authenticated using (auth_user_id = auth.uid());
create policy account_local_users_select_own on public.account_local_users
  for select to authenticated using (auth_user_id = auth.uid());
create policy catalogues_select_own on public.catalogues
  for select to authenticated using (owner_auth_user_id = auth.uid());
-- apple_tokens, account_deletions, apple_notification_events : aucune politique, donc aucun accès client.

-- ---------------------------------------------------------------------------
-- Rattachement (R1 à R6) : idempotent, sûr en cas de reprise et d'appels concurrents.
-- ---------------------------------------------------------------------------

create or replace function public.link_account(
  p_local_user_id text,
  p_given_name text default null,
  p_family_name text default null
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

  select i.provider, i.provider_id into v_provider, v_subject
    from auth.identities i
   where i.user_id = v_uid and i.provider in ('apple', 'google')
   order by i.created_at
   limit 1;
  if v_provider is null then
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
     set email = coalesce(excluded.email, a.email),
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

revoke all on function public.link_account(text, text, text) from public, anon;
grant execute on function public.link_account(text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Purge des registres techniques (90 jours) ; planifiée par 20261125000002_t1_schedules.sql si pg_cron est disponible.
-- ---------------------------------------------------------------------------

create or replace function public.purge_expired_account_records() returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  delete from public.account_deletions where auth_deleted_at < now() - interval '90 days';
  delete from public.apple_notification_events where status = 'done' and done_at < now() - interval '90 days';
$$;

revoke all on function public.purge_expired_account_records() from public, anon, authenticated;
