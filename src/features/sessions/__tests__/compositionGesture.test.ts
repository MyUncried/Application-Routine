import { describe, expect, it } from "@jest/globals";

import {
  classifyMovement,
  clampSwipeTranslateX,
  isTap,
  LONG_PRESS_DELAY_MS,
  NO_DRAG_SHIFTS,
  resolveDragShifts,
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
  /**
   * PRE-6 story 6.2 (D-441) : les rangées de points sont des lignes de la géométrie (clé de rail) ;
   * le rang rendu compte donc la séquence MÊLÉE de la zone, élément glissé retiré — l'indice de
   * `moveOccurrenceInSequence` (carte) et de l'emplacement d'un point (`moveStopPoint`).
   */
  it("story 6.2 — séquence mêlée : [A, P, B] en lignes ; A sous B → rang 2 ; P sous B → rang 2 ; A entre P et B → rang 1", () => {
    const layout = {
      tourTop: 500,
      tourBottom: 700,
      rows: [
        { id: "rail:row:A", zone: "BEFORE_TOUR" as const, top: 0, height: 80 },
        { id: "rail:stop:P", zone: "BEFORE_TOUR" as const, top: 88, height: 22 },
        { id: "rail:row:B", zone: "BEFORE_TOUR" as const, top: 118, height: 80 },
      ],
    };
    expect(resolveDropTarget(layout, "rail:row:A", 170)).toEqual({ zone: "BEFORE_TOUR", index: 2 });
    expect(resolveDropTarget(layout, "rail:stop:P", 170)).toEqual({ zone: "BEFORE_TOUR", index: 2 });
    expect(resolveDropTarget(layout, "rail:row:A", 120)).toEqual({ zone: "BEFORE_TOUR", index: 1 });
  });

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

/**
 * PRE-6 (story 2.3b, amendement du 21/10/2026) : décalages de la réorganisation animée pendant le
 * glisser. Trois cartes avant le Circuit (A 0–70, B 80–150, C 160–230 ; écart entre cartes 10 :
 * pas = 80), Circuit 240–500 avec deux cartes (X 340–410, Y 420–490), une carte après le Circuit
 * (Z 510–580). Écart d'une liste de zone dans le corps : 10 ; écart en-tête / liste du Circuit : 12.
 */
describe("resolveDragShifts (décalages pendant le glisser)", () => {
  const GAPS = { row: 10, circuitRow: 10, zone: 10, circuit: 12 };
  const abc: CompositionDragLayout = {
    tourTop: 240,
    tourBottom: 500,
    rows: [
      { id: "A", zone: "BEFORE_TOUR", top: 0, height: 70 },
      { id: "B", zone: "BEFORE_TOUR", top: 80, height: 70 },
      { id: "C", zone: "BEFORE_TOUR", top: 160, height: 70 },
      { id: "X", zone: "IN_TOUR", top: 340, height: 70 },
      { id: "Y", zone: "IN_TOUR", top: 420, height: 70 },
      { id: "Z", zone: "AFTER_TOUR", top: 510, height: 70 },
    ],
  };
  type Zone = "BEFORE_TOUR" | "IN_TOUR" | "AFTER_TOUR";
  const shiftsOf = (layout: CompositionDragLayout, dragged: string, zone: Zone, index: number) => {
    const result = resolveDragShifts(layout, dragged, { zone, index }, GAPS);
    return {
      rows: Object.fromEntries(result.rows),
      circuitTop: result.circuitTop,
      circuitBottom: result.circuitBottom,
      afterCircuit: result.afterCircuit,
    };
  };
  const shifts = (dragged: string, zone: Zone, index: number) => shiftsOf(abc, dragged, zone, index);
  const still = { circuitTop: 0, circuitBottom: 0, afterCircuit: 0 };

  it("aucun décalage tant que l'emplacement visé est celui d'origine", () => {
    expect(shifts("A", "BEFORE_TOUR", 0)).toEqual({ rows: {}, ...still });
    expect(shifts("X", "IN_TOUR", 0)).toEqual({ rows: {}, ...still });
  });

  it("vers le bas : A sous B → B remonte de la hauteur du bloc A plus l'écart ; le Circuit ne bouge pas", () => {
    expect(shifts("A", "BEFORE_TOUR", 1)).toEqual({ rows: { B: -80 }, ...still });
  });

  it("plusieurs : A sous C → B puis C remontent ; revenir au-dessus de B les ramène", () => {
    expect(shifts("A", "BEFORE_TOUR", 2).rows).toEqual({ B: -80, C: -80 });
    expect(shifts("A", "BEFORE_TOUR", 0).rows).toEqual({});
  });

  it("vers le haut : C au-dessus de A → A et B descendent", () => {
    expect(shifts("C", "BEFORE_TOUR", 0).rows).toEqual({ A: 80, B: 80 });
    expect(shifts("C", "BEFORE_TOUR", 1).rows).toEqual({ B: 80 });
  });

  it("entrée dans le Circuit par le haut : il s'agrandit d'un pas (B, C et le bord haut remontent), la suite reste en place", () => {
    const entering = shifts("A", "IN_TOUR", 0);
    expect(entering).toEqual({ rows: { B: -80, C: -80 }, circuitTop: -80, circuitBottom: 0, afterCircuit: 0 });
    // Hauteur du Circuit : + pas ; ses cartes descendent RELATIVEMENT à son en-tête.
    expect(entering.circuitBottom - entering.circuitTop).toBe(80);
    expect(shifts("A", "IN_TOUR", 1).rows).toEqual({ B: -80, C: -80, X: -80 });
  });

  it("entrée dans le Circuit par le bas : il s'agrandit, la ligne après le Circuit et les occurrences suivantes descendent", () => {
    const tail: CompositionDragLayout = {
      ...abc,
      rows: [...abc.rows, { id: "W", zone: "AFTER_TOUR", top: 590, height: 70 }],
    };
    expect(shiftsOf(tail, "W", "IN_TOUR", 2)).toEqual({
      rows: { Z: 80 },
      circuitTop: 0,
      circuitBottom: 80,
      afterCircuit: 80,
    });
  });

  it("sortie du Circuit : il se rétracte d'un pas, ce qui le suit remonte jusqu'à l'emplacement visé", () => {
    expect(shifts("X", "AFTER_TOUR", 1)).toEqual({
      rows: { Y: -80, Z: -80 },
      circuitTop: 0,
      circuitBottom: -80,
      afterCircuit: -80,
    });
    expect(shifts("Y", "BEFORE_TOUR", 3)).toEqual({ rows: { X: 80 }, circuitTop: 80, circuitBottom: 0, afterCircuit: 0 });
  });

  it("Circuit vide : l'écart en-tête / liste apparaît et disparaît avec la carte", () => {
    const emptyCircuit: CompositionDragLayout = {
      tourTop: 240,
      tourBottom: 294,
      rows: [
        { id: "A", zone: "BEFORE_TOUR", top: 0, height: 70 },
        { id: "B", zone: "BEFORE_TOUR", top: 80, height: 70 },
        { id: "Z", zone: "AFTER_TOUR", top: 304, height: 70 },
      ],
    };
    // Retrait : 70 + 10 ; insertion dans le Circuit vide : 70 + 12.
    expect(shiftsOf(emptyCircuit, "B", "IN_TOUR", 0)).toEqual({
      rows: { Z: 2 },
      circuitTop: -80,
      circuitBottom: 2,
      afterCircuit: 2,
    });
    const single: CompositionDragLayout = {
      tourTop: 240,
      tourBottom: 376,
      rows: [
        { id: "A", zone: "BEFORE_TOUR", top: 0, height: 70 },
        { id: "X", zone: "IN_TOUR", top: 296, height: 70 },
        { id: "Z", zone: "AFTER_TOUR", top: 386, height: 70 },
      ],
    };
    expect(shiftsOf(single, "X", "AFTER_TOUR", 0)).toEqual({
      rows: { Z: -2 },
      circuitTop: 0,
      circuitBottom: -82,
      afterCircuit: -82,
    });
  });

  it("le pas suit la hauteur mesurée du bloc glissé (ligne de récupération comprise)", () => {
    const tall: CompositionDragLayout = {
      ...abc,
      rows: abc.rows.map((row) => (row.id === "A" ? { ...row, height: 100 } : row)),
    };
    expect(shiftsOf(tall, "A", "BEFORE_TOUR", 1).rows).toEqual({ B: -110 });
  });

  it("Fin de séance : décalage net nul à pas égaux, égal à la différence des pas sinon", () => {
    expect(resolveDragShifts(abc, "A", { zone: "BEFORE_TOUR", index: 2 }, GAPS).end).toBe(0);
    expect(resolveDragShifts(abc, "A", { zone: "IN_TOUR", index: 0 }, GAPS).end).toBe(0);
    const emptyCircuit: CompositionDragLayout = {
      tourTop: 240,
      tourBottom: 294,
      rows: [
        { id: "A", zone: "BEFORE_TOUR", top: 0, height: 70 },
        { id: "B", zone: "BEFORE_TOUR", top: 80, height: 70 },
      ],
    };
    // Hors Circuit → Circuit vide : retrait 70 + 10, insertion 70 + 12 → la Fin descend de 2.
    expect(resolveDragShifts(emptyCircuit, "B", { zone: "IN_TOUR", index: 0 }, GAPS).end).toBe(2);
  });

  it("hauteur prédite du bloc dans la zone visée : pas d’insertion différent du pas de retrait", () => {
    // A (70) entre dans le Circuit avec une carte prédite de 76 : X descend de 6 relativement à
    // l’origine (−80 + 86), le bas du Circuit et la Fin aussi.
    const result = resolveDragShifts(abc, "A", { zone: "IN_TOUR", index: 0 }, GAPS, 76);
    expect(Object.fromEntries(result.rows)).toEqual({ B: -80, C: -80, X: 6, Y: 6, Z: 6 });
    expect(result.circuitTop).toBe(-80);
    expect(result.circuitBottom).toBe(6);
    expect(result.end).toBe(6);
  });

  it("story 5.2 (D-435) : l'écart entre cartes du Circuit (9) diffère de celui du dehors (8) — chaque pas prend l'écart de sa zone", () => {
    const gaps = { row: 10, circuitRow: 11, zone: 10, circuit: 12 };
    // X sort du Circuit (retrait 70 + 11) vers la fin de la zone avant (insertion 70 + 10).
    const leaving = resolveDragShifts(abc, "X", { zone: "BEFORE_TOUR", index: 3 }, gaps);
    expect(Object.fromEntries(leaving.rows)).toEqual({ Y: -1, Z: -1 });
    expect([leaving.circuitTop, leaving.circuitBottom, leaving.afterCircuit, leaving.end]).toEqual([80, -1, -1, -1]);
    // A entre entre X et Y (retrait 70 + 10, insertion 70 + 11).
    const entering = resolveDragShifts(abc, "A", { zone: "IN_TOUR", index: 1 }, gaps);
    expect(Object.fromEntries(entering.rows)).toEqual({ B: -80, C: -80, X: -80, Y: 1, Z: 1 });
    expect(entering.end).toBe(1);
  });

  it("carte glissée absente du relevé : aucun décalage", () => {
    expect(resolveDragShifts(abc, "?", { zone: "BEFORE_TOUR", index: 0 }, GAPS)).toBe(NO_DRAG_SHIFTS);
  });
});
