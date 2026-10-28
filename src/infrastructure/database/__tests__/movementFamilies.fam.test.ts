import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import type { Movement } from "@/domain/activities/Movement";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { keyBetween, SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * PRE-8 — familles de niveaux du Catalogue des Mouvements (règles A à E du 28/10/2026, DSF
 * « Composition et ordre des familles », FAM-01 à FAM-10) sur SQLite RÉELLE : écritures minimales,
 * clés fractionnaires, création à deux lignes, sortie, dissolution du dernier couple, Annuler,
 * identités et contenus inchangés.
 */

const NOW = "2026-10-28T09:00:00.000Z";

function movement(id: string): Movement {
  return {
    id,
    name: `Mouvement ${id}`,
    description: "Buste droit",
    media: [],
    categoryId: "cardio",
    bodyZoneIds: ["dos"],
    phases: [],
    nextPhaseId: 1,
    aliases: [],
    levelGroup: null,
  };
}

describe("PRE-8 familles — SqliteMovementRepository", () => {
  let database: NodeSqliteDatabase;
  let sequence = 0;
  const repository = () => new SqliteMovementRepository(database, () => `group-${++sequence}`, () => NOW);
  const memberships = async () =>
    (await database.getAllAsync<{ id: string; level_group_id: string | null; level_sort_key: number | null }>(
      "SELECT id, level_group_id, level_sort_key FROM movements ORDER BY id",
    )).map((row) => [row.id, row.level_group_id, row.level_sort_key]);
  /** Ordre de la famille, rang croissant (le niveau le plus élevé en dernier). */
  const family = async (groupId: string) => (await repository().listGroup(groupId)).map((member) => member.id);

  beforeEach(async () => {
    database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database);
    sequence = 0;
    for (const id of ["a", "b", "c", "d", "x", "y"]) await repository().create(movement(id));
  });

  afterEach(() => {
    database.close();
  });

  it("C1 / C3 (FAM-04) : poser au-dessus d'un isolé crée une famille, le Mouvement posé au niveau supérieur ; deux lignes écrites", async () => {
    const outcome = await repository().placeInFamily("x", "a", "ABOVE");
    expect(outcome).toEqual({
      status: "OK",
      operation: "CREATED",
      groupId: "group-1",
      previous: [
        { movementId: "x", groupId: null, sortKey: null },
        { movementId: "a", groupId: null, sortKey: null },
      ],
    });
    expect(await family("group-1")).toEqual(["a", "x"]);
  });

  it("C3 : poser en dessous donne le niveau inférieur", async () => {
    await repository().placeInFamily("x", "a", "BELOW");
    expect(await family("group-1")).toEqual(["x", "a"]);
  });

  it("C2 / C7 (FAM-05) : entrer entre deux membres d'une famille de trois ; seule la ligne entrante est écrite", async () => {
    await repository().placeInFamily("b", "a", "ABOVE");
    await repository().placeInFamily("c", "b", "ABOVE");
    const before = await memberships();
    const outcome = await repository().placeInFamily("x", "b", "BELOW");
    expect(outcome).toMatchObject({ status: "OK", operation: "JOINED", groupId: "group-1", previous: [{ movementId: "x", groupId: null, sortKey: null }] });
    expect(await family("group-1")).toEqual(["a", "x", "b", "c"]);
    const after = await memberships();
    const changed = after.filter((row, index) => JSON.stringify(row) !== JSON.stringify(before[index])).map((row) => row[0]);
    expect(changed).toEqual(["x"]);
  });

  it("A (FAM-01) : réordonner n'écrit que la clé du Mouvement déplacé", async () => {
    await repository().placeInFamily("b", "a", "ABOVE");
    await repository().placeInFamily("c", "b", "ABOVE");
    const before = await memberships();
    const outcome = await repository().placeInFamily("c", "a", "BELOW");
    expect(outcome).toMatchObject({ status: "OK", operation: "REORDERED", previous: [{ movementId: "c", groupId: "group-1" }] });
    expect(await family("group-1")).toEqual(["c", "a", "b"]);
    const after = await memberships();
    expect(after.filter((row, index) => JSON.stringify(row) !== JSON.stringify(before[index])).map((row) => row[0])).toEqual(["c"]);
  });

  it("C6 (FAM-06) : un membre d'une autre famille ne se pose ni sur un isolé ni sur un membre ; rien n'est écrit", async () => {
    await repository().placeInFamily("b", "a", "ABOVE");
    await repository().placeInFamily("y", "x", "ABOVE");
    const before = await memberships();
    expect(await repository().placeInFamily("a", "c", "ABOVE")).toEqual({ status: "ALREADY_IN_GROUP" });
    expect(await repository().placeInFamily("a", "x", "ABOVE")).toEqual({ status: "ALREADY_IN_GROUP" });
    expect(await repository().placeInFamily("a", "a", "ABOVE")).toEqual({ status: "INVALID_ORDER" });
    expect(await memberships()).toEqual(before);
  });

  it("B (FAM-02) : sortir d'une famille de trois n'efface que la ligne sortie ; les autres clés sont conservées", async () => {
    await repository().placeInFamily("b", "a", "ABOVE");
    await repository().placeInFamily("c", "b", "ABOVE");
    const outcome = await repository().leaveFamily("a");
    expect(outcome).toEqual({ status: "OK", operation: "LEFT", groupId: "group-1", previous: [{ movementId: "a", groupId: "group-1", sortKey: 0 }] });
    expect(await family("group-1")).toEqual(["b", "c"]);
    expect((await repository().findById("a"))?.levelGroup).toBeNull();
  });

  it("D2 (FAM-07) : sortir du dernier couple efface les deux appartenances, aucun singleton fantôme", async () => {
    await repository().placeInFamily("b", "a", "ABOVE");
    const outcome = await repository().leaveFamily("b");
    expect(outcome).toMatchObject({ status: "OK", operation: "DISSOLVED", groupId: "group-1" });
    expect(await family("group-1")).toEqual([]);
    expect((await repository().findById("a"))?.levelGroup).toBeNull();
    expect((await repository().findById("b"))?.levelGroup).toBeNull();
    expect(await repository().leaveFamily("a")).toEqual({ status: "INVALID_ORDER" });
  });

  it("D3 : un membre archivé compte dans la famille — sortir d'un couple actif accompagné d'un archivé ne dissout pas", async () => {
    await repository().placeInFamily("b", "a", "ABOVE");
    await repository().placeInFamily("c", "b", "ABOVE");
    await repository().archive("c");
    expect(await repository().leaveFamily("a")).toMatchObject({ status: "OK", operation: "LEFT" });
    expect(await family("group-1")).toEqual(["b", "c"]);
  });

  it("D4 : un Mouvement posé sur un singleton subi (son autre membre archivé) entre dans ce groupe ; l'archivé reste membre", async () => {
    await repository().placeInFamily("b", "a", "ABOVE");
    await repository().archive("b");
    expect(await repository().placeInFamily("x", "a", "BELOW")).toMatchObject({ status: "OK", operation: "JOINED", groupId: "group-1" });
    expect(await family("group-1")).toEqual(["x", "a", "b"]);
  });

  it("E (FAM-08) : Annuler rétablit l'état exact, y compris les deux membres d'une création ou d'une dissolution", async () => {
    const initial = await memberships();
    const created = await repository().placeInFamily("x", "a", "ABOVE");
    if (created.status !== "OK") throw new Error("création refusée");
    expect(await repository().restoreFamilyMemberships(created.previous)).toBe(true);
    expect(await memberships()).toEqual(initial);

    await repository().placeInFamily("b", "a", "ABOVE");
    const couple = await memberships();
    const dissolved = await repository().leaveFamily("a");
    if (dissolved.status !== "OK") throw new Error("sortie refusée");
    expect(await repository().restoreFamilyMemberships(dissolved.previous)).toBe(true);
    expect(await memberships()).toEqual(couple);
  });

  it("FAM-10 : identités, contenus et références inchangés ; Mouvement introuvable : rien n'est écrit", async () => {
    const before = await repository().findById("a");
    await repository().placeInFamily("x", "a", "ABOVE");
    await repository().leaveFamily("x");
    expect({ ...(await repository().findById("a")), levelGroup: null }).toEqual({ ...before, levelGroup: null });
    expect(await repository().placeInFamily("inconnu", "a", "ABOVE")).toEqual({ status: "NOT_FOUND" });
    expect(await repository().leaveFamily("inconnu")).toEqual({ status: "NOT_FOUND" });
    expect(await repository().restoreFamilyMemberships([{ movementId: "inconnu", groupId: null, sortKey: null }])).toBe(false);
  });

  it("clés fractionnaires : insertions répétées au même endroit, puis renumérotation quand la précision est épuisée", async () => {
    await repository().placeInFamily("b", "a", "ABOVE");
    // Chaque pose juste sous « b » (clé 1) divise par deux l'écart à sa voisine : ~52 poses épuisent la précision.
    for (let index = 0; index < 60; index += 1) await repository().placeInFamily(index % 2 === 0 ? "c" : "d", "b", "BELOW");
    const order = await family("group-1");
    expect(order[0]).toBe("a");
    expect(order).toHaveLength(4);
    expect(new Set(order).size).toBe(4);
  });

  it("clôture FAM (D) : rééquilibrage seulement quand la précision est épuisée — ordre, identités et appartenances conservés, archivé compris", async () => {
    await repository().placeInFamily("b", "a", "ABOVE");
    await repository().placeInFamily("x", "b", "ABOVE");
    await repository().archive("x");
    let rebalanced = 0;
    for (let index = 0; index < 60; index += 1) {
      const before = await memberships();
      const moved = index % 2 === 0 ? "c" : "d";
      await repository().placeInFamily(moved, "b", "BELOW");
      const changed = (await memberships()).filter((row, at) => JSON.stringify(row) !== JSON.stringify(before[at])).map((row) => row[0]);
      // Hors rééquilibrage, seule la ligne du Mouvement déplacé est réécrite.
      if (changed.length > 1) rebalanced += 1;
      else expect(changed).toEqual([moved]);
    }
    // Déclenché à l'épuisement de la précision seulement, et pas à chaque déplacement.
    expect(rebalanced).toBeGreaterThanOrEqual(1);
    expect(rebalanced).toBeLessThanOrEqual(2);
    // Dernier déplacement : « d » juste sous « b » ; l'archivé « x » garde sa place et son appartenance.
    expect(await family("group-1")).toEqual(["a", "c", "d", "b", "x"]);
    expect((await repository().findById("x"))?.levelGroup?.groupId).toBe("group-1");
    expect(new Set((await memberships()).filter((row) => row[1] !== null).map((row) => row[1]))).toEqual(new Set(["group-1"]));
  });

  it("clôture FAM (D) : un rééquilibrage interrompu ne laisse aucune renumérotation partielle", async () => {
    await repository().placeInFamily("b", "a", "ABOVE");
    // Les clés fractionnaires restent dans ]0,5 ; 1[ : la clé entière 2 n'est écrite que par un rééquilibrage.
    await database.execAsync(
      "CREATE TRIGGER fail_rebalance BEFORE UPDATE OF level_sort_key ON movements WHEN NEW.level_sort_key = 2 BEGIN SELECT RAISE(ABORT, 'échec simulé'); END;",
    );
    let failed = false;
    for (let index = 0; index < 60 && !failed; index += 1) {
      const before = await memberships();
      try {
        await repository().placeInFamily(index % 2 === 0 ? "c" : "d", "b", "BELOW");
      } catch {
        failed = true;
        expect(await memberships()).toEqual(before);
      }
    }
    expect(failed).toBe(true);
  });

  it("keyBetween : extrémités ouvertes et milieu", () => {
    expect(keyBetween(null, null)).toBe(0);
    expect(keyBetween(2, null)).toBe(3);
    expect(keyBetween(null, 2)).toBe(1);
    expect(keyBetween(1, 2)).toBe(1.5);
    expect(keyBetween(1, 1 + Number.EPSILON)).toBeNull();
  });

  it("FAM-11 : l'ordre au menu (reorder) et « Ajouter un niveau » restent opérants avec des clés fractionnaires", async () => {
    await repository().placeInFamily("b", "a", "ABOVE");
    await repository().placeInFamily("c", "a", "ABOVE");
    expect(await family("group-1")).toEqual(["a", "c", "b"]);
    expect((await repository().reorder("group-1", ["b", "c", "a"])).status).toBe("OK");
    expect(await family("group-1")).toEqual(["b", "c", "a"]);
    expect((await repository().insertAfter("x", "c")).status).toBe("OK");
    expect(await family("group-1")).toEqual(["b", "c", "x", "a"]);
  });
});
