import * as SQLite from "expo-sqlite";

import { CONNECTION_PRAGMAS, STANDARD_PRAGMAS } from "./constants";
import type {
  Database,
  SqlParameters,
  SqlRunResult,
} from "./Database";

export class ExpoDatabase implements Database {
  constructor(private readonly database: SQLite.SQLiteDatabase) {}

  execAsync(source: string): Promise<void> {
    return this.database.execAsync(source);
  }

  async runAsync(source: string, parameters: SqlParameters = []): Promise<SqlRunResult> {
    const result = await this.database.runAsync(source, [...parameters]);
    return { changes: result.changes, lastInsertRowId: result.lastInsertRowId };
  }

  getFirstAsync<T>(source: string, parameters: SqlParameters = []): Promise<T | null> {
    return this.database.getFirstAsync<T>(source, [...parameters]);
  }

  getAllAsync<T>(source: string, parameters: SqlParameters = []): Promise<T[]> {
    return this.database.getAllAsync<T>(source, [...parameters]);
  }

  /**
   * Transaction exclusive sur une connexion dédiée, comme `SQLiteDatabase.withExclusiveTransactionAsync`
   * d'expo-sqlite 57 (nouvelle connexion, `BEGIN`, `COMMIT` ou `ROLLBACK`, fermeture), avec en plus les pragmas de
   * connexion appliqués AVANT `BEGIN` (`PRAGMA foreign_keys` est sans effet dans une transaction).
   *
   * Recette iPhone du 20/11/2026 : la connexion ouverte par expo-sqlite n'avait pas `foreign_keys = ON` ; aucune
   * règle `ON DELETE CASCADE` ni `RESTRICT` ne s'appliquait aux écritures de l'appareil (Exercices restés en base
   * après la suppression de leur Séance), alors que les tests, sur une connexion unique, les appliquaient.
   */
  async withExclusiveTransactionAsync(task: (transaction: Database) => Promise<void>): Promise<void> {
    const path: unknown = this.database.databasePath;
    const separator = typeof path === "string" ? path.lastIndexOf("/") : -1;
    if (typeof path !== "string" || separator < 0) {
      // Base sans fichier (`:memory:`) ou double de test : transaction d'origine d'expo-sqlite.
      return this.database.withExclusiveTransactionAsync(async (transaction) => {
        await task(new ExpoDatabase(transaction));
      });
    }
    const connection = await SQLite.openDatabaseAsync(
      path.substring(separator + 1),
      { ...this.database.options, useNewConnection: true },
      path.substring(0, separator),
    );
    let failure: unknown = null;
    try {
      for (const pragma of CONNECTION_PRAGMAS) {
        await connection.execAsync(pragma);
      }
      await connection.execAsync("BEGIN");
      try {
        await task(new ExpoDatabase(connection));
        await connection.execAsync("COMMIT");
      } catch (error) {
        await connection.execAsync("ROLLBACK");
        throw error;
      }
    } catch (error) {
      failure = error;
    } finally {
      await connection.closeAsync();
    }
    if (failure !== null) throw failure;
  }
}
export type OpenedExpoDatabase = {
  database: ExpoDatabase;
  closeAsync(): Promise<void>;
};

export async function openExpoDatabase(databaseName: string): Promise<OpenedExpoDatabase> {
  const nativeDatabase = await SQLite.openDatabaseAsync(databaseName);
  for (const pragma of STANDARD_PRAGMAS) {
    await nativeDatabase.execAsync(pragma);
  }

  return {
    database: new ExpoDatabase(nativeDatabase),
    closeAsync: () => nativeDatabase.closeAsync(),
  };
}
