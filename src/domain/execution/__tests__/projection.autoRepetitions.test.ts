import { describe, expect, it } from "@jest/globals";

import { uniformParameters } from "@/domain/activities/testing/executionParametersFixtures";

import { projectExecution } from "../projection";
import { exerciseActivity, planOf, Simulation, structuredSession } from "../testing/simulation";

/**
 * Recette du 13/11/2026 (Hermann : « Oui il faut continuer le guidage, c'est à l'utilisateur d'arrêter. Mais on peut
 * ajouter un compteur automatique dans ce cas puisqu'on est supposé suivre ce guidage »).
 */
describe("compteur automatique des répétitions", () => {
  const phases = [
    { id: 1, label: "Contracter", durationSeconds: 6 },
    { id: 2, label: "Relâcher", durationSeconds: 2 },
  ];

  function run(mode: "REPETITIONS" | "DURATION") {
    const plan = planOf(
      structuredSession({
        elements: [{ kind: "EXERCISE", exercise: exerciseActivity("r", uniformParameters({ mode, count: 1, target: mode === "REPETITIONS" ? 12 : 60, workPhases: phases })) }],
        stopPoints: [],
      }),
    );
    const sim = Simulation.libre(plan);
    sim.send({ type: "START" }, 0);
    return { plan, sim };
  }

  it("répétitions faites d'après les cycles du motif, au-delà du nombre prévu", () => {
    const { plan, sim } = run("REPETITIONS");
    const at = (ms: number) => projectExecution(plan, sim.state, ms);
    expect(sim.state.leaf?.spec.kind).toBe("ACTIVITY");
    expect(at(7_999).autoRepetitions).toBe(0);
    expect(at(8_000).autoRepetitions).toBe(1);
    expect(at(96_000).autoRepetitions).toBe(12);
    expect(at(120_000).autoRepetitions).toBe(15);
    // Le guidage continue au-delà des 12 répétitions prévues.
    expect(at(121_000).guidance?.label).toBe("Contracter");
  });

  it("aucun compteur pour un exercice en Durée", () => {
    const { plan, sim } = run("DURATION");
    expect(projectExecution(plan, sim.state, 10_000).autoRepetitions).toBeNull();
  });

  // Recette du 13/11/2026 : Suivant mis en avant en Répétitions.
  it("Suivant mis en avant : avec phases, dès que l’objectif est atteint", () => {
    const { plan, sim } = run("REPETITIONS");
    expect(projectExecution(plan, sim.state, 95_999).nextHighlighted).toBe(false);
    expect(projectExecution(plan, sim.state, 96_000).nextHighlighted).toBe(true);
  });

  it("Suivant mis en avant : sans phases ni cadence, dès le début ; jamais en Durée", () => {
    const bare = planOf(structuredSession({ elements: [{ kind: "EXERCISE", exercise: exerciseActivity("b", uniformParameters({ mode: "REPETITIONS", count: 1, target: 12 })) }], stopPoints: [] }));
    const sim = Simulation.libre(bare);
    sim.send({ type: "START" }, 0);
    // Recette du 13/11/2026 : blanc tant que l’exercice n’a pas démarré.
    expect(projectExecution(bare, sim.state, 0).nextHighlighted).toBe(false);
    expect(projectExecution(bare, sim.state, 100).nextHighlighted).toBe(true);
    const { plan, sim: timed } = run("DURATION");
    expect(projectExecution(plan, timed.state, 1_000).nextHighlighted).toBe(false);
  });
});
