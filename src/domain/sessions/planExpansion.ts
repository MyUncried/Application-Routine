/**
 * PRE-9 (story D.1, D-451, RM-252, ARB-02a, ARB-10b, ARB-25) — développement du plan d'une Séance
 * sur toute sa structure : Exercices, Circuits et Cycles, au niveau principal ou dans un Cycle.
 *
 * Fonction pure, sans moteur d'exécution (PRE-10) : elle décrit la suite ordonnée de ce qui serait
 * exécuté, sans horloge ni échéance.
 *
 * - **Ordre** : celui de la structure. Un Exercice direct de la Séance est développé une fois ; un
 *   Cycle × k reproduit k fois le développement complet de ses membres (Exercices directs et
 *   Circuits, formatés ou libres), sans autre facteur (RM-252, ARB-25).
 * - **Circuit** selon sa nature (ch10, COMP §2) : séries groupées (`TOURS`) — à chaque tour, chaque
 *   Exercice joue toutes ses séries ; séries alternées (`SERIES`) — au tour i, chaque Exercice joue
 *   sa seule série i (un Exercice qui a moins de i séries ne joue pas). Un tour où rien ne joue
 *   est omis, points compris (règle de `expandComposition`).
 * - **Séries et côtés** : l'ordre des séries et des côtés d'un Exercice est celui de son registre
 *   (`buildExecutionLedger` : un côté après l'autre ou alternance par série) ; une étape par série
 *   et par côté joués.
 * - **Cible nulle** (COMP §3, ARB-10) : la série est sautée. Une occurrence dont aucune série jouée
 *   n'a de travail n'est pas exécutée et sa récupération directement associée non plus (ARB-10b) ;
 *   elle ne sépare pas deux Points d'arrêt.
 * - **Récupération** positive de l'occurrence (AD-35) : après sa dernière série jouée, à chaque
 *   passage. Les pauses de série restent dans le registre de l'Exercice (non répétées ici).
 * - **Points d'arrêt** : produits à leur emplacement à chaque passage de leur conteneur (un Point
 *   interne à un Cycle à chaque répétition, ARB-02a). Le développement ne produit jamais deux
 *   Points successifs, ni un Point avant le premier ou après le dernier Exercice exécuté (RM-251,
 *   RM-219, D-441, D-442 : « supprimer le point en trop »), sans rien retirer de la Séance.
 * - **Formats** (correction C.1 du 30/10, D-02) : le Format est porté par l'**Exercice** seul ; le
 *   Circuit n'en porte aucun et n'en transmet aucun. Un Exercice formaté fini (Tabata, Intervalles
 *   30/30, EMOM, For time) est développé par sa structure ordinaire (ses séries) ; ses étapes portent
 *   l'Exercice comme élément de rattachement. Un Exercice AMRAP ou Death by produit un **segment
 *   progressif** (Exercice, Format, réglages) à chacune de ses exécutions, sans occurrence générée ni
 *   développement fini générique : une fois par répétition de son Cycle s'il est direct ; dans un
 *   Circuit, une fois par passage (tour) du Circuit.
 * - **Exercice formaté dans un Circuit groupé** (D-08, D-15) : à chaque passage, chaque membre joue
 *   son bloc complet, l'un après l'autre (Tabata : ses 8 séries ; AMRAP : un segment borné par sa
 *   durée configurée complète, sans limite commune aux passages, D-30 ; Death by : un segment dont
 *   l'arrêt termine l'élément, D-18).
 * - **Exercice formaté dans un Circuit alterné** : au tour i, chaque membre fini joue sa série i
 *   (Tabata, N = 8 : A1 B1 … A8 B8, distinct de deux Tabata successifs A1…A8 B1…B8). Un membre
 *   progressif (Death by alterné admis, D-16, D-29) produit un segment à chaque tour ; ce que ce
 *   segment exécute (fenêtres, rangs, fin du membre) relève de PRE-10/11.
 * - **À CLARIFIER, non encodé** (porté par `openQuestion` du segment) : rang de reprise d'un Death by
 *   au passage suivant d'un Circuit groupé (aucune règle retrouvée ; la proposition « chaque nouvelle
 *   exécution repart de ses réglages initiaux » n'est pas validée) ; unité exécutée par un membre
 *   progressif à chaque tour d'un Circuit alterné. For time dans un Circuit : l'échelle « Volume par
 *   tour » n'est pas lue ici (séries ordinaires seulement) — échelle rejouée en entier à chaque
 *   passage (main) ou indexée par passage (branche non fusionnée), non tranché.
 * - **Identité d'étape** stable, dérivée du chemin et des indices de répétition, de tour, de série
 *   et de côté (`stepId`).
 * - **Bornes** : Compte à rebours initial en tête et Fin de séance en fin, une seule fois, hors de
 *   tout conteneur (RM-030), lorsqu'elles sont fournies.
 */

import { buildExecutionLedger, type LedgerSide } from "@/domain/activities/executionCalculations";
import { seriesRowsOf, type ExecutionParametersInput } from "@/domain/activities/ExecutionParameters";

import type { ActivityType } from "./Session";
import { ELEMENT_FORMAT_KEYS, FORMAT_CAPABILITIES, type ElementFormat } from "./formats";
import { type SessionStructure, type StructureCircuit, type StructureStopPointLocation } from "./structure";

/** Formats développés en segment progressif : expansion `PROGRESSIVE` de leur descripteur (D.3). */
const PROGRESSIVE_FORMATS: ReadonlySet<ElementFormat["key"]> = new Set(
  ELEMENT_FORMAT_KEYS.filter((key) => FORMAT_CAPABILITIES[key].expansion === "PROGRESSIVE"),
);

/** Exercice tel que le développement le lit. */
export type PlanExercise = {
  readonly id: string;
  readonly type: ActivityType;
  readonly executionParameters: ExecutionParametersInput;
  /** Récupération de l'occurrence : seule une valeur positive produit une étape (AD-35). */
  readonly postActivityRecoverySeconds?: number | null;
  readonly format?: ElementFormat | null;
};

/** Répétition du Cycle englobant : répétition `repetition` sur `count` (à ne pas confondre avec un passage de Circuit). */
export type PlanCycleContext = { readonly id: string; readonly repetition: number; readonly count: number };

/** Tour (passage) du Circuit englobant : tour `tour` sur `count`. */
export type PlanCircuitContext = { readonly id: string; readonly tour: number; readonly count: number };

/** Contexte d'une étape (RM-083) : Cycle et Circuit englobants, élément formaté de rattachement. */
export type PlanContext = {
  readonly cycle: PlanCycleContext | null;
  readonly circuit: PlanCircuitContext | null;
  /** Exercice qui porte le Format dont relève l'étape (D-02 : jamais un Circuit), `null` pour un Exercice libre. */
  readonly formattedElementId: string | null;
};

export type PlanStep =
  | { readonly kind: "COUNTDOWN"; readonly stepId: string; readonly seconds: number }
  | {
      readonly kind: "SERIES";
      readonly stepId: string;
      readonly exerciseId: string;
      /** Série jouée (1..n) ; `null` pour une ancienne Récupération autonome ou un Mode inconnu (joués en entier). */
      readonly series: number | null;
      readonly side: LedgerSide;
      readonly context: PlanContext;
    }
  | { readonly kind: "RECOVERY"; readonly stepId: string; readonly exerciseId: string; readonly seconds: number; readonly context: PlanContext }
  | { readonly kind: "STOP_POINT"; readonly stepId: string; readonly stopPointId: string; readonly context: PlanContext }
  | {
      readonly kind: "PROGRESSIVE_SEGMENT";
      readonly stepId: string;
      readonly elementId: string;
      /** Toujours un Exercice (D-02). */
      readonly elementKind: "EXERCISE";
      readonly format: ElementFormat;
      readonly context: PlanContext;
      /** Point non décidé qui concerne ce segment (voir l'en-tête), absent sinon ; jamais une règle supposée. */
      readonly openQuestion?: string;
    }
  | { readonly kind: "FINAL_PHASE"; readonly stepId: string; readonly seconds: number };

export type PlanExpansionInput<E extends PlanExercise> = {
  readonly structure: SessionStructure<E, StructureStopPointLocation & { readonly id: string }>;
  readonly initialCountdownSeconds?: number;
  readonly finalPhaseSeconds?: number;
};

/** Séries jouées et côtés d'un Exercice, dans l'ordre de son registre ; `series` filtre la série i. */
function seriesSteps(exercise: PlanExercise, only: number | null): { readonly series: number | null; readonly side: LedgerSide }[] {
  const parameters = exercise.executionParameters;
  if (exercise.type === "RECOVERY" || parameters.mode === null) {
    // Lecture défensive, comme la durée : joué en entier, une étape.
    return only === null || only === 1 ? [{ series: null, side: "NONE" }] : [];
  }
  const rows = seriesRowsOf(parameters);
  const hasWork = (series: number) => {
    const target = rows[series - 1]?.target;
    return target !== undefined && !(target.kind === "NUMBER" && target.value === 0);
  };
  return buildExecutionLedger(parameters).flatMap((event) =>
    event.kind === "WORK" && (only === null || event.series === only) && hasWork(event.series) ? [{ series: event.series, side: event.side }] : [],
  );
}

function seriesCount(exercise: PlanExercise): number {
  return exercise.type === "RECOVERY" || exercise.executionParameters.mode === null ? 1 : seriesRowsOf(exercise.executionParameters).length;
}

/**
 * Développement du plan fini d'une Séance (voir l'en-tête). Ne lève jamais d'exception pour une
 * structure valide ; ne modifie rien.
 */
export function expandStructure<E extends PlanExercise>(input: PlanExpansionInput<E>): readonly PlanStep[] {
  const { structure } = input;
  const steps: PlanStep[] = [];
  /** Étapes `SERIES` d'Exercice exécuté : seules séparatrices de Points (une Récupération ne l'est pas). */
  const separators = new Set<PlanStep>();

  const pointsAt = (container: { circuitId: string | null; cycleId: string | null }, position: number, prefix: string, context: PlanContext) => {
    for (const point of structure.stopPoints) {
      if ((point.circuitId ?? null) === container.circuitId && (point.cycleId ?? null) === container.cycleId && point.position === position) {
        steps.push({ kind: "STOP_POINT", stepId: `${prefix}/stop:${point.id}`, stopPointId: point.id, context });
      }
    }
  };

  const occurrence = (exercise: E, only: number | null, prefix: string, context: PlanContext) => {
    const played = seriesSteps(exercise, only);
    if (played.length === 0) {
      // Occurrence sautée : ni série ni récupération directement associée (ARB-10b).
      return;
    }
    const base = `${prefix}/ex:${exercise.id}`;
    for (const { series, side } of played) {
      const step: PlanStep = {
        kind: "SERIES",
        stepId: `${base}/s${series ?? 0}/${side}`,
        exerciseId: exercise.id,
        series,
        side,
        context,
      };
      steps.push(step);
      if (exercise.type === "EXERCISE") {
        separators.add(step);
      }
    }
    const recovery = exercise.postActivityRecoverySeconds ?? 0;
    if (recovery > 0) {
      steps.push({ kind: "RECOVERY", stepId: `${base}/recovery`, exerciseId: exercise.id, seconds: recovery, context });
    }
  };

  const progressive = (elementId: string, format: ElementFormat, prefix: string, context: PlanContext, openQuestion: string | null = null) => {
    steps.push({
      kind: "PROGRESSIVE_SEGMENT",
      stepId: `${prefix}/segment:${elementId}`,
      elementId,
      elementKind: "EXERCISE",
      format,
      context,
      ...(openQuestion !== null ? { openQuestion } : {}),
    });
  };

  const directExercise = (exercise: E, prefix: string, cycle: PlanCycleContext | null) => {
    const format = exercise.format ?? null;
    const context: PlanContext = { cycle, circuit: null, formattedElementId: format === null ? null : exercise.id };
    if (format !== null && PROGRESSIVE_FORMATS.has(format.key)) {
      progressive(exercise.id, format, prefix, context);
      return;
    }
    occurrence(exercise, null, prefix, context);
  };

  /** Membre progressif (AMRAP, Death by) : joue à chaque tour de son Circuit, sans série propre. */
  const progressiveFormat = (exercise: E): ElementFormat | null => {
    const format = exercise.format ?? null;
    return format !== null && PROGRESSIVE_FORMATS.has(format.key) ? format : null;
  };

  const circuit = (item: StructureCircuit<E>, prefix: string, cycle: PlanCycleContext | null) => {
    const alternated = item.nature === "SERIES";
    for (let tour = 1; tour <= item.repeatCount; tour += 1) {
      const circuitContext: PlanContext = { cycle, circuit: { id: item.id, tour, count: item.repeatCount }, formattedElementId: null };
      // Chaque membre est rattaché à son propre Format, jamais à celui d'un autre membre (D-26, D-27).
      const memberContext = (exercise: E): PlanContext =>
        (exercise.format ?? null) === null ? circuitContext : { ...circuitContext, formattedElementId: exercise.id };
      const tourPrefix = `${prefix}/circuit:${item.id}#${tour}`;
      const only = alternated ? tour : null;
      const plays = (exercise: E) => only === null || progressiveFormat(exercise) !== null || seriesCount(exercise) >= only;
      // Un tour où aucun Exercice ne joue est omis en entier, points compris (alternées).
      if (!item.exercises.some(plays)) {
        continue;
      }
      pointsAt({ circuitId: item.id, cycleId: null }, 0, tourPrefix, circuitContext);
      item.exercises.forEach((exercise, index) => {
        const open = progressiveFormat(exercise);
        if (open !== null) {
          progressive(exercise.id, open, tourPrefix, memberContext(exercise), progressiveInCircuitQuestion(open, alternated));
        } else if (plays(exercise)) {
          occurrence(exercise, only, tourPrefix, memberContext(exercise));
        }
        pointsAt({ circuitId: item.id, cycleId: null }, index + 1, tourPrefix, circuitContext);
      });
    }
  };

  if (input.initialCountdownSeconds !== undefined) {
    steps.push({ kind: "COUNTDOWN", stepId: "countdown", seconds: input.initialCountdownSeconds });
  }
  const main: PlanContext = { cycle: null, circuit: null, formattedElementId: null };
  pointsAt({ circuitId: null, cycleId: null }, 0, "session", main);
  structure.elements.forEach((element, index) => {
    switch (element.kind) {
      case "EXERCISE":
        directExercise(element.exercise, "session", null);
        break;
      case "CIRCUIT":
        circuit(element.circuit, "session", null);
        break;
      case "CYCLE": {
        const { cycle } = element;
        for (let repetition = 1; repetition <= cycle.repeatCount; repetition += 1) {
          const cycleContext: PlanCycleContext = { id: cycle.id, repetition, count: cycle.repeatCount };
          const prefix = `session/cycle:${cycle.id}#${repetition}`;
          const inCycle: PlanContext = { cycle: cycleContext, circuit: null, formattedElementId: null };
          pointsAt({ circuitId: null, cycleId: cycle.id }, 0, prefix, inCycle);
          cycle.members.forEach((member, memberIndex) => {
            if (member.kind === "CIRCUIT") {
              circuit(member.circuit, prefix, cycleContext);
            } else {
              directExercise(member.exercise, prefix, cycleContext);
            }
            pointsAt({ circuitId: null, cycleId: cycle.id }, memberIndex + 1, prefix, inCycle);
          });
        }
        break;
      }
      default: {
        const unreachable: never = element;
        return unreachable;
      }
    }
    pointsAt({ circuitId: null, cycleId: null }, index + 1, "session", main);
  });

  const content = withoutExtraStopPoints(steps.filter((step) => step.kind !== "COUNTDOWN"), separators);
  return [
    ...steps.filter((step) => step.kind === "COUNTDOWN"),
    ...content,
    ...(input.finalPhaseSeconds !== undefined ? [{ kind: "FINAL_PHASE" as const, stepId: "final-phase", seconds: input.finalPhaseSeconds }] : []),
  ];
}

/** Question ouverte d'un segment progressif membre d'un Circuit (voir l'en-tête) ; `null` si aucune. */
function progressiveInCircuitQuestion(format: ElementFormat, alternated: boolean): string | null {
  if (alternated) {
    return "Circuit alterné : unité exécutée par ce membre progressif à chaque tour, raccordement des rangs, fenêtres et de sa fin — PRE-10/11 (D-29).";
  }
  if (format.key === "DEATH_BY") {
    return "Circuit groupé : rang de reprise de ce Death by au passage suivant (rang initial ou poursuite) — non décidé.";
  }
  // AMRAP groupé : chaque passage recommence un bloc à sa durée configurée complète (D-15, D-30) — décidé.
  return null;
}

/**
 * RM-251 / RM-219 (D-441, D-442) : omet tout Point qui suit un autre Point, ou qu'aucune série
 * d'Exercice exécutée ne précède (tête) ou ne suit (fin). Un segment progressif sépare comme un
 * Exercice (il exécute des Exercices).
 */
function withoutExtraStopPoints(steps: readonly PlanStep[], separators: ReadonlySet<PlanStep>): PlanStep[] {
  const isSeparator = (step: PlanStep) => separators.has(step) || step.kind === "PROGRESSIVE_SEGMENT";
  const lastSeparator = steps.reduce((last, step, index) => (isSeparator(step) ? index : last), -1);
  const result: PlanStep[] = [];
  let seenSeparator = false;
  let afterStopPoint = false;
  steps.forEach((step, index) => {
    if (step.kind === "STOP_POINT") {
      if (afterStopPoint || !seenSeparator || index > lastSeparator) {
        return;
      }
      afterStopPoint = true;
    } else if (isSeparator(step)) {
      seenSeparator = true;
      afterStopPoint = false;
    }
    result.push(step);
  });
  return result;
}
