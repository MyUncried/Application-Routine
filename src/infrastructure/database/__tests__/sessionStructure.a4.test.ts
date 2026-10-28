import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { SessionValidationError } from "@/domain/sessions/errors";
import type { StructureExerciseInput, StructureInput, StructuredSessionInput } from "@/domain/sessions/structuredInput";
import { structureExercises } from "@/domain/sessions/structure";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import {
  SessionStructureNotRepresentableError,
  SqliteSessionRepository,
} from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * PRE-8 (story A.4, D-449 §4 et §6) — repository de la structure générale sur SQLite réelle
 * (`node:sqlite`) : plusieurs Cycles successifs de Circuits, Exercices et Circuits au niveau
 * principal, fusion par identité, références intègres aux Mouvements, projection dans l'ancien
 * modèle réservée aux structures qu'il représente.
 */

const NOW = "2026-10-27T09:00:00.000Z";
const LATER = "2026-10-27T10:00:00.000Z";

let database: NodeSqliteDatabase;
let clock = NOW;
let sequence = 0;
const repository = () => new SqliteSessionRepository(database, () => `gen-${++sequence}`, () => clock);

beforeEach(async () => {
  database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
  clock = NOW;
  for (const [id, name] of [
    ["mv-squat", "Squat"],
    ["mv-pompes", "Pompes"],
  ] as const) {
    await database.runAsync(
      `INSERT INTO movements (id, name, normalized_name, description, category_id, next_phase_id, created_at, updated_at)
       VALUES (?, ?, lower(?), NULL, 'cardio', 1, ?, ?)`,
      [id, name, name, NOW, NOW],
    );
    await database.runAsync("INSERT INTO movement_body_zones (movement_id, body_zone_id) VALUES (?, 'dos')", [id]);
  }
});

afterEach(() => {
  database.close();
});

const exercise = (id: string, movementId = "mv-squat", seconds = 30): StructureExerciseInput => ({
  id,
  type: "EXERCISE",
  executionParameters: durationParameters(seconds),
  postActivityRecoverySeconds: 0,
  sourceMovementId: movementId,
});

const circuit = (id: string, exercises: readonly StructureExerciseInput[], repeatCount = 1) => ({
  id,
  repeatCount,
  nature: "TOURS" as const,
  exercises,
});

/** Échauffement, Cycle A (Circuits 1 puis 2, trois répétitions), Cycle B (Circuit 3, deux répétitions), retour au calme (D-449 §4). */
const multiCycle = (): StructureInput => ({
  elements: [
    { kind: "EXERCISE", exercise: exercise("warmup", "mv-pompes") },
    { kind: "CYCLE", cycle: { id: "cycle-a", repeatCount: 3, circuits: [circuit("c1", [exercise("e1")]), circuit("c2", [exercise("e2"), exercise("e3", "mv-pompes")])] } },
    { kind: "CYCLE", cycle: { id: "cycle-b", repeatCount: 2, circuits: [circuit("c3", [exercise("e4")], 2)] } },
    { kind: "EXERCISE", exercise: exercise("cooldown", "mv-pompes", 60) },
  ],
  stopPoints: [],
});

const input = (structure: StructureInput, overrides: Partial<StructuredSessionInput> = {}): StructuredSessionInput => ({
  name: "Séance à cycles",
  labelId: null,
  initialCountdownSeconds: 10,
  finalPhaseSeconds: 5,
  structure,
  ...overrides,
});

const shape = (structure: StructureInput | NonNullable<Awaited<ReturnType<SqliteSessionRepository["findStructuredById"]>>>["structure"]) =>
  structure.elements.map((element) => {
    switch (element.kind) {
      case "EXERCISE":
        return element.exercise.id;
      case "CIRCUIT":
        return { circuit: element.circuit.id, repeat: element.circuit.repeatCount, exercises: element.circuit.exercises.map((item) => item.id) };
      case "CYCLE":
        return {
          cycle: element.cycle.id,
          repeat: element.cycle.repeatCount,
          circuits: element.cycle.circuits.map((item) => ({ circuit: item.id, repeat: item.repeatCount, exercises: item.exercises.map((ex) => ex.id) })),
        };
    }
  });

describe("PRE-8 A.4 — structure générale persistée", () => {
  it("crée et relit plusieurs Cycles successifs sans imbrication, références aux Mouvements comprises", async () => {
    const created = await repository().createStructured(input(multiCycle()));
    const reread = (await repository().findStructuredById(created.id))!;
    expect(reread).toEqual(created);
    expect(shape(reread.structure)).toEqual(shape(multiCycle()));
    expect(structureExercises(reread.structure).map((item) => item.sourceMovementId)).toEqual([
      "mv-pompes",
      "mv-squat",
      "mv-squat",
      "mv-pompes",
      "mv-squat",
      "mv-pompes",
    ]);
    // Contenu courant lu dans le Mouvement partagé.
    expect(structureExercises(reread.structure)[0]).toMatchObject({ name: "Pompes", bodyZoneIds: ["dos"] });
    expect(await database.getAllAsync("SELECT id, position, repeat_count FROM cycles ORDER BY position")).toEqual([
      { id: "cycle-a", position: 1, repeat_count: 3 },
      { id: "cycle-b", position: 2, repeat_count: 2 },
    ]);
  });

  it("liste la Séance avec le compte D-449 §6 et la durée des Cycles", async () => {
    const created = await repository().createStructured(input(multiCycle()));
    const summary = (await repository().listActive()).find((item) => item.id === created.id)!;
    // Six Exercices de composition, sans multiplier par Circuits ni Cycles.
    expect(summary.activityCount).toBe(6);
    // 30 + 3 × (30 + 30 + 30) + 2 × (2 × 30) + 60.
    expect(summary).toMatchObject({ estimatedDurationSeconds: 30 + 270 + 120 + 60, durationKind: "exact", tourRepeatCount: 1 });
  });

  it("ne projette pas une structure plus riche dans l'ancien modèle et ne la réécrit jamais par l'ancien chemin", async () => {
    const created = await repository().createStructured(input(multiCycle()));
    await expect(repository().findById(created.id)).rejects.toBeInstanceOf(SessionStructureNotRepresentableError);
    await expect(
      repository().update(created.id, {
        sourceSessionId: created.id,
        name: "Écrasée",
        initialCountdownSeconds: 10,
        finalPhaseSeconds: 5,
        tourRepeatCount: 1,
        activities: [{ ...exercise("warmup"), structuralPosition: "BEFORE_TOUR", position: 0 }],
      }),
    ).rejects.toBeInstanceOf(SessionStructureNotRepresentableError);
    expect(shape((await repository().findStructuredById(created.id))!.structure)).toEqual(shape(multiCycle()));
  });

  it("une structure à Circuit unique reste lisible par l'ancien modèle, à l'identique", async () => {
    const created = await repository().createStructured(
      input({
        elements: [
          { kind: "EXERCISE", exercise: exercise("before") },
          { kind: "CIRCUIT", circuit: circuit("tour", [exercise("inside")], 4) },
          { kind: "EXERCISE", exercise: exercise("after") },
        ],
        stopPoints: [{ circuitId: null, position: 1 }, { circuitId: "tour", position: 1 }],
      }),
    );
    const legacy = (await repository().findById(created.id))!;
    expect(legacy.cycle.beforeTour?.map((item) => item.id)).toEqual(["before"]);
    expect(legacy.cycle.tour).toMatchObject({ id: "tour", repeatCount: 4, exercises: [expect.objectContaining({ id: "inside" })] });
    expect(legacy.cycle.afterTour?.map((item) => [item.id, item.structuralPosition, item.position])).toEqual([["after", "AFTER_TOUR", 0]]);
    expect(legacy.stopPoints?.map((point) => [point.scope, point.position])).toEqual([
      ["BEFORE_TOUR", 1],
      ["IN_TOUR", 1],
    ]);
  });

  it("fusionne par identité : un Exercice déplacé garde son identité et sa date de création ; les conteneurs retirés disparaissent", async () => {
    const created = await repository().createStructured(input(multiCycle()));
    clock = LATER;
    const outcome = await repository().updateStructured(created.id, {
      ...input({
        elements: [
          // e3 sort du Cycle A vers le niveau principal ; le Cycle B et le Circuit c2 sont retirés.
          { kind: "EXERCISE", exercise: exercise("e3", "mv-pompes", 45) },
          { kind: "CYCLE", cycle: { id: "cycle-a", repeatCount: 5, circuits: [circuit("c1", [exercise("e1"), exercise("e4")]), circuit("c-new", [exercise("fresh")])] } },
        ],
        stopPoints: [],
      }),
      persistedActivityIds: ["warmup", "e1", "e2", "e3", "e4", "cooldown"],
    });
    expect(outcome.status).toBe("UPDATED");
    const reread = (await repository().findStructuredById(created.id))!;
    expect(shape(reread.structure)).toEqual([
      "e3",
      {
        cycle: "cycle-a",
        repeat: 5,
        circuits: [
          { circuit: "c1", repeat: 1, exercises: ["e1", "e4"] },
          { circuit: "c-new", repeat: 1, exercises: ["fresh"] },
        ],
      },
    ]);
    const rows = await database.getAllAsync<{ id: string; created_at: string; updated_at: string }>(
      "SELECT id, created_at, updated_at FROM activities ORDER BY id",
    );
    expect(rows).toEqual([
      { id: "e1", created_at: NOW, updated_at: LATER },
      { id: "e3", created_at: NOW, updated_at: LATER },
      { id: "e4", created_at: NOW, updated_at: LATER },
      { id: "fresh", created_at: LATER, updated_at: LATER },
    ]);
    expect(await database.getAllAsync("SELECT id FROM tours ORDER BY id")).toEqual([{ id: "c-new" }, { id: "c1" }]);
    expect(await database.getAllAsync("SELECT id FROM cycles")).toEqual([{ id: "cycle-a" }]);
    expect(await database.getAllAsync("PRAGMA foreign_key_check")).toEqual([]);
  });

  it("ne recrée pas un Exercice persisté à l'ouverture et disparu depuis (ACTIVITY_NOT_FOUND), sans écrire", async () => {
    const created = await repository().createStructured(input(multiCycle()));
    await database.runAsync("DELETE FROM activities WHERE id = 'e4'");
    const outcome = await repository().updateStructured(created.id, {
      ...input({ elements: [{ kind: "EXERCISE", exercise: exercise("e4") }], stopPoints: [] }, { name: "Renommée" }),
      persistedActivityIds: ["e4"],
    });
    expect(outcome).toEqual({ status: "ACTIVITY_NOT_FOUND" });
    expect(await database.getFirstAsync("SELECT name FROM sessions WHERE id = ?", [created.id])).toEqual({ name: "Séance à cycles" });
  });

  it("refuse les formes invalides et les Points d'arrêt hors de l'ancien modèle, sans écrire", async () => {
    for (const structure of [
      { elements: [{ kind: "CYCLE" as const, cycle: { id: "empty", repeatCount: 2, circuits: [] } }], stopPoints: [] },
      { elements: [{ kind: "CIRCUIT" as const, circuit: circuit("c", [exercise("x")], 100) }], stopPoints: [] },
      { ...multiCycle(), stopPoints: [{ circuitId: "c1", position: 0 }] },
      { elements: [], stopPoints: [] },
    ]) {
      await expect(repository().createStructured(input(structure))).rejects.toBeInstanceOf(SessionValidationError);
    }
    expect(await database.getFirstAsync("SELECT COUNT(*) AS count FROM sessions")).toEqual({ count: 0 });
  });

  it("refuse une référence à un Mouvement inconnu et annule toute la Séance", async () => {
    await expect(
      repository().createStructured(input({ elements: [{ kind: "EXERCISE", exercise: exercise("x", "mv-inconnu") }], stopPoints: [] })),
    ).rejects.toThrow();
    for (const table of ["sessions", "cycles", "tours", "activities"]) {
      expect(await database.getFirstAsync(`SELECT COUNT(*) AS count FROM ${table}`)).toEqual({ count: 0 });
    }
  });

  it("la suppression du Mouvement référencé reste refusée (référence active intègre, D-445)", async () => {
    await repository().createStructured(input(multiCycle()));
    await expect(database.runAsync("DELETE FROM movements WHERE id = 'mv-squat'")).rejects.toThrow();
  });
});
