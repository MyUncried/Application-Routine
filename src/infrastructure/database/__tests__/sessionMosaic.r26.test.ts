import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { StructureExerciseInput, StructuredSessionInput } from "@/domain/sessions/structuredInput";
import { projectSessionForCatalogue } from "@/features/sessions/sessionCatalogueProjection";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

let database: NodeSqliteDatabase;
const clock = "2026-11-26T08:00:00.000Z";
let sequence = 0;
const repository = () => new SqliteSessionRepository(database, () => `gen-${++sequence}`, () => clock);
const MOVEMENTS = ["m1", "m2", "m3", "m4", "m5"];

beforeEach(async () => {
  database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
  for (const id of MOVEMENTS) {
    await database.runAsync(
      `INSERT INTO movements (id, name, normalized_name, description, category_id, next_phase_id, created_at, updated_at)
       VALUES (?, ?, ?, NULL, 'cardio', 1, ?, ?)`,
      [id, `Mouvement ${id}`, `mouvement ${id}`, clock, clock],
    );
    await database.runAsync("INSERT INTO movement_body_zones (movement_id, body_zone_id) VALUES (?, 'dos')", [id]);
    await database.runAsync("INSERT INTO media_assets (id, uri, created_at) VALUES (?, ?, ?)", [`a-${id}`, `kodjo-media/a-${id}.jpg`, clock]);
    await database.runAsync("INSERT INTO movement_media (id, movement_id, asset_id, position) VALUES (?, ?, ?, 0)", [`mm-${id}`, id, `a-${id}`]);
  }
});

afterEach(() => {
  database.close();
});

const exercise = (id: string, movement: string): StructureExerciseInput => ({
  id,
  type: "EXERCISE",
  executionParameters: durationParameters(30),
  postActivityRecoverySeconds: 0,
  sourceMovementId: movement,
});

describe("Recette 26/11 — mosaïque d'une séance avec un circuit Tabata", () => {
  it("compte les mouvements du circuit", async () => {
    const input: StructuredSessionInput = {
      name: "Mixte",
      labelId: null,
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      structure: {
        elements: [
          { kind: "EXERCISE", exercise: exercise("e1", "m1") },
          { kind: "EXERCISE", exercise: exercise("e2", "m2") },
          { kind: "EXERCISE", exercise: exercise("e3", "m3") },
          { kind: "CIRCUIT", circuit: { id: "c1", repeatCount: 8, nature: "SERIES", originModel: "TABATA", exercises: [exercise("e4", "m4"), exercise("e5", "m5")] } },
        ],
        stopPoints: [],
      },
    } as StructuredSessionInput;
    await repository().createStructured(input);
    const [record] = await repository().listCatalogue();
    const projection = projectSessionForCatalogue(record!, new Map());
    expect(projection.mosaic.map((image) => image.key)).toEqual(MOVEMENTS);
  });
});
