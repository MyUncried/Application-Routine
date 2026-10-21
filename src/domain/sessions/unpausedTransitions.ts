/**
 * PRE-6 (story 4.3, D-301 — ch07 L495, ch10 L556, ch13 L1575) : frontières
 * où deux Exercices s'enchaînent sans pause, pour l'avertissement non
 * bloquant de la Composition. Fonction pure ; aucune nouvelle règle de
 * calcul : la lecture s'appuie sur le développement de la Composition
 * (`expandComposition`, story 1.3, AD-40) et sur la Pause terminale telle que
 * `executionCalculations.ts` la place.
 *
 * Une frontière est la transition entre deux occurrences `EXERCISE`
 * consécutives dans l'ordre d'exécution développé, transitions du Circuit
 * comprises (fin d'un Tour → début du suivant, fin du Circuit → occurrence
 * suivante, passages d'un Circuit de Séries). Elle est « sans pause » quand
 * l'occurrence précédente n'a :
 * - ni pause effective de transition : la dernière Pause de sa dernière série
 *   jouée (toutes ses séries en Tours et hors Circuit ; la série i au passage
 *   i en Séries), strictement positive ;
 * - ni Récupération positive après elle (R = 0 ou absente ne compte pas,
 *   AD-35).
 *
 * Un point d'arrêt à la frontière l'interrompt (reprise explicite, RM-191) :
 * aucune frontière n'est retenue. Une ancienne Récupération autonome
 * (`RECOVERY`) n'est pas un Exercice : elle sépare aussi les deux voisins.
 *
 * Règle par frontière, identique en Tours et en Séries : deux jeux
 * consécutifs de la MÊME occurrence (répétition en Tours d'une occurrence
 * seule dans le Circuit, passages de Séries où les autres exercices n'ont
 * plus de série) ne forment jamais une frontière — D-301 porte sur
 * l'enchaînement entre Exercices, aucun avertissement entre Séries. Une
 * Composition à une seule occurrence `EXERCISE` n'a donc, par construction,
 * aucune frontière. Lecture à confirmer par Hermann (J3).
 */

import { seriesRowsOf } from "@/domain/activities/ExecutionParameters";

import {
  expandComposition,
  type CompositionExpansionInput,
  type CompositionStep,
  type ExpandableOccurrence,
} from "./circuit";

/** Extrémité d'une frontière : occurrence, Tour ou passage (`null` hors Circuit), série jouée (Séries seulement). */
export type TransitionEnd = {
  readonly occurrenceId: string;
  readonly pass: number | null;
  readonly series: number | null;
};

/** Frontière sans pause entre deux Exercices consécutifs (D-301). */
export type UnpausedTransition = {
  readonly from: TransitionEnd;
  readonly to: TransitionEnd;
};

type OccurrenceStep = Extract<CompositionStep, { readonly kind: "OCCURRENCE" }>;

/**
 * Pause effective de transition d'une occurrence jouée : Pause de la dernière
 * série jouée (`series` en Séries, la dernière ligne sinon). En bilatéral, la
 * Pause terminale du registre est aussi celle de cette ligne.
 */
function transitionPauseSeconds(occurrence: ExpandableOccurrence, series: number | null): number {
  const rows = seriesRowsOf(occurrence.executionParameters);
  const row = series === null ? rows[rows.length - 1] : rows[series - 1];
  return row?.pauseSeconds ?? 0;
}

function endOf(step: OccurrenceStep): TransitionEnd {
  return { occurrenceId: step.occurrenceId, pass: step.pass, series: step.series };
}

/** Frontières sans pause de la Composition, dans l'ordre d'exécution développé (D-301). */
export function findUnpausedTransitions(input: CompositionExpansionInput): readonly UnpausedTransition[] {
  const byId = new Map(input.exercises.map((occurrence) => [occurrence.id, occurrence] as const));
  const transitions: UnpausedTransition[] = [];
  // Dernier Exercice joué qui n'a aucune pause après lui, tant qu'aucune étape ne l'en sépare.
  let pending: OccurrenceStep | null = null;

  for (const step of expandComposition(input)) {
    switch (step.kind) {
      case "RECOVERY":
      case "STOP_POINT":
        pending = null;
        break;
      case "OCCURRENCE": {
        const occurrence = byId.get(step.occurrenceId);
        if (occurrence === undefined || occurrence.type !== "EXERCISE") {
          pending = null;
          break;
        }
        // Deux jeux consécutifs de la même occurrence : jamais une frontière (Tours comme Séries).
        if (pending !== null && pending.occurrenceId !== step.occurrenceId) {
          transitions.push({ from: endOf(pending), to: endOf(step) });
        }
        // R positive : l'étape RECOVERY qui suit remet `pending` à `null`.
        pending = transitionPauseSeconds(occurrence, step.series) > 0 ? null : step;
        break;
      }
      default: {
        const unreachable: never = step;
        return unreachable;
      }
    }
  }
  return transitions;
}

/** Vrai si au moins une frontière s'enchaîne sans pause : l'avertissement D-301 s'affiche. */
export function hasUnpausedTransition(input: CompositionExpansionInput): boolean {
  return findUnpausedTransitions(input).length > 0;
}
