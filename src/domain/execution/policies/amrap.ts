/**
 * PRE-11 (T3) — politique **AMRAP** (conception consolidée §12.1, §12.5, « Prescriptions et fins — complément du 5 novembre » ;
 * FMT-26, FMT-27 ; D-19, D-20 / RM-PRE5-02 ; D1, D3, Q3, Q4 ; cas T12, T13, T14, T19, T25).
 *
 * Portée d'un **bloc** AMRAP (Exercice autonome, ou bloc k d'un Circuit porteur) sous sa borne (`block`, DEADLINE) :
 * - le **buy-in** (bloc 1 seulement) est joué une fois, dans l'ordre, dans le temps du bloc (T13) ;
 * - puis la **boucle** : à chaque tour, les étapes-modèles des membres de Rôle Tour (Séries, côtés, pauses, Récupération : T14),
 *   l'objectif recalculé (incrément signé, borné à 1 dans son unité ; ni buy-in ni À l'échec) ;
 * - un tour est **acquis** quand son dernier travail est clos (D-19) ; sa Récupération n'en fait pas partie ;
 * - à l'**échéance** (D1), le noyau a fermé l'étape en cours, même une Série ou une Récupération : la Clôture du bloc (D3) demande
 *   les répétitions faites de l'exercice en cours (ou sa durée tenue), puis celles des buy-in À l'échec (FMT-26 : « résultat saisi
 *   à la clôture du bloc ») ; un travail confirmé pile à l'échéance est acquis (Q4, ordre du noyau). Sans rien à saisir, le bloc se
 *   ferme aussitôt, sans écran de résultat.
 *
 * Arbitrages de Hermann du 18/11/2026 (spec PRE-11 §5 point 30) : barre du For time — Arrêt sans Pause (`STOP_RUNNING`), ni
 * Pause ni Réinitialiser ; « + Tour » au dernier exercice d'un tour, « Suivant » ailleurs (et pendant une Récupération : Q3) ;
 * partiel = exercice en cours seul (« 7 tours + Squat 12 »). Exercices en durée en temps cumulé, comme le For time (registre ch07,
 * 16/11/2026 : « Pour intégrer un exercice en durée sur un For Time, ou un AMRAP, l'exercice doit être en temps cumulé ») : départ
 * seul quand le moment est connu, retenue et reprise (`HOLD` / `RELEASE`), fin à son terme.
 */

import type { Ms, Pilot, PilotContext, PilotDecision, ResultChange, StepResult } from "../kernel";
import type { AmrapScopeConfig, ChildSpec, LeafSpec, ScopeSpec } from "../plan";

export const AMRAP_PILOT = "AMRAP";

export function amrapConfig(spec: ScopeSpec): AmrapScopeConfig {
  return spec.config as AmrapScopeConfig;
}

/** Saisie d'une Clôture ou d'un Arrêt : répétitions faites, ou durée tenue d'un exercice en durée. */
export type AmrapDeclaration = { readonly partialRepetitions?: number | null; readonly partialDurationMs?: number | null };

export type AmrapDeclared = { readonly partialRepetitions: number | null; readonly partialDurationMs: number | null };

export type AmrapLocal = {
  readonly phase: "WORK" | "CLOSURE";
  readonly segment: "BUY_IN" | "LOOP";
  /** Tour en cours (1…). */
  readonly round: number;
  /** Étape ouverte, dans les étapes du segment en cours (buy-in, ou tour `round`). */
  readonly index: number;
  /** Tours acquis (dernier travail du tour clos). */
  readonly completedRounds: number;
  /** Travail fermé par l'échéance ; `null` sinon. */
  readonly interruptedKey: string | null;
  /** Buy-in À l'échec joués : leurs répétitions se saisissent à la Clôture du bloc (FMT-26). */
  readonly buyInFailures: readonly string[];
  /** Étapes dont le résultat reste à saisir à la Clôture (la première est présentée). */
  readonly pending: readonly string[];
  readonly declared: Readonly<Record<string, AmrapDeclared>>;
  /**
   * D-531 / RM-272 (Hermann, 19/11/2026) — AMRAP à un seul mouvement en Max : Séries closes par « Suivant » (dans l'ordre) et répétitions
   * saisies pour chacune (`DECLARE`). Absents d'un état antérieur : aucune Série en Max.
   */
  readonly maxClosed?: readonly string[];
  readonly maxDeclared?: Readonly<Record<string, number>>;
  /** Saisies refermées sans valeur (croix) : redemandées à la Clôture du bloc. */
  readonly maxDismissed?: readonly string[];
  /** Instant (horloge du noyau) de l'échéance ; absent pendant le travail. */
  readonly workEndedAtMs?: Ms;
  /** Temps du bloc à l'ouverture de l'étape en cours : une étape ouverte à l'instant même de l'échéance n'est pas un travail entamé. */
  readonly stepStartedMs?: Ms;
};

/** Résultat d'un bloc (ResultChange `SCOPE`, clé de la portée). */
export type AmrapResult = {
  readonly format: "AMRAP";
  readonly elementId: string;
  readonly elementKind: "EXERCISE" | "CIRCUIT";
  readonly block: number;
  readonly blocks: number;
  readonly blockMs: Ms;
  readonly completedRounds: number;
  readonly interruptedKey: string | null;
  readonly partialRepetitions: number | null;
  readonly partialDurationMs: number | null;
  readonly buyIn: readonly { readonly key: string; readonly partialRepetitions: number | null }[];
  /**
   * D-531 / RM-272 : AMRAP à un seul mouvement en Max — chaque Série close et ses répétitions (`null` : non saisies) ; le total est le
   * score (la Série en cours à l'échéance est le partiel, `interruptedKey`). Absent hors Max.
   */
  readonly maxSeries?: readonly { readonly key: string; readonly repetitions: number | null }[];
  readonly stopped: boolean;
  readonly closedAtMs: Ms;
};

/**
 * Objectif calculé du tour `round` (1 = premier) : départ + incrément × (tour − 1) ; une progression descendante est bornée à 1
 * dans son unité, sans terminer la boucle (complément du 5 novembre ; `amrapRoundTarget` de `formatModels`, même règle).
 */
export function amrapRoundValue(start: number, increment: number, round: number): number {
  const value = start + increment * (round - 1);
  return increment < 0 ? Math.max(1, value) : value;
}

const LOOP = "/loop/";

/** Étapes du tour `round` : étapes-modèles de la boucle, clés et objectifs du tour. */
export function roundLeaves(config: AmrapScopeConfig, round: number): readonly LeafSpec[] {
  return config.loop.map(({ leaf, increment }) => {
    const { resetToKey: _reset, ...played } = leaf;
    const prescribed = leaf.target;
    const computed =
      prescribed !== undefined && prescribed.kind === "NUMBER" && increment !== 0 ? { kind: "NUMBER" as const, value: amrapRoundValue(prescribed.value, increment, round) } : prescribed;
    const timed = leaf.kind === "ACTIVITY" && leaf.end === "TIMED" && computed !== undefined && computed.kind === "NUMBER" && increment !== 0;
    return {
      ...played,
      key: leaf.key.replace(LOOP, `/r${round}/`),
      loopOf: leaf.key,
      ...(leaf.occurrenceKey !== undefined ? { occurrenceKey: leaf.occurrenceKey.replace(LOOP, `/r${round}/`) } : {}),
      ...(computed !== undefined ? { target: computed } : {}),
      ...(timed ? { plannedMs: computed.value * 1000 } : {}),
      context: { circuit: { id: config.elementId, tour: round, count: 0 }, cycle: leaf.context?.cycle ?? null },
    };
  });
}

function buyInLeaves(config: AmrapScopeConfig): readonly LeafSpec[] {
  return config.buyIn.map((leaf) => {
    const { resetToKey: _reset, ...played } = leaf;
    return played;
  });
}

/** Étapes du segment en cours (buy-in, ou tour `local.round`). */
export function segmentLeaves(config: AmrapScopeConfig, local: Pick<AmrapLocal, "segment" | "round">): readonly LeafSpec[] {
  return local.segment === "BUY_IN" ? buyInLeaves(config) : roundLeaves(config, local.round);
}

/** Étape d'une clé jouée (buy-in, ou étape d'un tour `…/r<k>/…`). */
export function amrapLeafOf(config: AmrapScopeConfig, key: string): LeafSpec | undefined {
  const bought = buyInLeaves(config).find((leaf) => leaf.key === key);
  if (bought !== undefined) return bought;
  const round = /\/r(\d+)\//.exec(key);
  return round === null ? undefined : roundLeaves(config, Number(round[1])).find((leaf) => leaf.key === key);
}

/** Exercice en durée (Série en Durée chiffrée) : démarre seul, ne se valide pas avant son terme. */
export function isAmrapDurationLeaf(spec: LeafSpec): boolean {
  return spec.kind === "ACTIVITY" && spec.end === "TIMED";
}

/**
 * D-531 / RM-271 (Hermann, 19/11/2026) : AMRAP à un seul mouvement en Max — la boucle ne compte qu'un mouvement, fait à l'échec. Ni
 * « + Tour », ni annonce de tour, ni compteur de tours ; chaque Série close par « Suivant » attend la saisie de ses répétitions.
 */
export function isAmrapMax(config: AmrapScopeConfig): boolean {
  const work = config.loop.map(({ leaf }) => leaf).filter((leaf) => leaf.kind === "ACTIVITY");
  if (work.length === 0) return false;
  return new Set(work.map((leaf) => leaf.exerciseId)).size === 1 && work.every((leaf) => leaf.target?.kind === "FAILURE");
}

/** Saisie (`DECLARE`) des répétitions d'une Série en Max close : valeur, ou `skip` (croix, redemandée à la Clôture). */
export type AmrapMaxDeclaration = { readonly amrapMax: { readonly key: string; readonly repetitions?: number | null; readonly skip?: boolean } };

/** Score cumulé de l'AMRAP en Max : somme des répétitions saisies. */
export function amrapMaxScore(local: Pick<AmrapLocal, "maxDeclared">): number {
  return Object.values(local.maxDeclared ?? {}).reduce((sum, value) => sum + value, 0);
}

/** Première Série en Max close dont les répétitions restent à saisir (ni saisie ni refermée) ; `null` sinon. */
export function amrapMaxToDeclare(local: Pick<AmrapLocal, "maxClosed" | "maxDeclared" | "maxDismissed">): string | null {
  const declared = local.maxDeclared ?? {};
  const dismissed = local.maxDismissed ?? [];
  return (local.maxClosed ?? []).find((key) => declared[key] === undefined && !dismissed.includes(key)) ?? null;
}

/** Exercice en durée à lancer après la Série en répétitions `index` du segment (première durée qui suit) ; `null` sinon. */
export function amrapPendingDuration(leaves: readonly LeafSpec[], index: number): LeafSpec | null {
  const current = leaves[index];
  if (current === undefined || current.kind !== "ACTIVITY" || isAmrapDurationLeaf(current)) return null;
  for (let at = index + 1; at < leaves.length; at += 1) {
    const leaf = leaves[at]!;
    if (isAmrapDurationLeaf(leaf)) return leaf;
  }
  return null;
}

function leafChild(leaf: LeafSpec, blockStart: boolean): ChildSpec {
  return { type: "LEAF", leaf: blockStart ? { ...leaf, windowStart: true } : leaf };
}

/** Série faite d'un seul appui (« + Tour » ou lancement d'une durée) : acquise, sans temps propre mesuré. */
function skippedResult(spec: LeafSpec, atMs: Ms): ResultChange {
  const result: StepResult = {
    key: spec.key,
    leafKind: spec.kind,
    exerciseId: spec.exerciseId ?? null,
    occurrenceKey: spec.occurrenceKey ?? null,
    series: spec.series ?? null,
    side: spec.side ?? null,
    attempts: 1,
    lastAttemptMs: 0,
    cumulativeActiveMs: 0,
    plannedMs: spec.plannedMs,
    completion: "COMPLETED",
    endedAtMs: atMs,
    context: spec.context ?? null,
  };
  return { type: "STEP", key: spec.key, result };
}

export function amrapClosureKey(scopeKey: string, rank: number): string {
  return `${scopeKey}/closure/${rank}`;
}

function closureChild(config: AmrapScopeConfig, ctx: PilotContext, local: AmrapLocal): ChildSpec {
  const declaredCount = Object.keys(local.declared).length;
  const about = local.pending[0] === undefined ? undefined : amrapLeafOf(config, local.pending[0]);
  const leaf: LeafSpec = {
    kind: "CLOSURE",
    key: amrapClosureKey(ctx.scopeKey, declaredCount + 1),
    end: "INTERACTION",
    plannedMs: null,
    contribution: "omitted",
    ...(about?.exerciseId !== undefined ? { exerciseId: about.exerciseId } : {}),
    ...(about?.context !== undefined ? { context: about.context } : config.context !== null ? { context: config.context } : {}),
  };
  return { type: "LEAF", leaf };
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" ? value : null;
}

function blockResult(config: AmrapScopeConfig, local: AmrapLocal, ctx: PilotContext, stopped: boolean): AmrapResult {
  const interrupted = local.interruptedKey === null ? undefined : local.declared[local.interruptedKey];
  return {
    format: "AMRAP",
    elementId: config.elementId,
    elementKind: config.elementKind,
    block: config.block,
    blocks: config.blocks,
    blockMs: config.blockMs,
    completedRounds: local.completedRounds,
    interruptedKey: local.interruptedKey,
    partialRepetitions: interrupted === undefined ? null : interrupted.partialRepetitions,
    partialDurationMs: interrupted === undefined ? null : interrupted.partialDurationMs,
    buyIn: local.buyInFailures
      .filter((key) => key !== local.interruptedKey)
      .map((key) => ({ key, partialRepetitions: local.declared[key] === undefined ? null : local.declared[key]!.partialRepetitions })),
    ...(isAmrapMax(config)
      ? {
          maxSeries: (local.maxClosed ?? []).map((key) => ({
            key,
            repetitions: local.maxDeclared?.[key] ?? (local.declared[key] === undefined ? null : local.declared[key]!.partialRepetitions),
          })),
        }
      : {}),
    stopped,
    closedAtMs: ctx.nowMs,
  };
}

function finish(config: AmrapScopeConfig, local: AmrapLocal, ctx: PilotContext, closeRefs: readonly string[] = []): PilotDecision {
  const result = blockResult(config, local, ctx, false);
  return { local, closeRefs, results: [{ type: "SCOPE", key: ctx.scopeKey, result }], next: { type: "CLOSE", contribution: result } };
}

/** Plus aucun travail dans les étapes `from…` du segment. */
function noActivityFrom(leaves: readonly LeafSpec[], from: number): boolean {
  return leaves.slice(from).every((leaf) => leaf.kind !== "ACTIVITY");
}

export const amrapPilot: Pilot = {
  open(spec) {
    const config = amrapConfig(spec);
    const segment = config.buyIn.length > 0 ? "BUY_IN" : "LOOP";
    const local: AmrapLocal = { phase: "WORK", segment, round: 1, index: 0, completedRounds: 0, interruptedKey: null, buyInFailures: [], pending: [], declared: {} };
    const first = segmentLeaves(config, local)[0];
    if (first === undefined) return { local, next: { type: "CLOSE" } };
    // Bloc : borne du bloc (D1) ; son départ est le début de la première étape (bip long, arbitrage du 18/11/2026).
    return { local, openRefs: [{ name: "block", role: "DEADLINE", budgetMs: config.blockMs }], next: { type: "CHILD", child: leafChild(first, true) } };
  },

  onChildClosed(raw, closed, ctx) {
    const config = amrapConfig(ctx.spec);
    const local = raw as AmrapLocal;
    if (local.phase === "CLOSURE") {
      // Clôture du bloc : saisie de l'étape présentée, puis la suivante à saisir ou la fin du bloc (D3).
      const payload = (closed.contribution ?? {}) as AmrapDeclaration;
      const key = local.pending[0];
      const declared = key === undefined ? local.declared : { ...local.declared, [key]: { partialRepetitions: numberOrNull(payload.partialRepetitions), partialDurationMs: numberOrNull(payload.partialDurationMs) } };
      const next: AmrapLocal = { ...local, pending: local.pending.slice(1), declared };
      if (next.pending.length > 0) return { local: next, next: { type: "CHILD", child: closureChild(config, ctx, next) } };
      return finish(config, next, ctx);
    }
    const leaves = segmentLeaves(config, local);
    const closedLeaf = leaves[local.index];
    let index = local.index + 1;
    const skipped: ResultChange[] = [];
    const advance = (closed.contribution as { readonly advance?: "ROUND" | "DURATION" } | undefined)?.advance;
    if (advance !== undefined && closed.kind === "LEAF" && closedLeaf !== undefined) {
      // « + Tour » : le reste du tour est fait ; lancement : les Séries jusqu'à l'exercice en durée sont faites. Jamais une durée
      // (comme le For time) ; une pause ou une Récupération qui suit le dernier travail sauté reste jouée.
      let last = local.index;
      for (let at = index; at < leaves.length; at += 1) {
        const leaf = leaves[at]!;
        if (isAmrapDurationLeaf(leaf)) break;
        if (leaf.kind === "ACTIVITY") last = at;
      }
      for (; index <= last; index += 1) {
        const leaf = leaves[index]!;
        if (leaf.kind === "ACTIVITY") skipped.push(skippedResult(leaf, ctx.nowMs));
      }
    }
    // Buy-in À l'échec terminé : ses répétitions se saisissent à la Clôture du bloc, sans retarder la boucle (FMT-26).
    const failure = local.segment === "BUY_IN" && closedLeaf !== undefined && closedLeaf.kind === "ACTIVITY" && closedLeaf.target !== undefined && closedLeaf.target.kind === "FAILURE";
    // D-531 / RM-272 : AMRAP à un seul mouvement en Max — la Série close attend ses répétitions (saisie au clavier, `onDeclare`).
    const maxSeries = local.segment === "LOOP" && closedLeaf !== undefined && closedLeaf.kind === "ACTIVITY" && isAmrapMax(config);
    let next: AmrapLocal = {
      ...local,
      index,
      stepStartedMs: ctx.refMs("block") ?? 0,
      ...(failure ? { buyInFailures: [...local.buyInFailures, closedLeaf.key] } : {}),
      ...(maxSeries ? { maxClosed: [...(local.maxClosed ?? []), closedLeaf.key] } : {}),
    };
    // Tour acquis : son dernier travail est clos (D-19), sa Récupération éventuelle n'en fait pas partie.
    if (next.segment === "LOOP" && next.completedRounds < next.round && noActivityFrom(leaves, index)) next = { ...next, completedRounds: next.round };
    if (index >= leaves.length) {
      next = next.segment === "BUY_IN" ? { ...next, segment: "LOOP", round: 1, index: 0 } : { ...next, round: next.round + 1, index: 0 };
      const first = segmentLeaves(config, next)[0];
      if (first === undefined) {
        // Boucle vide (configuration invalide en principe) : le bloc se termine avec le buy-in.
        const ended = finish(config, { ...next, phase: "CLOSURE" }, ctx, ["block"]);
        return skipped.length === 0 ? ended : { ...ended, results: [...skipped, ...(ended.results ?? [])] };
      }
      return { local: next, ...(skipped.length > 0 ? { results: skipped } : {}), next: { type: "CHILD", child: leafChild(first, false) } };
    }
    return { local: next, ...(skipped.length > 0 ? { results: skipped } : {}), next: { type: "CHILD", child: leafChild(leaves[index]!, false) } };
  },

  onReference(raw, refName, ctx) {
    const local = raw as AmrapLocal;
    if (refName !== "block" || local.phase !== "WORK") return { local, next: { type: "IDLE" } };
    const config = amrapConfig(ctx.spec);
    // Échéance du bloc (D1) : arrêt net, même pendant une Série ou une Récupération ; le noyau a fermé l'étape en cours.
    // Q4 : un travail confirmé pile à l'échéance est acquis ; l'étape ouverte à cet instant même n'est pas entamée (rien à saisir).
    const current = segmentLeaves(config, local)[local.index];
    const started = (local.stepStartedMs ?? 0) < config.blockMs;
    const interruptedKey = current !== undefined && current.kind === "ACTIVITY" && started ? current.key : null;
    // D-531 / RM-272 : Séries en Max closes dont les répétitions n'ont pas été saisies — demandées à la Clôture, après le partiel.
    const maxUndeclared = (local.maxClosed ?? []).filter((key) => key !== interruptedKey && local.maxDeclared?.[key] === undefined);
    const pending = [...(interruptedKey === null ? [] : [interruptedKey]), ...local.buyInFailures.filter((key) => key !== interruptedKey), ...maxUndeclared];
    const next: AmrapLocal = { ...local, phase: "CLOSURE", interruptedKey, pending, workEndedAtMs: ctx.nowMs };
    if (pending.length === 0) return finish(config, next, ctx, ["block"]);
    return { local: next, closeRefs: ["block"], next: { type: "CHILD", child: closureChild(config, ctx, next) } };
  },

  onDeclare(raw, payload, ctx) {
    // D-531 / RM-272 : répétitions d'une Série en Max close, saisies au clavier pendant que le bloc continue (`DECLARE`, non bloquant).
    const local = raw as AmrapLocal | null;
    const declaration = (payload ?? {}) as Partial<AmrapMaxDeclaration>;
    const entry = declaration.amrapMax;
    if (local === null || local.phase !== "WORK" || entry === undefined || !isAmrapMax(amrapConfig(ctx.spec))) return null;
    if (!(local.maxClosed ?? []).includes(entry.key)) return null;
    if (entry.skip === true) return { local: { ...local, maxDismissed: [...(local.maxDismissed ?? []), entry.key] }, results: [] };
    if (typeof entry.repetitions !== "number" || !Number.isFinite(entry.repetitions) || entry.repetitions < 0) return null;
    return { local: { ...local, maxDeclared: { ...(local.maxDeclared ?? {}), [entry.key]: Math.round(entry.repetitions) } }, results: [] };
  },

  allows(raw, command, leaf) {
    const local = raw as AmrapLocal | null;
    // Q2 et arbitrage du 18/11/2026 (barre du For time) : ni Réinitialiser, ni Pause manuelle.
    if (command === "RESET") return false;
    // Un exercice en durée ne se valide pas avant son terme (comme le For time) ; Suivant reste permis pendant une Récupération (Q3).
    if (command === "NEXT" && local?.phase === "WORK" && leaf !== null && isAmrapDurationLeaf(leaf)) return false;
    return true;
  },

  enables(raw, command, leaf) {
    const phase = (raw as AmrapLocal | null)?.phase;
    if (command === "STOP_RUNNING") return phase === "WORK" || phase === "CLOSURE";
    if (phase !== "WORK") return false;
    // Durée retenue seule pendant que le bloc continue (HOLD / RELEASE, comme le For time).
    return leaf !== null && isAmrapDurationLeaf(leaf);
  },

  onStop(raw, ctx, payload) {
    const local = raw as AmrapLocal | null;
    if (local === null) return [];
    const config = amrapConfig(ctx.spec);
    const given = (payload ?? {}) as AmrapDeclaration;
    const value: AmrapDeclared = { partialRepetitions: numberOrNull(given.partialRepetitions), partialDurationMs: numberOrNull(given.partialDurationMs) };
    if (local.phase === "CLOSURE") {
      // Arrêt pendant la Clôture : l'étape présentée prend la saisie de l'Arrêt s'il y en a une.
      const key = local.pending[0];
      const declared = key === undefined || (value.partialRepetitions === null && value.partialDurationMs === null) ? local.declared : { ...local.declared, [key]: value };
      return [{ type: "SCOPE", key: ctx.scopeKey, result: blockResult(config, { ...local, declared }, ctx, true) }];
    }
    // Arrêt pendant le travail : l'exercice en cours à l'instant de l'appui (répétitions saisies, ou durée tenue).
    const current = segmentLeaves(config, local)[local.index];
    const interruptedKey = current !== undefined && current.kind === "ACTIVITY" ? current.key : null;
    const duration = current !== undefined && isAmrapDurationLeaf(current);
    const declared =
      interruptedKey === null
        ? local.declared
        : { ...local.declared, [interruptedKey]: { partialRepetitions: duration ? null : value.partialRepetitions, partialDurationMs: duration ? value.partialDurationMs : null } };
    return [{ type: "SCOPE", key: ctx.scopeKey, result: blockResult(config, { ...local, interruptedKey, declared }, ctx, true) }];
  },
};
