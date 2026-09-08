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
 * **T02-S01 — structure réelle des trois zones** (CE-T02-01 « Calculs »,
 * AC-10, et clarifications autoritatives du verdict `PLAN_REVIEW_APPROVED`
 * de la tranche) :
 *
 * 1. le NOMBRE d'Activités est celui des Activités RÉELLEMENT COMPOSÉES —
 *    chaque Activité compte UNE SEULE FOIS, quelle que soit sa zone et quel
 *    que soit `tourRepeatCount` ; ce compteur ne représente jamais des
 *    occurrences d'Exécution (celles-ci restent
 *    `computeTotalActivitiesToExecute`, RM-075, hors périmètre du moteur) ;
 * 2. la DURÉE estimée compte une fois les Activités `BEFORE_TOUR`, multiplie
 *    les Activités `IN_TOUR` par `tourRepeatCount`, puis compte une fois les
 *    Activités `AFTER_TOUR` ;
 * 3. le Compte à rebours initial et la Fin de séance sont EXCLUS de cette
 *    durée affichée — ils ne figurent donc plus dans les Facts. (Le
 *    paragraphe « Calculs » de CE-T02-01 les décrivait comme contribuant à
 *    « la durée globale » ; le verdict de revue de la tranche, qui prime
 *    explicitement « sur toute formulation contradictoire », les exclut. La
 *    contradiction documentaire est consignée dans le rapport de mission.)
 *
 * La formule par Activité reste exactement celle déjà établie par
 * `formatCompositionSummary` (`compositionPresentation.ts`) — mode Durée,
 * `seriesCount × durationSeconds + seriesCount × pauseSeconds` ; modes
 * Répétitions et « À l'échec », aucune durée conventionnelle pour l'Exercice
 * lui-même mais ses pauses restent comptées, et la durée totale devient une
 * borne minimale `≥` (RM-072/D-112) — jamais présentée comme exacte. Une
 * Récupération contribue sa seule durée (D-041).
 */

import type { Activity, ActivityType, ExerciseExecutionMode, Session } from "./Session";

/**
 * Modes sans durée conventionnelle (RM-072/D-112) : la durée estimée qui les
 * contient est une BORNE MINIMALE, jamais une valeur exacte.
 */
export function isLowerBoundExecutionMode(mode: ExerciseExecutionMode | null): boolean {
  return mode === "REPETITIONS" || mode === "TO_FAILURE";
}

/**
 * Entrée minimale du calcul de durée d'UNE Activité — satisfaite aussi bien
 * par une `Activity` persistée que par un `SessionDraftExercise` (structural
 * typing), pour que le brouillon et l'agrégat ne portent jamais deux formules
 * distinctes.
 */
export type ActivityDurationFacts = {
  readonly type: ActivityType;
  readonly executionMode: ExerciseExecutionMode | null;
  readonly durationSeconds: number | null;
  readonly seriesCount: number | null;
  readonly pauseSeconds: number;
};

/** Durée estimée d'UNE Activité, hors répétitions du Tour (voir la note de tête). */
export function computeActivityDurationSeconds(activity: ActivityDurationFacts): number {
  // Une Récupération (D-041) est toujours chronométrée : elle contribue sa
  // seule durée, jamais multipliée par des Séries, jamais suivie d'une pause
  // après Série.
  if (activity.type === "RECOVERY") {
    return activity.durationSeconds ?? 0;
  }
  const seriesCount = activity.seriesCount ?? 0;
  const targetSeconds = isLowerBoundExecutionMode(activity.executionMode)
    ? 0
    : seriesCount * (activity.durationSeconds ?? 0);
  return targetSeconds + seriesCount * activity.pauseSeconds;
}

/**
 * Durées par zone structurelle (T02-S01) — trois colonnes distinctes, jamais
 * un total déjà agrégé : seule la zone `IN_TOUR` est multipliée par
 * `tourRepeatCount`. La projection SQL `listActive` produit exactement ces
 * trois colonnes, par zone (clarification n° 5 du verdict de revue).
 */
export type EstimatedDurationFacts = {
  readonly beforeTourDurationSeconds: number;
  readonly inTourDurationSeconds: number;
  readonly afterTourDurationSeconds: number;
  /** Répétition du Tour, entier `1..99` (D-058). */
  readonly tourRepeatCount: number;
  /** `true` dès qu'au moins un Exercice contribuant à ces durées est en mode Répétitions ou « À l'échec » (RM-072/D-112). */
  readonly isLowerBoundEstimate: boolean;
};

/**
 * Nombres d'Activités par zone structurelle (T02-S01). Deux lectures
 * distinctes en découlent, jamais confondues : le nombre d'Activités
 * COMPOSÉES (`computeActivityCount`) et le nombre total d'Activités À
 * EXÉCUTER (`computeTotalActivitiesToExecute`, RM-075).
 */
export type ActivityCountFacts = {
  readonly beforeTourActivityCount: number;
  readonly inTourActivityCount: number;
  readonly afterTourActivityCount: number;
  readonly tourRepeatCount: number;
};

/** Durée estimée = zone avant Tour + (zone du Tour × répétitions du Tour) + zone après Tour. */
export function computeEstimatedDurationSeconds(facts: EstimatedDurationFacts): number {
  return (
    facts.beforeTourDurationSeconds +
    facts.inTourDurationSeconds * facts.tourRepeatCount +
    facts.afterTourDurationSeconds
  );
}

/**
 * Nombre d'Activités RÉELLEMENT COMPOSÉES : chaque Activité des trois zones
 * compte une seule fois, sans multiplication par les répétitions du Tour.
 */
export function computeActivityCount(facts: ActivityCountFacts): number {
  return (
    facts.beforeTourActivityCount + facts.inTourActivityCount + facts.afterTourActivityCount
  );
}

/**
 * Nombre total d'Activités à exécuter (RM-075), après développement des
 * répétitions du Tour : les zones hors Tour comptent une fois, la zone du
 * Tour `tourRepeatCount` fois. Métrique du Plan d'Exécution — distincte du
 * nombre d'Activités composées ci-dessus, jamais affichée par le Catalogue
 * ni par la synthèse de Composition en T02.
 */
export function computeTotalActivitiesToExecute(facts: ActivityCountFacts): number {
  return (
    facts.beforeTourActivityCount +
    facts.inTourActivityCount * facts.tourRepeatCount +
    facts.afterTourActivityCount
  );
}

function zoneDurationSeconds(activities: readonly Activity[]): {
  seconds: number;
  isLowerBoundEstimate: boolean;
} {
  let seconds = 0;
  let isLowerBoundEstimate = false;
  for (const activity of activities) {
    if (activity.type === "EXERCISE" && isLowerBoundExecutionMode(activity.executionMode)) {
      isLowerBoundEstimate = true;
    }
    seconds += computeActivityDurationSeconds(activity);
  }
  return { seconds, isLowerBoundEstimate };
}

export function toEstimatedDurationFacts(session: Session): EstimatedDurationFacts {
  const beforeTour = zoneDurationSeconds(session.cycle.beforeTour ?? []);
  const inTour = zoneDurationSeconds(session.cycle.tour.exercises);
  const afterTour = zoneDurationSeconds(session.cycle.afterTour ?? []);

  return {
    beforeTourDurationSeconds: beforeTour.seconds,
    inTourDurationSeconds: inTour.seconds,
    afterTourDurationSeconds: afterTour.seconds,
    tourRepeatCount: session.cycle.tour.repeatCount,
    isLowerBoundEstimate:
      beforeTour.isLowerBoundEstimate ||
      inTour.isLowerBoundEstimate ||
      afterTour.isLowerBoundEstimate,
  };
}

export function toActivityCountFacts(session: Session): ActivityCountFacts {
  return {
    beforeTourActivityCount: (session.cycle.beforeTour ?? []).length,
    inTourActivityCount: session.cycle.tour.exercises.length,
    afterTourActivityCount: (session.cycle.afterTour ?? []).length,
    tourRepeatCount: session.cycle.tour.repeatCount,
  };
}
