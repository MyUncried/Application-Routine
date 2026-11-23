import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { EVERY_TIME, type Routine, type RoutineDraft, type RoutineEntry } from "@/domain/planning/Routine";
import type { AgendaExecution, OccurrenceExecution } from "@/domain/planning/occurrenceExecutions";
import { routineOccurrences, withExpiry } from "@/domain/planning/occurrences";
import {
  buildPlanWeek,
  firstWeekOfShiftedMonth,
  formatPlanTotal,
  isoWeekNumber,
  monthOfWeek,
  planTimeLabel,
  weekDaysLabel,
  weeksOfMonth,
  type PlanProgramme,
} from "@/features/planning/planWeek";
import { PlanningService } from "@/features/planning/PlanningService";
import type { SessionCatalogueProjection } from "@/features/sessions/sessionCatalogueProjection";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteRoutineRepository } from "@/infrastructure/database/repositories/SqliteRoutineRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * PLAN-01 (D-554, D-553, RM-273 ; DSF Plan, 21/11/2026) — règles du Plan sans écran : semaines du mois, groupes par programme,
 * parcours, cases empilées, totaux, créneau ajouté hors de la répétition. Une suite verte ne remplace pas la recette sur iPhone.
 */

const entry = (sessionId: string, id = `e-${sessionId}`): RoutineEntry => ({ id, sessionId, frequency: EVERY_TIME });
const at = (day: number, hours: number, minutes = 0) => new Date(2026, 10, day, hours, minutes);

describe("semaines du mois (DSF Plan § 2)", () => {
  it("novembre 2026 : S45 à S48 ; décembre 2026 : S49 à S53 ; semaine à cheval sur deux mois au mois de son jeudi", () => {
    expect(weeksOfMonth("2026-11-01")).toEqual(["2026-11-02", "2026-11-09", "2026-11-16", "2026-11-23"]);
    expect(weeksOfMonth("2026-11-01").map(isoWeekNumber)).toEqual([45, 46, 47, 48]);
    expect(weeksOfMonth("2026-12-01").map(isoWeekNumber)).toEqual([49, 50, 51, 52, 53]);
    // Du 30 novembre au 6 décembre : jeudi 3 décembre, la semaine est en décembre.
    expect(monthOfWeek("2026-11-30")).toBe("2026-12-01");
    expect(weekDaysLabel("2026-11-30")).toBe("30–6");
    expect(weekDaysLabel("2026-11-16")).toBe("16–22");
    expect(firstWeekOfShiftedMonth("2026-11-16", 1)).toBe("2026-11-30");
    expect(firstWeekOfShiftedMonth("2026-11-16", -1)).toBe("2026-09-28");
  });

  it("heures et totaux : « 8h », « 18h30 », « — » ; « 28’ », « 3h31 », « — »", () => {
    expect(planTimeLabel("8h00")).toBe("8h");
    expect(planTimeLabel("14h00")).toBe("14h");
    expect(planTimeLabel("18h30")).toBe("18h30");
    expect(planTimeLabel("—")).toBe("—");
    expect(formatPlanTotal(28 * 60)).toBe("28’");
    expect(formatPlanTotal(211 * 60)).toBe("3h31");
    expect(formatPlanTotal(null)).toBe("—");
  });
});

describe("grille d'une semaine (DSF Plan § 3 à § 6)", () => {
  const projection = (id: string, name: string, seconds: number) =>
    ({ id, name, status: "ACTIVE", duration: { kind: "exact", seconds }, bodyZoneIds: [], categories: [], tree: [] }) as unknown as SessionCatalogueProjection;
  const projections = new Map([
    ["s-a", projection("s-a", "Échauffement", 600)],
    ["s-b", projection("s-b", "Étirement du quadriceps", 480)],
    ["s-c", projection("s-c", "Renforcement du genou", 900)],
    ["s-d", projection("s-d", "Dos et mobilité", 300)],
  ]);
  const routine = (patch: Partial<Routine>): Routine => ({
    id: "r",
    name: "R",
    startDate: "2026-11-16",
    time: "08:00",
    repetition: { unit: "WEEK", every: 1, weekdays: [1, 4], end: { kind: "UNTIL", date: "2026-11-30" } },
    entries: [entry("s-c")],
    exclusions: [],
    reminderMinutes: null,
    createdAt: "t",
    updatedAt: "t",
    ...patch,
  });
  const build = (
    routines: readonly Routine[],
    executions: readonly AgendaExecution[],
    programmes: Record<string, PlanProgramme> = {},
    bands: readonly PlanProgramme[] = [],
  ) => {
    const started = new Set(executions.flatMap((item) => (item.link === null ? [] : [`${item.link.routineId}|${item.link.occurrenceKey}`])));
    const now = at(20, 9);
    const occurrences = routines.flatMap((item) => withExpiry(routineOccurrences(item, (id, key) => started.has(`${id}|${key}`)), now));
    return buildPlanWeek({
      monday: "2026-11-16",
      routines,
      occurrences,
      executions,
      projections,
      isPlannable: () => true,
      now: now.getTime(),
      displayName: (item) => item.name,
      programmeOf: (item) => programmes[item.id] ?? null,
      programmes: bands,
    });
  };

  it("D-564 : occurrences dans la période sous la bande du programme, les autres sous « Sans programme » (même semaine)", () => {
    const week = build([routine({ id: "g", name: "Genou" })], [], { g: { id: "p1", name: "Genou", start: "2026-11-01", end: "2026-11-17" } });
    expect(week.groups.map((group) => [group.programme?.name ?? null, group.rows.map((row) => row.key)])).toEqual([
      ["Genou", ["g"]],
      [null, ["out|g"]],
    ]);
    const cells = (index: number) => week.groups[index]!.rows[0]!.cells.map((list) => list.length);
    // Lundi 16 dans la période, jeudi 19 après sa fin.
    expect(cells(0)).toEqual([1, 0, 0, 0, 0, 0, 0]);
    expect(cells(1)).toEqual([0, 0, 0, 1, 0, 0, 0]);
  });

  it("D-561 : bande seule d'un programme dont la période recouvre la semaine, même sans créneau ; pas hors période", () => {
    const week = build([], [], {}, [
      { id: "p1", name: "Genou", start: "2026-11-20", end: "2026-12-31" },
      { id: "p2", name: "Dos", start: "2026-12-01", end: "2026-12-31" },
    ]);
    expect(week.groups.map((group) => [group.programme?.name ?? null, group.rows.length])).toEqual([["Genou", 0]]);
  });

  it("groupes : programmes puis « Sans programme » ; routines par ordre alphabétique ; seulement celles qui ont un créneau dans la semaine", () => {
    const week = build(
      [
        routine({ id: "z", name: "Zeta" }),
        routine({ id: "a", name: "Alpha", entries: [entry("s-d")] }),
        routine({ id: "g", name: "Genou", entries: [entry("s-a", "e-g")] }),
        routine({ id: "old", name: "Ancienne", startDate: "2026-10-01", repetition: null }),
      ],
      [],
      { g: { id: "p1", name: "Rééducation genou" } },
    );
    expect(week.groups.map((group) => [group.programme?.name ?? null, group.rows.map((row) => row.title)])).toEqual([
      ["Rééducation genou", ["Genou"]],
      [null, ["Alpha", "Zeta"]],
    ]);
  });

  it("parcours : ligne de titre, une ligne par Séance ; heure réelle, « — » ; teintes par Séance", () => {
    const parcours = routine({ id: "p", name: "Mobilité du matin", time: "14:00", entries: [entry("s-a"), entry("s-b")] });
    const executions: AgendaExecution[] = [
      {
        executionId: "x",
        sessionId: "s-a",
        sessionName: "Échauffement",
        startedAt: at(16, 14, 0).toISOString(),
        endedAt: at(16, 14, 10).toISOString(),
        businessStatus: "COMPLETED",
        link: { routineId: "p", occurrenceKey: "2026-11-16T14:00", rank: 1 },
      },
      { executionId: "y", sessionId: "s-b", sessionName: "Étirement du quadriceps", startedAt: at(19, 14, 8).toISOString(), endedAt: at(19, 14, 20).toISOString(), businessStatus: "COMPLETED", link: { routineId: "p", occurrenceKey: "2026-11-19T14:00", rank: 2 } },
      // Hors planification (recette du 22/11/2026, constat a) : dans « Sans programme », sur sa propre ligne faute de routine de la
      // même Séance, case marquée, hors du Total. [Groupe « Hors planification » à part (p32-hors-plan) — remplacé.]
      { executionId: "f", sessionId: "s-c", sessionName: "Renforcement du genou", startedAt: at(17, 9).toISOString(), endedAt: at(17, 9, 15).toISOString(), businessStatus: "COMPLETED", link: null },
    ];
    const week = build([parcours], executions);
    const rows = week.groups[0]!.rows;
    expect(rows.map((row) => [row.kind, row.title])).toEqual([
      ["TITLE", "Mobilité du matin"],
      ["SESSION", "Échauffement"],
      ["SESSION", "Étirement du quadriceps"],
      ["UNPLANNED", "Renforcement du genou"],
    ]);
    const labels = (index: number) => rows[index]!.cells.map((cells) => cells.map((cell) => `${cell.label}:${cell.tint}`).join(","));
    // Jeudi : la 2e Séance a été rattrapée seule, la 1re reste à rattraper (rouge, heure prévue).
    expect(labels(1)).toEqual(["14h:COMPLETED", "", "", "14h:MISSED", "", "", ""]);
    // Lundi : Séance suivante non exécutée d'un parcours commencé — « — », rouge ; jeudi : heure réelle.
    expect(labels(2)).toEqual(["—:MISSED", "", "", "14h08:COMPLETED", "", "", ""]);
    expect(rows[2]!.last).toBe(true);
    expect(week.groups.map((group) => group.key)).toEqual(["none"]);
    expect(rows[3]!.sessionId).toBe("s-c");
    expect(rows[3]!.cells.map((cells) => cells.map((cell) => `${cell.label}:${cell.tint}:${cell.unplanned === true}`).join(","))).toEqual(["", "9h:COMPLETED:true", "", "", "", "", ""]);
    expect(week.dayTotals[1]).toBeNull();
  });

  // Recette du 22/11/2026 (constat a) : une Séance exécutée hors routine rejoint la ligne de la routine à une Séance identique,
  // « Sans programme », avec une case marquée ; ses créneaux restent les mêmes et elle reste hors du Total.
  it("hors planification : sur la ligne d'une routine de la même Séance, case marquée, hors du Total", () => {
    const single = routine({ id: "s", name: "Dos", time: "18:30", repetition: null, startDate: "2026-11-16", entries: [entry("s-d")] });
    const executions: AgendaExecution[] = [
      { executionId: "f", sessionId: "s-d", sessionName: "Dos", startedAt: at(17, 9).toISOString(), endedAt: at(17, 9, 15).toISOString(), businessStatus: "COMPLETED", link: null },
    ];
    const week = build([single], executions);
    const rows = week.groups.flatMap((group) => group.rows);
    expect(rows.map((row) => [row.kind, row.title])).toEqual([["ROUTINE", "Dos"]]);
    expect(rows[0]!.cells.map((cells) => cells.map((cell) => `${cell.label}:${cell.unplanned === true}`).join(","))).toEqual(["18h30:false", "9h:true", "", "", "", "", ""]);
    expect(week.dayTotals[1]).toBeNull();
  });

  it("deux créneaux le même jour : empilés dans l'ordre chronologique ; Total par jour et par semaine, jours passés compris", () => {
    const single = routine({
      id: "s",
      name: "Dos",
      time: "18:30",
      entries: [entry("s-d")],
      overrides: [
        // Créneau ajouté le lundi à 7h, en plus de celui de 18h30.
        { key: "2026-11-16T07:00+A1", index: 1, date: "2026-11-16", time: "07:00", sessions: null, reminderOverridden: false, reminderMinutes: null, startedAt: null, added: true },
      ],
    });
    const parcours = routine({ id: "p", name: "Mobilité", time: "14:00", repetition: null, entries: [entry("s-a"), entry("s-b")] });
    const week = build([single, parcours], []);
    const dos = week.groups[0]!.rows.find((row) => row.title === "Dos")!;
    expect(dos.cells[0]!.map((cell) => cell.label)).toEqual(["7h", "18h30"]);
    // Lundi : 5′ + 5′ (Dos) + 10′ + 8′ (parcours) ; jeudi : 5′ ; autres jours : « — ».
    expect(week.dayTotals.map(formatPlanTotal)).toEqual(["28’", "—", "—", "5’", "—", "—", "—"]);
    expect(formatPlanTotal(week.weekTotal)).toBe("33’");
    expect(week.occurrencesOf("s", "2026-11-16").map((occurrence) => occurrence.key)).toEqual(["2026-11-16T07:00+A1", "2026-11-16T18:30"]);
  });
});

describe("créneau ajouté hors de la répétition (RM-273)", () => {
  let database: NodeSqliteDatabase;
  let planning: PlanningService;
  let linked: OccurrenceExecution[];
  let ids: number;

  const draft = (patch: Partial<RoutineDraft> = {}): RoutineDraft => ({
    name: "Genou",
    startDate: "2026-11-16",
    time: "08:00",
    repetition: { unit: "WEEK", every: 1, weekdays: [1], end: { kind: "UNTIL", date: "2026-11-30" } },
    entries: [entry("s-a"), entry("s-b")],
    ...patch,
  });
  const keys = async () => (await planning.rangeOccurrences("2026-11-01", "2026-12-31", () => true)).map((occurrence) => `${occurrence.key}@${occurrence.date}T${occurrence.time}`);

  beforeEach(async () => {
    database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database);
    linked = [];
    ids = 0;
    planning = new PlanningService({
      repository: new SqliteRoutineRepository(database),
      newId: () => `r${++ids}`,
      now: () => at(15, 12),
      occurrenceExecutions: () => Promise.resolve(linked),
    });
    const created = await planning.createRoutine(draft());
    if (created.status !== "SAVED") throw new Error(created.status);
  });

  afterEach(() => {
    database.close();
  });

  const add = (date: string, time = "08:00") =>
    planning.addOccurrence("r1", {
      date,
      time,
      sessions: [
        { sessionId: "s-a", entryId: "e-s-a", origin: "ROUTINE", active: true },
        { sessionId: "s-b", entryId: "e-s-b", origin: "ROUTINE", active: true },
      ],
      reminderMinutes: null,
    });

  it("pré-rempli : date touchée, heure habituelle, parcours entier ; enregistré à part, la répétition ne change pas", async () => {
    const prepared = await planning.prepareAddedOccurrence("r1", "2026-11-18");
    expect(prepared?.occurrence).toMatchObject({ date: "2026-11-18", time: "08:00", added: true });
    expect(prepared?.occurrence.contents.map((content) => content.sessionId)).toEqual(["s-a", "s-b"]);
    expect((await add("2026-11-18")).status).toBe("SAVED");
    const routine = await planning.getRoutine("r1");
    expect(routine?.repetition).toEqual(draft().repetition);
    expect(routine?.overrides).toEqual([
      { key: "2026-11-18T08:00+A1", index: 1, date: "2026-11-18", time: "08:00", sessions: null, reminderOverridden: false, reminderMinutes: null, startedAt: null, added: true },
    ]);
    expect(await keys()).toEqual([
      "2026-11-16T08:00@2026-11-16T08:00",
      "2026-11-18T08:00+A1@2026-11-18T08:00",
      "2026-11-23T08:00@2026-11-23T08:00",
      "2026-11-30T08:00@2026-11-30T08:00",
    ]);
  });

  it("protégé d'un changement global : l'heure et la répétition de la routine changent, pas le créneau ajouté ; même jour qu'un créneau produit : distinct", async () => {
    expect((await add("2026-11-25", "18:00")).status).toBe("SAVED");
    expect((await planning.updateRoutine("r1", draft({ time: "09:00", repetition: { unit: "WEEK", every: 1, weekdays: [3], end: { kind: "UNTIL", date: "2026-11-30" } } }))).status).toBe("SAVED");
    expect(await keys()).toEqual([
      "2026-11-18T09:00@2026-11-18T09:00",
      "2026-11-25T09:00@2026-11-25T09:00",
      "2026-11-25T18:00+A1@2026-11-25T18:00",
    ]);
  });

  it("modifiable comme les autres créneaux, il reste ajouté ; supprimé avec la routine sans historique", async () => {
    await add("2026-11-18");
    expect((await planning.updateOccurrence("r1", "2026-11-18T08:00+A1", { date: "2026-11-19", time: "07:30", sessions: [{ sessionId: "s-a", entryId: "e-s-a", origin: "ROUTINE", active: true }, { sessionId: "s-b", entryId: "e-s-b", origin: "ROUTINE", active: true }], reminderMinutes: null })).status).toBe("SAVED");
    expect((await planning.getRoutine("r1"))?.overrides?.[0]).toMatchObject({ key: "2026-11-18T08:00+A1", date: "2026-11-19", time: "07:30", added: true });
    // Supprimé seul depuis l'Agenda (D-537).
    expect(await planning.excludeOccurrence("r1", "2026-11-18T08:00+A1")).toBe(true);
    expect((await keys()).some((key) => key.includes("+A1"))).toBe(false);
    await add("2026-11-20");
    expect(await planning.deleteRoutine("r1")).toBe(true);
    expect(await planning.getRoutine("r1")).toBeNull();
  });

  it("routine avec historique supprimée : le créneau ajouté non commencé est supprimé, le créneau ajouté commencé est conservé et reste figé", async () => {
    await add("2026-11-18");
    await add("2026-11-20");
    linked = [{ executionId: "x", routineId: "r1", occurrenceKey: "2026-11-18T08:00+A1", rank: 1, sessionId: "s-a", startedAt: "2026-11-18T07:00:00.000Z", businessStatus: "COMPLETED" }];
    // Commencé : plus modifiable (D-536).
    expect((await planning.updateOccurrence("r1", "2026-11-18T08:00+A1", { date: "2026-11-18", time: "10:00", sessions: [{ sessionId: "s-a", entryId: "e-s-a", origin: "ROUTINE", active: true }], reminderMinutes: null })).status).toBe("STARTED");
    expect(await planning.deleteRoutine("r1")).toBe(true);
    expect(await keys()).toEqual(["2026-11-18T08:00+A1@2026-11-18T08:00"]);
    expect((await planning.getRoutine("r1"))?.overrides?.[0]).toMatchObject({ key: "2026-11-18T08:00+A1", added: true });
    expect((await planning.getRoutine("r1"))?.overrides?.[0]?.startedAt).not.toBeNull();
  });
});
