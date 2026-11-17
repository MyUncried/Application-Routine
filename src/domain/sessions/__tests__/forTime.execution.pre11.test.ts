import { describe, expect, it } from "@jest/globals";

import { seriesRowsOf } from "@/domain/activities/ExecutionParameters";
import { repetitionParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { configurationValidity } from "@/domain/sessions/configurationValidity";
import { buildModelElements, executionOptions, initialAnswers, showsExecution, type ModelAnswers, type ModelMovement } from "@/domain/sessions/formatModels";
import { modelStateOfCircuit } from "@/domain/sessions/formatReedit";
import { modelTimeline } from "@/domain/sessions/formatTimeline";
import { withForTimeSeries } from "@/domain/sessions/forTimeSeries";
import { expandStructure } from "@/domain/sessions/planExpansion";
import { createEmptyDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import type { StructureCircuit } from "@/domain/sessions/structure";

/**
 * PRE-11 — For time, mode d'exécution « En alternance » / « À la suite » (Hermann, 14/11/2026 : « C'est exactement ça, Buy In,
 * tous les tours de A, tous les tours de B..., Buy out » ; « Correction — For time : ajouter le mode d’exécution « En alternance » /
 * « À la suite » », Figma « For time — Récapitulatif » `8624:30672`, FT-20 à FT-23). DSF l.15 et FMT-31 (aucun choix) levés.
 */

const exercise = (id: string): SessionDraftExercise => ({
  id,
  type: "EXERCISE",
  structuralPosition: "BEFORE_TOUR",
  name: `Mouvement ${id}`,
  executionParameters: repetitionParameters(1, 1, 0),
  postActivityRecoverySeconds: 0,
  instruction: null,
  bodyZoneIds: [],
  sideMode: "UNILATERAL",
  sourceMovementId: `mv-${id}`,
});

const movement = (id: string, volumes: readonly number[], role?: "buyIn" | "buyOut"): ModelMovement => ({
  exercise: exercise(id),
  values: { mode: "REPETITIONS", volumes, loads: [] },
  ...(role !== undefined ? { [role]: true as const } : {}),
});

function circuitOf(answers: ModelAnswers, movements: readonly ModelMovement[]): StructureCircuit<SessionDraftExercise> {
  const [element] = buildModelElements("FOR_TIME", answers, movements, () => "f");
  if (element?.kind !== "CIRCUIT") throw new Error("Circuit attendu");
  return element.circuit;
}

/** Ordre joué : « a1 » = série 1 de a ; « in », « out » : buy-in, buy-out ; « r » : repos. */
function order(circuit: StructureCircuit<SessionDraftExercise>): string[] {
  return expandStructure({ structure: { elements: [{ kind: "CIRCUIT", circuit }], stopPoints: [] } }).flatMap((step) =>
    step.kind === "SERIES" ? [`${step.exerciseId}${step.series ?? ""}`] : step.kind === "RECOVERY" ? ["r"] : [],
  );
}

const counts = (circuit: StructureCircuit<SessionDraftExercise>) => circuit.exercises.map((item) => seriesRowsOf(item.executionParameters).length);

const BASE: ModelAnswers = { ...initialAnswers("FOR_TIME"), roundCount: 3 };
const SEQUENCE: ModelAnswers = { ...BASE, execution: "SEQUENCE" };

describe("For time — mode d'exécution (FT-20 à FT-23)", () => {
  it("deux valeurs, « En alternance » par défaut ; ligne affichée dès deux exercices en tour (buy-in et buy-out non comptés)", () => {
    expect(executionOptions("FOR_TIME")).toEqual(["ALTERNATED", "SEQUENCE"]);
    expect(showsExecution("FOR_TIME", [movement("a", [21, 15, 9])])).toBe(false);
    expect(showsExecution("FOR_TIME", [movement("in", [10], "buyIn"), movement("a", [21, 15, 9]), movement("out", [10], "buyOut")])).toBe(false);
    expect(showsExecution("FOR_TIME", [movement("a", [21, 15, 9]), movement("b", [12, 12, 12])])).toBe(true);
  });

  it("2 exercices : alternance A,B,A,B… (séries alternées) ; à la suite toutes les séries de A puis de B (séries groupées) ; séries = tours", () => {
    const movements = [movement("a", [21, 15, 9]), movement("b", [12, 12, 12])];
    const alternated = circuitOf(BASE, movements);
    expect(alternated).toMatchObject({ nature: "SERIES", repeatCount: 3 });
    expect(order(alternated)).toEqual(["a1", "b1", "a2", "b2", "a3", "b3"]);
    const sequence = circuitOf(SEQUENCE, movements);
    expect(sequence).toMatchObject({ nature: "TOURS", repeatCount: 3 });
    expect(order(sequence)).toEqual(["a1", "a2", "a3", "b1", "b2", "b3"]);
    expect([counts(alternated), counts(sequence)]).toEqual([[3, 3], [3, 3]]);
    expect(configurationValidity({ elements: [{ kind: "CIRCUIT", circuit: sequence }], stopPoints: [] })).toEqual({ status: "valid" });
  });

  it("3 exercices avec buy-in et buy-out : une seule fois, au début et à la fin ; repos entre les tours / entre les séries", () => {
    const movements = [movement("in", [50], "buyIn"), movement("a", [21, 15, 9]), movement("b", [12, 12, 12]), movement("c", [5, 5, 5]), movement("out", [30], "buyOut")];
    const rest = { restBetweenRoundsSeconds: 30 };
    expect(order(circuitOf({ ...BASE, ...rest, buyIn: true, buyOut: true }, movements))).toEqual(["in1", "a1", "b1", "c1", "r", "a2", "b2", "c2", "r", "a3", "b3", "c3", "out1"]);
    const sequence = circuitOf({ ...SEQUENCE, ...rest, buyIn: true, buyOut: true }, movements);
    expect(order(sequence)).toEqual(["in1", "a1", "r", "a2", "r", "a3", "r", "b1", "r", "b2", "r", "b3", "r", "c1", "r", "c2", "r", "c3", "out1"]);
    expect(counts(sequence)).toEqual([1, 3, 3, 3, 1]);
  });

  it("un seul exercice en tour : « À la suite » sans effet, mode alternance", () => {
    const circuit = circuitOf({ ...SEQUENCE, buyIn: true }, [movement("in", [50], "buyIn"), movement("a", [21, 15, 9])]);
    expect(circuit.nature).toBe("SERIES");
  });

  it("réouverture : à la suite relu « À la suite » ; séance antérieure (séries alternées) relue « En alternance »", () => {
    const movements = [movement("a", [21, 15, 9]), movement("b", [12, 12, 12])];
    expect(modelStateOfCircuit("FOR_TIME", circuitOf(SEQUENCE, movements)).answers.execution).toBe("SEQUENCE");
    const earlier: StructureCircuit<SessionDraftExercise> = { ...circuitOf(BASE, movements) };
    expect(modelStateOfCircuit("FOR_TIME", earlier).answers.execution).toBe("ALTERNATED");
    expect(order(earlier)).toEqual(["a1", "b1", "a2", "b2", "a3", "b3"]);
  });

  it("à la suite, nombre de séries changé dans la Composition : chaque exercice en tour suit (séries = séries du Circuit)", () => {
    const circuit = circuitOf(SEQUENCE, [movement("a", [21, 15, 9]), movement("b", [12, 12, 12])]);
    const draft = withForTimeSeries({
      ...createEmptyDraft(),
      exercises: [...circuit.exercises],
      structure: { elements: [{ kind: "CIRCUIT", circuit: { ...circuit, repeatCount: 4, exercises: circuit.exercises.map((item) => item.id) } }], stopPoints: [] },
    });
    expect(draft.exercises.map((item) => seriesRowsOf(item.executionParameters).length)).toEqual([4, 4]);
  });

  it("déroulé : l'ordre suit le mode", () => {
    const movements = [movement("a", [21, 15, 9]), movement("b", [12, 12, 12])];
    const labels = (answers: ModelAnswers) => modelTimeline("FOR_TIME", answers, movements).blocks.flatMap((block) => (block.kind === "WORK" ? [`${block.movement}:${block.label}`] : []));
    expect(labels(BASE)).toEqual(["0:21", "1:12", "0:15", "1:12", "0:9", "1:12"]);
    expect(labels(SEQUENCE)).toEqual(["0:21", "0:15", "0:9", "1:12", "1:12", "1:12"]);
  });
});
