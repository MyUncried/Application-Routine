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

import { adaptExercise, lostSeriesCount, type CircuitLossReport, type CircuitNature } from "./circuit";
import type { SessionDraft, SessionDraftExercise } from "./SessionDraft";
import {
  CYCLE_REPEAT_COUNT_MAX,
  CYCLE_REPEAT_COUNT_MIN,
  structureCircuits,
  type SessionStructure,
  type StructureCircuit,
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
