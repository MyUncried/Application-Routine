import type { Database } from "../Database";

/**
 * Migration 033 — lien occurrence de routine ↔ Exécution (recette du 19/11/2026 au soir : statuts « Complétée »,
 * « Partielle », « Arrêtée » des occurrences et code couleur de l'Agenda).
 *
 * Table à part, sans toucher à `executions` : une Exécution lancée depuis une carte de routine y reçoit la routine, la
 * date/heure d'origine de l'occurrence et le rang de la séance. Pas de clé étrangère vers `routines` : supprimer une
 * planification conserve ses Exécutions (RM-050). La suppression d'une Exécution supprime son lien.
 * Ajout seulement : aucune donnée existante n'est réécrite. Idempotente.
 */
export const MIGRATION_033_OCCURRENCE_EXECUTIONS = `CREATE TABLE IF NOT EXISTS occurrence_executions (
  execution_id TEXT PRIMARY KEY NOT NULL REFERENCES executions(id) ON DELETE CASCADE,
  routine_id TEXT NOT NULL,
  occurrence_key TEXT NOT NULL,
  session_rank INTEGER NOT NULL CHECK (session_rank >= 1)
)`;

export const MIGRATION_033_OCCURRENCE_INDEX = `CREATE INDEX IF NOT EXISTS occurrence_executions_occurrence ON occurrence_executions (routine_id, occurrence_key)`;

export async function applyMigration033(transaction: Database): Promise<void> {
  await transaction.execAsync(MIGRATION_033_OCCURRENCE_EXECUTIONS);
  await transaction.execAsync(MIGRATION_033_OCCURRENCE_INDEX);
}
