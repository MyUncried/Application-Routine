import { describe, expect, it } from "@jest/globals";

import { createInitialState, libreEnv, type EngineState } from "../kernel";
import type { ChildSpec, ExecutablePlan, LeafSpec } from "../plan";
import { Simulation } from "../testing/simulation";
import { amrapScope, emomScope, TEST_PILOTS, type EmomWindowResult, type TestAmrapConfig, type TestEmomConfig } from "../testing/testPolicies";

/**
 * PRE-10 — contrats du noyau éprouvés par les politiques de test AMRAP et EMOM (conception §17 :
 * T10–T12, T23, T25–T27 ; §17.1 R2–R6, R11). Horloge simulée ; aucune interface ; politiques de test
 * non raccordées à l'application (PRE-11 livre les politiques métier).
 */

const S = 1000;
const MIN = 60 * S;

function leaf(spec: Omit<LeafSpec, "contribution"> & Partial<Pick<LeafSpec, "contribution">>): ChildSpec {
  return { type: "LEAF", leaf: { contribution: "exact", ...spec } };
}

function plan(items: readonly ChildSpec[]): ExecutablePlan {
  return { planVersion: 1, sessionId: "s", sessionName: "Test", items, exercises: {} };
}

const countdown = (seconds: number) => leaf({ kind: "INITIAL_COUNTDOWN", key: "countdown", end: "TIMED", plannedMs: seconds * S });
const end = leaf({ kind: "SESSION_END", key: "final-phase", end: "TIMED", plannedMs: 0 });

function sim(items: readonly ChildSpec[]): Simulation {
  return new Simulation(libreEnv(plan(items), TEST_PILOTS));
}

const R3: TestAmrapConfig = {
  blocks: 3,
  blockMs: 12 * MIN,
  restBetweenBlocksMs: 2 * MIN,
  buyIn: { id: "buyin", workMs: null, target: 50 },
  members: [
    { id: "A", workMs: null, target: 10, increment: 2 },
    { id: "B", workMs: null },
  ],
};

/** Joue `rounds` tours complets de A puis B, chaque membre confirmé après `memberSeconds`. */
function playRounds(s: Simulation, rounds: number, memberSeconds: number) {
  for (let round = 0; round < rounds * 2; round += 1) {
    s.send({ type: "NEXT", target: s.target }, s.now + memberSeconds * S);
  }
}

describe("PRE-10 noyau × politique de test AMRAP — R3, R4, R5, R6, T12, T25, T27", () => {
  it("R3 : bloc 1 borné à 12:10, Clôture à la fin du tour 6 pendant A, repos jusqu'à 14:40, bloc 2 sans buy-in, A revient à 10", () => {
    const s = sim([countdown(10), { type: "SCOPE", scope: amrapScope("amrap", R3) }, end]);
    s.send({ type: "START" }, 0);
    s.at(10);
    expect(s.state.leaf?.spec.key).toBe("amrap/b1/buy-in/buyin");
    expect(s.state.refs.find((ref) => ref.owner === "amrap")).toMatchObject({ role: "DEADLINE", anchorMs: 10 * S, budgetMs: 12 * MIN });
    s.send({ type: "NEXT", target: s.target }, 70 * S); // buy-in 50 fini à 1:10
    playRounds(s, 5, 50); // 5 tours de 100 s → 9:30
    expect(s.state.leaf?.spec).toMatchObject({ exerciseId: "A", series: 6, target: { kind: "NUMBER", value: 20 } });
    s.at(12 * 60 + 9.999);
    expect(s.state.leaf?.spec.exerciseId).toBe("A");
    s.at(12 * 60 + 10);
    expect(s.state.leaf?.spec).toMatchObject({ kind: "CLOSURE", end: "INTERACTION" });
    expect(s.step("amrap/b1/r6/A")).toMatchObject({ completion: "CLOSED_BY_PARENT" });
    // Clôture bloquante : aucune référence du bloc suivant n'est ouverte pendant la saisie.
    s.at(12 * 60 + 30);
    expect(s.state.refs.filter((ref) => ref.owner === "amrap")).toHaveLength(0);
    s.send({ type: "SUBMIT", target: s.target, payload: { partialRepetitions: 7 } }, (12 * 60 + 40) * S);
    expect(s.results.get("SCOPE:amrap/b1")).toMatchObject({ result: { completedRounds: 5, partialRepetitions: 7 } });
    expect(s.state.leaf?.spec).toMatchObject({ kind: "BLOCK_REST", plannedMs: 2 * MIN });
    s.at(14 * 60 + 40);
    expect(s.state.leaf?.spec).toMatchObject({ key: "amrap/b2/r1/A", target: { kind: "NUMBER", value: 10 } });
    expect(s.state.refs.find((ref) => ref.owner === "amrap")).toMatchObject({ anchorMs: (14 * 60 + 40) * S });
  });

  it("R4 : échéance pendant la récupération de B — récupération fermée à l'échéance, motif « échéance du parent » ; 0 au tour entamé", () => {
    const config: TestAmrapConfig = { ...R3, buyIn: undefined, members: [R3.members[0]!, { id: "B", workMs: null, recoveryMs: 30 * S }] };
    const s = sim([{ type: "SCOPE", scope: amrapScope("amrap", config) }, end]);
    s.send({ type: "START" }, 0);
    // 6 tours de 110 s (A 40 s, B 40 s, récupération 30 s) = 11:00 ; tour 7 : A jusqu'11:40, B jusqu'11:50.
    for (let round = 0; round < 7; round += 1) {
      s.send({ type: "NEXT", target: s.target }, s.now + 40 * S); // A
      s.send({ type: "NEXT", target: s.target }, s.now + (round < 6 ? 40 : 10) * S); // B, puis 30 s de récupération
      if (round < 6) s.at(s.now / S + 30);
    }
    expect(s.state.leaf?.spec.kind).toBe("POST_ACTIVITY_RECOVERY");
    s.at(12 * 60);
    expect(s.step(`amrap/b1/r7/B/recovery`)).toMatchObject({ completion: "CLOSED_BY_PARENT", endedAtMs: 12 * MIN });
    s.send({ type: "SUBMIT", target: s.target, payload: { partialRepetitions: 0 } }, 12 * MIN);
    expect(s.results.get("SCOPE:amrap/b1")).toMatchObject({ result: { completedRounds: 7, partialRepetitions: 0 } });
  });

  it("R5 : Pause de 3 min à 20:00 dans le bloc 2 — échéance reculée de 3 min, temps restant d'étape conservé", () => {
    const s = sim([countdown(10), { type: "SCOPE", scope: amrapScope("amrap", R3) }, end]);
    s.send({ type: "START" }, 0);
    s.at(10);
    s.send({ type: "NEXT", target: s.target }, 70 * S);
    playRounds(s, 5, 50);
    s.at(12 * 60 + 10);
    s.send({ type: "SUBMIT", target: s.target, payload: { partialRepetitions: 7 } }, (12 * 60 + 40) * S);
    s.at(14 * 60 + 40); // bloc 2 ouvert, échéance prévue à 26:40
    s.send({ type: "PAUSE" }, 20 * MIN);
    s.send({ type: "RESUME" }, 23 * MIN);
    s.at(29 * 60 + 39.999);
    expect(s.state.leaf?.spec.kind).toBe("ACTIVITY");
    s.at(29 * 60 + 40);
    expect(s.state.leaf?.spec).toMatchObject({ kind: "CLOSURE", key: "amrap/b2/closure" });
  });

  it("R6 / T09 : application fermée à 20:00, relancée à 20:40 — état candidat reconstruit, échéance courue pendant l'absence", () => {
    const s = sim([countdown(10), { type: "SCOPE", scope: amrapScope("amrap", R3) }, end]);
    s.send({ type: "START" }, 0);
    s.at(10);
    s.send({ type: "NEXT", target: s.target }, 70 * S);
    playRounds(s, 5, 50);
    s.at(12 * 60 + 10);
    s.send({ type: "SUBMIT", target: s.target, payload: { partialRepetitions: 7 } }, (12 * 60 + 40) * S);
    s.at(20 * 60);
    // Checkpoint persisté (sérialisation JSON) puis relu par un nouveau processus.
    const checkpoint = JSON.parse(JSON.stringify(s.state)) as EngineState;
    const relaunched = new Simulation(s.env);
    relaunched.state = checkpoint;
    relaunched.now = 20 * MIN;
    relaunched.send({ type: "TICK" }, (26 * 60 + 41) * S); // reprise après l'échéance du bloc 2 (26:40)
    expect(relaunched.state.leaf?.spec.key).toBe("amrap/b2/closure");
    expect(relaunched.step("amrap/b2/r1/A")).toMatchObject({ completion: "CLOSED_BY_PARENT", endedAtMs: (26 * 60 + 40) * S });
  });

  it("T12 : AMRAP 12 min, maintien de 40 s commencé à 11:50 — la borne ferme la portée à 12:00, sans attendre 12:30", () => {
    const config: TestAmrapConfig = { blocks: 1, blockMs: 12 * MIN, restBetweenBlocksMs: 0, members: [{ id: "R", workMs: null }, { id: "H", workMs: 40 * S }] };
    const s = sim([{ type: "SCOPE", scope: amrapScope("amrap", config) }, end]);
    s.send({ type: "START" }, 0);
    s.send({ type: "NEXT", target: s.target }, (11 * 60 + 50) * S); // R jusqu'à 11:50
    expect(s.state.leaf?.spec.exerciseId).toBe("H");
    s.at(12 * 60);
    expect(s.step("amrap/b1/r1/H")).toMatchObject({ completion: "CLOSED_BY_PARENT", lastAttemptMs: 10 * S });
    expect(s.state.leaf?.spec.kind).toBe("CLOSURE");
  });

  it("T25 : retour au premier plan après l'échéance du bloc, membre en attente de Suivant — fermé non validé, Clôture présentée, rien d'autre ne s'ouvre", () => {
    const s = sim([{ type: "SCOPE", scope: amrapScope("amrap", { ...R3, buyIn: undefined, blocks: 2 }) }, end]);
    s.send({ type: "START" }, 0);
    s.send({ type: "NEXT", target: s.target }, 30 * S);
    s.at(60 * 60); // une heure plus tard
    expect(s.step("amrap/b1/r1/B")).toMatchObject({ completion: "CLOSED_BY_PARENT", endedAtMs: 12 * MIN });
    expect(s.state.leaf?.spec.kind).toBe("CLOSURE");
    // La Clôture bloque l'enchaînement : le repos entre blocs part de la validation (D3).
    s.send({ type: "SUBMIT", target: s.target, payload: { partialRepetitions: 3 } }, 61 * MIN);
    expect(s.state.leaf?.spec).toMatchObject({ kind: "BLOCK_REST" });
    expect(s.startedSteps().at(-1)).toMatchObject({ kind: "BLOCK_REST", atMs: 61 * MIN });
  });

  it("T27 / R11 : validation de la Clôture → élément suivant ouvert automatiquement ; un Point d'arrêt l'empêche ; Point avant l'AMRAP sans référence active", () => {
    const one: TestAmrapConfig = { ...R3, buyIn: undefined, blocks: 1 };
    const stop = (key: string) => leaf({ kind: "STOP_POINT", key, end: "WAIT", plannedMs: null, contribution: "omitted" });
    const next = leaf({ kind: "ACTIVITY", key: "after", end: "TIMED", plannedMs: 30 * S, exerciseId: "C" });
    const next2 = leaf({ kind: "ACTIVITY", key: "after-2", end: "TIMED", plannedMs: 30 * S, exerciseId: "C" });
    const s = sim([stop("p0"), { type: "SCOPE", scope: amrapScope("amrap", one) }, next, stop("p1"), next2, end]);
    s.send({ type: "START" }, 0);
    expect(s.state.leaf?.spec.kind).toBe("STOP_POINT");
    s.at(30 * 60);
    expect(s.state.refs.filter((ref) => ref.role === "DEADLINE")).toHaveLength(0);
    s.send({ type: "NEXT", target: s.target }, 30 * MIN); // Continuer
    expect(s.state.refs.find((ref) => ref.role === "DEADLINE")).toMatchObject({ anchorMs: 30 * MIN });
    s.at(42 * 60);
    s.send({ type: "SUBMIT", target: s.target, payload: { partialRepetitions: 0 } }, 43 * MIN);
    expect(s.state.leaf?.spec.key).toBe("after");
    expect(s.startedSteps().at(-1)).toMatchObject({ key: "after", atMs: 43 * MIN });
    s.at(43 * 60 + 30);
    expect(s.state.leaf?.spec.kind).toBe("STOP_POINT");
  });

  it("Q2 : Réinitialiser refusé dans un AMRAP ; Q3 : Suivant autorisé pendant une récupération, l'échéance continue", () => {
    const config: TestAmrapConfig = { blocks: 1, blockMs: 12 * MIN, restBetweenBlocksMs: 0, members: [{ id: "A", workMs: null, recoveryMs: 60 * S }] };
    const s = sim([{ type: "SCOPE", scope: amrapScope("amrap", config) }, end]);
    s.send({ type: "START" }, 0);
    expect(s.send({ type: "RESET", target: s.target }, 5 * S)).toMatchObject({ outcome: "REJECTED", reason: "NOT_ALLOWED" });
    s.send({ type: "NEXT", target: s.target }, 20 * S);
    expect(s.state.leaf?.spec.kind).toBe("POST_ACTIVITY_RECOVERY");
    s.send({ type: "NEXT", target: s.target, confirmed: true }, 30 * S);
    expect(s.state.leaf?.spec.key).toBe("amrap/b1/r2/A");
    expect(s.state.refs.find((ref) => ref.role === "DEADLINE")).toMatchObject({ anchorMs: 0, budgetMs: 12 * MIN });
  });
});

describe("PRE-10 noyau — événements simultanés (T23)", () => {
  const config: TestAmrapConfig = { blocks: 1, blockMs: 12 * MIN, restBetweenBlocksMs: 0, members: [{ id: "R", workMs: null }, { id: "H", workMs: 40 * S }, { id: "Z", workMs: null }] };

  function scenario(ticks: readonly number[]) {
    const s = sim([{ type: "SCOPE", scope: amrapScope("amrap", config) }, end]);
    s.send({ type: "START" }, 0);
    s.send({ type: "NEXT", target: s.target }, (11 * 60 + 20) * S); // H de 11:20 à 12:00 = échéance du bloc
    for (const tick of ticks) s.at(tick);
    return s;
  }

  it("fin d'étape et échéance du bloc au même instant : l'étape est acquise, aucune étape suivante n'est ouverte, Clôture", () => {
    const s = scenario([12 * 60]);
    expect(s.step("amrap/b1/r1/H")).toMatchObject({ completion: "COMPLETED", lastAttemptMs: 40 * S });
    expect(s.startedSteps().some((step) => step.key === "amrap/b1/r1/Z")).toBe(false);
    expect(s.state.leaf?.spec.kind).toBe("CLOSURE");
  });

  it("même résultat quel que soit le découpage des réveils (un seul, plusieurs, tardif)", () => {
    const strip = (s: Simulation) => ({ leaf: s.state.leaf, refs: s.state.refs, results: [...s.results.entries()].sort() });
    const reference = strip(scenario([13 * 60]));
    expect(strip(scenario([11 * 60 + 59, 12 * 60, 13 * 60]))).toEqual(reference);
    expect(strip(scenario([11 * 60 + 40, 11 * 60 + 59.5, 12 * 60 + 0.001, 13 * 60]))).toEqual(reference);
  });
});

describe("PRE-10 noyau × politique de test EMOM — T10, T11, T26, R2, Q4", () => {
  const windows = (s: Simulation) =>
    [...s.results.values()].flatMap((change) => (change.type === "SCOPE" && /\/f\d+$/.test(change.key) ? [change.result as EmomWindowResult] : [])).sort((a, b) => a.window - b.window);

  it("T11 : travail terminé à 35 s dans une fenêtre de 60 s — 25 s de repos, aucune transition à 35 s, fenêtre suivante à 60 s", () => {
    const config: TestEmomConfig = { windowMs: 60 * S, windows: 3, organization: "EACH_INTERVAL", members: [{ id: "A", workMs: null }] };
    const s = sim([{ type: "SCOPE", scope: emomScope("emom", config) }, end]);
    s.send({ type: "START" }, 0);
    s.send({ type: "NEXT", target: s.target }, 35 * S);
    expect(s.state.leaf?.spec).toMatchObject({ kind: "WINDOW_REST", end: "PARENT" });
    expect(s.state.refs.find((ref) => ref.role === "WINDOW")).toMatchObject({ anchorMs: 0, budgetMs: 60 * S });
    s.at(59.999);
    expect(s.state.leaf?.spec.kind).toBe("WINDOW_REST");
    s.at(60);
    expect(s.state.leaf?.spec.key).toBe("emom/f2/A#2");
    expect(s.startedSteps().at(-1)?.atMs).toBe(60 * S);
    expect(windows(s)[0]).toMatchObject({ window: 1, terminated: true });
  });

  it("R2 : 6 × 1 min, A puis B ; f4 B fini à 0:52 (8 s de repos) ; f5 B non fini — non terminée, f6 à l'heure ; 5/6", () => {
    const config: TestEmomConfig = { windowMs: 60 * S, windows: 6, organization: "EACH_INTERVAL", members: [{ id: "A", workMs: null }, { id: "B", workMs: null }] };
    const s = sim([{ type: "SCOPE", scope: emomScope("emom", config) }, end]);
    s.send({ type: "START" }, 0);
    for (let window = 0; window < 6; window += 1) {
      const base = window * 60;
      s.send({ type: "NEXT", target: s.target }, (base + 20) * S); // A
      if (window === 3) s.send({ type: "NEXT", target: s.target }, (base + 52) * S);
      else if (window !== 4) s.send({ type: "NEXT", target: s.target }, (base + 45) * S);
      if (window === 3) {
        expect(s.state.leaf?.spec.kind).toBe("WINDOW_REST");
      }
      s.at(base + 60);
    }
    const result = windows(s);
    expect(result.map((window) => window.terminated)).toEqual([true, true, true, true, false, true]);
    expect(result.filter((window) => window.terminated)).toHaveLength(5);
    expect(s.step("emom/f5/B#5")).toMatchObject({ completion: "CLOSED_BY_PARENT", endedAtMs: 5 * MIN });
    expect(s.startedSteps().find((step) => step.key === "emom/f6/A#6")?.atMs).toBe(5 * MIN);
  });

  it("T26 : EMOM alterné A f1 → B f1 → A f2 → B f2, rang propre à chaque membre ; reprise après suspension au bon mouvement et au bon rang", () => {
    const config: TestEmomConfig = { windowMs: 60 * S, windows: 3, organization: "ALTERNATED", members: [{ id: "A", workMs: null }, { id: "B", workMs: null }] };
    const s = sim([{ type: "SCOPE", scope: emomScope("emom", config) }, end]);
    s.send({ type: "START" }, 0);
    expect(s.state.leaf?.spec).toMatchObject({ exerciseId: "A", series: 1 });
    s.send({ type: "NEXT", target: s.target }, 20 * S);
    const staleB = (() => {
      s.at(60);
      return s.target;
    })();
    expect(s.state.leaf?.spec).toMatchObject({ exerciseId: "B", series: 1 });
    // Mise en arrière-plan de 1:00 à 2:30, puis checkpoint relu par un nouveau processus.
    const relaunched = new Simulation(s.env);
    relaunched.state = JSON.parse(JSON.stringify(s.state)) as EngineState;
    relaunched.now = s.now;
    relaunched.at(150);
    expect(relaunched.state.leaf?.spec).toMatchObject({ exerciseId: "A", series: 2, key: "emom/f3/A#2" });
    // Une confirmation tardive de la fenêtre de B ne s'applique ni à B ni à la fenêtre courante (T10).
    expect(relaunched.send({ type: "NEXT", target: staleB }, 150 * S)).toMatchObject({ outcome: "IGNORED" });
    relaunched.send({ type: "NEXT", target: relaunched.target }, 160 * S);
    relaunched.at(180);
    expect(relaunched.state.leaf?.spec).toMatchObject({ exerciseId: "B", series: 2 });
    const order = relaunched.startedSteps().concat(s.startedSteps()).filter((step) => step.kind === "ACTIVITY").map((step) => step.key);
    expect([...new Set(order)].sort()).toEqual(["emom/f1/A#1", "emom/f2/B#1", "emom/f3/A#2", "emom/f4/B#2"]);
    for (const [key, change] of s.results) if (!relaunched.results.has(key)) relaunched.results.set(key, change);
    const result = windows(relaunched);
    expect(result.map((window) => [window.member, window.rank, window.terminated])).toEqual([
      ["A", 1, true],
      ["B", 1, false],
      ["A", 2, true],
    ]);
  });

  it("T10 : deux confirmations de la même fenêtre — une acquisition, aucune acquisition implicite de la suivante", () => {
    const config: TestEmomConfig = { windowMs: 60 * S, windows: 2, organization: "EACH_INTERVAL", members: [{ id: "A", workMs: null }] };
    const s = sim([{ type: "SCOPE", scope: emomScope("emom", config) }, end]);
    s.send({ type: "START" }, 0);
    const target = s.target;
    s.send({ type: "NEXT", commandId: "tap-1", target }, 30 * S);
    expect(s.send({ type: "NEXT", commandId: "tap-2", target }, 31 * S)).toMatchObject({ outcome: "IGNORED", reason: "STALE_TARGET" });
    expect(s.send({ type: "NEXT", commandId: "tap-1", target }, 31 * S)).toMatchObject({ outcome: "IGNORED", reason: "DUPLICATE" });
    s.at(60);
    s.at(120);
    expect(windows(s).map((window) => window.terminated)).toEqual([true, false]);
  });

  it("Q4 : travail confirmé exactement à l'échéance de la fenêtre — acquis", () => {
    const config: TestEmomConfig = { windowMs: 60 * S, windows: 2, organization: "EACH_INTERVAL", members: [{ id: "A", workMs: null }] };
    const s = sim([{ type: "SCOPE", scope: emomScope("emom", config) }, end]);
    s.send({ type: "START" }, 0);
    s.send({ type: "NEXT", target: s.target }, 60 * S);
    expect(windows(s)[0]).toMatchObject({ window: 1, terminated: true });
    expect(s.state.leaf?.spec.key).toBe("emom/f2/A#2");
  });
});

describe("PRE-10 noyau — état initial", () => {
  it("prêt, sans référence ni portée", () => {
    expect(createInitialState("e")).toMatchObject({ status: "READY", frames: [], refs: [], leaf: null });
  });
});
