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

  /**
   * V2-PRE-1 (plan §3.1/§14, REQ-C78EAD48949240B1, REQ-CA29CD728EEABCB2) :
   * `categories.color`/`categories.is_active` sont de nouvelles colonnes
   * (`migration007`, `NOT NULL DEFAULT`) — une Catégorie prédéfinie déjà
   * seedée par `migration001` les reçoit donc via leur valeur par défaut
   * (`'#8E8E93'`/active), jamais `NULL` ni une exception de lecture.
   */
  it("reads the new color/isActive columns with their migration007 defaults for an already-seeded predefined category", async () => {
    const repository = new SqliteCategoryRepository(database);
    const categories = await repository.listAll();
    const cardio = categories.find((category) => category.id === "cardio");

    expect(cardio).toMatchObject({ color: "#8E8E93", isActive: true });
  });

  it("reads a custom category's own color and isActive, never the predefined default", async () => {
    await database.runAsync(
      `INSERT INTO categories (id, name, canonical_key, color, is_predefined, display_order, is_active, created_at)
       VALUES ('custom-retired', 'Catégorie retirée', 'categorie retiree', '#FF2D55', 0, NULL, 0, '2026-01-03T00:00:00.000Z')`,
    );

    const repository = new SqliteCategoryRepository(database);
    const categories = await repository.listAll();
    const custom = categories.find((category) => category.id === "custom-retired");

    expect(custom).toMatchObject({ color: "#FF2D55", isActive: false });
  });
});
