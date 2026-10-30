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
 * - **Mouvements** [Recette iPhone du 30/10/2026, Hermann (cat-compteurs) : « Le nombre de
 *   mouvements doit inclure le comptage des cartes invisibles des plis » ; (cat-bascule) : « le
 *   compteur des mouvements compte tous les mouvements en incluant ceux qui sont dans les piles,
 *   appuyer sur mouvements déplie toutes les listes affichées »] : tous les Mouvements de la liste
 *   courante, membres masqués des piles repliées compris. [Remplace, au 30/10/2026, la règle
 *   d'origine (§3) : « Mouvements affichés : cartes effectivement affichées » / « ne pas utiliser
 *   automatiquement le nombre total de membres d'une famille repliée ».]
 * - **Cartes affichées** (`displayed`) : cartes réellement visibles (pile repliée = sa carte du
 *   dessus) ; base inchangée de « N résultats » (§5, nombres recettés sans remarque le 30/10).
 * - **Filtrage par compteur** (À CLARIFIER, lecture littérale retenue) : le compteur actif restreint
 *   la liste à ce qu'il compte. « Familles » : seules les cartes qui appartiennent à une famille ;
 *   « Mouvements » : toutes les cartes (aucune restriction supplémentaire) ; son activation déplie
 *   les piles affichées (`MovementCatalogueList`).
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
  /** Tous les Mouvements de la liste courante, membres des piles repliées compris (recette du 30/10). */
  readonly movements: number;
  /** Cartes réellement affichées (= « N résultats » du Catalogue des Mouvements). */
  readonly displayed: number;
};

/** Compteurs de la liste courante (`items` : liste déjà restreinte par le compteur actif). */
export function movementCatalogueSummary(
  items: readonly MovementCatalogueItem[],
  expanded: ReadonlySet<string>,
): MovementCatalogueSummary {
  const families = new Set<string>();
  let movements = 0;
  let displayed = 0;
  for (const item of items) {
    const shown = displayedCardCount(item, expanded);
    displayed += shown;
    movements += item.kind === "PILE" ? item.members.length : 1;
    const family = familyKeyOfItem(item);
    if (family !== null && shown > 0) families.add(family);
  }
  return { families: families.size, movements, displayed };
}

/** Compteurs identiques (l'écran hôte garde alors l'objet courant, sans nouveau rendu). */
export function sameMovementSummary(a: MovementCatalogueSummary | null, b: MovementCatalogueSummary | null): boolean {
  return a !== null && b !== null && a.families === b.families && a.movements === b.movements && a.displayed === b.displayed;
}

/** Clés des piles de la liste courante (dépliage par le compteur « mouvements »). */
export function pileKeysOf(items: readonly MovementCatalogueItem[]): readonly string[] {
  return items.filter((item) => item.kind === "PILE").map((item) => item.key);
}

/**
 * Recette iPhone CAT.1 du 30/10/2026, constat a) (Hermann : « Choisir un mouvement existant : les
 * piles où se trouvent un ou des mouvements déjà utilisés doivent être dépliées si le ou les
 * mouvements ne sont pas visibles ») — piles dont un membre MASQUÉ (pas la carte du dessus) est
 * déjà dans la Séance.
 */
export function pilesHidingIds(items: readonly MovementCatalogueItem[], ids: ReadonlySet<string>): readonly string[] {
  return items
    .filter((item) => item.kind === "PILE" && item.members.slice(1).some((member) => ids.has(member.movement.id)))
    .map((item) => item.key);
}
