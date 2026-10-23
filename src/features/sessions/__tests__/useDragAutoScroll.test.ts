import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import {
  AUTO_SCROLL_EDGE,
  AUTO_SCROLL_MAX_SPEED,
  autoScrollVelocity,
  clampScrollOffset,
} from "@/features/sessions/compositionGesture";
import { DragAutoScrollController } from "@/features/sessions/useDragAutoScroll";

/** PRE-6 story 7.4 (D-442, commentaire 3) : défilement automatique pendant le glisser. */
describe("autoScrollVelocity / clampScrollOffset (story 7.4)", () => {
  const viewport = { top: 100, height: 400 };

  it("nulle hors des bandes de bord ; progressive dans la bande ; maximale au bord et au-delà", () => {
    expect(autoScrollVelocity(300, viewport)).toBe(0);
    expect(autoScrollVelocity(100 + AUTO_SCROLL_EDGE, viewport)).toBe(0);
    expect(autoScrollVelocity(500 - AUTO_SCROLL_EDGE, viewport)).toBe(0);
    expect(autoScrollVelocity(100 + AUTO_SCROLL_EDGE / 2, viewport)).toBeCloseTo(-AUTO_SCROLL_MAX_SPEED / 2, 6);
    expect(autoScrollVelocity(500 - AUTO_SCROLL_EDGE / 4, viewport)).toBeCloseTo((AUTO_SCROLL_MAX_SPEED * 3) / 4, 6);
    expect(autoScrollVelocity(100, viewport)).toBe(-AUTO_SCROLL_MAX_SPEED);
    expect(autoScrollVelocity(20, viewport)).toBe(-AUTO_SCROLL_MAX_SPEED);
    expect(autoScrollVelocity(700, viewport)).toBe(AUTO_SCROLL_MAX_SPEED);
  });

  it("zone non mesurée ou pointeur invalide : nulle ; zone basse : bandes réduites à la moitié", () => {
    expect(autoScrollVelocity(100, { top: 0, height: 0 })).toBe(0);
    expect(autoScrollVelocity(Number.NaN, viewport)).toBe(0);
    // Zone de 80 : bandes de 40 ; le milieu (40) n'est dans aucune.
    expect(autoScrollVelocity(40, { top: 0, height: 80 })).toBe(0);
    expect(autoScrollVelocity(20, { top: 0, height: 80 })).toBeCloseTo(-AUTO_SCROLL_MAX_SPEED / 2, 6);
  });

  it("décalage borné de 0 au contenu moins la zone visible", () => {
    expect(clampScrollOffset(-5, 900, 300)).toBe(0);
    expect(clampScrollOffset(250, 900, 300)).toBe(250);
    expect(clampScrollOffset(800, 900, 300)).toBe(600);
    expect(clampScrollOffset(50, 200, 300)).toBe(0);
  });
});

describe("DragAutoScrollController (story 7.4)", () => {
  let scrolls: number[] = [];
  const viewport = { top: 0, height: 300 };
  function controller(contentHeight = 900, offset = 0) {
    scrolls = [];
    const instance = new DragAutoScrollController({
      scrollTo: (value) => scrolls.push(value),
      measure: (callback) => callback(viewport.top, viewport.height),
    });
    instance.handleLayout(viewport.height);
    instance.handleContentSize(contentHeight);
    instance.handleScroll(offset);
    return instance;
  }
  const frames = (ms: number) => jest.advanceTimersByTime(ms);

  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("hors geste : rien ne défile, le défilement accumulé est nul", () => {
    const scroll = controller();
    expect(scroll.track(295)).toBe(0);
    frames(500);
    expect(scrolls).toEqual([]);
  });

  it("bande du bas : défilement à chaque trame, rappel de l'élément soulevé avec le défilement accumulé, rendu par `track`", () => {
    const scroll = controller(900, 50);
    const deltas: number[] = [];
    scroll.begin();
    scroll.attach((delta) => deltas.push(delta));
    expect(scroll.track(300)).toBe(0);
    frames(100);
    expect(scrolls.length).toBeGreaterThan(2);
    expect(deltas).toEqual(scrolls.map((value) => value - 50));
    expect(scroll.track(300)).toBeCloseTo(scrolls[scrolls.length - 1]! - 50, 6);
    // Vitesse maximale (doigt au bord) : 720 points par seconde, à une trame près.
    expect(scrolls[scrolls.length - 1]! - 50).toBeGreaterThan(AUTO_SCROLL_MAX_SPEED * 0.08);
    expect(scrolls[scrolls.length - 1]! - 50).toBeLessThan(AUTO_SCROLL_MAX_SPEED * 0.12);
  });

  it("pendant le geste, les événements `onScroll` (en retard) sont ignorés ; après, ils sont repris", () => {
    const scroll = controller();
    scroll.begin();
    scroll.track(299);
    frames(50);
    const reached = scrolls[scrolls.length - 1]!;
    scroll.handleScroll(3);
    expect(scroll.track(150)).toBeCloseTo(reached, 6);
    scroll.end();
    scroll.handleScroll(42);
    scroll.begin();
    expect(scroll.track(150)).toBe(0);
    scroll.end();
  });

  it("arrêt au bord du contenu, hors de la bande et à la fin du geste ; reprise au mouvement suivant", () => {
    const scroll = controller(400);
    scroll.begin();
    scroll.track(299);
    frames(2000);
    expect(scrolls[scrolls.length - 1]).toBe(100);
    const atEdge = scrolls.length;
    frames(500);
    expect(scrolls).toHaveLength(atEdge);
    // Vers le haut : reprise.
    scroll.track(5);
    frames(100);
    expect(scrolls.length).toBeGreaterThan(atEdge);
    scroll.track(150);
    const outside = scrolls.length;
    frames(500);
    expect(scrolls).toHaveLength(outside);
    scroll.track(5);
    scroll.end();
    frames(500);
    expect(scrolls).toHaveLength(outside);
  });

  it("zone visible non mesurée : aucun défilement", () => {
    scrolls = [];
    const scroll = new DragAutoScrollController({ scrollTo: (value) => scrolls.push(value), measure: () => undefined });
    scroll.handleContentSize(900);
    scroll.begin();
    scroll.track(0);
    frames(500);
    expect(scrolls).toEqual([]);
  });
});
