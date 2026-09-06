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
 * T01-S09 : le Nombre d'Activités de la Composition n'est plus figé à `1` —
 * `Session.cycle.tour.exercises` est une collection ordonnée. La formule de
 * durée par Activité reprend exactement celle déjà établie par
 * `formatCompositionSummary` (`compositionPresentation.ts`) pour le
 * brouillon : mode Durée, `seriesCount × durationSeconds + seriesCount ×
 * pauseSeconds` ; mode Répétitions, aucune durée conventionnelle pour
 * l'Exercice lui-même mais ses pauses restent comptées
 * (`seriesCount × pauseSeconds`), et la durée totale devient alors une borne
 * minimale (RM-072) — jamais présentée comme exacte.
 */

import type { Session } from "./Session";

export type EstimatedDurationFacts = {
  readonly initialCountdownSeconds: number;
  readonly finalPhaseSeconds: number;
  readonly activityDurationSeconds: number;
  /** `true` dès qu'au moins une Activité contribuant à `activityDurationSeconds` est en mode Répétitions (RM-072). */
  readonly isLowerBoundEstimate: boolean;
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
  let activityDurationSeconds = 0;
  let isLowerBoundEstimate = false;

  for (const activity of session.cycle.tour.exercises) {
    // Une Récupération (T01-S10, D-041) est toujours chronométrée : elle
    // contribue sa seule durée, jamais multipliée par des Séries, jamais
    // suivie d'une pause après Série.
    if (activity.type === "RECOVERY") {
      activityDurationSeconds += activity.durationSeconds ?? 0;
      continue;
    }
    const seriesCount = activity.seriesCount ?? 0;
    // `REPETITIONS` comme `TO_FAILURE` (T01-S10, D-111/D-112) : aucune durée
    // conventionnelle pour l'Exercice lui-même, mais la durée totale devient
    // une borne minimale `≥` (jamais présentée comme exacte).
    if (activity.executionMode === "REPETITIONS" || activity.executionMode === "TO_FAILURE") {
      isLowerBoundEstimate = true;
    } else {
      activityDurationSeconds += seriesCount * (activity.durationSeconds ?? 0);
    }
    activityDurationSeconds += seriesCount * activity.pauseSeconds;
  }

  return {
    initialCountdownSeconds: session.initialCountdownSeconds,
    finalPhaseSeconds: session.finalPhaseSeconds,
    activityDurationSeconds,
    isLowerBoundEstimate,
  };
}

export function toActivityCountFacts(session: Session): ActivityCountFacts {
  return {
    compositionActivityCount: session.cycle.tour.exercises.length,
    tourRepeatCount: session.cycle.tour.repeatCount,
  };
}
