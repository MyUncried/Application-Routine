import type { MovementCatalogueItem } from "@/features/activities/movementCatalogueView";

/**
 * Catalogue d'un format en modification (D-572, Hermann, 25/11/2026 ; Formats § 9.9) : les mouvements sélectionnés sont figés en haut,
 * dans leur propre zone ; la liste qui défile dessous ne les montre plus. Une pile dont il ne reste qu'un membre devient une carte
 * seule ; une pile vidée disparaît. Désélectionner une carte figée la rend à la liste (elle n'est plus dans `pinned`).
 */
export function withoutPinned(items: readonly MovementCatalogueItem[], pinned: ReadonlySet<string>): readonly MovementCatalogueItem[] {
  if (pinned.size === 0) return items;
  return items.flatMap((item): MovementCatalogueItem[] => {
    if (item.kind === "SINGLE") return pinned.has(item.entry.movement.id) ? [] : [item];
    const members = item.members.filter((entry) => !pinned.has(entry.movement.id));
    if (members.length === item.members.length) return [item];
    if (members.length === 0) return [];
    if (members.length === 1) return [{ kind: "SINGLE", key: item.key, entry: members[0]! }];
    return [{ ...item, members }];
  });
}
