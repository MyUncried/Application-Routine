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
  serializeCatalogExecutionParameters,
  serializeExecutionParameters,
  serializeResolvedExecutionParameters,
  serializeV2,
  type ExecutionParameters,
} from "@/domain/activities/ExecutionParameters";
import { splitResolvedParameters } from "@/domain/activities/Movement";
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
 *
 * PRE-7 (A1.2, D-440) : après la migration 012, la persistance lit et écrit la
 * seule v4 (forme Catalogue des définitions, forme résolue des copies) ; une
 * ligne v2 ou v3 n'est plus relue ni convertie. Les mêmes valeurs (charge sous
 * Sans, phases, côtés) sont prouvées sur les formats v4.
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

  it("PRE-7 (A1.2, D-440) — Définition PRE-4 (v2) ou PRE-5 (v3) restée en base : refusée, jamais relue ni convertie", async () => {
    const created = await definitions().create(input(pre4()));
    for (const legacy of [serializeV2(pre4()), serializeExecutionParameters(pre4())]) {
      await database.runAsync("UPDATE activity_definitions SET execution_parameters = ? WHERE id = ?", [legacy, created.id]);
      await expect(definitions().findById(created.id)).rejects.toThrow(ExecutionParametersDataError);
    }
  });

  it("Définition v4 : charge sous Sans (valeurs non nulles), phases (id, libellés, durées) et LEFT_RIGHT / RIGHT_LEFT conservés après écriture et relecture", async () => {
    for (const parameters of [phased("LEFT_RIGHT"), phased("RIGHT_LEFT"), variableUnderSans()]) {
      const created = await definitions().create(input(parameters));
      // PRE-7 (A1.2) : forme Catalogue v4, libellés portés par le Mouvement.
      const catalog = serializeCatalogExecutionParameters(splitResolvedParameters(parameters).parameters);
      expect(await storedDefinitionJson(created.id)).toBe(catalog);
      const reread = (await definitions().findById(created.id))!;
      expect(reread.executionParameters).toEqual(parameters);
      expect(reread.sideMode).toBe(parameters.sideMode);
      // Réécrite inchangée (identités de phases conservées par le Mouvement).
      await definitions().update(created.id, activityDefinitionToInput(reread));
      expect(await storedDefinitionJson(created.id)).toBe(catalog);
    }
  });

  it("projection d'une Copie à phases : duration_seconds = Σ des phases, dans le CHECK 1..5999 (FR-40)", async () => {
    const definition = (await definitions().findById((await definitions().create(input(phased()))).id))!;
    await continueNew(definition, "occ-1");
    const row = await database.getFirstAsync<Record<string, unknown>>(
      "SELECT execution_mode, duration_seconds, series_count, pause_seconds, side_mode FROM activities WHERE id = 'occ-1'",
    );
    expect(row).toEqual({ execution_mode: "DURATION", duration_seconds: 9, series_count: 3, pause_seconds: 15, side_mode: "LEFT_RIGHT" });
  });

  it("Copie de Séance v2 ou v3 restée en base refusée (D-440) ; copie résolue v4 à phases et charge sous Sans relue à l'identique", async () => {
    const pre4Definition = (await definitions().findById((await definitions().create(input(pre4()))).id))!;
    const session = await continueNew(pre4Definition, "occ-1");
    expect(await storedActivityJsons()).toEqual([serializeResolvedExecutionParameters(pre4())]);
    for (const legacy of [serializeV2(pre4()), serializeExecutionParameters(pre4())]) {
      await database.runAsync("UPDATE activities SET execution_parameters = ? WHERE type = 'EXERCISE'", [legacy]);
      await expect(sessions().findById(session.id)).rejects.toThrow(ExecutionParametersDataError);
    }

    const phasedDefinition = (await definitions().findById((await definitions().create(input(phased()))).id))!;
    const phasedSession = await continueNew(phasedDefinition, "occ-2");
    const copy = phasedSession.cycle.beforeTour?.[0] ?? phasedSession.cycle.tour.exercises[0]!;
    expect(copy.executionParameters).toEqual(phased());
    expect((await storedActivityJsons())[1]).toBe(serializeResolvedExecutionParameters(phased()));
    // Réécrite inchangée à la modification de la Séance.
    const updated = toUpdateSessionInput(toSessionDraft(phasedSession));
    if (!updated.ok) {
      throw new Error(JSON.stringify(updated.violations));
    }
    expect((await sessions().update(phasedSession.id, updated.value)).status).toBe("UPDATED");
    expect((await storedActivityJsons())[1]).toBe(serializeResolvedExecutionParameters(phased()));
  });

  it("une ligne v4 incomplète ou de version inconnue lève ExecutionParametersDataError (sans perte silencieuse)", async () => {
    const created = await definitions().create(input(phased()));
    const json = await storedDefinitionJson(created.id);
    for (const corrupt of [json.replace(',"loadEnabled":false', ""), json.replace('"version":4', '"version":3'), json.replace('"version":4', '"version":5')]) {
      await database.runAsync("UPDATE activity_definitions SET execution_parameters = ? WHERE id = ?", [corrupt, created.id]);
      await expect(definitions().findById(created.id)).rejects.toThrow(ExecutionParametersDataError);
    }
  });

  // PRE-5 n'ajoutait aucune migration ; PRE-6 ajoute `migration011`, PRE-7 (A1.2) `migration012`.
  it("PRE-5 n'ajoute aucune migration : DATABASE_VERSION vaut 12 depuis PRE-7 (A1.2) et la base migrée est en version 12", async () => {
    expect(DATABASE_VERSION).toBe(12);
    const version = await database.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
    expect(version?.user_version).toBe(12);
  });
});
