/**
 * Validations et normalisations métier de la Séance simple (T01).
 *
 * Fonctions pures, indépendantes de SQL et d'Expo : elles ne lèvent jamais
 * d'exception et retournent un `ValidationResult` (§ contrat dans
 * `errors.ts`). Les bornes de longueur sont comptées par points de code
 * Unicode (`Array.from(value).length`), pas par `string.length`, pour
 * rester cohérentes avec le comptage de caractères de SQLite.
 */

import {
  type ActivityType,
  type CreateSessionActivityInput,
  type CreateSessionInput,
  type ExerciseExecutionMode,
  type StructuralPosition,
  type UpdateSessionActivityInput,
  type UpdateSessionInput,
} from "./Session";
import {
  fail,
  ok,
  type ValidationField,
  type ValidationResult,
  type ValidationViolation,
} from "./errors";
import { DEFAULT_SIDE_MODE } from "./defaults";
import { isSideMode, type SideMode } from "./sideMode";

const NAME_MIN_LENGTH = 1;
/** Exportée pour être réutilisée telle quelle comme `maxLength` d'un `TextInput` (Composition, T01-S07) — jamais dupliquée en dur. */
export const NAME_MAX_LENGTH = 80;
/** Exportée pour être réutilisée telle quelle comme `maxLength` d'un `TextInput` (Exercice, T01-S08) — jamais dupliquée en dur, même convention que `NAME_MAX_LENGTH`. */
export const INSTRUCTION_MAX_LENGTH = 1000;
const EXERCISE_DURATION_MIN_SECONDS = 1;
const EXERCISE_DURATION_MAX_SECONDS = 5999;
/** Bornes 1–99 (T01-S08, D-092), par cohérence avec le Tour (D-058). */
const REPETITION_COUNT_MIN = 1;
const REPETITION_COUNT_MAX = 99;
const SERIES_COUNT_MIN = 1;
const SERIES_COUNT_MAX = 99;
/** Mêmes bornes que la durée d'Exercice (0–99 min 59 s, `08` l.925). */
const PAUSE_SECONDS_MIN = 0;
const PAUSE_SECONDS_MAX = 5999;
/**
 * T02-S02 : Récupération ATTACHÉE d'une Activité. Mêmes bornes que la Pause
 * — `13 – Contrats d'écran.md` (CE-T01-14) pose que `Récupération` « hérite
 * du même contrat minutes/secondes » que `Durée`/`Pause`, et CE-T01-13 que
 * « Pause et Récupération peuvent valoir `0 s` » : `0` est donc une valeur
 * VALIDE, jamais une absence à signaler.
 */
const RECOVERY_SECONDS_MIN = 0;
const RECOVERY_SECONDS_MAX = 5999;
/** T01-S10 : répétition du Tour, entier `1..99` (D-058, par cohérence avec `08` l.924). */
const TOUR_REPEAT_COUNT_MIN = 1;
const TOUR_REPEAT_COUNT_MAX = 99;
/** T01-S10 : une Récupération est toujours chronométrée (D-041) — mêmes bornes qu'une durée d'Exercice. */
const RECOVERY_DURATION_MIN_SECONDS = 1;
const RECOVERY_DURATION_MAX_SECONDS = 5999;

const EXERCISE_EXECUTION_MODES: readonly ExerciseExecutionMode[] = [
  "DURATION",
  "REPETITIONS",
  "TO_FAILURE",
];
const ACTIVITY_TYPES: readonly ActivityType[] = ["EXERCISE", "RECOVERY"];
const STRUCTURAL_POSITIONS: readonly StructuralPosition[] = [
  "BEFORE_TOUR",
  "IN_TOUR",
  "AFTER_TOUR",
];

function codePointLength(value: string): number {
  return Array.from(value).length;
}

/** Trim des extrémités puis réduction de toute succession d'espaces, tabulations ou retours à la ligne internes à un espace simple. Casse, accents et ponctuation conservés. */
export function normalizeName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

/**
 * `undefined`/`null`/chaîne blanche deviennent `null`. Sinon, seuls les
 * espaces et retours à la ligne externes sont retirés (`trim`) ; les
 * espaces et retours à la ligne internes sont conservés tels quels — une
 * consigne multiligne le reste.
 */
export function normalizeInstruction(raw: string | null | undefined): string | null {
  if (raw === null || raw === undefined) {
    return null;
  }
  const trimmed = raw.trim();
  return trimmed === "" ? null : trimmed;
}

function validateBoundedName(raw: string, field: ValidationField): ValidationResult<string> {
  const normalized = normalizeName(raw);
  const length = codePointLength(normalized);

  if (length < NAME_MIN_LENGTH) {
    return fail([{ code: "REQUIRED", field }]);
  }
  if (length > NAME_MAX_LENGTH) {
    return fail([{ code: "TOO_LONG", field, details: { max: NAME_MAX_LENGTH } }]);
  }
  return ok(normalized);
}

export function validateSessionName(raw: string): ValidationResult<string> {
  return validateBoundedName(raw, "session.name");
}

export function validateExerciseName(raw: string): ValidationResult<string> {
  return validateBoundedName(raw, "exercise.name");
}

/** T01-S10 : nom d'une Activité (Exercice ou Récupération) d'un agrégat de modification — mêmes bornes `1..80`. */
export function validateActivityName(raw: string): ValidationResult<string> {
  return validateBoundedName(raw, "activity.name");
}

export function validateExerciseDurationSeconds(raw: number): ValidationResult<number> {
  const field: ValidationField = "exercise.durationSeconds";

  if (!Number.isInteger(raw)) {
    return fail([{ code: "NOT_INTEGER", field }]);
  }
  if (raw < EXERCISE_DURATION_MIN_SECONDS || raw > EXERCISE_DURATION_MAX_SECONDS) {
    return fail([
      {
        code: "OUT_OF_RANGE",
        field,
        details: { min: EXERCISE_DURATION_MIN_SECONDS, max: EXERCISE_DURATION_MAX_SECONDS },
      },
    ]);
  }
  return ok(raw);
}

/** Nombre de répétitions d'un Exercice en mode Répétitions (T01-S08). Entier de 1 à 99 (D-092). */
export function validateRepetitionCount(raw: number): ValidationResult<number> {
  const field: ValidationField = "exercise.repetitionCount";

  if (!Number.isInteger(raw)) {
    return fail([{ code: "NOT_INTEGER", field }]);
  }
  if (raw < REPETITION_COUNT_MIN || raw > REPETITION_COUNT_MAX) {
    return fail([
      {
        code: "OUT_OF_RANGE",
        field,
        details: { min: REPETITION_COUNT_MIN, max: REPETITION_COUNT_MAX },
      },
    ]);
  }
  return ok(raw);
}

/** Nombre de Séries d'un Exercice (T01-S08). Entier de 1 à 99 (D-092). */
export function validateSeriesCount(raw: number): ValidationResult<number> {
  const field: ValidationField = "exercise.seriesCount";

  if (!Number.isInteger(raw)) {
    return fail([{ code: "NOT_INTEGER", field }]);
  }
  if (raw < SERIES_COUNT_MIN || raw > SERIES_COUNT_MAX) {
    return fail([
      { code: "OUT_OF_RANGE", field, details: { min: SERIES_COUNT_MIN, max: SERIES_COUNT_MAX } },
    ]);
  }
  return ok(raw);
}

/** Pause après Série d'un Exercice (T01-S08). Entier de 0 à 5999 secondes (`08` l.925). */
export function validatePauseSeconds(raw: number): ValidationResult<number> {
  const field: ValidationField = "exercise.pauseSeconds";

  if (!Number.isInteger(raw)) {
    return fail([{ code: "NOT_INTEGER", field }]);
  }
  if (raw < PAUSE_SECONDS_MIN || raw > PAUSE_SECONDS_MAX) {
    return fail([
      { code: "OUT_OF_RANGE", field, details: { min: PAUSE_SECONDS_MIN, max: PAUSE_SECONDS_MAX } },
    ]);
  }
  return ok(raw);
}

/**
 * V2-PRE-1 (plan §3.2) : récupération post-exercice de l'occurrence (RM-129).
 * Entier de 0 à 5999 secondes — `0` signifie « aucune récupération » et reste
 * parfaitement valide (CE-T01-13). Remplace l'ancien `validateRecoverySeconds`.
 */
export function validatePostActivityRecoverySeconds(raw: number): ValidationResult<number> {
  const field: ValidationField = "exercise.postActivityRecoverySeconds";

  if (!Number.isInteger(raw)) {
    return fail([{ code: "NOT_INTEGER", field }]);
  }
  if (raw < RECOVERY_SECONDS_MIN || raw > RECOVERY_SECONDS_MAX) {
    return fail([
      {
        code: "OUT_OF_RANGE",
        field,
        details: { min: RECOVERY_SECONDS_MIN, max: RECOVERY_SECONDS_MAX },
      },
    ]);
  }
  return ok(raw);
}

/** T01-S10 : répétition du Tour (`SessionDraft.tourRepeatCount` / `UpdateSessionInput.tourRepeatCount`). Entier de 1 à 99 (D-058). */
export function validateTourRepeatCount(raw: number): ValidationResult<number> {
  const field: ValidationField = "session.tourRepeatCount";

  if (!Number.isInteger(raw)) {
    return fail([{ code: "NOT_INTEGER", field }]);
  }
  if (raw < TOUR_REPEAT_COUNT_MIN || raw > TOUR_REPEAT_COUNT_MAX) {
    return fail([
      {
        code: "OUT_OF_RANGE",
        field,
        details: { min: TOUR_REPEAT_COUNT_MIN, max: TOUR_REPEAT_COUNT_MAX },
      },
    ]);
  }
  return ok(raw);
}

/** T01-S10 : durée d'une Récupération explicite (toujours chronométrée, D-041). Entier de 1 à 5999 secondes. */
export function validateRecoveryDurationSeconds(raw: number): ValidationResult<number> {
  const field: ValidationField = "recovery.durationSeconds";

  if (!Number.isInteger(raw)) {
    return fail([{ code: "NOT_INTEGER", field }]);
  }
  if (raw < RECOVERY_DURATION_MIN_SECONDS || raw > RECOVERY_DURATION_MAX_SECONDS) {
    return fail([
      {
        code: "OUT_OF_RANGE",
        field,
        details: { min: RECOVERY_DURATION_MIN_SECONDS, max: RECOVERY_DURATION_MAX_SECONDS },
      },
    ]);
  }
  return ok(raw);
}

/** T01-S10 : mode d'exécution reconnu (`DURATION` / `REPETITIONS` / `TO_FAILURE`, D-111). */
export function validateExecutionMode(raw: string): ValidationResult<ExerciseExecutionMode> {
  if (!EXERCISE_EXECUTION_MODES.includes(raw as ExerciseExecutionMode)) {
    return fail([{ code: "UNRECOGNIZED", field: "exercise.executionMode" }]);
  }
  return ok(raw as ExerciseExecutionMode);
}

/** T01-S10 : type d'Activité RECONNU (`EXERCISE` / `RECOVERY`, D-061) — contrôle de LECTURE, jamais d'écriture (voir `validateCreatableActivityType`). */
export function validateActivityType(raw: string): ValidationResult<ActivityType> {
  if (!ACTIVITY_TYPES.includes(raw as ActivityType)) {
    return fail([{ code: "UNRECOGNIZED", field: "activity.type" }]);
  }
  return ok(raw as ActivityType);
}

/**
 * **T02-S02 — verrou d'écriture** : un agrégat persistable ne peut plus
 * porter d'Activité `RECOVERY`.
 *
 * La Récupération est désormais une durée attachée (`recoverySeconds`) et
 * « aucun sélecteur fonctionnel Exercice/Récupération » n'existe plus
 * (`12 – Architecture technique.md` : « Le schéma d'Activité … ne porte aucun
 * type Exercice/Récupération »). Cette validation est le verrou du DOMAINE,
 * indépendant de l'interface : même un appelant programmatique ne peut pas
 * réintroduire une Activité `RECOVERY` après `migration004`, qui les a toutes
 * converties puis supprimées.
 *
 * `validateActivityType` reste distincte et inchangée : elle sert au contrôle
 * de RECONNAISSANCE d'une valeur (lecture/défense en profondeur), là où
 * celle-ci contrôle la CRÉATION.
 */
export function validateCreatableActivityType(raw: string): ValidationResult<ActivityType> {
  const recognized = validateActivityType(raw);
  if (!recognized.ok) {
    return recognized;
  }
  if (recognized.value === "RECOVERY") {
    return fail([{ code: "MUST_BE_ABSENT", field: "activity.type" }]);
  }
  return ok(recognized.value);
}

/** T01-S10 : position structurelle reconnue (`BEFORE_TOUR` / `IN_TOUR` / `AFTER_TOUR`, D-061). */
export function validateStructuralPosition(raw: string): ValidationResult<StructuralPosition> {
  if (!STRUCTURAL_POSITIONS.includes(raw as StructuralPosition)) {
    return fail([{ code: "UNRECOGNIZED", field: "activity.structuralPosition" }]);
  }
  return ok(raw as StructuralPosition);
}

/**
 * V2-BILAT-01 : normalise un `SideMode` reçu à l'exécution.
 *
 * `errors.ts` reste hors du périmètre autorisé de cette tranche (bornes
 * opposables de la mission) : aucune nouvelle entrée `ValidationField`/
 * `ValidationErrorCode` ne peut y être ajoutée. `SideMode` est en outre un
 * enum ENTIÈREMENT gouverné par l'interface (`SideModeControl`, un contrôle
 * cyclique à trois états — `cycleSideMode`, `sideMode.ts` — jamais une
 * saisie libre) : une valeur hors énumération à l'exécution est donc traitée
 * comme une donnée défensive plutôt qu'une violation utilisateur signalable
 * — elle ne fait jamais échouer la validation d'un agrégat par ailleurs
 * valide.
 *
 * **Compatibilité rétroactive des agrégats hérités** : la valeur NEUTRE
 * (`DEFAULT_SIDE_MODE`, `UNILATERAL` — qu'elle soit explicitement fournie,
 * absente, ou issue d'une valeur hors énumération) est délibérément
 * ABSENTE de la sortie (`undefined`), jamais matérialisée. Un agrégat validé
 * dont aucune Activité/Tour n'exprime de bilatéralité reste ainsi
 * STRUCTURELLEMENT IDENTIQUE à un agrégat antérieur à cette tranche, qui
 * n'a jamais connu ce champ — condition nécessaire à la compatibilité d'un
 * appelant existant qui compare l'agrégat persisté par égalité stricte.
 * Seule une direction BILATÉRALE explicite (`RIGHT_LEFT`/`LEFT_RIGHT`)
 * traverse donc cette normalisation. La persistance (`SqliteSessionRepository
 * .ts`) applique `?? DEFAULT_SIDE_MODE` à l'écriture SQL, qui reste donc
 * toujours `UNILATERAL` par défaut, que ce champ soit présent ou non ici —
 * aucune information n'est perdue, seule sa représentation neutre change.
 */
export function normalizeSideMode(raw: unknown): SideMode | undefined {
  return isSideMode(raw) && raw !== DEFAULT_SIDE_MODE ? raw : undefined;
}

/** T01-S10 : rang d'ordre d'une Activité dans sa zone structurelle — entier `≥ 0`. */
export function validateActivityPosition(raw: number): ValidationResult<number> {
  const field: ValidationField = "activity.position";
  if (!Number.isInteger(raw)) {
    return fail([{ code: "NOT_INTEGER", field }]);
  }
  if (raw < 0) {
    return fail([{ code: "OUT_OF_RANGE", field, details: { min: 0 } }]);
  }
  return ok(raw);
}

function validateNonNegativeSeconds(
  raw: number,
  field: ValidationField,
): ValidationResult<number> {
  if (!Number.isInteger(raw)) {
    return fail([{ code: "NOT_INTEGER", field }]);
  }
  if (raw < 0) {
    return fail([{ code: "OUT_OF_RANGE", field, details: { min: 0 } }]);
  }
  return ok(raw);
}

export function validateInitialCountdownSeconds(raw: number): ValidationResult<number> {
  return validateNonNegativeSeconds(raw, "session.initialCountdownSeconds");
}

export function validateFinalPhaseSeconds(raw: number): ValidationResult<number> {
  return validateNonNegativeSeconds(raw, "session.finalPhaseSeconds");
}

export function validateInstruction(
  raw: string | null | undefined,
): ValidationResult<string | null> {
  const normalized = normalizeInstruction(raw);
  if (normalized === null) {
    return ok(null);
  }
  if (codePointLength(normalized) > INSTRUCTION_MAX_LENGTH) {
    return fail([
      { code: "TOO_LONG", field: "exercise.instruction", details: { max: INSTRUCTION_MAX_LENGTH } },
    ]);
  }
  return ok(normalized);
}

function unwrap<T>(
  result: ValidationResult<T>,
  violations: ValidationViolation[],
): T | undefined {
  if (result.ok) {
    return result.value;
  }
  violations.push(...result.violations);
  return undefined;
}

/**
 * Paramètres d'exécution d'une Activité, indépendamment de son identité et
 * de sa place dans la structure — la seule partie réellement commune à la
 * création (`CreateSessionActivityInput`) et à la modification
 * (`UpdateSessionActivityInput`).
 */
type ActivityParameterInput = {
  readonly executionMode: ExerciseExecutionMode | null;
  readonly durationSeconds: number | null;
  readonly repetitionCount: number | null;
  readonly seriesCount: number | null;
  readonly pauseSeconds: number;
  /** V2-PRE-1 : récupération post-exercice de l'occurrence (`0..5999`). */
  readonly postActivityRecoverySeconds: number;
  readonly bodyZoneIds: readonly string[];
};

type ActivityParameterValues = {
  readonly executionMode: ExerciseExecutionMode | null;
  readonly durationSeconds: number | null;
  readonly repetitionCount: number | null;
  readonly seriesCount: number | null;
  readonly pauseSeconds: number;
  readonly postActivityRecoverySeconds: number;
  readonly bodyZoneIds: readonly string[];
};

/**
 * Valide et normalise les paramètres d'exécution d'une Activité selon son
 * type (T02-S01 — extraction commune : jusqu'ici la création et la
 * modification portaient deux copies divergentes de ces mêmes règles, la
 * copie de création ignorant purement et simplement les Récupérations).
 *
 * Un Exercice porte un mode (durée XOR répétitions XOR aucune cible,
 * RM-034/D-111), un nombre de Séries (D-092), une pause après Série
 * (`08` l.925) et ses Zones corporelles. Une Récupération (D-041) est
 * toujours chronométrée et n'expose ni mode d'Exercice, ni Séries, ni pause,
 * ni Zones.
 *
 * `bodyZoneIds` n'est jamais revalidée ici (référentiel `bodyZones.ts`, hors
 * Domaine Séance — voir la note de tête de `SessionDraft.toCreateSessionInput`
 * pour la justification complète) : elle est reprise telle quelle pour un
 * Exercice, vidée pour une Récupération.
 *
 * `type` peut être `undefined` lorsque le type lui-même a déjà échoué à la
 * validation : aucune règle de paramètre n'est alors applicable, et la
 * violation `UNRECOGNIZED` déjà accumulée suffit.
 */
function validateActivityParameters(
  type: ActivityType | undefined,
  activity: ActivityParameterInput,
  violations: ValidationViolation[],
): ActivityParameterValues {
  let executionMode: ExerciseExecutionMode | null = null;
  let durationSeconds: number | null = null;
  let repetitionCount: number | null = null;
  let seriesCount: number | null = null;
  let pauseSeconds = 0;
  let postActivityRecoverySeconds = 0;
  let bodyZoneIds: readonly string[] = [];

  if (type === "RECOVERY") {
    if (activity.executionMode !== null) {
      violations.push({ code: "MUST_BE_ABSENT", field: "exercise.executionMode" });
    }
    if (activity.repetitionCount !== null) {
      violations.push({ code: "MUST_BE_ABSENT", field: "exercise.repetitionCount" });
    }
    if (activity.seriesCount !== null) {
      violations.push({ code: "MUST_BE_ABSENT", field: "exercise.seriesCount" });
    }
    if (activity.pauseSeconds !== 0) {
      violations.push({ code: "MUST_BE_ABSENT", field: "exercise.pauseSeconds" });
    }
    // T02-S02 : une ancienne Activité `RECOVERY` ne peut pas porter elle-même
    // une récupération post-exercice — elle EST la Récupération (chemin de
    // lecture défensif uniquement : `validateCreatableActivityType` en
    // interdit déjà toute création).
    if (activity.postActivityRecoverySeconds !== 0) {
      violations.push({ code: "MUST_BE_ABSENT", field: "exercise.postActivityRecoverySeconds" });
    }
    if (activity.bodyZoneIds.length > 0) {
      violations.push({ code: "MUST_BE_ABSENT", field: "activity.bodyZoneIds" });
    }
    if (activity.durationSeconds === null) {
      violations.push({ code: "REQUIRED", field: "recovery.durationSeconds" });
    } else {
      durationSeconds =
        unwrap(validateRecoveryDurationSeconds(activity.durationSeconds), violations) ?? null;
    }
    return {
      executionMode,
      durationSeconds,
      repetitionCount,
      seriesCount,
      pauseSeconds,
      postActivityRecoverySeconds,
      bodyZoneIds,
    };
  }

  if (type !== "EXERCISE") {
    return {
      executionMode,
      durationSeconds,
      repetitionCount,
      seriesCount,
      pauseSeconds,
      postActivityRecoverySeconds,
      bodyZoneIds,
    };
  }

  bodyZoneIds = activity.bodyZoneIds;
  if (activity.executionMode === null) {
    violations.push({ code: "REQUIRED", field: "exercise.executionMode" });
  } else {
    executionMode = unwrap(validateExecutionMode(activity.executionMode), violations) ?? null;
  }

  if (executionMode === "DURATION") {
    if (activity.durationSeconds === null) {
      violations.push({ code: "REQUIRED", field: "exercise.durationSeconds" });
    } else {
      durationSeconds =
        unwrap(validateExerciseDurationSeconds(activity.durationSeconds), violations) ?? null;
    }
  } else if (executionMode === "REPETITIONS") {
    if (activity.repetitionCount === null) {
      violations.push({ code: "REQUIRED", field: "exercise.repetitionCount" });
    } else {
      repetitionCount =
        unwrap(validateRepetitionCount(activity.repetitionCount), violations) ?? null;
    }
  } else if (executionMode === "TO_FAILURE") {
    // « À l'échec » (D-111) : aucune cible de durée ni de répétitions.
    if (activity.durationSeconds !== null) {
      violations.push({ code: "MUST_BE_ABSENT", field: "exercise.durationSeconds" });
    }
    if (activity.repetitionCount !== null) {
      violations.push({ code: "MUST_BE_ABSENT", field: "exercise.repetitionCount" });
    }
  }

  if (activity.seriesCount === null) {
    violations.push({ code: "REQUIRED", field: "exercise.seriesCount" });
  } else {
    seriesCount = unwrap(validateSeriesCount(activity.seriesCount), violations) ?? null;
  }
  pauseSeconds = unwrap(validatePauseSeconds(activity.pauseSeconds), violations) ?? 0;
  // V2-PRE-1 : la récupération post-exercice est disponible dans LES TROIS
  // modes (`09 – Modèle de données fonctionnel.md` : « Pause, nombre de
  // Séries et Récupération restent disponibles dans les trois modes ») —
  // validée ici, hors du bloc conditionnel de mode.
  postActivityRecoverySeconds =
    unwrap(validatePostActivityRecoverySeconds(activity.postActivityRecoverySeconds), violations) ??
    0;

  return {
    executionMode,
    durationSeconds,
    repetitionCount,
    seriesCount,
    pauseSeconds,
    postActivityRecoverySeconds,
    bodyZoneIds,
  };
}

/**
 * Valide une seule Activité d'un `CreateSessionInput.exercises` (T01-S09 ;
 * T02-S01 : type, position structurelle et identifiant optionnel).
 *
 * Le champ de violation du NOM reste `exercise.name` (et non `activity.name`,
 * employé par le chemin de modification) : c'est le champ historique de ce
 * chemin, consommé tel quel par les appelants existants.
 */
function validateSessionActivityInput(
  activity: CreateSessionActivityInput,
): ValidationResult<CreateSessionActivityInput> {
  const violations: ValidationViolation[] = [];
  const name = unwrap(validateExerciseName(activity.name), violations);
  // T02-S02 : `validateCreatableActivityType` (et non `validateActivityType`)
  // — aucune Activité `RECOVERY` ne peut plus être créée.
  const type = unwrap(validateCreatableActivityType(activity.type), violations);
  const structuralPosition = unwrap(
    validateStructuralPosition(activity.structuralPosition),
    violations,
  );

  let id: string | undefined;
  if (activity.id !== undefined) {
    const trimmedId = activity.id.trim();
    if (trimmedId.length === 0) {
      violations.push({ code: "REQUIRED", field: "activity.id" });
    } else {
      id = trimmedId;
    }
  }

  const instruction = unwrap(validateInstruction(activity.instruction ?? null), violations);
  const parameters = validateActivityParameters(type, activity, violations);

  if (violations.length > 0) {
    return fail(violations);
  }

  return ok({
    id,
    type: type as ActivityType,
    structuralPosition: structuralPosition as StructuralPosition,
    name: name as string,
    executionMode: parameters.executionMode,
    durationSeconds: parameters.durationSeconds,
    repetitionCount: parameters.repetitionCount,
    seriesCount: parameters.seriesCount,
    pauseSeconds: parameters.pauseSeconds,
    postActivityRecoverySeconds: parameters.postActivityRecoverySeconds,
    instruction: instruction === undefined ? null : instruction,
    bodyZoneIds: parameters.bodyZoneIds,
    sideMode: normalizeSideMode(activity.sideMode),
  });
}

/**
 * Valide et normalise un `CreateSessionInput` complet (T01-S09 : collection
 * ordonnée d'Activités + Catégories). Retourne un succès portant l'entrée
 * normalisée, ou un échec listant l'intégralité des violations rencontrées
 * (pas seulement la première) — Séance, TOUTES les Activités et TOUTE
 * Catégorie personnalisée confondues.
 *
 * Un `exercises` vide échoue avec exactement les deux violations historiques
 * (`REQUIRED` sur `exercise.name` puis `exercise.durationSeconds`, jamais une
 * par Activité manquante puisqu'aucune n'existe) — « zéro Activité reste
 * invalide » (Issue #17, AC directement dérivé).
 *
 * Limite disclosée (héritée de la complétion REWORK12, toujours vraie en
 * T01-S09) : les champs de violation `exercise.*` ne portent aucun index —
 * si PLUSIEURS Activités sont simultanément invalides, leurs violations
 * s'accumulent sous les mêmes codes/champs sans distinguer laquelle est en
 * cause. Sans conséquence pratique : `ExerciseScreen` n'autorise jamais
 * `Terminer` sur une Activité déjà invalide (`isStep1Valid`), donc
 * `draft.exercises` ne contient normalement que des Activités déjà valides
 * individuellement au moment de l'enregistrement final.
 */
export function validateCreateSessionInput(
  input: CreateSessionInput,
): ValidationResult<CreateSessionInput> {
  const violations: ValidationViolation[] = [];

  const name = unwrap(validateSessionName(input.name), violations);
  const initialCountdownSeconds = unwrap(
    validateInitialCountdownSeconds(input.initialCountdownSeconds),
    violations,
  );
  const finalPhaseSeconds = unwrap(
    validateFinalPhaseSeconds(input.finalPhaseSeconds),
    violations,
  );
  const tourRepeatCount = unwrap(validateTourRepeatCount(input.tourRepeatCount), violations);

  const exercises: CreateSessionActivityInput[] = [];
  if (input.exercises.length === 0) {
    violations.push(
      { code: "REQUIRED", field: "exercise.name" },
      { code: "REQUIRED", field: "exercise.durationSeconds" },
    );
  } else {
    const seenIds = new Set<string>();
    for (const exercise of input.exercises) {
      const key = exercise.id?.trim() ?? "";
      if (key.length > 0) {
        if (seenIds.has(key)) {
          violations.push({ code: "DUPLICATE", field: "activity.id" });
        } else {
          seenIds.add(key);
        }
      }
      const validated = validateSessionActivityInput(exercise);
      if (validated.ok) {
        exercises.push(validated.value);
      } else {
        violations.push(...validated.violations);
      }
    }
  }

  if (violations.length > 0) {
    return fail(violations);
  }

  return ok({
    name: name as string,
    labelId: input.labelId ?? null,
    initialCountdownSeconds: initialCountdownSeconds as number,
    finalPhaseSeconds: finalPhaseSeconds as number,
    tourRepeatCount: tourRepeatCount as number,
    exercises,
    // V2-PRE-1 (plan §3.3/§7, REQ-001108DC7F67664C) : transmis tel quel —
    // la position DANS sa portée est dérivée de l'ordre du tableau par le
    // Repository, jamais revalidée ici (même patron que `exercises`).
    stopPoints: input.stopPoints ?? [],
  });
}

/**
 * Valide et normalise une seule Activité d'un `UpdateSessionInput.activities`
 * (T01-S10). Un Exercice suit les mêmes règles de mode que
 * `validateSessionActivityInput` (durée / répétitions / à l'échec) ; une
 * Récupération est toujours chronométrée (D-041) et n'expose ni mode
 * d'Exercice, ni Séries, ni pause, ni Zones corporelles.
 */
export function validateUpdateSessionActivityInput(
  activity: UpdateSessionActivityInput,
): ValidationResult<UpdateSessionActivityInput> {
  const violations: ValidationViolation[] = [];

  const trimmedId = activity.id.trim();
  if (trimmedId.length === 0) {
    violations.push({ code: "REQUIRED", field: "activity.id" });
  }
  const name = unwrap(validateActivityName(activity.name), violations);
  // T02-S02 : même verrou que le chemin de création — une modification ne
  // peut pas réintroduire une Activité `RECOVERY`.
  const type = unwrap(validateCreatableActivityType(activity.type), violations);
  const structuralPosition = unwrap(
    validateStructuralPosition(activity.structuralPosition),
    violations,
  );
  const position = unwrap(validateActivityPosition(activity.position), violations);
  const instruction = unwrap(validateInstruction(activity.instruction ?? null), violations);

  // T02-S01 : mêmes règles de paramètres que le chemin de création, une
  // seule implémentation partagée (`validateActivityParameters`) — les deux
  // copies précédentes ne pouvaient que diverger.
  const parameters = validateActivityParameters(type, activity, violations);

  if (violations.length > 0) {
    return fail(violations);
  }

  return ok({
    id: trimmedId,
    type: type as ActivityType,
    structuralPosition: structuralPosition as StructuralPosition,
    position: position as number,
    name: name as string,
    executionMode: parameters.executionMode,
    durationSeconds: parameters.durationSeconds,
    repetitionCount: parameters.repetitionCount,
    seriesCount: parameters.seriesCount,
    pauseSeconds: parameters.pauseSeconds,
    postActivityRecoverySeconds: parameters.postActivityRecoverySeconds,
    instruction: instruction === undefined ? null : instruction,
    bodyZoneIds: parameters.bodyZoneIds,
    sideMode: normalizeSideMode(activity.sideMode),
  });
}

/**
 * Valide et normalise un `UpdateSessionInput` complet (T01-S10, plan §6.2) :
 * identifiant source, propriétés générales, répétition du Tour, TOUTES les
 * Activités (toutes zones structurelles confondues) et Catégories. Agrège
 * l'intégralité des violations (jamais seulement la première) et détecte les
 * identifiants d'Activité en doublon. Un agrégat sans Activité échoue
 * (`REQUIRED` sur `activity.id`) — une Séance sans Activité reste invalide.
 * Ne lève jamais d'exception.
 */
export function validateUpdateSessionInput(
  input: UpdateSessionInput,
): ValidationResult<UpdateSessionInput> {
  const violations: ValidationViolation[] = [];

  if (input.sourceSessionId.trim().length === 0) {
    violations.push({ code: "REQUIRED", field: "session.sourceSessionId" });
  }
  const name = unwrap(validateSessionName(input.name), violations);
  const initialCountdownSeconds = unwrap(
    validateInitialCountdownSeconds(input.initialCountdownSeconds),
    violations,
  );
  const finalPhaseSeconds = unwrap(validateFinalPhaseSeconds(input.finalPhaseSeconds), violations);
  const tourRepeatCount = unwrap(validateTourRepeatCount(input.tourRepeatCount), violations);

  const activities: UpdateSessionActivityInput[] = [];
  if (input.activities.length === 0) {
    violations.push({ code: "REQUIRED", field: "activity.id" });
  } else {
    const seenIds = new Set<string>();
    for (const activity of input.activities) {
      const key = activity.id.trim();
      if (key.length > 0) {
        if (seenIds.has(key)) {
          violations.push({ code: "DUPLICATE", field: "activity.id" });
        } else {
          seenIds.add(key);
        }
      }
      const validated = validateUpdateSessionActivityInput(activity);
      if (validated.ok) {
        activities.push(validated.value);
      } else {
        violations.push(...validated.violations);
      }
    }
  }

  if (violations.length > 0) {
    return fail(violations);
  }

  return ok({
    sourceSessionId: input.sourceSessionId.trim(),
    name: name as string,
    labelId: input.labelId ?? null,
    initialCountdownSeconds: initialCountdownSeconds as number,
    finalPhaseSeconds: finalPhaseSeconds as number,
    tourRepeatCount: tourRepeatCount as number,
    activities,
    stopPoints: input.stopPoints ?? [],
  });
}
