import type { Database } from "../Database";
import { MIGRATION_014_DDL } from "./migration014";

/**
 * PRE-9 (story A.1, version 16, `migration016`) — structure D-451 complète : Exercice direct de
 * Cycle et Point d'arrêt à l'intérieur d'un Cycle (D-451 « Cycle : Exercices directs et
 * Circuits » ; ARB-06 du 29/10/2026).
 *
 * - `activities.cycle_id` : `NULL` hors Cycle ; sinon le Cycle dont l'Exercice est membre direct
 *   (clé étrangère composite vers `cycles`, CASCADE, comme `tours.cycle_id`). Au plus un parent :
 *   `tour_id` et `cycle_id` ne sont jamais renseignés ensemble (CHECK).
 * - `session_stop_points.cycle_id` : même règle pour un Point placé dans un Cycle.
 * - Rang dans un Cycle : partagé par ses Exercices directs (`activities`) et ses Circuits
 *   (`tours`), comme le rang du niveau principal ; unicité par table garantie par des index
 *   uniques partiels, unicité commune et contiguïté garanties par le repository à l'écriture et
 *   contrôlées à la lecture (patron de `migration014`).
 *
 * **Conversion sans perte, aucune réinitialisation** : les deux tables sont reconstruites (SQLite
 * n'ajoute ni clé étrangère composite ni CHECK multi-colonnes par `ALTER TABLE`) et toutes leurs
 * lignes recopiées à l'identique, `cycle_id = NULL` ; aucune Séance existante ne change de
 * structure. Comptes et `foreign_key_check` vérifiés : toute différence annule tout et laisse
 * `user_version` à 15. Exécutée une seule fois, dans la transaction exclusive unique de
 * `migrateDatabase.ts`. `migration001.ts` à `migration015.ts` restent inchangées.
 */

/** Erreur structurelle de la migration 016 : annulation complète. */
export class Migration016StructuralError extends Error {
  constructor(message: string) {
    super(`migration016: ${message}`);
    this.name = "Migration016StructuralError";
  }
}

/** Définition 014 d'une table, lue dans `MIGRATION_014_DDL` (le CHECK composite de l'Exercice n'est jamais recopié à la main). */
function ddl014(prefix: string): string {
  const statement = MIGRATION_014_DDL.find((item) => item.startsWith(prefix));
  if (statement === undefined) {
    throw new Migration016StructuralError(`missing 014 definition: ${prefix}`);
  }
  return statement;
}

/** Ajoute `cycle_id`, sa clé étrangère composite et le CHECK « au plus un parent » à une définition 014. */
function withCycleParent(statement: string): string {
  const parent = "  tour_id TEXT,\n";
  const tourForeignKey = "  FOREIGN KEY (tour_id, session_id)\n    REFERENCES tours(id, session_id)\n    ON UPDATE RESTRICT\n    ON DELETE CASCADE";
  if (!statement.includes(parent) || !statement.includes(tourForeignKey)) {
    throw new Migration016StructuralError("unexpected 014 definition");
  }
  return statement
    .replace(parent, `${parent}  cycle_id TEXT,\n`)
    .replace(
      tourForeignKey,
      `${tourForeignKey},
  FOREIGN KEY (cycle_id, session_id)
    REFERENCES cycles(id, session_id)
    ON UPDATE RESTRICT
    ON DELETE CASCADE,
  CHECK ((tour_id IS NULL) OR (cycle_id IS NULL))`,
    );
}

export const MIGRATION_016_DDL: readonly string[] = [
  withCycleParent(ddl014("CREATE TABLE activities (")),
  "CREATE INDEX activities_session_position_idx ON activities(session_id, tour_id, position)",
  "CREATE UNIQUE INDEX activities_tour_position_unique ON activities(tour_id, position) WHERE tour_id IS NOT NULL",
  "CREATE UNIQUE INDEX activities_cycle_position_unique ON activities(cycle_id, position) WHERE cycle_id IS NOT NULL",
  "CREATE INDEX activities_source_movement_idx ON activities(source_movement_id)",
  withCycleParent(ddl014("CREATE TABLE session_stop_points (")),
  "CREATE UNIQUE INDEX session_stop_points_main_unique ON session_stop_points(session_id, position) WHERE tour_id IS NULL AND cycle_id IS NULL",
  "CREATE UNIQUE INDEX session_stop_points_circuit_unique ON session_stop_points(tour_id, position) WHERE tour_id IS NOT NULL",
  "CREATE UNIQUE INDEX session_stop_points_cycle_unique ON session_stop_points(cycle_id, position) WHERE cycle_id IS NOT NULL",
];

const ACTIVITY_COLUMNS = `id, session_id, tour_id, type, position, execution_mode, duration_seconds, repetition_count,
     series_count, pause_seconds, post_activity_recovery_seconds, created_at, updated_at, side_mode,
     execution_parameters, post_activity_recovery_present, source_movement_id, copy_number`;

const STAGING_DDL: readonly string[] = [
  `CREATE TABLE m016_activities AS SELECT ${ACTIVITY_COLUMNS} FROM activities`,
  "CREATE TABLE m016_stop_points AS SELECT id, session_id, tour_id, position FROM session_stop_points",
];

/** Anciennes tables, enfants d'abord (aucune table ne référence l'une ou l'autre). */
const DROPPED_TABLES = ["session_stop_points", "activities"] as const;

const RESTORE_STATEMENTS: readonly string[] = [
  `INSERT INTO activities (${ACTIVITY_COLUMNS}, cycle_id)
   SELECT ${ACTIVITY_COLUMNS}, NULL FROM m016_activities`,
  `INSERT INTO session_stop_points (id, session_id, tour_id, cycle_id, position)
   SELECT id, session_id, tour_id, NULL, position FROM m016_stop_points`,
];

const STAGING_TABLES = ["m016_stop_points", "m016_activities"] as const;

/** Empreinte des lignes recopiées : toute colonne d'origine, dans un ordre stable. */
const FINGERPRINTS = {
  activities: `SELECT COUNT(*) AS count, COALESCE(SUM(LENGTH(${ACTIVITY_COLUMNS.split(",")
    .map((column) => `COALESCE(${column.trim()}, '')`)
    .join(" || '|' || ")})), 0) AS weight FROM activities`,
  stopPoints:
    "SELECT COUNT(*) AS count, COALESCE(SUM(LENGTH(id || '|' || session_id || '|' || COALESCE(tour_id, '') || '|' || position)), 0) AS weight FROM session_stop_points",
} as const;

type Fingerprint = { count: number; weight: number };

async function fingerprint(transaction: Database, query: string): Promise<Fingerprint> {
  const row = await transaction.getFirstAsync<Fingerprint>(query);
  return { count: row?.count ?? 0, weight: row?.weight ?? 0 };
}

/** Ligne de `PRAGMA foreign_key_check`. */
type ForeignKeyViolation = { readonly table: string; readonly rowid: number | null; readonly parent: string; readonly fkid: number };

function violationKey(violation: ForeignKeyViolation): string {
  return `${violation.table}|${String(violation.rowid)}|${violation.parent}|${violation.fkid}`;
}

/** Détail lisible des premières violations (diagnostic sur appareil). */
function describeViolations(violations: readonly ForeignKeyViolation[]): string {
  return violations
    .slice(0, 5)
    .map((violation) => `${violation.table}#${String(violation.rowid)}→${violation.parent}`)
    .join(", ");
}

/** Tables reconstruites par la 016 : contrôle strict de leurs clés étrangères. */
const REBUILT_TABLES = ["activities", "session_stop_points"] as const;

/** Applique `migration016` dans la transaction fournie. */
export async function applyMigration016(transaction: Database): Promise<void> {
  // Relevé des violations PRÉEXISTANTES, avant toute écriture (patron de `migration010`, report
  // E7) : une violation sans rapport avec la 016 dans une table qu'elle ne touche pas est tolérée
  // et laissée intacte ; elle bloquait sinon la migration à chaque démarrage (incident de la
  // recette du 29/10/2026 : « foreign_key_check is not empty (5) » sur la base de l'iPhone).
  const violationsBefore = new Set((await transaction.getAllAsync<ForeignKeyViolation>("PRAGMA foreign_key_check")).map(violationKey));
  const before = {
    activities: await fingerprint(transaction, FINGERPRINTS.activities),
    stopPoints: await fingerprint(transaction, FINGERPRINTS.stopPoints),
  };

  for (const statement of STAGING_DDL) {
    await transaction.runAsync(statement);
  }
  for (const table of DROPPED_TABLES) {
    await transaction.runAsync(`DROP TABLE ${table}`);
  }
  for (const statement of MIGRATION_016_DDL) {
    await transaction.runAsync(statement);
  }
  for (const statement of RESTORE_STATEMENTS) {
    await transaction.runAsync(statement);
  }
  for (const table of STAGING_TABLES) {
    await transaction.runAsync(`DROP TABLE ${table}`);
  }

  const after = {
    activities: await fingerprint(transaction, FINGERPRINTS.activities),
    stopPoints: await fingerprint(transaction, FINGERPRINTS.stopPoints),
  };
  for (const key of Object.keys(before) as (keyof typeof before)[]) {
    if (before[key].count !== after[key].count || before[key].weight !== after[key].weight) {
      throw new Migration016StructuralError(
        `${key} changed (${before[key].count}/${before[key].weight} → ${after[key].count}/${after[key].weight})`,
      );
    }
  }
  // (1) Strict sur les tables reconstruites : toute violation y est une erreur structurelle.
  for (const table of REBUILT_TABLES) {
    const violations = await transaction.getAllAsync<ForeignKeyViolation>(`PRAGMA foreign_key_check(${table})`);
    if (violations.length > 0) {
      throw new Migration016StructuralError(`foreign_key_check is not empty for ${table} (${violations.length}: ${describeViolations(violations)})`);
    }
  }
  // (2) Autres tables : aucune violation nouvelle.
  const newViolations = (await transaction.getAllAsync<ForeignKeyViolation>("PRAGMA foreign_key_check")).filter(
    (violation) => !violationsBefore.has(violationKey(violation)),
  );
  if (newViolations.length > 0) {
    throw new Migration016StructuralError(`new foreign key violation (${newViolations.length}: ${describeViolations(newViolations)})`);
  }
}
