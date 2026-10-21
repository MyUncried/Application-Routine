import { describe, expect, it } from "@jest/globals";

import type { ExecutionParametersInput } from "@/domain/activities/ExecutionParameters";
import { durationParameters, variableParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { ExpandableOccurrence } from "@/domain/sessions/circuit";
import type { StopPoint } from "@/domain/sessions/StopPoint";
import { findUnpausedTransitions, hasUnpausedTransition } from "@/domain/sessions/unpausedTransitions";

/** PRE-6 story 4.3 (D-301) : frontières sans pause entre deux Exercices consécutifs. */
describe("findUnpausedTransitions (PRE-6, D-301)", () => {
  const occurrence = (
    id: string,
    structuralPosition: "BEFORE_TOUR" | "IN_TOUR" | "AFTER_TOUR",
    executionParameters: ExecutionParametersInput = durationParameters(30, 1, 0),
    postActivityRecoverySeconds: number | null = null,
  ): ExpandableOccurrence => ({ id, type: "EXERCISE", structuralPosition, postActivityRecoverySeconds, executionParameters });
  const pairs = (
    exercises: readonly ExpandableOccurrence[],
    options: { stopPoints?: readonly StopPoint[]; circuitNature?: "TOURS" | "SERIES"; tourRepeatCount?: number } = {},
  ) =>
    findUnpausedTransitions({ exercises, ...options }).map(
      ({ from, to }) => `${from.occurrenceId}${from.pass ?? ""}>${to.occurrenceId}${to.pass ?? ""}`,
    );

  it("hors Circuit, PN(A) = 0 et R absente : avertissement", () => {
    expect(pairs([occurrence("A", "BEFORE_TOUR"), occurrence("B", "BEFORE_TOUR")])).toEqual(["A>B"]);
  });

  it("PN(A) = 10 : aucun", () => {
    expect(pairs([occurrence("A", "BEFORE_TOUR", durationParameters(30, 1, 10)), occurrence("B", "BEFORE_TOUR")])).toEqual([]);
  });

  it("seule la dernière Pause compte : Pauses intermédiaires positives, PN = 0 → avertissement", () => {
    const parameters = variableParameters({ mode: "DURATION", rows: [[30, 10], [30, 10], [30, 0]] });
    expect(pairs([occurrence("A", "BEFORE_TOUR", parameters), occurrence("B", "AFTER_TOUR")])).toEqual(["A>B"]);
  });

  it("PN > 0 sur la dernière ligne seulement : aucun", () => {
    const parameters = variableParameters({ mode: "DURATION", rows: [[30, 0], [30, 15]] });
    expect(pairs([occurrence("A", "BEFORE_TOUR", parameters), occurrence("B", "AFTER_TOUR")])).toEqual([]);
  });

  it("R(A) = 20 et PN = 0 : aucun", () => {
    expect(pairs([occurrence("A", "BEFORE_TOUR", undefined, 20), occurrence("B", "BEFORE_TOUR")])).toEqual([]);
  });

  it("R(A) = 0 et PN = 0 : avertissement (0 ne remplace rien)", () => {
    expect(pairs([occurrence("A", "BEFORE_TOUR", undefined, 0), occurrence("B", "BEFORE_TOUR")])).toEqual(["A>B"]);
  });

  it("point d'arrêt après A (PN = 0, R absente) : aucun pour cette frontière", () => {
    const exercises = [occurrence("A", "BEFORE_TOUR"), occurrence("B", "BEFORE_TOUR"), occurrence("C", "BEFORE_TOUR")];
    expect(pairs(exercises, { stopPoints: [{ id: "p", scope: "BEFORE_TOUR", position: 1 }] })).toEqual(["B>C"]);
  });

  it("point en tête du Circuit : interrompt la frontière avant Circuit → Circuit", () => {
    const exercises = [occurrence("W", "BEFORE_TOUR"), occurrence("A", "IN_TOUR")];
    expect(pairs(exercises)).toEqual(["W>A1"]);
    expect(pairs(exercises, { stopPoints: [{ id: "h", scope: "IN_TOUR", position: 0 }] })).toEqual([]);
  });

  it("Circuit de Tours N = 2 [B], PN(B) = 0 : B → B est la même occurrence, jamais une frontière — seul ou avec W, même lecture (à confirmer par Hermann, J3)", () => {
    const alone = pairs([occurrence("B", "IN_TOUR")], { circuitNature: "TOURS", tourRepeatCount: 2 });
    const withW = pairs([occurrence("W", "BEFORE_TOUR", durationParameters(30, 1, 10)), occurrence("B", "IN_TOUR")], {
      circuitNature: "TOURS",
      tourRepeatCount: 2,
    });
    expect(alone).toEqual([]);
    expect(withW).toEqual(alone);
  });

  it("Circuit de Tours N = 2 [B, C] : la frontière de Tour C1 → B2 avertit", () => {
    const exercises = [occurrence("B", "IN_TOUR", durationParameters(30, 1, 10)), occurrence("C", "IN_TOUR")];
    expect(pairs(exercises, { circuitNature: "TOURS", tourRepeatCount: 2 })).toEqual(["C1>B2"]);
  });

  it("Circuit de Tours : R positive sur la dernière occurrence du Circuit coupe la frontière de Tour et la sortie du Circuit", () => {
    const exercises = [
      occurrence("A", "IN_TOUR", durationParameters(30, 1, 10)),
      occurrence("B", "IN_TOUR", undefined, 20),
      occurrence("Z", "AFTER_TOUR"),
    ];
    expect(pairs(exercises, { circuitNature: "TOURS", tourRepeatCount: 2 })).toEqual([]);
    const withoutR = [exercises[0]!, occurrence("B", "IN_TOUR"), exercises[2]!];
    expect(pairs(withoutR, { circuitNature: "TOURS", tourRepeatCount: 2 })).toEqual(["B1>A2", "B2>Z"]);
  });

  it("point « après le Circuit » (AFTER_TOUR, position 0) : coupe Circuit → occurrence suivante", () => {
    const exercises = [occurrence("A", "IN_TOUR", durationParameters(30, 1, 10)), occurrence("B", "IN_TOUR"), occurrence("Z", "AFTER_TOUR")];
    const options = { circuitNature: "TOURS" as const, tourRepeatCount: 2 };
    expect(pairs(exercises, options)).toEqual(["B1>A2", "B2>Z"]);
    expect(pairs(exercises, { ...options, stopPoints: [{ id: "c", scope: "AFTER_TOUR", position: 0 }] })).toEqual(["B1>A2"]);
  });

  it("Circuit de Séries : un exercice à moins de N séries est sauté à son passage manquant", () => {
    const exercises = [
      occurrence("A", "IN_TOUR", durationParameters(30, 2, 0)),
      occurrence("B", "IN_TOUR", durationParameters(30, 1, 0)),
      occurrence("C", "IN_TOUR", durationParameters(30, 2, 0)),
    ];
    // A1 B1 C1 A2 C2 : au passage 2, A2 enchaîne directement sur C2.
    expect(pairs(exercises, { circuitNature: "SERIES", tourRepeatCount: 2 })).toEqual(["A1>B1", "B1>C1", "C1>A2", "A2>C2"]);
  });

  it("Circuit de Séries : un exercice au Mode inconnu est joué en entier à chaque passage, sa dernière Pause décide", () => {
    const unknown = (pause: number): ExpandableOccurrence => ({
      ...occurrence("U", "IN_TOUR"),
      executionParameters: { ...durationParameters(30, 1, pause), mode: null },
    });
    const a = occurrence("A", "IN_TOUR", durationParameters(30, 2, 0));
    expect(pairs([a, unknown(0)], { circuitNature: "SERIES", tourRepeatCount: 2 })).toEqual(["A1>U1", "U1>A2", "A2>U2"]);
    expect(pairs([a, unknown(10)], { circuitNature: "SERIES", tourRepeatCount: 2 })).toEqual(["A1>U1", "A2>U2"]);
  });

  it("Circuit de Tours : R et point internes répétés à chaque Tour interrompent chaque transition", () => {
    const exercises = [occurrence("A", "IN_TOUR"), occurrence("B", "IN_TOUR", undefined, 20), occurrence("Z", "AFTER_TOUR")];
    expect(pairs(exercises, { circuitNature: "TOURS", tourRepeatCount: 2 })).toEqual(["A1>B1", "A2>B2"]);
    expect(
      pairs(exercises, { circuitNature: "TOURS", tourRepeatCount: 2, stopPoints: [{ id: "p", scope: "IN_TOUR", position: 1 }] }),
    ).toEqual([]);
  });

  it("fin du Circuit → occurrence suivante : avertissement si la dernière occurrence du Circuit n'a aucune pause", () => {
    const exercises = [occurrence("A", "IN_TOUR", durationParameters(30, 1, 10)), occurrence("B", "IN_TOUR"), occurrence("Z", "AFTER_TOUR")];
    expect(pairs(exercises, { circuitNature: "TOURS", tourRepeatCount: 2 })).toEqual(["B1>A2", "B2>Z"]);
  });

  it("Circuit de Séries N = 2 [A, B], Pi = 0 : avertissement à chaque passage", () => {
    const exercises = [occurrence("A", "IN_TOUR", durationParameters(30, 2, 0)), occurrence("B", "IN_TOUR", durationParameters(30, 2, 0))];
    expect(pairs(exercises, { circuitNature: "SERIES", tourRepeatCount: 2 })).toEqual(["A1>B1", "B1>A2", "A2>B2"]);
  });

  it("Circuit de Séries : la Pause de la série i jouée au passage i décide", () => {
    const a = variableParameters({ mode: "DURATION", rows: [[30, 10], [30, 0]] });
    const exercises = [occurrence("A", "IN_TOUR", a), occurrence("B", "IN_TOUR", durationParameters(30, 2, 5))];
    expect(pairs(exercises, { circuitNature: "SERIES", tourRepeatCount: 2 })).toEqual(["A2>B2"]);
  });

  it("aucun avertissement entre deux séries consécutives d'un même exercice (Séries)", () => {
    const exercises = [occurrence("A", "IN_TOUR", durationParameters(30, 3, 0)), occurrence("B", "IN_TOUR", durationParameters(30, 1, 0))];
    // A1 B1 A2 A3 : A2 → A3 est un enchaînement entre Séries, sans avertissement.
    expect(pairs(exercises, { circuitNature: "SERIES", tourRepeatCount: 3 })).toEqual(["A1>B1", "B1>A2"]);
  });

  it("un seul exercice : jamais d'avertissement, même répété par le Circuit", () => {
    expect(pairs([occurrence("A", "BEFORE_TOUR")])).toEqual([]);
    expect(pairs([occurrence("B", "IN_TOUR")], { circuitNature: "TOURS", tourRepeatCount: 3 })).toEqual([]);
    expect(pairs([occurrence("B", "IN_TOUR", durationParameters(30, 3, 0))], { circuitNature: "SERIES", tourRepeatCount: 3 })).toEqual([]);
    expect(pairs([])).toEqual([]);
  });

  it("une ancienne Récupération autonome sépare les deux Exercices voisins", () => {
    const legacy: ExpandableOccurrence = { ...occurrence("R", "BEFORE_TOUR"), type: "RECOVERY" };
    expect(pairs([occurrence("A", "BEFORE_TOUR"), legacy, occurrence("B", "BEFORE_TOUR")])).toEqual([]);
  });

  it("hasUnpausedTransition reflète la présence d'au moins une frontière", () => {
    expect(hasUnpausedTransition({ exercises: [occurrence("A", "BEFORE_TOUR"), occurrence("B", "BEFORE_TOUR")] })).toBe(true);
    expect(hasUnpausedTransition({ exercises: [occurrence("A", "BEFORE_TOUR", undefined, 30), occurrence("B", "BEFORE_TOUR")] })).toBe(
      false,
    );
  });

  it("porte le passage et la série de chaque extrémité", () => {
    const exercises = [occurrence("A", "IN_TOUR", durationParameters(30, 1, 0)), occurrence("B", "IN_TOUR", durationParameters(30, 1, 0))];
    expect(findUnpausedTransitions({ exercises, circuitNature: "SERIES", tourRepeatCount: 1 })).toEqual([
      { from: { occurrenceId: "A", pass: 1, series: 1 }, to: { occurrenceId: "B", pass: 1, series: 1 } },
    ]);
  });
});
