/**
 * PRE-11 (T4) — politique **Death by** (conception consolidée §12.4, §12.5, « Prescriptions et fins — complément du 5 novembre » ;
 * FMT-33 à FMT-38 ; D2, D3, Q2, Q4 ; cas T16, T17, T18).
 *
 * Portée d'un élément Death by (Exercice autonome — À la suite, ou dans un Circuit standard groupé, où chaque passage repart du
 * départ (FMT-34, T16) — ou Circuit porteur) : une suite ouverte de **rangs** (régime ouvert, aucune réserve de séries). Chaque rang
 * joue ses **fenêtres** (référence `window`, rôle WINDOW) : une seule (Exercice autonome ; Circuit « dans chaque intervalle », membres
 * l'un après l'autre dans l'intervalle commun) ou une par membre, d'intervalle propre (Circuit « en alternance », T17). Dans une
 * fenêtre, comme l'EMOM :
 * - les étapes de travail s'enchaînent ; une Série en Répétitions se termine par l'appui (« Suivant », FMT-35) ; une Série en Durée
 *   démarre seule à l'ouverture et se termine à son terme ;
 * - le travail terminé acquiert le rang du membre et révèle le **repos** de la fenêtre (`WINDOW_REST`), sans avancer la fenêtre ;
 * - un appui répété ne peut acquérir deux rangs (FMT-36) ; un travail confirmé pile à l'échéance est acquis (Q4, ordre du noyau).
 *
 * Objectif du rang k : départ + incrément × (k − 1), dans l'unité du membre (FMT-33), sans plafond de saisie (T18).
 *
 * Fins :
 * - **fenêtre manquée** (D2) : le défi s'arrête à l'échéance ; si un travail était entamé, la Clôture (D3) demande ses répétitions
 *   faites (ou sa durée tenue) ; le premier échec termine l'élément, Circuit porteur compris (FMT-34) ;
 * - **limite de l'intervalle** (complément du 5 novembre) : avant d'ouvrir un rang, un rang dont le travail connu (Durées, deux côtés
 *   et pause entre eux ; somme des membres d'une fenêtre commune) atteint ou dépasse sa fenêtre n'est pas lancé — arrêt après le rang
 *   précédent, motif « limite de l'intervalle atteinte », sans saisie ni échec fictif ;
 * - **Arrêt** (arbitrage du 18/11/2026) : abandon, répétitions saisies ou durée tenue de la fenêtre en cours.
 * Dans tous les cas, l'élément est **incomplet** (FMT-38).
 *
 * Arbitrages de Hermann du 18/11/2026 (spec PRE-11 §5 point 30) : barre du For time — Arrêt sans Pause (`STOP_RUNNING`), ni Pause ni
 * Réinitialiser (Q2) ; fenêtre manquée : écran figé, feuille « Fin du Death by » à coche seule, sans choix « Limite atteinte /
 * Abandonner » [CE-FMT-06, confirmation à deux choix — remplacé]. Interprétation (À CLARIFIER) : un membre en Durée est acquis à la
 * fin de sa durée, comme une Série en Durée de l'EMOM.
 */

import type { Ms, Pilot, PilotContext, PilotDecision, ResultChange } from "../kernel";
import type { ChildSpec, DeathByScopeConfig, LeafSpec, ScopeSpec } from "../plan";

export const DEATH_BY_PILOT = "DEATH_BY";

export function deathByConfig(spec: ScopeSpec): DeathByScopeConfig {
  return spec.config as DeathByScopeConfig;
}

/** Motif de fin (FMT-38 ; complément du 5 novembre ; arbitrage du 18/11/2026). */
export type DeathByEndReason = "WINDOW_MISSED" | "INTERVAL_LIMIT_REACHED" | "ABANDONED";

export type DeathByLocal = {
  readonly phase: "WORK" | "CLOSURE";
  /** Rang en cours (1…). */
  readonly rank: number;
  /** Fenêtre du rang en cours (indice dans `config.slots`). */
  readonly slot: number;
  /** Étape ouverte, dans les étapes de la fenêtre en cours (`windowLeaves`). */
  readonly index: number;
  readonly workDone: boolean;
  /** Temps de la fenêtre à la fin du travail (repos révélé) ; `null` avant. */
  readonly workEndedMs: Ms | null;
  /** Temps de la fenêtre à l'ouverture de l'étape en cours. */
  readonly stepStartedMs: Ms;
  /** Rangs acquis par membre (identifiant d'Exercice → dernier rang acquis), FMT-36. */
  readonly acquired: Readonly<Record<string, number>>;
  /** Rangs entièrement acquis (toutes les fenêtres du rang). */
  readonly acquiredRanks: number;
  /** Travail entamé à l'échéance de la fenêtre manquée (partiel à déclarer) ; `null` sinon. */
  readonly interruptedKey: string | null;
  /** Exercice de la fenêtre manquée ; `null` sinon. */
  readonly failedExerciseId: string | null;
  /** Instant (horloge du noyau) de la fin du travail ; absent pendant le travail. */
  readonly workEndedAtMs?: Ms;
};

/** Saisie d'une Clôture ou d'un Arrêt : répétitions faites, ou durée tenue d'une Série en Durée. */
export type DeathByDeclaration = { readonly partialRepetitions?: number | null; readonly partialDurationMs?: number | null };

/** Résultat de l'élément (ResultChange `SCOPE`, clé de la portée). */
export type DeathByResult = {
  readonly format: "DEATH_BY";
  readonly elementId: string;
  readonly elementKind: "EXERCISE" | "CIRCUIT";
  /** Rangs entièrement acquis. */
  readonly acquiredRanks: number;
  /** Rangs acquis par membre (T17 : rangs par mouvement). */
  readonly acquired: Readonly<Record<string, number>>;
  /** Dernier rang ouvert (rang courant) ; 0 si aucun rang n'a été lancé. */
  readonly rankReached: number;
  readonly reason: DeathByEndReason;
  readonly interruptedKey: string | null;
  readonly failedExerciseId: string | null;
  readonly partialRepetitions: number | null;
  readonly partialDurationMs: number | null;
  /** FMT-38 : toujours incomplet, quel que soit le motif. */
  readonly completion: "INCOMPLETE";
  readonly closedAtMs: Ms;
};

const MODEL = "/model/";

/** Objectif du rang `rank` (1 = premier) : départ + incrément × (rang − 1) (FMT-33), sans plafond (T18). */
export function deathByRankValue(start: number, increment: number, rank: number): number {
  return start + increment * (rank - 1);
}

/** Étape de travail en Durée chiffrée (démarre seule, finit à son terme). */
export function isDeathByTimedWork(spec: LeafSpec): boolean {
  return spec.kind === "ACTIVITY" && spec.end === "TIMED";
}

/** Étapes de la fenêtre `slot` du rang `rank` : étapes des membres (objectifs du rang), puis le repos de la fenêtre. */
export function windowLeaves(config: DeathByScopeConfig, rank: number, slot: number): readonly LeafSpec[] {
  const spec = config.slots[slot];
  if (spec === undefined) return [];
  const played: LeafSpec[] = spec.members.flatMap((member) =>
    member.leaves.map((leaf): LeafSpec => {
      const { resetToKey: _reset, inWindow: _model, ...base } = leaf;
      const prescribed = leaf.target;
      const computed = prescribed !== undefined && prescribed.kind === "NUMBER" ? { kind: "NUMBER" as const, value: deathByRankValue(prescribed.value, member.increment, rank) } : prescribed;
      const timed = isDeathByTimedWork(leaf) && computed !== undefined && computed.kind === "NUMBER";
      return {
        ...base,
        key: leaf.key.replace(MODEL, `/k${rank}/`),
        loopOf: leaf.key,
        inWindow: true,
        ...(leaf.occurrenceKey !== undefined ? { occurrenceKey: leaf.occurrenceKey.replace(MODEL, `/k${rank}/`) } : {}),
        ...(computed !== undefined ? { target: computed } : {}),
        ...(timed ? { plannedMs: computed.value * 1000 } : {}),
        context: { circuit: { id: config.elementId, tour: rank, count: 0 }, cycle: leaf.context?.cycle ?? null },
      };
    }),
  );
  const first = played[0];
  if (first === undefined) return [];
  const lastActivity = [...played].reverse().find((leaf) => leaf.kind === "ACTIVITY") ?? first;
  const rest: LeafSpec = {
    kind: "WINDOW_REST",
    key: `${config.key}/k${rank}/w${slot}/rest`,
    end: "PARENT",
    plannedMs: spec.windowMs,
    contribution: "exact",
    inWindow: true,
    ...(lastActivity.loopOf !== undefined ? { loopOf: lastActivity.loopOf } : {}),
    ...(lastActivity.exerciseId !== undefined ? { exerciseId: lastActivity.exerciseId } : {}),
    ...(lastActivity.occurrenceKey !== undefined ? { occurrenceKey: lastActivity.occurrenceKey } : {}),
    ...(lastActivity.context !== undefined ? { context: lastActivity.context } : {}),
  };
  return [{ ...first, windowStart: true }, ...played.slice(1), rest];
}

/**
 * Travail connu de la fenêtre `slot` au rang `rank` (complément du 5 novembre) : pour chaque membre en Durée, ses Séries en Durée
 * (deux côtés) et la pause entre les côtés ; un membre en Répétitions ne compte pour rien (aucune durée déduite).
 */
export function knownWorkMs(config: DeathByScopeConfig, rank: number, slot: number): Ms {
  const spec = config.slots[slot];
  if (spec === undefined) return 0;
  const leaves = windowLeaves(config, rank, slot);
  let total = 0;
  for (const member of spec.members) {
    const own = leaves.filter((leaf) => leaf.exerciseId === member.exerciseId && leaf.kind !== "WINDOW_REST");
    if (!own.some(isDeathByTimedWork)) continue;
    for (const leaf of own) total += leaf.plannedMs ?? 0;
  }
  return total;
}

/** Le rang `rank` peut-il être lancé ? Chaque fenêtre : travail connu nul ou strictement inférieur à l'intervalle (même seuil que l'EMOM). */
export function rankLaunchable(config: DeathByScopeConfig, rank: number): boolean {
  return config.slots.every((slot, at) => {
    const work = knownWorkMs(config, rank, at);
    return work === 0 || work < slot.windowMs;
  });
}

/** Étape d'une clé jouée (`…/k<rang>/…`). */
export function deathByLeafOf(config: DeathByScopeConfig, key: string): LeafSpec | undefined {
  const rank = /\/k(\d+)\//.exec(key);
  if (rank === null) return undefined;
  for (let slot = 0; slot < config.slots.length; slot += 1) {
    const found = windowLeaves(config, Number(rank[1]), slot).find((leaf) => leaf.key === key);
    if (found !== undefined) return found;
  }
  return undefined;
}

export function deathByClosureKey(scopeKey: string): string {
  return `${scopeKey}/closure`;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" ? value : null;
}

function result(config: DeathByScopeConfig, local: DeathByLocal, ctx: PilotContext, reason: DeathByEndReason, declared: DeathByDeclaration | null): ResultChange {
  const interrupted = local.interruptedKey === null ? undefined : deathByLeafOf(config, local.interruptedKey);
  const timed = interrupted !== undefined && isDeathByTimedWork(interrupted);
  const value: DeathByResult = {
    format: "DEATH_BY",
    elementId: config.elementId,
    elementKind: config.elementKind,
    acquiredRanks: local.acquiredRanks,
    acquired: local.acquired,
    rankReached: reason === "INTERVAL_LIMIT_REACHED" ? local.acquiredRanks : local.rank,
    reason,
    interruptedKey: local.interruptedKey,
    failedExerciseId: local.failedExerciseId,
    partialRepetitions: interrupted === undefined || timed ? null : numberOrNull(declared?.partialRepetitions),
    partialDurationMs: interrupted === undefined || !timed ? null : numberOrNull(declared?.partialDurationMs),
    completion: "INCOMPLETE",
    closedAtMs: ctx.nowMs,
  };
  return { type: "SCOPE", key: ctx.scopeKey, result: value };
}

function finish(config: DeathByScopeConfig, local: DeathByLocal, ctx: PilotContext, reason: DeathByEndReason, declared: DeathByDeclaration | null): PilotDecision {
  const change = result(config, local, ctx, reason, declared);
  return { local, results: [change], next: { type: "CLOSE", contribution: change.type === "SCOPE" ? change.result : undefined } };
}

/** Ouverture de la fenêtre `slot` du rang `rank` : référence WINDOW, première étape (qui démarre à l'heure). */
function openWindow(config: DeathByScopeConfig, local: DeathByLocal, rank: number, slot: number): PilotDecision {
  const next: DeathByLocal = { ...local, phase: "WORK", rank, slot, index: 0, workDone: false, workEndedMs: null, stepStartedMs: 0 };
  const first = windowLeaves(config, rank, slot)[0]!;
  return { local: next, openRefs: [{ name: "window", role: "WINDOW", budgetMs: config.slots[slot]!.windowMs }], next: { type: "CHILD", child: { type: "LEAF", leaf: first } } };
}

function closureChild(config: DeathByScopeConfig, ctx: PilotContext, local: DeathByLocal): ChildSpec {
  const about = local.interruptedKey === null ? undefined : deathByLeafOf(config, local.interruptedKey);
  const leaf: LeafSpec = {
    kind: "CLOSURE",
    key: deathByClosureKey(ctx.scopeKey),
    end: "INTERACTION",
    plannedMs: null,
    contribution: "omitted",
    ...(about?.exerciseId !== undefined ? { exerciseId: about.exerciseId } : {}),
    ...(about?.context !== undefined ? { context: about.context } : config.context !== null ? { context: config.context } : {}),
  };
  return { type: "LEAF", leaf };
}

const INITIAL: DeathByLocal = {
  phase: "WORK",
  rank: 1,
  slot: 0,
  index: 0,
  workDone: false,
  workEndedMs: null,
  stepStartedMs: 0,
  acquired: {},
  acquiredRanks: 0,
  interruptedKey: null,
  failedExerciseId: null,
};

export const deathByPilot: Pilot = {
  open(spec, ctx) {
    const config = deathByConfig(spec);
    if (config.slots.length === 0 || windowLeaves(config, 1, 0).length === 0) return { local: INITIAL, next: { type: "CLOSE" } };
    // Premier rang incompatible avec son intervalle : aucun rang lancé (avertissement non bloquant à l'enregistrement).
    if (!rankLaunchable(config, 1)) return finish(config, { ...INITIAL, rank: 0 }, ctx, "INTERVAL_LIMIT_REACHED", null);
    return openWindow(config, INITIAL, 1, 0);
  },

  onChildClosed(raw, closed, ctx) {
    const config = deathByConfig(ctx.spec);
    const local = raw as DeathByLocal;
    if (local.phase === "CLOSURE") {
      // Clôture de la fenêtre manquée : répétitions faites (ou durée tenue), puis fin de l'élément (D2, D3).
      return finish(config, local, ctx, "WINDOW_MISSED", (closed.contribution ?? {}) as DeathByDeclaration);
    }
    const leaves = windowLeaves(config, local.rank, local.slot);
    const index = local.index + 1;
    const restIndex = leaves.length - 1;
    if (index >= restIndex) {
      // Travail de la fenêtre terminé : rang acquis pour ses membres (FMT-35), repos révélé jusqu'à l'échéance (FMT-24).
      const members = config.slots[local.slot]!.members;
      const acquired = { ...local.acquired };
      for (const member of members) acquired[member.exerciseId] = local.rank;
      const lastSlot = local.slot === config.slots.length - 1;
      const next: DeathByLocal = {
        ...local,
        index: restIndex,
        workDone: true,
        workEndedMs: ctx.refMs("window") ?? 0,
        acquired,
        acquiredRanks: lastSlot ? local.rank : local.acquiredRanks,
      };
      return { local: next, next: { type: "CHILD", child: { type: "LEAF", leaf: leaves[restIndex]! } } };
    }
    return { local: { ...local, index, stepStartedMs: ctx.refMs("window") ?? 0 }, next: { type: "CHILD", child: { type: "LEAF", leaf: leaves[index]! } } };
  },

  onReference(raw, refName, ctx) {
    const local = raw as DeathByLocal;
    if (refName !== "window" || local.phase !== "WORK") return { local, next: { type: "IDLE" } };
    const config = deathByConfig(ctx.spec);
    if (local.workDone) {
      // Fenêtre tenue : fenêtre suivante du rang (alternance), ou rang suivant s'il tient dans ses fenêtres.
      if (local.slot + 1 < config.slots.length) return openWindow(config, local, local.rank, local.slot + 1);
      if (!rankLaunchable(config, local.rank + 1)) return finish(config, local, ctx, "INTERVAL_LIMIT_REACHED", null);
      return openWindow(config, local, local.rank + 1, 0);
    }
    // Fenêtre manquée (D2) : le noyau a fermé l'étape en cours ; le défi s'arrête. Q4 : une étape ouverte à l'instant même de
    // l'échéance n'est pas un travail entamé (rien à saisir).
    const windowMs = config.slots[local.slot]!.windowMs;
    const current = windowLeaves(config, local.rank, local.slot)[local.index];
    const started = local.stepStartedMs < windowMs;
    const interruptedKey = current !== undefined && current.kind === "ACTIVITY" && started ? current.key : null;
    const failedExerciseId = current?.exerciseId ?? config.slots[local.slot]!.members[0]?.exerciseId ?? null;
    const next: DeathByLocal = { ...local, phase: "CLOSURE", interruptedKey, failedExerciseId, workEndedAtMs: ctx.nowMs };
    if (interruptedKey === null) return finish(config, next, ctx, "WINDOW_MISSED", null);
    return { local: next, next: { type: "CHILD", child: closureChild(config, ctx, next) } };
  },

  allows(raw, command, leaf) {
    const local = raw as DeathByLocal | null;
    // Q2 et arbitrage du 18/11/2026 (barre du For time) : ni Réinitialiser, ni Pause manuelle.
    if (command === "RESET") return false;
    // Une Série en Durée se termine à son terme (comme l'EMOM).
    if (command === "NEXT" && local?.phase === "WORK" && leaf !== null && isDeathByTimedWork(leaf)) return false;
    return true;
  },

  enables(raw, command) {
    const phase = (raw as DeathByLocal | null)?.phase;
    if (command === "STOP_RUNNING") return phase === "WORK" || phase === "CLOSURE";
    return false;
  },

  onStop(raw, ctx, payload) {
    const local = raw as DeathByLocal | null;
    if (local === null) return [];
    const config = deathByConfig(ctx.spec);
    const given = (payload ?? {}) as DeathByDeclaration;
    if (local.phase === "CLOSURE") {
      // Arrêt pendant la Clôture : la fenêtre manquée prend la saisie de l'Arrêt s'il y en a une ; le motif reste la fenêtre manquée.
      return [result(config, local, ctx, "WINDOW_MISSED", given)];
    }
    // Arrêt pendant le travail (abandon) : l'exercice en cours à l'instant de l'appui (répétitions saisies, ou durée tenue).
    const current = windowLeaves(config, local.rank, local.slot)[local.index];
    const working = current !== undefined && current.kind === "ACTIVITY" && !local.workDone;
    const timed = working && isDeathByTimedWork(current);
    const heldMs = timed ? Math.max(0, (ctx.refMs("window") ?? 0) - local.stepStartedMs) : null;
    const declared: DeathByDeclaration = timed ? { partialDurationMs: typeof given.partialDurationMs === "number" ? given.partialDurationMs : heldMs } : given;
    const stopped: DeathByLocal = { ...local, interruptedKey: working ? current.key : null, failedExerciseId: working ? (current.exerciseId ?? null) : null };
    return [result(config, stopped, ctx, "ABANDONED", declared)];
  },
};
