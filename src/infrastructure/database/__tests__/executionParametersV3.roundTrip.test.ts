import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import {
  activityDefinitionToDraftExercise,
  validateActivityDefinitionInput,
  type ActivityDefinition,
  type CreateActivityDefinitionInput,
} from "@/domain/activities/ActivityDefinition";
import {
  ExecutionParametersDataError,
  serializeCatalogExecutionParameters,
  serializeExecutionParameters,
  serializeV2,
  type ExecutionParameters,
} from "@/domain/activities/ExecutionParameters";
import { splitResolvedParameters } from "@/domain/activities/Movement";
import { uniformParameters, variableParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { Session } from "@/domain/sessions/Session";
import { createEmptyDraft, toCreateSessionInput, toSessionDraft, toUpdateSessionInput } from "@/domain/sessions/SessionDraft";
import { DATABASE_VERSION } from "@/infrastructure/database/constants";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { createTestMovement } from "@/infrastructure/database/testing/createTestMovement";
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
 *
 * [A.3 du 04/11/2026 : les cas propres aux anciennes définitions du Catalogue (écriture, relecture,
 * refus d'une ligne Catalogue ancienne ou corrompue) sont retirés avec leur dépôt — décision de Hermann
 * du 04/11/2026 : « Hermann abandonne la conversion sans perte prévue par A.4 : les anciens exercices
 * concernés par cette conversion peuvent être supprimés plutôt que migrés. » Les copies de Séance
 * partent d'un Mouvement créé seul et d'une vue de définition construite en mémoire.]
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

  /** Mouvement créé seul, vu comme la définition dont la copie est faite (paramètres saisis). */
  async function definitionOf(value: CreateActivityDefinitionInput): Promise<ActivityDefinition> {
    const { movementId } = await createTestMovement(database, value, { kind: "INDEPENDENT" }, ids("mov"));
    return {
      id: `def-${movementId}`,
      movementId,
      name: value.name,
      description: value.description,
      executionParameters: value.executionParameters,
      categoryId: "cardio",
      bodyZoneIds: value.bodyZoneIds,
      sideMode: value.executionParameters.sideMode,
      createdAt: "now",
      updatedAt: "now",
    };
  }
  const sessions = () => new SqliteSessionRepository(database, ids("ses"));

  // PRE-7 (R-3, C01) : chaque définition créée ici est un Mouvement distinct, de nom unique.
  let names = 0;
  function input(parameters: ExecutionParameters): CreateActivityDefinitionInput {
    const validated = validateActivityDefinitionInput({
      name: `Squat ${++names}`,
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

  /** PRE-7 (R-3, C05) : une occurrence stocke la forme Catalogue v5 (durées par `phaseId`, sans libellé). */
  const occurrenceJson = (parameters: ExecutionParameters) => serializeCatalogExecutionParameters(splitResolvedParameters(parameters).parameters);

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

  it("projection d'une Copie à phases : duration_seconds = Σ des phases, dans le CHECK 1..5999 (FR-40)", async () => {
    const definition = await definitionOf(input(phased()));
    await continueNew(definition, "occ-1");
    const row = await database.getFirstAsync<Record<string, unknown>>(
      "SELECT execution_mode, duration_seconds, series_count, pause_seconds, side_mode FROM activities WHERE id = 'occ-1'",
    );
    expect(row).toEqual({ execution_mode: "DURATION", duration_seconds: 9, series_count: 3, pause_seconds: 15, side_mode: "LEFT_RIGHT" });
  });

  it("Copie de Séance v2, v3 ou v4 restée en base refusée (D-440 ; PRE-7, Q2) ; copie v5 (forme Catalogue, R-3) à phases et charge sous Sans relue à l'identique", async () => {
    const pre4Definition = await definitionOf(input(pre4()));
    const session = await continueNew(pre4Definition, "occ-1");
    expect(await storedActivityJsons()).toEqual([occurrenceJson(pre4())]);
    // PRE-7 (R-2, D-446) : forme canonique et forme résolue confondues en v5 ; la v3 et la v4 ne sont plus lues des copies.
    const current = serializeExecutionParameters(pre4());
    for (const legacy of [serializeV2(pre4()), current.replace('"version":5', '"version":3'), current.replace('"version":5', '"version":4')]) {
      await database.runAsync("UPDATE activities SET execution_parameters = ? WHERE type = 'EXERCISE'", [legacy]);
      await expect(sessions().findById(session.id)).rejects.toThrow(ExecutionParametersDataError);
    }

    const phasedDefinition = await definitionOf(input(phased()));
    const phasedSession = await continueNew(phasedDefinition, "occ-2");
    const copy = phasedSession.cycle.beforeTour?.[0] ?? phasedSession.cycle.tour.exercises[0]!;
    expect(copy.executionParameters).toEqual(phased());
    expect((await storedActivityJsons())[1]).toBe(occurrenceJson(phased()));
    // Réécrite inchangée à la modification de la Séance.
    const updated = toUpdateSessionInput(toSessionDraft(phasedSession));
    if (!updated.ok) {
      throw new Error(JSON.stringify(updated.violations));
    }
    expect((await sessions().update(phasedSession.id, updated.value)).status).toBe("UPDATED");
    expect((await storedActivityJsons())[1]).toBe(occurrenceJson(phased()));
  });

  // PRE-5 n'ajoutait aucune migration ; PRE-6 ajoute `migration011`, PRE-7 `migration012` (A1.2) et `migration013` (R-3), PRE-8 `migration014` (A.3) et `migration015` (B.8).
  it("PRE-5 n'ajoute aucune migration : DATABASE_VERSION vaut 18 depuis PRE-9 (A.2b) et la base migrée est à la version courante", async () => {
    expect(DATABASE_VERSION).toBe(28);
    const version = await database.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
    expect(version?.user_version).toBe(DATABASE_VERSION);
  });
});
