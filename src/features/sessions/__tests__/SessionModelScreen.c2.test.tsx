import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen, within } from "@testing-library/react-native";

import { SessionDraftContext, type SessionDraftContextValue } from "@/features/sessions/SessionDraftContext";
import { SessionModelScreen } from "@/features/sessions/SessionModelScreen";
import { createEmptyDraft } from "@/domain/sessions/SessionDraft";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

const mockPush = jest.fn();
const mockBack = jest.fn();
const push = mockPush;

jest.mock("expo-router", () => {
  const actual = jest.requireActual("expo-router") as object;
  return { ...actual, useRouter: () => ({ push: mockPush, back: mockBack }), useFocusEffect: () => undefined };
});

/** PRE-9 C.2 (CE-FMT-01, ARB-05, D-24, D-25) — « Créer » : choix du modèle et du format. */
describe("SessionModelScreen", () => {
  const updateDraft = jest.fn();
  const hydrateFromSession = jest.fn();

  beforeEach(() => {
    push.mockReset();
    updateDraft.mockReset();
    hydrateFromSession.mockReset();
  });

  function renderScreen() {
    const value = { draft: createEmptyDraft(), updateDraft, resetDraft: jest.fn(), hydrateFromSession } as unknown as SessionDraftContextValue;
    return render(
      <TestSafeAreaProvider>
        <SessionDraftContext.Provider value={value}>
          <SessionModelScreen />
        </SessionDraftContext.Provider>
      </TestSafeAreaProvider>,
    );
  }

  const keysOf = (group: number) =>
    within(screen.getByTestId(`session-model-group-${group}`))
      .getAllByRole("button")
      .map((card) => card.props.testID as string);

  it("trois groupes dans l'ordre de Figma ; Gainage · Mobilité retiré (D-25) ; brouillon vierge à l'ouverture", () => {
    renderScreen();
    expect(keysOf(0)).toEqual(["session-model-EXERCISE_CARD", "session-model-SESSION_CARD"]);
    expect(keysOf(1)).toEqual(["TABATA", "INTERVALS_30_30", "EMOM", "AMRAP", "FOR_TIME", "DEATH_BY"].map((key) => `session-model-${key}`));
    expect(keysOf(2)).toEqual(["STRENGTH", "SUPERSET", "PROGRESSION", "UNTIL_FAILURE"].map((key) => `session-model-${key}`));
    expect(screen.queryByText(/Mobilité/)).toBeNull();
    expect(screen.getByText("Tabata")).toBeTruthy();
    expect(screen.getByText("8 × 20/10")).toBeTruthy();
    expect(hydrateFromSession).toHaveBeenCalledWith(null);
  });

  it("Séance : Composition vide, origine enregistrée (FMT-02)", () => {
    renderScreen();
    fireEvent.press(screen.getByTestId("session-model-SESSION_CARD"));
    expect(updateDraft).toHaveBeenCalledWith({ origin: "SESSION_CARD" });
    expect(push).toHaveBeenCalledWith({ pathname: "/composition", params: { keepDraft: "1" } });
  });

  it("Exercice : choix d'un seul Mouvement du Catalogue, puis Composition (ARB-05, ARB-22a)", () => {
    renderScreen();
    fireEvent.press(screen.getByTestId("session-model-EXERCISE_CARD"));
    expect(push).toHaveBeenCalledWith({ pathname: "/movement-selection", params: { single: "1", then: "composition" } });
  });

  it("Format : choix des Mouvements, puis ses paramètres (C.3) ; un double appui ne crée rien de plus", () => {
    renderScreen();
    fireEvent.press(screen.getByTestId("session-model-TABATA"));
    fireEvent.press(screen.getByTestId("session-model-EMOM"));
    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith({ pathname: "/movement-selection", params: { then: "format-parameters", model: "TABATA" } });
  });
});
