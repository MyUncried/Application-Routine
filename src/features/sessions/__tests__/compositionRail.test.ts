import { describe, expect, it } from "@jest/globals";

import { RAIL_KEYS, railRowKey, resolveRailLinks, type RailChainInput } from "@/features/sessions/compositionRail";

/**
 * PRE-6 (story 5.2, D-435, Figma `8328:28605`) : liens du rail segmenté. Géométrie de conception à
 * 402 : écart 8 hors Circuit, 9 dans le Circuit, marge du Circuit 14, ancres — haut du média 8,
 * haut de l'anneau du Circuit 15 (en-tête de 40), haut de l'anneau de Fin 7 (rangée de 24).
 */
const GEOMETRY = { sequenceGap: 8, circuitGap: 9, circuitPadding: 14, rowEntry: 8, circuitHeaderEntry: 15, endEntry: 7 };
const CARD = 80;

function links(input: Partial<RailChainInput>) {
  return resolveRailLinks({
    beforeTour: [],
    inTour: [],
    afterTour: [],
    hasAfterCircuit: false,
    skipped: null,
    geometry: GEOMETRY,
    ...input,
  });
}
const summary = (result: ReturnType<typeof links>) =>
  Object.fromEntries([...result].map(([key, link]) => [key, [link.prevKey, link.length]]));

describe("resolveRailLinks (rail segmenté, story 5.2)", () => {
  it("séquence vide : Compte à rebours → anneau du Circuit vide → bas du Circuit → Fin", () => {
    expect(summary(links({}))).toEqual({
      // Écart 8 + marge haute du Circuit 14 + haut de l'anneau 15.
      [RAIL_KEYS.circuitHeader]: [RAIL_KEYS.start, 8 + 14 + 15],
      // Du bas de l'en-tête au bas du Circuit : marge basse 14.
      [RAIL_KEYS.circuitEnd]: [RAIL_KEYS.circuitHeader, 14],
      [RAIL_KEYS.end]: [RAIL_KEYS.circuitEnd, 8 + 7],
    });
  });

  it("une carte avant, dans et après le Circuit : anneau → média → anneau → média → bas du Circuit → média → Fin", () => {
    expect(summary(links({ beforeTour: ["b"], inTour: ["i"], afterTour: ["a"] }))).toEqual({
      [railRowKey("b")]: [RAIL_KEYS.start, 8 + 8],
      [RAIL_KEYS.circuitHeader]: [railRowKey("b"), 8 + 14 + 15],
      [railRowKey("i")]: [RAIL_KEYS.circuitHeader, 9 + 8],
      [RAIL_KEYS.circuitEnd]: [railRowKey("i"), 14],
      [railRowKey("a")]: [RAIL_KEYS.circuitEnd, 8 + 8],
      [RAIL_KEYS.end]: [railRowKey("a"), 8 + 7],
    });
  });

  it("deux cartes dans le Circuit : écart 9 ; deux cartes au dehors : écart 8", () => {
    const result = links({ beforeTour: ["b1", "b2"], inTour: ["i1", "i2"] });
    expect(result.get(railRowKey("b2"))).toMatchObject({ prevKey: railRowKey("b1"), length: 8 + 8 });
    expect(result.get(railRowKey("i2"))).toMatchObject({ prevKey: railRowKey("i1"), length: 9 + 8 });
  });

  it("point après le Circuit : la rangée se relie au bas du Circuit, la suite à la rangée", () => {
    const result = links({ afterTour: ["a"], hasAfterCircuit: true });
    expect(result.get(RAIL_KEYS.afterCircuit)).toMatchObject({ prevKey: RAIL_KEYS.circuitEnd, length: 8 });
    expect(result.get(railRowKey("a"))).toMatchObject({ prevKey: RAIL_KEYS.afterCircuit, length: 8 + 8 });
    // Sans occurrence après : la Fin se relie à la rangée.
    expect(links({ hasAfterCircuit: true }).get(RAIL_KEYS.end)).toMatchObject({ prevKey: RAIL_KEYS.afterCircuit, length: 15 });
  });

  it("aucune coordonnée d'exemple : chaque lien rejoint exactement le bord bas de son prédécesseur dans la mise en page en flux", () => {
    // Mise en page simulée à partir des seules règles de flux (écarts, marges, hauteurs) — rangée
    // d'un point d'arrêt comprise dans le bloc de la carte (80 + 8 + 22).
    const input = { beforeTour: ["b1", "b2"], inTour: ["i1", "i2"], afterTour: ["a1"], hasAfterCircuit: true };
    const heights: Record<string, number> = { b1: CARD + 8 + 22, b2: CARD, i1: CARD, i2: CARD + 9 + 22, a1: CARD };
    const boxes = new Map<string, { top: number; bottom: number; anchor: number }>();
    let y = 0;
    const put = (key: string, height: number, anchor: number) => {
      boxes.set(key, { top: y, bottom: y + height, anchor: y + anchor });
      y += height;
    };
    put(RAIL_KEYS.start, 27, 0);
    for (const id of input.beforeTour) {
      y += 8;
      put(railRowKey(id), heights[id], 8);
    }
    y += 8 + 14;
    put(RAIL_KEYS.circuitHeader, 40, 15);
    for (const id of input.inTour) {
      y += 9;
      put(railRowKey(id), heights[id], 8);
    }
    y += 14;
    put(RAIL_KEYS.circuitEnd, 0, 0);
    y += 8;
    put(RAIL_KEYS.afterCircuit, 22, 0);
    for (const id of input.afterTour) {
      y += 8;
      put(railRowKey(id), heights[id], 8);
    }
    y += 8;
    put(RAIL_KEYS.end, 24, 7);

    const result = links(input);
    expect(result.size).toBe(boxes.size - 1);
    for (const [key, link] of result) {
      expect(boxes.get(key)!.anchor - link.length).toBe(boxes.get(link.prevKey)!.bottom);
    }
  });

  it("glisser : l'occurrence glissée sort de la chaîne, son successeur se relie à son prédécesseur à travers sa place", () => {
    const result = links({
      beforeTour: ["b1", "b2"],
      inTour: ["i1"],
      skipped: { id: "b1", height: CARD },
    });
    expect(result.has(railRowKey("b1"))).toBe(false);
    // Écart 8 + carte 80 (place d'origine) + écart 8 + haut du média 8.
    expect(result.get(railRowKey("b2"))).toEqual({ prevKey: RAIL_KEYS.start, length: 8 + CARD + 8 + 8 });
    // La suite de la chaîne est inchangée.
    expect(result.get(RAIL_KEYS.circuitHeader)).toEqual({ prevKey: railRowKey("b2"), length: 8 + 14 + 15 });
  });

  it("glisser la seule carte du Circuit : le bas du Circuit se relie à l'en-tête à travers sa place", () => {
    const result = links({ inTour: ["i1"], skipped: { id: "i1", height: CARD + 9 + 22 } });
    expect(result.get(RAIL_KEYS.circuitEnd)).toMatchObject({
      prevKey: RAIL_KEYS.circuitHeader,
      length: 9 + CARD + 9 + 22 + 14,
    });
  });
});
