import { describe, expect, it } from "@jest/globals";

import { addDays, mondayOf, validateRoutineDraft, weekdayOf, EVERY_TIME, type Routine } from "@/domain/planning/Routine";
import { occurrencesBetween, periodOccurrences, upcomingOccurrences } from "@/domain/planning/occurrences";

function routine(overrides: Partial<Routine> = {}): Routine {
  return {
    id: "r1",
    name: "",
    startDate: "2026-08-03", // lundi
    time: "08:00",
    repetition: null,
    entries: [{ id: "e1", sessionId: "s1", frequency: EVERY_TIME }],
    exclusions: [],
    reminderMinutes: null,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

const weekOf = (r: Routine, day: string) => occurrencesBetween(r, mondayOf(day), addDays(mondayOf(day), 6)).map((o) => `${o.date} ${o.time}`);

describe("unité Jour — « pendant N jours » (recette du 19/11/2026)", () => {
  it("N jours depuis « Début le » compris, tous les N jours", () => {
    const daily = routine({ repetition: { unit: "DAY", every: 2, weekdays: [], end: { kind: "FOR", count: 5 } } });
    expect(occurrencesBetween(daily, "2026-08-01", "2026-08-31").map((o) => o.date)).toEqual(["2026-08-03", "2026-08-05", "2026-08-07"]);
    const everyDay = routine({ repetition: { unit: "DAY", every: 1, weekdays: [], end: { kind: "FOR", count: 1 } } });
    expect(occurrencesBetween(everyDay, "2026-08-01", "2026-08-31").map((o) => o.date)).toEqual(["2026-08-03"]);
  });
});

describe("calendrier civil", () => {
  it("lundi = 1, dimanche = 7 ; lundi de la semaine", () => {
    expect(weekdayOf("2026-08-03")).toBe(1);
    expect(weekdayOf("2026-08-09")).toBe(7);
    expect(mondayOf("2026-08-09")).toBe("2026-08-03");
    expect(mondayOf("2026-08-03")).toBe("2026-08-03");
  });

  it("le passage à l'heure d'hiver (25/10/2026) ne décale aucune date", () => {
    expect(addDays("2026-10-24", 1)).toBe("2026-10-25");
    expect(addDays("2026-10-25", 1)).toBe("2026-10-26");
    expect(mondayOf("2026-10-25")).toBe("2026-10-19");
  });
});

describe("créneau unique (répétition désactivée)", () => {
  it("une seule occurrence, au bon jour et à la bonne heure", () => {
    const single = routine({ startDate: "2026-08-05", time: "14:30" });
    expect(weekOf(single, "2026-08-03")).toEqual(["2026-08-05 14:30"]);
    expect(weekOf(single, "2026-08-10")).toEqual([]);
    expect(weekOf(single, "2026-07-27")).toEqual([]);
  });
});

describe("répétition hebdomadaire (RM-047)", () => {
  const biweekly = routine({
    repetition: { unit: "WEEK", every: 2, weekdays: [1, 4], end: { kind: "UNTIL", date: "2026-08-23" } },
  });

  it("toutes les 2 semaines, lundis et jeudis : semaines 0 et 2 seulement", () => {
    expect(weekOf(biweekly, "2026-08-03")).toEqual(["2026-08-03 08:00", "2026-08-06 08:00"]);
    expect(weekOf(biweekly, "2026-08-10")).toEqual([]);
    expect(weekOf(biweekly, "2026-08-17")).toEqual(["2026-08-17 08:00", "2026-08-20 08:00"]);
  });

  it("fin de répétition « jusqu'au » incluse, rien après", () => {
    expect(weekOf(biweekly, "2026-08-31")).toEqual([]);
    const inclusive = routine({ repetition: { unit: "WEEK", every: 1, weekdays: [4], end: { kind: "UNTIL", date: "2026-08-13" } } });
    expect(occurrencesBetween(inclusive, "2026-08-01", "2026-12-31").map((o) => o.date)).toEqual(["2026-08-06", "2026-08-13"]);
  });

  it("« pendant 3 semaines » : trois semaines depuis la semaine d'ancrage", () => {
    const during = routine({ startDate: "2026-08-05", repetition: { unit: "WEEK", every: 1, weekdays: [2, 5], end: { kind: "FOR", count: 3 } } });
    // Mardi 4 août est avant Début le (5 août) : exclu ; semaine 3 (24 août) hors borne.
    expect(occurrencesBetween(during, "2026-08-01", "2026-12-31").map((o) => o.date)).toEqual([
      "2026-08-07",
      "2026-08-11",
      "2026-08-14",
      "2026-08-18",
      "2026-08-21",
    ]);
  });

  it("début en milieu de semaine : jours retenus antérieurs exclus de la semaine d'ancrage", () => {
    const mid = routine({ startDate: "2026-08-05", repetition: { unit: "WEEK", every: 1, weekdays: [1, 4], end: { kind: "UNTIL", date: "2026-08-31" } } });
    expect(weekOf(mid, "2026-08-03")).toEqual(["2026-08-06 08:00"]);
    expect(weekOf(mid, "2026-08-10")).toEqual(["2026-08-10 08:00", "2026-08-13 08:00"]);
  });

  it("passage d'une semaine à l'autre : chaque occurrence apparaît une seule fois", () => {
    const daily = routine({ repetition: { unit: "WEEK", every: 1, weekdays: [1, 2, 3, 4, 5, 6, 7], end: { kind: "UNTIL", date: "2026-11-30" } } });
    const seen: string[] = [];
    for (let monday = "2026-08-03"; monday <= "2026-11-30"; monday = addDays(monday, 7)) seen.push(...weekOf(daily, monday));
    expect(new Set(seen).size).toBe(seen.length);
    // 3 août → 30 novembre inclus = 120 jours, heure d'hiver comprise.
    expect(seen).toHaveLength(120);
    expect(seen.every((entry) => entry.endsWith(" 08:00"))).toBe(true);
  });
});

describe("retraits et contenus", () => {
  it("R-04 : une occurrence retirée disparaît, les autres restent", () => {
    const weekly = routine({
      repetition: { unit: "WEEK", every: 1, weekdays: [1, 4], end: { kind: "UNTIL", date: "2026-08-31" } },
      exclusions: ["2026-08-06T08:00"],
    });
    expect(weekOf(weekly, "2026-08-03")).toEqual(["2026-08-03 08:00"]);
    expect(weekOf(weekly, "2026-08-10")).toEqual(["2026-08-10 08:00", "2026-08-13 08:00"]);
  });

  it("liste ordonnée : contenus retenus dans l'ordre de la liste ; 1 fois sur 2 filtre sans créer d'occurrence", () => {
    const route = routine({
      repetition: { unit: "WEEK", every: 1, weekdays: [1], end: { kind: "UNTIL", date: "2026-08-31" } },
      entries: [
        { id: "e1", sessionId: "s1", frequency: EVERY_TIME },
        { id: "e2", sessionId: "s2", frequency: { x: 1, n: 2, positions: [1] } },
      ],
    });
    const result = occurrencesBetween(route, "2026-08-01", "2026-08-31");
    expect(result.map((o) => [o.date, o.contents.map((c) => c.sessionId)])).toEqual([
      ["2026-08-03", ["s1", "s2"]],
      ["2026-08-10", ["s1"]],
      ["2026-08-17", ["s1", "s2"]],
      ["2026-08-24", ["s1"]],
      ["2026-08-31", ["s1", "s2"]],
    ]);
  });

  it("occurrences futures seulement, triées par date puis heure", () => {
    const a = routine({ id: "a", time: "14:00", repetition: { unit: "WEEK", every: 1, weekdays: [1, 2], end: { kind: "UNTIL", date: "2026-08-31" } } });
    const b = routine({ id: "b", time: "08:00", startDate: "2026-08-03" });
    const now = new Date(2026, 7, 3, 9, 0); // lundi 3 août, 9 h : l'occurrence de 8 h est passée
    const result = upcomingOccurrences([a, b], "2026-08-03", "2026-08-09", now);
    expect(result.map((o) => `${o.routineId} ${o.date} ${o.time}`)).toEqual(["a 2026-08-03 14:00", "a 2026-08-04 14:00"]);
  });
});

describe("validation du brouillon (CE-UI-05 §14)", () => {
  const base = { name: "Matin", startDate: "2026-08-03", time: "08:00", repetition: null, entries: [{ id: "e", sessionId: "s", frequency: EVERY_TIME }] };

  it("brouillon complet : aucune anomalie", () => {
    expect(validateRoutineDraft(base)).toEqual([]);
  });

  it("sans contenu, date ou heure invalides", () => {
    expect(validateRoutineDraft({ ...base, entries: [], startDate: "2026-02-30", time: "24:00" })).toEqual(["NO_CONTENT", "INVALID_DATE", "INVALID_TIME"]);
  });

  it("Semaine : multiplicateur 1..12, au moins un jour, fin après le début", () => {
    expect(
      validateRoutineDraft({ ...base, repetition: { unit: "WEEK", every: 13, weekdays: [], end: { kind: "UNTIL", date: "2026-08-01" } } }),
    ).toEqual(["INVALID_MULTIPLIER", "NO_WEEKDAY", "END_BEFORE_START"]);
    expect(validateRoutineDraft({ ...base, repetition: { unit: "WEEK", every: 12, weekdays: [3], end: { kind: "FOR", count: 0 } } })).toEqual([
      "INVALID_END",
    ]);
  });
});

describe("unité Jour et occurrences passées (RM-257, D-525, D-526 ; 18/11/2026)", () => {
  it("tous les 3 jours depuis « Début le », jusqu'au inclus", () => {
    const daily = routine({ repetition: { unit: "DAY", every: 3, weekdays: [], end: { kind: "UNTIL", date: "2026-08-12" } } });
    expect(occurrencesBetween(daily, "2026-08-01", "2026-08-31").map((o) => o.date)).toEqual(["2026-08-03", "2026-08-06", "2026-08-09", "2026-08-12"]);
  });

  it("validation : jours 1..31 sans rangée de jours ; nom obligatoire", () => {
    const base = { name: "Matin", startDate: "2026-08-03", time: "08:00", entries: [{ id: "e", sessionId: "s", frequency: EVERY_TIME }] };
    expect(validateRoutineDraft({ ...base, repetition: { unit: "DAY", every: 2, weekdays: [], end: { kind: "UNTIL", date: "2026-08-23" } } })).toEqual([]);
    expect(validateRoutineDraft({ ...base, repetition: { unit: "DAY", every: 32, weekdays: [], end: { kind: "UNTIL", date: "2026-08-23" } } })).toEqual(["INVALID_MULTIPLIER"]);
    expect(validateRoutineDraft({ ...base, name: "  ", repetition: null })).toEqual(["NAME_REQUIRED"]);
  });

  it("D-525 : les occurrences passées de la période restent présentées", () => {
    const weekly = routine({ repetition: { unit: "WEEK", every: 1, weekdays: [1, 3], end: { kind: "UNTIL", date: "2026-08-31" } } });
    expect(periodOccurrences([weekly], "2026-08-03", "2026-08-09").map((o) => o.date)).toEqual(["2026-08-03", "2026-08-05"]);
  });
});
