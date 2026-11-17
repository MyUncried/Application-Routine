import { describe, expect, it } from "@jest/globals";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";

import { projectExecution } from "../projection";
import { exerciseActivity, planOf, Simulation, structuredSession } from "../testing/simulation";

const S = 1000;

/** Recette e1 du 12/11/2026 (Hermann, f : « Au point d'arrêt […] Un chronomètre se déclenche »). */
describe("Point d'arrêt chronométré à l'écran (recette e1 du 12/11/2026)", () => {
  it("chronomètre de l'attente, arrêté pendant une Pause", () => {
    const plan = planOf(
      structuredSession({
        elements: [
          { kind: "EXERCISE", exercise: exerciseActivity("a", durationParameters(10)) },
          { kind: "EXERCISE", exercise: exerciseActivity("b", durationParameters(10)) },
        ],
        stopPoints: [{ id: "p", circuitId: null, position: 1 }],
      }),
    );
    const sim = Simulation.libre(plan);
    sim.send({ type: "START" }, 0);
    sim.at(10);
    expect(projectExecution(plan, sim.state, sim.now).timer).toEqual({ kind: "STOPWATCH", elapsedMs: 0, nominalMs: null });
    sim.at(75);
    expect(projectExecution(plan, sim.state, sim.now).timer).toMatchObject({ kind: "STOPWATCH", elapsedMs: 65 * S });
    sim.send({ type: "PAUSE" }, 75 * S);
    sim.send({ type: "RESUME" }, 100 * S);
    sim.at(110);
    expect(projectExecution(plan, sim.state, sim.now).timer).toMatchObject({ kind: "STOPWATCH", elapsedMs: 75 * S });
  });
});
