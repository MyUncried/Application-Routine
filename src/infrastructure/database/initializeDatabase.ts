import { STANDARD_PRAGMAS } from "./constants";
import type { Database } from "./Database";
import { migrateDatabase } from "./migrateDatabase";

/**
 * Prépare une connexion `Database` pour l'usage applicatif : pose les
 * pragmas canoniques puis exécute la migration (idempotente). Pure —
 * aucun import React, aucune dépendance à `expo-sqlite` : ne connaît que
 * l'interface `Database`, donc testable avec n'importe quelle
 * implémentation (`NodeSqliteDatabase` en test, `ExpoDatabase` à l'exécution
 * réelle). Ne crée aucune nouvelle migration — `migrateDatabase`/
 * `migration001.ts` sont réutilisés tels quels.
 */
export async function initializeDatabase(database: Database): Promise<void> {
  for (const pragma of STANDARD_PRAGMAS) {
    await database.execAsync(pragma);
  }
  await migrateDatabase(database);
}
