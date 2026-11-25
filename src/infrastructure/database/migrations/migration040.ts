import type { Database } from "../Database";

type ColumnRow = { name: string };

/**
 * Vue retenue d'une photo (version 40, `migration040`) — marquage des photos (D-600, Hermann, 24-25/11/2026 ; DSF Carte de
 * séance § 1) : rectangle de la vue retenue, en pourcentage de l'image, stocké avec l'asset. Quatre colonnes additives
 * nullables sur `media_assets` (toutes nulles = image entière). Venues du catalogue, jamais calculées par l'application.
 * Même patron que `migration039`. 001..039 inchangées. Un échec laisse `user_version` à 39.
 */
export const MIGRATION_040_MEDIA_VIEW = [
  "ALTER TABLE media_assets ADD COLUMN view_x REAL CHECK (view_x IS NULL OR (view_x >= 0 AND view_x <= 100))",
  "ALTER TABLE media_assets ADD COLUMN view_y REAL CHECK (view_y IS NULL OR (view_y >= 0 AND view_y <= 100))",
  "ALTER TABLE media_assets ADD COLUMN view_width REAL CHECK (view_width IS NULL OR (view_width > 0 AND view_width <= 100))",
  "ALTER TABLE media_assets ADD COLUMN view_height REAL CHECK (view_height IS NULL OR (view_height > 0 AND view_height <= 100))",
] as const;

export async function applyMigration040(transaction: Database): Promise<void> {
  const columns = await transaction.getAllAsync<ColumnRow>("PRAGMA table_info(media_assets)");
  if (columns.some((column) => column.name === "view_x")) return;
  for (const statement of MIGRATION_040_MEDIA_VIEW) await transaction.execAsync(statement);
}
