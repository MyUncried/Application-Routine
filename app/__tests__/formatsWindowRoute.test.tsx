import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { render } from "@testing-library/react-native";
import type { ComponentType } from "react";

import { createEmptyDraft, type SessionDraft } from "@/domain/sessions/SessionDraft";
import { requestFormatsWindowClose, takeFormatsWindowCloseRequest, takeMovementsHandedToComposition } from "@/features/sessions/movementExercises";
import { SessionDraftContext, type SessionDraftContextValue } from "@/features/sessions/SessionDraftContext";

/**
 * Recette iPhone du 05/11/2026 (n-cat-creer, n-cat-libre) — modale « Créer un exercice » :
 * - Exercice libre ouvre la fiche de création par-dessus la modale (Annulée → retour à la modale) ;
 * - fiche validée : la modale se retire aussitôt, la Composition reprend le Mouvement ;
 * - croix, ouverte par « Créer » du Catalogue sur un brouillon vide : retour direct au Catalogue (Composition jamais vue).
 */
const mockPush = jest.fn();
const mockBack = jest.fn();
const mockDismissTo = jest.fn();
let mockRoutes: { name: string; params?: object }[] = [];
const focusEffects: (() => void)[] = [];
let windowProps: { onClose: () => void; onFreeExercise: () => void; onSelect: (model: string) => void } | null = null;

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, back: mockBack, dismissTo: mockDismissTo }),
  useNavigation: () => ({ getState: () => ({ routes: mockRoutes, index: mockRoutes.length - 1 }) }),
  useFocusEffect: (effect: () => void) => {
    focusEffects.push(effect);
  },
}));
jest.mock("@/features/sessions/FormatsWindow", () => ({
  FormatsWindow: (props: typeof windowProps) => {
    windowProps = props;
    return null;
  },
}));
jest.mock("@/features/activities/MovementScreen", () => ({ MOVEMENT_SESSION_CONTEXT: "session" }));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const FormatsWindowRoute = (require("../(creation)/formats-window") as { default: ComponentType }).default;

function renderRoute(draft: SessionDraft = createEmptyDraft()) {
  const value = { draft, updateDraft: jest.fn(), resetDraft: jest.fn() } as unknown as SessionDraftContextValue;
  render(
    <SessionDraftContext.Provider value={value}>
      <FormatsWindowRoute />
    </SessionDraftContext.Provider>,
  );
}

describe("modale « Créer un exercice » (recette du 05/11)", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockBack.mockReset();
    mockDismissTo.mockReset();
    focusEffects.length = 0;
    windowProps = null;
    takeMovementsHandedToComposition();
    takeFormatsWindowCloseRequest();
  });

  it("Exercice libre : la fiche s'ouvre par-dessus la modale, sans la refermer", () => {
    mockRoutes = [{ name: "composition" }, { name: "formats-window" }];
    renderRoute();
    windowProps!.onFreeExercise();
    expect(mockBack).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith({ pathname: "/movement", params: { context: "session" } });
  });

  // Recette du 05/11/2026 au soir (r-creer) : la fiche demande le retrait de la modale (coche, ou croix vers la Composition vide) ;
  // signal consommé une seule fois — un second passage au premier plan ne retire pas la Composition.
  it("fiche validée ou croix vers la Composition : au retour, la modale se retire une seule fois ; balayage de la fiche : la modale reste", () => {
    mockRoutes = [{ name: "composition" }, { name: "formats-window" }];
    renderRoute();
    focusEffects[focusEffects.length - 1]!();
    expect(mockBack).not.toHaveBeenCalled();
    requestFormatsWindowClose();
    focusEffects[focusEffects.length - 1]!();
    focusEffects[focusEffects.length - 1]!();
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("croix depuis « Créer » du Catalogue, brouillon vide : retour direct au Catalogue des séances", () => {
    mockRoutes = [{ name: "composition", params: { create: "1" } }, { name: "formats-window" }];
    renderRoute();
    windowProps!.onClose();
    expect(mockDismissTo).toHaveBeenCalledWith({ pathname: "/", params: { catalogueSegment: "sessions" } });
    expect(mockBack).not.toHaveBeenCalled();
  });

  it("croix depuis une Composition : retour à la Composition", () => {
    mockRoutes = [{ name: "composition", params: { sessionId: "s-1" } }, { name: "formats-window" }];
    renderRoute();
    windowProps!.onClose();
    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockDismissTo).not.toHaveBeenCalled();
  });
});
