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
 * PRE-7 story A2.3 (MFN-04, MFN-05, MFN-06, D-439), R-5 (v7 §6 R03, l.27) — `listMovementChoices`
 * sur SQLite RÉELLE : tous les mouvements, LOCAUX compris (aucune définition, aucune occurrence),
 * nombre d'Exercices du Catalogue et position de niveau calculés, ordre de parcours du Catalogue ;
 * aucune écriture.
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

describe("PRE-7 R-5 — ActivityDefinitionService.listMovementChoices", () => {
  it("mouvements du Catalogue dans l'ordre de ses groupes, puis mouvements sans exercice ; comptes et rangs calculés ; rien n'est écrit", async () => {
    await seedCatalogueDefinition(database, { id: "d1", movementId: "squats", name: "Squats" });
    // Second Exercice du même geste (autres paramètres, MFN/AC01).
    await database.runAsync(
      "INSERT INTO activity_definitions (id, movement_id, execution_parameters, created_at, updated_at) SELECT 'd2', movement_id, execution_parameters, created_at, updated_at FROM activity_definitions WHERE id = 'd1'",
    );
    await seedCatalogueDefinition(database, { id: "d3", movementId: "assistes", name: "Squats assistés" });
    await seedCatalogueDefinition(database, { id: "d4", movementId: "sautes", name: "Squats sautés" });
    // Ordre du Catalogue (`updatedAt DESC`) : sautés, puis squats, puis assistés.
    await database.runAsync(
      "UPDATE activity_definitions SET updated_at = CASE id WHEN 'd4' THEN '3' WHEN 'd1' THEN '2' WHEN 'd2' THEN '2' ELSE '1' END",
    );
    await movements().attachToGroup("squats", "assistes");
    await movements().attachToGroup("sautes", "assistes");
    await movements().create(localMovement("genou", "Mobilisation du genou"));
    await movements().create(localMovement("abdos", "Abdominaux"));
    const before = await database.getAllAsync("SELECT * FROM movements ORDER BY id");

    const all = await service().listMovementChoices();
    expect(all.map((choice) => choice.movement.id)).toEqual(["sautes", "squats", "assistes", "abdos", "genou"]);
    const byId = new Map(all.map((choice) => [choice.movement.id, choice]));
    expect(byId.get("squats")).toMatchObject({ definitionCount: 2, level: { rank: 2, total: 3 } });
    expect(byId.get("assistes")).toMatchObject({ definitionCount: 1, level: { rank: 1, total: 3 } });
    expect(byId.get("genou")).toMatchObject({ definitionCount: 0, level: null });
    expect(await database.getAllAsync("SELECT * FROM movements ORDER BY id")).toEqual(before);
  });

  it("singleton : rang masqué ; sans MovementRepository : aucune liste", async () => {
    await seedCatalogueDefinition(database, { id: "d1", movementId: "fentes", name: "Fentes avant" });
    await seedCatalogueDefinition(database, { id: "d2", movementId: "gainage", name: "Gainage" });
    await movements().attachToGroup("gainage", "fentes");
    await movements().detachFromGroup("gainage");
    const fentes = (await service().listMovementChoices()).find((choice) => choice.movement.id === "fentes");
    expect(fentes).toMatchObject({ definitionCount: 1, level: null });

    const withoutMovements = new ActivityDefinitionService({} as ActivityDefinitionRepository);
    expect(withoutMovements.supportsMovementSearch).toBe(false);
    expect(await withoutMovements.listMovementChoices()).toEqual([]);
    expect(service().supportsMovementSearch).toBe(true);
  });
});
