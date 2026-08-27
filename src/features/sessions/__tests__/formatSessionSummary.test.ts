import { describe, expect, it } from "@jest/globals";

import {
  formatActivityCount,
  formatEstimatedDuration,
  formatTourCount,
} from "@/features/sessions/formatSessionSummary";

describe("formatActivityCount", () => {
  it("uses the singular form for exactly one activity", () => {
    expect(formatActivityCount(1)).toBe("1 activité");
  });

  it("uses the plural form for zero activities", () => {
    expect(formatActivityCount(0)).toBe("0 activités");
  });

  it("uses the plural form for more than one activity", () => {
    expect(formatActivityCount(2)).toBe("2 activités");
    expect(formatActivityCount(5)).toBe("5 activités");
  });
});

describe("formatTourCount", () => {
  it("uses the singular form for exactly one tour", () => {
    expect(formatTourCount(1)).toBe("1 tour");
  });

  it("uses the plural form for zero tours", () => {
    expect(formatTourCount(0)).toBe("0 tours");
  });

  it("uses the plural form for more than one tour", () => {
    expect(formatTourCount(2)).toBe("2 tours");
    expect(formatTourCount(4)).toBe("4 tours");
  });
});

describe("formatEstimatedDuration", () => {
  // Arbitrage explicite (voir T01-S06-rapport-implementation-catalogue-seances.md) :
  // Math.ceil — la durée affichée ne doit jamais sous-estimer la durée
  // réelle ; toute seconde entamée compte pour une minute entière.
  it.each([
    [1, "1 min"],
    [59, "1 min"],
    [60, "1 min"],
    [61, "2 min"],
    [1080, "18 min"],
  ])("formats %i seconds as %s", (seconds, expected) => {
    expect(formatEstimatedDuration(seconds)).toBe(expected);
  });

  it("formats a zero duration as 0 min without any special case", () => {
    expect(formatEstimatedDuration(0)).toBe("0 min");
  });
});
