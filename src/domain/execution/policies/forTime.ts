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
 *
 * PRE-11, corrections 3 et 4 de Hermann du 14/11/2026 :
 * - Réinitialiser est désactivé pendant le travail du For time [permis — remplacé] ; le bouton ✓ valide l'étape sans saisie
 *   (`NEXT` validé, noyau) ;
 * - aucune modale de résultat dans le déroulement normal : en fin normale, la Clôture est un affichage du temps final de
 *   `FINAL_TIME_MS`, sans saisie, qui se ferme seule [Clôture bloquante « Vos résultats » en fin normale — remplacée] ; la
 *   Clôture à saisir ne reste que si la borne interrompt une série (répétitions faites) ;
 *   [affichage du temps final remplacé — recette du 14/11/2026, Hermann : « à l’issue du For Time une fenêtre Résultat s’affiche
 *   avant la pause qui précède le dernier exercice. Il faut supprimer cette fenêtre résultat, passer directement à la pause » ;
 *   « Je ne veux pas de cet écran. Les résultats des exercices seront présentés à la fin de la séance » : en fin normale, aucune
 *   Clôture, le résultat est enregistré et la Séance enchaîne aussitôt ;]
 * - arrêt de la séance (`onStop`) : résultat de l'élément enregistré, séries terminées plus répétitions saisies pour la série
 *   en cours (aucune entre deux séries).
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
  /**
   * PRE-11, précision FT-15 de Hermann du 14/11/2026 (« le cercle doit devenir bicolore ») : début de chaque étape, en temps
   * réalisé du For time, et sa nature — l'écran en tire un segment d'arc par phase. Absent d'un état antérieur : aucun segment.
   */
  readonly phaseStarts?: readonly { readonly atMs: Ms; readonly kind: LeafSpec["kind"] }[];
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

/** Clôture à saisir : répétitions de la série interrompue par la borne (seul cas restant, recette du 14/11/2026). */
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
  if (interruptedKey === null) {
    // Recette du 14/11/2026 : aucune Clôture affichée ; résultat enregistré, la Séance enchaîne aussitôt.
    const result = scopeResult(next, config, ctx, null);
    return { local: next, closeRefs: ["elapsed", "cap"], results: [{ type: "SCOPE", key: ctx.scopeKey, result }], next: { type: "CLOSE", contribution: result } };
  }
  return { local: next, closeRefs: ["elapsed", "cap"], next: { type: "CHILD", child: closureLeaf(ctx, config) } };
}

function scopeResult(local: ForTimeLocal, config: ForTimeConfig, ctx: PilotContext, partialRepetitions: number | null): ForTimeResult {
  return {
    format: "FOR_TIME",
    elementId: config.elementId,
    elementKind: config.elementKind,
    measuredMs: local.measuredMs ?? 0,
    capMs: config.capMs,
    capReached: local.capReached,
    completedActivities: local.doneActivities,
    totalActivities: activityCount(config),
    interruptedKey: local.interruptedKey,
    partialRepetitions: local.interruptedKey === null ? null : partialRepetitions,
    closedAtMs: ctx.nowMs,
  };
}

export const forTimePilot: Pilot = {
  open(spec, ctx) {
    const config = forTimeConfig(spec);
    const first = config.items[0];
    const local: ForTimeLocal = {
      index: 0,
      phase: "WORK",
      doneActivities: 0,
      measuredMs: null,
      capReached: false,
      interruptedKey: null,
      phaseStarts: first?.type === "LEAF" ? [{ atMs: 0, kind: first.leaf.kind }] : [],
    };
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
      const result = scopeResult(local, config, ctx, payload.partialRepetitions ?? null);
      return { local, results: [{ type: "SCOPE", key: ctx.scopeKey, result }], next: { type: "CLOSE", contribution: result } };
    }
    const done = closed.leafKind === "ACTIVITY" ? local.doneActivities + 1 : local.doneActivities;
    const index = local.index + 1;
    const next: ForTimeLocal = { ...local, index, doneActivities: done };
    const item = config.items[index];
    if (item === undefined) return endWork(next, ctx, false);
    const started = item.type === "LEAF" ? [...(local.phaseStarts ?? []), { atMs: ctx.refMs("elapsed") ?? 0, kind: item.leaf.kind }] : local.phaseStarts;
    return { local: started === undefined ? next : { ...next, phaseStarts: started }, next: { type: "CHILD", child: item } };
  },

  onReference(raw, refName, ctx) {
    const local = raw as ForTimeLocal;
    if (refName === "cap" && local.phase === "WORK") return endWork(local, ctx, true);
    return { local, next: { type: "IDLE" } };
  },

  allows(raw, command) {
    // Correction 3 : Réinitialiser désactivé pendant le travail du For time.
    return !(command === "RESET" && (raw as ForTimeLocal | null)?.phase === "WORK");
  },

  onStop(raw, ctx, payload) {
    const local = raw as ForTimeLocal | null;
    if (local === null || local.phase !== "WORK") return [];
    const config = forTimeConfig(ctx.spec);
    const item = config.items[local.index];
    const interruptedKey = item?.type === "LEAF" && item.leaf.kind === "ACTIVITY" ? item.leaf.key : null;
    const partial = (payload ?? {}) as ForTimeClosurePayload;
    const result: ForTimeResult = {
      format: "FOR_TIME",
      elementId: config.elementId,
      elementKind: config.elementKind,
      measuredMs: ctx.refMs("elapsed") ?? 0,
      capMs: config.capMs,
      capReached: false,
      completedActivities: local.doneActivities,
      totalActivities: activityCount(config),
      interruptedKey,
      partialRepetitions: interruptedKey === null ? null : (partial.partialRepetitions ?? null),
      closedAtMs: ctx.nowMs,
    };
    return [{ type: "SCOPE", key: ctx.scopeKey, result }];
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
