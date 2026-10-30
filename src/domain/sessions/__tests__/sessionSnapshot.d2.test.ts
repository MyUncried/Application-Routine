import { describe, expect, it } from "@jest/globals";

import { ExerciseSnapshotDataError } from "@/domain/activities/exerciseSnapshot";
import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { FORMAT_RULES_VERSION, type ElementFormat } from "@/domain/sessions/formats";
import { expandStructure } from "@/domain/sessions/planExpansion";
import type { Activity } from "@/domain/sessions/Session";
import type { StructuredSession } from "@/domain/sessions/SessionRepository";
import { createSessionSnapshot } from "@/domain/sessions/sessionSnapshot";
import { structureCircuits, structureExercises } from "@/domain/sessions/structure";

/**
 * PRE-9 (story D.2, SU-07, ARB-03, FMT-06) — instantané de Séance : copie gelée et indépendante,
 * structure et identités complètes, Format, réglages effectifs et version de règle par élément
 * formaté, plan développable depuis l'instantané.
 */

const EMOM: ElementFormat = { key: "EMOM", settings: { windowSeconds: 60, roundCount: 6 } };
const TABATA: ElementFormat = { key: "TABATA", settings: {} };

const activity = (id: string, extra: Partial<Activity> = {}): Activity => ({
  id,
  type: "EXERCISE",
  structuralPosition: "BEFORE_TOUR",
  position: 0,
  name: `Mouvement ${id}`,
  executionParameters: durationParameters(20, 8, 10),
  postActivityRecoverySeconds: null,
  instruction: null,
  bodyZoneIds: ["dos"],
  sideMode: "UNILATERAL",
  categoryId: "cardio",
  sourceMovementId: `mv-${id}`,
  media: [],
  ...extra,
});

const session = (): StructuredSession => ({
  id: "s1",
  ownerId: "u1",
  name: "Tabata et EMOM",
  color: "#9AA4B2" as StructuredSession["color"],
  labelId: null,
  status: "ACTIVE",
  initialCountdownSeconds: 10,
  finalPhaseSeconds: 5,
  origin: "TABATA",
  createdAt: "2026-10-29T00:00:00.000Z",
  updatedAt: "2026-10-29T00:00:00.000Z",
  structure: {
    elements: [
      {
        kind: "CYCLE",
        cycle: {
          id: "y",
          repeatCount: 2,
          members: [
            // Circuit sans Format ; chaque membre porte son propre Tabata (correction C.1 du 30/10, D-02).
            { kind: "CIRCUIT", circuit: { id: "t", repeatCount: 8, nature: "SERIES", exercises: [activity("A", { format: TABATA }), activity("B", { format: TABATA })] } },
            { kind: "EXERCISE", exercise: activity("E", { format: EMOM, postActivityRecoverySeconds: 30 }) },
          ],
        },
      },
      { kind: "EXERCISE", exercise: activity("L") },
    ],
    stopPoints: [{ id: "p", circuitId: null, position: 1 }],
  },
});

describe("PRE-9 D.2 — instantané de Séance", () => {
  it("copie l'en-tête, la structure et ses identités, le contenu résolu des Mouvements et, par élément formaté, Format, réglages et version de règle", () => {
    const snapshot = createSessionSnapshot(session());
    expect(snapshot).toMatchObject({ snapshotVersion: 1, sessionId: "s1", name: "Tabata et EMOM", origin: "TABATA", initialCountdownSeconds: 10, finalPhaseSeconds: 5 });
    expect(structureCircuits(snapshot.structure)).toEqual([expect.objectContaining({ id: "t", repeatCount: 8, nature: "SERIES" })]);
    expect(structureCircuits(snapshot.structure)[0]).not.toHaveProperty("format");
    const exercises = structureExercises(snapshot.structure);
    expect(exercises.map((item) => item.id)).toEqual(["A", "B", "E", "L"]);
    const frozenTabata = { ...TABATA, ruleVersion: FORMAT_RULES_VERSION };
    expect(exercises.map((item) => item.format)).toEqual([frozenTabata, frozenTabata, { ...EMOM, ruleVersion: FORMAT_RULES_VERSION }, null]);
    expect(exercises[0]!.exercise).toMatchObject({ snapshotVersion: 3, sourceMovementId: "mv-A", name: "Mouvement A", categoryId: "cardio", bodyZoneIds: ["dos"] });
    expect(exercises[2]!.exercise?.recoverySeconds).toBe(30);
    expect(snapshot.structure.stopPoints).toEqual([{ id: "p", circuitId: null, position: 1 }]);
  });

  it("gelé et indépendant : modifier la Séance source après coup ne change pas l'instantané (FMT-06)", () => {
    const source = session();
    const snapshot = createSessionSnapshot(source);
    const before = JSON.stringify(snapshot);
    const cycle = source.structure.elements[0]!;
    if (cycle.kind !== "CYCLE") throw new Error("fixture");
    const tabata = cycle.cycle.members[0]!;
    if (tabata.kind !== "CIRCUIT") throw new Error("fixture");
    (tabata.circuit.exercises[0]!.format!.settings as Record<string, unknown>).extra = 1;
    (tabata.circuit.exercises[0]!.bodyZoneIds as string[]).push("jambes");
    (source as { name: string }).name = "Renommée";
    expect(JSON.stringify(snapshot)).toBe(before);
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.structure.elements)).toBe(true);
    expect(Object.isFrozen(structureExercises(snapshot.structure)[0]!.executionParameters)).toBe(true);
  });

  it("le plan se développe depuis l'instantané (D.1) : Cycle × 2, Tabata alterné 8 séries, EMOM et sa récupération", () => {
    const snapshot = createSessionSnapshot(session());
    const plan = expandStructure({ structure: snapshot.structure, initialCountdownSeconds: snapshot.initialCountdownSeconds, finalPhaseSeconds: snapshot.finalPhaseSeconds });
    const series = plan.filter((step) => step.kind === "SERIES");
    expect(series.filter((step) => step.kind === "SERIES" && step.exerciseId === "A")).toHaveLength(16);
    expect(plan.filter((step) => step.kind === "RECOVERY")).toHaveLength(2);
    expect(plan[0]!.kind).toBe("COUNTDOWN");
    expect(plan.at(-1)!.kind).toBe("FINAL_PHASE");
  });

  it("aucun Format de Circuit n'entre dans l'instantané, même porté par une entrée non typée ; les membres gardent le leur", () => {
    const source = session();
    const cycle = source.structure.elements[0]!;
    if (cycle.kind !== "CYCLE") throw new Error("fixture");
    const member = cycle.cycle.members[0]!;
    if (member.kind !== "CIRCUIT") throw new Error("fixture");
    (member.circuit as { format?: ElementFormat }).format = EMOM;
    const snapshot = createSessionSnapshot(source);
    expect(structureCircuits(snapshot.structure)[0]).not.toHaveProperty("format");
    expect(structureExercises(snapshot.structure).slice(0, 2).map((item) => item.format?.key)).toEqual(["TABATA", "TABATA"]);
  });

  it("Exercice formaté dans un Circuit : le plan se développe depuis l'instantané, rattaché à chaque Exercice", () => {
    const plan = expandStructure({ structure: createSessionSnapshot(session()).structure });
    const inCircuit = plan.filter((step) => step.kind === "SERIES" && step.context.circuit !== null);
    expect(inCircuit).toHaveLength(32);
    expect(inCircuit.every((step) => step.kind === "SERIES" && step.context.formattedElementId === step.exerciseId)).toBe(true);
  });

  it("Exercice incomplet ou sans filiation : instantané refusé (MFN-08), comme l'instantané d'Exercice", () => {
    const incomplete = session();
    const last = incomplete.structure.elements[1]!;
    if (last.kind !== "EXERCISE") throw new Error("fixture");
    (last as { exercise: Activity }).exercise = activity("L", { executionParameters: durationParameters("UNSET") });
    expect(() => createSessionSnapshot(incomplete)).toThrow(ExerciseSnapshotDataError);
    const orphan = session();
    (orphan.structure.elements[1] as { exercise: Activity }).exercise = activity("L", { sourceMovementId: "" });
    expect(() => createSessionSnapshot(orphan)).toThrow(ExerciseSnapshotDataError);
  });
});
