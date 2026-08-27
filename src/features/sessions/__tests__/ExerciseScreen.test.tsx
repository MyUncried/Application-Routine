import { fireEvent, render, screen } from "@testing-library/react-native";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { createExerciseDraft } from "@/domain/sessions/SessionDraft";
import { ExerciseScreen } from "@/features/sessions/ExerciseScreen";
import { SessionDraftContext } from "@/features/sessions/SessionDraftContext";
import type { SessionDraftContextValue } from "@/features/sessions/SessionDraftContext";
import { strings } from "@/shared/i18n";

jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));

const mockBack = jest.fn();
jest.mock("expo-router", () => {
  const actual = jest.requireActual("expo-router") as object;
  return {
    ...actual,
    useRouter: () => ({ back: mockBack, push: jest.fn() }),
  };
});

/**
 * `useCompositionExitGuard` mocké : ce test porte sur le contrat propre de
 * l'écran (états locaux, validations, isolement du brouillon), pas sur le
 * mécanisme réel de prévention de navigation — couvert avec un vrai
 * navigateur par `ExerciseNavigationGuard.integration.test.tsx`.
 */
const mockExitGuard = jest.fn();
jest.mock("@/features/sessions/useCompositionExitGuard", () => ({
  useCompositionExitGuard: (shouldBlock: boolean, onConfirmExit: () => void) =>
    mockExitGuard(shouldBlock, onConfirmExit),
}));

function defaultExitGuardResult() {
  return { isPendingExit: false, cancelExit: jest.fn(), confirmExit: jest.fn() };
}

function renderScreen(draftExercise: ReturnType<typeof createExerciseDraft> | null = null) {
  const updateDraft = jest.fn();
  const contextValue: SessionDraftContextValue = {
    draft: {
      name: "Séance simple",
      color: "#3B82F6",
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      exercise: draftExercise,
    },
    updateDraft,
    resetDraft: jest.fn(),
  };

  render(
    <SessionDraftContext.Provider value={contextValue}>
      <ExerciseScreen />
    </SessionDraftContext.Provider>,
  );

  return { updateDraft };
}

const t = strings.screens.exercise;

beforeEach(() => {
  mockExitGuard.mockReset();
  mockExitGuard.mockReturnValue(defaultExitGuardResult());
  mockBack.mockReset();
});

describe("ExerciseScreen — mode ajout (draft.exercise === null)", () => {
  it("shows the 'Ajouter une activité' title", () => {
    renderScreen(null);
    expect(screen.getByText(t.titleAdd)).toBeTruthy();
  });

  it("starts on Étape 1 with the Valider button disabled (empty name)", () => {
    renderScreen(null);
    expect(screen.getByLabelText(t.name)).toBeTruthy();
    expect(screen.getByLabelText(t.validateAction).props.accessibilityState).toMatchObject({
      disabled: true,
    });
  });

  it("enables Valider once Nom and the default Durée are both valid", () => {
    renderScreen(null);
    fireEvent.changeText(screen.getByLabelText(t.name), "Pompes");
    expect(screen.getByLabelText(t.validateAction).props.accessibilityState).toMatchObject({
      disabled: false,
    });
  });

  it("advances to Étape 2 on Valider, without calling the shared updateDraft", () => {
    const { updateDraft } = renderScreen(null);
    fireEvent.changeText(screen.getByLabelText(t.name), "Pompes");
    fireEvent.press(screen.getByLabelText(t.validateAction));

    expect(screen.getByLabelText(t.instruction.label)).toBeTruthy();
    expect(screen.getByLabelText(t.bodyZones.accessibilityLabel)).toBeTruthy();
    expect(updateDraft).not.toHaveBeenCalled();
  });
});

describe("ExerciseScreen — action Retour visible (KODJO-CMD-0002, revue PR #9 — 5044116021)", () => {
  it("expose une action Retour visible et accessible", () => {
    renderScreen(null);
    expect(screen.getByLabelText(t.backAccessibilityLabel)).toBeTruthy();
  });

  it("appuyer sur Retour demande une navigation arrière normale (router.back()), sans traitement spécial", () => {
    renderScreen(null);
    fireEvent.press(screen.getByLabelText(t.backAccessibilityLabel));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});

describe("ExerciseScreen — mode Répétitions", () => {
  it("switching to Répétitions clears durationSeconds and requires a valid repetitionCount for Valider", () => {
    renderScreen(null);
    fireEvent.changeText(screen.getByLabelText(t.name), "Fentes");
    fireEvent.press(screen.getByLabelText(t.executionMode.repetitions));

    expect(screen.getByLabelText(t.repetitionCount.label)).toBeTruthy();
    expect(screen.queryByLabelText(t.duration.accessibilityLabel)).toBeNull();
    // Default repetition count (1) is already valid: Valider stays enabled.
    expect(screen.getByLabelText(t.validateAction).props.accessibilityState).toMatchObject({
      disabled: false,
    });
  });

  it("switching back to Durée restores a valid durationSeconds and clears repetitionCount", () => {
    renderScreen(null);
    fireEvent.changeText(screen.getByLabelText(t.name), "Fentes");
    fireEvent.press(screen.getByLabelText(t.executionMode.repetitions));
    fireEvent.press(screen.getByLabelText(t.executionMode.duration));

    expect(screen.getByLabelText(t.duration.accessibilityLabel)).toBeTruthy();
    expect(screen.queryByLabelText(t.repetitionCount.label)).toBeNull();
    expect(screen.getByLabelText(t.validateAction).props.accessibilityState).toMatchObject({
      disabled: false,
    });
  });
});

describe("ExerciseScreen — mode modification (draft.exercise !== null)", () => {
  it("shows the 'Modifier une activité' title and prefills the name from the existing exercise", () => {
    renderScreen({ ...createExerciseDraft(), name: "Gainage", durationSeconds: 45 });

    expect(screen.getByText(t.titleEdit)).toBeTruthy();
    expect(screen.getByLabelText(t.name).props.value).toBe("Gainage");
  });

  it("Terminer calls updateDraft exactly once with the edited local copy, and calls router.back()", () => {
    const { updateDraft } = renderScreen({
      ...createExerciseDraft(),
      name: "Gainage",
      durationSeconds: 45,
    });

    fireEvent.press(screen.getByLabelText(t.validateAction)); // -> Étape 2
    fireEvent.press(screen.getByLabelText(t.finishAction));

    expect(updateDraft).toHaveBeenCalledTimes(1);
    expect(updateDraft).toHaveBeenCalledWith({
      exercise: expect.objectContaining({ name: "Gainage", durationSeconds: 45 }),
    });
  });

  it("a second Terminer press before any intermediate render is a no-op (finishingRef synchronous lock)", () => {
    const { updateDraft } = renderScreen({
      ...createExerciseDraft(),
      name: "Gainage",
      durationSeconds: 45,
    });

    fireEvent.press(screen.getByLabelText(t.validateAction));
    const finishButton = screen.getByLabelText(t.finishAction);
    fireEvent.press(finishButton);
    fireEvent.press(finishButton);

    expect(updateDraft).toHaveBeenCalledTimes(1);
  });
});

describe("ExerciseScreen — modale d'abandon (D-094)", () => {
  it("renders ExerciseExitConfirmModal exactly when isPendingExit is true, wired to cancelExit/confirmExit", () => {
    const cancelExit = jest.fn();
    const confirmExit = jest.fn();
    mockExitGuard.mockReturnValue({ isPendingExit: true, cancelExit, confirmExit });

    renderScreen(null);

    expect(screen.getByText("Abandonner les modifications ?")).toBeTruthy();

    fireEvent.press(screen.getByLabelText(t.exitConfirmModal.continueEditing));
    expect(cancelExit).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByLabelText(t.exitConfirmModal.abandon));
    expect(confirmExit).toHaveBeenCalledTimes(1);
  });

  it("never renders the modal while isPendingExit is false", () => {
    renderScreen(null);
    expect(screen.queryByText("Abandonner les modifications ?")).toBeNull();
  });
});
