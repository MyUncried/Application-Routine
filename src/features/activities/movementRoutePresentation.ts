import { NATIVE_SHEET_OPTIONS } from "@/shared/ui/nativeSheet";

/**
 * Demande de Hermann du 04/11/2026 (« Afficher en mode modale iOS (mode d'apparition identique à la fiche des mouvements
 * du questionnaire par exemple) […] Catalogue des mouvements : Créer un mouvement ») : la route `/movement` ouverte en
 * création — ni Mouvement existant (`movementId`), ni niveau à ajouter (`variantOf`) — est une feuille native iOS.
 * Consultation, modification et ajout d'un niveau restent des écrans poussés (inchangés).
 */
export function isMovementCreationRoute(params: object | undefined): boolean {
  const values = (params ?? {}) as { movementId?: unknown; variantOf?: unknown };
  const present = (value: unknown) => typeof value === "string" && value.length > 0;
  return !present(values.movementId) && !present(values.variantOf);
}

/** Options de la route `/movement` (navigateur racine) : geste natif désactivé dans tous les cas, comme auparavant. */
export function movementRouteOptions(params: object | undefined) {
  return isMovementCreationRoute(params) ? NATIVE_SHEET_OPTIONS : ({ gestureEnabled: false } as const);
}
