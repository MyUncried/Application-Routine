import { describe, expect, it } from "@jest/globals";

import {
  classifyMovement,
  clampSwipeTranslateX,
  isTap,
  LONG_PRESS_DELAY_MS,
  resolveDropTarget,
  resolveDropZone,
  shouldRevealAfterSwipe,
  SWIPE_REVEAL_DISTANCE,
  TOUCH_SLOP,
  type CompositionDragLayout,
} from "@/features/sessions/compositionGesture";

/**
 * Décisions pures de la gestuelle de Composition (T02-S01, CE-T02-01/
 * CE-T02-02, D-127, AC-02/AC-03/AC-04).
 */
describe("classifyMovement / isTap (arbitrage appui / glissement / défilement)", () => {
  it("treats a movement within the touch slop as a still-possible press", () => {
    expect(isTap(0, 0)).toBe(true);
    expect(isTap(TOUCH_SLOP, -TOUCH_SLOP)).toBe(true);
    expect(isTap(TOUCH_SLOP + 1, 0)).toBe(false);
    expect(classifyMovement(0, 0)).toBe("NONE");
  });

  it("recognizes a leftward horizontal swipe only past the reveal distance", () => {
    expect(classifyMovement(-SWIPE_REVEAL_DISTANCE, 0)).toBe("SWIPE_LEFT");
    expect(classifyMovement(-SWIPE_REVEAL_DISTANCE - 20, 4)).toBe("SWIPE_LEFT");
    expect(classifyMovement(-(TOUCH_SLOP + 2), 0)).toBe("NONE");
  });

  it("recognizes a RIGHTWARD swipe as the closing gesture", () => {
    expect(classifyMovement(SWIPE_REVEAL_DISTANCE + 20, 0)).toBe("SWIPE_RIGHT");
  });

  it("leaves a vertically dominant movement to the scrolling list", () => {
    expect(classifyMovement(-SWIPE_REVEAL_DISTANCE, -200)).toBe("VERTICAL");
    expect(classifyMovement(0, 40)).toBe("VERTICAL");
  });

  it("uses the platform's own long-press delay rather than an invented one", () => {
    expect(LONG_PRESS_DELAY_MS).toBe(500);
  });
});

/**
 * V2-CAT-01 (UI-CAT-R-007) : calculs purs du balayage PROGRESSIF de
 * Composition — la carte suit le doigt en temps réel, et son alignement à la
 * relâche dépend de la position ATTEINTE, jamais de la distance parcourue
 * depuis l'origine du geste.
 */
describe("clampSwipeTranslateX (translation bornée de la carte glissée)", () => {
  it("never lets the card progress beyond its closed position (0), regardless of a rightward dx", () => {
    expect(clampSwipeTranslateX(0, 154)).toBe(0);
    expect(clampSwipeTranslateX(80, 154)).toBe(0);
  });

  it("never lets the card progress beyond its fully open position (-revealOffset), regardless of how far left dx goes", () => {
    expect(clampSwipeTranslateX(-154, 154)).toBe(-154);
    expect(clampSwipeTranslateX(-400, 154)).toBe(-154);
  });

  it("follows dx exactly within the reachable range", () => {
    expect(clampSwipeTranslateX(-80, 154)).toBe(-80);
    expect(clampSwipeTranslateX(-154 + 80, 154)).toBe(-74);
  });
});

describe("shouldRevealAfterSwipe (alignement à la relâche)", () => {
  const revealOffset = 154;

  it("aligns OPEN once the reached position is past half of the reveal course", () => {
    expect(shouldRevealAfterSwipe(-revealOffset, revealOffset)).toBe(true);
    expect(shouldRevealAfterSwipe(-(revealOffset / 2), revealOffset)).toBe(true);
    expect(shouldRevealAfterSwipe(-(revealOffset / 2) - 1, revealOffset)).toBe(true);
  });

  it("aligns CLOSED when the reached position stayed short of half the reveal course", () => {
    expect(shouldRevealAfterSwipe(0, revealOffset)).toBe(false);
    expect(shouldRevealAfterSwipe(-(revealOffset / 2) + 1, revealOffset)).toBe(false);
  });

  it("decides from the reached position alone — a card released mid-close from fully open stays open unless it crossed the midpoint", () => {
    // Carte ouverte (`-154`), remontée de `60` (donc `-94`) : reste au-delà
    // de la moitié (`-77`), donc encore ouverte, quelle que soit la distance
    // parcourue depuis l'origine du geste (jamais lue par cette fonction).
    expect(shouldRevealAfterSwipe(-94, revealOffset)).toBe(true);
  });
});

/**
 * Géométrie de référence : Compte à rebours (0–60), deux Activités
 * `BEFORE_TOUR` (70–140 puis 150–220), structure Tour (230–400) contenant une
 * Activité `IN_TOUR` (300–370), une Activité `AFTER_TOUR` (410–480).
 */
const layout: CompositionDragLayout = {
  tourTop: 230,
  tourBottom: 400,
  rows: [
    { id: "before-1", zone: "BEFORE_TOUR", top: 70, height: 70 },
    { id: "before-2", zone: "BEFORE_TOUR", top: 150, height: 70 },
    { id: "in-1", zone: "IN_TOUR", top: 300, height: 70 },
    { id: "after-1", zone: "AFTER_TOUR", top: 410, height: 70 },
  ],
};

describe("resolveDropZone", () => {
  it("uses the Tour structure — not the Activity lists — to decide the zone", () => {
    expect(resolveDropZone(layout, 0)).toBe("BEFORE_TOUR");
    expect(resolveDropZone(layout, 229)).toBe("BEFORE_TOUR");
    expect(resolveDropZone(layout, 230)).toBe("IN_TOUR");
    expect(resolveDropZone(layout, 399)).toBe("IN_TOUR");
    expect(resolveDropZone(layout, 400)).toBe("AFTER_TOUR");
    expect(resolveDropZone(layout, 10_000)).toBe("AFTER_TOUR");
  });

  it("still resolves an EMPTY zone, since no drop receptacle is required", () => {
    const emptyZones: CompositionDragLayout = { tourTop: 100, tourBottom: 160, rows: [] };
    expect(resolveDropZone(emptyZones, 50)).toBe("BEFORE_TOUR");
    expect(resolveDropZone(emptyZones, 120)).toBe("IN_TOUR");
    expect(resolveDropZone(emptyZones, 200)).toBe("AFTER_TOUR");
  });
});

describe("resolveDropTarget", () => {
  it("places the Activity before a card whose midpoint has not been crossed", () => {
    expect(resolveDropTarget(layout, "after-1", 80)).toEqual({
      zone: "BEFORE_TOUR",
      index: 0,
    });
  });

  it("places it after every card whose midpoint has been crossed", () => {
    expect(resolveDropTarget(layout, "after-1", 190)).toEqual({
      zone: "BEFORE_TOUR",
      index: 2,
    });
    expect(resolveDropTarget(layout, "after-1", 120)).toEqual({
      zone: "BEFORE_TOUR",
      index: 1,
    });
  });

  it("excludes the dragged Activity itself from the ranking (it frees its own slot)", () => {
    // Pointeur au centre de `before-2` : sans exclusion, il compterait deux
    // cartes franchies ; `before-2` étant celle qu'on déplace, le rang est 1.
    expect(resolveDropTarget(layout, "before-2", 185)).toEqual({
      zone: "BEFORE_TOUR",
      index: 1,
    });
  });

  it("resolves rank 0 in an empty destination zone", () => {
    expect(resolveDropTarget(layout, "before-1", 350)).toEqual({ zone: "IN_TOUR", index: 1 });
    expect(resolveDropTarget(layout, "in-1", 320)).toEqual({ zone: "IN_TOUR", index: 0 });
  });

  it("resolves a drop below the Tour into AFTER_TOUR", () => {
    expect(resolveDropTarget(layout, "before-1", 500)).toEqual({
      zone: "AFTER_TOUR",
      index: 1,
    });
    expect(resolveDropTarget(layout, "after-1", 500)).toEqual({
      zone: "AFTER_TOUR",
      index: 0,
    });
  });

  it("ranks by the cards' real vertical order, never by their declaration order", () => {
    const shuffled: CompositionDragLayout = {
      ...layout,
      rows: [layout.rows[1]!, layout.rows[0]!, layout.rows[2]!, layout.rows[3]!],
    };
    expect(resolveDropTarget(shuffled, "after-1", 190)).toEqual({
      zone: "BEFORE_TOUR",
      index: 2,
    });
  });
});
