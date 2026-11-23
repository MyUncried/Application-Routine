import type { Database } from "../Database";

/**
 * Migration 034 — occurrences de routine enregistrées et archivage des routines (D-536, D-537 ; modèle validé par
 * Hermann le 20/11/2026, cahier q21-modele : « Une occurrence modifiée à la main est enregistrée avec les seuls groupes
 * modifiés (date et heure ; séances, actives ou non, ajoutées ou de la routine ; rappel) ; les autres groupes continuent
 * de suivre la routine. Une occurrence commencée est enregistrée en entier. Elle se fige au lancement de sa première
 * séance. Une occurrence commencée reste à sa date prévue d'origine, même si la récurrence change ; sa date réelle
 * d'exécution est enregistrée à part. »).
 *
 * - `routine_occurrences` : une ligne par occurrence modifiée à la main ou commencée, identifiée par sa date/heure
 *   d'origine. Chaque groupe est NULL tant qu'il suit la routine : `occurrence_date`/`occurrence_time` (date et heure),
 *   `sessions_json` (séances : liste ordonnée `{ sessionId, entryId, origin, active }`), `reminder_overridden` +
 *   `reminder_minutes` (rappel). `started_at` non NULL : occurrence commencée, tous les groupes renseignés (figée).
 *   `occurrence_index` : rang dans la suite du créneau, conservé pour une occurrence que la routine ne produit plus.
 * - `routines.archived_at` : routine archivée (D-537, suppression d'une routine qui a un historique).
 *
 * La date réelle d'exécution reste dans `executions.started_at` / `ended_at` (migration 024). Ajout seulement : aucune
 * donnée existante n'est réécrite. [Choix technique : séances d'une occurrence en JSON dans une seule table, plutôt que
 * la seconde table de la proposition du 20/11/2026.]
 */
export const MIGRATION_034_ROUTINE_OCCURRENCES = `CREATE TABLE IF NOT EXISTS routine_occurrences (
  routine_id TEXT NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  occurrence_key TEXT NOT NULL,
  occurrence_index INTEGER NOT NULL CHECK (occurrence_index >= 1),
  occurrence_date TEXT,
  occurrence_time TEXT,
  sessions_json TEXT,
  reminder_overridden INTEGER NOT NULL DEFAULT 0 CHECK (reminder_overridden IN (0, 1)),
  reminder_minutes INTEGER,
  started_at TEXT,
  PRIMARY KEY (routine_id, occurrence_key)
)`;

export const MIGRATION_034_ROUTINE_ARCHIVED = "ALTER TABLE routines ADD COLUMN archived_at TEXT";

export async function applyMigration034(transaction: Database): Promise<void> {
  await transaction.execAsync(MIGRATION_034_ROUTINE_OCCURRENCES);
  const columns = await transaction.getAllAsync<{ name: string }>("PRAGMA table_info(routines)");
  if (!columns.some((column) => column.name === "archived_at")) await transaction.execAsync(MIGRATION_034_ROUTINE_ARCHIVED);
}
