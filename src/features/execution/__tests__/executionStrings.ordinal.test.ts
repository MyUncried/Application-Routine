import { describe, expect, it } from "@jest/globals";

import { executionStrings, ordinalSuffix } from "../executionStrings";

describe("ordinalSuffix (recette du 13/11/2026)", () => {
  it("1er, 2d s'il n'y en a que deux, 2e s'il y a un troisième, puis 3e, 4e", () => {
    expect(ordinalSuffix(1, 2)).toBe("er");
    expect(ordinalSuffix(2, 2)).toBe("d");
    expect(ordinalSuffix(2, 3)).toBe("e");
    expect(ordinalSuffix(3, 4)).toBe("e");
    expect(ordinalSuffix(4, 4)).toBe("e");
  });

  it("côtés : « 1er côté », « 2d côté »", () => {
    expect(executionStrings.side(1)).toMatchObject({ rank: "1", suffix: "er", label: "côté", spoken: "1er côté" });
    expect(executionStrings.side(2)).toMatchObject({ rank: "2", suffix: "d", spoken: "2d côté" });
  });
});
