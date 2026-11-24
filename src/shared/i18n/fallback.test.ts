import { describe, expect, it } from "@jest/globals";

import { strings, withFallback } from "./index";
import { frBundle } from "./resources/bundles";

describe("J1 — repli anglais (règle 3 du 23/11/2026)", () => {
  it("complète clé par clé un catalogue partiel par le catalogue de repli", () => {
    const fallback = { a: "A", group: { b: "B", c: "C" }, list: ["x", "y"], fn: (n: number) => `${n}` };
    const merged = withFallback(fallback, { group: { b: "b" } });
    expect(merged.a).toBe("A");
    expect(merged.group).toEqual({ b: "b", c: "C" });
    expect(merged.list).toEqual(["x", "y"]);
    expect(merged.fn(2)).toBe("2");
  });

  it("garde une liste ou une fonction traduite en entier", () => {
    const merged = withFallback({ list: ["x", "y"], fn: () => "en" }, { list: ["z"], fn: () => "fr" });
    expect(merged.list).toEqual(["z"]);
    expect(merged.fn()).toBe("fr");
  });

  it("sert le catalogue français quand le téléphone est en français", () => {
    expect(strings).toBe(frBundle);
  });
});
