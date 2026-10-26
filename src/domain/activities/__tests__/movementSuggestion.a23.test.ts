import { describe, expect, it } from "@jest/globals";

import type { Movement } from "@/domain/activities/Movement";
import { movementLevelPosition, variantLevelPosition } from "@/domain/activities/movementSuggestion";

/**
 * PRE-7 story A2.3 (MFN-05) — position de niveau dérivée, singleton masqué. PRE-7 R-5 : la
 * proximité lexicale d'A2.3 (`areMovementNamesClose`, `findCloseMovement`) est remplacée par le
 * score R02, couvert par `movementSearch.r07.test.ts` ; position d'une variante (C02, MFN-07).
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

describe("PRE-7 R-5 — variantLevelPosition (C02, MFN-07 l.371 ; v7 §5 l.53)", () => {
  it("première variante : plus facile → variante 1 sur 2 ; plus difficile → variante 2 sur 2", () => {
    expect(variantLevelPosition(null, "BEFORE_ORIGIN")).toEqual({ rank: 1, total: 2 });
    expect(variantLevelPosition(null, "AFTER_ORIGIN")).toEqual({ rank: 2, total: 2 });
  });

  it("origine 2 sur 3 : avant → 2 sur 4, après → 3 sur 4", () => {
    expect(variantLevelPosition({ rank: 2, total: 3 }, "BEFORE_ORIGIN")).toEqual({ rank: 2, total: 4 });
    expect(variantLevelPosition({ rank: 2, total: 3 }, "AFTER_ORIGIN")).toEqual({ rank: 3, total: 4 });
  });
});
