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

/**
 * Options de la route `/movement` (navigateur racine). Hermann, 04/11/2026 : « catalogue des mouvements, appuyer sur la photo ouvre la fiche des mouvements en modification, elle doit être ouverte sous forme de modale iOS » : la fiche en modification est aussi une feuille native ;
 * la consultation et l'ajout d'un niveau, ouverts depuis cette fiche par la même route, le sont également (un écran
 * poussé depuis une feuille passerait derrière elle). Geste natif désactivé dans tous les cas.
 * [Création seule en feuille, consultation, modification et ajout de niveau en écrans poussés — remplacé.]
 */
export function movementRouteOptions(_params: object | undefined) {
  return NATIVE_SHEET_OPTIONS;
}
