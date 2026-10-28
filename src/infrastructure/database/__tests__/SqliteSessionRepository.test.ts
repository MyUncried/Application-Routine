import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { render, screen as rnScreen } from "@testing-library/react-native";
import * as Crypto from "expo-crypto";
import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { createElement } from "react";

import { SessionValidationError } from "@/domain/sessions/errors";
import {
  DEFAULT_SESSION_COLOR,
  type CreateSessionInput,
  type UpdateSessionInput,
 Session } from "@/domain/sessions/Session";
import type { Database, SqlParameters } from "@/infrastructure/database/Database";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import {
  assembleStructure,
  toLegacySession,
  type StoredSession,
 RetiredBodyZoneError,
 RetiredLabelError,
 RetiredOccurrenceCategoryError } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { SqliteActivityDefinitionRepository } from "@/infrastructure/database/repositories/SqliteActivityDefinitionRepository";
import { splitResolvedParameters } from "@/domain/activities/Movement";
import { withLocalMovements } from "@/domain/sessions/testing/draftMovements";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import {
  ViewedSessionRepository,
  type ViewedCreateActivity,
  type ViewedCreateSessionInput,
  type ViewedUpdateActivity,
  type ViewedUpdateSessionInput,
} from "@/infrastructure/database/testing/sessionMovements";
import type { ActivityRow } from "@/infrastructure/database/types/DatabaseRows";
import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  EXECUTION_PARAMETERS_VERSION,
  ExecutionParametersDataError,
  numberTarget,
  serializeCatalogExecutionParameters,
  serializeResolvedExecutionParameters,
  type ExecutionParameters,
} from "@/domain/activities/ExecutionParameters";
import {
  allFailureParameters,
  durationParameters,
  repetitionParameters,
  toTarget,
  uniformParameters,
  variableParameters,
} from "@/domain/activities/testing/executionParametersFixtures";
import type { MediaAsset } from "@/domain/media/MediaAsset";
import { toSessionDurationResult } from "@/domain/sessions/calculations";
import { duplicateActivity } from "@/domain/sessions/composition";

import {
  createEmptyDraft,
  createExerciseDraft,
  draftMovementOf,
  isSessionDraftDirty,
  sessionDraftsEqual,
  toCreateSessionInput,
  toSessionDraft,
  toUpdateSessionInput,
  withDraftMovement,
  type DraftMovement,
  type SessionDraft,
} from "@/domain/sessions/SessionDraft";

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
import { projectSessionForCatalogue } from "@/features/sessions/sessionCatalogueProjection";

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
    const repository = new ViewedSessionRepository(database, uuidFactory());
    const created = await repository.create(validInput());
    const reopened = await repository.findById(created.id);
    const summaries = await repository.listActive();

    expect(created.id).toBe(IDS[0]);
    // PRE-8 (A.4, `migration014`) : le Cycle technique n'est plus persisté ; la projection prend
    // l'identifiant de la Séance et aucun identifiant ne lui est consommé.
    expect(created.cycle.id).toBe(IDS[0]);
    expect(created.cycle.tour.id).toBe(IDS[1]);
    expect(created.cycle.tour.exercises).toHaveLength(1);
    expect(created.cycle.tour.exercises[0]).toMatchObject({
      id: IDS[2],
      type: "EXERCISE",
      structuralPosition: "IN_TOUR",
      position: 0,
      executionParameters: durationParameters(30),
      postActivityRecoverySeconds: 0,
      // PRE-7 (R-3, C05) : Zones relues dans le Mouvement (qui en exige au moins une).
      name: "Gainage",
      bodyZoneIds: ["cuisses"],
      sourceMovementId: "mov:gainage",
      copyNumber: null,
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
    const repository = new ViewedSessionRepository(database, uuidFactory());
    const created = await repository.create(validInput());

    // PRE-8 (A.4, `migration014`) : aucun Cycle technique ; le Circuit est au niveau principal.
    const cycleCount = await database.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) AS count FROM cycles WHERE session_id = ?",
      [created.id],
    );
    const tourRow = await database.getFirstAsync<{ cycle_id: string | null; position: number; repeat_count: number }>(
      "SELECT cycle_id, position, repeat_count FROM tours WHERE session_id = ?",
      [created.id],
    );
    const activityRow = await database.getFirstAsync<{
      tour_id: string | null;
      position: number;
      series_count: number;
      pause_seconds: number;
    }>(
      "SELECT tour_id, position, series_count, pause_seconds FROM activities WHERE session_id = ?",
      [created.id],
    );

    expect(cycleCount).toEqual({ count: 0 });
    expect(tourRow).toEqual({ cycle_id: null, position: 0, repeat_count: 1 });
    expect(activityRow).toEqual({
      tour_id: created.cycle.tour.id,
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
    const repository = new ViewedSessionRepository(database, uuidFactory());
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
          executionParameters: durationParameters(45),
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
      executionParameters: durationParameters(45),
      postActivityRecoverySeconds: 30,
    });

    // PRE-8 (A.4, `migration014`) : niveau principal `[warmup, Circuit, stretch]` (rangs 0, 1, 2),
    // rangs dans le Circuit 0 et 1.
    const rows = await database.getAllAsync<{
      id: string;
      position: number;
      tour_id: string | null;
      type: string;
    }>(
      `SELECT id, position, tour_id, type FROM activities
       WHERE session_id = ? ORDER BY tour_id IS NOT NULL, position`,
      [created.id],
    );
    expect(rows).toEqual([
      { id: "warmup", position: 0, tour_id: null, type: "EXERCISE" },
      { id: "stretch", position: 2, tour_id: null, type: "EXERCISE" },
      { id: "core-1", position: 0, tour_id: created.cycle.tour.id, type: "EXERCISE" },
      { id: "core-2", position: 1, tour_id: created.cycle.tour.id, type: "EXERCISE" },
    ]);
    const tour = await database.getFirstAsync<{ position: number }>("SELECT position FROM tours WHERE session_id = ?", [created.id]);
    expect(tour).toEqual({ position: 1 });

    // Réouverture fidèle : l'agrégat relu est rigoureusement identique.
    expect(await repository.findById(created.id)).toEqual(created);
  });

  it("keeps the draft identifier of an Activity when one is provided, and generates one otherwise", async () => {
    const repository = new ViewedSessionRepository(database, uuidFactory());
    const created = await repository.create({
      ...validInput(),
      exercises: [
        { ...anExercise(), id: "kept-id", name: "Gainage" },
        { ...anExercise(), name: "Squats" },
      ],
    });

    const ids = created.cycle.tour.exercises.map((activity) => activity.id);
    expect(ids[0]).toBe("kept-id");
    // PRE-8 (A.4) : Séance puis Circuit, puis l'Exercice sans identifiant.
    expect(ids[1]).toBe(IDS[2]);
  });

  it("uses Crypto.randomUUID for all aggregate identifiers by default", async () => {
    jest.mocked(Crypto.randomUUID).mockImplementation(uuidFactory());
    const repository = new ViewedSessionRepository(database);

    const created = await repository.create(validInput());

    // PRE-8 (A.4) : Séance, Circuit, Exercice ; la projection du Cycle reprend l'identifiant de la Séance.
    expect(Crypto.randomUUID).toHaveBeenCalledTimes(3);
    expect([created.id, created.cycle.tour.id, created.cycle.tour.exercises[0]?.id]).toEqual(IDS.slice(0, 3));
    expect(created.cycle.id).toBe(created.id);
  });

  it("rejects incomplete or out-of-contract input before persistence with a structured SessionValidationError", async () => {
    const repository = new ViewedSessionRepository(database, uuidFactory());

    await expect(repository.create({ ...validInput(), name: "   " })).rejects.toBeInstanceOf(
      SessionValidationError,
    );
    await expect(
      repository.create({
        ...validInput(),
        exercises: [{ ...anExercise(), executionParameters: uniformParameters({ target: "UNSET" }) }],
      }),
    ).rejects.toBeInstanceOf(SessionValidationError);

    const count = await database.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) AS count FROM sessions",
    );
    expect(count?.count).toBe(0);
  });

  // PRE-6 story 7.8 (D-443) : Compte à rebours initial et Fin de séance bornés à 0..60 s à l'écriture.
  it("story 7.8 — rejects a session boundary above 60 s with OUT_OF_RANGE 0..60, nothing written", async () => {
    const repository = new ViewedSessionRepository(database, uuidFactory());

    try {
      await repository.create({ ...validInput(), initialCountdownSeconds: 61, finalPhaseSeconds: 60 });
      throw new Error("expected repository.create to reject");
    } catch (error) {
      expect(error).toBeInstanceOf(SessionValidationError);
      expect((error as SessionValidationError).violations).toEqual([
        { code: "OUT_OF_RANGE", field: "session.initialCountdownSeconds", details: { min: 0, max: 60 } },
      ]);
    }
    const count = await database.getFirstAsync<{ count: number }>("SELECT COUNT(*) AS count FROM sessions");
    expect(count?.count).toBe(0);
  });

  it("exposes the exact violations (code + field) on SessionValidationError, without any message text", async () => {
    const repository = new ViewedSessionRepository(database, uuidFactory());

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
    const repository = new ViewedSessionRepository(database, uuidFactory());

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
    const repository = new ViewedSessionRepository(failingDatabase, uuidFactory());

    await expect(repository.create(validInput())).rejects.toThrow("forced activity failure");

    for (const table of ["sessions", "cycles", "tours", "activities"]) {
      const row = await database.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) AS count FROM ${table}`,
      );
      expect(row?.count).toBe(0);
    }
  });

  it("rejects an incoherent persisted row during mapping", () => {
    const incoherent = { ...validActivityRow(), repetition_count: 5 } as unknown as ActivityRow;
    expect(() => assembleStructure(validStored({ activities: [incoherent] }), new Map())).toThrow("does not satisfy");
  });

  it("rejects a row whose session status is ARCHIVED", () => {
    const archived = validStored();
    expect(() => assembleStructure({ ...archived, header: { ...archived.header, status: "ARCHIVED" } }, new Map())).toThrow(
      "does not satisfy",
    );
  });

  describe("multi-Activity persistence (T01-S09)", () => {
    it("persists ALL Activities of the collection, in order, without loss — zero loss of data validated in T01-S08", async () => {
      const repository = new ViewedSessionRepository(database, uuidFactory());
      const created = await repository.create({
        ...validInput(),
        exercises: [
          { ...anExercise(), name: "Gainage", executionParameters: durationParameters(30, 2, 5) },
          {
            ...anExercise(),
            name: "Squats",
            executionParameters: repetitionParameters(12),
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
        executionParameters: repetitionParameters(12),
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
        const repository = new ViewedSessionRepository(writer, uuidFactory());
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
        const rereadRepository = new ViewedSessionRepository(reader);
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
      const repository = new ViewedSessionRepository(failingDatabase, uuidFactory());

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
      const repository = new ViewedSessionRepository(database, uuidFactory());
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
      const repository = new ViewedSessionRepository(database, uuidFactory());

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
      const repository = new ViewedSessionRepository(database, uuidFactory());
      const active = await repository.create(validInput());

      const secondRepository = new ViewedSessionRepository(database, secondUuidFactory());
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
      const repository = new ViewedSessionRepository(database, uuidFactory());
      const created = await repository.create({ ...validInput(), labelId: "label-yellow" });

      const summaries = await repository.listActive();
      const summary = summaries.find((item) => item.id === created.id);
      expect(summary?.color).toBe("#F7D154");
    });

    // PRE-7 (R-3, C05) : une occurrence n'a plus de Zones propres ; celles de la Séance sont
    // celles de ses Mouvements, qui en portent toujours au moins une.
    it("falls back to the default colour with an empty categoryNames for a Session with no Label; bodyZoneNames are those of its Movements", async () => {
      const repository = new ViewedSessionRepository(database, uuidFactory());
      const created = await repository.create({
        ...validInput(),
        exercises: [{ ...anExercise(), bodyZoneIds: ["dos"] }],
      });

      const summaries = await repository.listActive();
      const summary = summaries.find((item) => item.id === created.id);
      expect(summary?.color).toBe(DEFAULT_SESSION_COLOR);
      expect(summary?.categoryNames).toEqual([]);
      expect(summary?.bodyZoneNames).toEqual(["Dos"]);
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
    it("propagates the exact persisted yellow colour, unbroken, from a Session inserted directly at the SQL layer through SqliteSessionRepository.listActive() to the unified catalogue read, the card no longer drawing the label (PRE-8 E.2) (genuine historical/pre-existing row, not a repository.create() stand-in)", async () => {
      const owner = await database.getFirstAsync<{ id: string }>(
        "SELECT id FROM users WHERE singleton_key = 1",
      );
      if (!owner) {
        throw new Error("Expected the local user to already be seeded by migrateDatabase().");
      }

      const sessionId = "historical-session-1";
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
      // PRE-8 (A.4, `migration014`) : Circuit au niveau principal, sans Cycle technique.
      await database.runAsync(
        `INSERT INTO tours (id, cycle_id, session_id, position, repeat_count) VALUES (?, NULL, ?, 0, 1)`,
        [tourId, sessionId],
      );
      // PRE-7 (R-3, `migration013`) : l'occurrence référence un Mouvement existant (clé
      // étrangère RESTRICT) et ne porte que ses paramètres, en forme Catalogue v5.
      await database.runAsync(
        `INSERT INTO movements (id, name, normalized_name, description, category_id, next_phase_id, created_at, updated_at)
         VALUES ('mov-historique', 'Gainage historique', 'gainage historique', NULL, 'cardio', 1, ?, ?)`,
        [timestamp, timestamp],
      );
      await database.runAsync(
        "INSERT INTO movement_body_zones (movement_id, body_zone_id) VALUES ('mov-historique', 'dos')",
      );
      await database.runAsync(
        `INSERT INTO activities (
          id, session_id, tour_id, type,
          position, execution_mode, duration_seconds,
          repetition_count, series_count, pause_seconds,
          created_at, updated_at, execution_parameters, source_movement_id
        ) VALUES (?, ?, ?, 'EXERCISE', 0, 'DURATION', 30, NULL, 1, 0, ?, ?, ?, 'mov-historique')`,
        [
          activityId,
          sessionId,
          tourId,
          timestamp,
          timestamp,
          serializeCatalogExecutionParameters(splitResolvedParameters(durationParameters(30)).parameters),
        ],
      );

      const repository = new ViewedSessionRepository(database, uuidFactory());
      const summaries = await repository.listActive();
      const summary = summaries.find((item) => item.id === sessionId);

      // Étape 1 : repository → modèle de Catalogue (`SessionSummary`).
      expect(summary).toBeDefined();
      expect(summary?.color).toBe("#F7D154");
      expect(summary?.bodyZoneNames).toEqual(["Dos"]);

      // Étape 2 — PRE-8 (epic E, E.2 ; spécification « Carte de séance et catalogue des séances »
      // du 27/10 §1 : « L'étiquette n'est pas présentée […] Cette disposition remplace l'affichage
      // actuel de l'étiquette sur la carte de séance ») : la lecture du Catalogue unifié garde
      // l'Étiquette et sa couleur (critère de filtre, E.6), la carte unique ne la dessine plus.
      const record = (await repository.listCatalogue()).find((item) => item.id === sessionId);
      expect(record).toMatchObject({ labelId, color: "#F7D154", status: "ACTIVE" });
      render(createElement(SessionCard, { projection: projectSessionForCatalogue(record!, new Map()) }));
      expect(rnScreen.queryByTestId("session-card-color-bar")).toBeNull();
      expect(rnScreen.queryByText("Jaune historique")).toBeNull();
    });

    it("marks the estimated duration as approximate as soon as one Activity uses REPETITIONS mode (RM-072)", async () => {
      const repository = new ViewedSessionRepository(database, uuidFactory());
      await repository.create({
        ...validInput(),
        exercises: [
          { ...anExercise(), executionParameters: repetitionParameters(12) },
        ],
      });

      const summaries = await repository.listActive();
      expect(summaries[0]?.isEstimatedDurationApproximate).toBe(true);
    });

    it("applies the canonical formula D = C × A + C × B in SQL when there is no Récupération, exactly like the Domain (T02-S02)", async () => {
      const repository = new ViewedSessionRepository(database, uuidFactory());
      const created = await repository.create({
        ...validInput(),
        initialCountdownSeconds: 10,
        finalPhaseSeconds: 5,
        exercises: [
          { ...anExercise(), name: "Un", executionParameters: durationParameters(30, 2, 5) },
          { ...anExercise(), name: "Deux", executionParameters: durationParameters(20, 1, 0) },
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
      const repository = new ViewedSessionRepository(database, uuidFactory());
      const withoutRecovery = await repository.create({
        ...validInput(),
        name: "Sans récupération",
        exercises: [
          { ...anExercise(), executionParameters: durationParameters(30, 3, 10) },
        ],
      });
      const withRecoveryRepository = new ViewedSessionRepository(
        database,
        secondUuidFactory(),
      );
      const withRecovery = await withRecoveryRepository.create({
        ...validInput(),
        name: "Avec récupération",
        exercises: [
          {
            ...anExercise(),
            executionParameters: durationParameters(30, 3, 10),
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
      const repository = new ViewedSessionRepository(database, uuidFactory());
      const created = await repository.create({
        ...validInput(),
        exercises: [
          {
            ...anExercise(),
            name: "Un",
            executionParameters: durationParameters(30, 3, 15),
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
      const repository = new ViewedSessionRepository(database, uuidFactory());
      const created = await repository.create({
        ...validInput(),
        exercises: [
          {
            ...anExercise(),
            name: "Squats",
            executionParameters: repetitionParameters(12, 4, 10),
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
      const repository = new ViewedSessionRepository(database, uuidFactory());
      const created = await repository.create({
        ...validInput(),
        tourRepeatCount: 3,
        exercises: [
          {
            ...anExercise(),
            name: "Échauffement",
            structuralPosition: "BEFORE_TOUR",
            executionParameters: durationParameters(10),
          },
          { ...anExercise(), name: "Gainage", structuralPosition: "IN_TOUR", executionParameters: durationParameters(20) },
          {
            ...anExercise(),
            name: "Étirements",
            structuralPosition: "AFTER_TOUR",
            executionParameters: durationParameters(5),
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
      const repositoryOldest = new ViewedSessionRepository(database, uuidFactory(), clockOldest);
      const sessionOldest = await repositoryOldest.create({ ...validInput(), name: "Créée en premier" });

      const clockMiddle = fixedClock(["2026-01-02T00:00:00.000Z"]);
      const repositoryMiddle = new ViewedSessionRepository(database, secondUuidFactory(), clockMiddle);
      const sessionMiddle = await repositoryMiddle.create({ ...validInput(), name: "Créée ensuite" });

      const clockNewest = fixedClock(["2026-01-03T00:00:00.000Z"]);
      const repositoryNewest = new ViewedSessionRepository(database, thirdUuidFactory(), clockNewest);
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
    // PRE-7 (R-3, C05) : plus de Séance sans Zone — celles de ses Mouvements (au moins une).
    it("exposes an empty categoryNames (zero value) and the Zones of its Movements as bodyZoneNames", async () => {
      const repository = new ViewedSessionRepository(database, uuidFactory());
      const created = await repository.create(validInput());

      const summaries = await repository.listActive();
      const summary = summaries.find((item) => item.id === created.id);
      expect(summary?.categoryNames).toEqual([]);
      expect(summary?.bodyZoneNames).toEqual(["Cuisses"]);
    });

    it("exposes exactly one bodyZoneName (one value)", async () => {
      const repository = new ViewedSessionRepository(database, uuidFactory());
      const created = await repository.create({
        ...validInput(),
        exercises: [{ ...anExercise(), bodyZoneIds: ["genoux"] }],
      });

      const summaries = await repository.listActive();
      const summary = summaries.find((item) => item.id === created.id);
      expect(summary?.bodyZoneNames).toEqual(["Genoux"]);
    });

    it("unions bodyZoneNames WITHOUT LOSS across ALL persisted Activities of the Session, deduplicated and ordered by the referential (never insertion order, many values)", async () => {
      const repository = new ViewedSessionRepository(database, uuidFactory());
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
      const repository = new ViewedSessionRepository(database, uuidFactory());
      const first = await repository.create({
        ...validInput(),
        name: "Première",
        // PRE-7 (R-3, C05) : deux Mouvements distincts (un même nom serait un même Mouvement).
        exercises: [{ ...anExercise(), name: "Fentes", bodyZoneIds: ["genoux"] }],
      });

      const secondRepository = new ViewedSessionRepository(database, secondUuidFactory());
      const second = await secondRepository.create({
        ...validInput(),
        name: "Deuxième",
        exercises: [{ ...anExercise(), name: "Pompes", bodyZoneIds: ["dos"] }],
      });

      const summaries = await repository.listActive();
      expect(summaries.find((item) => item.id === first.id)?.bodyZoneNames).toEqual(["Genoux"]);
      expect(summaries.find((item) => item.id === second.id)?.bodyZoneNames).toEqual(["Dos"]);
    });
  });

  /**
   * V2-PRE-1 (plan §3.3/§7, REQ-001108DC7F67664C) : `session_stop_points`
   * référence la Séance directement. PRE-6 (story 1.2, AD-36) : `position`
   * est l'emplacement reçu, enregistré tel quel (plus de renumérotation), et
   * une modification remplace les points par ceux du brouillon.
   */
  describe("Points d'arrêt (V2-PRE-1, plan §3.3/§7, REQ-001108DC7F67664C)", () => {
    /** Avant : Échauffement ; Circuit : Gainage, Pompes ; après : Étirement. */
    function structuredInput(): CreateSessionInput {
      return {
        ...validInput(),
        exercises: [
          anExercise({ structuralPosition: "BEFORE_TOUR", name: "Échauffement" }),
          anExercise(),
          anExercise({ name: "Pompes" }),
          anExercise({ structuralPosition: "AFTER_TOUR", name: "Étirement" }),
        ],
      };
    }

    // `randomUUID` plutôt que `uuidFactory()` (liste `IDS` finie, consommée
    // par session/cycle/tour/activités) : ces scénarios persistent aussi des
    // Points d'arrêt, chacun consommant son propre identifiant.
    it("create(): persists stop points at the received position, and rereads them in displayed scope order (D-061) then position", async () => {
      const repository = new ViewedSessionRepository(database, randomUUID);

      const created = await repository.create({
        ...structuredInput(),
        stopPoints: [
          { scope: "IN_TOUR", position: 1 },
          { scope: "BEFORE_TOUR", position: 1 },
          { scope: "AFTER_TOUR", position: 0 },
        ],
      });

      expect(created.stopPoints).toEqual([
        { id: expect.any(String), scope: "BEFORE_TOUR", position: 1 },
        { id: expect.any(String), scope: "IN_TOUR", position: 1 },
        { id: expect.any(String), scope: "AFTER_TOUR", position: 0 },
      ]);

      const reread = await repository.findById(created.id);
      expect(reread?.stopPoints).toEqual(created.stopPoints);
    });

    it("create(): omits stopPoints entirely from the read aggregate when none was given — never an empty array", async () => {
      const repository = new ViewedSessionRepository(database, uuidFactory());

      const created = await repository.create(validInput());

      expect(created.stopPoints).toBeUndefined();
    });

    it("create(): rejects a forbidden, out-of-range or duplicate stop point and writes nothing", async () => {
      const repository = new ViewedSessionRepository(database, randomUUID);

      for (const stopPoints of [
        [{ scope: "BEFORE_TOUR" as const, position: 0 }],
        [{ scope: "IN_TOUR" as const, position: 3 }],
        [
          { scope: "IN_TOUR" as const, position: 1 },
          { scope: "IN_TOUR" as const, position: 1 },
        ],
      ]) {
        await expect(repository.create({ ...structuredInput(), stopPoints })).rejects.toBeInstanceOf(
          SessionValidationError,
        );
      }
      expect(await repository.listActive()).toEqual([]);
    });

    it("update(): replaces the previous stop points with the draft's own", async () => {
      const repository = new ViewedSessionRepository(database, randomUUID);
      const created = await repository.create({
        ...structuredInput(),
        stopPoints: [{ scope: "IN_TOUR", position: 1 }],
      });

      const input = toUpdateSessionInput({
        ...toSessionDraft(created),
        stopPoints: [{ id: "draft-point", scope: "AFTER_TOUR", position: 0 }],
      });
      expect(input.ok).toBe(true);
      if (!input.ok) return;
      const outcome = await repository.update(created.id, input.value);

      expect(outcome.status).toBe("UPDATED");
      if (outcome.status === "UPDATED") {
        expect(outcome.session.stopPoints).toEqual([
          { id: expect.any(String), scope: "AFTER_TOUR", position: 0 },
        ]);
      }
    });

    it("update(): a reopened, renamed then saved session keeps its stop points at the same places (R2)", async () => {
      const repository = new ViewedSessionRepository(database, randomUUID);
      const created = await repository.create({
        ...structuredInput(),
        stopPoints: [
          { scope: "IN_TOUR", position: 1 },
          { scope: "AFTER_TOUR", position: 0 },
        ],
      });

      const reopened = await repository.findById(created.id);
      const draft: SessionDraft = { ...toSessionDraft(reopened!), name: "Renommée" };
      const input = toUpdateSessionInput(draft);
      expect(input.ok).toBe(true);
      if (!input.ok) return;
      await repository.update(created.id, input.value);

      const reread = await repository.findById(created.id);
      expect(reread?.name).toBe("Renommée");
      expect(reread?.stopPoints?.map(({ scope, position }) => ({ scope, position }))).toEqual([
        { scope: "IN_TOUR", position: 1 },
        { scope: "AFTER_TOUR", position: 0 },
      ]);
    });
  });

  describe("update — modification bout en bout par identité (T01-S10, plan §5.2)", () => {
    it("updates a kept Activity in place: same identifier, session/cycle/tour identifiers preserved", async () => {
      const repository = new ViewedSessionRepository(database, uuidFactory());
      const created = await repository.create(validInput());
      const keptId = created.cycle.tour.exercises[0]!.id;

      const outcome = await repository.update(
        created.id,
        anUpdateInput({
          sourceSessionId: created.id,
          name: "Nom modifié",
          activities: [anUpdateActivity({ id: keptId, name: "Gainage renforcé", executionParameters: durationParameters(45) })],
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
        executionParameters: durationParameters(45),
      });

      const reopened = await repository.findById(created.id);
      expect(reopened?.cycle.tour.exercises[0]?.id).toBe(keptId);
    });

    it("adds a new Activity, removes a dropped one, keeps the survivor's id", async () => {
      const repository = new ViewedSessionRepository(database, uuidFactory());
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
      const repository = new ViewedSessionRepository(database, uuidFactory());
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
      const repository = new ViewedSessionRepository(database, uuidFactory());
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
      const repository = new ViewedSessionRepository(database, uuidFactory());
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

    it("persists an all-failure Repetitions Activity (former third mode, PRE-4) and rereads it; the estimate becomes a lower bound", async () => {
      const repository = new ViewedSessionRepository(database, uuidFactory());
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
              executionParameters: allFailureParameters(4),
            }),
          ],
        }),
      );

      expect(outcome.status).toBe("UPDATED");
      if (outcome.status !== "UPDATED") throw new Error("expected UPDATED");
      const reopened = await repository.findById(created.id);
      expect(reopened?.cycle.tour.exercises[0]).toMatchObject({
        executionParameters: allFailureParameters(4),
      });
      const row = await database.getFirstAsync<Record<string, unknown>>(
        "SELECT execution_mode, duration_seconds, repetition_count, series_count FROM activities WHERE id = ?",
        [keptId],
      );
      expect(row).toEqual({ execution_mode: "REPETITIONS", duration_seconds: null, repetition_count: null, series_count: 4 });
      const summaries = await repository.listActive();
      expect(summaries.find((s) => s.id === created.id)?.isEstimatedDurationApproximate).toBe(true);
    });

    it("rehydrates Activities before / in / after the Tour, in reading order", async () => {
      const repository = new ViewedSessionRepository(database, uuidFactory());
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
      const repository = new ViewedSessionRepository(database, uuidFactory());
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
      const repository = new ViewedSessionRepository(database, uuidFactory());
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
      const repository = new ViewedSessionRepository(database, uuidFactory());

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
      const repository = new ViewedSessionRepository(database, uuidFactory());
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
      const repository = new ViewedSessionRepository(database, uuidFactory());
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
    // des Activités et suppression des Zones précédentes). PRE-7 (R-3, C05) : les
    // Zones appartiennent au Mouvement, réécrit AVANT les occurrences ; l'échec
    // porte sur l'insertion de l'occurrence nouvelle, après la mise à jour de la
    // Séance, du Tour, du Mouvement corrigé (nom, Zones) et la fusion des occurrences. V2-PRE-1 (plan
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
      const repository = new ViewedSessionRepository(
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
          { ...anExercise(), name: "Gainage", executionParameters: durationParameters(30), bodyZoneIds: ["dos"] },
          { ...anExercise(), name: "Squats", executionParameters: durationParameters(40) },
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
        `SELECT id, source_movement_id, type, tour_id, position, execution_mode,
                duration_seconds, repetition_count, series_count, pause_seconds,
                created_at, updated_at
         FROM activities WHERE session_id = ? ORDER BY position ASC`,
        [created.id],
      );
      const zoneRows = () =>
        database.getAllAsync(
          `SELECT movement_id, body_zone_id FROM movement_body_zones
           WHERE movement_id IN ('mov:gainage', 'mov:squats', 'mov:fentes') ORDER BY movement_id, body_zone_id`,
        );
      const movementRows = () => database.getAllAsync("SELECT id, name, updated_at FROM movements ORDER BY id");
      const beforeZoneRows = await zoneRows();
      const beforeMovementRows = await movementRows();

      // update() qui échoue à la dernière écriture, avec une horloge
      // DIFFÉRENTE (jamais rejouée si le rollback est intégral).
      const failingRepository = new ViewedSessionRepository(
        new FailingActivityInsertDatabase(database),
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
                executionParameters: durationParameters(45),
                position: 0,
                bodyZoneIds: ["epaules"],
              }),
              anUpdateActivity({ id: "brand-new-activity", name: "Fentes", position: 1 }),
            ],
          }),
        ),
      ).rejects.toThrow("forced activity failure");

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
          `SELECT id, source_movement_id, type, tour_id, position, execution_mode,
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

      expect(await zoneRows()).toEqual(beforeZoneRows);
      expect(beforeZoneRows).toEqual([
        { movement_id: "mov:gainage", body_zone_id: "dos" },
        { movement_id: "mov:squats", body_zone_id: "cuisses" },
      ]);
      // Le Mouvement corrigé (« Gainage renforcé ») et le Mouvement nouveau (« Fentes ») sont annulés.
      expect(await movementRows()).toEqual(beforeMovementRows);
      expect((beforeMovementRows as { name: string }[]).map((row) => row.name)).toEqual(["Gainage", "Squats"]);
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
      const repository = new ViewedSessionRepository(database, uuidFactory());

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
      const repository = new ViewedSessionRepository(database, uuidFactory());

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
      const repository = new ViewedSessionRepository(database, uuidFactory());
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
      const repository = new ViewedSessionRepository(database, uuidFactory());
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
      const repository = new ViewedSessionRepository(database, uuidFactory());
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
      const repository = new ViewedSessionRepository(database, uuidFactory());
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

  /**
   * PRE-4, décision Q53 de Hermann (2026-10-18) : une Zone retirée déjà affectée à un
   * Exercice ne bloque ni la Copie de cet Exercice dans une Séance, ni l'enregistrement de
   * la Séance ; la Copie garde l'affectation. Une Zone retirée affectée nulle part, ou
   * ajoutée à une occurrence existante qui ne l'avait pas, reste refusée (D-210).
   */
  describe("PRE4-Q53 — Zone retirée héritée de la source", () => {
    let sequence = 0;
    const ids = (prefix: string) => () => `${prefix}-${++sequence}`;
    // PRE-7 (R-3, C05) : la Copie d'une Définition est une occurrence de SON Mouvement — aucun
    // contenu recopié, aucune affectation nouvelle ; la garde ne porte que sur les Mouvements
    // nouveaux ou corrigés depuis la Séance.
    async function definitionWithZones(bodyZoneIds: readonly string[]): Promise<string> {
      const definitions = new SqliteActivityDefinitionRepository(database, () => "def-q53");
      const definition = await definitions.create({
        name: "Squat",
        description: null,
        category: { kind: "EXISTING", categoryId: "cardio" },
        bodyZoneIds,
        executionParameters: durationParameters(30),
      });
      return definition.movementId;
    }

    it("PRE4-Q53/create-copy — nouvelle Séance avec la Copie d'un Exercice dont une Zone a été retirée : enregistrée, affectation conservée", async () => {
      const movementId = await definitionWithZones(["cuisses", "dos"]);
      await database.runAsync(`UPDATE body_zones SET is_active = 0 WHERE id = 'cuisses'`);
      const repository = new ViewedSessionRepository(database, uuidFactory());

      const created = await repository.create({
        ...validInput(),
        exercises: [{ ...anExercise({ name: undefined }), sourceMovementId: movementId }],
      });

      expect(created.cycle.tour.exercises[0]?.bodyZoneIds).toEqual(["cuisses", "dos"]);
      const reopened = await repository.findById(created.id);
      expect(reopened?.cycle.tour.exercises[0]?.bodyZoneIds).toEqual(["cuisses", "dos"]);
    });

    it("PRE4-Q53/create-duplicate — deux Copies de la même source dans une Séance, puis une Copie d'une occurrence existante : toutes enregistrées", async () => {
      const repository = new ViewedSessionRepository(database, ids("ses"));
      const first = await repository.create({
        ...validInput(),
        exercises: [{ ...anExercise(), bodyZoneIds: ["cuisses"] }],
      });
      await database.runAsync(`UPDATE body_zones SET is_active = 0 WHERE id = 'cuisses'`);

      // Source : l'occurrence de la première Séance (aucune Définition ne porte la Zone).
      const second = await repository.create({
        ...validInput(),
        exercises: [
          { ...anExercise(), bodyZoneIds: ["cuisses"] },
          { ...anExercise({ name: "Gainage bis" }), bodyZoneIds: ["cuisses"] },
        ],
      });

      expect(second.cycle.tour.exercises.map((activity) => activity.bodyZoneIds)).toEqual([["cuisses"], ["cuisses"]]);
      expect(first.id).not.toBe(second.id);
    });

    it("PRE4-Q53/update-new-copy — Séance existante : une Copie ajoutée garde la Zone retirée de sa source ; l'occurrence existante qui l'avait la garde", async () => {
      const movementId = await definitionWithZones(["cuisses", "dos"]);
      const repository = new ViewedSessionRepository(database, uuidFactory());
      const created = await repository.create({
        ...validInput(),
        exercises: [{ ...anExercise(), bodyZoneIds: ["cuisses"] }],
      });
      const keptId = created.cycle.tour.exercises[0]!.id;
      await database.runAsync(`UPDATE body_zones SET is_active = 0 WHERE id = 'cuisses'`);

      const outcome = await repository.update(
        created.id,
        anUpdateInput({
          sourceSessionId: created.id,
          activities: [
            anUpdateActivity({ id: keptId, bodyZoneIds: ["cuisses"] }),
            anUpdateActivity({ id: "occ-q53-new", position: 1, name: undefined, sourceMovementId: movementId }),
          ],
        }),
      );

      expect(outcome.status).toBe("UPDATED");
      if (outcome.status !== "UPDATED") throw new Error("expected UPDATED");
      expect(outcome.session.cycle.tour.exercises.map((activity) => activity.bodyZoneIds)).toEqual([
        ["cuisses"],
        ["cuisses", "dos"],
      ]);
    });

    it("PRE4-Q53/refuse-first-assignment — Zone retirée affectée nulle part : refusée à la création ; Zone retirée ajoutée à une occurrence existante qui ne l'avait pas : refusée, même affectée ailleurs", async () => {
      await database.runAsync(`UPDATE body_zones SET is_active = 0 WHERE id = 'epaules'`);
      const repository = new ViewedSessionRepository(database, ids("ses"));
      await expect(
        repository.create({ ...validInput(), exercises: [{ ...anExercise(), bodyZoneIds: ["epaules"] }] }),
      ).rejects.toThrow(RetiredBodyZoneError);

      await definitionWithZones(["cuisses"]);
      const created = await repository.create({
        ...validInput(),
        exercises: [{ ...anExercise(), bodyZoneIds: ["dos"] }],
      });
      const keptId = created.cycle.tour.exercises[0]!.id;
      await database.runAsync(`UPDATE body_zones SET is_active = 0 WHERE id = 'cuisses'`);
      await expect(
        repository.update(
          created.id,
          anUpdateInput({
            sourceSessionId: created.id,
            activities: [anUpdateActivity({ id: keptId, bodyZoneIds: ["dos", "cuisses"] })],
          }),
        ),
      ).rejects.toThrow(RetiredBodyZoneError);
      const reopened = await repository.findById(created.id);
      expect(reopened?.cycle.tour.exercises[0]?.bodyZoneIds).toEqual(["dos"]);
    });
  });

  /**
   * PRE-4, décision Q53 (8) de Hermann (2026-10-18) : même règle pour la Catégorie d'une
   * Copie et l'Étiquette d'une Séance — une Copie ou une Séance NOUVELLE garde une valeur
   * retirée déjà affectée ailleurs ; affectée nulle part, ou nouvelle sur un objet existant,
   * elle reste refusée (D-210).
   */
  describe("PRE4-Q53 (8) — Catégorie et Étiquette retirées héritées", () => {
    it("PRE4-Q53/category-copy — nouvelle Séance avec la Copie d'une Définition dont la Catégorie a été retirée : enregistrée ; occurrence existante passant à une autre Catégorie retirée : refusée", async () => {
      const definitions = new SqliteActivityDefinitionRepository(database, () => "def-q53-cat");
      const definition = await definitions.create({
        name: "Squat",
        description: null,
        category: { kind: "EXISTING", categoryId: "cardio" },
        bodyZoneIds: ["cuisses"],
        executionParameters: durationParameters(30),
      });
      await database.runAsync("UPDATE categories SET is_active = 0 WHERE id IN ('cardio', 'mobilite')");
      const repository = new ViewedSessionRepository(database, () => `q53c-${randomUUID()}`);
      const created = await repository.create({
        ...validInput(),
        // PRE-7 (R-3, C05) : occurrence du Mouvement de la Définition, Catégorie relue dans le Mouvement.
        exercises: [{ ...anExercise({ name: undefined }), sourceMovementId: definition.movementId }],
      });
      expect(created.cycle.tour.exercises[0]?.categoryId).toBe("cardio");
      const keptId = created.cycle.tour.exercises[0]!.id;
      await expect(
        repository.update(
          created.id,
          anUpdateInput({
            sourceSessionId: created.id,
            // Correction du Mouvement depuis la Séance vers une autre Catégorie retirée.
            activities: [anUpdateActivity({ id: keptId, name: "Squat", categoryId: "mobilite", bodyZoneIds: ["cuisses"] })],
          }),
        ),
      ).rejects.toThrow(RetiredOccurrenceCategoryError);
      await expect(
        repository.create({ ...validInput(), exercises: [{ ...anExercise(), categoryId: "mobilite" }] }),
      ).rejects.toThrow(RetiredOccurrenceCategoryError);
    });

    it("PRE4-Q53/label-duplicate — Séance nouvelle (duplication) avec l'Étiquette retirée d'une autre Séance : enregistrée ; Étiquette retirée affectée nulle part : refusée ; modification vers une Étiquette retirée : refusée", async () => {
      await database.runAsync(
        `INSERT INTO labels (id, name, canonical_key, color, is_active, created_at) VALUES
         ('label-a', 'Sport', 'sport', '#2E9B62', 1, '2026-01-01T00:00:00.000Z'),
         ('label-b', 'Yoga', 'yoga', '#3B82F6', 1, '2026-01-01T00:00:00.000Z')`,
      );
      const repository = new ViewedSessionRepository(database, () => `q53-${randomUUID()}`);
      const source = await repository.create({ ...validInput(), labelId: "label-a" });
      await database.runAsync("UPDATE labels SET is_active = 0");
      const copy = await repository.create({ ...validInput(), name: "Copie", labelId: "label-a" });
      expect(copy.labelId).toBe("label-a");
      await expect(repository.create({ ...validInput(), labelId: "label-b" })).rejects.toThrow(RetiredLabelError);
      const keptId = source.cycle.tour.exercises[0]!.id;
      await expect(
        repository.update(
          source.id,
          anUpdateInput({ sourceSessionId: source.id, labelId: "label-b", activities: [anUpdateActivity({ id: keptId })] }),
        ),
      ).rejects.toThrow(RetiredLabelError);
    });
  });

  describe("findSessionStatus (T01-S10)", () => {
    it("returns ACTIVE for an active session, ARCHIVED for an archived one, null for an unknown id", async () => {
      const repository = new ViewedSessionRepository(database, uuidFactory());
      const active = await repository.create(validInput());

      const secondRepository = new ViewedSessionRepository(database, secondUuidFactory());
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
      const repository = new ViewedSessionRepository(database, uuidFactory());
      const created = await repository.create({
        ...validInput(),
        // PRE-4 (AD-3) : la direction écrite et relue est celle des paramètres.
        exercises: [{ ...anExercise(), sideMode: "RIGHT_LEFT", executionParameters: durationParameters(30, 1, 0, { sideMode: "RIGHT_LEFT" }) }],
      });

      expect(created.cycle.tour.exercises[0]?.sideMode).toBe("RIGHT_LEFT");

      const reopened = await repository.findById(created.id);
      expect(reopened?.cycle.tour.exercises[0]?.sideMode).toBe("RIGHT_LEFT");
    });

    it("defaults a fresh Activity to UNILATERAL when no side mode is provided", async () => {
      const repository = new ViewedSessionRepository(database, uuidFactory());
      const created = await repository.create(validInput());

      expect(created.cycle.tour.exercises[0]?.sideMode).toBe("UNILATERAL");
    });

    it("updates each Activity's own side mode through update()", async () => {
      const repository = new ViewedSessionRepository(database, uuidFactory());
      const created = await repository.create(validInput());
      const activityId = created.cycle.tour.exercises[0]!.id;

      const outcome = await repository.update(
        created.id,
        anUpdateInput({
          sourceSessionId: created.id,
          activities: [
            anUpdateActivity({
              id: activityId,
              sideMode: "LEFT_RIGHT",
              executionParameters: durationParameters(30, 1, 0, { sideMode: "LEFT_RIGHT" }),
            }),
          ],
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
      const repository = new ViewedSessionRepository(database, uuidFactory());
      const created = await repository.create({
        ...validInput(),
        exercises: [
          {
            ...anExercise(),
            executionParameters: durationParameters(30, 3, 15, { sideMode: "RIGHT_LEFT" }),
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
      const repository = new ViewedSessionRepository(database, uuidFactory());
      const created = await repository.create({
        ...validInput(),
        exercises: [
          {
            ...anExercise(),
            id: "warmup",
            structuralPosition: "BEFORE_TOUR",
            executionParameters: durationParameters(10),
          },
          {
            ...anExercise(),
            id: "core",
            structuralPosition: "IN_TOUR",
            executionParameters: durationParameters(10, 1, 0, { sideMode: "RIGHT_LEFT" }),
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
      const repository = new ViewedSessionRepository(database, uuidFactory());
      const created = await repository.create(validInput());
      // La lecture complète (`findById`, qui rappelle `assertActivityRow`)
      // ne lève jamais pour une Séance persistée normalement.
      await expect(repository.findById(created.id)).resolves.not.toBeNull();
    });
  });
});

function validInput(): ViewedCreateSessionInput {
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

function anExercise(overrides: Partial<ViewedCreateActivity> = {}): ViewedCreateActivity {
  return {
    type: "EXERCISE",
    structuralPosition: "IN_TOUR",
    name: "Gainage",
    executionParameters: durationParameters(30),
    postActivityRecoverySeconds: 0,
    instruction: null,
    bodyZoneIds: [],
    ...overrides,
  };
}

/** Activité d'un `UpdateSessionInput` (T01-S10) — Exercice Durée par défaut, `id` explicite (fusion par identité). */
function anUpdateActivity(
  overrides: Partial<ViewedUpdateActivity> = {},
): ViewedUpdateActivity {
  return {
    id: "act-1",
    type: "EXERCISE",
    structuralPosition: "IN_TOUR",
    position: 0,
    name: "Gainage",
    executionParameters: durationParameters(30),
    postActivityRecoverySeconds: 0,
    instruction: null,
    bodyZoneIds: [],
    ...overrides,
  };
}

function anUpdateInput(overrides: Partial<ViewedUpdateSessionInput> = {}): ViewedUpdateSessionInput {
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

/**
 * PRE-8 (A.4, `migration014`) : lignes persistées d'une Séance à Circuit unique — en-tête,
 * Circuit au niveau principal et un Exercice dans ce Circuit.
 */
function validStored(overrides: Partial<StoredSession> = {}): StoredSession {
  return {
    header: {
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
    },
    cycles: [],
    // Colonne SQL technique `side_mode`, sans influence fonctionnelle (V2-PRE-1) ; nature `migration011`.
    circuits: [{ id: IDS[2]!, session_id: IDS[0]!, cycle_id: null, position: 0, repeat_count: 1, side_mode: "UNILATERAL", nature: "TOURS" }],
    activities: [validActivityRow()],
    stopPoints: [],
    ...overrides,
  };
}

function validActivityRow(): ActivityRow {
  return {
    id: IDS[3]!,
    session_id: IDS[0]!,
    tour_id: IDS[2]!,
    type: "EXERCISE",
    position: 0,
    execution_mode: "DURATION",
    duration_seconds: 30,
    repetition_count: null,
    series_count: 1,
    pause_seconds: 0,
    post_activity_recovery_seconds: 0,
    post_activity_recovery_present: 0,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    // V2-BILAT-01 : direction propre de l'Activité (`migration005`, défaut `'UNILATERAL'`).
    side_mode: "UNILATERAL",
    execution_parameters: serializeResolvedExecutionParameters(durationParameters(30)),
    // PRE-7 (R-3, `migration013`) : Mouvement de l'occurrence (contenu relu dans le Mouvement) et numéro de copie.
    source_movement_id: "mov-1",
    copy_number: null,
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
      version: EXECUTION_PARAMETERS_VERSION,
      mode: "DURATION",
      series: {
        kind: "VARIABLE",
        rows: [
          { target: numberTarget(30), pauseSeconds: 10, loadKg: 0 },
          { target: numberTarget(45), pauseSeconds: 20, loadKg: 0 },
          { target: numberTarget(60), pauseSeconds: 30, loadKg: 0 },
        ],
        workPhases: [],
      },
      sideMode: "RIGHT_LEFT",
      sideOrder: "BY_SIDE",
      sideRecoverySeconds: 15,
      cadenceBeepIntervalSeconds: 0,
      countdownSeconds: 10,
      endSeconds: 5,
      loadEnabled: false,
      ...overrides,
    };
  }

  function occurrence(overrides: Partial<ViewedCreateActivity> = {}): ViewedCreateActivity {
    return {
      type: "EXERCISE",
      structuralPosition: "IN_TOUR",
      name: "Fentes",
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

  function sessionInput(exercises: readonly ViewedCreateActivity[], tourRepeatCount = 1): ViewedCreateSessionInput {
    return { name: "Jambes", initialCountdownSeconds: 10, finalPhaseSeconds: 5, tourRepeatCount, exercises };
  }

  /**
   * PRE-7 (R-3, D-445 C05) : corrige, dans le brouillon, le Mouvement de l'occurrence
   * `exerciseId` (`EDITED`, ou `NEW` pour une création locale) ; toutes ses occurrences
   * affichent le nouveau contenu.
   */
  function withMovementChange(
    draft: SessionDraft,
    exerciseId: string,
    change: Partial<Omit<DraftMovement, "id">>,
  ): SessionDraft {
    const exercise = draft.exercises.find((candidate) => candidate.id === exerciseId)!;
    return { ...draft, ...withDraftMovement(draft, { ...draftMovementOf(exercise, "EDITED"), ...change }) };
  }

  function updateFromDraft(session: Session, mutate: (draft: SessionDraft) => SessionDraft): UpdateSessionInput {
    const result = toUpdateSessionInput(mutate(toSessionDraft(session)));
    if (!result.ok) {
      throw new Error(JSON.stringify(result.violations));
    }
    return result.value;
  }

  it("P3-01/Session:create, P3-01/Session:edit, P3-01/Catalogue:create, P3-01/Catalogue:edit — la copie se rouvre complète ; Continuer seul la persiste", async () => {
    const repository = new ViewedSessionRepository(database, ids("ses"));
    const created = await repository.create(sessionInput([occurrence()]));
    const read = (await repository.findById(created.id))!.cycle.tour.exercises[0]!;
    expect(read.executionParameters).toEqual(parameters());
    expect(read.categoryId).toBe("cardio");
    expect(read.media?.map((item) => [item.assetId, item.position, item.asset.kind])).toEqual([
      ["v1", 0, "VIDEO"],
      ["p1", 1, "PHOTO"],
    ]);
    // Modification de la copie : cadence, ordre des côtés ; ordre des médias, porté par le
    // Mouvement (PRE-7, R-3, C05 : correction du Mouvement depuis le brouillon).
    const edited = parameters({ cadenceBeepIntervalSeconds: 3, sideOrder: "BY_SERIES" });
    const outcome = await repository.update(
      created.id,
      updateFromDraft(created, (draft) => {
        const withParameters = {
          ...draft,
          exercises: draft.exercises.map((exercise) => ({ ...exercise, executionParameters: edited })),
        };
        return withMovementChange(withParameters, read.id, {
          media: [...(withParameters.exercises[0]!.media ?? [])].reverse(),
        });
      }),
    );
    const updated = outcome.status === "UPDATED" ? outcome.session.cycle.tour.exercises[0]! : null;
    expect(updated?.id).toBe(read.id);
    expect(updated?.executionParameters).toEqual(edited);
    expect(updated?.media?.map((item) => item.assetId)).toEqual(["p1", "v1"]);
    // Aucune définition Catalogue n'est créée ni modifiée par la Séance.
    const definitions = await database.getFirstAsync<{ count: number }>("SELECT COUNT(*) AS count FROM activity_definitions");
    expect(definitions?.count).toBe(0);
  });

  it("PRE4-4.1/AC13 — occurrence existante supprimée entre l'ouverture et l'enregistrement : ACTIVITY_NOT_FOUND, base inchangée ; occurrence nouvelle du Brouillon : insérée", async () => {
    const repository = new ViewedSessionRepository(database, ids("ses"));
    const created = await repository.create(sessionInput([occurrence(), occurrence({ name: "Squats" })]));
    const [kept, deleted] = created.cycle.tour.exercises;
    // PRE-7 (R-3, C05) : renommer = corriger le Mouvement de chaque occurrence ; l'occurrence
    // nouvelle est une création locale, à son propre Mouvement `NEW`.
    const fresh = { ...toSessionDraft(created).exercises[0]!, id: "occ-new", sourceMovementId: "occ-new", name: "Pompes" };
    const input = updateFromDraft(created, (draft) => {
      let next: SessionDraft = { ...draft, name: "Jambes modifiées", exercises: [...draft.exercises, fresh] };
      for (const exercise of draft.exercises) {
        next = withMovementChange(next, exercise.id, { name: `${exercise.name} bis` });
      }
      return withMovementChange(next, fresh.id, { change: "NEW" });
    });
    expect(input.persistedActivityIds).toEqual([kept!.id, deleted!.id]);

    await database.runAsync("DELETE FROM activities WHERE id = ?", [deleted!.id]);
    const snapshot = async () => {
      const result: Record<string, unknown[]> = {};
      const tables = await database.getAllAsync<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'");
      for (const { name } of tables) {
        result[name] = (await database.getAllAsync(`SELECT * FROM "${name}"`)).map((row) => JSON.stringify(row)).sort();
      }
      return result;
    };
    const before = await snapshot();

    expect(await repository.update(created.id, input)).toEqual({ status: "ACTIVITY_NOT_FOUND" });
    expect(await snapshot()).toEqual(before);

    // Sans l'occurrence supprimée, la même modification passe : l'occurrence nouvelle est insérée.
    const withoutDeleted = { ...input, activities: input.activities.filter((activity) => activity.id !== deleted!.id) };
    const outcome = await repository.update(created.id, withoutDeleted);
    expect(outcome.status).toBe("UPDATED");
    const names = (
      await database.getAllAsync<{ id: string; name: string }>(
        "SELECT activities.id AS id, movements.name AS name FROM activities JOIN movements ON movements.id = activities.source_movement_id ORDER BY activities.position",
      )
    )
      .map((row) => [row.id, row.name]);
    expect(names).toEqual([
      [kept!.id, "Fentes bis"],
      ["occ-new", "Pompes"],
    ]);
  });

  it("PRE4-4.1/AC13 — la marque des occurrences chargées n'entre pas dans l'égalité du Brouillon ni dans la base", async () => {
    const repository = new ViewedSessionRepository(database, ids("ses"));
    const created = await repository.create(sessionInput([occurrence()]));
    const draft = toSessionDraft(created);
    expect(draft.persistedExerciseIds).toEqual([created.cycle.tour.exercises[0]!.id]);
    expect(sessionDraftsEqual(draft, { ...draft, persistedExerciseIds: [] })).toBe(true);
    expect(isSessionDraftDirty({ ...draft, persistedExerciseIds: undefined }, draft)).toBe(false);
    const columns = await database.getAllAsync<{ name: string }>("PRAGMA table_info(activities)");
    expect(columns.map((column) => column.name).filter((name) => /persist/i.test(name))).toEqual([]);
  });

  it("P3-03/reference-retired — Catégorie et Zone retirées conservées ; nouvelle affectation retirée refusée", async () => {
    const repository = new ViewedSessionRepository(database, ids("ses"));
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
    // PRE-4 Q53 (8) : « cardio » est encore affectée au Mouvement ci-dessus (PRE-7, R-3 : seul
    // porteur de la Catégorie) — un Mouvement nouveau en hérite ; une Catégorie retirée affectée
    // nulle part reste refusée.
    const copy = await repository.create(
      sessionInput([occurrence({ name: "Fentes sautées", categoryId: "cardio", bodyZoneIds: ["dos"], media: [] })]),
    );
    expect(copy.cycle.tour.exercises[0]?.categoryId).toBe("cardio");
    await database.runAsync("UPDATE categories SET is_active = 0 WHERE id = 'mobilite'");
    const unused = await database.getFirstAsync<{ n: number }>(
      "SELECT COUNT(*) AS n FROM movements WHERE category_id = 'mobilite'",
    );
    expect(unused?.n).toBe(0);
    await expect(
      repository.create(sessionInput([occurrence({ name: "Fentes latérales", categoryId: "mobilite", bodyZoneIds: ["dos"], media: [] })])),
    ).rejects.toThrow(RetiredOccurrenceCategoryError);
  });

  /**
   * PRE-4 (story 1.1, AD-3) : après `migration010`, une occurrence porte
   * toujours un JSON v2 ; `readV2` est le seul lecteur. Sans JSON, en v1, de
   * version inconnue ou corrompu : erreur de donnée explicite, jamais un
   * repli sur les scalaires (la conversion des anciennes occurrences est
   * celle de `migration010`).
   */
  it("P3-17/corrupt-version (PRE-4 AD-3) — occurrence sans JSON, v1, version inconnue ou corrompue : erreur explicite, jamais un repli scalaire", async () => {
    const repository = new ViewedSessionRepository(database, ids("ses"));
    const created = await repository.create(sessionInput([occurrence({ categoryId: undefined, media: undefined })]));
    const legacy = (await repository.findById(created.id))!.cycle.tour.exercises[0]!;
    // PRE-7 (R-3, C05) : la Catégorie est celle du Mouvement (obligatoire).
    expect(legacy.categoryId).toBe("cardio");
    const v1 = JSON.stringify({
      version: 1,
      mode: "DURATION",
      series: { kind: "UNIFORM", count: 3, target: 30, pauseSeconds: 40 },
      sideMode: "UNILATERAL",
      sideOrder: "BY_SIDE",
      sideRecoverySeconds: 0,
      cadenceBeepIntervalSeconds: 0,
      countdownSeconds: 0,
      endSeconds: 0,
    });
    for (const corrupt of [null, v1, '{"version":7}', "oops"]) {
      await database.runAsync("UPDATE activities SET execution_parameters = ?", [corrupt]);
      await expect(repository.findById(created.id)).rejects.toThrow(ExecutionParametersDataError);
      await expect(repository.listActive()).rejects.toThrow(ExecutionParametersDataError);
    }
  });

  it("P3-13/tours-cycles-list — total de liste = lecture complète par l'autorité unique ; avant/dans/après Circuit, Tours 99, ≈ et ≥", async () => {
    const repository = new ViewedSessionRepository(database, ids("ses"));
    const estimated = parameters({
      mode: "REPETITIONS",
      series: { kind: "UNIFORM", count: 4, target: numberTarget(15), pauseSeconds: 15, loadKg: 0, workPhases: [] },
      sideMode: "UNILATERAL",
      cadenceBeepIntervalSeconds: 4,
    });
    const unknown = parameters({
      mode: "REPETITIONS",
      series: {
        kind: "VARIABLE",
        rows: [
          { target: toTarget("FAILURE"), pauseSeconds: 30, loadKg: 0 },
          { target: toTarget("FAILURE"), pauseSeconds: 45, loadKg: 0 },
          { target: toTarget("FAILURE"), pauseSeconds: 60, loadKg: 0 },
        ],
        workPhases: [],
      },
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
    const repository = new ViewedSessionRepository(database, ids("ses"));
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
    const repository = new ViewedSessionRepository(database, ids("ses"));
    await repository.create(sessionInput([occurrence({ media: [] })]));
    const columns = (await database.getAllAsync<{ name: string }>("PRAGMA table_info(activities)")).map((c) => c.name);
    expect(columns.some((name) => /phrase|segment|summary/i.test(name))).toBe(false);
    const row = await database.getFirstAsync<{ execution_parameters: string }>("SELECT execution_parameters FROM activities");
    // PRE-7 (R-3, C05) : forme Catalogue v5 (durées par `phaseId`, structure lue dans le Mouvement).
    expect(JSON.parse(row!.execution_parameters)).toEqual(
      JSON.parse(serializeCatalogExecutionParameters(splitResolvedParameters(parameters()).parameters)),
    );
  });

  it("P3-16/failure-doubletap et P3-17/transaction-FK — échec en cours : rollback complet ; réessai unique ; IDs et created_at stables", async () => {
    const repository = new ViewedSessionRepository(database, ids("ses"));
    await expect(
      repository.create(sessionInput([occurrence({ media: [{ assetId: "v1", asset: asset("v1", "VIDEO") }, { assetId: "missing" }] })])),
    ).rejects.toThrow();
    const empty = await database.getFirstAsync<Record<string, number>>(
      "SELECT (SELECT COUNT(*) FROM sessions) AS s, (SELECT COUNT(*) FROM activities) AS a, (SELECT COUNT(*) FROM movements) AS mv, (SELECT COUNT(*) FROM media_assets) AS m, (SELECT COUNT(*) FROM movement_media) AS l",
    );
    // PRE-7 (R-3) : le Mouvement nouveau et ses liens sont annulés avec la Séance.
    expect(empty).toEqual({ s: 0, a: 0, mv: 0, m: 0, l: 0 });
    const created = await repository.create(sessionInput([occurrence()]));
    const createdRow = await database.getFirstAsync<{ id: string; created_at: string }>("SELECT id, created_at FROM activities");
    // Réordonnancement (PRE-7, R-3 : liens du Mouvement) : jamais de violation UNIQUE(movement_id, position).
    const outcome = await repository.update(
      created.id,
      updateFromDraft(created, (draft) =>
        withMovementChange(draft, draft.exercises[0]!.id, { media: [...(draft.exercises[0]!.media ?? [])].reverse() }),
      ),
    );
    expect(outcome.status).toBe("UPDATED");
    expect(await database.getFirstAsync("SELECT id, created_at FROM activities")).toEqual(createdRow);
    expect(await database.getAllAsync("PRAGMA foreign_key_check")).toEqual([]);
    const positions = await database.getAllAsync<{ asset_id: string; position: number }>(
      "SELECT asset_id, position FROM movement_media ORDER BY position",
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
        series: { kind: "VARIABLE", rows: [{ target: numberTarget(100), pauseSeconds: 300, loadKg: 0 }, { target: numberTarget(1), pauseSeconds: 0, loadKg: 0 }], workPhases: [] },
        sideOrder: "BY_SERIES",
        cadenceBeepIntervalSeconds: 10,
      });
      const created = await new ViewedSessionRepository(fileDatabase, ids("ses")).create(
        sessionInput([occurrence({ executionParameters: extremes })]),
      );
      fileDatabase.close();
      const reopened = NodeSqliteDatabase.openFile(path);
      try {
        const activity = (await new ViewedSessionRepository(reopened, ids("ses")).findById(created.id))!.cycle.tour.exercises[0]!;
        expect(activity.executionParameters).toEqual(extremes);
        // Projection scalaire (jamais relue comme source) : première Cible, N.
        expect(
          await reopened.getFirstAsync("SELECT repetition_count, series_count FROM activities WHERE id = ?", [activity.id]),
        ).toEqual({ repetition_count: 100, series_count: 2 });
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

  // PRE-7 (R-3, D-445 C05, Q3) : la copie est une nouvelle occurrence du MÊME Mouvement — mêmes
  // liens de médias (aucun lien propre à l'occurrence), numéro de copie 1, paramètres indépendants.
  it("P3-18/copy-complete — duplication : nouvelle occurrence du même Mouvement, mêmes liens, paramètres indépendants", async () => {
    const repository = new ViewedSessionRepository(database, ids("ses"));
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
    expect(copy?.media?.map((item) => item.id)).toEqual(source?.media?.map((item) => item.id));
    expect(copy?.sourceMovementId).toBe(source?.sourceMovementId);
    expect([source?.copyNumber, copy?.copyNumber]).toEqual([null, 1]);
    expect(copy?.name).toBe(source?.name);
    expect(await database.getFirstAsync("SELECT COUNT(*) AS n FROM movements")).toEqual({ n: 1 });
    expect(await database.getFirstAsync("SELECT COUNT(*) AS n FROM movement_media")).toEqual({ n: 2 });
    // Modifier les paramètres de la copie ne touche pas la source.
    const afterEdit = await repository.update(
      created.id,
      updateFromDraft(duplicated.status === "UPDATED" ? duplicated.session : created, (draft) => ({
        ...draft,
        exercises: draft.exercises.map((exercise) =>
          exercise.id === "copy-1" ? { ...exercise, executionParameters: parameters({ cadenceBeepIntervalSeconds: 7 }) } : exercise,
        ),
      })),
    );
    const [finalSource, finalCopy] = afterEdit.status === "UPDATED" ? afterEdit.session.cycle.tour.exercises : [];
    expect(finalSource?.executionParameters).toEqual(parameters());
    expect(finalCopy?.executionParameters).toEqual(parameters({ cadenceBeepIntervalSeconds: 7 }));
    expect(finalSource?.media?.map((item) => item.assetId)).toEqual(["v1", "p1"]);
    expect(finalCopy?.copyNumber).toBe(1);
  });

  it("P3-23/file-preservation — retirer un lien ou une occurrence ne supprime jamais l'asset référencé ailleurs", async () => {
    const repository = new ViewedSessionRepository(database, ids("ses"));
    const media = new SqliteMediaRepository(database);
    // PRE-7 (R-3, C05) : seuls les liens des Mouvements comptent — deux Mouvements partagent « v1 ».
    const created = await repository.create(
      sessionInput([occurrence(), occurrence({ name: "Squats", media: [{ assetId: "v1" }] })]),
    );
    expect(await media.countReferences("v1")).toBe(2);
    // Les liens du premier Mouvement sont retirés (correction depuis le brouillon de Séance).
    const removedLink = await repository.update(
      created.id,
      updateFromDraft(created, (draft) => withMovementChange(draft, draft.exercises[0]!.id, { media: [] })),
    );
    expect(removedLink.status).toBe("UPDATED");
    expect(await media.countReferences("v1")).toBe(1);
    expect(await media.countReferences("p1")).toBe(0);
    // Asset sans référence : conservé (aucune purge globale), toujours lisible.
    expect(await media.findAsset("p1")).toEqual(asset("p1"));
    expect(await media.findAsset("v1")).toEqual(asset("v1", "VIDEO"));
  });
});

/**
 * PRE-4 (story 1.1) — Copies en Séance : format v2, projection scalaire
 * unique, aller-retour exact et refus sans écriture, sur SQLite RÉELLE
 * (AD-3, AD-4, AD-10, AD-13).
 */
describe("SqliteSessionRepository — PRE-4 story 1.1 (NodeSqliteDatabase REAL)", () => {
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

  const asset = (id: string): MediaAsset => ({
    id,
    uri: `kodjo-media/${id}.jpg`,
    createdAt: "2026-10-16T10:00:00.000Z",
    kind: "PHOTO",
    mimeType: "image/jpeg",
    fileName: null,
    sizeBytes: 10,
    durationMs: null,
    width: 1,
    height: 1,
  });

  function copy(parameters: ExecutionParameters, overrides: Partial<ViewedCreateActivity> = {}): ViewedCreateActivity {
    return {
      type: "EXERCISE",
      structuralPosition: "IN_TOUR",
      name: "Copie",
      postActivityRecoverySeconds: 0,
      bodyZoneIds: ["cuisses"],
      executionParameters: parameters,
      categoryId: "cardio",
      ...overrides,
    };
  }

  function sessionOf(exercises: readonly ViewedCreateActivity[]): ViewedCreateSessionInput {
    return { name: "Séance PRE-4", initialCountdownSeconds: 10, finalPhaseSeconds: 5, tourRepeatCount: 1, exercises };
  }

  async function dump(target: Database = database): Promise<Record<string, unknown[]>> {
    const result: Record<string, unknown[]> = {};
    for (const table of [
      "sessions",
      "cycles",
      "tours",
      "activities",
      // PRE-7 (R-3, C05) : le contenu (Zones, médias, Catégorie) appartient aux Mouvements.
      "movements",
      "movement_body_zones",
      "movement_media",
      "movement_phases",
      "movement_aliases",
      "media_assets",
      "categories",
      "session_stop_points",
    ]) {
      result[table] = await target.getAllAsync(`SELECT * FROM ${table} ORDER BY rowid`);
    }
    return result;
  }

  /** Fait échouer la N-ième écriture d'une transaction (motif de `migrateDatabase.test.ts`). */
  class FailingDatabase implements Database {
    writes = 0;
    constructor(
      private readonly inner: Database,
      private readonly failAt: number,
    ) {}
    execAsync(source: string) {
      return this.inner.execAsync(source);
    }
    async runAsync(source: string, parameters?: SqlParameters) {
      this.writes += 1;
      if (this.writes === this.failAt) {
        throw new Error(`Injected failure at write ${this.failAt}`);
      }
      return this.inner.runAsync(source, parameters);
    }
    getFirstAsync<T>(source: string, parameters?: SqlParameters) {
      return this.inner.getFirstAsync<T>(source, parameters);
    }
    getAllAsync<T>(source: string, parameters?: SqlParameters) {
      return this.inner.getAllAsync<T>(source, parameters);
    }
    withExclusiveTransactionAsync(task: (transaction: Database) => Promise<void>) {
      return this.inner.withExclusiveTransactionAsync(() => task(this));
    }
  }

  it("PRE4-1.1/AC16 — projection unique d'une Copie : première Cible FAILURE → duration_seconds NULL (jamais 30) ; Répétitions 12 × 3 ; paramètres relus typés", async () => {
    const repository = new ViewedSessionRepository(database, ids("ses"));
    const mixed = variableParameters({ mode: "DURATION", rows: [["FAILURE", 10], [30, 10]] });
    const reps = uniformParameters({ mode: "REPETITIONS", count: 3, target: 12 });
    const created = await repository.create(sessionOf([copy(mixed, { id: "mixed" }), copy(reps, { id: "reps" })]));
    const rows = await database.getAllAsync<Record<string, unknown>>(
      `SELECT id, execution_mode, duration_seconds, repetition_count, series_count, pause_seconds
       FROM activities ORDER BY position`,
    );
    expect(rows).toEqual([
      { id: "mixed", execution_mode: "DURATION", duration_seconds: null, repetition_count: null, series_count: 2, pause_seconds: 10 },
      { id: "reps", execution_mode: "REPETITIONS", duration_seconds: null, repetition_count: 12, series_count: 3, pause_seconds: 0 },
    ]);
    const stored = await database.getFirstAsync<{ execution_parameters: string }>(
      "SELECT execution_parameters FROM activities WHERE id = 'mixed'",
    );
    // PRE-7 (R-3, C05) : écrit en forme Catalogue v5 (durées par `phaseId`) par l'écrivain unique.
    expect(stored?.execution_parameters).toBe(serializeCatalogExecutionParameters(splitResolvedParameters(mixed).parameters));
    const reread = (await repository.findById(created.id))!.cycle.tour.exercises;
    expect(reread.map((activity) => activity.executionParameters)).toEqual([mixed, reps]);
    for (const scalar of ["executionMode", "durationSeconds", "repetitionCount", "seriesCount", "pauseSeconds"]) {
      expect(reread[0]).not.toHaveProperty(scalar);
    }
  });

  it("PRE4-1.1/AC18 — aller-retour exact des Copies sur base fichier fermée puis rouverte : Durée/Répétitions × identiques/variables, Cibles numériques, à l'échec et mixtes, Récupération exacte", async () => {
    const path = join(tmpdir(), `kodjo-pre4-session-${Date.now()}-${Math.random().toString(16).slice(2)}.db`);
    const common = {
      sideMode: "LEFT_RIGHT" as const,
      sideOrder: "BY_SERIES" as const,
      sideRecoverySeconds: 8,
      cadenceBeepIntervalSeconds: 3,
      countdownSeconds: 5,
      endSeconds: 6,
      loadEnabled: false,
    };
    const cases: readonly ExecutionParameters[] = [
      uniformParameters({ ...common, mode: "DURATION", count: 3, target: 30, pauseSeconds: 10 }),
      uniformParameters({ ...common, mode: "REPETITIONS", count: 4, target: 12, pauseSeconds: 15 }),
      allFailureParameters(3, 10, common),
      uniformParameters({ ...common, mode: "DURATION", count: 2, target: "FAILURE", pauseSeconds: 5 }),
      variableParameters({ ...common, mode: "DURATION", rows: [[30, 10], [45, 20], [60, 30]] }),
      variableParameters({ ...common, mode: "REPETITIONS", rows: [[12, 10], [12, 10], [12, 10]] }),
      variableParameters({ ...common, mode: "REPETITIONS", rows: [[10, 5], [12, 5], ["FAILURE", 5]] }),
      variableParameters({ ...common, mode: "DURATION", rows: [["FAILURE", 5], [40, 5], [50, 5]] }),
      variableParameters({ ...common, mode: "REPETITIONS", rows: [[8, 5], ["FAILURE", 5], [6, 5]] }),
      variableParameters({ ...common, mode: "DURATION", rows: [["FAILURE", 0], ["FAILURE", 20]] }),
    ];
    const fileDatabase = NodeSqliteDatabase.openFile(path);
    try {
      await migrateDatabase(fileDatabase);
      const created = await new ViewedSessionRepository(fileDatabase, ids("ses")).create(
        sessionOf(
          cases.map((parameters, index) =>
            copy(parameters, {
              id: `copy-${index}`,
              name: `Copie ${index}`,
              instruction: `Description ${index}`,
              sideMode: common.sideMode,
              postActivityRecoverySeconds: index * 7,
              bodyZoneIds: ["dos", "cuisses"],
              media: [
                { assetId: `b-${index}`, asset: asset(`b-${index}`) },
                { assetId: `a-${index}`, asset: asset(`a-${index}`) },
              ],
            }),
          ),
        ),
      );
      fileDatabase.close();
      const reopened = NodeSqliteDatabase.openFile(path);
      try {
        const reread = await new ViewedSessionRepository(reopened, ids("ses")).findById(created.id);
        expect(reread).toEqual(created);
        const exercises = reread!.cycle.tour.exercises;
        expect(exercises.map((activity) => activity.id)).toEqual(cases.map((_, index) => `copy-${index}`));
        for (const [index, activity] of exercises.entries()) {
          expect(activity.executionParameters).toEqual(cases[index]);
          expect(activity.executionParameters.series.kind).toBe(cases[index]!.series.kind);
          expect(activity.postActivityRecoverySeconds).toBe(index * 7);
          expect(activity.name).toBe(`Copie ${index}`);
          expect(activity.instruction).toBe(`Description ${index}`);
          expect(activity.categoryId).toBe("cardio");
          expect(activity.bodyZoneIds.slice().sort()).toEqual(["cuisses", "dos"]);
          expect(activity.media?.map((item) => item.assetId)).toEqual([`b-${index}`, `a-${index}`]);
          expect(activity.executionParameters.cadenceBeepIntervalSeconds).toBe(3);
        }
      } finally {
        reopened.close();
      }
    } finally {
      rmSync(path, { force: true });
      rmSync(`${path}-wal`, { force: true });
      rmSync(`${path}-shm`, { force: true });
    }
  });

  it("PRE4-1.1/AC18 — un échec injecté à chaque écriture de l'enregistrement d'une Séance laisse la base dans son état précédent, sans lien orphelin", async () => {
    const input = sessionOf([
      copy(variableParameters({ mode: "REPETITIONS", rows: [[10, 5], ["FAILURE", 5]] }), {
        bodyZoneIds: ["dos", "cuisses"],
        media: [{ assetId: "p1", asset: asset("p1") }],
      }),
      copy(allFailureParameters(3, 10), { name: "Copie après", structuralPosition: "AFTER_TOUR", media: [{ assetId: "p1" }] }),
    ]);
    // Nombre d'écritures d'un enregistrement réussi, mesuré sur une base jetable.
    const probeDatabase = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(probeDatabase);
    const probe = new FailingDatabase(probeDatabase, Number.POSITIVE_INFINITY);
    await new ViewedSessionRepository(probe, ids("probe")).create(input);
    probeDatabase.close();
    const writes = probe.writes;
    expect(writes).toBeGreaterThanOrEqual(8);
    const before = await dump();
    for (let failAt = 1; failAt <= writes; failAt += 1) {
      await expect(
        new ViewedSessionRepository(new FailingDatabase(database, failAt), ids("fail")).create(input),
      ).rejects.toThrow(`Injected failure at write ${failAt}`);
      expect(await dump()).toEqual(before);
    }
    expect(await database.getAllAsync("PRAGMA foreign_key_check")).toEqual([]);
  });

  it("PRE4-1.1/AC8 — une Copie refusée (Cible UNSET) ne laisse aucune ligne, Zone, Catégorie ni Média ajouté ou modifié", async () => {
    const repository = new ViewedSessionRepository(database, ids("ses"));
    const created = await repository.create(sessionOf([copy(durationParameters(30, 2, 10))]));
    const before = await dump();
    const refused = copy(uniformParameters({ mode: "REPETITIONS", count: 2, target: "UNSET" }), {
      bodyZoneIds: ["genoux"],
      media: [{ assetId: "refused", asset: asset("refused") }],
    });
    await expect(repository.create(sessionOf([refused]))).rejects.toBeInstanceOf(SessionValidationError);
    await expect(
      repository.update(
        created.id,
        anUpdateInput({
          sourceSessionId: created.id,
          activities: [{ ...anUpdateActivity({ id: created.cycle.tour.exercises[0]!.id }), ...refused, position: 0, id: created.cycle.tour.exercises[0]!.id }],
        }),
      ),
    ).rejects.toBeInstanceOf(SessionValidationError);
    expect(await dump()).toEqual(before);
  });

  it("PRE4-1.1/AC5 — une Copie dont la Cible Durée de première ligne vaut 6000 s (structurellement valide) est refusée par le CHECK reflété, sans écriture", async () => {
    const repository = new ViewedSessionRepository(database, ids("ses"));
    const created = await repository.create(sessionOf([copy(durationParameters(30))]));
    const before = await dump();
    const tooLong = durationParameters(6000, 2, 10);
    await expect(
      repository.create(sessionOf([copy(tooLong, { media: [{ assetId: "x1", asset: asset("x1") }] })])),
    ).rejects.toThrow("does not satisfy");
    await expect(
      repository.update(
        created.id,
        anUpdateInput({
          sourceSessionId: created.id,
          activities: [anUpdateActivity({ id: created.cycle.tour.exercises[0]!.id, executionParameters: tooLong })],
        }),
      ),
    ).rejects.toThrow("does not satisfy");
    // Une Pause de première ligne au-delà de 5999 s est refusée de même.
    await expect(
      repository.create(sessionOf([copy(durationParameters(30, 2, 6000))])),
    ).rejects.toThrow("does not satisfy");
    expect(await dump()).toEqual(before);
  });
});

describe("PRE4-1.2/AC7, PRE-8 A.4 — assemblage d'une Séance sans Exercice et contrat de structure", () => {
  it("assemble une Séance vide avec ses paramètres et un Circuit vide", () => {
    const stored = validStored({
      activities: [],
      circuits: [{ id: IDS[2]!, session_id: IDS[0]!, cycle_id: null, position: 0, repeat_count: 2, side_mode: "UNILATERAL", nature: "TOURS" }],
    });
    const session = toLegacySession({ stored, structure: assembleStructure(stored, new Map()) });
    // PRE-6 (story 1.1) : la nature persistée est relue avec le Circuit.
    expect(session.cycle.tour).toEqual({ id: IDS[2]!, position: 1, repeatCount: 2, nature: "TOURS", exercises: [] });
    expect(session.cycle.beforeTour).toBeUndefined();
    expect(session.cycle.afterTour).toBeUndefined();
    expect(session).toMatchObject({ id: IDS[0]!, name: "Séance", initialCountdownSeconds: 10, finalPhaseSeconds: 5 });
  });

  it.each([
    ["side_mode du Circuit invalide", { side_mode: "SIDEWAYS" }],
    ["compte du Circuit 0", { repeat_count: 0 }],
    ["nature inconnue", { nature: "MAX" }],
  ])("lève sur un Circuit invalide : %s", (_label, override) => {
    const base = validStored({ activities: [] });
    const stored = { ...base, circuits: [{ ...base.circuits[0]!, ...override }] } as unknown as StoredSession;
    expect(() => assembleStructure(stored, new Map())).toThrow("does not satisfy");
  });

  it("lève sur un rang en double au niveau principal, partagé par Exercices, Circuits et Cycles ; tolère un trou", () => {
    const base = validStored({ activities: [] });
    const duplicate = validStored({ activities: [], circuits: [base.circuits[0]!, { ...base.circuits[0]!, id: "other" }] });
    expect(() => assembleStructure(duplicate, new Map())).toThrow("does not satisfy");
    const gap = validStored({
      activities: [],
      circuits: [{ id: IDS[2]!, session_id: IDS[0]!, cycle_id: null, position: 1, repeat_count: 1, side_mode: "UNILATERAL", nature: "TOURS" }],
    });
    expect(assembleStructure(gap, new Map()).elements.map((element) => element.kind)).toEqual(["CIRCUIT"]);
  });

  it("lève sur un Cycle sans Circuit", () => {
    const stored = validStored({ activities: [], circuits: [], cycles: [{ id: "cyc", session_id: IDS[0]!, position: 0, repeat_count: 2 }] });
    expect(() => assembleStructure(stored, new Map())).toThrow("does not satisfy");
  });
});

/**
 * PRE-6 story 1.1 (AC3, AD-34, AD-35) — aller-retour complet brouillon →
 * entrée → SQLite réelle (`node:sqlite`) → lecture : nature du Circuit et
 * récupération à trois états (absente, présente à 0, positive).
 */
describe("SqliteSessionRepository — PRE6-1.1 nature du Circuit et récupération nullable (NodeSqliteDatabase REAL)", () => {
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

  const repository = () => new ViewedSessionRepository(database, ids("ses"));

  function draft(recoveries: readonly (number | null)[], overrides: Partial<SessionDraft> = {}, idPrefix = "ex"): SessionDraft {
    return {
      ...createEmptyDraft(),
      name: "Circuit",
      tourRepeatCount: 4,
      exercises: recoveries.map((recovery, index) => ({
        ...createExerciseDraft(`${idPrefix}-${index}`, recovery),
        structuralPosition: "IN_TOUR" as const,
        // PRE-7 (R-3, C01) : nom unique par Mouvement, y compris entre Séances.
        name: `Exercice ${idPrefix} ${index}`,
        executionParameters: durationParameters(30, 4, 10),
      })),
      ...overrides,
    };
  }

  // PRE-7 (R-3, C05) : chaque Exercice du brouillon est une création locale (Mouvement `NEW`).
  async function create(source: SessionDraft): Promise<Session> {
    const input = toCreateSessionInput(withLocalMovements(source));
    if (!input.ok) throw new Error(`invalid draft: ${JSON.stringify(input.violations)}`);
    return repository().create(input.value);
  }

  const storedRecoveries = () =>
    database.getAllAsync("SELECT id, post_activity_recovery_seconds AS seconds, post_activity_recovery_present AS present FROM activities ORDER BY id");

  it("aller-retour nature : brouillon SERIES, N = 4 → relu SERIES, N = 4 ; brouillon relu égal au brouillon d'origine", async () => {
    const created = await create(draft([null], { circuitNature: "SERIES" }));
    const reread = await repository().findById(created.id);

    expect(reread?.cycle.tour.nature).toBe("SERIES");
    expect(reread?.cycle.tour.repeatCount).toBe(4);
    expect(await database.getAllAsync("SELECT nature, repeat_count FROM tours")).toEqual([{ nature: "SERIES", repeat_count: 4 }]);
    const redrafted = toSessionDraft(reread!);
    expect(redrafted.circuitNature).toBe("SERIES");
    expect(sessionDraftsEqual(redrafted, withLocalMovements(draft([null], { circuitNature: "SERIES" })))).toBe(true);
  });

  it("sans nature explicite, la Séance est un Circuit de Tours", async () => {
    const created = await create(draft([null]));
    expect(created.cycle.tour.nature).toBe("TOURS");
  });

  it("aller-retour récupération : null, 0 et 30 relus null, 0 et 30 (présence 0, 1, 1)", async () => {
    const created = await create(draft([null, 0, 30]));
    const reread = await repository().findById(created.id);

    expect(reread?.cycle.tour.exercises.map((activity) => activity.postActivityRecoverySeconds)).toEqual([null, 0, 30]);
    expect(await storedRecoveries()).toEqual([
      { id: "ex-0", seconds: 0, present: 0 },
      { id: "ex-1", seconds: 0, present: 1 },
      { id: "ex-2", seconds: 30, present: 1 },
    ]);
  });

  it("modification : nature et récupérations (null ↔ 0) mises à jour en place, puis relues", async () => {
    const created = await create(draft([null, 0, 30]));
    const opened = toSessionDraft(created);
    const edited: SessionDraft = {
      ...opened,
      circuitNature: "SERIES",
      exercises: opened.exercises.map((exercise, index) => ({ ...exercise, postActivityRecoverySeconds: [0, null, 45][index]! })),
    };
    expect(isSessionDraftDirty(edited, opened)).toBe(true);
    const input = toUpdateSessionInput(edited);
    if (!input.ok) throw new Error("invalid draft");

    const outcome = await repository().update(created.id, input.value);

    expect(outcome.status).toBe("UPDATED");
    const reread = await repository().findById(created.id);
    expect(reread?.cycle.tour.nature).toBe("SERIES");
    expect(reread?.cycle.tour.exercises.map((activity) => activity.postActivityRecoverySeconds)).toEqual([0, null, 45]);
    expect(await storedRecoveries()).toEqual([
      { id: "ex-0", seconds: 0, present: 1 },
      { id: "ex-1", seconds: 0, present: 0 },
      { id: "ex-2", seconds: 45, present: 1 },
    ]);
  });

  it("modification sans nature dans l'entrée : la nature persistée est conservée, jamais ramenée à TOURS", async () => {
    const created = await create(draft([null], { circuitNature: "SERIES" }));
    const { circuitNature: _omitted, ...withoutNature } = toSessionDraft(created);
    const input = toUpdateSessionInput({ ...withoutNature, name: "Renommée" });
    if (!input.ok) throw new Error("invalid draft");
    expect(input.value.circuitNature).toBeUndefined();

    expect((await repository().update(created.id, input.value)).status).toBe("UPDATED");
    expect((await repository().findById(created.id))?.cycle.tour.nature).toBe("SERIES");
  });

  it("calculs inchangés : une récupération absente ou à 0 ne remplace aucune Pause ; seule une valeur positive la remplace", async () => {
    const absent = await create(draft([null], {}, "absent"));
    const zero = await create(draft([0], {}, "zero"));
    const positive = await create(draft([45], {}, "positive"));
    const durations = new Map((await repository().listActive()).map((summary) => [summary.id, summary.estimatedDurationSeconds]));

    expect(durations.get(absent.id)).toBe(durations.get(zero.id));
    // 4 Séries de 30 s, 3 Pauses de 10 s, Pause terminale 10 s remplacée par 45 s ; × 4 Tours.
    expect(durations.get(zero.id)).toBe(4 * (4 * 30 + 4 * 10));
    expect(durations.get(positive.id)).toBe(4 * (4 * 30 + 3 * 10 + 45));
  });

  it("nature invalide : SessionValidationError (UNRECOGNIZED sur session.circuitNature), rien n'est écrit", async () => {
    const input = toCreateSessionInput(withLocalMovements(draft([null], { circuitNature: "SERIES" })));
    if (!input.ok) throw new Error("invalid draft");

    await expect(
      repository().create({ ...input.value, circuitNature: "FOO" as unknown as "TOURS" }),
    ).rejects.toMatchObject({ violations: [{ code: "UNRECOGNIZED", field: "session.circuitNature" }] });
    expect(await database.getAllAsync("SELECT id FROM sessions")).toEqual([]);
    expect(await database.getAllAsync("SELECT id FROM tours")).toEqual([]);
    expect(await database.getAllAsync("SELECT id FROM movements")).toEqual([]);
  });

  it("relecture défensive : nature inconnue ou présence incohérente en base → contrat d'agrégat refusé", async () => {
    const created = await create(draft([null]));
    // Le CHECK interdit ces valeurs ; on simule une ligne corrompue en le contournant.
    await database.execAsync("PRAGMA ignore_check_constraints = ON");
    await database.runAsync("UPDATE tours SET nature = 'FOO'");
    await expect(repository().findById(created.id)).rejects.toThrow("does not satisfy");
    await database.runAsync("UPDATE tours SET nature = 'TOURS'");
    await database.runAsync("UPDATE activities SET post_activity_recovery_seconds = 30, post_activity_recovery_present = 0");
    await expect(repository().findById(created.id)).rejects.toThrow("does not satisfy");
    await database.runAsync("UPDATE activities SET post_activity_recovery_seconds = 0, post_activity_recovery_present = 2");
    await expect(repository().findById(created.id)).rejects.toThrow("does not satisfy");
  });
});

/** PRE-6 (story 1.3, AD-40) : la liste, la lecture complète et la Composition suivent la nature du Circuit. */
describe("PRE6-1.3 — durée selon la nature du Circuit", () => {
  let database: NodeSqliteDatabase;

  beforeEach(async () => {
    database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database);
  });

  afterEach(() => {
    database.close();
  });

  const seriesInput = (circuitNature: "TOURS" | "SERIES"): CreateSessionInput => ({
    ...validInput(),
    tourRepeatCount: 3,
    circuitNature,
    exercises: [
      anExercise({ structuralPosition: "BEFORE_TOUR", name: "Échauffement", executionParameters: durationParameters(60) }),
      anExercise({
        name: "Fentes",
        executionParameters: uniformParameters({
          mode: "DURATION",
          count: 3,
          target: 30,
          pauseSeconds: 10,
          sideMode: "LEFT_RIGHT",
          sideRecoverySeconds: 5,
        }),
        postActivityRecoverySeconds: 20,
      }),
    ],
  });

  it("Séries : liste, lecture complète et Composition donnent la même durée (passages : 255 s + 60 s hors Circuit)", async () => {
    const repository = new ViewedSessionRepository(database, () => randomUUID());
    const created = await repository.create(seriesInput("SERIES"));

    const summary = (await repository.listActive()).find((item) => item.id === created.id);
    const reopened = await repository.findById(created.id);

    expect(summary?.estimatedDurationSeconds).toBe(60 + 255);
    expect(summary?.durationKind).toBe("exact");
    expect(toSessionDurationResult(reopened!)).toEqual({ kind: "exact", seconds: 60 + 255 });
  });

  it("Tours : durée de liste inchangée (contenu interne × N)", async () => {
    const repository = new ViewedSessionRepository(database, () => randomUUID());
    const created = await repository.create(seriesInput("TOURS"));
    const summary = (await repository.listActive()).find((item) => item.id === created.id);
    const reopened = await repository.findById(created.id);
    expect(summary?.estimatedDurationSeconds).toBe(toSessionDurationResult(reopened!).seconds);
    // Tours, BY_SIDE : (30+10)×3 ×2 côtés + PC 5 − dernière Pause 10 + R 20 = 255 par Tour.
    expect(summary?.estimatedDurationSeconds).toBe(60 + 3 * 255);
  });
});
