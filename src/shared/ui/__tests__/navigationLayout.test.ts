import { describe, expect, it } from "@jest/globals";

import {
  NAVIGATION_BAR_MIN_BOTTOM_RESIDUAL,
  NAVIGATION_BAR_SAFE_AREA_OVERLAP,
  NAVIGATION_CONTENT_HEIGHT,
  navigationBarBottomResidual,
  navigationBarTotalHeight,
} from "@/shared/ui/navigationLayout";

/**
 * Correction `D` (contre-recette iPhone, correction consolidée, `[ChatGPT]
 * DIAGNOSTIC APPROVED — PHASE02 CONSOLIDATED REWORK02`, 2026-09-03,
 * addendum `FOUNDATION BOTTOM NAVIGATION VERTICAL POSITION`).
 *
 * Géométrie de référence (canevas `402×874`) : zone de navigation
 * `y=797–874` (`77pt`), pilule `h=66` `y=797–863`, résiduel bas `11pt` —
 * pour un appareil de référence à `insets.bottom=34` (valeur `TestSafeArea
 * Provider`, déjà utilisée ailleurs dans ce projet pour représenter un
 * appareil avec indicateur d'accueil).
 */
describe("navigationBarBottomResidual", () => {
  it("returns exactly 11 (the reference residual) for insets.bottom=34 (the reference device)", () => {
    expect(navigationBarBottomResidual(34)).toBe(11);
  });

  it("derives from insets.bottom minus the reference overlap (23) above the floor", () => {
    expect(navigationBarBottomResidual(40)).toBe(40 - NAVIGATION_BAR_SAFE_AREA_OVERLAP);
    expect(navigationBarBottomResidual(48)).toBe(48 - NAVIGATION_BAR_SAFE_AREA_OVERLAP);
  });

  it("floors at NAVIGATION_BAR_MIN_BOTTOM_RESIDUAL (11) for any inset at or below the overlap, including 0 (no home indicator)", () => {
    expect(navigationBarBottomResidual(0)).toBe(NAVIGATION_BAR_MIN_BOTTOM_RESIDUAL);
    expect(navigationBarBottomResidual(20)).toBe(NAVIGATION_BAR_MIN_BOTTOM_RESIDUAL);
    expect(navigationBarBottomResidual(23)).toBe(NAVIGATION_BAR_MIN_BOTTOM_RESIDUAL);
  });

  it("never returns a negative residual", () => {
    expect(navigationBarBottomResidual(0)).toBeGreaterThanOrEqual(0);
    expect(navigationBarBottomResidual(-10)).toBeGreaterThanOrEqual(0);
  });
});

describe("navigationBarTotalHeight", () => {
  // `NAVIGATION_CONTENT_HEIGHT` reste dérivée du contenu réel d'un item
  // (`SHELL-R02-E`, valeur non liée à la pilule `66` de la référence
  // Figma, jamais vérifiée contre un rendu réel et abandonnée pour cette
  // raison) — `navigationBarTotalHeight` ne prétend donc pas reproduire
  // exactement `77` ici, seulement la relation résiduel + contenu.
  it("is always residual + NAVIGATION_CONTENT_HEIGHT, for the reference device (insets.bottom=34)", () => {
    expect(navigationBarTotalHeight(34)).toBe(navigationBarBottomResidual(34) + NAVIGATION_CONTENT_HEIGHT);
  });

  it("is always residual + NAVIGATION_CONTENT_HEIGHT, for any inset", () => {
    for (const insetsBottom of [0, 11, 23, 34, 48]) {
      expect(navigationBarTotalHeight(insetsBottom)).toBe(
        navigationBarBottomResidual(insetsBottom) + NAVIGATION_CONTENT_HEIGHT,
      );
    }
  });
});
