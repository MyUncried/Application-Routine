import { rankMovements } from "@/domain/activities/movementSuggestion";

import { familyPositionOf, groupFamilies, type MovementCatalogueEntry } from "./MovementCatalogueService";

/**
 * PRE-8 (stories B.5 et B.7) — vue du Catalogue des Mouvements : piles, recherche et filtres,
 * selon les arbitrages de Hermann du 27/10/2026 (Q1, Q2, Q4 ; Q3 définitif). Module pur.
 *
 * 1. **Statut d'abord.** Aucun statut choisi ou Actifs seul : Mouvements actifs ; Archivés seul :
 *    archivés ; les deux : les deux. Aucun autre filtre ne rend visible un archivé.
 * 2. **Recherche et autres filtres ensuite** (ET entre groupes, OU dans un groupe ; Catégories et
 *    Zones : au moins une valeur commune). Une famille dont AU MOINS UN membre autorisé correspond
 *    est affichée ; un Mouvement indépendant est filtré seul. Recette A/B du 27/10 (b7-5) : avec la
 *    Recherche seule, la pile garde TOUS ses membres autorisés ; dès qu'un autre filtre est choisi,
 *    elle n'affiche que les membres autorisés qui correspondent à ces filtres.
 * 3. **Ordre de la famille.** Les piles suivent l'ordre de la famille complète, archivés compris
 *    (`familyPositionOf`) ; le rang affiché est celui du service (`entry.level`, b8-3).
 *
 * Présentation : une famille d'au moins deux membres affichés forme une pile, rang le plus haut
 * en tête (arbitrage Q-B2) ; un seul membre affiché est une carte simple, qui garde sa pastille.
 */

export type MovementStatusFilter = "ACTIVE" | "ARCHIVED";
export type MovementPresenceFilter = "WITH" | "WITHOUT";

export type MovementCatalogueFilters = {
  /** Vide : Actifs seul (comportement par défaut, Q2). */
  readonly statuses: ReadonlySet<MovementStatusFilter>;
  /** Niveaux : avec niveaux (famille d'au moins deux membres) / sans niveau. */
  readonly levels: ReadonlySet<MovementPresenceFilter>;
  /** Utilisation : avec / sans Exercice lié. */
  readonly usage: ReadonlySet<MovementPresenceFilter>;
  readonly categoryIds: ReadonlySet<string>;
  readonly bodyZoneIds: ReadonlySet<string>;
};

export const EMPTY_MOVEMENT_FILTERS: MovementCatalogueFilters = {
  statuses: new Set(),
  levels: new Set(),
  usage: new Set(),
  categoryIds: new Set(),
  bodyZoneIds: new Set(),
};

/** Nombre de valeurs choisies, tous groupes confondus (« Filtres actifs »). */
export function countActiveFilters(filters: MovementCatalogueFilters): number {
  return (
    filters.statuses.size + filters.levels.size + filters.usage.size + filters.categoryIds.size + filters.bodyZoneIds.size
  );
}

export type MovementCatalogueItem =
  | {
      readonly kind: "PILE";
      /** Identifiant du groupe de Niveaux. */
      readonly key: string;
      /** Membres affichés, rang décroissant : le premier est la carte du dessus. */
      readonly members: readonly MovementCatalogueEntry[];
    }
  | { readonly kind: "SINGLE"; readonly key: string; readonly entry: MovementCatalogueEntry };

function isStatusAllowed(entry: MovementCatalogueEntry, statuses: ReadonlySet<MovementStatusFilter>): boolean {
  const effective = statuses.size === 0 ? new Set<MovementStatusFilter>(["ACTIVE"]) : statuses;
  return effective.has(entry.archived ? "ARCHIVED" : "ACTIVE");
}

function presence(set: ReadonlySet<MovementPresenceFilter>, present: boolean): boolean {
  return set.size === 0 || set.has(present ? "WITH" : "WITHOUT");
}

function intersects(selected: ReadonlySet<string>, values: readonly string[]): boolean {
  return selected.size === 0 || values.some((value) => selected.has(value));
}

/** Filtres autres que Statut, pour un membre (ET entre groupes, OU dans un groupe). */
export function matchesMovementFilters(entry: MovementCatalogueEntry, filters: MovementCatalogueFilters): boolean {
  return (
    presence(filters.levels, entry.level !== null) &&
    presence(filters.usage, entry.exerciseCount > 0) &&
    (filters.categoryIds.size === 0 || filters.categoryIds.has(entry.movement.categoryId)) &&
    intersects(filters.bodyZoneIds, entry.movement.bodyZoneIds)
  );
}

/** Un filtre autre que Statut est choisi (b7-5). */
function hasMemberFilters(filters: MovementCatalogueFilters): boolean {
  return countActiveFilters(filters) - filters.statuses.size > 0;
}

/**
 * Éléments affichés. Requête vide : ordre des familles du Catalogue (`groupFamilies`) ; sinon
 * ordre R02 (`rankMovements`, nom et alias) du meilleur membre correspondant de chaque famille.
 */
export function visibleMovementItems(
  entries: readonly MovementCatalogueEntry[],
  query: string,
  filters: MovementCatalogueFilters,
): readonly MovementCatalogueItem[] {
  const families = groupFamilies(entries)
    .map((family) => ({ ...family, members: family.members.filter((entry) => isStatusAllowed(entry, filters.statuses)) }))
    .filter((family) => family.members.length > 0);
  const matchesQuery = (() => {
    if (query.trim().length === 0) return null;
    const allowed = families.flatMap((family) => family.members);
    const order = new Map<string, number>();
    rankMovements(
      query,
      allowed.map((entry) => entry.movement),
    ).forEach((ranked, index) => order.set(ranked.id, index));
    return order;
  })();

  const kept: { readonly order: number; readonly item: MovementCatalogueItem }[] = [];
  families.forEach((family, familyIndex) => {
    const matching = family.members.filter(
      (entry) => matchesMovementFilters(entry, filters) && (matchesQuery === null || matchesQuery.has(entry.movement.id)),
    );
    if (matching.length === 0) return;
    const order =
      matchesQuery === null ? familyIndex : Math.min(...matching.map((entry) => matchesQuery.get(entry.movement.id)!));
    // b7-5 : Recherche seule, tous les membres autorisés ; autres filtres, seuls les correspondants.
    const members = hasMemberFilters(filters)
      ? family.members.filter((entry) => matchesMovementFilters(entry, filters))
      : family.members;
    const shown = [...members].sort(
      (left, right) => (familyPositionOf(right)?.rank ?? 0) - (familyPositionOf(left)?.rank ?? 0),
    );
    kept.push({
      order,
      item:
        shown.length >= 2
          ? { kind: "PILE", key: family.key, members: shown }
          : { kind: "SINGLE", key: shown[0]!.movement.id, entry: shown[0]! },
    });
  });
  return kept.sort((left, right) => left.order - right.order).map((entry) => entry.item);
}

/**
 * Recette A/B (B08, MFN-05, D-445) : ordre complet de la famille après un réordonnancement dans
 * une pile déployée. `familyAscending` : tous les membres, rang croissant, archivés compris ;
 * `shownDescending` : membres affichés dans leur nouvel ordre (rang décroissant, carte du dessus
 * en premier). Les membres masqués (archivés hors filtre de Statut) gardent leur place : seules
 * les places des membres affichés sont redistribuées. Identités inchangées, rangs dérivés.
 */
export function reorderedFamilyIds(
  familyAscending: readonly string[],
  shownDescending: readonly string[],
): readonly string[] {
  const shown = new Set(shownDescending);
  const incoming = [...shownDescending].reverse();
  let next = 0;
  return familyAscending.map((id) => (shown.has(id) ? incoming[next++]! : id));
}

/** Recette A/B (B08) : place `from` → `to` dans une liste (copie). */
export function movedTo<T>(list: readonly T[], from: number, to: number): readonly T[] {
  const next = [...list];
  const [moved] = next.splice(from, 1);
  if (moved === undefined) return list;
  next.splice(to, 0, moved);
  return next;
}
