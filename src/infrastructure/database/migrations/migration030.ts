import type { Database } from "../Database";

/**
 * Planification (version 30, `migration030`) — Routines multi-contenus (chapitre 09, « Entité Routine » ; D-328,
 * D-329, D-331 ; D-449 : seule la Séance est planifiable). Tables additives, aucune table existante modifiée ;
 * 001..029 inchangées. Un échec laisse `user_version` à 29.
 *
 * - `routines` : créneau (début, heure unique), répétition (unité, multiplicateur, jours, borne). L'unité est
 *   contrainte aux trois valeurs de la conception (Jour/Semaine/Mois) ; seule Semaine est écrite aujourd'hui.
 * - `routine_entries` : liste ordonnée (`position`), une Séance par entrée, fréquence x/n et positions retenues.
 *   Aucune clé étrangère vers `sessions` : supprimer définitivement une Séance archivée ne doit ni échouer ni
 *   modifier silencieusement une Routine à plusieurs contenus (effet « À CLARIFIER », chapitre 09) ; une entrée
 *   dont la Séance n'est plus active est ignorée à la lecture du Calendrier.
 * - `routines.reminder_minutes` : rappel facultatif (0..1, D-060), délai en minutes, 24 h au plus (D-243).
 * - `routine_exclusions` : occurrences retirées une à une (R-04), par date/heure d'origine.
 * Les occurrences futures ne sont pas stockées (D-013) ; aucune phrase récapitulative n'est stockée.
 */
export const MIGRATION_030_ROUTINES = [
  `CREATE TABLE routines (
    id TEXT PRIMARY KEY NOT NULL,
    owner_id TEXT NOT NULL REFERENCES users(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    start_date TEXT NOT NULL CHECK (start_date GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'),
    start_time TEXT NOT NULL CHECK (start_time GLOB '[0-2][0-9]:[0-5][0-9]'),
    repeat_unit TEXT NULL CHECK (repeat_unit IN ('DAY', 'WEEK', 'MONTH')),
    repeat_every INTEGER NULL CHECK (repeat_every IS NULL OR repeat_every >= 1),
    repeat_weekdays TEXT NULL,
    end_kind TEXT NULL CHECK (end_kind IN ('UNTIL', 'FOR')),
    end_date TEXT NULL,
    end_count INTEGER NULL CHECK (end_count IS NULL OR end_count >= 1),
    reminder_minutes INTEGER NULL CHECK (reminder_minutes IS NULL OR reminder_minutes BETWEEN 1 AND 1440),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    CHECK ((repeat_unit IS NULL AND repeat_every IS NULL AND end_kind IS NULL) OR (repeat_unit IS NOT NULL AND repeat_every IS NOT NULL AND end_kind IS NOT NULL)),
    CHECK (end_kind IS NULL OR (end_kind = 'UNTIL' AND end_date IS NOT NULL AND end_count IS NULL) OR (end_kind = 'FOR' AND end_count IS NOT NULL AND end_date IS NULL))
  )`,
  `CREATE TABLE routine_entries (
    id TEXT PRIMARY KEY NOT NULL,
    routine_id TEXT NOT NULL REFERENCES routines(id) ON UPDATE RESTRICT ON DELETE CASCADE,
    position INTEGER NOT NULL CHECK (position >= 0),
    session_id TEXT NOT NULL,
    frequency_x INTEGER NOT NULL DEFAULT 1 CHECK (frequency_x >= 1),
    frequency_n INTEGER NOT NULL DEFAULT 1 CHECK (frequency_n >= frequency_x),
    frequency_positions TEXT NOT NULL DEFAULT '1',
    UNIQUE (routine_id, position)
  )`,
  "CREATE INDEX routine_entries_session ON routine_entries (session_id)",
  `CREATE TABLE routine_exclusions (
    routine_id TEXT NOT NULL REFERENCES routines(id) ON UPDATE RESTRICT ON DELETE CASCADE,
    occurrence_key TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (routine_id, occurrence_key)
  )`,
] as const;

export async function applyMigration030(transaction: Database): Promise<void> {
  for (const statement of MIGRATION_030_ROUTINES) await transaction.execAsync(statement);
}
