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

import { seriesCountOf, type ExecutionParametersInput } from "@/domain/activities/ExecutionParameters";
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
import type { ElementFormat } from "./formats";
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
  /** PRE-9 (C.1, ARB-03) : Format porté par l'Exercice ; absent/`null` = libre. */
  readonly format?: ElementFormat | null;
};

/**
 * PRE-9 B.7 (epics § B.7, D.1) : durée initiale d'un AMRAP (ch07, « Défauts validés » : « AMRAP
 * durée 12:00 réglable »), retenue tant que son réglage n'est pas renseigné.
 */
export const AMRAP_INITIAL_DURATION_SECONDS = 12 * 60;

/**
 * Réalignement du 02/11/2026 (référence Formats §2, §10, §11, §12, §3 ; FMT-21, FMT-42) — Exercice
 * autonome qui porte un Format spécialisé :
 * - AMRAP : sa Durée de l'exercice (12 min initialement), exacte, puis sa récupération ;
 * - EMOM : N séries × Intervalle, puis sa récupération (« À la suite » : 6 + 1 + 6 = 13 min) ;
 * - Death by : jusqu'à l'échec, borne minimale « ≥ » (sa récupération seule est connue) ;
 * - For time : temps mesuré à l'exécution, borne minimale « ≥ » ; la cadence facultative n'entre
 *   dans aucun calcul de durée, même estimée (§3).
 * Les membres d'un Circuit porteur ne comptent pas individuellement : la durée est celle du Circuit
 * (`carrierCircuitDuration`).
 *
 * [B.7 du 01/11 :] un Exercice AMRAP ou Death by est développé en **segment progressif**,
 * sans séries ni récupération propres (D.1, `planExpansion.ts`) ; sa durée ne se lit donc pas sur ses
 * paramètres d'exécution. AMRAP : sa durée configurée (initialement 12:00), exacte. Death by : aucune
 * durée calculable — traité comme un Exercice sans durée conventionnelle, borne minimale « ≥ »
 * (D-070, epics § B.7). `null` : Exercice libre ou Format fini (développé par ses séries ordinaires).
 */
export function progressiveFormatDuration(activity: ActivityDurationFacts): ExerciseDurationResult | null {
  const format = activity.format ?? null;
  if (format === null) return null;
  const recovery = Math.max(0, activity.postActivityRecoverySeconds ?? 0);
  switch (format.key) {
    case "AMRAP": {
      // Membre d'un Circuit porteur (sans Durée propre) : un passage de la boucle, compté par le Circuit.
      const configured = format.settings.durationSeconds;
      if (typeof configured !== "number") return null;
      const seconds = (configured > 0 ? configured : AMRAP_INITIAL_DURATION_SECONDS) + recovery;
      return { kind: "exact", knownSeconds: seconds, seconds, events: [] };
    }
    case "DEATH_BY":
    case "FOR_TIME":
      return { kind: "lowerBound", knownSeconds: recovery, seconds: recovery, events: [] };
    case "EMOM": {
      // FMT-21 : chaque Exercice EMOM occupe ses N fenêtres de W (N : ses séries, §10).
      const window = intervalSeconds(format);
      const rounds = seriesCountOf(activity.executionParameters);
      if (window === null || rounds < 1) return null;
      const seconds = rounds * window + recovery;
      return { kind: "exact", knownSeconds: seconds, seconds, events: [] };
    }
    default:
      return null;
  }
}

/** EMOM et Death by : Intervalle de l'Exercice ; `null` si absent. */
function intervalSeconds(format: ElementFormat): number | null {
  const window = format.settings.intervalSeconds;
  return typeof window === "number" && window > 0 ? window : null;
}

/** Réglage numérique positif ou nul d'un Circuit porteur ; `null` si absent. */
function circuitSetting(format: ElementFormat, id: string): number | null {
  const value = format.settings[id];
  return typeof value === "number" && value >= 0 ? value : null;
}

/**
 * Réalignement du 02/11/2026 (référence Formats §1, §2.1, §10, §11, §12) — durée d'un Circuit porteur
 * d'un Format, pour une exécution du Circuit (`null` : Circuit standard) :
 * - AMRAP : blocs × durée de bloc + (blocs − 1) × repos entre les blocs, exacte (3 × 12 + 2 × 2 = 40 min) ;
 *   le buy-in consomme le temps du premier bloc, la récupération de boucle celui du bloc ;
 * - EMOM dans chaque intervalle : tours × durée de chaque tour, exacte ;
 * - Death by (jusqu'à l'échec) et For time (temps mesuré) : borne minimale « ≥ ».
 */
export function carrierCircuitDuration(circuit: {
  readonly repeatCount: number;
  readonly format?: ElementFormat | null;
}): ExerciseDurationResult | null {
  const format = circuit.format ?? null;
  if (format === null) return null;
  switch (format.key) {
    case "AMRAP": {
      const block = circuitSetting(format, "blockSeconds") ?? AMRAP_INITIAL_DURATION_SECONDS;
      const rest = circuitSetting(format, "restBetweenBlocksSeconds") ?? 0;
      const blocks = Math.max(1, circuit.repeatCount);
      const seconds = blocks * block + (blocks - 1) * rest;
      return { kind: "exact", knownSeconds: seconds, seconds, events: [] };
    }
    case "EMOM": {
      const window = circuitSetting(format, "windowSeconds");
      if (window === null || window === 0) return null;
      const seconds = Math.max(1, circuit.repeatCount) * window;
      return { kind: "exact", knownSeconds: seconds, seconds, events: [] };
    }
    case "DEATH_BY":
    case "FOR_TIME":
      return { kind: "lowerBound", knownSeconds: 0, seconds: 0, events: [] };
    default:
      return null;
  }
}

/**
 * Résultat typé de la durée d'UNE occurrence (`exact | estimated |
 * lowerBound | omitted | incomplete`, story 2.1), contributions connues
 * comprises. Un Mode inconnu (`null`) reste `omitted`. Une ancienne Activité
 * `RECOVERY` autonome (convertie par `migration004`, plus jamais produite)
 * reste lue défensivement comme une durée exacte.
 */
export function computeActivityDurationResult(activity: ActivityDurationFacts): ExerciseDurationResult {
  const parameters = activity.executionParameters;
  const progressive = progressiveFormatDuration(activity);
  if (progressive !== null) {
    return progressive;
  }
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
  // PRE-9 B.7 : EMOM alterné (D-16, son N adapté à celui du Circuit) : une fenêtre W par tour.
  const format = activity.format ?? null;
  if (format !== null && format.key === "EMOM") {
    const window = intervalSeconds(format);
    if (window !== null) return { result: { kind: "exact", knownSeconds: window, seconds: window, events: [] }, multiplicity: passages };
  }
  // PRE-9 B.7 : un membre progressif (Death by alterné, D-16) joue un segment à chaque tour (D.1).
  if (parameters.mode === null || activity.type === "RECOVERY" || progressiveFormatDuration(activity) !== null) {
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
