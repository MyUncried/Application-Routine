/**
 * PRE-9 (story B.1b, D-451, COMP §2 et §4, ARB-13) — opérations de Composition sur une disposition
 * générale (`SessionDraft.structure` plus riche que l'ancien modèle : plusieurs Circuits, Cycles).
 *
 * Mêmes règles que pour le Circuit unique (`circuit.ts`), appliquées au Circuit désigné :
 * - compte du Circuit 1..99 ; en séries alternées, chaque Exercice du Circuit suit N, la diminution
 *   met les lignes retirées en réserve, l'augmentation restaure d'abord depuis la réserve (AD-38) ;
 * - nature : groupées → alternées adapte chaque Exercice à N, perte annoncée avant toute mutation
 *   (`prepareLayoutNatureChange`) et troncature définitive à la confirmation ; alternées → groupées
 *   ne change que la nature (COMP §2) ;
 * - compte du Cycle 1..99 (D-451).
 * Les Points d'arrêt ne sont pas concernés : une disposition générale n'en porte pas avant B.6.
 *
 * Lettres de désignation (COMP §4, ARB-13) : Circuit A, B… dans l'ordre de Composition, à
 * l'échelle de la Séance (sans repartir dans chaque Cycle), Cycle A, B… de même ; aucune lettre
 * lorsqu'un seul conteneur de cette nature est présent ; après Z : AA, AB…, réattribuées selon
 * l'ordre. Une lettre désigne, elle n'est pas un identifiant.
 *
 * Fonctions pures ; même référence lorsque rien ne change.
 */

import { clampSeriesCount, type SeriesRow } from "@/domain/activities/ExecutionParameters";

import { adaptExercise, DEFAULT_CIRCUIT_NATURE, lostSeriesCount, type CircuitLossReport, type CircuitNature } from "./circuit";
import { DEFAULT_TOUR_REPEAT_COUNT } from "./defaults";
import type { StructuralPosition } from "./Session";
import type { SessionDraft, SessionDraftExercise } from "./SessionDraft";
import type { StopPoint } from "./StopPoint";
import {
  CYCLE_REPEAT_COUNT_MAX,
  CYCLE_REPEAT_COUNT_MIN,
  legacyFromStructure,
  NO_CIRCUIT_ID,
  structureCircuits,
  structureFromLegacy,
  withoutEmptyLegacyCircuit,
  type SessionStructure,
  type StructureCircuit,
  type StructureCycleMember,
  type StructureElement,
  type StructureStopPointLocation,
} from "./structure";

type Layout = SessionStructure<string, StructureStopPointLocation>;

/** Lettre de rang `index` (0 → A, 25 → Z, 26 → AA, 27 → AB…). */
export function designationLetter(index: number): string {
  let rest = index;
  let letters = "";
  do {
    letters = String.fromCharCode(65 + (rest % 26)) + letters;
    rest = Math.floor(rest / 26) - 1;
  } while (rest >= 0);
  return letters;
}

/** Lettres des Circuits et des Cycles par identifiant ; absente quand le conteneur est seul de sa nature. */
export function containerLetters(layout: Pick<Layout, "elements">): ReadonlyMap<string, string> {
  const circuits = structureCircuits(layout).map((circuit) => circuit.id);
  const cycles = layout.elements.flatMap((element) => (element.kind === "CYCLE" ? [element.cycle.id] : []));
  const letters = new Map<string, string>();
  for (const ids of [circuits, cycles]) {
    if (ids.length > 1) {
      ids.forEach((id, index) => letters.set(id, designationLetter(index)));
    }
  }
  return letters;
}

/** Remplace le Circuit `circuitId` de la disposition (même référence si absent ou inchangé). */
function withLayoutCircuit(layout: Layout, circuitId: string, update: (circuit: StructureCircuit<string>) => StructureCircuit<string>): Layout {
  let changed = false;
  const apply = (circuit: StructureCircuit<string>) => {
    if (circuit.id !== circuitId) {
      return circuit;
    }
    const next = update(circuit);
    changed ||= next !== circuit;
    return next;
  };
  const elements = layout.elements.map((element): StructureElement<string> => {
    switch (element.kind) {
      case "EXERCISE":
        return element;
      case "CIRCUIT":
        return { kind: "CIRCUIT", circuit: apply(element.circuit) };
      case "CYCLE":
        return {
          kind: "CYCLE",
          cycle: {
            ...element.cycle,
            members: element.cycle.members.map((member) => (member.kind === "CIRCUIT" ? { kind: "CIRCUIT", circuit: apply(member.circuit) } : member)),
          },
        };
      default: {
        const unreachable: never = element;
        return unreachable;
      }
    }
  });
  return changed ? { ...layout, elements } : layout;
}

function layoutCircuit(draft: SessionDraft, circuitId: string): StructureCircuit<string> | undefined {
  return draft.structure === undefined ? undefined : structureCircuits(draft.structure).find((circuit) => circuit.id === circuitId);
}

/** Exercices du Circuit qui suivent N : ceux de type `EXERCISE` (AD-37). */
function followsCount(draft: SessionDraft, circuit: StructureCircuit<string>): (exercise: SessionDraftExercise) => boolean {
  const members = new Set(circuit.exercises);
  return (exercise) => members.has(exercise.id) && exercise.type === "EXERCISE";
}

/** Compte du Circuit désigné, borné 1..99 (voir l'en-tête). */
export function setLayoutCircuitCount(draft: SessionDraft, circuitId: string, requested: number): SessionDraft {
  const circuit = layoutCircuit(draft, circuitId);
  if (circuit === undefined || draft.structure === undefined || !Number.isFinite(requested)) {
    return draft;
  }
  const count = clampSeriesCount(requested);
  if (count === circuit.repeatCount) {
    return draft;
  }
  const structure = withLayoutCircuit(draft.structure, circuitId, (current) => ({ ...current, repeatCount: count }));
  if (circuit.nature === "TOURS") {
    return { ...draft, structure };
  }
  const inCircuit = followsCount(draft, circuit);
  const reserve: Record<string, readonly SeriesRow[]> = { ...(draft.circuitSeriesReserve ?? {}) };
  const exercises = draft.exercises.map((exercise) => {
    if (!inCircuit(exercise)) {
      return exercise;
    }
    const kept = exercise.executionParameters.series.kind === "VARIABLE" ? (reserve[exercise.id] ?? []) : [];
    const adapted = adaptExercise(exercise, count, kept);
    if (adapted.reserve.length > 0) {
      reserve[exercise.id] = adapted.reserve;
    } else {
      delete reserve[exercise.id];
    }
    return adapted.exercise;
  });
  return { ...draft, structure, exercises, circuitSeriesReserve: Object.keys(reserve).length === 0 ? undefined : reserve };
}

/** Pertes d'un changement de nature du Circuit désigné, sans mutation (voir l'en-tête). */
export function prepareLayoutNatureChange(draft: SessionDraft, circuitId: string, nature: CircuitNature): CircuitLossReport {
  const circuit = layoutCircuit(draft, circuitId);
  if (circuit === undefined || nature === circuit.nature || nature === "TOURS") {
    return { losses: [] };
  }
  const inCircuit = followsCount(draft, circuit);
  return {
    losses: draft.exercises.flatMap((exercise) => {
      const lost = inCircuit(exercise) ? lostSeriesCount(exercise, circuit.repeatCount) : 0;
      return lost > 0 ? [{ occurrenceId: exercise.id, lostSeriesCount: lost }] : [];
    }),
  };
}

/** Applique un changement de nature du Circuit désigné, sans confirmation (à la charge de l'appelant). */
export function applyLayoutNatureChange(draft: SessionDraft, circuitId: string, nature: CircuitNature): SessionDraft {
  const circuit = layoutCircuit(draft, circuitId);
  if (circuit === undefined || draft.structure === undefined || nature === circuit.nature) {
    return draft;
  }
  const structure = withLayoutCircuit(draft.structure, circuitId, (current) => ({ ...current, nature }));
  if (nature === "TOURS") {
    return { ...draft, structure };
  }
  const inCircuit = followsCount(draft, circuit);
  const reserve: Record<string, readonly SeriesRow[]> = { ...(draft.circuitSeriesReserve ?? {}) };
  const exercises = draft.exercises.map((exercise) => {
    if (!inCircuit(exercise)) {
      return exercise;
    }
    // Conversion confirmée : troncature définitive, aucune réserve conservée.
    delete reserve[exercise.id];
    return adaptExercise(exercise, circuit.repeatCount, []).exercise;
  });
  return { ...draft, structure, exercises, circuitSeriesReserve: Object.keys(reserve).length === 0 ? undefined : reserve };
}

/** Compte du Cycle désigné, borné 1..99 (D-451). */
export function setLayoutCycleCount(draft: SessionDraft, cycleId: string, requested: number): SessionDraft {
  if (draft.structure === undefined || !Number.isFinite(requested)) {
    return draft;
  }
  const count = Math.min(CYCLE_REPEAT_COUNT_MAX, Math.max(CYCLE_REPEAT_COUNT_MIN, Math.round(requested)));
  let changed = false;
  const elements = draft.structure.elements.map((element): StructureElement<string> => {
    if (element.kind !== "CYCLE" || element.cycle.id !== cycleId || element.cycle.repeatCount === count) {
      return element;
    }
    changed = true;
    return { kind: "CYCLE", cycle: { ...element.cycle, repeatCount: count } };
  });
  return changed ? { ...draft, structure: { ...draft.structure, elements } } : draft;
}

// ---------------------------------------------------------------------------
// PRE-9 (B.2, ARB-06, ARB-07, D-451) — création par enveloppe et insertion
// ---------------------------------------------------------------------------

/**
 * Disposition courante du brouillon, que la Composition l'édite dans l'ancien modèle (zones,
 * compte, nature, Points du brouillon ; Circuit vide absent) ou dans la structure générale.
 */
export function currentLayout(draft: SessionDraft, newContainerId: () => string): Layout {
  const layout = draft.structure;
  const legacy = layout === undefined ? null : legacyFromStructure(layout);
  if (layout !== undefined && legacy === null) {
    return layout;
  }
  const zone = (position: StructuralPosition) => draft.exercises.filter((exercise) => exercise.structuralPosition === position).map((exercise) => exercise.id);
  const tour = legacy?.composition.tour;
  const structure = structureFromLegacy(
    {
      beforeTour: zone("BEFORE_TOUR"),
      tour: {
        id: tour !== undefined && tour.id !== NO_CIRCUIT_ID ? tour.id : newContainerId(),
        repeatCount: draft.tourRepeatCount ?? DEFAULT_TOUR_REPEAT_COUNT,
        nature: draft.circuitNature ?? tour?.nature ?? DEFAULT_CIRCUIT_NATURE,
        exercises: zone("IN_TOUR"),
      },
      afterTour: zone("AFTER_TOUR"),
    },
    (draft.stopPoints ?? []).map((point) => ({ id: point.id, scope: point.scope, position: point.position })),
  );
  return withoutEmptyLegacyCircuit(structure);
}

/**
 * Brouillon portant la disposition `layout` : représentable dans l'ancien modèle, ses zones,
 * compte, nature et Points sont réécrits (la Composition de l'ancien modèle les lit) ; sinon la
 * disposition fait foi (les champs de l'ancien modèle ne sont plus lus).
 */
export function withLayout(draft: SessionDraft, layout: Layout): SessionDraft {
  const legacy = legacyFromStructure(layout);
  if (legacy === null) {
    return { ...draft, structure: layout };
  }
  const byId = new Map(draft.exercises.map((exercise) => [exercise.id, exercise]));
  const placed = (ids: readonly string[], structuralPosition: StructuralPosition) =>
    ids.flatMap((id) => {
      const exercise = byId.get(id);
      return exercise === undefined ? [] : [exercise.structuralPosition === structuralPosition ? exercise : { ...exercise, structuralPosition }];
    });
  const { beforeTour, tour, afterTour } = legacy.composition;
  // Les Points de la disposition portent l'identité de ceux du brouillon (`currentLayout`).
  const stopPoints: StopPoint[] = legacy.stopPoints.map((point) => ({
    id: (point as { readonly id?: string }).id ?? `${point.scope}-${point.position}`,
    scope: point.scope,
    position: point.position,
  }));
  return {
    ...draft,
    exercises: [...placed(beforeTour, "BEFORE_TOUR"), ...placed(tour.exercises, "IN_TOUR"), ...placed(afterTour, "AFTER_TOUR")],
    tourRepeatCount: tour.repeatCount,
    circuitNature: tour.nature,
    ...(stopPoints.length > 0 || draft.stopPoints !== undefined ? { stopPoints } : {}),
    structure: layout,
  };
}

/** Contenu qu'un nouveau conteneur peut envelopper (ARB-06 ; règles d'imbrication D-451). */
export type EnvelopeTarget = { readonly kind: "EXERCISE" | "CIRCUIT"; readonly id: string };

/**
 * Une disposition générale ne porte aucun Point d'arrêt avant B.6 (`STRUCTURE_STOP_POINTS_UNSUPPORTED`) :
 * tant qu'une Séance en a, aucun conteneur qui la ferait sortir de l'ancien modèle n'est proposé.
 */
function blockedByStopPoints(result: Layout): boolean {
  return result.stopPoints.length > 0 && legacyFromStructure(result) === null;
}

function eligibleExercise(draft: SessionDraft, id: string): boolean {
  const exercise = draft.exercises.find((item) => item.id === id);
  // Exercice formaté : poser un Circuit dessus relève d'ARB-27 (C.4), refusé sans altération d'ici là.
  return exercise !== undefined && exercise.type === "EXERCISE" && (exercise.format ?? null) === null;
}

function wrapped(layout: Layout, target: EnvelopeTarget, container: "CIRCUIT" | "CYCLE", newId: string): Layout | null {
  const circuitAround = (id: string): StructureCircuit<string> => ({ id: newId, repeatCount: 1, nature: DEFAULT_CIRCUIT_NATURE, exercises: [id] });
  let found = false;
  const elements = layout.elements.map((element): StructureElement<string> => {
    if (container === "CIRCUIT" && target.kind === "EXERCISE") {
      if (element.kind === "EXERCISE" && element.exercise === target.id) {
        found = true;
        return { kind: "CIRCUIT", circuit: circuitAround(target.id) };
      }
      if (element.kind === "CYCLE" && element.cycle.members.some((member) => member.kind === "EXERCISE" && member.exercise === target.id)) {
        found = true;
        const members = element.cycle.members.map((member): StructureCycleMember<string> =>
          member.kind === "EXERCISE" && member.exercise === target.id ? { kind: "CIRCUIT", circuit: circuitAround(target.id) } : member,
        );
        return { kind: "CYCLE", cycle: { ...element.cycle, members } };
      }
    }
    if (container === "CYCLE") {
      if (element.kind === "EXERCISE" && target.kind === "EXERCISE" && element.exercise === target.id) {
        found = true;
        return { kind: "CYCLE", cycle: { id: newId, repeatCount: CYCLE_REPEAT_COUNT_MIN, members: [element] } };
      }
      if (element.kind === "CIRCUIT" && target.kind === "CIRCUIT" && element.circuit.id === target.id) {
        found = true;
        return { kind: "CYCLE", cycle: { id: newId, repeatCount: CYCLE_REPEAT_COUNT_MIN, members: [element] } };
      }
    }
    return element;
  });
  // Un Point du niveau principal garde sa place : le nombre d'éléments ne change pas.
  return found ? { ...layout, elements } : null;
}

/** Contenus éligibles pour poser un Circuit (Exercice du niveau Séance ou d'un Cycle) ou un Cycle (Exercice ou Circuit du niveau Séance). */
export function envelopeCandidates(draft: SessionDraft, container: "CIRCUIT" | "CYCLE"): readonly EnvelopeTarget[] {
  const layout = currentLayout(draft, () => "candidate");
  const targets: EnvelopeTarget[] = [];
  for (const element of layout.elements) {
    if (element.kind === "EXERCISE" && eligibleExercise(draft, element.exercise)) {
      targets.push({ kind: "EXERCISE", id: element.exercise });
    } else if (container === "CYCLE" && element.kind === "CIRCUIT") {
      targets.push({ kind: "CIRCUIT", id: element.circuit.id });
    } else if (container === "CIRCUIT" && element.kind === "CYCLE") {
      for (const member of element.cycle.members) {
        if (member.kind === "EXERCISE" && eligibleExercise(draft, member.exercise)) {
          targets.push({ kind: "EXERCISE", id: member.exercise });
        }
      }
    }
  }
  return targets.filter((target) => {
    const result = wrapped(layout, target, container, "candidate");
    return result !== null && !blockedByStopPoints(result);
  });
}

/**
 * Pose un Circuit ou un Cycle sur un premier contenu (ARB-06) : le conteneur est créé autour de
 * lui, compte 1 (Circuit à séries groupées), jamais vide. Contenu non éligible : brouillon inchangé.
 * Les contenus suivants rejoignent le conteneur par glisser-déposer (B.4).
 */
export function wrapInContainer(
  draft: SessionDraft,
  target: EnvelopeTarget,
  container: "CIRCUIT" | "CYCLE",
  newContainerId: () => string,
): SessionDraft {
  if (!envelopeCandidates(draft, container).some((candidate) => candidate.kind === target.kind && candidate.id === target.id)) {
    return draft;
  }
  const result = wrapped(currentLayout(draft, newContainerId), target, container, newContainerId());
  return result === null ? draft : withLayout(draft, result);
}

/**
 * ARB-07 : un nouvel Exercice est inséré après le dernier Exercice entré, dans son conteneur ; sans
 * repère (ou repère absent), à la fin du niveau principal. Disposition générale seulement : dans
 * l'ancien modèle, l'insertion existante s'applique.
 */
export function insertExerciseInLayout(draft: SessionDraft, exercise: SessionDraftExercise, afterExerciseId: string | null): SessionDraft {
  const layout = draft.structure;
  if (layout === undefined || legacyFromStructure(layout) !== null) {
    return { ...draft, exercises: [...draft.exercises, exercise] };
  }
  let placed = false;
  const inCircuit = (circuit: StructureCircuit<string>): StructureCircuit<string> => {
    const index = placed || afterExerciseId === null ? -1 : circuit.exercises.indexOf(afterExerciseId);
    if (index < 0) {
      return circuit;
    }
    placed = true;
    return { ...circuit, exercises: [...circuit.exercises.slice(0, index + 1), exercise.id, ...circuit.exercises.slice(index + 1)] };
  };
  const elements: StructureElement<string>[] = [];
  for (const element of layout.elements) {
    if (element.kind === "CIRCUIT") {
      elements.push({ kind: "CIRCUIT", circuit: inCircuit(element.circuit) });
    } else if (element.kind === "CYCLE") {
      const members: StructureCycleMember<string>[] = [];
      for (const member of element.cycle.members) {
        if (member.kind === "CIRCUIT") {
          members.push({ kind: "CIRCUIT", circuit: inCircuit(member.circuit) });
        } else {
          members.push(member);
          if (!placed && member.exercise === afterExerciseId) {
            placed = true;
            members.push({ kind: "EXERCISE", exercise: exercise.id });
          }
        }
      }
      elements.push({ kind: "CYCLE", cycle: { ...element.cycle, members } });
    } else {
      elements.push(element);
      if (!placed && element.exercise === afterExerciseId) {
        placed = true;
        elements.push({ kind: "EXERCISE", exercise: exercise.id });
      }
    }
  }
  if (!placed) {
    elements.push({ kind: "EXERCISE", exercise: exercise.id });
  }
  return { ...draft, exercises: [...draft.exercises, exercise], structure: { ...layout, elements } };
}
