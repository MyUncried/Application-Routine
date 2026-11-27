import type { Database } from "../Database";

/**
 * Fin de séance (version 44, `migration044`) — D-578 à D-581 et D-427 (décisions de Hermann du 27/11/2026) :
 * - `execution_feedback` : ressenti à cinq niveaux (D-579 : très mal, mal, neutre, bien, très bien — aucune donnée de ressenti
 *   n'existait, rien à migrer) et commentaire facultatif (≤ 200 caractères, CE-UI-08), un par Exécution, supprimé avec elle ;
 * - `execution_pain_readings` (version 43) admet le moment `AFTER` (douleur après la séance) : la table est reconstruite à
 *   l'identique avec le `CHECK` élargi, relevés `BEFORE` recopiés.
 * Ni effort perçu 1–10 ni localisation de la douleur (D-581). 001..043 inchangées. Un échec laisse `user_version` à 43.
 * [Risque de collision de numéro avec une autre branche : voir le rapport `2026-11-27_FIN-SEANCE-D578`.]
 */
export const MIGRATION_044_FEEDBACK = `CREATE TABLE IF NOT EXISTS execution_feedback (
  execution_id TEXT PRIMARY KEY NOT NULL REFERENCES executions(id) ON DELETE CASCADE,
  feeling TEXT NOT NULL CHECK (feeling IN ('VERY_BAD', 'BAD', 'NEUTRAL', 'GOOD', 'VERY_GOOD')),
  comment TEXT CHECK (comment IS NULL OR length(comment) <= 200),
  recorded_at TEXT NOT NULL
)`;

export const MIGRATION_044_PAIN_READINGS = [
  `CREATE TABLE execution_pain_readings_044 (
  execution_id TEXT NOT NULL REFERENCES executions(id) ON DELETE CASCADE,
  moment TEXT NOT NULL CHECK (moment IN ('BEFORE', 'AFTER')),
  value INTEGER NOT NULL CHECK (value BETWEEN 0 AND 10),
  recorded_at TEXT NOT NULL,
  PRIMARY KEY (execution_id, moment)
)`,
  "INSERT INTO execution_pain_readings_044 (execution_id, moment, value, recorded_at) SELECT execution_id, moment, value, recorded_at FROM execution_pain_readings",
  "DROP TABLE execution_pain_readings",
  "ALTER TABLE execution_pain_readings_044 RENAME TO execution_pain_readings",
] as const;

export async function applyMigration044(transaction: Database): Promise<void> {
  for (const statement of MIGRATION_044_PAIN_READINGS) await transaction.execAsync(statement);
  await transaction.execAsync(MIGRATION_044_FEEDBACK);
}
