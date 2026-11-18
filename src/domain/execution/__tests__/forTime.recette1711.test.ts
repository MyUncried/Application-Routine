import { describe, expect, it } from "@jest/globals";

import { durationParameters, repetitionParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { ExecutionParameters } from "@/domain/activities/ExecutionParameters";

import { executionEnv } from "../policies";
import type { ForTimeResult } from "../policies/forTime";
import { projectExecution } from "../projection";
import { exerciseActivity, planOf, Simulation, structuredSession } from "../testing/simulation";

/**
 * Recette iPhone du 17/11/2026 (Hermann), mission For time — exercices en durée : lignes ft-barre, ft-sans-duree, ft-buyin,
 * ft-arret-serie / ft-arret-duree et constat d. Les rendus (couleurs, positions) restent à vérifier sur iPhone.
 */

const S = 1000;
const BUY_IN = 1;
const BUY_OUT = 2;

type Member = { readonly id: string; readonly parameters: ExecutionParameters; readonly role?: number };

function forTime(members: readonly Member[], tours: number, options: { readonly initialCountdownSeconds?: number; readonly finalPhaseSeconds?: number } = {}) {
  const session = structuredSession(
    {
      elements: [
        {
          kind: "CIRCUIT",
          circuit: {
            id: "c",
            repeatCount: tours,
            nature: "SERIES",
            format: { key: "FOR_TIME", settings: { restBetweenRoundsSeconds: 0 } },
            exercises: members.map((member) =>
              exerciseActivity(member.id, member.parameters, { format: { key: "FOR_TIME", settings: member.role === undefined ? {} : { circuitRole: member.role } } }),
            ),
          },
        },
      ],
      stopPoints: [],
    },
    options,
  );
  const plan = planOf(session);
  return { plan, sim: new Simulation(executionEnv(plan)) };
}

describe("For time — recette du 17/11/2026", () => {
  it("constat d : alternance, Série 1/1 à chaque tour ; Suivant puis « + Tour », Succès au dernier tour", () => {
    const { plan, sim } = forTime(
      [
        { id: "a", parameters: repetitionParameters(10, 2, 0) },
        { id: "b", parameters: repetitionParameters(12, 2, 0) },
      ],
      2,
    );
    sim.send({ type: "START" }, 0);
    const view = (atMs: number) => {
      const projection = projectExecution(plan, sim.state, atMs);
      return { name: projection.exerciseName, series: projection.series, tour: projection.tour, command: projection.format?.command?.kind };
    };
    expect(view(1 * S)).toEqual({ name: "Mouvement a", series: { current: 1, total: 1 }, tour: { current: 1, total: 2 }, command: "NEXT" });
    sim.send({ type: "NEXT", validated: true, target: sim.target }, 10 * S);
    expect(view(11 * S)).toEqual({ name: "Mouvement b", series: { current: 1, total: 1 }, tour: { current: 1, total: 2 }, command: "ROUND" });
    sim.send({ type: "NEXT", validated: true, advance: "ROUND", target: sim.target }, 20 * S);
    expect(view(21 * S)).toEqual({ name: "Mouvement a", series: { current: 1, total: 1 }, tour: { current: 2, total: 2 }, command: "NEXT" });
    sim.send({ type: "NEXT", validated: true, target: sim.target }, 30 * S);
    expect(view(31 * S)).toEqual({ name: "Mouvement b", series: { current: 1, total: 1 }, tour: { current: 2, total: 2 }, command: "SUCCESS" });
  });

  it("buy-in et buy-out : « Suivant » à chaque série, partie en cours ; Succès à la dernière série du buy-out", () => {
    const { plan, sim } = forTime(
      [
        { id: "bi", parameters: repetitionParameters(5, 2, 0), role: BUY_IN },
        { id: "a", parameters: repetitionParameters(10, 1, 0) },
        { id: "bo", parameters: repetitionParameters(5, 1, 0), role: BUY_OUT },
      ],
      1,
    );
    sim.send({ type: "START" }, 0);
    const command = (atMs: number) => projectExecution(plan, sim.state, atMs).format?.command;
    expect(command(1 * S)).toEqual({ kind: "NEXT", segment: "BUY_IN", advance: "NEXT", duration: false });
    sim.send({ type: "NEXT", validated: true, target: sim.target }, 5 * S);
    expect(command(6 * S)).toEqual({ kind: "NEXT", segment: "BUY_IN", advance: "NEXT", duration: false });
    sim.send({ type: "NEXT", validated: true, target: sim.target }, 10 * S);
    // Seconde recette du 17/11/2026, règle 5 (exception) : dernier exercice du dernier tour, un buy-out suit — « Suivant » qui
    // compte le tour. [« + Tour » — remplacé.]
    expect(command(11 * S)).toEqual({ kind: "NEXT", segment: "ROUNDS", advance: "ROUND", duration: false });
    sim.send({ type: "NEXT", validated: true, advance: "ROUND", target: sim.target }, 20 * S);
    expect(command(21 * S)).toEqual({ kind: "SUCCESS", segment: "BUY_OUT", advance: "ROUND", duration: false });
  });

  it("durée en dernier exercice du For time : Succès, désactivé par la durée (fin à 00:00)", () => {
    const { plan, sim } = forTime(
      [
        { id: "squat", parameters: repetitionParameters(15, 1, 0) },
        { id: "planche", parameters: durationParameters(60, 1, 0) },
      ],
      1,
    );
    sim.send({ type: "START" }, 0);
    sim.send({ type: "NEXT", validated: true, advance: "DURATION", target: sim.target }, 10 * S);
    const projection = projectExecution(plan, sim.state, 11 * S);
    expect(projection.format?.command?.kind).toBe("SUCCESS");
    expect(projection.format?.duration?.state).toBe("RUNNING");
  });

  it("règles 4, 6 et 8 : exercice en durée — Suivant inactif au buy-in, « + Tour » inactif dans le tour, qu'il soit le dernier ou non", () => {
    const { plan, sim } = forTime(
      [
        { id: "bi", parameters: durationParameters(20, 1, 0), role: BUY_IN },
        { id: "planche", parameters: durationParameters(30, 2, 0) },
        { id: "squat", parameters: repetitionParameters(10, 2, 0) },
        { id: "gainage", parameters: durationParameters(30, 2, 0) },
      ],
      2,
    );
    sim.send({ type: "START" }, 0);
    const command = (atMs: number) => projectExecution(plan, sim.state, atMs).format?.command;
    expect(command(1 * S)).toMatchObject({ kind: "NEXT", segment: "BUY_IN", duration: true });
    sim.at(20); // fin du buy-in : la planche démarre seule
    expect(command(21 * S)).toMatchObject({ kind: "ROUND", segment: "ROUNDS", duration: true });
    sim.at(50); // squat
    expect(command(51 * S)).toMatchObject({ kind: "NEXT", advance: "NEXT", duration: false });
    expect(projectExecution(plan, sim.state, 51 * S).format?.duration?.state).toBe("PENDING");
    sim.send({ type: "NEXT", validated: true, advance: "DURATION", target: sim.target }, 55 * S);
    expect(command(56 * S)).toMatchObject({ kind: "ROUND", duration: true });
  });

  it("compte à rebours initial : la partie du premier exercice à venir (buy-in)", () => {
    const { plan, sim } = forTime(
      [
        { id: "bi", parameters: repetitionParameters(5, 3, 0), role: BUY_IN },
        { id: "a", parameters: repetitionParameters(10, 1, 0) },
      ],
      3,
      { initialCountdownSeconds: 10 },
    );
    sim.send({ type: "START" }, 0);
    expect(projectExecution(plan, sim.state, 2 * S).upcoming).toMatchObject({ name: "Mouvement bi", segment: "BUY_IN" });
  });

  it("aucune pause ni récupération dans un For time (seconde recette du 17/11/2026)", () => {
    const { plan } = forTime(
      [
        { id: "a", parameters: repetitionParameters(10, 2, 30) },
        { id: "b", parameters: durationParameters(20, 2, 15) },
      ],
      2,
    );
    const scope = plan.items.find((item) => item.type === "SCOPE");
    const kinds = scope?.type === "SCOPE" ? (scope.scope.config as { items: { type: string; leaf?: { kind: string } }[] }).items.map((item) => item.leaf?.kind) : [];
    expect(kinds.length).toBeGreaterThan(0);
    expect(kinds.every((kind) => kind === "ACTIVITY")).toBe(true);
  });

  it("aucun repos même saisi : pause de série, récupération, repos entre les tours (natures Séries et Tours)", () => {
    for (const nature of ["SERIES", "TOURS"] as const) {
      const exercise = (id: string) =>
        exerciseActivity(id, repetitionParameters(10, 3, 20), { format: { key: "FOR_TIME", settings: {} }, postActivityRecoverySeconds: 40 });
      const plan = planOf(
        structuredSession({
          elements: [
            {
              kind: "CIRCUIT",
              circuit: { id: "c", repeatCount: 3, nature, format: { key: "FOR_TIME", settings: { restBetweenRoundsSeconds: 30 } }, exercises: [exercise("a"), exercise("b")] },
            },
          ],
          stopPoints: [],
        }),
      );
      const kinds = plan.items.flatMap((item) =>
        item.type === "SCOPE" ? (item.scope.config as { items: { type: string; leaf: { kind: string } }[] }).items.map((child) => child.leaf.kind) : [item.leaf.kind],
      );
      expect(kinds.filter((kind) => kind !== "ACTIVITY" && kind !== "SESSION_END")).toEqual([]);
    }
  });

  // Registre ch07, « Aucun temps de repos imposé en For time » (Hermann, 17/11/2026) : « un exercice en durée démarre dès que le moment
  // est connu (second côté juste après le premier) ; en répétitions, le changement de côté n'a ni écran ni compteur ».
  it("deux côtés en durée : le second démarre aussitôt après le premier ; en répétitions, aucun écran de changement de côté", () => {
    const sides = { sideMode: "RIGHT_LEFT", sideRecoverySeconds: 15 } as const;
    // Circuit For time : l'exercice à deux côtés (pause de changement de côté et pause de série saisies), puis un squat.
    const single = (parameters: ExecutionParameters) => forTime([{ id: "x", parameters }, { id: "squat", parameters: repetitionParameters(5, 1, 0) }], 1);
    const timed = single(durationParameters(30, 1, 10, sides));
    timed.sim.send({ type: "START" }, 0);
    expect(timed.sim.state.leaf?.spec).toMatchObject({ kind: "ACTIVITY", sideRank: 1 });
    timed.sim.at(30);
    expect(timed.sim.state.leaf?.spec).toMatchObject({ kind: "ACTIVITY", sideRank: 2 });
    expect(projectExecution(timed.plan, timed.sim.state, 31 * S).format?.duration).toMatchObject({ state: "RUNNING", remainingMs: 29 * S });

    const reps = single(repetitionParameters(10, 1, 10, sides));
    reps.sim.send({ type: "START" }, 0);
    reps.sim.send({ type: "NEXT", validated: true, target: reps.sim.target }, 12 * S);
    expect(reps.sim.state.leaf?.spec).toMatchObject({ kind: "ACTIVITY", sideRank: 2 });
    expect(projectExecution(reps.plan, reps.sim.state, 13 * S).phase).toBe("ACTIVITY");
  });

  // Recette du 17/11/2026 (Hermann : double bip à la pause dans le cercle, bip long au redémarrage) : effet HELD, source des sons.
  it("retenue et reprise d'une durée : effet HELD (retenue, puis reprise), pour les sons de pause et de reprise", () => {
    const { sim } = forTime([{ id: "squat", parameters: repetitionParameters(10, 1, 0) }, { id: "planche", parameters: durationParameters(60, 1, 0) }], 1);
    sim.send({ type: "START" }, 0);
    sim.send({ type: "NEXT", validated: true, advance: "DURATION", target: sim.target }, 5 * S);
    expect(sim.send({ type: "HOLD", target: sim.target }, 10 * S).effects).toContainEqual({ type: "HELD", held: true, atMs: 10 * S });
    expect(sim.send({ type: "RELEASE", target: sim.target }, 15 * S).effects).toContainEqual({ type: "HELD", held: false, atMs: 15 * S });
  });

  it("constat c : Arrêt demandé avant la borne, confirmé pendant la Clôture qu'elle a ouverte — temps de l'appui, séance arrêtée", () => {
    const session = structuredSession({
      elements: [
        {
          kind: "CIRCUIT",
          circuit: {
            id: "c",
            repeatCount: 3,
            nature: "SERIES",
            format: { key: "FOR_TIME", settings: { restBetweenRoundsSeconds: 0, timeCapSeconds: 60 } },
            exercises: [exerciseActivity("a", repetitionParameters(10, 1, 0), { format: { key: "FOR_TIME", settings: {} } })],
          },
        },
      ],
      stopPoints: [],
    });
    const plan = planOf(session);
    const sim = new Simulation(executionEnv(plan));
    sim.send({ type: "START" }, 0);
    sim.at(60); // borne pendant que la modale de l'Arrêt (appui à 50 s) est ouverte
    expect(sim.state.leaf?.spec.kind).toBe("CLOSURE");
    sim.send({ type: "STOP", atMs: 50 * S, payload: { partialRepetitions: 6 } }, 70 * S);
    expect(sim.state.finish).toEqual({ reason: "STOPPED", atMs: 50 * S });
    const change = [...sim.results.values()].find((candidate) => candidate.type === "SCOPE" && (candidate.result as { format?: string }).format === "FOR_TIME");
    expect(change?.result as ForTimeResult).toMatchObject({ measuredMs: 50 * S, capReached: false, partialRepetitions: 6 });
  });

  it("ft-arret : Arrêt confirmé plus tard, le temps enregistré est celui de l'appui", () => {
    const { sim } = forTime([{ id: "a", parameters: repetitionParameters(10, 2, 0) }], 2);
    sim.send({ type: "START" }, 0);
    sim.send({ type: "STOP", atMs: 12 * S, payload: { partialRepetitions: 4 } }, 20 * S);
    const change = [...sim.results.values()].find((candidate) => candidate.type === "SCOPE" && (candidate.result as { format?: string }).format === "FOR_TIME");
    expect(change?.result as ForTimeResult).toMatchObject({ measuredMs: 12 * S, partialRepetitions: 4 });
    expect(sim.state.finish).toEqual({ reason: "STOPPED", atMs: 12 * S });
  });

  it("ft-barre : le temps de séance ne court ni pendant le compte à rebours ni pendant la fin", () => {
    const { plan, sim } = forTime([{ id: "a", parameters: repetitionParameters(10, 1, 0) }], 1, { initialCountdownSeconds: 10, finalPhaseSeconds: 30 });
    sim.send({ type: "START" }, 0);
    expect(projectExecution(plan, sim.state, 5 * S).sessionElapsedMs).toBe(0);
    sim.send({ type: "TICK" }, 10 * S);
    expect(projectExecution(plan, sim.state, 25 * S).sessionElapsedMs).toBe(15 * S);
    sim.send({ type: "NEXT", validated: true, advance: "ROUND", target: sim.target }, 25 * S);
    expect(sim.state.leaf?.spec.kind).toBe("SESSION_END");
    expect(projectExecution(plan, sim.state, 40 * S).sessionElapsedMs).toBe(15 * S);
  });
});
