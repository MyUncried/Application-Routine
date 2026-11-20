import { describe, expect, it } from "@jest/globals";

import { formatRoutineSummary } from "@/features/planning/planningSummary";

describe("récapitulatif de planification (CE-UI-05)", () => {
  it("sans répétition : forme de Figma 1992:7716, aucune récurrence annoncée", () => {
    expect(formatRoutineSummary({ startDate: "2026-08-03", time: "08:00", repetition: null })).toBe(
      "Planifiée le 3 août 2026 à 8 h, sans répétition.",
    );
  });

  it("toutes les 2 semaines, lundis et jeudis, jusqu'au : forme de Figma 1992:6838", () => {
    expect(
      formatRoutineSummary({
        startDate: "2026-08-03",
        time: "08:00",
        repetition: { unit: "WEEK", every: 2, weekdays: [4, 1], end: { kind: "UNTIL", date: "2026-08-23" } },
      }),
    ).toBe("Toutes les 2 semaines, les lundis et jeudis, à 8 h, jusqu’au 23 août 2026.");
  });

  it("chaque semaine, trois jours, pendant", () => {
    expect(
      formatRoutineSummary({
        startDate: "2026-08-03",
        time: "18:30",
        repetition: { unit: "WEEK", every: 1, weekdays: [1, 3, 5], end: { kind: "FOR", count: 6 } },
      }),
    ).toBe("Toutes les semaines, les lundis, mercredis et vendredis, à 18 h 30, pendant 6 semaines.");
  });
});
