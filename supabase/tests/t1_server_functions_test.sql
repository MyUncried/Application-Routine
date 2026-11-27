-- Tests des fonctions SQL serveur (apple_event_begin, store_apple_token, deletion_*).
\set ON_ERROR_STOP on
create or replace function pg_temp.assert(condition boolean, message text) returns void language plpgsql as $$
begin if condition is distinct from true then raise exception 'ÉCHEC : %', message; end if; end $$;

insert into auth.users values ('00000000-0000-0000-0000-0000000000a1', 'a@example.com'), ('00000000-0000-0000-0000-0000000000a2', 'b@example.com');
insert into auth.identities (user_id, provider, provider_id) values
  ('00000000-0000-0000-0000-0000000000a1', 'apple', 'sub-1'), ('00000000-0000-0000-0000-0000000000a2', 'apple', 'sub-2');
insert into public.accounts (auth_user_id, provider, provider_subject) values
  ('00000000-0000-0000-0000-0000000000a1', 'apple', 'sub-1'),
  ('00000000-0000-0000-0000-0000000000a2', 'apple', 'sub-2');

-- Droits : un client authentifié ne peut pas appeler les fonctions serveur.
set role authenticated;
do $$ begin
  perform public.apple_event_begin('i', 'j', 's', 'email-enabled');
  raise exception 'ÉCHEC : apple_event_begin accessible au client';
exception when insufficient_privilege then null; end $$;
reset role;

-- email-disabled : traité et terminé en une transaction ; rejoué : 200 sans effet répété.
do $$ declare r record; begin
  select * into r from public.apple_event_begin('https://appleid.apple.com', 'jti-mail', 'sub-1', 'email-disabled');
  perform pg_temp.assert(r.status = 'done' and r.first, 'email-disabled terminé au premier traitement');
  perform pg_temp.assert((select relay_forwarding_enabled from public.accounts where provider_subject = 'sub-1') = false, 'transfert coupé');
  update public.accounts set relay_forwarding_enabled = true where provider_subject = 'sub-1';
  select * into r from public.apple_event_begin('https://appleid.apple.com', 'jti-mail', 'sub-1', 'email-disabled');
  perform pg_temp.assert(r.status = 'done' and not r.first, 'rejeu acquitté');
  perform pg_temp.assert((select relay_forwarding_enabled from public.accounts where provider_subject = 'sub-1') = true, 'aucun effet répété');
end $$;

-- Deux sujets, même type, même instant : jti distincts, traités séparément.
do $$ declare r1 record; r2 record; begin
  select * into r1 from public.apple_event_begin('https://appleid.apple.com', 'jti-A', 'sub-1', 'email-enabled');
  select * into r2 from public.apple_event_begin('https://appleid.apple.com', 'jti-B', 'sub-2', 'email-enabled');
  perform pg_temp.assert(r1.auth_user_id <> r2.auth_user_id, 'deux comptes distincts');
end $$;

-- Sujet inconnu : terminé sans effet.
do $$ declare r record; begin
  select * into r from public.apple_event_begin('https://appleid.apple.com', 'jti-unk', 'sub-unknown', 'account-delete');
  perform pg_temp.assert(r.status = 'done' and r.auth_user_id is null, 'sujet inconnu ignoré');
end $$;

-- consent-revoked → nouvelle autorisation : marqueur posé puis remis à vide ; jeton remplacé.
do $$ declare r record; begin
  perform public.store_apple_token('00000000-0000-0000-0000-0000000000a1', 'com.ankusha.kodjo', 'old');
  select * into r from public.apple_event_begin('https://appleid.apple.com', 'jti-cr', 'sub-1', 'consent-revoked');
  perform pg_temp.assert(r.status = 'received' and r.followup = 'sign_out', 'consent-revoked attend la fermeture des sessions');
  perform pg_temp.assert(not exists (select 1 from public.apple_tokens where auth_user_id = '00000000-0000-0000-0000-0000000000a1'), 'ancien jeton supprimé');
  perform pg_temp.assert((select apple_tokens_invalidated_at from public.accounts where provider_subject = 'sub-1') is not null, 'marqueur posé');
  perform public.store_apple_token('00000000-0000-0000-0000-0000000000a1', 'com.ankusha.kodjo.signin', 'new');
  perform pg_temp.assert((select apple_tokens_invalidated_at from public.accounts where provider_subject = 'sub-1') is null, 'marqueur caduc après nouveau jeton');
  perform pg_temp.assert((select refresh_token_ciphertext from public.apple_tokens where auth_user_id = '00000000-0000-0000-0000-0000000000a1') = 'new', 'nouveau jeton conservé');
  -- Rejeu de l'ancien consent-revoked : pas de nouvelle suppression du jeton.
  select * into r from public.apple_event_begin('https://appleid.apple.com', 'jti-cr', 'sub-1', 'consent-revoked');
  perform pg_temp.assert(not r.first and r.followup = 'sign_out', 'rejeu : seule la suite hors base est reprise');
  perform pg_temp.assert(exists (select 1 from public.apple_tokens where refresh_token_ciphertext = 'new'), 'nouveau jeton intact au rejeu');
  perform public.apple_event_done('https://appleid.apple.com', 'jti-cr');
end $$;

-- account-delete : registre not_required, purge, rejeu après purge retrouve le compte par l'événement.
do $$ declare r record; d public.account_deletions; begin
  select * into r from public.apple_event_begin('https://appleid.apple.com', 'jti-del', 'sub-2', 'account-delete');
  perform pg_temp.assert(r.followup = 'purge' and r.auth_user_id = '00000000-0000-0000-0000-0000000000a2', 'purge attendue');
  perform pg_temp.assert((select apple_revocation from public.account_deletions where auth_user_id = r.auth_user_id) = 'not_required', 'révocation non requise');
  d := public.deletion_begin(r.auth_user_id, null, array['h1']);
  perform public.deletion_purge_data(r.auth_user_id);
  perform pg_temp.assert(not exists (select 1 from public.accounts where auth_user_id = r.auth_user_id), 'compte purgé');
  -- Interruption simulée avant la suppression Auth, puis nouvelle livraison.
  select * into r from public.apple_event_begin('https://appleid.apple.com', 'jti-del', 'sub-2', 'account-delete');
  perform pg_temp.assert(r.status = 'received' and r.followup = 'purge' and r.auth_user_id = '00000000-0000-0000-0000-0000000000a2', 'reprise par la référence inscrite, sans règle du sujet inconnu');
  perform pg_temp.assert((select data_purged_at from public.account_deletions where auth_user_id = r.auth_user_id) is not null, 'étape 4 déjà faite');
  perform public.apple_event_done('https://appleid.apple.com', 'jti-del');
  select * into r from public.apple_event_begin('https://appleid.apple.com', 'jti-del', 'sub-2', 'account-delete');
  perform pg_temp.assert(r.status = 'done' and r.followup = 'none', 'livraison supplémentaire : 200 sans effet');
end $$;

-- deletion_begin idempotent : reçu conservé, empreintes fusionnées.
do $$ declare d public.account_deletions; begin
  d := public.deletion_begin('00000000-0000-0000-0000-0000000000a1', 'r1', array['h1']);
  d := public.deletion_begin('00000000-0000-0000-0000-0000000000a1', 'r2', array['h2']);
  perform pg_temp.assert(d.receipt_hash = 'r1', 'reçu initial conservé');
  perform pg_temp.assert(d.local_user_hashes @> array['h1','h2'], 'empreintes fusionnées');
end $$;

-- Fermeture des sessions d'un compte uniquement.
insert into auth.sessions (user_id) values ('00000000-0000-0000-0000-0000000000a1'), ('00000000-0000-0000-0000-0000000000a1'), ('00000000-0000-0000-0000-0000000000a2');
select public.revoke_user_sessions('00000000-0000-0000-0000-0000000000a1');
do $$ begin
  perform pg_temp.assert((select count(*) from auth.sessions where user_id = '00000000-0000-0000-0000-0000000000a1') = 0, 'sessions du compte fermées');
  perform pg_temp.assert((select count(*) from auth.sessions) = 1, 'sessions des autres comptes intactes');
end $$;

-- CPT-35 : utilisateur fusionné (Google ancien + Apple) dont le compte est « Google » : jeton Apple accepté ;
-- utilisateur sans identité Apple : refusé ; utilisateur sans compte : refusé.
insert into auth.users values ('00000000-0000-0000-0000-0000000000a5', 'm@example.com'), ('00000000-0000-0000-0000-0000000000a6', 'g@example.com');
insert into auth.identities (user_id, provider, provider_id, created_at) values
  ('00000000-0000-0000-0000-0000000000a5', 'google', 'g-sub-m', now() - interval '1 day'),
  ('00000000-0000-0000-0000-0000000000a5', 'apple', 'a-sub-m', now()),
  ('00000000-0000-0000-0000-0000000000a6', 'google', 'g-sub-g', now());
insert into public.accounts (auth_user_id, provider, provider_subject) values
  ('00000000-0000-0000-0000-0000000000a5', 'google', 'g-sub-m'), ('00000000-0000-0000-0000-0000000000a6', 'google', 'g-sub-g');
do $$ begin
  perform public.store_apple_token('00000000-0000-0000-0000-0000000000a5', 'com.ankusha.kodjo', 'merged');
  perform pg_temp.assert(exists (select 1 from public.apple_tokens where refresh_token_ciphertext = 'merged'), 'jeton Apple d''un compte fusionné enregistré');
  begin
    perform public.store_apple_token('00000000-0000-0000-0000-0000000000a6', 'com.ankusha.kodjo', 'x');
    raise exception 'ÉCHEC : jeton Apple accepté sans identité Apple';
  exception when invalid_parameter_value then null; end;
end $$;

-- Droits directs du rôle serveur sur chaque table (recette 25/11/2026 : absents sur le projet).
do $$ declare t text; p text; begin
  foreach t in array array['accounts','account_local_users','catalogues','apple_tokens','account_deletions','apple_notification_events'] loop
    foreach p in array array['SELECT','INSERT','UPDATE','DELETE'] loop
      perform pg_temp.assert(has_table_privilege('service_role', 'public.' || t, p), format('service_role : %s sur %s', p, t));
    end loop;
    perform pg_temp.assert(not has_table_privilege('anon', 'public.' || t, 'SELECT'), format('anon : aucune lecture de %s', t));
  end loop;
end $$;

select 'T1 SQL fonctions serveur : tous les tests réussis' as resultat;
