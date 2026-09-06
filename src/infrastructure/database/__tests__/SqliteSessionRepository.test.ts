import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import * as Crypto from "expo-crypto";
import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { SessionValidationError } from "@/domain/sessions/errors";
import {
  DEFAULT_SESSION_COLOR,
  type CreateSessionInput,
  type CreateSessionExerciseInput,
} from "@/domain/sessions/Session";
import type { Database, SqlParameters } from "@/infrastructure/database/Database";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import {
  assembleSession,
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
  "10000000-0000-4000-8000-000000000005",
  "10000000-0000-4000-8000-000000000006",
];

const SECOND_IDS = [
  "20000000-0000-4000-8000-000000000001",
  "20000000-0000-4000-8000-000000000002",
  "20000000-0000-4000-8000-000000000003",
  "20000000-0000-4000-8000-000000000004",
  "20000000-0000-4000-8000-000000000005",
];

const THIRD_IDS = [
  "30000000-0000-4000-8000-000000000001",
  "30000000-0000-4000-8000-000000000002",
  "30000000-0000-4000-8000-000000000003",
  "30000000-0000-4000-8000-000000000004",
  "30000000-0000-4000-8000-000000000005",
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

  it("creates, reads and lists a single-Activity aggregate (T01-S01 baseline, still supported)", async () => {
    const repository = new SqliteSessionRepository(database, uuidFactory());
    const created = await repository.create(validInput());
    const reopened = await repository.findById(created.id);
    const summaries = await repository.listActive();

    expect(created.id).toBe(IDS[0]);
    expect(created.cycle.id).toBe(IDS[1]);
    expect(created.cycle.tour.id).toBe(IDS[2]);
    expect(created.cycle.tour.exercises).toHaveLength(1);
    expect(created.cycle.tour.exercises[0]).toMatchObject({
      id: IDS[3],
      type: "EXERCISE",
      executionMode: "DURATION",
      structuralPosition: "IN_TOUR",
      position: 0,
      durationSeconds: 30,
      repetitionCount: null,
      seriesCount: 1,
      pauseSeconds: 0,
      bodyZoneIds: [],
    });
    expect(created.categories).toEqual([]);
    expect(reopened).toEqual(created);
    expect(summaries).toEqual([
      expect.objectContaining({
        id: created.id,
        activityCount: 1,
        estimatedDurationSeconds: 45,
        isEstimatedDurationApproximate: false,
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
      created.cycle.tour.exercises[0]?.id,
    ]).toEqual(IDS.slice(0, 4));
  });

  it("rejects incomplete or out-of-contract input before persistence with a structured SessionValidationError", async () => {
    const repository = new SqliteSessionRepository(database, uuidFactory());

    await expect(repository.create({ ...validInput(), name: "   " })).rejects.toBeInstanceOf(
      SessionValidationError,
    );
    await expect(
      repository.create({
        ...validInput(),
        exercises: [{ ...anExercise(), durationSeconds: 0 }],
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

    const handCraftedInvalidInput: CreateSessionInput = {
      name: "Nom valide",
      color: "#000000" as never,
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      exercises: [anExercise()],
      categories: [],
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
    expect(() => assembleSession([incoherentRow], new Map(), [])).toThrow("does not satisfy");
  });

  it("rejects a row whose session status is ARCHIVED", () => {
    const archivedRow: SessionAggregateRow = { ...validRow(), status: "ARCHIVED" };
    expect(() => assembleSession([archivedRow], new Map(), [])).toThrow("does not satisfy");
  });

  describe("multi-Activity persistence (T01-S09)", () => {
    it("persists ALL Activities of the collection, in order, without loss — zero loss of data validated in T01-S08", async () => {
      const repository = new SqliteSessionRepository(database, uuidFactory());
      const created = await repository.create({
        ...validInput(),
        exercises: [
          { ...anExercise(), name: "Gainage", durationSeconds: 30, seriesCount: 2, pauseSeconds: 5 },
          {
            ...anExercise(),
            name: "Squats",
            executionMode: "REPETITIONS",
            durationSeconds: null,
            repetitionCount: 12,
            instruction: "Descendre lentement",
            bodyZoneIds: ["cuisses", "genoux"],
          },
        ],
      });

      expect(created.cycle.tour.exercises).toHaveLength(2);
      expect(created.cycle.tour.exercises.map((exercise) => exercise.name)).toEqual([
        "Gainage",
        "Squats",
      ]);
      expect(created.cycle.tour.exercises.map((exercise) => exercise.position)).toEqual([0, 1]);
      expect(created.cycle.tour.exercises[1]).toMatchObject({
        executionMode: "REPETITIONS",
        durationSeconds: null,
        repetitionCount: 12,
        instruction: "Descendre lentement",
        bodyZoneIds: ["cuisses", "genoux"],
      });

      const reopened = await repository.findById(created.id);
      expect(reopened).toEqual(created);
    });

    it("preserves collection order across a connection close and reopen (real SQLite file)", async () => {
      const filePath = path.join(os.tmpdir(), `kodjo-t01s09-order-${randomUUID()}.db`);
      let writer: NodeSqliteDatabase | undefined;
      let reader: NodeSqliteDatabase | undefined;

      try {
        writer = NodeSqliteDatabase.openFile(filePath);
        await migrateDatabase(writer);
        const repository = new SqliteSessionRepository(writer, uuidFactory());
        const created = await repository.create({
          ...validInput(),
          exercises: [
            { ...anExercise(), name: "Un" },
            { ...anExercise(), name: "Deux" },
            { ...anExercise(), name: "Trois" },
          ],
        });

        writer.close();
        writer = undefined;

        reader = NodeSqliteDatabase.openFile(filePath);
        const rereadRepository = new SqliteSessionRepository(reader);
        const reread = await rereadRepository.findById(created.id);

        expect(reread?.cycle.tour.exercises.map((exercise) => exercise.name)).toEqual([
          "Un",
          "Deux",
          "Trois",
        ]);
      } finally {
        try {
          writer?.close();
        } catch {
          // Déjà fermée ou jamais ouverte.
        }
        try {
          reader?.close();
        } catch {
          // Déjà fermée ou jamais ouverte.
        }
        fs.rmSync(filePath, { force: true });
      }
    });

    it("rolls the whole aggregate back if a later Activity's insertion fails, keeping none of the earlier ones", async () => {
      const failingDatabase = new FailingSecondActivityInsertDatabase(database);
      const repository = new SqliteSessionRepository(failingDatabase, uuidFactory());

      await expect(
        repository.create({
          ...validInput(),
          exercises: [anExercise(), { ...anExercise(), name: "Squats" }],
        }),
      ).rejects.toThrow("forced second activity failure");

      const row = await database.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) AS count FROM activities",
      );
      expect(row?.count).toBe(0);
    });
  });

  describe("body zones persistence (D-093, T01-S09)", () => {
    it("persists and rereads body zones for an Activity", async () => {
      const repository = new SqliteSessionRepository(database, uuidFactory());
      const created = await repository.create({
        ...validInput(),
        exercises: [{ ...anExercise(), bodyZoneIds: ["dos", "epaules", "bras"] }],
      });

      expect([...(created.cycle.tour.exercises[0]?.bodyZoneIds ?? [])].sort()).toEqual(
        ["bras", "dos", "epaules"].sort(),
      );
      const reopened = await repository.findById(created.id);
      expect([...(reopened?.cycle.tour.exercises[0]?.bodyZoneIds ?? [])].sort()).toEqual(
        ["bras", "dos", "epaules"].sort(),
      );
    });

    it("rejects an unknown body zone id at the database level (defense in depth)", async () => {
      const repository = new SqliteSessionRepository(database, uuidFactory());

      await expect(
        repository.create({
          ...validInput(),
          exercises: [{ ...anExercise(), bodyZoneIds: ["not-a-real-zone"] }],
        }),
      ).rejects.toThrow();

      const count = await database.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) AS count FROM sessions",
      );
      expect(count?.count).toBe(0);
    });
  });

  describe("categories persistence (D-106/D-107, T01-S09)", () => {
    it("associates existing predefined categories by id, without creating any new row", async () => {
      const repository = new SqliteSessionRepository(database, uuidFactory());
      const created = await repository.create({
        ...validInput(),
        categories: [
          { kind: "EXISTING", categoryId: "cardio" },
          { kind: "EXISTING", categoryId: "mobilite" },
        ],
      });

      expect(created.categories.map((category) => category.id)).toEqual(["cardio", "mobilite"]);
      const count = await database.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) AS count FROM categories",
      );
      expect(count?.count).toBe(10); // seed only — no new row created.
    });

    it("creates a new custom category and associates it, within the same transaction", async () => {
      const repository = new SqliteSessionRepository(database, uuidFactory());
      const created = await repository.create({
        ...validInput(),
        categories: [{ kind: "NEW", name: "Ma Catégorie" }],
      });

      expect(created.categories).toHaveLength(1);
      expect(created.categories[0]?.name).toBe("Ma Catégorie");
      expect(created.categories[0]?.isPredefined).toBe(false);

      const row = await database.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) AS count FROM categories WHERE canonical_key = ?",
        ["ma categorie"],
      );
      expect(row?.count).toBe(1);
    });

    it("never creates a duplicate category: a NEW selection matching an existing canonical key reuses it (D-106)", async () => {
      const repository = new SqliteSessionRepository(database, uuidFactory());
      await repository.create({
        ...validInput(),
        categories: [{ kind: "NEW", name: "Ma Catégorie" }],
      });

      const secondRepository = new SqliteSessionRepository(database, secondUuidFactory());
      const second = await secondRepository.create({
        ...validInput(),
        name: "Deuxième séance",
        categories: [{ kind: "NEW", name: "  ma   catégorie  " }],
      });

      expect(second.categories[0]?.name).toBe("Ma Catégorie"); // reuses the FIRST persisted label.
      const row = await database.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) AS count FROM categories WHERE canonical_key = ?",
        ["ma categorie"],
      );
      expect(row?.count).toBe(1);
    });

    it("never creates a duplicate category across diacritics specifically (é/e), reusing the existing predefined Category — repository-level proof that canonicalCategoryKey's diacritic-stripping (unit-tested in domain/categories/__tests__/validation.test.ts) is actually applied end to end at the SQL layer", async () => {
      const repository = new SqliteSessionRepository(database, uuidFactory());
      const created = await repository.create({
        ...validInput(),
        categories: [{ kind: "NEW", name: "etirements" }], // matches the predefined "Étirements" once diacritics are ignored.
      });

      expect(created.categories).toHaveLength(1);
      expect(created.categories[0]?.id).toBe("etirements");
      expect(created.categories[0]?.name).toBe("Étirements"); // the predefined label, never re-created.
      expect(created.categories[0]?.isPredefined).toBe(true);

      const count = await database.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) AS count FROM categories WHERE canonical_key = ?",
        ["etirements"],
      );
      expect(count?.count).toBe(1);
    });

    it("succeeds with zero categories (D-106: never required)", async () => {
      const repository = new SqliteSessionRepository(database, uuidFactory());
      const created = await repository.create({ ...validInput(), categories: [] });
      expect(created.categories).toEqual([]);
    });

    it("rolls back the whole transaction, including the new category, if a later step fails", async () => {
      const failingDatabase = new FailingSessionCategoryInsertDatabase(database);
      const repository = new SqliteSessionRepository(failingDatabase, uuidFactory());

      await expect(
        repository.create({
          ...validInput(),
          categories: [{ kind: "NEW", name: "Ma Catégorie" }],
        }),
      ).rejects.toThrow("forced session_categories failure");

      const sessionCount = await database.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) AS count FROM sessions",
      );
      expect(sessionCount?.count).toBe(0);
      const categoryCount = await database.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) AS count FROM categories WHERE canonical_key = ?",
        ["ma categorie"],
      );
      expect(categoryCount?.count).toBe(0); // the speculatively created category is rolled back too.
    });

    it("orders returned categories predefined-first by displayOrder, then custom by createdAt (D-107)", async () => {
      const clock = fixedClock([
        "2026-01-01T00:00:00.000Z",
        "2026-01-01T00:00:01.000Z",
        "2026-01-01T00:00:02.000Z",
      ]);
      const repository = new SqliteSessionRepository(database, uuidFactory(), clock);
      const created = await repository.create({
        ...validInput(),
        categories: [
          { kind: "NEW", name: "Zzz personnalisée" },
          { kind: "EXISTING", categoryId: "cardio" }, // displayOrder 1
          { kind: "EXISTING", categoryId: "renforcement" }, // displayOrder 0
        ],
      });

      expect(created.categories.map((category) => category.id)).toEqual([
        "renforcement",
        "cardio",
        created.categories[2]?.id,
      ]);
      expect(created.categories[2]?.isPredefined).toBe(false);
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

    // T01-S09, correction VISUAL (point B, commentaire de revue faisant
    // suite à `1f28a09`) — le chevron/couleur des Catégories du Catalogue
    // n'apparaissait pas jaune pour une Séance existante. Diagnostic mené
    // sur toute la chaîne (schéma `sessions.color`, migration002 — n'altère
    // jamais `sessions` —, requête `listActive()`, `mapSummaryRow()`,
    // `SessionCard.tsx`) : `sessions.color` porte une contrainte `CHECK`
    // exhaustive sur exactement les 12 valeurs de `SESSION_COLORS` (aucun
    // défaut ni valeur nulle possible), `listActive()` sélectionne
    // `sessions.color` sans transformation ni retombée sur une valeur par
    // défaut, et `mapSummaryRow()` le recopie tel quel dans `SessionSummary
    // .color` — aucun défaut de restitution démontré dans le code lu. Cette
    // couverture verrouille néanmoins la chaîne complète pour la valeur
    // jaune de la palette (`#F7D154`), jusqu'ici jamais assertée par aucun
    // test de ce fichier.
    it("restores the exact persisted colour, including the yellow of the palette (#F7D154), never a default fallback", async () => {
      const repository = new SqliteSessionRepository(database, uuidFactory());
      const created = await repository.create({ ...validInput(), color: "#F7D154" });

      const summaries = await repository.listActive();
      const summary = summaries.find((item) => item.id === created.id);
      expect(summary?.color).toBe("#F7D154");
    });

    it("restores the yellow colour identically for a Session with no Category and no body zone (stand-in for data predating T01-S09's Category feature)", async () => {
      const repository = new SqliteSessionRepository(database, uuidFactory());
      const created = await repository.create({
        ...validInput(),
        color: "#F7D154",
        categories: [],
        exercises: [{ ...anExercise(), bodyZoneIds: [] }],
      });

      const summaries = await repository.listActive();
      const summary = summaries.find((item) => item.id === created.id);
      expect(summary?.color).toBe("#F7D154");
      expect(summary?.categoryNames).toEqual([]);
      expect(summary?.bodyZoneNames).toEqual([]);
    });

    // Correction REVISION tentative 3 (feedback : « le test actuel via
    // repository.create() ne reproduit pas ce cas ») : `repository.create()`
    // rejoue systématiquement le code applicatif actuel — il ne peut donc
    // jamais matérialiser une ligne réellement antérieure à un correctif ou
    // à l'existence même du code qui l'écrit. Ce test insère la Séance
    // directement au niveau SQL (`sessions`/`cycles`/`tours`/`activities`),
    // en contournant entièrement `SqliteSessionRepository`, exactement comme
    // le ferait une ligne déjà présente en base avant toute exécution du
    // code applicatif de ce dépôt — sans association `session_categories`/
    // `activity_body_zones`, ces deux tables (migration002, T01-S09)
    // n'existant fonctionnellement pas encore pour une telle donnée.
    it("restores the exact persisted yellow colour for a Session inserted directly at the SQL layer, bypassing SqliteSessionRepository entirely (genuine historical/pre-existing row, not a repository.create() stand-in)", async () => {
      const owner = await database.getFirstAsync<{ id: string }>(
        "SELECT id FROM users WHERE singleton_key = 1",
      );
      if (!owner) {
        throw new Error("Expected the local user to already be seeded by migrateDatabase().");
      }

      const sessionId = "historical-session-1";
      const cycleId = "historical-cycle-1";
      const tourId = "historical-tour-1";
      const activityId = "historical-activity-1";
      const timestamp = "2025-01-01T00:00:00.000Z";

      await database.runAsync(
        `INSERT INTO sessions (
          id, owner_id, name, color, status,
          initial_countdown_seconds, final_phase_seconds,
          created_at, updated_at
        ) VALUES (?, ?, ?, '#F7D154', 'ACTIVE', 10, 5, ?, ?)`,
        [sessionId, owner.id, "Séance historique", timestamp, timestamp],
      );
      await database.runAsync(
        `INSERT INTO cycles (id, session_id, position, repeat_count) VALUES (?, ?, 1, 1)`,
        [cycleId, sessionId],
      );
      await database.runAsync(
        `INSERT INTO tours (id, cycle_id, session_id, position, repeat_count) VALUES (?, ?, ?, 1, 1)`,
        [tourId, cycleId, sessionId],
      );
      await database.runAsync(
        `INSERT INTO activities (
          id, session_id, cycle_id, tour_id, type, structural_position,
          position, name, execution_mode, duration_seconds,
          repetition_count, series_count, pause_seconds, instruction,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, 'EXERCISE', 'IN_TOUR', 0, ?, 'DURATION', 30, NULL, 1, 0, NULL, ?, ?)`,
        [activityId, sessionId, cycleId, tourId, "Gainage historique", timestamp, timestamp],
      );

      const repository = new SqliteSessionRepository(database, uuidFactory());
      const summaries = await repository.listActive();
      const summary = summaries.find((item) => item.id === sessionId);

      expect(summary).toBeDefined();
      expect(summary?.color).toBe("#F7D154");
      expect(summary?.categoryNames).toEqual([]);
      expect(summary?.bodyZoneNames).toEqual([]);
    });

    it("marks the estimated duration as approximate as soon as one Activity uses REPETITIONS mode (RM-072)", async () => {
      const repository = new SqliteSessionRepository(database, uuidFactory());
      await repository.create({
        ...validInput(),
        exercises: [
          { ...anExercise(), executionMode: "REPETITIONS", durationSeconds: null, repetitionCount: 12 },
        ],
      });

      const summaries = await repository.listActive();
      expect(summaries[0]?.isEstimatedDurationApproximate).toBe(true);
    });

    it("sums seriesCount × duration + seriesCount × pause across several Activities in the estimated duration", async () => {
      const repository = new SqliteSessionRepository(database, uuidFactory());
      const created = await repository.create({
        ...validInput(),
        initialCountdownSeconds: 10,
        finalPhaseSeconds: 5,
        exercises: [
          { ...anExercise(), name: "Un", durationSeconds: 30, seriesCount: 2, pauseSeconds: 5 },
          { ...anExercise(), name: "Deux", durationSeconds: 20, seriesCount: 1, pauseSeconds: 0 },
        ],
      });

      const summaries = await repository.listActive();
      const summary = summaries.find((item) => item.id === created.id);
      // (2×30 + 2×5) + (1×20 + 0) = 70 + 20 = 90 ; + 10 + 5 = 105 -> ceil not applied here (raw seconds).
      expect(summary?.estimatedDurationSeconds).toBe(105);
      expect(summary?.activityCount).toBe(2);
    });

    it("sorts by COALESCE(last_executed_at, updated_at) DESC independently of insertion order", async () => {
      const clockOldest = fixedClock(["2026-01-01T00:00:00.000Z"]);
      const repositoryOldest = new SqliteSessionRepository(database, uuidFactory(), clockOldest);
      const sessionOldest = await repositoryOldest.create({
        ...validInput(),
        name: "Jamais exécutée",
      });

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

    // T01-S09, correction VISUAL tentative 2 (point B) : `categoryNames`/
    // `bodyZoneNames`, restaurés sur `SessionSummary` pour la ligne manquante
    // sous le nom de la Séance (CE-T01-03).
    it("exposes an empty categoryNames and an empty bodyZoneNames when the Session has neither (zero value)", async () => {
      const repository = new SqliteSessionRepository(database, uuidFactory());
      const created = await repository.create({ ...validInput(), categories: [] });

      const summaries = await repository.listActive();
      const summary = summaries.find((item) => item.id === created.id);
      expect(summary?.categoryNames).toEqual([]);
      expect(summary?.bodyZoneNames).toEqual([]);
    });

    it("exposes exactly one categoryName and one bodyZoneName (one value)", async () => {
      const repository = new SqliteSessionRepository(database, uuidFactory());
      const created = await repository.create({
        ...validInput(),
        exercises: [{ ...anExercise(), bodyZoneIds: ["genoux"] }],
        categories: [{ kind: "EXISTING", categoryId: "cardio" }],
      });

      const summaries = await repository.listActive();
      const summary = summaries.find((item) => item.id === created.id);
      expect(summary?.categoryNames).toEqual(["Cardio"]);
      expect(summary?.bodyZoneNames).toEqual(["Genoux"]);
    });

    it("orders categoryNames predefined-first by displayOrder, then custom by createdAt — same order as create() (D-107, many values)", async () => {
      const clock = fixedClock([
        "2026-01-01T00:00:00.000Z",
        "2026-01-01T00:00:01.000Z",
        "2026-01-01T00:00:02.000Z",
      ]);
      const repository = new SqliteSessionRepository(database, uuidFactory(), clock);
      const created = await repository.create({
        ...validInput(),
        categories: [
          { kind: "NEW", name: "Zzz personnalisée" },
          { kind: "EXISTING", categoryId: "cardio" }, // displayOrder 1
          { kind: "EXISTING", categoryId: "renforcement" }, // displayOrder 0
        ],
      });

      const summaries = await repository.listActive();
      const summary = summaries.find((item) => item.id === created.id);
      expect(summary?.categoryNames).toEqual(["Renforcement", "Cardio", "Zzz personnalisée"]);
    });

    it("unions bodyZoneNames WITHOUT LOSS across ALL persisted Activities of the Session, deduplicated and ordered by the referential (never insertion order, many values)", async () => {
      const repository = new SqliteSessionRepository(database, uuidFactory());
      const created = await repository.create({
        ...validInput(),
        exercises: [
          { ...anExercise(), name: "Un", bodyZoneIds: ["genoux", "dos"] },
          { ...anExercise(), name: "Deux", bodyZoneIds: ["dos", "cou"] },
        ],
      });

      const summaries = await repository.listActive();
      const summary = summaries.find((item) => item.id === created.id);
      // Référentiel : cou (order 0), dos (order 4), genoux (order 7) —
      // jamais l'ordre d'insertion ("genoux" avant "dos" dans la première
      // Activité), jamais de doublon pour "dos" partagé par les deux.
      expect(summary?.bodyZoneNames).toEqual(["Cou", "Dos", "Genoux"]);
    });

    it("scopes categoryNames/bodyZoneNames per Session — never leaks another Session's values (multiple Sessions in the same listActive() call)", async () => {
      const repository = new SqliteSessionRepository(database, uuidFactory());
      const first = await repository.create({
        ...validInput(),
        name: "Première",
        exercises: [{ ...anExercise(), bodyZoneIds: ["genoux"] }],
        categories: [{ kind: "EXISTING", categoryId: "cardio" }],
      });

      const secondRepository = new SqliteSessionRepository(database, secondUuidFactory());
      const second = await secondRepository.create({
        ...validInput(),
        name: "Deuxième",
        exercises: [{ ...anExercise(), bodyZoneIds: ["dos"] }],
        categories: [{ kind: "EXISTING", categoryId: "mobilite" }],
      });

      const summaries = await repository.listActive();
      expect(summaries.find((item) => item.id === first.id)?.categoryNames).toEqual(["Cardio"]);
      expect(summaries.find((item) => item.id === first.id)?.bodyZoneNames).toEqual(["Genoux"]);
      expect(summaries.find((item) => item.id === second.id)?.categoryNames).toEqual(["Mobilité"]);
      expect(summaries.find((item) => item.id === second.id)?.bodyZoneNames).toEqual(["Dos"]);
    });
  });

  describe("update (generalized contract, out of the T01-S09 functional scope — T01-S10 will define real reopen UX)", () => {
    it("replaces the Activity collection and preserves session/cycle/tour identifiers", async () => {
      const repository = new SqliteSessionRepository(database, uuidFactory());
      const created = await repository.create(validInput());

      const outcome = await repository.update(created.id, {
        ...validInput(),
        name: "Nom modifié",
        exercises: [
          { ...anExercise(), name: "Nouveau 1" },
          { ...anExercise(), name: "Nouveau 2" },
        ],
      });

      expect(outcome.status).toBe("UPDATED");
      if (outcome.status !== "UPDATED") {
        throw new Error("expected update() to report UPDATED");
      }
      expect(outcome.session.id).toBe(created.id);
      expect(outcome.session.cycle.id).toBe(created.cycle.id);
      expect(outcome.session.cycle.tour.id).toBe(created.cycle.tour.id);
      expect(outcome.session.name).toBe("Nom modifié");
      expect(outcome.session.cycle.tour.exercises.map((exercise) => exercise.name)).toEqual([
        "Nouveau 1",
        "Nouveau 2",
      ]);
    });

    it("returns NOT_FOUND and performs no write for an unknown id", async () => {
      const repository = new SqliteSessionRepository(database, uuidFactory());

      const outcome = await repository.update("00000000-0000-4000-8000-000000000099", validInput());

      expect(outcome).toEqual({ status: "NOT_FOUND" });
      const count = await database.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) AS count FROM sessions",
      );
      expect(count?.count).toBe(0);
    });

    it("returns ARCHIVED and performs no write for a session archived via direct SQL", async () => {
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
  });
});

function validInput(): CreateSessionInput {
  return {
    name: "Séance simple",
    color: DEFAULT_SESSION_COLOR,
    initialCountdownSeconds: 10,
    finalPhaseSeconds: 5,
    exercises: [anExercise()],
    categories: [],
  };
}

function anExercise(overrides: Partial<CreateSessionExerciseInput> = {}): CreateSessionExerciseInput {
  return {
    name: "Gainage",
    executionMode: "DURATION",
    durationSeconds: 30,
    repetitionCount: null,
    seriesCount: 1,
    pauseSeconds: 0,
    instruction: null,
    bodyZoneIds: [],
    ...overrides,
  };
}

function uuidFactory(): () => string {
  let index = 0;
  return () => IDS[index++]!;
}

function secondUuidFactory(): () => string {
  let index = 0;
  return () => SECOND_IDS[index++]!;
}

function thirdUuidFactory(): () => string {
  let index = 0;
  return () => THIRD_IDS[index++]!;
}

/** Horloge factice déterministe : renvoie les horodatages fournis, dans l'ordre, un par appel, puis répète le dernier indéfiniment (les transactions T01-S09 consomment plusieurs horodatages : timestamp + created_at de catégorie). */
function fixedClock(timestamps: readonly string[]): () => string {
  let index = 0;
  return () => timestamps[Math.min(index++, timestamps.length - 1)]!;
}

class FailingActivityInsertDatabase implements Database {
  constructor(private readonly delegate: Database) {}

  execAsync = (source: string) => this.delegate.execAsync(source);
  getFirstAsync = <T>(source: string, parameters: SqlParameters = []) =>
    this.delegate.getFirstAsync<T>(source, parameters);
  getAllAsync = <T>(source: string, parameters: SqlParameters = []) =>
    this.delegate.getAllAsync<T>(source, parameters);

  runAsync(source: string, parameters: SqlParameters = []) {
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

/** Laisse la PREMIÈRE insertion d'Activité réussir, force l'échec de la SECONDE — preuve de rollback complet même après une écriture partielle réelle. */
class FailingSecondActivityInsertDatabase implements Database {
  private activityInsertCount = 0;

  constructor(private readonly delegate: Database) {}

  execAsync = (source: string) => this.delegate.execAsync(source);
  getFirstAsync = <T>(source: string, parameters: SqlParameters = []) =>
    this.delegate.getFirstAsync<T>(source, parameters);
  getAllAsync = <T>(source: string, parameters: SqlParameters = []) =>
    this.delegate.getAllAsync<T>(source, parameters);

  runAsync(source: string, parameters: SqlParameters = []) {
    if (source.includes("INSERT INTO activities")) {
      this.activityInsertCount += 1;
      if (this.activityInsertCount === 2) {
        return Promise.reject(new Error("forced second activity failure"));
      }
    }
    return this.delegate.runAsync(source, parameters);
  }

  withExclusiveTransactionAsync(task: (transaction: Database) => Promise<void>) {
    return this.delegate.withExclusiveTransactionAsync((transaction) => {
      const shared = new FailingSecondActivityInsertDatabase(transaction);
      shared.activityInsertCount = this.activityInsertCount;
      return task(shared);
    });
  }
}

class FailingSessionCategoryInsertDatabase implements Database {
  constructor(private readonly delegate: Database) {}

  execAsync = (source: string) => this.delegate.execAsync(source);
  getFirstAsync = <T>(source: string, parameters: SqlParameters = []) =>
    this.delegate.getFirstAsync<T>(source, parameters);
  getAllAsync = <T>(source: string, parameters: SqlParameters = []) =>
    this.delegate.getAllAsync<T>(source, parameters);

  runAsync(source: string, parameters: SqlParameters = []) {
    if (source.includes("INSERT INTO session_categories")) {
      return Promise.reject(new Error("forced session_categories failure"));
    }
    return this.delegate.runAsync(source, parameters);
  }

  withExclusiveTransactionAsync(task: (transaction: Database) => Promise<void>) {
    return this.delegate.withExclusiveTransactionAsync((transaction) =>
      task(new FailingSessionCategoryInsertDatabase(transaction)),
    );
  }
}

function validRow(): SessionAggregateRow {
  return {
    session_id: IDS[0]!,
    owner_id: "usr_test",
    session_name: "Séance",
    color: DEFAULT_SESSION_COLOR,
    status: "ACTIVE",
    initial_countdown_seconds: 10,
    final_phase_seconds: 5,
    session_created_at: "2026-01-01T00:00:00.000Z",
    session_updated_at: "2026-01-01T00:00:00.000Z",
    cycle_id: IDS[1]!,
    cycle_position: 1,
    cycle_repeat_count: 1,
    tour_id: IDS[2]!,
    tour_position: 1,
    tour_repeat_count: 1,
    activity_id: IDS[3]!,
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
