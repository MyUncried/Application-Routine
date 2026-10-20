import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import {
  activityDefinitionToDraftExercise,
  activityDefinitionToInput,
  validateActivityDefinitionInput,
  type ActivityDefinition,
  type CreateActivityDefinitionInput,
} from "@/domain/activities/ActivityDefinition";
import {
  ExecutionParametersDataError,
  serializeExecutionParameters,
  serializeV2,
  type ExecutionParameters,
} from "@/domain/activities/ExecutionParameters";
import { uniformParameters, variableParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { Session } from "@/domain/sessions/Session";
import { createEmptyDraft, toCreateSessionInput, toSessionDraft, toUpdateSessionInput } from "@/domain/sessions/SessionDraft";
import { DATABASE_VERSION } from "@/infrastructure/database/constants";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteActivityDefinitionRepository } from "@/infrastructure/database/repositories/SqliteActivityDefinitionRepository";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * PRE-5 (story 1.1, AC11, AD-18, AD-10, FR-16, FR-39, NFR-3, NFR-10) — aller-retour
 * du format v3 sur SQLite RÉELLE (`node:sqlite`) : une ligne PRE-4 (v2) est relue
 * sans phases et Sans, puis écrite en v3 à son prochain enregistrement ; charge
 * sous Sans, phases (identités, libellés, durées) et côtés `RIGHT_LEFT` /
 * `LEFT_RIGHT` conservés ; aucune migration ajoutée.
 */

const phased = (sideMode: "RIGHT_LEFT" | "LEFT_RIGHT" = "LEFT_RIGHT"): ExecutionParameters =>
  uniformParameters({
    mode: "DURATION",
    count: 3,
    target: 9,
    pauseSeconds: 15,
    sideMode,
    sideOrder: "BY_SERIES",
    sideRecoverySeconds: 5,
    loadKg: 2.5,
    loadEnabled: false,
    workPhases: [
      { id: 3, label: "Descente", durationSeconds: 6 },
      { id: 1, label: "Maintien 💪", durationSeconds: 3 },
    ],
  });

const variableUnderSans = (): ExecutionParameters =>
  variableParameters({ mode: "REPETITIONS", rows: [[12, 10, 20], [10, 10, 0], ["FAILURE", 0, 12.75]], sideMode: "RIGHT_LEFT", loadEnabled: false });

/** Donnée PRE-4 (v2) : la forme que `migration010` et les builds PRE-4 écrivent. */
const pre4 = (): ExecutionParameters =>
  variableParameters({ mode: "DURATION", rows: [[30, 10], [45, 20]], sideMode: "LEFT_RIGHT", sideOrder: "BY_SERIES", sideRecoverySeconds: 5, cadenceBeepIntervalSeconds: 2 });

describe("PRE5-1.1/AC11 — aller-retour v3 sur node:sqlite réel (AD-18)", () => {
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

  const definitions = () => new SqliteActivityDefinitionRepository(database, ids("def"));
  const sessions = () => new SqliteSessionRepository(database, ids("ses"));

  function input(parameters: ExecutionParameters): CreateActivityDefinitionInput {
    const validated = validateActivityDefinitionInput({
      name: "Squat",
      description: "Buste droit\nGenoux souples",
      category: { kind: "EXISTING", categoryId: "cardio" },
      bodyZoneIds: ["cuisses"],
      executionParameters: parameters,
      media: [],
    });
    if (!validated.ok) {
      throw new Error(JSON.stringify(validated.violations));
    }
    return validated.value;
  }

  async function storedDefinitionJson(id: string): Promise<string> {
    const row = await database.getFirstAsync<{ execution_parameters: string }>(
      "SELECT execution_parameters FROM activity_definitions WHERE id = ?",
      [id],
    );
    return row!.execution_parameters;
  }

  async function storedActivityJsons(): Promise<string[]> {
    const rows = await database.getAllAsync<{ execution_parameters: string }>(
      "SELECT execution_parameters FROM activities WHERE type = 'EXERCISE' ORDER BY rowid",
    );
    return rows.map((row) => row.execution_parameters);
  }

  async function continueNew(definition: ActivityDefinition, occurrenceId: string): Promise<Session> {
    const draft = { ...createEmptyDraft(), name: "Jambes", exercises: [activityDefinitionToDraftExercise(definition, occurrenceId, 0)] };
    const created = toCreateSessionInput(draft);
    if (!created.ok) {
      throw new Error(JSON.stringify(created.violations));
    }
    return (await sessions().findById((await sessions().create(created.value)).id))!;
  }

  it("Définition PRE-4 (v2) : relue sans phases et Sans, puis réenregistrée en v3, aucun autre paramètre changé (SM-3)", async () => {
    const created = await definitions().create(input(pre4()));
    // Ligne écrite par un build PRE-4 : JSON v2.
    await database.runAsync("UPDATE activity_definitions SET execution_parameters = ? WHERE id = ?", [serializeV2(pre4()), created.id]);
    expect((await storedDefinitionJson(created.id)).startsWith('{"version":2,')).toBe(true);

    const reread = (await definitions().findById(created.id))!;
    expect(reread.executionParameters).toEqual(pre4());
    expect(reread.executionParameters.loadEnabled).toBe(false);
    expect(reread.executionParameters.series.kind === "VARIABLE" && reread.executionParameters.series.rows.map((row) => row.loadKg)).toEqual([0, 0]);

    await definitions().update(created.id, activityDefinitionToInput(reread));
    const rewritten = await storedDefinitionJson(created.id);
    expect(rewritten).toBe(serializeExecutionParameters(pre4()));
    expect(rewritten.startsWith('{"version":3,')).toBe(true);
    expect((await definitions().findById(created.id))!.executionParameters).toEqual(pre4());
  });

  it("Définition v3 : charge sous Sans (valeurs non nulles), phases (id, libellés, durées) et LEFT_RIGHT / RIGHT_LEFT conservés après écriture et relecture", async () => {
    for (const parameters of [phased("LEFT_RIGHT"), phased("RIGHT_LEFT"), variableUnderSans()]) {
      const created = await definitions().create(input(parameters));
      expect(await storedDefinitionJson(created.id)).toBe(serializeExecutionParameters(parameters));
      const reread = (await definitions().findById(created.id))!;
      expect(reread.executionParameters).toEqual(parameters);
      expect(reread.sideMode).toBe(parameters.sideMode);
      // Réécrite inchangée.
      await definitions().update(created.id, activityDefinitionToInput(reread));
      expect(await storedDefinitionJson(created.id)).toBe(serializeExecutionParameters(parameters));
    }
  });

  it("projection d'un Exercice à phases : duration_seconds = Σ des phases, dans le CHECK 1..5999 (FR-40)", async () => {
    const created = await definitions().create(input(phased()));
    const row = await database.getFirstAsync<Record<string, unknown>>(
      "SELECT execution_mode, duration_seconds, series_count, pause_seconds, side_mode FROM activity_definitions WHERE id = ?",
      [created.id],
    );
    expect(row).toEqual({ execution_mode: "DURATION", duration_seconds: 9, series_count: 3, pause_seconds: 15, side_mode: "LEFT_RIGHT" });
  });

  it("Copie de Séance PRE-4 (v2) relue sans phases et Sans ; Continuer la réécrit en v3 ; copie v3 à phases et charge sous Sans relue à l'identique", async () => {
    const pre4Definition = (await definitions().findById((await definitions().create(input(pre4()))).id))!;
    const session = await continueNew(pre4Definition, "occ-1");
    await database.runAsync("UPDATE activities SET execution_parameters = ? WHERE type = 'EXERCISE'", [serializeV2(pre4())]);
    const reread = (await sessions().findById(session.id))!;
    expect(reread.cycle.beforeTour?.[0]?.executionParameters ?? reread.cycle.tour.exercises[0]!.executionParameters).toEqual(pre4());

    const updated = toUpdateSessionInput(toSessionDraft(reread));
    if (!updated.ok) {
      throw new Error(JSON.stringify(updated.violations));
    }
    expect((await sessions().update(session.id, updated.value)).status).toBe("UPDATED");
    expect(await storedActivityJsons()).toEqual([serializeExecutionParameters(pre4())]);

    const phasedDefinition = (await definitions().findById((await definitions().create(input(phased()))).id))!;
    const phasedSession = await continueNew(phasedDefinition, "occ-2");
    const copy = phasedSession.cycle.beforeTour?.[0] ?? phasedSession.cycle.tour.exercises[0]!;
    expect(copy.executionParameters).toEqual(phased());
    expect((await storedActivityJsons())[1]).toBe(serializeExecutionParameters(phased()));
  });

  it("une ligne v3 incomplète ou de version inconnue lève ExecutionParametersDataError (retour arrière non pris en charge, sans perte silencieuse)", async () => {
    const created = await definitions().create(input(phased()));
    const json = await storedDefinitionJson(created.id);
    for (const corrupt of [json.replace(',"loadEnabled":false', ""), json.replace('"version":3', '"version":4')]) {
      await database.runAsync("UPDATE activity_definitions SET execution_parameters = ? WHERE id = ?", [corrupt, created.id]);
      await expect(definitions().findById(created.id)).rejects.toThrow(ExecutionParametersDataError);
    }
  });

  it("aucune migration ajoutée : DATABASE_VERSION reste 10 et la base migrée est en version 10", async () => {
    expect(DATABASE_VERSION).toBe(10);
    const version = await database.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
    expect(version?.user_version).toBe(10);
  });
});
