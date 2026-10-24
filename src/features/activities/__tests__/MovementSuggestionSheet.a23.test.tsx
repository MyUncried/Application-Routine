import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";

import type { Movement } from "@/domain/activities/Movement";
import type { MovementChoice } from "@/features/activities/ActivityDefinitionService";
import { MovementSuggestionSheet } from "@/features/activities/MovementSuggestionSheet";
import { strings } from "@/shared/i18n";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

jest.mock("@/infrastructure/media/VideoPoster", () => ({ generateVideoPoster: jest.fn(async () => null) }));

/**
 * PRE-7 story A2.3 (MFN-06 ; `9882:19049`) — feuille de suggestion : message adapté à l'origine du
 * geste (Catalogue / local, relevé du 23/10), trois choix rendus tels quels, noms littéraux.
 */

const t = strings.screens.activities.editor.movementSuggestion;

function choice(name: string, definitionCount: number, level: MovementChoice["level"] = null): MovementChoice {
  const movement: Movement = {
    id: "m-1",
    name,
    description: null,
    media: [],
    categoryId: "cardio",
    bodyZoneIds: ["cuisses"],
    phases: [],
    nextPhaseId: 1,
    used: false,
    levelGroup: null,
  };
  return { movement, definitionCount, level };
}

function renderSheet(suggestion: MovementChoice) {
  const onChoose = jest.fn();
  const onSearch = jest.fn();
  render(
    <TestSafeAreaProvider>
      <MovementSuggestionSheet
        visible
        suggestion={suggestion}
        onChoose={onChoose}
        onSearch={onSearch}
        onDismiss={jest.fn()}
        onDismissed={jest.fn()}
      />
    </TestSafeAreaProvider>,
  );
  return { onChoose, onSearch };
}

describe("PRE-7 A2.3 — MovementSuggestionSheet", () => {
  it("geste du Catalogue : message « déjà dans votre catalogue », rang et nombre calculés ; chaque choix transmis", () => {
    const { onChoose, onSearch } = renderSheet(choice("Squats", 2, { rank: 2, total: 3 }));
    expect(screen.getByText("Squats est déjà dans votre catalogue. Voulez-vous le réutiliser ?")).toBeTruthy();
    expect(screen.getByText("Niveau 2 sur 3 · 2 exercices")).toBeTruthy();
    expect(screen.getByTestId("movement-suggestion-card").props.accessibilityLabel).toBe("Squats, Niveau 2 sur 3 · 2 exercices");
    fireEvent.press(screen.getByTestId("movement-suggestion-same"));
    fireEvent.press(screen.getByTestId("movement-suggestion-variant"));
    fireEvent.press(screen.getByTestId("movement-suggestion-independent"));
    fireEvent.press(screen.getByText(t.searchOther));
    expect(onChoose.mock.calls.map((call) => call[0])).toEqual(["SAME_MOVEMENT", "VARIANT", "INDEPENDENT"]);
    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it("geste local (aucun Exercice au Catalogue) : formulation neutre, aucun sous-titre ; nom littéral", () => {
    renderSheet(choice("Squat $& $'", 0));
    expect(screen.getByText("Squat $& $' existe déjà. Voulez-vous le réutiliser ?")).toBeTruthy();
    expect(screen.queryByText(/catalogue/)).toBeNull();
    expect(screen.queryByTestId("movement-suggestion-card-subtitle")).toBeNull();
    expect(screen.getByText("Aucun lien avec Squat $& $'")).toBeTruthy();
  });
});
