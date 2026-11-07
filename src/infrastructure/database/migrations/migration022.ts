import type { Database } from "../Database";

/**
 * PRE-9 (reprise Formats du 04/11/2026, version 22, `migration022`) — **Nom du Circuit** (mise à jour consolidée
 * des écrans Formats du 04/11/2026 §6 quinquies : « Nom du Circuit : nouvel attribut du Circuit. Par défaut : le
 * nom de son Modèle d'origine […] ; "Circuit" pour un Circuit composé à la main »).
 *
 * Strictement ADDITIVE, sur le modèle de `migration020` : colonne nullable `tours.name` (`NULL` = nom par défaut,
 * celui du Modèle d'origine, sinon « Circuit »). Aucune reprise : tout Circuit existant garde son nom par défaut.
 * Numéro vérifié sur la branche : 021 = suppression des anciennes définitions (A.3) ; A.5 prendra la suivante.
 *
 * Exécutée dans la transaction exclusive unique de `migrateDatabase.ts` : un échec annule tout et laisse
 * `user_version` à 21. Idempotente : une colonne déjà présente n'est pas rajoutée.
 */
export async function applyMigration022(transaction: Database): Promise<void> {
  const columns = await transaction.getAllAsync<{ name: string }>("PRAGMA table_info(tours)");
  if (!columns.some((row) => row.name === "name")) {
    await transaction.execAsync("ALTER TABLE tours ADD COLUMN name TEXT");
  }
}
