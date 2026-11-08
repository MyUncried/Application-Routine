import { normalizeSearchText } from "@/domain/activities/movementSuggestion";

import { countActiveSessionFilters, matchesSessionFilters, type SessionCatalogueFilters } from "./sessionCatalogueFilters";
import type { SessionCatalogueProjection } from "./sessionCatalogueProjection";
import { matchesView, type SessionCatalogueView } from "./sessionCatalogueView";

/**
 * PRE-9 CAT.1 (spécification « Zones de contexte des Catalogues » du 30/10/2026 §2, §4, §5 ;
 * CE-CAT-CTX-01) — liste et nombres de la zone de contexte du Catalogue des Séances. Module pur :
 * la liste affichée, les nombres « Un exercice N | Plusieurs N » et « N résultats » sortent de la
 * même dérivation.
 *
 * - Recherche : nom de la Séance, sans casse ni diacritiques (normalisation R02 déjà utilisée par
 *   les Mouvements), sous-chaîne. Elle se cumule aux filtres et à la vue.
 * - Chaque `N` de vue = Séances de cette vue dans la collection courante, APRÈS recherche et filtres
 *   du panneau (avant le choix de la vue, sinon la vue non choisie vaudrait toujours 0).
 * - « N résultats » = Séances réellement affichées (recherche + filtres + vue).
 */

/**
 * Recette iPhone CAT.1 du 30/10/2026 (Hermann : « Séance : recherche sur le nom de la séance et sur
 * le nom des exercices de la séance ») : sous-chaîne, sans casse ni accents, sur le nom de la Séance
 * ou celui de l'un de ses Exercices (lignes de l'arbre de la carte, toute profondeur).
 */
export function matchesSessionQuery(projection: SessionCatalogueProjection, query: string): boolean {
  const needle = normalizeSearchText(query);
  if (needle.length === 0) return true;
  if (normalizeSearchText(projection.name).includes(needle)) return true;
  return projection.tree.some((line) => line.kind === "EXERCISE" && normalizeSearchText(line.name).includes(needle));
}

export type SessionCatalogueContext = {
  readonly visible: readonly SessionCatalogueProjection[];
  readonly singleCount: number;
  readonly multipleCount: number;
};

export function sessionCatalogueContext(
  sessions: readonly SessionCatalogueProjection[],
  criteria: { readonly query: string; readonly filters: SessionCatalogueFilters; readonly view: SessionCatalogueView | null },
): SessionCatalogueContext {
  const base = sessions.filter(
    (session) => matchesSessionFilters(session, criteria.filters) && matchesSessionQuery(session, criteria.query),
  );
  return {
    visible: base.filter((session) => matchesView(session, criteria.view)),
    singleCount: base.filter((session) => matchesView(session, "SINGLE")).length,
    multipleCount: base.filter((session) => matchesView(session, "MULTIPLE")).length,
  };
}

/** État filtré ou archivé (§5) : au moins un critère du panneau Filtre, Statut Archivées compris. */
export function isSessionCatalogueFiltered(filters: SessionCatalogueFilters): boolean {
  return countActiveSessionFilters(filters) > 0;
}
