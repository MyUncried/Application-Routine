import { describe, expect, it } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";
import { Animated, StyleSheet } from "react-native";

import { RailLink } from "@/features/sessions/CompositionSequence";

/**
 * PRE-6 (story 5.2, revue) : lien du rail — il garde son bas sur l'ancre et s'étire ou se rétracte
 * de `shift - prevShift` ; une rétraction plus longue que lui l'écrase à 0 sans le retourner.
 */
const hidden = { includeHiddenElements: true };

function renderLink(length: number, shift: number, prevShift: number) {
  render(
    <RailLink
      centerX={40}
      entryY={8}
      length={length}
      shift={new Animated.Value(shift)}
      prevShift={new Animated.Value(prevShift)}
      testID="link"
    />,
  );
  const style = StyleSheet.flatten(screen.getByTestId("link", hidden).props.style);
  const transform = style.transform as Record<string, number>[];
  return {
    style,
    translateY: transform.find((entry) => entry.translateY !== undefined)!.translateY!,
    scaleY: transform.find((entry) => entry.scaleY !== undefined)!.scaleY!,
  };
}

describe("RailLink (story 5.2)", () => {
  it("au repos : de l'ancre vers le haut, de toute sa longueur, centré sur l'axe", () => {
    const { style, translateY, scaleY } = renderLink(16, 0, 0);
    expect(style).toMatchObject({ top: 8 - 16, height: 16, left: 40 - 0.75, width: 1.5 });
    expect(scaleY).toBe(1);
    expect(translateY + 0).toBe(0);
  });

  it("étiré : l'élément descend de 10 par rapport à son prédécesseur → 26 visibles, bas fixe", () => {
    const { scaleY, translateY } = renderLink(16, 10, 0);
    expect(16 * scaleY).toBeCloseTo(26, 6);
    // Bas fixe : la mise à l'échelle autour du centre est compensée de la moitié de l'étirement.
    expect(translateY).toBe(-5);
  });

  it("rétracté au-delà de sa longueur : écrasé à 0, jamais retourné", () => {
    const { scaleY } = renderLink(16, -30, 0);
    expect(scaleY).toBe(0);
  });

  it("rétracté exactement de sa longueur : 0", () => {
    expect(renderLink(16, 0, 16).scaleY).toBe(0);
  });
});
