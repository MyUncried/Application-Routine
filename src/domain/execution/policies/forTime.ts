/**
 * PRE-11 (T1) — politique **For time** (conception consolidée §12.3, §12.5 ; FMT-30 à FMT-32 ; D3, D6, Q4).
 *
 * Portée d'un élément For time (Exercice autonome ou Circuit porteur) : elle joue ses étapes dans l'ordre
 * prescrit (le développement D.1 a déjà fixé buy-in, tours et buy-out), sous :
 * - un **chronomètre d'élément** (`elapsed`, STOPWATCH) : le temps réalisé, suspendu par la Pause (§13) ;
 * - une **borne** facultative (`cap`, DEADLINE) : sans borne, seules les sécurités existantes (D6).
 *
 * Fin normale : clôture de la dernière étape de travail ; le temps réalisé est lu sur le chronomètre.
 * Borne atteinte : le noyau a fermé l'étape en cours (`CLOSED_BY_PARENT`) ; le temps réalisé est la borne.
 * Un travail confirmé pile à la borne est acquis (Q4, ordre du noyau). Dans les deux cas, une **Clôture**
 * bloquante (D3) est ouverte : aucune référence ne court pendant la saisie ; sa validation clôt l'élément et la
 * Séance enchaîne automatiquement.
 *
 * Réinitialiser reste permis (Q2 ne vise que l'AMRAP et le Death by) ; la borne et le chronomètre continuent.
 */

import type { Ms, Pilot, PilotContext, PilotDecision, ResetDecision } from "../kernel";
import type { ChildSpec, ForTimeScopeConfig, LeafSpec, ScopeSpec } from "../plan";

export const FOR_TIME_PILOT = "FOR_TIME";

/** Configuration compilée par `plan.ts` : borne (« Durée maximum ») en ms, `null` sans limite (D6). */
export type ForTimeConfig = ForTimeScopeConfig;

export type ForTimeLocal = {
  readonly index: number;
  readonly phase: "WORK" | "CLOSURE";
  /** Étapes de travail (Séries) closes, acquises ou passées. */
  readonly doneActivities: number;
  /** Temps réalisé, figé à la fin du travail ; `null` pendant le travail. */
  readonly measuredMs: Ms | null;
  readonly capReached: boolean;
  /** Étape de travail fermée par la borne (partiel à déclarer) ; `null` sinon. */
  readonly interruptedKey: string | null;
};

/** Saisie de la Clôture (modale « Résultat de série ») : répétitions du travail interrompu par la borne. */
export type ForTimeClosurePayload = { readonly partialRepetitions?: number | null };

/** Résultat de l'élément (ResultChange `SCOPE`, clé de la portée). */
export type ForTimeResult = {
  readonly format: "FOR_TIME";
  readonly elementId: string;
  readonly elementKind: "EXERCISE" | "CIRCUIT";
  readonly measuredMs: Ms;
  readonly capMs: Ms | null;
  readonly capReached: boolean;
  readonly completedActivities: number;
  readonly totalActivities: number;
  readonly interruptedKey: string | null;
  readonly partialRepetitions: number | null;
  readonly closedAtMs: Ms;
};

export function forTimeConfig(spec: ScopeSpec): ForTimeConfig {
  return spec.config as ForTimeConfig;
}

export function closureKey(scopeKey: string): string {
  return `${scopeKey}/closure`;
}

export function activityCount(config: ForTimeConfig): number {
  return config.items.filter((item) => item.type === "LEAF" && item.leaf.kind === "ACTIVITY").length;
}

function closureLeaf(ctx: PilotContext, config: ForTimeConfig): ChildSpec {
  const leaf: LeafSpec = {
    kind: "CLOSURE",
    key: closureKey(ctx.scopeKey),
    end: "INTERACTION",
    plannedMs: null,
    contribution: "omitted",
    ...(config.elementKind === "EXERCISE" ? { exerciseId: config.elementId } : {}),
    ...(config.context !== null ? { context: config.context } : {}),
  };
  return { type: "LEAF", leaf };
}

/** Fin du travail (normale ou par la borne) : chronomètre figé, Clôture bloquante (D3). */
function endWork(local: ForTimeLocal, ctx: PilotContext, capReached: boolean): PilotDecision {
  const config = forTimeConfig(ctx.spec);
  const measuredMs = capReached && config.capMs !== null ? config.capMs : (ctx.refMs("elapsed") ?? 0);
  const interruptedItem = capReached ? config.items[local.index] : undefined;
  const interruptedKey = interruptedItem?.type === "LEAF" && interruptedItem.leaf.kind === "ACTIVITY" ? interruptedItem.leaf.key : null;
  const next: ForTimeLocal = { ...local, phase: "CLOSURE", measuredMs, capReached, interruptedKey };
  return { local: next, closeRefs: ["elapsed", "cap"], next: { type: "CHILD", child: closureLeaf(ctx, config) } };
}

export const forTimePilot: Pilot = {
  open(spec, ctx) {
    const config = forTimeConfig(spec);
    const local: ForTimeLocal = { index: 0, phase: "WORK", doneActivities: 0, measuredMs: null, capReached: false, interruptedKey: null };
    const first = config.items[0];
    if (first === undefined) return { local, next: { type: "CLOSE" } };
    return {
      local,
      openRefs: [
        { name: "elapsed", role: "STOPWATCH", budgetMs: null },
        ...(config.capMs !== null ? [{ name: "cap", role: "DEADLINE" as const, budgetMs: config.capMs }] : []),
      ],
      next: { type: "CHILD", child: first },
    };
  },

  onChildClosed(raw, closed, ctx) {
    const config = forTimeConfig(ctx.spec);
    const local = raw as ForTimeLocal;
    if (local.phase === "CLOSURE") {
      const payload = (closed.contribution ?? {}) as ForTimeClosurePayload;
      const result: ForTimeResult = {
        format: "FOR_TIME",
        elementId: config.elementId,
        elementKind: config.elementKind,
        measuredMs: local.measuredMs ?? 0,
        capMs: config.capMs,
        capReached: local.capReached,
        completedActivities: local.doneActivities,
        totalActivities: activityCount(config),
        interruptedKey: local.interruptedKey,
        partialRepetitions: local.interruptedKey === null ? null : (payload.partialRepetitions ?? null),
        closedAtMs: ctx.nowMs,
      };
      return { local, results: [{ type: "SCOPE", key: ctx.scopeKey, result }], next: { type: "CLOSE", contribution: result } };
    }
    const done = closed.leafKind === "ACTIVITY" ? local.doneActivities + 1 : local.doneActivities;
    const index = local.index + 1;
    const next: ForTimeLocal = { ...local, index, doneActivities: done };
    const item = config.items[index];
    if (item === undefined) return endWork(next, ctx, false);
    return { local: next, next: { type: "CHILD", child: item } };
  },

  onReference(raw, refName, ctx) {
    const local = raw as ForTimeLocal;
    if (refName === "cap" && local.phase === "WORK") return endWork(local, ctx, true);
    return { local, next: { type: "IDLE" } };
  },

  onReset(raw, leaf, ctx): ResetDecision {
    const local = raw as ForTimeLocal;
    if (local.phase !== "WORK" || leaf.resetToKey === undefined || leaf.resetToKey === leaf.key) return { type: "RESTART" };
    const items = forTimeConfig(ctx.spec).items;
    const target = items.findIndex((item) => item.type === "LEAF" && item.leaf.key === leaf.resetToKey);
    if (target < 0 || target > local.index) return { type: "RESTART" };
    const replayed = items.slice(target, local.index).flatMap((item) => (item.type === "LEAF" ? [item.leaf] : []));
    const replayedActivities = replayed.filter((spec) => spec.kind === "ACTIVITY").length;
    return {
      type: "REWIND",
      local: { ...local, index: target, doneActivities: Math.max(0, local.doneActivities - replayedActivities) },
      child: items[target]!,
      replayedKeys: replayed.map((spec) => spec.key),
    };
  },
};
