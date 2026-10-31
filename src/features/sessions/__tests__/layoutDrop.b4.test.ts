import { describe, expect, it } from "@jest/globals";

import type { SessionStructure, StructureStopPointLocation } from "@/domain/sessions/structure";
import { layoutDropCandidates, layoutHeaderKey, layoutItemKey, resolveLayoutDrop, sameLayoutDrop, type LayoutBox } from "@/features/sessions/layoutDrop";

/**
 * PRE-9 (story B.4, COMP §6, D-451) — résolution de la destination d'un glisser dans une disposition
 * générale : emplacements admis selon la nature de l'élément saisi, ordonnée de chaque repère,
 * emplacement le plus proche.
 */

const layout: SessionStructure<string, StructureStopPointLocation> = {
  elements: [
    { kind: "EXERCISE", exercise: "e0" },
    { kind: "CIRCUIT", circuit: { id: "ca", repeatCount: 1, nature: "TOURS", exercises: ["a1", "a2"] } },
    { kind: "CYCLE", cycle: { id: "cy", repeatCount: 2, members: [{ kind: "EXERCISE", exercise: "d1" }, { kind: "CIRCUIT", circuit: { id: "cb", repeatCount: 1, nature: "TOURS", exercises: ["b1"] } }] } },
  ],
  stopPoints: [],
};

const box = (top: number, height: number): LayoutBox => ({ top, height });
const boxes = new Map<string, LayoutBox>([
  [layoutItemKey({ kind: "EXERCISE", id: "e0" }), box(0, 80)],
  [layoutItemKey({ kind: "CIRCUIT", id: "ca" }), box(100, 220)],
  [layoutHeaderKey("CIRCUIT", "ca"), box(114, 18)],
  [layoutItemKey({ kind: "EXERCISE", id: "a1" }), box(141, 80)],
  [layoutItemKey({ kind: "EXERCISE", id: "a2" }), box(230, 80)],
  [layoutItemKey({ kind: "CYCLE", id: "cy" }), box(340, 300)],
  [layoutHeaderKey("CYCLE", "cy"), box(354, 18)],
  [layoutItemKey({ kind: "EXERCISE", id: "d1" }), box(381, 80)],
  [layoutItemKey({ kind: "CIRCUIT", id: "cb" }), box(470, 160)],
  [layoutHeaderKey("CIRCUIT", "cb"), box(484, 18)],
  [layoutItemKey({ kind: "EXERCISE", id: "b1" }), box(511, 80)],
]);
const id = (exercise: string) => exercise;

describe("PRE-9 B.4 — destination d'un glisser (layoutDrop)", () => {
  it("Exercice : emplacements de la Séance, des Circuits et du Cycle, rangs sans l'élément saisi", () => {
    const candidates = layoutDropCandidates(layout, { kind: "EXERCISE", id: "a1" }, boxes, id);
    const kinds = candidates.map((candidate) => `${candidate.container.kind}${"id" in candidate.container ? `:${candidate.container.id}` : ""}@${candidate.index}`);
    expect(kinds).toEqual(["SESSION@0", "SESSION@1", "SESSION@2", "SESSION@3", "CIRCUIT:ca@0", "CIRCUIT:ca@1", "CYCLE:cy@0", "CYCLE:cy@1", "CYCLE:cy@2", "CIRCUIT:cb@0", "CIRCUIT:cb@1"]);
    expect(resolveLayoutDrop(layout, { kind: "EXERCISE", id: "e0" }, 225, boxes, id)).toMatchObject({ container: { kind: "CIRCUIT", id: "ca" }, index: 1, lineY: 225.5 });
    expect(resolveLayoutDrop(layout, { kind: "EXERCISE", id: "e0" }, 595, boxes, id)).toMatchObject({ container: { kind: "CIRCUIT", id: "cb" }, index: 1 });
  });

  it("Circuit : jamais dans un Circuit (D-451) ; Séance et Cycle seulement, son contenu exclu", () => {
    const candidates = layoutDropCandidates(layout, { kind: "CIRCUIT", id: "ca" }, boxes, id);
    expect(candidates.every((candidate) => candidate.container.kind !== "CIRCUIT")).toBe(true);
    expect(resolveLayoutDrop(layout, { kind: "CIRCUIT", id: "ca" }, 440, boxes, id)).toMatchObject({ container: { kind: "CYCLE", id: "cy" }, index: 1 });
  });

  it("Cycle : niveau Séance seulement", () => {
    const candidates = layoutDropCandidates(layout, { kind: "CYCLE", id: "cy" }, boxes, id);
    expect(candidates.every((candidate) => candidate.container.kind === "SESSION")).toBe(true);
    expect(candidates.map((candidate) => candidate.index)).toEqual([0, 1, 2]);
  });

  it("Circuit replié (cartes non mesurées) : sa fin seulement, au milieu de sa boîte", () => {
    const folded = new Map(boxes);
    folded.delete(layoutItemKey({ kind: "EXERCISE", id: "a1" }));
    folded.delete(layoutItemKey({ kind: "EXERCISE", id: "a2" }));
    folded.set(layoutItemKey({ kind: "CIRCUIT", id: "ca" }), box(100, 68));
    const inCa = layoutDropCandidates(layout, { kind: "EXERCISE", id: "e0" }, folded, id).filter(
      (candidate) => candidate.container.kind === "CIRCUIT" && candidate.container.id === "ca",
    );
    expect(inCa).toEqual([{ container: { kind: "CIRCUIT", id: "ca" }, index: 2, lineY: 134 }]);
  });

  it("même destination", () => {
    expect(sameLayoutDrop({ container: { kind: "SESSION" }, index: 1 }, { container: { kind: "SESSION" }, index: 1 })).toBe(true);
    expect(sameLayoutDrop({ container: { kind: "CIRCUIT", id: "a" }, index: 1 }, { container: { kind: "CIRCUIT", id: "b" }, index: 1 })).toBe(false);
    expect(sameLayoutDrop(null, null)).toBe(true);
  });
});
