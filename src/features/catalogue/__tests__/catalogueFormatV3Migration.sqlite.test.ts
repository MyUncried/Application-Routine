import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { decodeInstructionSteps } from "@/domain/activities/instructionSteps";
import { libraryCompositionKey } from "@/domain/catalogue/libraryPlan";
import {
  parseMovementCatalogueFile,
  sheetFingerprint,
  type CatalogueLibrary,
  type CatalogueSheet,
  type MovementCatalogueFile,
} from "@/domain/catalogue/MovementCatalogueFile";
import { pilotCatalogueV2Raw, pilotCatalogueV3 } from "@/domain/catalogue/testing/pilotCatalogueV3";
import type { Movement } from "@/domain/activities/Movement";
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
 * Mission MOUV-CONFORMITE-FICHE-20261118 — format catalogue 3.0.0 sur deux bases SQLite réelles (`node:sqlite`) :
 * migration du registre installé (schéma 3 → 4, sauvegarde récupérable), réimport du fichier 2.0.0 converti
 * (position de départ reprise dans les étapes sans doublon ni réinitialisation), réimport répété sans écriture,
 * phases transmises à l'installation et aux mises à jour acceptées, fiche commune à deux Bibliothèques = un seul
 * Mouvement, aucune note interne chez le destinataire.
 */

const NOW = "2026-11-18T09:00:00.000Z";
const PILOT = "kodjo.pilote-60";

let main: NodeSqliteDatabase;
let registryDb: NodeSqliteDatabase;
let sequence = 0;

const movementsOn = (db: Database) =>
  new MovementCatalogueService(new SqliteMovementRepository(db, () => `gen-${++sequence}`, () => NOW));

async function servicesOn() {
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
  return { registry, load, libraries: new LibraryService({ registry, load }) };
}

async function dump(db: Database): Promise<Record<string, string[]>> {
  const tables = await db.getAllAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
  const result: Record<string, string[]> = {};
  for (const { name } of tables) {
    result[name] = (await db.getAllAsync<Record<string, unknown>>(`SELECT * FROM "${name}"`)).map((row) => JSON.stringify(row)).sort();
  }
  return result;
}

/** Forme modifiable d'un fichier, pour fabriquer les jeux d'essai. */
type EditableSheet = { sheetId: string; revision: string; history: unknown[]; phases: unknown; content: { notes: string } };
type EditableFile = { sheets: EditableSheet[]; libraries: CatalogueLibrary[] };
const editable = (file: MovementCatalogueFile): EditableFile => JSON.parse(JSON.stringify(file)) as EditableFile;

/** Phases lues, durée explicite (`null` = aucune), comme dans la fiche. */
const phasesOf = (movement: Movement) => movement.phases.map((phase) => ({ id: phase.id, label: phase.label, durationSeconds: phase.durationSeconds ?? null }));

const movementRows = async () =>
  main.getAllAsync<{ id: string; name: string; description: string }>("SELECT id, name, description FROM movements ORDER BY id");

/** Installation d'un fichier de Bibliothèques sur le téléphone (aperçu puis « Installer » / « Mettre à jour »). */
async function install(libraries: LibraryService, file: unknown, libraryId = PILOT) {
  const available = await libraries.available(file);
  if (!available.ok) throw new Error(JSON.stringify(available.issues));
  const report = await libraries.apply(available.file, libraryId);
  return { available, report };
}

/**
 * Téléphone installé avant le 18/11/2026 : registre au schéma 3 avec les instantanés 2.0.0 du pilote. Reproduit en
 * installant le pilote sans reprise (mêmes révisions et étapes que le fichier 2.0.0), puis en réécrivant les
 * instantanés et la Bibliothèque sous leur forme 2.0.0 (champs abandonnés, notes internes, clé cible calculée sur la
 * composition 2.0.0) et en ramenant le registre au schéma 3.
 */
async function legacyPhone() {
  const { libraries } = await servicesOn();
  await install(libraries, pilotCatalogueV3());
  const raw = pilotCatalogueV2Raw();
  const rawSheets = raw.sheets as CatalogueSheet[];
  const rawLibrary = (raw.libraries as CatalogueLibrary[])[0]!;
  for (const sheet of rawSheets) {
    await registryDb.runAsync("UPDATE installed_sheets SET sheet_json = ?, fingerprint = ? WHERE catalogue_id = ? AND sheet_id = ?",
      [JSON.stringify(sheet), "empreinte-2.0.0", PILOT, sheet.sheetId]);
  }
  const revisions = new Map(rawSheets.map((sheet) => [sheet.sheetId, sheet.revision]));
  const legacyKey = libraryCompositionKey(rawLibrary, PILOT, (sheetId) => revisions.get(sheetId));
  await registryDb.runAsync("UPDATE installed_libraries SET library_json = ?, target_key = ? WHERE catalogue_id = ? AND library_id = ?",
    [JSON.stringify(rawLibrary), legacyKey, PILOT, PILOT]);
  await registryDb.execAsync("DROP TABLE installed_references; PRAGMA user_version = 3;");
  return { rawSheets, legacyKey };
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

describe("format 3.0.0 — migration des installations existantes", () => {
  it("registre 3 → 4 : sauvegarde intégrale, instantanés convertis sans révision, identités et clé de Bibliothèque conservées", async () => {
    const { rawSheets } = await legacyPhone();
    const before = await dump(registryDb);
    const movementsBefore = await movementRows();

    const { registry, libraries } = await servicesOn();
    expect((await registryDb.getFirstAsync<{ user_version: number }>("PRAGMA user_version"))!.user_version).toBe(5);
    // Sauvegarde récupérable : copies exactes des tables avant conversion.
    const after = await dump(registryDb);
    for (const table of ["installed_sheets", "pending_operations", "installed_libraries", "library_operations"]) {
      expect(after[table + "_backup_v3"]).toEqual(before[table]);
    }
    // Instantanés : mêmes identités, Mouvements et révisions ; format 3.0.0 ; notes internes retirées ; empreinte recalculée.
    const installed = await registry.allInstalledSheets();
    expect(installed).toHaveLength(60);
    for (const record of installed) {
      const raw = rawSheets.find((sheet) => sheet.sheetId === record.sheetId)!;
      expect(record.revision).toBe(raw.revision);
      expect(record.movementId).toBe(movementsBefore.find((row) => row.id === record.movementId)!.id);
      expect(record.sheet.content.steps).toEqual(raw.content.steps);
      expect(record.sheet.content.notes).toBe("");
      expect(record.sheet).not.toHaveProperty("sources");
      expect(record.sheet.content).not.toHaveProperty("startingPosition");
      expect(record.sheet.phases).toEqual([]);
      expect(record.fingerprint).toBe(sheetFingerprint(record.sheet));
    }
    // Bibliothèque : composition 3.0.0 ; clé recalculée (l'ancienne était reproduite) → aucune fausse mise à jour.
    const [library] = await libraries.installed();
    expect(library!.library).not.toHaveProperty("editor");
    expect(library!.library).not.toHaveProperty("publicationAllowed");
    expect((await libraries.preview(pilotCatalogueV3(), PILOT))!.status).toBe("UP_TO_DATE");
    // Rien d'autre n'a changé dans la base principale.
    expect(await movementRows()).toEqual(movementsBefore);
    // Réouverture idempotente : aucune nouvelle conversion.
    const reopened = await dump(registryDb);
    await SqliteCatalogueRegistry.open(registryDb, () => NOW);
    expect(await dump(registryDb)).toEqual(reopened);
  });

  it("réimport du fichier 2.0.0 converti : position de départ en tête des étapes, sans doublon ni réinitialisation ; réimport répété sans écriture", async () => {
    const { rawSheets } = await legacyPhone();
    const movementsBefore = await movementRows();
    const { libraries, registry } = await servicesOn();

    const { available, report } = await install(libraries, pilotCatalogueV2Raw());
    expect(available.previews[0]).toMatchObject({ status: "UPDATE_AVAILABLE" });
    expect(report).toMatchObject({ kind: "UPDATE", added: 0, attached: 0, updated: 60, failed: [] });
    // Mêmes Mouvements (identifiants : références de séances et historiques préservés), aucun doublon.
    const movementsAfter = await movementRows();
    expect(movementsAfter.map((row) => row.id)).toEqual(movementsBefore.map((row) => row.id));
    for (const record of await registry.allInstalledSheets()) {
      const raw = rawSheets.find((sheet) => sheet.sheetId === record.sheetId)! as unknown as { content: { startingPosition: string; steps: string[] } };
      const steps = decodeInstructionSteps(movementsAfter.find((row) => row.id === record.movementId)!.description);
      expect(steps).toEqual([raw.content.startingPosition.trim(), ...raw.content.steps]);
      expect(steps.filter((step) => step === raw.content.startingPosition.trim())).toHaveLength(1);
      expect(record.revision).toBe("2");
    }
    // Réimport répété : à jour, aucune écriture nulle part.
    const settled = [await dump(main), await dump(registryDb)];
    const again = await libraries.available(pilotCatalogueV2Raw());
    if (!again.ok) throw new Error("refus");
    expect(again.previews[0]!.status).toBe("UP_TO_DATE");
    await libraries.apply(again.file, PILOT);
    expect([await dump(main), await dump(registryDb)]).toEqual(settled);
  });

  it("téléphone sans registre (ancien importeur) : la version d'avant la reprise est reconnue, mise à jour sans doublon", async () => {
    // Mouvements pilotes installés par l'ancien importeur (identifiants pilot:*, étapes sans position de départ), aucun registre.
    await installPilotMovements(movementsOn(main), preparePilotMovementImport({
      schemaVersion: "0.1.0", kind: "KODJO_ADMIN_DRAFTS", publicationAllowed: false, movementEdits: {},
      referenceAdditions: { specialties: [], gesturalFamilies: [], clinicalProblems: [], anatomicalTargets: [] },
      referenceLabels: { specialties: {}, gesturalFamilies: {}, clinicalProblems: {}, anatomicalTargets: {} },
      glossary: [],
    }));
    const before = await movementRows();
    expect(before.every((row) => row.id.startsWith("pilot:"))).toBe(true);
    const { libraries } = await servicesOn();
    const { report } = await install(libraries, pilotCatalogueV2Raw());
    expect(report).toMatchObject({ added: 0, updated: 60, toReview: 0, failed: [] });
    expect((await movementRows()).map((row) => row.id)).toEqual(before.map((row) => row.id));
  });
});

describe("format 3.0.0 — phases, Bibliothèques multiples, notes internes", () => {
  /** Pilote 3.0.0 : fiche 0 avec deux phases ; seconde Bibliothèque qui référence aussi la fiche 0. */
  function withPhasesAndTwoLibraries(): MovementCatalogueFile {
    const file = editable(pilotCatalogueV3());
    file.sheets[0]!.phases = [{ id: 1, label: "Montée", durationSeconds: 2 }, { id: 2, label: "Descente", durationSeconds: null }];
    file.sheets[0]!.content.notes = "Note interne de l'administration";
    file.libraries.push({
      ...file.libraries[0]!, libraryId: "genou", title: "Genou", revision: "1", history: [],
      members: [{ catalogueId: PILOT, sheetId: file.sheets[0]!.sheetId }],
    });
    return file as unknown as MovementCatalogueFile;
  }

  it("phases transmises à l'installation puis à une révision acceptée ; fiche dans deux Bibliothèques = un seul Mouvement ; aucune note interne", async () => {
    const { libraries, registry } = await servicesOn();
    const file = withPhasesAndTwoLibraries();
    await install(libraries, file, PILOT);
    const count = (await movementRows()).length;
    const { report } = await install(libraries, file, "genou");
    expect(report).toMatchObject({ added: 0, failed: [] });
    expect(await movementRows()).toHaveLength(count);

    const sheetId = file.sheets[0]!.sheetId;
    const record = (await registry.allInstalledSheets()).find((entry) => entry.sheetId === sheetId)!;
    const movement = (await movementsOn(main).findMovement(record.movementId))!;
    expect(phasesOf(movement)).toEqual([{ id: 1, label: "Montée", durationSeconds: 2 }, { id: 2, label: "Descente", durationSeconds: null }]);
    expect(record.sheet.content.notes).toBe("");
    expect((await libraries.installed()).filter((entry) => entry.library.members.some((member) => member.sheetId === sheetId))).toHaveLength(2);

    // Révision acceptée : phases réordonnées, durée retirée, phase ajoutée ; identités conservées.
    const revised = editable(file);
    const sheet = revised.sheets[0]!;
    sheet.phases = [{ id: 2, label: "Descente", durationSeconds: 3 }, { id: 1, label: "Montée", durationSeconds: null }, { id: 3, label: "Pause", durationSeconds: 1 }];
    sheet.revision = String(Number(sheet.revision) + 1);
    sheet.history = [...sheet.history, { revision: sheet.revision, date: "2026-11-18", author: null, summary: "Phases" }];
    const parsed = parseMovementCatalogueFile(revised);
    if (!parsed.ok) throw new Error(JSON.stringify(parsed.issues));
    const { report: update } = await install(libraries, revised, PILOT);
    expect(update).toMatchObject({ updated: 1, failed: [] });
    const updated = (await movementsOn(main).findMovement(record.movementId))!;
    expect(phasesOf(updated)).toEqual([{ id: 2, label: "Descente", durationSeconds: 3 }, { id: 1, label: "Montée", durationSeconds: null }, { id: 3, label: "Pause", durationSeconds: 1 }]);
    expect(updated.nextPhaseId).toBe(4);
    expect(await movementRows()).toHaveLength(count);
  });

  it("référentiels de classification conservés pour les filtres validés", async () => {
    const { libraries, registry } = await servicesOn();
    await install(libraries, pilotCatalogueV3());
    const references = (await registry.installedReferences()).get(PILOT);
    expect(references?.specialties.length).toBeGreaterThan(0);
    expect(references?.gesturalFamilies).toEqual(pilotCatalogueV3().references.gesturalFamilies);
  });
});
