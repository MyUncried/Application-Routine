import { describe, expect, it } from "@jest/globals";

import { CADENCE_OPTIONS, CADENCE_OPTION_SECONDS, cadenceOptionOf } from "@/features/activities/cadenceOption";

describe("cadenceOptionOf — PRE-5 story 2.5 (AC3, AD-24) ; recette du 19/10 (RC-10)", () => {
  it("PRE5-2.5/AC3, RC-10 — 0 → Sans ; 1 → 1 s ; toute autre valeur (2 et 5 compris) → Autre ; `null` → aucune option", () => {
    expect(cadenceOptionOf(0)).toBe("NONE");
    expect(cadenceOptionOf(1)).toBe("1");
    for (const other of [2, 3, 4, 5, 6, 7, 10, 11, -1]) {
      expect({ other, option: cadenceOptionOf(other) }).toEqual({ other, option: "OTHER" });
    }
    expect(cadenceOptionOf(null)).toBeNull();
  });

  it("PRE5-2.5/AC3, RC-10 — ordre Autre / 1 s / Sans ; chaque option fixe écrit la valeur qu'elle reflète", () => {
    expect(CADENCE_OPTIONS).toEqual(["OTHER", "1", "NONE"]);
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
