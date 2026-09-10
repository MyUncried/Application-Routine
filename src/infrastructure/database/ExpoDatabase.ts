import * as SQLite from "expo-sqlite";

import { STANDARD_PRAGMAS } from "./constants";
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

  withExclusiveTransactionAsync(task: (transaction: Database) => Promise<void>): Promise<void> {
    return this.database.withExclusiveTransactionAsync(async (transaction) => {
      await task(new ExpoDatabase(transaction));
    });
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
