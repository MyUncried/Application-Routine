import { describe, expect, it } from "@jest/globals";

import type { SessionStructure, StructureStopPointLocation } from "@/domain/sessions/structure";
import {
  circuitEndDrop,
  hoveredCollapsedCircuit,
  layoutDropCandidates,
  layoutHeaderKey,
  layoutItemKey,
  layoutStopBoxKey,
  resolveLayoutDrop,
  sameLayoutDrop,
  type LayoutBox,
} from "@/features/sessions/layoutDrop";

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

/**
 * Recette iPhone n° 2 du 31/10/2026 (Hermann : « L'arrêt d'une carte sur un circuit replié doit
 * l'ouvrir ») — Circuit replié visé par la destination.
 */
describe("hoveredCollapsedCircuit — arrêt sur un Circuit replié", () => {
  const collapsed = new Set(["cb"]);
  const isCollapsed = (id: string) => collapsed.has(id);
  it("destination dans un Circuit replié (sa fin, au niveau Séance ou dans un Cycle) : ce Circuit", () => {
    expect(hoveredCollapsedCircuit({ container: { kind: "CIRCUIT", id: "cb" }, index: 1 }, isCollapsed)).toBe("cb");
  });
  it("Circuit déployé, Cycle, niveau Séance ou aucune destination : null", () => {
    expect(hoveredCollapsedCircuit({ container: { kind: "CIRCUIT", id: "ca" }, index: 0 }, isCollapsed)).toBeNull();
    expect(hoveredCollapsedCircuit({ container: { kind: "CYCLE", id: "cb" }, index: 0 }, isCollapsed)).toBeNull();
    expect(hoveredCollapsedCircuit({ container: { kind: "SESSION" }, index: 2 }, isCollapsed)).toBeNull();
    expect(hoveredCollapsedCircuit(null, isCollapsed)).toBeNull();
  });
});

/**
 * Contre-recette n° 3 du 31/10/2026 (b6-deplacer, Hermann : « Exercice dans un cycle / un circuit avec
 * un point d'arrêt en début de cycle / circuit : le déplacement de l'exercice avant le point d'arrêt est
 * interdit. Par contre, le déplacement du point d'arrêt après l'exercice à la fin du cycle / circuit est
 * autorisée. ») — Circuit `[P, a1]`, a1 saisi : seul membre, le Circuit n'offrait que sa fin (milieu de sa
 * boîte) ; « au-dessus du Point » visait la Séance (a1 sorti du Circuit, Circuit et Point retirés).
 */
describe("Contre-recette n° 3 (b6-deplacer) — seul Exercice d'un Circuit qui porte un Point", () => {
  const circuitLayout: SessionStructure<string, StructureStopPointLocation> = {
    elements: [
      { kind: "EXERCISE", exercise: "e0" },
      { kind: "CIRCUIT", circuit: { id: "ca", repeatCount: 2, nature: "TOURS", exercises: ["a1"] } },
      { kind: "EXERCISE", exercise: "e9" },
    ],
    stopPoints: [{ circuitId: "ca", position: 0 }],
  };
  const circuitBoxes = new Map<string, LayoutBox>([
    [layoutItemKey({ kind: "EXERCISE", id: "e0" }), box(0, 80)],
    [layoutItemKey({ kind: "CIRCUIT", id: "ca" }), box(100, 160)],
    [layoutHeaderKey("CIRCUIT", "ca"), box(114, 18)],
    [layoutStopBoxKey("p"), box(141, 30)],
    [layoutItemKey({ kind: "EXERCISE", id: "a1" }), box(180, 80)],
    [layoutItemKey({ kind: "EXERCISE", id: "e9" }), box(280, 80)],
  ]);
  const circuitPoints = [{ container: { kind: "CIRCUIT" as const, id: "ca" }, position: 0, id: "p" }];
  const a1 = { kind: "EXERCISE" as const, id: "a1" };

  it("tête du Circuit (avant le Point) et sa propre place (après le Point), comme dans un Cycle", () => {
    const candidates = layoutDropCandidates(circuitLayout, a1, circuitBoxes, id, () => 9, circuitPoints).filter(
      (candidate) => candidate.container.kind === "CIRCUIT",
    );
    expect(candidates).toEqual([
      expect.objectContaining({ index: 0, lineY: 136, insertY: 136 }),
      expect.objectContaining({ index: 0, afterStopPoints: true, lineY: 171 + 8, insertY: 171.5 }),
    ]);
    expect(candidates[0]!.afterStopPoints).toBeUndefined();
    // Doigt au-dessus du Point : avant lui, dans le Circuit ; sur la carte : sa place.
    expect(resolveLayoutDrop(circuitLayout, a1, 137, circuitBoxes, id, () => 9, circuitPoints)).toMatchObject({
      container: { kind: "CIRCUIT", id: "ca" },
      index: 0,
    });
    expect(resolveLayoutDrop(circuitLayout, a1, 220, circuitBoxes, id, () => 9, circuitPoints)).toMatchObject({
      container: { kind: "CIRCUIT", id: "ca" },
      index: 0,
      afterStopPoints: true,
    });
  });

  it("sans Point dans le Circuit : fin seulement, au milieu de sa boîte (inchangé)", () => {
    const candidates = layoutDropCandidates(circuitLayout, a1, circuitBoxes, id, () => 9).filter(
      (candidate) => candidate.container.kind === "CIRCUIT",
    );
    expect(candidates).toEqual([expect.objectContaining({ index: 0, lineY: 180, insertY: 259.5 })]);
  });

  it("Circuit replié ou non mesuré : fin seulement (inchangé)", () => {
    const collapsed = new Map(circuitBoxes);
    collapsed.delete(layoutItemKey(a1));
    const candidates = layoutDropCandidates(circuitLayout, { kind: "EXERCISE", id: "e9" }, collapsed, id, () => 9, circuitPoints).filter(
      (candidate) => candidate.container.kind === "CIRCUIT",
    );
    expect(candidates).toEqual([expect.objectContaining({ index: 1, lineY: 180 })]);
  });
});

describe("Contre-recette n° 3 (cr4-replie) — fin du Circuit qui se déploie", () => {
  it("la fin du Circuit (dernier rang, avant ses Points de fin) ; aucune : null", () => {
    const end = { container: { kind: "CIRCUIT" as const, id: "ca" }, index: 2, lineY: 0, insertY: 0, insertTop: 0 };
    const candidates = [
      { container: { kind: "SESSION" as const }, index: 3, lineY: 0, insertY: 0, insertTop: 0 },
      { container: { kind: "CIRCUIT" as const, id: "ca" }, index: 0, lineY: 0, insertY: 0, insertTop: 0 },
      end,
      { ...end, afterStopPoints: true },
      { container: { kind: "CIRCUIT" as const, id: "cb" }, index: 5, lineY: 0, insertY: 0, insertTop: 0 },
    ];
    expect(circuitEndDrop(candidates, "ca")).toBe(end);
    expect(circuitEndDrop(candidates, "cz")).toBeNull();
  });
});
