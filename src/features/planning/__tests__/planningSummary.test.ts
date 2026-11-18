import { describe, expect, it } from "@jest/globals";

import { formatPlanningSynthesis, formatRecurrence } from "@/features/planning/planningSummary";

describe("synthèse de la zone de contexte (RM-259, D-521)", () => {
  it("forme de Figma 12650:27854 : durée en premier, sans majuscule ni point final", () => {
    expect(
      formatPlanningSynthesis(
        { startDate: "2026-08-03", time: "08:00", repetition: { unit: "WEEK", every: 2, weekdays: [4, 1], end: { kind: "UNTIL", date: "2026-08-23" } } },
        "12’35”",
      ),
    ).toBe("12’35” toutes les 2 semaines, les lundis et jeudis, à 8h, jusqu’au 23 août 2026");
  });

  it("aucune répétition : date et heure seulement", () => {
    expect(formatPlanningSynthesis({ startDate: "2026-08-03", time: "18:30", repetition: null }, "45”")).toBe("45” le 3 août 2026, à 18h30");
  });

  it("unité jours : « tous les » (accord, RM-257) ; aucune rangée de jours", () => {
    const day = (every: number) => ({ startDate: "2026-08-03", time: "08:00", repetition: { unit: "DAY" as const, every, weekdays: [], end: { kind: "UNTIL" as const, date: "2026-08-23" } } });
    expect(formatPlanningSynthesis(day(1), "")).toBe("tous les jours, à 8h, jusqu’au 23 août 2026");
    expect(formatPlanningSynthesis(day(3), "")).toBe("tous les 3 jours, à 8h, jusqu’au 23 août 2026");
  });

  it("jours qui ne tiennent pas : « X jours par semaine »", () => {
    expect(
      formatPlanningSynthesis(
        { startDate: "2026-08-03", time: "08:00", repetition: { unit: "WEEK", every: 1, weekdays: [1, 2, 3, 4, 5], end: { kind: "UNTIL", date: "2026-08-23" } } },
        "",
        true,
      ),
    ).toBe("toutes les semaines, 5 jours par semaine, à 8h, jusqu’au 23 août 2026");
  });
});

describe("récurrence d'une carte du Calendrier", () => {
  it("semaines et jours", () => {
    expect(formatRecurrence({ repetition: { unit: "WEEK", every: 1, weekdays: [1], end: { kind: "FOR", count: 2 } } })).toBe("Chaque lundi");
    expect(formatRecurrence({ repetition: { unit: "WEEK", every: 2, weekdays: [4, 1], end: { kind: "FOR", count: 2 } } })).toBe("Toutes les 2 semaines, lundi et jeudi");
    expect(formatRecurrence({ repetition: { unit: "DAY", every: 1, weekdays: [], end: { kind: "UNTIL", date: "2026-08-23" } } })).toBe("Tous les jours");
    expect(formatRecurrence({ repetition: { unit: "DAY", every: 2, weekdays: [], end: { kind: "UNTIL", date: "2026-08-23" } } })).toBe("Tous les 2 jours");
  });
});
