import { describe, expect, it } from "@jest/globals";

import { seriesRowsOf } from "@/domain/activities/ExecutionParameters";
import { repetitionParameters, variableParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { enterCarrier } from "@/domain/sessions/carrierMembership";
import { setMemberRole } from "@/domain/sessions/circuitRoles";
import { buildModelElements } from "@/domain/sessions/formatModels";
import { applyModelReedit, modelStateOfCircuit } from "@/domain/sessions/formatReedit";
import { circuitRoleOf, type ElementFormat } from "@/domain/sessions/formats";
import { setLayoutCircuitCount } from "@/domain/sessions/layoutOperations";
import { createEmptyDraft, type SessionDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import { structureCircuits } from "@/domain/sessions/structure";

/**
 * PRE-11 — For time, règles de gestion des séries et des tours (Hermann, 14/11/2026, FT-1 à FT-13).
 *
 * Scénario de Hermann : « Un For time composé d'un buy-in à une série de répétitions et de deux exercices en tours, de répétitions
 * différentes, sur 3 tours au total. Tu échanges les rôles : l'exercice buy-in passe en tour, et le premier exercice en tour passe en
 * buy-in. » Constat : « Le changement de rôle ne convertit pas la configuration des séries. Composition et récapitulatif se retrouvent
 * avec deux versions différentes de la même donnée. »
 */

const BUY_IN: ElementFormat = { key: "FOR_TIME", settings: { circuitRole: 1 } };
const TOUR: ElementFormat = { key: "FOR_TIME", settings: {} };
const CIRCUIT_FORMAT: ElementFormat = { key: "FOR_TIME", settings: { restBetweenRoundsSeconds: 0 } };

const exercise = (id: string, parameters: SessionDraftExercise["executionParameters"], format?: ElementFormat): SessionDraftExercise => ({
  id,
  type: "EXERCISE",
  structuralPosition: "BEFORE_TOUR",
  name: `Mouvement ${id}`,
  executionParameters: parameters,
  postActivityRecoverySeconds: 0,
  instruction: null,
  bodyZoneIds: [],
  sideMode: "UNILATERAL",
  sourceMovementId: `mv-${id}`,
  ...(format !== undefined ? { format } : {}),
});

/** Buy-in « in » (1 série de 50), tours « a » (21-15-9) et « b » (12 identiques), 3 tours. */
function scenario(): SessionDraft {
  return {
    ...createEmptyDraft(),
    exercises: [
      exercise("in", repetitionParameters(50, 1, 0), BUY_IN),
      exercise("a", variableParameters({ mode: "REPETITIONS", rows: [[21, 0], [15, 0], [9, 0]] }), TOUR),
      exercise("b", repetitionParameters(12, 3, 0), TOUR),
    ],
    structure: {
      elements: [{ kind: "CIRCUIT", circuit: { id: "f", nature: "SERIES", repeatCount: 3, format: CIRCUIT_FORMAT, exercises: ["in", "a", "b"], originModel: "FOR_TIME" } }],
      stopPoints: [],
    },
  };
}

const targets = (draft: SessionDraft, id: string) =>
  seriesRowsOf(draft.exercises.find((item) => item.id === id)!.executionParameters).map((row) => (row.target.kind === "NUMBER" ? row.target.value : row.target.kind));

/** Volumes du récapitulatif (« Modifier le format ») reconstruits depuis la Composition, par Exercice. */
function recap(draft: SessionDraft): Record<string, readonly (number | null)[]> {
  const circuit = structureCircuits(draft.structure!).find((item) => item.id === "f")!;
  const exercises = circuit.exercises.map((id) => draft.exercises.find((item) => item.id === id)!);
  const state = modelStateOfCircuit("FOR_TIME", { ...circuit, exercises });
  return Object.fromEntries(state.movements.map((movement) => [movement.exercise.id, movement.values.volumes ?? []]));
}

describe("For time — échange des rôles (scénario de Hermann, FT-9, FT-10, FT-11)", () => {
  it("buy-in → tour : 3 séries identiques de 50 ; tour → buy-in : 21-15-9 conservées ; composition et récapitulatif identiques", () => {
    const swapped = setMemberRole(setMemberRole(scenario(), "in", "TOUR"), "a", "BUY_IN");
    const circuit = structureCircuits(swapped.structure!)[0]!;
    expect(circuit.exercises.map((id, index) => [id, circuitRoleOf(swapped.exercises.find((item) => item.id === id)!.format, index)])).toEqual([
      ["a", "BUY_IN"],
      ["in", "TOUR"],
      ["b", "TOUR"],
    ]);
    // FT-10 : séries identiques, valeur répétée au nombre de tours.
    const entered = swapped.exercises.find((item) => item.id === "in")!.executionParameters.series;
    expect(entered).toMatchObject({ kind: "UNIFORM", count: 3 });
    expect(targets(swapped, "in")).toEqual([50, 50, 50]);
    // FT-9 : séries conservées telles quelles.
    expect(targets(swapped, "a")).toEqual([21, 15, 9]);
    // FT-11, FT-12 : le récapitulatif lit les mêmes séries que la Composition.
    expect(recap(swapped)).toEqual({ a: [21, 15, 9], in: [50, 50, 50], b: [12, 12, 12] });
  });

  it("le récapitulatif enregistré sans modification ne change aucune série (FT-11)", () => {
    const swapped = setMemberRole(setMemberRole(scenario(), "in", "TOUR"), "a", "BUY_IN");
    const circuit = structureCircuits(swapped.structure!)[0]!;
    const state = modelStateOfCircuit("FOR_TIME", { ...circuit, exercises: circuit.exercises.map((id) => swapped.exercises.find((item) => item.id === id)!) });
    const saved = applyModelReedit(swapped, "f", state, state, () => "x");
    for (const id of ["a", "in", "b"]) expect(targets(saved, id)).toEqual(targets(swapped, id));
  });

  it("un buy-in à 3 séries variables reconstruit par le récapitulatif garde ses 3 séries (recette 1, FT-4, FT-12)", () => {
    const draft = scenario();
    const three = {
      ...draft,
      exercises: draft.exercises.map((item) => (item.id === "in" ? { ...item, executionParameters: variableParameters({ mode: "REPETITIONS", rows: [[30, 0], [20, 0], [10, 0]] }) } : item)),
    };
    expect(recap(three).in).toEqual([30, 20, 10]);
    const circuit = structureCircuits(three.structure!)[0]!;
    const state = modelStateOfCircuit("FOR_TIME", { ...circuit, exercises: circuit.exercises.map((id) => three.exercises.find((item) => item.id === id)!) });
    const built = buildModelElements("FOR_TIME", state.answers, state.movements, () => "x");
    const members = built[0]!.kind === "CIRCUIT" ? built[0]!.circuit.exercises : [];
    expect(seriesRowsOf(members.find((item) => item.id === "in")!.executionParameters)).toHaveLength(3);
    // Identiques restent Identiques (FT-5).
    expect(members.find((item) => item.id === "b")!.executionParameters.series.kind).toBe("UNIFORM");
  });

  it("à l'échec : un exercice passé en tour n'a aucune série sans objectif ni « à l'échec » (FT-6)", () => {
    const draft = scenario();
    const failing = { ...draft, exercises: draft.exercises.map((item) => (item.id === "in" ? { ...item, executionParameters: repetitionParameters("FAILURE", 1, 0) } : item)) };
    expect(targets(setMemberRole(failing, "in", "TOUR"), "in")).toEqual(["UNSET", "UNSET", "UNSET"]);
  });
});

describe("For time — nombre de tours (FT-7) et ajout en tour (FT-8)", () => {
  it("3 → 4 : identiques répétées, variables complétées avec la dernière valeur ; 4 → 2 : dernières séries supprimées ; buy-in inchangé", () => {
    const four = setLayoutCircuitCount(scenario(), "f", 4);
    expect(targets(four, "a")).toEqual([21, 15, 9, 9]);
    expect(targets(four, "b")).toEqual([12, 12, 12, 12]);
    expect(four.exercises.find((item) => item.id === "b")!.executionParameters.series.kind).toBe("UNIFORM");
    expect(targets(four, "in")).toEqual([50]);
    const two = setLayoutCircuitCount(four, "f", 2);
    expect(targets(two, "a")).toEqual([21, 15]);
    expect(targets(two, "b")).toEqual([12, 12]);
  });

  it("un exercice ajouté en tour reçoit autant de séries identiques que de tours", () => {
    const entered = enterCarrier(exercise("n", repetitionParameters(8, 5, 30)), { nature: "SERIES", repeatCount: 3, format: CIRCUIT_FORMAT });
    expect(entered.executionParameters.series).toMatchObject({ kind: "UNIFORM", count: 3 });
    expect(seriesRowsOf(entered.executionParameters).map((row) => row.target)).toEqual(Array.from({ length: 3 }, () => ({ kind: "NUMBER", value: 8 })));
  });
});
