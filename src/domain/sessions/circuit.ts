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
 * story 1.3, AD-40) et opérations de Circuit (AD-39, story 1.4 : nature,
 * compte, réserve, entrée, sortie, volumes). Fonctions pures, sans
 * dépendance React ni SQLite.
 */

import {
  clampSeriesCount,
  resizeSeriesWithReserve,
  seriesCountOf,
  seriesRowsOf,
  type ExecutionMode,
  type ExecutionSeries,
  type SeriesRow,
  type SeriesTarget,
} from "@/domain/activities/ExecutionParameters";

import { DEFAULT_TOUR_REPEAT_COUNT } from "./defaults";
import type { ActivityType, StructuralPosition } from "./Session";
import type { SessionDraft, SessionDraftExercise } from "./SessionDraft";
import type { SideMode } from "./sideMode";
import {
  isSequenceSeparator,
  isStopPointAllowed,
  orderStopPointsByScope,
  tourBoundaryConflict,
  tourBoundaryPoints,
  withoutStopPoints,
  type StopPoint,
  type TourBoundaryChoice,
  type TourBoundaryConflict,
} from "./StopPoint";

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
 *   séries existantes (sa récupération n'est produite qu'avec lui). Une
 *   ancienne Récupération autonome ou un Mode inconnu est joué en entier à
 *   chaque passage (`series = null`), comme la durée le compte.
 * - Un Tour ou passage où aucune occurrence ne joue est omis en entier
 *   (points compris).
 *
 * À un emplacement : Exercice → Récupération positive → Point d'arrêt. Story
 * 6.1 (D-441, remplace ARB-3) : le point est un élément autonome de la
 * séquence mêlée de sa portée (`position` = occurrences qui le précèdent) ;
 * il est produit à sa place à chaque passage, que l'occurrence qui le
 * précède joue ou non. Un point `position = 0` est en tête de sa portée
 * (répété en tête de chaque Tour ou passage s'il est interne). R = 0 ou
 * absente ne produit aucune étape.
 *
 * RM-251 et RM-219 dans le développement (story 6.1, D-441 ; arbitrage de
 * Hermann « supprimer le point en trop ») : le développement ne produit
 * jamais deux étapes `STOP_POINT` successives, ni un `STOP_POINT` en tête
 * (juste après le compte à rebours) ou en fin (juste avant la Fin) — le
 * point en trop est omis, sans rien retirer de la Séance (en Séries
 * partielles : le second point). Seule une occurrence `EXERCISE` jouée
 * sépare (`isSequenceSeparator`) : les étapes `RECOVERY` et les anciennes
 * Récupérations autonomes ne comptent pas. En Séries, un passage où aucun
 * `EXERCISE` ne joue (il ne reste que d'anciennes Récupérations autonomes)
 * est omis comme un passage vide ; en Tours, le contenu interne est
 * identique à chaque Tour et n'est jamais omis.
 *
 * Story 7.1 (D-442) — début et fin de Tour : un point en tête de Circuit
 * `(IN, 0)` est autorisé ; à N ≥ 2, un point de début ou de fin de Tour reste
 * autorisé même si le Circuit ouvre ou clôt la Séance, et la même règle
 * d'omission s'applique : le point de début du Tour 1 qui suivrait le compte
 * à rebours, et le point de fin du dernier Tour qui précéderait la Fin, ne
 * sont pas produits. Un conflit de Tour hérité (début et fin à N ≥ 2) ne
 * donne qu'un arrêt entre deux Tours : le point de début du Tour k + 1, qui
 * suit le point de fin du Tour k, est omis (il n'est joué qu'au Tour 1, et
 * seulement si un Exercice le précède).
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
  const occurrence = (exercise: ExpandableOccurrence, pass: number | null, series: number | null) => {
    const scope = exercise.structuralPosition;
    steps.push({ kind: "OCCURRENCE", occurrenceId: exercise.id, scope, pass, series });
    const recovery = exercise.postActivityRecoverySeconds ?? 0;
    if (recovery > 0) {
      steps.push({ kind: "RECOVERY", occurrenceId: exercise.id, scope, pass, seconds: recovery });
    }
  };
  const outside = (scope: StructuralPosition) => {
    pointsAt(scope, 0, null);
    input.exercises
      .filter((exercise) => exercise.structuralPosition === scope)
      .forEach((exercise, index) => {
        occurrence(exercise, null, null);
        pointsAt(scope, index + 1, null);
      });
  };

  outside("BEFORE_TOUR");
  const inCircuit = input.exercises.filter((exercise) => exercise.structuralPosition === "IN_TOUR");
  for (let pass = 1; pass <= passes; pass += 1) {
    // Série jouée à ce passage par chaque occurrence du Circuit (même rang) ; `undefined` : ne joue pas.
    const plays: (number | null | undefined)[] = [];
    switch (nature) {
      case "TOURS":
        inCircuit.forEach(() => plays.push(null));
        break;
      case "SERIES":
        inCircuit.forEach((exercise) => {
          if (isLegacySeriesOccurrence(exercise)) {
            // Même lecture défensive que la durée (`calculations.ts`) : à chaque passage, en entier.
            plays.push(null);
          } else {
            plays.push(seriesCountOf(exercise.executionParameters) >= pass ? pass : undefined);
          }
        });
        break;
      default: {
        const unreachable: never = nature;
        return unreachable;
      }
    }
    // Un passage où aucune occurrence ne joue est omis en entier, points compris ; en Séries,
    // aussi un passage où aucun EXERCISE ne joue (story 6.1 : seules d'anciennes Récupérations).
    const playsNothing = plays.every((series) => series === undefined);
    const playsNoExercise =
      nature === "SERIES" &&
      !inCircuit.some((exercise, index) => plays[index] !== undefined && isSequenceSeparator(exercise));
    if (playsNothing || playsNoExercise) {
      continue;
    }
    pointsAt("IN_TOUR", 0, pass);
    inCircuit.forEach((exercise, index) => {
      const series = plays[index];
      if (series !== undefined) {
        occurrence(exercise, pass, series);
      }
      pointsAt("IN_TOUR", index + 1, pass);
    });
  }
  outside("AFTER_TOUR");
  return withoutExtraStopPoints(steps, input.exercises);
}

/**
 * RM-251 / RM-219 dans le développement (story 6.1, D-441) : omet tout point
 * qui suit un autre point, ou qu'aucune occurrence `EXERCISE` jouée ne
 * précède (tête) ou ne suit (fin) — étapes `RECOVERY` et anciennes
 * Récupérations autonomes ignorées (`isSequenceSeparator`).
 */
function withoutExtraStopPoints(
  steps: readonly CompositionStep[],
  exercises: readonly ExpandableOccurrence[],
): readonly CompositionStep[] {
  const separatorIds = new Set(exercises.filter(isSequenceSeparator).map((exercise) => exercise.id));
  const isSeparator = (step: CompositionStep) => step.kind === "OCCURRENCE" && separatorIds.has(step.occurrenceId);
  const lastSeparator = steps.reduce((last, step, index) => (isSeparator(step) ? index : last), -1);
  const result: CompositionStep[] = [];
  let seenSeparator = false;
  let afterStopPoint = false;
  steps.forEach((step, index) => {
    if (step.kind === "STOP_POINT") {
      if (afterStopPoint || !seenSeparator || index > lastSeparator) {
        return;
      }
      afterStopPoint = true;
    } else if (isSeparator(step)) {
      seenSeparator = true;
      afterStopPoint = false;
    }
    result.push(step);
  });
  return result;
}

// --- Opérations de Circuit (story 1.4, AD-37, AD-38, AD-39) ------------------

/** Séries perdues par une occurrence lors d'une conversion ou d'une entrée (AD-39). */
export type CircuitLoss = {
  readonly occurrenceId: string;
  readonly lostSeriesCount: number;
};

/** Pertes calculées AVANT toute mutation ; vide = aucune confirmation nécessaire. */
export type CircuitLossReport = { readonly losses: readonly CircuitLoss[] };

/** Ligne de la grille des volumes : un Exercice du Circuit, ses Cibles série par série. */
export type CircuitVolumeRow = {
  readonly occurrenceId: string;
  readonly name: string;
  readonly mode: ExecutionMode | null;
  readonly sideMode: SideMode;
  /** Cible de la série i (index i - 1), `null` si l'exercice n'a pas de série i. */
  readonly cells: readonly (SeriesTarget | null)[];
};

/** Volumes du Circuit (AD-39) : colonnes S1..Smax, séries actives seulement. */
export type CircuitVolumes = {
  /** Smax : plus grand nombre de séries actives des exercices du Circuit (0 si aucun). */
  readonly seriesColumnCount: number;
  readonly rows: readonly CircuitVolumeRow[];
};

type SeriesReserve = Readonly<Record<string, readonly SeriesRow[]>>;

/** Seules les occurrences `IN_TOUR` de type `EXERCISE` suivent N (AD-37). */
function isCircuitExercise(exercise: SessionDraftExercise): boolean {
  return exercise.structuralPosition === "IN_TOUR" && exercise.type === "EXERCISE";
}

function natureOf(draft: SessionDraft): CircuitNature {
  return draft.circuitNature ?? DEFAULT_CIRCUIT_NATURE;
}

function countOf(draft: SessionDraft): number {
  return circuitBoundCount(circuitBoundOf(draft));
}

/** Séries perdues par un exercice ramené à `count` (0 si aucune). */
function lostSeriesCount(exercise: SessionDraftExercise, count: number): number {
  return Math.max(seriesCountOf(exercise.executionParameters) - count, 0);
}

/**
 * Adapte un exercice à N : identiques → `count = N` ; variables → lignes
 * ramenées à N (restauration depuis `reserve`, puis copie de la dernière
 * ligne active). Régime et autres paramètres inchangés ; même référence si
 * rien ne change.
 */
function adaptExercise(
  exercise: SessionDraftExercise,
  count: number,
  reserve: readonly SeriesRow[],
): { readonly exercise: SessionDraftExercise; readonly reserve: readonly SeriesRow[] } {
  const parameters = exercise.executionParameters;
  const resized = resizeSeriesWithReserve(parameters.series, reserve, count);
  if (resized.series === parameters.series) {
    return { exercise, reserve: resized.reserve };
  }
  return {
    exercise: { ...exercise, executionParameters: { ...parameters, series: resized.series } },
    reserve: resized.reserve,
  };
}

/**
 * Brouillon avec sa réserve. Une réserve vide est écrite `undefined`, clé
 * PRÉSENTE : un correctif fusionné (`{ ...current, ...patch }`,
 * `SessionDraftProvider.updateDraft`) efface ainsi l'ancienne réserve.
 */
function withReserve(draft: SessionDraft, reserve: SeriesReserve): SessionDraft {
  return { ...draft, circuitSeriesReserve: Object.keys(reserve).length === 0 ? undefined : reserve };
}

/**
 * Pertes d'un changement de nature, sur l'état COURANT, sans mutation
 * (AD-39). Tours → Séries : séries au-delà de N, par exercice du Circuit.
 * Même nature ou Séries → Tours : aucune perte.
 */
export function prepareNatureChange(draft: SessionDraft, nature: CircuitNature): CircuitLossReport {
  if (nature === natureOf(draft) || nature === "TOURS") {
    return { losses: [] };
  }
  const count = countOf(draft);
  const losses: CircuitLoss[] = [];
  for (const exercise of draft.exercises) {
    const lost = isCircuitExercise(exercise) ? lostSeriesCount(exercise, count) : 0;
    if (lost > 0) {
      losses.push({ occurrenceId: exercise.id, lostSeriesCount: lost });
    }
  }
  return { losses };
}

/**
 * Applique un changement de nature (AD-37, AD-38), sans message ni
 * confirmation (à la charge de l'appelant, après `prepareNatureChange`).
 * - Même nature : brouillon inchangé (même référence).
 * - Tours → Séries : chaque exercice du Circuit est adapté à N ; troncature
 *   DÉFINITIVE, extension par copie de la dernière ligne active ; aucune
 *   réserve (une conversion confirmée ne mémorise rien).
 * - Séries → Tours : seule la nature change ; comptes et valeurs conservés.
 */
export function applyNatureChange(draft: SessionDraft, nature: CircuitNature): SessionDraft {
  if (nature === natureOf(draft)) {
    return draft;
  }
  switch (nature) {
    case "TOURS":
      return { ...draft, circuitNature: nature };
    case "SERIES": {
      const count = countOf(draft);
      const exercises = draft.exercises.map((exercise) =>
        isCircuitExercise(exercise) ? adaptExercise(exercise, count, []).exercise : exercise,
      );
      return withReserve({ ...draft, circuitNature: nature, exercises }, {});
    }
    default: {
      const unreachable: never = nature;
      return unreachable;
    }
  }
}

/**
 * Change N, borné 1..99 (AD-38). Tours : seul `tourRepeatCount` change.
 * Séries : chaque exercice du Circuit suit N — diminution : lignes retirées
 * en réserve, sans message ; augmentation : restauration d'abord depuis la
 * réserve, puis copie de la dernière ligne active ; identiques : seul
 * `count` suit N. Même N : brouillon inchangé (même référence).
 *
 * Story 7.1 (D-442) : forme historique de `circuitCountOutcome` (l'écran
 * appelle `circuitCountOutcome` depuis la story 7.2). Les points devenus interdits au passage à N = 1 sont
 * retirés ; un conflit de Tour CRÉÉ par le passage à N ≥ 2 n'est pas tranché
 * ici : N est appliqué et les deux points sont conservés (état d'un conflit
 * hérité : enregistrable, un seul arrêt à l'exécution). Le choix est demandé
 * par l'écran via `circuitCountOutcome` (story 7.2).
 */
export function setCircuitCount(draft: SessionDraft, requested: number): SessionDraft {
  const outcome = circuitCountOutcome(draft, requested);
  return outcome.status === "APPLIED" ? outcome.draft : outcome.unresolved;
}

/** Story 7.1 (D-442) : brouillon produit et points retirés pour l'obtenir. */
export type CircuitCountResolution = {
  readonly draft: SessionDraft;
  readonly removedStopPointIds: readonly string[];
};

/**
 * Story 7.1 (D-442) : issue d'un changement de N. `APPLIED` : brouillon
 * produit (l'entrée elle-même si rien ne change) et points retirés sans
 * message (devenus interdits au passage à N = 1). `CHOICE_REQUIRED` : le
 * passage de N = 1 à N ≥ 2 ferait coexister un point de début et un point de
 * fin de Tour ; `resolutions.HEAD` conserve le début, `resolutions.TAIL` la
 * fin (brouillons complets, N appliqué) ; `unresolved` : N appliqué, les deux
 * points conservés (forme historique). « Annuler » : garder l'entrée.
 */
export type CircuitCountOutcome =
  | { readonly status: "APPLIED"; readonly draft: SessionDraft; readonly removedStopPointIds: readonly string[] }
  | {
      readonly status: "CHOICE_REQUIRED";
      readonly conflict: TourBoundaryConflict;
      readonly resolutions: Readonly<Record<TourBoundaryChoice, CircuitCountResolution>>;
      readonly unresolved: SessionDraft;
    };

/**
 * Story 7.1 (D-442) : change N (`setCircuitCount` historique, AD-38), puis
 * ajuste les Points d'arrêt :
 * - passage à N = 1 : les points autorisés à l'ancien N et plus au nouveau
 *   (début ou fin de Tour en ouverture ou clôture de Séance, RM-219) sont
 *   retirés sans message (`removedStopPointIds`) ;
 * - passage de N = 1 à N ≥ 2 : un conflit de Tour (début et fin) qui
 *   n'existait pas rend `CHOICE_REQUIRED`. Un passage de N ≥ 2 à N ≥ 2 ne
 *   change aucune règle.
 */
export function circuitCountOutcome(draft: SessionDraft, requested: number): CircuitCountOutcome {
  const counted = withCircuitCount(draft, requested);
  if (counted === draft) {
    return { status: "APPLIED", draft, removedStopPointIds: [] };
  }
  const points = draft.stopPoints ?? [];
  const occurrences = counted.exercises;
  const newlyDisallowed = points
    .filter((point) => isStopPointAllowed(draft.exercises, point, draft) && !isStopPointAllowed(occurrences, point, counted))
    .map((point) => point.id);
  const settled: SessionDraft =
    newlyDisallowed.length > 0 ? { ...counted, stopPoints: withoutStopPoints(points, newlyDisallowed) } : counted;
  const conflict = tourBoundaryConflict(occurrences, settled.stopPoints ?? [], settled);
  if (conflict === null || tourBoundaryConflict(draft.exercises, points, draft) !== null) {
    return { status: "APPLIED", draft: settled, removedStopPointIds: newlyDisallowed };
  }
  const resolve = (keep: TourBoundaryChoice): CircuitCountResolution => {
    // Revue 7.1 : tous les points de la limite écartée.
    const remaining = settled.stopPoints ?? [];
    const dropped = tourBoundaryPoints(occurrences, remaining, keep === "HEAD" ? "TAIL" : "HEAD").map((point) => point.id);
    return {
      draft: { ...settled, stopPoints: withoutStopPoints(remaining, dropped) },
      removedStopPointIds: [...newlyDisallowed, ...dropped],
    };
  };
  return {
    status: "CHOICE_REQUIRED",
    conflict: { headStopPointId: conflict.head.id, tailStopPointId: conflict.tail.id },
    resolutions: { HEAD: resolve("HEAD"), TAIL: resolve("TAIL") },
    unresolved: settled,
  };
}

/** N appliqué au brouillon (AD-38), sans toucher aux points : corps historique de `setCircuitCount`. */
function withCircuitCount(draft: SessionDraft, requested: number): SessionDraft {
  if (!Number.isFinite(requested)) {
    return draft;
  }
  const count = clampSeriesCount(requested);
  if (count === countOf(draft)) {
    return draft;
  }
  const nature = natureOf(draft);
  switch (nature) {
    case "TOURS":
      return { ...draft, tourRepeatCount: count };
    case "SERIES": {
      // Une entrée de réserve ne survit pas à sa raison d'être : occurrence
      // supprimée, sortie du Circuit ou passée en identiques.
      const reserve: Record<string, readonly SeriesRow[]> = {};
      for (const exercise of draft.exercises) {
        const kept = draft.circuitSeriesReserve?.[exercise.id];
        if (kept !== undefined && isCircuitExercise(exercise) && exercise.executionParameters.series.kind === "VARIABLE") {
          reserve[exercise.id] = kept;
        }
      }
      const exercises = draft.exercises.map((exercise) => {
        if (!isCircuitExercise(exercise)) {
          return exercise;
        }
        const adapted = adaptExercise(exercise, count, reserve[exercise.id] ?? []);
        if (adapted.reserve.length > 0) {
          reserve[exercise.id] = adapted.reserve;
        } else {
          delete reserve[exercise.id];
        }
        return adapted.exercise;
      });
      return withReserve({ ...draft, tourRepeatCount: count, exercises }, reserve);
    }
    default: {
      const unreachable: never = nature;
      return unreachable;
    }
  }
}

/**
 * Pertes de l'entrée d'un exercice dans le Circuit, sans mutation (AD-39) :
 * en Séries, ses séries au-delà de N ; en Tours, aucune.
 */
export function prepareEnterCircuit(draft: SessionDraft, exercise: SessionDraftExercise): CircuitLossReport {
  if (natureOf(draft) !== "SERIES" || exercise.type !== "EXERCISE") {
    return { losses: [] };
  }
  const lost = lostSeriesCount(exercise, countOf(draft));
  return { losses: lost > 0 ? [{ occurrenceId: exercise.id, lostSeriesCount: lost }] : [] };
}

/**
 * Exercice tel qu'il entre dans le Circuit (AD-39) : adapté à N si le
 * Circuit est en Séries (troncature définitive, après confirmation par
 * l'appelant), inchangé en Tours (même référence). Sa position structurelle
 * reste à la charge de l'opération de Composition qui le déplace.
 */
export function enterCircuit(draft: SessionDraft, exercise: SessionDraftExercise): SessionDraftExercise {
  if (natureOf(draft) !== "SERIES" || exercise.type !== "EXERCISE") {
    return exercise;
  }
  return adaptExercise(exercise, countOf(draft), []).exercise;
}

/**
 * Sortie d'un exercice du Circuit (AD-38, AD-39) : son nombre de séries et
 * ses paramètres sont conservés tels quels (l'exercice n'est pas touché) ;
 * seule la réserve de cette occurrence est retirée du brouillon. Même
 * référence s'il n'en avait pas.
 */
export function exitCircuit(draft: SessionDraft, exercise: SessionDraftExercise): SessionDraft {
  const reserve = draft.circuitSeriesReserve;
  if (reserve === undefined || !Object.prototype.hasOwnProperty.call(reserve, exercise.id)) {
    return draft;
  }
  const { [exercise.id]: _removed, ...rest } = reserve;
  return withReserve(draft, rest);
}

/**
 * Volumes du Circuit (AD-39) : une ligne par exercice `IN_TOUR` dans
 * l'ordre, colonnes S1..Smax, cellule = Cible de la série i ou `null`.
 * Séries actives seulement (réserve exclue) ; même résultat dans les deux
 * natures.
 */
export function circuitVolumes(draft: SessionDraft): CircuitVolumes {
  const exercises = draft.exercises.filter(isCircuitExercise);
  const seriesColumnCount = exercises.reduce(
    (max, exercise) => Math.max(max, seriesCountOf(exercise.executionParameters)),
    0,
  );
  const rows = exercises.map((exercise): CircuitVolumeRow => {
    const series = seriesRowsOf(exercise.executionParameters);
    return {
      occurrenceId: exercise.id,
      name: exercise.name,
      mode: exercise.executionParameters.mode,
      sideMode: exercise.sideMode,
      cells: Array.from({ length: seriesColumnCount }, (_, index) => {
        const row = series[index];
        return row === undefined ? null : { ...row.target };
      }),
    };
  });
  return { seriesColumnCount, rows };
}
