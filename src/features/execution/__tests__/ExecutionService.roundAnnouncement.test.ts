import { describe, expect, it } from "@jest/globals";

import { repetitionParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { exerciseActivity, structuredSession } from "@/domain/execution/testing/simulation";
import type { StructuredSession } from "@/domain/sessions/SessionRepository";
import { initializeDatabase } from "@/infrastructure/database/initializeDatabase";
import { SqliteExecutionRepository } from "@/infrastructure/database/repositories/SqliteExecutionRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

import { ExecutionService, type ExecutionSignal } from "../ExecutionService";

/**
 * D-530 / RM-269 (Hermann, 18/11/2026) — début de tour transmis aux signaux : au départ du chrono pour le premier tour, à l'appui
 * sur « + Tour » pour les suivants ; rang et objectif de répétitions du tour qui démarre. Dernier appui du For time : aucun tour.
 */

const S = 1000;
const T0 = Date.UTC(2026, 10, 19, 9, 0, 0);

async function flush() {
  for (let i = 0; i < 20; i += 1) await Promise.resolve();
}

function run(session: StructuredSession) {
  const clock = { ms: T0, nowMs: () => clock.ms };
  const timers: { callback: () => void; at: number; id: number }[] = [];
  let next = 0;
  const scheduler = {
    setTimeout: (callback: () => void, delayMs: number) => {
      next += 1;
      timers.push({ callback, at: clock.ms + delayMs, id: next });
      return next;
    },
    clearTimeout: (handle: unknown) => {
      const index = timers.findIndex((timer) => timer.id === handle);
      if (index >= 0) timers.splice(index, 1);
    },
  };
  async function until(ms: number) {
    for (;;) {
      timers.sort((a, b) => a.at - b.at);
      const due = timers[0];
      if (due === undefined || due.at > ms) break;
      timers.shift();
      clock.ms = Math.max(clock.ms, due.at);
      due.callback();
      await flush();
    }
    clock.ms = ms;
  }
  const signals: ExecutionSignal[] = [];
  return { clock, until, signals, scheduler };
}

async function started(session: StructuredSession) {
  const context = run(session);
  const database = NodeSqliteDatabase.openInMemory();
  await initializeDatabase(database);
  const service = new ExecutionService({
    repository: new SqliteExecutionRepository(database),
    clock: context.clock,
    scheduler: context.scheduler,
    newId: () => "exec-rounds",
    loadSession: async () => session,
    onSignal: (signal) => context.signals.push(signal),
  });
  const prepared = await service.prepare(session.id);
  if (prepared.status !== "ready") throw new Error("not ready");
  await service.start(prepared);
  return { ...context, service };
}

const rounds = (signals: readonly ExecutionSignal[]) => signals.filter((signal) => signal.kind === "TRANSITION" && signal.round != null).map((signal) => signal.round);

describe("ExecutionService — début de tour (D-530)", () => {
  it("For time d'un exercice, 3 tours de 21 : premier tour au départ, suivants à « + Tour », rien au dernier appui", async () => {
    const session = structuredSession(
      { elements: [{ kind: "EXERCISE", exercise: exerciseActivity("F", repetitionParameters(21, 3, 0), { format: { key: "FOR_TIME", settings: {} } }) }], stopPoints: [] },
      { initialCountdownSeconds: 5, finalPhaseSeconds: 3 },
    );
    const { service, until, signals } = await started(session);
    await until(T0 + 5 * S);
    expect(rounds(signals)).toEqual([{ rank: 1, repetitions: 21 }]);
    await service.dispatch({ type: "NEXT", validated: true, advance: "ROUND" }, service.project()!.target!);
    expect(rounds(signals)).toEqual([{ rank: 1, repetitions: 21 }, { rank: 2, repetitions: 21 }]);
    // Appui répété sur la même étape (cible périmée) : refusé, aucun tour ni signal de plus.
    const stale = signals.length;
    await service.dispatch({ type: "NEXT", validated: true, advance: "ROUND" }, "périmée");
    expect(signals).toHaveLength(stale);
    await service.dispatch({ type: "NEXT", validated: true, advance: "ROUND" }, service.project()!.target!);
    expect(rounds(signals)).toHaveLength(3);
    // Dernier appui (Succès) : fin de séance, aucune annonce de tour.
    await service.dispatch({ type: "NEXT", validated: true, advance: "ROUND" }, service.project()!.target!);
    expect(rounds(signals)).toHaveLength(3);
    expect(service.project()?.phase).toBe("SESSION_END");
  });

  it("AMRAP d'un exercice, incrément −2 : objectif du tour qui démarre (10, puis 8, puis 6)", async () => {
    const session = structuredSession(
      {
        elements: [{ kind: "EXERCISE", exercise: exerciseActivity("E", repetitionParameters(10, 1, 0), { format: { key: "AMRAP", settings: { durationSeconds: 120, incrementPerRound: -2 } } }) }],
        stopPoints: [],
      },
      { initialCountdownSeconds: 5, finalPhaseSeconds: 3 },
    );
    const { service, until, signals } = await started(session);
    await until(T0 + 5 * S);
    await service.dispatch({ type: "NEXT", validated: true, advance: "ROUND" }, service.project()!.target!);
    await service.dispatch({ type: "NEXT", validated: true, advance: "ROUND" }, service.project()!.target!);
    expect(rounds(signals)).toEqual([
      { rank: 1, repetitions: 10 },
      { rank: 2, repetitions: 8 },
      { rank: 3, repetitions: 6 },
    ]);
  });

  it("hors For time et AMRAP : aucun début de tour", async () => {
    const session = structuredSession(
      { elements: [{ kind: "EXERCISE", exercise: exerciseActivity("A", repetitionParameters(12, 2, 0)) }], stopPoints: [] },
      { initialCountdownSeconds: 5, finalPhaseSeconds: 3 },
    );
    const { service, until, signals } = await started(session);
    await until(T0 + 5 * S);
    await service.dispatch({ type: "NEXT" }, service.project()!.target!);
    expect(rounds(signals)).toEqual([]);
  });
});
