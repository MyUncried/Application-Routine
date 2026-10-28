import type { Database } from "../Database";

/**
 * PRE-8 (story B.8, version 15, `migration015`) — cycle de vie du Mouvement : archivage et
 * restauration depuis le Catalogue des Mouvements (arbitrages de Hermann du 27/10/2026, Q5 à Q8).
 *
 * Strictement ADDITIVE : une colonne `movements.archived_at` (horodatage ISO, `NULL` = actif),
 * sans reconstruction de table ni reprise — tout Mouvement existant reste actif. L'appartenance
 * à la famille et sa position (`level_group_id`, `level_sort_key`) ne dépendent pas de
 * l'archivage : un membre archivé garde sa place et les rangs ne sont pas recalculés (Q5).
 *
 * Exécutée dans la transaction exclusive unique de `migrateDatabase.ts` : un échec annule tout
 * et laisse `user_version` à 14. Idempotente : une colonne déjà présente n'est pas rajoutée.
 */
export async function applyMigration015(transaction: Database): Promise<void> {
  const columns = await transaction.getAllAsync<{ name: string }>("PRAGMA table_info(movements)");
  if (!columns.some((row) => row.name === "archived_at")) {
    await transaction.execAsync(
      "ALTER TABLE movements ADD COLUMN archived_at TEXT CHECK ((archived_at IS NULL) OR (length(archived_at) >= 1))",
    );
  }
}
