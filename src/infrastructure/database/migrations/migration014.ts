import type { Database } from "../Database";

/**
 * PRE-8 (story A.3, version 14, `migration014`) — structure générale de la Séance (D-449 §4) :
 * Exercices, Circuits et Cycles successifs au niveau principal, un Cycle ne contenant que des
 * Circuits et un Circuit que des Exercices (`src/domain/sessions/structure.ts`).
 *
 * **Conversion sans perte, aucune réinitialisation** (autorisation de Hermann du 27/10/2026 :
 * « l'absence d'obligation de reprise historique ne constitue pas une autorisation de
 * réinitialisation »). Chaque Séance garde son identité ; l'ancien modèle `[avant…, Circuit,
 * après…]` devient exactement cette séquence au niveau principal :
 *
 * - Exercice avant le Circuit, de rang p → niveau principal, rang p ;
 * - Circuit (ligne `tours`, même identifiant, même compte, même nature) → niveau principal,
 *   rang nB (nB = nombre d'Exercices avant le Circuit), présent même vide ;
 * - Exercice du Circuit, de rang p → rang p dans ce Circuit ;
 * - Exercice après le Circuit, de rang p → niveau principal, rang nB + 1 + p ;
 * - Point d'arrêt (même identifiant) : (avant, p) → (principal, p) ; (Circuit, p) → (Circuit, p) ;
 *   (après, p) → (principal, nB + 1 + p).
 *
 * Les rangs d'origine sont recompactés par zone (`ROW_NUMBER`), dans leur ordre. Le Cycle
 * technique (`position = 1`, `repeat_count = 1`) n'est pas un Cycle utilisateur : sa ligne
 * disparaît, aucune Séance existante ne reçoit de Cycle. Les identifiants, paramètres,
 * références aux Mouvements, numéros de copie, horodatages et récupérations des Exercices sont
 * recopiés à l'identique.
 *
 * Aucune autre table n'est touchée : `sessions`, `movements` et tables filles,
 * `activity_definitions` (Exercices du Catalogue, conservés intacts en attendant l'Epic E),
 * référentiels, Profil, médias et avis.
 *
 * ## Schéma
 *
 * - `cycles` : Cycles utilisateur ; `position` = rang au niveau principal ; `repeat_count ≥ 1`
 *   sans borne haute (D-449 : aucun plafond arbitraire).
 * - `tours` (Circuits) : `cycle_id` NULL au niveau principal, sinon le Cycle (clé étrangère
 *   composite, CASCADE) ; `position` = rang au niveau principal ou dans le Cycle ; compte 1..99 ;
 *   `side_mode` et `nature` repris de 005 et 011.
 * - `activities` (Exercices) : colonnes de 013 sans `cycle_id` ni `structural_position` ;
 *   `tour_id` NULL au niveau principal, sinon le Circuit (clé étrangère composite, CASCADE) ;
 *   CHECK composite de 013 repris à l'identique ; clé étrangère RESTRICT vers `movements`.
 * - `session_stop_points` : `tour_id` NULL au niveau principal, sinon le Circuit.
 * - Unicité des rangs par conteneur : index uniques partiels. Le rang du niveau principal est
 *   partagé par trois tables ; son unicité et sa contiguïté sont garanties par le repository à
 *   l'écriture et contrôlées à la lecture.
 *
 * Exécutée une seule fois, sous la garde `PRAGMA user_version`, dans la transaction exclusive
 * unique de `migrateDatabase.ts` : toute erreur annule tout et laisse `user_version` à 13.
 * Toutes les écritures passent par `runAsync` (injection d'échec des tests). `migration001.ts`
 * à `migration013.ts` restent inchangées.
 */

/** Erreur structurelle de la migration 014 : annulation complète. */
export class Migration014StructuralError extends Error {
  constructor(message: string) {
    super(`migration014: ${message}`);
    this.name = "Migration014StructuralError";
  }
}

/** Copies de travail, supprimées avant la fin de la transaction. */
const STAGING_DDL: readonly string[] = [
  `CREATE TABLE m014_before_counts AS
   SELECT sessions.id AS session_id,
          (SELECT COUNT(*) FROM activities
            WHERE activities.session_id = sessions.id AND activities.structural_position = 'BEFORE_TOUR') AS before_count
   FROM sessions`,
  `CREATE TABLE m014_tours AS
   SELECT tours.id, tours.session_id, tours.repeat_count, tours.side_mode, tours.nature,
          m014_before_counts.before_count AS position
   FROM tours
   JOIN m014_before_counts ON m014_before_counts.session_id = tours.session_id`,
  `CREATE TABLE m014_activities AS
   SELECT ranked.*,
          CASE ranked.structural_position
            WHEN 'BEFORE_TOUR' THEN ranked.zone_rank
            WHEN 'IN_TOUR' THEN ranked.zone_rank
            ELSE m014_before_counts.before_count + 1 + ranked.zone_rank
          END AS new_position,
          CASE ranked.structural_position WHEN 'IN_TOUR' THEN ranked.tour_id ELSE NULL END AS new_tour_id
   FROM (
     SELECT activities.*,
            ROW_NUMBER() OVER (
              PARTITION BY activities.session_id, activities.structural_position
              ORDER BY activities.position
            ) - 1 AS zone_rank
     FROM activities
   ) AS ranked
   JOIN m014_before_counts ON m014_before_counts.session_id = ranked.session_id`,
  `CREATE TABLE m014_stop_points AS
   SELECT session_stop_points.id, session_stop_points.session_id,
          CASE session_stop_points.scope
            WHEN 'IN_TOUR' THEN (SELECT tours.id FROM tours WHERE tours.session_id = session_stop_points.session_id)
            ELSE NULL
          END AS tour_id,
          CASE session_stop_points.scope
            WHEN 'AFTER_TOUR' THEN m014_before_counts.before_count + 1 + session_stop_points.position
            ELSE session_stop_points.position
          END AS position
   FROM session_stop_points
   JOIN m014_before_counts ON m014_before_counts.session_id = session_stop_points.session_id`,
];

/** Anciennes tables, enfants d'abord. */
const DROPPED_TABLES = ["session_stop_points", "activities", "tours", "cycles"] as const;

const STAGING_TABLES = ["m014_stop_points", "m014_activities", "m014_tours", "m014_before_counts"] as const;

export const MIGRATION_014_DDL: readonly string[] = [
  `CREATE TABLE cycles (
  id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position >= 0),
  repeat_count INTEGER NOT NULL CHECK (repeat_count >= 1),
  UNIQUE (id, session_id)
)`,
  "CREATE INDEX cycles_session_idx ON cycles(session_id, position)",
  `CREATE TABLE tours (
  id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  cycle_id TEXT,
  position INTEGER NOT NULL CHECK (position >= 0),
  repeat_count INTEGER NOT NULL DEFAULT 1 CHECK (repeat_count BETWEEN 1 AND 99),
  side_mode TEXT NOT NULL DEFAULT 'UNILATERAL' CHECK (side_mode IN ('UNILATERAL', 'RIGHT_LEFT', 'LEFT_RIGHT')),
  nature TEXT NOT NULL DEFAULT 'TOURS' CHECK (nature IN ('TOURS', 'SERIES')),
  UNIQUE (id, session_id),
  FOREIGN KEY (cycle_id, session_id)
    REFERENCES cycles(id, session_id)
    ON UPDATE RESTRICT
    ON DELETE CASCADE
)`,
  "CREATE INDEX tours_session_idx ON tours(session_id, cycle_id, position)",
  "CREATE UNIQUE INDEX tours_cycle_position_unique ON tours(cycle_id, position) WHERE cycle_id IS NOT NULL",
  `CREATE TABLE activities (
  id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  tour_id TEXT,
  type TEXT NOT NULL CHECK (type IN ('EXERCISE', 'RECOVERY')),
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
  FOREIGN KEY (tour_id, session_id)
    REFERENCES tours(id, session_id)
    ON UPDATE RESTRICT
    ON DELETE CASCADE,
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
  "CREATE INDEX activities_session_position_idx ON activities(session_id, tour_id, position)",
  "CREATE UNIQUE INDEX activities_tour_position_unique ON activities(tour_id, position) WHERE tour_id IS NOT NULL",
  "CREATE INDEX activities_source_movement_idx ON activities(source_movement_id)",
  `CREATE TABLE session_stop_points (
  id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  tour_id TEXT,
  position INTEGER NOT NULL CHECK (position >= 0),
  FOREIGN KEY (tour_id, session_id)
    REFERENCES tours(id, session_id)
    ON UPDATE RESTRICT
    ON DELETE CASCADE
)`,
  "CREATE UNIQUE INDEX session_stop_points_main_unique ON session_stop_points(session_id, position) WHERE tour_id IS NULL",
  "CREATE UNIQUE INDEX session_stop_points_circuit_unique ON session_stop_points(tour_id, position) WHERE tour_id IS NOT NULL",
];

const RESTORE_STATEMENTS: readonly string[] = [
  `INSERT INTO tours (id, session_id, cycle_id, position, repeat_count, side_mode, nature)
   SELECT id, session_id, NULL, position, repeat_count, side_mode, nature FROM m014_tours`,
  `INSERT INTO activities (
     id, session_id, tour_id, type, position, execution_mode, duration_seconds, repetition_count,
     series_count, pause_seconds, post_activity_recovery_seconds, created_at, updated_at, side_mode,
     execution_parameters, post_activity_recovery_present, source_movement_id, copy_number
   )
   SELECT
     id, session_id, new_tour_id, type, new_position, execution_mode, duration_seconds, repetition_count,
     series_count, pause_seconds, post_activity_recovery_seconds, created_at, updated_at, side_mode,
     execution_parameters, post_activity_recovery_present, source_movement_id, copy_number
   FROM m014_activities`,
  `INSERT INTO session_stop_points (id, session_id, tour_id, position)
   SELECT id, session_id, tour_id, position FROM m014_stop_points`,
];

async function count(transaction: Database, table: string): Promise<number> {
  // `table` est toujours l'une des constantes littérales de ce module.
  const result = await transaction.getFirstAsync<{ count: number }>(`SELECT COUNT(*) AS count FROM ${table}`);
  return result?.count ?? 0;
}

/** Applique `migration014` dans la transaction fournie. */
export async function applyMigration014(transaction: Database): Promise<void> {
  const before = {
    sessions: await count(transaction, "sessions"),
    tours: await count(transaction, "tours"),
    activities: await count(transaction, "activities"),
    stopPoints: await count(transaction, "session_stop_points"),
  };
  // Invariant de l'ancien modèle : exactement un Circuit par Séance.
  if (before.tours !== before.sessions) {
    throw new Migration014StructuralError(`expected one circuit per session (${before.tours}/${before.sessions})`);
  }

  for (const statement of STAGING_DDL) {
    await transaction.runAsync(statement);
  }
  for (const table of DROPPED_TABLES) {
    await transaction.runAsync(`DROP TABLE ${table}`);
  }
  for (const statement of MIGRATION_014_DDL) {
    await transaction.runAsync(statement);
  }
  for (const statement of RESTORE_STATEMENTS) {
    await transaction.runAsync(statement);
  }
  for (const table of STAGING_TABLES) {
    await transaction.runAsync(`DROP TABLE ${table}`);
  }

  const after = {
    sessions: await count(transaction, "sessions"),
    tours: await count(transaction, "tours"),
    activities: await count(transaction, "activities"),
    stopPoints: await count(transaction, "session_stop_points"),
  };
  for (const key of Object.keys(before) as (keyof typeof before)[]) {
    if (before[key] !== after[key]) {
      throw new Migration014StructuralError(`${key} count changed (${before[key]} → ${after[key]})`);
    }
  }
  const violations = await transaction.getAllAsync("PRAGMA foreign_key_check");
  if (violations.length > 0) {
    throw new Migration014StructuralError(`foreign_key_check is not empty (${violations.length})`);
  }
}
