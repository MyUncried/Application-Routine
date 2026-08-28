/**
 * Validations et normalisations métier de la Séance simple (T01).
 *
 * Fonctions pures, indépendantes de SQL et d'Expo : elles ne lèvent jamais
 * d'exception et retournent un `ValidationResult` (§ contrat dans
 * `errors.ts`). Les bornes de longueur sont comptées par points de code
 * Unicode (`Array.from(value).length`), pas par `string.length`, pour
 * rester cohérentes avec le comptage de caractères de SQLite.
 */

import { SESSION_COLORS, type CreateSessionInput, type SessionColor } from "./Session";
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
 * Valide et normalise un `CreateSessionInput` complet. Retourne un succès
 * portant l'entrée normalisée, ou un échec listant l'intégralité des
 * violations rencontrées (pas seulement la première).
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
  const exerciseName = unwrap(validateExerciseName(input.exercise.name), violations);
  const durationSeconds = unwrap(
    validateExerciseDurationSeconds(input.exercise.durationSeconds),
    violations,
  );
  const instruction = unwrap(validateInstruction(input.exercise.instruction), violations);

  if (violations.length > 0) {
    return fail(violations);
  }

  return ok({
    name: name as string,
    color: color as SessionColor,
    initialCountdownSeconds: initialCountdownSeconds as number,
    finalPhaseSeconds: finalPhaseSeconds as number,
    exercise: {
      name: exerciseName as string,
      durationSeconds: durationSeconds as number,
      instruction: instruction === undefined ? null : instruction,
    },
  });
}
