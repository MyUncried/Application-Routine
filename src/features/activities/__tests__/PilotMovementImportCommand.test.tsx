import { readFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { Alert, type AlertButton } from "react-native";

import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import { PILOT_IMPORT_ENABLED, PilotMovementImportCommand } from "@/features/activities/PilotMovementImportCommand";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * Commande de recette « Importer 60 fiches » (PR #434 réintégrée sur main) : sélecteur simulé,
 * vraie base SQLite isolée (`node:sqlite` en mémoire), confirmation et compte rendu.
 */

const mockPick = jest.fn<() => Promise<unknown>>();
const mockFile = { text: jest.fn<() => Promise<string>>(), size: 0 };

jest.mock("expo-document-picker", () => ({ getDocumentAsync: () => mockPick() }));
jest.mock("expo-file-system", () => ({
  File: class {
    get size() { return mockFile.size; }
    text() { return mockFile.text(); }
  },
}));

const NOW = "2026-11-09T09:00:00.000Z";
let database: NodeSqliteDatabase;
let sequence = 0;
const service = () =>
  new ActivityDefinitionService(
    undefined,
    undefined,
    undefined,
    undefined,
    new SqliteMovementRepository(database, () => `grp-${++sequence}`, () => NOW),
  );

const draft = JSON.stringify({
  schemaVersion: "0.1.0",
  kind: "KODJO_ADMIN_DRAFTS",
  publicationAllowed: false,
  movementEdits: {},
  referenceAdditions: { specialties: [], gesturalFamilies: [], clinicalProblems: [], anatomicalTargets: [] },
  referenceLabels: { specialties: {}, gesturalFamilies: {}, clinicalProblems: {}, anatomicalTargets: {} },
  glossary: [],
});

let alerts: { title: string; message?: string }[];

beforeEach(async () => {
  database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
  alerts = [];
  mockPick.mockReset();
  mockFile.text.mockReset();
  mockFile.size = draft.length;
  jest.spyOn(Alert, "alert").mockImplementation((title, message, buttons?: AlertButton[]) => {
    alerts.push({ title, message });
    buttons?.find((button) => button.text === "Importer")?.onPress?.();
  });
});

afterEach(() => {
  jest.restoreAllMocks();
  database.close();
});

const settle = () => act(async () => { await new Promise((resolve) => setTimeout(resolve, 50)); });

async function pressImport(onImported = jest.fn()) {
  render(
    <ActivityDefinitionServiceContext.Provider value={service()}>
      <PilotMovementImportCommand onImported={onImported} />
    </ActivityDefinitionServiceContext.Provider>,
  );
  fireEvent.press(screen.getByTestId("catalogue-import-pilot"));
  await settle();
  return onImported;
}

const pilotCount = async () =>
  (await database.getFirstAsync<{ count: number }>("SELECT COUNT(*) AS count FROM movements WHERE id LIKE 'pilot:%'"))!.count;

describe("Commande de recette « Importer 60 fiches »", () => {
  it("importe les 60 Mouvements après confirmation, puis signale un réimport identique", async () => {
    mockPick.mockResolvedValue({ canceled: false, assets: [{ uri: "file:///brouillons.json", size: draft.length }] });
    mockFile.text.mockResolvedValue(draft);

    const onImported = await pressImport();

    expect(await pilotCount()).toBe(60);
    expect(onImported).toHaveBeenCalledTimes(1);
    expect(alerts.map((alert) => alert.title)).toEqual(["Importer 60 mouvements locaux ?", "Catalogue local mis à jour"]);
    expect(alerts[1]!.message).toContain("60 mouvement(s) ajouté(s), 0 déjà identique(s)");

    alerts = [];
    await pressImport();
    expect(alerts[1]!.message).toContain("0 mouvement(s) ajouté(s), 60 déjà identique(s)");
    expect(await pilotCount()).toBe(60);
  });

  it("refuse un fichier de plus de 24 Mo avant toute lecture ni écriture", async () => {
    mockPick.mockResolvedValue({ canceled: false, assets: [{ uri: "file:///gros.json", size: 25 * 1024 * 1024 }] });

    await pressImport();

    expect(mockFile.text).not.toHaveBeenCalled();
    expect(alerts).toEqual([{ title: "Fichier non importable", message: expect.stringContaining("24 Mo") }]);
    expect(await pilotCount()).toBe(0);
  });

  it("contrôle la taille réelle du fichier si le sélecteur ne la fournit pas", async () => {
    mockPick.mockResolvedValue({ canceled: false, assets: [{ uri: "file:///gros.json" }] });
    mockFile.size = 30 * 1024 * 1024;

    await pressImport();

    expect(mockFile.text).not.toHaveBeenCalled();
    expect(alerts[0]!.title).toBe("Fichier non importable");
  });

  it("annulation du sélecteur : aucune écriture, aucun message", async () => {
    mockPick.mockResolvedValue({ canceled: true, assets: null });

    await pressImport();

    expect(alerts).toEqual([]);
    expect(await pilotCount()).toBe(0);
  });

  it("JSON étranger refusé sans écriture", async () => {
    mockPick.mockResolvedValue({ canceled: false, assets: [{ uri: "file:///autre.json", size: 10 }] });
    mockFile.text.mockResolvedValue(JSON.stringify({ kind: "AUTRE" }));

    await pressImport();

    expect(alerts[0]).toEqual({ title: "Fichier non importable", message: expect.stringContaining("Import KODJO refusé") });
    expect(await pilotCount()).toBe(0);
  });
});

/**
 * Export au format de l'administration OVH (`tools/catalogue-admin/static-ovh`) avec des photos
 * embarquées à leur taille maximale (`MAX_EMBEDDED_PHOTO_CHARS = 580000`, 30 médias par fiche au
 * plus). Synthétique : aucun export réel n'était disponible.
 */
function ovhExportWithPhotos(photoCount: number): string {
  const pilot = require("../../../../catalogue/pilote/mouvements-60-candidats.json") as {
    records: { candidateId: string; name: string; description: { steps: string[] } }[];
  };
  const photo = "data:image/webp;base64," + "A".repeat(580000 - "data:image/webp;base64,".length);
  const movementEdits: Record<string, unknown> = {};
  for (let index = 0; index < photoCount; index += 30) {
    const record = pilot.records[index / 30]!;
    movementEdits[record.candidateId] = {
      name: record.name,
      steps: record.description.steps,
      aliases: [],
      categoryId: null,
      bodyZoneIds: [],
      media: Array.from({ length: Math.min(30, photoCount - index) }, (_, rank) => ({
        id: "m-" + (index + rank), kind: "PHOTO", storage: "EMBEDDED", url: photo, fileName: "photo.webp",
        caption: "", alt: "", sourceUrl: null, attribution: "", license: "", rightsStatus: "UNVERIFIED",
      })),
    };
  }
  return JSON.stringify({ ...JSON.parse(draft), movementEdits });
}

describe("Export OVH avec photos : limite de 24 Mo", () => {
  it("42 photos maximales (< 24 Mo) : 60 Mouvements importés, photos comptées et non transférées", async () => {
    const json = ovhExportWithPhotos(42);
    const bytes = Buffer.byteLength(json, "utf8");
    expect(bytes).toBeLessThan(24 * 1024 * 1024);
    mockPick.mockResolvedValue({ canceled: false, assets: [{ uri: "file:///kodjo-admin-brouillons.json", size: bytes }] });
    mockFile.text.mockResolvedValue(json);

    await pressImport();

    expect(alerts[0]!.message).toContain("42 média(s) resteront uniquement dans le fichier de brouillons original");
    expect(await pilotCount()).toBe(60);
    expect((await database.getFirstAsync<{ count: number }>("SELECT COUNT(*) AS count FROM movement_media"))!.count).toBe(0);
  });

  it("44 photos maximales (> 24 Mo) : export refusé en entier, aucune écriture", async () => {
    const json = ovhExportWithPhotos(44);
    const bytes = Buffer.byteLength(json, "utf8");
    expect(bytes).toBeGreaterThan(24 * 1024 * 1024);
    mockPick.mockResolvedValue({ canceled: false, assets: [{ uri: "file:///kodjo-admin-brouillons.json", size: bytes }] });

    await pressImport();

    expect(mockFile.text).not.toHaveBeenCalled();
    expect(alerts[0]!.title).toBe("Fichier non importable");
    expect(await pilotCount()).toBe(0);
  });
});

describe("Isolation de la commande de recette", () => {
  it("désactivée sans EXPO_PUBLIC_KODJO_CATALOGUE_IMPORT=1", () => {
    expect(PILOT_IMPORT_ENABLED).toBe(false);
  });

  it("aucun import statique du module natif expo-document-picker", () => {
    const root = join(__dirname, "..", "..", "..");
    for (const file of ["features/activities/PilotMovementImportCommand.tsx", "features/sessions/CatalogueScreen.tsx"]) {
      expect(readFileSync(join(root, file), "utf8")).not.toMatch(/from\s+["']expo-document-picker["']/);
    }
  });
});
