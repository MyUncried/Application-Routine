# infrastructure/database

Accès au stockage local (SQLite via `expo-sqlite`, Repositories) — §12.6.

SQLite et la couche de Repositories font partie du socle technique initial
(§12.32). Leur mise en place reste conditionnée par la vérification de la
compatibilité Drizzle ORM / Expo (spike RT-002, §12.26).

`SqliteSessionRepository` implémente `create`/`findById`/`listActive`/`update` (T01-S04). `update` effectue une modification en place (pas de suppression/recréation), dans une transaction unique : vérification d'existence et de statut, validation Domaine, deux `UPDATE` ciblés (`sessions`, `activities` par identifiant exact), relecture et contrôle de cohérence — le tout à l'intérieur de `withExclusiveTransactionAsync`, garantissant un rollback complet en cas d'erreur intermédiaire. Le constructeur accepte une horloge injectable optionnelle (`now`), utilisée par `create` et `update` pour produire `created_at`/`updated_at` de façon déterministe en test.

`testing/NodeSqliteDatabase.ts` expose, en plus de `openInMemory()`, une méthode `openFile(path)` pour les tests devant prouver une persistance durable sur un fichier SQLite réel (fermeture puis réouverture de la même connexion).
