/**
 * PRE-10.1 — noyau déterministe du moteur d'exécution (conception consolidée §3, §4, §6.4, §8 à §10, §13).
 *
 * `transition(env, state, event, readingMs) → { state, results, effects }` : fonction pure. Aucune
 * lecture de `Date.now`, de React, de SQLite, du son ou de l'haptique. L'heure est une lecture injectée
 * par le runtime (§8.2) ; la prescription et les pilotes font partie de l'environnement explicite (§9.3).
 *
 * **Parcours.** Une pile de portées (`frames`) pilotées chacune par un pilote (§6.4 : ouvrir, enfant clos,
 * référence temporelle échue, commande) et, au sommet, au plus une étape (`leaf`). La Séance est la portée
 * racine `SEQUENCE` sur la prescription exécutable. Les politiques de Format (PRE-11, politiques de test
 * en PRE-10) sont d'autres pilotes ; elles ne possèdent ni horloge, ni persistance, ni déduplication.
 *
 * **Temps (§8.1).** Un registre unique de références temporelles : rôle (STEP, WINDOW, DEADLINE,
 * STOPWATCH, SAFETY), propriétaire, budget éventuel, ancre et temps accumulé actif. Aucune n'est un timer.
 * L'échéance logique d'une référence est `ancre + budget − accumulé` ; une transition automatique a lieu à
 * cet instant logique, jamais à l'heure tardive du callback (aucun retard ajouté à chaque étape).
 *
 * **Réconciliation (§9.3, §10, §14.1).** Avant une commande lue à `t`, le noyau franchit dans l'ordre
 * chronologique toutes les échéances strictement antérieures à `t` ; il applique la commande ; puis il
 * franchit celles atteintes à `t` (Q4 : un travail confirmé à l'instant de l'échéance ou avant est acquis).
 * Plusieurs échéances au même instant : la plus interne d'abord (son acquisition est prise en compte),
 * puis l'englobante ; **aucune nouvelle portée ni étape n'est ouverte à un instant où une référence
 * englobante est échue** — elle est d'abord traitée par sa politique. Le résultat ne dépend pas de
 * l'ordre d'arrivée des callbacks (T23).
 *
 * **Fermeture des descendants (§10).** Quand une référence d'une portée échoit, le noyau ferme d'abord ses
 * descendants (motif `PARENT_REFERENCE`, étape en cours comprise, récupération comprise — B02), puis rend
 * la main au pilote propriétaire.
 *
 * **Idempotence (§10, §15.2).** Commandes identifiées (`commandId`) dédupliquées ; commande ciblée sur une
 * étape (`target` = clé#tentative) ignorée si l'étape n'est plus courante ; génération incrémentée à chaque
 * changement temporel, portée par les réveils programmés (un callback ancien est sans effet, T06).
 */

import type { ChildSpec, ExecutablePlan, LeafSpec, ScopeSpec } from "./plan";

export const ENGINE_STATE_VERSION = 1 as const;

export type Ms = number;

/** Rôles temporels (§8.1) et sécurité d'inactivité (RM-068, RM-069). */
export type TimeRole = "STEP" | "WINDOW" | "DEADLINE" | "STOPWATCH" | "SAFETY";

export type TimeRef = {
  readonly id: string;
  /** Clé de la portée ou de l'étape propriétaire. */
  readonly owner: string;
  /** Profondeur du propriétaire dans la pile (étape = nombre de portées). */
  readonly depth: number;
  readonly name: string;
  readonly role: TimeRole;
  readonly budgetMs: Ms | null;
  /** Ancre du segment actif en cours ; `null` quand la référence est suspendue (Pause). */
  readonly anchorMs: Ms | null;
  readonly accumulatedMs: Ms;
};

export type ExecutionStatus = "READY" | "RUNNING" | "PAUSED" | "FINISHED";
/** `USER` : Pause volontaire ; `DIALOG` : suspension pendant une confirmation ; `SAFETY` : pause de sécurité ; `RESTORE` : reprise sans continuité temporelle (Q6). */
export type PauseReason = "USER" | "DIALOG" | "SAFETY" | "RESTORE";
export type FinishReason = "COMPLETED" | "STOPPED";

export type Frame = { readonly spec: ScopeSpec; readonly local: unknown; readonly depth: number };

export type LeafState = {
  readonly spec: LeafSpec;
  readonly attempt: number;
  readonly openedAtMs: Ms;
  /** Temps actif des tentatives antérieures de cette étape (Réinitialiser, T05). */
  readonly priorAttemptsMs: Ms;
  /** Cadence : intervalles complets acquis ; la fraction en cours est abandonnée à la Pause (RM-077, T04). */
  readonly cadenceAcquired: number;
  readonly cadenceAnchorMs: Ms | null;
};

export type EngineState = {
  readonly version: typeof ENGINE_STATE_VERSION;
  readonly executionId: string;
  readonly status: ExecutionStatus;
  readonly pause: { readonly reason: PauseReason; readonly atMs: Ms } | null;
  readonly finish: { readonly reason: FinishReason; readonly atMs: Ms } | null;
  readonly startedAtMs: Ms | null;
  readonly frames: readonly Frame[];
  readonly leaf: LeafState | null;
  readonly refs: readonly TimeRef[];
  /**
   * Étapes d'Exercice déjà closes de l'occurrence courante (tentatives, temps actif cumulé) : seule mémoire
   * nécessaire pour qu'une Série rejouée par Réinitialiser (bilatéral, D-029) conserve son temps antérieur.
   * Proportionnée à une occurrence, vidée à l'occurrence suivante.
   */
  readonly history: { readonly occurrenceKey: string | null; readonly steps: Readonly<Record<string, StepHistory>> };
  /** Antériorité des étapes rejouées (tentatives et temps actif à ajouter à leur prochaine clôture). */
  readonly rewound: Readonly<Record<string, StepHistory>>;
  readonly generation: number;
  /** Nombre de transitions appliquées (identité de transition, diagnostic §16.3). */
  readonly seq: number;
  /** Dernière lecture temporelle évaluée (reprise sans continuité, Q6). */
  readonly evaluatedAtMs: Ms | null;
  readonly recentCommandIds: readonly string[];
};

export type StepHistory = { readonly attempts: number; readonly activeMs: Ms };

export type StepCompletion = "COMPLETED" | "PARTIAL" | "SKIPPED" | "CLOSED_BY_PARENT" | "INTERRUPTED";

/** Résultat d'étape, clé stable : Exécution + étape (identité d'occurrence/série/côté) ; la tentative est une donnée. */
export type StepResult = {
  readonly key: string;
  readonly leafKind: LeafSpec["kind"];
  readonly exerciseId: string | null;
  readonly occurrenceKey: string | null;
  readonly series: number | null;
  readonly side: string | null;
  readonly attempts: number;
  /** Temps actif de la dernière tentative (relevé de performance, §13). */
  readonly lastAttemptMs: Ms;
  /** Temps actif cumulé, tentatives antérieures comprises (T05). */
  readonly cumulativeActiveMs: Ms;
  readonly plannedMs: Ms | null;
  readonly completion: StepCompletion;
  readonly endedAtMs: Ms;
  readonly context: LeafSpec["context"] | null;
};

export type ResultChange =
  | { readonly type: "STEP"; readonly key: string; readonly result: StepResult }
  | { readonly type: "SCOPE"; readonly key: string; readonly result: unknown };

export type EngineEffect =
  | { readonly type: "STEP_STARTED"; readonly key: string; readonly kind: LeafSpec["kind"]; readonly atMs: Ms; readonly attempt: number }
  | { readonly type: "STEP_ENDED"; readonly key: string; readonly completion: StepCompletion; readonly atMs: Ms }
  | { readonly type: "PAUSED"; readonly reason: PauseReason; readonly atMs: Ms }
  | { readonly type: "FINISHED"; readonly reason: FinishReason; readonly atMs: Ms };

export type EngineCommand =
  | { readonly type: "START" }
  | { readonly type: "PAUSE"; readonly reason?: "USER" | "DIALOG" }
  | { readonly type: "RESUME" }
  /** Suivant : `confirmed` requis avant le terme d'une étape chronométrée (ch08, CE-EXEC-SESSION-01). */
  | { readonly type: "NEXT"; readonly confirmed?: boolean }
  | { readonly type: "RESET" }
  /** Arrêter la séance : seulement depuis la Pause (ch08). */
  | { readonly type: "STOP" }
  /** Validation d'une Clôture (interaction bloquante, D3). */
  | { readonly type: "SUBMIT"; readonly payload: unknown }
  | { readonly type: "TICK" };

export type EngineEvent = EngineCommand & {
  readonly commandId?: string;
  /** Étape visée (`clé#tentative`) ; une commande arrivée pour une autre étape est ignorée (§9.2). */
  readonly target?: string;
};

export type TransitionOutcome = "APPLIED" | "IGNORED" | "REJECTED";
export type RejectionReason = "NOT_RUNNING" | "NOT_PAUSED" | "NOT_READY" | "CONFIRMATION_REQUIRED" | "NOT_ALLOWED" | "STALE_TARGET" | "DUPLICATE";

export type TransitionResult = {
  readonly state: EngineState;
  readonly results: readonly ResultChange[];
  readonly effects: readonly EngineEffect[];
  readonly outcome: TransitionOutcome;
  readonly reason?: RejectionReason;
};

// ————————————————————————————————————————————————————————————————— pilotes (§6.4)

export type PilotContext = { readonly nowMs: Ms; readonly env: EngineEnv; readonly scopeKey: string; readonly depth: number; readonly spec: ScopeSpec };

export type NewRef = { readonly name: string; readonly role: Exclude<TimeRole, "SAFETY">; readonly budgetMs: Ms | null };

export type ClosedChild = {
  readonly kind: "LEAF" | "SCOPE";
  readonly key: string;
  readonly leafKind?: LeafSpec["kind"];
  readonly completion: StepCompletion;
  readonly elapsedMs: Ms;
  readonly contribution?: unknown;
};

export type PilotDecision = {
  readonly local: unknown;
  readonly openRefs?: readonly NewRef[];
  readonly closeRefs?: readonly string[];
  readonly results?: readonly ResultChange[];
  /** `CHILD` : ouvrir l'enfant ; `CLOSE` : clore la portée ; `IDLE` : attendre une référence de la portée. */
  readonly next: { readonly type: "CHILD"; readonly child: ChildSpec } | { readonly type: "CLOSE"; readonly contribution?: unknown } | { readonly type: "IDLE" };
};

/** Réponse d'un pilote à Réinitialiser : rejouer depuis l'étape `toKey` de la portée, ou refuser (Q2). */
export type ResetDecision = { readonly type: "REWIND"; readonly local: unknown; readonly child: ChildSpec; readonly replayedKeys: readonly string[] } | { readonly type: "RESTART" } | { readonly type: "REFUSE" };

export interface Pilot {
  open(spec: ScopeSpec, ctx: PilotContext): PilotDecision;
  onChildClosed(local: unknown, closed: ClosedChild, ctx: PilotContext): PilotDecision;
  onReference(local: unknown, refName: string, ctx: PilotContext): PilotDecision;
  /** Réinitialiser visant l'étape courante, enfant direct de cette portée. Défaut : redémarrer l'étape. */
  onReset?(local: unknown, leaf: LeafSpec, ctx: PilotContext): ResetDecision;
  /** Commande autorisée dans cette portée (Q2 : Réinitialiser désactivé dans un AMRAP ou un Death by). */
  allows?(local: unknown, command: EngineCommand["type"], leaf: LeafSpec | null): boolean;
}

export type EngineEnv = {
  readonly plan: ExecutablePlan;
  readonly pilots: Readonly<Record<string, Pilot>>;
};

// ————————————————————————————————————————————————————————————————— constantes

/** RM-068 : 30 min après la fin nominale d'une Série cadencée. */
export const SAFETY_AFTER_NOMINAL_MS = 30 * 60 * 1000;
/** RM-069 : 2 h sans interaction (À l'échec, Répétitions sans bip). */
export const SAFETY_IDLE_MS = 2 * 60 * 60 * 1000;
const RECENT_COMMANDS = 32;
/** Garde technique contre une boucle sans progrès : erreur de parcours, pas une borne métier (§9.3). */
const MAX_STEPS_PER_TRANSITION = 100_000;

export const ROOT_SCOPE_KEY = "session";
export const SEQUENCE_PILOT = "SEQUENCE";

export class EngineFlowError extends Error {}

// ————————————————————————————————————————————————————————————————— état initial

export function createInitialState(executionId: string): EngineState {
  return {
    version: ENGINE_STATE_VERSION,
    executionId,
    status: "READY",
    pause: null,
    finish: null,
    startedAtMs: null,
    frames: [],
    leaf: null,
    refs: [],
    history: { occurrenceKey: null, steps: {} },
    rewound: {},
    generation: 0,
    seq: 0,
    evaluatedAtMs: null,
    recentCommandIds: [],
  };
}

// ————————————————————————————————————————————————————————————————— références temporelles

export function runningMs(ref: Pick<TimeRef, "anchorMs" | "accumulatedMs">, atMs: Ms): Ms {
  return ref.accumulatedMs + (ref.anchorMs === null ? 0 : Math.max(0, atMs - ref.anchorMs));
}

/** Échéance logique d'une référence active à budget ; `null` si suspendue ou sans budget. */
export function dueAtMs(ref: TimeRef): Ms | null {
  return ref.budgetMs === null || ref.anchorMs === null ? null : ref.anchorMs + ref.budgetMs - ref.accumulatedMs;
}

/** Prochaine échéance logique de l'Exécution (réveil à programmer, §8.3). */
export function nextDueAtMs(state: EngineState): Ms | null {
  if (state.status !== "RUNNING") return null;
  let next: Ms | null = null;
  for (const ref of state.refs) {
    const due = dueAtMs(ref);
    if (due !== null && (next === null || due < next)) next = due;
  }
  return next;
}

export function leafTarget(leaf: LeafState): string {
  return `${leaf.spec.key}#${leaf.attempt}`;
}

export function leafStepRef(state: EngineState): TimeRef | null {
  if (state.leaf === null) return null;
  const owner = leafTarget(state.leaf);
  return state.refs.find((ref) => ref.owner === owner && ref.role === "STEP") ?? null;
}

export function sessionStopwatch(state: EngineState): TimeRef | null {
  return state.refs.find((ref) => ref.owner === ROOT_SCOPE_KEY && ref.name === "session") ?? null;
}

/** Temps actif de la tentative courante de l'étape. */
export function leafElapsedMs(state: EngineState, atMs: Ms): Ms {
  const ref = leafStepRef(state);
  return ref === null ? 0 : runningMs(ref, atMs);
}

// ————————————————————————————————————————————————————————————————— transition

type Draft = {
  state: EngineState;
  results: ResultChange[];
  effects: EngineEffect[];
  env: EngineEnv;
  guard: number;
};

function bump(draft: Draft) {
  draft.guard += 1;
  if (draft.guard > MAX_STEPS_PER_TRANSITION) {
    throw new EngineFlowError("Execution flow made no progress (guard reached).");
  }
}

function set(draft: Draft, patch: Partial<EngineState>) {
  draft.state = { ...draft.state, ...patch };
}

function newGeneration(draft: Draft) {
  set(draft, { generation: draft.state.generation + 1 });
}

function addRef(draft: Draft, ref: TimeRef) {
  set(draft, { refs: [...draft.state.refs.filter((existing) => existing.id !== ref.id), ref] });
}

function removeRefsOwnedBy(draft: Draft, owners: ReadonlySet<string>) {
  set(draft, { refs: draft.state.refs.filter((ref) => !owners.has(ref.owner)) });
}

function pilotOf(env: EngineEnv, spec: ScopeSpec): Pilot {
  const pilot = env.pilots[spec.pilot];
  if (pilot === undefined) throw new EngineFlowError(`Unknown pilot ${spec.pilot}.`);
  return pilot;
}

function ctxFor(draft: Draft, frameIndex: number, nowMs: Ms): PilotContext {
  const frame = draft.state.frames[frameIndex]!;
  return { nowMs, env: draft.env, scopeKey: frame.spec.key, depth: frame.depth, spec: frame.spec };
}

/** Une référence englobante (portée de profondeur < `depth`) est-elle échue à `atMs` ? */
function enclosingDueAt(draft: Draft, depth: number, atMs: Ms): boolean {
  return draft.state.refs.some((ref) => {
    const due = dueAtMs(ref);
    return due !== null && due <= atMs && ref.depth < depth;
  });
}

function safetyBudget(spec: LeafSpec): Ms | null {
  if (spec.kind !== "ACTIVITY" || spec.end !== "MANUAL") return null;
  // RM-068 : Répétitions chiffrées avec bip, 30 min après la fin nominale ; RM-069 : sinon 2 h sans interaction.
  if (spec.cadenceMs !== undefined && spec.target?.kind === "NUMBER" && spec.plannedMs !== null) {
    return spec.plannedMs + SAFETY_AFTER_NOMINAL_MS;
  }
  return SAFETY_IDLE_MS;
}

function openLeaf(draft: Draft, spec: LeafSpec, atMs: Ms, attempt = 1, priorAttemptsMs = 0) {
  const depth = draft.state.frames.length;
  const leaf: LeafState = { spec, attempt, openedAtMs: atMs, priorAttemptsMs, cadenceAcquired: 0, cadenceAnchorMs: spec.cadenceMs === undefined ? null : atMs };
  const owner = leafTarget(leaf);
  set(draft, { leaf });
  addRef(draft, {
    id: `${owner}::step`,
    owner,
    depth,
    name: "step",
    role: "STEP",
    budgetMs: spec.end === "TIMED" ? (spec.plannedMs ?? 0) : null,
    anchorMs: atMs,
    accumulatedMs: 0,
  });
  const safety = safetyBudget(spec);
  if (safety !== null) {
    addRef(draft, { id: `${owner}::safety`, owner, depth, name: "safety", role: "SAFETY", budgetMs: safety, anchorMs: atMs, accumulatedMs: 0 });
  }
  newGeneration(draft);
  draft.effects.push({ type: "STEP_STARTED", key: spec.key, kind: spec.kind, atMs, attempt });
}

function openChild(draft: Draft, child: ChildSpec, atMs: Ms) {
  bump(draft);
  const depth = draft.state.frames.length;
  if (enclosingDueAt(draft, depth, atMs)) {
    // Aucune ouverture à l'instant d'une échéance englobante : sa politique décide d'abord (voir l'en-tête).
    return;
  }
  if (child.type === "LEAF") {
    openLeaf(draft, child.leaf, atMs);
    return;
  }
  const frame: Frame = { spec: child.scope, local: null, depth };
  set(draft, { frames: [...draft.state.frames, frame] });
  const decision = pilotOf(draft.env, child.scope).open(child.scope, ctxFor(draft, depth, atMs));
  applyDecision(draft, depth, decision, atMs);
}

function applyDecision(draft: Draft, frameIndex: number, decision: PilotDecision, atMs: Ms) {
  bump(draft);
  const frame = draft.state.frames[frameIndex]!;
  const frames = [...draft.state.frames];
  frames[frameIndex] = { ...frame, local: decision.local };
  set(draft, { frames });
  const key = frame.spec.key;
  for (const name of decision.closeRefs ?? []) {
    set(draft, { refs: draft.state.refs.filter((ref) => !(ref.owner === key && ref.name === name)) });
    newGeneration(draft);
  }
  for (const ref of decision.openRefs ?? []) {
    addRef(draft, { id: `${key}::${ref.name}`, owner: key, depth: frame.depth, name: ref.name, role: ref.role, budgetMs: ref.budgetMs, anchorMs: atMs, accumulatedMs: 0 });
    newGeneration(draft);
  }
  draft.results.push(...(decision.results ?? []));
  switch (decision.next.type) {
    case "IDLE":
      return;
    case "CHILD":
      openChild(draft, decision.next.child, atMs);
      return;
    case "CLOSE":
      closeFrame(draft, frameIndex, "COMPLETED", atMs, decision.next.contribution);
      return;
    default: {
      const unreachable: never = decision.next;
      return unreachable;
    }
  }
}

function stepResult(draft: Draft, leaf: LeafState, completion: StepCompletion, atMs: Ms): StepResult {
  const ref = draft.state.refs.find((candidate) => candidate.owner === leafTarget(leaf) && candidate.role === "STEP");
  const lastAttemptMs = ref === undefined ? 0 : runningMs(ref, atMs);
  const prior = draft.state.rewound[leaf.spec.key];
  return {
    key: leaf.spec.key,
    leafKind: leaf.spec.kind,
    exerciseId: leaf.spec.exerciseId ?? null,
    occurrenceKey: leaf.spec.occurrenceKey ?? null,
    series: leaf.spec.series ?? null,
    side: leaf.spec.side ?? null,
    attempts: leaf.attempt + (prior?.attempts ?? 0),
    lastAttemptMs,
    cumulativeActiveMs: leaf.priorAttemptsMs + lastAttemptMs + (prior?.activeMs ?? 0),
    plannedMs: leaf.spec.plannedMs,
    completion,
    endedAtMs: atMs,
    context: leaf.spec.context ?? null,
  };
}

/** Résultats conservés : étapes d'Exercice et phases chronométrées (prévu/écoulé, ch09) ; pas les Points d'arrêt. */
function recordsResult(leaf: LeafState): boolean {
  return leaf.spec.kind !== "STOP_POINT" && leaf.spec.kind !== "CLOSURE";
}

/** Ferme l'étape courante ; avec `notifyParent`, rend la main au pilote de la portée sommet. */
function closeLeaf(draft: Draft, completion: StepCompletion, atMs: Ms, notifyParent: boolean, contribution?: unknown) {
  const leaf = draft.state.leaf;
  if (leaf === null) return;
  bump(draft);
  const result = stepResult(draft, leaf, completion, atMs);
  if (recordsResult(leaf)) draft.results.push({ type: "STEP", key: leaf.spec.key, result });
  const rewound = { ...draft.state.rewound };
  delete rewound[leaf.spec.key];
  let history = draft.state.history;
  if (leaf.spec.kind === "ACTIVITY" && leaf.spec.occurrenceKey !== undefined) {
    const steps = history.occurrenceKey === leaf.spec.occurrenceKey ? history.steps : {};
    history = { occurrenceKey: leaf.spec.occurrenceKey, steps: { ...steps, [leaf.spec.key]: { attempts: result.attempts, activeMs: result.cumulativeActiveMs } } };
  }
  removeRefsOwnedBy(draft, new Set([leafTarget(leaf)]));
  set(draft, { leaf: null, rewound, history });
  newGeneration(draft);
  draft.effects.push({ type: "STEP_ENDED", key: leaf.spec.key, completion, atMs });
  if (!notifyParent) return;
  const top = draft.state.frames.length - 1;
  const frame = draft.state.frames[top]!;
  const closed: ClosedChild = {
    kind: "LEAF",
    key: leaf.spec.key,
    leafKind: leaf.spec.kind,
    completion,
    elapsedMs: result.lastAttemptMs,
    ...(contribution !== undefined ? { contribution } : {}),
  };
  applyDecision(draft, top, pilotOf(draft.env, frame.spec).onChildClosed(frame.local, closed, ctxFor(draft, top, atMs)), atMs);
}

/** Ferme les descendants de la portée `frameIndex` (étape et portées plus profondes), sans consulter leurs pilotes. */
function closeDescendants(draft: Draft, frameIndex: number, completion: StepCompletion, atMs: Ms) {
  closeLeaf(draft, completion, atMs, false);
  const removed = draft.state.frames.slice(frameIndex + 1);
  if (removed.length === 0) return;
  for (const frame of removed) draft.results.push({ type: "SCOPE", key: frame.spec.key, result: { closedBy: completion, atMs } });
  removeRefsOwnedBy(draft, new Set(removed.map((frame) => frame.spec.key)));
  set(draft, { frames: draft.state.frames.slice(0, frameIndex + 1) });
  newGeneration(draft);
}

function closeFrame(draft: Draft, frameIndex: number, completion: StepCompletion, atMs: Ms, contribution?: unknown) {
  closeDescendants(draft, frameIndex, completion, atMs);
  const frame = draft.state.frames[frameIndex]!;
  if (frameIndex === 0) {
    // Le chronomètre de Séance est conservé (figé par `finish`) : il porte la durée réelle de l'Exécution.
    set(draft, { refs: draft.state.refs.filter((ref) => ref.owner !== frame.spec.key || ref.name === "session") });
  } else {
    removeRefsOwnedBy(draft, new Set([frame.spec.key]));
  }
  set(draft, { frames: draft.state.frames.slice(0, frameIndex) });
  newGeneration(draft);
  if (frameIndex === 0) {
    finish(draft, "COMPLETED", atMs);
    return;
  }
  const parentIndex = frameIndex - 1;
  const parent = draft.state.frames[parentIndex]!;
  const closed: ClosedChild = { kind: "SCOPE", key: frame.spec.key, completion, elapsedMs: 0, ...(contribution !== undefined ? { contribution } : {}) };
  applyDecision(draft, parentIndex, pilotOf(draft.env, parent.spec).onChildClosed(parent.local, closed, ctxFor(draft, parentIndex, atMs)), atMs);
}

function finish(draft: Draft, reason: FinishReason, atMs: Ms) {
  // Les références restantes (chronomètre de Séance) sont figées à l'instant de fin.
  set(draft, {
    status: "FINISHED",
    finish: { reason, atMs },
    pause: null,
    refs: draft.state.refs.map((ref) => (ref.anchorMs === null ? ref : { ...ref, anchorMs: null, accumulatedMs: runningMs(ref, atMs) })),
  });
  newGeneration(draft);
  draft.effects.push({ type: "FINISHED", reason, atMs });
}

function suspendAll(draft: Draft, atMs: Ms) {
  set(draft, { refs: draft.state.refs.map((ref) => (ref.anchorMs === null ? ref : { ...ref, anchorMs: null, accumulatedMs: runningMs(ref, atMs) })) });
  const leaf = draft.state.leaf;
  if (leaf !== null && leaf.spec.cadenceMs !== undefined && leaf.cadenceAnchorMs !== null) {
    // T04 : seuls les intervalles complets sont acquis ; la fraction en cours est abandonnée.
    const completed = Math.floor(Math.max(0, atMs - leaf.cadenceAnchorMs) / leaf.spec.cadenceMs);
    set(draft, { leaf: { ...leaf, cadenceAcquired: leaf.cadenceAcquired + completed, cadenceAnchorMs: null } });
  }
}

function resumeAll(draft: Draft, atMs: Ms) {
  set(draft, { refs: draft.state.refs.map((ref) => (ref.anchorMs !== null ? ref : { ...ref, anchorMs: atMs })) });
  const leaf = draft.state.leaf;
  if (leaf !== null && leaf.spec.cadenceMs !== undefined) {
    // Reprendre le bip : premier nouveau bip après un intervalle complet (§13).
    set(draft, { leaf: { ...leaf, cadenceAnchorMs: atMs } });
  }
}

function pause(draft: Draft, reason: PauseReason, atMs: Ms) {
  suspendAll(draft, atMs);
  set(draft, { status: "PAUSED", pause: { reason, atMs } });
  newGeneration(draft);
  draft.effects.push({ type: "PAUSED", reason, atMs });
}

/** Interaction utilisateur : relance la sécurité d'inactivité de l'étape (RM-069, « sans interaction »). */
function touchSafety(draft: Draft, atMs: Ms) {
  const leaf = draft.state.leaf;
  if (leaf === null) return;
  const owner = leafTarget(leaf);
  set(draft, {
    refs: draft.state.refs.map((ref) =>
      ref.owner === owner && ref.role === "SAFETY" ? { ...ref, accumulatedMs: 0, anchorMs: draft.state.status === "RUNNING" ? atMs : null } : ref,
    ),
  });
}

function earliestDue(draft: Draft, limitMs: Ms, inclusive: boolean): Ms | null {
  let best: Ms | null = null;
  for (const ref of draft.state.refs) {
    const due = dueAtMs(ref);
    if (due === null || (inclusive ? due > limitMs : due >= limitMs)) continue;
    if (best === null || due < best) best = due;
  }
  return best;
}

/** Franchit chronologiquement les échéances jusqu'à `limitMs` (voir l'en-tête). */
function reconcile(draft: Draft, limitMs: Ms, inclusive: boolean) {
  while (draft.state.status === "RUNNING") {
    bump(draft);
    const instant = earliestDue(draft, limitMs, inclusive);
    if (instant === null) return;
    const due = draft.state.refs.filter((ref) => dueAtMs(ref) === instant);
    // La plus interne d'abord ; à profondeur égale, la sécurité après la fin d'étape.
    due.sort((a, b) => b.depth - a.depth || (a.role === "SAFETY" ? 1 : 0) - (b.role === "SAFETY" ? 1 : 0));
    expire(draft, due[0]!, instant);
    if (
      draft.state.status === "RUNNING" &&
      draft.state.leaf === null &&
      draft.state.frames.length > 0 &&
      draft.state.refs.every((candidate) => dueAtMs(candidate) === null)
    ) {
      // Sans étape ni échéance à venir, plus rien ne peut faire progresser le parcours.
      throw new EngineFlowError("Execution flow stalled without an active step.");
    }
  }
}

function expire(draft: Draft, ref: TimeRef, atMs: Ms) {
  const leaf = draft.state.leaf;
  if (leaf !== null && ref.owner === leafTarget(leaf)) {
    if (ref.role === "SAFETY") {
      pause(draft, "SAFETY", atMs);
      return;
    }
    closeLeaf(draft, "COMPLETED", atMs, true);
    return;
  }
  const frameIndex = draft.state.frames.findIndex((frame) => frame.spec.key === ref.owner);
  if (frameIndex < 0) {
    // Référence orpheline (ne devrait pas arriver) : retirée pour garantir la progression.
    set(draft, { refs: draft.state.refs.filter((candidate) => candidate.id !== ref.id) });
    return;
  }
  // Fermeture des descendants, puis politique propriétaire (§10).
  closeDescendants(draft, frameIndex, "CLOSED_BY_PARENT", atMs);
  // La référence échue est retirée ; le pilote en rouvre une s'il le souhaite.
  set(draft, { refs: draft.state.refs.filter((candidate) => candidate.id !== ref.id) });
  newGeneration(draft);
  const frame = draft.state.frames[frameIndex]!;
  applyDecision(draft, frameIndex, pilotOf(draft.env, frame.spec).onReference(frame.local, ref.name, ctxFor(draft, frameIndex, atMs)), atMs);
}

function allowed(draft: Draft, command: EngineCommand["type"]): boolean {
  const leaf = draft.state.leaf?.spec ?? null;
  return draft.state.frames.every((frame) => pilotOf(draft.env, frame.spec).allows?.(frame.local, command, leaf) ?? true);
}

function reject(state: EngineState, reason: RejectionReason): TransitionResult {
  return { state, results: [], effects: [], outcome: reason === "DUPLICATE" || reason === "STALE_TARGET" ? "IGNORED" : "REJECTED", reason };
}

function applyCommand(draft: Draft, event: EngineEvent, atMs: Ms): RejectionReason | null {
  const { state } = draft;
  switch (event.type) {
    case "TICK":
      return null;
    case "START": {
      if (state.status !== "READY") return "NOT_READY";
      set(draft, { status: "RUNNING", startedAtMs: atMs });
      const root: ScopeSpec = { pilot: SEQUENCE_PILOT, key: ROOT_SCOPE_KEY, config: { source: "PLAN" } };
      set(draft, { frames: [{ spec: root, local: null, depth: 0 }] });
      // Temps de Séance (§8.1) : chronomètre actif, suspendu par la seule Pause.
      addRef(draft, { id: `${ROOT_SCOPE_KEY}::session`, owner: ROOT_SCOPE_KEY, depth: 0, name: "session", role: "STOPWATCH", budgetMs: null, anchorMs: atMs, accumulatedMs: 0 });
      applyDecision(draft, 0, pilotOf(draft.env, root).open(root, ctxFor(draft, 0, atMs)), atMs);
      return null;
    }
    case "PAUSE":
      if (state.status !== "RUNNING") return "NOT_RUNNING";
      pause(draft, event.reason ?? "USER", atMs);
      return null;
    case "RESUME":
      if (state.status !== "PAUSED") return "NOT_PAUSED";
      resumeAll(draft, atMs);
      set(draft, { status: "RUNNING", pause: null });
      touchSafety(draft, atMs);
      newGeneration(draft);
      return null;
    case "STOP":
      if (state.status !== "PAUSED") return "NOT_PAUSED";
      if (state.frames.length > 0) closeDescendants(draft, 0, "INTERRUPTED", atMs);
      finish(draft, "STOPPED", atMs);
      return null;
    case "NEXT":
      return next(draft, event, atMs);
    case "RESET":
      return reset(draft, atMs);
    case "SUBMIT": {
      if (state.status !== "RUNNING") return "NOT_RUNNING";
      const leaf = state.leaf;
      if (leaf === null || leaf.spec.end !== "INTERACTION") return "NOT_ALLOWED";
      closeLeaf(draft, "COMPLETED", atMs, true, event.payload);
      return null;
    }
    default: {
      const unreachable: never = event;
      return unreachable;
    }
  }
}

function next(draft: Draft, event: Extract<EngineEvent, { type: "NEXT" }>, atMs: Ms): RejectionReason | null {
  const { state } = draft;
  if (state.status !== "RUNNING") return "NOT_RUNNING";
  const leaf = state.leaf;
  if (leaf === null) return "NOT_ALLOWED";
  if (!allowed(draft, "NEXT")) return "NOT_ALLOWED";
  switch (leaf.spec.end) {
    case "MANUAL":
    case "WAIT":
      // Fin normale d'une Série en Répétitions ou À l'échec (D-111) ; Continuer après un Point d'arrêt.
      closeLeaf(draft, "COMPLETED", atMs, true);
      return null;
    case "TIMED": {
      const elapsed = leafElapsedMs(state, atMs);
      if (elapsed >= (leaf.spec.plannedMs ?? 0)) {
        closeLeaf(draft, "COMPLETED", atMs, true);
        return null;
      }
      // Compte à rebours initial et Fin de séance : phases structurelles, sans Exercice ni confirmation (À CLARIFIER 1, spec PRE-10).
      if (event.confirmed !== true && !structuralPhase(leaf.spec)) return "CONFIRMATION_REQUIRED";
      // Avant le terme : Exercice `Partielle` ; phase de récupération : durée partielle conservée (ch08).
      closeLeaf(draft, leaf.spec.kind === "ACTIVITY" ? "PARTIAL" : "SKIPPED", atMs, true);
      return null;
    }
    case "PARENT":
    case "INTERACTION":
      return "NOT_ALLOWED";
    default: {
      const unreachable: never = leaf.spec.end;
      return unreachable;
    }
  }
}

function reset(draft: Draft, atMs: Ms): RejectionReason | null {
  const { state } = draft;
  if (state.status !== "RUNNING" && state.status !== "PAUSED") return "NOT_RUNNING";
  const leaf = state.leaf;
  if (leaf === null) return "NOT_ALLOWED";
  if (!resettable(leaf.spec) || !allowed(draft, "RESET")) return "NOT_ALLOWED";
  const top = state.frames.length - 1;
  const frame = state.frames[top]!;
  const pilot = pilotOf(draft.env, frame.spec);
  const decision: ResetDecision = pilot.onReset?.(frame.local, leaf.spec, ctxFor(draft, top, atMs)) ?? { type: "RESTART" };
  if (decision.type === "REFUSE") return "NOT_ALLOWED";
  const running = state.status === "RUNNING";
  const elapsed = leafElapsedMs(state, atMs);
  // Le temps de la tentative abandonnée reste du temps actif cumulé (T05).
  removeRefsOwnedBy(draft, new Set([leafTarget(leaf)]));
  set(draft, { leaf: null });
  if (decision.type === "RESTART") {
    openLeaf(draft, leaf.spec, atMs, leaf.attempt + 1, leaf.priorAttemptsMs + elapsed);
  } else {
    // Bilatéral (D-029) : le bloc du côté courant recommence depuis sa première Série ; les Séries rejouées
    // gardent leurs tentatives et leur temps actif antérieurs.
    const rewound: Record<string, StepHistory> = { ...draft.state.rewound };
    const own = rewound[leaf.spec.key];
    rewound[leaf.spec.key] = { attempts: leaf.attempt + (own?.attempts ?? 0), activeMs: leaf.priorAttemptsMs + elapsed + (own?.activeMs ?? 0) };
    for (const key of decision.replayedKeys) {
      const done = draft.state.history.steps[key];
      if (done !== undefined) rewound[key] = done;
    }
    set(draft, { rewound });
    const frames = [...draft.state.frames];
    frames[top] = { ...frame, local: decision.local };
    set(draft, { frames });
    openChild(draft, decision.child, atMs);
  }
  if (!running) {
    // Réinitialisée pendant une suspension (confirmation) : la nouvelle tentative reste suspendue.
    suspendAll(draft, atMs);
  }
  return null;
}

/** Phases structurelles de la Séance (ch12 §12.9) : ni Exercice, ni récupération. */
export function structuralPhase(spec: LeafSpec): boolean {
  return spec.kind === "INITIAL_COUNTDOWN" || spec.kind === "SESSION_END";
}

/** Réinitialiser : Série/côté, pauses et récupérations ; pas le compte à rebours, la Fin, un Point d'arrêt ni une Clôture. */
export function resettable(spec: LeafSpec): boolean {
  return spec.kind === "ACTIVITY" || spec.kind === "SERIES_PAUSE" || spec.kind === "SIDE_RECOVERY" || spec.kind === "POST_ACTIVITY_RECOVERY" || spec.kind === "BLOCK_REST";
}

/**
 * Transition du noyau (voir l'en-tête). `readingMs` est la lecture d'horloge attachée à la réception de
 * l'événement ; elle n'est jamais antérieure à la précédente (le runtime le garantit).
 */
export function transition(env: EngineEnv, state: EngineState, event: EngineEvent, readingMs: Ms): TransitionResult {
  if (event.commandId !== undefined && state.recentCommandIds.includes(event.commandId)) {
    return reject(state, "DUPLICATE");
  }
  const atMs = Math.max(readingMs, state.evaluatedAtMs ?? readingMs);
  const draft: Draft = { state, results: [], effects: [], env, guard: 0 };
  // 1. Échéances strictement antérieures à la lecture.
  if (draft.state.status === "RUNNING") reconcile(draft, atMs, false);
  // 2. Commande, si elle vise encore l'étape courante (une confirmation tardive ne s'applique pas à la suivante).
  const stale = event.type !== "TICK" && event.target !== undefined && (draft.state.leaf === null || leafTarget(draft.state.leaf) !== event.target);
  const rejection: RejectionReason | null = stale ? "STALE_TARGET" : applyCommand(draft, event, atMs);
  if (rejection === null && event.type !== "TICK" && event.type !== "PAUSE" && event.type !== "STOP") touchSafety(draft, atMs);
  // 3. Échéances atteintes à l'instant de la lecture (Q4 : la commande à l'échéance passe avant).
  if (draft.state.status === "RUNNING") reconcile(draft, atMs, true);
  return finalize(draft, atMs, event, rejection);
}

function finalize(draft: Draft, atMs: Ms, event: EngineEvent, rejection: RejectionReason | null): TransitionResult {
  const recent = event.commandId === undefined || rejection !== null ? draft.state.recentCommandIds : [...draft.state.recentCommandIds, event.commandId].slice(-RECENT_COMMANDS);
  const state: EngineState = { ...draft.state, evaluatedAtMs: atMs, recentCommandIds: recent, seq: draft.state.seq + 1 };
  if (rejection !== null) {
    return { state, results: draft.results, effects: draft.effects, outcome: rejection === "STALE_TARGET" || rejection === "DUPLICATE" ? "IGNORED" : "REJECTED", reason: rejection };
  }
  return { state, results: draft.results, effects: draft.effects, outcome: "APPLIED" };
}

// ————————————————————————————————————————————————————————————————— reprise sans continuité (Q6)

/**
 * Q6 (Hermann, 02/11/2026) : changement d'heure ou redémarrage sans continuité temporelle démontrée — la
 * Séance est remise à l'étape en cours, **en pause**, sans rien déduire du temps écoulé. Les références
 * englobantes sont figées à leur valeur de la dernière évaluation ; l'étape courante recommence sa
 * tentative (temps antérieur conservé comme cumul).
 */
export function restoreWithoutContinuity(state: EngineState): EngineState {
  if (state.status === "FINISHED" || state.status === "READY") return state;
  const frozenAt = state.evaluatedAtMs ?? 0;
  const refs = state.refs.map((ref) => (ref.anchorMs === null ? ref : { ...ref, anchorMs: null, accumulatedMs: runningMs(ref, frozenAt) }));
  const leaf = state.leaf;
  if (leaf === null) {
    return { ...state, refs, status: "PAUSED", pause: { reason: "RESTORE", atMs: frozenAt }, generation: state.generation + 1 };
  }
  const owner = leafTarget(leaf);
  const stepRef = refs.find((ref) => ref.owner === owner && ref.role === "STEP");
  const elapsed = stepRef === undefined ? 0 : stepRef.accumulatedMs;
  const restarted: LeafState = { ...leaf, attempt: leaf.attempt + 1, priorAttemptsMs: leaf.priorAttemptsMs + elapsed, cadenceAcquired: 0, cadenceAnchorMs: null };
  const newOwner = leafTarget(restarted);
  const leafRefs = refs
    .filter((ref) => ref.owner === owner)
    .map((ref) => ({ ...ref, id: ref.id.replace(owner, newOwner), owner: newOwner, accumulatedMs: 0, anchorMs: null }));
  return {
    ...state,
    leaf: restarted,
    refs: [...refs.filter((ref) => ref.owner !== owner), ...leafRefs],
    status: "PAUSED",
    pause: { reason: "RESTORE", atMs: frozenAt },
    generation: state.generation + 1,
  };
}

// ————————————————————————————————————————————————————————————————— pilote de séquence (Séance)

type SequenceLocal = { readonly index: number };

function sequenceItems(spec: ScopeSpec, env: EngineEnv): readonly ChildSpec[] {
  const config = spec.config as { readonly source?: "PLAN"; readonly items?: readonly ChildSpec[] };
  return config.source === "PLAN" ? env.plan.items : (config.items ?? []);
}

/**
 * Enchaînement ordonné (Séance, Cycle — D-17) : ouvre ses éléments un à un ; se clôt après le dernier.
 * Réinitialiser une Série bilatérale côté par côté rejoue depuis la première Série du côté courant.
 */
export const sequencePilot: Pilot = {
  open(spec, ctx) {
    const items = sequenceItems(spec, ctx.env);
    const local: SequenceLocal = { index: 0 };
    return items.length === 0 ? { local, next: { type: "CLOSE" } } : { local, next: { type: "CHILD", child: items[0]! } };
  },
  onChildClosed(local, _closed, ctx) {
    const items = sequenceItems(ctx.spec, ctx.env);
    const index = (local as SequenceLocal).index + 1;
    return index >= items.length ? { local: { index }, next: { type: "CLOSE" } } : { local: { index }, next: { type: "CHILD", child: items[index]! } };
  },
  onReference(local) {
    return { local, next: { type: "IDLE" } };
  },
  onReset(local, leaf, ctx) {
    if (leaf.resetToKey === undefined || leaf.resetToKey === leaf.key) return { type: "RESTART" };
    const items = sequenceItems(ctx.spec, ctx.env);
    const current = (local as SequenceLocal).index;
    const target = items.findIndex((item) => item.type === "LEAF" && item.leaf.key === leaf.resetToKey);
    if (target < 0 || target > current) return { type: "RESTART" };
    const replayedKeys = items.slice(target, current).flatMap((item) => (item.type === "LEAF" ? [item.leaf.key] : []));
    return { type: "REWIND", local: { index: target }, child: items[target]!, replayedKeys };
  },
};

export function libreEnv(plan: ExecutablePlan, extraPilots: Readonly<Record<string, Pilot>> = {}): EngineEnv {
  return { plan, pilots: { [SEQUENCE_PILOT]: sequencePilot, ...extraPilots } };
}
