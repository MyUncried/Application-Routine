import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import type { Movement } from "@/domain/activities/Movement";
import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { seedMovement } from "@/infrastructure/database/testing/seedMovement";

jest.mock("expo-crypto", () => ({ randomUUID: jest.fn(() => "generated-id") }));

/**
 * PRE-7 story A2.3 (MFN-04, MFN-05, MFN-06, D-439), R-5 (v7 §6 R03, l.27) — `listMovementChoices`
 * sur SQLite RÉELLE : tous les mouvements, LOCAUX compris (aucune occurrence), position de niveau
 * calculée ; aucune écriture. [PRE-9 A.3 du 04/11/2026 : nombre d'Exercices du Catalogue et ordre de
 * parcours du Catalogue retirés avec les anciennes définitions du Catalogue ; ordre du dépôt (nom
 * normalisé, puis identifiant).]
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

describe("PRE-7 R-5 — ActivityDefinitionService.listMovementChoices", () => {
  it("tous les mouvements dans l'ordre du dépôt (nom normalisé) ; rangs calculés ; rien n'est écrit", async () => {
    await seedMovement(database, { movementId: "squats", name: "Squats" });
    await seedMovement(database, { movementId: "assistes", name: "Squats assistés" });
    await seedMovement(database, { movementId: "sautes", name: "Squats sautés" });
    await movements().attachToGroup("squats", "assistes");
    await movements().attachToGroup("sautes", "assistes");
    await movements().create(localMovement("genou", "Mobilisation du genou"));
    await movements().create(localMovement("abdos", "Abdominaux"));
    const before = await database.getAllAsync("SELECT * FROM movements ORDER BY id");

    const all = await service().listMovementChoices();
    expect(all.map((choice) => choice.movement.id)).toEqual(["abdos", "genou", "squats", "assistes", "sautes"]);
    const byId = new Map(all.map((choice) => [choice.movement.id, choice]));
    expect(byId.get("squats")).toMatchObject({ level: { rank: 2, total: 3 } });
    expect(byId.get("assistes")).toMatchObject({ level: { rank: 1, total: 3 } });
    expect(byId.get("genou")).toMatchObject({ level: null });
    expect(await database.getAllAsync("SELECT * FROM movements ORDER BY id")).toEqual(before);
  });

  it("singleton : rang masqué ; sans MovementRepository : aucune liste", async () => {
    await seedMovement(database, { movementId: "fentes", name: "Fentes avant" });
    await seedMovement(database, { movementId: "gainage", name: "Gainage" });
    await movements().attachToGroup("gainage", "fentes");
    await movements().detachFromGroup("gainage");
    const fentes = (await service().listMovementChoices()).find((choice) => choice.movement.id === "fentes");
    expect(fentes).toMatchObject({ level: null });

    const withoutMovements = new ActivityDefinitionService();
    expect(withoutMovements.supportsMovementSearch).toBe(false);
    expect(await withoutMovements.listMovementChoices()).toEqual([]);
    expect(service().supportsMovementSearch).toBe(true);
  });
});
