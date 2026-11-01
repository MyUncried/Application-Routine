import { describe, expect, it, jest } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";
import { StyleSheet, View } from "react-native";

import { CreateMenu } from "@/features/sessions/CreateMenu";

/**
 * PRE-9, recette iPhone du 29/10 — menu Créer de la Composition (Figma `10705:20223`) :
 * cre-figma (axe bleu), obs-4 (options inactives sans opacité, « Annuler » en bleu Kodjo), f (fondu
 * d'apparition). Jest ne prouve pas le rendu sur iPhone.
 * Ordre de Hermann du 01/11/2026 (ch13 CE-T03-08 « Menu Créer — état cible ») : plus de rangée
 * « Annuler » ; le « + » devient Annuler (croix de 34 sur fond gris) ; l'axe s'arrête à la dernière
 * option.
 */
type Measure = (callback: (x: number, y: number, width: number, height: number) => void) => void;

function renderMenu(plusAnchorRef?: { current: View | null }) {
  render(
    <CreateMenu
      top={200}
      plusAnchorRef={plusAnchorRef}
      options={[
        { key: "exercise", label: "Créer un exercice", icon: "movement", onPress: jest.fn(), testID: "opt-exercise" },
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
  it("the vertical axis is Kodjo-menu blue, starts at Annuler and stops at the last option (01/11)", () => {
    renderMenu();
    const axis = style("composition-add-activity-tree-axis");
    expect(axis.backgroundColor).toBe("#1414F5");
    // Deux rangées d'options, plus de rangée Annuler : centre de la dernière à 200 + 42 + 16.
    expect(axis.top + axis.height).toBe(200 + 42 + 16);
    // Sans mesure : part du centre d'Annuler (Figma : 47 au-dessus de la première rangée).
    expect(axis.top).toBe(200 - 47);
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

  it("01/11 — Annuler is the transformed « + »: a 34 standard cross on grey, no pill nor label; the scrim and the menu fade in", () => {
    renderMenu();
    expect(screen.queryByTestId("opt-cancel-label", { includeHiddenElements: true })).toBeNull();
    expect(screen.getByTestId("opt-cancel").props.accessibilityLabel).toBe("Annuler");
    expect(style("opt-cancel-circle")).toMatchObject({ width: 34, height: 34, borderRadius: 17, backgroundColor: "#E5E8F0", borderColor: "#BABFCC" });
    expect(style("opt-cancel-icon")).toMatchObject({ width: 24, height: 24 });
    expect(screen.queryByTestId("composition-add-activity-tree-plus", { includeHiddenElements: true })).toBeNull();
    expect(screen.getByTestId("composition-add-activity-tree", { includeHiddenElements: true }).props.entering).toBeTruthy();
  });

  it("contre-recette du 30/10 — an unavailable option label is not bold (Inter Regular)", () => {
    renderMenu();
    expect(style("opt-cycle-label")).toMatchObject({ fontFamily: "Inter_400Regular", fontWeight: "400" });
    expect(style("opt-exercise-label").fontWeight).toBe("600");
  });

  it("contre-recette du 30/10 — Annuler covers the original « + » exactly (measured), the round buttons stay on its axis", () => {
    // Le simulacre de `View` ne rappelle pas : repère du menu à (0, 20), « + » d'origine à (322, 151).
    const prototype = View.prototype as unknown as { measureInWindow: Measure };
    const spy = jest
      .spyOn(prototype, "measureInWindow")
      .mockImplementation(function (this: { props?: { testID?: string } }, callback) {
        if (this.props?.testID === "composition-add-activity-tree-frame") callback(0, 20, 402, 854);
      });
    const original = { measureInWindow: ((callback) => callback(322, 151, 44, 44)) as Measure } as unknown as View;
    try {
      renderMenu({ current: original });
    } finally {
      spy.mockRestore();
    }
    // Centre du « + » d'origine dans le repère du menu : (344, 153).
    expect(style("opt-cancel")).toMatchObject({ left: 322, top: 131, width: 44, height: 44 });
    expect(screen.getAllByTestId("opt-cancel", { includeHiddenElements: true })).toHaveLength(1);
    expect(style("composition-add-activity-tree-axis")).toMatchObject({ left: 344 - 1, top: 153 });
    // Boutons ronds (32) centrés sur l'axe ; pilules à 10 à leur gauche.
    expect(style("opt-exercise").left).toBe(344 - 16 - 10 - 243);
    expect(style("opt-cycle").left).toBe(344 - 16 - 10 - 243);
  });

  it("without a measurement, the Figma geometry is kept", () => {
    renderMenu();
    // Figma `11059:18868` : centre d'Annuler 47 au-dessus de la première rangée, à 41 du bord droit.
    expect(style("opt-cancel").top).toBe(200 - 47 - 22);
  });
});
