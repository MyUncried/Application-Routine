import { describe, expect, it } from "@jest/globals";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";

import { projectExecution } from "../projection";
import { exerciseActivity, planOf, Simulation, structuredSession } from "../testing/simulation";

/**
 * Essai du 10/11/2026 (besoin de Hermann) : liste des exercices pendant l'Exécution — exercice en cours en
 * gras, exercice passé en gris pendant la récupération qui le suit, puis effacé au départ du suivant.
 */

function session() {
  return structuredSession(
    {
      elements: [
        { kind: "EXERCISE", exercise: exerciseActivity("A", durationParameters(20, 2, 10), { postActivityRecoverySeconds: 30 }) },
        { kind: "EXERCISE", exercise: exerciseActivity("B", durationParameters(20)) },
        { kind: "EXERCISE", exercise: exerciseActivity("C", durationParameters(20)) },
      ],
      stopPoints: [],
    },
    { initialCountdownSeconds: 10 },
  );
}

describe("liste des exercices pendant l'Exécution (essai du 10/11/2026)", () => {
  it("compte à rebours, exercice en cours et sa pause, exercice passé pendant la récupération, puis effacé", () => {
    const plan = planOf(session());
    const sim = Simulation.libre(plan);
    const outline = () => projectExecution(plan, sim.state, sim.now).outline.map((item) => [item.name, item.status]);
    sim.send({ type: "START" }, 0);
    expect(outline()).toEqual([["Mouvement A", "upcoming"], ["Mouvement B", "upcoming"], ["Mouvement C", "upcoming"]]);
    sim.at(10); // Série 1 de A
    expect(outline()).toEqual([["Mouvement A", "current"], ["Mouvement B", "upcoming"], ["Mouvement C", "upcoming"]]);
    sim.at(35); // Pause entre séries de A : A reste en cours
    expect(outline()[0]).toEqual(["Mouvement A", "current"]);
    sim.at(65); // Récupération après A : A passé, en gris
    expect(outline()).toEqual([["Mouvement A", "past"], ["Mouvement B", "upcoming"], ["Mouvement C", "upcoming"]]);
    sim.at(95); // B en cours : A effacé
    expect(outline()).toEqual([["Mouvement B", "current"], ["Mouvement C", "upcoming"]]);
    expect(sim.state.leaf?.spec.kind).toBe("ACTIVITY");
    sim.at(10_000);
    expect(projectExecution(plan, sim.state, sim.now).outline).toEqual([]);
  });
});
