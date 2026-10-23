import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen, within } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { STOP_POINT_CHIP_HEIGHT, STOP_POINT_CHIP_TOUCH_EXTENT, StopPointChip } from "@/features/sessions/StopPointChip";
import { colors, dimensions } from "@/shared/ui/tokens";

/** Barres du symbole « ❚❚ » (3 × 10) dans la face de la puce. */
function symbolBarColors() {
  return screen
    .getByTestId("chip-face")
    .findAll((node) => typeof node.type === "string" && StyleSheet.flatten(node.props.style)?.width === 3)
    .map((node) => StyleSheet.flatten(node.props.style).backgroundColor);
}

function renderChip(props: { lifted?: boolean; onLongPress?: () => void; onAccessibilityAction?: (name: string) => void } = {}) {
  return render(
    <StopPointChip
      accessibilityLabel="Point d’arrêt après A"
      accessibilityHint="Appui long pour déplacer le point d’arrêt"
      onLongPress={props.onLongPress ?? jest.fn()}
      accessibilityActions={[{ name: "moveUp", label: "Monter" }]}
      onAccessibilityAction={props.onAccessibilityAction ?? jest.fn()}
      lifted={props.lifted}
      testID="chip"
    />,
  );
}

/**
 * PRE-6 story 4.2 (`8328:29428`) : puce « Point d'arrêt » hors placement. PRE-6 story 6.2 (D-441) :
 * l'appui long saisit le point (glisser) ; plus d'action de retrait, mais « Monter » / « Descendre ».
 * Story 7.2 : la bulle « Retirer la récupération » (`RemovalBubble`) est retirée par D-442 ; ces
 * tests, autrefois dans `RemovalBubble.test.tsx`, y sont repris.
 */
describe("StopPointChip (PRE-6 stories 4.2, 6.2)", () => {
  it("is a 22-high chip whose slop stays within its line; long press grabs it; its actions are the given ones, never « remove »", () => {
    const onLongPress = jest.fn();
    const onAccessibilityAction = jest.fn();
    renderChip({ onLongPress, onAccessibilityAction });
    const chip = screen.getByTestId("chip");
    expect(STOP_POINT_CHIP_HEIGHT).toBe(22);
    // Ligne de 30 (marges 4 / 4) : la cible ne déborde pas sur les éléments voisins.
    // Revue 5.3 : cible réelle (boîte de 30, marges négatives de 4 : la ligne garde 22), sans hitSlop.
    expect(chip.props.hitSlop).toBeUndefined();
    expect(StyleSheet.flatten(chip.props.style)).toMatchObject({
      height: STOP_POINT_CHIP_HEIGHT + 2 * STOP_POINT_CHIP_TOUCH_EXTENT,
      marginVertical: -STOP_POINT_CHIP_TOUCH_EXTENT,
    });
    expect(STOP_POINT_CHIP_HEIGHT + 2 * STOP_POINT_CHIP_TOUCH_EXTENT).toBe(30);
    expect(chip.props.accessibilityActions).toEqual([{ name: "moveUp", label: "Monter" }]);
    expect(chip.props.accessibilityHint).toBe("Appui long pour déplacer le point d’arrêt");
    fireEvent(chip, "longPress");
    expect(onLongPress).toHaveBeenCalledTimes(1);
    fireEvent(chip, "accessibilityAction", { nativeEvent: { actionName: "moveUp" } });
    expect(onAccessibilityAction).toHaveBeenCalledWith("moveUp");
  });
});

/** PRE-6 story 7.2 (D-442, « Point d'arrêt saisi ») : état soulevé de la puce. */
describe("StopPointChip — état soulevé (PRE-6 story 7.2, D-442)", () => {
  it("at rest: white chip, orange symbol, label in text-label, no shadow", () => {
    renderChip();
    const face = StyleSheet.flatten(screen.getByTestId("chip-face").props.style);
    expect(face).toMatchObject({ backgroundColor: colors.background, borderColor: "#C8C8D7" });
    expect(face.shadowOpacity).toBeUndefined();
    expect(symbolBarColors()).toEqual([colors.warning, colors.warning]);
    expect(StyleSheet.flatten(within(screen.getByTestId("chip")).getByText("Point d’arrêt").props.style).color).toBe(
      colors.textLabel,
    );
  });

  it("lifted: selected style of the placement (full primary, white symbol and label) and the lifted-card shadow, same size", () => {
    renderChip({ lifted: true });
    const chip = screen.getByTestId("chip");
    const face = StyleSheet.flatten(screen.getByTestId("chip-face").props.style);
    expect(face).toMatchObject({
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      shadowColor: colors.compositionDraggedCardShadow,
      shadowOpacity: dimensions.compositionActivityRow.draggedShadowOpacity,
      shadowRadius: dimensions.compositionActivityRow.draggedShadowRadius,
      elevation: dimensions.compositionActivityRow.draggedElevation,
    });
    expect(StyleSheet.flatten(within(chip).getByText("Point d’arrêt").props.style).color).toBe(colors.background);
    expect(symbolBarColors()).toEqual([colors.background, colors.background]);
    // Taille inchangée : même cible, aucun débord vertical ajouté (le rail compte la hauteur de repos).
    expect(StyleSheet.flatten(chip.props.style)).toMatchObject({
      height: STOP_POINT_CHIP_HEIGHT + 2 * STOP_POINT_CHIP_TOUCH_EXTENT,
      marginVertical: -STOP_POINT_CHIP_TOUCH_EXTENT,
    });
    expect(face.paddingVertical).toBe(4);
    expect(face.borderWidth).toBe(1);
  });
});
