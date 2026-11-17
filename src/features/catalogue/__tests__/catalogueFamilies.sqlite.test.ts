import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import {
  applyFileEdit,
  joinSheetFamily,
  leaveSheetFamily,
  moveSheetInFamily,
} from "@/domain/catalogue/catalogueEditing";
import { catalogueFamilyGroupId } from "@/domain/catalogue/catalogueFamilies";
import {
  parseMovementCatalogueFile,
  serializeMovementCatalogueFile,
  type CatalogueSheet,
  type MovementCatalogueFile,
} from "@/domain/catalogue/MovementCatalogueFile";
import { MovementCatalogueService } from "@/features/activities/MovementCatalogueService";
import { CatalogueLoadService } from "@/features/catalogue/CatalogueLoadService";
import { LibraryService } from "@/features/catalogue/LibraryService";
import { freshLocalMovementReader } from "@/features/catalogue/readLocalMovements";
import { SqliteCatalogueRegistry } from "@/infrastructure/catalogue/SqliteCatalogueRegistry";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteBodyZoneRepository } from "@/infrastructure/database/repositories/SqliteBodyZoneRepository";
import { SqliteCategoryRepository } from "@/infrastructure/database/repositories/SqliteCategoryRepository";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * Familles de niveaux des fiches (décision de Hermann du 11/11/2026), de l'administration au téléphone, sur deux
 * bases SQLite réelles : progression « Pompes au mur → sur les genoux → au sol » transmise par une Bibliothèque
 * présentée dans l'ordre inverse ; réimport sans doublon ; réordonnancement, détachement, import partiel,
 * catalogues indépendants, adaptation locale conservée, ancien catalogue sans famille.
 */

const NOW = "2026-11-11T12:00:00.000Z";
const META = { date: "2026-11-11", author: null, summary: "Recette familles" };
let main: NodeSqliteDatabase;
let registryDb: NodeSqliteDatabase;
let sequence = 0;

function sheet(sheetId: string, name: string): CatalogueSheet {
  return {
    sheetId,
    revision: "1",
    history: [{ revision: "1", date: "2026-11-11", author: null, summary: "Création" }],
    provenance: {
      gestureId: null, origin: "EXTERNAL_IMPORTED", upstream: { catalogueId: "test", sheetId, revision: "1" },
      owner: null, author: null, publisher: null, rightsHolder: null, license: null, reviewStatus: "DRAFT", visibility: "PRIVATE",
    },
    content: { name, aliases: [], startingPosition: null, equipment: null, steps: ["Étape unique"], safetyNotes: null, notes: "" },
    classification: {
      categoryId: "renforcement", bodyZoneIds: ["epaules"], specialtyIds: [], gesturalFamilyIds: [], clinicalProblemIds: [],
      anatomicalTargetIds: [], basis: "TEST", review: null, original: {}, originalProposedSpecialties: [],
    },
    sources: { documentary: null, prescriptionContext: {} },
    validation: {
      classification: "PENDING", clinical: "PENDING", rights: "PENDING", corpusReview: null, licensing: null,
      clinicalValidation: null, publicationAllowed: false,
    },
    media: [],
    install: { knownLocalMovementIds: [] },
  } as CatalogueSheet;
}

function catalogue(id: string, sheets: readonly CatalogueSheet[], members: readonly string[]): MovementCatalogueFile {
  return {
    format: "KODJO_MOVEMENT_CATALOGUE",
    formatVersion: "2.0.0",
    catalogue: { id, title: "Catalogue " + id, revision: "1", owner: null, manager: null, publisher: null, publicationAllowed: false, notes: [] },
    references: {
      categories: [{ id: "renforcement", label: "Renforcement", kind: null, status: null }],
      bodyZones: [{ id: "epaules", label: "Épaules", kind: null, status: null }],
      specialties: [], gesturalFamilies: [], clinicalProblems: [], anatomicalTargets: [],
    },
    glossary: [],
    libraries: [{
      libraryId: "pompes", title: "Pompes", description: null, revision: "1", history: [], editor: null, owner: null,
      visibility: "PRIVATE", publicationAllowed: false, members: members.map((sheetId) => ({ catalogueId: id, sheetId })),
    }],
    sheets: [...sheets],
  } as unknown as MovementCatalogueFile;
}

/** Ce que fait l'administration : édition, puis révisions calculées à l'enregistrement, relecture du fichier. */
function saved(previous: MovementCatalogueFile, edited: MovementCatalogueFile): MovementCatalogueFile {
  const result = applyFileEdit(previous, edited, META);
  if (!result.ok) throw new Error(JSON.stringify(result.issues));
  const reread = parseMovementCatalogueFile(JSON.parse(serializeMovementCatalogueFile(result.file)));
  if (!reread.ok) throw new Error(JSON.stringify(reread.issues));
  return reread.file;
}

/** Administration : progression mur → genoux → sol, Bibliothèque dans l'ordre inverse. */
function pushUps(id = "test.a"): MovementCatalogueFile {
  const initial = catalogue(id, [sheet("MUR", "Pompes au mur"), sheet("GENOUX", "Pompes sur les genoux"), sheet("SOL", "Pompes au sol")],
    ["SOL", "GENOUX", "MUR"]);
  let edited = joinSheetFamily(initial, "GENOUX", "MUR", "famille-pompes");
  edited = joinSheetFamily(edited, "SOL", "GENOUX", "inutilisé");
  return saved(catalogue(id, initial.sheets, ["SOL", "GENOUX", "MUR"]), edited);
}

const repository = () => new SqliteMovementRepository(main, () => `gen-${++sequence}`, () => NOW);

async function phone() {
  const registry = await SqliteCatalogueRegistry.open(registryDb, () => NOW);
  const movements = new MovementCatalogueService(repository());
  const load = new CatalogueLoadService({
    registry,
    movements,
    families: movements,
    readLocalMovements: freshLocalMovementReader(new SqliteMovementRepository(main)),
    listReferentials: async () => ({
      categoryIds: new Set((await new SqliteCategoryRepository(main).listAll()).map((category) => category.id)),
      bodyZoneIds: new Set((await new SqliteBodyZoneRepository(main).listAll()).map((zone) => zone.id)),
    }),
    newMovementId: () => `uuid-${++sequence}`,
  });
  return { registry, movements, libraries: new LibraryService({ registry, load }) };
}

/** Transfert PC → téléphone (texte sérialisé), puis « Installer » / « Mettre à jour » de la Bibliothèque. */
async function importLibrary(file: MovementCatalogueFile, libraryId = "pompes") {
  const services = await phone();
  const available = await services.libraries.available(JSON.parse(serializeMovementCatalogueFile(file)));
  if (!available.ok) throw new Error(JSON.stringify(available.issues));
  const report = await services.libraries.apply(available.file, libraryId);
  return { ...services, report };
}

async function familyNames(groupId: string): Promise<string[]> {
  return (await repository().listGroup(groupId)).map((movement) => movement.name);
}

async function groupOf(name: string): Promise<string | null> {
  const found = (await repository().search(name)).find((movement) => movement.name === name);
  return found?.levelGroup?.groupId ?? null;
}

const movementCount = async () => (await main.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM movements"))!.n;
const PUSH_UPS = catalogueFamilyGroupId("test.a", "famille-pompes");

beforeEach(async () => {
  main = NodeSqliteDatabase.openInMemory();
  registryDb = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(main);
});

afterEach(() => {
  main.close();
  registryDb.close();
});

describe("administration : famille enregistrée dans le catalogue", () => {
  it("garde appartenance et ordre à l'enregistrement et à la réouverture, avec une révision par fiche rattachée", () => {
    const file = pushUps();
    const levels = Object.fromEntries(file.sheets.map((entry) => [entry.sheetId, entry.levelGroup]));
    expect(levels).toEqual({
      MUR: { groupId: "famille-pompes", sortKey: 0 },
      GENOUX: { groupId: "famille-pompes", sortKey: 1 },
      SOL: { groupId: "famille-pompes", sortKey: 2 },
    });
    expect(file.sheets.map((entry) => entry.revision)).toEqual(["2", "2", "2"]);
    expect(file.libraries[0]!.members.map((member) => member.sheetId)).toEqual(["SOL", "GENOUX", "MUR"]);
  });
});

describe("import sur le téléphone", () => {
  it("restitue la progression de l'administration et garde l'ordre de présentation de la Bibliothèque", async () => {
    const { registry, report } = await importLibrary(pushUps());
    expect(report).toMatchObject({ kind: "INSTALL", added: 3, failed: [] });
    expect(await familyNames(PUSH_UPS)).toEqual(["Pompes au mur", "Pompes sur les genoux", "Pompes au sol"]);
    const [installed] = await registry.installedLibraries();
    expect(installed!.library.members.map((member) => member.sheetId)).toEqual(["SOL", "GENOUX", "MUR"]);
  });

  it("réimport : mêmes Mouvements et même famille, aucun doublon", async () => {
    await importLibrary(pushUps());
    const again = await importLibrary(pushUps());
    expect(again.report).toMatchObject({ added: 0, attached: 0, updated: 0, failed: [] });
    expect(await movementCount()).toBe(3);
    expect(await familyNames(PUSH_UPS)).toEqual(["Pompes au mur", "Pompes sur les genoux", "Pompes au sol"]);
  });

  it("mise à jour d'une progression réordonnée dans l'administration", async () => {
    const first = pushUps();
    await importLibrary(first);
    const reordered = saved(first, moveSheetInFamily(first, "SOL", -1));
    expect(reordered.sheets.filter((entry) => entry.revision === "3").map((entry) => entry.sheetId)).toEqual(["GENOUX", "SOL"]);
    const { report } = await importLibrary(reordered);
    expect(report).toMatchObject({ kind: "UPDATE", updated: 2, failed: [] });
    expect(await familyNames(PUSH_UPS)).toEqual(["Pompes au mur", "Pompes au sol", "Pompes sur les genoux"]);
  });

  it("détachement : le Mouvement sort de la famille, les autres restent dans l'ordre", async () => {
    const first = pushUps();
    await importLibrary(first);
    const detached = saved(first, leaveSheetFamily(first, "MUR"));
    await importLibrary(detached);
    expect(await groupOf("Pompes au mur")).toBeNull();
    expect(await familyNames(PUSH_UPS)).toEqual(["Pompes sur les genoux", "Pompes au sol"]);
  });

  it("détacher l'avant-dernier membre dissout la famille (règle D2)", async () => {
    const first = pushUps();
    await importLibrary(first);
    const pair = saved(first, leaveSheetFamily(first, "MUR"));
    await importLibrary(pair);
    const dissolved = saved(pair, leaveSheetFamily(pair, "SOL"));
    expect(dissolved.sheets.every((entry) => !entry.levelGroup)).toBe(true);
    await importLibrary(dissolved);
    expect(await groupOf("Pompes sur les genoux")).toBeNull();
    expect(await groupOf("Pompes au sol")).toBeNull();
  });

  it("import partiel : seuls les membres reçus forment la famille, dans leur ordre relatif", async () => {
    const full = pushUps();
    const partial = { ...full, libraries: [{ ...full.libraries[0]!, members: full.libraries[0]!.members.filter((m) => m.sheetId !== "GENOUX") }] };
    await importLibrary(partial as MovementCatalogueFile);
    expect(await movementCount()).toBe(2);
    expect(await familyNames(PUSH_UPS)).toEqual(["Pompes au mur", "Pompes au sol"]);
    // Le membre manquant reçu plus tard s'insère à sa place.
    await importLibrary(full);
    expect(await familyNames(PUSH_UPS)).toEqual(["Pompes au mur", "Pompes sur les genoux", "Pompes au sol"]);
  });

  it("deux catalogues indépendants avec la même clé de groupe ne fusionnent pas", async () => {
    await importLibrary(pushUps("test.a"));
    const other = catalogue("test.b", [sheet("A", "Tirage facile"), sheet("B", "Tirage difficile")], ["A", "B"]);
    const otherSaved = saved(other, joinSheetFamily(other, "B", "A", "famille-pompes"));
    await importLibrary(otherSaved);
    expect(await familyNames(PUSH_UPS)).toEqual(["Pompes au mur", "Pompes sur les genoux", "Pompes au sol"]);
    expect(await familyNames(catalogueFamilyGroupId("test.b", "famille-pompes"))).toEqual(["Tirage facile", "Tirage difficile"]);
  });

  it("adaptation locale conservée : un Mouvement sorti de la famille sur le téléphone n'y est pas remis", async () => {
    const first = pushUps();
    const { movements } = await importLibrary(first);
    const knees = (await repository().search("Pompes sur les genoux"))[0]!;
    expect((await movements.leaveFamily(knees.id)).status).toBe("OK");
    await importLibrary(saved(first, moveSheetInFamily(first, "GENOUX", 1)));
    expect(await groupOf("Pompes sur les genoux")).toBeNull();
    expect(await familyNames(PUSH_UPS)).toEqual(["Pompes au mur", "Pompes au sol"]);
  });

  it("ancien catalogue sans famille : lisible, installé sans famille", async () => {
    const legacy = catalogue("test.c", [sheet("X", "Gainage"), sheet("Y", "Fente")], ["X", "Y"]);
    expect(parseMovementCatalogueFile(legacy).ok).toBe(true);
    const { report } = await importLibrary(legacy);
    expect(report).toMatchObject({ added: 2, failed: [] });
    expect(await groupOf("Gainage")).toBeNull();
    expect(await groupOf("Fente")).toBeNull();
  });
});
