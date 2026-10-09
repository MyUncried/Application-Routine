/**
 * PRE-3 — représentation canonique versionnée des paramètres d'exécution
 * d'un Exercice (`SPECIFICATION-PARAMETRES-MODALE-v13.md`, Bip v2,
 * `schema-et-ecritures.md` §« Représentation canonique »).
 *
 * Une seule source de vérité pour la définition Catalogue ET l'occurrence de
 * Séance : le mode, l'état uniforme/variable EXPLICITE (jamais déduit de
 * l'égalité des valeurs), N par côté, la collection ordonnée cible/Pause,
 * la direction, l'ordre des côtés, la Pause entre les côtés, le bip commun,
 * le Compte à rebours et la Fin propres. La Récupération (R) n'en fait
 * JAMAIS partie : elle reste portée par l'occurrence.
 *
 * Fonctions pures — sans React, SQLite, Expo, Profil implicite ni horloge.
 * Les scalaires historiques (`durationSeconds`, `seriesCount`…) ne sont que
 * des PROJECTIONS dérivées de cette représentation (`projectLegacyScalars`),
 * jamais une seconde écriture indépendante.
 */

import type { ExerciseExecutionMode } from "@/domain/sessions/Session";
import { isSideMode, type SideMode } from "@/domain/sessions/sideMode";

export const EXECUTION_PARAMETERS_VERSION = 1 as const;

export type ExecutionMode = ExerciseExecutionMode;
export type SideOrder = "BY_SIDE" | "BY_SERIES";

export const EXECUTION_MODES: readonly ExecutionMode[] = ["DURATION", "REPETITIONS", "TO_FAILURE"];
export const SIDE_ORDERS: readonly SideOrder[] = ["BY_SIDE", "BY_SERIES"];

/** Bornes PRE-3 (v13 §6, Bip v2 §1) — appliquées aux NOUVELLES saisies ; une ancienne valeur hors bornes reste lue sans clamp. */
export const EXECUTION_BOUNDS = {
  seriesCount: { min: 1, max: 99 },
  durationTarget: { min: 1, max: 5999 },
  repetitionTarget: { min: 1, max: 100 },
  pauseSeconds: { min: 0, max: 300 },
  sideRecoverySeconds: { min: 0, max: 300 },
  cadenceBeepIntervalSeconds: { min: 0, max: 10 },
  countdownSeconds: { min: 0, max: 60 },
  endSeconds: { min: 0, max: 60 },
} as const;

/** Une Série : cible du mode (secondes Durée, nombre Répétitions, `null` À l'échec) et sa Pause après Série. */
export type SeriesRow = {
  readonly target: number | null;
  readonly pauseSeconds: number;
};

export type UniformSeries = {
  readonly kind: "UNIFORM";
  readonly count: number;
  readonly target: number | null;
  readonly pauseSeconds: number;
};

/** État variable explicite : la longueur de `rows` est N. Aucune valeur commune concurrente. */
export type VariableSeries = {
  readonly kind: "VARIABLE";
  readonly rows: readonly SeriesRow[];
};

export type ExecutionSeries = UniformSeries | VariableSeries;

/** Paramètres persistables, complets et valides. */
export type ExecutionParameters = {
  readonly version: typeof EXECUTION_PARAMETERS_VERSION;
  readonly mode: ExecutionMode;
  readonly series: ExecutionSeries;
  readonly sideMode: SideMode;
  readonly sideOrder: SideOrder;
  readonly sideRecoverySeconds: number;
  readonly cadenceBeepIntervalSeconds: number;
  readonly countdownSeconds: number;
  readonly endSeconds: number;
};

/**
 * Brouillon de paramètres porté par le parent (éditeur) : identique à
 * `ExecutionParameters` mais le mode et le côté peuvent rester non renseignés
 * (« — », v13 §6 « Création : mode/durée/côté non renseignés »). Jamais
 * persisté tel quel : `validateExecutionParameters` le transforme.
 */
export type ExecutionParametersInput = Omit<ExecutionParameters, "mode" | "sideMode"> & {
  readonly mode: ExecutionMode | null;
  readonly sideMode: SideMode | null;
};

export type ExecutionParametersField =
  | "version"
  | "mode"
  | "seriesCount"
  | "target"
  | "pauseSeconds"
  | "sideMode"
  | "sideOrder"
  | "sideRecoverySeconds"
  | "cadenceBeepIntervalSeconds"
  | "countdownSeconds"
  | "endSeconds";

export type ExecutionParametersViolation = {
  readonly code: "REQUIRED" | "OUT_OF_RANGE" | "NOT_INTEGER" | "UNRECOGNIZED" | "MUST_BE_ABSENT";
  readonly field: ExecutionParametersField;
  /** Rang 1-indexé de la Série concernée, pour les messages « Série n » (v13 §6). */
  readonly seriesNumber?: number;
  readonly details?: { readonly min: number; readonly max: number };
};

export type ExecutionParametersResult =
  | { readonly ok: true; readonly value: ExecutionParameters }
  | { readonly ok: false; readonly violations: readonly ExecutionParametersViolation[] };

/** Erreur de DONNÉES persistées (JSON corrompu, version inconnue) — jamais convertie silencieusement en scalaires. */
export class ExecutionParametersDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExecutionParametersDataError";
  }
}

export function seriesCountOf(parameters: { readonly series: ExecutionSeries }): number {
  return parameters.series.kind === "UNIFORM" ? parameters.series.count : parameters.series.rows.length;
}

/** Lignes effectives dans l'ordre courant (l'uniforme est développé en N lignes identiques). */
export function seriesRowsOf(parameters: { readonly series: ExecutionSeries }): readonly SeriesRow[] {
  const { series } = parameters;
  if (series.kind === "VARIABLE") {
    return series.rows;
  }
  return Array.from({ length: series.count }, () => ({
    target: series.target,
    pauseSeconds: series.pauseSeconds,
  }));
}

export function isBilateral(sideMode: SideMode | null): boolean {
  return sideMode === "RIGHT_LEFT" || sideMode === "LEFT_RIGHT";
}

/**
 * Normalisation EFFECTIVE (v13 §3, arbitrage N=1) : à N=1 l'état est
 * uniforme sur la première ligne courante et l'ordre des côtés est « Un côté
 * après l'autre », dès le brouillon et son calcul. À l'échec ne porte aucune
 * cible numérique. Les réserves temporaires du brouillon ne sont jamais ici.
 */
export function normalizeEffective<T extends ExecutionParametersInput>(parameters: T): T {
  const count = seriesCountOf(parameters);
  const failure = parameters.mode === "TO_FAILURE";
  let series = parameters.series;
  if (count === 1 && series.kind === "VARIABLE") {
    const first = series.rows[0]!;
    series = { kind: "UNIFORM", count: 1, target: first.target, pauseSeconds: first.pauseSeconds };
  }
  if (failure) {
    series =
      series.kind === "UNIFORM"
        ? { ...series, target: null }
        : { kind: "VARIABLE", rows: series.rows.map((row) => ({ ...row, target: null })) };
  }
  return {
    ...parameters,
    series,
    sideOrder: count === 1 ? "BY_SIDE" : parameters.sideOrder,
  };
}

function checkInteger(
  value: unknown,
  field: ExecutionParametersField,
  bounds: { readonly min: number; readonly max: number },
  violations: ExecutionParametersViolation[],
  seriesNumber?: number,
): boolean {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    violations.push({ code: "REQUIRED", field, ...(seriesNumber ? { seriesNumber } : {}) });
    return false;
  }
  if (!Number.isInteger(value)) {
    violations.push({ code: "NOT_INTEGER", field, ...(seriesNumber ? { seriesNumber } : {}) });
    return false;
  }
  if (value < bounds.min || value > bounds.max) {
    violations.push({
      code: "OUT_OF_RANGE",
      field,
      details: { min: bounds.min, max: bounds.max },
      ...(seriesNumber ? { seriesNumber } : {}),
    });
    return false;
  }
  return true;
}

function targetBounds(mode: ExecutionMode) {
  return mode === "DURATION" ? EXECUTION_BOUNDS.durationTarget : EXECUTION_BOUNDS.repetitionTarget;
}

/**
 * Seule validation des nouveaux paramètres (P3-04/bounds) : agrège TOUTES
 * les violations, identifie le champ et la Série, ne lève jamais. Un mode ou
 * une cible active non renseignée est une erreur (« incomplet »), jamais un
 * zéro ni un résultat temporel omis. Un côté non renseigné est normalisé
 * « Sans changement » (v13 §6). Retourne la valeur EFFECTIVE normalisée.
 */
export function validateExecutionParameters(input: ExecutionParametersInput): ExecutionParametersResult {
  const violations: ExecutionParametersViolation[] = [];

  if (input.version !== EXECUTION_PARAMETERS_VERSION) {
    violations.push({ code: "UNRECOGNIZED", field: "version" });
  }
  const mode = input.mode;
  if (mode === null) {
    violations.push({ code: "REQUIRED", field: "mode" });
  } else if (!EXECUTION_MODES.includes(mode)) {
    violations.push({ code: "UNRECOGNIZED", field: "mode" });
  }
  const sideMode = input.sideMode ?? "UNILATERAL";
  if (!isSideMode(sideMode)) {
    violations.push({ code: "UNRECOGNIZED", field: "sideMode" });
  }
  if (!SIDE_ORDERS.includes(input.sideOrder)) {
    violations.push({ code: "UNRECOGNIZED", field: "sideOrder" });
  }

  const count = seriesCountOf(input);
  checkInteger(count, "seriesCount", EXECUTION_BOUNDS.seriesCount, violations);
  const rows = seriesRowsOf(input);
  const uniform = input.series.kind === "UNIFORM";
  rows.forEach((row, index) => {
    // En uniforme, une seule cible/Pause commune : ne la signaler qu'une fois.
    if (uniform && index > 0) {
      return;
    }
    const seriesNumber = uniform ? undefined : index + 1;
    if (mode === "TO_FAILURE") {
      if (row.target !== null) {
        violations.push({ code: "MUST_BE_ABSENT", field: "target", ...(seriesNumber ? { seriesNumber } : {}) });
      }
    } else if (mode === "DURATION" || mode === "REPETITIONS") {
      if (row.target === null) {
        violations.push({ code: "REQUIRED", field: "target", ...(seriesNumber ? { seriesNumber } : {}) });
      } else {
        checkInteger(row.target, "target", targetBounds(mode), violations, seriesNumber);
      }
    }
    checkInteger(row.pauseSeconds, "pauseSeconds", EXECUTION_BOUNDS.pauseSeconds, violations, seriesNumber);
  });

  checkInteger(input.sideRecoverySeconds, "sideRecoverySeconds", EXECUTION_BOUNDS.sideRecoverySeconds, violations);
  checkInteger(
    input.cadenceBeepIntervalSeconds,
    "cadenceBeepIntervalSeconds",
    EXECUTION_BOUNDS.cadenceBeepIntervalSeconds,
    violations,
  );
  checkInteger(input.countdownSeconds, "countdownSeconds", EXECUTION_BOUNDS.countdownSeconds, violations);
  checkInteger(input.endSeconds, "endSeconds", EXECUTION_BOUNDS.endSeconds, violations);

  if (violations.length > 0) {
    return { ok: false, violations };
  }
  const normalized = normalizeEffective({ ...input, sideMode });
  return { ok: true, value: { ...normalized, mode: mode as ExecutionMode, sideMode } };
}

/** Sérialisation canonique : ordre de clés fixe, aucune phrase, aucun total, aucun segment. */
export function serializeExecutionParameters(parameters: ExecutionParameters): string {
  const series =
    parameters.series.kind === "UNIFORM"
      ? {
          kind: "UNIFORM",
          count: parameters.series.count,
          target: parameters.series.target,
          pauseSeconds: parameters.series.pauseSeconds,
        }
      : {
          kind: "VARIABLE",
          rows: parameters.series.rows.map((row) => ({ target: row.target, pauseSeconds: row.pauseSeconds })),
        };
  return JSON.stringify({
    version: parameters.version,
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

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function parseRow(value: unknown, mode: ExecutionMode): SeriesRow {
  if (typeof value !== "object" || value === null) {
    throw new ExecutionParametersDataError("Malformed series row.");
  }
  const row = value as { target?: unknown; pauseSeconds?: unknown };
  const target = row.target === null ? null : row.target;
  if (target !== null && !isNonNegativeInteger(target)) {
    throw new ExecutionParametersDataError("Malformed series target.");
  }
  if (mode === "TO_FAILURE" ? target !== null : target === null) {
    throw new ExecutionParametersDataError("Series target inconsistent with mode.");
  }
  if (!isNonNegativeInteger(row.pauseSeconds)) {
    throw new ExecutionParametersDataError("Malformed series pause.");
  }
  return { target, pauseSeconds: row.pauseSeconds };
}

/**
 * Lecture d'un JSON persisté. Corrompu ou version inconnue → erreur de
 * données explicite (P3-17/corrupt-version), JAMAIS un repli sur les
 * scalaires. Les bornes PRE-3 ne sont pas réappliquées : une donnée écrite
 * valide reste lisible telle quelle, sans clamp.
 */
export function parseExecutionParameters(json: string): ExecutionParameters {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new ExecutionParametersDataError("Execution parameters JSON is malformed.");
  }
  if (typeof raw !== "object" || raw === null) {
    throw new ExecutionParametersDataError("Execution parameters JSON is malformed.");
  }
  const value = raw as Record<string, unknown>;
  if (value.version !== EXECUTION_PARAMETERS_VERSION) {
    throw new ExecutionParametersDataError(`Unknown execution parameters version: ${String(value.version)}.`);
  }
  const mode = value.mode as ExecutionMode;
  if (!EXECUTION_MODES.includes(mode)) {
    throw new ExecutionParametersDataError("Unknown execution mode.");
  }
  if (!isSideMode(value.sideMode) || !SIDE_ORDERS.includes(value.sideOrder as SideOrder)) {
    throw new ExecutionParametersDataError("Unknown side mode or order.");
  }
  for (const key of ["sideRecoverySeconds", "cadenceBeepIntervalSeconds", "countdownSeconds", "endSeconds"]) {
    if (!isNonNegativeInteger(value[key])) {
      throw new ExecutionParametersDataError(`Malformed ${key}.`);
    }
  }
  const seriesValue = value.series as Record<string, unknown> | null;
  if (typeof seriesValue !== "object" || seriesValue === null) {
    throw new ExecutionParametersDataError("Malformed series.");
  }
  let series: ExecutionSeries;
  if (seriesValue.kind === "UNIFORM") {
    if (!isNonNegativeInteger(seriesValue.count) || seriesValue.count < 1) {
      throw new ExecutionParametersDataError("Malformed series count.");
    }
    const row = parseRow({ target: seriesValue.target, pauseSeconds: seriesValue.pauseSeconds }, mode);
    series = { kind: "UNIFORM", count: seriesValue.count, target: row.target, pauseSeconds: row.pauseSeconds };
  } else if (seriesValue.kind === "VARIABLE" && Array.isArray(seriesValue.rows) && seriesValue.rows.length >= 1) {
    series = { kind: "VARIABLE", rows: seriesValue.rows.map((row) => parseRow(row, mode)) };
  } else {
    throw new ExecutionParametersDataError("Unknown series kind.");
  }
  return {
    version: EXECUTION_PARAMETERS_VERSION,
    mode,
    series,
    sideMode: value.sideMode as SideMode,
    sideOrder: value.sideOrder as SideOrder,
    sideRecoverySeconds: value.sideRecoverySeconds as number,
    cadenceBeepIntervalSeconds: value.cadenceBeepIntervalSeconds as number,
    countdownSeconds: value.countdownSeconds as number,
    endSeconds: value.endSeconds as number,
  };
}

/** Scalaires historiques d'un objet antérieur à PRE-3. */
export type LegacyExecutionScalars = {
  readonly executionMode: ExecutionMode | null;
  readonly durationSeconds: number | null;
  readonly repetitionCount: number | null;
  readonly seriesCount: number | null;
  readonly pauseSeconds: number;
  readonly sideMode?: SideMode;
  /** Absent d'une copie de Séance historique (aucune colonne PC) : l'absence reste explicite, 0. */
  readonly sideRecoverySeconds?: number;
};

/**
 * Adaptateur conservateur d'un ancien objet sans JSON (v13 §8,
 * `schema-et-ecritures.md`) : uniforme, Un côté après l'autre, bip 0 ;
 * cibles, N, Pause et direction CONSERVÉES ; CR/Fin à la compatibilité
 * neutre 0 (proposition approuvée avec le plan) — jamais une lecture du
 * Profil courant, jamais un clamp aux nouvelles bornes.
 */
export function legacyExecutionParameters(scalars: LegacyExecutionScalars): ExecutionParameters {
  const mode: ExecutionMode = scalars.executionMode ?? "DURATION";
  const target =
    mode === "DURATION" ? scalars.durationSeconds : mode === "REPETITIONS" ? scalars.repetitionCount : null;
  return {
    version: EXECUTION_PARAMETERS_VERSION,
    mode,
    series: {
      kind: "UNIFORM",
      count: Math.max(scalars.seriesCount ?? 1, 1),
      target,
      pauseSeconds: scalars.pauseSeconds,
    },
    sideMode: scalars.sideMode ?? "UNILATERAL",
    sideOrder: "BY_SIDE",
    sideRecoverySeconds: scalars.sideRecoverySeconds ?? 0,
    cadenceBeepIntervalSeconds: 0,
    countdownSeconds: 0,
    endSeconds: 0,
  };
}

/**
 * Paramètres EFFECTIFS d'un objet (définition, occurrence, brouillon) : ses
 * paramètres canoniques s'ils existent, sinon l'adaptateur conservateur de
 * ses scalaires historiques. Seul point de résolution partagé par le calcul,
 * la phrase et l'éditeur.
 */
export function resolveExecutionParameters(
  source: LegacyExecutionScalars & { readonly executionParameters?: ExecutionParametersInput },
): ExecutionParametersInput {
  return source.executionParameters ?? legacyExecutionParameters(source);
}

export type LegacyScalarProjection = {
  readonly executionMode: ExecutionMode;
  readonly durationSeconds: number | null;
  readonly repetitionCount: number | null;
  readonly seriesCount: number;
  readonly pauseSeconds: number;
  readonly sideMode: SideMode;
  readonly sideRecoverySeconds: number;
};

/**
 * Projections d'écriture vers les colonnes historiques (CHECK SQL, anciens
 * DTO) : première cible/Pause EFFECTIVE, N, mode, direction. Jamais une
 * moyenne ni une somme ; jamais relues comme source quand le JSON existe.
 */
export function projectLegacyScalars(parameters: ExecutionParameters): LegacyScalarProjection {
  const effective = normalizeEffective(parameters);
  const first = seriesRowsOf(effective)[0]!;
  return {
    executionMode: effective.mode,
    durationSeconds: effective.mode === "DURATION" ? first.target : null,
    repetitionCount: effective.mode === "REPETITIONS" ? first.target : null,
    seriesCount: seriesCountOf(effective),
    pauseSeconds: first.pauseSeconds,
    sideMode: effective.sideMode,
    sideRecoverySeconds: effective.sideRecoverySeconds,
  };
}

/** Défauts Profil copiés au moment réel de la création (P3-10) — jamais relus ensuite. */
export type ExecutionProfileDefaults = {
  readonly countdownSeconds: number;
  readonly endSeconds: number;
};

/**
 * Brouillon de création (v13 §6) : mode et côté non renseignés, Série 1,
 * Pause 0 s, bip 0 ; CR/Fin copiés du Profil. Aucune cible inventée.
 */
export function createEmptyExecutionParameters(defaults: ExecutionProfileDefaults): ExecutionParametersInput {
  return {
    version: EXECUTION_PARAMETERS_VERSION,
    mode: null,
    series: { kind: "UNIFORM", count: 1, target: null, pauseSeconds: 0 },
    sideMode: null,
    sideOrder: "BY_SIDE",
    sideRecoverySeconds: 0,
    cadenceBeepIntervalSeconds: 0,
    countdownSeconds: defaults.countdownSeconds,
    endSeconds: defaults.endSeconds,
  };
}

/** Comparaison structurelle exacte (garde d'abandon, copie, égalité de brouillon). */
export function executionParametersEqual(
  a: ExecutionParametersInput | null | undefined,
  b: ExecutionParametersInput | null | undefined,
): boolean {
  if (!a || !b) {
    return !a && !b;
  }
  if (
    a.version !== b.version ||
    a.mode !== b.mode ||
    a.sideMode !== b.sideMode ||
    a.sideOrder !== b.sideOrder ||
    a.sideRecoverySeconds !== b.sideRecoverySeconds ||
    a.cadenceBeepIntervalSeconds !== b.cadenceBeepIntervalSeconds ||
    a.countdownSeconds !== b.countdownSeconds ||
    a.endSeconds !== b.endSeconds ||
    a.series.kind !== b.series.kind
  ) {
    return false;
  }
  if (a.series.kind === "UNIFORM" && b.series.kind === "UNIFORM") {
    return (
      a.series.count === b.series.count &&
      a.series.target === b.series.target &&
      a.series.pauseSeconds === b.series.pauseSeconds
    );
  }
  const rowsA = seriesRowsOf(a);
  const rowsB = seriesRowsOf(b);
  return (
    rowsA.length === rowsB.length &&
    rowsA.every((row, index) => row.target === rowsB[index]!.target && row.pauseSeconds === rowsB[index]!.pauseSeconds)
  );
}

/** Copie profonde immuable : aucune référence partagée entre une définition et sa copie. */
export function cloneExecutionParameters<T extends ExecutionParametersInput>(parameters: T): T {
  return {
    ...parameters,
    series:
      parameters.series.kind === "UNIFORM"
        ? { ...parameters.series }
        : { kind: "VARIABLE", rows: parameters.series.rows.map((row) => ({ ...row })) },
  };
}
