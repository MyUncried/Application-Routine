import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, render } from "@testing-library/react-native";
import type { ComponentType } from "react";

import { createEmptyDraft, type SessionDraft } from "@/domain/sessions/SessionDraft";
import { SessionDraftContext, type SessionDraftContextValue } from "@/features/sessions/SessionDraftContext";

/**
 * Complément du 5 novembre 2026 (Hermann, §1–§2, CE-CREATION-01) — « Créer » du Catalogue des séances ouvre la modale de
 * création commune sur un nouveau brouillon (`/composition?create=1`) ; tant qu'aucun contenu n'est posé, revenir sur la
 * Composition ramène au Catalogue sans rien enregistrer ; un contenu posé fait de la Composition l'écran d'arrivée.
 */
const mockPush = jest.fn();
const mockDismissTo = jest.fn();
let mockParams: Record<string, string> = {};
let mockFocused = true;
const focusEffects: (() => void | (() => void))[] = [];

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({ push: mockPush, dismissTo: mockDismissTo }),
  useNavigation: () => ({ isFocused: () => mockFocused }),
  useFocusEffect: (effect: () => void | (() => void)) => {
    focusEffects.push(effect);
  },
}));
jest.mock("@/features/sessions/CompositionScreen", () => ({ CompositionScreen: () => null }));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const CompositionRoute = (require("../(creation)/composition") as { default: ComponentType }).default;

function renderRoute(draft: SessionDraft) {
  const value = { draft, updateDraft: jest.fn(), resetDraft: jest.fn(), hydrateFromSession: jest.fn() } as unknown as SessionDraftContextValue;
  const view = render(
    <SessionDraftContext.Provider value={value}>
      <CompositionRoute />
    </SessionDraftContext.Provider>,
  );
  return {
    rerender: (next: SessionDraft) =>
      view.rerender(
        <SessionDraftContext.Provider value={{ ...value, draft: next }}>
          <CompositionRoute />
        </SessionDraftContext.Provider>,
      ),
  };
}

/** Rejoue le dernier effet de focus enregistré (premier focus, puis retour sur l'écran). */
function focus() {
  const effect = focusEffects[focusEffects.length - 1]!;
  effect();
}

describe("Composition ouverte par « Créer » du Catalogue des séances (CE-CREATION-01)", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockPush.mockReset();
    mockDismissTo.mockReset();
    focusEffects.length = 0;
    mockFocused = true;
    mockParams = { create: "1" };
  });

  it("présente la modale de création une seule fois, à l'arrivée", () => {
    renderRoute(createEmptyDraft());
    focus();
    expect(mockPush).toHaveBeenCalledWith("/formats-window");
    expect(mockPush).toHaveBeenCalledTimes(1);
  });

  it("retour sans contenu (croix de la modale, du questionnaire ou de la fiche) : retour au Catalogue, rien d'enregistré", () => {
    renderRoute(createEmptyDraft());
    focus();
    focus();
    act(() => jest.runOnlyPendingTimers());
    expect(mockDismissTo).toHaveBeenCalledWith({ pathname: "/", params: { catalogueSegment: "sessions" } });
  });

  it("retour avec un contenu posé (Format enregistré, Mouvement choisi) : la Composition du nouveau brouillon reste l'écran d'arrivée", () => {
    const view = renderRoute(createEmptyDraft());
    focus();
    view.rerender({ ...createEmptyDraft(), exercises: [{ id: "ex-1" } as SessionDraft["exercises"][number]] });
    focus();
    act(() => jest.runOnlyPendingTimers());
    expect(mockDismissTo).not.toHaveBeenCalled();
  });

  it("depuis la Composition (sans « create ») : aucune modale présentée, aucun retour automatique", () => {
    mockParams = {};
    renderRoute(createEmptyDraft());
    focus();
    focus();
    act(() => jest.runOnlyPendingTimers());
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockDismissTo).not.toHaveBeenCalled();
  });

  it("l'écran a déjà perdu le focus (fiche de création ouverte juste après la modale) : aucun retour", () => {
    renderRoute(createEmptyDraft());
    focus();
    focus();
    mockFocused = false;
    act(() => jest.runOnlyPendingTimers());
    expect(mockDismissTo).not.toHaveBeenCalled();
  });
});
