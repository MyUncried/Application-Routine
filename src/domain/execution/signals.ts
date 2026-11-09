/**
 * PRE-10.2 — planification des signaux d'exécution (conception §8.1, §10, §16.1 ; ch08 « Guidage
 * sonore » ; D-308, D-310, D-313 ; RM-077). Fonction pure : le noyau ne joue aucun son ; le runtime demande
 * aux adaptateurs (son, voix, haptique) les signaux dus sur l'intervalle qu'il vient d'observer.
 *
 * - `TRANSITION` : début d'une étape (annonce du nom, « Récupération », côté 1 / côté 2) — produit par
 *   l'effet `STEP_STARTED` du noyau, à son instant logique.
 * - `COUNTDOWN` : bip aigu pendant les trois dernières secondes d'une étape chronométrée.
 * - `CADENCE` : bip périodique d'une Série cadencée, ancré sur le début de la Série et, après une Pause, sur
 *   la reprise (premier nouveau bip après un intervalle complet, §13).
 * - `MINUTE` : signal minute d'une Série sans bip, en Répétitions ou À l'échec (ch08).
 *
 * Règles : signal de transition prioritaire sur un bip coïncident, sans double signal (ACQUIS §10, T07) ; à
 * un même instant, un seul signal ; aucun signal pendant une Pause ; aucun rattrapage de signaux périmés
 * (§14.1) — le runtime ne demande que l'intervalle récent.
 */

import { leafStepRef, type EngineState, type Ms } from "./kernel";

export type SignalKind = "TRANSITION" | "COUNTDOWN" | "CADENCE" | "MINUTE";
export type PlannedSignal = { readonly kind: SignalKind; readonly atMs: Ms };

const S = 1000;
const MINUTE = 60 * S;
const PRIORITY: Record<SignalKind, number> = { TRANSITION: 3, COUNTDOWN: 2, CADENCE: 1, MINUTE: 0 };

/** Signaux de l'étape courante dus dans `]fromMs, toMs]`, hors transition (portée par l'effet du noyau). */
export function stepSignalsBetween(state: EngineState, fromMs: Ms, toMs: Ms): readonly PlannedSignal[] {
  const leaf = state.leaf;
  const ref = leafStepRef(state);
  if (state.status !== "RUNNING" || leaf === null || ref === null || ref.anchorMs === null || toMs <= fromMs) return [];
  // Instant mural d'un temps actif `active` de l'étape (la référence est active : ancre non nulle).
  const wallAt = (active: Ms) => ref.anchorMs! + (active - ref.accumulatedMs);
  const signals: PlannedSignal[] = [];
  const push = (kind: SignalKind, atMs: Ms) => {
    if (atMs > fromMs && atMs <= toMs) signals.push({ kind, atMs });
  };
  const spec = leaf.spec;
  const endWall = spec.end === "TIMED" ? wallAt(spec.plannedMs ?? 0) : null;
  if (spec.end === "TIMED" && (spec.plannedMs ?? 0) > 0) {
    for (const before of [3, 2, 1]) {
      const active = (spec.plannedMs ?? 0) - before * S;
      if (active > 0) push("COUNTDOWN", wallAt(active));
    }
  }
  if (spec.kind === "ACTIVITY") {
    if (spec.cadenceMs !== undefined && leaf.cadenceAnchorMs !== null) {
      const first = Math.max(1, Math.ceil((fromMs - leaf.cadenceAnchorMs) / spec.cadenceMs));
      for (let k = first; ; k += 1) {
        const at = leaf.cadenceAnchorMs + k * spec.cadenceMs;
        if (at > toMs) break;
        push("CADENCE", at);
      }
    } else if (spec.end === "MANUAL") {
      const elapsedFrom = Math.max(0, ref.accumulatedMs + (fromMs - ref.anchorMs));
      for (let k = Math.max(1, Math.ceil(elapsedFrom / MINUTE)); ; k += 1) {
        const at = wallAt(k * MINUTE);
        if (at > toMs) break;
        push("MINUTE", at);
      }
    }
  }
  return dedupe(signals.filter((signal) => endWall === null || signal.atMs < endWall));
}

/** Un seul signal par instant, le plus prioritaire (transition > compte à rebours > cadence > minute). */
export function dedupe(signals: readonly PlannedSignal[]): readonly PlannedSignal[] {
  const byInstant = new Map<Ms, PlannedSignal>();
  for (const signal of signals) {
    const existing = byInstant.get(signal.atMs);
    if (existing === undefined || PRIORITY[signal.kind] > PRIORITY[existing.kind]) byInstant.set(signal.atMs, signal);
  }
  return [...byInstant.values()].sort((a, b) => a.atMs - b.atMs);
}
