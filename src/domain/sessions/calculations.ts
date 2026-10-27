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
 * typé de `executionCalculations.ts`, à partir des paramètres typés de
 * l'occurrence (PRE-4 : obligatoires, aucun chemin scalaire) et de sa
 * Récupération explicite, qui remplace UNIQUEMENT la Pause terminale. Une
 * zone porte la somme des contributions connues et la nature du total
 * (exact / ≈ / ≥) ; la projection SQL de liste ne recalcule plus rien.
 */

import type { ExecutionParametersInput } from "@/domain/activities/ExecutionParameters";
import {
  aggregateSessionDuration,
  computeIntrinsicDuration,
  computeOccurrenceDuration,
  computeSeriesCircuitOccurrenceDuration,
  isPartialContribution,
  type ExerciseDurationResult,
  type SessionDurationContribution,
  type SessionDurationResult,
} from "@/domain/activities/executionCalculations";

import { DEFAULT_CIRCUIT_NATURE, type CircuitNature } from "./circuit";
import type { Activity, ActivityType, Session } from "./Session";
import type { SideMode } from "./sideMode";

/**
 * Entrée minimale du calcul de durée d'UNE Activité — satisfaite aussi bien
 * par une `Activity` persistée que par un `SessionDraftExercise` (structural
 * typing), pour que le brouillon et l'agrégat ne portent jamais deux formules
 * distinctes.
 */
export type ActivityDurationFacts = {
  readonly type: ActivityType;
  /** PRE-4 (story 1.1, AD-3) : paramètres typés obligatoires — aucun fait scalaire. */
  readonly executionParameters: ExecutionParametersInput;
  /** Récupération explicite de l'occurrence — remplace la seule Pause terminale si elle est positive ; `null` (absente, PRE-6 AD-35) et `0` ne remplacent rien. */
  readonly postActivityRecoverySeconds?: number | null;
  readonly sideMode?: SideMode;
};

/**
 * Résultat typé de la durée d'UNE occurrence (`exact | estimated |
 * lowerBound | omitted | incomplete`, story 2.1), contributions connues
 * comprises. Un Mode inconnu (`null`) reste `omitted`. Une ancienne Activité
 * `RECOVERY` autonome (convertie par `migration004`, plus jamais produite)
 * reste lue défensivement comme une durée exacte.
 */
export function computeActivityDurationResult(activity: ActivityDurationFacts): ExerciseDurationResult {
  const parameters = activity.executionParameters;
  if (parameters.mode === null) {
    return { kind: "omitted", knownSeconds: 0, events: [] };
  }
  if (activity.type === "RECOVERY") {
    // Ancienne Récupération autonome : une Série chronométrée de sa durée,
    // sans Récupération attachée (lecture défensive, D-041).
    return computeIntrinsicDuration(parameters);
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
    isLowerBoundEstimate = isLowerBoundEstimate || isPartialContribution(result.kind);
    isEstimated = isEstimated || result.kind === "estimated";
  }
  return isEstimated ? { seconds, isLowerBoundEstimate, isEstimated } : { seconds, isLowerBoundEstimate };
}

export type StructuredActivities<T extends ActivityDurationFacts> = {
  readonly beforeTour: readonly T[];
  readonly inTour: readonly T[];
  readonly afterTour: readonly T[];
  readonly tourRepeatCount: number;
  /** PRE-6 (story 1.3, AD-40) : nature du Circuit, lue `?? "TOURS"` (compatibilité). */
  readonly circuitNature?: CircuitNature;
};

/**
 * PRE-6 (story 1.3) : contribution d'UN exercice du Circuit de Séries — le
 * total de ses passages (série i au passage i), multiplicité 1. Un Mode
 * inconnu reste `omitted` ; une ancienne Récupération autonome garde sa
 * lecture défensive, répétée à chaque passage comme en Tours.
 */
export function seriesCircuitContribution(
  activity: ActivityDurationFacts,
  passages: number,
): SessionDurationContribution {
  const parameters = activity.executionParameters;
  if (parameters.mode === null || activity.type === "RECOVERY") {
    return { result: computeActivityDurationResult(activity), multiplicity: passages };
  }
  return {
    result: computeSeriesCircuitOccurrenceDuration(parameters, activity.postActivityRecoverySeconds ?? 0, passages),
    multiplicity: 1,
  };
}

/**
 * PRE-3 (P3-13/tours-cycles-list) : total typé de la Séance — exact / ≈ /
 * ≥ — en développant les répétitions du Circuit sur la seule zone
 * `IN_TOUR`. Autorité unique partagée par la lecture complète, la liste
 * (`listActive`) et la Composition.
 *
 * PRE-6 (story 1.3, AD-40) : le développement dépend de la nature — Tours :
 * contenu interne × N (inchangé) ; Séries : chaque exercice `IN_TOUR`
 * contribue le total de ses passages (`computeSeriesCircuitOccurrenceDuration`).
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
  const nature = structure.circuitNature ?? DEFAULT_CIRCUIT_NATURE;
  switch (nature) {
    case "TOURS":
      add(structure.inTour, structure.tourRepeatCount);
      break;
    case "SERIES":
      for (const activity of structure.inTour) {
        contributions.push(seriesCircuitContribution(activity, structure.tourRepeatCount));
      }
      break;
    default: {
      const unreachable: never = nature;
      return unreachable;
    }
  }
  add(structure.afterTour, 1);
  return aggregateSessionDuration(contributions);
}

/** Total typé d'une Séance persistée (lecture complète). */
export function toSessionDurationResult(session: Session): SessionDurationResult {
  return computeStructuredSessionDuration(toStructuredActivities(session));
}

function toStructuredActivities(session: Session): StructuredActivities<Activity> {
  return {
    beforeTour: session.cycle.beforeTour ?? [],
    inTour: session.cycle.tour.exercises,
    afterTour: session.cycle.afterTour ?? [],
    tourRepeatCount: session.cycle.tour.repeatCount,
    circuitNature: session.cycle.tour.nature ?? DEFAULT_CIRCUIT_NATURE,
  };
}

/** Phases propres au plan de la Séance (P31) : jamais celles d'un Exercice. */
export type SessionPlanPhases = {
  readonly initialCountdownSeconds: number;
  readonly finalPhaseSeconds: number;
};

/**
 * PRE-4 (story 2.2, AC5, P31, FR-15-05) : Durée estimée d'exécution de la
 * Séance — plan complet. Montant = total d'occurrence de la Séance
 * (`computeStructuredSessionDuration` : Récupérations et répétitions du
 * Circuit comprises) + Compte à rebours initial + Fin de séance ; nature =
 * celle de l'agrégat, qu'aucune phase chronométrée ne change. Le Compte à
 * rebours et la Fin propres d'un Exercice ne sont jamais comptés. Mesure
 * distincte des mesures intrinsèque et d'occurrence, qui excluent ces deux
 * phases. Domaine seul : aucun consommateur d'interface en PRE-4.
 */
export function computeSessionExecutionDuration<T extends ActivityDurationFacts>(
  structure: StructuredActivities<T>,
  phases: SessionPlanPhases,
): SessionDurationResult {
  const occurrence = computeStructuredSessionDuration(structure);
  return {
    kind: occurrence.kind,
    seconds: occurrence.seconds + phases.initialCountdownSeconds + phases.finalPhaseSeconds,
  };
}

/** Durée estimée d'exécution (P31) d'une Séance persistée. */
export function toSessionExecutionDurationResult(session: Session): SessionDurationResult {
  return computeSessionExecutionDuration(toStructuredActivities(session), session);
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
