import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { BODY_ZONES } from "@/features/reference-data/bodyZones";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteBodyZoneRepository } from "@/infrastructure/database/repositories/SqliteBodyZoneRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

describe("SqliteBodyZoneRepository", () => {
  let database: NodeSqliteDatabase;

  beforeEach(async () => {
    database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database);
  });

  afterEach(() => {
    database.close();
  });

  it("lists the 10 seeded Zones, all active", async () => {
    const repository = new SqliteBodyZoneRepository(database);
    const zones = await repository.listAll();

    expect(zones).toHaveLength(BODY_ZONES.length);
    expect(zones.map((zone) => zone.id).sort()).toEqual(
      BODY_ZONES.map((zone) => zone.id).sort(),
    );
    expect(zones.every((zone) => zone.isActive)).toBe(true);
  });

  it("keeps a retired Zone representable, excluded from no automatic reassignment logic", async () => {
    await database.runAsync("UPDATE body_zones SET is_active = 0 WHERE id = 'cou'");

    const repository = new SqliteBodyZoneRepository(database);
    const zones = await repository.listAll();
    const retired = zones.find((zone) => zone.id === "cou");

    expect(retired).toBeDefined();
    expect(retired?.isActive).toBe(false);
    expect(zones).toHaveLength(BODY_ZONES.length);
  });
});
