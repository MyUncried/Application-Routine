/**
 * PRE-10 — **politiques de test** AMRAP et EMOM (conception consolidée §17, « Recommandation consolidée »).
 *
 * Elles reproduisent la sémantique réelle décidée (D1, D3, D5, Q1–Q5) pour éprouver les contrats du
 * noyau : échéance de bloc qui ferme une étape ou une récupération en cours, fenêtre non terminée puis
 * fenêtre suivante à l'heure, Clôture bloquante puis enchaînement automatique, rattrapage sous échéance
 * englobante, Circuit alterné consommant une fenêtre par membre en conservant le rang de chacun.
 *
 * **Ce ne sont pas les politiques métier de PRE-11** : ni interface, ni sons, ni règles complètes des
 * Formats (buy-in au résultat différé, bandeau Q1, incréments signés…). Elles ne sont pas raccordées à
 * l'application. Ce qu'elles démontrent est le contrat que les politiques PRE-11 utiliseront : un pilote
 * déclare ses références (DEADLINE, WINDOW), ouvre ses enfants et décide à leur clôture ou à l'échéance ;
 * le noyau mesure le temps, ferme les descendants, ordonne les simultanéités et déduplique.
 */

import type { ClosedChild, Pilot, PilotDecision } from "../kernel";
import type { LeafSpec, ScopeSpec } from "../plan";

const S = 1000;

export type TestMember = {
  readonly id: string;
  /** Travail chronométré (ms) ou `null` pour un travail confirmé par Suivant. */
  readonly workMs: number | null;
  /** Objectif de départ et incrément par tour (répétitions), lus par la politique (non par le noyau). */
  readonly target?: number;
  readonly increment?: number;
  /** Récupération de l'Exercice, dans le temps du bloc (AMRAP) ; absente ou 0 : aucune. */
  readonly recoveryMs?: number;
};

// ————————————————————————————————————————————————————————————————— AMRAP

export type TestAmrapConfig = {
  readonly blocks: number;
  readonly blockMs: number;
  readonly restBetweenBlocksMs: number;
  /** Buy-in consommé une seule fois, au début du premier bloc (§12.1). */
  readonly buyIn?: TestMember;
  readonly members: readonly TestMember[];
};

type AmrapLocal = {
  readonly block: number;
  readonly phase: "BUY_IN" | "LOOP" | "CLOSURE" | "REST";
  /** Rang du tour courant (1..) ; tours complets = round − 1. */
  readonly round: number;
  readonly member: number;
  readonly inRecovery: boolean;
  /** Tours dont le dernier membre a terminé son travail (sa récupération éventuelle n'en fait pas partie). */
  readonly completedRounds: number;
};

export const TEST_AMRAP = "TEST_AMRAP";

function amrapConfig(spec: ScopeSpec): TestAmrapConfig {
  return spec.config as TestAmrapConfig;
}

function memberLeaf(scopeKey: string, local: AmrapLocal, member: TestMember, buyIn: boolean): LeafSpec {
  const target = member.target === undefined ? undefined : member.target + (member.increment ?? 0) * (local.round - 1);
  return {
    kind: "ACTIVITY",
    key: buyIn ? `${scopeKey}/b${local.block}/buy-in/${member.id}` : `${scopeKey}/b${local.block}/r${local.round}/${member.id}`,
    end: member.workMs === null ? "MANUAL" : "TIMED",
    plannedMs: member.workMs,
    contribution: member.workMs === null ? "omitted" : "exact",
    exerciseId: member.id,
    occurrenceKey: `${scopeKey}/b${local.block}/r${local.round}`,
    series: local.round,
    ...(target !== undefined ? { target: { kind: "NUMBER", value: target } } : {}),
  };
}

function amrapChild(scopeKey: string, config: TestAmrapConfig, local: AmrapLocal): PilotDecision["next"] {
  if (local.phase === "BUY_IN") return { type: "CHILD", child: { type: "LEAF", leaf: memberLeaf(scopeKey, local, config.buyIn!, true) } };
  const member = config.members[local.member]!;
  if (local.inRecovery) {
    return {
      type: "CHILD",
      child: { type: "LEAF", leaf: { kind: "POST_ACTIVITY_RECOVERY", key: `${scopeKey}/b${local.block}/r${local.round}/${member.id}/recovery`, end: "TIMED", plannedMs: member.recoveryMs!, contribution: "exact", exerciseId: member.id } },
    };
  }
  return { type: "CHILD", child: { type: "LEAF", leaf: memberLeaf(scopeKey, local, member, false) } };
}

/** Bloc AMRAP : échéance de bloc (DEADLINE), boucle sans nombre de tours prévu, Clôture bloquante (D1, D3). */
export const testAmrapPilot: Pilot = {
  open(spec, ctx) {
    const config = amrapConfig(spec);
    const local: AmrapLocal = { block: 1, phase: config.buyIn === undefined ? "LOOP" : "BUY_IN", round: 1, member: 0, inRecovery: false, completedRounds: 0 };
    return { local, openRefs: [{ name: "block", role: "DEADLINE", budgetMs: config.blockMs }], next: amrapChild(ctx.scopeKey, config, local) };
  },
  onChildClosed(raw, closed, ctx) {
    const config = amrapConfig(ctx.spec);
    const local = raw as AmrapLocal;
    switch (local.phase) {
      case "BUY_IN": {
        const next: AmrapLocal = { ...local, phase: "LOOP" };
        return { local: next, next: amrapChild(ctx.scopeKey, config, next) };
      }
      case "LOOP": {
        const member = config.members[local.member]!;
        const roundDone = !local.inRecovery && local.member === config.members.length - 1 ? { completedRounds: local.round } : {};
        let next: AmrapLocal;
        if (!local.inRecovery && (member.recoveryMs ?? 0) > 0) {
          next = { ...local, ...roundDone, inRecovery: true };
        } else if (local.member + 1 < config.members.length) {
          next = { ...local, member: local.member + 1, inRecovery: false };
        } else {
          next = { ...local, ...roundDone, round: local.round + 1, member: 0, inRecovery: false };
        }
        return { local: next, next: amrapChild(ctx.scopeKey, config, next) };
      }
      case "CLOSURE": {
        const result = {
          block: local.block,
          completedRounds: local.completedRounds,
          partialRepetitions: (closed.contribution as { partialRepetitions?: number } | undefined)?.partialRepetitions ?? null,
          closedAtMs: ctx.nowMs,
        };
        const results = [{ type: "SCOPE" as const, key: `${ctx.scopeKey}/b${local.block}`, result }];
        if (local.block < config.blocks) {
          const next: AmrapLocal = { ...local, phase: "REST" };
          return {
            local: next,
            results,
            next: { type: "CHILD", child: { type: "LEAF", leaf: { kind: "BLOCK_REST", key: `${ctx.scopeKey}/b${local.block}/rest`, end: "TIMED", plannedMs: config.restBetweenBlocksMs, contribution: "exact" } } },
          };
        }
        return { local, results, next: { type: "CLOSE", contribution: result } };
      }
      case "REST": {
        // Bloc suivant : objectifs et incréments réinitialisés, sans buy-in (§12.1).
        const next: AmrapLocal = { block: local.block + 1, phase: "LOOP", round: 1, member: 0, inRecovery: false, completedRounds: 0 };
        return { local: next, openRefs: [{ name: "block", role: "DEADLINE", budgetMs: config.blockMs }], next: amrapChild(ctx.scopeKey, config, next) };
      }
      default: {
        const unreachable: never = local.phase;
        return unreachable;
      }
    }
  },
  onReference(raw, refName, ctx) {
    const local = raw as AmrapLocal;
    if (refName !== "block") return { local, next: { type: "IDLE" } };
    // D1 : le bloc s'arrête net ; tours complets calculés ; répétitions du tour entamé saisies à la Clôture.
    const next: AmrapLocal = { ...local, phase: "CLOSURE" };
    return {
      local: next,
      next: { type: "CHILD", child: { type: "LEAF", leaf: { kind: "CLOSURE", key: `${ctx.scopeKey}/b${local.block}/closure`, end: "INTERACTION", plannedMs: null, contribution: "omitted" } } },
    };
  },
  allows(_local, command) {
    // Q2 : Réinitialiser désactivé dans un AMRAP ; Q3 : Suivant autorisé pendant la récupération.
    return command !== "RESET";
  },
};

export function amrapScope(key: string, config: TestAmrapConfig): ScopeSpec {
  return { pilot: TEST_AMRAP, key, config };
}

// ————————————————————————————————————————————————————————————————— EMOM

export type TestEmomConfig = {
  readonly windowMs: number;
  /** Nombre de fenêtres par membre (alterné) ou de fenêtres communes (dans chaque intervalle). */
  readonly windows: number;
  readonly organization: "ALTERNATED" | "EACH_INTERVAL";
  readonly members: readonly TestMember[];
};

type EmomLocal = {
  /** Unité courante (fenêtre), 0..units−1. */
  readonly unit: number;
  /** Membre courant dans une fenêtre commune (dans chaque intervalle). */
  readonly member: number;
  /** Rang (fenêtre) atteint par chaque membre (alterné) : conservé entre deux passages. */
  readonly ranks: Readonly<Record<string, number>>;
  readonly workDone: boolean;
};

export type EmomWindowResult = { readonly window: number; readonly member: string | null; readonly rank: number; readonly terminated: boolean; readonly endedAtMs: number };

export const TEST_EMOM = "TEST_EMOM";

function emomUnits(config: TestEmomConfig): number {
  return config.organization === "ALTERNATED" ? config.windows * config.members.length : config.windows;
}

function emomUnitMember(config: TestEmomConfig, local: EmomLocal): TestMember {
  return config.organization === "ALTERNATED" ? config.members[local.unit % config.members.length]! : config.members[local.member]!;
}

function emomWork(scopeKey: string, config: TestEmomConfig, local: EmomLocal): PilotDecision["next"] {
  const member = emomUnitMember(config, local);
  const rank = config.organization === "ALTERNATED" ? local.ranks[member.id]! : local.unit + 1;
  return {
    type: "CHILD",
    child: {
      type: "LEAF",
      leaf: {
        kind: "ACTIVITY",
        key: `${scopeKey}/f${local.unit + 1}/${member.id}#${rank}`,
        end: member.workMs === null ? "MANUAL" : "TIMED",
        plannedMs: member.workMs,
        contribution: member.workMs === null ? "omitted" : "exact",
        exerciseId: member.id,
        series: rank,
      },
    },
  };
}

function emomRest(scopeKey: string, local: EmomLocal): PilotDecision["next"] {
  // Repos résiduel : se termine avec la fenêtre, sans récupération ajoutée (§12.2).
  return { type: "CHILD", child: { type: "LEAF", leaf: { kind: "WINDOW_REST", key: `${scopeKey}/f${local.unit + 1}/rest`, end: "PARENT", plannedMs: null, contribution: "omitted" } } };
}

function startUnit(config: TestEmomConfig, local: EmomLocal, scopeKey: string): PilotDecision {
  const member = emomUnitMember(config, local);
  const ranks = config.organization === "ALTERNATED" ? { ...local.ranks, [member.id]: (local.ranks[member.id] ?? 0) + 1 } : local.ranks;
  const next: EmomLocal = { ...local, ranks, workDone: false };
  return { local: next, openRefs: [{ name: "window", role: "WINDOW", budgetMs: config.windowMs }], next: emomWork(scopeKey, config, next) };
}

/** EMOM : fenêtre (WINDOW) indépendante de la fin du travail ; non terminée à l'échéance (D5) ; suivante à l'heure. */
export const testEmomPilot: Pilot = {
  open(spec, ctx) {
    const config = spec.config as TestEmomConfig;
    return startUnit(config, { unit: 0, member: 0, ranks: {}, workDone: false }, ctx.scopeKey);
  },
  onChildClosed(raw, closed: ClosedChild, ctx) {
    const config = ctx.spec.config as TestEmomConfig;
    const local = raw as EmomLocal;
    if (closed.leafKind !== "ACTIVITY") return { local, next: { type: "IDLE" } };
    if (config.organization === "EACH_INTERVAL" && local.member + 1 < config.members.length) {
      const next: EmomLocal = { ...local, member: local.member + 1 };
      return { local: next, next: emomWork(ctx.scopeKey, config, next) };
    }
    // Travail de la fenêtre terminé : la fenêtre continue, repos résiduel (T11 : aucune transition de fenêtre ici).
    const next: EmomLocal = { ...local, workDone: true };
    return { local: next, next: emomRest(ctx.scopeKey, next) };
  },
  onReference(raw, refName, ctx) {
    const config = ctx.spec.config as TestEmomConfig;
    const local = raw as EmomLocal;
    if (refName !== "window") return { local, next: { type: "IDLE" } };
    const member = config.organization === "ALTERNATED" ? emomUnitMember(config, local).id : null;
    const result: EmomWindowResult = {
      window: local.unit + 1,
      member,
      rank: member === null ? local.unit + 1 : local.ranks[member]!,
      terminated: local.workDone,
      endedAtMs: ctx.nowMs,
    };
    const results = [{ type: "SCOPE" as const, key: `${ctx.scopeKey}/f${local.unit + 1}`, result }];
    if (local.unit + 1 >= emomUnits(config)) return { local, results, next: { type: "CLOSE" } };
    // Fenêtre suivante à l'échéance prévue, sans repos inventé (D5).
    const decision = startUnit(config, { ...local, unit: local.unit + 1, member: 0 }, ctx.scopeKey);
    return { ...decision, results };
  },
  allows(_local, command) {
    return command !== "RESET";
  },
};

export function emomScope(key: string, config: TestEmomConfig): ScopeSpec {
  return { pilot: TEST_EMOM, key, config };
}

export const TEST_PILOTS = { [TEST_AMRAP]: testAmrapPilot, [TEST_EMOM]: testEmomPilot };

export const seconds = (value: number) => value * S;
