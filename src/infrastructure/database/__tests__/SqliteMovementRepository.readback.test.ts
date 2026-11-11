import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import type { Movement } from "@/domain/activities/Movement";
import type { Database, SqlParameters } from "@/infrastructure/database/Database";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * Recette iPhone du 9/11/2026 (import des 60 Mouvements pilotes, build EAS f882e911) :
 * « The created movement could not be read back » à des rangs aléatoires.
 *
 * Avec expo-sqlite, `withExclusiveTransactionAsync` écrit sur une connexion distincte ; juste après
 * la validation, la connexion principale (WAL) peut encore lire un instantané antérieur. Ce double
 * reproduit ce retard : la première lecture de `movements` sur la connexion principale qui suit
 * chaque transaction ne voit pas les lignes que celle-ci vient de valider. `node:sqlite` seul
 * (une connexion) ne le montre pas.
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
    getFirstAsync: async <T>(source: string, parameters?: SqlParameters) => {
      const row = await inner.getFirstAsync<T>(source, parameters);
      return row === null ? null : (hide(source, [row])[0] ?? null);
    },
    getAllAsync: async <T>(source: string, parameters?: SqlParameters) =>
      hide(source, await inner.getAllAsync<T>(source, parameters)),
    withExclusiveTransactionAsync: async (task) => {
      await inner.withExclusiveTransactionAsync(task);
      stale = true;
    },
  };
}

const NOW = "2026-11-09T09:00:00.000Z";

function movement(id: string, name: string): Movement {
  return {
    id,
    name,
    description: "Buste droit",
    media: [],
    categoryId: "cardio",
    bodyZoneIds: ["cuisses"],
    phases: [{ id: 1, label: "Descente" }],
    nextPhaseId: 2,
    aliases: ["Alias"],
    levelGroup: null,
  };
}

describe("SqliteMovementRepository.create — relecture sur la connexion d'écriture", () => {
  let database: NodeSqliteDatabase;
  let sequence = 0;

  beforeEach(async () => {
    database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database);
  });

  afterEach(() => {
    database.close();
  });

  it("relit le Mouvement créé même si la connexion principale est en retard d'un instantané", async () => {
    const repository = new SqliteMovementRepository(
      staleMainConnectionAfterCommit(database),
      () => `id-${++sequence}`,
      () => NOW,
    );

    for (let index = 1; index <= 20; index += 1) {
      const created = await repository.create(movement(`mov-${index}`, `Mouvement ${index}`));
      expect(created).toEqual(movement(`mov-${index}`, `Mouvement ${index}`));
    }
    expect((await database.getFirstAsync<{ count: number }>("SELECT COUNT(*) AS count FROM movements"))!.count).toBe(20);
  });
});
