import { describe, expect, it } from "@jest/globals";

import { catalogueCompositionParams, creationRouteOptions, isModalCompositionRoute } from "@/features/sessions/compositionRoutePresentation";

/**
 * D-602 (Hermann, 25/11/2026) : composition ouverte par une carte du catalogue des séances, présentée en modale iOS — plein écran
 * depuis la décision de Hermann du 27/11/2026 (« sans bord arrondi, sans l'écran visible derrière, et sans le geste de la
 * feuille »). [Feuille native `formSheet` — remplacée.]
 */
describe("D-602 — présentation de la Composition", () => {
  it("depuis une carte du catalogue : modale plein écran, geste de fermeture désactivé, aucune option de feuille", () => {
    const params = catalogueCompositionParams("s1");
    expect(params).toEqual({ sessionId: "s1", presentation: "modal" });
    expect(isModalCompositionRoute(params)).toBe(true);
    // Paramètres tels que reçus par le groupe `(creation)` (navigateur imbriqué).
    expect(creationRouteOptions({ screen: "composition", params })).toEqual({ presentation: "fullScreenModal", gestureEnabled: false });
  });

  it("autres ouvertures (Créer, planification) : inchangées", () => {
    expect(creationRouteOptions(undefined)).toEqual({ gestureEnabled: false });
    expect(creationRouteOptions({ screen: "composition", params: { sessionId: "s1" } })).toEqual({ gestureEnabled: false });
  });
});
