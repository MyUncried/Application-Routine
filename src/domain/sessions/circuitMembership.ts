/**
 * PRE-6 (story 2.3, AD-39) — raccord des opérations d'organisation de la
 * Composition (ajout, déplacement, suppression) aux opérations de Circuit de
 * l'epic 1 (`prepareEnterCircuit` / `enterCircuit`, `exitCircuit`), sans les
 * modifier.
 *
 * L'appelant calcule la nouvelle collection d'occurrences par l'opération de
 * Composition habituelle (`appendActivityAfterLastDisplayed`,
 * `moveOccurrence`, `removeOccurrence`) ; `settleCircuitMembership` compare
 * ensuite l'appartenance au Circuit avant / après :
 *
 * - une occurrence qui ARRIVE dans le Circuit (nouvelle, ou venue d'une autre
 *   portée) est adaptée à N (`enterCircuit` : Séries seulement, inchangée en
 *   Tours) ; ses pertes sont calculées AVANT toute mutation
 *   (`prepareEnterCircuit`) — l'appelant demande confirmation si `losses`
 *   n'est pas vide et n'écrit rien en cas d'annulation ;
 * - une occurrence qui QUITTE le Circuit (sortie ou suppression) perd sa
 *   réserve (`exitCircuit`) ; son nombre de séries et ses paramètres sont
 *   conservés, sans message.
 *
 * Fonction pure, sans dépendance React ni SQLite. Le Catalogue n'est jamais
 * concerné : seules les occurrences du brouillon sont lues et produites.
 */

import {
  circuitBoundCount,
  circuitBoundOf,
  enterCircuit,
  exitCircuit,
  prepareEnterCircuit,
  type CircuitLoss,
} from "./circuit";
import type { SessionDraft, SessionDraftExercise } from "./SessionDraft";

export type CircuitMembershipSettlement = {
  /** N auquel les occurrences entrantes sont adaptées (celui lu par `enterCircuit`), à afficher dans le dialogue. */
  readonly targetCount: number;
  /** Occurrences après adaptation ; `nextExercises` lui-même si aucune n'est adaptée. */
  readonly exercises: readonly SessionDraftExercise[];
  /** Pertes des occurrences entrantes, calculées sur leur état avant adaptation ; vide = aucune confirmation. */
  readonly losses: readonly CircuitLoss[];
  /**
   * Champs du brouillon à écrire en plus des occurrences : `circuitSeriesReserve`
   * seulement si une sortie a retiré une réserve (clé présente, éventuellement
   * `undefined`, pour qu'une fusion `{ ...current, ...patch }` l'efface).
   */
  readonly reservePatch: Pick<SessionDraft, "circuitSeriesReserve"> | Record<string, never>;
};

/**
 * Règle l'appartenance au Circuit entre `draft.exercises` (avant) et
 * `nextExercises` (après une opération de Composition). Voir l'en-tête.
 */
export function settleCircuitMembership(
  draft: SessionDraft,
  nextExercises: readonly SessionDraftExercise[],
): CircuitMembershipSettlement {
  const previousById = new Map(draft.exercises.map((exercise) => [exercise.id, exercise]));
  const nextById = new Map(nextExercises.map((exercise) => [exercise.id, exercise]));

  let reserveDraft = draft;
  for (const exercise of draft.exercises) {
    const next = nextById.get(exercise.id);
    if (exercise.structuralPosition === "IN_TOUR" && next?.structuralPosition !== "IN_TOUR") {
      reserveDraft = exitCircuit(reserveDraft, exercise);
    }
  }

  const losses: CircuitLoss[] = [];
  let changed = false;
  const adapted = nextExercises.map((exercise) => {
    if (
      exercise.structuralPosition !== "IN_TOUR" ||
      previousById.get(exercise.id)?.structuralPosition === "IN_TOUR"
    ) {
      return exercise;
    }
    losses.push(...prepareEnterCircuit(draft, exercise).losses);
    const entered = enterCircuit(draft, exercise);
    if (entered !== exercise) {
      changed = true;
    }
    return entered;
  });

  return {
    targetCount: circuitBoundCount(circuitBoundOf(draft)),
    exercises: changed ? adapted : nextExercises,
    losses,
    reservePatch:
      reserveDraft === draft ? {} : { circuitSeriesReserve: reserveDraft.circuitSeriesReserve },
  };
}

/**
 * Réserve de Circuit de la copie d'une occurrence (duplication, PRE-6 story 2.3) : la copie
 * reçoit une copie profonde de l'entrée de réserve de sa source, pour qu'une augmentation
 * ultérieure de N restaure les mêmes lignes dans les deux. `{}` si la source n'en a pas.
 */
export function copyCircuitReserveEntry(
  draft: SessionDraft,
  sourceId: string,
  copyId: string,
): Pick<SessionDraft, "circuitSeriesReserve"> | Record<string, never> {
  const reserve = draft.circuitSeriesReserve;
  const rows = reserve?.[sourceId];
  if (reserve === undefined || rows === undefined) {
    return {};
  }
  return {
    circuitSeriesReserve: {
      ...reserve,
      [copyId]: rows.map((row) => ({ ...row, target: { ...row.target } })),
    },
  };
}
