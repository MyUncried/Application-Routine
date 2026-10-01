/**
 * Contrat d'erreur métier du Domaine Catégorie (T01-S09), même patron que
 * `@/domain/sessions/errors.ts` (§12.5) : les validations ne lèvent jamais
 * d'exception, elles retournent un `CategoryValidationResult`. Un type
 * dédié, distinct de `ValidationResult`/`ValidationViolation` (sessions) —
 * le Domaine Catégorie reste un module séparé, jamais couplé au Domaine
 * Séance par un type d'erreur partagé.
 */

export type CategoryValidationErrorCode = "REQUIRED" | "TOO_LONG" | "INVALID_COLOR";

export type CategoryValidationField = "category.name" | "category.color";

export type CategoryValidationDetails = {
  readonly max?: number;
};

export type CategoryValidationViolation = {
  readonly code: CategoryValidationErrorCode;
  readonly field: CategoryValidationField;
  readonly details?: CategoryValidationDetails;
};

export type CategoryValidationSuccess<T> = {
  readonly ok: true;
  readonly value: T;
};

export type CategoryValidationFailure = {
  readonly ok: false;
  readonly violations: readonly CategoryValidationViolation[];
};

export type CategoryValidationResult<T> = CategoryValidationSuccess<T> | CategoryValidationFailure;

export function ok<T>(value: T): CategoryValidationSuccess<T> {
  return { ok: true, value };
}

export function fail(violations: readonly CategoryValidationViolation[]): CategoryValidationFailure {
  return { ok: false, violations };
}

export class CategoryValidationError extends Error {
  readonly violations: readonly CategoryValidationViolation[];

  constructor(violations: readonly CategoryValidationViolation[]) {
    super("CATEGORY_VALIDATION_FAILED");
    this.name = "CategoryValidationError";
    this.violations = violations;
  }
}
