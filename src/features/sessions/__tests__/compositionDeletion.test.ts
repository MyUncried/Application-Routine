import { describe, expect, it } from "@jest/globals";

import { CIRCUIT_HEADER_HEIGHT } from "@/features/sessions/CircuitHeader";
import { resolveRemovalShifts, type CompositionDragLayout } from "@/features/sessions/compositionGesture";
import { RAIL_KEYS, railRowKey, railStopKey, resolveRailLinks } from "@/features/sessions/compositionRail";
import { railGeometryFor } from "@/features/sessions/CompositionScreen";

/**
 * PRE-6 story 7.5 (D-437 amendée, recette J6 d-9) : glissement qui suit le fondu d'une carte
 * supprimée — décalages purs (`resolveRemovalShifts`) et rail à travers les places qui se referment.
 */
describe("resolveRemovalShifts (story 7.5)", () => {
  const GAPS = { row: 10, circuitRow: 10, zone: 10, circuit: 12 };
  const layout: CompositionDragLayout = {
    tourTop: 240,
    tourBottom: 500,
    rows: [
      { id: "A", zone: "BEFORE_TOUR", top: 0, height: 70 },
      { id: "B", zone: "BEFORE_TOUR", top: 80, height: 70 },
      { id: "P", zone: "BEFORE_TOUR", top: 160, height: 22 },
      { id: "C", zone: "BEFORE_TOUR", top: 192, height: 70 },
      { id: "X", zone: "IN_TOUR", top: 340, height: 70 },
      { id: "Y", zone: "IN_TOUR", top: 420, height: 70 },
      { id: "Z", zone: "AFTER_TOUR", top: 510, height: 70 },
    ],
  };
  const of = (ids: string[]) => {
    const result = resolveRemovalShifts(layout, new Set(ids), GAPS);
    return { ...result, rows: Object.fromEntries(result.rows) };
  };

  it("carte au milieu d'une zone : ce qui la suit remonte de sa hauteur et d'un écart ; ce qui la précède ne bouge pas", () => {
    expect(of(["B"])).toEqual({
      rows: { P: -80, C: -80, X: -80, Y: -80, Z: -80 },
      circuitTop: -80,
      circuitBottom: -80,
      afterCircuit: -80,
      end: -80,
    });
  });

  it("carte et point retiré : les deux places se referment", () => {
    expect(of(["B", "P"])).toMatchObject({ rows: { C: -80 - 32, X: -112, Z: -112 }, circuitTop: -112, end: -112 });
  });

  it("carte du Circuit : le haut du Circuit reste, son bas remonte avec la suite", () => {
    expect(of(["X"])).toEqual({
      rows: { Y: -80, Z: -80 },
      circuitTop: 0,
      circuitBottom: -80,
      afterCircuit: -80,
      end: -80,
    });
  });

  it("Circuit vidé : l'écart en-tête / liste disparaît avec la première carte, l'écart de liste avec la seconde", () => {
    expect(of(["X", "Y"])).toMatchObject({ rows: { Z: -(70 + 12) - (70 + 10) }, circuitTop: 0, circuitBottom: -162, end: -162 });
  });

  it("zone vidée hors Circuit : la liste et son écart dans le corps disparaissent", () => {
    expect(of(["Z"])).toEqual({ rows: {}, circuitTop: 0, circuitBottom: 0, afterCircuit: 0, end: -80 });
  });
});

describe("resolveRailLinks — plusieurs éléments sortis de la chaîne (story 7.5)", () => {
  it("la carte supprimée et le point retiré : le suivant se relie à travers les deux places", () => {
    const links = resolveRailLinks({
      beforeTour: ["a", { stopPointId: "p" }, "b"],
      inTour: [],
      afterTour: [],
      hasAfterCircuit: false,
      skipped: [
        { key: railRowKey("a"), height: 80 },
        { key: railStopKey("p"), height: 22 },
      ],
      geometry: railGeometryFor(CIRCUIT_HEADER_HEIGHT),
    });
    expect(links.has(railRowKey("a"))).toBe(false);
    expect(links.has(railStopKey("p"))).toBe(false);
    // Écart 8 + carte 80, écart 8 + point 22, écart 8, puis haut du média 8.
    expect(links.get(railRowKey("b"))).toEqual({ prevKey: RAIL_KEYS.start, length: 8 + 80 + 8 + 22 + 8 + 8 });
  });
});
