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
 * PRE-11 (T1, For time) : les étapes d'un élément For time (Exercice autonome, à chaque exécution ; Circuit
 * porteur, buy-in, tours et buy-out) sont regroupées dans une **portée** pilotée par `FOR_TIME`
 * (`policies/forTime.ts`) ; les phases qui suivent son dernier travail (récupération de l'Exercice) restent
 * après la portée : le temps réalisé s'arrête au dernier travail confirmé (§12.3).
 *
 * PRE-11 (T2, EMOM, 18/11/2026) : les Séries d'un élément EMOM forment une portée pilotée par `EMOM` (`policies/emom.ts`) — une
 * fenêtre par Série (Exercice) ou par tour (Circuit porteur « dans chaque intervalle »), ses côtés compris (Q5), terminée par son
 * repos (`WINDOW_REST`, fin avec la fenêtre) ; la Récupération qui suit le dernier travail reste après la portée.
 *
 * PRE-11 (T3, AMRAP, 18/11/2026) : chaque segment progressif AMRAP de D.1 (Exercice autonome, ou bloc k d'un Circuit porteur) devient
 * une portée pilotée par `AMRAP` (`policies/amrap.ts`) : buy-in (bloc 1 seulement) et étapes-modèles d'un tour de boucle, rejouées
 * à chaque tour par le pilote ; le repos entre les blocs reste l'étape de récupération que D.1 place entre deux segments.
 *
 * PRE-11 (T4, Death by, 18/11/2026) : chaque segment progressif Death by de D.1 (Exercice autonome — y compris À la suite et dans un
 * Circuit standard groupé, où il repart de son départ à chaque passage (FMT-34) — ou Circuit porteur « dans chaque intervalle » /
 * « en alternance ») devient une portée pilotée par `DEATH_BY` (`policies/deathBy.ts`) : étapes-modèles du rang 1 de chaque
 * membre, rejouées rang après rang par le pilote (régime ouvert, objectif = départ + incrément × (rang − 1)) ; la Récupération d'un
 * Exercice autonome (À la suite) suit la portée.
 *
 * Fonctions pures, sans React ni SQLite.
 */

import { buildExecutionLedger, type LedgerEvent, type LedgerSide } from "@/domain/activities/executionCalculations";
import { seriesRowsOf, type ExecutionMode, type SeriesTarget, type WorkPhase } from "@/domain/activities/ExecutionParameters";
import { configurationValidity, engineAvailability, type ConfigurationIssue } from "@/domain/sessions/configurationValidity";
import type { ElementFormat } from "@/domain/sessions/formats";
import { expandStructure, type PlanContext, type PlanStep } from "@/domain/sessions/planExpansion";
import type { SessionGuidance } from "@/domain/sessions/sessionGuidance";
import type { SessionSnapshot, SessionSnapshotExercise } from "@/domain/sessions/sessionSnapshot";
import { circuitRoleOf } from "@/domain/sessions/formats";
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
  /**
   * PRE-11 — décision de Hermann du 13/11/2026 (« Rôle « Tour » en For time : Aucun affichage de phase, aucun bip, aucune
   * annonce vocale de phase ») : Série d'un membre de Rôle Tour d'un Circuit For time, sans guidage des phases.
   */
  readonly phasesSilenced?: true;
  /**
   * PRE-11 (T2, EMOM) : étape d'une fenêtre EMOM (FMT-23 à FMT-25). Elle ne pèse rien dans la durée estimée ni dans la
   * progression : la fenêtre pèse par son repos (`WINDOW_REST`, durée de la fenêtre), qui se termine avec elle.
   */
  readonly inWindow?: true;
  /** PRE-11 (T2) : première étape d'une fenêtre EMOM — son départ est le début de la fenêtre (bip long, arbitrage du 18/11/2026). */
  readonly windowStart?: true;
  /**
   * PRE-11 (T3, AMRAP) : étape d'un bloc AMRAP (buy-in, étape-modèle de la boucle). Elle ne pèse rien dans la durée estimée ni dans
   * la progression : le bloc pèse par son étape de poids (`blockWeight`, durée du bloc), jamais ouverte.
   */
  readonly inBlock?: true;
  /** PRE-11 (T3) : étape de poids d'un bloc AMRAP (durée du bloc) — indexée pour la progression, jamais jouée ni listée. */
  readonly blockWeight?: true;
  /** PRE-11 (T3) : étape d'un tour de boucle AMRAP — clé de son étape-modèle (`…/loop/…`), indexée par la projection. */
  readonly loopOf?: string;
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
  // PRE-11 (T1) : étapes d'un élément For time en cours de regroupement (voir l'en-tête).
  const forTime = forTimeElements(snapshot);
  // PRE-11 (T2) : éléments EMOM (Exercice autonome, Circuit porteur « dans chaque intervalle »).
  const emom = emomElements(snapshot);
  let group: { readonly key: string; readonly element: ForTimeElement; readonly cycle: number | null; readonly tour: number | null; readonly items: ChildSpec[] } | null = null;
  let emomGroup: EmomGroup | null = null;
  const silenced = forTimeTourMembers(snapshot);
  const leaf = (raw: LeafSpec, window?: number) => {
    if (emomGroup !== null) {
      // D4 (02/11/2026) : aucun Point d'arrêt à l'intérieur d'un élément à fenêtre.
      if (raw.kind === "STOP_POINT") return;
      emomGroup.entries.push({ leaf: raw, window: window ?? emomGroup.entries[emomGroup.entries.length - 1]?.window ?? 1 });
      return;
    }
    // Recette du 17/11/2026 (Hermann : « Temps de repos supprimés en For time : Pause après chaque série. Pause de changement de
    // côté. Repos entre les tours. Repos entre les séries (mode « À la suite »). Récupération après un exercice. » ; « À
    // l'exécution, aucun décompte de repos ne s'intercale » ; « Les valeurs déjà saisies sont ignorées, sans être effacées ») :
    // dans un élément For time, aucune étape de repos n'est produite ; le second côté et l'exercice suivant enchaînent aussitôt.
    // [Pauses, changement de côté, repos entre les tours et Récupération joués dans le For time — remplacé.]
    if (group !== null && FOR_TIME_REST_KINDS.has(raw.kind)) return;
    const spec: LeafSpec = raw.kind === "ACTIVITY" && raw.exerciseId !== undefined && silenced.has(raw.exerciseId) ? { ...raw, phasesSilenced: true } : raw;
    (group === null ? items : group.items).push({ type: "LEAF", leaf: spec });
  };
  /** Élément EMOM en cours : `null` hors EMOM, sinon vrai pour un Circuit porteur (fenêtre = tour). */
  const emomCarried = (): boolean | null => (emomGroup === null ? null : emomGroup.element.kind === "CIRCUIT");
  const flushEmom = () => {
    if (emomGroup === null) return;
    const closing: EmomGroup = emomGroup;
    emomGroup = null;
    const built = emomScopeOf(closing);
    if (built.scope !== null) items.push({ type: "SCOPE", scope: built.scope });
    items.push(...built.after);
  };
  const flush = () => {
    flushEmom();
    if (group === null) return;
    const closing = group;
    group = null;
    let last = closing.items.length - 1;
    while (last >= 0 && !(closing.items[last]!.type === "LEAF" && (closing.items[last] as { leaf: LeafSpec }).leaf.kind === "ACTIVITY")) last -= 1;
    const work = closing.items.slice(0, last + 1);
    const after = closing.items.slice(last + 1);
    if (work.length > 0) {
      const first = work.find((item): item is { type: "LEAF"; leaf: LeafSpec } => item.type === "LEAF");
      const config: ForTimeScopeConfig = {
        format: "FOR_TIME",
        elementId: closing.element.id,
        elementKind: closing.element.kind,
        name: closing.element.name,
        capMs: closing.element.capSeconds === null ? null : closing.element.capSeconds * MS,
        items: work,
        context: first?.leaf.context ?? null,
      };
      items.push({ type: "SCOPE", scope: { pilot: "FOR_TIME", key: closing.key, config } });
    }
    items.push(...after);
  };
  const enter = (context: PlanContext | null) => {
    const emomElement = context === null || context.formattedElementId === null ? undefined : emom.get(context.formattedElementId);
    if (emomElement !== undefined && context !== null) {
      const cycle = context.cycle?.repetition ?? null;
      // Exercice EMOM membre d'un Circuit standard : rejoué à chaque tour (une portée par tour, comme le For time).
      const tour = emomElement.kind === "EXERCISE" ? (context.circuit?.tour ?? null) : null;
      if (emomGroup !== null && emomGroup.element.id === emomElement.id && emomGroup.cycle === cycle && emomGroup.tour === tour) return;
      flush();
      const key = `session/emom:${emomElement.id}${cycle === null ? "" : `#c${cycle}`}${tour === null ? "" : `#t${tour}`}`;
      emomGroup = { key, element: emomElement, cycle, tour, entries: [] };
      return;
    }
    const element = context === null || context.formattedElementId === null ? undefined : forTime.get(context.formattedElementId);
    if (element === undefined || context === null) {
      flush();
      return;
    }
    const cycle = context.cycle?.repetition ?? null;
    // Un Exercice For time autonome dans un Circuit standard est rejoué à chaque tour (FMT-30) : une portée par tour.
    const tour = element.kind === "EXERCISE" ? (context.circuit?.tour ?? null) : null;
    if (group !== null && group.element.id === element.id && group.cycle === cycle && group.tour === tour) return;
    flush();
    const key = `session/for-time:${element.id}${cycle === null ? "" : `#c${cycle}`}${tour === null ? "" : `#t${tour}`}`;
    group = { key, element, cycle, tour, items: [] };
  };

  let index = 0;
  while (index < steps.length) {
    const step = steps[index]!;
    enter("context" in step ? step.context : null);
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
        // PRE-11 (T3) : segment AMRAP — une portée par bloc (Exercice autonome, ou bloc d'un Circuit porteur).
        // PRE-11 (T4) : segment Death by — une portée par exécution (Exercice autonome, ou Circuit porteur), sa Récupération ensuite.
        // [Death by exclu par `launchabilityOf` — remplacé le 18/11/2026.]
        flush();
        if (step.format.key === "DEATH_BY") {
          const built = deathByScopeOf(step, exercises, snapshot);
          items.push({ type: "SCOPE", scope: built.scope }, ...built.after);
        } else {
          items.push({ type: "SCOPE", scope: amrapScopeOf(step, exercises, snapshot) });
        }
        index += 1;
        break;
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
        const windowed = emomCarried();
        if (windowed !== null) emitEmomOccurrence(exercises.get(step.exerciseId)!, group, base, recovery, windowed, leaf);
        else emitOccurrence(exercises.get(step.exerciseId)!, group, base, recovery, leaf);
        break;
      }
      default: {
        const unreachable: never = step;
        return unreachable;
      }
    }
  }
  flush();

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

// ————————————————————————————————————————————————————————————————— EMOM (PRE-11, T2)

type EmomElement = { readonly id: string; readonly kind: "EXERCISE" | "CIRCUIT"; readonly name: string; readonly windowMs: number };
type EmomGroup = {
  readonly key: string;
  readonly element: EmomElement;
  readonly cycle: number | null;
  readonly tour: number | null;
  readonly entries: { readonly leaf: LeafSpec; readonly window: number }[];
};

/** Fenêtre d'un élément EMOM : étapes `items[start, end)`, la dernière étant son repos (`WINDOW_REST`). */
export type EmomWindowSpec = { readonly number: number; readonly start: number; readonly end: number };

/** Configuration de la portée EMOM (lue par `policies/emom.ts`). */
export type EmomScopeConfig = {
  readonly format: "EMOM";
  readonly elementId: string;
  readonly elementKind: "EXERCISE" | "CIRCUIT";
  readonly name: string;
  /** Durée de chaque fenêtre (Intervalle de l'Exercice, ou intervalle commun du Circuit porteur), en ms. */
  readonly windowMs: number;
  readonly windows: readonly EmomWindowSpec[];
  readonly items: readonly ChildSpec[];
  readonly context: LeafContext | null;
};

/** Éléments EMOM de l'instantané : Exercices formatés (autonomes, À la suite, en alternance) et Circuits porteurs. */
function emomElements(snapshot: SessionSnapshot): ReadonlyMap<string, EmomElement> {
  const elements = new Map<string, EmomElement>();
  const seconds = (value: unknown) => (typeof value === "number" && value > 0 ? value : 60);
  const carriers = new Set<string>();
  for (const circuit of structureCircuits(snapshot.structure)) {
    const format = circuit.format ?? null;
    if (format?.key !== "EMOM") continue;
    elements.set(circuit.id, { id: circuit.id, kind: "CIRCUIT", name: circuit.name ?? "EMOM", windowMs: seconds(format.settings.windowSeconds) * MS });
    for (const member of circuit.exercises) carriers.add(member.id);
  }
  for (const exercise of structureExercises(snapshot.structure)) {
    const format = exercise.format ?? null;
    if (format?.key !== "EMOM" || carriers.has(exercise.id)) continue;
    elements.set(exercise.id, { id: exercise.id, kind: "EXERCISE", name: exercise.exercise?.name ?? "", windowMs: seconds(format.settings.intervalSeconds) * MS });
  }
  return elements;
}

/**
 * Une occurrence d'Exercice dans un EMOM (FMT-20, FMT-21, Q5) : la Série k est jouée dans la fenêtre k (Exercice autonome) ou dans
 * la fenêtre du tour (Circuit porteur, « dans chaque intervalle ») ; ses deux côtés consomment la même fenêtre, avec la pause entre
 * les côtés s'il y en a une (Q5 ; FMT-20 : « deux côtés et pause entre côtés applicable »). Aucune Pause entre Séries (l'Intervalle
 * la remplace, référence Formats §10). La Récupération éventuelle suit la dernière Série (après la portée si elle termine l'élément).
 */
function emitEmomOccurrence(
  exercise: SessionSnapshotExercise,
  group: readonly SeriesPlanStep[],
  base: string,
  recovery: Extract<PlanStep, { kind: "RECOVERY" }> | null,
  carried: boolean,
  leaf: (spec: LeafSpec, window?: number) => void,
): void {
  const ledger = buildExecutionLedger(exercise.executionParameters, 0);
  const sidePause = ledger.find((event) => event.kind === "SIDE_PAUSE")?.seconds ?? 0;
  const workOf = (step: SeriesPlanStep) =>
    ledger.find((event): event is Extract<LedgerEvent, { kind: "WORK" }> => event.kind === "WORK" && event.series === step.series && event.side === step.side);
  const series = [...new Set(group.map((step) => step.series ?? 0))].sort((a, b) => a - b);
  let lastWindow = 1;
  for (const rank of series) {
    const steps = group.filter((step) => (step.series ?? 0) === rank);
    const window = carried ? (steps[0]!.context.circuit?.tour ?? rank) : rank;
    lastWindow = window;
    steps.forEach((step, position) => {
      const spec = activityLeaf(exercise, step, workOf(step), base, step.stepId);
      const { resetToKey: _reset, ...played } = spec;
      if (position > 0 && sidePause > 0) {
        leaf(timedLeaf("SIDE_RECOVERY", `${base}/s${rank}/side-pause`, sidePause, { exerciseId: exercise.id, occurrenceKey: base, context: leafContext(step.context) }), window);
      }
      leaf(played, window);
    });
  }
  if (recovery !== null && recovery.seconds > 0) {
    leaf(timedLeaf("POST_ACTIVITY_RECOVERY", recovery.stepId, recovery.seconds, { exerciseId: exercise.id, occurrenceKey: base, context: leafContext(group[0]!.context) }), lastWindow);
  }
}

/**
 * Portée d'un élément EMOM : fenêtres dans l'ordre de leur rang, chacune terminée par son repos (`WINDOW_REST`, fin avec la
 * fenêtre : FMT-25, aucun repos ajouté au calcul) ; les étapes qui suivent le dernier travail (Récupération de l'Exercice, À la
 * suite) restent après la portée, jouées après l'échéance de la dernière fenêtre (FMT-21 : « E×N×W et récupérations configurées »).
 */
function emomScopeOf(group: EmomGroup): { readonly scope: ScopeSpec | null; readonly after: readonly ChildSpec[] } {
  let last = group.entries.length - 1;
  while (last >= 0 && group.entries[last]!.leaf.kind !== "ACTIVITY") last -= 1;
  const work = group.entries.slice(0, last + 1);
  const after = group.entries.slice(last + 1).map((entry): ChildSpec => ({ type: "LEAF", leaf: entry.leaf }));
  if (work.length === 0) return { scope: null, after };
  const order: number[] = [];
  for (const entry of work) if (!order.includes(entry.window)) order.push(entry.window);
  const items: ChildSpec[] = [];
  const windows: EmomWindowSpec[] = [];
  for (const number of order) {
    const start = items.length;
    const inWindow = work.filter((entry) => entry.window === number).map((entry) => entry.leaf);
    inWindow.forEach((spec, position) => items.push({ type: "LEAF", leaf: { ...spec, inWindow: true, ...(position === 0 ? { windowStart: true as const } : {}) } }));
    const lastActivity = [...inWindow].reverse().find((spec) => spec.kind === "ACTIVITY") ?? inWindow[inWindow.length - 1]!;
    items.push({
      type: "LEAF",
      leaf: {
        kind: "WINDOW_REST",
        key: `${group.key}/f${number}/rest`,
        end: "PARENT",
        plannedMs: group.element.windowMs,
        contribution: "exact",
        ...(lastActivity.exerciseId !== undefined ? { exerciseId: lastActivity.exerciseId } : {}),
        ...(lastActivity.occurrenceKey !== undefined ? { occurrenceKey: lastActivity.occurrenceKey } : {}),
        ...(lastActivity.series !== undefined ? { series: lastActivity.series } : {}),
        ...(lastActivity.seriesCount !== undefined ? { seriesCount: lastActivity.seriesCount } : {}),
        ...(lastActivity.context !== undefined ? { context: lastActivity.context } : {}),
      },
    });
    windows.push({ number, start, end: items.length });
  }
  const first = work[0]!.leaf;
  const config: EmomScopeConfig = {
    format: "EMOM",
    elementId: group.element.id,
    elementKind: group.element.kind,
    name: group.element.name,
    windowMs: group.element.windowMs,
    windows,
    items,
    context: first.context ?? null,
  };
  return { scope: { pilot: "EMOM", key: group.key, config }, after };
}

// ————————————————————————————————————————————————————————————————— AMRAP (PRE-11, T3)

/** Étape-modèle de la boucle d'un AMRAP : jouée à chaque tour, objectif recalculé par l'incrément signé (plancher 1). */
export type AmrapLoopItem = { readonly leaf: LeafSpec; readonly increment: number };

/** Configuration de la portée d'un bloc AMRAP (lue par `policies/amrap.ts`). */
export type AmrapScopeConfig = {
  readonly format: "AMRAP";
  readonly elementId: string;
  readonly elementKind: "EXERCISE" | "CIRCUIT";
  readonly name: string;
  /** Durée du bloc (Durée de l'Exercice autonome, ou Durée de chaque bloc du Circuit porteur), en ms. */
  readonly blockMs: number;
  readonly block: number;
  readonly blocks: number;
  /** Étapes du buy-in, jouées une fois au début du premier bloc (T13) ; vide dans les blocs suivants. */
  readonly buyIn: readonly LeafSpec[];
  /** Étapes-modèles d'un tour de boucle (clés `…/loop/…`), dans l'ordre des membres de Rôle Tour. */
  readonly loop: readonly AmrapLoopItem[];
  /** Étapes indexées par la projection : buy-in, modèle du tour, poids du bloc (`blockWeight`). */
  readonly items: readonly ChildSpec[];
  readonly context: LeafContext | null;
};

type ProgressiveStep = Extract<PlanStep, { kind: "PROGRESSIVE_SEGMENT" }>;

/** Étapes d'un passage d'un membre AMRAP : Séries et côtés de son registre, pauses, Récupération (T14 : à chaque tour). */
function amrapMemberLeaves(exercise: SessionSnapshotExercise, base: string, context: PlanContext): LeafSpec[] {
  const ledger = buildExecutionLedger(exercise.executionParameters, 0);
  const group: SeriesPlanStep[] = ledger.flatMap((event): SeriesPlanStep[] =>
    event.kind === "WORK" ? [{ kind: "SERIES", stepId: `${base}/s${event.series}/${event.side}`, exerciseId: exercise.id, series: event.series, side: event.side, context }] : [],
  );
  if (group.length === 0) return [];
  const seconds = exercise.postActivityRecoverySeconds ?? 0;
  const recovery = seconds > 0 ? { kind: "RECOVERY" as const, stepId: `${base}/recovery`, exerciseId: exercise.id, seconds, context } : null;
  const leaves: LeafSpec[] = [];
  emitOccurrence(exercise, group, base, recovery, (spec) => leaves.push(spec));
  return leaves;
}

/** Portée d'un bloc AMRAP (voir l'en-tête et `policies/amrap.ts`). */
function amrapScopeOf(step: ProgressiveStep, exercises: ReadonlyMap<string, SessionSnapshotExercise>, snapshot: SessionSnapshot): ScopeSpec {
  const key = `${step.stepId}/amrap`;
  // Étapes sans Circuit affiché : le tour de boucle est porté par le pilote (contexte du tour, compte ouvert).
  const planContext: PlanContext = { cycle: step.context.cycle, circuit: null, formattedElementId: step.elementId };
  const settings = step.format.settings;
  const seconds = (value: unknown) => (typeof value === "number" && value > 0 ? value : 12 * 60);
  const incrementOf = (format: ElementFormat | null | undefined) => {
    const value = format?.settings.incrementPerRound;
    return typeof value === "number" ? value : 0;
  };
  type Member = { readonly exercise: SessionSnapshotExercise; readonly role: string; readonly increment: number };
  let members: Member[];
  let blockMs: number;
  let name: string;
  let block = 1;
  let blocks = 1;
  if (step.elementKind === "CIRCUIT") {
    const circuit = structureCircuits(snapshot.structure).find((candidate) => candidate.id === step.elementId);
    members = (circuit?.exercises ?? []).flatMap((member, position) => {
      const exercise = exercises.get(member.id);
      return exercise === undefined ? [] : [{ exercise, role: circuitRoleOf(member.format, position), increment: incrementOf(member.format) }];
    });
    blockMs = seconds(settings.blockSeconds) * MS;
    name = circuit?.name ?? "AMRAP";
    block = step.block ?? 1;
    blocks = step.context.circuit?.count ?? 1;
  } else {
    const exercise = exercises.get(step.elementId)!;
    members = [{ exercise, role: "TOUR", increment: incrementOf(exercise.format) }];
    blockMs = seconds(settings.durationSeconds) * MS;
    name = exercise.exercise?.name ?? "AMRAP";
  }
  // T13 : le buy-in est consommé une seule fois, dans le premier bloc. FMT-26 : aucun incrément pour le buy-in ni pour À l'échec.
  const buyIn = block === 1 ? members.filter((member) => member.role === "BUY_IN").flatMap((member) => amrapMemberLeaves(member.exercise, `${key}/buy-in/ex:${member.exercise.id}`, planContext)) : [];
  const loop = members
    .filter((member) => member.role !== "BUY_IN")
    .flatMap((member) =>
      amrapMemberLeaves(member.exercise, `${key}/loop/ex:${member.exercise.id}`, planContext).map(
        (leaf): AmrapLoopItem => ({ leaf, increment: leaf.kind === "ACTIVITY" && leaf.target !== undefined && leaf.target.kind === "NUMBER" ? member.increment : 0 }),
      ),
    );
  const context: LeafContext = { circuit: null, cycle: step.context.cycle };
  const weight: LeafSpec = { kind: "BLOCK_REST", key: `${key}/block`, end: "PARENT", plannedMs: blockMs, contribution: "exact", blockWeight: true, context };
  const items: ChildSpec[] = [
    ...buyIn.map((leaf): ChildSpec => ({ type: "LEAF", leaf: { ...leaf, inBlock: true } })),
    ...loop.map((item): ChildSpec => ({ type: "LEAF", leaf: { ...item.leaf, inBlock: true } })),
    { type: "LEAF", leaf: weight },
  ];
  const config: AmrapScopeConfig = { format: "AMRAP", elementId: step.elementId, elementKind: step.elementKind, name, blockMs, block, blocks, buyIn, loop, items, context };
  return { pilot: "AMRAP", key, config };
}

// ————————————————————————————————————————————————————————————————— Death by (PRE-11, T4)

/** Membre d'une fenêtre Death by : étapes-modèles du rang 1 (Série 1, ses côtés et la pause entre eux) et incrément par rang. */
export type DeathByMemberSpec = { readonly exerciseId: string; readonly increment: number; readonly leaves: readonly LeafSpec[] };

/**
 * Fenêtre d'un rang : intervalle commun et membres joués dans l'ordre (Exercice autonome, ou Circuit « dans chaque intervalle ») ;
 * en alternance, une fenêtre par membre, d'intervalle propre (T17 : A à 60 s puis B à 90 s à chaque rang).
 */
export type DeathBySlotSpec = { readonly windowMs: number; readonly members: readonly DeathByMemberSpec[] };

/** Configuration de la portée Death by (lue par `policies/deathBy.ts`). */
export type DeathByScopeConfig = {
  readonly format: "DEATH_BY";
  readonly key: string;
  readonly elementId: string;
  readonly elementKind: "EXERCISE" | "CIRCUIT";
  readonly name: string;
  /** Fenêtres de chaque rang, dans l'ordre. */
  readonly slots: readonly DeathBySlotSpec[];
  /** Étapes indexées par la projection : étapes-modèles (`…/model/…`) et poids de l'élément (durée inconnue, régime ouvert). */
  readonly items: readonly ChildSpec[];
  readonly context: LeafContext | null;
};

/** Étapes-modèles d'un membre Death by : sa Série 1 (côtés compris) et la pause entre les côtés ; ni pause de série ni Récupération. */
function deathByMemberLeaves(exercise: SessionSnapshotExercise, base: string, context: PlanContext): LeafSpec[] {
  const ledger = buildExecutionLedger(exercise.executionParameters, 0);
  const first = ledger.find((event): event is Extract<LedgerEvent, { kind: "WORK" }> => event.kind === "WORK")?.series ?? null;
  const group: SeriesPlanStep[] = ledger.flatMap((event): SeriesPlanStep[] =>
    event.kind === "WORK" && event.series === first ? [{ kind: "SERIES", stepId: `${base}/s${event.series}/${event.side}`, exerciseId: exercise.id, series: event.series, side: event.side, context }] : [],
  );
  if (group.length === 0) return [];
  const leaves: LeafSpec[] = [];
  emitOccurrence(exercise, group, base, null, (spec) => {
    if (spec.kind === "ACTIVITY" || spec.kind === "SIDE_RECOVERY") leaves.push(spec);
  });
  return leaves;
}

/** Portée d'un segment Death by (voir l'en-tête et `policies/deathBy.ts`), et la Récupération d'un Exercice autonome qui la suit. */
function deathByScopeOf(
  step: ProgressiveStep,
  exercises: ReadonlyMap<string, SessionSnapshotExercise>,
  snapshot: SessionSnapshot,
): { readonly scope: ScopeSpec; readonly after: readonly ChildSpec[] } {
  const key = `${step.stepId}/death-by`;
  const planContext: PlanContext = { cycle: step.context.cycle, circuit: null, formattedElementId: step.elementId };
  const seconds = (value: unknown) => (typeof value === "number" && value > 0 ? value : 60);
  const incrementOf = (format: ElementFormat | null | undefined) => {
    const value = format?.settings.incrementPerRound;
    return typeof value === "number" && value > 0 ? value : 1;
  };
  const memberOf = (exercise: SessionSnapshotExercise, increment: number): DeathByMemberSpec => ({
    exerciseId: exercise.id,
    increment,
    leaves: deathByMemberLeaves(exercise, `${key}/model/ex:${exercise.id}`, planContext),
  });
  let slots: DeathBySlotSpec[];
  let name: string;
  const after: ChildSpec[] = [];
  if (step.elementKind === "CIRCUIT") {
    const circuit = structureCircuits(snapshot.structure).find((candidate) => candidate.id === step.elementId);
    const members = (circuit?.exercises ?? []).flatMap((member) => {
      const exercise = exercises.get(member.id);
      return exercise === undefined ? [] : [{ exercise, format: member.format ?? null }];
    });
    name = circuit?.name ?? "Death by";
    if (circuit?.nature === "SERIES") {
      // En alternance (FMT-34, T17) : intervalle propre à chaque membre, fenêtres successives à chaque rang.
      slots = members.map(({ exercise, format }) => ({ windowMs: seconds(format?.settings.intervalSeconds) * MS, members: [memberOf(exercise, incrementOf(format))] }));
    } else {
      // Dans chaque intervalle : intervalle commun, membres joués l'un après l'autre dans la même fenêtre.
      slots = [{ windowMs: seconds(step.format.settings.windowSeconds) * MS, members: members.map(({ exercise, format }) => memberOf(exercise, incrementOf(format))) }];
    }
  } else {
    const exercise = exercises.get(step.elementId)!;
    name = exercise.exercise?.name ?? "Death by";
    slots = [{ windowMs: seconds(step.format.settings.intervalSeconds) * MS, members: [memberOf(exercise, incrementOf(exercise.format))] }];
    // FMT-34 « À la suite : Exercices indépendants et récupération configurée entre eux » : la Récupération suit la portée.
    const recovery = exercise.postActivityRecoverySeconds ?? 0;
    if (recovery > 0) {
      after.push({ type: "LEAF", leaf: timedLeaf("POST_ACTIVITY_RECOVERY", `${step.stepId}/recovery`, recovery, { exerciseId: exercise.id, context: leafContext(step.context) }) });
    }
  }
  const context: LeafContext = { circuit: null, cycle: step.context.cycle };
  // Poids de l'élément : durée inconnue (régime ouvert) — jamais jouée ni listée ; l'estimation de la Séance devient un minimum.
  const weight: LeafSpec = { kind: "WINDOW_REST", key: `${key}/weight`, end: "PARENT", plannedMs: null, contribution: "omitted", blockWeight: true, context };
  const items: ChildSpec[] = [
    ...slots.flatMap((slot) => slot.members.flatMap((member) => member.leaves.map((leaf): ChildSpec => ({ type: "LEAF", leaf: { ...leaf, inWindow: true } })))),
    { type: "LEAF", leaf: weight },
  ];
  const config: DeathByScopeConfig = { format: "DEATH_BY", key, elementId: step.elementId, elementKind: step.elementKind, name, slots, items, context };
  return { scope: { pilot: "DEATH_BY", key, config }, after };
}

/** Étapes de repos retirées d'un élément For time (recette du 17/11/2026). */
const FOR_TIME_REST_KINDS: ReadonlySet<LeafKind> = new Set<LeafKind>(["SERIES_PAUSE", "SIDE_RECOVERY", "POST_ACTIVITY_RECOVERY"]);

type ForTimeElement = { readonly id: string; readonly kind: "EXERCISE" | "CIRCUIT"; readonly name: string; readonly capSeconds: number | null };

/** Configuration de la portée For time (lue par `policies/forTime.ts`). */
export type ForTimeScopeConfig = {
  readonly format: "FOR_TIME";
  readonly elementId: string;
  readonly elementKind: "EXERCISE" | "CIRCUIT";
  readonly name: string;
  readonly capMs: number | null;
  readonly items: readonly ChildSpec[];
  readonly context: LeafContext | null;
};

function capSecondsOf(format: ElementFormat): number | null {
  const value = format.settings.timeCapSeconds;
  return typeof value === "number" && value > 0 ? value : null;
}

/** Membres de Rôle Tour des Circuits For time (phases sans guidage, décision de Hermann du 13/11/2026). */
function forTimeTourMembers(snapshot: SessionSnapshot): ReadonlySet<string> {
  const members = new Set<string>();
  for (const circuit of structureCircuits(snapshot.structure)) {
    if (circuit.format?.key !== "FOR_TIME") continue;
    circuit.exercises.forEach((exercise, index) => {
      if (circuitRoleOf(exercise.format, index) === "TOUR") members.add(exercise.id);
    });
  }
  return members;
}

/** Phases guidées d'une étape : celles de l'Exercice, sauf guidage retiré (`phasesSilenced`). */
export function guidedPhases(plan: ExecutablePlan, spec: LeafSpec): readonly WorkPhase[] {
  if (spec.phasesSilenced === true || spec.exerciseId === undefined) return [];
  return plan.exercises[spec.exerciseId]?.workPhases ?? [];
}

/** Éléments For time de l'instantané (Exercices autonomes et Circuits porteurs), par identifiant. */
function forTimeElements(snapshot: SessionSnapshot): ReadonlyMap<string, ForTimeElement> {
  const elements = new Map<string, ForTimeElement>();
  for (const exercise of structureExercises(snapshot.structure)) {
    const format = exercise.format ?? null;
    if (format?.key === "FOR_TIME") elements.set(exercise.id, { id: exercise.id, kind: "EXERCISE", name: exercise.exercise?.name ?? "", capSeconds: capSecondsOf(format) });
  }
  for (const circuit of structureCircuits(snapshot.structure)) {
    const format = circuit.format ?? null;
    if (format?.key === "FOR_TIME") elements.set(circuit.id, { id: circuit.id, kind: "CIRCUIT", name: circuit.name ?? "For time", capSeconds: capSecondsOf(format) });
  }
  return elements;
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
