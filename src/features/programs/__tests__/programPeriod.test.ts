import { describe, expect, it } from "@jest/globals";

import { EVERY_TIME, type Routine } from "@/domain/planning/Routine";
import {
  boundedEnd,
  datesInfoLine,
  durationEnd,
  durationFromDates,
  durationInfoLine,
  periodDayCount,
  unitLabel,
} from "@/features/programs/programPeriod";
import { routineProgramFrame, routineProgramLine } from "@/features/programs/programPresentation";

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
    expect(durationInfoLine("2026-09-15", "2026-12-14", "DAY")).toBe("Se termine le 14 décembre 2026");
    expect(durationInfoLine("2026-11-01", "2027-02-01", "DAY")).toBe("Se termine le 1er février 2027");
  });

  it("y3 (lot 5) : semaines « X jours, se termine le … » ; mois « X semaines, se termine le … » (semaines entières)", () => {
    expect(durationInfoLine("2026-09-15", durationEnd("2026-09-15", { unit: "WEEK", count: 3 }), "WEEK")).toBe("21 jours, se termine le 5 octobre 2026");
    // 15 septembre + 3 mois : 14 décembre, 91 jours = 13 semaines.
    expect(durationInfoLine("2026-09-15", durationEnd("2026-09-15", { unit: "MONTH", count: 3 }), "MONTH")).toBe("13 semaines, se termine le 14 décembre 2026");
    // 1er février + 1 mois : 28 février, 28 jours = 4 semaines ; 1er janvier + 1 mois : 31 jours = 4 semaines (arrondi inférieur).
    expect(durationInfoLine("2027-02-01", "2027-02-28", "MONTH")).toBe("4 semaines, se termine le 28 février 2027");
    expect(durationInfoLine("2027-01-01", "2027-01-31", "MONTH")).toBe("4 semaines, se termine le 31 janvier 2027");
    expect(durationInfoLine("2026-09-15", "2026-09-21", "WEEK")).toBe("7 jours, se termine le 21 septembre 2026");
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

describe("D-544 (lot 5, 23/11/2026, point 4) — routine dans le programme : cadre et ligne", () => {
  const base = {
    id: "r",
    name: "Routine du soir",
    time: "14:00",
    entries: [{ id: "e", sessionId: "s", frequency: EVERY_TIME }],
    exclusions: [],
    reminderMinutes: null,
    createdAt: "2026-09-12T08:00:00.000Z",
    updatedAt: "2026-09-12T08:00:00.000Z",
  } as unknown as Omit<Routine, "startDate" | "repetition">;
  const daily = { ...base, startDate: "2026-09-15", repetition: { unit: "DAY", every: 1, weekdays: [], end: { kind: "UNTIL", date: "2026-12-15" } } } as Routine;

  it("cadre : début de la routine, ramené au début du programme s'il le précède (jamais la date de création)", () => {
    expect(routineProgramFrame(daily, { startDate: "2026-09-01", endDate: "2026-12-31" })).toEqual({ day: "15 sept.", year: "2026" });
    expect(routineProgramFrame(daily, { startDate: "2026-10-01", endDate: "2026-12-31" })).toEqual({ day: "1 oct.", year: "2026" });
  });

  it("ligne : « N créneaux, jusqu'au [jour mois] » — créneaux dans la période, fin bornée par celle du programme", () => {
    // Routine entièrement dans le programme : 92 créneaux, fin de la routine.
    expect(routineProgramLine(daily, { startDate: "2026-09-01", endDate: "2026-12-31" })).toBe("92 créneaux, jusqu’au 15 déc.");
    // Programme plus court : créneaux du 1er au 31 octobre, fin du programme.
    expect(routineProgramLine(daily, { startDate: "2026-10-01", endDate: "2026-10-31" })).toBe("31 créneaux, jusqu’au 31 oct.");
  });

  it("« pendant N semaines » : fin calculée de la répétition ; créneau unique au singulier", () => {
    const weekly = { ...base, startDate: "2026-09-21", repetition: { unit: "WEEK", every: 1, weekdays: [1], end: { kind: "FOR", count: 12 } } } as Routine;
    expect(routineProgramLine(weekly, { startDate: "2026-09-01", endDate: "2027-03-31" })).toMatch(/^12 créneaux, jusqu’au \d+ déc\.$/);
    expect(routineProgramLine({ ...base, startDate: "2026-11-18", repetition: null } as Routine, { startDate: "2026-11-01", endDate: "2026-11-30" })).toBe(
      "1 créneau, jusqu’au 18 nov.",
    );
  });
});
