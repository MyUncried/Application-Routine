import type { Clock, Scheduler } from "@/features/execution/ExecutionService";

/**
 * PRE-10.2 — horloge murale et ordonnanceur du système, injectés dans `ExecutionService` (ch12 §12.10 :
 * l'accès à l'heure est abstrait par une interface `Clock`). Le moteur ne lit jamais l'heure lui-même.
 */
export const systemClock: Clock = { nowMs: () => Date.now() };

export const systemScheduler: Scheduler = {
  setTimeout: (callback, delayMs) => setTimeout(callback, delayMs),
  clearTimeout: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};
