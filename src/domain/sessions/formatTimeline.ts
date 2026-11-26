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

import { formatPrimeDuration } from "../activities/durationFormat";
import { amrapRoundTarget, forTimeInSequence, hasChosenBuyIn, movementRole, strengthSeriesCount, type FormatModelKey, type ModelAnswers, type ModelExecution, type ModelMovement } from "./formatModels";

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

/**
 * Durée compacte d'un bloc — recette du 05/11/2026 (constat e, Hermann : « AMRAP Déroulé : si l'objectif est en durée, les
 * blocs affichent des secondes, mettre le format compact de durée avec ' et " »). Spécification de Hermann du 08/11/2026 (« Durées
 * au format `M′SS″`, ou `S″` sous une minute, partout » ; « Pas d'apostrophe ni de guillemet droit ») et demande du 08/11/2026 au soir
 * (« Et tu dois encore modifier le format des durées. ») : 30″, 1′30″, 2′00″. [30", 1'30", 2' — remplacés le 08/11/2026.]
 */
export function compactBlockDuration(totalSeconds: number): string {
  return formatPrimeDuration(totalSeconds);
}

/** Objectif d'un bloc : nombre de répétitions, ou durée compacte si le mouvement est en durée. */
const objectiveLabel = (movement: ModelMovement, value: number) => (movement.values.mode === "DURATION" ? compactBlockDuration(value) : String(value));

/** Valeur de la série `at` d'un mouvement à valeurs par série (EMOM, Superset) ; « — » : à renseigner. */
const cellLabel = (movement: ModelMovement, at: number) => {
  const value = movement.values.cells?.[at]?.repetitions ?? null;
  return value === null ? "—" : objectiveLabel(movement, value);
};

/** Hauteurs proportionnelles aux volumes (§15 règle 3) ; constantes si le volume ne varie pas. */
function heights(values: readonly (number | null)[]): number[] {
  const numbers = values.map((value) => value ?? 0);
  const max = Math.max(1, ...numbers);
  const constant = numbers.every((value) => value === numbers[0]);
  return numbers.map((value) => (constant ? 1 : Math.max(0.35, value / max)));
}

/**
 * Recette iPhone du 16/11/2026 (Hermann, fmt-entree : « Déroulé : la hauteur des cadres doit représenter la hauteur relative entre les
 * séries en répétition ») : hauteur de chaque bloc en Répétitions proportionnelle à son volume, rapportée au plus grand volume de tout le
 * Déroulé (tous mouvements confondus) ; blocs en Durée, à renseigner ou sans volume inchangés. [Hauteurs relatives à chaque mouvement
 * seul (Progression), ou constantes (Renforcement, EMOM, Superset) — remplacé.]
 */
/** Objectif d'un bloc pour sa hauteur : valeur et unité ; `null` : hauteur inchangée (à renseigner, « max », « échec », générique). */
type BlockAmount = { readonly duration: boolean; readonly value: number } | null;

/** Durée compacte « M′SS″ » ou « S″ » relue en secondes. */
function primeSeconds(label: string): number | null {
  const match = /^(?:(\d+)′)?(\d+)″$/.exec(label);
  return match === null ? null : Number(match[1] ?? 0) * 60 + Number(match[2]);
}

/** Objectif lu dans le libellé d'un bloc de mouvement (« 12 », « 1′30″ »). */
function labelAmount(block: TimelineBlock, movements: readonly ModelMovement[]): BlockAmount {
  if (block.kind !== "WORK" || block.movement === null || block.label === null) return null;
  const duration = movements[block.movement]?.values.mode === "DURATION";
  const value = duration ? primeSeconds(block.label) : /^\d+$/.test(block.label) ? Number(block.label) : null;
  return value === null ? null : { duration, value };
}

/**
 * Recette du 16/11/2026 (r16b-deroule-hauteur, Hermann : « AMRAP, déroulé : - buy in, la largeur du Buy In doit être identique aux autres cadres - les dernières cases "n" doivent être plus haute que l'avant dernière (idem pour le format à l'échec) ») : une case « n » sans volume connu (nombre ouvert qui croît : Death by, AMRAP à volume croissant) garde la pleine hauteur ; les
 * cases chiffrées sont ramenées à `OPEN_TOP_SHARE` de la hauteur, pour que « n » dépasse toujours la case qui la précède.
 */
const OPEN_TOP_SHARE = 0.8;

function scaleRepetitions(
  blocks: readonly TimelineBlock[],
  movements: readonly ModelMovement[],
  amountOf: (block: TimelineBlock) => BlockAmount = (block) => labelAmount(block, movements),
  openTop = false,
): TimelineBlock[] {
  // Recette iPhone du 16/11/2026 (constat c, Hermann : « hauteur relative : le principe de présentation doit être appliqué de la même
  // manière aux autres formats tabata, AMRAP, 30/30, For Time, Death by ») : Répétitions rapportées au plus grand volume du Déroulé,
  // Durées à la plus longue durée — les deux unités ne se comparent pas entre elles.
  const amounts = blocks.map((block) => amountOf(block));
  const maxOf = (duration: boolean) => Math.max(1, ...amounts.flatMap((amount) => (amount !== null && amount.duration === duration ? [amount.value] : [])));
  const max = { repetitions: maxOf(false), duration: maxOf(true) };
  return blocks.map((block, index) => {
    const amount = amounts[index];
    if (block.kind !== "WORK") return block;
    if (amount === null || amount === undefined) return openTop && block.label === "n" ? { ...block, height: 1 } : block;
    const height = Math.max(0.35, amount.value / (amount.duration ? max.duration : max.repetitions));
    return { ...block, height: openTop ? height * OPEN_TOP_SHARE : height };
  });
}

/**
 * Recette iPhone du 16/11/2026 (constat c, Hermann : « Appliquer le même principe de largeur relative pour la récupération s'il y en a
 * une ») : quand le travail est minuté (un bloc = une durée connue), la récupération a la largeur de sa durée sur la même échelle ;
 * sinon, largeur d'un bloc. [Largeur d'un bloc, quelle que soit sa durée — remplacé le 16/11/2026.]
 */
function restWeight(recoverySeconds: number | undefined, blockSeconds: number | undefined): number {
  if (recoverySeconds === undefined || blockSeconds === undefined || blockSeconds <= 0) return 1;
  return Math.max(0.25, recoverySeconds / blockSeconds);
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

function sequence(lists: readonly (readonly TimelineBlock[])[], recovery: boolean, weight = 1): TimelineBlock[] {
  return lists.flatMap((list, index) => (recovery && index < lists.length - 1 ? [...list, { kind: "REST" as const, label: null, weight }] : list));
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
    case "HIIT":
    case "STRENGTH":
    case "UNTIL_FAILURE": {
      const n = answers.seriesCount ?? 1;
      const label = key === "STRENGTH" ? String(answers.repetitions ?? "") : key === "UNTIL_FAILURE" ? "échec" : null;
      if (count === 0) return { blocks: key === "STRENGTH" || key === "UNTIL_FAILURE" ? generic(n).map((block) => ({ ...block, label })) : generic(n), end: duration, legendRecovery: false };
      // Renforcement (15/11/2026, tableau par mouvement) : objectif propre à chaque mouvement, à défaut le réglage commun.
      const labelOf = (movement: ModelMovement) => {
        if (key !== "STRENGTH") return label;
        const own = movement.values.repetitions !== undefined ? movement.values.repetitions : (movement.values.mode ?? "REPETITIONS") === "REPETITIONS" ? (answers.repetitions ?? null) : null;
        return own === null ? "—" : objectiveLabel(movement, own);
      };
      // Renforcement (recette du 26/11/2026 après-midi) : nombre de séries propre à chaque mouvement (commun en alternance).
      const seriesOf = (item: ModelMovement) => (key === "STRENGTH" ? strengthSeriesCount(answers, item.values, execution === "ALTERNATED") : n);
      const lists = movements.map((item, movement) => Array.from({ length: seriesOf(item) }, () => work(movement, count === 1 && label === null ? null : labelOf(item))));
      if (count === 1 && label === null) return { blocks: generic(n).map((block) => ({ ...block, movement: 0 })), end: duration, legendRecovery: false };
      const recovery = key === "TABATA" && several && execution === "SEQUENCE" && (answers.recoveryBetweenSeconds ?? 0) > 0;
      // Tabata, 30/30 (constat c du 16/11/2026) : hauteur selon l'objectif de chaque mouvement (sa durée de travail, ou ses répétitions).
      const objectiveOf = (block: TimelineBlock): BlockAmount => {
        if (block.kind !== "WORK" || block.movement === null) return null;
        if (key === "STRENGTH") return labelAmount(block, movements);
        if (key === "UNTIL_FAILURE") return null;
        const values = movements[block.movement]?.values;
        if (values === undefined) return null;
        const mode = values.mode ?? "DURATION";
        const value = values.repetitions !== undefined ? values.repetitions : mode === "DURATION" ? (answers.workSeconds ?? null) : null;
        return value === null ? null : { duration: mode === "DURATION", value };
      };
      const ordered = execution === "ALTERNATED" ? interleave(lists) : sequence(lists, recovery, restWeight(answers.recoveryBetweenSeconds, answers.workSeconds));
      return { blocks: scaleRepetitions(ordered, movements, objectiveOf), end: duration, legendRecovery: recovery };
    }
    case "PROGRESSION": {
      const n = answers.seriesCount ?? 1;
      if (count === 0) return { blocks: generic(n), end: duration, legendRecovery: false };
      const lists = movements.map((movement, index) => {
        const values = Array.from({ length: n }, (_, at) => movement.values.cells?.[at]?.repetitions ?? null);
        const sized = heights(values);
        return values.map((value, at) => work(index, value === null ? "—" : String(value), sized[at]));
      });
      return { blocks: scaleRepetitions(execution === "ALTERNATED" ? interleave(lists) : sequence(lists, false), movements), end: duration, legendRecovery: false };
    }
    case "SUPERSET": {
      if (count === 0) return { blocks: generic(2), end: duration, legendRecovery: false };
      // Complément du 5 novembre 2026 (Hermann), §11 : séries alternées — A1, B1, récupération, A2, B2… ; valeurs du tour.
      const rounds = answers.roundCount ?? 3;
      const blocks: TimelineBlock[] = [];
      for (let round = 0; round < rounds; round += 1) {
        movements.forEach((movement, index) => blocks.push(work(index, cellLabel(movement, round))));
        if (round < rounds - 1) blocks.push({ kind: "REST", label: null, weight: 1 });
      }
      return { blocks: scaleRepetitions(blocks, movements), end: duration, legendRecovery: true };
    }
    case "EMOM": {
      const n = answers.seriesCount ?? 1;
      // Complément du 5 novembre 2026 (Hermann), §14 : valeur de chaque série S1…Sn.
      if (count <= 1)
        return { blocks: count === 0 ? generic(n) : scaleRepetitions(Array.from({ length: n }, (_, at) => work(0, cellLabel(movements[0]!, at))), movements), end: duration, legendRecovery: false };
      if (execution === "EACH_INTERVAL") {
        return {
          blocks: scaleRepetitions(Array.from({ length: n }, (_, at) => movements.map((movement, index) => work(index, cellLabel(movement, at)))).flat(), movements),
          grouped: true,
          end: duration,
          legendRecovery: false,
        };
      }
      const lists = movements.map((movement, index) => Array.from({ length: n }, (_, at) => work(index, cellLabel(movement, at))));
      const recovery = execution === "SEQUENCE" && (answers.recoveryBetweenSeconds ?? 0) > 0;
      const ordered = execution === "ALTERNATED" ? interleave(lists) : sequence(lists, recovery, restWeight(answers.recoveryBetweenSeconds, answers.intervalSeconds));
      return { blocks: scaleRepetitions(ordered, movements), end: duration, legendRecovery: recovery };
    }
    case "DEATH_BY": {
      // Recette du 16/11/2026 (r16-deathby-depart) : Départ et Incrément sans valeur par défaut — l'illustration part de 1 / + 1 tant
      // qu'ils ne sont pas saisis. À plusieurs mouvements, Départ et Incrément propres à chacun.
      const rankOf = (movement: number | null, index: number) => {
        const values = movement === null ? undefined : movements[movement]?.values;
        const start = (several ? values?.start : (answers.startRepetitions ?? values?.start)) ?? 1;
        const increment = (several ? values?.startIncrement : (answers.increment ?? values?.startIncrement)) ?? 1;
        return start + index * increment;
      };
      const ranks = Array.from({ length: OPEN_FIRST }, (_, index) => index);
      // Complément du 5 novembre 2026 (Hermann), §13 : valeurs dans l'unité du mouvement (« 10 s », « 20 s »…).
      const rankLabel = (movement: number | null, value: number) => (movement !== null && movements[movement] !== undefined ? objectiveLabel(movements[movement]!, value) : String(value));
      // Constat c du 16/11/2026 : hauteurs rapportées au plus grand rang affiché de tout le Déroulé ; « n » au plus haut.
      const amountOf = (block: TimelineBlock): BlockAmount => {
        if (block.kind !== "WORK" || block.label === null || block.label === "n") return null;
        if (block.movement === null) return /^\d+$/.test(block.label) ? { duration: false, value: Number(block.label) } : null;
        return labelAmount(block, movements);
      };
      const open = (movement: number | null) => [
        ...ranks.map((index) => work(movement, rankLabel(movement, rankOf(movement, index)))),
        { kind: "ELLIPSIS" as const },
        work(movement, "n", 1),
      ];
      const end: TimelineEnd = { kind: "UNTIL_FAILURE" };
      if (count <= 1) return { blocks: scaleRepetitions(open(count === 0 ? null : 0), movements, amountOf, true), end, legendRecovery: false };
      if (execution === "SEQUENCE") {
        const recovery = (answers.recoveryBetweenSeconds ?? 0) > 0;
        const ordered = sequence(movements.map((_, index) => open(index)), recovery, restWeight(answers.recoveryBetweenSeconds, answers.intervalSeconds));
        return { blocks: scaleRepetitions(ordered, movements, amountOf, true), end, legendRecovery: recovery };
      }
      const perRank = (rank: number | null) => movements.map((_, index) => work(index, rank === null ? "n" : rankLabel(index, rankOf(index, rank))));
      const blocks: TimelineBlock[] = [...ranks.flatMap((index) => perRank(index)), { kind: "ELLIPSIS" }, ...perRank(null)];
      return { blocks: scaleRepetitions(blocks, movements, amountOf, true), ...(execution === "EACH_INTERVAL" ? { grouped: true as const } : {}), end, legendRecovery: false };
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
      // Recette du 08/11/2026 au soir (Hermann : « Il faut retirer la limite d'un exercice ») : un bloc par buy-in, dans l'ordre,
      // puis les tours. [Un seul buy-in, premier mouvement — remplacé le 08/11/2026.]
      const buyIn = hasChosenBuyIn(answers, movements);
      const indexed = movements.map((movement, index) => ({ movement, index }));
      const ins = buyIn ? indexed.filter(({ movement }) => movement.buyIn === true) : [];
      const loop = indexed.filter(({ movement }) => !buyIn || movement.buyIn !== true);
      const increasing = answers.increasingVolume === true;
      const labelAt = (movement: ModelMovement, round: number | null) => {
        if (movement.values.max === true) return "max";
        const base = movement.values.repetitions ?? repetitionsOf(movement);
        if (base === null) return "—";
        // Complément du 5 novembre 2026 (Hermann), §8 : progression descendante bornée à 1 (5, 3, 1, 1…).
        return round === null ? "n" : objectiveLabel(movement, increasing ? amrapRoundTarget(base, movement.values.increment ?? 0, round) : base);
      };
      const roundBlocks = (round: number | null) => loop.map(({ movement, index }) => work(index, labelAt(movement, round)));
      const blocks: TimelineBlock[] = [
        ...ins.map(
          ({ movement, index }): TimelineBlock => ({
            kind: "WORK",
            movement: index,
            // Décision de Hermann du 15/11/2026 (« Retirer le texte « buy in » et « buy out » du cadre d'illustration ») : volume seul (« 50 »).
            // [« 50 · buy-in » — remplacé.]
            label: movement.values.repetitions == null ? "—" : objectiveLabel(movement, movement.values.repetitions),
            // Recette du 16/11/2026 (r16b-deroule-hauteur, Hermann : « AMRAP, déroulé : - buy in, la largeur du Buy In doit être identique aux autres cadres - les dernières cases "n" doivent être plus haute que l'avant dernière (idem pour le format à l'échec) ») : largeur d'une case. [2,5 cases — remplacé le 16/11/2026.]
            weight: 1,
            height: 1,
            buyIn: true,
          }),
        ),
        ...[0, 1, 2].flatMap((round) => roundBlocks(round)),
        { kind: "ELLIPSIS" },
        ...roundBlocks(null),
      ];
      // Constat c du 16/11/2026 : hauteur selon le volume (buy-in compris) ; « n » d'un volume constant a la hauteur de ce volume.
      const amountOf = (block: TimelineBlock): BlockAmount => {
        if (block.kind !== "WORK" || block.movement === null) return null;
        const movement = movements[block.movement];
        if (movement === undefined) return null;
        if (block.label === "n" && !increasing && movement.values.max !== true) {
          const base = movement.values.repetitions ?? repetitionsOf(movement);
          return base === null ? null : { duration: movement.values.mode === "DURATION", value: base };
        }
        return labelAmount(block, movements);
      };
      return { blocks: scaleRepetitions(blocks, movements, amountOf, increasing), continuous: true, end: { kind: "DURATION" }, legendRecovery: false };
    }
    case "FOR_TIME": {
      const rounds = answers.roundCount ?? 1;
      if (count === 0) return { blocks: generic(rounds), end: { kind: "MEASURED" }, legendRecovery: false };
      // Recette du 04/11/2026 (interrupteurs Buy-in / Buy-out) : buy-in une fois au départ, tours, buy-out une fois à la fin.
      const indexed = movements.map((movement, index) => ({ movement, index, role: movementRole(movement) }));
      const tours = indexed.filter((item) => item.role === "TOUR");
      const once = (role: "BUY_IN" | "BUY_OUT") =>
        indexed
          .filter((item) => item.role === role)
          // Règles de Hermann du 14/11/2026 (FT-4) : chaque série du buy-in ou du buy-out. [Une seule exécution — remplacé.]
          .flatMap(({ movement, index }): TimelineBlock[] =>
            (movement.values.volumes !== undefined && movement.values.volumes.length > 0 ? movement.values.volumes : [null]).map((value) => ({
              kind: "WORK",
              movement: index,
              // Décision de Hermann du 15/11/2026 (« Retirer le texte « buy in » et « buy out » du cadre d’illustration » ; CE-FMT-02 §8,
              // Déroulé) : volume seul. [« 21 · buy-in », « 20 · buy-out » — remplacé.]
              label: value === null ? "—" : objectiveLabel(movement, value),
              weight: 2.5,
              height: 1,
              buyIn: true,
            })),
          );
      const block = ({ movement, index }: (typeof tours)[number], round: number) => {
        const value = movement.values.volumes?.[round] ?? null;
        return work(index, value === null ? "—" : objectiveLabel(movement, value), value === null ? 0.35 : 1);
      };
      // Décision de Hermann du 14/11/2026 (« C'est exactement ça, Buy In, tous les tours de A, tous les tours de B..., Buy out ») : « À la suite », tous les tours de chaque exercice avant le suivant.
      const sequence = forTimeInSequence(answers, movements);
      const blocks = [
        ...once("BUY_IN"),
        ...(sequence
          ? tours.flatMap((item) => Array.from({ length: rounds }, (_, round) => block(item, round)))
          : Array.from({ length: rounds }, (_, round) => tours.map((item) => block(item, round))).flat()),
        ...once("BUY_OUT"),
      ];
      // Constat c du 16/11/2026 : hauteurs rapportées au plus grand volume de tout le Déroulé, buy-in et buy-out compris (Répétitions et
      // Durées séparément). [Rapportées au plus grand volume des tours, buy-in et buy-out à pleine hauteur — remplacé.]
      return { blocks: scaleRepetitions(blocks, movements), end: { kind: "MEASURED" }, legendRecovery: false };
    }
    default: {
      const unreachable: never = key;
      return unreachable;
    }
  }
}
