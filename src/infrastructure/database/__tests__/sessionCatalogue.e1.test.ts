import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { isSessionCatalogueRepository } from "@/domain/sessions/SessionRepository";
import type { StructureExerciseInput, StructuredSessionInput } from "@/domain/sessions/structuredInput";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * PRE-8 (epic E, story E.1) — lecture du Catalogue unifié sur SQLite réelle : Séances actives ET
 * archivées, structure générale complète, aucune écriture.
 */

let database: NodeSqliteDatabase;
let clock = "2026-10-28T08:00:00.000Z";
let sequence = 0;
const repository = () => new SqliteSessionRepository(database, () => `gen-${++sequence}`, () => clock);

beforeEach(async () => {
  database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
  await database.runAsync(
    `INSERT INTO movements (id, name, normalized_name, description, category_id, next_phase_id, created_at, updated_at)
     VALUES ('mv-squat', 'Squat', 'squat', NULL, 'cardio', 1, ?, ?)`,
    [clock, clock],
  );
  await database.runAsync("INSERT INTO movement_body_zones (movement_id, body_zone_id) VALUES ('mv-squat', 'dos')");
});

afterEach(() => {
  database.close();
});

const exercise = (id: string): StructureExerciseInput => ({
  id,
  type: "EXERCISE",
  executionParameters: durationParameters(30),
  postActivityRecoverySeconds: 0,
  sourceMovementId: "mv-squat",
});

const input = (name: string, exercises: readonly StructureExerciseInput[]): StructuredSessionInput => ({
  name,
  labelId: null,
  initialCountdownSeconds: 10,
  finalPhaseSeconds: 5,
  structure: {
    elements: [
      { kind: "EXERCISE", exercise: exercises[0]! },
      { kind: "CYCLE", cycle: { id: `${name}-cycle`, repeatCount: 2, circuits: [{ id: `${name}-c`, repeatCount: 3, nature: "TOURS", exercises: exercises.slice(1) }] } },
    ],
    stopPoints: [],
  },
});

describe("PRE-8 E.1 — listCatalogue", () => {
  it("le repository SQLite implémente la lecture du Catalogue", () => {
    expect(isSessionCatalogueRepository(repository())).toBe(true);
    expect(isSessionCatalogueRepository({})).toBe(false);
  });

  it("lit actives et archivées avec leur structure, plus récentes d'abord, sans rien écrire", async () => {
    const older = await repository().createStructured(input("Ancienne", [exercise("a1"), exercise("a2")]));
    clock = "2026-10-28T09:00:00.000Z";
    const newer = await repository().createStructured(input("Récente", [exercise("b1"), exercise("b2"), exercise("b3")]));
    await database.runAsync("UPDATE sessions SET status = 'ARCHIVED', archived_at = ? WHERE id = ?", ["2026-10-28T10:00:00.000Z", older.id]);
    const before = await database.getAllAsync("SELECT * FROM sessions ORDER BY id");

    const records = await repository().listCatalogue();

    expect(records.map((record) => [record.name, record.status, record.archivedAt])).toEqual([
      ["Récente", "ACTIVE", null],
      ["Ancienne", "ARCHIVED", "2026-10-28T10:00:00.000Z"],
    ]);
    const recent = records[0]!;
    expect(recent.id).toBe(newer.id);
    expect(recent.structure.elements.map((element) => element.kind)).toEqual(["EXERCISE", "CYCLE"]);
    expect(recent.structure).toEqual(newer.structure);
    expect(await database.getAllAsync("SELECT * FROM sessions ORDER BY id")).toEqual(before);
    // La lecture d'édition garde la garde « Séance active ».
    expect(await repository().findSessionStatus(older.id)).toBe("ARCHIVED");
    await expect(repository().findStructuredById(older.id)).rejects.toThrow();
  });
});
