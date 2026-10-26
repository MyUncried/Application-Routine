import type { Database } from "../Database";

/**
 * PRE-7 (A1.2, version 12, `migration012`) — installation du schéma
 * « Mouvement, filiation et niveaux » (D-437 à D-440, MFN-01 à MFN-05,
 * MFN-08, MFN-12) et transition PONCTUELLE de D-440 assouplie (ch07 l.27,
 * ch10 l.468, ch12 l.241 ; décision de Hermann du 24/10/2026).
 *
 * Exécutée UNE seule fois, sous la garde `PRAGMA user_version`, dans la
 * transaction exclusive unique de `migrateDatabase.ts` : une erreur à
 * n'importe quelle étape annule tout et laisse `user_version` à 11. Toutes
 * les écritures passent par `runAsync` (injection d'échec des tests).
 *
 * ## Conservé
 *
 * `users`, `profiles` (préférences), `categories`, `body_zones` (créations,
 * renommages, retraits compris), `labels` et `migration_notices` : aucune
 * ligne n'y est modifiée ni supprimée.
 *
 * ## Réinitialisé une seule fois
 *
 * Exercices du Catalogue, Séances et leurs associations : Zones, médias
 * (liens et `media_assets` ; les fichiers physiques ne sont pas touchés),
 * occurrences, Cycles, Circuits et Points d'arrêt. La filiation des
 * occurrences existantes n'est pas reconstituable : aucune conversion, aucune
 * lecture des formats v2/v3 (D-440).
 *
 * ## Étapes
 *
 * 1. dénombrer Exercices et Séances (avis) ;
 * 2. supprimer les lignes, enfants d'abord (aucune dépendance aux cascades) ;
 * 3. `DROP` des tables d'Exercices et d'occurrences, enfants d'abord ;
 * 4. `CREATE` des tables MFN : `movements` (contenu partagé, compteur de
 *    phase, « déjà utilisé », groupe de niveaux), `movement_phases`,
 *    `movement_body_zones` (clé étrangère vers `body_zones`, que
 *    l'ancienne `activity_definition_body_zones` n'avait pas),
 *    `movement_media`, `activity_definitions` (`movement_id` NOT NULL,
 *    restrictive ; paramètres Catalogue v4) ; puis `activities`
 *    (`source_movement_id` NOT NULL, SANS clé étrangère ; paramètres résolus
 *    v4) et ses tables filles, schémas de 010/011 repris à l'identique ;
 * 5. `foreign_key_check` vide, sinon erreur structurelle ;
 * 6. avis `EXERCISES_AND_SESSIONS_RESET` si au moins un Exercice ou une
 *    Séance a été supprimé (aucun sur une installation neuve ou vide).
 *
 * `migration001.ts` à `migration011.ts` restent inchangées.
 */

export const MIGRATION_NOTICE_EXERCISES_AND_SESSIONS_RESET = "EXERCISES_AND_SESSIONS_RESET";

/** Erreur structurelle de la migration 012 : annulation complète. */
export class Migration012StructuralError extends Error {
  constructor(message: string) {
    super(`migration012: ${message}`);
    this.name = "Migration012StructuralError";
  }
}

/** Lignes supprimées, enfants d'abord : l'ordre ne dépend d'aucune cascade. */
const DELETED_TABLES = [
  "session_activity_media",
  "activity_body_zones",
  "activities",
  "session_stop_points",
  "tours",
  "cycles",
  "sessions",
  "activity_media",
  "activity_definition_body_zones",
  "activity_definitions",
  "media_assets",
] as const;

/** Tables recréées, supprimées enfants d'abord. */
const DROPPED_TABLES = [
  "session_activity_media",
  "activity_body_zones",
  "activities",
  "activity_media",
  "activity_definition_body_zones",
  "activity_definitions",
] as const;

/** Schéma MFN (ch09 « Modèle cible Mouvement et filiation »). */
const MOVEMENT_DDL: readonly string[] = [
  `CREATE TABLE movements (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 80),
  normalized_name TEXT NOT NULL,
  description TEXT CHECK ((description IS NULL) OR (length(description) <= 1000)),
  category_id TEXT NOT NULL REFERENCES categories(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  next_phase_id INTEGER NOT NULL CHECK (next_phase_id >= 1),
  used INTEGER NOT NULL DEFAULT 0 CHECK (used IN (0, 1)),
  level_group_id TEXT CHECK ((level_group_id IS NULL) OR (length(level_group_id) >= 1)),
  level_sort_key REAL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK ((level_group_id IS NULL) = (level_sort_key IS NULL))
)`,
  "CREATE INDEX movements_normalized_name_idx ON movements(normalized_name)",
  "CREATE INDEX movements_level_group_idx ON movements(level_group_id, level_sort_key)",
  `CREATE TABLE movement_phases (
  movement_id TEXT NOT NULL REFERENCES movements(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  phase_id INTEGER NOT NULL CHECK (phase_id >= 1),
  position INTEGER NOT NULL CHECK (position >= 0),
  label TEXT NOT NULL CHECK (length(trim(label)) >= 1),
  PRIMARY KEY (movement_id, phase_id),
  UNIQUE (movement_id, position)
)`,
  `CREATE TABLE movement_body_zones (
  movement_id TEXT NOT NULL REFERENCES movements(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  body_zone_id TEXT NOT NULL REFERENCES body_zones(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  PRIMARY KEY (movement_id, body_zone_id)
)`,
  "CREATE INDEX movement_body_zones_body_zone_idx ON movement_body_zones(body_zone_id)",
  `CREATE TABLE movement_media (
  id TEXT PRIMARY KEY NOT NULL,
  movement_id TEXT NOT NULL REFERENCES movements(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  asset_id TEXT NOT NULL REFERENCES media_assets(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  position INTEGER NOT NULL CHECK (position >= 0),
  UNIQUE (movement_id, position)
)`,
  "CREATE INDEX movement_media_asset_idx ON movement_media(asset_id)",
  `CREATE TABLE activity_definitions (
  id TEXT PRIMARY KEY NOT NULL,
  movement_id TEXT NOT NULL REFERENCES movements(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  execution_parameters TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)`,
  "CREATE INDEX activity_definitions_movement_idx ON activity_definitions(movement_id)",
  "CREATE INDEX idx_activity_definitions_updated_at ON activity_definitions(updated_at DESC)",
];

/**
 * Occurrences : schéma d'`activities` de `migration010` et colonne de
 * `migration011`, repris à l'identique (CHECK composite compris, miroir
 * `satisfiesActivityCheck`), plus `source_movement_id` NOT NULL sans clé
 * étrangère (MFN-03 : filiation non nulle, orpheline admise).
 */
const OCCURRENCE_DDL: readonly string[] = [
  `CREATE TABLE activities (
  id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL,
  cycle_id TEXT NOT NULL,
  tour_id TEXT,
  type TEXT NOT NULL CHECK (type IN ('EXERCISE', 'RECOVERY')),
  structural_position TEXT NOT NULL CHECK (
    structural_position IN ('BEFORE_TOUR', 'IN_TOUR', 'AFTER_TOUR')
  ),
  position INTEGER NOT NULL CHECK (position >= 0),
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 80),
  execution_mode TEXT NOT NULL CHECK (execution_mode IN ('DURATION', 'REPETITIONS')),
  duration_seconds INTEGER,
  repetition_count INTEGER,
  series_count INTEGER,
  pause_seconds INTEGER NOT NULL DEFAULT 0,
  post_activity_recovery_seconds INTEGER NOT NULL DEFAULT 0,
  instruction TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  side_mode TEXT NOT NULL DEFAULT 'UNILATERAL'
    CHECK (side_mode IN ('UNILATERAL', 'RIGHT_LEFT', 'LEFT_RIGHT')),
  execution_parameters TEXT,
  category_id TEXT
    REFERENCES categories(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  post_activity_recovery_present INTEGER NOT NULL DEFAULT 0 CHECK (post_activity_recovery_present IN (0, 1)),
  source_movement_id TEXT NOT NULL CHECK (length(source_movement_id) >= 1),
  UNIQUE (session_id, structural_position, position),
  FOREIGN KEY (cycle_id, session_id)
    REFERENCES cycles(id, session_id)
    ON UPDATE RESTRICT
    ON DELETE CASCADE,
  FOREIGN KEY (tour_id, cycle_id, session_id)
    REFERENCES tours(id, cycle_id, session_id)
    ON UPDATE RESTRICT
    ON DELETE CASCADE,
  CHECK (
    (
      (structural_position = 'IN_TOUR')
      AND (tour_id IS NOT NULL)
    )
    OR
    (
      (structural_position IN ('BEFORE_TOUR', 'AFTER_TOUR'))
      AND (tour_id IS NULL)
    )
  ),
  CHECK (
    (
      (type = 'EXERCISE')
      AND (series_count IS NOT NULL)
      AND (series_count >= 1)
      AND (pause_seconds BETWEEN 0 AND 5999)
      AND (post_activity_recovery_seconds BETWEEN 0 AND 5999)
      AND (
        (
          (execution_mode = 'DURATION')
          AND (repetition_count IS NULL)
          AND ((duration_seconds IS NULL) OR (duration_seconds BETWEEN 1 AND 5999))
        )
        OR
        (
          (execution_mode = 'REPETITIONS')
          AND (duration_seconds IS NULL)
          AND ((repetition_count IS NULL) OR (repetition_count >= 1))
        )
      )
    )
    OR
    (
      (type = 'RECOVERY')
      AND (execution_mode = 'DURATION')
      AND (duration_seconds IS NOT NULL)
      AND (duration_seconds BETWEEN 1 AND 5999)
      AND (repetition_count IS NULL)
      AND (series_count IS NULL)
      AND (pause_seconds = 0)
      AND (post_activity_recovery_seconds = 0)
    )
  ),
  CHECK ((instruction IS NULL) OR (length(instruction) <= 1000))
)`,
  "CREATE INDEX activities_session_position_idx\nON activities(session_id, structural_position, position)",
  `CREATE TABLE activity_body_zones (
  activity_id TEXT NOT NULL REFERENCES activities(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  body_zone_id TEXT NOT NULL REFERENCES body_zones(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  PRIMARY KEY (activity_id, body_zone_id)
)`,
  `CREATE TABLE session_activity_media (
  id TEXT PRIMARY KEY NOT NULL,
  activity_id TEXT NOT NULL REFERENCES activities(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  asset_id TEXT NOT NULL REFERENCES media_assets(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  position INTEGER NOT NULL CHECK (position >= 0),
  UNIQUE (activity_id, position)
)`,
  "CREATE INDEX session_activity_media_activity_idx\nON session_activity_media(activity_id, position)",
  "CREATE INDEX session_activity_media_asset_idx\nON session_activity_media(asset_id)",
];

async function count(transaction: Database, table: string): Promise<number> {
  // `table` est toujours l'une des constantes littérales de ce module.
  const result = await transaction.getFirstAsync<{ count: number }>(`SELECT COUNT(*) AS count FROM ${table}`);
  return result?.count ?? 0;
}

/**
 * Applique `migration012` dans la transaction fournie. `now` fournit la date
 * ISO 8601 UTC de l'avis (format de `Date.prototype.toISOString()`).
 */
export async function applyMigration012(
  transaction: Database,
  now: () => string = () => new Date().toISOString(),
): Promise<void> {
  const exercises = await count(transaction, "activity_definitions");
  const sessions = await count(transaction, "sessions");

  for (const table of DELETED_TABLES) {
    await transaction.runAsync(`DELETE FROM ${table}`);
  }
  for (const table of DROPPED_TABLES) {
    await transaction.runAsync(`DROP TABLE ${table}`);
  }
  for (const statement of [...MOVEMENT_DDL, ...OCCURRENCE_DDL]) {
    await transaction.runAsync(statement);
  }

  const violations = await transaction.getAllAsync("PRAGMA foreign_key_check");
  if (violations.length > 0) {
    throw new Migration012StructuralError(`foreign_key_check is not empty (${violations.length})`);
  }

  // Avis seulement si un Exercice ou une Séance a disparu (rien sur une base
  // neuve ou vide) ; il ne porte que le nombre, aucun nom ni contenu.
  const removed = exercises + sessions;
  if (removed > 0) {
    await transaction.runAsync(
      "INSERT INTO migration_notices (kind, count, created_at, acknowledged_at) VALUES (?, ?, ?, NULL)",
      [MIGRATION_NOTICE_EXERCISES_AND_SESSIONS_RESET, removed, now()],
    );
  }
}
