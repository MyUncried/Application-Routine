import { describe, expect, it } from "@jest/globals";

import { repetitionParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { circuitRoleOf } from "@/domain/sessions/formats";
import {
  appendModelToDraft,
  buildModelElements,
  hasRequiredRoles,
  initialAnswers,
  initialMovementValues,
  modelDuration,
  summaryIssues,
  type FormatModelKey,
  type ModelAnswers,
  type ModelMovement,
  type MovementValues,
} from "@/domain/sessions/formatModels";
import { modelStateOfCircuit } from "@/domain/sessions/formatReedit";
import { modelTimeline } from "@/domain/sessions/formatTimeline";
import { createEmptyDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import { structureCircuits } from "@/domain/sessions/structure";

/**
 * Recette du 08/11/2026 au soir — demande de Hermann : « Deux autres à ajouter : buy in / buy out. Il faut retirer la limite
 * d'un exercice dans le questionnaire et le récapitulatif, c'est contradictoire avec la composition de séance. » Plusieurs
 * buy-in (AMRAP, For time) et plusieurs buy-out (For time) : création du Circuit, Déroulé, durée, récapitulatif, réédition.
 */

const base = (id: string): SessionDraftExercise => ({
  id,
  type: "EXERCISE",
  structuralPosition: "BEFORE_TOUR",
  name: `Mouvement ${id}`,
  executionParameters: repetitionParameters(10, 3, 45),
  postActivityRecoverySeconds: 90,
  instruction: null,
  bodyZoneIds: [],
  sideMode: "UNILATERAL",
  sourceMovementId: `mv-${id}`,
});

const row = (key: FormatModelKey, answers: ModelAnswers, id: string, values: MovementValues = {}, extra: Partial<ModelMovement> = {}): ModelMovement => {
  const exercise = base(id);
  return { exercise, values: { ...initialMovementValues(key, answers, exercise), ...values }, ...extra };
};

let next = 0;
const newId = () => `b${++next}`;

describe("For time : plusieurs buy-in et plusieurs buy-out (08/11/2026 au soir)", () => {
  const answers: ModelAnswers = { ...initialAnswers("FOR_TIME"), buyIn: true, buyOut: true };
  const rows = [
    row("FOR_TIME", answers, "i1", { volumes: [1000] }, { buyIn: true }),
    row("FOR_TIME", answers, "i2", { volumes: [50] }, { buyIn: true }),
    row("FOR_TIME", answers, "t"),
    row("FOR_TIME", answers, "o1", { volumes: [20] }, { buyOut: true }),
    row("FOR_TIME", answers, "o2", { volumes: [30] }, { buyOut: true }),
  ];

  it("Circuit créé : buy-in dans l'ordre, tour, buy-out dans l'ordre ; chacun d'une seule série", () => {
    expect(hasRequiredRoles("FOR_TIME", answers, rows)).toBe(true);
    expect(summaryIssues("FOR_TIME", answers, rows)).toEqual([]);
    const [element] = buildModelElements("FOR_TIME", answers, rows, newId);
    if (element?.kind !== "CIRCUIT") throw new Error("Circuit attendu");
    const members = element.circuit.exercises;
    expect(members.map((exercise) => exercise.name)).toEqual(["Mouvement i1", "Mouvement i2", "Mouvement t", "Mouvement o1", "Mouvement o2"]);
    expect(members.map((exercise, index) => circuitRoleOf(exercise.format ?? null, index))).toEqual(["BUY_IN", "BUY_IN", "TOUR", "BUY_OUT", "BUY_OUT"]);
    const rowCount = (exercise: SessionDraftExercise) => {
      const series = exercise.executionParameters.series;
      return series.kind === "UNIFORM" ? series.count : series.rows.length;
    };
    expect(members.map(rowCount)).toEqual([1, 1, 3, 1, 1]);
    expect(modelDuration(buildModelElements("FOR_TIME", answers, rows, newId))).not.toBeNull();
  });

  it("Déroulé : chaque buy-in une fois au départ, dans l'ordre, puis les tours, puis chaque buy-out", () => {
    const labels = modelTimeline("FOR_TIME", answers, rows).blocks.map((block) => (block.kind === "WORK" ? block.label : block.kind));
    expect(labels.slice(0, 2)).toEqual(["1000 · buy-in", "50 · buy-in"]);
    expect(labels.slice(-2)).toEqual(["20 · buy-out", "30 · buy-out"]);
    expect(labels.slice(2, -2)).toEqual(["21", "15", "9"]);
  });

  it("réédition d'un Circuit For time à deux buy-in et deux buy-out : tous repris, dans l'ordre", () => {
    const draft = appendModelToDraft({ ...createEmptyDraft(), name: "Séance" }, buildModelElements("FOR_TIME", answers, rows, newId), newId);
    const [circuit] = structureCircuits(draft.structure!);
    const state = modelStateOfCircuit("FOR_TIME", { ...circuit!, exercises: circuit!.exercises.map((id) => draft.exercises.find((exercise) => exercise.id === id)!) });
    expect(state.answers).toMatchObject({ buyIn: true, buyOut: true });
    expect(state.movements.map((movement) => [movement.exercise.name, movement.buyIn === true, movement.buyOut === true])).toEqual([
      ["Mouvement i1", true, false],
      ["Mouvement i2", true, false],
      ["Mouvement t", false, false],
      ["Mouvement o1", false, true],
      ["Mouvement o2", false, true],
    ]);
  });
});

describe("AMRAP : plusieurs buy-in (08/11/2026 au soir)", () => {
  const answers: ModelAnswers = { ...initialAnswers("AMRAP"), buyIn: true };
  const rows = [
    row("AMRAP", answers, "i1", { repetitions: 1000 }, { buyIn: true }),
    row("AMRAP", answers, "i2", { repetitions: 50 }, { buyIn: true }),
    row("AMRAP", answers, "t1", { repetitions: 10 }),
    row("AMRAP", answers, "t2", { repetitions: 5 }),
  ];

  it("Circuit créé : les deux buy-in en tête, puis la boucle", () => {
    const [element] = buildModelElements("AMRAP", answers, rows, newId);
    if (element?.kind !== "CIRCUIT") throw new Error("Circuit attendu");
    const members = element.circuit.exercises;
    expect(members.map((exercise) => exercise.name)).toEqual(["Mouvement i1", "Mouvement i2", "Mouvement t1", "Mouvement t2"]);
    expect(members.map((exercise, index) => circuitRoleOf(exercise.format ?? null, index))).toEqual(["BUY_IN", "BUY_IN", "TOUR", "TOUR"]);
  });

  it("Déroulé : un bloc par buy-in, dans l'ordre, puis les tours de la boucle (les buy-in n'y reviennent pas)", () => {
    const blocks = modelTimeline("AMRAP", answers, rows).blocks;
    const work = blocks.filter((block) => block.kind === "WORK");
    expect(work.slice(0, 2).map((block) => (block.kind === "WORK" ? [block.label, block.movement, block.buyIn === true] : null))).toEqual([
      ["1000 · buy-in", 0, true],
      ["50 · buy-in", 1, true],
    ]);
    const loopMovements = work.slice(2).map((block) => (block.kind === "WORK" ? block.movement : null));
    expect(new Set(loopMovements)).toEqual(new Set([2, 3]));
    expect(work.slice(2).every((block) => block.kind === "WORK" && block.buyIn !== true)).toBe(true);
  });

  it("réédition : les deux buy-in sont repris", () => {
    const draft = appendModelToDraft({ ...createEmptyDraft(), name: "Séance" }, buildModelElements("AMRAP", answers, rows, newId), newId);
    const [circuit] = structureCircuits(draft.structure!);
    const state = modelStateOfCircuit("AMRAP", { ...circuit!, exercises: circuit!.exercises.map((id) => draft.exercises.find((exercise) => exercise.id === id)!) });
    expect(state.answers.buyIn).toBe(true);
    expect(state.movements.map((movement) => movement.buyIn === true)).toEqual([true, true, false, false]);
  });
});
