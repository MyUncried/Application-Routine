/**
 * PRE-3 — autorité unique des durées d'un Exercice (v13 §4–5, Bip v2 §2–3).
 *
 * Le calcul énumère les phases chronométrées réellement prévues (registre
 * d'événements) plutôt que d'appliquer des formules fermées : Σ(Ti+Pi) en
 * unilatéral, 2Σ(Ti+Pi)+PC en côtés successifs, 2ΣTi+ΣPi+N×PC par paire en
 * découlent par construction, de même que la substitution de la SEULE Pause
 * terminale par une Récupération positive. Durée → Ti = cible ; Répétitions
 * avec bip b>0 → Ti = Ri×b ; sinon travail inconnu (aucune convention 2 s).
 *
 * Résultat typé `exact | estimated | omitted` à l'Exercice — `omitted` ne
 * porte aucun montant, mais les contributions connues (pauses) restent
 * disponibles pour l'agrégation de Séance (`lowerBound`). Compte à rebours
 * et Fin propres sont exclus du total intrinsèque.
 */

import {
  isBilateral,
  normalizeEffective,
  seriesCountOf,
  seriesRowsOf,
  type ExecutionParameters,
  type ExecutionParametersInput,
} from "./ExecutionParameters";

export type LedgerSide = "NONE" | "RIGHT" | "LEFT";

export type LedgerEvent =
  | { readonly kind: "WORK"; readonly series: number; readonly side: LedgerSide; readonly seconds: number | null }
  | { readonly kind: "SERIES_PAUSE"; readonly series: number; readonly side: LedgerSide; readonly seconds: number }
  | { readonly kind: "SIDE_PAUSE"; readonly series: number | null; readonly seconds: number }
  | { readonly kind: "RECOVERY"; readonly seconds: number };

export type ExerciseDurationKind = "exact" | "estimated" | "omitted";

export type ExerciseDurationResult = {
  readonly kind: ExerciseDurationKind;
  /** Somme des contributions chronométrées connues (pauses, travaux calculables). */
  readonly knownSeconds: number;
  readonly events: readonly LedgerEvent[];
  /** Absent si `omitted` : aucune valeur, aucun zéro. */
  readonly seconds?: number;
};

/** Paramètres dont le mode est connu : seuls calculables. */
type CalculableParameters = ExecutionParametersInput & { readonly mode: NonNullable<ExecutionParametersInput["mode"]> };

function requireMode(parameters: ExecutionParametersInput): CalculableParameters {
  if (parameters.mode === null) {
    throw new Error("Execution mode is required to calculate a duration.");
  }
  return parameters as CalculableParameters;
}

function workSeconds(parameters: CalculableParameters, target: number | null): number | null {
  if (parameters.mode === "DURATION") {
    return target;
  }
  if (parameters.mode === "REPETITIONS" && parameters.cadenceBeepIntervalSeconds > 0 && target !== null) {
    return target * parameters.cadenceBeepIntervalSeconds;
  }
  return null;
}

/**
 * Registre des phases prévues, après normalisation effective (N=1 → par
 * côté). `recoverySeconds > 0` remplace la toute dernière Pause physique,
 * une seule fois.
 */
export function buildExecutionLedger(
  input: ExecutionParametersInput,
  recoverySeconds: number = 0,
): readonly LedgerEvent[] {
  const parameters = normalizeEffective(requireMode(input));
  const rows = seriesRowsOf(parameters);
  const events: LedgerEvent[] = [];
  const work = (index: number, side: LedgerSide) =>
    events.push({ kind: "WORK", series: index + 1, side, seconds: workSeconds(parameters, rows[index]!.target) });
  const pause = (index: number, side: LedgerSide) =>
    events.push({ kind: "SERIES_PAUSE", series: index + 1, side, seconds: rows[index]!.pauseSeconds });

  if (!isBilateral(parameters.sideMode)) {
    rows.forEach((_, index) => {
      work(index, "NONE");
      pause(index, "NONE");
    });
  } else {
    const sides: readonly LedgerSide[] = parameters.sideMode === "RIGHT_LEFT" ? ["RIGHT", "LEFT"] : ["LEFT", "RIGHT"];
    if (parameters.sideOrder === "BY_SIDE") {
      sides.forEach((side, sideIndex) => {
        if (sideIndex > 0) {
          events.push({ kind: "SIDE_PAUSE", series: null, seconds: parameters.sideRecoverySeconds });
        }
        rows.forEach((_, index) => {
          work(index, side);
          pause(index, side);
        });
      });
    } else {
      rows.forEach((_, index) => {
        work(index, sides[0]!);
        events.push({ kind: "SIDE_PAUSE", series: index + 1, seconds: parameters.sideRecoverySeconds });
        work(index, sides[1]!);
        pause(index, sides[1]!);
      });
    }
  }

  if (recoverySeconds > 0) {
    events[events.length - 1] = { kind: "RECOVERY", seconds: recoverySeconds };
  }
  return events;
}

function summarize(mode: CalculableParameters["mode"], events: readonly LedgerEvent[]): ExerciseDurationResult {
  let knownSeconds = 0;
  let unknown = false;
  for (const event of events) {
    if (event.seconds === null) {
      unknown = true;
    } else {
      knownSeconds += event.seconds;
    }
  }
  const kind: ExerciseDurationKind = unknown ? "omitted" : mode === "REPETITIONS" ? "estimated" : "exact";
  return unknown ? { kind, knownSeconds, events } : { kind, knownSeconds, events, seconds: knownSeconds };
}

/** Total intrinsèque d'un Exercice (hors R, hors Compte à rebours/Fin). */
export function computeIntrinsicDuration(parameters: ExecutionParametersInput): ExerciseDurationResult {
  return summarize(requireMode(parameters).mode, buildExecutionLedger(parameters));
}

/** Durée d'occurrence : To = T − PN + R si R > 0, sinon To = T. */
export function computeOccurrenceDuration(
  parameters: ExecutionParametersInput,
  recoverySeconds: number,
): ExerciseDurationResult {
  return summarize(requireMode(parameters).mode, buildExecutionLedger(parameters, recoverySeconds));
}

/** Vrai si le mode est connu (aucun calcul n'est possible sur un mode « — »). */
export function isCalculable(parameters: ExecutionParametersInput): parameters is CalculableParameters {
  return parameters.mode !== null;
}

// --- Inversion « Durée totale » (Durée uniforme seulement, v13 §5) ---------

export const INVERSION_SERIES_MIN = 1;
export const INVERSION_SERIES_MAX = 99;

/** Vrai uniquement en Durée uniforme avec une cible renseignée. */
export function isTotalDurationInvertible(parameters: ExecutionParametersInput): boolean {
  return (
    parameters.mode === "DURATION" && parameters.series.kind === "UNIFORM" && parameters.series.target !== null
  );
}

function uniformWithCount<T extends ExecutionParametersInput>(parameters: T, count: number): T {
  if (parameters.series.kind !== "UNIFORM") {
    throw new Error("Total duration inversion is reserved to uniform series.");
  }
  return { ...parameters, series: { ...parameters.series, count } };
}

/** Total intrinsèque exact pour N Séries, N=1 normalisé par côté. */
export function totalDurationForSeriesCount(parameters: ExecutionParametersInput, count: number): number {
  const result = computeIntrinsicDuration(uniformWithCount(parameters, count));
  return result.knownSeconds;
}

export type TotalDurationInversion = {
  readonly seriesCount: number;
  readonly totalSeconds: number;
  /** Vrai seulement si le total réalisé diffère du total demandé (message d'ajustement). */
  readonly adjusted: boolean;
};

/**
 * Énumère N = 1..99 (N=1 normalisé), retient le total réalisable le plus
 * proche, égalité vers le N le plus grand. Jamais N=0 ni N=100.
 */
export function invertTotalDuration(
  parameters: ExecutionParametersInput,
  requestedSeconds: number,
): TotalDurationInversion {
  if (!isTotalDurationInvertible(parameters)) {
    throw new Error("Total duration inversion is reserved to uniform Duration mode.");
  }
  let best: { seriesCount: number; totalSeconds: number; distance: number } | null = null;
  for (let count = INVERSION_SERIES_MIN; count <= INVERSION_SERIES_MAX; count += 1) {
    const totalSeconds = totalDurationForSeriesCount(parameters, count);
    const distance = Math.abs(totalSeconds - requestedSeconds);
    if (best === null || distance <= best.distance) {
      best = { seriesCount: count, totalSeconds, distance };
    }
  }
  return {
    seriesCount: best!.seriesCount,
    totalSeconds: best!.totalSeconds,
    adjusted: best!.totalSeconds !== requestedSeconds,
  };
}

/** Bornes du sélecteur de total : extrêmes réalisables (N=1 et N=99). */
export function totalDurationRange(parameters: ExecutionParametersInput): { readonly min: number; readonly max: number } {
  const values = [INVERSION_SERIES_MIN, INVERSION_SERIES_MAX].map((count) =>
    totalDurationForSeriesCount(parameters, count),
  );
  return { min: Math.min(...values), max: Math.max(...values) };
}

/**
 * Plan complet d'UNE occurrence (v13 §5, Bip v2 §3) : durée d'occurrence
 * puis Compte à rebours et Fin propres, chacun UNE seule fois pour
 * l'Exercice complet (jamais par Série ni par côté). Les métriques
 * Catalogue/Composition gardent leur périmètre structurel et n'utilisent
 * pas ce total.
 */
export function computeExercisePlanDuration(
  parameters: ExecutionParametersInput,
  recoverySeconds: number,
): ExerciseDurationResult {
  const occurrence = computeOccurrenceDuration(parameters, recoverySeconds);
  const phases = parameters.countdownSeconds + parameters.endSeconds;
  const knownSeconds = occurrence.knownSeconds + phases;
  return occurrence.seconds === undefined
    ? { ...occurrence, knownSeconds }
    : { ...occurrence, knownSeconds, seconds: knownSeconds };
}

// --- Agrégation de Séance (Bip v2 §2) --------------------------------------

export type SessionDurationKind = "exact" | "estimated" | "lowerBound";

export type SessionDurationResult = {
  readonly kind: SessionDurationKind;
  readonly seconds: number;
};

export type SessionDurationContribution = {
  readonly result: ExerciseDurationResult;
  /** Nombre de passages (répétitions du Circuit pour la zone IN_TOUR, 1 sinon). */
  readonly multiplicity: number;
};

/**
 * Total de Séance : exact si tout est exact ; ≈ si au moins une estimation
 * et aucun inconnu ; ≥ (contributions connues) si au moins un inconnu. Les
 * pauses connues d'un Exercice `omitted` sont incluses, jamais un travail
 * inventé.
 */
export function aggregateSessionDuration(
  contributions: readonly SessionDurationContribution[],
): SessionDurationResult {
  let seconds = 0;
  let estimated = false;
  let unknown = false;
  for (const { result, multiplicity } of contributions) {
    seconds += result.knownSeconds * multiplicity;
    if (multiplicity > 0) {
      estimated = estimated || result.kind === "estimated";
      unknown = unknown || result.kind === "omitted";
    }
  }
  return { kind: unknown ? "lowerBound" : estimated ? "estimated" : "exact", seconds };
}

export type { ExecutionParameters };
export { seriesCountOf };
