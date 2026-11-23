import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import type { EngineState } from "@/domain/execution/kernel";
import { EVERY_TIME, type RoutineDraft } from "@/domain/planning/Routine";
import { routineOccurrences } from "@/domain/planning/occurrences";
import type { Program, ProgramDraft } from "@/domain/programs/Program";
import { withinProgramPeriod } from "@/domain/programs/programMembership";
import { PlanningService } from "@/features/planning/PlanningService";
import { ProgramService } from "@/features/programs/ProgramService";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteExecutionRepository } from "@/infrastructure/database/repositories/SqliteExecutionRepository";
import { SqliteOccurrenceExecutionRepository } from "@/infrastructure/database/repositories/SqliteOccurrenceExecutionRepository";
import { SqliteProgramRepository } from "@/infrastructure/database/repositories/SqliteProgramRepository";
import { SqliteRoutineRepository } from "@/infrastructure/database/repositories/SqliteRoutineRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * Contre-recette Programmes, lot 4 (23/11/2026), chantier C — D-564, D-566, D-567, RM-275 (`docs/KODJO-Programme-recette-2026-11-23.md`
 * § 4) : appartenance d'une occurrence au programme par sa date, dates de la routine après « Supprimer », créneaux manquants du
 * parcours « pendant 9 semaines » (x10). Une suite verte ne remplace pas la recette sur iPhone.
 */

let database: NodeSqliteDatabase;
let planning: PlanningService;
let programs: ProgramService;
let executions: SqliteExecutionRepository;
let now: Date;
let ids = 0;

beforeEach(async () => {
  database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
  ids = 0;
  // Lundi 23 novembre 2026, midi (jour de la recette).
  now = new Date(2026, 10, 23, 12, 0);
  const occurrenceExecutions = new SqliteOccurrenceExecutionRepository(database);
  executions = new SqliteExecutionRepository(database);
  planning = new PlanningService({
    repository: new SqliteRoutineRepository(database),
    newId: () => `id-${++ids}`,
    now: () => now,
    occurrenceExecutions: () => occurrenceExecutions.list(),
  });
  programs = new ProgramService({ repository: new SqliteProgramRepository(database), planning, newId: () => `p-${++ids}`, now: () => now });
});

afterEach(() => {
  database.close();
});

async function createProgram(patch: Partial<ProgramDraft> = {}): Promise<Program> {
  const result = await programs.createProgram({
    name: "Rééducation du genou",
    objective: "",
    startDate: "2026-11-16",
    endDate: "2027-01-31",
    painTracking: true,
    ...patch,
  });
  if (result.status !== "SAVED") throw new Error(result.status);
  return result.program;
}

/** « Parcours Pont Mollet » : deux Séances, lundis, jeudis et samedis, depuis le 16 novembre 2026. */
const parcoursDraft = (patch: Partial<RoutineDraft> = {}): RoutineDraft => ({
  name: "Parcours Pont Mollet",
  startDate: "2026-11-16",
  time: "08:00",
  repetition: { unit: "WEEK", every: 1, weekdays: [1, 4, 6], end: { kind: "FOR", count: 9 } },
  entries: [
    { id: "e-pont", sessionId: "s-pont", frequency: EVERY_TIME },
    { id: "e-mollet", sessionId: "s-mollet", frequency: EVERY_TIME },
  ],
  reminderMinutes: null,
  ...patch,
});

async function createRoutine(patch: Partial<RoutineDraft> = {}): Promise<string> {
  const result = await planning.createRoutine(parcoursDraft(patch));
  if (result.status !== "SAVED") throw new Error(result.status);
  return result.routine.id;
}

async function dates(routineId: string): Promise<string[]> {
  const routine = await planning.getRoutine(routineId);
  return routine === null ? [] : routineOccurrences(routine).map((occurrence) => occurrence.date);
}

async function launch(routineId: string, occurrenceKey: string, executionId: string): Promise<void> {
  await executions.create(
    {
      id: executionId,
      origin: "SESSION",
      sessionId: null,
      snapshotJson: "{}",
      snapshotVersion: 1,
      planVersion: 1,
      engineVersion: 1,
      state: { status: "RUNNING" } as unknown as EngineState,
      startedAt: `${occurrenceKey}:00.000Z`,
      clockWallMs: 0,
      occurrence: { routineId, occurrenceKey, rank: 1 },
    },
    [],
  );
}

const programOf = async (executionId: string) =>
  (await database.getFirstAsync<{ program_id: string | null }>("SELECT program_id FROM executions WHERE id = ?", [executionId]))?.program_id ?? null;

describe("x10 — créneaux manquants du 2 au 9 janvier (parcours « pendant 9 semaines »)", () => {
  it("non-régression : « Supprimer » puis extension de la routine « pendant N » recrée tous les créneaux d'après la période", async () => {
    // Routine « pendant 8 semaines » (fin le 10 janvier 2027), programme jusqu'au 1er janvier : 4 créneaux hors période
    // (samedi 2, lundi 4, jeudi 7, samedi 9 janvier).
    const program = await createProgram({ endDate: "2027-01-01" });
    const routineId = await createRoutine({ repetition: { unit: "WEEK", every: 1, weekdays: [1, 4, 6], end: { kind: "FOR", count: 8 } } });
    expect(await programs.applyRoutineChanges(program, { detach: [], attach: [{ routineId, removeOutside: true }] })).toBe(4);
    // D-567 : la fin de la routine devient celle du programme (« pendant 8 » → « jusqu'au 1er janvier »).
    expect((await planning.getRoutine(routineId))?.repetition?.end).toEqual({ kind: "UNTIL", date: "2027-01-01" });
    // Le programme est prolongé, la routine est replanifiée « pendant 9 semaines » (jusqu'au 17 janvier).
    await programs.updateProgram(program.id, { name: program.name, objective: "", startDate: program.startDate, endDate: "2027-01-31", painTracking: true });
    const result = await planning.updateRoutine(routineId, parcoursDraft());
    expect(result.status).toBe("SAVED");
    const after = await dates(routineId);
    // Avant correction : les créneaux retirés un à un restaient exclus — aucun créneau du 2 au 9 janvier, reprise le 11.
    expect(after).toEqual(expect.arrayContaining(["2026-12-31", "2027-01-02", "2027-01-04", "2027-01-07", "2027-01-09", "2027-01-11", "2027-01-16"]));
    expect(after).toHaveLength(27);
    expect((await planning.getRoutine(routineId))?.exclusions).toEqual([]);
  });

  it("moteur de répétition : « pendant 9 semaines » depuis le 16 novembre 2026, semaine ISO 53 et changement d'année sans trou", async () => {
    const routineId = await createRoutine();
    const produced = await dates(routineId);
    expect(produced.filter((date) => date >= "2026-12-28" && date <= "2027-01-17")).toEqual([
      "2026-12-28",
      "2026-12-31",
      "2027-01-02",
      "2027-01-04",
      "2027-01-07",
      "2027-01-09",
      "2027-01-11",
      "2027-01-14",
      "2027-01-16",
    ]);
  });
});

describe("D-567 — dates de la routine après « Supprimer » (D-566)", () => {
  it("début ramené à celui du programme sans séance réalisée avant ; fin ramenée à celle du programme", async () => {
    const program = await createProgram({ startDate: "2026-11-30", endDate: "2026-12-20" });
    const routineId = await createRoutine({ repetition: { unit: "WEEK", every: 1, weekdays: [1, 4, 6], end: { kind: "UNTIL", date: "2027-01-10" } } });
    await programs.applyRoutineChanges(program, { detach: [], attach: [{ routineId, removeOutside: true }] });
    const routine = await planning.getRoutine(routineId);
    expect(routine?.startDate).toBe("2026-11-30");
    expect(routine?.repetition?.end).toEqual({ kind: "UNTIL", date: "2026-12-20" });
    expect(routine?.exclusions).toEqual([]);
    const kept = await dates(routineId);
    expect(kept[0]).toBe("2026-11-30");
    expect(kept[kept.length - 1]).toBe("2026-12-19");
    // Supprimer des occurrences hors période n'a aucun effet sur le programme.
    expect(await programs.getProgram(program.id)).toEqual(program);
    expect(routine?.programId).toBe(program.id);
  });

  it("séance réalisée avant le début du programme : le début ne bouge pas, ni le créneau réalisé", async () => {
    const program = await createProgram({ startDate: "2026-11-30", endDate: "2026-12-20" });
    const routineId = await createRoutine({ repetition: { unit: "WEEK", every: 1, weekdays: [1, 4, 6], end: { kind: "UNTIL", date: "2026-12-31" } } });
    await launch(routineId, "2026-11-19T08:00", "x-avant");
    await programs.applyRoutineChanges(program, { detach: [], attach: [{ routineId, removeOutside: true }] });
    const routine = await planning.getRoutine(routineId);
    expect(routine?.startDate).toBe("2026-11-16");
    expect(await dates(routineId)).toContain("2026-11-19");
    // Créneaux à venir d'avant la période retirés un à un (samedi 28 novembre ; lundi 23 à 8 h est passé à midi).
    expect(await dates(routineId)).not.toContain("2026-11-28");
    expect(await dates(routineId)).toContain("2026-11-23");
    expect(routine?.repetition?.end).toEqual({ kind: "UNTIL", date: "2026-12-20" });
  });

  it("toutes les 2 semaines : le début n'est pas déplacé d'une façon qui changerait les semaines actives de la période", async () => {
    // Semaines actives : 16 nov., 30 nov., 14 déc., 28 déc. Programme à partir du 23 novembre (semaine inactive).
    const program = await createProgram({ startDate: "2026-11-23", endDate: "2026-12-31" });
    const routineId = await createRoutine({ repetition: { unit: "WEEK", every: 2, weekdays: [1], end: { kind: "UNTIL", date: "2026-12-31" } } });
    const before = (await dates(routineId)).filter((date) => withinProgramPeriod(program, date));
    // Un créneau à venir hors période est nécessaire pour la question : le 16 novembre est passé — on ajoute un créneau après la fin.
    const extended = await planning.updateRoutine(routineId, parcoursDraft({ repetition: { unit: "WEEK", every: 2, weekdays: [1], end: { kind: "UNTIL", date: "2027-01-15" } } }));
    expect(extended.status).toBe("SAVED");
    await programs.applyRoutineChanges(program, { detach: [], attach: [{ routineId, removeOutside: true }] });
    const routine = await planning.getRoutine(routineId);
    expect((await dates(routineId)).filter((date) => withinProgramPeriod(program, date))).toEqual(before);
    // Premier jour produit dans la période (30 novembre) : même ancrage des semaines.
    expect(routine?.startDate).toBe("2026-11-30");
  });

  it("rotation « 1 fois sur 2 » : le début n'est pas déplacé si les séances de la période changeraient", async () => {
    const program = await createProgram({ startDate: "2026-11-26", endDate: "2026-12-20" });
    const routineId = await createRoutine({
      repetition: { unit: "WEEK", every: 1, weekdays: [1, 4, 6], end: { kind: "UNTIL", date: "2026-12-31" } },
      entries: [
        { id: "e-pont", sessionId: "s-pont", frequency: { x: 1, n: 2, positions: [1] } },
        { id: "e-mollet", sessionId: "s-mollet", frequency: { x: 1, n: 2, positions: [2] } },
      ],
    });
    const sessionsInPeriod = async () => {
      const routine = await planning.getRoutine(routineId);
      return routineOccurrences(routine!)
        .filter((occurrence) => withinProgramPeriod(program, occurrence.date))
        .map((occurrence) => `${occurrence.date}:${occurrence.contents.map((content) => content.sessionId).join("+")}`);
    };
    const before = await sessionsInPeriod();
    await programs.applyRoutineChanges(program, { detach: [], attach: [{ routineId, removeOutside: true }] });
    expect(await sessionsInPeriod()).toEqual(before);
  });

  it("étendre la fin au-delà du programme crée des occurrences hors programme (question D-566 au compte hors période)", async () => {
    const program = await createProgram({ startDate: "2026-11-16", endDate: "2026-12-20" });
    const routineId = await createRoutine({ repetition: { unit: "WEEK", every: 1, weekdays: [1, 4, 6], end: { kind: "UNTIL", date: "2026-12-20" } } });
    await programs.attachRoutine(routineId, program.id);
    const draft = parcoursDraft({ repetition: { unit: "WEEK", every: 1, weekdays: [1, 4, 6], end: { kind: "UNTIL", date: "2026-12-31" } } });
    expect(await planning.outsidePeriodSlotCount(routineId, program.startDate, program.endDate, draft)).toBe(5);
    expect(await planning.outsidePeriodSlotCount(routineId, program.startDate, program.endDate)).toBe(0);
    await planning.updateRoutine(routineId, draft);
    // Garder : la routine n'est pas coupée ; les créneaux d'après le 20 décembre restent, hors programme (catalogue).
    expect(await dates(routineId)).toContain("2026-12-31");
    const [summary] = await programs.listSummaries();
    expect(summary?.routineCount).toBe(1);
  });
});

describe("D-564 — une occurrence hors de la période n'appartient pas au programme", () => {
  it("catalogue : une routine rattachée sans occurrence dans la période n'est pas comptée ; séances des occurrences de la période", async () => {
    const program = await createProgram({ startDate: "2026-11-16", endDate: "2026-12-20" });
    const inside = await createRoutine({ repetition: { unit: "WEEK", every: 1, weekdays: [1], end: { kind: "UNTIL", date: "2026-12-20" } } });
    // D-563 nom (Hermann, 23/11/2026) : deux routines actives, deux noms.
    const outside = await createRoutine({
      name: "Dos",
      startDate: "2027-01-04",
      repetition: { unit: "WEEK", every: 1, weekdays: [1], end: { kind: "UNTIL", date: "2027-01-31" } },
      entries: [{ id: "e-dos", sessionId: "s-dos", frequency: EVERY_TIME }],
    });
    await programs.attachRoutine(inside, program.id);
    await programs.attachRoutine(outside, program.id);
    const [summary] = await programs.listSummaries();
    expect(summary).toMatchObject({ routineCount: 1, sessionCount: 2 });
    // Routine détachée : aucune occurrence au programme.
    await programs.detachRoutine(inside);
    expect((await programs.listSummaries())[0]).toMatchObject({ routineCount: 0, sessionCount: 0 });
  });

  it("suivi de la douleur : une exécution lancée depuis une occurrence hors période est hors programme", async () => {
    const program = await createProgram({ startDate: "2026-11-16", endDate: "2026-11-30" });
    const routineId = await createRoutine();
    await programs.attachRoutine(routineId, program.id);
    await launch(routineId, "2026-11-19T08:00", "x-dans");
    await launch(routineId, "2026-12-03T08:00", "x-hors");
    expect(await programOf("x-dans")).toBe(program.id);
    expect(await programOf("x-hors")).toBeNull();
  });

  it("suppression d'un programme : « Garder les routines » proposé seulement s'il reste des créneaux à venir dans la période", async () => {
    const program = await createProgram({ startDate: "2026-11-01", endDate: "2026-11-20" });
    const routineId = await createRoutine();
    await programs.attachRoutine(routineId, program.id);
    // Créneaux de la période (16, 19 novembre) passés ; les créneaux à venir sont tous hors période.
    expect(await programs.deletionPlan(program.id)).toEqual({ history: false, slotCount: 2, canKeepRoutines: false });
    expect(await programs.deleteProgram(program.id, "WITH_ROUTINES")).toBe("DELETED");
    // Les créneaux hors période restent, sans programme.
    expect((await dates(routineId)).filter((date) => date > "2026-11-20")).toHaveLength(25);
    expect((await planning.getRoutine(routineId))?.programId).toBeUndefined();
  });
});
