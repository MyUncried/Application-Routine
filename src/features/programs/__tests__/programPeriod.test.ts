import { describe, expect, it } from "@jest/globals";

import type { Routine } from "@/domain/planning/Routine";
import {
  boundedEnd,
  datesInfoLine,
  durationEnd,
  durationFromDates,
  durationInfoLine,
  periodDayCount,
  unitLabel,
} from "@/features/programs/programPeriod";
import { routineSpanLine } from "@/features/programs/programPresentation";

/** D-543 (DSF Programmes § 1) — calculs de la période ; D-544 (§ 2) — seconde ligne d'une routine. Pas de preuve iPhone. */
describe("D-543 — période d'un programme", () => {
  it("jours et semaines : fin comprise = début + N − 1 jour (semaine = 7 jours)", () => {
    expect(durationEnd("2026-09-15", { unit: "DAY", count: 1 })).toBe("2026-09-15");
    expect(durationEnd("2026-09-15", { unit: "DAY", count: 92 })).toBe("2026-12-15");
    expect(durationEnd("2026-09-15", { unit: "WEEK", count: 1 })).toBe("2026-09-21");
    expect(durationEnd("2026-09-15", { unit: "WEEK", count: 13 })).toBe("2026-12-14");
    // Passage d'année.
    expect(durationEnd("2026-12-28", { unit: "WEEK", count: 2 })).toBe("2027-01-10");
  });

  it("mois : même quantième du mois d'arrivée moins un jour (du 15 septembre pendant 3 mois : 14 décembre)", () => {
    expect(durationEnd("2026-09-15", { unit: "MONTH", count: 3 })).toBe("2026-12-14");
    expect(durationEnd("2026-09-01", { unit: "MONTH", count: 1 })).toBe("2026-09-30");
    expect(durationEnd("2026-11-15", { unit: "MONTH", count: 2 })).toBe("2027-01-14");
    expect(durationEnd("2026-01-15", { unit: "MONTH", count: 12 })).toBe("2027-01-14");
  });

  it("mois : quantième absent → dernier jour du mois (31 janvier + 1 mois : 28 février ; année bissextile : 29)", () => {
    expect(durationEnd("2027-01-31", { unit: "MONTH", count: 1 })).toBe("2027-02-28");
    expect(durationEnd("2028-01-31", { unit: "MONTH", count: 1 })).toBe("2028-02-29");
    expect(durationEnd("2026-08-31", { unit: "MONTH", count: 1 })).toBe("2026-09-30");
    expect(durationEnd("2026-01-30", { unit: "MONTH", count: 1 })).toBe("2026-02-28");
  });

  it("bornes : durée ≥ 1, fin ≥ début", () => {
    expect(durationEnd("2026-09-15", { unit: "DAY", count: 0 })).toBe("2026-09-15");
    expect(durationEnd("2026-09-15", { unit: "WEEK", count: -3 })).toBe("2026-09-21");
    expect(boundedEnd("2026-09-15", "2026-09-10")).toBe("2026-09-15");
    expect(boundedEnd("2026-09-15", "2026-09-20")).toBe("2026-09-20");
    expect(durationFromDates("2026-09-15", "2026-09-15")).toEqual({ unit: "DAY", count: 1 });
  });

  it("changement de mode sans perte : jours, ou semaines si multiple de 7 ; la fin recalculée est la même", () => {
    expect(durationFromDates("2026-09-15", "2026-12-15")).toEqual({ unit: "DAY", count: 92 });
    expect(durationFromDates("2026-09-15", "2026-12-14")).toEqual({ unit: "WEEK", count: 13 });
    for (const [start, end] of [
      ["2026-09-15", "2026-12-15"],
      ["2026-09-15", "2026-12-14"],
      ["2027-01-31", "2027-02-28"],
      ["2026-03-01", "2026-03-01"],
    ] as const) {
      expect(durationEnd(start, durationFromDates(start, end))).toBe(end);
    }
  });

  it("ligne d'information, mode dates : « 92 jours, soit 13 semaines et 1 jour » ; « 91 jours, soit 13 semaines » ; moins d'une semaine : « N jours »", () => {
    expect(datesInfoLine("2026-09-15", "2026-12-15")).toBe("92 jours, soit 13 semaines et 1 jour");
    expect(datesInfoLine("2026-09-15", "2026-12-14")).toBe("91 jours, soit 13 semaines");
    expect(datesInfoLine("2026-09-15", "2026-09-24")).toBe("10 jours, soit 1 semaine et 3 jours");
    expect(datesInfoLine("2026-09-15", "2026-09-21")).toBe("7 jours, soit 1 semaine");
    expect(datesInfoLine("2026-09-15", "2026-09-20")).toBe("6 jours");
    expect(datesInfoLine("2026-09-15", "2026-09-15")).toBe("1 jour");
    expect(periodDayCount("2026-09-15", "2026-12-15")).toBe(92);
  });

  it("ligne d'information, mode durée : « Se termine le 14 décembre 2026 »", () => {
    expect(durationInfoLine("2026-12-14")).toBe("Se termine le 14 décembre 2026");
    expect(durationInfoLine("2027-02-01")).toBe("Se termine le 1er février 2027");
  });

  it("unités accordées : jour / jours, semaine / semaines, mois", () => {
    expect(unitLabel("DAY", 1)).toBe("jour");
    expect(unitLabel("DAY", 3)).toBe("jours");
    expect(unitLabel("WEEK", 1)).toBe("semaine");
    expect(unitLabel("WEEK", 13)).toBe("semaines");
    expect(unitLabel("MONTH", 1)).toBe("mois");
    expect(unitLabel("MONTH", 3)).toBe("mois");
  });
});

describe("D-544 — seconde ligne d'une routine du programme", () => {
  const base = {
    id: "r",
    name: "Routine du soir",
    time: "14:00",
    entries: [],
    exclusions: [],
    reminderMinutes: null,
    createdAt: "2026-09-12T08:00:00.000Z",
    updatedAt: "2026-09-12T08:00:00.000Z",
  } as unknown as Omit<Routine, "startDate" | "repetition">;

  it("« du 15 septembre au 15 décembre » : jours en chiffres, mois en toutes lettres, sans année, sans fréquence ni heure", () => {
    const line = routineSpanLine({
      ...base,
      startDate: "2026-09-15",
      repetition: { unit: "DAY", every: 1, weekdays: [], end: { kind: "UNTIL", date: "2026-12-15" } },
    } as Routine);
    expect(line).toBe("du 15 septembre au 15 décembre");
    expect(line).not.toMatch(/2026|tous|h/);
  });

  it("« pendant N semaines » : fin calculée de la répétition", () => {
    expect(
      routineSpanLine({ ...base, startDate: "2026-09-21", repetition: { unit: "WEEK", every: 1, weekdays: [1], end: { kind: "FOR", count: 12 } } } as Routine),
    ).toMatch(/^du 21 septembre au \d+ décembre$/);
  });

  it("[interprétation] créneau unique : « le 18 novembre »", () => {
    expect(routineSpanLine({ ...base, startDate: "2026-11-18", repetition: null } as Routine)).toBe("le 18 novembre");
  });
});
