import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { CREATE_MENU_LAYER, CreateMenu } from "@/features/sessions/CreateMenu";
import type { FloatingCreateAnchor } from "@/shared/ui/FloatingCreateButton";

/**
 * Menu Créer de la Composition (Figma `10705:20223`). Recettes du 29/10 (cre-figma : axe bleu ; obs-4 : options inactives
 * sans opacité ; f : fondu d'apparition) et du 01/11 (le bouton devient la croix ; menu au-dessus de la zone de contexte).
 * UI-FAB-01 (D-558, DSF Bouton flottant § 4, 24/11/2026) : ouverture vers le haut depuis le bouton flottant ; la croix est le
 * bouton transformé (même rond de verre, même place) ; options empilées au-dessus, icônes sur l'axe du bouton.
 * [Ouverture vers le bas depuis le « + » de la zone de contexte (mesure du « + », croix grise de 34) — remplacée.]
 * Jest ne prouve pas le rendu sur iPhone.
 */
const RIGHT: FloatingCreateAnchor = { centerX: 356, centerY: 748, side: "RIGHT" };

function renderMenu(anchor: FloatingCreateAnchor | null = RIGHT, onCancel = jest.fn()) {
  render(
    <CreateMenu
      anchor={anchor}
      options={[
        { key: "exercise", label: "Créer un exercice", icon: "exercise", onPress: jest.fn(), testID: "opt-exercise" },
        { key: "circuit", label: "Créer un circuit", icon: "circuit", testID: "opt-circuit" },
        { key: "cycle", label: "Créer un cycle", icon: "cycle", onPress: jest.fn(), testID: "opt-cycle" },
        { key: "stop", label: "Ajouter un point d’arrêt", icon: "stopPoint", onPress: jest.fn(), accessibilityHint: "indice", testID: "opt-stop" },
      ]}
      onCancel={onCancel}
      cancelLabel="Fermer le menu Créer"
      cancelTestID="opt-cancel"
    />,
  );
  return onCancel;
}

const style = (testID: string) => StyleSheet.flatten(screen.getByTestId(testID, { includeHiddenElements: true }).props.style);

describe("CreateMenu — ouverture depuis le bouton flottant (UI-FAB-01)", () => {
  it("quatre options empilées au-dessus du bouton, la dernière à 14 de son haut, écart 10 (Figma 10705:20223)", () => {
    renderMenu();
    // Bouton : centre (356, 748), haut à 718. Dernière rangée (32) : 718 − 14 − 32 = 672 ; puis 630, 588, 546.
    expect(style("opt-stop").top).toBe(672);
    expect(style("opt-cycle").top).toBe(630);
    expect(style("opt-circuit").top).toBe(588);
    expect(style("opt-exercise").top).toBe(546);
  });

  it("icônes rondes sur l'axe du bouton ; pilules de 263 à 10 à leur gauche", () => {
    renderMenu();
    // Icône de 32 centrée sur x = 356 : gauche à 340 ; pilule de 263 à 10 de l'icône : rangée à 340 − 10 − 263 = 67.
    expect(style("opt-exercise").left).toBe(67);
    expect(style("opt-exercise-pill").width).toBe(263);
  });

  it("bouton rangé à gauche : même pile en miroir, pilules à droite des icônes", () => {
    renderMenu({ centerX: 46, centerY: 748, side: "LEFT" });
    expect(style("opt-exercise")).toMatchObject({ left: 46 - 16, flexDirection: "row-reverse" });
  });

  it("l'axe bleu relie le bord haut de la croix à la première icône, sans traverser la croix (recette du 24/11/2026)", () => {
    renderMenu();
    const axis = style("composition-add-activity-tree-axis");
    expect(axis.backgroundColor).toBe("#1414F5");
    expect(axis.left).toBe(356 - 1);
    expect(axis.top).toBe(546 + 16);
    // Haut du bouton : 748 − 30 = 718. [Jusqu'au centre du bouton (748) — remplacé.]
    expect(axis.top + axis.height).toBe(718);
  });

  it("la croix est le bouton flottant transformé : rond de verre de 60 à sa place, variante Fermer ; elle et le voile ferment sans action", () => {
    const onCancel = renderMenu();
    expect(style("opt-cancel")).toMatchObject({ left: 326, top: 718, width: 60, height: 60 });
    expect(screen.getByTestId("opt-cancel").props.accessibilityLabel).toBe("Fermer le menu Créer");
    expect(screen.getByTestId("floating-create-glyph-close", { includeHiddenElements: true })).toBeTruthy();
    fireEvent.press(screen.getByTestId("opt-cancel"));
    fireEvent.press(screen.getByTestId("composition-add-activity-tree-backdrop", { includeHiddenElements: true }));
    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it("« Ajouter un point d'arrêt » : icône du sablier sur fond bleu, indication VoiceOver reprise", () => {
    renderMenu();
    expect(screen.getByTestId("create-menu-icon-stop-point", { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByTestId("opt-stop").props.accessibilityHint).toBe("indice");
  });

  it("D-594 : bouton en haut de l'écran, pas de place au-dessus : le menu s'ouvre vers le bas, même ordre, axe vers la dernière option", () => {
    renderMenu({ centerX: 356, centerY: 120, side: "RIGHT" });
    // Haut du bouton à 90 : pile de 4 × 32 + 3 × 10 = 158, impossible au-dessus. Sous le bouton : 150 + 14 = 164.
    expect(style("opt-exercise").top).toBe(164);
    expect(style("opt-circuit").top).toBe(206);
    expect(style("opt-stop").top).toBe(290);
    const axis = style("composition-add-activity-tree-axis");
    // Bas du bouton : 120 + 30 = 150. [Depuis le centre (120) — remplacé.]
    expect(axis.top).toBe(150);
    expect(axis.top + axis.height).toBe(290 + 16);
  });

  it("sans ancre mesurée : position par défaut du bouton (16 du bord droit, bas de l'écran)", () => {
    renderMenu(null);
    expect(style("opt-cancel").width).toBe(60);
  });
});

describe("CreateMenu — recettes du 29/10 et du 01/11", () => {
  it("an unavailable option: no opacity on the row; opaque grey pill, darker grey label, veiled icon", () => {
    renderMenu();
    expect(style("opt-circuit").opacity).toBeUndefined();
    expect(style("opt-circuit-pill")).toMatchObject({ backgroundColor: "#E5E8F0", borderColor: "#BABFCC" });
    expect(style("opt-circuit-label").color).toBe("#5C6170");
    expect(screen.getByTestId("opt-circuit-icon-veil", { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByTestId("opt-circuit").props.accessibilityState).toEqual({ disabled: true });
    expect(style("opt-exercise-label").color).toBe("#1414F5");
    expect(screen.queryByTestId("opt-exercise-icon-veil", { includeHiddenElements: true })).toBeNull();
  });

  it("contre-recette du 30/10 — an unavailable option label is not bold (Inter Regular)", () => {
    renderMenu();
    expect(style("opt-circuit-label")).toMatchObject({ fontFamily: "Inter_400Regular", fontWeight: "400" });
    expect(style("opt-exercise-label").fontWeight).toBe("600");
  });

  it("the menu is a layer above any sibling with a zIndex (the context band has zIndex 1): iOS zIndex and Android elevation; it fades in", () => {
    renderMenu();
    const root = style("composition-add-activity-tree");
    expect(root.zIndex).toBe(CREATE_MENU_LAYER);
    expect(root.elevation).toBe(CREATE_MENU_LAYER);
    expect(CREATE_MENU_LAYER).toBeGreaterThan(1);
    expect(screen.getByTestId("composition-add-activity-tree", { includeHiddenElements: true }).props.entering).toBeTruthy();
  });

  it("the cross is the last child of the menu (painted and touched above the scrim, the axis and the options)", () => {
    renderMenu();
    const root = screen.getByTestId("composition-add-activity-tree", { includeHiddenElements: true });
    const children = root.children.filter((child): child is typeof root => typeof child !== "string");
    expect(children[children.length - 1]!.props.testID).toBe("opt-cancel");
  });

  it("« Créer un exercice » keeps the dumbbell icon", () => {
    renderMenu();
    expect(screen.getByTestId("create-menu-icon-exercise", { includeHiddenElements: true })).toBeTruthy();
  });
});
