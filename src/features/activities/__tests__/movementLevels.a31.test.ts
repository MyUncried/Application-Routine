import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import type { ActivityDefinitionRepository } from "@/domain/activities/ActivityDefinitionRepository";
import type { Movement } from "@/domain/activities/Movement";
import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteActivityDefinitionRepository } from "@/infrastructure/database/repositories/SqliteActivityDefinitionRepository";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { seedCatalogueDefinition } from "@/infrastructure/database/testing/seedCatalogueDefinition";

jest.mock("expo-crypto", () => ({ randomUUID: jest.fn(() => "generated-id") }));

/**
 * PRE-7 story A3.1 (D-439, MFN-05, MFN-07, MFN-10) — `getMovementLevels` sur SQLite RÉELLE : rang et
 * total dérivés du groupe, membres ordonnés avec leurs Exercices du Catalogue (geste local : aucun),
 * rang masqué sans groupe ou pour un singleton ; aucune écriture.
 */

const NOW = "2026-10-24T10:00:00.000Z";
let database: NodeSqliteDatabase;
let sequence = 0;
const ids = (prefix: string) => () => `${prefix}-${++sequence}`;
const movements = () => new SqliteMovementRepository(database, ids("grp"), () => NOW);
const service = () =>
  new ActivityDefinitionService(
    new SqliteActivityDefinitionRepository(database, ids("def"), () => NOW),
    undefined,
    undefined,
    undefined,
    undefined,
    movements(),
  );

const localMovement = (id: string, name: string): Movement => ({
  id,
  name,
  description: null,
  media: [],
  categoryId: "cardio",
  bodyZoneIds: ["cuisses"],
  phases: [],
  nextPhaseId: 1,
  used: true,
  levelGroup: null,
});

beforeEach(async () => {
  database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
  sequence = 0;
});

afterEach(() => {
  database.close();
});

describe("PRE-7 A3.1 — ActivityDefinitionService.getMovementLevels", () => {
  it("rang et total dérivés, membres ordonnés et leurs Exercices ; geste local sans Exercice ; rien n'est écrit", async () => {
    await seedCatalogueDefinition(database, { id: "d1", movementId: "assistes", name: "Squats assistés" });
    await seedCatalogueDefinition(database, { id: "d2", movementId: "squats", name: "Squats" });
    await database.runAsync(
      "INSERT INTO activity_definitions (id, movement_id, execution_parameters, created_at, updated_at) SELECT 'd3', movement_id, execution_parameters, created_at, updated_at FROM activity_definitions WHERE id = 'd2'",
    );
    await movements().create(localMovement("genou", "Mobilisation du genou"));
    await movements().attachToGroup("squats", "assistes");
    await movements().attachToGroup("genou", "assistes");
    const before = await database.getAllAsync("SELECT * FROM movements ORDER BY id");

    const levels = await service().getMovementLevels("squats");
    expect(levels?.position).toEqual({ rank: 2, total: 3 });
    expect(levels?.levels.map((level) => [level.rank, level.movement.id, level.definitions.map((d) => d.id).sort()])).toEqual([
      [1, "assistes", ["d1"]],
      [2, "squats", ["d2", "d3"]],
      [3, "genou", []],
    ]);
    expect((await service().getMovementLevels("genou"))?.position).toEqual({ rank: 3, total: 3 });
    expect(await database.getAllAsync("SELECT * FROM movements ORDER BY id")).toEqual(before);
  });

  it("sans groupe, singleton : rang masqué, aucun niveau ; inconnu ou sans MovementRepository : null", async () => {
    await seedCatalogueDefinition(database, { id: "d1", movementId: "fentes", name: "Fentes avant" });
    await seedCatalogueDefinition(database, { id: "d2", movementId: "gainage", name: "Gainage" });
    await seedCatalogueDefinition(database, { id: "d3", movementId: "pompes", name: "Pompes" });
    await movements().attachToGroup("gainage", "fentes");
    await movements().detachFromGroup("gainage");

    expect(await service().getMovementLevels("fentes")).toEqual({ position: null, levels: [] });
    expect(await service().getMovementLevels("pompes")).toEqual({ position: null, levels: [] });
    expect(await service().getMovementLevels("inconnu")).toBeNull();
    expect(await new ActivityDefinitionService({} as ActivityDefinitionRepository).getMovementLevels("fentes")).toBeNull();
    expect(new ActivityDefinitionService({} as ActivityDefinitionRepository).supportsMovementLevels).toBe(false);
    expect(service().supportsMovementLevels).toBe(true);
  });
});
