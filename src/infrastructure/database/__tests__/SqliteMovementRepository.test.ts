import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import type { Movement } from "@/domain/activities/Movement";
import { DuplicateMovementNameError } from "@/domain/activities/MovementRepository";
import type { MediaAsset } from "@/domain/media/MediaAsset";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteMovementRepository, updateMovementContent } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { seedCatalogueDefinition } from "@/infrastructure/database/testing/seedCatalogueDefinition";

/**
 * PRE-7 (A1.2, D-437, D-439, MFN-02 à MFN-05, MFN-08) — `SqliteMovementRepository`
 * sur SQLite RÉELLE (`node:sqlite`, schéma de `migration013` : PRE-7, R-3 — nom unique,
 * alias, plus d'indicateur « déjà utilisé »).
 */

const NOW = "2026-10-24T08:00:00.000Z";

const photo = (id: string): MediaAsset => ({
  id,
  uri: `kodjo-media/${id}.jpg`,
  createdAt: "2026-10-24T07:00:00.000Z",
  kind: "PHOTO",
  mimeType: "image/jpeg",
  fileName: null,
  sizeBytes: 10,
  durationMs: null,
  width: 1,
  height: 1,
});

function movement(overrides: Partial<Movement> = {}): Movement {
  return {
    id: "mov-1",
    name: "Squat bulgare",
    description: "Buste droit",
    media: [],
    categoryId: "cardio",
    bodyZoneIds: ["cuisses", "dos"],
    phases: [
      { id: 1, label: "Descente" },
      { id: 3, label: "Maintien" },
    ],
    nextPhaseId: 4,
    aliases: [],
    levelGroup: null,
    ...overrides,
  };
}

describe("SqliteMovementRepository (NodeSqliteDatabase REAL)", () => {
  let database: NodeSqliteDatabase;
  let sequence = 0;
  const ids = (prefix: string) => () => `${prefix}-${++sequence}`;
  const repository = () => new SqliteMovementRepository(database, ids("id"), () => NOW);

  beforeEach(async () => {
    database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database);
    sequence = 0;
  });

  afterEach(() => {
    database.close();
  });

  it("crée et relit un Mouvement à l'identique : contenu, médias ordonnés, Zones, structure (id, libellé), compteur, alias ordonnés, sans groupe", async () => {
    const created = await repository().create(
      movement({
        media: [{ assetId: "p2", asset: photo("p2") }, { assetId: "p1", asset: photo("p1") }],
        aliases: ["Fente bulgare", "Split squat"],
      }),
    );
    expect(created).toEqual(
      movement({
        media: [{ assetId: "p2", asset: photo("p2") }, { assetId: "p1", asset: photo("p1") }],
        aliases: ["Fente bulgare", "Split squat"],
      }),
    );
    expect(await database.getAllAsync("SELECT movement_id, position, alias, normalized_alias FROM movement_aliases ORDER BY position")).toEqual([
      { movement_id: "mov-1", position: 0, alias: "Fente bulgare", normalized_alias: "fente bulgare" },
      { movement_id: "mov-1", position: 1, alias: "Split squat", normalized_alias: "split squat" },
    ]);
    expect(await database.getAllAsync("SELECT movement_id, phase_id, position, label FROM movement_phases ORDER BY position")).toEqual([
      { movement_id: "mov-1", phase_id: 1, position: 0, label: "Descente" },
      { movement_id: "mov-1", phase_id: 3, position: 1, label: "Maintien" },
    ]);
    // PRE-7 (R-3, C03) : plus de colonne « déjà utilisé ».
    const columns = (await database.getAllAsync<{ name: string }>("PRAGMA table_info(movements)")).map((column) => column.name);
    expect(columns).not.toContain("used");
    expect(await database.getFirstAsync("SELECT next_phase_id, level_group_id, level_sort_key FROM movements")).toEqual({
      next_phase_id: 4,
      level_group_id: null,
      level_sort_key: null,
    });
    expect(await repository().findById("absent")).toBeNull();
  });

  it("refuse une entrée invalide sans rien écrire : compteur ≤ max(id), Zones vides, Catégorie inconnue", async () => {
    await expect(repository().create(movement({ nextPhaseId: 3 }))).rejects.toThrow("movement.nextPhaseId");
    await expect(repository().create(movement({ bodyZoneIds: [] }))).rejects.toThrow("movement.bodyZoneIds");
    await expect(repository().create(movement({ categoryId: "inconnue" }))).rejects.toThrow();
    await expect(repository().create(movement({ media: [{ assetId: "p1", asset: photo("p1") }], bodyZoneIds: ["inconnue"] }))).rejects.toThrow();
    for (const table of ["movements", "movement_phases", "movement_body_zones", "movement_media", "media_assets"]) {
      expect({ table, rows: await database.getAllAsync(`SELECT * FROM ${table}`) }).toEqual({ table, rows: [] });
    }
  });

  it("recherche par nom normalisé (casse, accents, espaces), Mouvements locaux compris ; requête vide : tous", async () => {
    await repository().create(movement({ id: "mov-a", name: "Élévation latérale" }));
    await repository().create(movement({ id: "mov-b", name: "Squat  bulgare" }));
    await repository().create(movement({ id: "mov-c", name: "Squat" }));
    expect((await repository().search("  ELEVATION ")).map((item) => item.id)).toEqual(["mov-a"]);
    expect((await repository().search("squat")).map((item) => item.id)).toEqual(["mov-c", "mov-b"]);
    expect((await repository().search("squat bulgare")).map((item) => item.id)).toEqual(["mov-b"]);
    expect((await repository().search("%")).map((item) => item.id)).toEqual([]);
    expect((await repository().search("")).map((item) => item.id)).toEqual(["mov-a", "mov-c", "mov-b"]);
  });

  // PRE-7 (R-3, D-445 C01, C03) : `markUsed` et l'indicateur irréversible sont retirés ; le nom
  // principal est unique sur sa clé canonique, à la création comme à la mise à jour.
  it("nom unique (C01) : clé canonique déjà prise → DuplicateMovementNameError à la création et à la mise à jour, rien n'est écrit ; alias partageables", async () => {
    await repository().create(movement({ aliases: ["Fente bulgare"] }));
    await expect(repository().create(movement({ id: "mov-2", name: "  SQUAT   bulgare " }))).rejects.toBeInstanceOf(DuplicateMovementNameError);
    expect(await database.getAllAsync("SELECT id FROM movements ORDER BY id")).toEqual([{ id: "mov-1" }]);
    // Un alias n'est pas un nom : il peut être partagé par un autre Mouvement.
    await repository().create(movement({ id: "mov-2", name: "Fente arrière", aliases: ["Fente bulgare"] }));
    await expect(
      database.withExclusiveTransactionAsync((transaction) =>
        updateMovementContent(transaction, movement({ id: "mov-2", name: "Squat Bulgare" }), NOW, () => "link"),
      ),
    ).rejects.toBeInstanceOf(DuplicateMovementNameError);
    expect((await repository().findById("mov-2"))?.name).toBe("Fente arrière");
    // Renommer un Mouvement sous sa propre clé (casse) reste permis.
    await database.withExclusiveTransactionAsync((transaction) =>
      updateMovementContent(transaction, movement({ name: "squat Bulgare" }), NOW, () => "link"),
    );
    expect((await repository().findById("mov-1"))?.name).toBe("squat Bulgare");
    // L'index UNIQUE reste la garantie finale (écriture concurrente hors repository).
    await expect(
      database.runAsync(
        "INSERT INTO movements (id, name, normalized_name, category_id, next_phase_id, created_at, updated_at) VALUES ('x', 'Squat bulgare', 'squat bulgare', 'cardio', 1, ?, ?)",
        [NOW, NOW],
      ),
    ).rejects.toThrow(/UNIQUE/);
    expect(await repository().countOccurrences("mov-1")).toBe(0);
  });

  it("suppression : REFERENCED avec le nombre de définitions, rien supprimé ; sans référence : supprimé (phases, Zones, liens), asset conservé ; inconnu : NOT_FOUND", async () => {
    await seedCatalogueDefinition(database, { id: "def-1", movementId: "mov-ref" });
    await seedCatalogueDefinition(database, { id: "def-2", movementId: "mov-ref-2", name: "Fentes" });
    await database.runAsync("UPDATE activity_definitions SET movement_id = 'mov-ref' WHERE id = 'def-2'");
    expect(await repository().countDefinitions("mov-ref")).toBe(2);
    expect(await repository().delete("mov-ref")).toEqual({ status: "REFERENCED", definitionCount: 2, occurrenceCount: 0 });
    expect(await repository().findById("mov-ref")).not.toBeNull();

    await repository().create(movement({ media: [{ assetId: "p1", asset: photo("p1") }] }));
    expect(await repository().delete("mov-1")).toEqual({ status: "DELETED" });
    expect(await repository().findById("mov-1")).toBeNull();
    expect(await database.getAllAsync("SELECT movement_id FROM movement_phases WHERE movement_id = 'mov-1'")).toEqual([]);
    expect(await database.getAllAsync("SELECT id FROM media_assets")).toEqual([{ id: "p1" }]);
    expect(await repository().delete("mov-1")).toEqual({ status: "NOT_FOUND" });
    // La suppression d'une définition ne supprime pas son Mouvement (aucun ramassage, MFN-04).
    await database.runAsync("DELETE FROM activity_definitions");
    expect(await repository().findById("mov-ref")).not.toBeNull();
  });

  it("groupe de niveaux : rattacher crée le groupe (origine en premier), insérer après l'origine, réordonner, retirer ; singleton conservé ; au plus un groupe", async () => {
    for (const id of ["a", "b", "c", "d"]) {
      await repository().create(movement({ id, name: `Niveau ${id}` }));
    }
    const attached = await repository().attachToGroup("b", "a");
    expect(attached.status).toBe("OK");
    const groupId = (await repository().findById("a"))!.levelGroup!.groupId;
    expect(attached.status === "OK" && attached.members.map((item) => [item.id, item.levelGroup])).toEqual([
      ["a", { groupId, sortKey: 0 }],
      ["b", { groupId, sortKey: 1 }],
    ]);
    // « Un niveau créé s'insère immédiatement après celui dont il est issu. »
    const inserted = await repository().insertAfter("c", "a");
    expect(inserted.status === "OK" && inserted.members.map((item) => item.id)).toEqual(["a", "c", "b"]);
    // Au plus un groupe : un membre d'un autre groupe est refusé, rien n'est fusionné.
    await repository().create(movement({ id: "x", name: "X" }));
    await repository().create(movement({ id: "y", name: "Y" }));
    await repository().attachToGroup("y", "x");
    expect(await repository().attachToGroup("y", "a")).toEqual({ status: "ALREADY_IN_GROUP" });
    expect(await repository().attachToGroup("z", "a")).toEqual({ status: "NOT_FOUND" });
    // Réordonner : permutation exacte seulement.
    expect(await repository().reorder(groupId, ["a", "b"])).toEqual({ status: "INVALID_ORDER" });
    expect(await repository().reorder(groupId, ["a", "b", "b"])).toEqual({ status: "INVALID_ORDER" });
    const reordered = await repository().reorder(groupId, ["b", "a", "c"]);
    expect(reordered.status === "OK" && reordered.members.map((item) => item.id)).toEqual(["b", "a", "c"]);
    expect(await repository().reorder("inconnu", [])).toEqual({ status: "NOT_FOUND" });
    // Retirer : contenu et identité des autres inchangés ; groupe réduit à un membre conservé.
    const before = await repository().findById("c");
    await repository().detachFromGroup("a");
    await repository().detachFromGroup("b");
    expect((await repository().findById("a"))?.levelGroup).toBeNull();
    expect((await repository().listGroup(groupId)).map((item) => [item.id, item.levelGroup])).toEqual([["c", { groupId, sortKey: 0 }]]);
    expect({ ...(await repository().findById("c")), levelGroup: null }).toEqual({ ...before, levelGroup: null });
    expect(await repository().detachFromGroup("inconnu")).toEqual({ status: "NOT_FOUND" });
    // Le contenu d'un membre n'est jamais modifié par une opération de groupe.
    expect((await repository().findById("c"))?.name).toBe("Niveau c");
  });

  it("groupe : supprimer un membre non référencé renumérote les autres 0..n-1 ; un refus ALREADY_IN_GROUP ne consomme aucun identifiant ; soi-même : INVALID_ORDER", async () => {
    for (const id of ["a", "b", "c", "x", "y"]) {
      await repository().create(movement({ id, name: `Niveau ${id}` }));
    }
    await repository().attachToGroup("b", "a");
    await repository().attachToGroup("c", "a");
    const groupId = (await repository().findById("a"))!.levelGroup!.groupId;
    expect(await repository().delete("b")).toEqual({ status: "DELETED" });
    expect((await repository().listGroup(groupId)).map((item) => [item.id, item.levelGroup?.sortKey])).toEqual([
      ["a", 0],
      ["c", 1],
    ]);

    await repository().attachToGroup("y", "x");
    const consumed = sequence;
    expect(await repository().attachToGroup("y", "a")).toEqual({ status: "ALREADY_IN_GROUP" });
    expect(sequence).toBe(consumed);
    expect(await repository().attachToGroup("a", "a")).toEqual({ status: "INVALID_ORDER" });
  });
});
