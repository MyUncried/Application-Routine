/**
 * PRE-8 (story A.2, D-449 §4 et §6) — structure générale de la composition d'une Séance.
 *
 * Le niveau principal est une séquence ordonnée d'éléments : un Exercice, un Circuit (groupe
 * ordonné d'Exercices, nature Tours ou Séries, compte 1..99) ou un Cycle (un ou plusieurs
 * Circuits et son propre nombre de répétitions). Plusieurs Cycles peuvent se succéder. Aucune
 * imbrication n'est représentable : un Cycle ne contient que des Circuits, un Circuit que des
 * Exercices. Aucun plafond de Cycles ni de répétitions de Cycle n'est fixé (D-449 §4).
 *
 * L'ancien modèle à Cycle technique unique (`Session.cycle` : avant le Circuit, Circuit, après
 * le Circuit) est exactement la structure `[Exercices…, Circuit, Exercices…]` sans Cycle. Les
 * conversions des deux sens sont pures et sans perte (`structureFromLegacy`,
 * `legacyFromStructure`) : l'interface actuelle lit cette projection, inchangée.
 *
 * Point d'arrêt : `circuitId` (`null` au niveau principal) et `position`, nombre d'éléments du
 * conteneur qui le précèdent (au niveau principal : Exercices, Circuits et Cycles ; dans un
 * Circuit : ses Exercices). Les règles RM-219, RM-251 et D-442 restent celles du modèle à Circuit
 * unique ; leur généralisation relève de la Composition (Epic C). Une structure non représentable
 * dans l'ancien modèle n'accepte donc encore aucun Point d'arrêt
 * (`STRUCTURE_STOP_POINTS_UNSUPPORTED`).
 *
 * Fonctions pures, sans React ni SQLite.
 */

import {
  aggregateSessionDuration,
  type SessionDurationContribution,
  type SessionDurationResult,
} from "@/domain/activities/executionCalculations";

import {
  computeActivityDurationResult,
  seriesCircuitContribution,
  type ActivityDurationFacts,
} from "./calculations";
import { isCircuitNature, type CircuitNature } from "./circuit";
import type { StructuralPosition } from "./Session";

/** Borne du compte d'un Circuit, inchangée (D-058). */
export const CIRCUIT_REPEAT_COUNT_MIN = 1;
export const CIRCUIT_REPEAT_COUNT_MAX = 99;
/** Borne basse des répétitions d'un Cycle ; aucune borne haute (D-449 §4). */
export const CYCLE_REPEAT_COUNT_MIN = 1;

export type StructureCircuit<E> = {
  readonly id: string;
  readonly repeatCount: number;
  readonly nature: CircuitNature;
  readonly exercises: readonly E[];
};

export type StructureCycle<E> = {
  readonly id: string;
  readonly repeatCount: number;
  readonly circuits: readonly StructureCircuit<E>[];
};

export type StructureElement<E> =
  | { readonly kind: "EXERCISE"; readonly exercise: E }
  | { readonly kind: "CIRCUIT"; readonly circuit: StructureCircuit<E> }
  | { readonly kind: "CYCLE"; readonly cycle: StructureCycle<E> };

/** Emplacement d'un Point d'arrêt : conteneur (`null` = niveau principal) et rang. */
export type StructureStopPointLocation = {
  readonly circuitId: string | null;
  readonly position: number;
};

export type StructureStopPoint = StructureStopPointLocation & { readonly id: string };

export type SessionStructure<E, P extends StructureStopPointLocation = StructureStopPoint> = {
  readonly elements: readonly StructureElement<E>[];
  readonly stopPoints: readonly P[];
};

/** Ancien modèle : zones avant, dans et après le Circuit unique. */
export type LegacyComposition<E> = {
  readonly beforeTour: readonly E[];
  readonly tour: StructureCircuit<E>;
  readonly afterTour: readonly E[];
};

/** Point d'arrêt de l'ancien modèle : portée structurelle et emplacement dans cette portée. */
export type LegacyStopPointLocation = {
  readonly scope: StructuralPosition;
  readonly position: number;
};

// ---------------------------------------------------------------------------
// Parcours
// ---------------------------------------------------------------------------

/** Circuits de la structure, Cycles compris, dans l'ordre d'affichage. */
export function structureCircuits<E>(structure: Pick<SessionStructure<E>, "elements">): readonly StructureCircuit<E>[] {
  const circuits: StructureCircuit<E>[] = [];
  for (const element of structure.elements) {
    switch (element.kind) {
      case "EXERCISE":
        break;
      case "CIRCUIT":
        circuits.push(element.circuit);
        break;
      case "CYCLE":
        circuits.push(...element.cycle.circuits);
        break;
      default: {
        const unreachable: never = element;
        return unreachable;
      }
    }
  }
  return circuits;
}

/** Exercices de la structure, chacun une seule fois, dans l'ordre d'affichage. */
export function structureExercises<E>(structure: Pick<SessionStructure<E>, "elements">): readonly E[] {
  const exercises: E[] = [];
  for (const element of structure.elements) {
    switch (element.kind) {
      case "EXERCISE":
        exercises.push(element.exercise);
        break;
      case "CIRCUIT":
        exercises.push(...element.circuit.exercises);
        break;
      case "CYCLE":
        for (const circuit of element.cycle.circuits) {
          exercises.push(...circuit.exercises);
        }
        break;
      default: {
        const unreachable: never = element;
        return unreachable;
      }
    }
  }
  return exercises;
}

/**
 * D-449 §6 : nombre d'Exercices définis dans la composition, sans multiplier par séries, tours,
 * côtés ni répétitions de Cycle. Deux Exercices du même Mouvement comptent pour deux ; un
 * Exercice d'un Circuit ou d'un Cycle reste un seul Exercice.
 */
export function countStructureExercises<E>(structure: Pick<SessionStructure<E>, "elements">): number {
  return structureExercises(structure).length;
}

// ---------------------------------------------------------------------------
// Durée
// ---------------------------------------------------------------------------

function circuitContributions<E extends ActivityDurationFacts>(
  circuit: StructureCircuit<E>,
  cycleRepeatCount: number,
): SessionDurationContribution[] {
  switch (circuit.nature) {
    case "TOURS":
      return circuit.exercises.map((exercise) => ({
        result: computeActivityDurationResult(exercise),
        multiplicity: circuit.repeatCount * cycleRepeatCount,
      }));
    case "SERIES":
      return circuit.exercises.map((exercise) => {
        const contribution = seriesCircuitContribution(exercise, circuit.repeatCount);
        return { ...contribution, multiplicity: contribution.multiplicity * cycleRepeatCount };
      });
    default: {
      const unreachable: never = circuit.nature;
      return unreachable;
    }
  }
}

/**
 * Total typé de la composition (exact, ≈, ≥), selon les mêmes contributions que le modèle à
 * Circuit unique (`computeStructuredSessionDuration`) : un Circuit répète ses Exercices selon sa
 * nature, un Cycle multiplie ses Circuits par son nombre de répétitions. Compte à rebours initial
 * et Fin de séance exclus, comme dans la mesure d'occurrence.
 */
export function computeStructureDuration<E extends ActivityDurationFacts>(
  structure: Pick<SessionStructure<E>, "elements">,
): SessionDurationResult {
  const contributions: SessionDurationContribution[] = [];
  for (const element of structure.elements) {
    switch (element.kind) {
      case "EXERCISE":
        contributions.push({ result: computeActivityDurationResult(element.exercise), multiplicity: 1 });
        break;
      case "CIRCUIT":
        contributions.push(...circuitContributions(element.circuit, 1));
        break;
      case "CYCLE":
        for (const circuit of element.cycle.circuits) {
          contributions.push(...circuitContributions(circuit, element.cycle.repeatCount));
        }
        break;
      default: {
        const unreachable: never = element;
        return unreachable;
      }
    }
  }
  return aggregateSessionDuration(contributions);
}

// ---------------------------------------------------------------------------
// Ancien modèle ↔ structure
// ---------------------------------------------------------------------------

/**
 * Ancien modèle → structure : `[avant…, Circuit, après…]`. Le Circuit est toujours présent,
 * même vide, pour un aller-retour exact ; le Cycle technique unique (`position = 1`,
 * `repeat_count = 1`) n'est pas un Cycle utilisateur et ne produit aucun élément `CYCLE`.
 */
export function structureFromLegacy<E, P extends LegacyStopPointLocation>(
  legacy: LegacyComposition<E>,
  stopPoints: readonly P[] = [],
): SessionStructure<E, Omit<P, "scope" | "position"> & StructureStopPointLocation> {
  const before = legacy.beforeTour.length;
  return {
    elements: [
      ...legacy.beforeTour.map((exercise) => ({ kind: "EXERCISE" as const, exercise })),
      { kind: "CIRCUIT" as const, circuit: legacy.tour },
      ...legacy.afterTour.map((exercise) => ({ kind: "EXERCISE" as const, exercise })),
    ],
    stopPoints: stopPoints.map((point) => {
      const { scope, position, ...rest } = point;
      switch (scope) {
        case "BEFORE_TOUR":
          return { ...rest, circuitId: null, position };
        case "IN_TOUR":
          return { ...rest, circuitId: legacy.tour.id, position };
        case "AFTER_TOUR":
          return { ...rest, circuitId: null, position: before + 1 + position };
        default: {
          const unreachable: never = scope;
          return unreachable;
        }
      }
    }),
  };
}

/**
 * Structure → ancien modèle, ou `null` si elle n'y est pas représentable : aucun Cycle et
 * exactement un Circuit au niveau principal (seule forme produite par l'ancien modèle).
 */
export function legacyFromStructure<E, P extends StructureStopPointLocation>(
  structure: SessionStructure<E, P>,
): { readonly composition: LegacyComposition<E>; readonly stopPoints: readonly (Omit<P, "circuitId" | "position"> & LegacyStopPointLocation)[] } | null {
  const circuitIndexes = structure.elements.flatMap((element, index) => (element.kind === "CIRCUIT" ? [index] : []));
  if (circuitIndexes.length !== 1 || structure.elements.some((element) => element.kind === "CYCLE")) {
    return null;
  }
  const circuitIndex = circuitIndexes[0]!;
  const circuitElement = structure.elements[circuitIndex]!;
  if (circuitElement.kind !== "CIRCUIT") {
    return null;
  }
  const tour = circuitElement.circuit;
  const exercisesOf = (elements: readonly StructureElement<E>[]): E[] =>
    elements.flatMap((element) => (element.kind === "EXERCISE" ? [element.exercise] : []));
  const beforeTour = exercisesOf(structure.elements.slice(0, circuitIndex));
  const afterTour = exercisesOf(structure.elements.slice(circuitIndex + 1));

  const stopPoints: (Omit<P, "circuitId" | "position"> & LegacyStopPointLocation)[] = [];
  for (const point of structure.stopPoints) {
    const { circuitId, position, ...rest } = point;
    if (circuitId === tour.id) {
      stopPoints.push({ ...rest, scope: "IN_TOUR", position });
    } else if (circuitId !== null) {
      return null;
    } else if (position <= circuitIndex) {
      stopPoints.push({ ...rest, scope: "BEFORE_TOUR", position });
    } else {
      stopPoints.push({ ...rest, scope: "AFTER_TOUR", position: position - circuitIndex - 1 });
    }
  }
  return { composition: { beforeTour, tour, afterTour }, stopPoints };
}

// ---------------------------------------------------------------------------
// Validation de forme
// ---------------------------------------------------------------------------

export type StructureViolationCode =
  | "STRUCTURE_EMPTY_CYCLE"
  | "STRUCTURE_CIRCUIT_REPEAT_OUT_OF_RANGE"
  | "STRUCTURE_CYCLE_REPEAT_OUT_OF_RANGE"
  | "STRUCTURE_CIRCUIT_NATURE_UNRECOGNIZED"
  | "STRUCTURE_DUPLICATE_ID"
  | "STRUCTURE_STOP_POINT_UNKNOWN_CIRCUIT"
  | "STRUCTURE_STOP_POINT_OUT_OF_RANGE"
  | "STRUCTURE_STOP_POINT_DUPLICATE"
  | "STRUCTURE_STOP_POINTS_UNSUPPORTED";

export type StructureViolation = { readonly code: StructureViolationCode };

/**
 * Règles de forme de la structure, indépendantes du contenu des Exercices (validé par les règles
 * existantes de l'occurrence) : Cycle non vide, comptes entiers dans leurs bornes, nature connue,
 * identités de Circuit et de Cycle uniques, Points d'arrêt dans leur conteneur, uniques par
 * emplacement. Hors de l'ancien modèle, aucun Point d'arrêt (voir l'en-tête).
 */
export function validateStructureShape<E, P extends StructureStopPointLocation>(
  structure: SessionStructure<E, P>,
  idOf: (exercise: E) => string | undefined,
): readonly StructureViolation[] {
  const violations: StructureViolation[] = [];
  const push = (code: StructureViolationCode) => {
    if (!violations.some((violation) => violation.code === code)) {
      violations.push({ code });
    }
  };
  const ids = new Set<string>();
  const claim = (id: string | undefined) => {
    if (id === undefined) {
      return;
    }
    if (ids.has(id)) {
      push("STRUCTURE_DUPLICATE_ID");
    }
    ids.add(id);
  };
  const checkCircuit = (circuit: StructureCircuit<E>) => {
    claim(circuit.id);
    if (
      !Number.isInteger(circuit.repeatCount) ||
      circuit.repeatCount < CIRCUIT_REPEAT_COUNT_MIN ||
      circuit.repeatCount > CIRCUIT_REPEAT_COUNT_MAX
    ) {
      push("STRUCTURE_CIRCUIT_REPEAT_OUT_OF_RANGE");
    }
    if (!isCircuitNature(circuit.nature)) {
      push("STRUCTURE_CIRCUIT_NATURE_UNRECOGNIZED");
    }
    circuit.exercises.forEach((exercise) => claim(idOf(exercise)));
  };

  for (const element of structure.elements) {
    switch (element.kind) {
      case "EXERCISE":
        claim(idOf(element.exercise));
        break;
      case "CIRCUIT":
        checkCircuit(element.circuit);
        break;
      case "CYCLE":
        claim(element.cycle.id);
        if (!Number.isInteger(element.cycle.repeatCount) || element.cycle.repeatCount < CYCLE_REPEAT_COUNT_MIN) {
          push("STRUCTURE_CYCLE_REPEAT_OUT_OF_RANGE");
        }
        if (element.cycle.circuits.length === 0) {
          push("STRUCTURE_EMPTY_CYCLE");
        }
        element.cycle.circuits.forEach(checkCircuit);
        break;
      default: {
        const unreachable: never = element;
        return unreachable;
      }
    }
  }

  const circuitSizes = new Map(structureCircuits(structure).map((circuit) => [circuit.id, circuit.exercises.length]));
  const seen = new Set<string>();
  for (const point of structure.stopPoints) {
    const size = point.circuitId === null ? structure.elements.length : circuitSizes.get(point.circuitId);
    if (size === undefined) {
      push("STRUCTURE_STOP_POINT_UNKNOWN_CIRCUIT");
      continue;
    }
    if (!Number.isInteger(point.position) || point.position < 0 || point.position > size) {
      push("STRUCTURE_STOP_POINT_OUT_OF_RANGE");
      continue;
    }
    const key = `${point.circuitId ?? ""}:${point.position}`;
    if (seen.has(key)) {
      push("STRUCTURE_STOP_POINT_DUPLICATE");
    }
    seen.add(key);
  }
  if (structure.stopPoints.length > 0 && legacyFromStructure({ elements: structure.elements, stopPoints: [] }) === null) {
    push("STRUCTURE_STOP_POINTS_UNSUPPORTED");
  }
  return violations;
}
