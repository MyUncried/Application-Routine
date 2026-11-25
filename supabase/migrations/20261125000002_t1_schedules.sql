-- KODJO — T1 Compte : planifications.
-- Purge quotidienne des registres techniques (90 jours) si pg_cron est activé sur le projet
-- (Supabase : Database → Extensions → pg_cron). Sans pg_cron, ce fichier est sans effet.
-- La reprise des notifications Apple restées `received` (> 15 min) est confiée à la fonction
-- `apple-notifications` appelée en mode « sweep » par une planification Supabase (voir
-- `supabase/README.md`), car elle nécessite la clé de service, qui ne doit pas figurer en base.

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('kodjo_purge_account_records', '17 3 * * *', 'select public.purge_expired_account_records()');
  end if;
end;
$$;
