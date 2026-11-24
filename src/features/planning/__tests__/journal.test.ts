import { describe, expect, it } from "@jest/globals";

import { addDays as addDaysTo, EVERY_TIME, type Routine } from "@/domain/planning/Routine";
import { creationDateParts, isJournalRoutineVisible, isRoutineActive, journalCounts, journalRecurrenceLine, journalSlotsLine, matchesJournalFilters, routineLastDate, sortJournal } from "@/features/planning/journal";
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
  it("D-540 : active — un créneau à venir ou rattrapable, même date de fin passée ; terminée sinon", () => {
    const now = new Date(2026, 10, 19, 12, 0);
    const started = () => true;
    expect(isRoutineActive(routine({}), now)).toBe(true);
    // Date de fin passée, dernier créneau (lundi 16) non commencé : rattrapable 10 jours → active.
    expect(isRoutineActive(routine({ repetition: { unit: "WEEK", every: 1, weekdays: [1], end: { kind: "UNTIL", date: "2026-11-18" } } }), now)).toBe(true);
    // … le même, commencé : plus rien à faire → terminée.
    expect(isRoutineActive(routine({ repetition: { unit: "WEEK", every: 1, weekdays: [1], end: { kind: "UNTIL", date: "2026-11-18" } } }), now, started)).toBe(false);
    // Créneau unique d'aujourd'hui : à venir.
    expect(isRoutineActive(routine({ repetition: null, startDate: TODAY }), now)).toBe(true);
    // Créneau unique d'il y a 18 jours, jamais fait : expiré (10 jours) → terminée.
    expect(isRoutineActive(routine({ repetition: null, startDate: "2026-11-01" }), now)).toBe(false);
    // Fin future, mais la seule occurrence restante a été retirée : terminée.
    expect(isRoutineActive(routine({ repetition: null, startDate: "2026-11-20", exclusions: ["2026-11-20T08:00"] }), now)).toBe(false);
    // « pendant N semaines » : borne comptée en semaines.
    expect(routineLastDate(routine({ repetition: { unit: "WEEK", every: 1, weekdays: [1], end: { kind: "FOR", count: 2 } } }))).toBe("2026-11-15");
    // « pendant N jours » : N jours depuis « Début le » compris.
    expect(routineLastDate(routine({ repetition: { unit: "DAY", every: 1, weekdays: [], end: { kind: "FOR", count: 10 } } }))).toBe(addDaysTo(routine({}).startDate, 9));
    const list = [routine({}), routine({ id: "old", repetition: null, startDate: "2026-11-01" })];
    expect(journalCounts(list, (item) => isRoutineActive(item, now))).toEqual({ active: 1, finished: 1 });
  });
});

describe("D-540 — filtre « Actives » / « Terminées » du Journal", () => {
  it("par défaut, actives seules ; « Terminées » (ARCHIVED) les terminées ; les deux, toutes ; statut des séances ignoré", () => {
    expect(isJournalRoutineVisible(true, [], EMPTY_SESSION_FILTERS)).toBe(true);
    expect(isJournalRoutineVisible(false, [], EMPTY_SESSION_FILTERS)).toBe(false);
    const finished = { ...EMPTY_SESSION_FILTERS, statuses: new Set(["ARCHIVED" as const]) };
    expect(isJournalRoutineVisible(false, [], finished)).toBe(true);
    expect(isJournalRoutineVisible(true, [], finished)).toBe(false);
    const both = { ...EMPTY_SESSION_FILTERS, statuses: new Set(["ACTIVE" as const, "ARCHIVED" as const]) };
    expect(isJournalRoutineVisible(false, [], both) && isJournalRoutineVisible(true, [], both)).toBe(true);
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
    expect(journalRecurrenceLine(routine({ repetition: { unit: "DAY", every: 1, weekdays: [], end: { kind: "FOR", count: 10 } } }), TODAY)).toBe("Tous les jours · pendant 10 jours");
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

describe("Journal — ligne 3 de la carte : créneaux à venir (recette du 20/11/2026, r20-j-deploye)", () => {
  const now = new Date(2026, 10, 19, 9, 0); // jeudi 19 novembre, 9 h : le créneau de 8 h du jour est passé
  it("« N créneaux, du X au Y », sans année ni date de début de la routine", () => {
    // Lundis et jeudis du 23/11 au 28/12 : 23, 26, 30 nov. ; 3, 7, 10, 14, 17, 21, 24, 28 déc.
    expect(journalSlotsLine(routine({}), TODAY, now)).toBe("11 créneaux, du 23 nov. au 28 déc.");
  });
  it("un seul créneau : « 1 créneau, le X »", () => {
    expect(journalSlotsLine(routine({ repetition: null, startDate: "2027-01-04" }), TODAY, now)).toBe("1 créneau, le 4 janv.");
  });
  it("aucun créneau à venir", () => {
    expect(journalSlotsLine(routine({ repetition: null, startDate: TODAY }), TODAY, now)).toBe("Aucun créneau à venir");
  });
});
