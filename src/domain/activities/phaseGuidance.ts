/**
 * PRE-7 (R-2, D-446, PHC-20261026 ; arbitrage de Hermann du 26/10/2026, §1, §3,
 * §4, Q4, Q8, Q11) — règle pure du guidage par phases, destinée au futur
 * `ExecutionService` (T04, hors PRE-7 : aucun écran, aucun timer ici).
 *
 * Les phases forment un MOTIF CYCLIQUE commun à toutes les séries (identiques
 * ou variables) : elles s'enchaînent selon leurs durées puis recommencent tant
 * que le passage de travail continue. Chaque passage (une série, ou chaque côté
 * d'une série) commence à la première phase : l'instant 0 est le début du
 * passage. Un passage complet du motif est un cycle guidé ; ce n'est jamais une
 * mesure des répétitions réellement effectuées.
 *
 * La condition d'arrêt porte sur la série, jamais sur une phase :
 * - Durée chiffrée : la série se termine à sa cible, même au milieu d'une phase
 *   (une cible plus courte que le motif est permise, Q8) ;
 * - Répétitions et À l'échec : aucune fin par le guidage (validation manuelle
 *   « Suivant ») ; après le nombre cible, le motif continue de boucler, sans
 *   signal (Q4).
 *
 * Fonctions pures — sans React, SQLite, Expo, i18n ni horloge.
 */

import { WORK_PHASE_LIMITS, type ExecutionParametersInput, type SeriesTarget, type WorkPhase } from "./ExecutionParameters";

/**
 * Durée du motif = Σ des durées de phase (D-446 §4) ; `null` sans phase ou si
 * une durée manque (< 1 s : motif inconnu, aucune durée inventée).
 */
export function workPhasesCycleSeconds(phases: readonly Pick<WorkPhase, "durationSeconds">[]): number | null {
  if (phases.length === 0) {
    return null;
  }
  let sum = 0;
  for (const phase of phases) {
    if (!(Number.isInteger(phase.durationSeconds) && phase.durationSeconds >= WORK_PHASE_LIMITS.durationMin)) {
      return null;
    }
    sum += phase.durationSeconds;
  }
  return sum;
}

/**
 * Limite du guidage d'une série : sa cible en Durée chiffrée ; `null` sinon
 * (Répétitions, À l'échec, Mode ou Cible non renseignés : fin manuelle).
 */
export function seriesGuidanceLimitSeconds(mode: ExecutionParametersInput["mode"], target: SeriesTarget): number | null {
  return mode === "DURATION" && target.kind === "NUMBER" ? target.value : null;
}

/**
 * Durée nominale du guidage d'une série (D-446 §4) : Durée chiffrée → la
 * cible ; Répétitions chiffrées avec un motif complet → nombre cible × motif ;
 * sinon `null` (À l'échec, motif incomplet, rien de connu). Elle ne remplace
 * jamais l'objectif en répétitions.
 */
export function nominalGuidanceSeconds(
  mode: ExecutionParametersInput["mode"],
  target: SeriesTarget,
  phases: readonly Pick<WorkPhase, "durationSeconds">[],
): number | null {
  if (target.kind !== "NUMBER") {
    return null;
  }
  if (mode === "DURATION") {
    return target.value;
  }
  if (mode === "REPETITIONS") {
    const cycle = workPhasesCycleSeconds(phases);
    return cycle === null ? null : target.value * cycle;
  }
  return null;
}

/** État du guidage à un instant du passage de travail. */
export type PhaseGuidanceState = {
  /** Vrai dès que la limite de la série est atteinte (Durée chiffrée seulement). */
  readonly ended: boolean;
  /** Rang 0-indexé de la phase courante (à la limite : celle en cours à cet instant). */
  readonly phaseIndex: number;
  readonly phaseElapsedSeconds: number;
  readonly phaseRemainingSeconds: number;
  /** Passages complets du motif (cycles guidés). */
  readonly completedCycles: number;
};

/**
 * Phase courante à `elapsedSeconds` depuis le début du passage (D-446 §3).
 * Avec une limite, l'instant est borné à la limite et `ended` devient vrai dès
 * `elapsed ≥ limit`. Entrée invalide (lève) : aucune phase, motif incomplet,
 * instant ou limite négatif ou non fini.
 */
export function phaseGuidanceAt(
  phases: readonly Pick<WorkPhase, "durationSeconds">[],
  elapsedSeconds: number,
  limitSeconds: number | null,
): PhaseGuidanceState {
  const cycle = workPhasesCycleSeconds(phases);
  if (cycle === null) {
    throw new Error("phaseGuidanceAt: a complete work phase pattern is required (D-446).");
  }
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds < 0) {
    throw new Error("phaseGuidanceAt: elapsed time must be finite and non-negative.");
  }
  if (limitSeconds !== null && (!Number.isFinite(limitSeconds) || limitSeconds < 0)) {
    throw new Error("phaseGuidanceAt: limit must be finite and non-negative.");
  }
  const ended = limitSeconds !== null && elapsedSeconds >= limitSeconds;
  const at = ended ? (limitSeconds as number) : elapsedSeconds;
  const completedCycles = Math.floor(at / cycle);
  // Arrondi flottant : l'écart au début du cycle reste dans [0, cycle[.
  let within = Math.min(Math.max(at - completedCycles * cycle, 0), cycle);
  let phaseIndex = 0;
  while (phaseIndex < phases.length - 1 && within >= phases[phaseIndex]!.durationSeconds) {
    within -= phases[phaseIndex]!.durationSeconds;
    phaseIndex += 1;
  }
  within = Math.min(within, phases[phaseIndex]!.durationSeconds);
  return {
    ended,
    phaseIndex,
    phaseElapsedSeconds: within,
    phaseRemainingSeconds: phases[phaseIndex]!.durationSeconds - within,
    completedCycles,
  };
}
