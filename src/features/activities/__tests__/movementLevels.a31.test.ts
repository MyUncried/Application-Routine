import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import type { Movement } from "@/domain/activities/Movement";
import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { seedMovement } from "@/infrastructure/database/testing/seedMovement";

jest.mock("expo-crypto", () => ({ randomUUID: jest.fn(() => "generated-id") }));

/**
 * PRE-7 story A3.1 (D-439, MFN-05, MFN-07, MFN-10) — `getMovementLevels` sur SQLite RÉELLE : rang et
 * total dérivés du groupe, membres ordonnés, rang masqué sans groupe ou pour un singleton ; aucune
 * écriture. [PRE-9 A.3 du 04/11/2026 : les Exercices du Catalogue de chaque niveau sont retirés avec les
 * anciennes définitions du Catalogue.]
 */

const NOW = "2026-10-24T10:00:00.000Z";
let database: NodeSqliteDatabase;
let sequence = 0;
const ids = (prefix: string) => () => `${prefix}-${++sequence}`;
const movements = () => new SqliteMovementRepository(database, ids("grp"), () => NOW);
const service = () =>
  new ActivityDefinitionService(
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
  aliases: [],
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
  it("rang et total dérivés, membres ordonnés ; geste local membre ; rien n'est écrit", async () => {
    await seedMovement(database, { movementId: "assistes", name: "Squats assistés" });
    await seedMovement(database, { movementId: "squats", name: "Squats" });
    await movements().create(localMovement("genou", "Mobilisation du genou"));
    await movements().attachToGroup("squats", "assistes");
    await movements().attachToGroup("genou", "assistes");
    const before = await database.getAllAsync("SELECT * FROM movements ORDER BY id");

    const levels = await service().getMovementLevels("squats");
    expect(levels?.position).toEqual({ rank: 2, total: 3 });
    expect(levels?.levels.map((level) => [level.rank, level.movement.id])).toEqual([
      [1, "assistes"],
      [2, "squats"],
      [3, "genou"],
    ]);
    expect((await service().getMovementLevels("genou"))?.position).toEqual({ rank: 3, total: 3 });
    expect(await database.getAllAsync("SELECT * FROM movements ORDER BY id")).toEqual(before);
  });

  it("sans groupe, singleton : rang masqué, aucun niveau ; inconnu ou sans MovementRepository : null", async () => {
    await seedMovement(database, { movementId: "fentes", name: "Fentes avant" });
    await seedMovement(database, { movementId: "gainage", name: "Gainage" });
    await seedMovement(database, { movementId: "pompes", name: "Pompes" });
    await movements().attachToGroup("gainage", "fentes");
    await movements().detachFromGroup("gainage");

    expect(await service().getMovementLevels("fentes")).toEqual({ position: null, levels: [] });
    expect(await service().getMovementLevels("pompes")).toEqual({ position: null, levels: [] });
    expect(await service().getMovementLevels("inconnu")).toBeNull();
    expect(await new ActivityDefinitionService().getMovementLevels("fentes")).toBeNull();
    expect(new ActivityDefinitionService().supportsMovementLevels).toBe(false);
    expect(service().supportsMovementLevels).toBe(true);
  });
});
