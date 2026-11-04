import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react-native";

import { FORMAT_MODEL_ORDER, FormatsWindow } from "@/features/sessions/FormatsWindow";
import { strings } from "@/shared/i18n";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * PRE-9 C.2 (référence Formats du 02/11/2026 §7, CE-FMT-01, Figma `9977:19613`) — fenêtre « Formats
 * d'entraînement » : dix cartes dans une seule grille, aucune carte Exercice, Séance, Libre ni Gainage ·
 * Mobilité ; croix ou voile ferment sans rien ajouter ; une carte ouvre son questionnaire.
 */
describe("FormatsWindow", () => {
  function renderWindow() {
    const onClose = jest.fn();
    const onSelect = jest.fn();
    render(
      <TestSafeAreaProvider>
        <FormatsWindow visible onClose={onClose} onSelect={onSelect} />
      </TestSafeAreaProvider>,
    );
    return { onClose, onSelect };
  }

  it("titre, croix et dix cartes dans l'ordre de Figma : Tabata, 30/30, EMOM, AMRAP, For time, Death by, Renforcement, Superset, Progression, À l'échec", () => {
    renderWindow();
    expect(screen.getByText(strings.screens.sessionModels.title)).toBeTruthy();
    expect(FORMAT_MODEL_ORDER).toEqual(["TABATA", "INTERVALS_30_30", "EMOM", "AMRAP", "FOR_TIME", "DEATH_BY", "STRENGTH", "SUPERSET", "PROGRESSION", "UNTIL_FAILURE"]);
    const cards = within(screen.getByTestId("formats-window-grid")).getAllByRole("button");
    expect(cards.map((card) => card.props.testID)).toEqual(FORMAT_MODEL_ORDER.map((key) => `format-model-${key}`));
    expect(screen.getByText("30/30")).toBeTruthy();
    expect(screen.queryByText(/Mobilité|Libre|Une séance|Un exercice/)).toBeNull();
  });

  it("la croix et le voile ferment la fenêtre ; une carte transmet son modèle", async () => {
    const { onClose, onSelect } = renderWindow();
    fireEvent.press(screen.getByTestId("formats-window-close"));
    // Voile : masqué à VoiceOver par la fenêtre modale (la croix reste accessible).
    fireEvent.press(screen.getByTestId("formats-window-scrim", { includeHiddenElements: true }));
    expect(onClose).toHaveBeenCalledTimes(2);
    fireEvent.press(screen.getByTestId("format-model-AMRAP"));
    // Recette du 04/11/2026 : la fenêtre s'efface, le voile reste ; le modèle est transmis à la fin de l'effacement.
    await waitFor(() => expect(onSelect).toHaveBeenCalledWith("AMRAP"));
    // Un second toucher pendant l'effacement est ignoré.
    fireEvent.press(screen.getByTestId("format-model-EMOM"));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
