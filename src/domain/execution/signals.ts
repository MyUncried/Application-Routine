/**
 * PRE-10.2 — planification des signaux d'exécution (conception §8.1, §10, §16.1 ; ch08 « Guidage
 * sonore » ; D-308, D-310, D-313 ; RM-077). Fonction pure : le noyau ne joue aucun son ; le runtime demande
 * aux adaptateurs (son, voix, haptique) les signaux dus sur l'intervalle qu'il vient d'observer.
 *
 * - `TRANSITION` : début d'une étape (annonce du nom, « Récupération », côté 1 / côté 2) — produit par
 *   l'effet `STEP_STARTED` du noyau, à son instant logique.
 * - `COUNTDOWN` : bip aigu pendant les trois dernières secondes d'une étape chronométrée.
 * - `CADENCE` : bip périodique d'une Série cadencée, calé sur le temps actif de l'étape (recette du
 *   10/11/2026 : remplace l'ancrage sur la reprise après une Pause, §13) ; aucun pendant les trois dernières
 *   secondes d'une étape chronométrée.
 * - `MINUTE` : signal minute d'une Série en Répétitions ou À l'échec, avec ou sans bip de cadence (recette du
 *   10/11/2026 ; ch08) ; il l'emporte sur un bip de cadence au même instant.
 *
 * Règles : signal de transition prioritaire sur un bip coïncident, sans double signal (ACQUIS §10, T07) ; à
 * un même instant, un seul signal ; aucun signal pendant une Pause ; aucun rattrapage de signaux périmés
 * (§14.1) — le runtime ne demande que l'intervalle récent.
 */

import { leafStepRef, type EngineState, type Ms } from "./kernel";

export type SignalKind = "TRANSITION" | "COUNTDOWN" | "CADENCE" | "MINUTE" | "PREPARE";
export type PlannedSignal = { readonly kind: SignalKind; readonly atMs: Ms };

const S = 1000;
const MINUTE = 60 * S;
/** Marge sans bip de cadence avant le compte à rebours de fin d'étape. */
const CADENCE_MARGIN_MS = 250;
/**
 * `PREPARE` : avance sur le premier bip de fin d'une étape chronométrée, sans son ; il laisse au runtime le
 * temps de baisser la musique avant les bips (recette du 10/11/2026, t7).
 */
export const PREPARE_AHEAD_MS = 700;
// Recette du 10/11/2026 (G7) : le signal minute l'emporte sur un bip de cadence au même instant.
const PRIORITY: Record<SignalKind, number> = { TRANSITION: 3, COUNTDOWN: 2, MINUTE: 1, CADENCE: 0, PREPARE: -1 };

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
    const prepare = (spec.plannedMs ?? 0) - 3 * S - PREPARE_AHEAD_MS;
    if (prepare > 0) push("PREPARE", wallAt(prepare));
  }
  if (spec.kind === "ACTIVITY") {
    // Temps actif de l'étape au début de l'intervalle observé (hors Pause).
    const elapsedFrom = fromMs <= ref.anchorMs ? ref.accumulatedMs : ref.accumulatedMs + (fromMs - ref.anchorMs);
    const every = (periodMs: Ms, kind: SignalKind) => {
      for (let k = Math.max(1, Math.ceil(elapsedFrom / periodMs)); ; k += 1) {
        const at = wallAt(k * periodMs);
        if (at > toMs) break;
        push(kind, at);
      }
    };
    // Recette du 10/11/2026 (t1, constat b) : bips de cadence calés sur le temps actif de l'étape, comme le
    // chronomètre affiché, y compris après une Pause (remplace l'ancrage sur la reprise, §13).
    if (spec.cadenceMs !== undefined && leaf.cadenceAnchorMs !== null) every(spec.cadenceMs, "CADENCE");
    // Recette du 10/11/2026 (G7) : signal minute de toute Série en Répétitions ou À l'échec, avec ou sans cadence.
    if (spec.end === "MANUAL") every(MINUTE, "MINUTE");
  }
  // Recette du 10/11/2026 (h1) : pas de bip de cadence pendant les trois dernières secondes d'une étape
  // chronométrée, qui ont leurs propres bips.
  const countdownFrom = endWall === null ? null : endWall - 3 * S - CADENCE_MARGIN_MS;
  return dedupe(signals.filter((signal) => (endWall === null || signal.atMs < endWall) && !(signal.kind === "CADENCE" && countdownFrom !== null && signal.atMs > countdownFrom)));
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
