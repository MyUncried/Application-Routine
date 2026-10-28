import { describe, expect, it } from "@jest/globals";

import {
  NAVIGATION_BAR_BOTTOM_RESIDUAL,
  NAVIGATION_BAR_HEIGHT,
  NAVIGATION_CONTENT_HEIGHT,
  NAVIGATION_ROW_HORIZONTAL_MARGIN,
  navigationBarTotalHeight,
} from "@/shared/ui/navigationLayout";

/**
 * PRE-8, recette A/B (E01) : géométrie de `Navigation / Bottom — 5 onglets`
 * (`6513:20151`, relevée à 402) — barre `354 × 62` à `x = 24`, bord bas à 16
 * du bord physique de l'écran.
 */
describe("navigationLayout (PRE-8 E01)", () => {
  it("uses the Figma bar height and margins", () => {
    expect(NAVIGATION_BAR_HEIGHT).toBe(62);
    expect(NAVIGATION_ROW_HORIZONTAL_MARGIN).toBe(24);
    expect(NAVIGATION_BAR_BOTTOM_RESIDUAL).toBe(16);
  });

  it("keeps the active destination content inside the bar", () => {
    expect(NAVIGATION_CONTENT_HEIGHT).toBeGreaterThan(0);
    expect(NAVIGATION_CONTENT_HEIGHT).toBeLessThan(NAVIGATION_BAR_HEIGHT);
  });
});

describe("navigationBarTotalHeight", () => {
  it("is always NAVIGATION_BAR_BOTTOM_RESIDUAL + NAVIGATION_BAR_HEIGHT", () => {
    expect(navigationBarTotalHeight()).toBe(NAVIGATION_BAR_BOTTOM_RESIDUAL + NAVIGATION_BAR_HEIGHT);
    expect(navigationBarTotalHeight()).toBe(78);
  });
});
