import { describe, expect, it, jest } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { CreateMenu } from "@/features/sessions/CreateMenu";
import { colors } from "@/shared/ui/tokens";

/**
 * PRE-9, recette iPhone du 29/10 — menu Créer de la Composition (Figma `10705:20223`) :
 * cre-figma (axe bleu), obs-4 (options inactives sans opacité, « Annuler » en bleu Kodjo), f (fondu
 * d'apparition). Jest ne prouve pas le rendu sur iPhone.
 */
function renderMenu() {
  render(
    <CreateMenu
      top={200}
      options={[
        { key: "exercise", label: "Créer un nouvel exercice", icon: "exercise", onPress: jest.fn(), testID: "opt-exercise" },
        { key: "cycle", label: "Ajouter un cycle", icon: "cycle", testID: "opt-cycle" },
      ]}
      onCancel={jest.fn()}
      cancelLabel="Annuler"
      cancelTestID="opt-cancel"
    />,
  );
}

const style = (testID: string) => StyleSheet.flatten(screen.getByTestId(testID, { includeHiddenElements: true }).props.style);

describe("CreateMenu — recette du 29/10", () => {
  it("the vertical axis is Kodjo-menu blue and reaches the round button of « Annuler »", () => {
    renderMenu();
    const axis = style("composition-add-activity-tree-axis");
    expect(axis.backgroundColor).toBe("#1414F5");
    // Trois rangées (2 options + Annuler) : centre de la dernière à 200 + 2 × 42 + 16.
    expect(axis.top + axis.height).toBe(200 + 2 * 42 + 16);
  });

  it("an unavailable option: no opacity on the row; opaque grey pill, darker grey label, veiled icon", () => {
    renderMenu();
    expect(style("opt-cycle").opacity).toBeUndefined();
    expect(style("opt-cycle-pill")).toMatchObject({ backgroundColor: "#E5E8F0", borderColor: "#BABFCC" });
    expect(style("opt-cycle-label").color).toBe("#5C6170");
    expect(screen.getByTestId("opt-cycle-icon-veil", { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByTestId("opt-cycle").props.accessibilityState).toEqual({ disabled: true });
    // L'option disponible garde son dessin bleu, sans voile.
    expect(style("opt-exercise-label").color).toBe("#1414F5");
    expect(screen.queryByTestId("opt-exercise-icon-veil", { includeHiddenElements: true })).toBeNull();
  });

  it("« Annuler » is written in Kodjo blue; the scrim and the menu fade in", () => {
    renderMenu();
    expect(style("opt-cancel-label").color).toBe(colors.primary);
    expect(screen.getByTestId("composition-add-activity-tree", { includeHiddenElements: true }).props.entering).toBeTruthy();
  });
});
