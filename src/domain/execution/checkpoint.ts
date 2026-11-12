/**
 * PRE-10.2 — checkpoint versionné de l'état du noyau (conception §15.1, §15.4). Le checkpoint contient la
 * pile des portées et leurs états locaux, l'étape et sa tentative, les références temporelles (ancres,
 * temps accumulés), la génération et les dernières commandes ; jamais une copie des échéances passées.
 * Un checkpoint d'une version inconnue n'est pas relu sous une politique incompatible : il est refusé.
 */

import { ENGINE_STATE_VERSION, type EngineState } from "./kernel";

export class ExecutionCheckpointError extends Error {}

export function serializeCheckpoint(state: EngineState): string {
  return JSON.stringify(state);
}

export function readCheckpoint(json: string): EngineState {
  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch {
    throw new ExecutionCheckpointError("Unreadable execution checkpoint.");
  }
  const state = value as Partial<EngineState> | null;
  if (state === null || typeof state !== "object" || state.version !== ENGINE_STATE_VERSION || typeof state.executionId !== "string" || !Array.isArray(state.refs) || !Array.isArray(state.frames)) {
    throw new ExecutionCheckpointError("Incompatible execution checkpoint version.");
  }
  return state as EngineState;
}
