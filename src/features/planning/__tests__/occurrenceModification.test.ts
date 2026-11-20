import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { EVERY_TIME, type RoutineDraft, type RoutineEntry } from "@/domain/planning/Routine";
import { occurrenceExecutionStatus, type OccurrenceExecution } from "@/domain/planning/occurrenceExecutions";
import type { Occurrence } from "@/domain/planning/occurrences";
import { occurrenceForm, occurrenceSessions, toggleOccurrencePoint, withOccurrenceSelection } from "@/features/planning/occurrenceDraft";
import { PlanningService } from "@/features/planning/PlanningService";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteRoutineRepository } from "@/infrastructure/database/repositories/SqliteRoutineRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * D-536 / D-537 (20/11/2026) — figement des occurrences commencées, protection par groupe, modification d'une occurrence
 * seule, suppression et archivage. Cas B et C du prompt « occurrence seule » et cas de suppression du prompt D-537.
 * Une suite verte ne remplace pas la recette sur iPhone.
 */

let database: NodeSqliteDatabase;
let planning: PlanningService;
let linked: OccurrenceExecution[] = [];
let ids = 0;

const A: RoutineEntry = { id: "e-a", sessionId: "s-a", frequency: EVERY_TIME };
const B: RoutineEntry = { id: "e-b", sessionId: "s-b", frequency: EVERY_TIME };
const draft = (patch: Partial<RoutineDraft> = {}): RoutineDraft => ({
  name: "Genou",
  startDate: "2030-08-05",
  time: "08:00",
  // Lundis et jeudis du 5 au 29 août 2030 : 8 créneaux.
  repetition: { unit: "WEEK", every: 1, weekdays: [1, 4], end: { kind: "UNTIL", date: "2030-08-29" } },
  entries: [A, B],
  reminderMinutes: 15,
  ...patch,
});
const link = (occurrenceKey: string, rank: number, businessStatus: OccurrenceExecution["businessStatus"]): OccurrenceExecution => ({
  executionId: `x-${occurrenceKey}-${rank}`,
  routineId: "r1",
  occurrenceKey,
  rank,
  startedAt: `${occurrenceKey}:30.000Z`,
  businessStatus,
});
const all = async () => planning.rangeOccurrences("2030-08-01", "2030-09-30", () => true);
const byKey = async (key: string) => (await all()).find((occurrence) => occurrence.key === key);
const sessionsOf = (occurrence: Occurrence | undefined) => occurrence?.contents.map((content) => content.sessionId);

beforeEach(async () => {
  database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
  linked = [];
  ids = 0;
  planning = new PlanningService({
    repository: new SqliteRoutineRepository(database),
    newId: () => (ids++ === 0 ? "r1" : `id-${ids}`),
    now: () => new Date(2030, 7, 10, 12, 0),
    occurrenceExecutions: () => Promise.resolve(linked),
  });
  const created = await planning.createRoutine(draft());
  if (created.status !== "SAVED") throw new Error(created.status);
});

afterEach(() => {
  database.close();
});

describe("D-536 — modification de la routine depuis le Journal (cas B)", () => {
  it("B1 / B5 : une occurrence Complétée (passée ou faite en avance) garde ses séances d'origine et son statut", async () => {
    linked = [link("2030-08-05T08:00", 1, "COMPLETED"), link("2030-08-05T08:00", 2, "COMPLETED"), link("2030-08-29T08:00", 1, "COMPLETED"), link("2030-08-29T08:00", 2, "COMPLETED")];
    await planning.updateRoutine("r1", draft({ entries: [A, B, { id: "e-c", sessionId: "s-c", frequency: EVERY_TIME }] }));
    for (const key of ["2030-08-05T08:00", "2030-08-29T08:00"]) {
      const occurrence = await byKey(key);
      expect(sessionsOf(occurrence)).toEqual(["s-a", "s-b"]);
      expect(occurrence?.started).toBe(true);
      expect(occurrenceExecutionStatus(occurrence!.contents.length, linked.filter((item) => item.occurrenceKey === key))).toBe("COMPLETED");
    }
    expect(sessionsOf(await byKey("2030-08-12T08:00"))).toEqual(["s-a", "s-b", "s-c"]);
  });

  it("B2 / B3 / B4 : inverser l'ordre ne change que les occurrences non commencées ; en cours inchangée ; rouge suit", async () => {
    // 5 août : en cours (séance lancée, non terminée) ; 8 août : passée non commencée (rouge).
    linked = [link("2030-08-05T08:00", 1, null)];
    await planning.updateRoutine("r1", draft({ entries: [B, A] }));
    expect(sessionsOf(await byKey("2030-08-05T08:00"))).toEqual(["s-a", "s-b"]);
    expect(sessionsOf(await byKey("2030-08-08T08:00"))).toEqual(["s-b", "s-a"]);
    expect((await byKey("2030-08-08T08:00"))?.started).toBe(false);
    expect(sessionsOf(await byKey("2030-08-12T08:00"))).toEqual(["s-b", "s-a"]);
  });

  it("B6 : la confirmation compte les créneaux non commencés", async () => {
    linked = [link("2030-08-05T08:00", 1, "COMPLETED")];
    expect(await planning.pendingSlotCount("r1")).toBe(7);
  });

  it("une occurrence commencée reste à sa date d'origine quand la récurrence change (q21-modele)", async () => {
    linked = [link("2030-08-08T08:00", 1, "PARTIAL")];
    await planning.updateRoutine("r1", draft({ repetition: { unit: "WEEK", every: 1, weekdays: [2], end: { kind: "UNTIL", date: "2030-08-29" } } }));
    // D-540 : le 5 août, expiré (le 8 est passé), n'est pas modifié par le changement de la routine : il reste.
    expect((await all()).map((occurrence) => occurrence.key)).toEqual([
      "2030-08-05T08:00",
      "2030-08-06T08:00",
      "2030-08-08T08:00",
      "2030-08-13T08:00",
      "2030-08-20T08:00",
      "2030-08-27T08:00",
    ]);
  });
});

describe("D-536 — modification d'une occurrence seule (cas C)", () => {
  const change = async (key: string, patch: Partial<Parameters<PlanningService["updateOccurrence"]>[2]>) => {
    const found = await planning.getOccurrence("r1", key);
    return planning.updateOccurrence("r1", key, {
      date: found!.occurrence.date,
      time: found!.occurrence.time,
      sessions: found!.occurrence.sessions,
      reminderMinutes: found!.occurrence.reminderMinutes,
      ...patch,
    });
  };

  it("C1 / C2 / C3 : déplacée, elle seule change ; elle suit la séquence mais pas la récurrence", async () => {
    expect(await change("2030-08-12T08:00", { date: "2030-08-13", time: "18:00" })).toEqual({ status: "SAVED" });
    const moved = await byKey("2030-08-12T08:00");
    expect([moved?.date, moved?.time, moved?.manual.dateTime]).toEqual(["2030-08-13", "18:00", true]);
    expect((await all()).length).toBe(8);
    expect((await byKey("2030-08-15T08:00"))?.date).toBe("2030-08-15");
    await planning.updateRoutine("r1", draft({ entries: [B, A] }));
    expect(sessionsOf(await byKey("2030-08-12T08:00"))).toEqual(["s-b", "s-a"]);
    expect((await byKey("2030-08-12T08:00"))?.date).toBe("2030-08-13");
    await planning.updateRoutine("r1", draft({ entries: [B, A], repetition: { unit: "WEEK", every: 1, weekdays: [3], end: { kind: "UNTIL", date: "2030-08-29" } } }));
    const kept = await byKey("2030-08-12T08:00");
    expect([kept?.date, kept?.time]).toEqual(["2030-08-13", "18:00"]);
  });

  it("C4 : désactiver une pastille ne concerne que cette occurrence ; « Complétée » sur les séances actives", async () => {
    const found = await planning.getOccurrence("r1", "2030-08-12T08:00");
    const sessions = found!.occurrence.sessions.map((session) => (session.sessionId === "s-b" ? { ...session, active: false } : session));
    await change("2030-08-12T08:00", { sessions });
    const occurrence = await byKey("2030-08-12T08:00");
    expect(sessionsOf(occurrence)).toEqual(["s-a"]);
    expect(sessionsOf(await byKey("2030-08-15T08:00"))).toEqual(["s-a", "s-b"]);
    expect(occurrenceExecutionStatus(occurrence!.contents.length, [link("2030-08-12T08:00", 1, "COMPLETED")])).toBe("COMPLETED");
  });

  it("C5 / C6 : ajouter puis retirer une séance ; une séance de la routine se désactive sans se retirer ; protégée d'un changement de séquence", async () => {
    const found = await planning.getOccurrence("r1", "2030-08-12T08:00");
    const routine = found!.routine;
    let local = 0;
    const built = occurrenceForm(routine, found!.occurrence, () => `local-${++local}`);
    // « Changer » : la séance s-a désélectionnée reste ; s-c est ajoutée.
    const added = withOccurrenceSelection(built.form, built.editing, ["s-b", "s-c"], () => `local-${++local}`);
    expect(added.form.entries.map((entry) => entry.sessionId)).toEqual(["s-a", "s-b", "s-c"]);
    expect(occurrenceSessions(added.form, added.editing)).toEqual([
      { sessionId: "s-a", entryId: "e-a", origin: "ROUTINE", active: true },
      { sessionId: "s-b", entryId: "e-b", origin: "ROUTINE", active: true },
      { sessionId: "s-c", entryId: null, origin: "ADDED", active: true },
    ]);
    await change("2030-08-12T08:00", { sessions: occurrenceSessions(added.form, added.editing) });
    expect(sessionsOf(await byKey("2030-08-12T08:00"))).toEqual(["s-a", "s-b", "s-c"]);
    await planning.updateRoutine("r1", draft({ entries: [B, A] }));
    expect(sessionsOf(await byKey("2030-08-12T08:00"))).toEqual(["s-a", "s-b", "s-c"]);
    // Retrait de la séance ajoutée.
    const removed = withOccurrenceSelection(added.form, added.editing, ["s-a", "s-b"], () => `local-${++local}`);
    expect(removed.form.entries.map((entry) => entry.sessionId)).toEqual(["s-a", "s-b"]);
    // Dernière pastille active : refusée.
    const single = toggleOccurrencePoint(toggleOccurrencePoint(built.form.grid, 0, built.editing.column), 1, built.editing.column);
    expect(single.points.filter((row) => row[built.editing.column] === true)).toHaveLength(1);
  });

  it("C7 : le rappel d'une occurrence n'est pas écrasé par un changement global", async () => {
    await change("2030-08-12T08:00", { reminderMinutes: 60 });
    await planning.updateRoutine("r1", draft({ reminderMinutes: 30 }));
    expect((await byKey("2030-08-12T08:00"))?.reminderMinutes).toBe(60);
    expect((await byKey("2030-08-15T08:00"))?.reminderMinutes).toBe(30);
  });

  it("C9 / C10 : occurrence commencée non modifiable ; occurrence rouge reprogrammable", async () => {
    linked = [link("2030-08-05T08:00", 1, "PARTIAL")];
    expect(await change("2030-08-05T08:00", { time: "09:00" })).toEqual({ status: "STARTED" });
    expect(await change("2030-08-08T08:00", { date: "2030-08-11" })).toEqual({ status: "SAVED" });
    expect((await byKey("2030-08-08T08:00"))?.date).toBe("2030-08-11");
  });

  it("revenir aux valeurs de la routine efface l'enregistrement (seuls les groupes modifiés sont enregistrés)", async () => {
    await change("2030-08-12T08:00", { time: "09:00" });
    await change("2030-08-12T08:00", { time: "08:00" });
    expect((await planning.getRoutine("r1"))?.overrides ?? []).toEqual([]);
  });
});

describe("D-537 — suppression", () => {
  it("Agenda : une occurrence commencée ne peut pas être supprimée", async () => {
    linked = [link("2030-08-05T08:00", 1, "COMPLETED")];
    expect(await planning.excludeOccurrence("r1", "2030-08-05T08:00")).toBe(false);
    expect(await planning.excludeOccurrence("r1", "2030-08-08T08:00")).toBe(true);
  });

  it("Journal : sans historique, la routine est supprimée ; avec, ses créneaux non commencés sont retirés et elle est terminée (D-540)", async () => {
    expect(await planning.deletionPlan("r1")).toEqual({ history: false, count: 8 });
    linked = [link("2030-08-05T08:00", 1, "COMPLETED")];
    expect(await planning.deletionPlan("r1")).toEqual({ history: true, count: 7 });
    expect(await planning.deleteRoutine("r1")).toBe(true);
    // D-540 : plus d'archivage ; la routine reste, sans créneau à venir ni rattrapable → terminée.
    expect((await planning.getRoutine("r1"))?.archivedAt ?? null).toBeNull();
    expect((await all()).map((occurrence) => occurrence.key)).toEqual(["2030-08-05T08:00"]);
    expect((await planning.routineActivity()).get("r1")).toBe(false);
    // Prolonger la date de fin la réactive (état calculé).
    await planning.updateRoutine("r1", draft({ repetition: { unit: "WEEK", every: 1, weekdays: [1, 4], end: { kind: "UNTIL", date: "2030-09-30" } } }));
    expect((await planning.routineActivity()).get("r1")).toBe(true);
    linked = [];
    const other = await planning.createRoutine(draft({ name: "Autre", entries: [{ ...A, id: "e-a2" }] }));
    if (other.status !== "SAVED") throw new Error(other.status);
    expect(await planning.deleteRoutine(other.routine.id)).toBe(true);
    expect(await planning.getRoutine(other.routine.id)).toBeNull();
  });
});

describe("D-540 — créneau rattrapable, expiré ; routine active ou terminée", () => {
  // Maintenant : samedi 10 août 2030, 12 h. Lundis et jeudis du 5 au 29 août.
  it("rattrapable jusqu'au début du créneau suivant (exécuté ou non), puis expiré", async () => {
    const byKeyNow = async (key: string) => (await all()).find((occurrence) => occurrence.key === key);
    // 5 août : le créneau suivant (8 août) a commencé → expiré. 8 août : rattrapable jusqu'au 12.
    expect((await byKeyNow("2030-08-05T08:00"))?.expired).toBe(true);
    expect((await byKeyNow("2030-08-08T08:00"))?.expired).toBe(false);
    linked = [link("2030-08-08T08:00", 1, "COMPLETED")];
    expect((await byKeyNow("2030-08-05T08:00"))?.expired).toBe(true);
    // Supprimer le créneau suivant recalcule la règle : le 5 redevient rattrapable jusqu'au 12.
    linked = [];
    await planning.excludeOccurrence("r1", "2030-08-08T08:00");
    expect((await byKeyNow("2030-08-05T08:00"))?.expired).toBe(false);
  });

  it("dernier créneau : rattrapable 10 jours après sa date, puis expiré ; routine active puis terminée", async () => {
    const at = (day: number) =>
      new PlanningService({ repository: new SqliteRoutineRepository(database), newId: () => "x", now: () => new Date(2030, 7, day, 12, 0), occurrenceExecutions: () => Promise.resolve(linked) });
    // Créneau unique le 5 août.
    await planning.updateRoutine("r1", draft({ repetition: null }));
    const occurrence = async (day: number) => (await at(day).rangeOccurrences("2030-08-01", "2030-08-31", () => true))[0];
    expect((await occurrence(15))?.expired).toBe(false);
    expect((await occurrence(16))?.expired).toBe(true);
    expect((await at(15).routineActivity()).get("r1")).toBe(true);
    expect((await at(16).routineActivity()).get("r1")).toBe(false);
  });

  it("un créneau expiré n'est ni modifié par un changement de la routine ni compté dans « N créneaux … modifiés »", async () => {
    // 5 août expiré (le 8 est passé) ; 8 août rattrapable ; 6 à venir.
    expect(await planning.pendingSlotCount("r1")).toBe(7);
    await planning.updateRoutine("r1", draft({ entries: [B, A] }));
    expect(sessionsOf(await byKey("2030-08-05T08:00"))).toEqual(["s-a", "s-b"]);
    expect(sessionsOf(await byKey("2030-08-08T08:00"))).toEqual(["s-b", "s-a"]);
    // Supprimé avec la routine (sans historique : suppression complète).
    expect(await planning.deletionPlan("r1")).toEqual({ history: false, count: 8 });
  });
});

describe("D-539 — routines proposées par le filtre de l'Agenda", () => {
  it("au moins un créneau, archivées comprises, ordre alphabétique ; créneaux à venir", async () => {
    const other = await planning.createRoutine(draft({ name: "Abdos", entries: [{ ...A, id: "e-a3" }] }));
    if (other.status !== "SAVED") throw new Error(other.status);
    // Routine sans aucun créneau : tous retirés.
    const empty = await planning.createRoutine(draft({ name: "Zéro", entries: [{ ...A, id: "e-a4" }], repetition: null }));
    if (empty.status !== "SAVED") throw new Error(empty.status);
    await planning.excludeOccurrence(empty.routine.id, "2030-08-05T08:00");
    // « Genou » terminée (supprimée avec un créneau commencé, D-540).
    linked = [link("2030-08-05T08:00", 1, "COMPLETED")];
    await planning.deleteRoutine("r1");
    const choices = await planning.routineFilterChoices();
    expect(choices.map((choice) => choice.routine.name)).toEqual(["Abdos", "Genou"]);
    // Maintenant : 10 août 2030 à midi ; Abdos garde 6 créneaux à venir (lundis et jeudis du 12 au 29 août).
    expect(choices.map((choice) => choice.upcoming)).toEqual([6, 0]);
  });
});
