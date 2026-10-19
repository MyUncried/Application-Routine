/**
 * PRE-4 (story 1.1, AD-3) — lecteur des formes ANCIENNES des paramètres
 * d'exécution : JSON v1 de PRE-3, ou scalaires seuls d'un objet antérieur à
 * PRE-3. Seul porteur du troisième mode historique dans le domaine
 * (`LegacyExecutionMode`, AD-1) ; n'est importé que par les tests de parité
 * et le lecteur d'Instantané v1 (garde de cantonnement, AC4).
 *
 * Il applique le prédicat d'illisibilité fermé de `migration010` (AD-4,
 * cas (a) à (f) et (h) ; le cas (g), propre au CHECK d'`activities`, reste à
 * la migration) : une donnée illisible lève `ExecutionParametersDataError`.
 * Une donnée lisible est convertie sans bornage ni arrondi :
 *
 * - ancien mode « à l'échec » → Répétitions, toutes les Cibles `FAILURE`
 *   (FR-18-10, FR-18-13) ;
 * - Durée ou Répétitions : Cible absente, `null` ou 0 → `UNSET` (H7) ; toute
 *   autre valeur entière positive → `NUMBER` de cette valeur exacte, hors
 *   plage comprise (Q15, Q21, H25) — jamais `FAILURE` ;
 * - scalaires seuls : adaptateur historique (Régime identiques, « Un côté
 *   après l'autre », Bip 0, Compte à rebours et Fin 0, N = max(N, 1)).
 *
 * `migration010` en embarque une copie figée (elle n'importe pas ce module).
 */

import { isSideMode, type SideMode } from "@/domain/sessions/sideMode";

import {
  EXECUTION_PARAMETERS_VERSION,
  ExecutionParametersDataError,
  SIDE_ORDERS,
  type ExecutionMode,
  type ExecutionParameters,
  type ExecutionSeries,
  type SeriesRow,
  type SeriesTarget,
  type SideOrder,
} from "./ExecutionParameters";

/** Modes historiques des formes v1 et des colonnes SQL (AD-1). */
export type LegacyExecutionMode = "DURATION" | "REPETITIONS" | "TO_FAILURE";

const LEGACY_EXECUTION_MODES: readonly LegacyExecutionMode[] = ["DURATION", "REPETITIONS", "TO_FAILURE"];

/** Scalaires historiques d'un objet sans JSON. */
export type LegacyExecutionScalars = {
  readonly executionMode: LegacyExecutionMode;
  readonly durationSeconds: number | null;
  readonly repetitionCount: number | null;
  readonly seriesCount: number | null;
  readonly pauseSeconds: number;
  readonly sideMode?: SideMode;
  /** Absent d'une copie de Séance (aucune colonne) : l'absence reste explicite, 0. */
  readonly sideRecoverySeconds?: number;
};

function unreadable(reason: string): never {
  throw new ExecutionParametersDataError(`Unreadable legacy execution parameters: ${reason}.`);
}

/** Nombre attendu : un autre type est impossible (c3) ; négatif ou non entier : (h), Q28. */
function readNonNegativeInteger(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return unreadable(`${field} is not a number`);
  }
  if (!Number.isInteger(value) || value < 0) {
    return unreadable(`${field} is negative or not an integer`);
  }
  return value;
}

/** Cible historique d'un mode chronométré ou compté : absente, `null` ou 0 → `UNSET` (H7). */
function convertTarget(value: unknown, mode: LegacyExecutionMode): SeriesTarget {
  if (value === undefined || value === null) {
    return mode === "TO_FAILURE" ? { kind: "FAILURE" } : { kind: "UNSET" };
  }
  const number = readNonNegativeInteger(value, "target");
  if (mode === "TO_FAILURE") {
    return { kind: "FAILURE" };
  }
  return number === 0 ? { kind: "UNSET" } : { kind: "NUMBER", value: number };
}

function convertRow(value: unknown, mode: LegacyExecutionMode): SeriesRow {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return unreadable("series row is not an object");
  }
  const row = value as { target?: unknown; pauseSeconds?: unknown };
  if (!("pauseSeconds" in row)) {
    return unreadable("series pause is missing");
  }
  const target = convertTarget(row.target, mode);
  return { target, pauseSeconds: readNonNegativeInteger(row.pauseSeconds, "pauseSeconds"), loadKg: 0 };
}

function convertedMode(mode: LegacyExecutionMode): ExecutionMode {
  return mode === "TO_FAILURE" ? "REPETITIONS" : mode;
}

/** Options de lecture ; par défaut, le prédicat d'illisibilité de `migration010` s'applique à l'identique. */
export type ReadV1Options = {
  /**
   * Instantané v1 seulement (story 1.3, AC9 ; ch. 09 « absent dans ancien
   * snapshot = non cadencé ») : une clé `cadenceBeepIntervalSeconds` absente
   * ou `null` est lue comme un Bip 0 au lieu d'être illisible. Les données du Catalogue
   * et des Séances gardent le prédicat de `migration010` (parité AD-10).
   */
  readonly absentBeepAsZero?: boolean;
};

function readV1Json(json: string, options: ReadV1Options): ExecutionParameters {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return unreadable("JSON is malformed");
  }
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return unreadable("root is not an object");
  }
  const parsed = raw as Record<string, unknown>;
  const value: Record<string, unknown> =
    options.absentBeepAsZero === true &&
    (!("cadenceBeepIntervalSeconds" in parsed) || parsed.cadenceBeepIntervalSeconds === null)
      ? { ...parsed, cadenceBeepIntervalSeconds: 0 }
      : parsed;
  const required = [
    "version",
    "mode",
    "series",
    "sideMode",
    "sideOrder",
    "sideRecoverySeconds",
    "cadenceBeepIntervalSeconds",
    "countdownSeconds",
    "endSeconds",
  ];
  for (const key of required) {
    if (!(key in value)) {
      return unreadable(`${key} is missing`);
    }
  }
  if (value.version !== 1) {
    return unreadable(`unknown version ${String(value.version)}`);
  }
  const mode = value.mode as LegacyExecutionMode;
  if (!LEGACY_EXECUTION_MODES.includes(mode)) {
    return unreadable("unknown mode");
  }
  if (!isSideMode(value.sideMode) || !SIDE_ORDERS.includes(value.sideOrder as SideOrder)) {
    return unreadable("unknown side mode or order");
  }
  const sideRecoverySeconds = readNonNegativeInteger(value.sideRecoverySeconds, "sideRecoverySeconds");
  const cadenceBeepIntervalSeconds = readNonNegativeInteger(value.cadenceBeepIntervalSeconds, "cadenceBeepIntervalSeconds");
  const countdownSeconds = readNonNegativeInteger(value.countdownSeconds, "countdownSeconds");
  const endSeconds = readNonNegativeInteger(value.endSeconds, "endSeconds");

  const seriesValue = value.series;
  if (typeof seriesValue !== "object" || seriesValue === null || Array.isArray(seriesValue)) {
    return unreadable("series is not an object");
  }
  const seriesRecord = seriesValue as Record<string, unknown>;
  let series: ExecutionSeries;
  if (seriesRecord.kind === "UNIFORM") {
    if (!("count" in seriesRecord) || !("pauseSeconds" in seriesRecord)) {
      return unreadable("uniform series key is missing");
    }
    const count = seriesRecord.count;
    if (typeof count !== "number" || !Number.isFinite(count)) {
      return unreadable("series count is not a number");
    }
    if (!Number.isInteger(count)) {
      return unreadable("series count is not an integer");
    }
    if (count < 1) {
      return unreadable("series count is lower than 1");
    }
    const row = convertRow({ target: seriesRecord.target, pauseSeconds: seriesRecord.pauseSeconds }, mode);
    series = { kind: "UNIFORM", count, target: row.target, pauseSeconds: row.pauseSeconds, loadKg: 0, workPhases: [] };
  } else if (seriesRecord.kind === "VARIABLE") {
    if (!Array.isArray(seriesRecord.rows) || seriesRecord.rows.length === 0) {
      return unreadable("variable rows are missing or empty");
    }
    series = { kind: "VARIABLE", rows: seriesRecord.rows.map((row) => convertRow(row, mode)) };
  } else {
    return unreadable("unknown series kind");
  }
  return {
    version: EXECUTION_PARAMETERS_VERSION,
    mode: convertedMode(mode),
    series,
    sideMode: value.sideMode,
    sideOrder: value.sideOrder as SideOrder,
    sideRecoverySeconds,
    cadenceBeepIntervalSeconds,
    countdownSeconds,
    endSeconds,
    loadEnabled: false,
  };
}

function readV1Scalars(scalars: LegacyExecutionScalars): ExecutionParameters {
  const mode = scalars.executionMode;
  if (!LEGACY_EXECUTION_MODES.includes(mode)) {
    return unreadable("unknown mode");
  }
  let count = 1;
  if (scalars.seriesCount !== null && scalars.seriesCount !== undefined) {
    if (typeof scalars.seriesCount !== "number" || !Number.isInteger(scalars.seriesCount)) {
      return unreadable("series count is not an integer");
    }
    // Q28 : un N négatif rend la donnée illisible ; 0 reste lu comme 1 (adaptateur historique, AC3).
    if (scalars.seriesCount < 0) {
      return unreadable("series count is negative");
    }
    count = Math.max(scalars.seriesCount, 1);
  }
  // Q28 : toute colonne de cible renseignée, active ou non, est contrôlée (négative ou non entière → illisible).
  for (const [field, value] of [
    ["durationSeconds", scalars.durationSeconds],
    ["repetitionCount", scalars.repetitionCount],
  ] as const) {
    if (value !== null && value !== undefined) {
      readNonNegativeInteger(value, field);
    }
  }
  const rawTarget =
    mode === "DURATION" ? scalars.durationSeconds : mode === "REPETITIONS" ? scalars.repetitionCount : null;
  const target = convertTarget(rawTarget, mode);
  const pauseSeconds = readNonNegativeInteger(scalars.pauseSeconds, "pauseSeconds");
  const sideMode = scalars.sideMode ?? "UNILATERAL";
  if (!isSideMode(sideMode)) {
    return unreadable("unknown side mode");
  }
  const sideRecoverySeconds =
    scalars.sideRecoverySeconds === undefined ? 0 : readNonNegativeInteger(scalars.sideRecoverySeconds, "sideRecoverySeconds");
  return {
    version: EXECUTION_PARAMETERS_VERSION,
    mode: convertedMode(mode),
    series: { kind: "UNIFORM", count, target, pauseSeconds, loadKg: 0, workPhases: [] },
    sideMode,
    sideOrder: "BY_SIDE",
    sideRecoverySeconds,
    cadenceBeepIntervalSeconds: 0,
    countdownSeconds: 0,
    endSeconds: 0,
    loadEnabled: false,
  };
}

/**
 * Lecture d'une forme ANCIENNE (AD-3) : JSON v1 (chaîne) ou scalaires seuls.
 * Illisible → `ExecutionParametersDataError`.
 */
export function readV1(source: string | LegacyExecutionScalars, options: ReadV1Options = {}): ExecutionParameters {
  return typeof source === "string" ? readV1Json(source, options) : readV1Scalars(source);
}
