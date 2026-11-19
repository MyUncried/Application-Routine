import { describe, expect, it } from "@jest/globals";

import { EVERY_TIME, type Routine } from "@/domain/planning/Routine";
import { creationDateParts, isRoutineActive, journalCounts, journalRecurrenceLine, matchesJournalFilters, routineLastDate, sortJournal } from "@/features/planning/journal";
import { EMPTY_SESSION_FILTERS } from "@/features/sessions/sessionCatalogueFilters";
import type { SessionCatalogueProjection } from "@/features/sessions/sessionCatalogueProjection";

/** Journal des routines (D-535, DSF Journal § 3 et § 4) : compteurs, tri, ligne de récurrence, filtres. */
const TODAY = "2026-11-19"; // jeudi

const routine = (patch: Partial<Routine>): Routine => ({
  id: "r",
  name: "Genou",
  startDate: "2026-11-02",
  time: "08:00",
  repetition: { unit: "WEEK", every: 1, weekdays: [1, 4], end: { kind: "UNTIL", date: "2026-12-28" } },
  entries: [{ id: "e", sessionId: "s", frequency: EVERY_TIME }],
  exclusions: [],
  reminderMinutes: null,
  createdAt: "2026-11-12T09:00:00.000Z",
  updatedAt: "2026-11-12T09:00:00.000Z",
  ...patch,
});

describe("Journal — compteurs Actives / Terminées", () => {
  it("active : une occurrence aujourd'hui ou à venir ; terminée : plus aucune", () => {
    expect(isRoutineActive(routine({}), TODAY)).toBe(true);
    expect(isRoutineActive(routine({ repetition: { unit: "WEEK", every: 1, weekdays: [1], end: { kind: "UNTIL", date: "2026-11-18" } } }), TODAY)).toBe(false);
    // Créneau unique d'aujourd'hui : en cours.
    expect(isRoutineActive(routine({ repetition: null, startDate: TODAY }), TODAY)).toBe(true);
    expect(isRoutineActive(routine({ repetition: null, startDate: "2026-11-18" }), TODAY)).toBe(false);
    // Fin future, mais la seule occurrence restante a été retirée : terminée.
    expect(isRoutineActive(routine({ repetition: null, startDate: "2026-11-20", exclusions: ["2026-11-20T08:00"] }), TODAY)).toBe(false);
    // « pendant N semaines » : borne comptée en semaines.
    expect(routineLastDate(routine({ repetition: { unit: "WEEK", every: 1, weekdays: [1], end: { kind: "FOR", count: 2 } } }))).toBe("2026-11-15");
    expect(journalCounts([routine({}), routine({ repetition: null, startDate: "2026-11-01" })], TODAY)).toEqual({ active: 1, finished: 1 });
  });
});

describe("Journal — tri et carte", () => {
  it("tri par défaut : création / modification la plus récente en haut", () => {
    const older = routine({ id: "a", createdAt: "2026-10-20T08:00:00.000Z", updatedAt: "2026-11-15T08:00:00.000Z" });
    const newer = routine({ id: "b", createdAt: "2026-11-12T08:00:00.000Z", updatedAt: "2026-11-12T08:00:00.000Z" });
    const oldest = routine({ id: "c", createdAt: "2026-10-01T08:00:00.000Z", updatedAt: "2026-10-01T08:00:00.000Z" });
    expect(sortJournal([oldest, newer, older]).map((item) => item.id)).toEqual(["a", "b", "c"]);
  });

  it("cadre : date de création « 12 nov. » et année ; date illisible : rien d'inventé", () => {
    expect(creationDateParts(new Date(2026, 10, 12, 10).toISOString())).toEqual({ day: "12 nov.", year: "2026" });
    expect(creationDateParts("")).toBeNull();
  });

  it("ligne 3 : récurrence et borne (Figma « Calendrier — Journal — MVP »)", () => {
    expect(journalRecurrenceLine(routine({}), TODAY)).toBe("Chaque lundi et jeudi · jusqu’au 28 déc.");
    expect(journalRecurrenceLine(routine({ repetition: { unit: "DAY", every: 1, weekdays: [], end: { kind: "UNTIL", date: "2026-11-30" } } }), TODAY)).toBe("Tous les jours · jusqu’au 30 nov.");
    expect(journalRecurrenceLine(routine({ repetition: null, startDate: "2026-11-18" }), TODAY)).toBe("Une seule fois · le 18 nov.");
    expect(journalRecurrenceLine(routine({ repetition: { unit: "WEEK", every: 1, weekdays: [2], end: { kind: "FOR", count: 6 } } }), TODAY)).toBe("Chaque mardi · pendant 6 semaines");
    expect(journalRecurrenceLine(routine({ repetition: null, startDate: "2027-01-05" }), TODAY)).toBe("Une seule fois · le 5 janv. 2027");
  });
});

describe("Journal — filtres (feuille du Catalogue des séances)", () => {
  const session = (patch: Partial<SessionCatalogueProjection>) => ({ id: "s", status: "ACTIVE", categories: [], bodyZoneIds: [], labelId: null, format: "FREE", ...patch }) as unknown as SessionCatalogueProjection;
  it("une routine est retenue quand l'une de ses séances l'est", () => {
    const cardio = session({ categories: [{ id: "cardio", name: "Cardio", color: "#000" }] });
    const genou = session({ bodyZoneIds: ["genou"] });
    const byCategory = { ...EMPTY_SESSION_FILTERS, categoryIds: new Set(["cardio"]) };
    expect(matchesJournalFilters([genou, cardio], byCategory)).toBe(true);
    expect(matchesJournalFilters([genou], byCategory)).toBe(false);
    expect(matchesJournalFilters([genou], { ...EMPTY_SESSION_FILTERS, bodyZoneIds: new Set(["genou"]) })).toBe(true);
  });
});
