import { describe, expect, it } from "@jest/globals";

import { seriesCountOf, seriesRowsOf } from "@/domain/activities/ExecutionParameters";
import { durationParameters, variableParameters } from "@/domain/activities/testing/executionParametersFixtures";
import {
  applyLayoutNatureChange,
  formattedMemberFits,
  moveExerciseToCircuit,
  prepareLayoutNatureChange,
  setLayoutCircuitCount,
  settleLayoutCircuitMembership,
} from "@/domain/sessions/layoutOperations";
import { createEmptyDraft, createExerciseDraft, type SessionDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import { structureCircuits, type StructureElement } from "@/domain/sessions/structure";

/**
 * PRE-9 (story B.3, COMP §2 et §6, ch10 l.1026-1182, D-07, D-08, D-09, §2.4 des Arbitrages consolidés
 * du 30/10) — séries groupées / alternées appliquées à CHAQUE Circuit d'une disposition générale :
 * N commun par Circuit, conversions avec confirmation si perte, réserve de brouillon, entrée et
 * déplacement vers un Circuit alterné, Exercices formatés refusés sans altération.
 */

const exercise = (id: string, parameters = durationParameters(30, 3)): SessionDraftExercise => ({
  ...createExerciseDraft(id),
  name: id,
  executionParameters: parameters,
});

/** Variables, `count` lignes de 10, 20, 30… s. */
const variable = (count: number) => variableParameters({ rows: Array.from({ length: count }, (_, index) => [10 * (index + 1), 5] as const) });

function draftOf(elements: readonly StructureElement<string>[], exercises: readonly SessionDraftExercise[]): SessionDraft {
  return { ...createEmptyDraft(), exercises, structure: { elements, stopPoints: [] } };
}

/**
 * Séance à deux Circuits de natures différentes : E0, Circuit A alterné × 3 [a1 (variables 3), a2],
 * Cycle × 2 [Circuit B groupé × 2 [b1 (5 séries)], d1], E9.
 */
const twoNatures = (overrides: Partial<Record<string, SessionDraftExercise>> = {}): SessionDraft =>
  draftOf(
    [
      { kind: "EXERCISE", exercise: "e0" },
      { kind: "CIRCUIT", circuit: { id: "ca", repeatCount: 3, nature: "SERIES", exercises: ["a1", "a2"] } },
      {
        kind: "CYCLE",
        cycle: {
          id: "cy",
          repeatCount: 2,
          members: [
            { kind: "CIRCUIT", circuit: { id: "cb", repeatCount: 2, nature: "TOURS", exercises: ["b1"] } },
            { kind: "EXERCISE", exercise: "d1" },
          ],
        },
      },
      { kind: "EXERCISE", exercise: "e9" },
    ],
    [
      exercise("e0", durationParameters(30, 5)),
      exercise("a1", variable(3)),
      exercise("a2", durationParameters(40, 3)),
      exercise("b1", durationParameters(30, 5)),
      exercise("d1", durationParameters(30, 2)),
      exercise("e9", durationParameters(30, 1)),
    ].map((item) => overrides[item.id] ?? item),
  );

const byId = (draft: SessionDraft, id: string) => draft.exercises.find((item) => item.id === id)!;
const countOf = (draft: SessionDraft, id: string) => seriesCountOf(byId(draft, id).executionParameters);
const circuitOf = (draft: SessionDraft, id: string) => structureCircuits(draft.structure!).find((circuit) => circuit.id === id);
const targets = (draft: SessionDraft, id: string) =>
  seriesRowsOf(byId(draft, id).executionParameters).map((row) => (row.target.kind === "NUMBER" ? row.target.value : row.target.kind));

describe("PRE-9 B.3 — N commun et réserve, Circuit par Circuit (COMP §2, ch10 « Nombre imposé et diminution »)", () => {
  it("diminuer N du Circuit alterné A : ses seuls Exercices suivent, lignes retirées en réserve ; le Circuit groupé B n'est pas touché", () => {
    const draft = twoNatures();
    const reduced = setLayoutCircuitCount(draft, "ca", 2);
    expect(circuitOf(reduced, "ca")).toMatchObject({ repeatCount: 2, nature: "SERIES" });
    expect(countOf(reduced, "a1")).toBe(2);
    expect(countOf(reduced, "a2")).toBe(2);
    expect(countOf(reduced, "b1")).toBe(5);
    expect(circuitOf(reduced, "cb")).toMatchObject({ repeatCount: 2, nature: "TOURS" });
    // Réserve de brouillon : la ligne retirée de a1 (variables) ; a2 (identiques) n'en a pas besoin.
    expect(Object.keys(reduced.circuitSeriesReserve ?? {})).toEqual(["a1"]);
    // Réaugmenter restaure la ligne réservée, avec ses paramètres et son ordre.
    const restored = setLayoutCircuitCount(reduced, "ca", 3);
    expect(targets(restored, "a1")).toEqual([10, 20, 30]);
    expect(restored.circuitSeriesReserve).toBeUndefined();
    // Au-delà : copie de la dernière ligne active.
    expect(targets(setLayoutCircuitCount(restored, "ca", 4), "a1")).toEqual([10, 20, 30, 30]);
  });

  it("le compte d'un Circuit groupé ne modifie jamais les séries de ses Exercices (D-08)", () => {
    const draft = twoNatures();
    const next = setLayoutCircuitCount(draft, "cb", 4);
    expect(circuitOf(next, "cb")).toMatchObject({ repeatCount: 4 });
    expect(next.exercises).toBe(draft.exercises);
    expect(countOf(next, "b1")).toBe(5);
    expect(next.circuitSeriesReserve).toBeUndefined();
  });
});

describe("PRE-9 B.3 — conversions par Circuit (COMP §2, ch10 « La conversion entre les deux natures », D-09)", () => {
  it("groupées → alternées avec perte : perte annoncée avant mutation ; confirmée, troncature définitive du seul Circuit B", () => {
    const draft = twoNatures();
    expect(prepareLayoutNatureChange(draft, "cb", "SERIES").losses).toEqual([{ occurrenceId: "b1", lostSeriesCount: 3 }]);
    const converted = applyLayoutNatureChange(draft, "cb", "SERIES");
    expect(circuitOf(converted, "cb")).toMatchObject({ nature: "SERIES", repeatCount: 2 });
    expect(countOf(converted, "b1")).toBe(2);
    // Le Circuit A et les Exercices hors Circuit (même de 5 séries) sont intacts.
    expect(countOf(converted, "a1")).toBe(3);
    expect(countOf(converted, "e0")).toBe(5);
    expect(countOf(converted, "d1")).toBe(2);
    // Retour en groupées : sans perte, sans restauration des séries tronquées.
    expect(prepareLayoutNatureChange(converted, "cb", "TOURS").losses).toEqual([]);
    expect(countOf(applyLayoutNatureChange(converted, "cb", "TOURS"), "b1")).toBe(2);
  });

  it("groupées → alternées sans perte : aucune confirmation, extension par la dernière valeur", () => {
    const draft = twoNatures({ b1: exercise("b1", variableParameters({ rows: [[15, 5]] })) });
    expect(prepareLayoutNatureChange(draft, "cb", "SERIES").losses).toEqual([]);
    expect(targets(applyLayoutNatureChange(draft, "cb", "SERIES"), "b1")).toEqual([15, 15]);
  });

  it("alternées → groupées : séries et paramètres conservés, sans confirmation ; la réserve du Circuit reste celle du brouillon", () => {
    const reduced = setLayoutCircuitCount(twoNatures(), "ca", 2);
    expect(prepareLayoutNatureChange(reduced, "ca", "TOURS").losses).toEqual([]);
    const grouped = applyLayoutNatureChange(reduced, "ca", "TOURS");
    expect(circuitOf(grouped, "ca")).toMatchObject({ nature: "TOURS", repeatCount: 2 });
    expect(targets(grouped, "a1")).toEqual([10, 20]);
  });
});

describe("PRE-9 B.3 — entrée dans un Circuit alterné (ch10 « Ajout et sortie du circuit », COMP §6, D-07, D-09)", () => {
  const withInserted = (draft: SessionDraft, added: SessionDraftExercise, circuitId: string, at: number): Pick<SessionDraft, "exercises" | "structure"> => ({
    exercises: [...draft.exercises, added],
    structure: {
      ...draft.structure!,
      elements: draft.structure!.elements.map((element) =>
        element.kind === "CIRCUIT" && element.circuit.id === circuitId
          ? { kind: "CIRCUIT", circuit: { ...element.circuit, exercises: [...element.circuit.exercises.slice(0, at), added.id, ...element.circuit.exercises.slice(at)] } }
          : element,
      ),
    },
  });

  it("nouvel Exercice à une série : porté au N du Circuit d'arrivée, sans perte ni confirmation", () => {
    const draft = twoNatures();
    const settled = settleLayoutCircuitMembership(draft, withInserted(draft, exercise("n", durationParameters(20, 1)), "ca", 2));
    expect(settled.losses).toEqual([]);
    expect(seriesCountOf(settled.exercises.find((item) => item.id === "n")!.executionParameters)).toBe(3);
    // Les membres déjà présents ne sont pas réadaptés.
    expect(settled.exercises.find((item) => item.id === "a1")).toBe(byId(draft, "a1"));
  });

  it("nouvel Exercice de 5 séries : perte de 2 séries annoncée (N = 3), adaptation calculée sans écriture", () => {
    const draft = twoNatures();
    const settled = settleLayoutCircuitMembership(draft, withInserted(draft, exercise("n", durationParameters(20, 5)), "ca", 0));
    expect(settled.losses).toEqual([{ occurrenceId: "n", lostSeriesCount: 2 }]);
    expect(settled.targetCount).toBe(3);
    expect(seriesCountOf(settled.exercises.find((item) => item.id === "n")!.executionParameters)).toBe(3);
  });

  it("Exercice ajouté dans un Circuit groupé : inchangé (D-08)", () => {
    const draft = twoNatures({ e9: exercise("e9", durationParameters(30, 1)) });
    const next = {
      exercises: [...draft.exercises, exercise("n", durationParameters(20, 5))],
      structure: draftOf(
        [{ kind: "CIRCUIT", circuit: { id: "cb", repeatCount: 2, nature: "TOURS", exercises: ["b1", "n"] } }],
        [],
      ).structure,
    };
    const settled = settleLayoutCircuitMembership(draft, next);
    expect(settled.losses).toEqual([]);
    expect(settled.exercises).toBe(next.exercises);
  });
});

describe("PRE-9 B.3 — déplacement vers un Circuit (COMP §6 ; geste en B.4)", () => {
  let next = 0;
  const newId = () => `new-${++next}`;

  it("Exercice du niveau Séance vers le Circuit alterné A, sans perte : déplacé et porté à N", () => {
    const outcome = moveExerciseToCircuit(twoNatures(), "e9", "ca", 1, newId);
    expect(outcome.status).toBe("APPLIED");
    if (outcome.status !== "APPLIED") return;
    expect(circuitOf(outcome.draft, "ca")!.exercises).toEqual(["a1", "e9", "a2"]);
    expect(outcome.draft.structure!.elements.some((element) => element.kind === "EXERCISE" && element.exercise === "e9")).toBe(false);
    expect(countOf(outcome.draft, "e9")).toBe(3);
  });

  it("avec perte : confirmation requise ; le brouillon d'entrée est intact (Annuler) ; le brouillon proposé déplace et adapte ensemble (Confirmer)", () => {
    const draft = twoNatures();
    const outcome = moveExerciseToCircuit(draft, "e0", "ca", 0, newId);
    expect(outcome.status).toBe("CONFIRMATION_REQUIRED");
    if (outcome.status !== "CONFIRMATION_REQUIRED") return;
    expect(outcome.losses).toEqual([{ occurrenceId: "e0", lostSeriesCount: 2 }]);
    expect(outcome.targetCount).toBe(3);
    expect(countOf(draft, "e0")).toBe(5);
    expect(circuitOf(draft, "ca")!.exercises).toEqual(["a1", "a2"]);
    expect(circuitOf(outcome.draft, "ca")!.exercises).toEqual(["e0", "a1", "a2"]);
    expect(countOf(outcome.draft, "e0")).toBe(3);
  });

  it("d'un Circuit alterné vers un autre : adaptation au N d'arrivée ; réserve de la source retirée ; Circuit source vidé disparu", () => {
    const draft = draftOf(
      [
        { kind: "CIRCUIT", circuit: { id: "c1", repeatCount: 4, nature: "SERIES", exercises: ["x"] } },
        { kind: "CIRCUIT", circuit: { id: "c2", repeatCount: 2, nature: "SERIES", exercises: ["y"] } },
        { kind: "EXERCISE", exercise: "z" },
      ],
      [exercise("x", variable(4)), exercise("y", durationParameters(30, 2)), exercise("z", durationParameters(30, 1))],
    );
    const reduced = setLayoutCircuitCount(draft, "c1", 3);
    expect(Object.keys(reduced.circuitSeriesReserve!)).toEqual(["x"]);
    const outcome = moveExerciseToCircuit(reduced, "x", "c2", 5, newId);
    expect(outcome.status).toBe("CONFIRMATION_REQUIRED");
    if (outcome.status !== "CONFIRMATION_REQUIRED") return;
    expect(outcome.losses).toEqual([{ occurrenceId: "x", lostSeriesCount: 1 }]);
    expect(targets(outcome.draft, "x")).toEqual([10, 20]);
    expect(outcome.draft.circuitSeriesReserve).toBeUndefined();
    // COMP §1 : le Circuit c1, vidé, disparaît ; la disposition restante est celle de l'ancien modèle.
    expect(structureCircuits(outcome.draft.structure!).map((circuit) => circuit.id)).toEqual(["c2"]);
    expect(circuitOf(outcome.draft, "c2")!.exercises).toEqual(["y", "x"]);
  });

  it("d'un Circuit alterné vers un Circuit groupé : nombre actif et paramètres conservés (sortie), réordonnancement dans le même Circuit sans adaptation", () => {
    const toGrouped = moveExerciseToCircuit(twoNatures(), "a1", "cb", 1, newId);
    expect(toGrouped.status).toBe("APPLIED");
    if (toGrouped.status !== "APPLIED") return;
    expect(targets(toGrouped.draft, "a1")).toEqual([10, 20, 30]);
    expect(circuitOf(toGrouped.draft, "cb")!.exercises).toEqual(["b1", "a1"]);
    const base = twoNatures();
    const reordered = moveExerciseToCircuit(base, "a2", "ca", 0, newId);
    expect(reordered.status).toBe("APPLIED");
    if (reordered.status !== "APPLIED") return;
    expect(circuitOf(reordered.draft, "ca")!.exercises).toEqual(["a2", "a1"]);
    expect(reordered.draft.exercises).toBe(base.exercises);
  });

  // [B.3 : « … ; Séance portant des Points d'arrêt (B.4 / B.6) » (refus `STOP_POINTS`) — remplacé le
  // 31/10/2026 par B.6 : déplacement appliqué, D-442 sur toute la structure.]
  it("refus sans altération : Exercice ou Circuit inconnu ; Séance portant des Points d'arrêt : appliqué (B.6, D-442)", () => {
    expect(moveExerciseToCircuit(twoNatures(), "absent", "ca", 0, newId)).toEqual({ status: "REFUSED", reason: "NOT_FOUND" });
    expect(moveExerciseToCircuit(twoNatures(), "e0", "absent", 0, newId)).toEqual({ status: "REFUSED", reason: "NOT_FOUND" });
    const legacyWithPoint: SessionDraft = {
      ...createEmptyDraft(),
      exercises: [{ ...exercise("p"), structuralPosition: "BEFORE_TOUR" }, { ...exercise("q"), structuralPosition: "IN_TOUR" }],
      circuitNature: "SERIES",
      tourRepeatCount: 3,
      stopPoints: [{ id: "s1", scope: "BEFORE_TOUR", position: 1 }],
      structure: {
        elements: [
          { kind: "EXERCISE", exercise: "p" },
          { kind: "CIRCUIT", circuit: { id: "t", repeatCount: 3, nature: "SERIES", exercises: ["q"] } },
        ],
        stopPoints: [],
      },
    };
    const outcome = moveExerciseToCircuit(legacyWithPoint, "p", "t", 0, newId);
    // Le Point qui suivait p précéderait le Circuit en tête de Séance : retiré sans message (RM-219).
    expect(outcome.status === "APPLIED" || outcome.status === "CONFIRMATION_REQUIRED" ? outcome.removedStopPointIds : outcome.status).toEqual(["s1"]);
  });
});

describe("PRE-9 B.3 — Exercices formatés : refus sans altération (D-05, D-17 ; matrice §6.1 du 02/11/2026 ; adaptation des séries : C.4)", () => {
  const formatted = (id: string, key: "AMRAP" | "EMOM", count: number): SessionDraftExercise => ({
    ...exercise(id, durationParameters(20, count, 10)),
    format: { key, settings: {} },
  });
  let next = 0;
  const newId = () => `f-${++next}`;

  it("matrice §6.1 : groupées admises sans modification ; alternées : AMRAP refusé, EMOM admis, son compte de séries adapté au Circuit", () => {
    expect(formattedMemberFits(formatted("t", "EMOM", 8), "TOURS", 3)).toBe(true);
    expect(formattedMemberFits(formatted("t", "EMOM", 8), "SERIES", 8)).toBe(true);
    expect(formattedMemberFits(formatted("t", "EMOM", 8), "SERIES", 3)).toBe(true);
    expect(formattedMemberFits(formatted("m", "AMRAP", 1), "SERIES", 1)).toBe(false);
    expect(formattedMemberFits(formatted("m", "AMRAP", 1), "TOURS", 1)).toBe(true);
    expect(formattedMemberFits(exercise("libre"), "SERIES", 2)).toBe(true);
  });

  it("déplacement d'un AMRAP vers un Circuit alterné refusé ; EMOM de 8 séries admis dans un alterné à 8", () => {
    const draft = draftOf(
      [
        { kind: "EXERCISE", exercise: "m" },
        { kind: "EXERCISE", exercise: "t" },
        { kind: "CIRCUIT", circuit: { id: "c8", repeatCount: 8, nature: "SERIES", exercises: ["x"] } },
        { kind: "CIRCUIT", circuit: { id: "c3", repeatCount: 3, nature: "SERIES", exercises: ["y"] } },
      ],
      [formatted("m", "AMRAP", 1), formatted("t", "EMOM", 8), exercise("x", durationParameters(30, 8)), exercise("y")],
    );
    expect(moveExerciseToCircuit(draft, "m", "c8", 0, newId)).toEqual({ status: "REFUSED", reason: "FORMAT_INCOMPATIBLE" });
    // EMOM de 8 séries vers un alterné à 3 : adapté comme un Exercice standard, perte confirmée (D-09, §6.1).
    expect(moveExerciseToCircuit(draft, "t", "c3", 0, newId).status).toBe("CONFIRMATION_REQUIRED");
    expect(moveExerciseToCircuit(draft, "t", "c8", 0, newId).status).toBe("APPLIED");
  });

  it("N : un membre EMOM alterné suit le compte (§6.1) ; nature qui refuserait un membre AMRAP : non appliquée", () => {
    const draft = draftOf(
      [
        { kind: "CIRCUIT", circuit: { id: "c8", repeatCount: 8, nature: "SERIES", exercises: ["t"] } },
        { kind: "CIRCUIT", circuit: { id: "g", repeatCount: 3, nature: "TOURS", exercises: ["m"] } },
      ],
      [formatted("t", "EMOM", 8), formatted("m", "AMRAP", 1)],
    );
    expect(countOf(setLayoutCircuitCount(draft, "c8", 7), "t")).toBe(7);
    expect(applyLayoutNatureChange(draft, "g", "SERIES")).toBe(draft);
    expect(prepareLayoutNatureChange(draft, "g", "SERIES").losses).toEqual([]);
    // Groupées : compte libre, séries intrinsèques inchangées.
    expect(countOf(setLayoutCircuitCount(draft, "g", 5), "m")).toBe(1);
    // Alternées → groupées : admis.
    expect(circuitOf(applyLayoutNatureChange(draft, "c8", "TOURS"), "c8")).toMatchObject({ nature: "TOURS" });
  });
});
