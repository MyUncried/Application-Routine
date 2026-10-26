import { describe, expect, it } from "@jest/globals";

import type { Movement } from "@/domain/activities/Movement";
import { areMovementNamesClose, findCloseMovement, movementLevelPosition } from "@/domain/activities/movementSuggestion";

/**
 * PRE-7 story A2.3 (MFN-05, MFN-06) — proximité LEXICALE des noms de geste (aucune détection
 * sémantique) et position de niveau dérivée, singleton masqué.
 */

function movement(id: string, name: string, overrides: Partial<Movement> = {}): Movement {
  return {
    id,
    name,
    description: null,
    media: [],
    categoryId: "cardio",
    bodyZoneIds: ["cuisses"],
    phases: [],
    nextPhaseId: 1,
    aliases: [],
    levelGroup: null,
    ...overrides,
  };
}

describe("PRE-7 A2.3 — areMovementNamesClose", () => {
  it("égalité normalisée : casse, accents et espaces neutralisés", () => {
    expect(areMovementNamesClose("  Fentes   AVANT ", "fentes avant")).toBe(true);
    expect(areMovementNamesClose("Étirement", "etirement")).toBe(true);
  });

  it("suite de mots entiers contenue dans l'autre nom, dans les deux sens", () => {
    expect(areMovementNamesClose("Squats assistés", "Squats")).toBe(true);
    expect(areMovementNamesClose("Squats", "Squats sautés")).toBe(true);
    expect(areMovementNamesClose("Pompes sur les genoux", "sur les genoux")).toBe(true);
    // Revue : tirets et apostrophes séparent les mots.
    expect(areMovementNamesClose("Squats-sautés", "Squats")).toBe(true);
    expect(areMovementNamesClose("Montée d'escalier", "escalier")).toBe(true);
  });

  it("fragment de mot, mots non contigus ou nom vide : pas proche", () => {
    expect(areMovementNamesClose("Squ", "Squats")).toBe(false);
    expect(areMovementNamesClose("Pompes genoux", "Pompes sur les genoux")).toBe(false);
    expect(areMovementNamesClose("   ", "Squats")).toBe(false);
    expect(areMovementNamesClose("Gainage", "Squats")).toBe(false);
  });
});

describe("PRE-7 A2.3 — findCloseMovement", () => {
  const squats = movement("m-2", "Squats");
  const sautes = movement("m-3", "Squats sautés");
  const fentes = movement("m-4", "Fentes avant");

  it("nom égal d'abord, puis le plus petit écart de longueur, puis nom, puis identifiant", () => {
    expect(findCloseMovement("squats", [sautes, squats, fentes])?.id).toBe("m-2");
    expect(findCloseMovement("Squats sautés lents", [squats, sautes])?.id).toBe("m-3");
    const twin = movement("m-1", "Squats");
    expect(findCloseMovement("Squats", [squats, twin])?.id).toBe("m-1");
  });

  it("aucun nom proche : null ; gestes déjà proposés écartés", () => {
    expect(findCloseMovement("Gainage", [squats, fentes])).toBeNull();
    expect(findCloseMovement("Squats", [squats, sautes], new Set(["m-2"]))?.id).toBe("m-3");
    expect(findCloseMovement("Squats", [squats], new Set(["m-2"]))).toBeNull();
  });
});

describe("PRE-7 A2.3 — movementLevelPosition (MFN-05)", () => {
  const group = (sortKey: number) => ({ groupId: "g-1", sortKey });
  const a = movement("a", "A", { levelGroup: group(0) });
  const b = movement("b", "B", { levelGroup: group(1) });
  const c = movement("c", "C", { levelGroup: group(2) });

  it("rang et total dérivés de l'ordre des membres", () => {
    expect(movementLevelPosition(b, [a, b, c])).toEqual({ rank: 2, total: 3 });
    expect(movementLevelPosition(a, [a, b, c])).toEqual({ rank: 1, total: 3 });
  });

  it("sans groupe, singleton ou absent des membres : masqué (jamais un faux « Niveau 1 »)", () => {
    expect(movementLevelPosition(movement("x", "X"), [a, b])).toBeNull();
    expect(movementLevelPosition(a, [a])).toBeNull();
    expect(movementLevelPosition(c, [a, b])).toBeNull();
  });
});
