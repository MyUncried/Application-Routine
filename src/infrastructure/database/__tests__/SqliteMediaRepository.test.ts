import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteMediaRepository ,
  MediaAssetWriteError,
  replaceDefinitionMediaLinks,
} from "@/infrastructure/database/repositories/SqliteMediaRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import type { MediaAsset } from "@/domain/media/MediaAsset";

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

/**
 * PRE-3 — écritures transactionnelles des médias (NodeSqliteDatabase REAL).
 */
describe("SqliteMediaRepository — PRE-3 (NodeSqliteDatabase REAL)", () => {
  let database: NodeSqliteDatabase;

  beforeEach(async () => {
    database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database);
    await seedActivityDefinition(database, "def-1");
  });

  afterEach(() => {
    database.close();
  });

  const asset = (id: string): MediaAsset => ({
    id,
    uri: `kodjo-media/${id}.jpg`,
    createdAt: "2026-10-09T10:00:00.000Z",
    kind: "PHOTO",
    mimeType: "image/jpeg",
    fileName: null,
    sizeBytes: 1,
    durationMs: null,
    width: 1,
    height: 1,
  });
  let sequence = 0;
  const uuid = () => `link-${++sequence}`;

  it("P3-17/transaction-FK — assets + liens ordonnés atomiques ; positions uniques ; asset existant jamais réécrit", async () => {
    await database.withExclusiveTransactionAsync((transaction) =>
      replaceDefinitionMediaLinks(transaction, "def-1", [{ assetId: "a", asset: asset("a") }, { assetId: "b", asset: asset("b") }], uuid),
    );
    // Réordonner : aucune violation UNIQUE(position) ; métadonnées inchangées même si une autre copie est fournie.
    await database.withExclusiveTransactionAsync((transaction) =>
      replaceDefinitionMediaLinks(
        transaction,
        "def-1",
        [{ assetId: "b", asset: { ...asset("b"), sizeBytes: 999 } }, { assetId: "a" }],
        uuid,
      ),
    );
    const repository = new SqliteMediaRepository(database);
    const listed = await repository.listForActivityDefinition("def-1");
    expect(listed.map((item) => [item.assetId, item.position])).toEqual([
      ["b", 0],
      ["a", 1],
    ]);
    expect(listed[0]!.asset.sizeBytes).toBe(1);
    // Asset inconnu sans charge : FK réelle, rollback complet (aucun lien retiré).
    await expect(
      database.withExclusiveTransactionAsync((transaction) =>
        replaceDefinitionMediaLinks(transaction, "def-1", [{ assetId: "ghost" }], uuid),
      ),
    ).rejects.toThrow();
    expect((await repository.listForActivityDefinition("def-1")).map((item) => item.assetId)).toEqual(["b", "a"]);
    // Asset invalide : refusé avant toute écriture.
    await expect(
      database.withExclusiveTransactionAsync((transaction) =>
        replaceDefinitionMediaLinks(transaction, "def-1", [{ assetId: "x", asset: { ...asset("x"), uri: " " } }], uuid),
      ),
    ).rejects.toThrow(MediaAssetWriteError);
    expect(await database.getAllAsync("PRAGMA foreign_key_check")).toEqual([]);
  });

  it("P3-23/file-preservation — retirer tous les liens ne supprime jamais l'asset ; références comptées sur définitions et occurrences", async () => {
    await database.withExclusiveTransactionAsync((transaction) =>
      replaceDefinitionMediaLinks(transaction, "def-1", [{ assetId: "a", asset: asset("a") }], uuid),
    );
    const repository = new SqliteMediaRepository(database);
    expect(await repository.countReferences("a")).toBe(1);
    await database.withExclusiveTransactionAsync((transaction) => replaceDefinitionMediaLinks(transaction, "def-1", [], uuid));
    expect(await repository.countReferences("a")).toBe(0);
    expect(await repository.findAsset("a")).toEqual(asset("a"));
    const remaining = await database.getFirstAsync<{ count: number }>("SELECT COUNT(*) AS count FROM media_assets");
    expect(remaining?.count).toBe(1);
  });
});
