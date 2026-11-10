import { readFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import {
  projectSheetToMovement,
  type CatalogueSheet,
  type MovementCatalogueFile,
} from "@/domain/catalogue/MovementCatalogueFile";
import { decodeInstructionSteps, encodeInstructionSteps } from "@/domain/activities/instructionSteps";
import { MovementCatalogueService } from "@/features/activities/MovementCatalogueService";
import { installPilotMovements, preparePilotMovementImport } from "@/features/activities/pilotMovementImport";
import { CatalogueLoadService } from "@/features/catalogue/CatalogueLoadService";
import { freshLocalMovementReader } from "@/features/catalogue/readLocalMovements";
import {
  CATALOGUE_REGISTRY_SCHEMA_VERSION,
  SqliteCatalogueRegistry,
} from "@/infrastructure/catalogue/SqliteCatalogueRegistry";
import type { Database } from "@/infrastructure/database/Database";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteBodyZoneRepository } from "@/infrastructure/database/repositories/SqliteBodyZoneRepository";
import { SqliteCategoryRepository } from "@/infrastructure/database/repositories/SqliteCategoryRepository";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * CA-3 — chargement réel sur deux bases SQLite (`node:sqlite`) : base principale migrée et
 * registre distinct. Scénarios de la recette CA-6 rejoués en test, reprise après interruption,
 * perte du registre, connexion principale en retard (incident du 9/11).
 */

const NOW = "2026-11-10T09:00:00.000Z";
const pilot = JSON.parse(
  readFileSync(join(__dirname, "../../../../catalogue/catalogues/kodjo-pilote-60.catalogue.json"), "utf8"),
) as MovementCatalogueFile;
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

let main: NodeSqliteDatabase;
let registryDb: NodeSqliteDatabase;
let sequence = 0;

const movementsOn = (db: Database) =>
  new MovementCatalogueService(new SqliteMovementRepository(db, () => `gen-${++sequence}`, () => NOW));

async function serviceOn(options: { mainDb?: Database; registry?: SqliteCatalogueRegistry } = {}) {
  const db = options.mainDb ?? main;
  const registry = options.registry ?? await SqliteCatalogueRegistry.open(registryDb, () => NOW);
  const service = new CatalogueLoadService({
    registry,
    movements: movementsOn(db),
    readLocalMovements: freshLocalMovementReader(db),
    listReferentials: async () => ({
      categoryIds: new Set((await new SqliteCategoryRepository(db).listAll()).map((category) => category.id)),
      bodyZoneIds: new Set((await new SqliteBodyZoneRepository(db).listAll()).map((zone) => zone.id)),
    }),
    newMovementId: () => `uuid-${++sequence}`,
  });
  return { service, registry };
}

/** Contenu complet de la base principale (preuve d'absence d'écriture). */
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

async function acceptAll(service: CatalogueLoadService, file: MovementCatalogueFile, state: string) {
  const prepared = await service.prepare(file);
  if (!prepared.ok) throw new Error("fichier refusé");
  const outcomes = [];
  for (const item of prepared.plan.items.filter((candidate) => candidate.state === state)) {
    outcomes.push(await service.accept(prepared.file, item.sheetId));
  }
  return outcomes;
}

/** Fichier édité de la recette CA-6 : fiche 1 révisée, fiche créée directement dans le fichier. */
function editedFile(change: (sheet: CatalogueSheet & Record<string, never>) => void = () => {}) {
  const file = clone(pilot) as MovementCatalogueFile & { sheets: CatalogueSheet[] };
  const revised = file.sheets[0] as unknown as Record<string, any>;  
  revised.content.steps = [...revised.content.steps, "Revenir lentement"];
  revised.sources.documentary.section = "Section révisée";
  change(revised as never);
  revised.revision = "2";
  revised.history = [...revised.history, { revision: "2", date: "2026-11-11", author: null, summary: "Étape ajoutée" }];
  const created = clone(file.sheets[1]) as unknown as Record<string, any>;  
  created.sheetId = "LOCAL-001";
  created.content.name = "Squat au mur créé dans le fichier";
  created.content.aliases = [];
  created.provenance = { ...created.provenance, origin: "LOCAL_CREATED", upstream: null };
  created.history = [{ revision: "1", date: "2026-11-11", author: null, summary: "Création dans le fichier" }];
  created.install = { knownLocalMovementIds: [] };
  file.sheets.push(created as unknown as CatalogueSheet);
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

describe("CA-3 — chargement d'un catalogue sur SQLite réelle (base principale + registre distinct)", () => {
  it("registre : base distincte, schéma versionné, réouverture idempotente, version future refusée", async () => {
    const before = await dump();
    await SqliteCatalogueRegistry.open(registryDb);
    await SqliteCatalogueRegistry.open(registryDb);
    expect((await registryDb.getFirstAsync<{ user_version: number }>("PRAGMA user_version"))!.user_version)
      .toBe(CATALOGUE_REGISTRY_SCHEMA_VERSION);
    expect(Object.keys(await dump(registryDb))).toEqual(["installed_sheets", "pending_operations", "saved_local_values", "sheet_decisions"]);
    expect(await dump()).toEqual(before);
    await registryDb.execAsync("PRAGMA user_version = 99");
    await expect(SqliteCatalogueRegistry.open(registryDb)).rejects.toThrow("version plus récente");
  });

  it("CA-6 (1) : pilote sur la base contenant les 60 → 60 adoptés, aucune écriture dans la base principale", async () => {
    await installPilot60();
    const { service } = await serviceOn();
    const before = await dump();
    const prepared = await service.prepare(pilot);
    expect(prepared.ok && prepared.plan.items.every((item) => item.state === "ADOPTABLE")).toBe(true);
    expect(await dump()).toEqual(before);
    const outcomes = await acceptAll(service, pilot, "ADOPTABLE");
    expect(outcomes).toHaveLength(60);
    expect(outcomes.every((outcome) => outcome.status === "ADOPTED")).toBe(true);
    expect(await dump()).toEqual(before);
  });

  it("CA-6 (2) : rechargement → tout à jour, aucune écriture nulle part", async () => {
    await installPilot60();
    const { service } = await serviceOn();
    await acceptAll(service, pilot, "ADOPTABLE");
    const [mainBefore, registryBefore] = [await dump(), await dump(registryDb)];
    const prepared = await service.prepare(pilot);
    expect(prepared.ok && prepared.plan.items.map((item) => item.state)).toEqual(Array(60).fill("UP_TO_DATE"));
    expect(await dump()).toEqual(mainBefore);
    expect(await dump(registryDb)).toEqual(registryBefore);
  });

  it("CA-6 (3) : fichier édité → 1 fiche nouvelle installée, 1 révision avec résumé, reporter / refuser / accepter", async () => {
    await installPilot60();
    const { service, registry } = await serviceOn();
    await acceptAll(service, pilot, "ADOPTABLE");
    const file = editedFile();
    const prepared = await service.prepare(file);
    if (!prepared.ok) throw new Error("refusé");
    const states = prepared.plan.items.map((item) => item.state);
    expect(states.filter((state) => state === "UP_TO_DATE")).toHaveLength(59);
    const revision = prepared.plan.items[0]!;
    const created = prepared.plan.items[60]!;
    expect(revision).toMatchObject({ state: "NEW_REVISION", installedRevision: "1", revision: "2" });
    expect(revision.summary).toMatchObject({ movementFields: ["content.steps"], conflicts: [], editorialOnly: false });
    expect(revision.summary.bySection.sources).toBe(1);
    expect(created).toMatchObject({ state: "NEW", blockers: [] });

    // Fiche créée dans le fichier : installée sous un nouvel identifiant local.
    const installed = await service.accept(file, "LOCAL-001");
    expect(installed).toEqual({ status: "INSTALLED", movementId: expect.stringMatching(/^uuid-/) });

    // Révision : reporter (reproposée), refuser (écartée), puis — révision suivante — accepter.
    const pilotId = "pilot:" + revision.sheetId;
    const untouched = await movementsOn(main).findMovement(pilotId);
    expect(await service.defer(file, revision.sheetId)).toEqual({ status: "RECORDED" });
    let again = await service.prepare(file);
    expect(again.ok && again.plan.items[0]).toMatchObject({ state: "NEW_REVISION", deferred: true });
    expect(await service.refuse(file, revision.sheetId)).toEqual({ status: "RECORDED" });
    again = await service.prepare(file);
    expect(again.ok && again.plan.items[0]!.state).toBe("REFUSED_REVISION");
    expect(await service.accept(file, revision.sheetId)).toEqual({ status: "NOT_APPLICABLE", state: "REFUSED_REVISION" });
    expect(await movementsOn(main).findMovement(pilotId)).toEqual(untouched);

    const third = clone(file) as MovementCatalogueFile & { sheets: CatalogueSheet[] };
    (third.sheets[0] as { revision: string }).revision = "3";
    (third.sheets[0] as unknown as { history: unknown[] }).history.push({ revision: "3", date: "2026-11-12", author: null, summary: "v3" });
    expect(await service.accept(third, revision.sheetId)).toEqual({ status: "UPDATED", movementId: pilotId });
    const updated = await movementsOn(main).findMovement(pilotId);
    expect(decodeInstructionSteps(updated!.description).at(-1)).toBe("Revenir lentement");
    expect((await registry.snapshot(pilot.catalogue.id)).decisions).toEqual([]);
    const final = await service.prepare(third);
    expect(final.ok && final.plan.items.every((item) => item.state === "UP_TO_DATE")).toBe(true);
  });

  it("modification personnelle sans conflit : conservée, la nouveauté sur un autre champ appliquée", async () => {
    await installPilot60();
    const { service } = await serviceOn();
    await acceptAll(service, pilot, "ADOPTABLE");
    const pilotId = "pilot:" + pilot.sheets[0]!.sheetId;
    const catalogue = movementsOn(main);
    const mine = (await catalogue.findMovement(pilotId))!;
    expect((await catalogue.update({ ...mine, aliases: ["Mon alias"] })).status).toBe("SAVED");
    const file = editedFile();
    const prepared = await service.prepare(file);
    expect(prepared.ok && prepared.plan.items[0]!.summary).toMatchObject({ keptLocal: ["content.aliases"], movementFields: ["content.steps"], conflicts: [] });
    expect(await service.accept(file, pilot.sheets[0]!.sheetId)).toMatchObject({ status: "UPDATED" });
    const after = (await catalogue.findMovement(pilotId))!;
    expect(after.aliases).toEqual(["Mon alias"]);
    expect(decodeInstructionSteps(after.description).at(-1)).toBe("Revenir lentement");
  });

  it("conflit : aucune écriture sans choix explicite ; garder sa valeur = registre seul ; prendre la nouvelle = valeur sauvegardée", async () => {
    await installPilot60();
    const { service, registry } = await serviceOn();
    await acceptAll(service, pilot, "ADOPTABLE");
    const sheetId = pilot.sheets[0]!.sheetId;
    const pilotId = "pilot:" + sheetId;
    const catalogue = movementsOn(main);
    const mine = (await catalogue.findMovement(pilotId))!;
    await catalogue.update({ ...mine, description: encodeInstructionSteps(["Ma propre consigne"]) });
    const file = editedFile();
    const prepared = await service.prepare(file);
    if (!prepared.ok) throw new Error("refusé");
    const item = prepared.plan.items[0]!;
    expect(item.summary.conflicts).toEqual(["content.steps"]);
    expect(item.recommended).toBe("DEFER");
    expect(item.comparison.find((entry) => entry.path === "content.steps")).toMatchObject({ local: ["Ma propre consigne"], conflict: true });

    const before = await dump();
    expect(await service.accept(file, sheetId)).toEqual({ status: "RESOLUTION_REQUIRED", fields: ["content.steps"] });
    expect(await dump()).toEqual(before);

    expect(await service.accept(file, sheetId, { "content.steps": "KEEP_LOCAL" })).toEqual({ status: "REGISTERED", movementId: pilotId });
    expect(await dump()).toEqual(before);
    expect(decodeInstructionSteps((await catalogue.findMovement(pilotId))!.description)).toEqual(["Ma propre consigne"]);

    // Révision suivante qui modifie encore les étapes : le destinataire choisit de prendre la nouvelle valeur.
    const draft = clone(file) as unknown as { sheets: Record<string, any>[] };  
    const third = draft as unknown as MovementCatalogueFile;
    draft.sheets[0]!.content.steps = ["Consigne officielle v3"];
    draft.sheets[0]!.revision = "3";
    draft.sheets[0]!.history.push({ revision: "3", date: "2026-11-12", author: null, summary: "v3" });
    expect(await service.accept(third, sheetId, { "content.steps": "TAKE_INCOMING" })).toEqual({ status: "UPDATED", movementId: pilotId });
    expect(decodeInstructionSteps((await catalogue.findMovement(pilotId))!.description)).toEqual(["Consigne officielle v3"]);
    expect(await registry.savedLocalValues({ catalogueId: pilot.catalogue.id, sheetId })).toEqual([
      { revision: "3", field: "content.steps", value: ["Ma propre consigne"], savedAt: NOW },
    ]);
  });

  it("médias, phases et archivage locaux jamais modifiés ; Mouvement archivé jamais réinstallé", async () => {
    await installPilot60();
    const { service } = await serviceOn();
    await acceptAll(service, pilot, "ADOPTABLE");
    const pilotId = "pilot:" + pilot.sheets[0]!.sheetId;
    const catalogue = movementsOn(main);
    expect((await catalogue.archive(pilotId)).status).toBe("DONE");
    const before = await dump();
    const prepared = await service.prepare(editedFile());
    expect(prepared.ok && prepared.plan.items[0]!.state).toBe("WITHDRAWN_LOCALLY");
    expect(await service.accept(editedFile(), pilot.sheets[0]!.sheetId)).toEqual({ status: "NOT_APPLICABLE", state: "WITHDRAWN_LOCALLY" });
    expect(await dump()).toEqual(before);
  });

  it("reprise : interruption après l'écriture du Mouvement → confirmée au chargement suivant, sans doublon", async () => {
    const registry = await SqliteCatalogueRegistry.open(registryDb, () => NOW);
    let crash = true;
    const crashing = Object.create(registry) as SqliteCatalogueRegistry;
    crashing.commit = async (entry) => {
      if (crash) { crash = false; throw new Error("Interruption simulée"); }
      return registry.commit(entry);
    };
    const { service } = await serviceOn({ registry: crashing });
    const file = editedFile();
    await expect(service.accept(file, "LOCAL-001")).rejects.toThrow("Interruption simulée");
    expect((await registry.snapshot(pilot.catalogue.id)).pending).toHaveLength(1);

    const prepared = await service.prepare(file);
    if (!prepared.ok) throw new Error("refusé");
    expect(prepared.recovery).toEqual({ completed: ["LOCAL-001"], abandoned: [] });
    expect(prepared.plan.items.find((item) => item.sheetId === "LOCAL-001")!.state).toBe("UP_TO_DATE");
    expect((await main.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM movements WHERE name = ?", ["Squat au mur créé dans le fichier"]))!.n).toBe(1);
  });

  it("reprise : interruption avant l'écriture du Mouvement → abandonnée, fiche reproposée", async () => {
    const registry = await SqliteCatalogueRegistry.open(registryDb, () => NOW);
    const failing = movementsOn(main);
    failing.createIndependent = async () => { throw new Error("Arrêt de l'application"); };
    const service = new CatalogueLoadService({
      registry, movements: failing, readLocalMovements: freshLocalMovementReader(main), newMovementId: () => "uuid-x",
      listReferentials: async () => ({
        categoryIds: new Set((await new SqliteCategoryRepository(main).listAll()).map((c) => c.id)),
        bodyZoneIds: new Set((await new SqliteBodyZoneRepository(main).listAll()).map((z) => z.id)),
      }),
    });
    const file = editedFile();
    await expect(service.accept(file, "LOCAL-001")).rejects.toThrow("Arrêt");
    const { service: restarted } = await serviceOn({ registry });
    const prepared = await restarted.prepare(file);
    if (!prepared.ok) throw new Error("refusé");
    expect(prepared.recovery).toEqual({ completed: [], abandoned: ["LOCAL-001"] });
    expect(prepared.plan.items.find((item) => item.sheetId === "LOCAL-001")!.state).toBe("NEW");
  });

  it("perte du registre : pilote adoptable de nouveau, fiche installée sous identifiant aléatoire « à rapprocher », aucune écriture", async () => {
    await installPilot60();
    const { service } = await serviceOn();
    await acceptAll(service, pilot, "ADOPTABLE");
    const file = editedFile();
    await service.accept(file, "LOCAL-001");
    registryDb.close();
    registryDb = NodeSqliteDatabase.openInMemory();
    const { service: fresh } = await serviceOn();
    const before = await dump();
    const prepared = await fresh.prepare(file);
    if (!prepared.ok) throw new Error("refusé");
    const byId = new Map(prepared.plan.items.map((item) => [item.sheetId, item]));
    expect(byId.get("LOCAL-001")).toMatchObject({ state: "TO_RECONCILE" });
    expect(byId.get(pilot.sheets[1]!.sheetId)!.state).toBe("ADOPTABLE");
    // Fiche révisée (révision 2 dans le fichier, Mouvement en révision 1) : différence = conflit explicite.
    expect(byId.get(pilot.sheets[0]!.sheetId)).toMatchObject({ state: "TO_RECONCILE", summary: { conflicts: ["content.steps"] } });
    expect(await dump()).toEqual(before);
  });

  it("connexion principale en retard après chaque transaction (expo-sqlite, 9/11) : installation fiable", async () => {
    const stale = staleMainConnectionAfterCommit(main);
    const { service } = await serviceOn({ mainDb: stale });
    const file = editedFile();
    expect(await service.accept(file, "LOCAL-001")).toMatchObject({ status: "INSTALLED" });
    const prepared = await service.prepare(file);
    expect(prepared.ok && prepared.plan.items.find((item) => item.sheetId === "LOCAL-001")!.state).toBe("UP_TO_DATE");
  });

  it("fichier invalide refusé en entier, avant toute lecture ou écriture", async () => {
    const { service } = await serviceOn();
    const before = [await dump(), await dump(registryDb)];
    const invalid = { ...clone(pilot), catalogue: { ...pilot.catalogue, publicationAllowed: true } };
    const prepared = await service.prepare(invalid);
    expect(prepared).toMatchObject({ ok: false, issues: [{ path: "catalogue.publicationAllowed", code: "INCONSISTENT" }] });
    expect([await dump(), await dump(registryDb)]).toEqual(before);
  });

  it("projection installée = projection de la fiche (identifiant local attribué à l'installation)", async () => {
    const { service } = await serviceOn();
    const file = editedFile();
    const outcome = await service.accept(file, "LOCAL-001");
    if (outcome.status !== "INSTALLED") throw new Error(outcome.status);
    const stored = (await movementsOn(main).findMovement(outcome.movementId))!;
    const expected = projectSheetToMovement(file.sheets[60]!, outcome.movementId);
    expect({ ...stored, bodyZoneIds: [...stored.bodyZoneIds].sort() }).toMatchObject({ ...expected, bodyZoneIds: [...expected.bodyZoneIds].sort() });
  });
});

/** Même double que `pilotMovementImport.sqlite.test.ts` : première lecture de `movements` après une transaction vide. */
function staleMainConnectionAfterCommit(inner: Database): Database {
  let stale = false;
  const hide = <T>(source: string, rows: T[]): T[] => {
    if (stale && /FROM movements\b/i.test(source)) {
      stale = false;
      return [];
    }
    return rows;
  };
  return {
    execAsync: (source) => inner.execAsync(source),
    runAsync: (source, parameters) => inner.runAsync(source, parameters),
    getFirstAsync: async <T>(source: string, parameters?: Parameters<Database["getFirstAsync"]>[1]) =>
      hide(source, [await inner.getFirstAsync<T>(source, parameters)].filter((row): row is Awaited<T> & {} => row !== null))[0] ?? null,
    getAllAsync: async <T>(source: string, parameters?: Parameters<Database["getAllAsync"]>[1]) =>
      hide(source, await inner.getAllAsync<T>(source, parameters)),
    withExclusiveTransactionAsync: async (task) => {
      await inner.withExclusiveTransactionAsync(task);
      stale = true;
    },
  };
}
