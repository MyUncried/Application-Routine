import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import type { Movement } from "@/domain/activities/Movement";
import { MovementCatalogueService } from "@/features/activities/MovementCatalogueService";
import {
  installPilotMovements,
  PILOT_IMPORT_COUNT,
  preparePilotMovementImport,
} from "@/features/activities/pilotMovementImport";
import type { Database } from "@/infrastructure/database/Database";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * Recette technique de la passerelle pilote (PR #434) sur le VRAI repository SQLite
 * (`node:sqlite`, base en mémoire isolée) — complète les tests à faux catalogue :
 * aller-retour SQLite, idempotence réelle, préservation, reprise après interruption.
 */

const NOW = "2026-11-09T09:00:00.000Z";
const MOVEMENT_TABLES = new Set(["movements", "movement_aliases", "movement_body_zones"]);
let database: NodeSqliteDatabase;
let sequence = 0;

function emptyDraft() {
  return {
    schemaVersion: "0.1.0",
    kind: "KODJO_ADMIN_DRAFTS",
    publicationAllowed: false,
    movementEdits: {} as Record<string, unknown>,
    referenceAdditions: { specialties: [], gesturalFamilies: [], clinicalProblems: [], anatomicalTargets: [] },
    referenceLabels: { specialties: {}, gesturalFamilies: {}, clinicalProblems: {}, anatomicalTargets: {} },
    glossary: [],
  };
}

const serviceOn = (db: Database) =>
  new MovementCatalogueService(new SqliteMovementRepository(db, () => `gen-${++sequence}`, () => NOW));

async function count(table: string, where = ""): Promise<number> {
  return (await database.getFirstAsync<{ count: number }>(`SELECT COUNT(*) AS count FROM ${table} ${where}`))!.count;
}

/** Contenu complet de chaque table hors tables de Mouvement (preuve d'absence d'écriture ailleurs). */
async function otherTablesSnapshot(): Promise<Record<string, string[]>> {
  const tables = await database.getAllAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
  );
  const snapshot: Record<string, string[]> = {};
  for (const { name } of tables) {
    if (MOVEMENT_TABLES.has(name)) continue;
    const rows = await database.getAllAsync<Record<string, unknown>>(`SELECT * FROM "${name}"`);
    snapshot[name] = rows.map((row) => JSON.stringify(row)).sort();
  }
  return snapshot;
}

/** Fait échouer la N-ième insertion de Mouvement (dans sa transaction), une seule fois. */
function failOnNthMovementInsert(inner: Database, nth: number): Database {
  let seen = 0;
  const wrap = (handle: Database): Database => ({
    execAsync: (source) => handle.execAsync(source),
    runAsync: async (source, parameters) => {
      if (/^\s*INSERT INTO movements\s*\(/i.test(source) && ++seen === nth) {
        throw new Error("Injected failure");
      }
      return handle.runAsync(source, parameters);
    },
    getFirstAsync: (source, parameters) => handle.getFirstAsync(source, parameters),
    getAllAsync: (source, parameters) => handle.getAllAsync(source, parameters),
    withExclusiveTransactionAsync: (task) =>
      handle.withExclusiveTransactionAsync(async (transaction) => task(wrap(transaction))),
  });
  return wrap(inner);
}

/**
 * Reproduit la recette iPhone du 9/11 : avec expo-sqlite, la transaction exclusive écrit sur une
 * connexion distincte ; juste après la validation, la connexion principale (WAL) peut relire un
 * instantané antérieur. Ici, la première lecture de `movements` sur la connexion principale qui
 * suit chaque transaction ne voit pas les lignes qu'elle vient de valider.
 */
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

beforeEach(async () => {
  database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
});

afterEach(() => {
  database.close();
});

describe("Passerelle pilote → SQLite réelle (base isolée)", () => {
  it("crée les 60 Mouvements avec étapes, alias, Catégorie et Zones, sans rien écrire ailleurs", async () => {
    const before = await otherTablesSnapshot();
    const preview = preparePilotMovementImport(emptyDraft());

    expect(await installPilotMovements(serviceOn(database), preview)).toEqual({ inserted: 60, unchanged: 0 });

    expect(await count("movements", "WHERE id LIKE 'pilot:%'")).toBe(PILOT_IMPORT_COUNT);
    expect(await otherTablesSnapshot()).toEqual(before);
    const stored = new Map((await serviceOn(database).listEntries()).map((entry) => [entry.movement.id, entry.movement]));
    let steps = 0;
    for (const expected of preview.movements) {
      const actual = stored.get(expected.id)!;
      expect(actual).toMatchObject({ name: expected.name, description: expected.description, categoryId: expected.categoryId });
      expect([...actual.bodyZoneIds].sort()).toEqual([...expected.bodyZoneIds].sort());
      expect(actual.aliases).toEqual(expected.aliases);
      steps += actual.description!.split("\n").length;
    }
    expect(steps).toBe(239);
  });

  it("réimport exact idempotent : aucune nouvelle écriture", async () => {
    const preview = preparePilotMovementImport(emptyDraft());
    await installPilotMovements(serviceOn(database), preview);

    expect(await installPilotMovements(serviceOn(database), preview)).toEqual({ inserted: 0, unchanged: 60 });
    expect(await count("movements", "WHERE id LIKE 'pilot:%'")).toBe(PILOT_IMPORT_COUNT);
  });

  it("réimport avec modifications administrateur (alias, ordre de Zones) : idempotent", async () => {
    const draft = emptyDraft();
    draft.movementEdits["pilot:FIT-CRO-001"] = {
      name: "Air squat — administré",
      steps: ["Position de départ.", "Descente.", "Remontée."],
      aliases: ["Squat simple", "Air squat"],
      categoryId: "renforcement",
      bodyZoneIds: ["genoux", "cuisses"],
      media: [],
    };
    const preview = preparePilotMovementImport(draft);
    await installPilotMovements(serviceOn(database), preview);

    expect(await installPilotMovements(serviceOn(database), preview)).toEqual({ inserted: 0, unchanged: 60 });
  });

  it("préserve les Mouvements existants et refuse une collision de nom sans aucune écriture", async () => {
    const preview = preparePilotMovementImport(emptyDraft());
    const owned: Movement = { ...preview.movements[0]!, id: "user-owned" };
    await serviceOn(database).createIndependent(owned);
    await serviceOn(database).createIndependent({ ...owned, id: "user-other", name: "Squat perso" });
    const before = await otherTablesSnapshot();
    const userMovementsBefore = await serviceOn(database).listEntries();

    await expect(installPilotMovements(serviceOn(database), preview)).rejects.toThrow(/déjà utilisé par user-owned/);

    expect(await serviceOn(database).listEntries()).toEqual(userMovementsBefore);
    expect(await count("movements", "WHERE id LIKE 'pilot:%'")).toBe(0);
    expect(await otherTablesSnapshot()).toEqual(before);
  });

  it("après import, les Mouvements préexistants sont inchangés", async () => {
    const preview = preparePilotMovementImport(emptyDraft());
    await serviceOn(database).createIndependent({ ...preview.movements[0]!, id: "user-other", name: "Squat perso" });
    const [userBefore] = await serviceOn(database).listEntries();

    await installPilotMovements(serviceOn(database), preview);

    expect((await serviceOn(database).listEntries()).find((entry) => entry.movement.id === "user-other")).toEqual(userBefore);
  });

  it("refuse une fiche pilote modifiée sur le téléphone, sans l'écraser", async () => {
    const preview = preparePilotMovementImport(emptyDraft());
    await installPilotMovements(serviceOn(database), preview);
    const first = preview.movements[0]!;
    await serviceOn(database).update({ ...first, name: "Renommé sur iPhone" });

    await expect(installPilotMovements(serviceOn(database), preview)).rejects.toThrow(/contenu différent/);
    expect((await serviceOn(database).findMovement(first.id))?.name).toBe("Renommé sur iPhone");
  });

  it("interruption au 31e Mouvement : 30 conservés sans résidu, reprise sûre avec le même fichier", async () => {
    const preview = preparePilotMovementImport(emptyDraft());

    await expect(installPilotMovements(serviceOn(failOnNthMovementInsert(database, 31)), preview)).rejects.toThrow(
      /Import interrompu après 30 insertion/,
    );
    expect(await count("movements", "WHERE id LIKE 'pilot:%'")).toBe(30);
    const failed = preview.movements[30]!.id;
    expect(await count("movement_aliases", `WHERE movement_id = '${failed}'`)).toBe(0);
    expect(await count("movement_body_zones", `WHERE movement_id = '${failed}'`)).toBe(0);

    expect(await installPilotMovements(serviceOn(database), preview)).toEqual({ inserted: 30, unchanged: 30 });
    expect(await count("movements", "WHERE id LIKE 'pilot:%'")).toBe(PILOT_IMPORT_COUNT);
  });

  it("relecture après création indépendante de la connexion principale (recette iPhone du 9/11)", async () => {
    const preview = preparePilotMovementImport(emptyDraft());

    expect(await installPilotMovements(serviceOn(staleMainConnectionAfterCommit(database)), preview)).toEqual({
      inserted: PILOT_IMPORT_COUNT,
      unchanged: 0,
    });
    expect(await count("movements", "WHERE id LIKE 'pilot:%'")).toBe(PILOT_IMPORT_COUNT);
  });
});
