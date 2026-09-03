import { describe, expect, it } from "@jest/globals";

import {
  NAVIGATION_BAR_BOTTOM_RESIDUAL,
  NAVIGATION_CONTENT_HEIGHT,
  NAVIGATION_ROW_HORIZONTAL_MARGIN,
  navigationBarTotalHeight,
} from "@/shared/ui/navigationLayout";

/**
 * Correction `N-03` (contre-recette iPhone, `[ChatGPT] DEVICE NO-GO —
 * PHASE02 REWORK03 CUMULATIVE CORRECTION`, 2026-09-03) : la marge entre le
 * bord bas de la barre et le bord bas de l'écran doit être visuellement
 * égale à la marge horizontale entre son coin inférieur gauche et le coin
 * inférieur gauche de l'écran — donc exactement
 * `NAVIGATION_ROW_HORIZONTAL_MARGIN`, par construction. Remplace la
 * formule précédente (fonction de `insets.bottom`, jugée trop basse au
 * rendu réel — voir `2026-09-03_P0-phase02-consolidated-rework02.md` pour
 * l'ancienne dérivation, désormais supersédée).
 */
describe("NAVIGATION_BAR_BOTTOM_RESIDUAL", () => {
  it("equals NAVIGATION_ROW_HORIZONTAL_MARGIN exactly (N-03: same distance on both axes, by construction)", () => {
    expect(NAVIGATION_BAR_BOTTOM_RESIDUAL).toBe(NAVIGATION_ROW_HORIZONTAL_MARGIN);
  });

  it("is a positive, non-zero constant", () => {
    expect(NAVIGATION_BAR_BOTTOM_RESIDUAL).toBeGreaterThan(0);
  });
});

describe("navigationBarTotalHeight", () => {
  it("is always NAVIGATION_BAR_BOTTOM_RESIDUAL + NAVIGATION_CONTENT_HEIGHT", () => {
    expect(navigationBarTotalHeight()).toBe(NAVIGATION_BAR_BOTTOM_RESIDUAL + NAVIGATION_CONTENT_HEIGHT);
  });
});
