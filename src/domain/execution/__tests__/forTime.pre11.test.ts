import { describe, expect, it } from "@jest/globals";

import { durationParameters, repetitionParameters, uniformParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { createSessionSnapshot } from "@/domain/sessions/sessionSnapshot";

import { guidedPhases, launchabilityOf } from "../plan";
import { executionEnv } from "../policies";
import { type ForTimeResult } from "../policies/forTime";
import { projectExecution } from "../projection";
import { exerciseActivity, planOf, Simulation, structuredSession } from "../testing/simulation";

/**
 * PRE-11 (T1) — politique For time (conception consolidée §12.3, §12.5 ; FMT-30 à FMT-32 ; D3, D6, Q4 ; cas T15).
 */

const S = 1000;

function forTimeSession(capSeconds: number | null, extra: { readonly recovery?: number } = {}) {
  return structuredSession({
    elements: [
      {
        kind: "EXERCISE",
        exercise: exerciseActivity("F", repetitionParameters(21, 3, 10), {
          format: { key: "FOR_TIME", settings: capSeconds === null ? {} : { timeCapSeconds: capSeconds } },
          ...(extra.recovery !== undefined ? { postActivityRecoverySeconds: extra.recovery } : {}),
        }),
      },
      { kind: "EXERCISE", exercise: exerciseActivity("B", durationParameters(30, 1, 0)) },
    ],
    stopPoints: [],
  });
}

function simOf(capSeconds: number | null, extra: { readonly recovery?: number } = {}) {
  const plan = planOf(forTimeSession(capSeconds, extra));
  return { plan, sim: new Simulation(executionEnv(plan)) };
}

function forTimeResult(sim: Simulation): ForTimeResult | undefined {
  const change = [...sim.results.values()].find((candidate) => candidate.type === "SCOPE" && (candidate.result as { format?: string }).format === "FOR_TIME");
  return change?.result as ForTimeResult | undefined;
}

describe("PRE-11 T1 — For time", () => {
  // Seconde recette du 17/11/2026 (Hermann : « Temps de repos supprimés en For time ») : ni pause ni récupération dans l'élément.
  // [Pauses dans la portée, récupération après elle — remplacé.]
  it("lançable (Exercice autonome) ; ses Séries forment une portée, sans pause ni récupération", () => {
    const session = forTimeSession(600, { recovery: 60 });
    expect(launchabilityOf(createSessionSnapshot(session))).toEqual({ status: "launchable" });
    const plan = planOf(session);
    const scope = plan.items.find((item) => item.type === "SCOPE");
    expect(scope?.type === "SCOPE" && scope.scope.pilot).toBe("FOR_TIME");
    const config = scope?.type === "SCOPE" ? (scope.scope.config as { capMs: number; items: { type: string; leaf?: { kind: string } }[] }) : null;
    expect(config?.capMs).toBe(600 * S);
    expect(config?.items.map((item) => item.leaf?.kind)).toEqual(["ACTIVITY", "ACTIVITY", "ACTIVITY"]);
    const after = plan.items[plan.items.indexOf(scope!) + 1];
    expect(after?.type === "LEAF" && after.leaf).toMatchObject({ kind: "ACTIVITY", exerciseId: "B" });
  });

  // Correction 4 de Hermann du 14/11/2026 : aucune modale de résultat dans le déroulement normal — la fin normale affiche le temps
  // final (FINAL_TIME_MS), sans saisie, puis enchaîne. [Clôture bloquante en fin normale (D3) — remplacé.]
  // Recette du 14/11/2026 (Hermann : « Il faut supprimer cette fenêtre résultat, passer directement à la pause » ; « Je ne veux pas
  // de cet écran ») : plus d'affichage du temps final. [Temps final affiché 3 s — remplacé.]
  it("fin normale : temps réalisé lu sur le chronomètre (Pause exclue), aucune Clôture, exercice suivant aussitôt", () => {
    const { plan, sim } = simOf(600);
    sim.send({ type: "START" }, 0);
    expect(sim.state.leaf?.spec).toMatchObject({ kind: "ACTIVITY", exerciseId: "F", series: 1 });
    sim.send({ type: "NEXT", target: sim.target }, 40 * S); // S1 en 40 s ; S2 aussitôt (aucune pause de série)
    sim.at(50);
    sim.send({ type: "PAUSE" }, 60 * S);
    sim.send({ type: "RESUME" }, 90 * S); // 30 s de Pause, hors temps réalisé
    sim.send({ type: "NEXT", target: sim.target }, 120 * S); // S2
    sim.at(130);
    // Pendant le travail : le grand chrono compte le temps réalisé de l'élément, l'anneau va jusqu'à la borne.
    const during = projectExecution(plan, sim.state, 135 * S);
    expect(during.format).toMatchObject({ kind: "FOR_TIME", phase: "WORK", capMs: 600 * S, completedActivities: 2, totalActivities: 3 });
    expect(during.timer).toEqual({ kind: "STOPWATCH", elapsedMs: 105 * S, nominalMs: 600 * S });
    sim.send({ type: "NEXT", target: sim.target }, 160 * S); // S3 : fin du travail
    // [Pause après la dernière Série — remplacé, seconde recette du 17/11/2026.] L'Exercice suivant aussitôt.
    expect(sim.state.leaf?.spec).toMatchObject({ kind: "ACTIVITY", exerciseId: "B" });
    expect(forTimeResult(sim)).toMatchObject({ measuredMs: 130 * S, capReached: false, completedActivities: 3, totalActivities: 3, partialRepetitions: null });
  });

  it("borne atteinte : l'étape en cours est fermée, temps réalisé = borne, Clôture avec le partiel du travail interrompu", () => {
    const { plan, sim } = simOf(100);
    sim.send({ type: "START" }, 0);
    sim.send({ type: "NEXT", target: sim.target }, 50 * S); // S1 ; S2 ouverte aussitôt
    sim.at(100); // borne
    expect(sim.state.leaf?.spec.kind).toBe("CLOSURE");
    const closure = projectExecution(plan, sim.state, 100 * S);
    expect(closure.format).toMatchObject({ phase: "CLOSURE", elapsedMs: 100 * S, capReached: true, completedActivities: 1, interrupted: { name: expect.any(String), mode: "REPETITIONS" } });
    sim.send({ type: "SUBMIT", payload: { partialRepetitions: 12 } }, 105 * S);
    expect(forTimeResult(sim)).toMatchObject({ measuredMs: 100 * S, capReached: true, completedActivities: 1, partialRepetitions: 12 });
    const s2 = sim.stepResults().find((step) => step.exerciseId === "F" && step.series === 2);
    expect(s2?.completion).toBe("CLOSED_BY_PARENT");
    expect(sim.state.leaf?.spec).toMatchObject({ kind: "ACTIVITY", exerciseId: "B" });
  });

  it("Q4 : travail confirmé pile à la borne, acquis (fin normale, pas de partiel)", () => {
    const { sim } = simOf(40);
    sim.send({ type: "START" }, 0);
    sim.send({ type: "NEXT", target: sim.target }, 10 * S);
    sim.at(20);
    sim.send({ type: "NEXT", target: sim.target }, 25 * S);
    sim.at(35);
    sim.send({ type: "NEXT", target: sim.target }, 40 * S); // pile à la borne : la commande passe avant l'échéance
    // Recette du 14/11/2026 : aucune Clôture, passage direct à la pause. [Temps final affiché ; Clôture validée par SUBMIT — remplacés.]
    expect(sim.state.leaf?.spec).toMatchObject({ kind: "ACTIVITY", exerciseId: "B" });
    expect(forTimeResult(sim)).toMatchObject({ measuredMs: 40 * S, capReached: false, completedActivities: 3, interruptedKey: null });
  });

  it("sans borne (D6) : aucune échéance d'élément ; le travail se termine à Suivant", () => {
    const { plan, sim } = simOf(null);
    sim.send({ type: "START" }, 0);
    expect(projectExecution(plan, sim.state, 0).format).toMatchObject({ capMs: null });
    expect(sim.state.refs.some((ref) => ref.name === "cap")).toBe(false);
    sim.at(3600);
    expect(sim.state.leaf?.spec).toMatchObject({ kind: "ACTIVITY", series: 1 });
  });
});

describe("PRE-11 — Rôle Tour d'un For time sans guidage des phases (Hermann, 13/11/2026)", () => {
  const phases = [
    { id: 1, label: "Contracter", durationSeconds: 6 },
    { id: 2, label: "Relâcher", durationSeconds: 2 },
  ];
  const member = (id: string, role: number | null) =>
    exerciseActivity(id, uniformParameters({ mode: "REPETITIONS", count: 2, target: 10, workPhases: phases }), {
      format: { key: "FOR_TIME", settings: role === null ? {} : { circuitRole: role } },
    });

  it("buy-in guidé ; membre Tour : ni phase affichée, ni motif de signaux ; Exercice libre inchangé", () => {
    const session = structuredSession({
      elements: [
        { kind: "CIRCUIT", circuit: { id: "c", repeatCount: 2, nature: "SERIES", format: { key: "FOR_TIME", settings: { restBetweenRoundsSeconds: 0 } }, exercises: [member("in", 1), member("t", null)] } },
      ],
      stopPoints: [],
    });
    const launch = launchabilityOf(createSessionSnapshot(session));
    expect(launch).toEqual({ status: "launchable" });
    const plan = planOf(session);
    const sim = new Simulation(executionEnv(plan));
    sim.send({ type: "START" }, 0);
    expect(sim.state.leaf?.spec).toMatchObject({ exerciseId: "in" });
    expect(sim.state.leaf?.spec.phasesSilenced).toBeUndefined();
    expect(projectExecution(plan, sim.state, 1_000).guidance?.label).toBe("Contracter");
    sim.send({ type: "NEXT", target: sim.target }, 5 * S); // buy-in : deux Séries
    sim.send({ type: "NEXT", target: sim.target }, 10 * S);
    expect(sim.state.leaf?.spec).toMatchObject({ exerciseId: "t", phasesSilenced: true });
    const tour = projectExecution(plan, sim.state, 11 * S);
    expect(tour.guidance).toBeNull();
    expect(tour.autoRepetitions).toBeNull();
    expect(guidedPhases(plan, sim.state.leaf!.spec)).toEqual([]);
  });
});

describe("PRE-11 — For time, corrections 3 et 4 (moteur)", () => {
  const session = (parameters: ReturnType<typeof repetitionParameters>) =>
    structuredSession({ elements: [{ kind: "EXERCISE", exercise: exerciseActivity("F", parameters, { format: { key: "FOR_TIME", settings: {} } }) }], stopPoints: [] });

  it("✓ (NEXT validé) : une série en Durée passe Terminée avant son terme, sans confirmation ; une pause est passée", () => {
    // Un For time tout en Durée n’est pas lançable (au moins un exercice en Répétitions) : règle du noyau vérifiée sur un exercice simple.
    const plan = planOf(structuredSession({ elements: [{ kind: "EXERCISE", exercise: exerciseActivity("F", durationParameters(40, 2, 15)) }], stopPoints: [] }));
    const sim = new Simulation(executionEnv(plan));
    sim.send({ type: "START" }, 0);
    sim.send({ type: "NEXT", validated: true, target: sim.target }, 10 * S);
    expect(sim.stepResults().find((step) => step.series === 1)?.completion).toBe("COMPLETED");
    expect(sim.state.leaf?.spec.kind).toBe("SERIES_PAUSE");
    sim.send({ type: "NEXT", validated: true, target: sim.target }, 12 * S);
    expect(sim.state.leaf?.spec).toMatchObject({ kind: "ACTIVITY", series: 2 });
  });

  it("Réinitialiser refusé pendant le travail ; Arrêt : séries terminées et répétitions saisies enregistrées, Pause exclue", () => {
    const plan = planOf(session(repetitionParameters(10, 2, 0)));
    const sim = new Simulation(executionEnv(plan));
    sim.send({ type: "START" }, 0);
    expect(projectExecution(plan, sim.state, 0).commands.reset).toBe(false);
    expect(sim.send({ type: "RESET", target: sim.target }, 1 * S).outcome).toBe("REJECTED");
    sim.send({ type: "NEXT", validated: true, target: sim.target }, 20 * S);
    sim.send({ type: "PAUSE" }, 30 * S);
    sim.send({ type: "STOP", payload: { partialRepetitions: 6 } }, 90 * S);
    expect(sim.state.status).toBe("FINISHED");
    expect(forTimeResult(sim)).toMatchObject({ measuredMs: 30 * S, completedActivities: 1, totalActivities: 2, partialRepetitions: 6, interruptedKey: expect.any(String) });
  });
});
