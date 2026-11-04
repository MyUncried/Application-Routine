import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteMediaRepository ,
  MediaAssetWriteError,} from "@/infrastructure/database/repositories/SqliteMediaRepository";
import { replaceMovementMediaLinks } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { seedMovement } from "@/infrastructure/database/testing/seedMovement";
import type { MediaAsset } from "@/domain/media/MediaAsset";

/**
 * Mouvement `mov-{id}`, qui porte les médias. [PRE-9 A.3 du 04/11/2026 : plus d'ancienne définition du
 * Catalogue ; la lecture des médias d'une définition (`listForActivityDefinition`) est retirée avec
 * elles — les liens sont relus sur `movement_media`.]
 */
async function seedActivityDefinition(database: NodeSqliteDatabase, id: string): Promise<void> {
  await seedMovement(database, { movementId: `mov-${id}`, name: `Squat ${id}` });
}

/** Liens ordonnés du Mouvement, avec la taille de leur asset. */
async function listMovementMedia(
  database: NodeSqliteDatabase,
  movementId: string,
): Promise<readonly { readonly assetId: string; readonly position: number; readonly asset: { readonly sizeBytes: number | null } }[]> {
  const rows = await database.getAllAsync<{ asset_id: string; position: number; size_bytes: number | null }>(
    `SELECT movement_media.asset_id, movement_media.position, media_assets.size_bytes
     FROM movement_media JOIN media_assets ON media_assets.id = movement_media.asset_id
     WHERE movement_media.movement_id = ? ORDER BY movement_media.position`,
    [movementId],
  );
  return rows.map((row) => ({ assetId: row.asset_id, position: row.position, asset: { sizeBytes: row.size_bytes } }));
}

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
      replaceMovementMediaLinks(transaction, "mov-def-1", [{ assetId: "a", asset: asset("a") }, { assetId: "b", asset: asset("b") }], uuid),
    );
    // Réordonner : aucune violation UNIQUE(position) ; métadonnées inchangées même si une autre copie est fournie.
    await database.withExclusiveTransactionAsync((transaction) =>
      replaceMovementMediaLinks(
        transaction,
        "mov-def-1",
        [{ assetId: "b", asset: { ...asset("b"), sizeBytes: 999 } }, { assetId: "a" }],
        uuid,
      ),
    );
    const listed = await listMovementMedia(database, "mov-def-1");
    expect(listed.map((item) => [item.assetId, item.position])).toEqual([
      ["b", 0],
      ["a", 1],
    ]);
    expect(listed[0]!.asset.sizeBytes).toBe(1);
    // Asset inconnu sans charge : FK réelle, rollback complet (aucun lien retiré).
    await expect(
      database.withExclusiveTransactionAsync((transaction) =>
        replaceMovementMediaLinks(transaction, "mov-def-1", [{ assetId: "ghost" }], uuid),
      ),
    ).rejects.toThrow();
    expect((await listMovementMedia(database, "mov-def-1")).map((item) => item.assetId)).toEqual(["b", "a"]);
    // Asset invalide : refusé avant toute écriture.
    await expect(
      database.withExclusiveTransactionAsync((transaction) =>
        replaceMovementMediaLinks(transaction, "mov-def-1", [{ assetId: "x", asset: { ...asset("x"), uri: " " } }], uuid),
      ),
    ).rejects.toThrow(MediaAssetWriteError);
    expect(await database.getAllAsync("PRAGMA foreign_key_check")).toEqual([]);
  });

  it("P3-23/file-preservation — retirer tous les liens ne supprime jamais l'asset ; références comptées sur les liens des Mouvements (R-3)", async () => {
    await database.withExclusiveTransactionAsync((transaction) =>
      replaceMovementMediaLinks(transaction, "mov-def-1", [{ assetId: "a", asset: asset("a") }], uuid),
    );
    const repository = new SqliteMediaRepository(database);
    expect(await repository.countReferences("a")).toBe(1);
    await database.withExclusiveTransactionAsync((transaction) => replaceMovementMediaLinks(transaction, "mov-def-1", [], uuid));
    expect(await repository.countReferences("a")).toBe(0);
    expect(await repository.findAsset("a")).toEqual(asset("a"));
    const remaining = await database.getFirstAsync<{ count: number }>("SELECT COUNT(*) AS count FROM media_assets");
    expect(remaining?.count).toBe(1);
  });
});
