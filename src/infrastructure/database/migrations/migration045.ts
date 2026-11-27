import type { Database } from "../Database";

/**
 * Fin de séance, compléments (version 45, `migration045`) — décisions de Hermann du 27/11/2026 :
 * - photo (point 4) : une seule photo par séance, copie locale privée rattachée à l'enregistrement de la séance — colonne additive
 *   `execution_feedback.photo_path` (adresse de la copie ; `NULL` : aucune photo) ;
 * - répétitions corrigées (« A ») : « La valeur corrigée remplace la valeur d'origine, sans conserver les deux » —
 *   `execution_repetition_corrections` : répétitions réalisées corrigées, par série (`<occurrence>#<série>`), une valeur par série,
 *   remplacée à chaque enregistrement ; supprimées avec l'Exécution. Elles priment, dans toute lecture, sur la valeur d'origine
 *   (cible atteinte ou nombre saisi pendant la séance) ; le moteur, le statut, les durées et le nombre d'exercices terminés ne
 *   changent pas.
 * 001..044 inchangées. Un échec laisse `user_version` à 44.
 */
export const MIGRATION_045_PHOTO = "ALTER TABLE execution_feedback ADD COLUMN photo_path TEXT";

export const MIGRATION_045_CORRECTIONS = `CREATE TABLE IF NOT EXISTS execution_repetition_corrections (
  execution_id TEXT NOT NULL REFERENCES executions(id) ON DELETE CASCADE,
  series_key TEXT NOT NULL,
  repetitions INTEGER NOT NULL CHECK (repetitions >= 0),
  recorded_at TEXT NOT NULL,
  PRIMARY KEY (execution_id, series_key)
)`;

/** Idempotente : une base déjà dotée de la colonne (version relue plus basse, réparation) la garde telle quelle. */
export async function applyMigration045(transaction: Database): Promise<void> {
  const columns = await transaction.getAllAsync<{ name: string }>("PRAGMA table_info(execution_feedback)");
  if (!columns.some((column) => column.name === "photo_path")) await transaction.execAsync(MIGRATION_045_PHOTO);
  await transaction.execAsync(MIGRATION_045_CORRECTIONS);
}
