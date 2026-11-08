import { describe, expect, it } from "@jest/globals";

import type { CircuitRole } from "@/domain/sessions/formats/carriers";
import type { SessionStructure, StructureStopPointLocation } from "@/domain/sessions/structure";
import { layoutDropCandidates, layoutHeaderKey, layoutItemKey, type LayoutBox } from "@/features/sessions/layoutDrop";

/**
 * Recette iPhone du 07/11/2026 (f4-role, KO, Hermann : « Deux Buy In ou Buy out : on doit pouvoir les déplacer pour inverser
 * l'ordre des buy in ou l'ordre des buy out. ») — l'aperçu du glisser offre les places admises par le déplacement appliqué :
 * réordonnancement à l'intérieur d'une zone (MAJ 04/11/2026 §6 bis 2), jamais d'une zone à l'autre.
 */

const ROLES: Readonly<Record<string, CircuitRole>> = { i1: "BUY_IN", i2: "BUY_IN", t1: "TOUR", t2: "TOUR", o1: "BUY_OUT", o2: "BUY_OUT" };
const members = ["i1", "i2", "t1", "t2", "o1", "o2"];
const layout = {
  elements: [{ kind: "CIRCUIT", circuit: { id: "ft", repeatCount: 3, nature: "TOURS", format: { key: "FOR_TIME", settings: {} }, exercises: members } }],
  stopPoints: [],
} as unknown as SessionStructure<string, StructureStopPointLocation>;

const box = (top: number, height: number): LayoutBox => ({ top, height });
const boxes = new Map<string, LayoutBox>([
  [layoutItemKey({ kind: "CIRCUIT", id: "ft" }), box(0, 700)],
  [layoutHeaderKey("CIRCUIT", "ft"), box(10, 18)],
  ...members.map((member, index) => [layoutItemKey({ kind: "EXERCISE", id: member }), box(40 + index * 100, 80)] as const),
]);
const id = (exercise: string) => exercise;
const fixed = (exercise: string) => ROLES[exercise] !== "TOUR";
const roleOf = (exercise: string) => ROLES[exercise] ?? "TOUR";
const placesInCircuit = (source: string) =>
  layoutDropCandidates(layout, { kind: "EXERCISE", id: source }, boxes, id, undefined, [], fixed, roleOf)
    .filter((candidate) => candidate.container.kind === "CIRCUIT")
    .map((candidate) => candidate.index);

describe("f4-role (07/11/2026) — deux buy-in ou deux buy-out se réordonnent entre eux", () => {
  it("second buy-in : peut passer devant le premier, jamais dans la boucle", () => {
    expect(placesInCircuit("i2")).toEqual([0, 1]);
  });

  it("premier buy-out : peut passer après le second, jamais dans la boucle", () => {
    expect(placesInCircuit("o1")).toEqual([4, 5]);
  });

  it("membre de la boucle : ni avant les buy-in, ni après les buy-out", () => {
    expect(placesInCircuit("t1")).toEqual([2, 3]);
  });

  it("sans Rôles fournis : règle positionnelle d'origine (le second buy-in ne passe pas en tête)", () => {
    const places = layoutDropCandidates(layout, { kind: "EXERCISE", id: "i2" }, boxes, id, undefined, [], fixed)
      .filter((candidate) => candidate.container.kind === "CIRCUIT")
      .map((candidate) => candidate.index);
    expect(places).not.toContain(0);
  });
});
