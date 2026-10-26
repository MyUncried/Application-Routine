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
 * PRE-4 (story 2.1, AD-5) : résultat typé à cinq issues, par priorité —
 * `incomplete` dès qu'une Cible est `UNSET` (H10, Q30 ; jamais lue comme 0
 * ni convertie en `FAILURE`) ; `exact` (Durée) ou `estimated` (Répétitions
 * avec Bip) si tout travail est connu ou estimable ; `omitted` en
 * Répétitions avec Bip 0 ou si toutes les Cibles sont `FAILURE` (RM-072) ;
 * sinon `lowerBound` (mélange de travail connu et de `FAILURE`, RM-129,
 * RM-132, P25 : ≥ prime sur ≈), qui porte le montant connu. `omitted` et
 * `incomplete` ne portent aucun montant, mais leurs contributions connues
 * (`knownSeconds` : travail connu, toutes les Pauses et PC) restent
 * disponibles pour l'agrégation de Séance (`lowerBound`). Compte à rebours
 * et Fin propres sont exclus du total intrinsèque.
 *
 * PRE-7 (R-2, D-446 §4, PHC-20261026) : en Répétitions, un motif de phases
 * complet rend le travail estimable — Ti = Ri × durée du motif (« ≈ »),
 * prioritaire sur l'estimation par la cadence (un passage du motif est une
 * répétition guidée). En Durée, Ti reste la cible, indépendante du motif.
 */

import {
  hasMissingPhaseDuration,
  isBilateral,
  normalizeEffective,
  seriesCountOf,
  seriesRowsOf,
  type ExecutionParameters,
  type ExecutionParametersInput,
  type SeriesRow,
  type SeriesTarget,
} from "./ExecutionParameters";
import { nominalGuidanceSeconds, workPhasesCycleSeconds } from "./phaseGuidance";

export type LedgerSide = "NONE" | "RIGHT" | "LEFT";

export type LedgerEvent =
  | { readonly kind: "WORK"; readonly series: number; readonly side: LedgerSide; readonly seconds: number | null }
  | { readonly kind: "SERIES_PAUSE"; readonly series: number; readonly side: LedgerSide; readonly seconds: number }
  | { readonly kind: "SIDE_PAUSE"; readonly series: number | null; readonly seconds: number }
  | { readonly kind: "RECOVERY"; readonly seconds: number };

export type ExerciseDurationKind = "exact" | "estimated" | "lowerBound" | "omitted" | "incomplete";

export type ExerciseDurationResult = {
  readonly kind: ExerciseDurationKind;
  /** Somme des contributions chronométrées connues (pauses, travaux calculables). */
  readonly knownSeconds: number;
  readonly events: readonly LedgerEvent[];
  /**
   * Montant de la Durée totale : présent pour `exact`, `estimated` et
   * `lowerBound` (montant connu) ; absent pour `omitted` et `incomplete` :
   * aucune valeur, aucun zéro.
   */
  readonly seconds?: number;
};

/**
 * Vrai si la contribution rend un agrégat partiel (≥) : travail inconnu
 * (`lowerBound`, `omitted`) ou Cible à renseigner (`incomplete`, Q30).
 */
export function isPartialContribution(kind: ExerciseDurationKind): boolean {
  switch (kind) {
    case "exact":
    case "estimated":
      return false;
    case "lowerBound":
    case "omitted":
    case "incomplete":
      return true;
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
  }
}

/** Vrai si la nature porte un montant de Durée totale affichable (`seconds`). */
export function hasDurationAmount(kind: ExerciseDurationKind): boolean {
  switch (kind) {
    case "exact":
    case "estimated":
    case "lowerBound":
      return true;
    case "omitted":
    case "incomplete":
      return false;
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
  }
}

/** Paramètres dont le mode est connu : seuls calculables. */
type CalculableParameters = ExecutionParametersInput & { readonly mode: NonNullable<ExecutionParametersInput["mode"]> };

function requireMode(parameters: ExecutionParametersInput): CalculableParameters {
  if (parameters.mode === null) {
    throw new Error("Execution mode is required to calculate a duration.");
  }
  return parameters as CalculableParameters;
}

/**
 * Travail d'une Série. PRE-4 (story 1.1) : seule une Cible `NUMBER` porte un
 * travail connu ; une Cible `FAILURE` ou `UNSET` a un travail inconnu, même
 * avec un Bip (l'ancien mode « à l'échec » n'était jamais estimé). La
 * nature est qualifiée par `summarize` (story 2.1).
 */
function workSeconds(parameters: CalculableParameters, target: SeriesTarget): number | null {
  if (target.kind !== "NUMBER") {
    return null;
  }
  if (parameters.mode === "DURATION") {
    return target.value;
  }
  // D-446 §4 : durée nominale du guidage = nombre cible × durée du motif (règle de `phaseGuidance.ts`).
  const nominal = nominalGuidanceSeconds(parameters.mode, target, parameters.series.workPhases);
  if (nominal !== null) {
    return nominal;
  }
  if (parameters.mode === "REPETITIONS" && parameters.cadenceBeepIntervalSeconds > 0) {
    return target.value * parameters.cadenceBeepIntervalSeconds;
  }
  return null;
}

/**
 * PRE-7 (D-446) : vrai si le travail d'une Cible `NUMBER` est connu ou estimable — Durée,
 * ou Répétitions avec un motif de phases complet ou une cadence.
 */
export function isWorkEstimable(parameters: ExecutionParametersInput): boolean {
  return (
    parameters.mode === "DURATION" ||
    (parameters.mode === "REPETITIONS" &&
      (parameters.cadenceBeepIntervalSeconds > 0 || workPhasesCycleSeconds(parameters.series.workPhases) !== null))
  );
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

/**
 * Qualifie la nature (story 2.1, AC2, AC5) à partir des Cibles effectives et
 * du registre, sans recalculer aucun montant : `knownSeconds` est toujours
 * la somme des phases connues du registre (Récupération substituée comprise).
 */
function summarize(input: ExecutionParametersInput, events: readonly LedgerEvent[]): ExerciseDurationResult {
  const parameters = normalizeEffective(requireMode(input));
  return summarizeTargets(parameters, seriesRowsOf(parameters).map((row) => row.target), events);
}

/**
 * Qualification commune : `targets` = Cibles effectivement parcourues par le
 * registre (toutes les Séries pour une occurrence ; les seules séries jouées
 * pour un Circuit de Séries, PRE-6 story 1.3).
 */
function summarizeTargets(
  parameters: CalculableParameters,
  targets: readonly SeriesTarget[],
  events: readonly LedgerEvent[],
): ExerciseDurationResult {
  let knownSeconds = 0;
  let unknown = false;
  for (const event of events) {
    if (event.seconds === null) {
      unknown = true;
    } else {
      knownSeconds += event.seconds;
    }
  }
  let kind: ExerciseDurationKind;
  // PRE-7 (D-446, MFN-08) : une durée de phase manquante (frère incomplet) ne force plus la Cible
  // à `UNSET` ; elle rend la durée incomplète avec la même priorité.
  // PRE-7 (D-448, PH-5, recette JA2 du 26/10/2026) : en Durée, le total ne dépend pas des phases
  // (`workSeconds` ne lit que la Cible) ; une phase vide ne le rend plus incomplet. Le signalement
  // « Paramètres à compléter. » et le refus d'enregistrement lisent `hasMissingPhaseDuration` à
  // part. En Répétitions (PHC-20261026), aucune estimation tant qu'une durée manque.
  if (
    targets.some((target) => target.kind === "UNSET") ||
    (parameters.mode !== "DURATION" && hasMissingPhaseDuration(parameters))
  ) {
    kind = "incomplete";
  } else if (!unknown) {
    kind = parameters.mode === "REPETITIONS" ? "estimated" : "exact";
  } else if (!isWorkEstimable(parameters) || targets.every((target) => target.kind === "FAILURE")) {
    kind = "omitted";
  } else {
    kind = "lowerBound";
  }
  return hasDurationAmount(kind) ? { kind, knownSeconds, events, seconds: knownSeconds } : { kind, knownSeconds, events };
}

/** Total intrinsèque d'un Exercice (hors R, hors Compte à rebours/Fin). */
export function computeIntrinsicDuration(parameters: ExecutionParametersInput): ExerciseDurationResult {
  return summarize(parameters, buildExecutionLedger(parameters));
}

/** Durée d'occurrence : To = T − PN + R si R > 0, sinon To = T. */
export function computeOccurrenceDuration(
  parameters: ExecutionParametersInput,
  recoverySeconds: number,
): ExerciseDurationResult {
  return summarize(parameters, buildExecutionLedger(parameters, recoverySeconds));
}

/**
 * PRE-6 (story 1.3, AD-40, ch10 L651) — registre d'UN exercice dans un
 * Circuit de Séries : pour i = 1..`passages`, sa seule série i (un exercice
 * qui a moins de `passages` séries ne contribue que ses séries existantes).
 * Chaque passage se termine par Pi, remplacée par R si R > 0 :
 * - unilatéral : Ti + Pi (ou Ti + R) ;
 * - bilatéral : côté de départ → PC → autre côté → Pi, soit 2Ti + PC + Pi
 *   (ou 2Ti + PC + R), aucun Pi avant PC — aussi pour N = 1 et quel que soit
 *   l'ordre des côtés réglé, qui n'est pas réécrit.
 * R = 0 ou absente ne remplace rien. `buildExecutionLedger` n'est pas touché.
 *
 * `normalizeEffective` n'est volontairement PAS appliqué : il réécrirait
 * l'ordre des côtés à N = 1, alors qu'un passage joue toujours ses deux
 * côtés à la suite et que le réglage doit rester tel quel.
 */
export function buildSeriesCircuitLedger(
  input: ExecutionParametersInput,
  recoverySeconds: number,
  passages: number,
): readonly LedgerEvent[] {
  const parameters = requireMode(input);
  return seriesCircuitLedger(parameters, playedSeriesRows(parameters, passages), recoverySeconds);
}

/** Séries jouées en Circuit de Séries : les `passages` premières lignes existantes. */
function playedSeriesRows(parameters: CalculableParameters, passages: number): readonly SeriesRow[] {
  return seriesRowsOf(parameters).slice(0, Math.max(0, passages));
}

function seriesCircuitLedger(
  parameters: CalculableParameters,
  rows: readonly SeriesRow[],
  recoverySeconds: number,
): readonly LedgerEvent[] {
  const bilateral = isBilateral(parameters.sideMode);
  const sides: readonly LedgerSide[] = !bilateral
    ? ["NONE"]
    : parameters.sideMode === "RIGHT_LEFT"
      ? ["RIGHT", "LEFT"]
      : ["LEFT", "RIGHT"];
  const events: LedgerEvent[] = [];
  rows.forEach((row, index) => {
    const series = index + 1;
    const seconds = workSeconds(parameters, row.target);
    events.push({ kind: "WORK", series, side: sides[0]!, seconds });
    if (bilateral) {
      events.push({ kind: "SIDE_PAUSE", series, seconds: parameters.sideRecoverySeconds });
      events.push({ kind: "WORK", series, side: sides[1]!, seconds });
    }
    events.push(
      recoverySeconds > 0
        ? { kind: "RECOVERY", seconds: recoverySeconds }
        : { kind: "SERIES_PAUSE", series, side: sides[sides.length - 1]!, seconds: row.pauseSeconds },
    );
  });
  return events;
}

/**
 * PRE-6 (story 1.3) — total des passages d'UN exercice dans un Circuit de
 * Séries (`buildSeriesCircuitLedger`), qualifié sur les seules séries jouées
 * (exact / ≈ / ≥, mêmes règles que `summarize`). Multiplicité 1 dans
 * l'agrégat de Séance : les passages y sont déjà développés.
 */
export function computeSeriesCircuitOccurrenceDuration(
  input: ExecutionParametersInput,
  recoverySeconds: number,
  passages: number,
): ExerciseDurationResult {
  const parameters = requireMode(input);
  const rows = playedSeriesRows(parameters, passages);
  const events = seriesCircuitLedger(parameters, rows, recoverySeconds);
  return summarizeTargets(
    parameters,
    rows.map((row) => row.target),
    events,
  );
}

/** Vrai si le mode est connu (aucun calcul n'est possible sur un mode « — »). */
export function isCalculable(parameters: ExecutionParametersInput): parameters is CalculableParameters {
  return parameters.mode !== null;
}

// --- Inversion « Durée totale » (Durée uniforme seulement, v13 §5) ---------

export const INVERSION_SERIES_MIN = 1;
export const INVERSION_SERIES_MAX = 99;

/**
 * Vrai si et seulement si Mode Durée, Régime identiques, Cible numérique
 * (`NUMBER`) et N non hérité (story 2.1, AC6, P42). `inheritedSeriesCount`
 * n'est qu'une entrée : PRE-4 ne produit ni ne persiste aucun N hérité
 * (repris par la story 3.2, AC14) ; `false` par défaut.
 */
export function isTotalDurationInvertible(
  parameters: ExecutionParametersInput,
  inheritedSeriesCount: boolean = false,
): boolean {
  return (
    !inheritedSeriesCount &&
    parameters.mode === "DURATION" &&
    parameters.series.kind === "UNIFORM" &&
    parameters.series.target.kind === "NUMBER"
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
  inheritedSeriesCount: boolean = false,
): TotalDurationInversion {
  if (inheritedSeriesCount) {
    throw new Error("Total duration inversion is unavailable for an inherited series count.");
  }
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
 * et aucun inconnu ; ≥ (contributions connues) si au moins une contribution
 * est `lowerBound`, `omitted` ou `incomplete` (story 2.1, AC9). Les pauses
 * connues d'un Exercice `omitted` ou `incomplete` sont incluses, jamais un
 * travail inventé.
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
      unknown = unknown || isPartialContribution(result.kind);
    }
  }
  return { kind: unknown ? "lowerBound" : estimated ? "estimated" : "exact", seconds };
}

export type { ExecutionParameters };
export { seriesCountOf };
