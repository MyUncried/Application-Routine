import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen, within } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

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
    const onFreeExercise = jest.fn();
    render(
      <TestSafeAreaProvider>
        <FormatsWindow onClose={onClose} onSelect={onSelect} onFreeExercise={onFreeExercise} />
      </TestSafeAreaProvider>,
    );
    return { onClose, onSelect, onFreeExercise };
  }

  it("titre, croix et dix cartes dans l'ordre de Figma : Tabata, 30/30, EMOM, AMRAP, For time, Death by, Renforcement, Superset, Progression, À l'échec", () => {
    renderWindow();
    // Complément du 5 novembre 2026 (§1, §4) : titre « Créer un exercice ». D-606 (25/11/2026) : titre centré, aucun sous-titre.
    // [Section « Formats d’entraînement » — remplacée le 25/11/2026.]
    const title = screen.getByTestId("formats-window-title");
    expect(title).toHaveTextContent(strings.screens.sessionModels.creationTitle);
    expect(title).toHaveStyle({ textAlign: "center", left: 0, right: 0 });
    expect(screen.queryByTestId("formats-window-section")).toBeNull();
    expect(screen.queryByText(strings.screens.sessionModels.title)).toBeNull();
    expect(FORMAT_MODEL_ORDER).toEqual(["TABATA", "INTERVALS_30_30", "EMOM", "AMRAP", "FOR_TIME", "DEATH_BY", "STRENGTH", "SUPERSET", "PROGRESSION", "UNTIL_FAILURE"]);
    // D-606 : carte « Exercice libre » en première position de la grille, puis les dix formats.
    const cards = within(screen.getByTestId("formats-window-grid")).getAllByRole("button");
    expect(cards.map((card) => card.props.testID)).toEqual(["formats-window-free-exercise", ...FORMAT_MODEL_ORDER.map((key) => `format-model-${key}`)]);
    expect(screen.getByText("30/30")).toBeTruthy();
    expect(screen.queryByText(/Mobilité|Une séance|Un exercice/)).toBeNull();
  });

  it("D-606 : carte « Exercice libre » de la taille des autres, logo en cadre pointillé, « un mouvement, à régler »", () => {
    const { onFreeExercise, onSelect } = renderWindow();
    const free = screen.getByTestId("formats-window-free-exercise");
    expect(free.props.accessibilityLabel).toBe("Exercice libre, un mouvement, à régler");
    const freeWidth = (StyleSheet.flatten(free.props.style) as { width: number }).width;
    const tabataWidth = (StyleSheet.flatten(screen.getByTestId("format-model-TABATA").props.style) as { width: number }).width;
    expect(freeWidth).toBe(tabataWidth);
    expect(screen.getByTestId("formats-window-free-logo")).toHaveStyle({ borderStyle: "dashed", width: 34, height: 34 });
    fireEvent.press(free);
    expect(onFreeExercise).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("la croix ferme la fenêtre ; une carte transmet son modèle, une seule fois par toucher", () => {
    // Essai du 04/11/2026 : feuille native iOS (route `formats-window`) ; le voile est celui du système.
    const { onClose, onSelect } = renderWindow();
    fireEvent.press(screen.getByTestId("formats-window-close"));
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.press(screen.getByTestId("format-model-AMRAP"));
    fireEvent.press(screen.getByTestId("format-model-EMOM"));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("AMRAP");
  });
});
