import { FilterSheetRoute } from "@/features/activities/FilterSheetRoute";

/**
 * Route « Filtres » des Catalogues (Mouvements et Séances) — demande de Hermann du 04/11/2026 : « Afficher en mode modale
 * iOS (mode d'apparition identique à la fiche des mouvements du questionnaire par exemple) » : feuille native iOS
 * (`formSheet`, `app/_layout.tsx`), filtres passés par `requestFilterSheet`.
 */
export default function CatalogueFiltersRoute() {
  return <FilterSheetRoute />;
}
