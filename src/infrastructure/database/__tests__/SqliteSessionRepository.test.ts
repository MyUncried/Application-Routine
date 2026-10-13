import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { render, screen as rnScreen } from "@testing-library/react-native";
import * as Crypto from "expo-crypto";
import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { createElement } from "react";
import { StyleSheet } from "react-native";

import { SessionValidationError } from "@/domain/sessions/errors";
import {
  DEFAULT_SESSION_COLOR,
  type CreateSessionExerciseInput,
  type CreateSessionInput,
  type UpdateSessionActivityInput,
  type UpdateSessionInput,
 CreateSessionActivityInput, Session } from "@/domain/sessions/Session";
import type { Database, SqlParameters } from "@/infrastructure/database/Database";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import {
  assembleSession,
  SqliteSessionRepository,
 RetiredOccurrenceCategoryError } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import type { SessionAggregateRow } from "@/infrastructure/database/types/DatabaseRows";
import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  ExecutionParametersDataError,
  resolveExecutionParameters,
  type ExecutionParameters,
} from "@/domain/activities/ExecutionParameters";
import type { MediaAsset } from "@/domain/media/MediaAsset";
import { toSessionDurationResult } from "@/domain/sessions/calculations";
import { duplicateActivity } from "@/domain/sessions/composition";

import { toSessionDraft, toUpdateSessionInput, type SessionDraft } from "@/domain/sessions/SessionDraft";

import { SqliteMediaRepository } from "@/infrastructure/database/repositories/SqliteMediaRepository";
// Exceptionnellement, ce fichier d'infrastructure importe un composant de
// présentation (`SessionCard`) — voir la note de tête du test « propagates
// the exact persisted yellow colour... » ci-dessous (correction REVISION
// tentative 4, commentaire de revue 5559366973, point 1) : la revue exige
// explicitement une preuve de propagation ininterrompue repository → modèle
// de Catalogue → composant, jamais deux tests disjoints reliés par la seule
// coïncidence d'un littéral de couleur partagé. Fichier `.ts` (pas `.tsx`) :
// le rendu passe donc par `createElement` plutôt que la syntaxe JSX, non
// transformée dans un fichier `.ts` — même patron déjà établi par
// `useSessionCatalogue.test.ts`.
import { SessionCard } from "@/features/sessions/SessionCard";

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
      postActivityRecoverySeconds: 0,
      bodyZoneIds: [],
    });
    expect(created.labelId).toBeNull();
    expect(reopened).toEqual(created);
    expect(summaries).toEqual([
      expect.objectContaining({
        id: created.id,
        activityCount: 1,
        // T02-S01 : la durée estimée affichée est celle des seules Activités
        // (`1 × 30 s`) — le Compte à rebours initial (`10 s`) et la Fin de
        // séance (`5 s`) en sont exclus (clarifications n° 3/4/5 du verdict
        // de revue de la tranche), là où T01 les additionnait (`45 s`).
        estimatedDurationSeconds: 30,
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

  // T02-S01 (AC-01/AC-12, plan §10.3) : la création persistait jusqu'ici des
  // littéraux fixes (`'EXERCISE'`, `IN_TOUR`, `tour_id` du Tour pour toute
  // Activité, `repeat_count = 1`). Le round-trip suivant démontre que la
  // structure réelle est conservée de bout en bout.
  it("creates the three structural zones with per-zone positions, a NULL tour_id outside the Tour and the real tour repeat count", async () => {
    const repository = new SqliteSessionRepository(database, uuidFactory());
    const created = await repository.create({
      ...validInput(),
      tourRepeatCount: 99,
      exercises: [
        { ...anExercise(), id: "warmup", name: "Échauffement", structuralPosition: "BEFORE_TOUR" },
        { ...anExercise(), id: "core-1", name: "Gainage", structuralPosition: "IN_TOUR" },
        { ...anExercise(), id: "core-2", name: "Squats", structuralPosition: "IN_TOUR" },
        // T02-S02 : cette quatrième Activité était une Récupération AUTONOME
        // (`type: "RECOVERY"`), désormais interdite par le Domaine ; elle
        // devient un Exercice ordinaire portant une Récupération ATTACHÉE.
        {
          ...anExercise(),
          id: "stretch",
          name: "Étirements",
          structuralPosition: "AFTER_TOUR",
          durationSeconds: 45,
          postActivityRecoverySeconds: 30,
        },
      ],
    });

    expect(created.cycle.tour.repeatCount).toBe(99);
    expect(created.cycle.beforeTour?.map((activity) => activity.id)).toEqual(["warmup"]);
    expect(created.cycle.tour.exercises.map((activity) => activity.id)).toEqual([
      "core-1",
      "core-2",
    ]);
    expect(created.cycle.afterTour?.map((activity) => activity.id)).toEqual(["stretch"]);
    expect(created.cycle.afterTour?.[0]).toMatchObject({
      type: "EXERCISE",
      executionMode: "DURATION",
      durationSeconds: 45,
      postActivityRecoverySeconds: 30,
    });

    const rows = await database.getAllAsync<{
      id: string;
      structural_position: string;
      position: number;
      tour_id: string | null;
      type: string;
    }>(
      `SELECT id, structural_position, position, tour_id, type FROM activities
       WHERE session_id = ? ORDER BY structural_position, position`,
      [created.id],
    );
    expect(rows).toEqual([
      {
        id: "stretch",
        structural_position: "AFTER_TOUR",
        position: 0,
        tour_id: null,
        type: "EXERCISE",
      },
      {
        id: "warmup",
        structural_position: "BEFORE_TOUR",
        position: 0,
        tour_id: null,
        type: "EXERCISE",
      },
      {
        id: "core-1",
        structural_position: "IN_TOUR",
        position: 0,
        tour_id: created.cycle.tour.id,
        type: "EXERCISE",
      },
      {
        id: "core-2",
        structural_position: "IN_TOUR",
        position: 1,
        tour_id: created.cycle.tour.id,
        type: "EXERCISE",
      },
    ]);

    // Réouverture fidèle : l'agrégat relu est rigoureusement identique.
    expect(await repository.findById(created.id)).toEqual(created);
  });

  it("keeps the draft identifier of an Activity when one is provided, and generates one otherwise", async () => {
    const repository = new SqliteSessionRepository(database, uuidFactory());
    const created = await repository.create({
      ...validInput(),
      exercises: [
        { ...anExercise(), id: "kept-id", name: "Gainage" },
        { ...anExercise(), name: "Squats" },
      ],
    });

    const ids = created.cycle.tour.exercises.map((activity) => activity.id);
    expect(ids[0]).toBe("kept-id");
    expect(ids[1]).toBe(IDS[3]);
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
      tourRepeatCount: 1,
      name: "Nom valide",
      initialCountdownSeconds: -1,
      finalPhaseSeconds: 5,
      exercises: [anExercise()],
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
    expect(() => assembleSession([incoherentRow], new Map())).toThrow("does not satisfy");
  });

  it("rejects a row whose session status is ARCHIVED", () => {
    const archivedRow: SessionAggregateRow = { ...validRow(), status: "ARCHIVED" };
    expect(() => assembleSession([archivedRow], new Map())).toThrow("does not satisfy");
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
    // n'apparaissait pas jaune pour une Séance existante. V2-PRE-1 (plan
    // §3.3) : `sessions.color` autonome est retiré — la couleur est
    // désormais DÉRIVÉE de l'Étiquette jointe (`labels.color`).
    it("restores the exact persisted colour via the Session's Label, including the yellow of the palette (#F7D154), never a default fallback", async () => {
      await database.runAsync(
        `INSERT INTO labels (id, name, canonical_key, color, is_active, created_at) VALUES (?, ?, ?, '#F7D154', 1, ?)`,
        ["label-yellow", "Jaune", "jaune", "2026-01-01T00:00:00.000Z"],
      );
      const repository = new SqliteSessionRepository(database, uuidFactory());
      const created = await repository.create({ ...validInput(), labelId: "label-yellow" });

      const summaries = await repository.listActive();
      const summary = summaries.find((item) => item.id === created.id);
      expect(summary?.color).toBe("#F7D154");
    });

    it("falls back to the default colour with an empty categoryNames and an empty bodyZoneNames for a Session with no Label and no body zone", async () => {
      const repository = new SqliteSessionRepository(database, uuidFactory());
      const created = await repository.create({
        ...validInput(),
        exercises: [{ ...anExercise(), bodyZoneIds: [] }],
      });

      const summaries = await repository.listActive();
      const summary = summaries.find((item) => item.id === created.id);
      expect(summary?.color).toBe(DEFAULT_SESSION_COLOR);
      expect(summary?.categoryNames).toEqual([]);
      expect(summary?.bodyZoneNames).toEqual([]);
    });

    // Correction REVISION tentative 3 (feedback : « le test actuel via
    // repository.create() ne reproduit pas ce cas ») : `repository.create()`
    // rejoue systématiquement le code applicatif actuel — il ne peut donc
    // jamais matérialiser une ligne réellement antérieure à un correctif ou
    // à l'existence même du code qui l'écrit. Ce test insère la Séance
    // directement au niveau SQL (`labels`/`sessions`/`cycles`/`tours`/
    // `activities`), en contournant entièrement `SqliteSessionRepository`,
    // exactement comme le ferait une ligne déjà présente en base avant toute
    // exécution du code applicatif de ce dépôt.
    //
    // Correction REVISION tentative 4 (commentaire de revue 5559366973,
    // point 1) : complété pour prouver la propagation ININTERROMPUE
    // repository → `SessionSummary` (modèle de Catalogue) → composant
    // `SessionCard` — jamais deux preuves disjointes reliées par la seule
    // coïncidence d'un littéral `#F7D154` partagé.
    it("propagates the exact persisted yellow colour, unbroken, from a Session inserted directly at the SQL layer through SqliteSessionRepository.listActive() to SessionCard's rendered colour bar (genuine historical/pre-existing row, not a repository.create() stand-in)", async () => {
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
      const labelId = "historical-label-1";
      const timestamp = "2025-01-01T00:00:00.000Z";

      await database.runAsync(
        `INSERT INTO labels (id, name, canonical_key, color, is_active, created_at) VALUES (?, ?, ?, '#F7D154', 1, ?)`,
        [labelId, "Jaune historique", "jaune historique", timestamp],
      );
      await database.runAsync(
        `INSERT INTO sessions (
          id, owner_id, name, label_id, status,
          initial_countdown_seconds, final_phase_seconds,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, 'ACTIVE', 10, 5, ?, ?)`,
        [sessionId, owner.id, "Séance historique", labelId, timestamp, timestamp],
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

      // Étape 1 : repository → modèle de Catalogue (`SessionSummary`).
      expect(summary).toBeDefined();
      expect(summary?.color).toBe("#F7D154");
      expect(summary?.bodyZoneNames).toEqual([]);

      // Étape 2 : modèle de Catalogue → composant `SessionCard` — même
      // objet `summary` que ci-dessus, sans reconstruction ni littéral
      // dupliqué, transmis tel quel au composant réellement utilisé par
      // l'écran Catalogue.
      render(createElement(SessionCard, { session: summary! }));

      const colorBar = rnScreen.getByTestId("session-card-color-bar");
      expect(StyleSheet.flatten(colorBar.props.style).backgroundColor).toBe("#F7D154");
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

    it("applies the canonical formula D = C × A + C × B in SQL when there is no Récupération, exactly like the Domain (T02-S02)", async () => {
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
      // Aucune Récupération : (2×30 + 2×5) + (1×20 + 1×0) = 70 + 20 = 90 s
      // d'Activités. T02-S01 exclut par ailleurs le Compte à rebours initial
      // et la Fin de séance de la durée affichée. Secondes brutes, aucun
      // arrondi à ce niveau.
      expect(summary?.estimatedDurationSeconds).toBe(90);
      expect(summary?.activityCount).toBe(2);
    });

    /**
     * Parité SQL / Domaine du CAS CHARNIÈRE de la règle conditionnelle : deux
     * Activités identiques à la Récupération près doivent différer d'exactement
     * `B − R` — c'est la preuve que SQL applique bien la MÊME bascule que
     * `computePauseOccurrences`, et non une formule voisine.
     */
    it("switches the pause count in SQL on the presence of a Récupération, exactly like computePauseOccurrences", async () => {
      const repository = new SqliteSessionRepository(database, uuidFactory());
      const withoutRecovery = await repository.create({
        ...validInput(),
        name: "Sans récupération",
        exercises: [
          { ...anExercise(), durationSeconds: 30, seriesCount: 3, pauseSeconds: 10 },
        ],
      });
      const withRecoveryRepository = new SqliteSessionRepository(
        database,
        secondUuidFactory(),
      );
      const withRecovery = await withRecoveryRepository.create({
        ...validInput(),
        name: "Avec récupération",
        exercises: [
          {
            ...anExercise(),
            durationSeconds: 30,
            seriesCount: 3,
            pauseSeconds: 10,
            postActivityRecoverySeconds: 10,
          },
        ],
      });

      const summaries = await repository.listActive();
      // Sans Récupération : 3×30 + 3×10 = 120.
      expect(
        summaries.find((item) => item.id === withoutRecovery.id)?.estimatedDurationSeconds,
      ).toBe(120);
      // Avec une Récupération ÉGALE à la Pause : 3×30 + 2×10 + 10 = 120 —
      // rigoureusement identique, puisque la Récupération REMPLACE la
      // dernière Pause au lieu de s'y ajouter.
      expect(summaries.find((item) => item.id === withRecovery.id)?.estimatedDurationSeconds).toBe(
        120,
      );
    });

    it("adds the attached Récupération once per Activity in the SQL projection (T02-S02)", async () => {
      const repository = new SqliteSessionRepository(database, uuidFactory());
      const created = await repository.create({
        ...validInput(),
        exercises: [
          {
            ...anExercise(),
            name: "Un",
            durationSeconds: 30,
            seriesCount: 3,
            pauseSeconds: 15,
            postActivityRecoverySeconds: 20,
          },
        ],
      });

      const summaries = await repository.listActive();
      // 3 × 30 + 2 × 15 + 20 = 140 s — la Récupération compte UNE fois,
      // jamais une fois par Série.
      expect(summaries.find((item) => item.id === created.id)?.estimatedDurationSeconds).toBe(140);
    });

    it("still counts the pauses of a REPETITIONS Activity C − 1 times, plus its Récupération, without any conventional duration (RM-072/RM-132)", async () => {
      const repository = new SqliteSessionRepository(database, uuidFactory());
      const created = await repository.create({
        ...validInput(),
        exercises: [
          {
            ...anExercise(),
            name: "Squats",
            executionMode: "REPETITIONS",
            durationSeconds: null,
            repetitionCount: 12,
            seriesCount: 4,
            pauseSeconds: 10,
            postActivityRecoverySeconds: 25,
          },
        ],
      });

      const summary = (await repository.listActive()).find((item) => item.id === created.id);
      // Récupération présente : 3 × 10 + 25 = 55 s, borne minimale.
      expect(summary?.estimatedDurationSeconds).toBe(55);
      expect(summary?.isEstimatedDurationApproximate).toBe(true);
    });

    // T02-S01 (AC-10, clarifications n° 2/3/5 du verdict de revue) : la
    // projection SQL applique les règles PAR ZONE — le compteur reste celui
    // des Activités réellement composées (chacune une fois), tandis que la
    // durée développe `tourRepeatCount` sur la SEULE zone `IN_TOUR`.
    it("counts every Activity once but multiplies only the IN_TOUR duration by the tour repeat count", async () => {
      const repository = new SqliteSessionRepository(database, uuidFactory());
      const created = await repository.create({
        ...validInput(),
        tourRepeatCount: 3,
        exercises: [
          {
            ...anExercise(),
            name: "Échauffement",
            structuralPosition: "BEFORE_TOUR",
            durationSeconds: 10,
          },
          { ...anExercise(), name: "Gainage", structuralPosition: "IN_TOUR", durationSeconds: 20 },
          {
            ...anExercise(),
            name: "Étirements",
            structuralPosition: "AFTER_TOUR",
            durationSeconds: 5,
          },
        ],
      });

      const summaries = await repository.listActive();
      const summary = summaries.find((item) => item.id === created.id);
      // 10 + (20 × 3) + 5 = 75 s ; trois Activités composées, jamais cinq.
      expect(summary?.estimatedDurationSeconds).toBe(75);
      expect(summary?.activityCount).toBe(3);
      expect(summary?.tourRepeatCount).toBe(3);
    });

    // T01-S10, plan §7.2 / D-110 / RM-110 / AC-14 : le tri par défaut est
    // `updated_at DESC` — jamais `COALESCE(last_executed_at, updated_at)`.
    // Une Exécution (qui alimenterait `last_executed_at`) ne modifie pas
    // l'ordre du Catalogue. Ré-écriture du test `COALESCE` historique.
    it("sorts by updated_at DESC, and a later last_executed_at never changes the order (D-110)", async () => {
      const clockOldest = fixedClock(["2026-01-01T00:00:00.000Z"]);
      const repositoryOldest = new SqliteSessionRepository(database, uuidFactory(), clockOldest);
      const sessionOldest = await repositoryOldest.create({ ...validInput(), name: "Créée en premier" });

      const clockMiddle = fixedClock(["2026-01-02T00:00:00.000Z"]);
      const repositoryMiddle = new SqliteSessionRepository(database, secondUuidFactory(), clockMiddle);
      const sessionMiddle = await repositoryMiddle.create({ ...validInput(), name: "Créée ensuite" });

      const clockNewest = fixedClock(["2026-01-03T00:00:00.000Z"]);
      const repositoryNewest = new SqliteSessionRepository(database, thirdUuidFactory(), clockNewest);
      const sessionNewest = await repositoryNewest.create({ ...validInput(), name: "Créée en dernier" });

      // `last_executed_at` renseigné à l'inverse de `updated_at` : il ne doit
      // rien changer à l'ordre.
      await database.runAsync("UPDATE sessions SET last_executed_at = ? WHERE id = ?", [
        "2026-02-01T00:00:00.000Z",
        sessionOldest.id,
      ]);

      const summaries = await repositoryOldest.listActive();

      expect(summaries.map((summary) => summary.id)).toEqual([
        sessionNewest.id,
        sessionMiddle.id,
        sessionOldest.id,
      ]);
    });

    // T01-S09, correction VISUAL tentative 2 (point B) : `categoryNames`/
    // `bodyZoneNames`, restaurés sur `SessionSummary` pour la ligne manquante
    // sous le nom de la Séance (CE-T01-03).
    it("exposes an empty categoryNames and an empty bodyZoneNames when the Session has neither (zero value)", async () => {
      const repository = new SqliteSessionRepository(database, uuidFactory());
      const created = await repository.create(validInput());

      const summaries = await repository.listActive();
      const summary = summaries.find((item) => item.id === created.id);
      expect(summary?.categoryNames).toEqual([]);
      expect(summary?.bodyZoneNames).toEqual([]);
    });

    it("exposes exactly one bodyZoneName (one value)", async () => {
      const repository = new SqliteSessionRepository(database, uuidFactory());
      const created = await repository.create({
        ...validInput(),
        exercises: [{ ...anExercise(), bodyZoneIds: ["genoux"] }],
      });

      const summaries = await repository.listActive();
      const summary = summaries.find((item) => item.id === created.id);
      expect(summary?.bodyZoneNames).toEqual(["Genoux"]);
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

    it("scopes bodyZoneNames per Session — never leaks another Session's values (multiple Sessions in the same listActive() call)", async () => {
      const repository = new SqliteSessionRepository(database, uuidFactory());
      const first = await repository.create({
        ...validInput(),
        name: "Première",
        exercises: [{ ...anExercise(), bodyZoneIds: ["genoux"] }],
      });

      const secondRepository = new SqliteSessionRepository(database, secondUuidFactory());
      const second = await secondRepository.create({
        ...validInput(),
        name: "Deuxième",
        exercises: [{ ...anExercise(), bodyZoneIds: ["dos"] }],
      });

      const summaries = await repository.listActive();
      expect(summaries.find((item) => item.id === first.id)?.bodyZoneNames).toEqual(["Genoux"]);
      expect(summaries.find((item) => item.id === second.id)?.bodyZoneNames).toEqual(["Dos"]);
    });
  });

  /**
   * V2-PRE-1 (plan §3.3/§7, REQ-001108DC7F67664C) : `session_stop_points`
   * référence la Séance directement — `position` est renumérotée SÉPARÉMENT
   * PAR portée, même politique que les Activités.
   */
  describe("Points d'arrêt (V2-PRE-1, plan §3.3/§7, REQ-001108DC7F67664C)", () => {
    // `randomUUID` plutôt que `uuidFactory()` (liste `IDS` finie, consommée
    // par session/cycle/tour/activités) : ces scénarios persistent aussi des
    // Points d'arrêt, chacun consommant son propre identifiant.
    it("create(): persists stop points with a position stable per scope, and rereads them in scope then position order", async () => {
      const repository = new SqliteSessionRepository(database, randomUUID);

      const created = await repository.create({
        ...validInput(),
        stopPoints: [
          { scope: "IN_TOUR" },
          { scope: "BEFORE_TOUR" },
          { scope: "IN_TOUR" },
        ],
      });

      expect(created.stopPoints).toEqual([
        { id: expect.any(String), scope: "BEFORE_TOUR", order: 0 },
        { id: expect.any(String), scope: "IN_TOUR", order: 0 },
        { id: expect.any(String), scope: "IN_TOUR", order: 1 },
      ]);

      const reread = await repository.findById(created.id);
      expect(reread?.stopPoints).toEqual(created.stopPoints);
    });

    it("create(): omits stopPoints entirely from the read aggregate when none was given — never an empty array", async () => {
      const repository = new SqliteSessionRepository(database, uuidFactory());

      const created = await repository.create(validInput());

      expect(created.stopPoints).toBeUndefined();
    });

    it("update(): replaces the previous stop points entirely, with the new array's own per-scope order", async () => {
      const repository = new SqliteSessionRepository(database, randomUUID);
      const created = await repository.create({
        ...validInput(),
        stopPoints: [{ scope: "IN_TOUR" }],
      });

      const outcome = await repository.update(created.id, {
        sourceSessionId: created.id,
        name: created.name,
        labelId: null,
        initialCountdownSeconds: created.initialCountdownSeconds,
        finalPhaseSeconds: created.finalPhaseSeconds,
        tourRepeatCount: created.cycle.tour.repeatCount,
        activities: [anUpdateActivity({ id: created.cycle.tour.exercises[0]!.id })],
        stopPoints: [{ scope: "AFTER_TOUR" }, { scope: "AFTER_TOUR" }],
      });

      expect(outcome.status).toBe("UPDATED");
      if (outcome.status === "UPDATED") {
        expect(outcome.session.stopPoints).toEqual([
          { id: expect.any(String), scope: "AFTER_TOUR", order: 0 },
          { id: expect.any(String), scope: "AFTER_TOUR", order: 1 },
        ]);
      }
    });
  });

  describe("update — modification bout en bout par identité (T01-S10, plan §5.2)", () => {
    it("updates a kept Activity in place: same identifier, session/cycle/tour identifiers preserved", async () => {
      const repository = new SqliteSessionRepository(database, uuidFactory());
      const created = await repository.create(validInput());
      const keptId = created.cycle.tour.exercises[0]!.id;

      const outcome = await repository.update(
        created.id,
        anUpdateInput({
          sourceSessionId: created.id,
          name: "Nom modifié",
          activities: [anUpdateActivity({ id: keptId, name: "Gainage renforcé", durationSeconds: 45 })],
        }),
      );

      expect(outcome.status).toBe("UPDATED");
      if (outcome.status !== "UPDATED") throw new Error("expected UPDATED");
      expect(outcome.session.id).toBe(created.id);
      expect(outcome.session.cycle.id).toBe(created.cycle.id);
      expect(outcome.session.cycle.tour.id).toBe(created.cycle.tour.id);
      expect(outcome.session.name).toBe("Nom modifié");
      expect(outcome.session.cycle.tour.exercises).toHaveLength(1);
      expect(outcome.session.cycle.tour.exercises[0]).toMatchObject({
        id: keptId,
        name: "Gainage renforcé",
        durationSeconds: 45,
      });

      const reopened = await repository.findById(created.id);
      expect(reopened?.cycle.tour.exercises[0]?.id).toBe(keptId);
    });

    it("adds a new Activity, removes a dropped one, keeps the survivor's id", async () => {
      const repository = new SqliteSessionRepository(database, uuidFactory());
      const created = await repository.create({
        ...validInput(),
        exercises: [
          { ...anExercise(), name: "À garder" },
          { ...anExercise(), name: "À supprimer" },
        ],
      });
      const keptId = created.cycle.tour.exercises[0]!.id;

      const outcome = await repository.update(
        created.id,
        anUpdateInput({
          sourceSessionId: created.id,
          activities: [
            anUpdateActivity({ id: keptId, name: "À garder", position: 0 }),
            anUpdateActivity({ id: "brand-new-activity", name: "Nouvelle", position: 1 }),
          ],
        }),
      );

      expect(outcome.status).toBe("UPDATED");
      if (outcome.status !== "UPDATED") throw new Error("expected UPDATED");
      expect(outcome.session.cycle.tour.exercises.map((exercise) => exercise.name)).toEqual([
        "À garder",
        "Nouvelle",
      ]);
      expect(outcome.session.cycle.tour.exercises.map((exercise) => exercise.id)).toEqual([
        keptId,
        "brand-new-activity",
      ]);
    });

    it("persists tour.repeatCount and rereads it (aggregate + catalogue summary)", async () => {
      const repository = new SqliteSessionRepository(database, uuidFactory());
      const created = await repository.create(validInput());
      const keptId = created.cycle.tour.exercises[0]!.id;

      const outcome = await repository.update(
        created.id,
        anUpdateInput({
          sourceSessionId: created.id,
          tourRepeatCount: 7,
          activities: [anUpdateActivity({ id: keptId })],
        }),
      );

      expect(outcome.status).toBe("UPDATED");
      if (outcome.status !== "UPDATED") throw new Error("expected UPDATED");
      expect(outcome.session.cycle.tour.repeatCount).toBe(7);
      const reopened = await repository.findById(created.id);
      expect(reopened?.cycle.tour.repeatCount).toBe(7);
      const summaries = await repository.listActive();
      expect(summaries.find((s) => s.id === created.id)?.tourRepeatCount).toBe(7);
    });

    /**
     * T02-S02 — remplace « persiste une Activité RECOVERY » : la Récupération
     * n'est plus une Activité mais une durée ATTACHÉE, écrite et relue sur la
     * même ligne que l'Exercice qu'elle suit.
     */
    it("persists the attached Récupération through an update and rereads it", async () => {
      const repository = new SqliteSessionRepository(database, uuidFactory());
      const created = await repository.create(validInput());
      const keptId = created.cycle.tour.exercises[0]!.id;

      const outcome = await repository.update(
        created.id,
        anUpdateInput({
          sourceSessionId: created.id,
          activities: [
            anUpdateActivity({
              id: keptId,
              name: "Exercice",
              position: 0,
              postActivityRecoverySeconds: 45,
            }),
          ],
        }),
      );

      expect(outcome.status).toBe("UPDATED");
      if (outcome.status !== "UPDATED") throw new Error("expected UPDATED");
      const reopened = await repository.findById(created.id);
      expect(reopened?.cycle.tour.exercises[0]).toMatchObject({
        id: keptId,
        postActivityRecoverySeconds: 45,
      });

      // Remise à zéro : la Récupération doit pouvoir être RETIRÉE, jamais
      // seulement augmentée — une valeur `0` est écrite, pas ignorée.
      await repository.update(
        created.id,
        anUpdateInput({
          sourceSessionId: created.id,
          activities: [anUpdateActivity({ id: keptId, name: "Exercice", position: 0 })],
        }),
      );
      const cleared = await repository.findById(created.id);
      expect(cleared?.cycle.tour.exercises[0]).toMatchObject({ postActivityRecoverySeconds: 0 });
    });

    it("persists the attached Récupération of a brand-new Activity created during an update", async () => {
      const repository = new SqliteSessionRepository(database, uuidFactory());
      const created = await repository.create(validInput());
      const keptId = created.cycle.tour.exercises[0]!.id;

      await repository.update(
        created.id,
        anUpdateInput({
          sourceSessionId: created.id,
          activities: [
            anUpdateActivity({ id: keptId, name: "Exercice", position: 0 }),
            anUpdateActivity({
              id: "added-1",
              name: "Ajoutée",
              position: 1,
              postActivityRecoverySeconds: 90,
            }),
          ],
        }),
      );

      const reopened = await repository.findById(created.id);
      expect(reopened?.cycle.tour.exercises.find((e) => e.id === "added-1")).toMatchObject({
        postActivityRecoverySeconds: 90,
      });
    });

    it("persists a TO_FAILURE Activity (no target) and rereads it; the estimate becomes a lower bound", async () => {
      const repository = new SqliteSessionRepository(database, uuidFactory());
      const created = await repository.create(validInput());
      const keptId = created.cycle.tour.exercises[0]!.id;

      const outcome = await repository.update(
        created.id,
        anUpdateInput({
          sourceSessionId: created.id,
          activities: [
            anUpdateActivity({
              id: keptId,
              name: "Tractions",
              executionMode: "TO_FAILURE",
              durationSeconds: null,
              repetitionCount: null,
              seriesCount: 4,
            }),
          ],
        }),
      );

      expect(outcome.status).toBe("UPDATED");
      if (outcome.status !== "UPDATED") throw new Error("expected UPDATED");
      const reopened = await repository.findById(created.id);
      expect(reopened?.cycle.tour.exercises[0]).toMatchObject({
        executionMode: "TO_FAILURE",
        durationSeconds: null,
        repetitionCount: null,
        seriesCount: 4,
      });
      const summaries = await repository.listActive();
      expect(summaries.find((s) => s.id === created.id)?.isEstimatedDurationApproximate).toBe(true);
    });

    it("rehydrates Activities before / in / after the Tour, in reading order", async () => {
      const repository = new SqliteSessionRepository(database, uuidFactory());
      const created = await repository.create(validInput());
      const keptId = created.cycle.tour.exercises[0]!.id;

      const outcome = await repository.update(
        created.id,
        anUpdateInput({
          sourceSessionId: created.id,
          activities: [
            anUpdateActivity({ id: "after-1", name: "Après", structuralPosition: "AFTER_TOUR", position: 0 }),
            anUpdateActivity({ id: keptId, name: "Dans", structuralPosition: "IN_TOUR", position: 0 }),
            anUpdateActivity({ id: "before-1", name: "Avant", structuralPosition: "BEFORE_TOUR", position: 0 }),
          ],
        }),
      );

      expect(outcome.status).toBe("UPDATED");
      if (outcome.status !== "UPDATED") throw new Error("expected UPDATED");
      const reopened = await repository.findById(created.id);
      expect(reopened?.cycle.beforeTour?.map((a) => a.name)).toEqual(["Avant"]);
      expect(reopened?.cycle.tour.exercises.map((a) => a.name)).toEqual(["Dans"]);
      expect(reopened?.cycle.afterTour?.map((a) => a.name)).toEqual(["Après"]);
    });

    it("preserves an Activity's body zones through an in-place update (replace, no loss)", async () => {
      const repository = new SqliteSessionRepository(database, uuidFactory());
      const created = await repository.create({
        ...validInput(),
        exercises: [{ ...anExercise(), bodyZoneIds: ["dos"] }],
      });
      const keptId = created.cycle.tour.exercises[0]!.id;

      await repository.update(
        created.id,
        anUpdateInput({
          sourceSessionId: created.id,
          activities: [anUpdateActivity({ id: keptId, bodyZoneIds: ["dos", "epaules"] })],
        }),
      );

      const reopened = await repository.findById(created.id);
      expect([...(reopened?.cycle.tour.exercises[0]?.bodyZoneIds ?? [])].sort()).toEqual([
        "dos",
        "epaules",
      ]);
    });

    it("replaces the Session's Label atomically", async () => {
      await database.runAsync(
        `INSERT INTO labels (id, name, canonical_key, color, is_active, created_at) VALUES (?, ?, ?, '#3B82F6', 1, ?)`,
        ["label-a", "Étiquette A", "etiquette a", "2026-01-01T00:00:00.000Z"],
      );
      await database.runAsync(
        `INSERT INTO labels (id, name, canonical_key, color, is_active, created_at) VALUES (?, ?, ?, '#E5484D', 1, ?)`,
        ["label-b", "Étiquette B", "etiquette b", "2026-01-01T00:00:00.000Z"],
      );
      const repository = new SqliteSessionRepository(database, uuidFactory());
      const created = await repository.create({
        ...validInput(),
        labelId: "label-a",
      });
      const keptId = created.cycle.tour.exercises[0]!.id;

      const outcome = await repository.update(
        created.id,
        anUpdateInput({
          sourceSessionId: created.id,
          activities: [anUpdateActivity({ id: keptId })],
          labelId: "label-b",
        }),
      );

      expect(outcome.status).toBe("UPDATED");
      if (outcome.status !== "UPDATED") throw new Error("expected UPDATED");
      expect(outcome.session.labelId).toBe("label-b");
    });

    it("returns NOT_FOUND and performs no write for an unknown id", async () => {
      const repository = new SqliteSessionRepository(database, uuidFactory());

      const outcome = await repository.update(
        "00000000-0000-4000-8000-000000000099",
        anUpdateInput({ sourceSessionId: "00000000-0000-4000-8000-000000000099" }),
      );

      expect(outcome).toEqual({ status: "NOT_FOUND" });
      const count = await database.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) AS count FROM sessions",
      );
      expect(count?.count).toBe(0);
    });

    it("returns ARCHIVED and performs no write for a session archived via direct SQL", async () => {
      const repository = new SqliteSessionRepository(database, uuidFactory());
      const created = await repository.create(validInput());
      const keptId = created.cycle.tour.exercises[0]!.id;

      await database.runAsync("UPDATE sessions SET status = 'ARCHIVED', archived_at = ? WHERE id = ?", [
        "2026-01-02T00:00:00.000Z",
        created.id,
      ]);

      const outcome = await repository.update(
        created.id,
        anUpdateInput({
          sourceSessionId: created.id,
          name: "Tentative de modification",
          activities: [anUpdateActivity({ id: keptId })],
        }),
      );

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
        repository.update(created.id, anUpdateInput({ sourceSessionId: created.id, name: "   " })),
      ).rejects.toBeInstanceOf(SessionValidationError);

      const row = await database.getFirstAsync<{ name: string; updated_at: string }>(
        "SELECT name, updated_at FROM sessions WHERE id = ?",
        [created.id],
      );
      expect(row?.name).toBe("Séance simple");
      expect(row?.updated_at).toBe(created.updatedAt);
    });

    // Revue indépendante LOT 2 (commentaire 5567655287, lacune 1) : preuve
    // déterministe du rollback INTÉGRAL sur une défaillance survenant AU
    // MILIEU de la transaction (dernière écriture — `INSERT INTO
    // activity_body_zones` — après mise à jour de la Séance, du Tour, fusion
    // des Activités et suppression des Zones précédentes). V2-PRE-1 (plan
    // §3.3) : la relation `session_categories` disparaît — la preuve
    // équivalente porte désormais sur l'Étiquette (`label_id`), seule
    // référence externe restante de la Séance.
    it("rolls back EVERY change when a mid-transaction step fails: session fields, updated_at, tour repeat, Activities + ids + positions and body zones", async () => {
      await database.runAsync(
        `INSERT INTO labels (id, name, canonical_key, color, is_active, created_at) VALUES (?, ?, ?, '#3B82F6', 1, ?)`,
        ["label-original", "Étiquette d'origine", "etiquette d'origine", "2026-01-01T00:00:00.000Z"],
      );
      await database.runAsync(
        `INSERT INTO labels (id, name, canonical_key, color, is_active, created_at) VALUES (?, ?, ?, '#E5484D', 1, ?)`,
        ["label-new", "Nouvelle étiquette", "nouvelle etiquette", "2026-01-01T00:00:00.000Z"],
      );
      const repository = new SqliteSessionRepository(
        database,
        uuidFactory(),
        fixedClock(["2026-01-01T00:00:00.000Z"]),
      );
      const created = await repository.create({
        ...validInput(),
        name: "Séance simple",
        labelId: "label-original",
        initialCountdownSeconds: 10,
        finalPhaseSeconds: 5,
        exercises: [
          { ...anExercise(), name: "Gainage", durationSeconds: 30, bodyZoneIds: ["dos"] },
          { ...anExercise(), name: "Squats", durationSeconds: 40 },
        ],
      });
      const keptId = created.cycle.tour.exercises[0]!.id;
      const droppedId = created.cycle.tour.exercises[1]!.id;

      // Snapshots AVANT — agrégat assemblé + lignes brutes.
      const before = await repository.findById(created.id);
      const beforeSessionRow = await database.getFirstAsync(
        `SELECT name, label_id, initial_countdown_seconds, final_phase_seconds, created_at, updated_at
         FROM sessions WHERE id = ?`,
        [created.id],
      );
      const beforeTourRow = await database.getFirstAsync(
        "SELECT repeat_count FROM tours WHERE session_id = ?",
        [created.id],
      );
      const beforeActivityRows = await database.getAllAsync(
        `SELECT id, name, type, structural_position, position, execution_mode,
                duration_seconds, repetition_count, series_count, pause_seconds,
                created_at, updated_at
         FROM activities WHERE session_id = ? ORDER BY position ASC`,
        [created.id],
      );
      const beforeZoneRows = await database.getAllAsync(
        `SELECT activity_id, body_zone_id FROM activity_body_zones
         WHERE activity_id IN (?, ?) ORDER BY activity_id, body_zone_id`,
        [keptId, droppedId],
      );

      // update() qui échoue à la dernière écriture, avec une horloge
      // DIFFÉRENTE (jamais rejouée si le rollback est intégral).
      const failingRepository = new SqliteSessionRepository(
        new FailingActivityBodyZoneInsertDatabase(database),
        secondUuidFactory(),
        fixedClock(["2026-06-15T12:00:00.000Z"]),
      );

      await expect(
        failingRepository.update(
          created.id,
          anUpdateInput({
            sourceSessionId: created.id,
            name: "Nom modifié",
            labelId: "label-new",
            initialCountdownSeconds: 20,
            finalPhaseSeconds: 15,
            tourRepeatCount: 5,
            activities: [
              anUpdateActivity({
                id: keptId,
                name: "Gainage renforcé",
                durationSeconds: 45,
                position: 0,
                bodyZoneIds: ["epaules"],
              }),
              anUpdateActivity({ id: "brand-new-activity", name: "Fentes", position: 1 }),
            ],
          }),
        ),
      ).rejects.toThrow("forced activity_body_zones failure");

      // Snapshots APRÈS — strictement identiques.
      expect(await repository.findById(created.id)).toEqual(before);

      expect(
        await database.getFirstAsync(
          `SELECT name, label_id, initial_countdown_seconds, final_phase_seconds, created_at, updated_at
           FROM sessions WHERE id = ?`,
          [created.id],
        ),
      ).toEqual(beforeSessionRow);
      expect((beforeSessionRow as { updated_at: string }).updated_at).toBe(
        "2026-01-01T00:00:00.000Z",
      );
      expect((beforeSessionRow as { label_id: string }).label_id).toBe("label-original");

      expect(
        await database.getFirstAsync("SELECT repeat_count FROM tours WHERE session_id = ?", [
          created.id,
        ]),
      ).toEqual(beforeTourRow);
      expect((beforeTourRow as { repeat_count: number }).repeat_count).toBe(1);

      expect(
        await database.getAllAsync(
          `SELECT id, name, type, structural_position, position, execution_mode,
                  duration_seconds, repetition_count, series_count, pause_seconds,
                  created_at, updated_at
           FROM activities WHERE session_id = ? ORDER BY position ASC`,
          [created.id],
        ),
      ).toEqual(beforeActivityRows);
      const afterActivityIds = (
        await database.getAllAsync<{ id: string }>(
          "SELECT id FROM activities WHERE session_id = ?",
          [created.id],
        )
      ).map((row) => row.id);
      expect(afterActivityIds.sort()).toEqual([keptId, droppedId].sort());
      expect(afterActivityIds).not.toContain("brand-new-activity");

      expect(
        await database.getAllAsync(
          `SELECT activity_id, body_zone_id FROM activity_body_zones
           WHERE activity_id IN (?, ?) ORDER BY activity_id, body_zone_id`,
          [keptId, droppedId],
        ),
      ).toEqual(beforeZoneRows);
      expect((beforeZoneRows as { body_zone_id: string }[]).map((z) => z.body_zone_id)).toEqual([
        "dos",
      ]);
    });
  });

  /**
   * T16 (D-210, requirement référentiels Étiquette/Catégorie/Zone) : garde
   * « valeur retirée » côté stockage — une NOUVELLE affectation vers une
   * entrée retirée est refusée ; une affectation déjà persistée reste
   * permise même retirée entre-temps.
   */
  describe("garde « valeur retirée » côté stockage — Étiquette et Zones (T16, D-210)", () => {
    async function insertRetiredLabel(id: string, canonicalKey: string): Promise<void> {
      await database.runAsync(
        `INSERT INTO labels (id, name, canonical_key, color, is_active, created_at)
         VALUES (?, ?, ?, '#F7D154', 0, '2026-01-01T00:00:00.000Z')`,
        [id, canonicalKey, canonicalKey],
      );
    }

    it("rejects creating a Session with a retired Label", async () => {
      await insertRetiredLabel("label-retired", "jaune-retiree");
      const repository = new SqliteSessionRepository(database, uuidFactory());

      await expect(
        repository.create({ ...validInput(), labelId: "label-retired" }),
      ).rejects.toThrow(/retired/i);

      const count = await database.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) AS count FROM sessions",
      );
      expect(count?.count).toBe(0);
    });

    it("rejects creating an Activity with a retired body zone", async () => {
      await database.runAsync(`UPDATE body_zones SET is_active = 0 WHERE id = 'dos'`);
      const repository = new SqliteSessionRepository(database, uuidFactory());

      await expect(
        repository.create({
          ...validInput(),
          exercises: [{ ...anExercise(), bodyZoneIds: ["dos"] }],
        }),
      ).rejects.toThrow(/retired/i);

      const count = await database.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) AS count FROM sessions",
      );
      expect(count?.count).toBe(0);
    });

    it("rejects switching an update to a retired Label, but keeps an already-assigned Label even if it is retired afterwards", async () => {
      await insertRetiredLabel("label-retired", "jaune-retiree");
      const repository = new SqliteSessionRepository(database, uuidFactory());
      const created = await repository.create({ ...validInput(), labelId: null });
      const keptId = created.cycle.tour.exercises[0]!.id;

      await expect(
        repository.update(
          created.id,
          anUpdateInput({
            sourceSessionId: created.id,
            labelId: "label-retired",
            activities: [anUpdateActivity({ id: keptId })],
          }),
        ),
      ).rejects.toThrow(/retired/i);

      // L'affectation existante (ici absente, `null`) n'est jamais altérée par un échec.
      const reopened = await repository.findById(created.id);
      expect(reopened?.labelId).toBeNull();
    });

    it("keeps an already-assigned, now-retired Label unchanged when the update does not touch it", async () => {
      await database.runAsync(
        `INSERT INTO labels (id, name, canonical_key, color, is_active, created_at)
         VALUES ('label-1', 'Sport', 'sport', '#2E9B62', 1, '2026-01-01T00:00:00.000Z')`,
      );
      const repository = new SqliteSessionRepository(database, uuidFactory());
      const created = await repository.create({ ...validInput(), labelId: "label-1" });
      const keptId = created.cycle.tour.exercises[0]!.id;

      await database.runAsync(`UPDATE labels SET is_active = 0 WHERE id = 'label-1'`);

      const outcome = await repository.update(
        created.id,
        anUpdateInput({
          sourceSessionId: created.id,
          labelId: "label-1",
          activities: [anUpdateActivity({ id: keptId })],
        }),
      );

      expect(outcome.status).toBe("UPDATED");
      if (outcome.status !== "UPDATED") throw new Error("expected UPDATED");
      expect(outcome.session.labelId).toBe("label-1");
    });

    it("rejects adding a NEW retired body zone on update, but keeps an already-assigned Zone even if it is retired afterwards", async () => {
      const repository = new SqliteSessionRepository(database, uuidFactory());
      const created = await repository.create({
        ...validInput(),
        exercises: [{ ...anExercise(), bodyZoneIds: ["dos"] }],
      });
      const keptId = created.cycle.tour.exercises[0]!.id;
      await database.runAsync(`UPDATE body_zones SET is_active = 0 WHERE id = 'epaules'`);

      await expect(
        repository.update(
          created.id,
          anUpdateInput({
            sourceSessionId: created.id,
            activities: [anUpdateActivity({ id: keptId, bodyZoneIds: ["dos", "epaules"] })],
          }),
        ),
      ).rejects.toThrow(/retired/i);

      const reopened = await repository.findById(created.id);
      expect(reopened?.cycle.tour.exercises[0]?.bodyZoneIds).toEqual(["dos"]);
    });

    it("keeps an already-assigned, now-retired body zone unchanged when the update resubmits it unchanged", async () => {
      const repository = new SqliteSessionRepository(database, uuidFactory());
      const created = await repository.create({
        ...validInput(),
        exercises: [{ ...anExercise(), bodyZoneIds: ["dos"] }],
      });
      const keptId = created.cycle.tour.exercises[0]!.id;
      await database.runAsync(`UPDATE body_zones SET is_active = 0 WHERE id = 'dos'`);

      const outcome = await repository.update(
        created.id,
        anUpdateInput({
          sourceSessionId: created.id,
          activities: [anUpdateActivity({ id: keptId, bodyZoneIds: ["dos"] })],
        }),
      );

      expect(outcome.status).toBe("UPDATED");
      if (outcome.status !== "UPDATED") throw new Error("expected UPDATED");
      expect(outcome.session.cycle.tour.exercises[0]?.bodyZoneIds).toEqual(["dos"]);
    });
  });

  describe("findSessionStatus (T01-S10)", () => {
    it("returns ACTIVE for an active session, ARCHIVED for an archived one, null for an unknown id", async () => {
      const repository = new SqliteSessionRepository(database, uuidFactory());
      const active = await repository.create(validInput());

      const secondRepository = new SqliteSessionRepository(database, secondUuidFactory());
      const archived = await secondRepository.create({ ...validInput(), name: "Archivée" });
      await database.runAsync(
        "UPDATE sessions SET status = 'ARCHIVED', archived_at = ? WHERE id = ?",
        ["2026-01-02T00:00:00.000Z", archived.id],
      );

      expect(await repository.findSessionStatus(active.id)).toBe("ACTIVE");
      expect(await repository.findSessionStatus(archived.id)).toBe("ARCHIVED");
      expect(await repository.findSessionStatus("nope")).toBeNull();
    });
  });

  /**
   * V2-BILAT-01, portée exclusivement par l'Exercice (V2-PRE-1) —
   * persistance de la direction propre de chaque Activité, et parité SQL /
   * Domaine du multiplicateur (`ACTIVITY_SIDE_MULTIPLIER_SQL`, transcription
   * exacte de `sideMultiplier(activity.sideMode)`, `calculations.ts`). Le
   * Circuit (Tour) n'a plus aucune direction propre (plan §3.3).
   */
  describe("V2-BILAT-01 / V2-PRE-1 — side mode persistence and SQL parity", () => {
    it("persists and round-trips an Activity's own side mode", async () => {
      const repository = new SqliteSessionRepository(database, uuidFactory());
      const created = await repository.create({
        ...validInput(),
        exercises: [{ ...anExercise(), sideMode: "RIGHT_LEFT" }],
      });

      expect(created.cycle.tour.exercises[0]?.sideMode).toBe("RIGHT_LEFT");

      const reopened = await repository.findById(created.id);
      expect(reopened?.cycle.tour.exercises[0]?.sideMode).toBe("RIGHT_LEFT");
    });

    it("defaults a fresh Activity to UNILATERAL when no side mode is provided", async () => {
      const repository = new SqliteSessionRepository(database, uuidFactory());
      const created = await repository.create(validInput());

      expect(created.cycle.tour.exercises[0]?.sideMode).toBe("UNILATERAL");
    });

    it("updates each Activity's own side mode through update()", async () => {
      const repository = new SqliteSessionRepository(database, uuidFactory());
      const created = await repository.create(validInput());
      const activityId = created.cycle.tour.exercises[0]!.id;

      const outcome = await repository.update(
        created.id,
        anUpdateInput({
          sourceSessionId: created.id,
          activities: [anUpdateActivity({ id: activityId, sideMode: "LEFT_RIGHT" })],
        }),
      );

      expect(outcome.status).toBe("UPDATED");
      if (outcome.status === "UPDATED") {
        expect(outcome.session.cycle.tour.exercises[0]?.sideMode).toBe("LEFT_RIGHT");
      }
    });

    /**
     * PRE-3 (Bip v2 §3, révisé aux sources courantes) : la liste utilise
     * l'autorité unique du Domaine. Ancienne occurrence bilatérale (sans
     * JSON, aucune colonne PC → 0) lue par côté : 2 × Σ(T + P) + PC ; la
     * Récupération remplace UNIQUEMENT la Pause terminale, jamais doublée.
     */
    it("doubles the estimated duration for a bilateral Activity, never doubling the Récupération", async () => {
      const repository = new SqliteSessionRepository(database, uuidFactory());
      const created = await repository.create({
        ...validInput(),
        exercises: [
          {
            ...anExercise(),
            durationSeconds: 30,
            seriesCount: 3,
            pauseSeconds: 15,
            postActivityRecoverySeconds: 20,
            sideMode: "RIGHT_LEFT",
          },
        ],
      });

      const summaries = await repository.listActive();
      // 2 × 3 × (30 + 15) = 270 ; − 15 (Pause terminale) + 20 (R, une fois) = 275 s.
      expect(
        summaries.find((item) => item.id === created.id)?.estimatedDurationSeconds,
      ).toBe(275);
    });

    it("applies each Activity's own side mode independently of its structural position", async () => {
      const repository = new SqliteSessionRepository(database, uuidFactory());
      const created = await repository.create({
        ...validInput(),
        exercises: [
          {
            ...anExercise(),
            id: "warmup",
            structuralPosition: "BEFORE_TOUR",
            durationSeconds: 10,
            seriesCount: 1,
            pauseSeconds: 0,
          },
          {
            ...anExercise(),
            id: "core",
            structuralPosition: "IN_TOUR",
            durationSeconds: 10,
            seriesCount: 1,
            pauseSeconds: 0,
            sideMode: "RIGHT_LEFT",
          },
        ],
      });

      const summaries = await repository.listActive();
      // BEFORE_TOUR (direction propre UNILATERAL) : 10 s ; IN_TOUR (direction
      // propre bilatérale) : 10 × 2 = 20 s. Total 30 s.
      expect(
        summaries.find((item) => item.id === created.id)?.estimatedDurationSeconds,
      ).toBe(30);
    });

    it("keeps the aggregate contract check satisfied for the persisted default UNILATERAL side mode (defense in depth)", async () => {
      const repository = new SqliteSessionRepository(database, uuidFactory());
      const created = await repository.create(validInput());
      // La lecture complète (`findById`, qui rappelle `assertSessionAggregateRow`)
      // ne lève jamais pour une Séance persistée normalement.
      await expect(repository.findById(created.id)).resolves.not.toBeNull();
    });
  });
});

function validInput(): CreateSessionInput {
  return {
    name: "Séance simple",
    // V2-PRE-1 (plan §3.3) : `color` autonome est retiré — aucune Étiquette
    // par défaut (`labelId` omis, présentation neutre).
    initialCountdownSeconds: 10,
    finalPhaseSeconds: 5,
    // T02-S01 : la répétition du Tour fait désormais partie de l'entrée de
    // création (D-058) — `1` conserve exactement l'agrégat T01 de référence.
    tourRepeatCount: 1,
    exercises: [anExercise()],
  };
}

function anExercise(overrides: Partial<CreateSessionExerciseInput> = {}): CreateSessionExerciseInput {
  return {
    type: "EXERCISE",
    structuralPosition: "IN_TOUR",
    name: "Gainage",
    executionMode: "DURATION",
    durationSeconds: 30,
    repetitionCount: null,
    seriesCount: 1,
    pauseSeconds: 0,
    postActivityRecoverySeconds: 0,
    instruction: null,
    bodyZoneIds: [],
    ...overrides,
  };
}

/** Activité d'un `UpdateSessionInput` (T01-S10) — Exercice Durée par défaut, `id` explicite (fusion par identité). */
function anUpdateActivity(
  overrides: Partial<UpdateSessionActivityInput> = {},
): UpdateSessionActivityInput {
  return {
    id: "act-1",
    type: "EXERCISE",
    structuralPosition: "IN_TOUR",
    position: 0,
    name: "Gainage",
    executionMode: "DURATION",
    durationSeconds: 30,
    repetitionCount: null,
    seriesCount: 1,
    pauseSeconds: 0,
    postActivityRecoverySeconds: 0,
    instruction: null,
    bodyZoneIds: [],
    ...overrides,
  };
}

function anUpdateInput(overrides: Partial<UpdateSessionInput> = {}): UpdateSessionInput {
  return {
    sourceSessionId: "placeholder",
    name: "Séance simple",
    initialCountdownSeconds: 10,
    finalPhaseSeconds: 5,
    tourRepeatCount: 1,
    activities: [anUpdateActivity()],
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

class FailingActivityBodyZoneInsertDatabase implements Database {
  constructor(private readonly delegate: Database) {}

  execAsync = (source: string) => this.delegate.execAsync(source);
  getFirstAsync = <T>(source: string, parameters: SqlParameters = []) =>
    this.delegate.getFirstAsync<T>(source, parameters);
  getAllAsync = <T>(source: string, parameters: SqlParameters = []) =>
    this.delegate.getAllAsync<T>(source, parameters);

  runAsync(source: string, parameters: SqlParameters = []) {
    if (source.includes("INSERT INTO activity_body_zones")) {
      return Promise.reject(new Error("forced activity_body_zones failure"));
    }
    return this.delegate.runAsync(source, parameters);
  }

  withExclusiveTransactionAsync(task: (transaction: Database) => Promise<void>) {
    return this.delegate.withExclusiveTransactionAsync((transaction) =>
      task(new FailingActivityBodyZoneInsertDatabase(transaction)),
    );
  }
}

function validRow(): SessionAggregateRow {
  return {
    session_id: IDS[0]!,
    owner_id: "usr_test",
    session_name: "Séance",
    label_id: null,
    label_color: null,
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
    // Colonne SQL technique, conservée mais sans influence fonctionnelle
    // (V2-PRE-1, plan §3.3) — le Tour n'expose plus de direction propre.
    tour_side_mode: "UNILATERAL",
    activity_id: IDS[3]!,
    activity_type: "EXERCISE",
    activity_name: "Gainage",
    structural_position: "IN_TOUR",
    activity_position: 0,
    execution_mode: "DURATION",
    duration_seconds: 30,
    repetition_count: null,
    series_count: 1,
    pause_seconds: 0,
    post_activity_recovery_seconds: 0,
    instruction: null,
    // V2-BILAT-01 : direction propre de l'Activité (`migration005`, défaut `'UNILATERAL'`).
    activity_side_mode: "UNILATERAL",
    // PRE-3 (`migration009`) : ancienne occurrence — aucun JSON canonique ni Catégorie.
    activity_execution_parameters: null,
    activity_category_id: null,
  };
}

/**
 * PRE-3 — obligations SQLite RÉELLES de l'occurrence de Séance
 * (propriétaire SqliteSessionRepository) : paramètres canoniques, Catégorie
 * de copie, médias ordonnés propres, total de liste = lecture complète.
 */
describe("SqliteSessionRepository — PRE-3 (NodeSqliteDatabase REAL)", () => {
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

  const asset = (id: string, kind: "PHOTO" | "VIDEO" = "PHOTO"): MediaAsset => ({
    id,
    uri: `kodjo-media/${id}`,
    createdAt: "2026-10-09T10:00:00.000Z",
    kind,
    mimeType: kind === "PHOTO" ? "image/jpeg" : "video/mp4",
    fileName: null,
    sizeBytes: 10,
    durationMs: kind === "VIDEO" ? 2000 : null,
    width: null,
    height: null,
  });

  function parameters(overrides: Partial<ExecutionParameters> = {}): ExecutionParameters {
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
      sideOrder: "BY_SIDE",
      sideRecoverySeconds: 15,
      cadenceBeepIntervalSeconds: 0,
      countdownSeconds: 10,
      endSeconds: 5,
      ...overrides,
    };
  }

  function occurrence(overrides: Partial<CreateSessionActivityInput> = {}): CreateSessionActivityInput {
    return {
      type: "EXERCISE",
      structuralPosition: "IN_TOUR",
      name: "Fentes",
      executionMode: "DURATION",
      durationSeconds: 30,
      repetitionCount: null,
      seriesCount: 3,
      pauseSeconds: 10,
      postActivityRecoverySeconds: 0,
      bodyZoneIds: ["cuisses"],
      executionParameters: parameters(),
      categoryId: "cardio",
      media: [
        { assetId: "v1", asset: asset("v1", "VIDEO") },
        { assetId: "p1", asset: asset("p1") },
      ],
      ...overrides,
    };
  }

  function sessionInput(exercises: readonly CreateSessionActivityInput[], tourRepeatCount = 1): CreateSessionInput {
    return { name: "Jambes", initialCountdownSeconds: 10, finalPhaseSeconds: 5, tourRepeatCount, exercises };
  }

  function updateFromDraft(session: Session, mutate: (draft: SessionDraft) => SessionDraft): UpdateSessionInput {
    const result = toUpdateSessionInput(mutate(toSessionDraft(session)));
    if (!result.ok) {
      throw new Error(JSON.stringify(result.violations));
    }
    return result.value;
  }

  it("P3-01/Session:create, P3-01/Session:edit, P3-01/Catalogue:create, P3-01/Catalogue:edit — la copie se rouvre complète ; Continuer seul la persiste", async () => {
    const repository = new SqliteSessionRepository(database, ids("ses"));
    const created = await repository.create(sessionInput([occurrence()]));
    const read = (await repository.findById(created.id))!.cycle.tour.exercises[0]!;
    expect(read.executionParameters).toEqual(parameters());
    expect(read.categoryId).toBe("cardio");
    expect(read.media?.map((item) => [item.assetId, item.position, item.asset.kind])).toEqual([
      ["v1", 0, "VIDEO"],
      ["p1", 1, "PHOTO"],
    ]);
    // Modification de la copie : cadence, ordre des côtés, ordre des médias.
    const edited = parameters({ cadenceBeepIntervalSeconds: 3, sideOrder: "BY_SERIES" });
    const outcome = await repository.update(
      created.id,
      updateFromDraft(created, (draft) => ({
        ...draft,
        exercises: draft.exercises.map((exercise) => ({
          ...exercise,
          executionParameters: edited,
          media: [...(exercise.media ?? [])].reverse(),
        })),
      })),
    );
    const updated = outcome.status === "UPDATED" ? outcome.session.cycle.tour.exercises[0]! : null;
    expect(updated?.id).toBe(read.id);
    expect(updated?.executionParameters).toEqual(edited);
    expect(updated?.media?.map((item) => item.assetId)).toEqual(["p1", "v1"]);
    // Aucune définition Catalogue n'est créée ni modifiée par la Séance.
    const definitions = await database.getFirstAsync<{ count: number }>("SELECT COUNT(*) AS count FROM activity_definitions");
    expect(definitions?.count).toBe(0);
  });

  it("P3-03/reference-retired — Catégorie et Zone retirées conservées ; nouvelle affectation retirée refusée", async () => {
    const repository = new SqliteSessionRepository(database, ids("ses"));
    const created = await repository.create(sessionInput([occurrence()]));
    await database.runAsync("UPDATE categories SET is_active = 0 WHERE id = 'cardio'");
    await database.runAsync("UPDATE body_zones SET is_active = 0 WHERE id = 'cuisses'");
    const kept = await repository.update(
      created.id,
      updateFromDraft(created, (draft) => ({ ...draft, name: "Renommée" })),
    );
    const activity = kept.status === "UPDATED" ? kept.session.cycle.tour.exercises[0]! : null;
    expect(activity?.categoryId).toBe("cardio");
    expect(activity?.bodyZoneIds).toEqual(["cuisses"]);
    await expect(
      repository.create(sessionInput([occurrence({ categoryId: "cardio", bodyZoneIds: ["dos"], media: [] })])),
    ).rejects.toThrow(RetiredOccurrenceCategoryError);
  });

  it("P3-10/legacy-neutral-proposal et P3-17/corrupt-version — ancienne occurrence sans JSON lue telle quelle ; JSON corrompu : erreur explicite", async () => {
    const repository = new SqliteSessionRepository(database, ids("ses"));
    const created = await repository.create(
      sessionInput([occurrence({ executionParameters: undefined, categoryId: undefined, media: undefined, pauseSeconds: 40 })]),
    );
    await database.runAsync("UPDATE profiles SET exercise_countdown_seconds_default = 60");
    const legacy = (await repository.findById(created.id))!.cycle.tour.exercises[0]!;
    expect(legacy.executionParameters).toBeUndefined();
    expect(legacy.categoryId).toBeNull();
    expect(resolveExecutionParameters(legacy)).toEqual(
      expect.objectContaining({ countdownSeconds: 0, endSeconds: 0, series: { kind: "UNIFORM", count: 3, target: 30, pauseSeconds: 40 } }),
    );
    await database.runAsync("UPDATE activities SET execution_parameters = 'oops'");
    await expect(repository.findById(created.id)).rejects.toThrow(ExecutionParametersDataError);
  });

  it("P3-13/tours-cycles-list — total de liste = lecture complète par l'autorité unique ; avant/dans/après Circuit, Tours 99, ≈ et ≥", async () => {
    const repository = new SqliteSessionRepository(database, ids("ses"));
    const estimated = parameters({
      mode: "REPETITIONS",
      series: { kind: "UNIFORM", count: 4, target: 15, pauseSeconds: 15 },
      sideMode: "UNILATERAL",
      cadenceBeepIntervalSeconds: 4,
    });
    const unknown = parameters({
      mode: "TO_FAILURE",
      series: { kind: "VARIABLE", rows: [{ target: null, pauseSeconds: 30 }, { target: null, pauseSeconds: 45 }, { target: null, pauseSeconds: 60 }] },
      sideMode: "UNILATERAL",
    });
    const created = await repository.create(
      sessionInput(
        [
          occurrence({ structuralPosition: "BEFORE_TOUR", media: [] }),
          occurrence({ executionParameters: estimated, media: [], postActivityRecoverySeconds: 120 }),
          occurrence({ structuralPosition: "AFTER_TOUR", executionParameters: unknown, media: [] }),
        ],
        99,
      ),
    );
    const full = toSessionDurationResult((await repository.findById(created.id))!);
    const listed = (await repository.listActive()).find((item) => item.id === created.id)!;
    expect(listed.estimatedDurationSeconds).toBe(full.seconds);
    expect(listed.durationKind).toBe("lowerBound");
    expect(full).toEqual({ kind: "lowerBound", seconds: 405 + 99 * (300 - 15 + 120) + 135 });
    const withoutUnknown = await repository.create(
      sessionInput([occurrence({ media: [] }), occurrence({ executionParameters: estimated, media: [] })], 2),
    );
    expect((await repository.listActive()).find((item) => item.id === withoutUnknown.id)?.durationKind).toBe("estimated");
  });

  it("P3-13/no-auto-R — nouvelle occurrence R absente, occurrence existante R30 inchangée", async () => {
    const repository = new SqliteSessionRepository(database, ids("ses"));
    const created = await repository.create(sessionInput([occurrence({ postActivityRecoverySeconds: 30, media: [] })]));
    const outcome = await repository.update(
      created.id,
      updateFromDraft(created, (draft) => ({
        ...draft,
        exercises: [...draft.exercises, { ...draft.exercises[0]!, id: "new-occurrence", postActivityRecoverySeconds: 0 }],
      })),
    );
    const exercises = outcome.status === "UPDATED" ? outcome.session.cycle.tour.exercises : [];
    expect(exercises.map((exercise) => [exercise.id, exercise.postActivityRecoverySeconds])).toEqual([
      [created.cycle.tour.exercises[0]!.id, 30],
      ["new-occurrence", 0],
    ]);
  });

  it("P3-15/no-storage — aucune colonne de phrase/segment ; seul le JSON canonique est stocké", async () => {
    const repository = new SqliteSessionRepository(database, ids("ses"));
    await repository.create(sessionInput([occurrence({ media: [] })]));
    const columns = (await database.getAllAsync<{ name: string }>("PRAGMA table_info(activities)")).map((c) => c.name);
    expect(columns.some((name) => /phrase|segment|summary/i.test(name))).toBe(false);
    const row = await database.getFirstAsync<{ execution_parameters: string }>("SELECT execution_parameters FROM activities");
    expect(JSON.parse(row!.execution_parameters)).toEqual(parameters());
  });

  it("P3-16/failure-doubletap et P3-17/transaction-FK — échec en cours : rollback complet ; réessai unique ; IDs et created_at stables", async () => {
    const repository = new SqliteSessionRepository(database, ids("ses"));
    await expect(
      repository.create(sessionInput([occurrence({ media: [{ assetId: "v1", asset: asset("v1", "VIDEO") }, { assetId: "missing" }] })])),
    ).rejects.toThrow();
    const empty = await database.getFirstAsync<Record<string, number>>(
      "SELECT (SELECT COUNT(*) FROM sessions) AS s, (SELECT COUNT(*) FROM activities) AS a, (SELECT COUNT(*) FROM media_assets) AS m, (SELECT COUNT(*) FROM session_activity_media) AS l",
    );
    expect(empty).toEqual({ s: 0, a: 0, m: 0, l: 0 });
    const created = await repository.create(sessionInput([occurrence()]));
    const createdRow = await database.getFirstAsync<{ id: string; created_at: string }>("SELECT id, created_at FROM activities");
    // Réordonnancement : jamais de violation UNIQUE(activity_id, position).
    const outcome = await repository.update(
      created.id,
      updateFromDraft(created, (draft) => ({
        ...draft,
        exercises: draft.exercises.map((exercise) => ({ ...exercise, media: [...(exercise.media ?? [])].reverse() })),
      })),
    );
    expect(outcome.status).toBe("UPDATED");
    expect(await database.getFirstAsync("SELECT id, created_at FROM activities")).toEqual(createdRow);
    expect(await database.getAllAsync("PRAGMA foreign_key_check")).toEqual([]);
    const positions = await database.getAllAsync<{ asset_id: string; position: number }>(
      "SELECT asset_id, position FROM session_activity_media ORDER BY position",
    );
    expect(positions).toEqual([
      { asset_id: "p1", position: 0 },
      { asset_id: "v1", position: 1 },
    ]);
  });

  it("P3-17/canonical-roundtrip — base fichier fermée puis rouverte : occurrence canonique, Catégorie et médias intacts", async () => {
    const path = join(tmpdir(), `kodjo-pre3-session-${Date.now()}-${Math.random().toString(16).slice(2)}.db`);
    const fileDatabase = NodeSqliteDatabase.openFile(path);
    try {
      await migrateDatabase(fileDatabase);
      const extremes = parameters({
        mode: "REPETITIONS",
        series: { kind: "VARIABLE", rows: [{ target: 100, pauseSeconds: 300 }, { target: 1, pauseSeconds: 0 }] },
        sideOrder: "BY_SERIES",
        cadenceBeepIntervalSeconds: 10,
      });
      const created = await new SqliteSessionRepository(fileDatabase, ids("ses")).create(
        sessionInput([occurrence({ executionParameters: extremes })]),
      );
      fileDatabase.close();
      const reopened = NodeSqliteDatabase.openFile(path);
      try {
        const activity = (await new SqliteSessionRepository(reopened, ids("ses")).findById(created.id))!.cycle.tour.exercises[0]!;
        expect(activity.executionParameters).toEqual(extremes);
        expect(activity.repetitionCount).toBe(100);
        expect(activity.seriesCount).toBe(2);
        expect(activity.categoryId).toBe("cardio");
        expect(activity.media?.map((item) => item.asset)).toEqual([asset("v1", "VIDEO"), asset("p1")]);
      } finally {
        reopened.close();
      }
    } finally {
      rmSync(path, { force: true });
      rmSync(`${path}-wal`, { force: true });
      rmSync(`${path}-shm`, { force: true });
    }
  });

  it("P3-18/copy-complete — duplication : nouvelle occurrence et nouveaux liens, mêmes fichiers, aucune mutation croisée", async () => {
    const repository = new SqliteSessionRepository(database, ids("ses"));
    const created = await repository.create(sessionInput([occurrence({ postActivityRecoverySeconds: 30 })]));
    const sourceId = created.cycle.tour.exercises[0]!.id;
    const duplicated = await repository.update(
      created.id,
      updateFromDraft(created, (draft) => ({ ...draft, exercises: duplicateActivity(draft.exercises, sourceId, "copy-1") })),
    );
    const exercises = duplicated.status === "UPDATED" ? duplicated.session.cycle.tour.exercises : [];
    const [source, copy] = exercises;
    expect(copy?.id).toBe("copy-1");
    expect(copy?.executionParameters).toEqual(source?.executionParameters);
    expect(copy?.categoryId).toBe(source?.categoryId);
    expect(copy?.postActivityRecoverySeconds).toBe(30);
    expect(copy?.media?.map((item) => item.assetId)).toEqual(source?.media?.map((item) => item.assetId));
    expect(new Set([...(copy?.media ?? []), ...(source?.media ?? [])].map((item) => item.id)).size).toBe(4);
    // Modifier la copie ne touche pas la source.
    const afterEdit = await repository.update(
      created.id,
      updateFromDraft(duplicated.status === "UPDATED" ? duplicated.session : created, (draft) => ({
        ...draft,
        exercises: draft.exercises.map((exercise) =>
          exercise.id === "copy-1" ? { ...exercise, executionParameters: parameters({ cadenceBeepIntervalSeconds: 7 }), media: [] } : exercise,
        ),
      })),
    );
    const finalSource = afterEdit.status === "UPDATED" ? afterEdit.session.cycle.tour.exercises[0] : null;
    expect(finalSource?.executionParameters).toEqual(parameters());
    expect(finalSource?.media?.map((item) => item.assetId)).toEqual(["v1", "p1"]);
  });

  it("P3-23/file-preservation — retirer un lien ou une occurrence ne supprime jamais l'asset référencé ailleurs", async () => {
    const repository = new SqliteSessionRepository(database, ids("ses"));
    const media = new SqliteMediaRepository(database);
    const created = await repository.create(sessionInput([occurrence(), occurrence({ media: [{ assetId: "v1" }] })]));
    expect(await media.countReferences("v1")).toBe(2);
    const removedLink = await repository.update(
      created.id,
      updateFromDraft(created, (draft) => ({
        ...draft,
        exercises: draft.exercises.map((exercise, index) => (index === 0 ? { ...exercise, media: [] } : exercise)),
      })),
    );
    expect(removedLink.status).toBe("UPDATED");
    expect(await media.countReferences("v1")).toBe(1);
    expect(await media.countReferences("p1")).toBe(0);
    // Asset sans référence : conservé (aucune purge globale), toujours lisible.
    expect(await media.findAsset("p1")).toEqual(asset("p1"));
    expect(await media.findAsset("v1")).toEqual(asset("v1", "VIDEO"));
  });
});
