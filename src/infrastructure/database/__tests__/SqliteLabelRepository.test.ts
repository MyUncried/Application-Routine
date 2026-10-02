import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteLabelRepository } from "@/infrastructure/database/repositories/SqliteLabelRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

describe("SqliteLabelRepository", () => {
  let database: NodeSqliteDatabase;

  beforeEach(async () => {
    database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database);
  });

  afterEach(() => {
    database.close();
  });

  it("starts empty on a fresh installation", async () => {
    const repository = new SqliteLabelRepository(database);
    expect(await repository.listAll()).toEqual([]);
  });

  it("lists persisted labels ordered by createdAt ascending, active and retired confounded", async () => {
    await database.runAsync(
      `INSERT INTO labels (id, name, color, is_active, created_at) VALUES
        ('focus', 'Focus', '#3B82F6', 1, '2026-01-01T00:00:00.000Z'),
        ('legacy', 'Ancienne', '#8E8E93', 0, '2026-01-02T00:00:00.000Z')`,
    );

    const repository = new SqliteLabelRepository(database);
    const labels = await repository.listAll();

    expect(labels.map((label) => label.id)).toEqual(["focus", "legacy"]);
    expect(labels[0]).toMatchObject({ name: "Focus", color: "#3B82F6", isActive: true });
    expect(labels[1]).toMatchObject({ name: "Ancienne", color: "#8E8E93", isActive: false });
  });
});
