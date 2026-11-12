/**
 * PRE-10 — projection de l'état d'Exécution pour l'interface (conception §16.2 ; CE-EXEC-SESSION-01 ;
 * RM-077, RM-126). Fonction pure : l'interface ne maintient aucun second compte à rebours métier ; la
 * commande disponible est dérivée de l'état, pas d'un compteur React local.
 *
 * Progression (RM-077, plans finis hors fenêtres de Formats) : M étapes contributives ; R Séries sans durée
 * déterminable (À l'échec, Répétitions chiffrées sans cadence) pesant 1/M chacune, acquises à Suivant ;
 * étapes temporelles de durée d (phases chronométrées positives, Ri×Ci des Répétitions cadencées) pesant
 * (1 − R/M) × d / T. Points d'arrêt et phases de 0 s : aucun poids. La Pause manuelle n'ajoute rien ; une
 * Série cadencée progresse par intervalles complets acquis. 100 % uniquement après la Fin de séance.
 */

import { phaseGuidanceAt, workPhasesCycleSeconds } from "@/domain/activities/phaseGuidance";
import type { SeriesTarget } from "@/domain/activities/ExecutionParameters";

import { leafElapsedMs, leafTarget, needsNextConfirmation, resettable, runningMs, sessionStopwatch, type EngineState, type FinishReason, type Ms, type PauseReason } from "./kernel";
import type { ChildSpec, ExecutablePlan, LeafKind, LeafSpec } from "./plan";

export type TimerView =
  | { readonly kind: "COUNTDOWN"; readonly remainingMs: Ms; readonly totalMs: Ms; readonly elapsedMs: Ms }
  | { readonly kind: "STOPWATCH"; readonly elapsedMs: Ms; readonly nominalMs: Ms | null }
  | { readonly kind: "NONE" };

export type NextView = {
  readonly kind: LeafKind;
  readonly name: string | null;
  readonly plannedMs: Ms | null;
  readonly target: SeriesTarget | null;
  readonly mode: LeafSpec["mode"] | null;
  /** Série de l'étape suivante, affichée après le nom (recette PRE-10 du 09/11/2026). */
  readonly series: { readonly current: number; readonly total: number } | null;
  /** Côté de l'étape suivante (Série suivante du même côté : écran sans fondu, recette du 13/11/2026). */
  readonly sideRank: 1 | 2 | null;
};

/**
 * Liste des étapes de la Séance pendant l'Exécution — essai demandé par Hermann le 10/11/2026 (« besoin à
 * suivre » : en cours en gras, passé en gris puis effacé ; puis « Faire apparaître les pauses, etc. »), avant le
 * Figma cible. Une ligne par étape du plan (séries, pauses, récupérations, Point d'arrêt), sans le Compte à rebours
 * initial ni la Fin de séance (« Sauf compte à rebours et fin de séance ») ; les étapes antérieures à la
 * précédente sont retirées ; la précédente est « passée ».
 */
export type OutlineItem = {
  readonly key: string;
  readonly kind: LeafKind;
  readonly name: string | null;
  readonly series: { readonly current: number; readonly total: number } | null;
  readonly sideRank: 1 | 2 | null;
  readonly tour: { readonly current: number; readonly total: number } | null;
  /** Durée prévue d'une étape chronométrée ; `null` sinon. */
  readonly plannedMs: Ms | null;
  readonly status: "past" | "current" | "upcoming";
};

export type EstimatedDuration = { readonly kind: "exact" | "estimated" | "lowerBound"; readonly ms: Ms };

/**
 * Recette du 12/11/2026 (Hermann, e1b : « Il faut que les deux présentent le nombre de séries et de tours de l'exercice
 * à venir » ; e1f : « le titre de l'écran et l'écran entier, n'est pas point d'arrêt, mais l'exercice qui suit ») :
 * exercice à venir pendant le Compte à rebours initial et au Point d'arrêt ; `null` ailleurs. `after` : l'étape qui
 * le suit (« À suivre » au Point d'arrêt).
 */
export type UpcomingActivity = {
  readonly name: string | null;
  readonly series: { readonly current: number; readonly total: number } | null;
  readonly tour: { readonly current: number; readonly total: number } | null;
  readonly sideRank: 1 | 2 | null;
  readonly mode: LeafSpec["mode"] | null;
  readonly target: SeriesTarget | null;
  readonly loadKg: number | null;
  /** Durée d'une étape chronométrée (compte à rebours) ; `null` sinon. */
  readonly timedMs: Ms | null;
  readonly after: NextView | null;
};

export type ExecutionProjection = {
  readonly status: EngineState["status"];
  readonly pauseReason: PauseReason | null;
  readonly finishReason: FinishReason | null;
  readonly sessionName: string;
  readonly phase: LeafKind | null;
  /** Étape visée par les commandes de l'interface (`clé#tentative`). */
  readonly target: string | null;
  readonly exerciseName: string | null;
  readonly series: { readonly current: number; readonly total: number } | null;
  readonly tour: { readonly current: number; readonly total: number } | null;
  /** Côté 1 ou côté 2 (RM-243) ; `null` sans changement de côté. */
  readonly sideRank: 1 | 2 | null;
  readonly mode: LeafSpec["mode"] | null;
  readonly seriesTarget: SeriesTarget | null;
  readonly loadKg: number | null;
  readonly timer: TimerView;
  /**
   * Phase guidée courante (motif de phases, D-446) ; `null` sans motif. `phaseMs` : durée de la phase, affichée
   * à la place de son décompte (recette e1 du 12/11/2026, Hermann : « Phases : montrer le texte le nombre de minutes /
   * secondes, mais pas le décompte »).
   */
  readonly guidance: { readonly label: string; readonly remainingMs: Ms; readonly phaseMs: Ms } | null;
  readonly next: NextView | null;
  readonly upcoming: UpcomingActivity | null;
  readonly outline: readonly OutlineItem[];
  readonly sessionElapsedMs: Ms;
  readonly estimated: EstimatedDuration;
  /** 0..1 (RM-077). */
  readonly progress: number;
  readonly commands: {
    readonly reset: boolean;
    /** « Réinitialiser la récupération » pendant une pause ou une récupération (CE §Commandes principales). */
    readonly resetScope: "EXERCISE" | "RECOVERY";
    readonly pause: boolean;
    readonly next: boolean;
    /** Suivant demande confirmation : étape chronométrée avant son terme (ch08). */
    readonly nextNeedsConfirmation: boolean;
    /** Le bouton Suivant vaut « Continuer » (Point d'arrêt). */
    readonly isContinue: boolean;
  };
};

function rootLeaves(plan: ExecutablePlan): readonly LeafSpec[] {
  return plan.items.flatMap((item: ChildSpec) => (item.type === "LEAF" ? [item.leaf] : []));
}

/** Étape sans durée déterminable : Séries manuelles sans cadence ou À l'échec (R de RM-077). */
function isUntimedSeries(leaf: LeafSpec): boolean {
  return leaf.kind === "ACTIVITY" && leaf.end === "MANUAL" && !(leaf.cadenceMs !== undefined && leaf.target?.kind === "NUMBER" && leaf.plannedMs !== null);
}

function temporalMs(leaf: LeafSpec): Ms {
  if (leaf.kind === "STOP_POINT" || isUntimedSeries(leaf)) return 0;
  return leaf.plannedMs ?? 0;
}

type Weights = { readonly m: number; readonly r: number; readonly t: Ms };

function weightsOf(leaves: readonly LeafSpec[]): Weights {
  let m = 0;
  let r = 0;
  let t = 0;
  for (const leaf of leaves) {
    if (isUntimedSeries(leaf)) {
      m += 1;
      r += 1;
    } else {
      const d = temporalMs(leaf);
      if (d > 0) {
        m += 1;
        t += d;
      }
    }
  }
  return { m, r, t };
}

function weightOf(leaf: LeafSpec, weights: Weights): number {
  if (weights.m === 0) return 0;
  if (isUntimedSeries(leaf)) return 1 / weights.m;
  const d = temporalMs(leaf);
  if (d <= 0 || weights.t === 0) return 0;
  return ((weights.r === 0 ? 1 : 1 - weights.r / weights.m) * d) / weights.t;
}

/** Durée estimée d'exécution (CE : exacte, ≈ avec cadence ou motif, ≥ avec composante inconnue). */
export function estimatedDuration(plan: ExecutablePlan): EstimatedDuration {
  let ms = 0;
  let kind: EstimatedDuration["kind"] = "exact";
  for (const leaf of rootLeaves(plan)) {
    if (leaf.kind === "STOP_POINT") continue;
    if (leaf.contribution === "omitted") {
      kind = "lowerBound";
      continue;
    }
    ms += leaf.plannedMs ?? 0;
    if (leaf.contribution === "estimated" && kind === "exact") kind = "estimated";
  }
  return { kind, ms };
}

function rootIndex(state: EngineState): number {
  const root = state.frames[0];
  return root === undefined ? 0 : ((root.local as { index?: number } | null)?.index ?? 0);
}

function progressOf(plan: ExecutablePlan, state: EngineState, atMs: Ms): number {
  if (state.status === "FINISHED") return state.finish?.reason === "COMPLETED" ? 1 : progressBefore(plan, state, atMs);
  return progressBefore(plan, state, atMs);
}

function progressBefore(plan: ExecutablePlan, state: EngineState, atMs: Ms): number {
  const leaves = rootLeaves(plan);
  if (leaves.length !== plan.items.length || state.status === "READY") return 0;
  const weights = weightsOf(leaves);
  const index = rootIndex(state);
  let value = 0;
  for (let i = 0; i < Math.min(index, leaves.length); i += 1) value += weightOf(leaves[i]!, weights);
  const leaf = state.leaf;
  if (leaf !== null && state.status !== "FINISHED") {
    const weight = weightOf(leaf.spec, weights);
    const planned = temporalMs(leaf.spec);
    if (planned > 0 && !isUntimedSeries(leaf.spec)) {
      let done: Ms;
      if (leaf.spec.end === "MANUAL" && leaf.spec.cadenceMs !== undefined) {
        // Cadence : intervalles complets acquis seulement (RM-077, T04).
        const running = leaf.cadenceAnchorMs === null ? 0 : Math.floor(Math.max(0, atMs - leaf.cadenceAnchorMs) / leaf.spec.cadenceMs);
        done = (leaf.cadenceAcquired + running) * leaf.spec.cadenceMs;
      } else {
        done = leafElapsedMs(state, atMs);
      }
      value += weight * Math.min(1, done / planned);
    }
  }
  // Jamais 100 % avant la clôture de la Fin de séance.
  return Math.min(value, 0.999);
}

function nextOf(plan: ExecutablePlan, state: EngineState): NextView | null {
  if (state.frames.length !== 1) return null;
  const item = plan.items[rootIndex(state) + 1];
  if (item === undefined || item.type !== "LEAF" || item.leaf.kind === "SESSION_END") return null;
  return nextViewOf(plan, item.leaf);
}

function upcomingOf(plan: ExecutablePlan, state: EngineState): UpcomingActivity | null {
  const kind = state.leaf?.spec.kind;
  if (state.frames.length !== 1 || (kind !== "INITIAL_COUNTDOWN" && kind !== "STOP_POINT")) return null;
  const from = rootIndex(state) + 1;
  for (let index = from; index < plan.items.length; index += 1) {
    const item = plan.items[index]!;
    if (item.type !== "LEAF") return null;
    const spec = item.leaf;
    if (spec.kind === "SESSION_END") return null;
    if (spec.kind !== "ACTIVITY") continue;
    const following = plan.items[index + 1];
    const circuit = spec.context?.circuit ?? null;
    return {
      name: spec.exerciseId === undefined ? null : (plan.exercises[spec.exerciseId]?.name ?? null),
      series: spec.series !== undefined && spec.series !== null && spec.seriesCount !== undefined ? { current: spec.series, total: spec.seriesCount } : null,
      tour: circuit === null ? null : { current: circuit.tour, total: circuit.count },
      sideRank: spec.sideRank ?? null,
      mode: spec.mode ?? null,
      target: spec.target === undefined ? null : spec.target,
      loadKg: spec.loadKg ?? null,
      timedMs: spec.end === "TIMED" ? (spec.plannedMs ?? 0) : null,
      after: following === undefined || following.type !== "LEAF" || following.leaf.kind === "SESSION_END" ? null : nextViewOf(plan, following.leaf),
    };
  }
  return null;
}

function nextViewOf(plan: ExecutablePlan, spec: LeafSpec): NextView {
  return {
    kind: spec.kind,
    name: spec.exerciseId === undefined ? null : (plan.exercises[spec.exerciseId]?.name ?? null),
    plannedMs: spec.plannedMs,
    target: spec.target === undefined ? null : spec.target,
    mode: spec.mode ?? null,
    series: spec.kind === "ACTIVITY" && spec.series !== undefined && spec.series !== null && spec.seriesCount !== undefined ? { current: spec.series, total: spec.seriesCount } : null,
    sideRank: spec.sideRank ?? null,
  };
}

function outlineOf(plan: ExecutablePlan, state: EngineState): readonly OutlineItem[] {
  if (state.status === "FINISHED") return [];
  const at = state.status === "READY" ? 0 : rootIndex(state);
  const current = state.status === "READY" ? -1 : at;
  return plan.items.flatMap((item, index): OutlineItem[] => {
    if (item.type !== "LEAF" || index < at - 1) return [];
    const spec = item.leaf;
    if (spec.kind === "INITIAL_COUNTDOWN" || spec.kind === "SESSION_END") return [];
    const circuit = spec.context?.circuit ?? null;
    return [
      {
        key: spec.key,
        kind: spec.kind,
        name: spec.exerciseId === undefined ? null : (plan.exercises[spec.exerciseId]?.name ?? null),
        series: spec.kind === "ACTIVITY" && spec.series !== undefined && spec.series !== null && spec.seriesCount !== undefined && spec.seriesCount > 1 ? { current: spec.series, total: spec.seriesCount } : null,
        sideRank: spec.kind === "ACTIVITY" ? (spec.sideRank ?? null) : null,
        tour: circuit === null ? null : { current: circuit.tour, total: circuit.count },
        plannedMs: spec.end === "TIMED" ? spec.plannedMs : null,
        status: index < current ? "past" : index === current ? "current" : "upcoming",
      },
    ];
  });
}

function timerOf(state: EngineState, atMs: Ms): TimerView {
  const leaf = state.leaf;
  if (leaf === null || leaf.spec.end === "INTERACTION") return { kind: "NONE" };
  const elapsedMs = leafElapsedMs(state, atMs);
  // Recette e1 du 12/11/2026 (Hermann, f : « Au point d'arrêt […] Un chronomètre se déclenche ») : l'attente d'un
  // Point d'arrêt est chronométrée à l'écran. [Point d'arrêt sans chrono — remplacé.]
  if (leaf.spec.end === "WAIT") return { kind: "STOPWATCH", elapsedMs, nominalMs: null };
  if (leaf.spec.end === "TIMED") {
    const totalMs = leaf.spec.plannedMs ?? 0;
    return { kind: "COUNTDOWN", remainingMs: Math.max(0, totalMs - elapsedMs), totalMs, elapsedMs };
  }
  return { kind: "STOPWATCH", elapsedMs, nominalMs: leaf.spec.plannedMs };
}

function guidanceOf(plan: ExecutablePlan, state: EngineState, atMs: Ms): ExecutionProjection["guidance"] {
  const leaf = state.leaf;
  if (leaf === null || leaf.spec.kind !== "ACTIVITY" || leaf.spec.exerciseId === undefined) return null;
  const phases = plan.exercises[leaf.spec.exerciseId]?.workPhases ?? [];
  if (phases.length === 0 || workPhasesCycleSeconds(phases) === null) return null;
  const limit = leaf.spec.end === "TIMED" ? (leaf.spec.plannedMs ?? 0) / 1000 : null;
  const at = phaseGuidanceAt(phases, leafElapsedMs(state, atMs) / 1000, limit);
  const phase = phases[at.phaseIndex]!;
  return { label: phase.label, remainingMs: at.phaseRemainingSeconds * 1000, phaseMs: phase.durationSeconds * 1000 };
}

export function projectExecution(plan: ExecutablePlan, state: EngineState, atMs: Ms): ExecutionProjection {
  const leaf = state.leaf;
  const spec = leaf?.spec ?? null;
  const running = state.status === "RUNNING";
  const elapsed = leafElapsedMs(state, atMs);
  const stopwatch = sessionStopwatch(state);
  const recoveryLike = spec !== null && spec.kind !== "ACTIVITY";
  return {
    status: state.status,
    pauseReason: state.pause?.reason ?? null,
    finishReason: state.finish?.reason ?? null,
    sessionName: plan.sessionName,
    phase: spec?.kind ?? null,
    target: leaf === null ? null : leafTarget(leaf),
    exerciseName: spec?.exerciseId === undefined || spec === null ? null : (plan.exercises[spec.exerciseId]?.name ?? null),
    series: spec?.kind === "ACTIVITY" && spec.series !== undefined && spec.series !== null && spec.seriesCount !== undefined ? { current: spec.series, total: spec.seriesCount } : null,
    tour: spec?.context?.circuit === null || spec?.context?.circuit === undefined ? null : { current: spec.context.circuit.tour, total: spec.context.circuit.count },
    sideRank: spec?.sideRank ?? null,
    mode: spec?.mode ?? null,
    seriesTarget: spec === null || spec.target === undefined ? null : spec.target,
    loadKg: spec?.loadKg ?? null,
    timer: timerOf(state, atMs),
    guidance: guidanceOf(plan, state, atMs),
    next: nextOf(plan, state),
    upcoming: upcomingOf(plan, state),
    outline: outlineOf(plan, state),
    sessionElapsedMs: stopwatch === null ? 0 : runningMs(stopwatch, atMs),
    estimated: estimatedDuration(plan),
    progress: progressOf(plan, state, atMs),
    commands: {
      reset: running && spec !== null && resettable(spec),
      resetScope: recoveryLike ? "RECOVERY" : "EXERCISE",
      pause: running,
      next: running && spec !== null && (spec.end === "MANUAL" || spec.end === "WAIT" || spec.end === "TIMED"),
      nextNeedsConfirmation: running && spec !== null && needsNextConfirmation(spec) && elapsed < (spec.plannedMs ?? 0),
      isContinue: spec?.kind === "STOP_POINT",
    },
  };
}
