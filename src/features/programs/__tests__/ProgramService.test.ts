import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import type { EngineState } from "@/domain/execution/kernel";
import { EVERY_TIME, type RoutineDraft } from "@/domain/planning/Routine";
import { duplicateProgramDraft, programPhase, programStatus, validateProgramDraft, type Program, type ProgramDraft } from "@/domain/programs/Program";
import { PlanningService } from "@/features/planning/PlanningService";
import { ProgramService } from "@/features/programs/ProgramService";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteExecutionRepository } from "@/infrastructure/database/repositories/SqliteExecutionRepository";
import { SqliteOccurrenceExecutionRepository } from "@/infrastructure/database/repositories/SqliteOccurrenceExecutionRepository";
import { SqliteProgramRepository } from "@/infrastructure/database/repositories/SqliteProgramRepository";
import { SqliteRoutineRepository } from "@/infrastructure/database/repositories/SqliteRoutineRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * PROG-CAT-01 (21/11/2026) — statut, création, duplication, suppression (D-547 ; Hermann, 21/11/2026, point 3) et
 * consentement au suivi de la douleur (D-551). Une suite verte ne remplace pas la recette sur iPhone.
 */

let database: NodeSqliteDatabase;
let planning: PlanningService;
let programs: ProgramService;
let executions: SqliteExecutionRepository;
let ids = 0;
// 10 août 2030, midi.
const NOW = new Date(2030, 7, 10, 12, 0);

const routineDraft = (patch: Partial<RoutineDraft> = {}): RoutineDraft => ({
  name: "Genou",
  startDate: "2030-08-05",
  time: "08:00",
  // Lundis et jeudis du 5 au 29 août 2030 : 8 créneaux (2 passés au 10 août, 6 à venir).
  repetition: { unit: "WEEK", every: 1, weekdays: [1, 4], end: { kind: "UNTIL", date: "2030-08-29" } },
  entries: [
    { id: "e-a", sessionId: "s-a", frequency: EVERY_TIME },
    { id: "e-b", sessionId: "s-b", frequency: EVERY_TIME },
  ],
  reminderMinutes: null,
  ...patch,
});

const programDraft = (patch: Partial<ProgramDraft> = {}): ProgramDraft => ({
  name: "Rééducation genou",
  objective: "Retrouver mobilité",
  startDate: "2030-08-01",
  endDate: "2030-09-30",
  painTracking: false,
  ...patch,
});

async function createProgram(patch: Partial<ProgramDraft> = {}): Promise<Program> {
  const result = await programs.createProgram(programDraft(patch));
  if (result.status !== "SAVED") throw new Error(result.status);
  return result.program;
}

async function createRoutine(patch: Partial<RoutineDraft> = {}): Promise<string> {
  const result = await planning.createRoutine(routineDraft(patch));
  if (result.status !== "SAVED") throw new Error(result.status);
  return result.routine.id;
}

/** Exécution lancée depuis une occurrence de routine (lien de la migration 033). */
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

const count = async (sql: string, params: (string | number)[] = []) => (await database.getFirstAsync<{ count: number }>(sql, params))?.count ?? 0;

beforeEach(async () => {
  database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
  ids = 0;
  const occurrenceExecutions = new SqliteOccurrenceExecutionRepository(database);
  executions = new SqliteExecutionRepository(database);
  planning = new PlanningService({
    repository: new SqliteRoutineRepository(database),
    newId: () => `id-${++ids}`,
    now: () => NOW,
    occurrenceExecutions: () => occurrenceExecutions.list(),
  });
  programs = new ProgramService({ repository: new SqliteProgramRepository(database), planning, newId: () => `p-${++ids}`, now: () => NOW });
});

afterEach(() => {
  database.close();
});

describe("statut calculé (D-545)", () => {
  const base = { startDate: "2030-08-01", endDate: "2030-08-31", terminatedAt: null };
  it("actif en cours ou à venir, terminé après la date de fin ou par terminated_at", () => {
    expect(programStatus(base, "2030-08-10")).toBe("ACTIVE");
    expect(programStatus(base, "2030-08-31")).toBe("ACTIVE");
    expect(programStatus(base, "2030-09-01")).toBe("TERMINATED");
    expect(programStatus({ ...base, terminatedAt: "2030-08-05T10:00:00.000Z" }, "2030-08-10")).toBe("TERMINATED");
    expect(programPhase(base, "2030-07-31")).toBe("UPCOMING");
    expect(programPhase(base, "2030-08-01")).toBe("IN_PROGRESS");
    expect(programPhase(base, "2030-09-01")).toBe("TERMINATED");
  });

  it("D-499 : nom, début et fin obligatoires, fin ≥ début", () => {
    expect(validateProgramDraft(programDraft())).toEqual([]);
    expect(validateProgramDraft(programDraft({ name: "  ", startDate: null, endDate: null }))).toEqual(["NAME_REQUIRED", "START_REQUIRED", "END_REQUIRED"]);
    expect(validateProgramDraft(programDraft({ startDate: "2030-08-10", endDate: "2030-08-09" }))).toEqual(["END_BEFORE_START"]);
    expect(validateProgramDraft(programDraft({ startDate: "2030-08-10", endDate: "2030-08-10" }))).toEqual([]);
  });
});

describe("création, rattachement et cartes du catalogue", () => {
  it("objectif vide → null ; « N planifications · N séances » comptent les séances distinctes", async () => {
    const program = await createProgram({ objective: "  " });
    expect(program.objective).toBeNull();
    const first = await createRoutine({ name: "Matin", programId: program.id } as Partial<RoutineDraft>);
    const second = await createRoutine({ name: "Soir", entries: [{ id: "e-c", sessionId: "s-a", frequency: EVERY_TIME }, { id: "e-d", sessionId: "s-c", frequency: EVERY_TIME }] });
    await programs.attachRoutine(second, program.id);
    const [summary] = await programs.listSummaries();
    expect(summary).toMatchObject({ routineCount: 2, sessionCount: 3 });
    expect((await programs.routinesOf(program.id)).map((routine) => routine.id)).toEqual([first, second]);
    expect(await programs.unattachedRoutines()).toEqual([]);
    await programs.detachRoutine(first);
    expect((await programs.unattachedRoutines()).map((routine) => routine.id)).toEqual([first]);
    // Retirer ne supprime pas la routine.
    expect(await planning.getRoutine(first)).not.toBeNull();
  });

  it("p4-rattacher, D-566 : routines proposées avec « X créneaux sur la période, Y en dehors » ; « Supprimer » retire les créneaux à venir hors période", async () => {
    const program = await createProgram({ startDate: "2030-08-01", endDate: "2030-08-20" });
    const free = await createRoutine({ name: "Libre" });
    const taken = await createRoutine({ name: "Prise", programId: program.id, entries: [{ id: "e-p", sessionId: "s-p", frequency: EVERY_TIME }] } as Partial<RoutineDraft>);
    const choices = await programs.attachChoices({ start: "2030-08-01", end: "2030-08-20" }, new Set(), new Set([taken]));
    // Lundis et jeudis à 8 h, du 5 au 29 août ; maintenant : 10 août, midi. À venir : 12, 15, 19 (période) ; 22, 26, 29 (après).
    expect(choices.map((choice) => [choice.routine.name, choice.period])).toEqual([
      ["Libre", { inside: 3, outside: 3, unstartedInside: 5 }],
      ["Prise", { inside: 3, outside: 3, unstartedInside: 5 }],
    ]);
    expect((await programs.attachChoices({ start: "2030-08-01", end: "2030-08-20" }, new Set([free]), new Set())).map((choice) => choice.routine.id)).toEqual([]);
    await programs.applyRoutineChanges(program, { detach: [taken], attach: [{ routineId: free, removeOutside: true }] });
    expect((await planning.getRoutine(taken))?.programId).toBeUndefined();
    expect((await planning.getRoutine(free))?.programId).toBe(program.id);
    const after = await planning.periodSlotCountsFor([(await planning.getRoutine(free))!], "2030-08-01", "2030-08-20");
    expect(after.get(free)).toEqual({ inside: 3, outside: 0, unstartedInside: 5 });
  });

  it("D-564 : « Supprimer avec ses routines » ne supprime que les créneaux de la période ; la routine garde les autres, sans programme", async () => {
    const program = await createProgram({ startDate: "2030-08-01", endDate: "2030-08-20" });
    const routineId = await createRoutine({ programId: program.id } as Partial<RoutineDraft>);
    // 5, 8, 12, 15, 19 août dans la période.
    expect((await programs.deletionPlan(program.id))?.slotCount).toBe(5);
    expect(await programs.deleteProgram(program.id, "WITH_ROUTINES")).toBe("DELETED");
    const routine = await planning.getRoutine(routineId);
    expect(routine?.programId).toBeUndefined();
    expect(await planning.upcomingSlotCount(routineId)).toBe(3);
  });

  it("p4-croix : routines planifiées depuis la modale et programme enregistré pour les planifier supprimés", async () => {
    const program = await createProgram();
    const routineId = await createRoutine({ programId: program.id } as Partial<RoutineDraft>);
    await programs.discardModalWork([routineId], program.id);
    expect(await planning.getRoutine(routineId)).toBeNull();
    expect(await programs.getProgram(program.id)).toBeNull();
  });

  it("modifier une routine rattachée conserve son programme", async () => {
    const program = await createProgram();
    const routineId = await createRoutine({ programId: program.id } as Partial<RoutineDraft>);
    await planning.updateRoutine(routineId, routineDraft({ name: "Genou 2" }));
    expect((await planning.getRoutine(routineId))?.programId).toBe(program.id);
  });

  it("Dupliquer (Hermann, 21/11/2026) : nom « (copie) », objectif et suivi repris, sans dates ni routines", async () => {
    const program = await createProgram({ painTracking: true });
    await createRoutine({ programId: program.id } as Partial<RoutineDraft>);
    const copy = duplicateProgramDraft(program);
    expect(copy).toEqual({ name: "Rééducation genou (copie)", objective: "Retrouver mobilité", startDate: null, endDate: null, painTracking: true });
    // Coche inactive tant que les dates ne sont pas choisies.
    expect(validateProgramDraft(copy)).toEqual(["START_REQUIRED", "END_REQUIRED"]);
    const saved = await programs.createProgram({ ...copy, startDate: "2030-10-01", endDate: "2030-10-31" });
    if (saved.status !== "SAVED") throw new Error(saved.status);
    expect(await programs.routinesOf(saved.program.id)).toEqual([]);
  });
});

describe("suppression (D-547 ; Hermann, 21/11/2026, point 3)", () => {
  it("sans exécution : le programme est supprimé ; avec ses routines, les routines sans historique aussi", async () => {
    const program = await createProgram();
    const routineId = await createRoutine({ programId: program.id } as Partial<RoutineDraft>);
    expect(await programs.deletionPlan(program.id)).toEqual({ history: false, slotCount: 8, canKeepRoutines: true });
    expect(await programs.deleteProgram(program.id, "WITH_ROUTINES")).toBe("DELETED");
    expect(await programs.getProgram(program.id)).toBeNull();
    expect(await planning.getRoutine(routineId)).toBeNull();
  });

  it("avec historique, avec ses routines : créneaux non commencés supprimés, programme Terminé, exécutions conservées", async () => {
    const program = await createProgram();
    const routineId = await createRoutine({ programId: program.id } as Partial<RoutineDraft>);
    await launch(routineId, "2030-08-05T08:00", "x1");
    expect(await count("SELECT COUNT(*) AS count FROM executions WHERE program_id = ?", [program.id])).toBe(1);
    expect(await programs.deletionPlan(program.id)).toEqual({ history: true, slotCount: 7, canKeepRoutines: true });
    expect(await programs.deleteProgram(program.id, "WITH_ROUTINES")).toBe("TERMINATED");
    const terminated = await programs.getProgram(program.id);
    expect(terminated?.terminatedAt).toBe(NOW.toISOString());
    expect(programStatus(terminated!, "2030-08-10")).toBe("TERMINATED");
    // Règle du Journal : la routine avec historique reste, sans créneau non commencé.
    const routine = await planning.getRoutine(routineId);
    expect(routine).not.toBeNull();
    expect((await planning.deletionPlan(routineId))?.count).toBe(0);
    expect(await planning.upcomingSlotCount(routineId)).toBe(0);
    expect(await count("SELECT COUNT(*) AS count FROM executions")).toBe(1);
  });

  it("avec historique, en gardant les routines : toutes détachées, aucun créneau supprimé, programme Terminé", async () => {
    const program = await createProgram();
    const started = await createRoutine({ programId: program.id } as Partial<RoutineDraft>);
    const other = await createRoutine({
      name: "Hanche",
      programId: program.id,
      entries: [{ id: "e-h", sessionId: "s-h", frequency: EVERY_TIME }],
    } as Partial<RoutineDraft>);
    await launch(started, "2030-08-05T08:00", "x1");
    expect(await programs.deleteProgram(program.id, "KEEP_ROUTINES")).toBe("TERMINATED");
    expect((await planning.getRoutine(started))?.programId).toBeUndefined();
    expect((await planning.getRoutine(other))?.programId).toBeUndefined();
    expect((await planning.deletionPlan(other))?.count).toBe(8);
    // L'historique du programme ne dépend pas du lien routine → programme.
    expect(await count("SELECT COUNT(*) AS count FROM executions WHERE program_id = ?", [program.id])).toBe(1);
  });

  it("sans historique, en gardant les routines : programme supprimé, routines détachées et conservées", async () => {
    const program = await createProgram();
    const routineId = await createRoutine({ programId: program.id } as Partial<RoutineDraft>);
    expect(await programs.deleteProgram(program.id, "KEEP_ROUTINES")).toBe("DELETED");
    const routine = await planning.getRoutine(routineId);
    expect(routine?.programId).toBeUndefined();
    expect((await planning.deletionPlan(routineId))?.count).toBe(8);
  });

  it("« Garder les routines » n'est proposé que si une routine a des créneaux à venir", async () => {
    const program = await createProgram();
    expect((await programs.deletionPlan(program.id))?.canKeepRoutines).toBe(false);
    await createRoutine({ programId: program.id, repetition: null, startDate: "2030-08-05" } as Partial<RoutineDraft>);
    expect(await programs.deletionPlan(program.id)).toEqual({ history: false, slotCount: 1, canKeepRoutines: false });
  });

  it("une exécution lancée avant le rattachement n'entre pas dans l'historique du programme", async () => {
    const routineId = await createRoutine();
    await launch(routineId, "2030-08-05T08:00", "x1");
    const program = await createProgram();
    await programs.attachRoutine(routineId, program.id);
    expect((await programs.deletionPlan(program.id))?.history).toBe(false);
    await launch(routineId, "2030-08-08T08:00", "x2");
    expect((await programs.deletionPlan(program.id))?.history).toBe(true);
    await programs.detachRoutine(routineId);
    expect((await programs.deletionPlan(program.id))?.history).toBe(true);
  });
});

describe("suivi de la douleur (D-551)", () => {
  it("sans accord : état « non utilisé » ; Autoriser enregistre la date", async () => {
    expect(await programs.painConsentAt()).toBeNull();
    expect(await programs.painTrackingState()).toEqual({ kind: "NONE" });
    expect(await programs.grantPainConsent()).toBe(NOW.toISOString());
    const program = await createProgram({ painTracking: true });
    await createProgram({ name: "Trail" });
    const state = await programs.painTrackingState();
    expect(state.kind).toBe("GRANTED");
    if (state.kind === "GRANTED") {
      expect(state.grantedAt).toBe(NOW.toISOString());
      expect(state.programs.map((item) => item.id)).toEqual([program.id]);
    }
  });

  it("Retirer mon accord efface la date et désactive le suivi dans tous les programmes", async () => {
    await programs.grantPainConsent();
    const first = await createProgram({ painTracking: true });
    const second = await createProgram({ name: "Trail", painTracking: true });
    await programs.withdrawPainConsent();
    expect(await programs.painConsentAt()).toBeNull();
    expect((await programs.getProgram(first.id))?.painTracking).toBe(false);
    expect((await programs.getProgram(second.id))?.painTracking).toBe(false);
    expect(await programs.painTrackingState()).toEqual({ kind: "NONE" });
  });

  it("relevés : aucun stockage aujourd'hui (saisie hors périmètre) — « Effacer mes relevés » grisé", async () => {
    expect(await programs.painReadingCount()).toBe(0);
  });
});
