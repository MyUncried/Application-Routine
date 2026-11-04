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
 * - **Circuit porteur d'un Format** (réalignement du 02/11/2026, référence Formats §1, §2.1, §10 à §12) :
 *   AMRAP — un segment progressif par bloc (rattaché au Circuit), séparés par le repos entre les blocs ;
 *   le buy-in et la boucle sont dans le segment (le buy-in consomme le premier bloc) ; Death by (dans
 *   chaque intervalle ou alterné) — un segment unique, arrêt collectif au premier échec ; EMOM dans
 *   chaque intervalle et For time — tours ordinaires de leurs membres (nature fixée), le Format du
 *   Circuit en élément de rattachement. Un Death by autonome rejoué dans un Circuit groupé repart de
 *   son départ initial (§6.1) : question levée.
 * - **Formats** [correction C.1 du 30/10, D-02 — remplacée le 02/11/2026 pour le Circuit porteur] : le Format est porté par l'**Exercice** seul ; le
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
 *   progressif à chaque tour d'un Circuit alterné. [For time dans un Circuit : « l'échelle "Volume par
 *   tour" n'est pas lue ici […] non tranché » — remplacé : le Circuit For time est alterné, la série k
 *   d'un membre de la boucle est son volume du tour k (référence Formats §11).]
 * - **Circuit porteur For time — zones des Rôles** (mise à jour consolidée du 04/11/2026 §6 bis 2) : les
 *   buy-in sont joués une seule fois, dans l'ordre, avant le tour 1 ; les membres de Rôle Tour jouent leur
 *   série i au tour i ; les buy-out une seule fois, dans l'ordre, après le dernier tour ; le repos entre les
 *   tours (`restBetweenRoundsSeconds`) sépare deux tours. Ce que le chrono mesure relève de PRE-10/11.
 * - **Identité d'étape** stable, dérivée du chemin et des indices de répétition, de tour, de série
 *   et de côté (`stepId`).
 * - **Bornes** : Compte à rebours initial en tête et Fin de séance en fin, une seule fois, hors de
 *   tout conteneur (RM-030), lorsqu'elles sont fournies.
 */

import { buildExecutionLedger, type LedgerSide } from "@/domain/activities/executionCalculations";
import { seriesRowsOf, type ExecutionParametersInput } from "@/domain/activities/ExecutionParameters";

import type { ActivityType } from "./Session";
import { circuitRoleOf, ELEMENT_FORMAT_KEYS, FORMAT_CAPABILITIES, type ElementFormat } from "./formats";
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
      /** Exercice autonome, ou Circuit porteur (réalignement du 02/11/2026). */
      readonly elementKind: "EXERCISE" | "CIRCUIT";
      /** Bloc AMRAP d'un Circuit porteur (1..n), absent sinon. */
      readonly block?: number;
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
    const carried = item.format ?? null;
    if (carried !== null && PROGRESSIVE_FORMATS.has(carried.key)) {
      carrierSegments(item, carried, prefix, cycle);
      return;
    }
    const alternated = item.nature === "SERIES";
    if (carried?.key === "FOR_TIME") {
      forTimeCircuit(item, carried, prefix, cycle);
      return;
    }
    for (let tour = 1; tour <= item.repeatCount; tour += 1) {
      const circuitContext: PlanContext = {
        cycle,
        circuit: { id: item.id, tour, count: item.repeatCount },
        formattedElementId: carried === null ? null : item.id,
      };
      // Circuit standard : chaque membre est rattaché à son propre Format (§6.1) ; Circuit porteur : au Circuit.
      const memberContext = (exercise: E): PlanContext =>
        carried !== null || (exercise.format ?? null) === null ? circuitContext : { ...circuitContext, formattedElementId: exercise.id };
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

  /** Circuit porteur For time : zones buy-in, tours alternés, buy-out ; repos entre les tours (voir l'en-tête). */
  const forTimeCircuit = (item: StructureCircuit<E>, format: ElementFormat, prefix: string, cycle: PlanCycleContext | null) => {
    const roles = item.exercises.map((exercise, index) => circuitRoleOf(exercise.format, index));
    const zone = (role: string) => item.exercises.filter((_, index) => roles[index] === role);
    const rest = format.settings.restBetweenRoundsSeconds;
    const count = Math.max(1, item.repeatCount);
    const contextAt = (tour: number): PlanContext => ({ cycle, circuit: { id: item.id, tour, count }, formattedElementId: item.id });
    for (const exercise of zone("BUY_IN")) occurrence(exercise, null, `${prefix}/circuit:${item.id}#buy-in`, contextAt(1));
    const tours = zone("TOUR");
    for (let tour = 1; tour <= count; tour += 1) {
      const tourPrefix = `${prefix}/circuit:${item.id}#${tour}`;
      for (const exercise of tours) if (seriesCount(exercise) >= tour) occurrence(exercise, tour, tourPrefix, contextAt(tour));
      if (tour < count && typeof rest === "number" && rest > 0) {
        steps.push({ kind: "RECOVERY", stepId: `${tourPrefix}/rest`, exerciseId: item.id, seconds: rest, context: contextAt(tour) });
      }
    }
    for (const exercise of zone("BUY_OUT")) occurrence(exercise, null, `${prefix}/circuit:${item.id}#buy-out`, contextAt(count));
  };

  /** Circuit porteur AMRAP (un segment par bloc, repos entre les blocs) ou Death by (un segment). */
  const carrierSegments = (item: StructureCircuit<E>, format: ElementFormat, prefix: string, cycle: PlanCycleContext | null) => {
    const blocks = format.key === "AMRAP" ? Math.max(1, item.repeatCount) : 1;
    const rest = format.settings.restBetweenBlocksSeconds;
    for (let block = 1; block <= blocks; block += 1) {
      const context: PlanContext = { cycle, circuit: { id: item.id, tour: block, count: blocks }, formattedElementId: item.id };
      steps.push({
        kind: "PROGRESSIVE_SEGMENT",
        stepId: `${prefix}/circuit:${item.id}#${block}/segment`,
        elementId: item.id,
        elementKind: "CIRCUIT",
        format,
        context,
        ...(format.key === "AMRAP" ? { block } : {}),
      });
      if (block < blocks && typeof rest === "number" && rest > 0) {
        steps.push({ kind: "RECOVERY", stepId: `${prefix}/circuit:${item.id}#${block}/rest`, exerciseId: item.id, seconds: rest, context });
      }
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
  // Circuit groupé : chaque passage rejoue l'AMRAP ou le Death by depuis ses réglages initiaux (§6.1,
  // décision complémentaire de Hermann du 02/11/2026) — décidé.
  void format;
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
