/**
 * PRE-9 (stories B.4, B.5, B.6) — opérations élémentaires sur l'arbre d'une disposition générale,
 * partagées par les déplacements (`layoutMoves.ts`) et les opérations de Composition
 * (`layoutOperations.ts`) : retrait d'un élément (`detach`), insertion à un rang (`attach`, règles
 * d'imbrication D-451), retrait des conteneurs vidés (`pruneEmpty`, COMP §1), emplacement d'un
 * élément (`layoutItemLocation`).
 *
 * PRE-9 B.6 (D-441 : « les points restent à leur place dans la séquence » ; ARB-02) : chaque opération
 * tient à jour les Points d'arrêt de la disposition (`layoutStopPoints.ts`) ; `withSettledStopPoints`
 * applique ensuite la règle tolérante de D-442 et rend le choix de répétition le cas échéant.
 *
 * Extrait de `layoutMoves.ts` (B.4 / B.5) le 31/10/2026, sans changement de comportement hors Points.
 * Fonctions pures.
 */

import { separatorOf, settleLayoutStopPoints, stopPointsAfterInsertion, stopPointsAfterRemoval, type LayoutRepetitionConflictInfo } from "./layoutStopPoints";
import type { SessionDraft } from "./SessionDraft";
import type { TourBoundaryChoice } from "./StopPoint";
import type { SessionStructure, StructureCircuit, StructureCycle, StructureCycleMember, StructureElement, StructureStopPointLocation } from "./structure";

type Layout = SessionStructure<string, StructureStopPointLocation>;

/** Élément déplaçable : Exercice (identifiant d'occurrence), Circuit ou Cycle (identifiant de conteneur). */
export type LayoutItemRef = { readonly kind: "EXERCISE" | "CIRCUIT" | "CYCLE"; readonly id: string };

/** Conteneur de destination : niveau Séance, Cycle ou Circuit. */
export type LayoutContainerRef = { readonly kind: "SESSION" } | { readonly kind: "CYCLE" | "CIRCUIT"; readonly id: string };

/**
 * Destination : conteneur et rang parmi ses membres, l'élément déplacé retiré (les conteneurs vidés
 * par ce retrait comptent encore : ils ne disparaissent qu'à l'application).
 */
export type LayoutDestination = { readonly container: LayoutContainerRef; readonly index: number };

/** Nœud détaché par le retrait de la source. */
export type Detached =
  | { readonly kind: "EXERCISE"; readonly id: string }
  | { readonly kind: "CIRCUIT"; readonly circuit: StructureCircuit<string> }
  | { readonly kind: "CYCLE"; readonly cycle: StructureCycle<string> };

/**
 * Retire la source de la disposition, conteneurs vidés CONSERVÉS ; `null` si elle est absente. B.6 :
 * les Points de son conteneur qui la suivaient reculent d'un rang (D-441 : à leur place dans la
 * séquence) ; un conteneur détaché garde les siens.
 */
export function detach(layout: Layout, source: LayoutItemRef): { readonly layout: Layout; readonly node: Detached } | null {
  const location = layoutItemLocation(layout, source);
  let node: Detached | null = null;
  const fromCircuit = (circuit: StructureCircuit<string>): StructureCircuit<string> => {
    if (source.kind !== "EXERCISE" || !circuit.exercises.includes(source.id)) return circuit;
    node = { kind: "EXERCISE", id: source.id };
    return { ...circuit, exercises: circuit.exercises.filter((id) => id !== source.id) };
  };
  const elements: StructureElement<string>[] = [];
  for (const element of layout.elements) {
    switch (element.kind) {
      case "EXERCISE":
        if (source.kind === "EXERCISE" && element.exercise === source.id) node = { kind: "EXERCISE", id: source.id };
        else elements.push(element);
        break;
      case "CIRCUIT":
        if (source.kind === "CIRCUIT" && element.circuit.id === source.id) node = { kind: "CIRCUIT", circuit: element.circuit };
        else elements.push({ kind: "CIRCUIT", circuit: fromCircuit(element.circuit) });
        break;
      case "CYCLE": {
        if (source.kind === "CYCLE" && element.cycle.id === source.id) {
          node = { kind: "CYCLE", cycle: element.cycle };
          break;
        }
        const members = element.cycle.members.flatMap((member): StructureCycleMember<string>[] => {
          if (member.kind === "EXERCISE") {
            if (source.kind === "EXERCISE" && member.exercise === source.id) {
              node = { kind: "EXERCISE", id: source.id };
              return [];
            }
            return [member];
          }
          if (source.kind === "CIRCUIT" && member.circuit.id === source.id) {
            node = { kind: "CIRCUIT", circuit: member.circuit };
            return [];
          }
          return [{ kind: "CIRCUIT", circuit: fromCircuit(member.circuit) }];
        });
        elements.push({ kind: "CYCLE", cycle: { ...element.cycle, members } });
        break;
      }
      default: {
        const unreachable: never = element;
        return unreachable;
      }
    }
  }
  if (node === null || location === null) return null;
  return { layout: { elements, stopPoints: stopPointsAfterRemoval(layout.stopPoints, location.container, location.index) }, node };
}

export const clampIndex = (index: number, length: number) =>
  Math.max(0, Math.min(Number.isFinite(index) ? Math.trunc(index) : length, length));

export function insertAt<T>(items: readonly T[], index: number, item: T): T[] {
  const at = clampIndex(index, items.length);
  return [...items.slice(0, at), item, ...items.slice(at)];
}

/** Insère le nœud à la destination ; `null` si le conteneur est absent ou si l'imbrication est interdite (D-451). */
export function attach(layout: Layout, node: Detached, destination: LayoutDestination): Layout | "NESTING" | null {
  const { container, index } = destination;
  switch (container.kind) {
    case "SESSION": {
      const element: StructureElement<string> =
        node.kind === "EXERCISE"
          ? { kind: "EXERCISE", exercise: node.id }
          : node.kind === "CIRCUIT"
            ? { kind: "CIRCUIT", circuit: node.circuit }
            : { kind: "CYCLE", cycle: node.cycle };
      return {
        elements: insertAt(layout.elements, index, element),
        stopPoints: stopPointsAfterInsertion(layout.stopPoints, container, clampIndex(index, layout.elements.length)),
      };
    }
    case "CYCLE": {
      if (node.kind === "CYCLE") return "NESTING";
      const member: StructureCycleMember<string> =
        node.kind === "EXERCISE" ? { kind: "EXERCISE", exercise: node.id } : { kind: "CIRCUIT", circuit: node.circuit };
      let size: number | null = null;
      const elements = layout.elements.map((element): StructureElement<string> => {
        if (element.kind !== "CYCLE" || element.cycle.id !== container.id) return element;
        size = element.cycle.members.length;
        return { kind: "CYCLE", cycle: { ...element.cycle, members: insertAt(element.cycle.members, index, member) } };
      });
      return size === null ? null : { elements, stopPoints: stopPointsAfterInsertion(layout.stopPoints, container, clampIndex(index, size)) };
    }
    case "CIRCUIT": {
      if (node.kind !== "EXERCISE") return "NESTING";
      let size: number | null = null;
      const into = (circuit: StructureCircuit<string>): StructureCircuit<string> => {
        if (circuit.id !== container.id) return circuit;
        size = circuit.exercises.length;
        return { ...circuit, exercises: insertAt(circuit.exercises, index, node.id) };
      };
      const elements = layout.elements.map((element): StructureElement<string> => {
        switch (element.kind) {
          case "EXERCISE":
            return element;
          case "CIRCUIT":
            return { kind: "CIRCUIT", circuit: into(element.circuit) };
          case "CYCLE":
            return {
              kind: "CYCLE",
              cycle: {
                ...element.cycle,
                members: element.cycle.members.map((member) => (member.kind === "CIRCUIT" ? { kind: "CIRCUIT", circuit: into(member.circuit) } : member)),
              },
            };
          default: {
            const unreachable: never = element;
            return unreachable;
          }
        }
      });
      return size === null ? null : { elements, stopPoints: stopPointsAfterInsertion(layout.stopPoints, container, clampIndex(index, size)) };
    }
    default: {
      const unreachable: never = container;
      return unreachable;
    }
  }
}

/** Premier conteneur vide (Circuit, puis Cycle devenu vide), avec son parent et son rang. */
function firstEmptyContainer(layout: Layout): { readonly ref: LayoutItemRef; readonly parent: LayoutContainerRef; readonly index: number } | null {
  for (const [at, element] of layout.elements.entries()) {
    if (element.kind === "CIRCUIT" && element.circuit.exercises.length === 0) {
      return { ref: { kind: "CIRCUIT", id: element.circuit.id }, parent: { kind: "SESSION" }, index: at };
    }
    if (element.kind === "CYCLE") {
      for (const [index, member] of element.cycle.members.entries()) {
        if (member.kind === "CIRCUIT" && member.circuit.exercises.length === 0) {
          return { ref: { kind: "CIRCUIT", id: member.circuit.id }, parent: { kind: "CYCLE", id: element.cycle.id }, index };
        }
      }
      if (element.cycle.members.length === 0) return { ref: { kind: "CYCLE", id: element.cycle.id }, parent: { kind: "SESSION" }, index: at };
    }
  }
  return null;
}

/**
 * COMP §1 : retire les Circuits puis les Cycles devenus vides ; rend les conteneurs retirés. B.6 : les
 * Points qui suivaient un conteneur retiré reculent d'un rang ; les siens restent sans emplacement et
 * sont retirés sans message par `settleLayoutStopPoints` (comme ceux d'un Circuit vidé de l'ancien
 * modèle).
 */
export function pruneEmpty(layout: Layout): { readonly layout: Layout; readonly removed: readonly LayoutItemRef[] } {
  const removed: LayoutItemRef[] = [];
  let current = layout;
  for (let empty = firstEmptyContainer(current); empty !== null; empty = firstEmptyContainer(current)) {
    const { ref, parent, index } = empty;
    removed.push(ref);
    const elements =
      parent.kind === "SESSION"
        ? current.elements.filter((_, at) => at !== index)
        : current.elements.map((element): StructureElement<string> =>
            element.kind === "CYCLE" && element.cycle.id === parent.id
              ? { kind: "CYCLE", cycle: { ...element.cycle, members: element.cycle.members.filter((_, at) => at !== index) } }
              : element,
          );
    current = { elements, stopPoints: stopPointsAfterRemoval(current.stopPoints, parent, index) };
  }
  return { layout: current, removed };
}

/** Comparaison structurelle de deux séquences d'éléments (identités et ordre). */
export const sameElements = (a: Layout, b: Layout) => JSON.stringify(a.elements) === JSON.stringify(b.elements);

/** Lecture des séparateurs du brouillon (occurrences `EXERCISE`, RM-251). */
export const separatorsOfDraft = (draft: SessionDraft) => separatorOf(draft.exercises);

/**
 * PRE-9 B.6 : issue d'une opération de structure, Points réglés (`settleLayoutStopPoints`) — `finish`
 * produit l'issue pour une disposition dont les Points sont retenus ; un conflit de répétition créé
 * rend le choix requis, chaque résolution passant par `finish`. Un refus de `finish` (Format, contrôle)
 * ne dépend pas des Points : il est rendu tel quel.
 */
export function withSettledStopPoints<R extends { readonly status: string }>(
  draft: SessionDraft,
  before: Layout,
  after: Layout,
  finish: (layout: Layout, removedStopPointIds: readonly string[]) => R,
): R | { readonly status: "CHOICE_REQUIRED"; readonly conflict: LayoutRepetitionConflictInfo; readonly resolutions: Readonly<Record<TourBoundaryChoice, R>> } {
  const isSeparator = separatorsOfDraft(draft);
  const settled = settleLayoutStopPoints({ layout: before, isSeparator }, { layout: after, isSeparator });
  if (settled.status === "APPLIED") return finish({ ...after, stopPoints: settled.stopPoints }, settled.removedStopPointIds);
  const head = finish({ ...after, stopPoints: settled.resolutions.HEAD.stopPoints }, settled.resolutions.HEAD.removedStopPointIds);
  const tail = finish({ ...after, stopPoints: settled.resolutions.TAIL.stopPoints }, settled.resolutions.TAIL.removedStopPointIds);
  return { status: "CHOICE_REQUIRED", conflict: settled.conflict, resolutions: { HEAD: head, TAIL: tail } };
}

/** Emplacement actuel d'un élément : son conteneur et son rang. */
export function layoutItemLocation(layout: Pick<Layout, "elements">, source: LayoutItemRef): LayoutDestination | null {
  const inCircuit = (circuit: StructureCircuit<string>): LayoutDestination | null => {
    const index = source.kind === "EXERCISE" ? circuit.exercises.indexOf(source.id) : -1;
    return index < 0 ? null : { container: { kind: "CIRCUIT", id: circuit.id }, index };
  };
  for (const [at, element] of layout.elements.entries()) {
    if (element.kind === "EXERCISE" && source.kind === "EXERCISE" && element.exercise === source.id) return { container: { kind: "SESSION" }, index: at };
    if (element.kind === "CIRCUIT") {
      if (source.kind === "CIRCUIT" && element.circuit.id === source.id) return { container: { kind: "SESSION" }, index: at };
      const found = inCircuit(element.circuit);
      if (found !== null) return found;
    }
    if (element.kind === "CYCLE") {
      if (source.kind === "CYCLE" && element.cycle.id === source.id) return { container: { kind: "SESSION" }, index: at };
      for (const [index, member] of element.cycle.members.entries()) {
        if (member.kind === "EXERCISE" && source.kind === "EXERCISE" && member.exercise === source.id) {
          return { container: { kind: "CYCLE", id: element.cycle.id }, index };
        }
        if (member.kind === "CIRCUIT") {
          if (source.kind === "CIRCUIT" && member.circuit.id === source.id) return { container: { kind: "CYCLE", id: element.cycle.id }, index };
          const found = inCircuit(member.circuit);
          if (found !== null) return found;
        }
      }
    }
  }
  return null;
}

