/**
 * PRE-9 — recette iPhone n° 2 du 31/10/2026 (b4-entrer, b4-sortir, b4-cycle-entier, b6-glisser,
 * b6-recup). Hermann : « Je ne veux pas d'encadré bleu et de trait d'insertion, mais le comportement
 * tel qu'il a été défini initialement, et qui fonctionne avec un seul circuit : déplacement des bords
 * des circuits / cycle et déplacement des cartes pour faire la place à la carte déplacée » ; « il faut
 * conserver les principes d'animation déjà validés ».
 *
 * Aperçu du glisser d'une disposition générale par les mécanismes de l'ancien modèle (PRE-6 stories
 * 2.3b, 5.2, 5.2b, 7.4, 7.6 ; amendement de Hermann du 21/10/2026 : le Circuit « s'agrandit ou se
 * rétracte pendant le geste ») : la mise en page n'est pas recalculée ; chaque élément affiché — carte,
 * rangée de Point d'arrêt, bord haut (en-tête, anneau) et bord bas d'un Circuit ou d'un Cycle — reçoit
 * une translation qui montre la disposition du dépôt. Translations posées dans le registre partagé
 * (`AnimatedShiftRegistry`, durée et courbe de `compositionMotion.ts`) ; le fond d'un conteneur suit
 * ses deux bords (`CircuitSurface`), les liens du rail s'étirent.
 *
 * Règle, dans la mise en page d'origine (boîtes mesurées) :
 * - retrait : tout ce qui est sous l'élément saisi (ordonnée ≥ son bas) remonte de sa hauteur plus
 *   l'écart de son conteneur — sa place se referme, les conteneurs qui le contenaient se rétractent ;
 * - insertion à l'emplacement visé : tout ce qui est à son seuil (`insertY`) ou plus bas descend de
 *   la hauteur de l'élément plus l'écart du conteneur visé — la place s'ouvre, les conteneurs qui la
 *   contiennent s'agrandissent ;
 * - l'élément saisi et son contenu ne reçoivent rien (il suit le doigt).
 *
 * Fonctions pures.
 */

import type { LayoutContainerRef } from "@/domain/sessions/layoutMoves";
import { layoutStopPointId, stopPointContainerOf, type LayoutStopPoint } from "@/domain/sessions/layoutStopPoints";
import type { SessionStructure, StructureCircuit, StructureCycleMember, StructureElement, StructureStopPointLocation } from "@/domain/sessions/structure";
import { RAIL_KEYS, railRowKey, railStopKey } from "@/features/sessions/compositionRail";
import { layoutItemKey, layoutStopBoxKey, type LayoutBox, type LayoutDropTarget } from "@/features/sessions/layoutDrop";

/** Clé de translation d'un bord (haut : en-tête et anneau ; bas) d'un Circuit ou d'un Cycle. */
export function layoutEdgeShiftKey(kind: "CIRCUIT" | "CYCLE", id: string, edge: "top" | "bottom"): string {
  return `layout:${edge}:${kind}:${id}`;
}

/** Clé de translation d'un bloc entier (Circuit ou Cycle saisi : retour ou mise en place après le lâcher). */
export function layoutBlockShiftKey(kind: "CIRCUIT" | "CYCLE", id: string): string {
  return `layout:block:${kind}:${id}`;
}

/** Élément affiché de la disposition, dans l'ordre d'affichage. */
export type LayoutShiftPiece = {
  readonly kind: "EXERCISE" | "STOP_POINT" | "CIRCUIT" | "CYCLE";
  readonly id: string;
  /** Boîte mesurée (`layoutDrop.ts`). */
  readonly boxKey: string;
  /** Translation du haut (rangée entière, ou bord haut d'un conteneur). */
  readonly topKey: string;
  /** Translation du bas (rangée : la même ; conteneur : son bord bas). */
  readonly bottomKey: string;
  /** Conteneur direct. */
  readonly container: LayoutContainerRef;
  /** Boîtes des conteneurs qui l'englobent. */
  readonly within: readonly string[];
};

type Layout<E> = Pick<SessionStructure<E, StructureStopPointLocation>, "elements"> & { readonly stopPoints: readonly LayoutStopPoint[] };

const sameContainer = (a: LayoutContainerRef, b: LayoutContainerRef) =>
  a.kind === b.kind && (a.kind === "SESSION" || (b.kind !== "SESSION" && a.id === b.id));

/** Éléments affichés de la disposition (cartes, Points d'arrêt, Circuits, Cycles), dans l'ordre d'affichage. */
export function layoutShiftPieces<E>(layout: Layout<E>, idOf: (exercise: E) => string): readonly LayoutShiftPiece[] {
  const pieces: LayoutShiftPiece[] = [];
  const stopsAt = (container: LayoutContainerRef, position: number, within: readonly string[]) => {
    for (const point of layout.stopPoints) {
      const own = stopPointContainerOf(point);
      if (own === null || point.position !== position || !sameContainer(own, container)) continue;
      const id = layoutStopPointId(point);
      const key = railStopKey(id);
      pieces.push({ kind: "STOP_POINT", id, boxKey: layoutStopBoxKey(id), topKey: key, bottomKey: key, container, within });
    }
  };
  const exercise = (id: string, container: LayoutContainerRef, within: readonly string[]) => {
    const key = railRowKey(id);
    pieces.push({ kind: "EXERCISE", id, boxKey: layoutItemKey({ kind: "EXERCISE", id }), topKey: key, bottomKey: key, container, within });
  };
  const circuit = (item: StructureCircuit<E>, container: LayoutContainerRef, within: readonly string[]) => {
    const boxKey = layoutItemKey({ kind: "CIRCUIT", id: item.id });
    pieces.push({
      kind: "CIRCUIT",
      id: item.id,
      boxKey,
      topKey: layoutEdgeShiftKey("CIRCUIT", item.id, "top"),
      bottomKey: layoutEdgeShiftKey("CIRCUIT", item.id, "bottom"),
      container,
      within,
    });
    const inner = [boxKey, ...within];
    const own: LayoutContainerRef = { kind: "CIRCUIT", id: item.id };
    item.exercises.forEach((member, index) => {
      stopsAt(own, index, inner);
      exercise(idOf(member), own, inner);
    });
    stopsAt(own, item.exercises.length, inner);
  };
  const element = (item: StructureElement<E> | StructureCycleMember<E>, container: LayoutContainerRef, within: readonly string[]) => {
    switch (item.kind) {
      case "EXERCISE":
        exercise(idOf(item.exercise), container, within);
        return;
      case "CIRCUIT":
        circuit(item.circuit, container, within);
        return;
      case "CYCLE": {
        const boxKey = layoutItemKey({ kind: "CYCLE", id: item.cycle.id });
        pieces.push({
          kind: "CYCLE",
          id: item.cycle.id,
          boxKey,
          topKey: layoutEdgeShiftKey("CYCLE", item.cycle.id, "top"),
          bottomKey: layoutEdgeShiftKey("CYCLE", item.cycle.id, "bottom"),
          container,
          within,
        });
        const inner = [boxKey, ...within];
        const own: LayoutContainerRef = { kind: "CYCLE", id: item.cycle.id };
        item.cycle.members.forEach((member, index) => {
          stopsAt(own, index, inner);
          element(member, own, inner);
        });
        stopsAt(own, item.cycle.members.length, inner);
        return;
      }
      default: {
        const unreachable: never = item;
        return unreachable;
      }
    }
  };
  const session: LayoutContainerRef = { kind: "SESSION" };
  layout.elements.forEach((item, index) => {
    stopsAt(session, index, []);
    element(item, session, []);
  });
  stopsAt(session, layout.elements.length, []);
  return pieces;
}

/** Élément saisi : sa boîte et l'écart du conteneur qu'il quitte. */
export type LayoutLiftedSource = { readonly boxKey: string; readonly gap: number };

/** Emplacement visé : seuil d'insertion et écart du conteneur visé. */
export type LayoutShiftInsertion = Pick<LayoutDropTarget, "insertY" | "insertTop"> & { readonly gap: number };

/** Translations de l'aperçu (clé du registre → translation) et décalage net de ce qui suit la séquence (Fin de séance). */
export type LayoutDragShifts = { readonly shifts: ReadonlyMap<string, number>; readonly end: number };

/** Pièce de l'élément saisi, d'après sa boîte. */
export function liftedPiece(pieces: readonly LayoutShiftPiece[], boxKey: string): LayoutShiftPiece | undefined {
  return pieces.find((piece) => piece.boxKey === boxKey);
}

/**
 * Translations qui montrent la disposition du dépôt à l'emplacement `insertion` (`null` : aucun
 * emplacement, l'élément saisi garde sa place) ; `null` si l'élément saisi n'est pas mesuré.
 * Une pièce non mesurée ne bouge pas.
 */
export function layoutDragShifts(
  pieces: readonly LayoutShiftPiece[],
  boxes: ReadonlyMap<string, LayoutBox>,
  source: LayoutLiftedSource,
  insertion: LayoutShiftInsertion | null,
): LayoutDragShifts | null {
  const box = boxes.get(source.boxKey);
  if (box === undefined) return null;
  const removed = box.top + box.height;
  const shiftAt = (y: number) =>
    (y >= removed ? -(box.height + source.gap) : 0) + (insertion !== null && y >= insertion.insertY ? box.height + insertion.gap : 0);
  const shifts = new Map<string, number>();
  for (const piece of pieces) {
    if (piece.boxKey === source.boxKey || piece.within.includes(source.boxKey)) continue;
    const measured = boxes.get(piece.boxKey);
    if (measured === undefined) continue;
    const top = shiftAt(measured.top);
    if (top !== 0) shifts.set(piece.topKey, top);
    if (piece.bottomKey !== piece.topKey) {
      const bottom = shiftAt(measured.top + measured.height);
      if (bottom !== 0) shifts.set(piece.bottomKey, bottom);
    }
  }
  return { shifts, end: shiftAt(Number.POSITIVE_INFINITY) };
}

/** Deux aperçus identiques (mêmes translations). */
export function sameLayoutDragShifts(a: LayoutDragShifts | null, b: LayoutDragShifts | null): boolean {
  if (a === null || b === null) return a === b;
  if (a.end !== b.end || a.shifts.size !== b.shifts.size) return false;
  for (const [key, value] of a.shifts) if (b.shifts.get(key) !== value) return false;
  return true;
}

/**
 * PRE-6 story 7.6 (« pas de saut jusqu'à sa place ») appliquée à la disposition générale : translation
 * qui garde l'élément déposé sous le lâcher (`translationY`) dans la NOUVELLE disposition, où il occupe
 * le haut prédit par l'aperçu ; ramenée ensuite à 0 par le registre. `null` si non mesuré.
 */
export function layoutSettleOffset(
  boxes: ReadonlyMap<string, LayoutBox>,
  source: LayoutLiftedSource,
  insertion: LayoutShiftInsertion,
  translationY: number,
): number | null {
  const box = boxes.get(source.boxKey);
  if (box === undefined) return null;
  const removed = box.top + box.height;
  const landing = insertion.insertTop + (insertion.insertTop >= removed ? -(box.height + source.gap) : 0);
  return box.top + translationY - landing;
}

/** Lien du rail d'un élément du niveau Séance : prédécesseur (clé de translation de son bas) et longueur ajoutée. */
export type LayoutRailLink = { readonly prevKey: string; readonly extra: number };

/**
 * Liens du rail au niveau Séance (PRE-6 story 5.2, `compositionRail.ts`) : chaque élément se relie au
 * bas de l'élément qui le précède — le Compte à rebours pour le premier ; la Fin de séance
 * (`RAIL_KEYS.end`) au dernier. L'élément `skipped` (saisi, tenu ou en retour : story 5.2b) sort de la
 * chaîne : son successeur se relie à travers sa place (`extra` : sa hauteur plus l'écart). Dans un
 * conteneur, le rail est porté par la queue du conteneur, qui suit ses deux bords : aucun lien ici.
 */
export function layoutSessionRailLinks(
  pieces: readonly LayoutShiftPiece[],
  skipped: { readonly boxKey: string; readonly extra: number } | null,
): ReadonlyMap<string, LayoutRailLink> {
  const links = new Map<string, LayoutRailLink>();
  let prevKey: string = RAIL_KEYS.start;
  let extra = 0;
  for (const piece of pieces) {
    if (piece.container.kind !== "SESSION") continue;
    if (skipped !== null && piece.boxKey === skipped.boxKey) {
      extra += skipped.extra;
      continue;
    }
    links.set(piece.topKey, { prevKey, extra });
    prevKey = piece.bottomKey;
    extra = 0;
  }
  links.set(RAIL_KEYS.end, { prevKey, extra });
  return links;
}

/** Clés de translation de toutes les pièces (au repos : 0), y compris les blocs entiers des conteneurs. */
export function layoutShiftKeys(pieces: readonly LayoutShiftPiece[]): readonly string[] {
  return pieces.flatMap((piece) =>
    piece.kind === "CIRCUIT" || piece.kind === "CYCLE" ? [piece.topKey, piece.bottomKey, layoutBlockShiftKey(piece.kind, piece.id)] : [piece.topKey],
  );
}

/** Clé de la saisie d'une pièce (translation qui la porte au lâcher : rangée, ou bloc entier). */
export function liftedShiftKey(piece: LayoutShiftPiece): string {
  return piece.kind === "CIRCUIT" || piece.kind === "CYCLE" ? layoutBlockShiftKey(piece.kind, piece.id) : piece.topKey;
}

