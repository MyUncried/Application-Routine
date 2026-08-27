# infrastructure/database

Accès au stockage local (SQLite via `expo-sqlite`, Repositories) — §12.6.

SQLite et la couche de Repositories font partie du socle technique initial
(§12.32). Le spike RT-002 (§12.27) a été mené pendant T01-S01 : la
compatibilité Drizzle ORM / Expo n'a pas été jugée suffisamment stable, et le
repli déjà prévu par RT-002 a été appliqué — accès direct à `expo-sqlite`,
sans Drizzle ORM, derrière les Repositories (voir D-043, révisée).

`SqliteSessionRepository` implémente `create`/`findById`/`listActive`/`update` (T01-S04). `update` effectue une modification en place (pas de suppression/recréation), dans une transaction unique : vérification d'existence et de statut, validation Domaine, deux `UPDATE` ciblés (`sessions`, `activities` par identifiant exact), relecture et contrôle de cohérence — le tout à l'intérieur de `withExclusiveTransactionAsync`, garantissant un rollback complet en cas d'erreur intermédiaire. Le constructeur accepte une horloge injectable optionnelle (`now`), utilisée par `create` et `update` pour produire `created_at`/`updated_at` de façon déterministe en test.

`testing/NodeSqliteDatabase.ts` expose, en plus de `openInMemory()`, une méthode `openFile(path)` pour les tests devant prouver une persistance durable sur un fichier SQLite réel (fermeture puis réouverture de la même connexion).

`constants.ts` centralise `STANDARD_PRAGMAS` (`foreign_keys`, `journal_mode`), consommé à la fois par `openExpoDatabase` (utilisé uniquement par `runNativeDatabaseIntegrationCheck.ts`) et par `initializeDatabase.ts` (T01-S05) — fonction pure `initializeDatabase(database: Database)` qui pose ces pragmas puis appelle `migrateDatabase`, sans dépendance React ni `expo-sqlite`. C'est cette fonction que `SessionServiceProvider` (`src/features/sessions/`) exécute réellement au démarrage de l'application, via le point d'extension `onInit` de `<SQLiteProvider>` (`expo-sqlite`) — le câblage réel de la base au reste de l'application est décrit dans `src/features/sessions/README.md`.
