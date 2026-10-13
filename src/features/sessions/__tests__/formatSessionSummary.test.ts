import { describe, expect, it } from "@jest/globals";

import {
  formatActivityCount,
  formatBodyZoneNamesSegment,
  formatCategoryNamesSegment,
  formatEstimatedDuration,
  formatSessionTagLine,
  formatTourCount,
} from "@/features/sessions/formatSessionSummary";
import {
  computeStructuredSessionDuration,
  type ActivityDurationFacts,
} from "@/domain/sessions/calculations";

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

/**
 * PRE-3 — symbole de la durée de Séance issu du résultat typé de l'autorité
 * Domaine (`computeStructuredSessionDuration`), répétitions structurelles du
 * Tour conservées.
 */
describe("formatEstimatedDuration — PRE-3 (P3-13/tours-cycles-list)", () => {
  const exercise = (overrides: Partial<ActivityDurationFacts>): ActivityDurationFacts => ({
    type: "EXERCISE",
    executionMode: "DURATION",
    durationSeconds: 60,
    repetitionCount: null,
    seriesCount: 2,
    pauseSeconds: 15,
    postActivityRecoverySeconds: 0,
    sideMode: "UNILATERAL",
    ...overrides,
  });

  it("P3-13/tours-cycles-list — exact sans symbole, ≈ estimé, ≥ travail inconnu ; Tour répété ; booléen historique accepté", () => {
    // 2 × (60 + 15) = 150 s, Tour × 2 = 300 s + avant-Tour 150 s = 450 s exact.
    const exact = computeStructuredSessionDuration({
      beforeTour: [exercise({})],
      inTour: [exercise({})],
      afterTour: [],
      tourRepeatCount: 2,
    });
    expect(exact).toEqual({ kind: "exact", seconds: 450 });
    expect(formatEstimatedDuration(exact.seconds, exact.kind)).toBe("8 min");

    const estimated = computeStructuredSessionDuration({
      beforeTour: [],
      inTour: [
        exercise({
          executionMode: "REPETITIONS",
          durationSeconds: null,
          repetitionCount: 15,
          seriesCount: 4,
          executionParameters: {
            version: 1,
            mode: "REPETITIONS",
            series: { kind: "UNIFORM", count: 4, target: 15, pauseSeconds: 15 },
            sideMode: "UNILATERAL",
            sideOrder: "BY_SIDE",
            sideRecoverySeconds: 0,
            cadenceBeepIntervalSeconds: 4,
            countdownSeconds: 10,
            endSeconds: 5,
          },
        }),
      ],
      afterTour: [],
      tourRepeatCount: 1,
    });
    expect(estimated).toEqual({ kind: "estimated", seconds: 300 });
    expect(formatEstimatedDuration(estimated.seconds, estimated.kind)).toBe("≈ 5 min");

    const lowerBound = computeStructuredSessionDuration({
      beforeTour: [exercise({ executionMode: "TO_FAILURE", durationSeconds: null })],
      inTour: [],
      afterTour: [],
      tourRepeatCount: 1,
    });
    expect(lowerBound).toEqual({ kind: "lowerBound", seconds: 30 });
    expect(formatEstimatedDuration(lowerBound.seconds, lowerBound.kind)).toBe("≥ 1 min");

    // Appelants existants : le booléen garde son sens historique.
    expect(formatEstimatedDuration(30, true)).toBe("≥ 1 min");
    expect(formatEstimatedDuration(30)).toBe("1 min");
  });
});
