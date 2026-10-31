import { describe, expect, it } from "@jest/globals";

import type { SessionStructure, StructureStopPointLocation } from "@/domain/sessions/structure";
import { layoutDropCandidates, layoutHeaderKey, layoutItemKey, layoutStopBoxKey, resolveLayoutDrop, sameLayoutDrop, type LayoutBox } from "@/features/sessions/layoutDrop";

/**
 * PRE-9 — recette iPhone n° 2 du 31/10/2026, lot 3 (b6-deplacer, Hermann) : « Exercice dans un cycle,
 * avec un point d'arrêt en début de cycle : le déplacement de l'exercice avant le point d'arrêt, mais
 * dans le cycle, est interdit. » — un rang qui porte des Points offre deux emplacements : avant eux
 * (au-dessus du premier) et après eux (sous le dernier, `afterStopPoints`).
 */

// e0, Cycle cy [P, e1], e9 — boîtes du contenu défilant.
const layout: SessionStructure<string, StructureStopPointLocation> = {
  elements: [
    { kind: "EXERCISE", exercise: "e0" },
    { kind: "CYCLE", cycle: { id: "cy", repeatCount: 1, members: [{ kind: "EXERCISE", exercise: "e1" }] } },
    { kind: "EXERCISE", exercise: "e9" },
  ],
  stopPoints: [{ circuitId: null, cycleId: "cy", position: 0 }],
};
const box = (top: number, height: number): LayoutBox => ({ top, height });
const boxes = new Map<string, LayoutBox>([
  [layoutItemKey({ kind: "EXERCISE", id: "e0" }), box(0, 80)],
  [layoutItemKey({ kind: "CYCLE", id: "cy" }), box(88, 160)],
  [layoutHeaderKey("CYCLE", "cy"), box(102, 18)],
  [layoutStopBoxKey("p"), box(129, 22)],
  [layoutItemKey({ kind: "EXERCISE", id: "e1" }), box(160, 80)],
  [layoutItemKey({ kind: "EXERCISE", id: "e9" }), box(256, 80)],
]);
const id = (exercise: string) => exercise;
const points = [{ container: { kind: "CYCLE" as const, id: "cy" }, position: 0, id: "p" }];

describe("Recette n° 2 (b6-deplacer) — emplacements avant et après un Point d'arrêt", () => {
  it("le seul Exercice du Cycle : tête du Cycle (avant le Point) et sa propre place (après le Point)", () => {
    const candidates = layoutDropCandidates(layout, { kind: "EXERCISE", id: "e1" }, boxes, id, () => 9, points).filter(
      (candidate) => candidate.container.kind === "CYCLE",
    );
    expect(candidates).toEqual([
      // Avant le Point : sous l'en-tête ; tout ce qui suit (le Point compris) descend.
      expect.objectContaining({ index: 0, lineY: 124, insertY: 124 }),
      // Après le Point : sous sa rangée ; le Point ne bouge pas.
      expect.objectContaining({ index: 0, afterStopPoints: true, lineY: 151 + 8, insertY: 151.5 }),
    ]);
    expect(candidates[0]!.afterStopPoints).toBeUndefined();
  });

  it("le doigt au-dessus du Point vise « avant », au-dessous « après » ; sans Points : comportement de B.4", () => {
    const above = resolveLayoutDrop(layout, { kind: "EXERCISE", id: "e1" }, 125, boxes, id, () => 9, points);
    const below = resolveLayoutDrop(layout, { kind: "EXERCISE", id: "e1" }, 160, boxes, id, () => 9, points);
    expect(above).toMatchObject({ container: { kind: "CYCLE", id: "cy" }, index: 0 });
    expect(above!.afterStopPoints).toBeUndefined();
    expect(below).toMatchObject({ container: { kind: "CYCLE", id: "cy" }, index: 0, afterStopPoints: true });
    expect(sameLayoutDrop(above, below)).toBe(false);
    const legacy = layoutDropCandidates(layout, { kind: "EXERCISE", id: "e1" }, boxes, id, () => 9);
    expect(legacy.some((candidate) => candidate.afterStopPoints === true)).toBe(false);
  });

  it("entre deux membres : l'emplacement « avant » est entre le membre et le Point, « après » entre le Point et le suivant", () => {
    const session = layoutDropCandidates(
      layout,
      { kind: "EXERCISE", id: "e9" },
      new Map([...boxes, [layoutStopBoxKey("q"), box(84, 0)]]),
      id,
      () => 8,
      [...points, { container: { kind: "SESSION" }, position: 1, id: "q" }],
    ).filter((candidate) => candidate.container.kind === "SESSION" && candidate.index === 1);
    expect(session.map((candidate) => candidate.afterStopPoints === true)).toEqual([false, true]);
    expect(session[0]!.lineY).toBeLessThanOrEqual(84);
    expect(session[1]!.lineY).toBeGreaterThanOrEqual(84);
  });
});
