/**
 * PRE-10.2 — `ExecutionService`, façade applicative du moteur (ch12 §12.9 ; conception §4, §8.3, §10,
 * §14, §15.2, §16.1).
 *
 * - **Sérialisation** : une file par service ; une commande reçoit sa lecture d'horloge à la réception,
 *   jamais l'heure plus tardive de sa sauvegarde. Les lectures ne reculent jamais dans un même processus.
 * - **Frontière transactionnelle** : chaque transition qui change l'état durable est sauvegardée
 *   atomiquement (checkpoint + résultats, révision attendue) **avant** d'être publiée à l'interface. En
 *   cas d'échec, l'état publié reste le précédent ; la commande et sa lecture sont conservées pour une
 *   réémission (`retry`) qui reproduit exactement la même transition — mêmes clés de résultats, aucune
 *   duplication (T20).
 * - **Ordonnanceur** : un seul réveil programmé, à la prochaine échéance logique, marqué de la génération ;
 *   un réveil d'une génération dépassée est sans effet (T06). Le réveil demande une réconciliation ; il ne
 *   décrémente rien.
 * - **Signaux** : demandés aux adaptateurs pour l'intervalle récemment observé seulement ; aucun signal
 *   rattrapé après une suspension (§14.1). Le son physique ne partage pas la transaction (§16.1).
 * - **Cycle de vie** : retour au premier plan = réconciliation ; l'arrière-plan n'est pas une Pause.
 *   Interruption du processus : état candidat, choix Reprendre / Arrêter (§12.33), aucune nouvelle
 *   Exécution tant qu'il n'est pas traité ; Reprendre revient à l'étape interrompue, en pause, sans
 *   compter l'absence (Q6, étendu le 09/11/2026 à toute interruption du processus).
 *
 * Aucune règle métier de parcours ici : elles sont dans le noyau (`@/domain/execution`).
 */

import type { ExecutionRepository } from "@/domain/execution/ExecutionRepository";
import {
  createInitialState,
  ENGINE_STATE_VERSION,
  libreEnv,
  nextDueAtMs,
  restoreWithoutContinuity,
  transition,
  type EngineCommand,
  type EngineEnv,
  type EngineEvent,
  type EngineState,
  type ResultChange,
  type StepResult,
  type TransitionResult,
} from "@/domain/execution/kernel";
import { compileExecutablePlan, EXECUTABLE_PLAN_VERSION, launchabilityOf, type ExecutablePlan, type Launchability, type LeafKind } from "@/domain/execution/plan";
import { projectExecution, type ExecutionProjection } from "@/domain/execution/projection";
import { businessStatusOf, occurrenceResults, type BusinessStatus, type OccurrenceResult } from "@/domain/execution/results";
import type { ExecutionMode, SeriesTarget } from "@/domain/activities/ExecutionParameters";
import { dedupe, stepSignalsBetween, type PlannedSignal, type SignalKind } from "@/domain/execution/signals";
import type { StructuredSession } from "@/domain/sessions/SessionRepository";
import { createSessionSnapshot, SESSION_SNAPSHOT_VERSION, type SessionSnapshot } from "@/domain/sessions/sessionSnapshot";

/** Horloge murale injectable (ch12 §12.10). */
export type Clock = { readonly nowMs: () => number };

export type Scheduler = {
  readonly setTimeout: (callback: () => void, delayMs: number) => unknown;
  readonly clearTimeout: (handle: unknown) => void;
};

/** Signal demandé aux adaptateurs (son, voix, haptique) ; jamais une source de temps. */
/** Objectif d'une Série (mode et cible), annoncé avec le nom de l'exercice (recette du 10/11/2026, G8). */
export type SignalObjective = { readonly mode: ExecutionMode | null; readonly target: SeriesTarget | null };

export type ExecutionSignal = {
  /**
   * `FINISH` : achèvement normal de la Séance (fin de la Fin de séance), son d'arrivée (recette du 10/11/2026, G10).
   * `PAUSE` : Pause demandée par l'utilisateur (recette du 10/11/2026, constat a).
   */
  readonly kind: SignalKind | "FINISH" | "PAUSE";
  readonly atMs: number;
  readonly phase: LeafKind | null;
  readonly exerciseName: string | null;
  readonly sideRank: 1 | 2 | null;
  /** Étape chronométrée (compte à rebours) ; faux pour un chronomètre ou une attente. */
  readonly timed?: boolean;
  /** Étape suivante au même niveau du plan (annonce « Prochain exercice », guidage sonore du 10/11/2026). */
  readonly next?: { readonly phase: LeafKind; readonly exerciseName: string | null; readonly objective?: SignalObjective } | null;
  /** Objectif de l'étape courante. */
  readonly objective?: SignalObjective;
};

export type ExecutionServiceDeps = {
  readonly repository: ExecutionRepository;
  readonly clock: Clock;
  readonly scheduler: Scheduler;
  readonly newId: () => string;
  readonly loadSession: (sessionId: string) => Promise<StructuredSession | null>;
  readonly onSignal?: (signal: ExecutionSignal) => void;
};

export type PreparedExecution =
  | { readonly status: "ready"; readonly snapshot: SessionSnapshot; readonly plan: ExecutablePlan; readonly projection: ExecutionProjection }
  | { readonly status: "not-found" }
  | { readonly status: "not-launchable"; readonly launchability: Exclude<Launchability, { status: "launchable" }> };

export type RecoveryCandidate = { readonly executionId: string; readonly sessionName: string; readonly continuity: boolean };

export type ActiveExecution = {
  readonly executionId: string;
  readonly plan: ExecutablePlan;
  readonly state: EngineState;
  readonly revision: number;
  readonly saveError: boolean;
  readonly businessStatus: BusinessStatus | null;
};

export type DispatchOutcome = { readonly outcome: TransitionResult["outcome"] | "SAVE_FAILED" | "NO_EXECUTION"; readonly reason?: string };

/** Écart de tolérance d'horloge entre deux processus (au-delà, l'heure a reculé : continuité non démontrée). */
const CONTINUITY_TOLERANCE_MS = 2000;
/** Signaux joués seulement s'ils sont récents (aucun rattrapage après suspension). */
const SIGNAL_FRESHNESS_MS = 1500;

export class ExecutionBlockedError extends Error {}

type Pending = { readonly event: EngineEvent; readonly readingMs: number };

export class ExecutionService {
  private active: (ActiveExecution & { readonly env: EngineEnv; readonly results: Map<string, ResultChange> }) | null = null;
  private readonly listeners = new Set<() => void>();
  private queue: Promise<unknown> = Promise.resolve();
  private lastReadingMs = 0;
  private wakeup: { handle: unknown; generation: number } | null = null;
  private pending: Pending | null = null;
  private lastSignalCheckMs: number | null = null;
  private commandCounter = 0;

  constructor(private readonly deps: ExecutionServiceDeps) {}

  // —————————————————————————————————————————— lecture

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  current(): ActiveExecution | null {
    return this.active;
  }

  now(): number {
    // Une lecture ne recule jamais dans un même processus (§8.2).
    const now = Math.max(this.deps.clock.nowMs(), this.lastReadingMs);
    this.lastReadingMs = now;
    return now;
  }

  project(atMs: number = this.now()): ExecutionProjection | null {
    return this.active === null ? null : projectExecution(this.active.plan, this.active.state, atMs);
  }

  occurrences(): readonly OccurrenceResult[] {
    if (this.active === null) return [];
    return occurrenceResults([...this.active.results.values()].flatMap((change) => (change.type === "STEP" ? [change.result as StepResult] : [])));
  }

  // —————————————————————————————————————————— préparation et lancement

  /** Fige la Séance et compile son plan sans rien persister : l'Exécution n'existe qu'au démarrage (ch09). */
  async prepare(sessionId: string): Promise<PreparedExecution> {
    const session = await this.deps.loadSession(sessionId);
    if (session === null) return { status: "not-found" };
    const snapshot = createSessionSnapshot(session);
    const launchability = launchabilityOf(snapshot);
    if (launchability.status !== "launchable") return { status: "not-launchable", launchability };
    const plan = compileExecutablePlan(snapshot);
    return { status: "ready", snapshot, plan, projection: projectExecution(plan, createInitialState("preview"), 0) };
  }

  /** Démarrer : crée l'Exécution (instantané figé) puis lance le Compte à rebours initial. */
  start(prepared: Extract<PreparedExecution, { status: "ready" }>): Promise<void> {
    return this.enqueue(async () => {
      if (this.active !== null && this.active.state.status !== "FINISHED") throw new ExecutionBlockedError("An execution is already active.");
      if ((await this.deps.repository.findUnfinished()) !== null) throw new ExecutionBlockedError("An unfinished execution must be resumed or stopped first.");
      const executionId = this.deps.newId();
      const env = libreEnv(prepared.plan);
      const reading = this.now();
      const started = transition(env, createInitialState(executionId), { type: "START" }, reading);
      const startedAt = new Date(reading).toISOString();
      await this.deps.repository.create(
        {
          id: executionId,
          origin: "SESSION",
          sessionId: prepared.snapshot.sessionId,
          snapshotJson: JSON.stringify(prepared.snapshot),
          snapshotVersion: SESSION_SNAPSHOT_VERSION,
          planVersion: EXECUTABLE_PLAN_VERSION,
          engineVersion: ENGINE_STATE_VERSION,
          state: started.state,
          startedAt,
          clockWallMs: reading,
        },
        started.results,
      );
      const results = new Map<string, ResultChange>();
      for (const change of started.results) results.set(`${change.type}:${change.key}`, change);
      this.active = { executionId, plan: prepared.plan, env, state: started.state, revision: 1, saveError: false, businessStatus: null, results };
      this.lastSignalCheckMs = reading;
      this.afterPublish(started);
    });
  }

  // —————————————————————————————————————————— commandes

  dispatch(command: EngineCommand, target?: string): Promise<DispatchOutcome> {
    const reading = this.now();
    this.commandCounter += 1;
    const event: EngineEvent = { ...command, ...(target !== undefined ? { target } : {}), ...(command.type !== "TICK" ? { commandId: `${reading}-${this.commandCounter}` } : {}) };
    return this.enqueue(() => this.process({ event, readingMs: reading }));
  }

  /** Réémet la dernière commande dont la sauvegarde a échoué, avec sa lecture d'origine (T20). */
  retry(): Promise<DispatchOutcome> {
    return this.enqueue(async () => (this.pending === null ? { outcome: "IGNORED" as const } : this.process(this.pending)));
  }

  /** Retour au premier plan : réconciliation à l'heure courante (RM-067). */
  onForeground(): Promise<DispatchOutcome> {
    this.lastSignalCheckMs = null;
    return this.dispatch({ type: "TICK" });
  }

  /**
   * Rafraîchissement d'affichage : demande les signaux de l'étape dus depuis la dernière observation,
   * seulement si elle est récente (aucun rattrapage).
   */
  pulse(atMs: number = this.now()): readonly PlannedSignal[] {
    const active = this.active;
    if (active === null) return [];
    const from = this.lastSignalCheckMs;
    this.lastSignalCheckMs = atMs;
    if (from === null || atMs - from > SIGNAL_FRESHNESS_MS) return [];
    const signals = stepSignalsBetween(active.state, from, atMs);
    for (const signal of signals) this.emitSignal(signal);
    return signals;
  }

  // —————————————————————————————————————————— reprise après interruption du processus

  async findRecovery(): Promise<RecoveryCandidate | null> {
    const record = await this.deps.repository.findUnfinished();
    if (record === null) return null;
    const snapshot = JSON.parse(record.snapshotJson) as SessionSnapshot;
    return { executionId: record.id, sessionName: snapshot.name, continuity: this.continuityOf(record.clockWallMs) };
  }

  /**
   * Reprendre la séance (§12.33) : l'Exécution revient à l'étape interrompue, en pause, et l'absence ne compte
   * pas — quelle que soit la continuité de l'heure (décision de Hermann, recette PRE-10 du 09/11/2026 :
   * reprendre après une fermeture « à l'étape interrompue, en pause, sans compter l'absence (comme la règle
   * Q6) » ; remplace la reprise au temps logique de la conception §14.2 / T09 pour une interruption du
   * processus). L'arrière-plan sans fermeture reste une réconciliation au temps logique (RM-067).
   */
  resumeRecovered(executionId: string): Promise<void> {
    return this.enqueue(async () => {
      await this.load(executionId);
      const active = this.active!;
      const record = await this.deps.repository.findById(executionId);
      if (record === null) return;
      await this.persist(active, { state: restoreWithoutContinuity(active.state), results: [], effects: [], outcome: "APPLIED" }, record.clockWallMs);
    });
  }

  /** Arrêter la séance depuis le dialogue de reprise : clôture `Interrompue` (§12.33), sans compter l'absence. */
  stopRecovered(executionId: string): Promise<void> {
    return this.enqueue(async () => {
      await this.load(executionId);
      const record = await this.deps.repository.findById(executionId);
      const active = this.active!;
      await this.persist(active, { state: restoreWithoutContinuity(active.state), results: [], effects: [], outcome: "APPLIED" }, record?.clockWallMs ?? this.now());
      await this.process({ event: { type: "STOP", commandId: `recovery-stop-${executionId}` }, readingMs: this.now() });
    });
  }

  /** Libère l'Exécution terminée affichée (fin minimale fermée). */
  release(): void {
    if (this.active?.state.status === "FINISHED") {
      this.clearWakeup();
      this.active = null;
      this.notify();
    }
  }

  dispose(): void {
    this.clearWakeup();
    this.listeners.clear();
  }

  // —————————————————————————————————————————— interne

  private continuityOf(lastWallMs: number): boolean {
    // L'heure murale n'a pas reculé depuis la dernière évaluation sauvegardée. Un redémarrage du téléphone ou
    // une avance manuelle de l'heure ne sont pas détectables sans capacité native (P5/P6, spike à mener).
    return this.deps.clock.nowMs() + CONTINUITY_TOLERANCE_MS >= lastWallMs;
  }

  private async load(executionId: string) {
    if (this.active?.executionId === executionId) return;
    const record = await this.deps.repository.findById(executionId);
    if (record === null) throw new Error(`Execution ${executionId} not found.`);
    const snapshot = JSON.parse(record.snapshotJson) as SessionSnapshot;
    const plan = compileExecutablePlan(snapshot);
    const results = new Map<string, ResultChange>();
    for (const change of await this.deps.repository.listResults(executionId)) results.set(`${change.type}:${change.key}`, change);
    this.lastReadingMs = Math.max(this.lastReadingMs, record.state.evaluatedAtMs ?? 0);
    this.active = { executionId, plan, env: libreEnv(plan), state: record.state, revision: record.revision, saveError: false, businessStatus: record.businessStatus, results };
  }

  private enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = this.queue.then(task, task);
    this.queue = run.catch(() => undefined);
    return run;
  }

  private async process(pending: Pending): Promise<DispatchOutcome> {
    const active = this.active;
    if (active === null) return { outcome: "NO_EXECUTION" };
    const result = transition(active.env, active.state, pending.event, pending.readingMs);
    const durable =
      result.results.length > 0 ||
      result.effects.length > 0 ||
      result.state.status !== active.state.status ||
      (result.outcome === "APPLIED" && pending.event.type !== "TICK");
    if (!durable) {
      // Réconciliation sans changement : aucun écriture à chaque réveil (§15.2).
      this.active = { ...active, state: { ...active.state, evaluatedAtMs: result.state.evaluatedAtMs } };
      this.schedule();
      return { outcome: result.outcome, ...(result.reason !== undefined ? { reason: result.reason } : {}) };
    }
    try {
      await this.persist(active, result, pending.readingMs);
      this.pending = null;
    } catch {
      this.pending = pending;
      this.active = { ...active, saveError: true };
      this.notify();
      return { outcome: "SAVE_FAILED" };
    }
    return { outcome: result.outcome, ...(result.reason !== undefined ? { reason: result.reason } : {}) };
  }

  private async persist(active: NonNullable<ExecutionService["active"]>, result: TransitionResult, readingMs: number) {
    const results = new Map(active.results);
    for (const change of result.results) results.set(`${change.type}:${change.key}`, change);
    const finished = result.state.status === "FINISHED" && result.state.finish !== null;
    const businessStatus = finished
      ? businessStatusOf(result.state.finish!.reason, occurrenceResults([...results.values()].flatMap((change) => (change.type === "STEP" ? [change.result as StepResult] : []))))
      : null;
    const revision = await this.deps.repository.save({
      executionId: active.executionId,
      expectedRevision: active.revision,
      state: result.state,
      results: result.results,
      businessStatus,
      endedAt: finished ? new Date(result.state.finish!.atMs).toISOString() : null,
      savedAt: new Date(this.deps.clock.nowMs()).toISOString(),
      clockWallMs: readingMs,
    });
    this.active = { ...active, state: result.state, revision, saveError: false, businessStatus, results };
    this.afterPublish(result);
  }

  private afterPublish(result: TransitionResult) {
    const now = this.lastReadingMs;
    const transitions: PlannedSignal[] = [];
    for (const effect of result.effects) {
      if (effect.type === "STEP_STARTED" && now - effect.atMs <= SIGNAL_FRESHNESS_MS) transitions.push({ kind: "TRANSITION", atMs: effect.atMs });
    }
    // Au plus un signal de transition par instant (fin de phase et bip coïncidents : un seul signal, T07).
    for (const signal of dedupe(transitions).slice(-1)) this.emitSignal(signal);
    for (const effect of result.effects) {
      if (effect.type === "FINISHED" && effect.reason === "COMPLETED" && now - effect.atMs <= SIGNAL_FRESHNESS_MS) this.emitSignal({ kind: "FINISH", atMs: effect.atMs });
      if (effect.type === "PAUSED" && effect.reason === "USER" && now - effect.atMs <= SIGNAL_FRESHNESS_MS) this.emitSignal({ kind: "PAUSE", atMs: effect.atMs });
    }
    this.schedule();
    this.notify();
  }

  private emitSignal(signal: PlannedSignal | { readonly kind: "FINISH" | "PAUSE"; readonly atMs: number }) {
    const projection = this.project(signal.atMs);
    this.deps.onSignal?.({
      kind: signal.kind,
      atMs: signal.atMs,
      phase: projection?.phase ?? null,
      exerciseName: projection?.exerciseName ?? null,
      sideRank: projection?.sideRank ?? null,
      timed: projection?.timer.kind === "COUNTDOWN",
      next: projection?.next == null ? null : { phase: projection.next.kind, exerciseName: projection.next.name, objective: { mode: projection.next.mode ?? null, target: projection.next.target } },
      objective: { mode: projection?.mode ?? null, target: projection?.seriesTarget ?? null },
    });
  }

  private clearWakeup() {
    if (this.wakeup !== null) this.deps.scheduler.clearTimeout(this.wakeup.handle);
    this.wakeup = null;
  }

  private schedule() {
    this.clearWakeup();
    const active = this.active;
    if (active === null) return;
    const due = nextDueAtMs(active.state);
    if (due === null) return;
    const generation = active.state.generation;
    const handle = this.deps.scheduler.setTimeout(() => {
      // Réveil d'une génération dépassée (Pause, reset, changement d'étape) : sans effet (T06).
      if (this.active === null || this.active.state.generation !== generation) return;
      void this.dispatch({ type: "TICK" });
    }, Math.max(0, due - this.lastReadingMs));
    this.wakeup = { handle, generation };
  }

  private notify() {
    for (const listener of this.listeners) listener();
  }
}
