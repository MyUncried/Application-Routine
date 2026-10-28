import type { SessionCatalogueProjection } from "./sessionCatalogueProjection";
import type { SessionFormatKey } from "./sessionFormats";

/**
 * PRE-8 (epic E, story E.6) — filtres du segment Séances. Module pur, prédicats propres aux Séances
 * (les règles de piles des Mouvements ne s'appliquent pas).
 *
 * Sémantique Q-E3, option B (Hermann, 28/10) : caractéristiques AGRÉGÉES de la Séance.
 * - Statut d'abord : il détermine les Séances admissibles ; aucun statut choisi = Actives (CE-T03-01
 *   révisé, Figma `4168:11149`, comme Q3 pour les Mouvements). Aucun autre filtre ne rend visible une
 *   Séance archivée.
 * - OU entre les valeurs d'une section ; ET entre les sections.
 * - Catégories et Zones corporelles : agrégées sur tous les Exercices de la Séance (via leurs
 *   Mouvements), éventuellement portées par des Exercices différents.
 * - Étiquette et Format : ceux de la Séance (aucun format persisté : toute Séance est Libre, Q-E5).
 * - La bascule Un exercice / Plusieurs se combine avec ces filtres et n'en fait pas partie :
 *   réinitialiser les filtres ne la touche pas.
 */

export type SessionStatusFilter = "ACTIVE" | "ARCHIVED";

export type SessionCatalogueFilters = {
  /** Vide : Actives seules. */
  readonly statuses: ReadonlySet<SessionStatusFilter>;
  readonly categoryIds: ReadonlySet<string>;
  readonly bodyZoneIds: ReadonlySet<string>;
  readonly labelIds: ReadonlySet<string>;
  readonly formats: ReadonlySet<SessionFormatKey>;
};

export const EMPTY_SESSION_FILTERS: SessionCatalogueFilters = {
  statuses: new Set(),
  categoryIds: new Set(),
  bodyZoneIds: new Set(),
  labelIds: new Set(),
  formats: new Set(),
};

export type SessionFilterSection = "STATUS" | "CATEGORIES" | "BODY_ZONES" | "LABELS" | "FORMAT";

/** Nombre de valeurs choisies, toutes sections confondues. */
export function countActiveSessionFilters(filters: SessionCatalogueFilters): number {
  return filters.statuses.size + filters.categoryIds.size + filters.bodyZoneIds.size + filters.labelIds.size + filters.formats.size;
}

/** Spécification §6 : sections ouvertes à l'ouverture — celles qui portent un filtre ; sans filtre, Statut seul. */
export function initiallyOpenSections(filters: SessionCatalogueFilters): ReadonlySet<SessionFilterSection> {
  const open = new Set<SessionFilterSection>();
  if (filters.statuses.size > 0) open.add("STATUS");
  if (filters.categoryIds.size > 0) open.add("CATEGORIES");
  if (filters.bodyZoneIds.size > 0) open.add("BODY_ZONES");
  if (filters.labelIds.size > 0) open.add("LABELS");
  if (filters.formats.size > 0) open.add("FORMAT");
  if (open.size === 0) open.add("STATUS");
  return open;
}

function isStatusAllowed(projection: SessionCatalogueProjection, statuses: ReadonlySet<SessionStatusFilter>): boolean {
  const effective = statuses.size === 0 ? new Set<SessionStatusFilter>(["ACTIVE"]) : statuses;
  return effective.has(projection.status);
}

const anyOf = (selected: ReadonlySet<string>, values: readonly string[]) =>
  selected.size === 0 || values.some((value) => selected.has(value));

export function matchesSessionFilters(projection: SessionCatalogueProjection, filters: SessionCatalogueFilters): boolean {
  return (
    isStatusAllowed(projection, filters.statuses) &&
    anyOf(filters.categoryIds, projection.categories.map((category) => category.id)) &&
    anyOf(filters.bodyZoneIds, projection.bodyZoneIds) &&
    anyOf(filters.labelIds, projection.labelId === null ? [] : [projection.labelId]) &&
    (filters.formats.size === 0 || filters.formats.has(projection.format))
  );
}
