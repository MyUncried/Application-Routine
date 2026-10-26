/**
 * PRE-4 (story 1.1) — constructeurs de paramètres d'exécution TYPÉS pour les
 * tests (jamais importés par le code de production). Ils remplacent les
 * anciens champs scalaires des fixtures (Mode, cible, N, Pause) par la seule
 * représentation du domaine (AD-1, AD-3).
 */

import {
  EXECUTION_PARAMETERS_VERSION,
  failureTarget,
  numberTarget,
  unsetTarget,
  type ExecutionMode,
  type ExecutionParameters,
  type SeriesTarget,
  type SideOrder,
  type WorkPhase,
} from "@/domain/activities/ExecutionParameters";
import type { SideMode } from "@/domain/sessions/sideMode";

/** Cible de fixture : un nombre (`NUMBER`), `"FAILURE"`, `"UNSET"` ou une Cible typée. */
export type FixtureTarget = number | "FAILURE" | "UNSET" | SeriesTarget;

export function toTarget(target: FixtureTarget): SeriesTarget {
  if (typeof target === "number") {
    return numberTarget(target);
  }
  if (target === "FAILURE") {
    return failureTarget();
  }
  if (target === "UNSET") {
    return unsetTarget();
  }
  return target;
}

export type CommonFixtureOptions = {
  readonly sideMode?: SideMode;
  readonly sideOrder?: SideOrder;
  readonly sideRecoverySeconds?: number;
  readonly cadenceBeepIntervalSeconds?: number;
  readonly countdownSeconds?: number;
  readonly endSeconds?: number;
  /** PRE-5 (AD-19) : charge Avec / Sans, Sans par défaut. */
  readonly loadEnabled?: boolean;
};

function common(options: CommonFixtureOptions) {
  return {
    sideMode: options.sideMode ?? "UNILATERAL",
    sideOrder: options.sideOrder ?? "BY_SIDE",
    sideRecoverySeconds: options.sideRecoverySeconds ?? 0,
    cadenceBeepIntervalSeconds: options.cadenceBeepIntervalSeconds ?? 0,
    countdownSeconds: options.countdownSeconds ?? 0,
    endSeconds: options.endSeconds ?? 0,
    loadEnabled: options.loadEnabled ?? false,
  } as const;
}

/** Régime identiques : `count` Séries de Cible `target`, Pause `pauseSeconds`. */
export function uniformParameters(
  options: CommonFixtureOptions & {
    readonly mode?: ExecutionMode;
    readonly count?: number;
    readonly target: FixtureTarget;
    readonly pauseSeconds?: number;
    /** PRE-5 (AD-19, AD-20) : charge commune (0 par défaut) et phases (aucune par défaut). */
    readonly loadKg?: number;
    readonly workPhases?: readonly WorkPhase[];
  },
): ExecutionParameters {
  return {
    version: EXECUTION_PARAMETERS_VERSION,
    mode: options.mode ?? "DURATION",
    series: {
      kind: "UNIFORM",
      count: options.count ?? 1,
      target: toTarget(options.target),
      pauseSeconds: options.pauseSeconds ?? 0,
      loadKg: options.loadKg ?? 0,
      workPhases: options.workPhases ?? [],
    },
    ...common(options),
  };
}

/** Régime variables : une ligne `[cible, pause]` par Série. */
export function variableParameters(
  options: CommonFixtureOptions & {
    readonly mode?: ExecutionMode;
    /** `[cible, pause]` ou `[cible, pause, charge]` (PRE-5, AD-19 ; charge 0 par défaut). */
    readonly rows: readonly (readonly [FixtureTarget, number, number?])[];
    /** PRE-7 (D-446) : motif commun des phases (aucune par défaut). */
    readonly workPhases?: readonly WorkPhase[];
  },
): ExecutionParameters {
  return {
    version: EXECUTION_PARAMETERS_VERSION,
    mode: options.mode ?? "DURATION",
    series: {
      kind: "VARIABLE",
      rows: options.rows.map(([target, pauseSeconds, loadKg]) => ({ target: toTarget(target), pauseSeconds, loadKg: loadKg ?? 0 })),
      workPhases: options.workPhases ?? [],
    },
    ...common(options),
  };
}

/** Durée identiques : `count` × `seconds`, Pause `pauseSeconds`. */
export function durationParameters(
  seconds: FixtureTarget,
  count = 1,
  pauseSeconds = 0,
  options: CommonFixtureOptions = {},
): ExecutionParameters {
  return uniformParameters({ ...options, mode: "DURATION", count, target: seconds, pauseSeconds });
}

/** Répétitions identiques : `count` × `repetitions`, Pause `pauseSeconds`. */
export function repetitionParameters(
  repetitions: FixtureTarget,
  count = 1,
  pauseSeconds = 0,
  options: CommonFixtureOptions = {},
): ExecutionParameters {
  return uniformParameters({ ...options, mode: "REPETITIONS", count, target: repetitions, pauseSeconds });
}

/** Ancien Exercice « à l'échec » migré : Répétitions, toutes les Cibles `FAILURE` (FR-18-10). */
export function allFailureParameters(
  count = 1,
  pauseSeconds = 0,
  options: CommonFixtureOptions = {},
): ExecutionParameters {
  return uniformParameters({ ...options, mode: "REPETITIONS", count, target: "FAILURE", pauseSeconds });
}
