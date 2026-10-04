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

  /**
   * V2-PRE-1 (plan §3.3/§13, REQ-001108DC7F67664C, UI-40094921B202-
   * A2E0666968E44) : les médias sont persistés avec une position STABLE égale
   * à l'ordre du tableau fourni (0-indexée), jamais retriée.
   */
  describe("médias (V2-PRE-1, plan §3.3/§13, REQ-001108DC7F67664C)", () => {
    async function seedAsset(id: string): Promise<void> {
      await database.runAsync(
        `INSERT INTO media_assets (id, uri, created_at) VALUES (?, ?, '2026-01-01T00:00:00.000Z')`,
        [id, `file:///${id}.jpg`],
      );
    }

    it("create(): persists each media with a position equal to its index in the given array, never re-sorted", async () => {
      await seedAsset("asset-1");
      await seedAsset("asset-2");
      const repository = new SqliteActivityDefinitionRepository(
        database,
        makeUuidFactory("def"),
        makeClock("2026-01-01T00:00:00.000Z"),
      );

      const created = await repository.create({
        ...baseInput(),
        media: [{ assetId: "asset-2" }, { assetId: "asset-1" }],
      });

      const rows = await database.getAllAsync<{ asset_id: string; position: number }>(
        `SELECT asset_id, position FROM activity_media
         WHERE activity_definition_id = ? ORDER BY position ASC`,
        [created.id],
      );
      expect(rows).toEqual([
        { asset_id: "asset-2", position: 0 },
        { asset_id: "asset-1", position: 1 },
      ]);
    });

    it("create(): persists no media row when the input omits media", async () => {
      const repository = new SqliteActivityDefinitionRepository(database, makeUuidFactory("def"));
      const created = await repository.create(baseInput());

      const rows = await database.getAllAsync<{ id: string }>(
        `SELECT id FROM activity_media WHERE activity_definition_id = ?`,
        [created.id],
      );
      expect(rows).toHaveLength(0);
    });

    it("update(): replaces the previous media set entirely, with the new array's own order", async () => {
      await seedAsset("asset-1");
      await seedAsset("asset-2");
      await seedAsset("asset-3");
      const repository = new SqliteActivityDefinitionRepository(
        database,
        makeUuidFactory("def"),
        makeClock("2026-01-01T00:00:00.000Z"),
      );
      const created = await repository.create({
        ...baseInput(),
        media: [{ assetId: "asset-1" }],
      });

      await repository.update(created.id, {
        ...baseInput(),
        media: [{ assetId: "asset-3" }, { assetId: "asset-2" }],
      });

      const rows = await database.getAllAsync<{ asset_id: string; position: number }>(
        `SELECT asset_id, position FROM activity_media
         WHERE activity_definition_id = ? ORDER BY position ASC`,
        [created.id],
      );
      expect(rows).toEqual([
        { asset_id: "asset-3", position: 0 },
        { asset_id: "asset-2", position: 1 },
      ]);
    });

    it("create(): an unknown assetId rolls back the whole transaction — no orphan activity_definitions row survives", async () => {
      const repository = new SqliteActivityDefinitionRepository(
        database,
        makeUuidFactory("def"),
        makeClock("2026-01-01T00:00:00.000Z"),
      );

      await expect(
        repository.create({ ...baseInput(), media: [{ assetId: "missing-asset" }] }),
      ).rejects.toThrow();

      const definitions = await database.getAllAsync<{ id: string }>(
        "SELECT id FROM activity_definitions",
      );
      expect(definitions).toHaveLength(0);
    });
  });

  /**
   * T16, D-210, CE-UI-09 L2825/L2837 (V2-PRE-2) : garde « valeur retirée »
   * côté stockage — une référence `EXISTING` vers une Catégorie retirée est
   * refusée à la création ; en modification, elle reste permise UNIQUEMENT
   * si elle est identique à l'affectation déjà persistée.
   */
  describe("T16 — retired category guard (D-210)", () => {
    it("create(): rejects a reference to a retired category", async () => {
      await database.runAsync("UPDATE categories SET is_active = 0 WHERE id = 'cardio'");
      const repository = new SqliteActivityDefinitionRepository(
        database,
        makeUuidFactory("def"),
        makeClock("2026-01-01T00:00:00.000Z"),
      );

      await expect(repository.create(baseInput())).rejects.toThrow();
      const definitions = await database.getAllAsync<{ id: string }>(
        "SELECT id FROM activity_definitions",
      );
      expect(definitions).toHaveLength(0);
    });

    it("update(): keeps the already-assigned category even if it has since been retired", async () => {
      const repository = new SqliteActivityDefinitionRepository(
        database,
        makeUuidFactory("def"),
        makeClock("2026-01-01T00:00:00.000Z"),
      );
      const created = await repository.create(baseInput());
      await database.runAsync("UPDATE categories SET is_active = 0 WHERE id = 'cardio'");

      const updated = await repository.update(created.id, { ...baseInput(), name: "Squat renommé" });
      expect(updated?.categoryId).toBe("cardio");
      expect(updated?.name).toBe("Squat renommé");
    });

    it("update(): rejects switching to a DIFFERENT retired category", async () => {
      const repository = new SqliteActivityDefinitionRepository(
        database,
        makeUuidFactory("def"),
        makeClock("2026-01-01T00:00:00.000Z"),
      );
      const created = await repository.create(baseInput());
      await database.runAsync("UPDATE categories SET is_active = 0 WHERE id = 'mobilite'");

      await expect(
        repository.update(created.id, {
          ...baseInput(),
          category: { kind: "EXISTING", categoryId: "mobilite" },
        }),
      ).rejects.toThrow();

      const row = await database.getFirstAsync<{ category_id: string }>(
        "SELECT category_id FROM activity_definitions WHERE id = ?",
        [created.id],
      );
      expect(row?.category_id).toBe("cardio");
    });
  });
});
