import { describe, expect, it } from "@jest/globals";

import { durationParameters, repetitionParameters, variableParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { createSessionSnapshot } from "@/domain/sessions/sessionSnapshot";

import { compileExecutablePlan, launchabilityOf, type LeafSpec } from "../plan";
import { estimatedDuration } from "../projection";
import { exerciseActivity, planOf, structuredSession } from "../testing/simulation";

/**
 * PRE-10.1 — prescription exécutable compilée depuis l'instantané (D.2) et le plan développé (D.1).
 */

const leaves = (items: ReturnType<typeof planOf>["items"]): LeafSpec[] => items.flatMap((item) => (item.type === "LEAF" ? [item.leaf] : []));

describe("PRE-10 prescription exécutable", () => {
  it("R1 : la durée estimée du plan vaut 530 s + compte à rebours, exacte (même règle que les calculs de durée)", () => {
    const plan = planOf(
      structuredSession(
        {
          elements: [
            { kind: "EXERCISE", exercise: exerciseActivity("A", durationParameters(20, 8, 10), { postActivityRecoverySeconds: 60 }) },
            { kind: "EXERCISE", exercise: exerciseActivity("B", durationParameters(20, 8, 10)) },
          ],
          stopPoints: [],
        },
        { initialCountdownSeconds: 10 },
      ),
    );
    expect(estimatedDuration(plan)).toEqual({ kind: "exact", ms: 540_000 });
  });

  it("préconfiguration standard (origine Tabata) lançable ; Format spécialisé non lançable dans PRE-10 (D.3)", () => {
    const tabata = { ...structuredSession({ elements: [{ kind: "EXERCISE", exercise: exerciseActivity("A", durationParameters(20, 8, 10)) }], stopPoints: [] }), origin: "TABATA" as const };
    expect(launchabilityOf(createSessionSnapshot(tabata))).toEqual({ status: "launchable" });
    const emom = structuredSession({
      elements: [{ kind: "EXERCISE", exercise: exerciseActivity("E", repetitionParameters(10, 3, 0), { format: { key: "EMOM", settings: { intervalSeconds: 60 } } }) }],
      stopPoints: [],
    });
    expect(launchabilityOf(createSessionSnapshot(emom))).toEqual({ status: "engine-unavailable", elementIds: ["E"] });
    expect(() => compileExecutablePlan(createSessionSnapshot(emom))).toThrow();
  });

  it("valeurs par série prises telles que transmises par la Composition (aucune recopie de S1, décision du 06/11/2026) ; charge active par série", () => {
    const plan = planOf(
      structuredSession({
        elements: [{ kind: "EXERCISE", exercise: exerciseActivity("V", variableParameters({ mode: "REPETITIONS", rows: [[8, 30, 40], [10, 30, 50], [12, 0, 60]], loadEnabled: true })) }],
        stopPoints: [],
      }),
    );
    const series = leaves(plan.items).filter((leaf) => leaf.kind === "ACTIVITY");
    expect(series.map((leaf) => [leaf.target, leaf.loadKg])).toEqual([
      [{ kind: "NUMBER", value: 8 }, 40],
      [{ kind: "NUMBER", value: 10 }, 50],
      [{ kind: "NUMBER", value: 12 }, 60],
    ]);
    // Pause de 0 s de la dernière série : aucune phase.
    expect(leaves(plan.items).filter((leaf) => leaf.kind === "SERIES_PAUSE")).toHaveLength(2);
  });

  it("bilatéral en alternance par série : côté 1, Pause entre les côtés, côté 2, Pause de série ; Réinitialiser ne vise que la Série-côté", () => {
    const plan = planOf(
      structuredSession({
        elements: [{ kind: "EXERCISE", exercise: exerciseActivity("b", repetitionParameters(10, 2, 20, { sideMode: "LEFT_RIGHT", sideOrder: "BY_SERIES", sideRecoverySeconds: 5 })) }],
        stopPoints: [],
      }),
    );
    expect(leaves(plan.items).map((leaf) => `${leaf.kind}${leaf.sideRank ?? ""}`)).toEqual([
      "ACTIVITY1",
      "SIDE_RECOVERY",
      "ACTIVITY2",
      "SERIES_PAUSE",
      "ACTIVITY1",
      "SIDE_RECOVERY",
      "ACTIVITY2",
      "SERIES_PAUSE",
      "SESSION_END",
    ]);
    expect(leaves(plan.items).filter((leaf) => leaf.kind === "ACTIVITY").every((leaf) => leaf.resetToKey === leaf.key)).toBe(true);
  });
});
