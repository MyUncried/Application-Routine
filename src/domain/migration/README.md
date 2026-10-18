# domain/migration

Contrats du domaine propres aux migrations de données (PRE-4).

- `MigrationNotice.ts` — avis de migration (AD-12, FR-18-20, H24) : le type `MigrationNotice` (genre `UNREADABLE_EXERCISES_DROPPED`, nombre d'Exercices écartés, dates ISO 8601 UTC de création et d'acquittement) et le port `MigrationNoticeRepository` (`findUnacknowledged`, `acknowledge`). L'avis ne porte aucun identifiant, nom ni contenu d'Exercice écarté. Il est écrit par `migration010` (`src/infrastructure/database/migrations/`), lu par `SqliteMigrationNoticeRepository` et exposé par `SessionServiceProvider`. Story 1.2 : son seul lecteur d'interface est `MigrationNoticeGate` (`src/features/migration/`).
