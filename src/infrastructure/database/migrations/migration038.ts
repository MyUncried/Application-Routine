import type { Database } from "../Database";

/**
 * Migration 038 — Programmes (PROG-CAT-01, 21/11/2026 ; D-543 à D-552 ; décisions de Hermann du 21/11/2026). Développée
 * comme migration 035 ; renumérotée 038 à l’intégration du 23/11/2026 (INTEG-PROG-2311) : les bases déjà passées en 36 et 37
 * par la planification ne l’auraient jamais reçue sous le numéro 035.
 *
 * - `programs` : programme personnel (`owner_id`), nom obligatoire, objectif facultatif, période obligatoire
 *   (`end_date >= start_date`), suivi de la douleur (`pain_tracking`, faux par défaut), `terminated_at` (programme
 *   supprimé avec un historique, D-547). Le statut Actif / Terminé est calculé, jamais stocké.
 * - `routines.program_id` : rattachement facultatif d'une routine à un programme ; `ON DELETE SET NULL`.
 * - `executions.program_id` : programme du moment, figé au lancement d'une exécution depuis une occurrence d'une routine
 *   rattachée (Hermann, 21/11/2026, point 3 : « L'historique du programme ne doit pas dépendre du lien routine →
 *   programme »). Sans clé étrangère, comme `occurrence_executions` (migration 033) : la référence reste sur l'exécution.
 *   Aucune reprise : aucune exécution passée n'a de programme.
 * - `user_privacy.pain_consent_at` : accord au suivi de la douleur, au niveau de l'utilisateur (D-551). Table à part, une
 *   ligne par utilisateur, plutôt qu'une colonne de `profiles` : le Profil (préférences) reste inchangé (contrats de
 *   préservation des migrations 007 à 030) [choix technique].
 *
 * Ajout seulement : aucune donnée existante n'est réécrite (routines, occurrences et exécutions conservées). Idempotente.
 */
export const MIGRATION_038_PROGRAMS = `CREATE TABLE IF NOT EXISTS programs (
  id TEXT PRIMARY KEY NOT NULL,
  owner_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  objective TEXT,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  pain_tracking INTEGER NOT NULL DEFAULT 0 CHECK (pain_tracking IN (0, 1)),
  terminated_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (end_date >= start_date)
)`;

export const MIGRATION_038_ROUTINE_PROGRAM = "ALTER TABLE routines ADD COLUMN program_id TEXT REFERENCES programs(id) ON DELETE SET NULL";
export const MIGRATION_038_ROUTINE_PROGRAM_INDEX = "CREATE INDEX IF NOT EXISTS routines_program ON routines (program_id)";
export const MIGRATION_038_EXECUTION_PROGRAM = "ALTER TABLE executions ADD COLUMN program_id TEXT";
export const MIGRATION_038_EXECUTION_PROGRAM_INDEX = "CREATE INDEX IF NOT EXISTS executions_program ON executions (program_id)";
export const MIGRATION_038_USER_PRIVACY = `CREATE TABLE IF NOT EXISTS user_privacy (
  owner_id TEXT PRIMARY KEY NOT NULL REFERENCES users(id),
  pain_consent_at TEXT
)`;

async function hasColumn(transaction: Database, table: string, column: string): Promise<boolean> {
  const columns = await transaction.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  return columns.some((row) => row.name === column);
}

export async function applyMigration038(transaction: Database): Promise<void> {
  await transaction.execAsync(MIGRATION_038_PROGRAMS);
  if (!(await hasColumn(transaction, "routines", "program_id"))) await transaction.execAsync(MIGRATION_038_ROUTINE_PROGRAM);
  await transaction.execAsync(MIGRATION_038_ROUTINE_PROGRAM_INDEX);
  if (!(await hasColumn(transaction, "executions", "program_id"))) await transaction.execAsync(MIGRATION_038_EXECUTION_PROGRAM);
  await transaction.execAsync(MIGRATION_038_EXECUTION_PROGRAM_INDEX);
  await transaction.execAsync(MIGRATION_038_USER_PRIVACY);
}
