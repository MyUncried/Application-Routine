import { beforeEach, describe, expect, it } from "@jest/globals";

import { durationParameters, repetitionParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { StepResult } from "@/domain/execution/kernel";
import { exerciseActivity, structuredSession } from "@/domain/execution/testing/simulation";
import type { StructuredSession } from "@/domain/sessions/SessionRepository";
import type { Database } from "@/infrastructure/database/Database";
import { initializeDatabase } from "@/infrastructure/database/initializeDatabase";
import { SqliteExecutionRepository } from "@/infrastructure/database/repositories/SqliteExecutionRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

import { ExecutionBlockedError, ExecutionService, type ExecutionSignal } from "../ExecutionService";

/**
 * PRE-10.2 — runtime du moteur sur une base SQLite réelle (Node) : lancement depuis une Séance, checkpoint
 * et résultats atomiques, interruption du processus et choix de reprise (T09, §12.33), reprise sans
 * continuité (Q6), erreur de sauvegarde puis réémission sans doublon (T20), réveils périmés (T06), aucun
 * signal rattrapé (T08). Horloge et ordonnanceur simulés.
 */

const S = 1000;
const T0 = Date.UTC(2026, 10, 9, 18, 0, 0);

class FakeClock {
  ms = T0;
  nowMs = () => this.ms;
}

class FakeScheduler {
  timers: { callback: () => void; at: number; id: number }[] = [];
  private next = 0;
  constructor(private readonly clock: FakeClock) {}
  setTimeout = (callback: () => void, delayMs: number) => {
    const id = (this.next += 1);
    this.timers.push({ callback, at: this.clock.ms + delayMs, id });
    return id;
  };
  clearTimeout = (handle: unknown) => {
    this.timers = this.timers.filter((timer) => timer.id !== handle);
  };
  /** Avance l'horloge en déclenchant les réveils dus (application au premier plan). */
  async runUntil(ms: number) {
    for (;;) {
      const due = this.timers.filter((timer) => timer.at <= ms).sort((a, b) => a.at - b.at)[0];
      if (due === undefined) break;
      this.timers = this.timers.filter((timer) => timer !== due);
      this.clock.ms = Math.max(this.clock.ms, due.at);
      due.callback();
      await flush();
    }
    this.clock.ms = ms;
  }
}

async function flush() {
  for (let i = 0; i < 20; i += 1) await Promise.resolve();
}

/** Base qui peut faire échouer la prochaine sauvegarde de checkpoint (injection d'échec). */
function failingSaves(inner: Database) {
  const control = { failNext: false };
  const wrap = (handle: Database): Database => ({
    execAsync: (source) => handle.execAsync(source),
    runAsync: async (source, parameters) => {
      if (control.failNext && /^\s*INSERT INTO execution_results/.test(source)) {
        control.failNext = false;
        throw new Error("Injected failure");
      }
      return handle.runAsync(source, parameters);
    },
    getFirstAsync: (source, parameters) => handle.getFirstAsync(source, parameters),
    getAllAsync: (source, parameters) => handle.getAllAsync(source, parameters),
    withExclusiveTransactionAsync: (task) => handle.withExclusiveTransactionAsync(async (transaction) => task(wrap(transaction))),
  });
  return { database: wrap(inner), control };
}

function session(): StructuredSession {
  return structuredSession(
    {
      elements: [
        { kind: "EXERCISE", exercise: exerciseActivity("A", durationParameters(30, 2, 10), { postActivityRecoverySeconds: 20 }) },
        { kind: "EXERCISE", exercise: exerciseActivity("B", repetitionParameters(12, 1, 0)) },
      ],
      stopPoints: [],
    },
    { initialCountdownSeconds: 5, finalPhaseSeconds: 3 },
  );
}

describe("PRE-10 ExecutionService", () => {
  let raw: NodeSqliteDatabase;
  let clock: FakeClock;
  let scheduler: FakeScheduler;
  let signals: ExecutionSignal[];
  let ids: number;

  const service = (database: Database = raw) =>
    new ExecutionService({
      repository: new SqliteExecutionRepository(database),
      clock,
      scheduler,
      newId: () => `exec-${(ids += 1)}`,
      loadSession: async () => session(),
      onSignal: (signal) => signals.push(signal),
    });

  beforeEach(async () => {
    raw = NodeSqliteDatabase.openInMemory();
    await initializeDatabase(raw);
    clock = new FakeClock();
    scheduler = new FakeScheduler(clock);
    signals = [];
    ids = 0;
  });

  async function started(target = service()) {
    const prepared = await target.prepare("session-1");
    if (prepared.status !== "ready") throw new Error("not ready");
    await target.start(prepared);
    return target;
  }

  it("lancement depuis la Séance : instantané figé, plan parcouru par les réveils, clôture après la Fin, résultats cohérents", async () => {
    const run = await started();
    expect(run.project()?.phase).toBe("INITIAL_COUNTDOWN");
    await scheduler.runUntil(T0 + 5 * S + 30 * S + 10 * S + 30 * S + 20 * S); // compte à rebours, A1, pause, A2, récupération
    expect(run.project()).toMatchObject({ phase: "ACTIVITY", exerciseName: "Mouvement B" });
    await run.dispatch({ type: "NEXT" }, run.project()!.target!);
    expect(run.project()?.phase).toBe("SESSION_END");
    await scheduler.runUntil(T0 + 98 * S);
    const active = run.current()!;
    expect(active.state.status).toBe("FINISHED");
    expect(active.businessStatus).toBe("COMPLETED");
    // Recette du 10/11/2026 (G10) : l'achèvement normal émet un signal d'arrivée, une seule fois.
    expect(signals.filter((signal) => signal.kind === "FINISH")).toHaveLength(1);
    const stored = await new SqliteExecutionRepository(raw).findById(active.executionId);
    expect(stored).toMatchObject({ businessStatus: "COMPLETED", state: { status: "FINISHED" } });
    const occurrences = run.occurrences();
    expect(occurrences.map((occurrence) => [occurrence.exerciseId, occurrence.status, occurrence.activeMs])).toEqual([
      ["A", "COMPLETED", 60 * S],
      ["B", "COMPLETED", 0],
    ]);
    expect(occurrences[0]!.recovery).toEqual({ plannedMs: 20 * S, elapsedMs: 20 * S });
  });

  it("une seule Exécution à la fois : un second lancement est bloqué", async () => {
    await started();
    const other = service();
    const prepared = await other.prepare("session-1");
    if (prepared.status !== "ready") throw new Error("not ready");
    await expect(other.start(prepared)).rejects.toBeInstanceOf(ExecutionBlockedError);
  });

  it("T09 : interruption du processus — état candidat ; Reprendre revient à l'étape interrompue, en pause, sans compter l'absence (décision du 09/11/2026), sans double acquisition", async () => {
    const first = await started();
    await scheduler.runUntil(T0 + 20 * S); // A1 en cours depuis 15 s
    const executionId = first.current()!.executionId;
    // Processus tué : nouveau service sur la même base, 40 s plus tard.
    scheduler.timers = [];
    clock.ms = T0 + 60 * S;
    const second = service();
    expect(await second.findRecovery()).toEqual({ executionId, sessionName: "Séance de test", continuity: true });
    await second.resumeRecovered(executionId);
    // Les 40 s d'absence ne comptent pas : A1 (en cours depuis 15 s à l'interruption) attend, en pause, relancée.
    expect(second.project()).toMatchObject({ status: "PAUSED", pauseReason: "RESTORE", phase: "ACTIVITY", series: { current: 1, total: 2 } });
    expect(second.project()?.timer).toMatchObject({ kind: "COUNTDOWN", remainingMs: 30 * S });
    const elapsedAtResume = second.project()!.sessionElapsedMs;
    await second.dispatch({ type: "RESUME" });
    clock.ms += 10 * S;
    expect(second.project()!.sessionElapsedMs).toBe(elapsedAtResume + 10 * S);
    expect(elapsedAtResume).toBeLessThanOrEqual(20 * S);
    await scheduler.runUntil(clock.ms + 25 * S); // fin de A1 relancée : une seule acquisition de S1
    const rows = await raw.getAllAsync<{ result_key: string }>("SELECT result_key FROM execution_results WHERE execution_id = ?", [executionId]);
    expect(new Set(rows.map((row) => row.result_key)).size).toBe(rows.length);
    expect(rows.filter((row) => row.result_key.endsWith("/s1/NONE"))).toHaveLength(1);
  });

  it("Q6 : l'heure a reculé — reprise à l'étape en cours, en pause, sans rien déduire du temps écoulé", async () => {
    const first = await started();
    await scheduler.runUntil(T0 + 20 * S);
    const executionId = first.current()!.executionId;
    scheduler.timers = [];
    clock.ms = T0 - 3600 * S; // changement d'heure manuel vers le passé
    const second = service();
    expect((await second.findRecovery())?.continuity).toBe(false);
    await second.resumeRecovered(executionId);
    expect(second.project()).toMatchObject({ status: "PAUSED", pauseReason: "RESTORE", phase: "ACTIVITY", series: { current: 1 } });
    expect(second.project()?.timer).toMatchObject({ kind: "COUNTDOWN", remainingMs: 30 * S });
  });

  it("Arrêter la séance depuis le dialogue de reprise : statut Interrompue", async () => {
    const first = await started();
    await scheduler.runUntil(T0 + 20 * S);
    const executionId = first.current()!.executionId;
    scheduler.timers = [];
    clock.ms = T0 + 25 * S;
    const second = service();
    await second.stopRecovered(executionId);
    expect(second.current()).toMatchObject({ businessStatus: "INTERRUPTED", state: { status: "FINISHED", finish: { reason: "STOPPED" } } });
    expect(await second.findRecovery()).toBeNull();
  });

  it("T20 : erreur de sauvegarde à une transition — rien n'est publié ; la réémission produit un seul résultat", async () => {
    const { database, control } = failingSaves(raw);
    const run = await started(service(database));
    await scheduler.runUntil(T0 + 5 * S + 30 * S + 10 * S + 30 * S + 20 * S);
    const target = run.project()!.target!;
    const revision = run.current()!.revision;
    control.failNext = true;
    expect(await run.dispatch({ type: "NEXT" }, target)).toEqual({ outcome: "SAVE_FAILED" });
    // L'état durable et publié n'a pas avancé : toujours B, même révision.
    expect(run.current()).toMatchObject({ saveError: true, revision });
    expect(run.project()?.exerciseName).toBe("Mouvement B");
    const stored = await new SqliteExecutionRepository(raw).findById(run.current()!.executionId);
    expect(stored?.revision).toBe(revision);
    clock.ms += 10 * S;
    expect(await run.retry()).toMatchObject({ outcome: "APPLIED" });
    expect(run.project()?.phase).toBe("SESSION_END");
    const steps = (await new SqliteExecutionRepository(raw).listResults(run.current()!.executionId)).filter((change) => change.type === "STEP" && (change.result as StepResult).exerciseId === "B");
    expect(steps).toHaveLength(1);
    // La réémission garde la lecture d'origine : B a duré jusqu'à la commande, pas jusqu'au retry.
    expect((steps[0]!.result as StepResult).completion).toBe("COMPLETED");
  });

  it("T06 : un réveil programmé avant une Pause est sans effet ; T08 : aucun signal rattrapé après une suspension", async () => {
    const run = await started();
    await scheduler.runUntil(T0 + 10 * S);
    const stale = [...scheduler.timers];
    await run.dispatch({ type: "PAUSE" });
    for (const timer of stale) timer.callback();
    await flush();
    expect(run.project()).toMatchObject({ status: "PAUSED", phase: "ACTIVITY" });
    await run.dispatch({ type: "RESUME" });
    // Arrière-plan pendant 2 min : au retour, aucun bip ni signal des étapes franchies n'est rejoué.
    signals = [];
    clock.ms += 120 * S;
    run.pulse();
    await run.onForeground();
    expect(signals.filter((signal) => clock.ms - signal.atMs > 1500)).toHaveLength(0);
  });

  it("T07 : fin d'étape et bip au même instant — un seul signal de transition", async () => {
    const run = await started();
    await scheduler.runUntil(T0 + 5 * S + 26 * S);
    signals = [];
    for (let at = T0 + 31 * S; at <= T0 + 36 * S; at += 250) {
      clock.ms = at;
      run.pulse(at);
      await scheduler.runUntil(at);
    }
    const atEnd = signals.filter((signal) => signal.atMs === T0 + 35 * S);
    expect(atEnd).toHaveLength(1);
    expect(atEnd[0]!.kind).toBe("TRANSITION");
    expect(signals.filter((signal) => signal.kind === "COUNTDOWN").map((signal) => signal.atMs - T0)).toEqual([32 * S, 33 * S, 34 * S]);
  });
});
