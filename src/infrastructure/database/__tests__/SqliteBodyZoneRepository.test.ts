import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { BODY_ZONES } from "@/features/reference-data/bodyZones";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteBodyZoneRepository } from "@/infrastructure/database/repositories/SqliteBodyZoneRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

function makeUuidFactory(prefix: string) {
  let counter = 0;
  return () => `${prefix}-${(counter += 1)}`;
}

describe("SqliteBodyZoneRepository", () => {
  let database: NodeSqliteDatabase;

  beforeEach(async () => {
    database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database);
  });

  afterEach(() => {
    database.close();
  });

  it("lists the 10 seeded Zones, all active, each with a canonical key", async () => {
    const repository = new SqliteBodyZoneRepository(database);
    const zones = await repository.listAll();

    expect(zones).toHaveLength(BODY_ZONES.length);
    expect(zones.map((zone) => zone.id).sort()).toEqual(
      BODY_ZONES.map((zone) => zone.id).sort(),
    );
    expect(zones.every((zone) => zone.isActive)).toBe(true);
    expect(zones.every((zone) => (zone.canonicalKey ?? "").length > 0)).toBe(true);
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

  describe("create (V2-PRE-2, D2 reactivation)", () => {
    it("creates a new active Zone, with no color", async () => {
      const repository = new SqliteBodyZoneRepository(database, makeUuidFactory("zone"));
      const result = await repository.create({ name: "Avant-bras" });

      expect(result.status).toBe("OK");
      if (result.status === "OK") {
        expect(result.value).toMatchObject({ name: "Avant-bras", canonicalKey: "avant-bras", isActive: true });
        expect(result.value).not.toHaveProperty("color");
      }
    });

    it("refuses a name whose canonical key matches an ACTIVE Zone (DUPLICATE)", async () => {
      const repository = new SqliteBodyZoneRepository(database, makeUuidFactory("zone"));
      const result = await repository.create({ name: "  Cou  " });
      expect(result).toEqual({ status: "DUPLICATE" });
    });

    it("reactivates a RETIRED Zone of the same canonical key — same identifier, associations conserved", async () => {
      const repository = new SqliteBodyZoneRepository(database, makeUuidFactory("zone"));
      await repository.retire("cou");

      const reactivated = await repository.create({ name: "Cou" });
      expect(reactivated.status).toBe("OK");
      if (reactivated.status === "OK") {
        expect(reactivated.value.id).toBe("cou");
        expect(reactivated.value.isActive).toBe(true);
      }

      const zones = await repository.listAll();
      expect(zones).toHaveLength(BODY_ZONES.length);
    });

    it("keeps a reactivated Zone's existing Activity associations (same id, never a new row)", async () => {
      const repository = new SqliteBodyZoneRepository(database, makeUuidFactory("zone"));
      await database.runAsync(
        `INSERT INTO activity_definitions (id, name, description, execution_mode, duration_seconds, repetition_count, series_count, pause_seconds, side_mode, created_at, updated_at)
         VALUES ('def-1', 'Squat', NULL, 'DURATION', 30, NULL, 3, 10, 'UNILATERAL', 'now', 'now')`,
      );
      await database.runAsync(
        "INSERT INTO activity_definition_body_zones (activity_definition_id, body_zone_id) VALUES ('def-1', 'cuisses')",
      );
      await repository.retire("cuisses");

      await repository.create({ name: "Cuisses" });

      const association = await database.getFirstAsync<{ body_zone_id: string }>(
        "SELECT body_zone_id FROM activity_definition_body_zones WHERE activity_definition_id = 'def-1'",
      );
      expect(association?.body_zone_id).toBe("cuisses");
    });
  });

  describe("rename", () => {
    it("renames without changing the identifier", async () => {
      const repository = new SqliteBodyZoneRepository(database, makeUuidFactory("zone"));
      const renamed = await repository.rename("cou", "Nuque");
      expect(renamed).toEqual({
        status: "OK",
        value: { id: "cou", name: "Nuque", canonicalKey: "nuque", isActive: true, createdAt: expect.any(String) },
      });
    });

    it("refuses a rename that collides with another ACTIVE Zone", async () => {
      const repository = new SqliteBodyZoneRepository(database, makeUuidFactory("zone"));
      const result = await repository.rename("cou", "Épaules");
      expect(result).toEqual({ status: "DUPLICATE" });
    });

    it("returns NOT_FOUND for an unknown identifier", async () => {
      const repository = new SqliteBodyZoneRepository(database, makeUuidFactory("zone"));
      expect(await repository.rename("unknown", "X")).toEqual({ status: "NOT_FOUND" });
    });
  });

  describe("retire", () => {
    it("retires logically — the Zone remains listed but inactive, affectations conserved", async () => {
      const repository = new SqliteBodyZoneRepository(database, makeUuidFactory("zone"));
      const retired = await repository.retire("cou");
      expect(retired.status).toBe("OK");
      if (retired.status === "OK") {
        expect(retired.value.isActive).toBe(false);
      }
    });

    it("returns NOT_FOUND for an unknown identifier", async () => {
      const repository = new SqliteBodyZoneRepository(database, makeUuidFactory("zone"));
      expect(await repository.retire("unknown")).toEqual({ status: "NOT_FOUND" });
    });
  });

  describe("isUsed (§4.10 L135 — differentiated deletion message)", () => {
    it("is false for a Zone referenced by no Activity", async () => {
      const repository = new SqliteBodyZoneRepository(database, makeUuidFactory("zone"));
      expect(await repository.isUsed("cou")).toBe(false);
    });

    it("is true once a Catalogue Exercise references the Zone (activity_definition_body_zones)", async () => {
      await database.runAsync(
        `INSERT INTO activity_definitions (
          id, name, description, execution_mode, duration_seconds, repetition_count,
          series_count, pause_seconds, side_mode, created_at, updated_at
        ) VALUES ('def-1', 'Squat', NULL, 'DURATION', 30, NULL, 3, 10, 'UNILATERAL', 'now', 'now')`,
      );
      await database.runAsync(
        "INSERT INTO activity_definition_body_zones (activity_definition_id, body_zone_id) VALUES ('def-1', 'cou')",
      );
      const repository = new SqliteBodyZoneRepository(database, makeUuidFactory("zone"));
      expect(await repository.isUsed("cou")).toBe(true);
    });
  });
});
