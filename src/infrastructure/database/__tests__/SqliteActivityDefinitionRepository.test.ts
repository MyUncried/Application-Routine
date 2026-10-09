import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteActivityDefinitionRepository } from "@/infrastructure/database/repositories/SqliteActivityDefinitionRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  activityDefinitionToDraftExercise,
  activityDefinitionToInput,
  validateActivityDefinitionInput,
  type CreateActivityDefinitionInput,
} from "@/domain/activities/ActivityDefinition";
import { ExecutionParametersDataError, type ExecutionParameters } from "@/domain/activities/ExecutionParameters";
import type { MediaAsset } from "@/domain/media/MediaAsset";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";

function makeUuidFactory(prefix: string) {
  let counter = 0;
  return () => `${prefix}-${++counter}`;
}

function makeClock(startIso: string) {
  let current = new Date(startIso).getTime();
  return () => {
    const iso = new Date(current).toISOString();
    current += 1000;
    return iso;
  };
}

describe("SqliteActivityDefinitionRepository", () => {
  let database: NodeSqliteDatabase;

  beforeEach(async () => {
    database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database);
  });

  afterEach(() => {
    database.close();
  });

  function baseInput() {
    return {
      name: "Squat",
      description: "Descente lente",
      executionMode: "DURATION" as const,
      durationSeconds: 30,
      repetitionCount: null,
      seriesCount: 3,
      pauseSeconds: 10,
      category: { kind: "EXISTING" as const, categoryId: "cardio" },
      sideRecoverySeconds: 5,
      bodyZoneIds: ["cuisses", "genoux"],
    };
  }

  it("creates a definition and reads it back with its body zones", async () => {
    const repository = new SqliteActivityDefinitionRepository(
      database,
      makeUuidFactory("def"),
      makeClock("2026-01-01T00:00:00.000Z"),
    );

    const created = await repository.create(baseInput());
    expect(created.id).toBe("def-1");
    expect(created.sideMode).toBe("UNILATERAL");

    const found = await repository.findById(created.id);
    expect(found).toEqual(created);
    expect(found?.bodyZoneIds.slice().sort()).toEqual(["cuisses", "genoux"]);
  });

  it("returns null when reading an unknown id", async () => {
    const repository = new SqliteActivityDefinitionRepository(database);
    expect(await repository.findById("missing")).toBeNull();
  });

  it("lists definitions ordered by updatedAt DESC", async () => {
    const repository = new SqliteActivityDefinitionRepository(
      database,
      makeUuidFactory("def"),
      makeClock("2026-01-01T00:00:00.000Z"),
    );

    const first = await repository.create({ ...baseInput(), name: "Premier" });
    const second = await repository.create({ ...baseInput(), name: "Second" });

    const listed = await repository.listAll();
    expect(listed.map((d) => d.name)).toEqual(["Second", "Premier"]);
    expect(new Date(second.updatedAt).getTime()).toBeGreaterThan(
      new Date(first.updatedAt).getTime(),
    );
  });

  it("updates a definition in place, replacing its body zones and updatedAt", async () => {
    const repository = new SqliteActivityDefinitionRepository(
      database,
      makeUuidFactory("def"),
      makeClock("2026-01-01T00:00:00.000Z"),
    );
    const created = await repository.create(baseInput());

    const updated = await repository.update(created.id, {
      ...baseInput(),
      name: "Squat modifié",
      bodyZoneIds: ["dos"],
    });

    expect(updated?.name).toBe("Squat modifié");
    expect(updated?.bodyZoneIds).toEqual(["dos"]);
    expect(updated?.createdAt).toBe(created.createdAt);
    expect(new Date(updated!.updatedAt).getTime()).toBeGreaterThan(
      new Date(created.updatedAt).getTime(),
    );

    const reread = await repository.findById(created.id);
    expect(reread?.bodyZoneIds).toEqual(["dos"]);
  });

  it("returns null when updating an unknown id, without creating a row", async () => {
    const repository = new SqliteActivityDefinitionRepository(database);
    const result = await repository.update("missing", baseInput());
    expect(result).toBeNull();

    const listed = await repository.listAll();
    expect(listed).toHaveLength(0);
  });

  it("keeps the definition an independent root: it never writes to sessions/activities tables", async () => {
    const repository = new SqliteActivityDefinitionRepository(database, makeUuidFactory("def"));
    await repository.create(baseInput());

    const sessionCount = await database.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) AS count FROM sessions",
    );
    const activityCount = await database.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) AS count FROM activities",
    );
    expect(sessionCount?.count).toBe(0);
    expect(activityCount?.count).toBe(0);
  });

  /**
   * Revue indépendante 5732014381, obligation 7 : preuve du rollback de
   * transaction `ActivityDefinition`/Zones corporelles. `create()`/`update()`
   * écrivent la ligne principale PUIS ses Zones dans une seule transaction
   * exclusive (`withExclusiveTransactionAsync`) — un identifiant de Zone
   * dupliqué viole la clé primaire composite
   * `(activity_definition_id, body_zone_id)` de `activity_definition_body_zones`
   * en cours d'écriture : la transaction entière doit alors être annulée,
   * y compris la ligne `activity_definitions` déjà insérée avant l'échec.
   */
  describe("rollback de transaction (revue 5732014381, obligation 7)", () => {
    it("create(): a body-zone conflict rolls back the whole transaction — no orphan activity_definitions row survives", async () => {
      const repository = new SqliteActivityDefinitionRepository(
        database,
        makeUuidFactory("def"),
        makeClock("2026-01-01T00:00:00.000Z"),
      );

      await expect(
        repository.create({ ...baseInput(), bodyZoneIds: ["dos", "dos"] }),
      ).rejects.toThrow();

      const definitions = await database.getAllAsync<{ id: string }>(
        "SELECT id FROM activity_definitions",
      );
      expect(definitions).toHaveLength(0);
      const zones = await database.getAllAsync<{ activity_definition_id: string }>(
        "SELECT activity_definition_id FROM activity_definition_body_zones",
      );
      expect(zones).toHaveLength(0);
    });

    it("update(): a body-zone conflict rolls back the whole transaction — the previous row and its zones are left untouched", async () => {
      const repository = new SqliteActivityDefinitionRepository(
        database,
        makeUuidFactory("def"),
        makeClock("2026-01-01T00:00:00.000Z"),
      );
      const created = await repository.create(baseInput());

      await expect(
        repository.update(created.id, { ...baseInput(), name: "Corrompu", bodyZoneIds: ["dos", "dos"] }),
      ).rejects.toThrow();

      const reread = await repository.findById(created.id);
      expect(reread?.name).toBe("Squat");
      expect(reread?.bodyZoneIds.slice().sort()).toEqual(["cuisses", "genoux"]);
    });
  });

  /**
   * V2-PRE-1 (plan §3.3/§13, REQ-001108DC7F67664C, UI-40094921B202-
   * A2E0666968E44) : les médias sont persistés avec une position STABLE égale
   * à l'ordre du tableau fourni (0-indexée), jamais retriée.
   */
  describe("médias (V2-PRE-1, plan §3.3/§13, REQ-001108DC7F67664C)", () => {
    async function seedAsset(id: string): Promise<void> {
      await database.runAsync(
        `INSERT INTO media_assets (id, uri, created_at) VALUES (?, ?, '2026-01-01T00:00:00.000Z')`,
        [id, `file:///${id}.jpg`],
      );
    }

    it("create(): persists each media with a position equal to its index in the given array, never re-sorted", async () => {
      await seedAsset("asset-1");
      await seedAsset("asset-2");
      const repository = new SqliteActivityDefinitionRepository(
        database,
        makeUuidFactory("def"),
        makeClock("2026-01-01T00:00:00.000Z"),
      );

      const created = await repository.create({
        ...baseInput(),
        media: [{ assetId: "asset-2" }, { assetId: "asset-1" }],
      });

      const rows = await database.getAllAsync<{ asset_id: string; position: number }>(
        `SELECT asset_id, position FROM activity_media
         WHERE activity_definition_id = ? ORDER BY position ASC`,
        [created.id],
      );
      expect(rows).toEqual([
        { asset_id: "asset-2", position: 0 },
        { asset_id: "asset-1", position: 1 },
      ]);
    });

    it("create(): persists no media row when the input omits media", async () => {
      const repository = new SqliteActivityDefinitionRepository(database, makeUuidFactory("def"));
      const created = await repository.create(baseInput());

      const rows = await database.getAllAsync<{ id: string }>(
        `SELECT id FROM activity_media WHERE activity_definition_id = ?`,
        [created.id],
      );
      expect(rows).toHaveLength(0);
    });

    it("update(): replaces the previous media set entirely, with the new array's own order", async () => {
      await seedAsset("asset-1");
      await seedAsset("asset-2");
      await seedAsset("asset-3");
      const repository = new SqliteActivityDefinitionRepository(
        database,
        makeUuidFactory("def"),
        makeClock("2026-01-01T00:00:00.000Z"),
      );
      const created = await repository.create({
        ...baseInput(),
        media: [{ assetId: "asset-1" }],
      });

      await repository.update(created.id, {
        ...baseInput(),
        media: [{ assetId: "asset-3" }, { assetId: "asset-2" }],
      });

      const rows = await database.getAllAsync<{ asset_id: string; position: number }>(
        `SELECT asset_id, position FROM activity_media
         WHERE activity_definition_id = ? ORDER BY position ASC`,
        [created.id],
      );
      expect(rows).toEqual([
        { asset_id: "asset-3", position: 0 },
        { asset_id: "asset-2", position: 1 },
      ]);
    });

    it("create(): an unknown assetId rolls back the whole transaction — no orphan activity_definitions row survives", async () => {
      const repository = new SqliteActivityDefinitionRepository(
        database,
        makeUuidFactory("def"),
        makeClock("2026-01-01T00:00:00.000Z"),
      );

      await expect(
        repository.create({ ...baseInput(), media: [{ assetId: "missing-asset" }] }),
      ).rejects.toThrow();

      const definitions = await database.getAllAsync<{ id: string }>(
        "SELECT id FROM activity_definitions",
      );
      expect(definitions).toHaveLength(0);
    });
  });

  /**
   * T16, D-210, CE-UI-09 L2825/L2837 (V2-PRE-2) : garde « valeur retirée »
   * côté stockage — une référence `EXISTING` vers une Catégorie retirée est
   * refusée à la création ; en modification, elle reste permise UNIQUEMENT
   * si elle est identique à l'affectation déjà persistée.
   */
  describe("T16 — retired category guard (D-210)", () => {
    it("create(): rejects a reference to a retired category", async () => {
      await database.runAsync("UPDATE categories SET is_active = 0 WHERE id = 'cardio'");
      const repository = new SqliteActivityDefinitionRepository(
        database,
        makeUuidFactory("def"),
        makeClock("2026-01-01T00:00:00.000Z"),
      );

      await expect(repository.create(baseInput())).rejects.toThrow();
      const definitions = await database.getAllAsync<{ id: string }>(
        "SELECT id FROM activity_definitions",
      );
      expect(definitions).toHaveLength(0);
    });

    it("update(): keeps the already-assigned category even if it has since been retired", async () => {
      const repository = new SqliteActivityDefinitionRepository(
        database,
        makeUuidFactory("def"),
        makeClock("2026-01-01T00:00:00.000Z"),
      );
      const created = await repository.create(baseInput());
      await database.runAsync("UPDATE categories SET is_active = 0 WHERE id = 'cardio'");

      const updated = await repository.update(created.id, { ...baseInput(), name: "Squat renommé" });
      expect(updated?.categoryId).toBe("cardio");
      expect(updated?.name).toBe("Squat renommé");
    });

    it("update(): rejects switching to a DIFFERENT retired category", async () => {
      const repository = new SqliteActivityDefinitionRepository(
        database,
        makeUuidFactory("def"),
        makeClock("2026-01-01T00:00:00.000Z"),
      );
      const created = await repository.create(baseInput());
      await database.runAsync("UPDATE categories SET is_active = 0 WHERE id = 'mobilite'");

      await expect(
        repository.update(created.id, {
          ...baseInput(),
          category: { kind: "EXISTING", categoryId: "mobilite" },
        }),
      ).rejects.toThrow();

      const row = await database.getFirstAsync<{ category_id: string }>(
        "SELECT category_id FROM activity_definitions WHERE id = ?",
        [created.id],
      );
      expect(row?.category_id).toBe("cardio");
    });
  });
});

/**
 * PRE-3 — obligations SQLite RÉELLES de la définition Catalogue
 * (`tests-and-preservation.json`, propriétaire SqliteActivityDefinitionRepository).
 * Paramètres canoniques, médias ordonnés et non-régressions PRE-1/PRE-2.
 */
describe("SqliteActivityDefinitionRepository — PRE-3 (NodeSqliteDatabase REAL)", () => {
  let database: NodeSqliteDatabase;
  let sequence = 0;
  const ids = (prefix: string) => () => `${prefix}-${++sequence}`;

  beforeEach(async () => {
    database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database);
  });

  afterEach(() => {
    database.close();
  });

  function canonical(overrides: Partial<ExecutionParameters> = {}): ExecutionParameters {
    return {
      version: 1,
      mode: "DURATION",
      series: {
        kind: "VARIABLE",
        rows: [
          { target: 30, pauseSeconds: 10 },
          { target: 45, pauseSeconds: 20 },
          { target: 60, pauseSeconds: 30 },
        ],
      },
      sideMode: "RIGHT_LEFT",
      sideOrder: "BY_SERIES",
      sideRecoverySeconds: 7,
      cadenceBeepIntervalSeconds: 4,
      countdownSeconds: 3,
      endSeconds: 2,
      ...overrides,
    };
  }

  const photo = (id: string): MediaAsset => ({
    id,
    uri: `kodjo-media/${id}.jpg`,
    createdAt: "2026-10-09T10:00:00.000Z",
    kind: "PHOTO",
    mimeType: "image/jpeg",
    fileName: null,
    sizeBytes: 1000,
    durationMs: null,
    width: 100,
    height: 80,
  });
  const video = (id: string): MediaAsset => ({
    ...photo(id),
    uri: `kodjo-media/${id}.mov`,
    kind: "VIDEO",
    mimeType: "video/quicktime",
    durationMs: 3000,
  });

  function input(parameters: ExecutionParameters, overrides: Partial<CreateActivityDefinitionInput> = {}): CreateActivityDefinitionInput {
    return {
      name: "Fentes",
      description: null,
      executionMode: parameters.mode,
      durationSeconds: null,
      repetitionCount: null,
      seriesCount: 1,
      pauseSeconds: 0,
      category: { kind: "EXISTING", categoryId: "cardio" },
      bodyZoneIds: ["cuisses"],
      sideRecoverySeconds: 0,
      executionParameters: parameters,
      ...overrides,
    };
  }

  /** Même chemin que l'application : validation canonique du Domaine, puis Repository. */
  async function save(repository: SqliteActivityDefinitionRepository, value: CreateActivityDefinitionInput) {
    const validated = validateActivityDefinitionInput(value);
    if (!validated.ok) {
      throw new Error(JSON.stringify(validated.violations));
    }
    return repository.create(validated.value);
  }

  it("P3-01/Catalogue:create et P3-01/Catalogue:edit — tous les champs se rouvrent ; Terminer Catalogue écrit la seule définition", async () => {
    const repository = new SqliteActivityDefinitionRepository(database, ids("def"));
    const media = [
      { assetId: "p1", asset: photo("p1") },
      { assetId: "v1", asset: video("v1") },
    ];
    const created = await save(repository, input(canonical(), { media }));
    const reopened = await repository.findById(created.id);
    expect(reopened?.executionParameters).toEqual(canonical());
    expect(reopened?.media?.map((item) => [item.assetId, item.position, item.asset.kind])).toEqual([
      ["p1", 0, "PHOTO"],
      ["v1", 1, "VIDEO"],
    ]);
    // Modification : cible, cadence, ordre des côtés et ordre des médias.
    const edited = canonical({ cadenceBeepIntervalSeconds: 9, sideOrder: "BY_SIDE" });
    const editInput = activityDefinitionToInput(reopened!);
    const validated = validateActivityDefinitionInput({
      ...editInput,
      executionParameters: edited,
      media: [editInput.media![1]!, editInput.media![0]!],
    });
    expect(validated.ok).toBe(true);
    const updated = await repository.update(created.id, validated.ok ? validated.value : editInput);
    expect(updated?.executionParameters).toEqual(edited);
    expect(updated?.media?.map((item) => item.assetId)).toEqual(["v1", "p1"]);
    expect(updated?.createdAt).toBe(created.createdAt);
    const counts = await database.getFirstAsync<{ sessions: number; occurrences: number }>(
      "SELECT (SELECT COUNT(*) FROM sessions) AS sessions, (SELECT COUNT(*) FROM activities) AS occurrences",
    );
    expect(counts).toEqual({ sessions: 0, occurrences: 0 });
  });

  it("P3-01/Session:create et P3-01/Session:edit — une copie de Séance enregistrée ne réécrit jamais la définition source", async () => {
    const definitions = new SqliteActivityDefinitionRepository(database, ids("def"));
    const sessions = new SqliteSessionRepository(database, ids("ses"));
    const definition = await save(definitions, input(canonical(), { media: [{ assetId: "p1", asset: photo("p1") }] }));
    const before = await database.getFirstAsync("SELECT * FROM activity_definitions WHERE id = ?", [definition.id]);
    const copy = activityDefinitionToDraftExercise(definition, "occ-1", 0);
    await sessions.create({
      name: "Copie",
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      tourRepeatCount: 1,
      exercises: [
        {
          id: copy.id,
          type: "EXERCISE",
          structuralPosition: "IN_TOUR",
          name: copy.name,
          executionMode: copy.executionMode,
          durationSeconds: copy.durationSeconds,
          repetitionCount: copy.repetitionCount,
          seriesCount: copy.seriesCount,
          pauseSeconds: copy.pauseSeconds,
          postActivityRecoverySeconds: 0,
          bodyZoneIds: copy.bodyZoneIds,
          executionParameters: canonical({ cadenceBeepIntervalSeconds: 1 }),
          categoryId: copy.categoryId,
          media: copy.media?.map((item) => ({ assetId: item.assetId })),
        },
      ],
    });
    expect(await database.getFirstAsync("SELECT * FROM activity_definitions WHERE id = ?", [definition.id])).toEqual(before);
    expect((await definitions.findById(definition.id))?.executionParameters?.cadenceBeepIntervalSeconds).toBe(4);
  });

  it("P3-03/reference-retired — Catégorie retirée conservée sur l'Exercice existant modifié", async () => {
    const repository = new SqliteActivityDefinitionRepository(database, ids("def"));
    const created = await save(repository, input(canonical()));
    await database.runAsync("UPDATE categories SET is_active = 0 WHERE id = 'cardio'");
    const reopened = await repository.findById(created.id);
    const validated = validateActivityDefinitionInput({ ...activityDefinitionToInput(reopened!), description: "Lent" });
    const updated = await repository.update(created.id, validated.ok ? validated.value : activityDefinitionToInput(reopened!));
    expect(updated?.categoryId).toBe("cardio");
    expect(updated?.description).toBe("Lent");
    expect(updated?.bodyZoneIds).toEqual(["cuisses"]);
  });

  it("P3-05/equal-variable, P3-06/commit-hidden, P3-08/restoration-N1 — l'état validé est exactement relu", async () => {
    const repository = new SqliteActivityDefinitionRepository(database, ids("def"));
    const equal = canonical({
      series: { kind: "VARIABLE", rows: [1, 2, 3].map(() => ({ target: 30, pauseSeconds: 10 })) },
    });
    expect((await repository.findById((await save(repository, input(equal))).id))?.executionParameters?.series).toEqual(equal.series);

    const shrunk = canonical({
      series: { kind: "VARIABLE", rows: [{ target: 10, pauseSeconds: 1 }, { target: 20, pauseSeconds: 2 }] },
    });
    const reread = await repository.findById((await save(repository, input(shrunk))).id);
    expect(reread?.executionParameters?.series).toEqual(shrunk.series);

    const n1 = canonical({ series: { kind: "UNIFORM", count: 1, target: 90, pauseSeconds: 15 }, sideOrder: "BY_SIDE" });
    const single = await repository.findById((await save(repository, input(n1))).id);
    expect(single?.executionParameters?.series).toEqual({ kind: "UNIFORM", count: 1, target: 90, pauseSeconds: 15 });
    expect(single?.executionParameters?.sideOrder).toBe("BY_SIDE");
  });

  it("P3-10/profile-new-only — PC/CR/Fin enregistrés 7/3/2 inchangés après une modification du Profil", async () => {
    const repository = new SqliteActivityDefinitionRepository(database, ids("def"));
    const created = await save(repository, input(canonical({ sideRecoverySeconds: 7, countdownSeconds: 3, endSeconds: 2 })));
    await database.runAsync(
      "UPDATE profiles SET side_change_recovery_seconds_default = 60, exercise_countdown_seconds_default = 60, exercise_end_seconds_default = 60",
    );
    const reopened = await repository.findById(created.id);
    expect(reopened?.executionParameters).toEqual(
      expect.objectContaining({ sideRecoverySeconds: 7, countdownSeconds: 3, endSeconds: 2 }),
    );
  });

  it("P3-10/legacy-neutral-proposal et P3-17/corrupt-version — ancien objet sans JSON : neutre 0 sans Profil ; JSON corrompu : erreur explicite", async () => {
    await database.runAsync(
      "UPDATE profiles SET exercise_countdown_seconds_default = 60, exercise_end_seconds_default = 60",
    );
    await database.runAsync(
      `INSERT INTO activity_definitions (id, name, description, execution_mode, duration_seconds, repetition_count,
        series_count, pause_seconds, side_mode, created_at, updated_at, category_id, side_recovery_seconds)
       VALUES ('legacy', 'Ancien', NULL, 'REPETITIONS', NULL, 12, 3, 45, 'LEFT_RIGHT', 'now', 'now', 'cardio', 9)`,
    );
    const repository = new SqliteActivityDefinitionRepository(database, ids("def"));
    expect((await repository.findById("legacy"))?.executionParameters).toEqual({
      version: 1,
      mode: "REPETITIONS",
      series: { kind: "UNIFORM", count: 3, target: 12, pauseSeconds: 45 },
      sideMode: "LEFT_RIGHT",
      sideOrder: "BY_SIDE",
      sideRecoverySeconds: 9,
      cadenceBeepIntervalSeconds: 0,
      countdownSeconds: 0,
      endSeconds: 0,
    });
    await database.runAsync("UPDATE activity_definitions SET execution_parameters = '{\"version\":7}' WHERE id = 'legacy'");
    await expect(repository.findById("legacy")).rejects.toThrow(ExecutionParametersDataError);
  });

  it("P3-11/all-modes-bip — le même bip valide est relu dans les trois modes", async () => {
    const repository = new SqliteActivityDefinitionRepository(database, ids("def"));
    for (const [mode, target] of [
      ["DURATION", 30],
      ["REPETITIONS", 12],
      ["TO_FAILURE", null],
    ] as const) {
      for (const beep of [0, 1, 10]) {
        const parameters = canonical({
          mode,
          series: { kind: "UNIFORM", count: 2, target, pauseSeconds: 5 },
          cadenceBeepIntervalSeconds: beep,
        });
        const created = await save(repository, input(parameters));
        expect((await repository.findById(created.id))?.executionParameters?.cadenceBeepIntervalSeconds).toBe(beep);
      }
    }
  });

  it("P3-15/no-storage — aucune colonne ni clé de phrase/segment n'est persistée", async () => {
    const repository = new SqliteActivityDefinitionRepository(database, ids("def"));
    const created = await save(repository, input(canonical()));
    const columns = (await database.getAllAsync<{ name: string }>("PRAGMA table_info(activity_definitions)")).map((c) => c.name);
    expect(columns.some((name) => /phrase|segment|summary|total/i.test(name))).toBe(false);
    const row = await database.getFirstAsync<{ execution_parameters: string }>(
      "SELECT execution_parameters FROM activity_definitions WHERE id = ?",
      [created.id],
    );
    expect(Object.keys(JSON.parse(row!.execution_parameters))).toEqual([
      "version",
      "mode",
      "series",
      "sideMode",
      "sideOrder",
      "sideRecoverySeconds",
      "cadenceBeepIntervalSeconds",
      "countdownSeconds",
      "endSeconds",
    ]);
  });

  it("P3-16/failure-doubletap et P3-17/transaction-FK — asset inconnu : rollback complet ; réessai : une seule définition", async () => {
    const repository = new SqliteActivityDefinitionRepository(database, ids("def"));
    const broken = input(canonical(), { media: [{ assetId: "p1", asset: photo("p1") }, { assetId: "unknown" }] });
    await expect(save(repository, broken)).rejects.toThrow();
    const counts = async () =>
      database.getFirstAsync<Record<string, number>>(
        "SELECT (SELECT COUNT(*) FROM activity_definitions) AS d, (SELECT COUNT(*) FROM media_assets) AS a, (SELECT COUNT(*) FROM activity_media) AS l",
      );
    expect(await counts()).toEqual({ d: 0, a: 0, l: 0 });
    const retry = input(canonical(), { media: [{ assetId: "p1", asset: photo("p1") }, { assetId: "v1", asset: video("v1") }] });
    await save(repository, retry);
    expect(await counts()).toEqual({ d: 1, a: 2, l: 2 });
    expect(await database.getAllAsync("PRAGMA foreign_key_check")).toEqual([]);
  });

  it("P3-17/canonical-roundtrip et P3-23/import-multiple — base fichier fermée puis rouverte : paramètres, ordre et métadonnées intacts", async () => {
    const path = join(tmpdir(), `kodjo-pre3-${Date.now()}-${Math.random().toString(16).slice(2)}.db`);
    const fileDatabase = NodeSqliteDatabase.openFile(path);
    try {
      await migrateDatabase(fileDatabase);
      const repository = new SqliteActivityDefinitionRepository(fileDatabase, ids("def"));
      const extremes = [
        canonical({ mode: "REPETITIONS", series: { kind: "UNIFORM", count: 99, target: 100, pauseSeconds: 300 } }),
        canonical({ mode: "TO_FAILURE", series: { kind: "VARIABLE", rows: [{ target: null, pauseSeconds: 0 }, { target: null, pauseSeconds: 300 }] } }),
        canonical({ mode: "DURATION", series: { kind: "UNIFORM", count: 1, target: 5999, pauseSeconds: 0 }, sideOrder: "BY_SIDE" }),
      ];
      const media = [
        { assetId: "p1", asset: photo("p1") },
        { assetId: "v1", asset: video("v1") },
        { assetId: "p2", asset: photo("p2") },
      ];
      const createdIds: string[] = [];
      for (const parameters of extremes) {
        createdIds.push((await save(repository, input(parameters, { media }))).id);
      }
      fileDatabase.close();

      const reopenedDatabase = NodeSqliteDatabase.openFile(path);
      try {
        const reopened = new SqliteActivityDefinitionRepository(reopenedDatabase, ids("def"));
        for (const [index, id] of createdIds.entries()) {
          const definition = await reopened.findById(id);
          expect(definition?.executionParameters).toEqual(extremes[index]);
          expect(definition?.media?.map((item) => item.asset)).toEqual([photo("p1"), video("v1"), photo("p2")]);
        }
      } finally {
        reopenedDatabase.close();
      }
    } finally {
      rmSync(path, { force: true });
      rmSync(`${path}-wal`, { force: true });
      rmSync(`${path}-shm`, { force: true });
    }
  });

  it("un ancien appelant sans médias ni paramètres canoniques ne perd ni les liens ni le JSON existant", async () => {
    const repository = new SqliteActivityDefinitionRepository(database, ids("def"));
    const created = await save(repository, input(canonical(), { media: [{ assetId: "p1", asset: photo("p1") }] }));
    const legacyCaller = {
      name: "Renommé",
      description: null,
      executionMode: "DURATION" as const,
      durationSeconds: 99,
      repetitionCount: null,
      seriesCount: 9,
      pauseSeconds: 9,
      category: { kind: "EXISTING" as const, categoryId: "cardio" },
      bodyZoneIds: ["cuisses"],
      sideRecoverySeconds: 0,
    };
    const updated = await repository.update(created.id, legacyCaller);
    expect(updated?.name).toBe("Renommé");
    expect(updated?.executionParameters).toEqual(canonical());
    expect(updated?.seriesCount).toBe(3);
    expect(updated?.media?.map((item) => item.assetId)).toEqual(["p1"]);
  });
});
