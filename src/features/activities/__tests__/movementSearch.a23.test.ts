import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import type { ActivityDefinitionRepository } from "@/domain/activities/ActivityDefinitionRepository";
import type { Movement } from "@/domain/activities/Movement";
import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { formatMovementChoiceSubtitle } from "@/features/activities/movementChoicePresentation";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteActivityDefinitionRepository } from "@/infrastructure/database/repositories/SqliteActivityDefinitionRepository";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { seedCatalogueDefinition } from "@/infrastructure/database/testing/seedCatalogueDefinition";

jest.mock("expo-crypto", () => ({ randomUUID: jest.fn(() => "generated-id") }));

/**
 * PRE-7 story A2.3 (MFN-04, MFN-05, MFN-06, D-439) — `searchMovements` sur SQLite RÉELLE : tous
 * les gestes, LOCAUX compris (aucune définition), nombre d'Exercices du Catalogue et position de
 * niveau calculés ; aucune écriture.
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

describe("PRE-7 A2.3 — ActivityDefinitionService.searchMovements", () => {
  it("gestes du Catalogue et gestes locaux, comptes et rangs calculés ; rien n'est écrit", async () => {
    await seedCatalogueDefinition(database, { id: "d1", movementId: "squats", name: "Squats" });
    // Second Exercice du même geste (autres paramètres, MFN/AC01).
    await database.runAsync(
      "INSERT INTO activity_definitions (id, movement_id, execution_parameters, created_at, updated_at) SELECT 'd2', movement_id, execution_parameters, created_at, updated_at FROM activity_definitions WHERE id = 'd1'",
    );
    await seedCatalogueDefinition(database, { id: "d3", movementId: "assistes", name: "Squats assistés" });
    await seedCatalogueDefinition(database, { id: "d4", movementId: "sautes", name: "Squats sautés" });
    await movements().attachToGroup("squats", "assistes");
    await movements().attachToGroup("sautes", "assistes");
    await movements().create(localMovement("genou", "Mobilisation du genou"));
    const before = await database.getAllAsync("SELECT * FROM movements ORDER BY id");

    const all = await service().searchMovements("");
    expect(all.map((choice) => choice.movement.id)).toEqual(["genou", "squats", "assistes", "sautes"]);
    const byId = new Map(all.map((choice) => [choice.movement.id, choice]));
    expect(byId.get("squats")).toMatchObject({ definitionCount: 2, level: { rank: 2, total: 3 } });
    expect(byId.get("assistes")).toMatchObject({ definitionCount: 1, level: { rank: 1, total: 3 } });
    expect(byId.get("genou")).toMatchObject({ definitionCount: 0, level: null });
    expect(formatMovementChoiceSubtitle(byId.get("squats")!)).toBe("Niveau 2 sur 3 · 2 exercices");
    expect(formatMovementChoiceSubtitle(byId.get("sautes")!)).toBe("Niveau 3 sur 3 · 1 exercice");
    expect(formatMovementChoiceSubtitle(byId.get("genou")!)).toBeNull();

    const local = await service().searchMovements("GENOU");
    expect(local.map((choice) => choice.movement.id)).toEqual(["genou"]);
    expect(await service().searchMovements("pompes")).toEqual([]);
    expect(await database.getAllAsync("SELECT * FROM movements ORDER BY id")).toEqual(before);
  });

  it("singleton : rang masqué ; sans MovementRepository : aucune recherche", async () => {
    await seedCatalogueDefinition(database, { id: "d1", movementId: "fentes", name: "Fentes avant" });
    await seedCatalogueDefinition(database, { id: "d2", movementId: "gainage", name: "Gainage" });
    await movements().attachToGroup("gainage", "fentes");
    await movements().detachFromGroup("gainage");
    const [fentes] = await service().searchMovements("fentes");
    expect(fentes).toMatchObject({ definitionCount: 1, level: null });
    expect(formatMovementChoiceSubtitle(fentes!)).toBe("1 exercice");

    const withoutMovements = new ActivityDefinitionService({} as ActivityDefinitionRepository);
    expect(withoutMovements.supportsMovementSearch).toBe(false);
    expect(await withoutMovements.searchMovements("")).toEqual([]);
    expect(service().supportsMovementSearch).toBe(true);
  });
});
