/**
 * Validations et normalisations métier de la Séance simple (T01).
 *
 * Fonctions pures, indépendantes de SQL et d'Expo : elles ne lèvent jamais
 * d'exception et retournent un `ValidationResult` (§ contrat dans
 * `errors.ts`). Les bornes de longueur sont comptées par points de code
 * Unicode (`Array.from(value).length`), pas par `string.length`, pour
 * rester cohérentes avec le comptage de caractères de SQLite.
 */

import { validateCategoryName } from "@/domain/categories/validation";

import {
  SESSION_COLORS,
  type CreateSessionCategoryInput,
  type CreateSessionExerciseInput,
  type CreateSessionInput,
  type SessionColor,
} from "./Session";
import {
  fail,
  ok,
  type ValidationField,
  type ValidationResult,
  type ValidationViolation,
} from "./errors";

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

export function validateSessionColor(raw: string): ValidationResult<SessionColor> {
  if (!SESSION_COLORS.includes(raw as SessionColor)) {
    return fail([{ code: "INVALID_COLOR", field: "session.color" }]);
  }
  return ok(raw as SessionColor);
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
 * Valide une seule Activité d'un `CreateSessionInput.exercises` (T01-S09) :
 * nom, champ propre au mode d'exécution (durée XOR répétitions, RM-034),
 * nombre de Séries (D-092), pause après Série (`08` l.925) et Consigne.
 * `bodyZoneIds` n'est pas revalidée ici (référentiel `bodyZones.ts`, hors
 * Domaine Séance — voir la note de tête de `SessionDraft.toCreateSessionInput`
 * pour la justification complète) : elle est reprise telle quelle.
 */
function validateSessionExerciseInput(
  exercise: CreateSessionExerciseInput,
): ValidationResult<CreateSessionExerciseInput> {
  const violations: ValidationViolation[] = [];
  const name = unwrap(validateExerciseName(exercise.name), violations);

  let durationSeconds: number | null = null;
  let repetitionCount: number | null = null;
  if (exercise.executionMode === "DURATION") {
    if (exercise.durationSeconds === null) {
      violations.push({ code: "REQUIRED", field: "exercise.durationSeconds" });
    } else {
      durationSeconds =
        unwrap(validateExerciseDurationSeconds(exercise.durationSeconds), violations) ?? null;
    }
  } else {
    if (exercise.repetitionCount === null) {
      violations.push({ code: "REQUIRED", field: "exercise.repetitionCount" });
    } else {
      repetitionCount = unwrap(validateRepetitionCount(exercise.repetitionCount), violations) ?? null;
    }
  }

  const seriesCount = unwrap(validateSeriesCount(exercise.seriesCount), violations);
  const pauseSeconds = unwrap(validatePauseSeconds(exercise.pauseSeconds), violations);
  const instruction = unwrap(validateInstruction(exercise.instruction ?? null), violations);

  if (violations.length > 0) {
    return fail(violations);
  }

  return ok({
    name: name as string,
    executionMode: exercise.executionMode,
    durationSeconds,
    repetitionCount,
    seriesCount: seriesCount as number,
    pauseSeconds: pauseSeconds as number,
    instruction: instruction === undefined ? null : instruction,
    bodyZoneIds: exercise.bodyZoneIds,
  });
}

/**
 * Adapte une violation du Domaine Catégorie (`CategoryValidationViolation`,
 * module séparé et volontairement non couplé au type d'erreur du Domaine
 * Séance) vers `ValidationViolation` (Domaine Séance) au seul point
 * d'assemblage où les deux se rencontrent : `category.name` fait partie de
 * `ValidationField` (voir `errors.ts`) précisément pour rendre cette
 * conversion valide, et les codes `REQUIRED`/`TOO_LONG` du Domaine Catégorie
 * sont un sous-ensemble de `ValidationErrorCode`.
 */
function validateSessionCategoryName(
  raw: string,
  violations: ValidationViolation[],
): string | undefined {
  const result = validateCategoryName(raw);
  if (result.ok) {
    return result.value;
  }
  for (const violation of result.violations) {
    violations.push({ code: violation.code, field: violation.field, details: violation.details });
  }
  return undefined;
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
  const color = unwrap(validateSessionColor(input.color), violations);
  const initialCountdownSeconds = unwrap(
    validateInitialCountdownSeconds(input.initialCountdownSeconds),
    violations,
  );
  const finalPhaseSeconds = unwrap(
    validateFinalPhaseSeconds(input.finalPhaseSeconds),
    violations,
  );

  const exercises: CreateSessionExerciseInput[] = [];
  if (input.exercises.length === 0) {
    violations.push(
      { code: "REQUIRED", field: "exercise.name" },
      { code: "REQUIRED", field: "exercise.durationSeconds" },
    );
  } else {
    for (const exercise of input.exercises) {
      const validated = validateSessionExerciseInput(exercise);
      if (validated.ok) {
        exercises.push(validated.value);
      } else {
        violations.push(...validated.violations);
      }
    }
  }

  const categories: CreateSessionCategoryInput[] = [];
  for (const category of input.categories) {
    if (category.kind === "EXISTING") {
      categories.push(category);
      continue;
    }
    const validatedName = validateSessionCategoryName(category.name, violations);
    if (validatedName !== undefined) {
      categories.push({ kind: "NEW", name: validatedName });
    }
  }

  if (violations.length > 0) {
    return fail(violations);
  }

  return ok({
    name: name as string,
    color: color as SessionColor,
    initialCountdownSeconds: initialCountdownSeconds as number,
    finalPhaseSeconds: finalPhaseSeconds as number,
    exercises,
    categories,
  });
}
