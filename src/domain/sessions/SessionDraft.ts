/**
 * Brouillon local de Séance (T01) : représentation en mémoire, potentiellement
 * incomplète, distincte de `CreateSessionInput`. « Le brouillon reste local
 * jusqu'à l'enregistrement final » — rien ici ne persiste quoi que ce soit.
 *
 * `toCreateSessionInput` emploie le même contrat de résultat structuré que
 * le reste des validations du Domaine : succès avec un `CreateSessionInput`
 * prêt à persister, ou échec listant **toutes** les violations déterminables
 * (complétude ET contenu, jamais seulement la première catégorie rencontrée).
 * Elle ne réimplémente aucune règle de bornes : elle réutilise les
 * validateurs élémentaires de `validation.ts`, puis délègue l'assemblage
 * final à `validateCreateSessionInput`, qui reste la validation complète de
 * l'entrée persistable. Elle ne lève jamais d'exception.
 */

import type { CreateSessionInput, Session, SessionColor } from "./Session";
import { DEFAULT_SESSION_COLOR } from "./Session";
import {
  DEFAULT_EXERCISE_DURATION_SECONDS,
  DEFAULT_FINAL_PHASE_SECONDS,
  DEFAULT_INITIAL_COUNTDOWN_SECONDS,
} from "./defaults";
import { fail, type ValidationResult, type ValidationViolation } from "./errors";
import {
  validateCreateSessionInput,
  validateExerciseDurationSeconds,
  validateExerciseName,
  validateFinalPhaseSeconds,
  validateInitialCountdownSeconds,
  validateInstruction,
  validateSessionColor,
  validateSessionName,
} from "./validation";

export type SessionDraftExercise = {
  readonly name: string;
  readonly durationSeconds: number | null;
  readonly instruction: string | null;
};

export type SessionDraft = {
  readonly name: string;
  readonly color: SessionColor;
  readonly initialCountdownSeconds: number;
  readonly finalPhaseSeconds: number;
  readonly exercise: SessionDraftExercise | null;
};

/** Brouillon de Séance vide, initialisé avec les valeurs canoniques par défaut (aucun Exercice défini). */
export function createEmptyDraft(): SessionDraft {
  return {
    name: "",
    color: DEFAULT_SESSION_COLOR,
    initialCountdownSeconds: DEFAULT_INITIAL_COUNTDOWN_SECONDS,
    finalPhaseSeconds: DEFAULT_FINAL_PHASE_SECONDS,
    exercise: null,
  };
}

/**
 * Brouillon d'Exercice vide, destiné au futur parcours « Ajouter une
 * activité » : nom vide, durée initiale canonique (`DEFAULT_EXERCISE_DURATION_SECONDS`),
 * aucune consigne.
 */
export function createExerciseDraft(): SessionDraftExercise {
  return {
    name: "",
    durationSeconds: DEFAULT_EXERCISE_DURATION_SECONDS,
    instruction: null,
  };
}

/**
 * Convertit une `Session` persistée vers un `SessionDraft` modifiable —
 * l'inverse de `toCreateSessionInput`. Fonction pure, aucune dépendance
 * React ou SQLite. Copie sans perte les sept champs éditables (nom,
 * couleur, phases, nom/durée/consigne de l'Exercice) ; les champs
 * d'identité et d'audit (`id`, `ownerId`, `status`, `createdAt`,
 * `updatedAt`, identifiants et `repeatCount` de `cycle`/`tour`, et sur
 * l'Exercice `id`/`type`/`executionMode`/`structuralPosition`/`position`/
 * `repetitionCount`/`seriesCount`/`pauseSeconds`) ne sont volontairement
 * pas repris : `SessionDraft` ne les modélise pas, et `sessionId` est
 * transmis séparément lors de l'enregistrement d'une modification.
 */
export function toSessionDraft(session: Session): SessionDraft {
  return {
    name: session.name,
    color: session.color,
    initialCountdownSeconds: session.initialCountdownSeconds,
    finalPhaseSeconds: session.finalPhaseSeconds,
    exercise: {
      name: session.cycle.tour.exercise.name,
      durationSeconds: session.cycle.tour.exercise.durationSeconds,
      instruction: session.cycle.tour.exercise.instruction,
    },
  };
}

function collectViolations(
  ...results: readonly ValidationResult<unknown>[]
): readonly ValidationViolation[] {
  const violations: ValidationViolation[] = [];
  for (const result of results) {
    if (!result.ok) {
      violations.push(...result.violations);
    }
  }
  return violations;
}

/**
 * Valide et convertit un brouillon vers un `CreateSessionInput` persistable.
 *
 * Agrège systématiquement **toutes** les violations déterminables — champs
 * de la Séance et champs de l'Exercice, complétude et contenu confondus —
 * avant de retourner un échec ; ne s'arrête jamais à la première catégorie
 * de défaut rencontrée. Ne délègue l'assemblage final à
 * `validateCreateSessionInput` que lorsque plus aucune violation n'a été
 * relevée.
 */
export function toCreateSessionInput(draft: SessionDraft): ValidationResult<CreateSessionInput> {
  const violations: ValidationViolation[] = [
    ...collectViolations(
      validateSessionName(draft.name),
      validateSessionColor(draft.color),
      validateInitialCountdownSeconds(draft.initialCountdownSeconds),
      validateFinalPhaseSeconds(draft.finalPhaseSeconds),
    ),
  ];

  if (draft.exercise === null) {
    violations.push(
      { code: "REQUIRED", field: "exercise.name" },
      { code: "REQUIRED", field: "exercise.durationSeconds" },
    );
  } else {
    violations.push(...collectViolations(validateExerciseName(draft.exercise.name)));

    if (draft.exercise.durationSeconds === null) {
      violations.push({ code: "REQUIRED", field: "exercise.durationSeconds" });
    } else {
      violations.push(
        ...collectViolations(validateExerciseDurationSeconds(draft.exercise.durationSeconds)),
      );
    }

    violations.push(...collectViolations(validateInstruction(draft.exercise.instruction)));
  }

  if (violations.length > 0) {
    return fail(violations);
  }

  // Every individual check above passed: the exercise and its duration are
  // necessarily present here. Final assembly still goes through
  // `validateCreateSessionInput`, the single complete validator of a
  // persistable entry.
  const exercise = draft.exercise as SessionDraftExercise & { durationSeconds: number };

  return validateCreateSessionInput({
    name: draft.name,
    color: draft.color,
    initialCountdownSeconds: draft.initialCountdownSeconds,
    finalPhaseSeconds: draft.finalPhaseSeconds,
    exercise: {
      name: exercise.name,
      durationSeconds: exercise.durationSeconds,
      instruction: exercise.instruction,
    },
  });
}
