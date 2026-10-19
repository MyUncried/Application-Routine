import { describe, expect, it } from "@jest/globals";

import { CADENCE_OPTIONS, CADENCE_OPTION_SECONDS, cadenceOptionOf } from "@/features/activities/cadenceOption";

describe("cadenceOptionOf — PRE-5 story 2.5 (AC3, AD-24)", () => {
  it("PRE5-2.5/AC3 — 0 → Sans ; 1, 2, 5 → leur option ; toute autre valeur → Autre ; `null` → aucune option", () => {
    expect(cadenceOptionOf(0)).toBe("NONE");
    expect(cadenceOptionOf(1)).toBe("1");
    expect(cadenceOptionOf(2)).toBe("2");
    expect(cadenceOptionOf(5)).toBe("5");
    for (const other of [3, 4, 6, 7, 10, 11, -1]) {
      expect({ other, option: cadenceOptionOf(other) }).toEqual({ other, option: "OTHER" });
    }
    expect(cadenceOptionOf(null)).toBeNull();
  });

  it("PRE5-2.5/AC3 — ordre Autre / 5 s / 2 s / 1 s / Sans ; chaque option fixe écrit la valeur qu'elle reflète", () => {
    expect(CADENCE_OPTIONS).toEqual(["OTHER", "5", "2", "1", "NONE"]);
    for (const [option, seconds] of Object.entries(CADENCE_OPTION_SECONDS)) {
      expect(cadenceOptionOf(seconds)).toBe(option);
    }
  });

  it("PRE5-2.5/AC3 — fonction pure, sans mémoire : Sans puis Autre ne restaure aucune valeur personnalisée", () => {
    expect(cadenceOptionOf(7)).toBe("OTHER");
    expect(cadenceOptionOf(0)).toBe("NONE");
    expect(cadenceOptionOf(7)).toBe("OTHER");
    expect(cadenceOptionOf(0)).toBe("NONE");
  });
});
