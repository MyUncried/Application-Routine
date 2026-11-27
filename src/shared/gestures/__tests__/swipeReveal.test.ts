import { describe, expect, it } from "@jest/globals";

import {
  resolveSwipeRelease,
  SWIPE_ACTIVATION_DISTANCE,
  SWIPE_DECISION_DISTANCE,
  SWIPE_FLICK_VELOCITY,
  SWIPE_VERTICAL_TOLERANCE,
} from "@/shared/gestures/swipeReveal";

/**
 * Recette iPhone du 26/11/2026 (après-midi) — règle unique du glisser-pour-options (Hermann : « un geste court vers la gauche et
 * vers la droite ouvre et ferme les options […] Je ne dois pas avoir à accompagner le mouvement sur toute la largeur »).
 */
describe("règle unique du glisser-pour-options", () => {
  it("seuils : activation courte, tolérance verticale généreuse (départ en diagonale), décision courte", () => {
    expect(SWIPE_ACTIVATION_DISTANCE).toBe(10);
    expect(SWIPE_VERTICAL_TOLERANCE).toBeGreaterThan(SWIPE_ACTIVATION_DISTANCE * 2);
    expect(SWIPE_DECISION_DISTANCE).toBe(24);
    expect(SWIPE_FLICK_VELOCITY).toBe(300);
  });

  it("fermée : un geste court vers la gauche ouvre ; en deçà, reste fermée ; vers la droite, reste fermée", () => {
    expect(resolveSwipeRelease({ wasOpen: false, translationX: -24 })).toBe(true);
    expect(resolveSwipeRelease({ wasOpen: false, translationX: -23 })).toBe(false);
    expect(resolveSwipeRelease({ wasOpen: false, translationX: 60 })).toBe(false);
  });

  it("ouverte : un geste court vers la droite ferme ; en deçà, reste ouverte ; vers la gauche, reste ouverte", () => {
    expect(resolveSwipeRelease({ wasOpen: true, translationX: 24 })).toBe(false);
    expect(resolveSwipeRelease({ wasOpen: true, translationX: 23 })).toBe(true);
    expect(resolveSwipeRelease({ wasOpen: true, translationX: -60 })).toBe(true);
  });

  it("lancer : son sens décide, quelle que soit la distance", () => {
    expect(resolveSwipeRelease({ wasOpen: false, translationX: -11, velocityX: -SWIPE_FLICK_VELOCITY })).toBe(true);
    expect(resolveSwipeRelease({ wasOpen: true, translationX: 11, velocityX: SWIPE_FLICK_VELOCITY })).toBe(false);
    // Retour du doigt lancé dans l'autre sens : le dernier sens l'emporte.
    expect(resolveSwipeRelease({ wasOpen: false, translationX: -40, velocityX: 800 })).toBe(false);
    // Vitesse non finie : ignorée.
    expect(resolveSwipeRelease({ wasOpen: false, translationX: -30, velocityX: Number.NaN })).toBe(true);
  });
});
