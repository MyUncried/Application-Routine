import { describe, expect, it } from "@jest/globals";

import {
  addMovementPhase,
  moveMovementPhase,
  removeMovementPhase,
  renameMovementPhase,
  savableMovementPhases,
} from "@/domain/activities/movementPhaseList";

/** PRE-8 story B.2 (MVT-09) : structure des phases du Mouvement, identités stables, compteur monotone. */
describe("movementPhaseList", () => {
  const base = { phases: [{ id: 1, label: "Descente" }, { id: 2, label: "Saut" }], nextPhaseId: 3 };

  it("ajoute avec l'identité suivante et ne réalloue jamais une identité retirée", () => {
    const removed = removeMovementPhase(base, 2);
    expect(removed).toEqual({ phases: [{ id: 1, label: "Descente" }], nextPhaseId: 3 });
    expect(addMovementPhase(removed, "Réception")).toEqual({
      phases: [{ id: 1, label: "Descente" }, { id: 3, label: "Réception" }],
      nextPhaseId: 4,
    });
  });

  it("renomme et déplace sans changer les identités ; rang borné", () => {
    expect(renameMovementPhase(base, 2, "Saut groupé").phases[1]).toEqual({ id: 2, label: "Saut groupé" });
    expect(moveMovementPhase(base, 2, 0).phases.map((phase) => phase.id)).toEqual([2, 1]);
    expect(moveMovementPhase(base, 1, 99).phases.map((phase) => phase.id)).toEqual([2, 1]);
    expect(moveMovementPhase(base, 9, 0)).toBe(base);
  });

  it("n'enregistre que des libellés non vides, rognés, dans l'ordre", () => {
    expect(savableMovementPhases([{ id: 1, label: "  Descente " }, { id: 4, label: "   " }, { id: 2, label: "Saut" }])).toEqual([
      { id: 1, label: "Descente" },
      { id: 2, label: "Saut" },
    ]);
  });
});
