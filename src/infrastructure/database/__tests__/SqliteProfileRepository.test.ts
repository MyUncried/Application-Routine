import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteProfileRepository } from "@/infrastructure/database/repositories/SqliteProfileRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

describe("SqliteProfileRepository", () => {
  let database: NodeSqliteDatabase;

  beforeEach(async () => {
    database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database);
  });

  afterEach(() => {
    database.close();
  });

  it("returns the singleton Profile with the four normative defaults (plan §3.2, decision D-240)", async () => {
    const repository = new SqliteProfileRepository(database);
    const profile = await repository.get();

    expect(profile.sideChangeRecoverySecondsDefault).toBe(10);
    expect(profile.postActivityRecoverySecondsDefault).toBe(30);
    expect(profile.exerciseCountdownSecondsDefault).toBe(10);
    expect(profile.exerciseEndSecondsDefault).toBe(5);
  });

  it("never fabricates a second row — the singleton stays unique", async () => {
    const repository = new SqliteProfileRepository(database);
    await repository.get();
    await repository.get();

    const count = await database.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) AS count FROM profiles",
    );
    expect(count?.count).toBe(1);
  });
});
