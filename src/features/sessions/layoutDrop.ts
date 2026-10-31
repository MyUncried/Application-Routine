/**
 * PRE-9 (story B.4, COMP §6 G1–G8, ARB-06, ARB-09, D-451) — résolution de la destination d'un
 * glisser dans une disposition générale, à partir des boîtes mesurées des éléments rendus.
 *
 * Repère : le contenu défilant de la Composition (ordonnées absolues dans ce contenu). Les boîtes
 * sont celles de la mise en page (les translations de l'aperçu ne les changent pas) : chaque
 * emplacement admis pour l'élément saisi (D-451 : un Exercice partout ; un Circuit au niveau Séance
 * et dans un Cycle ; un Cycle au niveau Séance) reçoit une ordonnée — entre deux membres, sous
 * l'en-tête d'un conteneur (tête), sous son dernier membre (fin) —, et la destination est
 * l'emplacement le plus proche du point de saisie. Un Circuit replié (cartes non rendues) n'offre que
 * sa fin, au milieu de sa boîte. L'élément saisi et son contenu ne sont jamais des destinations ; les
 * rangs sont comptés sans lui (convention de `moveLayoutItem`).
 *
 * [B.4 : « Pendant le glisser la mise en page reste figée (aucun décalage des voisins) » — remplacé
 * par la recette iPhone n° 2 du 31/10/2026 (Hermann : « le comportement tel qu'il a été défini
 * initialement […] : déplacement des bords des circuits / cycle et déplacement des cartes pour faire
 * la place à la carte déplacée ») :] chaque emplacement porte aussi son seuil d'insertion (`insertY` :
 * ce qui est à cette ordonnée ou plus bas descend pour faire la place) et le haut que l'élément
 * déposé y occupera (`insertTop`), lus par l'aperçu (`layoutDragShifts.ts`).
 *
 * Recette iPhone n° 2 du 31/10/2026 (b6-deplacer) : un rang qui porte des Points d'arrêt offre deux
 * emplacements à un élément saisi — avant eux et après eux (`afterStopPoints`, `LayoutDropStopPoint`).
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

/** PRE-9 B.6 : clé de la boîte mesurée de la rangée d'un Point d'arrêt (point de saisie du glisser). */
export function layoutStopBoxKey(stopPointId: string): string {
  return `stop:${stopPointId}`;
}

/**
 * Destination résolue : rang (sans l'élément saisi) dans son conteneur, ordonnée de l'emplacement
 * (`lineY`, distance au point de saisie), seuil d'insertion (`insertY`) et haut de l'élément déposé
 * (`insertTop`), dans la mise en page d'origine.
 */
export type LayoutDropTarget = LayoutDestination & { readonly lineY: number; readonly insertY: number; readonly insertTop: number };

/** Écart vertical entre le bord d'un membre et l'ordonnée d'emplacement qui le borde (tête ou fin). */
export const LAYOUT_DROP_EDGE_INSET = 4;

/** Écart entre deux membres d'un conteneur (place ouverte par l'aperçu) ; 0 par défaut. */
export type LayoutGapOf = (container: LayoutContainerRef) => number;
const NO_GAP: LayoutGapOf = () => 0;

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
const sameContainer = (a: LayoutContainerRef, b: LayoutContainerRef) =>
  a.kind === b.kind && (a.kind === "SESSION" || (b.kind !== "SESSION" && a.id === b.id));

/**
 * Recette iPhone n° 2 du 31/10/2026 (b6-deplacer) : Point d'arrêt de la disposition (conteneur, rang
 * AVEC la source, identifiant de sa rangée mesurée) — un rang qui porte des Points offre deux
 * emplacements à un Exercice, un Circuit ou un Cycle saisi : avant eux et après eux (`afterStopPoints`).
 */
export type LayoutDropStopPoint = { readonly container: LayoutContainerRef; readonly position: number; readonly id: string };

/**
 * Emplacements admis pour `source` avec leur ordonnée (voir l'en-tête). Un emplacement dont une
 * mesure manque est omis. `gapOf` : écart des membres de chaque conteneur (haut de l'élément déposé).
 */
export function layoutDropCandidates<E>(
  layout: Shape<E>,
  source: LayoutItemRef,
  boxes: ReadonlyMap<string, LayoutBox>,
  idOf: (exercise: E) => string,
  gapOf: LayoutGapOf = NO_GAP,
  stopPoints: readonly LayoutDropStopPoint[] = [],
): readonly LayoutDropTarget[] {
  const candidates: LayoutDropTarget[] = [];
  const bottom = (box: LayoutBox) => box.top + box.height;

  /**
   * Recette iPhone n° 2 du 31/10/2026 (b6-deplacer) : boîtes des Points d'arrêt du rang `index` (rangs
   * comptés sans la source) du conteneur, dans l'ordre ; `null` si l'une n'est pas mesurée.
   */
  const pointBoxesAt = (container: LayoutContainerRef, sourceIndex: number, index: number): LayoutBox[] | null => {
    const boxesAt: LayoutBox[] = [];
    for (const point of stopPoints) {
      if (!sameContainer(point.container, container)) continue;
      const rank = sourceIndex >= 0 && point.position > sourceIndex ? point.position - 1 : point.position;
      if (rank !== index) continue;
      const box = boxes.get(layoutStopBoxKey(point.id));
      if (box === undefined) return null;
      boxesAt.push(box);
    }
    return boxesAt.sort((a, b) => a.top - b.top);
  };

  /** Rangs d'une suite de membres (sans la source) ; `head` : ordonnée de tête si le conteneur a un en-tête. */
  const sequence = (container: LayoutContainerRef, members: readonly Member[], head: number | null, end: number | null) => {
    const sourceIndex = members.findIndex((member) => sameItem(member.item, source));
    const kept = members.filter((member) => !sameItem(member.item, source));
    const measured = kept.map((member) => boxes.get(layoutItemKey(member.item)));
    if (measured.some((box) => box === undefined)) return false;
    const list = measured as LayoutBox[];
    const gap = gapOf(container);
    // Haut du contenu sous l'en-tête (tête du conteneur).
    const headTop = head === null ? null : head - LAYOUT_DROP_EDGE_INSET + gap;
    for (let index = 0; index <= list.length; index += 1) {
      const before = list[index - 1];
      const after = list[index];
      // Recette n° 2 : Points d'arrêt de ce rang — l'emplacement « avant eux » est au-dessus du
      // premier, un second emplacement « après eux » sous le dernier.
      const points = pointBoxesAt(container, sourceIndex, index) ?? [];
      const firstPoint = points[0];
      const lastPoint = points[points.length - 1];
      const below = firstPoint ?? after;
      const lineY =
        before !== undefined && below !== undefined
          ? (bottom(before) + below.top) / 2
          : below !== undefined
            ? (head ?? below.top - 2 * LAYOUT_DROP_EDGE_INSET)
            : before !== undefined
              ? (end ?? bottom(before) + 2 * LAYOUT_DROP_EDGE_INSET)
              : head;
      if (lineY !== null && lineY !== undefined) {
        // Insertion juste après le membre qui précède (avant les Points d'arrêt de ce rang, convention
        // de `stopPointsAfterInsertion`), sinon en tête du conteneur.
        const insertY = before !== undefined ? bottom(before) + 0.5 : below !== undefined && head === null ? below.top - 0.5 : lineY;
        const insertTop = before !== undefined ? bottom(before) + gap : (headTop ?? below?.top ?? lineY);
        candidates.push({ container, index, lineY, insertY, insertTop });
      }
      if (lastPoint !== undefined) {
        const afterLineY = after !== undefined ? (bottom(lastPoint) + after.top) / 2 : bottom(lastPoint) + 2 * LAYOUT_DROP_EDGE_INSET;
        candidates.push({
          container,
          index,
          afterStopPoints: true,
          lineY: afterLineY,
          insertY: bottom(lastPoint) + 0.5,
          insertTop: bottom(lastPoint) + gap,
        });
      }
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
      // Circuit replié (ou vidé par la saisie) : sa fin seulement, au milieu de sa boîte ; la place
      // s'ouvre au bas du Circuit.
      candidates.push({
        container: { kind: "CIRCUIT", id: circuit.id },
        index: cards.length,
        lineY: block.top + block.height / 2,
        insertY: bottom(block) - 0.5,
        insertTop: bottom(block),
      });
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
  gapOf: LayoutGapOf = NO_GAP,
  stopPoints: readonly LayoutDropStopPoint[] = [],
): LayoutDropTarget | null {
  let best: LayoutDropTarget | null = null;
  for (const candidate of layoutDropCandidates(layout, source, boxes, idOf, gapOf, stopPoints)) {
    if (best === null || Math.abs(candidate.lineY - pointerY) < Math.abs(best.lineY - pointerY)) best = candidate;
  }
  return best;
}

/** Même destination (conteneur et rang). */
export function sameLayoutDrop(a: LayoutDestination | null, b: LayoutDestination | null): boolean {
  if (a === null || b === null) return a === b;
  if (a.index !== b.index || a.container.kind !== b.container.kind || (a.afterStopPoints === true) !== (b.afterStopPoints === true)) return false;
  return a.container.kind === "SESSION" || (b.container.kind !== "SESSION" && a.container.id === b.container.id);
}

/**
 * Recette iPhone n° 2 du 31/10/2026 (Hermann : « L'arrêt d'une carte sur un circuit replié doit
 * l'ouvrir ») — temps d'arrêt, en millisecondes, d'un élément saisi sur un Circuit replié avant que
 * ce Circuit se déploie (rendu choisi, Figma muet : à valider sur iPhone). L'arrêt est compté tant que
 * la destination résolue reste ce Circuit replié (sa fin, seule destination qu'il offre replié).
 */
export const LAYOUT_COLLAPSED_HOVER_DELAY_MS = 500;

/**
 * Circuit replié visé par la destination `dropTarget` (identifiant), `null` sinon. Un Circuit replié
 * n'offre que sa fin (`layoutDropCandidates`) : la destination est dans ce Circuit si et seulement si
 * l'élément saisi est arrêté sur lui (jamais un Circuit ni un Cycle, D-451 ; l'écran ne l'applique qu'à
 * une carte d'Exercice, pas à un Point d'arrêt saisi).
 */
export function hoveredCollapsedCircuit(dropTarget: LayoutDestination | null, isCollapsed: (circuitId: string) => boolean): string | null {
  if (dropTarget === null || dropTarget.container.kind !== "CIRCUIT") return null;
  return isCollapsed(dropTarget.container.id) ? dropTarget.container.id : null;
}
