import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteLabelRepository } from "@/infrastructure/database/repositories/SqliteLabelRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

function makeUuidFactory(prefix: string) {
  let counter = 0;
  return () => `${prefix}-${(counter += 1)}`;
}

describe("SqliteLabelRepository", () => {
  let database: NodeSqliteDatabase;

  beforeEach(async () => {
    database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database);
  });

  afterEach(() => {
    database.close();
  });

  it("starts empty on a fresh installation", async () => {
    const repository = new SqliteLabelRepository(database);
    expect(await repository.listAll()).toEqual([]);
  });

  it("lists persisted labels ordered by createdAt ascending, active and retired confounded", async () => {
    await database.runAsync(
      `INSERT INTO labels (id, name, canonical_key, color, is_active, created_at) VALUES
        ('focus', 'Focus', 'focus', '#3B82F6', 1, '2026-01-01T00:00:00.000Z'),
        ('legacy', 'Ancienne', 'ancienne', '#8E8E93', 0, '2026-01-02T00:00:00.000Z')`,
    );

    const repository = new SqliteLabelRepository(database);
    const labels = await repository.listAll();

    expect(labels.map((label) => label.id)).toEqual(["focus", "legacy"]);
    expect(labels[0]).toMatchObject({ name: "Focus", canonicalKey: "focus", color: "#3B82F6", isActive: true });
    expect(labels[1]).toMatchObject({ name: "Ancienne", canonicalKey: "ancienne", color: "#8E8E93", isActive: false });
  });

  describe("create (V2-PRE-2, D2 reactivation)", () => {
    it("creates a new active Label with the chosen color", async () => {
      const repository = new SqliteLabelRepository(database, makeUuidFactory("label"));
      const result = await repository.create({ name: "Focus", color: "#3B82F6" });

      expect(result.status).toBe("OK");
      if (result.status === "OK") {
        expect(result.value).toMatchObject({ name: "Focus", canonicalKey: "focus", color: "#3B82F6", isActive: true });
      }
    });

    it("refuses a name whose canonical key matches an ACTIVE Label (DUPLICATE)", async () => {
      const repository = new SqliteLabelRepository(database, makeUuidFactory("label"));
      await repository.create({ name: "Focus", color: "#3B82F6" });

      const result = await repository.create({ name: "  focus  ", color: "#E5484D" });
      expect(result).toEqual({ status: "DUPLICATE" });
    });

    it("reactivates a RETIRED Label of the same canonical key — same identifier, chosen color applied", async () => {
      const repository = new SqliteLabelRepository(database, makeUuidFactory("label"));
      const created = await repository.create({ name: "Focus", color: "#3B82F6" });
      if (created.status !== "OK") throw new Error("expected OK");
      await repository.retire(created.value.id);

      const reactivated = await repository.create({ name: "Focus", color: "#E5484D" });
      expect(reactivated.status).toBe("OK");
      if (reactivated.status === "OK") {
        expect(reactivated.value.id).toBe(created.value.id);
        expect(reactivated.value.isActive).toBe(true);
        expect(reactivated.value.color).toBe("#E5484D");
      }

      const all = await repository.listAll();
      expect(all).toHaveLength(1);
    });

    it("keeps a reactivated Label's existing Session associations (same id, never a new row)", async () => {
      const repository = new SqliteLabelRepository(database, makeUuidFactory("label"));
      const created = await repository.create({ name: "Focus", color: "#3B82F6" });
      if (created.status !== "OK") throw new Error("expected OK");
      await database.runAsync(
        `INSERT INTO sessions (id, owner_id, name, label_id, status, initial_countdown_seconds, final_phase_seconds, created_at, updated_at)
         SELECT 'session-a', id, 'Séance', ?, 'ACTIVE', 10, 5, 'now', 'now' FROM users WHERE singleton_key = 1`,
        [created.value.id],
      );
      await repository.retire(created.value.id);

      await repository.create({ name: "Focus", color: "#E5484D" });

      const session = await database.getFirstAsync<{ label_id: string }>(
        "SELECT label_id FROM sessions WHERE id = 'session-a'",
      );
      expect(session?.label_id).toBe(created.value.id);
    });
  });

  describe("rename", () => {
    it("renames without changing the identifier", async () => {
      const repository = new SqliteLabelRepository(database, makeUuidFactory("label"));
      const created = await repository.create({ name: "Focus", color: "#3B82F6" });
      if (created.status !== "OK") throw new Error("expected OK");

      const renamed = await repository.rename(created.value.id, "Concentration");
      expect(renamed).toEqual({
        status: "OK",
        value: { id: created.value.id, name: "Concentration", canonicalKey: "concentration", color: "#3B82F6", isActive: true, createdAt: created.value.createdAt },
      });
    });

    it("refuses a rename that collides with another ACTIVE Label", async () => {
      const repository = new SqliteLabelRepository(database, makeUuidFactory("label"));
      const a = await repository.create({ name: "Focus", color: "#3B82F6" });
      const b = await repository.create({ name: "Calme", color: "#E5484D" });
      if (a.status !== "OK" || b.status !== "OK") throw new Error("expected OK");

      const result = await repository.rename(b.value.id, "Focus");
      expect(result).toEqual({ status: "DUPLICATE" });
    });

    it("returns NOT_FOUND for an unknown identifier", async () => {
      const repository = new SqliteLabelRepository(database, makeUuidFactory("label"));
      expect(await repository.rename("unknown", "X")).toEqual({ status: "NOT_FOUND" });
    });
  });

  describe("recolor", () => {
    it("changes the color without changing the identifier or the name", async () => {
      const repository = new SqliteLabelRepository(database, makeUuidFactory("label"));
      const created = await repository.create({ name: "Focus", color: "#3B82F6" });
      if (created.status !== "OK") throw new Error("expected OK");

      const recolored = await repository.recolor(created.value.id, "#E5484D");
      expect(recolored).toEqual({ status: "OK", value: { ...created.value, color: "#E5484D" } });
    });

    it("returns NOT_FOUND for an unknown identifier", async () => {
      const repository = new SqliteLabelRepository(database, makeUuidFactory("label"));
      expect(await repository.recolor("unknown", "#E5484D")).toEqual({ status: "NOT_FOUND" });
    });
  });

  describe("retire", () => {
    it("retires logically — the Label remains listed but inactive", async () => {
      const repository = new SqliteLabelRepository(database, makeUuidFactory("label"));
      const created = await repository.create({ name: "Focus", color: "#3B82F6" });
      if (created.status !== "OK") throw new Error("expected OK");

      const retired = await repository.retire(created.value.id);
      expect(retired).toEqual({ status: "OK", value: { ...created.value, isActive: false } });

      const all = await repository.listAll();
      expect(all.find((label) => label.id === created.value.id)?.isActive).toBe(false);
    });

    it("returns NOT_FOUND for an unknown identifier", async () => {
      const repository = new SqliteLabelRepository(database, makeUuidFactory("label"));
      expect(await repository.retire("unknown")).toEqual({ status: "NOT_FOUND" });
    });
  });

  describe("isUsed (§4.10 L135 — differentiated deletion message)", () => {
    it("is false for a Label referenced by no Session", async () => {
      const repository = new SqliteLabelRepository(database, makeUuidFactory("label"));
      const created = await repository.create({ name: "Focus", color: "#3B82F6" });
      if (created.status !== "OK") throw new Error("expected OK");
      expect(await repository.isUsed(created.value.id)).toBe(false);
    });

    it("is true once a Session references the Label", async () => {
      const repository = new SqliteLabelRepository(database, makeUuidFactory("label"));
      const created = await repository.create({ name: "Focus", color: "#3B82F6" });
      if (created.status !== "OK") throw new Error("expected OK");
      await database.runAsync(
        `INSERT INTO sessions (id, owner_id, name, label_id, status, initial_countdown_seconds, final_phase_seconds, created_at, updated_at)
         SELECT 'session-a', id, 'Séance', ?, 'ACTIVE', 10, 5, 'now', 'now' FROM users WHERE singleton_key = 1`,
        [created.value.id],
      );
      expect(await repository.isUsed(created.value.id)).toBe(true);
    });
  });
});
