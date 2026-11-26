import { describe, expect, it } from "@jest/globals";

import { catalogueCompositionParams, creationRouteOptions, isModalCompositionRoute } from "@/features/sessions/compositionRoutePresentation";

/** D-602 (Hermann, 25/11/2026) : composition ouverte par une carte du catalogue des séances, présentée en modale iOS. */
describe("D-602 — présentation de la Composition", () => {
  it("depuis une carte du catalogue : feuille native iOS, geste de fermeture désactivé", () => {
    const params = catalogueCompositionParams("s1");
    expect(params).toEqual({ sessionId: "s1", presentation: "modal" });
    expect(isModalCompositionRoute(params)).toBe(true);
    // Paramètres tels que reçus par le groupe `(creation)` (navigateur imbriqué).
    expect(creationRouteOptions({ screen: "composition", params })).toMatchObject({ presentation: "formSheet", gestureEnabled: false, sheetGrabberVisible: false });
  });

  it("autres ouvertures (Créer, planification) : inchangées", () => {
    expect(creationRouteOptions(undefined)).toEqual({ gestureEnabled: false });
    expect(creationRouteOptions({ screen: "composition", params: { sessionId: "s1" } })).toEqual({ gestureEnabled: false });
  });
});
