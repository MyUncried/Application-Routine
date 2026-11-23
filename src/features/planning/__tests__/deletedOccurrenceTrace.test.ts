import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { EVERY_TIME, type RoutineDraft, type RoutineEntry } from "@/domain/planning/Routine";
import { deletedOccurrences, routineOccurrences } from "@/domain/planning/occurrences";
import type { OccurrenceExecution } from "@/domain/planning/occurrenceExecutions";
import { PlanningService } from "@/features/planning/PlanningService";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteRoutineRepository } from "@/infrastructure/database/repositories/SqliteRoutineRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * D-568 / RM-276 (Hermann, 23/11/2026) — trace d'une occurrence supprimée : avec trace (occurrence prévue par la répétition,
 * supprimée depuis l'Agenda), sans trace (Journal, réduction de période, programme, hors période D-566, créneau ajouté RM-273,
 * créneau unique), rétablissement avant et après la date, Plan et Total, exclusion du suivi. Une suite verte ne remplace pas la
 * recette sur iPhone.
 */

let database: NodeSqliteDatabase;
let planning: PlanningService;
let repository: SqliteRoutineRepository;
let linked: OccurrenceExecution[] = [];
let ids = 0;

const A: RoutineEntry = { id: "e-a", sessionId: "s-a", frequency: EVERY_TIME };
const B: RoutineEntry = { id: "e-b", sessionId: "s-b", frequency: EVERY_TIME };
// « Maintenant » : lundi 12 août 2030, midi.
const NOW = new Date(2030, 7, 12, 12, 0);
const draft = (patch: Partial<RoutineDraft> = {}): RoutineDraft => ({
  name: "Dos et mobilité",
  startDate: "2030-08-05",
  time: "18:30",
  // Lundis et jeudis du 5 au 29 août 2030.
  repetition: { unit: "WEEK", every: 1, weekdays: [1, 4], end: { kind: "UNTIL", date: "2030-08-29" } },
  entries: [A],
  reminderMinutes: null,
  ...patch,
});

async function create(patch: Partial<RoutineDraft> = {}): Promise<string> {
  const created = await planning.createRoutine(draft(patch));
  if (created.status !== "SAVED") throw new Error(created.status);
  return created.routine.id;
}

const routine = async (id: string) => (await repository.get(id))!;
const plannedKeys = async (id: string) => routineOccurrences(await routine(id)).map((occurrence) => occurrence.key);
const traceKeys = async (id: string) => deletedOccurrences(await routine(id)).map((occurrence) => occurrence.key);

beforeEach(async () => {
  database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
  linked = [];
  ids = 0;
  repository = new SqliteRoutineRepository(database);
  planning = new PlanningService({
    repository,
    newId: () => `id-${++ids}`,
    now: () => NOW,
    occurrenceExecutions: () => Promise.resolve(linked),
  });
});

afterEach(() => database.close());

describe("D-568 — avec trace", () => {
  it("supprimer depuis l'Agenda une occurrence de la répétition : état « Supprimée » à sa date et heure, hors Plan, Total et suivi", async () => {
    const id = await create();
    expect(await planning.excludeOccurrence(id, "2030-08-15T18:30")).toBe(true);
    const stored = await routine(id);
    // Extension de l'exclusion : aucune ligne `routine_exclusions`, l'occurrence reste enregistrée (séance « supprimée »).
    expect(stored.exclusions).toEqual([]);
    expect(stored.overrides?.[0]?.sessions).toEqual([{ sessionId: "s-a", entryId: "e-a", origin: "ROUTINE", active: false, deleted: true }]);
    // Plan, Total, rappels, comptages : l'occurrence n'est plus prévue (ni manquée ni réalisée).
    expect(await plannedKeys(id)).not.toContain("2030-08-15T18:30");
    expect((await planning.rangeOccurrences("2030-08-11", "2030-08-17", () => true)).map((occurrence) => occurrence.key)).toEqual(["2030-08-12T18:30"]);
    expect(await planning.pendingSlotCount(id)).toBe(6);
    // Agenda : trace à la date et à l'heure prévues.
    const agenda = await planning.agendaData("2030-08-11", "2030-08-17");
    expect(agenda.occurrences.map((occurrence) => occurrence.key)).toEqual(["2030-08-12T18:30"]);
    expect(agenda.deletedOccurrences.map((occurrence) => [occurrence.key, occurrence.date, occurrence.time, occurrence.deleted])).toEqual([
      ["2030-08-15T18:30", "2030-08-15", "18:30", true],
    ]);
  });

  it("une occurrence déplacée à la main garde sa date et son heure prévues une fois supprimée", async () => {
    const id = await create();
    const moved = await planning.updateOccurrence(id, "2030-08-15T18:30", {
      date: "2030-08-16",
      time: "07:00",
      sessions: [{ sessionId: "s-a", entryId: "e-a", origin: "ROUTINE", active: true }],
      reminderMinutes: null,
    });
    expect(moved.status).toBe("SAVED");
    await planning.excludeOccurrence(id, "2030-08-15T18:30");
    expect(deletedOccurrences(await routine(id)).map((occurrence) => [occurrence.date, occurrence.time])).toEqual([["2030-08-16", "07:00"]]);
  });

  it("parcours : trace par Séance ; toutes supprimées, le créneau reste, supprimé ; rétablir une Séance", async () => {
    const id = await create({ entries: [A, B] });
    expect(await planning.removeOccurrenceSession(id, "2030-08-15T18:30", 1)).toBe("REMOVED");
    let partial = routineOccurrences(await routine(id)).find((occurrence) => occurrence.key === "2030-08-15T18:30")!;
    expect(partial.contents.map((content) => content.sessionId)).toEqual(["s-a"]);
    expect(partial.sessions[1]).toMatchObject({ sessionId: "s-b", active: false, deleted: true });
    expect(await planning.removeOccurrenceSession(id, "2030-08-15T18:30", 0)).toBe("SLOT_REMOVED");
    expect((await routine(id)).exclusions).toEqual([]);
    expect(await plannedKeys(id)).not.toContain("2030-08-15T18:30");
    const whole = deletedOccurrences(await routine(id));
    expect(whole.map((occurrence) => occurrence.contents.map((content) => content.sessionId))).toEqual([["s-a", "s-b"]]);
    expect(await planning.restoreOccurrence(id, "2030-08-15T18:30", 1)).toBe("RESTORED");
    partial = routineOccurrences(await routine(id)).find((occurrence) => occurrence.key === "2030-08-15T18:30")!;
    expect(partial.contents.map((content) => content.sessionId)).toEqual(["s-b"]);
    expect(await planning.restoreOccurrence(id, "2030-08-15T18:30", null)).toBe("RESTORED");
    // Redevenue identique à la routine : plus enregistrée.
    expect((await routine(id)).overrides ?? []).toEqual([]);
  });

  it("rétablir : l'occurrence redevient prévue tant que la date n'est pas passée ; refusé après la date", async () => {
    const id = await create();
    await planning.excludeOccurrence(id, "2030-08-15T18:30");
    await planning.excludeOccurrence(id, "2030-08-08T18:30");
    // Date passée (jeudi 8 août, « maintenant » = 12 août) : la trace reste.
    expect(await planning.restoreOccurrence(id, "2030-08-08T18:30", null)).toBe("PAST");
    expect(await traceKeys(id)).toEqual(["2030-08-08T18:30", "2030-08-15T18:30"]);
    expect(await planning.restoreOccurrence(id, "2030-08-15T18:30", null)).toBe("RESTORED");
    expect(await plannedKeys(id)).toContain("2030-08-15T18:30");
    expect(await traceKeys(id)).toEqual(["2030-08-08T18:30"]);
    // Le jour même, la date n'est pas passée.
    await planning.excludeOccurrence(id, "2030-08-12T18:30");
    expect(await planning.restoreOccurrence(id, "2030-08-12T18:30", null)).toBe("RESTORED");
  });
});

describe("D-568 — sans trace", () => {
  it("créneau unique : il disparaît (retrait)", async () => {
    const id = await create({ repetition: null, startDate: "2030-08-15" });
    await planning.excludeOccurrence(id, "2030-08-15T18:30");
    expect((await routine(id)).exclusions).toEqual(["2030-08-15T18:30"]);
    expect(await traceKeys(id)).toEqual([]);
  });

  it("créneau ajouté à la main (RM-273) : il disparaît", async () => {
    const id = await create();
    const added = await planning.addOccurrence(id, {
      date: "2030-08-14",
      time: "10:00",
      sessions: [{ sessionId: "s-a", entryId: "e-a", origin: "ROUTINE", active: true }],
      reminderMinutes: null,
    });
    expect(added.status).toBe("SAVED");
    const key = routineOccurrences(await routine(id)).find((occurrence) => occurrence.added === true)!.key;
    await planning.excludeOccurrence(id, key);
    expect((await routine(id)).exclusions).toEqual([key]);
    expect(await traceKeys(id)).toEqual([]);
  });

  it("suppression de la routine depuis le Journal : aucune trace ne reste", async () => {
    const id = await create();
    await planning.excludeOccurrence(id, "2030-08-15T18:30");
    // Avec historique : la routine reste, sans créneau ni trace.
    linked = [{ executionId: "x1", routineId: id, occurrenceKey: "2030-08-05T18:30", rank: 1, startedAt: "2030-08-05T18:30:00.000Z", businessStatus: "COMPLETED" }];
    expect(await planning.deleteRoutine(id)).toBe(true);
    expect(await traceKeys(id)).toEqual([]);
    expect((await planning.agendaData("2030-08-11", "2030-08-17")).deletedOccurrences).toEqual([]);
  });

  it("réduction de la période : la trace disparaît et ne revient pas si la période est de nouveau étendue", async () => {
    const id = await create();
    await planning.excludeOccurrence(id, "2030-08-26T18:30");
    const shortened = await planning.updateRoutine(id, draft({ repetition: { unit: "WEEK", every: 1, weekdays: [1, 4], end: { kind: "UNTIL", date: "2030-08-20" } } }));
    expect(shortened.status).toBe("SAVED");
    expect(await traceKeys(id)).toEqual([]);
    await planning.updateRoutine(id, draft());
    expect(await traceKeys(id)).toEqual([]);
    expect(await plannedKeys(id)).toContain("2030-08-26T18:30");
  });

  it("suppression d'un programme (créneaux retirés de la période) : trace retirée, non comptée", async () => {
    const id = await create();
    await planning.excludeOccurrence(id, "2030-08-15T18:30");
    const count = await planning.removeUpcomingSlots(id, (date) => date >= "2030-08-11" && date <= "2030-08-20", { includePast: true });
    expect(count).toBe(2); // lundis 12 et 19 août ; la trace du 15 n'est pas comptée
    expect(await traceKeys(id)).toEqual([]);
    expect(await plannedKeys(id)).not.toContain("2030-08-15T18:30");
  });

  it("créneaux hors période supprimés (D-566) : la trace hors période disparaît, non comptée", async () => {
    const id = await create({ repetition: { unit: "WEEK", every: 1, weekdays: [1, 4], end: { kind: "FOR", count: 4 } } });
    await planning.excludeOccurrence(id, "2030-08-22T18:30");
    const count = await planning.removeOutsidePeriod(id, "2030-08-05", "2030-08-18");
    expect(count).toBe(3); // 19, 26 et 29 août
    expect(await traceKeys(id)).toEqual([]);
  });

  it("migration : les exclusions existantes restent sans trace (aucune reprise rétroactive)", async () => {
    const id = await create();
    await repository.addExclusion(id, "2030-08-15T18:30", NOW.toISOString());
    expect(await traceKeys(id)).toEqual([]);
    expect(await plannedKeys(id)).not.toContain("2030-08-15T18:30");
  });
});
