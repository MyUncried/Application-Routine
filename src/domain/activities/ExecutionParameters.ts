/**
 * PRE-4 (story 1.1, AD-1, AD-3, AD-13) — représentation canonique des
 * paramètres d'exécution d'un Exercice : DEUX Modes (`DURATION`,
 * `REPETITIONS`) et une Cible TYPÉE par Série (`SeriesTarget`).
 *
 * Ce module est le seul à définir le Mode, la Cible, leurs bornes, leur
 * validation d'enregistrement (`validateForSave`), leur sérialisation
 * (`serializeExecutionParameters`), leur lecture (`readExecutionParameters`,
 * qui délègue à `readV2` ou `readV3`) et la projection scalaire unique
 * (`projectScalars`). L'ancien troisième mode et la lecture des formes v1
 * (JSON PRE-3 ou scalaires seuls) sont cantonnés à `readV1.ts` (AD-3) et à
 * `migration010` ; aucun autre module ne les connaît.
 *
 * Une Cible n'est jamais `null` ni une valeur numérique sentinelle (AD-1) :
 * `NUMBER` porte une valeur, `FAILURE` désigne une Série menée jusqu'à
 * l'échec, `UNSET` une Cible à renseigner (brouillon, ou héritée d'une donnée
 * ancienne sans valeur, H7). La Récupération (R) n'en fait jamais partie :
 * elle reste portée par l'occurrence.
 *
 * PRE-5 (story 1.1, AD-18 à AD-20, AD-23, AD-31) : format v3. Charge
 * (`loadEnabled`, `loadKg`, FR-10) et phases (`workPhases`, FR-1) sont
 * obligatoires dans les types. `serializeExecutionParameters` est le seul
 * écrivain et `readExecutionParameters` le seul lecteur (v2 par `readV2`,
 * grammaire inchangée ; v3 par `readV3`, strict) des repositories et de
 * l'Instantané. `serializeV2` n'a plus d'appelant de production : il reste
 * réservé aux tests de parité de `migration010` (AD-10).
 *
 * PRE-7 (A1.1, D-437, D-438, MFN-02) : forme CATALOGUE v4
 * (`CatalogExecutionParameters`, couples `{ phaseId, durationSeconds | null }`
 * sans libellé), écrite par `serializeCatalogExecutionParameters` et lue par
 * `readCatalogExecutionParameters`, strict. La v3 reste la représentation
 * résolue. Une durée de phase 0 n'est plus nettoyée : elle est non renseignée
 * et bloque l'enregistrement (D-438).
 *
 * PRE-7 (A1.2, D-440) : après la migration 012, la persistance lit et écrit la
 * seule v4 — forme Catalogue pour les définitions, forme RÉSOLUE v4
 * (`serializeResolvedExecutionParameters`, `readResolvedExecutionParameters`)
 * pour les copies. `readExecutionParameters` (v2, v3) reste dans le domaine
 * (Instantané, A1.3 ; preuves des migrations historiques), sans appelant de
 * persistance.
 *
 * Fonctions pures — sans React, SQLite, Expo, Profil implicite ni horloge.
 */

import { isSideMode, type SideMode } from "@/domain/sessions/sideMode";

/** Version du JSON canonique (AD-18, FR-39) : v3, écrite par `serializeExecutionParameters`. */
export const EXECUTION_PARAMETERS_VERSION = 3 as const;

/**
 * Version figée par `migration010` (AD-4, AD-18) : `readV2` et `serializeV2`
 * comparent ou écrivent ce littéral, jamais `EXECUTION_PARAMETERS_VERSION`.
 */
export const EXECUTION_PARAMETERS_V2 = 2 as const;

/** Mode d'un Exercice : deux valeurs seulement (FR-05-01, AD-1). */
export type ExecutionMode = "DURATION" | "REPETITIONS";
export type SideOrder = "BY_SIDE" | "BY_SERIES";

export const EXECUTION_MODES: readonly ExecutionMode[] = ["DURATION", "REPETITIONS"];
export const SIDE_ORDERS: readonly SideOrder[] = ["BY_SIDE", "BY_SERIES"];

/**
 * Cible d'une Série (AD-1, FR-18-01, FR-06-02). Seul type de Cible de
 * l'application : jamais `number | null`.
 */
export type SeriesTarget =
  | { readonly kind: "NUMBER"; readonly value: number }
  | { readonly kind: "FAILURE" }
  | { readonly kind: "UNSET" };

export type SeriesTargetKind = SeriesTarget["kind"];

const TARGET_KINDS: readonly SeriesTargetKind[] = ["NUMBER", "FAILURE", "UNSET"];

export function numberTarget(value: number): SeriesTarget {
  return { kind: "NUMBER", value };
}

export function failureTarget(): SeriesTarget {
  return { kind: "FAILURE" };
}

export function unsetTarget(): SeriesTarget {
  return { kind: "UNSET" };
}

export function isNumberTarget(target: SeriesTarget): target is { readonly kind: "NUMBER"; readonly value: number } {
  return target.kind === "NUMBER";
}

/** Égalité par `kind` et `value` — jamais par référence (piège de l'ancien `===`). */
export function targetsEqual(a: SeriesTarget, b: SeriesTarget): boolean {
  if (a.kind !== b.kind) {
    return false;
  }
  return a.kind !== "NUMBER" || a.value === (b as { readonly value: number }).value;
}

function cloneTarget(target: SeriesTarget): SeriesTarget {
  return target.kind === "NUMBER" ? { kind: "NUMBER", value: target.value } : { kind: target.kind };
}

/**
 * Bornes du NIVEAU SAISIE (AD-13, FR-09-01 à FR-09-03) : appliquées aux
 * seules valeurs nouvelles ou modifiées. Une valeur héritée positive hors de
 * ces bornes, non modifiée, reste enregistrable (H25).
 */
export const EXECUTION_BOUNDS = {
  seriesCount: { min: 1, max: 99 },
  /**
   * Cible Durée : 1 s à 58 min 55 s, à la seconde. Décision Q36 de Hermann du
   * 2026-10-17 (recette iPhone) : une durée n'est pas obligatoirement un
   * multiple de 5 s. PRE-5 (D-430, AD-31, FR-45) : le minimum passe de 5 s à
   * 1 s ; c'est le seul changement de valeur, le maximum est inchangé.
   */
  durationTarget: { min: 1, max: 3535 },
  repetitionTarget: { min: 1, max: 100 },
  pauseSeconds: { min: 0, max: 300 },
  sideRecoverySeconds: { min: 0, max: 300 },
  cadenceBeepIntervalSeconds: { min: 0, max: 10 },
  countdownSeconds: { min: 0, max: 60 },
  endSeconds: { min: 0, max: 60 },
} as const;

/**
 * Nombre de Séries borné à `EXECUTION_BOUNDS.seriesCount` (1..99), tronqué à
 * l'entier — partagé par la Feuille (`setSeriesCount`) et le Circuit
 * (`setCircuitCount`, PRE-6 story 1.4).
 */
export function clampSeriesCount(count: number): number {
  return Math.min(Math.max(Math.trunc(count), EXECUTION_BOUNDS.seriesCount.min), EXECUTION_BOUNDS.seriesCount.max);
}

/**
 * Bornes du CHECK composite d'`activities` (bornes de `migration004`
 * reprises à l'identique par `migration010`, AD-4) : contrainte de la base,
 * appliquée par le repository des Séances, jamais par le niveau structurel.
 */
export const ACTIVITY_STORAGE_BOUNDS = {
  durationTarget: { min: 1, max: 5999 },
  repetitionTargetMin: 1,
  pauseSeconds: { min: 0, max: 5999 },
  postActivityRecoverySeconds: { min: 0, max: 5999 },
  seriesCountMin: 1,
} as const;

/**
 * PRE-5 (AD-20, FR-1, FR-3) — bornes des phases de l'exercice. `controlMinCount`
 * ne borne que le contrôle de la Feuille et les transitions du Brouillon
 * (D-432, QR-1), jamais la lecture ni `validateForSave` : le modèle admet une
 * seule phase (spécification des phases §2.1).
 */
export const WORK_PHASE_LIMITS = { maxCount: 6, controlMinCount: 2, labelMaxLength: 20, durationMin: 1 } as const;

/**
 * Phase de l'exercice (AD-20, FR-1) : identité entière ≥ 1, unique dans la
 * liste, persistée et conservée par le clonage ; libellé de 1 à 20 points de
 * code, non blanc ; durée entière ≥ 1 s (D-430).
 */
export type WorkPhase = {
  readonly id: number;
  readonly label: string;
  readonly durationSeconds: number;
};

/**
 * Une Série : sa Cible typée, sa Pause après Série et sa charge en kg (AD-19,
 * FR-10 ; conservée sous Sans ; 0 = aucune charge pour cette Série).
 */
export type SeriesRow = {
  readonly target: SeriesTarget;
  readonly pauseSeconds: number;
  readonly loadKg: number;
};

/**
 * Séries identiques. PRE-5 : `loadKg` est la charge commune (AD-19) et
 * `workPhases` les phases de l'exercice (AD-20 ; `[]` = « Aucune »). Une
 * série `VARIABLE` ne porte aucune phase, par construction.
 */
export type UniformSeries = {
  readonly kind: "UNIFORM";
  readonly count: number;
  readonly target: SeriesTarget;
  readonly pauseSeconds: number;
  readonly loadKg: number;
  readonly workPhases: readonly WorkPhase[];
};

/** Régime variables explicite : la longueur de `rows` est N. Aucune valeur commune concurrente. */
export type VariableSeries = {
  readonly kind: "VARIABLE";
  readonly rows: readonly SeriesRow[];
};

export type ExecutionSeries = UniformSeries | VariableSeries;

/** Paramètres complets (Mode et côté renseignés). */
export type ExecutionParameters = {
  readonly version: typeof EXECUTION_PARAMETERS_VERSION;
  readonly mode: ExecutionMode;
  readonly series: ExecutionSeries;
  readonly sideMode: SideMode;
  readonly sideOrder: SideOrder;
  readonly sideRecoverySeconds: number;
  /** Bip unique au niveau de l'Exercice, aucun Bip par Série (P22). */
  readonly cadenceBeepIntervalSeconds: number;
  readonly countdownSeconds: number;
  readonly endSeconds: number;
  /** Charge Avec / Sans (AD-19, FR-10) : distincte des valeurs, qui restent conservées sous Sans. */
  readonly loadEnabled: boolean;
};

/**
 * Brouillon de paramètres porté par l'Éditeur : le Mode et le côté peuvent
 * rester non renseignés (« — »). Jamais persisté tel quel : `validateForSave`
 * le contrôle et le normalise.
 */
export type ExecutionParametersInput = Omit<ExecutionParameters, "mode" | "sideMode"> & {
  readonly mode: ExecutionMode | null;
  readonly sideMode: SideMode | null;
};

export type ExecutionParametersField =
  | "version"
  | "mode"
  | "series"
  | "seriesCount"
  | "target"
  | "pauseSeconds"
  | "sideMode"
  | "sideOrder"
  | "sideRecoverySeconds"
  | "cadenceBeepIntervalSeconds"
  | "countdownSeconds"
  | "endSeconds"
  | "loadEnabled"
  | "loadKg"
  | "workPhases";

/** Niveau de la règle violée (AD-13) : forme et types, ou bornes de saisie. */
export type ExecutionValidationLevel = "STRUCTURE" | "INPUT";

export type ExecutionParametersViolation = {
  readonly code: "REQUIRED" | "OUT_OF_RANGE" | "NOT_INTEGER" | "UNRECOGNIZED";
  readonly field: ExecutionParametersField;
  readonly level: ExecutionValidationLevel;
  /** Rang 1-indexé de la Série concernée (Régime variables), pour signaler la cellule. */
  readonly seriesNumber?: number;
  /**
   * PRE-7 (A1.1, D-438, MFN-02) : identité de la phase dont la durée manque
   * (`REQUIRED` `workPhases`), pour signaler sa cellule ; la phase est conservée.
   */
  readonly phaseId?: number;
  readonly details?: { readonly min: number; readonly max: number; readonly step?: number };
};

export type ExecutionParametersResult =
  | { readonly ok: true; readonly value: ExecutionParameters }
  | { readonly ok: false; readonly violations: readonly ExecutionParametersViolation[] };

/** Erreur de DONNÉES persistées (NULL, JSON corrompu, version inconnue) — jamais convertie silencieusement. */
export class ExecutionParametersDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExecutionParametersDataError";
  }
}

/**
 * Refus d'enregistrement levé par un repository (défense, AD-13) quand
 * `validateForSave(params, "STORAGE")` échoue : l'entrée est invalide, aucune
 * écriture n'a lieu. Le domaine lui-même ne lève jamais : il retourne les
 * violations.
 */
export class ExecutionParametersValidationError extends Error {
  readonly violations: readonly ExecutionParametersViolation[];

  constructor(violations: readonly ExecutionParametersViolation[]) {
    super("EXECUTION_PARAMETERS_VALIDATION_FAILED");
    this.name = "ExecutionParametersValidationError";
    this.violations = violations;
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
    loadKg: series.loadKg,
  }));
}

/**
 * PRE-6 (story 1.4, AD-38, AD-39) — règle UNIQUE « le tableau suit N »,
 * partagée par la Feuille (`setSeriesCount`, P3-06) et le Circuit de Séries
 * (`circuit.ts`) :
 * - réduire : les éléments au-delà de `count` passent EN TÊTE de la réserve,
 *   dans leur ordre relatif d'origine ;
 * - augmenter : restauration d'abord depuis la tête de la réserve, puis
 *   `copyLast(dernier actif)` (`undefined` si aucun actif) ;
 * - `count` égal à la longueur : rien ne change.
 * Fonction pure : les tableaux reçus ne sont jamais modifiés ; un élément
 * restauré est rendu tel quel (à l'appelant de le copier s'il le faut).
 *
 * Contrat de `copyLast` : appelé une fois par élément AJOUTÉ, dans l'ordre,
 * et seulement après épuisement de la réserve (jamais lors d'une réduction
 * ni d'une restauration) ; il reçoit le dernier actif courant, y compris
 * l'élément qu'il vient de produire. La Feuille s'appuie sur cet ordre pour
 * attribuer ses identités (`nextId`).
 */
export function resizeWithReserve<T>(
  active: readonly T[],
  reserve: readonly T[],
  count: number,
  copyLast: (last: T | undefined) => T,
): { readonly active: readonly T[]; readonly reserve: readonly T[] } {
  if (count < active.length) {
    return { active: active.slice(0, count), reserve: [...active.slice(count), ...reserve] };
  }
  const nextActive = [...active];
  const nextReserve = [...reserve];
  while (nextActive.length < count) {
    if (nextReserve.length > 0) {
      nextActive.push(nextReserve.shift() as T);
    } else {
      nextActive.push(copyLast(nextActive[nextActive.length - 1]));
    }
  }
  return { active: nextActive, reserve: nextReserve };
}

/** Copie d'une Série sans partage d'objet (Cible comprise, AD-9). */
function copySeriesRow(row: SeriesRow): SeriesRow {
  return { ...row, target: { ...row.target } };
}

/**
 * PRE-6 (story 1.4, AD-37, AD-38) — adaptation d'une `ExecutionSeries` à N
 * par `resizeWithReserve`. Identiques : seul `count` suit N, réserve rendue
 * inchangée. Variables : lignes ramenées à N, lignes retirées en réserve,
 * restauration puis copie de la dernière ligne active (Cible, Pause, charge ;
 * objets non partagés). Le régime ne change jamais. `count` doit être déjà
 * borné par l'appelant (`EXECUTION_BOUNDS.seriesCount`).
 */
export function resizeSeriesWithReserve(
  series: ExecutionSeries,
  reserve: readonly SeriesRow[],
  count: number,
): { readonly series: ExecutionSeries; readonly reserve: readonly SeriesRow[] } {
  if (series.kind === "UNIFORM") {
    return { series: series.count === count ? series : { ...series, count }, reserve };
  }
  if (series.rows.length === count) {
    return { series, reserve };
  }
  const resized = resizeWithReserve(series.rows, reserve, count, (last) =>
    // Régime variables sans ligne (forme invalide, lue défensivement) : Série à renseigner.
    last === undefined ? { target: unsetTarget(), pauseSeconds: 0, loadKg: 0 } : copySeriesRow(last),
  );
  return { series: { kind: "VARIABLE", rows: resized.active }, reserve: resized.reserve };
}

/** Vrai si toutes les Cibles effectives sont à l'échec (gabarit « tout échec », P26). */
export function allTargetsFailure(parameters: { readonly series: ExecutionSeries }): boolean {
  return seriesRowsOf(parameters).every((row) => row.target.kind === "FAILURE");
}

/** Vrai si au moins une Cible effective est à l'échec : le total de l'Exercice est alors omis (story 1.1). */
export function hasFailureTarget(parameters: { readonly series: ExecutionSeries }): boolean {
  return seriesRowsOf(parameters).some((row) => row.target.kind === "FAILURE");
}

/** Vrai si au moins une Cible effective est à renseigner. */
export function hasUnsetTarget(parameters: { readonly series: ExecutionSeries }): boolean {
  return seriesRowsOf(parameters).some((row) => row.target.kind === "UNSET");
}

/** Condition d'arrêt dérivée (AD-23, FR-20) : jamais persistée. */
export type StopCondition = "TARGET" | "FAILURE" | "MIXED" | "NONE";

/**
 * PRE-5 (AD-23, FR-19, FR-20, QN-2) — Condition d'arrêt, seule autorité, lue
 * sur l'état EFFECTIF (N = 1 = identiques) :
 * - identiques (et Mode non renseigné) : `FAILURE` si et seulement si la Cible
 *   commune est `FAILURE`, sinon `TARGET` (une Cible `UNSET` est « À la cible,
 *   valeur à renseigner ») ;
 * - variables : les lignes `UNSET` ne sont pas comptées ; `TARGET` si les
 *   lignes renseignées sont toutes `NUMBER`, `FAILURE` si elles sont toutes à
 *   l'échec, `MIXED` sinon, `NONE` si aucune ligne n'est renseignée (« — »).
 * Aucune valeur « Mixte » ni aucun champ de condition n'est persisté.
 */
export function stopConditionOf(parameters: ExecutionParametersInput): StopCondition {
  const effective = normalizeEffective(parameters);
  if (effective.series.kind === "UNIFORM") {
    return effective.series.target.kind === "FAILURE" ? "FAILURE" : "TARGET";
  }
  // Seules les lignes renseignées comptent (QN-2) : les prédicats existants s'appliquent à elles.
  const rows = hasUnsetTarget(effective) ? effective.series.rows.filter((row) => row.target.kind !== "UNSET") : effective.series.rows;
  const filled = { series: { kind: "VARIABLE", rows } } as const;
  if (rows.length === 0) {
    return "NONE";
  }
  if (allTargetsFailure(filled)) {
    return "FAILURE";
  }
  return hasFailureTarget(filled) ? "MIXED" : "TARGET";
}

export function isBilateral(sideMode: SideMode | null): boolean {
  return sideMode === "RIGHT_LEFT" || sideMode === "LEFT_RIGHT";
}

/** Cible à l'échec, seule Cible non numérique qu'un Sélecteur de cible émet (AD-7). */
export type FailureSeriesTarget = Extract<SeriesTarget, { readonly kind: "FAILURE" }>;

/** Position d'ouverture d'un Sélecteur de cible : une valeur de la roue, ou l'option échec. */
export type SelectorOpeningPosition = Exclude<SeriesTarget, { readonly kind: "UNSET" }>;

/**
 * Story 3.4 (AD-16, FR-07-04, FR-09-05) — valeur valide la plus proche d'une Cible
 * numérique, pour la position d'ouverture d'un Sélecteur. Nom gardé d'AD-16, mais il
 * n'y a plus de grille : depuis Q36 (Hermann, 2026-10-17), c'est un simple BORNAGE,
 * 1..3535 s en Durée (minimum de 1 s, D-430), 1..100 en Répétitions, sans multiple
 * de 5 (Q21 adaptée : 5999 → 3535, 0 → 1, 7 → 7, 150 → 100). Une valeur non entière est arrondie à
 * l'entier le plus proche (7,4 → 7 ; 7,5 → 8) ; +∞ → borne haute ; −∞ et NaN → borne basse.
 */
export function nearestGridValue(mode: ExecutionMode, value: number): number {
  const bounds = targetBounds(mode);
  if (Number.isNaN(value)) {
    return bounds.min;
  }
  // ±∞ restent infinis après `Math.round` et sont ramenés à la borne de leur côté.
  return Math.min(bounds.max, Math.max(bounds.min, Math.round(value)));
}

/**
 * Story 3.4 (AD-16, FR-07-04, Q25) — position d'ouverture d'un Sélecteur de cible :
 * `NUMBER` → `nearestGridValue` ; `FAILURE` → l'option échec ; `UNSET` (« — ») → la
 * plus petite valeur valide, 1 s en Durée (00:01, D-430), 1 en Répétitions. Rien n'est appliqué
 * au Brouillon par cette position : seul le ✓ du Sélecteur applique (Q12).
 */
export function selectorOpeningPosition(mode: ExecutionMode, target: SeriesTarget): SelectorOpeningPosition {
  if (target.kind === "FAILURE") {
    return { kind: "FAILURE" };
  }
  if (target.kind === "UNSET") {
    return { kind: "NUMBER", value: targetBounds(mode).min };
  }
  return { kind: "NUMBER", value: nearestGridValue(mode, target.value) };
}

/** Sens d'un pas ± : `1` pour +, `-1` pour −. */
export type StepDirection = 1 | -1;

/**
 * Story 3.6 (AD-16, P38, Q36) — pas ± borné, en multiples DIRECTIONNELS du pas
 * (au pas 5 : 37 monte à 40 et descend à 35 ; au pas 1 : ±1), puis ramené dans
 * `[min, max]`. Correction de l'écart d'AD-16 : le résultat n'est JAMAIS en deçà
 * de la valeur courante pour + ni au-delà pour − ; dans ce cas, la valeur
 * courante est renvoyée (le bouton est indisponible). Ainsi, depuis 5999 au-dessus
 * de la borne 3535, + rend 5999 (indisponible) et − rend 3535 ; depuis 2 sous la
 * borne 5, − rend 2 (indisponible) et + rend 5. Source unique de `steppedValue`
 * (`ProfileStepper.tsx`) et de `stepTarget`.
 */
export function stepWithinBounds(current: number, direction: StepDirection, stepSize: number, min: number, max: number): number {
  const next =
    stepSize <= 1
      ? current + direction
      : direction === 1
        ? Math.floor(current / stepSize) * stepSize + stepSize
        : Math.ceil(current / stepSize) * stepSize - stepSize;
  const bounded = Math.min(max, Math.max(min, next));
  if (direction === 1 ? bounded < current : bounded > current) {
    return current;
  }
  return bounded;
}

/** Résultat d'un pas ± sur une Cible : nouvelle Cible numérique, ou bouton indisponible. */
export type StepTargetResult = Extract<SeriesTarget, { readonly kind: "NUMBER" }> | "unavailable";

/**
 * Story 3.6 (AD-16, FR-09-05, Q13, Q21, Q26, Q36, P38 ; Q44) — pas ± sur une Cible, pour
 * les ± des cellules du tableau et de la Cible commune :
 * - `NUMBER` → valeur voisine dans le sens du geste, dans les bornes de saisie
 *   (1..3535 s, à la seconde, D-430, ou 1..100), ou `unavailable` si aucune n'existe
 *   (7 s → 8 / 6 ; 5999 s → + `unavailable`, − 3535 ; 150 → + `unavailable`, − 100) ;
 * - `UNSET` → + donne la valeur minimale (1 s, 1), − `unavailable` (Q26) ;
 * - `FAILURE` → `unavailable` dans les deux sens (Q13).
 * `stepSize` (défaut 1) porte les paliers du maintien (`EXECUTION_ACCELERATED_HOLD_POLICY`,
 * Q36, H19) ; il ne change jamais la valeur d'une Cible `UNSET`.
 */
export function stepTarget(mode: ExecutionMode, target: SeriesTarget, direction: StepDirection, stepSize = 1): StepTargetResult {
  const bounds = targetBounds(mode);
  if (target.kind === "FAILURE") {
    return "unavailable";
  }
  if (target.kind === "UNSET") {
    return direction === 1 ? { kind: "NUMBER", value: bounds.min } : "unavailable";
  }
  const next = stepWithinBounds(target.value, direction, stepSize, bounds.min, bounds.max);
  return next === target.value ? "unavailable" : { kind: "NUMBER", value: next };
}

/**
 * Normalisation EFFECTIVE (v13 §3, arbitrage N=1) : à N=1 l'état est
 * uniforme sur la première ligne courante et l'ordre des côtés est « Un côté
 * après l'autre ». Les Cibles typées sont conservées telles quelles
 * (`FAILURE` compris). Les réserves temporaires du brouillon ne sont jamais ici.
 */
export function normalizeEffective<T extends ExecutionParametersInput>(parameters: T): T {
  const count = seriesCountOf(parameters);
  let series = parameters.series;
  if (count === 1 && series.kind === "VARIABLE") {
    // PRE-5 (AD-19, AD-20) : l'uniforme reprend la charge de la première ligne, sans phase ;
    // `loadEnabled` est inchangé. Une série déjà uniforme garde ses phases.
    const first = series.rows[0]!;
    series = { kind: "UNIFORM", count: 1, target: first.target, pauseSeconds: first.pauseSeconds, loadKg: first.loadKg, workPhases: [] };
  }
  return {
    ...parameters,
    series,
    sideOrder: count === 1 ? "BY_SIDE" : parameters.sideOrder,
  };
}

// --- Validation d'enregistrement unique (AD-13) ------------------------------

/**
 * Ligne de base d'une validation : paramètres relus à l'ouverture de
 * l'Éditeur (modification), `null` en création (aucune base : les bornes de
 * saisie s'appliquent partout), ou `"STORAGE"` (validation de Séance au
 * `Continuer` et repositories : niveau structurel seul).
 */
export type ExecutionValidationBaseline = ExecutionParametersInput | null | "STORAGE";

/**
 * Alignement optionnel des Séries sur la ligne de base (story 3.2, AC12) :
 * pour chaque Série de l'entrée, dans son ordre, le rang 0-indexé de sa
 * ligne dans `seriesRowsOf(baseline)`, ou `null` pour une ligne nouvelle
 * (aucune base). Absent : alignement par valeur puis par rang
 * (`alignRowsToBaseline`).
 *
 * Garde : une liste dont la longueur diffère du nombre de Séries de l'entrée
 * est ignorée en entier (aucune Série n'a de base) ; une entrée non entière,
 * hors des rangs de la base ou présente plusieurs fois est ignorée pour
 * chaque Série qui la porte (pas de base pour ces Séries).
 */
export type ExecutionValidationOptions = {
  readonly baselineRowIndexes?: readonly (number | null)[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Égalité de valeur d'une ligne quelconque (éventuellement malformée) avec une ligne de base.
 * PRE-5 (AD-19) : la charge est ignorée, elle n'a aucune ligne de base.
 */
function sameRowValue(row: unknown, base: SeriesRow): boolean {
  if (typeof row !== "object" || row === null) {
    return false;
  }
  const candidate = row as { target?: unknown; pauseSeconds?: unknown };
  const target = candidate.target;
  if (candidate.pauseSeconds !== base.pauseSeconds || !isRecord(target)) {
    return false;
  }
  return target.kind === base.target.kind && (base.target.kind !== "NUMBER" || target.value === base.target.value);
}

/**
 * Alignement des Séries sur la ligne de base quand aucune identité de ligne
 * n'est disponible (AD-13, H25 ; Éditeur, `Terminer`, Catalogue) :
 *
 * 1. chaque Série, dans l'ordre, est appariée à la première ligne de base
 *    encore libre de MÊME valeur (Cible typée et Pause égales) ; chaque ligne
 *    de base sert au plus une fois ;
 * 2. à défaut, la Série garde la ligne de base de même rang (comportement
 *    historique). Avec `exclusive`, ce repli n'est retenu que si cette ligne
 *    n'est pas déjà appariée, afin que l'alignement reste injectif.
 *
 * Une Série au-delà des lignes de base n'a pas de base (`null`).
 */
export function alignRowsToBaseline(
  rows: readonly unknown[],
  baseRows: readonly SeriesRow[],
  options: { readonly exclusive?: boolean } = {},
): (number | null)[] {
  const used = new Set<number>();
  const matched = rows.map((row) => {
    const index = baseRows.findIndex((base, candidate) => !used.has(candidate) && sameRowValue(row, base));
    if (index < 0) {
      return null;
    }
    used.add(index);
    return index;
  });
  return matched.map((index, rank) => {
    if (index !== null) {
      return index;
    }
    if (rank >= baseRows.length || (options.exclusive === true && used.has(rank))) {
      return null;
    }
    return rank;
  });
}

/** Applique la garde d'`ExecutionValidationOptions.baselineRowIndexes`. */
function guardedBaselineIndexes(
  indexes: readonly unknown[],
  rowCount: number,
  baseCount: number,
): (number | null)[] {
  if (indexes.length !== rowCount) {
    return Array.from({ length: rowCount }, () => null);
  }
  const valid = (value: unknown): value is number =>
    typeof value === "number" && Number.isInteger(value) && value >= 0 && value < baseCount;
  const occurrences = new Map<number, number>();
  indexes.forEach((value) => {
    if (valid(value)) {
      occurrences.set(value, (occurrences.get(value) ?? 0) + 1);
    }
  });
  return indexes.map((value) => (valid(value) && occurrences.get(value) === 1 ? value : null));
}

type Bounds = { readonly min: number; readonly max: number; readonly step?: number };

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Niveau structurel d'un nombre : entier non négatif (Q28), sans borne haute. */
function checkStructuralNumber(
  value: unknown,
  field: ExecutionParametersField,
  violations: ExecutionParametersViolation[],
  options: { readonly min?: number; readonly seriesNumber?: number } = {},
): value is number {
  const min = options.min ?? 0;
  const seriesNumber = options.seriesNumber !== undefined ? { seriesNumber: options.seriesNumber } : {};
  if (value === null || value === undefined) {
    violations.push({ code: "REQUIRED", field, level: "STRUCTURE", ...seriesNumber });
    return false;
  }
  if (!isFiniteNumber(value) || !Number.isInteger(value)) {
    violations.push({ code: "NOT_INTEGER", field, level: "STRUCTURE", ...seriesNumber });
    return false;
  }
  if (value < min) {
    // Aucune borne haute au niveau structurel (P44 amendée par Q28) : pas de `details`.
    violations.push({ code: "OUT_OF_RANGE", field, level: "STRUCTURE", ...seriesNumber });
    return false;
  }
  return true;
}

/**
 * Niveau saisie d'un nombre structurellement valide : bornes, et pas s'il est
 * défini (aucune borne d'`EXECUTION_BOUNDS` n'en porte depuis Q36).
 */
function checkInputBounds(
  value: number,
  field: ExecutionParametersField,
  bounds: Bounds,
  violations: ExecutionParametersViolation[],
  seriesNumber?: number,
): void {
  const offGrid = bounds.step !== undefined && (value - bounds.min) % bounds.step !== 0;
  if (value < bounds.min || value > bounds.max || offGrid) {
    violations.push({
      code: "OUT_OF_RANGE",
      field,
      level: "INPUT",
      details: { min: bounds.min, max: bounds.max, ...(bounds.step !== undefined ? { step: bounds.step } : {}) },
      ...(seriesNumber !== undefined ? { seriesNumber } : {}),
    });
  }
}

/**
 * PRE-5 (AD-19, FR-10) — valeur de charge valide : en kg, finie, ≥ 0, multiple
 * de 0,25 (`Number.isInteger(loadKg * 4)`), sans plafond. Les multiples de
 * 0,25 sont exacts en binaire : aucune unité technique.
 */
export function isValidLoadKg(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && Number.isInteger(value * 4);
}

/**
 * Contrôle structurel propre à la charge (AD-19) : `checkStructuralNumber`
 * (entier) reste inchangé ; aucune borne de niveau saisie n'existe pour la charge.
 */
function checkStructuralLoad(value: unknown, violations: ExecutionParametersViolation[], seriesNumber?: number): void {
  const withSeries = seriesNumber !== undefined ? { seriesNumber } : {};
  if (value === null || value === undefined) {
    violations.push({ code: "REQUIRED", field: "loadKg", level: "STRUCTURE", ...withSeries });
  } else if (typeof value !== "number" || !Number.isFinite(value)) {
    violations.push({ code: "UNRECOGNIZED", field: "loadKg", level: "STRUCTURE", ...withSeries });
  } else if (!isValidLoadKg(value)) {
    violations.push({ code: "OUT_OF_RANGE", field: "loadKg", level: "STRUCTURE", ...withSeries });
  }
}

/** Longueur en points de code, comme `length()` de SQLite (AD-20, AD-26). */
function codePointLength(text: string): number {
  return Array.from(text).length;
}

/**
 * Écart à l'invariant des phases : durées manquantes (`MISSING`, D-438), ou
 * forme invalide (`INVALID`, avec sa raison ; `sumOutOfRange` si seule la
 * somme sort de 1..3535). `null` si l'invariant tient.
 */
type WorkPhasesProblem =
  | { readonly kind: "MISSING"; readonly phaseIds: readonly number[] }
  | { readonly kind: "INVALID"; readonly reason: string; readonly sumOutOfRange?: true };

function invalidPhases(reason: string): WorkPhasesProblem {
  return { kind: "INVALID", reason };
}

/**
 * PRE-5 (AD-20, FR-1, FR-3, FR-40) — invariant structurel des phases, partagé
 * par `validateForSave` et `readV3`. Une liste vide (« Aucune ») est toujours
 * valide. Sinon : Mode `DURATION`, Cible `NUMBER`, 1 à 6 phases, `id` entier
 * ≥ 1 unique, durée entière ≥ 1 s (D-430), libellé de 1 à 20 points de code non
 * blanc, `target.value` = Σ des durées, Σ dans 1..3535. Aucune tolérance de
 * ligne de base (H25 ne s'applique pas à la somme).
 *
 * PRE-7 (A1.1, D-438, MFN-02, ch11 « Contrats internes des phases ») : une
 * durée 0 ou `null` est une durée NON RENSEIGNÉE, distinguée d'une forme
 * invalide (`MISSING`, identités dans l'ordre de la liste) ; la Cible et la
 * somme ne sont alors pas contrôlées (aucun total à comparer). Les autres
 * contrôles (nombre, Mode, identités, libellés, durée négative ou non entière)
 * priment. `readV3` refuse les deux cas : une donnée stockée n'est jamais
 * effacée ni complétée silencieusement.
 */
function workPhasesProblem(mode: unknown, target: unknown, workPhases: unknown): WorkPhasesProblem | null {
  if (!Array.isArray(workPhases)) {
    return invalidPhases("work phases are not a list");
  }
  if (workPhases.length === 0) {
    return null;
  }
  if (workPhases.length > WORK_PHASE_LIMITS.maxCount) {
    return invalidPhases("too many work phases");
  }
  if (mode !== "DURATION") {
    return invalidPhases("work phases require the DURATION mode");
  }
  const ids = new Set<number>();
  const missing: number[] = [];
  let sum = 0;
  for (const phase of workPhases as unknown[]) {
    if (!isRecord(phase) || Array.isArray(phase)) {
      return invalidPhases("malformed work phase");
    }
    const { id, label, durationSeconds } = phase as { id?: unknown; label?: unknown; durationSeconds?: unknown };
    if (typeof id !== "number" || !Number.isInteger(id) || id < 1 || ids.has(id)) {
      return invalidPhases("malformed or duplicated work phase id");
    }
    ids.add(id);
    if (
      typeof label !== "string" ||
      label.trim().length === 0 ||
      codePointLength(label) > WORK_PHASE_LIMITS.labelMaxLength
    ) {
      return invalidPhases("malformed work phase label");
    }
    if (durationSeconds === null || durationSeconds === 0) {
      // D-438 : durée non renseignée, phase conservée.
      missing.push(id);
      continue;
    }
    if (typeof durationSeconds !== "number" || !Number.isInteger(durationSeconds) || durationSeconds < WORK_PHASE_LIMITS.durationMin) {
      return invalidPhases("malformed work phase duration");
    }
    sum += durationSeconds;
  }
  if (missing.length > 0) {
    return { kind: "MISSING", phaseIds: missing };
  }
  if (!isRecord(target) || target.kind !== "NUMBER") {
    return invalidPhases("work phases require a NUMBER target");
  }
  const bounds = EXECUTION_BOUNDS.durationTarget;
  if (sum < bounds.min || sum > bounds.max) {
    return { kind: "INVALID", reason: "work phases sum out of range", sumOutOfRange: true };
  }
  if (target.value !== sum) {
    return invalidPhases("series target differs from the work phases sum");
  }
  return null;
}

/** Raison lisible d'un écart (messages d'erreur de données). */
function workPhasesProblemReason(problem: WorkPhasesProblem): string {
  return problem.kind === "MISSING" ? `missing work phase duration (${problem.phaseIds.join(", ")})` : problem.reason;
}

function targetBounds(mode: ExecutionMode): Bounds {
  return mode === "DURATION" ? EXECUTION_BOUNDS.durationTarget : EXECUTION_BOUNDS.repetitionTarget;
}

/** Contrôle structurel d'une Cible : `kind` connu, `NUMBER` entier ≥ 1, `UNSET` interdit (H25). */
function checkStructuralTarget(
  value: unknown,
  violations: ExecutionParametersViolation[],
  seriesNumber?: number,
): value is SeriesTarget {
  const withSeries = seriesNumber !== undefined ? { seriesNumber } : {};
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    violations.push({ code: "UNRECOGNIZED", field: "target", level: "STRUCTURE", ...withSeries });
    return false;
  }
  const kind = (value as { kind?: unknown }).kind;
  if (!TARGET_KINDS.includes(kind as SeriesTargetKind)) {
    violations.push({ code: "UNRECOGNIZED", field: "target", level: "STRUCTURE", ...withSeries });
    return false;
  }
  if (kind === "UNSET") {
    // Cible à renseigner, héritée comprise : bloque ✓ et `Terminer` (H25, AC7).
    violations.push({ code: "REQUIRED", field: "target", level: "STRUCTURE", ...withSeries });
    return false;
  }
  if (kind === "NUMBER") {
    return checkStructuralNumber((value as { value?: unknown }).value, "target", violations, {
      min: 1,
      ...(seriesNumber !== undefined ? { seriesNumber } : {}),
    });
  }
  return true;
}

function baselineOf(baseline: ExecutionValidationBaseline): ExecutionParametersInput | null {
  return baseline === "STORAGE" ? null : baseline;
}

/**
 * Validation d'enregistrement UNIQUE (AD-13, FR-18-03) : ✓ de la Feuille et
 * `Terminer` avec la ligne de base relue à l'ouverture de l'Éditeur (`null`
 * en création) ; `Continuer` de Séance et repositories avec `"STORAGE"`.
 * Agrège toutes les violations, ne lève jamais.
 *
 * - Niveau structurel, toujours appliqué : forme et types, nombres entiers
 *   non négatifs (Q28), Mode à deux valeurs, `kind` connus, au moins une
 *   Série, aucune Cible `UNSET`. Aucune borne haute (P44 amendée par Q28).
 * - Niveau saisie (hors `"STORAGE"`) : bornes d'`EXECUTION_BOUNDS`,
 *   appliquées champ par champ aux seules valeurs différentes de la ligne de
 *   base ; une Cible n'est tolérée que si le Mode est celui de la base (H25).
 *   Sans `options.baselineRowIndexes` (Éditeur, `Terminer`, Catalogue), les
 *   Séries sont alignées par VALEUR puis par rang (`alignRowsToBaseline`) :
 *   une ligne historique déplacée sans modification reste tolérée. Story 3.2
 *   (AC12, AD-13) : le Brouillon de la Feuille fournit, pour chaque Série
 *   effective, le rang de sa ligne de base selon l'IDENTITÉ de la ligne
 *   (`null` : ligne nouvelle, sans base, les bornes s'y appliquent).
 *
 * PRE-5 (AD-19, AD-20) : `loadEnabled` booléen et chaque `loadKg` valide
 * (`isValidLoadKg`) au niveau structurel seulement ; invariant des phases
 * (`workPhasesProblem`) au niveau structurel, sans tolérance de ligne de base.
 * PRE-7 (A1.1, D-438) : une durée de phase manquante (0) donne une violation
 * `REQUIRED` `workPhases` portant son `phaseId`, une par phase ; aucune phase
 * n'est retirée.
 *
 * Succès : paramètres EFFECTIFS normalisés (N=1, côté non renseigné →
 * `UNILATERAL`).
 */
export function validateForSave(
  input: ExecutionParametersInput,
  baseline: ExecutionValidationBaseline,
  options: ExecutionValidationOptions = {},
): ExecutionParametersResult {
  const violations: ExecutionParametersViolation[] = [];
  // Entrée absente ou non objet : violation structurelle, jamais une exception (contrat AD-13).
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { ok: false, violations: [{ code: "REQUIRED", field: "mode", level: "STRUCTURE" }] };
  }
  const raw = input as unknown as Record<string, unknown>;
  const checkInput = baseline !== "STORAGE";
  const base = baselineOf(baseline);

  if (raw.version !== EXECUTION_PARAMETERS_VERSION) {
    violations.push({ code: "UNRECOGNIZED", field: "version", level: "STRUCTURE" });
  }
  const mode = raw.mode;
  const modeValid = EXECUTION_MODES.includes(mode as ExecutionMode);
  if (mode === null || mode === undefined) {
    violations.push({ code: "REQUIRED", field: "mode", level: "STRUCTURE" });
  } else if (!modeValid) {
    violations.push({ code: "UNRECOGNIZED", field: "mode", level: "STRUCTURE" });
  }
  const sideMode = raw.sideMode === null || raw.sideMode === undefined ? "UNILATERAL" : raw.sideMode;
  if (!isSideMode(sideMode)) {
    violations.push({ code: "UNRECOGNIZED", field: "sideMode", level: "STRUCTURE" });
  }
  if (!SIDE_ORDERS.includes(raw.sideOrder as SideOrder)) {
    violations.push({ code: "UNRECOGNIZED", field: "sideOrder", level: "STRUCTURE" });
  }
  // PRE-5 (AD-19) : l'activation de la charge est un booléen obligatoire.
  if (raw.loadEnabled === null || raw.loadEnabled === undefined) {
    violations.push({ code: "REQUIRED", field: "loadEnabled", level: "STRUCTURE" });
  } else if (typeof raw.loadEnabled !== "boolean") {
    violations.push({ code: "UNRECOGNIZED", field: "loadEnabled", level: "STRUCTURE" });
  }

  // Champs communs : structure, puis bornes de saisie si la valeur diffère de la base.
  const commonFields = [
    ["sideRecoverySeconds", EXECUTION_BOUNDS.sideRecoverySeconds],
    ["cadenceBeepIntervalSeconds", EXECUTION_BOUNDS.cadenceBeepIntervalSeconds],
    ["countdownSeconds", EXECUTION_BOUNDS.countdownSeconds],
    ["endSeconds", EXECUTION_BOUNDS.endSeconds],
  ] as const;
  for (const [field, bounds] of commonFields) {
    const value = raw[field];
    if (checkStructuralNumber(value, field, violations) && checkInput) {
      const baseValue = base ? (base as Record<string, unknown>)[field] : undefined;
      if (baseValue !== value) {
        checkInputBounds(value, field, bounds, violations);
      }
    }
  }

  // Séries.
  const series = raw.series as Record<string, unknown> | null | undefined;
  const baseRows = base && isWellFormedSeries(base.series) ? seriesRowsOf(base) : [];
  const baseCount = base && isWellFormedSeries(base.series) ? seriesCountOf(base) : null;
  const targetToleratedMode = base !== null && base.mode === mode;
  // Rang de la ligne de base de chaque Série : identité fournie par la Feuille (gardée), sinon valeur puis rang.
  const alignmentFor = (rows: readonly unknown[]): readonly (number | null)[] =>
    options.baselineRowIndexes !== undefined
      ? guardedBaselineIndexes(options.baselineRowIndexes, rows.length, baseRows.length)
      : alignRowsToBaseline(rows, baseRows);

  const checkRow = (rowValue: unknown, baseIndex: number | null, seriesNumber: number | undefined) => {
    if (typeof rowValue !== "object" || rowValue === null || Array.isArray(rowValue)) {
      violations.push({
        code: "UNRECOGNIZED",
        field: "series",
        level: "STRUCTURE",
        ...(seriesNumber !== undefined ? { seriesNumber } : {}),
      });
      return;
    }
    const row = rowValue as { target?: unknown; pauseSeconds?: unknown; loadKg?: unknown };
    const baseRow = baseIndex === null ? undefined : baseRows[baseIndex];
    if (checkStructuralTarget(row.target, violations, seriesNumber) && checkInput && modeValid) {
      const target = row.target as SeriesTarget;
      const tolerated = targetToleratedMode && baseRow !== undefined && targetsEqual(baseRow.target, target);
      if (target.kind === "NUMBER" && !tolerated) {
        checkInputBounds(target.value, "target", targetBounds(mode as ExecutionMode), violations, seriesNumber);
      }
    }
    if (
      checkStructuralNumber(row.pauseSeconds, "pauseSeconds", violations, {
        ...(seriesNumber !== undefined ? { seriesNumber } : {}),
      }) &&
      checkInput
    ) {
      if (baseRow === undefined || baseRow.pauseSeconds !== row.pauseSeconds) {
        checkInputBounds(row.pauseSeconds as number, "pauseSeconds", EXECUTION_BOUNDS.pauseSeconds, violations, seriesNumber);
      }
    }
    // PRE-5 (AD-19) : charge contrôlée au seul niveau structurel, sans ligne de base ni borne de saisie.
    checkStructuralLoad(row.loadKg, violations, seriesNumber);
  };

  let count: number | null = null;
  if (typeof series !== "object" || series === null || Array.isArray(series)) {
    violations.push({ code: "UNRECOGNIZED", field: "series", level: "STRUCTURE" });
  } else if (series.kind === "UNIFORM") {
    if (checkStructuralNumber(series.count, "seriesCount", violations, { min: 1 })) {
      count = series.count as number;
    }
    // En uniforme, une seule Cible et une seule Pause communes : signalées une fois.
    const common = { target: series.target, pauseSeconds: series.pauseSeconds, loadKg: series.loadKg };
    checkRow(common, alignmentFor([common])[0] ?? null, undefined);
    // PRE-5 (AD-20, FR-3) : invariant des phases, structurel, sans tolérance de ligne de base.
    if (series.workPhases === null || series.workPhases === undefined) {
      violations.push({ code: "REQUIRED", field: "workPhases", level: "STRUCTURE" });
    } else if (!Array.isArray(series.workPhases)) {
      violations.push({ code: "UNRECOGNIZED", field: "workPhases", level: "STRUCTURE" });
    } else {
      const problem = workPhasesProblem(mode, series.target, series.workPhases);
      if (problem !== null && problem.kind === "MISSING") {
        // PRE-7 (A1.1, D-438, MFN/AC15, AC25) : une violation par durée manquante, la phase
        // restant présente ; ✓ et enregistrement de l'Exercice édité refusés.
        for (const phaseId of problem.phaseIds) {
          violations.push({ code: "REQUIRED", field: "workPhases", level: "STRUCTURE", phaseId });
        }
      } else if (problem !== null) {
        // PRE-5 (story 2.1, FR-3) : une somme hors de 1..3535 rend ✓ indisponible ; la
        // violation porte alors les bornes de la somme, comme une durée de série invalide.
        const { min, max } = EXECUTION_BOUNDS.durationTarget;
        violations.push({
          code: "OUT_OF_RANGE",
          field: "workPhases",
          level: "STRUCTURE",
          ...(problem.sumOutOfRange === true ? { details: { min, max } } : {}),
        });
      }
    }
  } else if (series.kind === "VARIABLE") {
    if (!Array.isArray(series.rows) || series.rows.length === 0) {
      violations.push({ code: "REQUIRED", field: "series", level: "STRUCTURE" });
    } else {
      count = series.rows.length;
      const alignment = alignmentFor(series.rows);
      series.rows.forEach((row: unknown, index: number) => checkRow(row, alignment[index] ?? null, index + 1));
    }
  } else {
    violations.push({ code: "UNRECOGNIZED", field: "series", level: "STRUCTURE" });
  }
  if (count !== null && checkInput && count !== baseCount) {
    checkInputBounds(count, "seriesCount", EXECUTION_BOUNDS.seriesCount, violations);
  }

  if (violations.length > 0) {
    return { ok: false, violations };
  }
  const normalized = normalizeEffective({ ...input, sideMode: sideMode as SideMode });
  return { ok: true, value: { ...normalized, mode: mode as ExecutionMode, sideMode: sideMode as SideMode } };
}

function isWellFormedSeries(series: unknown): series is ExecutionSeries {
  if (typeof series !== "object" || series === null) {
    return false;
  }
  const value = series as { kind?: unknown; rows?: unknown; count?: unknown };
  return (
    (value.kind === "UNIFORM" && typeof value.count === "number" && value.count >= 1) ||
    (value.kind === "VARIABLE" && Array.isArray(value.rows))
  );
}

// --- Formats canoniques v2 (figé) et v3 (AD-3, AD-18) --------------------------

function encodeTarget(target: SeriesTarget): Record<string, unknown> {
  return target.kind === "NUMBER" ? { kind: "NUMBER", value: target.value } : { kind: target.kind };
}

/**
 * Sérialisation canonique v2 (AD-3, FR-18-02) : mêmes clés et même ordre que
 * le sérialiseur v1 de PRE-3, `JSON.stringify` sans espace ; seuls `version`
 * et l'encodage de la Cible changent. Aucune identité de ligne, Réserve,
 * mémoire de Mode, phrase ni total ; aucun Bip par Série (P22).
 *
 * PRE-5 (AD-18) : SANS appelant de production, réservé aux tests de parité de
 * `migration010` (AD-10) ; écrit le littéral 2 (`EXECUTION_PARAMETERS_V2`).
 * Lève une erreur sur des paramètres que la v2 ne sait pas porter (phases,
 * charge active ou valeur de charge non nulle) : aucune perte silencieuse.
 */
export function serializeV2(parameters: ExecutionParameters): string {
  const { series } = parameters;
  const loads = series.kind === "UNIFORM" ? [series.loadKg] : series.rows.map((row) => row.loadKg);
  if (
    parameters.loadEnabled ||
    loads.some((loadKg) => loadKg !== 0) ||
    (series.kind === "UNIFORM" && series.workPhases.length > 0)
  ) {
    throw new Error("serializeV2 cannot carry work phases or a load (AD-18).");
  }
  const encoded =
    series.kind === "UNIFORM"
      ? {
          kind: "UNIFORM",
          count: series.count,
          target: encodeTarget(series.target),
          pauseSeconds: series.pauseSeconds,
        }
      : {
          kind: "VARIABLE",
          rows: series.rows.map((row) => ({ target: encodeTarget(row.target), pauseSeconds: row.pauseSeconds })),
        };
  return JSON.stringify({
    version: EXECUTION_PARAMETERS_V2,
    mode: parameters.mode,
    series: encoded,
    sideMode: parameters.sideMode,
    sideOrder: parameters.sideOrder,
    sideRecoverySeconds: parameters.sideRecoverySeconds,
    cadenceBeepIntervalSeconds: parameters.cadenceBeepIntervalSeconds,
    countdownSeconds: parameters.countdownSeconds,
    endSeconds: parameters.endSeconds,
  });
}

/**
 * PRE-5 (AD-18, FR-39) — SEUL écrivain des repositories et de l'Instantané.
 * Forme v3 : clés et ordre de la v2, `JSON.stringify` sans espace, plus
 * `"loadEnabled"` à la racine après `"endSeconds"`, `"loadKg"` et
 * `"workPhases"` dans l'uniforme, `"loadKg"` dans chaque ligne, TOUJOURS
 * écrits (`false`, `0` et `[]` compris). La charge est écrite sous Sans.
 */
export function serializeExecutionParameters(parameters: ExecutionParameters): string {
  return encodeResolvedParameters(parameters, EXECUTION_PARAMETERS_VERSION);
}

/** Encodage canonique de la représentation résolue sous la version donnée (v3, ou forme résolue v4 des copies). */
function encodeResolvedParameters(
  parameters: ExecutionParameters,
  version: typeof EXECUTION_PARAMETERS_VERSION | typeof RESOLVED_EXECUTION_PARAMETERS_VERSION,
): string {
  const { series } = parameters;
  const encoded =
    series.kind === "UNIFORM"
      ? {
          kind: "UNIFORM",
          count: series.count,
          target: encodeTarget(series.target),
          pauseSeconds: series.pauseSeconds,
          loadKg: series.loadKg,
          workPhases: series.workPhases.map((phase) => ({
            id: phase.id,
            label: phase.label,
            durationSeconds: phase.durationSeconds,
          })),
        }
      : {
          kind: "VARIABLE",
          rows: series.rows.map((row) => ({
            target: encodeTarget(row.target),
            pauseSeconds: row.pauseSeconds,
            loadKg: row.loadKg,
          })),
        };
  return JSON.stringify({
    version,
    mode: parameters.mode,
    series: encoded,
    sideMode: parameters.sideMode,
    sideOrder: parameters.sideOrder,
    sideRecoverySeconds: parameters.sideRecoverySeconds,
    cadenceBeepIntervalSeconds: parameters.cadenceBeepIntervalSeconds,
    countdownSeconds: parameters.countdownSeconds,
    endSeconds: parameters.endSeconds,
    loadEnabled: parameters.loadEnabled,
  });
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function readTarget(value: unknown): SeriesTarget {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ExecutionParametersDataError("Malformed series target.");
  }
  const target = value as { kind?: unknown; value?: unknown };
  if (target.kind === "FAILURE" || target.kind === "UNSET") {
    return { kind: target.kind };
  }
  if (target.kind === "NUMBER" && isNonNegativeInteger(target.value) && target.value >= 1) {
    return { kind: "NUMBER", value: target.value };
  }
  throw new ExecutionParametersDataError("Malformed series target.");
}

/** Cible et Pause d'une ligne (grammaire v2, reprise telle quelle par la v3). */
function readTargetAndPause(value: unknown): { readonly target: SeriesTarget; readonly pauseSeconds: number } {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ExecutionParametersDataError("Malformed series row.");
  }
  const row = value as { target?: unknown; pauseSeconds?: unknown };
  if (!isNonNegativeInteger(row.pauseSeconds)) {
    throw new ExecutionParametersDataError("Malformed series pause.");
  }
  return { target: readTarget(row.target), pauseSeconds: row.pauseSeconds };
}

/** Charge v3, stricte (AD-18, AD-19) : absente ou invalide → `ExecutionParametersDataError`. */
function readLoadKg(value: unknown): number {
  if (!isValidLoadKg(value)) {
    throw new ExecutionParametersDataError("Malformed load.");
  }
  return value;
}

/** NULL ou JSON corrompu → `ExecutionParametersDataError`. */
function parseParametersJson(json: string | null | undefined): Record<string, unknown> {
  if (json === null || json === undefined) {
    throw new ExecutionParametersDataError("Execution parameters are missing.");
  }
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new ExecutionParametersDataError("Execution parameters JSON is malformed.");
  }
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new ExecutionParametersDataError("Execution parameters JSON is malformed.");
  }
  return raw as Record<string, unknown>;
}

function unknownVersion(version: unknown): never {
  throw new ExecutionParametersDataError(`Unknown execution parameters version: ${String(version)}.`);
}

/** Champs racine communs à la v2 et à la v3 (grammaire v2 inchangée). */
function readRootFields(value: Record<string, unknown>) {
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
  if (typeof seriesValue !== "object" || seriesValue === null || Array.isArray(seriesValue)) {
    throw new ExecutionParametersDataError("Malformed series.");
  }
  return {
    mode,
    seriesValue,
    root: {
      sideMode: value.sideMode,
      sideOrder: value.sideOrder as SideOrder,
      sideRecoverySeconds: value.sideRecoverySeconds as number,
      cadenceBeepIntervalSeconds: value.cadenceBeepIntervalSeconds as number,
      countdownSeconds: value.countdownSeconds as number,
      endSeconds: value.endSeconds as number,
    },
  };
}

function readUniformCount(seriesValue: Record<string, unknown>): number {
  if (!isNonNegativeInteger(seriesValue.count) || seriesValue.count < 1) {
    throw new ExecutionParametersDataError("Malformed series count.");
  }
  return seriesValue.count;
}

/** Grammaire v2 inchangée ; le modèle courant porte « sans phases, charge Sans » (AD-18, SM-3). */
function readV2Object(value: Record<string, unknown>): ExecutionParameters {
  const { mode, seriesValue, root } = readRootFields(value);
  let series: ExecutionSeries;
  if (seriesValue.kind === "UNIFORM") {
    const count = readUniformCount(seriesValue);
    const row = readTargetAndPause({ target: seriesValue.target, pauseSeconds: seriesValue.pauseSeconds });
    series = { kind: "UNIFORM", count, target: row.target, pauseSeconds: row.pauseSeconds, loadKg: 0, workPhases: [] };
  } else if (seriesValue.kind === "VARIABLE" && Array.isArray(seriesValue.rows) && seriesValue.rows.length >= 1) {
    series = { kind: "VARIABLE", rows: seriesValue.rows.map((row) => ({ ...readTargetAndPause(row), loadKg: 0 })) };
  } else {
    throw new ExecutionParametersDataError("Unknown series kind.");
  }
  return { version: EXECUTION_PARAMETERS_VERSION, mode, series, ...root, loadEnabled: false };
}

/** Lecture v3 stricte (AD-18) : clé absente ou mal typée, ou invariant des phases rompu → erreur. */
function readV3Object(value: Record<string, unknown>): ExecutionParameters {
  const { mode, seriesValue, root } = readRootFields(value);
  if (typeof value.loadEnabled !== "boolean") {
    throw new ExecutionParametersDataError("Malformed loadEnabled.");
  }
  let series: ExecutionSeries;
  if (seriesValue.kind === "UNIFORM") {
    const count = readUniformCount(seriesValue);
    const row = readTargetAndPause({ target: seriesValue.target, pauseSeconds: seriesValue.pauseSeconds });
    const loadKg = readLoadKg(seriesValue.loadKg);
    const problem = workPhasesProblem(mode, row.target, seriesValue.workPhases);
    if (problem !== null) {
      throw new ExecutionParametersDataError(`Malformed work phases: ${workPhasesProblemReason(problem)}.`);
    }
    const workPhases = (seriesValue.workPhases as WorkPhase[]).map((phase) => ({
      id: phase.id,
      label: phase.label,
      durationSeconds: phase.durationSeconds,
    }));
    series = { kind: "UNIFORM", count, target: row.target, pauseSeconds: row.pauseSeconds, loadKg, workPhases };
  } else if (seriesValue.kind === "VARIABLE" && Array.isArray(seriesValue.rows) && seriesValue.rows.length >= 1) {
    series = {
      kind: "VARIABLE",
      rows: seriesValue.rows.map((row: unknown) => ({
        ...readTargetAndPause(row),
        loadKg: readLoadKg((row as { loadKg?: unknown }).loadKg),
      })),
    };
  } else {
    throw new ExecutionParametersDataError("Unknown series kind.");
  }
  return { version: EXECUTION_PARAMETERS_VERSION, mode, series, ...root, loadEnabled: value.loadEnabled };
}

/**
 * Lecteur de la v2 (AD-3, AD-18) : NULL, JSON corrompu, v1 ou toute version
 * autre que 2 → `ExecutionParametersDataError`, jamais un repli sur les
 * scalaires. Les bornes de saisie ne sont pas réappliquées : une valeur
 * héritée positive hors bornes reste lue telle quelle (H25). PRE-5 : retourne
 * le modèle courant avec `workPhases: []`, `loadEnabled: false` et `loadKg: 0`
 * partout. Seul `readExecutionParameters` l'emploie en production.
 */
export function readV2(json: string | null | undefined): ExecutionParameters {
  const value = parseParametersJson(json);
  if (value.version !== EXECUTION_PARAMETERS_V2) {
    unknownVersion(value.version);
  }
  return readV2Object(value);
}

/**
 * Lecteur de la v3 (AD-18), strict : une clé `loadEnabled`, `loadKg` ou
 * `workPhases` absente ou mal typée, ou un invariant des phases rompu (AD-20)
 * → `ExecutionParametersDataError`. Les clés inconnues sont ignorées, comme en v2.
 */
export function readV3(json: string | null | undefined): ExecutionParameters {
  const value = parseParametersJson(json);
  if (value.version !== EXECUTION_PARAMETERS_VERSION) {
    unknownVersion(value.version);
  }
  return readV3Object(value);
}

/**
 * PRE-5 (AD-18, FR-39, NFR-10) — SEUL lecteur des repositories et de
 * l'Instantané : version 2 → `readV2` (donnée PRE-4 ou issue de
 * `migration010`, lue « sans phases, charge Sans ») ; version 3 → `readV3` ;
 * toute autre version (une v3 lue par un build PRE-4 comprise, de l'autre
 * côté) → `ExecutionParametersDataError`, sans perte silencieuse.
 */
export function readExecutionParameters(json: string | null | undefined): ExecutionParameters {
  const value = parseParametersJson(json);
  if (value.version === EXECUTION_PARAMETERS_V2) {
    return readV2Object(value);
  }
  if (value.version === EXECUTION_PARAMETERS_VERSION) {
    return readV3Object(value);
  }
  return unknownVersion(value.version);
}

// --- Format Catalogue v4 (PRE-7, A1.1, D-437, D-438, MFN-02) ------------------

/**
 * PRE-7 (A1.1, MFN-02, ch09 « contrat canonique versionné », ch12 §12.5) —
 * version de la forme CATALOGUE des paramètres d'exécution : valeurs propres à
 * un Exercice du Catalogue, sans libellé de phase. La structure des phases
 * `(id, label)` appartient au Mouvement (`Movement.ts`) ; la représentation
 * RÉSOLUE (`ExecutionParameters`, v3, avec les libellés) reste celle des
 * copies, de la Feuille, de la phrase, des calculs et de l'Instantané.
 */
export const CATALOG_EXECUTION_PARAMETERS_VERSION = 4 as const;

/**
 * Durée d'une phase dans la forme Catalogue (MFN-02) : associée à la phase du
 * Mouvement par `phaseId`. `null` = durée non renseignée (exercice frère
 * incomplet après une correction partagée, MFN-08) ; une durée 0 n'est jamais
 * stockée, `null` est la seule absence.
 */
export type PhaseDuration = {
  readonly phaseId: number;
  readonly durationSeconds: number | null;
};

/** Séries identiques de la forme Catalogue : `phaseDurations` remplace `workPhases` (aucun libellé). */
export type CatalogUniformSeries = Omit<UniformSeries, "workPhases"> & {
  readonly phaseDurations: readonly PhaseDuration[];
};

export type CatalogExecutionSeries = CatalogUniformSeries | VariableSeries;

/** Paramètres Catalogue v4 : mêmes champs racine que la v3, séries Catalogue. */
export type CatalogExecutionParameters = Omit<ExecutionParameters, "version" | "series"> & {
  readonly version: typeof CATALOG_EXECUTION_PARAMETERS_VERSION;
  readonly series: CatalogExecutionSeries;
};

/**
 * Invariant des durées de phases de la forme Catalogue (MFN-02, MFN-08,
 * D-430) : liste (vide = « Aucune », toujours valide) ; sinon au plus 6
 * entrées, Mode `DURATION`, `phaseId` entier ≥ 1 unique, durée entière ≥ 1 s
 * ou `null`. Au moins une durée `null` (exercice frère incomplet) : Cible
 * `UNSET`, aucun total inventé. Toutes renseignées : Cible `NUMBER` = Σ, Σ dans
 * 1..3535. Partagé par le sérialiseur, le lecteur v4 et la résolution
 * (`Movement.ts`). Retourne la raison d'un écart, `null` si l'invariant tient.
 */
export function phaseDurationsProblem(mode: unknown, target: unknown, phaseDurations: unknown): string | null {
  if (!Array.isArray(phaseDurations)) {
    return "phase durations are not a list";
  }
  if (phaseDurations.length === 0) {
    return null;
  }
  if (phaseDurations.length > WORK_PHASE_LIMITS.maxCount) {
    return "too many phase durations";
  }
  if (mode !== "DURATION") {
    return "phase durations require the DURATION mode";
  }
  const ids = new Set<number>();
  let sum = 0;
  let incomplete = false;
  for (const entry of phaseDurations as unknown[]) {
    if (!isRecord(entry) || Array.isArray(entry)) {
      return "malformed phase duration";
    }
    const { phaseId, durationSeconds } = entry as { phaseId?: unknown; durationSeconds?: unknown };
    if (typeof phaseId !== "number" || !Number.isInteger(phaseId) || phaseId < 1 || ids.has(phaseId)) {
      return "malformed or duplicated phase id";
    }
    ids.add(phaseId);
    if (durationSeconds === null) {
      incomplete = true;
      continue;
    }
    if (typeof durationSeconds !== "number" || !Number.isInteger(durationSeconds) || durationSeconds < WORK_PHASE_LIMITS.durationMin) {
      return "malformed phase duration value";
    }
    sum += durationSeconds;
  }
  if (!isRecord(target)) {
    return "malformed series target";
  }
  if (incomplete) {
    return target.kind === "UNSET" ? null : "an incomplete phase list requires an UNSET target";
  }
  if (target.kind !== "NUMBER") {
    return "complete phase durations require a NUMBER target";
  }
  const bounds = EXECUTION_BOUNDS.durationTarget;
  if (sum < bounds.min || sum > bounds.max) {
    return "phase durations sum out of range";
  }
  return target.value === sum ? null : "series target differs from the phase durations sum";
}

/**
 * Sérialisation canonique v4 (MFN-02) : clés et ordre de la v3, `JSON.stringify`
 * sans espace ; dans l'uniforme, `"phaseDurations"` (couples `phaseId`,
 * `durationSeconds`, `null` compris) remplace `"workPhases"`. Lève une erreur si
 * l'invariant `phaseDurationsProblem` est rompu : une durée 0, une Cible
 * incohérente ou une identité dupliquée n'est jamais écrite.
 */
export function serializeCatalogExecutionParameters(parameters: CatalogExecutionParameters): string {
  const { series } = parameters;
  if (series.kind === "UNIFORM") {
    const problem = phaseDurationsProblem(parameters.mode, series.target, series.phaseDurations);
    if (problem !== null) {
      throw new Error(`serializeCatalogExecutionParameters: ${problem} (MFN-02).`);
    }
  }
  const encoded =
    series.kind === "UNIFORM"
      ? {
          kind: "UNIFORM",
          count: series.count,
          target: encodeTarget(series.target),
          pauseSeconds: series.pauseSeconds,
          loadKg: series.loadKg,
          phaseDurations: series.phaseDurations.map((entry) => ({
            phaseId: entry.phaseId,
            durationSeconds: entry.durationSeconds,
          })),
        }
      : {
          kind: "VARIABLE",
          rows: series.rows.map((row) => ({
            target: encodeTarget(row.target),
            pauseSeconds: row.pauseSeconds,
            loadKg: row.loadKg,
          })),
        };
  return JSON.stringify({
    version: CATALOG_EXECUTION_PARAMETERS_VERSION,
    mode: parameters.mode,
    series: encoded,
    sideMode: parameters.sideMode,
    sideOrder: parameters.sideOrder,
    sideRecoverySeconds: parameters.sideRecoverySeconds,
    cadenceBeepIntervalSeconds: parameters.cadenceBeepIntervalSeconds,
    countdownSeconds: parameters.countdownSeconds,
    endSeconds: parameters.endSeconds,
    loadEnabled: parameters.loadEnabled,
  });
}

/**
 * Lecteur v4 STRICT (MFN-02, ch09 : « une version inconnue ne doit jamais être
 * rabattue silencieusement sur une durée scalaire ») : NULL, JSON corrompu,
 * toute version autre que 4 (v3 et v5 comprises), clé `loadEnabled`, `loadKg`
 * ou `phaseDurations` absente ou mal typée, invariant `phaseDurationsProblem`
 * rompu (durée 0, phase dupliquée…) → `ExecutionParametersDataError`, jamais
 * un repli. Grammaire racine, Cible, Pause et charge identiques à la v3 ; les
 * clés inconnues sont ignorées, comme en v2 et v3.
 */
export function readCatalogExecutionParameters(json: string | null | undefined): CatalogExecutionParameters {
  const value = parseParametersJson(json);
  if (value.version !== CATALOG_EXECUTION_PARAMETERS_VERSION) {
    unknownVersion(value.version);
  }
  const { mode, seriesValue, root } = readRootFields(value);
  if (typeof value.loadEnabled !== "boolean") {
    throw new ExecutionParametersDataError("Malformed loadEnabled.");
  }
  let series: CatalogExecutionSeries;
  if (seriesValue.kind === "UNIFORM") {
    const count = readUniformCount(seriesValue);
    const row = readTargetAndPause({ target: seriesValue.target, pauseSeconds: seriesValue.pauseSeconds });
    const loadKg = readLoadKg(seriesValue.loadKg);
    const problem = phaseDurationsProblem(mode, row.target, seriesValue.phaseDurations);
    if (problem !== null) {
      throw new ExecutionParametersDataError(`Malformed phase durations: ${problem}.`);
    }
    const phaseDurations = (seriesValue.phaseDurations as PhaseDuration[]).map((entry) => ({
      phaseId: entry.phaseId,
      durationSeconds: entry.durationSeconds,
    }));
    series = { kind: "UNIFORM", count, target: row.target, pauseSeconds: row.pauseSeconds, loadKg, phaseDurations };
  } else if (seriesValue.kind === "VARIABLE" && Array.isArray(seriesValue.rows) && seriesValue.rows.length >= 1) {
    series = {
      kind: "VARIABLE",
      rows: seriesValue.rows.map((row: unknown) => ({
        ...readTargetAndPause(row),
        loadKg: readLoadKg((row as { loadKg?: unknown }).loadKg),
      })),
    };
  } else {
    throw new ExecutionParametersDataError("Unknown series kind.");
  }
  return { version: CATALOG_EXECUTION_PARAMETERS_VERSION, mode, series, ...root, loadEnabled: value.loadEnabled };
}

// --- Forme résolue v4 des copies (PRE-7, A1.2, D-437, D-440, MFN-02) ---------

/**
 * PRE-7 (A1.2, ch12 « Architecture cible MFN » : « phases résolues dans les
 * copies ») — version de la forme RÉSOLUE persistée par les copies de Séance
 * (`activities.execution_parameters`) après la migration 012 : grammaire de la
 * v3 (libellés de phases compris), version 4. La colonne détermine la forme :
 * `activity_definitions` porte la forme Catalogue v4, `activities` la forme
 * résolue v4. La représentation en mémoire reste `ExecutionParameters`
 * (`version: 3`).
 */
export const RESOLVED_EXECUTION_PARAMETERS_VERSION = 4 as const;

/**
 * Écrivain STRICT de la forme résolue v4 (MFN-02, D-438) : clés et ordre de
 * `serializeExecutionParameters`, version 4. Lève si l'invariant des phases
 * est rompu, durée manquante comprise : une copie de Séance n'est produite que
 * d'une résolution exécutable (ch11 « refuser les exercices incomplets ») ; un
 * exercice frère incomplet ne persiste que sous la forme Catalogue.
 */
export function serializeResolvedExecutionParameters(parameters: ExecutionParameters): string {
  const { series } = parameters;
  if (series.kind === "UNIFORM") {
    const problem = workPhasesProblem(parameters.mode, series.target, series.workPhases);
    if (problem !== null) {
      throw new Error(`serializeResolvedExecutionParameters: ${workPhasesProblemReason(problem)} (MFN-02).`);
    }
  }
  return encodeResolvedParameters(parameters, RESOLVED_EXECUTION_PARAMETERS_VERSION);
}

/**
 * Lecteur STRICT de la forme résolue v4 (D-440 : aucune lecture v2/v3 dans la
 * persistance après 012) : NULL, JSON corrompu, toute version autre que 4, et
 * toute violation de la grammaire v3 (`readV3Object`, invariant des phases
 * compris ; une forme Catalogue, sans `workPhases`, est refusée) →
 * `ExecutionParametersDataError`. Retourne la représentation en mémoire
 * (`version: 3`).
 */
export function readResolvedExecutionParameters(json: string | null | undefined): ExecutionParameters {
  const value = parseParametersJson(json);
  if (value.version !== RESOLVED_EXECUTION_PARAMETERS_VERSION) {
    unknownVersion(value.version);
  }
  return readV3Object(value);
}

/**
 * Invariant des phases RÉSOLUES (v3), exposé pour la résolution Catalogue
 * (`Movement.ts`) : raison d'un écart, `null` s'il tient. Une durée manquante
 * (0) y est un écart.
 */
export function resolvedWorkPhasesProblem(mode: unknown, target: unknown, workPhases: unknown): string | null {
  const problem = workPhasesProblem(mode, target, workPhases);
  return problem === null ? null : workPhasesProblemReason(problem);
}

// --- Projection scalaire unique (AD-3) ---------------------------------------

/** Colonnes scalaires historiques d'un Exercice, dérivées des paramètres. */
export type ScalarProjection = {
  readonly executionMode: ExecutionMode;
  readonly durationSeconds: number | null;
  readonly repetitionCount: number | null;
  readonly seriesCount: number;
  readonly pauseSeconds: number;
  readonly sideMode: SideMode;
  readonly sideRecoverySeconds: number;
};

/**
 * Projection scalaire UNIQUE (AD-3), appliquée par le mapping d'écriture des
 * repositories juste avant `INSERT`/`UPDATE` (et reproduite telle quelle,
 * figée, par `migration010`) : Cible de la PREMIÈRE ligne effective si elle
 * est `NUMBER`, sinon NULL — on ne cherche jamais la Cible numérique
 * suivante. Les colonnes scalaires ne sont jamais relues comme source.
 */
export function projectScalars(parameters: ExecutionParameters): ScalarProjection {
  const effective = normalizeEffective(parameters);
  const first = seriesRowsOf(effective)[0]!;
  const value = first.target.kind === "NUMBER" ? first.target.value : null;
  return {
    executionMode: effective.mode,
    durationSeconds: effective.mode === "DURATION" ? value : null,
    repetitionCount: effective.mode === "REPETITIONS" ? value : null,
    seriesCount: seriesCountOf(effective),
    pauseSeconds: first.pauseSeconds,
    sideMode: effective.sideMode,
    sideRecoverySeconds: effective.sideRecoverySeconds,
  };
}

// --- Brouillon, égalité, copie -------------------------------------------------

/** Défauts Profil copiés au moment réel de la création (P3-10) — jamais relus ensuite. */
export type ExecutionProfileDefaults = {
  readonly countdownSeconds: number;
  readonly endSeconds: number;
};

/**
 * Brouillon de création (v13 §6) : Mode et côté non renseignés, Série 1 à
 * Cible à renseigner, Pause 0 s, Bip 0 ; Compte à rebours et Fin copiés du
 * Profil. Aucune Cible inventée. PRE-5 (AD-19, AD-20) : charge Sans, 0 kg,
 * aucune phase.
 */
export function createEmptyExecutionParameters(defaults: ExecutionProfileDefaults): ExecutionParametersInput {
  return {
    version: EXECUTION_PARAMETERS_VERSION,
    mode: null,
    series: { kind: "UNIFORM", count: 1, target: unsetTarget(), pauseSeconds: 0, loadKg: 0, workPhases: [] },
    sideMode: null,
    sideOrder: "BY_SIDE",
    sideRecoverySeconds: 0,
    cadenceBeepIntervalSeconds: 0,
    countdownSeconds: defaults.countdownSeconds,
    endSeconds: defaults.endSeconds,
    loadEnabled: false,
  };
}

function workPhasesEqual(a: readonly WorkPhase[], b: readonly WorkPhase[]): boolean {
  return (
    a.length === b.length &&
    a.every(
      (phase, index) =>
        phase.id === b[index]!.id && phase.label === b[index]!.label && phase.durationSeconds === b[index]!.durationSeconds,
    )
  );
}

/**
 * Comparaison structurelle exacte (garde d'abandon, copie, égalité de brouillon), Cibles comparées par `kind`/`value`.
 * PRE-5 (AD-19, AD-20, FR-41) : `loadEnabled`, `loadKg` (uniforme et lignes) et `workPhases` (avec `id`) compris.
 */
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
    a.loadEnabled !== b.loadEnabled ||
    a.series.kind !== b.series.kind
  ) {
    return false;
  }
  if (a.series.kind === "UNIFORM" && b.series.kind === "UNIFORM") {
    return (
      a.series.count === b.series.count &&
      targetsEqual(a.series.target, b.series.target) &&
      a.series.pauseSeconds === b.series.pauseSeconds &&
      a.series.loadKg === b.series.loadKg &&
      workPhasesEqual(a.series.workPhases, b.series.workPhases)
    );
  }
  const rowsA = seriesRowsOf(a);
  const rowsB = seriesRowsOf(b);
  return (
    rowsA.length === rowsB.length &&
    rowsA.every(
      (row, index) =>
        targetsEqual(row.target, rowsB[index]!.target) &&
        row.pauseSeconds === rowsB[index]!.pauseSeconds &&
        row.loadKg === rowsB[index]!.loadKg,
    )
  );
}

/**
 * Copie profonde : aucune référence partagée (Cibles comprises) entre une source et sa copie (AD-9).
 * PRE-5 (AD-9, AD-19, FR-41) : charge et phases (identités comprises) copiées, sans référence partagée.
 */
export function cloneExecutionParameters<T extends ExecutionParametersInput>(parameters: T): T {
  return {
    ...parameters,
    series:
      parameters.series.kind === "UNIFORM"
        ? {
            ...parameters.series,
            target: cloneTarget(parameters.series.target),
            workPhases: parameters.series.workPhases.map((phase) => ({
              id: phase.id,
              label: phase.label,
              durationSeconds: phase.durationSeconds,
            })),
          }
        : {
            kind: "VARIABLE",
            rows: parameters.series.rows.map((row) => ({
              target: cloneTarget(row.target),
              pauseSeconds: row.pauseSeconds,
              loadKg: row.loadKg,
            })),
          },
  };
}
