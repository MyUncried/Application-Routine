import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { render } from "@testing-library/react-native";
import type { ComponentType } from "react";

import { createEmptyDraft } from "@/domain/sessions/SessionDraft";
import { SessionDraftContext, type SessionDraftContextValue } from "@/features/sessions/SessionDraftContext";

/**
 * Route de la Composition — règle de Hermann du 06/11/2026 (registre ch07) : « Je veux qu’on suive l’ordre des écrans et des
 * modèles lorsqu’on les ouvre et qu’on les ferme en fonction des décisions qu’ils ont prises. Je ne veux pas qu’on ouvre un
 * écran pour rien en prévision d’un scénario où l’on souhaite qu’il apparaisse après une annulation ou une validation. »
 * [Composition ouverte par « Créer » (`create=1`), présentant la modale puis revenant au Catalogue sans contenu — remplacée :
 * la modale s'ouvre au-dessus du Catalogue, la Composition après une validation (`keepDraft=1`).]
 */
const mockPush = jest.fn();
let mockParams: Record<string, string> = {};

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({ push: mockPush }),
}));
jest.mock("@/features/sessions/CompositionScreen", () => ({ CompositionScreen: () => null }));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const CompositionRoute = (require("../(creation)/composition") as { default: ComponentType }).default;

const resetDraft = jest.fn();
const hydrateFromSession = jest.fn();

function renderRoute() {
  const value = { draft: createEmptyDraft(), updateDraft: jest.fn(), resetDraft, hydrateFromSession } as unknown as SessionDraftContextValue;
  return render(
    <SessionDraftContext.Provider value={value}>
      <CompositionRoute />
    </SessionDraftContext.Provider>,
  );
}

describe("Composition — ouverture selon les décisions (règle du 06/11/2026)", () => {
  beforeEach(() => {
    mockPush.mockReset();
    resetDraft.mockReset();
    hydrateFromSession.mockReset();
    mockParams = {};
  });

  it("ouverte après une validation de la modale de création (`keepDraft=1`) : reprend le brouillon rempli, n'ouvre aucune modale", () => {
    mockParams = { keepDraft: "1" };
    renderRoute();
    expect(resetDraft).not.toHaveBeenCalled();
    expect(hydrateFromSession).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("Séance du Catalogue (`sessionId`) : relue depuis la Séance enregistrée", () => {
    mockParams = { sessionId: "ses-1" };
    renderRoute();
    expect(hydrateFromSession).toHaveBeenCalledWith("ses-1");
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("sans paramètre : brouillon de création vierge ; aucune modale ouverte d'avance", () => {
    renderRoute();
    expect(resetDraft).toHaveBeenCalledTimes(1);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("fermée : le brouillon (au niveau de l'application) est remis à zéro pour la Composition suivante", () => {
    mockParams = { keepDraft: "1" };
    const view = renderRoute();
    view.unmount();
    expect(resetDraft).toHaveBeenCalledTimes(1);
  });
});
