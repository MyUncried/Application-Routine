import type { Database } from "../Database";

/**
 * PRE-10 (version 24, `migration024`, moteur d'exécution — conception consolidée §15, ch09 « Entité
 * Exécution », « Résultat d'Exercice exécuté », ch12 §12.10, §12.15, §12.33) — **persistance des Exécutions**.
 *
 * Migration additive : deux tables nouvelles, aucune table existante modifiée.
 *
 * - `executions` : une ligne par Exécution — origine `SESSION`, Séance source (sans clé étrangère : la
 *   suppression ultérieure de la Séance est sans effet sur l'Exécution, ch09), instantané JSON immuable et
 *   ses versions, état technique (`READY`, `RUNNING`, `PAUSED`, `FINISHED`), statut métier à la clôture
 *   (`COMPLETED`, `PARTIAL`, `INTERRUPTED`), checkpoint du noyau (JSON) et sa révision, horodatages et
 *   dernière heure murale évaluée (contrôle de continuité, Q6).
 * - `execution_results` : résultats d'étape et de portée, clé logique `(execution_id, result_key)` — une
 *   mise à jour idempotente empêche toute duplication à la réémission d'une transition (§15.2, T20).
 *
 * La transaction de `migrateDatabase.ts` est exclusive et unique : un échec laisse `user_version` à 23.
 */
export const MIGRATION_024_EXECUTIONS = `CREATE TABLE executions (
  id TEXT PRIMARY KEY NOT NULL,
  origin TEXT NOT NULL CHECK (origin IN ('SESSION')),
  session_id TEXT,
  snapshot_json TEXT NOT NULL,
  snapshot_version INTEGER NOT NULL,
  plan_version INTEGER NOT NULL,
  engine_version INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('READY', 'RUNNING', 'PAUSED', 'FINISHED')),
  business_status TEXT CHECK (business_status IS NULL OR business_status IN ('COMPLETED', 'PARTIAL', 'INTERRUPTED')),
  checkpoint_json TEXT NOT NULL,
  checkpoint_revision INTEGER NOT NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  last_saved_at TEXT NOT NULL,
  clock_wall_ms INTEGER NOT NULL
)`;

export const MIGRATION_024_EXECUTION_RESULTS = `CREATE TABLE execution_results (
  execution_id TEXT NOT NULL REFERENCES executions(id) ON DELETE CASCADE,
  result_key TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('STEP', 'SCOPE')),
  payload_json TEXT NOT NULL,
  revision INTEGER NOT NULL,
  PRIMARY KEY (execution_id, result_key)
)`;

export const MIGRATION_024_UNFINISHED_INDEX = `CREATE INDEX executions_unfinished ON executions (status) WHERE status <> 'FINISHED'`;

export async function applyMigration024(transaction: Database): Promise<void> {
  await transaction.execAsync(MIGRATION_024_EXECUTIONS);
  await transaction.execAsync(MIGRATION_024_EXECUTION_RESULTS);
  await transaction.execAsync(MIGRATION_024_UNFINISHED_INDEX);
}
