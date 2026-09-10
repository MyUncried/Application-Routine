import { describe, expect, it } from "@jest/globals";

import { findCategoryMatch } from "@/domain/categories/matching";
import { canonicalCategoryKey } from "@/domain/categories/validation";

describe("findCategoryMatch", () => {
  const candidates = [
    { id: "cardio", canonicalKey: canonicalCategoryKey("Cardio") },
    { id: "mobilite", canonicalKey: canonicalCategoryKey("Mobilité") },
  ];

  it("returns null when no candidate matches", () => {
    expect(findCategoryMatch(candidates, "Coordination")).toBeNull();
  });

  it("matches regardless of case, diacritics or spacing (D-106)", () => {
    expect(findCategoryMatch(candidates, "  cardio  ")).toEqual(candidates[0]);
    expect(findCategoryMatch(candidates, "MOBILITE")).toEqual(candidates[1]);
    expect(findCategoryMatch(candidates, "mobilité")).toEqual(candidates[1]);
  });

  it("returns null on an empty candidate list", () => {
    expect(findCategoryMatch([], "Cardio")).toBeNull();
  });
});
