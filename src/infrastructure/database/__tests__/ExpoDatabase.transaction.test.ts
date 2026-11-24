import { describe, expect, it, jest } from "@jest/globals";

/**
 * Recette iPhone du 20/11/2026 : la transaction exclusive s'exécute sur une connexion dédiée ; les clés étrangères y
 * sont activées AVANT `BEGIN` (sans effet une fois la transaction ouverte). Exercices restés après la suppression de
 * leur Séance tant que ce n'était pas le cas.
 */
const mockLog: string[] = [];
const mockOpen = jest.fn();

jest.mock("expo-sqlite", () => ({
  openDatabaseAsync: (...args: unknown[]) => {
    mockOpen(...args);
    return Promise.resolve({
      execAsync: (sql: string) => {
        mockLog.push(sql);
        return Promise.resolve();
      },
      runAsync: (sql: string) => {
        mockLog.push(sql);
        return Promise.resolve({ changes: 1, lastInsertRowId: 0 });
      },
      closeAsync: () => {
        mockLog.push("close");
        return Promise.resolve();
      },
    });
  },
}));

// eslint-disable-next-line import/first
import { ExpoDatabase } from "@/infrastructure/database/ExpoDatabase";

const main = {
  databasePath: "/var/mobile/Containers/Data/SQLite/kodjo.db",
  options: { enableChangeListener: false },
  withExclusiveTransactionAsync: jest.fn(),
};

describe("ExpoDatabase.withExclusiveTransactionAsync", () => {
  it("connexion dédiée au même fichier, clés étrangères actives avant BEGIN, puis COMMIT et fermeture", async () => {
    mockLog.length = 0;
    await new ExpoDatabase(main as never).withExclusiveTransactionAsync(async (transaction) => {
      await transaction.runAsync("DELETE FROM sessions WHERE id = ?", ["s1"]);
    });
    expect(mockOpen).toHaveBeenCalledWith("kodjo.db", { enableChangeListener: false, useNewConnection: true }, "/var/mobile/Containers/Data/SQLite");
    expect(mockLog).toEqual(["PRAGMA foreign_keys = ON", "BEGIN", "DELETE FROM sessions WHERE id = ?", "COMMIT", "close"]);
    expect(main.withExclusiveTransactionAsync).not.toHaveBeenCalled();
  });

  it("échec : ROLLBACK, fermeture, erreur propagée", async () => {
    mockLog.length = 0;
    await expect(
      new ExpoDatabase(main as never).withExclusiveTransactionAsync(async () => {
        throw new Error("échec");
      }),
    ).rejects.toThrow("échec");
    expect(mockLog).toEqual(["PRAGMA foreign_keys = ON", "BEGIN", "ROLLBACK", "close"]);
  });
});
