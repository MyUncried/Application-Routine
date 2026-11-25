import { describe, expect, it } from "@jest/globals";

import { durationParameters, repetitionParameters, variableParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { ExecutionParameters } from "@/domain/activities/ExecutionParameters";
import { createSessionSnapshot } from "@/domain/sessions/sessionSnapshot";

import { launchabilityOf, type EmomScopeConfig } from "../plan";
import { executionEnv } from "../policies";
import { type EmomResult, type EmomWindowResult } from "../policies/emom";
import { estimatedDuration, projectExecution } from "../projection";
import { stepSignalsBetween } from "../signals";
import { exerciseActivity, planOf, Simulation, structuredSession } from "../testing/simulation";

/**
 * PRE-11 (T2) — politique EMOM (conception consolidée §12.2, §12.5 ; FMT-20 à FMT-25, FMT-35, FMT-36 ; D5, Q1, Q4, Q5 ; cas T10,
 * T11, T26, T28) et arbitrages de Hermann du 18/11/2026 (spec PRE-11 §5 point 30).
 */

const S = 1000;

function emomExercise(id: string, parameters: ExecutionParameters, intervalSeconds = 60) {
  return exerciseActivity(id, parameters, { format: { key: "EMOM", settings: { intervalSeconds } } });
}

function simOf(session: ReturnType<typeof structuredSession>) {
  const plan = planOf(session);
  return { plan, sim: new Simulation(executionEnv(plan)) };
}

/** EMOM autonome : 3 fenêtres de 60 s, 10 répétitions, puis un Exercice libre. */
function single(parameters: ExecutionParameters = repetitionParameters(10, 3, 0)) {
  return simOf(
    structuredSession({
      elements: [
        { kind: "EXERCISE", exercise: emomExercise("E", parameters) },
        { kind: "EXERCISE", exercise: exerciseActivity("after", repetitionParameters(5, 1, 0)) },
      ],
      stopPoints: [],
    }),
  );
}

function windowResults(sim: Simulation): EmomWindowResult[] {
  return [...sim.results.values()]
    .flatMap((change) => (change.type === "SCOPE" && (change.result as { format?: string; window?: number }).format === "EMOM" && typeof (change.result as { window?: number }).window === "number" ? [change.result as EmomWindowResult] : []))
    .sort((a, b) => a.window - b.window);
}

function elementResult(sim: Simulation): EmomResult | undefined {
  return [...sim.results.values()].flatMap((change) => (change.type === "SCOPE" && (change.result as { format?: string; played?: number }).played !== undefined ? [change.result as EmomResult] : []))[0];
}

describe("PRE-11 T2 — EMOM", () => {
  it("lançable ; une portée EMOM, une fenêtre par Série terminée par son repos ; durée estimée N × W", () => {
    const session = structuredSession({ elements: [{ kind: "EXERCISE", exercise: emomExercise("E", repetitionParameters(10, 3, 0)) }], stopPoints: [] });
    expect(launchabilityOf(createSessionSnapshot(session))).toEqual({ status: "launchable" });
    const plan = planOf(session);
    const scope = plan.items.find((item) => item.type === "SCOPE");
    expect(scope?.type === "SCOPE" && scope.scope.pilot).toBe("EMOM");
    const config = (scope?.type === "SCOPE" ? scope.scope.config : null) as EmomScopeConfig;
    expect(config.windowMs).toBe(60 * S);
    expect(config.windows.map((window) => window.number)).toEqual([1, 2, 3]);
    expect(config.items.map((item) => (item.type === "LEAF" ? item.leaf.kind : "SCOPE"))).toEqual(["ACTIVITY", "WINDOW_REST", "ACTIVITY", "WINDOW_REST", "ACTIVITY", "WINDOW_REST"]);
    expect(estimatedDuration(plan)).toEqual({ kind: "exact", ms: 180 * S });
  });

  it("T11 : travail terminé à 35 s — 25 s de repos, aucune transition de fenêtre à 35 s ; fenêtre suivante à 60 s (FMT-23 à FMT-25)", () => {
    const { plan, sim } = single();
    sim.send({ type: "START" }, 0);
    expect(sim.state.leaf?.spec).toMatchObject({ kind: "ACTIVITY", series: 1, windowStart: true });
    sim.send({ type: "NEXT", validated: true, target: sim.target }, 35 * S);
    expect(sim.state.leaf?.spec.kind).toBe("WINDOW_REST");
    const resting = projectExecution(plan, sim.state, 40 * S);
    expect(resting.format?.emom).toMatchObject({ window: 1, windows: 3, resting: true, workEndedMs: 35 * S, remainingMs: 20 * S });
    expect(resting.timer).toEqual({ kind: "COUNTDOWN", remainingMs: 20 * S, totalMs: 60 * S, elapsedMs: 40 * S });
    sim.at(59);
    expect(sim.state.leaf?.spec.kind).toBe("WINDOW_REST");
    sim.at(60);
    expect(sim.state.leaf?.spec).toMatchObject({ kind: "ACTIVITY", series: 2 });
    expect(windowResults(sim)[0]).toMatchObject({ window: 1, terminated: true, workEndedMs: 35 * S, partialRepetitions: null });
  });

  it("T10 / FMT-36 : deux confirmations dans la même fenêtre — une seule acquisition, rien pour la fenêtre suivante", () => {
    const { sim } = single();
    sim.send({ type: "START" }, 0);
    const target = sim.target;
    sim.send({ type: "NEXT", validated: true, target }, 20 * S);
    const again = sim.send({ type: "NEXT", validated: true, target }, 21 * S);
    expect(again.outcome).not.toBe("APPLIED");
    expect(sim.state.leaf?.spec.kind).toBe("WINDOW_REST");
    sim.at(60);
    expect(sim.state.leaf?.spec).toMatchObject({ kind: "ACTIVITY", series: 2 });
    expect(sim.step(sim.state.leaf!.spec.key)).toBeUndefined();
  });

  it("D5, Q1, T28 : fenêtre non terminée — suivante à l'heure, bandeau, déclaration non bloquante ; « Passer » puis Clôture", () => {
    const { plan, sim } = single();
    sim.send({ type: "START" }, 0);
    sim.at(60); // fenêtre 1 non terminée
    expect(sim.state.leaf?.spec).toMatchObject({ kind: "ACTIVITY", series: 2 });
    expect(windowResults(sim)[0]).toMatchObject({ window: 1, terminated: false, partialRepetitions: null });
    const banner = projectExecution(plan, sim.state, 61 * S).format?.emom?.banner;
    expect(banner).toMatchObject({ window: 1, name: "Mouvement E", target: { kind: "NUMBER", value: 10 } });
    // Déclaration dans le bandeau : la fenêtre 2 continue (aucune étape changée).
    const key = sim.state.leaf!.spec.key;
    sim.send({ type: "DECLARE", payload: { window: 1, partialRepetitions: 7 } }, 62 * S);
    expect(sim.state.leaf?.spec.key).toBe(key);
    expect(windowResults(sim)[0]).toMatchObject({ window: 1, terminated: false, partialRepetitions: 7 });
    expect(projectExecution(plan, sim.state, 63 * S).format?.emom?.banner).toBeNull();
    sim.at(120); // fenêtre 2 non terminée
    sim.send({ type: "DECLARE", payload: { window: 2, skip: true } }, 125 * S); // Passer
    expect(projectExecution(plan, sim.state, 126 * S).format?.emom?.banner).toBeNull();
    sim.at(150);
    sim.send({ type: "NEXT", validated: true, target: sim.target }, 150 * S); // fenêtre 3 terminée
    sim.at(180);
    // Clôture : seule la fenêtre 2 reste à déclarer.
    expect(sim.state.leaf?.spec).toMatchObject({ kind: "CLOSURE", key: "session/emom:E/closure/f2" });
    const closure = projectExecution(plan, sim.state, 180 * S);
    expect(closure.format).toMatchObject({ kind: "EMOM", phase: "CLOSURE", interrupted: { name: "Mouvement E", mode: "REPETITIONS" } });
    expect(closure.format?.emom?.closingWindow).toBe(2);
    sim.send({ type: "SUBMIT", payload: { partialRepetitions: 4 }, target: sim.target }, 185 * S);
    expect(windowResults(sim).map((result) => [result.window, result.terminated, result.partialRepetitions])).toEqual([
      [1, false, 7],
      [2, false, 4],
      [3, true, null],
    ]);
    expect(elementResult(sim)).toMatchObject({ windows: 3, played: 3, terminated: 1, stopped: false });
    expect(sim.state.leaf?.spec).toMatchObject({ kind: "ACTIVITY", exerciseId: "after" });
  });

  it("aucune Clôture quand toutes les fenêtres sont terminées ou déclarées (§12.2) : l'élément suivant démarre à l'échéance", () => {
    const { sim } = single();
    sim.send({ type: "START" }, 0);
    for (const at of [30, 90, 150]) {
      sim.at(at);
      sim.send({ type: "NEXT", validated: true, target: sim.target }, at * S);
    }
    sim.at(180);
    expect(sim.state.leaf?.spec).toMatchObject({ kind: "ACTIVITY", exerciseId: "after" });
    expect(elementResult(sim)).toMatchObject({ played: 3, terminated: 3 });
  });

  it("Q4 : confirmation exactement à l'échéance — fenêtre acquise", () => {
    const { sim } = single();
    sim.send({ type: "START" }, 0);
    sim.send({ type: "NEXT", validated: true, target: sim.target }, 60 * S);
    expect(windowResults(sim)[0]).toMatchObject({ window: 1, terminated: true });
    expect(sim.state.leaf?.spec).toMatchObject({ kind: "ACTIVITY", series: 2 });
  });

  it("Série en Durée : démarre à l'ouverture, se termine seule à son terme, Suivant refusé avant ; repos jusqu'à l'échéance", () => {
    const { sim } = single(durationParameters(40, 2, 0));
    sim.send({ type: "START" }, 0);
    expect(sim.send({ type: "NEXT", validated: true, target: sim.target }, 10 * S).outcome).toBe("REJECTED");
    sim.at(40);
    expect(sim.state.leaf?.spec.kind).toBe("WINDOW_REST");
    sim.at(60);
    expect(sim.state.leaf?.spec).toMatchObject({ kind: "ACTIVITY", series: 2 });
  });

  it("recette du 18/11/2026 (emom-6) : Série en Durée retenue au centre — l'effort seul s'arrête, la fenêtre continue, repos à l'objectif, sans dérive", () => {
    const { plan, sim } = single(durationParameters(40, 2, 0));
    sim.send({ type: "START" }, 0);
    // Retenues répétées : 10 s puis 5 s.
    expect(sim.send({ type: "HOLD" }, 10 * S).outcome).not.toBe("REJECTED");
    expect(sim.send({ type: "RELEASE" }, 20 * S).outcome).not.toBe("REJECTED");
    expect(sim.send({ type: "HOLD" }, 25 * S).outcome).not.toBe("REJECTED");
    expect(projectExecution(plan, sim.state, 28 * S)?.format?.duration).toMatchObject({ state: "HELD", remainingMs: 25 * S });
    // La fenêtre continue pendant la retenue.
    expect(projectExecution(plan, sim.state, 28 * S)?.timer).toMatchObject({ kind: "COUNTDOWN", remainingMs: 32 * S });
    expect(sim.send({ type: "RELEASE" }, 30 * S).outcome).not.toBe("REJECTED");
    // Effort cumulé de 40 s atteint à 55 s (15 s de retenue) : repos jusqu'à l'échéance ; plus rien à retenir.
    sim.at(54);
    expect(sim.state.leaf?.spec.kind).toBe("ACTIVITY");
    sim.at(55);
    expect(sim.state.leaf?.spec.kind).toBe("WINDOW_REST");
    expect(sim.send({ type: "HOLD" }, 56 * S).outcome).toBe("REJECTED");
    // Aucune dérive : la fenêtre 2 commence à 60 s, la fin de l'EMOM à 120 s.
    sim.at(60);
    expect(sim.state.leaf?.spec).toMatchObject({ kind: "ACTIVITY", series: 2 });
    sim.at(120);
    expect(windowResults(sim).map((result) => result.terminated)).toEqual([true, true]);
  });

  it("recette du 18/11/2026 (emom-6) : pas de retenue pendant une Série en Répétitions", () => {
    const { sim } = single();
    sim.send({ type: "START" }, 0);
    expect(sim.send({ type: "HOLD" }, 10 * S).outcome).toBe("REJECTED");
  });

  // Recette du 18/11/2026 (emom-9) : en Répétitions, aucune pause entre les côtés — « Suivant » enchaîne, le reste de l'intervalle
  // est le repos ; la Pause entre les côtés saisie (ou copiée du Profil) reste sans effet. [Q5 : pause entre les côtés jouée dans la
  // fenêtre, aussi en Répétitions — remplacé.]
  it("emom-9 : exercice bilatéral en Répétitions — deux côtés enchaînés par « Suivant », sans pause, repos jusqu'à l'échéance", () => {
    const parameters = repetitionParameters(8, 2, 0, { sideMode: "RIGHT_LEFT", sideRecoverySeconds: 5 });
    const { plan, sim } = single(parameters);
    const scope = plan.items.find((item) => item.type === "SCOPE");
    const config = (scope?.type === "SCOPE" ? scope.scope.config : null) as EmomScopeConfig;
    expect(config.windows).toHaveLength(2);
    expect(config.items.slice(0, 3).map((item) => (item.type === "LEAF" ? [item.leaf.kind, item.leaf.series ?? null, item.leaf.sideRank ?? null] : null))).toEqual([
      ["ACTIVITY", 1, 1],
      ["ACTIVITY", 1, 2],
      ["WINDOW_REST", 1, null],
    ]);
    expect(config.items.some((item) => item.type === "LEAF" && item.leaf.kind === "SIDE_RECOVERY")).toBe(false);
    // Durée : N × W, aucune pause entre côtés ajoutée.
    const alone = planOf(structuredSession({ elements: [{ kind: "EXERCISE", exercise: emomExercise("E", parameters) }], stopPoints: [] }));
    expect(estimatedDuration(alone)).toEqual({ kind: "exact", ms: 2 * 60 * S });
    sim.send({ type: "START" }, 0);
    sim.send({ type: "NEXT", validated: true, target: sim.target }, 10 * S); // côté 1
    expect(sim.state.leaf?.spec).toMatchObject({ kind: "ACTIVITY", sideRank: 2 });
    sim.send({ type: "NEXT", validated: true, target: sim.target }, 25 * S);
    expect(sim.state.leaf?.spec.kind).toBe("WINDOW_REST");
    sim.at(60);
    expect(sim.state.leaf?.spec).toMatchObject({ kind: "ACTIVITY", series: 2, sideRank: 1 });
  });

  it("emom-9 : exercice bilatéral en Durée — la pause entre les côtés reste jouée dans la fenêtre (EMOM en durée inchangé)", () => {
    const parameters = durationParameters(20, 2, 0, { sideMode: "RIGHT_LEFT", sideRecoverySeconds: 5 });
    const { plan } = single(parameters);
    const scope = plan.items.find((item) => item.type === "SCOPE");
    const config = (scope?.type === "SCOPE" ? scope.scope.config : null) as EmomScopeConfig;
    expect(config.items.slice(0, 4).map((item) => (item.type === "LEAF" ? item.leaf.kind : null))).toEqual(["ACTIVITY", "SIDE_RECOVERY", "ACTIVITY", "WINDOW_REST"]);
  });

  it("T26 : EMOM en alternance — A f1, B f1, A f2, B f2 ; chaque membre a sa fenêtre et sa Série", () => {
    const { plan, sim } = simOf(
      structuredSession({
        elements: [
          {
            kind: "CIRCUIT",
            circuit: {
              id: "c",
              repeatCount: 2,
              nature: "SERIES",
              exercises: [emomExercise("A", variableParameters({ mode: "REPETITIONS", rows: [[10, 0], [12, 0]] }), 60), emomExercise("B", repetitionParameters(8, 2, 0), 90)],
            },
          },
        ],
        stopPoints: [],
      }),
    );
    expect(estimatedDuration(plan)).toEqual({ kind: "exact", ms: (60 + 90) * 2 * S });
    sim.send({ type: "START" }, 0);
    const played: string[] = [];
    let at = 0;
    for (const window of [60, 90, 60, 90]) {
      const spec = sim.state.leaf!.spec;
      played.push(`${spec.exerciseId}${spec.series}:${spec.target?.kind === "NUMBER" ? spec.target.value : "-"}`);
      sim.send({ type: "NEXT", validated: true, target: sim.target }, (at + 20) * S);
      at += window;
      sim.at(at);
    }
    expect(played).toEqual(["A1:10", "B1:8", "A2:12", "B2:8"]);
  });

  it("dans chaque intervalle (Circuit porteur) : au tour k, chaque membre joue sa Série k dans la fenêtre commune", () => {
    const { sim } = simOf(
      structuredSession({
        elements: [
          {
            kind: "CIRCUIT",
            circuit: {
              id: "c",
              repeatCount: 2,
              nature: "TOURS",
              format: { key: "EMOM", settings: { windowSeconds: 60 } },
              exercises: [
                exerciseActivity("A", repetitionParameters(10, 2, 0), { format: { key: "EMOM", settings: {} } }),
                exerciseActivity("B", repetitionParameters(5, 2, 0), { format: { key: "EMOM", settings: {} } }),
              ],
            },
          },
        ],
        stopPoints: [],
      }),
    );
    sim.send({ type: "START" }, 0);
    expect(sim.state.leaf?.spec).toMatchObject({ exerciseId: "A", series: 1 });
    sim.send({ type: "NEXT", validated: true, target: sim.target }, 20 * S);
    expect(sim.state.leaf?.spec).toMatchObject({ exerciseId: "B", series: 1 });
    sim.at(60); // B non terminé : fenêtre 1 non terminée
    expect(windowResults(sim)[0]).toMatchObject({ window: 1, terminated: false, interruptedKey: expect.stringContaining("ex:B") });
    expect(sim.state.leaf?.spec).toMatchObject({ exerciseId: "A", series: 2 });
  });

  it("Arrêt sans Pause (arbitrage du 18/11/2026) : répétitions saisies de la fenêtre en cours, élément arrêté", () => {
    const { sim } = single();
    sim.send({ type: "START" }, 0);
    sim.send({ type: "NEXT", validated: true, target: sim.target }, 30 * S);
    sim.at(70);
    expect(sim.send({ type: "RESET", target: sim.target }, 71 * S).outcome).toBe("REJECTED");
    sim.send({ type: "STOP", payload: { partialRepetitions: 6 }, atMs: 72 * S }, 75 * S);
    expect(sim.state.status).toBe("FINISHED");
    expect(windowResults(sim).map((result) => [result.window, result.terminated, result.partialRepetitions])).toEqual([
      [1, true, null],
      [2, false, 6],
    ]);
    expect(elementResult(sim)).toMatchObject({ played: 2, terminated: 1, stopped: true });
  });

  it("signaux : 3 bips avant l'échéance de la fenêtre, pendant le travail comme pendant le repos", () => {
    const { sim } = single();
    sim.send({ type: "START" }, 0);
    expect(stepSignalsBetween(sim.state, 50 * S, 60 * S).filter((signal) => signal.kind === "COUNTDOWN").map((signal) => signal.atMs)).toEqual([57 * S, 58 * S, 59 * S]);
    sim.send({ type: "NEXT", validated: true, target: sim.target }, 30 * S);
    expect(stepSignalsBetween(sim.state, 50 * S, 60 * S).filter((signal) => signal.kind === "COUNTDOWN").map((signal) => signal.atMs)).toEqual([57 * S, 58 * S, 59 * S]);
  });

  it("invariant « EMOM sans À l'échec » (07/11/2026) : configuration invalide", () => {
    const session = structuredSession({ elements: [{ kind: "EXERCISE", exercise: emomExercise("E", repetitionParameters("FAILURE", 2, 0)) }], stopPoints: [] });
    expect(launchabilityOf(createSessionSnapshot(session))).toMatchObject({ status: "invalid", issues: [{ elementId: "E", reason: "LOCKED_CONSTANT_CHANGED" }] });
  });
});
