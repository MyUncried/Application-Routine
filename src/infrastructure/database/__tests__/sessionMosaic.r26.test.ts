import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { durationParameters, repetitionParameters } from "@/domain/activities/testing/executionParametersFixtures";
import {
  appendModelToDraft,
  buildModelElements,
  initialAnswers,
  initialMovementValues,
  type FormatModelKey,
  type ModelAnswers,
} from "@/domain/sessions/formatModels";
import { moveExerciseToCircuit, wrapInContainer } from "@/domain/sessions/layoutOperations";
import { createEmptyDraft, toSessionDraft, toStructuredSessionInput, type SessionDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import { structureCircuits, structureExercises } from "@/domain/sessions/structure";
import type { StructureExerciseInput, StructuredSessionInput } from "@/domain/sessions/structuredInput";
import { projectSessionForCatalogue } from "@/features/sessions/sessionCatalogueProjection";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * Recette iPhone du 26/11/2026 (après-midi) — Hermann : « 5 exercices dont deux dans un circuit Tabata, il en compte 4 » ;
 * précision du 26/11 : « les photos des mouvements du circuit étaient ignorées dans la mosaïque ». Parcours réels jusqu'à la
 * relecture du Catalogue des séances sur SQLite réelle : circuit issu d'un format (fenêtre « Créer un exercice » → format,
 * `appendModelToDraft`), circuit composé à la main (Créer → circuit : `wrapInContainer`, puis entrée d'un second exercice),
 * cycle autour d'un circuit ; brouillon → `toStructuredSessionInput` → `createStructured` → `listCatalogue` → projection.
 */

let database: NodeSqliteDatabase;
const clock = "2026-11-26T08:00:00.000Z";
let sequence = 0;
const repository = () => new SqliteSessionRepository(database, () => `gen-${++sequence}`, () => clock);
const MOVEMENTS = ["m1", "m2", "m3", "m4", "m5"];
let next = 0;
const newId = () => `k${++next}`;

beforeEach(async () => {
  database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
  for (const id of MOVEMENTS) {
    await database.runAsync(
      `INSERT INTO movements (id, name, normalized_name, description, category_id, next_phase_id, created_at, updated_at)
       VALUES (?, ?, ?, NULL, 'cardio', 1, ?, ?)`,
      [id, `Mouvement ${id}`, `mouvement ${id}`, clock, clock],
    );
    await database.runAsync("INSERT INTO movement_body_zones (movement_id, body_zone_id) VALUES (?, 'dos')", [id]);
    await database.runAsync("INSERT INTO media_assets (id, uri, created_at) VALUES (?, ?, ?)", [`a-${id}`, `kodjo-media/a-${id}.jpg`, clock]);
    await database.runAsync("INSERT INTO movement_media (id, movement_id, asset_id, position) VALUES (?, ?, ?, 0)", [`mm-${id}`, id, `a-${id}`]);
  }
});

afterEach(() => {
  database.close();
});

/** Occurrence d'un Mouvement, comme `exerciseOfMovement` (filiation `sourceMovementId`). */
const occurrence = (id: string, movement: string, parameters = durationParameters(30)): SessionDraftExercise => ({
  id,
  type: "EXERCISE",
  structuralPosition: "BEFORE_TOUR",
  name: `Mouvement ${movement}`,
  executionParameters: parameters,
  postActivityRecoverySeconds: 0,
  instruction: null,
  bodyZoneIds: ["dos"],
  sourceMovementId: movement,
  sideMode: "UNILATERAL",
});

const freeDraft = (count: number): SessionDraft => ({
  ...createEmptyDraft(),
  name: "Mixte",
  exercises: MOVEMENTS.slice(0, count).map((movement, index) => occurrence(`e${index + 1}`, movement)),
});

/** Fenêtre « Créer un exercice » → format : mouvements choisis, structure ajoutée à la fin du brouillon. */
function withFormat(draft: SessionDraft, key: FormatModelKey, answers: ModelAnswers, movements: readonly string[]): SessionDraft {
  const chosen = movements.map((movement, index) => {
    const exercise = occurrence(`f-${key}-${index}`, movement, repetitionParameters(10, 1, 0));
    const values = initialMovementValues(key, answers, exercise);
    // Objectif renseigné dans chaque série (EMOM : tableau S1…Sn), comme une saisie complète du questionnaire.
    const count = answers.seriesCount ?? 1;
    return { exercise, values: { ...values, cells: Array.from({ length: count }, () => ({ repetitions: 10, loadKg: null })) } };
  });
  return appendModelToDraft(draft, buildModelElements(key, answers, chosen, newId), newId);
}

async function saveAndReadMosaic(draft: SessionDraft): Promise<readonly string[]> {
  const input = toStructuredSessionInput(draft, newId);
  if (!input.ok) throw new Error(JSON.stringify(input.violations));
  await repository().createStructured(input.value);
  const [record] = await repository().listCatalogue();
  return projectSessionForCatalogue(record!, new Map()).mosaic.map((image) => image.key);
}

describe("Recette 26/11 — mouvements des circuits dans la mosaïque, après enregistrement et relecture", () => {
  it("structure saisie directement : trois libres et un circuit Tabata de deux", async () => {
    const exercise = (id: string, movement: string): StructureExerciseInput => ({
      id,
      type: "EXERCISE",
      executionParameters: durationParameters(30),
      postActivityRecoverySeconds: 0,
      sourceMovementId: movement,
    });
    const input = {
      name: "Mixte",
      labelId: null,
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      structure: {
        elements: [
          { kind: "EXERCISE", exercise: exercise("e1", "m1") },
          { kind: "EXERCISE", exercise: exercise("e2", "m2") },
          { kind: "EXERCISE", exercise: exercise("e3", "m3") },
          { kind: "CIRCUIT", circuit: { id: "c1", repeatCount: 8, nature: "SERIES", originModel: "TABATA", exercises: [exercise("e4", "m4"), exercise("e5", "m5")] } },
        ],
        stopPoints: [],
      },
    } as StructuredSessionInput;
    await repository().createStructured(input);
    const [record] = await repository().listCatalogue();
    expect(projectSessionForCatalogue(record!, new Map()).mosaic.map((image) => image.key)).toEqual(MOVEMENTS);
  });

  it.each([
    ["Tabata « À la suite »", "TABATA", { ...initialAnswers("TABATA"), execution: "SEQUENCE" }],
    ["Tabata « En alternance »", "TABATA", { ...initialAnswers("TABATA"), execution: "ALTERNATED" }],
    ["EMOM « Dans chaque intervalle » (circuit porteur)", "EMOM", initialAnswers("EMOM")],
  ] as [string, FormatModelKey, ModelAnswers][])("circuit issu d'un format — %s : trois libres + deux du format → cinq images", async (_label, key, answers) => {
    const draft = withFormat(freeDraft(3), key, answers, ["m4", "m5"]);
    expect(structureCircuits(draft.structure!)).toHaveLength(1);
    expect(await saveAndReadMosaic(draft)).toEqual(MOVEMENTS);
  });

  it("circuit composé à la main (Créer → circuit, puis entrée d'un second exercice) → cinq images", async () => {
    const wrapped = wrapInContainer(freeDraft(5), { kind: "EXERCISE", id: "e4" }, "CIRCUIT", newId);
    const circuit = structureCircuits(wrapped.structure!)[0]!;
    const moved = moveExerciseToCircuit(wrapped, "e5", circuit.id, 1, newId);
    if (moved.status !== "APPLIED") throw new Error(moved.status);
    expect(structureCircuits(moved.draft.structure!)[0]!.exercises).toEqual(["e4", "e5"]);
    expect(await saveAndReadMosaic(moved.draft)).toEqual(MOVEMENTS);
  });

  it("modification d'une séance enregistrée : circuit Tabata ajouté, enregistrement, relecture → cinq images", async () => {
    const first = toStructuredSessionInput(freeDraft(3), newId);
    if (!first.ok) throw new Error(JSON.stringify(first.violations));
    const created = await repository().createStructured(first.value);
    const edited = withFormat(toSessionDraft(created), "TABATA", { ...initialAnswers("TABATA"), execution: "ALTERNATED" }, ["m4", "m5"]);
    const input = toStructuredSessionInput(edited, newId);
    if (!input.ok) throw new Error(JSON.stringify(input.violations));
    const persistedActivityIds = structureExercises(created.structure).map((exercise) => exercise.id);
    expect((await repository().updateStructured(created.id, { ...input.value, persistedActivityIds })).status).toBe("UPDATED");
    const [record] = await repository().listCatalogue();
    expect(projectSessionForCatalogue(record!, new Map()).mosaic.map((image) => image.key)).toEqual(MOVEMENTS);
  });

  it("cycle autour d'un circuit issu d'un format → cinq images", async () => {
    const draft = withFormat(freeDraft(3), "TABATA", { ...initialAnswers("TABATA"), execution: "ALTERNATED" }, ["m4", "m5"]);
    const circuit = structureCircuits(draft.structure!)[0]!;
    const cycled = wrapInContainer(draft, { kind: "CIRCUIT", id: circuit.id }, "CYCLE", newId);
    expect(cycled.structure!.elements.some((element) => element.kind === "CYCLE")).toBe(true);
    expect(await saveAndReadMosaic(cycled)).toEqual(MOVEMENTS);
  });
});
