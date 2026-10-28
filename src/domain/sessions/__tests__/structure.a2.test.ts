import { describe, expect, it } from "@jest/globals";

import { durationParameters, repetitionParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { computeStructuredSessionDuration, type ActivityDurationFacts } from "@/domain/sessions/calculations";
import {
  computeStructureDuration,
  countStructureExercises,
  legacyFromStructure,
  structureCircuits,
  structureExercises,
  structureFromLegacy,
  validateStructureShape,
  type LegacyComposition,
  type SessionStructure,
  type StructureCircuit,
  type StructureStopPointLocation,
} from "@/domain/sessions/structure";

/** PRE-8 story A.2 (D-449 §4 et §6) : structure générale, sans imbrication, et projection ancienne. */

type Facts = ActivityDurationFacts & { readonly id: string };

const exercise = (id: string, seconds = 30, count = 1, pause = 0): Facts => ({
  id,
  type: "EXERCISE",
  executionParameters: durationParameters(seconds, count, pause),
  postActivityRecoverySeconds: 0,
});

const circuit = (id: string, exercises: readonly Facts[], repeatCount = 1, nature: "TOURS" | "SERIES" = "TOURS"): StructureCircuit<Facts> => ({
  id,
  repeatCount,
  nature,
  exercises,
});

const idOf = (facts: Facts) => facts.id;

describe("structure — parcours et comptes D-449 §6", () => {
  const a = exercise("a");
  const b = exercise("b");
  const c = exercise("c");
  const d = exercise("d");
  const e = exercise("e");
  const structure: SessionStructure<Facts> = {
    elements: [
      { kind: "EXERCISE", exercise: a },
      { kind: "CYCLE", cycle: { id: "A", repeatCount: 3, circuits: [circuit("c1", [b]), circuit("c2", [c, d])] } },
      { kind: "CYCLE", cycle: { id: "B", repeatCount: 2, circuits: [circuit("c3", [b])] } },
      { kind: "EXERCISE", exercise: e },
    ],
    stopPoints: [],
  };

  it("liste les Exercices et les Circuits dans l'ordre d'affichage, Cycles successifs compris", () => {
    expect(structureExercises(structure).map(idOf)).toEqual(["a", "b", "c", "d", "b", "e"]);
    expect(structureCircuits(structure).map((item) => item.id)).toEqual(["c1", "c2", "c3"]);
  });

  it("compte chaque Exercice défini une fois, sans multiplier par Circuits, Cycles ni séries", () => {
    // Le même exercice « b » placé deux fois compte pour deux (deux exercices de composition).
    expect(countStructureExercises(structure)).toBe(6);
  });
});

describe("structure — durée des Cycles successifs", () => {
  it("répète chaque Cycle selon son propre compte, Circuits de Tours compris", () => {
    const x = exercise("x", 30);
    const y = exercise("y", 10);
    const structure: SessionStructure<Facts> = {
      elements: [
        { kind: "EXERCISE", exercise: x },
        { kind: "CYCLE", cycle: { id: "A", repeatCount: 3, circuits: [circuit("c1", [y], 2)] } },
        { kind: "CYCLE", cycle: { id: "B", repeatCount: 2, circuits: [circuit("c2", [x])] } },
      ],
      stopPoints: [],
    };
    // 30 + (10 × 2 tours × 3 cycles) + (30 × 1 tour × 2 cycles).
    expect(computeStructureDuration(structure)).toEqual({ kind: "exact", seconds: 30 + 60 + 60 });
  });

  it("donne le même total que le calcul à Circuit unique sur la projection ancienne (Tours et Séries)", () => {
    for (const nature of ["TOURS", "SERIES"] as const) {
      const before = [exercise("b1", 20)];
      const inTour = [
        { ...exercise("i1"), executionParameters: repetitionParameters(10, 3, 15) },
        exercise("i2", 40, 2, 5),
      ];
      const after = [exercise("a1", 15)];
      const legacy: LegacyComposition<Facts> = { beforeTour: before, tour: circuit("t", inTour, 3, nature), afterTour: after };
      expect(computeStructureDuration(structureFromLegacy(legacy))).toEqual(
        computeStructuredSessionDuration({ beforeTour: before, inTour, afterTour: after, tourRepeatCount: 3, circuitNature: nature }),
      );
    }
  });
});

describe("structure — projection ancienne sans perte", () => {
  const legacy: LegacyComposition<Facts> = {
    beforeTour: [exercise("b1"), exercise("b2")],
    tour: circuit("t", [exercise("i1")], 4, "SERIES"),
    afterTour: [exercise("a1")],
  };
  const points = [
    { id: "p0", scope: "BEFORE_TOUR" as const, position: 0 },
    { id: "p1", scope: "BEFORE_TOUR" as const, position: 2 },
    { id: "p2", scope: "IN_TOUR" as const, position: 1 },
    { id: "p3", scope: "AFTER_TOUR" as const, position: 0 },
    { id: "p4", scope: "AFTER_TOUR" as const, position: 1 },
  ];

  it("convertit les zones en éléments et les Points d'arrêt en emplacements de conteneur", () => {
    const structure = structureFromLegacy(legacy, points);
    expect(structure.elements.map((element) => element.kind)).toEqual(["EXERCISE", "EXERCISE", "CIRCUIT", "EXERCISE"]);
    expect(structure.stopPoints).toEqual([
      { id: "p0", circuitId: null, position: 0 },
      { id: "p1", circuitId: null, position: 2 },
      { id: "p2", circuitId: "t", position: 1 },
      { id: "p3", circuitId: null, position: 3 },
      { id: "p4", circuitId: null, position: 4 },
    ]);
  });

  it("revient exactement à l'ancien modèle (aller-retour), Circuit vide compris", () => {
    expect(legacyFromStructure(structureFromLegacy(legacy, points))).toEqual({ composition: legacy, stopPoints: points });
    const empty: LegacyComposition<Facts> = { beforeTour: [], tour: circuit("t", []), afterTour: [] };
    const emptyPoints = [{ id: "p", scope: "BEFORE_TOUR" as const, position: 0 }];
    expect(legacyFromStructure(structureFromLegacy(empty, emptyPoints))).toEqual({ composition: empty, stopPoints: emptyPoints });
  });

  it("refuse la projection d'une structure plus riche (Cycle, plusieurs Circuits ou aucun)", () => {
    const withCycle: SessionStructure<Facts> = {
      elements: [{ kind: "CYCLE", cycle: { id: "A", repeatCount: 2, circuits: [circuit("c1", [exercise("x")])] } }],
      stopPoints: [],
    };
    const twoCircuits: SessionStructure<Facts> = {
      elements: [
        { kind: "CIRCUIT", circuit: circuit("c1", []) },
        { kind: "CIRCUIT", circuit: circuit("c2", []) },
      ],
      stopPoints: [],
    };
    const noCircuit: SessionStructure<Facts> = { elements: [{ kind: "EXERCISE", exercise: exercise("x") }], stopPoints: [] };
    expect(legacyFromStructure(withCycle)).toBeNull();
    expect(legacyFromStructure(twoCircuits)).toBeNull();
    expect(legacyFromStructure(noCircuit)).toBeNull();
  });
});

describe("structure — validation de forme", () => {
  const codes = (structure: SessionStructure<Facts, StructureStopPointLocation>) =>
    validateStructureShape(structure, idOf).map((violation) => violation.code);

  it("accepte plusieurs Cycles successifs sans plafond de répétitions", () => {
    expect(
      codes({
        elements: [
          { kind: "CYCLE", cycle: { id: "A", repeatCount: 250, circuits: [circuit("c1", [exercise("x")])] } },
          { kind: "CYCLE", cycle: { id: "B", repeatCount: 1, circuits: [circuit("c2", [exercise("y")]), circuit("c3", [exercise("z")])] } },
        ],
        stopPoints: [],
      }),
    ).toEqual([]);
  });

  it("refuse un Cycle vide, des comptes hors bornes, une nature inconnue et une identité répétée", () => {
    expect(
      codes({
        elements: [
          { kind: "CYCLE", cycle: { id: "A", repeatCount: 0, circuits: [] } },
          { kind: "CIRCUIT", circuit: { ...circuit("c1", [exercise("x")], 100), nature: "MAX" as never } },
          { kind: "EXERCISE", exercise: exercise("x") },
        ],
        stopPoints: [],
      }).sort(),
    ).toEqual(
      [
        "STRUCTURE_CIRCUIT_NATURE_UNRECOGNIZED",
        "STRUCTURE_CIRCUIT_REPEAT_OUT_OF_RANGE",
        "STRUCTURE_CYCLE_REPEAT_OUT_OF_RANGE",
        "STRUCTURE_DUPLICATE_ID",
        "STRUCTURE_EMPTY_CYCLE",
      ].sort(),
    );
  });

  it("contrôle les Points d'arrêt : conteneur connu, rang borné, emplacement unique", () => {
    const base: SessionStructure<Facts, StructureStopPointLocation> = {
      elements: [
        { kind: "EXERCISE", exercise: exercise("x") },
        { kind: "CIRCUIT", circuit: circuit("t", [exercise("y")]) },
      ],
      stopPoints: [],
    };
    expect(codes({ ...base, stopPoints: [{ circuitId: "t", position: 1 }, { circuitId: null, position: 1 }] })).toEqual([]);
    expect(codes({ ...base, stopPoints: [{ circuitId: "?", position: 0 }] })).toEqual(["STRUCTURE_STOP_POINT_UNKNOWN_CIRCUIT"]);
    expect(codes({ ...base, stopPoints: [{ circuitId: "t", position: 2 }] })).toEqual(["STRUCTURE_STOP_POINT_OUT_OF_RANGE"]);
    expect(codes({ ...base, stopPoints: [{ circuitId: null, position: 0 }, { circuitId: null, position: 0 }] })).toEqual([
      "STRUCTURE_STOP_POINT_DUPLICATE",
    ]);
  });

  it("n'accepte encore aucun Point d'arrêt hors de l'ancien modèle (règles généralisées : Epic C)", () => {
    expect(
      codes({
        elements: [{ kind: "CYCLE", cycle: { id: "A", repeatCount: 2, circuits: [circuit("c1", [exercise("x")])] } }],
        stopPoints: [{ circuitId: "c1", position: 0 }],
      }),
    ).toEqual(["STRUCTURE_STOP_POINTS_UNSUPPORTED"]);
  });
});
