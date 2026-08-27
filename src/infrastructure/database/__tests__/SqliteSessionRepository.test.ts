import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import * as Crypto from "expo-crypto";
import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { SessionValidationError } from "@/domain/sessions/errors";
import { DEFAULT_SESSION_COLOR } from "@/domain/sessions/Session";
import type { Database, SqlParameters } from "@/infrastructure/database/Database";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import {
  mapSessionRow,
  SqliteSessionRepository,
} from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import type { SessionAggregateRow } from "@/infrastructure/database/types/DatabaseRows";

jest.mock("expo-crypto", () => ({ randomUUID: jest.fn() }));

const IDS = [
  "10000000-0000-4000-8000-000000000001",
  "10000000-0000-4000-8000-000000000002",
  "10000000-0000-4000-8000-000000000003",
  "10000000-0000-4000-8000-000000000004",
];

const SECOND_IDS = [
  "20000000-0000-4000-8000-000000000001",
  "20000000-0000-4000-8000-000000000002",
  "20000000-0000-4000-8000-000000000003",
  "20000000-0000-4000-8000-000000000004",
];

const THIRD_IDS = [
  "30000000-0000-4000-8000-000000000001",
  "30000000-0000-4000-8000-000000000002",
  "30000000-0000-4000-8000-000000000003",
  "30000000-0000-4000-8000-000000000004",
];

describe("SqliteSessionRepository", () => {
  let database: NodeSqliteDatabase;

  beforeEach(async () => {
    database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database);
  });

  afterEach(() => {
    database.close();
  });

  it("creates, reads and lists the exact T01-S01 aggregate", async () => {
    const repository = new SqliteSessionRepository(database, uuidFactory());
    const created = await repository.create(validInput());
    const reopened = await repository.findById(created.id);
    const summaries = await repository.listActive();

    expect(created.id).toBe(IDS[0]);
    expect(created.cycle.id).toBe(IDS[1]);
    expect(created.cycle.tour.id).toBe(IDS[2]);
    expect(created.cycle.tour.exercise).toMatchObject({
      id: IDS[3],
      type: "EXERCISE",
      executionMode: "DURATION",
      structuralPosition: "IN_TOUR",
      position: 0,
      durationSeconds: 30,
      repetitionCount: null,
      seriesCount: 1,
      pauseSeconds: 0,
    });
    expect(reopened).toEqual(created);
    expect(summaries).toEqual([
      expect.objectContaining({
        id: created.id,
        activityCount: 1,
        estimatedDurationSeconds: 45,
        tourRepeatCount: 1,
      }),
    ]);
  });

  it("persists the exact T01 structural literals via bound parameters after the FIXED_* refactor", async () => {
    const repository = new SqliteSessionRepository(database, uuidFactory());
    const created = await repository.create(validInput());

    const cycleRow = await database.getFirstAsync<{ position: number; repeat_count: number }>(
      "SELECT position, repeat_count FROM cycles WHERE session_id = ?",
      [created.id],
    );
    const tourRow = await database.getFirstAsync<{ position: number; repeat_count: number }>(
      "SELECT position, repeat_count FROM tours WHERE session_id = ?",
      [created.id],
    );
    const activityRow = await database.getFirstAsync<{
      structural_position: string;
      position: number;
      series_count: number;
      pause_seconds: number;
    }>(
      "SELECT structural_position, position, series_count, pause_seconds FROM activities WHERE session_id = ?",
      [created.id],
    );

    expect(cycleRow).toEqual({ position: 1, repeat_count: 1 });
    expect(tourRow).toEqual({ position: 1, repeat_count: 1 });
    expect(activityRow).toEqual({
      structural_position: "IN_TOUR",
      position: 0,
      series_count: 1,
      pause_seconds: 0,
    });
  });

  it("uses Crypto.randomUUID for all aggregate identifiers by default", async () => {
    jest.mocked(Crypto.randomUUID).mockImplementation(uuidFactory());
    const repository = new SqliteSessionRepository(database);

    const created = await repository.create(validInput());

    expect(Crypto.randomUUID).toHaveBeenCalledTimes(4);
    expect([
      created.id,
      created.cycle.id,
      created.cycle.tour.id,
      created.cycle.tour.exercise.id,
    ]).toEqual(IDS);
  });

  it("rejects incomplete or out-of-contract input before persistence with a structured SessionValidationError", async () => {
    const repository = new SqliteSessionRepository(database, uuidFactory());

    await expect(repository.create({ ...validInput(), name: "   " })).rejects.toBeInstanceOf(
      SessionValidationError,
    );
    await expect(
      repository.create({
        ...validInput(),
        exercise: { name: "Exercice", durationSeconds: 0 },
      }),
    ).rejects.toBeInstanceOf(SessionValidationError);

    const count = await database.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) AS count FROM sessions",
    );
    expect(count?.count).toBe(0);
  });

  it("exposes the exact violations (code + field) on SessionValidationError, without any message text", async () => {
    const repository = new SqliteSessionRepository(database, uuidFactory());

    try {
      await repository.create({ ...validInput(), name: "   " });
      throw new Error("expected repository.create to reject");
    } catch (error) {
      expect(error).toBeInstanceOf(SessionValidationError);
      expect((error as SessionValidationError).violations).toEqual([
        { code: "REQUIRED", field: "session.name" },
      ]);
    }
  });

  it("validates any CreateSessionInput it receives directly, with no way to bypass validation", async () => {
    const repository = new SqliteSessionRepository(database, uuidFactory());

    // No draft, no toCreateSessionInput involved: an invalid CreateSessionInput
    // built by hand is still rejected before any SQL write, because the
    // Repository revalidates every input independently of its origin.
    const handCraftedInvalidInput = {
      name: "Nom valide",
      color: "#000000" as never,
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      exercise: { name: "Exercice", durationSeconds: 30 },
    };

    await expect(repository.create(handCraftedInvalidInput)).rejects.toBeInstanceOf(
      SessionValidationError,
    );

    const count = await database.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) AS count FROM sessions",
    );
    expect(count?.count).toBe(0);
  });

  it("rolls the whole aggregate back when activity insertion fails", async () => {
    const failingDatabase = new FailingActivityInsertDatabase(database);
    const repository = new SqliteSessionRepository(failingDatabase, uuidFactory());

    await expect(repository.create(validInput())).rejects.toThrow("forced activity failure");

    for (const table of ["sessions", "cycles", "tours", "activities"]) {
      const row = await database.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) AS count FROM ${table}`,
      );
      expect(row?.count).toBe(0);
    }
  });

  it("rejects an incoherent persisted row during mapping", () => {
    const incoherentRow = {
      ...validRow(),
      repetition_count: 5,
    } as unknown as SessionAggregateRow;
    expect(() => mapSessionRow(incoherentRow)).toThrow("does not satisfy");
  });

  it("rejects a row whose session status is ARCHIVED, expressible without a cast now that the type allows it", () => {
    // SessionAggregateRow.status is "ACTIVE" | "ARCHIVED": this literal
    // assigns directly, no `as unknown as SessionAggregateRow` needed.
    const archivedRow: SessionAggregateRow = { ...validRow(), status: "ARCHIVED" };
    expect(() => mapSessionRow(archivedRow)).toThrow("does not satisfy");
  });

  describe("update", () => {
    it("updates all modifiable fields in place, preserving identifiers/owner/createdAt and renewing updatedAt", async () => {
      const clock = fixedClock(["2026-01-01T00:00:00.000Z", "2026-02-01T00:00:00.000Z"]);
      const repository = new SqliteSessionRepository(database, uuidFactory(), clock);
      const created = await repository.create(validInput());

      const outcome = await repository.update(created.id, {
        name: "Nom modifié",
        color: "#5A5BD7",
        initialCountdownSeconds: 15,
        finalPhaseSeconds: 8,
        exercise: { name: "Exercice modifié", durationSeconds: 45, instruction: "Nouvelle consigne" },
      });

      expect(outcome.status).toBe("UPDATED");
      if (outcome.status !== "UPDATED") {
        throw new Error("expected update() to report UPDATED");
      }
      const updated = outcome.session;

      // Identifiants strictement préservés.
      expect(updated.id).toBe(created.id);
      expect(updated.cycle.id).toBe(created.cycle.id);
      expect(updated.cycle.tour.id).toBe(created.cycle.tour.id);
      expect(updated.cycle.tour.exercise.id).toBe(created.cycle.tour.exercise.id);
      expect(updated.ownerId).toBe(created.ownerId);
      expect(updated.createdAt).toBe(created.createdAt);

      // updatedAt renouvelé, via l'horloge injectée (déterministe).
      expect(updated.updatedAt).toBe("2026-02-01T00:00:00.000Z");
      expect(updated.updatedAt).not.toBe(created.updatedAt);

      // Tous les champs modifiables ont bien été appliqués.
      expect(updated.name).toBe("Nom modifié");
      expect(updated.color).toBe("#5A5BD7");
      expect(updated.initialCountdownSeconds).toBe(15);
      expect(updated.finalPhaseSeconds).toBe(8);
      expect(updated.cycle.tour.exercise.name).toBe("Exercice modifié");
      expect(updated.cycle.tour.exercise.durationSeconds).toBe(45);
      expect(updated.cycle.tour.exercise.instruction).toBe("Nouvelle consigne");
    });

    it("targets only the exact activity row by id and session_id, leaving another session's activity untouched", async () => {
      const repository = new SqliteSessionRepository(database, uuidFactory());
      const sessionA = await repository.create(validInput());

      const secondRepository = new SqliteSessionRepository(database, secondUuidFactory());
      const sessionB = await secondRepository.create({ ...validInput(), name: "Séance B" });

      await repository.update(sessionA.id, { ...validInput(), name: "A modifiée" });

      const stillB = await repository.findById(sessionB.id);
      expect(stillB?.name).toBe("Séance B");
      expect(stillB?.cycle.tour.exercise.name).toBe("Gainage");
      expect(stillB?.id).toBe(sessionB.id);
    });

    it("returns NOT_FOUND and performs no write, no implicit creation, for an unknown id", async () => {
      const repository = new SqliteSessionRepository(database, uuidFactory());

      const outcome = await repository.update("00000000-0000-4000-8000-000000000099", validInput());

      expect(outcome).toEqual({ status: "NOT_FOUND" });
      const count = await database.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) AS count FROM sessions",
      );
      expect(count?.count).toBe(0);
    });

    it("returns ARCHIVED and performs no write for a session archived via direct SQL (no archiving feature exists in code)", async () => {
      const repository = new SqliteSessionRepository(database, uuidFactory());
      const created = await repository.create(validInput());

      await database.runAsync("UPDATE sessions SET status = 'ARCHIVED', archived_at = ? WHERE id = ?", [
        "2026-01-02T00:00:00.000Z",
        created.id,
      ]);

      const outcome = await repository.update(created.id, {
        ...validInput(),
        name: "Tentative de modification",
      });

      expect(outcome).toEqual({ status: "ARCHIVED" });
      const row = await database.getFirstAsync<{ name: string; updated_at: string }>(
        "SELECT name, updated_at FROM sessions WHERE id = ?",
        [created.id],
      );
      expect(row?.name).toBe("Séance simple");
      expect(row?.updated_at).toBe(created.updatedAt);
    });

    it("rejects invalid input via SessionValidationError before any write (defense in depth)", async () => {
      const repository = new SqliteSessionRepository(database, uuidFactory());
      const created = await repository.create(validInput());

      await expect(
        repository.update(created.id, { ...validInput(), name: "   " }),
      ).rejects.toBeInstanceOf(SessionValidationError);

      const row = await database.getFirstAsync<{ name: string; updated_at: string }>(
        "SELECT name, updated_at FROM sessions WHERE id = ?",
        [created.id],
      );
      expect(row?.name).toBe("Séance simple");
      expect(row?.updated_at).toBe(created.updatedAt);
    });

    it("rolls the whole update back when the activity update fails after the session update already ran", async () => {
      const repository = new SqliteSessionRepository(database, uuidFactory());
      const created = await repository.create(validInput());

      const failingDatabase = new FailingActivityUpdateDatabase(database);
      const failingRepository = new SqliteSessionRepository(failingDatabase, uuidFactory());

      await expect(
        failingRepository.update(created.id, { ...validInput(), name: "Nom modifié" }),
      ).rejects.toThrow("forced activity update failure");

      const reread = await repository.findById(created.id);
      expect(reread?.name).toBe("Séance simple");
      expect(reread?.updatedAt).toBe(created.updatedAt);
    });

    it("rolls back completely when the final reread is incoherent, without leaving a partial write", async () => {
      const repository = new SqliteSessionRepository(database, uuidFactory());
      const created = await repository.create(validInput());

      const tamperingDatabase = new IncoherentRereadDatabase(database);
      const tamperingRepository = new SqliteSessionRepository(tamperingDatabase, uuidFactory());

      await expect(
        tamperingRepository.update(created.id, { ...validInput(), name: "Nom modifié" }),
      ).rejects.toThrow("could not be read back coherently");

      const reread = await repository.findById(created.id);
      expect(reread?.name).toBe("Séance simple");
      expect(reread?.updatedAt).toBe(created.updatedAt);
    });

    it("persists an update durably across a connection close and reopen (real SQLite file)", async () => {
      const filePath = path.join(os.tmpdir(), `kodjo-t01s04-${randomUUID()}.db`);
      let writer: NodeSqliteDatabase | undefined;
      let reader: NodeSqliteDatabase | undefined;

      try {
        writer = NodeSqliteDatabase.openFile(filePath);
        await migrateDatabase(writer);
        const repository = new SqliteSessionRepository(writer, uuidFactory());
        const created = await repository.create(validInput());

        const outcome = await repository.update(created.id, {
          ...validInput(),
          name: "Nom modifié sur fichier",
        });
        expect(outcome.status).toBe("UPDATED");

        writer.close();
        writer = undefined;

        reader = NodeSqliteDatabase.openFile(filePath);
        const rereadRepository = new SqliteSessionRepository(reader);
        const reread = await rereadRepository.findById(created.id);

        expect(reread?.id).toBe(created.id);
        expect(reread?.name).toBe("Nom modifié sur fichier");

        reader.close();
        reader = undefined;
      } finally {
        try {
          writer?.close();
        } catch {
          // Déjà fermée ou jamais ouverte : sans conséquence pour le nettoyage.
        }
        try {
          reader?.close();
        } catch {
          // Déjà fermée ou jamais ouverte : sans conséquence pour le nettoyage.
        }
        fs.rmSync(filePath, { force: true });
      }
    });
  });

  // T01-S06 : couverture ajoutée pour la Séance simple, sans modifier le
  // contrat ni le code de production (`listActive()` — SqliteSessionRepository.ts —
  // reste inchangé ; ces tests prouvent seulement ce qu'il fait déjà).
  describe("listActive", () => {
    it("excludes a session archived directly via SQL (no archiving feature exists in code)", async () => {
      const repository = new SqliteSessionRepository(database, uuidFactory());
      const active = await repository.create(validInput());

      const secondRepository = new SqliteSessionRepository(database, secondUuidFactory());
      const archived = await secondRepository.create({ ...validInput(), name: "À archiver" });
      await database.runAsync(
        "UPDATE sessions SET status = 'ARCHIVED', archived_at = ? WHERE id = ?",
        ["2026-01-02T00:00:00.000Z", archived.id],
      );

      const summaries = await repository.listActive();

      expect(summaries.map((summary) => summary.id)).toEqual([active.id]);
      expect(summaries.some((summary) => summary.id === archived.id)).toBe(false);
    });

    it("sorts by COALESCE(last_executed_at, updated_at) DESC independently of insertion order", async () => {
      // Trois Séances, délibérément insérées dans un ordre qui ne
      // correspond ni à l'ordre attendu du résultat ni à son inverse :
      //
      //   ordre d'insertion : oldest, mostRecent, middle
      //   ordre attendu (DESC sur COALESCE) : mostRecent, middle, oldest
      //
      // Si `listActive()` restituait simplement les lignes dans leur ordre
      // d'insertion (ou son inverse, ce que certains moteurs font sans
      // `ORDER BY` explicite), ce test échouerait : les deux permutations
      // sont distinctes de l'ordre attendu. Seul un tri réellement fondé
      // sur `COALESCE(last_executed_at, updated_at) DESC` peut le
      // satisfaire.

      // 1ʳᵉ Séance insérée : jamais exécutée, repli sur `updated_at`
      // (2026-01-01) — clé de tri la plus ancienne des trois, doit finir
      // EN DERNIER dans le résultat.
      const clockOldest = fixedClock(["2026-01-01T00:00:00.000Z"]);
      const repositoryOldest = new SqliteSessionRepository(database, uuidFactory(), clockOldest);
      const sessionOldest = await repositoryOldest.create({
        ...validInput(),
        name: "Jamais exécutée",
      });

      // 2ᵉ Séance insérée : `updated_at` volontairement ancien (2026-01-02)
      // mais `last_executed_at` posé directement en SQL au 2026-01-30 — la
      // clé de tri la plus récente des trois, doit finir EN PREMIER. Si le
      // tri ignorait `last_executed_at`, cette Séance apparaîtrait en
      // dernier (son `updated_at` est le plus ancien) : le résultat attendu
      // ne peut donc être obtenu qu'en utilisant réellement
      // `last_executed_at` lorsqu'il existe.
      const clockMostRecent = fixedClock(["2026-01-02T00:00:00.000Z"]);
      const repositoryMostRecent = new SqliteSessionRepository(
        database,
        secondUuidFactory(),
        clockMostRecent,
      );
      const sessionMostRecent = await repositoryMostRecent.create({
        ...validInput(),
        name: "Exécutée très récemment",
      });
      await database.runAsync("UPDATE sessions SET last_executed_at = ? WHERE id = ?", [
        "2026-01-30T00:00:00.000Z",
        sessionMostRecent.id,
      ]);

      // 3ᵉ Séance insérée : `updated_at` = 2026-01-03, `last_executed_at`
      // posé directement en SQL au 2026-01-15 — clé de tri intermédiaire,
      // doit finir AU MILIEU.
      const clockMiddle = fixedClock(["2026-01-03T00:00:00.000Z"]);
      const repositoryMiddle = new SqliteSessionRepository(
        database,
        thirdUuidFactory(),
        clockMiddle,
      );
      const sessionMiddle = await repositoryMiddle.create({
        ...validInput(),
        name: "Exécutée il y a deux semaines",
      });
      await database.runAsync("UPDATE sessions SET last_executed_at = ? WHERE id = ?", [
        "2026-01-15T00:00:00.000Z",
        sessionMiddle.id,
      ]);

      const summaries = await repositoryOldest.listActive();

      expect(summaries.map((summary) => summary.id)).toEqual([
        sessionMostRecent.id,
        sessionMiddle.id,
        sessionOldest.id,
      ]);
    });
  });
});

function validInput() {
  return {
    name: "Séance simple",
    color: DEFAULT_SESSION_COLOR,
    initialCountdownSeconds: 10,
    finalPhaseSeconds: 5,
    exercise: { name: "Gainage", durationSeconds: 30 },
  };
}

function uuidFactory(): () => string {
  let index = 0;
  return () => IDS[index++];
}

function secondUuidFactory(): () => string {
  let index = 0;
  return () => SECOND_IDS[index++];
}

function thirdUuidFactory(): () => string {
  let index = 0;
  return () => THIRD_IDS[index++];
}

/** Horloge factice déterministe : renvoie les horodatages fournis, dans l'ordre, un par appel. */
function fixedClock(timestamps: readonly string[]): () => string {
  let index = 0;
  return () => timestamps[index++];
}

class FailingActivityInsertDatabase implements Database {
  constructor(private readonly delegate: Database) {}

  execAsync = (source: string) => this.delegate.execAsync(source);
  getFirstAsync = <T>(source: string, parameters = []) =>
    this.delegate.getFirstAsync<T>(source, parameters);
  getAllAsync = <T>(source: string, parameters = []) =>
    this.delegate.getAllAsync<T>(source, parameters);

  runAsync(source: string, parameters = []) {
    if (source.includes("INSERT INTO activities")) {
      return Promise.reject(new Error("forced activity failure"));
    }
    return this.delegate.runAsync(source, parameters);
  }

  withExclusiveTransactionAsync(task: (transaction: Database) => Promise<void>) {
    return this.delegate.withExclusiveTransactionAsync((transaction) =>
      task(new FailingActivityInsertDatabase(transaction)),
    );
  }
}

/** Fait échouer le second `UPDATE` (`activities`) d'`update()`, après que le premier (`sessions`) a déjà réussi — pour prouver le rollback complet. */
class FailingActivityUpdateDatabase implements Database {
  constructor(private readonly delegate: Database) {}

  execAsync = (source: string) => this.delegate.execAsync(source);
  getFirstAsync = <T>(source: string, parameters = []) =>
    this.delegate.getFirstAsync<T>(source, parameters);
  getAllAsync = <T>(source: string, parameters = []) =>
    this.delegate.getAllAsync<T>(source, parameters);

  runAsync(source: string, parameters = []) {
    if (source.includes("UPDATE activities")) {
      return Promise.reject(new Error("forced activity update failure"));
    }
    return this.delegate.runAsync(source, parameters);
  }

  withExclusiveTransactionAsync(task: (transaction: Database) => Promise<void>) {
    return this.delegate.withExclusiveTransactionAsync((transaction) =>
      task(new FailingActivityUpdateDatabase(transaction)),
    );
  }
}

/**
 * Laisse les écritures réelles s'exécuter contre la vraie base, mais
 * intercepte précisément la **seconde** relecture de l'agrégat (celle qui
 * suit les deux `UPDATE` dans `SqliteSessionRepository.update`) pour la
 * faire paraître incohérente. Le premier appel (lecture avant écriture)
 * n'est jamais altéré. Sert à prouver que le Repository lève réellement à
 * l'intérieur de la transaction et déclenche un `ROLLBACK` réel sur la
 * vraie base — ce n'est pas un faux Repository qui contournerait la
 * transaction SQLite.
 */
class IncoherentRereadDatabase implements Database {
  private aggregateQueryCalls = 0;

  constructor(private readonly delegate: Database) {}

  execAsync = (source: string) => this.delegate.execAsync(source);
  getAllAsync = <T>(source: string, parameters: SqlParameters = []) =>
    this.delegate.getAllAsync<T>(source, parameters);
  runAsync = (source: string, parameters: SqlParameters = []) =>
    this.delegate.runAsync(source, parameters);

  async getFirstAsync<T>(source: string, parameters: SqlParameters = []): Promise<T | null> {
    const result = await this.delegate.getFirstAsync<T>(source, parameters);
    const isAggregateQuery =
      source.includes("FROM sessions") && source.includes("activities.instruction");
    if (!isAggregateQuery || !result) {
      return result;
    }

    this.aggregateQueryCalls += 1;
    if (this.aggregateQueryCalls !== 2) {
      return result;
    }

    return {
      ...(result as unknown as Record<string, unknown>),
      activity_id: "tampered-activity-id",
    } as T;
  }

  withExclusiveTransactionAsync(task: (transaction: Database) => Promise<void>) {
    return this.delegate.withExclusiveTransactionAsync((transaction) =>
      task(new IncoherentRereadDatabase(transaction)),
    );
  }
}

function validRow(): SessionAggregateRow {
  return {
    session_id: IDS[0],
    owner_id: "usr_test",
    session_name: "Séance",
    color: DEFAULT_SESSION_COLOR,
    status: "ACTIVE",
    initial_countdown_seconds: 10,
    final_phase_seconds: 5,
    session_created_at: "2026-01-01T00:00:00.000Z",
    session_updated_at: "2026-01-01T00:00:00.000Z",
    cycle_id: IDS[1],
    cycle_position: 1,
    cycle_repeat_count: 1,
    tour_id: IDS[2],
    tour_position: 1,
    tour_repeat_count: 1,
    activity_id: IDS[3],
    activity_name: "Gainage",
    structural_position: "IN_TOUR",
    activity_position: 0,
    execution_mode: "DURATION",
    duration_seconds: 30,
    repetition_count: null,
    series_count: 1,
    pause_seconds: 0,
    instruction: null,
  };
}
