import { DatabaseSync } from "node:sqlite";

import type {
  Database,
  SqlParameters,
  SqlRunResult,
} from "@/infrastructure/database/Database";

type StatementResult = { changes: number | bigint; lastInsertRowid: number | bigint };
type Statement = {
  run(...parameters: readonly unknown[]): StatementResult;
  get(...parameters: readonly unknown[]): unknown;
  all(...parameters: readonly unknown[]): unknown[];
};
type NativeDatabase = {
  exec(source: string): void;
  prepare(source: string): Statement;
  close(): void;
};

export class NodeSqliteDatabase implements Database {
  private constructor(private readonly nativeDatabase: NativeDatabase) {}

  static openInMemory(): NodeSqliteDatabase {
    const database = new DatabaseSync(":memory:") as NativeDatabase;
    database.exec("PRAGMA foreign_keys = ON");
    return new NodeSqliteDatabase(database);
  }

  async execAsync(source: string): Promise<void> {
    this.nativeDatabase.exec(source);
  }

  async runAsync(source: string, parameters: SqlParameters = []): Promise<SqlRunResult> {
    const result = this.nativeDatabase.prepare(source).run(...parameters);
    return {
      changes: Number(result.changes),
      lastInsertRowId: Number(result.lastInsertRowid),
    };
  }

  async getFirstAsync<T>(source: string, parameters: SqlParameters = []): Promise<T | null> {
    return (this.nativeDatabase.prepare(source).get(...parameters) as T | undefined) ?? null;
  }

  async getAllAsync<T>(source: string, parameters: SqlParameters = []): Promise<T[]> {
    return this.nativeDatabase.prepare(source).all(...parameters) as T[];
  }

  async withExclusiveTransactionAsync(
    task: (transaction: Database) => Promise<void>,
  ): Promise<void> {
    this.nativeDatabase.exec("BEGIN IMMEDIATE");
    try {
      await task(this);
      this.nativeDatabase.exec("COMMIT");
    } catch (error) {
      this.nativeDatabase.exec("ROLLBACK");
      throw error;
    }
  }

  close(): void {
    this.nativeDatabase.close();
  }
}
