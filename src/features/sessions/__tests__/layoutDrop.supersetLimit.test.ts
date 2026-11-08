import { describe, expect, it } from "@jest/globals";

import type { SessionStructure, StructureStopPointLocation } from "@/domain/sessions/structure";
import { layoutDropCandidates, layoutHeaderKey, layoutItemKey, resolveLayoutDrop, type LayoutBox } from "@/features/sessions/layoutDrop";

/**
 * Recette du 08/11/2026 au soir — Superset limité (Hermann : « Superset : il est possible dans le circuit de la
 * composition de séance d'ajouter un troisième exercice, ça ne doit pas être autorisé. ») : pendant le glisser, un
 * Superset à deux membres n'offre aucun emplacement à une carte venue d'ailleurs (l'aperçu n'y ouvre aucune place, la
 * dépose se fait à l'emplacement admis le plus proche) ; ses membres s'y réordonnent ; un Point d'arrêt saisi n'est pas
 * concerné.
 */

const layout = (supersetMembers: readonly string[]): SessionStructure<string, StructureStopPointLocation> => ({
  elements: [
    { kind: "EXERCISE", exercise: "e0" },
    { kind: "CIRCUIT", circuit: { id: "ss", repeatCount: 3, nature: "SERIES", exercises: [...supersetMembers], originModel: "SUPERSET" } },
    { kind: "EXERCISE", exercise: "e9" },
  ],
  stopPoints: [],
});

const box = (top: number, height: number): LayoutBox => ({ top, height });
const boxes = new Map<string, LayoutBox>([
  [layoutItemKey({ kind: "EXERCISE", id: "e0" }), box(0, 80)],
  [layoutItemKey({ kind: "CIRCUIT", id: "ss" }), box(100, 220)],
  [layoutHeaderKey("CIRCUIT", "ss"), box(114, 18)],
  [layoutItemKey({ kind: "EXERCISE", id: "a1" }), box(141, 80)],
  [layoutItemKey({ kind: "EXERCISE", id: "a2" }), box(230, 80)],
  [layoutItemKey({ kind: "EXERCISE", id: "e9" }), box(340, 80)],
]);
const id = (exercise: string) => exercise;
const keys = (candidates: readonly { container: { kind: string; id?: string }; index: number }[]) =>
  candidates.map((candidate) => `${candidate.container.kind}${candidate.container.id === undefined ? "" : `:${candidate.container.id}`}@${candidate.index}`);

describe("Superset limité — emplacements du glisser (layoutDrop)", () => {
  it("carte venue de la Séance : aucun emplacement dans le Superset à deux", () => {
    expect(keys(layoutDropCandidates(layout(["a1", "a2"]), { kind: "EXERCISE", id: "e0" }, boxes, id))).toEqual(["SESSION@0", "SESSION@1", "SESSION@2"]);
    // Lâchée entre les deux membres : elle va à l'emplacement admis le plus proche, hors du Superset.
    expect(resolveLayoutDrop(layout(["a1", "a2"]), { kind: "EXERCISE", id: "e9" }, 225, boxes, id)?.container).toEqual({ kind: "SESSION" });
  });

  it("Superset replié (cartes non mesurées) : sa fin n'est pas proposée non plus", () => {
    const folded = new Map(boxes);
    folded.delete(layoutItemKey({ kind: "EXERCISE", id: "a1" }));
    folded.delete(layoutItemKey({ kind: "EXERCISE", id: "a2" }));
    folded.set(layoutItemKey({ kind: "CIRCUIT", id: "ss" }), box(100, 68));
    expect(keys(layoutDropCandidates(layout(["a1", "a2"]), { kind: "EXERCISE", id: "e0" }, folded, id)).some((key) => key.startsWith("CIRCUIT"))).toBe(false);
  });

  it("membre du Superset : ses emplacements dans le Superset restent offerts (réordonnancement)", () => {
    expect(keys(layoutDropCandidates(layout(["a1", "a2"]), { kind: "EXERCISE", id: "a1" }, boxes, id))).toEqual(
      expect.arrayContaining(["CIRCUIT:ss@0", "CIRCUIT:ss@1"]),
    );
  });

  it("Superset à un membre : emplacements offerts (un second Exercice y entre)", () => {
    expect(keys(layoutDropCandidates(layout(["a1"]), { kind: "EXERCISE", id: "e0" }, boxes, id))).toEqual(expect.arrayContaining(["CIRCUIT:ss@0", "CIRCUIT:ss@1"]));
  });

  it("Point d'arrêt saisi (repère fictif absent de la disposition) : emplacements du Superset conservés", () => {
    expect(keys(layoutDropCandidates(layout(["a1", "a2"]), { kind: "EXERCISE", id: "\u0000point-d-arret" }, boxes, id))).toEqual(
      expect.arrayContaining(["CIRCUIT:ss@0", "CIRCUIT:ss@1", "CIRCUIT:ss@2"]),
    );
  });
});

/**
 * Réponse de Hermann du 08/11/2026 (« Superset : dans la composition on limite à deux exercices aussi. ») : un membre
 * d'un Superset à deux n'a d'emplacements que dans ce Superset — lâchée ailleurs, la carte y revient.
 */
describe("Superset limité — minimum de deux pendant le glisser", () => {
  it("membre d'un Superset à deux : emplacements du Superset seulement", () => {
    expect(keys(layoutDropCandidates(layout(["a1", "a2"]), { kind: "EXERCISE", id: "a1" }, boxes, id))).toEqual(["CIRCUIT:ss@0", "CIRCUIT:ss@1"]);
    // Lâchée tout en haut ou tout en bas : la destination reste dans le Superset.
    expect(resolveLayoutDrop(layout(["a1", "a2"]), { kind: "EXERCISE", id: "a2" }, 0, boxes, id)?.container).toEqual({ kind: "CIRCUIT", id: "ss" });
    expect(resolveLayoutDrop(layout(["a1", "a2"]), { kind: "EXERCISE", id: "a1" }, 400, boxes, id)?.container).toEqual({ kind: "CIRCUIT", id: "ss" });
  });

  it("Superset existant à trois membres : un membre peut encore en sortir (réduction jusqu'à deux)", () => {
    const three = new Map(boxes);
    three.set(layoutItemKey({ kind: "EXERCISE", id: "a3" }), box(312, 20));
    expect(keys(layoutDropCandidates(layout(["a1", "a2", "a3"]), { kind: "EXERCISE", id: "a3" }, three, id))).toEqual(expect.arrayContaining(["SESSION@0", "SESSION@2"]));
  });
});
