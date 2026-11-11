import { readFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import { encodeInstructionSteps } from "@/domain/activities/instructionSteps";
import {
  sheetFingerprint,
  type CatalogueLibrary,
  type CatalogueSheet,
  type MovementCatalogueFile,
} from "@/domain/catalogue/MovementCatalogueFile";
import { MovementCatalogueService } from "@/features/activities/MovementCatalogueService";
import { installPilotMovements, preparePilotMovementImport } from "@/features/activities/pilotMovementImport";
import { CatalogueLoadService } from "@/features/catalogue/CatalogueLoadService";
import { LibraryService } from "@/features/catalogue/LibraryService";
import { freshLocalMovementReader } from "@/features/catalogue/readLocalMovements";
import { SqliteCatalogueRegistry } from "@/infrastructure/catalogue/SqliteCatalogueRegistry";
import type { Database } from "@/infrastructure/database/Database";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteBodyZoneRepository } from "@/infrastructure/database/repositories/SqliteBodyZoneRepository";
import { SqliteCategoryRepository } from "@/infrastructure/database/repositories/SqliteCategoryRepository";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * P0/A1 — Bibliothèques sur deux bases SQLite réelles (`node:sqlite`) : registre v2, installation,
 * rattachement des 60 sans doublon, mise à jour volontaire (F4-G, fiches retirées conservées),
 * conflit historique jamais écrasé, Reporter/Refuser, reprise après interruption, garde A-2.
 */

const NOW = "2026-11-11T09:00:00.000Z";
const PILOT = "kodjo.pilote-60";
const pilot = JSON.parse(
  readFileSync(join(__dirname, "../../../../catalogue/catalogues/kodjo-pilote-60.catalogue.json"), "utf8"),
) as MovementCatalogueFile;
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
type Writable<T> = { -readonly [K in keyof T]: T[K] };

let main: NodeSqliteDatabase;
let registryDb: NodeSqliteDatabase;
let sequence = 0;

const movementsOn = (db: Database, check?: (id: string) => Promise<boolean>) =>
  new MovementCatalogueService(new SqliteMovementRepository(db, () => `gen-${++sequence}`, () => NOW), undefined, check);

async function servicesOn(accept?: CatalogueLoadService["accept"]) {
  const registry = await SqliteCatalogueRegistry.open(registryDb, () => NOW);
  const load = new CatalogueLoadService({
    registry,
    movements: movementsOn(main),
    readLocalMovements: freshLocalMovementReader(new SqliteMovementRepository(main)),
    listReferentials: async () => ({
      categoryIds: new Set((await new SqliteCategoryRepository(main).listAll()).map((category) => category.id)),
      bodyZoneIds: new Set((await new SqliteBodyZoneRepository(main).listAll()).map((zone) => zone.id)),
    }),
    newMovementId: () => `uuid-${++sequence}`,
  });
  const loadPort = accept ? { prepare: load.prepare.bind(load), accept } : load;
  return { registry, load, libraries: new LibraryService({ registry, load: loadPort }) };
}

async function dump(db: Database = main): Promise<Record<string, string[]>> {
  const tables = await db.getAllAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
  const result: Record<string, string[]> = {};
  for (const { name } of tables) {
    result[name] = (await db.getAllAsync<Record<string, unknown>>(`SELECT * FROM "${name}"`)).map((row) => JSON.stringify(row)).sort();
  }
  return result;
}

async function installPilot60() {
  const drafts = {
    schemaVersion: "0.1.0", kind: "KODJO_ADMIN_DRAFTS", publicationAllowed: false, movementEdits: {},
    referenceAdditions: { specialties: [], gesturalFamilies: [], clinicalProblems: [], anatomicalTargets: [] },
    referenceLabels: { specialties: {}, gesturalFamilies: {}, clinicalProblems: {}, anatomicalTargets: {} },
    glossary: [],
  };
  await installPilotMovements(movementsOn(main), preparePilotMovementImport(drafts));
}

const movementCount = async () => (await main.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM movements"))!.n;

/** Révision 2 de la Bibliothèque pilote : fiche 0 révisée, fiche 1 retirée, fiche créée ajoutée. */
function revisedPilot(): MovementCatalogueFile {
  const file = clone(pilot) as Writable<MovementCatalogueFile> & { sheets: Writable<CatalogueSheet>[] };
  const revised = file.sheets[0] as unknown as Record<string, any>;
  revised.content.steps = [...revised.content.steps, "Revenir lentement"];
  revised.revision = "2";
  revised.history = [...revised.history, { revision: "2", date: "2026-11-11", author: null, summary: "Étape ajoutée" }];
  const created = clone(file.sheets[1]) as unknown as Record<string, any>;
  created.sheetId = "LOCAL-001";
  created.content.name = "Squat au mur créé dans le fichier";
  created.content.aliases = [];
  created.provenance = { ...created.provenance, origin: "EXTERNAL_IMPORTED" };
  created.install = { knownLocalMovementIds: [] };
  file.sheets.push(created as unknown as CatalogueSheet);
  const library = file.libraries[0] as Writable<CatalogueLibrary>;
  const removedId = file.sheets[1]!.sheetId;
  file.libraries = [{
    ...library,
    revision: "2",
    history: [{ revision: "2", date: "2026-11-11", author: null, summary: "Composition révisée" }],
    members: [
      ...library.members.filter((member) => member.sheetId !== removedId),
      { catalogueId: PILOT, sheetId: "LOCAL-001" },
    ],
  }];
  return file as MovementCatalogueFile;
}

beforeEach(async () => {
  main = NodeSqliteDatabase.openInMemory();
  registryDb = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(main);
});

afterEach(() => {
  main.close();
  registryDb.close();
});

describe("registre v2 (base distincte, sans concurrence avec PRE-10)", () => {
  it("v1 → v2 : tables Bibliothèques ajoutées, fiches installées converties (auteur unique), empreinte recalculée", async () => {
    // Registre v1 tel qu'écrit par CA-3, avec une fiche installée au format v1 (authors[]).
    await registryDb.execAsync(`
      CREATE TABLE installed_sheets (catalogue_id TEXT NOT NULL, sheet_id TEXT NOT NULL, movement_id TEXT NOT NULL UNIQUE,
        revision TEXT NOT NULL, fingerprint TEXT NOT NULL, sheet_json TEXT NOT NULL, installed_at TEXT NOT NULL,
        updated_at TEXT NOT NULL, PRIMARY KEY (catalogue_id, sheet_id));
      CREATE TABLE pending_operations (catalogue_id TEXT NOT NULL, sheet_id TEXT NOT NULL, kind TEXT NOT NULL,
        movement_id TEXT NOT NULL, sheet_json TEXT NOT NULL, movement_json TEXT NOT NULL,
        saved_local_values_json TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY (catalogue_id, sheet_id));
      CREATE TABLE sheet_decisions (catalogue_id TEXT NOT NULL, sheet_id TEXT NOT NULL, revision TEXT NOT NULL,
        decision TEXT NOT NULL, decided_at TEXT NOT NULL, PRIMARY KEY (catalogue_id, sheet_id, revision));
      CREATE TABLE saved_local_values (catalogue_id TEXT NOT NULL, sheet_id TEXT NOT NULL, revision TEXT NOT NULL,
        field TEXT NOT NULL, value_json TEXT NOT NULL, saved_at TEXT NOT NULL, PRIMARY KEY (catalogue_id, sheet_id, revision, field));
      PRAGMA user_version = 1;`);
    const v2Sheet = pilot.sheets[0]!;
    const { author: _author, ...provenance } = v2Sheet.provenance;
    void _author;
    const v1Sheet = { ...v2Sheet, provenance: { ...provenance, authors: [] } };
    await registryDb.runAsync("INSERT INTO installed_sheets VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [PILOT, v2Sheet.sheetId, "pilot:X", "1", "ancienne-empreinte", JSON.stringify(v1Sheet), NOW, NOW]);

    const registry = await SqliteCatalogueRegistry.open(registryDb, () => NOW);
    expect((await registryDb.getFirstAsync<{ user_version: number }>("PRAGMA user_version"))!.user_version).toBe(2);
    expect(Object.keys(await dump(registryDb))).toEqual([
      "installed_libraries", "installed_sheets", "library_decisions", "library_operations", "pending_operations",
      "saved_local_values", "sheet_decisions",
    ]);
    const [record] = await registry.allInstalledSheets();
    expect(record!.sheet.provenance.author).toBeNull();
    expect("authors" in record!.sheet.provenance).toBe(false);
    expect(record!.fingerprint).toBe(sheetFingerprint(v2Sheet));
    expect(record!.movementId).toBe("pilot:X");
    // Réouverture idempotente.
    await SqliteCatalogueRegistry.open(registryDb, () => NOW);
    expect(await registry.allInstalledSheets()).toEqual([record]);
  });
});

describe("Bibliothèques — installation et mise à jour volontaires", () => {
  it("base contenant les 60 : 60 rattachées sans doublon, aucune écriture du Catalogue, puis « à jour »", async () => {
    await installPilot60();
    const { libraries } = await servicesOn();
    const before = await dump();
    const available = await libraries.available(pilot);
    if (!available.ok) throw new Error("refusé");
    const [preview] = available.previews;
    expect(preview).toMatchObject({ status: "NOT_INSTALLED", memberCount: 60, unknownOwner: true });
    expect(preview!.attached).toHaveLength(60);
    expect(preview!.added).toHaveLength(0);
    expect(await dump()).toEqual(before);

    const report = await libraries.apply(available.file, PILOT);
    expect(report).toMatchObject({ kind: "INSTALL", added: 0, attached: 60, updated: 0, toReview: 0, failed: [] });
    expect(await dump()).toEqual(before);
    expect(await libraries.installed()).toEqual([expect.objectContaining({ catalogueId: PILOT, libraryId: PILOT, revision: "1" })]);
    expect((await libraries.preview(available.file, PILOT))!.status).toBe("UP_TO_DATE");
    // Import répété : aucun doublon, aucune écriture.
    await libraries.apply(available.file, PILOT);
    expect(await dump()).toEqual(before);
  });

  it("base vide : 60 nouvelles fiches ajoutées au Catalogue", async () => {
    const { libraries } = await servicesOn();
    const report = await libraries.apply(pilot, PILOT);
    expect(report).toMatchObject({ added: 60, attached: 0, failed: [] });
    expect(await movementCount()).toBe(60);
  });

  it("mise à jour : fiche révisée, fiche ajoutée, fiche retirée conservée au Catalogue ; F4-G annoncé", async () => {
    await installPilot60();
    const { libraries, registry } = await servicesOn();
    await libraries.apply(pilot, PILOT);
    // Une seconde Bibliothèque référence la fiche 0, sans copie (A-1).
    const second = clone(pilot) as Writable<MovementCatalogueFile>;
    second.libraries = [{ ...pilot.libraries[0]!, libraryId: "force", title: "Force", members: [pilot.libraries[0]!.members[0]!] }];
    expect(await libraries.apply(second, "force")).toMatchObject({ added: 0, attached: 0, updated: 0 });
    expect(await movementCount()).toBe(60);

    const file = revisedPilot();
    const preview = await libraries.preview(file, PILOT);
    expect(preview).toMatchObject({ status: "UPDATE_AVAILABLE", installedRevision: "1", targetRevision: "2" });
    expect(preview!.modified.map((item) => item.sheetId)).toEqual([pilot.sheets[0]!.sheetId]);
    expect(preview!.added.map((item) => item.sheetId)).toEqual(["LOCAL-001"]);
    expect(preview!.removed).toEqual([{ catalogueId: PILOT, sheetId: pilot.sheets[1]!.sheetId }]);
    expect(preview!.alsoIn).toEqual({ [PILOT + "/" + pilot.sheets[0]!.sheetId]: ["Force"] });

    const report = await libraries.apply(file, PILOT);
    expect(report).toMatchObject({ kind: "UPDATE", added: 1, updated: 1, removed: 1, failed: [] });
    expect(await movementCount()).toBe(61);
    const removed = await main.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM movements WHERE id = ?",
      [pilot.sheets[1]!.install.knownLocalMovementIds[0]!]);
    expect(removed!.n).toBe(1);
    // Une seule révision active par fiche (F4-G) : la fiche 0 est à jour pour les deux Bibliothèques.
    const record = (await registry.allInstalledSheets()).find((entry) => entry.sheetId === pilot.sheets[0]!.sheetId);
    expect(record!.revision).toBe("2");
    expect((await libraries.preview(file, PILOT))!.status).toBe("UP_TO_DATE");
  });

  it("adaptation historique d'un des 60 : jamais écrasée, laissée à l'examen fiche par fiche", async () => {
    await installPilot60();
    const { libraries } = await servicesOn();
    await libraries.apply(pilot, PILOT);
    const mine = (await movementsOn(main).findMovement(pilot.sheets[0]!.install.knownLocalMovementIds[0]!))!;
    await movementsOn(main).updateFromSource({ ...mine, description: encodeInstructionSteps(["Ma propre consigne"]) });
    const before = await dump();
    const file = revisedPilot();
    const preview = await libraries.preview(file, PILOT);
    expect(preview!.toReview).toEqual([expect.objectContaining({ reason: "TO_RECONCILE" })]);
    expect(preview!.modified).toHaveLength(0);
    const report = await libraries.apply(file, PILOT);
    expect(report).toMatchObject({ updated: 0, toReview: 1 });
    const after = (await movementsOn(main).findMovement(mine.id))!;
    expect(after.description).toBe(encodeInstructionSteps(["Ma propre consigne"]));
    expect((await dump()).movements!.length).toBe(before.movements!.length + 1);
  });

  it("Reporter puis Refuser : rien n'est écrit ; une révision ultérieure est de nouveau proposée", async () => {
    await installPilot60();
    const { libraries } = await servicesOn();
    await libraries.apply(pilot, PILOT);
    const file = revisedPilot();
    const before = await dump();
    await libraries.defer(file, PILOT);
    expect((await libraries.preview(file, PILOT))!.status).toBe("UPDATE_AVAILABLE");
    await libraries.refuse(file, PILOT);
    expect((await libraries.preview(file, PILOT))!.status).toBe("REFUSED");
    expect(await dump()).toEqual(before);
    const later = clone(file) as Writable<MovementCatalogueFile>;
    later.libraries = [{ ...file.libraries[0]!, revision: "3",
      history: [...file.libraries[0]!.history, { revision: "3", date: "2026-11-12", author: null, summary: "Suite" }] }];
    expect((await libraries.preview(later, PILOT))!.status).toBe("UPDATE_AVAILABLE");
  });

  it("interruption au milieu de l'installation : progression affichée, reprise sans doublon", async () => {
    const { libraries: healthy, load } = await servicesOn();
    let calls = 0;
    // Arrêt de l'application simulé : la 4e fiche ne revient jamais (aucune exception, aucune confirmation).
    const { libraries: killed } = await servicesOn(async (file, sheetId, resolutions) => {
      calls += 1;
      if (calls === 4) return new Promise<never>(() => {});
      return load.accept(file, sheetId, resolutions);
    });
    void killed.apply(pilot, PILOT);
    for (let i = 0; i < 200 && calls < 4; i++) await new Promise((resolve) => setImmediate(resolve));
    const [progress] = await healthy.interrupted();
    expect(progress).toMatchObject({ libraryId: PILOT, kind: "INSTALL", applied: 3, total: 60 });
    expect((await healthy.preview(pilot, PILOT))!.status).toBe("INTERRUPTED");
    const report = await healthy.resume({ catalogueId: PILOT, libraryId: PILOT });
    expect(report).toMatchObject({ added: 57, failed: [] });
    expect(await movementCount()).toBe(60);
    expect(await healthy.interrupted()).toEqual([]);
    expect((await healthy.preview(pilot, PILOT))!.status).toBe("UP_TO_DATE");
  });

  it("Mouvement personnel envoyé puis catalogué (A2) : non rattaché tant que la règle n'est pas arbitrée", async () => {
    const personal = movementsOn(main);
    const created = await personal.createIndependent({
      id: "perso-1", name: "Fente personnelle", aliases: [], description: encodeInstructionSteps(["Avancez."]),
      categoryId: pilot.sheets[0]!.classification.categoryId!, bodyZoneIds: [...pilot.sheets[0]!.classification.bodyZoneIds],
      media: [], phases: [], nextPhaseId: 1, levelGroup: null,
    });
    expect(created.status).toBe("SAVED");
    const file = clone(pilot) as Writable<MovementCatalogueFile> & { sheets: Record<string, any>[] };
    const sheet = clone(file.sheets[0]!) as Record<string, any>;  
    sheet.sheetId = "PERSO-1";
    sheet.content = { ...sheet.content, name: "Fente personnelle", aliases: [], steps: ["Avancez."] };
    sheet.provenance = { ...sheet.provenance, origin: "LOCAL_CREATED", upstream: null };
    sheet.install = { knownLocalMovementIds: ["perso-1"] };
    file.sheets = [sheet as CatalogueSheet & Record<string, any>];
    file.libraries = [{ ...pilot.libraries[0]!, members: [{ catalogueId: PILOT, sheetId: "PERSO-1" }] }];
    const { libraries } = await servicesOn();
    const before = await dump();
    const preview = await libraries.preview(file as MovementCatalogueFile, PILOT);
    expect(preview!.toReview).toEqual([expect.objectContaining({ reason: "PERSONAL_ORIGIN" })]);
    expect(preview!.attached).toHaveLength(0);
    await libraries.apply(file as MovementCatalogueFile, PILOT);
    expect(await dump()).toEqual(before);
  });
});

describe("robustesse (revue du 11/11)", () => {
  it("une erreur sur une fiche n'immobilise pas la Bibliothèque : fiche signalée, les autres installées", async () => {
    const { load } = await servicesOn();
    const { libraries } = await servicesOn(async (file, sheetId, resolutions) => {
      if (sheetId === pilot.sheets[1]!.sheetId) throw new Error("contrainte SQLite");
      return load.accept(file, sheetId, resolutions);
    });
    const report = await libraries.apply(pilot, PILOT);
    expect(report!.added).toBe(59);
    expect(report!.failed).toEqual([{ sheetId: pilot.sheets[1]!.sheetId, outcome: { status: "MOVEMENT_REFUSED", reason: "contrainte SQLite" } }]);
    expect(await libraries.interrupted()).toEqual([]);
  });
});

describe("A-2 — garde métier des Mouvements importés (service, pas seulement l'écran)", () => {
  it("modification et duplication refusées ; mise à jour par la source admise ; Mouvement personnel libre", async () => {
    await installPilot60();
    const { libraries, registry } = await servicesOn();
    await libraries.apply(pilot, PILOT);
    const guarded = movementsOn(main, (id) => registry.isInstalledMovement(id));
    const imported = (await guarded.findMovement(pilot.sheets[0]!.install.knownLocalMovementIds[0]!))!;
    const before = await dump();
    expect(await guarded.isImported(imported.id)).toBe(true);
    expect(await guarded.update({ ...imported, name: "Renommé" })).toEqual({ status: "PROTECTED" });
    expect(await guarded.createAsNew(imported, "copie-1")).toEqual({ status: "PROTECTED" });
    expect(await dump()).toEqual(before);
    expect((await guarded.updateFromSource({ ...imported, aliases: ["Alias source"] })).status).toBe("SAVED");

    const own = await guarded.createIndependent({ ...imported, id: "perso-2", name: "Mon mouvement", aliases: [], levelGroup: null });
    expect(own.status).toBe("SAVED");
    expect(await guarded.isImported("perso-2")).toBe(false);
    expect((await guarded.update({ ...imported, id: "perso-2", name: "Mon mouvement modifié", aliases: [] })).status).toBe("SAVED");
  });
});

describe("A2 — aller-retour : envoi d'un Mouvement personnel, ajout au catalogue, rechargement", () => {
  it("le Mouvement personnel est reconnu par son identifiant : ni doublon, ni écrasement, ni verrouillage implicite", async () => {
    const { buildMovementInbox } = jest.requireActual("@/features/catalogue/movementInboxBuilder") as typeof import("@/features/catalogue/movementInboxBuilder");
    const { createSheet, addLibraryMember, replaceLibrary } = jest.requireActual("@/domain/catalogue/catalogueEditing") as typeof import("@/domain/catalogue/catalogueEditing");
    const { parseMovementCatalogueFile } = jest.requireActual("@/domain/catalogue/MovementCatalogueFile") as typeof import("@/domain/catalogue/MovementCatalogueFile");
    await installPilot60();
    const { libraries, registry } = await servicesOn();
    await libraries.apply(pilot, PILOT);
    const own = movementsOn(main);
    const base = pilot.sheets[0]!.classification;
    expect((await own.createIndependent({
      id: "perso-9", name: "Fente bulgare maison", aliases: [], description: encodeInstructionSteps(["Pied arrière sur le banc.", "Descendez."]),
      categoryId: base.categoryId!, bodyZoneIds: [...base.bodyZoneIds], media: [], phases: [], nextPhaseId: 1, levelGroup: null,
    })).status).toBe("SAVED");

    // Téléphone : envoi validé par le contrat partagé.
    const personal = (await own.findMovement("perso-9"))!;
    const sent = buildMovementInbox({ movements: [personal], categoryLabels: new Map(), bodyZoneLabels: new Map(), deviceName: "iPhone", sentAt: NOW });
    if (!sent.ok) throw new Error(JSON.stringify(sent.issues));
    const received = sent.envelope.movements[0]!;
    expect(received).toMatchObject({ movementId: "perso-9", steps: ["Pied arrière sur le banc.", "Descendez."], mediaCount: 0 });

    // Administration : « Ajouter au catalogue » (fiche LOCAL_CREATED, rapprochée du Mouvement d'origine).
    const meta = { date: NOW, author: null, summary: "Ajout depuis la boîte d'arrivée" };
    const created = createSheet(pilot, {
      name: received.name, aliases: received.aliases, steps: received.steps,
      categoryId: received.categoryId, bodyZoneIds: received.bodyZoneIds, knownLocalMovementIds: [received.movementId],
    } as Parameters<typeof createSheet>[1], meta);
    const withMember = replaceLibrary(created.file, addLibraryMember(created.file.libraries[0]!, { catalogueId: PILOT, sheetId: created.sheet.sheetId }));
    const parsed = parseMovementCatalogueFile(withMember);
    if (!parsed.ok) throw new Error(JSON.stringify(parsed.issues));
    expect(created.sheet.install.knownLocalMovementIds).toEqual(["perso-9"]);

    // Téléphone : rechargement — reconnu, aucun doublon ; transition de statut non arbitrée → non rattaché.
    const before = await dump();
    const preview = await libraries.preview(parsed.file, PILOT);
    expect(preview!.added).toHaveLength(0);
    expect(preview!.toReview).toEqual([expect.objectContaining({ reason: "PERSONAL_ORIGIN" })]);
    await libraries.apply(parsed.file, PILOT);
    expect(await dump()).toEqual(before);
    expect(await registry.isInstalledMovement("perso-9")).toBe(false);
    expect((await own.update({ ...personal, name: "Fente bulgare modifiée" })).status).toBe("SAVED");
  });
});
