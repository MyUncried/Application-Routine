import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";

import type { Movement } from "@/domain/activities/Movement";
import type { MovementChoice } from "@/features/activities/ActivityDefinitionService";
import { MovementSearchScreen } from "@/features/activities/MovementSearchScreen";
import { strings } from "@/shared/i18n";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * PRE-7 story R-8 (D-448 points 1 et 2) — écran de recherche, conservé dans le code sans point
 * d'entrée dans l'interface (précision de Hermann du 26/10/2026 : « Conservé sans accès pour
 * l'instant »). Reprend, sur l'écran seul, les parcours R03 vérifiés jusqu'ici par le lien de
 * l'éditeur (retiré) : requête préremplie, absence annoncée avec « Voir tous les mouvements »,
 * liste complète sur requête vide, ✕ ; et les correspondances par début de mot (point 1).
 */

const t = strings.screens.activities.editor.movementSearch;

function choice(id: string, name: string, definitionCount = 1): MovementChoice {
  const movement: Movement = {
    id,
    name,
    description: null,
    media: [],
    categoryId: "cardio",
    bodyZoneIds: ["cuisses"],
    phases: [],
    nextPhaseId: 1,
    aliases: [],
    levelGroup: null,
  };
  return { movement, definitionCount, level: null };
}

const CHOICES = [
  choice("squats", "Squats"),
  choice("sautes-haut", "Squats sautés haut"),
  choice("sautes-bas", "Squats sautés bas"),
  choice("genou", "Mobilisation du genou", 0),
];

const resultIds = () =>
  screen
    .queryAllByTestId(/^movement-search-result-.+-summary$/)
    .map((node) => String(node.props.testID).replace(/^movement-search-result-(.+)-summary$/, "$1"));

function renderScreen(initialQuery: string) {
  const props = { onUse: jest.fn(), onChooseVariant: jest.fn(), onClose: jest.fn() };
  render(
    <TestSafeAreaProvider>
      <MovementSearchScreen choices={CHOICES} initialQuery={initialQuery} {...props} />
    </TestSafeAreaProvider>,
  );
  return props;
}

describe("PRE-7 R-8 — MovementSearchScreen (sans point d'entrée)", () => {
  it("requête préremplie ; début de mot : « Squats sau » → Squats sautés bas, Squats sautés haut en tête", () => {
    renderScreen("Squats sau");
    expect(screen.getByTestId("movement-search-input").props.value).toBe("Squats sau");
    expect(resultIds().slice(0, 2)).toEqual(["sautes-bas", "sautes-haut"]);
  });

  it("sans résultat : absence annoncée, « Voir tous les mouvements » vide la requête et liste tout, sans exercice compris", () => {
    renderScreen("Natation");
    expect(screen.getByTestId("movement-search-empty")).toBeTruthy();
    expect(screen.getByText(t.noResult)).toBeTruthy();
    fireEvent.press(screen.getByTestId("movement-search-show-all"));
    expect(screen.getByTestId("movement-search-input").props.value).toBe("");
    expect(screen.queryByTestId("movement-search-empty")).toBeNull();
    expect(resultIds()).toEqual(["squats", "sautes-haut", "sautes-bas", "genou"]);
  });

  it("« Utiliser ce mouvement » transmet le mouvement choisi ; ✕ ferme sans choix", () => {
    const props = renderScreen("mobil");
    expect(resultIds()).toEqual(["genou"]);
    fireEvent.press(screen.getByTestId("movement-search-result-genou-use"));
    expect(props.onUse).toHaveBeenCalledWith(CHOICES[3]);
    fireEvent.press(screen.getAllByLabelText(t.closeAccessibilityLabel).at(-1)!);
    expect(props.onClose).toHaveBeenCalled();
    expect(props.onChooseVariant).not.toHaveBeenCalled();
  });
});
