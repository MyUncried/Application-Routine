import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteActivityDefinitionRepository } from "@/infrastructure/database/repositories/SqliteActivityDefinitionRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

function makeUuidFactory(prefix: string) {
  let counter = 0;
  return () => `${prefix}-${++counter}`;
}

function makeClock(startIso: string) {
  let current = new Date(startIso).getTime();
  return () => {
    const iso = new Date(current).toISOString();
    current += 1000;
    return iso;
  };
}

describe("SqliteActivityDefinitionRepository", () => {
  let database: NodeSqliteDatabase;

  beforeEach(async () => {
    database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database);
  });

  afterEach(() => {
    database.close();
  });

  function baseInput() {
    return {
      name: "Squat",
      description: "Descente lente",
      executionMode: "DURATION" as const,
      durationSeconds: 30,
      repetitionCount: null,
      seriesCount: 3,
      pauseSeconds: 10,
      category: { kind: "EXISTING" as const, categoryId: "cardio" },
      sideRecoverySeconds: 5,
      bodyZoneIds: ["cuisses", "genoux"],
    };
  }

  it("creates a definition and reads it back with its body zones", async () => {
    const repository = new SqliteActivityDefinitionRepository(
      database,
      makeUuidFactory("def"),
      makeClock("2026-01-01T00:00:00.000Z"),
    );

    const created = await repository.create(baseInput());
    expect(created.id).toBe("def-1");
    expect(created.sideMode).toBe("UNILATERAL");

    const found = await repository.findById(created.id);
    expect(found).toEqual(created);
    expect(found?.bodyZoneIds.slice().sort()).toEqual(["cuisses", "genoux"]);
  });

  it("returns null when reading an unknown id", async () => {
    const repository = new SqliteActivityDefinitionRepository(database);
    expect(await repository.findById("missing")).toBeNull();
  });

  it("lists definitions ordered by updatedAt DESC", async () => {
    const repository = new SqliteActivityDefinitionRepository(
      database,
      makeUuidFactory("def"),
      makeClock("2026-01-01T00:00:00.000Z"),
    );

    const first = await repository.create({ ...baseInput(), name: "Premier" });
    const second = await repository.create({ ...baseInput(), name: "Second" });

    const listed = await repository.listAll();
    expect(listed.map((d) => d.name)).toEqual(["Second", "Premier"]);
    expect(new Date(second.updatedAt).getTime()).toBeGreaterThan(
      new Date(first.updatedAt).getTime(),
    );
  });

  it("updates a definition in place, replacing its body zones and updatedAt", async () => {
    const repository = new SqliteActivityDefinitionRepository(
      database,
      makeUuidFactory("def"),
      makeClock("2026-01-01T00:00:00.000Z"),
    );
    const created = await repository.create(baseInput());

    const updated = await repository.update(created.id, {
      ...baseInput(),
      name: "Squat modifié",
      bodyZoneIds: ["dos"],
    });

    expect(updated?.name).toBe("Squat modifié");
    expect(updated?.bodyZoneIds).toEqual(["dos"]);
    expect(updated?.createdAt).toBe(created.createdAt);
    expect(new Date(updated!.updatedAt).getTime()).toBeGreaterThan(
      new Date(created.updatedAt).getTime(),
    );

    const reread = await repository.findById(created.id);
    expect(reread?.bodyZoneIds).toEqual(["dos"]);
  });

  it("returns null when updating an unknown id, without creating a row", async () => {
    const repository = new SqliteActivityDefinitionRepository(database);
    const result = await repository.update("missing", baseInput());
    expect(result).toBeNull();

    const listed = await repository.listAll();
    expect(listed).toHaveLength(0);
  });

  it("keeps the definition an independent root: it never writes to sessions/activities tables", async () => {
    const repository = new SqliteActivityDefinitionRepository(database, makeUuidFactory("def"));
    await repository.create(baseInput());

    const sessionCount = await database.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) AS count FROM sessions",
    );
    const activityCount = await database.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) AS count FROM activities",
    );
    expect(sessionCount?.count).toBe(0);
    expect(activityCount?.count).toBe(0);
  });

  /**
   * Revue indépendante 5732014381, obligation 7 : preuve du rollback de
   * transaction `ActivityDefinition`/Zones corporelles. `create()`/`update()`
   * écrivent la ligne principale PUIS ses Zones dans une seule transaction
   * exclusive (`withExclusiveTransactionAsync`) — un identifiant de Zone
   * dupliqué viole la clé primaire composite
   * `(activity_definition_id, body_zone_id)` de `activity_definition_body_zones`
   * en cours d'écriture : la transaction entière doit alors être annulée,
   * y compris la ligne `activity_definitions` déjà insérée avant l'échec.
   */
  describe("rollback de transaction (revue 5732014381, obligation 7)", () => {
    it("create(): a body-zone conflict rolls back the whole transaction — no orphan activity_definitions row survives", async () => {
      const repository = new SqliteActivityDefinitionRepository(
        database,
        makeUuidFactory("def"),
        makeClock("2026-01-01T00:00:00.000Z"),
      );

      await expect(
        repository.create({ ...baseInput(), bodyZoneIds: ["dos", "dos"] }),
      ).rejects.toThrow();

      const definitions = await database.getAllAsync<{ id: string }>(
        "SELECT id FROM activity_definitions",
      );
      expect(definitions).toHaveLength(0);
      const zones = await database.getAllAsync<{ activity_definition_id: string }>(
        "SELECT activity_definition_id FROM activity_definition_body_zones",
      );
      expect(zones).toHaveLength(0);
    });

    it("update(): a body-zone conflict rolls back the whole transaction — the previous row and its zones are left untouched", async () => {
      const repository = new SqliteActivityDefinitionRepository(
        database,
        makeUuidFactory("def"),
        makeClock("2026-01-01T00:00:00.000Z"),
      );
      const created = await repository.create(baseInput());

      await expect(
        repository.update(created.id, { ...baseInput(), name: "Corrompu", bodyZoneIds: ["dos", "dos"] }),
      ).rejects.toThrow();

      const reread = await repository.findById(created.id);
      expect(reread?.name).toBe("Squat");
      expect(reread?.bodyZoneIds.slice().sort()).toEqual(["cuisses", "genoux"]);
    });
  });
});
