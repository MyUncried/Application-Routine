import { describe, expect, it } from "@jest/globals";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { EVERY_TIME, type Routine } from "@/domain/planning/Routine";
import { PlanningService } from "@/features/planning/PlanningService";
import { DATABASE_VERSION } from "@/infrastructure/database/constants";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteRoutineRepository } from "@/infrastructure/database/repositories/SqliteRoutineRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * Planification — migration 031 et persistance des Routines : tables additives, écriture entière, liste ordonnée,
 * retraits, suppression en cascade des entrées, conservation après fermeture et réouverture de la base.
 */

const weekly: Routine = {
  id: "r1",
  name: "Parcours du matin",
  startDate: "2026-08-03",
  time: "08:00",
  repetition: { unit: "WEEK", every: 2, weekdays: [1, 4], end: { kind: "UNTIL", date: "2026-08-23" } },
  entries: [
    { id: "e1", sessionId: "s-b", frequency: EVERY_TIME },
    { id: "e2", sessionId: "s-a", frequency: { x: 2, n: 3, positions: [1, 3] } },
  ],
  exclusions: [],
  reminderMinutes: 30,
  createdAt: "2026-08-01T10:00:00.000Z",
  updatedAt: "2026-08-01T10:00:00.000Z",
};

describe("migration031 — Routines", () => {
  it("depuis la version 30 : trois tables additives, version 31", async () => {
    const database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database, undefined, 30);
    const before = await database.getAllAsync<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table'");
    await migrateDatabase(database);
    expect(DATABASE_VERSION).toBe(42);
    expect(await database.getFirstAsync("PRAGMA user_version")).toEqual({ user_version: 42 });
    const after = await database.getAllAsync<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name");
    // Jusqu'à la version courante : la 033 ajoute le lien occurrence ↔ Exécution, la 034 les occurrences enregistrées.
    expect(after.map((row) => row.name).filter((name) => !before.some((row) => row.name === name))).toEqual([
      "account_lifecycle",
      "account_link",
      "occurrence_executions",
      "programs",
      "routine_entries",
      "routine_exclusions",
      "routine_occurrences",
      "routines",
      "user_privacy",
    ]);
  });

  it("refuse une répétition incomplète ou une borne incohérente", async () => {
    const database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database);
    const owner = await database.getFirstAsync<{ id: string }>("SELECT id FROM users");
    const insert = (unit: string | null, every: number | null, endKind: string | null, endDate: string | null, endCount: number | null) =>
      database.runAsync(
        `INSERT INTO routines (id, owner_id, start_date, start_time, repeat_unit, repeat_every, end_kind, end_date, end_count, created_at, updated_at)
         VALUES (lower(hex(randomblob(8))), ?, '2026-08-03', '08:00', ?, ?, ?, ?, ?, 't', 't')`,
        [owner!.id, unit, every, endKind, endDate, endCount],
      );
    await expect(insert(null, null, null, null, null)).resolves.toBeDefined();
    await expect(insert("WEEK", 1, "UNTIL", "2026-08-30", null)).resolves.toBeDefined();
    await expect(insert("WEEK", null, "UNTIL", "2026-08-30", null)).rejects.toThrow();
    await expect(insert("WEEK", 1, "FOR", "2026-08-30", 3)).rejects.toThrow();
    await expect(insert("HOUR", 1, "FOR", null, 3)).rejects.toThrow();
  });
});

describe("SqliteRoutineRepository", () => {
  it("écrit et relit la Routine entière, liste dans l'ordre, motifs compris", async () => {
    const database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database);
    const repository = new SqliteRoutineRepository(database);
    await repository.save(weekly);
    expect(await repository.get("r1")).toEqual(weekly);
    expect(await repository.list()).toEqual([weekly]);
  });

  it("modifier remplace la liste ; retirer une occurrence est persisté ; supprimer retire entrées et retraits", async () => {
    const database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database);
    const repository = new SqliteRoutineRepository(database);
    await repository.save(weekly);
    expect(await repository.addExclusion("r1", "2026-08-06T08:00", "2026-08-02T00:00:00.000Z")).toBe(true);
    expect(await repository.addExclusion("r1", "2026-08-06T08:00", "2026-08-02T00:00:00.000Z")).toBe(true);
    expect((await repository.get("r1"))?.exclusions).toEqual(["2026-08-06T08:00"]);
    const updated: Routine = { ...weekly, entries: [weekly.entries[1]!], exclusions: ["2026-08-06T08:00"], time: "09:15" };
    await repository.save(updated);
    expect(await repository.get("r1")).toEqual(updated);
    expect(await repository.delete("r1")).toBe(true);
    expect(await repository.get("r1")).toBeNull();
    expect(await database.getFirstAsync("SELECT COUNT(*) AS count FROM routine_entries")).toEqual({ count: 0 });
    expect(await database.getFirstAsync("SELECT COUNT(*) AS count FROM routine_exclusions")).toEqual({ count: 0 });
    expect(await repository.addExclusion("r1", "2026-08-06T08:00", "t")).toBe(false);
  });

  it("réouverture de l'application : les planifications et leurs occurrences sont conservées", async () => {
    const directory = mkdtempSync(join(tmpdir(), "kodjo-planning-"));
    const path = join(directory, "kodjo.db");
    try {
      let ids = 0;
      const first = NodeSqliteDatabase.openFile(path);
      await migrateDatabase(first);
      const service = new PlanningService({
        repository: new SqliteRoutineRepository(first),
        newId: () => `id-${++ids}`,
        now: () => new Date(2026, 7, 1, 12, 0),
      });
      const saved = await service.createRoutine({
        name: "Matin",
        startDate: "2026-08-03",
        time: "08:00",
        repetition: { unit: "WEEK", every: 1, weekdays: [1, 4], end: { kind: "UNTIL", date: "2026-08-31" } },
        entries: [{ id: "entry", sessionId: "s1", frequency: EVERY_TIME }],
      });
      expect(saved.status).toBe("SAVED");
      await service.excludeOccurrence("id-1", "2026-08-13T08:00");
      first.close();

      const reopened = NodeSqliteDatabase.openFile(path);
      await migrateDatabase(reopened);
      const again = new PlanningService({
        repository: new SqliteRoutineRepository(reopened),
        newId: () => "unused",
        now: () => new Date(2026, 7, 1, 12, 0),
      });
      const week = await again.weekOccurrences("2026-08-12", () => true);
      expect(week.map((o) => `${o.date} ${o.time}`)).toEqual(["2026-08-10 08:00"]);
      reopened.close();
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
