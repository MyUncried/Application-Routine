/**
 * PRE-9 C.3 / C.4 — questionnaires et récapitulatifs des modèles de la fenêtre Formats, et structure
 * qu'ils ajoutent au brouillon (référence Formats du 02/11/2026, actualisée au 04/11 : §1, §2, §3, §6, §7,
 * §9 à §12, §15 ; mise à jour consolidée des écrans Formats du 04/11/2026 ; CE-FMT-02 ; FMT-10 à FMT-33).
 *
 * - **Questionnaire** : paramètres indépendants des mouvements (`ModelAnswers`), valeurs initiales
 *   décidées seulement (ch07 « Défauts validés », référence §7.1, §9, §10, §11, §12, FMT-28) ; aucune
 *   valeur de maquette n'est un défaut. Pause et récupération non décidées : valeurs du Profil, déjà
 *   portées par l'Exercice de base (§14.3). Interrupteur « Avec charge » (Progression, For time, AMRAP,
 *   EMOM ; désactivé par défaut, MAJ 04/11 §6 quater et §6 quater bis).
 * - **Récapitulatif** : valeurs par mouvement (`MovementValues`), chaque ligne étant un Exercice (MAJ 04/11
 *   §4.4) : unité de l'objectif (Mode), objectif, Max, incrément par tour (AMRAP), charge fixe (AMRAP),
 *   charge de départ et incrément par série (EMOM), départ et incrément (Death by à plusieurs mouvements),
 *   objectifs et charges par tour (For time) ou par série (Progression). Ces valeurs ne forment pas un second
 *   stockage : elles n'existent que pendant le parcours et s'écrivent dans les **champs standards** des
 *   Exercices produits (`buildModelElements`) ; la réédition les relit depuis ces champs (`modelStateOfCircuit`).
 *   Changer d'unité remet l'objectif « à renseigner », sans conversion.
 * - **Validation** (`summaryIssues`) : « Enregistrer dans la séance » n'est actif que si le formulaire est
 *   complet et cohérent — objectifs renseignés, contrôle EMOM des durées au seuil inclusif (MAJ 04/11 §4.4).
 *   Une charge vide ne bloque pas.
 * - **Structure** (`buildModelElements`) : Exercice seul ; dès deux Exercices, toujours un Circuit (MAJ 04/11
 *   §6 ter) — Circuit porteur du Format d'origine (AMRAP, For time, EMOM et Death by « dans chaque
 *   intervalle », Death by en alternance), Circuit standard « alternées » (Tabata, EMOM, Renforcement,
 *   Progression, À l'échec en alternance), Circuit standard « groupées » à un tour (À la suite, Superset).
 *   Tout Circuit porte son Modèle d'origine (`originModel`). [« À la suite » en Exercices successifs, sans
 *   Circuit — remplacé le 04/11/2026.]
 * - **Ajout au brouillon** (`appendModelToDraft`) : « Enregistrer dans la séance » ajoute la structure
 *   à la fin de la Composition, sans sauvegarde définitive (CE-FMT-02 §Persistance).
 *
 * B10 (différé) : aucun modèle sans Mouvement, aucun « Mouvement libre ». Fonctions pures.
 */

import {
  failureTarget,
  isBilateral,
  numberTarget,
  unsetTarget,
  type ExecutionMode,
  type ExecutionParametersInput,
  type SeriesRow,
  type SeriesTarget,
} from "@/domain/activities/ExecutionParameters";

import type { CircuitNature } from "./circuit";
import { withCircuitRole, type CircuitRole, type ElementFormat, type ElementFormatKey, type PreconfigurationKey } from "./formats";
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
  /**
   * For time : interrupteur « Buy-out » du questionnaire (recette du 04/11/2026, Hermann : « Questionnaire : il manque les
   * interrupteurs Buy-in et Buy-out ») ; `buyIn` sert aussi au For time.
   */
  readonly buyOut?: boolean;
  readonly increasingVolume?: boolean;
  /** « Avec charge » (Progression, For time, AMRAP, EMOM) : désactivé par défaut (MAJ 04/11 §6 quater bis). */
  readonly withLoad?: boolean;
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

/** Modèles dotés de l'interrupteur « Avec charge » (Tabata et 30/30 : non, MAJ 04/11 §6 quater bis). */
export function hasLoadSwitch(key: FormatModelKey): boolean {
  return key === "PROGRESSION" || key === "FOR_TIME" || key === "AMRAP" || key === "EMOM";
}

/** Valeurs initiales décidées (ch07 « Défauts validés », référence §7.1, §9, §10, §11, §12 ; FMT-28). */
export function initialAnswers(key: FormatModelKey): ModelAnswers {
  switch (key) {
    case "TABATA":
      return { seriesCount: 8, workSeconds: 20, pauseSeconds: 10, recoveryBetweenSeconds: MINUTE, execution: "SEQUENCE" };
    case "INTERVALS_30_30":
      return { seriesCount: 6, workSeconds: 30, pauseSeconds: 30, execution: "SEQUENCE" };
    case "EMOM":
      return { seriesCount: 6, intervalSeconds: MINUTE, recoveryBetweenSeconds: MINUTE, withLoad: false, execution: "EACH_INTERVAL" };
    case "AMRAP":
      return { durationSeconds: 12 * MINUTE, blockCount: 1, restBetweenBlocksSeconds: 2 * MINUTE, loopRestSeconds: 0, buyIn: false, increasingVolume: false, withLoad: false };
    case "FOR_TIME":
      return { roundCount: 3, timeCapSeconds: null, restBetweenRoundsSeconds: 0, buyIn: false, buyOut: false, withLoad: false };
    case "DEATH_BY":
      return { intervalSeconds: MINUTE, startRepetitions: 1, increment: 1, recoveryBetweenSeconds: MINUTE, execution: "SEQUENCE" };
    case "STRENGTH":
      return { seriesCount: 3, repetitions: 15, execution: "SEQUENCE" };
    case "SUPERSET":
      return { roundCount: 1 };
    case "PROGRESSION":
      return { seriesCount: 3, withLoad: false, execution: "SEQUENCE" };
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
  buyOut: { min: 0, max: 1 },
  increasingVolume: { min: 0, max: 1 },
  withLoad: { min: 0, max: 1 },
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

/** Cellule d'une série (Progression) : objectif et charge ; `null` = à renseigner (objectif) ou sans charge. */
export type SeriesCell = { readonly repetitions: number | null; readonly loadKg: number | null };

export type MovementValues = {
  /**
   * Unité de l'objectif : Mode de l'Exercice (Répétitions / Durée), réglé au clavier (MAJ 04/11 §4.5). Absente :
   * Répétitions. Les valeurs d'objectif sont dans cette unité (répétitions ou secondes).
   */
  readonly mode?: ExecutionMode;
  /** AMRAP, EMOM : objectif de chaque série ou tour ; `null` = à renseigner. */
  readonly repetitions?: number | null;
  /** AMRAP : Max (Condition d'arrêt À l'échec) — grise l'Objectif et Par tour, pas la Charge. */
  readonly max?: boolean;
  /**
   * AMRAP (Volume croissant) : incrément par tour, ≥ 0, dans l'unité de l'objectif ; `null` = à renseigner.
   * Contre-recette n° 3 ter du 03/11/2026 (« Les cellules d'incrément doivent être rouges et avec "+" uniquement
   * (sans le 0) ») : aucun incrément initial au récapitulatif.
   */
  readonly increment?: number | null;
  /** AMRAP : charge fixe ; EMOM : charge de départ. `null` : sans charge (jamais une charge 0, §6 quater bis). */
  readonly loadKg?: number | null;
  /** EMOM : incrément de charge par série, + 0 par défaut (charge fixe) ; `null` : « variable » (réédition). */
  readonly loadIncrement?: number | null;
  /** EMOM : charges effectives des séries, quand elles ne suivent plus départ + incrément (réédition). */
  readonly seriesLoads?: readonly number[];
  /** Death by à plusieurs mouvements : départ et incrément propres au mouvement (MAJ 04/11 §4.3, ≥ + 1). */
  readonly start?: number | null;
  readonly startIncrement?: number | null;
  /** For time : objectif de chaque tour (Séries variables), `null` = à renseigner. */
  readonly volumes?: readonly (number | null)[];
  /** For time : charge de chaque tour, `null` = sans charge. */
  readonly loads?: readonly (number | null)[];
  /** Progression : objectif et charge de chaque série. */
  readonly cells?: readonly SeriesCell[];
};

/** Mouvement du modèle : Exercice de base (paramètres du Profil) et valeurs du récapitulatif. */
export type ModelMovement = {
  readonly exercise: SessionDraftExercise;
  readonly values: MovementValues;
  /**
   * AMRAP : mouvement choisi dans la section Buy-in (toujours en tête). Recette iPhone n° 3 du 03/11/2026
   * (autres constats, Hermann : « Il faut sélectionner le mouvement de Buy-in pour que le bouton d'action soit
   * activé ») : le buy-in est un choix explicite, jamais déduit du rang. Rôle Buy-in (MAJ 04/11 §6 bis 2).
   */
  readonly buyIn?: true;
  /** For time (réédition) : Rôle Buy-out, zone de fin. */
  readonly buyOut?: true;
};

/** Rôle dans le circuit d'un mouvement du modèle. */
export function movementRole(movement: ModelMovement): CircuitRole {
  return movement.buyIn === true ? "BUY_IN" : movement.buyOut === true ? "BUY_OUT" : "TOUR";
}

/** AMRAP : un buy-in est choisi (Buy-in activé, premier mouvement marqué) et suivi d'au moins un mouvement de boucle. */
export function hasChosenBuyIn(answers: ModelAnswers, movements: readonly ModelMovement[]): boolean {
  return answers.buyIn === true && movements.some((movement) => movement.buyIn === true) && movements.some((movement) => movement.buyIn !== true);
}

/** Modèles dont le questionnaire porte les interrupteurs de Rôle : AMRAP (Buy-in), For time (Buy-in, Buy-out). */
export function roleSwitches(key: FormatModelKey): readonly ("buyIn" | "buyOut")[] {
  return key === "AMRAP" ? ["buyIn"] : key === "FOR_TIME" ? ["buyIn", "buyOut"] : [];
}

/**
 * Rôles requis par les interrupteurs : Buy-in activé, un buy-in choisi ; Buy-out activé (For time), un buy-out choisi ;
 * toujours au moins un mouvement en Tour (référence Formats §3). Sans interrupteur actif : au moins un mouvement.
 */
export function hasRequiredRoles(key: FormatModelKey, answers: ModelAnswers, movements: readonly ModelMovement[]): boolean {
  const switches = roleSwitches(key);
  const needIn = switches.includes("buyIn") && answers.buyIn === true;
  const needOut = switches.includes("buyOut") && answers.buyOut === true;
  return (
    movements.some((movement) => movementRole(movement) === "TOUR") &&
    (!needIn || movements.some((movement) => movement.buyIn === true)) &&
    (!needOut || movements.some((movement) => movement.buyOut === true))
  );
}

const PROGRESSION_INITIAL = [10, 12, 14];
const FOR_TIME_INITIAL = [21, 15, 9];

function baseTarget(exercise: SessionDraftExercise, mode: ExecutionMode): number | null {
  const series = exercise.executionParameters.series;
  const target = series.kind === "UNIFORM" ? series.target : series.rows[0]?.target;
  return (exercise.executionParameters.mode ?? "REPETITIONS") === mode && target !== undefined && target.kind === "NUMBER" ? target.value : null;
}

/** Valeurs initiales d'un mouvement ajouté (valeurs décidées, sinon celles de l'Exercice de base). */
export function initialMovementValues(key: FormatModelKey, answers: ModelAnswers, exercise: SessionDraftExercise): MovementValues {
  switch (key) {
    case "AMRAP":
      return { mode: "REPETITIONS", repetitions: baseTarget(exercise, "REPETITIONS"), max: false, increment: null, loadKg: null };
    case "EMOM":
      // Recette du 04/11/2026 (Hermann, EMOM : « Aucun mode d'exécution par défaut, le champ de valeur a un fond rouge ») :
      // ligne sans unité, objectif à renseigner ; l'unité se choisit au clavier. [MAJ 04/11 §4.4 et référence §7.6 « EMOM
      // en mode Répétitions » à la création — remplacé.]
      return { repetitions: null, loadKg: null, loadIncrement: 0 };
    case "DEATH_BY":
      return { start: answers.startRepetitions ?? 1, startIncrement: answers.increment ?? 1 };
    case "FOR_TIME":
      return { mode: "REPETITIONS", volumes: resizeList(FOR_TIME_INITIAL, answers.roundCount ?? 3), loads: [] };
    case "PROGRESSION":
      return { mode: "REPETITIONS", cells: resizeList(PROGRESSION_INITIAL, answers.seriesCount ?? 3).map((repetitions) => ({ repetitions, loadKg: null })) };
    default:
      return {};
  }
}

/**
 * Changement d'unité d'une ligne (MAJ 04/11 §4.4, §4.5) : le Mode change, l'objectif devient « à renseigner »
 * dans la nouvelle unité — ni conversion ni valeur inventée ; l'incrément par tour aussi (il suit l'unité).
 * Les charges et le reste sont conservés.
 */
export function withMovementMode(values: MovementValues, mode: ExecutionMode): MovementValues {
  // Ligne sans unité (EMOM à la création) : l'unité choisie est posée, l'objectif reste à renseigner.
  if (values.mode === undefined) return { ...values, mode };
  if (values.mode === mode) return values;
  return {
    ...values,
    mode,
    ...(values.repetitions !== undefined ? { repetitions: null } : {}),
    ...(values.increment !== undefined && values.increment !== 0 ? { increment: null } : {}),
    ...(values.volumes !== undefined ? { volumes: values.volumes.map(() => null) } : {}),
    ...(values.cells !== undefined ? { cells: values.cells.map((cell) => ({ ...cell, repetitions: null })) } : {}),
  };
}

/** Unités proposées au clavier selon le contexte (MAJ 04/11 §4.5). */
export function allowedModes(key: FormatModelKey, movements: readonly ModelMovement[], index: number): readonly ExecutionMode[] {
  const both: readonly ExecutionMode[] = ["REPETITIONS", "DURATION"];
  if (key === "AMRAP") return movements.length > 1 ? both : ["REPETITIONS"];
  if (key === "FOR_TIME") {
    // Au moins un Exercice de l'ensemble du Circuit en Répétitions (buy-in et buy-out compris).
    const others = movements.filter((_, at) => at !== index);
    const lastRepetitions = movements.length > 0 && others.every((movement) => (movement.values.mode ?? "REPETITIONS") !== "REPETITIONS");
    return lastRepetitions && (movements[index]?.values.mode ?? "REPETITIONS") === "REPETITIONS" ? ["REPETITIONS"] : both;
  }
  return both;
}

/** Charges EMOM effectives : départ, puis + incrément à chaque série (MAJ 04/11 §6 quater bis). */
export function emomSeriesLoads(start: number, increment: number, count: number): number[] {
  return Array.from({ length: count }, (_, index) => roundLoad(start + increment * index));
}

/** Charge au quart de kilogramme (valeurs admises, AD-19). */
function roundLoad(value: number): number {
  return Math.round(value * 4) / 4;
}

/** Valeur d'un problème de formulaire : ligne et champ, ou réglage commun. */
export type SummaryIssue =
  | { readonly kind: "MISSING"; readonly index: number }
  | { readonly kind: "EMOM_DURATION"; readonly indexes: readonly number[] };

/**
 * Travail prévu d'un Exercice en Durée, dans un intervalle EMOM (MAJ 04/11 §4.4) : son objectif de durée,
 * × 2 s'il est fait de chaque côté, plus la pause entre les côtés si elle s'applique ; 0 en Répétitions.
 */
/** Travail prévu d'un Exercice d'après ses paramètres (première série), pour le contrôle EMOM de la modale. */
export function plannedWorkOfParameters(parameters: Pick<ExecutionParametersInput, "mode" | "series" | "sideMode" | "sideRecoverySeconds">): number {
  if (parameters.mode !== "DURATION") return 0;
  const series = parameters.series;
  const first = series.kind === "UNIFORM" ? series.target : series.rows[0]?.target;
  if (first === undefined || first.kind !== "NUMBER") return 0;
  const bilateral = isBilateral(parameters.sideMode);
  return first.value * (bilateral ? 2 : 1) + (bilateral ? parameters.sideRecoverySeconds : 0);
}

export function plannedWorkSeconds(exercise: SessionDraftExercise, values: MovementValues): number {
  if ((values.mode ?? "REPETITIONS") !== "DURATION" || values.repetitions == null) return 0;
  const parameters = exercise.executionParameters;
  const bilateral = isBilateral(parameters.sideMode);
  return values.repetitions * (bilateral ? 2 : 1) + (bilateral ? parameters.sideRecoverySeconds : 0);
}

/**
 * Contrôle EMOM des durées — seuil inclusif (décision de Hermann du 03/11/2026, MAJ 04/11 §4.4) : EMOM simple, en
 * alternance ou À la suite, le travail prévu d'un Exercice atteint ou dépasse son Intervalle ; « dans chaque
 * intervalle », la somme du travail prévu des membres atteint ou dépasse l'intervalle commun. Rend les lignes
 * en cause (vide : aucun dépassement).
 */
export function emomDurationOverflow(answers: ModelAnswers, movements: readonly ModelMovement[]): readonly number[] {
  const interval = answers.intervalSeconds ?? MINUTE;
  const work = movements.map((movement) => plannedWorkSeconds(movement.exercise, movement.values));
  const eachInterval = movements.length > 1 && (answers.execution ?? "EACH_INTERVAL") === "EACH_INTERVAL";
  if (eachInterval) {
    const sum = work.reduce((total, value) => total + value, 0);
    return sum >= interval ? work.flatMap((value, index) => (value > 0 ? [index] : [])) : [];
  }
  return work.flatMap((value, index) => (value >= interval ? [index] : []));
}

/**
 * Formulaire complet et cohérent (contre-recette n° 3 ter du 03/11/2026 ; MAJ 04/11 §4.4, « Enregistrement —
 * décision de Hermann du 3 novembre ») : chaque objectif affiché renseigné (sauf Max), incrément si Volume
 * croissant, départ et incrément du Death by à plusieurs mouvements ; contrôle EMOM des durées. Une charge vide
 * ne bloque pas.
 */
export function summaryIssues(key: FormatModelKey, answers: ModelAnswers, movements: readonly ModelMovement[]): readonly SummaryIssue[] {
  const issues: SummaryIssue[] = [];
  const several = movements.length > 1;
  movements.forEach((movement, index) => {
    const values = movement.values;
    const complete = (() => {
      switch (key) {
        case "AMRAP": {
          if (values.max === true) return true;
          const tour = movementRole(movement) === "TOUR";
          return values.repetitions != null && (!tour || answers.increasingVolume !== true || values.increment != null);
        }
        case "EMOM":
          return values.repetitions != null;
        case "DEATH_BY":
          return !several || (values.start != null && values.start >= 1 && values.startIncrement != null && values.startIncrement >= 1);
        case "FOR_TIME":
          // Buy-in et buy-out : une seule exécution (une case).
          return Array.from({ length: movementRole(movement) === "TOUR" ? (answers.roundCount ?? 1) : 1 }, (_, at) => values.volumes?.[at] ?? null).every((volume) => volume !== null);
        case "PROGRESSION":
          return Array.from({ length: answers.seriesCount ?? 1 }, (_, at) => values.cells?.[at] ?? null).every((cell) => cell !== null && cell.repetitions !== null);
        default:
          return true;
      }
    })();
    if (!complete) issues.push({ kind: "MISSING", index });
  });
  if (key === "EMOM") {
    const overflow = emomDurationOverflow(answers, movements);
    if (overflow.length > 0) issues.push({ kind: "EMOM_DURATION", indexes: overflow });
  }
  return issues;
}

/** Récapitulatif complet et cohérent (voir `summaryIssues`). */
export function hasCompleteValues(key: FormatModelKey, answers: ModelAnswers, movements: readonly ModelMovement[]): boolean {
  return summaryIssues(key, answers, movements).length === 0;
}

/** Liste adaptée à N : valeurs existantes conservées, lignes ajoutées « à compléter », surplus retiré (A6). */
export function resizeList<T>(values: readonly T[], count: number): (T | null)[] {
  return Array.from({ length: count }, (_, index) => (index < values.length ? values[index]! : null));
}

/** Liste allongée à N au moins : valeurs existantes, au-delà comprises, conservées ; lignes ajoutées « à compléter ». */
export function extendList<T>(values: readonly T[], count: number): (T | null)[] {
  return Array.from({ length: Math.max(count, values.length) }, (_, index) => (index < values.length ? values[index]! : null));
}

/**
 * Adaptation des valeurs par mouvement après un changement de N (For time : tours ; Progression : séries).
 *
 * Contre-recette n° 3 ter du 03/11/2026 (f3-fortime, Hermann : « passage de 3 à 4 séries, entrer les données,
 * puis retour à 3 : les valeurs ont disparues, elles devraient être retrouvées, idem si je repasse à 4, etc. ») :
 * pendant le questionnaire et le récapitulatif, les valeurs au-delà de N sont gardées en réserve, non affichées
 * et sans effet sur la structure produite (`buildModelElements` ne lit que les N premières) ; repasser à un N
 * plus grand les retrouve. [§11 A6 : « à la diminution, retirer les lignes au-delà du nouveau N » — remplacé pour
 * le récapitulatif ; la structure enregistrée ne contient toujours que N lignes.]
 */
export function adaptMovementsToAnswers(key: FormatModelKey, answers: ModelAnswers, movements: readonly ModelMovement[]): readonly ModelMovement[] {
  if (key === "FOR_TIME") {
    const count = answers.roundCount ?? 3;
    return movements.map((movement) => ({ ...movement, values: { ...movement.values, volumes: extendList(movement.values.volumes ?? [], count) } }));
  }
  if (key === "PROGRESSION") {
    const count = answers.seriesCount ?? 3;
    return movements.map((movement) => ({
      ...movement,
      values: {
        ...movement.values,
        cells: extendList(movement.values.cells ?? [], count).map((cell) => cell ?? { repetitions: null, loadKg: null }),
      },
    }));
  }
  return movements;
}

// ---------------------------------------------------------------------------
// Structure produite
// ---------------------------------------------------------------------------

const target = (value: number | null | undefined): SeriesTarget => (value === null || value === undefined ? unsetTarget() : numberTarget(value));

function uniform(base: ExecutionParametersInput, mode: ExecutionMode, count: number, seriesTarget: SeriesTarget, pauseSeconds: number): ExecutionParametersInput {
  const loadKg = base.series.kind === "UNIFORM" ? base.series.loadKg : (base.series.rows[0]?.loadKg ?? 0);
  return { ...base, mode, series: { kind: "UNIFORM", count, target: seriesTarget, pauseSeconds, loadKg, workPhases: base.series.workPhases } };
}

function variable(base: ExecutionParametersInput, mode: ExecutionMode, rows: readonly SeriesRow[]): ExecutionParametersInput {
  return { ...base, mode, series: { kind: "VARIABLE", rows, workPhases: base.series.workPhases } };
}

/**
 * Charge d'un Exercice produit par un modèle doté de l'interrupteur (MAJ 04/11 §6 quater bis) : désactivé, aucune
 * charge n'est créée (Charge « Sans », valeurs du Profil conservées) ; activé, la Charge est « Avec » dès qu'une
 * valeur est saisie. Une case vide est une série sans charge (0 kg = aucune charge pour la série, AD-19) : jamais
 * une valeur 0 saisie.
 */
function withLoadSwitch(parameters: ExecutionParametersInput, enabled: boolean, anyLoad: boolean): ExecutionParametersInput {
  return { ...parameters, loadEnabled: enabled && anyLoad };
}

function withUniformLoad(parameters: ExecutionParametersInput, loadKg: number | null | undefined): ExecutionParametersInput {
  if (parameters.series.kind !== "UNIFORM" || loadKg === null || loadKg === undefined) return parameters;
  return { ...parameters, series: { ...parameters.series, loadKg } };
}

export function basePause(exercise: SessionDraftExercise): number {
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

/**
 * Recette iPhone n° 3 du 03/11/2026 (autres constats, Hermann : « il faut que le nom du circuit soit
 * "Tabata", idem pour tous les formats ») : tout Circuit construit par un modèle porte son modèle
 * d'origine (`originModel`), affiché à la place de « Circuit ». MAJ 04/11 §6 sexies.2 : Modèle d'origine,
 * distinct du Format d'origine (`format`, Circuits porteurs seulement).
 */
function standardCircuit(key: FormatModelKey, id: string, nature: CircuitNature, repeatCount: number, exercises: readonly SessionDraftExercise[]): BuiltElement {
  return { kind: "CIRCUIT", circuit: { id, nature, repeatCount, exercises, originModel: key } };
}

function carrierCircuit(key: FormatModelKey, id: string, nature: CircuitNature, repeatCount: number, format: ElementFormat, exercises: readonly SessionDraftExercise[]): BuiltElement {
  const circuit: StructureCircuit<SessionDraftExercise> = { id, nature, repeatCount, format, exercises, originModel: key };
  return { kind: "CIRCUIT", circuit };
}

/**
 * « À la suite » (MAJ 04/11 §6 ter) : dès deux Exercices, Circuit standard « groupées » à un tour — chaque
 * Exercice fait toutes ses séries, puis le suivant ; la récupération entre les mouvements reste la Récupération de
 * chaque Exercice, 0 s sur le dernier. Un seul Exercice : posé seul. [Exercices successifs sans Circuit — remplacé.]
 */
function inSequence(key: FormatModelKey, newId: () => string, exercises: readonly SessionDraftExercise[], recoveryBetween: number | undefined): BuiltElement[] {
  const recovered = exercises.map((exercise, index) =>
    recoveryBetween === undefined ? exercise : { ...exercise, postActivityRecoverySeconds: index < exercises.length - 1 ? recoveryBetween : 0 },
  );
  if (recovered.length === 1) return [{ kind: "EXERCISE", exercise: recovered[0]! }];
  return [standardCircuit(key, newId(), "TOURS", 1, recovered)];
}

/** Paramètres EMOM d'une ligne : objectif dans son unité, charge de départ et incrément par série. */
function emomParameters(exercise: SessionDraftExercise, values: MovementValues, count: number, withLoad: boolean): ExecutionParametersInput {
  const mode = values.mode ?? "REPETITIONS";
  const base = uniform(exercise.executionParameters, mode, count, target(values.repetitions), 0);
  const start = values.loadKg ?? null;
  if (!withLoad || start === null) return withLoadSwitch(base, withLoad, false);
  const loads = values.seriesLoads !== undefined && values.loadIncrement === null ? resizeList(values.seriesLoads, count).map((load) => load ?? 0) : emomSeriesLoads(start, values.loadIncrement ?? 0, count);
  if (loads.every((load) => load === loads[0])) return withLoadSwitch(withUniformLoad(base, loads[0] ?? start), true, true);
  return withLoadSwitch(variable(exercise.executionParameters, mode, loads.map((loadKg) => ({ target: target(values.repetitions), pauseSeconds: 0, loadKg }))), true, true);
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
  const withLoad = answers.withLoad === true;
  switch (key) {
    case "TABATA":
    case "INTERVALS_30_30": {
      // §9, §9.2 : Exercices standards (Mode Durée, N séries identiques, travail, pause) ; aucune constante.
      const count = answers.seriesCount ?? 1;
      const exercises = movements.map(({ exercise }) =>
        withParameters(exercise, uniform(exercise.executionParameters, "DURATION", count, numberTarget(answers.workSeconds ?? 0), answers.pauseSeconds ?? 0), 0, null),
      );
      if (execution === "ALTERNATED") return [standardCircuit(key, newId(), "SERIES", count, exercises)];
      return inSequence(key, newId, exercises, key === "TABATA" && several ? answers.recoveryBetweenSeconds : undefined);
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
      return execution === "ALTERNATED" ? [standardCircuit(key, newId(), "SERIES", count, exercises)] : inSequence(key, newId, exercises, undefined);
    }
    case "PROGRESSION": {
      const count = answers.seriesCount ?? 1;
      const exercises = movements.map(({ exercise, values }) => {
        const pause = pauseOf(answers, exercise);
        const cells = resizeList(values.cells ?? [], count);
        const rows = cells.map((cell) => ({ target: target(cell?.repetitions ?? null), pauseSeconds: pause, loadKg: withLoad ? (cell?.loadKg ?? 0) : 0 }));
        const anyLoad = withLoad && cells.some((cell) => cell?.loadKg != null && cell.loadKg > 0);
        const parameters = withLoad ? variable(exercise.executionParameters, values.mode ?? "REPETITIONS", rows) : variable(exercise.executionParameters, values.mode ?? "REPETITIONS", rows.map((row, at) => ({ ...row, loadKg: baseRowLoad(exercise, at) })));
        return withParameters(exercise, withLoadSwitch(parameters, withLoad, anyLoad), exercise.postActivityRecoverySeconds ?? 0, null);
      });
      return execution === "ALTERNATED" ? [standardCircuit(key, newId(), "SERIES", count, exercises)] : inSequence(key, newId, exercises, undefined);
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
      return [standardCircuit(key, newId(), "TOURS", answers.roundCount ?? 1, exercises)];
    }
    case "EMOM": {
      const count = answers.seriesCount ?? 1;
      const interval = answers.intervalSeconds ?? MINUTE;
      if (execution === "EACH_INTERVAL") {
        // §10 : Circuit porteur, tours = N, durée de chaque tour = intervalle ; membres sans Intervalle propre.
        // Chaque membre fait une série par tour (Circuit « groupées » de N tours) : il n'a qu'une série, donc une charge
        // fixe — la progression « + / série » n'y est pas représentable (À CLARIFIER, spec C.4 § Reprise du 04/11).
        const members = movements.map(({ exercise, values }) =>
          withParameters(exercise, emomParameters(exercise, { ...values, loadIncrement: 0, seriesLoads: undefined }, 1, withLoad), 0, { key: "EMOM", settings: {} }),
        );
        return [carrierCircuit(key, newId(), "TOURS", count, { key: "EMOM", settings: { windowSeconds: interval } }, members)];
      }
      const exercises = movements.map(({ exercise, values }) =>
        withParameters(exercise, emomParameters(exercise, values, count, withLoad), 0, { key: "EMOM", settings: { intervalSeconds: interval } }),
      );
      return execution === "ALTERNATED" ? [standardCircuit(key, newId(), "SERIES", count, exercises)] : inSequence(key, newId, exercises, several ? answers.recoveryBetweenSeconds : undefined);
    }
    case "DEATH_BY": {
      const interval = answers.intervalSeconds ?? MINUTE;
      // MAJ 04/11 §4.3 : à plusieurs mouvements, départ et incrément propres à chacun (tableau) ; seul, ceux du questionnaire.
      const startOf = (values: MovementValues) => numberTarget((several ? values.start : null) ?? answers.startRepetitions ?? 1);
      const incrementOf = (values: MovementValues) => Math.max(1, (several ? values.startIncrement : null) ?? answers.increment ?? 1);
      const params = (exercise: SessionDraftExercise, values: MovementValues) => uniform(exercise.executionParameters, "REPETITIONS", 1, startOf(values), 0);
      if (execution === "EACH_INTERVAL") {
        const members = movements.map(({ exercise, values }) => withParameters(exercise, params(exercise, values), 0, { key: "DEATH_BY", settings: { incrementPerRound: incrementOf(values) } }));
        return [carrierCircuit(key, newId(), "TOURS", 1, { key: "DEATH_BY", settings: { windowSeconds: interval } }, members)];
      }
      if (execution === "ALTERNATED") {
        // A2 : Format au Circuit, intervalles propres aux membres, aucune durée d'en-tête.
        const members = movements.map(({ exercise, values }) =>
          withParameters(exercise, params(exercise, values), 0, { key: "DEATH_BY", settings: { incrementPerRound: incrementOf(values), intervalSeconds: interval } }),
        );
        return [carrierCircuit(key, newId(), "SERIES", 1, { key: "DEATH_BY", settings: {} }, members)];
      }
      const exercises = movements.map(({ exercise, values }) =>
        withParameters(exercise, params(exercise, values), 0, { key: "DEATH_BY", settings: { intervalSeconds: interval, incrementPerRound: incrementOf(values) } }),
      );
      return inSequence(key, newId, exercises, several ? answers.recoveryBetweenSeconds : undefined);
    }
    case "AMRAP": {
      const duration = answers.durationSeconds ?? 12 * MINUTE;
      const blocks = answers.blockCount ?? 1;
      const loopRest = answers.loopRestSeconds ?? 0;
      const increasing = answers.increasingVolume === true;
      // MAJ 04/11 §4.3 bis, §6 bis 2 : Objectif en Répétitions ou Durée (AMRAP seul : Répétitions), Max (À l'échec,
      // buy-in compris) ; charge fixe ; buy-in : Incrément inactif, Récupération 0 s.
      const params = (exercise: SessionDraftExercise, values: MovementValues) => {
        const mode = several ? (values.mode ?? "REPETITIONS") : "REPETITIONS";
        const base = uniform(exercise.executionParameters, mode, 1, values.max === true ? failureTarget() : target(values.repetitions), 0);
        const load = withLoad ? (values.loadKg ?? null) : null;
        return withLoadSwitch(withUniformLoad(base, load), withLoad, load !== null && load > 0);
      };
      const incrementOf = (values: MovementValues, role: CircuitRole) => (role !== "TOUR" || !increasing || values.max === true ? 0 : (values.increment ?? 0));
      // §1, §2.2 : Exercice autonome seulement pour un mouvement, un bloc, sans buy-in ni repos de boucle.
      if (!several && blocks === 1 && loopRest === 0) {
        const [{ exercise, values }] = movements as [ModelMovement];
        return [
          {
            kind: "EXERCISE",
            exercise: withParameters(exercise, params(exercise, values), 0, {
              key: "AMRAP",
              settings: { durationSeconds: duration, incrementPerRound: incrementOf(values, "TOUR") },
            }),
          },
        ];
      }
      // Zones ordonnées : buy-in, puis boucle (MAJ 04/11 §6 bis 2).
      const ordered = [...movements.filter((movement) => movement.buyIn === true), ...movements.filter((movement) => movement.buyIn !== true)];
      const lastTour = ordered.length - 1;
      const members = ordered.map((movement, index) => {
        const role = answers.buyIn === true && movement.buyIn === true ? "BUY_IN" : "TOUR";
        // §2.2 : le repos de boucle initialise la récupération du dernier membre ; les autres, et le buy-in, à 0 s.
        const format = withCircuitRole({ key: "AMRAP", settings: { incrementPerRound: incrementOf(movement.values, role) } }, role);
        return withParameters(movement.exercise, params(movement.exercise, movement.values), index === lastTour && role === "TOUR" ? loopRest : 0, format);
      });
      return [
        carrierCircuit(key, newId(), "TOURS", blocks, { key: "AMRAP", settings: { blockSeconds: duration, restBetweenBlocksSeconds: answers.restBetweenBlocksSeconds ?? 0 } }, members),
      ];
    }
    case "FOR_TIME": {
      const rounds = answers.roundCount ?? 1;
      const rest = answers.restBetweenRoundsSeconds ?? 0;
      const cap = answers.timeCapSeconds ?? null;
      // MAJ 04/11 §6 quater bis : un objectif et une charge par tour (charge facultative), dans l'unité de la ligne.
      const parameters = (exercise: SessionDraftExercise, values: MovementValues, pauseSeconds: number, count: number) => {
        const loads = resizeList(values.loads ?? [], count);
        const rows = resizeList(values.volumes ?? [], count).map((volume, at) => ({
          target: target(volume ?? null),
          pauseSeconds,
          loadKg: withLoad ? (loads[at] ?? 0) : baseRowLoad(exercise, at),
        }));
        const anyLoad = withLoad && loads.some((load) => load != null && load > 0);
        return withLoadSwitch(variable(exercise.executionParameters, values.mode ?? "REPETITIONS", rows), withLoad, anyLoad);
      };
      if (!several) {
        const [{ exercise, values }] = movements as [ModelMovement];
        return [
          {
            kind: "EXERCISE",
            exercise: withParameters(exercise, parameters(exercise, values, rest, rounds), 0, {
              key: "FOR_TIME",
              settings: cap === null ? {} : { timeCapSeconds: cap },
            }),
          },
        ];
      }
      // Zones ordonnées : buy-in, tour, buy-out ; un buy-in ou buy-out : une seule exécution (MAJ 04/11 §6 bis 2).
      const ordered = [
        ...movements.filter((movement) => movementRole(movement) === "BUY_IN"),
        ...movements.filter((movement) => movementRole(movement) === "TOUR"),
        ...movements.filter((movement) => movementRole(movement) === "BUY_OUT"),
      ];
      const members = ordered.map((movement) => {
        const role = movementRole(movement);
        const count = role === "TOUR" ? rounds : 1;
        return withParameters(movement.exercise, parameters(movement.exercise, movement.values, 0, count), 0, withCircuitRole({ key: "FOR_TIME", settings: {} }, role));
      });
      return [
        carrierCircuit(
          key,
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

/** Charge de la série `at` de l'Exercice de base, conservée sous « Sans » (AD-19). */
function baseRowLoad(exercise: SessionDraftExercise, at: number): number {
  const series = exercise.executionParameters.series;
  return series.kind === "UNIFORM" ? series.loadKg : (series.rows[at]?.loadKg ?? series.rows[0]?.loadKg ?? 0);
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
