import { describe, expect, it } from "@jest/globals";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { ActivityDurationFacts } from "@/domain/sessions/calculations";
import type { Activity, Session } from "@/domain/sessions/Session";
import { DEFAULT_SESSION_COLOR } from "@/domain/sessions/Session";
import { createEmptyDraft, createExerciseDraft, toSessionDraft, toStructuredSessionInput, type SessionDraft } from "@/domain/sessions/SessionDraft";
import type { StructuredSession } from "@/domain/sessions/SessionRepository";
import { toDuplicateSessionDraft } from "@/domain/sessions/sessionDuplication";
import {
  computeStructureDuration,
  countStructureExercises,
  legacyFromStructure,
  mapStructure,
  structureCircuits,
  structureExercises,
  validateStructureShape,
  type SessionStructure,
  type StructureStopPointLocation,
} from "@/domain/sessions/structure";
import { withLocalMovements } from "@/domain/sessions/testing/draftMovements";

/**
 * PRE-9 (story A.1, D-451) — domaine pur : Cycle composé d'Exercices directs et de Circuits, Point
 * d'arrêt dans un Cycle, brouillon porteur de la disposition générale (`SessionDraft.structure`)
 * et entrée d'écriture structurée (`toStructuredSessionInput`), duplication d'une structure riche.
 */

type Facts = ActivityDurationFacts & { readonly id: string };
const exercise = (id: string, seconds = 30): Facts => ({ id, type: "EXERCISE", executionParameters: durationParameters(seconds), postActivityRecoverySeconds: 0 });
const circuit = (id: string, exercises: readonly Facts[], repeatCount = 1) => ({ id, repeatCount, nature: "TOURS" as const, exercises });
const idOf = (item: { readonly id: string }) => item.id;

/** [w, Cycle A × 3 (a, Circuit c1 × 2 (x, y), b), z] */
const withDirectMembers = (stopPoints: readonly StructureStopPointLocation[] = []): SessionStructure<Facts, StructureStopPointLocation> => ({
  elements: [
    { kind: "EXERCISE", exercise: exercise("w") },
    {
      kind: "CYCLE",
      cycle: {
        id: "A",
        repeatCount: 3,
        members: [
          { kind: "EXERCISE", exercise: exercise("a") },
          { kind: "CIRCUIT", circuit: circuit("c1", [exercise("x"), exercise("y")], 2) },
          { kind: "EXERCISE", exercise: exercise("b", 45) },
        ],
      },
    },
    { kind: "EXERCISE", exercise: exercise("z", 60) },
  ],
  stopPoints,
});

describe("PRE-9 A.1 — Cycle d'Exercices directs et de Circuits (D-451)", () => {
  it("parcourt les Exercices dans l'ordre d'affichage, chacun une fois ; les Circuits du Cycle sont trouvés", () => {
    const structure = withDirectMembers();
    expect(structureExercises(structure).map(idOf)).toEqual(["w", "a", "x", "y", "b", "z"]);
    expect(countStructureExercises(structure)).toBe(6);
    expect(structureCircuits(structure).map(idOf)).toEqual(["c1"]);
  });

  it("durée : un Exercice direct est exécuté une fois par répétition du Cycle (RM-252)", () => {
    expect(computeStructureDuration(withDirectMembers())).toMatchObject({ kind: "exact", seconds: 30 + 3 * (30 + 2 * (30 + 30) + 45) + 60 });
  });

  it("un Cycle formé d'un seul Exercice direct est valide ; vide, il est refusé", () => {
    const single: SessionStructure<Facts, StructureStopPointLocation> = {
      elements: [{ kind: "CYCLE", cycle: { id: "A", repeatCount: 2, members: [{ kind: "EXERCISE", exercise: exercise("a") }] } }],
      stopPoints: [],
    };
    expect(validateStructureShape(single, idOf)).toEqual([]);
    expect(
      validateStructureShape({ elements: [{ kind: "CYCLE", cycle: { id: "A", repeatCount: 2, members: [] } }], stopPoints: [] }, idOf).map((v) => v.code),
    ).toEqual(["STRUCTURE_EMPTY_CYCLE"]);
  });

  it("identité unique : un Exercice direct de Cycle compte parmi les identités", () => {
    const duplicated: SessionStructure<Facts, StructureStopPointLocation> = {
      elements: [
        { kind: "EXERCISE", exercise: exercise("a") },
        { kind: "CYCLE", cycle: { id: "A", repeatCount: 1, members: [{ kind: "EXERCISE", exercise: exercise("a") }] } },
      ],
      stopPoints: [],
    };
    expect(validateStructureShape(duplicated, idOf).map((v) => v.code)).toEqual(["STRUCTURE_DUPLICATE_ID"]);
  });

  // [A.1 : « … ; refusé jusqu'à B.6 » (`STRUCTURE_STOP_POINTS_UNSUPPORTED`) — garde retirée le 31/10/2026 par B.6.]
  it("Point d'arrêt dans un Cycle : conteneur connu et rang borné par ses membres ; jamais deux conteneurs", () => {
    const codes = (points: readonly StructureStopPointLocation[]) => validateStructureShape(withDirectMembers(points), idOf).map((v) => v.code).sort();
    // Emplacement de forme valide : accepté (B.6, ARB-02a/b) ; RM-219 se juge à l'écriture.
    expect(codes([{ circuitId: null, cycleId: "A", position: 3 }])).toEqual([]);
    expect(codes([{ circuitId: null, cycleId: "A", position: 4 }])).toEqual(["STRUCTURE_STOP_POINT_OUT_OF_RANGE"]);
    expect(codes([{ circuitId: null, cycleId: "inconnu", position: 0 }])).toEqual(["STRUCTURE_STOP_POINT_UNKNOWN_CIRCUIT"]);
    expect(codes([{ circuitId: "c1", cycleId: "A", position: 0 }])).toEqual(["STRUCTURE_STOP_POINT_UNKNOWN_CIRCUIT"]);
    expect(codes([{ circuitId: null, cycleId: "A", position: 1 }, { circuitId: null, cycleId: "A", position: 1 }])).toContain("STRUCTURE_STOP_POINT_DUPLICATE");
  });

  it("une structure portant un Point de Cycle n'est jamais représentable dans l'ancien modèle", () => {
    const single = {
      elements: [{ kind: "CIRCUIT" as const, circuit: circuit("c", [exercise("x")]) }],
      stopPoints: [{ circuitId: null, cycleId: "A", position: 0 }],
    };
    expect(legacyFromStructure(single)).toBeNull();
  });

  it("mapStructure transforme chaque Exercice sans toucher identités, ordre, comptes ni Points", () => {
    const points = [{ circuitId: null, cycleId: "A", position: 1 }];
    const mapped = mapStructure(withDirectMembers(points), idOf);
    expect(mapped.elements[1]).toEqual({
      kind: "CYCLE",
      cycle: { id: "A", repeatCount: 3, members: [{ kind: "EXERCISE", exercise: "a" }, { kind: "CIRCUIT", circuit: { id: "c1", repeatCount: 2, nature: "TOURS", exercises: ["x", "y"] } }, { kind: "EXERCISE", exercise: "b" }] },
    });
    expect(mapped.stopPoints).toBe(points);
  });
});

// ---------------------------------------------------------------------------
// Brouillon et entrée structurée
// ---------------------------------------------------------------------------

const activity = (id: string, structuralPosition: Activity["structuralPosition"] = "BEFORE_TOUR"): Activity => ({
  id,
  type: "EXERCISE",
  structuralPosition,
  position: 0,
  name: id,
  executionParameters: durationParameters(30),
  postActivityRecoverySeconds: null,
  instruction: null,
  bodyZoneIds: [],
  sourceMovementId: `mv-${id}`,
});

const HEADER = {
  id: "s1",
  ownerId: "u",
  name: "Séance",
  color: DEFAULT_SESSION_COLOR,
  labelId: null,
  status: "ACTIVE" as const,
  initialCountdownSeconds: 10,
  finalPhaseSeconds: 5,
  createdAt: "t",
  updatedAt: "t",
};

/** Séance relue : [w, Cycle A × 3 (a, Circuit c1 (x), b), z]. */
const richSession = (): StructuredSession => ({
  ...HEADER,
  structure: {
    elements: [
      { kind: "EXERCISE", exercise: activity("w") },
      {
        kind: "CYCLE",
        cycle: {
          id: "A",
          repeatCount: 3,
          members: [
            { kind: "EXERCISE", exercise: activity("a") },
            { kind: "CIRCUIT", circuit: { id: "c1", repeatCount: 2, nature: "SERIES", exercises: [activity("x", "IN_TOUR")] } },
            { kind: "EXERCISE", exercise: activity("b") },
          ],
        },
      },
      { kind: "EXERCISE", exercise: activity("z") },
    ],
    stopPoints: [],
  },
});

const noNewId = () => {
  throw new Error("aucun conteneur ne doit être créé");
};

describe("PRE-9 A.1 — brouillon porteur de la disposition générale", () => {
  it("toSessionDraft : une Séance riche garde sa disposition ; la Composition actuelle en reçoit la liste des Exercices", () => {
    const draft = toSessionDraft(richSession());
    expect(draft.exercises.map((item) => item.id)).toEqual(["w", "a", "x", "b", "z"]);
    expect(draft.persistedExerciseIds).toEqual(["w", "a", "x", "b", "z"]);
    expect(draft.structure).toEqual(mapStructure(richSession().structure, (item) => item.id));
    expect(draft.stopPoints).toBeUndefined();
  });

  it("toStructuredSessionInput : la disposition riche fait foi, le contenu vient du brouillon ; retrait et ajout appliqués", () => {
    const draft = withLocalMovements(toSessionDraft(richSession()));
    const edited: SessionDraft = {
      ...draft,
      exercises: [
        ...draft.exercises.filter((item) => item.id !== "b").map((item) => (item.id === "x" ? { ...item, executionParameters: durationParameters(40) } : item)),
        { ...createExerciseDraft("new"), name: "Nouveau", sourceMovementId: "mv-new" },
      ],
    };
    const result = toStructuredSessionInput(edited, noNewId);
    if (!result.ok) throw new Error(JSON.stringify(result.violations));
    const ids = mapStructure(result.value.structure, (item) => item.id);
    expect(ids.elements).toEqual([
      { kind: "EXERCISE", exercise: "w" },
      { kind: "CYCLE", cycle: { id: "A", repeatCount: 3, members: [{ kind: "EXERCISE", exercise: "a" }, { kind: "CIRCUIT", circuit: { id: "c1", repeatCount: 2, nature: "SERIES", exercises: ["x"] } }] } },
      { kind: "EXERCISE", exercise: "z" },
      { kind: "EXERCISE", exercise: "new" },
    ]);
    expect(structureExercises(result.value.structure).find((item) => item.id === "x")?.executionParameters).toEqual(durationParameters(40));
  });

  it("toStructuredSessionInput : ancien modèle relu, le Circuit garde son identité et sa nature ; brouillon neuf sans Circuit (PRE-9 B.2, D-451)", () => {
    const legacy: Session = {
      ...HEADER,
      cycle: { id: "s1", position: 1, repeatCount: 1, beforeTour: [activity("w")], tour: { id: "tour-1", position: 1, repeatCount: 2, nature: "SERIES", exercises: [activity("x", "IN_TOUR")] } },
    };
    const draft = withLocalMovements(toSessionDraft(legacy));
    const reopened = toStructuredSessionInput({ ...draft, circuitNature: undefined }, noNewId);
    if (!reopened.ok) throw new Error(JSON.stringify(reopened.violations));
    expect(reopened.value.structure.elements[1]).toEqual({
      kind: "CIRCUIT",
      circuit: expect.objectContaining({ id: "tour-1", repeatCount: 2, nature: "SERIES" }),
    });

    const fresh = withLocalMovements({ ...createEmptyDraft(), name: "Neuve", exercises: [{ ...createExerciseDraft("e1"), name: "E1" }] });
    const created = toStructuredSessionInput(fresh, () => "circuit-new");
    if (!created.ok) throw new Error(JSON.stringify(created.violations));
    expect(mapStructure(created.value.structure, (item) => item.id).elements).toEqual([
      // PRE-9 (B.2, D-451, COMP §1) : une Séance commence sans Circuit ; aucun conteneur vide n'est écrit.
      { kind: "EXERCISE", exercise: "e1" },
    ]);
  });

  it("duplication d'une Séance riche : même forme, identités d'Exercice, de Circuit et de Cycle nouvelles", () => {
    let next = 0;
    const copy = toDuplicateSessionDraft(richSession(), () => `n${++next}`, ["Séance"]);
    expect(copy.sourceSessionId).toBeNull();
    expect(copy.name).toBe("Séance (copie)");
    expect(copy.exercises.map((item) => item.id)).toEqual(["n1", "n2", "n3", "n4", "n5"]);
    expect(copy.structure?.elements).toEqual([
      { kind: "EXERCISE", exercise: "n1" },
      { kind: "CYCLE", cycle: { id: "n6", repeatCount: 3, members: [{ kind: "EXERCISE", exercise: "n2" }, { kind: "CIRCUIT", circuit: { id: "n7", repeatCount: 2, nature: "SERIES", exercises: ["n3"] } }, { kind: "EXERCISE", exercise: "n4" }] } },
      { kind: "EXERCISE", exercise: "n5" },
    ]);
  });

  // [Remplacé le 10/11/2026 — modèle unique des Circuits : la copie reprend la structure générale, identifiants renouvelés.]
  it("duplication d'une Séance à un Circuit : structure reprise, identifiants renouvelés, compte conservé", () => {
    const legacy: Session = {
      ...HEADER,
      cycle: { id: "s1", position: 1, repeatCount: 1, tour: { id: "tour-1", position: 1, repeatCount: 2, exercises: [activity("x", "IN_TOUR")] } },
    };
    const copy = toDuplicateSessionDraft(legacy, () => "n1", []);
    expect(copy.structure?.elements).toEqual([{ kind: "CIRCUIT", circuit: { id: "n1", repeatCount: 2, nature: "TOURS", exercises: ["n1"] } }]);
  });
});
