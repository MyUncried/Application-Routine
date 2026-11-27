-- Tests de la migration T1 (RLS, link_account). Exécutés par run-sql-tests.sh sur un Postgres local.
\set ON_ERROR_STOP on

create or replace function pg_temp.assert(condition boolean, message text) returns void language plpgsql as $$
begin
  if condition is distinct from true then raise exception 'ÉCHEC : %', message; end if;
end $$;

-- Données : X (Apple, nom fourni), Y (Google), Z (Apple, relais masqué).
insert into auth.users values
  ('00000000-0000-0000-0000-00000000000a', 'x@example.com'),
  ('00000000-0000-0000-0000-00000000000b', 'y@example.com'),
  ('00000000-0000-0000-0000-00000000000c', 'abc@privaterelay.appleid.com');
insert into auth.identities (user_id, provider, provider_id) values
  ('00000000-0000-0000-0000-00000000000a', 'apple', 'apple-sub-x'),
  ('00000000-0000-0000-0000-00000000000b', 'google', 'google-sub-y'),
  ('00000000-0000-0000-0000-00000000000c', 'apple', 'apple-sub-z');

-- 1. Anonyme : link_account refusé (droit d'exécution retiré).
set role anon;
do $$ begin
  perform public.link_account('usr_a');
  raise exception 'ÉCHEC : anonyme a pu appeler link_account';
exception when insufficient_privilege then null; end $$;
reset role;

-- 2. R1 compte neuf : compte, catalogue et Utilisateur local créés ; nom fourni conservé.
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
do $$ declare r jsonb; begin
  r := public.link_account('usr_phone1', 'Hermann', 'Adjou');
  perform pg_temp.assert(r->>'provider' = 'apple', 'fournisseur Apple');
  perform pg_temp.assert(r->>'provider_subject' = 'apple-sub-x', 'sub Apple');
  perform pg_temp.assert(r->>'given_name' = 'Hermann', 'prénom conservé');
  perform pg_temp.assert(r->>'catalogue_id' is not null, 'catalogue créé');
  perform pg_temp.assert(r->'local_user_ids' = '["usr_phone1"]'::jsonb, 'un Utilisateur local');
end $$;

-- 3. Idempotence et R2/R3 : rejouer, puis second téléphone ; nom absent ne l'écrase pas ; même catalogue.
do $$ declare r1 jsonb; r2 jsonb; begin
  r1 := public.link_account('usr_phone1', null, null);
  r2 := public.link_account('usr_phone2', '', '');
  perform pg_temp.assert(r1->>'catalogue_id' = r2->>'catalogue_id', 'catalogue unique');
  perform pg_temp.assert(r2->>'given_name' = 'Hermann', 'nom non écrasé par une valeur vide');
  perform pg_temp.assert(r2->'local_user_ids' = '["usr_phone1", "usr_phone2"]'::jsonb, 'deux Utilisateurs locaux, sans fusion');
end $$;

-- 4. RLS : X ne voit que ses lignes ; aucune écriture directe.
do $$ begin
  perform pg_temp.assert((select count(*) from public.accounts) = 1, 'X voit un seul compte');
  perform pg_temp.assert((select count(*) from public.account_local_users) = 2, 'X voit ses deux rattachements');
end $$;
do $$ begin
  insert into public.accounts (auth_user_id, provider, provider_subject) values ('00000000-0000-0000-0000-00000000000b', 'google', 'z');
  raise exception 'ÉCHEC : écriture directe acceptée';
exception when insufficient_privilege then null; end $$;
do $$ begin
  perform 1 from public.apple_tokens;
  raise exception 'ÉCHEC : apple_tokens lisible par le client';
exception when insufficient_privilege then null; end $$;
do $$ begin
  perform 1 from public.account_deletions;
  raise exception 'ÉCHEC : account_deletions lisible par le client';
exception when insufficient_privilege then null; end $$;

-- 5. Y (Google) ne voit pas les lignes de X ; relais Apple détecté pour Z.
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
do $$ declare r jsonb; begin
  r := public.link_account('usr_phoneY');
  perform pg_temp.assert(r->>'provider' = 'google', 'fournisseur Google');
  perform pg_temp.assert(r->>'given_name' is null, 'nom absent : aucune valeur inventée');
  perform pg_temp.assert((select count(*) from public.account_local_users) = 1, 'Y ne voit pas les rattachements de X');
end $$;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
do $$ declare r jsonb; begin
  r := public.link_account('usr_phoneZ');
  perform pg_temp.assert((r->>'email_is_private_relay')::boolean, 'adresse relais Apple détectée');
end $$;
reset role;

-- 6. Suppression en cours : link_account refusé.
update public.accounts set deletion_requested_at = now() where auth_user_id = '00000000-0000-0000-0000-00000000000c';
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
do $$ begin
  perform public.link_account('usr_phoneZ');
  raise exception 'ÉCHEC : rattachement accepté pendant une suppression';
exception when sqlstate '55000' then null; end $$;
reset role;

-- 8. CPT-35 : identités Apple et Google rattachées au même utilisateur (même e-mail) : le compte suit la connexion en cours.
reset role;
insert into auth.users values ('00000000-0000-0000-0000-00000000000e', 'm@example.com');
insert into auth.identities (user_id, provider, provider_id, created_at) values
  ('00000000-0000-0000-0000-00000000000e', 'google', 'google-sub-m', now() - interval '1 day'),
  ('00000000-0000-0000-0000-00000000000e', 'apple', 'apple-sub-m', now());
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000e';
do $$ declare r jsonb; begin
  r := public.link_account('usr_phoneM', null, null, 'apple');
  perform pg_temp.assert(r->>'provider' = 'apple' and r->>'provider_subject' = 'apple-sub-m', 'connexion Apple : compte Apple malgré une identité Google plus ancienne');
  r := public.link_account('usr_phoneM', null, null, 'google');
  perform pg_temp.assert(r->>'provider' = 'google' and r->>'provider_subject' = 'google-sub-m', 'connexion Google : le compte suit la dernière connexion');
  begin
    perform public.link_account('usr_phoneM', null, null, 'twitter');
    raise exception 'ÉCHEC : fournisseur inconnu accepté';
  exception when invalid_parameter_value then null; end;
end $$;

-- 9. Connexion refusée par l'app : l'utilisateur Auth sans compte est supprimé ; avec compte, rien.
reset role;
insert into auth.users values ('00000000-0000-0000-0000-00000000000f', 'orphan@example.com');
insert into auth.identities (user_id, provider, provider_id) values ('00000000-0000-0000-0000-00000000000f', 'google', 'google-sub-o');
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000f';
do $$ begin
  perform pg_temp.assert(public.discard_unlinked_auth_user(), 'utilisateur sans compte supprimé');
end $$;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000e';
do $$ begin
  perform pg_temp.assert(not public.discard_unlinked_auth_user(), 'utilisateur avec compte conservé');
end $$;
reset role;
do $$ begin
  perform pg_temp.assert(not exists (select 1 from auth.users where id = '00000000-0000-0000-0000-00000000000f'), 'orphelin effacé');
  perform pg_temp.assert(not exists (select 1 from auth.identities where user_id = '00000000-0000-0000-0000-00000000000f'), 'identité effacée en cascade');
  perform pg_temp.assert(exists (select 1 from auth.users where id = '00000000-0000-0000-0000-00000000000e'), 'compte conservé');
end $$;
set role anon;
do $$ begin
  perform public.discard_unlinked_auth_user();
  raise exception 'ÉCHEC : anonyme a pu appeler discard_unlinked_auth_user';
exception when insufficient_privilege then null; end $$;
reset role;

-- 7. Purge : registres > 90 jours supprimés, récents conservés.
insert into public.account_deletions (auth_user_id, auth_deleted_at) values
  ('00000000-0000-0000-0000-0000000000d1', now() - interval '91 days'),
  ('00000000-0000-0000-0000-0000000000d2', now() - interval '10 days');
insert into public.apple_notification_events (iss, jti, sub, type, status, done_at) values
  ('https://appleid.apple.com', 'old', 's', 'email-enabled', 'done', now() - interval '91 days'),
  ('https://appleid.apple.com', 'pending', 's', 'account-delete', 'received', null);
select public.purge_expired_account_records();
do $$ begin
  perform pg_temp.assert((select count(*) from public.account_deletions) = 1, 'registre ancien purgé');
  perform pg_temp.assert((select count(*) from public.apple_notification_events) = 1, 'événement ancien purgé, événement en attente conservé');
end $$;

select 'T1 SQL : tous les tests réussis' as resultat;
