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
  | "INVALID_COLOR"
  /** T01-S10 : valeur d'énumération non reconnue (mode d'exécution, type d'Activité, position structurelle). */
  | "UNRECOGNIZED"
  /** T01-S10 : champ qui doit rester absent pour le mode/type courant (une cible Durée ou Répétitions en `TO_FAILURE`, des Zones corporelles sur une Récupération). */
  | "MUST_BE_ABSENT"
  /** T01-S10 : identifiant d'Activité en doublon dans un même agrégat de modification. */
  | "DUPLICATE";

export type ValidationField =
  | "session.name"
  | "session.initialCountdownSeconds"
  | "session.finalPhaseSeconds"
  /** T01-S10 : répétition du Circuit (`1..99`, D-058). */
  | "session.tourRepeatCount"
  /** T01-S10 : identifiant source d'une modification bout en bout (`UpdateSessionInput.sourceSessionId`). */
  | "session.sourceSessionId"
  | "exercise.name"
  | "exercise.durationSeconds"
  | "exercise.instruction"
  | "exercise.repetitionCount"
  | "exercise.seriesCount"
  | "exercise.pauseSeconds"
  /** V2-PRE-1 (plan §3.2) : récupération post-exercice de l'occurrence, obligatoire et indépendante de la définition (`0..5999` s). Remplace l'ancien champ historique `exercise.recoverySeconds`. */
  | "exercise.postActivityRecoverySeconds"
  /** T01-S10 : mode d'exécution d'un Exercice (`DURATION` / `REPETITIONS` / `TO_FAILURE`). */
  | "exercise.executionMode"
  /** T01-S10 : type d'une Activité (`EXERCISE` / `RECOVERY`). */
  | "activity.type"
  /** T01-S10 : position structurelle d'une Activité (`BEFORE_TOUR` / `IN_TOUR` / `AFTER_TOUR`). */
  | "activity.structuralPosition"
  /** T01-S10 : rang d'ordre d'une Activité dans sa zone structurelle. */
  | "activity.position"
  /** T01-S10 : identifiant d'une Activité transmise à la modification. */
  | "activity.id"
  /** T01-S10 : nom d'une Activité (Exercice ou Récupération) de l'agrégat de modification. */
  | "activity.name"
  /** T01-S10 : Zones corporelles d'une Activité — doivent rester absentes sur une Récupération. */
  | "activity.bodyZoneIds"
  /** T01-S10 : durée d'une Récupération (toujours chronométrée). */
  | "recovery.durationSeconds";

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
