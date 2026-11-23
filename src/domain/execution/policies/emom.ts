/**
 * PRE-11 (T2) — politique **EMOM** (conception consolidée §12.2, §12.5 ; FMT-20 à FMT-25, FMT-35, FMT-36 ; D3, D4, D5, Q1, Q4, Q5 ;
 * cas T10, T11, T26, T28).
 *
 * Portée d'un élément EMOM (Exercice autonome — y compris À la suite et en alternance dans un Circuit standard — ou Circuit porteur
 * « dans chaque intervalle ») : une suite de **fenêtres** de durée fixe (référence `window`, rôle WINDOW). Dans chaque fenêtre :
 * - les étapes de travail de la fenêtre s'enchaînent (Série et ses deux côtés, Q5 ; membres d'un Circuit porteur, dans l'ordre) ;
 *   une Série en Répétitions se termine par l'appui (« travail terminé », FMT-24, FMT-35) ; une Série en Durée démarre seule à
 *   l'ouverture de la fenêtre et se termine à son terme ;
 * - le travail terminé révèle le **repos** de la fenêtre (`WINDOW_REST`, fin avec la fenêtre) : il ne fait pas avancer la
 *   fenêtre (FMT-23, FMT-24, T11) ;
 * - à l'échéance, la fenêtre suivante commence à l'heure, que le travail soit terminé ou non (FMT-23, D5) ; un travail confirmé à
 *   l'instant de l'échéance est acquis (Q4, ordre du noyau).
 *
 * Fenêtre non terminée (D5, Q1, T28) : enregistrée « non terminée » ; si le travail interrompu était une Série en Répétitions,
 * ses répétitions faites se déclarent sans bloquer dans la fenêtre suivante (bandeau, commande `DECLARE`) ; ce qui n'est pas
 * saisi est redemandé à la **Clôture** de l'EMOM, présentée seulement s'il en reste (§12.2, §12.5). Une Série en Durée
 * interrompue enregistre sa durée tenue, sans saisie.
 *
 * Arbitrages de Hermann du 18/11/2026 (spec PRE-11 §5 point 30) : barre du For time — Arrêt sans Pause (`STOP_RUNNING`), pas de
 * Réinitialiser ; aucune modale de résultat dans le déroulement normal. [D4 « La Pause manuelle reste toujours possible » —
 * remplacé pour l'EMOM.]
 */

import type { Ms, Pilot, PilotContext, PilotDecision, ResultChange } from "../kernel";
import type { ChildSpec, EmomScopeConfig, LeafSpec, ScopeSpec } from "../plan";

export const EMOM_PILOT = "EMOM";

export function emomConfig(spec: ScopeSpec): EmomScopeConfig {
  return spec.config as EmomScopeConfig;
}

/** Issue d'une fenêtre jouée. */
export type EmomWindowOutcome = {
  /** Rang de la fenêtre (1…n). */
  readonly window: number;
  readonly terminated: boolean;
  /** Étape de travail interrompue par l'échéance (fenêtre non terminée) ; `null` sinon. */
  readonly interruptedKey: string | null;
  /** Répétitions faites de la Série interrompue, à déclarer (Q1) : `true` tant qu'elles ne sont pas déclarées. */
  readonly toDeclare: boolean;
  readonly partialRepetitions: number | null;
  /** Durée tenue d'une Série en Durée interrompue (ms). */
  readonly partialDurationMs: number | null;
};

export type EmomLocal = {
  readonly phase: "WORK" | "CLOSURE";
  /** Fenêtre en cours (indice dans `config.windows`). */
  readonly window: number;
  /** Étape ouverte (indice dans `config.items`). */
  readonly index: number;
  readonly workDone: boolean;
  /** Temps de la fenêtre à la fin du travail (repos révélé) ; `null` avant. */
  readonly workEndedMs: Ms | null;
  /** Temps de la fenêtre à l'ouverture de l'étape en cours (durée tenue d'une Série en Durée interrompue). */
  readonly stepStartedMs: Ms;
  readonly outcomes: readonly EmomWindowOutcome[];
  /** Fenêtres dont le bandeau Q1 a été passé (« Passer ») : redemandées à la Clôture. */
  readonly dismissed: readonly number[];
  /** Fenêtre déclarée à la Clôture en cours ; `null` hors Clôture. */
  readonly closing: number | null;
};

/** Résultat d'une fenêtre (ResultChange `SCOPE`, clé `<portée>/f<rang>`). */
export type EmomWindowResult = {
  readonly format: "EMOM";
  readonly elementId: string;
  readonly window: number;
  readonly windows: number;
  readonly terminated: boolean;
  readonly workEndedMs: Ms | null;
  readonly interruptedKey: string | null;
  readonly partialRepetitions: number | null;
  readonly partialDurationMs: number | null;
  readonly closedAtMs: Ms;
};

/** Résultat de l'élément (ResultChange `SCOPE`, clé de la portée). */
export type EmomResult = {
  readonly format: "EMOM";
  readonly elementId: string;
  readonly elementKind: "EXERCISE" | "CIRCUIT";
  readonly windows: number;
  readonly played: number;
  readonly terminated: number;
  readonly stopped: boolean;
  readonly closedAtMs: Ms;
};

/** Saisie : bandeau Q1 (`DECLARE`), Clôture (`SUBMIT`) ou Arrêt (`STOP`). */
export type EmomDeclaration = { readonly window?: number; readonly partialRepetitions?: number | null; readonly partialDurationMs?: number | null; readonly skip?: boolean };

export function windowResultKey(scopeKey: string, window: number): string {
  return `${scopeKey}/f${window}`;
}

export function emomClosureKey(scopeKey: string, window: number): string {
  return `${scopeKey}/closure/f${window}`;
}

/** Étape de travail en Durée chiffrée (démarre seule, finit à son terme). */
export function isTimedWork(spec: LeafSpec): boolean {
  return spec.kind === "ACTIVITY" && spec.end === "TIMED";
}

function itemLeaf(config: EmomScopeConfig, index: number): LeafSpec | null {
  const item = config.items[index];
  return item?.type === "LEAF" ? item.leaf : null;
}

function windowResult(config: EmomScopeConfig, ctx: PilotContext, outcome: EmomWindowOutcome, workEndedMs: Ms | null): ResultChange {
  const result: EmomWindowResult = {
    format: "EMOM",
    elementId: config.elementId,
    window: outcome.window,
    windows: config.windows.length,
    terminated: outcome.terminated,
    workEndedMs,
    interruptedKey: outcome.interruptedKey,
    partialRepetitions: outcome.partialRepetitions,
    partialDurationMs: outcome.partialDurationMs,
    closedAtMs: ctx.nowMs,
  };
  return { type: "SCOPE", key: windowResultKey(ctx.scopeKey, outcome.window), result };
}

function elementResult(config: EmomScopeConfig, ctx: PilotContext, outcomes: readonly EmomWindowOutcome[], stopped: boolean): ResultChange {
  const result: EmomResult = {
    format: "EMOM",
    elementId: config.elementId,
    elementKind: config.elementKind,
    windows: config.windows.length,
    played: outcomes.length,
    terminated: outcomes.filter((outcome) => outcome.terminated).length,
    stopped,
    closedAtMs: ctx.nowMs,
  };
  return { type: "SCOPE", key: ctx.scopeKey, result };
}

/** Ouverture de la fenêtre `window` : référence WINDOW, première étape (qui démarre à l'heure). */
function openWindow(config: EmomScopeConfig, local: EmomLocal, window: number): PilotDecision {
  const spec = config.windows[window]!;
  const next: EmomLocal = { ...local, phase: "WORK", window, index: spec.start, workDone: false, workEndedMs: null, stepStartedMs: 0 };
  return { local: next, openRefs: [{ name: "window", role: "WINDOW", budgetMs: config.windowMs }], next: { type: "CHILD", child: config.items[spec.start]! } };
}

/** Fenêtres dont les répétitions faites restent à déclarer (Clôture de l'EMOM, §12.2). */
export function undeclared(local: EmomLocal): readonly EmomWindowOutcome[] {
  return local.outcomes.filter((outcome) => outcome.toDeclare);
}

function closureChild(config: EmomScopeConfig, ctx: PilotContext, outcome: EmomWindowOutcome): ChildSpec {
  const interrupted = outcome.interruptedKey === null ? null : config.items.flatMap((item) => (item.type === "LEAF" && item.leaf.key === outcome.interruptedKey ? [item.leaf] : []))[0] ?? null;
  const leaf: LeafSpec = {
    kind: "CLOSURE",
    key: emomClosureKey(ctx.scopeKey, outcome.window),
    end: "INTERACTION",
    plannedMs: null,
    contribution: "omitted",
    ...(interrupted?.exerciseId !== undefined ? { exerciseId: interrupted.exerciseId } : {}),
    ...(interrupted?.context !== undefined ? { context: interrupted.context } : config.context !== null ? { context: config.context } : {}),
  };
  return { type: "LEAF", leaf };
}

/** Fin de la dernière fenêtre : Clôture s'il reste des répétitions à déclarer, sinon fin de l'élément (D3). */
function endElement(config: EmomScopeConfig, local: EmomLocal, ctx: PilotContext, results: readonly ResultChange[]): PilotDecision {
  const pending = undeclared(local)[0];
  if (pending === undefined) {
    return { local, results: [...results, elementResult(config, ctx, local.outcomes, false)], next: { type: "CLOSE" } };
  }
  return { local: { ...local, phase: "CLOSURE", closing: pending.window }, results, next: { type: "CHILD", child: closureChild(config, ctx, pending) } };
}

function declared(local: EmomLocal, window: number, change: Partial<EmomWindowOutcome>): EmomLocal {
  return { ...local, outcomes: local.outcomes.map((outcome) => (outcome.window === window ? { ...outcome, ...change } : outcome)) };
}

/** Issue de la fenêtre en cours à l'instant `ctx.nowMs` (échéance ou Arrêt). */
function outcomeNow(config: EmomScopeConfig, local: EmomLocal, ctx: PilotContext, payload: EmomDeclaration | null): EmomWindowOutcome {
  const number = config.windows[local.window]!.number;
  if (local.workDone) return { window: number, terminated: true, interruptedKey: null, toDeclare: false, partialRepetitions: null, partialDurationMs: null };
  const current = itemLeaf(config, local.index);
  const work = current !== null && current.kind === "ACTIVITY" ? current : null;
  const timed = work !== null && isTimedWork(work);
  const repetitions = work !== null && !timed;
  const heldMs = timed ? Math.max(0, (ctx.refMs("window") ?? config.windowMs) - local.stepStartedMs) : null;
  const given = payload?.partialRepetitions;
  return {
    window: number,
    terminated: false,
    interruptedKey: work?.key ?? current?.key ?? null,
    toDeclare: repetitions && typeof given !== "number",
    partialRepetitions: repetitions && typeof given === "number" ? given : null,
    partialDurationMs: timed ? (typeof payload?.partialDurationMs === "number" ? payload.partialDurationMs : heldMs) : null,
  };
}

export const emomPilot: Pilot = {
  open(spec, ctx) {
    const config = emomConfig(spec);
    const local: EmomLocal = { phase: "WORK", window: 0, index: 0, workDone: false, workEndedMs: null, stepStartedMs: 0, outcomes: [], dismissed: [], closing: null };
    if (config.windows.length === 0) return { local, next: { type: "CLOSE" } };
    return openWindow(config, local, 0);
  },

  onChildClosed(raw, closed, ctx) {
    const config = emomConfig(ctx.spec);
    const local = raw as EmomLocal;
    if (local.phase === "CLOSURE") {
      // Clôture de l'EMOM : répétitions faites de la fenêtre déclarée, puis la suivante à déclarer ou la fin (D3).
      const payload = (closed.contribution ?? {}) as EmomDeclaration;
      const window = local.closing ?? 0;
      const value = typeof payload.partialRepetitions === "number" ? payload.partialRepetitions : 0;
      const next = declared(local, window, { toDeclare: false, partialRepetitions: value });
      const outcome = next.outcomes.find((candidate) => candidate.window === window)!;
      return endElement(config, { ...next, closing: null }, ctx, [windowResult(config, ctx, outcome, null)]);
    }
    const index = local.index + 1;
    const spec = config.windows[local.window]!;
    const item = config.items[index];
    if (index >= spec.end - 1 || item === undefined) {
      // Travail de la fenêtre terminé : le repos restant se révèle, la fenêtre continue (FMT-24, T11).
      const rest = config.items[spec.end - 1]!;
      return { local: { ...local, index: spec.end - 1, workDone: true, workEndedMs: ctx.refMs("window") ?? 0 }, next: { type: "CHILD", child: rest } };
    }
    return { local: { ...local, index, stepStartedMs: ctx.refMs("window") ?? 0 }, next: { type: "CHILD", child: item } };
  },

  onReference(raw, refName, ctx) {
    const local = raw as EmomLocal;
    if (refName !== "window" || local.phase !== "WORK") return { local, next: { type: "IDLE" } };
    const config = emomConfig(ctx.spec);
    // Échéance de la fenêtre : le noyau a fermé l'étape en cours (`CLOSED_BY_PARENT`) ; issue de la fenêtre (D5).
    const outcome = outcomeNow(config, local, ctx, null);
    const outcomes = [...local.outcomes, outcome];
    const result = windowResult(config, ctx, outcome, local.workEndedMs);
    const after: EmomLocal = { ...local, outcomes };
    if (local.window + 1 < config.windows.length) {
      // Fenêtre suivante à l'heure, sans repos inventé (FMT-23, D5).
      const decision = openWindow(config, after, local.window + 1);
      return { ...decision, results: [result] };
    }
    return endElement(config, after, ctx, [result]);
  },

  allows(raw, command, leaf) {
    const local = raw as EmomLocal | null;
    // Arbitrage du 18/11/2026 (barre du For time) : ni Réinitialiser, ni Pause manuelle. [Pause toujours possible (D4) — remplacé.]
    if (command === "RESET") return false;
    // Une Série en Durée se termine à son terme (consigne du 18/11/2026 : « démarre seul à l'ouverture et finit à son terme »).
    if (command === "NEXT" && local?.phase === "WORK" && leaf !== null && isTimedWork(leaf)) return false;
    return true;
  },

  enables(raw, command, leaf) {
    const local = raw as EmomLocal | null;
    const phase = local?.phase;
    if (command === "STOP_RUNNING") return phase === "WORK" || phase === "CLOSURE";
    // Recette du 18/11/2026 (emom-6, Hermann : « L'appui au centre met en pause uniquement le compteur d'effort cumulé, jamais le chrono
    // de la minute ») : une Série en Durée se retient et repart (`HOLD` / `RELEASE`, comme le For time) ; la fenêtre continue. En repos
    // (travail terminé), rien à retenir.
    return phase === "WORK" && local?.workDone !== true && leaf !== null && isTimedWork(leaf);
  },

  onDeclare(raw, payload, ctx) {
    const local = raw as EmomLocal | null;
    const declaration = (payload ?? {}) as EmomDeclaration;
    if (local === null || typeof declaration.window !== "number") return null;
    const outcome = local.outcomes.find((candidate) => candidate.window === declaration.window);
    if (outcome === undefined || !outcome.toDeclare) return null;
    if (declaration.skip === true) {
      // « Passer » (Q1) : rien n'est enregistré ; redemandé à la Clôture.
      return { local: { ...local, dismissed: [...local.dismissed, declaration.window] }, results: [] };
    }
    if (typeof declaration.partialRepetitions !== "number") return null;
    const next = declared(local, declaration.window, { toDeclare: false, partialRepetitions: declaration.partialRepetitions });
    const updated = next.outcomes.find((candidate) => candidate.window === declaration.window)!;
    return { local: next, results: [windowResult(emomConfig(ctx.spec), ctx, updated, null)] };
  },

  onStop(raw, ctx, payload) {
    const local = raw as EmomLocal | null;
    if (local === null) return [];
    const config = emomConfig(ctx.spec);
    if (local.phase === "CLOSURE") {
      // Arrêt pendant la Clôture : la fenêtre déclarée prend la saisie de l'Arrêt s'il y en a une.
      const given = (payload ?? {}) as EmomDeclaration;
      const window = local.closing;
      const results: ResultChange[] = [];
      if (window !== null && typeof given.partialRepetitions === "number") {
        const next = declared(local, window, { toDeclare: false, partialRepetitions: given.partialRepetitions });
        results.push(windowResult(config, ctx, next.outcomes.find((candidate) => candidate.window === window)!, null));
      }
      return [...results, elementResult(config, ctx, local.outcomes, true)];
    }
    // Arrêt pendant une fenêtre : son issue à l'instant de l'appui (répétitions saisies ou durée tenue), puis l'élément.
    const outcome = outcomeNow(config, local, ctx, (payload ?? null) as EmomDeclaration | null);
    const stopped = { ...outcome, toDeclare: false };
    return [windowResult(config, ctx, stopped, local.workEndedMs), elementResult(config, ctx, [...local.outcomes, stopped], true)];
  },
};

/** Fenêtre dont le bandeau Q1 est à présenter : la précédente, non terminée, à déclarer, ni passée (T28). */
export function bannerWindow(config: EmomScopeConfig, local: EmomLocal): EmomWindowOutcome | null {
  if (local.phase !== "WORK" || local.window === 0) return null;
  const previous = config.windows[local.window - 1]!.number;
  const outcome = local.outcomes.find((candidate) => candidate.window === previous);
  return outcome !== undefined && outcome.toDeclare && !local.dismissed.includes(previous) ? outcome : null;
}
