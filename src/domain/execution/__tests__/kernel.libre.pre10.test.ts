import { describe, expect, it } from "@jest/globals";

import { durationParameters, repetitionParameters, uniformParameters, allFailureParameters } from "@/domain/activities/testing/executionParametersFixtures";

import { restoreWithoutContinuity, SAFETY_IDLE_MS, leafElapsedMs, sessionStopwatch, runningMs } from "../kernel";
import { exerciseActivity, planOf, Simulation, structuredSession } from "../testing/simulation";

/**
 * PRE-10.1 — noyau sur les plans Libres (conception consolidée §17 : T01–T08, T21, T24 ; §17.1 R1).
 * Horloge simulée, aucune interface. Les instants sont en ms.
 */

const S = 1000;

function tabataSession() {
  // R1 : A 8×20/10, récupération 1 min, B 8×20/10 ; compte à rebours 10 s.
  return structuredSession(
    {
      elements: [
        { kind: "EXERCISE", exercise: exerciseActivity("A", durationParameters(20, 8, 10), { postActivityRecoverySeconds: 60 }) },
        { kind: "EXERCISE", exercise: exerciseActivity("B", durationParameters(20, 8, 10)) },
      ],
      stopPoints: [],
    },
    { initialCountdownSeconds: 10 },
  );
}

describe("PRE-10 noyau — R1 Tabata À la suite (§17.1)", () => {
  it("530 s + compte à rebours, sans aucune commande ; Fin de séance avant la clôture (T24)", () => {
    const sim = Simulation.libre(planOf(tabataSession()));
    sim.send({ type: "START" }, 0);
    expect(sim.state.leaf?.spec.kind).toBe("INITIAL_COUNTDOWN");
    sim.at(539.999);
    expect(sim.state.status).toBe("RUNNING");
    sim.at(540);
    expect(sim.state.status).toBe("FINISHED");
    expect(sim.state.finish).toEqual({ reason: "COMPLETED", atMs: 540 * S });
    // La dernière Pause de A est remplacée par la récupération ; celle de B est conservée.
    const kinds = sim.startedSteps().map((step) => step.kind);
    expect(kinds.filter((kind) => kind === "ACTIVITY")).toHaveLength(16);
    expect(kinds.filter((kind) => kind === "SERIES_PAUSE")).toHaveLength(15);
    expect(kinds.filter((kind) => kind === "POST_ACTIVITY_RECOVERY")).toHaveLength(1);
    expect(kinds[kinds.length - 1]).toBe("SESSION_END");
    // Chaque étape démarre à l'échéance logique de la précédente (aucun retard ajouté, §8.1).
    const starts = sim.startedSteps().map((step) => step.atMs);
    expect(starts.slice(0, 4)).toEqual([0, 10 * S, 30 * S, 40 * S]);
  });

  it("un seul réveil tardif reconstitue toutes les étapes automatiques à leurs échéances logiques (T08)", () => {
    const sim = Simulation.libre(planOf(tabataSession()));
    sim.send({ type: "START" }, 0);
    sim.at(100.5); // retour au premier plan après 100,5 s
    const started = sim.startedSteps();
    expect(started.every((step) => step.atMs % S === 0)).toBe(true);
    // 10 + 3 × (20 + 10) = 100 : Série 4 de A ouverte à 100 s exactement.
    expect(sim.state.leaf?.spec).toMatchObject({ kind: "ACTIVITY", exerciseId: "A", series: 4 });
    expect(leafElapsedMs(sim.state, sim.now)).toBe(0.5 * S);
  });
});

describe("PRE-10 noyau — ordre du parcours (T01)", () => {
  it("Cycle × 2 : Circuit groupé (2 tours) puis Circuit alterné (2 tours) ; une seule multiplication", () => {
    const one = (id: string) => exerciseActivity(id, repetitionParameters(10, 2, 0));
    const plan = planOf(
      structuredSession({
        elements: [
          {
            kind: "CYCLE",
            cycle: {
              id: "y",
              repeatCount: 2,
              members: [
                { kind: "CIRCUIT", circuit: { id: "g", repeatCount: 2, nature: "TOURS", exercises: [one("A"), one("B")] } },
                { kind: "CIRCUIT", circuit: { id: "a", repeatCount: 2, nature: "SERIES", exercises: [one("C"), one("D")] } },
              ],
            },
          },
        ],
        stopPoints: [],
      }),
    );
    const sim = Simulation.libre(plan);
    sim.send({ type: "START" });
    const order: string[] = [];
    while (sim.state.status === "RUNNING" && sim.state.leaf?.spec.kind === "ACTIVITY") {
      const spec = sim.state.leaf.spec;
      order.push(`${spec.exerciseId}${spec.series}@${spec.context?.cycle?.repetition}.${spec.context?.circuit?.tour}`);
      sim.send({ type: "NEXT", target: sim.target });
    }
    const pass = ["A1@R.1", "A2@R.1", "B1@R.1", "B2@R.1", "A1@R.2", "A2@R.2", "B1@R.2", "B2@R.2", "C1@R.1", "D1@R.1", "C2@R.2", "D2@R.2"];
    expect(order).toEqual([...pass.map((step) => step.replace("R", "1")), ...pass.map((step) => step.replace("R", "2"))]);
    // Fin de séance de 0 s : instantanée, la clôture suit le dernier Exercice.
    expect(sim.state.status).toBe("FINISHED");
  });
});

describe("PRE-10 noyau — fins typées (T02)", () => {
  it("Durée chiffrée : échéance automatique ; Répétitions et À l'échec : Suivant, même avec une estimation", () => {
    const plan = planOf(
      structuredSession({
        elements: [
          { kind: "EXERCISE", exercise: exerciseActivity("d", durationParameters(30)) },
          { kind: "EXERCISE", exercise: exerciseActivity("r", repetitionParameters(10, 1, 0, { cadenceBeepIntervalSeconds: 2 })) },
          { kind: "EXERCISE", exercise: exerciseActivity("f", allFailureParameters(1)) },
        ],
        stopPoints: [],
      }),
    );
    const sim = Simulation.libre(plan);
    sim.send({ type: "START" }, 0);
    sim.at(30);
    expect(sim.state.leaf?.spec.exerciseId).toBe("r");
    expect(sim.state.leaf?.spec.plannedMs).toBe(20 * S); // nominal 10 × 2 s : estimation, pas une fin
    sim.at(500);
    expect(sim.state.leaf?.spec.exerciseId).toBe("r");
    sim.send({ type: "NEXT", target: sim.target });
    expect(sim.step(plan.items[1]!.type === "LEAF" ? plan.items[1].leaf.key : "")?.completion).toBe("COMPLETED");
    expect(sim.state.leaf?.spec.exerciseId).toBe("f");
    sim.send({ type: "NEXT", target: sim.target });
    expect(sim.state.status).toBe("FINISHED");
  });

  it("Suivant avant le terme d'une Durée : confirmation requise, puis Partielle avec la durée réellement exécutée", () => {
    const sim = Simulation.libre(planOf(structuredSession({ elements: [{ kind: "EXERCISE", exercise: exerciseActivity("d", durationParameters(40)) }], stopPoints: [] })));
    sim.send({ type: "START" }, 0);
    expect(sim.send({ type: "NEXT", target: sim.target }, 12 * S)).toMatchObject({ outcome: "REJECTED", reason: "CONFIRMATION_REQUIRED" });
    const key = sim.leafKey!;
    sim.send({ type: "NEXT", target: sim.target, confirmed: true }, 12 * S);
    expect(sim.step(key)).toMatchObject({ completion: "PARTIAL", lastAttemptMs: 12 * S, plannedMs: 40 * S });
  });
});

describe("PRE-10 noyau — phases structurelles", () => {
  it("Suivant pendant le compte à rebours initial et pendant une récupération : passage sans confirmation (recette 09/11), aucun Exercice partiel", () => {
    const sim = Simulation.libre(
      planOf(structuredSession({ elements: [{ kind: "EXERCISE", exercise: exerciseActivity("a", durationParameters(10), { postActivityRecoverySeconds: 30 }) }], stopPoints: [] }, { initialCountdownSeconds: 10 })),
    );
    sim.send({ type: "START" }, 0);
    expect(sim.send({ type: "NEXT", target: sim.target }, 2 * S).outcome).toBe("APPLIED");
    expect(sim.state.leaf?.spec).toMatchObject({ kind: "ACTIVITY", exerciseId: "a" });
    sim.at(12);
    expect(sim.state.leaf?.spec.kind).toBe("POST_ACTIVITY_RECOVERY");
    const key = sim.leafKey!;
    expect(sim.send({ type: "NEXT", target: sim.target }, 15 * S).outcome).toBe("APPLIED");
    expect(sim.step(key)).toMatchObject({ completion: "SKIPPED", lastAttemptMs: 3 * S, plannedMs: 30 * S });
    expect(sim.state.leaf?.spec.kind).not.toBe("POST_ACTIVITY_RECOVERY");
  });
});

describe("PRE-10 noyau — Pause et cadence (T03, T04)", () => {
  it("T03 : Pause de 20 s pendant une Durée — temps restant conservé, reprise sans reset", () => {
    const sim = Simulation.libre(planOf(structuredSession({ elements: [{ kind: "EXERCISE", exercise: exerciseActivity("d", durationParameters(60)) }], stopPoints: [] })));
    sim.send({ type: "START" }, 0);
    sim.send({ type: "PAUSE" }, 25 * S);
    sim.at(45);
    expect(leafElapsedMs(sim.state, sim.now)).toBe(25 * S);
    sim.send({ type: "RESUME" }, 45 * S);
    sim.at(79.999);
    expect(sim.state.leaf?.spec.kind).toBe("ACTIVITY");
    sim.at(80);
    expect(sim.state.status).toBe("FINISHED");
    // Temps de Séance actif : 60 s (la Pause manuelle est exclue).
    expect(runningMs(sessionStopwatch(sim.state)!, sim.now)).toBe(60 * S);
  });

  it("T04 : Pause au milieu d'un intervalle de bip — fraction non acquise, temps actif conservé, bip repris après un intervalle complet", () => {
    const sim = Simulation.libre(
      planOf(structuredSession({ elements: [{ kind: "EXERCISE", exercise: exerciseActivity("r", repetitionParameters(10, 1, 0, { cadenceBeepIntervalSeconds: 4 })) }], stopPoints: [] })),
    );
    sim.send({ type: "START" }, 0);
    sim.send({ type: "PAUSE" }, 10 * S); // 2 intervalles complets + 2 s
    expect(sim.state.leaf?.cadenceAcquired).toBe(2);
    sim.send({ type: "RESUME" }, 30 * S);
    expect(sim.state.leaf?.cadenceAnchorMs).toBe(30 * S);
    expect(leafElapsedMs(sim.state, 31 * S)).toBe(11 * S);
  });
});

describe("PRE-10 noyau — Réinitialiser (T05, T06)", () => {
  it("T05 : 20 s, reset, 35 s → 55 s actifs cumulés et 35 s de dernière tentative ; l'autre côté est préservé", () => {
    const plan = planOf(
      structuredSession({
        elements: [{ kind: "EXERCISE", exercise: exerciseActivity("b", repetitionParameters(10, 1, 0, { sideMode: "RIGHT_LEFT", sideRecoverySeconds: 0 })) }],
        stopPoints: [],
      }),
    );
    const sim = Simulation.libre(plan);
    sim.send({ type: "START" }, 0);
    const side1 = sim.leafKey!;
    sim.send({ type: "NEXT", target: sim.target }, 30 * S); // côté 1 : 30 s
    const side2 = sim.leafKey!;
    expect(side2).not.toBe(side1);
    sim.send({ type: "RESET", target: sim.target }, 50 * S); // 20 s sur le côté 2
    sim.send({ type: "NEXT", target: sim.target }, 85 * S); // 35 s
    expect(sim.step(side2)).toMatchObject({ attempts: 2, lastAttemptMs: 35 * S, cumulativeActiveMs: 55 * S, completion: "COMPLETED" });
    expect(sim.step(side1)).toMatchObject({ attempts: 1, lastAttemptMs: 30 * S });
  });

  it("bilatéral côté par côté : le bloc du côté courant recommence depuis sa première Série (D-029)", () => {
    const sim = Simulation.libre(
      planOf(
        structuredSession({
          elements: [{ kind: "EXERCISE", exercise: exerciseActivity("b", repetitionParameters(10, 2, 0, { sideMode: "RIGHT_LEFT", sideOrder: "BY_SIDE" })) }],
          stopPoints: [],
        }),
      ),
    );
    sim.send({ type: "START" }, 0);
    const s1 = sim.leafKey!;
    sim.send({ type: "NEXT", target: sim.target }, 10 * S); // S1 côté 1
    sim.send({ type: "RESET", target: sim.target }, 15 * S); // pendant S2 côté 1
    expect(sim.leafKey).toBe(s1);
    sim.send({ type: "NEXT", target: sim.target }, 20 * S);
    expect(sim.step(s1)).toMatchObject({ attempts: 2, lastAttemptMs: 5 * S, cumulativeActiveMs: 15 * S });
  });

  it("T06 : une commande visant la tentative précédente (callback ou confirmation ancienne) est sans effet", () => {
    const sim = Simulation.libre(planOf(structuredSession({ elements: [{ kind: "EXERCISE", exercise: exerciseActivity("d", durationParameters(60)) }], stopPoints: [] })));
    sim.send({ type: "START" }, 0);
    const before = sim.target;
    sim.send({ type: "RESET", target: before }, 10 * S);
    expect(sim.send({ type: "NEXT", target: before, confirmed: true }, 11 * S)).toMatchObject({ outcome: "IGNORED", reason: "STALE_TARGET" });
    expect(sim.state.leaf?.attempt).toBe(2);
    // L'échéance est celle de la nouvelle tentative (10 + 60), pas l'ancienne (60).
    sim.at(60);
    expect(sim.state.status).toBe("RUNNING");
    sim.at(70);
    expect(sim.state.status).toBe("FINISHED");
  });

  it("commande dupliquée (même identifiant) : une seule application", () => {
    const sim = Simulation.libre(planOf(structuredSession({ elements: [{ kind: "EXERCISE", exercise: exerciseActivity("r", repetitionParameters(10, 3, 0)) }], stopPoints: [] })));
    sim.send({ type: "START" }, 0);
    const first = sim.target;
    sim.send({ type: "NEXT", commandId: "c1", target: first }, 5 * S);
    expect(sim.send({ type: "NEXT", commandId: "c1", target: first }, 5 * S)).toMatchObject({ outcome: "IGNORED", reason: "DUPLICATE" });
    expect(sim.state.leaf?.spec.series).toBe(2);
  });
});

describe("PRE-10 noyau — Point d'arrêt, arrêt et sécurité (T21)", () => {
  it("Point d'arrêt : attente sans échéance jusqu'à Continuer", () => {
    const sim = Simulation.libre(
      planOf(
        structuredSession({
          elements: [
            { kind: "EXERCISE", exercise: exerciseActivity("a", durationParameters(10)) },
            { kind: "EXERCISE", exercise: exerciseActivity("b", durationParameters(10)) },
          ],
          stopPoints: [{ id: "p", circuitId: null, position: 1 }],
        }),
      ),
    );
    sim.send({ type: "START" }, 0);
    sim.at(10);
    expect(sim.state.leaf?.spec.kind).toBe("STOP_POINT");
    sim.at(3600);
    expect(sim.state.leaf?.spec.kind).toBe("STOP_POINT");
    sim.send({ type: "NEXT", target: sim.target }, 3600 * S);
    expect(sim.state.leaf?.spec.exerciseId).toBe("b");
  });

  it("l'attente au Point d'arrêt ne compte pas dans le temps de Séance, y compris après une Pause (arbitrage du 09/11/2026)", () => {
    const sim = Simulation.libre(
      planOf(
        structuredSession({
          elements: [
            { kind: "EXERCISE", exercise: exerciseActivity("a", durationParameters(10)) },
            { kind: "EXERCISE", exercise: exerciseActivity("b", durationParameters(10)) },
          ],
          stopPoints: [{ id: "p", circuitId: null, position: 1 }],
        }),
      ),
    );
    sim.send({ type: "START" }, 0);
    sim.at(10);
    expect(sim.state.leaf?.spec.kind).toBe("STOP_POINT");
    sim.at(100);
    expect(runningMs(sessionStopwatch(sim.state)!, sim.now)).toBe(10 * S);
    sim.send({ type: "PAUSE" }, 100 * S);
    sim.send({ type: "RESUME" }, 200 * S);
    sim.at(300);
    expect(runningMs(sessionStopwatch(sim.state)!, sim.now)).toBe(10 * S);
    sim.send({ type: "NEXT", target: sim.target }, 300 * S);
    sim.at(305);
    expect(runningMs(sessionStopwatch(sim.state)!, sim.now)).toBe(15 * S);
    sim.at(310);
    expect(sim.state.status).toBe("FINISHED");
    expect(runningMs(sessionStopwatch(sim.state)!, sim.now)).toBe(20 * S);
  });

  it("Arrêter la séance : seulement depuis la Pause ; étape en cours conservée comme interrompue", () => {
    const sim = Simulation.libre(planOf(structuredSession({ elements: [{ kind: "EXERCISE", exercise: exerciseActivity("d", durationParameters(60)) }], stopPoints: [] })));
    sim.send({ type: "START" }, 0);
    expect(sim.send({ type: "STOP" }, 5 * S)).toMatchObject({ outcome: "REJECTED", reason: "NOT_PAUSED" });
    const key = sim.leafKey!;
    sim.send({ type: "PAUSE" }, 20 * S);
    sim.send({ type: "STOP" }, 30 * S);
    expect(sim.state).toMatchObject({ status: "FINISHED", finish: { reason: "STOPPED" } });
    expect(sim.step(key)).toMatchObject({ completion: "INTERRUPTED", lastAttemptMs: 20 * S });
  });

  it("pause de sécurité 2 h sans interaction (À l'échec, RM-069), à l'instant logique ; le temps n'avance plus", () => {
    const sim = Simulation.libre(planOf(structuredSession({ elements: [{ kind: "EXERCISE", exercise: exerciseActivity("f", allFailureParameters(1)) }], stopPoints: [] })));
    sim.send({ type: "START" }, 0);
    sim.advance(SAFETY_IDLE_MS + 60 * 60 * S);
    expect(sim.state).toMatchObject({ status: "PAUSED", pause: { reason: "SAFETY", atMs: SAFETY_IDLE_MS } });
    expect(leafElapsedMs(sim.state, sim.now)).toBe(SAFETY_IDLE_MS);
  });
});

describe("PRE-10 noyau — reprise sans continuité temporelle (Q6)", () => {
  it("remise à l'étape en cours, en pause, sans rien déduire du temps écoulé", () => {
    const sim = Simulation.libre(
      planOf(structuredSession({ elements: [{ kind: "EXERCISE", exercise: exerciseActivity("d", uniformParameters({ mode: "DURATION", target: 60, count: 2, pauseSeconds: 10 })) }], stopPoints: [] })),
    );
    sim.send({ type: "START" }, 0);
    sim.at(30);
    const restored = restoreWithoutContinuity(sim.state);
    expect(restored).toMatchObject({ status: "PAUSED", pause: { reason: "RESTORE" } });
    expect(restored.leaf?.spec.key).toBe(sim.leafKey);
    expect(leafElapsedMs(restored, 10_000 * S)).toBe(0);
    expect(restored.leaf?.priorAttemptsMs).toBe(30 * S);
  });
});
