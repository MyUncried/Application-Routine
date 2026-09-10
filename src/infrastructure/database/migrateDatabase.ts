import { DATABASE_VERSION, LOCAL_USER_SINGLETON_KEY } from "./constants";
import type { Database } from "./Database";
import { MIGRATION_001 } from "./migrations/migration001";
import { MIGRATION_002 } from "./migrations/migration002";
import { MIGRATION_003 } from "./migrations/migration003";
import { MIGRATION_004 } from "./migrations/migration004";

type UserVersionRow = { user_version: number };
type CountRow = { count: number };

/**
 * Applique séquentiellement chaque migration additive manquante, jamais en
 * bloc : une base à la version 1 (T01-S01…S08) ne rejoue jamais
 * `MIGRATION_001` (déjà appliquée, immuable — « Conservation des acquis »).
 * `MIGRATION_002` (T01-S09) porte à la version 2, `MIGRATION_003` (T01-S10,
 * mode `TO_FAILURE` — reconstruction additive de `activities`) à la version
 * 3, `MIGRATION_004` (T02-S02, Récupération attachée + suppression des
 * Activités `RECOVERY`) à la version 4. Une base neuve (version 0) les
 * traverse toutes à la suite, dans le même ordre. `migration001.ts` n'est
 * jamais modifié : chaque migration reste un fichier indépendant, exécuté une
 * fois, jamais réécrit.
 *
 * `PRAGMA foreign_keys` étant un no-op dans une transaction (SQLite),
 * `MIGRATION_003` et `MIGRATION_004` s'appuient sur
 * `PRAGMA defer_foreign_keys=ON` dans cette même transaction partagée (Q2-A)
 * — le runner n'est pas restructuré.
 *
 * Toute la séquence s'exécute dans UNE transaction exclusive : un échec à
 * n'importe quelle étape annule l'intégralité des migrations appliquées
 * pendant ce run et laisse `user_version` inchangé (aucun état intermédiaire
 * persisté, aucune Récupération à moitié convertie).
 */
export async function migrateDatabase(database: Database): Promise<void> {
  const versionRow = await database.getFirstAsync<UserVersionRow>("PRAGMA user_version");
  const currentVersion = versionRow?.user_version ?? 0;

  if (currentVersion > DATABASE_VERSION) {
    throw new Error(
      `Database version ${currentVersion} is newer than supported version ${DATABASE_VERSION}.`,
    );
  }

  if (currentVersion === DATABASE_VERSION) {
    return;
  }

  await database.withExclusiveTransactionAsync(async (transaction) => {
    let version = currentVersion;

    if (version === 0) {
      await transaction.execAsync(MIGRATION_001);
      await transaction.runAsync(
        `INSERT OR IGNORE INTO users (singleton_key, id, created_at)
         VALUES (?, 'usr_' || lower(hex(randomblob(16))), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
        [LOCAL_USER_SINGLETON_KEY],
      );
      version = 1;
    }

    if (version === 1) {
      await transaction.execAsync(MIGRATION_002);
      version = 2;
    }

    if (version === 2) {
      await transaction.execAsync(MIGRATION_003);
      version = 3;
    }

    if (version === 3) {
      await transaction.execAsync(MIGRATION_004);
      version = 4;
    }

    const userCount = await transaction.getFirstAsync<CountRow>(
      "SELECT COUNT(*) AS count FROM users WHERE singleton_key = ?",
      [LOCAL_USER_SINGLETON_KEY],
    );

    if (userCount?.count !== 1) {
      throw new Error("The local user could not be initialized.");
    }

    await transaction.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
  });
}
