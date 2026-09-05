import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteCategoryRepository } from "@/infrastructure/database/repositories/SqliteCategoryRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

describe("SqliteCategoryRepository", () => {
  let database: NodeSqliteDatabase;

  beforeEach(async () => {
    database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database);
  });

  afterEach(() => {
    database.close();
  });

  it("lists the 10 predefined categories ordered by displayOrder when no custom category exists", async () => {
    const repository = new SqliteCategoryRepository(database);
    const categories = await repository.listAll();

    expect(categories).toHaveLength(10);
    expect(categories.map((category) => category.name)).toEqual([
      "Renforcement",
      "Cardio",
      "Mobilité",
      "Étirements",
      "Équilibre",
      "Coordination",
      "Récupération",
      "Respiration",
      "Méditation",
      "Autre",
    ]);
    expect(categories.every((category) => category.isPredefined)).toBe(true);
  });

  it("lists predefined categories first (by displayOrder), then custom categories by createdAt ascending (D-107)", async () => {
    await database.runAsync(
      `INSERT INTO categories (id, name, canonical_key, is_predefined, display_order, created_at)
       VALUES ('custom-older', 'Plus ancienne', 'plus ancienne', 0, NULL, '2026-01-01T00:00:00.000Z')`,
    );
    await database.runAsync(
      `INSERT INTO categories (id, name, canonical_key, is_predefined, display_order, created_at)
       VALUES ('custom-newer', 'Plus récente', 'plus recente', 0, NULL, '2026-01-02T00:00:00.000Z')`,
    );

    const repository = new SqliteCategoryRepository(database);
    const categories = await repository.listAll();

    expect(categories).toHaveLength(12);
    expect(categories[9]?.name).toBe("Autre"); // last predefined
    expect(categories[10]?.id).toBe("custom-older");
    expect(categories[11]?.id).toBe("custom-newer");
  });

  it("exposes canonicalKey and displayOrder faithfully", async () => {
    const repository = new SqliteCategoryRepository(database);
    const categories = await repository.listAll();
    const cardio = categories.find((category) => category.id === "cardio");

    expect(cardio).toMatchObject({ canonicalKey: "cardio", displayOrder: 1, isPredefined: true });
  });
});
