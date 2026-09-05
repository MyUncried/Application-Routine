/**
 * Contrat d'erreur métier du Domaine (§12.5).
 *
 * Les fonctions de validation du Domaine ne lèvent jamais d'exception : elles
 * retournent un `ValidationResult`, discriminé par `ok`. Une violation ne
 * porte qu'un code stable, un champ stable et des détails optionnels — aucune
 * chaîne destinée à l'utilisateur ne doit apparaître ici. La traduction des
 * codes en messages affichables appartient à une couche ultérieure (écran).
 *
 * `SessionValidationError` est le seul type levé — exclusivement par la
 * couche infrastructure (ou un futur `SessionService`), jamais par le
 * Domaine lui-même.
 */

export type ValidationErrorCode =
  | "REQUIRED"
  | "TOO_LONG"
  | "OUT_OF_RANGE"
  | "NOT_INTEGER"
  | "INVALID_COLOR";

export type ValidationField =
  | "session.name"
  | "session.color"
  | "session.initialCountdownSeconds"
  | "session.finalPhaseSeconds"
  | "exercise.name"
  | "exercise.durationSeconds"
  | "exercise.instruction"
  | "exercise.repetitionCount"
  | "exercise.seriesCount"
  | "exercise.pauseSeconds"
  /**
   * T01-S09 : violation portée par une Catégorie personnalisée du brouillon
   * (`SessionDraft.categorySelections`, kind `"NEW"`) lors de l'assemblage
   * final — même limite déjà acceptée pour `exercise.*` sur une collection
   * (aucun index de Catégorie/Activité fautive n'est distingué ici, voir
   * `SessionDraft.ts`) : en pratique non observable, l'écran `Catégories de
   * la séance` ne place jamais dans le brouillon un nom déjà invalide.
   */
  | "category.name";

export type ValidationDetails = {
  readonly min?: number;
  readonly max?: number;
};

export type ValidationViolation = {
  readonly code: ValidationErrorCode;
  readonly field: ValidationField;
  readonly details?: ValidationDetails;
};

export type ValidationSuccess<T> = {
  readonly ok: true;
  readonly value: T;
};

export type ValidationFailure = {
  readonly ok: false;
  readonly violations: readonly ValidationViolation[];
};

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

export function ok<T>(value: T): ValidationSuccess<T> {
  return { ok: true, value };
}

export function fail(violations: readonly ValidationViolation[]): ValidationFailure {
  return { ok: false, violations };
}

export class SessionValidationError extends Error {
  readonly violations: readonly ValidationViolation[];

  constructor(violations: readonly ValidationViolation[]) {
    super("SESSION_VALIDATION_FAILED");
    this.name = "SessionValidationError";
    this.violations = violations;
  }
}
