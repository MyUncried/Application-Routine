import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { moveDraftMedia, type DraftMediaItem } from "@/domain/media/ActivityMedia";
import { ActivityMediaImportService, readyMedia, type MediaPickerPort, type PickedMedia } from "@/domain/media/ActivityMediaImportService";
import { MediaDraftLeases } from "@/domain/media/MediaDraftLeases";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import {
  replaceDefinitionMediaLinks,
  replaceSessionActivityMediaLinks,
  SqliteMediaRepository,
} from "@/infrastructure/database/repositories/SqliteMediaRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { LocalMediaStore, mediaExtension, type MediaFileSystem } from "@/infrastructure/media/LocalMediaStore";

/**
 * PRE-3 (P3-23) — copies internes sur de VRAIS fichiers temporaires (port
 * Node `fs`) et associations relues depuis une base SQLite FICHIER réelle.
 * L'adaptateur Expo (`File`/`Directory`/`Paths`) ne s'exécute pas sous Node :
 * ce module natif est simulé uniquement pour permettre l'import du fichier.
 */
jest.mock("expo-file-system", () => ({ File: class {}, Directory: class {}, Paths: {} }));

function nodeFileSystem(root: string, options: { failCopyOf?: Set<string>; available?: number | null } = {}): MediaFileSystem {
  return {
    documentRoot: () => root,
    join: (base, relative) => path.join(base, relative),
    ensureDirectory: (dir) => fs.mkdirSync(dir, { recursive: true }),
    copy: async (source, destination) => {
      if (options.failCopyOf?.has(source)) {
        fs.writeFileSync(destination, "partial");
        throw new Error("EIO: copy interrupted");
      }
      fs.copyFileSync(source, destination);
    },
    exists: (file) => fs.existsSync(file),
    size: (file) => fs.statSync(file).size,
    delete: (file) => fs.unlinkSync(file),
    availableBytes: () => (options.available === undefined ? null : options.available),
  };
}

let tmp: string;
let documents: string;
let cache: string;

function cacheFile(name: string, content: string): string {
  const file = path.join(cache, name);
  fs.writeFileSync(file, content);
  return file;
}

function pickedFrom(file: string, kind: PickedMedia["kind"]): PickedMedia {
  return {
    uri: file,
    kind,
    mimeType: kind === "VIDEO" ? "video/quicktime" : "image/jpeg",
    fileName: path.basename(file),
    sizeBytes: fs.statSync(file).size,
    durationMs: kind === "VIDEO" ? 2000 : null,
    width: 2,
    height: 2,
    nativeAssetId: null,
  };
}

const pickerOf = (items: PickedMedia[]): MediaPickerPort => ({
  pickFromLibrary: async () => ({ status: "PICKED", items, limitedAccess: false }),
});

let sequence = 0;
const uuid = () => `id-${++sequence}`;
const now = () => "2026-10-09T10:00:00.000Z";

async function seed(database: NodeSqliteDatabase): Promise<void> {
  await database.runAsync(
    `INSERT INTO activity_definitions (id, name, description, execution_mode, duration_seconds, repetition_count,
      series_count, pause_seconds, side_mode, created_at, updated_at)
     VALUES ('def-1', 'Squat', NULL, 'DURATION', 30, NULL, 1, 0, 'UNILATERAL', 'now', 'now')`,
  );
}

beforeEach(() => {
  sequence = 0;
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "kodjo-pre3-media-"));
  documents = path.join(tmp, "documents");
  cache = path.join(tmp, "cache");
  fs.mkdirSync(documents);
  fs.mkdirSync(cache);
});

afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe("LocalMediaStore — PRE-3 (fichiers temporaires réels)", () => {
  it("P3-23/import-multiple — trois copies internes stables, associations ordonnées durables relues après réouverture de la base", async () => {
    const store = new LocalMediaStore(nodeFileSystem(documents));
    const service = new ActivityMediaImportService(
      pickerOf([
        pickedFrom(cacheFile("a.jpg", "photo-a"), "PHOTO"),
        pickedFrom(cacheFile("b.mov", "video-b"), "VIDEO"),
        pickedFrom(cacheFile("c.jpg", "photo-c"), "PHOTO"),
      ]),
      store,
      uuid,
      now,
    );
    const result = await service.importFromLibrary("draft-1");
    const ready = readyMedia(result.status === "IMPORTED" ? result.items : []);
    expect(ready.map((item) => item.asset.uri)).toEqual(["kodjo-media/id-1.jpg", "kodjo-media/id-2.mov", "kodjo-media/id-3.jpg"]);
    // Le cache du sélecteur peut disparaître : les copies internes restent lisibles, octets identiques.
    fs.rmSync(cache, { recursive: true, force: true });
    expect(ready.map((item) => fs.readFileSync(store.resolveUri(item.asset.uri), "utf8"))).toEqual(["photo-a", "video-b", "photo-c"]);
    expect(ready[1]!.asset.sizeBytes).toBe("video-b".length);

    // Ordre personnalisé puis enregistrement transactionnel, fermeture et réouverture.
    const ordered: readonly DraftMediaItem[] = moveDraftMedia(ready, 2, 0);
    const databasePath = path.join(tmp, "kodjo.db");
    const database = NodeSqliteDatabase.openFile(databasePath);
    await migrateDatabase(database);
    await seed(database);
    await database.withExclusiveTransactionAsync((transaction) => replaceDefinitionMediaLinks(transaction, "def-1", ordered, uuid));
    database.close();
    const reopened = NodeSqliteDatabase.openFile(databasePath);
    try {
      const listed = await new SqliteMediaRepository(reopened).listForActivityDefinition("def-1");
      expect(listed.map((item) => [item.position, item.asset.uri, item.asset.kind])).toEqual([
        [0, "kodjo-media/id-3.jpg", "PHOTO"],
        [1, "kodjo-media/id-1.jpg", "PHOTO"],
        [2, "kodjo-media/id-2.mov", "VIDEO"],
      ]);
      expect(listed.every((item) => store.fileExists(item.asset.uri))).toBe(true);
    } finally {
      reopened.close();
    }
    expect(mediaExtension({ fileName: null, uri: "ph://abc", mimeType: "video/mp4", kind: "VIDEO" })).toBe(".mp4");
  });

  it("P3-23/cancel-local-error — copie interrompue sans fichier partiel ; les autres conservées ; Réessayer réécrit la même identité sans doublon", async () => {
    const failing = new Set<string>();
    const store = new LocalMediaStore(nodeFileSystem(documents, { failCopyOf: failing }));
    const first = cacheFile("a.jpg", "A");
    const second = cacheFile("b.mov", "BB");
    failing.add(second);
    const service = new ActivityMediaImportService(pickerOf([pickedFrom(first, "PHOTO"), pickedFrom(second, "VIDEO")]), store, uuid, now);
    const result = await service.importFromLibrary("draft-1");
    const items = result.status === "IMPORTED" ? result.items : [];
    expect(items.map((item) => item.state)).toEqual(["READY", "FAILED"]);
    expect(fs.readdirSync(path.join(documents, "kodjo-media")).sort()).toEqual(["id-1.jpg"]);

    failing.clear();
    const retried = await service.retry("draft-1", items[1]!);
    expect(retried.state === "READY" && retried.media.asset.uri).toBe("kodjo-media/id-2.mov");
    expect(fs.readdirSync(path.join(documents, "kodjo-media")).sort()).toEqual(["id-1.jpg", "id-2.mov"]);

    // Stockage plein connu : erreur locale, aucune écriture.
    const full = new LocalMediaStore(nodeFileSystem(path.join(tmp, "full"), { available: 0 }));
    const fullResult = await new ActivityMediaImportService(pickerOf([pickedFrom(first, "PHOTO")]), full, uuid, now).importFromLibrary("d");
    expect(fullResult.status === "IMPORTED" && fullResult.items[0]!.state === "FAILED" && fullResult.items[0]!.error).toBe("STORAGE_FULL");
    expect(fs.existsSync(path.join(tmp, "full", "kodjo-media"))).toBe(false);
  });

  it("P3-23/file-preservation — un fichier partagé par la définition, deux occurrences et un brouillon actif n'est jamais supprimé ; seule la préparation non référencée du brouillon abandonné l'est", async () => {
    const store = new LocalMediaStore(nodeFileSystem(documents));
    const leases = new MediaDraftLeases();
    const shared = cacheFile("shared.jpg", "S");
    const extra = cacheFile("extra.jpg", "E");
    const service = new ActivityMediaImportService(pickerOf([pickedFrom(shared, "PHOTO"), pickedFrom(extra, "PHOTO")]), store, uuid, now, leases);
    const importResult = await service.importFromLibrary("draft-def");
    const imported = readyMedia(importResult.status === "IMPORTED" ? importResult.items : []);
    const [sharedItem, extraItem] = imported;

    const database = NodeSqliteDatabase.openInMemory();
    try {
      await migrateDatabase(database);
      await seed(database);
      await database.runAsync(
        `INSERT INTO sessions (id, owner_id, name, color, status, initial_countdown_seconds, final_phase_seconds, created_at, updated_at)
         VALUES ('s', 'o', 'S', '#000000', 'ACTIVE', 0, 0, 'now', 'now')`,
      ).catch(() => undefined);
      const repository = new SqliteMediaRepository(database);
      // Définition enregistrée avec le média partagé seulement.
      await database.withExclusiveTransactionAsync((transaction) =>
        replaceDefinitionMediaLinks(transaction, "def-1", [sharedItem!], uuid),
      );
      leases.commitDraft("draft-def");
      // Un autre brouillon actif emprunte le même fichier.
      leases.lease("draft-copy", sharedItem!.assetId);
      // Retirer le lien de la définition : l'asset et ses octets restent.
      await database.withExclusiveTransactionAsync((transaction) => replaceDefinitionMediaLinks(transaction, "def-1", [], uuid));
      expect(await repository.findAsset(sharedItem!.assetId)).not.toBeNull();
      expect(store.fileExists(sharedItem!.asset.uri)).toBe(true);
      expect(typeof replaceSessionActivityMediaLinks).toBe("function");

      // Un nouveau brouillon prépare `extra` puis est abandonné (confirmé) : seule cette préparation est éligible.
      leases.registerPrepared("draft-abandoned", extraItem!.assetId);
      leases.registerPrepared("draft-abandoned", sharedItem!.assetId);
      const referenced = new Set<string>();
      if ((await repository.countReferences(sharedItem!.assetId)) > 0) {
        referenced.add(sharedItem!.assetId);
      }
      const deleted = await service.cleanupAbandonedDraft("draft-abandoned", referenced);
      expect(deleted).toEqual([extraItem!.assetId]);
      expect(store.fileExists(extraItem!.asset.uri)).toBe(false);
      // Prêté au brouillon actif « draft-copy » : jamais supprimé.
      expect(store.fileExists(sharedItem!.asset.uri)).toBe(true);
      expect(fs.readFileSync(store.resolveUri(sharedItem!.asset.uri), "utf8")).toBe("S");
      // Aucune suppression hors du stockage interne.
      await expect(store.deletePrepared(shared)).rejects.toThrow();
      await expect(store.deletePrepared("kodjo-media/../../x")).rejects.toThrow();
      expect(fs.existsSync(shared)).toBe(true);
    } finally {
      database.close();
    }
  });
});
