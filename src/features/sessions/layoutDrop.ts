/**
 * PRE-9 (story B.4, COMP §6 G1–G8, ARB-06, ARB-09, D-451) — résolution de la destination d'un
 * glisser dans une disposition générale, à partir des boîtes mesurées des éléments rendus.
 *
 * Repère : le contenu défilant de la Composition (ordonnées absolues dans ce contenu). Pendant le
 * glisser la mise en page reste figée (aucun décalage des voisins) : chaque emplacement admis pour
 * l'élément saisi (D-451 : un Exercice partout ; un Circuit au niveau Séance et dans un Cycle ; un
 * Cycle au niveau Séance) reçoit une ordonnée — entre deux membres, sous l'en-tête d'un conteneur
 * (tête), sous son dernier membre (fin) —, et la destination est l'emplacement le plus proche du
 * point de saisie. Un Circuit replié (cartes non rendues) n'offre que sa fin, au milieu de sa boîte.
 * L'élément saisi et son contenu ne sont jamais des destinations ; les rangs sont comptés sans lui
 * (convention de `moveLayoutItem`).
 *
 * Fonctions pures.
 */

import type { LayoutContainerRef, LayoutDestination, LayoutItemRef } from "@/domain/sessions/layoutMoves";
import type { SessionStructure, StructureCircuit, StructureCycleMember, StructureElement, StructureStopPointLocation } from "@/domain/sessions/structure";

/** Boîte verticale mesurée, dans le repère du contenu défilant. */
export type LayoutBox = { readonly top: number; readonly height: number };

/** Clé de la boîte d'un élément (bloc entier : carte, Circuit, Cycle). */
export function layoutItemKey(item: LayoutItemRef): string {
  return `item:${item.kind}:${item.id}`;
}

/** Clé de la boîte de l'en-tête d'un conteneur. */
export function layoutHeaderKey(kind: "CIRCUIT" | "CYCLE", id: string): string {
  return `header:${kind}:${id}`;
}

/** Destination résolue : rang (sans l'élément saisi), conteneur à éclairer, ordonnée du repère d'insertion. */
export type LayoutDropTarget = LayoutDestination & { readonly lineY: number };

/** Écart vertical entre le bord d'un membre et le repère d'insertion qui le borde (tête ou fin). */
export const LAYOUT_DROP_EDGE_INSET = 4;

type Shape<E> = Pick<SessionStructure<E, StructureStopPointLocation>, "elements">;

type Member = { readonly item: LayoutItemRef; readonly circuit?: StructureCircuit<string> };

function elementMember<E>(element: StructureElement<E> | StructureCycleMember<E>, idOf: (exercise: E) => string): Member {
  switch (element.kind) {
    case "EXERCISE":
      return { item: { kind: "EXERCISE", id: idOf(element.exercise) } };
    case "CIRCUIT":
      return {
        item: { kind: "CIRCUIT", id: element.circuit.id },
        circuit: { ...element.circuit, exercises: element.circuit.exercises.map(idOf) },
      };
    case "CYCLE":
      return { item: { kind: "CYCLE", id: element.cycle.id } };
    default: {
      const unreachable: never = element;
      return unreachable;
    }
  }
}

const sameItem = (a: LayoutItemRef, b: LayoutItemRef) => a.kind === b.kind && a.id === b.id;

/**
 * Emplacements admis pour `source` avec leur ordonnée (voir l'en-tête). Un emplacement dont une
 * mesure manque est omis.
 */
export function layoutDropCandidates<E>(
  layout: Shape<E>,
  source: LayoutItemRef,
  boxes: ReadonlyMap<string, LayoutBox>,
  idOf: (exercise: E) => string,
): readonly LayoutDropTarget[] {
  const candidates: LayoutDropTarget[] = [];
  const bottom = (box: LayoutBox) => box.top + box.height;

  /** Rangs d'une suite de membres (sans la source) ; `head` : ordonnée de tête si le conteneur a un en-tête. */
  const sequence = (container: LayoutContainerRef, members: readonly Member[], head: number | null, end: number | null) => {
    const kept = members.filter((member) => !sameItem(member.item, source));
    const measured = kept.map((member) => boxes.get(layoutItemKey(member.item)));
    if (measured.some((box) => box === undefined)) return false;
    const list = measured as LayoutBox[];
    for (let index = 0; index <= list.length; index += 1) {
      const before = list[index - 1];
      const after = list[index];
      const lineY =
        before !== undefined && after !== undefined
          ? (bottom(before) + after.top) / 2
          : after !== undefined
            ? (head ?? after.top - 2 * LAYOUT_DROP_EDGE_INSET)
            : before !== undefined
              ? (end ?? bottom(before) + 2 * LAYOUT_DROP_EDGE_INSET)
              : head;
      if (lineY !== null && lineY !== undefined) candidates.push({ container, index, lineY });
    }
    return true;
  };

  const circuitCandidates = (circuit: StructureCircuit<string>) => {
    if (source.kind !== "EXERCISE") return;
    const header = boxes.get(layoutHeaderKey("CIRCUIT", circuit.id));
    const block = boxes.get(layoutItemKey({ kind: "CIRCUIT", id: circuit.id }));
    const head = header === undefined ? null : bottom(header) + LAYOUT_DROP_EDGE_INSET;
    const members = circuit.exercises.map((id): Member => ({ item: { kind: "EXERCISE", id } }));
    const cards = members.filter((member) => !sameItem(member.item, source));
    const allMeasured = cards.length > 0 && cards.every((member) => boxes.has(layoutItemKey(member.item)));
    if (allMeasured) {
      const last = boxes.get(layoutItemKey(cards[cards.length - 1]!.item))!;
      sequence({ kind: "CIRCUIT", id: circuit.id }, members, head, bottom(last) + LAYOUT_DROP_EDGE_INSET);
    } else if (block !== undefined) {
      // Circuit replié (ou vidé par la saisie) : sa fin seulement, au milieu de sa boîte.
      candidates.push({ container: { kind: "CIRCUIT", id: circuit.id }, index: cards.length, lineY: block.top + block.height / 2 });
    }
  };

  // Niveau Séance.
  const top = layout.elements.map((element) => elementMember(element, idOf));
  sequence({ kind: "SESSION" }, top, null, null);

  for (const [at, element] of layout.elements.entries()) {
    const member = top[at]!;
    if (sameItem(member.item, source)) continue;
    if (element.kind === "CIRCUIT") circuitCandidates(member.circuit!);
    if (element.kind === "CYCLE" && source.kind !== "CYCLE") {
      const header = boxes.get(layoutHeaderKey("CYCLE", element.cycle.id));
      const members = element.cycle.members.map((cycleMember) => elementMember(cycleMember, idOf));
      const kept = members.filter((cycleMember) => !sameItem(cycleMember.item, source));
      const last = kept.length === 0 ? undefined : boxes.get(layoutItemKey(kept[kept.length - 1]!.item));
      sequence(
        { kind: "CYCLE", id: element.cycle.id },
        members,
        header === undefined ? null : bottom(header) + LAYOUT_DROP_EDGE_INSET,
        last === undefined ? null : bottom(last) + LAYOUT_DROP_EDGE_INSET,
      );
      for (const cycleMember of members) {
        if (cycleMember.circuit !== undefined && !sameItem(cycleMember.item, source)) circuitCandidates(cycleMember.circuit);
      }
    }
  }
  return candidates;
}

/** Emplacement admis le plus proche de `pointerY` (à égalité, le premier dans l'ordre de recherche). */
export function resolveLayoutDrop<E>(
  layout: Shape<E>,
  source: LayoutItemRef,
  pointerY: number,
  boxes: ReadonlyMap<string, LayoutBox>,
  idOf: (exercise: E) => string,
): LayoutDropTarget | null {
  let best: LayoutDropTarget | null = null;
  for (const candidate of layoutDropCandidates(layout, source, boxes, idOf)) {
    if (best === null || Math.abs(candidate.lineY - pointerY) < Math.abs(best.lineY - pointerY)) best = candidate;
  }
  return best;
}

/** Même destination (conteneur et rang). */
export function sameLayoutDrop(a: LayoutDestination | null, b: LayoutDestination | null): boolean {
  if (a === null || b === null) return a === b;
  if (a.index !== b.index || a.container.kind !== b.container.kind) return false;
  return a.container.kind === "SESSION" || (b.container.kind !== "SESSION" && a.container.id === b.container.id);
}
