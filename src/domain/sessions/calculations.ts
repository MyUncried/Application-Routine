/**
 * Calculs métier déterministes (§10, §12.5) : Nombre d'Activités et Durée
 * estimée.
 *
 * Ces fonctions n'acceptent qu'une entrée métier minimale (« Facts »),
 * jamais une ligne SQL ni un type d'infrastructure.
 *
 * **T02-S01 — structure réelle des trois zones** (CE-T02-01 « Calculs »,
 * AC-10) — conservée par PRE-3 :
 *
 * 1. le NOMBRE d'Activités est celui des Activités RÉELLEMENT COMPOSÉES —
 *    chaque Activité compte UNE SEULE FOIS, quelle que soit sa zone et quel
 *    que soit `tourRepeatCount` ;
 * 2. la DURÉE estimée compte une fois les Activités `BEFORE_TOUR`, multiplie
 *    les Activités `IN_TOUR` par `tourRepeatCount`, puis compte une fois les
 *    Activités `AFTER_TOUR` ;
 * 3. le Compte à rebours initial et la Fin de séance sont EXCLUS de cette
 *    durée affichée.
 *
 * **PRE-3 — autorité unique de la durée d'un Exercice** (v13 §5, Bip v2
 * §2–3) : la durée d'une occurrence n'est plus une formule scalaire locale
 * (ancienne substitution `C − 1`, multiplicateur de côté sans Pause entre
 * les côtés, convention de borne minimale à l'Exercice) mais le résultat
 * typé de `executionCalculations.ts`, à partir des paramètres canoniques de
 * l'occurrence (ou de l'adaptateur conservateur d'un ancien objet) et de sa
 * Récupération explicite, qui remplace UNIQUEMENT la Pause terminale. Une
 * zone porte la somme des contributions connues et la nature du total
 * (exact / ≈ / ≥) ; la projection SQL de liste ne recalcule plus rien.
 */

import {
  resolveExecutionParameters,
  type ExecutionParametersInput,
} from "@/domain/activities/ExecutionParameters";
import {
  aggregateSessionDuration,
  computeOccurrenceDuration,
  type ExerciseDurationResult,
  type SessionDurationContribution,
  type SessionDurationResult,
} from "@/domain/activities/executionCalculations";

import type { Activity, ActivityType, ExerciseExecutionMode, Session } from "./Session";
import type { SideMode } from "./sideMode";

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
  readonly repetitionCount?: number | null;
  readonly seriesCount: number | null;
  readonly pauseSeconds: number;
  /** Récupération explicite de l'occurrence (`0` = aucune) — remplace la seule Pause terminale. */
  readonly postActivityRecoverySeconds?: number;
  readonly sideMode?: SideMode;
  /** PRE-3 : paramètres canoniques — autorité quand présents. */
  readonly executionParameters?: ExecutionParametersInput;
};

/**
 * Résultat typé de la durée d'UNE occurrence (`exact | estimated |
 * omitted`), contributions connues comprises. Une ancienne Activité
 * `RECOVERY` autonome (convertie par `migration004`, plus jamais produite)
 * reste lue défensivement comme une durée exacte.
 */
export function computeActivityDurationResult(activity: ActivityDurationFacts): ExerciseDurationResult {
  if (activity.type === "RECOVERY") {
    const seconds = activity.durationSeconds ?? 0;
    return { kind: "exact", knownSeconds: seconds, events: [], seconds };
  }
  const parameters = resolveExecutionParameters({
    executionMode: activity.executionMode,
    durationSeconds: activity.durationSeconds,
    repetitionCount: activity.repetitionCount ?? null,
    seriesCount: activity.seriesCount,
    pauseSeconds: activity.pauseSeconds,
    sideMode: activity.sideMode,
    executionParameters: activity.executionParameters,
  });
  if (parameters.mode === null) {
    return { kind: "omitted", knownSeconds: 0, events: [] };
  }
  return computeOccurrenceDuration(parameters, activity.postActivityRecoverySeconds ?? 0);
}

/** Contributions chronométrées connues d'UNE occurrence (montant exact, estimé, ou partiel si omis). */
export function computeActivityDurationSeconds(activity: ActivityDurationFacts): number {
  return computeActivityDurationResult(activity).knownSeconds;
}

/**
 * Durées par zone structurelle (T02-S01) — trois colonnes distinctes, jamais
 * un total déjà agrégé : seule la zone `IN_TOUR` est multipliée par
 * `tourRepeatCount`.
 */
export type EstimatedDurationFacts = {
  readonly beforeTourDurationSeconds: number;
  readonly inTourDurationSeconds: number;
  readonly afterTourDurationSeconds: number;
  /** Répétition du Tour, entier `1..99` (D-058). */
  readonly tourRepeatCount: number;
  /** `true` dès qu'au moins une occurrence contributrice a un travail inconnu (total ≥). */
  readonly isLowerBoundEstimate: boolean;
  /** PRE-3 : `true` dès qu'au moins une occurrence contributrice est estimée (≈). */
  readonly isEstimated?: boolean;
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
 * Tour `tourRepeatCount` fois.
 */
export function computeTotalActivitiesToExecute(facts: ActivityCountFacts): number {
  return (
    facts.beforeTourActivityCount +
    facts.inTourActivityCount * facts.tourRepeatCount +
    facts.afterTourActivityCount
  );
}

/** Durée cumulée d'une COLLECTION d'Activités, et nature du total. */
export type ZoneDurationFacts = {
  readonly seconds: number;
  /** Au moins un travail inconnu : total ≥ contributions connues. */
  readonly isLowerBoundEstimate: boolean;
  /** PRE-3 : présent et vrai dès qu'au moins une occurrence est estimée (≈) ; absent sinon. */
  readonly isEstimated?: boolean;
};

/**
 * Somme des contributions connues d'une zone (ou de toute autre collection)
 * et nature du total — partagée par la présentation (Composition) et
 * l'agrégat, jamais réécrite ailleurs. Chaque occurrence contribue avec SES
 * propres paramètres et SA Récupération explicite.
 */
export function computeZoneDurationFacts(
  activities: readonly ActivityDurationFacts[],
): ZoneDurationFacts {
  let seconds = 0;
  let isLowerBoundEstimate = false;
  let isEstimated = false;
  for (const activity of activities) {
    const result = computeActivityDurationResult(activity);
    seconds += result.knownSeconds;
    isLowerBoundEstimate = isLowerBoundEstimate || result.kind === "omitted";
    isEstimated = isEstimated || result.kind === "estimated";
  }
  return isEstimated ? { seconds, isLowerBoundEstimate, isEstimated } : { seconds, isLowerBoundEstimate };
}

export type StructuredActivities<T extends ActivityDurationFacts> = {
  readonly beforeTour: readonly T[];
  readonly inTour: readonly T[];
  readonly afterTour: readonly T[];
  readonly tourRepeatCount: number;
};

/**
 * PRE-3 (P3-13/tours-cycles-list) : total typé de la Séance — exact / ≈ /
 * ≥ — en développant les répétitions du Circuit sur la seule zone
 * `IN_TOUR`. Autorité unique partagée par la lecture complète, la liste
 * (`listActive`) et la Composition.
 */
export function computeStructuredSessionDuration<T extends ActivityDurationFacts>(
  structure: StructuredActivities<T>,
): SessionDurationResult {
  const contributions: SessionDurationContribution[] = [];
  const add = (activities: readonly T[], multiplicity: number) => {
    for (const activity of activities) {
      contributions.push({ result: computeActivityDurationResult(activity), multiplicity });
    }
  };
  add(structure.beforeTour, 1);
  add(structure.inTour, structure.tourRepeatCount);
  add(structure.afterTour, 1);
  return aggregateSessionDuration(contributions);
}

/** Total typé d'une Séance persistée (lecture complète). */
export function toSessionDurationResult(session: Session): SessionDurationResult {
  return computeStructuredSessionDuration({
    beforeTour: session.cycle.beforeTour ?? [],
    inTour: session.cycle.tour.exercises,
    afterTour: session.cycle.afterTour ?? [],
    tourRepeatCount: session.cycle.tour.repeatCount,
  });
}

function zoneDurationSeconds(activities: readonly Activity[]): ZoneDurationFacts {
  return computeZoneDurationFacts(activities);
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
    ...(beforeTour.isEstimated || inTour.isEstimated || afterTour.isEstimated ? { isEstimated: true } : {}),
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
