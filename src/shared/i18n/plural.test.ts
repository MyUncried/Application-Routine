import { describe, expect, it } from "@jest/globals";

import { pluralCategory, pluralOf } from "./plural";

describe("J1 — accords par langue", () => {
  it("français : 0 et 1 au singulier", () => {
    expect([0, 1, 2, 10].map((n) => pluralCategory(n, "fr"))).toEqual(["one", "one", "other", "other"]);
  });

  it("anglais : seul 1 au singulier", () => {
    expect([0, 1, 2, 10].map((n) => pluralCategory(n, "en"))).toEqual(["other", "one", "other", "other"]);
  });

  it("choisit la forme selon la langue de l'interface (français sous Jest)", () => {
    expect(pluralOf(0, { one: "série", other: "séries" })).toBe("série");
    expect(pluralOf(3, { one: "série", other: "séries" })).toBe("séries");
  });
});
