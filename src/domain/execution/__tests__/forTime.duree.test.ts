import { describe, expect, it } from "@jest/globals";

import { durationParameters, repetitionParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { ExecutionParameters } from "@/domain/activities/ExecutionParameters";

import { executionEnv } from "../policies";
import { roundKeyOf, type ForTimeResult } from "../policies/forTime";
import { projectExecution } from "../projection";
import { exerciseActivity, planOf, Simulation, structuredSession } from "../testing/simulation";

/**
 * Registre ch07, « For time — exécution : exercices en durée, « + Tour », sans Pause » (Hermann, 16/11/2026) ; Formats §11.1 ;
 * mission FORTIME-EXEC-DUREE (règles 1 à 7). Cas de Hermann : « 3 tours trois exercices enchaînés, 15 rep. de squat puis 2 mn de
 * planche puis 10 rép. de pompes. Démarrage > puis il faut lancer l’exercice de planche (pause / reprise manuelle), puis appuyer
 * sur +Tour. »
 */

const S = 1000;

function circuit(members: readonly { readonly id: string; readonly parameters: ExecutionParameters }[], tours = 3, capSeconds: number | null = null) {
  const session = structuredSession({
    elements: [
      {
        kind: "CIRCUIT",
        circuit: {
          id: "c",
          repeatCount: tours,
          nature: "SERIES",
          format: { key: "FOR_TIME", settings: { restBetweenRoundsSeconds: 0, ...(capSeconds === null ? {} : { timeCapSeconds: capSeconds }) } },
          exercises: members.map((member) => exerciseActivity(member.id, member.parameters, { format: { key: "FOR_TIME", settings: {} } })),
        },
      },
      { kind: "EXERCISE", exercise: exerciseActivity("after", repetitionParameters(5, 1, 0)) },
    ],
    stopPoints: [],
  });
  const plan = planOf(session);
  return { plan, sim: new Simulation(executionEnv(plan)) };
}

const squatPlanchePompes = () =>
  circuit([
    { id: "squat", parameters: repetitionParameters(15, 3, 0) },
    { id: "planche", parameters: durationParameters(120, 3, 0) },
    { id: "pompes", parameters: repetitionParameters(10, 3, 0) },
  ]);

function forTimeResult(sim: Simulation): ForTimeResult | undefined {
  const change = [...sim.results.values()].find((candidate) => candidate.type === "SCOPE" && (candidate.result as { format?: string }).format === "FOR_TIME");
  return change?.result as ForTimeResult | undefined;
}

describe("For time — exercices en durée et « + Tour » (16/11/2026)", () => {
  it("tour de clés : alternance par tour du Circuit, Série d'un exercice seul, repos entre les tours à part", () => {
    expect(roundKeyOf({ kind: "ACTIVITY", key: "session/circuit:c#2/ex:a/s2/NONE", end: "MANUAL", plannedMs: null, contribution: "omitted" })).toBe("session/circuit:c#2");
    expect(roundKeyOf({ kind: "ACTIVITY", key: "session/circuit:c#a#3/ex:a/s3/LEFT", end: "MANUAL", plannedMs: null, contribution: "omitted" })).toBe("session/circuit:c#a#3");
    expect(roundKeyOf({ kind: "ACTIVITY", key: "session/circuit:c#buy-in/ex:a/s2/NONE", end: "MANUAL", plannedMs: null, contribution: "omitted" })).toBe("session/circuit:c#buy-in/ex:a/s2");
    expect(roundKeyOf({ kind: "SIDE_RECOVERY", key: "session/ex:f/side-pause/s2", end: "TIMED", plannedMs: 1, contribution: "exact" })).toBe("session/ex:f/s2");
    expect(roundKeyOf({ kind: "POST_ACTIVITY_RECOVERY", key: "session/circuit:c#1/rest", end: "TIMED", plannedMs: 1, contribution: "exact" })).toBe("session/circuit:c#1/rest");
  });

  it("scénario de Hermann : lancer la planche, la retenir sans arrêter le chrono, puis « + Tour » ; durée en dernier : tour compté à 00:00", () => {
    const { plan, sim } = squatPlanchePompes();
    sim.send({ type: "START" }, 0);
    expect(sim.state.leaf?.spec).toMatchObject({ exerciseId: "squat", series: 1 });
    // État initial : planche à lancer, « + Tour » désactivé.
    expect(projectExecution(plan, sim.state, 1 * S).format?.duration).toEqual({ state: "PENDING", name: "Mouvement planche", remainingMs: 120 * S, totalMs: 120 * S });
    // Pas de validation anticipée d'une durée, ni de retenue d'une Série en répétitions.
    expect(sim.send({ type: "HOLD", target: sim.target }, 2 * S).reason).toBe("NOT_ALLOWED");
    // Appui dans la zone du haut : la planche démarre à 20 s.
    sim.send({ type: "NEXT", validated: true, advance: "DURATION", target: sim.target }, 20 * S);
    expect(sim.state.leaf?.spec).toMatchObject({ exerciseId: "planche", series: 1 });
    expect(sim.send({ type: "NEXT", validated: true, advance: "ROUND", target: sim.target }, 25 * S).reason).toBe("NOT_ALLOWED");
    // Retenue à 50 s (30 s tenues), reprise à 70 s : le chrono du For time continue, le décompte non.
    sim.send({ type: "HOLD", target: sim.target }, 50 * S);
    const held = projectExecution(plan, sim.state, 60 * S);
    expect(held.format?.duration).toMatchObject({ state: "HELD", remainingMs: 90 * S });
    expect(held.timer).toEqual({ kind: "STOPWATCH", elapsedMs: 60 * S, nominalMs: null });
    sim.send({ type: "RELEASE", target: sim.target }, 70 * S);
    // Fin de la planche à 70 + 90 = 160 s : pompes, « + Tour » actif (aucune durée à lancer).
    sim.at(160);
    expect(sim.state.leaf?.spec).toMatchObject({ exerciseId: "pompes", series: 1 });
    expect(projectExecution(plan, sim.state, 161 * S).format?.duration).toBeNull();
    // « + Tour » : tour 2, squat ; la planche est de nouveau à lancer.
    sim.send({ type: "NEXT", validated: true, advance: "ROUND", target: sim.target }, 180 * S);
    expect(sim.state.leaf?.spec).toMatchObject({ exerciseId: "squat", series: 2 });
    expect(projectExecution(plan, sim.state, 181 * S).format).toMatchObject({ completedActivities: 3, duration: { state: "PENDING" } });
  });

  it("« + Tour » compte le tour entier ; une durée en tête de tour démarre seule ; en dernier tour, fin du For time à 00:00", () => {
    const { plan, sim } = circuit([
      { id: "planche", parameters: durationParameters(60, 2, 0) },
      { id: "squat", parameters: repetitionParameters(15, 2, 0) },
      { id: "pompes", parameters: repetitionParameters(10, 2, 0) },
    ], 2);
    sim.send({ type: "START" }, 0);
    // Départ du For time : la planche démarre seule.
    expect(sim.state.leaf?.spec).toMatchObject({ exerciseId: "planche", series: 1 });
    sim.at(60);
    expect(sim.state.leaf?.spec).toMatchObject({ exerciseId: "squat", series: 1 });
    // « + Tour » depuis le squat : squat et pompes du tour 1 faits, la planche du tour 2 démarre seule.
    sim.send({ type: "NEXT", validated: true, advance: "ROUND", target: sim.target }, 90 * S);
    expect(sim.state.leaf?.spec).toMatchObject({ exerciseId: "planche", series: 2 });
    expect(projectExecution(plan, sim.state, 91 * S).format).toMatchObject({ completedActivities: 3, duration: { state: "RUNNING" } });
    const pompes1 = sim.stepResults().find((step) => step.exerciseId === "pompes" && step.series === 1);
    expect(pompes1?.completion).toBe("COMPLETED");
    sim.at(150);
    sim.send({ type: "NEXT", validated: true, advance: "ROUND", target: sim.target }, 170 * S);
    // Fin normale : temps réalisé 170 s, toutes les Séries acquises, la Séance enchaîne.
    expect(forTimeResult(sim)).toMatchObject({ measuredMs: 170 * S, completedActivities: 6, totalActivities: 6, capReached: false });
    expect(sim.state.leaf?.spec).toMatchObject({ exerciseId: "after" });
  });

  it("durée en dernier de la boucle : le tour est compté à 00:00 ; au dernier tour, le For time se termine à 00:00", () => {
    const { sim } = circuit([
      { id: "squat", parameters: repetitionParameters(15, 2, 0) },
      { id: "planche", parameters: durationParameters(30, 2, 0) },
    ], 2);
    sim.send({ type: "START" }, 0);
    sim.send({ type: "NEXT", validated: true, advance: "DURATION", target: sim.target }, 10 * S);
    sim.at(40); // planche 1 finie : tour 2 sans « + Tour »
    expect(sim.state.leaf?.spec).toMatchObject({ exerciseId: "squat", series: 2 });
    sim.send({ type: "NEXT", validated: true, advance: "DURATION", target: sim.target }, 50 * S);
    sim.at(80);
    expect(forTimeResult(sim)).toMatchObject({ measuredMs: 80 * S, completedActivities: 4, totalActivities: 4 });
    expect(sim.state.leaf?.spec).toMatchObject({ exerciseId: "after" });
  });

  it("deux durées enchaînées : la seconde démarre seule à la fin de la première", () => {
    // Un For time tout en durée n'est pas valide (NO_REPETITIONS) : un squat d'abord.
    const { sim } = circuit([
      { id: "squat", parameters: repetitionParameters(15, 1, 0) },
      { id: "planche", parameters: durationParameters(30, 1, 0) },
      { id: "chaise", parameters: durationParameters(20, 1, 0) },
    ], 1);
    sim.send({ type: "START" }, 0);
    sim.send({ type: "NEXT", validated: true, advance: "DURATION", target: sim.target }, 10 * S);
    sim.at(40);
    expect(sim.state.leaf?.spec).toMatchObject({ exerciseId: "chaise" });
    sim.at(60);
    expect(forTimeResult(sim)).toMatchObject({ measuredMs: 60 * S, completedActivities: 3 });
  });

  it("Arrêt sans Pause : accepté en cours ; pendant une durée, la durée tenue est enregistrée", () => {
    const { sim } = squatPlanchePompes();
    sim.send({ type: "START" }, 0);
    sim.send({ type: "NEXT", validated: true, advance: "DURATION", target: sim.target }, 10 * S);
    const stopped = sim.send({ type: "STOP", payload: { partialRepetitions: 4, partialDurationMs: 45 * S } }, 55 * S);
    expect(stopped.outcome).toBe("APPLIED");
    expect(sim.state.finish?.reason).toBe("STOPPED");
    // Une seule valeur, celle de l'étape en cours (une durée) : pas de répétitions partielles.
    expect(forTimeResult(sim)).toMatchObject({ measuredMs: 55 * S, completedActivities: 1, partialRepetitions: null, partialDurationMs: 45 * S });
  });

  it("hors For time, l'Arrêt exige toujours la Pause, et la retenue d'une durée est refusée", () => {
    const session = structuredSession({ elements: [{ kind: "EXERCISE", exercise: exerciseActivity("p", durationParameters(60, 1, 0)) }], stopPoints: [] });
    const sim = new Simulation(executionEnv(planOf(session)));
    sim.send({ type: "START" }, 0);
    expect(sim.state.leaf?.spec.end).toBe("TIMED");
    expect(sim.send({ type: "HOLD", target: sim.target }, 5 * S).reason).toBe("NOT_ALLOWED");
    expect(sim.send({ type: "STOP" }, 6 * S).reason).toBe("NOT_PAUSED");
  });

  it("une durée retenue reste retenue après Pause puis Redémarrer ; la Pause fige aussi le chrono du For time", () => {
    const { plan, sim } = squatPlanchePompes();
    sim.send({ type: "START" }, 0);
    sim.send({ type: "NEXT", validated: true, advance: "DURATION", target: sim.target }, 10 * S);
    sim.send({ type: "HOLD", target: sim.target }, 20 * S);
    sim.send({ type: "PAUSE" }, 30 * S);
    sim.send({ type: "RESUME" }, 100 * S);
    const view = projectExecution(plan, sim.state, 110 * S);
    expect(view.format?.duration).toMatchObject({ state: "HELD", remainingMs: 110 * S });
    expect(view.timer).toEqual({ kind: "STOPWATCH", elapsedMs: 40 * S, nominalMs: null });
  });
});
