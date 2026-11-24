import { beforeEach, describe, expect, it } from "@jest/globals";

import {
  DuplicateLibraryTitleError,
  libraryTitleKey,
  normalizeLibraryTitle,
  personalLibraryIssue,
  type PersonalLibrary,
} from "@/domain/catalogue/personalLibrary";
import { SqliteCatalogueRegistry } from "@/infrastructure/catalogue/SqliteCatalogueRegistry";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * Bibliothèques personnelles (12/11/2026) — registre v3 sur une base SQLite réelle (`node:sqlite`) : identité d'auteur
 * créée une seule fois, nom unique par auteur sans casse, membres ordonnés par référence, suppression sans effet sur
 * les Mouvements ; passage v2 → v3 additif.
 */

const NOW = "2026-11-12T10:00:00.000Z";
let db: NodeSqliteDatabase;

beforeEach(async () => {
  db = await NodeSqliteDatabase.openInMemory();
});

describe("règles du nom", () => {
  it("normalise les espaces et compare sans casse", () => {
    expect(normalizeLibraryTitle("  Gainage   du   matin ")).toBe("Gainage du matin");
    expect(libraryTitleKey("GAINAGE")).toBe(libraryTitleKey(" gainage "));
  });

  it("bloque un nom vide, un nom déjà pris par le même auteur, une sélection vide", () => {
    const existing: PersonalLibrary[] = [
      { libraryId: "l1", authorId: "a", title: "Gainage", movementIds: ["m1"], createdAt: NOW, updatedAt: NOW },
    ];
    const base = { authorId: "a", existing, movementCount: 2 };
    expect(personalLibraryIssue({ ...base, title: "   " })).toBe("EMPTY_TITLE");
    expect(personalLibraryIssue({ ...base, title: "gainage" })).toBe("DUPLICATE_TITLE");
    expect(personalLibraryIssue({ ...base, title: "gainage", libraryId: "l1" })).toBeNull();
    expect(personalLibraryIssue({ ...base, title: "Gainage", authorId: "b" })).toBeNull();
    expect(personalLibraryIssue({ ...base, title: "Mobilité", movementCount: 0 })).toBe("NO_MOVEMENT");
  });
});

describe("registre v3", () => {
  it("crée l'identité d'auteur une seule fois", async () => {
    const registry = await SqliteCatalogueRegistry.open(db, () => NOW);
    let created = 0;
    const create = () => `auteur-${++created}`;
    expect(await registry.localAuthorId(create)).toBe("auteur-1");
    expect(await registry.localAuthorId(create)).toBe("auteur-1");
    const reopened = await SqliteCatalogueRegistry.open(db, () => NOW);
    expect(await reopened.localAuthorId(create)).toBe("auteur-1");
    expect(created).toBe(1);
  });

  it("enregistre, modifie et supprime une Bibliothèque ; refuse un nom déjà pris", async () => {
    let clock = NOW;
    const registry = await SqliteCatalogueRegistry.open(db, () => clock);
    await registry.savePersonalLibrary({ libraryId: "l1", authorId: "a", title: " Gainage ", movementIds: ["m2", "m1", "m2"] });
    expect(await registry.personalLibraries()).toEqual([
      { libraryId: "l1", authorId: "a", title: "Gainage", movementIds: ["m2", "m1"], createdAt: NOW, updatedAt: NOW },
    ]);

    await expect(
      registry.savePersonalLibrary({ libraryId: "l2", authorId: "a", title: "GAINAGE", movementIds: ["m3"] }),
    ).rejects.toBeInstanceOf(DuplicateLibraryTitleError);
    expect(await registry.personalLibraries()).toHaveLength(1);

    clock = "2026-11-12T11:00:00.000Z";
    await registry.savePersonalLibrary({ libraryId: "l1", authorId: "a", title: "Gainage doux", movementIds: ["m1", "m3"] });
    await registry.savePersonalLibrary({ libraryId: "l2", authorId: "a", title: "Gainage", movementIds: ["m3"] });
    const [first, second] = await registry.personalLibraries();
    expect(first).toEqual({
      libraryId: "l1", authorId: "a", title: "Gainage doux", movementIds: ["m1", "m3"], createdAt: NOW, updatedAt: clock,
    });
    expect(second!.title).toBe("Gainage");

    await registry.deletePersonalLibrary("l1");
    expect((await registry.personalLibraries()).map((library) => library.libraryId)).toEqual(["l2"]);
    expect(await db.getAllAsync("SELECT * FROM personal_library_members WHERE library_id = 'l1'")).toEqual([]);
  });

  it("passe de v2 à v3 sans toucher aux Bibliothèques installées", async () => {
    await SqliteCatalogueRegistry.open(db, () => NOW);
    await db.execAsync("DROP TABLE local_author; DROP TABLE personal_libraries; DROP TABLE personal_library_members; PRAGMA user_version = 2;");
    await db.runAsync("INSERT INTO installed_libraries VALUES ('c', 'b', '1', 'k', '{}', ?, ?)", [NOW, NOW]);

    const registry = await SqliteCatalogueRegistry.open(db, () => NOW);
    // v4 (18/11/2026, format 3.0.0) : conversion additive ; Bibliothèque installée conservée.
    expect((await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version"))!.user_version).toBe(5);
    expect(await db.getAllAsync("SELECT catalogue_id, library_id FROM installed_libraries")).toEqual([{ catalogue_id: "c", library_id: "b" }]);
    expect(await registry.personalLibraries()).toEqual([]);
  });
});
