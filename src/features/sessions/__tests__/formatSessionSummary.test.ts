import { describe, expect, it } from "@jest/globals";

import {
  formatActivityCount,
  formatBodyZoneNamesSegment,
  formatCategoryNamesSegment,
  formatEstimatedDuration,
  formatSessionTagLine,
  formatTourCount,
} from "@/features/sessions/formatSessionSummary";

describe("formatActivityCount", () => {
  it("uses the singular form for exactly one activity", () => {
    expect(formatActivityCount(1)).toBe("1 exercice");
  });

  it("uses the plural form for zero activities", () => {
    expect(formatActivityCount(0)).toBe("0 exercices");
  });

  it("uses the plural form for more than one activity", () => {
    expect(formatActivityCount(2)).toBe("2 exercices");
    expect(formatActivityCount(5)).toBe("5 exercices");
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

  it("prefixes with ≥ when isApproximate is true (T01-S09, RM-072)", () => {
    expect(formatEstimatedDuration(1080, true)).toBe("≥ 18 min");
  });

  it("defaults isApproximate to false when omitted", () => {
    expect(formatEstimatedDuration(1080)).toBe("18 min");
  });
});

describe("formatCategoryNamesSegment (T01-S09, correction VISUAL, 2e contre-recette, point A)", () => {
  it("returns null when there is no Category (empty state)", () => {
    expect(formatCategoryNamesSegment([])).toBeNull();
  });

  it("joins several Category names with ', ', in the given order", () => {
    expect(formatCategoryNamesSegment(["Cardio", "Renforcement"])).toBe("Cardio, Renforcement");
  });
});

describe("formatBodyZoneNamesSegment (T01-S09, correction VISUAL, 2e contre-recette, point A)", () => {
  it("returns null when there is no body zone (empty state)", () => {
    expect(formatBodyZoneNamesSegment([])).toBeNull();
  });

  it("joins several body-zone names with ', ', in the given order", () => {
    expect(formatBodyZoneNamesSegment(["Genoux", "Dos"])).toBe("Genoux, Dos");
  });
});

describe("formatSessionTagLine (T01-S09, correction VISUAL tentative 2, point B — separator updated to ' : ' by the 2e contre-recette, point A, commentaire de revue 5551083690)", () => {
  it("returns null when both groups are empty (empty state — never a visible empty line)", () => {
    expect(formatSessionTagLine([], [])).toBeNull();
  });

  it("joins a single Category name alone when there is no body zone", () => {
    expect(formatSessionTagLine(["Cardio"], [])).toBe("Cardio");
  });

  it("joins a single body-zone name alone when there is no Category", () => {
    expect(formatSessionTagLine([], ["Genoux"])).toBe("Genoux");
  });

  it("joins several names within a group with ', ', and the two groups with ' : ' (previously ' · ', superseded)", () => {
    expect(formatSessionTagLine(["Cardio", "Renforcement"], ["Genoux", "Dos"])).toBe(
      "Cardio, Renforcement : Genoux, Dos",
    );
  });

  it("matches the exact example given by the review: 'Cardio : Genoux, Dos'", () => {
    expect(formatSessionTagLine(["Cardio"], ["Genoux", "Dos"])).toBe("Cardio : Genoux, Dos");
  });

  it("never reorders either group — the Repository's own order (D-107 / referential order) is preserved exactly", () => {
    expect(formatSessionTagLine(["Zzz personnalisée", "Renforcement"], ["Chevilles et pieds", "Cou"])).toBe(
      "Zzz personnalisée, Renforcement : Chevilles et pieds, Cou",
    );
  });
});
