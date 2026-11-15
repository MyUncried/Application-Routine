/**
 * PRE-10.1 — prescription exécutable d'une Séance (conception consolidée du moteur, §5.2, §6, §7).
 *
 * Passage **prescription figée → prescription exécutable** : l'instantané (D.2, `createSessionSnapshot`)
 * est développé par D.1 (`expandStructure`), qui fixe l'ordre, les identités stables (`stepId`) et les
 * contextes Circuit/Cycle. Ce module ne refait pas ce parcours : il ajoute seulement ce que le moteur doit
 * chronométrer et que D.1 laisse dans le registre de l'Exercice (« les pauses de série restent dans le
 * registre ») — Pauses entre Séries, Pause entre les côtés, substitution de la dernière Pause par la
 * Récupération (ch09 « Plan d'exécution », D-248, `buildExecutionLedger`) — et la condition de fin typée
 * de chaque étape (§7 : fin automatique seulement en Durée chiffrée ; Répétitions et À l'échec : Suivant).
 *
 * Le moteur ne relit jamais la Séance ni le Catalogue : tout ce qui est affiché ou chronométré vient de
 * l'instantané (FMT-06, SU-07). La prescription de chaque Série est lue telle que la Composition l'a
 * transmise (décision de Hermann du 06/11/2026, confirmée le 07/11/2026 : aucune recopie de S1 vers
 * S2…Sn ; le moteur ne recopie ni ne complète aucune cible).
 *
 * Lancement : PRE-10 exécute les éléments libres et les préconfigurations standards (Tabata, 30/30,
 * Force, Superset, Progression, Jusqu'à l'échec : éléments libres, FMT-28). Un Format spécialisé
 * (EMOM, AMRAP, For time, Death by) rend la Séance non lançable dans PRE-10 (disponibilité lue dans le
 * descripteur D.3, distincte de la validité D.4) ; ses politiques relèvent de PRE-11.
 *
 * Fonctions pures, sans React ni SQLite.
 */

import { buildExecutionLedger, type LedgerEvent, type LedgerSide } from "@/domain/activities/executionCalculations";
import { seriesRowsOf, type ExecutionMode, type SeriesTarget, type WorkPhase } from "@/domain/activities/ExecutionParameters";
import { configurationValidity, engineAvailability, type ConfigurationIssue } from "@/domain/sessions/configurationValidity";
import { expandStructure, type PlanContext, type PlanStep } from "@/domain/sessions/planExpansion";
import type { SessionGuidance } from "@/domain/sessions/sessionGuidance";
import type { SessionSnapshot, SessionSnapshotExercise } from "@/domain/sessions/sessionSnapshot";
import { structureCircuits, structureExercises } from "@/domain/sessions/structure";

export const EXECUTABLE_PLAN_VERSION = 1 as const;

/** Phases d'exécution (ch12 §12.9, ch09) ; `BLOCK_REST`, `WINDOW_REST` et `CLOSURE` servent aux politiques à fenêtre/échéance. */
export type LeafKind =
  | "INITIAL_COUNTDOWN"
  | "ACTIVITY"
  | "SERIES_PAUSE"
  | "SIDE_RECOVERY"
  | "POST_ACTIVITY_RECOVERY"
  | "STOP_POINT"
  | "SESSION_END"
  | "BLOCK_REST"
  | "WINDOW_REST"
  | "CLOSURE";

/**
 * Condition de fin typée (§7) :
 * - `TIMED` : échéance automatique de l'étape (Durée chiffrée, pauses, récupérations, compte à rebours, Fin) ;
 * - `MANUAL` : Suivant (Répétitions, toute cible À l'échec) — une estimation éventuelle ne clôt rien ;
 * - `WAIT` : Point d'arrêt, attente d'une reprise explicite, sans référence temporelle de Format (D4) ;
 * - `PARENT` : se termine avec la référence de la portée englobante (repos résiduel d'une fenêtre EMOM) ;
 * - `INTERACTION` : Clôture bloquante d'un élément formaté (D3, §12.5).
 */
export type LeafEnd = "TIMED" | "MANUAL" | "WAIT" | "PARENT" | "INTERACTION";

/** Contribution prévisionnelle de durée (§7), distincte de la condition de fin. */
export type DurationContribution = "exact" | "estimated" | "lowerBound" | "omitted";

export type LeafContext = {
  readonly circuit: { readonly id: string; readonly tour: number; readonly count: number } | null;
  readonly cycle: { readonly id: string; readonly repetition: number; readonly count: number } | null;
};

export type LeafSpec = {
  readonly kind: LeafKind;
  /** Identité stable de l'étape (chemin d'occurrence, D.1 `stepId`, §6.1). */
  readonly key: string;
  readonly end: LeafEnd;
  /** Budget en ms d'une étape `TIMED` ; nominal (cadence, motif) d'une étape `MANUAL` ; sinon `null`. */
  readonly plannedMs: number | null;
  readonly contribution: DurationContribution;
  /** Exercice de l'instantané (étapes d'Exercice et récupérations qui le référencent). */
  readonly exerciseId?: string;
  /** Occurrence d'Exercice (Exercice × passage de Circuit × répétition de Cycle). */
  readonly occurrenceKey?: string;
  readonly series?: number | null;
  readonly seriesCount?: number;
  readonly side?: LedgerSide;
  /** Rang du côté dans l'ordre prescrit (1 ou 2, RM-243) ; absent sans changement de côté. */
  readonly sideRank?: 1 | 2;
  readonly mode?: ExecutionMode;
  readonly target?: SeriesTarget;
  /** Charge active de la Série (RM-241), en kg ; absente si la charge est inactive. */
  readonly loadKg?: number;
  /** Intervalle de cadence en ms (> 0) ; absent sans bip. */
  readonly cadenceMs?: number;
  readonly context?: LeafContext;
  /** Étape où recommence Réinitialiser (D-029, D-150, RM-062) : la même, ou la première Série du côté courant. */
  readonly resetToKey?: string;
};

export type ScopeSpec = { readonly pilot: string; readonly key: string; readonly config: unknown };
export type ChildSpec = { readonly type: "LEAF"; readonly leaf: LeafSpec } | { readonly type: "SCOPE"; readonly scope: ScopeSpec };

/** Données d'Exercice nécessaires à l'affichage, lues dans l'instantané (jamais dans la Séance courante). */
export type PlanExerciseInfo = {
  readonly id: string;
  readonly name: string;
  readonly categoryId: string | null;
  readonly mode: ExecutionMode | null;
  readonly bilateral: boolean;
  readonly workPhases: readonly WorkPhase[];
};

export type ExecutablePlan = {
  readonly planVersion: typeof EXECUTABLE_PLAN_VERSION;
  readonly sessionId: string;
  readonly sessionName: string;
  readonly items: readonly ChildSpec[];
  readonly exercises: Readonly<Record<string, PlanExerciseInfo>>;
  /** Fin de PRE-10 (spec `spec-guidage-reglages` §3.2) : guidage propre à la Séance ; absent = comme le Profil. État initial des interrupteurs Sons et Voix et de l'annonce de l'objectif. */
  readonly guidance?: SessionGuidance;
};

export type Launchability =
  | { readonly status: "launchable" }
  | { readonly status: "invalid"; readonly issues: readonly ConfigurationIssue[] }
  | { readonly status: "engine-unavailable"; readonly elementIds: readonly string[] };

/**
 * Lançabilité d'une Séance figée : validité de configuration (D.4) puis disponibilité du moteur par
 * élément (D.3). Les deux notions restent distinctes (D.4).
 */
export function launchabilityOf(snapshot: SessionSnapshot): Launchability {
  const validity = configurationValidity(snapshot.structure);
  if (validity.status === "invalid") {
    return { status: "invalid", issues: validity.issues };
  }
  const unavailable: string[] = [];
  for (const exercise of structureExercises(snapshot.structure)) {
    if (!engineAvailability(exercise.format)) unavailable.push(exercise.id);
  }
  for (const circuit of structureCircuits(snapshot.structure)) {
    if ((circuit.format ?? null) !== null && !engineAvailability(circuit.format)) unavailable.push(circuit.id);
  }
  return unavailable.length > 0 ? { status: "engine-unavailable", elementIds: unavailable } : { status: "launchable" };
}

const MS = 1000;

function leafContext(context: PlanContext): LeafContext {
  return { circuit: context.circuit, cycle: context.cycle };
}

type SeriesPlanStep = Extract<PlanStep, { kind: "SERIES" }>;

/** Base d'occurrence d'une étape SERIES de D.1 : `…/ex:<id>` (sans `/s<n>/<side>`). */
function occurrenceBaseOf(step: SeriesPlanStep): string {
  return step.stepId.replace(/\/s\d+\/(NONE|RIGHT|LEFT)$/, "");
}

/** Événements du registre restreints aux Séries/côtés joués par cette occurrence (D.1 choisit lesquels). */
function occurrenceEvents(exercise: SessionSnapshotExercise, played: readonly SeriesPlanStep[]): readonly LedgerEvent[] {
  const ledger = buildExecutionLedger(exercise.executionParameters, 0);
  const playedKey = new Set(played.map((step) => `${step.series ?? 0}/${step.side}`));
  const keptWork = (event: LedgerEvent) => event.kind === "WORK" && playedKey.has(`${event.series}/${event.side}`);
  const kept: LedgerEvent[] = [];
  ledger.forEach((event, index) => {
    switch (event.kind) {
      case "WORK":
        if (keptWork(event)) kept.push(event);
        break;
      case "SERIES_PAUSE":
        if (playedKey.has(`${event.series}/${event.side}`)) kept.push(event);
        break;
      case "SIDE_PAUSE": {
        // Entre les deux côtés : conservée si un travail joué la précède et la suit dans le registre.
        const before = ledger.slice(0, index).some(keptWork);
        const after = ledger.slice(index + 1).some(keptWork);
        if (before && after) kept.push(event);
        break;
      }
      case "RECOVERY":
        break;
      default: {
        const unreachable: never = event;
        return unreachable;
      }
    }
  });
  return kept;
}

function activityLeaf(
  exercise: SessionSnapshotExercise,
  step: SeriesPlanStep,
  work: Extract<LedgerEvent, { kind: "WORK" }> | undefined,
  occurrenceKey: string,
  resetToKey: string,
): LeafSpec {
  const parameters = exercise.executionParameters;
  const rows = seriesRowsOf(parameters);
  const series = step.series;
  const row = series === null ? undefined : rows[series - 1];
  const target = row?.target;
  const timed = parameters.mode === "DURATION" && target?.kind === "NUMBER";
  const nominalSeconds = work?.seconds ?? null;
  const cadence = parameters.mode !== null && parameters.cadenceBeepIntervalSeconds > 0 ? parameters.cadenceBeepIntervalSeconds * MS : undefined;
  const bilateral = step.side !== "NONE";
  const firstSide: LedgerSide | null = parameters.sideMode === "RIGHT_LEFT" ? "RIGHT" : parameters.sideMode === "LEFT_RIGHT" ? "LEFT" : null;
  return {
    kind: "ACTIVITY",
    key: step.stepId,
    end: timed ? "TIMED" : "MANUAL",
    plannedMs: nominalSeconds === null ? null : nominalSeconds * MS,
    contribution: timed ? "exact" : nominalSeconds !== null ? "estimated" : "omitted",
    exerciseId: exercise.id,
    occurrenceKey,
    series,
    seriesCount: rows.length,
    side: step.side,
    ...(bilateral ? { sideRank: step.side === firstSide ? 1 : 2 } : {}),
    ...(parameters.mode !== null ? { mode: parameters.mode } : {}),
    ...(target !== undefined ? { target } : {}),
    ...(parameters.loadEnabled && row !== undefined && row.loadKg > 0 ? { loadKg: row.loadKg } : {}),
    ...(cadence !== undefined ? { cadenceMs: cadence } : {}),
    context: leafContext(step.context),
    resetToKey,
  };
}

function timedLeaf(kind: LeafKind, key: string, seconds: number, extra: Partial<LeafSpec> = {}): LeafSpec {
  return { kind, key, end: "TIMED", plannedMs: seconds * MS, contribution: "exact", ...extra };
}

/**
 * Prescription exécutable d'une Séance lançable (voir l'en-tête). Une Séance non lançable (Format
 * spécialisé) lève : le lancement est contrôlé avant par `launchabilityOf`.
 */
export function compileExecutablePlan(snapshot: SessionSnapshot): ExecutablePlan {
  const launch = launchabilityOf(snapshot);
  if (launch.status !== "launchable") {
    throw new Error(`compileExecutablePlan: session not launchable in PRE-10 (${launch.status}).`);
  }
  const exercises = new Map<string, SessionSnapshotExercise>();
  for (const exercise of structureExercises(snapshot.structure)) exercises.set(exercise.id, exercise);

  const steps = expandStructure({
    structure: snapshot.structure,
    initialCountdownSeconds: snapshot.initialCountdownSeconds,
    finalPhaseSeconds: snapshot.finalPhaseSeconds,
  });

  const items: ChildSpec[] = [];
  const leaf = (spec: LeafSpec) => items.push({ type: "LEAF", leaf: spec });

  let index = 0;
  while (index < steps.length) {
    const step = steps[index]!;
    switch (step.kind) {
      case "COUNTDOWN":
        // Phase de 0 s instantanée (ch08 « Démarrage d'une séance ») : aucune étape.
        if (step.seconds > 0) leaf(timedLeaf("INITIAL_COUNTDOWN", step.stepId, step.seconds));
        index += 1;
        break;
      case "FINAL_PHASE":
        // Toujours présente : la clôture normale n'est persistée qu'à l'achèvement de SESSION_END (ch12 §12.9).
        leaf(timedLeaf("SESSION_END", step.stepId, step.seconds));
        index += 1;
        break;
      case "STOP_POINT":
        leaf({ kind: "STOP_POINT", key: step.stepId, end: "WAIT", plannedMs: null, contribution: "omitted", context: leafContext(step.context) });
        index += 1;
        break;
      case "RECOVERY": {
        // Récupération sans Série précédente dans le même groupe (repos de Circuit) : phase de récupération seule.
        leaf(timedLeaf("POST_ACTIVITY_RECOVERY", step.stepId, step.seconds, { exerciseId: step.exerciseId, context: leafContext(step.context) }));
        index += 1;
        break;
      }
      case "PROGRESSIVE_SEGMENT":
        // Exclu par `launchabilityOf` (AMRAP, Death by : PRE-11).
        throw new Error("compileExecutablePlan: progressive segments are not executable in PRE-10.");
      case "SERIES": {
        const base = occurrenceBaseOf(step);
        const group: SeriesPlanStep[] = [];
        while (index < steps.length) {
          const candidate = steps[index]!;
          if (candidate.kind !== "SERIES" || occurrenceBaseOf(candidate) !== base) break;
          group.push(candidate);
          index += 1;
        }
        const recoveryStep = steps[index];
        const recovery = recoveryStep?.kind === "RECOVERY" && recoveryStep.stepId === `${base}/recovery` ? recoveryStep : null;
        if (recovery !== null) index += 1;
        emitOccurrence(exercises.get(step.exerciseId)!, group, base, recovery, leaf);
        break;
      }
      default: {
        const unreachable: never = step;
        return unreachable;
      }
    }
  }

  const infos: Record<string, PlanExerciseInfo> = {};
  for (const [id, exercise] of exercises) {
    infos[id] = {
      id,
      name: exercise.exercise?.name ?? "",
      categoryId: exercise.exercise?.categoryId ?? null,
      mode: exercise.executionParameters.mode,
      bilateral: exercise.executionParameters.sideMode !== null && exercise.executionParameters.sideMode !== "UNILATERAL",
      workPhases: exercise.executionParameters.series.workPhases,
    };
  }
  return {
    planVersion: EXECUTABLE_PLAN_VERSION,
    sessionId: snapshot.sessionId,
    sessionName: snapshot.name,
    items,
    exercises: infos,
    ...(snapshot.guidance !== undefined ? { guidance: snapshot.guidance } : {}),
  };
}

/**
 * Une occurrence : Séries et côtés joués (D.1), Pauses du registre, substitution terminale par la
 * Récupération positive (ch09, D-248). Une phase de 0 s n'est pas produite (aucun poids, instantanée).
 */
function emitOccurrence(
  exercise: SessionSnapshotExercise,
  group: readonly SeriesPlanStep[],
  base: string,
  recovery: Extract<PlanStep, { kind: "RECOVERY" }> | null,
  leaf: (spec: LeafSpec) => void,
): void {
  const events = occurrenceEvents(exercise, group);
  const context = leafContext(group[0]!.context);
  const bySideOrder = exercise.executionParameters.sideOrder === "BY_SIDE";
  // Réinitialiser (D-029, D-150) : en bilatéral côté par côté, la première Série du côté courant ; sinon la Série elle-même.
  const firstOfSide = new Map<LedgerSide, string>();
  for (const step of group) if (!firstOfSide.has(step.side)) firstOfSide.set(step.side, step.stepId);
  const resetTo = (step: SeriesPlanStep) => (step.side !== "NONE" && bySideOrder ? firstOfSide.get(step.side)! : step.stepId);

  const lastIndex = events.length - 1;
  let groupIndex = 0;
  events.forEach((event, position) => {
    switch (event.kind) {
      case "WORK": {
        const step = group[groupIndex]!;
        groupIndex += 1;
        leaf(activityLeaf(exercise, step, event, base, resetTo(step)));
        break;
      }
      case "SERIES_PAUSE":
        // Substitution de la seule Pause terminale par la Récupération positive (D-248).
        if (position === lastIndex && recovery !== null) break;
        if (event.seconds > 0) {
          leaf(timedLeaf("SERIES_PAUSE", `${base}/s${event.series}/${event.side}/pause`, event.seconds, { exerciseId: exercise.id, occurrenceKey: base, series: event.series, context }));
        }
        break;
      case "SIDE_PAUSE":
        if (event.seconds > 0) {
          leaf(timedLeaf("SIDE_RECOVERY", `${base}/side-pause${event.series === null ? "" : `/s${event.series}`}`, event.seconds, { exerciseId: exercise.id, occurrenceKey: base, context }));
        }
        break;
      case "RECOVERY":
        break;
      default: {
        const unreachable: never = event;
        return unreachable;
      }
    }
  });
  if (recovery !== null) {
    leaf(timedLeaf("POST_ACTIVITY_RECOVERY", recovery.stepId, recovery.seconds, { exerciseId: exercise.id, occurrenceKey: base, context }));
  }
}
