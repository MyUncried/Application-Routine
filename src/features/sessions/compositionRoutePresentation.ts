/**
 * D-602 (Hermann, 25/11/2026 ; DSF Carte de séance § 4) : toucher une carte du catalogue des séances (hors Démarrer) ouvre la
 * composition de la séance (« Composition séance en modification ») présentée en modale iOS, geste de fermeture désactivé (la
 * Composition se ferme par ses propres boutons). Les autres ouvertures de la Composition (Créer, planification…) sont inchangées.
 *
 * Recette iPhone du 26/11/2026 (soir), décision de Hermann du 27/11/2026 (« Modale plein écran — Toujours une modale iOS qui monte
 * du bas, fermée par la croix, mais sur tout l'écran : sans bord arrondi, sans l'écran visible derrière, et sans le geste de la
 * feuille. ») : modale plein écran (`fullScreenModal`). Constat d'origine (cahier, d607-compo-hauteur) : dans la feuille, le
 * recadrage d'un circuit ou d'un cycle et le réordonnancement des exercices revenaient à leur position — cause probable, non
 * démontrée sur iPhone : le geste de glisser de la feuille native (actif même avec `gestureEnabled: false`) reprenait le toucher.
 * [Feuille native `formSheet` (`NATIVE_SHEET_OPTIONS`, sans poignée) — remplacée.]
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
    ? ({ presentation: "fullScreenModal", gestureEnabled: false } as const)
    : ({ gestureEnabled: false } as const);
}
