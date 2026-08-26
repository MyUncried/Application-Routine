/**
 * Calculs métier déterministes (§10, §12.5) : Nombre d'Activités et Durée
 * estimée.
 *
 * Ces fonctions n'acceptent qu'une entrée métier minimale (« Facts »),
 * jamais une ligne SQL ni un type d'infrastructure. Deux chemins équivalents
 * peuvent alimenter ces Facts, sans requête supplémentaire :
 * - une projection depuis l'agrégat `Session` (`toEstimatedDurationFacts`,
 *   `toActivityCountFacts`) ;
 * - une conversion directe des valeurs déjà extraites par une projection
 *   SQL de résumé (ex. `listActive`), effectuée par l'appelant.
 *
 * Pour cette tranche (une seule Activité IN_TOUR, Tour ×1, Cycle ×1, aucune
 * pause), le Nombre d'Activités de la Composition vaut toujours `1` ; les
 * formules restent néanmoins exprimées pour rester correctes le jour où ces
 * cardinalités cesseront d'être figées.
 */

import type { Session } from "./Session";

export type EstimatedDurationFacts = {
  readonly initialCountdownSeconds: number;
  readonly finalPhaseSeconds: number;
  readonly activityDurationSeconds: number;
};

export type ActivityCountFacts = {
  readonly compositionActivityCount: number;
  readonly tourRepeatCount: number;
};

/** Durée estimée = compte à rebours initial + durée(s) d'Activité(s) + fin de séance. */
export function computeEstimatedDurationSeconds(facts: EstimatedDurationFacts): number {
  return facts.initialCountdownSeconds + facts.activityDurationSeconds + facts.finalPhaseSeconds;
}

/** Nombre d'Activités de la Composition (ne multiplie pas par les répétitions du Tour). */
export function computeActivityCount(facts: ActivityCountFacts): number {
  return facts.compositionActivityCount;
}

/** Nombre total d'Activités à exécuter, après développement des répétitions du Tour. */
export function computeTotalActivitiesToExecute(facts: ActivityCountFacts): number {
  return facts.compositionActivityCount * facts.tourRepeatCount;
}

export function toEstimatedDurationFacts(session: Session): EstimatedDurationFacts {
  return {
    initialCountdownSeconds: session.initialCountdownSeconds,
    finalPhaseSeconds: session.finalPhaseSeconds,
    activityDurationSeconds: session.cycle.tour.exercise.durationSeconds,
  };
}

export function toActivityCountFacts(session: Session): ActivityCountFacts {
  return {
    compositionActivityCount: 1,
    tourRepeatCount: session.cycle.tour.repeatCount,
  };
}
