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
 *
 * Registre ch07, « For time — exécution : exercices en durée, « + Tour », sans Pause » (Hermann, 16/11/2026) ; Formats §11.1 :
 * - « + Tour » (`NEXT` avec `advance: "ROUND"`) clôt l'étape et les Séries restantes de son tour (même `roundKeyOf`) ; il ne
 *   saute jamais un exercice en durée ;
 * - après un exercice en répétitions, l'appui dans la zone du haut (`advance: "DURATION"`) clôt les Séries du tour jusqu'à
 *   l'exercice en durée qui suit, qui démarre aussitôt ; partout ailleurs, l'exercice en durée démarre seul à son ouverture ;
 * - un exercice en durée ne se valide pas avant son terme (`NEXT` refusé) ; il se retient et repart seul (`HOLD` /
 *   `RELEASE`, le chronomètre du For time continue) ; à son terme l'étape suivante s'ouvre (fin de tour sans « + Tour ») ;
 * - « Arrêt » sans Pause préalable (`STOP_RUNNING`) ; pendant une durée, la durée tenue est enregistrée avec le résultat.
 */

import type { Ms, Pilot, PilotContext, PilotDecision, ResetDecision, ResultChange, StepResult } from "../kernel";
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
  /** Instant (horloge du noyau) de la fin du travail ; absent pendant le travail et dans un état antérieur. */
  readonly workEndedAtMs?: Ms;
};

/**
 * Saisie de la Clôture (modale « Résultat de série ») : répétitions du travail interrompu par la borne. À l'Arrêt pendant un
 * exercice en durée (règle 6 de la mission du 16/11/2026), la durée tenue (`partialDurationMs`).
 */
export type ForTimeClosurePayload = { readonly partialRepetitions?: number | null; readonly partialDurationMs?: number | null };

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
  /** Durée tenue de l'exercice en durée interrompu par l'Arrêt ; absente sinon. */
  readonly partialDurationMs?: number | null;
  readonly closedAtMs: Ms;
};

/**
 * Tour d'une étape, au sens de « + Tour » : en alternance, le tour du Circuit (`…/circuit:<id>#<k>`) ; à la suite, la série k
 * d'un exercice (`…/circuit:<id>#<exercice>#<k>`) ; buy-in, buy-out et For time d'un seul exercice, une Série (`…/s<k>`, ses
 * côtés et sa pause compris). Le repos entre les tours est son propre tour : il n'est jamais sauté par « + Tour ».
 */
export function roundKeyOf(spec: LeafSpec): string {
  const key = spec.key;
  if (key.endsWith("/rest")) return key;
  const alternated = /^(.*\/circuit:[^/#]+#\d+)\//.exec(key);
  if (alternated !== null) return alternated[1]!;
  const grouped = /^(.*\/circuit:[^/#]+#[^/#]+#\d+)\//.exec(key);
  if (grouped !== null) return grouped[1]!;
  const sidePause = /^(.*)\/side-pause\/(s\d+)$/.exec(key);
  if (sidePause !== null) return `${sidePause[1]}/${sidePause[2]}`;
  const series = /^(.*\/s\d+)(\/|$)/.exec(key);
  return series !== null ? series[1]! : key;
}

/** Exercice en durée (Série en Durée chiffrée) : démarre seul, ne se valide pas avant son terme. */
export function isDurationLeaf(spec: LeafSpec): boolean {
  return spec.kind === "ACTIVITY" && spec.end === "TIMED";
}

/**
 * Exercice en durée à lancer : la première Série en durée qui suit l'étape `index` dans son tour, si l'étape `index` est une Série
 * en répétitions ; `null` sinon (« + Tour » est alors permis).
 */
export function pendingDurationOf(config: ForTimeConfig, index: number): LeafSpec | null {
  const current = config.items[index];
  if (current?.type !== "LEAF" || current.leaf.kind !== "ACTIVITY" || isDurationLeaf(current.leaf)) return null;
  const round = roundKeyOf(current.leaf);
  for (let at = index + 1; at < config.items.length; at += 1) {
    const item = config.items[at]!;
    if (item.type !== "LEAF" || roundKeyOf(item.leaf) !== round) return null;
    if (isDurationLeaf(item.leaf)) return item.leaf;
  }
  return null;
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

export function forTimeConfig(spec: ScopeSpec): ForTimeConfig {
  return spec.config as ForTimeConfig;
}

export function closureKey(scopeKey: string): string {
  return `${scopeKey}/closure`;
}

function childLeaves(items: readonly ChildSpec[]): readonly LeafSpec[] {
  return items.flatMap((item) => (item.type === "LEAF" ? [item.leaf] : []));
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
  const next: ForTimeLocal = { ...local, phase: "CLOSURE", measuredMs, capReached, interruptedKey, workEndedAtMs: ctx.nowMs };
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
      // Troisième recette du 17/11/2026 (ftr3-modale-duree : « Durée retenue ou roulette horizontale en fonction du type d'exercice ») :
      // exercice en durée interrompu par la borne, durée tenue saisie à la Clôture.
      const base = scopeResult(local, config, ctx, payload.partialRepetitions ?? null);
      const result: ForTimeResult = local.interruptedKey !== null && typeof payload.partialDurationMs === "number" ? { ...base, partialRepetitions: null, partialDurationMs: payload.partialDurationMs } : base;
      return { local, results: [{ type: "SCOPE", key: ctx.scopeKey, result }], next: { type: "CLOSE", contribution: result } };
    }
    let done = closed.leafKind === "ACTIVITY" ? local.doneActivities + 1 : local.doneActivities;
    let index = local.index + 1;
    const skipped: ResultChange[] = [];
    const advance = (closed.contribution as { readonly advance?: "ROUND" | "DURATION" } | undefined)?.advance;
    const closedItem = config.items[local.index];
    if (advance !== undefined && closed.kind === "LEAF" && closedItem?.type === "LEAF") {
      // « + Tour » : le reste du tour est fait ; lancement : les Séries jusqu'à l'exercice en durée sont faites. Jamais une durée.
      // Jusqu'à la dernière Série du tour (avant un exercice en durée) : une pause ou un repos qui la suit reste joué.
      const round = roundKeyOf(closedItem.leaf);
      let last = local.index;
      for (let at = index; at < config.items.length; at += 1) {
        const item = config.items[at]!;
        if (item.type !== "LEAF" || roundKeyOf(item.leaf) !== round || isDurationLeaf(item.leaf)) break;
        if (item.leaf.kind === "ACTIVITY") last = at;
      }
      for (; index <= last; index += 1) {
        const item = config.items[index]!;
        if (item.type === "LEAF" && item.leaf.kind === "ACTIVITY") {
          done += 1;
          skipped.push(skippedResult(item.leaf, ctx.nowMs));
        }
      }
    }
    const next: ForTimeLocal = { ...local, index, doneActivities: done };
    const item = config.items[index];
    if (item === undefined) {
      const ended = endWork(next, ctx, false);
      return skipped.length === 0 ? ended : { ...ended, results: [...skipped, ...(ended.results ?? [])] };
    }
    const started = item.type === "LEAF" ? [...(local.phaseStarts ?? []), { atMs: ctx.refMs("elapsed") ?? 0, kind: item.leaf.kind }] : local.phaseStarts;
    return {
      local: started === undefined ? next : { ...next, phaseStarts: started },
      ...(skipped.length > 0 ? { results: skipped } : {}),
      next: { type: "CHILD", child: item },
    };
  },

  onReference(raw, refName, ctx) {
    const local = raw as ForTimeLocal;
    if (refName === "cap" && local.phase === "WORK") return endWork(local, ctx, true);
    return { local, next: { type: "IDLE" } };
  },

  allows(raw, command, leaf) {
    const work = (raw as ForTimeLocal | null)?.phase === "WORK";
    // Correction 3 : Réinitialiser désactivé pendant le travail du For time.
    if (command === "RESET" && work) return false;
    // 16/11/2026 (Formats §11.1) : « Un exercice en durée ne se valide pas avant son terme. »
    if (command === "NEXT" && work && leaf !== null && isDurationLeaf(leaf)) return false;
    return true;
  },

  enables(raw, command, leaf) {
    const phase = (raw as ForTimeLocal | null)?.phase;
    // Seconde recette du 17/11/2026 (Hermann, modale de l'Arrêt laissée ouverte jusqu'à la Durée maximum : « L'écran Résultat ne doit
    // pas afficher […] Appuyer sur terminer amène alors à l'écran de synthèse ») : l'Arrêt reste possible pendant la Clôture.
    if (command === "STOP_RUNNING") return phase === "WORK" || phase === "CLOSURE";
    if (phase !== "WORK") return false;
    // 16/11/2026 : « Arrêt » sans Pause (Pause désactivée) ; durée retenue seule pendant que le chrono continue.
    return leaf !== null && isDurationLeaf(leaf);
  },

  onStop(raw, ctx, payload) {
    const local = raw as ForTimeLocal | null;
    if (local === null) return [];
    const config = forTimeConfig(ctx.spec);
    if (local.phase === "CLOSURE") {
      // Arrêt demandé avant la borne, confirmé pendant la Clôture qu'elle a ouverte (seconde recette du 17/11/2026) : le temps de
      // l'appui sur « Arrêt » (`ctx.nowMs`, daté par l'écran), retranché de la fin du travail ; le travail interrompu par la borne.
      const late = local.workEndedAtMs === undefined ? 0 : Math.max(0, local.workEndedAtMs - ctx.nowMs);
      const interrupted = local.interruptedKey === null ? undefined : childLeaves(config.items).find((leaf) => leaf.key === local.interruptedKey);
      const durationThen = interrupted !== undefined && isDurationLeaf(interrupted);
      const partial = (payload ?? {}) as ForTimeClosurePayload;
      const closed: ForTimeResult = {
        ...scopeResult({ ...local, measuredMs: Math.max(0, (local.measuredMs ?? 0) - late), capReached: local.capReached && late === 0 }, config, ctx, durationThen ? null : (partial.partialRepetitions ?? null)),
        ...(durationThen && typeof partial.partialDurationMs === "number" ? { partialDurationMs: partial.partialDurationMs } : {}),
      };
      return [{ type: "SCOPE", key: ctx.scopeKey, result: closed }];
    }
    if (local.phase !== "WORK") return [];
    const item = config.items[local.index];
    const interruptedKey = item?.type === "LEAF" && item.leaf.kind === "ACTIVITY" ? item.leaf.key : null;
    const durationNow = item?.type === "LEAF" && isDurationLeaf(item.leaf);
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
      // Saisie faite derrière la modale pendant que le chrono continue : seule la valeur qui correspond à l'étape courante à
      // l'instant de l'Arrêt est retenue (une durée terminée entre-temps n'attribue pas sa durée tenue à la Série suivante).
      partialRepetitions: interruptedKey === null || durationNow ? null : (partial.partialRepetitions ?? null),
      ...(interruptedKey !== null && durationNow && typeof partial.partialDurationMs === "number" ? { partialDurationMs: partial.partialDurationMs } : {}),
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
