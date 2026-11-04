import { describe, expect, it } from "@jest/globals";

import { durationParameters, repetitionParameters, variableParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { seriesRowsOf } from "@/domain/activities/ExecutionParameters";
import { isLastTourMember, memberRemovalBlock, roleChoices, setMemberRole } from "@/domain/sessions/circuitRoles";
import { configurationValidity } from "@/domain/sessions/configurationValidity";
import { circuitRoleOf, type ElementFormat } from "@/domain/sessions/formats";
import { moveLayoutItem, removeLayoutExercise } from "@/domain/sessions/layoutMoves";
import { expandStructure } from "@/domain/sessions/planExpansion";
import { createEmptyDraft, type SessionDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import { structureCircuits, type StructureElement } from "@/domain/sessions/structure";

/**
 * Reprise du 04/11/2026 — Rôle dans le circuit (mise à jour consolidée des écrans Formats §6 bis 2) : zones
 * buy-in / tour / buy-out, plusieurs buy-in, garde du dernier membre de la boucle et du dernier Exercice en
 * Répétitions du For time ; validité de configuration (D.4) et développement du plan For time (D.1).
 */

const FOR_TIME = (settings: Record<string, number> = {}): ElementFormat => ({ key: "FOR_TIME", settings });
const exercise = (id: string, parameters = variableParameters({ mode: "REPETITIONS", rows: [[21, 0], [15, 0], [9, 0]] }), format: ElementFormat = FOR_TIME()): SessionDraftExercise => ({
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
  format,
});

const circuitFormat = { key: "FOR_TIME" as const, settings: { restBetweenRoundsSeconds: 30 } };

function draftOf(ids: readonly string[], exercises: readonly SessionDraftExercise[]): SessionDraft {
  const elements: StructureElement<string>[] = [{ kind: "CIRCUIT", circuit: { id: "f", nature: "SERIES", repeatCount: 3, format: circuitFormat, exercises: [...ids] } }];
  return { ...createEmptyDraft(), exercises: [...exercises], structure: { elements, stopPoints: [] } };
}

const order = (draft: SessionDraft) => structureCircuits(draft.structure!)[0]!.exercises;
const roles = (draft: SessionDraft) => order(draft).map((id, index) => circuitRoleOf(draft.exercises.find((item) => item.id === id)!.format, index));
const newId = () => "x";

describe("Rôle dans le circuit : zones (MAJ 04/11 §6 bis 2)", () => {
  const draft = draftOf(["a", "b"], [exercise("a"), exercise("b")]);

  it("passer en Buy-in place à la fin de la zone buy-in ; en Buy-out, à la fin ; revenir à Tour, en tête de la boucle", () => {
    const withIn = setMemberRole(draft, "b", "BUY_IN");
    expect(order(withIn)).toEqual(["b", "a"]);
    expect(roles(withIn)).toEqual(["BUY_IN", "TOUR"]);
    const back = setMemberRole(withIn, "b", "TOUR");
    expect(order(back)).toEqual(["b", "a"]);
    expect(roles(back)).toEqual(["TOUR", "TOUR"]);
    const out = setMemberRole(draft, "a", "BUY_OUT");
    expect(order(out)).toEqual(["b", "a"]);
    expect(roles(out)).toEqual(["TOUR", "BUY_OUT"]);
  });

  it("plusieurs buy-in, dans l'ordre ; le dernier membre de la boucle garde Tour seul (Buy-in et Buy-out indisponibles)", () => {
    const three = draftOf(["a", "b", "c"], [exercise("a"), exercise("b"), exercise("c")]);
    const twoIn = setMemberRole(setMemberRole(three, "a", "BUY_IN"), "b", "BUY_IN");
    expect(order(twoIn)).toEqual(["a", "b", "c"]);
    expect(roles(twoIn)).toEqual(["BUY_IN", "BUY_IN", "TOUR"]);
    expect(roleChoices(twoIn, twoIn.structure, "c")).toMatchObject({ current: "TOUR", available: ["TOUR"] });
    expect(setMemberRole(twoIn, "c", "BUY_OUT")).toBe(twoIn);
    expect(isLastTourMember(twoIn, twoIn.structure, "c")).toBe(true);
  });

  it("le dernier membre de la boucle ne se supprime ni ne sort tant qu'un buy-in reste", () => {
    const withIn = setMemberRole(draft, "b", "BUY_IN");
    expect(removeLayoutExercise(withIn, "a", newId)).toEqual({ status: "REFUSED", reason: "LAST_TOUR" });
    expect(moveLayoutItem(withIn, { kind: "EXERCISE", id: "a" }, { container: { kind: "SESSION" }, index: 1 }, newId)).toMatchObject({ status: "REFUSED", reason: "LAST_TOUR" });
  });

  it("le glisser-déposer réordonne dans une zone, jamais d'une zone à l'autre", () => {
    const withIn = setMemberRole(draftOf(["a", "b", "c"], [exercise("a"), exercise("b"), exercise("c")]), "c", "BUY_IN");
    expect(order(withIn)).toEqual(["c", "a", "b"]);
    expect(moveLayoutItem(withIn, { kind: "EXERCISE", id: "a" }, { container: { kind: "CIRCUIT", id: "f" }, index: 0 }, newId)).toMatchObject({ status: "REFUSED", reason: "PASSAGE_FIXED" });
    const swapped = moveLayoutItem(withIn, { kind: "EXERCISE", id: "b" }, { container: { kind: "CIRCUIT", id: "f" }, index: 1 }, newId);
    expect(swapped.status).toBe("APPLIED");
  });

  it("For time : un Exercice à l'échec passé en Buy-out passe À l'objectif, objectif à renseigner", () => {
    const failing = exercise("a", { ...repetitionParameters(10, 3), series: { kind: "UNIFORM", count: 3, target: { kind: "FAILURE" }, pauseSeconds: 0, loadKg: 0, workPhases: [] } });
    const out = setMemberRole(draftOf(["a", "b"], [failing, exercise("b")]), "a", "BUY_OUT");
    expect(seriesRowsOf(out.exercises.find((item) => item.id === "a")!.executionParameters)[0]!.target).toEqual({ kind: "UNSET" });
  });

  it("For time : le dernier Exercice en Répétitions de l'ensemble du Circuit ne se supprime pas", () => {
    const timed = draftOf(["a", "b"], [exercise("a", durationParameters(30, 3)), exercise("b")]);
    expect(memberRemovalBlock(timed, timed.structure, "b")).toBe("LAST_REPETITIONS");
    expect(memberRemovalBlock(timed, timed.structure, "a")).toBeNull();
  });
});

describe("D.4 — validité : zones, Répétitions du For time, contrôle EMOM", () => {
  const of = (elements: StructureElement<SessionDraftExercise>[]) => ({ elements, stopPoints: [] });

  it("For time entièrement en Durée : NO_REPETITIONS ; buy-out en tête : ROLE_ZONES", () => {
    const timed = [exercise("a", durationParameters(30, 3)), exercise("b", durationParameters(30, 3))];
    expect(configurationValidity(of([{ kind: "CIRCUIT", circuit: { id: "f", nature: "SERIES", repeatCount: 3, format: circuitFormat, exercises: timed } }]))).toMatchObject({
      issues: expect.arrayContaining([{ elementId: "f", reason: "NO_REPETITIONS" }]),
    });
    const misplaced = [exercise("o", repetitionParameters(10), FOR_TIME({ circuitRole: 2 })), exercise("a")];
    expect(configurationValidity(of([{ kind: "CIRCUIT", circuit: { id: "f", nature: "SERIES", repeatCount: 3, format: circuitFormat, exercises: misplaced } }]))).toMatchObject({
      issues: expect.arrayContaining([{ elementId: "f", reason: "ROLE_ZONES" }]),
    });
  });

  it("EMOM : travail prévu ≥ intervalle (seuil inclusif) ; dans chaque intervalle, somme des membres", () => {
    const emom = (id: string, seconds: number, settings: Record<string, number>) => exercise(id, durationParameters(seconds, 6), { key: "EMOM", settings });
    expect(configurationValidity(of([{ kind: "EXERCISE", exercise: emom("e", 60, { intervalSeconds: 60 }) }]))).toMatchObject({ issues: [{ elementId: "e", reason: "EMOM_DURATION" }] });
    expect(configurationValidity(of([{ kind: "EXERCISE", exercise: emom("e", 59, { intervalSeconds: 60 }) }]))).toEqual({ status: "valid" });
    const members = [emom("a", 30, {}), emom("b", 30, {})].map((item) => ({ ...item, executionParameters: durationParameters(30, 1) }));
    const window = { key: "EMOM" as const, settings: { windowSeconds: 60 } };
    expect(configurationValidity(of([{ kind: "CIRCUIT", circuit: { id: "c", nature: "TOURS", repeatCount: 6, format: window, exercises: members } }]))).toMatchObject({
      issues: [{ elementId: "c", reason: "EMOM_DURATION" }],
    });
  });
});

describe("D.1 — Circuit For time : buy-in avant le tour 1, buy-out après le dernier, repos entre les tours", () => {
  it("chaque buy-in et buy-out une seule fois, la boucle alternée par tour", () => {
    const members = [exercise("in", repetitionParameters(50, 1), FOR_TIME({ circuitRole: 1 })), exercise("a"), exercise("out", repetitionParameters(20, 1), FOR_TIME({ circuitRole: 2 }))];
    const steps = expandStructure({ structure: { elements: [{ kind: "CIRCUIT", circuit: { id: "f", nature: "SERIES", repeatCount: 3, format: circuitFormat, exercises: members } }], stopPoints: [] } });
    const sequence = steps.flatMap((step) => (step.kind === "SERIES" ? [step.exerciseId] : step.kind === "RECOVERY" && step.exerciseId === "f" ? ["rest"] : []));
    expect(sequence.filter((id) => id === "in")).toHaveLength(1);
    expect(sequence.filter((id) => id === "out")).toHaveLength(1);
    expect(sequence[0]).toBe("in");
    expect(sequence.at(-1)).toBe("out");
    expect(sequence.filter((id) => id === "rest")).toHaveLength(2);
  });
});
