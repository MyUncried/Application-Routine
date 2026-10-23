import { describe, expect, it } from "@jest/globals";

import {
  resolveDragShifts,
  resolveDropSettleOffset,
  type CompositionDragLayout,
  type DropTarget,
} from "@/features/sessions/compositionGesture";
import { Easing } from "react-native";

import {
  MOTION_EASING,
  MOTION_FADE_EASING,
  MOTION_FADE_DURATION_MS,
  MOTION_FADE_TO_SLIDE_DELAY_MS,
  MOTION_SHIFT_DURATION_MS,
} from "@/features/sessions/compositionMotion";
import { DRAG_SHIFT_DURATION_MS } from "@/features/sessions/useAnimatedShift";
import { DELETE_FADE_DURATION_MS } from "@/features/sessions/CompositionScreen";

/** PRE-6 story 7.6 (recette J6b) : douceur des mouvements de la Composition. */
describe("jeu de mouvements partagé (story 7.6)", () => {
  it("un seul jeu de durées : glissements et mise en place 320 ms, fondu 260 ms, glissement lancé pendant le fondu", () => {
    expect(DRAG_SHIFT_DURATION_MS).toBe(MOTION_SHIFT_DURATION_MS);
    expect(DELETE_FADE_DURATION_MS).toBe(MOTION_FADE_DURATION_MS);
    expect(MOTION_SHIFT_DURATION_MS).toBe(320);
    expect(MOTION_FADE_DURATION_MS).toBe(260);
    expect(MOTION_FADE_TO_SLIDE_DELAY_MS).toBeLessThan(MOTION_FADE_DURATION_MS);
    // L'écriture (fin du glissement) suit toujours la fin du fondu.
    expect(MOTION_FADE_TO_SLIDE_DELAY_MS + MOTION_SHIFT_DURATION_MS).toBeGreaterThan(MOTION_FADE_DURATION_MS);
  });

  it("glissements : courbe décélérée, sans rebond, qui finit en douceur ; départ moins brusque que l'ancienne courbe", () => {
    expect(MOTION_EASING(0)).toBeCloseTo(0, 6);
    expect(MOTION_EASING(1)).toBeCloseTo(1, 6);
    // La moitié du temps couvre bien plus de la moitié du chemin…
    expect(MOTION_EASING(0.5)).toBeGreaterThan(0.8);
    // Vitesse de départ (chemin par ms) : moins que l'ancienne courbe (out(cubic) sur 180 ms).
    const dt = 0.001;
    expect(MOTION_EASING(dt) / (dt * MOTION_SHIFT_DURATION_MS)).toBeLessThan(Easing.out(Easing.cubic)(dt) / (dt * 180));
    // … aucune valeur ne dépasse la cible (pas de rebond) …
    for (let t = 0; t <= 1.0001; t += 0.05) expect(MOTION_EASING(Math.min(1, t))).toBeLessThanOrEqual(1.000001);
    // … et la fin est lente : le dernier dixième ne couvre presque plus rien.
    expect(1 - MOTION_EASING(0.9)).toBeLessThan(0.01);
  });

  it("fondu : départ et fin progressifs (l'opacité ne chute pas d'emblée)", () => {
    expect(MOTION_FADE_EASING(0)).toBeCloseTo(0, 6);
    expect(MOTION_FADE_EASING(1)).toBeCloseTo(1, 6);
    // Au quart du fondu, moins d'effacement qu'avec l'ancienne courbe (out(quad)).
    expect(MOTION_FADE_EASING(0.25)).toBeLessThan(Easing.out(Easing.quad)(0.25));
    expect(1 - MOTION_FADE_EASING(0.9)).toBeLessThan(0.05);
  });
});

describe("resolveDropSettleOffset (story 7.6)", () => {
  const GAPS = { row: 10, circuitRow: 10, zone: 10, circuit: 12 };
  const layout: CompositionDragLayout = {
    tourTop: 240,
    tourBottom: 500,
    rows: [
      { id: "A", zone: "BEFORE_TOUR", top: 0, height: 70 },
      { id: "B", zone: "BEFORE_TOUR", top: 80, height: 70 },
      { id: "X", zone: "IN_TOUR", top: 340, height: 70 },
      { id: "Z", zone: "AFTER_TOUR", top: 510, height: 70 },
    ],
  };
  const offset = (dragged: string, target: DropTarget, translationY: number, rows = layout) =>
    resolveDropSettleOffset(rows, dragged, target, translationY, GAPS, resolveDragShifts(rows, dragged, target, GAPS), 14);

  it("même zone : place au-dessus de l'élément qui suit, décalé par l'aperçu", () => {
    // A sous B : B remonte de 80 (0), A se place sous elle : 0 + 70 + 10 = 80 ; lâchée à 0 + 95.
    expect(offset("A", { zone: "BEFORE_TOUR", index: 1 }, 95)).toBe(95 - 80);
  });

  it("le doigt exactement sur la place : aucun mouvement", () => {
    expect(offset("A", { zone: "BEFORE_TOUR", index: 1 }, 80)).toBe(0);
  });

  it("dans le Circuit, devant X : au-dessus de X décalé par l'insertion", () => {
    // A sort de l'avant (−80) puis entre devant X (+80) : X reste à 340 → place 340 − 10 − 70 = 260.
    expect(offset("A", { zone: "IN_TOUR", index: 0 }, 300)).toBe(300 - 260);
  });

  it("après le dernier élément d'une zone : sous le précédent", () => {
    // B en fin de l'après-Circuit, après Z : Z remonte de 80 → 430 ; place 430 + 70 + 10 = 510.
    expect(offset("B", { zone: "AFTER_TOUR", index: 1 }, 400)).toBe(80 + 400 - 510);
  });

  it("zones vides : contre le bord du Circuit (avant, dedans au-dessus de sa marge basse, après)", () => {
    const alone: CompositionDragLayout = { tourTop: 100, tourBottom: 200, rows: [{ id: "A", zone: "AFTER_TOUR", top: 210, height: 70 }] };
    // Avant le Circuit : le Circuit descend de 80 → 180 ; place 180 − 10 − 70 = 100.
    expect(offset("A", { zone: "BEFORE_TOUR", index: 0 }, -100, alone)).toBe(210 - 100 - 100);
    // Dans le Circuit vide : bas du Circuit descendu de 82 (70 + 12) → 282 ; place 282 − 14 − 70.
    expect(offset("A", { zone: "IN_TOUR", index: 0 }, -50, alone)).toBe(210 - 50 - (282 - 14 - 70));
    const before: CompositionDragLayout = { tourTop: 100, tourBottom: 200, rows: [{ id: "A", zone: "BEFORE_TOUR", top: 10, height: 70 }] };
    // Après le Circuit : le Circuit remonte de 80 → bas 120 ; place 120 + 10.
    expect(offset("A", { zone: "AFTER_TOUR", index: 0 }, 150, before)).toBe(10 + 150 - 130);
  });

  it("élément non relevé : null", () => {
    expect(offset("?", { zone: "BEFORE_TOUR", index: 0 }, 0)).toBeNull();
  });
});
