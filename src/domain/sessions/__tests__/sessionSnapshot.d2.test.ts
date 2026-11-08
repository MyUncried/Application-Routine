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

const EMOM: ElementFormat = { key: "EMOM", settings: { intervalSeconds: 60 } };
// Réalignement du 02/11/2026 : Tabata est une préconfiguration standard ; ses Exercices ne portent aucun Format.
const CARRIER: ElementFormat = { key: "FOR_TIME", settings: { restBetweenRoundsSeconds: 0 } };
const MEMBER: ElementFormat = { key: "FOR_TIME", settings: {} };

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
            { kind: "CIRCUIT", circuit: { id: "t", repeatCount: 8, nature: "SERIES", exercises: [activity("A"), activity("B")] } },
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
    expect(exercises.map((item) => item.format)).toEqual([null, null, { ...EMOM, ruleVersion: FORMAT_RULES_VERSION }, null]);
    expect(exercises[0]!.exercise).toMatchObject({ snapshotVersion: 3, sourceMovementId: "mv-A", name: "Mouvement A", categoryId: "cardio", bodyZoneIds: ["dos"] });
    expect(exercises[2]!.exercise?.recoverySeconds).toBe(30);
    expect(snapshot.structure.stopPoints).toEqual([{ id: "p", circuitId: null, position: 1 }]);
  });

  it("gelé et indépendant : modifier la Séance source après coup ne change pas l'instantané (FMT-06)", () => {
    const source = session();
    const snapshot = createSessionSnapshot(source);
    const before = JSON.stringify(snapshot);
    // Réalignement du 02/11/2026 : l'Exercice formaté de la fixture est l'EMOM « E » (Tabata n'est plus un Format).
    const emom = structureExercises(source.structure).find((item) => item.id === "E")!;
    (emom.format!.settings as Record<string, unknown>).intervalSeconds = 90;
    (emom.format!.settings as Record<string, unknown>).extra = 1;
    (emom.bodyZoneIds as string[]).push("jambes");
    (source as { name: string }).name = "Renommée";
    expect(JSON.stringify(snapshot)).toBe(before);
    const frozen = structureExercises(snapshot.structure).find((item) => item.id === "E")!;
    // Valeurs littérales : la fixture partage l'objet `EMOM`, modifié ci-dessus.
    expect(frozen.format).toEqual({ key: "EMOM", settings: { intervalSeconds: 60 }, ruleVersion: FORMAT_RULES_VERSION });
    expect(frozen.exercise?.bodyZoneIds).toEqual(["dos"]);
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

  it("réalignement du 02/11/2026 : le Format d'origine d'un Circuit porteur entre dans l'instantané avec sa version de règle ; ses membres gardent leurs réglages", () => {
    const source = session();
    const cycle = source.structure.elements[0]!;
    if (cycle.kind !== "CYCLE") throw new Error("fixture");
    const member = cycle.cycle.members[0]!;
    if (member.kind !== "CIRCUIT") throw new Error("fixture");
    const carried = { ...member.circuit, format: CARRIER, exercises: member.circuit.exercises.map((item) => ({ ...item, format: MEMBER })) };
    const withCarrier = { ...source, structure: { ...source.structure, elements: [{ ...cycle, cycle: { ...cycle.cycle, members: [{ kind: "CIRCUIT" as const, circuit: carried }] } }, ...source.structure.elements.slice(1)] } };
    const snapshot = createSessionSnapshot(withCarrier);
    expect(structureCircuits(snapshot.structure)[0]!.format).toEqual({ ...CARRIER, ruleVersion: FORMAT_RULES_VERSION });
    expect(structureExercises(snapshot.structure).slice(0, 2).map((item) => item.format)).toEqual([
      { ...MEMBER, ruleVersion: FORMAT_RULES_VERSION },
      { ...MEMBER, ruleVersion: FORMAT_RULES_VERSION },
    ]);
    // Le plan se développe depuis l'instantané, étapes rattachées au Circuit porteur.
    const plan = expandStructure({ structure: snapshot.structure });
    const inCircuit = plan.filter((step) => step.kind === "SERIES" && step.context.circuit !== null);
    expect(inCircuit).toHaveLength(32);
    expect(inCircuit.every((step) => step.kind === "SERIES" && step.context.formattedElementId === "t")).toBe(true);
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
