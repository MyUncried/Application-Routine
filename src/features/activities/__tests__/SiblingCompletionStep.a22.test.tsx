import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { durationEntryValue, SiblingCompletionStep } from "@/features/activities/SiblingCompletionStep";
import { strings } from "@/shared/i18n";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * PRE-7 story A2.2 (MFN-08) — étape de complétion des durées manquantes des frères, hors écran.
 * Cas repris de `IdentityDecisionSheet.a22.test.tsx`, supprimé par R-4 avec la feuille d'identité
 * (remplacée par `MovementSaveDialog`) ; l'étape elle-même est inchangée. Le parcours complet est
 * couvert sur SQLite réelle (`ExerciseScreen.mfn.a22.integration.test.tsx`).
 */
const completion = strings.screens.activities.editor.siblingCompletion;

describe("SiblingCompletionStep — PRE-7 A2.2", () => {
  it("structure retirée : durée de série à compléter ; saisie au clavier « MM:SS » ; Terminer transmet la durée", () => {
    const onFinish = jest.fn();
    render(
      <TestSafeAreaProvider>
        <SiblingCompletionStep
          gaps={[{ definitionId: "def-b", missingPhaseIds: [], missingSeriesDuration: true }]}
          phases={[]}
          siblingLabels={{ "def-b": "3 séries" }}
          onFinish={onFinish}
          onCancel={jest.fn()}
        />
      </TestSafeAreaProvider>,
    );
    expect(screen.getByText("3 séries")).toBeTruthy();
    expect(screen.getByText(strings.executionParameters.sheet.durationTarget)).toBeTruthy();
    const field = screen.getByTestId("sibling-completion-def-b-series");
    expect(field.props.accessibilityLabel).toBe(
      completion.durationAccessibilityLabel.replace("{label}", strings.executionParameters.sheet.durationTarget),
    );
    fireEvent.changeText(field, "1");
    fireEvent.changeText(screen.getByTestId("sibling-completion-def-b-series"), "00:011");
    expect(screen.getByTestId("sibling-completion-def-b-series").props.value).toBe("00:11");
    fireEvent.press(screen.getByTestId("sibling-completion-finish"));
    expect(onFinish).toHaveBeenCalledWith([{ definitionId: "def-b", seriesDurationSeconds: 11 }]);
  });
});

describe("Revue A2.2 — saisie des durées", () => {
  it("durationEntryValue : secondes reportées, jamais ramenées dans les bornes (00:00 et > 58:55 restent à renseigner)", () => {
    expect(durationEntryValue("")).toBeNull();
    expect(durationEntryValue("0")).toBeNull();
    expect(durationEntryValue("5")).toBe(5);
    expect(durationEntryValue("175")).toBe(135);
    expect(durationEntryValue("5855")).toBe(3535);
    expect(durationEntryValue("5856")).toBeNull();
    expect(durationEntryValue("9999")).toBeNull();
  });
});
