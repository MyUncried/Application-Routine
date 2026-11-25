-- KODJO — T1 : droits explicites du rôle serveur (`service_role`) sur les tables du compte.
--
-- Constat en recette (25/11/2026) : sur le projet Supabase, les tables créées par la migration 1 n'ont reçu,
-- pour `service_role`, que TRUNCATE, REFERENCES et TRIGGER ; aucun droit SELECT, INSERT, UPDATE ni DELETE.
-- Les fonctions `security definer` (link_account, store_apple_token, …) fonctionnaient ; les accès directs
-- des fonctions serveur (delete-account, deletion-status, apple-notifications) échouaient (503 « record »).
-- On ne dépend plus des privilèges par défaut du projet : les droits nécessaires sont accordés explicitement.
-- `anon` et `authenticated` restent inchangés (lecture de ses propres lignes seulement, par RLS).
grant select, insert, update, delete on
  public.accounts,
  public.account_local_users,
  public.catalogues,
  public.apple_tokens,
  public.account_deletions,
  public.apple_notification_events
  to service_role;
