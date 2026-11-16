import { describe, expect, it } from "@jest/globals";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";

import { projectExecution } from "../projection";
import { exerciseActivity, planOf, Simulation, structuredSession } from "../testing/simulation";

/**
 * Recette du 14/11/2026 (Hermann : « Barre de progression : elle ne doit pas intégrer le compte à rebours ni la fin de séance »).
 * [Plan complet, Compte à rebours initial et Fin de séance compris (ch10) — remplacé.]
 */
describe("Barre de progression sans Compte à rebours ni Fin de séance (recette du 14/11/2026)", () => {
  it("0 pendant le Compte à rebours ; moitié de l'exercice = 50 % ; pleine dès la Fin de séance ; 100 % à la clôture", () => {
    const plan = planOf(
      structuredSession({ elements: [{ kind: "EXERCISE", exercise: exerciseActivity("a", durationParameters(30)) }], stopPoints: [] }, { initialCountdownSeconds: 10, finalPhaseSeconds: 10 }),
    );
    const sim = Simulation.libre(plan);
    sim.send({ type: "START" }, 0);
    const progress = () => projectExecution(plan, sim.state, sim.now).progress;
    sim.at(5);
    expect(progress()).toBe(0);
    sim.at(10);
    expect(progress()).toBe(0);
    sim.at(25);
    expect(progress()).toBeCloseTo(0.5, 5);
    sim.at(41);
    expect(projectExecution(plan, sim.state, sim.now).phase).toBe("SESSION_END");
    expect(progress()).toBeGreaterThanOrEqual(0.999);
    sim.at(60);
    expect(progress()).toBe(1);
  });
});
