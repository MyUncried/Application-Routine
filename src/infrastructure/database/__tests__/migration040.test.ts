import { describe, expect, it } from "@jest/globals";

import { DATABASE_VERSION } from "@/infrastructure/database/constants";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteMediaRepository } from "@/infrastructure/database/repositories/SqliteMediaRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/** D-600 — migration 040 : vue retenue d'une photo (marquage des photos), colonnes additives nullables de `media_assets`. */
describe("migration040 — vue retenue des photos", () => {
  it("depuis la version 39 : assets existants conservés, sans vue (image entière), version 40", async () => {
    const database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database, undefined, 39);
    await database.runAsync("INSERT INTO media_assets (id, uri, created_at, kind) VALUES ('a1', 'kodjo-media/a1.jpg', 't', 'PHOTO')");
    await migrateDatabase(database);
    expect(DATABASE_VERSION).toBe(40);
    expect(await database.getFirstAsync("PRAGMA user_version")).toEqual({ user_version: 40 });
    expect(await new SqliteMediaRepository(database).findAsset("a1")).toMatchObject({ uri: "kodjo-media/a1.jpg" });
  });

  it("vue relue telle qu'écrite ; pourcentages hors de 0–100 refusés par la base", async () => {
    const database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database);
    await database.runAsync(
      "INSERT INTO media_assets (id, uri, created_at, view_x, view_y, view_width, view_height) VALUES ('a2', 'kodjo-media/a2.webp', 't', 50.5, 0, 49.5, 100)",
    );
    expect((await new SqliteMediaRepository(database).findAsset("a2"))?.view).toEqual({ x: 50.5, y: 0, width: 49.5, height: 100 });
    await expect(
      database.runAsync("INSERT INTO media_assets (id, uri, created_at, view_x) VALUES ('a3', 'kodjo-media/a3.webp', 't', 120)"),
    ).rejects.toThrow();
  });
});
