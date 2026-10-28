import type { MovementLevelPosition } from "@/domain/activities/movementSuggestion";

/**
 * PRE-8 — familles de niveaux du Catalogue des Mouvements (règles A à E du 28/10/2026, DSF
 * « Composition et ordre des familles », CE-MVT-03). Module pur : à partir de la place des cartes
 * affichées et du centre de la carte portée, décide ce que ferait le relâchement, et calcule les
 * niveaux provisoires annoncés pendant le geste.
 *
 * - Membre d'une famille dépliée : dans l'emprise verticale du filet, réordonnancement (A) ; au-delà,
 *   quel que soit le côté, sortie (B1). Un membre ne se pose sur aucune autre carte (C6).
 * - Mouvement sans famille : posé sur une carte sans famille, création (C1) ; sur un membre d'une
 *   famille dépliée, entrée (C2) ; au-dessus de la moitié de la carte visée, niveau supérieur, en
 *   dessous, niveau inférieur (C3, C7). Une famille repliée se déplie à l'approche (C5).
 * - Ailleurs : rien (un Mouvement sans famille n'a pas de position manuelle, B5).
 */

/** Une carte affichée, dans le repère du contenu de la liste. */
export type DragSlot = {
  readonly id: string;
  /** Famille dépliée dont la carte est membre, `null` sinon. */
  readonly familyKey: string | null;
  /** Pile repliée que la carte représente, `null` sinon. */
  readonly collapsedKey: string | null;
  /** La carte peut recevoir un Mouvement sans famille (active ; sans famille, ou membre d'une famille dépliée). */
  readonly joinable: boolean;
  readonly top: number;
  readonly height: number;
};

export type DragIntent =
  | { readonly kind: "NONE" }
  /** A : nouvelle position de la carte parmi les membres affichés (ordre affiché, niveau le plus élevé en tête). */
  | { readonly kind: "REORDER"; readonly to: number }
  /** B : sortie de la famille. */
  | { readonly kind: "LEAVE" }
  /** C : pose au-dessus ou en dessous de l'ancre ; `familyKey` : famille rejointe, `null` : création. */
  | { readonly kind: "PLACE"; readonly anchorId: string; readonly side: "ABOVE" | "BELOW"; readonly familyKey: string | null }
  /** C5 : la carte approche une famille repliée, qui se déplie. */
  | { readonly kind: "EXPAND"; readonly familyKey: string };

export function dragIntent(input: {
  readonly slots: readonly DragSlot[];
  readonly draggedId: string;
  /** Famille dépliée de la carte portée, `null` pour un Mouvement sans famille. */
  readonly familyKey: string | null;
  /** Centre courant de la carte portée. */
  readonly centerY: number;
  /** Position visée parmi les membres si le geste reste un réordonnancement. */
  readonly reorderTo: number;
  /** Le Mouvement porté est sans famille dans les données (un membre masqué par un filtre ne l'est pas). */
  readonly free: boolean;
}): DragIntent {
  const { slots, draggedId, familyKey, centerY } = input;
  if (familyKey !== null) {
    const members = slots.filter((slot) => slot.familyKey === familyKey);
    // Emprise inconnue (cartes pas encore mesurées) : le geste reste un réordonnancement, jamais une sortie.
    if (members.length === 0) return { kind: "REORDER", to: input.reorderTo };
    const top = Math.min(...members.map((slot) => slot.top));
    const bottom = Math.max(...members.map((slot) => slot.top + slot.height));
    return centerY >= top && centerY <= bottom ? { kind: "REORDER", to: input.reorderTo } : { kind: "LEAVE" };
  }
  if (!input.free) return { kind: "NONE" };
  const target = slots.find((slot) => slot.id !== draggedId && centerY >= slot.top && centerY < slot.top + slot.height);
  if (!target) return { kind: "NONE" };
  if (target.collapsedKey !== null) return { kind: "EXPAND", familyKey: target.collapsedKey };
  if (!target.joinable) return { kind: "NONE" };
  const side = centerY < target.top + target.height / 2 ? "ABOVE" : "BELOW";
  return { kind: "PLACE", anchorId: target.id, side, familyKey: target.familyKey };
}

/**
 * A4, B2, C4 : niveaux affichés d'un ordre provisoire (niveau le plus élevé en tête), calculés sur
 * les seuls membres actifs, comme les niveaux établis (b8-3) ; moins de deux actifs : aucun niveau.
 */
export function previewLevels(displayed: readonly { readonly id: string; readonly active: boolean }[]): ReadonlyMap<string, MovementLevelPosition | null> {
  const active = displayed.filter((member) => member.active);
  const levels = new Map<string, MovementLevelPosition | null>();
  for (const member of displayed) levels.set(member.id, null);
  if (active.length < 2) return levels;
  active.forEach((member, index) => levels.set(member.id, { rank: active.length - index, total: active.length }));
  return levels;
}

/** Ordre affiché d'une famille après la pose du Mouvement au-dessus ou en dessous de l'ancre. */
export function placedOrder(displayed: readonly string[], movedId: string, anchorId: string, side: "ABOVE" | "BELOW"): readonly string[] {
  const others = displayed.filter((id) => id !== movedId);
  const anchorIndex = others.indexOf(anchorId);
  if (anchorIndex < 0) return displayed;
  const at = side === "ABOVE" ? anchorIndex : anchorIndex + 1;
  return [...others.slice(0, at), movedId, ...others.slice(at)];
}

/**
 * A : après un réordonnancement affiché, ancre et côté qui expriment la nouvelle place (voisin du
 * dessus : posé en dessous ; en tête : posé au-dessus du suivant).
 */
export function reorderAnchor(displayedAfter: readonly string[], movedId: string): { readonly anchorId: string; readonly side: "ABOVE" | "BELOW" } | null {
  const index = displayedAfter.indexOf(movedId);
  if (index < 0 || displayedAfter.length < 2) return null;
  return index > 0 ? { anchorId: displayedAfter[index - 1]!, side: "BELOW" } : { anchorId: displayedAfter[1]!, side: "ABOVE" };
}

