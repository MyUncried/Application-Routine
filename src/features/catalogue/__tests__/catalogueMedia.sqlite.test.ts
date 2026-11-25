import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import type { Movement } from "@/domain/activities/Movement";
import {
  CATALOGUE_MEDIA_ASSET_PREFIX,
  catalogueMediaFiles,
  withCatalogueMedia,
} from "@/domain/catalogue/catalogueMedia";
import { sheetFingerprint, type CatalogueMedia, type CatalogueSheet, type MovementCatalogueFile } from "@/domain/catalogue/MovementCatalogueFile";
import { compareSheet } from "@/domain/catalogue/catalogueLoadPlan";
import { pilotCatalogueV3 } from "@/domain/catalogue/testing/pilotCatalogueV3";
import type { DraftMediaItem } from "@/domain/media/ActivityMedia";
import { MovementCatalogueService } from "@/features/activities/MovementCatalogueService";
import { CatalogueLoadService } from "@/features/catalogue/CatalogueLoadService";
import { freshLocalMovementReader } from "@/features/catalogue/readLocalMovements";
import { SqliteCatalogueRegistry } from "@/infrastructure/catalogue/SqliteCatalogueRegistry";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteBodyZoneRepository } from "@/infrastructure/database/repositories/SqliteBodyZoneRepository";
import { SqliteCategoryRepository } from "@/infrastructure/database/repositories/SqliteCategoryRepository";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { createCatalogueMediaWriter, type CatalogueMediaFileSystem } from "@/infrastructure/media/CatalogueMediaWriter";

/**
 * Décision de Hermann du 19/11/2026 : « Je n'ai jamais exprimé le besoin d'avoir les médias d'une part et la photo
 * d'autre part. Dans mon esprit c'était toujours la même chose. » Les photos d'une fiche de catalogue deviennent des
 * médias du Mouvement (fichier interne + lien), à l'installation et à chaque mise à jour acceptée ; une mise à jour
 * remplace les médias venus de la fiche et conserve les autres. Vrais fichiers temporaires, vraie base SQLite.
 */
jest.mock("expo-file-system", () => ({ File: class {}, Directory: class {}, Paths: {} }));

const NOW = "2026-11-19T09:00:00.000Z";
const PHOTO_A = Buffer.from("photo A").toString("base64");
const PHOTO_B = Buffer.from("photo B — remplacée").toString("base64");
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

let main: NodeSqliteDatabase;
let registryDb: NodeSqliteDatabase;
let tmp: string;
let writes: string[];
let sequence = 0;

function nodeFileSystem(root: string): CatalogueMediaFileSystem {
  return {
    documentRoot: () => root,
    join: (base, relative) => path.join(base, relative),
    ensureDirectory: (dir) => fs.mkdirSync(dir, { recursive: true }),
    exists: (file) => fs.existsSync(file),
    size: (file) => fs.statSync(file).size,
    writeBase64: (file, base64) => {
      writes.push(path.basename(file));
      fs.writeFileSync(file, Buffer.from(base64, "base64"));
    },
    delete: (file) => fs.unlinkSync(file),
  };
}

const photo = (id: string, base64: string, rights: CatalogueMedia["rightsStatus"] = "PERMISSION_CONFIRMED"): CatalogueMedia => ({
  id,
  kind: "PHOTO",
  storage: "EMBEDDED",
  url: "data:image/webp;base64," + base64,
  fileName: id + ".webp",
  caption: "Illustration",
  sourceUrl: null,
  attribution: "KODJO — illustration générée par IA",
  license: "Utilisation dans KODJO autorisée",
  rightsStatus: rights,
});

/** Fichier pilote réduit à sa première fiche, avec les médias et la révision donnés. */
function fileWith(media: readonly CatalogueMedia[], revision = "1", extra: (sheet: CatalogueSheet) => CatalogueSheet = (sheet) => sheet) {
  const file = clone(pilotCatalogueV3()) as MovementCatalogueFile & { sheets: CatalogueSheet[] };
  const first = file.sheets[0] as CatalogueSheet;
  const history = [...first.history];
  for (let next = Number(first.revision) + 1; next <= Number(revision); next += 1) {
    history.push({ revision: String(next), date: "2026-11-19", author: null, summary: "Révision " + next });
  }
  const sheet = extra({ ...first, media: [...media], revision, history });
  return { ...file, sheets: [sheet], libraries: [] } as MovementCatalogueFile;
}

async function serviceOn() {
  const registry = await SqliteCatalogueRegistry.open(registryDb, () => NOW);
  return serviceWith(registry);
}

function serviceWith(registry: SqliteCatalogueRegistry) {
  const movements = new MovementCatalogueService(new SqliteMovementRepository(main, () => `gen-${++sequence}`, () => NOW));
  return new CatalogueLoadService({
    registry,
    movements,
    readLocalMovements: freshLocalMovementReader(new SqliteMovementRepository(main)),
    listReferentials: async () => ({
      categoryIds: new Set((await new SqliteCategoryRepository(main).listAll()).map((category) => category.id)),
      bodyZoneIds: new Set((await new SqliteBodyZoneRepository(main).listAll()).map((zone) => zone.id)),
    }),
    newMovementId: () => `uuid-${++sequence}`,
    catalogueMedia: createCatalogueMediaWriter(nodeFileSystem(tmp), () => NOW),
  });
}

async function acceptFirst(service: CatalogueLoadService, file: MovementCatalogueFile) {
  const prepared = await service.prepare(file);
  if (!prepared.ok) throw new Error("fichier refusé : " + JSON.stringify(prepared.issues));
  const item = prepared.plan.items[0]!;
  return { state: item.state, outcome: await service.accept(prepared.file, item.sheetId) };
}

const movementOf = async (id: string) => (await new SqliteMovementRepository(main).findById(id)) as Movement;

beforeEach(async () => {
  main = NodeSqliteDatabase.openInMemory();
  registryDb = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(main);
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "kodjo-catalogue-media-"));
  writes = [];
  sequence = 0;
});

afterEach(() => {
  main.close();
  registryDb.close();
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe("médias de fiche → médias du Mouvement (pur)", () => {
  it("photos intégrées aux droits confirmés seulement, identité stable dérivée du contenu", () => {
    const file = fileWith([photo("media-aaaaaa", PHOTO_A), photo("media-bbbbbb", PHOTO_B, "UNVERIFIED")]);
    const sheet = file.sheets[0]!;
    const files = catalogueMediaFiles(file.catalogue.id, sheet);
    expect(files).toHaveLength(1);
    expect(files[0]).toMatchObject({ mimeType: "image/webp", extension: ".webp", fileName: "media-aaaaaa.webp", base64: PHOTO_A });
    expect(files[0]!.assetId.startsWith(CATALOGUE_MEDIA_ASSET_PREFIX)).toBe(true);
    expect(catalogueMediaFiles(file.catalogue.id, sheet)[0]!.assetId).toBe(files[0]!.assetId);
    const changed = fileWith([photo("media-aaaaaa", PHOTO_B)]);
    expect(catalogueMediaFiles(file.catalogue.id, changed.sheets[0]!)[0]!.assetId).not.toBe(files[0]!.assetId);
  });

  it("médias de la fiche en tête, médias propres au Mouvement conservés après eux", () => {
    const own: DraftMediaItem = { assetId: "uuid-local", asset: { id: "uuid-local", uri: "kodjo-media/uuid-local.jpg", createdAt: NOW, kind: "PHOTO" } };
    const old: DraftMediaItem = { assetId: "catalogue-ancienne", asset: { id: "catalogue-ancienne", uri: "kodjo-media/catalogue-ancienne.webp", createdAt: NOW } };
    const fresh: DraftMediaItem = { assetId: "catalogue-nouvelle", asset: { id: "catalogue-nouvelle", uri: "kodjo-media/catalogue-nouvelle.webp", createdAt: NOW } };
    const movement = { media: [old, own] } as unknown as Movement;
    expect(withCatalogueMedia(movement, [fresh]).media.map((item) => item.assetId)).toEqual(["catalogue-nouvelle", "uuid-local"]);
  });
});

describe("installation et mise à jour sur SQLite réelle", () => {
  it("installation : la photo de la fiche est un média du Mouvement (fichier interne écrit, asset et lien en base)", async () => {
    const service = await serviceOn();
    const { state, outcome } = await acceptFirst(service, fileWith([photo("media-aaaaaa", PHOTO_A)]));
    expect(state).toBe("NEW");
    expect(outcome.status).toBe("INSTALLED");
    const movement = await movementOf((outcome as { movementId: string }).movementId);
    expect(movement.media).toHaveLength(1);
    const asset = movement.media[0]!.asset;
    expect(asset.uri).toMatch(/^kodjo-media\/catalogue-[a-z0-9]+\.webp$/);
    expect(asset.kind).toBe("PHOTO");
    expect(fs.readFileSync(path.join(tmp, asset.uri)).toString()).toBe("photo A");
  });

  it("mise à jour qui ne change que la photo : le Mouvement est réécrit avec la nouvelle photo", async () => {
    const service = await serviceOn();
    const installed = await acceptFirst(service, fileWith([photo("media-aaaaaa", PHOTO_A)]));
    const id = (installed.outcome as { movementId: string }).movementId;
    const { state, outcome } = await acceptFirst(service, fileWith([photo("media-aaaaaa", PHOTO_B)], "2"));
    expect(state).toBe("NEW_REVISION");
    expect(outcome.status).toBe("UPDATED");
    const movement = await movementOf(id);
    expect(movement.media).toHaveLength(1);
    expect(fs.readFileSync(path.join(tmp, movement.media[0]!.asset.uri)).toString()).toBe("photo B — remplacée");
  });

  it("fiche déjà installée sans média (installation antérieure) : la révision suivante ajoute la photo", async () => {
    const service = await serviceOn();
    const installed = await acceptFirst(service, fileWith([]));
    const id = (installed.outcome as { movementId: string }).movementId;
    expect((await movementOf(id)).media).toHaveLength(0);
    const { outcome } = await acceptFirst(service, fileWith([photo("media-aaaaaa", PHOTO_A)], "2"));
    expect(outcome.status).toBe("UPDATED");
    expect((await movementOf(id)).media).toHaveLength(1);
  });

  it("même photo réinstallée : aucun fichier réécrit, même asset", async () => {
    const service = await serviceOn();
    const first = await acceptFirst(service, fileWith([photo("media-aaaaaa", PHOTO_A)]));
    const id = (first.outcome as { movementId: string }).movementId;
    const before = (await movementOf(id)).media[0]!.assetId;
    const { outcome } = await acceptFirst(service, fileWith([photo("media-aaaaaa", PHOTO_A)], "2", (sheet) => ({
      ...sheet, content: { ...sheet.content, safetyNotes: sheet.content.safetyNotes + " (révisé)" },
    })));
    expect(outcome.status === "UPDATED" || outcome.status === "REGISTERED").toBe(true);
    expect((await movementOf(id)).media.map((item) => item.assetId)).toEqual([before]);
    expect(writes).toHaveLength(1);
  });
});

describe("marquage des photos : vue retenue stockée avec l'asset (D-600)", () => {
  const VIEW = { x: 50.5, y: 0, width: 49.5, height: 100 };
  const marked = (view: CatalogueMedia["view"]) => ({ ...photo("media-aaaaaa", PHOTO_A), view });

  it("pur : la vue suit la photo ; sans vue, identité inchangée ; une vue corrigée change l'identité", () => {
    const id = (media: CatalogueMedia) => catalogueMediaFiles("kodjo.pilote-60", fileWith([media]).sheets[0]!)[0]!;
    expect(id(marked(VIEW)).view).toEqual(VIEW);
    expect(id(photo("media-aaaaaa", PHOTO_A)).view).toBeNull();
    expect(id(marked(null)).assetId).toBe(id(photo("media-aaaaaa", PHOTO_A)).assetId);
    expect(id(marked(VIEW)).assetId).not.toBe(id(photo("media-aaaaaa", PHOTO_A)).assetId);
    expect(id(marked({ ...VIEW, x: 40, width: 60 })).assetId).not.toBe(id(marked(VIEW)).assetId);
  });

  it("installation : la vue est relue depuis SQLite avec l'asset du Mouvement", async () => {
    const service = await serviceOn();
    const { outcome } = await acceptFirst(service, fileWith([marked(VIEW)]));
    const movement = await movementOf((outcome as { movementId: string }).movementId);
    expect(movement.media[0]!.asset.view).toEqual(VIEW);
  });

  it("photo sans vue : image entière (vue nulle)", async () => {
    const service = await serviceOn();
    const { outcome } = await acceptFirst(service, fileWith([photo("media-aaaaaa", PHOTO_A)]));
    expect((await movementOf((outcome as { movementId: string }).movementId)).media[0]!.asset.view).toBeUndefined();
  });

  it("mise à jour qui ne corrige que la vue : le Mouvement reçoit la vue corrigée", async () => {
    const service = await serviceOn();
    const installed = await acceptFirst(service, fileWith([marked(VIEW)]));
    const id = (installed.outcome as { movementId: string }).movementId;
    const corrected = { x: 0, y: 50, width: 100, height: 50 };
    const { state, outcome } = await acceptFirst(service, fileWith([marked(corrected)], "2"));
    expect(state).toBe("NEW_REVISION");
    expect(outcome.status).toBe("UPDATED");
    expect((await movementOf(id)).media[0]!.asset.view).toEqual(corrected);
  });
});

describe("une seule copie de la photo sur le téléphone (registre allégé, 19/11/2026)", () => {
  const storedRows = () =>
    registryDb.getAllAsync<{ sheet_json: string; fingerprint: string }>("SELECT sheet_json, fingerprint FROM installed_sheets");

  it("après installation, le registre ne contient que l'empreinte de la photo ; le même fichier rechargé est « à jour »", async () => {
    const service = await serviceOn();
    const file = fileWith([photo("media-aaaaaa", PHOTO_A)]);
    await acceptFirst(service, file);
    const [row] = await storedRows();
    expect(row!.sheet_json).not.toContain("data:image");
    expect(row!.sheet_json).toContain("kodjo-embedded-digest:");
    expect(row!.fingerprint).toBe(sheetFingerprint(file.sheets[0]!));
    const prepared = await service.prepare(file);
    expect(prepared.ok && prepared.plan.items[0]!.state).toBe("UP_TO_DATE");
  });

  it("comparaison : même photo → aucun changement de média ; autre photo → média modifié", async () => {
    const service = await serviceOn();
    await acceptFirst(service, fileWith([photo("media-aaaaaa", PHOTO_A)]));
    const stored = JSON.parse((await storedRows())[0]!.sheet_json) as CatalogueSheet;
    const same = fileWith([photo("media-aaaaaa", PHOTO_A)], "2").sheets[0]!;
    const changed = fileWith([photo("media-aaaaaa", PHOTO_B)], "2").sheets[0]!;
    expect(compareSheet(stored, same, null).filter((entry) => entry.section === "media")).toHaveLength(0);
    expect(compareSheet(stored, changed, null).filter((entry) => entry.section === "media").length).toBeGreaterThan(0);
  });

  it("migration d'un registre en schéma 4 : photos retirées des instantanés, empreinte cohérente, fiche « à jour »", async () => {
    const file = fileWith([photo("media-aaaaaa", PHOTO_A)]);
    const sheet = file.sheets[0]!;
    const opened = await SqliteCatalogueRegistry.open(registryDb, () => NOW);
    const service = serviceWith(opened);
    const installed = await acceptFirst(service, file);
    // Ligne telle qu'un registre en schéma 4 l'avait écrite : fiche complète et ancienne empreinte.
    await registryDb.runAsync("UPDATE installed_sheets SET sheet_json = ?, fingerprint = ?",
      [JSON.stringify(sheet), "ancienne-empreinte"]);
    await registryDb.execAsync("PRAGMA user_version = 4");
    const migrated = await SqliteCatalogueRegistry.open(registryDb, () => NOW);
    const [row] = await storedRows();
    expect(row!.sheet_json).not.toContain("data:image");
    expect(row!.fingerprint).toBe(sheetFingerprint(sheet));
    expect((await registryDb.getFirstAsync<{ user_version: number }>("PRAGMA user_version"))!.user_version).toBe(5);
    const prepared = await serviceWith(migrated).prepare(file);
    expect(prepared.ok && prepared.plan.items[0]!.state).toBe("UP_TO_DATE");
    expect((await movementOf((installed.outcome as { movementId: string }).movementId)).media).toHaveLength(1);
  });
});

