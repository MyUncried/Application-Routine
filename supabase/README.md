# Supabase — KODJO (T1 Compte)

Plan : `_bmad-output/compte/plan-lot-compte.md` (T1). Projet de développement : `kodjo-dev`, région Paris (`eu-west-3`).

## Contenu

- `migrations/` : schéma T1 (comptes, rattachements, catalogue, registres), RLS, fonctions SQL.
- `functions/_shared/` : logique des fonctions serveur, sans dépendance, testée par Jest (`npx jest supabase`).
- `functions/_deno/` et `functions/*/index.ts` : points d'entrée Deno (exclus de `tsc` et d'ESLint de l'application).
- `tests/run-sql-tests.sh` : tests SQL sur un Postgres local, avec un schéma `auth` simulé.

## Secrets des fonctions serveur (à saisir dans Supabase, jamais dans le dépôt)

| Nom | Contenu |
|---|---|
| `APPLE_TEAM_ID` | `RC8F846A68` (non secret) |
| `APPLE_KEY_ID` | Key ID de la clé « KODJO Sign in with Apple » |
| `APPLE_PRIVATE_KEY` | contenu du fichier `.p8` |
| `APPLE_SERVICES_ID` | `com.ankusha.kodjo.signin` |
| `APPLE_NATIVE_CLIENT_IDS` | `com.ankusha.kodjo,com.ankusha.kodjo.dev,com.ankusha.kodjo.bmad,com.ankusha.kodjo.catalogue` |
| `KODJO_TOKEN_KEY` | 32 octets aléatoires en base64 (chiffrement des jetons Apple) |

`SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont fournis automatiquement par Supabase aux fonctions.

## Déploiement (à faire par Hermann, avec la CLI Supabase)

```bash
supabase link --project-ref qiruzadtbqcdewvsaizo
supabase db push
supabase functions deploy delete-account apple-token deletion-status apple-notifications
```

## Après déploiement

- Apple Developer → `com.ankusha.kodjo` → Sign In with Apple → Server-to-Server Notification Endpoint :
  `https://qiruzadtbqcdewvsaizo.supabase.co/functions/v1/apple-notifications`.
- Planification (Integrations → Cron) toutes les 15 minutes : appel `POST` de `apple-notifications` avec le corps
  `{"sweep": true}` et l'en-tête `Authorization: Bearer <clé de service>` (reprise des notifications restées `received`).
- Extension `pg_cron` (facultative) : purge quotidienne des registres de plus de 90 jours.
- Régénérer la clé secrète Apple (connexion web) avant son expiration (180 jours).
