import type { Database } from "../Database";

/**
 * PRE-6 (story 1.1, version 11, `migration011`) — nature du Circuit (AD-34)
 * et présence de la récupération post-exercice (AD-35).
 *
 * Strictement ADDITIVE : deux `ALTER TABLE … ADD COLUMN`, sans reconstruction
 * de table, puis une reprise des valeurs existantes :
 *
 * - `tours.nature` (`'TOURS'` / `'SERIES'`, défaut `'TOURS'`) : toute séance
 *   existante se relit en Circuit de Tours (« compatibilité tours par
 *   défaut », ch12 L1715). La borne `COUNT` reste `tours.repeat_count` : elle
 *   n'a pas de colonne propre.
 * - `activities.post_activity_recovery_present` (0 / 1, défaut 0) : distingue
 *   une récupération ABSENTE d'une récupération PRÉSENTE à 0. Reprise :
 *   présente si et seulement si la valeur existante est > 0 — aucune
 *   interface n'a jamais créé de récupération à 0, une valeur 0 historique
 *   signifiait « aucune ».
 *
 * Exécutée dans la transaction exclusive unique de `migrateDatabase.ts` :
 * une erreur à n'importe quelle étape annule toute la migration et laisse
 * `user_version` à 10.
 *
 * Idempotente : une colonne déjà présente (`PRAGMA table_info`) n'est pas
 * rajoutée, et rien n'est rejoué — la reprise n'est exécutée qu'au moment
 * où la colonne est ajoutée, l'une et l'autre dans la même transaction
 * unique de migration. Les colonnes, JSON d'exécution, phases, charges,
 * côtés et cibles des occurrences ne sont pas touchés.
 *
 * `migration001.ts` à `migration010.ts` restent inchangées.
 */
export async function applyMigration011(transaction: Database): Promise<void> {
  if (!(await hasColumn(transaction, "tours", "nature"))) {
    await transaction.execAsync(
      `ALTER TABLE tours ADD COLUMN nature TEXT NOT NULL DEFAULT 'TOURS' CHECK (nature IN ('TOURS', 'SERIES'))`,
    );
  }

  const recoveryPresenceAdded = !(await hasColumn(transaction, "activities", "post_activity_recovery_present"));
  if (recoveryPresenceAdded) {
    await transaction.execAsync(
      `ALTER TABLE activities ADD COLUMN post_activity_recovery_present INTEGER NOT NULL DEFAULT 0 CHECK (post_activity_recovery_present IN (0, 1))`,
    );
    // Reprise : seule une récupération positive existait réellement.
    await transaction.runAsync(
      `UPDATE activities SET post_activity_recovery_present = 1 WHERE post_activity_recovery_seconds > 0`,
    );
  }
}

async function hasColumn(transaction: Database, table: "tours" | "activities", column: string): Promise<boolean> {
  // `table` est l'une de deux constantes littérales, jamais une saisie.
  const columns = await transaction.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  return columns.some((row) => row.name === column);
}
