import type { Database } from "../Database";

/**
 * PRE-9 (recette iPhone n° 3 du 03/11/2026, autres constats, version 20, `migration020`) — modèle
 * d'origine d'un Circuit créé par la fenêtre Formats. Hermann : « Tabata deux mouvements en alterné :
 * il faut que le nom du circuit soit "Tabata", idem pour tous les formats, remplacer le nom mot
 * "Circuit" par le nom du format. » ; décision du 03/11/2026 : nouvelle migration additive, colonne
 * nullable sur `tours`, sans reprise.
 *
 * Strictement ADDITIVE, sur le modèle de `migration019` : une colonne nullable `tours.origin_model`
 * (`NULL` = Circuit créé dans la Composition, nommé « Circuit »), bornée par un `CHECK` aux dix clés
 * des modèles de la fenêtre Formats, FIGÉES ici (`MIGRATION_020_MODEL_KEYS`, jamais lues depuis le
 * Domaine : un modèle ajouté plus tard demandera sa propre migration). `tours.format_key` ne pouvait
 * pas la porter : il est réservé au Format d'origine d'un Circuit porteur (migration 017, réalignement
 * du 02/11/2026) et un Circuit standard (Tabata, 30/30, Renforcement…) n'en porte aucun. Aucune
 * reconstruction de table ni reprise : tout Circuit existant reste « Circuit ».
 *
 * Exécutée dans la transaction exclusive unique de `migrateDatabase.ts` : un échec annule tout et
 * laisse `user_version` à 19. Idempotente : une colonne déjà présente n'est pas rajoutée.
 */
export const MIGRATION_020_MODEL_KEYS = [
  "TABATA",
  "INTERVALS_30_30",
  "EMOM",
  "AMRAP",
  "FOR_TIME",
  "DEATH_BY",
  "STRENGTH",
  "SUPERSET",
  "PROGRESSION",
  "UNTIL_FAILURE",
] as const;

export async function applyMigration020(transaction: Database): Promise<void> {
  const columns = await transaction.getAllAsync<{ name: string }>("PRAGMA table_info(tours)");
  if (!columns.some((row) => row.name === "origin_model")) {
    const keys = MIGRATION_020_MODEL_KEYS.map((key) => `'${key}'`).join(", ");
    await transaction.execAsync(
      `ALTER TABLE tours ADD COLUMN origin_model TEXT CHECK (origin_model IS NULL OR origin_model IN (${keys}))`,
    );
  }
}
