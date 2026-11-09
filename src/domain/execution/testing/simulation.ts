/**
 * PRE-10 — outils de test du noyau : Séance structurée minimale, horloge simulée et pilotage des
 * transitions. Aucun React, SQLite, son ni haptique (§17 : « horloge simulée ; aucune interface »).
 */

import type { ExecutionParameters } from "@/domain/activities/ExecutionParameters";
import type { Activity } from "@/domain/sessions/Session";
import type { StructuredSession } from "@/domain/sessions/SessionRepository";
import { createSessionSnapshot } from "@/domain/sessions/sessionSnapshot";
import type { SessionStructure } from "@/domain/sessions/structure";

import {
  createInitialState,
  leafTarget,
  libreEnv,
  transition,
  type EngineEnv,
  type EngineEvent,
  type EngineState,
  type ResultChange,
  type StepResult,
  type TransitionResult,
} from "../kernel";
import { compileExecutablePlan, type ExecutablePlan } from "../plan";

export function exerciseActivity(id: string, executionParameters: ExecutionParameters, extra: Partial<Activity> = {}): Activity {
  return {
    id,
    type: "EXERCISE",
    structuralPosition: "BEFORE_TOUR",
    position: 0,
    name: `Mouvement ${id}`,
    executionParameters,
    postActivityRecoverySeconds: null,
    instruction: null,
    bodyZoneIds: [],
    sideMode: executionParameters.sideMode,
    categoryId: null,
    sourceMovementId: `mv-${id}`,
    media: [],
    ...extra,
  };
}

export function structuredSession(
  structure: SessionStructure<Activity>,
  options: { readonly initialCountdownSeconds?: number; readonly finalPhaseSeconds?: number; readonly name?: string } = {},
): StructuredSession {
  return {
    id: "session-1",
    ownerId: "u1",
    name: options.name ?? "Séance de test",
    color: "#9AA4B2" as StructuredSession["color"],
    labelId: null,
    status: "ACTIVE",
    initialCountdownSeconds: options.initialCountdownSeconds ?? 0,
    finalPhaseSeconds: options.finalPhaseSeconds ?? 0,
    origin: null,
    createdAt: "2026-11-09T00:00:00.000Z",
    updatedAt: "2026-11-09T00:00:00.000Z",
    structure,
  };
}

export function planOf(session: StructuredSession): ExecutablePlan {
  return compileExecutablePlan(createSessionSnapshot(session));
}

/** Simulation : horloge contrôlée en ms, état, résultats rangés par clé (upsert idempotent), effets. */
export class Simulation {
  now = 0;
  state: EngineState;
  readonly results = new Map<string, ResultChange>();
  readonly log: TransitionResult[] = [];

  constructor(
    readonly env: EngineEnv,
    executionId = "exec-1",
  ) {
    this.state = createInitialState(executionId);
  }

  static libre(plan: ExecutablePlan): Simulation {
    return new Simulation(libreEnv(plan));
  }

  send(event: EngineEvent, atMs: number = this.now): TransitionResult {
    this.now = Math.max(this.now, atMs);
    const result = transition(this.env, this.state, event, this.now);
    this.state = result.state;
    for (const change of result.results) this.results.set(`${change.type}:${change.key}`, change);
    this.log.push(result);
    return result;
  }

  /** Avance l'horloge et réconcilie (un réveil de l'ordonnanceur ou un retour au premier plan). */
  advance(ms: number): TransitionResult {
    return this.send({ type: "TICK" }, this.now + ms);
  }

  at(seconds: number): TransitionResult {
    return this.send({ type: "TICK" }, seconds * 1000);
  }

  get leafKey(): string | null {
    return this.state.leaf?.spec.key ?? null;
  }

  get target(): string | undefined {
    return this.state.leaf === null ? undefined : leafTarget(this.state.leaf);
  }

  step(key: string): StepResult | undefined {
    const change = this.results.get(`STEP:${key}`);
    return change?.type === "STEP" ? change.result : undefined;
  }

  stepResults(): StepResult[] {
    return [...this.results.values()].flatMap((change) => (change.type === "STEP" ? [change.result] : []));
  }

  /** Suite des étapes ouvertes (clé et instant logique), dans l'ordre. */
  startedSteps(): { key: string; atMs: number; kind: string }[] {
    return this.log.flatMap((entry) => entry.effects.flatMap((effect) => (effect.type === "STEP_STARTED" ? [{ key: effect.key, atMs: effect.atMs, kind: effect.kind }] : [])));
  }
}
