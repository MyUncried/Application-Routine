/**
 * PRE-9 C.3 / C.4 — questionnaires et récapitulatifs des modèles de la fenêtre Formats, et structure
 * qu'ils ajoutent au brouillon (référence Formats du 02/11/2026 §1, §2, §7, §9 à §12, §15 ; CE-FMT-02 ;
 * FMT-10 à FMT-33).
 *
 * - **Questionnaire** : paramètres indépendants des mouvements (`ModelAnswers`), valeurs initiales
 *   décidées seulement (ch07 « Défauts validés », référence §7.1, §9, §10, §11, §12, FMT-28) ; aucune
 *   valeur de maquette n'est un défaut. Pause et récupération non décidées : valeurs du Profil, déjà
 *   portées par l'Exercice de base (§14.3).
 * - **Récapitulatif** : valeurs par mouvement (`MovementValues`) — répétitions, Max et incrément
 *   (AMRAP), volumes par tour (For time), répétitions et charges par série (Progression). Changer N
 *   ajoute des lignes « à compléter » et retire le surplus, sans confirmation ni valeur inventée (A6,
 *   §9.3).
 * - **Structure** (`buildModelElements`) : Exercices standards (Tabata, départs rapides), Exercices
 *   formatés autonomes, Circuit standard (alternance, Superset) ou Circuit porteur du Format d'origine
 *   (§1 : AMRAP à plusieurs mouvements, blocs, buy-in ou repos de boucle ; For time à plusieurs
 *   mouvements ; EMOM et Death by « dans chaque intervalle » ; Death by en alternance).
 * - **Ajout au brouillon** (`appendModelToDraft`) : « Enregistrer dans la séance » ajoute la structure
 *   à la fin de la Composition, sans sauvegarde définitive (CE-FMT-02 §Persistance).
 *
 * B10 (différé) : aucun modèle sans Mouvement, aucun « Mouvement libre ». Fonctions pures.
 */

import {
  failureTarget,
  numberTarget,
  unsetTarget,
  type ExecutionMode,
  type ExecutionParametersInput,
  type SeriesRow,
  type SeriesTarget,
} from "@/domain/activities/ExecutionParameters";

import type { CircuitNature } from "./circuit";
import type { ElementFormat, ElementFormatKey, PreconfigurationKey } from "./formats";
import { currentLayout, withLayout } from "./layoutOperations";
import type { SessionDraft, SessionDraftExercise } from "./SessionDraft";
import { computeStructureDuration, type StructureCircuit, type StructureElement } from "./structure";
import type { SessionDurationResult } from "@/domain/activities/executionCalculations";

export type FormatModelKey = ElementFormatKey | PreconfigurationKey;

export const FORMAT_MODEL_KEYS: readonly FormatModelKey[] = [
  "TABATA",
  "INTERVALS_30_30",
  "EMOM",
  "AMRAP",
  "FOR_TIME",
  "DEATH_BY",
  "STRENGTH",
  "SUPERSET",
  "PROGRESSION",
  "UNTIL_FAILURE",
];

export function isFormatModelKey(value: unknown): value is FormatModelKey {
  return typeof value === "string" && (FORMAT_MODEL_KEYS as readonly string[]).includes(value);
}

/** Exécution avec plusieurs mouvements (FMT-11, FMT-20, §12) ; FMT-15 : dernière ligne des paramètres. */
export type ModelExecution = "SEQUENCE" | "ALTERNATED" | "EACH_INTERVAL";

/** Réponses du questionnaire (paramètres indépendants des mouvements). */
export type ModelAnswers = {
  readonly seriesCount?: number;
  readonly workSeconds?: number;
  readonly pauseSeconds?: number;
  readonly repetitions?: number;
  readonly intervalSeconds?: number;
  readonly startRepetitions?: number;
  readonly increment?: number;
  readonly durationSeconds?: number;
  readonly blockCount?: number;
  readonly restBetweenBlocksSeconds?: number;
  readonly loopRestSeconds?: number;
  readonly buyIn?: boolean;
  readonly increasingVolume?: boolean;
  readonly roundCount?: number;
  /** For time : temps limite ; `null` = « Sans limite » (§11). */
  readonly timeCapSeconds?: number | null;
  readonly restBetweenRoundsSeconds?: number;
  /** Récupération entre les mouvements (À la suite, §9, §10, §12) ; Superset : après la paire. */
  readonly recoveryBetweenSeconds?: number;
  readonly execution?: ModelExecution;
};

/** Paramètre de réglage d'un questionnaire, dans l'ordre d'affichage. */
export type ModelAnswerKey = Exclude<keyof ModelAnswers, "execution">;

const MINUTE = 60;

/** Valeurs initiales décidées (ch07 « Défauts validés », référence §7.1, §9, §10, §11, §12 ; FMT-28). */
export function initialAnswers(key: FormatModelKey): ModelAnswers {
  switch (key) {
    case "TABATA":
      return { seriesCount: 8, workSeconds: 20, pauseSeconds: 10, recoveryBetweenSeconds: MINUTE, execution: "SEQUENCE" };
    case "INTERVALS_30_30":
      return { seriesCount: 6, workSeconds: 30, pauseSeconds: 30, execution: "SEQUENCE" };
    case "EMOM":
      return { seriesCount: 6, intervalSeconds: MINUTE, recoveryBetweenSeconds: MINUTE, execution: "EACH_INTERVAL" };
    case "AMRAP":
      return { durationSeconds: 12 * MINUTE, blockCount: 1, restBetweenBlocksSeconds: 2 * MINUTE, loopRestSeconds: 0, buyIn: false, increasingVolume: false };
    case "FOR_TIME":
      return { roundCount: 3, timeCapSeconds: null, restBetweenRoundsSeconds: 0 };
    case "DEATH_BY":
      return { intervalSeconds: MINUTE, startRepetitions: 1, increment: 1, recoveryBetweenSeconds: MINUTE, execution: "SEQUENCE" };
    case "STRENGTH":
      return { seriesCount: 3, repetitions: 15, execution: "SEQUENCE" };
    case "SUPERSET":
      return { roundCount: 1 };
    case "PROGRESSION":
      return { seriesCount: 3, execution: "SEQUENCE" };
    case "UNTIL_FAILURE":
      return { seriesCount: 3, execution: "SEQUENCE" };
    default: {
      const unreachable: never = key;
      return unreachable;
    }
  }
}

/** Options d'exécution proposées à partir de deux mouvements ; vide : aucun choix (For time, AMRAP, Superset). */
export function executionOptions(key: FormatModelKey): readonly ModelExecution[] {
  switch (key) {
    case "EMOM":
      return ["EACH_INTERVAL", "SEQUENCE", "ALTERNATED"];
    case "DEATH_BY":
      return ["SEQUENCE", "ALTERNATED", "EACH_INTERVAL"];
    case "TABATA":
    case "INTERVALS_30_30":
    case "STRENGTH":
    case "PROGRESSION":
    case "UNTIL_FAILURE":
      return ["SEQUENCE", "ALTERNATED"];
    default:
      return [];
  }
}

/** Bornes de saisie des réglages (bornes existantes de même sens : compte 1..99, durées positives). */
const ANSWER_BOUNDS: Readonly<Record<ModelAnswerKey, { readonly min: number; readonly max: number }>> = {
  seriesCount: { min: 1, max: 99 },
  workSeconds: { min: 1, max: 3600 },
  pauseSeconds: { min: 0, max: 3600 },
  repetitions: { min: 0, max: 999 },
  intervalSeconds: { min: 5, max: 3600 },
  startRepetitions: { min: 1, max: 999 },
  increment: { min: 1, max: 999 },
  durationSeconds: { min: MINUTE, max: 180 * MINUTE },
  blockCount: { min: 1, max: 99 },
  restBetweenBlocksSeconds: { min: 0, max: 3600 },
  loopRestSeconds: { min: 0, max: 3600 },
  buyIn: { min: 0, max: 1 },
  increasingVolume: { min: 0, max: 1 },
  roundCount: { min: 1, max: 99 },
  timeCapSeconds: { min: MINUTE, max: 180 * MINUTE },
  restBetweenRoundsSeconds: { min: 0, max: 3600 },
  recoveryBetweenSeconds: { min: 0, max: 3600 },
};

export function answerBounds(id: ModelAnswerKey): { readonly min: number; readonly max: number } {
  return ANSWER_BOUNDS[id];
}

/** Réponse bornée ; `null` (temps limite seulement) : « Sans limite ». */
export function withAnswer(answers: ModelAnswers, id: ModelAnswerKey, value: number | boolean | null): ModelAnswers {
  if (typeof value === "boolean" || value === null) return { ...answers, [id]: value };
  const { min, max } = ANSWER_BOUNDS[id];
  return { ...answers, [id]: Math.min(max, Math.max(min, Math.round(value))) };
}

// ---------------------------------------------------------------------------
// Valeurs par mouvement (récapitulatif)
// ---------------------------------------------------------------------------

/** Cellule d'une série : répétitions et charge ; `null` = à compléter. */
export type SeriesCell = { readonly repetitions: number | null; readonly loadKg: number | null };

export type MovementValues = {
  /** AMRAP : répétitions par tour, ou Max (À l'échec) ; buy-in : volume. */
  readonly repetitions?: number | null;
  readonly max?: boolean;
  /** AMRAP (Volume croissant) : incrément par tour, ≥ 0. */
  readonly increment?: number;
  /** For time : volume de chaque tour (Séries variables), `null` = à compléter. */
  readonly volumes?: readonly (number | null)[];
  /** Progression : répétitions et charge de chaque série. */
  readonly cells?: readonly SeriesCell[];
};

/** Mouvement du modèle : Exercice de base (paramètres du Profil) et valeurs du récapitulatif. */
export type ModelMovement = {
  readonly exercise: SessionDraftExercise;
  readonly values: MovementValues;
};

const PROGRESSION_INITIAL = [10, 12, 14];
const FOR_TIME_INITIAL = [21, 15, 9];

function baseRepetitions(exercise: SessionDraftExercise): number | null {
  const series = exercise.executionParameters.series;
  const target = series.kind === "UNIFORM" ? series.target : series.rows[0]?.target;
  return exercise.executionParameters.mode === "REPETITIONS" && target !== undefined && target.kind === "NUMBER" ? target.value : null;
}

function baseLoad(exercise: SessionDraftExercise): number {
  const series = exercise.executionParameters.series;
  return series.kind === "UNIFORM" ? series.loadKg : (series.rows[0]?.loadKg ?? 0);
}

/** Valeurs initiales d'un mouvement ajouté (valeurs décidées, sinon celles de l'Exercice de base). */
export function initialMovementValues(key: FormatModelKey, answers: ModelAnswers, exercise: SessionDraftExercise): MovementValues {
  switch (key) {
    case "AMRAP":
      return { repetitions: baseRepetitions(exercise), max: false, increment: 0 };
    case "FOR_TIME":
      return { volumes: resizeList(FOR_TIME_INITIAL, answers.roundCount ?? 3) };
    case "PROGRESSION": {
      const loadKg = exercise.executionParameters.loadEnabled ? baseLoad(exercise) : null;
      return { cells: resizeList(PROGRESSION_INITIAL, answers.seriesCount ?? 3).map((repetitions) => ({ repetitions, loadKg })) };
    }
    default:
      return {};
  }
}

/** Liste adaptée à N : valeurs existantes conservées, lignes ajoutées « à compléter », surplus retiré (A6). */
export function resizeList<T>(values: readonly T[], count: number): (T | null)[] {
  return Array.from({ length: count }, (_, index) => (index < values.length ? values[index]! : null));
}

/** Adaptation des valeurs par mouvement après un changement de N (For time : tours ; Progression : séries). */
export function adaptMovementsToAnswers(key: FormatModelKey, answers: ModelAnswers, movements: readonly ModelMovement[]): readonly ModelMovement[] {
  if (key === "FOR_TIME") {
    const count = answers.roundCount ?? 3;
    return movements.map((movement) => ({ ...movement, values: { ...movement.values, volumes: resizeList(movement.values.volumes ?? [], count) } }));
  }
  if (key === "PROGRESSION") {
    const count = answers.seriesCount ?? 3;
    return movements.map((movement) => ({
      ...movement,
      values: {
        ...movement.values,
        cells: resizeList(movement.values.cells ?? [], count).map((cell) => cell ?? { repetitions: null, loadKg: null }),
      },
    }));
  }
  return movements;
}

// ---------------------------------------------------------------------------
// Structure produite
// ---------------------------------------------------------------------------

const target = (value: number | null): SeriesTarget => (value === null ? unsetTarget() : numberTarget(value));

function uniform(base: ExecutionParametersInput, mode: ExecutionMode, count: number, seriesTarget: SeriesTarget, pauseSeconds: number): ExecutionParametersInput {
  const loadKg = base.series.kind === "UNIFORM" ? base.series.loadKg : (base.series.rows[0]?.loadKg ?? 0);
  return { ...base, mode, series: { kind: "UNIFORM", count, target: seriesTarget, pauseSeconds, loadKg, workPhases: base.series.workPhases } };
}

function variable(base: ExecutionParametersInput, rows: readonly SeriesRow[]): ExecutionParametersInput {
  return { ...base, mode: "REPETITIONS", series: { kind: "VARIABLE", rows, workPhases: base.series.workPhases } };
}

function basePause(exercise: SessionDraftExercise): number {
  const series = exercise.executionParameters.series;
  return series.kind === "UNIFORM" ? series.pauseSeconds : (series.rows[0]?.pauseSeconds ?? 0);
}

/** Pause d'un modèle : réponse du questionnaire, sinon celle de l'Exercice de base (Profil). */
function pauseOf(answers: ModelAnswers, exercise: SessionDraftExercise): number {
  return answers.pauseSeconds ?? basePause(exercise);
}

function withParameters(exercise: SessionDraftExercise, executionParameters: ExecutionParametersInput, recovery: number, format: ElementFormat | null): SessionDraftExercise {
  const { format: _previous, ...rest } = exercise;
  return { ...rest, executionParameters, postActivityRecoverySeconds: recovery, ...(format !== null ? { format } : {}) };
}

type BuiltElement = StructureElement<SessionDraftExercise>;

function standardCircuit(id: string, nature: CircuitNature, repeatCount: number, exercises: readonly SessionDraftExercise[]): BuiltElement {
  return { kind: "CIRCUIT", circuit: { id, nature, repeatCount, exercises } };
}

function carrierCircuit(id: string, nature: CircuitNature, repeatCount: number, format: ElementFormat, exercises: readonly SessionDraftExercise[]): BuiltElement {
  const circuit: StructureCircuit<SessionDraftExercise> = { id, nature, repeatCount, format, exercises };
  return { kind: "CIRCUIT", circuit };
}

/** « À la suite » : Exercices successifs, récupération entre les mouvements sur chacun sauf le dernier. */
function inSequence(exercises: readonly SessionDraftExercise[], recoveryBetween: number | undefined): BuiltElement[] {
  return exercises.map((exercise, index) => ({
    kind: "EXERCISE",
    exercise:
      recoveryBetween === undefined
        ? exercise
        : { ...exercise, postActivityRecoverySeconds: index < exercises.length - 1 ? recoveryBetween : 0 },
  }));
}

/**
 * Éléments produits par le modèle pour ses mouvements (dans l'ordre), `newId` fournissant les identités
 * de conteneur. Aucun élément sans mouvement (B10).
 */
export function buildModelElements(
  key: FormatModelKey,
  answers: ModelAnswers,
  movements: readonly ModelMovement[],
  newId: () => string,
): readonly BuiltElement[] {
  if (movements.length === 0) return [];
  const several = movements.length > 1;
  const execution = several ? (answers.execution ?? executionOptions(key)[0] ?? "SEQUENCE") : "SEQUENCE";
  switch (key) {
    case "TABATA":
    case "INTERVALS_30_30": {
      // §9, §9.2 : Exercices standards (Mode Durée, N séries identiques, travail, pause) ; aucune constante.
      const count = answers.seriesCount ?? 1;
      const exercises = movements.map(({ exercise }) =>
        withParameters(exercise, uniform(exercise.executionParameters, "DURATION", count, numberTarget(answers.workSeconds ?? 0), answers.pauseSeconds ?? 0), 0, null),
      );
      if (execution === "ALTERNATED") return [standardCircuit(newId(), "SERIES", count, exercises)];
      return inSequence(exercises, key === "TABATA" && several ? answers.recoveryBetweenSeconds : undefined);
    }
    case "STRENGTH":
    case "UNTIL_FAILURE": {
      const count = answers.seriesCount ?? 1;
      const exercises = movements.map(({ exercise }) =>
        withParameters(
          exercise,
          uniform(exercise.executionParameters, "REPETITIONS", count, key === "STRENGTH" ? numberTarget(answers.repetitions ?? 0) : failureTarget(), pauseOf(answers, exercise)),
          exercise.postActivityRecoverySeconds ?? 0,
          null,
        ),
      );
      return execution === "ALTERNATED" ? [standardCircuit(newId(), "SERIES", count, exercises)] : inSequence(exercises, undefined);
    }
    case "PROGRESSION": {
      const count = answers.seriesCount ?? 1;
      const exercises = movements.map(({ exercise, values }) => {
        const pause = pauseOf(answers, exercise);
        const rows = resizeList(values.cells ?? [], count).map((cell) => ({
          target: target(cell?.repetitions ?? null),
          pauseSeconds: pause,
          loadKg: cell?.loadKg ?? 0,
        }));
        return withParameters(exercise, variable(exercise.executionParameters, rows), exercise.postActivityRecoverySeconds ?? 0, null);
      });
      return execution === "ALTERNATED" ? [standardCircuit(newId(), "SERIES", count, exercises)] : inSequence(exercises, undefined);
    }
    case "SUPERSET": {
      // §9.2, A4 : Circuit standard groupé d'un passage, paramètres libres (répétitions à compléter).
      const exercises = movements.map(({ exercise }, index) =>
        withParameters(
          exercise,
          uniform(exercise.executionParameters, "REPETITIONS", 1, unsetTarget(), basePause(exercise)),
          index === movements.length - 1 ? (answers.recoveryBetweenSeconds ?? exercise.postActivityRecoverySeconds ?? 0) : 0,
          null,
        ),
      );
      return [standardCircuit(newId(), "TOURS", answers.roundCount ?? 1, exercises)];
    }
    case "EMOM": {
      const count = answers.seriesCount ?? 1;
      const interval = answers.intervalSeconds ?? MINUTE;
      if (execution === "EACH_INTERVAL") {
        // §10 : Circuit porteur, tours = N, durée de chaque tour = intervalle ; membres sans Séries ni Intervalle.
        const members = movements.map(({ exercise }) =>
          withParameters(exercise, uniform(exercise.executionParameters, exercise.executionParameters.mode ?? "REPETITIONS", 1, firstTarget(exercise), 0), 0, {
            key: "EMOM",
            settings: {},
          }),
        );
        return [carrierCircuit(newId(), "TOURS", count, { key: "EMOM", settings: { windowSeconds: interval } }, members)];
      }
      const exercises = movements.map(({ exercise }) =>
        withParameters(exercise, uniform(exercise.executionParameters, exercise.executionParameters.mode ?? "REPETITIONS", count, firstTarget(exercise), 0), 0, {
          key: "EMOM",
          settings: { intervalSeconds: interval },
        }),
      );
      return execution === "ALTERNATED" ? [standardCircuit(newId(), "SERIES", count, exercises)] : inSequence(exercises, several ? answers.recoveryBetweenSeconds : undefined);
    }
    case "DEATH_BY": {
      const interval = answers.intervalSeconds ?? MINUTE;
      const increment = answers.increment ?? 1;
      const start = numberTarget(answers.startRepetitions ?? 1);
      const params = (exercise: SessionDraftExercise) => uniform(exercise.executionParameters, "REPETITIONS", 1, start, 0);
      if (execution === "EACH_INTERVAL") {
        const members = movements.map(({ exercise }) => withParameters(exercise, params(exercise), 0, { key: "DEATH_BY", settings: { incrementPerRound: increment } }));
        return [carrierCircuit(newId(), "TOURS", 1, { key: "DEATH_BY", settings: { windowSeconds: interval } }, members)];
      }
      if (execution === "ALTERNATED") {
        // A2 : Format au Circuit, intervalles propres aux membres, aucune durée d'en-tête.
        const members = movements.map(({ exercise }) =>
          withParameters(exercise, params(exercise), 0, { key: "DEATH_BY", settings: { incrementPerRound: increment, intervalSeconds: interval } }),
        );
        return [carrierCircuit(newId(), "SERIES", 1, { key: "DEATH_BY", settings: {} }, members)];
      }
      const exercises = movements.map(({ exercise }) =>
        withParameters(exercise, params(exercise), 0, { key: "DEATH_BY", settings: { intervalSeconds: interval, incrementPerRound: increment } }),
      );
      return inSequence(exercises, several ? answers.recoveryBetweenSeconds : undefined);
    }
    case "AMRAP": {
      const duration = answers.durationSeconds ?? 12 * MINUTE;
      const blocks = answers.blockCount ?? 1;
      const loopRest = answers.loopRestSeconds ?? 0;
      const buyIn = answers.buyIn === true && several;
      const increasing = answers.increasingVolume === true;
      const params = (exercise: SessionDraftExercise, values: MovementValues, once: boolean) =>
        once || values.max !== true
          ? uniform(exercise.executionParameters, "REPETITIONS", 1, target(values.repetitions ?? null), 0)
          : uniform(exercise.executionParameters, exercise.executionParameters.mode ?? "REPETITIONS", 1, failureTarget(), 0);
      const incrementOf = (values: MovementValues, once: boolean) => (once || !increasing || values.max === true ? 0 : (values.increment ?? 0));
      // §1, §2.2 : Exercice autonome seulement pour un mouvement, un bloc, sans buy-in ni repos de boucle.
      if (!several && blocks === 1 && loopRest === 0) {
        const [{ exercise, values }] = movements as [ModelMovement];
        return [
          {
            kind: "EXERCISE",
            exercise: withParameters(exercise, params(exercise, values, false), 0, {
              key: "AMRAP",
              settings: { durationSeconds: duration, incrementPerRound: incrementOf(values, false) },
            }),
          },
        ];
      }
      const members = movements.map(({ exercise, values }, index) => {
        const once = buyIn && index === 0;
        const isLast = index === movements.length - 1;
        // §2.2 : le repos de boucle initialise la récupération du dernier membre ; les autres, et le buy-in, à 0 s.
        return withParameters(exercise, params(exercise, values, once), isLast && !once ? loopRest : 0, {
          key: "AMRAP",
          settings: { incrementPerRound: incrementOf(values, once), ...(once ? { passageOnce: 1 } : {}) },
        });
      });
      return [
        carrierCircuit(newId(), "TOURS", blocks, { key: "AMRAP", settings: { blockSeconds: duration, restBetweenBlocksSeconds: answers.restBetweenBlocksSeconds ?? 0 } }, members),
      ];
    }
    case "FOR_TIME": {
      const rounds = answers.roundCount ?? 1;
      const rest = answers.restBetweenRoundsSeconds ?? 0;
      const cap = answers.timeCapSeconds ?? null;
      const rows = (values: MovementValues): SeriesRow[] =>
        resizeList(values.volumes ?? [], rounds).map((volume) => ({ target: target(volume ?? null), pauseSeconds: several ? 0 : rest, loadKg: 0 }));
      if (!several) {
        const [{ exercise, values }] = movements as [ModelMovement];
        return [
          {
            kind: "EXERCISE",
            exercise: withParameters(exercise, withLoad(variable(exercise.executionParameters, rows(values)), exercise), 0, {
              key: "FOR_TIME",
              settings: cap === null ? {} : { timeCapSeconds: cap },
            }),
          },
        ];
      }
      const members = movements.map(({ exercise, values }) =>
        withParameters(exercise, withLoad(variable(exercise.executionParameters, rows(values)), exercise), 0, { key: "FOR_TIME", settings: {} }),
      );
      return [
        carrierCircuit(
          newId(),
          "SERIES",
          rounds,
          { key: "FOR_TIME", settings: { restBetweenRoundsSeconds: rest, ...(cap === null ? {} : { timeCapSeconds: cap }) } },
          members,
        ),
      ];
    }
    default: {
      const unreachable: never = key;
      return unreachable;
    }
  }
}

/** Charge commune de l'Exercice de base reportée sur les séries variables (charge compatible conservée). */
function withLoad(parameters: ExecutionParametersInput, exercise: SessionDraftExercise): ExecutionParametersInput {
  if (parameters.series.kind !== "VARIABLE") return parameters;
  const loadKg = baseLoad(exercise);
  return { ...parameters, series: { ...parameters.series, rows: parameters.series.rows.map((row) => ({ ...row, loadKg })) } };
}

function firstTarget(exercise: SessionDraftExercise): SeriesTarget {
  const series = exercise.executionParameters.series;
  return (series.kind === "UNIFORM" ? series.target : series.rows[0]?.target) ?? unsetTarget();
}

/** Durée totale de la structure produite (B.7, D.1) ; `null` sans mouvement. */
export function modelDuration(elements: readonly BuiltElement[]): SessionDurationResult | null {
  return elements.length === 0 ? null : computeStructureDuration<SessionDraftExercise>({ elements });
}

function elementExercises(element: BuiltElement): readonly SessionDraftExercise[] {
  switch (element.kind) {
    case "EXERCISE":
      return [element.exercise];
    case "CIRCUIT":
      return element.circuit.exercises;
    case "CYCLE":
      return element.cycle.members.flatMap((member) => (member.kind === "CIRCUIT" ? member.circuit.exercises : [member.exercise]));
    default: {
      const unreachable: never = element;
      return unreachable;
    }
  }
}

/**
 * « Enregistrer dans la séance » : la structure produite rejoint la fin du brouillon de Composition,
 * Circuits et Exercices existants conservés ; aucune sauvegarde définitive (CE-FMT-02, FMT-29).
 */
export function appendModelToDraft(draft: SessionDraft, built: readonly BuiltElement[], newContainerId: () => string): SessionDraft {
  if (built.length === 0) return draft;
  // Recette iPhone n° 3 du 02/11/2026 (f3-questionnaire) : un identifiant déjà présent dans la Composition
  // (questionnaire rouvert sur un brouillon déjà enregistré) est remplacé — deux occurrences ne partagent
  // jamais une identité (sélection, appui long et déplacement les confondraient).
  const taken = new Set(draft.exercises.map((exercise) => exercise.id));
  const fresh = (exercise: SessionDraftExercise): SessionDraftExercise => {
    if (!taken.has(exercise.id)) {
      taken.add(exercise.id);
      return exercise;
    }
    let id = newContainerId();
    for (let attempt = 1; taken.has(id); attempt += 1) id = `${newContainerId()}-${attempt}`;
    taken.add(id);
    return { ...exercise, id };
  };
  const elements = built.map((element): BuiltElement => {
    switch (element.kind) {
      case "EXERCISE":
        return { kind: "EXERCISE", exercise: fresh(element.exercise) };
      case "CIRCUIT":
        return { kind: "CIRCUIT", circuit: { ...element.circuit, exercises: element.circuit.exercises.map(fresh) } };
      default:
        throw new Error("Un modèle ne produit pas de Cycle.");
    }
  });
  const added = elements.flatMap(elementExercises).map((exercise) => ({ ...exercise, structuralPosition: "BEFORE_TOUR" as const }));
  const layout = currentLayout(draft, newContainerId);
  const ids = (element: BuiltElement): StructureElement<string> => {
    switch (element.kind) {
      case "EXERCISE":
        return { kind: "EXERCISE", exercise: element.exercise.id };
      case "CIRCUIT":
        return { kind: "CIRCUIT", circuit: { ...element.circuit, exercises: element.circuit.exercises.map((exercise) => exercise.id) } };
      default:
        throw new Error("Un modèle ne produit pas de Cycle.");
    }
  };
  return withLayout({ ...draft, exercises: [...draft.exercises, ...added] }, { ...layout, elements: [...layout.elements, ...elements.map(ids)] });
}
