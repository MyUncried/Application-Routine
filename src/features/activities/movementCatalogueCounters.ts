import { familyPositionOf, type MovementCatalogueEntry } from "./MovementCatalogueService";
import type { MovementCatalogueItem } from "./movementCatalogueView";

/**
 * PRE-9 CAT.1 (spécification « Zones de contexte des Catalogues » du 30/10/2026 §3, CE-CAT-CTX-01) —
 * compteurs « N familles · N mouvements » du Catalogue des Mouvements. Module pur : la liste et ses
 * compteurs partagent la même dérivation (`visibleMovementItems` → `applyMovementCounter` →
 * `movementCatalogueSummary`), jamais une collection différente de celle affichée.
 *
 * - **Deux compteurs activables, un seul actif au maximum** (`toggledMovementCounter`) : toucher
 *   l'inactif l'active et désactive l'autre ; toucher l'actif le désactive (`null` : sans ce filtre).
 * - **Familles affichées** : familles dont au moins une carte est effectivement affichée.
 * - **Mouvements affichés** : cartes effectivement affichées — une pile repliée n'affiche que sa
 *   carte du dessus ; ses membres masqués ne sont pas comptés.
 * - **Filtrage par compteur** (À CLARIFIER, lecture littérale retenue) : le compteur actif restreint
 *   la liste à ce qu'il compte. « Familles » : seules les cartes qui appartiennent à une famille ;
 *   « Mouvements » : toutes les cartes affichées (aucune restriction supplémentaire).
 */

export type MovementCounter = "FAMILIES" | "MOVEMENTS";

/** Toucher un compteur : l'activer (et désactiver l'autre), ou le désactiver s'il est déjà actif. */
export function toggledMovementCounter(current: MovementCounter | null, touched: MovementCounter): MovementCounter | null {
  return current === touched ? null : touched;
}

/** Famille d'une entrée (identifiant de groupe), `null` pour un Mouvement sans famille — même règle que `groupFamilies`. */
export function familyKeyOf(entry: MovementCatalogueEntry): string | null {
  return familyPositionOf(entry) !== null && entry.movement.levelGroup !== null ? entry.movement.levelGroup.groupId : null;
}

/** Famille d'un élément de liste : une pile est toujours une famille ; une carte simple, selon son entrée. */
export function familyKeyOfItem(item: MovementCatalogueItem): string | null {
  return item.kind === "PILE" ? item.key : familyKeyOf(item.entry);
}

/** Restriction de la liste par le compteur actif, après recherche et filtres du panneau. */
export function applyMovementCounter(
  items: readonly MovementCatalogueItem[],
  counter: MovementCounter | null,
): readonly MovementCatalogueItem[] {
  if (counter !== "FAMILIES") return items;
  return items.filter((item) => familyKeyOfItem(item) !== null);
}

/** Nombre de cartes réellement affichées par un élément : pile repliée = sa seule carte du dessus. */
export function displayedCardCount(item: MovementCatalogueItem, expanded: ReadonlySet<string>): number {
  if (item.kind === "SINGLE") return 1;
  return expanded.has(item.key) ? item.members.length : 1;
}

export type MovementCatalogueSummary = {
  /** Familles ayant au moins une carte affichée. */
  readonly families: number;
  /** Cartes affichées (= « N résultats » du Catalogue des Mouvements). */
  readonly movements: number;
};

/** Compteurs de la liste affichée (`items` : liste déjà restreinte par le compteur actif). */
export function movementCatalogueSummary(
  items: readonly MovementCatalogueItem[],
  expanded: ReadonlySet<string>,
): MovementCatalogueSummary {
  const families = new Set<string>();
  let movements = 0;
  for (const item of items) {
    const shown = displayedCardCount(item, expanded);
    movements += shown;
    const family = familyKeyOfItem(item);
    if (family !== null && shown > 0) families.add(family);
  }
  return { families: families.size, movements };
}
