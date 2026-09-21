/**
 * Domaine `ActivityDefinition` (V2-CAT-01) : racine persistante autonome
 * d'une Activité du Catalogue — distincte d'une `SessionActivity` (celle-ci
 * reste rattachée à une Séance et porte sa position structurelle,
 * `SessionDraft.ts`). Une `ActivityDefinition` ne porte aucune position de
 * Composition ; sa copie vers un brouillon de Séance (`toDraftExercise`) est
 * ponctuelle et indépendante — les modifications ultérieures de l'une
 * n'affectent jamais l'autre.
 *
 * Fonctions pures, indépendantes de React et SQLite (même politique que
 * `@/domain/sessions`). Réutilise les validateurs déjà exportés par
 * `@/domain/sessions/validation` (mêmes bornes que l'Activité de Séance :
 * nom `1..80`, description `..1000`, durée/pause/récupération `..5999`,
 * répétitions/séries `1..99`) plutôt que de les dupliquer.
 */

import {
  createExerciseDraft,
  type SessionDraftExercise,
} from "@/domain/sessions/SessionDraft";
import type { ExerciseExecutionMode } from "@/domain/sessions/Session";
import {
  DEFAULT_ACTIVITY_TYPE,
  DEFAULT_SIDE_MODE,
  DEFAULT_STRUCTURAL_POSITION,
} from "@/domain/sessions/defaults";
import { isSideMode, type SideMode } from "@/domain/sessions/sideMode";
import {
  validateExerciseDurationSeconds,
  validateExerciseName,
  validateInstruction,
  validatePauseSeconds,
  validateRecoverySeconds,
  validateRepetitionCount,
  validateSeriesCount,
} from "@/domain/sessions/validation";

export type ActivityDefinitionExecutionMode = ExerciseExecutionMode;

/** Une `ActivityDefinition` persistée (Catalogue des activités). */
export type ActivityDefinition = {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly executionMode: ActivityDefinitionExecutionMode;
  /** Non nul uniquement en mode `DURATION`. */
  readonly durationSeconds: number | null;
  /** Non nul uniquement en mode `REPETITIONS`. */
  readonly repetitionCount: number | null;
  readonly seriesCount: number;
  readonly pauseSeconds: number;
  readonly recoverySeconds: number;
  readonly bodyZoneIds: readonly string[];
  readonly sideMode: SideMode;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type CreateActivityDefinitionInput = {
  readonly name: string;
  readonly description: string | null;
  readonly executionMode: ActivityDefinitionExecutionMode;
  readonly durationSeconds: number | null;
  readonly repetitionCount: number | null;
  readonly seriesCount: number;
  readonly pauseSeconds: number;
  readonly recoverySeconds: number;
  readonly bodyZoneIds: readonly string[];
  readonly sideMode?: SideMode;
};

export type UpdateActivityDefinitionInput = CreateActivityDefinitionInput;

export type ActivityDefinitionValidationCode =
  | "REQUIRED"
  | "TOO_LONG"
  | "OUT_OF_RANGE"
  | "NOT_INTEGER"
  | "UNRECOGNIZED"
  | "MUST_BE_ABSENT";

export type ActivityDefinitionValidationField =
  | "activityDefinition.name"
  | "activityDefinition.description"
  | "activityDefinition.executionMode"
  | "activityDefinition.durationSeconds"
  | "activityDefinition.repetitionCount"
  | "activityDefinition.seriesCount"
  | "activityDefinition.pauseSeconds"
  | "activityDefinition.recoverySeconds";

export type ActivityDefinitionValidationViolation = {
  readonly code: ActivityDefinitionValidationCode;
  readonly field: ActivityDefinitionValidationField;
  readonly details?: { readonly min?: number; readonly max?: number };
};

export type ActivityDefinitionValidationResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly violations: readonly ActivityDefinitionValidationViolation[] };

const EXECUTION_MODES: readonly ActivityDefinitionExecutionMode[] = [
  "DURATION",
  "REPETITIONS",
  "TO_FAILURE",
];

/**
 * Valide et normalise une entrée de création/modification d'une
 * `ActivityDefinition`. Agrège toutes les violations déterminables (jamais
 * seulement la première) et ne lève jamais d'exception — même contrat que
 * `validateCreateSessionInput` (`@/domain/sessions/SessionDraft`).
 */
export function validateActivityDefinitionInput(
  input: CreateActivityDefinitionInput,
): ActivityDefinitionValidationResult<CreateActivityDefinitionInput> {
  const violations: ActivityDefinitionValidationViolation[] = [];

  const nameResult = validateExerciseName(input.name);
  const name = nameResult.ok ? nameResult.value : undefined;
  if (!nameResult.ok) {
    violations.push({ code: "REQUIRED", field: "activityDefinition.name" });
  }

  const descriptionResult = validateInstruction(input.description);
  const description = descriptionResult.ok ? descriptionResult.value : null;
  if (!descriptionResult.ok) {
    violations.push({ code: "TOO_LONG", field: "activityDefinition.description" });
  }

  if (!EXECUTION_MODES.includes(input.executionMode)) {
    violations.push({ code: "UNRECOGNIZED", field: "activityDefinition.executionMode" });
  }

  let durationSeconds: number | null = null;
  let repetitionCount: number | null = null;

  if (input.executionMode === "DURATION") {
    if (input.durationSeconds === null) {
      violations.push({ code: "REQUIRED", field: "activityDefinition.durationSeconds" });
    } else {
      const durationResult = validateExerciseDurationSeconds(input.durationSeconds);
      if (durationResult.ok) {
        durationSeconds = durationResult.value;
      } else {
        violations.push({ code: "OUT_OF_RANGE", field: "activityDefinition.durationSeconds" });
      }
    }
    if (input.repetitionCount !== null) {
      violations.push({ code: "MUST_BE_ABSENT", field: "activityDefinition.repetitionCount" });
    }
  } else if (input.executionMode === "REPETITIONS") {
    if (input.repetitionCount === null) {
      violations.push({ code: "REQUIRED", field: "activityDefinition.repetitionCount" });
    } else {
      const repetitionResult = validateRepetitionCount(input.repetitionCount);
      if (repetitionResult.ok) {
        repetitionCount = repetitionResult.value;
      } else {
        violations.push({ code: "OUT_OF_RANGE", field: "activityDefinition.repetitionCount" });
      }
    }
    if (input.durationSeconds !== null) {
      violations.push({ code: "MUST_BE_ABSENT", field: "activityDefinition.durationSeconds" });
    }
  } else if (input.executionMode === "TO_FAILURE") {
    if (input.durationSeconds !== null) {
      violations.push({ code: "MUST_BE_ABSENT", field: "activityDefinition.durationSeconds" });
    }
    if (input.repetitionCount !== null) {
      violations.push({ code: "MUST_BE_ABSENT", field: "activityDefinition.repetitionCount" });
    }
  }

  const seriesResult = validateSeriesCount(input.seriesCount);
  if (!seriesResult.ok) {
    violations.push({ code: "OUT_OF_RANGE", field: "activityDefinition.seriesCount" });
  }

  const pauseResult = validatePauseSeconds(input.pauseSeconds);
  if (!pauseResult.ok) {
    violations.push({ code: "OUT_OF_RANGE", field: "activityDefinition.pauseSeconds" });
  }

  const recoveryResult = validateRecoverySeconds(input.recoverySeconds);
  if (!recoveryResult.ok) {
    violations.push({ code: "OUT_OF_RANGE", field: "activityDefinition.recoverySeconds" });
  }

  if (violations.length > 0) {
    return { ok: false, violations };
  }

  return {
    ok: true,
    value: {
      name: name as string,
      description,
      executionMode: input.executionMode,
      durationSeconds,
      repetitionCount,
      seriesCount: seriesResult.ok ? seriesResult.value : input.seriesCount,
      pauseSeconds: pauseResult.ok ? pauseResult.value : input.pauseSeconds,
      recoverySeconds: recoveryResult.ok ? recoveryResult.value : input.recoverySeconds,
      bodyZoneIds: input.bodyZoneIds,
      sideMode: isSideMode(input.sideMode) ? input.sideMode : DEFAULT_SIDE_MODE,
    },
  };
}

/**
 * Brouillon d'`ActivityDefinition` vide, destiné à l'écran de création du
 * Catalogue — mêmes valeurs par défaut que `createExerciseDraft` (Composition),
 * sans `id`/`type`/`structuralPosition` (non applicables à une définition).
 */
export function createEmptyActivityDefinitionDraft(): CreateActivityDefinitionInput {
  const exerciseDraft = createExerciseDraft("draft");
  return {
    name: exerciseDraft.name,
    description: exerciseDraft.instruction,
    executionMode: exerciseDraft.executionMode,
    durationSeconds: exerciseDraft.durationSeconds,
    repetitionCount: exerciseDraft.repetitionCount,
    seriesCount: exerciseDraft.seriesCount,
    pauseSeconds: exerciseDraft.pauseSeconds,
    recoverySeconds: exerciseDraft.recoverySeconds,
    bodyZoneIds: exerciseDraft.bodyZoneIds,
    sideMode: exerciseDraft.sideMode,
  };
}

/** Projette une `ActivityDefinition` persistée vers l'entrée éditable de l'éditeur (préremplissage exact, modification). */
export function activityDefinitionToInput(
  definition: ActivityDefinition,
): CreateActivityDefinitionInput {
  return {
    name: definition.name,
    description: definition.description,
    executionMode: definition.executionMode,
    durationSeconds: definition.durationSeconds,
    repetitionCount: definition.repetitionCount,
    seriesCount: definition.seriesCount,
    pauseSeconds: definition.pauseSeconds,
    recoverySeconds: definition.recoverySeconds,
    bodyZoneIds: definition.bodyZoneIds,
    sideMode: definition.sideMode,
  };
}

/**
 * Copie INDÉPENDANTE d'une `ActivityDefinition` vers une `SessionActivity`
 * locale (`SessionDraftExercise`) — « Une activité existante » depuis la
 * Composition (plan §4.4/§6.1). La copie porte un NOUVEL identifiant
 * (`newId`, fourni par l'appelant — ce module reste pur, sans
 * `expo-crypto`), reprend toutes les propriétés métier applicables et une
 * position structurelle par défaut (`DEFAULT_STRUCTURAL_POSITION`) — la zone
 * réelle d'insertion est décidée au moment de l'ajout par
 * `appendActivityAfterLastDisplayed` (`composition.ts`), jamais ici. Les
 * modifications ultérieures de la définition et de la copie restent
 * indépendantes : aucune référence n'est conservée vers `definition.id`.
 */
export function activityDefinitionToDraftExercise(
  definition: ActivityDefinition,
  newId: string,
): SessionDraftExercise {
  return {
    id: newId,
    type: DEFAULT_ACTIVITY_TYPE,
    structuralPosition: DEFAULT_STRUCTURAL_POSITION,
    name: definition.name,
    executionMode: definition.executionMode,
    durationSeconds: definition.durationSeconds,
    repetitionCount: definition.repetitionCount,
    seriesCount: definition.seriesCount,
    pauseSeconds: definition.pauseSeconds,
    recoverySeconds: definition.recoverySeconds,
    instruction: definition.description,
    bodyZoneIds: [...definition.bodyZoneIds],
    sideMode: definition.sideMode,
  };
}
