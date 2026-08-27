import { fireEvent, render, screen } from "@testing-library/react-native";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Keyboard, StyleSheet } from "react-native";

import { DEFAULT_SESSION_COLOR, SESSION_COLORS } from "@/domain/sessions/Session";
import { NAME_MAX_LENGTH } from "@/domain/sessions/validation";
import { createExerciseDraft } from "@/domain/sessions/SessionDraft";
import { CompositionScreen } from "@/features/sessions/CompositionScreen";
import { SessionDraftContext } from "@/features/sessions/SessionDraftContext";
import type { SessionDraftContextValue } from "@/features/sessions/SessionDraftContext";
import { SessionDraftProvider } from "@/features/sessions/SessionDraftProvider";
import { strings } from "@/shared/i18n";

jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));

/** `useRouter` mocké (T01-S08) — `+ Ajouter une activité`/la ligne Exercice naviguent désormais vers `/exercise`. */
const mockPush = jest.fn();
jest.mock("expo-router", () => {
  const actual = jest.requireActual("expo-router") as object;
  return {
    ...actual,
    useRouter: () => ({ push: mockPush }),
  };
});

/**
 * `useCompositionExitGuard` mocké : cet écran ne re-teste pas le mécanisme
 * de prévention de navigation lui-même (contrat propre testé par
 * `useCompositionExitGuard.test.ts`, mécanisme réel testé avec un vrai
 * navigateur par `CompositionNavigationGuard.integration.test.tsx`) — ces
 * tests portent sur les états et interactions propres à l'écran.
 */
const mockExitGuard = jest.fn();
jest.mock("@/features/sessions/useCompositionExitGuard", () => ({
  useCompositionExitGuard: (shouldBlock: boolean, onConfirmExit: () => void) =>
    mockExitGuard(shouldBlock, onConfirmExit),
}));

function defaultExitGuardResult() {
  return { isPendingExit: false, cancelExit: jest.fn(), confirmExit: jest.fn() };
}

function renderScreen() {
  return render(
    <SessionDraftProvider>
      <CompositionScreen />
    </SessionDraftProvider>,
  );
}

/** Contourne `SessionDraftProvider` pour préremplir `draft.exercise` — celui-ci n'expose aucun moyen interactif de le faire depuis Composition seule. */
function renderScreenWithDraft(exercise: ReturnType<typeof createExerciseDraft> | null) {
  const contextValue: SessionDraftContextValue = {
    draft: {
      name: "Séance simple",
      color: DEFAULT_SESSION_COLOR,
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      exercise,
    },
    updateDraft: jest.fn(),
    resetDraft: jest.fn(),
  };
  return render(
    <SessionDraftContext.Provider value={contextValue}>
      <CompositionScreen />
    </SessionDraftContext.Provider>,
  );
}

const composition = strings.screens.composition;

beforeEach(() => {
  mockExitGuard.mockReset();
  mockExitGuard.mockReturnValue(defaultExitGuardResult());
  mockPush.mockReset();
});

describe("CompositionScreen — état initial", () => {
  it("renders the name field, the countdown/final phase rows, the locked Tour, and the disabled actions", () => {
    renderScreen();

    expect(screen.getByLabelText(composition.name)).toBeTruthy();
    expect(screen.getByLabelText(composition.countdown.label)).toBeTruthy();
    expect(screen.getByLabelText(composition.finalPhase.label)).toBeTruthy();

    const tour = screen.getByLabelText(composition.tour.label);
    expect(tour.props.accessibilityState).toMatchObject({ disabled: true });
    expect(screen.getByText("×1")).toBeTruthy();

    const continueAction = screen.getByLabelText(composition.continueAction);
    expect(continueAction.props.accessibilityState).toMatchObject({ disabled: true });
  });

  it("enables '+ Ajouter une activité' while no Exercise exists yet, and navigates to /exercise on press (T01-S08)", () => {
    renderScreen();

    const addActivity = screen.getByLabelText(composition.addActivity);
    expect(addActivity.props.accessibilityState).toMatchObject({ disabled: false });

    fireEvent.press(addActivity);
    expect(mockPush).toHaveBeenCalledWith("/exercise");
  });

  it("shows the exact local empty summary '0 activité · 0 min' (V2), never formatActivityCount(0)'s plural", () => {
    renderScreen();

    expect(screen.getByText("0 activité · 0 min")).toBeTruthy();
    expect(screen.queryByText("0 activités · 0 min")).toBeNull();
  });

  it("shows the canonical default countdown (10 s) and final phase (5 s) row values", () => {
    renderScreen();

    expect(screen.getByText("00 min 10 s")).toBeTruthy();
    expect(screen.getByText("00 min 05 s")).toBeTruthy();
  });
});

describe("CompositionScreen — champ Nom", () => {
  it("carries exactly NAME_MAX_LENGTH as the maxLength prop, not a hardcoded literal", () => {
    renderScreen();
    expect(screen.getByLabelText(composition.name).props.maxLength).toBe(NAME_MAX_LENGTH);
    expect(NAME_MAX_LENGTH).toBe(80);
  });

  it("transmits an accepted input to the draft unmodified, without premature trimming", () => {
    renderScreen();

    fireEvent.changeText(screen.getByLabelText(composition.name), "  Séance du soir  ");

    expect(screen.getByLabelText(composition.name).props.value).toBe("  Séance du soir  ");
  });

  it("makes the draft dirty as soon as the name is non-empty, passed through to useCompositionExitGuard", () => {
    renderScreen();
    expect(mockExitGuard).toHaveBeenLastCalledWith(false, expect.any(Function));

    fireEvent.changeText(screen.getByLabelText(composition.name), "Séance simple");

    expect(mockExitGuard).toHaveBeenLastCalledWith(true, expect.any(Function));
  });
});

describe("CompositionScreen — sélecteurs et exclusivité", () => {
  it("opens the countdown wheel picker on row press, and hides it again on a second press of the same row", () => {
    renderScreen();

    fireEvent.press(screen.getByLabelText(composition.countdown.label));
    expect(screen.getByTestId("duration-wheel-picker")).toBeTruthy();

    fireEvent.press(screen.getByLabelText(composition.countdown.label));
    expect(screen.queryByTestId("duration-wheel-picker")).toBeNull();
  });

  it("opening the final phase picker closes an already-open countdown picker (single overlay at a time)", () => {
    renderScreen();

    fireEvent.press(screen.getByLabelText(composition.countdown.label));
    expect(screen.getByTestId("duration-wheel-minutes")).toBeTruthy();

    fireEvent.press(screen.getByLabelText(composition.finalPhase.label));
    // Still exactly one picker mounted, now driven by the final phase value (05 s → seconds index 5).
    expect(screen.getByTestId("duration-wheel-seconds").props.accessibilityValue).toEqual({
      min: 0,
      max: 59,
      now: 5,
    });
  });

  it("opening the color palette closes an already-open duration picker", () => {
    renderScreen();

    fireEvent.press(screen.getByLabelText(composition.countdown.label));
    expect(screen.getByTestId("duration-wheel-picker")).toBeTruthy();

    fireEvent.press(screen.getByLabelText(composition.colorPicker.label));
    expect(screen.queryByTestId("duration-wheel-picker")).toBeNull();
    expect(screen.getByLabelText(composition.colorPicker.paletteAccessibilityLabel)).toBeTruthy();
  });

  it("opening a duration picker closes an already-open color palette (reverse direction, same exclusivity)", () => {
    renderScreen();

    fireEvent.press(screen.getByLabelText(composition.colorPicker.label));
    expect(screen.getByLabelText(composition.colorPicker.paletteAccessibilityLabel)).toBeTruthy();

    fireEvent.press(screen.getByLabelText(composition.finalPhase.label));
    expect(screen.queryByLabelText(composition.colorPicker.paletteAccessibilityLabel)).toBeNull();
    expect(screen.getByTestId("duration-wheel-picker")).toBeTruthy();
  });

  it("dismisses the keyboard when opening a duration picker or the color palette (Name field may have had focus)", () => {
    const dismissSpy = jest.spyOn(Keyboard, "dismiss").mockImplementation(() => {});
    try {
      renderScreen();
      expect(dismissSpy).not.toHaveBeenCalled();

      fireEvent.press(screen.getByLabelText(composition.countdown.label));
      expect(dismissSpy).toHaveBeenCalledTimes(1);

      fireEvent.press(screen.getByLabelText(composition.colorPicker.label));
      expect(dismissSpy).toHaveBeenCalledTimes(2);
    } finally {
      dismissSpy.mockRestore();
    }
  });

  it("scrolling the countdown wheel updates the row's displayed value immediately (draft sync), without touching the empty summary", () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText(composition.countdown.label));

    fireEvent.scroll(screen.getByTestId("duration-wheel-minutes"), {
      // Minutes index → 1; seconds unchanged (default countdown is 10 s,
      // so the seconds column initializes at index 10, not 0).
      nativeEvent: { contentOffset: { y: 40 } },
    });

    expect(screen.getByText("01 min 10 s")).toBeTruthy();
    // The exercise is still null in T01-S07: the summary stays the exact
    // local empty label regardless of countdown/final-phase changes (§9.1).
    expect(screen.getByText("0 activité · 0 min")).toBeTruthy();
  });

  it("selecting a color actually applies it to the draft (compact swatch background) and closes the palette", () => {
    renderScreen();

    // Sanity check: the compact swatch starts on the canonical default —
    // proves the assertion below is a real change, not a no-op match.
    const compactSwatchBefore = screen.getByLabelText(composition.colorPicker.label);
    expect(StyleSheet.flatten(compactSwatchBefore.props.style).backgroundColor).toBe(
      DEFAULT_SESSION_COLOR,
    );

    fireEvent.press(compactSwatchBefore);
    const chosenColor = SESSION_COLORS.find((color) => color !== DEFAULT_SESSION_COLOR);
    if (!chosenColor) {
      throw new Error("Expected at least one non-default canonical color for this test.");
    }
    fireEvent.press(
      screen.getByLabelText(`${composition.colorPicker.swatchAccessibilityLabel} ${chosenColor}`),
    );

    // Application réelle de la couleur : le contrôle compact reflète
    // désormais la couleur choisie (preuve directe, pas seulement l'appel
    // d'un callback isolé).
    const compactSwatchAfter = screen.getByLabelText(composition.colorPicker.label);
    expect(StyleSheet.flatten(compactSwatchAfter.props.style).backgroundColor).toBe(chosenColor);
    // Fermeture automatique de la palette après sélection.
    expect(screen.queryByLabelText(composition.colorPicker.paletteAccessibilityLabel)).toBeNull();
  });
});

describe("CompositionScreen — ligne Exercice (T01-S08)", () => {
  it("hides '+ Ajouter une activité' and shows the Exercise row once draft.exercise is set", () => {
    renderScreenWithDraft({ ...createExerciseDraft(), name: "Gainage", durationSeconds: 45 });

    expect(screen.queryByLabelText(composition.addActivity)).toBeNull();
    expect(screen.getByLabelText(composition.exerciseRow.editAccessibilityLabel)).toBeTruthy();
    expect(screen.getByText("Gainage")).toBeTruthy();
  });

  it("shows the detailed configuration summary (name + summary, never the Consigne or the Zones corporelles) — CHANGES_REQUESTED", () => {
    renderScreenWithDraft({
      ...createExerciseDraft(),
      name: "Gainage",
      durationSeconds: 90,
      seriesCount: 3,
      pauseSeconds: 15,
      instruction: "Ne pas creuser le dos",
    });

    expect(screen.getByText("Gainage")).toBeTruthy();
    expect(screen.getByText("3 séries de 1 min 30 s avec 15 s de pause par série")).toBeTruthy();
    expect(screen.queryByText("Ne pas creuser le dos")).toBeNull();
  });

  it("pressing the Exercise row navigates to /exercise (reopen for editing)", () => {
    renderScreenWithDraft({ ...createExerciseDraft(), name: "Gainage", durationSeconds: 45 });

    fireEvent.press(screen.getByLabelText(composition.exerciseRow.editAccessibilityLabel));
    expect(mockPush).toHaveBeenCalledWith("/exercise");
  });

  it("never shows the Exercise row while draft.exercise is null", () => {
    renderScreenWithDraft(null);
    expect(screen.queryByLabelText(composition.exerciseRow.editAccessibilityLabel)).toBeNull();
  });
});

describe("CompositionScreen — modale d'abandon", () => {
  it("renders AbandonCreationModal exactly when isPendingExit is true, wired to cancelExit/confirmExit", () => {
    const cancelExit = jest.fn();
    const confirmExit = jest.fn();
    mockExitGuard.mockReturnValue({ isPendingExit: true, cancelExit, confirmExit });

    renderScreen();

    expect(screen.getByText("Abandonner la création ?")).toBeTruthy();

    fireEvent.press(screen.getByLabelText(composition.abandonModal.continueCreating));
    expect(cancelExit).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByLabelText(composition.abandonModal.abandon));
    expect(confirmExit).toHaveBeenCalledTimes(1);
  });

  it("never renders the modal while isPendingExit is false", () => {
    renderScreen();
    expect(screen.queryByText("Abandonner la création ?")).toBeNull();
  });
});
