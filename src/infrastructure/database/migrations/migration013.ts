import type { Database } from "../Database";
import { MIGRATION_NOTICE_EXERCISES_AND_SESSIONS_RESET } from "./migration012";

/**
 * PRE-7 (R-3, version 13, `migration013`) — modèle D-445 C05 : l'occurrence
 * de Séance référence directement le Mouvement et lit son contenu courant ;
 * nom de Mouvement unique (C01) et alias ; retrait de l'indicateur « déjà
 * utilisé » (C03). Transition PONCTUELLE décidée par Hermann le 26/10/2026
 * (Q1, Q2 ; `arbitrage-2026-10-26-reprise-q1-q11.md`).
 *
 * Exécutée UNE seule fois, sous la garde `PRAGMA user_version`, dans la
 * transaction exclusive unique de `migrateDatabase.ts` : une erreur à
 * n'importe quelle étape annule tout et laisse `user_version` à 12. Toutes
 * les écritures passent par `runAsync` (injection d'échec des tests).
 *
 * ## Conservé
 *
 * `users`, `profiles` (préférences), `categories`, `body_zones`, `labels`
 * (personnalisations comprises) et `migration_notices` : aucune ligne n'y est
 * modifiée ni supprimée.
 *
 * ## Réinitialisé une seule fois
 *
 * Mouvements (phases, Zones, médias, groupes de Niveaux), Exercices du
 * Catalogue, Séances et leurs associations (occurrences, Cycles, Circuits,
 * Points d'arrêt, liens de médias et `media_assets` ; les fichiers physiques
 * ne sont pas touchés). Aucune conversion, aucune lecture des formats v4.
 *
 * ## Schéma recréé
 *
 * - `movements` : sans `used` ; `normalized_name` UNIQUE (C01, garanti aussi
 *   en écriture concurrente) ;
 * - `movement_aliases` (nouvelle) : alias facultatifs, partageables entre
 *   Mouvements (aucune unicité globale), uniques dans leur Mouvement ;
 * - `movement_phases`, `movement_body_zones`, `movement_media`,
 *   `activity_definitions` : schémas de `migration012` repris à l'identique ;
 * - `activities` : schéma de `migration012` SANS `name`, `instruction` ni
 *   `category_id` (contenu lu dans le Mouvement, C05) ; `copy_number`
 *   (suffixe « (copie) » non éditable, Q3) ; `source_movement_id` NOT NULL
 *   avec clé étrangère RESTRICT vers `movements` (intégrité des références
 *   actives, D-445) ; paramètres en forme Catalogue v5 (durées par phase) ;
 * - `activity_body_zones` et `session_activity_media` sont supprimées.
 *
 * Avis `EXERCISES_AND_SESSIONS_RESET` si au moins un Exercice ou une Séance a
 * été supprimé (aucun sur une installation neuve ou vide).
 *
 * `migration001.ts` à `migration012.ts` restent inchangées.
 */

/** Erreur structurelle de la migration 013 : annulation complète. */
export class Migration013StructuralError extends Error {
  constructor(message: string) {
    super(`migration013: ${message}`);
    this.name = "Migration013StructuralError";
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
  "activity_definitions",
  "movement_media",
  "movement_body_zones",
  "movement_phases",
  "movements",
  "media_assets",
] as const;

/** Tables recréées ou supprimées, enfants d'abord. */
const DROPPED_TABLES = [
  "session_activity_media",
  "activity_body_zones",
  "activities",
  "activity_definitions",
  "movement_media",
  "movement_body_zones",
  "movement_phases",
  "movements",
] as const;

/** Schéma du Mouvement (ch09 « Modèle cible Mouvement et filiation », D-445 C01, C05). */
const MOVEMENT_DDL: readonly string[] = [
  `CREATE TABLE movements (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 80),
  normalized_name TEXT NOT NULL,
  description TEXT CHECK ((description IS NULL) OR (length(description) <= 1000)),
  category_id TEXT NOT NULL REFERENCES categories(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  next_phase_id INTEGER NOT NULL CHECK (next_phase_id >= 1),
  level_group_id TEXT CHECK ((level_group_id IS NULL) OR (length(level_group_id) >= 1)),
  level_sort_key REAL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK ((level_group_id IS NULL) = (level_sort_key IS NULL))
)`,
  "CREATE UNIQUE INDEX movements_normalized_name_unique ON movements(normalized_name)",
  "CREATE INDEX movements_level_group_idx ON movements(level_group_id, level_sort_key)",
  `CREATE TABLE movement_aliases (
  movement_id TEXT NOT NULL REFERENCES movements(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position >= 0),
  alias TEXT NOT NULL CHECK (length(trim(alias)) BETWEEN 1 AND 80),
  normalized_alias TEXT NOT NULL,
  PRIMARY KEY (movement_id, normalized_alias),
  UNIQUE (movement_id, position)
)`,
  "CREATE INDEX movement_aliases_normalized_idx ON movement_aliases(normalized_alias)",
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
 * Occurrences : schéma d'`activities` de `migration012` (CHECK composite
 * compris, miroir `satisfiesActivityCheck`) sans les colonnes de contenu,
 * avec `copy_number` et la clé étrangère vers `movements` (C05).
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
  execution_mode TEXT NOT NULL CHECK (execution_mode IN ('DURATION', 'REPETITIONS')),
  duration_seconds INTEGER,
  repetition_count INTEGER,
  series_count INTEGER,
  pause_seconds INTEGER NOT NULL DEFAULT 0,
  post_activity_recovery_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  side_mode TEXT NOT NULL DEFAULT 'UNILATERAL'
    CHECK (side_mode IN ('UNILATERAL', 'RIGHT_LEFT', 'LEFT_RIGHT')),
  execution_parameters TEXT,
  post_activity_recovery_present INTEGER NOT NULL DEFAULT 0 CHECK (post_activity_recovery_present IN (0, 1)),
  source_movement_id TEXT NOT NULL
    REFERENCES movements(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  copy_number INTEGER CHECK ((copy_number IS NULL) OR (copy_number >= 1)),
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
  )
)`,
  "CREATE INDEX activities_session_position_idx\nON activities(session_id, structural_position, position)",
  "CREATE INDEX activities_source_movement_idx ON activities(source_movement_id)",
];

async function count(transaction: Database, table: string): Promise<number> {
  // `table` est toujours l'une des constantes littérales de ce module.
  const result = await transaction.getFirstAsync<{ count: number }>(`SELECT COUNT(*) AS count FROM ${table}`);
  return result?.count ?? 0;
}

/**
 * Applique `migration013` dans la transaction fournie. `now` fournit la date
 * ISO 8601 UTC de l'avis (format de `Date.prototype.toISOString()`).
 */
export async function applyMigration013(
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
    throw new Migration013StructuralError(`foreign_key_check is not empty (${violations.length})`);
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
