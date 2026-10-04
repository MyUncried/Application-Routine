import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteCategoryRepository } from "@/infrastructure/database/repositories/SqliteCategoryRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

function makeUuidFactory(prefix: string) {
  let counter = 0;
  return () => `${prefix}-${(counter += 1)}`;
}

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

  describe("create (V2-PRE-2, D2 reactivation ; §4.10 L137 — predefined categories are administrable like custom ones)", () => {
    it("creates a new active custom Category with the chosen color", async () => {
      const repository = new SqliteCategoryRepository(database, makeUuidFactory("cat"));
      const result = await repository.create({ name: "Danse", color: "#3B82F6" });

      expect(result.status).toBe("OK");
      if (result.status === "OK") {
        expect(result.value).toMatchObject({
          name: "Danse",
          canonicalKey: "danse",
          color: "#3B82F6",
          isActive: true,
          isPredefined: false,
          displayOrder: null,
        });
      }
    });

    it("refuses a name whose canonical key matches an ACTIVE Category, including a predefined one (DUPLICATE)", async () => {
      const repository = new SqliteCategoryRepository(database, makeUuidFactory("cat"));
      const result = await repository.create({ name: "  cardio  ", color: "#3B82F6" });
      expect(result).toEqual({ status: "DUPLICATE" });
    });

    it("reactivates a RETIRED predefined Category of the same canonical key — same identifier, isPredefined/displayOrder unchanged, chosen color applied", async () => {
      const repository = new SqliteCategoryRepository(database, makeUuidFactory("cat"));
      await repository.retire("cardio");

      const reactivated = await repository.create({ name: "Cardio", color: "#E5484D" });
      expect(reactivated.status).toBe("OK");
      if (reactivated.status === "OK") {
        expect(reactivated.value).toMatchObject({
          id: "cardio",
          isActive: true,
          isPredefined: true,
          displayOrder: 1,
          color: "#E5484D",
        });
      }

      const categories = await repository.listAll();
      expect(categories).toHaveLength(10);
    });
  });

  describe("rename", () => {
    it("renames without changing the identifier or the color", async () => {
      const repository = new SqliteCategoryRepository(database, makeUuidFactory("cat"));
      const renamed = await repository.rename("cardio", "Cardio intense");
      expect(renamed.status).toBe("OK");
      if (renamed.status === "OK") {
        expect(renamed.value).toMatchObject({ id: "cardio", name: "Cardio intense", canonicalKey: "cardio intense" });
      }
    });

    it("refuses a rename that collides with another ACTIVE Category", async () => {
      const repository = new SqliteCategoryRepository(database, makeUuidFactory("cat"));
      const result = await repository.rename("cardio", "Mobilité");
      expect(result).toEqual({ status: "DUPLICATE" });
    });

    it("returns NOT_FOUND for an unknown identifier", async () => {
      const repository = new SqliteCategoryRepository(database, makeUuidFactory("cat"));
      expect(await repository.rename("unknown", "X")).toEqual({ status: "NOT_FOUND" });
    });
  });

  describe("recolor", () => {
    it("changes the color without changing the identifier or the name, and is reflected by objects that use this Category (derived at read time)", async () => {
      const repository = new SqliteCategoryRepository(database, makeUuidFactory("cat"));
      const recolored = await repository.recolor("cardio", "#E5484D");
      expect(recolored.status).toBe("OK");
      if (recolored.status === "OK") {
        expect(recolored.value).toMatchObject({ id: "cardio", name: "Cardio", color: "#E5484D" });
      }
    });

    it("returns NOT_FOUND for an unknown identifier", async () => {
      const repository = new SqliteCategoryRepository(database, makeUuidFactory("cat"));
      expect(await repository.recolor("unknown", "#E5484D")).toEqual({ status: "NOT_FOUND" });
    });
  });

  describe("retire — predefined Categories are retirable exactly like custom ones (§4.10 L137)", () => {
    it("retires a predefined Category logically — remains listed but inactive", async () => {
      const repository = new SqliteCategoryRepository(database, makeUuidFactory("cat"));
      const retired = await repository.retire("cardio");
      expect(retired.status).toBe("OK");
      if (retired.status === "OK") {
        expect(retired.value).toMatchObject({ id: "cardio", isActive: false, isPredefined: true });
      }

      const categories = await repository.listAll();
      expect(categories).toHaveLength(10);
      expect(categories.find((category) => category.id === "cardio")?.isActive).toBe(false);
    });

    it("returns NOT_FOUND for an unknown identifier", async () => {
      const repository = new SqliteCategoryRepository(database, makeUuidFactory("cat"));
      expect(await repository.retire("unknown")).toEqual({ status: "NOT_FOUND" });
    });
  });

  describe("isUsed (§4.10 L135 — differentiated deletion message)", () => {
    it("is false for a Category referenced by no Exercise", async () => {
      const repository = new SqliteCategoryRepository(database, makeUuidFactory("cat"));
      expect(await repository.isUsed("cardio")).toBe(false);
    });

    it("is true once an Exercise of the Catalogue references the Category", async () => {
      await database.runAsync(
        `INSERT INTO activity_definitions (
          id, name, description, execution_mode, duration_seconds, repetition_count,
          series_count, pause_seconds, category_id, side_mode, side_recovery_seconds, created_at, updated_at
        ) VALUES ('def-1', 'Squat', NULL, 'DURATION', 30, NULL, 3, 10, 'cardio', 'UNILATERAL', 0, 'now', 'now')`,
      );
      const repository = new SqliteCategoryRepository(database, makeUuidFactory("cat"));
      expect(await repository.isUsed("cardio")).toBe(true);
    });
  });
});
