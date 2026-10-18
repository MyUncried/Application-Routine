import type { Database } from "../Database";

/**
 * PRE-4 (story 1.1, version 10, `migration010`) — passage au modèle « deux
 * Modes, une Cible typée par Série » (AD-1, AD-3, AD-4, AD-12).
 *
 * Exécutée dans la transaction exclusive unique de `migrateDatabase.ts`
 * (étape JavaScript, comme 008). Toutes ses lectures et écritures passent par
 * l'API `Database` (`getAllAsync`, `runAsync`) : une erreur injectée à
 * n'importe quelle étape annule toute la migration (H6).
 *
 * ## Convertisseur FIGÉ
 *
 * Le classement et la conversion v1 → v2 sont EMBARQUÉS ici et n'importent
 * ni le sérialiseur ni les lecteurs du domaine (AD-4) : le résultat de la
 * migration ne change pas quand le domaine évolue. La forme v2 écrite est
 * celle d'AD-3, figée : mêmes clés et même ordre que le sérialiseur v1 de
 * PRE-3, `JSON.stringify` sans espace ; seuls `version` et l'encodage de la
 * Cible changent. L'adaptateur des lignes sans JSON est la copie figée de
 * l'adaptateur historique de PRE-3 (`legacyExecutionParameters`).
 *
 * ## Prédicat d'illisibilité FERMÉ (Q19, Q28, P44 amendée, P45)
 *
 * Une ligne Exercice est illisible si et seulement si : (a) JSON non
 * analysable ; (b) version ≠ 1 ; (c) racine non objet, clé requise absente,
 * type impossible ; (d) Mode, côté, ordre des côtés ou `series.kind`
 * inconnus ; (e) `count` < 1, `rows` absent, vide ou non tableau ; (f) N non
 * entier (JSON ou `series_count`) ; (g) Copie en Séance seulement : projection
 * scalaire qui violerait le nouveau CHECK d'`activities` ; (h) valeur
 * numérique négative ou non entière (Cible, Pause, Pause au changement de
 * côté, Bip, Compte à rebours, Fin), dans un JSON v1 ou dans les scalaires
 * d'une ligne sans JSON, quelle que soit la ligne. Tout autre cas est
 * lisible : une valeur positive hors grille ou hors bornes est conservée
 * telle quelle (Q15, Q21, H25) ; une Cible absente, `null` ou 0 devient
 * `UNSET` (H7), jamais `FAILURE`. Les scalaires d'une ligne à JSON sont
 * ignorés.
 *
 * Une ligne illisible est ÉCARTÉE avec ses liens (sans sauvegarde ni
 * quarantaine) ; sa Séance, ses Catégories, Zones, `media_assets` et fichiers
 * sont conservés ; le nombre d'Exercices écartés est inscrit dans
 * `migration_notices` (AD-12).
 *
 * ## Étapes (AD-4)
 *
 * 1. lire et classer toutes les lignes Exercice des deux tables (JavaScript) ;
 * 2. supprimer les illisibles et leurs liens ;
 * 3. renuméroter les positions restantes (plage haute de 004) ;
 * 4. mettre à jour les Définitions (v2 et scalaires projetés) ;
 * 5. reconstruire `activities` avec le nouveau CHECK, par recopie depuis une
 *    table de conversion, avec sauvegarde et restauration de ses tables
 *    filles, contrôle des comptes et de `foreign_key_check` : strict sur
 *    les tables reconstruites, et sans violation nouvelle ailleurs par
 *    rapport au relevé initial (story 1.4, report E7) ;
 * 6. créer `migration_notices` et y écrire l'avis ;
 * 7. `user_version = 10` (fin de transaction, `migrateDatabase.ts`).
 *
 * Toute anomalie de schéma ou de contrôle est une ERREUR STRUCTURELLE :
 * exception, annulation complète, `user_version` inchangé (H6).
 *
 * N'altère aucune migration antérieure ; `activity_definitions` n'est pas
 * reconstruite (son CHECK d'énumération reste permissif ; aucune ligne n'y
 * garde l'ancien mode).
 */

/** Modes historiques des lignes lues (AD-1 : cantonné aux lecteurs v1 et à cette migration). */
type LegacyExecutionMode = "DURATION" | "REPETITIONS" | "TO_FAILURE";

const LEGACY_MODES: readonly string[] = ["DURATION", "REPETITIONS", "TO_FAILURE"];
const SIDE_MODES: readonly string[] = ["UNILATERAL", "RIGHT_LEFT", "LEFT_RIGHT"];
const SIDE_ORDERS: readonly string[] = ["BY_SIDE", "BY_SERIES"];

/** Bornes du CHECK d'`activities` (004, reprises à l'identique), pour le cas (g). */
const CHECK_DURATION_MIN = 1;
const CHECK_DURATION_MAX = 5999;
const CHECK_PAUSE_MAX = 5999;

/** Plage haute de renumérotation (identique à `migration004` et `mergeActivities`). */
const POSITION_STAGING_OFFSET = 1_000_000;

export const MIGRATION_NOTICE_UNREADABLE_EXERCISES_DROPPED = "UNREADABLE_EXERCISES_DROPPED";

/** Colonnes attendues des tables reconstruites (schéma v9). Un écart est une erreur structurelle. */
const EXPECTED_ACTIVITIES_COLUMNS = [
  "id",
  "session_id",
  "cycle_id",
  "tour_id",
  "type",
  "structural_position",
  "position",
  "name",
  "execution_mode",
  "duration_seconds",
  "repetition_count",
  "series_count",
  "pause_seconds",
  "post_activity_recovery_seconds",
  "instruction",
  "created_at",
  "updated_at",
  "side_mode",
  "execution_parameters",
  "category_id",
];
const EXPECTED_ACTIVITY_BODY_ZONES_COLUMNS = ["activity_id", "body_zone_id"];
const EXPECTED_SESSION_ACTIVITY_MEDIA_COLUMNS = ["id", "activity_id", "asset_id", "position"];
/** Seules tables filles d'`activities` (002/008 et 009) : toute autre FK vers `activities` est une erreur structurelle. */
const ACTIVITY_CHILD_TABLES = ["activity_body_zones", "session_activity_media"];

type V2Target = { readonly kind: "NUMBER"; readonly value: number } | { readonly kind: "FAILURE" } | { readonly kind: "UNSET" };
type V2Row = { readonly target: V2Target; readonly pauseSeconds: number };
type V2Series =
  | { readonly kind: "UNIFORM"; readonly count: number; readonly target: V2Target; readonly pauseSeconds: number }
  | { readonly kind: "VARIABLE"; readonly rows: readonly V2Row[] };
type V2Parameters = {
  readonly mode: "DURATION" | "REPETITIONS";
  readonly series: V2Series;
  readonly sideMode: string;
  readonly sideOrder: string;
  readonly sideRecoverySeconds: number;
  readonly cadenceBeepIntervalSeconds: number;
  readonly countdownSeconds: number;
  readonly endSeconds: number;
};

/** Résultat du classement d'une ligne : illisible, ou v2 et projection scalaire (AD-3). */
export type Migration010Conversion =
  | { readonly readable: false; readonly reason: string }
  | {
      readonly readable: true;
      readonly json: string;
      readonly executionMode: "DURATION" | "REPETITIONS";
      readonly durationSeconds: number | null;
      readonly repetitionCount: number | null;
      readonly seriesCount: number;
      readonly pauseSeconds: number;
      readonly sideMode: string;
      readonly sideRecoverySeconds: number;
    };

/** Ligne historique lue (colonnes communes aux deux tables ; `side_recovery_seconds` absent d'`activities`). */
export type Migration010SourceRow = {
  readonly execution_mode: unknown;
  readonly duration_seconds: unknown;
  readonly repetition_count: unknown;
  readonly series_count: unknown;
  readonly pause_seconds: unknown;
  readonly side_mode: unknown;
  readonly side_recovery_seconds?: unknown;
  readonly execution_parameters: unknown;
};

class Unreadable extends Error {}

function unreadable(reason: string): never {
  throw new Unreadable(reason);
}

/** Nombre entier non négatif : un autre type est impossible (c) ; négatif ou non entier : (h), Q28. */
function nonNegativeInteger(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return unreadable(`${field}: not a number`);
  }
  if (!Number.isInteger(value) || value < 0) {
    return unreadable(`${field}: negative or not an integer`);
  }
  return value;
}

/** Cible historique : ancien mode « à l'échec » → `FAILURE` ; absente, `null` ou 0 → `UNSET` (H7) ; sinon valeur exacte. */
function target(value: unknown, mode: LegacyExecutionMode): V2Target {
  if (value === undefined || value === null) {
    return mode === "TO_FAILURE" ? { kind: "FAILURE" } : { kind: "UNSET" };
  }
  const number = nonNegativeInteger(value, "target");
  if (mode === "TO_FAILURE") {
    return { kind: "FAILURE" };
  }
  return number === 0 ? { kind: "UNSET" } : { kind: "NUMBER", value: number };
}

function row(value: unknown, mode: LegacyExecutionMode): V2Row {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return unreadable("row: not an object");
  }
  const record = value as Record<string, unknown>;
  if (!("pauseSeconds" in record)) {
    return unreadable("row: pauseSeconds missing");
  }
  return { target: target(record.target, mode), pauseSeconds: nonNegativeInteger(record.pauseSeconds, "pauseSeconds") };
}

function v2Mode(mode: LegacyExecutionMode): "DURATION" | "REPETITIONS" {
  return mode === "TO_FAILURE" ? "REPETITIONS" : mode;
}

/** Copie figée du lecteur v1 (cas (a) à (f) et (h)). */
function fromV1Json(json: string): V2Parameters {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return unreadable("JSON malformed");
  }
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return unreadable("root not an object");
  }
  const value = raw as Record<string, unknown>;
  for (const key of [
    "version",
    "mode",
    "series",
    "sideMode",
    "sideOrder",
    "sideRecoverySeconds",
    "cadenceBeepIntervalSeconds",
    "countdownSeconds",
    "endSeconds",
  ]) {
    if (!(key in value)) {
      return unreadable(`${key} missing`);
    }
  }
  if (value.version !== 1) {
    return unreadable("unknown version");
  }
  if (typeof value.mode !== "string" || !LEGACY_MODES.includes(value.mode)) {
    return unreadable("unknown mode");
  }
  const mode = value.mode as LegacyExecutionMode;
  if (typeof value.sideMode !== "string" || !SIDE_MODES.includes(value.sideMode)) {
    return unreadable("unknown side mode");
  }
  if (typeof value.sideOrder !== "string" || !SIDE_ORDERS.includes(value.sideOrder)) {
    return unreadable("unknown side order");
  }
  const sideRecoverySeconds = nonNegativeInteger(value.sideRecoverySeconds, "sideRecoverySeconds");
  const cadenceBeepIntervalSeconds = nonNegativeInteger(value.cadenceBeepIntervalSeconds, "cadenceBeepIntervalSeconds");
  const countdownSeconds = nonNegativeInteger(value.countdownSeconds, "countdownSeconds");
  const endSeconds = nonNegativeInteger(value.endSeconds, "endSeconds");
  const seriesValue = value.series;
  if (typeof seriesValue !== "object" || seriesValue === null || Array.isArray(seriesValue)) {
    return unreadable("series not an object");
  }
  const series = seriesValue as Record<string, unknown>;
  let converted: V2Series;
  if (series.kind === "UNIFORM") {
    if (!("count" in series) || !("pauseSeconds" in series)) {
      return unreadable("uniform key missing");
    }
    if (typeof series.count !== "number" || !Number.isFinite(series.count)) {
      return unreadable("count not a number");
    }
    if (!Number.isInteger(series.count)) {
      return unreadable("count not an integer");
    }
    if (series.count < 1) {
      return unreadable("count lower than 1");
    }
    const first = row({ target: series.target, pauseSeconds: series.pauseSeconds }, mode);
    converted = { kind: "UNIFORM", count: series.count, target: first.target, pauseSeconds: first.pauseSeconds };
  } else if (series.kind === "VARIABLE") {
    if (!Array.isArray(series.rows) || series.rows.length === 0) {
      return unreadable("rows missing or empty");
    }
    converted = { kind: "VARIABLE", rows: series.rows.map((item) => row(item, mode)) };
  } else {
    return unreadable("unknown series kind");
  }
  return {
    mode: v2Mode(mode),
    series: converted,
    sideMode: value.sideMode,
    sideOrder: value.sideOrder,
    sideRecoverySeconds,
    cadenceBeepIntervalSeconds,
    countdownSeconds,
    endSeconds,
  };
}

/**
 * Copie figée de l'adaptateur historique de PRE-3 (lignes sans JSON) :
 * Régime identiques, « Un côté après l'autre », Bip 0, Compte à rebours et
 * Fin 0, N = max(`series_count`, 1) ; cas (f) et (h) pour les scalaires.
 */
function fromScalars(source: Migration010SourceRow): V2Parameters {
  if (typeof source.execution_mode !== "string" || !LEGACY_MODES.includes(source.execution_mode)) {
    return unreadable("unknown mode");
  }
  const mode = source.execution_mode as LegacyExecutionMode;
  let count = 1;
  if (source.series_count !== null && source.series_count !== undefined) {
    if (typeof source.series_count !== "number" || !Number.isInteger(source.series_count)) {
      return unreadable("series_count not an integer");
    }
    // Q28 : un N négatif est illisible ; 0 reste lu comme 1 (adaptateur historique).
    if (source.series_count < 0) {
      return unreadable("series_count negative");
    }
    count = Math.max(source.series_count, 1);
  }
  // Q28 : toute colonne de cible renseignée, active ou non (les deux pour l'ancien
  // mode à l'échec), est classée : négative ou non entière → illisible.
  for (const [field, value] of [
    ["duration_seconds", source.duration_seconds],
    ["repetition_count", source.repetition_count],
  ] as const) {
    if (value !== null && value !== undefined) {
      nonNegativeInteger(value, field);
    }
  }
  const rawTarget =
    mode === "DURATION" ? source.duration_seconds : mode === "REPETITIONS" ? source.repetition_count : null;
  const sideMode = source.side_mode === null || source.side_mode === undefined ? "UNILATERAL" : source.side_mode;
  if (typeof sideMode !== "string" || !SIDE_MODES.includes(sideMode)) {
    return unreadable("unknown side mode");
  }
  return {
    mode: v2Mode(mode),
    series: {
      kind: "UNIFORM",
      count,
      target: target(rawTarget, mode),
      pauseSeconds: nonNegativeInteger(source.pause_seconds, "pause_seconds"),
    },
    sideMode,
    sideOrder: "BY_SIDE",
    sideRecoverySeconds:
      source.side_recovery_seconds === undefined || source.side_recovery_seconds === null
        ? 0
        : nonNegativeInteger(source.side_recovery_seconds, "side_recovery_seconds"),
    cadenceBeepIntervalSeconds: 0,
    countdownSeconds: 0,
    endSeconds: 0,
  };
}

function encodeTarget(value: V2Target): Record<string, unknown> {
  return value.kind === "NUMBER" ? { kind: "NUMBER", value: value.value } : { kind: value.kind };
}

/** Forme v2 figée (AD-3) : mêmes clés et même ordre que le sérialiseur v1, sans espace. */
function serialize(parameters: V2Parameters): string {
  const series =
    parameters.series.kind === "UNIFORM"
      ? {
          kind: "UNIFORM",
          count: parameters.series.count,
          target: encodeTarget(parameters.series.target),
          pauseSeconds: parameters.series.pauseSeconds,
        }
      : {
          kind: "VARIABLE",
          rows: parameters.series.rows.map((item) => ({ target: encodeTarget(item.target), pauseSeconds: item.pauseSeconds })),
        };
  return JSON.stringify({
    version: 2,
    mode: parameters.mode,
    series,
    sideMode: parameters.sideMode,
    sideOrder: parameters.sideOrder,
    sideRecoverySeconds: parameters.sideRecoverySeconds,
    cadenceBeepIntervalSeconds: parameters.cadenceBeepIntervalSeconds,
    countdownSeconds: parameters.countdownSeconds,
    endSeconds: parameters.endSeconds,
  });
}

/**
 * Classe et convertit UNE ligne historique (étape 1). `activity` active le cas
 * (g) : une Copie en Séance dont la projection scalaire violerait le nouveau
 * CHECK d'`activities` est illisible (P45) ; une Définition, sans CHECK
 * composite, ne l'est jamais pour cette raison.
 */
export function classifyMigration010Row(source: Migration010SourceRow, activity: boolean): Migration010Conversion {
  try {
    const json = source.execution_parameters;
    let parameters: V2Parameters;
    if (json === null || json === undefined) {
      parameters = fromScalars(source);
    } else if (typeof json === "string") {
      parameters = fromV1Json(json);
    } else {
      return unreadable("execution_parameters not a text");
    }
    // Projection scalaire unique (AD-3) : première ligne effective, jamais la
    // Cible numérique suivante.
    const first = parameters.series.kind === "UNIFORM" ? parameters.series : parameters.series.rows[0]!;
    const firstValue = first.target.kind === "NUMBER" ? first.target.value : null;
    const seriesCount = parameters.series.kind === "UNIFORM" ? parameters.series.count : parameters.series.rows.length;
    const durationSeconds = parameters.mode === "DURATION" ? firstValue : null;
    const repetitionCount = parameters.mode === "REPETITIONS" ? firstValue : null;
    if (activity) {
      const durationViolates =
        durationSeconds !== null && (durationSeconds < CHECK_DURATION_MIN || durationSeconds > CHECK_DURATION_MAX);
      if (durationViolates || first.pauseSeconds > CHECK_PAUSE_MAX) {
        return unreadable("projection violates the activities CHECK");
      }
    }
    return {
      readable: true,
      json: serialize(parameters),
      executionMode: parameters.mode,
      durationSeconds,
      repetitionCount,
      seriesCount,
      pauseSeconds: first.pauseSeconds,
      sideMode: parameters.sideMode,
      sideRecoverySeconds: parameters.sideRecoverySeconds,
    };
  } catch (error) {
    if (error instanceof Unreadable) {
      return { readable: false, reason: error.message };
    }
    throw error;
  }
}

/** Erreur structurelle de `migration010` : annulation complète (H6). */
export class Migration010StructuralError extends Error {
  constructor(message: string) {
    super(`migration010: ${message}`);
    this.name = "Migration010StructuralError";
  }
}

async function columnsOf(transaction: Database, table: string): Promise<string[]> {
  const rows = await transaction.getAllAsync<{ name: string }>(
    "SELECT name FROM pragma_table_info(?) ORDER BY cid",
    [table],
  );
  return rows.map((item) => item.name);
}

async function assertExpectedSchema(transaction: Database): Promise<void> {
  const expectations: readonly [string, readonly string[]][] = [
    ["activities", EXPECTED_ACTIVITIES_COLUMNS],
    ["activity_body_zones", EXPECTED_ACTIVITY_BODY_ZONES_COLUMNS],
    ["session_activity_media", EXPECTED_SESSION_ACTIVITY_MEDIA_COLUMNS],
  ];
  for (const [table, expected] of expectations) {
    const actual = await columnsOf(transaction, table);
    if (actual.join(",") !== expected.join(",")) {
      throw new Migration010StructuralError(`unexpected schema for ${table}`);
    }
  }
  const references = await transaction.getAllAsync<{ name: string }>(
    `SELECT DISTINCT master.name AS name
     FROM sqlite_master AS master
     JOIN pragma_foreign_key_list(master.name) AS reference
     WHERE master.type = 'table' AND reference."table" = 'activities'`,
  );
  const unexpected = references.map((item) => item.name).filter((name) => !ACTIVITY_CHILD_TABLES.includes(name));
  if (unexpected.length > 0) {
    throw new Migration010StructuralError(`unexpected foreign key to activities from ${unexpected.join(", ")}`);
  }
}

type DefinitionSourceRow = Migration010SourceRow & { readonly id: string };
type ActivitySourceRow = Migration010SourceRow & {
  readonly id: string;
  readonly session_id: string;
  readonly structural_position: string;
  readonly position: number;
};

/** Nouveau CHECK composite d'`activities` (AD-4) : bornes de 004 à l'identique, deux Modes, cible scalaire NULL admise. */
const ACTIVITIES_V10_DDL = `
CREATE TABLE activities_v10 (
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
)`;

/** Schéma de `activity_body_zones` tel que posé par `migration008` (repris à l'identique). */
const ACTIVITY_BODY_ZONES_DDL = `
CREATE TABLE activity_body_zones (
  activity_id TEXT NOT NULL REFERENCES activities(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  body_zone_id TEXT NOT NULL REFERENCES body_zones(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  PRIMARY KEY (activity_id, body_zone_id)
)`;

/** Schéma de `session_activity_media` tel que posé par `migration009` (repris à l'identique). */
const SESSION_ACTIVITY_MEDIA_DDL = `
CREATE TABLE session_activity_media (
  id TEXT PRIMARY KEY NOT NULL,
  activity_id TEXT NOT NULL REFERENCES activities(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  asset_id TEXT NOT NULL REFERENCES media_assets(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  position INTEGER NOT NULL CHECK (position >= 0),
  UNIQUE (activity_id, position)
)`;

/** Schéma exact d'`migration_notices` (AD-12). */
export const MIGRATION_NOTICES_DDL = `
CREATE TABLE migration_notices (
  id INTEGER PRIMARY KEY,
  kind TEXT NOT NULL,
  count INTEGER NOT NULL CHECK (count >= 1),
  created_at TEXT NOT NULL,
  acknowledged_at TEXT
)`;

/** Ligne de `PRAGMA foreign_key_check`. */
type ForeignKeyViolation = { readonly table: string; readonly rowid: number | null; readonly parent: string; readonly fkid: number };

/** Clé d'une violation : table, rowid, parent, fkid (story 1.4, report E7). */
function violationKey(violation: ForeignKeyViolation): string {
  return `${violation.table}\u0000${String(violation.rowid)}\u0000${violation.parent}\u0000${violation.fkid}`;
}

async function count(transaction: Database, table: string): Promise<number> {
  const result = await transaction.getFirstAsync<{ count: number }>(`SELECT COUNT(*) AS count FROM ${table}`);
  return result?.count ?? 0;
}

/**
 * Applique `migration010` dans la transaction fournie. `now` fournit la date
 * ISO 8601 UTC de l'avis (format de `Date.prototype.toISOString()`).
 */
export async function applyMigration010(
  transaction: Database,
  now: () => string = () => new Date().toISOString(),
): Promise<void> {
  await assertExpectedSchema(transaction);
  // Story 1.4 (report E7) : relevé global des violations PRÉEXISTANTES, avant
  // toute écriture ; comparé au relevé final (étape 5).
  const violationsBefore = new Set(
    (await transaction.getAllAsync<ForeignKeyViolation>("PRAGMA foreign_key_check")).map(violationKey),
  );

  // --- 1. Lecture et classement (JavaScript, avant toute écriture) --------
  const definitions = await transaction.getAllAsync<DefinitionSourceRow>(
    `SELECT id, execution_mode, duration_seconds, repetition_count, series_count, pause_seconds,
            side_mode, side_recovery_seconds, execution_parameters
     FROM activity_definitions ORDER BY rowid`,
  );
  const activities = await transaction.getAllAsync<ActivitySourceRow>(
    `SELECT id, session_id, structural_position, position, execution_mode, duration_seconds,
            repetition_count, series_count, pause_seconds, side_mode, execution_parameters
     FROM activities WHERE type = 'EXERCISE' ORDER BY rowid`,
  );
  const definitionConversions = definitions.map((source) => ({ source, conversion: classifyMigration010Row(source, false) }));
  const activityConversions = activities.map((source) => ({ source, conversion: classifyMigration010Row(source, true) }));
  const droppedDefinitions = definitionConversions.filter((item) => !item.conversion.readable).map((item) => item.source);
  const droppedActivities = activityConversions.filter((item) => !item.conversion.readable).map((item) => item.source);

  // --- 2. Écart des illisibles et de leurs liens (Q19) ---------------------
  for (const definition of droppedDefinitions) {
    await transaction.runAsync("DELETE FROM activity_definition_body_zones WHERE activity_definition_id = ?", [definition.id]);
    await transaction.runAsync("DELETE FROM activity_media WHERE activity_definition_id = ?", [definition.id]);
    await transaction.runAsync("DELETE FROM activity_definitions WHERE id = ?", [definition.id]);
  }
  for (const activity of droppedActivities) {
    await transaction.runAsync("DELETE FROM activity_body_zones WHERE activity_id = ?", [activity.id]);
    await transaction.runAsync("DELETE FROM session_activity_media WHERE activity_id = ?", [activity.id]);
    await transaction.runAsync("DELETE FROM activities WHERE id = ?", [activity.id]);
  }

  // --- 3. Renumérotation contiguë des zones touchées (plage haute de 004) ---
  const touchedZones = new Set(droppedActivities.map((activity) => `${activity.session_id}\u0000${activity.structural_position}`));
  for (const zone of touchedZones) {
    const [sessionId, structuralPosition] = zone.split("\u0000") as [string, string];
    const remaining = await transaction.getAllAsync<{ id: string }>(
      "SELECT id FROM activities WHERE session_id = ? AND structural_position = ? ORDER BY position ASC",
      [sessionId, structuralPosition],
    );
    for (const [index, item] of remaining.entries()) {
      await transaction.runAsync("UPDATE activities SET position = ? WHERE id = ?", [POSITION_STAGING_OFFSET + index, item.id]);
    }
    for (const [index, item] of remaining.entries()) {
      await transaction.runAsync("UPDATE activities SET position = ? WHERE id = ?", [index, item.id]);
    }
  }

  // --- 4. Définitions : v2 et scalaires projetés (aucune reconstruction) ----
  for (const { source, conversion } of definitionConversions) {
    if (!conversion.readable) {
      continue;
    }
    await transaction.runAsync(
      `UPDATE activity_definitions SET
         execution_parameters = ?, execution_mode = ?, duration_seconds = ?, repetition_count = ?,
         series_count = ?, pause_seconds = ?, side_mode = ?, side_recovery_seconds = ?
       WHERE id = ?`,
      [
        conversion.json,
        conversion.executionMode,
        conversion.durationSeconds,
        conversion.repetitionCount,
        conversion.seriesCount,
        conversion.pauseSeconds,
        conversion.sideMode,
        conversion.sideRecoverySeconds,
        source.id,
      ],
    );
  }

  // --- 5. Reconstruction d'`activities` (motif 003/004) ---------------------
  await transaction.runAsync("PRAGMA defer_foreign_keys = ON");
  await transaction.runAsync(
    `CREATE TABLE activities_v10_conversion (
       id TEXT PRIMARY KEY NOT NULL,
       execution_mode TEXT NOT NULL,
       duration_seconds INTEGER,
       repetition_count INTEGER,
       series_count INTEGER NOT NULL,
       pause_seconds INTEGER NOT NULL,
       side_mode TEXT NOT NULL,
       execution_parameters TEXT NOT NULL
     )`,
  );
  for (const { source, conversion } of activityConversions) {
    if (!conversion.readable) {
      continue;
    }
    await transaction.runAsync(
      `INSERT INTO activities_v10_conversion (
         id, execution_mode, duration_seconds, repetition_count, series_count, pause_seconds,
         side_mode, execution_parameters
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        source.id,
        conversion.executionMode,
        conversion.durationSeconds,
        conversion.repetitionCount,
        conversion.seriesCount,
        conversion.pauseSeconds,
        conversion.sideMode,
        conversion.json,
      ],
    );
  }

  const bodyZonesBefore = await count(transaction, "activity_body_zones");
  const mediaLinksBefore = await count(transaction, "session_activity_media");

  await transaction.runAsync(
    "CREATE TABLE activity_body_zones_v10_backup (activity_id TEXT NOT NULL, body_zone_id TEXT NOT NULL)",
  );
  await transaction.runAsync(
    "INSERT INTO activity_body_zones_v10_backup (activity_id, body_zone_id) SELECT activity_id, body_zone_id FROM activity_body_zones",
  );
  await transaction.runAsync(
    `CREATE TABLE session_activity_media_v10_backup (
       id TEXT NOT NULL, activity_id TEXT NOT NULL, asset_id TEXT NOT NULL, position INTEGER NOT NULL
     )`,
  );
  await transaction.runAsync(
    `INSERT INTO session_activity_media_v10_backup (id, activity_id, asset_id, position)
     SELECT id, activity_id, asset_id, position FROM session_activity_media`,
  );

  await transaction.runAsync(ACTIVITIES_V10_DDL);
  // Les valeurs converties sont écrites PAR LA RECOPIE (jamais par un UPDATE
  // préalable, que le CHECK de 004 rejetterait) ; les lignes `RECOVERY`
  // restent inchangées.
  await transaction.runAsync(
    `INSERT INTO activities_v10 (
       id, session_id, cycle_id, tour_id, type, structural_position, position, name,
       execution_mode, duration_seconds, repetition_count, series_count, pause_seconds,
       post_activity_recovery_seconds, instruction, created_at, updated_at, side_mode,
       execution_parameters, category_id
     )
     SELECT
       a.id, a.session_id, a.cycle_id, a.tour_id, a.type, a.structural_position, a.position, a.name,
       CASE WHEN c.id IS NULL THEN a.execution_mode ELSE c.execution_mode END,
       CASE WHEN c.id IS NULL THEN a.duration_seconds ELSE c.duration_seconds END,
       CASE WHEN c.id IS NULL THEN a.repetition_count ELSE c.repetition_count END,
       CASE WHEN c.id IS NULL THEN a.series_count ELSE c.series_count END,
       CASE WHEN c.id IS NULL THEN a.pause_seconds ELSE c.pause_seconds END,
       a.post_activity_recovery_seconds, a.instruction, a.created_at, a.updated_at,
       CASE WHEN c.id IS NULL THEN a.side_mode ELSE c.side_mode END,
       CASE WHEN c.id IS NULL THEN a.execution_parameters ELSE c.execution_parameters END,
       a.category_id
     FROM activities AS a
     LEFT JOIN activities_v10_conversion AS c ON c.id = a.id
     ORDER BY a.rowid`,
  );

  // `DROP TABLE activities` déclencherait un DELETE implicite et ses cascades
  // même en mode différé : les tables filles sont sauvegardées, supprimées,
  // puis recréées à l'identique et restaurées.
  await transaction.runAsync("DROP TABLE session_activity_media");
  await transaction.runAsync("DROP TABLE activity_body_zones");
  await transaction.runAsync("DROP TABLE activities");
  await transaction.runAsync("ALTER TABLE activities_v10 RENAME TO activities");
  await transaction.runAsync(
    "CREATE INDEX activities_session_position_idx\nON activities(session_id, structural_position, position)",
  );
  await transaction.runAsync(ACTIVITY_BODY_ZONES_DDL);
  await transaction.runAsync(
    "INSERT INTO activity_body_zones (activity_id, body_zone_id) SELECT activity_id, body_zone_id FROM activity_body_zones_v10_backup",
  );
  await transaction.runAsync(SESSION_ACTIVITY_MEDIA_DDL);
  await transaction.runAsync(
    `INSERT INTO session_activity_media (id, activity_id, asset_id, position)
     SELECT id, activity_id, asset_id, position FROM session_activity_media_v10_backup`,
  );
  await transaction.runAsync(
    "CREATE INDEX session_activity_media_activity_idx\nON session_activity_media(activity_id, position)",
  );
  await transaction.runAsync("CREATE INDEX session_activity_media_asset_idx\nON session_activity_media(asset_id)");
  await transaction.runAsync("DROP TABLE activity_body_zones_v10_backup");
  await transaction.runAsync("DROP TABLE session_activity_media_v10_backup");
  await transaction.runAsync("DROP TABLE activities_v10_conversion");

  if (
    (await count(transaction, "activity_body_zones")) !== bodyZonesBefore ||
    (await count(transaction, "session_activity_media")) !== mediaLinksBefore
  ) {
    throw new Migration010StructuralError("child table counts differ after the rebuild");
  }
  // Story 1.4 (report E7) — contrôle des clés étrangères en deux volets.
  // (1) STRICT sur les tables reconstruites : `foreign_key_check(activities)`
  // contrôle les clés SORTANTES d'`activities` ; ses deux tables filles sont
  // les seules à la référencer (garanti par `assertExpectedSchema`) et sont
  // contrôlées chacune. Toute violation, même préexistante, y est une erreur
  // structurelle (Q19).
  for (const table of ["activities", ...ACTIVITY_CHILD_TABLES]) {
    const violations = await transaction.getAllAsync(`PRAGMA foreign_key_check(${table})`);
    if (violations.length > 0) {
      throw new Migration010StructuralError(`foreign_key_check is not empty for ${table}`);
    }
  }
  // (2) Tables NON reconstruites : une violation préexistante sans rapport
  // avec PRE-4 (par exemple `activity_media` vers un asset absent) est
  // tolérée et laissée intacte — elle bloquait auparavant la migration à
  // chaque démarrage ; toute violation absente du relevé initial est une
  // erreur structurelle. Démontré par `preservation.story14.test.ts`.
  const newViolations = (await transaction.getAllAsync<ForeignKeyViolation>("PRAGMA foreign_key_check")).filter(
    (violation) => !violationsBefore.has(violationKey(violation)),
  );
  if (newViolations.length > 0) {
    throw new Migration010StructuralError(
      `new foreign key violation in ${[...new Set(newViolations.map((violation) => violation.table))].join(", ")}`,
    );
  }

  // --- 6. Avis de migration (AD-12) -------------------------------------------
  await transaction.runAsync(MIGRATION_NOTICES_DDL);
  const dropped = droppedDefinitions.length + droppedActivities.length;
  if (dropped > 0) {
    await transaction.runAsync(
      "INSERT INTO migration_notices (kind, count, created_at, acknowledged_at) VALUES (?, ?, ?, NULL)",
      [MIGRATION_NOTICE_UNREADABLE_EXERCISES_DROPPED, dropped, now()],
    );
  }
}
