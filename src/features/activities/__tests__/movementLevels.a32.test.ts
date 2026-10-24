import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import type { ActivityDefinitionRepository } from "@/domain/activities/ActivityDefinitionRepository";
import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteActivityDefinitionRepository } from "@/infrastructure/database/repositories/SqliteActivityDefinitionRepository";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { seedCatalogueDefinition } from "@/infrastructure/database/testing/seedCatalogueDefinition";

jest.mock("expo-crypto", () => ({ randomUUID: jest.fn(() => "generated-id") }));

/**
 * PRE-7 story A3.2 (D-439, MFN-05, MFN/AC07, MFN/AC33) — `reorderMovementLevels` sur SQLite RÉELLE :
 * seules les clés de tri du groupe changent (rang recalculé), contenus, identités et Exercices
 * intacts ; ordre invalide, geste sans groupe ou inconnu : rien n'est écrit.
 */

const NOW = "2026-10-24T12:00:00.000Z";
const LATER = "2026-10-24T12:05:00.000Z";
let database: NodeSqliteDatabase;
let sequence = 0;
const ids = (prefix: string) => () => `${prefix}-${++sequence}`;
const movements = (now = NOW) => new SqliteMovementRepository(database, ids("grp"), () => now);
const service = (now = NOW) =>
  new ActivityDefinitionService(
    new SqliteActivityDefinitionRepository(database, ids("def"), () => now),
    undefined,
    undefined,
    undefined,
    undefined,
    movements(now),
  );

beforeEach(async () => {
  database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
  sequence = 0;
});

afterEach(() => {
  database.close();
});

/** Groupe « Squats assistés » (1) → « Squats » (2) → « Squats sautés » (3). */
async function threeLevels() {
  await seedCatalogueDefinition(database, { id: "d1", movementId: "assistes", name: "Squats assistés" });
  await seedCatalogueDefinition(database, { id: "d2", movementId: "squats", name: "Squats" });
  await seedCatalogueDefinition(database, { id: "d3", movementId: "sautes", name: "Squats sautés" });
  await movements().attachToGroup("squats", "assistes");
  await movements().attachToGroup("sautes", "assistes");
}

const ranks = (levels: { readonly levels: readonly { readonly rank: number; readonly movement: { readonly id: string } }[] }) =>
  levels.levels.map((level) => [level.rank, level.movement.id]);

describe("PRE-7 A3.2 — ActivityDefinitionService.reorderMovementLevels", () => {
  it("nouvel ordre écrit, rang recalculé ; seules clés de tri et dates des gestes changent ; Exercices intacts", async () => {
    await threeLevels();
    const definitionsBefore = await database.getAllAsync("SELECT * FROM activity_definitions ORDER BY id");
    const movementsBefore = await database.getAllAsync<Record<string, unknown>>("SELECT * FROM movements ORDER BY id");

    const result = await service(LATER).reorderMovementLevels("squats", ["sautes", "assistes", "squats"]);
    expect(result.status).toBe("OK");
    if (result.status !== "OK") return;
    expect(result.levels.position).toEqual({ rank: 3, total: 3 });
    expect(ranks(result.levels)).toEqual([
      [1, "sautes"],
      [2, "assistes"],
      [3, "squats"],
    ]);
    expect(result.levels.levels.map((level) => level.definitions.map((definition) => definition.id))).toEqual([["d3"], ["d1"], ["d2"]]);
    expect(ranks((await service().getMovementLevels("assistes"))!)).toEqual(ranks(result.levels));

    // Aucune modification du geste (MFN-05) : ni contenu, ni identité, ni groupe ; aucun Exercice touché.
    expect(await database.getAllAsync("SELECT * FROM activity_definitions ORDER BY id")).toEqual(definitionsBefore);
    const movementsAfter = await database.getAllAsync<Record<string, unknown>>("SELECT * FROM movements ORDER BY id");
    const unchanged = (row: Record<string, unknown>) => {
      const { level_sort_key: _sortKey, updated_at: _updatedAt, ...rest } = row;
      return rest;
    };
    expect(movementsAfter.map(unchanged)).toEqual(movementsBefore.map(unchanged));
    expect(new Set(movementsAfter.map((row) => row.level_group_id)).size).toBe(1);
  });

  it("ordre invalide (membre manquant, doublon, étranger) : INVALID_ORDER, rien n'est écrit", async () => {
    await threeLevels();
    await seedCatalogueDefinition(database, { id: "d4", movementId: "pompes", name: "Pompes" });
    const before = await database.getAllAsync("SELECT * FROM movements ORDER BY id");
    for (const order of [["squats", "assistes"], ["squats", "squats", "assistes"], ["squats", "assistes", "pompes"]]) {
      expect(await service(LATER).reorderMovementLevels("squats", order)).toEqual({ status: "INVALID_ORDER" });
    }
    expect(await database.getAllAsync("SELECT * FROM movements ORDER BY id")).toEqual(before);
  });

  it("sans groupe, inconnu ou sans MovementRepository : NOT_FOUND, rien n'est écrit", async () => {
    await seedCatalogueDefinition(database, { id: "d1", movementId: "pompes", name: "Pompes" });
    const before = await database.getAllAsync("SELECT * FROM movements ORDER BY id");
    expect(await service(LATER).reorderMovementLevels("pompes", ["pompes"])).toEqual({ status: "NOT_FOUND" });
    expect(await service(LATER).reorderMovementLevels("inconnu", ["inconnu"])).toEqual({ status: "NOT_FOUND" });
    expect(
      await new ActivityDefinitionService({} as ActivityDefinitionRepository).reorderMovementLevels("pompes", ["pompes"]),
    ).toEqual({ status: "NOT_FOUND" });
    expect(await database.getAllAsync("SELECT * FROM movements ORDER BY id")).toEqual(before);
  });
});
