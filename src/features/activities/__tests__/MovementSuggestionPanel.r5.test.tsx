import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";

import type { Movement } from "@/domain/activities/Movement";
import type { MovementChoice } from "@/features/activities/ActivityDefinitionService";
import { MovementSuggestionPanel } from "@/features/activities/MovementSuggestionPanel";
import { strings } from "@/shared/i18n";

/**
 * PRE-7 story R-5 (D-445 C01, C02, v7 §6 R04 ; `9882:19049`, `10175:20349`, `10140:20180`,
 * carte `10199:22268`) — panneau sous le nom : message d'unicité, cartes Résultat à deux actions
 * internes (aucune sélection radio, aucune action globale), étape de variante avec cadre de retour
 * et deux sens, appui signalé pour figer l'ordre. Comportement seulement : le rendu visuel relève de
 * la recette de Hermann.
 */

const t = strings.screens.activities.editor.movementSuggestion;

function choice(id: string, name: string, overrides: Partial<MovementChoice> = {}): MovementChoice {
  const movement: Movement = {
    id,
    name,
    description: "Pieds largeur d’épaules\nDescente contrôlée",
    media: [],
    categoryId: "cardio",
    bodyZoneIds: ["cuisses"],
    phases: [],
    nextPhaseId: 1,
    aliases: [],
    levelGroup: null,
  };
  return { movement, definitionCount: 1, level: null, ...overrides };
}

const squats = choice("squats", "Squats", { level: { rank: 2, total: 3 } });
const assisted = choice("assistes", "Squats assistés");

function renderPanel(overrides: Partial<Parameters<typeof MovementSuggestionPanel>[0]> = {}) {
  const props = {
    message: null,
    results: [squats, assisted],
    variantOf: null,
    onUse: jest.fn(),
    onCreateVariant: jest.fn(),
    onChooseVariant: jest.fn(),
    onBack: jest.fn(),
    onTouchingChange: jest.fn(),
    ...overrides,
  };
  render(<MovementSuggestionPanel {...props} />);
  return props;
}

describe("PRE-7 R-5 — MovementSuggestionPanel", () => {
  it("cartes Résultat : nom tel que saisi, « Niveau N » dérivé (absent sans groupe), description, deux actions ; aucun état sélectionné", () => {
    const props = renderPanel();
    expect(screen.getByTestId("movement-suggestion-result-squats-name").props.children).toBe("Squats");
    expect(screen.getByTestId("movement-suggestion-result-squats-level").props.children).toBe("Niveau 2");
    expect(screen.queryByTestId("movement-suggestion-result-assistes-level")).toBeNull();
    expect(screen.getByTestId("movement-suggestion-result-squats-description").props.children).toBe(
      "Pieds largeur d’épaules Descente contrôlée",
    );
    expect(screen.queryByTestId("movement-suggestion-message")).toBeNull();
    expect(screen.queryByTestId("movement-suggestion-back")).toBeNull();
    expect(screen.getByTestId("movement-suggestion-result-squats-variant").props.accessibilityState).toMatchObject({ expanded: false });

    fireEvent.press(screen.getByTestId("movement-suggestion-result-assistes-use"));
    expect(props.onUse).toHaveBeenCalledWith(assisted);
    fireEvent.press(screen.getByTestId("movement-suggestion-result-squats-variant"));
    expect(props.onCreateVariant).toHaveBeenCalledWith(squats);
    expect(props.onChooseVariant).not.toHaveBeenCalled();
  });

  it("nom déjà utilisé : message rouge annoncé au-dessus des cartes", () => {
    renderPanel({ message: t.nameTaken });
    expect(screen.getByTestId("movement-suggestion-message").props.children).toBe(t.nameTaken);
    expect(screen.getByTestId("movement-suggestion-message").props.accessibilityRole).toBe("alert");
  });

  it("étape de variante : cadre de retour, seule la carte d'origine, Plus facile → avant, Plus difficile → après", () => {
    const props = renderPanel({ variantOf: "squats" });
    expect(screen.queryByTestId("movement-suggestion-result-assistes")).toBeNull();
    expect(screen.getByTestId("movement-suggestion-result-squats-variant").props.accessibilityState).toMatchObject({ expanded: true });
    expect(screen.getByLabelText(t.easier)).toBeTruthy();
    fireEvent.press(screen.getByTestId("movement-suggestion-result-squats-easier"));
    expect(props.onChooseVariant).toHaveBeenLastCalledWith(squats, "BEFORE_ORIGIN");
    fireEvent.press(screen.getByTestId("movement-suggestion-result-squats-harder"));
    expect(props.onChooseVariant).toHaveBeenLastCalledWith(squats, "AFTER_ORIGIN");
    fireEvent.press(screen.getByTestId("movement-suggestion-back"));
    expect(props.onBack).toHaveBeenCalledTimes(1);
  });

  it("appui posé puis levé sur le panneau : signalé à l'appelant (ordre figé, R04)", () => {
    const props = renderPanel();
    fireEvent(screen.getByTestId("movement-suggestion-panel"), "touchStart");
    expect(props.onTouchingChange).toHaveBeenLastCalledWith(true);
    fireEvent(screen.getByTestId("movement-suggestion-panel"), "touchEnd");
    expect(props.onTouchingChange).toHaveBeenLastCalledWith(false);
  });

  it("message seul, sans carte (correction, Séance)", () => {
    renderPanel({ message: t.nameTakenEdit, results: [] });
    expect(screen.getByTestId("movement-suggestion-message").props.children).toBe(t.nameTakenEdit);
    expect(screen.queryByText(t.useMovement)).toBeNull();
  });
});
