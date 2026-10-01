import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteMediaRepository } from "@/infrastructure/database/repositories/SqliteMediaRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

async function seedActivityDefinition(database: NodeSqliteDatabase, id: string): Promise<void> {
  await database.runAsync(
    `INSERT INTO activity_definitions (
      id, name, description, execution_mode, duration_seconds, repetition_count,
      series_count, pause_seconds, side_mode, created_at, updated_at
    ) VALUES (?, 'Squat', NULL, 'DURATION', 30, NULL, 3, 10, 'UNILATERAL', 'now', 'now')`,
    [id],
  );
}

describe("SqliteMediaRepository", () => {
  let database: NodeSqliteDatabase;

  beforeEach(async () => {
    database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database);
  });

  afterEach(() => {
    database.close();
  });

  it("returns an empty list for an Exercise without media", async () => {
    await seedActivityDefinition(database, "def-1");
    const repository = new SqliteMediaRepository(database);
    expect(await repository.listForActivityDefinition("def-1")).toEqual([]);
  });

  it("lists several distinct media assets for the same Exercise, ordered by position", async () => {
    await seedActivityDefinition(database, "def-1");
    await database.runAsync(
      "INSERT INTO media_assets (id, uri, created_at) VALUES ('asset-1', 'file://a1', 'now'), ('asset-2', 'file://a2', 'now')",
    );
    await database.runAsync(
      `INSERT INTO activity_media (id, activity_definition_id, asset_id, position) VALUES
        ('am-2', 'def-1', 'asset-2', 1),
        ('am-1', 'def-1', 'asset-1', 0)`,
    );

    const repository = new SqliteMediaRepository(database);
    const items = await repository.listForActivityDefinition("def-1");

    expect(items.map((item) => item.id)).toEqual(["am-1", "am-2"]);
    expect(items.map((item) => item.asset.uri)).toEqual(["file://a1", "file://a2"]);
  });

  it("never mixes media from a different Exercise", async () => {
    await seedActivityDefinition(database, "def-1");
    await seedActivityDefinition(database, "def-2");
    await database.runAsync(
      "INSERT INTO media_assets (id, uri, created_at) VALUES ('asset-1', 'file://a1', 'now'), ('asset-2', 'file://a2', 'now')",
    );
    await database.runAsync(
      `INSERT INTO activity_media (id, activity_definition_id, asset_id, position) VALUES
        ('am-1', 'def-1', 'asset-1', 0),
        ('am-2', 'def-2', 'asset-2', 0)`,
    );

    const repository = new SqliteMediaRepository(database);
    const items = await repository.listForActivityDefinition("def-1");

    expect(items.map((item) => item.id)).toEqual(["am-1"]);
  });
});
