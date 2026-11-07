import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { seedMovementTestCorpus } from "@/infrastructure/database/testing/seedMovementTestCorpus";
import { SMOKE_MOVEMENTS } from "@/infrastructure/database/testing/smokeMovementFixtures";

const TIME = "2026-11-06T12:00:00.000Z";

describe("seedMovementTestCorpus — SQLite isolée", () => {
  let db: NodeSqliteDatabase;
  beforeEach(async () => {
    db = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(db);
  });
  afterEach(() => db.close());

  it("charge les Mouvements puis les relit avec Catégories, Zones, alias et étapes", async () => {
    expect(await seedMovementTestCorpus(db, SMOKE_MOVEMENTS, TIME)).toEqual({
      inserted: 3,
      unchanged: 0,
    });
    const rows = await db.getAllAsync<{ id: string; category_id: string }>(
      "SELECT id, category_id FROM movements WHERE id LIKE 'seed-movement-%' ORDER BY id",
    );
    expect(rows).toHaveLength(3);
    expect(rows.some((row) => row.category_id === "renforcement")).toBe(true);
    const zones = await db.getAllAsync<{ body_zone_id: string }>(
      "SELECT body_zone_id FROM movement_body_zones WHERE movement_id = ?",
      [SMOKE_MOVEMENTS[0]!.id],
    );
    expect(zones.map((row) => row.body_zone_id).sort()).toEqual(["cuisses", "hanches-bassin"]);
    const aliases = await db.getAllAsync<{ alias: string }>(
      "SELECT alias FROM movement_aliases WHERE movement_id = ?",
      [SMOKE_MOVEMENTS[0]!.id],
    );
    expect(aliases.map((row) => row.alias)).toEqual(["Squat au poids du corps"]);
    const description = await db.getFirstAsync<{ description: string }>(
      "SELECT description FROM movements WHERE id = ?",
      [SMOKE_MOVEMENTS[0]!.id],
    );
    expect(description?.description.split("\n")).toHaveLength(3);
  });

  it("est idempotent sans écriture supplémentaire à la deuxième passe", async () => {
    await seedMovementTestCorpus(db, SMOKE_MOVEMENTS, TIME);
    expect(await seedMovementTestCorpus(db, SMOKE_MOVEMENTS, TIME)).toEqual({
      inserted: 0,
      unchanged: 3,
    });
    const row = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM movements WHERE id LIKE 'seed-movement-%'",
    );
    expect(row?.count).toBe(3);
  });

  it("refuse de réécrire un Mouvement local divergent", async () => {
    await seedMovementTestCorpus(db, SMOKE_MOVEMENTS, TIME);
    await db.runAsync("UPDATE movements SET description = ? WHERE id = ?", [
      "Consigne personnalisée",
      SMOKE_MOVEMENTS[0]!.id,
    ]);
    await expect(seedMovementTestCorpus(db, SMOKE_MOVEMENTS, TIME)).rejects.toThrow(
      "Refusing to overwrite",
    );
    const row = await db.getFirstAsync<{ description: string }>(
      "SELECT description FROM movements WHERE id = ?",
      [SMOKE_MOVEMENTS[0]!.id],
    );
    expect(row?.description).toBe("Consigne personnalisée");
  });

  it("annule tout le lot si une ligne ultérieure viole une référence de Catégorie", async () => {
    const bad = { ...SMOKE_MOVEMENTS[1]!, categoryId: "categorie-absente" };
    await expect(seedMovementTestCorpus(db, [SMOKE_MOVEMENTS[0]!, bad], TIME)).rejects.toThrow();
    const row = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM movements WHERE id LIKE 'seed-movement-%'",
    );
    expect(row?.count).toBe(0);
  });

  it("refuse les identifiants et noms en collision avant d'écrire", async () => {
    await expect(
      seedMovementTestCorpus(db, [SMOKE_MOVEMENTS[0]!, SMOKE_MOVEMENTS[0]!], TIME),
    ).rejects.toThrow("Duplicate");
    await expect(
      seedMovementTestCorpus(db, [
        SMOKE_MOVEMENTS[0]!,
        { ...SMOKE_MOVEMENTS[1]!, name: "Air squat" },
      ], TIME),
    ).rejects.toThrow("Duplicate");
    const row = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM movements WHERE id LIKE 'seed-movement-%'",
    );
    expect(row?.count).toBe(0);
  });
});
