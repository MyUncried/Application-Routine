import type { Database } from "../Database";

/**
 * Photo de fin de séance (version 45, `migration045`) — décision de Hermann du 27/11/2026 (point 4) : une seule photo par séance,
 * copie locale privée rattachée à l'enregistrement de la séance. Colonne additive `execution_feedback.photo_path` (adresse de la
 * copie ; `NULL` : aucune photo), supprimée avec l'Exécution (ligne en cascade).
 * [Table `execution_repetition_corrections` (corrections lues en priorité) — retirée le 28/11/2026 avant toute livraison : arbitrage de
 * Hermann, option A ajustée (« Une seule valeur par série, jamais deux : pas de table séparée de corrections ») ; les répétitions
 * faites sont écrites dans le résultat de la série (`execution_results.payload_json`, champ `repetitionsDone`), sans migration.]
 * 001..044 inchangées. Un échec laisse `user_version` à 44.
 */
export const MIGRATION_045_PHOTO = "ALTER TABLE execution_feedback ADD COLUMN photo_path TEXT";

/** Idempotente : une base déjà dotée de la colonne (version relue plus basse, réparation) la garde telle quelle. */
export async function applyMigration045(transaction: Database): Promise<void> {
  const columns = await transaction.getAllAsync<{ name: string }>("PRAGMA table_info(execution_feedback)");
  if (!columns.some((column) => column.name === "photo_path")) await transaction.execAsync(MIGRATION_045_PHOTO);
}
