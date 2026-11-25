import { NATIVE_SHEET_CONTENT } from "@/shared/ui/nativeSheet";

/**
 * D-602 (Hermann, 25/11/2026 ; DSF Carte de séance § 4) : toucher une carte du catalogue des séances (hors Démarrer) ouvre la
 * composition de la séance (« Composition séance en modification ») présentée en modale iOS — feuille native, comme les
 * autres modales iOS du projet (`NATIVE_SHEET_OPTIONS`), geste de fermeture désactivé (la Composition se ferme par ses propres
 * boutons). Les autres ouvertures de la Composition (Créer, planification…) sont inchangées.
 */
export const COMPOSITION_PRESENTATION_PARAM = "presentation";
export const COMPOSITION_MODAL_PRESENTATION = "modal";

/** Paramètres de route de la Composition ouverte depuis une carte du catalogue. */
export function catalogueCompositionParams(sessionId: string) {
  return { sessionId, [COMPOSITION_PRESENTATION_PARAM]: COMPOSITION_MODAL_PRESENTATION } as const;
}

/** Vrai quand la Composition est demandée en modale (paramètres directs ou du navigateur imbriqué `(creation)`). */
export function isModalCompositionRoute(params: object | undefined): boolean {
  const values = (params ?? {}) as Record<string, unknown>;
  const nested = typeof values.params === "object" && values.params !== null ? (values.params as Record<string, unknown>) : {};
  return values[COMPOSITION_PRESENTATION_PARAM] === COMPOSITION_MODAL_PRESENTATION || nested[COMPOSITION_PRESENTATION_PARAM] === COMPOSITION_MODAL_PRESENTATION;
}

/** Options du groupe `(creation)` dans la pile racine. */
export function creationRouteOptions(params: object | undefined) {
  return isModalCompositionRoute(params)
    ? ({ presentation: "formSheet", sheetGrabberVisible: false, contentStyle: NATIVE_SHEET_CONTENT, gestureEnabled: false } as const)
    : ({ gestureEnabled: false } as const);
}
