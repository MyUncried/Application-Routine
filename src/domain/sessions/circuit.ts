/**
 * PRE-6 (story 1.1, AD-34) — vue « Circuit » du Tour technique unique
 * (`cycle.tour`, RM-025, D-209) : une ORGANISATION (`CircuitNature`) et une
 * CONDITION DE FIN (`CircuitBound`), deux notions distinctes.
 *
 * - La nature dit comment le contenu se répète : Tours (contenu interne × N)
 *   ou Séries (série i de chaque exercice, i = 1..N). Elle est persistée
 *   (`tours.nature`, `migration011`) ; une séance antérieure se lit en Tours.
 * - La borne `COUNT` EST le `repeatCount` existant (`tourRepeatCount`,
 *   1..99, défaut 1) : aucun second compte concurrent (ch09 L574). Elle n'est
 *   pas persistée : `COUNT` reste implicite tant qu'aucun format n'existe.
 *
 * `CircuitBound` est une union FERMÉE : toute lecture passe par un `switch`
 * exhaustif sur `kind` (garde `never`), pour qu'une future variante (formats :
 * Durée, Max) soit additive et signalée par le compilateur. PRE-6 n'en crée
 * aucune.
 *
 * Développement de la Composition selon la nature (`expandComposition`,
 * story 1.3, AD-40) ; futur foyer des opérations de Circuit (AD-39, story
 * 1.4). Fonctions pures,
 * sans dépendance React ni SQLite.
 */

import { seriesCountOf, type ExecutionMode, type ExecutionSeries } from "@/domain/activities/ExecutionParameters";

import { DEFAULT_TOUR_REPEAT_COUNT } from "./defaults";
import type { ActivityType, StructuralPosition } from "./Session";
import { orderStopPointsByScope, type StopPoint } from "./StopPoint";

/** Organisation du Circuit (ch10 L686-693) : Tours ou Séries. */
export type CircuitNature = "TOURS" | "SERIES";

/** Valeurs reconnues, dans l'ordre du `CHECK` de `tours.nature` (`migration011`). */
export const CIRCUIT_NATURES: readonly CircuitNature[] = ["TOURS", "SERIES"];

/** Nature d'une séance sans nature explicite : Circuit de Tours (« compatibilité tours par défaut », ch12 L1715). */
export const DEFAULT_CIRCUIT_NATURE: CircuitNature = "TOURS";

/** Garde de type d'une nature reconnue. */
export function isCircuitNature(value: unknown): value is CircuitNature {
  return typeof value === "string" && (CIRCUIT_NATURES as readonly string[]).includes(value);
}

/**
 * Condition de fin du Circuit (ch10 L1102-1108). Seule variante de la séance
 * libre : `COUNT`, dont `count` est le `repeatCount` du Tour (1..99).
 */
export type CircuitBound = { readonly kind: "COUNT"; readonly count: number };

/** Borne d'un brouillon (ou d'une entrée) : dérivée de `tourRepeatCount`, jamais stockée. */
export function circuitBoundOf(draft: { readonly tourRepeatCount?: number }): CircuitBound {
  return { kind: "COUNT", count: draft.tourRepeatCount ?? DEFAULT_TOUR_REPEAT_COUNT };
}

/** Nombre de passages (Tours ou Séries) d'une borne — `switch` exhaustif sur `kind`. */
export function circuitBoundCount(bound: CircuitBound): number {
  switch (bound.kind) {
    case "COUNT":
      return bound.count;
    default: {
      const unreachable: never = bound.kind;
      return unreachable;
    }
  }
}

// --- Développement de la Composition (story 1.3, AD-40) ----------------------

/** Occurrence vue par le développement : portée, ordre (ordre du tableau), séries et récupération. */
export type ExpandableOccurrence = {
  readonly id: string;
  readonly structuralPosition: StructuralPosition;
  /** Récupération de l'occurrence : seule une valeur positive produit une étape (AD-35). */
  readonly postActivityRecoverySeconds?: number | null;
  /** Ancienne Récupération autonome (`RECOVERY`) : lue défensivement, comme pour la durée. */
  readonly type: ActivityType;
  readonly executionParameters: { readonly mode: ExecutionMode | null; readonly series: ExecutionSeries };
};

/**
 * Occurrence hors règle des passages en Séries : ancienne Récupération
 * autonome ou Mode inconnu. Elle est jouée en entier à chaque passage,
 * exactement comme `calculations.ts` la compte (multiplicité N).
 */
function isLegacySeriesOccurrence(occurrence: ExpandableOccurrence): boolean {
  return occurrence.type === "RECOVERY" || occurrence.executionParameters.mode === null;
}

/**
 * Étape du développement. `pass` = numéro de Tour (Tours) ou de passage
 * (Séries) pour un élément interne au Circuit, `null` pour un élément
 * externe. `series` = série i jouée au passage i (Séries seulement), `null`
 * sinon (Tours : l'occurrence joue toutes ses séries).
 */
export type CompositionStep =
  | {
      readonly kind: "OCCURRENCE";
      readonly occurrenceId: string;
      readonly scope: StructuralPosition;
      readonly pass: number | null;
      readonly series: number | null;
    }
  | {
      readonly kind: "RECOVERY";
      readonly occurrenceId: string;
      readonly scope: StructuralPosition;
      readonly pass: number | null;
      readonly seconds: number;
    }
  | {
      readonly kind: "STOP_POINT";
      readonly stopPointId: string;
      readonly scope: StructuralPosition;
      readonly pass: number | null;
    };

export type CompositionExpansionInput = {
  /** Occurrences dans l'ordre affiché (avant → dans → après le Circuit). */
  readonly exercises: readonly ExpandableOccurrence[];
  readonly stopPoints?: readonly StopPoint[];
  readonly circuitNature?: CircuitNature;
  readonly tourRepeatCount?: number;
};

/**
 * Développement PUR de la Composition selon la nature du Circuit (AD-40,
 * ch10 L651) — sert aux durées, comptes et volumes ; ce n'est pas un plan
 * d'exécution (aucun moteur en PRE-6).
 *
 * - Hors Circuit (`BEFORE_TOUR`, `AFTER_TOUR`) : une seule fois.
 * - Tours : contenu interne × N, à l'identique à chaque Tour.
 * - Séries : pour i = 1..N, chaque exercice du Circuit dans l'ordre, sa
 *   seule série i ; un exercice qui a moins de N séries ne contribue que ses
 *   séries existantes, et ses éléments rattachés ne sont produits qu'avec
 *   lui. Une ancienne Récupération autonome ou un Mode inconnu est joué en
 *   entier à chaque passage (`series = null`), comme la durée le compte.
 * - Un Tour ou passage où aucune occurrence ne joue est omis en entier
 *   (points `position = 0` compris).
 *
 * À un emplacement : Exercice → Récupération positive → Point d'arrêt
 * (rattaché à l'occurrence qui le précède, `position = p`, ARB-3). Un point
 * `position = 0` est en tête de sa portée (répété en tête de chaque Tour ou
 * passage s'il est interne). R = 0 ou absente ne produit aucune étape.
 */
export function expandComposition(input: CompositionExpansionInput): readonly CompositionStep[] {
  const nature = input.circuitNature ?? DEFAULT_CIRCUIT_NATURE;
  const passes = circuitBoundCount(circuitBoundOf(input));
  const points = input.stopPoints ?? [];
  const steps: CompositionStep[] = [];

  const pointsAt = (scope: StructuralPosition, position: number, pass: number | null) => {
    for (const point of orderStopPointsByScope(points, scope)) {
      if (point.position === position) {
        steps.push({ kind: "STOP_POINT", stopPointId: point.id, scope, pass });
      }
    }
  };
  const occurrence = (
    exercise: ExpandableOccurrence,
    rank: number,
    pass: number | null,
    series: number | null,
  ) => {
    const scope = exercise.structuralPosition;
    steps.push({ kind: "OCCURRENCE", occurrenceId: exercise.id, scope, pass, series });
    const recovery = exercise.postActivityRecoverySeconds ?? 0;
    if (recovery > 0) {
      steps.push({ kind: "RECOVERY", occurrenceId: exercise.id, scope, pass, seconds: recovery });
    }
    pointsAt(scope, rank, pass);
  };
  const outside = (scope: StructuralPosition) => {
    pointsAt(scope, 0, null);
    input.exercises
      .filter((exercise) => exercise.structuralPosition === scope)
      .forEach((exercise, index) => occurrence(exercise, index + 1, null, null));
  };

  outside("BEFORE_TOUR");
  const inCircuit = input.exercises.filter((exercise) => exercise.structuralPosition === "IN_TOUR");
  for (let pass = 1; pass <= passes; pass += 1) {
    // Occurrences jouées à ce passage : [occurrence, rang dans la portée, série jouée].
    const plays: [ExpandableOccurrence, number, number | null][] = [];
    switch (nature) {
      case "TOURS":
        inCircuit.forEach((exercise, index) => plays.push([exercise, index + 1, null]));
        break;
      case "SERIES":
        inCircuit.forEach((exercise, index) => {
          if (isLegacySeriesOccurrence(exercise)) {
            // Même lecture défensive que la durée (`calculations.ts`) : à chaque passage, en entier.
            plays.push([exercise, index + 1, null]);
          } else if (seriesCountOf(exercise.executionParameters) >= pass) {
            plays.push([exercise, index + 1, pass]);
          }
        });
        break;
      default: {
        const unreachable: never = nature;
        return unreachable;
      }
    }
    // Un passage où aucune occurrence ne joue est omis en entier, points de tête compris.
    if (plays.length === 0) {
      continue;
    }
    pointsAt("IN_TOUR", 0, pass);
    for (const [exercise, rank, series] of plays) {
      occurrence(exercise, rank, pass, series);
    }
  }
  outside("AFTER_TOUR");
  return steps;
}
