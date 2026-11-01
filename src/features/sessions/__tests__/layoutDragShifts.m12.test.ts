import { describe, expect, it } from "@jest/globals";

import type { SessionStructure, StructureStopPointLocation } from "@/domain/sessions/structure";
import { layoutDropCandidates, layoutItemKey, resolveLayoutDrop, type LayoutBox } from "@/features/sessions/layoutDrop";
import { layoutEdgeShiftKey, resolveDropOverCollapsedCircuits } from "@/features/sessions/layoutDragShifts";

/**
 * Contre-recette du 01/11/2026 (m12-levee, Hermann : « lorsqu'on met une carte sur une circuit replié,
 * il a tendance à fuir en bas ou en haut avant qu'on arrive vraiment à poser la carte dessus ») — un
 * Circuit replié est visé tel qu'il est affiché (translations de ses bords), jamais à sa place d'origine.
 */

// e0, Circuit c replié [e1, e2], e9 — boîtes du contenu défilant ; e0 saisi.
const layout: SessionStructure<string, StructureStopPointLocation> = {
  elements: [
    { kind: "EXERCISE", exercise: "e0" },
    { kind: "CIRCUIT", circuit: { id: "c", nature: "STANDARD", repeatCount: 2, exercises: ["e1", "e2"] } },
    { kind: "EXERCISE", exercise: "e9" },
  ],
  stopPoints: [],
} as unknown as SessionStructure<string, StructureStopPointLocation>;
const box = (top: number, height: number): LayoutBox => ({ top, height });
const boxes = new Map<string, LayoutBox>([
  [layoutItemKey({ kind: "EXERCISE", id: "e0" }), box(0, 80)],
  [layoutItemKey({ kind: "CIRCUIT", id: "c" }), box(88, 68)],
  [layoutItemKey({ kind: "EXERCISE", id: "e9" }), box(164, 80)],
]);
const id = (exercise: string) => exercise;
const source = { kind: "EXERCISE" as const, id: "e0" };
const candidates = layoutDropCandidates(layout, source, boxes, id, () => 8);
// Place de e0 refermée : le Circuit et e9 remontent de 88.
const closed = new Map<string, number>([
  [layoutEdgeShiftKey("CIRCUIT", "c", "top"), -88],
  [layoutEdgeShiftKey("CIRCUIT", "c", "bottom"), -88],
  [layoutItemKey({ kind: "EXERCISE", id: "e9" }), -88],
]);

describe("Contre-recette du 01/11 (m12-levee) — visée d'un Circuit replié tel qu'il est affiché", () => {
  it("le doigt sur le Circuit affiché (remonté) le vise, là où l'ancienne visée retenait la tête de la Séance", () => {
    expect(resolveLayoutDrop(layout, source, 40, boxes, id, () => 8)?.container).toEqual({ kind: "SESSION" });
    expect(resolveDropOverCollapsedCircuits(candidates, 40, ["c"], boxes, closed)).toEqual(
      expect.objectContaining({ container: { kind: "CIRCUIT", id: "c" }, index: 2 }),
    );
  });

  it("le doigt à la place d'origine du Circuit, hors de lui à l'écran, ne le vise pas", () => {
    expect(resolveLayoutDrop(layout, source, 122, boxes, id, () => 8)?.container).toEqual({ kind: "CIRCUIT", id: "c" });
    expect(resolveDropOverCollapsedCircuits(candidates, 122, ["c"], boxes, closed)?.container).toEqual({ kind: "SESSION" });
  });

  it("sans translation, le Circuit est visé sur toute sa hauteur ; hors de lui, l'emplacement le plus proche", () => {
    expect(resolveDropOverCollapsedCircuits(candidates, 90, ["c"], boxes, null)?.container).toEqual({ kind: "CIRCUIT", id: "c" });
    expect(resolveDropOverCollapsedCircuits(candidates, 154, ["c"], boxes, null)?.container).toEqual({ kind: "CIRCUIT", id: "c" });
    expect(resolveDropOverCollapsedCircuits(candidates, 200, ["c"], boxes, null)?.container).toEqual({ kind: "SESSION" });
  });
});
