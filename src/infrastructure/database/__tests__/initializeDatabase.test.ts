import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { DATABASE_VERSION } from "@/infrastructure/database/constants";
import { initializeDatabase } from "@/infrastructure/database/initializeDatabase";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

describe("initializeDatabase", () => {
  let database: NodeSqliteDatabase;

  beforeEach(() => {
    database = NodeSqliteDatabase.openInMemory();
  });

  afterEach(() => {
    database.close();
  });

  it("applies the foreign_keys pragma and runs the migration", async () => {
    await initializeDatabase(database);

    const foreignKeys = await database.getFirstAsync<{ foreign_keys: number }>(
      "PRAGMA foreign_keys",
    );
    const version = await database.getFirstAsync<{ user_version: number }>(
      "PRAGMA user_version",
    );
    const user = await database.getFirstAsync<{ id: string }>("SELECT id FROM users");

    // foreign_keys is directly observable even on an in-memory database.
    expect(foreignKeys?.foreign_keys).toBe(1);
    expect(version?.user_version).toBe(DATABASE_VERSION);
    expect(user?.id).toMatch(/^usr_[0-9a-f]{32}$/);
  });

  it("is idempotent: a second call is a no-op beyond the first", async () => {
    await initializeDatabase(database);
    const firstUser = await database.getFirstAsync<{ id: string }>("SELECT id FROM users");

    await initializeDatabase(database);

    const users = await database.getAllAsync<{ id: string }>("SELECT id FROM users");
    const version = await database.getFirstAsync<{ user_version: number }>(
      "PRAGMA user_version",
    );

    expect(users).toEqual([firstUser]);
    expect(version?.user_version).toBe(DATABASE_VERSION);
  });

  // `:memory:` reports journal_mode as "memory" regardless of what is
  // requested — its execution cannot be observed there (see
  // T01-S05-rapport-contre-verification.md §3). A real file-backed
  // connection is required to prove that `initializeDatabase` actually
  // executes `PRAGMA journal_mode = WAL`, not merely that the string is
  // listed in STANDARD_PRAGMAS.
  it("actually executes PRAGMA journal_mode = WAL on a real file-backed connection", async () => {
    const tempDirectory = mkdtempSync(join(tmpdir(), "kodjo-initdb-"));
    const databasePath = join(tempDirectory, "test.db");
    let fileDatabase: NodeSqliteDatabase | undefined;

    try {
      // Opening the connection lives inside the protected block: if
      // `openFile` itself throws, the outer `finally` below still runs and
      // removes `tempDirectory`.
      fileDatabase = NodeSqliteDatabase.openFile(databasePath);
      await initializeDatabase(fileDatabase);

      const journalMode = await fileDatabase.getFirstAsync<{ journal_mode: string }>(
        "PRAGMA journal_mode",
      );

      expect(journalMode?.journal_mode.toLowerCase()).toBe("wal");
    } finally {
      try {
        fileDatabase?.close();
      } finally {
        // Nested in its own `finally` so that a failure while closing the
        // connection can never prevent this cleanup from running.
        // `tempDirectory` is a freshly created, unique directory returned
        // by `mkdtempSync` for this test alone — never a broad or
        // unresolved path — so removing it also clears any WAL/SHM
        // sidecar files SQLite created alongside the database file.
        rmSync(tempDirectory, { recursive: true, force: true });
      }
    }
  });
});
