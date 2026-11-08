import type { Database } from "../Database";

/**
 * PRE-9 (story A.2b, version 18, `migration018`) — durée facultative d'une phase du Mouvement.
 * Décision de Hermann du 30/10/2026 : « les durées de la phase peuvent faire partie du mouvement,
 * si elles sont renseignées elles sont reprises par défaut et peuvent être changées dans la séance,
 * si elles n'existent pas elles sont à renseigner dans la séance » ; migration approuvée le
 * 31/10/2026 (« Oui, migration 018 (Recommandé) » — « Colonne ajoutée, existant intact (durées
 * vides) »).
 *
 * Strictement ADDITIVE, sur le modèle de `migration015` : une colonne nullable
 * `movement_phases.duration_seconds` (`NULL` = aucune durée), bornée à 1..3535 s
 * (`WORK_PATTERN_DURATION_BOUNDS`, valeurs figées ici : une migration ne change pas après sa
 * livraison). Aucune reconstruction de table ni reprise : toute phase existante reste sans durée.
 *
 * Exécutée dans la transaction exclusive unique de `migrateDatabase.ts` : un échec annule tout et
 * laisse `user_version` à 17. Idempotente : une colonne déjà présente n'est pas rajoutée.
 */
export const MIGRATION_018_PHASE_DURATION_BOUNDS = { min: 1, max: 3535 } as const;

export async function applyMigration018(transaction: Database): Promise<void> {
  const columns = await transaction.getAllAsync<{ name: string }>("PRAGMA table_info(movement_phases)");
  if (!columns.some((row) => row.name === "duration_seconds")) {
    const { min, max } = MIGRATION_018_PHASE_DURATION_BOUNDS;
    await transaction.execAsync(
      `ALTER TABLE movement_phases ADD COLUMN duration_seconds INTEGER CHECK ((duration_seconds IS NULL) OR (duration_seconds BETWEEN ${min} AND ${max}))`,
    );
  }
}
