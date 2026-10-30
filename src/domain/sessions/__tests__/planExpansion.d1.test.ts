import { describe, expect, it } from "@jest/globals";

import { durationParameters, variableParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { ElementFormat } from "@/domain/sessions/formats";
import { expandStructure, type PlanExercise, type PlanStep } from "@/domain/sessions/planExpansion";
import type { SessionStructure, StructureCircuit, StructureElement, StructureStopPoint } from "@/domain/sessions/structure";

/**
 * PRE-9 (story D.1, D-451, RM-252, ARB-02a, ARB-10b, ARB-25) — développement du plan fini sur toute
 * la structure. Tableaux attendus écrits à la main depuis les règles (COMP §1-§3, ch10).
 */

const exercise = (id: string, parameters = durationParameters(30), extra: Partial<PlanExercise> = {}): PlanExercise => ({
  id,
  type: "EXERCISE",
  executionParameters: parameters,
  postActivityRecoverySeconds: null,
  ...extra,
});

/** Circuit : organisation et nombre de tours seulement ; aucun Format (correction C.1 du 30/10, D-02). */
const circuit = (id: string, exercises: readonly PlanExercise[], repeatCount = 1, nature: "TOURS" | "SERIES" = "TOURS"): StructureCircuit<PlanExercise> => ({
  id,
  repeatCount,
  nature,
  exercises,
});

const structure = (elements: readonly StructureElement<PlanExercise>[], stopPoints: readonly StructureStopPoint[] = []): SessionStructure<PlanExercise> => ({
  elements,
  stopPoints,
});

/** Lecture compacte : « E1 », « A2 » (série 2), « A2R » (côté droit), « R:E1 », « P:x », « [AMRAP:c] ». */
function compact(steps: readonly PlanStep[]): string[] {
  return steps.map((step) => {
    switch (step.kind) {
      case "SERIES":
        return `${step.exerciseId}${step.series ?? ""}${step.side === "NONE" ? "" : step.side[0]}`;
      case "RECOVERY":
        return `R:${step.exerciseId}`;
      case "STOP_POINT":
        return `P:${step.stopPointId}`;
      case "PROGRESSIVE_SEGMENT":
        return `[${step.format.key}:${step.elementId}]`;
      case "COUNTDOWN":
        return "CR";
      case "FINAL_PHASE":
        return "FIN";
    }
  });
}

describe("PRE-9 D.1 — développement du plan sur toute la structure", () => {
  it("exemple RM-252 : E0, Cycle × 2 [E1, Circuit × 3 tours [A, B]], E2 — E0 et E2 une fois, E1 deux fois, le Circuit six passages", () => {
    const plan = expandStructure({
      structure: structure([
        { kind: "EXERCISE", exercise: exercise("E0") },
        { kind: "CYCLE", cycle: { id: "y", repeatCount: 2, members: [{ kind: "EXERCISE", exercise: exercise("E1") }, { kind: "CIRCUIT", circuit: circuit("c", [exercise("A"), exercise("B")], 3) }] } },
        { kind: "EXERCISE", exercise: exercise("E2") },
      ]),
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
    });
    const once = ["E11", "A1", "B1", "A1", "B1", "A1", "B1"];
    expect(compact(plan)).toEqual(["CR", "E01", ...once, ...once, "E21", "FIN"]);
    // Contexte (RM-083) : répétition du Cycle et tour du Circuit.
    const lastA = plan.filter((step) => step.kind === "SERIES" && step.exerciseId === "A").at(-1)!;
    expect(lastA.kind === "SERIES" && lastA.context).toEqual({ cycle: { id: "y", repetition: 2, count: 2 }, circuit: { id: "c", tour: 3, count: 3 }, formattedElementId: null });
    // Identités stables et uniques.
    expect(new Set(plan.map((step) => step.stepId)).size).toBe(plan.length);
    expect(expandStructure({ structure: structure([{ kind: "EXERCISE", exercise: exercise("E0") }]) }).map((step) => step.stepId)).toEqual(["session/ex:E0/s1/NONE"]);
  });

  it("séries groupées / alternées, A et B à 3 séries, N = 3 : 18 / 6 occurrences (COMP §9)", () => {
    const three = (id: string) => exercise(id, durationParameters(30, 3));
    const grouped = expandStructure({ structure: structure([{ kind: "CIRCUIT", circuit: circuit("c", [three("A"), three("B")], 3, "TOURS") }]) });
    expect(compact(grouped)).toEqual(Array.from({ length: 3 }, () => ["A1", "A2", "A3", "B1", "B2", "B3"]).flat());
    const alternated = expandStructure({ structure: structure([{ kind: "CIRCUIT", circuit: circuit("c", [three("A"), three("B")], 3, "SERIES") }]) });
    expect(compact(alternated)).toEqual(["A1", "B1", "A2", "B2", "A3", "B3"]);
  });

  it("alternées, A = [10, 0, 14], B = [8, 9, 10] : A1 B1 B2 A3 B3 ; la série nulle est sautée (COMP §9)", () => {
    const a = exercise("A", variableParameters({ mode: "REPETITIONS", rows: [[10, 0], [0, 0], [14, 0]] }));
    const b = exercise("B", variableParameters({ mode: "REPETITIONS", rows: [[8, 0], [9, 0], [10, 0]] }));
    expect(compact(expandStructure({ structure: structure([{ kind: "CIRCUIT", circuit: circuit("c", [a, b], 3, "SERIES") }]) }))).toEqual(["A1", "B1", "B2", "A3", "B3"]);
  });

  it("occurrence entièrement sautée : sa récupération n'est pas exécutée, une pause indépendante (Point) reste (ARB-10b)", () => {
    const skipped = exercise("Z", variableParameters({ mode: "REPETITIONS", rows: [[0, 0], [8, 0]] }), { postActivityRecoverySeconds: 60 });
    const kept = exercise("K", durationParameters(30), { postActivityRecoverySeconds: 45 });
    const plan = expandStructure({
      structure: structure(
        [{ kind: "CIRCUIT", circuit: circuit("c", [skipped, kept], 2, "SERIES") }, { kind: "EXERCISE", exercise: exercise("E") }],
        [{ id: "p", circuitId: null, position: 1 }],
      ),
    });
    // Tour 1 : Z ne joue que sa série 1, nulle — ni série ni récupération ; K joue sa série 1. Tour 2 : Z2, K n'a qu'une série.
    expect(compact(plan)).toEqual(["K1", "R:K", "Z2", "R:Z", "P:p", "E1"]);
  });

  it("côtés : l'ordre du registre de l'Exercice (un côté après l'autre, ou alternance par série)", () => {
    const bySide = exercise("A", durationParameters(30, 2, 0, { sideMode: "RIGHT_LEFT", sideOrder: "BY_SIDE" }));
    const alternating = exercise("B", durationParameters(30, 2, 0, { sideMode: "LEFT_RIGHT", sideOrder: "BY_SERIES" }));
    expect(compact(expandStructure({ structure: structure([{ kind: "EXERCISE", exercise: bySide }, { kind: "EXERCISE", exercise: alternating }]) }))).toEqual([
      "A1R",
      "A2R",
      "A1L",
      "A2L",
      "B1L",
      "B1R",
      "B2L",
      "B2R",
    ]);
  });

  it("Point interne à un Cycle rencontré à chaque répétition (ARB-02a) ; Point de fin de Séance et Points consécutifs omis (RM-219, RM-251)", () => {
    const plan = expandStructure({
      structure: structure(
        [
          { kind: "CYCLE", cycle: { id: "y", repeatCount: 3, members: [{ kind: "EXERCISE", exercise: exercise("A") }, { kind: "EXERCISE", exercise: exercise("B") }] } },
          { kind: "EXERCISE", exercise: exercise("C") },
        ],
        [
          { id: "in", circuitId: null, cycleId: "y", position: 1 },
          { id: "after-cycle", circuitId: null, position: 1 },
          { id: "end", circuitId: null, position: 2 },
        ],
      ),
    });
    expect(compact(plan)).toEqual(["A1", "P:in", "B1", "A1", "P:in", "B1", "A1", "P:in", "B1", "P:after-cycle", "C1"]);
    // Point de début de répétition et de fin de répétition : un seul arrêt entre deux répétitions (D-442 appliqué au Cycle).
    const boundaries = expandStructure({
      structure: structure(
        [{ kind: "EXERCISE", exercise: exercise("E") }, { kind: "CYCLE", cycle: { id: "y", repeatCount: 2, members: [{ kind: "EXERCISE", exercise: exercise("A") }] } }, { kind: "EXERCISE", exercise: exercise("F") }],
        [
          { id: "start", circuitId: null, cycleId: "y", position: 0 },
          { id: "end", circuitId: null, cycleId: "y", position: 1 },
        ],
      ),
    });
    expect(compact(boundaries)).toEqual(["E1", "P:start", "A1", "P:end", "A1", "P:end", "F1"]);
  });

  it("Tabata A, B dans un Cycle × 2 : 16 séries par Exercice en groupées comme en alternées, 960 s (ARB-25)", () => {
    const tabata: ElementFormat = { key: "TABATA", settings: {} };
    const eight = (id: string) => exercise(id, durationParameters(20, 8, 10), { format: tabata });
    const inCycle = (nature: "TOURS" | "SERIES") =>
      expandStructure({
        structure: structure([
          { kind: "CYCLE", cycle: { id: "y", repeatCount: 2, members: [{ kind: "CIRCUIT", circuit: circuit("t", [eight("A"), eight("B")], nature === "TOURS" ? 1 : 8, nature) }] } },
        ]),
      });
    const grouped = inCycle("TOURS");
    const alternated = inCycle("SERIES");
    const perRepetitionGrouped = [...Array.from({ length: 8 }, (_, i) => `A${i + 1}`), ...Array.from({ length: 8 }, (_, i) => `B${i + 1}`)];
    expect(compact(grouped)).toEqual([...perRepetitionGrouped, ...perRepetitionGrouped]);
    const perRepetitionAlternated = Array.from({ length: 8 }, (_, i) => [`A${i + 1}`, `B${i + 1}`]).flat();
    expect(compact(alternated)).toEqual([...perRepetitionAlternated, ...perRepetitionAlternated]);
    for (const plan of [grouped, alternated]) {
      const series = plan.filter((step) => step.kind === "SERIES");
      expect(series.filter((step) => step.kind === "SERIES" && step.exerciseId === "A")).toHaveLength(16);
      expect(series.filter((step) => step.kind === "SERIES" && step.exerciseId === "B")).toHaveLength(16);
      // 32 séries × (20 s de travail + 10 s de pause) = 960 s.
      expect(series.length * (20 + 10)).toBe(960);
      // Chaque étape est rattachée à l'Exercice qui porte le Format, jamais au Circuit (D-02).
      expect(series.every((step) => step.kind === "SERIES" && step.context.formattedElementId === step.exerciseId)).toBe(true);
    }
  });

  it("Exercice AMRAP ou Death by direct : un segment progressif par répétition de son Cycle, aucune occurrence générée", () => {
    const amrap: ElementFormat = { key: "AMRAP", settings: { durationSeconds: 600 } };
    const deathBy: ElementFormat = { key: "DEATH_BY", settings: {} };
    const plan = expandStructure({
      structure: structure([
        { kind: "CYCLE", cycle: { id: "y", repeatCount: 2, members: [{ kind: "EXERCISE", exercise: exercise("A", durationParameters(30), { format: amrap }) }] } },
        { kind: "EXERCISE", exercise: exercise("D", durationParameters(30), { format: deathBy }) },
        { kind: "EXERCISE", exercise: exercise("E") },
      ]),
    });
    expect(compact(plan)).toEqual(["[AMRAP:A]", "[AMRAP:A]", "[DEATH_BY:D]", "E1"]);
    const [first] = plan;
    expect(first!.kind === "PROGRESSIVE_SEGMENT" && first!.context.cycle).toEqual({ id: "y", repetition: 1, count: 2 });
    expect(plan.every((step) => step.kind !== "PROGRESSIVE_SEGMENT" || (step.elementKind === "EXERCISE" && step.openQuestion === undefined))).toBe(true);
  });

  describe("Exercices formatés membres d'un Circuit (correction C.1 du 30/10)", () => {
    const TABATA: ElementFormat = { key: "TABATA", settings: {} };
    const AMRAP: ElementFormat = { key: "AMRAP", settings: { durationSeconds: 720 } };
    const DEATH_BY: ElementFormat = { key: "DEATH_BY", settings: { startRepetitions: 1, incrementRepetitions: 1, windowSeconds: 60 } };
    const tabata = (id: string) => exercise(id, durationParameters(20, 8, 10), { format: TABATA });
    const eightOf = (id: string) => Array.from({ length: 8 }, (_, i) => `${id}${i + 1}`);

    it("groupé × 3 (D-08, D-15, D-30) : à chaque passage, bloc AMRAP complet (durée configurée entière) puis bloc Tabata complet ; Exercice libre sans Format", () => {
      const plan = expandStructure({
        structure: structure([
          { kind: "CIRCUIT", circuit: circuit("c", [exercise("A", durationParameters(30), { format: AMRAP }), tabata("T"), exercise("L")], 3, "TOURS") },
        ]),
      });
      const perTour = ["[AMRAP:A]", ...eightOf("T"), "L1"];
      expect(compact(plan)).toEqual([...perTour, ...perTour, ...perTour]);
      const segments = plan.filter((step) => step.kind === "PROGRESSIVE_SEGMENT");
      expect(segments).toHaveLength(3);
      segments.forEach((step, index) => {
        if (step.kind !== "PROGRESSIVE_SEGMENT") throw new Error("segment");
        // Durée configurée complète à chaque passage, aucune limite commune ; aucune question ouverte (décidé).
        expect(step.format).toEqual(AMRAP);
        expect(step.context).toEqual({ cycle: null, circuit: { id: "c", tour: index + 1, count: 3 }, formattedElementId: "A" });
        expect(step.openQuestion).toBeUndefined();
      });
      expect(new Set(segments.map((step) => step.stepId)).size).toBe(3);
      // Aucune transmission : l'Exercice libre reste libre, le Tabata est rattaché à lui-même.
      const ctx = (id: string) => plan.flatMap((step) => (step.kind === "SERIES" && step.exerciseId === id ? [step.context.formattedElementId] : []));
      expect(new Set(ctx("L"))).toEqual(new Set([null]));
      expect(new Set(ctx("T"))).toEqual(new Set(["T"]));
    });

    it("Death by groupé × 2 : un segment par passage ; le rang de reprise n'est pas encodé (À CLARIFIER)", () => {
      const plan = expandStructure({
        structure: structure([{ kind: "CIRCUIT", circuit: circuit("c", [exercise("D", durationParameters(30), { format: DEATH_BY }), exercise("L")], 2, "TOURS") }]),
      });
      expect(compact(plan)).toEqual(["[DEATH_BY:D]", "L1", "[DEATH_BY:D]", "L1"]);
      for (const step of plan.filter((item) => item.kind === "PROGRESSIVE_SEGMENT")) {
        expect(step.kind === "PROGRESSIVE_SEGMENT" && step.format).toEqual(DEATH_BY);
        expect(step.kind === "PROGRESSIVE_SEGMENT" && step.openQuestion).toMatch(/rang de reprise/);
      }
    });

    it("Tabata alterné A/B, N = 8 : séries entrelacées A1 B1 … A8 B8 — distinct de deux Tabata successifs (groupé ou Exercices directs)", () => {
      const alternated = expandStructure({ structure: structure([{ kind: "CIRCUIT", circuit: circuit("c", [tabata("A"), tabata("B")], 8, "SERIES") }]) });
      expect(compact(alternated)).toEqual(Array.from({ length: 8 }, (_, i) => [`A${i + 1}`, `B${i + 1}`]).flat());
      const groupedOnce = expandStructure({ structure: structure([{ kind: "CIRCUIT", circuit: circuit("c", [tabata("A"), tabata("B")], 1, "TOURS") }]) });
      const direct = expandStructure({ structure: structure([{ kind: "EXERCISE", exercise: tabata("A") }, { kind: "EXERCISE", exercise: tabata("B") }]) });
      expect(compact(groupedOnce)).toEqual([...eightOf("A"), ...eightOf("B")]);
      expect(compact(direct)).toEqual(compact(groupedOnce));
      expect(compact(alternated)).not.toEqual(compact(groupedOnce));
    });

    it("Death by alterné (D-16, D-29) : un segment par membre et par tour, rattaché à son Exercice ; raccordement des fenêtres et rangs laissé à PRE-10/11", () => {
      const plan = expandStructure({
        structure: structure([
          { kind: "CIRCUIT", circuit: circuit("c", [exercise("D", durationParameters(30), { format: DEATH_BY }), exercise("E", durationParameters(30), { format: DEATH_BY })], 2, "SERIES") },
        ]),
      });
      expect(compact(plan)).toEqual(["[DEATH_BY:D]", "[DEATH_BY:E]", "[DEATH_BY:D]", "[DEATH_BY:E]"]);
      for (const step of plan) {
        if (step.kind !== "PROGRESSIVE_SEGMENT") throw new Error("segment");
        expect(step.context.formattedElementId).toBe(step.elementId);
        expect(step.openQuestion).toMatch(/PRE-10\/11/);
      }
    });

    it("For time membre d'un Circuit groupé : séries ordinaires rattachées à l'Exercice ; l'échelle n'est pas lue (rattachement aux passages À CLARIFIER)", () => {
      const forTime: ElementFormat = { key: "FOR_TIME", settings: { volumePerRound: [21, 15, 9] } };
      const plan = expandStructure({
        structure: structure([{ kind: "CIRCUIT", circuit: circuit("c", [exercise("F", durationParameters(30, 2), { format: forTime }), exercise("L")], 2, "TOURS") }]),
      });
      expect(compact(plan)).toEqual(["F1", "F2", "L1", "F1", "F2", "L1"]);
    });
  });

  it("le plan ne modifie pas la structure", () => {
    const input = structure([{ kind: "CIRCUIT", circuit: circuit("c", [exercise("A")], 2) }], [{ id: "p", circuitId: "c", position: 0 }]);
    const copy = JSON.parse(JSON.stringify(input));
    expandStructure({ structure: input });
    expect(input).toEqual(copy);
  });
});
