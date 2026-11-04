/**
 * PRE-9 C.3 — Déroulé des questionnaires et récapitulatifs (référence Formats du 02/11/2026 §15,
 * §7.1, §9.3, §12 ; CE-FMT-02).
 *
 * Illustration calculée à partir des paramètres, jamais dessinée à la main ; elle lit les mêmes
 * valeurs que la structure enregistrée et ne constitue pas une seconde prescription :
 * 1. un bloc par unité d'exécution (série ; intervalle EMOM / Death by ; passage d'un mouvement dans
 *    un tour AMRAP / For time) ;
 * 2. libellé quand il a un sens (volume, « max », « échec », « buy-in », rang) ;
 * 3. hauteur constante à volume constant, proportionnelle au volume quand il varie ;
 * 4. une nuance par mouvement, légende dès deux mouvements ; buy-in plus foncé et plus large ;
 * 5. récupération entre mouvements : bloc neutre, dans la légende ;
 * 6. nombre ouvert (AMRAP, Death by) : premiers blocs, « … », derniers blocs.
 * Sans mouvement (questionnaire), une suite générique 1, 2, 3… de hauteurs égales. Fonctions pures.
 */

import { hasChosenBuyIn, type FormatModelKey, type ModelAnswers, type ModelExecution, type ModelMovement } from "./formatModels";

export type TimelineBlock =
  | {
      readonly kind: "WORK";
      /** Mouvement (rang) ; `null` : bloc générique sans mouvement. */
      readonly movement: number | null;
      readonly label: string | null;
      /** Largeur relative. */
      readonly weight: number;
      /** Hauteur relative 0..1. */
      readonly height: number;
      readonly buyIn?: true;
    }
  | { readonly kind: "REST"; readonly label: string | null; readonly weight: number }
  | { readonly kind: "ELLIPSIS" };

/** Repère de droite : durée calculée (formatée par l'écran), « ≥ », jusqu'à l'échec, temps mesuré. */
export type TimelineEnd = { readonly kind: "DURATION" } | { readonly kind: "UNTIL_FAILURE" } | { readonly kind: "MEASURED" };

export type Timeline = {
  readonly blocks: readonly TimelineBlock[];
  /** Blocs de travail regroupés par intervalle commun (EMOM / Death by « dans chaque intervalle »). */
  readonly grouped?: true;
  /**
   * AMRAP (mise à jour consolidée du 04/11/2026 §6 bis 1) : bloc continu de 0 à la Durée, tours illustratifs de
   * durée variable séparés par de courts séparateurs ; ce n'est pas une estimation des tours réalisables.
   */
  readonly continuous?: true;
  readonly end: TimelineEnd;
  /** Légende : mouvements colorés, récupération. */
  readonly legendRecovery: boolean;
};

const work = (movement: number | null, label: string | null, height = 1, weight = 1): TimelineBlock => ({ kind: "WORK", movement, label, weight, height });

/** Hauteurs proportionnelles aux volumes (§15 règle 3) ; constantes si le volume ne varie pas. */
function heights(values: readonly (number | null)[]): number[] {
  const numbers = values.map((value) => value ?? 0);
  const max = Math.max(1, ...numbers);
  const constant = numbers.every((value) => value === numbers[0]);
  return numbers.map((value) => (constant ? 1 : Math.max(0.35, value / max)));
}

/** Rangs affichés d'un nombre ouvert : premiers blocs, « … », derniers (§15 règle 6). */
const OPEN_FIRST = 6;

/**
 * Tours illustratifs d'un bloc AMRAP (MAJ 04/11 §6 bis 1) : durées irrégulières, proportionnées à la durée du bloc ;
 * illustration seulement — aucune estimation des tours réalisables.
 */
const ILLUSTRATIVE_ROUNDS = [1.25, 1, 1.12, 0.92, 1.05];
const ILLUSTRATIVE_LAST = 0.55;
function illustrativeRounds(durationSeconds: number): TimelineBlock[] {
  const total = ILLUSTRATIVE_ROUNDS.reduce((sum, value) => sum + value, ILLUSTRATIVE_LAST);
  const scale = durationSeconds / total;
  return [
    ...ILLUSTRATIVE_ROUNDS.map((value, index): TimelineBlock => ({ kind: "WORK", movement: null, label: index === 0 ? "Tour 1" : `T${index + 1}`, weight: value * scale, height: 1 })),
    { kind: "WORK", movement: null, label: null, weight: ILLUSTRATIVE_LAST * scale, height: 1 },
  ];
}

function interleave<T>(lists: readonly (readonly T[])[]): T[] {
  const length = Math.max(0, ...lists.map((list) => list.length));
  const out: T[] = [];
  for (let index = 0; index < length; index += 1) {
    for (const list of lists) if (index < list.length) out.push(list[index]!);
  }
  return out;
}

function sequence(lists: readonly (readonly TimelineBlock[])[], recovery: boolean): TimelineBlock[] {
  return lists.flatMap((list, index) => (recovery && index < lists.length - 1 ? [...list, { kind: "REST" as const, label: null, weight: 1 }] : list));
}

function repetitionsOf(movement: ModelMovement): number | null {
  const series = movement.exercise.executionParameters.series;
  const first = series.kind === "UNIFORM" ? series.target : series.rows[0]?.target;
  return first !== undefined && first.kind === "NUMBER" ? first.value : null;
}

/** Déroulé du modèle, avec ou sans mouvements. */
export function modelTimeline(key: FormatModelKey, answers: ModelAnswers, movements: readonly ModelMovement[]): Timeline {
  const count = movements.length;
  const several = count > 1;
  const execution: ModelExecution = several ? (answers.execution ?? "SEQUENCE") : "SEQUENCE";
  const generic = (n: number) => Array.from({ length: n }, (_, index) => work(null, String(index + 1)));
  const openGeneric = (): TimelineBlock[] => [...generic(OPEN_FIRST), { kind: "ELLIPSIS" }, work(null, "n-1"), work(null, "n")];
  const duration: TimelineEnd = { kind: "DURATION" };
  switch (key) {
    case "TABATA":
    case "INTERVALS_30_30":
    case "STRENGTH":
    case "UNTIL_FAILURE": {
      const n = answers.seriesCount ?? 1;
      const label = key === "STRENGTH" ? String(answers.repetitions ?? "") : key === "UNTIL_FAILURE" ? "échec" : null;
      if (count === 0) return { blocks: key === "STRENGTH" || key === "UNTIL_FAILURE" ? generic(n).map((block) => ({ ...block, label })) : generic(n), end: duration, legendRecovery: false };
      const lists = movements.map((_, movement) => Array.from({ length: n }, () => work(movement, count === 1 && label === null ? null : label)));
      if (count === 1 && label === null) return { blocks: generic(n).map((block) => ({ ...block, movement: 0 })), end: duration, legendRecovery: false };
      const recovery = key === "TABATA" && several && execution === "SEQUENCE" && (answers.recoveryBetweenSeconds ?? 0) > 0;
      return { blocks: execution === "ALTERNATED" ? interleave(lists) : sequence(lists, recovery), end: duration, legendRecovery: recovery };
    }
    case "PROGRESSION": {
      const n = answers.seriesCount ?? 1;
      if (count === 0) return { blocks: generic(n), end: duration, legendRecovery: false };
      const lists = movements.map((movement, index) => {
        const values = Array.from({ length: n }, (_, at) => movement.values.cells?.[at]?.repetitions ?? null);
        const sized = heights(values);
        return values.map((value, at) => work(index, value === null ? "—" : String(value), sized[at]));
      });
      return { blocks: execution === "ALTERNATED" ? interleave(lists) : sequence(lists, false), end: duration, legendRecovery: false };
    }
    case "SUPERSET": {
      if (count === 0) return { blocks: generic(2), end: duration, legendRecovery: false };
      return {
        blocks: [...movements.map((_, index) => work(index, "—")), { kind: "REST", label: null, weight: 1 }],
        end: duration,
        legendRecovery: true,
      };
    }
    case "EMOM": {
      const n = answers.seriesCount ?? 1;
      if (count <= 1) return { blocks: count === 0 ? generic(n) : generic(n).map((block) => ({ ...block, movement: 0 })), end: duration, legendRecovery: false };
      if (execution === "EACH_INTERVAL") {
        return { blocks: Array.from({ length: n }, () => movements.map((_, index) => work(index, null))).flat(), grouped: true, end: duration, legendRecovery: false };
      }
      const lists = movements.map((_, index) => Array.from({ length: n }, () => work(index, null)));
      const recovery = execution === "SEQUENCE" && (answers.recoveryBetweenSeconds ?? 0) > 0;
      return { blocks: execution === "ALTERNATED" ? interleave(lists) : sequence(lists, recovery), end: duration, legendRecovery: recovery };
    }
    case "DEATH_BY": {
      const start = answers.startRepetitions ?? 1;
      const increment = answers.increment ?? 1;
      const ranks = Array.from({ length: OPEN_FIRST }, (_, index) => start + index * increment);
      const sized = heights(ranks);
      const open = (movement: number | null) => [
        ...ranks.map((value, index) => work(movement, String(value), sized[index])),
        { kind: "ELLIPSIS" as const },
        work(movement, "n", 1),
      ];
      const end: TimelineEnd = { kind: "UNTIL_FAILURE" };
      if (count <= 1) return { blocks: open(count === 0 ? null : 0), end, legendRecovery: false };
      if (execution === "SEQUENCE") {
        const recovery = (answers.recoveryBetweenSeconds ?? 0) > 0;
        return { blocks: sequence(movements.map((_, index) => open(index)), recovery), end, legendRecovery: recovery };
      }
      const perRank = (rank: number, height: number) => movements.map((_, index) => work(index, rank < 0 ? "n" : String(rank), height));
      const blocks: TimelineBlock[] = [...ranks.flatMap((value, index) => perRank(value, sized[index]!)), { kind: "ELLIPSIS" }, ...perRank(-1, 1)];
      return { blocks, ...(execution === "EACH_INTERVAL" ? { grouped: true as const } : {}), end, legendRecovery: false };
    }
    case "AMRAP": {
      const blocksCount = answers.blockCount ?? 1;
      if (count === 0) {
        if (blocksCount > 1) {
          // §7.1 (plusieurs blocs) : Bloc 1, repos, Bloc 2… ; repos gris sans libellé, largeurs proportionnelles.
          const duration = answers.durationSeconds ?? 720;
          const rest = answers.restBetweenBlocksSeconds ?? 0;
          const blocks: TimelineBlock[] = [];
          for (let index = 1; index <= blocksCount; index += 1) {
            blocks.push(...illustrativeRounds(duration));
            if (index < blocksCount && rest > 0) blocks.push({ kind: "REST", label: null, weight: rest });
          }
          return { blocks, continuous: true, end: { kind: "DURATION" }, legendRecovery: false };
        }
        // MAJ 04/11 §6 bis 1 : un seul bloc continu, tours illustratifs « Tour 1 », « T2 »… ; le dernier, coupé, sans numéro.
        return { blocks: illustrativeRounds(answers.durationSeconds ?? 720), continuous: true, end: { kind: "DURATION" }, legendRecovery: false };
      }
      const buyIn = hasChosenBuyIn(answers, movements);
      const loop = movements.slice(buyIn ? 1 : 0);
      const increasing = answers.increasingVolume === true;
      const labelAt = (movement: ModelMovement, round: number | null) => {
        if (movement.values.max === true) return "max";
        const base = movement.values.repetitions ?? repetitionsOf(movement);
        if (base === null) return "—";
        return round === null ? "n" : String(base + (increasing ? (movement.values.increment ?? 0) * round : 0));
      };
      const roundBlocks = (round: number | null) => loop.map((movement, index) => work(index + (buyIn ? 1 : 0), labelAt(movement, round)));
      const blocks: TimelineBlock[] = [
        ...(buyIn ? [{ kind: "WORK" as const, movement: 0, label: `${movements[0]!.values.repetitions ?? "—"} · buy-in`, weight: 2.5, height: 1, buyIn: true as const }] : []),
        ...[0, 1, 2].flatMap((round) => roundBlocks(round)),
        { kind: "ELLIPSIS" },
        ...roundBlocks(null),
      ];
      return { blocks, continuous: true, end: { kind: "DURATION" }, legendRecovery: false };
    }
    case "FOR_TIME": {
      const rounds = answers.roundCount ?? 1;
      if (count === 0) return { blocks: generic(rounds), end: { kind: "MEASURED" }, legendRecovery: false };
      const volumes = movements.flatMap((movement) => Array.from({ length: rounds }, (_, at) => movement.values.volumes?.[at] ?? null));
      const max = Math.max(1, ...volumes.map((value) => value ?? 0));
      const blocks = Array.from({ length: rounds }, (_, round) =>
        movements.map((movement, index) => {
          const value = movement.values.volumes?.[round] ?? null;
          return work(index, value === null ? "—" : String(value), value === null ? 0.35 : Math.max(0.35, value / max));
        }),
      ).flat();
      return { blocks, end: { kind: "MEASURED" }, legendRecovery: false };
    }
    default: {
      const unreachable: never = key;
      return unreachable;
    }
  }
}
