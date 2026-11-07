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
  /**
   * « Avec charge » : désactivé par défaut. Complément du 5 novembre 2026 (Hermann), §16 : dans les dix questionnaires ; son activation rend disponibles les
   * commandes locales « (+ kg) » / « (− kg) » sans charger les mouvements. [Progression, For time, AMRAP, EMOM seulement — remplacé.]
   */
  readonly withLoad?: boolean;
  readonly roundCount?: number;
  /** For time : temps limite ; `null` = « Sans limite » (§11). */
  readonly timeCapSeconds?: number | null;
  readonly restBetweenRoundsSeconds?: number;
  /** Récupération entre les mouvements (À la suite, §9, §10, §12) ; Superset : « Récupération après le tour » (dernier Exercice). */
  readonly recoveryBetweenSeconds?: number;
  readonly execution?: ModelExecution;
};

/** Paramètre de réglage d'un questionnaire, dans l'ordre d'affichage. */
export type ModelAnswerKey = Exclude<keyof ModelAnswers, "execution">;

const MINUTE = 60;

/**
 * Modèles dotés de l'interrupteur « Avec charge » — Complément du 5 novembre 2026 (Hermann), §16 : les dix questionnaires. [Progression, For time, AMRAP et
 * EMOM seulement (MAJ 04/11 §6 quater bis) — remplacé.]
 */
export function hasLoadSwitch(_key: FormatModelKey): boolean {
  return true;
}

/**
 * Charge décidée série par série (ligne de charge sous l'objectif, bouton « (+ kg) » / « (− kg) » sous l'unité) ou commune
 * au mouvement (colonne Charge, ou ligne Charge sous Durée totale avec un seul mouvement) — Complément du 5 novembre 2026 (Hermann), §9, §14–§17.
 */
export function chargePerSeries(key: FormatModelKey): boolean {
  return key === "PROGRESSION" || key === "FOR_TIME" || key === "SUPERSET" || key === "EMOM";
}

/** Charge appliquée à un mouvement : interrupteur du questionnaire et bouton local activés (§16). */
export function chargeActive(answers: ModelAnswers, values: MovementValues): boolean {
  return answers.withLoad === true && values.loadOn === true;
}

/** Valeurs initiales décidées (ch07 « Défauts validés », référence §7.1, §9, §10, §11, §12 ; FMT-28). */
export function initialAnswers(key: FormatModelKey): ModelAnswers {
  switch (key) {
    case "TABATA":
      return { seriesCount: 8, workSeconds: 20, pauseSeconds: 10, recoveryBetweenSeconds: MINUTE, withLoad: false, execution: "SEQUENCE" };
    case "INTERVALS_30_30":
      return { seriesCount: 6, workSeconds: 30, pauseSeconds: 30, withLoad: false, execution: "SEQUENCE" };
    case "EMOM":
      return { seriesCount: 6, intervalSeconds: MINUTE, recoveryBetweenSeconds: MINUTE, withLoad: false, execution: "EACH_INTERVAL" };
    case "AMRAP":
      return { durationSeconds: 12 * MINUTE, blockCount: 1, restBetweenBlocksSeconds: 2 * MINUTE, loopRestSeconds: 0, buyIn: false, increasingVolume: false, withLoad: false };
    case "FOR_TIME":
      return { roundCount: 3, timeCapSeconds: null, restBetweenRoundsSeconds: 0, buyIn: false, buyOut: false, withLoad: false };
    case "DEATH_BY":
      return { intervalSeconds: MINUTE, startRepetitions: 1, increment: 1, recoveryBetweenSeconds: MINUTE, withLoad: false, execution: "SEQUENCE" };
    case "STRENGTH":
      return { seriesCount: 3, repetitions: 15, withLoad: false, execution: "SEQUENCE" };
    case "SUPERSET":
      // Complément du 5 novembre 2026 (Hermann), §11 : Circuit standard à séries alternées, 3 tours par défaut. [Un passage groupé — remplacé.]
      return { roundCount: 3, withLoad: false };
    case "PROGRESSION":
      return { seriesCount: 3, withLoad: false, execution: "SEQUENCE" };
    case "UNTIL_FAILURE":
      return { seriesCount: 3, withLoad: false, execution: "SEQUENCE" };
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
   * AMRAP (Volume croissant) : incrément par tour, dans l'unité de l'objectif ; `null` = à renseigner. Contre-recette n° 3
   * ter du 03/11/2026 (« Les cellules d'incrément doivent être rouges et avec "+" uniquement (sans le 0) ») : aucun incrément
   * initial au récapitulatif (décision de Hermann du 05/11/2026 : case vide, rouge). Complément du 5 novembre 2026 (Hermann), §8 : incrément signé (« − 1 rép. »,
   * « − 5 s ») ; objectif calculé borné à 1 (`amrapRoundTarget`). [≥ 0 — remplacé.]
   */
  readonly increment?: number | null;
  /**
   * Charge commune du mouvement (AMRAP, Tabata, 30/30, Renforcement, À l'échec, Death by) ; `null` : sans charge (jamais une
   * charge 0). Gardée dans le brouillon quand la charge est retirée (« (− kg) », interrupteur) : restauration temporaire (§16).
   */
  readonly loadKg?: number | null;
  /**
   * Complément du 5 novembre 2026 (Hermann), §9, §16 : charge décidée mouvement par mouvement — « (+ kg) » l'active, « (− kg) » la retire en gardant ses valeurs
   * dans le brouillon ; absente : sans charge. [EMOM : charge de départ et incrément par série (`loadIncrement`,
   * `seriesLoads`) — remplacés par une charge par série (`cells`), §14.]
   */
  readonly loadOn?: boolean;
  /** Tabata, 30/30, Renforcement, À l'échec à plusieurs mouvements : Pause propre au mouvement (§15–§17) ; absente : commune. */
  readonly pause?: number | null;
  /**
   * Death by : départ et incrément propres au mouvement (MAJ 04/11 §4.3), dans l'unité du mouvement — Complément du 5 novembre 2026 (Hermann), §13 : Répétitions
   * ou Durée, incrément ≥ + 1 dans l'unité.
   */
  readonly start?: number | null;
  readonly startIncrement?: number | null;
  /** For time : objectif de chaque tour (Séries variables), `null` = à renseigner. */
  readonly volumes?: readonly (number | null)[];
  /** For time : charge de chaque tour, `null` = sans charge. */
  readonly loads?: readonly (number | null)[];
  /** Progression, EMOM (S1…Sn), Superset (Tour 1…n) : objectif et charge de chaque série (Complément du 5 novembre 2026 (Hermann), §11, §14, §17). */
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
      // ligne sans unité, objectifs à renseigner ; l'unité se choisit au clavier. Complément du 5 novembre 2026 (Hermann), §14 : une valeur par série S1…Sn,
      // sans incrément. [Préremplies depuis S1 — remplacé le 06/11/2026 (n-emom) : chaque série se saisit à la main.]
      return { cells: emptyCells(answers.seriesCount ?? 6) };
    case "SUPERSET":
      // Complément du 5 novembre 2026 (Hermann), §11 : tableau par tour ; cases initiales à renseigner. [Chaque tour prérempli avec la valeur du premier —
      // remplacé le 06/11/2026 (n-emom, réponse A de Hermann : « Oui retirée partout ») : chaque tour se saisit à la main.]
      return { mode: "REPETITIONS", cells: emptyCells(answers.roundCount ?? 3) };
    case "DEATH_BY":
      return { mode: "REPETITIONS", start: answers.startRepetitions ?? 1, startIncrement: answers.increment ?? 1 };
    case "FOR_TIME":
      return { mode: "REPETITIONS", volumes: resizeList(FOR_TIME_INITIAL, answers.roundCount ?? 3), loads: [] };
    case "PROGRESSION":
      return { mode: "REPETITIONS", cells: resizeList(PROGRESSION_INITIAL, answers.seriesCount ?? 3).map((repetitions) => ({ repetitions, loadKg: null })) };
    default:
      return {};
  }
}

function emptyCells(count: number): SeriesCell[] {
  return Array.from({ length: count }, () => ({ repetitions: null, loadKg: null }));
}

/**
 * Saisie d'une case de série (EMOM, Superset, Progression). Avec `propagate` (Complément du 5 novembre 2026, §11, §14, §17) : la valeur écrite dans
 * S1 se reporte sur les autres séries encore vides ou restées égales à l'ancienne valeur de S1. Recette du 06/11/2026 (n-emom, réponse A de
 * Hermann : « Oui retirée partout ») : les tableaux n'utilisent plus cette recopie (`propagate` toujours faux) ; chaque case ne touche qu'elle-même.
 */
export function withSeriesValue(cells: readonly SeriesCell[], column: number, field: keyof SeriesCell, value: number | null, propagate: boolean): SeriesCell[] {
  const next = cells.map((cell) => ({ ...cell }));
  while (next.length <= column) next.push({ repetitions: null, loadKg: null });
  const previous = next[column]![field];
  next[column] = { ...next[column]!, [field]: value };
  if (propagate && column === 0) {
    for (let at = 1; at < next.length; at += 1) {
      const current = next[at]![field];
      if (current === null || current === previous) next[at] = { ...next[at]!, [field]: value };
    }
  }
  return next;
}

/**
 * AMRAP — objectif calculé du tour `round` (0 = premier) : départ + incrément × tour, borné à 1 dans son unité si la
 * progression descend (Complément du 5 novembre 2026 (Hermann), §8 : « 5, 3, 1, 1, 1… » ; la boucle ne se termine pas à cette borne). Une progression
 * montante n'est pas bornée. Sans incrément actif (buy-in, Max) : l'objectif de départ.
 */
export function amrapRoundTarget(start: number, increment: number, round: number): number {
  const value = start + increment * round;
  return increment < 0 ? Math.max(1, value) : value;
}

/**
 * Changement d'unité d'une ligne (MAJ 04/11 §4.4, §4.5) : le Mode change, l'objectif devient « à renseigner »
 * dans la nouvelle unité — ni conversion ni valeur inventée ; l'incrément par tour aussi (il suit l'unité).
 * Les charges et le reste sont conservés.
 */
export function withMovementMode(values: MovementValues, mode: ExecutionMode): MovementValues {
  // Ligne sans unité (EMOM à la création) : une valeur déjà saisie est une valeur en Répétitions (Hermann, 04/11/2026) ;
  // choisir Répétitions la garde, choisir Durée est un changement d'unité (objectif à renseigner, sans conversion).
  if (values.mode === undefined) return mode === "REPETITIONS" ? { ...values, mode } : withMovementMode({ ...values, mode: "REPETITIONS" }, mode);
  if (values.mode === mode) return values;
  return {
    ...values,
    mode,
    // Objectif porté par la ligne (AMRAP), ou commun du questionnaire (Tabata, 30/30, Renforcement) : à renseigner.
    ...(values.volumes === undefined && values.cells === undefined && values.start === undefined ? { repetitions: null } : {}),
    ...(values.increment !== undefined && values.increment !== 0 ? { increment: null } : {}),
    ...(values.volumes !== undefined ? { volumes: values.volumes.map(() => null) } : {}),
    ...(values.cells !== undefined ? { cells: values.cells.map((cell) => ({ ...cell, repetitions: null })) } : {}),
    // Death by (Complément du 5 novembre 2026 (Hermann), §13) : « Le changement d'unité ne convertit pas les valeurs et laisse les champs incompatibles à renseigner. »
    ...(values.start !== undefined ? { start: null, startIncrement: null } : {}),
    // Recette du 05/11/2026 (n-charge-colonne, Hermann : « Max en Répétitions seulement. Dans un circuit AMRAP, un exercice en
    // Durée a toujours un objectif fixe ») : passer en Durée retire Max.
    ...(mode === "DURATION" && values.max === true ? { max: false } : {}),
  };
}

/**
 * Seul Exercice restant en Répétitions dont la Durée est refusée (For time ; AMRAP, boucle seulement) — recette du 05/11/2026
 * (n-charge-colonne, Hermann : « Au moins un exercice de la boucle en Répétitions, comme pour le For time, pour la même raison :
 * sinon le nombre de tours se calcule d'avance. Pour le seul exercice restant en Répétitions, l'option Durée est désactivée,
 * avec un message court »).
 */
export function lastRepetitionsLocked(key: FormatModelKey, movements: readonly ModelMovement[], index: number): boolean {
  const current = movements[index];
  if (current === undefined || (current.values.mode ?? "REPETITIONS") !== "REPETITIONS") return false;
  if (key === "FOR_TIME") return movements.filter((_, at) => at !== index).every((movement) => (movement.values.mode ?? "REPETITIONS") !== "REPETITIONS");
  if (key === "AMRAP") {
    if (movementRole(current) !== "TOUR") return false;
    return movements.filter((movement, at) => at !== index && movementRole(movement) === "TOUR").every((movement) => (movement.values.mode ?? "REPETITIONS") !== "REPETITIONS");
  }
  return false;
}

/** Unités proposées au clavier selon le contexte (MAJ 04/11 §4.5). */
export function allowedModes(key: FormatModelKey, movements: readonly ModelMovement[], index: number): readonly ExecutionMode[] {
  const both: readonly ExecutionMode[] = ["REPETITIONS", "DURATION"];
  // Recette du 05/11/2026 (n-tabata ; décision de Hermann du 05/11/2026, « Durée seule, sans choix ») : objectif du Tabata et du
  // 30/30 toujours en Durée. [Complément du 5 novembre 2026, §15 : « modifiable au clavier, Répétitions ou Durée » — remplacé.]
  if (key === "TABATA" || key === "INTERVALS_30_30") return ["DURATION"];
  // AMRAP : au moins un Exercice de la boucle en Répétitions (n-charge-colonne) ; buy-in libre. [Un seul mouvement en Répétitions,
  // plusieurs en Répétitions ou Durée — précisé.] For time : au moins un Exercice de l'ensemble du Circuit (buy-in et buy-out compris).
  if (key === "AMRAP" || key === "FOR_TIME") return lastRepetitionsLocked(key, movements, index) ? ["REPETITIONS"] : both;
  return both;
}

// [EMOM : charge de départ et incrément de charge par série (`emomSeriesLoads`, `emomNoLoadFrom`, « sans charge à partir de
// la série X », Hermann, 04/11/2026) — remplacés le 05/11/2026 (Complément du 5 novembre 2026 (Hermann), §14 : « Aucune mention de charge calculée
// nulle/négative ne s'applique » ; charges saisies série par série).]

/** Case d'un tableau en cause (ligne, colonne de série ; 0 pour une ligne sans séries). */
export type IssueCell = { readonly index: number; readonly column: number };

/** Valeur d'un problème de formulaire : ligne et champ, ou réglage commun. */
export type SummaryIssue =
  | { readonly kind: "MISSING"; readonly index: number }
  | { readonly kind: "MISSING_SETTING"; readonly id: ModelAnswerKey }
  | { readonly kind: "EMOM_DURATION"; readonly indexes: readonly number[]; readonly cells: readonly IssueCell[] };

/**
 * Travail prévu d'un Exercice en Durée, dans un intervalle EMOM (MAJ 04/11 §4.4) : son objectif de durée,
 * × 2 s'il est fait de chaque côté, plus la pause entre les côtés si elle s'applique ; 0 en Répétitions.
 */
/**
 * Travail prévu d'un Exercice d'après ses paramètres, pour la série `rank` (0 = première) : contrôle EMOM de la modale et de la
 * Composition (Complément du 5 novembre 2026 (Hermann), §14 : chaque série/fenêtre). Hors des séries : 0.
 */
export function plannedWorkOfParameters(parameters: Pick<ExecutionParametersInput, "mode" | "series" | "sideMode" | "sideRecoverySeconds">, rank = 0): number {
  if (parameters.mode !== "DURATION") return 0;
  const series = parameters.series;
  const row = series.kind === "UNIFORM" ? (rank < series.count ? series.target : undefined) : series.rows[rank]?.target;
  if (row === undefined || row.kind !== "NUMBER") return 0;
  const bilateral = isBilateral(parameters.sideMode);
  return row.value * (bilateral ? 2 : 1) + (bilateral ? parameters.sideRecoverySeconds : 0);
}

/** Travail prévu connu d'un objectif en Durée (les deux côtés et la pause entre côtés compris) ; 0 en Répétitions. */
export function plannedWorkOfTarget(exercise: SessionDraftExercise, mode: ExecutionMode | undefined, seconds: number | null | undefined): number {
  if ((mode ?? "REPETITIONS") !== "DURATION" || seconds == null) return 0;
  const parameters = exercise.executionParameters;
  const bilateral = isBilateral(parameters.sideMode);
  return seconds * (bilateral ? 2 : 1) + (bilateral ? parameters.sideRecoverySeconds : 0);
}

/** Travail prévu connu de la série `column` d'un mouvement EMOM. */
export function plannedWorkSeconds(exercise: SessionDraftExercise, values: MovementValues, column = 0): number {
  return plannedWorkOfTarget(exercise, values.mode, values.cells?.[column]?.repetitions ?? null);
}

/**
 * Contrôle EMOM des durées — seuil inclusif (décision de Hermann du 03/11/2026, MAJ 04/11 §4.4) — Complément du 5 novembre 2026 (Hermann), §14 : vérifié pour
 * chaque série/fenêtre ; EMOM simple, en alternance ou À la suite, le travail prévu de la série k d'un Exercice atteint ou
 * dépasse son Intervalle ; « dans chaque intervalle », la somme des travaux connus des membres pour le rang k atteint ou
 * dépasse l'intervalle commun. Les membres en Répétitions ne reçoivent aucune durée. Rend les cases en cause.
 */
export function emomDurationOverflow(answers: ModelAnswers, movements: readonly ModelMovement[]): readonly IssueCell[] {
  const interval = answers.intervalSeconds ?? MINUTE;
  const count = answers.seriesCount ?? 1;
  const eachInterval = movements.length > 1 && (answers.execution ?? "EACH_INTERVAL") === "EACH_INTERVAL";
  const cells: IssueCell[] = [];
  for (let column = 0; column < count; column += 1) {
    const work = movements.map((movement) => plannedWorkSeconds(movement.exercise, movement.values, column));
    if (eachInterval) {
      const sum = work.reduce((total, value) => total + value, 0);
      if (sum >= interval) work.forEach((value, index) => (value > 0 ? cells.push({ index, column }) : undefined));
    } else {
      work.forEach((value, index) => (value >= interval ? cells.push({ index, column }) : undefined));
    }
  }
  return cells;
}

/**
 * Death by — Complément du 5 novembre 2026 (Hermann), §13 : seul un **premier rang** dont le travail prévu connu atteint ou dépasse l'intervalle produit un
 * avertissement non bloquant (« Le premier intervalle ne peut pas être tenu : le défi s'arrêtera avant de commencer. ») ; la
 * fin normale d'une progression en Durée n'est pas signalée. Intervalle commun : somme des membres ; sinon, chaque membre.
 */
export function deathByFirstRankWarning(answers: ModelAnswers, movements: readonly ModelMovement[]): boolean {
  if (movements.length === 0) return false;
  const interval = answers.intervalSeconds ?? MINUTE;
  const several = movements.length > 1;
  const work = movements.map((movement) =>
    plannedWorkOfTarget(movement.exercise, movement.values.mode, several ? movement.values.start : (answers.startRepetitions ?? null)),
  );
  if (several && (answers.execution ?? "SEQUENCE") === "EACH_INTERVAL") return work.reduce((total, value) => total + value, 0) >= interval && work.some((value) => value > 0);
  return work.some((value) => value > 0 && value >= interval);
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
        case "SUPERSET": {
          const count = key === "EMOM" ? (answers.seriesCount ?? 1) : (answers.roundCount ?? 1);
          return Array.from({ length: count }, (_, at) => values.cells?.[at]?.repetitions ?? null).every((value) => value !== null);
        }
        case "DEATH_BY":
          return !several || (values.start != null && values.start >= 1 && values.startIncrement != null && values.startIncrement >= 1);
        case "TABATA":
        case "INTERVALS_30_30":
        case "STRENGTH":
          // Objectif propre au mouvement (tableau) : `null` après un changement d'unité.
          return values.repetitions !== null;
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
    if (overflow.length > 0) issues.push({ kind: "EMOM_DURATION", indexes: [...new Set(overflow.map((cell) => cell.index))], cells: overflow });
  }
  // Death by à un mouvement : départ et incrément du questionnaire, à renseigner après un changement d'unité.
  if (key === "DEATH_BY" && !several) {
    if (answers.startRepetitions === undefined) issues.push({ kind: "MISSING_SETTING", id: "startRepetitions" });
    if (answers.increment === undefined) issues.push({ kind: "MISSING_SETTING", id: "increment" });
  }
  // Superset (Complément du 5 novembre 2026 (Hermann), §11) : « Récupération après le tour » — valeur absente à compléter, zéro explicite conservé.
  if (key === "SUPERSET" && movements.length > 0 && supersetRecovery(answers, movements) === null) issues.push({ kind: "MISSING_SETTING", id: "recoveryBetweenSeconds" });
  return issues;
}

/** Superset : « Récupération après le tour » = Récupération du dernier Exercice actuel ; `null` : à renseigner. */
export function supersetRecovery(answers: ModelAnswers, movements: readonly ModelMovement[]): number | null {
  return answers.recoveryBetweenSeconds ?? movements[movements.length - 1]?.exercise.postActivityRecoverySeconds ?? null;
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
  if (key === "PROGRESSION" || key === "EMOM" || key === "SUPERSET") {
    const count = key === "SUPERSET" ? (answers.roundCount ?? 3) : (answers.seriesCount ?? 3);
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

/**
 * Charge commune d'un mouvement (Complément du 5 novembre 2026 (Hermann), §15–§17 : AMRAP, Tabata, 30/30, Renforcement, À l'échec, Death by) : « Avec » si la
 * charge est appliquée au mouvement et renseignée ; sinon « Sans », valeurs de l'Exercice de base conservées (AD-19).
 */
function withCommonLoad(parameters: ExecutionParametersInput, answers: ModelAnswers, values: MovementValues): ExecutionParametersInput {
  const load = chargeActive(answers, values) ? (values.loadKg ?? null) : null;
  return withLoadSwitch(withUniformLoad(parameters, load), true, load !== null && load > 0);
}

/**
 * Séries d'un mouvement à valeurs par série (Progression, EMOM, Superset) : objectif et charge de la série k ; charge de la série
 * k si la charge est appliquée au mouvement, sinon charge de l'Exercice de base conservée sous « Sans ». Des séries toutes
 * identiques restent « Identiques ».
 */
function seriesParameters(exercise: SessionDraftExercise, answers: ModelAnswers, values: MovementValues, count: number, pauseSeconds: number, mode: ExecutionMode): ExecutionParametersInput {
  const cells = resizeList(values.cells ?? [], count);
  const active = chargeActive(answers, values);
  const rows = cells.map((cell, at) => ({ target: target(cell?.repetitions ?? null), pauseSeconds, loadKg: active ? (cell?.loadKg ?? 0) : baseRowLoad(exercise, at) }));
  const anyLoad = active && cells.some((cell) => cell?.loadKg != null && cell.loadKg > 0);
  const same = rows.every((row) => JSON.stringify(row) === JSON.stringify(rows[0]));
  const parameters =
    same && rows[0] !== undefined
      ? { ...uniform(exercise.executionParameters, mode, count, rows[0].target, pauseSeconds), series: { kind: "UNIFORM" as const, count, target: rows[0].target, pauseSeconds, loadKg: rows[0].loadKg, workPhases: exercise.executionParameters.series.workPhases } }
      : variable(exercise.executionParameters, mode, rows);
  return withLoadSwitch(parameters, active, anyLoad);
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

/**
 * Objectif d'un mouvement des tableaux Objectif | Pause | Charge (Complément du 5 novembre 2026 (Hermann), §15–§17) : celui de la ligne, sinon le réglage commun
 * du questionnaire (dans l'unité par défaut du modèle) ; `null` : à renseigner (changement d'unité).
 */
function rowObjective(values: MovementValues, fallback: number | undefined, defaultMode: ExecutionMode): number | null {
  if (values.repetitions !== undefined) return values.repetitions;
  return (values.mode ?? defaultMode) === defaultMode ? (fallback ?? null) : null;
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
      // §9, §9.2 : Exercices standards (N séries identiques, travail, pause) ; aucune constante. Complément du 5 novembre 2026 (Hermann), §15, §17 : objectif
      // (Durée ou Répétitions), pause et charge commune propres à chaque mouvement ; réglages du questionnaire par défaut.
      const count = answers.seriesCount ?? 1;
      const exercises = movements.map(({ exercise, values }) => {
        const mode = values.mode ?? "DURATION";
        const parameters = uniform(exercise.executionParameters, mode, count, target(rowObjective(values, answers.workSeconds, "DURATION")), values.pause ?? answers.pauseSeconds ?? 0);
        return withParameters(exercise, withCommonLoad(parameters, answers, values), 0, null);
      });
      if (execution === "ALTERNATED") return [standardCircuit(key, newId(), "SERIES", count, exercises)];
      return inSequence(key, newId, exercises, key === "TABATA" && several ? answers.recoveryBetweenSeconds : undefined);
    }
    case "STRENGTH":
    case "UNTIL_FAILURE": {
      const count = answers.seriesCount ?? 1;
      // Complément du 5 novembre 2026 (Hermann), §16–§17 : objectif (Répétitions ou Durée ; À l'échec dans le Mode choisi), pause et charge commune par mouvement.
      const exercises = movements.map(({ exercise, values }) => {
        const mode = values.mode ?? "REPETITIONS";
        const seriesTarget = key === "STRENGTH" ? target(rowObjective(values, answers.repetitions, "REPETITIONS")) : failureTarget();
        const parameters = uniform(exercise.executionParameters, mode, count, seriesTarget, values.pause ?? pauseOf(answers, exercise));
        return withParameters(exercise, withCommonLoad(parameters, answers, values), exercise.postActivityRecoverySeconds ?? 0, null);
      });
      return execution === "ALTERNATED" ? [standardCircuit(key, newId(), "SERIES", count, exercises)] : inSequence(key, newId, exercises, undefined);
    }
    case "PROGRESSION": {
      const count = answers.seriesCount ?? 1;
      // Complément du 5 novembre 2026 (Hermann), §9 : charge décidée mouvement par mouvement (« (+ kg) ») ; séries variables (10 / 12 / 14 conservés).
      const exercises = movements.map(({ exercise, values }) => {
        const pause = pauseOf(answers, exercise);
        const cells = resizeList(values.cells ?? [], count);
        const active = chargeActive(answers, values);
        const rows = cells.map((cell, at) => ({ target: target(cell?.repetitions ?? null), pauseSeconds: pause, loadKg: active ? (cell?.loadKg ?? 0) : baseRowLoad(exercise, at) }));
        const anyLoad = active && cells.some((cell) => cell?.loadKg != null && cell.loadKg > 0);
        return withParameters(exercise, withLoadSwitch(variable(exercise.executionParameters, values.mode ?? "REPETITIONS", rows), active, anyLoad), exercise.postActivityRecoverySeconds ?? 0, null);
      });
      return execution === "ALTERNATED" ? [standardCircuit(key, newId(), "SERIES", count, exercises)] : inSequence(key, newId, exercises, undefined);
    }
    case "SUPERSET": {
      // Complément du 5 novembre 2026 (Hermann), §11, §17 : Circuit standard à séries alternées (A1, B1, récupération, A2, B2…), N tours ; chaque membre porte N
      // séries (objectif et charge du tour k), sans multiplication N × N. « Récupération après le tour » = Récupération du
      // dernier Exercice ; aucun repos ajouté entre les membres par cette préconfiguration. [Circuit groupé d'un passage — remplacé.]
      const count = answers.roundCount ?? 3;
      const recovery = supersetRecovery(answers, movements) ?? 0;
      const exercises = movements.map(({ exercise, values }, index) =>
        withParameters(exercise, seriesParameters(exercise, answers, values, count, basePause(exercise), values.mode ?? "REPETITIONS"), index === movements.length - 1 ? recovery : 0, null),
      );
      return [standardCircuit(key, newId(), "SERIES", count, exercises)];
    }
    case "EMOM": {
      const count = answers.seriesCount ?? 1;
      const interval = answers.intervalSeconds ?? MINUTE;
      // Complément du 5 novembre 2026 (Hermann), §14, §17 : objectif et charge de chaque série S1…Sn (séries variables, nombre de séries = Nombre de séries de
      // l'EMOM) ; aucun incrément d'objectif ni de charge.
      const params = (exercise: SessionDraftExercise, values: MovementValues) => seriesParameters(exercise, answers, values, count, 0, values.mode ?? "REPETITIONS");
      if (execution === "EACH_INTERVAL") {
        // §10 : Circuit porteur, tours = N, durée de chaque tour = intervalle ; membres sans Intervalle propre. Chaque membre
        // porte ses N séries : au tour k, il joue sa série k (comme le For time), sans multiplication N × N.
        const members = movements.map(({ exercise, values }) => withParameters(exercise, params(exercise, values), 0, { key: "EMOM", settings: {} }));
        return [carrierCircuit(key, newId(), "TOURS", count, { key: "EMOM", settings: { windowSeconds: interval } }, members)];
      }
      const exercises = movements.map(({ exercise, values }) => withParameters(exercise, params(exercise, values), 0, { key: "EMOM", settings: { intervalSeconds: interval } }));
      return execution === "ALTERNATED" ? [standardCircuit(key, newId(), "SERIES", count, exercises)] : inSequence(key, newId, exercises, several ? answers.recoveryBetweenSeconds : undefined);
    }
    case "DEATH_BY": {
      const interval = answers.intervalSeconds ?? MINUTE;
      // MAJ 04/11 §4.3 : à plusieurs mouvements, départ et incrément propres à chacun (tableau) ; seul, ceux du questionnaire.
      // Complément du 5 novembre 2026 (Hermann), §13 : Répétitions ou Durée (Mode de l'Exercice) ; départ et incrément dans cette unité, incrément ≥ + 1 ; charge
      // commune par mouvement (§16).
      const startOf = (values: MovementValues) => target(several ? (values.start ?? null) : (answers.startRepetitions ?? null));
      const incrementOf = (values: MovementValues) => Math.max(1, (several ? values.startIncrement : null) ?? answers.increment ?? 1);
      const params = (exercise: SessionDraftExercise, values: MovementValues) =>
        withCommonLoad(uniform(exercise.executionParameters, values.mode ?? "REPETITIONS", 1, startOf(values), 0), answers, values);
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
        return withCommonLoad(base, answers, values);
      };
      // Complément du 5 novembre 2026 (Hermann), §8 : incrément signé ; aucun incrément pour le buy-in ni pour Max (À l'échec).
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
      // MAJ 04/11 §6 quater bis : un objectif et une charge par tour (charge facultative), dans l'unité de la ligne. Complément du 5 novembre 2026 (Hermann), §9 :
      // charge décidée mouvement par mouvement (« (+ kg) »).
      const parameters = (exercise: SessionDraftExercise, values: MovementValues, pauseSeconds: number, count: number) => {
        const loads = resizeList(values.loads ?? [], count);
        const active = chargeActive(answers, values);
        const rows = resizeList(values.volumes ?? [], count).map((volume, at) => ({
          target: target(volume ?? null),
          pauseSeconds,
          loadKg: active ? (loads[at] ?? 0) : baseRowLoad(exercise, at),
        }));
        const anyLoad = active && loads.some((load) => load != null && load > 0);
        return withLoadSwitch(variable(exercise.executionParameters, values.mode ?? "REPETITIONS", rows), active, anyLoad);
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
