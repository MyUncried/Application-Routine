/**
 * PRE-8 (story B.2, CE-MVT-01 §12, DSF Mouvements §2, MVT-09) — structure des phases du
 * Mouvement dans sa fiche : libellés et ordre seulement, jamais de durée (les durées sont des
 * paramètres locaux des Exercices).
 * [Remplacé le 31/10/2026, PRE-9 A.2b — décision de Hermann du 30/10/2026 (« les durées de la phase
 * peuvent faire partie du mouvement ») : chaque phase porte en plus une durée par défaut FACULTATIVE
 * (`setMovementPhaseDuration`), qui suit son identité ; les durées de chaque Exercice restent ses
 * paramètres locaux.]
 *
 * Une phase garde son identité (`id`) quand elle est renommée ou déplacée ; une phase ajoutée
 * reçoit le compteur MONOTONE du Mouvement (`nextPhaseId`, MFN-02), qui ne recule jamais : une
 * identité retirée n'est jamais réallouée. Fonctions pures.
 */

import type { MovementPhase } from "./Movement";

export type MovementPhaseList = {
  readonly phases: readonly MovementPhase[];
  readonly nextPhaseId: number;
};

/** Ajoute une phase en dernier, avec l'identité suivante du compteur. */
export function addMovementPhase(list: MovementPhaseList, label: string): MovementPhaseList {
  return {
    phases: [...list.phases, { id: list.nextPhaseId, label }],
    nextPhaseId: list.nextPhaseId + 1,
  };
}

/** Renomme la phase `id` ; identité et place conservées. */
export function renameMovementPhase(list: MovementPhaseList, id: number, label: string): MovementPhaseList {
  return { ...list, phases: list.phases.map((phase) => (phase.id === id ? { ...phase, label } : phase)) };
}

/**
 * PRE-9 A.2b : durée par défaut de la phase `id` (1..3535 s), ou `null` pour la retirer ; identité,
 * libellé et place conservés. La borne est contrôlée par l'appelant (roue bornée) et par
 * `validateMovement`.
 */
export function setMovementPhaseDuration(list: MovementPhaseList, id: number, durationSeconds: number | null): MovementPhaseList {
  return { ...list, phases: list.phases.map((phase) => (phase.id === id ? { ...phase, durationSeconds } : phase)) };
}

/** Retire la phase `id` ; le compteur ne recule pas. */
export function removeMovementPhase(list: MovementPhaseList, id: number): MovementPhaseList {
  return { ...list, phases: list.phases.filter((phase) => phase.id !== id) };
}

/** Déplace la phase `id` au rang `to` (borné) ; les identités suivent leurs phases. */
export function moveMovementPhase(list: MovementPhaseList, id: number, to: number): MovementPhaseList {
  const from = list.phases.findIndex((phase) => phase.id === id);
  if (from < 0) {
    return list;
  }
  const target = Math.max(0, Math.min(list.phases.length - 1, to));
  if (target === from) {
    return list;
  }
  const phases = [...list.phases];
  const [moved] = phases.splice(from, 1);
  phases.splice(target, 0, moved!);
  return { ...list, phases };
}

/**
 * Phases enregistrables : libellés rognés, phases sans libellé écartées (une ligne vide laissée
 * en saisie n'est pas une phase). L'ordre et les identités sont conservés.
 */
export function savableMovementPhases(phases: readonly MovementPhase[]): readonly MovementPhase[] {
  return phases.map((phase) => ({ ...phase, label: phase.label.trim() })).filter((phase) => phase.label.length > 0);
}
