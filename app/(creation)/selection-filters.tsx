import { FilterSheetRoute } from "@/features/activities/FilterSheetRoute";

/**
 * Route « Filtres » du Catalogue des mouvements ouvert depuis la Composition (`movement-selection`, lui-même en feuille
 * native) — même feuille native iOS que les Filtres du Catalogue (demande de Hermann du 04/11/2026, par cohérence :
 * même composant), empilée dans le parcours de création.
 */
export default function SelectionFiltersRoute() {
  return <FilterSheetRoute />;
}
